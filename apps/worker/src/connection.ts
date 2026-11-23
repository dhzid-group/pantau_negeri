import { Queue, type ConnectionOptions } from 'bullmq';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env') });

export function redisConnection(): ConnectionOptions {
  const raw = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    username: url.username || undefined,
    password: process.env.REDIS_PASSWORD || url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

export const INGESTION_QUEUE_NAME = 'ingestion-queue';

export const ingestionQueue = new Queue(INGESTION_QUEUE_NAME, {
  connection: redisConnection(),
  defaultJobOptions: {
    removeOnComplete: 200,
    removeOnFail: 100,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  },
});
