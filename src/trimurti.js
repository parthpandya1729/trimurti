#!/usr/bin/env node
'use strict';
// Trimūrti — three AI agents that keep a portfolio of codebases healthy by running
// a daily, budgeted, propose-only review through three lenses:
//   🌱 Brahmā  (creator)   — what should be CREATED (tests, docs, observability…)
//   🛡 Viṣṇu   (preserver) — what must be SUSTAINED (security, deps, stability…)
//   🔥 Maheśa  (dissolver) — what should be REMOVED for renewal (dead code, bloat…)
//
// Runs headless via the Claude Code CLI. Two-phase, budget-aware:
//   Phase 1  broad scan  — 3 cheap calls (one per deity) over ALL project metrics
//   Phase 2  deep dive   — a stronger model reads flagship repos, budget permitting
//
// Usage:  node src/trimurti.js --config trimurti.config.json
//         node src/trimurti.js --dry-run            (scan + print metrics only)

const fs = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { scanProject } = require('./scan');
const { broadScanPrompt, deepDivePrompt } = require('./prompts');
const { renderReport } = require('./report');

// ── args & config ────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const arg = (flag, dflt) => { const i = args.indexOf(flag); return i >= 0 ? args[i + 1] : dflt; };
const has = flag => args.includes(flag);
const CFG_PATH = path.resolve(arg('--config', 'trimurti.config.json'));
if (!fs.existsSync(CFG_PATH)) { console.error(`config not found: ${CFG_PATH}\n(copy config.example.json → trimurti.config.json)`); process.exit(1); }
const cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));

const CLAUDE_BIN = cfg.claudeBin || 'claude';
const BUDGET = Number(arg('--budget', cfg.tokenBudget || 300000));
const SCAN_MODEL = cfg.scanModel || 'haiku';
const DEEP_MODEL = cfg.deepModel || 'opus';
const DEEP_MAX = cfg.deepDiveMaxPerDay ?? 2;
const OUT_DIR = path.resolve(cfg.outDir || 'runs');
const today = () => new Date().toISOString().slice(0, 10);

// ── headless Claude call ─────────────────────────────────────────────────────
function usageTokens(u) {
  if (!u) return 0;
  return (u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.output_tokens || 0);
}
function extractJson(text) {
  if (!text) return null;
  try { return JSON.parse(text); } catch {}
  const s = text.indexOf('{'), e = text.lastIndexOf('}');
  if (s >= 0 && e > s) { try { return JSON.parse(text.slice(s, e + 1)); } catch {} }
  return null;
}
function runClaude(prompt, { model, cwd, tools, maxTurns = 1, timeout = 240000 }) {
  return new Promise(resolve => {
    const a = ['-p', prompt, '--output-format', 'json', '--model', model, '--max-turns', String(maxTurns), '--permission-mode', 'plan'];
    if (tools === 'none') a.push('--tools', 'none');
    else if (Array.isArray(tools) && tools.length) a.push('--tools', ...tools);
    execFile(CLAUDE_BIN, a, { cwd: cwd || process.cwd(), timeout, maxBuffer: 32 * 1024 * 1024 }, (err, stdout, stderr) => {
      if (!stdout) return resolve({ ok: false, error: String(stderr || err?.message || 'no output').slice(-300), tokens: 0, cost: 0 });
      let out; try { out = JSON.parse(stdout); } catch { return resolve({ ok: false, error: 'unparseable cli json', tokens: 0, cost: 0 }); }
      const data = extractJson(out.result);
      resolve({ ok: !!data && !out.is_error, data, tokens: usageTokens(out.usage), cost: out.total_cost_usd || 0,
        error: out.is_error ? 'agent error' : (data ? null : 'no json') });
    });
  });
}
async function runRetry(prompt, opts, tries = 2) { let r; for (let i = 0; i < tries; i++) { r = await runClaude(prompt, opts); if (r.ok) return r; } return r; }

// ── main ─────────────────────────────────────────────────────────────────────
(async () => {
  const projects = cfg.projects || [];
  if (!projects.length) { console.error('no projects in config'); process.exit(1); }
  process.stderr.write(`⟳ scanning ${projects.length} projects…\n`);
  const metrics = (await Promise.all(projects.map(scanProject)));
  const ok = metrics.filter(m => !m.error);

  if (has('--dry-run')) { console.log(JSON.stringify(ok, null, 2)); return; }

  let tokens = 0, cost = 0;
  const byProject = {};
  const ensure = id => (byProject[id] ||= { brahma: [], vishnu: [], mahesh: [], source: 'scan' });
  const log = [];

  // Phase 1 — broad scan, one call per deity over all metrics
  for (const deity of ['brahma', 'vishnu', 'mahesh']) {
    if (tokens >= BUDGET) { log.push(`budget spent before ${deity}`); break; }
    process.stderr.write(`  ${deity} scan…\n`);
    const r = await runRetry(broadScanPrompt(deity, ok), { model: SCAN_MODEL, tools: 'none', maxTurns: 1 });
    tokens += r.tokens; cost += r.cost;
    log.push(`${deity} scan: ${r.ok ? 'ok' : 'FAIL(' + r.error + ')'} · ${r.tokens} tok`);
    if (r.ok && Array.isArray(r.data.projects))
      for (const p of r.data.projects) if (p.id && Array.isArray(p.recommendations)) ensure(p.id)[deity] = p.recommendations.slice(0, 3);
  }

  // Phase 2 — deep dive on flagships, budget-gated
  const flagships = ok.filter(m => m.flagship);
  let deep = 0;
  for (const m of flagships) {
    if (deep >= DEEP_MAX || tokens >= BUDGET * 0.9) { if (deep < flagships.length) log.push('budget/limit reached — deep-dives stopped'); break; }
    const proj = projects.find(p => p.id === m.id);
    process.stderr.write(`  deep-dive ${m.id}…\n`);
    const r = await runClaude(deepDivePrompt(proj, m), { model: DEEP_MODEL, cwd: proj.path, tools: ['Read', 'Grep', 'Glob'], maxTurns: 8 });
    tokens += r.tokens; cost += r.cost;
    log.push(`${m.id} deep-dive: ${r.ok ? 'ok' : 'FAIL(' + r.error + ')'} · ${r.tokens} tok`);
    if (r.ok && r.data) { const b = ensure(m.id); for (const k of ['brahma', 'vishnu', 'mahesh']) if (Array.isArray(r.data[k])) b[k] = r.data[k].slice(0, 4); b.source = 'deep'; deep++; }
  }

  const counts = { brahma: 0, vishnu: 0, mahesh: 0 };
  for (const b of Object.values(byProject)) for (const k of ['brahma', 'vishnu', 'mahesh']) counts[k] += b[k].length;
  const result = { date: today(), tokens, cost: Math.round(cost * 1e4) / 1e4, budget: BUDGET, deepDives: deep, counts, byProject, log };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, today() + '.json'), JSON.stringify(result, null, 2));
  const md = renderReport(result);
  fs.writeFileSync(path.join(OUT_DIR, today() + '.md'), md);
  console.log(md);
  process.stderr.write(`\n✓ ${counts.brahma + counts.vishnu + counts.mahesh} recommendations · ${Math.round(tokens / 1000)}k tokens · $${result.cost} · saved to ${OUT_DIR}/${today()}.{json,md}\n`);
})().catch(e => { console.error(e); process.exit(1); });
