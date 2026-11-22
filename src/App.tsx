import React, { useEffect, useMemo, useState } from 'react';
import {
  Globe,
  Landmark,
  Search,
  X,
  Sprout,
  HeartPulse,
  Home,
  GraduationCap,
  Briefcase,
  Users,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';
import { ApplicationDesk } from './components/ApplicationDesk.tsx';
import { ArchitectureView } from './components/ArchitectureView.tsx';
import { ProfileInspector } from './components/ProfileInspector.tsx';
import { RulesDirectory } from './components/RulesDirectory.tsx';
import { SchemeCard } from './components/SchemeCard.tsx';
import { VoiceConsole } from './components/VoiceConsole.tsx';
import { SCHEMES } from './data/schemes.ts';
import { callOllamaExplain, callOllamaExtract, probeOllamaEndpoint } from './engine/ollamaClient.ts';
import { EMPTY_PROFILE, evaluateAllSchemes } from './engine/rulesEngine.ts';
import { CATEGORY_LABELS, UI_COPY } from './i18n/translations.ts';
import {
  CitizenProfile,
  EligibilityStatus,
  ExplanationResponse,
  ExtractionResponse,
  ExtractorEngine,
  OllamaConnectionMode,
  OllamaEnginePolicy,
  SchemeCategory,
  SchemeEvaluation,
  UILanguage,
} from './types/scheme.ts';

type ActiveTab = 'copilot' | 'directory' | 'forms' | 'architecture';
type FilterMode = 'all' | EligibilityStatus;
type FontScale = 'sm' | 'md' | 'lg';

const CATEGORY_ORDER: { key: SchemeCategory; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'Women & Child', icon: Users },
  { key: 'Agriculture', icon: Sprout },
  { key: 'Health', icon: HeartPulse },
  { key: 'Housing', icon: Home },
  { key: 'Education', icon: GraduationCap },
  { key: 'Livelihood & Pension', icon: Briefcase },
];

