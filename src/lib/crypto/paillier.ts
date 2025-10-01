import type { KeyEncoding } from "@/lib/crypto/shared";
import { decodeToBytes, encodeBytes } from "@/lib/crypto/shared";
import { CryptoError, cryptoUtils } from "@/lib/utils";
import type { PrivateKey, PublicKey } from "paillier-bigint";
import { generateRandomKeys } from "paillier-bigint";

export interface PaillierKeyPair {
  publicKey: PublicKey;
  privateKey: PrivateKey;
}

export interface PaillierCiphertext {
  value: string;
  encoding: "hex" | "base64";
}

const DEFAULT_ENCODING: "hex" | "base64" = "hex";

function bigintToHex(value: bigint): string {
  let hex = value.toString(16);
  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }
  return hex;
}

function hexToBigint(hex: string): bigint {
  if (!hex) {
    return 0n;
  }
  return BigInt(`0x${hex}`);
}

function stringToBigint(message: string, modulus: bigint): bigint {
  const bytes = cryptoUtils.stringToUint8Array(message);
  const hex = cryptoUtils.bytesToHex(bytes);
  if (!hex) {
    return 0n;
  }
  const value = BigInt(`0x${hex}`);
  return value % modulus;
}

function bigintToString(value: bigint): string {
  const hex = bigintToHex(value);
  const bytes = cryptoUtils.hexToBytes(hex);
  return cryptoUtils.uint8ArrayToString(bytes);
}

export async function generatePaillierKeyPair(
  bitLength = 2048,
  simpleVariant = true,
): Promise<PaillierKeyPair> {
  const keys = await generateRandomKeys(bitLength, simpleVariant);
  return {
    publicKey: keys.publicKey,
    privateKey: keys.privateKey,
  };
}

export function paillierEncrypt(
  publicKey: PublicKey,
  message: string,
  encoding: "hex" | "base64" = DEFAULT_ENCODING,
): PaillierCiphertext {
  const numeric = stringToBigint(message, publicKey.n);
  if (numeric === 0n) {
    throw new CryptoError(
      "Message too short or empty",
      "PAILLIER_MESSAGE_EMPTY",
    );
  }
  const cipher = publicKey.encrypt(numeric);
  const hex = bigintToHex(cipher);
  if (encoding === "hex") {
    return { value: hex, encoding };
  }
  const bytes = cryptoUtils.hexToBytes(hex);
  return { value: encodeBytes(bytes, "base64"), encoding };
}

export function paillierDecrypt(
  privateKey: PrivateKey,
  ciphertext: PaillierCiphertext,
): string {
  const bigintCipher =
    ciphertext.encoding === "hex"
      ? hexToBigint(ciphertext.value)
      : hexToBigint(
          cryptoUtils.bytesToHex(decodeToBytes(ciphertext.value, "base64")),
        );
  const decrypted = privateKey.decrypt(bigintCipher);
  return bigintToString(decrypted);
}

export function paillierAdd(
  publicKey: PublicKey,
  ...ciphertexts: PaillierCiphertext[]
): PaillierCiphertext {
  if (ciphertexts.length === 0) {
    throw new CryptoError(
      "At least one ciphertext required",
      "PAILLIER_ADD_EMPTY",
    );
  }
  const encoding = ciphertexts[0].encoding;
  const values = ciphertexts.map((cipher) =>
    cipher.encoding === "hex"
      ? hexToBigint(cipher.value)
      : hexToBigint(
          cryptoUtils.bytesToHex(decodeToBytes(cipher.value, "base64")),
        ),
  );
  const combined = publicKey.addition(...(values as [bigint, ...bigint[]]));
  const hex = bigintToHex(combined);
  if (encoding === "hex") {
    return { value: hex, encoding };
  }
  return {
    value: encodeBytes(cryptoUtils.hexToBytes(hex), "base64"),
    encoding,
  };
}

