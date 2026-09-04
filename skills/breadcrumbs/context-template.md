# breadcrumbs context file — template & guardrails

Read once per story, at file creation. Not on resume, not if no trigger fires.

## Content style

Read by AI only — never the user. Fragments, not sentences. Drop articles/connectives where meaning stays unambiguous. Abbreviate freely. Optimize for a resuming model re-deriving state fast.

- Prose: `Why: We added a mutex because there was a race condition between the two writers.`
- Telegraphic: `Why: race condition (two writers) — added mutex.`

Markdown structure (headers, lists, checkboxes) stays as-is — parsing scaffolding, not prose.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<restated understanding, confirmed by user on <date>>
Scale target: <volume / rate / latency budget the story is sized for — or "none stated — current scale assumed">

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<requirements as they stand right now, amended in place as scope changes land — "what's true today," short, never a history log>

## Plan
Story type: <bug fix | copy/config | small feature | refactor | new feature/subsystem | new service/integration | performance>
<approach, HLD/LLD notes if that depth applies, agreed on <date>>
<architecture decision(s): chosen option — why, rejected option(s) — why not. Only where 2+ valid approaches existed.>
<domain-check outcomes / scale-target outcome (holds — how; or open risk) / testing plan / rollout+rollback notes — only the ones that applied, one fragment each.>

### Risks / Unknowns
- <implementation risk — unfamiliar code, possible breakage, needs a spike> — status: open | resolved: <how>

### Sequencing
<tasks with no shared dependency; smallest independently shippable slice, if one exists. Omit if neither applies.>

## Flow
<ordered list of files/modules this story is expected to touch, from the task breakdown — e.g. "1. src/foo.ts (Task 1)  2. src/bar.ts (Task 2, 3)". Amended only via a Scope Change entry, never edited in place.>

## Task Checklist
- [x] Task 1 — <short description> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: <what was implemented>
- Why: <reasoning / decisions made>
- Verified: <what ran — planned case / repo check / "nothing runnable: <what was inspected instead>"> — <outcome>

### Task 2 — <date> (mechanical, no judgment call)
- [x] Task 2 — <short description> — files: <list>
- Verified: <as above>

### Task 3 — <date> (manual edit, by user)
- [x] Task 3 — <short description> — files: <list>
- Check: <correct | issue found — one line, per the manual-edit review>
- Verified: <as above>
- Flow: <on plan | off plan — reason if evident. Only when the edited file isn't on the story's Flow.>

## Scope Changes / Reimplementation
### <date> — <short label>
- Trigger: <test failure, owner feedback, scope change, etc.>
- Before: <requirement/assumption as it was>
- After: <requirement/assumption as it is now>
- Affected tasks: <task numbers>
- Why: <reasoning behind the change>

## Gate Waivers
- <gate> — waived by user on <date> — not confirmed: <what went unreviewed>

## PR Summary
Last drafted: <date> — full text shown in chat, not duplicated here. Anchor for diffing "what changed since last PR" on a later update.
```

Append, never overwrite — except `Status`, Task Checklist checkboxes, Current Requirements, and a Risks/Unknowns entry's `status:`, amended in place. Everything else (Scope Changes, Task Log, Assumptions) is a running record: add entries, never rewrite past ones.

Three Task Log forms — classification per Step 3.5, shown as Task 1/2/3 above. `Verified:` on all three, no exceptions (Step 3.4): what ran and what it showed, one fragment. "Nothing runnable" is a legitimate value; an absent line isn't.

## What NOT to do

- Don't skip a gate on your own initiative, lite mode included. Only an explicit user waiver skips one ("User override" in `SKILL.md`) — log it under `Gate Waivers`.
- Don't ask the user questions during Step 3 task execution — decide, log, move on. Exception: scope-changing issues, surface immediately.
- Don't check a task off without a `Verified:` line; don't pass the Step 3 gate with a known-failing case. "Tests exist" isn't verification; "tests ran, here's the outcome" is.
- Don't overwrite past entries — running record, not a snapshot.
- Don't commit the context file or reference it in the PR diff.
- Don't delete it unless the user confirms the PR merged.
- Don't let a lite-mode story silently absorb a scope change or failed test — escalate to full (Mid-flight break trigger in `SKILL.md`) rather than tracking it in chat memory alone.
