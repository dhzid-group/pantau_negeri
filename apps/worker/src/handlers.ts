import { eq } from 'drizzle-orm';
import {
  canonicalEntities,
  db,
  entityRelationships,
  institutions,
  macroEventsAndNews,
  procurements,
  regulationsAndDocuments,
  economicIndicators,
} from 'pantau-db';
import {
  ethicalFetchBuffer,
  ethicalFetchJson,
  extractTextFromPdf,
  hashMappedRecord,
  mapProcurementRecord,
  mapRssItems,
  mapSimpleIndicator,
  mapWorldBankSeries,
  parseRssItems,
  resolveCanonicalEntity,
  type AuditStamp,
  type CanonicalCandidate,
  type DocumentType,
  type EntityType,
  type IngestionJobResult,
  type MappedIndicator,
  type MappedNewsItem,
  type MappedProcurement,
} from 'pantau-shared';
import type { EconomySource } from './sources.js';

const MAX_PDF_FOLLOWUPS = 3;

async function findInstitution(code: string) {
  const rows = await db.select().from(institutions).where(eq(institutions.code, code)).limit(1);
  return rows[0] ?? null;
}

async function loadCandidates(type: EntityType): Promise<CanonicalCandidate[]> {
  const rows = await db.select().from(canonicalEntities).where(eq(canonicalEntities.type, type));
  return rows.map((row) => ({
    id: row.id,
    normalizedName: row.normalizedName,
    displayName: row.displayName,
    type: row.type,
    aliases: row.aliases ?? [],
  }));
}

async function upsertCanonical(rawName: string, type: EntityType): Promise<number | null> {
  const candidates = await loadCandidates(type);
  const resolved = resolveCanonicalEntity(rawName, type, candidates);
  if (!resolved.normalizedName) return null;

  if (resolved.matched && resolved.canonicalId) {
    const current = candidates.find((item) => item.id === resolved.canonicalId);
    const aliases = current?.aliases ?? [];
    if (current && !aliases.some((alias) => alias.toLowerCase() === rawName.trim().toLowerCase())) {
      await db
        .update(canonicalEntities)
        .set({ aliases: [...aliases, rawName.trim()] })
        .where(eq(canonicalEntities.id, resolved.canonicalId));
    }
    return resolved.canonicalId;
  }

  const inserted = await db.insert(canonicalEntities).values({
    normalizedName: resolved.normalizedName,
    displayName: rawName.trim(),
    type,
    aliases: [rawName.trim()],
  });
  return Number(inserted[0].insertId);
}

function failure(endpoint: string, message: string, hash: string | null, status: IngestionJobResult['status'] = 'FAILED'): IngestionJobResult {
  return {
    sourceEndpoint: endpoint,
    status,
    newRecordsCount: 0,
    rawPayloadHash: hash,
    errorMessage: message,
  };
}

function statusFromHttp(httpStatus?: number): IngestionJobResult['status'] {
  return httpStatus === 429 ? 'RATE_LIMITED' : 'FAILED';
}

export async function handleOpenData(input: { institutionCode: string; endpoint: string }): Promise<IngestionJobResult & { pdfUrls: string[] }> {
  const institution = await findInstitution(input.institutionCode);
  if (!institution) {
    return { ...failure(input.endpoint, `Lembaga ${input.institutionCode} belum ada di tabel institutions`, null), pdfUrls: [] };
  }

  const fetched = await ethicalFetchJson(input.endpoint);
  if (!fetched.success) {
    return {
      ...failure(input.endpoint, fetched.errorMessage || 'Gagal menarik data.go.id', fetched.payloadHash || null, statusFromHttp(fetched.httpStatus)),
      institutionCode: input.institutionCode,
      pdfUrls: [],
    };
  }

  const body = fetched.data as { result?: { results?: Array<{ title?: string; resources?: Array<{ format?: string; url?: string }> }> } };
  const packages = body?.result?.results ?? [];
  await upsertCanonical(institution.name, 'INSTITUTION');

  await db
    .update(institutions)
    .set({ lastSyncStatus: 'SUCCESS', lastSyncedAt: fetched.fetchedAt })
    .where(eq(institutions.id, institution.id));

  return {
    institutionCode: input.institutionCode,
    sourceEndpoint: input.endpoint,
    status: 'SUCCESS',
    newRecordsCount: packages.length,
    rawPayloadHash: fetched.payloadHash,
    pdfUrls: listPdfResources(fetched.data),
  };
}

