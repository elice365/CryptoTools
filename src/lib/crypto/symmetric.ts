import type { KeyEncoding } from "@/lib/crypto/shared";
import {
  adjustKeyLength,
  base64ToUint8,
  decodeToBytes,
  detectEncoding,
  randomBytes,
  uint8ToBase64,
} from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";

let cryptoJsPromise: Promise<typeof import("crypto-js")> | null = null;

async function loadCryptoJS() {
  if (!cryptoJsPromise) {
    cryptoJsPromise = import("crypto-js");
    await Promise.all([
      import("crypto-js/mode-ctr"),
      import("crypto-js/mode-cfb"),
      import("crypto-js/mode-ecb"),
      import("crypto-js/pad-iso10126"),
    ]);
  }
  return cryptoJsPromise;
}

function parseWordArray(
  CryptoJS: typeof import("crypto-js"),
  value: string,
  encoding?: KeyEncoding,
) {
  const resolvedEncoding = encoding ?? detectEncoding(value);
  if (resolvedEncoding === "hex") {
    return CryptoJS.enc.Hex.parse(value);
  }
  if (resolvedEncoding === "base64") {
    return CryptoJS.enc.Base64.parse(value);
  }
  return CryptoJS.enc.Utf8.parse(value);
}

function outputFromWordArray(
  CryptoJS: typeof import("crypto-js"),
  wordArray: any,
  encoding: "hex" | "base64",
) {
  if (encoding === "hex") {
    return wordArray.toString(CryptoJS.enc.Hex);
  }
  return wordArray.toString(CryptoJS.enc.Base64);
}

function parseCiphertext(
  CryptoJS: typeof import("crypto-js"),
  cipherText: string,
  encoding: "hex" | "base64",
) {
  if (encoding === "hex") {
    return CryptoJS.enc.Hex.parse(cipherText);
  }
  return CryptoJS.enc.Base64.parse(cipherText);
}

export type AesMode = "ecb" | "cbc" | "cfb" | "ctr" | "gcm";
export type PaddingScheme = "pkcs7" | "ansix923" | "iso10126" | "nopadding";

export interface AesOptions {
  key: string;
  keyEncoding?: KeyEncoding;
  iv?: string;
  ivEncoding?: KeyEncoding;
  mode: AesMode;
  padding?: PaddingScheme;
  keyLength?: 128 | 192 | 256;
  outputEncoding?: "hex" | "base64";
  aad?: string;
}

export interface SymmetricResult {
  cipherText: string;
  iv?: string;
  nonce?: string;
  authTag?: string;
  encoding: "hex" | "base64";
}

function resolveAesKeyBytes(options: AesOptions): Uint8Array {
  const keyBytes = decodeToBytes(options.key, options.keyEncoding);
  const length = options.keyLength
    ? options.keyLength / 8
    : keyBytes.length >= 32
      ? 32
      : keyBytes.length >= 24
        ? 24
        : 16;
  return adjustKeyLength(keyBytes, length as number);
}

function resolveIvBytes(
  iv?: string,
  encoding?: KeyEncoding,
  expectedLength = 16,
): Uint8Array {
  if (!iv) {
    return randomBytes(expectedLength);
  }
  const bytes = decodeToBytes(iv, encoding);
  return adjustKeyLength(bytes, expectedLength);
}

function resolvePaddingScheme(
  CryptoJS: typeof import("crypto-js"),
  padding?: PaddingScheme,
) {
  switch (padding) {
    case "ansix923":
      return CryptoJS.pad.AnsiX923;
    case "iso10126":
      return CryptoJS.pad.Iso10126;
    case "nopadding":
      return CryptoJS.pad.NoPadding;
    case "pkcs7":
    default:
      return CryptoJS.pad.Pkcs7;
  }
}

function validateModeAndPadding(mode: AesMode, padding?: PaddingScheme): void {
  // CTR and GCM modes are stream modes and don't require padding
  if (
    (mode === "ctr" || mode === "gcm") &&
    padding &&
    padding !== "nopadding"
  ) {
    throw new CryptoError(
      `${mode.toUpperCase()} mode does not require padding. Use 'nopadding' or omit padding parameter.`,
      "INVALID_MODE_PADDING_COMBINATION",
    );
  }

  // CFB mode in stream mode also doesn't require padding
  if (
    mode === "cfb" &&
    padding &&
    padding !== "nopadding" &&
    padding !== "pkcs7"
  ) {
    throw new CryptoError(
      "CFB mode typically uses no padding or PKCS7 padding only",
      "INVALID_CFB_PADDING",
    );
  }
}

