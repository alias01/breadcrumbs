# Decisions

Why things are the way they are, for whoever touches this next. Kept short: only the
calls that are expensive to re-derive, or that look like bugs and aren't.

Chronological. Nothing here is a rule — see `.breadcrumbs/constitution.md` for those.

---

## 2026-08-28 — A task isn't done until something proves it

**Decision:** Step 3.4 verifies before checkoff; Step 3.8 re-runs the whole planned set at
the gate. Task Log entries carry a mandatory `Verified:` line, enforced by
`validate-context-file.mjs`.

**Why:** the skill recorded what was *decided* and never what was *proven*. A task could be
checked off, committed and PR'd with no test ever run — Step 2.4 wrote a testing plan that
Step 3 never executed, and Step 4's "no coverage found → say so" quietly encoded the gap.

**Why both a per-task and a gate-level run:** per-task proves each task in isolation; the
gate run proves they compose. The failure it exists to catch is task 5 breaking what task 2
established, which no per-task run can see.

**Why the validator and not just prose:** an unverified checkoff now fails structurally
instead of depending on the model to notice. Prose guidance was already there in spirit and
didn't hold.

---

## 2026-08-28 — Lite mode keeps two Step 2 checks

**Decision:** the collapsed Step 1+2 gate runs the bug-fix domain checks (`Bug fix` only) and
the constitution check (both lite types), inline.

**Why:** lite skipped Step 2 entirely, so the four bug-fix checks — root cause not symptom,
repro, same defect elsewhere, regression case — were unreachable for plain bug fixes, the
exact story type they exist for. Same for the constitution: "it's only a copy change" is
precisely the story that violates a standing rule quietly. Neither check scales with story
size, so neither belongs behind a size-based gate.

**Why inline in `SKILL.md` rather than routing to `step2-plan.md`:** that file is the largest
in the skill (~3.1k tokens). Pulling it into the cheapest, most frequent path to gain four
fragments would have raised lite-story cost ~50%. The +217 tokens on the router is the price
of not doing that, and it's paid by every story instead of that one.

---

## 2026-08-28 — Windsurf gets the router, always

**Decision:** `.windsurf/rules/breadcrumbs.md` ships the router only, and the build **throws**
if it exceeds the cap minus headroom. Ignores `--profile`.

**Why:** Windsurf enforces a hard ~12,000-char cap on workspace rules and truncates past it
**silently** — no error, no warning. The inlined build was 52,480 chars, so Windsurf users had
been getting roughly the router and Step 1 and nothing else: no gates, no Step 3, no template.
That isn't degraded output, it's a different skill.

**Why the build throws:** the original failure mode was silence. A guard that warns would
reproduce the bug.

**Counted in bytes, deliberately.** The source is full of `→`, `—` and `≤` (3 and 2 bytes in
UTF-8), so byte length runs ~1% above character count and the gap grows with the file — the
router is 9,304 characters but 9,412 bytes. Which unit Windsurf counts isn't documented;
bytes is the conservative read and the difference is free to absorb. Don't "simplify" the
guard back to `.length`.

**Open:** the cap number has conflicting reports (docs say 12,000 workspace / 6,000 global;
some sources claim 6,000 per file). `WINDSURF_HEADROOM` buys 1,000 bytes of margin. 6,000 is
not reachable without splitting the router itself — `SKILL.md` alone is 8,230 bytes — so if
that turns out to be the real limit it's a bigger change than a constant.

---

## 2026-08-28 — Lean profile for the other platforms

**Decision:** `--profile=lean` (default) ships the router plus repo-relative pointers for
Cursor, Cline, Kiro, Copilot and Gemini; `--profile=full` inlines everything.
~2.4k tokens per file instead of ~13.8k.

**Why the inlining existed:** the build script asserted these platforms "have no such
on-demand mechanism… pointers to files they'll never read." True when they were autocomplete
tools. They're all agentic now, with file-read tools, and `skills/breadcrumbs/*.md` is
committed — so the pointers resolve.

**Three things not to "fix" later:**

- **Pointers are plain relative paths on purpose.** Cursor's `@file` and Kiro's
  `#[[file:...]]` inline their target *eagerly*. Switching to the "native" mechanism would
  reintroduce exactly the cost this removes.
- **`AGENTS.md` stays full under both profiles.** It's the fallback for any tool that can't
  read files on demand, and the one place the guarantee is worth 13.8k.
- **The split is tiered, not just relocated.** What stays in the router is what's
  catastrophic if missed: the four gates, *never skip a gate*, lite-mode rules, verification
  (3.4/3.8), the context-file triggers, user override. A skipped reference read then costs
  plan *depth*, not a gate — degradation, not failure.

**The trade, stated plainly:** a pointer is a soft instruction and a weaker model may skip it.
`--profile=full` is the answer to a platform that ignores them. Rewording the pointers is not.

---

## 2026-09-02 — A scale target, not a performance pass

**Decision:** Step 1 captures one `Scale target:` line per story (volume, rate, latency budget —
or "none stated — current scale assumed"). Step 2 sizes the plan against it in one fragment;
Step 3.4's self-review scans the diff for the patterns that break under growth; a regression
against the target is a Mid-flight break, told to the user before any fix. Ponytail's exception
list gains "holds the scale target."

**Why not "every story optimized and scalable":** it has no pass/fail without a target, so it
would have become prose the model nods at — the same failure the `Verified:` line was added to
kill. It also fights ponytail (YAGNI) and lite mode (a copy change should pay nothing). The
skill already *mentioned* performance in three places (Step 1 taxonomy, Step 2 domain rows,
`perf` commit type) and *enforced* it in none: ponytail's exception list omitted it, Step 3.4
checked function only, and Step 3.7's triggers had no room for "it got slower." An N+1 loop
that worked on the dev fixture shipped with nothing to catch it.

