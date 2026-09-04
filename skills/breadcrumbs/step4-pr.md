# Step 4 — PR

1. Tell the user the work is ready for a PR.
2. Title: file exists → derive from it (`<Ticket ID/slug>: <imperative summary>`, file header + Understanding Summary). No file → compose the same way from the conversation. Ticket has a URL (in the pasted story, the file header, or the tracker convention is known) → link the ID in the heading; a bare ID is a search for whoever reads this from `git blame` in a year.
3. **Two readers, not one:** the reviewer today, and whoever blames a line into this PR months later with no chat to consult. Every section below is judged by whether it tells one of them something the diff can't.

   Five core sections, same names regardless of type — **What, Why, Test, Rollback, Dependencies** — plus two optional one-liners (**Reviewer focus, Out of scope**) and one addendum that only exists on a re-draft (**What changed since last PR**). Bias toward fewer: include a section only if it earns its place, omit rather than pad. File exists → pull content from it, don't re-summarize; no file → derive the same from the conversation.
   - **What** — always. The *behavior change*, not the problem and not the file list: what the system does differently now. The diff already shows which files moved; the problem belongs in Why. ← Task Log "What" entries, concatenated.
   - **Why** — always, unless it'd just restate What (trivial copy/config fix) — then drop it. The section the diff cannot carry: root cause or constraint, and the alternative that was considered and rejected, one fragment each. Naming the rejected approach saves a review round more often than anything else here. ← Task Log "Why" entries, Assumptions, Scope Changes — only where they add something What didn't.
   - **Test** — what actually verified it, *with the outcome*: the cases run at Step 3.4/3.8 and what they showed, manual repro steps, or "nothing runnable" + what was inspected instead. Skip only when genuinely nothing to verify. ← Task Log `Verified:` lines and the Step 3 gate's full run — **not** the Plan's testing notes, which say what was intended; a reviewer reading "unit tests for the retry path" needs to know they ran, not that they were planned. Verification reported none → say that, don't invent. Scale target stated at Step 1 → one fragment here: the target, and whether a case measured it or Step 3.4 only scanned for it — the reviewer should know what scale this was sized for without opening the ticket.
   - **Rollback** — only if reverting isn't a plain revert (migration, feature flag, external state, data backfill). ← Plan/Scope Changes, only where flagged.
   - **Dependencies** — only if this PR depends on or blocks something else, including sitting on top of another unmerged branch. ← Assumptions/Plan, only where flagged; branch dependency ← `git merge-base HEAD <default-branch>` isn't `<default-branch>`'s tip → this branch is stacked, name the base branch, note it needs merging first.
   - **Reviewer focus** — optional, one line. Only when the diff has an uneven shape: one hunk carries the judgment call and the rest is mechanical (rename, generated file, moved code, formatting). Name where to read first and what can be skimmed. Diff is uniformly small or uniformly substantive → omit, it'd only say "read all of it". ← Task Log: the entries with a full What/Why block vs. the single-line mechanical ones.
   - **Out of scope** — optional, one line. Only when a reviewer would plausibly ask "why didn't this also…": a related defect seen and left, a follow-up already filed, a boundary drawn on purpose. Name the thing and where it went (ticket, later PR, deliberately never). ← Assumptions marked out of scope, Scope Changes that narrowed, Step 2 "not in this story" notes. Nothing was deferred → omit.
   - **What changed since last PR** — later-update case only. ← Scope Changes dated after the last PR Summary write.
4. **Cap every included section at 2 lines, except Why at 3** — Why is the one section that carries reasoning rather than facts, and root cause + rejected alternative rarely fit in two. Pulled content runs long — compress to the essential point(s), don't truncate mid-sentence. Can't fit without losing something needed → signal the task/decision was too broad, not a reason to break the cap. **Whole draft should read in 2-5 min.** Runs longer with every section already trimmed and only the earned ones kept → the story was too big for one PR, say so instead of shipping a wall of text.

   Never: restate the diff, narrate the journey ("first I tried…"), list the commits, or leave a heading in with nothing under it. Those are the four things a reviewer skims past, and the empty heading trains them to skip the section next time it's real.

   Template:
   ```markdown
   ## [<Ticket ID>](<ticket URL>): <imperative summary>

   **What:** <line 1>
   <line 2, only if needed>

   **Why:** <root cause / constraint>
   <rejected alternative, only if one was weighed>
   <line 3, only if needed>

   **Test:** <line 1>

   **Rollback:** <only if non-trivial>

   **Dependencies:** <only if any>

   **Reviewer focus:** <only if the diff is uneven>

   **Out of scope:** <only if something was deliberately left>
   ```
   Example (bug fix — Rollback and Dependencies both omitted, plain revert, none; Reviewer focus and Out of scope both earned):
   ```markdown
   ## [PARK-482](https://tracker.example/PARK-482): Fix duplicate charge on payment retry

   **What:** Retries now reuse one idempotency key generated per order, so the provider sees a single charge across the whole retry sequence.

   **Why:** Retries omitted the key, so the provider treated each one as a fresh charge.
   Considered de-duplicating on our side by order ID; rejected — provider-side idempotency is the contract, and a local check still races across two workers.

   **Test:** Regression test simulates a retried request, asserts a single charge — passes; provider-retry suite green.

   **Reviewer focus:** `retry.ts` key generation is the judgment call; the `charge.ts` change only threads the key through.

   **Out of scope:** Webhook replays can also double-charge — separate root cause, filed as PARK-490.
   ```
5. **Show the draft directly in chat, stop there.** Not a file draft awaiting a later write — the deliverable itself. No way to open a PR on GitHub/GitLab/Bitbucket → the chat message *is* the artifact, user copies it into the platform's PR field. Nothing written to the context file here — no later gate reads a stored PR summary back.
6. **Gate:** confirm or request changes, iterate in chat, until happy with what they'll paste.
7. Confirmed + file exists → write one line to PR Summary: `Last drafted: <date>` (anchor for diffing Scope Changes later, not a text copy). Update Status to `pr-ready`, same pass. Trip marker. No file → nothing to write, chat draft was the whole deliverable.
