import { Worker, type Job } from 'bullmq';
import { db, ingestionLogs, institutions } from 'pantau-db';
import { eq } from 'drizzle-orm';
import type { IngestionJobResult } from 'pantau-shared';
import { INGESTION_QUEUE_NAME, ingestionQueue, redisConnection } from './connection.js';
import { handleDocument, handleEconomy, handleOpenData, handleProcurement, handleRss } from './handlers.js';
import {
  configuredDocumentSources,
  configuredEconomySources,
  configuredProcurementSources,
  OPEN_DATA_SOURCES,
  RSS_SOURCES,
} from './sources.js';
import { processAnomalyAnalysis, processEconomicAnalysis } from './anomalyEconomicProcessor.js';

async function writeLog(result: IngestionJobResult, durationMs: number): Promise<void> {
  let institutionId: number | null = null;
  if (result.institutionCode) {
    const rows = await db
      .select({ id: institutions.id })
      .from(institutions)
      .where(eq(institutions.code, result.institutionCode))
      .limit(1);
    institutionId = rows[0]?.id ?? null;
  }

  await db.insert(ingestionLogs).values({
    institutionId,
    sourceEndpoint: result.sourceEndpoint.slice(0, 255),
    status: result.status,
    newRecordsCount: result.newRecordsCount,
    rawPayloadHash: result.rawPayloadHash,
    errorMessage: result.errorMessage ?? null,
    durationMs,
  });
}

async function dispatch(job: Job): Promise<IngestionJobResult> {
  switch (job.name) {
    case 'open-data': {
      const result = await handleOpenData(job.data);
      for (const pdfUrl of result.pdfUrls) {
        await ingestionQueue.add('document', {
          institutionCode: job.data.institutionCode,
          sourceUrl: pdfUrl,
          docType: 'REGULASI',
          docNumber: `OD-${pdfUrl.slice(-40)}`,
          title: `Dokumen terbuka ${job.data.institutionCode}`,
        });
      }
      return result;
    }
    case 'procurement':
      return handleProcurement(job.data).then(async (result) => {
        await processAnomalyAnalysis();
        return result;
      });
    case 'economy':
      return handleEconomy(job.data).then(async (result) => {
        await processEconomicAnalysis();
        return result;
      });
    case 'rss':
      return handleRss(job.data);
    case 'document':
      return handleDocument(job.data);
    default:
      return {
        sourceEndpoint: job.name,
        status: 'FAILED',
        newRecordsCount: 0,
        rawPayloadHash: null,
        errorMessage: `Job tidak dikenal: ${job.name}`,
      };
  }
}

export function startIngestionWorker(): Worker {
  const worker = new Worker(
    INGESTION_QUEUE_NAME,
    async (job) => {
      const started = Date.now();
      let logged = false;
      try {
        const result = await dispatch(job);
        await writeLog(result, Date.now() - started);
        logged = true;
        const retryable = result.status === 'RATE_LIMITED'
          || /timeout|fetch|ECONN|HTTP 5/i.test(result.errorMessage || '');
        if (retryable) {
          throw new Error(result.errorMessage || 'Ingest gagal sementara');
        }
        return result;
      } catch (error) {
        if (!logged) {
          const message = error instanceof Error ? error.message : String(error);
          await writeLog(
            {
              sourceEndpoint: String(job.data?.endpoint || job.data?.feedUrl || job.data?.sourceUrl || job.name),
              status: 'FAILED',
              newRecordsCount: 0,
              rawPayloadHash: null,
              errorMessage: message,
              institutionCode: job.data?.institutionCode,
            },
            Date.now() - started
          ).catch(() => undefined);
        }
        throw error;
      }
    },
    { connection: redisConnection(), concurrency: 1 }
  );

  worker.on('failed', (job, error) => {
    console.error(`[worker] job ${job?.name} gagal: ${error.message}`);
  });
  worker.on('completed', (job) => {
    console.log(`[worker] job ${job.name} selesai`);
  });
  return worker;
}

export async function enqueueCatalog(): Promise<number> {
  const bucket = Math.floor(Date.now() / Number(process.env.INGEST_INTERVAL_MS || 21_600_000));
  const jobs: Array<Promise<unknown>> = [];

  for (const source of OPEN_DATA_SOURCES) {
    jobs.push(ingestionQueue.add('open-data', source, { jobId: `open-data:${source.institutionCode}:${bucket}` }));
  }
  for (const source of configuredProcurementSources()) {
    jobs.push(ingestionQueue.add('procurement', source, { jobId: `procurement:${source.institutionCode}:${bucket}` }));
  }
  for (const source of configuredEconomySources()) {
    jobs.push(ingestionQueue.add('economy', source, { jobId: `economy:${source.indicatorCode}:${source.source}:${bucket}` }));
  }
  for (const source of RSS_SOURCES) {
    jobs.push(ingestionQueue.add('rss', source, { jobId: `rss:${source.publisher}:${source.category}:${bucket}` }));
  }
  for (const source of configuredDocumentSources()) {
    jobs.push(ingestionQueue.add('document', source, { jobId: `document:${source.docNumber}:${bucket}` }));
  }

  await Promise.all(jobs);
  return jobs.length;
}
