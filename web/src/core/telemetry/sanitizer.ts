const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /authorization/i,
  /cookie/i,
  /credit[-_]?card/i,
  /cvv/i,
  /ssn/i,
  /balance/i,
  /amount/i,
  /account[-_]?number/i,
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some(pattern => pattern.test(key));
}

export function sanitizeTelemetryData<T>(input: T, depth = 0, seen = new WeakSet<object>()): T {
  if (depth > 5) {
    return '[TRUNCATED_DEPTH]' as unknown as T;
  }

  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input !== 'object') {
    return input;
  }

  if (seen.has(input as object)) {
    return '[CIRCULAR]' as unknown as T;
  }
  seen.add(input as object);

  if (Array.isArray(input)) {
    return input.map(item => sanitizeTelemetryData(item, depth + 1, seen)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (isSensitiveKey(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = sanitizeTelemetryData(value, depth + 1, seen);
    }
  }

  return result as T;
}
