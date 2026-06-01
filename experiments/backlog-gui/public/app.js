// ════════════════════════════════════════════════════════════════════════
// Driftwood — a reading room & harvesting bench for delto's completion journal.
// Fetches the LIVE same-origin /api. Never edits BACKLOG.md — it queues intent.
// ════════════════════════════════════════════════════════════════════════

const $ = (sel, root = document) => root.querySelector(sel)
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
const api = (path, opts) => fetch(path, opts).then((r) => r.json())

const state = {
  entries: [],          // journal entries, newest first
  stats: null,          // journalStats
  backlog: [],          // backlog items (for cross-ref + needs: suggestions)
  intents: [],          // recorded intents
  byId: new Map(),      // id -> journal entry
  backlogById: new Map(),
  current: null,        // open entry
  query: '',
  matches: new Set(),   // ids matching current search
  selectMode: false,
  picked: new Set(),    // ids picked for cross-retro
  harvest: [],          // un-queued harvest cards
  // which retros already spawned which follow-ups (provenance trail, real ∆RP9 chain)
}

// Known provenance: ∆RP9's branch self-review spawned five follow-ups (from the corpus).
const KNOWN_PROVENANCE = {
  RP9: ['rTJ', 'NOp', 'y0B', 'hoW', 'HQN'],
}

// ───────────────────────────── boot ─────────────────────────────
async function boot() {
  try {
    const snap = await api('/api/snapshot')
    state.entries = (snap.journal || []).slice().sort((a, b) => (b.completedMs ?? 0) - (a.completedMs ?? 0))
    state.stats = snap.stats
    state.backlog = snap.backlog?.items || []
    state.intents = snap.intents || []
    for (const e of state.entries) state.byId.set(e.id, e)
    for (const b of state.backlog) state.backlogById.set(b.id, b)
  } catch (err) {
    $('#river-loading').innerHTML = `<p style="color:var(--blocked)">Could not reach the API.<br><small>${String(err)}</small></p>`
    return
  }
  $('#river-loading').remove()
  renderRibbon()
  renderRiver()
  renderIntents()
  wireGlobal()
  // deep-link support: /e/<id>
  const m = /^\/e\/([A-Za-z0-9]{3})$/.exec(location.pathname)
  if (m && state.byId.has(m[1])) openEntry(m[1])
}

// ───────────────────────── velocity ribbon ─────────────────────────
function renderRibbon() {
  const s = state.stats
  const max = Math.max(...s.byDay.map((d) => d.count), 1)
  const sparks = s.byDay
    .map((d) => {
      const busiest = s.busiestDay && d.date === s.busiestDay.date
      const h = Math.round((d.count / max) * 100)
      return `<div class="spark-day${busiest ? ' busiest' : ''}" style="height:${h}%">
        <span class="spark-tip">${d.date} · ${d.count} shipped</span></div>`
    })
    .join('')
  $('#ribbon').innerHTML = `
    <div class="ribbon-head">
      <span class="ribbon-title">The current</span>
      <span class="ribbon-span" id="ribbon-span">${s.firstCompleted} → ${s.lastCompleted}</span>
    </div>
    <div class="sparkline" title="completions per day">${sparks}</div>
    <div class="ribbon-stats" id="ribbon-stats">
      <span><b>${s.total}</b> entries</span>
      <span>busiest <b>${s.busiestDay?.date.slice(5)}</b> ×<b>${s.busiestDay?.count}</b></span>
      <span><b>${s.byWeek.length}</b> ${s.byWeek.length === 1 ? 'week' : 'weeks'}</span>
    </div>`
}

// ─────────────────────────── the river ───────────────────────────
// Vertical time-stream: nodes placed by completedMs (newest at top),
// sized by wordCount. Day gutters from stats. A flowing SVG stroke connects them.
const RIVER = {
  topPad: 36,
  gap: 78,          // base vertical gap between nodes
  glyphMin: 16,
  glyphMax: 42,
}

function wordScale(wc) {
  const all = state.entries.map((e) => e.wordCount)
  const lo = Math.min(...all), hi = Math.max(...all)
  const t = hi === lo ? 0.5 : (wc - lo) / (hi - lo)
  return RIVER.glyphMin + t * (RIVER.glyphMax - RIVER.glyphMin)
}

