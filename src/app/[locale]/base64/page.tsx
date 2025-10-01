import type { Metadata } from "next";

import { Base64Tool } from "@/components/crypto/base64-tool";
import { locales, type Locale } from "@/i18n";
import { buildToolMetadata } from "@/lib/tool-seo";
import type { ToolId } from "@/lib/tool-config";

const TOOL_ID: ToolId = "base64";

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

export default function Base64Page() {
  return <Base64Tool />;
}
