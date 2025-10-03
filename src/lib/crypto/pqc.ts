import type { KeyEncoding } from "@/lib/crypto/shared";
import { decodeToBytes, encodeBytes } from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";
import type { DilithiumInterface } from "dilithium-crystals-js/dist/dilithium.min";

// Performance monitoring and caching interfaces
interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
  level?: number;
}

interface ProgressCallback {
  (progress: number, message?: string): void;
}

interface ModuleCache {
  kyber: Map<KyberLevel, Promise<any>>;
  dilithium: Promise<DilithiumInterface> | null;
  lastAccess: Map<string, number>;
}

// Enhanced module loading with LRU cache
const moduleCache: ModuleCache = {
  kyber: new Map(),
  dilithium: null,
  lastAccess: new Map(),
};

// Performance metrics collection
const performanceMetrics: PerformanceMetrics[] = [];
const MAX_METRICS_HISTORY = 100;
const CACHE_CLEANUP_INTERVAL = 300000; // 5 minutes
const MAX_CACHE_AGE = 1800000; // 30 minutes

// Memory management utilities
const sensitiveDataRefs = new WeakSet();

let kyberModulePromise: Promise<
  typeof import("crystals-kyber-js")
> | null = null;
let dilithiumInstancePromise: Promise<DilithiumInterface> | null = null;

function toDilithiumKind(level: DilithiumLevel): number {
  switch (level) {
    case 2:
      return 0;
    case 3:
      return 1;
    case 5:
      return 2;
    default:
      throw createPQCError(
        `Unsupported Dilithium level: ${level}`,
        'DILITHIUM_LEVEL_UNSUPPORTED',
        { level }
      );
  }
}

export type KyberLevel = 512 | 768 | 1024;
export type DilithiumLevel = 2 | 3 | 5;

// Performance monitoring utilities
function startPerformanceMetric(operation: string, level?: number): PerformanceMetrics {
  const metric: PerformanceMetrics = {
    startTime: performance.now(),
    operation,
    level,
  };
  return metric;
}

function endPerformanceMetric(metric: PerformanceMetrics): void {
  metric.endTime = performance.now();
  metric.duration = metric.endTime - metric.startTime;

  performanceMetrics.push(metric);
  if (performanceMetrics.length > MAX_METRICS_HISTORY) {
    performanceMetrics.shift();
  }
}

// Secure memory cleanup for sensitive data
function secureCleanup(data: Uint8Array | string): void {
  if (data instanceof Uint8Array) {
    // Overwrite with random data before cleanup
    if (crypto.getRandomValues) {
      crypto.getRandomValues(data);
    } else {
      // Fallback: overwrite with zeros
      data.fill(0);
    }
    sensitiveDataRefs.add(data);
  }
}

// Cache management with LRU eviction
function cleanupCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];

  for (const [key, lastAccess] of moduleCache.lastAccess.entries()) {
    if (now - lastAccess > MAX_CACHE_AGE) {
      keysToDelete.push(key);
    }
  }

  for (const key of keysToDelete) {
    moduleCache.lastAccess.delete(key);
    // Extract level from key format "kyber-${level}"
    if (key.startsWith('kyber-')) {
      const level = parseInt(key.split('-')[1]) as KyberLevel;
      moduleCache.kyber.delete(level);
    }
  }
}

// Browser compatibility detection
function detectBrowserCapabilities(): {
  webWorkers: boolean;
  webAssembly: boolean;
  cryptoRandom: boolean;
  sharedArrayBuffer: boolean;
} {
  return {
    webWorkers: typeof Worker !== 'undefined',
    webAssembly: typeof WebAssembly !== 'undefined',
    cryptoRandom: typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function',
    sharedArrayBuffer: typeof SharedArrayBuffer !== 'undefined',
  };
}

// Enhanced error handling with context
function createPQCError(message: string, code: string, context?: any): CryptoError {
  const error = new CryptoError(message, code);
  if (context) {
    (error as any).context = context;
  }
  return error;
}

// Set up cache cleanup interval
let cacheCleanupInterval: NodeJS.Timeout | null = null;
if (typeof setInterval !== 'undefined') {
  cacheCleanupInterval = setInterval(cleanupCache, CACHE_CLEANUP_INTERVAL);
}

