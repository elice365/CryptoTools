import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ToolDetail } from "@/components/crypto/tool-detail";
import { locales } from "@/i18n";
import { TOOL_DEFINITIONS, type ToolId } from "@/lib/tool-config";
import { getMetadataBase } from "@/lib/seo";

const TOOL_ID: ToolId = "tripledes";

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const config = TOOL_DEFINITIONS[TOOL_ID];
  const t = await getTranslations({ locale });

  const title = t(config.titleKey);
  const description = t(config.descriptionKey);
  const appTitle = t("app.title");
  const featureKeywords = config.features
    .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
    .filter(Boolean);

  const keywords = [
    title,
    "3DES",
    "Triple DES",
    "TDEA",
    "168-bit encryption",
    "triple encryption",
    "block cipher",
    "symmetric encryption",
    ...featureKeywords,
  ];

  const metadataBase = getMetadataBase();
  const siteUrl = metadataBase.origin;

  return {
    metadataBase,
    title: `${title} | ${appTitle}`,
    description,
    keywords: Array.from(new Set(keywords)),
    alternates: {
      canonical: `${siteUrl}/${locale}/${TOOL_ID}`,
      languages: Object.fromEntries(
        locales.map((loc) => [loc, `/${loc}/${TOOL_ID}`])
      ),
    },
    openGraph: {
      title: `${title} | ${appTitle}`,
      description,
      locale,
      type: "website",
      url: `${siteUrl}/${locale}/${TOOL_ID}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${appTitle}`,
      description,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function TripleDesPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const config = TOOL_DEFINITIONS[TOOL_ID];

  if (!config) {
    notFound();
  }

  return <ToolDetail toolId={TOOL_ID} locale={locale} />;
}
