import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'

/** One section of a journal entry body, split on its `##` heading. */
export interface JournalSection {
  heading: string
  markdown: string
}

/** A parsed completion journal entry from `docs/journal/`. */
export interface JournalEntry {
  /** The deltoid, sigil included (e.g. `∆6zh`). */
  deltoid: string
  /** The 3-char body without the sigil (e.g. `6zh`). */
  id: string
  /** Raw `completed:` frontmatter string, spec format `YYYY-MM-DD HH:MM:SS ±HH:MM`. */
  completed: string | null
  /** `completed` parsed to epoch ms, or null when unparseable. For sorting + velocity. */
  completedMs: number | null
  /** Human title derived from the filename slug after the deltoid. */
  title: string
  /** The filename slug after the deltoid (e.g. `mint-subcommand`). */
  slug: string
  /** The journal filename (e.g. `∆6zh-mint-subcommand.md`). */
  file: string
  /** The `## Backlog item` blockquote text, with leading `> ` stripped. */
  item: string
  /** Body sections split on `##` headings, in document order. */
  sections: JournalSection[]
  /** The full Markdown body (everything after the frontmatter). */
  markdown: string
  /** Rough word count of the body — a cheap "how much was written" signal. */
  wordCount: number
}

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/

function parseCompleted(value: string | null): number | null {
  if (!value) return null
  // `2026-05-29 05:55:03 +00:00` -> `2026-05-29T05:55:03+00:00`
  const iso = value.trim().replace(' ', 'T').replace(/ (?=[+-]\d{2}:\d{2}$)/, '')
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? null : ms
}

function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function splitSections(markdown: string): JournalSection[] {
  const sections: JournalSection[] = []
  let heading = ''
  let buffer: string[] = []
  const flush = (): void => {
    if (heading || buffer.join('\n').trim()) {
      sections.push({ heading, markdown: buffer.join('\n').trim() })
    }
  }
  for (const line of markdown.split('\n')) {
    const m = /^##\s+(.*\S)\s*$/.exec(line)
    if (m) {
      flush()
      heading = m[1]
      buffer = []
    } else {
      buffer.push(line)
    }
  }
  flush()
  return sections
}

function extractItem(markdown: string): string {
  const quoted: string[] = []
  let seen = false
  for (const line of markdown.split('\n')) {
    if (line.startsWith('>')) {
      seen = true
      quoted.push(line.replace(/^>\s?/, ''))
    } else if (seen && line.trim() === '') {
      continue
    } else if (seen) {
      break
    }
  }
  return quoted.join('\n').trim()
}

/** Parse one journal file's raw text into a {@link JournalEntry}. */
export function parseJournalFile(file: string, raw: string): JournalEntry {
  const m = FRONTMATTER.exec(raw)
  const front = m ? m[1] : ''
  const body = (m ? m[2] : raw).trim()
  const idField = /^id:\s*(.+)$/m.exec(front)?.[1]?.trim() ?? ''
  const completed = /^completed:\s*(.+)$/m.exec(front)?.[1]?.trim() ?? null
  const deltoid = idField || basename(file).split('-')[0]
  const id = deltoid.replace(/^∆/, '')
  const slug = basename(file, '.md').replace(/^∆?[A-Za-z0-9]{3}-?/, '')
  return {
    deltoid,
    id,
    completed,
    completedMs: parseCompleted(completed),
    title: slug ? titleFromSlug(slug) : deltoid,
    slug,
    file: basename(file),
    item: extractItem(body),
    sections: splitSections(body),
    markdown: body,
    wordCount: body.split(/\s+/).filter(Boolean).length,
  }
}

/**
 * Read every `*.md` journal entry in `journalDir`, newest completion first. Missing or
 * unreadable directories yield an empty list — the GUI degrades to "no history yet"
 * rather than erroring.
 */
export function readJournal(journalDir: string): JournalEntry[] {
  let names: string[]
  try {
    names = readdirSync(journalDir).filter((n) => n.endsWith('.md') && n !== 'README.md')
  } catch {
    return []
  }
  const entries = names.map((name) =>
    parseJournalFile(name, readFileSync(join(journalDir, name), 'utf8'))
  )
  return entries.sort((a, b) => (b.completedMs ?? 0) - (a.completedMs ?? 0))
}
