import { describe, expect, test } from 'bun:test';
import { HEADER_REQUEST_ID } from '../telemetry';
import { API_BASE_URL, api } from './api';

describe('api client', () => {
  test('API_BASE_URL is exported and is a non-empty string without trailing slash', () => {
    expect(typeof API_BASE_URL).toBe('string');
    expect(API_BASE_URL.length).toBeGreaterThan(0);
    expect(API_BASE_URL.endsWith('/')).toBe(false);
  });

  test('api instance is exported and configured', () => {
    expect(api).toBeDefined();
    expect(HEADER_REQUEST_ID).toBe('x-request-id');
  });
});
