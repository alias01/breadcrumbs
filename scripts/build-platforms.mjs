#!/usr/bin/env node
// Compiles skills/breadcrumbs/Skill.md (the canonical source) into
// platform-specific instruction files. Re-run after editing Skill.md.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { homedir } from "node:os";

const SOURCE = "skills/breadcrumbs/Skill.md";
const VERSION = readFileSync("VERSION", "utf8").trim();
const SCRIPTS = [
  "skills/breadcrumbs/scripts/validate-context-file.mjs",
  "skills/breadcrumbs/scripts/validate-commit-message.mjs",
];
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
  return { name, description, frontmatter: frontmatter.trim(), body: body.trim() };
}

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.endsWith("\n") ? content : content + "\n");
  console.log(`wrote ${path}`);
}

const raw = readFileSync(SOURCE, "utf8");
const { name, description, frontmatter, body } = parseSkill(raw);
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
// `globs:` present-but-empty matches Cursor's own Agent Requested example.
write(
  ".cursor/rules/breadcrumbs.mdc",
  `---\ndescription: ${description}\nglobs:\nalwaysApply: false\n---\n\n${banner}${fullBody}\n`
);

// Windsurf — model-decision rule, activates based on description match.
// Windsurf caps rules at 6,000 chars each (12,000 total) and silently
// truncates past that, so the full inlined body (~47K chars) never reaches
// Cascade intact — it'd lose everything past roughly Step 2. Point at
// AGENTS.md instead of inlining; Cascade reads it on activation.
const windsurfBody = `# ${name}\n\nBefore acting on a user story, ticket, or a "continue"/"resume" request, read AGENTS.md at the repo root in full and follow it exactly. It has the complete four-gate workflow (Understand, Plan, Implement, PR), the context-file triggers, lite mode, and the guardrails under "What NOT to do" — this rule is intentionally short (Windsurf truncates long rule files) and is not a substitute for it.`;
write(
  ".windsurf/rules/breadcrumbs.md",
  `---\ntrigger: model_decision\ndescription: ${description}\n---\n\n${banner}${windsurfBody}\n`
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

// Gemini CLI — custom slash command (no description-match auto-trigger like
// Cursor/Windsurf, so this is invoked explicitly as `/breadcrumbs`).
write(
  ".gemini/commands/breadcrumbs.toml",
  `description = ${JSON.stringify(description)}\n\nprompt = """\n${banner}${fullBody.replaceAll('"""', '\\"\\"\\"')}\n"""\n`
);

// Claude Code plugin manifest — wraps the existing skill, doesn't duplicate it.
write(
  ".claude-plugin/plugin.json",
  JSON.stringify(
    {
      name,
      description,
      version: VERSION,
      license: "MIT",
      skills: ["./skills/breadcrumbs"],
    },
    null,
    2
  )
);

// Claude Code marketplace manifest — required for `/plugin marketplace add
// alias01/breadcrumbs` (README install step) to discover this repo's single
// plugin, which lives at the marketplace root. Name must be literally
// "breadcrumbs" to match the `/plugin install breadcrumbs@breadcrumbs` the
// README also documents.
write(
  ".claude-plugin/marketplace.json",
  JSON.stringify(
    {
      name,
      owner: { name: "alias01" },
      plugins: [
        {
          name,
          source: "./",
          description,
          version: VERSION,
        },
      ],
    },
    null,
    2
  )
);

// Claude Code's own local skill install (~/.claude/skills/breadcrumbs) is a
// SEPARATE copy from this repo's skills/breadcrumbs/ — Claude Code loads
// skills by name from there, not from this repo, so repo edits are invisible
// at runtime until this copy is refreshed. Unlike the other platforms above,
// Claude Code DOES support on-demand reads, so this sync preserves that:
// SKILL.md stays a lean router, reference files land in references/ verbatim,
// and pointers in the router body get rewritten to the references/ path.
const CLAUDE_SKILL_DIR = join(homedir(), ".claude", "skills", "breadcrumbs");
let routerForInstall = body;
for (const refPath of REFERENCES) {
  const file = basename(refPath);
  routerForInstall = routerForInstall.replaceAll(`\`${file}\``, `\`references/${file}\``);
}
write(join(CLAUDE_SKILL_DIR, "SKILL.md"), `---\n${frontmatter}\n---\n\n${routerForInstall}\n`);
for (const refPath of REFERENCES) {
  write(join(CLAUDE_SKILL_DIR, "references", basename(refPath)), readFileSync(refPath, "utf8"));
}
for (const scriptPath of SCRIPTS) {
  write(join(CLAUDE_SKILL_DIR, "scripts", basename(scriptPath)), readFileSync(scriptPath, "utf8"));
}

console.log("\nDone. skills/breadcrumbs/Skill.md remains the canonical source.");
