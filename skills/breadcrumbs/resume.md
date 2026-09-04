# Resuming a story

Read when `.breadcrumbs/context/` (repo root) has files and the user is starting or continuing a story. Not needed when the directory is empty or missing.

**Match:** one file whose name/slug clearly matches what the user's asking about → read it, summarize status back ("Here's where this stood: ... currently at Step X"), pick up at the next unchecked task — don't redo earlier gates. More than one file and the request doesn't unambiguously point to one (generic "let's continue," or a new/vague prompt while other stories sit mid-flight) → don't guess. List candidates cheaply: filename (slug) + first two lines of each (title, `Status:`) — never a full read at this stage. Ask which one, then proceed as the one-match case. Zero matches → nothing to resume, start stateless.

**Staleness check (piggybacks on the scan, no separate pass):** while listing, note any file with `Status: pr-ready` (first two lines) and mtime older than 7 days — the PR went out and nobody confirmed merge/delete. Collect across the whole directory. Any found → after resolving the current story's resume/start, one line: "N context file(s) sitting at pr-ready for 7+ days: <slugs> — merged? want these deleted?" Confirmed per-file or in bulk → delete. Never delete unprompted.

**Compaction on resume:** the file stays append-only, full detail — what compacts is the *chat summary*. Task Log/Scope Changes past 3 entries → one line each for the older ones (date + What), full What/Why only for the most recent 2-3 and anything still open (unconfirmed Assumptions, unresolved Scope Changes). User asks about an older decision → read that entry's full detail on demand.

**Then:** run Step 3.5's standing manual-edit review (`git status` / `git diff HEAD` over the story's files) before touching the next task, and read the step file for the step the story is at.
