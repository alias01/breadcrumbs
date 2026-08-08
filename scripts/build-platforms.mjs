#!/usr/bin/env node
// Compiles skills/breadcrumbs/Skill.md (the canonical source) into
// platform-specific instruction files. Re-run after editing Skill.md.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SOURCE = "skills/breadcrumbs/Skill.md";
const REFERENCE = "skills/breadcrumbs/context-template.md";

function parseSkill(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error(`${SOURCE} is missing frontmatter`);
  const [, frontmatter, body] = match;
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  if (!description || !name) throw new Error("frontmatter missing name/description");
  return { name, description, body: body.trim() };
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.endsWith("\n") ? content : content + "\n");
  console.log(`wrote ${path}`);
}

const raw = readFileSync(SOURCE, "utf8");
const { name, description, body } = parseSkill(raw);
const banner = `<!-- GENERATED from ${SOURCE} by scripts/build-platforms.mjs — edit the source, then re-run the script. -->\n\n`;

// Skill.md points at context-template.md and expects Claude Code to Read it
// on demand (first context-file write only). The other platforms below have
// no such on-demand mechanism — everything they load is loaded every time —
// so they get the reference content inlined here instead of a dangling
// pointer to a file they'll never read.
const reference = readFileSync(REFERENCE, "utf8").trim();
const fullBody = `${body}\n\n---\n\n${reference}`;

// AGENTS.md — portable, instruction-only, no frontmatter.
write("AGENTS.md", `${banner}# ${name}\n\n${fullBody}\n`);

// Cursor — .mdc with frontmatter Cursor understands (agent-requested rule).
write(
  ".cursor/rules/breadcrumbs.mdc",
  `---\ndescription: ${description}\nalwaysApply: false\n---\n\n${banner}${fullBody}\n`
);

// Windsurf — model-decision rule, activates based on description match.
write(
  ".windsurf/rules/breadcrumbs.md",
  `---\ntrigger: model_decision\ndescription: ${description}\n---\n\n${banner}${fullBody}\n`
);

// Cline — plain instructions file, no frontmatter convention.
write(".clinerules/breadcrumbs.md", `${banner}# ${name}\n\n${fullBody}\n`);

// Kiro — steering doc, manually referenced (safe default; switch to
// `inclusion: always` if you want it loaded on every request instead).
write(
  ".kiro/steering/breadcrumbs.md",
  `---\ninclusion: manual\ndescription: ${description}\n---\n\n${banner}${fullBody}\n`
);

// GitHub Copilot — repo-wide custom instructions, always loaded, no
// per-skill triggering available, so this is intentionally the full text.
write(".github/copilot-instructions.md", `${banner}# ${name}\n\n${fullBody}\n`);

// Claude Code plugin manifest — wraps the existing skill, doesn't duplicate it.
write(
  ".claude-plugin/plugin.json",
  JSON.stringify(
    {
      name,
      description,
      version: "1.0.0",
      license: "MIT",
      skills: ["./skills/breadcrumbs"],
    },
    null,
    2
  )
);

console.log("\nDone. skills/breadcrumbs/Skill.md remains the canonical source.");
