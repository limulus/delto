export interface BacklogTemplateParams {
  /** Journal-entry directory, relative to the project root (e.g. `docs/journal`). */
  journalDir: string
}

/**
 * The starter `BACKLOG.md` for a freshly bootstrapped project: a preamble that names the
 * delto skill as the backlog's authority, then the standing Refactors initiative. The
 * conventions live in the skill, so the preamble states only what differs from them — a
 * journal directory other than the spec's default.
 *
 * Nothing in the rendered text may start a line like an item, with the id bare or in
 * backticks — `parseBacklog` would treat it as a live item in every consumer repo.
 */
export function renderBacklog({ journalDir }: BacklogTemplateParams): string {
  const journal =
    journalDir === 'docs/journal'
      ? ''
      : `\nCompleted work is journaled in \`${journalDir}/\`.\n`
  return `# Backlog

This backlog is managed with the [delto](https://github.com/limulus/delto) skill. Consult
it before adding or changing items.
${journal}
## Refactors

Standing initiative. Keep it first, even when it has no items.
`
}
