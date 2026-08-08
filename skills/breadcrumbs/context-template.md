# breadcrumbs context file — template & guardrails

Read this file once per story: the first time you create `.claude/context/<story-slug>.md` (Step 1, first write, full mode only). Not needed again on resume — the context file itself has everything by then — and not needed at all for lite-mode stories, which skip the file entirely.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<Claude's restated understanding, confirmed by user on <date>>

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<the story's requirements as they stand right now, amended in place as scope changes land — this is the "what's true today" view, kept short and current, never a history log>

## Plan
Story type: <bug fix | copy/config | small feature | refactor | new feature/subsystem | new service/integration | performance>
<approach discussion, HLD/LLD notes if that depth applies, agreed on <date>>

## Task Checklist
- [x] Task 1 — <short description> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: <what was implemented>
- Why: <reasoning / decisions made>

### Task 2 — <date> (mechanical, no judgment call)
- [x] Task 2 — <short description> — files: <list>

## Scope Changes / Reimplementation
### <date> — <short label>
- Trigger: <test failure, owner feedback, scope change, etc.>
- Before: <requirement/assumption as it was>
- After: <requirement/assumption as it is now>
- Affected tasks: <task numbers>
- Why: <reasoning behind the change>

## PR Summary
Last drafted: <date> — full text was shown in chat for the user to copy into GitHub/GitLab/Bitbucket, not duplicated here. Kept only as the anchor for diffing "what changed since last PR" on a later update.
```

Append, never overwrite — except the `Status` line, Task Checklist checkboxes, and Current Requirements, which are amended in place as they change. Everything else (Scope Changes, Task Log, Assumptions) is a running record: add entries, don't rewrite past ones. This split is what lets a resuming session see both "what's true now" (Current Requirements) and "how we got here" (Scope Changes log) without re-deriving one from the other.

Two Task Log entry forms, per Step 3.3: a full `What`/`Why` block for tasks where a genuine judgment call was made, or a single checklist line for purely mechanical tasks — don't write prose that has no decision behind it.

## What NOT to do

- Don't skip a gate, even if the next step seems obvious. (This applies in lite mode too — lite collapses which gates exist, it doesn't waive confirmation.)
- Don't ask the user questions during Step 3 task execution — decide, log, move on. Scope-changing issues are the exception: surface those immediately.
- Don't overwrite past context file entries — this is a running record, not a snapshot.
- Don't commit the context file or reference it in the PR diff.
- Don't delete the context file unless the user confirms the PR merged.
- Don't let a lite-mode story silently absorb a scope change or failed test — that's exactly the case the upgrade path (Step 3.6) exists for. Upgrade to full mode rather than trying to track it in chat memory alone.
