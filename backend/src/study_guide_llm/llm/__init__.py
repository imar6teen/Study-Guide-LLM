"""Bring-Your-Own-Key (BYOK) LLM provider layer.

The backend never stores user API keys. The frontend keeps the provider, model
and key (e.g. in localStorage) and sends them on every request through these
headers:

    X-LLM-Provider : openai | google | anthropic | groq
    X-LLM-API-Key  : the user's key for that provider
    X-LLM-Model    : (optional) model name, falls back to the provider default

A chat model is built per request and handed to the LangGraph agents through the
runtime context (not the RunnableConfig), so the key is never persisted in the
Postgres checkpoints nor attached to LangSmith trace metadata.
"""
from dataclasses import dataclass
from enum import Enum
from typing import Annotated, Literal

from fastapi import Header, HTTPException, status
from langchain_core.language_models import BaseChatModel
from pydantic import BaseModel, SecretStr


class Provider(str, Enum):
    OPENAI = "openai"
    GOOGLE = "google"
    ANTHROPIC = "anthropic"
    GROQ = "groq"


StructuredMethod = Literal["json_schema", "function_calling"]


@dataclass(frozen=True)
class ProviderInfo:
    id: Provider
    label: str
    default_model: str
    suggested_models: tuple[str, ...]
    # Method used by `with_structured_output`. `function_calling` is the most
    # widely supported one; `json_schema` is used where it is reliably native.
    structured_method: StructuredMethod
    key_url: str


PROVIDERS: dict[Provider, ProviderInfo] = {
    Provider.OPENAI: ProviderInfo(
        id=Provider.OPENAI,
        label="OpenAI",
        default_model="gpt-4.1-mini",
        suggested_models=("gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o"),
        structured_method="json_schema",
        key_url="https://platform.openai.com/api-keys",
    ),
    Provider.GOOGLE: ProviderInfo(
        id=Provider.GOOGLE,
        label="Google Gemini",
        default_model="gemini-2.5-flash",
        suggested_models=("gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.5-pro"),
        structured_method="json_schema",
        key_url="https://aistudio.google.com/apikey",
    ),
    Provider.ANTHROPIC: ProviderInfo(
        id=Provider.ANTHROPIC,
        label="Anthropic",
        default_model="claude-sonnet-4-5",
        suggested_models=("claude-sonnet-4-5", "claude-haiku-4-5", "claude-opus-4-1"),
        structured_method="function_calling",
        key_url="https://console.anthropic.com/settings/keys",
    ),
    Provider.GROQ: ProviderInfo(
        id=Provider.GROQ,
        label="Groq",
        default_model="openai/gpt-oss-120b",
        suggested_models=("openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b", "llama-3.3-70b-versatile"),
        structured_method="function_calling",
        key_url="https://console.groq.com/keys",
    ),
}

TEMPERATURE = 0.9


class LLMSettings(BaseModel):
    provider: Provider
    api_key: SecretStr
    model: str

    def __repr__(self) -> str:  # never leak the key in logs
        return f"LLMSettings(provider={self.provider.value!r}, model={self.model!r})"

    __str__ = __repr__


@dataclass
class LLMContext:
    """Runtime context injected into every LangGraph node."""
    llm: BaseChatModel
    structured_method: StructuredMethod


BROWSER_USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"


def build_chat_model(settings: LLMSettings, **overrides) -> BaseChatModel:
    """Instantiate the LangChain chat model for the given provider."""
    key = settings.api_key.get_secret_value().strip().strip('"').strip("'")
    params = {"model": settings.model, "temperature": TEMPERATURE, **overrides}

    match settings.provider:
        case Provider.OPENAI:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=key,
                default_headers={"User-Agent": BROWSER_USER_AGENT},
                **params
            )
        case Provider.GOOGLE:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                google_api_key=key,
                vertexai=False,
                additional_headers={"User-Agent": BROWSER_USER_AGENT},
                **params
            )
        case Provider.ANTHROPIC:
            from langchain_anthropic import ChatAnthropic
            params.setdefault("max_tokens", 8192)
            return ChatAnthropic(
                api_key=key,
                default_headers={"User-Agent": BROWSER_USER_AGENT},
                **params
            )
        case Provider.GROQ:
            from langchain_groq import ChatGroq
            return ChatGroq(
                api_key=key,
                default_headers={"User-Agent": BROWSER_USER_AGENT},
                **params
            )

    raise ValueError(f"Unsupported provider: {settings.provider}")


def build_llm_context(settings: LLMSettings) -> LLMContext:
    return LLMContext(
        llm=build_chat_model(settings),
        structured_method=PROVIDERS[settings.provider].structured_method,
    )


# ---------------------------------------------------------------------------
# FastAPI dependency
# ---------------------------------------------------------------------------

def get_llm_settings(
    x_llm_provider: Annotated[str | None, Header()] = None,
    x_llm_api_key: Annotated[str | None, Header()] = None,
    x_llm_model: Annotated[str | None, Header()] = None,
) -> LLMSettings:
    """Read the BYOK headers. Raises 400 when they are missing or invalid."""
    if not x_llm_provider or not x_llm_api_key:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "llm_credentials_missing",
                "message": "Missing X-LLM-Provider or X-LLM-API-Key header.",
            },
        )

    try:
        provider = Provider(x_llm_provider.strip().lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "llm_provider_unsupported",
                "message": f"Unsupported provider '{x_llm_provider}'. "
                           f"Use one of: {', '.join(p.value for p in Provider)}.",
            },
        )

    model = (x_llm_model or "").strip() or PROVIDERS[provider].default_model
    return LLMSettings(provider=provider, api_key=SecretStr(x_llm_api_key.strip()), model=model)


# ---------------------------------------------------------------------------
# Error mapping
# ---------------------------------------------------------------------------

def to_http_exception(error: Exception) -> HTTPException:
    """Map provider SDK errors to a clean HTTP error for the frontend."""
    status_code = getattr(error, "status_code", None) or getattr(
        getattr(error, "response", None), "status_code", None
    )
    name = type(error).__name__.lower()
    text = str(error).lower()

    if (
        status_code in (401, 403)
        or "authentication" in name
        or "permissiondenied" in name
        or "unauthorized" in name
        or "api_key_invalid" in text
        or "api key not valid" in text
        or "invalid api key" in text
        or "invalid_api_key" in text
        or "invalid x-api-key" in text
        or "incorrect api key" in text
    ):
        raw_msg = str(error).strip()
        clean_msg = raw_msg[:300] if len(raw_msg) <= 300 else raw_msg[:300] + "..."
        return HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "llm_invalid_key", "message": f"Rejected by {type(error).__name__}: {clean_msg}"},
        )
    if status_code == 404 or "notfound" in name or "model_not_found" in text:
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "llm_model_not_found", "message": "The selected model was not found for this provider."},
        )
    if status_code in (429, 402) or "ratelimit" in name or "resourceexhausted" in name or "quota" in text or "credit" in text:
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={"code": "llm_rate_limited", "message": "Rate limit or quota/credits exceeded on the provider."},
        )

    raw_msg = str(error).strip()
    clean_msg = raw_msg[:200] if len(raw_msg) <= 200 else raw_msg[:200] + "..."
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={"code": "llm_provider_error", "message": f"Provider error: {clean_msg}"},
    )
