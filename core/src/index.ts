import { app } from './app';
import { pool } from './lib/db';
import { env } from './lib/env';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Core API running at http://localhost:${env.PORT}`);
});

const shutdown = async (signal: string) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.stop();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
