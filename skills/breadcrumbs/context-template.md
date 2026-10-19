# breadcrumbs context file — template & guardrails

## Content style

AI-only reader. Fragments, no articles, abbreviate freely. `Why: race condition (two writers) — added mutex.` Markdown structure stays intact.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<restated understanding, confirmed <date>>
Scale target: <volume / rate / latency — or "none stated — current scale assumed">

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<what's true today, amended in place — never a history>

## Plan
Story type: <type>
<approach, HLD/LLD at applicable depth, agreed <date>>
<architecture decisions: chosen — why; rejected — why not>
<domain/scale outcomes, testing plan, rollout+rollback — those that applied>

### Risks / Unknowns
- <implementation risk> — status: open | resolved: <how>

### Sequencing
<independent tasks; smallest demoable slice. Omit if none.>

## Flow
<ordered files/modules + task numbers. Changes only via Scope Change.>

## Task Checklist
- [x] Task 1 — <desc> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: ...
- Why: ...
- Red: <test path> › <name> — <failure> | n/a — <why>
- Verified: <what ran / "nothing runnable: <inspected>"> — <outcome>

### Task 2 — <date> (mechanical)
- [x] Task 2 — <desc> — files: <list>
- Red: ...
- Verified: ...

### Task 3 — <date> (manual edit, by user)
- [x] Task 3 — <desc> — files: <list>
- Check: <correct | issue — one line>
- Verified: ...
- Flow: <off plan — reason. Only if the file is off the Flow.>

## Scope Changes / Reimplementation
### <date> — <label>
- Trigger: ...
- Before: ...
- After: ...
- Affected tasks: ...
- Why: ...

## Gate Waivers
- <gate> — waived <date> — not confirmed: <what>

## PR Summary
Last drafted: <date>
```

Append, never overwrite — except `Status`, checkboxes, Current Requirements, a Risk's `status:`. `Red:` on every form but a manual edit; `Verified:` on all; "nothing runnable" is a value, absence isn't.

## What NOT to do

- No gate skipped without a waiver logged under `Gate Waivers`.
- No Step 3 questions except scope-changing ones.
- No code before `Red:`, no checkoff without `Verified:`, no frozen-test edit without a Scope Change, no Step 3 gate with a failing case.
- Never rewrite past entries, commit or cite the file in the PR, or delete it before merge confirmation.
- Lite never absorbs a scope change or failed test silently — escalate to full.
