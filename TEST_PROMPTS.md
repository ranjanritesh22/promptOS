# PromptOS — Manual Test Prompts (QA Checklist)

A ready-to-use script for manually testing PromptOS. Hand this to a QA / manual
tester. No coding needed — just paste each prompt, compare the result to the
**Expected output**, and tick the box.

## Where to test

- **Extension popup** — click the PromptOS ✦ toolbar icon, paste into the box,
  click **✦ Optimize**.
- **Inline button** — on ChatGPT / Claude / Gemini / Perplexity / Cursor, type in
  the chat box and click the floating **✦ Optimize**.
- **Web app** — `npm run dev:web` → http://localhost:3000.

## The two modes

| Mode | How to turn it on | What it should do |
|---|---|---|
| **Optimize** (default) | **Enhance** toggle **OFF** | Fix English: spelling, `a/an`, apostrophes, capitalization, punctuation, wordiness. **Meaning stays the same.** |
| **Enhance** | **Enhance** toggle **ON** | Rewrite into a full structured prompt based on the detected topic (coding, writing, planning, health…). |

> ⚠️ **Important for testers:** In **Optimize** mode the token count may go **up,
> down, or stay the same**. Adding a missing apostrophe or period adds characters,
> so `−0%` or even a small negative % is **correct**, not a bug. The thing to
> verify is that the **text is fixed correctly**, not that tokens dropped.
>
> In **Enhance** mode tokens almost always **go up** — that's expected; it trades
> length for a clearer prompt.

---

# PART A — Optimize mode (English cleanup)

**Enhance toggle OFF.** Paste the input; the output box should match exactly.

## A1. Spelling fixes

| # | Input | Expected output |
|---|---|---|
| 1 | `i recieve alot of emails and it is definately a problem` | `I receive a lot of emails and it is definitely a problem.` |
| 2 | `this is seperate and occured becuase of teh bug` | `This is separate and occurred because of the bug.` |

## A2. Contractions & informal text

| # | Input | Expected output |
|---|---|---|
| 3 | `i dont think it wont work, im sure u can do it` | `I don't think it won't work, I'm sure you can do it.` |
| 4 | `pls help me, i wanna learn thru practice` | `Please help me, I want to learn through practice.` |

## A3. a / an article correction

| # | Input | Expected output |
|---|---|---|
| 5 | `i need a apple, an book, a hour, and an university degree` | `I need an apple, a book, an hour, and a university degree.` |

> This one is the showcase: `a apple → an apple`, `an book → a book`, **and** the
> tricky exceptions `a hour → an hour` and `an university → a university`.

## A4. Capitalization, lone "i", and end punctuation

| # | Input | Expected output |
|---|---|---|
| 6 | `explain how i can center a div. it should work on mobile` | `Explain how I can center a div. It should work on mobile.` |

Check: first letter capitalized, the standalone `i` → `I`, the sentence after the
period capitalized, and a final period added.

## A5. Wordiness → concise

| # | Input | Expected output |
|---|---|---|
| 7 | `due to the fact that i have a large number of tasks, in order to finish i need help` | `Because I have many tasks, to finish I need help.` |
| 8 | `at this point in time we have a great deal of work` | `Now we have much work.` |

## A6. Redundancy (pleonasms)

| # | Input | Expected output |
|---|---|---|
| 9 | `give me the end result and final outcome with past history` | `Give me the result and outcome with history.` |

## A7. Filler + politeness removal

| # | Input | Expected output |
|---|---|---|
| 10 | `I was wondering if you could please help me refactor this function. Thanks in advance!` | `Help me refactor this function.` |

## A8. Already-clean prompt (no-op check)

| # | Input | Expected output |
|---|---|---|
| 11 | `Summarize this article in three sentences.` | `Summarize this article in three sentences.` |

> A clean prompt should come back unchanged (the changes list shows nothing /
> "Already concise"). If a clean prompt gets mangled, that's a bug.

---

# PART B — Enhance mode (structured prompts)

**Enhance toggle ON.** Here you check **two things**:

1. The **Detected intent** badge matches the *Expected intent* column.
2. The output is a clean, structured prompt (role → task → deliverables) that
   reads well.

> Intent is also shown in Optimize mode, so detection can be checked in either mode.

## B1. Coding

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

## B2. Debugging

| Prompt | Expected intent |
| --- | --- |
| `my python script keeps throwing a KeyError and not working` | Debugging |
| `why is my react component not rendering` | Debugging |
| `fix this bug, the page crashes on load` | Debugging |
| `getting "undefined is not a function" error in my code` | Debugging |
| `my tests are failing after the upgrade` | Debugging |
| `this regex doesn't work for emails with a plus sign` | Debugging |

> Debugging signals (error / bug / not working / fix) should beat coding signals
> in the same sentence.

## B3. Planning

