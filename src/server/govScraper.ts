import { GoogleGenAI } from '@google/genai';
import { SCHEMES } from '../data/schemes.ts';
import type {
  CustomScrapedScheme,
  GovernmentScheme,
  ScrapedLink,
  ScrapedPortalRecord,
} from '../types/scheme.ts';

const scrapeCache = new Map<string, ScrapedPortalRecord>();

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractHtmlMetadata(html: string, baseUrl: string): {
  title: string;
  description: string;
  links: ScrapedLink[];
} {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : '';

  const descMatch =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  const description = descMatch ? decodeHtmlEntities(descMatch[1]) : '';

  const links: ScrapedLink[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null && links.length < 18) {
    const rawHref = match[1].trim();
    const rawLabel = decodeHtmlEntities(match[2].replace(/<[^>]+>/g, ' '));
    if (!rawHref || /^(javascript:|mailto:|tel:)/i.test(rawHref)) continue;

    let absUrl = rawHref;
    try {
      absUrl = new URL(rawHref, baseUrl).toString();
    } catch {
      continue;
    }

    if (!/^https?:\/\//i.test(absUrl)) continue;
    if (seen.has(absUrl)) continue;

    const isUseful =
      /\.(gov\.in|nic\.in|mahait\.org|mahaonline\.gov\.in|mhicds\.com|mahajyoti\.org\.in|maandhan\.in|jansamarth\.in|mahaawaas\.org|mudra\.org\.in)/i.test(
        absUrl,
      ) ||
      /apply|register|status|login|scheme|guideline|circular|pdf|beneficiary|kyc|gr\b/i.test(
        `${absUrl} ${rawLabel}`,
      );

    if (isUseful && rawLabel.length >= 3 && rawLabel.length <= 80) {
      seen.add(absUrl);
      links.push({ label: rawLabel, url: absUrl });
    }
  }

  return { title, description, links };
}

async function fetchDirectGovHtml(url: string): Promise<{
  httpStatus: number | null;
  reachable: boolean;
  title: string;
  description: string;
  links: ScrapedLink[];
}> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(4500),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-IN,en;q=0.9,mr;q=0.8,hi;q=0.7',
      },
    });
    const html = await response.text();
    const parsed = extractHtmlMetadata(html, response.url || url);
    return {
      httpStatus: response.status,
      reachable: response.ok,
      title: parsed.title,
      description: parsed.description,
      links: parsed.links,
    };
  } catch {
    return {
      httpStatus: null,
      reachable: false,
      title: '',
      description: '',
      links: [],
    };
  }
}

