# Step 3 — Implement

1. Work the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call (not mechanical) → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → not a solo call — log under Scope Changes, flag immediately.
3. Apply `ponytail` for how code gets written: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Exceptions still apply — never simplify away input validation, error handling, security, accessibility.
4. After each task — file exists → append Task Log entry, check it off, same write, trip marker. Either way: tell the user what was done, next task without waiting unless interjected. Genuine judgment call → full What/Why block; mechanical → single checklist line; user edited the file by hand (per the standing manual-edit review) → checklist line + one-line `Check:` verdict, same review that's already shown in chat, logged here too. Edited file isn't on the story's planned Flow (from Step 2.6) → say so explicitly before the correctness verdict ("that file's outside this story's planned Flow — [reason if evident]"), one line, non-blocking; still record the `Check:` verdict either way (`context-template.md` has all three forms). Quote whichever form was written, don't restate. No file, no trigger yet → just narrate progress in chat, including the manual-edit check and any Flow warning.

   **Learning from the edit:** if the hand-edit reflects a repo-wide preference rather than a one-off fix to this task (e.g. consistently strips comments a certain way, always adds a specific guard, renames a pattern the same way each time) → treat it like a stated rule (`context-file-mechanics.md`'s Project constitution trigger): ask once, "Noticed you always change X to Y — save that as a standing project rule?" Confirmed → append to `.breadcrumbs/constitution.md`, apply it from the next task onward in this story and every story after. Declined → don't ask again for this same pattern, keep it to the `Check:` verdict only. Story-specific edit (fixes this task's particular bug, not a general preference) → no ask, `Check:` verdict is enough.
5. **Commit each task**, right after its Task Log write (same moment, before moving to the next task). One commit per completed task — mirrors the Task Log 1:1, keeps `git log` and the Task Log reconstructable from each other.

   Per-task, not per-story, on purpose: each commit carries that task's own Why. Batch several tasks into one commit and the reasons collapse — a reviewer can see the change belongs to the story, but not which reason drove which hunk. That's the thing being preserved; it can't be recovered later.

   Conventional Commits format: `<type>(<scope>): <imperative summary>`. Scope = affected module/file area, omit if obvious from a small story. Body = short bullet list, drawn from the task's What/Why — compress, don't paste the Task Log entry verbatim.

   | Type | Use for |
   |---|---|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation changes |
   | `style` | Code style changes (formatting, no logic change) |
   | `refactor` | Code refactoring, no behavior change |
   | `perf` | Performance improvement — behavior unchanged, characteristics (speed, memory) improved |
   | `test` | Adding or modifying tests |
   | `chore` | Maintenance tasks, tooling, deps |
   | `build` | Build system, packaging, dependency manifests |
   | `ci` | CI config and pipeline changes |

   Breaking change → `!` before the colon: `feat(api)!: drop v1 endpoint`. A `git revert` keeps the header git generates (`Revert "<original subject>"`) — don't rewrite it into Conventional form, the trailer it carries is what makes the revert traceable.

   Example:
   ```
   feat(auth): add password reset functionality

   - Add forgot password form
   - Implement email verification flow
   - Add password reset endpoint
   ```

   Scope change / mid-flight fix mid-task → still one commit for the task once it lands, type reflects what actually shipped (e.g. a task that started as `feat` but the scope change made it fix a bug too → `fix` if that's now the dominant change).

   Before running `git commit`, check the header with `validate-commit-message.mjs` — deterministic, cheaper and more reliable than eyeballing the regex. Resolve the script per "Validator scripts" in `context-file-mechanics.md`; not found → check by hand against the table above, don't block on it.
6. Test fails / owner invalidates an assumption / scope changes mid-flight → Mid-flight break trigger (`SKILL.md`) applies. Once handled: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update relevant Assumptions/Plan, adjust Task Checklist. Continue in the same file.
7. **Gate:** every task checked off → summarize what was built, stop, wait for confirmation before PR (`step4-pr.md`). Commits for all tasks already exist by this point — Step 4 drafts the PR description, it doesn't create new commits.
