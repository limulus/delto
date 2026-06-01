/* ============================================================================
   Deltaway — lifecycle flow board.
   The board is fed entirely by the read-only base server. The ONLY thing it
   writes is intent: every lane-crossing action POSTs a single typed intent to
   /api/intents. It never edits BACKLOG.md — the agent drains the queue.
   ============================================================================ */

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const SIGIL = '∆'

/* ---- the four lanes, read left-to-right as a timeline of becoming ---- */
const LANES = [
  { id: 'backlog',  name: 'Backlog',  sub: 'minted' },
  { id: 'eligible', name: 'Eligible', sub: 'needs cleared' },
  { id: 'claimed',  name: 'Claimed',  sub: 'in progress' },
  { id: 'done',     name: 'Done',     sub: 'journal' },
]
const LANE_INDEX = Object.fromEntries(LANES.map((l, i) => [l.id, i]))

/* legal forward transitions and the intent each one queues */
const TRANSITIONS = {
  'eligible>claimed': { kind: 'claim',    verb: 'claim' },
  'claimed>done':     { kind: 'complete', verb: 'complete' },
}

const state = {
  snapshot: null,
  items: [],            // backlog items
  journal: [],          // done entries, newest-first
  intents: [],          // recorded intents from /api/intents
  ghosts: new Map(),    // deltoid -> { lane, kind, seq }
  timeMax: null,        // for scrubber: ms cutoff (null = all)
  needsMode: false,
  bandsByLane: {},      // computed band->cards per lane
}

/* ========================================================================
   deterministic per-deltoid hue — the through-line color
   ======================================================================== */
const hueCache = new Map()
function deltoidColor(id) {
  if (hueCache.has(id)) return hueCache.get(id)
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  const hue = h % 360
  const sat = 52 + (h >> 4) % 16        // 52–67%
  const light = 38 + (h >> 8) % 10       // 38–47% — readable on white
  const accent = `hsl(${hue} ${sat}% ${light}%)`
  const glow = `hsl(${hue} ${sat}% ${light}% / .22)`
  const val = { accent, glow, hue }
  hueCache.set(id, val)
  return val
}

/* ========================================================================
   data load
   ======================================================================== */
async function loadSnapshot() {
  const res = await fetch('/api/snapshot', { cache: 'no-store' })
  if (!res.ok) throw new Error(`snapshot ${res.status}`)
  const snap = await res.json()
  state.snapshot = snap
  state.items = snap.backlog.items
  state.journal = snap.journal
  state.intents = snap.intents || []
  reconcileGhosts()
  return snap
}

/* ---- lane assignment derived purely from real state ---- */
function laneOf(item) {
  if (item.claimed) return 'claimed'
  if (item.eligible) return 'eligible'
  return 'backlog'              // blocked items live in Backlog
}

/* ========================================================================
   render board
   ======================================================================== */
const boardEl = $('#board')

function render() {
  if (!state.snapshot) return
  document.body.removeAttribute('data-loading')

  // group backlog items by lane, then by initiative band
  const byLane = { backlog: {}, eligible: {}, claimed: {}, done: {} }
  const initiatives = state.snapshot.backlog.initiatives

  for (const item of state.items) {
    const lane = laneOf(item)
    const band = item.initiative || 'Other'
    ;(byLane[lane][band] ||= []).push(item)
  }
  state.bandsByLane = byLane

  boardEl.innerHTML = ''
  for (const lane of LANES) {
    boardEl.appendChild(renderLane(lane, byLane[lane.id], initiatives))
  }
  // threads after layout settles
  requestAnimationFrame(() => requestAnimationFrame(drawThreads))
}

function laneCount(laneId, bands) {
  if (laneId === 'done') return visibleJournal().length
  let n = Object.values(bands).reduce((a, c) => a + c.length, 0)
  // count optimistic ghosts living in this lane
  for (const g of state.ghosts.values()) if (g.lane === laneId) n++
  return n
}

function renderLane(lane, bands, initiatives) {
  const el = document.createElement('section')
  el.className = 'lane'
  el.dataset.lane = lane.id

  const head = document.createElement('header')
  head.className = 'lane-head'
  head.innerHTML = `
    <span class="lane-name">${lane.name}</span>
    <span class="lane-sub">${lane.sub}</span>
    <span class="lane-count">${laneCount(lane.id, bands)}</span>`
  el.appendChild(head)

  const body = document.createElement('div')
  body.className = 'lane-body'
  el.appendChild(body)

  if (lane.id === 'done') {
    renderDoneLane(body)
  } else {
    renderBacklogLane(body, lane, bands, initiatives)
  }

  // drop target wiring
  body.addEventListener('dragover', (e) => onDragOver(e, lane.id, el))
  body.addEventListener('dragleave', () => { el.classList.remove('drop-ok', 'drop-no') })
  body.addEventListener('drop', (e) => onDrop(e, lane.id, el))
  // keep threads aligned while a lane scrolls (re-attached every render)
  body.addEventListener('scroll', () => requestAnimationFrame(drawThreads), { passive: true })
  return el
}

