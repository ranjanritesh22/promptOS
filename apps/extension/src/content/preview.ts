/**
 * The in-page preview panel shown after optimizing (when auto-apply is off).
 *
 * It renders the optimized prompt, the token saving, and the list of changes,
 * then lets the user Apply (replace the composer text) or Cancel.
 */

import type { OptimizeResult } from "@promptos/core";

const PANEL_ID = "promptos-preview";

interface PreviewHandlers {
  onApply: () => void;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderPreview(result: OptimizeResult, handlers: PreviewHandlers): void {
  document.getElementById(PANEL_ID)?.remove();

  const overlay = el("div");
  overlay.id = PANEL_ID;
  overlay.className = "promptos-overlay";

  const panel = el("div", "promptos-panel");
  overlay.appendChild(panel);

  // Header
  const header = el("div", "promptos-panel__header");
  header.appendChild(el("div", "promptos-panel__title", "PromptOS · Optimized prompt"));
  const close = el("button", "promptos-panel__close", "✕");
  close.setAttribute("aria-label", "Close");
  header.appendChild(close);
  panel.appendChild(header);

  // Stats
  const { stats } = result;
  const stat = el("div", "promptos-stats");
  const savedClass =
    stats.saved > 0 ? "promptos-pill--good" : stats.saved < 0 ? "promptos-pill--warn" : "";
  stat.innerHTML = `
    <span class="promptos-pill">${stats.originalTokens} → ${stats.optimizedTokens} tokens</span>
    <span class="promptos-pill ${savedClass}">${stats.saved >= 0 ? "−" : "+"}${Math.abs(stats.saved)} tokens (${stats.savedPercent}%)</span>
  `;
  panel.appendChild(stat);

  // Optimized text
  const textarea = el("textarea", "promptos-textarea") as HTMLTextAreaElement;
  textarea.value = result.optimized;
  textarea.spellcheck = false;
  panel.appendChild(textarea);

  // Changes list
  if (result.changes.length > 0) {
    const changes = el("ul", "promptos-changes");
    for (const c of result.changes) {
      const li = el("li");
      li.textContent = c.count > 1 ? `${c.description} (×${c.count})` : c.description;
      changes.appendChild(li);
    }
    const details = el("details", "promptos-details");
    const summary = el("summary", undefined, `${result.changes.length} change${result.changes.length === 1 ? "" : "s"}`);
    details.appendChild(summary);
    details.appendChild(changes);
    panel.appendChild(details);
  } else {
    panel.appendChild(el("div", "promptos-empty", "Already concise — no changes needed."));
  }

  // Actions
  const actions = el("div", "promptos-actions");
  const cancel = el("button", "promptos-action promptos-action--ghost", "Cancel");
  const copy = el("button", "promptos-action promptos-action--ghost", "Copy");
  const apply = el("button", "promptos-action promptos-action--primary", "Apply to chat");
  actions.append(cancel, copy, apply);
  panel.appendChild(actions);

  const destroy = () => overlay.remove();

  close.addEventListener("click", destroy);
  cancel.addEventListener("click", destroy);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) destroy();
  });
  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(textarea.value);
      copy.textContent = "Copied!";
      setTimeout(() => (copy.textContent = "Copy"), 1200);
    } catch {
      copy.textContent = "Copy failed";
    }
  });
  apply.addEventListener("click", () => {
    // Honour any manual edits the user made in the preview textarea.
    result.optimized = textarea.value;
    handlers.onApply();
    destroy();
  });

  document.addEventListener(
    "keydown",
    function onKey(e) {
      if (e.key === "Escape") {
        destroy();
        document.removeEventListener("keydown", onKey);
      }
    },
  );

  document.body.appendChild(overlay);
  textarea.focus();
  textarea.setSelectionRange(0, 0);
}
