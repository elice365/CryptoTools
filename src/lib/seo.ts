const DEFAULT_SITE_URL = "https://crypto.elice.pro";

function normalizeUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (envUrl && envUrl.trim().length > 0) {
    return normalizeUrl(envUrl.trim());
  }
  return DEFAULT_SITE_URL;
}

export function getMetadataBase(): URL {
  return new URL(getSiteUrl());
}
