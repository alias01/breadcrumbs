# Step 3 — Implement

1. Work the Task Checklist one task at a time.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call (not mechanical) → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → not a solo call — log under Scope Changes, flag immediately.
3. Apply `ponytail` for how code gets written: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Exceptions still apply — never simplify away input validation, error handling, security, accessibility.
4. After each task — file exists → append Task Log entry, check it off, same write, trip marker. Either way: tell the user what was done, next task without waiting unless interjected. Genuine judgment call → full What/Why block; mechanical → single checklist line; user edited the file by hand (per the standing manual-edit review) → checklist line + one-line `Check:` verdict, same review that's already shown in chat, logged here too. Edited file isn't on the story's planned Flow (from Step 2.3) → say so explicitly before the correctness verdict ("that file's outside this story's planned Flow — [reason if evident]"), one line, non-blocking; still record the `Check:` verdict either way (`context-template.md` has all three forms). Quote whichever form was written, don't restate. No file, no trigger yet → just narrate progress in chat, including the manual-edit check and any Flow warning.
5. **Commit each task**, right after its Task Log write (same moment, before moving to the next task). One commit per completed task — mirrors the Task Log 1:1, keeps `git log` and the Task Log reconstructable from each other.

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

   Example:
   ```
   feat(auth): add password reset functionality

   - Add forgot password form
   - Implement email verification flow
   - Add password reset endpoint
   ```

   Scope change / mid-flight fix mid-task → still one commit for the task once it lands, type reflects what actually shipped (e.g. a task that started as `feat` but the scope change made it fix a bug too → `fix` if that's now the dominant change).

   Before running `git commit`, check the header against `~/.claude/skills/breadcrumbs/scripts/validate-commit-message.mjs` (`node ~/.claude/skills/breadcrumbs/scripts/validate-commit-message.mjs -m "<header>"`) — deterministic check, cheaper and more reliable than eyeballing the regex. Script missing (skill not installed via the sync, or running on a platform without it) → fall back to checking by hand against the table above, don't block on it.
6. Test fails / owner invalidates an assumption / scope changes mid-flight → Mid-flight break trigger (`Skill.md`) applies. Once handled: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update relevant Assumptions/Plan, adjust Task Checklist. Continue in the same file.
7. **Gate:** every task checked off → summarize what was built, stop, wait for confirmation before PR (`step4-pr.md`). Commits for all tasks already exist by this point — Step 4 drafts the PR description, it doesn't create new commits.
