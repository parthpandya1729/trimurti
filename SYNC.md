# Keeping the two repos in sync

This methodology repo (**trimurti**, public) and its private implementation
(**varahi-brahmand** — the running orchestration cosmos) go hand-in-hand. To stop
them drifting, the *shared substance lives here and is consumed there*, not copied.

## What is shared (single source of truth = this repo)

| Shared artifact | Lives here | Consumed by the private repo |
|---|---|---|
| Trimūrti deity prompts | `src/prompts.js` | via git **submodule** → `require('../trimurti/src/prompts')` |
| Council role definitions | `src/council-roles.js` | imported and wrapped with private project context |
| Devasabhā spec (message shape, kinds, debate stances) | `src/sabha.js` | imported by the assembly's ledger + deliberation engine |
| The methodology / framework | `README.md` | referenced, not duplicated |

The private repo adds only what must stay private: the project registry, the
harness wiring, business-specific context, secrets, and generated data.

## The sync workflow (do this whenever a prompt or role changes)

1. **Edit here** — change `src/prompts.js` or `src/council-roles.js` in this repo.
2. **Commit + push** this repo.
3. In the private repo, **bump the submodule**:
   ```
   git -C trimurti pull origin main
   git add trimurti && git commit -m "bump trimurti (prompts/roles)"
   ```
4. Never edit the shared prompts *in* the private repo's working copy without
   pushing them back here — that's how drift starts.

## The sync-check prompt (reusable)

Give this to an agent (or run it yourself) to verify the two are aligned:

> Compare the shared agent artifacts between the public `trimurti` repo and the
> private implementation. Specifically: (a) does the private repo's submodule
> point at the latest `trimurti` main? (b) do the deity prompts / council roles
> the private harness actually loads match `src/prompts.js` and
> `src/council-roles.js` here? (c) does the private repo import the roles rather
> than redefining them? Report any drift as a diff and the exact commands to
> reconcile — edit-here-then-bump-there, never copy.

If everything above holds, the two repos are in step.
