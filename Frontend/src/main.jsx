/**
 * main.jsx — Application entry point.
 *
 * Mounts the React root inside ThemeProvider so the dark/light preference
 * is available before any route renders.  StrictMode is enabled for development
 * double-render checks.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
