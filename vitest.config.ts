import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['html', 'json', 'text', 'text-summary'],
      include: ['src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/mocks/**', 'src/legacy/**', 'src/bin/cli.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
    environment: 'node',
    exclude: ['**/node_modules/**', '**/dist/**'],
  },
})