// Export performance monitoring for debugging
export function getPQCPerformanceMetrics(): PerformanceMetrics[] {
  return [...performanceMetrics];
}

export function clearPQCPerformanceMetrics(): void {
  performanceMetrics.length = 0;
}

export function getBrowserCapabilities() {
  return detectBrowserCapabilities();
}

// Enhanced module loading with intelligent caching
async function loadKyber() {
  const metric = startPerformanceMetric('kyber-module-load');
  try {
    if (!kyberModulePromise) {
      const capabilities = detectBrowserCapabilities();
      if (!capabilities.webAssembly) {
        throw createPQCError(
          'WebAssembly not supported in this browser',
          'BROWSER_INCOMPATIBLE',
          { missing: 'WebAssembly' }
        );
      }
      kyberModulePromise = import("crystals-kyber-js");
    }
    const result = await kyberModulePromise;
    endPerformanceMetric(metric);
    return result;
  } catch (error) {
    endPerformanceMetric(metric);
    throw createPQCError(
      'Failed to load Kyber module',
      'MODULE_LOAD_FAILED',
      { originalError: error }
    );
  }
}

async function loadDilithium(): Promise<DilithiumInterface> {
  const metric = startPerformanceMetric('dilithium-module-load');
  if (dilithiumInstancePromise) {
    moduleCache.lastAccess.set('dilithium', Date.now());
    endPerformanceMetric(metric);
    return dilithiumInstancePromise;
  }

  dilithiumInstancePromise = (async () => {
    try {
      const capabilities = detectBrowserCapabilities();
      if (!capabilities.cryptoRandom) {
        throw createPQCError(
          'Secure random number generation not available',
          'BROWSER_INCOMPATIBLE',
          { missing: 'crypto.getRandomValues' }
        );
      }

      if (typeof window === 'undefined') {
        throw createPQCError(
          'Dilithium module can only be loaded in the browser',
          'ENVIRONMENT_UNSUPPORTED'
        );
      }

      const [{ createDilithium }] = await Promise.all([
        import("dilithium-crystals-js/dist/dilithium.min.js"),
      ]);

      const assetPrefix =
        (typeof window !== 'undefined' && (window as any).__NEXT_DATA__?.assetPrefix) ??
        process.env.NEXT_PUBLIC_ASSET_PREFIX ??
        "";

      const normalizedPrefix = typeof assetPrefix === 'string'
        ? assetPrefix.replace(/\/$/, "")
        : "";

      const wasmRelativePath = normalizedPrefix
        ? `${normalizedPrefix}/dilithium.wasm`
        : "/dilithium.wasm";

      const wasmPath = normalizedPrefix.startsWith("http")
        ? `${normalizedPrefix}/dilithium.wasm`
        : new URL(
            wasmRelativePath.startsWith("/") ? wasmRelativePath : `/${wasmRelativePath}`,
            window.location.origin,
          ).toString();

      const chromeObj = (window as any).chrome ?? ((window as any).chrome = {});
      const runtime = chromeObj.runtime ?? (chromeObj.runtime = {});
      const originalGetURL: ((path: string) => string) | undefined = runtime.getURL?.bind(runtime);

      runtime.getURL = (path: string) => {
        if (path === 'dilithium.wasm' || path.endsWith('/dilithium.wasm')) {
          return wasmPath;
        }

        if (normalizedPrefix && !normalizedPrefix.startsWith('http')) {
          const cleaned = path.startsWith('/') ? path.slice(1) : path;
          return `${normalizedPrefix}/${cleaned}`;
        }

        if (normalizedPrefix && normalizedPrefix.startsWith('http')) {
          const cleaned = path.startsWith('/') ? path : `/${path}`;
          return `${normalizedPrefix}${cleaned}`;
        }

        return path.startsWith('/') ? path : `/${path}`;
      };

      try {
        const module = await (createDilithium as () => Promise<DilithiumInterface> )();

        moduleCache.lastAccess.set('dilithium', Date.now());
        return module;
      } finally {
        if (originalGetURL) {
          runtime.getURL = originalGetURL;
        } else {
          delete runtime.getURL;
        }
      }
    } catch (error) {
      console.error('[Dilithium] Error during module loading or initialization:', error);
      dilithiumInstancePromise = null; // Clear promise on failure to allow retry
      throw createPQCError(
        'Failed to load or initialize Dilithium module. Ensure all dependencies are met and environment is compatible.',
        'MODULE_LOAD_FAILED',
        { originalError: error }
      );
    } finally {
      endPerformanceMetric(metric);
    }
  })();

  return dilithiumInstancePromise;
}

