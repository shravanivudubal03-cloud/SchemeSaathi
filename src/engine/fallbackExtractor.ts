import {
  CitizenProfile,
  EducationLevel,
  Gender,
  MaritalStatus,
  Occupation,
  RationCardType,
  ResidenceType,
  SocialCategory,
  SpokenLanguage,
} from '../types/scheme.ts';
import { EMPTY_PROFILE } from './rulesEngine.ts';

const MAHARASHTRA_LOCATIONS = [
  'pune', 'पुणे', 'mumbai', 'मुंबई', 'navi mumbai', 'नवी मुंबई', 'nagpur', 'नागपूर',
  'nashik', 'नाशिक', 'amravati', 'अमरावती', 'aurangabad', 'छत्रपती संभाजीनगर', 'sambhajinagar',
  'kolhapur', 'कोल्हापूर', 'satara', 'सातारा', 'sangli', 'सांगली',
  'solapur', 'सोलापूर', 'yavatmal', 'यवतमाळ', 'ahmednagar', 'अहमदनगर',
  'ahilyanagar', 'अहिल्यानगर', 'jalgaon', 'जळगाव', 'akola', 'अकोला',
  'latur', 'लातूर', 'nanded', 'नांदेड', 'wardha', 'वर्धा', 'beed', 'बीड',
  'thane', 'ठाणे', 'raigad', 'रायगड', 'ratnagiri', 'रत्नागिरी', 'chandrapur', 'चंद्रपूर',
  'buldhana', 'बुलढाणा', 'washim', 'वाशिम', 'parbhani', 'परभणी', 'jalna', 'जालना',
  'osmanabad', 'धाराशिव', 'dharashiv', 'gadchiroli', 'गडचिरोली', 'gondia', 'गोंदिया',
  'bhandara', 'भंडारा', 'hingoli', 'हिंगोली', 'palghar', 'पालघर', 'sindhudurg', 'सिंधुदुर्ग',
  'nandurbar', 'नंदुरबार', 'dhule', 'धुळे', 'baramati', 'बारामती', 'pimpri', 'पिंपरी',
  'kalyan', 'कल्याण', 'vasai', 'वसई', 'malegaon', 'मालेगाव', 'ichalkaranji', 'इचलकरंजी',
  'pandharpur', 'पंढरपूर', 'karad', 'कराड', 'sangamner', 'संगमनेर',
];

function normalizeDevanagariDigits(str: string): string {
  const map: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
  };
  return str.replace(/[०-९]/g, (d) => map[d] || d);
}

export function detectLanguage(text: string): SpokenLanguage {
  const devanagariMatches = text.match(/[\u0900-\u097F]/g);
  if (!devanagariMatches || devanagariMatches.length < 3) return 'en';
  const marathiMarkers = ['आहे', 'माझी', 'माझे', 'मी', 'राहणार', 'उत्पन्न', 'वर्ष', 'रुपये', 'एकर', 'मुलगी', 'पिवळे', 'केशरी', 'शेतकरी', 'महिला', 'नाही'];
  const mrHits = marathiMarkers.filter((w) => text.includes(w)).length;
  return mrHits >= 1 ? 'mr' : 'hi';
}

function coerceNumber(val: unknown): number | null {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val !== 'string') return null;
  const cleaned = normalizeDevanagariDigits(val).replace(/[,₹\s]/g, '').toLowerCase();
  if (!cleaned) return null;
  const lakhMatch = cleaned.match(/^(\d+(?:\.\d+)?)(lakh|lac|l)$/);
  if (lakhMatch) return Math.round(parseFloat(lakhMatch[1]) * 100000);
  const kMatch = cleaned.match(/^(\d+(?:\.\d+)?)(thousand|k)$/);
  if (kMatch) return Math.round(parseFloat(kMatch[1]) * 1000);
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function coerceBoolean(val: unknown): boolean | null {
  if (typeof val === 'boolean') return val;
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'होय', 'हां'].includes(s)) return true;
  if (['false', 'no', 'n', '0', 'नाही', 'नहीं'].includes(s)) return false;
  return null;
}

