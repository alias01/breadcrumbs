<h1 align="center">Breadcrumbs</h1>

<p align="center"><em>Sessions end. The trail doesn't.</em></p>

Hansel and Gretel had the right idea: don't trust the path to remember itself, drop something behind you that will. A user story rarely survives contact with reality unchanged — assumptions get filled in, scope shifts, a test turns up an edge case nobody planned for. The reasoning behind those changes doesn't survive either, unless someone writes it down while it's still fresh.

Breadcrumbs runs a user story from a pasted ticket to a PR-ready implementation through four gated steps, and drops a trail of what got decided and why along the way. Pick the work back up in a new session, on a new machine, even on a different AI platform, and it's all still there — nobody has to reconstruct it from a diff.

## Before / after

Say you paste `PARK-482: fix duplicate charge on payment retry`. Three tasks in, a test fails: turns out retries need a second idempotency guard too, unrelated to the original bug. Scope changes on the spot. You stop for the day with two tasks left.

**Without breadcrumbs**, tomorrow's session — or a teammate's, or a different AI entirely — starts from the diff alone. It can't tell the idempotency guard was a deliberate scope change rather than scope creep, so it either re-litigates a decision that's already settled or ships past it with no idea why the code looks the way it does. Whoever writes the PR description is reconstructing it from what's left on screen, and the reviewer who asks "why is this written this way?" next month gets a shrug.

**With breadcrumbs**, that session opens with:
> *Here's where this stood: PARK-482, Step 3 of 4, 3/5 tasks done. Scope changed on 2026-08-11 — retries also needed a second idempotency guard, unrelated to the original bug. Two tasks left: add the guard, add regression coverage.*

No re-reading the diff, no guessing at intent — the trail just picks up where it left off, on whatever machine or platform happens to be open.

| | Without | With breadcrumbs |
|---|---|---|
| Resuming after a break | Re-read the diff, guess at intent | Reads the trail, states exactly where it stood |
| Mid-flight scope change | Buried in scrollback, easy to lose | Logged with before/after/why the moment it happens |
| Switching AI tools or machines | Starts from zero | Any platform reading the file picks up identically |
| "Why is this written this way?" | Reconstructed from memory of a diff | Task Log's original reasoning, not a retrofit |
| PR description | Written after the fact from what's left | Pulled straight from the trail — What/Why/Test/Rollback/Dependencies, plus Reviewer focus / Out of scope when earned |

## How it works

Every story runs through four gates, confirmed with you at each one:

```mermaid
flowchart LR
    T([Paste a ticket]) --> S1["1 · Understand<br/>restate, surface assumptions"]
    S1 -- confirm --> S2["2 · Plan<br/>design depth scaled to size"]
    S2 -- confirm --> S3["3 · Implement<br/>one task at a time, logged"]
    S3 -- all tasks checked --> S4["4 · PR<br/>What / Why / Test / Rollback / Dependencies"]
    S4 -- confirm --> D([PR draft in chat])

    S1 -.-> G
    S2 -.-> G
    S3 -.-> G
    G[(context file<br/>only if a trigger fires)]
```

Nothing hits disk until it has to — a story that wraps up in one sitting never gets a file at all, which is the normal case, not something falling through the cracks. A context file only shows up once the work needs to outlast the current conversation:

```mermaid
flowchart TD
    W[Mid-story] --> Trig{Trigger?}
    Trig -- "\"let's continue tomorrow\"" --> C[Create context file]
    Trig -- "test fails / scope changes" --> C
    Trig -- "context window filling up" --> C
    Trig -- "conversation drifts elsewhere" --> Ask{"Checkpoint first?<br/>(asked once)"}
    Ask -- yes --> C
    Ask -- no --> W
    Trig -- none, story finishes --> None([No file, ever])

    C --> R["Next session, same or different platform:<br/>read file → resume where it left off"]
```

Once a file exists, it also tracks the story's **Flow**, the set of files the plan expects to touch, decided once up front at planning. A hand-edit that lands somewhere the plan didn't expect gets flagged rather than quietly folded in.

## Install

### Claude Code

