/**
 * Content script.
 *
 * Injects a small "Optimize" button anchored to the active chat composer on
 * supported AI sites. Clicking it runs the local optimizer and (depending on
 * settings) either applies the result directly or shows a preview panel with
 * before/after token counts and the list of changes.
 *
 * All optimization happens locally via @promptos/core — no network calls, no
 * data leaves the page.
 */

import { optimize, type OptimizeResult } from "@promptos/core";
import {
  detectPlatform,
  isEditable,
  readInput,
  writeInput,
  type PlatformAdapter,
} from "../shared/platforms.js";
import { DEFAULT_SETTINGS, loadSettings, onSettingsChanged, type Settings } from "../shared/settings.js";
import { renderPreview } from "./preview.js";

const BUTTON_ID = "promptos-optimize-btn";

let settings: Settings = { ...DEFAULT_SETTINGS };
let adapter: PlatformAdapter = detectPlatform();
let currentInput: HTMLElement | null = null;

/** Find the best composer input on the page right now. */
function findInput(): HTMLElement | null {
  // Prefer the focused element if it is editable (handles multi-input pages).
  const active = document.activeElement;
  if (isEditable(active)) return active;

  for (const selector of adapter.inputSelectors) {
    const el = document.querySelector<HTMLElement>(selector);
    if (isEditable(el)) return el;
  }
  return null;
}

function removeButton(): void {
  document.getElementById(BUTTON_ID)?.remove();
}

function createButton(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.id = BUTTON_ID;
  btn.type = "button";
  btn.className = "promptos-btn";
  btn.title = "Optimize prompt with PromptOS";
  btn.setAttribute("aria-label", "Optimize prompt with PromptOS");
  btn.innerHTML = `<span class="promptos-btn__spark">✦</span><span class="promptos-btn__label">Optimize</span>`;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    runOptimize();
  });
  return btn;
}

/** Position the button at the top-right of the composer. */
function positionButton(btn: HTMLElement, input: HTMLElement): void {
  const rect = input.getBoundingClientRect();
  btn.style.top = `${window.scrollY + rect.top + 8}px`;
  btn.style.left = `${window.scrollX + rect.right - btn.offsetWidth - 12}px`;
}

function ensureButton(): void {
  if (!settings.showInlineButton) {
    removeButton();
    return;
  }
  const input = findInput();
  currentInput = input;
  if (!input) {
    removeButton();
    return;
  }

  let btn = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!btn) {
    btn = createButton();
    document.body.appendChild(btn);
  }
  // Hide the button when the composer is empty to avoid clutter.
  const hasText = readInput(input).trim().length > 0;
  btn.style.display = hasText ? "inline-flex" : "none";
  if (hasText) positionButton(btn, input);
}

function setButtonBusy(busy: boolean): void {
  const btn = document.getElementById(BUTTON_ID) as HTMLButtonElement | null;
  if (!btn) return;
  btn.classList.toggle("promptos-btn--busy", busy);
  btn.disabled = busy;
}

function applyResult(input: HTMLElement, result: OptimizeResult): void {
  writeInput(input, result.optimized);
}

async function runOptimize(): Promise<void> {
  const input = currentInput ?? findInput();
  if (!input) return;
  const text = readInput(input).trim();
  if (!text) return;

  setButtonBusy(true);
  try {
    const result = optimize(text, {
      aggressiveness: settings.aggressiveness,
      restructure: settings.restructure,
      platform: adapter.id,
    });

    if (settings.autoApply) {
      applyResult(input, result);
    } else {
      renderPreview(result, {
        onApply: () => applyResult(input, result),
      });
    }
  } finally {
    setButtonBusy(false);
  }
}

/** Allow the popup to trigger optimization on the active tab. */
function listenForCommands(): void {
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg?.type === "promptos:optimize-active") {
      runOptimize();
      sendResponse({ ok: true });
    } else if (msg?.type === "promptos:read-active") {
      const input = findInput();
      sendResponse({ text: input ? readInput(input).trim() : "" });
    } else if (msg?.type === "promptos:apply" && typeof msg.text === "string") {
      const input = findInput();
      if (input) {
        writeInput(input, msg.text);
        sendResponse({ ok: true });
      } else {
        sendResponse({ ok: false });
      }
    }
    return true;
  });
}

function watchDom(): void {
  // SPAs rebuild the composer constantly; reposition/recreate on any change.
  const observer = new MutationObserver(() => ensureButton());
  observer.observe(document.body, { childList: true, subtree: true });

  for (const evt of ["input", "focusin", "scroll", "resize"] as const) {
    window.addEventListener(evt, () => ensureButton(), { capture: true, passive: true });
  }
}

async function init(): Promise<void> {
  settings = await loadSettings();
  onSettingsChanged((next) => {
    settings = next;
    ensureButton();
  });
  listenForCommands();
  watchDom();
  ensureButton();
}

void init();
