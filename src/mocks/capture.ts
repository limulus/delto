import { type OutputStream } from '../bin/delto.ts'

/** An in-memory {@link OutputStream} double that records everything written to it. */
export class Capture implements OutputStream {
  private readonly chunks: string[] = []
  write(chunk: string): boolean {
    this.chunks.push(chunk)
    return true
  }
  get text(): string {
    return this.chunks.join('')
  }
}
