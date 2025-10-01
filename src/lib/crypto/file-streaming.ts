// File streaming utilities for large file encryption/decryption operations

import { CryptoError } from "@/lib/utils";

export interface FileChunk {
  data: Uint8Array;
  index: number;
  isLast: boolean;
  totalChunks: number;
  originalSize?: number;
}

export interface StreamingProgress {
  bytesProcessed: number;
  totalBytes: number;
  chunksProcessed: number;
  totalChunks: number;
  percentage: number;
  estimatedTimeRemaining?: number;
  processingRate?: number; // bytes per second
}

export type StreamingProgressCallback = (progress: StreamingProgress) => void;

export interface StreamingConfig {
  chunkSize: number; // bytes per chunk
  maxConcurrentChunks: number;
  enableProgressTracking: boolean;
  bufferSize: number;
  enableCompression: boolean;
}

export const DEFAULT_STREAMING_CONFIG: StreamingConfig = {
  chunkSize: 64 * 1024, // 64KB chunks
  maxConcurrentChunks: 4,
  enableProgressTracking: true,
  bufferSize: 1024 * 1024, // 1MB buffer
  enableCompression: false,
};

export interface FileStreamProcessor {
  processChunk(chunk: FileChunk): Promise<Uint8Array>;
  finalize?(): Promise<Uint8Array | null>;
  initialize?(config: StreamingConfig): Promise<void>;
}

export class FileStreamManager {
  private config: StreamingConfig;
  private startTime: number = 0;
  private bytesProcessed: number = 0;

  constructor(config: Partial<StreamingConfig> = {}) {
    this.config = { ...DEFAULT_STREAMING_CONFIG, ...config };
  }

  /**
   * Convert a File to chunks for streaming processing
   */
  async *fileToChunks(file: File): AsyncGenerator<FileChunk> {
    const totalChunks = Math.ceil(file.size / this.config.chunkSize);
    let currentChunk = 0;

    while (currentChunk * this.config.chunkSize < file.size) {
      const start = currentChunk * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, file.size);

      const blob = file.slice(start, end);
      const arrayBuffer = await blob.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      yield {
        data,
        index: currentChunk,
        isLast: end >= file.size,
        totalChunks,
        originalSize: file.size,
      };

      currentChunk++;
    }
  }

  /**
   * Convert chunks back to a Blob/File
   */
  chunksToBlob(chunks: Uint8Array[], mimeType?: string): Blob {
    return new Blob(chunks, { type: mimeType || 'application/octet-stream' });
  }

  /**
   * Process a file using streaming with a custom processor
   */
  async processFileStream(
    file: File,
    processor: FileStreamProcessor,
    onProgress?: StreamingProgressCallback
  ): Promise<Blob> {
    this.startTime = performance.now();
    this.bytesProcessed = 0;

    // Initialize processor if needed
    if (processor.initialize) {
      await processor.initialize(this.config);
    }

    const processedChunks: Uint8Array[] = [];
    const totalBytes = file.size;
    const totalChunks = Math.ceil(totalBytes / this.config.chunkSize);

    // Process chunks with concurrency control
    const chunkPromises: Promise<void>[] = [];
    let chunksProcessed = 0;

    for await (const chunk of this.fileToChunks(file)) {
      // Wait if we've hit the concurrency limit
      if (chunkPromises.length >= this.config.maxConcurrentChunks) {
        await Promise.race(chunkPromises);
      }

      const chunkPromise = this.processChunkWithTracking(
        chunk,
        processor,
        processedChunks,
        totalBytes,
        totalChunks,
        () => chunksProcessed++,
        onProgress
      );

      chunkPromises.push(chunkPromise);
    }

    // Wait for all chunks to complete
    await Promise.all(chunkPromises);

    // Finalize processing if needed
    if (processor.finalize) {
      const finalData = await processor.finalize();
      if (finalData) {
        processedChunks.push(finalData);
      }
    }

    // Report 100% completion
    if (onProgress) {
      const finalProgress: StreamingProgress = {
        bytesProcessed: totalBytes,
        totalBytes,
        chunksProcessed: totalChunks,
        totalChunks,
        percentage: 100,
        processingRate: this.calculateProcessingRate(totalBytes),
      };
      onProgress(finalProgress);
    }

    return this.chunksToBlob(processedChunks);
  }

  private async processChunkWithTracking(
    chunk: FileChunk,
    processor: FileStreamProcessor,
    processedChunks: Uint8Array[],
    totalBytes: number,
    totalChunks: number,
    incrementCounter: () => void,
    onProgress?: StreamingProgressCallback
  ): Promise<void> {
    try {
      const processedData = await processor.processChunk(chunk);

      // Store processed chunk in correct order
      processedChunks[chunk.index] = processedData;

      // Update progress tracking
      this.bytesProcessed += chunk.data.length;
      incrementCounter();

      if (onProgress && this.config.enableProgressTracking) {
        const elapsed = performance.now() - this.startTime;
        const progress: StreamingProgress = {
          bytesProcessed: this.bytesProcessed,
          totalBytes,
          chunksProcessed: chunk.index + 1,
          totalChunks,
          percentage: (this.bytesProcessed / totalBytes) * 100,
          processingRate: this.calculateProcessingRate(this.bytesProcessed, elapsed),
          estimatedTimeRemaining: this.calculateTimeRemaining(this.bytesProcessed, totalBytes, elapsed),
        };
        onProgress(progress);
      }
    } catch (error) {
      throw new CryptoError(
        `Failed to process chunk ${chunk.index}: ${error instanceof Error ? error.message : String(error)}`,
        'FILE_CHUNK_PROCESSING_FAILED'
      );
    }
  }

  private calculateProcessingRate(bytesProcessed: number, elapsed?: number): number {
    const timeElapsed = elapsed || (performance.now() - this.startTime);
    return bytesProcessed / (timeElapsed / 1000); // bytes per second
  }

  private calculateTimeRemaining(bytesProcessed: number, totalBytes: number, elapsed: number): number {
    const remainingBytes = totalBytes - bytesProcessed;
    const processingRate = this.calculateProcessingRate(bytesProcessed, elapsed);
    return remainingBytes / processingRate; // seconds
  }
}

