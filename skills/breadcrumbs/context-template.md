# breadcrumbs context file — template & guardrails

Read once per story, at file creation — whichever trigger fires it (see "The context file" in `Skill.md`). Not needed again on resume — the file itself has everything by then — nor if no trigger ever fires.

## Content style

Read by AI only (this session, a resumed session, another platform) — never the user. `Skill.md`'s "Communication style" governs chat, not this. Every section: fragments, not sentences. Drop articles/connective words where meaning stays unambiguous. Abbreviate freely. Optimize for a resuming model re-deriving state fast, not human readability.

- Prose: `Why: We added a mutex because there was a race condition between the two writers.`
- Telegraphic: `Why: race condition (two writers) — added mutex.`

Markdown structure (headers, lists, checkboxes) stays as-is — parsing scaffolding, not prose. Cutting it costs more to re-derive than it saves.

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

Append, never overwrite — except `Status`, Task Checklist checkboxes, Current Requirements: amended in place as they change. Everything else (Scope Changes, Task Log, Assumptions) = running record, add entries, never rewrite past ones. Split → resuming session sees both "what's true now" (Current Requirements) and "how we got here" (Scope Changes) without re-deriving one from the other.

Two Task Log forms (Step 3.3): full `What`/`Why` block where a genuine judgment call was made, single checklist line for mechanical tasks. No prose without a decision behind it.

## What NOT to do

- Don't skip a gate, next step "obvious" or not. Applies in lite mode too — lite collapses which gates exist, never waives confirmation.
- Don't ask the user questions during Step 3 task execution — decide, log, move on. Exception: scope-changing issues, surface those immediately.
- Don't overwrite past entries — running record, not a snapshot.
- Don't commit the context file or reference it in the PR diff.
- Don't delete it unless the user confirms the PR merged.
- Don't let a lite-mode story silently absorb a scope change or failed test — that's what the escalation trigger (see "The context file" in `Skill.md`) is for. Escalate to full mode rather than tracking it in chat memory alone.
