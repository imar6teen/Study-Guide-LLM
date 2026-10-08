import type { LLMErrorCode } from "../types/llm";

/** Error returned by the backend's BYOK layer (`detail.code`). */
class LLMError extends Error {
  public readonly status: number;
  public readonly code: LLMErrorCode;

  constructor(message: string, status: number, code: LLMErrorCode) {
    super(message);
    this.name = "LLMError";
    this.status = status;
    this.code = code;
  }

  /** True when the user must (re-)enter provider / key / model. */
  get needsSettings(): boolean {
    return (
      this.code === "llm_credentials_missing" ||
      this.code === "llm_provider_unsupported" ||
      this.code === "llm_invalid_key" ||
      this.code === "llm_model_not_found"
    );
  }
}

export default LLMError;

/** Returns an LLMError if the response body carries a BYOK error code. */
export async function parseLLMError(res: Response): Promise<LLMError | null> {
  try {
    const body = await res.clone().json();
    const detail = body?.detail;
    if (detail && typeof detail === "object" && typeof detail.code === "string" && detail.code.startsWith("llm_")) {
      return new LLMError(detail.message ?? "LLM error", res.status, detail.code);
    }
  } catch {
    /* not JSON */
  }
  return null;
}
