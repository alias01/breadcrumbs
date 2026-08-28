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

**Why inline in `Skill.md` rather than routing to `step2-plan.md`:** that file is the largest
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
not reachable without splitting the router itself — `Skill.md` alone is 8,230 bytes — so if
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
