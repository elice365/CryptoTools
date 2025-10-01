import { CryptoError, cryptoUtils } from "@/lib/utils";

const BASE64_REGEX =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(?:==)?|[A-Za-z0-9+/]{3}=?)?$/;

export function stringToBase64(input: string): string {
  const bytes = cryptoUtils.stringToUint8Array(input);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function base64ToString(base64: string): string {
  if (!BASE64_REGEX.test(base64.trim())) {
    throw new CryptoError("Invalid Base64 string", "INVALID_BASE64");
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return cryptoUtils.uint8ArrayToString(bytes);
}

export async function fileToBase64(
  file: File,
): Promise<{ base64: string; mime: string }> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return {
    base64: btoa(binary),
    mime: file.type || "application/octet-stream",
  };
}

export function base64ToBlob(
  base64: string,
  mime = "application/octet-stream",
): Blob {
  if (!BASE64_REGEX.test(base64.trim())) {
    throw new CryptoError("Invalid Base64 string", "INVALID_BASE64");
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

export function urlEncode(input: string): string {
  return encodeURIComponent(input);
}

export function urlDecode(input: string): string {
  try {
    return decodeURIComponent(input);
  } catch (error) {
    throw new CryptoError(
      "Invalid URL encoded string",
      "INVALID_URL_ENCODE",
      error as Error,
    );
  }
}

export function isLikelyBase64(data: string): boolean {
  return BASE64_REGEX.test(data.trim());
}
