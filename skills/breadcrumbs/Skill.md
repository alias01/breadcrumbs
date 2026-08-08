---
name: breadcrumbs
description: Run a user story from a pasted ticket all the way to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — while keeping a persistent context file so the work can resume in a different session or even a different AI platform without losing decisions, assumptions, or progress. Use this whenever a user pastes a user story, ticket, or feature request and wants it implemented, whenever they say "continue" or "resume" on an existing story, whenever scope changes or a test fails mid-implementation and the story needs to be reworked, and whenever they ask for a PR or PR summary. Also trigger if the user says a story got too big to explain, or asks why a past decision was made. Works alongside the ponytail skill for the implementation step.
license: MIT
---

## Core Philosophy

A user story rarely survives contact with reality unchanged — assumptions get filled in, owners clarify things later, tests surface edge cases, scope grows. None of that is a problem by itself. The problem is when it happens across many disconnected rounds and nobody — including a future Claude session, or a different AI entirely — can reconstruct what was decided, why, or what's actually left to do.

This skill runs the work through four gates (Understand → Plan → Implement → PR), confirming with the user at each gate, and keeps everything in one persistent, resumable file so the next session can pick up mid-story like nothing was lost.

**Why the extra writes are worth it:** capturing a decision's reasoning at the moment it's made costs a little now; reconstructing it later — when a reviewer asks "why is this written this way?" or scope shifts and someone has to figure out what's still true — costs a lot more, and often can't be done accurately at all once the reasoning has faded from anyone's memory. The overhead buys point-in-time traceability, not just resumability: the Task Log's "Why" is the original reasoning, not a retrofit, and the Scope Changes log means a mid-flight pivot only has to state what changed, not re-derive the current state from scratch.

## The context file

**Location:** `.claude/context/<story-slug>.md` in the repo root, where `<story-slug>` is a short kebab-case id derived from the ticket ID or title.

**Not committed.** On first use, check `.gitignore` for `.claude/context/` (or a broader `.claude/` entry) and add it if missing. This file is working memory for the story, not a project artifact — it has no reason to exist once the PR is merged.

**Resuming:** at the start of any story-related work, check whether a context file for it already exists before doing anything else. If it does, read it, summarize the current status back to the user ("Here's where this stood: ... currently at Step X"), and resume from there instead of restarting. This is what makes cross-session and cross-platform resume work — any Claude reading this file has everything it needs.

**Cleanup:** once the user confirms the PR is merged, offer to delete the context file. Don't delete it unprompted.

**Efficiency:** each gate touches the context file with a single write — batch every section update for that gate (including the first-use `.gitignore` check/add) into one pass rather than separate read-then-write round trips. Don't re-read the file afterward to confirm a write landed; trust it. Every round trip to the file has a real cost, so collapsing multiple small writes into one matters more than any single message's wording.

**Trip marker:** immediately before each gate message, emit a one-line marker naming what was just written — e.g. `[context file: wrote Understanding Summary + Assumptions]` — so the user can see exactly when a round trip to the file happened, without needing its full content repeated to show that.

**File structure & full guardrail list:** see `context-template.md` in this skill's directory. Read it once — the first time you create a context file for a story (Step 1, first write) — not on every resume and not for lite-mode stories, which skip the file entirely. The one guardrail worth carrying at all times without needing to open that file: **never skip a gate.**

## The four steps

### Step 1 — Understand & Clarify

