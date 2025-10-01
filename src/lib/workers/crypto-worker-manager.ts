// Web Worker manager for CPU-intensive cryptographic operations

export interface WorkerMessage {
  id: string;
  type: string;
  payload: unknown;
}

export interface WorkerResponse {
  id: string;
  type: string;
  success: boolean;
  data?: unknown;
  error?: string;
  progress?: number;
}

export interface WorkerProgressCallback {
  (progress: number, message?: string): void;
}

export class CryptoWorkerManager {
  private workers: Map<string, Worker> = new Map();
  private pendingOperations: Map<string, {
    resolve: (value: unknown) => void;
    reject: (error: Error) => void;
    onProgress?: WorkerProgressCallback;
  }> = new Map();

  constructor() {
    this.cleanup = this.cleanup.bind(this);
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.cleanup);
    }
  }

  private generateId(): string {
    return `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private createWorker(workerPath: string): Worker {
    if (typeof Worker === 'undefined') {
      throw new Error('Web Workers are not supported in this environment');
    }

    const worker = new Worker(workerPath, { type: 'module' });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;
      const operation = this.pendingOperations.get(response.id);

      if (!operation) {
        console.warn('Received response for unknown operation:', response.id);
        return;
      }

      if (response.type === 'progress' && operation.onProgress) {
        operation.onProgress(response.progress || 0, response.data as string);
        return;
      }

      if (response.success) {
        operation.resolve(response.data);
      } else {
        operation.reject(new Error(response.error || 'Worker operation failed'));
      }

      this.pendingOperations.delete(response.id);
    };

    worker.onerror = (error) => {
      console.error('Worker error:', error);
      // Reject all pending operations for this worker
      for (const [id, operation] of this.pendingOperations.entries()) {
        operation.reject(new Error('Worker error occurred'));
        this.pendingOperations.delete(id);
      }
    };

    return worker;
  }

  private getWorker(workerType: string): Worker {
    const workerPath = `/workers/${workerType}-worker.js`;

    if (!this.workers.has(workerType)) {
      const worker = this.createWorker(workerPath);
      this.workers.set(workerType, worker);
    }

    return this.workers.get(workerType)!;
  }

  async executeOperation<T>(
    workerType: string,
    operationType: string,
    payload: unknown,
    onProgress?: WorkerProgressCallback,
    timeout = 30000
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.generateId();
      const worker = this.getWorker(workerType);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        this.pendingOperations.delete(id);
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      // Store operation
      this.pendingOperations.set(id, {
        resolve: (value) => {
          clearTimeout(timeoutId);
          resolve(value as T);
        },
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        onProgress
      });

      // Send message to worker
      const message: WorkerMessage = {
        id,
        type: operationType,
        payload
      };

      worker.postMessage(message);
    });
  }

  // Paillier operations
  async generatePaillierKeys(
    bitLength = 2048,
    onProgress?: WorkerProgressCallback
  ): Promise<unknown> {
    return this.executeOperation(
      'paillier',
      'generateKeys',
      { bitLength },
      onProgress,
      10000
    );
  }

  async paillierEncrypt(
    publicKey: unknown,
    message: string,
    encoding: 'hex' | 'base64' = 'hex'
  ): Promise<unknown> {
    return this.executeOperation(
      'paillier',
      'encrypt',
      { publicKey, message, encoding }
    );
  }

  async paillierDecrypt(
    privateKey: unknown,
    ciphertext: unknown
  ): Promise<string> {
    return this.executeOperation(
      'paillier',
      'decrypt',
      { privateKey, ciphertext }
    );
  }

  async paillierBenchmark(
    keySize = 2048,
    iterations = 10,
    onProgress?: WorkerProgressCallback
  ): Promise<unknown> {
    return this.executeOperation(
      'paillier',
      'benchmark',
      { keySize, iterations },
      onProgress,
      60000
    );
  }

  // BGV operations
  async generateBgvKeys(
    parameterSet: string = 'small',
    onProgress?: WorkerProgressCallback
  ): Promise<unknown> {
    return this.executeOperation(
      'bgv',
      'generateKeys',
      { parameterSet },
      onProgress,
      15000
    );
  }

  async bgvEncrypt(
    publicKey: unknown,
    params: unknown,
    message: string
  ): Promise<unknown> {
    return this.executeOperation(
      'bgv',
      'encrypt',
      { publicKey, params, message }
    );
  }

  async bgvDecrypt(
    secretKey: unknown,
    params: unknown,
    ciphertext: unknown
  ): Promise<string> {
    return this.executeOperation(
      'bgv',
      'decrypt',
      { secretKey, params, ciphertext }
    );
  }

  async bgvBenchmark(
    parameterSet: string = 'small',
    iterations = 5,
    onProgress?: WorkerProgressCallback
  ): Promise<unknown> {
    return this.executeOperation(
      'bgv',
      'benchmark',
      { parameterSet, iterations },
      onProgress,
      90000
    );
  }

  // Utility methods
  isWorkerSupported(): boolean {
    return typeof Worker !== 'undefined';
  }

  getActiveWorkerCount(): number {
    return this.workers.size;
  }

  getPendingOperationCount(): number {
    return this.pendingOperations.size;
  }

  // File streaming operations
  async encryptFileStream(
    file: File,
    algorithm: string,
    key: ArrayBuffer,
    iv: ArrayBuffer,
    onProgress?: WorkerProgressCallback
  ): Promise<ArrayBuffer> {
    const fileBuffer = await file.arrayBuffer();

    return this.executeOperation(
      'file-streaming',
      'encryptFile',
      { fileData: fileBuffer, algorithm, keyData: key, iv },
      onProgress,
      300000 // 5 minute timeout for large files
    );
  }

  async decryptFileStream(
    file: File,
    algorithm: string,
    key: ArrayBuffer,
    iv: ArrayBuffer,
    onProgress?: WorkerProgressCallback
  ): Promise<ArrayBuffer> {
    const fileBuffer = await file.arrayBuffer();

    return this.executeOperation(
      'file-streaming',
      'decryptFile',
      { fileData: fileBuffer, algorithm, keyData: key, iv },
      onProgress,
      300000 // 5 minute timeout for large files
    );
  }

  async hashFileStream(
    file: File,
    algorithm: string,
    onProgress?: WorkerProgressCallback
  ): Promise<ArrayBuffer> {
    const fileBuffer = await file.arrayBuffer();

    return this.executeOperation(
      'file-streaming',
      'hashFile',
      { fileData: fileBuffer, algorithm },
      onProgress,
      300000 // 5 minute timeout for large files
    );
  }

  // Cleanup
  cleanup(): void {
    // Reject all pending operations
    for (const [id, operation] of this.pendingOperations.entries()) {
      operation.reject(new Error('Worker manager is being cleaned up'));
    }
    this.pendingOperations.clear();

    // Terminate all workers
    for (const [type, worker] of this.workers.entries()) {
      worker.terminate();
    }
    this.workers.clear();

    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.cleanup);
    }
  }

  // Static singleton instance
  private static instance: CryptoWorkerManager | null = null;

  static getInstance(): CryptoWorkerManager {
    if (!CryptoWorkerManager.instance) {
      CryptoWorkerManager.instance = new CryptoWorkerManager();
    }
    return CryptoWorkerManager.instance;
  }

  static cleanup(): void {
    if (CryptoWorkerManager.instance) {
      CryptoWorkerManager.instance.cleanup();
      CryptoWorkerManager.instance = null;
    }
  }
}

// Export singleton instance
export const cryptoWorkerManager = CryptoWorkerManager.getInstance();

// Cleanup on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    CryptoWorkerManager.cleanup();
  });
}