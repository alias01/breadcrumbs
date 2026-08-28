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
// when that gate is reached / first context-file write). Most platforms below
// have no equivalent gate-triggered read, so everything is inlined for them
// rather than left as pointers — the guaranteed-but-fat form.
const reference = REFERENCES.map((path) => readFileSync(path, "utf8").trim()).join("\n\n---\n\n");
const fullBody = `${body}\n\n---\n\n${reference}`;

// Windsurf enforces a HARD per-file cap on workspace rules and truncates past
// it silently — no error, no warning. The inlined body is ~52KB, so Windsurf was
// getting roughly the router and Step 1 and nothing else: no gates, no Step 3,
// no template. That's not degraded output, it's a different skill.
//
// So Windsurf gets the router alone, with the reference files left as
// repo-relative paths for Cascade to read at each gate. The files are committed,
// so the pointers resolve. Cap is on the *workspace* rule (global_rules.md is
// capped lower); WINDSURF_HEADROOM keeps a margin for that number moving.
const WINDSURF_CAP = 12000;
const WINDSURF_HEADROOM = 1000;

// Rewrite the router's bare filename pointers to repo-relative paths, so a
// platform without Claude Code's skill-directory resolution can still find them.
function routerBody(prefix) {
  let out = body;
  for (const refPath of REFERENCES) {
    const file = basename(refPath);
    out = out.replaceAll(`\`${file}\``, `\`${prefix}${file}\``);
  }
  return out;
}

const REF_DIR = "skills/breadcrumbs/";
const readOnDemand = `## Reference files — read on demand

This rule is a router. Each step's full text, the context-file mechanics, and the
file template live in the repository, not in this rule. Read the one you need, from
the repo root, **at the moment you reach that gate** — not up front:

| When | Read |
|---|---|
| Step 1 gate | \`${REF_DIR}step1-understand.md\` |
| Step 2 gate | \`${REF_DIR}step2-plan.md\` |
| Step 3 (implementing) | \`${REF_DIR}step3-implement.md\` |
| Step 4 (PR) | \`${REF_DIR}step4-pr.md\` |
| First context-file write | \`${REF_DIR}context-file-mechanics.md\` + \`${REF_DIR}context-template.md\` |

No file access, or the files aren't present → say so before the first gate rather
than improvising a step's content. The rules below are the whole contract; the step
files carry the detail that makes them work.

---

`;

// AGENTS.md — portable, instruction-only, no frontmatter.
write("AGENTS.md", `${banner}# ${name}\n\n${fullBody}\n`);

// Cursor — .mdc with frontmatter Cursor understands (agent-requested rule).
write(
  ".cursor/rules/breadcrumbs.mdc",
  `---\ndescription: ${description}\nalwaysApply: false\n---\n\n${banner}${fullBody}\n`
);

// Windsurf — model-decision rule, activates based on description match.
// Router only: the full text does not fit under the cap (see above).
const windsurf = `---\ntrigger: model_decision\ndescription: ${description}\n---\n\n${banner}${readOnDemand}${routerBody(REF_DIR)}\n`;
if (windsurf.length > WINDSURF_CAP - WINDSURF_HEADROOM) {
  throw new Error(
    `.windsurf/rules/breadcrumbs.md is ${windsurf.length} chars — over the ${WINDSURF_CAP} cap ` +
      `minus ${WINDSURF_HEADROOM} headroom. Windsurf truncates past the cap SILENTLY, so this ` +
      `must fail the build rather than ship a half-skill. Trim Skill.md or move content into a ` +
      `reference file under ${REF_DIR}.`
  );
}
write(".windsurf/rules/breadcrumbs.md", windsurf);

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
