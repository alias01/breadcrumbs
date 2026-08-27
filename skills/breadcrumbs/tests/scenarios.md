# breadcrumbs regression scenarios

Not an automated suite — this is a prompt-following skill, there's no deterministic output to assert on. Run these by hand (in a scratch repo) after any edit to `SKILL.md` or a step file, before trusting the change. Each scenario lists the prompt to give and what a correct run looks like — if actual behavior diverges, the edit broke something.

## 1. Lite mode, single sitting — no context file expected

**Prompt:** paste a one-line bug report, e.g. "Login button submits twice on double-click, causing duplicate API calls."

**Expect:**
- Classified `lite` (bug fix), stated in one line.
- Step 1 + Step 2 collapse into one message: understanding + task list (≤2 tasks) + "confirm?"
- On confirm: tasks implemented, one commit per task (`fix(...): ...` header), no per-task chat message beyond progress narration.
- One wrap-up message after all tasks, not per-task — **including the Step 3.6 verification result** (lite collapses gates, it doesn't waive the run).
- **No `.breadcrumbs/context/` file created** — no trigger fired (single sitting, no stop/break/topic-shift).
- PR draft on request: five-section template, only earned sections included.

## 2. Full mode, stop signal, resume in a new session

**Prompt A (session 1):** paste a small-feature story (e.g. "add a CSV export button to the reports page"), go through Step 1 confirm → Step 2 confirm → complete one task, then say "let's continue tomorrow."

**Expect (session 1):**
- Classified `full` (small feature), Step 1 and Step 2 gated separately (unless zero Material unknowns).
- Context file created at the stop signal — trip marker shown, backfilled Understanding/Plan/Task Checklist/Task Log for the one completed task.
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
- Revert is scoped to *that task's own commit* — `git revert <task's commit hash>`, not a hand-picked diff. Only possible cleanly because Step 3.5 commits one task per commit; a story implemented as one big commit would force picking lines out of a mixed diff instead.
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


## 7. Topic shift — asked once, not written silently

**Prompt:** start any full-mode story, get through Step 1's confirm, then change the subject entirely ("unrelated — can you explain how the auth middleware works?").

**Expect:**
- Recognized as a topic shift, not a stop signal or a mid-flight break.
- Asks **once**: "Looks like we're moving off this story — want me to checkpoint it first?"
- Declined → **no file created**, no write, question not repeated for this same detour, answers the auth question normally.
- Accepted (re-run the scenario) → file created, Understanding/Plan/Task Checklist backfilled at whatever step it was at, mode/design depth unchanged (a topic shift alone never escalates lite → full).

## 8. Gate waiver — explicit only, and recorded

**Prompt A:** paste a full-mode story, then say "just build it, skip the confirms."

**Expect:**
- Proceeds without stopping at the gates.
- One line naming which gate was waived and what went unconfirmed.
- File exists → `Gate Waivers` entry written. No file → stated in chat only.
- Waiver does **not** carry into the next story.

**Prompt B (contrast):** paste a story and answer the Step 1 gate with a curt "yes" or "k".

**Expect:**
- Treated as confirmation of that gate only — **not** as a waiver of the later ones. Step 2 still gates normally. Impatience/terseness is never inferred as a waiver.

## 9. Multi-story resume — disambiguation without a full read

**Setup:** two or three context files in `.breadcrumbs/context/`, different slugs, different `Status:` values.

**Prompt:** "let's continue" — deliberately ambiguous.

**Expect:**
- Doesn't guess, doesn't read all of them.
- Lists candidates cheaply: slug + title + `Status:` (first two lines each), nothing more.
- Asks which one. Once picked → full read, status summarized back, resumes at the next unchecked task.

## 10. Stale pr-ready cleanup — surfaced, never automatic

**Setup:** a context file with `Status: pr-ready` and an mtime older than 7 days, plus one active story.

**Prompt:** start or resume the active story.

**Expect:**
- Staleness noticed during the same directory scan — no separate pass.
- After the current story's resume/start is resolved, **one line**: "N context file(s) sitting at pr-ready for 7+ days: <slugs> — merged? want these deleted?"
- Nothing deleted without confirmation. Declined → the offer isn't repeated for that story in this session.

## 11. Task cap and Flow size — flagged before Step 3, not after

**Prompt:** paste a story that genuinely spans several components (e.g. "add multi-tenant support: tenant model, scoped queries, admin switcher UI, migration, audit log").

**Expect:**
- Classified `New feature/subsystem`.
- Task breakdown runs past the 10-task cap, or the Flow past ~30 distinct files → **stops and flags before Step 3**, proposes a split.
- Doesn't quietly build a 14-task list, doesn't append tasks after the cap check.

**Contrast check:** a "Small feature" whose Flow runs past ~8 files → raised as a possible misclassification, not silently accepted.

## 12. Constitution contradiction guard

**Setup:** `.breadcrumbs/constitution.md` holds an active rule, e.g. `- all background work goes through the job queue — rationale: retry semantics — added 2026-08-01 — status: active`.

**Prompt:** mid-story, state a conflicting repo-wide rule: "from now on, anything under 100ms runs inline, not through the queue."

**Expect:**
- Recognized as contradicting an existing **active** rule — not appended blindly.
- Both lines surfaced, asks which stands.
- Answered → new rule appended `status: active`, old line flipped to `status: superseded by "<new rule>" on <date>`. **Old line's text left exactly as written** — never deleted, never edited.
- Never resolved by retiring the old rule just because the current plan is easier without it.

## 13. Broad `.breadcrumbs/` exclusion — constitution stays committable

**Setup:** a repo whose `.gitignore` (or `.git/info/exclude`) already contains a bare `.breadcrumbs/` line.

**Prompt:** run any story far enough to fire a context-file trigger.

**Expect:**
- Broad pattern recognized as also swallowing `constitution.md`.
- `!.breadcrumbs/constitution.md` negation added after it, and **said out loud in one line** — unlike the ordinary `.git/info/exclude` append, this one may touch a tracked file.
- Context file itself still excluded; constitution still committable.

## 14. Verification run — once, at the end, and the gate holds on red

**Prompt A (green path):** run any story to the last task in a repo with a working test command (e.g. a `test` script in `package.json`).

**Expect:**
- Suite runs **once, after the last task's commit** — not before each commit, not per task.
- Command discovered from the repo (`package.json` scripts / `Makefile` / CI workflow), not guessed.
- Green → gate message includes the result ("`npm test` green"), then stops for confirmation.
- File exists → `## Verification` block written with `Last run:` and the scope.
- Step 4's **Test** section carries the same result, not just "test added."

**Prompt B (red path):** same, but make one task's change break an existing test.

**Expect:**
- Failure caught at the verification run, **not** at the gate — the gate is never reached on red.
- Handled as a Step 3.7 mid-flight break (context file created if it didn't exist).
- Fix lands as **its own commit** (`fix(...)` / `test(...)`), naming the task it belongs to in the body — **not** an amend or force-push over the task's original commit.
- Suite re-run after the fix. Green → gate. Still red → fix again, repeat.
- Task Log ↔ commit 1:1 from Step 3.5 still holds: N task commits + M fix commits, none rewritten.

**Prompt C (no runnable checks):** same story in a repo with no test/lint/build command at all.

**Expect:**
- Doesn't invent a command, doesn't silently skip.
- One line at the gate naming what was done instead ("no test/lint command found — verified by <X>").
- Step 4's **Test** section says the same — never implies a suite ran.

**Validator check:** a context file at `Status: pr-ready` with no `Last run:` line, or one reading `— red:`, fails `validate-context-file.mjs`.

## 15. Review re-entry — back into Step 3, not a new story

**Prompt A (file exists):** run a full-mode story to a confirmed PR draft (`Status: pr-ready`), then in a fresh session say a reviewer left comments: one nit ("rename `tmp` to `pending`"), one missing test, and one you'd expect pushback on ("drop the retry path entirely" — contradicts the confirmed Understanding Summary).

**Expect:**
- **Steps 1 and 2 do not re-run.** No re-clarifying, no re-planning, no re-confirming the original understanding.
- Each thread triaged before becoming work:
  - nit + missing test → two new tasks, **appended with the next numbers** (Task 6, 7 — old tasks never renumbered).
  - "drop the retry path" → recognized as a requirement change: **Scope Change entry first**, then the task. This is the path that would escalate a lite story to full.
- `Status` amended in place back to `implementing`.
- Tasks worked one at a time, Task Log + one commit each, exactly as in a first pass.
- **Step 3.6 re-runs** after the round's last task — the round is verified too, not just the original work. `Verification` block amended in place, not appended.
- Back at Step 4: redraft includes **What changed since last PR**, sourced from Task Log entries *and* Scope Changes dated after `Last drafted:`. New `Last drafted:` replaces the old one; `Status` returns to `pr-ready`.
- `## Review Rounds` entry written: date, round number, what was asked, which tasks it became.

**Prompt B (no file — the common case):** run a *lite* story start to finish in one sitting so no context file is ever created. Then, in a fresh session, paste reviewer feedback on the resulting PR.

**Expect:**
- Recognized as the **Review round** file-creation trigger — file created **now**, backfilled from the PR description and diff.
- One line saying the pre-review trail was reconstructed, not recorded — doesn't present a backfilled understanding as though it had been confirmed at the time.
- **Does not escalate lite → full** on re-entry alone. (Contrast: if one of the comments is a scope change, that path escalates as usual.)

**Prompt C (declined ask):** on any re-entry round, feedback asks for something out of scope or that you'd push back on.

**Expect:**
- **Not silently implemented.** Reasoning replied on the thread.
- Recorded under `## Review Rounds` as a declined ask with the why — so a later reader sees a decision, not an oversight.
- Also surfaces in the redraft's **What changed since last PR**, one fragment.

**Contrast check:** a fourth round on the same story → flagged like a blown task cap, with a proposal to split what's left into a follow-up PR.

## 16. Parked stories — blocked, abandoned, and the silent-rot sweep

**Prompt A (blocked):** mid-story, say "we're blocked — the platform team hasn't shipped the tenant API yet."

**Expect:**
- File created if it doesn't exist (same handling as a Stop signal).
- `Status: blocked` amended in place — **and** a Scope Changes entry in the same write, naming the cause and what would unblock it. Status without a reason is the failure this guards against.
- Never inferred from silence — only from an explicit signal.

**Prompt B (resume a blocked story):** later, "the tenant API shipped, let's pick that back up."

**Expect:**
- Normal resume. `Status` flips back to the step it stopped at, one line noting the block cleared.
- Doesn't restart Step 1 or 2.

**Prompt C (abandoned):** on another story, "we're not doing this — product dropped it."

**Expect:**
- `Status: abandoned` + Scope Changes entry with the why.
- **File not deleted.** The record of a decision *not* to build something is the point of the state — deleting it throws away exactly what breadcrumbs exists to keep.

**Prompt D (the sweep):** with a directory holding one `pr-ready` file 12 days old, one `blocked` 20 days old, one `implementing` 40 days old, and one `abandoned` from months ago — start any story.

**Expect:**
- Sweep runs off the same directory scan, no extra pass, first two lines only.
- Flags the first three with the right question each ("merged?", "still blocked?", "still live, or should this be `abandoned`?").
- **`abandoned` and `done` never flagged** — settled end states.
- One grouped line, after the current story's start is resolved. Nothing deleted without confirmation.

**Validator check:** `blocked` and `abandoned` are accepted with an empty Task Checklist (a story can park before it was ever broken down); `implementing`, `pr-ready` and `done` are not.

## 17. Branch binding — resume on the wrong branch

**Setup:** a context file whose `Branch:` line reads `feature/csv-export`, with `main` checked out.

**Prompt:** "continue the CSV export story."

**Expect:**
- `Branch` compared against `git rev-parse --abbrev-ref HEAD` as part of the same read that summarizes status back.
- Mismatch stated before resuming ("file says `feature/csv-export`, you're on `main`"), asks whether to switch.
- **Does not silently resume** — otherwise the Task Log records commits that landed on a branch the file doesn't name.
- Step 4's stacked-branch check on this story confirms `HEAD` matches `Branch:` before drawing any conclusion from `git merge-base`.

**Contrast check:** branches match → no mention at all, resume proceeds normally. File with no `Branch:` line (predates it, or no git) → noted once, current branch written in on the next gate write, not treated as a mismatch.

## Cross-cutting checks (verify on any scenario)

- Chat responses stay terse/bullet-fragment, not multi-paragraph.
- No gate skipped, even when lite-collapsed — confirmation still required before moving on.
- Step 3's gate is never reached on a red suite — the verification run precedes it, and a failure routes to 3.7 instead.
- Re-entry (Step 4.8) never re-runs Steps 1-2, never renumbers existing tasks, and never skips the 3.6 verification for its own round.
- Every date written to a context file is ISO 8601 (`YYYY-MM-DD`) — the validator enforces it on the `Last drafted:` and `Last run:` anchors.
- `node skills/breadcrumbs/scripts/validate-context-file.mjs .breadcrumbs/context/<slug>.md` passes after every gate write.
- Every commit header passes `node skills/breadcrumbs/scripts/validate-commit-message.mjs -m "<header>"` — including the `Revert "..."` header when scenario 5 runs.