function validateIvLength(mode: AesMode, iv?: string): void {
  if (!iv) return;

  const ivBytes = base64ToUint8(iv);
  const expectedLength = mode === "gcm" ? 12 : 16;

  if (ivBytes.length !== expectedLength) {
    throw new CryptoError(
      `${mode.toUpperCase()} mode requires ${expectedLength}-byte IV, got ${ivBytes.length} bytes`,
      "INVALID_IV_LENGTH",
    );
  }
}

function addSecurityWarnings(mode: AesMode, options: AesOptions): void {
  // ECB mode security warning
  if (mode === "ecb") {
    console.warn(
      "⚠️  ECB mode is not semantically secure. Consider using CBC, CTR, or GCM mode for better security.",
    );
  }

  // Weak key detection for AES
  if (options.keyLength && options.keyLength < 256) {
    console.warn(
      `⚠️  Using ${options.keyLength}-bit key. Consider using 256-bit keys for maximum security.`,
    );
  }

  // IV reuse warning for GCM
  if (mode === "gcm" && options.iv) {
    console.warn(
      "⚠️  Using fixed IV for GCM mode. Ensure IV is unique for each encryption to maintain security.",
    );
  }
}

export async function aesEncrypt(
  text: string,
  options: AesOptions,
): Promise<SymmetricResult> {
  const outputEncoding = options.outputEncoding ?? "base64";

  // Validate mode and padding combination
  validateModeAndPadding(options.mode, options.padding);

  // Validate IV length if provided
  validateIvLength(options.mode, options.iv);

  // Add security warnings for development
  addSecurityWarnings(options.mode, options);

  if (options.mode === "gcm") {
    const keyBytes = resolveAesKeyBytes(options);
    const ivBytes = resolveIvBytes(options.iv, options.ivEncoding, 12);
    const data = cryptoUtils.stringToUint8Array(text);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: "AES-GCM" },
      false,
      ["encrypt"],
    );
    const additionalData = options.aad
      ? cryptoUtils.stringToUint8Array(options.aad)
      : undefined;
    const encrypted = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: ivBytes as BufferSource,
        additionalData: additionalData as BufferSource | undefined,
        tagLength: 128,
      },
      cryptoKey,
      data as BufferSource,
    );
    const cipherBytes = new Uint8Array(encrypted);
    return {
      cipherText: uint8ToBase64(cipherBytes),
      iv: uint8ToBase64(ivBytes),
      encoding: "base64",
    };
  }

  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);

  let ivWordArray: any | undefined;
  let ivString: string | undefined = options.iv;

  if (options.mode !== "ecb") {
    if (options.iv) {
      ivWordArray = parseWordArray(CryptoJS, options.iv, options.ivEncoding);
    } else {
      const generated = randomBytes(16);
      const hex = cryptoUtils.bytesToHex(generated);
      ivWordArray = CryptoJS.enc.Hex.parse(hex);
      ivString = outputEncoding === "hex" ? hex : uint8ToBase64(generated);
    }
  }

  const cipher = CryptoJS.AES.encrypt(text, key, {
    iv: ivWordArray,
    mode:
      options.mode === "ecb"
        ? CryptoJS.mode.ECB
        : options.mode === "ctr"
          ? CryptoJS.mode.CTR
          : options.mode === "cfb"
            ? CryptoJS.mode.CFB
            : CryptoJS.mode.CBC,
    padding: resolvePaddingScheme(CryptoJS, options.padding),
  });

  const result: SymmetricResult = {
    cipherText: outputFromWordArray(
      CryptoJS,
      cipher.ciphertext,
      outputEncoding,
    ),
    encoding: outputEncoding,
  };
  if (options.mode !== "ecb" && ivString) {
    result.iv = ivString;
  }
  return result;
}

