import { describe, expect, test } from 'bun:test';
import type { Metric } from 'web-vitals';
import { telemetry } from './telemetry';
import { handleWebVital } from './vitals';

describe('Web Vitals', () => {
  test('handleWebVital records metric with rating tags', () => {
    let recordedName = '';
    let recordedValue = 0;
    let recordedTags: Record<string, unknown> | undefined;

    const unsubscribe = telemetry.addTransport({
      name: 'vitals-test',
      onMetric: metric => {
        recordedName = metric.name;
        recordedValue = metric.value;
        recordedTags = metric.tags;
      },
    });

    try {
      const mockMetric: Metric = {
        name: 'INP',
        value: 120,
        rating: 'good',
        delta: 120,
        entries: [],
        id: 'v4-1234567890',
        navigationType: 'navigate',
        navigationId: 1,
      };

      handleWebVital(mockMetric);

      expect(recordedName).toBe('web_vitals_inp');
      expect(recordedValue).toBe(120);
      expect(recordedTags?.rating).toBe('good');
      expect(recordedTags?.navigationType).toBe('navigate');
      expect(recordedTags?.id).toBe('v4-1234567890');
    } finally {
      unsubscribe();
    }
  });
});
