import { generateRequestId, HEADER_REQUEST_ID, telemetry } from '../telemetry';
import { queryClient as defaultQueryClient } from './query-client';

export const DEFAULT_UNAUTHORIZED_THRESHOLD = 3;

export type UnauthorizedRouter = {
  navigate: (opts: { to: string }) => Promise<unknown>;
};

export type UnauthorizedAuthClient = {
  signOut: () => Promise<{ error?: { message?: string } | null } | unknown>;
};

export type UnauthorizedQueryClient = {
  clear: () => void;
};

export type LogoutOptions = {
  navigate?: (to: string) => Promise<void> | void;
  onLogout?: () => Promise<void> | void;
};

export type HandleUnauthorizedOptions = LogoutOptions & {
  threshold?: number;
};

export type UnauthorizedInput =
  | Response
  | number
  | { status?: number; statusCode?: number; response?: { status?: number } }
  | unknown;

let unauthorizedCount = 0;
let unauthorizedThreshold = DEFAULT_UNAUTHORIZED_THRESHOLD;
let isLoggingOut = false;
const handledObjects = new WeakSet<object>();

let routerInstance: UnauthorizedRouter | null = null;
let customLogoutHandler: (() => Promise<void> | void) | null = null;
let customAuthClient: UnauthorizedAuthClient | null = null;
let defaultAuthClient: UnauthorizedAuthClient | null = null;
let currentQueryClient: UnauthorizedQueryClient = defaultQueryClient;

export function getUnauthorizedCount(): number {
  return unauthorizedCount;
}

export function resetUnauthorizedCount(): void {
  unauthorizedCount = 0;
}

export function setUnauthorizedThreshold(threshold: number): void {
  if (threshold <= 0) {
    throw new Error('Unauthorized threshold must be greater than 0');
  }
  unauthorizedThreshold = threshold;
}

export function getUnauthorizedThreshold(): number {
  return unauthorizedThreshold;
}

export function setUnauthorizedRouter(router: UnauthorizedRouter | null): void {
  routerInstance = router;
}

export function setCustomLogoutHandler(handler: (() => Promise<void> | void) | null): void {
  customLogoutHandler = handler;
}

export function setDefaultUnauthorizedAuthClient(client: UnauthorizedAuthClient | null): void {
  defaultAuthClient = client;
}

export function setUnauthorizedAuthClient(client: UnauthorizedAuthClient): void {
  customAuthClient = client;
}

export function resetUnauthorizedAuthClient(): void {
  customAuthClient = null;
}

export function setUnauthorizedQueryClient(client: UnauthorizedQueryClient): void {
  currentQueryClient = client;
}

export function resetUnauthorizedQueryClient(): void {
  currentQueryClient = defaultQueryClient;
}

export async function logoutAndClearSession(options?: LogoutOptions): Promise<void> {
  if (isLoggingOut) return;
  isLoggingOut = true;

  try {
    resetUnauthorizedCount();
    telemetry.recordEvent(
      'auth_auto_logout_triggered',
      { threshold: unauthorizedThreshold },
      'warn',
    );

    // 1. Invalidate session via auth client
    try {
      const authClient = customAuthClient ?? defaultAuthClient;
      if (authClient) {
        await authClient.signOut();
      }
    } catch (err) {
      console.error('Error signing out during auto-logout:', err);
    }

    // 2. Clear query client cache
    try {
      currentQueryClient.clear();
    } catch (err) {
      console.error('Error clearing query cache during auto-logout:', err);
    }

    // 3. Run custom logout handler if registered
    if (customLogoutHandler) {
      try {
        await customLogoutHandler();
      } catch (err) {
        console.error('Error in custom logout handler during auto-logout:', err);
      }
    }

    if (options?.onLogout) {
      try {
        await options.onLogout();
      } catch (err) {
        console.error('Error in options.onLogout during auto-logout:', err);
      }
    }

    // 4. Redirect to login
    if (options?.navigate) {
      try {
        await options.navigate('/login');
      } catch (err) {
        console.error('Error navigating via options.navigate:', err);
      }
    } else {
      await navigateToLogin();
    }
  } finally {
    isLoggingOut = false;
  }
}

