---
trigger: model_decision
description: Run a user story from a pasted ticket to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — keeping a persistent context file so the work resumes in another session or AI platform without losing decisions, assumptions, or progress. Trigger when a user pastes a story, ticket, or feature request to implement; says "continue" or "resume" on a story; changes scope or hits a failing test mid-implementation; asks for a PR or PR summary; says a story got too big; or asks why a past decision was made.
---

<!-- GENERATED from skills/breadcrumbs/SKILL.md by scripts/build-platforms.mjs — edit the source, then re-run the script. -->

## Reference files — read on demand

This is a router. Each step's full text, the context-file mechanics, and the file
template live in the repository, not in this file. Read the one you need, from the
repo root, **at the moment you reach that gate** — not up front:

| When | Read |
|---|---|
| Step 1 gate | `skills/breadcrumbs/step1-understand.md` |
| Step 2 gate | `skills/breadcrumbs/step2-plan.md` |
| Step 3 (implementing) | `skills/breadcrumbs/step3-implement.md` |
| Step 4 (PR) | `skills/breadcrumbs/step4-pr.md` |
| First context-file write | `skills/breadcrumbs/context-file-mechanics.md` + `skills/breadcrumbs/context-template.md` |
| Resume (`.breadcrumbs/context/` non-empty) | `skills/breadcrumbs/resume.md` |

No file access, or the files aren't present → say so before the first gate rather
than improvising a step's content. The rules below are the whole contract; the step
files carry the detail that makes them work.

---

## Core Philosophy

Four gates (Understand → Plan → Implement → PR), each confirmed, backed by one file so any session resumes mid-story. Reasoning logged when decided, never reconstructed.

## Communication style

Chat: terse fragments. Senior audience → jargon, no hedging, no restating, no narration. Expand only if asked. **Exception:** Step 1's summary and questions are plain product language (`skills/breadcrumbs/step1-understand.md` 1).

## Investigation scope

Search outward from the story's own terms (feature, endpoint, table, component, error) — never a repo survey.

**One retrieval path per question:**
- "Where is X / what does this do" → native code search (semantic index or grep). Open only the file it points at.
- "What relates to what" (Step 1 dependencies, Step 2 Flow) → `graphify` `query`/`path`/`explain`, only if `graphify-out/` exists — never build mid-story. No graph → follow imports by hand.
- **Subagents:** never for a question native search can phrase. Only a repo-wide "anything like X?" sweep, name unknown — ≤1/story, Explore, read-only, output = leads to re-check, not gate facts. Shown as `agent ×1`; its lookups count toward the cap.

**Cost = turns × context.**
- Independent lookups → parallel, one turn. `sleep; tail` → one command. File tail → `wc -l` + `sed -n`; full reads last resort.
- Trim output before it lands: `| tail -5`, `--loglevel=error`, server start → `grep -Ei "started|local:|ready|EADDRINUSE|error"`, `git rev-list --count` over `git log`. Quote globs (`--include='*.tsx'`).
- **Redundant call guard:** fact already established this story (file unchanged since read, suite green since last change, question answered) → cite it, don't re-fetch. A repeat with no new signal is a failure.
- **Checkpoint, any phase:** ~25 tool calls since the last checkpoint (file created, `/compact`, story start), no gate near → stop, suggest `/compact`; no file → create first (Stop signal). Independent of 3.0/3.8 triggers.

**Caps — counted, not felt.** Native lookups ≤8 before the Step 1 gate, ≤4 more before Step 2. Graph ≤2/story, both at Step 2, `--budget 1500`; lite → 0. Never open `GRAPH_REPORT.md` or raw graph JSON. Cap hit, question open → ask. Stop once Step 1's taxonomy is answered or Step 2's Flow is known.

**Investigation marker** before every gate: `[investigation: native search ×3 · graph ×0]`. Every content-opening call counts (grep, sed -n, cat, find, Read). Undercounting is worse than over-cap. Lite showing `graph ×1`, or any gate over cap → stop, say why.

## The context file

