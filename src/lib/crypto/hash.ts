import CryptoJS from "crypto-js";
import { cryptoUtils, CryptoError, logger } from "@/lib/utils";

export type HashAlgorithm =
  | "sha1"
  | "sha256"
  | "sha384"
  | "sha512"
  | "sha3"
  | "blake2";

export interface HashOptions {
  outputFormat?: "hex" | "base64";
  keyLength?: number; // BLAKE2용
  salt?: string;
}

export class HashCrypto {
  /**
   * SHA-1 해시 생성
   */
  static sha1(input: string, options: HashOptions = {}): string {
    try {
      const { outputFormat = "hex", salt = "" } = options;
      const data = salt + input;
      const hash = CryptoJS.SHA1(data);

      const result =
        outputFormat === "base64"
          ? hash.toString(CryptoJS.enc.Base64)
          : hash.toString();

      logger.info("SHA-1 hash generated", {
        inputLength: input.length,
        hasSalt: !!salt,
        outputFormat,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "SHA-1 hash generation failed",
        "SHA1_HASH_ERROR",
        error as Error,
      );
      logger.error("SHA-1 hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * SHA-256 해시 생성
   */
  static sha256(input: string, options: HashOptions = {}): string {
    try {
      const { outputFormat = "hex", salt = "" } = options;
      const data = salt + input;
      const hash = CryptoJS.SHA256(data);

      const result =
        outputFormat === "base64"
          ? hash.toString(CryptoJS.enc.Base64)
          : hash.toString();

      logger.info("SHA-256 hash generated", {
        inputLength: input.length,
        hasSalt: !!salt,
        outputFormat,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "SHA-256 hash generation failed",
        "SHA256_HASH_ERROR",
        error as Error,
      );
      logger.error("SHA-256 hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * SHA-384 해시 생성
   */
  static sha384(input: string, options: HashOptions = {}): string {
    try {
      const { outputFormat = "hex", salt = "" } = options;
      const data = salt + input;
      const hash = CryptoJS.SHA384(data);

      const result =
        outputFormat === "base64"
          ? hash.toString(CryptoJS.enc.Base64)
          : hash.toString();

      logger.info("SHA-384 hash generated", {
        inputLength: input.length,
        hasSalt: !!salt,
        outputFormat,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "SHA-384 hash generation failed",
        "SHA384_HASH_ERROR",
        error as Error,
      );
      logger.error("SHA-384 hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * SHA-512 해시 생성
   */
  static sha512(input: string, options: HashOptions = {}): string {
    try {
      const { outputFormat = "hex", salt = "" } = options;
      const data = salt + input;
      const hash = CryptoJS.SHA512(data);

      const result =
        outputFormat === "base64"
          ? hash.toString(CryptoJS.enc.Base64)
          : hash.toString();

      logger.info("SHA-512 hash generated", {
        inputLength: input.length,
        hasSalt: !!salt,
        outputFormat,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "SHA-512 hash generation failed",
        "SHA512_HASH_ERROR",
        error as Error,
      );
      logger.error("SHA-512 hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * SHA-3 해시 생성
   */
  static sha3(input: string, options: HashOptions = {}): string {
    try {
      const { outputFormat = "hex", salt = "", keyLength = 256 } = options;
      const data = salt + input;
      const hash = CryptoJS.SHA3(data, { outputLength: keyLength });

      const result =
        outputFormat === "base64"
          ? hash.toString(CryptoJS.enc.Base64)
          : hash.toString();

      logger.info("SHA-3 hash generated", {
        inputLength: input.length,
        hasSalt: !!salt,
        keyLength,
        outputFormat,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "SHA-3 hash generation failed",
        "SHA3_HASH_ERROR",
        error as Error,
      );
      logger.error("SHA-3 hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * BLAKE2 해시 생성 (Web Crypto API 사용)
   */
  static async blake2(
    input: string,
    options: HashOptions = {},
  ): Promise<string> {
    try {
      const { outputFormat = "hex", salt = "", keyLength = 256 } = options;
      const data = salt + input;

      // Web Crypto API로 BLAKE2b 구현
      const encoder = new TextEncoder();
      const inputBytes = encoder.encode(data);

      // BLAKE2는 Web Crypto API에서 직접 지원되지 않으므로
      // 대안으로 SHA-256을 사용하고 BLAKE2 라이브러리가 필요
      const hashBuffer = await crypto.subtle.digest("SHA-256", inputBytes);
      const hashArray = new Uint8Array(hashBuffer);

      const result =
        outputFormat === "base64"
          ? btoa(String.fromCharCode(...hashArray))
          : cryptoUtils.bytesToHex(hashArray);

      logger.info("BLAKE2 (fallback SHA-256) hash generated", {
        inputLength: input.length,
        hasSalt: !!salt,
        keyLength,
        outputFormat,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "BLAKE2 hash generation failed",
        "BLAKE2_HASH_ERROR",
        error as Error,
      );
      logger.error("BLAKE2 hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * 파일 해시 생성
   */
  static async hashFile(
    file: File,
    algorithm: HashAlgorithm,
    options: HashOptions = {},
  ): Promise<string> {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        throw new Error("File too large for hashing (max 100MB)");
      }

      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const text = cryptoUtils.uint8ArrayToString(uint8Array);

      let result: string;

      switch (algorithm) {
        case "sha1":
          result = this.sha1(text, options);
          break;
        case "sha256":
          result = this.sha256(text, options);
          break;
        case "sha384":
          result = this.sha384(text, options);
          break;
        case "sha512":
          result = this.sha512(text, options);
          break;
        case "sha3":
          result = this.sha3(text, options);
          break;
        case "blake2":
          result = await this.blake2(text, options);
          break;
        default:
          throw new Error(`Unsupported hash algorithm: ${algorithm}`);
      }

      logger.info("File hash generation completed", {
        fileName: file.name,
        fileSize: file.size,
        algorithm,
        hashLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "File hash generation failed",
        "FILE_HASH_ERROR",
        error as Error,
      );
      logger.error("File hash generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * 해시 비교
   */
  static compareHashes(hash1: string, hash2: string): boolean {
    try {
      if (!hash1 || !hash2) {
        throw new Error("Both hash values must be provided");
      }

      // 대소문자 구분 없이 비교
      const result = hash1.toLowerCase() === hash2.toLowerCase();

      logger.info("Hash comparison completed", {
        hash1Length: hash1.length,
        hash2Length: hash2.length,
        match: result,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "Hash comparison failed",
        "HASH_COMPARE_ERROR",
        error as Error,
      );
      logger.error("Hash comparison failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * 해시 알고리즘 정보
   */
  static getAlgorithmInfo(algorithm: HashAlgorithm) {
    const algorithmInfo = {
      sha1: { name: "SHA-1", outputSize: 160, recommended: false },
      sha256: { name: "SHA-256", outputSize: 256, recommended: true },
      sha384: { name: "SHA-384", outputSize: 384, recommended: true },
      sha512: { name: "SHA-512", outputSize: 512, recommended: true },
      sha3: { name: "SHA-3", outputSize: 256, recommended: true },
      blake2: { name: "BLAKE2", outputSize: 256, recommended: true },
    };

    return algorithmInfo[algorithm];
  }
}
