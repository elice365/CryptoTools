import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['ko', 'en', 'ja', 'ru', 'id', 'zh'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ko';
export const localePrefix = 'always';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale as Locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.json`)).default
  };
});
