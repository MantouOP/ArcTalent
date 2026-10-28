import ms from './messages/ms.json';
import zh from './messages/zh-CN.json';
import teamMs from './messages/team.ms.json';
import teamZh from './messages/team.zh-CN.json';
import workerMs from './messages/worker.ms.json';
import workerZh from './messages/worker.zh-CN.json';
import chatMs from './messages/chat.ms.json';
import chatZh from './messages/chat.zh-CN.json';
import settingsMs from './messages/settings.ms.json';
import settingsZh from './messages/settings.zh-CN.json';
import inputsMs from './messages/inputs.ms.json';
import inputsZh from './messages/inputs.zh-CN.json';
import goalsMs from './messages/goals.ms.json';
import goalsZh from './messages/goals.zh-CN.json';
import pdfMs from './messages/pdf.ms.json';
import pdfZh from './messages/pdf.zh-CN.json';
import workforceGoalsMs from './messages/workforce-goals.ms.json';
import workforceGoalsZh from './messages/workforce-goals.zh-CN.json';
import introductionMs from './messages/introduction.ms.json';
import introductionZh from './messages/introduction.zh-CN.json';
import impactMs from './messages/impact.ms.json';
import impactZh from './messages/impact.zh-CN.json';

export const locales = ['en', 'ms', 'zh-CN'] as const;
export type Locale = (typeof locales)[number];
export type TranslationValues = Record<
  string,
  string | number | null | undefined
>;
export const languageOptions: { value: Locale; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'ms', label: 'Bahasa Melayu' },
  { value: 'zh-CN', label: '简体中文' },
];
export const languageStorageKey = 'arctalent-locale-v1';

export function resolveLocale(value: unknown): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : 'en';
}

export const dictionaries: Record<
  Exclude<Locale, 'en'>,
  Record<string, string>
> = {
  ms: {
    ...teamMs,
    ...workerMs,
    ...chatMs,
    ...settingsMs,
    ...inputsMs,
    ...goalsMs,
    ...pdfMs,
    ...workforceGoalsMs,
    ...introductionMs,
    ...impactMs,
    ...ms,
  },
  'zh-CN': {
    ...teamZh,
    ...workerZh,
    ...chatZh,
    ...settingsZh,
    ...inputsZh,
    ...goalsZh,
    ...pdfZh,
    ...workforceGoalsZh,
    ...introductionZh,
    ...impactZh,
    ...zh,
  },
};

/** Display translation only: canonical data, identifiers and source quotes are untouched. */
export function translate(
  locale: Locale,
  source: string | null | undefined,
  values: TranslationValues = {},
): string {
  if (!source) return '';
  const text =
    locale === 'en' || !Object.hasOwn(dictionaries[locale], source)
      ? source
      : dictionaries[locale][source];
  return text.replace(/\{(\w+)\}/g, (placeholder, key: string) =>
    Object.hasOwn(values, key) ? String(values[key] ?? '') : placeholder,
  );
}
