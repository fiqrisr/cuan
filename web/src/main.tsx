import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RootErrorFallback } from './components/root-error-fallback';
import { queryClient, setUnauthorizedRouter, setupUnauthorizedFetchInterceptor } from './core/http';
import {
  createHttpTelemetryTransport,
  initWebVitals,
  setupGlobalErrorListeners,
  telemetry,
} from './core/telemetry';
import { ThemeProvider } from './core/theme-context';
import './core/i18n';

import './index.css';

import { routeTree } from './routeTree.gen';

const router = createRouter({
  routeTree,
  defaultErrorComponent: RootErrorFallback,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
});
setUnauthorizedRouter(router);
setupUnauthorizedFetchInterceptor();
setupGlobalErrorListeners();
initWebVitals();
telemetry.addTransport(createHttpTelemetryTransport());

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RouterProvider router={router} />
        </ThemeProvider>
      </QueryClientProvider>
    </StrictMode>,
  );
}
