import logixlysia from 'logixlysia';

export const logixlysiaLogger = logixlysia();

export const logger = logixlysiaLogger.store.pino;

// export const logger = isDev
//   ? pino(
//       { level: 'debug' },
//       pretty({ colorize: true, translateTime: 'SYS:standard', sync: true }),
//     )
//   : pino({ level: 'info' });
//
// export const loggerMiddleware = new Elysia({ name: 'logger' })
//   .derive(() => ({ startTime: process.hrtime.bigint() }))
//   .onAfterResponse({ as: 'global' }, ({ request, set, startTime }) => {
//     const ms = startTime !== undefined ? Number(process.hrtime.bigint() - startTime) / 1e6 : 0;
//     const status = typeof set.status === 'number' ? set.status : 200;
//     logger.info(
//       { event: 'http_request', method: request.method, url: request.url, status, ms },
//       `${request.method} ${new URL(request.url).pathname} ${status} ${ms.toFixed(2)}ms`,
//     );
//   })
//   .onError({ as: 'global' }, ({ request, error, set }) => {
//     const status = typeof set.status === 'number' ? set.status : 500;
//     logger.error(
//       { event: 'http_error', method: request.method, url: request.url, status, error },
//       `${request.method} ${new URL(request.url).pathname} ${status}`,
//     );
//   });
