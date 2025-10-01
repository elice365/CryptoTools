// File Streaming Web Worker for large file encryption/decryption operations

// Worker message types
const MESSAGE_TYPES = {
  ENCRYPT_FILE: 'encryptFile',
  DECRYPT_FILE: 'decryptFile',
  HASH_FILE: 'hashFile',
  PROCESS_CHUNK: 'processChunk',
  INITIALIZE: 'initialize'
};

// Configuration
const DEFAULT_CHUNK_SIZE = 64 * 1024; // 64KB
const MAX_CONCURRENT_CHUNKS = 4;

class FileStreamingWorker {
  constructor() {
    this.processors = new Map();
    this.config = {
      chunkSize: DEFAULT_CHUNK_SIZE,
      maxConcurrentChunks: MAX_CONCURRENT_CHUNKS,
      enableProgressTracking: true
    };
  }

  // Convert ArrayBuffer to Uint8Array
  arrayBufferToUint8Array(buffer) {
    return new Uint8Array(buffer);
  }

  // Convert File chunks to processable format
  async fileToChunks(fileData, chunkSize = this.config.chunkSize) {
    const chunks = [];
    const totalSize = fileData.byteLength;
    const totalChunks = Math.ceil(totalSize / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, totalSize);
      const chunkData = fileData.slice(start, end);

      chunks.push({
        data: new Uint8Array(chunkData),
        index: i,
        isLast: end >= totalSize,
        totalChunks,
        originalSize: totalSize
      });
    }

