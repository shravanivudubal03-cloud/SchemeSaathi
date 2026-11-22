import { SchemeCategory, UILanguage } from '../types/scheme.ts';

export const UI_COPY: Record<
  UILanguage,
  {
    brandTitle: string;
    navCopilot: string;
    navDirectory: string;
    navForms: string;
    navArchitecture: string;
    langSwitchLabel: string;
    govPortalStrip: string;
    fontSizeLabel: string;
    heroKicker: string;
    heroHeadline: string;
    heroSubhead: string;
    heroCaption: string;
    searchPlaceholder: string;
    searchClearBtn: string;
    categoriesTitle: string;
    categoriesSubtitle: string;
    allCategoriesLabel: string;
    howItWorksTitle: string;
    step1Title: string;
    step1Desc: string;
    step2Title: string;
    step2Desc: string;
    step3Title: string;
    step3Desc: string;
    browseResultsTitle: string;
    voiceLangLabel: string;
    speakBtn: string;
    listeningBtn: string;
    recordingBtn: string;
    transcribingBtn: string;
    uploadAudioBtn: string;
    stopListeningBtn: string;
    voiceUnsupported: string;
    inputPlaceholder: string;
    analyzeBtn: string;
    analyzingBtn: string;
    sampleLabel: string;
    filterAll: string;
    filterEligible: string;
    filterNeedsInfo: string;
    filterIneligible: string;
    statusEligible: string;
    statusNeedsInfo: string;
    statusIneligible: string;
    profileTitle: string;
    profileSubtitle: string;
    editProfileToggle: string;
    jsonToggle: string;
    ruleCheckHeader: string;
    ruleRequirementCol: string;
    ruleObservedCol: string;
    explainBtn: string;
    explainingBtn: string;
    listenBtn: string;
    stopAudioBtn: string;
    docsHeading: string;
    whereToGetLabel: string;
    officialSourceLabel: string;
    openFormBtn: string;
    emptyResultsTitle: string;
    emptyResultsBody: string;
    formDeskTitle: string;
    formDeskSubtitle: string;
    printPdfBtn: string;
    downloadJsonBtn: string;
    readFormAloudBtn: string;
    selectSchemeFirst: string;
    declarationText: string;
    directoryTitle: string;
    directorySubtitle: string;
    archTitle: string;
    archSubtitle: string;
    ollamaBarTitle: string;
    ollamaModeLabel: string;
    ollamaModeBrowser: string;
    ollamaModeServer: string;
    ollamaPolicyLabel: string;
    ollamaPolicyAuto: string;
    ollamaPolicyStrict: string;
    ollamaPolicyGemini: string;
    ollamaProbeBtn: string;
    ollamaOnlineLabel: string;
    ollamaOfflineLabel: string;
    ollamaTestBtn: string;
    ollamaTestingBtn: string;
    analyzingOllamaNotice: string;
    analyzingGeminiNotice: string;
  }