export function listPdfResources(payload: unknown): string[] {
  const body = payload as { result?: { results?: Array<{ resources?: Array<{ format?: string; url?: string }> }> } };
  const urls: string[] = [];
  for (const item of body?.result?.results ?? []) {
    for (const resource of item.resources ?? []) {
      const format = (resource.format || '').toLowerCase();
      if ((format === 'pdf' || resource.url?.toLowerCase().endsWith('.pdf')) && resource.url) {
        urls.push(resource.url);
      }
    }
  }
  return urls.slice(0, MAX_PDF_FOLLOWUPS);
}

async function insertProcurement(institutionId: number, vendorEntityId: number | null, row: MappedProcurement, audit: AuditStamp) {
  const existing = await db
    .select({ id: procurements.id })
    .from(procurements)
    .where(eq(procurements.rawPayloadHash, audit.rawPayloadHash))
    .limit(1);
  if (existing.length > 0) return false;

  await db.insert(procurements).values({
    institutionId,
    vendorEntityId,
    tenderCode: row.tenderCode,
    packageName: row.packageName,
    procurementMethod: row.procurementMethod,
    hpsValue: row.hpsValue,
    contractValue: row.contractValue,
    rawWinnerName: row.rawWinnerName,
    announcedDate: row.announcedDate,
    contractDate: row.contractDate,
    fiscalYear: row.fiscalYear,
    sourceUrl: audit.sourceUrl,
    rawPayloadHash: audit.rawPayloadHash,
    fetchedAt: audit.fetchedAt,
  });
  return true;
}

export async function handleProcurement(input: { institutionCode: string; endpoint: string }): Promise<IngestionJobResult> {
  const institution = await findInstitution(input.institutionCode);
  if (!institution) return failure(input.endpoint, `Lembaga ${input.institutionCode} belum ada di tabel institutions`, null);

  const fetched = await ethicalFetchJson<unknown>(input.endpoint);
  if (!fetched.success || fetched.data === undefined) {
    return failure(input.endpoint, fetched.errorMessage || 'Gagal menarik data pengadaan', fetched.payloadHash || null, statusFromHttp(fetched.httpStatus));
  }

  const list = Array.isArray(fetched.data)
    ? fetched.data
    : fetched.data && typeof fetched.data === 'object' && Array.isArray((fetched.data as { data?: unknown[] }).data)
      ? (fetched.data as { data: unknown[] }).data
      : [];

  const institutionEntityId = await upsertCanonical(institution.name, 'INSTITUTION');
  let inserted = 0;

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const mapped = mapProcurementRecord(item as Record<string, unknown>, fetched.sourceUrl);
    if (!mapped) continue;
    const audit: AuditStamp = {
      sourceUrl: mapped.sourceUrl,
      rawPayloadHash: hashMappedRecord(mapped),
      fetchedAt: fetched.fetchedAt,
    };
    const vendorId = mapped.rawWinnerName ? await upsertCanonical(mapped.rawWinnerName, 'VENDOR') : null;
    const created = await insertProcurement(institution.id, vendorId, mapped, audit);
    if (!created) continue;
    inserted += 1;

    if (vendorId && institutionEntityId) {
      await db.insert(entityRelationships).values({
        sourceEntityId: vendorId,
        targetEntityId: institutionEntityId,
        relationType: 'memenangkan_tender_di',
        weight: mapped.contractValue,
        referenceTable: 'procurements',
        year: mapped.fiscalYear,
        metadata: { sourceUrl: audit.sourceUrl, rawPayloadHash: audit.rawPayloadHash },
      });
    }
  }

  return {
    institutionCode: input.institutionCode,
    sourceEndpoint: input.endpoint,
    status: 'SUCCESS',
    newRecordsCount: inserted,
    rawPayloadHash: fetched.payloadHash,
  };
}

async function storeIndicators(rows: MappedIndicator[], auditBase: { hash: string; fetchedAt: Date }): Promise<number> {
  let inserted = 0;
  for (const row of rows) {
    const hash = hashMappedRecord(row);
    const existing = await db
      .select({ id: economicIndicators.id })
      .from(economicIndicators)
      .where(eq(economicIndicators.rawPayloadHash, hash))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(economicIndicators).values({
      indicatorCode: row.indicatorCode,
      indicatorName: row.indicatorName,
      value: row.value,
      unit: row.unit,
      periodDate: row.periodDate,
      source: row.source,
      sourceUrl: row.sourceUrl,
      rawPayloadHash: hash,
      fetchedAt: auditBase.fetchedAt,
    });
    inserted += 1;
  }
  return inserted;
}

