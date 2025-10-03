import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ToolDetail } from "@/components/crypto/tool-detail";
import { locales } from "@/i18n";
import {
  TOOL_ALIAS_LOOKUP,
  TOOL_DEFINITIONS,
  TOOL_IDS,
  TOOL_ROUTE_LOOKUP,
  type ToolId,
} from "@/lib/tool-config";
import { getMetadataBase } from "@/lib/seo";

interface ToolPageParams {
  locale: string;
  tool: string;
}

const DEFAULT_METADATA: Metadata = {
  title: "CryptoTools",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<ToolPageParams>;
}): Promise<Metadata> {
  const { locale, tool } = await params;
  const routeToolId = TOOL_ROUTE_LOOKUP[tool];

  if (!routeToolId) {
    return DEFAULT_METADATA;
  }

  const config = TOOL_DEFINITIONS[routeToolId];
  // No need to check for aliasInfo here, as aliases will have their own pages
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
    keywords: Array.from(new Set([title, appTitle, tool, ...featureKeywords])),
    alternates: {
      canonical: `/${locale}/${tool}`,
    },
    openGraph: {
      title: `${title} | ${appTitle}`,
      description,
      locale,
      type: "website",
      url: `/${locale}/${tool}`,
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
  return locales.flatMap((locale) =>
    TOOL_IDS.map((toolId) => ({
      locale,
      tool: TOOL_DEFINITIONS[toolId].path,
    })),
  );
}

export default async function ToolPage({
  params,
}: {
  params: Promise<ToolPageParams>;
}) {
  const { locale, tool } = await params;
  const baseToolId = TOOL_ROUTE_LOOKUP[tool];

  if (!baseToolId) {
    notFound();
  }

  // No need to check for aliasEntry here, as aliases will have their own pages

  return (
    <ToolDetail
      toolId={baseToolId as ToolId}
      locale={locale}
      // No alias prop needed here
    />
  );
}