export function paillierAddPlaintext(
  publicKey: PublicKey,
  ciphertext: PaillierCiphertext,
  ...plaintexts: string[]
): PaillierCiphertext {
  const numericCipher =
    ciphertext.encoding === "hex"
      ? hexToBigint(ciphertext.value)
      : hexToBigint(
          cryptoUtils.bytesToHex(decodeToBytes(ciphertext.value, "base64")),
        );

  const values = plaintexts.map((text) => stringToBigint(text, publicKey.n));
  const combined = publicKey.plaintextAddition(numericCipher, ...values);
  const hex = bigintToHex(combined);
  if (ciphertext.encoding === "hex") {
    return { value: hex, encoding: ciphertext.encoding };
  }
  return {
    value: encodeBytes(cryptoUtils.hexToBytes(hex), "base64"),
    encoding: ciphertext.encoding,
  };
}

export function paillierMultiply(
  publicKey: PublicKey,
  ciphertext: PaillierCiphertext,
  scalar: string,
): PaillierCiphertext {
  const numericCipher =
    ciphertext.encoding === "hex"
      ? hexToBigint(ciphertext.value)
      : hexToBigint(
          cryptoUtils.bytesToHex(decodeToBytes(ciphertext.value, "base64")),
        );
  const scalarBigInt = stringToBigint(scalar, publicKey.n);
  const multiplied = publicKey.multiply(numericCipher, scalarBigInt);
  const hex = bigintToHex(multiplied);
  if (ciphertext.encoding === "hex") {
    return { value: hex, encoding: ciphertext.encoding };
  }
  return {
    value: encodeBytes(cryptoUtils.hexToBytes(hex), "base64"),
    encoding: ciphertext.encoding,
  };
}

// Performance monitoring and progress reporting
export interface PaillierPerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  operation: string;
  keySize?: number;
  inputSize?: number;
}

export type PaillierProgressCallback = (progress: number, message?: string) => void;

// Browser compatibility and optimization
export interface PaillierConfig {
  keySize: number;
  enableProgressReporting: boolean;
  enablePerformanceMetrics: boolean;
  batchSize: number;
  maxComputationTime: number;
}

export const DEFAULT_PAILLIER_CONFIG: PaillierConfig = {
  keySize: 2048,
  enableProgressReporting: true,
  enablePerformanceMetrics: true,
  batchSize: 10,
  maxComputationTime: 5000,
};

// Enhanced key generation with progress reporting
export async function generatePaillierKeyPairWithProgress(
  bitLength = 2048,
  simpleVariant = true,
  onProgress?: PaillierProgressCallback,
): Promise<PaillierKeyPair> {
  const startTime = performance.now();

  onProgress?.(0, "Initializing key generation...");

  // Simulate progress for key generation (actual generation is atomic)
  const progressInterval = setInterval(() => {
    const elapsed = performance.now() - startTime;
    const progress = Math.min(elapsed / 3000, 0.9); // Estimate 3 seconds max
    onProgress?.(progress, "Generating prime numbers...");
  }, 100);

  try {
    const keys = await generateRandomKeys(bitLength, simpleVariant);
    clearInterval(progressInterval);
    onProgress?.(1, "Key generation complete");

    return {
      publicKey: keys.publicKey,
      privateKey: keys.privateKey,
    };
  } catch (error) {
    clearInterval(progressInterval);
    throw new CryptoError(
      `Paillier key generation failed: ${error instanceof Error ? error.message : String(error)}`,
      "PAILLIER_KEYGEN_FAILED",
    );
  }
}

