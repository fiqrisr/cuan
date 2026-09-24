export const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
).replace(/\/+$/, '');
