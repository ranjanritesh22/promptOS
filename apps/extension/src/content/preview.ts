/**
 * Non-blocking toast notification shown after the optimizer runs.
 *
 * Unlike a modal, the toast appears at the bottom of the page for a few
 * seconds — the optimized text has already been written to the composer
 * before the toast appears. Clicking Undo restores the original.
 */

import type { OptimizeResult } from "@promptos/core";

const TOAST_ID = "promptos-toast";
const AUTO_DISMISS_MS = 5000;

interface ToastHandlers {
  onUndo: () => void;
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

function buildMessage(result: OptimizeResult): string {
  const { stats, changes } = result;
  const desc = changes[0]?.description ?? "Optimized";
  if (stats.saved > 0) return `${desc} · −${stats.saved} tokens`;
  if (stats.saved < 0) return `${desc} · +${Math.abs(stats.saved)} tokens`;
  return desc;
}

export function renderPreview(result: OptimizeResult, handlers: { onApply: () => void; onUndo?: () => void }): void {
  // Remove any existing toast first
  document.getElementById(TOAST_ID)?.remove();

  const toast = el("div", "promptos-toast");
  toast.id = TOAST_ID;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");

  const icon = el("span", "promptos-toast__icon", "✦");
  const label = el("span", "promptos-toast__label", "PromptOS");
  const msg = el("span", "promptos-toast__msg", buildMessage(result));

  toast.append(icon, label, msg);

  if (handlers.onUndo) {
    const undo = el("button", "promptos-toast__undo", "Undo");
    const undoHandler = handlers.onUndo;
    undo.addEventListener("click", () => {
      undoHandler();
      toast.remove();
      clearTimeout(timerId);
    });
    toast.appendChild(undo);
  }

  document.body.appendChild(toast);

  // Auto-dismiss
  const timerId = window.setTimeout(() => toast.remove(), AUTO_DISMISS_MS);

  // Escape key → undo + dismiss
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      handlers.onUndo?.();
      toast.remove();
      clearTimeout(timerId);
      document.removeEventListener("keydown", onKey);
    }
  };
  document.addEventListener("keydown", onKey);

  // Clicking the toast itself doesn't undo (only the button does)
  toast.addEventListener("mouseover", () => {
    // Pause auto-dismiss while hovering would be nice but keep it simple
  });
}
