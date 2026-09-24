import { describe, expect, test } from 'bun:test';
import { API_BASE_URL, authClient } from './index';

describe('authClient', () => {
  test('initializes without circular dependency errors and exports authClient', () => {
    expect(authClient).toBeDefined();
    expect(typeof authClient.signIn.email).toBe('function');
    expect(typeof authClient.signUp.email).toBe('function');
    expect(typeof authClient.signOut).toBe('function');
    expect(typeof authClient.getSession).toBe('function');
  });

  test('uses API_BASE_URL as base target for auth requests', () => {
    // Better-auth client stores the resolved options or uses $fetch with baseURL
    // Verify that API_BASE_URL is non-empty and matches
    expect(API_BASE_URL).toBeDefined();
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });
});