function normalizeGender(val: unknown): Gender | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (['female', 'f', 'woman', 'girl', 'महिला', 'स्त्री', 'औरत'].includes(s)) return 'female';
  if (['male', 'm', 'man', 'boy', 'पुरुष', 'आदमी'].includes(s)) return 'male';
  if (['other', 'non-binary', 'transgender', 'इतर'].includes(s)) return 'other';
  return null;
}

function normalizeMaritalStatus(val: unknown): MaritalStatus | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (s === 'widowed' || s.includes('widow') || s.includes('विधवा')) return 'widowed';
  if (s === 'married' || s.includes('विवाहित') || s.includes('शादीशुदा')) return 'married';
  if (s === 'single' || s.includes('unmarried') || s.includes('अविवाहित')) return 'single';
  if (s === 'divorced' || s.includes('घटस्फोटित') || s.includes('तलाकशुदा')) return 'divorced';
  return null;
}

function normalizeResidenceType(val: unknown): ResidenceType | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (s === 'rural' || /\b(village|gramin)\b/.test(s) || s.includes('ग्रामीण') || s.includes('गाव')) return 'rural';
  if (s === 'urban' || /\b(city|town|metro)\b/.test(s) || s.includes('शहरी') || s.includes('शहर')) return 'urban';
  return null;
}

function normalizeOccupation(val: unknown): Occupation | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (s === 'farmer' || /\b(farmer|farming|agriculture|kisan|shetkari)\b/.test(s) || /(शेतकरी|किसान)/.test(s)) return 'farmer';
  if (s === 'artisan' || /\b(artisan|tailor|carpenter|potter|barber|cobbler|blacksmith|mason|darzi|goldsmith|weaver)\b/.test(s) || /(शिंपी|सुतार|कारागीर|दर्जी|कुंभार|लोहार|न्हावी)/.test(s)) return 'artisan';
  if (s === 'daily_wage' || /\b(daily[_ ]?wage|labour|labor|laborer|mazdoor|construction)\b/.test(s) || /(मजूर|मजदूर|कामगार)/.test(s)) return 'daily_wage';
  if (s === 'student' || /\b(student|college|studying)\b/.test(s) || /(विद्यार्थी|छात्र)/.test(s)) return 'student';
  if (s === 'small_business' || /\b(small[_ ]?business|business|shop|shopkeeper|vendor|merchant|kirana|parlour|salon)\b/.test(s) || /(दुकानदार|व्यवसाय)/.test(s)) return 'small_business';
  if (s === 'homemaker' || /\b(homemaker|housewife)\b/.test(s) || s.includes('गृहिणी')) return 'homemaker';
  if (s === 'unemployed' || /\b(unemployed|jobless)\b/.test(s) || s.includes('बेरोजगार')) return 'unemployed';
  if (s === 'salaried' || /\b(salaried|employee|govt|government)\b/.test(s) || /(नोकरी|कर्मचारी)/.test(s)) return 'salaried';
  if (s === 'senior_citizen' || /\b(senior[_ ]?citizen|retired|elderly)\b/.test(s) || /(ज्येष्ठ|वृद्ध)/.test(s)) return 'senior_citizen';
  return null;
}

function normalizeSocialCategory(val: unknown): SocialCategory | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase().replace(/[\s/]+/g, '_');
  if (['sc', 'scheduled_caste'].includes(s)) return 'sc';
  if (['st', 'scheduled_tribe'].includes(s)) return 'st';
  if (['obc', 'other_backward_class'].includes(s)) return 'obc';
  if (['nt_vjnt', 'nt', 'vjnt', 'sbc'].includes(s)) return 'nt_vjnt';
  if (['ews'].includes(s)) return 'ews';
  if (['general', 'open'].includes(s)) return 'general';
  return null;
}

function normalizeRationCard(val: unknown): RationCardType | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (s.includes('antyodaya') || s.includes('aay') || s.includes('अंत्योदय')) return 'antyodaya';
  if (s.includes('yellow') || s.includes('bpl') || s.includes('पिवळ') || s.includes('पीला')) return 'bpl_yellow';
  if (s.includes('orange') || s.includes('apl') || s.includes('केशरी') || s.includes('नारंगी')) return 'apl_orange';
  if (s.includes('white') || s.includes('पांढर') || s.includes('सफेद')) return 'white';
  if (s === 'none' || s === 'no card') return 'none';
  return null;
}

