"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { SupportedLanguage, DICTIONARY } from "@/lib/i18n/translations";
import { Globe } from "lucide-react";

interface LanguageContextProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>("en");

  useEffect(() => {
    const saved = localStorage.getItem("vb_language") as SupportedLanguage;
    if (saved && (saved === "en" || saved === "te" || saved === "hi")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem("vb_language", lang);
    } catch {}
  };

  const t = (key: string): string => {
    return DICTIONARY[language]?.[key] || DICTIONARY["en"]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-[#171717] border border-[#2e2e2e] rounded-full p-1 text-xs">
      <Globe className="w-3.5 h-3.5 text-[#D8B58A] ml-1.5 mr-0.5" />
      <button
        onClick={() => setLanguage("en")}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          language === "en"
            ? "bg-[#C99A8A] text-[#080808] font-semibold shadow-xs"
            : "text-[#A8A29E] hover:text-[#F6EFE7]"
        }`}
      >
        EN
      </button>
      <button
        onClick={() => setLanguage("te")}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          language === "te"
            ? "bg-[#C99A8A] text-[#080808] font-semibold shadow-xs"
            : "text-[#A8A29E] hover:text-[#F6EFE7]"
        }`}
      >
        తెలుగు
      </button>
      <button
        onClick={() => setLanguage("hi")}
        className={`px-2 py-0.5 rounded-full transition-colors ${
          language === "hi"
            ? "bg-[#C99A8A] text-[#080808] font-semibold shadow-xs"
            : "text-[#A8A29E] hover:text-[#F6EFE7]"
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}
