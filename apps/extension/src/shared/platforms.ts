/**
 * Per-platform adapters.
 *
 * Each supported AI site exposes its chat input differently (a `<textarea>`, a
 * contenteditable `<div>`, a ProseMirror editor, ...). An adapter knows how to
 * (a) recognize the site, (b) find the active input element, and (c) read/write
 * its text in a way the site's framework will notice.
 */

import type { Platform } from "@promptos/core";

export interface PlatformAdapter {
  id: Platform;
  label: string;
  /** Does this adapter handle the current page? */
  matches: (host: string) => boolean;
  /** CSS selectors for the composer input, tried in order. */
  inputSelectors: string[];
}

const ADAPTERS: PlatformAdapter[] = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    matches: (h) => h.includes("chatgpt.com") || h.includes("chat.openai.com"),
    inputSelectors: ["#prompt-textarea", "div[contenteditable='true']", "textarea"],
  },
  {
    id: "claude",
    label: "Claude",
    matches: (h) => h.includes("claude.ai"),
    inputSelectors: ["div[contenteditable='true'].ProseMirror", "div[contenteditable='true']", "textarea"],
  },
  {
    id: "gemini",
    label: "Gemini",
    matches: (h) => h.includes("gemini.google.com"),
    inputSelectors: ["div.ql-editor[contenteditable='true']", "div[contenteditable='true']", "textarea"],
  },
  {
    id: "perplexity",
    label: "Perplexity",
    matches: (h) => h.includes("perplexity.ai"),
    inputSelectors: ["textarea", "div[contenteditable='true']"],
  },
  {
    id: "cursor",
    label: "Cursor",
    matches: (h) => h.includes("cursor.com"),
    inputSelectors: ["textarea", "div[contenteditable='true']"],
  },
];

const GENERIC: PlatformAdapter = {
  id: "generic",
  label: "this site",
  matches: () => true,
  inputSelectors: ["textarea", "div[contenteditable='true']"],
};

/** Resolve the adapter for the current page. */
export function detectPlatform(host: string = location.host): PlatformAdapter {
  return ADAPTERS.find((a) => a.matches(host)) ?? GENERIC;
}

/** Is the given element a text input we can read/write? */
export function isEditable(el: Element | null): el is HTMLElement {
  if (!el) return false;
  if (el instanceof HTMLTextAreaElement) return true;
  if (el instanceof HTMLElement && el.isContentEditable) return true;
  return false;
}

/** Read the current text out of a composer element. */
export function readInput(el: HTMLElement): string {
  if (el instanceof HTMLTextAreaElement) return el.value;
  return el.innerText;
}

/**
 * Write text into a composer element so the host framework (React, ProseMirror,
 * etc.) registers the change. For textareas we use the native value setter +
 * an `input` event; for contenteditable we replace text content and dispatch an
 * `input` event so the editor's model updates.
 */
export function writeInput(el: HTMLElement, text: string): void {
  if (el instanceof HTMLTextAreaElement) {
    const setter = Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )?.set;
    setter?.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return;
  }

  el.focus();
  // Select all existing content, then insert — execCommand keeps the editor's
  // internal model in sync on ProseMirror/Quill-based composers.
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection?.removeAllRanges();
  selection?.addRange(range);

  const inserted = document.execCommand("insertText", false, text);
  if (!inserted) {
    // Fallback for editors that block execCommand.
    el.textContent = text;
    el.dispatchEvent(new InputEvent("input", { bubbles: true, inputType: "insertText", data: text }));
  }
}
