import { createAuthClient } from 'better-auth/react';
import { handleUnauthorized } from './unauthorized';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5173',
  basePath: '/auth/api',
  fetchOptions: {
    onResponse: context => {
      const url = context.request?.url ? String(context.request.url) : '';
      if (!url.includes('/sign-in') && !url.includes('/sign-out')) {
        if (context.response) {
          handleUnauthorized(context.response);
        }
      }
    },
  },
});
