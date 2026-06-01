// =============================================================================
// Critical Path — the delto triage cockpit
// Vanilla ES module. Fetches the live same-origin API, computes nothing it can
// read from the server (state/eligibility/dependents are authoritative), and
// records every triage decision as an *intent* POSTed to /api/intents — it
// NEVER edits BACKLOG.md.
// =============================================================================

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const el = (tag, cls, html) => {
  const n = document.createElement(tag)
  if (cls) n.className = cls
  if (html != null) n.innerHTML = html
  return n
}
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  )

// A reusable sigil glyph (filled triangle) as inline markup.
const SIGIL = '<span class="sigil"></span>'
// A sigil tinted to an arbitrary color/size (avoids brittle string surgery).
const sigil = (color, size = '0.74em') =>
  `<span class="sigil" style="color:${color};width:${size};height:${size}"></span>`

// ---- App state --------------------------------------------------------------
const state = {
  items: [],          // BacklogView[]
  byId: new Map(),     // id -> item
  initiatives: [],     // ordered initiative names
  intents: [],         // RecordedIntent[]
  stats: null,         // journal stats
  journalTotal: 0,
  focusId: null,       // currently focused deltoid id
  pollTimer: null,
}

// =============================================================================
// Data loading
// =============================================================================
async function api(path, opts) {
  const res = await fetch(path, { headers: { accept: 'application/json' }, ...opts })
  if (!res.ok) throw new Error(`${path} → ${res.status}`)
  return res.json()
}

async function loadSnapshot() {
  const snap = await api('/api/snapshot')
  hydrate(snap)
}

function hydrate(snap) {
  const b = snap.backlog
  state.items = b.items
  state.initiatives = b.initiatives
  state.byId = new Map(b.items.map((it) => [it.id, it]))
  state.intents = snap.intents ?? []
  state.stats = snap.stats ?? null
  state.journalTotal = snap.stats?.total ?? (snap.journal?.length ?? 0)
}

// Re-fetch just the backlog (recompute states + leverage from the live graph).
async function refreshBacklog() {
  const b = await api('/api/backlog')
  state.items = b.items
  state.initiatives = b.initiatives
  state.byId = new Map(b.items.map((it) => [it.id, it]))
}

async function refreshIntents() {
  const { intents } = await api('/api/intents')
  state.intents = intents ?? []
}

// =============================================================================
// Derived helpers
// =============================================================================
const stateOf = (it) => (it.claimed ? 'claimed' : it.blocked ? 'blocked' : 'eligible')
const STATE_LABEL = { eligible: 'Eligible', blocked: 'Blocked', claimed: 'Claimed' }

function counts() {
  let eligible = 0, blocked = 0, claimed = 0
  for (const it of state.items) {
    const s = stateOf(it)
    if (s === 'eligible') eligible++
    else if (s === 'blocked') blocked++
    else claimed++
  }
  return { eligible, blocked, claimed, total: state.items.length }
}

// pending (unresolved) intents that target a given deltoid id
function intentsFor(id) {
  return state.intents.filter((i) => i.deltoid === `∆${id}` || i.deltoid === id)
}

// Transitive upstream (open prereqs) + downstream (dependents) for focus.
function chain(rootId) {
  const up = new Set(), down = new Set()
  const walkUp = (id) => {
    const it = state.byId.get(id)
    if (!it) return
    for (const n of it.openNeeds ?? []) {
      if (!up.has(n)) { up.add(n); walkUp(n) }
    }
  }
  const walkDown = (id) => {
    const it = state.byId.get(id)
    if (!it) return
    for (const d of it.dependents ?? []) {
      if (!down.has(d)) { down.add(d); walkDown(d) }
    }
  }
  walkUp(rootId)
  walkDown(rootId)
  // critical-path length: longest open-needs chain feeding the root
  const depth = (id, seen = new Set()) => {
    const it = state.byId.get(id)
    if (!it || !it.openNeeds?.length) return 0
    let max = 0
    for (const n of it.openNeeds) {
      if (seen.has(n)) continue
      max = Math.max(max, 1 + depth(n, new Set([...seen, n])))
    }
    return max
  }
  return { up, down, criticalLen: depth(rootId) }
}

