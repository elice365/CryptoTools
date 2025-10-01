import { randomBytes } from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";

export interface BgvParameters {
  n: number;
  q: bigint;
  t: bigint;
  delta: bigint;
}

export interface BgvSecretKey {
  s: bigint[];
  evalKey: BgvCiphertext;
}

export interface BgvPublicKey {
  a: bigint[];
  b: bigint[];
}

export interface BgvKeyPair {
  publicKey: BgvPublicKey;
  secretKey: BgvSecretKey;
  params: BgvParameters;
}

export interface BgvCiphertext {
  c0: bigint[];
  c1: bigint[];
}

export interface BgvPlaintext {
  coefficients: bigint[];
}

const DEFAULT_PARAMS: BgvParameters = {
  n: 4,
  q: 1n << 32n,
  t: 256n,
  delta: (1n << 32n) / 256n,
};

function modQ(value: bigint, q: bigint): bigint {
  const result = value % q;
  return result >= 0n ? result : result + q;
}

function polyMod(poly: bigint[], q: bigint): bigint[] {
  return poly.map((coef) => modQ(coef, q));
}

function polyAdd(a: bigint[], b: bigint[], q: bigint): bigint[] {
  return a.map((coef, idx) => modQ(coef + b[idx], q));
}

function polySub(a: bigint[], b: bigint[], q: bigint): bigint[] {
  return a.map((coef, idx) => modQ(coef - b[idx], q));
}

function polyMul(a: bigint[], b: bigint[], params: BgvParameters): bigint[] {
  const { n, q } = params;
  const result = new Array<bigint>(n).fill(0n);
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const idx = (i + j) % n;
      const product = a[i] * b[j];
      if (i + j >= n) {
        result[idx] = modQ(result[idx] - product, q);
      } else {
        result[idx] = modQ(result[idx] + product, q);
      }
    }
  }
  return result;
}

function sampleSmallPolynomial(n: number): bigint[] {
  return Array.from({ length: n }, () => BigInt((Math.random() * 3) | 0) - 1n);
}

function sampleBinaryPolynomial(n: number): bigint[] {
  return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1n : 0n));
}

function sampleUniformPolynomial(n: number, q: bigint): bigint[] {
  const result: bigint[] = [];
  for (let i = 0; i < n; i += 1) {
    const bytes = randomBytes(4);
    const value =
      (BigInt(bytes[0]) << 24n) |
      (BigInt(bytes[1]) << 16n) |
      (BigInt(bytes[2]) << 8n) |
      BigInt(bytes[3]);
    result.push(modQ(value, q));
  }
  return result;
}

function encodeTextToPolynomial(
  text: string,
  params: BgvParameters,
): BgvPlaintext {
  const { n, t } = params;
  const bytes = cryptoUtils.stringToUint8Array(text).slice(0, n);
  const coefficients = new Array<bigint>(n).fill(0n);
  bytes.forEach((byte, index) => {
    coefficients[index] = BigInt(byte) % t;
  });
  return { coefficients };
}

function decodePolynomialToText(plaintext: BgvPlaintext): string {
  const bytes = new Uint8Array(plaintext.coefficients.length);
  plaintext.coefficients.forEach((coef, idx) => {
    let value = Number(coef);
    if (value < 0) value += 256;
    bytes[idx] = value % 256;
  });
  return cryptoUtils.uint8ArrayToString(bytes);
}

export function generateBgvKeyPair(
  params: BgvParameters = DEFAULT_PARAMS,
): BgvKeyPair {
  const s = sampleBinaryPolynomial(params.n);
  const a = sampleUniformPolynomial(params.n, params.q);
  const e = sampleSmallPolynomial(params.n);
  const as = polyMul(a, s, params);
  const b = polySub(polyMul(a, s, params), e, params).map((coef) =>
    modQ(-coef, params.q),
  );
  const pk: BgvPublicKey = { a, b };
  const sSquared = polyMul(s, s, params);
  const evalKey = encryptPolynomial(pk, sSquared, params);
  return {
    publicKey: pk,
    secretKey: {
      s,
      evalKey,
    },
    params,
  };
}

export function encryptPolynomial(
  publicKey: BgvPublicKey,
  message: bigint[],
  params: BgvParameters = DEFAULT_PARAMS,
): BgvCiphertext {
  const r = sampleBinaryPolynomial(params.n);
  const e1 = sampleSmallPolynomial(params.n);
  const e2 = sampleSmallPolynomial(params.n);
  const scaledMessage = message.map((coef) =>
    modQ(coef * params.delta, params.q),
  );
  const br = polyMul(publicKey.b, r, params);
  const ar = polyMul(publicKey.a, r, params);

  const c0 = polyAdd(polyAdd(br, scaledMessage, params.q), e1, params.q).map(
    (coef) => modQ(coef, params.q),
  );
  const c1 = polyAdd(ar, e2, params.q);
  return { c0, c1 };
}

