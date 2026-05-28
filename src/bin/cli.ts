#!/usr/bin/env node
import { run } from './delto.ts'

process.exit(await run(process.argv.slice(2)))
