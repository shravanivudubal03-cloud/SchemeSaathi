import type { CitizenProfile, SchemeEvaluation, UILanguage } from '../types/scheme.ts';
import { sanitizeCitizenProfile } from './fallbackExtractor.ts';

export const CITIZEN_PROFILE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    fullName: { type: ['string', 'null'] },
    age: { type: ['number', 'null'] },
    gender: { type: ['string', 'null'], enum: ['female', 'male', 'other', null] },
    maritalStatus: { type: ['string', 'null'], enum: ['married', 'single', 'widowed', 'divorced', null] },
    state: { type: ['string', 'null'] },
    district: { type: ['string', 'null'] },
    residenceType: { type: ['string', 'null'], enum: ['rural', 'urban', null] },
    annualIncomeINR: { type: ['number', 'null'] },
    occupation: {
      type: ['string', 'null'],
      enum: ['farmer', 'artisan', 'daily_wage', 'student', 'small_business', 'homemaker', 'unemployed', 'salaried', 'senior_citizen', null],
    },
    landHoldingAcres: { type: ['number', 'null'] },
    socialCategory: { type: ['string', 'null'], enum: ['general', 'obc', 'sc', 'st', 'nt_vjnt', 'ews', null] },
    rationCardType: { type: ['string', 'null'], enum: ['antyodaya', 'bpl_yellow', 'apl_orange', 'white', 'none', null] },
    hasPuccaHouse: { type: ['boolean', 'null'] },
    hasLpgConnection: { type: ['boolean', 'null'] },
    hasGirlChild: { type: ['boolean', 'null'] },
    girlChildAge: { type: ['number', 'null'] },
    isGovernmentEmployee: { type: ['boolean', 'null'] },
    isIncomeTaxPayer: { type: ['boolean', 'null'] },
    isDifferentlyAbled: { type: ['boolean', 'null'] },
    educationLevel: { type: ['string', 'null'], enum: ['school', 'undergraduate', 'postgraduate', 'iti_diploma', 'none', null] },
    bankAccountLinkedAadhaar: { type: ['boolean', 'null'] },
    spokenLanguage: { type: 'string', enum: ['mr', 'hi', 'en'] },
  },
  required: ['spokenLanguage'],
} as const;

export const EXTRACTION_SYSTEM_PROMPT = `You are a strict JSON entity extractor for Indian citizen welfare intake.
NEVER recommend schemes, mention scheme names, or judge eligibility.
ONLY extract factual attributes explicitly stated or clearly implied in the user's Marathi, Hindi, or English text.
Field mapping rules:
- fullName: citizen's personal name ONLY if explicitly stated (e.g. "माझे नाव सुनीता"), else null. NEVER output "महाराष्ट्रातील", "Maharashtra", or "मुलगी" as fullName.
- age: integer age in years (convert Devanagari numerals ०-९ to 0-9; handle "22 वर्षीय" -> 22), else null.
- gender: "female", "male", or "other" (if "widow"/"विधवा"/"महिला"/"मुलगी"/"तरुणी"/"लड़की"/"girl"/"गृहिणी", set "female").
- maritalStatus: "married", "single", "widowed", or "divorced".
- state: set "Maharashtra" if Maharashtra or any MH district/city is named (Pune, Mumbai, Nagpur, Nashik, Amravati, Yavatmal, Kolhapur, Satara, Solapur, Thane, Sangli, Latur, Nanded, Akola, Wardha, Jalgaon, Ahmednagar/Ahilyanagar, Aurangabad/Sambhajinagar, etc.).
- district: district/city name if mentioned, else null.
- residenceType: "rural" (ग्रामीण/गाव/village) or "urban" (शहरी/शहर/city).
- annualIncomeINR: full integer in INR. Convert "1.5 lakh"/"दीड लाख" -> 150000, "1.2 लाख" -> 120000, "95 हजार"/"90 thousand" -> 95000/90000. Multiply monthly income by 12 if stated per month.
- occupation: one of ["farmer","artisan","daily_wage","student","small_business","homemaker","unemployed","salaried","senior_citizen"] (tailor/दर्जी/शिंपी/carpenter/potter/barber/cobbler/blacksmith/mason -> "artisan"; kirana/shop/salon -> "small_business"; कष्टकरी/मजूर -> "daily_wage").
- landHoldingAcres: numeric acres (e.g. 2.5), 0 if landless/भूमिहीन, else null.
- socialCategory: one of ["general","obc","sc","st","nt_vjnt","ews"].
- rationCardType: "antyodaya", "bpl_yellow" (yellow/पिवळे/BPL), "apl_orange" (orange/केशरी), "white", or "none".
- hasPuccaHouse: false if kutcha house/कच्चे घर/घर नाही/no pucca house; true if owns pucca house; else null.
- hasLpgConnection: false if no LPG/no gas/गॅस नाही/चूल; true if has LPG; else null.
- hasGirlChild: true ONLY if user states they HAVE a daughter ("मला मुलगी आहे" / "my daughter" / "I have a girl child"). If the speaker says "मी २२ वर्षीय मुलगी आहे" or "I am a 22 year old girl", set gender="female" and hasGirlChild=null! girlChildAge: numeric age of daughter if stated.
- isGovernmentEmployee: false if stated non-govt or self-employed (farmer/artisan/daily_wage/student); true if govt employee; else null.
- isIncomeTaxPayer: false if stated non-taxpayer or annualIncomeINR <= 250000; true if taxpayer; else null.
- isDifferentlyAbled: true if disabled/दिव्यांग/अपंग; else null.
- educationLevel: one of ["school","undergraduate","postgraduate","iti_diploma","none"].
- spokenLanguage: "mr" (Marathi), "hi" (Hindi), or "en" (English).
Return null for any unstated attribute. Output strictly one JSON object matching the schema.`;

