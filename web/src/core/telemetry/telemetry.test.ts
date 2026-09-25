import { beforeEach, describe, expect, test } from 'bun:test';
import { Telemetry } from './telemetry';
import type { CapturedError, TelemetryEvent, TelemetryMetric } from './telemetry.types';

describe('Telemetry', () => {
  let instance: Telemetry;

  beforeEach(() => {
    instance = new Telemetry();
  });

  test('records events and notifies transports', () => {
    const receivedEvents: TelemetryEvent[] = [];
    instance.addTransport({
      name: 'test-transport',
      onEvent: event => receivedEvents.push(event),
    });

    const evt = instance.recordEvent('user_action', { page: 'dashboard' }, 'info', 'req-123');

    expect(evt.name).toBe('user_action');
    expect(evt.level).toBe('info');
    expect(evt.requestId).toBe('req-123');
    expect(evt.data?.page).toBe('dashboard');
    expect(receivedEvents).toHaveLength(1);
    expect(receivedEvents[0].name).toBe('user_action');
  });

  test('captures exceptions with breadcrumbs and context', () => {
    let captured: CapturedError | undefined;
    instance.addTransport({
      name: 'error-transport',
      onError: err => {
        captured = err;
      },
    });

    instance.addBreadcrumb({
      category: 'navigation',
      message: 'navigated to /transactions',
    });

    const error = new Error('Network timeout');
    instance.captureException(error, {
      routeId: '/transactions',
      requestId: 'req-456',
    });

    expect(captured).toBeDefined();
    expect(captured?.name).toBe('Error');
    expect(captured?.message).toBe('Network timeout');
    expect(captured?.context?.routeId).toBe('/transactions');
    expect(captured?.context?.requestId).toBe('req-456');
    expect(captured?.breadcrumbs).toHaveLength(1);
    expect(captured?.breadcrumbs[0].message).toBe('navigated to /transactions');
  });

  test('records metrics and notifies transports', () => {
    const metrics: TelemetryMetric[] = [];
    instance.addTransport({
      name: 'metric-transport',
      onMetric: metric => metrics.push(metric),
    });

    instance.recordMetric('chat_ttft', 230, 'ms', { status: 'ok' });

    expect(metrics).toHaveLength(1);
    expect(metrics[0].name).toBe('chat_ttft');
    expect(metrics[0].value).toBe(230);
    expect(metrics[0].unit).toBe('ms');
    expect(metrics[0].tags?.status).toBe('ok');
  });

  test('maintains ring buffer limit on breadcrumbs', () => {
    for (let i = 0; i < 60; i++) {
      instance.addBreadcrumb({
        category: 'loop',
        message: `Step ${i}`,
      });
    }

    const breadcrumbs = instance.getBreadcrumbs();
    expect(breadcrumbs.length).toBe(50);
    expect(breadcrumbs[0].message).toBe('Step 10');
    expect(breadcrumbs[49].message).toBe('Step 59');
  });

  test('sanitizes sensitive data in breadcrumbs and error context', () => {
    let captured: CapturedError | undefined;
    instance.addTransport({
      name: 'sanitize-transport',
      onError: err => {
        captured = err;
      },
    });

    instance.addBreadcrumb({
      category: 'auth',
      message: 'login_attempt',
      data: {
        password: 'super-secret-password',
        username: 'alice',
      },
    });

    instance.captureException(new Error('Auth failed'), {
      metadata: {
        token: 'bearer-xyz',
        balance: '999999',
      },
    });

    expect(captured?.breadcrumbs[0].data?.password).toBe('[REDACTED]');
    expect(captured?.breadcrumbs[0].data?.username).toBe('alice');
    expect(captured?.context?.metadata?.token).toBe('[REDACTED]');
    expect(captured?.context?.metadata?.balance).toBe('[REDACTED]');
  });

  test('supports unsubscribing transport', () => {
    let callCount = 0;
    const unsubscribe = instance.addTransport({
      name: 'temp',
      onEvent: () => {
        callCount++;
      },
    });

    instance.recordEvent('first');
    expect(callCount).toBe(1);

    unsubscribe();
    instance.recordEvent('second');
    expect(callCount).toBe(1);
  });
});
