import React, { useState } from 'react';
import { Server, Cpu, CheckCircle2, AlertCircle, Play, Copy, Check } from 'lucide-react';
import { callOllamaExtract, probeOllamaEndpoint } from '../engine/ollamaClient.ts';
import { UI_COPY } from '../i18n/translations.ts';
import {
  CitizenProfile,
  OllamaConnectionMode,
  OllamaEnginePolicy,
  UILanguage,
} from '../types/scheme.ts';

interface ArchitectureViewProps {
  uiLanguage: UILanguage;
  ollamaUrl: string;
  ollamaModel: string;
  ollamaConnectionMode: OllamaConnectionMode;
  ollamaEnginePolicy: OllamaEnginePolicy;
  ollamaOnline: boolean;
  ollamaVersion: string | null;
  availableOllamaModels: string[];
  isProbingOllama: boolean;
  onOllamaUrlChange: (url: string) => void;
  onOllamaModelChange: (model: string) => void;
  onOllamaConnectionModeChange: (mode: OllamaConnectionMode) => void;
  onOllamaEnginePolicyChange: (policy: OllamaEnginePolicy) => void;
  onProbeOllama: () => Promise<void>;
}

interface LiveTestResult {
  ok: boolean;
  model?: string;
  version?: string | null;
  latencyMs?: number;
  extractedSample?: CitizenProfile;
  error?: string;
}

