---
name: breadcrumbs
description: Run a user story from a pasted ticket all the way to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — while keeping a persistent context file so the work can resume in a different session or even a different AI platform without losing decisions, assumptions, or progress. Use this whenever a user pastes a user story, ticket, or feature request and wants it implemented, whenever they say "continue" or "resume" on an existing story, whenever scope changes or a test fails mid-implementation and the story needs to be reworked, and whenever they ask for a PR or PR summary. Also trigger if the user says a story got too big to explain, or asks why a past decision was made. Works alongside the ponytail skill for the implementation step.
license: MIT
---

## Core Philosophy

A story never survives reality unchanged: assumptions filled in, scope grows, tests surface edge cases. Fine in isolation → breaks down when nobody (future session, different AI) can reconstruct what was decided, why, what's left.

Four gates (Understand → Plan → Implement → PR), confirmed with the user each time, backed by one persistent file → any session resumes mid-story.

**Why the writes pay off:** reasoning captured at decision-time = cheap. Reconstructed later (reviewer asks why / scope shifts) = expensive, often inaccurate by then. Task Log "Why" = original reasoning, not a retrofit. Scope Changes = only what changed, not the full history re-derived.

## Communication style

Chat only — context file has its own denser style ("Content style" in `context-template.md`). Don't conflate.

Terse, bullet/fragment, glanceable. Senior/expert audience → jargon freely, no hedging, no restating known context, no multi-paragraph narration. Expand only if asked / confusion signaled, then step down in complexity.

## The context file

**Created only on trigger, never by default.** Every story starts stateless: gates run in chat only, nothing on disk. Two triggers create the file:
- **Stop signal** — "let's continue tomorrow," "pause here," or similar → create now, backfill Original Story/Understanding/Plan/Task Checklist from the conversation, at whatever step you're at. Mode/design depth unchanged — this trigger alone doesn't escalate lite → full.
- **Mid-flight break** — test fails, an assumption breaks, scope changes (Step 3.5) → create if it doesn't exist yet, backfill same way, log the Scope Change entry. Lite mode also escalates to full here (more rigor now warranted).

No trigger fires, all four gates finish in one sitting → no file, ever. Expected path, not a skipped step.