// Lay out nodes by real time, with day gutters interleaved.
function layout() {
  const nodes = []
  let y = RIVER.topPad
  let lastDay = null
  const gutters = []
  const dayCount = new Map(state.stats.byDay.map((d) => [d.date, d.count]))

  state.entries.forEach((e) => {
    const day = e.completed ? e.completed.slice(0, 10) : '—'
    if (day !== lastDay) {
      if (lastDay !== null) y += 30
      gutters.push({ y: y - 4, date: day, count: dayCount.get(day) ?? null })
      y += 30
      lastDay = day
    }
    const d = wordScale(e.wordCount)
    nodes.push({ e, y, d })
    // bigger entries take more vertical room — velocity you feel
    y += RIVER.gap + (d - RIVER.glyphMin) * 0.7
  })
  return { nodes, gutters, height: y + 60 }
}

function renderRiver() {
  const scroll = $('#river-scroll')
  const list = $('#river-nodes')
  const svg = $('#river-stream')
  const { nodes, gutters, height } = layout()

  list.style.height = `${height}px`
  svg.setAttribute('height', height)
  scroll.style.minHeight = '0'

  // glyph x position: weave the stream gently left↔right so it reads as a current
  const baseX = 40
  const waveX = (i) => baseX + Math.sin(i * 0.9) * 10

  // flowing stroke through node centers
  const pts = nodes.map((n, i) => ({ x: waveX(i), y: n.y }))
  let path = ''
  if (pts.length) {
    path = `M ${pts[0].x} ${RIVER.topPad - 30}`
    pts.forEach((p, i) => {
      if (i === 0) { path += ` L ${p.x} ${p.y}`; return }
      const prev = pts[i - 1]
      const my = (prev.y + p.y) / 2
      path += ` C ${prev.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`
    })
    path += ` L ${pts.at(-1).x} ${height}`
  }
  svg.innerHTML = `
    <defs>
      <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#149d92" stop-opacity="0.85"/>
        <stop offset="1" stop-color="#0c6b66" stop-opacity="0.35"/>
      </linearGradient>
    </defs>
    <path d="${path}" fill="none" stroke="url(#streamGrad)" stroke-width="3" stroke-linecap="round"/>
    <path d="${path}" fill="none" stroke="#149d92" stroke-width="9" stroke-linecap="round" opacity="0.10"/>`

  // gutters
  gutters.forEach((g) => {
    const div = document.createElement('div')
    div.className = 'day-gutter'
    div.style.top = `${g.y}px`
    const label = formatDayLabel(g.date)
    div.innerHTML = `<span class="dg-label">${label}</span><span class="dg-line"></span>${
      g.count != null ? `<span class="dg-count">${g.count} shipped</span>` : ''}`
    list.appendChild(div)
  })

  // nodes
  nodes.forEach((n, i) => {
    const { e, y, d } = n
    const li = document.createElement('li')
    li.className = 'node'
    li.dataset.id = e.id
    li.style.top = `${y - d / 2}px`
    li.style.setProperty('--glyph-x', `${waveX(i)}px`)
    li.style.setProperty('--glyph-d', `${d}px`)
    li.style.setProperty('--node-x', `${waveX(i) + d / 2 + 18}px`)
    li.style.animationDelay = `${Math.min(i * 0.03, 0.5)}s`
    li.setAttribute('role', 'option')
    li.title = `${e.title} · ${e.deltoid} · ${formatTime(e)}`
    li.innerHTML = `
      <span class="node-check" aria-hidden="true"></span>
      <span class="node-glyph">∆</span>
      <span class="node-meta">
        <span class="node-title">${escapeHtml(e.title)}</span>
        <span class="node-sub">
          <span class="nd-id">${e.deltoid}</span>
          <span class="nd-wc">${e.wordCount}w</span>
          <span class="nd-time">${formatTimeShort(e)}</span>
        </span>
      </span>`
    li.addEventListener('click', () => onNodeClick(e.id))
    list.appendChild(li)
  })
}

function onNodeClick(id) {
  if (state.selectMode) {
    togglePick(id)
  } else {
    openEntry(id)
  }
}

// ─────────────────────────── the reader ───────────────────────────
async function openEntry(id) {
  const meta = state.byId.get(id)
  if (!meta) return
  state.current = id
  $('#reader-empty').hidden = true
  $('#entry').hidden = false
  $$('.node').forEach((n) => n.classList.toggle('active', n.dataset.id === id))
  history.replaceState(null, '', `/e/${id}`)

  // masthead immediately, body after fetch (with skeleton)
  renderEntryMast(meta)
  $('#entry-html').innerHTML = `<p style="color:var(--ink-ghost);font-style:italic">Unbinding the page…</p>`
  $('#section-rail').innerHTML = ''
  $('#reader').scrollTo({ top: 0, behavior: 'smooth' })

  let full
  try {
    full = await api(`/api/journal/${encodeURIComponent(meta.file)}`)
  } catch {
    $('#entry-html').innerHTML = `<p style="color:var(--blocked)">Could not load this entry.</p>`
    return
  }
  if (state.current !== id) return // user moved on
  renderEntryBody(full)
}