// Streaming encryption processor for symmetric algorithms
export class StreamingEncryptionProcessor implements FileStreamProcessor {
  private algorithm: string;
  private key: CryptoKey;
  private iv: Uint8Array;
  private encoder: TextEncoder;
  private decoder: TextDecoder;

  constructor(algorithm: string, key: CryptoKey, iv: Uint8Array) {
    this.algorithm = algorithm;
    this.key = key;
    this.iv = iv;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  async initialize(config: StreamingConfig): Promise<void> {
    // Validate algorithm support for streaming
    if (!this.algorithm.includes('CTR') && !this.algorithm.includes('GCM')) {
      console.warn('Algorithm may not be optimal for streaming. CTR or GCM modes recommended.');
    }
  }

  async processChunk(chunk: FileChunk): Promise<Uint8Array> {
    try {
      // For CTR mode, we need to adjust the counter for each chunk
      let chunkIv = this.iv;
      if (this.algorithm.includes('CTR')) {
        chunkIv = this.adjustCounterForChunk(this.iv, chunk.index);
      }

      const encrypted = await crypto.subtle.encrypt(
        {
          name: this.algorithm.split('-')[0], // Extract base algorithm name
          iv: chunkIv,
        },
        this.key,
        chunk.data
      );

      return new Uint8Array(encrypted);
    } catch (error) {
      throw new CryptoError(
        `Encryption failed for chunk ${chunk.index}: ${error instanceof Error ? error.message : String(error)}`,
        'STREAMING_ENCRYPTION_FAILED'
      );
    }
  }

  private adjustCounterForChunk(baseIv: Uint8Array, chunkIndex: number): Uint8Array {
    const adjustedIv = new Uint8Array(baseIv);

    // Add chunk index to counter (simple approach)
    let carry = chunkIndex;
    for (let i = adjustedIv.length - 1; i >= 0 && carry > 0; i--) {
      const sum = adjustedIv[i] + (carry & 0xFF);
      adjustedIv[i] = sum & 0xFF;
      carry = Math.floor(carry / 256) + Math.floor(sum / 256);
    }

    return adjustedIv;
  }
}

// Streaming decryption processor
export class StreamingDecryptionProcessor implements FileStreamProcessor {
  private algorithm: string;
  private key: CryptoKey;
  private iv: Uint8Array;

