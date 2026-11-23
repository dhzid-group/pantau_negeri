import { distance } from 'fastest-levenshtein';

const DOTTED_AFFIXES = [
  'persero.', 'ph.d.', 's.kom.', 's.sos.', 's.ip.', 'm.kom.', 'm.si.',
  'prof.', 'drs.', 'dra.', 's.t.', 's.h.', 's.e.', 'm.m.', 'm.t.', 'm.h.',
  'pt.', 'cv.', 'fa.', 'ud.', 'tbk.', 'dr.', 'ir.', 'hj.', 'h.',
];

const LEGAL_TOKENS = new Set(['pt', 'cv', 'fa', 'ud', 'tbk', 'persero', 'koperasi', 'perum', 'perusda']);

const PERSON_TITLE_TOKENS = new Set([
  'prof', 'dr', 'drs', 'dra', 'ir', 'h', 'hj',
  'st', 'sh', 'se', 'skom', 'ssos', 'sip',
  'mm', 'msi', 'mkom', 'mt', 'mh', 'phd',
]);

export interface CanonicalCandidate {
  id: number;
  normalizedName: string;
  displayName: string;
  type: 'PERSON' | 'VENDOR' | 'INSTITUTION';
  aliases: string[];
}

/**
 * Normalizes entity name by removing legal affixes, academic titles, punctuation,
 * and collapsing extra whitespaces into single spaces.
 */
export function normalizeEntityName(name: string, type: 'PERSON' | 'VENDOR' | 'INSTITUTION'): string {
  if (!name) return '';
  let cleaned = name.toLowerCase().trim();

  for (const affix of DOTTED_AFFIXES) {
    cleaned = cleaned.split(affix).join(' ');
  }

  cleaned = cleaned.replace(/[^a-z0-9\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  const tokens = cleaned.split(' ').filter(Boolean);

  if (type === 'VENDOR') {
    while (tokens.length > 0 && LEGAL_TOKENS.has(tokens[0])) tokens.shift();
    while (tokens.length > 0 && LEGAL_TOKENS.has(tokens[tokens.length - 1])) tokens.pop();
  } else if (type === 'PERSON') {
    return tokens.filter((token) => !PERSON_TITLE_TOKENS.has(token)).join(' ');
  }

  return tokens.join(' ');
}

/**
 * Calculates normalized similarity ratio between two strings (0.0 - 1.0)
 */
export function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 && !str2) return 1.0;
  if (!str1 || !str2) return 0.0;
  if (str1 === str2) return 1.0;

  const maxLen = Math.max(str1.length, str2.length);
  const dist = distance(str1, str2);
  return 1 - dist / maxLen;
}

/**
 * Entity Resolution Resolver:
 * Resolves a raw name into an existing CanonicalCandidate or creates a new identifier proposal.
 * Threshold: 0.85 default (85% similarity)
 */
export function resolveCanonicalEntity(
  rawName: string,
  type: 'PERSON' | 'VENDOR' | 'INSTITUTION',
  existingCandidates: CanonicalCandidate[],
  threshold = 0.85
): {
  matched: boolean;
  canonicalId?: number;
  normalizedName: string;
  displayName: string;
  confidenceScore: number;
} {
  const norm = normalizeEntityName(rawName, type);
  if (!norm) {
    return { matched: false, normalizedName: '', displayName: rawName, confidenceScore: 0 };
  }

  // 1. Exact match on normalizedName or known aliases
  for (const candidate of existingCandidates) {
    if (candidate.type !== type) continue;
    if (candidate.normalizedName === norm) {
      return {
        matched: true,
        canonicalId: candidate.id,
        normalizedName: candidate.normalizedName,
        displayName: candidate.displayName,
        confidenceScore: 1.0,
      };
    }
    const hasAliasMatch = candidate.aliases?.some(
      (a) => normalizeEntityName(a, type) === norm
    );
    if (hasAliasMatch) {
      return {
        matched: true,
        canonicalId: candidate.id,
        normalizedName: candidate.normalizedName,
        displayName: candidate.displayName,
        confidenceScore: 0.98,
      };
    }
  }

  // 2. Fuzzy Levenshtein match across candidates
  let bestMatch: CanonicalCandidate | null = null;
  let bestScore = 0;

  for (const candidate of existingCandidates) {
    if (candidate.type !== type) continue;
    const score = calculateSimilarity(norm, candidate.normalizedName);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  if (bestMatch && bestScore >= threshold) {
    return {
      matched: true,
      canonicalId: bestMatch.id,
      normalizedName: bestMatch.normalizedName,
      displayName: bestMatch.displayName,
      confidenceScore: Math.round(bestScore * 100) / 100,
    };
  }

  return {
    matched: false,
    normalizedName: norm,
    displayName: rawName.trim(),
    confidenceScore: Math.round(bestScore * 100) / 100,
  };
}