function renderEntryMast(e) {
  const readMin = Math.max(1, Math.round(e.wordCount / 220))
  $('#entry-mast').innerHTML = `
    <div class="mast-sigil-row">
      <span class="mast-deltoid">${e.deltoid}</span>
      <span class="mast-rule"></span>
    </div>
    <h1>${escapeHtml(e.title)}</h1>
    <div class="mast-meta">
      <span class="mm">${iconClock()} ${formatTime(e)}</span>
      <span class="mm">${iconDoc()} ${e.wordCount} words</span>
      <span class="mm">${iconBook()} ${readMin} min read</span>
    </div>`
}

function renderEntryBody(full) {
  const host = $('#entry-html')
  host.innerHTML = linkifyXrefs(full.html, full.id)

  // Wrap each section (from <h2>) into a navigable block; mark the Retrospective harvestable.
  const sections = sectionize(host)
  buildSectionRail(sections)
  // re-apply search highlight if active
  if (state.query) highlightInReader(state.query)
  // wire xref clicks
  $$('.xref', host).forEach((a) => a.addEventListener('click', (ev) => {
    ev.preventDefault()
    const tid = a.dataset.target
    if (state.byId.has(tid)) openEntry(tid)
    else jumpToBacklog(tid)
  }))
  // provenance trail in margin
  renderProvenance(full.id)
}

// Group the flat rendered HTML into <section> wrappers keyed by their <h2>.
function sectionize(host) {
  const kids = [...host.childNodes]
  const sections = []
  let cur = null
  host.innerHTML = ''
  for (const node of kids) {
    if (node.nodeType === 1 && node.tagName === 'H2') {
      cur = document.createElement('section')
      cur.className = 'entry-section'
      const heading = node.textContent.replace(/^∆\s*/, '').trim()
      cur.dataset.heading = heading
      const slug = heading.toLowerCase().replace(/\W+/g, '-')
      cur.id = `sec-${slug}`
      if (/retrospect/i.test(heading)) cur.classList.add('retro-zone')
      cur.appendChild(node)
      host.appendChild(cur)
      sections.push({ heading, el: cur })
    } else if (cur) {
      cur.appendChild(node)
    } else {
      host.appendChild(node)
    }
  }
  return sections
}

