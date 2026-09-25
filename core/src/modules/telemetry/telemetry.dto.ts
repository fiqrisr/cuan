import { t } from 'elysia';

export const ClientTelemetryItemDto = t.Object({
  type: t.Union([t.Literal('event'), t.Literal('metric'), t.Literal('error')]),
  name: t.String({ maxLength: 100 }),
  level: t.Optional(
    t.Union([t.Literal('debug'), t.Literal('info'), t.Literal('warn'), t.Literal('error')]),
  ),
  timestamp: t.Number(),
  requestId: t.Optional(t.String({ maxLength: 64 })),
  data: t.Optional(t.Record(t.String(), t.Unknown())),
  value: t.Optional(t.Number()),
  unit: t.Optional(t.String({ maxLength: 20 })),
  tags: t.Optional(t.Record(t.String(), t.Union([t.String(), t.Number(), t.Boolean()]))),
  stack: t.Optional(t.String({ maxLength: 2000 })),
  context: t.Optional(t.Record(t.String(), t.Unknown())),
});

export const IngestTelemetryRequestDto = t.Object({
  items: t.Array(ClientTelemetryItemDto, { maxItems: 50 }),
});

export const IngestTelemetryResponseDto = t.Object({
  success: t.Boolean(),
  processed: t.Number(),
});
