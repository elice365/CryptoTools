import {
  ChaCha20Poly1305,
  NONCE_LENGTH as CHACHA_NONCE_LENGTH,
} from "@stablelib/chacha20poly1305";
import {
  KeyPair,
  PUBLIC_KEY_LENGTH,
  SECRET_KEY_LENGTH,
  generateKeyPair,
  sharedKey,
} from "@stablelib/x25519";
import { sha256 } from "@noble/hashes/sha2.js";

import type { KeyEncoding } from "@/lib/crypto/shared";
import { decodeToBytes, encodeBytes, randomBytes } from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";

export interface ExportedEccKeyPair {
  publicKey: string;
  privateKey: string;
  encoding: "base64" | "hex";
}

export interface EciesCipher {
  cipherText: string;
  nonce: string;
  ephemeralPublicKey: string;
  encoding: "base64" | "hex";
}

const DEFAULT_ENCODING: "base64" | "hex" = "base64";

function deriveSymmetricKey(sharedSecret: Uint8Array): Uint8Array {
  return sha256(sharedSecret);
}

export function generateEccKeyPair(): KeyPair {
  return generateKeyPair();
}

export function exportEccKeyPair(
  keyPair: KeyPair,
  encoding: "base64" | "hex" = DEFAULT_ENCODING,
): ExportedEccKeyPair {
  return {
    publicKey: encodeBytes(keyPair.publicKey, encoding),
    privateKey: encodeBytes(keyPair.secretKey, encoding),
    encoding,
  };
}

export function importPublicKey(
  key: string,
  encoding: KeyEncoding = "base64",
): Uint8Array {
  const bytes = decodeToBytes(key, encoding);
  if (bytes.length !== PUBLIC_KEY_LENGTH) {
    throw new CryptoError("Invalid public key length", "ECC_PUBLIC_KEY_LENGTH");
  }
  return bytes;
}

export function importPrivateKey(
  key: string,
  encoding: KeyEncoding = "base64",
): Uint8Array {
  const bytes = decodeToBytes(key, encoding);
  if (bytes.length !== SECRET_KEY_LENGTH) {
    throw new CryptoError(
      "Invalid private key length",
      "ECC_PRIVATE_KEY_LENGTH",
    );
  }
  return bytes;
}

export function eccEncrypt(
  plaintext: string,
  recipientPublicKey: string,
  options?: {
    associatedData?: string;
    encoding?: "base64" | "hex";
    nonce?: string;
    nonceEncoding?: KeyEncoding;
    publicKeyEncoding?: KeyEncoding;
  },
): { payload: EciesCipher; ephemeralKeys: KeyPair } {
  const encoding = options?.encoding ?? DEFAULT_ENCODING;
  const recipientKeyBytes = importPublicKey(
    recipientPublicKey,
    options?.publicKeyEncoding ?? (encoding === "hex" ? "hex" : "base64"),
  );

  const ephemeralKeys = generateKeyPair();
  const sharedSecret = sharedKey(ephemeralKeys.secretKey, recipientKeyBytes);
  const symmetricKey = deriveSymmetricKey(sharedSecret);
  const aead = new ChaCha20Poly1305(symmetricKey);

  let nonceBytes: Uint8Array;
  let nonceString: string;
  if (options?.nonce) {
    nonceBytes = decodeToBytes(
      options.nonce,
      options.nonceEncoding ?? (encoding === "hex" ? "hex" : "base64"),
    );
    if (nonceBytes.length !== CHACHA_NONCE_LENGTH) {
      throw new CryptoError("Nonce must be 12 bytes", "ECC_NONCE_INVALID");
    }
    nonceString = encodeBytes(nonceBytes, encoding);
  } else {
    nonceBytes = randomBytes(CHACHA_NONCE_LENGTH);
    nonceString = encodeBytes(nonceBytes, encoding);
  }

  const plaintextBytes = cryptoUtils.stringToUint8Array(plaintext);
  const associated = options?.associatedData
    ? cryptoUtils.stringToUint8Array(options.associatedData)
    : undefined;
  const sealed = aead.seal(nonceBytes, plaintextBytes, associated);

  return {
    payload: {
      cipherText: encodeBytes(sealed, encoding),
      nonce: nonceString,
      ephemeralPublicKey: encodeBytes(ephemeralKeys.publicKey, encoding),
      encoding,
    },
    ephemeralKeys,
  };
}

export function eccDecrypt(
  payload: EciesCipher,
  privateKey: string,
  options?: {
    encoding?: "base64" | "hex";
    associatedData?: string;
    privateKeyEncoding?: KeyEncoding;
  },
): string {
  const encoding = options?.encoding ?? payload.encoding ?? DEFAULT_ENCODING;
  const secretKey = importPrivateKey(
    privateKey,
    options?.privateKeyEncoding ?? (encoding === "hex" ? "hex" : "base64"),
  );
  const ephemeralPublic = decodeToBytes(
    payload.ephemeralPublicKey,
    encoding === "hex" ? "hex" : "base64",
  );
  const nonce = decodeToBytes(
    payload.nonce,
    encoding === "hex" ? "hex" : "base64",
  );
  const cipherBytes = decodeToBytes(
    payload.cipherText,
    encoding === "hex" ? "hex" : "base64",
  );

  if (nonce.length !== CHACHA_NONCE_LENGTH) {
    throw new CryptoError("Nonce must be 12 bytes", "ECC_NONCE_INVALID");
  }

  const sharedSecret = sharedKey(secretKey, ephemeralPublic);
  const symmetricKey = deriveSymmetricKey(sharedSecret);
  const aead = new ChaCha20Poly1305(symmetricKey);
  const associated = options?.associatedData
    ? cryptoUtils.stringToUint8Array(options.associatedData)
    : undefined;

  const opened = aead.open(nonce, cipherBytes, associated);
  if (!opened) {
    throw new CryptoError("ECC decryption failed", "ECC_DECRYPT_FAILED");
  }
  return cryptoUtils.uint8ArrayToString(opened);
}
