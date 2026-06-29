/**
 * Options page logic — a full-page mirror of the popup's settings, plus the
 * first-run welcome banner.
 */

import { VERSION } from "@promptos/core";
import { loadSettings, saveSettings, type Settings } from "../shared/settings.js";

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

async function init(): Promise<void> {
  const settings = await loadSettings();

  const enhance = $<HTMLInputElement>("enhance");
  const showInlineButton = $<HTMLInputElement>("showInlineButton");
  const autoApply = $<HTMLInputElement>("autoApply");

  enhance.checked = settings.enhance;
  showInlineButton.checked = settings.showInlineButton;
  autoApply.checked = settings.autoApply;

  const persist = async (): Promise<void> => {
    const next: Settings = {
      enhance: enhance.checked,
      showInlineButton: showInlineButton.checked,
      autoApply: autoApply.checked,
    };
    await saveSettings(next);
  };

  for (const el of [enhance, showInlineButton, autoApply]) {
    el.addEventListener("change", persist);
  }

  $<HTMLElement>("version").textContent = `v${VERSION}`;

  if (new URLSearchParams(location.search).has("welcome")) {
    $<HTMLElement>("welcome").classList.remove("hidden");
  }
}

void init();