export async function aesDecrypt(
  cipherText: string,
  options: AesOptions,
): Promise<string> {
  // Validate mode and padding combination
  validateModeAndPadding(options.mode, options.padding);

  // Validate IV length if provided
  validateIvLength(options.mode, options.iv);

  if (options.mode === "gcm") {
    const keyBytes = resolveAesKeyBytes(options);
    const ivBytes = resolveIvBytes(options.iv, options.ivEncoding, 12);
    const cipherBytes = base64ToUint8(cipherText);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes as BufferSource,
      { name: "AES-GCM" },
      false,
      ["decrypt"],
    );
    try {
      const decrypted = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: ivBytes as BufferSource,
          additionalData: options.aad
            ? (cryptoUtils.stringToUint8Array(options.aad) as BufferSource)
            : undefined,
          tagLength: 128,
        },
        cryptoKey,
        cipherBytes as BufferSource,
      );
      return cryptoUtils.uint8ArrayToString(new Uint8Array(decrypted));
    } catch (error) {
      throw new CryptoError(
        "AES-GCM decryption failed",
        "AES_GCM_DECRYPT",
        error as Error,
      );
    }
  }

  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const cipherEncoding = options.outputEncoding ?? "base64";
  if (options.mode !== "ecb" && !options.iv) {
    throw new CryptoError("Initialization vector required", "AES_IV_REQUIRED");
  }

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: parseCiphertext(CryptoJS, cipherText, cipherEncoding),
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, key, {
    iv:
      options.mode === "ecb"
        ? undefined
        : parseWordArray(CryptoJS, options.iv!, options.ivEncoding),
    mode:
      options.mode === "ecb"
        ? CryptoJS.mode.ECB
        : options.mode === "ctr"
          ? CryptoJS.mode.CTR
          : options.mode === "cfb"
            ? CryptoJS.mode.CFB
            : CryptoJS.mode.CBC,
    padding: resolvePaddingScheme(CryptoJS, options.padding),
  });

  return CryptoJS.enc.Utf8.stringify(decrypted);
}

interface LegacyCipherOptions {
  key: string;
  keyEncoding?: KeyEncoding;
  iv?: string;
  ivEncoding?: KeyEncoding;
  outputEncoding?: "hex" | "base64";
  mode?: "cbc" | "ecb";
  padding?: PaddingScheme;
}

export async function desEncrypt(
  text: string,
  options: LegacyCipherOptions,
): Promise<SymmetricResult> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const outputEncoding = options.outputEncoding ?? "base64";
  let iv = options.iv;
  let ivWordArray: any | undefined;
  if (options.mode !== "ecb") {
    if (options.iv) {
      ivWordArray = parseWordArray(CryptoJS, options.iv, options.ivEncoding);
    } else {
      const generated = randomBytes(8);
      const hex = cryptoUtils.bytesToHex(generated);
      ivWordArray = CryptoJS.enc.Hex.parse(hex);
      iv = outputEncoding === "hex" ? hex : uint8ToBase64(generated);
    }
  }
  const cipher = CryptoJS.DES.encrypt(text, key, {
    iv: ivWordArray,
    mode: options.mode === "ecb" ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result: SymmetricResult = {
    cipherText: outputFromWordArray(
      CryptoJS,
      cipher.ciphertext,
      outputEncoding,
    ),
    encoding: outputEncoding,
  };
  if (options.mode !== "ecb" && iv) {
    result.iv = iv;
  }
  return result;
}

export async function desDecrypt(
  cipherText: string,
  options: LegacyCipherOptions,
): Promise<string> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  if (options.mode !== "ecb" && !options.iv) {
    throw new CryptoError("Initialization vector required", "DES_IV_REQUIRED");
  }
  const decrypted = CryptoJS.DES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: parseCiphertext(
        CryptoJS,
        cipherText,
        options.outputEncoding ?? "base64",
      ),
    }),
    key,
    {
      iv:
        options.mode === "ecb"
          ? undefined
          : parseWordArray(CryptoJS, options.iv!, options.ivEncoding),
      mode: options.mode === "ecb" ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );

  return CryptoJS.enc.Utf8.stringify(decrypted);
}

