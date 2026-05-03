/**
 * postcss.config.js — PostCSS pipeline configuration for the PhishAware frontend.
 *
 * Runs two plugins on every CSS file processed by Vite:
 *  - tailwindcss   — generates utility classes from tailwind.config.js
 *  - autoprefixer  — adds vendor prefixes for cross-browser compatibility
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
