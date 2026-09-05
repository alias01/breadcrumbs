#!/usr/bin/env node
// Sums token usage for one Claude Code session transcript, so a story's
// context file can carry a real number instead of a guess. Reads the
// per-turn `usage` blocks that Claude Code already writes to the
// transcript (~/.claude/projects/<slug>/<session-id>.jsonl) — same source
// the explain-usage skill draws from — no separate tracking needed.
//
// Usage: node scripts/session-token-stats.mjs <session-id-or-path> [--json]
//        node scripts/session-token-stats.mjs   (newest transcript in the
//        current project's ~/.claude/projects/<slug>/ dir)
//
// --by-tool: breaks the total down by *what caused it* — the first turn's
// cache write (system prompt + tool definitions), each tool name (Read,
// Bash, Edit, ...), and plain chat turns with no tool call. Attribution is
// approximate: a turn's cache-write is what got newly appended to context
// since the previous turn, which is the tool_result of whatever the
// previous turn called (or the user's typed message, if it called nothing).

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { join, resolve, isAbsolute } from "node:path";
import { homedir } from "node:os";

function projectSlug(cwd) {
  return cwd.replace(/[^a-zA-Z0-9]/g, "-");
}

function findTranscript(arg) {
  if (arg) {
    const p = isAbsolute(arg) ? arg : resolve(arg);
    if (existsSync(p)) return p;
    const withExt = p.endsWith(".jsonl") ? p : `${p}.jsonl`;
    if (existsSync(withExt)) return withExt;
  }
  const dir = join(homedir(), ".claude", "projects", projectSlug(process.cwd()));
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => join(dir, f))
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
  return files[0] ?? null;
}

function readEntries(path) {
  const text = readFileSync(path, "utf8");
  const entries = [];
  for (const line of text.split("\n")) {
    if (!line.trim()) continue;
    try {
      entries.push(JSON.parse(line));
    } catch {
      // skip malformed line
    }
  }
  return entries;
}

function sumUsage(entries) {
  const totals = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
    turns: 0,
  };
  for (const entry of entries) {
    const usage = entry?.message?.usage;
    if (entry.type !== "assistant" || !usage) continue;
    totals.input_tokens += usage.input_tokens ?? 0;
    totals.output_tokens += usage.output_tokens ?? 0;
    totals.cache_creation_input_tokens += usage.cache_creation_input_tokens ?? 0;
    totals.cache_read_input_tokens += usage.cache_read_input_tokens ?? 0;
    totals.turns += 1;
  }
  return totals;
}

// Attributes cost to what caused it: the first turn's cache-write is the
// system prompt + tool list; every later turn's cache-write is charged to
// whichever tool the *previous* assistant turn called (its result is what
// got appended to context), or "chat / plain reply" if it called none.
// Output tokens (the 5x-weighted, most expensive kind) are charged to the
// turn's own action — the reasoning + tool call it made, or the reply text.
function byTool(entries) {
  const buckets = new Map();
  const bump = (name, usage) => {
    const b = buckets.get(name) ?? { calls: 0, cache_write: 0, cache_read: 0, input: 0, output: 0 };
    b.calls += 1;
    b.cache_write += usage.cache_creation_input_tokens ?? 0;
    b.cache_read += usage.cache_read_input_tokens ?? 0;
    b.input += usage.input_tokens ?? 0;
    buckets.set(name, b);
  };
  const bumpOutput = (name, output_tokens) => {
    const b = buckets.get(name) ?? { calls: 0, cache_write: 0, cache_read: 0, input: 0, output: 0 };
    b.output += output_tokens ?? 0;
    buckets.set(name, b);
  };

  let prevTool = null; // tool_use name(s) from the previous assistant turn
  let first = true;
  for (const entry of entries) {
    if (entry.type !== "assistant" || !entry.message?.usage) continue;
    const usage = entry.message.usage;
    const label = first ? "system prompt + tool list" : prevTool ?? "chat / plain reply";
    bump(label, usage);
    first = false;

    const toolCalls = (entry.message.content ?? []).filter((c) => c.type === "tool_use");
    const ownLabel = toolCalls.length ? toolCalls.map((c) => c.name).join("+") : "chat / plain reply";
    bumpOutput(ownLabel, usage.output_tokens);
    prevTool = toolCalls.length ? toolCalls.map((c) => c.name).join("+") : null;
  }
  return buckets;
}