export async function tripleDesEncrypt(
  text: string,
  options: LegacyCipherOptions,
): Promise<SymmetricResult> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const outputEncoding = options.outputEncoding ?? "base64";
  let iv = options.iv;
  let ivWordArray: any | undefined;
  if (options.mode !== "ecb") {
    if (options.iv) {
      ivWordArray = parseWordArray(CryptoJS, options.iv, options.ivEncoding);
    } else {
      const generated = randomBytes(8);
      const hex = cryptoUtils.bytesToHex(generated);
      ivWordArray = CryptoJS.enc.Hex.parse(hex);
      iv = outputEncoding === "hex" ? hex : uint8ToBase64(generated);
    }
  }
  const cipher = CryptoJS.TripleDES.encrypt(text, key, {
    iv: ivWordArray,
    mode: options.mode === "ecb" ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const result: SymmetricResult = {
    cipherText: outputFromWordArray(
      CryptoJS,
      cipher.ciphertext,
      outputEncoding,
    ),
    encoding: outputEncoding,
  };
  if (options.mode !== "ecb" && iv) {
    result.iv = iv;
  }
  return result;
}

export async function tripleDesDecrypt(
  cipherText: string,
  options: LegacyCipherOptions,
): Promise<string> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  if (options.mode !== "ecb" && !options.iv) {
    throw new CryptoError("Initialization vector required", "3DES_IV_REQUIRED");
  }
  const decrypted = CryptoJS.TripleDES.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: parseCiphertext(
        CryptoJS,
        cipherText,
        options.outputEncoding ?? "base64",
      ),
    }),
    key,
    {
      iv:
        options.mode === "ecb"
          ? undefined
          : parseWordArray(CryptoJS, options.iv!, options.ivEncoding),
      mode: options.mode === "ecb" ? CryptoJS.mode.ECB : CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    },
  );

  return CryptoJS.enc.Utf8.stringify(decrypted);
}

export async function rc4Encrypt(
  text: string,
  options: {
    key: string;
    keyEncoding?: KeyEncoding;
    outputEncoding?: "hex" | "base64";
    drop?: number;
  },
): Promise<SymmetricResult> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const outputEncoding = options.outputEncoding ?? "base64";
  const cipher = CryptoJS.RC4.encrypt(text, key, {
    drop: options.drop ?? 768,
  });

  return {
    cipherText: outputFromWordArray(
      CryptoJS,
      cipher.ciphertext,
      outputEncoding,
    ),
    encoding: outputEncoding,
  };
}

export async function rc4Decrypt(
  cipherText: string,
  options: {
    key: string;
    keyEncoding?: KeyEncoding;
    outputEncoding?: "hex" | "base64";
    drop?: number;
  },
): Promise<string> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const decrypted = CryptoJS.RC4.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: parseCiphertext(
        CryptoJS,
        cipherText,
        options.outputEncoding ?? "base64",
      ),
    }),
    key,
    {
      drop: options.drop ?? 768,
    },
  );
  return CryptoJS.enc.Utf8.stringify(decrypted);
}

export async function rabbitEncrypt(
  text: string,
  options: {
    key: string;
    keyEncoding?: KeyEncoding;
    outputEncoding?: "hex" | "base64";
  },
): Promise<SymmetricResult> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const outputEncoding = options.outputEncoding ?? "base64";
  const cipher = CryptoJS.Rabbit.encrypt(text, key);

  return {
    cipherText: outputFromWordArray(
      CryptoJS,
      cipher.ciphertext,
      outputEncoding,
    ),
    encoding: outputEncoding,
  };
}

export async function rabbitDecrypt(
  cipherText: string,
  options: {
    key: string;
    keyEncoding?: KeyEncoding;
    outputEncoding?: "hex" | "base64";
  },
): Promise<string> {
  const CryptoJS = await loadCryptoJS();
  const key = parseWordArray(CryptoJS, options.key, options.keyEncoding);
  const decrypted = CryptoJS.Rabbit.decrypt(
    CryptoJS.lib.CipherParams.create({
      ciphertext: parseCiphertext(
        CryptoJS,
        cipherText,
        options.outputEncoding ?? "base64",
      ),
    }),
    key,
  );
  return CryptoJS.enc.Utf8.stringify(decrypted);
}

// Stream cipher implementations using Noble Ciphers
interface StreamCipherOptions {
  key: string;
  keyEncoding?: KeyEncoding;
  nonce?: string;
  nonceEncoding?: KeyEncoding;
  outputEncoding?: "hex" | "base64";
}

export async function chacha20Encrypt(
  text: string,
  options: StreamCipherOptions,
): Promise<SymmetricResult> {
  const { chacha20 } = await import("@noble/ciphers/chacha.js");
  const {
    randomBytes: nobleRandomBytes,
    utf8ToBytes,
    bytesToHex,
  } = await import("@noble/ciphers/utils.js");

  const keyBytes = decodeToBytes(options.key, options.keyEncoding);
  const adjustedKey = adjustKeyLength(keyBytes, 32); // ChaCha20 uses 32-byte keys

  let nonceBytes: Uint8Array;
  let nonceString: string;

  if (options.nonce) {
    nonceBytes = decodeToBytes(options.nonce, options.nonceEncoding);
    nonceBytes = adjustKeyLength(nonceBytes, 12); // ChaCha20 uses 12-byte nonces
    nonceString = options.nonce;
  } else {
    nonceBytes = nobleRandomBytes(12);
    const outputEncoding = options.outputEncoding ?? "base64";
    nonceString =
      outputEncoding === "hex"
        ? bytesToHex(nonceBytes)
        : uint8ToBase64(nonceBytes);
  }

  const plaintext = utf8ToBytes(text);
  const ciphertext = chacha20(adjustedKey, nonceBytes, plaintext);

  const outputEncoding = options.outputEncoding ?? "base64";
  const result: SymmetricResult = {
    cipherText:
      outputEncoding === "hex"
        ? bytesToHex(ciphertext)
        : uint8ToBase64(ciphertext),
    nonce: nonceString,
    encoding: outputEncoding,
  };

  return result;
}

