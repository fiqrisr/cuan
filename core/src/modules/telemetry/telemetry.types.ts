export type ClientTelemetryLevel = 'debug' | 'info' | 'warn' | 'error';
export type ClientTelemetryItemType = 'event' | 'metric' | 'error';

export type ClientTelemetryItem = {
  type: ClientTelemetryItemType;
  name: string;
  level?: ClientTelemetryLevel;
  timestamp: number;
  requestId?: string;
  data?: Record<string, unknown>;
  value?: number;
  unit?: string;
  tags?: Record<string, string | number | boolean>;
  stack?: string;
  context?: Record<string, unknown>;
};

export type IngestTelemetryResult = {
  success: boolean;
  processed: number;
};
