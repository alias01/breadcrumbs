#!/usr/bin/env node
// Compiles skills/breadcrumbs/SKILL.md (the canonical source) into
// platform-specific instruction files. Re-run after editing SKILL.md.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { homedir } from "node:os";

const SOURCE = "skills/breadcrumbs/SKILL.md";
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
  "skills/breadcrumbs/resume.md",
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

// SKILL.md points at the step files, context-file-mechanics.md,
// context-template.md and resume.md, and expects Claude Code to Read each on demand (only
// when that gate is reached / first context-file write).
//
// Two shapes are built from that same source:
//
//   lean (default) — the router alone, reference files left as repo-relative
//     pointers the agent reads at each gate. ~1.9k tokens instead of ~10.8k,
//     and on the always-loaded targets (Copilot) that saving is per turn, for
//     the whole session, whether or not a story is in play.
//   full — everything inlined. ~10.8k tokens, but nothing depends on the agent
//     choosing to follow a pointer.
//
// Lean is a real trade, not a free win: a pointer is a soft instruction, and a
// weaker model may skip it. It's mitigated by WHAT is left in the router rather
// than by hoping — the gates, "never skip a gate", lite-mode rules, the
// verification requirement and the context-file triggers all stay inline, so a
// skipped reference read costs plan *depth*, not a gate. Build with
// `--profile=full` to fall back per-run if a platform proves unreliable.
const KNOWN_FLAGS = /^--(profile=.+|install)$/;
const unknown = process.argv.slice(2).filter((a) => !KNOWN_FLAGS.test(a));
if (unknown.length > 0) {
  throw new Error(`unknown argument(s): ${unknown.join(" ")} (expected --profile=lean|full and/or --install)`);
}
const PROFILE = (process.argv.find((a) => a.startsWith("--profile=")) ?? "--profile=lean").split("=")[1];
if (!["lean", "full"].includes(PROFILE)) {
  throw new Error(`unknown --profile=${PROFILE} (expected "lean" or "full")`);
}

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
// Measured in BYTES, not JS .length: the source is full of →, — and ≤, which are
// 3 and 2 bytes in UTF-8, so bytes run ~1% above character count and the gap grows
// with the file. Which unit Windsurf counts isn't documented; bytes is the
// conservative read, and the difference is free to absorb.
const byteLen = (s) => Buffer.byteLength(s, "utf8");

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

This is a router. Each step's full text, the context-file mechanics, and the file
template live in the repository, not in this file. Read the one you need, from the
repo root, **at the moment you reach that gate** — not up front:

| When | Read |
|---|---|
| Step 1 gate | \`${REF_DIR}step1-understand.md\` |
| Step 2 gate | \`${REF_DIR}step2-plan.md\` |
| Step 3 (implementing) | \`${REF_DIR}step3-implement.md\` |
| Step 4 (PR) | \`${REF_DIR}step4-pr.md\` |
| First context-file write | \`${REF_DIR}context-file-mechanics.md\` + \`${REF_DIR}context-template.md\` |
| Resume (\`.breadcrumbs/context/\` non-empty) | \`${REF_DIR}resume.md\` |

No file access, or the files aren't present → say so before the first gate rather
than improvising a step's content. The rules below are the whole contract; the step
files carry the detail that makes them work.

---

`;

const leanBody = `${readOnDemand}${routerBody(REF_DIR)}`;
// What every target below except AGENTS.md gets, per --profile.
const body4 = PROFILE === "lean" ? leanBody : fullBody;

// AGENTS.md — portable, instruction-only, no frontmatter. ALWAYS full, both
// profiles: it's the fallback for any tool that can't read files on demand, and
// the one place where the guarantee is worth the 10.8k. Everything else has a
// file-read tool and a committed repo to resolve pointers against.
write("AGENTS.md", `${banner}# ${name}\n\n${fullBody}\n`);

// Cursor — .mdc with frontmatter Cursor understands (agent-requested rule).
// Pointers stay plain relative paths: Cursor's `@file` syntax pulls a file into
// context EAGERLY, which would reintroduce exactly the cost this removes.
write(
  ".cursor/rules/breadcrumbs.mdc",
  `---\ndescription: ${description}\nalwaysApply: false\n---\n\n${banner}${body4}\n`
);

