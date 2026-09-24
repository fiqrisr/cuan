import type { App } from '@cuan/core/src/app'; // Make sure this is exported from core/src/app.ts
import { treaty } from '@elysiajs/eden';
import { API_BASE_URL } from './base-url';
import { handleUnauthorized } from './unauthorized';

export { API_BASE_URL } from './base-url';

// @ts-expect-error
export const api = treaty<App>(API_BASE_URL, {
  fetch: {
    credentials: 'include',
  },
  onResponse: (response: Response) => {
    handleUnauthorized(response);
  },
});
