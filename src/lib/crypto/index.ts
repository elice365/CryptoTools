// Temporarily disabled crypto modules to fix page rendering
// export * from "./encodings";
// export * from "./hashing";
// export * from "./symmetric";
// export * from "./stream";
// export * from "./rsa";
// export * from "./ecc";
// export * from "./elgamal";
// export * from "./paillier";
// export * from "./bgv";
// export * from "./pqc";
export * from "./shared";
export {
  type AesMode,
  type AesOptions,
  type PaddingScheme,
  type SymmetricResult,
  aesDecrypt,
  aesEncrypt,
  chacha20Decrypt,
  chacha20Encrypt,
  desDecrypt,
  desEncrypt,
  rabbitDecrypt,
  rabbitEncrypt,
  rc4Decrypt,
  rc4Encrypt,
  salsa20Decrypt,
  salsa20Encrypt,
  tripleDesDecrypt,
  tripleDesEncrypt,
} from "./symmetric";

// Temporary stub implementations for UI components
export const hashString = async (input: string, algorithm: string, encoding: string = "hex") => {
  try {
    // Check if crypto.subtle is available
    if (!crypto || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    let algoName = '';
    switch (algorithm.toLowerCase()) {
      case 'sha1':
        algoName = 'SHA-1';
        break;
      case 'sha256':
        algoName = 'SHA-256';
        break;
      case 'sha384':
        algoName = 'SHA-384';
        break;
      case 'sha512':
        algoName = 'SHA-512';
        break;
      default:
        algoName = 'SHA-256';
    }

    const hashBuffer = await crypto.subtle.digest(algoName, data);
    const hashArray = new Uint8Array(hashBuffer);

    if (encoding === 'hex') {
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (encoding === 'base64') {
      return btoa(String.fromCharCode(...hashArray));
    } else {
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.error("Hash generation failed:", error);
    return "[해시 생성 실패]";
  }
};

export const hashFile = async (file: File, algorithm: string, encoding: string = "hex") => {
  try {
    // Check if crypto.subtle is available
    if (!crypto || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    const arrayBuffer = await file.arrayBuffer();

    let algoName = '';
    switch (algorithm.toLowerCase()) {
      case 'sha1':
        algoName = 'SHA-1';
        break;
      case 'sha256':
        algoName = 'SHA-256';
        break;
      case 'sha384':
        algoName = 'SHA-384';
        break;
      case 'sha512':
        algoName = 'SHA-512';
        break;
      default:
        algoName = 'SHA-256';
    }

    const hashBuffer = await crypto.subtle.digest(algoName, arrayBuffer);
    const hashArray = new Uint8Array(hashBuffer);

    if (encoding === 'hex') {
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    } else if (encoding === 'base64') {
      return btoa(String.fromCharCode(...hashArray));
    } else {
      return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (error) {
    console.error("File hash generation failed:", error);
    return "[파일 해시 생성 실패]";
  }
};

export const encryptSymmetric = async (plaintext: string, options: any) => {
  try {
    // Check if crypto.subtle is available
    if (!crypto || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    // Generate or use provided key
    let key;
    if (options.key) {
      // Import provided key
      const keyBuffer = Uint8Array.from(atob(options.key), c => c.charCodeAt(0));
      key = await crypto.subtle.importKey(
        "raw",
        keyBuffer,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
      );
    } else {
      // Generate new key
      key = await generateAesKey(256);
    }

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt data
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      data
    );

    const cipherArray = new Uint8Array(cipherBuffer);
    const cipherText = btoa(String.fromCharCode(...cipherArray));
    const nonce = btoa(String.fromCharCode(...iv));

    return {
      cipherText: cipherText,
      nonce: nonce,
      encoding: "base64"
    };
  } catch (error) {
    console.error("Symmetric encryption failed:", error);
    return {
      cipherText: "[대칭 암호화 실패 - Web Crypto API 사용 불가]",
      nonce: "",
      encoding: "base64"
    };
  }
};

export const decryptSymmetric = async (payload: any, options: any) => {
  try {
    // Check if crypto.subtle is available
    if (!crypto || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    // Import key
    const keyBuffer = Uint8Array.from(atob(options.key), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "raw",
      keyBuffer,
      { name: "AES-GCM" },
      false,
      ["decrypt"]
    );

    // Decode cipher text and nonce
    const cipherArray = Uint8Array.from(atob(payload.cipherText), c => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(payload.nonce), c => c.charCodeAt(0));

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      key,
      cipherArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Symmetric decryption failed:", error);
    return "[대칭 복호화 실패 - Web Crypto API 사용 불가]";
  }
};

export const eccEncrypt = (plaintext: string, publicKey: string, options?: any) => {
  return {
    payload: {
      cipherText: "[암호화 모듈 준비 중 - 곧 사용할 수 있습니다]",
      nonce: "",
      ephemeralPublicKey: "",
      encoding: "base64"
    },
    ephemeralKeys: { publicKey: new Uint8Array(), secretKey: new Uint8Array() }
  };
};

export const eccDecrypt = (payload: any, privateKey: string, options?: any) => {
  return "[암호화 모듈 준비 중 - 곧 사용할 수 있습니다]";
};

export const generateEccKeyPair = async () => {
  try {
    // Check if crypto.subtle is available
    if (!crypto || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    // Generate ECDSA key pair using Web Crypto API
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "ECDSA",
        namedCurve: "P-256"
      },
      true,
      ["sign", "verify"]
    );

    return keyPair;
  } catch (error) {
    console.error("ECC key generation failed:", error);
    throw new Error("키 생성에 실패했습니다 - Web Crypto API 사용 불가");
  }
};

export const exportEccKeyPair = async (keyPair: CryptoKeyPair, encoding: string = "base64") => {
  try {
    // Check if crypto.subtle is available
    if (!crypto || !crypto.subtle) {
      throw new Error("Web Crypto API not available");
    }

    // Export public key
    const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyArray = new Uint8Array(publicKeyBuffer);
    const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray));

    // Export private key
    const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyArray = new Uint8Array(privateKeyBuffer);
    const privateKeyBase64 = btoa(String.fromCharCode(...privateKeyArray));

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      encoding: encoding
    };
  } catch (error) {
    console.error("Key export failed:", error);
    return {
      publicKey: "[키 내보내기 실패 - Web Crypto API 사용 불가]",
      privateKey: "[키 내보내기 실패 - Web Crypto API 사용 불가]",
      encoding: encoding
    };
  }
};

// Additional encoding functions needed by components
export const urlEncode = (input: string) => {
  return encodeURIComponent(input);
};

export const urlDecode = (input: string) => {
  try {
    return decodeURIComponent(input);
  } catch {
    return "[Invalid URL encoding]";
  }
};

export const isLikelyBase64 = (input: string) => {
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  return base64Regex.test(input) && input.length % 4 === 0;
};

export const stringToBase64 = (input: string) => {
  try {
    return btoa(unescape(encodeURIComponent(input)));
  } catch {
    return "[Invalid string for Base64 encoding]";
  }
};

export const base64ToString = (input: string) => {
  try {
    return decodeURIComponent(escape(atob(input)));
  } catch {
    return "[Invalid Base64 string]";
  }
};

export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || result);
    };
    reader.onerror = () => resolve("[File reading error]");
    reader.readAsDataURL(file);
  });
};