> = {
  en: {
    brandTitle: 'SchemeSaathi · योजनासाथी',
    navCopilot: 'Find Schemes',
    navDirectory: 'All Schemes',
    navForms: 'Application Desk',
    navArchitecture: 'How It Works',
    langSwitchLabel: 'मराठी',
    govPortalStrip: 'National & Maharashtra Citizen Welfare Portal · Verified Official Rules',
    fontSizeLabel: 'Text Size',
    heroKicker: 'Discover Government Schemes For You',
    heroHeadline: 'Find every Central and Maharashtra scheme you qualify for—with verified proof.',
    heroSubhead:
      'Search by scheme name, browse categories, or speak your household situation in Marathi, Hindi, or English. Rules are checked deterministically against official circulars.',
    heroCaption: 'Citizen Seva Desk · Verified Central & Maharashtra Government Schemes',
    searchPlaceholder: 'Search schemes by name, benefit, or keyword (e.g. Ladki Bahin, Farmer, Solar, Pension)…',
    searchClearBtn: 'Clear',
    categoriesTitle: 'Find Schemes Based on Categories',
    categoriesSubtitle: 'Select a category to filter verified government schemes and direct official portals.',
    allCategoriesLabel: 'All Categories',
    howItWorksTitle: 'Easy Steps to Apply for Government Schemes',
    step1Title: '01. Enter or Speak Details',
    step1Desc: 'Describe your family, age, income, and occupation in Marathi, Hindi, or English.',
    step2Title: '02. Verified Rule Matching',
    step2Desc: 'Our deterministic rules engine evaluates your profile with clause-by-clause proof.',
    step3Title: '03. Explore, Prepare & Apply',
    step3Desc: 'Check required documents, visit official .gov.in portals, or print a pre-filled form.',
    browseResultsTitle: 'Verified Government Schemes',
    voiceLangLabel: 'Voice language',
    speakBtn: 'Speak Situation',
    listeningBtn: 'Listening… Tap to Stop',
    recordingBtn: 'Recording… Tap to Stop',
    transcribingBtn: 'Transcribing speech…',
    uploadAudioBtn: 'Upload Audio Clip',
    stopListeningBtn: 'Stop Mic',
    voiceUnsupported: 'Live mic is unavailable in this browser—you can upload a voice note or type below.',
    inputPlaceholder:
      'Example: I am Sunita Patil, age 34, widow living in Amravati. Annual income is ₹1.2 lakh, yellow ration card, no pucca house…',
    analyzeBtn: 'Find Schemes For Me',
    analyzingBtn: 'Checking Eligibility Rules…',
    sampleLabel: 'Try a sample citizen profile:',
    filterAll: 'All Schemes',
    filterEligible: 'Eligible Now',
    filterNeedsInfo: 'Needs 1–2 Details',
    filterIneligible: 'Not Eligible',
    statusEligible: 'Verified Eligible',
    statusNeedsInfo: 'Needs Verification',
    statusIneligible: 'Criteria Not Met',
    profileTitle: 'Extracted Citizen Profile',
    profileSubtitle: 'Structured JSON evaluated deterministically by the rules engine',
    editProfileToggle: 'Edit Profile Fields',
    jsonToggle: 'Inspect JSON',
    ruleCheckHeader: 'Clause-by-Clause Eligibility Proof',
    ruleRequirementCol: 'Official Rule',
    ruleObservedCol: 'Your Profile',
    explainBtn: 'Explain Simply',
    explainingBtn: 'Writing explanation…',
    listenBtn: 'Listen',
    stopAudioBtn: 'Stop Audio',
    docsHeading: 'Required Documents Checklist',
    whereToGetLabel: 'Where to obtain:',
    officialSourceLabel: 'Official Portal Links',
    openFormBtn: 'Pre-Fill Application Form',
    emptyResultsTitle: 'Browse schemes by category above or check your personal eligibility',
    emptyResultsBody:
      'Speak or type your age, district, occupation, and income in Marathi, Hindi, or English to unlock personalized rule-by-rule eligibility checks.',
    formDeskTitle: 'Pre-Filled Application Desk',
    formDeskSubtitle: 'Auto-populated from your verified citizen profile. Review, complete bank/ID fields, and print or export.',
    printPdfBtn: 'Print / Save as PDF',
    downloadJsonBtn: 'Download JSON',
    readFormAloudBtn: 'Read Form Summary Aloud',
    selectSchemeFirst: 'Select any eligible scheme from Find Schemes to generate a pre-filled application sheet.',
    declarationText:
      'Self-Declaration: I confirm that the household details above are accurate to the best of my knowledge for preliminary welfare application preparation.',
    directoryTitle: 'Official Government Schemes & Live Portal Directory',
    directorySubtitle: 'Every eligibility threshold, circular reference, and live-scraped official .gov.in portal link.',
    archTitle: 'System Architecture & Ollama Integration',
    archSubtitle: 'How SchemeSaathi prevents LLM hallucinations by separating language parsing from deterministic rule evaluation.',
    ollamaBarTitle: 'LLM Engine (Ollama)',
    ollamaModeLabel: 'Connection Path',
    ollamaModeBrowser: 'Browser Direct (127.0.0.1:11434)',
    ollamaModeServer: 'Server (/api/ollama-chat)',
    ollamaPolicyLabel: 'AI Provider',
    ollamaPolicyAuto: 'Auto (Ollama → Gemini)',
    ollamaPolicyStrict: 'Ollama Only',
    ollamaPolicyGemini: 'Gemini Alternative',
    ollamaProbeBtn: 'Connect / Refresh Models',
    ollamaOnlineLabel: 'Ollama Online',
    ollamaOfflineLabel: 'Ollama Offline · Auto Fallback Ready',
    ollamaTestBtn: 'Run Live Ollama Extraction Test',
    ollamaTestingBtn: 'Running Ollama Test…',
    analyzingOllamaNotice: 'Sending your statement to server /api/ollama-chat (qwen2.5:3b), then verifying official scheme rules…',
    analyzingGeminiNotice: 'Extracting structured profile via Gemini alternative, then verifying official scheme rules…',
  },
  mr: {
    brandTitle: 'SchemeSaathi · योजनासाथी',
    navCopilot: 'योजना शोधा',
    navDirectory: 'सर्व योजना',
    navForms: 'अर्ज कक्ष',
    navArchitecture: 'कार्यपद्धती',
    langSwitchLabel: 'English',
    govPortalStrip: 'राष्ट्रीय व महाराष्ट्र नागरिक कल्याण पोर्टल · प्रमाणित शासकीय नियम',
    fontSizeLabel: 'अक्षर आकार',
    heroKicker: 'तुमच्यासाठी योग्य शासकीय योजना शोधा',
    heroHeadline: 'केंद्र व महाराष्ट्र शासनाच्या सर्व पात्र योजना पुराव्यासह मिळवा.',
    heroSubhead:
      'योजनेच्या नावाने शोधा, श्रेणी निवडा किंवा मराठी, हिंदी व इंग्रजीत तुमची परिस्थिती बोला. शासन निर्णयांवर आधारित अचूक पात्रता तपासणी.',
    heroCaption: 'नागरिक सेवा कक्ष · केंद्र व महाराष्ट्र शासनाच्या प्रमाणित योजना',
    searchPlaceholder: 'योजनेचे नाव, लाभ किंवा शब्द शोधा (उदा. लाडकी बहीण, शेतकरी, सोलर, पेन्शन)…',
    searchClearBtn: 'पुसा',
    categoriesTitle: 'श्रेणीनुसार शासकीय योजना शोधा',
    categoriesSubtitle: 'प्रत्येक विभागातील पात्र योजना व अधिकृत शासकीय पोर्टल लिंक पाहण्यासाठी श्रेणी निवडा.',
    allCategoriesLabel: 'सर्व श्रेण्या',
    howItWorksTitle: 'शासकीय योजनेसाठी अर्ज करण्याची सोपी प्रक्रिया',
    step1Title: '०१. माहिती बोला किंवा लिहा',
    step1Desc: 'तुमचे वय, उत्पन्न, काम आणि कुटुंबाची माहिती मराठी, हिंदी किंवा इंग्रजीत द्या.',
    step2Title: '०२. अचूक नियम तपासणी',
    step2Desc: 'आमचे नियम इंजिन शासन निर्णयानुसार प्रत्येक अटीची पुराव्यासह पडताळणी करते.',
    step3Title: '०३. कागदपत्रे व थेट अर्ज',
    step3Desc: 'आवश्यक कागदपत्रे पहा, अधिकृत .gov.in पोर्टलवर जा किंवा भरलेला अर्ज प्रिंट करा.',
    browseResultsTitle: 'प्रमाणित शासकीय योजना',
    voiceLangLabel: 'बोलण्याची भाषा',
    speakBtn: 'बोलून माहिती द्या',
    listeningBtn: 'ऐकत आहे… थांबवण्यासाठी दाबा',
    recordingBtn: 'रेकॉर्डिंग सुरू… थांबवण्यासाठी दाबा',
    transcribingBtn: 'आवाज मजकुरात रूपांतरित होत आहे…',
    uploadAudioBtn: 'ऑडिओ फाइल अपलोड करा',
    stopListeningBtn: 'माइक थांबवा',
    voiceUnsupported: 'या ब्राउझरमध्ये थेट माइक उपलब्ध नाही—खाली टाइप करा किंवा ऑडिओ क्लिप अपलोड करा.',
    inputPlaceholder:
      'उदाहरण: मी सुनीता पाटील, वय ३४, राहणार अमरावती, विधवा महिला आहे. वार्षिक उत्पन्न १.२ लाख रुपये, पिवळे रेशन कार्ड आहे आणि पक्के घर नाही…',
    analyzeBtn: 'माझ्यासाठी योजना शोधा',
    analyzingBtn: 'पात्रता नियम तपासत आहे…',
    sampleLabel: 'नमुना नागरिक परिस्थिती निवडा:',
    filterAll: 'सर्व योजना',
    filterEligible: 'पात्र योजना',
    filterNeedsInfo: 'अधिक माहिती हवी',
    filterIneligible: 'अपात्र योजना',
    statusEligible: 'पात्रता सिद्ध',
    statusNeedsInfo: 'माहिती अपूर्ण',
    statusIneligible: 'निकष अपूर्ण',
    profileTitle: 'नोंदवलेली नागरिक माहिती',
    profileSubtitle: 'नियम इंजिनद्वारे तपासलेला संरचित JSON डेटा',
    editProfileToggle: 'माहिती सुधारा',
    jsonToggle: 'JSON पहा',
    ruleCheckHeader: 'प्रत्येक नियमाचा तपशीलवार पुरावा',
    ruleRequirementCol: 'शासकीय नियम',
    ruleObservedCol: 'तुमची माहिती',
    explainBtn: 'सोप्या भाषेत समजून घ्या',
    explainingBtn: 'स्पष्टीकरण तयार होत आहे…',
    listenBtn: 'ऐका',
    stopAudioBtn: 'आवाज थांबवा',
    docsHeading: 'आवश्यक कागदपत्रांची यादी',
    whereToGetLabel: 'कोठे मिळेल:',
    officialSourceLabel: 'अधिकृत पोर्टल व दुवे',
    openFormBtn: 'तयार अर्ज उघडा',
    emptyResultsTitle: 'वर श्रेणीनुसार योजना पहा किंवा तुमची पात्रता तपासा',
    emptyResultsBody:
      'तुमचे वय, जिल्हा, व्यवसाय आणि उत्पन्न मराठी, हिंदी किंवा इंग्रजीत सांगा—पात्र योजना, कागदपत्रे आणि भरलेला अर्ज लगेच पहा.',
    formDeskTitle: 'पूर्व-भरलेला अर्ज कक्ष',
    formDeskSubtitle: 'तुमच्या माहितीनुसार भरलेला अर्ज तपासा, बँक तपशील पूर्ण करा आणि प्रिंट किंवा PDF सेव्ह करा.',
    printPdfBtn: 'प्रिंट / PDF सेव्ह करा',
    downloadJsonBtn: 'JSON डाउनलोड करा',
    readFormAloudBtn: 'अर्जाचा सारांश ऐका',
    selectSchemeFirst: 'भरलेला अर्ज पाहण्यासाठी योजना शोधा विभागातून कोणतीही पात्र योजना निवडा.',
    declarationText:
      'स्वयं-घोषणापत्र: वरील सर्व कौटुंबिक व आर्थिक माहिती माझ्या माहितीनुसार सत्य आहे.',
    directoryTitle: 'अधिकृत शासकीय योजना व थेट पोर्टल सूची',
    directorySubtitle: 'सर्व प्रमाणित योजना, पात्रता अटी आणि थेट स्क्रॅप केलेले .gov.in पोर्टल दुवे.',
    archTitle: 'तांत्रिक रचना व Ollama वापर',
    archSubtitle: 'LLM कडून चुकीची पात्रता सांगणे टाळण्यासाठी भाषा प्रक्रिया आणि नियम इंजिन कसे वेगळे ठेवले आहे.',
    ollamaBarTitle: 'LLM इंजिन (Ollama)',
    ollamaModeLabel: 'कनेक्शन मार्ग',
    ollamaModeBrowser: 'थेट ब्राउझर (127.0.0.1:11434)',
    ollamaModeServer: 'सर्व्हर (/api/ollama-chat)',
    ollamaPolicyLabel: 'AI प्रदाता',
    ollamaPolicyAuto: 'ऑटो (Ollama → Gemini)',
    ollamaPolicyStrict: 'फक्त Ollama',
    ollamaPolicyGemini: 'Gemini पर्याय',
    ollamaProbeBtn: 'कनेक्ट / मॉडेल्स तपासा',
    ollamaOnlineLabel: 'Ollama ऑनलाइन',
    ollamaOfflineLabel: 'Ollama ऑफलाइन · फॉल-बॅक सज्ज',
    ollamaTestBtn: 'थेट Ollama चाचणी घ्या',
    ollamaTestingBtn: 'चाचणी सुरू आहे…',
    analyzingOllamaNotice: 'सर्व्हर /api/ollama-chat (qwen2.5:3b) कडून माहिती घेऊन अधिकृत योजना नियम तपासत आहे…',
    analyzingGeminiNotice: 'Gemini पर्यायाद्वारे माहिती काढून अधिकृत योजना नियम तपासत आहे…',
  },
};

