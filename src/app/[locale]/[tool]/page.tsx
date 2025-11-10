import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";

import { ToolDetail } from "@/components/crypto/tool-detail";
import { locales, type Locale } from "@/i18n";
import {
  TOOL_ALIAS_LOOKUP,
  TOOL_DEFINITIONS,
  TOOL_IDS,
  TOOL_ROUTE_LOOKUP,
  type ToolId,
} from "@/lib/tool-config";
import { getMetadataBase, getSiteUrl } from "@/lib/seo";
import { getSEOKeywords } from "@/lib/seo-keywords";
import {
  generateToolStructuredData,
  generateHowToStructuredData,
} from "@/lib/structured-data";

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
  const t = await getTranslations({ locale });
  const title = t(config.titleKey);
  const description = t(config.descriptionKey);
  const badge = t(config.badgeKey);
  const appTitle = t("app.title");
  const featureKeywords = config.features
    .map((feature) => (feature.key ? t(feature.key) : feature.raw ?? ""))
    .filter(Boolean);

  const metadataBase = getMetadataBase();
  const siteUrl = getSiteUrl();

  // Get SEO keywords for this tool and locale
  const seoKeywords = getSEOKeywords(routeToolId, locale as Locale);

  // Combine all keywords
  const allKeywords = Array.from(
    new Set([title, appTitle, tool, badge, ...featureKeywords, ...seoKeywords])
  );

  // Generate structured data
  const toolStructuredData = generateToolStructuredData(
    routeToolId,
    locale as Locale,
    title,
    description
  );

  const howToData = generateHowToStructuredData(
    routeToolId,
    locale as Locale,
    title
  );

  // Combine structured data
  const structuredDataArray: any[] = [toolStructuredData];
  if (howToData) {
    structuredDataArray.push(howToData);
  }

  // Generate alternate language links
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = `${siteUrl}/${loc}/${tool}`;
  }

  return {
    metadataBase,
    title: `${title} | ${appTitle}`,
    description,
    keywords: allKeywords,
    authors: [{ name: "CryptoTools" }],
    creator: "CryptoTools",
    publisher: "CryptoTools",
    alternates: {
      canonical: `${siteUrl}/${locale}/${tool}`,
      languages,
    },
    openGraph: {
      title: `${title} | ${appTitle}`,
      description,
      locale: locale,
      type: "website",
      url: `${siteUrl}/${locale}/${tool}`,
      siteName: "CryptoTools",
      images: [
        {
          url: `${siteUrl}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${title} - CryptoTools`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${appTitle}`,
      description,
      creator: "@CryptoTools",
      images: [`${siteUrl}/opengraph-image`],
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
    other: {
      "application-name": "CryptoTools",
      "structured-data": JSON.stringify(structuredDataArray),
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

  // Generate structured data for SEO
  const config = TOOL_DEFINITIONS[baseToolId];
  const t = await getTranslations({ locale });
  const title = t(config.titleKey);
  const description = t(config.descriptionKey);

  const toolStructuredData = generateToolStructuredData(
    baseToolId,
    locale as Locale,
    title,
    description
  );

  const howToData = generateHowToStructuredData(
    baseToolId,
    locale as Locale,
    title
  );

  // Import breadcrumb function
  const { generateBreadcrumbStructuredData } = await import("@/lib/structured-data");
  const breadcrumbData = generateBreadcrumbStructuredData(
    locale as Locale,
    baseToolId,
    title
  );

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(toolStructuredData) }}
      />
      {howToData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToData) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <ToolDetail toolId={baseToolId as ToolId} locale={locale} />
    </>
  );
}
