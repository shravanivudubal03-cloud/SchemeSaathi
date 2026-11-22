import React, { useEffect, useState } from 'react';
import { Printer, Download, Volume2, Square, ExternalLink, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { UI_COPY } from '../i18n/translations.ts';
import { CitizenProfile, SchemeEvaluation, UILanguage } from '../types/scheme.ts';

interface ApplicationDeskProps {
  selectedEvaluation: SchemeEvaluation | null;
  eligibleEvaluations: SchemeEvaluation[];
  profile: CitizenProfile;
  uiLanguage: UILanguage;
  onSelectEvaluation: (evalItem: SchemeEvaluation) => void;
  onBackToCopilot: () => void;
}

export const ApplicationDesk: React.FC<ApplicationDeskProps> = ({
  selectedEvaluation,
  eligibleEvaluations,
  profile,
  uiLanguage,
  onSelectEvaluation,
  onBackToCopilot,
}) => {
  const copy = UI_COPY[uiLanguage];
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!selectedEvaluation) return;
    const prefilled: Record<string, string> = {};
    for (const field of selectedEvaluation.scheme.applicationFields) {
      if (field.profileKey && profile[field.profileKey] !== null && profile[field.profileKey] !== undefined) {
        prefilled[field.id] = String(profile[field.profileKey]);
      } else {
        prefilled[field.id] = '';
      }
    }
    setFormValues(prefilled);
  }, [selectedEvaluation, profile]);

  const handleDownloadJson = () => {
    if (!selectedEvaluation) return;
    const payload = {
      schemeId: selectedEvaluation.scheme.id,
      schemeName: selectedEvaluation.scheme.name,
      officialPortal: selectedEvaluation.scheme.officialSource.url,
      circularRef: selectedEvaluation.scheme.officialSource.circularRef,
      generatedAt: new Date().toISOString(),
      applicantData: formValues,
      verifiedRulesPassed: selectedEvaluation.passedRules.map((r) => r.ruleId),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedEvaluation.scheme.id}-application.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReadAloud = () => {
    if (!selectedEvaluation || !('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const lines = selectedEvaluation.scheme.applicationFields
      .map((f) => `${f.label[uiLanguage]}: ${formValues[f.id] || (uiLanguage === 'mr' ? 'रिक्त' : 'blank')}`)
      .join('. ');
    const text =
      uiLanguage === 'mr'
        ? `${selectedEvaluation.scheme.name.mr} चा भरलेला अर्ज. ${lines}.`
        : `Pre-filled form for ${selectedEvaluation.scheme.name.en}. ${lines}.`;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = uiLanguage === 'mr' ? 'mr-IN' : 'en-IN';
    utter.rate = 0.94;
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  if (!selectedEvaluation) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        <div className="md:col-span-7">
          <h2 className="font-display text-2xl font-semibold text-[#050D16]">{copy.formDeskTitle}</h2>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed max-w-xl">{copy.selectSchemeFirst}</p>
          {eligibleEvaluations.length > 0 && (
            <div className="mt-5 space-y-2">
              {eligibleEvaluations.slice(0, 4).map((ev) => (
                <button
                  key={ev.scheme.id}
                  type="button"
                  onClick={() => onSelectEvaluation(ev)}
                  className="w-full text-left px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#F0FDF4] hover:border-[#16A34A]/40 flex items-center justify-between gap-3 cursor-pointer"
                >
                  <span className="text-sm font-semibold text-[#050D16]">{ev.scheme.name[uiLanguage]}</span>
                  <span className="text-xs font-mono-tabular text-[#047857] shrink-0">{ev.scheme.benefitAmount[uiLanguage]}</span>
                </button>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={onBackToCopilot}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded-lg hover:bg-[#047857] cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{copy.navCopilot}</span>
          </button>
        </div>
        <div className="md:col-span-5">
          <img
            src="/src/assets/images/paperwork_archive_detail_1795271183993.jpg"
            alt="Government welfare paper application forms and pen on desk"
            referrerPolicy="no-referrer"
            className="w-full aspect-[4/3] object-cover rounded-lg border border-slate-200"
          />
        </div>
      </div>
    );
  }

  const { scheme } = selectedEvaluation;

  return (
    <div className="space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToCopilot}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{copy.navCopilot}</span>
          </button>
          <div>
            <h2 className="font-display text-lg font-semibold text-[#050D16]">{copy.formDeskTitle}</h2>
            <p className="text-xs text-slate-600">{copy.formDeskSubtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleReadAloud}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#047857] cursor-pointer whitespace-nowrap shrink-0"
          >
            {isSpeaking ? <Square className="w-3.5 h-3.5 text-amber-700" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>{isSpeaking ? copy.stopAudioBtn : copy.readFormAloudBtn}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-slate-200 rounded-lg bg-white hover:bg-slate-50 text-[#050D16] cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{copy.downloadJsonBtn}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#16A34A] hover:bg-[#047857] text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{copy.printPdfBtn}</span>
          </button>
        </div>
      </div>

      <div className="print-sheet bg-white border border-slate-300 rounded-xl p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b-2 border-[#050D16]">
          <div>
            <p className="text-xs font-medium text-slate-600">{scheme.ministry[uiLanguage]}</p>
            <h3 className="font-display text-2xl font-bold text-[#050D16] mt-1">{scheme.name[uiLanguage]}</h3>
            <p className="text-xs text-slate-600 mt-1">
              {scheme.officialSource.circularRef} · {scheme.officialSource.portalName}
            </p>
          </div>
          <div className="sm:text-right shrink-0">
            <span className="block text-[11px] text-slate-500">
              {uiLanguage === 'mr' ? 'अर्ज संदर्भ' : 'Application Draft'}
            </span>
            <span className="font-mono-tabular text-sm font-semibold text-[#047857]">
              {scheme.id.toUpperCase()}-2026
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {scheme.applicationFields.map((field) => (
            <div key={field.id}>
              <label htmlFor={`form-${field.id}`} className="block text-xs font-semibold text-[#050D16] mb-1.5">
                {field.label[uiLanguage]}
                {field.required && <span className="text-[#16A34A] ml-1">*</span>}
              </label>
              {field.type === 'select' && field.options ? (
                <select
                  id={`form-${field.id}`}
                  value={formValues[field.id] ?? ''}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                >
                  <option value="">{field.placeholder[uiLanguage]}</option>
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label[uiLanguage]}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`form-${field.id}`}
                  type={field.type}
                  value={formValues[field.id] ?? ''}
                  placeholder={field.placeholder[uiLanguage]}
                  onChange={(e) => setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-[#050D16] mb-2">
            {uiLanguage === 'mr' ? 'पात्रता पडताळणी सारांश (नियम इंजिन)' : 'Deterministic Eligibility Pre-Check Summary'}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {selectedEvaluation.passedRules.map((r) => (
              <div key={r.ruleId} className="flex items-center gap-2 text-[#047857]">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {r.label[uiLanguage]}: <strong className="font-mono-tabular">{r.observedDisplay[uiLanguage]}</strong>
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">{copy.declarationText}</p>
          <div className="shrink-0 text-right">
            <div className="w-48 border-b border-[#050D16] h-8 mb-1" />
            <span className="text-[11px] text-slate-500">
              {uiLanguage === 'mr' ? 'अर्जदाराची स्वाक्षरी / अंगठा' : 'Applicant Signature / Thumbprint'}
            </span>
          </div>
        </div>

        <div className="no-print mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600">
            {uiLanguage === 'mr'
              ? 'अंतिम अर्ज ऑनलाइन सादर करण्यासाठी अधिकृत पोर्टलवर जा किंवा आपले सरकार केंद्रात हा प्रिंट घ्या:'
              : 'Submit online at the official portal or carry this printed form to your nearest Aaple Sarkar Seva Kendra:'}
          </span>
          <a
            href={scheme.officialSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#047857] underline underline-offset-2"
          >
            <span>{scheme.officialSource.portalName}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
