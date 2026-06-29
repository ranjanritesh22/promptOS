# PromptOS — Manual Test Prompts

A checklist of prompts for manually testing the optimizer. Paste each into the
web app, the extension popup, or an in-chat composer, and confirm:

- **Enhance mode** → the **Detected intent** matches the "Expected intent" column,
  and the rewritten prompt reads as a clean, structured directive.
- **Compress mode** → wordy/filler input shrinks (negative token delta); already-tight
  input is left alone ("Already concise").

Intent is also reported in **Compress** mode (badge / pill), so you can verify
detection independently of the rewrite.

> Tip: in the web app, toggle **Compress ⇆ Enhance** without retyping — the result
> updates live.

---

## 1. Coding

| Prompt | Expected intent |
| --- | --- |
| `can you make me a website for my bakery` | Coding |
| `build a react component for a todo list` | Coding |
| `write a python function to reverse a linked list` | Coding |
| `i need an api endpoint that returns user profiles` | Coding |
| `implement a debounce function in typescript` | Coding |
| `create a sql query to find the top 10 customers by spend` | Coding |
| `refactor this class to use dependency injection` | Coding |
| `make me a landing page with html and css` | Coding |

## 2. Debugging

| Prompt | Expected intent |
| --- | --- |
| `my python script keeps throwing a KeyError and not working` | Debugging |
| `why is my react component not rendering` | Debugging |
| `fix this bug, the page crashes on load` | Debugging |
| `getting "undefined is not a function" error in my code` | Debugging |
| `my tests are failing after the upgrade` | Debugging |
| `this regex doesn't work for emails with a plus sign` | Debugging |

> Note: debugging signals (error / bug / not working / fix) should win over the
> coding signals in the same sentence.

## 3. Planning

| Prompt | Expected intent |
| --- | --- |
| `help me plan a roadmap to launch my app in 3 months` | Planning |
| `i want to organize my week to be more productive` | Planning |
| `outline the steps to migrate from mysql to postgres` | Planning |
| `what's a good strategy to grow my newsletter` | Planning |
| `design a system architecture for a chat app` | Planning |
| `break down the work for building an e-commerce site` | Planning |

## 4. Writing

| Prompt | Expected intent |
| --- | --- |
| `write a friendly onboarding email for new users` | Writing |
| `rewrite my resume summary to sound more confident` | Writing |
| `draft a blog post about remote work tips` | Writing |
| `proofread and edit this paragraph for grammar` | Writing |
| `write a cover letter for a marketing role` | Writing |
| `summarize this article in three sentences` | Writing |
| `write a pitch for investors` | Writing |
| `write a report on website traffic metrics` | Writing |

> Note: "write a X" stays **Writing** unless concrete coding nouns are present —
> e.g. `write a python function` flips to **Coding** because of `python` + `function`.

## 5. Learning

| Prompt | Expected intent |
| --- | --- |
| `explain how promises work in javascript` | Learning |
| `what is the difference between TCP and UDP` | Learning |
| `teach me the basics of machine learning` | Learning |
| `how does the stock market work` | Learning |
| `eli5 how does HTTPS keep data secure` | Learning |
| `give me an example of recursion` | Learning |

> Note: a leading "explain / what is / how does" should pick **Learning** even
> when the topic is technical (e.g. JavaScript).

## 6. Health & fitness

| Prompt | Expected intent |
| --- | --- |
| `i want to lose weight before summer` | Health & fitness |
| `build me a beginner workout routine` | Health & fitness |
| `what high-protein meals should i eat to gain muscle` | Health & fitness |
| `how can i improve my sleep` | Health & fitness |
| `give me a beginner running workout for a 5k` | Health & fitness |
| `tips to reduce stress and anxiety` | Health & fitness |

> The health template must include the medical-disclaimer line.
>
> Note: phrasing it as `plan a meal plan` / `plan a workout` can tip the intent to
> **Planning** (both are valid plan-shaped requests). Either way you get a useful,
> structured prompt.

## 7. Business

| Prompt | Expected intent |
| --- | --- |
| `give me a go to market strategy for my startup` | Business |
| `ideas to increase sales for my online store` | Business |
| `i want to monetize my mobile app` | Business |
| `how to find my first customers` | Business |
| `how do i price my saas product` | Learning* |

> \* This reads as **Learning**, not Business — a leading `how do i` / `how to`
> is treated as a "teach me" signal. That's a known, acceptable ambiguity:
> the prompt still gets a clear, structured rewrite either way.

## 8. Data & analysis

| Prompt | Expected intent |
| --- | --- |
| `analyze this sales dataset for trends` | Data & analysis |
| `help me build a chart from my csv` | Data & analysis |
| `what insights can i get from this spreadsheet` | Data & analysis |
| `show me trends and insights from my analytics data` | Data & analysis |

## 9. General (fallback)

These have no strong signal and should fall back to **General** with 0% confidence.

| Prompt | Expected intent |
| --- | --- |
| `hmm` | General |
| `tell me something interesting` | General |
| `i have a question about my situation` | General |
| `give me your opinion` | General |

---

## 10. Phrasing variations (goal-extraction test)

All of these should detect **Coding** and extract roughly the same goal
("build a todo app in react") — proving many phrasings collapse to one prompt.

- `build a todo app in react`
- `i want to build a todo app in react`
- `i want you to build a todo app in react`
- `can you build a todo app in react`
- `could you please build a todo app in react`
- `i was wondering if you could build a todo app in react`
- `help me build a todo app in react`
- `make me a todo app in react`
- `i need a todo app in react, thanks in advance!`

## 11. Compress-mode prompts (token reduction)

Use **Compress** mode here and confirm a negative token delta.

- `I was wondering if you could please help me out. Basically, in order to improve my onboarding email, I would like you to rewrite it to be more concise and friendly. Due to the fact that our users are busy, it should be short. Please make sure to keep a call to action. Thanks in advance!`
- `At this point in time, I would really appreciate it if you could take into consideration the fact that I need a large number of examples.`
- `Please kindly make a decision about the design, and please note that we have a great deal of time.`
- Try each at **Light / Balanced / Aggressive** strength and watch the savings grow.

## 12. Edge cases

| Prompt | What to check |
| --- | --- |
| *(empty input)* | No crash; nothing happens / button does nothing |
| ` ` (only spaces) | Treated as empty |
| `fix` | Too vague to classify alone → **General** (needs "fix this/my …" for Debugging) |
| `a` | Single char — no crash, General |
| 2000-word pasted prompt | No lag; still optimizes |
| `WHY IS MY CODE NOT WORKING` (all caps) | Case-insensitive — Debugging |
| `Build a REST API. Plan the database schema. Explain JWT auth.` | Mixed signals — picks the highest-scoring single intent (no crash) |

---

## Extension-specific checks

- **From page** button pulls text from the active ChatGPT/Claude/Gemini composer.
- **Apply to chat** writes the optimized prompt back into the composer.
- Inline **✦ Optimize** button appears in the chat box (when enabled) and only
  shows when the box has text.
- Toggling **Enhance** in the popup/options persists and changes the next result.
- With **Apply instantly** off, a preview panel appears; with it on, text is
  replaced directly.
