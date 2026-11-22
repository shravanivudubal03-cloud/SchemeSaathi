import { BilingualText, RationCardType, RuleOutcome } from '../types/scheme.ts';

export interface RuleCompareResult {
  outcome: RuleOutcome;
  observedDisplay: BilingualText;
}

export const fmtINR = (val: number): string =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export const missingRuleValue = (enLabel: string, mrLabel: string): RuleCompareResult => ({
  outcome: 'missing',
  observedDisplay: { en: `Not stated (${enLabel})`, mr: `माहिती उपलब्ध नाही (${mrLabel})` },
});

export function isMaharashtraState(state: string | null): boolean {
  if (!state) return false;
  const s = state.trim().toLowerCase();
  return s.includes('maharashtra') || s.includes('महाराष्ट्र') || s === 'mh';
}

export function compareMaharashtraDomicile(state: string | null): RuleCompareResult {
  if (!state) return missingRuleValue('State', 'राज्य');
  return {
    outcome: isMaharashtraState(state) ? 'pass' : 'fail',
    observedDisplay: { en: state, mr: state },
  };
}

export function compareMaxNumber(
  value: number | null,
  maxInclusive: number,
  missingLabels: [string, string],
  formatValue: (v: number) => BilingualText,
): RuleCompareResult {
  if (value === null) return missingRuleValue(missingLabels[0], missingLabels[1]);
  return {
    outcome: value <= maxInclusive ? 'pass' : 'fail',
    observedDisplay: formatValue(value),
  };
}

export function compareMinNumber(
  value: number | null,
  minInclusive: number,
  missingLabels: [string, string],
  formatValue: (v: number) => BilingualText,
): RuleCompareResult {
  if (value === null) return missingRuleValue(missingLabels[0], missingLabels[1]);
  return {
    outcome: value >= minInclusive ? 'pass' : 'fail',
    observedDisplay: formatValue(value),
  };
}

export function compareNumberRange(
  value: number | null,
  minInclusive: number,
  maxInclusive: number,
  missingLabels: [string, string],
  formatValue: (v: number) => BilingualText,
): RuleCompareResult {
  if (value === null) return missingRuleValue(missingLabels[0], missingLabels[1]);
  return {
    outcome: value >= minInclusive && value <= maxInclusive ? 'pass' : 'fail',
    observedDisplay: formatValue(value),
  };
}

export function compareBoolean(
  value: boolean | null,
  expected: boolean,
  missingLabels: [string, string],
  trueText: BilingualText,
  falseText: BilingualText,
): RuleCompareResult {
  if (value === null) return missingRuleValue(missingLabels[0], missingLabels[1]);
  return {
    outcome: value === expected ? 'pass' : 'fail',
    observedDisplay: value ? trueText : falseText,
  };
}

export function formatRationCardLabel(card: RationCardType): BilingualText {
  switch (card) {
    case 'antyodaya':
      return { en: 'Antyodaya Card', mr: 'अंत्योदय रेशन कार्ड' };
    case 'bpl_yellow':
      return { en: 'Yellow (BPL) Ration Card', mr: 'पिवळे (BPL) रेशन कार्ड' };
    case 'apl_orange':
      return { en: 'Orange (APL) Ration Card', mr: 'केशरी रेशन कार्ड' };
    case 'white':
      return { en: 'White Ration Card', mr: 'पांढरे रेशन कार्ड' };
    case 'none':
      return { en: 'No Ration Card', mr: 'रेशन कार्ड नाही' };
  }
}
