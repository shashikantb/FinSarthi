
export interface Language {
  code: string;
  name: string;
}

export const allLanguages: Language[] = [
    { code: "en", name: "English" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "es", name: "Español (Spanish)" },
    { code: "fr", name: "Français (French)" },
    { code: "de", name: "Deutsch (German)" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "pt", name: "Português (Portuguese)" },
    { code: "ru", name: "Русский (Russian)" },
    { code: "ar", name: "العربية (Arabic)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "id", name: "Bahasa Indonesia (Indonesian)" },
    { code: "ko", name: "한국어 (Korean)" },
    { code: "tr", name: "Türkçe (Turkish)" },
    { code: "it", name: "Italiano (Italian)" },
    { code: "nl", name: "Nederlands (Dutch)" },
    { code: "vi", name: "Tiếng Việt (Vietnamese)" },
];
