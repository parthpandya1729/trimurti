# 🕉 Trimūrti

**Three AI agents that keep your codebases healthy — the way the cosmos keeps itself in balance.**

Software portfolios don't die from one big failure. They die from *accretion*: tests that were never written, dependencies that quietly rot, dead code that nobody dares delete. Everyone schedules feature work. Almost nobody schedules **renewal**.

Trimūrti borrows a 5,000-year-old operating model — the Hindu **Trimūrti**, the three forces that run a healthy universe — and points it at your repositories. Every day, three agents review every project through three complementary lenses:

| Agent | Principle | Asks, of every project | Recommends |
|---|---|---|---|
| 🌱 **Brahmā** | the creator | *What should come into being?* | tests, health endpoints, docs, observability, indexes, CI |
| 🛡 **Viṣṇu** | the preserver | *What must be sustained?* | dependency & security fixes, stability, backups, drift, performance |
| 🔥 **Maheśa** | the dissolver | *What must be released for renewal?* | dead code, unused deps, stale branches, bloat, deprecated paths |

In the scriptures, Śiva's destruction isn't violence — it's **dissolution that clears space for the next creation**. That's exactly the discipline a codebase never gets: something whose *job* is to argue for removal, balanced against something whose job is to argue for growth, and something that keeps the whole thing alive in between.

> The result is a daily, per-project scorecard of *what to build, what to protect, and what to let go* — produced by AI, grounded in your actual code, and cheap enough to run every night.

---

## Why it works

- **Three lenses force balance.** A single "code quality" bot drifts toward nagging. Three opposed mandates — create vs. preserve vs. destroy — surface the trade-offs a good staff engineer would.
- **Propose-only by default.** Nothing is changed. Maheśa *never* deletes; it argues, with citations, and a human decides. Every recommendation is reversible because none of them act.
- **Budgeted.** A hard daily token cap. Cheap models scan the whole portfolio; a stronger model deep-reads your flagship repos until the budget is spent — then stops. Predictable cost, every night.
- **Grounded.** Agents reason over real metrics (lines of code, git activity, detected config) and, for flagships, actually read the files and cite them.

---

## How it works

```
        ┌─────────────── Phase 1: broad scan (cheap model) ───────────────┐
        │  one call per deity over ALL projects' metrics → recommendations │
        └──────────────────────────────────────────────────────────────────┘
        ┌─────────────── Phase 2: deep dive (strong model) ───────────────┐
        │  flagship repos only · reads files · cites them · budget-gated   │
        └──────────────────────────────────────────────────────────────────┘
                              ↓
                    runs/<date>.json  +  runs/<date>.md
```

