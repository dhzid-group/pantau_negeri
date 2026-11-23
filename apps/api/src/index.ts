import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import nodemailer from 'nodemailer';
import { and, desc, eq, like, or } from 'drizzle-orm';
import {
  db,
  anomalyFlags,
  citizenSolutionPlaybooks,
  economicIndicators,
  economicScores,
  institutions,
  canonicalEntities,
  entityRelationships,
  macroEventsAndNews,
  procurements,
  userWatchlists,
  alertNotifications,
  officialClarifications,
} from 'pantau-db';

const ANOMALY_DISCLAIMER = 'Catatan: Penandaan ini dihasilkan secara otomatis oleh algoritma statistik berdasarkan perbandingan data publik resmi. Indikator ini bukan merupakan vonis hukum, tuduhan pidana, maupun bukti pelanggaran.';
const ECONOMIC_DISCLAIMER = 'Catatan: Skor ekonomi dan rekomendasi solusi merupakan informasi edukasi literasi keuangan publik berbasis data makro terbuka, bukan rekomendasi investasi atau nasihat keuangan berizin (OJK).';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(swagger, { openapi: { info: { title: 'PantauNegeri API', version: '1.0.0' } } });

app.get('/api/v1/health', async () => ({ status: 'ok', stage: 4 }));

app.get('/api/v1/dashboard', async () => {
  const [institutionRows, scoreRows, anomalyRows, procurementRows, activePlaybooks] = await Promise.all([
    db.select().from(institutions),
    db.select().from(economicScores).orderBy(desc(economicScores.evaluationDate)).limit(1),
    db.select().from(anomalyFlags).orderBy(desc(anomalyFlags.createdAt)).limit(20),
    db.select().from(procurements).orderBy(desc(procurements.createdAt)).limit(10),
    db.select().from(citizenSolutionPlaybooks).where(eq(citizenSolutionPlaybooks.isActive, 'YES')),
  ]);
  return {
    institutions: institutionRows.length,
    economicScore: scoreRows[0] ?? null,
    recentAnomalies: anomalyRows,
    recentProcurements: procurementRows,
    activePlaybooks,
    disclaimers: { anomaly: ANOMALY_DISCLAIMER, economic: ECONOMIC_DISCLAIMER },
  };
});

app.get('/api/v1/institutions', async (request) => {
  const query = (request.query as { q?: string }).q;
  if (query) {
    return db.select().from(institutions).where(or(like(institutions.name, `%${query}%`), like(institutions.code, `%${query}%`))).limit(100);
  }
  return db.select().from(institutions).limit(100);
});

app.get('/api/v1/search', async (request) => {
  const q = ((request.query as { q?: string }).q || '').trim();
  if (!q) return { query: '', institutions: [], entities: [], procurements: [] };
  const pattern = `%${q}%`;
  const [institutionRows, entityRows, procurementRows] = await Promise.all([
    db.select().from(institutions).where(or(like(institutions.name, pattern), like(institutions.code, pattern))).limit(10),
    db.select().from(canonicalEntities).where(or(like(canonicalEntities.displayName, pattern), like(canonicalEntities.normalizedName, pattern))).limit(20),
    db.select().from(procurements).where(like(procurements.packageName, pattern)).limit(20),
  ]);
  return { query: q, institutions: institutionRows, entities: entityRows, procurements: procurementRows };
});

app.get('/api/v1/anomalies', async (request) => {
  const query = request.query as { risk?: 'LOW' | 'MEDIUM' | 'HIGH'; status?: 'OPEN' | 'UNDER_REVIEW' | 'CLARIFIED' | 'RESOLVED' };
  const filters = [];
  if (query.risk) filters.push(eq(anomalyFlags.riskLevel, query.risk));
  if (query.status) filters.push(eq(anomalyFlags.status, query.status));
  const rows = filters.length
    ? await db.select().from(anomalyFlags).where(and(...filters)).orderBy(desc(anomalyFlags.createdAt)).limit(100)
    : await db.select().from(anomalyFlags).orderBy(desc(anomalyFlags.createdAt)).limit(100);
  return { disclaimer: ANOMALY_DISCLAIMER, items: rows };
});

