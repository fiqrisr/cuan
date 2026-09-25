import { type Metric, onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';
import { telemetry } from './telemetry';

export function handleWebVital(metric: Metric): void {
  telemetry.recordMetric(`web_vitals_${metric.name.toLowerCase()}`, metric.value, 'ms', {
    rating: metric.rating,
    navigationType: metric.navigationType,
    id: metric.id,
  });
}

export function initWebVitals(): void {
  if (typeof window === 'undefined') return;

  try {
    onCLS(handleWebVital);
    onFCP(handleWebVital);
    onINP(handleWebVital);
    onLCP(handleWebVital);
    onTTFB(handleWebVital);
  } catch (err) {
    telemetry.captureException(err, {
      metadata: { context: 'initWebVitals' },
    });
  }
}
