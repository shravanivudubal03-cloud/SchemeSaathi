import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { SCHEMES } from '../data/schemes.ts';
import { sanitizeCitizenProfile } from '../engine/fallbackExtractor.ts';
import {
  EXTRACTION_SYSTEM_PROMPT,
  callOllamaExplain,
  callOllamaExtract,
  probeOllamaEndpoint,
  validateOllamaUrl,
} from '../engine/ollamaClient.ts';
import { EMPTY_PROFILE, evaluateAllSchemes } from '../engine/rulesEngine.ts';
import type { CitizenProfile, ExtractorEngine, SchemeEvaluation, UILanguage } from '../types/scheme.ts';
import { getCachedScrapes, scrapeAllSchemes, scrapeCustomGovernmentScheme } from './govScraper.ts';

const DEFAULT_OLLAMA_URL = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
const DEFAULT_OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b';

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

async function extractWithGemini(text: string): Promise<Partial<CitizenProfile>> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Gemini API key not configured');

  const response = await withTimeout(
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Extract structured citizen facts from this Hindi, Marathi, or English statement. Never predict or mention schemes. Return null for any unstated attribute.\n\nStatement: """${text}"""`,
      config: {
        systemInstruction: EXTRACTION_SYSTEM_PROMPT,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fullName: { type: Type.STRING, nullable: true },
            age: { type: Type.NUMBER, nullable: true },
            gender: { type: Type.STRING, nullable: true, enum: ['female', 'male', 'other'] },
            maritalStatus: { type: Type.STRING, nullable: true, enum: ['married', 'single', 'widowed', 'divorced'] },
            state: { type: Type.STRING, nullable: true },
            district: { type: Type.STRING, nullable: true },
            residenceType: { type: Type.STRING, nullable: true, enum: ['rural', 'urban'] },
            annualIncomeINR: { type: Type.NUMBER, nullable: true },
            occupation: {
              type: Type.STRING,
              nullable: true,
              enum: ['farmer', 'artisan', 'daily_wage', 'student', 'small_business', 'homemaker', 'unemployed', 'salaried', 'senior_citizen'],
            },
            landHoldingAcres: { type: Type.NUMBER, nullable: true },
            socialCategory: { type: Type.STRING, nullable: true, enum: ['general', 'obc', 'sc', 'st', 'nt_vjnt', 'ews'] },
            rationCardType: { type: Type.STRING, nullable: true, enum: ['antyodaya', 'bpl_yellow', 'apl_orange', 'white', 'none'] },
            hasPuccaHouse: { type: Type.BOOLEAN, nullable: true },
            hasLpgConnection: { type: Type.BOOLEAN, nullable: true },
            hasGirlChild: { type: Type.BOOLEAN, nullable: true },
            girlChildAge: { type: Type.NUMBER, nullable: true },
            isGovernmentEmployee: { type: Type.BOOLEAN, nullable: true },
            isIncomeTaxPayer: { type: Type.BOOLEAN, nullable: true },
            isDifferentlyAbled: { type: Type.BOOLEAN, nullable: true },
            educationLevel: { type: Type.STRING, nullable: true, enum: ['school', 'undergraduate', 'postgraduate', 'iti_diploma', 'none'] },
            bankAccountLinkedAadhaar: { type: Type.BOOLEAN, nullable: true },
            spokenLanguage: { type: Type.STRING, enum: ['mr', 'hi', 'en'] },
          },
        },
      },
    }),
    9000,
    'Gemini extraction',
  );

  const jsonStr = (response.text ?? '{}').trim();
  return JSON.parse(jsonStr) as Partial<CitizenProfile>;
}

function buildGroundedFallbackExplanation(evaluation: SchemeEvaluation, lang: UILanguage): string {
  const { scheme, status, passedRules, failedRules, missingRules } = evaluation;
  if (lang === 'mr') {
    if (status === 'eligible') {
      const reasons = passedRules.map((r) => `${r.label.mr} (${r.observedDisplay.mr})`).join(', ');
      return `तुमच्या माहितीनुसार तुम्ही "${scheme.name.mr}" साठी पात्र आहात कारण: ${reasons}. लाभ: ${scheme.benefitAmount.mr}. अधिकृत संदर्भ: ${scheme.officialSource.circularRef} (${scheme.officialSource.portalName}).`;
    }
    if (status === 'needs_info') {
      const missing = missingRules.map((r) => r.label.mr).join(', ');
      return `तुमची प्राथमिक माहिती "${scheme.name.mr}" च्या नियमांशी जुळते, परंतु अंतिम खात्रीसाठी कृपया ही माहिती द्या: ${missing}. अधिकृत संदर्भ: ${scheme.officialSource.portalName}.`;
    }
    const failed = failedRules.map((r) => `${r.label.mr}: ${r.observedDisplay.mr}`).join(', ');
    return `सध्याच्या माहितीनुसार "${scheme.name.mr}" साठी हा निकष पूर्ण होत नाही — ${failed}. अधिकृत नियम पहा: ${scheme.officialSource.portalName}.`;
  }

  if (status === 'eligible') {
    const reasons = passedRules.map((r) => `${r.label.en} (${r.observedDisplay.en})`).join('; ');
    return `You qualify for ${scheme.name.en} based on verified rules: ${reasons}. Benefit: ${scheme.benefitAmount.en}. Official citation: ${scheme.officialSource.circularRef} (${scheme.officialSource.portalName}).`;
  }
  if (status === 'needs_info') {
    const missing = missingRules.map((r) => r.label.en).join(', ');
    return `No disqualifying criteria were found for ${scheme.name.en}, but the rules engine needs confirmation on: ${missing}. Official portal: ${scheme.officialSource.portalName}.`;
  }
  const failed = failedRules.map((r) => `${r.label.en} (${r.observedDisplay.en})`).join('; ');
  return `Based on current details, ${scheme.name.en} does not match due to: ${failed}. Reference: ${scheme.officialSource.portalName}.`;
}

async function explainWithGemini(evaluation: SchemeEvaluation, lang: UILanguage): Promise<string> {
  const ai = getGeminiClient();
  if (!ai) throw new Error('Gemini API key not configured');

  const targetLang = lang === 'mr' ? 'simple, warm Marathi (मराठी)' : 'clear, empathetic plain English';
  const response = await withTimeout(
    ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `Write a 2–3 sentence citizen-friendly explanation in ${targetLang} strictly grounded in this deterministic rules engine evaluation:
Scheme: ${evaluation.scheme.name[lang]}
Benefit: ${evaluation.scheme.benefitAmount[lang]}
Deterministic Status: ${evaluation.status}
Passed checks: ${evaluation.passedRules.map((r) => `${r.label[lang]} (${r.observedDisplay[lang]})`).join(', ') || 'None'}
Missing info: ${evaluation.missingRules.map((r) => r.label[lang]).join(', ') || 'None'}
Failed checks: ${evaluation.failedRules.map((r) => `${r.label[lang]} (${r.observedDisplay[lang]})`).join(', ') || 'None'}
Official Source: ${evaluation.scheme.officialSource.portalName} (${evaluation.scheme.officialSource.circularRef})`,
      config: {
        systemInstruction:
          'You are an honest civic guide. NEVER invent rules or change the deterministic status. Always cite the official portal name provided.',
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    }),
    9000,
    'Gemini explanation',
  );
  return (response.text || '').trim();
}

export function createApiApp(): express.Express {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.get('/api/engine-status', async (req, res) => {
    const rawUrl = typeof req.query.ollamaUrl === 'string' && req.query.ollamaUrl.trim() ? req.query.ollamaUrl : DEFAULT_OLLAMA_URL;
    let customUrl = DEFAULT_OLLAMA_URL;
    try {
      customUrl = validateOllamaUrl(rawUrl);
    } catch {
      res.status(400).json({ error: 'Invalid Ollama URL. Must start with http:// or https://' });
      return;
    }

    const ollama = await probeOllamaEndpoint(customUrl, 1200);
    const geminiAvailable = Boolean(getGeminiClient());
    res.json({
      ollamaAvailable: ollama.reachable,
      ollamaUrl: customUrl,
      ollamaModel: DEFAULT_OLLAMA_MODEL,
      ollamaVersion: ollama.version || null,
      availableOllamaModels: ollama.models,
      geminiAvailable,
      ruleCount: SCHEMES.reduce((sum, s) => sum + s.rules.length, 0),
      schemeCount: SCHEMES.length,
    });
  });

  app.post('/api/ollama/test', async (req, res) => {
    const { ollamaUrl = DEFAULT_OLLAMA_URL, ollamaModel = DEFAULT_OLLAMA_MODEL } = req.body as {
      ollamaUrl?: string;
      ollamaModel?: string;
    };

    let cleanUrl: string;
    try {
      cleanUrl = validateOllamaUrl(ollamaUrl);
    } catch (err) {
      res.status(400).json({ error: err instanceof Error ? err.message : 'Invalid Ollama URL' });
      return;
    }

    const probe = await probeOllamaEndpoint(cleanUrl, 2000);
    if (!probe.reachable) {
      res.status(502).json({
        ok: false,
        error: `Ollama is not reachable at ${cleanUrl}. Start it locally with "ollama serve" or connect via a tunnel URL.`,
      });
      return;
    }

    const selectedModel = probe.models.includes(ollamaModel) ? ollamaModel : probe.models[0] || ollamaModel;
    try {
      const sampleText = 'मी रमेश, वय ४२, यवतमाळ शेतकरी, ३ एकर जमीन, उत्पन्न ९० हजार रुपये.';
      const result = await callOllamaExtract(sampleText, cleanUrl, selectedModel, 12000);
      res.json({
        ok: true,
        model: selectedModel,
        version: probe.version || null,
        latencyMs: result.latencyMs,
        extractedSample: result.profile,
      });
    } catch (err) {
      res.status(502).json({
        ok: false,
        error: err instanceof Error ? err.message : 'Ollama model test failed.',
      });
    }
  });

  app.get('/api/schemes', (_req, res) => {
    res.json({
      schemes: SCHEMES.map(({ rules, ...rest }) => ({
        ...rest,
        ruleCount: rules.length,
        ruleSummaries: rules.map((r) => ({ id: r.id, field: r.field, label: r.label, requirementText: r.requirementText })),
      })),
    });
  });

  app.get('/api/scraped-schemes', (_req, res) => {
    res.json({ records: getCachedScrapes() });
  });

  app.post('/api/scrape-schemes', async (_req, res) => {
    try {
      const records = await scrapeAllSchemes(getGeminiClient());
      res.json({ records });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Scraping failed.' });
    }
  });

  app.post('/api/scrape-custom-scheme', async (req, res) => {
    const { query } = req.body as { query?: string };
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      res.status(400).json({ error: 'Enter a government scheme name or .gov.in URL to scrape.' });
      return;
    }
    try {
      const result = await scrapeCustomGovernmentScheme(query, getGeminiClient());
      res.json({ result });
    } catch (err) {
      res.status(500).json({ error: err instanceof Error ? err.message : 'Custom scheme scrape failed.' });
    }
  });

  async function processCitizenExtraction(params: {
    text: string;
    preferredEngine: 'auto' | 'ollama' | 'gemini';
    ollamaUrl?: string;
    ollamaModel?: string;
  }) {
    let activeOllamaUrl = DEFAULT_OLLAMA_URL;
    try {
      activeOllamaUrl = validateOllamaUrl(params.ollamaUrl || DEFAULT_OLLAMA_URL);
    } catch (err) {
      return {
        status: 400 as const,
        error: err instanceof Error ? err.message : 'Invalid Ollama URL provided.',
      };
    }

    const activeOllamaModel = (params.ollamaModel || DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;
    let extractorUsed: ExtractorEngine = 'local-parser';
    let modelName = 'Deterministic Multilingual NLP';
    let extractionNotes = 'Parsed locally using Marathi/Hindi/English structured rules.';
    let rawParsed: Partial<CitizenProfile> = { ...EMPTY_PROFILE };

    if (params.preferredEngine !== 'gemini') {
      const probe = await probeOllamaEndpoint(activeOllamaUrl, 1500);
      if (probe.reachable) {
        try {
          const selectedModel =
            probe.models.length === 0 || probe.models.includes(activeOllamaModel)
              ? activeOllamaModel
              : probe.models[0];
          const ollamaResult = await callOllamaExtract(params.text, activeOllamaUrl, selectedModel, 20000);
          rawParsed = ollamaResult.rawJson;
          extractorUsed = 'ollama';
          modelName = `${selectedModel} · ${ollamaResult.latencyMs}ms`;
          extractionNotes = `Extracted structured JSON on server via Ollama (${selectedModel} at ${activeOllamaUrl}/api/chat). Eligibility verified deterministically by Rules Engine.`;
        } catch (err) {
          if (params.preferredEngine === 'ollama') {
            return {
              status: 503 as const,
              code: 'OLLAMA_UNAVAILABLE',
              error: `Ollama (${activeOllamaModel}) failed at ${activeOllamaUrl}/api/chat: ${err instanceof Error ? err.message : 'connection error'}. Ensure "ollama run ${activeOllamaModel}" is active, or switch provider to Auto / Gemini.`,
            };
          }
          extractionNotes = `Ollama fallback triggered (${err instanceof Error ? err.message : 'error'}).`;
        }
      } else if (params.preferredEngine === 'ollama') {
        return {
          status: 503 as const,
          code: 'OLLAMA_UNAVAILABLE',
          error: `Local Ollama (${activeOllamaModel}) is not reachable at ${activeOllamaUrl}/api/chat. Start it locally with "ollama run ${activeOllamaModel}" or switch AI Provider to Auto / Gemini.`,
        };
      }
    }

    if (extractorUsed === 'local-parser' && getGeminiClient()) {
      try {
        rawParsed = await extractWithGemini(params.text);
        extractorUsed = 'gemini';
        modelName = 'gemini-4-hydrogen';
        extractionNotes =
          params.preferredEngine === 'gemini'
            ? 'Extracted structured JSON via configurable Gemini alternative; eligibility verified deterministically by Rules Engine.'
            : 'Extracted structured JSON via server-side Gemini fallback (Ollama offline); eligibility verified deterministically by Rules Engine.';
      } catch (err) {
        if (params.preferredEngine === 'gemini') {
          return {
            status: 503 as const,
            error: `Gemini alternative is temporarily unavailable (${err instanceof Error ? err.message : 'error'}). Try Auto or local Ollama.`,
          };
        }
        extractionNotes = `Cloud Gemini fallback unavailable (${err instanceof Error ? err.message : 'error'}); parsed locally.`;
      }
    } else if (params.preferredEngine === 'gemini' && !getGeminiClient()) {
      return {
        status: 503 as const,
        error: 'Gemini API key is not configured on the server. Switch AI Provider to Ollama or Auto.',
      };
    }

    const profile = sanitizeCitizenProfile(rawParsed, params.text);
    const deterministicEvals = evaluateAllSchemes(profile);
    return {
      status: 200 as const,
      payload: {
        profile,
        extractorUsed,
        providerUsed: extractorUsed,
        modelName,
        extractionNotes,
        ollamaEndpoint: `${activeOllamaUrl}/api/chat`,
        deterministicSummary: {
          eligibleCount: deterministicEvals.filter((e) => e.status === 'eligible').length,
          needsInfoCount: deterministicEvals.filter((e) => e.status === 'needs_info').length,
          totalSchemes: deterministicEvals.length,
        },
      },
    };
  }

  app.post('/api/ollama-chat', async (req, res) => {
    const body = req.body as {
      text?: string;
      messages?: Array<{ role?: string; content?: string }>;
      provider?: 'auto' | 'ollama' | 'gemini';
      preferredEngine?: 'auto' | 'ollama' | 'gemini';
      ollamaUrl?: string;
      ollamaModel?: string;
      mode?: 'extract' | 'explain';
      evaluation?: SchemeEvaluation;
      uiLanguage?: UILanguage;
    };

    const provider = body.provider || body.preferredEngine || 'auto';

    if (body.mode === 'explain' && body.evaluation?.scheme) {
      const uiLanguage = body.uiLanguage || 'en';
      let activeOllamaUrl = DEFAULT_OLLAMA_URL;
      try {
        activeOllamaUrl = validateOllamaUrl(body.ollamaUrl || DEFAULT_OLLAMA_URL);
      } catch {
        res.status(400).json({ error: 'Invalid Ollama URL provided.' });
        return;
      }
      const activeOllamaModel = (body.ollamaModel || DEFAULT_OLLAMA_MODEL).trim() || DEFAULT_OLLAMA_MODEL;

      if (provider !== 'gemini') {
        const probe = await probeOllamaEndpoint(activeOllamaUrl, 1200);
        if (probe.reachable) {
          try {
            const selectedModel =
              probe.models.length === 0 || probe.models.includes(activeOllamaModel)
                ? activeOllamaModel
                : probe.models[0];
            const resOllama = await callOllamaExplain(body.evaluation, uiLanguage, activeOllamaUrl, selectedModel, 20000);
            if (resOllama.explanation) {
              res.json({ explanation: resOllama.explanation, engineUsed: 'ollama', modelName: selectedModel });
              return;
            }
          } catch {
            // fall through cleanly
          }
        } else if (provider === 'ollama') {
          res.status(503).json({
            code: 'OLLAMA_UNAVAILABLE',
            error: `Local Ollama (${activeOllamaModel}) is offline at ${activeOllamaUrl}/api/chat.`,
          });
          return;
        }
      }

      if (getGeminiClient()) {
        try {
          const explanation = await explainWithGemini(body.evaluation, uiLanguage);
          if (explanation) {
            res.json({ explanation, engineUsed: 'gemini', modelName: 'gemini-4-hydrogen' });
            return;
          }
        } catch {
          // fall through cleanly
        }
      }

      res.json({
        explanation: buildGroundedFallbackExplanation(body.evaluation, uiLanguage),
        engineUsed: 'local-parser',
        modelName: 'Grounded Rule Template',
      });
      return;
    }

    const lastUserMessage = Array.isArray(body.messages)
      ? [...body.messages].reverse().find((m) => m.role === 'user' && typeof m.content === 'string')?.content
      : undefined;
    const citizenText = (typeof body.text === 'string' && body.text.trim() ? body.text : lastUserMessage || '').trim();

    if (citizenText.length < 3) {
      res.status(400).json({ error: 'Please describe your household situation in Marathi, Hindi, or English.' });
      return;
    }

    const result = await processCitizenExtraction({
      text: citizenText,
      preferredEngine: provider,
      ollamaUrl: body.ollamaUrl,
      ollamaModel: body.ollamaModel,
    });

    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error, code: result.code });
      return;
    }

    res.json(result.payload);
  });

  app.post('/api/extract-profile', async (req, res) => {
    const { text, preferredEngine = 'auto', provider, ollamaUrl, ollamaModel } = req.body as {
      text?: string;
      preferredEngine?: 'auto' | 'ollama' | 'gemini';
      provider?: 'auto' | 'ollama' | 'gemini';
      ollamaUrl?: string;
      ollamaModel?: string;
    };

    if (!text || typeof text !== 'string' || text.trim().length < 3) {
      res.status(400).json({ error: 'Please describe your situation in at least a few words.' });
      return;
    }

    const result = await processCitizenExtraction({
      text,
      preferredEngine: provider || preferredEngine,
      ollamaUrl,
      ollamaModel,
    });

    if (result.status !== 200) {
      res.status(result.status).json({ error: result.error, code: result.code });
      return;
    }

    res.json(result.payload);
  });

  app.post('/api/explain-scheme', async (req, res) => {
    const { evaluation, uiLanguage = 'en', preferredEngine = 'auto', ollamaUrl, ollamaModel } = req.body as {
      evaluation?: SchemeEvaluation;
      uiLanguage?: UILanguage;
      preferredEngine?: 'auto' | 'ollama' | 'gemini';
      ollamaUrl?: string;
      ollamaModel?: string;
    };

    if (!evaluation || !evaluation.scheme) {
      res.status(400).json({ error: 'Missing evaluation payload.' });
      return;
    }

    let activeOllamaUrl = DEFAULT_OLLAMA_URL;
    try {
      activeOllamaUrl = validateOllamaUrl(ollamaUrl || DEFAULT_OLLAMA_URL);
    } catch {
      res.status(400).json({ error: 'Invalid Ollama URL provided.' });
      return;
    }
    const activeOllamaModel = ollamaModel || DEFAULT_OLLAMA_MODEL;

    if (preferredEngine !== 'gemini') {
      const probe = await probeOllamaEndpoint(activeOllamaUrl, 1200);
      if (probe.reachable) {
        try {
          const selectedModel = probe.models.includes(activeOllamaModel)
            ? activeOllamaModel
            : probe.models[0] || activeOllamaModel;
          const resOllama = await callOllamaExplain(evaluation, uiLanguage, activeOllamaUrl, selectedModel, 14000);
          if (resOllama.explanation) {
            res.json({ explanation: resOllama.explanation, engineUsed: 'ollama', modelName: selectedModel });
            return;
          }
        } catch {
          // fall through to Gemini / grounded template
        }
      }
    }

    if (getGeminiClient()) {
      try {
        const explanation = await explainWithGemini(evaluation, uiLanguage);
        if (explanation) {
          res.json({ explanation, engineUsed: 'gemini', modelName: 'gemini-4-hydrogen' });
          return;
        }
      } catch {
        // fall through to grounded template
      }
    }

    res.json({
      explanation: buildGroundedFallbackExplanation(evaluation, uiLanguage),
      engineUsed: 'local-parser',
      modelName: 'Grounded Rule Template',
    });
  });

  app.post('/api/transcribe-audio', async (req, res) => {
    const { audioBase64, mimeType, speechLang = 'mr-IN' } = req.body as {
      audioBase64?: string;
      mimeType?: string;
      speechLang?: string;
    };

    if (!audioBase64 || typeof audioBase64 !== 'string' || audioBase64.length < 16) {
      res.status(400).json({ error: 'No audio recording was received. Please speak for at least 1 second.' });
      return;
    }

    const cleanMime = typeof mimeType === 'string' && mimeType.startsWith('audio/')
      ? mimeType.split(';')[0].trim()
      : 'audio/webm';

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Voice audio transcription service is not configured on the server. Please type or use Chrome live voice dictation.',
      });
      return;
    }

    const langHint =
      speechLang === 'mr-IN'
        ? 'Marathi (Devanagari script)'
        : speechLang === 'hi-IN'
          ? 'Hindi (Devanagari script)'
          : 'English (Indian English)';

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: audioBase64,
              },
            },
            {
              text: `Transcribe this citizen voice statement accurately in ${langHint}. Preserve numbers (age, income, acres), district names, and ration card details. Output only the clean transcript text without commentary.`,
            },
          ],
        },
      });

      const transcript = (response.text || '').trim();
      if (!transcript) {
        res.status(422).json({ error: 'Could not hear any clear speech in the recording. Please try again closer to the mic.' });
        return;
      }

      res.json({ transcript });
    } catch (err) {
      res.status(502).json({
        error: `Audio transcription failed (${err instanceof Error ? err.message : 'upstream error'}). Please try again or type your situation below.`,
      });
    }
  });

  return app;
}
