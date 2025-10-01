// BGV Web Worker for CPU-intensive Fully Homomorphic Encryption operations
// This worker handles BGV FHE operations in a separate thread

// Worker message types
const MESSAGE_TYPES = {
  GENERATE_KEYS: 'generateKeys',
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
  ADD: 'add',
  MULTIPLY: 'multiply',
  BENCHMARK: 'benchmark'
};

// BGV Parameter sets
const BGV_PARAMETER_SETS = {
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

// Utility functions for BGV operations
function modQ(value, q) {
  const result = value % q;
  return result >= 0n ? result : result + q;
}

function polyMod(poly, q) {
  return poly.map((coef) => modQ(coef, q));
}

function polyAdd(a, b, q) {
  return a.map((coef, idx) => modQ(coef + b[idx], q));
}

function polySub(a, b, q) {
  return a.map((coef, idx) => modQ(coef - b[idx], q));
}

function polyMul(a, b, params) {
  const { n, q } = params;
  const result = new Array(n).fill(0n);
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

function sampleSmallPolynomial(n) {
  return Array.from({ length: n }, () => BigInt((Math.random() * 3) | 0) - 1n);
}

function sampleBinaryPolynomial(n) {
  return Array.from({ length: n }, () => (Math.random() > 0.5 ? 1n : 0n));
}

function sampleUniformPolynomial(n, q) {
  const result = [];
  for (let i = 0; i < n; i += 1) {
    // Generate random bytes
    const randomValue = BigInt(Math.floor(Math.random() * 4294967296)); // 32-bit random
    result.push(modQ(randomValue, q));
  }
  return result;
}

function stringToUint8Array(str) {
  return new TextEncoder().encode(str);
}

function uint8ArrayToString(bytes) {
  return new TextDecoder().decode(bytes);
}

function encodeTextToPolynomial(text, params) {
  const { n, t } = params;
  const bytes = stringToUint8Array(text).slice(0, n);
  const coefficients = new Array(n).fill(0n);
  bytes.forEach((byte, index) => {
    coefficients[index] = BigInt(byte) % t;
  });
  return { coefficients };
}

function decodePolynomialToText(plaintext) {
  const bytes = new Uint8Array(plaintext.coefficients.length);
  plaintext.coefficients.forEach((coef, idx) => {
    let value = Number(coef);
    if (value < 0) value += 256;
    bytes[idx] = value % 256;
  });
  return uint8ArrayToString(bytes);
}

// BGV operations
function encryptPolynomial(publicKey, message, params) {
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

function generateBgvKeyPair(params) {
  const s = sampleBinaryPolynomial(params.n);
  const a = sampleUniformPolynomial(params.n, params.q);
  const e = sampleSmallPolynomial(params.n);
  const as = polyMul(a, s, params);
  const b = polySub(polyMul(a, s, params), e, params).map((coef) =>
    modQ(-coef, params.q),
  );
  const pk = { a, b };
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

function encryptText(publicKey, text, params) {
  const plaintext = encodeTextToPolynomial(text, params);
  return encryptPolynomial(publicKey, plaintext.coefficients, params);
}

function decryptCiphertext(secretKey, cipher, params) {
  const { s } = secretKey;
  const c1s = polyMul(cipher.c1, s, params);
  const m = polyAdd(cipher.c0, c1s, params.q);
  const rounded = m.map((coef) => {
    const value = modQ(coef, params.q);
    return ((value + params.delta / 2n) / params.delta) % params.t;
  });
  return { coefficients: rounded };
}

function decryptToText(secretKey, cipher, params) {
  const plaintext = decryptCiphertext(secretKey, cipher, params);
  return decodePolynomialToText(plaintext);
}

async function benchmarkBgvOperations(parameterSet = 'small', iterations = 5, onProgress) {
  const params = BGV_PARAMETER_SETS[parameterSet];
  const results = {
    keyGeneration: 0,
    encryption: 0,
    decryption: 0,
    addition: 0,
    multiplication: 0,
    parameters: params
  };

  // Key generation benchmark
  onProgress?.(0.1, 'Generating BGV keys for benchmark...');
  const keyGenStart = performance.now();
  const keyPair = generateBgvKeyPair(params);
  results.keyGeneration = performance.now() - keyGenStart;

  const testMessage = "42";
  let encryptionTime = 0;
  let decryptionTime = 0;
  let additionTime = 0;
  let multiplicationTime = 0;

  for (let i = 0; i < iterations; i++) {
    const progress = 0.1 + (0.8 * (i / iterations));
    onProgress?.(progress, `Running BGV iteration ${i + 1}/${iterations}...`);

    // Encryption benchmark
    const encStart = performance.now();
    const ciphertext = encryptText(keyPair.publicKey, testMessage, params);
    encryptionTime += performance.now() - encStart;

    // Decryption benchmark
    const decStart = performance.now();
    decryptToText(keyPair.secretKey, ciphertext, params);
    decryptionTime += performance.now() - decStart;

    // Addition benchmark (simplified)
    const addStart = performance.now();
    const addResult = {
      c0: polyAdd(ciphertext.c0, ciphertext.c0, params.q),
      c1: polyAdd(ciphertext.c1, ciphertext.c1, params.q),
    };
    additionTime += performance.now() - addStart;

    // Multiplication benchmark (simplified)
    const mulStart = performance.now();
    const c0 = polyMul(ciphertext.c0, ciphertext.c0, params);
    const c1 = polyAdd(
      polyMul(ciphertext.c0, ciphertext.c1, params),
      polyMul(ciphertext.c1, ciphertext.c0, params),
      params.q,
    );
    multiplicationTime += performance.now() - mulStart;
  }

  results.encryption = encryptionTime / iterations;
  results.decryption = decryptionTime / iterations;
  results.addition = additionTime / iterations;
  results.multiplication = multiplicationTime / iterations;

  onProgress?.(1, 'BGV benchmark completed');
  return results;
}

// Serialize BGV objects for transfer
function serializeBgvKeyPair(keyPair) {
  return {
    publicKey: {
      a: keyPair.publicKey.a.map(x => x.toString()),
      b: keyPair.publicKey.b.map(x => x.toString())
    },
    secretKey: {
      s: keyPair.secretKey.s.map(x => x.toString()),
      evalKey: {
        c0: keyPair.secretKey.evalKey.c0.map(x => x.toString()),
        c1: keyPair.secretKey.evalKey.c1.map(x => x.toString())
      }
    },
    params: {
      n: keyPair.params.n,
      q: keyPair.params.q.toString(),
      t: keyPair.params.t.toString(),
      delta: keyPair.params.delta.toString()
    }
  };
}

function serializeBgvCiphertext(ciphertext) {
  return {
    c0: ciphertext.c0.map(x => x.toString()),
    c1: ciphertext.c1.map(x => x.toString())
  };
}

function deserializeBgvParams(params) {
  return {
    n: params.n,
    q: BigInt(params.q),
    t: BigInt(params.t),
    delta: BigInt(params.delta)
  };
}

function deserializeBgvKeyPair(serialized) {
  return {
    publicKey: {
      a: serialized.publicKey.a.map(x => BigInt(x)),
      b: serialized.publicKey.b.map(x => BigInt(x))
    },
    secretKey: {
      s: serialized.secretKey.s.map(x => BigInt(x)),
      evalKey: {
        c0: serialized.secretKey.evalKey.c0.map(x => BigInt(x)),
        c1: serialized.secretKey.evalKey.c1.map(x => BigInt(x))
      }
    },
    params: deserializeBgvParams(serialized.params)
  };
}

function deserializeBgvCiphertext(serialized) {
  return {
    c0: serialized.c0.map(x => BigInt(x)),
    c1: serialized.c1.map(x => BigInt(x))
  };
}

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

  const sendProgress = (progress, message) => {
    self.postMessage({
      id,
      type: 'progress',
      success: true,
      progress,
      data: message
    });
  };

  try {
    switch (type) {
      case MESSAGE_TYPES.GENERATE_KEYS: {
        const { parameterSet } = payload;
        const params = BGV_PARAMETER_SETS[parameterSet] || BGV_PARAMETER_SETS.small;

        sendProgress(0, 'Generating secret key polynomial...');
        await new Promise(resolve => setTimeout(resolve, 50)); // Yield

        sendProgress(0.2, 'Generating public key components...');
        await new Promise(resolve => setTimeout(resolve, 50)); // Yield

        sendProgress(0.4, 'Computing public key polynomial arithmetic...');
        await new Promise(resolve => setTimeout(resolve, 100)); // Yield

        sendProgress(0.7, 'Generating evaluation key for multiplication...');
        const keyPair = generateBgvKeyPair(params);

        sendProgress(1, 'BGV key generation complete');
        const serialized = serializeBgvKeyPair(keyPair);
        sendResponse(true, serialized);
        break;
      }

      case MESSAGE_TYPES.ENCRYPT: {
        const { publicKey, params, message } = payload;
        const deserializedKeyPair = { publicKey: {
          a: publicKey.a.map(x => BigInt(x)),
          b: publicKey.b.map(x => BigInt(x))
        }};
        const deserializedParams = deserializeBgvParams(params);

        const ciphertext = encryptText(deserializedKeyPair.publicKey, message, deserializedParams);
        const serialized = serializeBgvCiphertext(ciphertext);
        sendResponse(true, serialized);
        break;
      }

      case MESSAGE_TYPES.DECRYPT: {
        const { secretKey, params, ciphertext } = payload;
        const deserializedSecretKey = {
          s: secretKey.s.map(x => BigInt(x)),
          evalKey: {
            c0: secretKey.evalKey.c0.map(x => BigInt(x)),
            c1: secretKey.evalKey.c1.map(x => BigInt(x))
          }
        };
        const deserializedParams = deserializeBgvParams(params);
        const deserializedCiphertext = deserializeBgvCiphertext(ciphertext);

        const result = decryptToText(deserializedSecretKey, deserializedCiphertext, deserializedParams);
        sendResponse(true, result);
        break;
      }

      case MESSAGE_TYPES.BENCHMARK: {
        const { parameterSet, iterations } = payload;
        const result = await benchmarkBgvOperations(parameterSet, iterations, sendProgress);
        sendResponse(true, result);
        break;
      }

      default:
        sendResponse(false, null, `Unknown operation type: ${type}`);
    }
  } catch (error) {
    console.error('BGV worker error:', error);
    sendResponse(false, null, error.message);
  }
};