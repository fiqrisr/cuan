import { app } from './app';
import { pool } from './db';
import { env } from './env';
import { logger } from './middleware/logger';

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
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
