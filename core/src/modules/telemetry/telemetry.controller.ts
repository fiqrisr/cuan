import Elysia from 'elysia';
import { IngestTelemetryRequestDto, IngestTelemetryResponseDto } from './telemetry.dto';
import { telemetryService } from './telemetry.service';

export const telemetryController = new Elysia({ prefix: '/api/telemetry' }).post(
  '/',
  ({ body, request }) => {
    const clientIp =
      request.headers.get('cf-connecting-ip') ??
      request.headers.get('x-forwarded-for') ??
      undefined;

    const processed = telemetryService.processBatch(body.items, clientIp);
    return {
      success: true,
      processed,
    };
  },
  {
    body: IngestTelemetryRequestDto,
    response: IngestTelemetryResponseDto,
    detail: { tags: ['Telemetry'] },
  },
);