export const base64ToBlob = (base64: string, mimeType: string = 'application/octet-stream') => {
  try {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  } catch {
    return new Blob(['[Invalid Base64]'], { type: 'text/plain' });
  }
};

// RSA Key Generation
export const generateRsaKeyPair = async (keySize: number = 2048) => {
  try {
    // Multiple layers of browser environment checking
    if (typeof window === 'undefined') {
      throw new Error("키 생성은 브라우저 환경에서만 가능합니다");
    }

    if (typeof document === 'undefined') {
      throw new Error("DOM이 사용할 수 없습니다");
    }

    // Detailed crypto availability check
    console.log('=== RSA Key Generation Debug ===');
    console.log('window exists:', typeof window !== 'undefined');
    console.log('window.crypto:', !!window.crypto);
    console.log('window.crypto.subtle:', !!window.crypto?.subtle);
    console.log('isSecureContext:', window.isSecureContext);
    console.log('protocol:', window.location?.protocol);
    console.log('hostname:', window.location?.hostname);

    if (!window.crypto) {
      throw new Error("브라우저에서 Crypto API를 찾을 수 없습니다");
    }

    if (!window.crypto.subtle) {
      throw new Error("브라우저에서 SubtleCrypto API를 찾을 수 없습니다");
    }

    if (!window.isSecureContext) {
      throw new Error("보안 컨텍스트가 아닙니다. HTTPS 또는 localhost에서 실행해야 합니다");
    }

    console.log('Starting RSA key generation...');
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: keySize,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256"
      },
      true,
      ["encrypt", "decrypt"]
    );
    console.log('RSA key generated successfully');

    return keyPair;
  } catch (error) {
    console.error("RSA key generation failed:", error);
    throw new Error(`RSA 키 생성에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const exportRsaKeyPair = async (keyPair: CryptoKeyPair, encoding: string = "base64") => {
  try {
    // Check if we're in browser environment first
    if (typeof window === 'undefined') {
      throw new Error("키 내보내기는 브라우저 환경에서만 가능합니다");
    }

    // Check if crypto.subtle is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API가 지원되지 않습니다. HTTPS 환경에서 접속해주세요");
    }

    // Export public key
    const publicKeyBuffer = await window.crypto.subtle.exportKey("spki", keyPair.publicKey);
    const publicKeyArray = new Uint8Array(publicKeyBuffer);
    const publicKeyBase64 = btoa(String.fromCharCode(...publicKeyArray));

    // Export private key
    const privateKeyBuffer = await window.crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
    const privateKeyArray = new Uint8Array(privateKeyBuffer);
    const privateKeyBase64 = btoa(String.fromCharCode(...privateKeyArray));

    return {
      publicKey: publicKeyBase64,
      privateKey: privateKeyBase64,
      encoding: encoding
    };
  } catch (error) {
    console.error("RSA key export failed:", error);
    return {
      publicKey: `[RSA 키 내보내기 실패: ${error instanceof Error ? error.message : String(error)}]`,
      privateKey: `[RSA 키 내보내기 실패: ${error instanceof Error ? error.message : String(error)}]`,
      encoding: encoding
    };
  }
};

// AES Key Generation for Symmetric Encryption
export const generateAesKey = async (keySize: number = 256) => {
  try {
    // Multiple layers of browser environment checking
    if (typeof window === 'undefined') {
      throw new Error("키 생성은 브라우저 환경에서만 가능합니다");
    }

    if (typeof document === 'undefined') {
      throw new Error("DOM이 사용할 수 없습니다");
    }

    // Detailed crypto availability check
    console.log('=== AES Key Generation Debug ===');
    console.log('window exists:', typeof window !== 'undefined');
    console.log('window.crypto:', !!window.crypto);
    console.log('window.crypto.subtle:', !!window.crypto?.subtle);
    console.log('isSecureContext:', window.isSecureContext);
    console.log('protocol:', window.location?.protocol);
    console.log('hostname:', window.location?.hostname);

    if (!window.crypto) {
      throw new Error("브라우저에서 Crypto API를 찾을 수 없습니다");
    }

    if (!window.crypto.subtle) {
      throw new Error("브라우저에서 SubtleCrypto API를 찾을 수 없습니다");
    }

    if (!window.isSecureContext) {
      throw new Error("보안 컨텍스트가 아닙니다. HTTPS 또는 localhost에서 실행해야 합니다");
    }

    console.log('Starting AES key generation...');
    const key = await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: keySize
      },
      true,
      ["encrypt", "decrypt"]
    );
    console.log('AES key generated successfully');

    return key;
  } catch (error) {
    console.error("AES key generation failed:", error);
    throw new Error(`AES 키 생성에 실패했습니다: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const exportAesKey = async (key: CryptoKey, encoding: string = "base64") => {
  try {
    // Check if we're in browser environment first
    if (typeof window === 'undefined') {
      throw new Error("키 내보내기는 브라우저 환경에서만 가능합니다");
    }

    // Check if crypto.subtle is available
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("Web Crypto API가 지원되지 않습니다. HTTPS 환경에서 접속해주세요");
    }

    const keyBuffer = await window.crypto.subtle.exportKey("raw", key);
    const keyArray = new Uint8Array(keyBuffer);

    if (encoding === "hex") {
      return Array.from(keyArray).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      return btoa(String.fromCharCode(...keyArray));
    }
  } catch (error) {
    console.error("AES key export failed:", error);
    return `[AES 키 내보내기 실패: ${error instanceof Error ? error.message : String(error)}]`;
  }
};

// Type exports
export type HashAlgorithm = "sha1" | "sha256" | "sha384" | "sha512" | "blake2b" | "blake2s";
export type SymmetricAlgorithm = "AES-GCM" | "AES-CTR" | "ChaCha20";
export type AsymmetricAlgorithm = "RSA" | "ECC";
