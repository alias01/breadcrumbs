# Context file mechanics

Read once, at the first creation trigger. Resume rules: `resume.md`.

**Location:** `.breadcrumbs/context/<story-slug>.md`, slug = short kebab-case from ticket ID/title. Anchored at the repo root (`git rev-parse --show-toplevel`; no git → nearest project-root marker, else cwd, say which). Never resolve against a subdirectory or home; never store absolute paths in the file — everything repo-relative.

**Not committed.** On creation, exclude via `.git/info/exclude` (not `.gitignore`): already excluded → nothing; else append `.breadcrumbs/context/` silently; no `.git/` → skip. User wants it shared → move to `.gitignore` then.

**Growth:** Scope Changes / Q&A are uncapped append-only. Count looks like the task-cap problem → flag, consider splitting the story.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never unprompted.

**Writes:** one per gate, all sections batched, no read-then-write, no re-read to confirm.

**Validation:** after a gate write (not Task Log appends) → `validate-context-file.mjs <path>`: Status line, required sections, checkboxes. Not found → skip.

## Project constitution

Standing repo-wide rules for every story ("no PII in logs"). Committed, never deleted. `.breadcrumbs/constitution.md`, one rule per line:

```
- <rule> — rationale: <why> — added <date> — status: active
- … — status: superseded by "<rule>" on <date>
- … — status: retired on <date> — reason: <why>
```

Append-only; only `status:` amended. **Retire** only on explicit user instruction; replacement → new active line same pass. Never retire because a plan is inconvenient; a one-off deviation is a Scope Change or Assumption. **Read** `status: active` lines only, once per story (Step 2.8 or lite gate). **Contradiction:** new rule vs active one → surface both, ask, then append new + flip old.

**Created only when earned**, via one ask ("save that as a standing project rule?"): user states a repo-wide rule; hand-edit reading as a general preference (3.5); the same correction twice, or once in repo-wide terms. Declined → this story's Assumptions, don't re-ask. Bar: repo-wide *and* standing.

## Validator scripts

`validate-context-file.mjs`, `validate-commit-message.mjs` (3.6), `session-token-stats.mjs` (4.8). Resolve `scripts/<name>.mjs` relative to, in order: the directory this file loaded from → `skills/breadcrumbs/` → `.claude/skills/breadcrumbs/` → `~/.claude/skills/breadcrumbs/`. First hit, `node <path> [args]`, once per session. None → by-hand equivalent, never block.
