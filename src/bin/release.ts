import { ledgerCommand } from './ledger-command.ts'
import { release as releaseLedger } from '../lib/claims-ledger.ts'

export const release = ledgerCommand({
  name: 'release',
  summary: 'release your claim on a backlog item',
  help: `delto release <deltoid> — withdraw your claim on a backlog item

Usage: delto release <deltoid>

Appends a release to the ledger beside the nearest BACKLOG.md, making the item
eligible for planning again. Releasing an unclaimed item is a harmless no-op. The
∆ sigil is optional.
`,
  apply: releaseLedger,
  done: (id) => `Released ∆${id} — it is eligible for planning again.`,
})
