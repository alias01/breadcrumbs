# Context file mechanics

Read once, the first time a file-creation trigger fires (see "The context file" in `Skill.md` for the triggers themselves). Not needed before that.

**Location once created:** `.breadcrumbs/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Anchored at the repo root, always relative to it** — that's what makes a story resumable on another platform. `.breadcrumbs/` lives next to the repo's own root (find it with `git rev-parse --show-toplevel`; no git → nearest ancestor directory holding the project's root marker, else the working directory, and say which was used). Never resolve it against the current working directory when that's a subdirectory, never against a home directory, never store an absolute path inside the file itself — a path like `/Users/<name>/...` doesn't survive a different machine, a different checkout, or a different tool's sandbox.

Everything the file references — Flow entries, task file lists, Scope Changes — stays repo-relative for the same reason. Cursor, Windsurf, Copilot, Gemini and Claude all open the same checkout and read the same `.breadcrumbs/context/<slug>.md`; the platform-specific rules files (`AGENTS.md`, `.cursor/rules/`, `.windsurf/rules/`, `.clinerules/`, `.kiro/steering/`, `.github/copilot-instructions.md`) are committed and carry the skill itself, so the resuming tool has both halves. The optional validator scripts are the one part that may be absent — that's why nothing blocks on them.

**Not committed.** Working memory, not a project artifact — no reason to exist past PR merge.

On creation, exclude it — but **in `.git/info/exclude`, not `.gitignore`**. Same effect for the user, and it's a local, untracked file: the exclusion never lands in a commit or shows up in someone else's diff. `.gitignore` is tracked; silently editing it puts an unexplained line in the story's own PR.

- Already excluded (either file, `.breadcrumbs/context/` or a broader `.breadcrumbs/`) → nothing to do.
- Not excluded → append `.breadcrumbs/context/` to `.git/info/exclude`, no announcement needed. Silent because it's local-only and reversible; anything touching a tracked file wouldn't be.
- No `.git/` (not a repo, or a worktree without one) → skip, don't fall back to `.gitignore`.

User explicitly wants it committed / shared with teammates → that's their call, they'll say so; move the entry to `.gitignore` then, not before.

**Resuming:** before any story work, check `.breadcrumbs/context/` for existing files. One match, name/slug clearly matches what the user's asking about → read it, summarize status back ("Here's where this stood: ... currently at Step X"), resume. Zero matches → nothing to resume; story hasn't started, or it's mid-way/finished in an unbroken conversation with no trigger fired yet. More than one file present and the user's request doesn't unambiguously point to one (generic "let's continue," or a new/vague prompt while other stories sit mid-flight) → don't guess. List the candidates cheaply: filename (slug) + first two lines of each (title, `Status:`) — never a full read at this stage, cost shouldn't scale with how many stories are open or how long they've grown. Present that list, ask which one. Once picked, proceed as the one-match case (full read, then resume).

**Staleness check (piggybacks on the scan above, no separate pass):** the directory listing itself — filenames + mtimes — is already free at this point regardless of match count. While scanning, note any file with `Status: pr-ready` (first two lines, same cheap read as the listing case) and mtime older than 7 days — that combination means the PR draft went out and nobody came back to confirm merge/delete. Collect these across the whole directory, not just the story being resumed or started. Any found → after resolving the current story's resume/start, mention them once in one line: "N context file(s) sitting at pr-ready for 7+ days: <slugs> — merged? want these deleted?" Confirmed per-file or in bulk → delete. Same rule as ordinary cleanup: never delete unprompted, this only surfaces the offer sooner instead of waiting for someone to reopen that specific story.

**Compaction on resume:** the file itself stays append-only — full detail, never compressed, that's the audit trail Core Philosophy depends on. What compacts is the *chat summary* read back to the user. Task Log/Scope Changes past 3 entries → summarize the older ones in one line each (date + What, no Why detail), give full What/Why detail only for the most recent 2-3 entries and anything still open (unconfirmed Assumptions, unresolved Scope Changes). If the user then asks about an older decision specifically, read that entry's full detail on demand — the file has it, the summary just didn't restate it. Keeps resume cost flat regardless of story length instead of scaling with it.

**Known limitation — unbounded growth:** Scope Changes/Clarifying Q&A are uncapped (unlike Task Log, bounded via Step 2.7's task ceiling) — pure append, no rotation, no archival. Count starts looking like the task-count problem → treat it the same way: flag it, consider whether the story should've been split.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed — trust it.

## Project constitution (optional, separate from per-story files)

Standing, project-wide non-negotiables — not this story's decisions, decisions that apply to *every* story in this repo (e.g. "payment retries always carry an idempotency key," "no PII in logs"). Different lifecycle from a per-story context file: not deleted after PR merge, meant to be committed (it's a project artifact, not working memory) — don't exclude it, in `.gitignore` or `.git/info/exclude`.

**Location:** `.breadcrumbs/constitution.md` (repo root, same anchoring rule as the context file above — it's committed, so it must resolve identically on every machine and platform). **Format:** flat list, one rule per line:

```
- <rule> — rationale: <why> — added <date> — status: active
- <rule> — rationale: <why> — added <date> — status: superseded by "<replacing rule, short>" on <date>
- <rule> — rationale: <why> — added <date> — status: retired on <date> — reason: <why it stopped applying>
```

Still append-only: the file only grows, and `status:` is the one field amended in place — a retired rule's line stays exactly as written, so the audit trail of what the project once required survives. Never delete a line.

**Retiring a rule:** only on an explicit user instruction ("we don't do X anymore," "Y replaces X"). Flip that line's `status:`, and for a replacement, append the new rule as its own `status: active` line in the same pass. Never retire a rule because a plan is inconvenient, and never infer it from one story's exception — a one-off deviation is a Scope Change or an Assumption in that story's context file, not a constitution edit.

**Reading:** point 8's check applies to `status: active` lines only. Superseded/retired lines are history — read past them, don't check against them, don't report them as conflicts.

**Contradiction guard:** appending a rule that contradicts an existing active one → don't just add it. Surface both lines, ask which stands. Answer given → new rule appended active, old one flipped to `superseded by`. Two active contradictory rules is the failure state this format exists to prevent.

**Created only when earned, never scaffolded speculatively:** a user states a rule mid-story that's clearly repo-wide, not story-specific ("we always do X across this whole project," not "for this story, do X") → ask once, "want me to save that as a standing project rule so future stories check against it too?" Confirmed → create if missing, append the rule. Declined → log it under this story's Assumptions instead, don't ask again for the same rule.

Two implicit triggers besides something the user says out loud:

- **Hand-edit to AI-written code** (see Step 3.5's "Learning from the edit") — the edit reads as a general preference rather than a fix to this task alone.
- **Correction that never becomes an edit** — the user corrects the same class of thing twice in a story, or once in plainly repo-wide terms ("we never do X here"), without touching the file themselves. Same ask-once, same wording. This is the trigger that catches the correction nothing else here retains: "don't put the token in the log line," said once in chat, is gone the moment the session ends unless it's asked about and written down.

Both go through the same confirmation as a stated rule — never appended silently. A one-off correction specific to this task isn't a rule; it's an Assumption or a Task Log `Why` in this story's file. The bar is repo-wide *and* standing, and a single ambiguous correction doesn't clear it.

**Read:** once per story, if the file exists. Full mode → Step 2 (Plan), point 8, last, after the plan is complete (`step2-plan.md`). Lite mode → the collapsed Step 1+2 gate ("Lite mode" in `Skill.md`), since lite skips Step 2 entirely and these rules are repo-wide, not scaled to story size. Not re-read every gate.

**Checked, not just read:** Step 2's plan gets checked against its active rules before presenting to the user. Conflict → same handling as the Step 2.2 tripwire (a missed Material unknown): surface it, resolve before continuing, don't build around it.

**Validation:** after a gate write (Understanding Summary, Plan, Task Checklist, or any structural change — not every Task Log append), run `validate-context-file.mjs <path>` — catches a missing/malformed `Status` line, missing required sections, or a broken checkbox before it compounds across later gates. Not found → skip, don't block on it. A failure here doesn't override "don't re-read to confirm a write landed" above — it's a structure check, not a content re-verification.

## Validator scripts

Two optional scripts ship with the skill: `validate-context-file.mjs` and `validate-commit-message.mjs` (used by Step 3.6). They live in a `scripts/` directory alongside the skill's own files, so the path depends on how the skill was loaded — never hard-code one platform's layout.

Resolve by trying, in order, `scripts/<name>.mjs` relative to: the directory this file was loaded from → `skills/breadcrumbs/` under the repo root → `.claude/skills/breadcrumbs/` under the repo root → `~/.claude/skills/breadcrumbs/`. First hit wins; run it as `node <resolved-path> [args]`. Resolve once per session, reuse the hit.

None of them resolve — the skill was pasted in as rules text, or the platform has no filesystem/shell — → skip the check, fall back to the by-hand equivalent named at the call site, never block a gate on a missing script. Same for a platform with no way to run `node`.