function buildSectionRail(sections) {
  const rail = $('#section-rail')
  rail.innerHTML = sections
    .map(
      (s) => `<button class="rail-link" data-sec="${s.el.id}">
        <span class="rail-tick"></span>${escapeHtml(s.heading)}</button>`
    )
    .join('')
  $$('.rail-link', rail).forEach((b) =>
    b.addEventListener('click', () => {
      const el = $('#' + b.dataset.sec)
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  )
  // scroll-spy
  const reader = $('#reader')
  reader.onscroll = () => {
    let active = sections[0]
    for (const s of sections) {
      if (s.el.getBoundingClientRect().top - reader.getBoundingClientRect().top < 120) active = s
    }
    $$('.rail-link', rail).forEach((b) => b.classList.toggle('current', b.dataset.sec === active?.el.id))
  }
  reader.onscroll()
}

// Detect ∆xxx deltoids in prose; link to journal entry or backlog item.
function linkifyXrefs(html, selfId) {
  return html.replace(/∆([A-Za-z0-9]{3})/g, (m, id) => {
    if (id === selfId) return `<span class="xref xref-self" data-target="${id}" title="this entry">${m}</span>`
    if (state.byId.has(id)) return `<a class="xref" href="/e/${id}" data-target="${id}" title="journal entry: ${escapeHtml(state.byId.get(id).title)}">${m}</a>`
    if (state.backlogById.has(id)) return `<a class="xref" data-target="${id}" title="live backlog item">${m}</a>`
    return `<span class="xref" data-target="${id}" title="referenced deltoid">${m}</span>`
  })
}

function jumpToBacklog(id) {
  const b = state.backlogById.get(id)
  if (b) toast(`∆${id} is a live backlog item — “${truncate(b.summary, 60)}”`, { glyph: '∆' })
  else toast(`∆${id} — no matching entry or backlog item found`, { glyph: '?' })
}

function renderProvenance(id) {
  const wrap = $('#provenance')
  const spawned = KNOWN_PROVENANCE[id]
  if (!spawned) { wrap.hidden = true; renderMargin(); return }
  wrap.hidden = false
  wrap.innerHTML = `
    <div class="prov-head">retrospective already spawned</div>
    <div class="prov-trail">
      <span class="prov-from">∆${id}</span><span class="prov-arrow">→</span>
      ${spawned.map((s) => `<button class="prov-spawn" data-id="${s}">∆${s}</button>`).join('')}
    </div>`
  $$('.prov-spawn', wrap).forEach((b) =>
    b.addEventListener('click', () => {
      const tid = b.dataset.id
      if (state.byId.has(tid)) openEntry(tid)
      else jumpToBacklog(tid)
    })
  )
  renderMargin()
}

// ─────────────────────── harvest margin / selection ───────────────────────
const pop = $('#harvest-pop')
let lastSelection = null

document.addEventListener('selectionchange', () => {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !sel.toString().trim()) { hidePop(); return }
  const range = sel.getRangeAt(0)
  const anchor = range.commonAncestorContainer
  const anchorEl = anchor.nodeType === 1 ? anchor : anchor.parentElement
  const zone = anchorEl?.closest('.retro-zone, .entry-section')
  if (!zone) { hidePop(); return }
  // only the Retrospective (and Refinement) raise harvest actions per the concept
  const heading = zone.dataset.heading || ''
  if (!/retrospect|refinement/i.test(heading)) { hidePop(); return }
  lastSelection = {
    text: sel.toString().trim().replace(/\s+/g, ' '),
    deltoid: state.current ? `∆${state.current}` : null,
    heading,
  }
  showPop(range.getBoundingClientRect())
})

function showPop(rect) {
  pop.hidden = false
  const px = Math.min(Math.max(rect.left + rect.width / 2, 90), window.innerWidth - 90)
  const py = Math.max(rect.top - pop.offsetHeight - 10, 8)
  pop.style.left = `${px - pop.offsetWidth / 2}px`
  pop.style.top = `${py}px`
}
function hidePop() { pop.hidden = true }

pop.addEventListener('mousedown', (e) => e.preventDefault()) // keep selection alive
$$('button', pop).forEach((b) =>
  b.addEventListener('click', () => {
    const act = b.dataset.act
    hidePop()
    if (!lastSelection) return
    if (act === 'quote') addHarvestCard({ type: 'quote', ...lastSelection })
    else openSheet(act, lastSelection)
  })
)

// A harvested card lifts into the margin; you review then cast it.
function addHarvestCard(card) {
  card.id = `h${Date.now()}${Math.random().toString(36).slice(2, 5)}`
  card.queued = false
  state.harvest.unshift(card)
  renderMargin()
}

function renderMargin() {
  const list = $('#margin-cards')
  const empty = $('#margin-empty')
  empty.style.display = state.harvest.length || !$('#provenance').hidden ? 'none' : 'flex'
  list.innerHTML = state.harvest
    .map((c) => {
      const kindLabel = c.type === 'followup' ? 'follow-up item' : c.type === 'lesson' ? 'lesson' : 'quote'
      const body =
        c.type === 'lesson'
          ? `<div class="hc-label">Lesson: <b>${escapeHtml(c.label || '—')}</b></div>`
          : c.type === 'followup'
            ? `<div class="hc-label">${escapeHtml(c.note || '')} ${c.needs ? `<br><span class="hc-prov">needs: <span class="hc-src">∆${c.needs}</span></span>` : ''}</div>`
            : ''
      return `<li class="harvest-card ${c.queued ? 'queued' : ''}" data-id="${c.id}">
        <span class="hc-kind ${c.type}">${c.type === 'quote' ? '”' : c.type === 'lesson' ? '✦' : '∆'} ${kindLabel}</span>
        ${body}
        <div class="hc-quote">${escapeHtml(truncate(c.text, 220))}</div>
        <div class="hc-prov">from <span class="hc-src">${c.deltoid || '—'}</span> · ${escapeHtml(c.heading || '')}</div>
        <div class="hc-actions">
          <button class="hc-cast" data-act="cast">Cast to agent →</button>
          <button class="hc-dismiss" data-act="dismiss" aria-label="Discard">discard</button>
        </div>
        <div class="hc-queued-pill"><span class="qp-dot"></span> queued for the agent · pending</div>
      </li>`
    })
    .join('')
  $$('.harvest-card', list).forEach((el) => {
    const card = state.harvest.find((c) => c.id === el.dataset.id)
    $('[data-act="cast"]', el)?.addEventListener('click', () => castHarvestCard(card, el))
    $('[data-act="dismiss"]', el)?.addEventListener('click', () => {
      state.harvest = state.harvest.filter((c) => c.id !== card.id)
      renderMargin()
    })
  })
}

async function castHarvestCard(card, el) {
  const kind =
    card.type === 'followup' ? 'journal.spawn-followup-item'
    : card.type === 'lesson' ? 'journal.mark-lesson'
    : 'journal.quote-into-draft'
  const body = {
    kind,
    deltoid: card.deltoid || undefined,
    note: card.type === 'lesson' ? `${card.label}: ${card.text}` : card.note || card.text,
    passage: card.text,
    sourceSection: card.heading,
  }
  if (card.type === 'followup' && card.needs) body.needs = card.needs
  if (card.type === 'lesson') body.label = card.label
  await postIntent(body, { silent: false })
  card.queued = true
  renderMargin()
}

// ───────────────────────────── intents ─────────────────────────────
async function postIntent(body, { silent } = {}) {
  try {
    const recorded = await api('/api/intents', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
    state.intents.push(recorded)
    renderIntents()
    if (!silent) {
      toast(intentToastLabel(body.kind, recorded.seq), {
        glyph: '∆',
        link: { label: 'open inbox', fn: openTray },
      })
    }
    return recorded
  } catch (err) {
    toast(`Couldn’t queue intent — ${String(err)}`, { glyph: '!' })
    throw err
  }
}

function intentToastLabel(kind, seq) {
  const map = {
    'journal.spawn-followup-item': 'Follow-up item drafted',
    'journal.mark-lesson': 'Lesson flagged for the agent',
    'journal.quote-into-draft': 'Quote queued into a draft',
    'journal.draft-cross-retro': 'Cross-retrospective requested',
    'journal.draft-followup-from-search': 'Search-themed follow-up drafted',
  }
  return `<b>Queued #${seq}</b> — ${map[kind] || kind}. The agent will act on it.`
}

async function renderIntents() {
  // re-read so the count reflects the real queue (incl. resolves)
  try {
    const { intents } = await api('/api/intents')
    state.intents = intents
  } catch { /* keep optimistic copy */ }
  const pending = state.intents.filter((i) => !i.resolved)
  const count = $('#inbox-count')
  count.textContent = state.intents.length
  $('#open-tray').classList.toggle('has-pending', pending.length > 0)

  const list = $('#tray-list')
  const empty = $('#tray-empty')
  empty.style.display = state.intents.length ? 'none' : 'block'
  const ordered = state.intents.slice().reverse()
  list.innerHTML = ordered.map(renderChip).join('')
  $$('.chip-resolve', list).forEach((b) =>
    b.addEventListener('click', () => resolveIntent(Number(b.dataset.seq)))
  )
}

function renderChip(i) {
  const kindShort = i.kind.replace(/^journal\./, '')
  const note = i.note || i.label || i.passage || ''
  return `<li class="intent-chip ${i.resolved ? 'resolved' : ''}">
    <div class="chip-top">
      <span class="chip-seq">#${i.seq}</span>
      <span class="chip-kind">${escapeHtml(kindShort)}</span>
      ${i.deltoid ? `<span class="chip-deltoid">${escapeHtml(i.deltoid)}</span>` : ''}
    </div>
    ${note ? `<div class="chip-note">${escapeHtml(truncate(note, 180))}</div>` : ''}
    <div class="chip-foot">
      <span class="chip-status"><span class="cs-dot"></span>${i.resolved ? 'handled by agent' : 'pending — awaiting agent'}</span>
      ${i.resolved ? `<span class="chip-ts">${shortTs(i.ts)}</span>` : `<button class="chip-resolve" data-seq="${i.seq}">mark handled</button>`}
    </div>
  </li>`
}

async function resolveIntent(seq) {
  await fetch(`/api/intents/${seq}/resolve`, { method: 'POST' })
  toast(`Intent #${seq} marked handled`, { glyph: '✓' })
  renderIntents()
}

// ───────────────────────── draft sheets ─────────────────────────
const sheet = $('#sheet')
let sheetSubmit = null

function openSheet(kind, sel) {
  if (kind === 'followup') buildFollowupSheet(sel)
  else if (kind === 'lesson') buildLessonSheet(sel)
  showSheet()
}

function buildFollowupSheet(sel) {
  $('#sheet-kind').textContent = 'journal.spawn-followup-item'
  $('#sheet-title').textContent = 'Spawn a follow-up item'
  const inits = ['First npm Publish', 'Someday/Maybe']
  $('#sheet-body').innerHTML = `
    <div class="sheet-source">“${escapeHtml(truncate(sel.text, 240))}”<span class="ss-from">harvested from ${sel.deltoid} · ${escapeHtml(sel.heading)}</span></div>
    <div class="sheet-field">
      <label>What should the agent draft?</label>
      <textarea id="f-note" placeholder="The ask, in your words…">${escapeHtml(suggestFollowup(sel.text))}</textarea>
    </div>
    <div class="sheet-field">
      <label>Suggested initiative</label>
      <select id="f-init">${inits.map((x) => `<option>${x}</option>`).join('')}</select>
    </div>
    <div class="sheet-field">
      <label>needs: (optional prerequisite)</label>
      <div class="sheet-pickers" id="f-needs">
        <button class="sheet-pick" data-id="">none</button>
        ${state.backlog.filter((b) => !b.blocked).slice(0, 7).map((b) => `<button class="sheet-pick" data-id="${b.id}" title="${escapeHtml(b.summary)}">∆${b.id}</button>`).join('')}
      </div>
    </div>`
  let needs = ''
  const picks = $$('#f-needs .sheet-pick')
  picks[0].classList.add('on')
  picks.forEach((p) => p.addEventListener('click', () => {
    picks.forEach((x) => x.classList.remove('on')); p.classList.add('on'); needs = p.dataset.id
  }))
  sheetSubmit = () =>
    addHarvestCard({
      type: 'followup', text: sel.text, deltoid: sel.deltoid, heading: sel.heading,
      note: $('#f-note').value.trim(), initiative: $('#f-init').value, needs,
    })
}

function buildLessonSheet(sel) {
  $('#sheet-kind').textContent = 'journal.mark-lesson'
  $('#sheet-title').textContent = 'Mark a reusable lesson'
  $('#sheet-body').innerHTML = `
    <div class="sheet-source">“${escapeHtml(truncate(sel.text, 240))}”<span class="ss-from">harvested from ${sel.deltoid} · ${escapeHtml(sel.heading)}</span></div>
    <div class="sheet-field">
      <label>Short lesson label</label>
      <input id="l-label" placeholder="e.g. fix at the writer, not the reader" value="${escapeHtml(suggestLabel(sel.text))}" />
    </div>
    <div class="sheet-field">
      <label>Where should the agent fold it in?</label>
      <select id="l-where">
        <option value="skill">/delto SKILL.md guidance</option>
        <option value="notes">project notes</option>
        <option value="adr">a new ADR</option>
      </select>
    </div>`
  sheetSubmit = () =>
    addHarvestCard({
      type: 'lesson', text: sel.text, deltoid: sel.deltoid, heading: sel.heading,
      label: $('#l-label').value.trim() || 'untitled lesson', fold: $('#l-where').value,
    })
}

function buildCrossRetroSheet() {
  const picked = [...state.picked].map((id) => state.byId.get(id)).filter(Boolean)
  $('#sheet-kind').textContent = 'journal.draft-cross-retro'
  $('#sheet-title').textContent = `Draft a retrospective across ${picked.length}`
  $('#sheet-body').innerHTML = `
    <div class="sheet-field">
      <label>The ${picked.length} entries the agent will synthesize</label>
      <div class="cross-list">
        ${picked.map((e) => `<div class="cross-row"><span class="cr-id">${e.deltoid}</span><span class="cr-title">${escapeHtml(e.title)}</span></div>`).join('')}
      </div>
    </div>
    <div class="sheet-field">
      <label>Theme / angle (optional)</label>
      <textarea id="c-theme" placeholder="e.g. what recurring judgment calls shaped the CLI primitives?"></textarea>
    </div>`
  sheetSubmit = async () => {
    await postIntent({
      kind: 'journal.draft-cross-retro',
      note: $('#c-theme').value.trim() || `Synthesize a cross-cutting retrospective across ${picked.length} entries`,
      deltoids: picked.map((e) => e.deltoid),
      files: picked.map((e) => e.file),
    })
    exitSelectMode()
  }
  showSheet()
}

function buildSearchFollowupSheet() {
  const matched = [...state.matches].map((id) => state.byId.get(id)).filter(Boolean)
  $('#sheet-kind').textContent = 'journal.draft-followup-from-search'
  $('#sheet-title').textContent = 'Draft an item from this theme'
  $('#sheet-body').innerHTML = `
    <div class="sheet-source">Search: “${escapeHtml(state.query)}” — <b>${matched.length}</b> ${matched.length === 1 ? 'entry' : 'entries'} matched.</div>
    <div class="sheet-field">
      <label>What recurring theme should the agent address?</label>
      <textarea id="s-note" placeholder="e.g. consolidate the difit-seeding workaround into reusable skill guidance">The retros mentioning “${escapeHtml(state.query)}” point at a recurring theme worth a backlog item.</textarea>
    </div>
    <div class="sheet-field">
      <label>matching deltoids</label>
      <div class="sheet-pickers">${matched.map((e) => `<span class="sheet-pick on">${e.deltoid}</span>`).join('')}</div>
    </div>`
  sheetSubmit = () =>
    postIntent({
      kind: 'journal.draft-followup-from-search',
      note: $('#s-note').value.trim(),
      query: state.query,
      deltoids: matched.map((e) => e.deltoid),
    })
  showSheet()
}

function showSheet() {
  $('#sheet-scrim').hidden = false
  sheet.hidden = false
  setTimeout(() => sheet.querySelector('textarea, input, select')?.focus(), 30)
}
function closeSheet() {
  $('#sheet-scrim').hidden = true
  sheet.hidden = true
  sheetSubmit = null
}

// crude but useful suggestion seeds
function suggestFollowup(text) {
  const first = text.split(/[.;](\s|$)/)[0]
  return `Follow up on: ${truncate(first, 120)}`
}
function suggestLabel(text) {
  // grab a quoted phrase if present, else first few words
  const q = /[“"']([^”"']{6,60})[”"']/.exec(text)
  if (q) return q[1]
  return truncate(text.split(/[—,.;:]/)[0], 48)
}

// ─────────────────────────── search ───────────────────────────
const searchInput = $('#search')
let searchCache = new Map() // id -> lowercased full text
let searchDebounce

searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce)
  searchDebounce = setTimeout(runSearch, 130)
})

