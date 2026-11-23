import { createHash } from 'crypto';

interface DomainRateState {
  lastRequestTime: number;
  rateLimitMs: number;
}

const domainRateMap = new Map<string, DomainRateState>();
const robotsDisallowCache = new Map<string, Set<string>>();

export interface FetchResult<T = unknown> {
  success: boolean;
  data?: T;
  rawPayload: string;
  payloadHash: string;
  sourceUrl: string;
  fetchedAt: Date;
  httpStatus?: number;
  errorMessage?: string;
}

/**
 * Calculates SHA-256 hash of raw data for audit integrity
 */
export function computeSha256(content: string | Buffer): string {
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Extract domain hostname from full URL
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}

/**
 * Respects robots.txt directives for ethical open data ingestion
 */
export async function isAllowedByRobotsTxt(targetUrl: string, userAgent = 'PantauNegeri-Bot'): Promise<boolean> {
  try {
    const urlObj = new URL(targetUrl);
    const domain = urlObj.hostname;
    const path = urlObj.pathname;

    if (!robotsDisallowCache.has(domain)) {
      const robotsUrl = `${urlObj.protocol}//${domain}/robots.txt`;
      const res = await fetch(robotsUrl, {
        headers: { 'User-Agent': `${userAgent}/1.0 (+https://pantaunegeri.id/bot)` },
        signal: AbortSignal.timeout(4000),
      }).catch(() => null);

      const disallows = new Set<string>();
      if (res && res.ok) {
        const text = await res.text();
        const lines = text.split('\n');
        let currentAgentMatches = true;

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.toLowerCase().startsWith('user-agent:')) {
            const agent = trimmed.slice(11).trim().toLowerCase();
            currentAgentMatches = agent === '*' || agent.includes(userAgent.toLowerCase());
          } else if (currentAgentMatches && trimmed.toLowerCase().startsWith('disallow:')) {
            const disallowedPath = trimmed.slice(9).trim();
            if (disallowedPath) disallows.add(disallowedPath);
          }
        }
      }
      robotsDisallowCache.set(domain, disallows);
    }

    const disallowedSet = robotsDisallowCache.get(domain)!;
    for (const rule of disallowedSet) {
      if (path.startsWith(rule)) {
        return false;
      }
    }
    return true;
  } catch {
    return true; // Fail-open for open government portals if robots.txt unreachable
  }
}

/**
 * Enforces per-domain rate limiting (default: min 3000ms delay between requests)
 */
export async function enforceRateLimit(domain: string, rateLimitMs = 3500): Promise<void> {
  const now = Date.now();
  const state = domainRateMap.get(domain) || { lastRequestTime: 0, rateLimitMs };

  const elapsed = now - state.lastRequestTime;
  if (elapsed < state.rateLimitMs) {
    const waitTime = state.rateLimitMs - elapsed;
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }

  domainRateMap.set(domain, { lastRequestTime: Date.now(), rateLimitMs });
}

/**
 * Ethical HTTP GET with rate limiting, robots check, custom UA, and SHA-256 hash
 */
export async function ethicalFetchJson<T = unknown>(
  url: string,
  options: {
    rateLimitMs?: number;
    userAgent?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<FetchResult<T>> {
  const domain = extractDomain(url);
  const ua = options.userAgent || process.env.SCRAPER_USER_AGENT || 'PantauNegeri-Bot/1.0';
  const rateLimitMs = options.rateLimitMs || Number(process.env.SCRAPER_RATE_LIMIT_MS) || 3500;

  const allowed = await isAllowedByRobotsTxt(url, 'PantauNegeri-Bot');
  if (!allowed) {
    return {
      success: false,
      rawPayload: '',
      payloadHash: '',
      sourceUrl: url,
      fetchedAt: new Date(),
      errorMessage: `Blocked by robots.txt policy at ${domain}`,
    };
  }

  await enforceRateLimit(domain, rateLimitMs);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': ua,
        Accept: 'application/json, text/plain, */*',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(15000),
    });

    const rawText = await response.text();
    const hash = computeSha256(rawText);

    if (!response.ok) {
      return {
        success: false,
        rawPayload: rawText,
        payloadHash: hash,
        sourceUrl: url,
        fetchedAt: new Date(),
        httpStatus: response.status,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    let parsedData: T;
    try {
      parsedData = JSON.parse(rawText) as T;
    } catch {
      parsedData = rawText as unknown as T;
    }

    return {
      success: true,
      data: parsedData,
      rawPayload: rawText,
      payloadHash: hash,
      sourceUrl: url,
      fetchedAt: new Date(),
      httpStatus: response.status,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      rawPayload: '',
      payloadHash: '',
      sourceUrl: url,
      fetchedAt: new Date(),
      errorMessage: msg,
    };
  }
}

/**
 * Ethical HTTP GET for binary documents (PDF). Hash is SHA-256 of the raw bytes.
 * rawPayload stores only a size marker so the PDF body is not copied into logs.
 */
export async function ethicalFetchBuffer(
  url: string,
  options: {
    rateLimitMs?: number;
    userAgent?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<FetchResult<Buffer>> {
  const domain = extractDomain(url);
  const ua = options.userAgent || process.env.SCRAPER_USER_AGENT || 'PantauNegeri-Bot/1.0';
  const rateLimitMs = options.rateLimitMs || Number(process.env.SCRAPER_RATE_LIMIT_MS) || 3500;

  const allowed = await isAllowedByRobotsTxt(url, 'PantauNegeri-Bot');
  if (!allowed) {
    return {
      success: false,
      rawPayload: '',
      payloadHash: '',
      sourceUrl: url,
      fetchedAt: new Date(),
      errorMessage: `Blocked by robots.txt policy at ${domain}`,
    };
  }

  await enforceRateLimit(domain, rateLimitMs);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': ua,
        Accept: 'application/pdf, application/octet-stream, */*',
        ...(options.headers || {}),
      },
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      const rawText = await response.text();
      return {
        success: false,
        rawPayload: rawText.slice(0, 500),
        payloadHash: computeSha256(rawText),
        sourceUrl: url,
        fetchedAt: new Date(),
        httpStatus: response.status,
        errorMessage: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    return {
      success: true,
      data: bytes,
      rawPayload: `binary:${bytes.byteLength}`,
      payloadHash: computeSha256(bytes),
      sourceUrl: url,
      fetchedAt: new Date(),
      httpStatus: response.status,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      rawPayload: '',
      payloadHash: '',
      sourceUrl: url,
      fetchedAt: new Date(),
      errorMessage: msg,
    };
  }
}
