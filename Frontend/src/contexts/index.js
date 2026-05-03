/**
 * contexts/index.js — Public surface for the contexts module.
 * Re-exports auth and theme context providers and hooks for a single import path.
 */
export { AuthProvider, useAuth, USER_ROLES } from './AuthContext';
export { ThemeProvider, useTheme } from './ThemeContext';
