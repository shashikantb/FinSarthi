
export const translations = {
  en: {
    name: "English",
    language: "Language",
    monthlyIncome: "Monthly Income",
    monthlyExpenses: "Monthly Expenses",
    financialGoals: "Financial Goals",
    literacy: "Financial Literacy",
    selectLevel: "Select your level",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    next: "Next",
    back: "Back",
    generateAdvice: "Generate Advice",
    generating: "Generating...",
    adviceResultTitle: "Your Personalized Advice",
    adviceResultDescription:
      "Here's AI-powered financial advice tailored just for you. Your data is saved locally for your dashboard.",
    yourAdviceHere: "Your advice will appear here.",
    error: "Failed to generate advice. Please try again.",
    saveAndContinue: "View Dashboard",
    createAnAccount: "Create an Account",
    generatingAdviceTitle: "Crafting Your Plan",
    generatingAdviceDescription:
      "Our AI is analyzing your information to create a personalized financial plan. This might take a moment.",
  },
  hi: {
    name: "Hindi",
    language: "भाषा",
    monthlyIncome: "मासिक आय",
    monthlyExpenses: "मासिक खर्च",
    financialGoals: "वित्तीय लक्ष्य",
    literacy: "वित्तीय साक्षरता",
    selectLevel: "अपना स्तर चुनें",
    beginner: "शुरुआती",
    intermediate: "मध्यम",
    advanced: "उन्नत",
    next: "अगला",
    back: "वापस",
    generateAdvice: "सलाह उत्पन्न करें",
    generating: "उत्पन्न हो रहा है...",
    adviceResultTitle: "आपकी व्यक्तिगत सलाह",
    adviceResultDescription:
      "यह आपके लिए विशेष रूप से तैयार की गई AI-संचालित वित्तीय सलाह है। आपका डेटा आपके डैशबोर्ड के लिए स्थानीय रूप से सहेजा गया है।",
    yourAdviceHere: "आपकी सलाह यहां दिखाई देगी।",
    error: "सलाह उत्पन्न करने में विफल। कृपया पुन: प्रयास करें।",
    saveAndContinue: "डैशबोर्ड देखें",
    createAnAccount: "खाता बनाएं",
    generatingAdviceTitle: "आपकी योजना तैयार हो रही है",
    generatingAdviceDescription:
      "हमारा AI व्यक्तिगत वित्तीय योजना बनाने के लिए आपकी जानकारी का विश्लेषण कर रहा है। इसमें कुछ समय लग सकता है।",
  },
  mr: {
    name: "Marathi",
    language: "भाषा",
    monthlyIncome: "मासिक उत्पन्न",
    monthlyExpenses: "मासिक खर्च",
    financialGoals: "आर्थिक उद्दिष्ट्ये",
    literacy: "आर्थिक साक्षरता",
    selectLevel: "तुमची पातळी निवडा",
    beginner: "नवशिक्या",
    intermediate: "मध्यम",
    advanced: "प्रगत",
    next: "पुढे",
    back: "मागे",
    generateAdvice: "सल्ला मिळवा",
    generating: "तयार होत आहे...",
    adviceResultTitle: "तुमचा वैयक्तिक सल्ला",
    adviceResultDescription:
      "येथे तुमच्यासाठी तयार केलेला AI-शक्तीवर आधारित आर्थिक सल्ला आहे. तुमचा डेटा तुमच्या डॅशबोर्डसाठी स्थानिक पातळीवर सेव्ह केला आहे.",
    yourAdviceHere: "तुमचा सल्ला येथे दिसेल.",
    error: "सल्ला तयार करण्यात अयशस्वी. कृपया पुन्हा प्रयत्न करा.",
    saveAndContinue: "डॅशबोर्ड पहा",
    createAnAccount: "खाते तयार करा",
    generatingAdviceTitle: "तुमची योजना तयार करत आहे",
    generatingAdviceDescription:
      "आमचे AI वैयक्तिक आर्थिक योजना तयार करण्यासाठी तुमच्या माहितीचे विश्लेषण करत आहे. यास थोडा वेळ लागू शकतो.",
  },
};

export const languages = {
    en: { name: "English", locale: "en-US" },
    hi: { name: "Hindi", locale: "hi-IN" },
    mr: { name: "Marathi", locale: "mr-IN" },
}

export const langToLocale: Record<string, string> = {
  English: "en-US",
  Hindi: "hi-IN",
  Marathi: "mr-IN",
};