export async function chacha20Decrypt(
  cipherText: string,
  options: StreamCipherOptions,
): Promise<string> {
  if (!options.nonce) {
    throw new CryptoError(
      "Nonce is required for ChaCha20 decryption",
      "CHACHA20_NONCE_REQUIRED",
    );
  }

  const { chacha20 } = await import("@noble/ciphers/chacha.js");
  const { bytesToUtf8 } = await import("@noble/ciphers/utils.js");

  const keyBytes = decodeToBytes(options.key, options.keyEncoding);
  const adjustedKey = adjustKeyLength(keyBytes, 32);

  const nonceBytes = decodeToBytes(options.nonce, options.nonceEncoding);
  const adjustedNonce = adjustKeyLength(nonceBytes, 12);

  const cipherBytes = decodeToBytes(
    cipherText,
    options.outputEncoding === "hex" ? "hex" : "base64",
  );

  const decrypted = chacha20(adjustedKey, adjustedNonce, cipherBytes);

  return bytesToUtf8(decrypted);
}

export async function salsa20Encrypt(
  text: string,
  options: StreamCipherOptions,
): Promise<SymmetricResult> {
  const { salsa20 } = await import("@noble/ciphers/salsa.js");
  const {
    randomBytes: nobleRandomBytes,
    utf8ToBytes,
    bytesToHex,
  } = await import("@noble/ciphers/utils.js");

  const keyBytes = decodeToBytes(options.key, options.keyEncoding);
  const adjustedKey = adjustKeyLength(keyBytes, 32); // Salsa20 uses 32-byte keys

  let nonceBytes: Uint8Array;
  let nonceString: string;

  if (options.nonce) {
    nonceBytes = decodeToBytes(options.nonce, options.nonceEncoding);
    nonceBytes = adjustKeyLength(nonceBytes, 8); // Salsa20 uses 8-byte nonces
    nonceString = options.nonce;
  } else {
    nonceBytes = nobleRandomBytes(8);
    const outputEncoding = options.outputEncoding ?? "base64";
    nonceString =
      outputEncoding === "hex"
        ? bytesToHex(nonceBytes)
        : uint8ToBase64(nonceBytes);
  }

  const plaintext = utf8ToBytes(text);
  const ciphertext = salsa20(adjustedKey, nonceBytes, plaintext);

  const outputEncoding = options.outputEncoding ?? "base64";
  const result: SymmetricResult = {
    cipherText:
      outputEncoding === "hex"
        ? bytesToHex(ciphertext)
        : uint8ToBase64(ciphertext),
    nonce: nonceString,
    encoding: outputEncoding,
  };

  return result;
}

export async function salsa20Decrypt(
  cipherText: string,
  options: StreamCipherOptions,
): Promise<string> {
  if (!options.nonce) {
    throw new CryptoError(
      "Nonce is required for Salsa20 decryption",
      "SALSA20_NONCE_REQUIRED",
    );
  }

  const { salsa20 } = await import("@noble/ciphers/salsa.js");
  const { bytesToUtf8 } = await import("@noble/ciphers/utils.js");

  const keyBytes = decodeToBytes(options.key, options.keyEncoding);
  const adjustedKey = adjustKeyLength(keyBytes, 32);

  const nonceBytes = decodeToBytes(options.nonce, options.nonceEncoding);
  const adjustedNonce = adjustKeyLength(nonceBytes, 8);

  const cipherBytes = decodeToBytes(
    cipherText,
    options.outputEncoding === "hex" ? "hex" : "base64",
  );

  const decrypted = salsa20(adjustedKey, adjustedNonce, cipherBytes);

  return bytesToUtf8(decrypted);
}

