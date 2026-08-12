import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { LANGUAGES, dictionaries, type Language, type TranslationKey } from './translations';

interface LanguageContextValue {
  language: Language;
  dir: 'ltr' | 'rtl';
  setLanguage(language: Language): void;
  t(key: TranslationKey, vars?: Record<string, string | number>): string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'smart-tasks-ai.language';

function detectInitialLanguage(): Language {
  const stored = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
  if (stored === 'en' || stored === 'he') return stored;
  const browser = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return browser.startsWith('he') ? 'he' : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectInitialLanguage);
  const dir = useMemo(() => LANGUAGES.find((l) => l.code === language)?.dir ?? 'ltr', [language]);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = dir;
    localStorage.setItem(STORAGE_KEY, language);
  }, [language, dir]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      dir,
      setLanguage: setLanguageState,
      t: (key, vars) => {
        const template = dictionaries[language][key];
        if (!vars) return template;
        return Object.entries(vars).reduce(
          (acc, [name, val]) => acc.replaceAll(`{${name}}`, String(val)),
          template,
        );
      },
    }),
    [language, dir],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within a LanguageProvider');
  return ctx;
}
