import type { Debouncer, DebouncerOptions, DebouncerState } from "./types";

/**
 * Creates a debounced or throttled version of a function
 *
 * @param fn - The function to debounce/throttle
 * @param options - Configuration options
 * @returns A debouncer instance with cancel, flush, and isPending methods
 *
 * @example
 * ```ts
 * const debouncedFn = createDebouncer(myFunction, { wait: 300 });
 * debouncedFn('arg1', 'arg2'); // Will execute after 300ms of inactivity
 * debouncedFn.cancel(); // Cancel pending execution
 * ```
 */
export function createDebouncer<T extends (...args: any[]) => any>(
  fn: T,
  options: DebouncerOptions,
): Debouncer<T> {
  const { wait, leading = false, trailing = true, maxWait } = options;

  // Internal state
  const state: DebouncerState = {
    timeoutId: null,
    lastCallTime: 0,
    lastInvokeTime: 0,
    lastArgs: null,
    result: undefined,
  };

  /**
   * Determines if the function should be invoked based on timing
   */
  function shouldInvoke(time: number): boolean {
    const timeSinceLastCall = time - state.lastCallTime;
    const timeSinceLastInvoke = time - state.lastInvokeTime;

    // First call
    if (state.lastCallTime === 0) {
      return true;
    }

    // Check if we've waited long enough since last call
    if (timeSinceLastCall >= wait) {
      return true;
    }

    // Check maxWait constraint (for throttle behavior)
    if (maxWait !== undefined && timeSinceLastInvoke >= maxWait) {
      return true;
    }

    return false;
  }

  /**
   * Invokes the function with the stored arguments
   */
  function invokeFunc(time: number): any {
    const args = state.lastArgs!;
    state.lastInvokeTime = time;
    state.result = fn(...args);
    return state.result;
  }

  /**
   * Handles the leading edge invocation
   */
  function leadingEdge(time: number): any {
    // Reset last invoke time for this call chain
    state.lastInvokeTime = time;

    // Start the timer for the trailing edge
    state.timeoutId = setTimeout(timerExpired, wait);

    // Invoke immediately if leading is enabled
    return leading ? invokeFunc(time) : state.result;
  }

  /**
   * Handles the trailing edge invocation
   */
  function trailingEdge(time: number): any {
    state.timeoutId = null;

    // Only invoke if we have args (meaning there was a call)
    // and trailing is enabled
    if (trailing && state.lastArgs) {
      return invokeFunc(time);
    }

    // Clean up
    state.lastArgs = null;
    return state.result;
  }

  /**
   * Called when the timer expires
   */
  function timerExpired(): void {
    const time = Date.now();

    if (shouldInvoke(time)) {
      trailingEdge(time);
    } else {
      // Restart the timer for the remaining wait time
      remainingWait(time);
    }
  }

  /**
   * Calculates and sets a timer for the remaining wait time
   */
  function remainingWait(time: number): void {
    const timeSinceLastCall = time - state.lastCallTime;
    const timeSinceLastInvoke = time - state.lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    // For throttle with maxWait, use the shorter of the two
    const shouldUseMaxWait = maxWait !== undefined;
    const maxWaitRemaining = shouldUseMaxWait
      ? maxWait! - timeSinceLastInvoke
      : Infinity;

    const nextWait = Math.min(timeWaiting, maxWaitRemaining);
    state.timeoutId = setTimeout(timerExpired, nextWait);
  }

  /**
   * Cancels any pending invocation
   */
  function cancel(): void {
    if (state.timeoutId !== null) {
      clearTimeout(state.timeoutId);
      state.timeoutId = null;
    }
    state.lastCallTime = 0;
    state.lastInvokeTime = 0;
    state.lastArgs = null;
  }

  /**
   * Immediately invokes any pending invocation
   */
  function flush(): any {
    if (state.timeoutId === null) {
      return state.result;
    }

    const time = Date.now();
    cancel();

    // Only invoke if we have pending args
    if (state.lastArgs) {
      return invokeFunc(time);
    }

    return state.result;
  }

  /**
   * Checks if there is a pending invocation
   */
  function isPending(): boolean {
    return state.timeoutId !== null;
  }

  /**
   * The main debounced function
   */
  function debounced(...args: Parameters<T>): ReturnType<T> | undefined {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    // Store the latest arguments
    state.lastArgs = args;
    state.lastCallTime = time;

    if (isInvoking) {
      // No pending timer - start fresh
      if (state.timeoutId === null) {
        return leadingEdge(time);
      }

      // For throttle with maxWait, invoke immediately if maxWait exceeded
      if (maxWait !== undefined) {
        // Clear existing timer and restart
        if (state.timeoutId !== null) {
          clearTimeout(state.timeoutId);
        }
        state.timeoutId = setTimeout(timerExpired, wait);
        return invokeFunc(time);
      }
    }

    // Ensure timer is running
    if (state.timeoutId === null) {
      state.timeoutId = setTimeout(timerExpired, wait);
    }

    return state.result;
  }

  // Attach methods to the debounced function
  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.isPending = isPending;

  return debounced as Debouncer<T>;
}

/**
 * Normalizes options input - accepts either a number (wait time) or full options object
 */
export function normalizeOptions(
  options: number | DebouncerOptions,
): DebouncerOptions {
  if (typeof options === "number") {
    return { wait: options };
  }
  return options;
}
