import createMiddleware from "next-intl/middleware";
import { routing } from "./src/i18n/routing";

export default createMiddleware({
  locales: routing.locales,
  defaultLocale: routing.defaultLocale,
  localePrefix: routing.localePrefix,
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|icon|apple-icon|opengraph-image|favicon.svg|og-image.svg|site.webmanifest|sitemap.xml|robots.txt|.*\\.ico|.*\\.png|.*\\.svg|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)",
  ],
};