export default function App() {
  const [uiLanguage, setUiLanguage] = useState<UILanguage>('en');
  const [fontScale, setFontScale] = useState<FontScale>('md');
  const [activeTab, setActiveTab] = useState<ActiveTab>('copilot');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SchemeCategory | 'all'>('all');

  const [inputText, setInputText] = useState('');
  const [profile, setProfile] = useState<CitizenProfile | null>(null);
  const [extractorUsed, setExtractorUsed] = useState<ExtractorEngine>('local-parser');
  const [modelName, setModelName] = useState('Deterministic NLP');
  const [extractionNotes, setExtractionNotes] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [explainingIds, setExplainingIds] = useState<Record<string, boolean>>({});
  const [selectedFormEvalId, setSelectedFormEvalId] = useState<string | null>(null);

  const [ollamaUrl, setOllamaUrl] = useState('http://127.0.0.1:11434');
  const [ollamaModel, setOllamaModel] = useState('qwen2.5:3b');
  const [ollamaConnectionMode, setOllamaConnectionMode] = useState<OllamaConnectionMode>('server');
  const [ollamaEnginePolicy, setOllamaEnginePolicy] = useState<OllamaEnginePolicy>('auto');
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaVersion, setOllamaVersion] = useState<string | null>(null);
  const [availableOllamaModels, setAvailableOllamaModels] = useState<string[]>([]);
  const [isProbingOllama, setIsProbingOllama] = useState(false);
  const [heroImgFailed, setHeroImgFailed] = useState(false);

  const copy = UI_COPY[uiLanguage];

  // Apply accessible root font scaling (A- / A / A+)
  useEffect(() => {
    const pxMap: Record<FontScale, string> = { sm: '14px', md: '16px', lg: '18px' };
    document.documentElement.style.fontSize = pxMap[fontScale];
  }, [fontScale]);

  const probeOllama = async (modeOverride?: OllamaConnectionMode, urlOverride?: string) => {
    const targetMode = modeOverride ?? ollamaConnectionMode;
    const targetUrl = urlOverride ?? ollamaUrl;
    setIsProbingOllama(true);
    try {
      if (targetMode === 'browser-direct') {
        const direct = await probeOllamaEndpoint(targetUrl, 1500);
        if (direct.reachable) {
          setOllamaOnline(true);
          setOllamaVersion(direct.version || null);
          setAvailableOllamaModels(direct.models);
          if (direct.models.length > 0 && !direct.models.includes(ollamaModel)) {
            setOllamaModel(direct.models[0]);
          }
          return;
        }
      }

      const res = await fetch(`/api/engine-status?ollamaUrl=${encodeURIComponent(targetUrl)}`);
      if (res.ok) {
        const data = (await res.json()) as {
          ollamaAvailable: boolean;
          ollamaVersion?: string | null;
          availableOllamaModels?: string[];
        };
        if (targetMode === 'server') {
          setOllamaOnline(data.ollamaAvailable);
          setOllamaVersion(data.ollamaVersion || null);
          setAvailableOllamaModels(data.availableOllamaModels || []);
          if (
            data.availableOllamaModels &&
            data.availableOllamaModels.length > 0 &&
            !data.availableOllamaModels.includes(ollamaModel)
          ) {
            setOllamaModel(data.availableOllamaModels[0]);
          }
        } else if (data.ollamaAvailable) {
          setOllamaConnectionMode('server');
          setOllamaOnline(true);
          setOllamaVersion(data.ollamaVersion || null);
          setAvailableOllamaModels(data.availableOllamaModels || []);
        } else {
          setOllamaOnline(false);
          setOllamaVersion(null);
          setAvailableOllamaModels([]);
        }
      } else {
        setOllamaOnline(false);
        setOllamaVersion(null);
        setAvailableOllamaModels([]);
      }
    } catch {
      setOllamaOnline(false);
      setOllamaVersion(null);
      setAvailableOllamaModels([]);
    } finally {
      setIsProbingOllama(false);
    }
  };

  useEffect(() => {
    void probeOllama();
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<SchemeCategory, number> = {
      'Women & Child': 0,
      Agriculture: 0,
      Health: 0,
      Housing: 0,
      Education: 0,
      'Livelihood & Pension': 0,
    };
    for (const s of SCHEMES) counts[s.category] += 1;
    return counts;
  }, []);

  const evaluations = useMemo(() => {
    if (!profile) return [];
    return evaluateAllSchemes(profile);
  }, [profile]);

  const counts = useMemo(() => {
    return {
      all: evaluations.length,
      eligible: evaluations.filter((e) => e.status === 'eligible').length,
      needs_info: evaluations.filter((e) => e.status === 'needs_info').length,
      ineligible: evaluations.filter((e) => e.status === 'ineligible').length,
    };
  }, [evaluations]);

  const estimatedAnnualBenefit = useMemo(() => {
    return evaluations
      .filter((e) => e.status === 'eligible')
      .reduce((acc, e) => acc + e.scheme.benefitNumericINR, 0);
  }, [evaluations]);

  const matchesSearchAndCategory = (scheme: (typeof SCHEMES)[number]) => {
    if (selectedCategory !== 'all' && scheme.category !== selectedCategory) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      scheme.name.en,
      scheme.name.mr,
      scheme.tagline.en,
      scheme.tagline.mr,
      scheme.ministry.en,
      scheme.ministry.mr,
      scheme.category,
      scheme.benefitAmount.en,
      scheme.officialSource.portalName,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  };

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter((e) => {
      if (filterMode !== 'all' && e.status !== filterMode) return false;
      return matchesSearchAndCategory(e.scheme);
    });
  }, [evaluations, filterMode, searchQuery, selectedCategory]);

  const browsedSchemes = useMemo(() => {
    return SCHEMES.filter(matchesSearchAndCategory);
  }, [searchQuery, selectedCategory]);

  const selectedFormEvaluation = useMemo(() => {
    if (!selectedFormEvalId) return null;
    return evaluations.find((e) => e.scheme.id === selectedFormEvalId) || null;
  }, [evaluations, selectedFormEvalId]);

  const requestExplanation = async (
    evaluation: SchemeEvaluation,
    targetLang: UILanguage = uiLanguage,
    policyOverride?: OllamaEnginePolicy,
  ) => {
    const key = `${evaluation.scheme.id}:${targetLang}`;
    const activePolicy = policyOverride ?? ollamaEnginePolicy;
    setExplainingIds((prev) => ({ ...prev, [evaluation.scheme.id]: true }));
    try {
      const selectedModel =
        availableOllamaModels.length > 0 && !availableOllamaModels.includes(ollamaModel)
          ? availableOllamaModels[0]
          : ollamaModel;

      if (ollamaConnectionMode === 'browser-direct' && activePolicy !== 'gemini') {
        try {
          const direct = await callOllamaExplain(evaluation, targetLang, ollamaUrl, selectedModel, 14000);
          if (direct.explanation) {
            setExplanations((prev) => ({ ...prev, [key]: direct.explanation }));
            return;
          }
        } catch {
          // Fall through cleanly to server /api/ollama-chat
        }
      }

      const res = await fetch('/api/ollama-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'explain',
          evaluation,
          uiLanguage: targetLang,
          provider: ollamaConnectionMode === 'browser-direct' && activePolicy === 'auto' ? 'gemini' : activePolicy,
          ollamaUrl,
          ollamaModel: selectedModel,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as ExplanationResponse;
        setExplanations((prev) => ({ ...prev, [key]: data.explanation }));
      }
    } finally {
      setExplainingIds((prev) => ({ ...prev, [evaluation.scheme.id]: false }));
    }
  };

  const handleAnalyze = async (overrideText?: string, policyOverride?: OllamaEnginePolicy) => {
    const queryText = (overrideText ?? inputText).trim();
    const activePolicy = policyOverride ?? ollamaEnginePolicy;
    if (queryText.length < 3) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    setExplanations({});

    try {
      let data: ExtractionResponse | null = null;
      const selectedModel =
        availableOllamaModels.length > 0 && !availableOllamaModels.includes(ollamaModel)
          ? availableOllamaModels[0]
          : ollamaModel;

      if (ollamaConnectionMode === 'browser-direct' && activePolicy !== 'gemini') {
        try {
          const probe = await probeOllamaEndpoint(ollamaUrl, 1500);
          if (probe.reachable) {
            const resolvedModel = probe.models.includes(ollamaModel)
              ? ollamaModel
              : probe.models[0] || ollamaModel;
            setOllamaOnline(true);
            setOllamaVersion(probe.version || null);
            setAvailableOllamaModels(probe.models);

            const direct = await callOllamaExtract(queryText, ollamaUrl, resolvedModel, 20000);
            data = {
              profile: direct.profile,
              extractorUsed: 'ollama',
              modelName: `${resolvedModel} · ${direct.latencyMs}ms`,
              extractionNotes: `Extracted structured JSON directly in browser via local Ollama (${resolvedModel}). Eligibility computed deterministically by Rules Engine.`,
            };
          } else if (activePolicy === 'ollama') {
            setOllamaOnline(false);
            throw new Error(
              uiLanguage === 'mr'
                ? `${ollamaUrl} वर स्थानिक Ollama (${ollamaModel}) उपलब्ध नाही. कृपया "ollama run ${ollamaModel}" सुरू करा किंवा खालील पर्यायातून Auto / Gemini निवडा.`
                : `Local Ollama (${ollamaModel}) is not reachable at ${ollamaUrl}. Start it with "ollama run ${ollamaModel}", or switch to Auto / Gemini below.`,
            );
          }
        } catch (directErr) {
          if (activePolicy === 'ollama') {
            throw directErr;
          }
        }
      }

      if (!data) {
        const res = await fetch('/api/ollama-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: queryText,
            provider: ollamaConnectionMode === 'browser-direct' && activePolicy === 'ollama' ? 'ollama' : activePolicy,
            ollamaUrl,
            ollamaModel: selectedModel,
          }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(err.error || 'Could not process profile.');
        }
        data = (await res.json()) as ExtractionResponse;
      }

      setProfile(data.profile);
      setExtractorUsed(data.extractorUsed);
      setModelName(data.modelName);
      setExtractionNotes(data.extractionNotes);
      setFilterMode('all');

      const nextEvals = evaluateAllSchemes(data.profile);
      const topEligible = nextEvals.filter((e) => e.status === 'eligible').slice(0, 2);
      const topCandidate = nextEvals.find((e) => e.status === 'needs_info' && e.passedCount >= 2);
      const toExplain = topCandidate && topEligible.length < 2 ? [...topEligible, topCandidate] : topEligible;
      for (const ev of toExplain) {
        void requestExplanation(ev, uiLanguage, activePolicy);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to analyze citizen statement.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUpdateProfileField = (field: keyof CitizenProfile, value: unknown) => {
    setProfile((prev) => {
      const base = prev ?? { ...EMPTY_PROFILE };
      return { ...base, [field]: value };
    });
  };

  const handleReset = () => {
    setInputText('');
    setProfile(null);
    setExplanations({});
    setErrorMsg(null);
    setSelectedFormEvalId(null);
  };

  const handleLanguageToggle = () => {
    const nextLang: UILanguage = uiLanguage === 'en' ? 'mr' : 'en';
    setUiLanguage(nextLang);
    if (profile) {
      const topEligible = evaluations.filter((e) => e.status === 'eligible').slice(0, 2);
      for (const ev of topEligible) {
        const key = `${ev.scheme.id}:${nextLang}`;
        if (!explanations[key]) {
          void requestExplanation(ev, nextLang);
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#050D16]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('copilot');
            }}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#050D16] whitespace-nowrap shrink-0"
          >
            {copy.brandTitle}
          </a>

          {/* Zone 2: 4 Concise Single-Line Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {(
              [
                { id: 'copilot', label: copy.navCopilot },
                { id: 'directory', label: copy.navDirectory },
                { id: 'forms', label: copy.navForms },
                { id: 'architecture', label: copy.navArchitecture },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`py-1 whitespace-nowrap shrink-0 transition-colors cursor-pointer border-b-2 ${
                  activeTab === item.id
                    ? 'border-[#16A34A] text-[#047857] font-semibold'
                    : 'border-transparent text-slate-600 hover:text-[#050D16]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Single Primary Language Toggle Action */}
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-4 h-4" />
            <span>{copy.langSwitchLabel}</span>
          </button>
        </div>

        {/* Mobile Secondary Nav */}
        <div className="md:hidden border-t border-slate-100 px-4 py-2 flex items-center gap-3 overflow-x-auto">
          {(
            [
              { id: 'copilot', label: copy.navCopilot },
              { id: 'directory', label: copy.navDirectory },
              { id: 'forms', label: copy.navForms },
              { id: 'architecture', label: copy.navArchitecture },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                activeTab === item.id
                  ? 'bg-[#16A34A] text-white'
                  : 'text-slate-600 hover:text-[#050D16]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {/* GIGW-Style Accessibility & Official Context Toolbar */}
      <div className="no-print bg-slate-50 border-b border-slate-200">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span>{copy.govPortalStrip}</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">{copy.fontSizeLabel}:</span>
            <div className="inline-flex items-center rounded-md border border-slate-200 bg-white p-0.5">
              {(
                [
                  { id: 'sm', label: 'A-' },
                  { id: 'md', label: 'A' },
                  { id: 'lg', label: 'A+' },
                ] as const
              ).map((sz) => (
                <button
                  key={sz.id}
                  type="button"
                  onClick={() => setFontScale(sz.id)}
                  aria-label={`Set font size ${sz.label}`}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded transition-colors cursor-pointer ${
                    fontScale === sz.id
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-[#050D16]'
                  }`}
                >
                  {sz.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main id="top" className="flex-1">
        {activeTab === 'copilot' && (
          <div>
            {/* Hero Section: Search Bar + Voice Copilot + Visual Banner */}
            <section className="bg-gradient-to-b from-[#F0FDF4]/60 to-white border-b border-slate-200">
              <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                  <div>
                    <p className="text-xs font-semibold text-[#047857] tracking-wide">
                      {copy.heroKicker}
                    </p>
                    <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold text-[#050D16] leading-tight [text-wrap:balance]">
                      {copy.heroHeadline}
                    </h1>
                    <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                      {copy.heroSubhead}
                    </p>
                  </div>

                  {/* Prominent myScheme-Style Search Bar */}
                  <div className="relative">
                    <Search className="w-5 h-5 text-[#16A34A] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={copy.searchPlaceholder}
                      className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-20 py-3.5 text-sm sm:text-base text-[#050D16] placeholder:text-slate-400 shadow-xs focus:outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/15"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-[#050D16] rounded-md bg-slate-100 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{copy.searchClearBtn}</span>
                      </button>
                    )}
                  </div>

                  <VoiceConsole
                    uiLanguage={uiLanguage}
                    text={inputText}
                    onTextChange={setInputText}
                    onAnalyze={handleAnalyze}
                    isAnalyzing={isAnalyzing}
                    onReset={handleReset}
                    ollamaUrl={ollamaUrl}
                    ollamaModel={ollamaModel}
                    ollamaConnectionMode={ollamaConnectionMode}
                    ollamaEnginePolicy={ollamaEnginePolicy}
                    ollamaOnline={ollamaOnline}
                    ollamaVersion={ollamaVersion}
                    availableOllamaModels={availableOllamaModels}
                    isProbingOllama={isProbingOllama}
                    onOllamaUrlChange={(u) => setOllamaUrl(u)}
                    onOllamaModelChange={(m) => setOllamaModel(m)}
                    onOllamaConnectionModeChange={(mode) => {
                      setOllamaConnectionMode(mode);
                      void probeOllama(mode, ollamaUrl);
                    }}
                    onOllamaEnginePolicyChange={(policy) => setOllamaEnginePolicy(policy)}
                    onProbeOllama={() => void probeOllama()}
                  />

                  {errorMsg && (
                    <div className="text-sm text-amber-900 bg-white border border-amber-300 rounded-xl px-4 py-3.5 space-y-2.5">
                      <p className="leading-relaxed">{errorMsg}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOllamaEnginePolicy('auto');
                            void handleAnalyze(undefined, 'auto');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-[#16A34A] hover:bg-[#047857] rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          {uiLanguage === 'mr' ? 'ऑटो फॉल-बॅक वापरा' : 'Switch to Auto Fallback'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setOllamaEnginePolicy('gemini');
                            void handleAnalyze(undefined, 'gemini');
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-[#047857] bg-[#F0FDF4] border border-[#16A34A]/40 hover:bg-[#DCFCE7] rounded-lg cursor-pointer whitespace-nowrap"
                        >
                          {uiLanguage === 'mr' ? 'Gemini पर्याय वापरा' : 'Use Gemini Alternative'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 flex flex-col">
                  <div className="flex-1 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex flex-col">
                    {!heroImgFailed ? (
                      <img
                        src="/src/assets/images/civic_citizen_hero_1795271184699.jpg"
                        alt="Citizens and civic desk assistant reviewing welfare documents together"
                        referrerPolicy="no-referrer"
                        onError={() => setHeroImgFailed(true)}
                        className="w-full h-64 lg:h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-64 lg:h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                        <Landmark className="w-10 h-10 text-[#16A34A] mb-3" />
                        <p className="font-display text-lg font-semibold text-[#050D16]">{copy.brandTitle}</p>
                      </div>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{copy.heroCaption}</p>
                </div>
              </div>
            </section>

            {/* Category Tiles Band (Modeled after myscheme.gov.in) */}
            <section className="bg-white border-b border-slate-200">
              <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
                  <div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-[#050D16]">
                      {copy.categoriesTitle}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">{copy.categoriesSubtitle}</p>
                  </div>
                  {selectedCategory !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className="text-xs font-semibold text-[#047857] hover:underline cursor-pointer whitespace-nowrap"
                    >
                      {copy.allCategoriesLabel} ({SCHEMES.length})
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {CATEGORY_ORDER.map(({ key, icon: Icon }) => {
                    const active = selectedCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedCategory((prev) => (prev === key ? 'all' : key))}
                        className={`text-left rounded-xl border p-4 transition-all cursor-pointer ${
                          active
                            ? 'border-[#16A34A] bg-[#F0FDF4]'
                            : 'border-slate-200 bg-white hover:border-[#16A34A]/60 hover:bg-slate-50'
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                            active ? 'bg-[#16A34A] text-white' : 'bg-[#F0FDF4] text-[#047857]'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="block text-sm font-semibold text-[#050D16] leading-snug">
                          {CATEGORY_LABELS[key][uiLanguage]}
                        </span>
                        <span className="mt-1 block text-xs font-mono-tabular text-slate-500">
                          {categoryCounts[key]} {uiLanguage === 'mr' ? 'योजना' : 'Schemes'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Main Results / Browse Area */}
            <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8 space-y-8">
              {profile ? (
                <>
                  {/* 4-Column Summary Strip */}
                  <section className="grid grid-cols-2 lg:grid-cols-4 bg-white border border-slate-200 rounded-xl divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                    <div className="p-5">
                      <span className="block text-xs text-slate-500">{copy.filterEligible}</span>
                      <span className="mt-1 block font-mono-tabular text-2xl font-bold text-[#047857]">
                        {counts.eligible}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-xs text-slate-500">{copy.filterNeedsInfo}</span>
                      <span className="mt-1 block font-mono-tabular text-2xl font-bold text-amber-700">
                        {counts.needs_info}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-xs text-slate-500">
                        {uiLanguage === 'mr' ? 'अंदाजित पात्र लाभ' : 'Potential Benefit Value'}
                      </span>
                      <span className="mt-1 block font-mono-tabular text-2xl font-bold text-[#050D16]">
                        ₹{estimatedAnnualBenefit.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-5">
                      <span className="block text-xs text-slate-500">
                        {uiLanguage === 'mr' ? 'तपासलेल्या योजना' : 'Schemes Checked'}
                      </span>
                      <span className="mt-1 block font-mono-tabular text-2xl font-bold text-[#050D16]">
                        {counts.all}
                      </span>
                    </div>
                  </section>

                  <ProfileInspector
                    profile={profile}
                    uiLanguage={uiLanguage}
                    extractorUsed={extractorUsed}
                    modelName={modelName}
                    extractionNotes={extractionNotes}
                    onUpdateField={handleUpdateProfileField}
                  />

                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto">
                      {(
                        [
                          { id: 'all', label: `${copy.filterAll} (${counts.all})` },
                          { id: 'eligible', label: `${copy.filterEligible} (${counts.eligible})` },
                          { id: 'needs_info', label: `${copy.filterNeedsInfo} (${counts.needs_info})` },
                          { id: 'ineligible', label: `${copy.filterIneligible} (${counts.ineligible})` },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setFilterMode(tab.id)}
                          className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            filterMode === tab.id
                              ? 'bg-white text-[#047857] shadow-xs font-semibold'
                              : 'text-slate-600 hover:text-[#050D16]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-5">
                    {filteredEvaluations.length > 0 ? (
                      filteredEvaluations.map((ev) => (
                        <SchemeCard
                          key={ev.scheme.id}
                          evaluation={ev}
                          profile={profile}
                          uiLanguage={uiLanguage}
                          explanation={explanations[`${ev.scheme.id}:${uiLanguage}`]}
                          isExplaining={Boolean(explainingIds[ev.scheme.id])}
                          onRequestExplanation={(item) => requestExplanation(item, uiLanguage)}
                          onUpdateProfileField={handleUpdateProfileField}
                          onOpenApplicationForm={(item) => {
                            setSelectedFormEvalId(item.scheme.id);
                            setActiveTab('forms');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                        />
                      ))
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
                        <p className="text-sm text-slate-600">
                          {uiLanguage === 'mr'
                            ? 'निवडलेल्या शोध किंवा श्रेणीमध्ये कोणतीही योजना आढळली नाही.'
                            : 'No schemes match the active search or category filter.'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Browse Schemes Grid when exploring via Search/Categories before entering profile */}
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="font-display text-xl font-bold text-[#050D16]">
                        {copy.browseResultsTitle}{' '}
                        <span className="font-mono-tabular text-sm font-medium text-slate-500">
                          ({browsedSchemes.length})
                        </span>
                      </h2>
                      {(selectedCategory !== 'all' || searchQuery) && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCategory('all');
                            setSearchQuery('');
                          }}
                          className="text-xs font-semibold text-[#047857] hover:underline cursor-pointer"
                        >
                          {uiLanguage === 'mr' ? 'सर्व फिल्टर काढा' : 'Reset Filters'}
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {browsedSchemes.map((s) => (
                        <article
                          key={s.id}
                          className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between hover:border-[#16A34A]/60 transition-colors"
                        >
                          <div>
                            <div className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-[#047857]">{s.level}</span>
                              <span aria-hidden="true">·</span>
                              <span>{CATEGORY_LABELS[s.category][uiLanguage]}</span>
                            </div>
                            <h3 className="mt-2 font-display text-base font-semibold text-[#050D16] leading-snug">
                              {s.name[uiLanguage]}
                            </h3>
                            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                              {s.tagline[uiLanguage]}
                            </p>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-500">{uiLanguage === 'mr' ? 'लाभ' : 'Benefit'}</span>
                              <span className="font-mono-tabular font-semibold text-[#047857]">
                                {s.benefitAmount[uiLanguage]}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <a
                                href={s.officialSource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[#047857] underline underline-offset-2 hover:text-[#16A34A]"
                              >
                                <span>{s.officialSource.portalName}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <button
                                type="button"
                                onClick={() => {
                                  document.getElementById('citizen-situation-input')?.focus();
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="inline-flex items-center gap-1 font-semibold text-[#050D16] hover:text-[#16A34A] cursor-pointer"
                              >
                                <span>{uiLanguage === 'mr' ? 'पात्रता तपासा' : 'Check Eligibility'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>

                  {/* 3-Step Guide (Modeled after myscheme.gov.in) */}
                  <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8">
                    <h2 className="font-display text-xl font-bold text-[#050D16] text-center">
                      {copy.howItWorksTitle}
                    </h2>
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        { title: copy.step1Title, desc: copy.step1Desc },
                        { title: copy.step2Title, desc: copy.step2Desc },
                        { title: copy.step3Title, desc: copy.step3Desc },
                      ].map((step) => (
                        <div key={step.title} className="bg-white border border-slate-200 rounded-xl p-5">
                          <h3 className="font-display text-base font-semibold text-[#047857]">{step.title}</h3>
                          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">{step.desc}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'directory' && (
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8">
            <RulesDirectory uiLanguage={uiLanguage} />
          </div>
        )}

        {activeTab === 'forms' && (
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8">
            <ApplicationDesk
              selectedEvaluation={selectedFormEvaluation}
              eligibleEvaluations={evaluations.filter((e) => e.status !== 'ineligible')}
              profile={profile ?? EMPTY_PROFILE}
              uiLanguage={uiLanguage}
              onSelectEvaluation={(ev) => setSelectedFormEvalId(ev.scheme.id)}
              onBackToCopilot={() => setActiveTab('copilot')}
            />
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-8">
            <ArchitectureView
              uiLanguage={uiLanguage}
              ollamaUrl={ollamaUrl}
              ollamaModel={ollamaModel}
              ollamaConnectionMode={ollamaConnectionMode}
              ollamaEnginePolicy={ollamaEnginePolicy}
              ollamaOnline={ollamaOnline}
              ollamaVersion={ollamaVersion}
              availableOllamaModels={availableOllamaModels}
              isProbingOllama={isProbingOllama}
              onOllamaUrlChange={(u) => setOllamaUrl(u)}
              onOllamaModelChange={(m) => setOllamaModel(m)}
              onOllamaConnectionModeChange={(mode) => {
                setOllamaConnectionMode(mode);
                void probeOllama(mode, ollamaUrl);
              }}
              onOllamaEnginePolicyChange={(policy) => setOllamaEnginePolicy(policy)}
              onProbeOllama={() => probeOllama()}
            />
          </div>
        )}
      </main>

      {/* Quiet Institutional Footer */}
      <footer className="no-print border-t border-slate-200 bg-slate-50 mt-12">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
          <span>
            SchemeSaathi · योजनासाथी —{' '}
            {uiLanguage === 'mr'
              ? 'केवळ अधिकृत शासन निर्णयांवर आधारित नागरिक मार्गदर्शन साधन.'
              : 'Citizen eligibility discovery grounded in official Central & Maharashtra scheme rules.'}
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            className="text-[#047857] font-medium hover:underline cursor-pointer"
          >
            {copy.navDirectory}
          </button>
        </div>
      </footer>
    </div>
  );
}