**Why the target lives at Step 1:** the user's ask was to know, up front, what scale the story
is being built for — not to optimize blindly. "Current scale assumed" is a legitimate answer;
*not knowing* is the failure. Capturing it once lets every later step judge "works" against
the same number instead of re-deriving it.

**Why lite gets only the scan, not the Step 2 check:** the Step 2 check needs the plan, and
lite has none. The scan runs inside verification, which lite never collapses, so lite still
catches the regression — at the diff, where it's visible, rather than at a plan that doesn't
exist. Same reasoning as the two surviving lite checks above: cost doesn't scale with story
size.

**Why no benchmark step and no performance domain row:** most repos have nothing to run one
against; "nothing runnable" is already a legitimate verdict, and the testing plan now says up
front when the scan is the only check. A domain row would run on every story, which is exactly
the blanket mandate this replaces. Repo-specific rules ("all list endpoints paginated") belong
in `.breadcrumbs/constitution.md`, which Step 2.8 and lite already enforce.

---

## 2026-09-04 — Graphify answers relationship questions only

**Decision:** "Investigation scope" routes by question type, not by whether graphify is
present. "Where is X" → the platform's native code search (semantic index or grep), one
path, then the file it points at. "What relates to what" (Step 1 dependencies, Step 2 Flow)
→ `graphify` `query`/`path`/`explain` with a tight `--budget`, only when `graphify-out/`
already exists. Lite mode never touches the graph. Never build a graph mid-story.

**Why:** 1.4.0 said "graphify first, it's cheaper than grep" — true of the build (AST, no
LLM tokens), false of a query. Each query loads the graph vocabulary, injects a subgraph
dump, and the agent still reads the real files after. Graph-then-grep-then-read on every
story is the dual-retrieval pattern that costs more than either path alone, and it landed
hardest on lite stories, which are "where is X" by definition. The graph's real edge is
call/import edges grep can't see — exactly the Flow question, so that's where it stays.

**Why platform-neutral wording:** the section ships verbatim to eight platforms. The old
text named Claude Code's `Explore` agent, meaningless on the other seven, and told Cursor,
Windsurf and Copilot to bypass their own indexes, the cheapest lookup they have. "Native
code search" lets each platform take its own cheapest path without the rule knowing which
platform it's on.

**Why `graphify-out/` present, not "skill installed":** an installed skill with no graph
means building one before the first gate — free for code, LLM tokens for docs, a detour
either way.

---

## Open — the behavioural half is unverified

Everything verified so far is deterministic: validators, build guards, file sizes, TOML
validity, cross-references. **No scenario in `skills/breadcrumbs/tests/scenarios.md` has been
run against a live model on any platform.**

That matters most for the lean profile. Scenario 11 defines the check and the three outcomes:

| Outcome | Meaning | Action |
|---|---|---|
| Pass | reference files read at each gate | keep lean |
| Partial | gates hold, plan depth thin | designed degradation — decide per platform |
| Fail | improvised from router alone | that platform → `--profile=full` |

Worth running on one platform before relying on it anywhere. Cursor is the fastest to test.

---

## Open — review follow-ups, 2026-09-04

Found in the same review that fixed the install path, resume, `revert` commits and the
manual-edit review. Not broken, so deferred. Each is small; none blocks a release.

**Process gaps (skill text):**

- **Branch guidance.** Step 3.6 commits per task but nothing says to create a story branch
  first — a user on `main` gets N commits on `main`, then Step 4 drafts a PR for a branch
  that doesn't exist. One line before Step 3: confirm or create the branch, named from the
  story slug.
- **Resume never reconciles against git.** Step 3.6 claims the Task Log and `git log` are
  reconstructable from each other, but resume trusts the checklist alone. After a rebase,
  branch switch or teammate revert, the file says "3/5 done" and the branch disagrees.
  Cross-check checked-off tasks against commits on resume; mismatch → say so.
- **Constitution commits are unspecified.** `.breadcrumbs/constitution.md` is "meant to be
  committed" but no step commits it, so it's swept into whichever task commit runs
  `git add -A`, or never lands. Give it its own `chore` commit when written.
- **`Status: done` is never set.** Step 4.7 sets `pr-ready`; cleanup offers deletion on
  merge. Either set `done` on merge confirmation or drop it from the template + validator.
- ~~**Step 4 says "fixed five sections" then lists a sixth**~~ — resolved 2026-09-04: five core + two optional one-liners + the re-draft addendum, counted honestly. Same pass fixed the PARK-482 example, whose What/Why were swapped against their own definitions.
- **Lite mode's `Scale target:` line isn't in the router.** Scenario 12 expects it at the
  collapsed lite gate; the Lite mode section of `SKILL.md` never mentions it, and
  lean-profile platforms only see the router there.

**Enforcement / tooling:**

- **Validator doesn't check `Scale target:`.** The 2026-09-02 decision argues prose alone
  doesn't hold, yet the Understanding Summary's `Scale target:` line got prose only. Add it
  to `validate-context-file.mjs`.
- **No automated tests for the deterministic parts.** Two validators, a build guard that
  must throw, TOML validity, the Windsurf byte cap — and no `package.json`/`node --test`.
  Scenarios 10–11 already list the checks; wire them into CI. Would have caught the
  `Revert "..."` header failing the validator.
- **Hook regex is narrow.** `hooks/detect-story.mjs` misses Given/When/Then, `AC:`, ticket
  keys like `PARK-482`, and a bare "let's continue". It also re-nudges on every matching
  prompt mid-story.
