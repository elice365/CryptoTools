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
  const aliasInfo = TOOL_ALIAS_LOOKUP[tool];
  const t = await getTranslations({ locale });
  const title = t(aliasInfo?.alias.titleKey ?? config.titleKey);
  const description = t(aliasInfo?.alias.descriptionKey ?? config.descriptionKey);
  const badge = t(aliasInfo?.alias.badgeKey ?? config.badgeKey);
  const appTitle = t("app.title");
  const featureKeywords = config.features
    .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
    .filter(Boolean);

  return {
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
    TOOL_IDS.flatMap((toolId) => {
      const config = TOOL_DEFINITIONS[toolId];
      const slugs = [config.path, ...(config.aliases?.map((alias) => alias.slug) ?? [])];
      return slugs.map((slug) => ({
        locale,
        tool: slug,
      }));
    }),
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

  const aliasEntry = TOOL_ALIAS_LOOKUP[tool];

  return (
    <ToolDetail
      toolId={baseToolId as ToolId}
      locale={locale}
      alias={aliasEntry?.alias}
    />
  );
}
