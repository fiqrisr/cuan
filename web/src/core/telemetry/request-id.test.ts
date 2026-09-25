import { describe, expect, test } from 'bun:test';
import { generateRequestId, HEADER_REQUEST_ID } from './request-id';

describe('request-id', () => {
  test('HEADER_REQUEST_ID is x-request-id', () => {
    expect(HEADER_REQUEST_ID).toBe('x-request-id');
  });

  test('generateRequestId returns a valid UUID string', () => {
    const id = generateRequestId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('generateRequestId generates distinct IDs on subsequent calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 50; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(50);
  });
});
