import { API_BASE_URL } from '../http/base-url';
import type {
  CapturedError,
  TelemetryEvent,
  TelemetryMetric,
  TelemetryTransport,
} from './telemetry.types';

export type ClientTelemetryPayloadItem = {
  type: 'event' | 'metric' | 'error';
  name: string;
  level?: 'debug' | 'info' | 'warn' | 'error';
  timestamp: number;
  requestId?: string;
  data?: Record<string, unknown>;
  value?: number;
  unit?: string;
  tags?: Record<string, string | number | boolean>;
  stack?: string;
  context?: Record<string, unknown>;
};

export type HttpTransportOptions = {
  endpoint?: string;
  maxBatchSize?: number;
  flushIntervalMs?: number;
  enabled?: boolean;
};

export class HttpTelemetryTransport implements TelemetryTransport {
  public readonly name = 'http-beacon';
  private buffer: ClientTelemetryPayloadItem[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private endpoint: string;
  private maxBatchSize: number;
  private flushIntervalMs: number;
  private enabled: boolean;
  private cleanupListeners: (() => void) | null = null;

  constructor(options?: HttpTransportOptions) {
    this.endpoint = options?.endpoint ?? `${API_BASE_URL}/api/telemetry`;
    this.maxBatchSize = options?.maxBatchSize ?? 20;
    this.flushIntervalMs = options?.flushIntervalMs ?? 10_000;
    this.enabled = options?.enabled ?? true;

    if (this.enabled && typeof window !== 'undefined') {
      this.timer = setInterval(() => this.flush(), this.flushIntervalMs);

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          this.flush();
        }
      };

      const handlePageHide = () => {
        this.flush();
      };

      window.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('pagehide', handlePageHide);

      this.cleanupListeners = () => {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('pagehide', handlePageHide);
      };
    }
  }

  public onError(captured: CapturedError): void {
    if (!this.enabled) return;
    this.queueItem({
      type: 'error',
      name: captured.name,
      level: 'error',
      timestamp: captured.timestamp,
      stack: captured.stack,
      context: {
        message: captured.message,
        ...captured.context,
      },
    });
    // Immediately flush on errors for fast diagnosis
    this.flush();
  }

  public onEvent(event: TelemetryEvent): void {
    if (!this.enabled) return;
    this.queueItem({
      type: 'event',
      name: event.name,
      level: event.level,
      timestamp: event.timestamp,
      requestId: event.requestId,
      data: event.data,
    });
  }

  public onMetric(metric: TelemetryMetric): void {
    if (!this.enabled) return;
    this.queueItem({
      type: 'metric',
      name: metric.name,
      value: metric.value,
      unit: metric.unit,
      tags: metric.tags,
      timestamp: metric.timestamp,
    });
  }

  public queueItem(item: ClientTelemetryPayloadItem): void {
    this.buffer.push(item);
    if (this.buffer.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  public flush(): void {
    if (this.buffer.length === 0) return;

    const itemsToSend = this.buffer.splice(0, this.maxBatchSize);
    const payload = JSON.stringify({ items: itemsToSend });

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      const sent = navigator.sendBeacon(this.endpoint, blob);
      if (sent) return;
    }

    // Fallback to fetch with keepalive
    if (typeof fetch === 'function') {
      fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'omit',
      }).catch(err => {
        // Drop quietly on network failure to avoid error loops
        if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
          console.debug('[Telemetry:HttpTransport] Failed to flush telemetry batch:', err);
        }
      });
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.cleanupListeners) {
      this.cleanupListeners();
      this.cleanupListeners = null;
    }
    this.flush();
  }
}

export function createHttpTelemetryTransport(
  options?: HttpTransportOptions,
): HttpTelemetryTransport {
  return new HttpTelemetryTransport(options);
}
