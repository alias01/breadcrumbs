# Minimal context mode

Read once, the moment the Context growth trigger fires (`SKILL.md`). Stays in effect for the rest of *this session*, on *this story* — a fresh session starts clean, nothing carries over. A later threshold on the same story (50% → 75% → 90%) doesn't escalate this file, only the "suggest a new session" nudge gets more insistent.

**Investigation — lite caps apply regardless of full/lite classification:**
- Still before the Step 2 gate → native lookups ≤2 for the rest of it (down from 3). Already past Step 2, into Step 3 → ≤2 native lookups per remaining task — Step 3 has no baseline cap of its own to reduce, this **is** the cap.
- Graph queries: 0 for the rest of the story — native search only, follow imports/calls by hand.
- Already read or opened this session → reuse it, never re-open it "to be sure."
- No tree survey, no re-listing a directory already listed this session.

**Chat:**
- Fragments over sentences wherever the normal style allowed a full paragraph. No restating the story, the plan, or a decision already on record in the context file — point at it instead ("per Plan §2") if it needs naming at all.
- One investigation marker per gate, not a narrated trail of what was tried — the count is the record, not the search.
- No "let me check X" / "that confirmed X" bracketing around a tool call — do it, state the one-line outcome once.

**Files:**
- Edit, never rewrite-whole-file — smallest diff that does the job, even for a large change.
- Never re-read a file just to confirm a write landed (already the rule for the context file in `context-file-mechanics.md` — now every file).
- Don't paste long tool output, diffs, or file contents into chat — one-line summary; the file is the record, not the transcript.

**Gates:**
- Never skip a gate for context reasons — lite/full still confirms what it always confirmed. State it in the fewest lines that satisfy the confirmation, not zero lines.
- Skip optional PR sections (Reviewer focus / Out of scope) unless asked.
- Skip the constitution re-check if it already ran this story.

**Never trade correctness for tokens.** Verification (3.4/3.8) stays full-strength — a shortened check that misses a regression burns more context re-litigating it later than the check would have cost now. Never fold two Task Log entries into one lossy line, never drop a scope change's `Why`, never skip a gate — that record is exactly what this mode exists to protect while the session itself runs short on room.
