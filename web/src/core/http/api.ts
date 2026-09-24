import type { App } from '@cuan/core/src/app'; // Make sure this is exported from core/src/app.ts
import { treaty } from '@elysiajs/eden';
import { handleUnauthorized } from './unauthorized';

export const API_BASE_URL = (
  import.meta.env.VITE_API_URL?.trim() ||
  (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173')
).replace(/\/+$/, '');

// @ts-expect-error
export const api = treaty<App>(API_BASE_URL, {
  fetch: {
    credentials: 'include',
  },
  onResponse: (response: Response) => {
    handleUnauthorized(response);
  },
});
