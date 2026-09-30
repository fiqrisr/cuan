import { logger } from '@/middleware/logger';
import type { ClientTelemetryItem } from './telemetry.types';

function sanitizeLogString(str: string, maxLength = 100): string {
  let clean = '';
  for (let i = 0; i < str.length && clean.length < maxLength; i++) {
    const code = str.charCodeAt(i);
    clean += (code >= 0 && code <= 31) || code === 127 ? ' ' : str[i];
  }
  return clean.trim();
}

export class TelemetryService {
  public processBatch(items: ClientTelemetryItem[], clientIp?: string): number {
    let processed = 0;
    const cleanIp = clientIp ? sanitizeLogString(clientIp, 45) : undefined;

    for (const item of items) {
      processed++;
      const itemLevel = item.level ?? (item.type === 'error' ? 'error' : 'info');
      const cleanName = sanitizeLogString(item.name, 100);
      const logPayload = {
        event: `client_${item.type}`,
        telemetryName: cleanName,
        clientTimestamp: item.timestamp,
        clientRequestId: item.requestId ? sanitizeLogString(item.requestId, 64) : undefined,
        clientIp: cleanIp,
        data: item.data,
        value: item.value,
        unit: item.unit ? sanitizeLogString(item.unit, 20) : undefined,
        tags: item.tags,
        context: item.context,
        stack: item.stack ? item.stack.slice(0, 2000) : undefined,
      };

      const logMsg = `[Client ${item.type.toUpperCase()}] ${cleanName}`;
      if (itemLevel === 'error') {
        logger.error(logPayload, logMsg);
      } else if (itemLevel === 'warn') {
        logger.warn(logPayload, logMsg);
      } else if (itemLevel === 'debug') {
        logger.debug(logPayload, logMsg);
      } else {
        logger.info(logPayload, logMsg);
      }
    }

    return processed;
  }
}

export const telemetryService = new TelemetryService();
