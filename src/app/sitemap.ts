import type { MetadataRoute } from "next";

import { locales } from "@/i18n";
import { getSiteUrl } from "@/lib/seo";
import { TOOL_DEFINITIONS, TOOL_IDS } from "@/lib/tool-config";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  const localeEntries = locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const toolEntries = locales.flatMap((locale) =>
    TOOL_IDS.flatMap((toolId) => {
      const config = TOOL_DEFINITIONS[toolId];
      const slugs = [config.path, ...(config.aliases?.map((alias) => alias.slug) ?? [])];
      return slugs.map((slug) => ({
        url: `${siteUrl}/${locale}/${slug}`,
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: slug === config.path ? 0.7 : 0.6,
      }));
    }),
  );

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...localeEntries,
    ...toolEntries,
  ];
}
