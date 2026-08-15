# Context file mechanics

Read once, the first time a file-creation trigger fires (see "The context file" in `Skill.md` for the triggers themselves). Not needed before that.

**Location once created:** `.breadcrumbs/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Not committed.** On creation: check `.gitignore` for `.breadcrumbs/context/` (or broader `.breadcrumbs/`), add if missing. Working memory, not a project artifact — no reason to exist past PR merge.

**Resuming:** before any story work, check `.breadcrumbs/context/` for existing files. One match, name/slug clearly matches what the user's asking about → read it, summarize status back ("Here's where this stood: ... currently at Step X"), resume. Zero matches → nothing to resume; story hasn't started, or it's mid-way/finished in an unbroken conversation with no trigger fired yet. More than one file present and the user's request doesn't unambiguously point to one (generic "let's continue," or a new/vague prompt while other stories sit mid-flight) → don't guess. List the candidates cheaply: filename (slug) + first two lines of each (title, `Status:`) — never a full read at this stage, cost shouldn't scale with how many stories are open or how long they've grown. Present that list, ask which one. Once picked, proceed as the one-match case (full read, then resume).

**Staleness check (piggybacks on the scan above, no separate pass):** the directory listing itself — filenames + mtimes — is already free at this point regardless of match count. While scanning, note any file with `Status: pr-ready` (first two lines, same cheap read as the listing case) and mtime older than 7 days — that combination means the PR draft went out and nobody came back to confirm merge/delete. Collect these across the whole directory, not just the story being resumed or started. Any found → after resolving the current story's resume/start, mention them once in one line: "N context file(s) sitting at pr-ready for 7+ days: <slugs> — merged? want these deleted?" Confirmed per-file or in bulk → delete. Same rule as ordinary cleanup: never delete unprompted, this only surfaces the offer sooner instead of waiting for someone to reopen that specific story.

**Compaction on resume:** the file itself stays append-only — full detail, never compressed, that's the audit trail Core Philosophy depends on. What compacts is the *chat summary* read back to the user. Task Log/Scope Changes past 3 entries → summarize the older ones in one line each (date + What, no Why detail), give full What/Why detail only for the most recent 2-3 entries and anything still open (unconfirmed Assumptions, unresolved Scope Changes). If the user then asks about an older decision specifically, read that entry's full detail on demand — the file has it, the summary just didn't restate it. Keeps resume cost flat regardless of story length instead of scaling with it.

**Known limitation — unbounded growth:** Scope Changes/Clarifying Q&A are uncapped (unlike Task Log, bounded via Step 2.4's task ceiling) — pure append, no rotation, no archival. Count starts looking like the task-count problem → treat it the same way: flag it, consider whether the story should've been split.

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed — trust it.

## Project constitution (optional, separate from per-story files)

Standing, project-wide non-negotiables — not this story's decisions, decisions that apply to *every* story in this repo (e.g. "payment retries always carry an idempotency key," "no PII in logs"). Different lifecycle from a per-story context file: not deleted after PR merge, meant to be committed (it's a project artifact, not working memory) — don't add it to `.gitignore`.

**Location:** `.breadcrumbs/constitution.md`. **Format:** flat list, `- <rule> — rationale: <why> — added <date>`. No status field, no sections — it only ever grows by append.

**Created only when earned, never scaffolded speculatively:** a user states a rule mid-story that's clearly repo-wide, not story-specific ("we always do X across this whole project," not "for this story, do X") → ask once, "want me to save that as a standing project rule so future stories check against it too?" Confirmed → create if missing, append the rule. Declined → log it under this story's Assumptions instead, don't ask again for the same rule.

**Read:** once per story, at Step 2 (Plan) — see `step2-plan.md` — if the file exists. Not re-read every gate.

**Checked, not just read:** Step 2's plan gets checked against it before presenting to the user. Conflict → same handling as the Step 2.2 tripwire (a missed Material unknown): surface it, resolve before continuing, don't build around it.

**Validation:** after a gate write (Understanding Summary, Plan, Task Checklist, or any structural change — not every Task Log append), run `node ~/.claude/skills/breadcrumbs/scripts/validate-context-file.mjs <path>` — catches a missing/malformed `Status` line, missing required sections, or a broken checkbox before it compounds across later gates. Script missing → skip, don't block on it. A failure here doesn't override "don't re-read to confirm a write landed" above — it's a structure check, not a content re-verification.
