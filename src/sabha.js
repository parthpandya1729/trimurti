'use strict';
// The Devasabhā (देवसभा) — the assembly. Canonical, SHARED spec for the agent forum that lets
// every deity-agent AND tool communicate: one append-only message log, one message shape, and
// the deities' debate stances. Instead of N point-to-point protocols between agents and tools,
// there is one place they convene, discuss, brainstorm, debate, and resolve.
//
// This file is the single source of truth for the shared substance. The running implementation
// (the private orchestration repo, "varahi-brahmand") imports these so the methodology and the
// code never drift — see SYNC.md.

// The message shape every participant posts. Documented here as the contract:
const MESSAGE = {
  id: 'string',            // unique
  ts: 'ISO-8601 string',
  thread: 'string',        // the topic, e.g. "products/happen", "project/tcagent"
  from: 'string',          // participant id — a deity, a tool, or a human
  to: 'string',            // a recipient id, or "all"
  kind: 'one of KINDS',    // what sort of utterance this is
  subject: 'string',       // short
  body: 'string',
  refs: '[{type,id}]',     // grounding — links to real projects / tools / data / messages
  data: 'object|null',     // optional structured payload (e.g. a product profile)
  replyTo: 'string|null',  // parent message id
};

// Message kinds — enough to discuss, brainstorm, DEBATE, and resolve. A `decide` closes a thread.
const KINDS = ['post', 'ask', 'propose', 'argue', 'second', 'object', 'decide', 'share', 'alert'];

// When the assembly debates, each deity argues from its nature — the tension is the point. An
// agent reads the thread so far and adds ONE grounded message from this stance.
const DELIBERATION = {
  brahma: { emoji: '🌱', title: 'Brahmā', stance: 'the creator: argue for what should be brought into being — missing tests, docs, observability, capabilities. Push for growth.' },
  vishnu: { emoji: '🛡', title: 'Viṣṇu', stance: 'the preserver: argue for what must be protected — security, stability, dependencies, uptime. Weigh risk soberly.' },
  mahesh: { emoji: '🔥', title: 'Maheśa', stance: 'the dissolver: argue for what should be removed or simplified — dead code, bloat, scope creep. Propose only; a human decides.' },
  narada: { emoji: '🗣', title: 'Nārada', stance: 'the messenger: argue for the narrative, the audience, and the one catalytic moment. Engineer the story, never hype.' },
  daksha: { emoji: '🤝', title: 'Dakṣa', stance: 'business development: argue for the alliances, channels, and concrete deals that let it spread.' },
  lakshmi: { emoji: '💰', title: 'Lakṣmī', stance: 'revenue: argue for where value is generated and retained; flag effort with no path to prosperity.' },
  saraswati: { emoji: '🎵', title: 'Sarasvatī', stance: 'knowledge: ground the assembly in what is actually true about the project from its code and docs.' },
};

// Which deities naturally convene on a thread, inferred from its prefix.
function deitiesForThread(thread) {
  if (/^products?\//.test(thread) || /^gtm\//.test(thread)) return ['daksha', 'lakshmi', 'narada'];
  if (/^project\//.test(thread)) return ['brahma', 'vishnu', 'mahesh'];
  return ['saraswati', 'daksha', 'vishnu'];
}

module.exports = { MESSAGE, KINDS, DELIBERATION, deitiesForThread };
