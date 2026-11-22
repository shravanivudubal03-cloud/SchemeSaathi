export type UILanguage = 'en' | 'mr';

export type SpokenLanguage = 'mr' | 'hi' | 'en';

export type Gender = 'female' | 'male' | 'other';
export type MaritalStatus = 'married' | 'single' | 'widowed' | 'divorced';
export type ResidenceType = 'rural' | 'urban';
export type Occupation =
  | 'farmer'
  | 'artisan'
  | 'daily_wage'
  | 'student'
  | 'small_business'
  | 'homemaker'
  | 'unemployed'
  | 'salaried'
  | 'senior_citizen';

export type SocialCategory = 'general' | 'obc' | 'sc' | 'st' | 'nt_vjnt' | 'ews';
export type RationCardType = 'antyodaya' | 'bpl_yellow' | 'apl_orange' | 'white' | 'none';
export type EducationLevel = 'school' | 'undergraduate' | 'postgraduate' | 'iti_diploma' | 'none';

export interface CitizenProfile {
  fullName: string | null;
  age: number | null;
  gender: Gender | null;
  maritalStatus: MaritalStatus | null;
  state: string | null;
  district: string | null;
  residenceType: ResidenceType | null;
  annualIncomeINR: number | null;
  occupation: Occupation | null;
  landHoldingAcres: number | null;
  socialCategory: SocialCategory | null;
  rationCardType: RationCardType | null;
  hasPuccaHouse: boolean | null;
  hasLpgConnection: boolean | null;
  hasGirlChild: boolean | null;
  girlChildAge: number | null;
  isGovernmentEmployee: boolean | null;
  isIncomeTaxPayer: boolean | null;
  isDifferentlyAbled: boolean | null;
  educationLevel: EducationLevel | null;
  bankAccountLinkedAadhaar: boolean | null;
  spokenLanguage: SpokenLanguage;
  rawSummary: string;
}

export interface BilingualText {
  en: string;
  mr: string;
}

export type RuleOutcome = 'pass' | 'fail' | 'missing';

export interface SchemeRule {
  id: string;
  field: keyof CitizenProfile;
  label: BilingualText;
  requirementText: BilingualText;
  evaluate: (profile: CitizenProfile) => {
    outcome: RuleOutcome;
    observedDisplay: BilingualText;
  };
}

export interface RuleEvaluationResult {
  ruleId: string;
  field: keyof CitizenProfile;
  label: BilingualText;
  requirementText: BilingualText;
  outcome: RuleOutcome;
  observedDisplay: BilingualText;
}

export interface DocumentRequirement {
  id: string;
  name: BilingualText;
  whereToGet: BilingualText;
  mandatory: boolean;
}

export interface OfficialLink {
  label: BilingualText;
  url: string;
  kind: 'portal' | 'apply' | 'status' | 'guidelines';
}

export interface OfficialSource {
  portalName: string;
  url: string;
  circularRef: string;
  lastVerified: string;
  relatedLinks: OfficialLink[];
}

export interface ScrapedLink {
  label: string;
  url: string;
}

export interface ScrapedPortalRecord {
  schemeId: string;
  portalUrl: string;
  httpStatus: number | null;
  reachable: boolean;
  pageTitle: string;
  metaDescription: string;
  scrapedLinks: ScrapedLink[];
  sourceMethod: 'direct-http' | 'search-grounding' | 'verified-registry';
  scrapedAt: string;
}

export interface CustomScrapedScheme {
  query: string;
  title: string;
  summary: string;
  officialLinks: ScrapedLink[];
  scrapedAt: string;
}

export interface ApplicationField {
  id: string;
  label: BilingualText;
  profileKey?: keyof CitizenProfile;
  type: 'text' | 'number' | 'select';
  placeholder: BilingualText;
  options?: { value: string; label: BilingualText }[];
  required: boolean;
}

export type SchemeCategory =
  | 'Women & Child'
  | 'Agriculture'
  | 'Health'
  | 'Housing'
  | 'Education'
  | 'Livelihood & Pension';

export interface GovernmentScheme {
  id: string;
  level: 'Central' | 'Maharashtra';
  category: SchemeCategory;
  ministry: BilingualText;
  name: BilingualText;
  tagline: BilingualText;
  benefitAmount: BilingualText;
  benefitNumericINR: number;
  officialSource: OfficialSource;
  rules: SchemeRule[];
  requiredDocuments: DocumentRequirement[];
  applicationFields: ApplicationField[];
}

export type EligibilityStatus = 'eligible' | 'needs_info' | 'ineligible';

export interface SchemeEvaluation {
  scheme: GovernmentScheme;
  status: EligibilityStatus;
  passedRules: RuleEvaluationResult[];
  failedRules: RuleEvaluationResult[];
  missingRules: RuleEvaluationResult[];
  totalRules: number;
  passedCount: number;
}

export type ExtractorEngine = 'ollama' | 'gemini' | 'local-parser';

export type OllamaConnectionMode = 'server' | 'browser-direct';

export type OllamaEnginePolicy = 'auto' | 'ollama' | 'gemini';

export interface ExtractionResponse {
  profile: CitizenProfile;
  extractorUsed: ExtractorEngine;
  modelName: string;
  extractionNotes: string;
}

export interface ExplanationResponse {
  explanation: string;
  engineUsed: ExtractorEngine;
  modelName: string;
}

