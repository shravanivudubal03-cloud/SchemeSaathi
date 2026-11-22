import React, { useState } from 'react';
import { Code2, SlidersHorizontal } from 'lucide-react';
import { UI_COPY } from '../i18n/translations.ts';
import { CitizenProfile, ExtractorEngine, UILanguage } from '../types/scheme.ts';

interface ProfileInspectorProps {
  profile: CitizenProfile;
  uiLanguage: UILanguage;
  extractorUsed: ExtractorEngine;
  modelName: string;
  extractionNotes: string;
  onUpdateField: (field: keyof CitizenProfile, value: unknown) => void;
}

export const ProfileInspector: React.FC<ProfileInspectorProps> = ({
  profile,
  uiLanguage,
  extractorUsed,
  modelName,
  extractionNotes,
  onUpdateField,
}) => {
  const copy = UI_COPY[uiLanguage];
  const [showJson, setShowJson] = useState(false);
  const [showEditor, setShowEditor] = useState(false);

  const summaryItems: { label: string; value: string }[] = [
    { label: uiLanguage === 'mr' ? 'नाव' : 'Name', value: profile.fullName || '—' },
    { label: uiLanguage === 'mr' ? 'वय' : 'Age', value: profile.age !== null ? `${profile.age}` : '—' },
    {
      label: uiLanguage === 'mr' ? 'लिंग' : 'Gender',
      value:
        profile.gender === 'female'
          ? uiLanguage === 'mr'
            ? 'महिला'
            : 'Female'
          : profile.gender === 'male'
            ? uiLanguage === 'mr'
              ? 'पुरुष'
              : 'Male'
            : '—',
    },
    {
      label: uiLanguage === 'mr' ? 'जिल्हा / राज्य' : 'District / State',
      value: [profile.district, profile.state].filter(Boolean).join(', ') || '—',
    },
    {
      label: uiLanguage === 'mr' ? 'वार्षिक उत्पन्न' : 'Annual Income',
      value:
        profile.annualIncomeINR !== null
          ? `₹${profile.annualIncomeINR.toLocaleString('en-IN')}`
          : '—',
    },
    {
      label: uiLanguage === 'mr' ? 'व्यवसाय' : 'Occupation',
      value: profile.occupation || '—',
    },
    {
      label: uiLanguage === 'mr' ? 'रेशन कार्ड' : 'Ration Card',
      value: profile.rationCardType ? profile.rationCardType.replace('_', ' ') : '—',
    },
    {
      label: uiLanguage === 'mr' ? 'शेतजमीन' : 'Land (Acres)',
      value: profile.landHoldingAcres !== null ? `${profile.landHoldingAcres}` : '—',
    },
  ];

  return (
    <section className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h2 className="font-display text-lg font-semibold text-[#050D16]">{copy.profileTitle}</h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {copy.profileSubtitle} · <span className="font-mono-tabular text-[#047857]">{extractorUsed} ({modelName})</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEditor((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-[#F0FDF4] hover:border-[#16A34A]/40 text-[#050D16] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>{copy.editProfileToggle}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowJson((p) => !p)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>{copy.jsonToggle}</span>
          </button>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {summaryItems.map((item) => (
          <div key={item.label}>
            <dt className="text-[11px] text-slate-500">{item.label}</dt>
            <dd className="mt-0.5 text-sm font-medium font-mono-tabular text-[#050D16] truncate">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      {extractionNotes && (
        <p className="mt-3 text-[11px] text-slate-500">{extractionNotes}</p>
      )}

      {showEditor && (
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'नाव' : 'Full Name'}
            </label>
            <input
              type="text"
              value={profile.fullName ?? ''}
              onChange={(e) => onUpdateField('fullName', e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'वय (वर्षे)' : 'Age'}
            </label>
            <input
              type="number"
              value={profile.age ?? ''}
              onChange={(e) => onUpdateField('age', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none font-mono-tabular"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'वार्षिक उत्पन्न (₹)' : 'Annual Income (INR)'}
            </label>
            <input
              type="number"
              value={profile.annualIncomeINR ?? ''}
              onChange={(e) => onUpdateField('annualIncomeINR', e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none font-mono-tabular"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'लिंग' : 'Gender'}
            </label>
            <select
              value={profile.gender ?? ''}
              onChange={(e) => onUpdateField('gender', e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
            >
              <option value="">—</option>
              <option value="female">{uiLanguage === 'mr' ? 'महिला' : 'Female'}</option>
              <option value="male">{uiLanguage === 'mr' ? 'पुरुष' : 'Male'}</option>
              <option value="other">{uiLanguage === 'mr' ? 'इतर' : 'Other'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'व्यवसाय' : 'Occupation'}
            </label>
            <select
              value={profile.occupation ?? ''}
              onChange={(e) => onUpdateField('occupation', e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
            >
              <option value="">—</option>
              <option value="farmer">Farmer / शेतकरी</option>
              <option value="artisan">Artisan / कारागीर</option>
              <option value="student">Student / विद्यार्थी</option>
              <option value="daily_wage">Daily Wage / मजूर</option>
              <option value="homemaker">Homemaker / गृहिणी</option>
              <option value="small_business">Small Business</option>
              <option value="unemployed">Unemployed / बेरोजगार</option>
              <option value="salaried">Salaried / नोकरी</option>
              <option value="senior_citizen">Senior Citizen</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'रेशन कार्ड प्रकार' : 'Ration Card Type'}
            </label>
            <select
              value={profile.rationCardType ?? ''}
              onChange={(e) => onUpdateField('rationCardType', e.target.value || null)}
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
            >
              <option value="">—</option>
              <option value="bpl_yellow">Yellow (BPL) / पिवळे</option>
              <option value="apl_orange">Orange (APL) / केशरी</option>
              <option value="antyodaya">Antyodaya / अंत्योदय</option>
              <option value="white">White / पांढरे</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'शासकीय कर्मचारी?' : 'Government Employee?'}
            </label>
            <select
              value={profile.isGovernmentEmployee === null ? '' : String(profile.isGovernmentEmployee)}
              onChange={(e) =>
                onUpdateField(
                  'isGovernmentEmployee',
                  e.target.value === '' ? null : e.target.value === 'true',
                )
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
            >
              <option value="">—</option>
              <option value="false">{uiLanguage === 'mr' ? 'नाही' : 'No'}</option>
              <option value="true">{uiLanguage === 'mr' ? 'होय' : 'Yes'}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-1">
              {uiLanguage === 'mr' ? 'आयकर दाता?' : 'Income Tax Payer?'}
            </label>
            <select
              value={profile.isIncomeTaxPayer === null ? '' : String(profile.isIncomeTaxPayer)}
              onChange={(e) =>
                onUpdateField(
                  'isIncomeTaxPayer',
                  e.target.value === '' ? null : e.target.value === 'true',
                )
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-xs bg-slate-50 focus:bg-white focus:border-[#16A34A] focus:outline-none"
            >
              <option value="">—</option>
              <option value="false">{uiLanguage === 'mr' ? 'नाही' : 'No'}</option>
              <option value="true">{uiLanguage === 'mr' ? 'होय' : 'Yes'}</option>
            </select>
          </div>
        </div>
      )}

      {showJson && (
        <pre className="mt-4 p-4 rounded-lg bg-[#050D16] text-slate-100 text-xs font-mono-tabular overflow-x-auto leading-relaxed">
          {JSON.stringify(profile, null, 2)}
        </pre>
      )}
    </section>
  );
};
