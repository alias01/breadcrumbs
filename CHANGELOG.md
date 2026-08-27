# Changelog

Format based on [Keep a Changelog](https://keepachangelog.com/). Versions are bumped manually — see VERSION.

## [2.0.0] - 2026-08-27

### Breaking
- The skill's entrypoint is now `skills/breadcrumbs/SKILL.md`, not `Skill.md`. Anything referencing the old path (a fork, a vendored copy, a script) needs updating. On case-sensitive filesystems the plugin never loaded under the old name, which is what prompted the rename.
- Installing the plugin now registers a `UserPromptSubmit` hook (`hooks/hooks.json`) that previously only ran for people working inside this repo. It prints a nudge on ticket-shaped prompts; remove the `hooks` key from `.claude-plugin/plugin.json` to opt out.
- `scripts/build-platforms.mjs` no longer refreshes `~/.claude/skills/breadcrumbs` by default — pass `--install`. Existing scripts that relied on the implicit sync now silently no-op.
- `validate-context-file.mjs` rejects context files that 1.5.0 accepted: a `pr-ready` (or `done`) file must now carry a `Last run:` line under `## Verification`, and dates on the `Last drafted:` / `Last run:` anchors must be ISO 8601. Add the block to any in-flight story file, or let the next gate write add it.

### Features
- **skill:** add parked statuses, branch binding, and ISO dates
- **skill:** re-enter Step 3 when review comes back on an opened PR
- **skill:** verify once after implementation, before the Step 3 gate

### Fixes
- **scripts:** parse build/ci and breaking commits in the changelog
- **skill:** repair plugin loading, hook detection, and commit validation

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
