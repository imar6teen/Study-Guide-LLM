export type LLMProviderId = "openai" | "google" | "anthropic" | "groq";

export interface LLMProvider {
  id: LLMProviderId;
  label: string;
  default_model: string;
  suggested_models: string[];
  key_url: string;
}

export interface LLMSettings {
  provider: LLMProviderId;
  model: string;
  apiKey: string;
}

export type LLMErrorCode =
  | "llm_credentials_missing"
  | "llm_provider_unsupported"
  | "llm_model_not_found"
  | "llm_invalid_key"
  | "llm_rate_limited"
  | "llm_provider_error";
