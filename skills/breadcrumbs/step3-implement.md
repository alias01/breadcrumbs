# Step 3 — Implement

1. Work the Task Checklist one task at a time. **Zero chat output per task — not even an end-of-task message.** Edit, verify, task-log write, commit all run back to back in silence: no lead-in ("starting task N"), no running commentary ("verifying now", "typecheck clean", "committing"), no end-of-task summary either. This isn't deferred narration for its own sake — it's deferred to a *review*, not a report: point 8's gate replays every task's actual commit for approval before the story reaches PR, which is where "what changed and why" actually needs to land for the user to catch deviation, not scattered across turns they'd have to remember to compare against a diff later. The one exception is point 7 — a test failure, invalidated assumption, scope change, or perf/scale regression is flagged the moment it's found, in real time, never held for the replay.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → log under Scope Changes, flag immediately.
3. Apply `ponytail`: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Never simplify away input validation, error handling, security, accessibility, or holding the story's scale target — "works" means at that scale, not on the dev fixture. "Current scale assumed" → don't make the path worse than today.
4. **Verify before checking the task off.** A task is done when something demonstrates it works, not when the code is written.
   - Run the cases Step 2.4 mapped to this task (lite → the check named at the collapsed gate). Nothing mapped → run the repo's own fast checks over what you touched (existing test file, typecheck, lint) and name which.
   - Nothing executable (copy change, doc edit) → say so, plus what you inspected instead. Valid verdict; silence isn't.
   - Fails → not a checkoff. Fix, re-run. Still fails and the cause is the plan → point 7's Mid-flight break, not a checkoff with a caveat.
   - **Self-review, same pass:** re-read your diff against the task's Why and the plan — leftover scaffolding, a TODO standing in for the fix, a workaround where root cause was the point, an unasked-for abstraction. Fix now, don't present it.
   - **Scale scan, same pass:** read the diff for patterns that break under growth — a query/network call per item of a growing collection, unbounded load into memory, a new query path with no pagination or index, synchronous work on a hot path. Trivial, in scope → fix now, note in `Verified:`. Not trivial, or the diff can't hold the target → **not a checkoff**: point 7's perf regression trigger. Clean → say nothing.
   - Outcome goes into the Task Log as `Verified:` — what ran, what it showed. Step 4's **Test** section comes from this field only.
5. **Standing manual-edit review** — before each task, and on resume: `git status` / `git diff HEAD` over the story's files. Any change you didn't make is a user hand-edit. Review it, one line (`Check:`): correct against the task's Why and the plan, or issue found (what, where). File not on the story's Flow (Step 2.6) → say so first, one line, non-blocking ("that file's outside this story's planned Flow — [reason if evident]"). A review, not a veto: the edit stands unless it breaks something; say so rather than silently re-editing.

   After each task — file exists → append Task Log entry (`Verified:` included), check it off, same write, trip marker. Three forms (`context-template.md`): judgment call → full What/Why block; mechanical → single checklist line; user hand-edit → checklist line + `Check:` verdict (+ `Flow:` line if off-plan). No file → hold the same content (What/Why, Verified, any `Check:`/`Flow:` line) as a private note for point 8's replay to draw on; either way, nothing is sent to the user now — move straight to the next task per point 1. An edit that *breaks* something is never held for later: that's point 7's Mid-flight break, flagged immediately.

   **Learning from the edit:** hand-edit reflects a repo-wide preference, not a one-off fix (consistently strips comments a certain way, always adds a specific guard, renames a pattern the same way) → ask once: "Noticed you always change X to Y — save that as a standing project rule?" Confirmed → append to `.breadcrumbs/constitution.md` (format in `context-file-mechanics.md`), apply from the next task onward. Declined → don't ask again for this pattern. Story-specific edit → no ask. Same ask covers a correction the user only *says*, when it repeats or is plainly repo-wide ("we never do X here").
6. **Commit each task**, right after its Task Log write, before the next task. One commit per task — mirrors the Task Log 1:1, each commit carrying that task's own Why. No curiosity checks first — don't run `git branch --show-current`, `git log`, or similar state-checks just to confirm or narrate what's already known; commit straight off the Task Log write. Same rule for every shell call in this step: run it only if the next action actually depends on the answer.

   Conventional Commits: `<type>(<scope>): <imperative summary>`. Scope = affected module/area, omit if obvious. Body = short bullets from the task's What/Why — compressed, not the Log entry verbatim.

   | Type | Use for |
   |---|---|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation |
   | `style` | Formatting, no logic change |
   | `refactor` | No behavior change |
   | `perf` | Behavior unchanged, speed/memory improved |
   | `test` | Adding/modifying tests |
   | `chore` | Maintenance, tooling, deps |
   | `revert` | Undoing a task's commit (point 7 owner drop / Scope Change) — `revert(<scope>): <what was undone>`, reverted hash in the body |

   Reverting a task → `git revert <that task's commit>`, then rewrite the header to the `revert` form (git's default `Revert "..."` fails the validator); the reason goes in the body, from the Scope Changes entry.

   Scope change mid-task → still one commit once it lands; type reflects what actually shipped.

   Before `git commit`, check the header with `validate-commit-message.mjs` (resolve per "Validator scripts" in `context-file-mechanics.md`); not found → check by hand against the table, don't block.
7. Test fails / owner invalidates an assumption / scope changes / **perf or scale regression surfaces** (a planned case slows, or point 4's scan finds a pattern that won't hold) → Mid-flight break trigger (`SKILL.md`). Once handled: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update Assumptions/Plan, adjust Task Checklist. Perf case: tell the user immediately, one line — what regressed, against which target, what it would take to hold it — before fixing or working around it. Before/After names the target and the pattern that broke it. Absorb or fix is the user's call — never a silent fix, never a silent ship.
8. **Gate:** every task checked off → **run the whole planned test set now**: every case Step 2.4 listed (lite → the check named at the collapsed gate), plus the repo's own suite over what the story touched. Per-task runs prove tasks in isolation; this proves they compose.
   - Red → fix, re-run; cause is the plan → point 7's Mid-flight break. Never present a story as ready with a known-failing case.
   - Nothing runnable for the whole story → say so at the gate, with what was checked instead, then continue to the task-wise review below.
   - Green → **task-wise review, one task per message, in commit order:** for each task, show its commit's name/hash, the files it touched (`git show --stat`), and its What/Why + `Verified:` (from the Task Log if a file exists, else the held note from point 5) — concretely, what was added/removed/changed, not a restated task title. Wait for the user's explicit go-ahead before showing the next task's review. This is the first time any of this reaches the user — point 1 held it for exactly this moment.
     - User flags an issue on a task → fix it (its own commit, its own Task Log entry, same as any other fix here), then resume the replay from that task forward.
     - All tasks approved → summarize what was built *and what proved it* (one line: cases run + outcome), plus the scale target it holds and whether measured or only scanned. Stop, wait for confirmation before PR (`step4-pr.md`).

   Commits for all tasks already exist — Step 4 drafts the PR description, it doesn't create commits. A fix made *here* is its own commit and its own Task Log entry.