async function ensureSearchCorpus() {
  // lazily fetch full text once (sections are not in /api/journal list, only headings)
  const missing = state.entries.filter((e) => !searchCache.has(e.id))
  if (!missing.length) return
  const fetched = await Promise.all(
    missing.map((e) =>
      api(`/api/journal/${encodeURIComponent(e.file)}`)
        .then((f) => ({ id: e.id, text: f.sections.map((s) => `${s.heading} ${s.markdown}`).join(' ').toLowerCase() }))
        .catch(() => ({ id: e.id, text: e.title.toLowerCase() }))
    )
  )
  fetched.forEach(({ id, text }) => searchCache.set(id, text))
}

async function runSearch() {
  const q = searchInput.value.trim().toLowerCase()
  state.query = searchInput.value.trim()
  $('#search-clear').hidden = !q
  if (!q) { clearSearch(); return }
  await ensureSearchCorpus()
  state.matches = new Set(
    state.entries.filter((e) => (searchCache.get(e.id) || '').includes(q) || e.title.toLowerCase().includes(q)).map((e) => e.id)
  )
  applySearchToRiver()
  if (state.current) highlightInReader(state.query)
  updateRibbonFilter()
}

function applySearchToRiver() {
  $$('.node').forEach((n) => {
    const hit = state.matches.has(n.dataset.id)
    n.classList.toggle('dimmed', !hit)
    n.classList.toggle('match', hit)
    let badge = $('.match-badge', n)
    if (hit && !badge) {
      badge = document.createElement('span')
      badge.className = 'match-badge'
      badge.textContent = 'hit'
      $('.node-title', n).after(badge)
    }
  })
}

