import { getPlatformProxy } from 'wrangler';
import { app } from './app';
import { setD1Binding } from './db';
import { env } from './env';
import { logger } from './middleware/logger';

// Local dev runs on Bun, not workerd: expose the local D1 database
// (from wrangler.toml) through the same binding contract as production.
const proxy = await getPlatformProxy<{ CLOUDFLARE_D1_BINDING_NAME: D1Database }>({
  configPath: `${import.meta.dir}/../wrangler.toml`,
});
setD1Binding(proxy.env.CLOUDFLARE_D1_BINDING_NAME);

const server = app.listen(env.PORT, () => {
  logger.info(
    { event: 'server_start', port: env.PORT },
    `Core API running at http://localhost:${env.PORT}`,
  );
});

const shutdown = async (signal: string) => {
  logger.info(
    { event: 'server_shutdown', signal },
    `${signal} received. Shutting down gracefully...`,
  );
  server.stop();
  await proxy.dispose();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
