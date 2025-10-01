import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 암호화 관련 유틸리티 함수들
export const cryptoUtils = {
  /**
   * 안전한 문자열을 Uint8Array로 변환
   */
  stringToUint8Array(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  },

  /**
   * Uint8Array를 문자열로 변환
   */
  uint8ArrayToString(uint8Array: Uint8Array): string {
    return new TextDecoder().decode(uint8Array);
  },

  /**
   * 바이트 배열을 hex 문자열로 변환
   */
  bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  },

  /**
   * hex 문자열을 바이트 배열로 변환
   */
  hexToBytes(hex: string): Uint8Array {
    const cleanHex = hex.replace(/[^0-9a-fA-F]/g, "");
    const result = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      result[i / 2] = parseInt(cleanHex.slice(i, i + 2), 16);
    }
    return result;
  },

  /**
   * Base64 문자열 검증
   */
  isValidBase64(str: string): boolean {
    try {
      return btoa(atob(str)) === str;
    } catch {
      return false;
    }
  },

  /**
   * 안전한 랜덤 바이트 생성
   */
  generateRandomBytes(length: number): Uint8Array {
    const bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);
    return bytes;
  },

  /**
   * 메모리 안전하게 배열 제로화
   */
  secureZeroMemory(array: Uint8Array): void {
    crypto.getRandomValues(array);
    array.fill(0);
  },

  /**
   * 파일 크기를 읽기 쉬운 형태로 변환
   */
  formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  },

  /**
   * 처리 시간 측정
   */
  measureTime<T>(fn: () => T): { result: T; duration: number } {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    return { result, duration };
  },

  /**
   * 디바운스 함수
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * 안전한 JSON 파싱
   */
  safeJsonParse<T>(jsonString: string, fallback: T): T {
    try {
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch {
      return fallback;
    }
  },

  /**
   * 브라우저 기능 지원 확인
   */
  checkBrowserSupport() {
    return {
      webCrypto:
        typeof crypto !== "undefined" && typeof crypto.subtle !== "undefined",
      webWorkers: typeof Worker !== "undefined",
      webAssembly: typeof WebAssembly !== "undefined",
      fileAPI: typeof File !== "undefined" && typeof FileReader !== "undefined",
      clipboardAPI: typeof navigator.clipboard !== "undefined",
    };
  },
};

// 에러 타입 정의
export class CryptoError extends Error {
  public code: string;
  public override cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = "CryptoError";
    this.code = code;
    if (cause) {
      this.cause = cause;
    }
  }
}

// 로깅 유틸리티
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.info(`[INFO] ${message}`, data);
    }
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },

  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error);

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === "production" && error) {
      // Sentry, LogRocket 등 에러 리포팅 서비스 연동
    }
  },

  performance: (operation: string, duration: number, data?: any) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[PERF] ${operation}: ${duration.toFixed(2)}ms`, data);
    }
  },
};

// 타입 가드 함수들
export const typeGuards = {
  isString: (value: unknown): value is string => typeof value === "string",
  isNumber: (value: unknown): value is number =>
    typeof value === "number" && !isNaN(value),
  isUint8Array: (value: unknown): value is Uint8Array =>
    value instanceof Uint8Array,
  isFile: (value: unknown): value is File => value instanceof File,
  isCryptoKey: (value: unknown): value is CryptoKey =>
    value instanceof CryptoKey,
};