function clearSearch() {
  state.query = ''
  state.matches.clear()
  $$('.node').forEach((n) => { n.classList.remove('dimmed', 'match'); $('.match-badge', n)?.remove() })
  clearHighlight()
  updateRibbonFilter()
}

function updateRibbonFilter() {
  const stats = $('#ribbon-stats')
  if (!stats) return
  let f = $('#ribbon-filter')
  if (state.query) {
    if (!f) {
      f = document.createElement('span'); f.id = 'ribbon-filter'; f.className = 'ribbon-filtered'
      stats.appendChild(f)
    }
    f.innerHTML = `“${escapeHtml(state.query)}” · ${state.matches.size} lit ${state.matches.size ? `· <button class="link-btn" id="search-followup" style="font-size:0.66rem">draft item →</button>` : ''}`
    $('#search-followup')?.addEventListener('click', buildSearchFollowupSheet)
  } else if (f) f.remove()
}

function highlightInReader(q) {
  clearHighlight()
  const host = $('#entry-html')
  if (!host || !q) return
  const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement.closest('pre, code') ? NodeFilter.FILTER_REJECT
      : n.nodeValue.toLowerCase().includes(q.toLowerCase()) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP),
  })
  const targets = []
  while (walker.nextNode()) targets.push(walker.currentNode)
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  targets.forEach((node) => {
    const frag = document.createDocumentFragment()
    let last = 0, m
    const text = node.nodeValue
    re.lastIndex = 0
    while ((m = re.exec(text))) {
      frag.appendChild(document.createTextNode(text.slice(last, m.index)))
      const mark = document.createElement('mark'); mark.className = 'hit'; mark.textContent = m[0]
      frag.appendChild(mark); last = m.index + m[0].length
    }
    frag.appendChild(document.createTextNode(text.slice(last)))
    node.parentNode.replaceChild(frag, node)
  })
}
function clearHighlight() {
  $$('mark.hit').forEach((m) => { m.replaceWith(document.createTextNode(m.textContent)); })
  $('#entry-html')?.normalize()
}

