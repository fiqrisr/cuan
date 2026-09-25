import { describe, expect, test } from 'bun:test';
import { isSensitiveKey, sanitizeTelemetryData } from './sanitizer';

describe('sanitizer', () => {
  test('isSensitiveKey detects sensitive financial and credential keywords', () => {
    expect(isSensitiveKey('password')).toBe(true);
    expect(isSensitiveKey('userPassword')).toBe(true);
    expect(isSensitiveKey('authToken')).toBe(true);
    expect(isSensitiveKey('jwt_token')).toBe(true);
    expect(isSensitiveKey('clientSecret')).toBe(true);
    expect(isSensitiveKey('authorization')).toBe(true);
    expect(isSensitiveKey('cookie')).toBe(true);
    expect(isSensitiveKey('balance')).toBe(true);
    expect(isSensitiveKey('total_balance')).toBe(true);
    expect(isSensitiveKey('amount')).toBe(true);
    expect(isSensitiveKey('tx_amount')).toBe(true);
    expect(isSensitiveKey('account_number')).toBe(true);

    expect(isSensitiveKey('username')).toBe(false);
    expect(isSensitiveKey('category')).toBe(false);
    expect(isSensitiveKey('status')).toBe(false);
    expect(isSensitiveKey('id')).toBe(false);
  });

  test('sanitizeTelemetryData redacts sensitive fields in shallow and nested objects', () => {
    const raw = {
      id: 'tx-123',
      name: 'Coffee',
      amount: '15000',
      balance: '500000',
      nested: {
        token: 'secret-token-value',
        account_number: '1234567890',
        allowed: 'keep-me',
      },
    };

    const sanitized = sanitizeTelemetryData(raw);

    expect(sanitized.id).toBe('tx-123');
    expect(sanitized.name).toBe('Coffee');
    expect(sanitized.amount).toBe('[REDACTED]');
    expect(sanitized.balance).toBe('[REDACTED]');
    expect(sanitized.nested.token).toBe('[REDACTED]');
    expect(sanitized.nested.account_number).toBe('[REDACTED]');
    expect(sanitized.nested.allowed).toBe('keep-me');
  });

  test('sanitizeTelemetryData handles arrays cleanly', () => {
    const raw: Array<Record<string, unknown>> = [
      { amount: 100, label: 'Groceries' },
      { password: 'xyz', label: 'Auth' },
    ];

    const sanitized = sanitizeTelemetryData(raw);

    expect(sanitized).toEqual([
      { amount: '[REDACTED]', label: 'Groceries' },
      { password: '[REDACTED]', label: 'Auth' },
    ]);
  });

  test('sanitizeTelemetryData safely handles circular structures', () => {
    const obj: Record<string, unknown> = { name: 'safe' };
    obj.self = obj;

    const sanitized = sanitizeTelemetryData(obj);
    expect(sanitized.name).toBe('safe');
    expect(sanitized.self).toBe('[CIRCULAR]');
  });

  test('sanitizeTelemetryData respects max depth', () => {
    let deep: Record<string, unknown> = { leaf: 'value' };
    for (let i = 0; i < 8; i++) {
      deep = { next: deep };
    }

    const sanitized = sanitizeTelemetryData(deep);
    expect(JSON.stringify(sanitized)).toContain('[TRUNCATED_DEPTH]');
  });
});