async function navigateToLogin(): Promise<void> {
  if (routerInstance && typeof routerInstance.navigate === 'function') {
    try {
      await routerInstance.navigate({ to: '/login' });
      return;
    } catch {
      // Fallback if router navigation throws
    }
  }

  if (typeof window !== 'undefined' && window.location) {
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
}

export async function handleUnauthorized(
  input?: UnauthorizedInput,
  options?: HandleUnauthorizedOptions,
): Promise<boolean> {
  // If input is an object (Response, Error, etc.), check if it was already processed to avoid double counting
  if (input !== undefined && input !== null && typeof input === 'object') {
    if (handledObjects.has(input)) {
      return false;
    }
    handledObjects.add(input);
  }

  let status: number | undefined;

  if (typeof input === 'number') {
    status = input;
  } else if (typeof Response !== 'undefined' && input instanceof Response) {
    status = input.status;
  } else if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    if (typeof obj.status === 'number') {
      status = obj.status;
    } else if (typeof obj.statusCode === 'number') {
      status = obj.statusCode;
    } else if (
      obj.response &&
      typeof obj.response === 'object' &&
      typeof (obj.response as Record<string, unknown>).status === 'number'
    ) {
      status = (obj.response as Record<string, unknown>).status as number;
    }
  } else if (input === undefined) {
    status = 401;
  }

  // If a request responded with 2xx success, reset the consecutive 401 count
  if (status !== undefined && status >= 200 && status < 300) {
    resetUnauthorizedCount();
    return false;
  }

  // Only handle 401 responses (or undefined input which defaults to 401)
  if (status !== 401) {
    return false;
  }

  unauthorizedCount += 1;
  const threshold = options?.threshold ?? unauthorizedThreshold;

  if (unauthorizedCount >= threshold) {
    resetUnauthorizedCount();
    await logoutAndClearSession(options);
    return true;
  }

  return false;
}

export const unauthorized = handleUnauthorized;
export const onUnauthorized = handleUnauthorized;

export function setupUnauthorizedFetchInterceptor(): () => void {
  const globalObj =
    typeof window !== 'undefined' ? window : typeof globalThis !== 'undefined' ? globalThis : null;

  if (!globalObj?.fetch) {
    return () => {};
  }

  const originalFetch = globalObj.fetch;
  const wrappedFetch = (async (...args: Parameters<typeof originalFetch>): Promise<Response> => {
    const modifiedArgs = [...args] as Parameters<typeof originalFetch>;
    const input = modifiedArgs[0];
    const init = modifiedArgs[1] ? { ...modifiedArgs[1] } : {};

    if (typeof input === 'string' || (typeof URL !== 'undefined' && input instanceof URL)) {
      const headers = new Headers(init.headers);
      if (!headers.get(HEADER_REQUEST_ID)) {
        headers.set(HEADER_REQUEST_ID, generateRequestId());
      }
      init.headers = headers;
      modifiedArgs[1] = init;
    } else if (typeof Request !== 'undefined' && input instanceof Request) {
      if (!input.headers.get(HEADER_REQUEST_ID)) {
        const headers = new Headers(input.headers);
        headers.set(HEADER_REQUEST_ID, generateRequestId());
        modifiedArgs[0] = new Request(input, { headers });
      }
    }

    const response = await originalFetch(...modifiedArgs);
    const url =
      typeof input === 'string'
        ? input
        : typeof Request !== 'undefined' && input instanceof Request
          ? input.url
          : String(input);

    if (!url.includes('/sign-in') && !url.includes('/sign-out')) {
      handleUnauthorized(response);
    }
    return response;
  }) as typeof globalObj.fetch;

  globalObj.fetch = Object.assign(wrappedFetch, originalFetch);
  return () => {
    globalObj.fetch = originalFetch;
  };
}
