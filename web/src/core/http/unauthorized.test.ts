import { beforeEach, describe, expect, type Mock, mock, test } from 'bun:test';
import {
  DEFAULT_UNAUTHORIZED_THRESHOLD,
  getUnauthorizedCount,
  getUnauthorizedThreshold,
  handleUnauthorized,
  logoutAndClearSession,
  onUnauthorized,
  resetUnauthorizedAuthClient,
  resetUnauthorizedCount,
  resetUnauthorizedQueryClient,
  setCustomLogoutHandler,
  setUnauthorizedAuthClient,
  setUnauthorizedQueryClient,
  setUnauthorizedRouter,
  setUnauthorizedThreshold,
  setupUnauthorizedFetchInterceptor,
  unauthorized,
} from './unauthorized';

describe('unauthorized handler', () => {
  let mockSignOut: Mock<() => Promise<{ data?: unknown; error?: unknown }>>;
  let mockClear: Mock<() => void>;
  let mockNavigate: Mock<(opts: { to: string }) => Promise<void>>;

  beforeEach(() => {
    resetUnauthorizedCount();
    setUnauthorizedThreshold(DEFAULT_UNAUTHORIZED_THRESHOLD);
    setCustomLogoutHandler(null);

    mockSignOut = mock(() => Promise.resolve({ data: { success: true }, error: null }));
    mockClear = mock(() => {});
    mockNavigate = mock(() => Promise.resolve());

    setUnauthorizedAuthClient({ signOut: mockSignOut });
    setUnauthorizedQueryClient({ clear: mockClear });
    setUnauthorizedRouter({ navigate: mockNavigate });
  });

  test('initializes with default threshold and zero count', () => {
    expect(getUnauthorizedCount()).toBe(0);
    expect(getUnauthorizedThreshold()).toBe(3);
    expect(DEFAULT_UNAUTHORIZED_THRESHOLD).toBe(3);
  });

  test('increments counter on 401 and does not log out before threshold', async () => {
    const res1 = await handleUnauthorized(401);
    expect(res1).toBe(false);
    expect(getUnauthorizedCount()).toBe(1);
    expect(mockSignOut).not.toHaveBeenCalled();

    const res2 = await handleUnauthorized(401);
    expect(res2).toBe(false);
    expect(getUnauthorizedCount()).toBe(2);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test('triggers auto-logout and clears session on 3rd 401 response', async () => {
    await handleUnauthorized(401);
    await handleUnauthorized(401);
    const triggered = await handleUnauthorized(401);

    expect(triggered).toBe(true);
    expect(getUnauthorizedCount()).toBe(0); // Reset after triggering
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  test('unauthorized and onUnauthorized aliases work identically', async () => {
    await unauthorized(401);
    expect(getUnauthorizedCount()).toBe(1);

    await onUnauthorized(401);
    expect(getUnauthorizedCount()).toBe(2);

    const triggered = await unauthorized(401);
    expect(triggered).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  test('resets counter on successful 2xx responses', async () => {
    await handleUnauthorized(401);
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized(401);
    expect(getUnauthorizedCount()).toBe(2);

    // 200 OK resets counter
    const res = await handleUnauthorized(200);
    expect(res).toBe(false);
    expect(getUnauthorizedCount()).toBe(0);

    // Next 401 starts from 1 again
    await handleUnauthorized(401);
    expect(getUnauthorizedCount()).toBe(1);
    expect(mockSignOut).not.toHaveBeenCalled();
  });

  test('resets counter on 201 Created and other 2xx status codes', async () => {
    await handleUnauthorized(401);
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized(new Response(null, { status: 201 }));
    expect(getUnauthorizedCount()).toBe(0);
  });

  test('handles Response object with 401 status', async () => {
    const res1 = new Response('Unauthorized', { status: 401 });
    const res2 = new Response('Unauthorized', { status: 401 });
    const res3 = new Response('Unauthorized', { status: 401 });

    await handleUnauthorized(res1);
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized(res2);
    expect(getUnauthorizedCount()).toBe(2);

    const triggered = await handleUnauthorized(res3);
    expect(triggered).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('does not double count the same Response object', async () => {
    const res = new Response('Unauthorized', { status: 401 });

    const first = await handleUnauthorized(res);
    expect(first).toBe(false);
    expect(getUnauthorizedCount()).toBe(1);

    // Same object passed again should be ignored
    const second = await handleUnauthorized(res);
    expect(second).toBe(false);
    expect(getUnauthorizedCount()).toBe(1);
  });

  test('handles error object with status 401', async () => {
    await handleUnauthorized({ status: 401 });
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized({ statusCode: 401 });
    expect(getUnauthorizedCount()).toBe(2);

    const triggered = await handleUnauthorized({ response: { status: 401 } });
    expect(triggered).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('handles call with no arguments (defaults to 401)', async () => {
    await handleUnauthorized();
    await handleUnauthorized();
    const triggered = await handleUnauthorized();

    expect(triggered).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('ignores non-401 non-2xx errors (e.g. 404, 500)', async () => {
    await handleUnauthorized(401);
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized(404);
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized(500);
    expect(getUnauthorizedCount()).toBe(1);

    await handleUnauthorized(403);
    expect(getUnauthorizedCount()).toBe(1);
  });

  test('supports custom threshold configuration', async () => {
    setUnauthorizedThreshold(2);
    expect(getUnauthorizedThreshold()).toBe(2);

    await handleUnauthorized(401);
    const triggered = await handleUnauthorized(401);

    expect(triggered).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('throws if setting invalid threshold', () => {
    expect(() => setUnauthorizedThreshold(0)).toThrow();
    expect(() => setUnauthorizedThreshold(-1)).toThrow();
  });

  test('supports per-call threshold override option', async () => {
    await handleUnauthorized(401);
    const triggered = await handleUnauthorized(401, { threshold: 2 });

    expect(triggered).toBe(true);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  test('clears session and navigates even if signOut throws an error', async () => {
    const originalConsoleError = console.error;
    console.error = () => {};
    try {
      mockSignOut = mock(() => Promise.reject(new Error('Network error during signOut')));
      setUnauthorizedAuthClient({ signOut: mockSignOut });

      await logoutAndClearSession();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockClear).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
    } finally {
      console.error = originalConsoleError;
    }
  });

  test('calls custom logout handler and options.onLogout during logout', async () => {
    const customHandler = mock(() => {});
    const onLogout = mock(() => {});
    setCustomLogoutHandler(customHandler);

    await logoutAndClearSession({ onLogout });

    expect(customHandler).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  test('supports custom navigate option', async () => {
    const customNavigate = mock(() => Promise.resolve());

    await logoutAndClearSession({ navigate: customNavigate });

    expect(customNavigate).toHaveBeenCalledWith('/login');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test('prevents concurrent logout calls', async () => {
    const { promise, resolve } = Promise.withResolvers<{ data: null; error: null }>();
    mockSignOut = mock(() => promise);
    setUnauthorizedAuthClient({ signOut: mockSignOut });

    // Start first logout
    const logout1 = logoutAndClearSession();
    // Start second logout while first is in-flight
    const logout2 = logoutAndClearSession();

    resolve({ data: null, error: null });
    await Promise.all([logout1, logout2]);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });

  test('setupUnauthorizedFetchInterceptor intercepts 401s and excludes sign-in/sign-out', async () => {
    const originalFetch = globalThis.fetch;
    const cleanup = setupUnauthorizedFetchInterceptor();

    try {
      // Mock fetch
      globalThis.fetch = mock((url: string | URL | Request) => {
        const urlStr = String(url);
        if (urlStr.includes('/test-401')) {
          return Promise.resolve(new Response(null, { status: 401 }));
        }
        if (urlStr.includes('/sign-in')) {
          return Promise.resolve(new Response(null, { status: 401 }));
        }
        return Promise.resolve(new Response(null, { status: 200 }));
      }) as unknown as typeof fetch;

      // Re-setup with the mocked fetch
      const innerCleanup = setupUnauthorizedFetchInterceptor();

      try {
        // Fetch that returns 401
        await globalThis.fetch('/api/test-401');
        expect(getUnauthorizedCount()).toBe(1);

        // Sign-in returning 401 should NOT increment count
        await globalThis.fetch('/auth/api/sign-in/email');
        expect(getUnauthorizedCount()).toBe(1);

        // Another 401
        await globalThis.fetch('/api/test-401');
        expect(getUnauthorizedCount()).toBe(2);

        // 3rd 401 triggers auto-logout
        await globalThis.fetch('/api/test-401');
        expect(getUnauthorizedCount()).toBe(0);
        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockClear).toHaveBeenCalledTimes(1);
      } finally {
        innerCleanup();
      }
    } finally {
      cleanup();
      globalThis.fetch = originalFetch;
    }
  });

  test('resets auth and query clients to defaults', () => {
    resetUnauthorizedAuthClient();
    resetUnauthorizedQueryClient();
    expect(getUnauthorizedCount()).toBe(0);
  });
});
