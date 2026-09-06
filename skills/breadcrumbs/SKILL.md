---
name: breadcrumbs
description: Run a user story from a pasted ticket to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — keeping a persistent context file so the work resumes in another session or AI platform without losing decisions, assumptions, or progress. Trigger when a user pastes a story, ticket, or feature request to implement; says "continue" or "resume" on a story; changes scope or hits a failing test mid-implementation; asks for a PR or PR summary; says a story got too big; or asks why a past decision was made. Works alongside the ponytail skill for implementation.
license: MIT
---

## Core Philosophy

Four gates (Understand → Plan → Implement → PR), each confirmed by the user, backed by one persistent file so any session resumes mid-story. Reasoning is captured at decision time (Task Log "Why", Scope Changes), never reconstructed later.

## Communication style

Chat: terse, bullet/fragment, glanceable. Senior audience → jargon, no hedging, no restating known context, no narration. Expand only if asked. **Exception:** Step 1's Understanding Summary and questions are plain product language (`step1-understand.md` 1). The context file has its own denser style (`context-template.md`).

## Investigation scope

Search outward from the story's own terms (feature, endpoint, table, component, error) — never a repo survey.

**One retrieval path per question:**
- "Where is X / what does this do" → native code search (semantic index, else grep). Open only the file it points at.
- "What relates to what" (Step 1 dependencies, Step 2 Flow) → `graphify` `query`/`path`/`explain`, only if `graphify-out/` exists — never build mid-story. No graph → follow imports by hand.
- **Subagents:** never for a question native search can phrase. Only for a repo-wide "anything like X?" sweep when the name is unknown — ≤1/story, Explore, read-only, output is leads to re-check, not gate facts. Shown as `agent ×1`; its lookups count toward the cap.

**Cost = turns × context.**
- Independent lookups → parallel calls in one turn. `sleep; tail` → one command.
- Editing a file's tail → `wc -l` + `sed -n` on that region, not a full read. Full-file reads last resort.
- Trim output before it lands: `| tail -5`, `--loglevel=error`, server start → `grep -Ei "started|local:|ready|EADDRINUSE|error"`, `git rev-list --count` over `git log`.
- Quote globs (`--include='*.tsx'`).

**Caps — counted, not felt.** Native lookups ≤4 before the Step 1 gate, ≤3 more before Step 2. Graph ≤2/story, both at Step 2, `--budget 1500`; lite → 0. Never open `GRAPH_REPORT.md` or raw graph JSON. Cap hit, question open → ask. Stop once Step 1's taxonomy is answered or Step 2's Flow is known.

**Investigation marker** before every gate: `[investigation: native search ×3 · graph ×0]`. Every content-opening call counts (`grep`, `sed -n`, `cat`, `find`, Read). Undercounting is worse than over-cap. Lite showing `graph ×1`, or any gate over cap → stop, say why.

## The context file

**Created only on trigger.** Triggers:
- **Stop signal** ("pause here", "continue tomorrow") → create, backfill from the conversation at the current step.
- **Mid-flight break** (test fails, assumption breaks, scope changes, scale regression — Step 3.7) → create if missing, backfill, log the Scope Change. Lite escalates to full.
- **Topic shift** with no stop signal → ask once: "Moving off this story — checkpoint it first?" Yes → as Stop signal. No → don't ask again.
- **Long story checkpoint** — full mode, ≥4 tasks → Step 3 point 0 creates it before task 1 and asks for `/compact`.

No trigger → no file. Expected for lite and short stories.

**Trip marker** before the gate message when a write happened: `[context file: wrote Understanding Summary + Assumptions]`.

**Resuming** (story start, "continue"/"resume") → list `.breadcrumbs/context/` (repo root) first. Empty → stateless. Files → `resume.md`.

**Mechanics** (location, exclusion, cleanup, validators): `context-file-mechanics.md`, read once at first trigger. **Structure + guardrails:** `context-template.md`, read once at first creation. Neither on resume.

**Project constitution** — optional committed `.breadcrumbs/constitution.md` of standing repo-wide rules. Checked at Step 2.8 or the lite gate; rules in `context-file-mechanics.md`.

## Lite mode

Set at Step 1.4: `Bug fix` / `Copy/config/content change` → lite; else full.

- Step 1 gate + Step 2 collapse into one message: approach + task list (≤2) + the check that proves it + `Scale target:` line, ending "Here's what I understand and how I'd build it — confirm?" → Step 3.
- Inline in that message: `Bug fix` → root cause, repro confirmed, same defect looked for elsewhere, regression case named. Either type → constitution check if the file exists.
- Step 3: commit as you go, one wrap-up message after all tasks, no pre-commit review. Verification is not collapsed — 3.4 per task, 3.8 before the wrap-up.
- Step 4: as usual. File triggers: unchanged; Mid-flight break escalates to full, said in one line.

## The four steps

Read the step file at its gate — don't preload.

| Step | File | Gate |
|---|---|---|
| 1 — Understand & Clarify | `step1-understand.md` | Understanding + Assumptions confirmed (folded into 2 if zero Material unknowns) |
| 2 — Plan | `step2-plan.md` | Plan + tasks confirmed (skipped in lite) |
| 3 — Implement | `step3-implement.md` | All tasks verified, tests green, task list reviewed *before* any commit |
| 4 — PR | `step4-pr.md` | PR draft confirmed in chat |

## What NOT to do

Never skip a gate on your own initiative, lite included. **User override:** only an explicit ask waives a gate ("just build it", "don't ask between tasks") — never inferred from terseness or a fast "yes". Then say in one line which gate was waived; file exists → `Gate Waivers`. That gate, this story only.
