import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSiteUrl } from "@/lib/seo";
import { TOOL_DEFINITIONS, type ToolId } from "@/lib/tool-config";

export async function buildToolMetadata(
  locale: string,
  toolId: ToolId,
): Promise<Metadata> {
  const config = TOOL_DEFINITIONS[toolId];
  const t = await getTranslations({ locale });

  const title = t(config.titleKey);
  const description = t(config.descriptionKey);
  const badge = t(config.badgeKey);
  const appTitle = t("app.title");
  const canonicalPath = `/${locale}/${config.path}`;
  const absoluteUrl = `${getSiteUrl()}${canonicalPath}`;
  const featureKeywords = config.features
    .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
    .filter(Boolean);

  const keywords = Array.from(new Set([title, appTitle, badge, ...featureKeywords]));

  return {
    title: `${title} | ${appTitle}`,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | ${appTitle}`,
      description,
      locale,
      type: "website",
      url: absoluteUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${appTitle}`,
      description,
      creator: badge,
    },
  };
}
