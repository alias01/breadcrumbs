# breadcrumbs regression scenarios

Not an automated suite — this is a prompt-following skill, there's no deterministic output to assert on. Run these by hand (in a scratch repo) after any edit to `Skill.md` or a step file, before trusting the change. Each scenario lists the prompt to give and what a correct run looks like — if actual behavior diverges, the edit broke something.

## 1. Lite mode, single sitting — no context file expected

**Prompt:** paste a one-line bug report, e.g. "Login button submits twice on double-click, causing duplicate API calls."

**Expect:**
- Classified `lite` (bug fix), stated in one line.
- Step 1 + Step 2 collapse into one message: understanding + task list (≤2 tasks) + "confirm?"
- On confirm: tasks implemented, one commit per task (`fix(...): ...` header), no per-task chat message beyond progress narration.
- One wrap-up message after all tasks, not per-task.
- **No `.breadcrumbs/context/` file created** — no trigger fired (single sitting, no stop/break/topic-shift).
- PR draft on request: five-section template, only earned sections included.

## 2. Full mode, stop signal, resume in a new session

**Prompt A (session 1):** paste a small-feature story (e.g. "add a CSV export button to the reports page"), go through Step 1 confirm → Step 2 confirm → complete one task, then say "let's continue tomorrow."

**Expect (session 1):**
- Classified `full` (small feature), Step 1 and Step 2 gated separately (unless zero Material unknowns).
- Context file created at the stop signal — trip marker shown, backfilled Understanding/Code Plan/Test Plan/Task Checklist/Task Log for the one completed task.
- One commit made for the completed task, Conventional Commits format.

**Prompt B (session 2, fresh context):** "let's continue the CSV export story."

**Expect (session 2):**
- Finds the single matching file in `.breadcrumbs/context/`, reads it, summarizes status back ("here's where this stood... currently at Step 3, task 2 of N").
- Resumes at the next unchecked task — doesn't redo Step 1/2.

## 3. Mid-flight scope change — lite escalates to full

**Prompt:** paste a bug-fix story (lite-eligible), confirm the collapsed Step 1+2, then mid-implementation say "actually this needs to handle the retry case too, not just the double-click" (a scope change, not just a detail).

**Expect:**
- Context file created now if it didn't already exist (mid-flight break trigger), even though this started as lite.
- Escalates lite → full, said in one line.
- Structured Scope Changes entry: date, trigger, before/after, affected tasks, why.
- Current Requirements amended in place (not appended as a duplicate).
- Task Checklist adjusted for the new scope.
- Story continues in the same file — doesn't restart Step 1.

## 4. Project constitution — captured, then enforced

**Prompt A:** mid-story (any full-mode story), state a repo-wide rule: "by the way, every API endpoint in this repo needs a rate limiter, not just this one."

**Expect:**
- Recognized as repo-wide, not story-specific → asks once to save it as a standing rule.
- Confirmed → creates `.breadcrumbs/constitution.md` if missing, appends the rule with rationale + date. **Not** added to `.gitignore` (this file is meant to be committed, unlike per-story context files).

**Prompt B (new story, same repo):** paste an unrelated feature story that adds a new endpoint.

**Expect:**
- Step 2 reads `.breadcrumbs/constitution.md`, checks the plan against it before presenting.
- Plan doesn't already include a rate limiter → surfaced as a conflict, resolved before the plan is presented for confirmation (same handling as the Step 2.2 tripwire).

## 5. Mid-session requirement drop — revert just that task

**Prompt:** mid-story (full mode), after a task implementing some requirement X is already committed, say "actually, requirement X isn't needed — I don't like this implementation, revert it."

