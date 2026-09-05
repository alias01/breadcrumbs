# Context file mechanics

Read once, the first time a file-creation trigger fires ("The context file" in `SKILL.md`). Resume rules live in `resume.md`.

**Location:** `.breadcrumbs/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Anchored at the repo root, always relative to it.** `.breadcrumbs/` sits next to the repo root (`git rev-parse --show-toplevel`; no git → nearest ancestor holding the project's root marker, else the working directory, and say which). Never resolve against a subdirectory cwd or a home directory; never store an absolute path inside the file — `/Users/<name>/...` doesn't survive another machine, checkout, or tool sandbox. Everything the file references (Flow, task file lists, Scope Changes) stays repo-relative for the same reason. Every platform opens the same checkout and reads the same file; the committed platform rules files carry the skill itself. The validator scripts are the one optional part — nothing blocks on them.

**Not committed.** Working memory, not a project artifact. On creation, exclude it in `.git/info/exclude`, **not `.gitignore`** — local and untracked, so the exclusion never lands in a commit or someone's diff.
- Already excluded (either file, `.breadcrumbs/context/` or broader `.breadcrumbs/`) → nothing to do.
- Not excluded → append `.breadcrumbs/context/` to `.git/info/exclude`, silently (local-only, reversible).
- No `.git/` → skip, don't fall back to `.gitignore`.

User explicitly wants it committed/shared → move the entry to `.gitignore` then, not before.

**Known limitation — unbounded growth:** Scope Changes/Clarifying Q&A are uncapped (Task Log is bounded via Step 2.7) — pure append, no rotation. Count starts looking like the task-count problem → flag it, consider whether the story should've been split.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed.

**Validation:** after a gate write (Understanding Summary, Plan, Task Checklist, or any structural change — not every Task Log append) → run `validate-context-file.mjs <path>`: catches a missing/malformed `Status` line, missing required sections, a broken checkbox. Not found → skip, don't block. A structure check, not a content re-read.

## Project constitution (optional, separate from per-story files)

Standing, project-wide non-negotiables that apply to *every* story ("payment retries always carry an idempotency key," "no PII in logs"). Not deleted after PR merge, meant to be committed — don't exclude it.

**Location:** `.breadcrumbs/constitution.md` (repo root, same anchoring rule). **Format:** flat list, one rule per line:

```
- <rule> — rationale: <why> — added <date> — status: active
- <rule> — rationale: <why> — added <date> — status: superseded by "<replacing rule, short>" on <date>
- <rule> — rationale: <why> — added <date> — status: retired on <date> — reason: <why it stopped applying>
```

Append-only; `status:` is the one field amended in place. Never delete a line.

**Retiring a rule:** only on an explicit user instruction ("we don't do X anymore," "Y replaces X"). Flip that line's `status:`; for a replacement, append the new rule as its own `status: active` line in the same pass. Never retire a rule because a plan is inconvenient, never infer it from one story's exception — a one-off deviation is a Scope Change or Assumption in that story's file.

**Reading:** checks apply to `status: active` lines only. Superseded/retired lines are history — don't check against them, don't report them as conflicts.

**Contradiction guard:** a new rule contradicts an existing active one → don't just add it. Surface both, ask which stands. Answered → new rule appended active, old one flipped to `superseded by`.

**Created only when earned, never scaffolded.** Triggers, all through the same ask-once confirmation, never appended silently:
- User states a rule that's clearly repo-wide ("we always do X across this whole project," not "for this story, do X") → "want me to save that as a standing project rule so future stories check against it too?" Confirmed → create if missing, append. Declined → log under this story's Assumptions, don't ask again for the same rule.
- Hand-edit to AI-written code that reads as a general preference (Step 3.5's "Learning from the edit").
- Correction that never becomes an edit — the same class of thing corrected twice in a story, or once in plainly repo-wide terms ("we never do X here"). Same ask, same wording.

The bar is repo-wide *and* standing; a single ambiguous correction doesn't clear it — that's an Assumption or a Task Log `Why`.

**Read:** once per story, if the file exists — Step 2.8 (full) or the collapsed lite gate. Not re-read every gate. Conflict with the plan → surface, resolve before continuing, don't build around it.

## Validator scripts

Three optional scripts: `validate-context-file.mjs`, `validate-commit-message.mjs` (Step 3.6), and `session-token-stats.mjs` (Step 4.8, testing). They live in a `scripts/` directory alongside the skill's files — never hard-code one platform's layout.

Resolve by trying `scripts/<name>.mjs` relative to, in order: the directory this file was loaded from → `skills/breadcrumbs/` under the repo root → `.claude/skills/breadcrumbs/` under the repo root → `~/.claude/skills/breadcrumbs/`. First hit wins; run `node <resolved-path> [args]`. Resolve once per session.

None resolve (skill pasted as rules text, no filesystem/shell, no `node`) → skip, fall back to the by-hand equivalent named at the call site, never block a gate on a missing script.
