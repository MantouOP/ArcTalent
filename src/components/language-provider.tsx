'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ChevronDown, Globe2 } from 'lucide-react';
import './language-selector.css';
import {
  languageOptions,
  languageStorageKey,
  resolveLocale,
  translate,
  type Locale,
  type TranslationValues,
} from '@/lib/i18n';

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (source: string | null | undefined, values?: TranslationValues) => string;
};

const LanguageContext = createContext<LanguageContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (source, values) => translate('en', source, values),
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, updateLocale] = useState<Locale>('en');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      updateLocale(resolveLocale(localStorage.getItem(languageStorageKey)));
    } catch {
      /* Storage is optional. */
    }
    setReady(true);
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = translate(locale, 'ArcTalent — Your next chapter, mapped');
    if (ready)
      try {
        localStorage.setItem(languageStorageKey, locale);
      } catch {
        /* Keep switching usable when storage is unavailable. */
      }
  }, [locale, ready]);
  const setLocale = useCallback(
    (next: Locale) => updateLocale(resolveLocale(next)),
    [],
  );
  const t = useCallback(
    (source: string | null | undefined, values?: TranslationValues) =>
      translate(locale, source, values),
    [locale],
  );
  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t],
  );
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  return useContext(LanguageContext);
}

export function LanguageSelector() {
  const { locale, setLocale, t } = useI18n();
  return (
    <label className="language-selector">
      <Globe2 size={17} className="language-icon" aria-hidden="true" />
      <span className="sr-only">{t('Language')}</span>
      <select
        aria-label="Language / Bahasa / 语言"
        value={locale}
        onChange={(event) => setLocale(resolveLocale(event.target.value))}
      >
        {languageOptions.map(({ value, label }) => (
          <option key={value} value={value} lang={value}>
            {label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="language-chevron" aria-hidden="true" />
    </label>
  );
}