// Enhanced Kyber instance creation with caching and validation
function createKyberInstance(level: KyberLevel) {
  const cacheKey = `kyber-${level}`;

  if (!moduleCache.kyber.has(level)) {
    const metric = startPerformanceMetric('kyber-instance-create', level);
    const instancePromise = loadKyber().then((mod) => {
      try {
        let instance;
        switch (level) {
          case 512:
            instance = new mod.MlKem512();
            break;
          case 768:
            instance = new mod.MlKem768();
            break;
          case 1024:
            instance = new mod.MlKem1024();
            break;
          default:
            throw createPQCError(
              `Unsupported Kyber level: ${level}`,
              "KYBER_LEVEL_UNSUPPORTED",
              { level }
            );
        }
        endPerformanceMetric(metric);
        return instance;
      } catch (error) {
        endPerformanceMetric(metric);
        throw error;
      }
    });

    moduleCache.kyber.set(level, instancePromise);
    moduleCache.lastAccess.set(cacheKey, Date.now());
  } else {
    moduleCache.lastAccess.set(cacheKey, Date.now());
  }

  return moduleCache.kyber.get(level)!;
}

export interface KyberKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface KyberEncapsulation {
  ciphertext: string;
  sharedSecret: string;
}

// Enhanced functions with progress reporting and security hardening
export async function kyberGenerateKeyPair(
  level: KyberLevel = 768,
  onProgress?: ProgressCallback,
): Promise<KyberKeyPair> {
  const metric = startPerformanceMetric('kyber-keygen', level);

  try {
    onProgress?.(0.1, 'Initializing Kyber instance...');

    // Input validation
    if (![512, 768, 1024].includes(level)) {
      throw createPQCError(
        `Invalid Kyber level: ${level}`,
        'INVALID_PARAMETER',
        { parameter: 'level', value: level }
      );
    }

    onProgress?.(0.3, 'Loading cryptographic modules...');
    const instance = await createKyberInstance(level);

    onProgress?.(0.7, 'Generating key pair...');
    const [publicKey, privateKey] = await instance.generateKeyPair();

    onProgress?.(0.9, 'Encoding keys...');
    const result = {
      publicKey: encodeBytes(publicKey, "base64"),
      privateKey: encodeBytes(privateKey, "base64"),
    };

    // Secure cleanup of raw key material
    secureCleanup(publicKey);
    secureCleanup(privateKey);

    onProgress?.(1.0, 'Key pair generated successfully');
    endPerformanceMetric(metric);
    return result;
  } catch (error) {
    endPerformanceMetric(metric);
    onProgress?.(0, 'Key generation failed');
    throw error instanceof CryptoError ? error : createPQCError(
      'Kyber key generation failed',
      'KEYGEN_FAILED',
      { originalError: error, level }
    );
  }
}

export async function kyberEncapsulate(
  publicKey: string,
  level: KyberLevel = 768,
  encoding: KeyEncoding = "base64",
  onProgress?: ProgressCallback,
): Promise<KyberEncapsulation> {
  const metric = startPerformanceMetric('kyber-encapsulate', level);

  try {
    onProgress?.(0.1, 'Validating inputs...');

    // Input validation
    if (!publicKey?.trim()) {
      throw createPQCError('Public key is required', 'INVALID_PARAMETER', { parameter: 'publicKey' });
    }
    if (![512, 768, 1024].includes(level)) {
      throw createPQCError(`Invalid Kyber level: ${level}`, 'INVALID_PARAMETER', { parameter: 'level', value: level });
    }

    onProgress?.(0.3, 'Creating Kyber instance...');
    const instance = await createKyberInstance(level);

    onProgress?.(0.5, 'Decoding public key...');
    const keyBytes = decodeToBytes(publicKey, encoding);

    onProgress?.(0.7, 'Performing encapsulation...');
    const [ciphertext, sharedSecret] = await instance.encap(keyBytes);

    onProgress?.(0.9, 'Encoding results...');
    const result = {
      ciphertext: encodeBytes(ciphertext, "base64"),
      sharedSecret: encodeBytes(sharedSecret, "base64"),
    };

    // Secure cleanup
    secureCleanup(keyBytes);
    secureCleanup(sharedSecret);

    onProgress?.(1.0, 'Encapsulation completed');
    endPerformanceMetric(metric);
    return result;
  } catch (error) {
    endPerformanceMetric(metric);
    onProgress?.(0, 'Encapsulation failed');
    throw error instanceof CryptoError ? error : createPQCError(
      'Kyber encapsulation failed',
      'ENCAPSULATE_FAILED',
      { originalError: error, level, encoding }
    );
  }
}