export const ArchitectureView: React.FC<ArchitectureViewProps> = ({
  uiLanguage,
  ollamaUrl,
  ollamaModel,
  ollamaConnectionMode,
  ollamaEnginePolicy,
  ollamaOnline,
  ollamaVersion,
  availableOllamaModels,
  isProbingOllama,
  onOllamaUrlChange,
  onOllamaModelChange,
  onOllamaConnectionModeChange,
  onOllamaEnginePolicyChange,
  onProbeOllama,
}) => {
  const copy = UI_COPY[uiLanguage];
  const [testingLive, setTestingLive] = useState(false);
  const [liveTest, setLiveTest] = useState<LiveTestResult | null>(null);
  const [copiedCorsCmd, setCopiedCorsCmd] = useState(false);

  const activeModelDisplay =
    availableOllamaModels.length > 0 && !availableOllamaModels.includes(ollamaModel)
      ? availableOllamaModels[0]
      : ollamaModel;

  const runLiveTest = async () => {
    setTestingLive(true);
    setLiveTest(null);
    try {
      if (ollamaConnectionMode === 'browser-direct') {
        const probe = await probeOllamaEndpoint(ollamaUrl, 2000);
        if (!probe.reachable) {
          setLiveTest({
            ok: false,
            error:
              uiLanguage === 'mr'
                ? `${ollamaUrl} वर स्थानिक Ollama सापडले नाही. कृपया OLLAMA_ORIGINS="*" ollama serve सुरू करा.`
                : `Local Ollama not reachable from browser at ${ollamaUrl}. Run: OLLAMA_ORIGINS="*" ollama serve`,
          });
          return;
        }
        const selected = probe.models.includes(ollamaModel) ? ollamaModel : probe.models[0] || ollamaModel;
        const sampleText = 'मी रमेश, वय ४२, यवतमाळ शेतकरी, ३ एकर जमीन, उत्पन्न ९० हजार रुपये.';
        const extracted = await callOllamaExtract(sampleText, ollamaUrl, selected, 15000);
        setLiveTest({
          ok: true,
          model: selected,
          version: probe.version || null,
          latencyMs: extracted.latencyMs,
          extractedSample: extracted.profile,
        });
      } else {
        const res = await fetch('/api/ollama/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ollamaUrl, ollamaModel }),
        });
        const data = (await res.json()) as LiveTestResult;
        setLiveTest(data);
      }
    } catch (err) {
      setLiveTest({
        ok: false,
        error: err instanceof Error ? err.message : 'Ollama live test failed.',
      });
    } finally {
      setTestingLive(false);
    }
  };

  const handleCopyCors = () => {
    navigator.clipboard?.writeText('ollama run qwen2.5:3b').catch(() => {});
    setCopiedCorsCmd(true);
    setTimeout(() => setCopiedCorsCmd(false), 1800);
  };

  const steps =
    uiLanguage === 'mr'
      ? [
          {
            num: '01.',
            title: 'आवाज किंवा मजकूर नोंद (मराठी / हिंदी / इंग्रजी)',
            body: 'नागरिक स्वतःच्या भाषेत परिस्थिती सांगतो. कमी साक्षर नागरिकांसाठी व्हॉइस डिक्टेशन आणि ऑडिओ वाचन सुविधा आहे.',
          },
          {
            num: '02.',
            title: 'AI फक्त JSON माहिती काढतो (Ollama / Cloud Fallback)',
            body: 'LLM कधीही योजनेची पात्रता ठरवत नाही. तो फक्त नाव, वय, उत्पन्न, रेशन कार्ड व जमीन यांसारखे घटक संरचित JSON मध्ये बदलतो.',
          },
          {
            num: '03.',
            title: 'नियम इंजिनद्वारे अचूक पडताळणी (Zero Hallucination)',
            body: 'TypeScript मधील शुद्ध तर्कशास्त्र प्रत्येक शासन निर्णयातील अटी तपासते आणि पास/अपूर्ण पुराव्यांची नोंद करते.',
          },
          {
            num: '04.',
            title: 'संदर्भासह स्पष्टीकरण व तयार अर्ज',
            body: 'नियम इंजिनच्या निष्कर्षावरूनच AI सोप्या मराठीत समजावतो, अधिकृत पोर्टल लिंक देतो आणि थेट प्रिंट करण्याजोगा अर्ज भरतो.',
          },
        ]
      : [
          {
            num: '01.',
            title: 'Multilingual Voice & Text Intake',
            body: 'Citizens describe their household in Marathi, Hindi, or English via browser SpeechRecognition or text. Every card and form also reads aloud.',
          },
          {
            num: '02.',
            title: 'Strict JSON Extraction via Ollama (Zero Scheme Guessing)',
            body: 'The LLM reads unstructured citizen speech and outputs only a typed CitizenProfile JSON object. It is explicitly forbidden from predicting schemes.',
          },
          {
            num: '03.',
            title: 'Deterministic Predicate Rules Engine',
            body: 'Pure TypeScript rules evaluate every threshold, exclusion clause, and income limit against verified Central & Maharashtra Government Resolutions.',
          },
          {
            num: '04.',
            title: 'Grounded Explanation, Citations & Pre-Filled Form',
            body: 'The LLM only explains the deterministic outcome in plain Marathi or English, always citing the official portal URL and auto-populating printable forms.',
          },
        ];

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <h2 className="font-display text-2xl font-semibold text-[#050D16]">{copy.archTitle}</h2>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl">{copy.archSubtitle}</p>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((st) => (
            <div key={st.num} className="border border-slate-200 rounded-xl p-5 bg-slate-50/70">
              <h3 className="font-display text-base font-semibold text-[#047857]">
                {st.num} {st.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{st.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-2 text-[#16A34A]">
            <Cpu className="w-5 h-5" />
            <h3 className="font-display text-xl font-semibold text-[#050D16]">
              {uiLanguage === 'mr' ? 'Ollama LLM कनेक्शन आणि चाचणी' : 'Ollama Runtime Configuration & Live Test'}
            </h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {uiLanguage === 'mr'
              ? 'तुमच्या संगणकावर Ollama चालू असल्यास सर्व JSON माहिती व स्पष्टीकरण स्थानिक मॉडेलवर चालते. थेट ब्राउझर मोडने तुम्ही क्लाउड प्रीव्ह्यूमधूनही तुमच्या लॅपटॉपवरील localhost:11434 शी जोडू शकता.'
              : 'Connect Ollama directly from your browser to localhost:11434 (even while viewing this hosted preview) or route through the Express backend locally or via an HTTPS tunnel.'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">{copy.ollamaModeLabel}</span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => onOllamaConnectionModeChange('browser-direct')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md truncate cursor-pointer ${
                    ollamaConnectionMode === 'browser-direct'
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-[#050D16]'
                  }`}
                >
                  {uiLanguage === 'mr' ? 'ब्राउझर थेट' : 'Browser Direct'}
                </button>
                <button
                  type="button"
                  onClick={() => onOllamaConnectionModeChange('server')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md truncate cursor-pointer ${
                    ollamaConnectionMode === 'server'
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-[#050D16]'
                  }`}
                >
                  {uiLanguage === 'mr' ? 'सर्व्हर / टनेल' : 'Server / Tunnel'}
                </button>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-600 mb-1">{copy.ollamaPolicyLabel}</span>
              <div className="grid grid-cols-3 gap-1 p-1 bg-slate-50 border border-slate-200 rounded-lg">
                <button
                  type="button"
                  onClick={() => onOllamaEnginePolicyChange('auto')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md truncate cursor-pointer ${
                    ollamaEnginePolicy === 'auto'
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-[#050D16]'
                  }`}
                >
                  {uiLanguage === 'mr' ? 'ऑटो' : 'Auto'}
                </button>
                <button
                  type="button"
                  onClick={() => onOllamaEnginePolicyChange('ollama')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md truncate cursor-pointer ${
                    ollamaEnginePolicy === 'ollama'
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-[#050D16]'
                  }`}
                >
                  Ollama
                </button>
                <button
                  type="button"
                  onClick={() => onOllamaEnginePolicyChange('gemini')}
                  className={`px-2 py-1.5 text-xs font-medium rounded-md truncate cursor-pointer ${
                    ollamaEnginePolicy === 'gemini'
                      ? 'bg-[#16A34A] text-white'
                      : 'text-slate-600 hover:text-[#050D16]'
                  }`}
                >
                  Gemini
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">OLLAMA_BASE_URL</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => onOllamaUrlChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono-tabular bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                OLLAMA_MODEL {availableOllamaModels.length > 0 ? `(${availableOllamaModels.length} detected)` : ''}
              </label>
              {availableOllamaModels.length > 0 ? (
                <select
                  value={activeModelDisplay}
                  onChange={(e) => onOllamaModelChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono-tabular bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                >
                  {availableOllamaModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={ollamaModel}
                  onChange={(e) => onOllamaModelChange(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono-tabular bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                />
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => void onProbeOllama()}
              disabled={isProbingOllama}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-lg hover:bg-[#047857] cursor-pointer disabled:opacity-60"
            >
              {isProbingOllama ? (uiLanguage === 'mr' ? 'तपासत आहे…' : 'Probing…') : copy.ollamaProbeBtn}
            </button>

            <button
              type="button"
              onClick={runLiveTest}
              disabled={testingLive}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#047857] bg-[#F0FDF4] border border-[#16A34A]/40 rounded-lg hover:bg-[#DCFCE7] cursor-pointer disabled:opacity-60"
            >
              <Play className="w-3.5 h-3.5" />
              <span>{testingLive ? copy.ollamaTestingBtn : copy.ollamaTestBtn}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-[#050D16]">
            {ollamaOnline ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#047857] shrink-0" />
                <span>
                  Ollama Online ({availableOllamaModels.join(', ') || ollamaModel}
                  {ollamaVersion ? ` · v${ollamaVersion}` : ''})
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>
                  Ollama offline at {ollamaUrl} ({ollamaConnectionMode}) ·{' '}
                  {ollamaEnginePolicy === 'auto' ? 'Fallback active' : 'Strict Ollama mode enabled'}
                </span>
              </>
            )}
          </div>

          {liveTest && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2 text-xs">
              {liveTest.ok && liveTest.extractedSample ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[#047857] font-semibold">
                    <span>
                      Live JSON Extraction Passed · {liveTest.model}
                      {liveTest.version ? ` (v${liveTest.version})` : ''}
                    </span>
                    <span className="font-mono-tabular">{liveTest.latencyMs}ms</span>
                  </div>
                  <pre className="p-3 rounded bg-[#050D16] text-slate-100 text-[11px] font-mono-tabular overflow-x-auto leading-relaxed">
                    {JSON.stringify(liveTest.extractedSample, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-amber-800">{liveTest.error}</p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center gap-2 text-[#16A34A]">
            <Server className="w-5 h-5" />
            <h3 className="font-display text-xl font-semibold text-[#050D16]">
              {uiLanguage === 'mr' ? 'लोकल Ollama आणि Vercel डिप्लॉय' : 'Connect Local Ollama & Deploy'}
            </h3>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-mono-tabular text-[#050D16] truncate">
              ollama run qwen2.5:3b
            </span>
            <button
              type="button"
              onClick={handleCopyCors}
              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-700 bg-white border border-slate-200 rounded hover:border-[#16A34A] shrink-0 cursor-pointer"
            >
              {copiedCorsCmd ? <Check className="w-3 h-3 text-[#047857]" /> : <Copy className="w-3 h-3" />}
              <span>{copiedCorsCmd ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <pre className="p-4 rounded-lg bg-[#050D16] text-slate-100 text-xs font-mono-tabular overflow-x-auto leading-relaxed">
{`# 1. Start local Ollama with qwen2.5:3b
ollama pull qwen2.5:3b
ollama serve

# 2. Run SchemeSaathi locally (server /api/ollama-chat -> 127.0.0.1:11434/api/chat)
npm install
OLLAMA_MODEL=qwen2.5:3b npm run dev

# 3. Optional Browser-Direct (if accessing from remote preview)
OLLAMA_ORIGINS="*" ollama serve

# Push to GitHub (Scheme-Saathiii) & Vercel
git remote add origin https://github.com/<user>/Scheme-Saathiii.git
git push -u origin main
npx vercel --prod`}
          </pre>
        </div>
      </section>
    </div>
  );
};

