import { logger } from '@/middleware/logger';
import type { ClientTelemetryItem } from './telemetry.types';

export class TelemetryService {
  public processBatch(items: ClientTelemetryItem[], clientIp?: string): number {
    let processed = 0;

    for (const item of items) {
      processed++;
      const itemLevel = item.level ?? (item.type === 'error' ? 'error' : 'info');
      const logPayload = {
        event: `client_${item.type}`,
        telemetryName: item.name,
        clientTimestamp: item.timestamp,
        clientRequestId: item.requestId,
        clientIp,
        data: item.data,
        value: item.value,
        unit: item.unit,
        tags: item.tags,
        context: item.context,
        stack: item.stack,
      };

      const logMsg = `[Client ${item.type.toUpperCase()}] ${item.name}`;

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