    return chunks;
  }

  // Process file chunk for encryption
  async processEncryptionChunk(chunk, algorithm, key, baseIv) {
    try {
      // Adjust IV for CTR mode
      let chunkIv = baseIv;
      if (algorithm.includes('CTR')) {
        chunkIv = this.adjustCounterForChunk(baseIv, chunk.index);
      }

      const encrypted = await crypto.subtle.encrypt(
        {
          name: algorithm.split('-')[0],
          iv: chunkIv,
        },
        key,
        chunk.data
      );

      return {
        data: new Uint8Array(encrypted),
        index: chunk.index,
        success: true
      };
    } catch (error) {
      return {
        error: `Encryption failed for chunk ${chunk.index}: ${error.message}`,
        index: chunk.index,
        success: false
      };
    }
  }

  // Process file chunk for decryption
  async processDecryptionChunk(chunk, algorithm, key, baseIv) {
    try {
      // Adjust IV for CTR mode
      let chunkIv = baseIv;
      if (algorithm.includes('CTR')) {
        chunkIv = this.adjustCounterForChunk(baseIv, chunk.index);
      }

      const decrypted = await crypto.subtle.decrypt(
        {
          name: algorithm.split('-')[0],
          iv: chunkIv,
        },
        key,
        chunk.data
      );

      return {
        data: new Uint8Array(decrypted),
        index: chunk.index,
        success: true
      };
    } catch (error) {
      return {
        error: `Decryption failed for chunk ${chunk.index}: ${error.message}`,
        index: chunk.index,
        success: false
      };
    }
  }

  // Adjust counter for CTR mode
  adjustCounterForChunk(baseIv, chunkIndex) {
    const adjustedIv = new Uint8Array(baseIv);
    let carry = chunkIndex;

    for (let i = adjustedIv.length - 1; i >= 0 && carry > 0; i--) {
      const sum = adjustedIv[i] + (carry & 0xFF);
      adjustedIv[i] = sum & 0xFF;
      carry = Math.floor(carry / 256) + Math.floor(sum / 256);
    }

    return adjustedIv;
  }

  // Process entire file with streaming
  async processFileStream(fileData, processor, onProgress) {
    const startTime = performance.now();
    const chunks = await this.fileToChunks(fileData);
    const processedChunks = new Array(chunks.length);
    let bytesProcessed = 0;
    let chunksCompleted = 0;

    // Process chunks with concurrency control
    const processingPromises = [];

    for (const chunk of chunks) {
      // Limit concurrent processing
      if (processingPromises.length >= this.config.maxConcurrentChunks) {
        await Promise.race(processingPromises);
      }

      const promise = processor(chunk)
        .then(result => {
          if (result.success) {
            processedChunks[result.index] = result.data;
            bytesProcessed += chunk.data.length;
            chunksCompleted++;

            // Report progress
            if (onProgress) {
              const elapsed = performance.now() - startTime;
              const progress = {
                bytesProcessed,
                totalBytes: fileData.byteLength,
                chunksProcessed: chunksCompleted,
                totalChunks: chunks.length,
                percentage: (bytesProcessed / fileData.byteLength) * 100,
                processingRate: bytesProcessed / (elapsed / 1000),
                estimatedTimeRemaining: ((fileData.byteLength - bytesProcessed) / bytesProcessed) * elapsed / 1000
              };
              onProgress(progress);
            }
          } else {
            throw new Error(result.error);
          }
        })
        .finally(() => {
          const index = processingPromises.indexOf(promise);
          if (index > -1) {
            processingPromises.splice(index, 1);
          }
        });

      processingPromises.push(promise);
    }

    // Wait for all chunks to complete
    await Promise.all(processingPromises);

    // Combine processed chunks
    const totalLength = processedChunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of processedChunks) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined;
  }

  // Hash file using streaming
  async hashFileStream(fileData, algorithm, onProgress) {
    const startTime = performance.now();
    const chunks = await this.fileToChunks(fileData);

    // For simplicity, accumulate all chunks and hash at the end
    // In a real implementation, you'd use incremental hashing
    let allData = new Uint8Array(fileData.byteLength);
    let offset = 0;
    let bytesProcessed = 0;

    for (const chunk of chunks) {
      allData.set(chunk.data, offset);
      offset += chunk.data.length;
      bytesProcessed += chunk.data.length;

      // Report progress
      if (onProgress) {
        const elapsed = performance.now() - startTime;
        const progress = {
          bytesProcessed,
          totalBytes: fileData.byteLength,
          chunksProcessed: chunk.index + 1,
          totalChunks: chunks.length,
          percentage: (bytesProcessed / fileData.byteLength) * 100,
          processingRate: bytesProcessed / (elapsed / 1000)
        };
        onProgress(progress);
      }

      // Yield control periodically
      if (chunk.index % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    // Compute final hash
    const hashBuffer = await crypto.subtle.digest(algorithm, allData);
    return new Uint8Array(hashBuffer);
  }
}

// Global worker instance
const fileStreamingWorker = new FileStreamingWorker();

// Message handler
self.onmessage = async function(event) {
  const { id, type, payload } = event.data;

  const sendResponse = (success, data = null, error = null) => {
    self.postMessage({
      id,
      type: 'response',
      success,
      data,
      error
    });
  };

  const sendProgress = (progress) => {
    self.postMessage({
      id,
      type: 'progress',
      success: true,
      data: progress
    });
  };

  try {
    switch (type) {
      case MESSAGE_TYPES.ENCRYPT_FILE: {
        const { fileData, algorithm, keyData, iv } = payload;

        // Import the key
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: algorithm.split('-')[0] },
          false,
          ['encrypt']
        );

        // Create processor for encryption
        const processor = (chunk) => fileStreamingWorker.processEncryptionChunk(
          chunk, algorithm, key, new Uint8Array(iv)
        );

        // Process file
        const result = await fileStreamingWorker.processFileStream(
          fileData,
          processor,
          sendProgress
        );

        sendResponse(true, result.buffer);
        break;
      }

      case MESSAGE_TYPES.DECRYPT_FILE: {
        const { fileData, algorithm, keyData, iv } = payload;

        // Import the key
        const key = await crypto.subtle.importKey(
          'raw',
          keyData,
          { name: algorithm.split('-')[0] },
          false,
          ['decrypt']
        );

        // Create processor for decryption
        const processor = (chunk) => fileStreamingWorker.processDecryptionChunk(
          chunk, algorithm, key, new Uint8Array(iv)
        );

        // Process file
        const result = await fileStreamingWorker.processFileStream(
          fileData,
          processor,
          sendProgress
        );

        sendResponse(true, result.buffer);
        break;
      }

      case MESSAGE_TYPES.HASH_FILE: {
        const { fileData, algorithm } = payload;

        const result = await fileStreamingWorker.hashFileStream(
          fileData,
          algorithm,
          sendProgress
        );

        sendResponse(true, result.buffer);
        break;
      }

      default:
        sendResponse(false, null, `Unknown operation type: ${type}`);
    }
  } catch (error) {
    console.error('File streaming worker error:', error);
    sendResponse(false, null, error.message);
  }
};