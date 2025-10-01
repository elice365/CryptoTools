import { ElGamal, genElGamalParams } from "micro-rsa-dsa-dh/elgamal.js";

import type { KeyEncoding } from "@/lib/crypto/shared";
import { decodeToBytes, encodeBytes } from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";

export interface ElGamalParameters {
  p: bigint;
  g: bigint;
}

export interface ElGamalKeyPair {
  privateKey: bigint;
  publicKey: bigint;
  params: ElGamalParameters;
}

export interface ElGamalCipher {
  ct1: string;
  ct2: string;
  encoding: "hex" | "base64";
}

const DEFAULT_ENCODING: "hex" | "base64" = "hex";

function bigintToHex(value: bigint): string {
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }
  return hex;
}

function hexToBigint(hex: string): bigint {
  if (!hex) {
    return 0n;
  }
  return BigInt(`0x${hex}`);
}

function stringToBigint(message: string, modulus: bigint): bigint {
  const bytes = cryptoUtils.stringToUint8Array(message);
  const hex = cryptoUtils.bytesToHex(bytes);
  if (!hex) {
    return 0n;
  }
  const value = BigInt(`0x${hex}`);
  // Ensure value < modulus
  return value % modulus;
}

function bigintToString(value: bigint): string {
  const hex = bigintToHex(value);
  const bytes = cryptoUtils.hexToBytes(hex);
  return cryptoUtils.uint8ArrayToString(bytes);
}

export function generateElGamalParameters(bits = 2048): ElGamalParameters {
  return genElGamalParams(bits);
}

export function generateElGamalKeyPair(
  params: ElGamalParameters,
): ElGamalKeyPair {
  const elgamal = ElGamal(params);
  const privateKey = elgamal.randomPrivateKey();
  const publicKey = elgamal.getPublicKey(privateKey);
  return {
    privateKey,
    publicKey,
    params,
  };
}

export function exportElGamalKey(
  key: bigint,
  encoding: "hex" | "base64" = DEFAULT_ENCODING,
): string {
  const hex = bigintToHex(key);
  if (encoding === "hex") {
    return hex;
  }
  const bytes = cryptoUtils.hexToBytes(hex);
  return encodeBytes(bytes, "base64");
}

export function importElGamalKey(
  value: string,
  encoding: KeyEncoding = "hex",
): bigint {
  if (encoding === "hex") {
    return hexToBigint(value);
  }
  const bytes = decodeToBytes(value, encoding);
  return hexToBigint(cryptoUtils.bytesToHex(bytes));
}

export function elgamalEncrypt(
  params: ElGamalParameters,
  publicKey: bigint,
  message: string,
  encoding: "hex" | "base64" = DEFAULT_ENCODING,
): ElGamalCipher {
  const elgamal = ElGamal(params);
  const numericMessage = stringToBigint(message, params.p);
  if (numericMessage === 0n) {
    throw new CryptoError(
      "Message too short or empty",
      "ELGAMAL_MESSAGE_EMPTY",
    );
  }
  const ciphertext = elgamal.encrypt(publicKey, numericMessage);
  const ct1Hex = bigintToHex(ciphertext.ct1);
  const ct2Hex = bigintToHex(ciphertext.ct2);

  if (encoding === "hex") {
    return { ct1: ct1Hex, ct2: ct2Hex, encoding };
  }
  const ct1Bytes = cryptoUtils.hexToBytes(ct1Hex);
  const ct2Bytes = cryptoUtils.hexToBytes(ct2Hex);
  return {
    ct1: encodeBytes(ct1Bytes, "base64"),
    ct2: encodeBytes(ct2Bytes, "base64"),
    encoding,
  };
}

export function elgamalDecrypt(
  params: ElGamalParameters,
  privateKey: bigint,
  cipher: ElGamalCipher,
): string {
  const elgamal = ElGamal(params);
  const { encoding } = cipher;
  const ct1 = importElGamalKey(
    cipher.ct1,
    encoding === "hex" ? "hex" : "base64",
  );
  const ct2 = importElGamalKey(
    cipher.ct2,
    encoding === "hex" ? "hex" : "base64",
  );

  const messageBigInt = elgamal.decrypt(privateKey, { ct1, ct2 });
  return bigintToString(messageBigInt);
}