function normalizeEducationLevel(val: unknown): EducationLevel | null {
  if (typeof val !== 'string') return null;
  const s = val.trim().toLowerCase();
  if (['school', '10th', 'ssc', 'primary', 'secondary'].includes(s) || /\bschool\b/.test(s)) return 'school';
  if (['undergraduate', 'ug', 'bachelor', 'btech', 'b.tech', 'bsc', 'ba', 'bcom', 'college', 'degree'].includes(s) || /\b(b\.?tech|b\.?sc|bachelor|undergraduate)\b/.test(s)) return 'undergraduate';
  if (['postgraduate', 'pg', 'master', 'mtech', 'msc', 'ma', 'mba'].includes(s) || /\b(m\.?tech|m\.?sc|master|postgraduate)\b/.test(s)) return 'postgraduate';
  if (['iti_diploma', 'iti', 'diploma', 'polytechnic'].includes(s) || /\b(iti|diploma|polytechnic)\b/.test(s)) return 'iti_diploma';
  if (['none', 'illiterate'].includes(s)) return 'none';
  return null;
}

function normalizeState(state: unknown, district: string | null): string | null {
  if (typeof state === 'string' && state.trim()) {
    const s = state.trim().toLowerCase();
    if (s === 'mh' || s.includes('maharashtra') || s.includes('महाराष्ट्र')) {
      return 'Maharashtra';
    }
    return state.trim();
  }
  if (district) {
    const dLower = district.trim().toLowerCase();
    if (MAHARASHTRA_LOCATIONS.some((loc) => dLower.includes(loc))) {
      return 'Maharashtra';
    }
  }
  return null;
}