// ───────────────────── select mode (cross-retro) ─────────────────────
function enterSelectMode() {
  state.selectMode = true
  $('#select-mode').setAttribute('aria-pressed', 'true')
  $('.river').classList.add('selecting')
  $('#composer-bar').hidden = false
  hidePop()
}
function exitSelectMode() {
  state.selectMode = false
  state.picked.clear()
  $('#select-mode').setAttribute('aria-pressed', 'false')
  $('.river').classList.remove('selecting')
  $('#composer-bar').hidden = true
  $$('.node.picked').forEach((n) => n.classList.remove('picked'))
}
function togglePick(id) {
  if (state.picked.has(id)) state.picked.delete(id)
  else state.picked.add(id)
  $(`.node[data-id="${id}"]`)?.classList.toggle('picked', state.picked.has(id))
  const n = state.picked.size
  $('#composer-n').textContent = n
  $('#compose-retro').disabled = n < 2
}

// ───────────────────────── intent tray ─────────────────────────
function openTray() {
  renderIntents()
  $('#tray').classList.add('open')
  $('#tray').setAttribute('aria-hidden', 'false')
  $('#tray-scrim').hidden = false
}
function closeTray() {
  $('#tray').classList.remove('open')
  $('#tray').setAttribute('aria-hidden', 'true')
  $('#tray-scrim').hidden = true
}

