# PromptOS

> An AI Prompt Composer — turn rough prompts into clear, well-structured
> instructions. Better English, clearer context, better results.

PromptOS improves prompts **locally** (no API keys, no network calls, no AI) and
works both as a web app and as a browser extension that drops an **✦ Optimize**
button right inside ChatGPT, Claude, Gemini, Perplexity and Cursor.

## Two modes

- **Optimize (default)** — cleans up your prompt's English: spelling, missing
  apostrophes (`dont → don't`), articles (`a apple → an apple`), capitalization,
  punctuation, and wordiness (`due to the fact that → because`). Same meaning,
  better writing. Great when English isn't your first language.
- **Enhance** — detects what you're asking for (coding, writing, planning,
  health, …) and rewrites it into a complete, structured prompt that any chatbot
  answers well.

Everything is deterministic: plain TypeScript, regex, and curated word lists — no
machine learning, no servers.

```ts
import { optimize } from "@promptos/core";

// Clean up English (default)
optimize("pls help me fix my code it dont work").optimized;
// → "Please help me fix my code it don't work."

// Rewrite into a structured prompt
optimize("make me a todo app in react", { enhance: true }).optimized;
// → "Act as a senior software engineer.\n\nTask: Todo app in react.\n\nDeliver: ..."
```

> Token counts are **estimates** (a fast char/word heuristic), shown to compare
> before/after — not exact provider billing.

## Monorepo layout

```
promptOS/
├── packages/
│   └── core/         @promptos/core — the shared engine (English + Enhance)
├── apps/
│   ├── extension/    @promptos/extension — Chrome MV3 extension (primary)
│   └── web/          @promptos/web — Next.js landing + live optimizer demo
```

Both apps consume the **same** `@promptos/core` engine, so "optimize" means
exactly the same thing everywhere.

## Quick start

Requires Node ≥ 18 and npm.

```bash
npm install            # install all workspaces
npm test               # run @promptos/core tests
npm run typecheck      # typecheck every workspace
npm run build:extension   # build the extension → apps/extension/dist
npm run dev:web        # run the web app at http://localhost:3000
```

**Load the extension:** Chrome → `chrome://extensions` → enable **Developer
mode** → **Load unpacked** → select `apps/extension/dist`. Open a supported AI
site, type a prompt, click **✦ Optimize**.

## Documentation

| Doc | For | What's inside |
|---|---|---|
| **[EXTENSION_GUIDE.md](EXTENSION_GUIDE.md)** | Users | Install, the popup/options/inline button, features, FAQ. |
| **[DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)** | Developers | How the English & Enhance engines work, app flow, and how to add/fix rules, dictionaries, intents, and platforms. |
| **[TEST_PROMPTS.md](TEST_PROMPTS.md)** | QA | A ready-made checklist of prompts for manual testing. |
| **[CLAUDE.md](CLAUDE.md)** | Context | Product vision and architecture goals. |

## Privacy

Everything runs in your browser. PromptOS makes **no network requests** and
stores only your settings (in `chrome.storage.sync`).