app.post('/api/v1/anomalies/:id/clarifications', async (request, reply) => {
  const flagId = Number((request.params as { id: string }).id);
  const body = request.body as Record<string, unknown>;
  if (!Number.isInteger(flagId) || flagId <= 0) {
    reply.code(400);
    return { message: 'ID anomali tidak valid' };
  }
  if (typeof body.clarifierName !== 'string' || typeof body.clarifierRole !== 'string' || typeof body.clarificationText !== 'string') {
    reply.code(400);
    return { message: 'Nama, jabatan/instansi, dan isi klarifikasi wajib diisi' };
  }
  await db.insert(officialClarifications).values({
    anomalyFlagId: flagId,
    clarifierName: body.clarifierName,
    clarifierRole: body.clarifierRole,
    clarificationText: body.clarificationText,
    officialDocumentUrl: typeof body.officialDocumentUrl === 'string' ? body.officialDocumentUrl : null,
    isVerified: 'PENDING',
  });
  reply.code(201);
  return { status: 'PENDING', message: 'Klarifikasi resmi tercatat dan menunggu verifikasi.' };
});

app.get('/api/v1/economy/latest', async () => {
  const [scores, indicators, playbooks, timeline] = await Promise.all([
    db.select().from(economicScores).orderBy(desc(economicScores.evaluationDate)).limit(12),
    db.select().from(economicIndicators).orderBy(desc(economicIndicators.periodDate)).limit(300),
    db.select().from(citizenSolutionPlaybooks).where(eq(citizenSolutionPlaybooks.isActive, 'YES')),
    db.select().from(macroEventsAndNews).orderBy(desc(macroEventsAndNews.publishedDate)).limit(50),
  ]);
  return { scores, indicators, activePlaybooks: playbooks, timeline, disclaimer: ECONOMIC_DISCLAIMER };
});

app.get('/api/v1/economy/playbooks', async () => ({ disclaimer: ECONOMIC_DISCLAIMER, items: await db.select().from(citizenSolutionPlaybooks) }));

app.get('/api/v1/graph/:entityId', async (request, reply) => {
  const entityId = Number((request.params as { entityId: string }).entityId);
  if (!Number.isInteger(entityId) || entityId <= 0) {
    reply.code(400);
    return { message: 'entityId harus berupa bilangan positif' };
  }
  const center = await db.select().from(canonicalEntities).where(eq(canonicalEntities.id, entityId)).limit(1);
  if (center.length === 0) {
    reply.code(404);
    return { message: 'Entitas tidak ditemukan' };
  }
  const relationships = await db.select().from(entityRelationships).where(or(
    eq(entityRelationships.sourceEntityId, entityId),
    eq(entityRelationships.targetEntityId, entityId)
  )).limit(100);
  const neighborIds = [...new Set(relationships.flatMap((row) => [row.sourceEntityId, row.targetEntityId]))];
  const nodes = await Promise.all(neighborIds.map((id) => db.select().from(canonicalEntities).where(eq(canonicalEntities.id, id)).limit(1)));
  return {
    center: center[0],
    nodes: nodes.flat().map((node) => ({ id: String(node.id), label: node.displayName, type: node.type })),
    edges: relationships.map((edge) => ({ id: String(edge.id), source: String(edge.sourceEntityId), target: String(edge.targetEntityId), relationType: edge.relationType, weight: edge.weight })),
  };
});

app.get('/api/v1/watchlists', async (request) => {
  const userId = (request.query as { userId?: string }).userId || 'public';
  return db.select().from(userWatchlists).where(eq(userWatchlists.userId, userId));
});

