import {
  compareBoolean,
  compareMaharashtraDomicile,
  compareMaxNumber,
  compareMinNumber,
  compareNumberRange,
  fmtINR,
  formatRationCardLabel,
  isMaharashtraState,
  missingRuleValue,
} from '../engine/ruleHelpers.ts';
import { CitizenProfile, GovernmentScheme } from '../types/scheme.ts';

const missingVal = missingRuleValue;

export const SCHEMES: GovernmentScheme[] = [
  {
    id: 'ladki-bahin',
    level: 'Maharashtra',
    category: 'Women & Child',
    ministry: {
      en: 'Women & Child Development Dept., Maharashtra',
      mr: 'महिला व बाल विकास विभाग, महाराष्ट्र शासन',
    },
    name: {
      en: 'Mukhyamantri Majhi Ladki Bahin Yojana',
      mr: 'मुख्यमंत्री माझी लाडकी बहीण योजना',
    },
    tagline: {
      en: 'Monthly direct bank assistance for financial independence and nutrition of eligible women.',
      mr: 'पात्र महिलांच्या आर्थिक स्वातंत्र्यासाठी आणि पोषणासाठी दरमहा थेट बँक खात्यात मदत.',
    },
    benefitAmount: {
      en: '₹1,500 / month (₹18,000 / year)',
      mr: '₹१,५०० / महिना (₹१८,००० / वर्ष)',
    },
    benefitNumericINR: 18000,
    officialSource: {
      portalName: 'ladakibahin.maharashtra.gov.in',
      url: 'https://ladakibahin.maharashtra.gov.in/',
      circularRef: 'GR No. मबावि-२०२४/प्र.क्र.९६/का-०२ (28 June 2024)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'Official Portal', mr: 'अधिकृत पोर्टल' }, url: 'https://ladakibahin.maharashtra.gov.in/', kind: 'portal' },
        { label: { en: 'Applicant Login / Apply', mr: 'अर्जदार लॉगिन / अर्ज' }, url: 'https://ladakibahin.maharashtra.gov.in/sign-in', kind: 'apply' },
        { label: { en: 'WCD Maharashtra Dept', mr: 'महिला व बाल विकास विभाग' }, url: 'https://womenchild.maharashtra.gov.in/', kind: 'guidelines' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/mmlby', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'LB_STATE',
        field: 'state',
        label: { en: 'Maharashtra Resident', mr: 'महाराष्ट्र रहिवासी' },
        requirementText: { en: 'Domicile of Maharashtra', mr: 'महाराष्ट्राचा रहिवासी असणे आवश्यक' },
        evaluate: (p: CitizenProfile) => compareMaharashtraDomicile(p.state),
      },
      {
        id: 'LB_GENDER',
        field: 'gender',
        label: { en: 'Applicant Gender', mr: 'अर्जदार लिंग' },
        requirementText: { en: 'Female applicant', mr: 'अर्जदार महिला असावी' },
        evaluate: (p: CitizenProfile) => {
          if (!p.gender) return missingVal('Gender', 'लिंग');
          const ok = p.gender === 'female';
          return {
            outcome: ok ? 'pass' : 'fail',
            observedDisplay: {
              en: p.gender === 'female' ? 'Female' : p.gender === 'male' ? 'Male' : 'Other',
              mr: p.gender === 'female' ? 'महिला' : p.gender === 'male' ? 'पुरुष' : 'इतर',
            },
          };
        },
      },
      {
        id: 'LB_AGE',
        field: 'age',
        label: { en: 'Age Bracket', mr: 'वयोमर्यादा' },
        requirementText: { en: '21 to 65 years', mr: '२१ ते ६५ वर्षे' },
        evaluate: (p: CitizenProfile) =>
          compareNumberRange(p.age, 21, 65, ['Age', 'वय'], (v) => ({ en: `${v} years`, mr: `${v} वर्षे` })),
      },
      {
        id: 'LB_INCOME',
        field: 'annualIncomeINR',
        label: { en: 'Family Annual Income', mr: 'वार्षिक कौटुंबिक उत्पन्न' },
        requirementText: { en: 'Up to ₹2,50,000 / year', mr: '₹२,५०,००० पर्यंत वार्षिक उत्पन्न' },
        evaluate: (p: CitizenProfile) =>
          compareMaxNumber(p.annualIncomeINR, 250000, ['Annual Income', 'वार्षिक उत्पन्न'], (v) => ({
            en: fmtINR(v),
            mr: fmtINR(v),
          })),
      },
      {
        id: 'LB_TAX',
        field: 'isIncomeTaxPayer',
        label: { en: 'Income Tax Status', mr: 'आयकर दाता स्थिती' },
        requirementText: { en: 'No family member pays income tax', mr: 'कुटुंबात आयकर दाता नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isIncomeTaxPayer === null) {
            if (p.annualIncomeINR !== null && p.annualIncomeINR <= 250000) {
              return { outcome: 'pass', observedDisplay: { en: 'Non-taxable income', mr: 'करमुक्त उत्पन्न मर्यादा' } };
            }
            return missingVal('Taxpayer status', 'आयकर माहिती');
          }
          const ok = p.isIncomeTaxPayer === false;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: ok ? 'Not a taxpayer' : 'Income tax payer', mr: ok ? 'आयकर दाता नाही' : 'आयकर दाता आहे' } };
        },
      },
      {
        id: 'LB_GOVT',
        field: 'isGovernmentEmployee',
        label: { en: 'Exclusion: Govt Employee', mr: 'अपवाद: शासकीय कर्मचारी' },
        requirementText: { en: 'Applicant/family must not be regular government employees', mr: 'नियमित शासकीय कर्मचारी नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isGovernmentEmployee === null) {
            if (p.occupation && p.occupation !== 'salaried') {
              return { outcome: 'pass', observedDisplay: { en: 'Non-government household', mr: 'शासकीय सेवेत नाही' } };
            }
            return missingVal('Govt employment', 'शासकीय नोकरी');
          }
          return compareBoolean(
            p.isGovernmentEmployee,
            false,
            ['Govt employment', 'शासकीय नोकरी'],
            { en: 'Govt employee', mr: 'शासकीय कर्मचारी आहे' },
            { en: 'Not govt employee', mr: 'शासकीय कर्मचारी नाही' },
          );
        },
      },
    ],
    requiredDocuments: [
      { id: 'aadhaar', name: { en: 'Aadhaar Card (Aadhaar-linked bank account)', mr: 'आधार कार्ड (बँक खात्याशी लिंक असलेले)' }, whereToGet: { en: 'UIDAI / Post Office / Bank Seeding Counter', mr: 'नजीकचे आधार केंद्र किंवा बँक शाखा' }, mandatory: true },
      { id: 'domicile', name: { en: 'Maharashtra Domicile / Ration Card (15 yrs old) / Birth Cert', mr: 'अधिवास प्रमाणपत्र / १५ वर्षे जुने रेशन कार्ड / शाळा सोडल्याचा दाखला' }, whereToGet: { en: 'Aaple Sarkar Seva Kendra / Tahsil Office', mr: 'आपले सरकार सेवा केंद्र / तहसील कार्यालय' }, mandatory: true },
      { id: 'income_cert', name: { en: 'Income Certificate (< ₹2.5L) or Yellow/Orange Ration Card', mr: 'उत्पन्नाचा दाखला (₹२.५ लाखाखालील) किंवा पिवळे/केशरी रेशन कार्ड' }, whereToGet: { en: 'Setu / MahaOnline Portal (aaplesarkar.mahaonline.gov.in)', mr: 'सेतू केंद्र / आपले सरकार पोर्टल' }, mandatory: true },
      { id: 'hamipatra', name: { en: 'Signed Self-Declaration (Hamipatra)', mr: 'स्वाक्षरी केलेले हमीपत्र' }, whereToGet: { en: 'Anganwadi worker / Official Portal', mr: 'अंगणवाडी सेविका किंवा योजनेचे पोर्टल' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'applicantName', label: { en: 'Applicant Full Name (as on Aadhaar)', mr: 'अर्जदाराचे पूर्ण नाव (आधारनुसार)' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'e.g. Sunita Ramesh Patil', mr: 'उदा. सुनीता रमेश पाटील' }, required: true },
      { id: 'age', label: { en: 'Age (Years)', mr: 'वय (वर्षे)' }, profileKey: 'age', type: 'number', placeholder: { en: '21-65', mr: '२१-६५' }, required: true },
      { id: 'district', label: { en: 'District & Taluka', mr: 'जिल्हा व तालुका' }, profileKey: 'district', type: 'text', placeholder: { en: 'e.g. Amravati / Morshi', mr: 'उदा. अमरावती / मोर्शी' }, required: true },
      { id: 'annualIncome', label: { en: 'Family Annual Income (₹)', mr: 'कुटुंबाचे वार्षिक उत्पन्न (₹)' }, profileKey: 'annualIncomeINR', type: 'number', placeholder: { en: '120000', mr: '१२००००' }, required: true },
      { id: 'aadhaarLast4', label: { en: 'Aadhaar Last 4 Digits', mr: 'आधार शेवटचे ४ अंक' }, type: 'text', placeholder: { en: 'e.g. 4821', mr: 'उदा. ४८२१' }, required: true },
      { id: 'bankIfsc', label: { en: 'Bank Account & IFSC Code', mr: 'बँक खाते व IFSC कोड' }, type: 'text', placeholder: { en: 'e.g. MAHB0000123', mr: 'उदा. MAHB0000123' }, required: true },
    ],
  },
  {
    id: 'pm-kisan',
    level: 'Central',
    category: 'Agriculture',
    ministry: {
      en: 'Ministry of Agriculture & Farmers Welfare, Govt. of India',
      mr: 'कृषी आणि शेतकरी कल्याण मंत्रालय, भारत सरकार',
    },
    name: {
      en: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
      mr: 'प्रधानमंत्री किसान सन्मान निधी योजना (PM-KISAN)',
    },
    tagline: {
      en: 'Direct income support of ₹6,000/year in 3 equal installments to landholding farmer families.',
      mr: 'जमीनधारक शेतकरी कुटुंबांना ३ समान हप्त्यांत दरवर्षी ₹६,००० थेट आर्थिक मदत.',
    },
    benefitAmount: {
      en: '₹6,000 / year (₹2,000 × 3)',
      mr: '₹६,००० / वर्ष (₹२,००० × ३ हप्ते)',
    },
    benefitNumericINR: 6000,
    officialSource: {
      portalName: 'pmkisan.gov.in',
      url: 'https://pmkisan.gov.in/',
      circularRef: 'Dept. of Agriculture Operational Guidelines (Rev. 2024)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'Official PM-KISAN Portal', mr: 'अधिकृत PM-KISAN पोर्टल' }, url: 'https://pmkisan.gov.in/', kind: 'portal' },
        { label: { en: 'New Farmer Registration', mr: 'नवीन शेतकरी नोंदणी' }, url: 'https://pmkisan.gov.in/RegistrationFormNew.aspx', kind: 'apply' },
        { label: { en: 'Know Your Status', mr: 'हप्ता स्थिती तपासा' }, url: 'https://pmkisan.gov.in/BeneficiaryStatus_New.aspx', kind: 'status' },
        { label: { en: 'myScheme Official Page', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/pm-kisan', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'PMK_OCC',
        field: 'occupation',
        label: { en: 'Farming Occupation', mr: 'शेती व्यवसाय' },
        requirementText: { en: 'Landholding farmer family', mr: 'शेतकरी कुटुंब असावे' },
        evaluate: (p: CitizenProfile) => {
          if (!p.occupation) return missingVal('Occupation', 'व्यवसाय');
          const ok = p.occupation === 'farmer';
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: p.occupation, mr: ok ? 'शेतकरी' : p.occupation } };
        },
      },
      {
        id: 'PMK_LAND',
        field: 'landHoldingAcres',
        label: { en: 'Cultivable Landholding', mr: 'शेतजमीन धारणा' },
        requirementText: { en: 'Owns cultivable agricultural land (> 0 acres)', mr: 'नावावर शेतजमीन असावी (> ० एकर)' },
        evaluate: (p: CitizenProfile) => {
          if (p.landHoldingAcres === null) return missingVal('Landholding acres', 'शेतजमीन क्षेत्र');
          const ok = p.landHoldingAcres > 0;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: `${p.landHoldingAcres} acres`, mr: `${p.landHoldingAcres} एकर` } };
        },
      },
      {
        id: 'PMK_GOVT',
        field: 'isGovernmentEmployee',
        label: { en: 'Exclusion: Govt Employee', mr: 'अपवाद: शासकीय कर्मचारी' },
        requirementText: { en: 'Must not be a serving/retired Class I–III govt officer', mr: 'नियमित शासकीय अधिकारी नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isGovernmentEmployee === null) {
            return p.occupation === 'farmer'
              ? { outcome: 'pass', observedDisplay: { en: 'Independent farmer', mr: 'स्वतंत्र शेतकरी' } }
              : missingVal('Govt employment', 'शासकीय नोकरी');
          }
          const ok = p.isGovernmentEmployee === false;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: ok ? 'Not govt employee' : 'Govt employee', mr: ok ? 'शासकीय कर्मचारी नाही' : 'शासकीय कर्मचारी आहे' } };
        },
      },
      {
        id: 'PMK_TAX',
        field: 'isIncomeTaxPayer',
        label: { en: 'Exclusion: Income Tax Payer', mr: 'अपवाद: आयकर दाता' },
        requirementText: { en: 'Must not have paid income tax in last assessment year', mr: 'मागील वर्षी आयकर भरलेला नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isIncomeTaxPayer === null) {
            if (p.annualIncomeINR !== null && p.annualIncomeINR <= 250000) {
              return { outcome: 'pass', observedDisplay: { en: 'Below tax slab', mr: 'करपात्र उत्पन्नाखालील' } };
            }
            return missingVal('Taxpayer status', 'आयकर स्थिती');
          }
          const ok = p.isIncomeTaxPayer === false;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: ok ? 'Non-taxpayer' : 'Taxpayer', mr: ok ? 'आयकर दाता नाही' : 'आयकर दाता आहे' } };
        },
      },
    ],
    requiredDocuments: [
      { id: '7_12', name: { en: '7/12 Extract (Satbara) & 8A Land Record', mr: '७/१२ उतारा व ८-अ खाते उतारा' }, whereToGet: { en: 'Bhulekh MahaBhulekh Portal / Talathi Office', mr: 'महाभूलेख पोर्टल किंवा तलाठी कार्यालय' }, mandatory: true },
      { id: 'aadhaar_ekyc', name: { en: 'Aadhaar Card with e-KYC completed', mr: 'e-KYC पूर्ण असलेले आधार कार्ड' }, whereToGet: { en: 'pmkisan.gov.in or CSC / Maha e-Seva Kendra', mr: 'CSC केंद्र किंवा आपले सरकार सेवा केंद्र' }, mandatory: true },
      { id: 'bank_dbt', name: { en: 'DBT-Enabled Bank Passbook (NPCI Aadhaar Mapped)', mr: 'आधार लिंक (DBT सक्षम) बँक पासबुक' }, whereToGet: { en: 'Home Bank Branch / India Post Payments Bank', mr: 'बँक शाखा / इंडिया पोस्ट पेमेंट्स बँक' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'farmerName', label: { en: 'Farmer Full Name (as on 7/12)', mr: 'शेतकऱ्याचे नाव (७/१२ उताऱ्यानुसार)' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'e.g. Ramesh Tukaram Shinde', mr: 'उदा. रमेश तुकाराम शिंदे' }, required: true },
      { id: 'district', label: { en: 'District / Village', mr: 'जिल्हा / गाव' }, profileKey: 'district', type: 'text', placeholder: { en: 'e.g. Yavatmal / Ralegaon', mr: 'उदा. यवतमाळ / राळेगाव' }, required: true },
      { id: 'landAcres', label: { en: 'Land Area (Acres)', mr: 'जमीन क्षेत्र (एकर)' }, profileKey: 'landHoldingAcres', type: 'number', placeholder: { en: '2.5', mr: '२.५' }, required: true },
      { id: 'surveyNo', label: { en: 'Survey / Gat Number (from 7/12)', mr: 'गट क्रमांक / सर्व्हे नंबर' }, type: 'text', placeholder: { en: 'e.g. 142/2', mr: 'उदा. १४२/२' }, required: true },
      { id: 'bankIfsc', label: { en: 'DBT Bank IFSC', mr: 'बँक IFSC कोड' }, type: 'text', placeholder: { en: 'e.g. SBIN0004321', mr: 'उदा. SBIN0004321' }, required: true },
    ],
  },
  {
    id: 'namo-shetkari',
    level: 'Maharashtra',
    category: 'Agriculture',
    ministry: {
      en: 'Agriculture Dept., Govt. of Maharashtra',
      mr: 'कृषी विभाग, महाराष्ट्र शासन',
    },
    name: {
      en: 'Namo Shetkari Mahasanman Nidhi Yojana',
      mr: 'नमो शेतकरी महासन्मान निधी योजना',
    },
    tagline: {
      en: 'Additional ₹6,000/year state top-up over PM-KISAN for Maharashtra farmers (total ₹12,000/yr).',
      mr: 'महाराष्ट्रातील शेतकऱ्यांना PM-KISAN व्यतिरिक्त दरवर्षी अतिरिक्त ₹६,००० राज्य सन्मान निधी (एकूण ₹१२,०००).',
    },
    benefitAmount: {
      en: '₹6,000 / year state top-up',
      mr: '₹६,००० / वर्ष राज्य निधी',
    },
    benefitNumericINR: 6000,
    officialSource: {
      portalName: 'nsmny.mahait.org',
      url: 'https://nsmny.mahait.org/',
      circularRef: 'Maharashtra GR कृआयो-२०२३/प्र.क्र.४८/११-अ (June 2023)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'NSMNY Beneficiary Status', mr: 'नमो शेतकरी स्थिती तपासा' }, url: 'https://nsmny.mahait.org/', kind: 'status' },
        { label: { en: 'MahaDBT Farmer Portal', mr: 'महाडीबीटी शेतकरी पोर्टल' }, url: 'https://mahadbt.maharashtra.gov.in/Farmer/Login/Login', kind: 'apply' },
        { label: { en: 'MahaBhulekh 7/12 Portal', mr: 'महाभूलेख ७/१२ पोर्टल' }, url: 'https://bhulekh.mahabhumi.gov.in/', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'NSM_STATE',
        field: 'state',
        label: { en: 'Maharashtra Farmer', mr: 'महाराष्ट्र शेतकरी' },
        requirementText: { en: 'Agricultural land situated in Maharashtra', mr: 'महाराष्ट्रात शेतजमीन असणे आवश्यक' },
        evaluate: (p: CitizenProfile) => compareMaharashtraDomicile(p.state),
      },
      {
        id: 'NSM_OCC',
        field: 'occupation',
        label: { en: 'Farmer Status', mr: 'शेतकरी स्थिती' },
        requirementText: { en: 'Registered under PM-KISAN criteria', mr: 'PM-KISAN निकषांनुसार पात्र शेतकरी' },
        evaluate: (p: CitizenProfile) => {
          if (!p.occupation) return missingVal('Occupation', 'व्यवसाय');
          const ok = p.occupation === 'farmer';
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: p.occupation, mr: ok ? 'शेतकरी' : p.occupation } };
        },
      },
      {
        id: 'NSM_LAND',
        field: 'landHoldingAcres',
        label: { en: 'Landholding', mr: 'शेतजमीन' },
        requirementText: { en: 'Cultivable land > 0 acres', mr: 'शेतजमीन > ० एकर' },
        evaluate: (p: CitizenProfile) => {
          if (p.landHoldingAcres === null) return missingVal('Land area', 'जमीन क्षेत्र');
          const ok = p.landHoldingAcres > 0;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: `${p.landHoldingAcres} acres`, mr: `${p.landHoldingAcres} एकर` } };
        },
      },
      {
        id: 'NSM_GOVT',
        field: 'isGovernmentEmployee',
        label: { en: 'Exclusion: Govt Employee', mr: 'अपवाद: शासकीय कर्मचारी' },
        requirementText: { en: 'Must not be a regular government officer (PM-KISAN exclusion)', mr: 'नियमित शासकीय अधिकारी नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isGovernmentEmployee === null) {
            return p.occupation === 'farmer'
              ? { outcome: 'pass', observedDisplay: { en: 'Independent farmer', mr: 'स्वतंत्र शेतकरी' } }
              : missingVal('Govt employment', 'शासकीय नोकरी');
          }
          return compareBoolean(
            p.isGovernmentEmployee,
            false,
            ['Govt employment', 'शासकीय नोकरी'],
            { en: 'Govt employee', mr: 'शासकीय कर्मचारी आहे' },
            { en: 'Not govt employee', mr: 'शासकीय कर्मचारी नाही' },
          );
        },
      },
      {
        id: 'NSM_TAX',
        field: 'isIncomeTaxPayer',
        label: { en: 'Exclusion: Income Tax Payer', mr: 'अपवाद: आयकर दाता' },
        requirementText: { en: 'Must not have paid income tax (PM-KISAN parity)', mr: 'आयकर दाता नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isIncomeTaxPayer === null) {
            if (p.annualIncomeINR !== null && p.annualIncomeINR <= 250000) {
              return { outcome: 'pass', observedDisplay: { en: 'Below tax slab', mr: 'करपात्र उत्पन्नाखालील' } };
            }
            return missingVal('Taxpayer status', 'आयकर स्थिती');
          }
          return compareBoolean(
            p.isIncomeTaxPayer,
            false,
            ['Taxpayer status', 'आयकर स्थिती'],
            { en: 'Taxpayer', mr: 'आयकर दाता आहे' },
            { en: 'Non-taxpayer', mr: 'आयकर दाता नाही' },
          );
        },
      },
    ],
    requiredDocuments: [
      { id: 'pmkisan_reg', name: { en: 'PM-KISAN Registration ID & 7/12 Extract', mr: 'PM-KISAN नोंदणी क्रमांक व ७/१२ उतारा' }, whereToGet: { en: 'pmkisan.gov.in / Talathi Office', mr: 'pmkisan.gov.in किंवा तलाठी कार्यालय' }, mandatory: true },
      { id: 'aadhaar_npci', name: { en: 'Aadhaar & NPCI-seeded Bank Account', mr: 'आधार व NPCI लिंक बँक खाते' }, whereToGet: { en: 'Bank Branch', mr: 'बँक शाखा' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'farmerName', label: { en: 'Farmer Full Name', mr: 'शेतकऱ्याचे पूर्ण नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'District', mr: 'जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'pmkisanId', label: { en: 'PM-KISAN Registration No. (if available)', mr: 'PM-KISAN नोंदणी क्रमांक (असल्यास)' }, type: 'text', placeholder: { en: 'MH123456789', mr: 'MH123456789' }, required: false },
    ],
  },
  {
    id: 'mjpjay-pmjay',
    level: 'Maharashtra',
    category: 'Health',
    ministry: {
      en: 'Public Health Dept., Maharashtra & National Health Authority',
      mr: 'सार्वजनिक आरोग्य विभाग, महाराष्ट्र व राष्ट्रीय आरोग्य प्राधिकरण',
    },
    name: {
      en: 'MJPJAY & Ayushman Bharat Health Cover (₹5 Lakh)',
      mr: 'महात्मा ज्योतिराव फुले जन आरोग्य व आयुष्मान भारत योजना (₹५ लाख)',
    },
    tagline: {
      en: 'Cashless hospitalization up to ₹5,00,000 per family per year across 1,356+ medical procedures.',
      mr: 'दरवर्षी प्रति कुटुंब ₹५,००,००० पर्यंत १,३५६+ उपचारांसाठी मोफत कॅशलेस रुग्णालय सेवा.',
    },
    benefitAmount: {
      en: '₹5,00,000 / year health cover',
      mr: '₹५,००,००० / वर्ष आरोग्य विमा',
    },
    benefitNumericINR: 500000,
    officialSource: {
      portalName: 'jeevandayee.gov.in',
      url: 'https://www.jeevandayee.gov.in/',
      circularRef: 'Maharashtra GR मफुजआ-२०२३/प्र.क्र.१६०/आरोग्य-६ (Expanded Universal Coverage)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'MJPJAY Official Portal', mr: 'MJPJAY अधिकृत पोर्टल' }, url: 'https://www.jeevandayee.gov.in/', kind: 'portal' },
        { label: { en: 'Ayushman Card Download / eKYC', mr: 'आयुष्मान कार्ड बनवा / डाउनलोड' }, url: 'https://beneficiary.nha.gov.in/', kind: 'apply' },
        { label: { en: 'PM-JAY National Portal', mr: 'PM-JAY राष्ट्रीय पोर्टल' }, url: 'https://pmjay.gov.in/', kind: 'guidelines' },
        { label: { en: 'Empanelled Hospital Finder', mr: 'नोंदणीकृत रुग्णालय यादी' }, url: 'https://hospitals.pmjay.gov.in/', kind: 'status' },
      ],
    },
    rules: [
      {
        id: 'MJP_STATE_OR_CARD',
        field: 'rationCardType',
        label: { en: 'Ration Card / Maharashtra Coverage', mr: 'रेशन कार्ड / महाराष्ट्र विस्तारित संरक्षण' },
        requirementText: { en: 'Yellow/Orange/Antyodaya Ration Card (or Maharashtra resident under expanded MJPJAY)', mr: 'पिवळे/केशरी/अंत्योदय रेशन कार्ड किंवा महाराष्ट्र रहिवासी' },
        evaluate: (p: CitizenProfile) => {
          const isMH = isMaharashtraState(p.state);
          if (p.rationCardType === 'antyodaya' || p.rationCardType === 'bpl_yellow' || p.rationCardType === 'apl_orange') {
            return { outcome: 'pass', observedDisplay: formatRationCardLabel(p.rationCardType) };
          }
          if (isMH) {
            return { outcome: 'pass', observedDisplay: { en: 'Maharashtra universal cover', mr: 'महाराष्ट्र सार्वत्रिक आरोग्य संरक्षण' } };
          }
          if (p.annualIncomeINR !== null && p.annualIncomeINR <= 150000) {
            return { outcome: 'pass', observedDisplay: { en: `Low income (${fmtINR(p.annualIncomeINR)})`, mr: `कमी उत्पन्न (${fmtINR(p.annualIncomeINR)})` } };
          }
          if (p.state && !isMH && (p.rationCardType === 'white' || p.rationCardType === 'none' || (p.annualIncomeINR !== null && p.annualIncomeINR > 150000))) {
            return {
              outcome: 'fail',
              observedDisplay: { en: `${p.state} · non-SECC / above PM-JAY limit`, mr: `${p.state} · पात्र प्रवर्गाबाहेर` },
            };
          }
          return missingVal('State or Ration Card', 'राज्य किंवा रेशन कार्ड');
        },
      },
    ],
    requiredDocuments: [
      { id: 'ration_card', name: { en: 'Yellow / Orange / White Ration Card or Domicile', mr: 'पिवळे / केशरी / पांढरे रेशन कार्ड किंवा अधिवास प्रमाणपत्र' }, whereToGet: { en: 'Tahsil Supply Office / MahaOnline', mr: 'तहसील पुरवठा विभाग / आपले सरकार' }, mandatory: true },
      { id: 'aadhaar_fam', name: { en: 'Aadhaar Cards of Family Members', mr: 'कुटुंबातील सदस्यांचे आधार कार्ड' }, whereToGet: { en: 'UIDAI / Aadhaar Seva Kendra', mr: 'आधार सेवा केंद्र' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'headName', label: { en: 'Head of Family Name', mr: 'कुटुंब प्रमुखाचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'District', mr: 'जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'rationNo', label: { en: 'Ration Card Number (12-digit RC No.)', mr: 'रेशन कार्ड क्रमांक' }, type: 'text', placeholder: { en: 'e.g. 270012345678', mr: 'उदा. २७००१२३४५६७८' }, required: true },
    ],
  },
  {
    id: 'sanjay-gandhi-niradhar',
    level: 'Maharashtra',
    category: 'Livelihood & Pension',
    ministry: {
      en: 'Social Justice & Special Assistance Dept., Maharashtra',
      mr: 'सामाजिक न्याय व विशेष सहाय्य विभाग, महाराष्ट्र शासन',
    },
    name: {
      en: 'Sanjay Gandhi Niradhar Anudan Yojana',
      mr: 'संजय गांधी निराधार अनुदान योजना',
    },
    tagline: {
      en: 'Monthly social security pension for destitute persons, widows, orphans, and differently-abled citizens.',
      mr: 'निराधार व्यक्ती, विधवा महिला, दिव्यांग आणि अनाथ नागरिकांसाठी दरमहा आर्थिक पेन्शन.',
    },
    benefitAmount: {
      en: '₹1,500 / month pension',
      mr: '₹१,५०० / महिना निवृत्तीवेतन',
    },
    benefitNumericINR: 18000,
    officialSource: {
      portalName: 'sjsa.maharashtra.gov.in',
      url: 'https://sjsa.maharashtra.gov.in/',
      circularRef: 'GR No. संगायो-२०२३/प्र.क्र.१०२/वि.स. (Enhanced ₹1,500 Pension)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'SJSA Maharashtra Dept', mr: 'सामाजिक न्याय विभाग पोर्टल' }, url: 'https://sjsa.maharashtra.gov.in/', kind: 'portal' },
        { label: { en: 'Apply via Aaple Sarkar', mr: 'आपले सरकार पोर्टलवर अर्ज' }, url: 'https://aaplesarkar.mahaonline.gov.in/', kind: 'apply' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/sgnay', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'SGN_STATE',
        field: 'state',
        label: { en: 'Maharashtra Domicile', mr: 'महाराष्ट्र अधिवास' },
        requirementText: { en: 'Resident of Maharashtra (min. 15 years)', mr: 'महाराष्ट्राचा रहिवासी' },
        evaluate: (p: CitizenProfile) => compareMaharashtraDomicile(p.state),
      },
      {
        id: 'SGN_AGE',
        field: 'age',
        label: { en: 'Age Under 65 Years', mr: 'वयोमर्यादा (६५ वर्षांखालील)' },
        requirementText: { en: 'Below 65 years (65+ citizens are covered under Shravanbal Pension)', mr: 'वय ६५ वर्षांखालील (६५+ साठी श्रावणबाळ योजना लागू)' },
        evaluate: (p: CitizenProfile) => {
          if (p.age === null) return missingVal('Age', 'वय');
          if (p.age >= 65) {
            return {
              outcome: 'fail',
              observedDisplay: { en: `${p.age} years (covered by Shravanbal 65+ Pension)`, mr: `${p.age} वर्षे (श्रावणबाळ ६५+ योजनेत पात्र)` },
            };
          }
          return { outcome: 'pass', observedDisplay: { en: `${p.age} years`, mr: `${p.age} वर्षे` } };
        },
      },
      {
        id: 'SGN_STATUS',
        field: 'maritalStatus',
        label: { en: 'Vulnerability Criteria', mr: 'पात्र प्रवर्ग (विधवा / दिव्यांग / निराधार)' },
        requirementText: { en: 'Widowed, differently-abled (40%+), or destitute (< 65 yrs)', mr: 'विधवा, दिव्यांग (४०%+) किंवा निराधार (< ६५ वर्षे)' },
        evaluate: (p: CitizenProfile) => {
          const qualifies =
            p.maritalStatus === 'widowed' ||
            p.isDifferentlyAbled === true;
          if (qualifies) {
            const reasonEn = p.maritalStatus === 'widowed' ? 'Widowed applicant' : 'Differently-abled';
            const reasonMr = p.maritalStatus === 'widowed' ? 'विधवा महिला' : 'दिव्यांग व्यक्ती';
            return { outcome: 'pass', observedDisplay: { en: reasonEn, mr: reasonMr } };
          }
          if (p.maritalStatus === null && p.isDifferentlyAbled === null) {
            return missingVal('Widow/Disability status', 'विधवा/दिव्यांग स्थिती');
          }
          return { outcome: 'fail', observedDisplay: { en: 'Not in widow or disability category', mr: 'विधवा किंवा दिव्यांग प्रवर्गात नाही' } };
        },
      },
      {
        id: 'SGN_INCOME',
        field: 'annualIncomeINR',
        label: { en: 'Annual Income Ceiling', mr: 'वार्षिक उत्पन्न मर्यादा' },
        requirementText: { en: 'Annual family income ≤ ₹21,000 (or BPL Yellow/Antyodaya Ration Card)', mr: 'वार्षिक उत्पन्न ₹२१,००० पर्यंत (किंवा BPL रेशन कार्ड)' },
        evaluate: (p: CitizenProfile) => {
          if (p.rationCardType === 'antyodaya' || p.rationCardType === 'bpl_yellow') {
            return { outcome: 'pass', observedDisplay: { en: 'BPL / Antyodaya cardholder', mr: 'दारिद्र्यरेषेखालील (BPL) कार्ड' } };
          }
          return compareMaxNumber(p.annualIncomeINR, 21000, ['Annual income or BPL card', 'वार्षिक उत्पन्न किंवा BPL कार्ड'], (v) => ({
            en: fmtINR(v),
            mr: fmtINR(v),
          }));
        },
      },
    ],
    requiredDocuments: [
      { id: 'age_proof', name: { en: 'Age Certificate / Aadhaar Card', mr: 'वयाचा दाखला / आधार कार्ड' }, whereToGet: { en: 'Govt Hospital or School Leaving Cert', mr: 'शासकीय रुग्णालय किंवा शाळेचा दाखला' }, mandatory: true },
      { id: 'widow_or_udid', name: { en: 'Husband Death Cert (if widow) or UDID Disability Cert (40%+)', mr: 'पतीचा मृत्यू दाखला (विधवा असल्यास) किंवा UDID दिव्यांग प्रमाणपत्र' }, whereToGet: { en: 'Gram Panchayat / Municipal Corp / District Hospital', mr: 'ग्रामपंचायत / नगरपालिका / जिल्हा रुग्णालय' }, mandatory: true },
      { id: 'income_bpl', name: { en: 'Tahsil Income Certificate (< ₹21,000) or BPL Card', mr: 'तहसीलदार उत्पन्नाचा दाखला किंवा BPL पिवळे कार्ड' }, whereToGet: { en: 'Tahsil Office / Setu Kendra', mr: 'तहसील कार्यालय / सेतू केंद्र' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'applicantName', label: { en: 'Applicant Name', mr: 'अर्जदाराचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'age', label: { en: 'Age', mr: 'वय' }, profileKey: 'age', type: 'number', placeholder: { en: 'Age', mr: 'वय' }, required: true },
      { id: 'district', label: { en: 'District & Taluka', mr: 'जिल्हा व तालुका' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'categoryProof', label: { en: 'Eligibility Basis (Widow / Disability % / Senior)', mr: 'पात्रता आधार (विधवा / दिव्यांग % / ज्येष्ठ)' }, type: 'text', placeholder: { en: 'e.g. Widow - Death Cert No.', mr: 'उदा. विधवा - मृत्यू दाखला क्र.' }, required: true },
    ],
  },
  {
    id: 'shravanbal-pension',
    level: 'Maharashtra',
    category: 'Livelihood & Pension',
    ministry: {
      en: 'Social Justice & Special Assistance Dept., Maharashtra',
      mr: 'सामाजिक न्याय व विशेष सहाय्य विभाग, महाराष्ट्र शासन',
    },
    name: {
      en: 'Shravanbal Seva State Senior Citizen Pension',
      mr: 'श्रावणबाळ सेवा राज्य निवृत्तीवेतन योजना (ज्येष्ठ नागरिक)',
    },
    tagline: {
      en: 'Monthly ₹1,500 pension for destitute senior citizens aged 65 years and above in Maharashtra.',
      mr: 'महाराष्ट्रातील ६५ वर्षे व त्यावरील निराधार ज्येष्ठ नागरिकांना दरमहा ₹१,५०० निवृत्तीवेतन.',
    },
    benefitAmount: {
      en: '₹1,500 / month pension',
      mr: '₹१,५०० / महिना पेन्शन',
    },
    benefitNumericINR: 18000,
    officialSource: {
      portalName: 'aaplesarkar.mahaonline.gov.in',
      url: 'https://aaplesarkar.mahaonline.gov.in/',
      circularRef: 'SJSA Maharashtra Senior Pension Resolution (2023–24)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'Apply on Aaple Sarkar', mr: 'आपले सरकार पोर्टलवर अर्ज' }, url: 'https://aaplesarkar.mahaonline.gov.in/', kind: 'apply' },
        { label: { en: 'SJSA Scheme Portal', mr: 'सामाजिक न्याय विभाग' }, url: 'https://sjsa.maharashtra.gov.in/', kind: 'portal' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/sssps', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'SB_STATE',
        field: 'state',
        label: { en: 'Maharashtra Resident', mr: 'महाराष्ट्र रहिवासी' },
        requirementText: { en: 'Domicile of Maharashtra (15+ years)', mr: 'महाराष्ट्राचा रहिवासी' },
        evaluate: (p: CitizenProfile) => compareMaharashtraDomicile(p.state),
      },
      {
        id: 'SB_AGE',
        field: 'age',
        label: { en: 'Senior Citizen Age', mr: 'ज्येष्ठ नागरिक वयोमर्यादा' },
        requirementText: { en: 'Age 65 years or above', mr: 'वय ६५ वर्षे किंवा अधिक' },
        evaluate: (p: CitizenProfile) =>
          compareMinNumber(p.age, 65, ['Age', 'वय'], (v) => ({ en: `${v} years`, mr: `${v} वर्षे` })),
      },
      {
        id: 'SB_INCOME',
        field: 'annualIncomeINR',
        label: { en: 'Income / BPL Status', mr: 'उत्पन्न / BPL स्थिती' },
        requirementText: { en: 'BPL Ration Card or Annual Income ≤ ₹21,000', mr: 'BPL रेशन कार्ड किंवा वार्षिक उत्पन्न ≤ ₹२१,०००' },
        evaluate: (p: CitizenProfile) => {
          if (p.rationCardType === 'antyodaya' || p.rationCardType === 'bpl_yellow') {
            return { outcome: 'pass', observedDisplay: { en: 'BPL / Antyodaya card', mr: 'BPL / अंत्योदय कार्ड' } };
          }
          return compareMaxNumber(p.annualIncomeINR, 21000, ['Annual income or BPL card', 'उत्पन्न किंवा BPL कार्ड'], (v) => ({
            en: fmtINR(v),
            mr: fmtINR(v),
          }));
        },
      },
    ],
    requiredDocuments: [
      { id: 'age_65', name: { en: 'Age Proof (65+ Years) & Aadhaar Card', mr: 'वयाचा दाखला (६५+ वर्षे) व आधार कार्ड' }, whereToGet: { en: 'Civil Hospital / Tahsil Office', mr: 'जिल्हा रुग्णालय / तहसील कार्यालय' }, mandatory: true },
      { id: 'bpl_inc', name: { en: 'BPL Ration Card or Tahsildar Income Certificate', mr: 'BPL रेशन कार्ड किंवा तहसीलदार उत्पन्नाचा दाखला' }, whereToGet: { en: 'Tahsil / Setu Seva Kendra', mr: 'तहसील / सेतू सेवा केंद्र' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'seniorName', label: { en: 'Senior Citizen Full Name', mr: 'ज्येष्ठ नागरिकाचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'age', label: { en: 'Age (65+)', mr: 'वय (६५+)' }, profileKey: 'age', type: 'number', placeholder: { en: '67', mr: '६७' }, required: true },
      { id: 'district', label: { en: 'District & Taluka', mr: 'जिल्हा व तालुका' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
    ],
  },
  {
    id: 'pm-awas',
    level: 'Central',
    category: 'Housing',
    ministry: {
      en: 'Ministry of Rural Development / Housing & Urban Affairs',
      mr: 'ग्रामीण विकास व गृहनिर्माण मंत्रालय, भारत सरकार',
    },
    name: {
      en: 'Pradhan Mantri Awas Yojana (PMAY Gramin / Urban)',
      mr: 'प्रधानमंत्री आवास योजना (ग्रामीण / शहरी घरकुल)',
    },
    tagline: {
      en: 'Financial subsidy of ₹1.20 Lakh (Rural) to ₹2.50 Lakh (Urban) to build a permanent pucca home.',
      mr: 'पक्के घर बांधण्यासाठी ₹१.२० लाख (ग्रामीण) ते ₹२.५० लाख (शहरी) पर्यंत घरकुल अनुदान.',
    },
    benefitAmount: {
      en: '₹1,20,000 – ₹2,50,000 grant',
      mr: '₹१,२०,००० – ₹२,५०,००० अनुदान',
    },
    benefitNumericINR: 150000,
    officialSource: {
      portalName: 'pmayg.nic.in',
      url: 'https://pmayg.nic.in/',
      circularRef: 'MoRD PMAY-G Phase II Framework (2024–2029)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'PMAY-Gramin Portal', mr: 'PMAY ग्रामीण पोर्टल' }, url: 'https://pmayg.nic.in/', kind: 'portal' },
        { label: { en: 'PMAY-Urban Apply', mr: 'PMAY शहरी अर्ज' }, url: 'https://pmaymis.gov.in/', kind: 'apply' },
        { label: { en: 'Maharashtra MahaAwaas', mr: 'महाराष्ट्र महाआवास पोर्टल' }, url: 'https://mahaawaas.org/', kind: 'status' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/pmay-g', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'PMAY_NO_PUCCA',
        field: 'hasPuccaHouse',
        label: { en: 'No Existing Pucca House', mr: 'पक्के घर नसणे आवश्यक' },
        requirementText: { en: 'Family must not own a pucca house anywhere in India', mr: 'कुटुंबाच्या नावावर पक्के घर नसावे' },
        evaluate: (p: CitizenProfile) =>
          compareBoolean(
            p.hasPuccaHouse,
            false,
            ['Housing status (pucca/kutcha)', 'पक्के घर आहे की कच्चे'],
            { en: 'Already owns pucca house', mr: 'पक्के घर आधीच आहे' },
            { en: 'Lives in kutcha / rented home', mr: 'कच्चे घर / घर नाही' },
          ),
      },
      {
        id: 'PMAY_INCOME',
        field: 'annualIncomeINR',
        label: { en: 'EWS / LIG Income Limit', mr: 'उत्पन्न मर्यादा (EWS/LIG)' },
        requirementText: { en: 'Annual income ≤ ₹3,00,000 (Rural / EWS) or ≤ ₹6,00,000 (Urban LIG)', mr: 'वार्षिक उत्पन्न ≤ ₹३,००,००० (ग्रामीण / EWS) किंवा ≤ ₹६,००,००० (शहरी LIG)' },
        evaluate: (p: CitizenProfile) => {
          if (p.annualIncomeINR === null) return missingVal('Annual income', 'वार्षिक उत्पन्न');
          const limit = p.residenceType === 'urban' ? 600000 : 300000;
          const ok = p.annualIncomeINR <= limit;
          return {
            outcome: ok ? 'pass' : 'fail',
            observedDisplay: {
              en: `${fmtINR(p.annualIncomeINR)} (${p.residenceType === 'urban' ? 'Urban ≤ ₹6L' : 'EWS ≤ ₹3L'})`,
              mr: fmtINR(p.annualIncomeINR),
            },
          };
        },
      },
    ],
    requiredDocuments: [
      { id: 'aadhaar_jobcard', name: { en: 'Aadhaar Card & MGNREGA Job Card (for Rural)', mr: 'आधार कार्ड व मनरेगा जॉब कार्ड (ग्रामीणसाठी)' }, whereToGet: { en: 'Gram Panchayat Office', mr: 'ग्रामपंचायत कार्यालय' }, mandatory: true },
      { id: 'income_affidavit', name: { en: 'Income Proof & No-House Self Declaration', mr: 'उत्पन्नाचा दाखला व पक्के घर नसल्याचे स्व-घोषणापत्र' }, whereToGet: { en: 'Tahsil / Municipal Housing Cell', mr: 'तहसील / नगर परिषद घरकुल विभाग' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'applicantName', label: { en: 'Head / Female Co-owner Name', mr: 'अर्जदार / महिला सह-मालकाचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'District / Gram Panchayat', mr: 'जिल्हा / ग्रामपंचायत' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'annualIncome', label: { en: 'Annual Income (₹)', mr: 'वार्षिक उत्पन्न (₹)' }, profileKey: 'annualIncomeINR', type: 'number', placeholder: { en: '120000', mr: '१२००००' }, required: true },
    ],
  },
  {
    id: 'lek-ladki',
    level: 'Maharashtra',
    category: 'Women & Child',
    ministry: {
      en: 'Women & Child Development Dept., Maharashtra',
      mr: 'महिला व बाल विकास विभाग, महाराष्ट्र शासन',
    },
    name: {
      en: 'Lek Ladki Yojana (₹1,01,000 Girl Child Grant)',
      mr: 'लेक लाडकी योजना (मुलीसाठी ₹१,०१,००० अनुदान)',
    },
    tagline: {
      en: 'Staged financial support from birth to age 18 for education and empowerment of girl children.',
      mr: 'जन्मापासून वयाच्या १८ वर्षांपर्यंत मुलीच्या शिक्षणासाठी टप्प्याटप्प्याने ₹१,०१,००० मदत.',
    },
    benefitAmount: {
      en: '₹1,01,000 total milestone grant',
      mr: '₹१,०१,००० टप्प्याटप्प्याने अनुदान',
    },
    benefitNumericINR: 101000,
    officialSource: {
      portalName: 'lly.mhicds.com',
      url: 'https://lly.mhicds.com/',
      circularRef: 'Maharashtra GR मबावि-२०२३/प्र.क्र.१३८/का-२ (Oct 2023)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'Lek Ladki ICDS Portal', mr: 'लेक लाडकी ICDS पोर्टल' }, url: 'https://lly.mhicds.com/', kind: 'apply' },
        { label: { en: 'WCD Maharashtra Portal', mr: 'महिला व बाल विकास विभाग' }, url: 'https://womenchild.maharashtra.gov.in/', kind: 'portal' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/lly', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'LL_STATE',
        field: 'state',
        label: { en: 'Maharashtra Family', mr: 'महाराष्ट्र कुटुंब' },
        requirementText: { en: 'Domicile of Maharashtra', mr: 'महाराष्ट्राचा रहिवासी' },
        evaluate: (p: CitizenProfile) => compareMaharashtraDomicile(p.state),
      },
      {
        id: 'LL_CARD',
        field: 'rationCardType',
        label: { en: 'Yellow / Orange Ration Card', mr: 'पिवळे / केशरी रेशन कार्ड' },
        requirementText: { en: 'Family holds Yellow or Orange Ration Card', mr: 'कुटुंबाकडे पिवळे किंवा केशरी रेशन कार्ड असावे' },
        evaluate: (p: CitizenProfile) => {
          if (!p.rationCardType) return missingVal('Ration Card type', 'रेशन कार्ड प्रकार');
          const ok = p.rationCardType === 'bpl_yellow' || p.rationCardType === 'apl_orange' || p.rationCardType === 'antyodaya';
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: formatRationCardLabel(p.rationCardType) };
        },
      },
      {
        id: 'LL_GIRL',
        field: 'hasGirlChild',
        label: { en: 'Girl Child in Family', mr: 'कुटुंबात मुलगी (०–१८ वर्षे)' },
        requirementText: { en: 'At least one unmarried girl child aged 0–18 years', mr: 'कुटुंबात ० ते १८ वर्षे वयोगटातील मुलगी असणे आवश्यक' },
        evaluate: (p: CitizenProfile) => {
          if (p.hasGirlChild === null) return missingVal('Girl child status', 'मुलगी आहे का');
          if (p.hasGirlChild === false) {
            return { outcome: 'fail', observedDisplay: { en: 'No girl child stated', mr: 'मुलगी नाही' } };
          }
          if (p.girlChildAge !== null && p.girlChildAge > 18) {
            return { outcome: 'fail', observedDisplay: { en: `Daughter age ${p.girlChildAge} yrs (> 18 limit)`, mr: `मुलीचे वय ${p.girlChildAge} वर्षे (१८ मर्यादेबाहेर)` } };
          }
          return {
            outcome: 'pass',
            observedDisplay: {
              en: p.girlChildAge !== null ? `Girl child (${p.girlChildAge} yrs)` : 'Yes, has girl child',
              mr: p.girlChildAge !== null ? `मुलगी (${p.girlChildAge} वर्षे)` : 'होय, मुलगी आहे',
            },
          };
        },
      },
    ],
    requiredDocuments: [
      { id: 'birth_cert', name: { en: 'Girl Child Birth Certificate', mr: 'मुलीचा जन्म दाखला' }, whereToGet: { en: 'Gram Panchayat / Municipal Hospital', mr: 'ग्रामपंचायत / महानगरपालिका' }, mandatory: true },
      { id: 'ration_yellow_orange', name: { en: 'Yellow or Orange Ration Card', mr: 'पिवळे किंवा केशरी रेशन कार्ड' }, whereToGet: { en: 'Tahsil Food & Supply Office', mr: 'तहसील पुरवठा कार्यालय' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'parentName', label: { en: 'Parent / Mother Name', mr: 'आई / पालकाचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Parent Name', mr: 'पालकाचे नाव' }, required: true },
      { id: 'girlAge', label: { en: 'Girl Child Age (Years)', mr: 'मुलीचे वय (वर्षे)' }, profileKey: 'girlChildAge', type: 'number', placeholder: { en: '0-18', mr: '०-१८' }, required: true },
      { id: 'district', label: { en: 'District', mr: 'जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
    ],
  },
  {
    id: 'pm-ujjwala',
    level: 'Central',
    category: 'Women & Child',
    ministry: {
      en: 'Ministry of Petroleum & Natural Gas, Govt. of India',
      mr: 'पेट्रोलियम आणि नैसर्गिक वायू मंत्रालय, भारत सरकार',
    },
    name: {
      en: 'Pradhan Mantri Ujjwala Yojana (PMUY 2.0)',
      mr: 'प्रधानमंत्री उज्ज्वला योजना (PMUY 2.0 मोफत गॅस)',
    },
    tagline: {
      en: 'Deposit-free LPG gas connection with free first refill and stove support for low-income women.',
      mr: 'कमी उत्पन्न गटातील महिलांना मोफत एलपीजी गॅस जोडणी, पहिले सिलेंडर आणि शेगडी अनुदान.',
    },
    benefitAmount: {
      en: 'Free LPG Connection + ₹1,600 support',
      mr: 'मोफत गॅस जोडणी + ₹१,६०० मदत',
    },
    benefitNumericINR: 3200,
    officialSource: {
      portalName: 'pmuy.gov.in',
      url: 'https://www.pmuy.gov.in/',
      circularRef: 'MoPNG Ujjwala 2.0 Eligibility Notification',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'PMUY Official Website', mr: 'PMUY अधिकृत वेबसाइट' }, url: 'https://www.pmuy.gov.in/', kind: 'portal' },
        { label: { en: 'Apply for New Ujjwala 2.0', mr: 'नवीन उज्ज्वला २.० अर्ज' }, url: 'https://www.pmuy.gov.in/ujjwala2.html', kind: 'apply' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/pmuy', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'UY_GENDER',
        field: 'gender',
        label: { en: 'Adult Woman Applicant', mr: 'प्रौढ महिला अर्जदार' },
        requirementText: { en: 'Woman aged 18 years or above', mr: 'वय १८+ महिला अर्जदार' },
        evaluate: (p: CitizenProfile) => {
          if (!p.gender) return missingVal('Gender', 'लिंग');
          const ok = p.gender === 'female' && (p.age === null || p.age >= 18);
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: `${p.gender}${p.age ? `, ${p.age}y` : ''}`, mr: p.gender === 'female' ? 'महिला' : 'पुरुष' } };
        },
      },
      {
        id: 'UY_NO_LPG',
        field: 'hasLpgConnection',
        label: { en: 'No Existing LPG in Household', mr: 'घरात आधीपासून गॅस जोडणी नसावी' },
        requirementText: { en: 'No existing LPG connection from any OMC in household', mr: 'कुटुंबात इतर कोणाच्या नावावर गॅस कनेक्शन नसावे' },
        evaluate: (p: CitizenProfile) => {
          if (p.hasLpgConnection === null) return missingVal('Existing LPG connection status', 'घरात गॅस कनेक्शन आहे का');
          const ok = p.hasLpgConnection === false;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: ok ? 'No LPG connection' : 'Already has LPG', mr: ok ? 'गॅस कनेक्शन नाही' : 'गॅस कनेक्शन आहे' } };
        },
      },
      {
        id: 'UY_POOR',
        field: 'rationCardType',
        label: { en: 'BPL / SC / ST / Antyodaya Category', mr: 'BPL / अंत्योदय / SC-ST प्रवर्ग' },
        requirementText: { en: 'BPL / Antyodaya / SC / ST / PMAY / SECC household', mr: 'पिवळे/अंत्योदय रेशन कार्ड किंवा SC/ST/PMAY प्रवर्ग' },
        evaluate: (p: CitizenProfile) => {
          const ok =
            p.rationCardType === 'bpl_yellow' ||
            p.rationCardType === 'antyodaya' ||
            p.socialCategory === 'sc' ||
            p.socialCategory === 'st' ||
            (p.annualIncomeINR !== null && p.annualIncomeINR <= 120000);
          if (ok) return { outcome: 'pass', observedDisplay: { en: 'Meets low-income / category rule', mr: 'पात्र प्रवर्ग / कमी उत्पन्न' } };
          if (!p.rationCardType && !p.socialCategory && p.annualIncomeINR === null) {
            return missingVal('Ration card or category', 'रेशन कार्ड किंवा प्रवर्ग');
          }
          return { outcome: 'fail', observedDisplay: { en: 'Income/Card outside BPL rule', mr: 'BPL/पात्र प्रवर्गाबाहेर' } };
        },
      },
    ],
    requiredDocuments: [
      { id: 'aadhaar_kyc', name: { en: 'Aadhaar Card & Passport Photo', mr: 'आधार कार्ड व पासपोर्ट फोटो' }, whereToGet: { en: 'Nearest LPG Distributor (HP/Indane/Bharatgas)', mr: 'नजीकची गॅस एजन्सी' }, mandatory: true },
      { id: 'ration_addr', name: { en: 'Ration Card or Self-Declaration for Migrants', mr: 'रेशन कार्ड किंवा स्थलांतरितांसाठी पत्ता स्व-घोषणापत्र' }, whereToGet: { en: 'Tahsil Office / Online PMUY Portal', mr: 'तहसील कार्यालय / PMUY पोर्टल' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'womanName', label: { en: 'Applicant Woman Name', mr: 'महिला अर्जदाराचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'District & Pin Code', mr: 'जिल्हा व पिनकोड' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'omc', label: { en: 'Preferred Gas Provider', mr: 'गॅस कंपनी निवड' }, type: 'select', placeholder: { en: 'Select', mr: 'निवडा' }, options: [{ value: 'HP', label: { en: 'HP Gas', mr: 'HP गॅस' } }, { value: 'Indane', label: { en: 'Indane', mr: 'इंडेन' } }, { value: 'Bharatgas', label: { en: 'Bharatgas', mr: 'भारतगॅस' } }], required: true },
    ],
  },
  {
    id: 'mahadbt-scholarship',
    level: 'Maharashtra',
    category: 'Education',
    ministry: {
      en: 'Social Justice / Tribal / Higher Education Dept., Maharashtra',
      mr: 'सामाजिक न्याय व उच्च शिक्षण विभाग, महाराष्ट्र',
    },
    name: {
      en: 'MahaDBT Post-Matric Scholarship Scheme',
      mr: 'महाडीबीटी मॅट्रिकोत्तर शिष्यवृत्ती योजना (MahaDBT)',
    },
    tagline: {
      en: 'Full or partial college tuition fee reimbursement and monthly maintenance allowance for eligible students.',
      mr: 'पात्र विद्यार्थ्यांना महाविद्यालयीन शिक्षण शुल्क प्रतिपूर्ती आणि मासिक निर्वाह भत्ता.',
    },
    benefitAmount: {
      en: 'Up to 100% Tuition + Maintenance',
      mr: '१००% शिक्षण शुल्क + निर्वाह भत्ता',
    },
    benefitNumericINR: 35000,
    officialSource: {
      portalName: 'mahadbt.maharashtra.gov.in',
      url: 'https://mahadbt.maharashtra.gov.in/',
      circularRef: 'MahaDBT Post-Matric Scholarship Guidelines AY 2025–26',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'MahaDBT Scholarship Portal', mr: 'महाडीबीटी शिष्यवृत्ती पोर्टल' }, url: 'https://mahadbt.maharashtra.gov.in/', kind: 'portal' },
        { label: { en: 'MahaDBT 2.0 Student Login', mr: 'विद्यार्थी लॉगिन २.०' }, url: 'https://mahadbt2.maharashtra.gov.in/', kind: 'apply' },
        { label: { en: 'National Scholarship Portal', mr: 'राष्ट्रीय शिष्यवृत्ती पोर्टल (NSP)' }, url: 'https://scholarships.gov.in/', kind: 'guidelines' },
        { label: { en: 'Mahajyoti OBC/VJNT Coaching', mr: 'महाज्योती प्रशिक्षण पोर्टल' }, url: 'https://www.mahajyoti.org.in/', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'MDBT_STATE',
        field: 'state',
        label: { en: 'Maharashtra Domicile', mr: 'महाराष्ट्र अधिवास' },
        requirementText: { en: 'Domicile of Maharashtra', mr: 'महाराष्ट्राचा रहिवासी विद्यार्थी' },
        evaluate: (p: CitizenProfile) => compareMaharashtraDomicile(p.state),
      },
      {
        id: 'MDBT_OCC',
        field: 'occupation',
        label: { en: 'Post-Matric Student Status', mr: 'मॅट्रिकोत्तर विद्यार्थी स्थिती' },
        requirementText: { en: 'Enrolled in post-10th (College / ITI / Diploma / UG / PG)', mr: '१० वी नंतरच्या महाविद्यालयीन / डिप्लोमा शिक्षणात प्रवेश' },
        evaluate: (p: CitizenProfile) => {
          if (p.educationLevel === 'school' || p.educationLevel === 'none') {
            return { outcome: 'fail', observedDisplay: { en: `${p.educationLevel} (below post-10th)`, mr: '१० वी नंतरचे शिक्षण नाही' } };
          }
          if (p.occupation === 'student' && p.age !== null && p.age < 15) {
            return { outcome: 'fail', observedDisplay: { en: `Age ${p.age} (pre-matric)`, mr: `वय ${p.age} (शालेय विद्यार्थी)` } };
          }
          const isPostMatricEdu =
            p.educationLevel === 'undergraduate' ||
            p.educationLevel === 'postgraduate' ||
            p.educationLevel === 'iti_diploma' ||
            p.occupation === 'student';
          if (isPostMatricEdu) {
            return { outcome: 'pass', observedDisplay: { en: p.educationLevel ?? 'Post-Matric Student', mr: 'महाविद्यालयीन विद्यार्थी' } };
          }
          if (!p.occupation && !p.educationLevel) return missingVal('Student/Education status', 'विद्यार्थी स्थिती');
          return { outcome: 'fail', observedDisplay: { en: p.occupation ?? 'Non-student', mr: 'विद्यार्थी नाही' } };
        },
      },
      {
        id: 'MDBT_CAT_INC',
        field: 'annualIncomeINR',
        label: { en: 'Category & Family Income', mr: 'प्रवर्ग व कौटुंबिक उत्पन्न' },
        requirementText: { en: 'SC/ST GoI Post-Matric ≤ ₹2.5L · OBC/NT/EWS/EBC ≤ ₹8L', mr: 'SC/ST शिष्यवृत्ती ≤ ₹२.५ लाख · OBC/NT/EWS/EBC ≤ ₹८ लाख' },
        evaluate: (p: CitizenProfile) => {
          if (p.annualIncomeINR === null) return missingVal('Family annual income', 'कुटुंबाचे वार्षिक उत्पन्न');
          const limit = p.socialCategory === 'sc' || p.socialCategory === 'st' ? 250000 : 800000;
          const ok = p.annualIncomeINR <= limit;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: `${fmtINR(p.annualIncomeINR)} (${p.socialCategory ?? 'general'})`, mr: fmtINR(p.annualIncomeINR) } };
        },
      },
    ],
    requiredDocuments: [
      { id: 'caste_inc', name: { en: 'Caste Certificate & Tahsildar Income Certificate', mr: 'जातीचा दाखला व तहसीलदार उत्पन्नाचा दाखला' }, whereToGet: { en: 'Aaple Sarkar Seva Kendra / Setu', mr: 'आपले सरकार सेवा केंद्र / सेतू' }, mandatory: true },
      { id: 'bonafide_fee', name: { en: 'College Bonafide, Fee Receipt & CAP Allotment Letter', mr: 'महाविद्यालयीन बोनाफाईड, फी पावती व प्रवेश पत्र' }, whereToGet: { en: 'College Student Section', mr: 'महाविद्यालय विद्यार्थी विभाग' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'studentName', label: { en: 'Student Full Name', mr: 'विद्यार्थ्याचे पूर्ण नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'College District', mr: 'महाविद्यालय जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'course', label: { en: 'Course / Degree Name', mr: 'अभ्यासक्रम / पदवी' }, type: 'text', placeholder: { en: 'e.g. B.Tech / B.Sc / ITI', mr: 'उदा. बी.टेक / बी.एस्सी / आयटीआय' }, required: true },
    ],
  },
  {
    id: 'pm-vishwakarma',
    level: 'Central',
    category: 'Livelihood & Pension',
    ministry: {
      en: 'Ministry of Micro, Small & Medium Enterprises (MSME)',
      mr: 'सूक्ष्म, लघु आणि मध्यम उद्योग मंत्रालय, भारत सरकार',
    },
    name: {
      en: 'PM Vishwakarma Yojana (Artisan Toolkit & Loan)',
      mr: 'पीएम विश्वकर्मा योजना (कारागीर अवजारे व कर्ज मदत)',
    },
    tagline: {
      en: '₹15,000 free toolkit e-voucher, skill stipend (₹500/day), and collateral-free loan at 5% interest for 18 traditional trades.',
      mr: '१८ पारंपारिक कारागिरांना ₹१५,००० अवजारे अनुदान, प्रशिक्षण भत्ता व ५% व्याजाने तारणमुक्त कर्ज.',
    },
    benefitAmount: {
      en: '₹15,000 toolkit + ₹1–3L loan @ 5%',
      mr: '₹१५,००० अवजारे + ₹१–३ लाख कर्ज (५%)',
    },
    benefitNumericINR: 15000,
    officialSource: {
      portalName: 'pmvishwakarma.gov.in',
      url: 'https://pmvishwakarma.gov.in/',
      circularRef: 'MSME PM Vishwakarma Scheme Guidelines (2023–28)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'PM Vishwakarma Portal', mr: 'पीएम विश्वकर्मा पोर्टल' }, url: 'https://pmvishwakarma.gov.in/', kind: 'portal' },
        { label: { en: 'CSC Artisan Login / Apply', mr: 'CSC कारागीर नोंदणी' }, url: 'https://pmvishwakarma.gov.in/Login', kind: 'apply' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/pmv', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'PMV_OCC',
        field: 'occupation',
        label: { en: 'Artisan / Traditional Trade', mr: 'कारागीर / पारंपारिक व्यवसाय' },
        requirementText: { en: 'Self-employed traditional artisan (tailor, carpenter, potter, barber, cobbler, blacksmith, mason, etc.)', mr: 'स्वयंरोजगार पारंपारिक कारागीर (शिंपी, सुतार, कुंभार, न्हावी, लोहार, चर्मकार इ.)' },
        evaluate: (p: CitizenProfile) => {
          if (!p.occupation) return missingVal('Occupation', 'व्यवसाय');
          const ok = p.occupation === 'artisan';
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: p.occupation, mr: ok ? 'पारंपारिक कारागीर' : p.occupation } };
        },
      },
      {
        id: 'PMV_AGE',
        field: 'age',
        label: { en: 'Minimum Age', mr: 'किमान वय' },
        requirementText: { en: '18 years or above', mr: 'वय १८ वर्षे किंवा अधिक' },
        evaluate: (p: CitizenProfile) =>
          compareMinNumber(p.age, 18, ['Age', 'वय'], (v) => ({ en: `${v} years`, mr: `${v} वर्षे` })),
      },
      {
        id: 'PMV_GOVT',
        field: 'isGovernmentEmployee',
        label: { en: 'Non-Government Family', mr: 'शासकीय नोकरी अपवाद' },
        requirementText: { en: 'No family member in regular government service', mr: 'कुटुंबातील सदस्य शासकीय सेवेत नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isGovernmentEmployee === null) {
            return p.occupation === 'artisan'
              ? { outcome: 'pass', observedDisplay: { en: 'Independent artisan', mr: 'स्वतंत्र कारागीर' } }
              : missingVal('Govt employment', 'शासकीय नोकरी');
          }
          return compareBoolean(
            p.isGovernmentEmployee,
            false,
            ['Govt employment', 'शासकीय नोकरी'],
            { en: 'Govt employee', mr: 'शासकीय नोकरी आहे' },
            { en: 'No govt service', mr: 'शासकीय नोकरी नाही' },
          );
        },
      },
    ],
    requiredDocuments: [
      { id: 'aadhaar_mob', name: { en: 'Aadhaar Card (Linked to Active Mobile No.)', mr: 'मोबाईल नंबर लिंक असलेले आधार कार्ड' }, whereToGet: { en: 'Nearest CSC Centre for Biometric Verification', mr: 'जवळचे CSC (महा ई-सेवा) केंद्र' }, mandatory: true },
      { id: 'bank_pass', name: { en: 'Bank Account Passbook & Ration Card', mr: 'बँक पासबुक व रेशन कार्ड' }, whereToGet: { en: 'Bank Branch', mr: 'बँक शाखा' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'artisanName', label: { en: 'Artisan Full Name', mr: 'कारागिराचे पूर्ण नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'trade', label: { en: 'Traditional Trade (e.g. Tailor / Carpenter)', mr: 'व्यवसाय (उदा. शिंपी / सुतार)' }, type: 'text', placeholder: { en: 'Tailor (Darzi)', mr: 'शिंपी (दर्जी)' }, required: true },
      { id: 'district', label: { en: 'District / Gram Panchayat', mr: 'जिल्हा / ग्रामपंचायत' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
    ],
  },
  {
    id: 'pm-sym-eshram',
    level: 'Central',
    category: 'Livelihood & Pension',
    ministry: {
      en: 'Ministry of Labour & Employment, Govt. of India',
      mr: 'कामगार आणि रोजगार मंत्रालय, भारत सरकार',
    },
    name: {
      en: 'PM Shram Yogi Maandhan (₹3,000/mo Pension) & e-Shram',
      mr: 'पीएम श्रम योगी मानधन (₹३,००० पेन्शन) व ई-श्रम कार्ड',
    },
    tagline: {
      en: 'Guaranteed ₹3,000/month pension after age 60 plus ₹2 Lakh accidental cover via e-Shram for unorganized workers.',
      mr: 'असंघटित कामगार, मजूर व कारागिरांना वयाच्या ६० नंतर दरमहा ₹३,००० पेन्शन व ₹२ लाख अपघात विमा.',
    },
    benefitAmount: {
      en: '₹3,000 / month pension @ 60',
      mr: '₹३,००० / महिना पेन्शन (वय ६०+)',
    },
    benefitNumericINR: 36000,
    officialSource: {
      portalName: 'maandhan.in',
      url: 'https://www.maandhan.in/',
      circularRef: 'MoLE PM-SYM & e-Shram Unorganized Workers Guidelines',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'Maandhan Official Portal', mr: 'मानधन अधिकृत पोर्टल' }, url: 'https://www.maandhan.in/', kind: 'portal' },
        { label: { en: 'e-Shram Self Registration', mr: 'ई-श्रम स्व-नोंदणी' }, url: 'https://www.eshram.gov.in/', kind: 'apply' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/pm-sym', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'SYM_AGE',
        field: 'age',
        label: { en: 'Enrollment Age', mr: 'नोंदणी वयोमर्यादा' },
        requirementText: { en: '18 to 40 years', mr: '१८ ते ४० वर्षे' },
        evaluate: (p: CitizenProfile) =>
          compareNumberRange(p.age, 18, 40, ['Age', 'वय'], (v) => ({ en: `${v} years`, mr: `${v} वर्षे` })),
      },
      {
        id: 'SYM_OCC',
        field: 'occupation',
        label: { en: 'Unorganized Sector Worker', mr: 'असंघटित क्षेत्र कामगार' },
        requirementText: { en: 'Daily wage worker, artisan, farmer, or small vendor', mr: 'मजूर, कारागीर, शेतकरी किंवा छोटा व्यावसायिक' },
        evaluate: (p: CitizenProfile) => {
          if (!p.occupation) return missingVal('Occupation', 'व्यवसाय');
          const ok = ['daily_wage', 'artisan', 'farmer', 'small_business', 'homemaker'].includes(p.occupation);
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: p.occupation, mr: p.occupation } };
        },
      },
      {
        id: 'SYM_INCOME',
        field: 'annualIncomeINR',
        label: { en: 'Monthly Income Ceiling', mr: 'मासिक उत्पन्न मर्यादा' },
        requirementText: { en: 'Monthly income ≤ ₹15,000 (≤ ₹1,80,000 / year)', mr: 'वार्षिक उत्पन्न ₹१,८०,००० पर्यंत (दरमहा ≤ ₹१५,०००)' },
        evaluate: (p: CitizenProfile) =>
          compareMaxNumber(p.annualIncomeINR, 180000, ['Annual income', 'वार्षिक उत्पन्न'], (v) => ({
            en: fmtINR(v),
            mr: fmtINR(v),
          })),
      },
      {
        id: 'SYM_TAX',
        field: 'isIncomeTaxPayer',
        label: { en: 'Exclusion: Income Tax Payer', mr: 'अपवाद: आयकर दाता' },
        requirementText: { en: 'Must not be an income tax payer', mr: 'आयकर दाता नसावा' },
        evaluate: (p: CitizenProfile) => {
          if (p.isIncomeTaxPayer === null) {
            if (p.annualIncomeINR !== null && p.annualIncomeINR <= 250000) {
              return { outcome: 'pass', observedDisplay: { en: 'Non-taxable income', mr: 'करमुक्त उत्पन्न' } };
            }
            return missingVal('Taxpayer status', 'आयकर माहिती');
          }
          return compareBoolean(
            p.isIncomeTaxPayer,
            false,
            ['Taxpayer status', 'आयकर माहिती'],
            { en: 'Income tax payer', mr: 'आयकर दाता आहे' },
            { en: 'Not a taxpayer', mr: 'आयकर दाता नाही' },
          );
        },
      },
    ],
    requiredDocuments: [
      { id: 'aadhaar_eshram', name: { en: 'Aadhaar Card & Active Mobile Number', mr: 'आधार कार्ड व मोबाईल क्रमांक' }, whereToGet: { en: 'eshram.gov.in / CSC Centre', mr: 'eshram.gov.in किंवा CSC केंद्र' }, mandatory: true },
      { id: 'savings_bank', name: { en: 'Savings Bank Passbook / Jan Dhan Account', mr: 'बचत बँक पासबुक / जन धन खाते' }, whereToGet: { en: 'Bank Branch', mr: 'बँक शाखा' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'workerName', label: { en: 'Worker Full Name', mr: 'कामगाराचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'age', label: { en: 'Age (18–40)', mr: 'वय (१८–४०)' }, profileKey: 'age', type: 'number', placeholder: { en: '32', mr: '३२' }, required: true },
      { id: 'district', label: { en: 'District', mr: 'जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
    ],
  },
  {
    id: 'jansamarth-mudra',
    level: 'Central',
    category: 'Livelihood & Pension',
    ministry: {
      en: 'Ministry of Finance, Govt. of India (JanSamarth)',
      mr: 'वित्त मंत्रालय, भारत सरकार (जनसमर्थ पोर्टल)',
    },
    name: {
      en: 'PM Mudra Loan & JanSamarth Micro-Business Credit',
      mr: 'पीएम मुद्रा कर्ज व जनसमर्थ लघुउद्योग योजना',
    },
    tagline: {
      en: 'Collateral-free micro-enterprise loans up to ₹10–20 Lakh (Shishu, Kishore, Tarun) via national JanSamarth portal.',
      mr: 'स्वयंरोजगार व लघुउद्योगासाठी तारणमुक्त ₹१०–२० लाखांपर्यंत मुद्रा कर्ज (जनसमर्थ पोर्टल).',
    },
    benefitAmount: {
      en: 'Up to ₹10L collateral-free loan',
      mr: '₹१० लाखांपर्यंत तारणमुक्त कर्ज',
    },
    benefitNumericINR: 100000,
    officialSource: {
      portalName: 'jansamarth.in',
      url: 'https://www.jansamarth.in/',
      circularRef: 'DFS JanSamarth & PMMY Credit Guidelines (2025)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'JanSamarth Official Portal', mr: 'जनसमर्थ अधिकृत पोर्टल' }, url: 'https://www.jansamarth.in/', kind: 'apply' },
        { label: { en: 'Mudra Official Portal', mr: 'मुद्रा योजना पोर्टल' }, url: 'https://www.mudra.org.in/', kind: 'portal' },
        { label: { en: 'MahaSwayam Udyog (MH)', mr: 'अण्णासाहेब पाटील / महास्वयं पोर्टल' }, url: 'https://udyog.mahaswayam.gov.in/', kind: 'apply' },
      ],
    },
    rules: [
      {
        id: 'MUD_AGE',
        field: 'age',
        label: { en: 'Adult Entrepreneur', mr: 'प्रौढ उद्योजक' },
        requirementText: { en: 'Age 18 years or above', mr: 'वय १८ वर्षे किंवा अधिक' },
        evaluate: (p: CitizenProfile) => {
          if (p.age === null) return missingVal('Age', 'वय');
          const ok = p.age >= 18;
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: `${p.age} years`, mr: `${p.age} वर्षे` } };
        },
      },
      {
        id: 'MUD_OCC',
        field: 'occupation',
        label: { en: 'Non-Farm Business / Artisan', mr: 'व्यवसाय / कारागीर / लघुउद्योग' },
        requirementText: { en: 'Small business, shopkeeper, artisan, or self-employed youth', mr: 'छोटा व्यवसाय, दुकानदार, कारागीर किंवा स्वयंरोजगार' },
        evaluate: (p: CitizenProfile) => {
          if (!p.occupation) return missingVal('Occupation', 'व्यवसाय');
          const ok = ['small_business', 'artisan', 'unemployed'].includes(p.occupation);
          return { outcome: ok ? 'pass' : 'fail', observedDisplay: { en: p.occupation, mr: p.occupation } };
        },
      },
    ],
    requiredDocuments: [
      { id: 'kyc_pan', name: { en: 'Aadhaar, PAN Card & Business Address Proof', mr: 'आधार, पॅन कार्ड व व्यवसाय पत्ता पुरावा' }, whereToGet: { en: 'Online via jansamarth.in', mr: 'jansamarth.in पोर्टलवर ऑनलाइन' }, mandatory: true },
      { id: 'udyam_reg', name: { en: 'Udyam Registration & Project Quotation', mr: 'उद्यम नोंदणी व व्यवसाय दरपत्रक' }, whereToGet: { en: 'udyamregistration.gov.in', mr: 'udyamregistration.gov.in' }, mandatory: false },
    ],
    applicationFields: [
      { id: 'ownerName', label: { en: 'Applicant / Business Owner Name', mr: 'अर्जदार / मालकाचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'District', mr: 'जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'loanNeed', label: { en: 'Estimated Loan Amount (₹)', mr: 'अपेक्षित कर्ज रक्कम (₹)' }, type: 'number', placeholder: { en: '50000', mr: '५००००' }, required: true },
    ],
  },
  {
    id: 'pm-surya-ghar',
    level: 'Central',
    category: 'Housing',
    ministry: {
      en: 'Ministry of New & Renewable Energy, Govt. of India',
      mr: 'नवीन आणि नवीकरणीय ऊर्जा मंत्रालय, भारत सरकार',
    },
    name: {
      en: 'PM Surya Ghar: Muft Bijli Yojana (Rooftop Solar)',
      mr: 'पीएम सूर्य घर: मोफत वीज योजना (रूफटॉप सोलर अनुदान)',
    },
    tagline: {
      en: 'Up to ₹78,000 central subsidy on rooftop solar installation and 300 units free monthly electricity.',
      mr: 'छतावरील सोलर पॅनेलसाठी ₹७८,००० पर्यंत अनुदान आणि दरमहा ३०० युनिटपर्यंत मोफत वीज.',
    },
    benefitAmount: {
      en: 'Up to ₹78,000 solar subsidy',
      mr: '₹७८,००० पर्यंत सोलर अनुदान',
    },
    benefitNumericINR: 78000,
    officialSource: {
      portalName: 'pmsuryaghar.gov.in',
      url: 'https://pmsuryaghar.gov.in/',
      circularRef: 'MNRE PM Surya Ghar Subsidy Guidelines (2024)',
      lastVerified: '2026-11',
      relatedLinks: [
        { label: { en: 'PM Surya Ghar Portal', mr: 'पीएम सूर्य घर पोर्टल' }, url: 'https://pmsuryaghar.gov.in/', kind: 'portal' },
        { label: { en: 'Apply for Rooftop Solar', mr: 'सोलर अनुदानासाठी अर्ज' }, url: 'https://pmsuryaghar.gov.in/#/consumer-registration', kind: 'apply' },
        { label: { en: 'myScheme Official Listing', mr: 'myScheme माहिती' }, url: 'https://www.myscheme.gov.in/schemes/pmsgmb', kind: 'guidelines' },
      ],
    },
    rules: [
      {
        id: 'PSG_AGE',
        field: 'age',
        label: { en: 'Adult Consumer Age', mr: 'प्रौढ वीज ग्राहक' },
        requirementText: { en: 'Age 18 years or above', mr: 'वय १८ वर्षे किंवा अधिक' },
        evaluate: (p: CitizenProfile) =>
          compareMinNumber(p.age, 18, ['Age', 'वय'], (v) => ({ en: `${v} years`, mr: `${v} वर्षे` })),
      },
      {
        id: 'PSG_HOUSE',
        field: 'hasPuccaHouse',
        label: { en: 'Own House with Roof', mr: 'सोलरसाठी स्वतःचे पक्के घर' },
        requirementText: { en: 'Must own a residential house with suitable roof & electricity meter', mr: 'रहिवासी स्वतःचे पक्के घर व वीज कनेक्शन असावे' },
        evaluate: (p: CitizenProfile) =>
          compareBoolean(
            p.hasPuccaHouse,
            true,
            ['Own pucca house status', 'स्वतःचे पक्के घर आहे का'],
            { en: 'Owns pucca house', mr: 'पक्के घर आहे' },
            { en: 'No pucca house', mr: 'पक्के घर नाही' },
          ),
      },
    ],
    requiredDocuments: [
      { id: 'elec_bill', name: { en: 'Latest Electricity Bill (MSEDCL / DISCOM)', mr: 'नवीनतम वीज बिल (महावितरण)' }, whereToGet: { en: 'MSEDCL Consumer Portal', mr: 'महावितरण पोर्टल' }, mandatory: true },
      { id: 'aadhaar_bank', name: { en: 'Aadhaar & Bank Passbook for DBT Subsidy', mr: 'आधार व अनुदानासाठी बँक पासबुक' }, whereToGet: { en: 'pmsuryaghar.gov.in', mr: 'pmsuryaghar.gov.in' }, mandatory: true },
    ],
    applicationFields: [
      { id: 'consumerName', label: { en: 'Electricity Consumer Name', mr: 'वीज ग्राहकाचे नाव' }, profileKey: 'fullName', type: 'text', placeholder: { en: 'Full Name', mr: 'पूर्ण नाव' }, required: true },
      { id: 'district', label: { en: 'District', mr: 'जिल्हा' }, profileKey: 'district', type: 'text', placeholder: { en: 'District', mr: 'जिल्हा' }, required: true },
      { id: 'consumerNo', label: { en: 'Electricity Consumer Number', mr: 'वीज ग्राहक क्रमांक' }, type: 'text', placeholder: { en: '12-digit MSEDCL No.', mr: '१२ अंकी ग्राहक क्र.' }, required: true },
    ],
  },
];
