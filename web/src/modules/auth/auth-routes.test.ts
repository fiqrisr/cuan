import { afterEach, beforeEach, describe, expect, type Mock, spyOn, test } from 'bun:test';
import { isRedirect } from '@tanstack/react-router';
import { Route as LoginRoute } from '@/routes/login';
import { Route as RegisterRoute } from '@/routes/register';

function getRedirectTarget(error: unknown): string | undefined {
  if (
    error &&
    typeof error === 'object' &&
    'options' in error &&
    error.options &&
    typeof error.options === 'object' &&
    'to' in error.options &&
    typeof error.options.to === 'string'
  ) {
    return error.options.to;
  }
  return undefined;
}

describe('Auth routes guard', () => {
  let fetchSpy: Mock<typeof fetch> | undefined;
  let sessionPayload: unknown = null;
  let shouldThrowNetworkError = false;

  beforeEach(() => {
    sessionPayload = null;
    shouldThrowNetworkError = false;
    fetchSpy = spyOn(globalThis, 'fetch').mockImplementation(
      Object.assign(
        async (input: RequestInfo | URL) => {
          if (shouldThrowNetworkError) {
            throw new Error('Network failure');
          }

          const url = String(input);
          if (url.includes('/get-session')) {
            return new Response(JSON.stringify(sessionPayload), {
              headers: { 'Content-Type': 'application/json' },
              status: 200,
            });
          }

          return new Response(null, { status: 404 });
        },
        { preconnect: () => {} },
      ),
    );
  });

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  describe('/login route', () => {
    test('redirects to / when already authenticated', async () => {
      sessionPayload = {
        user: { id: 'usr-1', email: 'test@example.com' },
        session: { id: 'sess-1' },
      };

      const beforeLoad = LoginRoute.options.beforeLoad;
      expect(typeof beforeLoad).toBe('function');

      try {
        await beforeLoad?.({} as never);
        expect.unreachable('Expected redirect to be thrown');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(getRedirectTarget(error)).toBe('/');
      }
    });

    test('permits access when not authenticated', async () => {
      sessionPayload = null;

      const beforeLoad = LoginRoute.options.beforeLoad;
      expect(typeof beforeLoad).toBe('function');

      const result = await beforeLoad?.({} as never);
      expect(result).toBeUndefined();
    });

    test('permits access when session retrieval throws network error', async () => {
      shouldThrowNetworkError = true;

      const beforeLoad = LoginRoute.options.beforeLoad;
      expect(typeof beforeLoad).toBe('function');

      const result = await beforeLoad?.({} as never);
      expect(result).toBeUndefined();
    });
  });

  describe('/register route', () => {
    test('redirects to / when already authenticated', async () => {
      sessionPayload = {
        user: { id: 'usr-2', email: 'test2@example.com' },
        session: { id: 'sess-2' },
      };

      const beforeLoad = RegisterRoute.options.beforeLoad;
      expect(typeof beforeLoad).toBe('function');

      try {
        await beforeLoad?.({} as never);
        expect.unreachable('Expected redirect to be thrown');
      } catch (error) {
        expect(isRedirect(error)).toBe(true);
        expect(getRedirectTarget(error)).toBe('/');
      }
    });

    test('permits access when not authenticated', async () => {
      sessionPayload = null;

      const beforeLoad = RegisterRoute.options.beforeLoad;
      expect(typeof beforeLoad).toBe('function');

      const result = await beforeLoad?.({} as never);
      expect(result).toBeUndefined();
    });

    test('permits access when session retrieval throws network error', async () => {
      shouldThrowNetworkError = true;

      const beforeLoad = RegisterRoute.options.beforeLoad;
      expect(typeof beforeLoad).toBe('function');

      const result = await beforeLoad?.({} as never);
      expect(result).toBeUndefined();
    });
  });
});