export async function kyberDecapsulate(
  ciphertext: string,
  privateKey: string,
  level: KyberLevel = 768,
  encoding: KeyEncoding = "base64",
  onProgress?: ProgressCallback,
): Promise<string> {
  const metric = startPerformanceMetric('kyber-decapsulate', level);

  try {
    onProgress?.(0.1, 'Validating inputs...');

    // Input validation
    if (!ciphertext?.trim()) {
      throw createPQCError('Ciphertext is required', 'INVALID_PARAMETER', { parameter: 'ciphertext' });
    }
    if (!privateKey?.trim()) {
      throw createPQCError('Private key is required', 'INVALID_PARAMETER', { parameter: 'privateKey' });
    }
    if (![512, 768, 1024].includes(level)) {
      throw createPQCError(`Invalid Kyber level: ${level}`, 'INVALID_PARAMETER', { parameter: 'level', value: level });
    }

    onProgress?.(0.3, 'Creating Kyber instance...');
    const instance = await createKyberInstance(level);

    onProgress?.(0.5, 'Decoding inputs...');
    const ctBytes = decodeToBytes(ciphertext, encoding);
    const skBytes = decodeToBytes(privateKey, encoding);

    onProgress?.(0.8, 'Performing decapsulation...');
    const sharedSecret = await instance.decap(ctBytes, skBytes);

    onProgress?.(0.9, 'Encoding result...');
    const result = encodeBytes(sharedSecret, "base64");

    // Secure cleanup
    secureCleanup(ctBytes);
    secureCleanup(skBytes);
    secureCleanup(sharedSecret);

    onProgress?.(1.0, 'Decapsulation completed');
    endPerformanceMetric(metric);
    return result;
  } catch (error) {
    endPerformanceMetric(metric);
    onProgress?.(0, 'Decapsulation failed');
    throw error instanceof CryptoError ? error : createPQCError(
      'Kyber decapsulation failed',
      'DECAPSULATE_FAILED',
      { originalError: error, level, encoding }
    );
  }
}

export interface DilithiumKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface DilithiumSignature {
  signature: string;
  message: string;
}

export async function dilithiumGenerateKeyPair(
  level: DilithiumLevel = 2,
): Promise<DilithiumKeyPair> {
  const dilithium = await loadDilithium();
  if (!dilithium) {
    throw createPQCError('Dilithium module not loaded', 'MODULE_NOT_LOADED');
  }

  const kind = toDilithiumKind(level);
  const { result, publicKey, privateKey } = dilithium.generateKeys(kind);

  if (result !== 0 || !publicKey || !privateKey) {
    throw createPQCError(
      'Dilithium key generation failed',
      'KEYGEN_FAILED',
      { level, kind, result }
    );
  }

  return {
    publicKey: encodeBytes(publicKey, "base64"),
    privateKey: encodeBytes(privateKey, "base64"),
  };
}