// =============================================================================
// Render: top readout + left rail
// =============================================================================
function renderReadout() {
  const c = counts()
  $('#rEligible').textContent = c.eligible
  $('#rBlocked').textContent = c.blocked
  $('#rClaimed').textContent = c.claimed
  $('#rDone').textContent = state.journalTotal
}

function renderTally() {
  const c = counts()
  const tally = $('#tally')
  tally.innerHTML = ''
  const cell = (n, label, tone, dot) => {
    const d = el('div', 'tally__cell')
    if (tone) d.dataset.tone = tone
    d.innerHTML =
      `<div class="tally__big">${n}</div>` +
      `<div class="tally__lbl">${dot ? `<i class="dot dot--${dot}"></i>` : ''}${label}</div>`
    return d
  }
  tally.append(
    cell(c.eligible, 'Eligible', 'ok', 'ok'),
    cell(c.blocked, 'Blocked', 'blocked', 'blocked'),
    cell(c.claimed, 'Claimed', 'claimed', 'claimed'),
  )
  const full = cell(c.total, 'tracked items', null)
  full.classList.add('tally__cell--full')
  tally.append(full)

  const foot = $('#tallyFoot')
  if (c.claimed === 0) {
    foot.innerHTML = `Nothing claimed — the whole board is up for grabs. State is computed live from the <code>needs:</code> graph.`
  } else {
    foot.innerHTML = `Computed live from the <code>needs:</code> graph.`
  }
}

function renderLeverage() {
  const ol = $('#leverage')
  ol.innerHTML = ''
  const ranked = [...state.items]
    .map((it) => ({ it, lev: (it.dependents ?? []).length }))
    .sort((a, b) => b.lev - a.lev)
  const top = ranked.slice(0, 6)
  const max = Math.max(1, ...top.map((r) => r.lev))

  for (let i = 0; i < top.length; i++) {
    const { it, lev } = top[i]
    const row = el('li', 'lev-row')
    row.dataset.id = it.id
    row.setAttribute('aria-current', String(state.focusId === it.id))
    const pct = lev > 0 ? Math.max(14, (lev / max) * 100) : 0
    row.innerHTML =
      `<span class="lev-rank">${i + 1}</span>` +
      `<div class="lev-body">` +
        deltoidChip(it.id) +
        `<div class="lev-bar-wrap"><div class="lev-bar ${lev === 0 ? 'lev-bar--zero' : ''}" style="width:0%"></div></div>` +
      `</div>` +
      `<span class="lev-count ${lev === 0 ? 'lev-count--zero' : ''}">${lev ? `unblocks ${lev}` : '—'}</span>`
    row.addEventListener('click', (e) => {
      if (e.target.closest('.deltoid')) return // copy handler owns the chip
      toggleFocus(it.id)
    })
    ol.append(row)
    // animate bars in
    requestAnimationFrame(() => { row.querySelector('.lev-bar').style.width = pct + '%' })
  }

  const leaders = ranked.filter((r) => r.lev > 0)
  const foot = $('#leverageFoot')
  if (leaders.length === 0) {
    foot.textContent = 'No item currently unblocks another — the graph is flat.'
  } else {
    const names = leaders.map((r) => `∆${r.it.id}`).join(' · ')
    foot.innerHTML = `Ship ${esc(names)} to free up the most downstream work. Click a row to trace its chain.`
  }
}

function renderSpark() {
  const spark = $('#spark')
  spark.innerHTML = ''
  const days = state.stats?.byDay ?? []
  if (!days.length) {
    spark.innerHTML = `<span style="font-family:var(--font-mono);font-size:.68rem;color:var(--ink-3)">no completions yet</span>`
    $('#velocityFoot').textContent = ''
    return
  }
  const max = Math.max(...days.map((d) => d.count))
  for (const d of days) {
    const bar = el('div', 'spark__bar')
    bar.dataset.tip = `${d.date} · ${d.count}`
    if (d.count === 0) bar.dataset.zero = 'true'
    spark.append(bar)
    requestAnimationFrame(() => { bar.style.height = Math.max(8, (d.count / max) * 100) + '%' })
  }
  const busiest = state.stats.busiestDay
  $('#velocityFoot').innerHTML =
    `${state.journalTotal} items shipped` +
    (busiest ? ` · busiest day <code>${esc(busiest.date)}</code> (${busiest.count})` : '')
}