1. Read the story. **State back what you understand first** — in your own words, before asking anything. This surfaces most misunderstandings without needing a question.
2. Only then ask follow-up questions, and only about what's genuinely vague or ambiguous — not everything that could theoretically be asked.
3. If the user can't answer something either (owner isn't available, genuinely undecided), don't block — log it under Assumptions with your reasoning and mark it `unconfirmed`. Tell the user it'll need confirming with the story owner before it's final, but proceed.
4. Classify the story type now, using the table in Step 2.1 — don't wait for Step 2. If it's `Bug fix` or `Copy/config/content change`, this story is **lite**: Understand and Plan collapse into one gate, and the context file is skipped entirely. Every other type is **full**: separate gates, context file as described above. Say which mode out loud when you state it (one line is enough) so the user isn't surprised later.
5. **Full mode gate:** write the Understanding Summary and Assumptions to the context file in one pass (see Efficiency above — this is also where the first-use `.gitignore` check/add happens). Emit the trip marker, then present the summary — quote it verbatim rather than restating it — and stop. Do not move to Step 2 until the user explicitly confirms it's right.
6. **Lite mode gate:** no file write. In the same message, work out the fix/change approach (these two types always use the "no design" depth from Step 2's table) and the task list (max 2 tasks, per the Step 2 cap), then present one combined message — restated understanding plus the task list — closing with "Here's what I understand and how I'd build it — confirm?" Stop there. This one gate replaces both the Understand gate and the Plan gate; proceed straight to Step 3 once confirmed.

### Step 2 — Plan

*Lite-mode stories skip this step* — classification, approach, and task list were already produced and confirmed together in Step 1.6.

1. Classify the story from the confirmed Understanding Summary before designing anything (already done in Step 1.4 for lite-eligible types; do it here for everything else). Don't ask the user unless the type is genuinely ambiguous.

   | Type | Signal | Design depth |
   |---|---|---|
   | Bug fix | reported defect, "should do Y but does Z" | No HLD/LLD — root cause + fix approach only |
   | Copy/config/content change | text, labels, flags, env values, constants | No design — straight to task list |
   | Small feature addition | new behavior in existing architecture, touches 1-3 files | LLD only (functions/schema touched) — skip HLD |
   | Refactor/tech debt | no behavior change, restructuring | LLD only, scoped to what's being restructured |
   | New feature/subsystem | new capability spanning multiple components | Full HLD + LLD |
   | New service/integration | new external dependency, new cross-system data flow | Full HLD + LLD, mandatory |
   | Performance/optimization | latency, resource usage, scaling | No design doc — profiling findings + targeted fix approach |

2. Discuss the implementation approach with the user at the design depth the classification calls for: system design level (components, data flow, integration points) only for types that need HLD; key functions/classes/schema changes for types that need LLD; for "no design" types, skip straight to naming the fix approach in a sentence or two. This doesn't need to be a formal document, just enough that both of you agree on the shape before code gets written.
3. Once the approach is agreed, break it into small tasks along natural seams — dependency order first (foundational pieces before consumers), then by component/layer for multi-part work or by file/module boundary for refactors. A task is scoped right when it can be described as one Task Log entry (one What + one Why, no "and also") and touches at most 3 files; if it can't, split it further.
4. Cap the total task count by story type — this is a ceiling, not a target:

   | Type | Max tasks | If exceeded |
   |---|---|---|
   | Bug fix / copy-config | 2 | flag — likely misclassified |
   | Small feature | 5 | reconsider — may actually be a "new feature/subsystem" |
   | Refactor | 8 | acceptable as upper bound |
   | New feature/subsystem | 10 | **stop and flag to the user** — propose splitting into multiple stories before Step 3 |
   | New service/integration | 10 | same — flag before implementing |
   | Performance | 5 | more than that usually means multiple distinct bottlenecks — treat as separate stories |

5. Write the story type, chosen design depth, and Task Checklist to the context file in one pass (include the HLD/LLD notes only if that depth was actually used).
6. **Gate:** emit the trip marker, then present the plan and task breakdown — quoted verbatim rather than restated — stop, and wait for explicit confirmation before implementing.

### Step 3 — Implement

1. Work through the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Make the calls that are needed — use best judgment, and if a call is genuinely a judgment decision (not just mechanical), log it in the Task Log as part of that task's "Why." If something comes up that's not a coding judgment call but changes what was agreed (contradicts the plan, requires a scope decision), that's not a decision to make alone — log it under Scope Changes and flag it to the user immediately rather than pushing through silently.
3. Apply the `ponytail` skill for how code gets written during this step — simplest thing that works, standard library and existing dependencies before new code, no unrequested abstractions. Its usual exceptions still apply here too: never simplify away input validation, error handling, security, or accessibility.
4. **Full mode:** after each task, append a Task Log entry and check off the task in the same write, emit the trip marker, then tell the user what was done, then move to the next task without waiting for a response, unless the user interjects. Use the full What/Why block only for tasks where a genuine judgment call was made (per 3.2); log purely mechanical tasks as a single checklist line instead — see `context-template.md` for both forms. Quote whichever form you wrote rather than restating it.
   **Lite mode:** no file writes per task (there is no file). Work through the (at most 2) tasks, then give one wrap-up message covering both before moving to Step 4.
5. If a test fails, the owner clarifies something that invalidates an assumption, or scope changes mid-flight:
   - **Full mode:** treat it as a fresh mini-cycle — add a structured entry under Scope Changes (date, trigger, before/after, affected tasks, why), amend Current Requirements in place to reflect the new state, update the relevant Assumptions/Plan sections, adjust the Task Checklist (add/modify tasks) rather than starting a new file, and continue.
   - **Lite mode — upgrade path:** a lite story is a bet that nothing like this happens. If it does, the bet's off: create the context file now, backfilling Original Story, Understanding Summary, Plan, and Task Checklist from the conversation so far, then log the Scope Change entry as above and continue the rest of the story in full mode from this point on. Tell the user in one line that you're switching to full tracking and why. Don't try to carry a scope change in chat memory alone — that's the exact failure mode the context file exists to prevent.
6. **Gate:** once every task is checked off, summarize what was built and stop — wait for confirmation before moving to PR.

### Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Derive the title from the context file, don't compose it fresh: `<Ticket ID/slug>: <imperative summary>`, taken from the file header and Understanding Summary.
3. Include only the sections the story type calls for — don't carry a design section a bug fix never had:

   | Type | Sections included |
   |---|---|
   | Bug fix | Root cause, Fix, Test coverage |
   | Copy/config | What changed, Why |
   | Small feature | What was built, Key decisions, Assumptions (if any) |
   | Refactor | What changed structurally, Why, behavior-preservation note |
   | New feature/subsystem | What/Why, HLD summary, Key decisions, Assumptions, Testing |
   | New service/integration | Full set above + integration points, rollback/failure mode notes |
   | Performance | Before/after metric, root cause, fix approach |

4. **Full mode:** pull each section's content from the context file instead of re-summarizing it:
   - What was built ← Task Log "What" entries, concatenated
   - Key decisions ← Task Log "Why" entries
   - Assumptions ← Assumptions section, filtered to ones relevant to what shipped
   - Design context ← Plan section, only if that story type used HLD/LLD
   - What changed since last PR ← Scope Changes entries dated after the last PR Summary write (later-PR-update case only — diff against the last PR Summary, not the full history)

   **Lite mode:** there's no file to pull from — derive sections directly from the chat conversation and the actual diff. The section list is already minimal for the two lite-eligible types (bug fix: 3 sections; copy/config: 2), so this is normally a couple of sentences, not a rewrite of anything.
5. **Cap every section at 2 lines.** Pulled content (concatenated Task Log entries, multiple assumptions) is almost always longer than that — compress to the most essential point(s) rather than truncating mid-sentence. If a section genuinely can't fit in 2 lines without losing something a reviewer needs, that's a signal the underlying task/decision was too broad, not a reason to break the cap.

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
6. **Show the draft directly in chat and stop there.** This isn't a file draft awaiting a later write — it's the deliverable itself. Claude has no way to actually open a PR on GitHub/GitLab/Bitbucket, so the chat message *is* the final artifact: the user copies it straight into the platform's PR description field. Nothing about this step gets written to the context file — there's no later gate that reads a stored PR summary back out the way Plan reads Understanding or Implement reads the Task Checklist.
7. **Gate:** let the user confirm or request changes, iterating in chat only, until they're happy with what they'll paste.
8. **Full mode:** once confirmed, write a single line to the PR Summary section: `Last drafted: <date>`. This is not a copy of the text — it exists only so a later PR update on the same story knows what date to diff Scope Changes against. Update Status to `pr-ready` in the same pass. Emit the trip marker.
   **Lite mode:** nothing to write — there's no file, and no later PR-update case for a story that never crossed the scope-change threshold.

## What NOT to do

Never skip a gate, even in lite mode — lite collapses which gates exist, it doesn't waive confirmation. The full guardrail list lives in `context-template.md`; read it alongside the template on first write.
