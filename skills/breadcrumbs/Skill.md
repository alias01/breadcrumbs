---
name: breadcrumbs
description: Run a user story from a pasted ticket all the way to a PR-ready implementation through four gated steps — clarify, plan, implement, PR — while keeping a persistent context file so the work can resume in a different session or even a different AI platform without losing decisions, assumptions, or progress. Use this whenever a user pastes a user story, ticket, or feature request and wants it implemented, whenever they say "continue" or "resume" on an existing story, whenever scope changes or a test fails mid-implementation and the story needs to be reworked, and whenever they ask for a PR or PR summary. Also trigger if the user says a story got too big to explain, or asks why a past decision was made. Works alongside the ponytail skill for the implementation step.
license: MIT
---

## Core Philosophy

A story never survives reality unchanged: assumptions filled in, scope grows, tests surface edge cases. Fine in isolation → breaks down when nobody (future session, different AI) can reconstruct what was decided, why, what's left.

Four gates (Understand → Plan → Implement → PR), confirmed with the user each time, backed by one persistent file → any session resumes mid-story.

**Why the writes pay off:** reasoning captured at decision-time = cheap. Reconstructed later (reviewer asks why / scope shifts) = expensive, often inaccurate by then. Task Log "Why" = original reasoning, not a retrofit. Scope Changes = only what changed, not the full history re-derived.

## Communication style

Chat only — context file has its own denser style ("Content style" in `context-template.md`). Don't conflate.

Terse, bullet/fragment, glanceable. Senior/expert audience → jargon freely, no hedging, no restating known context, no multi-paragraph narration. Expand only if asked / confusion signaled, then step down in complexity.

## Investigation scope

Understanding a story needs enough repo context to ask good questions and plan real tasks — not a full-repo read. Search outward from the story's own keywords/entities (feature name, endpoint, table, component, error message) rather than surveying the tree.

**`graphify` first.** If a knowledge graph exists for this repo (`graphify-out/` present) or the skill is installed, query it for the story's keywords/entities before touching the filesystem directly — it's cheaper than grep/Explore and answers "what relates to what" questions a raw text search can't. Fall back to targeted lookups (grep for the term, `Explore` agent at "quick" or "medium" breadth) only for what graphify's query/path/explain tools don't resolve, or when graphify isn't present at all. Full-file reads are last resort, for whatever neither graphify nor a targeted lookup settles. Stop once Step 1's taxonomy categories are answered or Step 2's Flow is identified — widen only when a specific remaining unknown demands it, never on a general "let's see what's here."

## The context file

**Created only on trigger, never by default.** Every story starts stateless: gates run in chat only, nothing on disk. Three triggers create the file:
- **Stop signal** — "let's continue tomorrow," "pause here," or similar → create now, backfill Original Story/Understanding/Plan/Task Checklist from the conversation, at whatever step you're at. Mode/design depth unchanged — this trigger alone doesn't escalate lite → full.
- **Mid-flight break** — test fails, an assumption breaks, scope changes (Step 3.5) → create if it doesn't exist yet, backfill same way, log the Scope Change entry. Lite mode also escalates to full here (more rigor now warranted).
- **Topic shift** — conversation moves off the current story to something clearly different, mid-story, with no explicit stop signal or mid-flight break → don't silently create/write. Ask once: "Looks like we're moving off this story — want me to checkpoint it first?" Confirmed → same as Stop signal: create if it doesn't exist, backfill Understanding/Plan/Task Checklist at whatever step you're at, mode/design depth unchanged. Declined → don't create, don't ask again for this same detour, continue normally.

No trigger fires, all four gates finish in one sitting → no file, ever. Expected path, not a skipped step.

**Trip marker:** write happens → one line before the gate message naming what was written, e.g. `[context file: wrote Understanding Summary + Assumptions]`. No file yet → no marker, content just shown in chat.

**Mechanics (location, not committed, resuming, cleanup, efficiency):** see `context-file-mechanics.md`. Read once, the first time a trigger above actually fires — not before.

**Project constitution** — a separate, optional, committed file of standing repo-wide rules (distinct from the per-story file above). See "Project constitution" in `context-file-mechanics.md` for when it's created and how Step 2 checks against it.

**File structure & guardrails:** see `context-template.md`. Read once, first creation only — not on resume, not if no trigger fires. One guardrail without opening that file: **never skip a gate**, file or no file.

## Lite mode

Auto-detected Step 1.4: `Bug fix` / `Copy/config/content change` → lite. Everything else → full mode, per the four steps below. Single source of truth for what lite changes — step files aren't separately annotated.

- Step 1 gate + all of Step 2 collapse into one, unconditionally (lite types are always simple enough, no Material/Cosmetic check needed): state approach ("no design" depth) + task list (max 2), one message ending "Here's what I understand and how I'd build it — confirm?" → Step 3.
- Step 3: one wrap-up message after all tasks, not per-task.
- Step 4: PR draft as usual, from the conversation.
- File creation: same triggers as "The context file" above, no lite exception. Scope change / test failure mid-flight → escalates lite → full too, same moment the file's created. Say so in one line.

## The four steps

Read the step's file when you actually reach that gate — don't preload the others up front, that's the point of splitting them out.

| Step | File | Gate |
|---|---|---|
| 1 — Understand & Clarify | `step1-understand.md` | Understanding + Assumptions confirmed (or folded into Step 2 if zero Material unknowns) |
| 2 — Plan | `step2-plan.md` | Plan + task breakdown confirmed (skipped in lite mode) |
| 3 — Implement | `step3-implement.md` | Every task checked off |
| 4 — PR | `step4-pr.md` | PR draft confirmed in chat |

## What NOT to do

Never skip a gate, even in lite mode — lite collapses which gates exist, never waives confirmation. Full guardrail list: `context-template.md`, read alongside the template on first write.
