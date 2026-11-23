import { enqueueCatalog, startIngestionWorker } from './ingestionWorker.js';

const worker = startIngestionWorker();
const intervalMs = Number(process.env.INGEST_INTERVAL_MS || 21_600_000);

enqueueCatalog()
  .then((count) => {
    console.log(`[worker] ${count} job masuk ke ingestion-queue`);
  })
  .catch((error: unknown) => {
    console.error('[worker] gagal mengantre katalog', error);
  });

const timer = setInterval(() => {
  enqueueCatalog().catch((error: unknown) => {
    console.error('[worker] gagal mengantre ulang katalog', error);
  });
}, intervalMs);

async function shutdown(): Promise<void> {
  clearInterval(timer);
  await worker.close();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