// Same weighting explain-usage uses: cache reads are cheap, cache writes
// and output cost more than a plain input token. Approximate, not billed cost.
function effective(t) {
  return Math.round(
    t.input_tokens +
      t.cache_read_input_tokens * 0.1 +
      t.cache_creation_input_tokens * 2 +
      t.output_tokens * 5
  );
}

const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const asJson = flags.has("--json");
const detailed = flags.has("--by-tool");
const transcript = findTranscript(args[0]);

if (!transcript) {
  console.error("No transcript found. Pass a session id/path, or run from inside the project.");
  process.exit(1);
}

const entries = readEntries(transcript);
const totals = sumUsage(entries);
const result = { ...totals, effective_tokens: effective(totals), transcript };

if (detailed) {
  const buckets = byTool(entries);
  const rows = [...buckets.entries()]
    .map(([name, b]) => ({
      name,
      ...b,
      effective: effective({
        input_tokens: b.input,
        output_tokens: b.output,
        cache_creation_input_tokens: b.cache_write,
        cache_read_input_tokens: b.cache_read,
      }),
    }))
    .sort((a, b) => b.effective - a.effective);
  const grandTotal = rows.reduce((sum, r) => sum + r.effective, 0);

  if (asJson) {
    console.log(JSON.stringify({ transcript, grand_total_effective: grandTotal, buckets: rows }, null, 2));
  } else {
    console.log(`Session: ${transcript}\n`);
    console.log(
      "Category".padEnd(28) +
        "Calls".padStart(7) +
        "Cache-write".padStart(13) +
        "Cache-read".padStart(12) +
        "Output".padStart(9) +
        "Effective".padStart(12) +
        "  %"
    );
    for (const r of rows) {
      const pct = grandTotal ? ((r.effective / grandTotal) * 100).toFixed(1) : "0.0";
      console.log(
        r.name.padEnd(28) +
          String(r.calls).padStart(7) +
          r.cache_write.toLocaleString().padStart(13) +
          r.cache_read.toLocaleString().padStart(12) +
          r.output.toLocaleString().padStart(9) +
          ("~" + r.effective.toLocaleString()).padStart(12) +
          `  ${pct}%`
      );
    }
    console.log(`\nGrand total effective tokens: ~${grandTotal.toLocaleString()}`);
    console.log(
      "Effective = input + cache_read*0.1 + cache_write*2 + output*5 (explain-usage's weighting, approximate cost not billed tokens)."
    );
    console.log(
      "Cumulative across every turn this session, not a context-window snapshot — it will exceed the model's context size in any long session, because each turn re-pays a cache-read of everything so far. For how full the context window is *right now*, check your IDE/CLI's own context usage panel instead."
    );
  }
} else if (asJson) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Session: ${transcript}`);
  console.log(`Turns:              ${totals.turns}`);
  console.log(`Input tokens:       ${totals.input_tokens.toLocaleString()}`);
  console.log(`Output tokens:      ${totals.output_tokens.toLocaleString()}`);
  console.log(`Cache write tokens: ${totals.cache_creation_input_tokens.toLocaleString()}`);
  console.log(`Cache read tokens:  ${totals.cache_read_input_tokens.toLocaleString()}`);
  console.log(`Effective (weighted): ~${result.effective_tokens.toLocaleString()}`);
  console.log(
    "Cumulative across every turn this session, not a context-window snapshot — check your IDE/CLI's own context usage panel for how full the context window is right now."
  );
}