**Created only on trigger:**
- **Stop signal** ("pause here", "continue tomorrow") → create, backfill at the current step.
- **Mid-flight break** (test fails, assumption breaks, scope changes, scale regression — 3.7) → create if missing, backfill, log the Scope Change. Lite escalates to full.
- **Topic shift**, no stop signal → ask once: "Moving off this story — checkpoint it first?" Yes → Stop signal. No → don't re-ask.
- **Long story** — full mode, ≥4 tasks → 3.0 creates it before task 1, asks for `/compact`.
- **Step command** — `bc understand` / `plan` / `build` always write it (next may be a fresh session).

No trigger → no file. **Trip marker** before the gate message when written: `[context file: wrote Understanding Summary + Assumptions]`.

**Resuming** (story start, "continue"/"resume") → list `.breadcrumbs/context/` (repo root) first. Empty → stateless. Files → `skills/breadcrumbs/resume.md`.

**Mechanics** (location, exclusion, cleanup, validators): `skills/breadcrumbs/context-file-mechanics.md`, once at first trigger. **Structure:** `skills/breadcrumbs/context-template.md`, once at first creation. Neither on resume. **Constitution** — optional committed `.breadcrumbs/constitution.md`, standing repo-wide rules; checked at 2.8 or the lite gate (`skills/breadcrumbs/context-file-mechanics.md`).

## Lite mode

`Bug fix` / `Copy/config/content change` (1.4) → lite; else full.
- Step 1 gate + Step 2 = one message: approach + tasks (≤2) + proving check + `Scale target:`, ending "Here's what I understand and how I'd build it — confirm?" → Step 3. Bug fix adds root cause, repro confirmed, same defect elsewhere, regression case; either type → constitution check.
- Step 3: commit as you go, one wrap-up, no pre-commit review. Verification not collapsed — red/green per task (3.4), 3.8 before wrap-up.
- Mid-flight break escalates to full, said in one line.

## The four steps

Read the step file at its gate — don't preload.

| Step | File | Gate |
|---|---|---|
| 1 — Understand | `skills/breadcrumbs/step1-understand.md` | Understanding + Assumptions confirmed (zero Material unknowns → folds into 2) |
| 2 — Plan | `skills/breadcrumbs/step2-plan.md` | Plan + tasks confirmed (lite: skipped) |
| 3 — Implement | `skills/breadcrumbs/step3-implement.md` | All tasks verified, tests green, reviewed *before* any commit |
| 4 — PR | `skills/breadcrumbs/step4-pr.md` | PR draft confirmed in chat |

## Step commands

`/breadcrumbs` runs all four. Each step also has a command: one step, never auto-advances; names the next only once its own gate is answered — running it *is* the confirmation. `/bc-plan` (Claude Code, Cursor, Windsurf), `/bc:plan` (Gemini), else say "bc plan".

| Command | Runs | Needs | Next |
|---|---|---|---|
| `bc understand` | Step 1 + file | — | `bc plan` (lite: `bc build`) |
| `bc plan` | Step 2 + file | confirmed Understanding | `bc build` |
| `bc build` | 3.0–3.7 + file, no commits | Plan + Checklist | `bc review` (lite: `bc pr`) |
| `bc review` | 3.8 gate | all tasks ticked | `bc pr` |
| `bc pr` | Step 4 | story commits (non-breadcrumbs branch ok) | — |

Also: `bc resume` → `skills/breadcrumbs/resume.md` · `bc status` → one line (story, step, next), no lookups/write · `bc pause` → Stop signal + `/compact` · `bc why <x>` → quote the logged entry · `bc rule <text>` → constitution append. **Needs** from file, else conversation; missing → one line + the command that produces it, proceed only on explicit "go" (= gate waiver).

## What NOT to do

Never skip a gate on your own initiative, lite included. **User override:** only an explicit ask waives a gate ("just build it", "don't ask between tasks") — never inferred from terseness or a fast "yes". Say in one line which gate was waived; file exists → `Gate Waivers`. That gate, this story only.