```
/plugin marketplace add alias01/breadcrumbs
```
```
/plugin install breadcrumbs@breadcrumbs
```
(two separate prompts — the second won't find the marketplace until the first completes)

The plugin also registers two `UserPromptSubmit` hooks: [`hooks/detect-story.mjs`](hooks/detect-story.mjs) recognizes ticket-shaped prompts and nudges toward the skill automatically, instead of relying on you to invoke it; [`hooks/detect-context-growth.mjs`](hooks/detect-context-growth.mjs) estimates session context usage from the transcript and nudges toward a checkpoint once it crosses 50% (then 75%, 90%), so a long story gets a context file before the harness's own compaction or context limit summarizes the reasoning trail away — and switches into a [minimal-context mode](skills/breadcrumbs/minimal-context-mode.md) for the rest of that story in that session: tighter investigation caps, terser chat, no re-reading files, no pasting long output back into chat, while verification and gate confirmations stay full-strength. Its default assumes a 200k-token context window — set `BREADCRUMBS_CONTEXT_WINDOW` if you're on an extended context tier. Working from a checkout of this repo instead of the plugin → the same hooks are wired in [`.claude/settings.json`](.claude/settings.json).

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

[`skills/breadcrumbs/SKILL.md`](skills/breadcrumbs/SKILL.md) is the canonical source. Every other platform file is generated from it — edit `SKILL.md`, then re-run:

```bash
node scripts/build-platforms.mjs
```

[`skills/breadcrumbs/context-template.md`](skills/breadcrumbs/context-template.md) defines the context file's structure and guardrails.

**Build profiles.** The generated files come in two shapes:

```bash
node scripts/build-platforms.mjs                  # lean (default)
node scripts/build-platforms.mjs --profile=full   # inline everything
```

*Lean* ships the router and leaves the step files as repo-relative pointers the agent reads at each gate — ~1.9k tokens per platform file instead of ~10.8k. *Full* inlines everything: bigger, but nothing depends on the agent choosing to follow a pointer.

Lean is a real trade. A pointer is a soft instruction, and a weaker model may skip it. It's managed by what stays in the router — the four gates, "never skip a gate", lite-mode rules, the verification requirement and the context-file triggers are all inline, so a skipped reference read costs plan *depth*, not a gate. If a platform ignores the pointers outright, rebuild with `--profile=full`.

Two files ignore the flag: [`AGENTS.md`](AGENTS.md) is always full (it's the fallback for tools that can't read files on demand), and `.windsurf/rules/breadcrumbs.md` is always lean (Windsurf enforces a 12,000-char cap and truncates past it silently — the build fails rather than ship a half-skill).

**Local Claude Code copy.** Claude Code loads skills from `~/.claude/skills/`, not from this repo, so edits here are invisible at runtime until that copy is refreshed. The build never touches it on its own — pass `--install` when you want it synced:

```bash
node scripts/build-platforms.mjs --install
```

### Releasing

[`docs/decisions.md`](docs/decisions.md) records why the non-obvious calls were made — the Windsurf cap, why pointers are plain paths rather than `@file`, what `--profile=full` is for — plus what's still unverified. Read it before "fixing" something in the build that looks wrong.

Versioning is manual — [`VERSION`](VERSION) is the single source of truth, read by `build-platforms.mjs` into the generated `plugin.json`.

```bash
# 1. Bump the version by hand
echo "1.1.0" > VERSION

# 2. Generate the CHANGELOG.md entry from commits since the last tag
node scripts/generate-changelog.mjs

# 3. Review/edit the generated section, then rebuild and commit
node scripts/build-platforms.mjs
git add VERSION CHANGELOG.md .claude-plugin/plugin.json
git commit -m "chore(release): v1.1.0"

# 4. Tag and push — this triggers the release workflow
git tag v1.1.0
git push origin main v1.1.0
```

[`.github/workflows/release.yml`](.github/workflows/release.yml) creates the GitHub Release automatically on tag push, using the matching `CHANGELOG.md` section as release notes.

## FAQ

**Does every story get a context file?**
No — most stories finish in one sitting and never touch disk.

**What if I'm running several stories at once?**
Resuming checks `.breadcrumbs/context/` for existing files. More than one candidate and your prompt doesn't clearly point to one → it lists them (filename, title, status — a cheap partial read, not a full one) and asks which.

**Does it slow down small fixes?**
Bug fixes and copy/config changes run in lite mode: no context file, no design step, a two-task ceiling. Full rigor only kicks in if something mid-flight actually needs it.

**Why "breadcrumbs"?**
Because what matters isn't the story itself — it's being able to find your way back to it.

## License

[MIT](LICENSE).
