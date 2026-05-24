#!/usr/bin/env node
/**
 * complete-item.ts
 *
 * The mechanical half of the `## Committing` ritual in CLAUDE.md — the parts a script
 * does more reliably than freehand editing:
 *
 *   - extracts the item's bullet from BACKLOG.md verbatim (exact transcription into the
 *     journal blockquote);
 *   - scaffolds docs/journal/∆<id>-<slug>.md from the docs/journal/README.md template;
 *   - releases the item's plan-backlog-item claim.
 *
 * It does NOT edit BACKLOG.md. Removing the item and pruning any heading it empties is
 * left to the agent — the same script-detects / agent-edits split the sibling
 * refine-backlog and plan-backlog-item skills use. The script prints the exact lines to
 * delete (and whether an emptied epic/initiative heading goes with them) so the edit is
 * unambiguous.
 *
 * Usage:
 *   node .claude/skills/complete-backlog-item/complete-item.ts <id> \
 *     [--slug <kebab-slug>] [--title <title>] [--dry-run]
 *
 * --slug and --title default to values derived from the backlog text; pass them to
 * override when the derived value reads poorly. --dry-run prints everything and writes
 * nothing (neither the journal file nor the claim release).
 *
 * Runs on Node's built-in TypeScript type-stripping — no build step, no flag. Keep this
 * file to erasable-only syntax (no enums, namespaces, or parameter properties).
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { ID, findRepoRoot, parseBacklog } from '../lib/backlog-parser.ts'
import { claimedIds, release } from '../lib/claims-ledger.ts'

function fail(msg: string): never {
  console.error('complete-item: ' + msg)
  process.exit(1)
}

// --- Args -------------------------------------------------------------------

const argv = process.argv.slice(2)
let idArg = ''
let slugArg: string | null = null
let titleArg: string | null = null
let dryRun = false
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--dry-run') dryRun = true
  else if (a === '--slug') slugArg = argv[++i] ?? ''
  else if (a === '--title') titleArg = argv[++i] ?? ''
  else if (a.startsWith('-')) fail(`unknown flag: ${a}`)
  else if (!idArg) idArg = a
  else fail(`unexpected argument: ${a}`)
}
if (!idArg) {
  fail('usage: complete-item.ts <id> [--slug <slug>] [--title <title>] [--dry-run]')
}
const id = idArg.replace(/^∆/, '').trim()
if (!new RegExp(`^${ID}$`).test(id)) {
  fail(`<id> must be a 3-char task ID (got: ${JSON.stringify(idArg)})`)
}

const repoRoot = findRepoRoot()

// --- Locate the item --------------------------------------------------------

const all = parseBacklog(repoRoot)
const item = all.find((x) => x.id === id)
if (!item) {
  fail(`∆${id} is not in BACKLOG.md — already completed, or wrong ID.`)
}
const initiative = item.initiativeHeading
if (!initiative) {
  fail(`∆${id} sits under no \`##\` initiative — BACKLOG.md is malformed.`)
}
const epic = item.epicHeading

const journalDir = join(repoRoot, 'docs', 'journal')
const existingEntry = existsSync(journalDir)
  ? readdirSync(journalDir).find((n) => new RegExp(`^∆${id}-.*\\.md$`).test(n))
  : undefined
if (existingEntry) {
  fail(`docs/journal/${existingEntry} already exists — ∆${id} looks already completed.`)
}

// --- Decide what to remove from BACKLOG.md ----------------------------------

const lines = readFileSync(join(repoRoot, 'BACKLOG.md'), 'utf8').split('\n')

// Every heading and its level, for section-boundary math.
const headings: { level: number; line: number }[] = []
for (let i = 0; i < lines.length; i++) {
  const m = /^(#+)\s+\S/.exec(lines[i])
  if (m) headings.push({ level: m[1].length, line: i + 1 })
}
/** 1-based last line of the section a heading opens — the line before the next
 *  heading of the same or a higher level (fewer-or-equal `#`), or end of file. */
function sectionEnd(line: number, level: number): number {
  const next = headings.find((h) => h.line > line && h.level <= level)
  return next ? next.line - 1 : lines.length
}

const epicSiblings = epic ? all.filter((x) => x.epicHeading?.line === epic.line) : []
const initiativeSiblings = all.filter((x) => x.initiativeHeading?.line === initiative.line)
const epicEmptied = epic !== null && epicSiblings.length === 1
const initiativeEmptied = initiativeSiblings.length === 1
const isRefactors = initiative.text === 'Refactors'

