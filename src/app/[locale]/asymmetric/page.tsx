import type { Metadata } from "next";

import { AsymmetricTool } from "@/components/crypto/asymmetric-tool";
import { locales, type Locale } from "@/i18n";
import { buildToolMetadata } from "@/lib/tool-seo";
import type { ToolId } from "@/lib/tool-config";

const TOOL_ID: ToolId = "asymmetric";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildToolMetadata(locale, TOOL_ID);
}

export default function AsymmetricPage() {
  return <AsymmetricTool />;
}
