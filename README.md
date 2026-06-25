# PromptOS

> An AI Prompt Composer — turn rough prompts into concise, well-structured
> instructions. Fewer tokens, clearer context, better results.

PromptOS optimizes prompts **locally** (no API keys, no network calls) and works
both as a web app and as a browser extension that drops an **✦ Optimize** button
right inside ChatGPT, Claude, Gemini, Perplexity and Cursor.

## Monorepo layout

```
promptOS/
├── packages/
│   └── core/         @promptos/core — shared prompt-optimization engine
├── apps/
│   ├── extension/    @promptos/extension — Chrome MV3 extension (primary use case)
│   └── web/          @promptos/web — Next.js landing + live optimizer demo
```

Both apps consume the **same** `@promptos/core` engine, so "optimize" means
exactly the same thing everywhere — the core architectural goal in
[`CLAUDE.md`](./CLAUDE.md).

## The engine (`@promptos/core`)

A deterministic, dependency-free pipeline:

1. **Whitespace & punctuation** normalization (always on)
2. **Wordy → concise** phrase replacement (`in order to` → `to`, …)
3. **Filler openers** removed (`I was wondering if you could …`)
4. **Politeness particles** removed (`please`, `thanks in advance`)
5. **Hedges & intensifiers** removed and **duplicate lines** collapsed (aggressive)
6. Optional **restructuring** into `Role / Context / Task / Constraints / Format`

Each pass is gated by a `light | balanced | aggressive` strength setting, and the
result reports estimated token savings plus the exact list of changes applied.

```ts
import { optimize } from "@promptos/core";

const { optimized, stats, changes } = optimize(myPrompt, {
  aggressiveness: "balanced",
  restructure: true,
});
```

> Token counts are **estimates** (a fast char/word heuristic), shown to compare
> before/after — not exact provider billing.

## Develop

Requires Node ≥ 18 and npm.

```bash
npm install            # install all workspaces
npm test               # run @promptos/core tests
npm run typecheck      # typecheck every workspace
npm run build          # build core + extension (+ web if deps installed)
```

### Load the extension

```bash
npm run build:extension      # outputs apps/extension/dist
```

Then in Chrome: `chrome://extensions` → enable **Developer mode** → **Load
unpacked** → select `apps/extension/dist`. Open any supported AI site, type a
prompt, and click **✦ Optimize**.

### Run the web app

```bash
npm run dev:web        # http://localhost:3000
```

## Privacy

Everything runs in your browser. PromptOS makes **no network requests** and
stores only your settings (in `chrome.storage.sync`).
