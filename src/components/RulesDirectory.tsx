import React, { useEffect, useState } from 'react';
import { ExternalLink, RefreshCw, Search, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { SCHEMES } from '../data/schemes.ts';
import { UI_COPY } from '../i18n/translations.ts';
import { CustomScrapedScheme, ScrapedPortalRecord, UILanguage } from '../types/scheme.ts';

interface RulesDirectoryProps {
  uiLanguage: UILanguage;
}

export const RulesDirectory: React.FC<RulesDirectoryProps> = ({ uiLanguage }) => {
  const copy = UI_COPY[uiLanguage];
  const [scrapedMap, setScrapedMap] = useState<Record<string, ScrapedPortalRecord>>({});
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const [customQuery, setCustomQuery] = useState('');
  const [isSearchingCustom, setIsSearchingCustom] = useState(false);
  const [customResults, setCustomResults] = useState<CustomScrapedScheme[]>([]);

  useEffect(() => {
    fetch('/api/scraped-schemes')
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { records?: ScrapedPortalRecord[] } | null) => {
        if (data?.records?.length) {
          const map: Record<string, ScrapedPortalRecord> = {};
          for (const rec of data.records) map[rec.schemeId] = rec;
          setScrapedMap(map);
        }
      })
      .catch(() => {
        // ignore initial cache error
      });
  }, []);

  const handleScrapeAll = async () => {
    setIsScrapingAll(true);
    setScrapeError(null);
    try {
      const res = await fetch('/api/scrape-schemes', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to scrape government portals.');
      const data = (await res.json()) as { records: ScrapedPortalRecord[] };
      const map: Record<string, ScrapedPortalRecord> = {};
      for (const rec of data.records) map[rec.schemeId] = rec;
      setScrapedMap(map);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Unable to complete portal scrape.');
    } finally {
      setIsScrapingAll(false);
    }
  };

  const handleCustomScrape = async (e: React.FormEvent) => {
    e.preventDefault();
    if (customQuery.trim().length < 2) return;
    setIsSearchingCustom(true);
    setScrapeError(null);
    try {
      const res = await fetch('/api/scrape-custom-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: customQuery.trim() }),
      });
      if (!res.ok) throw new Error('Could not scrape custom scheme.');
      const data = (await res.json()) as { result: CustomScrapedScheme };
      setCustomResults((prev) => [data.result, ...prev]);
      setCustomQuery('');
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Custom scrape error.');
    } finally {
      setIsSearchingCustom(false);
    }
  };

  const scrapedCount = Object.keys(scrapedMap).length;

  return (
    <section className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <h2 className="font-display text-2xl font-semibold text-[#050D16]">{copy.directoryTitle}</h2>
            <p className="mt-1 text-sm text-slate-600 max-w-2xl">{copy.directorySubtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleScrapeAll}
            disabled={isScrapingAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#047857] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isScrapingAll ? 'animate-spin' : ''}`} />
            <span>
              {isScrapingAll
                ? uiLanguage === 'mr'
                  ? 'शासकीय संकेतस्थळे स्कॅन करत आहे…'
                  : 'Scraping Official Gov Portals…'
                : uiLanguage === 'mr'
                  ? 'सर्व शासकीय पोर्टल थेट स्क्रॅप करा'
                  : 'Scrape All Gov Websites Live'}
            </span>
          </button>
        </div>

        <form onSubmit={handleCustomScrape} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder={
                uiLanguage === 'mr'
                  ? 'कोणत्याही योजनेचे नाव किंवा .gov.in लिंक टाका (उदा. रमाई आवास योजना, अटल पेन्शन, https://www.myscheme.gov.in/)'
                  : 'Enter any scheme name or .gov.in URL to scrape links (e.g. Ramai Awas Yojana, PM Matru Vandana, https://www.myscheme.gov.in/)'
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-sm text-[#050D16] placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#16A34A]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearchingCustom || customQuery.trim().length < 2}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-[#047857] bg-[#F0FDF4] border border-[#16A34A]/40 hover:bg-[#DCFCE7] disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>
              {isSearchingCustom
                ? uiLanguage === 'mr'
                  ? 'शोधत आहे…'
                  : 'Scraping…'
                : uiLanguage === 'mr'
                  ? 'वेबसाइट स्क्रॅप करा'
                  : 'Scrape Scheme Links'}
            </span>
          </button>
        </form>

        {scrapeError && (
          <p className="text-xs text-amber-800">{scrapeError}</p>
        )}

        {scrapedCount > 0 && (
          <p className="text-xs text-[#047857] font-medium">
            {uiLanguage === 'mr'
              ? `${scrapedCount} शासकीय संकेतस्थळांवरून थेट दुवे व माहिती अद्ययावत केली आहे.`
              : `Live scraped metadata & official sub-links updated across ${scrapedCount} government scheme portals.`}
          </p>
        )}

        {customResults.length > 0 && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-semibold text-[#047857]">
              {uiLanguage === 'mr' ? 'थेट स्क्रॅप केलेल्या इतर शासकीय योजना' : 'Newly Scraped Government Scheme Results'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customResults.map((item, idx) => (
                <div key={`${item.query}-${idx}`} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-display text-base font-semibold text-[#050D16]">{item.title}</h4>
                    <span className="text-[11px] font-mono-tabular text-slate-500 shrink-0">
                      {new Date(item.scrapedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">{item.summary}</p>
                  {item.officialLinks.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {item.officialLinks.map((lnk) => (
                        <li key={lnk.url} className="text-xs">
                          <a
                            href={lnk.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[#047857] underline underline-offset-2 hover:text-[#16A34A] break-all"
                          >
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            <span>{lnk.label}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs text-slate-500">
                <th className="py-3 pr-4 font-semibold">{uiLanguage === 'mr' ? 'योजना व तपशील' : 'Scheme & Scraped Title'}</th>
                <th className="py-3 px-4 font-semibold">{uiLanguage === 'mr' ? 'स्तर व श्रेणी' : 'Level · Category'}</th>
                <th className="py-3 px-4 font-semibold">{uiLanguage === 'mr' ? 'अधिकृत नियम' : 'Deterministic Rules'}</th>
                <th className="py-3 px-4 font-semibold text-right">{uiLanguage === 'mr' ? 'लाभ' : 'Benefit'}</th>
                <th className="py-3 pl-4 font-semibold">{uiLanguage === 'mr' ? 'सर्व शासकीय पोर्टल लिंक' : 'Verified & Scraped Official Links'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SCHEMES.map((s) => {
                const live = scrapedMap[s.id];
                const linksToDisplay =
                  live && live.scrapedLinks.length > 0
                    ? live.scrapedLinks
                    : s.officialSource.relatedLinks.map((rl) => ({
                        label: rl.label[uiLanguage],
                        url: rl.url,
                      }));

                return (
                  <tr key={s.id} className="align-top hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 pr-4 max-w-xs">
                      <span className="font-semibold text-[#050D16] block">{s.name[uiLanguage]}</span>
                      <span className="text-xs text-slate-600 block mt-0.5">{s.ministry[uiLanguage]}</span>
                      {live && (
                        <div className="mt-2 text-[11px] text-slate-600">
                          <span className="inline-flex items-center gap-1 font-medium text-[#050D16]">
                            {live.reachable ? (
                              <CheckCircle2 className="w-3 h-3 text-[#047857]" />
                            ) : (
                              <AlertCircle className="w-3 h-3 text-amber-700" />
                            )}
                            <span>
                              {live.sourceMethod === 'direct-http'
                                ? `HTTP ${live.httpStatus} · Direct Scrape`
                                : live.sourceMethod === 'search-grounding'
                                  ? 'Verified Search Grounding'
                                  : 'Verified Gov Registry'}
                            </span>
                          </span>
                          {live.metaDescription && (
                            <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">{live.metaDescription}</p>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-600 whitespace-nowrap">
                      {s.level} · {s.category}
                    </td>
                    <td className="py-4 px-4 text-xs text-[#050D16] max-w-xs">
                      <ul className="space-y-1">
                        {s.rules.map((r) => (
                          <li key={r.id}>
                            <span className="font-mono-tabular text-[#047857] mr-1.5">{r.id}</span>
                            <span>{r.requirementText[uiLanguage]}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="py-4 px-4 text-right font-mono-tabular text-xs font-semibold text-[#047857] whitespace-nowrap">
                      {s.benefitAmount[uiLanguage]}
                    </td>
                    <td className="py-4 pl-4 text-xs min-w-[240px]">
                      <ul className="space-y-1.5">
                        {linksToDisplay.slice(0, 6).map((lnk) => (
                          <li key={lnk.url}>
                            <a
                              href={lnk.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[#047857] underline underline-offset-2 hover:text-[#16A34A]"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate max-w-[230px]">{lnk.label}</span>
                            </a>
                          </li>
                        ))}
                      </ul>
                      <span className="block text-[11px] text-slate-500 mt-1.5">
                        {s.officialSource.circularRef}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