// =============================================================================
// Render: a deltoid chip — the through-line, copy-on-click
// =============================================================================
function deltoidChip(id, extraClass = '') {
  return `<button type="button" class="deltoid ${extraClass}" data-deltoid="${esc(id)}" title="Copy ∆${esc(id)}">${SIGIL}<span>${esc(id)}</span></button>`
}

function wireDeltoidCopy(root = document) {
  $$('.deltoid', root).forEach((chip) => {
    if (chip.dataset.wired) return
    chip.dataset.wired = '1'
    chip.addEventListener('click', async (e) => {
      e.stopPropagation()
      const id = chip.dataset.deltoid
      try { await navigator.clipboard.writeText(`∆${id}`) } catch { /* clipboard may be blocked */ }
      chip.classList.add('deltoid--copied')
      setTimeout(() => chip.classList.remove('deltoid--copied'), 1100)
    })
  })
}

// =============================================================================
// Render: the center priority stack (initiative bands → epic lanes → cards)
// =============================================================================

// Epics we know exist per initiative even if they currently have zero items —
// so a lane that empties out renders honestly as "retired". Derived from the
// live data plus the canonical First-npm-Publish epics.
const KNOWN_EPICS = {
  'First npm Publish': ['Skill Guidance', 'Packaging & Release'],
}

function renderStack() {
  const stack = $('#stack')
  stack.innerHTML = ''

  // group items: initiative -> epic(or '∅') -> items[], preserving file order
  const byInit = new Map()
  for (const init of state.initiatives) byInit.set(init, new Map())
  for (const it of state.items) {
    const init = it.initiative ?? '—'
    if (!byInit.has(init)) byInit.set(init, new Map())
    const epics = byInit.get(init)
    const epic = it.epic ?? '∅'
    if (!epics.has(epic)) epics.set(epic, [])
    epics.get(epic).push(it)
  }

  let bandIdx = 0
  for (const [init, epics] of byInit) {
    bandIdx++
    const band = el('section', 'band')
    band.dataset.init = init
    const n = [...epics.values()].reduce((s, a) => s + a.length, 0)
    band.append(
      (() => {
        const h = el('div', 'band__head')
        h.innerHTML =
          `<span class="band__idx">INIT ${String(bandIdx).padStart(2, '0')}</span>` +
          `<span class="band__name">${esc(init)}</span>` +
          `<span class="band__meta">${n} item${n === 1 ? '' : 's'}</span>`
        return h
      })()
    )

    // ordered epic keys: known epics first (so retired ones still show), then any extras
    const seen = new Set()
    const orderedEpics = []
    for (const known of KNOWN_EPICS[init] ?? []) { orderedEpics.push(known); seen.add(known) }
    for (const k of epics.keys()) if (!seen.has(k)) orderedEpics.push(k)

    for (const epicName of orderedEpics) {
      const items = epics.get(epicName) ?? []
      const lane = el('div', 'lane')
      const labeled = epicName !== '∅'
      if (labeled) {
        const head = el('div', 'lane__head')
        head.innerHTML =
          `<span class="lane__tick"></span>` +
          `<span class="lane__name">${esc(epicName)}</span>` +
          `<span class="lane__count">${items.length}</span>`
        lane.append(head)
      }
      const cards = el('div', 'lane__cards')
      if (items.length === 0) {
        lane.classList.add('lane--retired')
        cards.append(el('div', 'lane__retired', `Retired — every item under <code>${esc(epicName)}</code> has shipped.`))
      } else {
        for (const it of items) cards.append(renderCard(it))
      }
      lane.append(cards)
      band.append(lane)
    }
    stack.append(band)
  }

  wireDeltoidCopy(stack)
  applyFocusDimming()
}

