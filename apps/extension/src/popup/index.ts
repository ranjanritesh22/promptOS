/**
 * Popup logic.
 *
 * The popup is a standalone optimizer (paste → optimize → copy/apply) and the
 * quickest place to change settings. It can also pull text from, and apply to,
 * the active chat tab via the content script.
 */

import { optimize, VERSION, type OptimizeResult } from "@promptos/core";
import { loadSettings, saveSettings, type Settings } from "../shared/settings.js";

function $<T extends HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} not found`);
  return el as T;
}

const els = {
  input: $<HTMLTextAreaElement>("input"),
  optimize: $<HTMLButtonElement>("optimize"),
  pull: $<HTMLButtonElement>("pull"),
  result: $<HTMLElement>("result"),
  output: $<HTMLTextAreaElement>("output"),
  statTokens: $<HTMLElement>("stat-tokens"),
  statSaved: $<HTMLElement>("stat-saved"),
  copy: $<HTMLButtonElement>("copy"),
  apply: $<HTMLButtonElement>("apply"),
  changesWrap: $<HTMLDetailsElement>("changes-wrap"),
  changesSummary: $<HTMLElement>("changes-summary"),
  changesList: $<HTMLUListElement>("changes-list"),
  intent: $<HTMLElement>("intent"),
  enhance: $<HTMLInputElement>("enhance"),
  showInlineButton: $<HTMLInputElement>("showInlineButton"),
  autoApply: $<HTMLInputElement>("autoApply"),
  openOptions: $<HTMLAnchorElement>("open-options"),
  version: $<HTMLElement>("version"),
};

let settings: Settings;
let lastResult: OptimizeResult | null = null;

function renderResult(result: OptimizeResult): void {
  lastResult = result;
  els.result.classList.remove("hidden");
  els.output.value = result.optimized;

  els.intent.textContent =
    result.intent.confidence > 0 ? `Intent: ${result.intent.label}` : "Intent: general";

  const { stats } = result;
  els.statTokens.textContent = `${stats.originalTokens} → ${stats.optimizedTokens} tokens`;
  const sign = stats.saved >= 0 ? "−" : "+";
  els.statSaved.textContent = `${sign}${Math.abs(stats.saved)} (${stats.savedPercent}%)`;
  els.statSaved.className = `pill ${stats.saved > 0 ? "pill--good" : stats.saved < 0 ? "pill--warn" : ""}`;

  els.changesList.innerHTML = "";
  if (result.changes.length > 0) {
    els.changesWrap.classList.remove("hidden");
    els.changesSummary.textContent = `${result.changes.length} change${result.changes.length === 1 ? "" : "s"}`;
    for (const c of result.changes) {
      const li = document.createElement("li");
      li.textContent = c.count > 1 ? `${c.description} (×${c.count})` : c.description;
      els.changesList.appendChild(li);
    }
  } else {
    els.changesWrap.classList.add("hidden");
  }
}

function runOptimize(): void {
  const text = els.input.value.trim();
  if (!text) {
    els.input.focus();
    return;
  }
  renderResult(optimize(text, { enhance: settings.enhance }));
}

async function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function pullFromPage(): Promise<void> {
  const tab = await getActiveTab();
  if (!tab?.id) return;
  try {
    const res = await chrome.tabs.sendMessage(tab.id, { type: "promptos:read-active" });
    if (res?.text) {
      els.input.value = res.text;
      runOptimize();
    } else {
      els.pull.textContent = "No text found";
      setTimeout(() => (els.pull.textContent = "⤓ From page"), 1400);
    }
  } catch {
    els.pull.textContent = "Open a chat first";
    setTimeout(() => (els.pull.textContent = "⤓ From page"), 1400);
  }
}

async function applyToPage(): Promise<void> {
  if (!lastResult) return;
  const tab = await getActiveTab();
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "promptos:apply",
      text: lastResult.optimized,
    });
    els.apply.textContent = "Applied!";
    setTimeout(() => (els.apply.textContent = "Apply to chat"), 1200);
  } catch {
    els.apply.textContent = "Open a chat tab";
    setTimeout(() => (els.apply.textContent = "Apply to chat"), 1400);
  }
}

async function persist(): Promise<void> {
  settings = {
    enhance: els.enhance.checked,
    showInlineButton: els.showInlineButton.checked,
    autoApply: els.autoApply.checked,
  };
  await saveSettings(settings);
}

function bindSettings(): void {
  els.enhance.checked = settings.enhance;
  els.showInlineButton.checked = settings.showInlineButton;
  els.autoApply.checked = settings.autoApply;

  for (const el of [els.enhance, els.showInlineButton, els.autoApply]) {
    el.addEventListener("change", persist);
  }
}

async function init(): Promise<void> {
  settings = await loadSettings();
  bindSettings();
  els.version.textContent = `v${VERSION}`;

  els.optimize.addEventListener("click", runOptimize);
  els.input.addEventListener("keydown", (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") runOptimize();
  });
  els.pull.addEventListener("click", pullFromPage);
  els.copy.addEventListener("click", async () => {
    await navigator.clipboard.writeText(els.output.value);
    els.copy.textContent = "Copied!";
    setTimeout(() => (els.copy.textContent = "Copy"), 1200);
  });
  els.apply.addEventListener("click", applyToPage);
  els.openOptions.addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
}

void init();
