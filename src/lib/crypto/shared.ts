import { cryptoUtils } from "@/lib/utils";

const HEX_REGEX = /^[0-9a-fA-F]+$/;
const BASE64_REGEX =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(?:==)?|[A-Za-z0-9+/]{3}=?)?$/;

export type KeyEncoding = "utf8" | "hex" | "base64";

export function detectEncoding(value: string): KeyEncoding {
  const trimmed = value.trim();
  if (HEX_REGEX.test(trimmed) && trimmed.length % 2 === 0) {
    return "hex";
  }
  if (BASE64_REGEX.test(trimmed)) {
    return "base64";
  }
  return "utf8";
}

export function decodeToBytes(
  value: string,
  encoding?: KeyEncoding,
): Uint8Array {
  const resolvedEncoding = encoding ?? detectEncoding(value);
  if (resolvedEncoding === "hex") {
    return cryptoUtils.hexToBytes(value);
  }
  if (resolvedEncoding === "base64") {
    return base64ToUint8(value);
  }
  return cryptoUtils.stringToUint8Array(value);
}

export function encodeBytes(bytes: Uint8Array, encoding: KeyEncoding): string {
  if (encoding === "hex") {
    return cryptoUtils.bytesToHex(bytes);
  }
  if (encoding === "base64") {
    let binary = "";
    bytes.forEach((b) => {
      binary += String.fromCharCode(b);
    });
    return btoa(binary);
  }
  return cryptoUtils.uint8ArrayToString(bytes);
}

export function adjustKeyLength(
  bytes: Uint8Array,
  expectedLength: number,
): Uint8Array {
  if (bytes.length === expectedLength) {
    return bytes;
  }
  if (bytes.length > expectedLength) {
    return bytes.slice(0, expectedLength);
  }
  const padded = new Uint8Array(expectedLength);
  padded.set(bytes);
  return padded;
}

export function randomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

export function bufferFromBytes(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}

export function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function base64ToUint8(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
