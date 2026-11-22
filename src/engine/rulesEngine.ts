import { SCHEMES } from '../data/schemes.ts';
import {
  CitizenProfile,
  EligibilityStatus,
  GovernmentScheme,
  RuleEvaluationResult,
  SchemeEvaluation,
} from '../types/scheme.ts';
export {
  compareBoolean,
  compareMaharashtraDomicile,
  compareMaxNumber,
  compareMinNumber,
  compareNumberRange,
  fmtINR,
  formatRationCardLabel,
  isMaharashtraState,
  missingRuleValue,
  type RuleCompareResult,
} from './ruleHelpers.ts';

export function evaluateScheme(scheme: GovernmentScheme, profile: CitizenProfile): SchemeEvaluation {
  const passedRules: RuleEvaluationResult[] = [];
  const failedRules: RuleEvaluationResult[] = [];
  const missingRules: RuleEvaluationResult[] = [];

  for (const rule of scheme.rules) {
    const res = rule.evaluate(profile);
    const entry: RuleEvaluationResult = {
      ruleId: rule.id,
      field: rule.field,
      label: rule.label,
      requirementText: rule.requirementText,
      outcome: res.outcome,
      observedDisplay: res.observedDisplay,
    };
    if (res.outcome === 'pass') passedRules.push(entry);
    else if (res.outcome === 'fail') failedRules.push(entry);
    else missingRules.push(entry);
  }

  let status: EligibilityStatus = 'eligible';
  if (failedRules.length > 0) {
    status = 'ineligible';
  } else if (missingRules.length > 0) {
    status = 'needs_info';
  }

  return {
    scheme,
    status,
    passedRules,
    failedRules,
    missingRules,
    totalRules: scheme.rules.length,
    passedCount: passedRules.length,
  };
}

export function evaluateAllSchemes(profile: CitizenProfile): SchemeEvaluation[] {
  const evaluations = SCHEMES.map((scheme) => evaluateScheme(scheme, profile));

  const rank: Record<EligibilityStatus, number> = {
    eligible: 0,
    needs_info: 1,
    ineligible: 2,
  };

  const relevanceScore = (ev: SchemeEvaluation): number => {
    if (ev.passedCount === 0) return 0;
    const ratio = ev.totalRules > 0 ? ev.passedCount / ev.totalRules : 0;
    return ev.passedCount * 10 + Math.round(ratio * 10);
  };

  return evaluations.sort((a, b) => {
    if (rank[a.status] !== rank[b.status]) {
      return rank[a.status] - rank[b.status];
    }
    if (a.status === 'needs_info') {
      const scoreDiff = relevanceScore(b) - relevanceScore(a);
      if (scoreDiff !== 0) return scoreDiff;
    }
    return b.scheme.benefitNumericINR - a.scheme.benefitNumericINR;
  });
}

export const EMPTY_PROFILE: CitizenProfile = {
  fullName: null,
  age: null,
  gender: null,
  maritalStatus: null,
  state: null,
  district: null,
  residenceType: null,
  annualIncomeINR: null,
  occupation: null,
  landHoldingAcres: null,
  socialCategory: null,
  rationCardType: null,
  hasPuccaHouse: null,
  hasLpgConnection: null,
  hasGirlChild: null,
  girlChildAge: null,
  isGovernmentEmployee: null,
  isIncomeTaxPayer: null,
  isDifferentlyAbled: null,
  educationLevel: null,
  bankAccountLinkedAadhaar: null,
  spokenLanguage: 'mr',
  rawSummary: '',
};