// ───────────────────────── global wiring ─────────────────────────
function wireGlobal() {
  $('#open-tray').addEventListener('click', openTray)
  $('#close-tray').addEventListener('click', closeTray)
  $('#tray-scrim').addEventListener('click', closeTray)
  $('#select-mode').addEventListener('click', () => (state.selectMode ? exitSelectMode() : enterSelectMode()))
  $('#composer-cancel').addEventListener('click', exitSelectMode)
  $('#compose-retro').addEventListener('click', buildCrossRetroSheet)
  $('#search-clear').addEventListener('click', () => { searchInput.value = ''; runSearch(); searchInput.blur() })
  $('#sheet-cancel').addEventListener('click', closeSheet)
  $('#sheet-scrim').addEventListener('click', closeSheet)
  $('#sheet-confirm').addEventListener('click', async () => {
    if (sheetSubmit) await sheetSubmit()
    closeSheet()
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) { e.preventDefault(); searchInput.focus() }
    if (e.key === 'Escape') {
      if (!sheet.hidden) closeSheet()
      else if ($('#tray').classList.contains('open')) closeTray()
      else if (state.query) { searchInput.value = ''; runSearch() }
      else if (state.selectMode) exitSelectMode()
    }
  })
  window.addEventListener('scroll', hidePop, true)
}

// ───────────────────────── toasts ─────────────────────────
function toast(html, { glyph = '∆', link } = {}) {
  const el = document.createElement('div')
  el.className = 'toast'
  el.innerHTML = `<span class="t-glyph">${glyph}</span><span class="t-body">${html}</span>`
  if (link) {
    const a = document.createElement('span'); a.className = 't-link'; a.textContent = link.label
    a.addEventListener('click', () => { link.fn(); dismiss() })
    el.querySelector('.t-body').append(' ', a)
  }
  $('#toasts').appendChild(el)
  const dismiss = () => { el.classList.add('leaving'); setTimeout(() => el.remove(), 350) }
  setTimeout(dismiss, 4600)
}

// ───────────────────────── helpers ─────────────────────────
function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
}
function truncate(s, n) {
  s = String(s ?? '')
  return s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s
}
function formatTime(e) {
  if (!e.completedMs) return e.completed || 'undated'
  const d = new Date(e.completedMs)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
}
function formatTimeShort(e) {
  if (!e.completedMs) return ''
  return new Date(e.completedMs).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
}
function formatDayLabel(date) {
  if (date === '—') return 'undated'
  const d = new Date(date + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })
}
function shortTs(ts) {
  if (!ts) return ''
  try { return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) } catch { return '' }
}
function iconClock() { return `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>` }
function iconDoc() { return `<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M9 12h6M9 16h6"/></svg>` }
function iconBook() { return `<svg viewBox="0 0 24 24"><path d="M4 5a2 2 0 0 1 2-2h6v17H6a2 2 0 0 0-2 2z"/><path d="M20 5a2 2 0 0 0-2-2h-6v17h6a2 2 0 0 1 2 2z"/></svg>` }

boot()
