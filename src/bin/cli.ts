#!/usr/bin/env node
import { main } from './delto.ts'

process.exit(main(process.argv.slice(2)))
