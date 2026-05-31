import { backlogLines, parseBacklog, type HeadingRef } from '../../../src/lib/backlog.ts'
import { claimedIds } from '../../../src/lib/claims-ledger.ts'
import { computeEligibility } from '../../../src/lib/eligibility.ts'
import { readIntents, type RecordedIntent } from './intents.ts'
import { readJournal, type JournalEntry } from './journal-read.ts'

/** A backlog item enriched for display: real parser output + eligibility + its text. */
export interface BacklogView {
  deltoid: string
  id: string
  /** The item's full text, wrapped continuation lines joined — no `- ∆xxx ` prefix. */
  text: string
  /** First sentence-ish summary, handy for compact cards. */
  summary: string
  needs: string[]
  /** Unmet `needs:` that are still open backlog items (what actually blocks it). */
  openNeeds: string[]
  /** Items that name this one as a prerequisite — leverage if you ship this. */
  dependents: string[]
  eligible: boolean
  claimed: boolean
  blocked: boolean
  initiative: string | null
  epic: string | null
  lineStart: number
  lineCount: number
}

export interface BacklogSnapshot {
  generatedAt: string
  repoRoot: string
  initiatives: string[]
  items: BacklogView[]
  /** Raw `BACKLOG.md`, for mockups that want to show the source of truth verbatim. */
  raw: string
}

function headingText(h: HeadingRef | null): string | null {
  return h ? h.text : null
}

function itemText(lines: string[], lineStart: number, lineCount: number): string {
  const slice = lines.slice(lineStart - 1, lineStart - 1 + lineCount)
  const joined = slice.map((l) => l.trim()).join(' ')
  return joined.replace(/^-\s*∆[A-Za-z0-9]{3}\s*/, '').trim()
}

/** Build the enriched backlog snapshot straight from delto's own parser + eligibility. */
export function backlogSnapshot(repoRoot: string): BacklogSnapshot {
  const lines = backlogLines(repoRoot)
  const items = parseBacklog(repoRoot)
  const claimed = claimedIds(repoRoot)
  const { byId, dependents } = computeEligibility(items, claimed)

  const initiatives: string[] = []
  for (const it of items) {
    const name = headingText(it.initiativeHeading)
    if (name && !initiatives.includes(name)) initiatives.push(name)
  }

  const views: BacklogView[] = items.map((it) => {
    const verdict = byId.get(it.id)!
    const text = itemText(lines, it.lineStart, it.lineCount)
    return {
      deltoid: `∆${it.id}`,
      id: it.id,
      text,
      summary: text.split(/\s[—–-]\s|[.;]\s/)[0].trim(),
      needs: it.needs,
      openNeeds: verdict.openNeeds,
      dependents: dependents.get(it.id) ?? [],
      eligible: verdict.eligible,
      claimed: verdict.claimed,
      blocked: verdict.openNeeds.length > 0,
      initiative: headingText(it.initiativeHeading),
      epic: headingText(it.epicHeading),
      lineStart: it.lineStart,
      lineCount: it.lineCount,
    }
  })

  return {
    generatedAt: new Date().toISOString(),
    repoRoot,
    initiatives,
    items: views,
    raw: lines.join('\n'),
  }
}

export interface JournalStats {
  total: number
  /** Completions keyed by `YYYY-MM-DD`, ascending. */
  byDay: { date: string; count: number }[]
  /** Completions keyed by ISO week (`YYYY-Www`), ascending. */
  byWeek: { week: string; count: number }[]
  firstCompleted: string | null
  lastCompleted: string | null
  busiestDay: { date: string; count: number } | null
}

function isoWeek(ms: number): string {
  const d = new Date(ms)
  const day = (d.getUTCDay() + 6) % 7
  const thursday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - day + 3))
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4))
  const week =
    1 + Math.round((thursday.getTime() - firstThursday.getTime()) / (7 * 86400000))
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

/** Derive velocity-style stats from completed journal entries. */
export function journalStats(entries: JournalEntry[]): JournalStats {
  const dated = entries.filter((e) => e.completedMs !== null)
  const days = new Map<string, number>()
  const weeks = new Map<string, number>()
  for (const e of dated) {
    const date = new Date(e.completedMs!).toISOString().slice(0, 10)
    days.set(date, (days.get(date) ?? 0) + 1)
    const w = isoWeek(e.completedMs!)
    weeks.set(w, (weeks.get(w) ?? 0) + 1)
  }
  const byDay = [...days.entries()].sort().map(([date, count]) => ({ date, count }))
  const byWeek = [...weeks.entries()].sort().map(([week, count]) => ({ week, count }))
  const busiestDay = byDay.reduce<{ date: string; count: number } | null>(
    (best, d) => (!best || d.count > best.count ? d : best),
    null
  )
  return {
    total: entries.length,
    byDay,
    byWeek,
    firstCompleted: byDay[0]?.date ?? null,
    lastCompleted: byDay.at(-1)?.date ?? null,
    busiestDay,
  }
}

/** Everything a mockup might want, in one shot — used by `GET /api/snapshot`. */
export interface FullSnapshot {
  backlog: BacklogSnapshot
  journal: JournalEntry[]
  stats: JournalStats
  intents: RecordedIntent[]
}

export function fullSnapshot(repoRoot: string, journalDir: string): FullSnapshot {
  const journal = readJournal(journalDir)
  return {
    backlog: backlogSnapshot(repoRoot),
    journal,
    stats: journalStats(journal),
    intents: readIntents(repoRoot),
  }
}
