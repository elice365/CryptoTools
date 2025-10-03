import "../globals.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { locales, type Locale } from "@/i18n";
import { getMetadataBase } from "@/lib/seo";

const METADATA_BASE = getMetadataBase();

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "app" });

  const title = `${t("title")} - ${t("description")}`;
  const description = t("footer");

  return {
    title,
    description,
    keywords: [
      "cryptography",
      "encryption",
      "AES",
      "RSA",
      "post-quantum cryptography",
      "Kyber",
      "Dilithium",
      "BLAKE2",
      "SHA-3",
      "base64",
      "hash",
      "browser-based encryption",
      "암호화",
      "暗号化",
      "加密",
    ],
    authors: [{ name: "CryptoTools" }],
    creator: "CryptoTools",
    publisher: "CryptoTools",
    metadataBase: METADATA_BASE,
    verification: {
      other: {
        "naver-site-verification": "2469b7e557f9e7b210cbd57ea6c5fc6bb3c96724",
      },
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ko: "/ko",
        en: "/en",
        ja: "/ja",
        zh: "/zh",
        ru: "/ru",
        id: "/id",
      },
    },
    openGraph: {
      type: "website",
      locale: locale,
      url: `https://crypto.elice.pro/${locale}`,
      title,
      description,
      siteName: "CryptoTools",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "CryptoTools - Professional Cryptographic Toolkit",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/opengraph-image"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: [
        { url: "/icon", type: "image/png", sizes: "32x32" },
        { url: "/favicon.svg", type: "image/svg+xml" },
      ],
      apple: { url: "/apple-icon", sizes: "180x180", type: "image/png" },
    },
    manifest: "/site.webmanifest",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  setRequestLocale(locale as Locale);

  const messages = await getMessages();

  return (
    <html lang={locale as Locale} className="h-full" suppressHydrationWarning>
      <body className="h-full font-sans antialiased">
        <ThemeProvider>
          <NextIntlClientProvider locale={locale as Locale} messages={messages} now={new Date()}>
            {children}
            <Toaster richColors closeButton position="top-right" />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