export function parseCitizenProfileLocally(rawText: string): CitizenProfile {
  const text = normalizeDevanagariDigits(rawText);
  const lower = text.toLowerCase();
  const profile: CitizenProfile = {
    ...EMPTY_PROFILE,
    spokenLanguage: detectLanguage(text),
    rawSummary: rawText.trim(),
  };

  // Name extraction
  const isPlausibleName = (candidate: string, explicitPrefix: boolean) => {
    if (candidate.length < 2) return false;
    if (/^\d/.test(candidate)) return false;
    if (
      /^(एक|a|an|the|from|living|resident|woman|girl|man|boy|farmer|student|widow|विधवा|शेतकरी|किसान|मुलगी|मुलगा|महिला|पुरुष|लड़की|लड़का|विद्यार्थी|तरुण|तरुणी|गृहिणी|मजूर|कामगार|रहिवासी|राहणार|महाराष्ट्र)/i.test(
        candidate,
      )
    ) {
      return false;
    }
    if (
      !explicitPrefix &&
      (/(तील|मधील|ची|चा|चे|च्या|वाला|वाली)$/i.test(candidate) ||
        MAHARASHTRA_LOCATIONS.some((loc) => candidate.toLowerCase().includes(loc)))
    ) {
      return false;
    }
    return true;
  };

  const explicitNameMatch = text.match(
    /(?:माझे नाव|माझं नाव|मेरा नाम|my name is)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+){0,2})/i,
  );
  if (explicitNameMatch && explicitNameMatch[1]) {
    const candidate = explicitNameMatch[1].replace(/(?:आहे|हूँ|हूं|is|am)$/i, '').trim();
    if (isPlausibleName(candidate, true)) {
      profile.fullName = candidate;
    }
  } else {
    const introNameMatch = text.match(
      /(?:^|[.!?\n]\s*)(?:मी|मैं|i am|i'm)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+){0,2})/i,
    );
    if (introNameMatch && introNameMatch[1]) {
      const candidate = introNameMatch[1].replace(/(?:आहे|हूँ|हूं|is|am)$/i, '').trim();
      if (isPlausibleName(candidate, false)) {
        profile.fullName = candidate;
      }
    }
  }

  // Age extraction
  const ageMatch =
    text.match(/(?:age|वय|उम्र)\s*(?:is|:)?\s*(\d{1,2})/i) ||
    text.match(/(\d{1,2})\s*(?:-?\s*years?\s*old|yrs|years|yo|वर्षीय|वर्षे|वर्ष|वर्षांची|वर्षांचा|वर्षाचे|साल)/i);
  if (ageMatch) {
    const ageNum = parseInt(ageMatch[1], 10);
    if (ageNum >= 1 && ageNum <= 110) profile.age = ageNum;
  }

  // Gender & marital status
  if (/(widow|विधवा)/i.test(text)) {
    profile.gender = 'female';
    profile.maritalStatus = 'widowed';
  } else if (
    /(female|woman|girl|mahila|महिला|स्त्री|औरत|बाई|गृहिणी|बहीण|मुलगी|तरुणी|युवती|लड़की|बहन)/i.test(text) &&
    !/(मला[^\n.]{0,20}मुलगी|माझी मुलगी|मेरी बेटी|my daughter|have a daughter)/i.test(text)
  ) {
    profile.gender = 'female';
  } else if (/(female|woman|mahila|महिला|स्त्री|औरत|बाई|गृहिणी|बहीण|आई)/i.test(text)) {
    profile.gender = 'female';
  } else if (/(male|man|boy|पुरुष|आदमी|मुलगा|लड़का|तरुण|शेतकरी दादा)/i.test(lower)) {
    profile.gender = 'male';
  }

  if (/(married|विवाहित|शादीशुदा)/i.test(text)) profile.maritalStatus = profile.maritalStatus ?? 'married';
  if (/(unmarried|single|अविवाहित)/i.test(text)) profile.maritalStatus = profile.maritalStatus ?? 'single';
  if (/(divorced|घटस्फोटित|तलाकशुदा)/i.test(text)) profile.maritalStatus = profile.maritalStatus ?? 'divorced';

  // State & District
  for (const dist of MAHARASHTRA_LOCATIONS) {
    if (lower.includes(dist)) {
      profile.district = dist.charAt(0).toUpperCase() + dist.slice(1);
      profile.state = 'Maharashtra';
      break;
    }
  }
  if (!profile.state && /(maharashtra|महाराष्ट्र|vidarbha|विदर्भ|marathwada|मराठवाडा|konkan|कोकण)/i.test(text)) {
    profile.state = 'Maharashtra';
  }

  // Income extraction
  if (/दीड\s*लाख/i.test(text) || /डेढ़\s*लाख/i.test(text)) {
    profile.annualIncomeINR = 150000;
  } else if (/सव्वा\s*लाख/i.test(text) || /सवा\s*लाख/i.test(text)) {
    profile.annualIncomeINR = 125000;
  } else if (/अडीच\s*लाख/i.test(text) || /ढाई\s*लाख/i.test(text)) {
    profile.annualIncomeINR = 250000;
  } else {
    const lakhMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:lakh|lac|लाख)/i);
    const thousandMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:thousand|k|हजार|हज़ार)/i);
    const monthlyRsMatch = text.match(/(?:rs\.?|₹|inr)?\s*(\d[\d,]{2,5})\s*(?:\/?\s*(?:per\s*)?(?:month|mo|pm)|monthly|दरमहा|महीना|प्रति\s*माह)/i);
    const rsMatch = text.match(/(?:rs\.?|₹|inr|उत्पन्न|आय|income|salary)\s*(?:is|आहे|हैं|:)?\s*(\d[\d,]{3,7})/i);

    if (lakhMatch) {
      profile.annualIncomeINR = Math.round(parseFloat(lakhMatch[1]) * 100000);
    } else if (thousandMatch) {
      profile.annualIncomeINR = Math.round(parseFloat(thousandMatch[1]) * 1000);
    } else if (monthlyRsMatch) {
      profile.annualIncomeINR = parseInt(monthlyRsMatch[1].replace(/,/g, ''), 10) * 12;
    } else if (rsMatch) {
      profile.annualIncomeINR = parseInt(rsMatch[1].replace(/,/g, ''), 10);
    }
  }

  // Monthly income conversion if explicitly monthly
  if (profile.annualIncomeINR && /(per month|\/month|monthly|दरमहा|महीना|प्रति माह)/i.test(text) && profile.annualIncomeINR < 40000) {
    profile.annualIncomeINR = profile.annualIncomeINR * 12;
  }

  // Occupation
  if (/(farmer|farming|agriculture|शेतकरी|शेती|किसान|खेती)/i.test(text)) {
    profile.occupation = 'farmer';
  } else if (/(student|college|studying|b\.tech|iti|diploma|विद्यार्थी|शिकत|कॉलेज|पढ़ाई|छात्र)/i.test(text)) {
    profile.occupation = 'student';
    if (/(b\.tech|engineering|degree|graduation|b\.sc|b\.a|b\.com|undergraduate)/i.test(text)) {
      profile.educationLevel = 'undergraduate';
    } else if (/(iti|diploma|डिप्लोमा)/i.test(text)) {
      profile.educationLevel = 'iti_diploma';
    } else if (/(postgraduate|m\.sc|m\.tech|m\.a)/i.test(text)) {
      profile.educationLevel = 'postgraduate';
    } else if (/(school|10th|9th|8th|शाळा)/i.test(text)) {
      profile.educationLevel = 'school';
    } else {
      profile.educationLevel = 'undergraduate';
    }
  } else if (/(tailor|carpenter|artisan|potter|barber|blacksmith|cobbler|mason|goldsmith|weaver|शिंपी|सुतार|कुंभार|लोहार|कारीगर|दर्जी|बढ़ई|कारागीर|सोनार|न्हावी|चर्मकार)/i.test(text)) {
    profile.occupation = 'artisan';
  } else if (/(shop|business|store|kirana|parlour|salon|mudra|दुकान|व्यवसाय|व्यापार|उद्योग|पार्लर)/i.test(text)) {
    profile.occupation = 'small_business';
  } else if (/(daily wage|labour|laborer|मजूर|मजदूर|कामगार)/i.test(text)) {
    profile.occupation = 'daily_wage';
  } else if (/(homemaker|housewife|गृहिणी)/i.test(text)) {
    profile.occupation = 'homemaker';
    profile.gender = profile.gender ?? 'female';
  } else if (/(unemployed|बेरोजगार)/i.test(text)) {
    profile.occupation = 'unemployed';
  } else if (/(govt employee|government employee|सरकारी नोकरी|शासकीय कर्मचारी)/i.test(text)) {
    profile.occupation = 'salaried';
    profile.isGovernmentEmployee = true;
  } else if (/(senior citizen|ज्येष्ठ|वृद्ध|बुजुर्ग)/i.test(text) || (profile.age && profile.age >= 60)) {
    profile.occupation = 'senior_citizen';
  }

  // Land holding
  const landMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:acre|acres|एकर|एकड़)/i);
  if (landMatch) {
    profile.landHoldingAcres = parseFloat(landMatch[1]);
  } else if (/(landless|भूमिहीन|जमीन नाही)/i.test(text)) {
    profile.landHoldingAcres = 0;
  }

  // Ration card
  if (/(antyodaya|अंत्योदय)/i.test(text)) profile.rationCardType = 'antyodaya';
  else if (/(yellow|पिवळे|पिवळं|पीला|bpl)/i.test(text)) profile.rationCardType = 'bpl_yellow';
  else if (/(orange|केशरी|नारंगी)/i.test(text)) profile.rationCardType = 'apl_orange';
  else if (/(white ration|पांढरे|सफेद)/i.test(text)) profile.rationCardType = 'white';

  // Housing
  if (/(kutcha|mud house|tin shed|no house|no pucca|homeless|कच्चे घर|कच्चा मकान|घर नाही|पक्के घर नाही|पक्का घर नहीं|झोपडी)/i.test(text)) {
    profile.hasPuccaHouse = false;
  } else if (/(own pucca|pucca house|पक्के घर आहे|पक्का घर है|स्वत:चे घर)/i.test(text)) {
    profile.hasPuccaHouse = true;
  }

  // LPG
  if (/(no lpg|no gas|firewood|chulha|गॅस नाही|गॅस कनेक्शन नाही|गैस नहीं|चूल|चूल्हा)/i.test(text)) {
    profile.hasLpgConnection = false;
  } else if (/(have lpg|has gas|गॅस कनेक्शन आहे|गैस कनेक्शन है)/i.test(text)) {
    profile.hasLpgConnection = true;
  }

  // Girl child (ONLY match parental/daughter-in-family phrasing, NOT self-description like "मी 22 वर्षीय मुलगी आहे")
  const hasParentalGirlPhrase =
    /(have a daughter|my daughter|girl child|daughter aged|\d{1,2}\s*year(?:s)?\s*old daughter|मला[^\n.]{0,20}(?:मुलगी|मुली)|माझी मुलगी|आमची मुलगी|माझ्या मुली|मुलीचे वय|मुलीसाठी|\d{1,2}\s*वर्षांची मुलगी|एक मुलगी आहे|दोन मुली|मेरी बेटी|मुझे[^\n.]{0,20}बेटी|\d{1,2}\s*साल की बेटी|बेटी है|कन्या जन्म)/i.test(
      text,
    ) && !/(?:मी|मैं)[^\n.]{0,30}(?:वर्षीय|वर्षांची|साल की)\s*(?:मुलगी|लड़की)\s*(?:आहे|हूँ|हूं)/i.test(text);
  if (hasParentalGirlPhrase) {
    profile.hasGirlChild = true;
    const girlAgeMatch =
      text.match(/(?:daughter|मुलगी|बेटी)[^\d]{0,16}(\d{1,2})/i) ||
      text.match(/(\d{1,2})\s*(?:वर्षांची मुलगी|साल की बेटी|year(?:s)? old daughter)/i);
    if (girlAgeMatch) profile.girlChildAge = parseInt(girlAgeMatch[1], 10);
  }

  // Social category
  if (/(?:\bsc\b|अनुसूचित जाती|अनुसूचित जाति)/i.test(text)) profile.socialCategory = 'sc';
  else if (/(?:\bst\b|अनुसूचित जमाती|आदिवासी)/i.test(text)) profile.socialCategory = 'st';
  else if (/(?:\bobc\b|इतर मागास)/i.test(text)) profile.socialCategory = 'obc';
  else if (/(?:\bnt\b|\bvjnt\b|भटक्या)/i.test(text)) profile.socialCategory = 'nt_vjnt';
  else if (/\bews\b/i.test(text)) profile.socialCategory = 'ews';

  // Disability
  if (/(disabled|disability|handicapped|दिव्यांग|अपंग|विकलांग)/i.test(text)) {
    profile.isDifferentlyAbled = true;
  }

  // Residence type
  if (/(village|rural|gram|गाव|गाँव|ग्रामीण)/i.test(text)) profile.residenceType = 'rural';
  else if (/(city|urban|शहर|नगर)/i.test(text)) profile.residenceType = 'urban';

  // Explicit government employee / tax payer exclusions
  if (/(not a govt|not government|सरकारी नोकरी नाही|शासकीय नोकरीत नाही)/i.test(text)) {
    profile.isGovernmentEmployee = false;
  }
  if (profile.annualIncomeINR !== null && profile.annualIncomeINR <= 250000) {
    profile.isIncomeTaxPayer = false;
    profile.isGovernmentEmployee = profile.isGovernmentEmployee ?? false;
  }

  return profile;
}

