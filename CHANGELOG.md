# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/). Versions are bumped manually — see VERSION.

## [Unreleased]

### Changes
- **breadcrumbs:** route investigation by question type — native search for lookups, graphify only for relationship/Flow questions and only when a graph exists; lite mode skips the graph
- **platforms:** drop Claude-only `Explore` wording from the shared investigation rule
- **breadcrumbs:** investigation marker before every gate, counted lookup/graph-query caps, never open the graph report
- **tests:** scenario 13 pins the routing down on lite, full, and no-graph repos
- **hooks:** `guard-read.mjs` — files over 300 lines are readable only as a line range (PreToolUse on Read and `cat`); ships in the plugin manifest
- **breadcrumbs:** fewer calls per story — one resume probe, no step files in lite or under a waiver, validator path stated, quiet scoped test runs, regression test first on bug fixes; measured in docs/decisions.md

## [1.6.0] - 2026-08-28

### Features
- **platforms:** lean router profile, ~84% smaller on five targets
- **breadcrumbs:** verify every task before checkoff

### Fixes
- **windsurf:** ship router only, cap was silently truncating 77%

### Documentation
- record platform decisions, make windsurf cap byte-based

## [1.5.0] - 2026-08-22

### Features
- **breadcrumbs:** bound question/plan ceremony, portable paths

## [1.4.0] - 2026-08-21

### Features
- **breadcrumbs:** learn constitution rules from manual edits, prefer graphify for investigation

## [1.3.0] - 2026-08-18

### Features
- **gemini:** add Gemini CLI custom slash command

## [1.2.0] - 2026-08-15

### Other
- Move context/constitution storage from .claude/ to platform-neutral .breadcrumbs/
- Flag stale pr-ready context files during the resume scan, offer batch cleanup

## [1.1.0] - 2026-08-13

### Other
- Trim restated content in context-file-mechanics.md and context-template.md
- Flag stacked-branch dependencies in PR drafts
- Trim restated content in Step 2-4 instructions

## [1.0.0] - 2026-08-12

### Other
- Document known limitations, add missing perf commit type
- Revert "Delegate large Step 3 implementations to sub-agents"
- Delegate large Step 3 implementations to sub-agents
- Add project constitution, resume compaction, clarify taxonomy
- Sync installed skill copy, add deterministic validators, add golden-path scenarios
- Add per-task Conventional Commits step before PR creation
- Split Skill.md into per-step files for progressive loading
- Proofread README, tone down AI-generated feel
- Give README a stronger title treatment
- Make README Before/After concrete instead of abstract
- Add Mermaid diagrams to README for the four-gate flow and triggers
- Add README and MIT LICENSE
- Pin multi-story resume listing to a cheap partial read
- Add planned Flow tracking and simplify PR template to fixed sections
- Add topic-shift trigger, multi-story resume disambiguation, and manual-edit logging
- Cut skill-load token cost and defer context-file creation to a trigger
- Consolidate lite-mode branching into a single section
- Add lite mode for small stories and trim per-invocation context load
- Merge pull request #3 from alias01/gate-skill-followups
- Refine the four-gate skill: type-scoped planning depth, task caps, and a leaner PR step
- Merge pull request #1 from alias01/compile-platforms-and-token-tuning
- Compile breadcrumbs skill to multi-platform formats, add passive-activation hook, and trim gate token overhead
- init
