import { cryptoUtils, CryptoError, logger } from "@/lib/utils";

export interface Base64Options {
  urlSafe?: boolean;
  removePadding?: boolean;
}

export class Base64Crypto {
  /**
   * 텍스트를 Base64로 인코딩
   */
  static encode(input: string, options: Base64Options = {}): string {
    try {
      if (!input) return "";

      const bytes = cryptoUtils.stringToUint8Array(input);
      let result = btoa(String.fromCharCode(...bytes));

      if (options.urlSafe) {
        result = result.replace(/\+/g, "-").replace(/\//g, "_");
      }

      if (options.removePadding) {
        result = result.replace(/=+$/, "");
      }

      logger.info("Base64 encoding completed", {
        inputLength: input.length,
        outputLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "Base64 encoding failed",
        "BASE64_ENCODE_ERROR",
        error as Error,
      );
      logger.error("Base64 encoding failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * Base64를 텍스트로 디코딩
   */
  static decode(input: string, options: Base64Options = {}): string {
    try {
      if (!input) return "";

      let base64 = input;

      // URL-safe 문자 변환
      if (options.urlSafe || base64.includes("-") || base64.includes("_")) {
        base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
      }

      // 패딩 추가
      const remainder = base64.length % 4;
      if (remainder !== 0) {
        base64 += "=".repeat(4 - remainder);
      }

      // Base64 유효성 검증
      if (!cryptoUtils.isValidBase64(base64)) {
        throw new Error("Invalid Base64 string");
      }

      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const result = cryptoUtils.uint8ArrayToString(bytes);

      logger.info("Base64 decoding completed", {
        inputLength: input.length,
        outputLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "Base64 decoding failed",
        "BASE64_DECODE_ERROR",
        error as Error,
      );
      logger.error("Base64 decoding failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * 파일을 Base64로 변환
   */
  static async fileToBase64(file: File): Promise<string> {
    try {
      if (!file) {
        throw new Error("No file provided");
      }

      // 파일 크기 제한 (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File too large (max 10MB)");
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          try {
            const result = reader.result as string;
            // data:image/jpeg;base64, 부분 제거
            const base64 = result.split(",")[1] || result;

            logger.info("File to Base64 conversion completed", {
              fileName: file.name,
              fileSize: file.size,
              base64Length: base64.length,
            });

            resolve(base64);
          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = () => {
          reject(new Error("File reading failed"));
        };

        reader.readAsDataURL(file);
      });
    } catch (error) {
      const cryptoError = new CryptoError(
        "File to Base64 conversion failed",
        "FILE_TO_BASE64_ERROR",
        error as Error,
      );
      logger.error("File to Base64 conversion failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * Base64를 파일로 변환
   */
  static base64ToFile(
    base64: string,
    filename: string,
    mimeType: string = "application/octet-stream",
  ): File {
    try {
      if (!base64) {
        throw new Error("No Base64 string provided");
      }

      // Base64 prefix 제거
      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");

      // Base64 유효성 검증
      if (!cryptoUtils.isValidBase64(cleanBase64)) {
        throw new Error("Invalid Base64 string");
      }

      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const file = new File([bytes], filename, { type: mimeType });

      logger.info("Base64 to file conversion completed", {
        filename,
        mimeType,
        fileSize: file.size,
      });

      return file;
    } catch (error) {
      const cryptoError = new CryptoError(
        "Base64 to file conversion failed",
        "BASE64_TO_FILE_ERROR",
        error as Error,
      );
      logger.error("Base64 to file conversion failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * Base64를 Blob으로 변환
   */
  static base64ToBlob(
    base64: string,
    mimeType: string = "application/octet-stream",
  ): Blob {
    try {
      const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      return new Blob([bytes], { type: mimeType });
    } catch (error) {
      const cryptoError = new CryptoError(
        "Base64 to blob conversion failed",
        "BASE64_TO_BLOB_ERROR",
        error as Error,
      );
      logger.error("Base64 to blob conversion failed", cryptoError);
      throw cryptoError;
    }
  }
}