  constructor(algorithm: string, key: CryptoKey, iv: Uint8Array) {
    this.algorithm = algorithm;
    this.key = key;
    this.iv = iv;
  }

  async processChunk(chunk: FileChunk): Promise<Uint8Array> {
    try {
      // For CTR mode, we need to adjust the counter for each chunk
      let chunkIv = this.iv;
      if (this.algorithm.includes('CTR')) {
        chunkIv = this.adjustCounterForChunk(this.iv, chunk.index);
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: this.algorithm.split('-')[0],
          iv: chunkIv,
        },
        this.key,
        chunk.data
      );

      return new Uint8Array(decrypted);
    } catch (error) {
      throw new CryptoError(
        `Decryption failed for chunk ${chunk.index}: ${error instanceof Error ? error.message : String(error)}`,
        'STREAMING_DECRYPTION_FAILED'
      );
    }
  }

  private adjustCounterForChunk(baseIv: Uint8Array, chunkIndex: number): Uint8Array {
    const adjustedIv = new Uint8Array(baseIv);

    let carry = chunkIndex;
    for (let i = adjustedIv.length - 1; i >= 0 && carry > 0; i--) {
      const sum = adjustedIv[i] + (carry & 0xFF);
      adjustedIv[i] = sum & 0xFF;
      carry = Math.floor(carry / 256) + Math.floor(sum / 256);
    }

    return adjustedIv;
  }
}

// Hashing processor for large files
export class StreamingHashProcessor implements FileStreamProcessor {
  private algorithm: string;
  private hashState: any; // Will hold the streaming hash state

  constructor(algorithm: string) {
    this.algorithm = algorithm;
  }

  async initialize(): Promise<void> {
    // Initialize hash state (simplified - in real implementation would use crypto.subtle.digest with streaming)
    this.hashState = {
      chunks: [] as Uint8Array[],
      totalLength: 0
    };
  }

  async processChunk(chunk: FileChunk): Promise<Uint8Array> {
    // Accumulate chunks for final hashing
    this.hashState.chunks.push(chunk.data);
    this.hashState.totalLength += chunk.data.length;

    // Return empty array as we'll compute hash in finalize
    return new Uint8Array(0);
  }

  async finalize(): Promise<Uint8Array> {
    // Combine all chunks and compute final hash
    const combined = new Uint8Array(this.hashState.totalLength);
    let offset = 0;

    for (const chunk of this.hashState.chunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    const hashBuffer = await crypto.subtle.digest(this.algorithm, combined);
    return new Uint8Array(hashBuffer);
  }
}

// Utility functions for file streaming
export const FileStreamingUtils = {
  /**
   * Check if file size requires streaming
   */
  shouldUseStreaming(file: File, threshold = 10 * 1024 * 1024): boolean { // 10MB default
    return file.size > threshold;
  },

  /**
   * Estimate optimal chunk size based on file size
   */
  calculateOptimalChunkSize(fileSize: number): number {
    if (fileSize < 1024 * 1024) return 32 * 1024; // 32KB for small files
    if (fileSize < 10 * 1024 * 1024) return 64 * 1024; // 64KB for medium files
    if (fileSize < 100 * 1024 * 1024) return 128 * 1024; // 128KB for large files
    return 256 * 1024; // 256KB for very large files
  },

  /**
   * Format bytes for display
   */
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Format processing rate
   */
  formatProcessingRate(bytesPerSecond: number): string {
    return `${this.formatBytes(bytesPerSecond)}/s`;
  },

  /**
   * Format time remaining
   */
  formatTimeRemaining(seconds: number): string {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    return `${Math.round(seconds / 3600)}h ${Math.round((seconds % 3600) / 60)}m`;
  }
};