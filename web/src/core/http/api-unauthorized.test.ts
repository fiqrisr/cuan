import { beforeEach, describe, expect, mock, type Mock, test } from 'bun:test';
import type { App } from '@cuan/core/src/app';
import { treaty } from '@elysiajs/eden';
import {
  DEFAULT_UNAUTHORIZED_THRESHOLD,
  getUnauthorizedCount,
  handleUnauthorized,
  resetUnauthorizedCount,
  setUnauthorizedAuthClient,
  setUnauthorizedQueryClient,
  setUnauthorizedRouter,
  setUnauthorizedThreshold,
} from './unauthorized';

describe('Eden Treaty api 401 integration', () => {
  let mockSignOut: Mock<() => Promise<{ data?: unknown; error?: unknown }>>;
  let mockClear: Mock<() => void>;
  let mockNavigate: Mock<(opts: { to: string }) => Promise<void>>;

  beforeEach(() => {
    resetUnauthorizedCount();
    setUnauthorizedThreshold(DEFAULT_UNAUTHORIZED_THRESHOLD);

    mockSignOut = mock(() => Promise.resolve({ data: { success: true }, error: null }));
    mockClear = mock(() => {});
    mockNavigate = mock(() => Promise.resolve());

    setUnauthorizedAuthClient({ signOut: mockSignOut });
    setUnauthorizedQueryClient({ clear: mockClear });
    setUnauthorizedRouter({ navigate: mockNavigate });
  });

  test('3 consecutive 401 responses from treaty api triggers auto-logout and clears session', async () => {
    // Treaty client wired identically to web/src/core/http/api.ts
    // @ts-expect-error
    const testApi = treaty<App>('http://localhost:5173', {
      fetcher: async () => {
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
      },
      onResponse: response => {
        handleUnauthorized(response);
      },
    });

    // Request 1
    await testApi.api.categories.get();
    expect(getUnauthorizedCount()).toBe(1);
    expect(mockSignOut).not.toHaveBeenCalled();

    // Request 2
    await testApi.api['financial-accounts'].get();
    expect(getUnauthorizedCount()).toBe(2);
    expect(mockSignOut).not.toHaveBeenCalled();

    // Request 3
    await testApi.api.transactions.get();
    expect(getUnauthorizedCount()).toBe(0); // Reset after triggering
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  test('successful response in between resets 401 counter in treaty client', async () => {
    let returnStatus = 401;

    // @ts-expect-error
    const testApi = treaty<App>('http://localhost:5173', {
      fetcher: async () => {
        if (returnStatus === 200) {
          return new Response(JSON.stringify({ data: [] }), { status: 200 });
        }
        return new Response(JSON.stringify({ message: 'Unauthorized' }), { status: 401 });
      },
      onResponse: response => {
        handleUnauthorized(response);
      },
    });

    // Request 1 -> 401
    await testApi.api.categories.get();
    expect(getUnauthorizedCount()).toBe(1);

    // Request 2 -> 200 OK (resets count)
    returnStatus = 200;
    await testApi.api.categories.get();
    expect(getUnauthorizedCount()).toBe(0);

    // Request 3 -> 401 (starts again at 1)
    returnStatus = 401;
    await testApi.api.categories.get();
    expect(getUnauthorizedCount()).toBe(1);

    // Request 4 -> 401
    await testApi.api.categories.get();
    expect(getUnauthorizedCount()).toBe(2);
    expect(mockSignOut).not.toHaveBeenCalled();

    // Request 5 -> 401 -> threshold reached!
    await testApi.api.categories.get();
    expect(getUnauthorizedCount()).toBe(0);
    expect(mockSignOut).toHaveBeenCalledTimes(1);
    expect(mockClear).toHaveBeenCalledTimes(1);
  });
});
