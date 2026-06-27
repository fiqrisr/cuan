import { describe, expect, it } from 'bun:test';
import { createOpenModelClient } from '@/lib/openmodel';

describe('createOpenModelClient', () => {
  it('returns a LanguageModelV1 instance', () => {
    const client = createOpenModelClient({
      apiKey: 'fake-key',
      baseUrl: 'http://localhost:3000',
      model: 'claude-3-haiku',
    });

    expect(client).toBeDefined();
  });
});
