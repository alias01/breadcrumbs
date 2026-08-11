# Step 3 — Implement

0. **Delegation threshold**, checked once at Step 3 start, not re-evaluated per task: Task Checklist has more than 5 tasks → dispatch each task to a sub-agent (see "Sub-agent dispatch" below). 5 or fewer → run every task directly in this thread, everything below applies as-is, ignore the dispatch section. Small/lite stories don't pay sub-agent spin-up overhead for work that fits comfortably in one thread.
1. Work the Task Checklist one task at a time, in dependency order (per Step 2.3) — never parallel, a later task may depend on an earlier one's output.
2. **Don't ask the user mid-task.** Use best judgment. Genuine judgment call (not mechanical) → log in Task Log's "Why." Changes what was agreed (contradicts plan, needs a scope decision) → not a solo call — log under Scope Changes, flag immediately.
3. Apply `ponytail` for how code gets written: simplest thing that works, stdlib/existing deps before new code, no unrequested abstractions. Exceptions still apply — never simplify away input validation, error handling, security, accessibility.
4. After each task — file exists → append Task Log entry, check it off, same write, trip marker. Either way: tell the user what was done, next task without waiting unless interjected. Genuine judgment call → full What/Why block; mechanical → single checklist line; user edited the file by hand (per the standing manual-edit review) → checklist line + one-line `Check:` verdict, same review that's already shown in chat, logged here too. Edited file isn't on the story's planned Flow (from Step 2.3) → say so explicitly before the correctness verdict ("that file's outside this story's planned Flow — [reason if evident]"), one line, non-blocking; still record the `Check:` verdict either way (`context-template.md` has all three forms). Quote whichever form was written, don't restate. No file, no trigger yet → just narrate progress in chat, including the manual-edit check and any Flow warning. **Delegated task** → this write is always done by this thread, from the sub-agent's returned report, never by the sub-agent directly — keeps "one write per gate" (`context-file-mechanics.md`) true regardless of delegation.
5. **Commit each task.** Below threshold: commit in this thread right after the Task Log write (same moment, before the next task). Above threshold (delegated): the sub-agent already committed before returning — this point doesn't re-run, confirm the commit landed (its returned commit header) and record it in the Task Log write above. Either way: one commit per completed task — mirrors the Task Log 1:1, keeps `git log` and the Task Log reconstructable from each other.

   Conventional Commits format: `<type>(<scope>): <imperative summary>`. Scope = affected module/file area, omit if obvious from a small story. Body = short bullet list, drawn from the task's What/Why — compress, don't paste the Task Log entry verbatim.

   | Type | Use for |
   |---|---|
   | `feat` | New feature |
   | `fix` | Bug fix |
   | `docs` | Documentation changes |
   | `style` | Code style changes (formatting, no logic change) |
   | `refactor` | Code refactoring, no behavior change |
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
6. Test fails / owner invalidates an assumption / scope changes mid-flight → file-creation trigger (see "The context file" in `Skill.md`) if none exists yet: create it, backfill what's happened, escalate lite→full if applicable. Either way: structured Scope Changes entry (date, trigger, before/after, affected tasks, why), amend Current Requirements in place, update relevant Assumptions/Plan, adjust Task Checklist. Continue in the same file. A delegated sub-agent flagging a plan contradiction (see below) lands here too — same handling, the sub-agent just supplied the trigger instead of this thread noticing it directly.
7. **Gate:** every task checked off → summarize what was built, stop, wait for confirmation before PR (`step4-pr.md`). Commits for all tasks already exist by this point — Step 4 drafts the PR description, it doesn't create new commits.

## Sub-agent dispatch (stories above the threshold)

**Scope handed to the sub-agent** — this task's description and files, the Plan's HLD/LLD notes relevant to it, the Flow entries touching its files, and any Assumptions bearing on it. Not the full conversation — isolating context is the point.

**The sub-agent has no chat access** — it can't ask the user. It applies 2 and 3 above itself (best judgment, no mid-task questions, `ponytail`) on its own.

**It implements and commits**, per point 5 above, before returning — one round trip instead of handing a diff back for this thread to re-apply.

**Its task turns out to contradict the plan** (a scope change, not a mechanical judgment call) → it stops without resolving it and without committing, returns a report flagged as a plan contradiction. It does not decide how to reconcile it — that's a story-level call this thread makes (point 6), not a task-level one a context-isolated sub-agent has visibility to make well.

**It returns:** what was done, why (if a judgment call), files touched, the commit header (or the plan-contradiction flag instead), and whether the touched files matched the planned Flow. This thread does the Task Log write from that report per point 4 — the sub-agent never touches the context file directly.