async function groundOfficialLinksViaSearch(
  ai: GoogleGenAI,
  query: string,
): Promise<{ summary: string; links: ScrapedLink[] }> {
  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: `Find the official Indian Government (.gov.in, .nic.in, maharashtra.gov.in, myscheme.gov.in, mahait.org, mahaonline.gov.in) portals, direct application links, status check links, and official guideline pages for: ${query}. Summarize key eligibility & application portal in 2 factual sentences.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const links: ScrapedLink[] = [];
  const seen = new Set<string>();

  for (const chunk of chunks) {
    const uri = chunk.web?.uri;
    const title = chunk.web?.title || 'Official Source';
    if (!uri || seen.has(uri)) continue;
    seen.add(uri);
    links.push({ label: title, url: uri });
  }

  return {
    summary: (response.text || '').trim(),
    links: links.slice(0, 8),
  };
}

export async function scrapeSingleScheme(
  scheme: GovernmentScheme,
  ai: GoogleGenAI | null,
): Promise<ScrapedPortalRecord> {
  const now = new Date().toISOString();
  const urlsToTry = [
    scheme.officialSource.url,
    ...scheme.officialSource.relatedLinks
      .filter((l) => l.url.includes('myscheme.gov.in'))
      .map((l) => l.url),
  ];

  let bestDirect: Awaited<ReturnType<typeof fetchDirectGovHtml>> | null = null;
  let successfulUrl = scheme.officialSource.url;

  for (const candidateUrl of urlsToTry) {
    const res = await fetchDirectGovHtml(candidateUrl);
    if (res.reachable && (res.title || res.links.length > 0)) {
      bestDirect = res;
      successfulUrl = candidateUrl;
      break;
    }
    if (!bestDirect || (res.httpStatus && !bestDirect.httpStatus)) {
      bestDirect = res;
    }
  }

  const mergedLinks: ScrapedLink[] = [];
  const seenUrls = new Set<string>();

  // Always include curated verified links first
  for (const rl of scheme.officialSource.relatedLinks) {
    if (!seenUrls.has(rl.url)) {
      seenUrls.add(rl.url);
      mergedLinks.push({ label: rl.label.en, url: rl.url });
    }
  }

  if (bestDirect?.reachable) {
    for (const dl of bestDirect.links) {
      if (!seenUrls.has(dl.url) && mergedLinks.length < 10) {
        seenUrls.add(dl.url);
        mergedLinks.push(dl);
      }
    }
    const record: ScrapedPortalRecord = {
      schemeId: scheme.id,
      portalUrl: successfulUrl,
      httpStatus: bestDirect.httpStatus,
      reachable: true,
      pageTitle: bestDirect.title || scheme.name.en,
      metaDescription: bestDirect.description || scheme.tagline.en,
      scrapedLinks: mergedLinks,
      sourceMethod: 'direct-http',
      scrapedAt: now,
    };
    scrapeCache.set(scheme.id, record);
    return record;
  }

  // If direct fetch blocked by WAF/geo-timeout, enrich via Search Grounding if Gemini available
  if (ai) {
    try {
      const grounded = await groundOfficialLinksViaSearch(
        ai,
        `${scheme.name.en} ${scheme.officialSource.portalName}`,
      );
      for (const gl of grounded.links) {
        if (!seenUrls.has(gl.url) && mergedLinks.length < 10) {
          seenUrls.add(gl.url);
          mergedLinks.push(gl);
        }
      }
      const record: ScrapedPortalRecord = {
        schemeId: scheme.id,
        portalUrl: scheme.officialSource.url,
        httpStatus: bestDirect?.httpStatus ?? null,
        reachable: grounded.links.length > 0,
        pageTitle: scheme.name.en,
        metaDescription: grounded.summary || scheme.tagline.en,
        scrapedLinks: mergedLinks,
        sourceMethod: 'search-grounding',
        scrapedAt: now,
      };
      scrapeCache.set(scheme.id, record);
      return record;
    } catch {
      // fall through to verified-registry
    }
  }

  const fallbackRecord: ScrapedPortalRecord = {
    schemeId: scheme.id,
    portalUrl: scheme.officialSource.url,
    httpStatus: bestDirect?.httpStatus ?? null,
    reachable: false,
    pageTitle: scheme.name.en,
    metaDescription: scheme.tagline.en,
    scrapedLinks: mergedLinks,
    sourceMethod: 'verified-registry',
    scrapedAt: now,
  };
  scrapeCache.set(scheme.id, fallbackRecord);
  return fallbackRecord;
}

export async function scrapeAllSchemes(ai: GoogleGenAI | null): Promise<ScrapedPortalRecord[]> {
  const results: ScrapedPortalRecord[] = [];
  const batchSize = 4;
  for (let i = 0; i < SCHEMES.length; i += batchSize) {
    const batch = SCHEMES.slice(i, i + batchSize);
    const settled = await Promise.all(batch.map((s) => scrapeSingleScheme(s, ai)));
    results.push(...settled);
  }
  return results;
}

export function getCachedScrapes(): ScrapedPortalRecord[] {
  return Array.from(scrapeCache.values());
}

export async function scrapeCustomGovernmentScheme(
  queryOrUrl: string,
  ai: GoogleGenAI | null,
): Promise<CustomScrapedScheme> {
  const trimmed = queryOrUrl.trim();
  const now = new Date().toISOString();

  if (/^https?:\/\//i.test(trimmed)) {
    const direct = await fetchDirectGovHtml(trimmed);
    if (direct.reachable) {
      return {
        query: trimmed,
        title: direct.title || trimmed,
        summary: direct.description || 'Live official government portal page scraped successfully.',
        officialLinks: [{ label: direct.title || 'Scraped Portal', url: trimmed }, ...direct.links.slice(0, 7)],
        scrapedAt: now,
      };
    }
  }

  if (ai) {
    const grounded = await groundOfficialLinksViaSearch(ai, trimmed);
    return {
      query: trimmed,
      title: trimmed,
      summary: grounded.summary || 'Discovered official government portals for this scheme.',
      officialLinks: grounded.links,
      scrapedAt: now,
    };
  }

  // Fallback matching against local catalog if offline
  const qLower = trimmed.toLowerCase();
  const matched = SCHEMES.filter(
    (s) =>
      s.name.en.toLowerCase().includes(qLower) ||
      s.name.mr.includes(trimmed) ||
      s.officialSource.portalName.toLowerCase().includes(qLower),
  );
  return {
    query: trimmed,
    title: matched[0]?.name.en || trimmed,
    summary:
      matched[0]?.tagline.en ||
      'Connect Gemini Search Grounding or provide a direct .gov.in URL to scrape external schemes live.',
    officialLinks:
      matched.flatMap((m) => m.officialSource.relatedLinks.map((rl) => ({ label: rl.label.en, url: rl.url }))) ||
      [],
    scrapedAt: now,
  };
}
