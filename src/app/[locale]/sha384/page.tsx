import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ToolDetail } from "@/components/crypto/tool-detail";
import { locales } from "@/i18n";
import {
  TOOL_ALIAS_LOOKUP,
  TOOL_DEFINITIONS,
  type ToolId,
} from "@/lib/tool-config";
import { getMetadataBase } from "@/lib/seo";

interface AliasPageParams {
  locale: string;
}

const ALIAS_SLUG = "sha384"; // Define the alias slug for this page

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const aliasEntry = TOOL_ALIAS_LOOKUP[ALIAS_SLUG];

  if (!aliasEntry) {
    return {}; // Or a default metadata object
  }

  const { toolId, alias } = aliasEntry;
  const config = TOOL_DEFINITIONS[toolId];
  const t = await getTranslations({ locale });

  const title = t(alias.titleKey ?? config.titleKey);
  const description = t(alias.descriptionKey ?? config.descriptionKey);
  const badge = t(alias.badgeKey ?? config.badgeKey);
  const appTitle = t("app.title");
  const featureKeywords = config.features
    .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
    .filter(Boolean);

  const metadataBase = getMetadataBase();
  const siteUrl = metadataBase.origin;

  return {
    metadataBase,
    title: `${title} | ${appTitle}`,
    description,
    keywords: Array.from(new Set([title, appTitle, ALIAS_SLUG, ...featureKeywords])),
    alternates: {
      canonical: `${siteUrl}/${locale}/${ALIAS_SLUG}`,
    },
    openGraph: {
      title: `${title} | ${appTitle}`,
      description,
      locale,
      type: "website",
      url: `${siteUrl}/${locale}/${ALIAS_SLUG}`,
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

export default async function AliasPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const aliasEntry = TOOL_ALIAS_LOOKUP[ALIAS_SLUG];

  if (!aliasEntry) {
    notFound();
  }

  return (
    <ToolDetail
      toolId={aliasEntry.toolId}
      locale={locale}
      alias={aliasEntry.alias}
    />
  );
}
