# Claim visibility and stale-claim recovery

## Background

The item's original text, moved here unchanged on 2026-10-11 when backlog items were cut to
a title and two lines:

Document claim visibility and stale-claim recovery — nothing tells agents that
`surface --json` lists claimed items, so they read `.delto-claims.local.jsonl` directly
(observed 2026-07-14); and since only `release`/`complete` clear the ledger, a crashed
agent's claim hides its item from `surface` indefinitely with no claim age reported.
Skill prose first; weigh age reporting/expiry in tools only if prose proves insufficient.
