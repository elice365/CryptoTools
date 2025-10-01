import { getRequestConfig } from "next-intl/server";

export const locales = ["ko", "en", "ja", "ru", "id", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
