import { sanitizeTelemetryData } from './sanitizer';
import type {
  CapturedError,
  ErrorContext,
  TelemetryBreadcrumb,
  TelemetryEvent,
  TelemetryLevel,
  TelemetryMetric,
  TelemetryTransport,
} from './telemetry.types';

const MAX_BREADCRUMBS = 50;

export class Telemetry {
  private breadcrumbs: TelemetryBreadcrumb[] = [];
  private transports: TelemetryTransport[] = [];
  private userId: string | null = null;
  private enabled = true;

  constructor() {
    // Add default console logger transport in development
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      this.addTransport({
        name: 'console-dev',
        onError: captured => {
          console.error(`[Telemetry:Error] ${captured.name}: ${captured.message}`, {
            context: captured.context,
            breadcrumbs: captured.breadcrumbs,
            stack: captured.stack,
          });
        },
        onEvent: event => {
          const logFn =
            event.level === 'error'
              ? console.error
              : event.level === 'warn'
                ? console.warn
                : event.level === 'debug'
                  ? console.debug
                  : console.info;
          logFn(`[Telemetry:Event] ${event.name}`, event.data ?? '');
        },
        onMetric: metric => {
          console.debug(
            `[Telemetry:Metric] ${metric.name}: ${metric.value}${metric.unit ?? ''}`,
            metric.tags,
          );
        },
      });
    }
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setUserId(id: string | null): void {
    this.userId = id;
  }

  public getUserId(): string | null {
    return this.userId;
  }

  public addTransport(transport: TelemetryTransport): () => void {
    this.transports.push(transport);
    return () => {
      this.transports = this.transports.filter(t => t !== transport);
    };
  }

  public getTransports(): TelemetryTransport[] {
    return [...this.transports];
  }

  public addBreadcrumb(breadcrumb: Omit<TelemetryBreadcrumb, 'timestamp'>): void {
    if (!this.enabled) return;

    const sanitizedData = breadcrumb.data ? sanitizeTelemetryData(breadcrumb.data) : undefined;
    const entry: TelemetryBreadcrumb = {
      ...breadcrumb,
      data: sanitizedData,
      timestamp: Date.now(),
    };

    this.breadcrumbs.push(entry);
    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  public getBreadcrumbs(): TelemetryBreadcrumb[] {
    return [...this.breadcrumbs];
  }

  public clearBreadcrumbs(): void {
    this.breadcrumbs = [];
  }

  public captureException(error: unknown, context?: ErrorContext): CapturedError {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    const sanitizedContext = context ? sanitizeTelemetryData(context) : undefined;

    const captured: CapturedError = {
      name: errorObj.name || 'Error',
      message: errorObj.message || 'Unknown error',
      stack: errorObj.stack,
      context: sanitizedContext,
      breadcrumbs: this.getBreadcrumbs(),
      timestamp: Date.now(),
    };

    if (this.enabled) {
      for (const transport of this.transports) {
        try {
          transport.onError?.(captured);
        } catch (transportError) {
          console.error('[Telemetry] Transport failed to handle error:', transportError);
        }
      }
    }

    return captured;
  }

  public recordEvent(
    name: string,
    data?: Record<string, unknown>,
    level: TelemetryLevel = 'info',
    requestId?: string,
  ): TelemetryEvent {
    const sanitizedData = data ? sanitizeTelemetryData(data) : undefined;
    const event: TelemetryEvent = {
      name,
      data: sanitizedData,
      level,
      timestamp: Date.now(),
      requestId,
    };

    // Also record event as a breadcrumb
    this.addBreadcrumb({
      category: 'event',
      message: name,
      data: sanitizedData,
      level,
    });

    if (this.enabled) {
      for (const transport of this.transports) {
        try {
          transport.onEvent?.(event);
        } catch (transportError) {
          console.error('[Telemetry] Transport failed to handle event:', transportError);
        }
      }
    }

    return event;
  }

  public recordMetric(
    name: string,
    value: number,
    unit?: TelemetryMetric['unit'],
    tags?: Record<string, string | number | boolean>,
  ): TelemetryMetric {
    const metric: TelemetryMetric = {
      name,
      value,
      unit,
      tags,
      timestamp: Date.now(),
    };

    if (this.enabled) {
      for (const transport of this.transports) {
        try {
          transport.onMetric?.(metric);
        } catch (transportError) {
          console.error('[Telemetry] Transport failed to handle metric:', transportError);
        }
      }
    }

    return metric;
  }

  public reset(): void {
    this.breadcrumbs = [];
    this.userId = null;
    this.enabled = true;
  }
}

export const telemetry = new Telemetry();
