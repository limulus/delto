import { ledgerCommand } from './ledger-command.ts'
import { claim as claimLedger } from '../lib/claims-ledger.ts'

export const claim = ledgerCommand({
  name: 'claim',
  summary: 'claim a backlog item so parallel work does not collide',
  help: `delto claim <deltoid> — record that you are starting work on a backlog item

Usage: delto claim <deltoid>

Appends a claim to the ledger beside the nearest BACKLOG.md so a parallel agent
won't pick the same item. Release it with \`delto release <deltoid>\` if you
abandon the work, or \`delto complete\`, which releases it as it scaffolds the
journal entry. The ∆ sigil is optional.
`,
  apply: claimLedger,
  done: (id, ledger) =>
    `Claimed ∆${id} — recorded in ${ledger}.\nRelease it with \`delto release ${id}\` if you abandon the work.`,
})