export const CATEGORY_LABELS: Record<SchemeCategory, { en: string; mr: string }> = {
  'Women & Child': { en: 'Women & Child', mr: 'महिला व बाल विकास' },
  Agriculture: { en: 'Agriculture & Rural', mr: 'कृषी व ग्रामीण' },
  Health: { en: 'Health & Wellness', mr: 'आरोग्य व विमा' },
  Housing: { en: 'Housing & Energy', mr: 'घरकुल व ऊर्जा' },
  Education: { en: 'Education & Learning', mr: 'शिक्षण व शिष्यवृत्ती' },
  'Livelihood & Pension': { en: 'Livelihood & Pension', mr: 'रोजगार व निवृत्तीवेतन' },
};

export interface SampleCitizenStory {
  id: string;
  label: { en: string; mr: string };
  speechLang: 'mr-IN' | 'hi-IN' | 'en-IN';
  text: string;
}

export const SAMPLE_STORIES: SampleCitizenStory[] = [
  {
    id: 'vidarbha-widow',
    label: {
      en: 'Amravati Widowed Mother (Marathi)',
      mr: 'अमरावती विधवा महिला (मराठी)',
    },
    speechLang: 'mr-IN',
    text: 'माझे नाव सुनीता रमेश पाटील आहे, वय ३४ वर्षे, राहणार अमरावती जिल्हा, महाराष्ट्र. मी विधवा महिला असून मला ८ वर्षांची मुलगी आहे. माझे वार्षिक उत्पन्न १.२ लाख रुपये आहे, पिवळे रेशन कार्ड आहे आणि आमचे घर कच्चे आहे, गॅस कनेक्शन नाही.',
  },
  {
    id: 'yavatmal-farmer',
    label: {
      en: 'Yavatmal Smallholder Farmer (Marathi)',
      mr: 'यवतमाळ अल्पभूधारक शेतकरी (मराठी)',
    },
    speechLang: 'mr-IN',
    text: 'मी रमेश तुकाराम शिंदे, वय ४६ वर्षे, यवतमाळ ग्रामीण भागातील शेतकरी आहे. माझ्या नावावर २.५ एकर शेतजमीन आहे आणि वार्षिक उत्पन्न ९५ हजार रुपये आहे. माझ्याकडे केशरी रेशन कार्ड आहे आणि मी सरकारी नोकरीत नाही.',
  },
  {
    id: 'artisan-hindi',
    label: {
      en: 'Kolhapur Tailor Artisan (Hindi)',
      mr: 'कोल्हापूर शिंपी कारागीर (हिंदी)',
    },
    speechLang: 'hi-IN',
    text: 'मेरा नाम इरफान शेख है, उम्र 38 साल, मैं कोल्हापुर महाराष्ट्र में रहता हूँ। मैं दर्जी (tailor) का काम करता हूँ और मेरी सालाना आय 1.4 लाख रुपये है। मेरे पास पक्का घर नहीं है।',
  },
  {
    id: 'nagpur-student',
    label: {
      en: 'Nagpur SC Engineering Student (English)',
      mr: 'नागपूर अभियांत्रिकी विद्यार्थी (इंग्रजी)',
    },
    speechLang: 'en-IN',
    text: 'My name is Priya Meshram, age 20, living in Nagpur, Maharashtra. I am an SC category undergraduate B.Tech student. My family annual income is Rs 180000 and we hold an orange ration card.',
  },
];
