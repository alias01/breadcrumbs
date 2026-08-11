# Breadcrumbs

**A user story rarely survives contact with reality unchanged — and neither does the reasoning behind it, once the session that produced it is gone.**

Breadcrumbs is a skill that runs a user story from a pasted ticket to a PR-ready implementation through four gated steps, while keeping a persistent trail of what was decided, why, and what's left — so the work can resume in a different session, or even a different AI platform, without losing any of it.

## Before / after

**Without breadcrumbs:** you paste a ticket, work through it for twenty minutes, hit a scope change, keep going. Tomorrow's session — or a teammate's, or a different AI tool entirely — has none of that. It re-reads the diff, guesses at intent, and the reviewer who asks "why is this written this way?" three weeks later gets a shrug.

**With breadcrumbs:** the same session writes its reasoning down at the moment it's made — not a retrofit, not a changelog entry bolted on later. Come back in a week, on a different machine, with a different AI, and it reads the trail and picks up exactly where it left off.

## How it works

Every story runs through four gates, confirmed with you at each one:

```
1. Understand   → restate the story, surface assumptions, confirm
2. Plan         → design depth scaled to story size, task breakdown, confirm
3. Implement    → one task at a time, logged as it happens
4. PR           → What / Why / Test / Rollback / Dependencies — only what a reviewer needs
```

Nothing is written to disk until it needs to be. A story that finishes in one sitting leaves no trace — that's the expected path, not a skipped step. A context file only gets created when the work needs to survive past the current conversation: you say "let's continue tomorrow," a test fails mid-implementation, scope changes, or the conversation drifts to something else entirely (breadcrumbs checkpoints once and asks first, it doesn't assume).

Once a file exists, it also tracks the story's **Flow** — the set of files the plan expects to touch, decided once at planning — so a hand-edit that lands somewhere unplanned gets flagged instead of silently absorbed.

## Install

### Claude Code

```
/plugin marketplace add alias01/breadcrumbs
```
```
/plugin install breadcrumbs@breadcrumbs
```
(two separate prompts — the second won't find the marketplace until the first completes)

Breadcrumbs also plugs into a `UserPromptSubmit` hook ([`hooks/detect-story.mjs`](hooks/detect-story.mjs)) that recognizes ticket-shaped prompts and nudges toward the skill automatically, instead of relying on you to invoke it.

### Cursor / Windsurf / Cline / Kiro / GitHub Copilot

No package manager — copy the matching rule file from this repo into your project:

| Platform | File |
|---|---|
| Cursor | [`.cursor/rules/breadcrumbs.mdc`](.cursor/rules/breadcrumbs.mdc) |
| Windsurf | [`.windsurf/rules/breadcrumbs.md`](.windsurf/rules/breadcrumbs.md) |
| Cline | [`.clinerules/breadcrumbs.md`](.clinerules/breadcrumbs.md) |
| Kiro | [`.kiro/steering/breadcrumbs.md`](.kiro/steering/breadcrumbs.md) |
| GitHub Copilot | [`.github/copilot-instructions.md`](.github/copilot-instructions.md) |

### Everything else

Any tool that reads [`AGENTS.md`](AGENTS.md) from the project root picks up breadcrumbs with no setup — Codex, Amp, Jules, JetBrains Junie (once pointed at the file), and others.

Works alongside the [ponytail](https://github.com/DietrichGebert/ponytail) skill for how code gets written during the Implement step — breadcrumbs owns the process and the trail, ponytail owns keeping the diff small.

## Development

[`skills/breadcrumbs/Skill.md`](skills/breadcrumbs/Skill.md) is the canonical source. Every other platform file is generated from it — edit `Skill.md`, then re-run:

```bash
node scripts/build-platforms.mjs
```

[`skills/breadcrumbs/context-template.md`](skills/breadcrumbs/context-template.md) defines the context file's structure and guardrails; it gets inlined into the generated platform files (they have no on-demand file-loading, unlike Claude Code, which reads it only once per story).

## FAQ

**Does every story get a context file?**
No. If all four gates finish in one sitting, nothing is ever written to disk — that's the common case, not an edge case.

**What if I'm running several stories at once?**
Resuming checks `.claude/context/` for existing files. More than one candidate and your prompt doesn't clearly point to one → it lists them (filename, title, status — a cheap partial read, not a full one) and asks which.

**Does it slow down small fixes?**
Bug fixes and copy/config changes run in lite mode: no context file, no design step, a two-task ceiling. Full rigor only kicks in if something mid-flight actually needs it.

**Why "breadcrumbs"?**
The trail is the point — not the story itself, but the ability to follow it back.

## License

[MIT](LICENSE).
