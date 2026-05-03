/**
 * eslint.config.js — ESLint flat-config for the PhishAware frontend.
 *
 * Applies to all .js and .jsx files. Extends:
 *  - @eslint/js recommended — standard JS best-practice rules
 *  - eslint-plugin-react-hooks recommended — exhaustive-deps and rules-of-hooks
 *  - eslint-plugin-react-refresh/vite — warns when non-component exports break HMR
 *
 * Custom rules:
 *  - no-unused-vars: error, but ignores names matching /^[A-Z_]/ (constants/components)
 *
 * The 'dist' output folder is excluded from linting.
 */
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
