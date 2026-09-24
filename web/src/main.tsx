import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient, setUnauthorizedRouter, setupUnauthorizedFetchInterceptor } from './core/http';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider } from './core/theme-context';
import './core/i18n';

import './index.css';

import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
});
setUnauthorizedRouter(router);
setupUnauthorizedFetchInterceptor();

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);
