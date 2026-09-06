# Step 4 — PR

1. Say the work is ready for a PR.
2. Title: `<Ticket ID/slug>: <imperative summary>`. Ticket has a URL → link the ID.
3. **Two readers:** today's reviewer, and whoever blames a line in months later. A section earns its place only by telling one of them what the diff can't. File exists → pull from it; else from the conversation.
   - **What** — always. The behavior change. Not the problem, not the file list. ← Task Log What.
   - **Why** — unless it restates What. Root cause/constraint + the rejected alternative, one fragment each. ← Why, Assumptions, Scope Changes.
   - **Test** — what actually ran and showed: 3.4/3.8 cases, manual steps, or "nothing runnable" + what was inspected. ← `Verified:` lines and the 3.8 run, never the Plan. Scale target: measured or only scanned.
   - **Rollback** — only if not a plain revert (migration, flag, external state, backfill).
   - **Dependencies** — only if this depends on or blocks something; `git merge-base HEAD <default>` not at tip → stacked, name the base.
   - **Reviewer focus** — only if the diff is uneven: where to read, what to skim.
   - **Out of scope** — only if a reviewer would ask "why not also…": what was left and where it went.
   - **What changed since last PR** — re-draft only. ← Scope Changes after `Last drafted:`.
4. **Shape:** one point → a sentence; two+ → bullets, one fact each, no sub-bullets. **Cap 2 bullets per section, Why 3.** Too long → compress, not truncate; can't fit → the task was too broad. Whole draft reads in 2-5 min; longer with only earned sections → story too big, say so. Never: restate the diff, narrate the journey, list commits, leave an empty heading.

   ```markdown
   ## [<Ticket ID>](<url>): <imperative summary>

   **What:** <one sentence when one point>

   **Why:**
   - <root cause / constraint>
   - <rejected alternative, if weighed>

   **Test:**
   - <case run + outcome>

   **Rollback:** <only if non-trivial>
   **Dependencies:** <only if any>
   **Reviewer focus:** <only if uneven>
   **Out of scope:** <only if something was left>
   ```
   Example: `**What:** Retries reuse one idempotency key per order, so the provider sees a single charge across the retry sequence.` / `**Why:** - Retries omitted the key; each looked like a fresh charge. - Considered local de-dup by order ID; rejected — races across workers.` / `**Reviewer focus:** \`retry.ts\` key generation is the judgment call; \`charge.ts\` only threads it through.`
5. Re-scan against 4 before showing: any section with 2+ facts in prose → bullets.
6. **Draft in chat, stop.** The message is the deliverable. Nothing written to the file.
7. **Gate:** confirm or iterate in chat.
8. **[Testing]** Run `session-token-stats.mjs --by-tool` (resolution in `context-file-mechanics.md`), show full output verbatim incl. the closing caveat. Not found → skip. Drop this step when no longer needed.
9. Confirmed + file exists → PR Summary: `Last drafted: <date>`; Status `pr-ready`; trip marker.