function renderBacklogLane(body, lane, bands, initiatives) {
  const ghostsHere = [...state.ghosts.entries()].filter(([, g]) => g.lane === lane.id)

  // claimed lane has its own empty state (no items claimed in real data)
  if (lane.id === 'claimed' && !Object.keys(bands).length && !ghostsHere.length) {
    body.appendChild(emptyState(
      'claimed',
      'Nothing claimed yet',
      'Drag an Eligible card here to queue a <code>claim</code> intent. The agent picks it up and marks the work started.'
    ))
    return
  }

  let any = false
  for (const init of initiatives) {
    const cards = bands[init] || []
    if (!cards.length) continue
    any = true
    const band = document.createElement('div')
    band.className = 'band'
    band.innerHTML = `<div class="band-label">${init}</div>`
    for (const item of cards) band.appendChild(renderCard(item, lane.id))
    body.appendChild(band)
  }

  // optimistic ghosts in this lane
  for (const [deltoid, g] of ghostsHere) {
    const item = state.items.find((i) => i.deltoid === deltoid)
    if (item) body.appendChild(renderGhostCard(item, lane.id, g))
  }

  if (!any && !ghostsHere.length) {
    const what = lane.id === 'backlog'
      ? ['All clear', 'Nothing waiting on prerequisites — every item is either eligible or shipped.']
      : ['Empty', 'No cards here yet.']
    body.appendChild(emptyState(lane.id, what[0], what[1]))
  }
}

function emptyState(kind, title, html) {
  const el = document.createElement('div')
  el.className = 'lane-empty'
  el.innerHTML = `
    <div class="emoji-free">${kind === 'claimed' ? '◷' : kind === 'backlog' ? '✓' : '·'}</div>
    <h4>${title}</h4><p>${html}</p>`
  return el
}

/* ---- a single backlog card ---- */
function renderCard(item, laneId) {
  const { accent, glow } = deltoidColor(item.id)
  const el = document.createElement('article')
  el.className = 'card'
  el.dataset.deltoid = item.deltoid
  el.dataset.id = item.id
  el.dataset.lane = laneId
  el.style.setProperty('--accent', accent)
  el.style.setProperty('--accent-glow', glow)
  if (item.blocked) el.classList.add('blocked')

  const draggable = laneId === 'eligible' || laneId === 'claimed'
  if (draggable) el.draggable = true

  const epic = item.epic ? `<span class="epic-tag" title="${esc(item.epic)}">${esc(item.epic)}</span>` : ''

  let extras = ''
  if (item.blocked && item.openNeeds.length) {
    const needs = item.openNeeds.map((n) => `<span class="need" data-need="${n}">${SIGIL}${n}</span>`).join(' ')
    extras = `<div class="needs-bar"><span class="lock">⊘</span> needs ${needs}</div>`
  } else if (item.dependents.length) {
    const deps = item.dependents.map((d) => `${SIGIL}${d}`).join(', ')
    extras = `<div class="dep-hint"><span class="arrow">→</span> unblocks ${deps}</div>`
  }

  el.innerHTML = `
    <div class="card-top">
      ${chipHTML(item.id, accent)}
      ${epic}
    </div>
    <div class="card-summary">${esc(item.summary || item.text)}</div>
    ${extras}`

  wireCard(el, item)
  if (draggable) wireDrag(el, item, laneId)
  return el
}

function renderGhostCard(item, laneId, ghost) {
  const { accent, glow } = deltoidColor(item.id)
  const el = document.createElement('article')
  el.className = 'card ghost'
  el.dataset.deltoid = item.deltoid
  el.dataset.id = item.id
  el.dataset.lane = laneId
  el.style.setProperty('--accent', accent)
  el.style.setProperty('--accent-glow', glow)
  el.innerHTML = `
    <div class="card-top">
      ${chipHTML(item.id, accent)}
      <span class="queued-pill"><span class="pulse"></span>queued · ${ghost.kind}</span>
    </div>
    <div class="card-summary">${esc(item.summary || item.text)}</div>
    <div class="dep-hint">awaiting agent — intent #${ghost.seq ?? '…'}</div>`
  el.addEventListener('click', () => openTray())
  return el
}

function chipHTML(id, accent) {
  return `<button class="chip" data-copy="${SIGIL}${id}" title="copy ${SIGIL}${id}" style="--accent:${accent}">
      <span class="sigil">${SIGIL}</span>${id}</button>`
}

/* ---- done lane: journal entries, newest-first, ink-stamped ---- */
function visibleJournal() {
  if (state.timeMax == null) return state.journal
  return state.journal.filter((e) => (e.completedMs ?? 0) <= state.timeMax)
}

function renderDoneLane(body) {
  const entries = visibleJournal()
  if (!entries.length) {
    body.appendChild(emptyState('done', 'Before the first ship',
      'Scrub the timeline forward to watch completions stack into the archive.'))
    return
  }
  // group by initiative? journal entries have no initiative — group by day for the archive feel
  let lastDay = null
  for (const e of entries) {
    const day = (e.completed || '').slice(0, 10)
    if (day !== lastDay) {
      lastDay = day
      const lbl = document.createElement('div')
      lbl.className = 'band-label'
      lbl.style.marginTop = '8px'
      lbl.textContent = formatDay(day)
      body.appendChild(lbl)
    }
    body.appendChild(renderDoneCard(e))
  }
}

