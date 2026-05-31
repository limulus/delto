import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

import { findRepoRoot } from '../../src/lib/backlog.ts'
import { backlogSnapshot, fullSnapshot, journalStats } from './lib/data.ts'
import { recordIntent, readIntents, resolveIntent } from './lib/intents.ts'
import { parseJournalFile, readJournal } from './lib/journal-read.ts'
import { renderMarkdown } from './lib/markdown.ts'

/**
 * The shared delto-GUI base server. Each mockup is a different front-end in `--public`;
 * they all talk to this same read-only API. It never writes `BACKLOG.md` — the only thing
 * it writes is the intent queue (see `lib/intents.ts`), which the agent drains.
 *
 *   node experiments/backlog-gui/server.ts --public <dir> [--port N] [--host H]
 */

interface Options {
  port: number
  host: string
  publicDir: string
  repoRoot: string
  journalDir: string
}

function parseArgs(argv: string[]): Options {
  const get = (flag: string): string | undefined => {
    const i = argv.indexOf(flag)
    return i >= 0 ? argv[i + 1] : undefined
  }
  const cwd = process.cwd()
  const repoRoot = resolve(get('--repo') ?? findRepoRoot(cwd) ?? cwd)
  return {
    port: Number(get('--port') ?? process.env.PORT ?? 4517),
    host: get('--host') ?? '127.0.0.1',
    publicDir: resolve(get('--public') ?? join(cwd, 'experiments/backlog-gui/public')),
    repoRoot,
    journalDir: resolve(get('--journal-dir') ?? join(repoRoot, 'docs/journal')),
  }
}

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const json = JSON.stringify(body, null, 2)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  })
  res.end(json)
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolveBody, rejectBody) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolveBody(Buffer.concat(chunks).toString('utf8')))
    req.on('error', rejectBody)
  })
}

function serveStatic(res: ServerResponse, publicDir: string, urlPath: string): void {
  const rel = normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, '')
  let filePath = join(publicDir, rel)
  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  if (existsSync(filePath) && statSync(filePath).isDirectory()) {
    filePath = join(filePath, 'index.html')
  }
  if (!existsSync(filePath)) {
    // SPA-friendly fallback so deep links resolve to the mockup's entry point.
    filePath = join(publicDir, 'index.html')
    if (!existsSync(filePath)) {
      res.writeHead(404).end('Not found')
      return
    }
  }
  res.writeHead(200, { 'content-type': MIME[extname(filePath)] ?? 'application/octet-stream' })
  createReadStream(filePath).pipe(res)
}

async function handleApi(
  req: IncomingMessage,
  res: ServerResponse,
  opts: Options,
  pathname: string
): Promise<void> {
  const { repoRoot, journalDir } = opts

  if (pathname === '/api/snapshot') {
    return sendJson(res, 200, fullSnapshot(repoRoot, journalDir))
  }
  if (pathname === '/api/backlog') {
    return sendJson(res, 200, backlogSnapshot(repoRoot))
  }
  if (pathname === '/api/journal') {
    const entries = readJournal(journalDir)
    return sendJson(res, 200, { entries, stats: journalStats(entries) })
  }
  const entryMatch = /^\/api\/journal\/(.+)$/.exec(pathname)
  if (entryMatch) {
    const file = decodeURIComponent(entryMatch[1])
    const filePath = join(journalDir, file.replace(/[/\\]/g, ''))
    if (!existsSync(filePath)) return sendJson(res, 404, { error: 'no such entry' })
    const entry = parseJournalFile(filePath, readFileSync(filePath, 'utf8'))
    return sendJson(res, 200, { ...entry, html: renderMarkdown(entry.markdown) })
  }
  if (pathname === '/api/intents') {
    if (req.method === 'POST') {
      const body = await readBody(req)
      let intent: Record<string, unknown>
      try {
        intent = JSON.parse(body || '{}')
      } catch {
        return sendJson(res, 400, { error: 'invalid JSON' })
      }
      if (typeof intent.kind !== 'string' || !intent.kind) {
        return sendJson(res, 400, { error: 'intent requires a "kind"' })
      }
      const recorded = recordIntent(repoRoot, intent as { kind: string })
      process.stdout.write(
        `↳ intent #${recorded.seq} ${recorded.kind}` +
          `${recorded.deltoid ? ` ${recorded.deltoid}` : ''}` +
          `${recorded.note ? ` — ${recorded.note}` : ''}\n`
      )
      return sendJson(res, 201, recorded)
    }
    return sendJson(res, 200, { intents: readIntents(repoRoot) })
  }
  const resolveMatch = /^\/api\/intents\/(\d+)\/resolve$/.exec(pathname)
  if (resolveMatch && req.method === 'POST') {
    resolveIntent(repoRoot, Number(resolveMatch[1]))
    return sendJson(res, 200, { ok: true })
  }
  if (pathname === '/api/render' && req.method === 'POST') {
    const body = await readBody(req)
    return sendJson(res, 200, { html: renderMarkdown(body) })
  }
  sendJson(res, 404, { error: 'unknown endpoint' })
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2))
  const server = createServer((req, res) => {
    const pathname = (req.url ?? '/').split('?')[0]
    if (pathname.startsWith('/api/')) {
      handleApi(req, res, opts, pathname).catch((err: unknown) => {
        sendJson(res, 500, { error: String(err) })
      })
      return
    }
    serveStatic(res, opts.publicDir, pathname === '/' ? '/index.html' : pathname)
  })
  server.listen(opts.port, opts.host, () => {
    process.stdout.write(
      `\n  delto backlog GUI — base server\n` +
        `  ┌ serving   ${opts.publicDir}\n` +
        `  ├ backlog   ${opts.repoRoot}/BACKLOG.md\n` +
        `  ├ journal   ${opts.journalDir}\n` +
        `  └ intents   ${opts.repoRoot}/.delto-gui-intents.local.jsonl\n\n` +
        `  → http://${opts.host}:${opts.port}\n\n`
    )
  })
}

main()
