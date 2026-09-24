import { createAuthClient } from 'better-auth/react';
import { API_BASE_URL } from './base-url';
import { handleUnauthorized, setDefaultUnauthorizedAuthClient } from './unauthorized';

export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
  basePath: '/auth/api',
  fetchOptions: {
    credentials: 'include',
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

setDefaultUnauthorizedAuthClient(authClient);
