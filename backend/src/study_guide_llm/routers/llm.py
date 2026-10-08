from typing import Annotated
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, Header
from langchain_core.messages import HumanMessage

from study_guide_llm.llm import (
    PROVIDERS,
    LLMSettings,
    build_chat_model,
    get_llm_settings,
    to_http_exception,
)

class ValidatePayload(BaseModel):
    provider: str | None = None
    api_key: str | None = None
    model: str | None = None

router = APIRouter(prefix="/llm", tags=["llm"])


@router.get("/providers")
def list_providers():
    """Providers the frontend can offer on the BYOK onboarding screen."""
    return [
        {
            "id": p.id.value,
            "label": p.label,
            "default_model": p.default_model,
            "suggested_models": list(p.suggested_models),
            "key_url": p.key_url,
        }
        for p in PROVIDERS.values()
    ]


@router.post("/validate")
def validate_key(
    x_llm_provider: Annotated[str | None, Header()] = None,
    x_llm_api_key: Annotated[str | None, Header()] = None,
    x_llm_model: Annotated[str | None, Header()] = None,
    body: ValidatePayload | None = None,
):
    """Check the provider/key/model sent in headers or JSON body with a tiny call.

    The key is only used for this request and is never stored.
    """
    provider_val = x_llm_provider or (body.provider if body else None)
    api_key_val = x_llm_api_key or (body.api_key if body else None)
    model_val = x_llm_model or (body.model if body else None)
    print(f"[LLM VALIDATE REQUEST] provider={provider_val}, model={model_val}, has_key={bool(api_key_val)}")
    settings = get_llm_settings(
        x_llm_provider=provider_val,
        x_llm_api_key=api_key_val,
        x_llm_model=model_val,
    )

    try:
        llm = build_chat_model(settings, temperature=0)
        llm.invoke([HumanMessage(content="Reply with the single word: OK")])
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print("=" * 60)
        print(f"[LLM VALIDATION ERROR] Provider: {settings.provider.value}, Model: {settings.model}")
        print(f"Exception Type: {type(e).__name__}")
        print(f"Exception Message: {e}")
        traceback.print_exc()
        print("=" * 60)
        raise to_http_exception(e)

    return {"valid": True, "provider": settings.provider.value, "model": settings.model}