Each agent runs **headless via the [Claude Code](https://claude.com/claude-code) CLI**. Because every headless call carries fixed context overhead, Trimūrti deliberately does **not** call once per project-per-agent. Instead: 3 aggregate scans cover the whole portfolio, and the strong model is spent only where it pays off — your most important repos.

---

## Quickstart

```bash
# 1. Requires the Claude Code CLI, authenticated:
#    https://claude.com/claude-code
claude --version

# 2. Configure your projects
cp config.example.json trimurti.config.json
# edit paths + mark your important repos "flagship": true

# 3. See what it collects (no AI spend)
node src/trimurti.js --dry-run

# 4. Run the review
node src/trimurti.js
#   → prints a Markdown report, saves runs/<date>.{json,md}
```

Schedule it nightly with cron/launchd for a standing daily renewal practice.

### Configuration

| Key | Default | Meaning |
|---|---|---|
| `tokenBudget` | `300000` | hard daily token ceiling across all agents |
| `scanModel` | `haiku` | cheap model for the broad scan |
| `deepModel` | `opus` | strong model for flagship deep-dives |
| `deepDiveMaxPerDay` | `2` | max flagship deep-dives per run (rotate the rest) |
| `projects[].flagship` | `false` | eligible for a deep-dive |
| `claudeBin` | `claude` | the headless agent CLI Trimūrti shells out to |

---

## Setup on macOS — pointing it at your projects folder

Most people keep every repo under one parent directory (`~/projects`, `~/code`, `~/dev`).
Trimūrti is built for exactly that: give it that folder's children and it reviews the whole
portfolio each night. Here's the full setup on a Mac.

**1 — Install Node and a headless agent CLI.**

```bash
brew install node                 # Node 18+ (ships npx)
node --version
```

Trimūrti itself does no AI — it shells out to a **headless agent CLI** that does. Pick one:

| Harness | Status | Configure |
|---|---|---|
| **Claude Code** (recommended) | ✅ supported today | install from [claude.com/claude-code](https://claude.com/claude-code), run `claude` once to sign in, then `"claudeBin": "claude"` |
| **`pi`** / other open-source CLIs | 🧪 experimental | point `claudeBin` at any CLI that takes a headless `-p "<prompt>"` and prints the result — e.g. `"claudeBin": "pi"` |
| Other harnesses (OpenAI, Gemini, local Ollama models) | 🚧 coming soon | a provider adapter is on the [roadmap](#roadmap) |

> Under the hood each agent is one headless call:
> `claude -p "<prompt>" --output-format json --model <model> --permission-mode plan`.
> Any CLI that can stand in for that shape works via `claudeBin` — that's the whole
> integration surface.

**2 — Clone Trimūrti next to your projects (or anywhere) and install nothing.**
It's dependency-free — plain Node.

```bash
cd ~/projects
git clone https://github.com/parthpandya1729/trimurti.git
cd trimurti
```

**3 — Point it at your projects folder.** List the repos under your parent directory and
mark the important ones `flagship: true` (those get the strong-model deep read):

```bash
cp config.example.json trimurti.config.json
```

```jsonc
{
  "claudeBin": "claude",
  "tokenBudget": 300000,
  "scanModel": "haiku",          // cheap model — the broad portfolio scan
  "deepModel": "opus",           // strong model — flagship deep-dives
  "projects": [
    { "id": "web-app", "name": "Customer Web App", "path": "/Users/you/projects/web-app", "flagship": true },
    { "id": "api",     "name": "Core API",         "path": "/Users/you/projects/api",     "flagship": true },
    { "id": "site",    "name": "Marketing Site",   "path": "/Users/you/projects/site" }
  ]
}
```

Use **absolute paths** (launchd/cron don't inherit your shell's working directory).

**4 — Dry-run, then run for real.**

```bash
node src/trimurti.js --dry-run     # shows what it collects, spends nothing
node src/trimurti.js               # runs the review → runs/<date>.{json,md}
```

**5 — Make it a daily practice with `launchd`.** Save as
`~/Library/LaunchAgents/com.you.trimurti.plist` and `launchctl load` it — it runs every
day at 03:00:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>Label</key><string>com.you.trimurti</string>
  <key>ProgramArguments</key>
  <array>
    <string>/opt/homebrew/bin/node</string>
    <string>/Users/you/projects/trimurti/src/trimurti.js</string>
  </array>
  <key>WorkingDirectory</key><string>/Users/you/projects/trimurti</string>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>3</integer><key>Minute</key><integer>0</integer></dict>
  <key>StandardOutPath</key><string>/Users/you/projects/trimurti/runs/launchd.log</string>
  <key>StandardErrorPath</key><string>/Users/you/projects/trimurti/runs/launchd.err</string>
</dict></plist>
```

```bash
launchctl load ~/Library/LaunchAgents/com.you.trimurti.plist
```

Read the morning report from `runs/<date>.md` (or wire the JSON into email / your
observability stack). That's the standing daily renewal loop.

---

## Example output

```markdown
## core-api  🔎
🛡 Viṣṇu — Preserve
- 🔴 221 uncommitted working changes, no commit in 24h — live config exists only on one machine
- 🔴 Secrets sprawl: 20 live .env files on disk, several outside .gitignore's reach
🔥 Maheśa — Dissolve
- 🔴 Remove api/.venv from the working tree
- 🟡 Sweep root-level junk: stray shell-redirect files, logs, one-off SQL
🌱 Brahmā — Create
- 🔴 Add a smoke/contract test suite for the API
- 🟡 Stand up CI (a single lint+test workflow)
```

---

## Safety model

- **Advisory only.** Trimūrti recommends; it does not modify files. The deep-dive agents run read-only.
- **Maheśa is conservative by mandate** — it only proposes removals that are *clearly safe and reversible*, and a human always approves.
- **No secrets leave your machine** beyond what you send to your model provider, exactly as any Claude Code session would.

---

## The fuller framework — a go-to-market Council

The Trimūrti build and sustain the **product**. Vedic cosmology also encodes the roles
that carry a creation **outward** — populate, spread, and enrich it. The same
role-as-agent pattern extends to a go-to-market **Council**:

| Agent | Principle | Asks, of each project | Domain |
|---|---|---|---|
| 🗣 **Nārada** | the messenger who carries the word across all worlds — *Kalaha-priya*, who engineers the narrative, not just broadcasts it | *What's the story, the audience, the catalytic moment?* | marketing / narrative-growth |
| 🤝 **Dakṣa** | the progenitor who populated creation through strategic alliances (his flaw: ego that excludes a key stakeholder destroys the work) | *Which alliances and deals let it spread?* | business development / sales |
| 💰 **Lakṣmī** | where she resides, prosperity accrues; where she isn't cultivated, she departs | *Where does value accrue — and where doesn't it?* | revenue / monetization |

*Reserve roles:* **Vishwakarma** (platform/tooling), **Sarasvatī** (message *quality* vs
Nārada's *reach*), the **Rishis** (R&D / knowledge-keepers).

The full arc: **source-spec (Vāc) → build (Brahmā) → tool (Vishwakarma) → codify (Rishis)
→ populate via alliances (Dakṣa) → craft the word (Sarasvatī) → spread & catalyze (Nārada)
→ prosperity settles (Lakṣmī)** — a complete product-and-go-to-market lifecycle.

Canonical role definitions live in [`src/council-roles.js`](src/council-roles.js). The GTM
agents only give grounded advice when fed real market signals (traffic, deals, revenue,
workflow notes) — the same way the Trimūrti are grounded in code metrics; ungrounded, they
produce generic strategy. See [SYNC.md](SYNC.md) for how this repo and a private
implementation stay in step.

---

## Roadmap

- One-click "apply" for the safe class of Viṣṇu fixes (behind approval)
- Trend view — is each project accreting or renewing over time?
- Pluggable model providers
- Ship findings to your observability stack

---

## License

MIT © Varahi Technologies. Built on [Claude Code](https://claude.com/claude-code).
