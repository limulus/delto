const COMMENT = '# Delto plan-backlog-item claim ledger (sits alongside BACKLOG.md)'
const PATTERN = '.delto-claims.local.jsonl'

/**
 * The `.gitignore` content that keeps delto's claim ledger out of version control, or
 * null when `existing` already covers it (whole-line match, LF or CRLF). Pass the
 * current file content, or undefined when no `.gitignore` exists yet.
 */
export function ensureClaimLedgerIgnored(existing: string | undefined): string | null {
  const block = `${COMMENT}\n${PATTERN}\n`
  if (existing === undefined || existing === '') return block
  if (existing.split(/\r?\n/).some((line) => line.trim() === PATTERN)) return null
  const base = existing.endsWith('\n') ? existing : `${existing}\n`
  return `${base}\n${block}`
}
