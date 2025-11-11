import "../globals.css";

import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { locales, type Locale } from "@/i18n";
import { getMetadataBase, getSiteUrl } from "@/lib/seo";

const METADATA_BASE = getMetadataBase();
const SITE_URL = getSiteUrl();

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

  // Enhanced keywords based on locale
  const baseKeywords = [
    "cryptography",
    "encryption",
    "AES",
    "RSA",
    "ECC",
    "post-quantum cryptography",
    "Kyber",
    "Dilithium",
    "BLAKE2",
    "SHA-256",
    "SHA-512",
    "SHA-3",
    "base64",
    "hash function",
    "browser-based encryption",
    "client-side encryption",
    "secure encryption",
    "ChaCha20",
    "Salsa20",
    "stream cipher",
    "block cipher",
    "DES",
    "3DES",
    "RC4",
    "Rabbit",
    "ECIES",
    "ElGamal",
    "Paillier",
    "BGV",
  ];

  const localeSpecificKeywords: Record<string, string[]> = {
    ko: ["온라인 암호화", "무료 암호화 도구", "브라우저 암호화", "암호화", "보안 도구", "웹 암호화", "데이터 보안", "개인정보 보호"],
    en: ["online encryption", "free cryptography tools", "encryption tools", "security tools", "web crypto", "data security", "privacy protection"],
    ja: ["オンライン暗号化", "無料暗号化ツール", "ブラウザ暗号化", "暗号化", "セキュリティツール", "ウェブ暗号化", "データセキュリティ"],
    zh: ["在线加密", "免费加密工具", "浏览器加密", "加密", "安全工具", "网络加密", "数据安全", "隐私保护"],
    ru: ["онлайн шифрование", "бесплатные инструменты шифрования", "шифрование в браузере", "безопасность данных"],
    id: ["enkripsi online", "alat enkripsi gratis", "enkripsi browser", "keamanan data", "perlindungan privasi"],
  };

  const allKeywords = [
    ...baseKeywords,
    ...(localeSpecificKeywords[locale] || []),
  ];

  return {
    title,
    description,
    keywords: allKeywords,
    authors: [{ name: "CryptoTools", url: "https://crypto.elice.pro" }],
    creator: "CryptoTools",
    publisher: "CryptoTools",
    metadataBase: METADATA_BASE,
    applicationName: "CryptoTools",
    referrer: "origin-when-cross-origin",
    category: "Security",
    classification: "Cryptography Tools",
    verification: {
      // google: "google-site-verification-code", // Add your Google Search Console verification code here
      other: {
        "naver-site-verification": "2469b7e557f9e7b210cbd57ea6c5fc6bb3c96724",
      },
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: {
        "ko-KR": `${SITE_URL}/ko`,
        "en-US": `${SITE_URL}/en`,
        "ja-JP": `${SITE_URL}/ja`,
        "zh-CN": `${SITE_URL}/zh`,
        "ru-RU": `${SITE_URL}/ru`,
        "id-ID": `${SITE_URL}/id`,
        "x-default": `${SITE_URL}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: ({ ko: "ko_KR", ja: "ja_JP", zh: "zh_CN", ru: "ru_RU", id: "id_ID" } as Record<string, string>)[locale] ?? "en_US",
      url: `${SITE_URL}/${locale}`,
      title,
      description,
      siteName: "CryptoTools",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: "CryptoTools - Professional Cryptographic Toolkit",
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@CryptoTools",
      creator: "@CryptoTools",
      images: {
        url: "/opengraph-image",
        alt: "CryptoTools - Professional Cryptographic Toolkit",
      },
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        noimageindex: false,
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
      shortcut: "/favicon.svg",
      apple: { url: "/apple-icon", sizes: "180x180", type: "image/png" },
      other: [
        {
          rel: "mask-icon",
          url: "/favicon.svg",
        },
      ],
    },
    manifest: "/site.webmanifest",
    other: {
      "mobile-web-app-capable": "yes",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "black-translucent",
      "apple-mobile-web-app-title": "CryptoTools",
      "format-detection": "telephone=no",
      "theme-color": "#0f172a",
      "color-scheme": "dark light",
    },
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