// Windsurf — model-decision rule, activates based on description match.
// Router only: the full text does not fit under the cap (see above).
// Always lean regardless of --profile: the full text cannot fit under the cap.
const windsurf = `---\ntrigger: model_decision\ndescription: ${description}\n---\n\n${banner}${leanBody}\n`;
if (byteLen(windsurf) > WINDSURF_CAP - WINDSURF_HEADROOM) {
  throw new Error(
    `.windsurf/rules/breadcrumbs.md is ${byteLen(windsurf)} bytes — over the ${WINDSURF_CAP} cap ` +
      `minus ${WINDSURF_HEADROOM} headroom. Windsurf truncates past the cap SILENTLY, so this ` +
      `must fail the build rather than ship a half-skill. Trim SKILL.md or move content into a ` +
      `reference file under ${REF_DIR}.`
  );
}
write(".windsurf/rules/breadcrumbs.md", windsurf);

// Cline — plain instructions file, no frontmatter convention. Cline reads files
// on request, so the router's pointers resolve.
write(".clinerules/breadcrumbs.md", `${banner}# ${name}\n\n${body4}\n`);

// Kiro — steering doc, manually referenced (safe default; switch to
// `inclusion: always` if you want it loaded on every request instead).
// Pointers stay plain relative paths rather than Kiro's `#[[file:...]]`
// directive, which inlines the target EAGERLY — same trap as Cursor's `@file`.
write(
  ".kiro/steering/breadcrumbs.md",
  `---\ninclusion: manual\ndescription: ${description}\n---\n\n${banner}${body4}\n`
);

// GitHub Copilot — repo-wide custom instructions, always loaded with no
// per-skill triggering. Biggest beneficiary of the lean profile: this cost is
// paid on every turn of every session, including ones that never touch a story.
write(".github/copilot-instructions.md", `${banner}# ${name}\n\n${body4}\n`);

// Gemini CLI — custom slash command (no description-match auto-trigger like
// Cursor/Windsurf, so this is invoked explicitly as `/breadcrumbs`).
write(
  ".gemini/commands/breadcrumbs.toml",
  `description = ${JSON.stringify(description)}\n\nprompt = """\n${banner}${body4.replaceAll('"""', '\\"\\"\\"')}\n"""\n`
);

// Claude Code plugin manifest — wraps the existing skill, doesn't duplicate it.
// The marketplace catalog (.claude-plugin/marketplace.json) is hand-maintained;
// it only names this plugin and its source, nothing here to regenerate.
write(
  ".claude-plugin/plugin.json",
  JSON.stringify(
    {
      name,
      description,
      version: VERSION,
      license: "MIT",
      skills: ["./skills/breadcrumbs"],
      // Both hooks ship WITH the plugin, resolved against the plugin's install
      // dir — not the cwd-relative path in .claude/settings.json, which only
      // works for a checkout of this repo run from its root.
      hooks: {
        UserPromptSubmit: [
          {
            hooks: [
              {
                type: "command",
                command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/detect-story.mjs",
              },
              {
                type: "command",
                command: "node ${CLAUDE_PLUGIN_ROOT}/hooks/detect-context-growth.mjs",
              },
            ],
          },
        ],
      },
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
//
// Opt-in via --install. Writing outside the repo is a side effect a plain
// build must not have: CI runners and contributors regenerating the platform
// files shouldn't get a skill silently installed into their home directory.
const INSTALL = process.argv.includes("--install");
const CLAUDE_SKILL_DIR = join(homedir(), ".claude", "skills", "breadcrumbs");
if (INSTALL) {
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
}

console.log(`\nprofile: ${PROFILE}  (router ${Math.round(leanBody.length / 1000)}KB vs full ${Math.round(fullBody.length / 1000)}KB)`);
if (PROFILE === "lean") {
  console.log("  AGENTS.md stays full — the fallback for tools that can't read files on demand.");
  console.log("  Re-run with --profile=full to inline everything if a platform ignores the pointers.");
}
if (!INSTALL) {
  console.log(`  Local Claude Code copy (${CLAUDE_SKILL_DIR}) NOT touched — pass --install to refresh it.`);
}
console.log("\nDone. skills/breadcrumbs/SKILL.md remains the canonical source.");