function renderDoneCard(entry) {
  const { accent, glow } = deltoidColor(entry.id)
  const el = document.createElement('article')
  el.className = 'card'
  el.dataset.deltoid = entry.deltoid
  el.dataset.id = entry.id
  el.dataset.lane = 'done'
  el.dataset.file = entry.file
  el.style.setProperty('--accent', accent)
  el.style.setProperty('--accent-glow', glow)

  const prov = provenanceOf(entry)
  el.innerHTML = `
    <div class="card-top">
      ${chipHTML(entry.id, accent)}
      <span class="epic-tag">${entry.wordCount} words</span>
    </div>
    <div class="done-title">${esc(entry.title)}</div>
    <div class="card-summary" style="-webkit-line-clamp:2">${esc(firstLineOfItem(entry))}</div>
    ${prov ? `<div class="provenance">${esc(prov)}</div>` : ''}
    <div class="done-stamp">✦ ${formatStamp(entry.completed)}</div>
    <div class="wax-seal" aria-hidden="true"></div>`

  el.addEventListener('click', (e) => {
    if (e.target.closest('.chip')) return
    openDetail(entry.deltoid)
  })
  wireChips(el)
  return el
}

/* pull a "spawned by / surfaced" provenance line from the journal body */
function provenanceOf(entry) {
  const secs = entry.sections || []
  const text = secs.map((s) => s.markdown).join('\n')
  // look for references to other deltoids in planning/refinement
  const m = text.match(/(?:surfaced|spawned|prompted|review|follow[- ]?up)[^.\n]*?∆[\dA-Za-z]{3}/i)
  if (m) return cleanProse(m[0])
  const ref = text.match(/∆[\dA-Za-z]{3}/)
  if (ref && ref[0] !== entry.deltoid) return `references ${ref[0]} in its write-up`
  return null
}
function firstLineOfItem(entry) {
  const raw = (entry.item || '').replace(/^[-*]\s*/, '').replace(/∆[\dA-Za-z]{3}\s*/, '')
  return cleanProse(raw).split(/\.\s|—|;/)[0]
}
function cleanProse(s) { return s.replace(/[`*>]/g, '').replace(/\s+/g, ' ').trim() }

/* ========================================================================
   chip copy + card click
   ======================================================================== */
function wireChips(root) {
  $$('.chip', root).forEach((chip) => {
    chip.addEventListener('click', async (e) => {
      e.stopPropagation()
      const text = chip.dataset.copy
      try { await navigator.clipboard.writeText(text) } catch { /* clipboard may be blocked */ }
      chip.classList.remove('copied'); void chip.offsetWidth; chip.classList.add('copied')
      setTimeout(() => chip.classList.remove('copied'), 1100)
    })
  })
}
function wireCard(el, item) {
  wireChips(el)
  el.addEventListener('click', (e) => {
    if (e.target.closest('.chip')) return
    if (e.target.closest('[data-need]')) {
      const need = e.target.closest('[data-need]').dataset.need
      flashNeed(item, need)
      return
    }
    openDetail(item.deltoid)
  })
}

/* ========================================================================
   drag & drop — the lane-crossing intent gesture
   ======================================================================== */
let dragging = null   // { item, fromLane, el }

function wireDrag(el, item, fromLane) {
  el.addEventListener('dragstart', (e) => {
    dragging = { item, fromLane, el }
    el.style.opacity = '.4'
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.deltoid)
  })
  el.addEventListener('dragend', () => {
    el.style.opacity = ''
    dragging = null
    $$('.lane').forEach((l) => l.classList.remove('drop-ok', 'drop-no'))
  })
}

function legalMove(fromLane, toLane, item) {
  if (fromLane === toLane) return { ok: false, reason: 'same' }
  const key = `${fromLane}>${toLane}`
  if (!TRANSITIONS[key]) {
    // moving backwards or skipping lanes is illegal
    if (item.blocked && toLane === 'eligible') {
      return { ok: false, reason: `blocked — needs ${item.openNeeds.map((n) => SIGIL + n).join(', ')}` }
    }
    return { ok: false, reason: 'illegal' }
  }
  return { ok: true, ...TRANSITIONS[key] }
}

function onDragOver(e, toLane, laneEl) {
  if (!dragging) return
  e.preventDefault()
  const verdict = legalMove(dragging.fromLane, toLane, dragging.item)
  laneEl.classList.toggle('drop-ok', verdict.ok)
  laneEl.classList.toggle('drop-no', !verdict.ok && dragging.fromLane !== toLane)
  e.dataTransfer.dropEffect = verdict.ok ? 'move' : 'none'
}

async function onDrop(e, toLane, laneEl) {
  if (!dragging) return
  e.preventDefault()
  laneEl.classList.remove('drop-ok', 'drop-no')
  const { item, fromLane, el } = dragging
  const verdict = legalMove(fromLane, toLane, item)

  if (!verdict.ok) {
    if (fromLane !== toLane) {
      el.classList.add('shake')
      setTimeout(() => el.classList.remove('shake'), 450)
      if (verdict.reason && verdict.reason !== 'illegal' && verdict.reason !== 'same') {
        toast({ kind: 'blocked', deltoid: item.deltoid,
          title: 'Snapped back', sub: verdict.reason })
      }
    }
    return
  }
  await queueIntent({ kind: verdict.kind, deltoid: item.deltoid }, { optimisticLane: toLane })
}

/* ========================================================================
   THE INTENT SIDE-CHANNEL — POST /api/intents, optimistic ghost + toast
   ======================================================================== */
async function queueIntent(body, opts = {}) {
  const { optimisticLane, note } = opts
  if (note) body.note = note

  // optimistic ghost immediately
  if (optimisticLane && body.deltoid) {
    state.ghosts.set(body.deltoid, { lane: optimisticLane, kind: body.kind, seq: null })
    render()
  }

  let recorded = null
  try {
    const res = await fetch('/api/intents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`intents ${res.status}`)
    recorded = await res.json()
    if (optimisticLane && body.deltoid) {
      state.ghosts.set(body.deltoid, { lane: optimisticLane, kind: body.kind, seq: recorded.seq })
    }
  } catch (err) {
    if (body.deltoid) state.ghosts.delete(body.deltoid)
    render()
    toast({ kind: 'error', title: 'Could not reach the agent queue', sub: String(err.message || err) })
    return null
  }

  await refreshIntents()
  render()
  updateTrayCount()
  toast({
    kind: body.kind,
    deltoid: body.deltoid,
    title: intentToastTitle(body.kind),
    sub: note ? `“${truncate(note, 60)}”` : 'queued for the agent — BACKLOG.md untouched',
    seq: recorded.seq,
  })
  return recorded
}

function intentToastTitle(kind) {
  return {
    claim: 'Asked the agent to claim it',
    complete: 'Asked the agent to complete it',
    plan: 'Asked the agent to start planning',
    'unblock-review': 'Asked the agent to re-check prerequisites',
    reprioritize: 'Suggested a new priority to the agent',
  }[kind] || 'Intent queued'
}

/* ========================================================================
   toasts (with undo for not-yet-drained intents)
   ======================================================================== */
const toastsEl = $('#toasts')
function toast({ kind, deltoid, title, sub, seq }) {
  const el = document.createElement('div')
  el.className = 'toast'
  const color = deltoid ? deltoidColor(deltoid.replace(SIGIL, '')).accent
    : kind === 'error' || kind === 'blocked' ? '#9a3b2e' : '#c08a3e'
  el.style.borderLeftColor = color
  const chip = deltoid ? `<span class="t-chip" style="background:${color}">${deltoid}</span>` : ''
  const undo = seq ? `<button class="t-undo" data-undo="${seq}">retract</button>` : ''
  el.innerHTML = `${chip}<div class="t-body"><b>${esc(title)}</b><span class="sub">${esc(sub || '')}</span></div>${undo}`
  if (seq) {
    el.querySelector('[data-undo]').addEventListener('click', async () => {
      await retractIntent(seq, deltoid)
      dismissToast(el)
    })
  }
  toastsEl.appendChild(el)
  setTimeout(() => dismissToast(el), seq ? 6500 : 4200)
}
function dismissToast(el) {
  if (!el.isConnected) return
  el.classList.add('leaving')
  setTimeout(() => el.remove(), 320)
}

/* ========================================================================
   intents tray (agent inbox)
   ======================================================================== */
async function refreshIntents() {
  try {
    const res = await fetch('/api/intents', { cache: 'no-store' })
    const data = await res.json()
    state.intents = data.intents || []
    reconcileGhosts()
  } catch { /* keep last known */ }
}

/* Drop ghosts whose intent the agent has resolved (i.e. drained the queue). */
function reconcileGhosts() {
  for (const [deltoid, g] of state.ghosts) {
    if (g.seq == null) continue
    const rec = state.intents.find((i) => i.seq === g.seq)
    if (rec && rec.resolved) state.ghosts.delete(deltoid)
  }
}

async function retractIntent(seq, deltoid) {
  try {
    await fetch(`/api/intents/${seq}/resolve`, { method: 'POST' })
  } catch { /* best effort */ }
  // drop the optimistic ghost tied to this intent (by seq, then by deltoid)
  for (const [d, g] of state.ghosts) if (g.seq === seq) state.ghosts.delete(d)
  if (deltoid) state.ghosts.delete(deltoid)
  await refreshIntents()
  render()
  renderTray()
  updateTrayCount()
}

const trayEl = $('#tray')
const trayBody = $('#trayBody')

function openTray() {
  trayEl.setAttribute('aria-hidden', 'false')
  $('#trayToggle').setAttribute('aria-expanded', 'true')
  renderTray()
}
function closeTray() {
  trayEl.setAttribute('aria-hidden', 'true')
  $('#trayToggle').setAttribute('aria-expanded', 'false')
}

function renderTray() {
  const intents = [...state.intents].reverse()  // newest first
  if (!intents.length) {
    trayBody.innerHTML = `
      <div class="tray-empty">
        <div class="glyph">${SIGIL}</div>
        <div class="big">The inbox is empty</div>
        <p>When you drag a card across a lane, or ask the agent to plan or re-check an item,
        the request lands here as an intent. The agent drains the queue and makes the real
        <code>BACKLOG.md</code> edits.</p>
      </div>`
  } else {
    trayBody.innerHTML = intents.map(intentRowHTML).join('')
    $$('[data-retract]', trayBody).forEach((b) => {
      b.addEventListener('click', () => retractIntent(Number(b.dataset.retract), b.dataset.deltoid || null))
    })
  }
  const pending = state.intents.filter((i) => !i.resolved).length
  $('#trayFootStat').textContent = `${state.intents.length} total · ${pending} pending`
}

function intentRowHTML(it) {
  const cls = (it.kind || '').replace(/[^a-z-]/gi, '')
  const color = it.deltoid ? deltoidColor(it.deltoid.replace(SIGIL, '')).accent : '#c08a3e'
  const chip = it.deltoid
    ? `<span class="chip" style="--accent:${color}"><span class="sigil">${SIGIL}</span>${it.deltoid.replace(SIGIL, '')}</span>`
    : ''
  const status = it.resolved
    ? `<span class="intent-status done"><span class="pulse"></span>enacted</span>`
    : `<span class="intent-status"><span class="pulse"></span>queued</span>`
  const note = it.note
    ? `<p class="intent-note">${esc(it.note)}</p>`
    : `<p class="intent-note empty">no note — the kind speaks for itself</p>`
  const retract = it.resolved ? '' :
    `<button class="link-btn" data-retract="${it.seq}" data-deltoid="${it.deltoid || ''}">retract</button>`
  return `
    <div class="intent-row ${it.resolved ? 'resolved' : ''}">
      <div class="intent-top">
        <span class="intent-kind ${cls}">${esc(it.kind)}</span>
        ${chip}${status}
      </div>
      ${note}
      <div class="intent-foot">
        <span class="intent-ts mono">#${it.seq} · ${formatAgo(it.ts)}</span>
        ${retract}
      </div>
    </div>`
}

function updateTrayCount() {
  const pending = state.intents.filter((i) => !i.resolved).length
  const badge = $('#trayCount')
  if (pending > 0) { badge.hidden = false; badge.textContent = pending }
  else badge.hidden = true
}

/* ========================================================================
   detail drawer + flip
   ======================================================================== */
const drawer = $('#drawer')
const drawerPanel = $('#drawerPanel')

function findEverything(deltoid) {
  const item = state.items.find((i) => i.deltoid === deltoid)
  const entry = state.journal.find((e) => e.deltoid === deltoid)
  return { item, entry }
}

async function openDetail(deltoid) {
  const { item, entry } = findEverything(deltoid)
  const id = deltoid.replace(SIGIL, '')
  const { accent, glow } = deltoidColor(id)
  drawerPanel.style.setProperty('--accent', accent)
  drawerPanel.style.setProperty('--accent-glow', glow)

  const isDone = !!entry
  const title = entry ? entry.title : (item ? (item.summary || item.text).split(/\.\s|—/)[0] : deltoid)
  const lane = item ? laneOf(item) : 'done'

  // lifecycle spine
  const stages = ['minted', 'eligible', 'claimed', 'done']
  const reachedIdx = isDone ? 3 : LANE_INDEX[lane]
  const whenDone = entry ? formatStamp(entry.completed) : ''
  const spine = stages.map((s, i) => {
    const reached = i <= reachedIdx
    const current = i === reachedIdx && !isDone
    const ghost = state.ghosts.get(deltoid)
    const when = i === 3 && isDone ? whenDone : (i === reachedIdx && ghost ? 'queued' : '')
    return `<div class="spine-node ${reached ? 'reached' : ''} ${current ? 'current' : ''}">
        <div class="spine-dot"></div>
        <div class="spine-label">${s}</div>
        ${when ? `<span class="spine-when">${when}</span>` : ''}
      </div>`
  }).join('')

  drawerPanel.innerHTML = `
    <header class="dh">
      <div class="dh-top">
        ${chipHTML(id, accent)}
        <div>
          <div class="dh-title">${esc(title)}</div>
          <div class="dh-meta">${esc(detailMeta(item, entry))}</div>
        </div>
        <button class="x-btn" id="drawerClose" aria-label="Close">&times;</button>
      </div>
      <div class="spine">${spine}</div>
    </header>
    <div class="db" id="db">${isDone ? doneBodyHTML(entry) : backlogBodyHTML(item)}</div>
    ${actionsHTML(item, entry, lane)}`

  wireChips(drawerPanel)
  $('#drawerClose').addEventListener('click', closeDetail)

  if (isDone) wireFlip(entry, accent)
  wireDetailActions(item, entry, lane)

  drawer.setAttribute('aria-hidden', 'false')
}

function detailMeta(item, entry) {
  if (entry) return `completed ${formatStamp(entry.completed)} · ${entry.wordCount} words · ${entry.file}`
  if (!item) return ''
  const parts = [item.initiative]
  if (item.epic) parts.push(item.epic)
  if (item.blocked) parts.push(`blocked · needs ${item.openNeeds.map((n) => SIGIL + n).join(', ')}`)
  else if (item.dependents.length) parts.push(`unblocks ${item.dependents.map((d) => SIGIL + d).join(', ')}`)
  return parts.join(' · ')
}

function backlogBodyHTML(item) {
  if (!item) return `<div class="flip-stage"><p class="loading-prose">No record for this deltoid.</p></div>`
  return `
    <div class="flip-stage">
      <div class="planned-label">backlog item — verbatim</div>
      <div class="planned">${esc(item.text)}</div>
      ${item.dependents.length ? `<p style="margin-top:18px;font-family:var(--mono);font-size:12px;color:var(--ink-faint)">
        Completing this clears the way for ${item.dependents.map((d) => SIGIL + d).join(', ')}.</p>` : ''}
    </div>`
}

function doneBodyHTML(entry) {
  const planned = (entry.sections || []).find((s) => /backlog item/i.test(s.heading))
  const plannedText = planned ? planned.markdown.replace(/^>\s?/gm, '') : (entry.item || '')
  return `
    <div class="flip-bar">
      <button class="flip-tab active" data-face="shipped">what we shipped</button>
      <button class="flip-tab" data-face="planned">what we planned</button>
    </div>
    <div class="flip-stage">
      <div class="flip-inner" id="flipInner">
        <div class="flip-face front">
          <div class="shipped-label">shipped — planning · refinement · retrospective</div>
          <div class="shipped" id="shippedProse">
            <p class="loading-prose"><span class="spin"></span>fetching rendered journal…</p>
          </div>
        </div>
        <div class="flip-face back">
          <div class="planned-label">planned — the original backlog bullet</div>
          <div class="planned">${esc(plannedText.trim())}</div>
        </div>
      </div>
    </div>`
}

function wireFlip(entry, accent) {
  const inner = $('#flipInner')
  const tabs = $$('.flip-tab')
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => x.classList.toggle('active', x === t))
    inner.classList.toggle('flipped', t.dataset.face === 'planned')
  }))
  // fetch the rendered prose for the shipped face
  fetch(`/api/journal/${encodeURIComponent(entry.file)}`, { cache: 'no-store' })
    .then((r) => r.json())
    .then((d) => {
      const target = $('#shippedProse')
      if (!target) return
      // strip the leading "Backlog item" quote — it's already on the flip's back face
      target.innerHTML = stripBacklogSection(d.html || '<p>No rendered body.</p>')
    })
    .catch(() => { const t = $('#shippedProse'); if (t) t.innerHTML = '<p class="loading-prose">Could not load rendered journal.</p>' })
}

function stripBacklogSection(html) {
  // remove the first <h2>Backlog item</h2> ... up to the next <h2>
  return html.replace(/<h2>\s*Backlog item\s*<\/h2>[\s\S]*?(?=<h2>)/i, '')
}

function actionsHTML(item, entry, lane) {
  if (entry) {
    return `<div class="detail-actions">
      <span class="hint">archived · the agent wrote this entry when the work was accepted</span>
      <button class="link-btn" id="copyFile" data-file="${entry.file}">copy journal path</button>
    </div>`
  }
  if (!item) return ''
  const btns = []
  btns.push(`<button class="solid-btn" data-act="plan">Ask agent to plan</button>`)
  if (item.blocked) {
    btns.push(`<button class="solid-btn accent" data-act="unblock-review">Re-check prerequisites</button>`)
  } else if (lane === 'eligible') {
    btns.push(`<button class="solid-btn accent" data-act="claim">Queue claim →</button>`)
  } else if (lane === 'claimed') {
    btns.push(`<button class="solid-btn accent" data-act="complete">Queue complete →</button>`)
  }
  return `<div class="detail-actions">
      <span class="hint">actions queue an intent — they never edit <code>BACKLOG.md</code></span>
      ${btns.join('')}
    </div>`
}

function wireDetailActions(item, entry, lane) {
  if (entry) {
    const cf = $('#copyFile')
    if (cf) cf.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(`docs/journal/${cf.dataset.file}`) } catch {}
      cf.textContent = 'copied ✓'
      setTimeout(() => (cf.textContent = 'copy journal path'), 1400)
    })
    return
  }
  if (!item) return
  $$('[data-act]', drawerPanel).forEach((b) => {
    b.addEventListener('click', () => {
      const act = b.dataset.act
      if (act === 'claim') {
        queueIntent({ kind: 'claim', deltoid: item.deltoid }, { optimisticLane: 'claimed' })
        closeDetail()
      } else if (act === 'complete') {
        queueIntent({ kind: 'complete', deltoid: item.deltoid }, { optimisticLane: 'done' })
        closeDetail()
      } else {
        // plan / unblock-review need a note → composer
        openComposer(act, item.deltoid)
      }
    })
  })
}

function closeDetail() { drawer.setAttribute('aria-hidden', 'true') }

/* ========================================================================
   composer (notes for plan / unblock-review / reprioritize)
   ======================================================================== */
const composer = $('#composer')
let composerCtx = null

function openComposer(kind, deltoid, presetNote = '') {
  composerCtx = { kind, deltoid }
  const id = deltoid.replace(SIGIL, '')
  const { accent } = deltoidColor(id)
  composer.querySelector('.composer-card').style.setProperty('--accent', accent)
  $('#composerKind').textContent = kind
  $('#composerDeltoid').textContent = deltoid
  $('#composerLabel').textContent = {
    plan: 'What should the agent plan or refine first?',
    'unblock-review': 'Why do you think the prerequisites have effectively cleared?',
    reprioritize: 'What new priority are you suggesting, and why?',
  }[kind] || 'Tell the agent what to do'
  $('#composerNote').value = presetNote
  composer.hidden = false
  requestAnimationFrame(() => $('#composerNote').focus())
}
function closeComposer() { composer.hidden = true; composerCtx = null }

$('#composerForm').addEventListener('submit', async (e) => {
  e.preventDefault()
  if (!composerCtx) return
  const note = $('#composerNote').value.trim()
  const { kind, deltoid } = composerCtx
  closeComposer()
  closeDetail()
  await queueIntent({ kind, deltoid, note: note || undefined })
})
$('#composerCancel').addEventListener('click', closeComposer)
$('#composerScrim').addEventListener('click', closeComposer)

/* ========================================================================
   connector threads — colored lines following ghosts across lanes
   ======================================================================== */
const threadsSvg = $('#threads')
function drawThreads() {
  threadsSvg.innerHTML = ''
  // draw a thread for each optimistic ghost: from its source card position
  // to its ghost position, in the deltoid's hue — one ID, one journey.
  for (const [deltoid, g] of state.ghosts) {
    const cards = $$(`.card[data-deltoid="${cssEscape(deltoid)}"]`)
    if (cards.length < 1) continue
    const id = deltoid.replace(SIGIL, '')
    const { accent } = deltoidColor(id)
    // if there are two (ghost + maybe original), connect; otherwise connect to lane edge
    const ghostCard = cards.find((c) => c.classList.contains('ghost'))
    if (!ghostCard) continue
    const r = ghostCard.getBoundingClientRect()
    const wrap = $('#boardWrap').getBoundingClientRect()
    const y = r.top - wrap.top + r.height / 2
    const x = r.left - wrap.left
    // a short arc from the left edge of the lane into the ghost
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    path.setAttribute('d', `M ${x - 26} ${y} C ${x - 12} ${y}, ${x - 10} ${y}, ${x} ${y}`)
    path.setAttribute('stroke', accent)
    path.setAttribute('stroke-width', '2')
    path.setAttribute('fill', 'none')
    path.setAttribute('stroke-dasharray', '3 4')
    path.setAttribute('opacity', '.7')
    threadsSvg.appendChild(path)
  }
  if (state.needsMode) drawNeedsEdges()
}

/* ========================================================================
   needs graph overlay
   ======================================================================== */
function drawNeedsEdges() {
  const wrap = $('#boardWrap').getBoundingClientRect()
  for (const item of state.items) {
    if (!item.needs || !item.needs.length) continue
    const targetCard = $(`.card[data-id="${item.id}"]`)
    if (!targetCard) continue
    const tr = targetCard.getBoundingClientRect()
    const tx = tr.left - wrap.left + 8
    const ty = tr.top - wrap.top + 22
    for (const needId of item.needs) {
      const src = $(`.card[data-id="${needId}"]`)
      if (!src) continue
      const sr = src.getBoundingClientRect()
      const sx = sr.right - wrap.left - 8
      const sy = sr.top - wrap.top + 22
      const open = item.openNeeds.includes(needId)
      const { accent } = deltoidColor(needId)
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      const midx = (sx + tx) / 2
      path.setAttribute('d', `M ${sx} ${sy} C ${midx} ${sy}, ${midx} ${ty}, ${tx} ${ty}`)
      path.setAttribute('stroke', open ? '#8a6d3b' : accent)
      path.setAttribute('stroke-width', '2')
      path.setAttribute('fill', 'none')
      path.setAttribute('opacity', open ? '.8' : '.45')
      path.dataset.from = needId
      path.dataset.to = item.id
      if (open) path.setAttribute('stroke-dasharray', '6 4')
      threadsSvg.appendChild(path)
      // arrowhead
      const head = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      head.setAttribute('cx', tx); head.setAttribute('cy', ty); head.setAttribute('r', '3.5')
      head.setAttribute('fill', open ? '#8a6d3b' : accent)
      head.dataset.from = needId
      threadsSvg.appendChild(head)
    }
  }
}

function toggleNeeds() {
  state.needsMode = !state.needsMode
  $('#needsToggle').setAttribute('aria-pressed', String(state.needsMode))
  drawThreads()
  // wire prerequisite hover focus on cards while in needs mode
  if (state.needsMode) {
    $$('.card').forEach((c) => {
      c.addEventListener('mouseenter', focusOnHover)
      c.addEventListener('mouseleave', clearFocus)
    })
  } else {
    clearFocus()
    $$('.card').forEach((c) => {
      c.removeEventListener('mouseenter', focusOnHover)
      c.removeEventListener('mouseleave', clearFocus)
    })
  }
}

function focusOnHover(e) {
  if (!state.needsMode) return
  const card = e.currentTarget
  const id = card.dataset.id
  boardEl.classList.add('focus-mode')
  card.classList.add('focus-on')
  // dependents downstream
  const item = state.items.find((i) => i.id === id)
  if (item) {
    for (const dep of item.dependents) {
      const c = $(`.card[data-id="${dep}"]`)
      if (c) c.classList.add('focus-down', 'focus-on')
    }
    for (const need of (item.needs || [])) {
      const c = $(`.card[data-id="${need}"]`)
      if (c) c.classList.add('focus-up', 'focus-on')
    }
  }
}
function clearFocus() {
  boardEl.classList.remove('focus-mode')
  $$('.focus-on,.focus-up,.focus-down').forEach((c) => c.classList.remove('focus-on', 'focus-up', 'focus-down'))
}

/* ========================================================================
   timeline scrubber — replay the journal's real history
   ======================================================================== */
function setupScrubber() {
  const days = state.snapshot.stats?.byDay || []
  if (!state.journal.length) return
  const slider = $('#timeSlider')
  const readout = $('#scrubReadout')
  const reset = $('#scrubReset')
  $('#scrubber').hidden = false

  const times = state.journal.map((e) => e.completedMs).filter(Boolean).sort((a, b) => a - b)
  const minMs = times[0]
  const maxMs = times[times.length - 1]
  slider.min = '0'; slider.max = '100'; slider.value = '100'

  const apply = (pct) => {
    if (pct >= 100) {
      state.timeMax = null
      readout.textContent = `all history`
      reset.classList.add('dim')
    } else {
      const span = maxMs - minMs
      state.timeMax = minMs + (span * pct / 100)
      const shown = state.journal.filter((e) => (e.completedMs ?? 0) <= state.timeMax).length
      readout.textContent = `${shown}/${state.journal.length} shipped · ${formatDay(new Date(state.timeMax).toISOString().slice(0, 10))}`
      reset.classList.remove('dim')
    }
    render()
  }
  slider.addEventListener('input', () => apply(Number(slider.value)))
  reset.addEventListener('click', () => { slider.value = '100'; apply(100) })
  reset.classList.add('dim')
}

/* ========================================================================
   small helpers
   ======================================================================== */
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}
function cssEscape(s) { return s.replace(/[^\w-]/g, (c) => '\\' + c) }
function truncate(s, n) { return s.length > n ? s.slice(0, n - 1) + '…' : s }

function formatStamp(ts) {
  if (!ts) return ''
  // "2026-05-31 07:08:13 +00:00" -> "May 31 · 07:08"
  const m = ts.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/)
  if (!m) return ts
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2] - 1]
  return `${month} ${+m[3]} · ${m[4]}:${m[5]}`
}
function formatDay(day) {
  if (!day) return ''
  const [y, mo, d] = day.split('-')
  const month = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+mo - 1]
  return `${month} ${+d}, ${y}`
}
function formatAgo(iso) {
  if (!iso) return ''
  const then = Date.parse(iso)
  if (Number.isNaN(then)) return iso
  const sec = Math.round((Date.now() - then) / 1000)
  if (sec < 60) return `${sec}s ago`
  if (sec < 3600) return `${Math.round(sec / 60)}m ago`
  if (sec < 86400) return `${Math.round(sec / 3600)}h ago`
  return `${Math.round(sec / 86400)}d ago`
}

function intentFingerprint() {
  return state.intents.map((i) => `${i.seq}:${i.resolved ? 1 : 0}`).join(',')
}

function flashNeed(item, need) {
  toast({ kind: 'blocked', deltoid: item.deltoid,
    title: `${item.deltoid} is blocked`,
    sub: `${SIGIL}${need} must complete first. Open it via the Needs graph to ask for a re-check.` })
  // open detail of the prerequisite so the user can act on it
  const needDeltoid = SIGIL + need
  if (state.items.find((i) => i.deltoid === needDeltoid)) {
    setTimeout(() => openDetail(needDeltoid), 250)
  }
}

/* ========================================================================
   wiring + boot
   ======================================================================== */
$('#trayToggle').addEventListener('click', () => {
  trayEl.getAttribute('aria-hidden') === 'false' ? closeTray() : openTray()
})
$('#trayClose').addEventListener('click', closeTray)
$('#trayScrim').addEventListener('click', closeTray)
$('#trayRefresh').addEventListener('click', async () => {
  await refreshIntents(); render(); renderTray(); updateTrayCount()
  toast({ kind: 'plan', title: 'Re-read the agent queue', sub: 'live from GET /api/intents' })
})
$('#drawerScrim').addEventListener('click', closeDetail)
$('#needsToggle').addEventListener('click', toggleNeeds)

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (!composer.hidden) closeComposer()
    else if (drawer.getAttribute('aria-hidden') === 'false') closeDetail()
    else if (trayEl.getAttribute('aria-hidden') === 'false') closeTray()
  }
})

window.addEventListener('resize', () => requestAnimationFrame(drawThreads))

async function boot() {
  try {
    await loadSnapshot()
    render()
    setupScrubber()
    updateTrayCount()
    // gentle live refresh of the intent queue so "queued → enacted" shows up.
    // only re-render the board when the queue actually changed, so we never
    // disturb scroll position or an in-flight drag for no reason.
    let lastFingerprint = intentFingerprint()
    setInterval(async () => {
      await refreshIntents()
      if (trayEl.getAttribute('aria-hidden') === 'false') renderTray()
      updateTrayCount()
      const fp = intentFingerprint()
      if (fp !== lastFingerprint) { lastFingerprint = fp; render() }
    }, 5000)
  } catch (err) {
    document.body.removeAttribute('data-loading')
    boardEl.innerHTML = `<div class="lane-empty" style="grid-column:1/-1;margin:auto">
      <div class="emoji-free">!</div>
      <h4>Could not reach the base server</h4>
      <p>${esc(String(err.message || err))}<br>Is <code>server.ts</code> running?</p></div>`
  }
}
boot()
