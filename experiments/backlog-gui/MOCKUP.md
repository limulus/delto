# Driftwood

_Read the river of finished work, and pan its retrospectives for gold._

**Surface:** JOURNAL history & retrospective harvesting  
**Branch:** `mockups/2-journal-ledger`

## Run it

```sh
node experiments/backlog-gui/server.ts --port 4532
# then open http://127.0.0.1:4532
```

The base server serves this mockup from `experiments/backlog-gui/public/` and exposes the
read-only API it consumes. Nothing here edits `BACKLOG.md` — actions POST intents to
`/api/intents`, a queue the agent drains (see the repo `experiments/backlog-gui/README.md`).

## The idea

Driftwood is a reading room and harvesting bench for delto's completion journal. The left is a living velocity river — every finished deltoid as a node on a vertical time stream, the 2026-05-31 burst of 8 visibly cresting — that doubles as full-text search and navigation. The center is a typographically gorgeous reader for a single entry's rendered HTML, with the Retrospective section pulled into a permanent right-hand "harvest margin." From that margin you select any passage and turn it into intent: queue a follow-up backlog item, flag a reusable lesson, or batch-select several entries and ask the agent to draft a cross-cutting retrospective. It never touches BACKLOG.md — every harvest is a POST to /api/intents, shown with an optimistic chip, exactly like difit handing comments back. It turns a pile of finished work into felt velocity and actionable learning.

**Problem it addresses:** The 17 completion entries under docs/journal are the project's durable reasoning record — Planning/Refinement/Retrospective prose with a completed: timestamp — but there is no way to browse them, feel velocity, or do anything with the Retrospectives. The real signal is trapped: ∆RP9's branch self-review spawned five follow-up deltoids (∆rTJ, ∆NOp, ∆y0B, ∆hoW, ∆HQN) and a reusable difit-seeding lesson; ∆uaD's retro coined "fix at the writer, not the reader" and "let the LLM caller decide." Today those lessons get re-learned, those follow-ups get re-discovered, and that hard-won judgment evaporates because nothing surfaces or acts on it. delto already files reflection beautifully; nothing harvests it.

## Key interactions

- Scroll/drag the vertical River to scrub through time; node size encodes wordCount and vertical position encodes completedMs, so velocity is something you feel, not a bar chart you read.
- Click a River node to open its entry in the Reader (GET /api/journal/:file), rendered from the returned html with a section rail for Planning/Refinement/Retrospective.
- Full-text search filters the River in place and highlights hits inside the Reader; typing 'difit' or 'caller decide' surfaces the exact retros that discussed them.
- Select prose in the Retrospective to raise the Harvest Margin actions: spawn a follow-up backlog item, mark a reusable lesson, or quote into a draft — each becomes a card before it is queued.
- Multi-select entries (lasso a date range on the River, or pick search matches) and 'Draft retrospective across N' to queue a single cross-cutting synthesis intent.
- Every harvest POSTs to /api/intents and shows an optimistic chip in the Intent tray; nothing edits BACKLOG.md — the agent drains the queue.
- Click a cross-referenced deltoid in the prose to jump to its journal entry or its live backlog item.

## Intents it hands to the agent

- `journal.spawn-followup-item` — User selects a Retrospective/Refinement passage and chooses 'Spawn follow-up item'; body carries the source deltoid as provenance, the quoted passage as note, and an optional suggested initiative/epic and needs:
- `journal.mark-lesson` — User flags a passage as a reusable lesson; body carries source deltoid, a short lesson label, and the quoted text for the agent to fold into skill guidance or notes
- `journal.draft-cross-retro` — User multi-selects N entries and requests a synthesized cross-cutting retrospective; body carries the list of source deltoids/files and an optional theme note
- `journal.draft-followup-from-search` — User runs a full-text search, finds a recurring theme, and asks the agent to draft an item addressing it; body carries the query, matching deltoids, and a note

## What actually works against the live API

- Loads live data from GET /api/snapshot (17 journal entries, 14 backlog items, stats) on boot
- Opens any entry via GET /api/journal/:file and renders the returned html field in the long-form reader with a section rail
- Full-text search fetches and caches each entry's section markdown, filters the River, and highlights inline hits in the Reader
- All five harvest/compose actions POST real intents to /api/intents (verified: journal.spawn-followup-item, mark-lesson, quote-into-draft, draft-cross-retro, draft-followup-from-search all return 201 with monotonic seq)
- Agent inbox re-reads GET /api/intents and reflects the true queue including the optimistic chip just added
- 'Mark handled' calls POST /api/intents/:seq/resolve and the chip flips to resolved on re-read (verified 200 + resolved=true)
- Empty states are real: clean inbox on first load, and a reader/margin empty state until you open an entry and pan a retrospective
- Cross-referenced ∆xxx deltoids in prose link to their journal entry, or surface a toast for live backlog items
- Deep links (/e/<id>) resolve via the server's SPA fallback and open that entry

## Build notes

Verified end-to-end with the base server on port 4532: static files serve, all 17 journal entries fetch with sections+html, the full intent POST/GET/resolve lifecycle works, and `node --check` passes on app.js. The server was killed afterward and the .delto-gui-intents.local.jsonl queue was cleared so the demo opens with a genuine empty inbox (the file is gitignored). A separate lifecycle-flow mockup server on port 4533 (not mine) was left running and untouched.\n\nNo headless browser was available in the sandbox, so DOM/interaction logic was verified by static review + curl-driving every API path the JS uses (matching app.js's exact encodeURIComponent filenames against the server's decode), rather than a live browser screenshot. Fonts use refined system stacks (Iowan/Palatino serif, system mono) since no CDNs/web-font downloads are allowed offline — the design degrades gracefully across platforms.\n\nLightly faked / illustrative: the KNOWN_PROVENANCE map (∆RP9 → its five follow-ups) is seeded from the corpus rather than derived from a provenance API the base server doesn't expose — the real ∆RP9 retro does name those deltoids, so it's accurate, just not computed live. The needs:/initiative pickers and lesson-label/follow-up text are heuristic seed suggestions the human edits before casting. Reading time is wordCount/220. Everything that touches the agent is a real intent POST; nothing writes BACKLOG.md.