let scope: string
let removeStart: number
let removeEnd: number
if (initiativeEmptied && !isRefactors) {
  // `## Refactors` always stays even when empty; every other emptied initiative goes.
  scope = 'initiative'
  removeStart = initiative.line
  removeEnd = sectionEnd(initiative.line, 2)
} else if (epicEmptied && epic) {
  scope = 'epic'
  removeStart = epic.line
  removeEnd = sectionEnd(epic.line, 3)
} else {
  scope = 'item'
  removeStart = item.lineStart
  removeEnd = item.lineStart + item.lineCount - 1
}

// --- Derive title and slug --------------------------------------------------

const bulletLines = lines.slice(item.lineStart - 1, item.lineStart - 1 + item.lineCount)
const prefix = `- ∆${id} `
const itemText = [
  bulletLines[0].startsWith(prefix) ? bulletLines[0].slice(prefix.length) : bulletLines[0],
  ...bulletLines.slice(1).map((l) => l.trim()),
].join(' ')
// BACKLOG.md separates an item's name from its description with a spaced em dash.
const title = (titleArg ?? itemText.split(' — ')[0]).trim()
if (!title) fail('could not derive a title from the backlog text — pass --title <title>.')

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
const slug = slugArg !== null ? slugArg.trim() : kebab(title)
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
  fail(
    `--slug must be kebab-case (lowercase letters, digits, single dashes) — got ${JSON.stringify(slug)}`
  )
}

// --- Build the journal entry ------------------------------------------------

function today(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const journalRel = `docs/journal/∆${id}-${slug}.md`
const journalBody = `---
id: ∆${id}
date: ${today()}
title: ${title}
---

## Backlog item

${bulletLines.map((l) => '> ' + l).join('\n')}

## Planning

<!-- TODO: what was clarified or changed during planning — design decisions, scope
adjustments, trade-offs considered. Reference the plan file if useful. -->

## Refinement

<!-- TODO: what got adjusted post-implementation — surprises during coding, changes
from the plan, follow-ups deferred to new backlog items. -->

## Retrospective

<!-- TODO: what could have gone better, what to do differently next time. Honest and
short. -->
`

// --- Report -----------------------------------------------------------------

const span =
  removeStart === removeEnd ? `line ${removeStart}` : `lines ${removeStart}–${removeEnd}`
const out: string[] = []
out.push(`complete-backlog-item — ∆${id}${dryRun ? '  (dry run — nothing written)' : ''}`)
out.push('')
out.push('1. BACKLOG.md — remove this yourself (this script does not edit BACKLOG.md):')
if (scope === 'item') {
  out.push(`   Delete ${span} — the item ∆${id}.`)
} else if (scope === 'epic' && epic) {
  out.push(`   Delete ${span} — ∆${id} was the only item in epic “${epic.text}”, so the`)
  out.push('   `###` heading and its description block go with it.')
} else {
  out.push(
    `   Delete ${span} — ∆${id} was the only item in initiative “${initiative.text}”,`
  )
  out.push('   so the whole `##` section (heading, description, epic) goes with it.')
}
if (initiativeEmptied && isRefactors) {
  out.push('   Note: `## Refactors` is now empty but ALWAYS stays — keep its heading.')
}
out.push('')
out.push('   Lines to remove:')
for (const l of lines.slice(removeStart - 1, removeEnd)) out.push('   │ ' + l)
out.push('')
out.push(`2. Journal entry — ${dryRun ? 'would create' : 'created'} ${journalRel}:`)
if (dryRun) {
  for (const l of journalBody.replace(/\n$/, '').split('\n')) out.push('   │ ' + l)
} else {
  out.push('   Replace each `<!-- TODO … -->` block with real prose describing what')
  out.push('   actually happened — Planning, Refinement, Retrospective.')
}
out.push('')
const wasClaimed = claimedIds().has(id)
out.push('3. plan-backlog-item claim:')
if (dryRun) {
  out.push(
    `   Would release ∆${id}${wasClaimed ? '.' : ' (not currently claimed — would be a no-op).'}`
  )
} else {
  out.push(
    `   Released ∆${id}${wasClaimed ? '.' : ' (was not claimed — release recorded anyway).'}`
  )
}
out.push('')
out.push(
  dryRun
    ? 'Dry run: re-run without --dry-run to write the journal file and release the claim.'
    : 'Next: make the BACKLOG.md deletion above, then write the journal prose.'
)

if (!dryRun) {
  writeFileSync(join(repoRoot, journalRel), journalBody)
  release(id)
}
console.log(out.join('\n'))