export function sanitizeCitizenProfile(raw: Partial<CitizenProfile> & Record<string, unknown>, rawText: string): CitizenProfile {
  const fallback = parseCitizenProfileLocally(rawText);

  const age = coerceNumber(raw.age) ?? fallback.age;
  const annualIncomeINR = coerceNumber(raw.annualIncomeINR) ?? fallback.annualIncomeINR;
  const landHoldingAcres = coerceNumber(raw.landHoldingAcres) ?? fallback.landHoldingAcres;
  const girlChildAge = coerceNumber(raw.girlChildAge) ?? fallback.girlChildAge;

  const district =
    typeof raw.district === 'string' && raw.district.trim() ? raw.district.trim() : fallback.district;
  const state = normalizeState(raw.state, district) ?? fallback.state;

  const maritalStatus = normalizeMaritalStatus(raw.maritalStatus) ?? fallback.maritalStatus;
  let gender = normalizeGender(raw.gender) ?? fallback.gender;
  let occupation = normalizeOccupation(raw.occupation) ?? fallback.occupation;
  if (!occupation && age !== null && age >= 60) {
    occupation = 'senior_citizen';
  }

  if (!gender && (maritalStatus === 'widowed' || occupation === 'homemaker')) {
    if (!/(widower|विधुर)/i.test(rawText)) {
      gender = 'female';
    }
  }

  // Prevent LLM from falsely putting demographic adjectives in fullName or setting hasGirlChild on self-descriptions
  let cleanFullName = typeof raw.fullName === 'string' && raw.fullName.trim() ? raw.fullName.trim() : fallback.fullName;
  if (
    cleanFullName &&
    (/^(महाराष्ट्रातील|महाराष्ट्र|एक|विधवा|शेतकरी|मुलगी|लड़की|महिला|तरुणी|female|male|woman|girl)$/i.test(cleanFullName) ||
      /तील$/i.test(cleanFullName))
  ) {
    cleanFullName = fallback.fullName;
  }

  const selfAsGirlStatement =
    /(?:मी|मैं|i am|i'm)[^\n.]{0,35}(?:मुलगी|लड़की|तरुणी|युवती|girl|young woman)/i.test(rawText) &&
    !/(?:have a daughter|my daughter|मला[^\n.]{0,20}मुलगी|माझी मुलगी|मेरी बेटी)/i.test(rawText);

  const hasGirlChild = selfAsGirlStatement
    ? null
    : coerceBoolean(raw.hasGirlChild) ?? (girlChildAge !== null ? true : fallback.hasGirlChild);

  const isIncomeTaxPayer =
    coerceBoolean(raw.isIncomeTaxPayer) ??
    fallback.isIncomeTaxPayer ??
    (annualIncomeINR !== null && annualIncomeINR <= 250000 ? false : null);

  const nonGovtOccupations: Occupation[] = [
    'farmer',
    'artisan',
    'daily_wage',
    'student',
    'homemaker',
    'unemployed',
    'small_business',
  ];
  const isGovernmentEmployee =
    coerceBoolean(raw.isGovernmentEmployee) ??
    fallback.isGovernmentEmployee ??
    (occupation && nonGovtOccupations.includes(occupation) ? false : null);

  return {
    fullName: cleanFullName,
    age: age !== null && age >= 1 && age <= 115 ? Math.round(age) : fallback.age,
    gender,
    maritalStatus,
    state,
    district,
    residenceType: normalizeResidenceType(raw.residenceType) ?? fallback.residenceType,
    annualIncomeINR: annualIncomeINR !== null && annualIncomeINR >= 0 ? Math.round(annualIncomeINR) : fallback.annualIncomeINR,
    occupation,
    landHoldingAcres: landHoldingAcres !== null && landHoldingAcres >= 0 ? landHoldingAcres : fallback.landHoldingAcres,
    socialCategory: normalizeSocialCategory(raw.socialCategory) ?? fallback.socialCategory,
    rationCardType: normalizeRationCard(raw.rationCardType) ?? fallback.rationCardType,
    hasPuccaHouse: coerceBoolean(raw.hasPuccaHouse) ?? fallback.hasPuccaHouse,
    hasLpgConnection: coerceBoolean(raw.hasLpgConnection) ?? fallback.hasLpgConnection,
    hasGirlChild,
    girlChildAge: girlChildAge !== null && girlChildAge >= 0 && girlChildAge <= 50 ? Math.round(girlChildAge) : fallback.girlChildAge,
    isGovernmentEmployee,
    isIncomeTaxPayer,
    isDifferentlyAbled: coerceBoolean(raw.isDifferentlyAbled) ?? fallback.isDifferentlyAbled,
    educationLevel: normalizeEducationLevel(raw.educationLevel) ?? fallback.educationLevel,
    bankAccountLinkedAadhaar: coerceBoolean(raw.bankAccountLinkedAadhaar) ?? fallback.bankAccountLinkedAadhaar,
    spokenLanguage:
      typeof raw.spokenLanguage === 'string' && ['mr', 'hi', 'en'].includes(raw.spokenLanguage)
        ? (raw.spokenLanguage as SpokenLanguage)
        : detectLanguage(rawText),
    rawSummary: rawText.trim(),
  };
}


