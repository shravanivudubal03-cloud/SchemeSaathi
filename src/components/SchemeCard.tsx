import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  Volume2,
  Square,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquareText,
} from 'lucide-react';
import { UI_COPY } from '../i18n/translations.ts';
import { CitizenProfile, SchemeEvaluation, UILanguage } from '../types/scheme.ts';

interface SchemeCardProps {
  evaluation: SchemeEvaluation;
  profile: CitizenProfile;
  uiLanguage: UILanguage;
  explanation?: string;
  isExplaining?: boolean;
  onRequestExplanation: (evaluation: SchemeEvaluation) => void;
  onUpdateProfileField: (field: keyof CitizenProfile, value: unknown) => void;
  onOpenApplicationForm: (evaluation: SchemeEvaluation) => void;
}

export const SchemeCard: React.FC<SchemeCardProps> = ({
  evaluation,
  profile,
  uiLanguage,
  explanation,
  isExplaining,
  onRequestExplanation,
  onUpdateProfileField,
  onOpenApplicationForm,
}) => {
  const copy = UI_COPY[uiLanguage];
  const { scheme, status, passedRules, failedRules, missingRules, totalRules, passedCount } = evaluation;
  const [expandedRules, setExpandedRules] = useState(status !== 'ineligible');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  const toggleDoc = (docId: string) => {
    setCheckedDocs((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleSpeakSummary = () => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const docList = scheme.requiredDocuments.map((d) => d.name[uiLanguage]).join(', ');
    const spokenSummary =
      explanation ||
      (uiLanguage === 'mr'
        ? `${scheme.name.mr}. लाभ: ${scheme.benefitAmount.mr}. आवश्यक कागदपत्रे: ${docList}.`
        : `${scheme.name.en}. Benefit: ${scheme.benefitAmount.en}. Required documents: ${docList}.`);
    const utterance = new SpeechSynthesisUtterance(spokenSummary);
    utterance.lang = uiLanguage === 'mr' ? 'mr-IN' : 'en-IN';
    utterance.rate = 0.94;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const statusConfig = {
    eligible: {
      icon: CheckCircle2,
      text: copy.statusEligible,
      textColor: 'text-[#047857]',
      surfaceBorder: 'border-[#16A34A]/40',
    },
    needs_info: {
      icon: AlertCircle,
      text: copy.statusNeedsInfo,
      textColor: 'text-amber-700',
      surfaceBorder: 'border-slate-200',
    },
    ineligible: {
      icon: XCircle,
      text: copy.statusIneligible,
      textColor: 'text-slate-500',
      surfaceBorder: 'border-slate-200',
    },
  }[status];

  const StatusIcon = statusConfig.icon;
  const allRules = [...passedRules, ...missingRules, ...failedRules];

  const renderQuickClarifier = (field: keyof CitizenProfile) => {
    if (field === 'rationCardType') {
      return (
        <select
          aria-label="Ration card type"
          value={profile.rationCardType ?? ''}
          onChange={(e) => onUpdateProfileField('rationCardType', e.target.value || null)}
          className="mt-1.5 text-xs border border-[#16A34A]/50 rounded-md px-2 py-1 bg-white text-[#050D16]"
        >
          <option value="">{uiLanguage === 'mr' ? 'रेशन कार्ड निवडा…' : 'Select ration card…'}</option>
          <option value="bpl_yellow">{uiLanguage === 'mr' ? 'पिवळे (BPL)' : 'Yellow (BPL)'}</option>
          <option value="apl_orange">{uiLanguage === 'mr' ? 'केशरी (APL)' : 'Orange (APL)'}</option>
          <option value="antyodaya">{uiLanguage === 'mr' ? 'अंत्योदय (AAY)' : 'Antyodaya (AAY)'}</option>
          <option value="white">{uiLanguage === 'mr' ? 'पांढरे / नाही' : 'White / None'}</option>
        </select>
      );
    }
    if (field === 'annualIncomeINR') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {[
            { amt: 80000, label: '≤ ₹0.8L' },
            { amt: 150000, label: '≤ ₹1.5L' },
            { amt: 250000, label: '≤ ₹2.5L' },
            { amt: 500000, label: '₹2.5L–₹6L' },
          ].map((opt) => (
            <button
              key={opt.amt}
              type="button"
              onClick={() => onUpdateProfileField('annualIncomeINR', opt.amt)}
              className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] hover:border-[#16A34A]/50 cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }
    if (field === 'isIncomeTaxPayer') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('isIncomeTaxPayer', false)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] hover:border-[#16A34A]/50 cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'आयकर दाता नाही' : 'Not Taxpayer'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfileField('isIncomeTaxPayer', true)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'आयकर भरतो' : 'Pays Tax'}
          </button>
        </div>
      );
    }
    if (field === 'isGovernmentEmployee') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('isGovernmentEmployee', false)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] hover:border-[#16A34A]/50 cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'शासकीय नोकरी नाही' : 'Not Govt Employee'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfileField('isGovernmentEmployee', true)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'शासकीय कर्मचारी' : 'Govt Employee'}
          </button>
        </div>
      );
    }
    if (field === 'gender') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('gender', 'female')}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'महिला' : 'Female'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfileField('gender', 'male')}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'पुरुष' : 'Male'}
          </button>
        </div>
      );
    }
    if (field === 'occupation') {
      return (
        <select
          aria-label="Occupation"
          value={profile.occupation ?? ''}
          onChange={(e) => onUpdateProfileField('occupation', e.target.value || null)}
          className="mt-1.5 text-xs border border-[#16A34A]/50 rounded-md px-2 py-1 bg-white text-[#050D16]"
        >
          <option value="">{uiLanguage === 'mr' ? 'व्यवसाय निवडा…' : 'Select occupation…'}</option>
          <option value="student">{uiLanguage === 'mr' ? 'विद्यार्थी' : 'Student'}</option>
          <option value="homemaker">{uiLanguage === 'mr' ? 'गृहिणी / घरकाम' : 'Homemaker'}</option>
          <option value="farmer">{uiLanguage === 'mr' ? 'शेतकरी' : 'Farmer'}</option>
          <option value="artisan">{uiLanguage === 'mr' ? 'कारागीर (शिंपी/सुतार)' : 'Artisan'}</option>
          <option value="daily_wage">{uiLanguage === 'mr' ? 'मजूर / कामगार' : 'Daily Wage Worker'}</option>
          <option value="small_business">{uiLanguage === 'mr' ? 'छोटा व्यवसाय' : 'Small Business'}</option>
          <option value="unemployed">{uiLanguage === 'mr' ? 'बेरोजगार / स्वयंरोजगार' : 'Unemployed / Self-employed'}</option>
          <option value="salaried">{uiLanguage === 'mr' ? 'पगारदार नोकरी' : 'Salaried'}</option>
        </select>
      );
    }
    if (field === 'maritalStatus') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {[
            { val: 'single', label: uiLanguage === 'mr' ? 'अविवाहित' : 'Single' },
            { val: 'married', label: uiLanguage === 'mr' ? 'विवाहित' : 'Married' },
            { val: 'widowed', label: uiLanguage === 'mr' ? 'विधवा' : 'Widowed' },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => onUpdateProfileField('maritalStatus', opt.val)}
              className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }
    if (field === 'landHoldingAcres') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {[
            { val: 0, label: uiLanguage === 'mr' ? 'जमीन नाही (०)' : 'None (0)' },
            { val: 1.5, label: uiLanguage === 'mr' ? '१.५ एकर' : '1.5 Acres' },
          ].map((opt) => (
            <button
              key={opt.val}
              type="button"
              onClick={() => onUpdateProfileField('landHoldingAcres', opt.val)}
              className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    }
    if (field === 'hasPuccaHouse') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('hasPuccaHouse', false)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'कच्चे घर आहे' : 'Kutcha / No Pucca House'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfileField('hasPuccaHouse', true)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'पक्के घर आहे' : 'Own Pucca House'}
          </button>
        </div>
      );
    }
    if (field === 'hasLpgConnection') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('hasLpgConnection', false)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'गॅस जोडणी नाही' : 'No LPG Connection'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfileField('hasLpgConnection', true)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'आधीच गॅस आहे' : 'Already Has LPG'}
          </button>
        </div>
      );
    }
    if (field === 'hasGirlChild') {
      return (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('hasGirlChild', true)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'होय, मुलगी आहे' : 'Yes, Girl Child'}
          </button>
          <button
            type="button"
            onClick={() => onUpdateProfileField('hasGirlChild', false)}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'नाही' : 'No'}
          </button>
        </div>
      );
    }
    if (field === 'state') {
      return (
        <div className="mt-1.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onUpdateProfileField('state', 'Maharashtra')}
            className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded bg-slate-50 hover:bg-[#F0FDF4] cursor-pointer"
          >
            {uiLanguage === 'mr' ? 'महाराष्ट्र' : 'Maharashtra'}
          </button>
        </div>
      );
    }
    return null;
  };

  return (
    <article className={`bg-white border ${statusConfig.surfaceBorder} rounded-xl p-6 transition-colors`}>
      {/* Unboxed Metadata Header (Zero Pills) */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[#047857]">
            {scheme.level === 'Maharashtra' ? (uiLanguage === 'mr' ? 'महाराष्ट्र शासन' : 'Govt. of Maharashtra') : uiLanguage === 'mr' ? 'भारत सरकार' : 'Govt. of India'}
          </span>
          <span aria-hidden="true">·</span>
          <span>{scheme.category}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular">
            {passedCount}/{totalRules} {uiLanguage === 'mr' ? 'निकष पूर्ण' : 'rules matched'}
          </span>
        </div>

        <div className={`inline-flex items-center gap-1.5 font-semibold ${statusConfig.textColor}`}>
          <StatusIcon className="w-4 h-4 shrink-0" />
          <span>{statusConfig.text}</span>
        </div>
      </div>

      {/* Headline & Benefit */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-display text-xl font-semibold text-[#050D16] leading-snug">
            {scheme.name[uiLanguage]}
          </h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed max-w-2xl">
            {scheme.tagline[uiLanguage]}
          </p>
        </div>
        <div className="sm:text-right shrink-0">
          <span className="block text-[11px] text-slate-500">
            {uiLanguage === 'mr' ? 'अंदाजित लाभ' : 'Benefit'}
          </span>
          <span className="font-mono-tabular text-base font-semibold text-[#047857]">
            {scheme.benefitAmount[uiLanguage]}
          </span>
        </div>
      </div>

      {/* Grounded Explanation + Voice Read-Aloud */}
      <div className="mt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onRequestExplanation(evaluation)}
              disabled={isExplaining}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#F0FDF4] hover:border-[#16A34A]/40 text-[#050D16] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <MessageSquareText className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>{isExplaining ? copy.explainingBtn : copy.explainBtn}</span>
            </button>

            <button
              type="button"
              onClick={handleSpeakSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-[#F0FDF4] text-[#047857] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isSpeaking ? <Square className="w-3.5 h-3.5 text-amber-700" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span>{isSpeaking ? copy.stopAudioBtn : copy.listenBtn}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setExpandedRules((prev) => !prev)}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-[#050D16] whitespace-nowrap cursor-pointer"
          >
            <span>{copy.ruleCheckHeader}</span>
            {expandedRules ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {explanation && (
          <p className="mt-3 text-sm leading-relaxed text-[#050D16] bg-[#F0FDF4] border border-[#16A34A]/25 rounded-lg p-3.5">
            {explanation}
          </p>
        )}
      </div>

      {/* Deterministic Auditable Rule Table */}
      {expandedRules && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-medium">{copy.ruleRequirementCol}</th>
                <th className="py-2 px-3 font-medium">{copy.ruleObservedCol}</th>
                <th className="py-2 pl-3 font-medium text-right">{uiLanguage === 'mr' ? 'निर्णय' : 'Check'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allRules.map((rule) => (
                <tr key={rule.ruleId} className="align-top">
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-[#050D16] block">{rule.label[uiLanguage]}</span>
                    <span className="text-slate-600">{rule.requirementText[uiLanguage]}</span>
                  </td>
                  <td className="py-2.5 px-3 font-mono-tabular text-[#050D16]">
                    <span>{rule.observedDisplay[uiLanguage]}</span>
                    {rule.outcome === 'missing' && renderQuickClarifier(rule.field)}
                  </td>
                  <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                    {rule.outcome === 'pass' && (
                      <span className="inline-flex items-center gap-1 text-[#047857] font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {uiLanguage === 'mr' ? 'पात्र' : 'Pass'}
                      </span>
                    )}
                    {rule.outcome === 'missing' && (
                      <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {uiLanguage === 'mr' ? 'तपासा' : 'Clarify'}
                      </span>
                    )}
                    {rule.outcome === 'fail' && (
                      <span className="inline-flex items-center gap-1 text-slate-500 font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        {uiLanguage === 'mr' ? 'अपूर्ण' : 'Not met'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Documents & Citations */}
      {status !== 'ineligible' && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <h4 className="text-xs font-semibold text-[#050D16] mb-2.5">{copy.docsHeading}</h4>
          <ul className="space-y-2">
            {scheme.requiredDocuments.map((doc) => {
              const checked = Boolean(checkedDocs[doc.id]);
              return (
                <li key={doc.id} className="flex items-start gap-2.5 text-xs">
                  <input
                    id={`${scheme.id}-${doc.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDoc(doc.id)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#16A34A] cursor-pointer"
                  />
                  <label htmlFor={`${scheme.id}-${doc.id}`} className="cursor-pointer leading-relaxed">
                    <span className={`font-medium ${checked ? 'line-through text-slate-400' : 'text-[#050D16]'}`}>
                      {doc.name[uiLanguage]}
                    </span>
                    <span className="block text-slate-600">
                      {copy.whereToGetLabel} {doc.whereToGet[uiLanguage]}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Footer: Official Source & Direct Links + Pre-Fill Form CTA */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-end justify-between gap-4">
        <div className="text-xs text-slate-600 space-y-1.5">
          <div>
            <span className="font-medium text-[#050D16]">{copy.officialSourceLabel}:</span>{' '}
            <span className="text-[11px] text-slate-500">{scheme.officialSource.circularRef}</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {scheme.officialSource.relatedLinks.map((lnk, idx) => (
              <React.Fragment key={lnk.url}>
                {idx > 0 && <span aria-hidden="true" className="text-slate-300">·</span>}
                <a
                  href={lnk.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#047857] underline underline-offset-2 hover:text-[#16A34A]"
                >
                  <span>{lnk.label[uiLanguage]}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </React.Fragment>
            ))}
          </div>
        </div>

        {status !== 'ineligible' && (
          <button
            type="button"
            onClick={() => onOpenApplicationForm(evaluation)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#16A34A] hover:bg-[#047857] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>{copy.openFormBtn}</span>
          </button>
        )}
      </div>
    </article>
  );
};