export function encryptText(
  publicKey: BgvPublicKey,
  text: string,
  params: BgvParameters = DEFAULT_PARAMS,
): BgvCiphertext {
  const plaintext = encodeTextToPolynomial(text, params);
  return encryptPolynomial(publicKey, plaintext.coefficients, params);
}

export function decryptCiphertext(
  secretKey: BgvSecretKey,
  cipher: BgvCiphertext,
  params: BgvParameters = DEFAULT_PARAMS,
): BgvPlaintext {
  const { s } = secretKey;
  const c1s = polyMul(cipher.c1, s, params);
  const m = polyAdd(cipher.c0, c1s, params.q);
  const rounded = m.map((coef) => {
    const value = modQ(coef, params.q);
    return ((value + params.delta / 2n) / params.delta) % params.t;
  });
  return { coefficients: rounded };
}

export function decryptToText(
  secretKey: BgvSecretKey,
  cipher: BgvCiphertext,
  params: BgvParameters = DEFAULT_PARAMS,
): string {
  const plaintext = decryptCiphertext(secretKey, cipher, params);
  return decodePolynomialToText(plaintext);
}

export function addCiphertexts(
  cipherA: BgvCiphertext,
  cipherB: BgvCiphertext,
  params: BgvParameters = DEFAULT_PARAMS,
): BgvCiphertext {
  return {
    c0: polyAdd(cipherA.c0, cipherB.c0, params.q),
    c1: polyAdd(cipherA.c1, cipherB.c1, params.q),
  };
}

export function multiplyCiphertexts(
  secretKey: BgvSecretKey,
  cipherA: BgvCiphertext,
  cipherB: BgvCiphertext,
  params: BgvParameters = DEFAULT_PARAMS,
): BgvCiphertext {
  const c0 = polyMul(cipherA.c0, cipherB.c0, params);
  const c1 = polyAdd(
    polyMul(cipherA.c0, cipherB.c1, params),
    polyMul(cipherA.c1, cipherB.c0, params),
    params.q,
  );
  const c2 = polyMul(cipherA.c1, cipherB.c1, params);

  // Relinearize using evaluation key (encryption of s^2)
  const relinearizedC0 = polyAdd(
    c0,
    polyMul(c2, secretKey.evalKey.c0, params),
    params.q,
  );
  const relinearizedC1 = polyAdd(
    c1,
    polyMul(c2, secretKey.evalKey.c1, params),
    params.q,
  );

  return {
    c0: polyMod(relinearizedC0, params.q),
    c1: polyMod(relinearizedC1, params.q),
  };
}

export function stringifyCiphertext(cipher: BgvCiphertext): string {
  return JSON.stringify({
    c0: cipher.c0.map((coef) => coef.toString()),
    c1: cipher.c1.map((coef) => coef.toString()),
  });
}

export function parseCiphertext(serialized: string): BgvCiphertext {
  const parsed = JSON.parse(serialized) as { c0: string[]; c1: string[] };
  return {
    c0: parsed.c0.map((coef) => BigInt(coef)),
    c1: parsed.c1.map((coef) => BigInt(coef)),
  };
}

export const bgvDefaults = DEFAULT_PARAMS;

// Performance monitoring and progress reporting
export interface BgvPerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
  parameterSize?: number;
  inputSize?: number;
}

export type BgvProgressCallback = (progress: number, message?: string) => void;

// Browser compatibility and optimization
export interface BgvConfig {
  parameterSet: 'toy' | 'small' | 'medium' | 'large';
  enableProgressReporting: boolean;
  enablePerformanceMetrics: boolean;
  batchSize: number;
  maxComputationTime: number;
}

export const BGV_PARAMETER_SETS: Record<string, BgvParameters> = {
  toy: {
    n: 4,
    q: 1n << 16n,
    t: 16n,
    delta: (1n << 16n) / 16n,
  },
  small: {
    n: 8,
    q: 1n << 32n,
    t: 256n,
    delta: (1n << 32n) / 256n,
  },
  medium: {
    n: 16,
    q: 1n << 48n,
    t: 1024n,
    delta: (1n << 48n) / 1024n,
  },
  large: {
    n: 32,
    q: 1n << 64n,
    t: 4096n,
    delta: (1n << 64n) / 4096n,
  },
};

export const DEFAULT_BGV_CONFIG: BgvConfig = {
  parameterSet: 'small',
  enableProgressReporting: true,
  enablePerformanceMetrics: true,
  batchSize: 5,
  maxComputationTime: 10000,
};

