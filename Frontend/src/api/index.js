/**
 * api/index.js — Public API surface for the api module.
 *
 * Re-exports the configured Axios instance, token helpers, and all resource-specific
 * API objects so callers import from a single entry point: `import { authAPI } from '../api'`.
 */
export { default as api, getAccessToken, getRefreshToken, setTokens, clearTokens } from './axios';
export {
  authAPI,
  companiesAPI,
  employeesAPI,
  campaignsAPI,
  simulationsAPI,
  quizzesAPI,
  trainingAPI,
  analyticsAPI,
  gamificationAPI,
  communityAPI,
} from './endpoints';
