import { describe, expect, test } from 'bun:test';
import { getDateRangeForPreset } from './date-presets';

describe('getDateRangeForPreset', () => {
  test('returns empty range for "all"', () => {
    const range = getDateRangeForPreset('all');
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });

  test('returns empty range for "custom"', () => {
    const range = getDateRangeForPreset('custom');
    expect(range.from).toBeUndefined();
    expect(range.to).toBeUndefined();
  });

  test('returns today range with start and end of day', () => {
    const range = getDateRangeForPreset('today');
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();

    const fromDate = new Date(range.from as string);
    const toDate = new Date(range.to as string);

    expect(fromDate.getTime()).toBeLessThan(toDate.getTime());
    expect(toDate.getTime() - fromDate.getTime()).toBeGreaterThanOrEqual(23 * 60 * 60 * 1000);
  });

  test('returns this_week range starting on Monday', () => {
    const range = getDateRangeForPreset('this_week');
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();

    const fromDate = new Date(range.from as string);
    // In local time, getDay() of Monday is 1
    expect(fromDate.getDay()).toBe(1);
  });

  test('returns this_month range starting on day 1', () => {
    const range = getDateRangeForPreset('this_month');
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();

    const fromDate = new Date(range.from as string);
    expect(fromDate.getDate()).toBe(1);
  });

  test('returns last_30_days range spanning approx 30 days', () => {
    const range = getDateRangeForPreset('last_30_days');
    expect(range.from).toBeDefined();
    expect(range.to).toBeDefined();

    const fromDate = new Date(range.from as string);
    const toDate = new Date(range.to as string);
    const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

    expect(daysDiff).toBeGreaterThanOrEqual(29);
    expect(daysDiff).toBeLessThanOrEqual(31);
  });
});