**Expect:**
- Recognized as a Step 3.7 trigger (owner invalidates a requirement/assumption, scope changes mid-flight) — context file created now if it doesn't exist yet.
- Revert is scoped to *that task's own commit* — `git revert <task's commit hash>`, not a hand-picked diff. Only possible cleanly because Step 3.6 commits one task per commit; a story implemented as one big commit would force picking lines out of a mixed diff instead.
- Structured Scope Changes entry logged: trigger (owner decided X unnecessary), before (had X), after (X removed), affected tasks, why.
- Current Requirements amended in place — drops X, doesn't leave it contradicting the Task Log.
- Task Checklist updated for the dropped task — **not silently deleted**: the Task Log keeps the record that X was built, then explicitly reverted, and why. A later reader (different session, teammate, different AI) sees a deliberate decision, not a gap that looks like something got forgotten.
- Story continues from the remaining Task Checklist — doesn't restart Step 1/2, doesn't re-touch other tasks' commits.

**Why this matters (not just a mechanical check):** without per-task commits and a Scope Changes log, both halves of this fail silently — the revert boundary is fuzzy (one commit holds several requirements, so reverting requires picking lines by hand and risking scope bleed into unrelated changes), and the reason disappears (a bare `git revert` says *that* something was undone, never *why* — six commits later, "did we forget X or decide against it?" has no answer without re-deriving it from memory).

## 6. PR draft — stacked-branch dependency

**Setup:** in the scratch repo, create and check out a branch off the default branch (e.g. `feature/base`), commit something, then branch again off *that* (e.g. `feature/on-top`) without merging `feature/base` back. Run a small-feature story to completion on `feature/on-top`, reach Step 4.

**Expect:**
- `git merge-base HEAD <default-branch>` isn't `<default-branch>`'s tip → recognized as stacked.
- PR draft includes a **Dependencies** section: names the base branch (`feature/base`), states it needs merging first.
- No other section changes — What/Why/Test/Rollback follow their usual inclusion rules independent of this.

**Contrast check:** re-run a normal story on a branch cut directly from the default branch — **Dependencies** section stays omitted, same as before this change.

## 7. Code Plan / Test Plan split — tests sequenced after code

**Prompt:** paste a small-feature story (e.g. "add a CSV export button to the reports page"), confirm Step 1, reach Step 2.

**Expect:**
- Step 2 gate presents two clearly labeled, separate deliverables — a Code Plan (approach/design, domain checks, rollout if applicable) and a Test Plan (concrete test cases: input, expected output, which acceptance criterion each covers) — not one merged "Plan" narrative.
- Test Plan test cases are designed now, at this gate, not deferred.
- Task Checklist orders any test-writing task(s) after the code task(s) they exercise — never before or interleaved ahead of the code.
- Context file (if triggered) writes `## Code Plan` and `## Test Plan` as separate sections, each individually.
- Confirm → Step 3 implements code tasks first; the test task for a given slice of code isn't executed until that code's task is checked off.

**Contrast check:** re-run a bug-fix (lite) story — Test Plan still exists (per the depth-gate table, "the one regression case that proves the fix is enough"), just collapsed to one line alongside the collapsed Step 1+2 message, not a separate gate.

## 8. Per-task review gate — feedback loop, then waiver

**Prompt A:** run a small-feature story (3+ tasks) through Step 1 and Step 2 confirm, into Step 3.

**Expect (Task 1):**
- After implementing Task 1, before logging/committing it: shown the change for review, stopped, waiting — not narrated-and-moved-on.
- Give feedback (e.g. "rename this variable, and handle the empty-list case") → fixed in place, same task, still uncommitted; updated change re-shown.
- Give feedback again → loops again.
- Say "looks good" (or equivalent) → *then* Task Log entry + checkbox + one commit for Task 1, only now. Only one commit exists for Task 1 despite the two rounds of feedback.
- Moves to Task 2, same gate repeats.

**Prompt B (mid-story):** say "don't ask me between tasks" before Task 3.

**Expect:**
- Waiver acknowledged in one line, applies for the rest of *this* story's tasks (Task 3 onward) — implemented and committed without the per-task stop.
- Context file (if it exists) gets a `Gate Waivers` entry.
- Next new story → gate is back to default (per-task review), waiver didn't carry over.

**Contrast check:** feedback on a task that changes what was agreed (e.g. "actually this should also support X") rather than fixing that task's execution → handled as a Step 3.7 mid-flight break (Scope Changes entry, Current Requirements amended), not folded into the fix-and-loop.

## Cross-cutting checks (verify on any scenario)

- Chat responses stay terse/bullet-fragment, not multi-paragraph.
- No gate skipped, even when lite-collapsed — confirmation still required before moving on.
- `node ~/.claude/skills/breadcrumbs/scripts/validate-context-file.mjs .breadcrumbs/context/<slug>.md` passes after every gate write.
- Every commit header passes `node ~/.claude/skills/breadcrumbs/scripts/validate-commit-message.mjs -m "<header>"`.
