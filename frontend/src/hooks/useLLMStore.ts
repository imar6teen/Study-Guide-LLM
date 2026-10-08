import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LLMSettings } from "../types/llm";

type State = {
  settings: LLMSettings | null;
  /** Whether the settings dialog is open. */
  isDialogOpen: boolean;
  /** Message shown in the dialog (e.g. "your key was rejected"). */
  dialogReason: string | null;
};

type Action = {
  setSettings: (settings: LLMSettings) => void;
  clearSettings: () => void;
  openDialog: (reason?: string | null) => void;
  closeDialog: () => void;
};

/**
 * BYOK settings. Persisted in this browser's localStorage only —
 * the backend never stores the key.
 */
const useLLMStore = create<State & Action>()(
  persist(
    (set) => ({
      settings: null,
      isDialogOpen: false,
      dialogReason: null,
      setSettings: (settings) =>
        set(() => ({ settings, isDialogOpen: false, dialogReason: null })),
      clearSettings: () => set(() => ({ settings: null })),
      openDialog: (reason = null) =>
        set(() => ({ isDialogOpen: true, dialogReason: reason })),
      closeDialog: () => set(() => ({ isDialogOpen: false, dialogReason: null })),
    }),
    {
      name: "study-guide-llm-settings",
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);

export default useLLMStore;