// Enhanced key generation with progress reporting
export async function generateBgvKeyPairWithProgress(
  params: BgvParameters = DEFAULT_PARAMS,
  onProgress?: BgvProgressCallback,
): Promise<BgvKeyPair> {
  const startTime = performance.now();

  onProgress?.(0, "Generating secret key polynomial...");
  const s = sampleBinaryPolynomial(params.n);

  onProgress?.(0.2, "Generating public key components...");
  const a = sampleUniformPolynomial(params.n, params.q);
  const e = sampleSmallPolynomial(params.n);

  onProgress?.(0.4, "Computing public key polynomial arithmetic...");
  const as = polyMul(a, s, params);
  const b = polySub(polyMul(a, s, params), e, params).map((coef) =>
    modQ(-coef, params.q),
  );
  const pk: BgvPublicKey = { a, b };

  onProgress?.(0.7, "Generating evaluation key for multiplication...");
  const sSquared = polyMul(s, s, params);
  const evalKey = encryptPolynomial(pk, sSquared, params);

  onProgress?.(1, "BGV key generation complete");

  return {
    publicKey: pk,
    secretKey: {
      s,
      evalKey,
    },
    params,
  };
}

// Batch encryption for performance
export async function bgvEncryptBatch(
  publicKey: BgvPublicKey,
  messages: string[],
  params: BgvParameters = DEFAULT_PARAMS,
  onProgress?: BgvProgressCallback,
  config: BgvConfig = DEFAULT_BGV_CONFIG,
): Promise<BgvCiphertext[]> {
  const results: BgvCiphertext[] = [];
  const batchSize = config.batchSize;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const batchResults = batch.map((message) =>
      encryptText(publicKey, message, params)
    );
    results.push(...batchResults);

    const progress = (i + batch.length) / messages.length;
    onProgress?.(progress, `Encrypted ${i + batch.length}/${messages.length} messages`);

    // Yield control to prevent blocking
    if (i + batchSize < messages.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  return results;
}

// Demo: Encrypted database operations
export interface EncryptedDatabase {
  records: BgvCiphertext[];
  publicKey: BgvPublicKey;
  params: BgvParameters;
}

export async function createEncryptedDatabase(
  plaintextRecords: string[],
  publicKey: BgvPublicKey,
  params: BgvParameters = DEFAULT_PARAMS,
): Promise<EncryptedDatabase> {
  const records = plaintextRecords.map(record =>
    encryptText(publicKey, record, params)
  );

  return {
    records,
    publicKey,
    params,
  };
}

export function queryEncryptedDatabase(
  database: EncryptedDatabase,
  queryIndex: number,
  secretKey: BgvSecretKey,
): string {
  if (queryIndex < 0 || queryIndex >= database.records.length) {
    throw new CryptoError("Invalid query index", "BGV_QUERY_INVALID_INDEX");
  }

  const encryptedRecord = database.records[queryIndex];
  return decryptToText(secretKey, encryptedRecord, database.params);
}

// Demo: Private information retrieval (simplified)
export function privateInformationRetrieval(
  database: EncryptedDatabase,
  encryptedQuery: BgvCiphertext,
  secretKey: BgvSecretKey,
): BgvCiphertext {
  // Simplified PIR: multiply each record by the query
  // In practice, this would use more sophisticated protocols
  let result = database.records[0];

  for (let i = 1; i < database.records.length; i++) {
    const multiplied = multiplyCiphertexts(
      secretKey,
      database.records[i],
      encryptedQuery,
      database.params
    );
    result = addCiphertexts(result, multiplied, database.params);
  }

  return result;
}

// Demo: Encrypted arithmetic calculator
export interface BgvCalculatorDemo {
  operands: BgvCiphertext[];
  publicKey: BgvPublicKey;
  params: BgvParameters;
}

export function createBgvCalculatorDemo(
  numbers: string[],
  publicKey: BgvPublicKey,
  params: BgvParameters = DEFAULT_PARAMS,
): BgvCalculatorDemo {
  const operands = numbers.map(num =>
    encryptText(publicKey, num, params)
  );

  return {
    operands,
    publicKey,
    params,
  };
}

export function addEncryptedBgvNumbers(
  calculatorDemo: BgvCalculatorDemo,
  secretKey: BgvSecretKey,
): { encrypted: BgvCiphertext; decrypted: string } {
  let result = calculatorDemo.operands[0];

  for (let i = 1; i < calculatorDemo.operands.length; i++) {
    result = addCiphertexts(result, calculatorDemo.operands[i], calculatorDemo.params);
  }

  const decrypted = decryptToText(secretKey, result, calculatorDemo.params);

  return {
    encrypted: result,
    decrypted,
  };
}

export function multiplyEncryptedBgvNumbers(
  calculatorDemo: BgvCalculatorDemo,
  secretKey: BgvSecretKey,
): { encrypted: BgvCiphertext; decrypted: string } {
  let result = calculatorDemo.operands[0];

  for (let i = 1; i < calculatorDemo.operands.length; i++) {
    result = multiplyCiphertexts(
      secretKey,
      result,
      calculatorDemo.operands[i],
      calculatorDemo.params
    );
  }

  const decrypted = decryptToText(secretKey, result, calculatorDemo.params);

  return {
    encrypted: result,
    decrypted,
  };
}

// Performance benchmarking
export async function benchmarkBgvOperations(
  parameterSet: keyof typeof BGV_PARAMETER_SETS = 'small',
  iterations = 5,
): Promise<{
  keyGeneration: number;
  encryption: number;
  decryption: number;
  addition: number;
  multiplication: number;
  parameters: BgvParameters;
}> {
  const params = BGV_PARAMETER_SETS[parameterSet];
  console.log(`Benchmarking BGV operations with ${parameterSet} parameters (${iterations} iterations)...`);

  // Key generation benchmark
  const keyGenStart = performance.now();
  const keyPair = generateBgvKeyPair(params);
  const keyGenTime = performance.now() - keyGenStart;

  const testMessage = "42";
  let encryptionTime = 0;
  let decryptionTime = 0;
  let additionTime = 0;
  let multiplicationTime = 0;

  for (let i = 0; i < iterations; i++) {
    // Encryption benchmark
    const encStart = performance.now();
    const ciphertext = encryptText(keyPair.publicKey, testMessage, params);
    encryptionTime += performance.now() - encStart;

    // Decryption benchmark
    const decStart = performance.now();
    decryptToText(keyPair.secretKey, ciphertext, params);
    decryptionTime += performance.now() - decStart;

    // Addition benchmark (add to itself)
    const addStart = performance.now();
    addCiphertexts(ciphertext, ciphertext, params);
    additionTime += performance.now() - addStart;

    // Multiplication benchmark
    const mulStart = performance.now();
    multiplyCiphertexts(keyPair.secretKey, ciphertext, ciphertext, params);
    multiplicationTime += performance.now() - mulStart;
  }

  return {
    keyGeneration: keyGenTime,
    encryption: encryptionTime / iterations,
    decryption: decryptionTime / iterations,
    addition: additionTime / iterations,
    multiplication: multiplicationTime / iterations,
    parameters: params,
  };
}

// Security and scope clarifications for browser usage
export interface BgvSecurityAnalysis {
  parameterSet: string;
  securityLevel: 'toy' | 'experimental' | 'research' | 'production';
  recommendedUse: string[];
  limitations: string[];
  browserSuitability: 'excellent' | 'good' | 'limited' | 'poor';
}

export function analyzeBgvSecurity(
  params: BgvParameters,
): BgvSecurityAnalysis {
  const n = params.n;
  const qBits = params.q.toString(2).length;

  let securityLevel: BgvSecurityAnalysis['securityLevel'];
  let browserSuitability: BgvSecurityAnalysis['browserSuitability'];
  let recommendedUse: string[];
  let limitations: string[];

  if (n <= 4) {
    securityLevel = 'toy';
    browserSuitability = 'excellent';
    recommendedUse = ['Learning', 'Demonstrations', 'Concept validation'];
    limitations = ['No cryptographic security', 'Vulnerable to all attacks'];
  } else if (n <= 16) {
    securityLevel = 'experimental';
    browserSuitability = 'good';
    recommendedUse = ['Research', 'Prototyping', 'Educational use'];
    limitations = ['Limited security', 'Not for sensitive data'];
  } else if (n <= 32) {
    securityLevel = 'research';
    browserSuitability = 'limited';
    recommendedUse = ['Academic research', 'Algorithm testing'];
    limitations = ['Performance overhead', 'Memory intensive'];
  } else {
    securityLevel = 'production';
    browserSuitability = 'poor';
    recommendedUse = ['High-security applications', 'Enterprise use'];
    limitations = ['Very slow in browser', 'High memory usage', 'May timeout'];
  }

  return {
    parameterSet: `n=${n}, q=${qBits}bits`,
    securityLevel,
    recommendedUse,
    limitations,
    browserSuitability,
  };
}

// Browser optimization utilities
export function optimizeBgvForBrowser(
  targetPerformance: 'fast' | 'balanced' | 'secure',
): BgvParameters {
  switch (targetPerformance) {
    case 'fast':
      return BGV_PARAMETER_SETS.toy;
    case 'balanced':
      return BGV_PARAMETER_SETS.small;
    case 'secure':
      return BGV_PARAMETER_SETS.medium;
    default:
      return BGV_PARAMETER_SETS.small;
  }
}