| Prompt | Expected intent |
| --- | --- |
| `help me plan a roadmap to launch my app in 3 months` | Planning |
| `i want to organize my week to be more productive` | Planning |
| `outline the steps to migrate from mysql to postgres` | Planning |
| `what's a good strategy to grow my newsletter` | Planning |
| `design a system architecture for a chat app` | Planning |
| `break down the work for building an e-commerce site` | Planning |

## B4. Writing

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

> "write a X" stays **Writing** unless concrete coding nouns appear — e.g.
> `write a python function` flips to **Coding** because of `python` + `function`.

## B5. Learning

| Prompt | Expected intent |
| --- | --- |
| `explain how promises work in javascript` | Learning |
| `what is the difference between TCP and UDP` | Learning |
| `teach me the basics of machine learning` | Learning |
| `how does the stock market work` | Learning |
| `eli5 how does HTTPS keep data secure` | Learning |
| `give me an example of recursion` | Learning |

> A leading `explain` / `what is` / `how does` picks **Learning** even when the
> topic is technical.

## B6. Health & fitness

| Prompt | Expected intent |
| --- | --- |
| `i want to lose weight before summer` | Health & fitness |
| `build me a beginner workout routine` | Health & fitness |
| `what high-protein meals should i eat to gain muscle` | Health & fitness |
| `how can i improve my sleep` | Health & fitness |
| `give me a beginner running workout for a 5k` | Health & fitness |
| `tips to reduce stress and anxiety` | Health & fitness |

> The Health output must include the medical-disclaimer line. Phrasing it as
> `plan a meal plan` / `plan a workout` can tip the intent to **Planning** — both
> are valid.

## B7. Business

| Prompt | Expected intent |
| --- | --- |
| `give me a go to market strategy for my startup` | Business |
| `ideas to increase sales for my online store` | Business |
| `i want to monetize my mobile app` | Business |
| `how to find my first customers` | Business |
| `how do i price my saas product` | Learning* |

> \* `how do i …` reads as **Learning** (a "teach me" signal), not Business. Known,
> acceptable ambiguity — the rewrite is still useful.

## B8. Data & analysis

| Prompt | Expected intent |
| --- | --- |
| `analyze this sales dataset for trends` | Data & analysis |
| `help me build a chart from my csv` | Data & analysis |
| `what insights can i get from this spreadsheet` | Data & analysis |
| `show me trends and insights from my analytics data` | Data & analysis |

## B9. General (fallback)

No strong signal → **General**, 0% confidence.

| Prompt | Expected intent |
| --- | --- |
| `hmm` | General |
| `tell me something interesting` | General |
| `i have a question about my situation` | General |
| `give me your opinion` | General |

---

# PART C — Phrasing variations (goal extraction)

In **Enhance** mode, all of these should detect **Coding** and produce a similar
"todo app in react" task — proving many phrasings collapse to one clean prompt.

- `build a todo app in react`
- `i want to build a todo app in react`
- `i want you to build a todo app in react`
- `can you build a todo app in react`
- `could you please build a todo app in react`
- `i was wondering if you could build a todo app in react`
- `help me build a todo app in react`
- `make me a todo app in react`
- `i need a todo app in react, thanks in advance!`

---

# PART D — Edge cases (must not crash)

| Input | What to check |
|---|---|
| *(empty box)* | Clicking Optimize does nothing; no error |
| ` ` (only spaces) | Treated as empty |
| `fix` | Too vague alone → **General**; no crash |
| `a` | Single char; no crash |
| `WHY IS MY CODE NOT WORKING` (all caps) | Case-insensitive → **Debugging** |
| `Build a REST API. Plan the database schema. Explain JWT auth.` | Mixed signals → picks one intent, no crash |
| A 1000+ word pasted prompt | No freeze; returns a result |

---

# PART E — Extension behaviour checklist

Tick each after a manual run:

- [ ] The ✦ **Optimize** button appears in the chat box once you type, and hides
      when the box is empty.
- [ ] Clicking ✦ with **Apply instantly OFF** shows a **preview panel** with
      before/after tokens and a changes list.
- [ ] **Apply to chat** in the preview replaces the composer text correctly on
      **ChatGPT**, **Claude**, **Gemini**, **Perplexity**, and **Cursor**.
- [ ] **Apply instantly ON** replaces the text directly with no preview.
- [ ] Popup **⤓ From page** pulls the current chat text into the popup.
- [ ] Popup **Copy** copies the optimized text to the clipboard.
- [ ] Toggling **Enhance** changes the next result (cleanup vs structured prompt).
- [ ] Toggling **Show Optimize button** hides/shows the inline ✦ button live
      (no page reload).
- [ ] Settings persist after closing and reopening the popup.
- [ ] `Escape` closes the preview panel; `Cmd/Ctrl+Enter` optimizes in the popup.

---

## Reporting a bug

When something is wrong, capture: **(1)** the exact input, **(2)** the actual
output, **(3)** the expected output, **(4)** the mode (Optimize/Enhance), and
**(5)** the site/surface (popup / ChatGPT / Claude / web). Because PromptOS is
fully deterministic, the same input always reproduces the same output — so a
copy-paste of the input is enough for a developer to reproduce it.
