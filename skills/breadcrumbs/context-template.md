# breadcrumbs context file — template & guardrails

Read once, at file creation.

## Content style

AI-only reader. Fragments, no articles/connectives, abbreviate freely. `Why: race condition (two writers) — added mutex.` Markdown structure stays intact.

## File structure

```markdown
# <Story title / ticket ID>
Status: understanding | planning | implementing | pr-ready | done

## Original Story
<verbatim paste>

## Understanding Summary
<restated understanding, confirmed by user on <date>>
Scale target: <volume / rate / latency — or "none stated — current scale assumed">

## Clarifying Q&A
- Q: ... — A: ...

## Assumptions
- <assumption> — reason: <why> — status: unconfirmed | confirmed by <who> on <date>

## Current Requirements
<what's true today, amended in place — never a history>

## Plan
Story type: <type>
<approach, HLD/LLD notes at the applicable depth, agreed on <date>>
<architecture decisions: chosen — why; rejected — why not>
<domain/scale outcomes, testing plan, rollout+rollback — only those that applied>

### Risks / Unknowns
- <implementation risk> — status: open | resolved: <how>

### Sequencing
<independent tasks; smallest demoable slice. Omit if neither.>

## Flow
<ordered files/modules with task numbers. Changed only via Scope Change.>

## Task Checklist
- [x] Task 1 — <desc> — files: <list>
- [ ] Task 2 — ...

## Task Log
### Task 1 — <date>
- What: ...
- Why: ...
- Verified: <what ran / "nothing runnable: <inspected>"> — <outcome>

### Task 2 — <date> (mechanical)
- [x] Task 2 — <desc> — files: <list>
- Verified: ...

### Task 3 — <date> (manual edit, by user)
- [x] Task 3 — <desc> — files: <list>
- Check: <correct | issue — one line>
- Verified: ...
- Flow: <off plan — reason. Only when the file isn't on the Flow.>

## Scope Changes / Reimplementation
### <date> — <label>
- Trigger: ...
- Before: ...
- After: ...
- Affected tasks: ...
- Why: ...

## Gate Waivers
- <gate> — waived by user on <date> — not confirmed: <what>

## PR Summary
Last drafted: <date>
```

Append, never overwrite — except `Status`, checkboxes, Current Requirements, a Risk's `status:`. `Verified:` on every Task Log form; "nothing runnable" is a value, absence isn't.

## What NOT to do

- No gate skipped without an explicit waiver logged under `Gate Waivers`.
- No questions during Step 3 except scope-changing issues.
- No checkoff without `Verified:`; no Step 3 gate with a failing case.
- Never rewrite past entries; never commit or reference the file in the PR; never delete without merge confirmation.
- Lite never absorbs a scope change or failed test silently — escalate to full.
