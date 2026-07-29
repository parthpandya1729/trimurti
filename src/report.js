'use strict';
// Renders a Trimūrti run as a readable Markdown report.

const DEITY = {
  brahma: ['🌱', 'Brahmā', 'Create'],
  vishnu: ['🛡', 'Viṣṇu', 'Preserve'],
  mahesh: ['🔥', 'Maheśa', 'Dissolve'],
};
const PR = { high: '🔴', medium: '🟡', low: '⚪' };

function renderReport(result) {
  const L = [];
  L.push(`# 🕉 Trimūrti review — ${result.date}`);
  L.push('');
  L.push(`> ${DEITY.brahma[0]} **${result.counts.brahma}** create · ${DEITY.vishnu[0]} **${result.counts.vishnu}** preserve · ${DEITY.mahesh[0]} **${result.counts.mahesh}** dissolve  —  ${Math.round(result.tokens / 1000)}k tokens · $${result.cost} · ${result.deepDives} deep-dive(s)`);
  L.push('');
  const ids = Object.keys(result.byProject).sort();
  for (const id of ids) {
    const b = result.byProject[id];
    const total = b.brahma.length + b.vishnu.length + b.mahesh.length;
    if (!total) continue;
    L.push(`## ${id}${b.source === 'deep' ? '  🔎' : ''}`);
    for (const k of ['brahma', 'vishnu', 'mahesh']) {
      if (!b[k].length) continue;
      L.push(`**${DEITY[k][0]} ${DEITY[k][1]} — ${DEITY[k][2]}**`);
      for (const r of b[k]) L.push(`- ${PR[r.priority] || '⚪'} **${r.title}**${r.rationale ? ` — ${r.rationale}` : ''}`);
      L.push('');
    }
  }
  if (result.log?.length) { L.push('---'); L.push('<sub>' + result.log.join(' · ') + '</sub>'); }
  return L.join('\n');
}

module.exports = { renderReport };
