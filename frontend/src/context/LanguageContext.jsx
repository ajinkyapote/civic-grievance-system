import { createContext, useContext, useState } from "react";
import { TRANSLATIONS, SUPPORTED_LANGUAGES } from "../utils/i18n";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem("civic_lang") || "en");

  const setLang = (code) => {
    localStorage.setItem("civic_lang", code);
    setLangState(code);
  };

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, languages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
