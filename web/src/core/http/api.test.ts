import { describe, expect, test } from 'bun:test';
import { API_BASE_URL } from './api';

describe('API_BASE_URL', () => {
  test('is exported and is a non-empty string without trailing slash', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });
});
