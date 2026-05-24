import config from '@limulus/eslint-config'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  ...config,
  globalIgnores(['dist/**/*']),
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.d.ts', '**/*.js'],

    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.eslint.json'],
      },
    },
  },
])
