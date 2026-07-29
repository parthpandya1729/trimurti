'use strict';
// Prompts for the Trimūrti agents — Brahmā (creator), Viṣṇu (preserver),
// Maheśa (dissolver). All are advisory/propose-only and must return strict JSON.
// In Hindu cosmology these three govern one cycle — creation, preservation,
// dissolution-for-renewal — which maps cleanly onto a codebase's lifecycle.

const DEITIES = {
  brahma: {
    emoji: '🌱', title: 'Brahmā', principle: 'the creator — what should come into being',
    focus: `Identify what is MISSING and should be CREATED to make the project more complete, testable, observable and valuable: missing tests / thin coverage, absent health or readiness endpoints, no README or thin docs, un-monitored KPIs, unindexed hot database paths, unfinished TODO/FIXME work, missing error handling, absent CI. Prefer high-leverage additions.`,
  },
  vishnu: {
    emoji: '🛡', title: 'Viṣṇu', principle: 'the preserver — what must be sustained',
    focus: `Identify what threatens STABILITY and should be MAINTAINED to keep the project healthy and running: outdated or vulnerable dependencies, missing security hardening, error-rate or latency risk, abnormal database growth, configuration drift, missing backups, fragile single points of failure, performance regressions. Prefer changes that protect uptime and data.`,
  },
  mahesh: {
    emoji: '🔥', title: 'Maheśa', principle: 'the dissolver — what must be released for renewal',
    focus: `Identify DECAY that should be REMOVED or TRANSFORMED to reduce weight and clear space for renewal: dead or unreachable code, unused dependencies and files, stale git branches, deprecated endpoints, duplicated logic, log/temp/build bloat, projects that are disabled or no longer live. Dissolution here is renewal — never propose removing anything whose loss is not clearly safe AND reversible.`,
  },
};

const SCHEMA = `Return ONLY a JSON object — no prose, no markdown fences — of exactly this shape:
{"deity":"<key>","projects":[{"id":"<projectId>","recommendations":[{"title":"<short imperative>","rationale":"<one sentence citing the metric or file>","priority":"high|medium|low","effort":"S|M|L","action":"<one word>"}]}]}
Rules: use each project "id" verbatim. OMIT any project that has nothing worth doing. At most 3 recommendations per project. Be specific and concrete — no filler, no generic advice. This is advisory only: recommend, never claim to have changed anything.`;

function broadScanPrompt(deityKey, projects) {
  const d = DEITIES[deityKey];
  return `You are ${d.title}, ${d.principle}, acting as a disciplined engineering reviewer over a portfolio of live projects.
${d.focus}

Below is today's metrics snapshot for each project (lines of code, files, folders, detected AI-agent/MCP config, git activity in the last 24h, database size). Reason ONLY from this data — you have no file access in this pass, so keep recommendations grounded in what the metrics can justify.

PROJECTS:
${JSON.stringify(projects)}

${SCHEMA}
Set "deity":"${deityKey}".`;
}

function deepDivePrompt(project, metrics) {
  return `You are the Trimūrti engineering council reviewing ONE project in depth, with READ access to its files. Use Read, Grep and Glob to investigate briefly (a handful of targeted look-ups) — never modify anything.

Project: ${project.name} (id: ${project.id})
Today's metrics: ${JSON.stringify(metrics)}

Investigate efficiently — at most 5 targeted Grep/Glob/Read lookups (config, entrypoints, manifests, a couple of hotspots); you are on a tight token AND turn budget. After those lookups you MUST return the JSON object below, even if your investigation is incomplete — returning valid JSON is mandatory; never end on a tool call. Give recommendations from three perspectives:
- 🌱 Brahmā (create): ${DEITIES.brahma.focus}
- 🛡 Viṣṇu (preserve): ${DEITIES.vishnu.focus}
- 🔥 Maheśa (dissolve): ${DEITIES.mahesh.focus}

Return ONLY a JSON object — no prose, no fences:
{"id":"${project.id}","brahma":[{"title":"","rationale":"cite a real file/path you saw","priority":"high|medium|low","effort":"S|M|L","action":""}],"vishnu":[...],"mahesh":[...]}
At most 4 items per perspective. Cite real files you actually inspected. Advisory only — never modify files.`;
}

module.exports = { DEITIES, broadScanPrompt, deepDivePrompt };
