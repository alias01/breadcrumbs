# Context file mechanics

Read once, the first time a file-creation trigger fires (see "The context file" in `Skill.md` for the triggers themselves). Not needed before that.

**Location once created:** `.claude/context/<story-slug>.md` — `<story-slug>` = short kebab-case id from ticket ID/title.

**Not committed.** On creation: check `.gitignore` for `.claude/context/` (or broader `.claude/`), add if missing. Working memory, not a project artifact — no reason to exist past PR merge.

**Resuming:** before any story work, check `.claude/context/` for existing files. One match, name/slug clearly matches what the user's asking about → read it, summarize status back ("Here's where this stood: ... currently at Step X"), resume. Zero matches → nothing to resume; story hasn't started, or it's mid-way/finished in an unbroken conversation with no trigger fired yet. More than one file present and the user's request doesn't unambiguously point to one (generic "let's continue," or a new/vague prompt while other stories sit mid-flight) → don't guess. List the candidates cheaply: filename (slug) + first two lines of each (title, `Status:`) — never a full read at this stage, cost shouldn't scale with how many stories are open or how long they've grown. Present that list, ask which one. Once picked, proceed as the one-match case (full read, then resume).

**Cleanup:** PR merged (user-confirmed) → offer to delete. Never delete unprompted.

**Efficiency:** file exists → one write per gate, every section update batched into one pass, no read-then-write round trips. Don't re-read to confirm a write landed — trust it.
