# PromptOS — Complete Guide

> **Make your AI prompts shorter, smarter, and more effective — instantly.**
> No account. No API key. Everything runs offline inside your browser.

> ⚙️ **Developers:** for a deep, code-level walkthrough of how the engine works
> (the English/grammar fixer, the intent engine, app flow, and how to add or fix
> things), read **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)**.
>
> 🔄 **What changed recently:** PromptOS now has **just two modes** — **Optimize**
> (the default: grammar/English cleanup — spelling, a/an, contractions,
> capitalization, wordiness) and **Enhance** (rewrite into an intent-aware
> template: coding, writing, planning, health…). The old **Strength** dropdown and
> the **Restructure into sections** feature have been **removed** — Enhance replaces
> restructuring. Sections below that mention *Strength levels* or *Restructure* are
> historical and no longer reflect the UI.

---

## Table of Contents

1. [What is PromptOS?](#what-is-promptos)
2. [How It Works](#how-it-works)
3. [Features](#features)
4. [Supported AI Platforms](#supported-ai-platforms)
5. [Installation Guide](#installation-guide)
6. [How to Use](#how-to-use)
   - [The Inline Button (inside a chat box)](#1-the-inline-optimize-button)
   - [The Popup (toolbar icon)](#2-the-popup-optimizer)
   - [The Options Page (settings)](#3-the-options-page)
7. [Optimization Strengths Explained](#optimization-strengths-explained)
8. [The Restructure Feature](#the-restructure-feature)
9. [Understanding the Token Savings Report](#understanding-the-token-savings-report)
10. [Project File Reference](#project-file-reference)
11. [For Developers — Build from Source](#for-developers--build-from-source)
12. [Privacy](#privacy)
13. [FAQ](#faq)

---

## What is PromptOS?

PromptOS is a browser extension that **optimizes the prompts you type into AI chat tools**. It removes filler words, tightens phrasing, and optionally restructures your prompt into a clear format — so the AI understands exactly what you mean with fewer tokens.

### The Problem It Solves

Most people write prompts like this:

> *"I was wondering if you could please help me out. Basically, in order to improve my code, I would like you to refactor the login function. Due to the fact that it's messy, please make sure to keep the same behavior. Thanks in advance!"*

That's **42 tokens**. PromptOS rewrites it to:

> *"Refactor the login function. Keep the same behavior."*

That's **10 tokens** — **76% fewer** — and the AI actually gets a clearer instruction.

---

## How It Works

PromptOS runs a **local optimization pipeline** entirely inside your browser. No servers, no API calls, no data uploaded anywhere.

The pipeline runs in this order:

```
Your prompt
    │
    ▼
1. Normalize whitespace & punctuation  (always)
    │
    ▼
2. Replace wordy phrases → concise equivalents  (balanced+)
    │
    ▼
3. Remove filler openers  (balanced+)
    │
    ▼
4. Remove politeness particles  (balanced+)
    │
    ▼
5. Strip hedges & intensifiers  (aggressive only)
    │
    ▼
6. Remove duplicate lines  (aggressive only)
    │
    ▼
7. (Optional) Restructure into sections  (any level)
    │
    ▼
Optimized prompt + token report + list of every change
```

---

## Features

### ✦ One-Click Optimize Button
A small **✦ Optimize** button appears right inside your chat composer as soon as you start typing. One click rewrites your prompt in place.

### ✦ Preview Before Apply
By default, PromptOS shows you the optimized prompt in a **preview panel** before changing anything. You can:
- Read the optimized text
- Edit it further in the preview
- See the exact token savings
- See every change that was made
- Copy it to clipboard
- Apply it to the chat (replaces the original)
- Cancel and keep your original

### ✦ Standalone Popup Optimizer
Click the PromptOS icon in your browser toolbar to open a **full popup** where you can:
- Paste any text and optimize it
- Pull text directly from the current chat tab
- Copy the result or apply it back to the chat

### ✦ Three Optimization Strengths
Choose how aggressively to compress:
- **Light** — only whitespace/punctuation cleanup (always safe)
- **Balanced** — removes filler and wordy phrases (recommended)
- **Aggressive** — maximum token savings (removes hedges + deduplicates)

### ✦ Prompt Restructuring
Optionally reorganize your prompt into clearly labelled sections:
```
## Role
## Context
## Task
## Constraints
## Output format
```
This trades a few extra tokens for dramatically clearer instructions.

### ✦ Token Counter
See estimated token counts **before and after**, plus the exact percentage saved — so you know the impact of every optimization.

### ✦ List of Changes Applied
Every transformation is logged. You always know exactly what was changed and why.

### ✦ Settings Sync
Your preferences (strength, restructure on/off, button visibility, auto-apply) sync across all your Chrome sessions via `chrome.storage.sync`.

### ✦ Live Edit in Preview
The preview panel's textarea is fully editable — you can manually tweak the optimized prompt before applying it.

### ✦ Keyboard Shortcut
Press `Escape` to close the preview panel. Press `Cmd+Enter` / `Ctrl+Enter` in the popup to optimize instantly.

---

## Supported AI Platforms

PromptOS automatically detects which site you're on and injects the Optimize button into the right input element:

| Platform | URL |
|---|---|
| **ChatGPT** | chatgpt.com, chat.openai.com |
| **Claude** | claude.ai |
| **Gemini** | gemini.google.com |
| **Perplexity** | perplexity.ai |
| **Cursor** | cursor.com |

The popup optimizer works on **any** website — paste text from anywhere.

---

## Installation Guide

### Step 1 — Clone and build (one-time setup)

You need **Node.js 18+** and **npm** installed on your machine.

```bash
# 1. Clone the repository
git clone https://github.com/frontend-realm/promptOS.git
cd promptOS

# 2. Install all dependencies
npm install

# 3. Build the extension
npm run build:extension
```

This creates a ready-to-load extension in **`apps/extension/dist/`**.

### Step 2 — Load into Chrome

1. Open Chrome and go to **`chrome://extensions`**
2. Turn on **Developer mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Navigate to the `apps/extension/dist` folder inside your cloned repository and select it

The PromptOS icon (✦) will appear in your Chrome toolbar.

### Step 3 — Pin the extension (optional but recommended)

Click the puzzle-piece icon (Extensions) in the toolbar → find PromptOS → click the **pin** icon so it's always visible.

---

## How to Use

### 1. The Inline ✦ Optimize Button

This is the main way to use PromptOS — directly inside your AI chat.

**Steps:**
1. Go to [claude.ai](https://claude.ai), [chatgpt.com](https://chatgpt.com), or any supported platform
2. Click the chat input and start typing your prompt
3. A **✦ Optimize** button appears in the top-right corner of the composer
4. When you're done typing, click **✦ Optimize**
5. A preview panel appears showing:
   - The optimized prompt text (editable)
   - Token count before → after
   - How many tokens saved and percentage
   - The full list of changes made
6. Options in the preview:
   - **Apply to chat** — replaces your original prompt in the composer
   - **Copy** — copies the optimized text to your clipboard
   - **Cancel** — closes the preview, your original text is untouched
7. After applying, hit Send as normal

> **Tip:** If you enable "Apply instantly" in settings, there is no preview — it replaces the text immediately.

---

### 2. The Popup Optimizer

Click the PromptOS **✦** icon in your browser toolbar.

**Use it to:**

**Optimize any text you have:**
1. Paste your prompt into the text area at the top
2. Click **✦ Optimize** (or press `Cmd+Enter`)
3. See the result, token savings, and changes in the panel below
4. **Copy** the result or **Apply to chat** (writes it into the current tab's chat box)

**Pull directly from the current chat tab:**
1. While on Claude/ChatGPT/etc with some text typed in the composer
2. Click **⤓ From page** in the popup
3. It reads the text from the chat box, optimizes it, and shows the result
4. Click **Apply to chat** to send the optimized text back

**Change settings on the fly:**
The bottom section of the popup lets you change strength, restructure mode, button visibility, and auto-apply — these take effect immediately on any open chat tabs.

---

### 3. The Options Page

Open via: **right-click the extension icon → Options**, or click the **Settings** link inside the popup.

**Settings available:**

| Setting | What it does |
|---|---|
| **Enhance** | Off = clean up grammar & wording. On = rewrite into a structured, intent-aware prompt. |
| **Show Optimize button** | Toggle the inline ✦ button on/off inside chat boxes |
| **Apply instantly** | Skip the preview and apply the optimized prompt directly |

The options page also shows which AI platforms are supported.

---

## Optimization Strengths Explained

### Light
**Only runs safe, lossless cleanup:**
- Collapses multiple spaces into one
- Removes trailing whitespace per line
- Collapses 3+ blank lines into 1
- Fixes punctuation spacing (e.g. `hello ,world` → `hello, world`)

Nothing is reworded. Good if you want tidy formatting but no content changes.

---

### Balanced *(recommended)*
Everything in Light, plus:

**Wordy phrase replacement** — 46 built-in patterns, for example:

| Before | After |
|---|---|
| `in order to` | `to` |
| `due to the fact that` | `because` |
| `has the ability to` | `can` |
| `with regard to` | `about` |
| `a large number of` | `many` |
| `it is important to note that` | *(removed)* |
| `take into consideration` | `consider` |

**Filler opener removal** — strips phrases people habitually add to the beginning of instructions, like:
- `I was wondering if you could…`
- `I would like you to…`
- `Could you please…`
- `Would you kindly…`
- `Please go ahead and…`

**Politeness particle removal:**
- `please`, `kindly`
- `thanks in advance`, `thank you in advance`
- `thank you so much`

---

### Aggressive
Everything in Balanced, plus:

**Hedge and intensifier removal:**
- Words like `just`, `really`, `very`, `quite`, `actually`, `basically`, `literally`, `simply`, `kind of`, `sort of`, `i think`, `i guess`, `maybe`, `perhaps`

**Duplicate line collapse:**
- If you accidentally wrote the same instruction twice (common when editing), the duplicate is removed

---

## The Enhance Mode

> *(This replaces the old "Restructure" feature, which has been removed.)*

Turn on the **Enhance** toggle to rewrite your prompt into a complete, structured
prompt tailored to what you're asking for. PromptOS detects the topic — coding,
debugging, planning, writing, learning, health, business, or data — and applies a
template that follows the anatomy of a good prompt: a role, the task, and explicit
deliverables.

For example, `make me a todo app in react` becomes:

```
Act as a senior software engineer.

Task: Todo app in react.

Deliver:
- Complete, runnable, idiomatic code.
- A one-line note on the language/framework and any assumptions.
- Brief instructions to run or test it.

Keep it production-quality. Ask before guessing missing requirements.
```

Enhance intentionally **adds** tokens — it trades length for a much clearer
instruction. When Enhance is off, PromptOS just cleans up your English (the
default Optimize mode).

---

## Understanding the Token Savings Report

After optimizing you'll see something like:

```
[ 87 → 22 tokens ]   [ −65 tokens (74.7%) ]
```

- **87** = estimated tokens in your original prompt
- **22** = estimated tokens in the optimized prompt
- **−65** = tokens removed
- **74.7%** = percentage of original tokens saved

Token counts are **estimates** using a fast character/word heuristic (similar to real tokenizers for English text). They are accurate enough for before/after comparison but not exact billing numbers from AI providers.

The **changes list** below the stats itemizes every transformation:
```
5 changes applied
  ├ Replaced "in order to" → "to" (×2)
  ├ Removed "I was wondering if you could"
  ├ Removed courtesy phrases (×1)
  ├ Replaced "due to the fact that" → "because"
  └ Normalized whitespace and blank lines
```

---

## Project File Reference

This section explains every file in the project for anyone who wants to understand or contribute to the codebase.

### Root level

| File | Purpose |
|---|---|
| `package.json` | Root npm workspaces config — declares `packages/*` and `apps/*` as workspaces, defines top-level scripts like `npm test`, `npm run build` |
| `tsconfig.base.json` | Shared TypeScript compiler settings inherited by all packages and apps |
| `.gitignore` | Tells git to ignore `node_modules/`, `dist/`, `.next/`, secrets, logs |
| `README.md` | Developer-facing quick-start (technical, brief) |
| `EXTENSION_GUIDE.md` | This file — full user and developer documentation |
| `CLAUDE.md` | Product vision doc used during development with Claude Code |

---

### `packages/core/` — The Shared Optimization Engine

This is the heart of PromptOS. It is a pure TypeScript library with zero runtime dependencies, shared between the extension and the web app.

| File | What it does |
|---|---|
| `src/types.ts` | All TypeScript type definitions: `OptimizeOptions`, `OptimizeResult`, `IntentMatch`, `TokenStats`, `AppliedChange`, `Rule`, `Aggressiveness`, `Platform`. The single source of truth for the data shapes used everywhere. |
| `src/dictionaries.ts` | The word lists that power the rules: ~107 wordy-phrase replacements, ~121 contractions/typos, 33 filler openers, 19 hedges/intensifiers, 6 politeness particles. Adding a word here teaches PromptOS a new pattern — no code change. |
| `src/rules.ts` | Eight composable rule functions (each a pure `text → text + changes` transform): `collapseWhitespace`, `replaceWordyPhrases`, `stripFillerOpeners`, `stripPoliteness`, `stripHedges`, `dedupeLines`, `tidyPunctuation`, and `tidyGrammar` (the always-on English/spelling/a-an fixer). |
| `src/intents.ts` | The **Enhance** engine: `detectIntent` scores a prompt into a category (coding/writing/planning/health…), `extractGoal` strips request framing, and per-category templates build a structured prompt. |
| `src/tokenizer.ts` | Fast token estimator. Combines character-per-token and word-per-token heuristics and takes the max, matching real tokenizers closely for English prose without shipping a multi-MB vocabulary file. |
| `src/optimizer.ts` | The orchestrator. Runs all rules in order, optionally runs the Enhance template, collects change records, and returns the final `OptimizeResult` (which always includes the detected `intent`). The only function you call: `optimize(text, options)`. |
| `src/index.ts` | Public API surface — re-exports everything the extension and web app need. |
| `src/optimizer.test.ts` / `src/intents.test.ts` | Unit tests using Node's built-in `node:test` runner. Covers whitespace, phrase replacement, filler/politeness removal, grammar/spelling/a-an fixes, intent detection, goal extraction, templates, and edge cases. |
| `package.json` | Package metadata; declares `tsx` for running TypeScript tests directly. |
| `tsconfig.json` | TypeScript config extending the root base, targeting the `src/` directory. |

---

### `apps/extension/` — The Chrome Extension

#### Top-level config

| File | What it does |
|---|---|
| `manifest.json` | The Chrome extension manifest (MV3). Declares the extension name, version, icons, permissions (`storage`, `activeTab`, `scripting`), which URLs get the content script injected, the popup page, the background worker, and the options page. |
| `package.json` | Extension package: depends on `@promptos/core`, `esbuild` for bundling, `@types/chrome` for Chrome API types. |
| `tsconfig.json` | TypeScript config that adds the `chrome` types so Chrome API calls typecheck correctly. |
| `build.mjs` | The build script (plain Node.js, no extra tools). Uses esbuild to bundle all four entry points into `dist/`, then copies all static files (HTML, CSS, icons, manifest) into `dist/`. Pass `--watch` for incremental dev builds. |

#### `src/shared/` — Code shared across all extension surfaces

| File | What it does |
|---|---|
| `src/shared/settings.ts` | Defines the `Settings` type (`aggressiveness`, `restructure`, `showInlineButton`, `autoApply`), default values, and async functions to read (`loadSettings`) and write (`saveSettings`) settings from/to `chrome.storage.sync`. Also exports `onSettingsChanged` so live tabs can react to popup changes without a page reload. |
| `src/shared/platforms.ts` | Per-platform adapter definitions. Each adapter knows: which URLs it handles, which CSS selectors to try to find the chat composer, and how to read/write text from that element. `readInput` handles both `<textarea>` and contenteditable `<div>` elements. `writeInput` uses the native value setter + React synthetic events so the host site's framework (React, ProseMirror, Quill) registers the change correctly. |

#### `src/content/` — The In-Page Content Script

Injected into every supported AI site. This is what adds the Optimize button and preview panel.

| File | What it does |
|---|---|
| `src/content/index.ts` | Main content script entry point. Detects the platform, finds the active composer element, creates and positions the ✦ Optimize button, watches for DOM changes (SPA navigation), handles Chrome messages from the popup (`promptos:read-active`, `promptos:apply`, `promptos:optimize-active`), runs the optimizer on click, and decides whether to show the preview or apply directly based on the `autoApply` setting. |
| `src/content/preview.ts` | Builds the preview panel DOM from scratch (no framework). Creates an overlay with: stats pills (before/after tokens, savings), an editable textarea showing the optimized text, a collapsible changes list, and Apply/Copy/Cancel buttons. Handles Escape key to close. Apply uses whatever text is currently in the preview textarea (respecting any manual edits). |

#### `src/background/` — The Service Worker

| File | What it does |
|---|---|
| `src/background/index.ts` | Chrome MV3 background service worker. On first install: writes default settings to `chrome.storage.sync` so every surface always reads a complete settings object. Opens the options page (with `?welcome=1`) on first install so new users get a welcome screen. Very lightweight by design — all heavy work happens in the content script. |

#### `src/popup/` — The Toolbar Popup

| File | What it does |
|---|---|
| `src/popup/index.ts` | Logic for `popup.html`. Loads settings and renders them in the controls section. Handles the **✦ Optimize** button (runs the optimizer on the textarea text), **⤓ From page** (sends a message to the content script to read the current chat text), **Apply to chat** (sends the optimized text back to the content script to write into the composer), and **Copy** (clipboard API). Settings changes in the popup are persisted immediately via `saveSettings`. |

#### `src/options/` — The Options Page

| File | What it does |
|---|---|
| `src/options/index.ts` | Logic for `options.html`. Loads current settings, binds each form control, persists on every change. Shows a welcome banner when `?welcome=1` is in the URL (on first install). Displays the library version. |

#### `public/` — Static Assets (copied into `dist/` at build time)

| File | What it does |
|---|---|
| `public/popup.html` | The HTML for the toolbar popup UI: textarea for input, Optimize/From-page buttons, result section with stats + optimized textarea + Copy/Apply buttons, collapsible changes list, settings controls, footer with Settings link and version. |
| `public/options.html` | Full-page settings/options UI. Mirrors the popup's controls but with more space, plus the welcome banner for first-run, and a "Supported platforms" chip list. |
| `public/popup.css` | Shared stylesheet for both the popup and options page. Dark-mode design with CSS custom properties for colours, card layouts, pill badges, textarea, select, toggle inputs, and action buttons. |
| `public/content.css` | Injected into AI sites for the in-page UI. Namespaced under `.promptos-*` to avoid clashing with host-site styles. Styles the floating ✦ Optimize button and the preview overlay/panel. |
| `public/icons/icon16.png` | 16×16 toolbar icon |
| `public/icons/icon48.png` | 48×48 extensions-page icon |
| `public/icons/icon128.png` | 128×128 Chrome Web Store / install icon |

#### `scripts/`

| File | What it does |
|---|---|
| `scripts/generate-icons.mjs` | Pure-Node PNG generator (no image libraries). Draws a rounded gradient tile (indigo → blue) with a white four-point spark logo in all three required sizes. Run once; output committed to `public/icons/`. |

---

### `apps/web/` — The Web App (Next.js)

| File | What it does |
|---|---|
| `next.config.mjs` | Next.js config: enables `transpilePackages: ["@promptos/core"]` so webpack processes the TypeScript source of the shared engine, and adds `extensionAlias` so `.js` imports in the engine resolve to `.ts` files. |
| `app/layout.tsx` | Root layout with `<html>` and `<body>`, sets page-level metadata (title, description). |
| `app/page.tsx` | The landing page. Hero section with tagline and platform chips, live optimizer demo section, three-column features grid, footer. Server component — imports `VERSION` from `@promptos/core`. |
| `app/Optimizer.tsx` | Client component (`"use client"`). The interactive optimizer demo: two side-by-side textareas (input / output), strength selector, restructure toggle, real-time optimization on every keystroke (via `useMemo`), token stats badges, collapsible changes list. Uses the exact same `optimize()` function as the extension. |
| `app/globals.css` | Global CSS for the web app. Same design language as the extension (dark background, indigo accents, card components) but laid out for a full-width page. |
| `tsconfig.json` | Next.js TypeScript config. |
| `next-env.d.ts` | Auto-generated Next.js type reference (do not edit). |

---

## For Developers — Build from Source

### Prerequisites
- Node.js 18 or higher
- npm (comes with Node)
- Chrome or any Chromium-based browser (Edge, Brave, Arc, etc.)

### Commands

```bash
# Install all dependencies (run once after cloning)
npm install

# Run the core engine tests (12 tests)
npm test

# Typecheck every workspace
npm run typecheck

# Build the Chrome extension → apps/extension/dist/
npm run build:extension

# Build the extension in watch mode (auto-rebuilds on save)
npm run dev:extension

# Start the Next.js web app (dev server at http://localhost:3000)
npm run dev:web

# Production build of the web app
npm run build
```

### Project Structure

```
promptOS/
├── package.json              ← root npm workspaces
├── tsconfig.base.json        ← shared TypeScript config
│
├── packages/
│   └── core/                 ← @promptos/core (shared engine)
│       └── src/
│           ├── types.ts
│           ├── dictionaries.ts
│           ├── rules.ts
│           ├── intents.ts
│           ├── tokenizer.ts
│           ├── optimizer.ts
│           ├── optimizer.test.ts
│           ├── intents.test.ts
│           └── index.ts
│
└── apps/
    ├── extension/            ← Chrome MV3 extension
    │   ├── manifest.json
    │   ├── build.mjs
    │   ├── src/
    │   │   ├── shared/
    │   │   │   ├── settings.ts
    │   │   │   └── platforms.ts
    │   │   ├── content/
    │   │   │   ├── index.ts
    │   │   │   └── preview.ts
    │   │   ├── background/
    │   │   │   └── index.ts
    │   │   ├── popup/
    │   │   │   └── index.ts
    │   │   └── options/
    │   │       └── index.ts
    │   └── public/
    │       ├── popup.html / popup.css
    │       ├── options.html
    │       ├── content.css
    │       └── icons/
    │
    └── web/                  ← Next.js landing page
        └── app/
            ├── layout.tsx
            ├── page.tsx
            ├── Optimizer.tsx
            └── globals.css
```

### Adding New Optimization Rules

1. Add your phrase pair to `packages/core/src/dictionaries.ts` (in `WORDY_PHRASES`, `FILLER_OPENERS`, etc.)
2. Or add a new rule function to `packages/core/src/rules.ts` implementing the `Rule` interface
3. Add the rule to the `ALL_RULES` array at the bottom of `rules.ts`
4. Write a test in `optimizer.test.ts`
5. Run `npm test` — no rebuild needed for the extension in watch mode

---

## Privacy

- **No servers.** PromptOS has no backend. Zero.
- **No API calls.** The optimizer is entirely deterministic, rule-based code.
- **No tracking.** No analytics, no telemetry, no crash reporting.
- **No data stored.** Only your *settings* (strength, restructure on/off, etc.) are stored in `chrome.storage.sync`. Your prompts are never saved anywhere.
- **Open source.** You can read every line of code at [github.com/frontend-realm/promptOS](https://github.com/frontend-realm/promptOS).

---

## FAQ

**Does it work on Firefox?**
Not yet — it uses Chrome MV3 APIs. Firefox MV3 support is planned.

**Will it break my prompt's meaning?**
At Balanced strength, only filler and wordy phrases are removed — these carry no semantic meaning. At Aggressive, hedges like "just" and "really" are removed, which is safe for most prompts. The preview panel always lets you review before applying.

**Why are token counts shown as "estimated"?**
Real BPE tokenizers (used by GPT-4, Claude, etc.) require shipping a multi-megabyte vocabulary file. PromptOS uses a fast character/word heuristic that closely matches real tokenizers for English text — accurate enough for before/after comparison without the download cost.

**Can I undo after applying?**
Yes — use the standard `Cmd+Z` / `Ctrl+Z` undo in the chat box immediately after applying.

**The ✦ button doesn't appear — what do I do?**
- Check that the extension is enabled in `chrome://extensions`
- Reload the AI platform page
- Make sure "Show Optimize button" is enabled in the extension's Options
- Some sites update their DOM structure; open an issue on GitHub with the site URL

**Can I add my own rules?**
Yes — see [Adding New Optimization Rules](#adding-new-optimization-rules) above. Pull requests are welcome.

**Does it work with Cursor's in-editor AI?**
The extension targets Cursor's web interface (`cursor.com`). The desktop Cursor editor is a separate Electron app and is not yet supported.
