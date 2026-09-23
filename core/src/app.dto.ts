import { t } from 'elysia';

export const RootResponseDto = t.Object({
  name: t.String(),
  version: t.String(),
  description: t.String(),
  environment: t.String(),
  health: t.String(),
  timestamp: t.String(),
});

export type RootResponse = typeof RootResponseDto.static;

export const HealthServiceStatusDto = t.Object({
  status: t.Union([t.Literal('healthy'), t.Literal('unhealthy')]),
  latencyMs: t.Optional(t.Number()),
  error: t.Optional(t.String()),
});

export type HealthServiceStatus = typeof HealthServiceStatusDto.static;

export const HealthResponseDto = t.Object({
  status: t.Union([t.Literal('ok'), t.Literal('degraded')]),
  timestamp: t.String(),
  uptime: t.Number(),
  environment: t.String(),
  services: t.Object({
    database: HealthServiceStatusDto,
  }),
});

export type HealthResponse = typeof HealthResponseDto.static;
