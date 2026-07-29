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

## Roadmap

- One-click "apply" for the safe class of Viṣṇu fixes (behind approval)
- Trend view — is each project accreting or renewing over time?
- Pluggable model providers
- Ship findings to your observability stack

---

## License

MIT © Varahi Technologies. Built on [Claude Code](https://claude.com/claude-code).