// Batch encryption for performance
export async function paillierEncryptBatch(
  publicKey: PublicKey,
  messages: string[],
  encoding: "hex" | "base64" = DEFAULT_ENCODING,
  onProgress?: PaillierProgressCallback,
  config: PaillierConfig = DEFAULT_PAILLIER_CONFIG,
): Promise<PaillierCiphertext[]> {
  const results: PaillierCiphertext[] = [];
  const batchSize = config.batchSize;

  for (let i = 0; i < messages.length; i += batchSize) {
    const batch = messages.slice(i, i + batchSize);
    const batchResults = batch.map((message) =>
      paillierEncrypt(publicKey, message, encoding)
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

// Demo: Encrypted voting system
export interface VotingDemo {
  candidates: string[];
  votes: PaillierCiphertext[];
  publicKey: PublicKey;
}

export async function createVotingDemo(
  candidates: string[],
  voteChoices: number[],
  keyPair: PaillierKeyPair,
): Promise<VotingDemo> {
  const votes: PaillierCiphertext[] = [];

  for (const choice of voteChoices) {
    if (choice < 0 || choice >= candidates.length) {
      throw new CryptoError("Invalid vote choice", "VOTING_INVALID_CHOICE");
    }

    // Encrypt vote as "1" for chosen candidate
    const vote = paillierEncrypt(keyPair.publicKey, "1");
    votes.push(vote);
  }

  return {
    candidates,
    votes,
    publicKey: keyPair.publicKey,
  };
}

export function tallyVotes(
  votingDemo: VotingDemo,
  privateKey: PrivateKey,
): { candidate: string; votes: number }[] {
  // In a real system, each candidate would have their own encrypted tally
  // For demo, we assume all votes are for first candidate
  const totalVotes = votingDemo.votes.reduce((sum, vote) =>
    paillierAdd(votingDemo.publicKey, sum, vote)
  );

  const decryptedTotal = paillierDecrypt(privateKey, totalVotes);
  const voteCount = parseInt(decryptedTotal, 10) || 0;

  return votingDemo.candidates.map((candidate, index) => ({
    candidate,
    votes: index === 0 ? voteCount : 0, // Simplified for demo
  }));
}

// Demo: Encrypted calculator
export interface CalculatorDemo {
  operands: PaillierCiphertext[];
  publicKey: PublicKey;
}

export function createCalculatorDemo(
  numbers: string[],
  publicKey: PublicKey,
): CalculatorDemo {
  const operands = numbers.map(num =>
    paillierEncrypt(publicKey, num)
  );

  return {
    operands,
    publicKey,
  };
}

export function addEncryptedNumbers(
  calculatorDemo: CalculatorDemo,
  privateKey: PrivateKey,
): { encrypted: PaillierCiphertext; decrypted: string } {
  const result = paillierAdd(calculatorDemo.publicKey, ...calculatorDemo.operands);
  const decrypted = paillierDecrypt(privateKey, result);

  return {
    encrypted: result,
    decrypted,
  };
}

export function multiplyEncryptedByPlaintext(
  ciphertext: PaillierCiphertext,
  multiplier: string,
  publicKey: PublicKey,
  privateKey: PrivateKey,
): { encrypted: PaillierCiphertext; decrypted: string } {
  const result = paillierMultiply(publicKey, ciphertext, multiplier);
  const decrypted = paillierDecrypt(privateKey, result);

  return {
    encrypted: result,
    decrypted,
  };
}

// Performance benchmarking
export async function benchmarkPaillierOperations(
  keySize = 2048,
  iterations = 10,
): Promise<{
  keyGeneration: number;
  encryption: number;
  decryption: number;
  addition: number;
  multiplication: number;
}> {
  console.log(`Benchmarking Paillier operations (${iterations} iterations)...`);

  // Key generation benchmark
  const keyGenStart = performance.now();
  const keyPair = await generatePaillierKeyPair(keySize);
  const keyGenTime = performance.now() - keyGenStart;

  const testMessage = "42";
  const testMultiplier = "3";
  let encryptionTime = 0;
  let decryptionTime = 0;
  let additionTime = 0;
  let multiplicationTime = 0;

  for (let i = 0; i < iterations; i++) {
    // Encryption benchmark
    const encStart = performance.now();
    const ciphertext = paillierEncrypt(keyPair.publicKey, testMessage);
    encryptionTime += performance.now() - encStart;

    // Decryption benchmark
    const decStart = performance.now();
    paillierDecrypt(keyPair.privateKey, ciphertext);
    decryptionTime += performance.now() - decStart;

    // Addition benchmark (add to itself)
    const addStart = performance.now();
    paillierAdd(keyPair.publicKey, ciphertext, ciphertext);
    additionTime += performance.now() - addStart;

    // Multiplication benchmark
    const mulStart = performance.now();
    paillierMultiply(keyPair.publicKey, ciphertext, testMultiplier);
    multiplicationTime += performance.now() - mulStart;
  }

  return {
    keyGeneration: keyGenTime,
    encryption: encryptionTime / iterations,
    decryption: decryptionTime / iterations,
    addition: additionTime / iterations,
    multiplication: multiplicationTime / iterations,
  };
}
