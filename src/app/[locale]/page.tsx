import { CryptoDashboard } from "@/components/crypto/dashboard";
import {
  generateWebAppStructuredData,
  generateOrganizationStructuredData,
  generateWebsiteStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
} from "@/lib/structured-data";
import type { Locale } from "@/i18n";

interface LocaleHomePageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: LocaleHomePageProps) {
  const { locale } = await params;

  // Generate all structured data for homepage
  const webAppStructuredData = generateWebAppStructuredData(locale as Locale);
  const organizationStructuredData = generateOrganizationStructuredData();
  const websiteStructuredData = generateWebsiteStructuredData(locale as Locale);
  const breadcrumbStructuredData = generateBreadcrumbStructuredData(locale as Locale);
  const faqStructuredData = generateFAQStructuredData(locale as Locale);

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />

      <CryptoDashboard />
    </>
  );
}