function renderCard(it) {
  const s = stateOf(it)
  const card = el('article', 'card')
  card.dataset.id = it.id
  card.dataset.state = s
  card.tabIndex = 0

  const lev = (it.dependents ?? []).length

  // top row
  const top = el('div', 'card__top')
  top.innerHTML = deltoidChip(it.id)
  if (lev > 0) {
    top.append(el('span', 'lev-badge', `${sigil('var(--amber)', '0.55em')}unblocks ${lev}`))
  }
  const pill = el('span', `card__state state--${s}`, STATE_LABEL[s])
  top.append(pill)
  card.append(top)

  // summary + detail
  card.append(el('p', 'card__summary', esc(it.summary || it.text)))
  if (it.text && it.text !== it.summary) {
    const rest = it.text.startsWith(it.summary) ? it.text.slice(it.summary.length).replace(/^[\s—–.;-]+/, '') : it.text
    if (rest) card.append(el('p', 'card__detail', esc(rest)))
  }

  // blocked → open-needs chip row
  if (s === 'blocked' && it.openNeeds?.length) {
    const row = el('div', 'needs-row')
    row.append(el('span', 'needs-row__lbl', 'needs'))
    for (const nId of it.openNeeds) {
      const chip = el('button', 'needs-chip')
      chip.type = 'button'
      chip.dataset.needs = nId
      chip.innerHTML = `${SIGIL}<span>${esc(nId)}</span>`
      chip.addEventListener('click', (e) => { e.stopPropagation(); jumpToCard(nId) })
      row.append(chip)
    }
    card.append(row)
  }

  // claimed ribbon
  if (s === 'claimed') {
    card.append(el('div', 'ribbon', `${sigil('var(--violet)', '0.7em')} claimed`))
  }

  // queued-intent stamps
  const stamps = el('div', 'card__stamps')
  for (const intent of intentsFor(it.id)) {
    stamps.append(stampFor(intent))
  }
  if (stamps.children.length) card.append(stamps)

  // action bar
  const actions = el('div', 'card__actions')
  const mkAct = (label, kind, cls = '') => {
    const b = el('button', `act ${cls}`, label)
    b.type = 'button'
    b.addEventListener('click', (e) => { e.stopPropagation(); openComposer(kind, it) })
    return b
  }
  const focusBtn = el('button', 'act act--focus', 'Trace needs')
  focusBtn.type = 'button'
  focusBtn.setAttribute('aria-pressed', String(state.focusId === it.id))
  focusBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleFocus(it.id) })
  actions.append(
    focusBtn,
    mkAct("I'll take this", 'claim-and-plan', 'act--claim'),
    mkAct('Promote', 'promote'),
    mkAct('Defer', 'defer'),
    mkAct('Split', 'split'),
  )
  card.append(actions)

  return card
}

function stampFor(intent) {
  const stamp = el('span', 'stamp')
  stamp.dataset.resolved = String(!!intent.resolved)
  stamp.dataset.seq = intent.seq
  const label = intent.resolved ? 'done' : 'queued'
  stamp.innerHTML = `${esc(intent.kind)} · <strong>${label}</strong>`
  return stamp
}

// =============================================================================
// Right rail — intent queue / agent inbox
// =============================================================================
function renderQueue() {
  const queue = $('#queue')
  queue.innerHTML = ''
  const pending = state.intents.filter((i) => !i.resolved).length
  $('#queueCount').textContent = `${pending} queued`

  if (!state.intents.length) {
    const empty = el('div', 'q-empty')
    empty.innerHTML =
      `<span class="sigil"></span>` +
      `<p class="q-empty__title">Inbox clear</p>` +
      `<p class="q-empty__sub">Triage actions land here as requests for the agent. Nothing has been queued yet — the agent has no pending edits to drain.</p>`
    queue.append(empty)
    return
  }

  // newest first
  for (const intent of [...state.intents].reverse()) {
    queue.append(renderQueueCard(intent))
  }
  wireDeltoidCopy(queue)
}

function renderQueueCard(intent) {
  const c = el('article', 'q-card')
  c.dataset.resolved = String(!!intent.resolved)
  c.dataset.seq = intent.seq

  const top = el('div', 'q-top')
  top.innerHTML =
    `<span class="q-kind">${esc(intent.kind)}</span>` +
    `<span class="q-status">${intent.resolved
      ? '<i class="pip"></i>drained by agent'
      : '<i class="pip"></i>awaiting agent'}</span>` +
    `<span class="q-seq">#${intent.seq}</span>`
  c.append(top)

  if (intent.deltoid) {
    const id = String(intent.deltoid).replace(/^∆/, '')
    c.append(el('div', 'q-deltoid', deltoidChip(id)))
  } else if (intent.epic || intent.initiative) {
    c.append(el('div', 'q-deltoid',
      `<span style="font-family:var(--font-mono);font-size:.66rem;color:var(--ink-2)">under ${esc(intent.initiative ?? '')}${intent.epic ? ' › ' + esc(intent.epic) : ''}</span>`))
  }

  if (intent.note) c.append(el('p', 'q-note', esc(intent.note)))

  const foot = el('div', 'q-foot')
  foot.append(el('span', 'q-time', relTime(intent.ts)))
  if (!intent.resolved) {
    const dismiss = el('button', 'q-resolve', 'mark handled')
    dismiss.type = 'button'
    dismiss.addEventListener('click', () => resolveIntent(intent.seq))
    foot.append(dismiss)
  }
  c.append(foot)
  return c
}

function relTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return ''
  const diff = Math.round((Date.now() - then) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString()
}

// =============================================================================
// Dependency focus — draw the needs: graph in-place over the priority list
// =============================================================================
function toggleFocus(id) {
  state.focusId = state.focusId === id ? null : id
  applyFocusDimming()
  drawWires()
  // reflect focus in leaderboard + action buttons
  $$('.lev-row').forEach((r) => r.setAttribute('aria-current', String(r.dataset.id === state.focusId)))
  $$('.act--focus').forEach((b) => {
    const cardId = b.closest('.card')?.dataset.id
    b.setAttribute('aria-pressed', String(cardId === state.focusId))
  })
  const banner = $('#focusBanner')
  if (state.focusId) {
    const it = state.byId.get(state.focusId)
    const { up, down, criticalLen } = chain(state.focusId)
    const parts = []
    if (up.size) parts.push(`${up.size} open prerequisite${up.size === 1 ? '' : 's'} upstream`)
    if (down.size) parts.push(`unblocks ${down.size} downstream`)
    if (criticalLen) parts.push(`critical path ${criticalLen} deep`)
    banner.querySelector('.focus-banner__txt').innerHTML =
      `Tracing <strong style="color:var(--cyan)">∆${esc(state.focusId)}</strong> — ${parts.join(' · ') || 'no edges, this item stands alone'}`
    banner.hidden = false
    // scroll the focused card into view
    $(`.card[data-id="${state.focusId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  } else {
    banner.hidden = true
  }
}

function applyFocusDimming() {
  const stack = $('#stack')
  $$('.card', stack).forEach((c) => {
    c.classList.remove('card--lit', 'card--lit-root', 'card--lit-up', 'card--lit-down')
  })
  if (!state.focusId) { stack.dataset.focus = 'false'; return }
  stack.dataset.focus = 'true'
  const { up, down } = chain(state.focusId)
  const root = $(`.card[data-id="${state.focusId}"]`, stack)
  if (root) root.classList.add('card--lit', 'card--lit-root')
  for (const id of up) {
    const c = $(`.card[data-id="${id}"]`, stack)
    if (c) c.classList.add('card--lit', 'card--lit-up')
  }
  for (const id of down) {
    const c = $(`.card[data-id="${id}"]`, stack)
    if (c) c.classList.add('card--lit', 'card--lit-down')
  }
}

// Thread thin glowing connectors between the actual cards.
function drawWires() {
  const svg = $('#wires')
  svg.innerHTML = ''
  if (!state.focusId) return
  const col = $('.stack-col')
  const colRect = col.getBoundingClientRect()
  // size svg to the scrollable content
  svg.setAttribute('width', col.clientWidth)
  svg.setAttribute('height', col.scrollHeight)
  svg.style.height = col.scrollHeight + 'px'

  const center = (id) => {
    const c = $(`.card[data-id="${id}"]`)
    if (!c) return null
    const r = c.getBoundingClientRect()
    return {
      x: r.left - colRect.left + col.scrollLeft,
      yTop: r.top - colRect.top + col.scrollTop,
      yMid: r.top - colRect.top + col.scrollTop + r.height / 2,
      w: r.width,
    }
  }

  const root = state.byId.get(state.focusId)
  if (!root) return
  const rootPt = center(state.focusId)
  if (!rootPt) return

  // upstream: root → each open need (red)
  for (const nId of root.openNeeds ?? []) {
    const p = center(nId)
    if (p) wire(svg, rootPt, p, 'var(--red)', `needs ∆${nId}`)
  }
  // downstream: root → each dependent (cyan)
  for (const dId of root.dependents ?? []) {
    const p = center(dId)
    if (p) wire(svg, rootPt, p, 'var(--cyan)', `unblocks ∆${dId}`)
  }
}

function wire(svg, a, b, color, label) {
  // route along the left gutter of the stack: bezier hugging the left edge
  const ax = a.x - 6, ay = a.yMid
  const bx = b.x - 6, by = b.yMid
  const gut = Math.min(ax, bx) - 18
  const NS = 'http://www.w3.org/2000/svg'
  const path = document.createElementNS(NS, 'path')
  const d = `M ${ax} ${ay} C ${gut} ${ay}, ${gut} ${by}, ${bx} ${by}`
  path.setAttribute('d', d)
  path.setAttribute('fill', 'none')
  path.setAttribute('stroke', color)
  path.setAttribute('stroke-width', '1.6')
  path.setAttribute('stroke-linecap', 'round')
  path.setAttribute('opacity', '0.9')
  path.style.filter = `drop-shadow(0 0 5px ${color})`
  // dash-draw animation
  const len = Math.hypot(bx - ax, by - ay) + Math.abs(by - ay)
  path.style.strokeDasharray = len
  path.style.strokeDashoffset = len
  path.style.transition = 'stroke-dashoffset .55s ease'
  svg.append(path)
  requestAnimationFrame(() => { path.style.strokeDashoffset = '0' })

  // endpoint node on the prereq/dependent
  const dot = document.createElementNS(NS, 'circle')
  dot.setAttribute('cx', bx); dot.setAttribute('cy', by); dot.setAttribute('r', '3.5')
  dot.setAttribute('fill', color)
  dot.style.filter = `drop-shadow(0 0 5px ${color})`
  svg.append(dot)
}

function clearFocus() {
  if (!state.focusId) return
  state.focusId = null
  applyFocusDimming()
  drawWires()
  $('#focusBanner').hidden = true
  $$('.lev-row').forEach((r) => r.setAttribute('aria-current', 'false'))
  $$('.act--focus').forEach((b) => b.setAttribute('aria-pressed', 'false'))
}

// scroll to + pulse a prerequisite card when its needs-chip is clicked
function jumpToCard(id) {
  const card = $(`.card[data-id="${id}"]`)
  if (!card) { toast(`∆${id} isn't on the board (already shipped?)`, 'err'); return }
  card.scrollIntoView({ behavior: 'smooth', block: 'center' })
  card.classList.remove('card--pulse')
  void card.offsetWidth // reflow to restart animation
  card.classList.add('card--pulse')
  setTimeout(() => card.classList.remove('card--pulse'), 1900)
}

// =============================================================================
// Intent composer
// =============================================================================
const KIND_META = {
  promote: {
    kind: 'promote', title: 'Promote this item',
    label: 'Why does this matter now?',
    placeholder: 'e.g. blocks the release; a customer is waiting on it…',
  },
  defer: {
    kind: 'defer', title: 'Defer this item',
    label: 'Where should it go, and why park it?',
    placeholder: 'e.g. push under Someday/Maybe — not needed for v1…',
  },
  'claim-and-plan': {
    kind: 'claim-and-plan', title: "I'll take this",
    label: 'Frame the claim + ask the agent to write its plan',
    placeholder: "I'm taking this. Plan it out: scope, the seams, the tests first…",
  },
  split: {
    kind: 'split', title: 'Split — too big',
    label: 'Sketch the seams for the agent',
    placeholder: 'This is two items: (1) … (2) … keep both under the same epic.',
  },
  'new-item': {
    kind: 'new-item', title: 'Add an item',
    label: 'The proposed item text (the agent mints the deltoid)',
    placeholder: 'Add `delto …` — what it does and why. Needs: ∆xxx if it has a prereq.',
  },
}

let composerCtx = null

function openComposer(kind, item) {
  const meta = KIND_META[kind]
  composerCtx = { kind, item: item ?? null, anchor: item ? $(`.card[data-id="${item.id}"]`) : null }

  $('#composerKind').textContent = kind
  $('#composerTitle').textContent = meta.title
  $('#noteLabel').textContent = meta.label
  const note = $('#composerNote')
  note.value = ''
  note.placeholder = meta.placeholder

  const target = $('#composerTarget')
  const epicField = $('#targetEpicField')

  if (kind === 'new-item') {
    // no deltoid yet — choose where it lands
    target.innerHTML =
      `<div class="composer__target-top">${sigil('var(--ink-3)')}` +
      `<span class="composer__target-meta">no deltoid yet — the agent mints one</span></div>` +
      `<div class="composer__target-sum">New backlog item</div>`
    // populate initiative › epic options
    const sel = $('#targetEpic')
    sel.innerHTML = ''
    for (const init of state.initiatives) {
      const epics = new Set(state.items.filter((i) => i.initiative === init).map((i) => i.epic).filter(Boolean))
      for (const known of KNOWN_EPICS[init] ?? []) epics.add(known)
      if (epics.size === 0) {
        const o = el('option'); o.value = JSON.stringify({ initiative: init, epic: null }); o.textContent = init; sel.append(o)
      } else {
        for (const ep of epics) {
          const o = el('option'); o.value = JSON.stringify({ initiative: init, epic: ep }); o.textContent = `${init} › ${ep}`; sel.append(o)
        }
      }
    }
    epicField.hidden = false
  } else {
    epicField.hidden = true
    target.innerHTML =
      `<div class="composer__target-top">${deltoidChip(item.id)}` +
      `<span class="card__state state--${stateOf(item)}" style="margin-left:auto">${STATE_LABEL[stateOf(item)]}</span></div>` +
      `<div class="composer__target-sum">${esc(item.summary || item.text)}</div>` +
      `<div class="composer__target-meta">${esc(item.initiative ?? '')}${item.epic ? ' › ' + esc(item.epic) : ''} · <span class="composer__locked">${sigil('var(--ink-3)', '0.55em')}deltoid locked</span></div>`
    wireDeltoidCopy(target)
  }

  $('#scrim').hidden = false
  $('#composer').hidden = false
  setTimeout(() => note.focus(), 60)
}

function closeComposer() {
  $('#composer').hidden = true
  $('#scrim').hidden = true
  composerCtx = null
}

async function submitComposer(e) {
  e.preventDefault()
  if (!composerCtx) return
  const { kind, item, anchor } = composerCtx
  const note = $('#composerNote').value.trim()

  const body = { kind, note: note || undefined }
  if (item) body.deltoid = `∆${item.id}`
  if (kind === 'new-item') {
    try {
      const parsed = JSON.parse($('#targetEpic').value)
      body.initiative = parsed.initiative
      if (parsed.epic) body.epic = parsed.epic
    } catch { /* keep going without target */ }
  }

  const submitBtn = $('#composerSubmit')
  submitBtn.disabled = true
  submitBtn.textContent = 'Queuing…'

  // fly an optimistic chip from the composer toward the right-rail queue
  if (anchor) flyStamp(anchor)

  try {
    const recorded = await api('/api/intents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    closeComposer()
    toast(`Queued for agent — <strong>${esc(recorded.kind)}</strong> #${recorded.seq}`, 'ok')
    // re-read the live queue so the right rail reflects the server truth
    await refreshIntents()
    renderQueue()
    // restamp the affected card (new stamp animates in)
    if (item) restampCard(item.id, recorded.seq)
  } catch (err) {
    toast(`Couldn't queue intent — ${esc(err.message)}`, 'err')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = 'Queue for agent →'
  }
}

function restampCard(id, newSeq) {
  const card = $(`.card[data-id="${id}"]`)
  if (!card) return
  let stamps = card.querySelector('.card__stamps')
  if (!stamps) { stamps = el('div', 'card__stamps'); card.append(stamps) }
  const intent = state.intents.find((i) => i.seq === newSeq)
  if (!intent) return
  const stamp = stampFor(intent)
  stamp.classList.add('stamp--new')
  stamps.append(stamp)
}

// animate a little "queued for agent →" chip from card to the inbox
function flyStamp(anchor) {
  const start = anchor.getBoundingClientRect()
  const inbox = $('.rail--right')?.getBoundingClientRect()
  const flyer = el('div', 'flyer', 'queued for agent →')
  flyer.style.left = start.right - 60 + 'px'
  flyer.style.top = start.top + 8 + 'px'
  document.body.append(flyer)
  const endX = inbox ? inbox.left + 30 : window.innerWidth - 200
  const endY = inbox ? inbox.top + 120 : 120
  flyer.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${endX - (start.right - 60)}px, ${endY - (start.top + 8)}px) scale(0.7)`, opacity: 0 },
    ],
    { duration: 650, easing: 'cubic-bezier(.22,.61,.36,1)' }
  ).onfinish = () => flyer.remove()
}

async function resolveIntent(seq) {
  try {
    await api(`/api/intents/${seq}/resolve`, { method: 'POST' })
    await refreshIntents()
    renderQueue()
    renderAllStamps()
    toast(`Marked #${seq} handled`, 'ok')
  } catch (err) {
    toast(`Couldn't resolve — ${esc(err.message)}`, 'err')
  }
}

// refresh stamps on all cards (e.g. after a resolve flips done)
function renderAllStamps() {
  for (const it of state.items) {
    const card = $(`.card[data-id="${it.id}"]`)
    if (!card) continue
    const existing = card.querySelector('.card__stamps')
    if (existing) existing.remove()
    const ours = intentsFor(it.id)
    if (!ours.length) continue
    const stamps = el('div', 'card__stamps')
    for (const intent of ours) stamps.append(stampFor(intent))
    // insert before actions
    const actions = card.querySelector('.card__actions')
    card.insertBefore(stamps, actions)
  }
}

// =============================================================================
// Toasts
// =============================================================================
function toast(html, kind = 'ok') {
  const t = el('div', `toast toast--${kind}`)
  t.innerHTML = (kind === 'ok' ? SIGIL : '') + `<span>${html}</span>`
  $('#toasts').append(t)
  setTimeout(() => {
    t.classList.add('toast--leaving')
    t.addEventListener('animationend', () => t.remove())
  }, 3600)
}

// =============================================================================
// Boot + wiring
// =============================================================================
function renderAll() {
  renderReadout()
  renderTally()
  renderLeverage()
  renderSpark()
  renderStack()
  renderQueue()
}

function showError(msg) {
  const veil = $('#veil')
  veil.classList.add('veil--error')
  $('#veilMsg').innerHTML =
    `Couldn't reach the live API.<br><code style="color:var(--red)">${esc(msg)}</code><br>` +
    `<button class="btn btn--ghost veil__retry" id="veilRetry" type="button">Retry</button>`
  $('#veilRetry')?.addEventListener('click', boot)
  document.body.dataset.state = 'loading'
}

function wireGlobal() {
  $('#btnAdd').addEventListener('click', () => openComposer('new-item', null))
  $('#btnRefresh').addEventListener('click', async () => {
    const glyph = $('#refreshGlyph').parentElement
    glyph.classList.add('btn--spinning')
    try {
      await Promise.all([refreshBacklog(), refreshIntents()])
      renderAll()
      toast('Re-read the live graph', 'ok')
    } catch (err) {
      toast(`Sync failed — ${esc(err.message)}`, 'err')
    } finally {
      setTimeout(() => glyph.classList.remove('btn--spinning'), 500)
    }
  })
  $('#focusClear').addEventListener('click', clearFocus)
  $('#composerClose').addEventListener('click', closeComposer)
  $('#composerCancel').addEventListener('click', closeComposer)
  $('#composerForm').addEventListener('submit', submitComposer)
  $('#scrim').addEventListener('click', closeComposer)

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#composer').hidden) closeComposer()
      else clearFocus()
    }
  })

  // redraw wires on scroll/resize while focused (rAF-throttled)
  let raf = null
  const reflow = () => {
    if (!state.focusId) return
    if (raf) return
    raf = requestAnimationFrame(() => { raf = null; drawWires() })
  }
  $('.stack-col').addEventListener('scroll', reflow, { passive: true })
  window.addEventListener('resize', reflow)
}

async function boot() {
  document.body.dataset.state = 'loading'
  $('#veil').classList.remove('veil--error')
  $('#veilMsg').textContent = 'Reading the live backlog…'
  try {
    await loadSnapshot()
    renderAll()
    document.body.dataset.state = 'ready'
    // gentle live poll of the intent queue (the agent may drain it elsewhere)
    if (state.pollTimer) clearInterval(state.pollTimer)
    state.pollTimer = setInterval(async () => {
      try {
        const before = JSON.stringify(state.intents)
        await refreshIntents()
        if (JSON.stringify(state.intents) !== before) { renderQueue(); renderAllStamps() }
      } catch { /* poll silently */ }
    }, 5000)
  } catch (err) {
    showError(err.message)
  }
}

wireGlobal()
boot()
