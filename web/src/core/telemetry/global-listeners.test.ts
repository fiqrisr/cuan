import { describe, expect, test } from 'bun:test';
import { setupGlobalErrorListeners } from './global-listeners';
import { telemetry } from './telemetry';
import type { CapturedError } from './telemetry.types';

type WindowHolder = {
  window?: unknown;
};

describe('Global Error Listeners', () => {
  test('returns no-op cleanup when window is undefined', () => {
    const scope = globalThis as WindowHolder;
    const originalWindow = scope.window;
    try {
      delete scope.window;
      const cleanup = setupGlobalErrorListeners();
      expect(typeof cleanup).toBe('function');
      expect(() => cleanup()).not.toThrow();
    } finally {
      if (originalWindow !== undefined) {
        scope.window = originalWindow;
      }
    }
  });

  test('attaches and removes window listeners when window exists', () => {
    let captured: CapturedError | undefined;
    const unsubscribeTransport = telemetry.addTransport({
      name: 'global-err-test',
      onError: err => {
        captured = err;
      },
    });

    const mockWindow = new EventTarget();
    const scope = globalThis as WindowHolder;
    const originalWindow = scope.window;
    scope.window = mockWindow;

    const removeListeners = setupGlobalErrorListeners();

    try {
      const errorEvent = new Event('error');
      Object.assign(errorEvent, {
        error: new Error('Simulated runtime error'),
        message: 'Simulated runtime error',
        filename: 'app.js',
        lineno: 42,
        colno: 10,
      });

      mockWindow.dispatchEvent(errorEvent);

      expect(captured).toBeDefined();
      expect(captured?.message).toBe('Simulated runtime error');
      expect(captured?.context?.metadata?.filename).toBe('app.js');
      expect(captured?.context?.metadata?.lineno).toBe(42);

      captured = undefined;
      removeListeners();

      mockWindow.dispatchEvent(errorEvent);
      expect(captured).toBeUndefined();
    } finally {
      unsubscribeTransport();
      removeListeners();
      if (originalWindow !== undefined) {
        scope.window = originalWindow;
      } else {
        delete scope.window;
      }
    }
  });
});
