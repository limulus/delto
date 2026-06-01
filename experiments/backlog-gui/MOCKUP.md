# Deltaway

_One immutable deltoid, one continuous story — from backlog idea to shipped journal entry._

**Surface:** BOTH — the lifecycle journey of a deltoid, unifying BACKLOG.md and docs/journal into one flow board  
**Branch:** `mockups/3-lifecycle-flow`

## Run it

```sh
node experiments/backlog-gui/server.ts --port 4533
# then open http://127.0.0.1:4533
```

The base server serves this mockup from `experiments/backlog-gui/public/` and exposes the
read-only API it consumes. Nothing here edits `BACKLOG.md` — actions POST intents to
`/api/intents`, a queue the agent drains (see the repo `experiments/backlog-gui/README.md`).

## The idea

Deltaway is a lifecycle flow board where every backlog item is a card that carries its immutable deltoid across four lanes — Backlog, Eligible, Claimed, Done (journal) — so you watch one continuous story instead of two disconnected documents. The board is fed entirely by the read-only base server: lanes are derived from the real eligibility/needs/claim state, and the Done lane is the journal itself, where each card flips over to reveal the planned backlog text quoted right next to the Retrospective it actually became. Moving a card never touches BACKLOG.md — a drag across a lane boundary POSTs a single typed intent (claim / plan / complete) to /api/intents with an optimistic ghost card, exactly the difit hand-off, and the agent drains the queue and enacts the real edit. It makes the gap between "what we planned" and "what we shipped" tangible, satisfying, and finally one thing.

**Problem it addresses:** delto's backlog and its completion journal live in two unconnected views. BACKLOG.md tells you what's planned; docs/journal tells you what shipped — but nothing renders the bridge between them, even though the immutable 3-char deltoid is literally the same ID in both places. You can't see an item's journey: when did ∆fb2 become eligible, who unblocked ∆LwK, did what we planned for ∆yNQ match what we actually shipped? The reasoning trail (a review on ∆Rdm spawning ∆fb2 and ∆29K) is invisible. And because the agent owns BACKLOG.md, a human reviewer has no safe way to nudge work along the pipeline without editing the file the agent is mid-context on.

## Key interactions

- Drag a card rightward across a lane boundary to advance it: Eligible->Claimed POSTs {kind:'claim'}, Claimed->Done POSTs {kind:'complete'}. The card leaves an optimistic ghost in the new lane with a 'queued' badge until the agent resolves the intent; it never moves in BACKLOG.md.
- Cards snap back if dragged into an illegal lane (e.g. a blocked card cannot reach Eligible) — the needs bar shakes and names the open prerequisite, teaching the eligibility rule by feel.
- Click the ∆ chip to copy the deltoid; click the card body to open Deltoid Detail and flip a Done card between its planned backlog text and its shipped journal prose.
- Toggle the Needs Graph overlay to trace eligibility edges; hovering ∆Sre highlights its dependent ∆LwK downstream and dims everything else.
- Hover a Done card to see a one-line 'spawned by' / 'surfaced' provenance pulled from the journal body (e.g. ∆fb2 'Surfaced by the ∆Rdm review'), drawing a faint arc back to the originating card.
- Scrub a timeline slider across the top to replay the journal's real history (busiest day 2026-05-31 with 8 completions) — Done cards stack in over time so you literally watch the board drain.
- Open the Pending Intents Tray to review, label (add a note), or retract any intent the agent hasn't drained yet.

## Intents it hands to the agent

- `claim` — User drags an eligible card (e.g. ∆Sre) from the Eligible lane into the Claimed lane — queues the agent to claim it; body {kind:'claim', deltoid, note?}
- `complete` — User drags a claimed card into the Done lane, signaling the work is accepted and the agent should scaffold the journal entry and prune the bullet; body {kind:'complete', deltoid, note?}
- `plan` — User opens a Backlog/Eligible card and adds planning intent or asks the agent to start refining/planning it before claiming; body {kind:'plan', deltoid, note}
- `unblock-review` — User flags a blocked card (∆LwK) in the Needs overlay to ask the agent to re-check whether its prerequisites have effectively cleared; body {kind:'unblock-review', deltoid, note}
- `reprioritize` — User drags a card vertically across an Initiative band or above/below a sibling to suggest a new rough priority order to the agent (never reorders BACKLOG.md directly); body {kind:'reprioritize', deltoid, note}

## What actually works against the live API

- Live board fetched from GET /api/snapshot at runtime (nothing hardcoded): 14 backlog items derived into Backlog/Eligible/Claimed lanes by real eligible/claimed/blocked state, grouped by Initiative band; 17 journal entries fill the Done lane newest-first, grouped by completion day.
- The intent side-channel is real: dragging Eligible->Claimed POSTs {kind:'claim'}, Claimed->Done POSTs {kind:'complete'}; drawer buttons POST claim/complete/plan/unblock-review; each POST shows an optimistic dashed 'queued' ghost card + a toast, then re-reads GET /api/intents. Verified the full POST/GET/resolve round-trip against the running server.
- Agent inbox (Pending Intents Tray) lists every queued intent live from GET /api/intents with queued/enacted status, a per-intent retract button that POSTs /api/intents/:seq/resolve, a pending-count badge, and a 5s live refresh that flips ghosts from 'queued' to gone once the agent resolves them (reconciled by seq).
- The Flip panel fetches GET /api/journal/:file and renders the real Planning/Refinement/Retrospective HTML beside the quoted backlog bullet.
- Needs-graph overlay draws real dependency edges from /api/snapshot (the one blocked item, deltoid LwK, gets dashed amber arrows from its two open prerequisites Sre and fb2); hovering a card dims everything and highlights its upstream needs + downstream dependents.
- Timeline scrubber replays real journal history by completedMs so Done cards stack in over time; blocked cards shake and name the open prerequisite when dragged toward an illegal lane; clicking the chip copies the deltoid.

## Build notes

The one hard rule is honored everywhere: no path writes BACKLOG.md — every action POSTs a typed intent to /api/intents and the UI states this explicitly (a persistent never-edit banner, 'queued for the agent — BACKLOG.md untouched' toast copy, and the tray's explanation that the agent drains the queue). \n\nWhat is genuinely wired vs. presentational: claim/complete/plan/unblock-review intents all POST for real and reflect via re-read; the 'reprioritize' intent kind is defined in the concept and supported by the intent body shape but I did not wire vertical drag-to-reprioritize (kept scope tight — horizontal lane-crossing is the primary gesture). Drag-and-drop uses native HTML5 DnD (works with a mouse; touch drag is not implemented). \n\nThe intent queue file is shared repo-wide across all mockups, so the tray may show intents queued by other mockups/tools — the UI handles arbitrary kinds gracefully (CSS class names are sanitized). I cleaned up all my test intents and left no server running; verified port 4533 is down and .delto-gui-intents.local.jsonl removed. \n\nNo headless browser was available in the environment, so I could not capture a screenshot; I verified instead by node --check (clean parse), serving all assets (200s), the full intent POST/GET/resolve round-trip, the journal-HTML strip logic against real data, color determinism, and an id-selector cross-check against index.html. Fonts use offline system stacks (Iowan/Palatino serif, Berkeley/JetBrains/Iosevka mono, Optima/Gill Sans humanist) with strong fallbacks since no CDN is allowed; the exact rendered face will depend on what's installed locally but each stack degrades to a sensible same-category fallback.
