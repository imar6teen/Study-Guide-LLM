import { useEffect, useState, type FormEvent } from "react";
import Icon from "./Icon";
import useLLMStore from "../hooks/useLLMStore";
import { fetchProviders, validateLLMSettings } from "../helpers/llm";
import { LLMError } from "../errors";
import type { LLMProvider, LLMProviderId } from "../types/llm";

// Visual identity per provider (monogram badge gradient)
const PROVIDER_STYLE: Record<LLMProviderId, { mono: string; gradient: string }> = {
  openai: { mono: "AI", gradient: "from-emerald-400/90 to-teal-600/90" },
  google: { mono: "G", gradient: "from-sky-400/90 via-indigo-500/90 to-fuchsia-500/90" },
  anthropic: { mono: "A\\", gradient: "from-orange-300/90 to-amber-700/90" },
  groq: { mono: "gq", gradient: "from-rose-400/90 to-red-600/90" },
};

function maskKey(key: string) {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function LLMSettingsDialog() {
  const isOpen = useLLMStore((s) => s.isDialogOpen);
  const reason = useLLMStore((s) => s.dialogReason);
  const saved = useLLMStore((s) => s.settings);
  const setSettings = useLLMStore((s) => s.setSettings);
  const clearSettings = useLLMStore((s) => s.clearSettings);
  const closeDialog = useLLMStore((s) => s.closeDialog);

  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providerId, setProviderId] = useState<LLMProviderId | null>(null);
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Reset the form from saved settings each time the dialog opens
    setProviderId(saved?.provider ?? null);
    setModel(saved?.model ?? "");
    setApiKey(saved?.apiKey ?? "");
    setShowKey(false);
    setError(null);

    if (providers.length > 0) return;
    setLoadingProviders(true);
    fetchProviders()
      .then((list) => {
        setProviders(list);
        if (!saved && list.length > 0) {
          setProviderId(list[0].id);
          setModel(list[0].default_model);
        }
      })
      .catch(() => setError("Could not load providers. Is the server running?"))
      .finally(() => setLoadingProviders(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDialog();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeDialog]);

  if (!isOpen) return null;

  const provider = providers.find((p) => p.id === providerId) ?? null;

  function selectProvider(p: LLMProvider) {
    if (p.id === providerId) return;
    setProviderId(p.id);
    setModel(p.default_model);
    // A key belongs to one provider: keep it only if switching back to the saved one
    setApiKey(saved?.provider === p.id ? saved.apiKey : "");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!provider || !apiKey.trim()) return;

    const next = {
      provider: provider.id,
      model: model.trim() || provider.default_model,
      apiKey: apiKey.trim(),
    };

    setValidating(true);
    setError(null);
    try {
      await validateLLMSettings(next);
      setSettings(next);
    } catch (err) {
      setError(err instanceof LLMError || err instanceof Error ? err.message : "Validation failed.");
    } finally {
      setValidating(false);
    }
  }

  function handleForget() {
    clearSettings();
    setApiKey("");
    setError(null);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 llm-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="llm-dialog-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => closeDialog()}
        aria-hidden
      />

      <form
        id="llm-settings-form"
        onSubmit={handleSubmit}
        className="llm-dialog-panel relative w-[95vw] sm:w-full max-w-[580px] max-h-[92dvh] overflow-y-auto rounded-2xl border border-outline-variant/40 bg-surface-container-low shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
      >
        {/* Glow accent */}
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-[80%] -translate-x-1/2 rounded-full bg-primary-container/30 blur-3xl" />

        <div className="relative p-md">
          <div className="flex items-start justify-between gap-sm">
            <div className="flex items-center gap-sm">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-container to-secondary-container flex items-center justify-center shadow-lg shadow-primary-container/30">
                <Icon name="key" filled className="text-on-primary-container" />
              </div>
              <div>
                <h2
                  id="llm-dialog-title"
                  className="font-headline-md text-headline-md text-on-surface leading-tight"
                >
                  Connect your AI model
                </h2>
                <p className="text-body-sm text-on-surface-variant">
                  Bring your own key to power the Academic Engine.
                </p>
              </div>
            </div>
            <button
              id="llm-dialog-close"
              type="button"
              onClick={closeDialog}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors"
              aria-label="Close"
            >
              <Icon name="close" size="20px" />
            </button>
          </div>

          {reason && (
            <div className="mt-md flex items-start gap-xs rounded-xl border border-tertiary/30 bg-tertiary-container/20 px-sm py-sm text-body-sm text-on-tertiary-container">
              <Icon name="warning" size="18px" className="text-tertiary mt-[1px]" />
              <span>{reason}</span>
            </div>
          )}

          {/* Provider */}
          <div className="mt-md">
            <div className="font-label-md text-label-md text-on-surface-variant mb-xs uppercase">
              Provider
            </div>
            {loadingProviders ? (
              <div className="grid grid-cols-2 gap-sm">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-[68px] rounded-xl bg-surface-container animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-sm">
                {providers.map((p) => {
                  const active = p.id === providerId;
                  const style = PROVIDER_STYLE[p.id];
                  return (
                    <button
                      id={`llm-provider-${p.id}`}
                      key={p.id}
                      type="button"
                      onClick={() => selectProvider(p)}
                      aria-pressed={active}
                      className={`group relative flex items-center gap-sm rounded-xl border p-sm text-left transition-all duration-200 ${
                        active
                          ? "border-primary/70 bg-secondary-container/40 shadow-[0_0_0_3px_rgba(185,195,255,0.12)]"
                          : "border-outline-variant/40 bg-surface-container hover:border-outline hover:-translate-y-0.5"
                      }`}
                    >
                      <span
                        className={`w-9 h-9 rounded-lg bg-gradient-to-br ${style?.gradient ?? "from-primary to-secondary"} flex items-center justify-center text-[13px] font-bold text-white shadow-md transition-transform group-hover:scale-105`}
                      >
                        {style?.mono ?? p.label[0]}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-on-surface truncate">
                          {p.label}
                        </span>
                        <span className="block text-[11px] text-outline truncate">
                          {p.default_model}
                        </span>
                      </span>
                      {active && (
                        <Icon name="check_circle" filled size="18px" className="text-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Model */}
          <div className="mt-md group">
            <label
              htmlFor="llm-model-input"
              className="block font-label-md text-label-md text-on-surface-variant mb-xs uppercase group-focus-within:text-primary transition-colors"
            >
              Model
            </label>
            <div className="relative">
              <Icon
                name="memory"
                className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary"
              />
              <input
                id="llm-model-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={provider?.default_model ?? "Model name"}
                disabled={!provider || validating}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-sm pl-10 pr-sm font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60"
              />
            </div>
            {provider && (
              <div className="mt-xs flex flex-wrap gap-xs">
                {provider.suggested_models.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setModel(m)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                      model === m
                        ? "border-primary/60 bg-primary/15 text-primary"
                        : "border-outline-variant/50 text-on-surface-variant hover:border-outline hover:text-on-surface"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* API key */}
          <div className="mt-md group">
            <div className="flex items-center justify-between mb-xs">
              <label
                htmlFor="llm-key-input"
                className="block font-label-md text-label-md text-on-surface-variant uppercase group-focus-within:text-primary transition-colors"
              >
                API key
              </label>
              {provider && (
                <a
                  href={provider.key_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-primary hover:underline flex items-center gap-[2px]"
                >
                  Get a {provider.label} key
                  <Icon name="open_in_new" size="14px" />
                </a>
              )}
            </div>
            <div className="relative">
              <Icon
                name="vpn_key"
                className="absolute left-sm top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary"
              />
              <input
                id="llm-key-input"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setError(null);
                }}
                placeholder="Paste your API key"
                disabled={!provider || validating}
                autoComplete="off"
                spellCheck={false}
                className="w-full bg-surface-container border border-outline-variant rounded-lg py-sm pl-10 pr-10 font-mono text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-60"
              />
              <button
                id="llm-key-toggle"
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-sm top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                <Icon name={showKey ? "visibility_off" : "visibility"} size="20px" />
              </button>
            </div>
            <p className="mt-xs flex items-center gap-xs text-[11px] text-outline">
              <Icon name="lock" size="14px" />
              Stored only in this browser and sent to the server with each request. Never saved on our side.
            </p>
          </div>

          {error && (
            <div
              id="llm-dialog-error"
              className="mt-md flex items-start gap-xs rounded-xl border border-error/30 bg-error-container/30 px-sm py-sm text-body-sm text-on-error-container llm-shake"
            >
              <Icon name="error" size="18px" className="text-error mt-[1px]" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-md flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-sm">
            <div className="text-[12px] text-outline min-h-[20px]">
              {saved && (
                <span className="flex items-center gap-xs">
                  Current: {saved.provider} · {saved.model} · {maskKey(saved.apiKey)}
                  <button
                    id="llm-forget-key"
                    type="button"
                    onClick={handleForget}
                    className="ml-xs text-error hover:underline"
                  >
                    Forget
                  </button>
                </span>
              )}
            </div>
            <button
              id="llm-save-button"
              type="submit"
              disabled={!provider || !apiKey.trim() || validating}
              className="relative overflow-hidden flex items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm font-semibold text-on-primary shadow-md transition-all hover:shadow-lg hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validating ? (
                <>
                  <span className="w-4 h-4 animate-spin rounded-full border-2 border-on-primary border-t-transparent" />
                  Verifying…
                </>
              ) : (
                <>
                  <Icon name="verified" size="18px" filled />
                  Verify &amp; save
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default LLMSettingsDialog;