// Export types and classes for the UI components
export type SymmetricAlgorithm =
  | "aes"
  | "des"
  | "3des"
  | "rc4"
  | "rabbit"
  | "chacha20"
  | "salsa20";
export type CipherMode = "ecb" | "cbc" | "cfb" | "ctr" | "gcm";

export class SymmetricCrypto {
  static async encryptAES(
    plaintext: string,
    key: string,
    options: Partial<AesOptions> = {},
  ) {
    return await aesEncrypt(plaintext, { ...options, key } as AesOptions);
  }

  static async decryptAES(
    ciphertext: string,
    key: string,
    options: Partial<AesOptions> = {},
  ) {
    return await aesDecrypt(ciphertext, { ...options, key } as AesOptions);
  }

  static async encryptDES(
    plaintext: string,
    key: string,
    options: Partial<LegacyCipherOptions> = {},
  ) {
    return await desEncrypt(plaintext, { ...options, key });
  }

  static async decryptDES(
    ciphertext: string,
    key: string,
    options: Partial<LegacyCipherOptions> = {},
  ) {
    return await desDecrypt(ciphertext, { ...options, key });
  }

  static async encrypt3DES(
    plaintext: string,
    key: string,
    options: Partial<LegacyCipherOptions> = {},
  ) {
    return await tripleDesEncrypt(plaintext, { ...options, key });
  }

  static async decrypt3DES(
    ciphertext: string,
    key: string,
    options: Partial<LegacyCipherOptions> = {},
  ) {
    return await tripleDesDecrypt(ciphertext, { ...options, key });
  }

  static async encryptRC4(
    plaintext: string,
    key: string,
    options: {
      keyEncoding?: KeyEncoding;
      outputEncoding?: "hex" | "base64";
      drop?: number;
    } = {},
  ) {
    return await rc4Encrypt(plaintext, { ...options, key });
  }

  static async decryptRC4(
    ciphertext: string,
    key: string,
    options: {
      keyEncoding?: KeyEncoding;
      outputEncoding?: "hex" | "base64";
      drop?: number;
    } = {},
  ) {
    return await rc4Decrypt(ciphertext, { ...options, key });
  }

  static async encryptRabbit(
    plaintext: string,
    key: string,
    options: {
      keyEncoding?: KeyEncoding;
      outputEncoding?: "hex" | "base64";
    } = {},
  ) {
    return await rabbitEncrypt(plaintext, { ...options, key });
  }

  static async decryptRabbit(
    ciphertext: string,
    key: string,
    options: {
      keyEncoding?: KeyEncoding;
      outputEncoding?: "hex" | "base64";
    } = {},
  ) {
    return await rabbitDecrypt(ciphertext, { ...options, key });
  }

  static async encryptChaCha20(
    plaintext: string,
    key: string,
    options: Partial<StreamCipherOptions> = {},
  ) {
    return await chacha20Encrypt(plaintext, { ...options, key });
  }

  static async decryptChaCha20(
    ciphertext: string,
    key: string,
    options: Partial<StreamCipherOptions> = {},
  ) {
    return await chacha20Decrypt(ciphertext, { ...options, key });
  }

  static async encryptSalsa20(
    plaintext: string,
    key: string,
    options: Partial<StreamCipherOptions> = {},
  ) {
    return await salsa20Encrypt(plaintext, { ...options, key });
  }

  static async decryptSalsa20(
    ciphertext: string,
    key: string,
    options: Partial<StreamCipherOptions> = {},
  ) {
    return await salsa20Decrypt(ciphertext, { ...options, key });
  }

  static generateKey(
    algorithm: SymmetricAlgorithm,
    encoding: "hex" | "base64" = "base64",
  ): string {
    const keyLengths: Record<SymmetricAlgorithm, number> = {
      aes: 32,
      des: 8,
      "3des": 24,
      rc4: 16,
      rabbit: 16,
      chacha20: 32,
      salsa20: 32,
    };

    const length = keyLengths[algorithm] ?? 32;
    const bytes = randomBytes(length);
    return encoding === "hex"
      ? cryptoUtils.bytesToHex(bytes)
      : uint8ToBase64(bytes);
  }

  static generateIV(
    mode: CipherMode = "cbc",
    encoding: "hex" | "base64" = "base64",
  ): string {
    const length = mode === "gcm" ? 12 : 16;
    const bytes = randomBytes(length);
    return encoding === "hex"
      ? cryptoUtils.bytesToHex(bytes)
      : uint8ToBase64(bytes);
  }
}
