# Resuming a story

Read when `.breadcrumbs/context/` has files and the user starts or continues a story.

**Match:** one file clearly matching the request → read it, summarize status ("Here's where this stood: … at Step X"), pick up at the next unchecked task; don't redo gates. Ambiguous (several files, generic "continue") → list slug + first two lines each (title, `Status:`), ask which. Zero matches → stateless.

**Staleness (same scan):** any file `Status: pr-ready` with mtime >7 days → after resolving the current story, one line: "N file(s) at pr-ready 7+ days: <slugs> — merged? delete?" Delete only on confirmation.

**Chat summary compaction:** file stays full; the summary keeps full What/Why for the last 2-3 Log/Scope entries and anything open, one line (date + What) for older ones. Older decision asked about → read that entry on demand.

**Then:** Step 3.5's manual-edit review over the story's files, and read the step file for the story's current step.
