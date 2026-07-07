# How to distill journal lessons into agent instructions

Journal entries record what each completed item taught, but future sessions load the
project's agent instructions file (`CLAUDE.md`, `AGENTS.md`, …), not the journal.
Distillation is the periodic pass that folds durable lessons from new entries into that
file — and prunes what they show is stale — so retrospective insight reaches future
sessions instead of staying buried in per-item write-ups.

## Locate the pieces

- **The journal directory** — `docs/journal/` unless the backlog header or the user names
  another.
- **The instructions file** — whichever file the project's agents actually load
  (`CLAUDE.md`, `AGENTS.md`, or similar). If more than one exists, ask the user which is
  the distillation target.
- **The watermark** — lives in the journal directory's `README.md`, in a section shaped
  like the template below. It is a datetime, not a commit SHA, so it survives rebases,
  squash-merges, and resets. Everything completed at or before the watermark is settled:
  incorporated or deliberately excluded. Do not revisit it.

If the README has no such section (or no README exists), this is the first run: the
review set is every entry in the journal, and you add the section when you finish.

## The watermark section

Seed (or maintain) this section in the journal README, adjusting the file and directory
names to the project:

````markdown
## CLAUDE.md distillation

Journal entries are periodically reviewed and their durable lessons distilled into
`CLAUDE.md`. Everything completed at or before the watermark below is settled —
incorporated or deliberately excluded — and is not revisited on later runs.

**Last distilled: YYYY-MM-DD HH:MM:SS ±HH:MM.**

To find the entries a new run needs to review, compare each entry's `completed`
frontmatter against the watermark:

```sh
grep -H '^completed:' docs/journal/∆*.md
```

Review every entry completed after the watermark. When one sits near the boundary,
review it — a redundant read is cheap, a missed lesson is not.

When running a distillation: verify every concrete claim (helper names, script names,
config values) against the current code before writing it into `CLAUDE.md` — entries
describe the code as it was, and later work may have superseded them. Then advance the
watermark in the same commit as the `CLAUDE.md` changes, using the datetime at which the
review ran.
````

## Run the review

1. Record the next watermark now: the current datetime in the entries' own `completed`
   format — `date +'%Y-%m-%d %H:%M:%S %:z'`. Entries completed while you work are the
   next run's problem.
2. Find the entries to review by comparing `completed` frontmatter against the old
   watermark, as above (every entry on a first run).
3. Read them. A handful of entries you can read inline; for a large batch, fan out
   subagents to read subsets and report back candidate lessons, each tagged with the
   entry it came from.

## Decide what is durable

A lesson earns a place in the instructions file when a future session would do worse
without it: a convention the code can't self-document, a gotcha that cost real time, a
constraint that isn't visible from any one file. Leave behind the rest — one-off
narrative, item-specific detail, anything the instructions file already says, anything
the repo records better elsewhere (code, ADRs, git history).

Deletion counts as much as addition: entries often show that existing guidance has been
superseded — a fixed workaround, a completed migration, a renamed command. Prune it.

## Verify, then write

Entries describe the code as it was; later work may have superseded them. Before writing
any concrete claim (a helper name, a script, a config value, a command) into the
instructions file, verify it against the current code. Distilling an outdated claim is
worse than distilling nothing — future sessions will trust it.

Fold the surviving lessons into the instructions file in its own style and structure —
extend existing sections where they fit; add a new section only when nothing fits.

## Advance the watermark

Update the watermark line to the datetime you recorded before the review, in the same
commit as the instructions-file edits, so the two can never drift apart.
