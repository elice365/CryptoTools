import { cryptoUtils, CryptoError, logger } from "@/lib/utils";

export type AsymmetricAlgorithm = "rsa" | "ecc";

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  algorithm: string;
  keySize?: number;
}

export interface AsymmetricOptions {
  keySize?: number;
  outputFormat?: "hex" | "base64";
  curve?: string; // ECC용
}

export class AsymmetricCrypto {
  /**
   * RSA 키 쌍 생성 (Web Crypto API 사용)
   */
  static async generateRSAKeyPair(keySize: number = 2048): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: keySize,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: "SHA-256",
        },
        true,
        ["encrypt", "decrypt"],
      );

      const publicKeyData = await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey,
      );
      const privateKeyData = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey,
      );

      const publicKeyPem = this.arrayBufferToPem(publicKeyData, "PUBLIC KEY");
      const privateKeyPem = this.arrayBufferToPem(
        privateKeyData,
        "PRIVATE KEY",
      );

      const result: KeyPair = {
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
        algorithm: "rsa",
        keySize,
      };

      logger.info("RSA key pair generated", {
        keySize,
        publicKeyLength: publicKeyPem.length,
        privateKeyLength: privateKeyPem.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "RSA key pair generation failed",
        "RSA_KEYGEN_ERROR",
        error as Error,
      );
      logger.error("RSA key pair generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * RSA 암호화 (공개키 사용)
   */
  static async encryptRSA(
    plaintext: string,
    publicKeyPem: string,
  ): Promise<string> {
    try {
      // PEM을 ArrayBuffer로 변환
      const publicKeyData = this.pemToArrayBuffer(publicKeyPem, "PUBLIC KEY");

      // 공개키 임포트
      const publicKey = await crypto.subtle.importKey(
        "spki",
        publicKeyData,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["encrypt"],
      );

      // 데이터를 ArrayBuffer로 변환
      const data = cryptoUtils.stringToUint8Array(plaintext);

      // 암호화
      const encrypted = await crypto.subtle.encrypt(
        {
          name: "RSA-OAEP",
        },
        publicKey,
        data as BufferSource,
      );

      const result = cryptoUtils.bytesToHex(new Uint8Array(encrypted));

      logger.info("RSA encryption completed", {
        plaintextLength: plaintext.length,
        ciphertextLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "RSA encryption failed",
        "RSA_ENCRYPT_ERROR",
        error as Error,
      );
      logger.error("RSA encryption failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * RSA 복호화 (개인키 사용)
   */
  static async decryptRSA(
    ciphertext: string,
    privateKeyPem: string,
  ): Promise<string> {
    try {
      // PEM을 ArrayBuffer로 변환
      const privateKeyData = this.pemToArrayBuffer(
        privateKeyPem,
        "PRIVATE KEY",
      );

      // 개인키 임포트
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyData,
        {
          name: "RSA-OAEP",
          hash: "SHA-256",
        },
        false,
        ["decrypt"],
      );

      // 암호문을 ArrayBuffer로 변환
      const encryptedData = cryptoUtils.hexToBytes(ciphertext);

      // 복호화
      const decrypted = await crypto.subtle.decrypt(
        {
          name: "RSA-OAEP",
        },
        privateKey,
        encryptedData as BufferSource,
      );

      const result = cryptoUtils.uint8ArrayToString(new Uint8Array(decrypted));

      logger.info("RSA decryption completed", {
        ciphertextLength: ciphertext.length,
        plaintextLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "RSA decryption failed",
        "RSA_DECRYPT_ERROR",
        error as Error,
      );
      logger.error("RSA decryption failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * ECDSA 키 쌍 생성
   */
  static async generateECDSAKeyPair(curve: string = "P-256"): Promise<KeyPair> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: "ECDSA",
          namedCurve: curve,
        },
        true,
        ["sign", "verify"],
      );

      const publicKeyData = await crypto.subtle.exportKey(
        "spki",
        keyPair.publicKey,
      );
      const privateKeyData = await crypto.subtle.exportKey(
        "pkcs8",
        keyPair.privateKey,
      );

      const publicKeyPem = this.arrayBufferToPem(publicKeyData, "PUBLIC KEY");
      const privateKeyPem = this.arrayBufferToPem(
        privateKeyData,
        "PRIVATE KEY",
      );

      const result: KeyPair = {
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
        algorithm: "ecdsa",
        keySize: curve === "P-256" ? 256 : curve === "P-384" ? 384 : 521,
      };

      logger.info("ECDSA key pair generated", {
        curve,
        publicKeyLength: publicKeyPem.length,
        privateKeyLength: privateKeyPem.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "ECDSA key pair generation failed",
        "ECDSA_KEYGEN_ERROR",
        error as Error,
      );
      logger.error("ECDSA key pair generation failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * ECDSA 서명 생성
   */
  static async signECDSA(
    message: string,
    privateKeyPem: string,
  ): Promise<string> {
    try {
      // PEM을 ArrayBuffer로 변환
      const privateKeyData = this.pemToArrayBuffer(
        privateKeyPem,
        "PRIVATE KEY",
      );

      // 개인키 임포트
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyData,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        false,
        ["sign"],
      );

      // 메시지를 ArrayBuffer로 변환
      const data = cryptoUtils.stringToUint8Array(message);

      // 서명 생성
      const signature = await crypto.subtle.sign(
        {
          name: "ECDSA",
          hash: "SHA-256",
        },
        privateKey,
        data as BufferSource,
      );

      const result = cryptoUtils.bytesToHex(new Uint8Array(signature));

      logger.info("ECDSA signature generated", {
        messageLength: message.length,
        signatureLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "ECDSA signing failed",
        "ECDSA_SIGN_ERROR",
        error as Error,
      );
      logger.error("ECDSA signing failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * ECDSA 서명 검증
   */
  static async verifyECDSA(
    message: string,
    signature: string,
    publicKeyPem: string,
  ): Promise<boolean> {
    try {
      // PEM을 ArrayBuffer로 변환
      const publicKeyData = this.pemToArrayBuffer(publicKeyPem, "PUBLIC KEY");

      // 공개키 임포트
      const publicKey = await crypto.subtle.importKey(
        "spki",
        publicKeyData,
        {
          name: "ECDSA",
          namedCurve: "P-256",
        },
        false,
        ["verify"],
      );

      // 메시지와 서명을 ArrayBuffer로 변환
      const data = cryptoUtils.stringToUint8Array(message);
      const signatureData = cryptoUtils.hexToBytes(signature);

      // 서명 검증
      const isValid = await crypto.subtle.verify(
        {
          name: "ECDSA",
          hash: "SHA-256",
        },
        publicKey,
        signatureData as BufferSource,
        data as BufferSource,
      );

      logger.info("ECDSA signature verification completed", {
        messageLength: message.length,
        signatureLength: signature.length,
        isValid,
      });

      return isValid;
    } catch (error) {
      const cryptoError = new CryptoError(
        "ECDSA verification failed",
        "ECDSA_VERIFY_ERROR",
        error as Error,
      );
      logger.error("ECDSA verification failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * RSA 서명 생성 (PSS)
   */
  static async signRSA(
    message: string,
    privateKeyPem: string,
  ): Promise<string> {
    try {
      // PEM을 ArrayBuffer로 변환
      const privateKeyData = this.pemToArrayBuffer(
        privateKeyPem,
        "PRIVATE KEY",
      );

      // 개인키 임포트
      const privateKey = await crypto.subtle.importKey(
        "pkcs8",
        privateKeyData,
        {
          name: "RSA-PSS",
          hash: "SHA-256",
        },
        false,
        ["sign"],
      );

      // 메시지를 ArrayBuffer로 변환
      const data = cryptoUtils.stringToUint8Array(message);

      // 서명 생성
      const signature = await crypto.subtle.sign(
        {
          name: "RSA-PSS",
          saltLength: 32,
        },
        privateKey,
        data as BufferSource,
      );

      const result = cryptoUtils.bytesToHex(new Uint8Array(signature));

      logger.info("RSA signature generated", {
        messageLength: message.length,
        signatureLength: result.length,
      });

      return result;
    } catch (error) {
      const cryptoError = new CryptoError(
        "RSA signing failed",
        "RSA_SIGN_ERROR",
        error as Error,
      );
      logger.error("RSA signing failed", cryptoError);
      throw cryptoError;
    }
  }

  /**
   * ArrayBuffer를 PEM 형식으로 변환
   */
  private static arrayBufferToPem(buffer: ArrayBuffer, type: string): string {
    const binary = String.fromCharCode(...new Uint8Array(buffer));
    const base64 = btoa(binary);
    const lines = base64.match(/.{1,64}/g) || [];
    return `-----BEGIN ${type}-----\n${lines.join("\n")}\n-----END ${type}-----`;
  }

  /**
   * PEM을 ArrayBuffer로 변환
   */
  private static pemToArrayBuffer(pem: string, type: string): ArrayBuffer {
    const base64 = pem
      .replace(`-----BEGIN ${type}-----`, "")
      .replace(`-----END ${type}-----`, "")
      .replace(/\s/g, "");

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
  }

  /**
   * 키 정보 추출
   */
  static analyzeKey(keyPem: string): any {
    try {
      const isPrivate = keyPem.includes("PRIVATE KEY");
      const isPublic = keyPem.includes("PUBLIC KEY");

      let algorithm = "unknown";
      if (keyPem.includes("RSA")) {
        algorithm = "rsa";
      } else if (keyPem.includes("EC")) {
        algorithm = "ecc";
      }

      return {
        type: isPrivate ? "private" : isPublic ? "public" : "unknown",
        algorithm,
        length: keyPem.length,
        isValid: isPrivate || isPublic,
      };
    } catch (error) {
      return {
        type: "unknown",
        algorithm: "unknown",
        length: 0,
        isValid: false,
      };
    }
  }
}