export function buildExplanationPrompt(evaluation: SchemeEvaluation, lang: UILanguage): string {
  const targetLang = lang === 'mr' ? 'simple, respectful Marathi (मराठी)' : 'clear, empathetic plain English';
  return `Explain the following deterministic government scheme eligibility result in ${targetLang} in 2 to 3 short sentences.
STRICT RULES:
- Do NOT alter or re-decide eligibility; trust the deterministic status below.
- Mention the exact observed reason(s) and cite the official portal (${evaluation.scheme.officialSource.portalName}) and circular (${evaluation.scheme.officialSource.circularRef}).

Scheme: ${evaluation.scheme.name[lang]}
Benefit: ${evaluation.scheme.benefitAmount[lang]}
Deterministic Status: ${evaluation.status}
Passed Rules: ${evaluation.passedRules.map((r) => `${r.label[lang]} => ${r.observedDisplay[lang]}`).join(' | ') || 'None'}
Missing Rules: ${evaluation.missingRules.map((r) => r.label[lang]).join(' | ') || 'None'}
Failed Rules: ${evaluation.failedRules.map((r) => `${r.label[lang]} => ${r.observedDisplay[lang]}`).join(' | ') || 'None'}`;
}

export function validateOllamaUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl.trim());
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Ollama URL must use http:// or https://');
  }
  const host = parsed.hostname.toLowerCase();
  if (
    host === '169.254.169.254' ||
    host === 'metadata.google.internal' ||
    host.startsWith('169.254.')
  ) {
    throw new Error('Link-local and cloud metadata addresses are not allowed for Ollama URL');
  }
  return parsed.toString().replace(/\/$/, '');
}

export async function probeOllamaEndpoint(baseUrl: string, timeoutMs = 1500): Promise<{
  reachable: boolean;
  models: string[];
  version?: string;
}> {
  try {
    const cleanUrl = validateOllamaUrl(baseUrl);
    const [tagsRes, verRes] = await Promise.all([
      fetch(`${cleanUrl}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) }),
      fetch(`${cleanUrl}/api/version`, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) }).catch(() => null),
    ]);
    if (!tagsRes.ok) return { reachable: false, models: [] };
    const data = (await tagsRes.json()) as { models?: Array<{ name: string }> };
    let version: string | undefined;
    if (verRes && verRes.ok) {
      const vData = (await verRes.json().catch(() => ({}))) as { version?: string };
      version = vData.version;
    }
    return {
      reachable: true,
      models: Array.isArray(data.models) ? data.models.map((m) => m.name) : [],
      version,
    };
  } catch {
    return { reachable: false, models: [] };
  }
}

export async function callOllamaExtract(
  text: string,
  baseUrl: string,
  model: string,
  timeoutMs = 15000,
): Promise<{ profile: CitizenProfile; rawJson: Partial<CitizenProfile>; latencyMs: number }> {
  const cleanUrl = validateOllamaUrl(baseUrl);
  const start = Date.now();

  const sendChat = async (formatPayload: unknown) => {
    return fetch(`${cleanUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
      body: JSON.stringify({
        model,
        format: formatPayload,
        stream: false,
        options: { temperature: 0 },
        messages: [
          { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
    });
  };

  // Prefer Structured Outputs JSON schema (Ollama >= 0.5), fallback cleanly to format: "json"
  let response = await sendChat(CITIZEN_PROFILE_JSON_SCHEMA);
  if (response.status === 400) {
    response = await sendChat('json');
  }

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  const content = data.message?.content?.trim() || '{}';
  const rawJson = JSON.parse(content) as Partial<CitizenProfile>;
  return {
    profile: sanitizeCitizenProfile(rawJson, text),
    rawJson,
    latencyMs: Date.now() - start,
  };
}

export async function callOllamaExplain(
  evaluation: SchemeEvaluation,
  lang: UILanguage,
  baseUrl: string,
  model: string,
  timeoutMs = 15000,
): Promise<{ explanation: string; latencyMs: number }> {
  const cleanUrl = validateOllamaUrl(baseUrl);
  const start = Date.now();
  const prompt = buildExplanationPrompt(evaluation, lang);

  const response = await fetch(`${cleanUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model,
      stream: false,
      options: { temperature: 0.2 },
      messages: [
        {
          role: 'system',
          content:
            'You are a civic welfare explainer. You only explain deterministic rules engine outputs accurately and cite official sources.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama returned HTTP ${response.status}`);
  }

  const data = (await response.json()) as { message?: { content?: string } };
  return {
    explanation: (data.message?.content || '').trim(),
    latencyMs: Date.now() - start,
  };
}
