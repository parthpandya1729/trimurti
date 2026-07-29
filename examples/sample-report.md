<!-- A real Trimūrti run, lightly anonymized. The flagship project (🔎) was
     deep-read by the strong model, which cites exact file:line locations. -->

# 🕉 Trimūrti review — 2026-01-15

> 🌱 **6** create · 🛡 **4** preserve · 🔥 **4** dissolve  —  186k tokens · $0.53 · 1 deep-dive

## marketing-site
**🌱 Brahmā — Create**
- 🔴 **Commit or stash 21 pending working changes** — 21 uncommitted changes with 0 commits in 24h risk work loss and make the true state of the codebase unverifiable.
- 🟡 **Add a CI workflow** — active uncommitted work with no commit history suggests changes are landing without automated validation.

**🔥 Maheśa — Dissolve**
- 🔴 **Reconcile the working tree** — 21 changes sitting uncommitted for a day: commit or revert to stop masking real state.

## clinic-api  🔎
**🌱 Brahmā — Create**
- 🟡 **Add an `/api/health` readiness endpoint** — routes cover `/auth … /settings` but there is no unauthenticated liveness route (`server.js:939`), so a proxy or uptime check has nothing cheap to poll.
- 🔴 **Add `package.json` + CI to run the existing tests** — `tests/server.test.mjs`, `engine.test.mjs`, `share.test.mjs` all exist and exit non-zero on failure, but there is no `package.json` and no workflow, so nothing runs them.
- 🔴 **Automated off-box backup of the SQLite file** — `GET /api/backup` (`server.js:855`) streams the DB only when a human clicks; the sole copy of patient + payment data otherwise lives on one disk.

**🛡 Viṣṇu — Preserve**
- 🟡 **Persist auth tokens across restart** — `const tokens = new Map()` (`server.js:230`) is in-memory only — any restart, crash or deploy signs out every device mid-session.
- 🟡 **Rate-limit the public share endpoint** — `GET /api/share/:token` (`server.js:533`) is unauthenticated; the login lockout protects `/auth` but not this route, so tokens can be probed without throttle.
- 🟡 **Index the hot `patient_id` lookups** — sessions, payments and programs are all queried by `patient_id` but the DDL (`server.js:42–60`) declares no indexes — every ledger and monthly report is a full scan.

**🔥 Maheśa — Dissolve**
- 🟡 **Reconcile three overlapping spec docs** — `CONTRACT.md`, `REQUIREMENTS.md` and `POLISH.md` all sit in the root — three spec surfaces for one app invites drift about which is authoritative.
- ⚪ **Prune pre-restore snapshots** — every `/api/restore` writes `pre-restore-<ts>.sqlite3` and nothing deletes them; the data dir grows unbounded with full DB copies.
- ⚪ **Collapse a duplicated settings-projection block** — the identical filter loop appears twice (`server.js:918` and `:932`).

---
<sub>brahma scan: ok · 11.6k tok · vishnu scan: ok · 11.8k tok · mahesh scan: ok · 11.5k tok · clinic-api deep-dive: ok · 151k tok</sub>
