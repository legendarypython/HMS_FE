// Single source of truth for the backend origin. Set REACT_APP_API_URL at build
// time (CRA only inlines env vars prefixed REACT_APP_) to point at a real
// deployment; falls back to the local dev backend when unset.
export const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
