import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { checkLnbitsHealth } from './lib/lnbits/client';
import { RealtimeServer } from './ws/server';
import { startSchedulers } from './workers/scheduler';

async function main(): Promise<void> {
  // Fail fast if LNbits is configured but unhealthy.
  if (env.LNBITS_INVOICE_KEY) {
    const health = await checkLnbitsHealth();
    if (!health.ok) {
      logger.warn(
        { message: health.message },
        'LNbits not reachable — the server will still start, but invoice creation will fail until LNbits is available',
      );
    } else {
      logger.info({ message: health.message }, 'LNbits connected');
    }
  }

  const app = createApp();
  const server = http.createServer(app);

  const realtime = new RealtimeServer(server, { path: '/ws' });

  server.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `Bitcomut backend listening`,
    );
  });

  startSchedulers();

  const shutdown = () => {
    logger.info('Shutting down...');
    realtime.close();
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
