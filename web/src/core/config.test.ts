import { describe, expect, it } from 'bun:test';
import { normalizeLandingUrl, PRIVACY_URL, TERMS_URL } from './config';

describe('landing config', () => {
  it('falls back to default landing domain when raw value is empty or undefined', () => {
    expect(normalizeLandingUrl()).toBe('https://cuan.fiqri.dev');
    expect(normalizeLandingUrl('')).toBe('https://cuan.fiqri.dev');
    expect(normalizeLandingUrl('   ')).toBe('https://cuan.fiqri.dev');
  });

  it('prepends https if protocol is missing', () => {
    expect(normalizeLandingUrl('cuan.fiqri.dev')).toBe('https://cuan.fiqri.dev');
    expect(normalizeLandingUrl('example.com')).toBe('https://example.com');
  });

  it('preserves existing http or https protocol', () => {
    expect(normalizeLandingUrl('http://localhost:4321')).toBe('http://localhost:4321');
    expect(normalizeLandingUrl('https://staging.cuan.fiqri.dev')).toBe(
      'https://staging.cuan.fiqri.dev',
    );
  });

  it('strips trailing slashes', () => {
    expect(normalizeLandingUrl('https://cuan.fiqri.dev/')).toBe('https://cuan.fiqri.dev');
    expect(normalizeLandingUrl('http://localhost:4321///')).toBe('http://localhost:4321');
    expect(normalizeLandingUrl('cuan.fiqri.dev/')).toBe('https://cuan.fiqri.dev');
  });

  it('exports valid privacy and terms URLs', () => {
    expect(PRIVACY_URL).toMatch(/\/privacy$/);
    expect(TERMS_URL).toMatch(/\/terms$/);
  });
});
