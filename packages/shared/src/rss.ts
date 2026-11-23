import { sanitizeSensitiveText } from './privacyMasker.js';
import type { ImpactLevel, IndicatorCode, MappedNewsItem, NewsCategory } from './contracts.js';

export interface RssItemDraft {
  title: string;
  link: string;
  summary: string;
  publishedDate: string;
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function tagValue(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1]).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

function toIsoDate(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10);
  }
  return parsed.toISOString().slice(0, 10);
}

export function inferNewsImpact(title: string, summary: string): {
  impactLevel: ImpactLevel;
  relatedIndicatorCodes: IndicatorCode[];
} {
  const blob = `${title} ${summary}`.toLowerCase();
  const related = new Set<IndicatorCode>();
  if (/rupiah|kurs|valas|dolar/.test(blob)) related.add('USD_IDR');
  if (/inflasi|ihk/.test(blob)) related.add('INFLATION_YOY');
  if (/suku bunga|bi rate|bi-rate/.test(blob)) related.add('BI_RATE');
  if (/pdb|pertumbuhan ekonomi/.test(blob)) related.add('GDP_GROWTH');
  if (/daya beli|keyakinan konsumen/.test(blob)) related.add('IKK_PURCHASING_POWER');
  if (/pangan|beras|minyak goreng/.test(blob)) related.add('FOOD_INDEX');

  let impactLevel: ImpactLevel = 'LOW';
  if (/(krisis|resesi|gagal bayar|sanksi)/.test(blob)) impactLevel = 'HIGH';
  else if (related.size > 0 || /(apbn|energi|kebijakan fiskal)/.test(blob)) impactLevel = 'MEDIUM';

  return { impactLevel, relatedIndicatorCodes: [...related] };
}

/** Parser RSS/Atom ringan untuk umpan berita publik. Tidak menarik data di luar XML yang diberikan. */
export function parseRssItems(xml: string): RssItemDraft[] {
  const blocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? xml.match(/<entry[\s\S]*?<\/entry>/gi) ?? [];
  const items: RssItemDraft[] = [];

  for (const block of blocks) {
    const title = tagValue(block, 'title');
    const link = tagValue(block, 'link') || (block.match(/<link[^>]+href="([^"]+)"/i)?.[1] ?? '');
    const summary = tagValue(block, 'description') || tagValue(block, 'summary') || tagValue(block, 'content');
    const published = tagValue(block, 'pubDate') || tagValue(block, 'published') || tagValue(block, 'updated');
    if (!title || !link) continue;
    items.push({
      title: title.slice(0, 500),
      link,
      summary: summary.slice(0, 1000),
      publishedDate: toIsoDate(published),
    });
  }

  return items;
}

export function mapRssItems(
  items: RssItemDraft[],
  category: NewsCategory,
  publisher: string
): MappedNewsItem[] {
  return items.map((item) => {
    const summary = sanitizeSensitiveText(item.summary).slice(0, 800);
    const impact = inferNewsImpact(item.title, summary);
    return {
      category,
      title: sanitizeSensitiveText(item.title).slice(0, 500),
      objectiveSummary: summary || item.title,
      impactLevel: impact.impactLevel,
      relatedIndicatorCodes: impact.relatedIndicatorCodes,
      sourcePublisher: publisher,
      sourceUrl: item.link,
      publishedDate: item.publishedDate,
    };
  });
}
