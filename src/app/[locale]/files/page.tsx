import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ToolDetail } from "@/components/crypto/tool-detail";
import { locales } from "@/i18n";
import {
  TOOL_DEFINITIONS,
  type ToolId,
} from "@/lib/tool-config";
import { getMetadataBase } from "@/lib/seo";

const TOOL_ID: ToolId = "files";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const config = TOOL_DEFINITIONS[TOOL_ID];
  const t = await getTranslations({ locale });

  const title = t(config.titleKey);
  const description = t(config.descriptionKey);
  const badge = t(config.badgeKey);
  const appTitle = t("app.title");
  const featureKeywords = config.features
    .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
    .filter(Boolean);

  const metadataBase = getMetadataBase();

  return {
    metadataBase,
    title: `${title} | ${appTitle}`,
    description,
    keywords: Array.from(new Set([title, appTitle, TOOL_ID, ...featureKeywords])),
    alternates: {
      canonical: `/${locale}/${TOOL_ID}`,
    },
    openGraph: {
      title: `${title} | ${appTitle}`,
      description,
      locale,
      type: "website",
      url: `/${locale}/${TOOL_ID}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${appTitle}`,
      description,
      creator: badge,
    },
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({
    locale,
  }));
}

export default async function FilesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <ToolDetail
      toolId={TOOL_ID}
      locale={locale}
    />
  );
}
