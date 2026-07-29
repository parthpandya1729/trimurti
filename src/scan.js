'use strict';
// Self-contained project scanner — no external deps. Produces the compact metrics
// the Trimūrti agents reason over: folders / files / lines-of-code, detected
// AI-agent (Claude/MCP) config, and 24h git activity. Heavy dirs are skipped so a
// scan of a large monorepo still finishes in a second or two.

const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { execFile } = require('node:child_process');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', 'out', 'coverage',
  'venv', '.venv', 'env', '__pycache__', '.mypy_cache', '.pytest_cache', '.ruff_cache',
  'vendor', 'target', '.gradle', '.idea', '.vscode', 'obj', '.turbo', '.cache',
  '.terraform', 'Pods', '.svelte-kit', 'site-packages', '.parcel-cache',
]);
const CODE_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '.rb', '.go',
  '.rs', '.java', '.kt', '.cs', '.c', '.h', '.cpp', '.hpp', '.cc', '.php', '.swift',
  '.scala', '.sh', '.sql', '.lua', '.dart', '.html', '.css', '.scss', '.less', '.json',
  '.yaml', '.yml', '.toml', '.md', '.tf', '.proto', '.graphql', '.astro',
]);
const MAX_FILES = 20000, MAX_FILE_BYTES = 2 * 1024 * 1024, CONCURRENCY = 24;

function run(cmd, args, opts = {}) {
  return new Promise(resolve => {
    execFile(cmd, args, { timeout: 15000, maxBuffer: 8 * 1024 * 1024, ...opts },
      (err, stdout) => resolve({ ok: !err, stdout: String(stdout || '') }));
  });
}

async function scanTree(root) {
  let folders = 0, files = 0, codeFiles = 0, loc = 0;
  const codePaths = [], stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries; try { entries = await fsp.readdir(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.isSymbolicLink()) continue;
      if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) { folders++; stack.push(path.join(dir, e.name)); } }
      else if (e.isFile()) {
        files++;
        if (files <= MAX_FILES && CODE_EXT.has(path.extname(e.name).toLowerCase())) codePaths.push(path.join(dir, e.name));
      }
    }
  }
  let i = 0;
  const worker = async () => {
    while (i < codePaths.length) {
      const p = codePaths[i++];
      try {
        const st = await fsp.stat(p);
        if (st.size > MAX_FILE_BYTES) { codeFiles++; continue; }
        const buf = await fsp.readFile(p);
        let n = 0; for (let k = 0; k < buf.length; k++) if (buf[k] === 10) n++;
        if (buf.length && buf[buf.length - 1] !== 10) n++;
        loc += n; codeFiles++;
      } catch {}
    }
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return { folders, files, codeFiles, loc };
}

async function detectAgents(root) {
  const found = [];
  for (const [rel, label] of [['CLAUDE.md', 'CLAUDE.md'], ['AGENTS.md', 'AGENTS.md'], ['.mcp.json', '.mcp.json'], ['.cursor', '.cursor']]) {
    try { await fsp.access(path.join(root, rel)); found.push(label); } catch {}
  }
  try {
    const cl = await fsp.readdir(path.join(root, '.claude'), { withFileTypes: true });
    found.push('.claude');
    if (cl.some(d => d.isDirectory() && d.name === 'agents')) {
      const a = await fsp.readdir(path.join(root, '.claude', 'agents')).catch(() => []);
      const n = a.filter(f => f.endsWith('.md')).length; if (n) found.push(`${n} agent${n > 1 ? 's' : ''}`);
    }
  } catch {}
  return found;
}

async function gitInfo(root) {
  if (!fs.existsSync(path.join(root, '.git'))) return { source: 'none' };
  const g = (...a) => run('git', ['-C', root, ...a]);
  const branch = (await g('rev-parse', '--abbrev-ref', 'HEAD')).stdout.trim() || null;
  const commitsRaw = (await g('log', '--since=24 hours ago', '--pretty=%s')).stdout.trim();
  const commits = commitsRaw ? commitsRaw.split('\n') : [];
  const stat = (await g('log', '--since=24 hours ago', '--numstat', '--pretty=tformat:')).stdout.trim();
  let added = 0, removed = 0; const changed = new Set();
  for (const line of stat ? stat.split('\n') : []) {
    const m = line.split('\t');
    if (m.length === 3) { if (m[0] !== '-') added += +m[0] || 0; if (m[1] !== '-') removed += +m[1] || 0; changed.add(m[2]); }
  }
  const porcelain = (await g('status', '--porcelain')).stdout.trim();
  return {
    source: 'git', branch, commits24h: commits.length, lastCommit: commits[0] || null,
    filesChanged24h: changed.size, linesAdded24h: added, linesRemoved24h: removed,
    workingChanges: porcelain ? porcelain.split('\n').length : 0,
  };
}

// returns the compact metrics object one project contributes to the agents' context
async function scanProject(project) {
  const root = project.path;
  if (!root || !fs.existsSync(root)) return { id: project.id, name: project.name, error: 'path missing' };
  const [code, agents, git] = await Promise.all([scanTree(root), detectAgents(root), gitInfo(root)]);
  return {
    id: project.id, name: project.name || project.id, flagship: !!project.flagship,
    loc: code.loc, codeFiles: code.codeFiles, files: code.files, folders: code.folders,
    agents, branch: git.branch || null, commits24h: git.commits24h || 0,
    filesChanged24h: git.filesChanged24h || 0, workingChanges: git.workingChanges || 0,
    lastCommit: git.lastCommit || null,
  };
}

module.exports = { scanProject };
