export type TelemetryLevel = 'debug' | 'info' | 'warn' | 'error';

export type TelemetryBreadcrumb = {
  category: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: number;
  level?: TelemetryLevel;
};

export type TelemetryEvent = {
  name: string;
  data?: Record<string, unknown>;
  level: TelemetryLevel;
  timestamp: number;
  requestId?: string;
};

export type TelemetryMetric = {
  name: string;
  value: number;
  unit?: 'ms' | 'count' | 'ratio' | 'bytes';
  tags?: Record<string, string | number | boolean>;
  timestamp: number;
};

export type ErrorContext = {
  componentStack?: string;
  routeId?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export type CapturedError = {
  name: string;
  message: string;
  stack?: string;
  context?: ErrorContext;
  breadcrumbs: TelemetryBreadcrumb[];
  timestamp: number;
};

export type TelemetryTransport = {
  name: string;
  onError?: (captured: CapturedError) => void;
  onEvent?: (event: TelemetryEvent) => void;
  onMetric?: (metric: TelemetryMetric) => void;
};
