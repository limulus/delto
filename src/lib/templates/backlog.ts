export interface BacklogTemplateParams {
  /** Journal-entry directory, relative to the project root (e.g. `docs/journal`). */
  journalDir: string
}

/**
 * The starter `BACKLOG.md` for a freshly bootstrapped project: a header that names the
 * delto skill as the backlog's authoring authority and self-documents the conventions,
 * with no items yet.
 *
 * Nothing in the rendered text may start a line with `- ∆xxx ` — `parseBacklog` would
 * treat it as a live item in every consumer repo.
 */
export function renderBacklog({ journalDir }: BacklogTemplateParams): string {
  return `# Backlog

This backlog is managed with the **delto** skill — before adding or changing items,
consult it (and the authoring reference it points to) so the conventions below stay
enforced.

Organized as Initiative (\`##\`) → Epic (\`###\`) → Item (\`-\`); initiatives are roughly
priority-ordered, items 5 lines max.

Each item starts with a “deltoid” — \`∆\` followed by 3 alphanumerics, e.g. \`∆7hy\`.
Deltoids are immutable and travel with the item into its completed-work journal entry in
\`${journalDir}/\`. To mint a collision-free deltoid, run
\`npx @limulus/delto@1 mint --journal-dir ${journalDir}\` (see \`delto mint --help\`).

Hard prerequisites use a trailing \`; needs: ∆aaa[, ∆bbb]\` suffix — the only dependency
mechanism: \`delto surface\` trusts these edges to decide what is eligible to work on.
`
}
