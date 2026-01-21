/**
 * Mode of operation for the debouncer
 * - 'debounce': Delays execution until after wait time has elapsed since last call
 * - 'throttle': Ensures execution happens at most once per wait period
 */
export type DebouncerMode = "debounce" | "throttle";

/**
 * Configuration options for the debouncer
 */
export interface DebouncerOptions {
  /**
   * The number of milliseconds to delay
   * @default 0
   */
  wait: number;

  /**
   * Mode of operation: 'debounce' or 'throttle'
   * @default 'debounce'
   */
  mode?: DebouncerMode;

  /**
   * Specify invoking on the leading edge of the timeout
   * @default false
   */
  leading?: boolean;

  /**
   * Specify invoking on the trailing edge of the timeout
   * @default true
   */
  trailing?: boolean;

  /**
   * The maximum time callback is allowed to be delayed before it's invoked
   * Useful for throttle mode to ensure execution happens within a time window
   * @default undefined
   */
  maxWait?: number;
}

/**
 * Internal state for tracking debouncer execution
 */
export interface DebouncerState {
  /** The timeout ID for the pending execution */
  timeoutId: ReturnType<typeof setTimeout> | null;

  /** Timestamp of the last time the function was called */
  lastCallTime: number;

  /** Timestamp of the last time the function was actually invoked */
  lastInvokeTime: number;

  /** Arguments from the last call */
  lastArgs: any[] | null;

  /** Result from the last invocation */
  result: any;
}

/**
 * The debouncer instance returned by createDebouncer
 */
export interface Debouncer<T extends (...args: any[]) => any> {
  /**
   * The debounced/throttled function
   */
  (...args: Parameters<T>): ReturnType<T> | undefined;

  /**
   * Cancel any pending invocations
   */
  cancel: () => void;

  /**
   * Immediately invoke any pending invocation
   */
  flush: () => ReturnType<T> | undefined;

  /**
   * Check if there is a pending invocation
   */
  isPending: () => boolean;
}
