/**
 * Background service worker (MV3).
 *
 * PromptOS is local-first, so the worker is intentionally thin: it just seeds
 * default settings on install and opens the options page on first run.
 */

import { DEFAULT_SETTINGS, loadSettings, saveSettings } from "../shared/settings.js";

chrome.runtime.onInstalled.addListener(async (details) => {
  // Persist defaults so other surfaces always read a complete object.
  const current = await loadSettings();
  await saveSettings({ ...DEFAULT_SETTINGS, ...current });

  if (details.reason === "install") {
    try {
      await chrome.tabs.create({ url: chrome.runtime.getURL("options.html?welcome=1") });
    } catch {
      /* opening a tab can fail in some contexts; non-fatal */
    }
  }
});