export async function handleEconomy(source: EconomySource): Promise<IngestionJobResult> {
  if (source.kind === 'bps' && (!process.env.BPS_API_KEY || process.env.BPS_API_KEY === 'CHANGE_ME')) {
    return failure(source.endpoint, 'BPS_API_KEY belum diisi', null);
  }

  const fetched = await ethicalFetchJson(source.endpoint);
  if (!fetched.success || fetched.data === undefined) {
    return failure(source.endpoint, fetched.errorMessage || 'Gagal menarik indikator ekonomi', fetched.payloadHash || null, statusFromHttp(fetched.httpStatus));
  }

  const rows = source.kind === 'world-bank'
    ? mapWorldBankSeries(fetched.data, {
        indicatorCode: source.indicatorCode,
        indicatorName: source.indicatorName,
        unit: source.unit,
        sourceUrl: fetched.sourceUrl,
      })
    : mapSimpleIndicator(fetched.data, {
        indicatorCode: source.indicatorCode,
        indicatorName: source.indicatorName,
        unit: source.unit,
        source: source.source,
        sourceUrl: fetched.sourceUrl,
      });

  const inserted = await storeIndicators(rows, { hash: fetched.payloadHash, fetchedAt: fetched.fetchedAt });
  return {
    sourceEndpoint: source.endpoint,
    status: 'SUCCESS',
    newRecordsCount: inserted,
    rawPayloadHash: fetched.payloadHash,
  };
}

async function storeNews(items: MappedNewsItem[]): Promise<number> {
  let inserted = 0;
  for (const item of items) {
    const existing = await db
      .select({ id: macroEventsAndNews.id })
      .from(macroEventsAndNews)
      .where(eq(macroEventsAndNews.sourceUrl, item.sourceUrl))
      .limit(1);
    if (existing.length > 0) continue;
    await db.insert(macroEventsAndNews).values({
      category: item.category,
      title: item.title,
      objectiveSummary: item.objectiveSummary,
      impactLevel: item.impactLevel,
      relatedIndicatorCodes: item.relatedIndicatorCodes,
      sourcePublisher: item.sourcePublisher,
      sourceUrl: item.sourceUrl,
      publishedDate: item.publishedDate,
    });
    inserted += 1;
  }
  return inserted;
}

export async function handleRss(input: { feedUrl: string; category: MappedNewsItem['category']; publisher: string }): Promise<IngestionJobResult> {
  const fetched = await ethicalFetchJson<string>(input.feedUrl);
  if (!fetched.success) {
    return failure(input.feedUrl, fetched.errorMessage || 'Gagal menarik RSS', fetched.payloadHash || null, statusFromHttp(fetched.httpStatus));
  }
  const xml = typeof fetched.data === 'string' ? fetched.data : fetched.rawPayload;
  const mapped = mapRssItems(parseRssItems(xml), input.category, input.publisher);
  const inserted = await storeNews(mapped);
  return {
    sourceEndpoint: input.feedUrl,
    status: 'SUCCESS',
    newRecordsCount: inserted,
    rawPayloadHash: fetched.payloadHash,
  };
}

export async function handleDocument(input: {
  institutionCode: string;
  sourceUrl: string;
  docType: DocumentType;
  docNumber: string;
  title: string;
  publishedDate?: string;
}): Promise<IngestionJobResult> {
  const institution = await findInstitution(input.institutionCode);
  if (!institution) return failure(input.sourceUrl, `Lembaga ${input.institutionCode} belum ada di tabel institutions`, null);

  const fetched = await ethicalFetchBuffer(input.sourceUrl);
  if (!fetched.success || !fetched.data) {
    return failure(input.sourceUrl, fetched.errorMessage || 'Gagal mengunduh dokumen', fetched.payloadHash || null, statusFromHttp(fetched.httpStatus));
  }

  const existing = await db
    .select({ id: regulationsAndDocuments.id })
    .from(regulationsAndDocuments)
    .where(eq(regulationsAndDocuments.rawPayloadHash, fetched.payloadHash))
    .limit(1);
  if (existing.length > 0) {
    return {
      institutionCode: input.institutionCode,
      sourceEndpoint: input.sourceUrl,
      status: 'SUCCESS',
      newRecordsCount: 0,
      rawPayloadHash: fetched.payloadHash,
    };
  }

  const extracted = await extractTextFromPdf(fetched.data, input.title);
  await db.insert(regulationsAndDocuments).values({
    institutionId: institution.id,
    docType: input.docType,
    docNumber: input.docNumber,
    title: input.title,
    publishedDate: input.publishedDate ?? null,
    extractedText: extracted.text,
    extractionMethod: extracted.method,
    fileSizeKb: Math.ceil(fetched.data.byteLength / 1024),
    sourceUrl: fetched.sourceUrl,
    rawPayloadHash: fetched.payloadHash,
    fetchedAt: fetched.fetchedAt,
  });

  return {
    institutionCode: input.institutionCode,
    sourceEndpoint: input.sourceUrl,
    status: 'SUCCESS',
    newRecordsCount: 1,
    rawPayloadHash: fetched.payloadHash,
  };
}
