export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY_REGEX = /^(password|secret|token|authorization|cookie|apiKey|key)$/i;

function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    if (obj.startsWith('Bearer ') || obj.startsWith('bearer ')) {
      return 'Bearer [REDACTED]';
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitive(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(key)) {
        serialized[key] = '[REDACTED]';
      } else if (value instanceof Error) {
        serialized[key] = {
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      } else {
        serialized[key] = redactSensitive(value, depth + 1);
      }
    }
    return serialized;
  }

  return obj;
}

export type LogContext = {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
};

export type LoggerOptions = {
  minLevel?: LogLevel;
  isDevelopment?: boolean;
};

export class Logger {
  private readonly context: LogContext;
  private readonly minLevel: LogLevel;
  private readonly isDevelopment: boolean;

  constructor(context: LogContext = {}, options?: LoggerOptions | LogLevel) {
    this.context = context;

    if (typeof options === 'string') {
      this.minLevel = options;
      this.isDevelopment =
        typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    } else {
      const envLevel =
        typeof process !== 'undefined'
          ? (process.env?.LOG_LEVEL as LogLevel | undefined)
          : undefined;
      this.minLevel = options?.minLevel ?? envLevel ?? 'info';
      this.isDevelopment =
        options?.isDevelopment ??
        (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development');
    }
  }

  child(childContext: LogContext): Logger {
    return new Logger(
      { ...this.context, ...childContext },
      {
        minLevel: this.minLevel,
        isDevelopment: this.isDevelopment,
      },
    );
  }

  private write(level: LogLevel, dataOrMsg: Record<string, unknown> | string, maybeMsg?: string) {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.minLevel]) return;

    let data: Record<string, unknown> = {};
    let msg = '';

    if (typeof dataOrMsg === 'string') {
      msg = dataOrMsg;
    } else if (typeof dataOrMsg === 'object' && dataOrMsg !== null) {
      data = dataOrMsg;
      msg = maybeMsg ?? '';
    }

    const cleanData = (redactSensitive(data) as Record<string, unknown>) || {};
    const timestamp = new Date().toISOString();

    if (this.isDevelopment) {
      const color =
        level === 'error'
          ? '\x1b[31m'
          : level === 'warn'
            ? '\x1b[33m'
            : level === 'info'
              ? '\x1b[36m'
              : '\x1b[90m';
      const eventTag = cleanData.event ? ` [${cleanData.event}]` : '';
      const reqTag = this.context.requestId ? ` (${this.context.requestId})` : '';

      const { event: _, ...restData } = cleanData;
      const hasRest = Object.keys(restData).length > 0;

      const consoleFn =
        level === 'error'
          ? console.error
          : level === 'warn'
            ? console.warn
            : level === 'debug'
              ? console.debug
              : console.log;

      if (hasRest) {
        consoleFn(
          `${color}${timestamp} ${level.toUpperCase()}\x1b[0m${reqTag}${eventTag}: ${msg}`,
          restData,
        );
      } else {
        consoleFn(`${color}${timestamp} ${level.toUpperCase()}\x1b[0m${reqTag}${eventTag}: ${msg}`);
      }
      return;
    }

    const payload: Record<string, unknown> = {
      level,
      time: timestamp,
      ...this.context,
      ...cleanData,
      msg,
    };

    const line = JSON.stringify(payload);
    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else if (level === 'debug') {
      console.debug(line);
    } else {
      console.log(line);
    }
  }

  debug(dataOrMsg: Record<string, unknown> | string, msg?: string) {
    this.write('debug', dataOrMsg, msg);
  }

  info(dataOrMsg: Record<string, unknown> | string, msg?: string) {
    this.write('info', dataOrMsg, msg);
  }

  warn(dataOrMsg: Record<string, unknown> | string, msg?: string) {
    this.write('warn', dataOrMsg, msg);
  }

  error(dataOrMsg: Record<string, unknown> | string, msg?: string) {
    this.write('error', dataOrMsg, msg);
  }
}

export const rootLogger = new Logger();
export const logger = rootLogger;
