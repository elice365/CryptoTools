import type { Metadata } from "next";

import { EncodingTools } from "@/components/crypto/encoding-tools";
import { locales, type Locale } from "@/i18n";
import { buildToolMetadata } from "@/lib/tool-seo";
import type { ToolId } from "@/lib/tool-config";

const TOOL_ID: ToolId = "encoding";

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

export default function EncodingPage() {
  return <EncodingTools />;
}
