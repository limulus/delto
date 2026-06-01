# Critical Path — the delto triage cockpit

_See what's eligible, what unblocks the most, and what order the needs: graph forces — then hand the agent your call._

**Surface:** BACKLOG triage & dependency intelligence  
**Branch:** `mockups/1-backlog-cockpit`

## Run it

```sh
node experiments/backlog-gui/server.ts --port 4531
# then open http://127.0.0.1:4531
```

The base server serves this mockup from `experiments/backlog-gui/public/` and exposes the
read-only API it consumes. Nothing here edits `BACKLOG.md` — actions POST intents to
`/api/intents`, a queue the agent drains (see the repo `experiments/backlog-gui/README.md`).

## The idea

Critical Path is a single-screen triage cockpit that turns a delto BACKLOG.md into a legible dependency map. Items are laid out in their real Initiative → Epic priority order, each rendered as a card stamped with its immutable deltoid and a hard state — Eligible, Blocked, or Claimed — computed from the live needs: graph. A leverage ranking surfaces the items that unblock the most downstream work, and a focus mode lights up the exact dependency chain behind any item so you can see what order the graph forces. Every triage decision — promote, defer, "I'll take this one," "this is too big, split it," "add an item under this epic" — is recorded as an intent POSTed to /api/intents and shown with an optimistic stamp, never written to BACKLOG.md. The agent drains the queue and owns the edits, exactly like difit hands back review comments.

**Problem it addresses:** A delto BACKLOG.md is roughly priority-ordered prose, but the three questions that actually govern what to work on next are invisible in plain text: (1) which items are truly eligible right now — nothing in their needs: is still open, and nobody has claimed them; (2) which items are high-leverage — shipping them unblocks the most downstream work (dependents count); and (3) how the needs: edges constrain ordering, including the one real blocked chain in the live data (∆LwK needs ∆Sre + ∆fb2). You can't see at a glance that ∆Sre and ∆fb2 are the only two items with leverage, that ∆LwK is the sole blocked item, or that all 14 items are unclaimed. Today you'd reconstruct that by hand-reading the file and mentally resolving every needs: suffix. And the moment you decide, the temptation is to edit BACKLOG.md — which steals context from the agent that owns it.

## Key interactions

- State is computed, not stored: each card's Eligible/Blocked/Claimed pill comes straight from the item's eligible/claimed/blocked booleans plus openNeeds — Blocked cards name their open prerequisites as clickable deltoid chips that scroll-and-pulse the prerequisite card.
- Leverage leaderboard ranks items by dependents.length descending; clicking a leaderboard row focuses that item's downstream chain so you can see exactly what shipping it unblocks (∆Sre → ∆LwK).
- Dependency Focus draws the needs: graph in-place over the priority-ordered list rather than on a separate node canvas — connectors thread between real cards, so structure and priority order are legible at once. It computes and labels the transitive critical-path length to each blocked item.
- Every triage action opens the intent composer with kind + deltoid pre-filled and an immutable deltoid chip; submitting POSTs to /api/intents and immediately stamps an optimistic 'queued for agent' chip on the card — the card itself never moves or changes in BACKLOG.md.
- The right-rail Intent Queue mirrors /api/intents live, folding in resolved state: a pending promote/defer/split shows as 'awaiting agent', and once the agent drains it (a resolve record) the chip flips to 'done' — closing the loop visibly without ever touching BACKLOG.md.
- Deltoid chips are first-class: monospace, copy-on-click, and used everywhere (cards, needs: chips, leaderboard, intents) so the immutable ID is the through-line that ties the UI to journal cross-references like [[∆LwK]].
- Empty-epic awareness: an epic lane with zero remaining items (the kind ∆IsK's journal notes gets retired) renders as a faint 'retired' band, making the initiative → epic skeleton honest even as items complete out.

## Intents it hands to the agent

- `promote` — Human raises an item's priority; agent will move it earlier in BACKLOG.md's order. Body carries deltoid + note (e.g. why it now matters).
- `defer` — Human pushes an item down or parks it under Someday/Maybe; agent reorders/relocates. Body carries deltoid + optional target initiative + note.
- `claim-and-plan` — Human clicks 'I'll take this'; asks the agent to claim the item and write its plan. Body carries deltoid + note; this is the triage equivalent of /delto claim + plan.
- `split` — Human marks an item too big; asks the agent to break it into smaller items under the same epic. Body carries deltoid + a free-text sketch of the seams in the note.
- `new-item` — Human adds a new backlog item under a specific initiative/epic; agent mints a deltoid and writes it. Body carries initiative + epic + note (the proposed item text), no deltoid yet.
- `link-needs` — Human asserts a missing hard prerequisite between two items while reading the graph; agent adds a needs: edge. Body carries deltoid + needsDeltoid + note.

## What actually works against the live API

- GET /api/snapshot hydrates the entire cockpit in one fetch (backlog items, eligibility/dependents/openNeeds, journal stats, intents)
- Eligible/Blocked/Claimed state, the leverage leaderboard, and the focus chains are all computed live from the real needs: graph — nothing is hardcoded
- POST /api/intents for all six kinds (promote, defer, claim-and-plan, split, new-item, link via needs-chips) with a real {kind, deltoid?, note?, initiative?/epic?} body; returns the recorded intent and stamps the card + inbox
- GET /api/intents polled every 5s so the Agent Inbox stays live and folds in resolved state (queued -> done)
- POST /api/intents/:seq/resolve via the inbox's 'mark handled' control, flipping the chip to done
- GET /api/backlog on the Sync button to re-read and recompute states + leverage from the live graph
- SPA fallback verified: unknown deep links return index.html (200)

## Build notes

Verified against the live server on port 4531: static assets 200, SPA fallback 200, and the full intent loop (POST seq 1 -> resolve -> resolved:true). I confirmed all derivations match the concept against real data: 13 Eligible / 1 Blocked / 0 Claimed; leverage ∆Sre & ∆fb2 each 'unblocks 1'; the sole blocked item ∆LwK has openNeeds [∆Sre, ∆fb2]; focus traversal yields ∆LwK->{∆Sre,∆fb2} upstream and ∆Sre->∆LwK downstream. I stopped my server and removed the .gitignore'd .delto-gui-intents.local.jsonl test queue afterward.\n\nWhat is real vs. faked: all data, state, leverage, focus graph, and the intent POST/GET/resolve loop are genuinely wired to the same-origin API. The 'claimant ribbon' path exists in code but renders nothing today because 0 items are claimed (correct empty behavior). 'Retired' epic lanes are scaffolded via a small KNOWN_EPICS map (First npm Publish -> Skill Guidance, Packaging & Release) so a lane renders honestly as retired if it empties out — currently both have items, so none shows. The composer's 'link-needs' kind from the concept is surfaced implicitly through clickable needs-chips rather than as a standalone composer mode (kept scope tight). The journal velocity sparkline uses stats from /api/snapshot but I did not build a separate journal-entry reader view — that was out of scope for a triage cockpit.\n\nNote: two other mockup servers (ports 4532 journal-ledger, 4533 lifecycle-flow) from parallel agents are running and were left untouched; they are not mine. I could not run a headless browser (none installed), so visual rendering was validated via static DOM logic + node --check rather than a screenshot; the data-path and API loop are confirmed live via curl.
