/**
 * User settings, persisted in `chrome.storage.sync` so they follow the user
 * across machines. The same shape is read by the content script, popup, and
 * options page.
 */

import type { Aggressiveness } from "@promptos/core";

export interface Settings {
  /** Compression strength. */
  aggressiveness: Aggressiveness;
  /** Reorganize into Role/Context/Task/Constraints/Format sections. */
  restructure: boolean;
  /**
   * Rewrite the prompt into a canonical, intent-specific template
   * (coding / planning / writing / health / ...). Supersedes `restructure`.
   */
  enhance: boolean;
  /** Show the floating Optimize button inside supported chat boxes. */
  showInlineButton: boolean;
  /** Replace text immediately, or show a preview diff first. */
  autoApply: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  aggressiveness: "balanced",
  restructure: false,
  enhance: false,
  showInlineButton: true,
  autoApply: false,
};

const STORAGE_KEY = "promptos.settings";

export async function loadSettings(): Promise<Settings> {
  try {
    const stored = await chrome.storage.sync.get(STORAGE_KEY);
    return { ...DEFAULT_SETTINGS, ...(stored[STORAGE_KEY] as Partial<Settings> | undefined) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEY]: settings });
}

/** Subscribe to settings changes (e.g. so an open chat tab reacts live). */
export function onSettingsChanged(cb: (settings: Settings) => void): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes[STORAGE_KEY]) {
      cb({ ...DEFAULT_SETTINGS, ...(changes[STORAGE_KEY].newValue as Partial<Settings>) });
    }
  });
}
