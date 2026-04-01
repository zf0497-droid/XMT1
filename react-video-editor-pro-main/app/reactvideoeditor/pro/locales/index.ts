import { zhCN, Locale } from './zh-CN';

export const locales = {
  'zh-CN': zhCN,
};

export type SupportedLocale = keyof typeof locales;

// 默认使用简体中文
export const defaultLocale: SupportedLocale = 'zh-CN';

export const getLocale = (locale: SupportedLocale = defaultLocale): Locale => {
  return locales[locale] || locales[defaultLocale];
};

export const t = getLocale('zh-CN');
