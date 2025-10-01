import { CryptoError, cryptoUtils } from "@/lib/utils";
import { base64ToUint8, uint8ToBase64 } from "@/lib/crypto/shared";

export interface RsaKeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

export interface ExportedRsaKeyPair {
  publicKey: string;
  privateKey: string;
}

const PEM_PUBLIC_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_PUBLIC_FOOTER = "-----END PUBLIC KEY-----";
const PEM_PRIVATE_HEADER = "-----BEGIN PRIVATE KEY-----";
const PEM_PRIVATE_FOOTER = "-----END PRIVATE KEY-----";

function cleanPem(pem: string): string {
  return pem
    .replace(PEM_PUBLIC_HEADER, "")
    .replace(PEM_PUBLIC_FOOTER, "")
    .replace(PEM_PRIVATE_HEADER, "")
    .replace(PEM_PRIVATE_FOOTER, "")
    .replace(/\s+/g, "")
    .trim();
}

export async function generateRsaKeyPair(
  modulusLength: 2048 | 3072 | 4096 = 2048,
  hash: "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256",
): Promise<RsaKeyPair> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
      hash,
    },
    true,
    ["encrypt", "decrypt"],
  );

  if (!keyPair.privateKey || !keyPair.publicKey) {
    throw new CryptoError("RSA key generation failed", "RSA_KEYGEN_FAILED");
  }

  return {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
  };
}

export async function exportRsaKeyPair(
  keys: RsaKeyPair,
): Promise<ExportedRsaKeyPair> {
  const [publicKeyBuffer, privateKeyBuffer] = await Promise.all([
    crypto.subtle.exportKey("spki", keys.publicKey),
    crypto.subtle.exportKey("pkcs8", keys.privateKey),
  ]);

  const publicBase64 = uint8ToBase64(new Uint8Array(publicKeyBuffer));
  const privateBase64 = uint8ToBase64(new Uint8Array(privateKeyBuffer));

  return {
    publicKey: `${PEM_PUBLIC_HEADER}\n${publicBase64}\n${PEM_PUBLIC_FOOTER}`,
    privateKey: `${PEM_PRIVATE_HEADER}\n${privateBase64}\n${PEM_PRIVATE_FOOTER}`,
  };
}

export async function importRsaPublicKey(
  pem: string,
  hash: "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256",
): Promise<CryptoKey> {
  const base64 = cleanPem(pem);
  const buffer = base64ToUint8(base64);
  return crypto.subtle.importKey(
    "spki",
    buffer,
    {
      name: "RSA-OAEP",
      hash,
    },
    true,
    ["encrypt"],
  );
}

export async function importRsaPrivateKey(
  pem: string,
  hash: "SHA-256" | "SHA-384" | "SHA-512" = "SHA-256",
): Promise<CryptoKey> {
  const base64 = cleanPem(pem);
  const buffer = base64ToUint8(base64);
  return crypto.subtle.importKey(
    "pkcs8",
    buffer,
    {
      name: "RSA-OAEP",
      hash,
    },
    true,
    ["decrypt"],
  );
}

export async function rsaEncrypt(
  plaintext: string,
  publicKey: CryptoKey,
): Promise<string> {
  const data = cryptoUtils.stringToUint8Array(plaintext);
  const encrypted = await crypto.subtle.encrypt(
    {
      name: "RSA-OAEP",
    },
    publicKey,
    data,
  );
  return uint8ToBase64(new Uint8Array(encrypted));
}

export async function rsaDecrypt(
  cipherText: string,
  privateKey: CryptoKey,
): Promise<string> {
  const data = base64ToUint8(cipherText);
  try {
    const decrypted = await crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      data,
    );
    return cryptoUtils.uint8ArrayToString(new Uint8Array(decrypted));
  } catch (error) {
    throw new CryptoError(
      "RSA decryption failed",
      "RSA_DECRYPT_FAILED",
      error as Error,
    );
  }
}
