import { cryptoUtils } from "@/lib/utils";
import { blake2b } from "@noble/hashes/blake2.js";
import { blake2s } from "@noble/hashes/blake2.js";
import { sha1 } from "@noble/hashes/legacy.js";
import { sha224, sha256, sha384, sha512 } from "@noble/hashes/sha2.js";
import { sha3_224, sha3_256, sha3_384, sha3_512 } from "@noble/hashes/sha3.js";

export type HashAlgorithm =
  | "sha1"
  | "sha224"
  | "sha256"
  | "sha384"
  | "sha512"
  | "sha3-224"
  | "sha3-256"
  | "sha3-384"
  | "sha3-512"
  | "blake2b"
  | "blake2s";

export type HashEncoding = "hex" | "base64";

const hashers: Record<HashAlgorithm, (data: Uint8Array) => Uint8Array> = {
  sha1: (data) => sha1(data),
  sha224: (data) => sha224(data),
  sha256: (data) => sha256(data),
  sha384: (data) => sha384(data),
  sha512: (data) => sha512(data),
  "sha3-224": (data) => sha3_224(data),
  "sha3-256": (data) => sha3_256(data),
  "sha3-384": (data) => sha3_384(data),
  "sha3-512": (data) => sha3_512(data),
  blake2b: (data) => blake2b(data),
  blake2s: (data) => blake2s(data),
};

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

export function hashString(
  input: string,
  algorithm: HashAlgorithm,
  encoding: HashEncoding = "hex",
): string {
  const hasher = hashers[algorithm];
  const data = cryptoUtils.stringToUint8Array(input);
  const digest = hasher(data);

  if (encoding === "base64") {
    return bytesToBase64(digest);
  }
  return cryptoUtils.bytesToHex(digest);
}

export async function hashFile(
  file: File,
  algorithm: HashAlgorithm,
  encoding: HashEncoding = "hex",
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hasher = hashers[algorithm];
  const digest = hasher(new Uint8Array(buffer));

  if (encoding === "base64") {
    return bytesToBase64(digest);
  }
  return cryptoUtils.bytesToHex(digest);
}
