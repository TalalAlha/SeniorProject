/**
 * vite.config.js — Vite build configuration for the PhishAware frontend.
 *
 * Uses the official @vitejs/plugin-react plugin for fast HMR with Babel.
 * Dev server proxies API requests to the Django backend to avoid CORS in development.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
