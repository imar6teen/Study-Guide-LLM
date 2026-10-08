import { LLMError, parseLLMError } from "../errors";
import useLLMStore from "../hooks/useLLMStore";
import type { LLMProvider, LLMSettings } from "../types/llm";

const BASE = import.meta.env.VITE_BACKEND_URL;

/** Build the BYOK headers expected by the backend. */
export function toLLMHeaders(settings: LLMSettings | null): Record<string, string> {
  if (!settings) return {};
  return {
    "X-LLM-Provider": settings.provider,
    "X-LLM-API-Key": settings.apiKey,
    "X-LLM-Model": settings.model,
  };
}

/** Headers from the currently saved settings. */
export function llmHeaders(): Record<string, string> {
  return toLLMHeaders(useLLMStore.getState().settings);
}

export async function fetchProviders(): Promise<LLMProvider[]> {
  const res = await fetch(`${BASE}/llm/providers`);
  if (!res.ok) throw new Error(`Failed to load providers: ${res.statusText}`);
  return res.json();
}

/** Ask the backend to make a tiny test call with these credentials. */
export async function validateLLMSettings(settings: LLMSettings): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${BASE}/llm/validate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...toLLMHeaders(settings),
      },
      body: JSON.stringify({
        provider: settings.provider,
        api_key: settings.apiKey,
        model: settings.model,
      }),
    });
  } catch (err) {
    throw new Error("Could not reach the server.", { cause: err });
  }

  if (res.ok) return;

  const llmError = await parseLLMError(res);
  if (llmError) throw llmError;
  throw new LLMError("Validation failed. Please try again.", res.status, "llm_provider_error");
}
