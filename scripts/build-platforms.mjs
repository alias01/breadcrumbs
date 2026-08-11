#!/usr/bin/env node
// Compiles skills/breadcrumbs/Skill.md (the canonical source) into
// platform-specific instruction files. Re-run after editing Skill.md.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

const SOURCE = "skills/breadcrumbs/Skill.md";
const REFERENCES = [
  "skills/breadcrumbs/context-file-mechanics.md",
  "skills/breadcrumbs/step1-understand.md",
  "skills/breadcrumbs/step2-plan.md",
  "skills/breadcrumbs/step3-implement.md",
  "skills/breadcrumbs/step4-pr.md",
  "skills/breadcrumbs/context-template.md",
];

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

// Skill.md points at the step files, context-file-mechanics.md, and
// context-template.md, and expects Claude Code to Read each on demand (only
// when that gate is reached / first context-file write). The other platforms
// below have no such on-demand mechanism — everything they load is loaded
// every time — so all of it gets inlined here instead of dangling pointers
// to files they'll never read.
const reference = REFERENCES.map((path) => readFileSync(path, "utf8").trim()).join("\n\n---\n\n");
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
