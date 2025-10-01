import { chacha20, xchacha20 } from "@noble/ciphers/chacha.js";
import { salsa20, xsalsa20 } from "@noble/ciphers/salsa.js";

import type { KeyEncoding } from "@/lib/crypto/shared";
import {
  adjustKeyLength,
  decodeToBytes,
  encodeBytes,
  randomBytes,
} from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";

export interface StreamCipherOptions {
  key: string;
  keyEncoding?: KeyEncoding;
  nonce?: string;
  nonceEncoding?: KeyEncoding;
  outputEncoding?: "hex" | "base64";
  counter?: number;
  extendedNonce?: boolean;
}

export interface StreamCipherResult {
  cipherText: string;
  nonce: string;
  encoding: "hex" | "base64";
}

const DEFAULT_OUTPUT: "hex" | "base64" = "base64";

function normalizeKey(key: string, encoding?: KeyEncoding): Uint8Array {
  const keyBytes = decodeToBytes(key, encoding);
  return adjustKeyLength(keyBytes, 32);
}

function normalizeNonce(
  length: number,
  provided?: string,
  encoding?: KeyEncoding,
  output: "hex" | "base64" = DEFAULT_OUTPUT,
): { bytes: Uint8Array; encoded: string } {
  if (provided) {
    const bytes = adjustKeyLength(decodeToBytes(provided, encoding), length);
    return {
      bytes,
      encoded: encodeBytes(bytes, output === "hex" ? "hex" : "base64"),
    };
  }
  const bytes = randomBytes(length);
  return {
    bytes,
    encoded:
      output === "hex"
        ? cryptoUtils.bytesToHex(bytes)
        : encodeBytes(bytes, "base64"),
  };
}

function runStream(
  algorithm: "chacha" | "salsa",
  data: Uint8Array,
  key: Uint8Array,
  nonce: Uint8Array,
  counter = 0,
): Uint8Array {
  const output = new Uint8Array(data.length);
  if (algorithm === "chacha") {
    const cipher = nonce.length === 24 ? xchacha20 : chacha20;
    cipher(key, nonce, data, output, counter);
  } else {
    const cipher = nonce.length === 24 ? xsalsa20 : salsa20;
    cipher(key, nonce, data, output, counter);
  }
  return output;
}

function encodeResult(
  bytes: Uint8Array,
  encoding: "hex" | "base64" = DEFAULT_OUTPUT,
): string {
  return encodeBytes(bytes, encoding === "hex" ? "hex" : "base64");
}

export function chacha20Encrypt(
  plaintext: string,
  options: StreamCipherOptions,
): StreamCipherResult {
  const encoding = options.outputEncoding ?? DEFAULT_OUTPUT;
  const key = normalizeKey(options.key, options.keyEncoding);
  const nonceInfo = normalizeNonce(
    options.extendedNonce ? 24 : 12,
    options.nonce,
    options.nonceEncoding,
    encoding,
  );
  const data = cryptoUtils.stringToUint8Array(plaintext);
  const cipherBytes = runStream(
    "chacha",
    data,
    key,
    nonceInfo.bytes,
    options.counter,
  );
  return {
    cipherText: encodeResult(cipherBytes, encoding),
    nonce: nonceInfo.encoded,
    encoding,
  };
}

export function chacha20Decrypt(
  cipherText: string,
  options: StreamCipherOptions,
): string {
  const encoding = options.outputEncoding ?? DEFAULT_OUTPUT;
  if (!options.nonce) {
    throw new CryptoError(
      "Nonce required for ChaCha20 decryption",
      "CHACHA20_NONCE_REQUIRED",
    );
  }
  const key = normalizeKey(options.key, options.keyEncoding);
  const nonce = adjustKeyLength(
    decodeToBytes(options.nonce, options.nonceEncoding),
    options.extendedNonce ? 24 : 12,
  );
  const cipherBytes = decodeToBytes(
    cipherText,
    encoding === "hex" ? "hex" : "base64",
  );
  const plainBytes = runStream(
    "chacha",
    cipherBytes,
    key,
    nonce,
    options.counter,
  );
  return cryptoUtils.uint8ArrayToString(plainBytes);
}

export function salsa20Encrypt(
  plaintext: string,
  options: StreamCipherOptions,
): StreamCipherResult {
  const encoding = options.outputEncoding ?? DEFAULT_OUTPUT;
  const key = normalizeKey(options.key, options.keyEncoding);
  const nonceInfo = normalizeNonce(
    options.extendedNonce ? 24 : 8,
    options.nonce,
    options.nonceEncoding,
    encoding,
  );
  const data = cryptoUtils.stringToUint8Array(plaintext);
  const cipherBytes = runStream(
    "salsa",
    data,
    key,
    nonceInfo.bytes,
    options.counter,
  );
  return {
    cipherText: encodeResult(cipherBytes, encoding),
    nonce: nonceInfo.encoded,
    encoding,
  };
}

export function salsa20Decrypt(
  cipherText: string,
  options: StreamCipherOptions,
): string {
  const encoding = options.outputEncoding ?? DEFAULT_OUTPUT;
  if (!options.nonce) {
    throw new CryptoError(
      "Nonce required for Salsa20 decryption",
      "SALSA20_NONCE_REQUIRED",
    );
  }
  const key = normalizeKey(options.key, options.keyEncoding);
  const nonce = adjustKeyLength(
    decodeToBytes(options.nonce, options.nonceEncoding),
    options.extendedNonce ? 24 : 8,
  );
  const cipherBytes = decodeToBytes(
    cipherText,
    encoding === "hex" ? "hex" : "base64",
  );
  const plainBytes = runStream(
    "salsa",
    cipherBytes,
    key,
    nonce,
    options.counter,
  );
  return cryptoUtils.uint8ArrayToString(plainBytes);
}