app.post('/api/v1/watchlists', async (request, reply) => {
  const body = request.body as Record<string, unknown>;
  const required = ['watchlistName', 'notificationChannel', 'targetDestination'];
  if (required.some((key) => typeof body[key] !== 'string' || !(body[key] as string).trim())) {
    reply.code(400);
    return { message: 'watchlistName, notificationChannel, dan targetDestination wajib diisi' };
  }
  const channel = body.notificationChannel as 'EMAIL' | 'WEBHOOK' | 'RSS';
  if (!['EMAIL', 'WEBHOOK', 'RSS'].includes(channel)) {
    reply.code(400);
    return { message: 'Channel tidak valid' };
  }
  const result = await db.insert(userWatchlists).values({
    userId: typeof body.userId === 'string' ? body.userId : 'public',
    watchlistName: String(body.watchlistName),
    institutionId: typeof body.institutionId === 'number' ? body.institutionId : null,
    keyword: typeof body.keyword === 'string' ? body.keyword : null,
    minProcurementValue: typeof body.minProcurementValue === 'number' ? String(body.minProcurementValue) : null,
    minRiskLevel: body.minRiskLevel === 'LOW' || body.minRiskLevel === 'HIGH' ? body.minRiskLevel : 'MEDIUM',
    economicScenarioCode: typeof body.economicScenarioCode === 'string' ? body.economicScenarioCode : null,
    notificationChannel: channel,
    targetDestination: String(body.targetDestination),
  });
  return reply.code(201).send({ id: Number((result as unknown as { insertId?: number }).insertId), status: 'created' });
});

app.get('/api/v1/watchlists/:id/rss', async (request, reply) => {
  const id = Number((request.params as { id: string }).id);
  const watchlist = await db.select().from(userWatchlists).where(eq(userWatchlists.id, id)).limit(1);
  if (watchlist.length === 0) {
    reply.code(404);
    return 'Watchlist tidak ditemukan';
  }
  reply.header('content-type', 'application/rss+xml; charset=utf-8');
  const items = await db.select().from(anomalyFlags).orderBy(desc(anomalyFlags.createdAt)).limit(20);
  return `<?xml version="1.0"?><rss version="2.0"><channel><title>PantauNegeri — ${watchlist[0].watchlistName}</title><link>http://localhost:4000/api/v1/watchlists/${id}/rss</link><description>Umpan pantaunegeri. ${ANOMALY_DISCLAIMER}</description>${items.map((item) => `<item><title>Indikator Anomali Statistik — ${item.riskLevel}</title><description>${ANOMALY_DISCLAIMER}</description></item>`).join('')}</channel></rss>`;
});

app.post('/api/v1/watchlists/:id/test-notify', async (request, reply) => {
  const id = Number((request.params as { id: string }).id);
  const watchlist = await db.select().from(userWatchlists).where(eq(userWatchlists.id, id)).limit(1);
  if (watchlist.length === 0) {
    reply.code(404);
    return { message: 'Watchlist tidak ditemukan' };
  }
  const row = watchlist[0];
  let deliveryStatus: 'SENT' | 'FAILED' = 'SENT';
  let errorMessage: string | null = null;
  try {
    if (row.notificationChannel === 'EMAIL' && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });
      await transporter.sendMail({ from: process.env.SMTP_FROM, to: row.targetDestination, subject: `[PantauNegeri] ${row.watchlistName}`, text: `${ANOMALY_DISCLAIMER}\n\nTes peringatan watchlist.` });
    } else if (row.notificationChannel === 'WEBHOOK') {
      const response = await fetch(row.targetDestination, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: row.watchlistName, message: 'Tes peringatan PantauNegeri.', disclaimer: ANOMALY_DISCLAIMER }) });
      if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`);
    }
  } catch (error) {
    deliveryStatus = 'FAILED';
    errorMessage = error instanceof Error ? error.message : String(error);
  }
  await db.insert(alertNotifications).values({
    watchlistId: id,
    title: `[Tes] ${row.watchlistName}`,
    messageBody: 'Tes peringatan watchlist PantauNegeri.',
    legalDisclaimer: ANOMALY_DISCLAIMER,
    channelUsed: row.notificationChannel,
    deliveryStatus,
    errorMessage,
    sentAt: deliveryStatus === 'SENT' ? new Date() : null,
  });
  return { deliveryStatus, errorMessage };
});

await app.listen({ port: Number(process.env.API_PORT || 4000), host: '0.0.0.0' });
