// Custom hook for debouncing values and functions with configurable timing

import { useState, useEffect, useRef, useCallback } from 'react';

export interface DebounceConfig {
  delay: number;
  immediate?: boolean;
  maxWait?: number;
  leading?: boolean;
  trailing?: boolean;
}

export const DEFAULT_DEBOUNCE_CONFIG: DebounceConfig = {
  delay: 300,
  immediate: false,
  leading: false,
  trailing: true,
};

/**
 * Hook that debounces a value with configurable timing
 */
export function useDebounce<T>(value: T, config: Partial<DebounceConfig> = {}): T {
  const { delay, immediate } = { ...DEFAULT_DEBOUNCE_CONFIG, ...config };
  const [debouncedValue, setDebouncedValue] = useState<T>(immediate ? value : value);

  useEffect(() => {
    if (immediate && debouncedValue !== value) {
      setDebouncedValue(value);
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay, immediate, debouncedValue]);

  return debouncedValue;
}

/**
 * Hook that debounces a callback function with advanced configuration
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  config: Partial<DebounceConfig> = {}
): [T, { cancel: () => void; flush: () => void; isPending: () => boolean }] {
  const {
    delay,
    maxWait,
    leading = false,
    trailing = true,
  } = { ...DEFAULT_DEBOUNCE_CONFIG, ...config };

  const lastCallTime = useRef<number>();
  const lastInvokeTime = useRef<number>(0);
  const timerId = useRef<NodeJS.Timeout>();
  const lastArgs = useRef<Parameters<T>>();
  const lastThis = useRef<any>();
  const result = useRef<ReturnType<T>>();
  const [isPendingState, setIsPendingState] = useState(false);

  const invokeFunc = useCallback((time: number) => {
    const args = lastArgs.current;
    const thisArg = lastThis.current;

    lastArgs.current = undefined;
    lastThis.current = undefined;
    lastInvokeTime.current = time;
    setIsPendingState(false);

    if (args) {
      result.current = callback.apply(thisArg, args);
    }
    return result.current;
  }, [callback]);

  const shouldInvoke = useCallback((time: number) => {
    const timeSinceLastCall = time - (lastCallTime.current || 0);
    const timeSinceLastInvoke = time - lastInvokeTime.current;

    return (
      lastCallTime.current === undefined ||
      timeSinceLastCall >= delay ||
      timeSinceLastCall < 0 ||
      (maxWait !== undefined && timeSinceLastInvoke >= maxWait)
    );
  }, [delay, maxWait]);

  const timerExpired = useCallback(() => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return invokeFunc(time);
    }

    const timeSinceLastCall = time - (lastCallTime.current || 0);
    const timeSinceLastInvoke = time - lastInvokeTime.current;
    const timeWaiting = delay - timeSinceLastCall;
    const timeUntilMaxWait = maxWait !== undefined ? maxWait - timeSinceLastInvoke : Infinity;

    timerId.current = setTimeout(timerExpired, Math.min(timeWaiting, timeUntilMaxWait));
  }, [shouldInvoke, invokeFunc, delay, maxWait]);

  const cancel = useCallback(() => {
    if (timerId.current) {
      clearTimeout(timerId.current);
      timerId.current = undefined;
    }
    lastInvokeTime.current = 0;
    lastCallTime.current = undefined;
    lastArgs.current = undefined;
    lastThis.current = undefined;
    setIsPendingState(false);
  }, []);

  const flush = useCallback(() => {
    if (timerId.current) {
      const time = Date.now();
      invokeFunc(time);
      cancel();
    }
    return result.current;
  }, [invokeFunc, cancel]);

  const isPending = useCallback(() => {
    return isPendingState;
  }, [isPendingState]);

  const debounced = useCallback(
    function (this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgs.current = args;
      lastThis.current = this;
      lastCallTime.current = time;

      if (isInvoking) {
        if (!timerId.current) {
          // Leading edge
          if (leading) {
            lastInvokeTime.current = lastCallTime.current;
            timerId.current = setTimeout(timerExpired, delay);
            setIsPendingState(true);
            return invokeFunc(lastCallTime.current);
          } else {
            lastInvokeTime.current = lastCallTime.current;
            timerId.current = setTimeout(timerExpired, delay);
            setIsPendingState(true);
          }
        }
        return result.current;
      }

      if (!timerId.current) {
        timerId.current = setTimeout(timerExpired, delay);
        setIsPendingState(true);
      }
      return result.current;
    } as T,
    [shouldInvoke, leading, delay, timerExpired, invokeFunc]
  );

  // Cleanup on unmount
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return [debounced, { cancel, flush, isPending }];
}

/**
 * Hook for real-time crypto operations with smart debouncing
 */
export function useCryptoDebounce<T, R>(
  input: T,
  operation: (input: T) => Promise<R> | R,
  config: Partial<DebounceConfig> & {
    enableRealTime?: boolean;
    minInputLength?: number;
    skipEmpty?: boolean;
  } = {}
): {
  result: R | null;
  isProcessing: boolean;
  error: string | null;
  trigger: () => void;
  clear: () => void;
} {
  const {
    enableRealTime = true,
    minInputLength = 1,
    skipEmpty = true,
    delay = 500, // Longer delay for crypto operations
    ...debounceConfig
  } = config;

  const [result, setResult] = useState<R | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processInput = useCallback(async (inputValue: T) => {
    // Skip processing if conditions aren't met
    if (skipEmpty && (!inputValue || (typeof inputValue === 'string' && inputValue.trim() === ''))) {
      setResult(null);
      setError(null);
      return;
    }

    if (typeof inputValue === 'string' && inputValue.length < minInputLength) {
      setResult(null);
      setError(null);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const output = await operation(inputValue);
      setResult(output);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResult(null);
    } finally {
      setIsProcessing(false);
    }
  }, [operation, minInputLength, skipEmpty]);

  const [debouncedProcess, { cancel, flush }] = useDebouncedCallback(
    processInput,
    { delay, ...debounceConfig }
  );

  // Auto-trigger when input changes (if real-time is enabled)
  useEffect(() => {
    if (enableRealTime) {
      debouncedProcess(input);
    }
    return cancel;
  }, [input, enableRealTime, debouncedProcess, cancel]);

  const trigger = useCallback(() => {
    flush();
  }, [flush]);

  const clear = useCallback(() => {
    cancel();
    setResult(null);
    setError(null);
    setIsProcessing(false);
  }, [cancel]);

  return {
    result,
    isProcessing,
    error,
    trigger,
    clear,
  };
}

/**
 * Hook for batched crypto operations with debouncing
 */
export function useBatchedCryptoDebounce<T, R>(
  inputs: T[],
  operation: (inputs: T[]) => Promise<R[]> | R[],
  config: Partial<DebounceConfig> & {
    batchSize?: number;
    enableRealTime?: boolean;
  } = {}
): {
  results: R[];
  isProcessing: boolean;
  error: string | null;
  progress: number;
  trigger: () => void;
  clear: () => void;
} {
  const {
    batchSize = 10,
    enableRealTime = true,
    delay = 750, // Longer delay for batch operations
    ...debounceConfig
  } = config;

  const [results, setResults] = useState<R[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const processBatch = useCallback(async (inputBatch: T[]) => {
    if (inputBatch.length === 0) {
      setResults([]);
      setError(null);
      setProgress(0);
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress(0);

    try {
      const batchResults: R[] = [];
      const totalBatches = Math.ceil(inputBatch.length / batchSize);

      for (let i = 0; i < inputBatch.length; i += batchSize) {
        const batch = inputBatch.slice(i, i + batchSize);
        const batchOutput = await operation(batch);
        batchResults.push(...batchOutput);

        const currentBatch = Math.floor(i / batchSize) + 1;
        setProgress((currentBatch / totalBatches) * 100);
      }

      setResults(batchResults);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setResults([]);
      setProgress(0);
    } finally {
      setIsProcessing(false);
    }
  }, [operation, batchSize]);

  const [debouncedProcess, { cancel, flush }] = useDebouncedCallback(
    processBatch,
    { delay, ...debounceConfig }
  );

  // Auto-trigger when inputs change (if real-time is enabled)
  useEffect(() => {
    if (enableRealTime) {
      debouncedProcess(inputs);
    }
    return cancel;
  }, [inputs, enableRealTime, debouncedProcess, cancel]);

  const trigger = useCallback(() => {
    flush();
  }, [flush]);

  const clear = useCallback(() => {
    cancel();
    setResults([]);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
  }, [cancel]);

  return {
    results,
    isProcessing,
    error,
    progress,
    trigger,
    clear,
  };
}