export async function dilithiumSign(
  message: string,
  privateKey: string,
  level: DilithiumLevel = 2,
  encoding: KeyEncoding = "base64",
): Promise<DilithiumSignature> {
  const dilithium = await loadDilithium();
  if (!dilithium) {
    throw createPQCError('Dilithium module not loaded', 'MODULE_NOT_LOADED');
  }

  const messageBytes = cryptoUtils.stringToUint8Array(message);
  const privKeyBytes = decodeToBytes(privateKey, encoding);
  const kind = toDilithiumKind(level);

  const { result, signature } = dilithium.sign(messageBytes, privKeyBytes, kind);

  if (result !== 0 || !signature) {
    throw createPQCError(
      'Dilithium signing failed',
      'SIGN_FAILED',
      { level, kind, result }
    );
  }

  return {
    signature: encodeBytes(signature, "base64"),
    message,
  };
}

export async function dilithiumVerify(
  message: string,
  signature: string,
  publicKey: string,
  level: DilithiumLevel = 2,
  encoding: KeyEncoding = "base64",
): Promise<boolean> {
  const dilithium = await loadDilithium();
  if (!dilithium) {
    throw createPQCError('Dilithium module not loaded', 'MODULE_NOT_LOADED');
  }

  const messageBytes = cryptoUtils.stringToUint8Array(message);
  const signatureBytes = decodeToBytes(signature, encoding);
  const publicKeyBytes = decodeToBytes(publicKey, encoding);
  const kind = toDilithiumKind(level);

  const { result } = dilithium.verify(
    signatureBytes,
    messageBytes,
    publicKeyBytes,
    kind,
  );

  return result === 0;
}

// Batch processing utilities for improved performance
export interface BatchOperation<T, R> {
  id: string;
  operation: T;
}

export interface BatchResult<R> {
  id: string;
  result?: R;
  error?: Error;
}

export async function processBatch<T, R>(
  operations: BatchOperation<T, R>[],
  processor: (operation: T, onProgress?: ProgressCallback) => Promise<R>,
  maxConcurrency: number = 3,
  onProgress?: (completed: number, total: number) => void,
): Promise<BatchResult<R>[]> {
  const results: BatchResult<R>[] = [];
  const semaphore = new Array(maxConcurrency).fill(null);
  let completed = 0;

  const processOperation = async (op: BatchOperation<T, R>): Promise<void> => {
    try {
      const result = await processor(op.operation);
      results.push({ id: op.id, result });
    } catch (error) {
      results.push({ id: op.id, error: error as Error });
    } finally {
      completed++;
      onProgress?.(completed, operations.length);
    }
  };

  // Process operations with concurrency limit
  await Promise.all(
    operations.map(async (op) => {
      await new Promise<void>((resolve) => {
        const index = semaphore.indexOf(null);
        if (index !== -1) {
          semaphore[index] = processOperation(op).finally(() => {
            semaphore[index] = null;
            resolve();
          });
        } else {
          // Wait for a slot to become available
          const waitForSlot = () => {
            const index = semaphore.indexOf(null);
            if (index !== -1) {
              semaphore[index] = processOperation(op).finally(() => {
                semaphore[index] = null;
                resolve();
              });
            } else {
              setTimeout(waitForSlot, 10);
            }
          };
          waitForSlot();
        }
      });
    })
  );

  return results;
}

// Resource cleanup and memory management
export function cleanupPQCResources(): void {
  // Clear module cache
  moduleCache.kyber.clear();
  moduleCache.dilithium = null;
  moduleCache.lastAccess.clear();

  // Clear performance metrics
  performanceMetrics.length = 0;

  // Reset module promises
  kyberModulePromise = null;
  dilithiumInstancePromise = null;

  // Clear cache cleanup interval
  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
    cacheCleanupInterval = null;
  }
}

// Browser optimization utilities
export function optimizeForBrowser(): {
  preloadModules: boolean;
  enableCaching: boolean;
  maxConcurrency: number;
  recommendedBatchSize: number;
} {
  const capabilities = detectBrowserCapabilities();
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

  // Optimize based on browser capabilities
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isChrome = /Chrome/.test(userAgent);

  return {
    preloadModules: capabilities.webAssembly && !isMobile,
    enableCaching: true,
    maxConcurrency: isMobile ? 1 : isChrome ? 4 : 2,
    recommendedBatchSize: isMobile ? 5 : 20,
  };
}

// Export enhanced options interface
export interface PQCOptions {
  onProgress?: ProgressCallback;
  enableCaching?: boolean;
  timeout?: number;
  secureCleanup?: boolean;
}