**Location once created:** `.claude/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Not committed.** On creation: check `.gitignore` for `.claude/context/` (or broader `.claude/`), add if missing. Working memory, not a project artifact — no reason to exist past PR merge.

**Resuming:** before any story work, check for an existing file. Exists → read it, summarize status back ("Here's where this stood: ... currently at Step X"), resume. Doesn't exist → nothing to resume; story hasn't started, or it's mid-way/finished in an unbroken conversation with no trigger fired yet.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed — trust it.

**Trip marker:** write happens → one line before the gate message naming what was written, e.g. `[context file: wrote Understanding Summary + Assumptions]`. No file yet → no marker, content just shown in chat.

**File structure & guardrails:** see `context-template.md`. Read once, first creation only — not on resume, not if no trigger fires. One guardrail without opening that file: **never skip a gate**, file or no file.

## Lite mode

Auto-detected Step 1.4: `Bug fix` / `Copy/config/content change` → lite. Everything else → full mode, per the four steps below. Single source of truth for what lite changes — steps below aren't separately annotated.

- Step 1 gate + all of Step 2 collapse into one, unconditionally (lite types are always simple enough, no Material/Cosmetic check needed): state approach ("no design" depth) + task list (max 2), one message ending "Here's what I understand and how I'd build it — confirm?" → Step 3.
- Step 3: one wrap-up message after all tasks, not per-task.
- Step 4: PR draft as usual, from the conversation.
- File creation: same triggers as "The context file" above, no lite exception. Scope change / test failure mid-flight → escalates lite → full too, same moment the file's created. Say so in one line.

## The four steps

### Step 1 — Understand & Clarify

1. Read the story. **State back your understanding first**, own words, before asking anything → surfaces most misunderstandings with zero questions.
2. Only then: follow-ups, only on what's genuinely vague — not everything askable in theory.
3. User can't answer either (owner unavailable / genuinely undecided) → don't block. Log under Assumptions w/ reasoning, mark `unconfirmed`. Tell the user it needs owner confirmation before final; proceed anyway.
4. Classify story type now (table in Step 2.1, don't wait for Step 2). `Bug fix` / `Copy/config/content change` = **lite**; everything else = **full**. State the mode, one line.
5. **Tag every open question/assumption**: Cosmetic (naming, location, formatting — wrong guess costs nothing) or Material (data model, API/contract, business logic, security, user-visible behavior — wrong guess = rework). Tag count — **not** step 4's type/size classification — decides the gate below. 10-task "New feature/subsystem," all-Cosmetic → gate merges. "Small feature," one Material unknown → gate stays separate. Task/file count belongs to Step 2.4, not here.
6. **Gate:** file exists → write Understanding Summary + Assumptions to it in one pass, trip marker. No file → present the same content in chat only.
   - **Zero Material unknowns** → fold Step 2 in: do Step 2's work silently, present Understanding Summary + Plan together, one combined confirmation, both quoted verbatim. Regardless of story type/task count.
   - **Any Material unknown remains** (even `unconfirmed`) → summary alone, quoted verbatim, stop. No Step 2 until confirmed.

### Step 2 — Plan

*Lite mode skips this step.* Full-mode + zero Material unknowns (Step 1) → also skips the separate gate, folded into 1.6 instead. Decided purely by the Material count from 1.5 — never type, never task/file count. Large multi-file story, nothing genuinely unknown → merges just as readily as a small one.

1. Classify from the confirmed Understanding Summary (already done, 1.4, for lite-eligible types; do it here otherwise). Ask the user only if genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, 1-3 files | LLD only, skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's restructured |
   | New feature/subsystem | new capability spanning components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix |

2. Discuss the approach at the depth classification calls for: HLD → system-design level (components, data flow, integration points). LLD → key functions/classes/schema. "No design" → name the fix approach, one-two sentences. Not a formal doc — enough to agree the shape before code.
   - **Tripwire:** plan surfaces a Material unknown Step 1 missed → stop, resolve there (ask / log `unconfirmed` per 1.3), before continuing. Applies even when 1+2 merged — a bad merge decision surfaces here, doesn't get built around.
3. Agreed → break into small tasks along natural seams: dependency order first, then component/layer (multi-part work) / file-module boundary (refactors). Scoped right = one Task Log entry (one What + one Why, no "and also"), ≤3 files. Otherwise: split further.
4. Cap total tasks by type — ceiling, not target:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may be "new feature/subsystem" |
   | Refactor | 8 | acceptable upper bound |
   | New feature/subsystem | 10 | **stop, flag** — propose splitting before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more usually means multiple bottlenecks — separate stories |

5. File exists → write story type, design depth, Task Checklist to it, one pass (HLD/LLD notes only if used). No file → stays in chat.
6. **Gate:** trip marker if a write happened. Present plan + task breakdown, quoted verbatim. Stop, wait for confirmation before implementing.

### Step 3 — Implement

1. Work the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call (not mechanical) → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → not a solo call — log under Scope Changes, flag immediately.
3. Apply `ponytail` for how code gets written: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Exceptions still apply — never simplify away input validation, error handling, security, accessibility.
4. After each task — file exists → append Task Log entry, check it off, same write, trip marker. Either way: tell the user what was done, next task without waiting unless interjected. Genuine judgment call → full What/Why block; mechanical → single checklist line (`context-template.md` has both forms). Quote whichever form was written, don't restate. No file, no trigger yet → just narrate progress in chat.
5. Test fails / owner invalidates an assumption / scope changes mid-flight → file-creation trigger (see "The context file") if none exists yet: create it, backfill what's happened, escalate lite→full if applicable. Either way: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update relevant Assumptions/Plan, adjust Task Checklist. Continue in the same file.
6. **Gate:** every task checked off → summarize what was built, stop, wait for confirmation before PR.

### Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: file exists → derive from it (`<Ticket ID/slug>: <imperative summary>`, file header + Understanding Summary). No file → compose the same way from the conversation.
3. Only the sections the type calls for — a bug fix never carries a design section:

   | Type | Sections included |
   |---|---|
   | Bug fix | Root cause, Fix, Test coverage |
   | Copy/config | What changed, Why |
   | Small feature | What was built, Key decisions, Assumptions (if any) |
   | Refactor | What changed structurally, Why, behavior-preservation note |
   | New feature/subsystem | What/Why, HLD summary, Key decisions, Assumptions, Testing |
   | New service/integration | Full set above + integration points, rollback/failure mode notes |
   | Performance | Before/after metric, root cause, fix approach |

4. File exists → pull each section from it, don't re-summarize. No file → derive the same sections from the conversation:
   - What was built ← Task Log "What" entries, concatenated
   - Key decisions ← Task Log "Why" entries
   - Assumptions ← Assumptions section, filtered to what shipped
   - Design context ← Plan section, only if HLD/LLD was used
   - What changed since last PR ← Scope Changes dated after the last PR Summary write (later-update case only)
5. **Cap every section at 2 lines.** Pulled content runs long — compress to the essential point(s), don't truncate mid-sentence. Can't fit without losing something needed → signal the task/decision was too broad, not a reason to break the cap.

   Template:
   ```markdown
   ## <Ticket ID/slug>: <imperative summary>

   **<Section 1>:** <line 1>
   <line 2, only if needed>

   **<Section 2>:** <line 1>
   <line 2, only if needed>
   ```
   Example (bug fix):
   ```markdown
   ## PARK-482: Fix duplicate charge on payment retry

   **Root cause:** Retries omitted an idempotency key, so the provider treated each retry as a new charge.

   **Fix:** Generate one key per order at first attempt; persist and forward it on every retry.

   **Test coverage:** Regression test simulates a retried request and asserts a single charge.
   ```
6. **Show the draft directly in chat, stop there.** Not a file draft awaiting a later write — the deliverable itself. No way to open a PR on GitHub/GitLab/Bitbucket → the chat message *is* the artifact, user copies it into the platform's PR field. Nothing written to the context file here — no later gate reads a stored PR summary back.
7. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
8. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write, chat draft was the whole deliverable.

## What NOT to do

Never skip a gate, even in lite mode — lite collapses which gates exist, never waives confirmation. Full guardrail list: `context-template.md`, read alongside the template on first write.
