import { useCallback, useEffect, useRef } from "react";
import { createDebouncer, normalizeOptions } from "./utils";
import type { Debouncer, DebouncerOptions } from "./types";

// Re-export types for convenience
export type { DebouncerOptions, DebouncerMode, Debouncer } from "./types";

/**
 * A React hook that creates a debounced or throttled version of a function
 *
 * @param callback - The function to debounce/throttle
 * @param options - Either a number (wait time in ms) or a full options object
 * @returns A debouncer instance with the debounced function and control methods
 *
 * @example
 * ```tsx
 * // Basic usage with just wait time
 * const debouncedSearch = useDebouncePro(searchAPI, 300);
 *
 * // Advanced usage with options
 * const { run, cancel, flush, isPending } = useDebouncePro(handleScroll, {
 *   wait: 100,
 *   leading: true,
 *   trailing: false,
 *   maxWait: 100,
 * });
 * ```
 */
export function useDebouncePro<T extends (...args: any[]) => any>(
  callback: T,
  options: number | DebouncerOptions,
): Debouncer<T> {
  // Normalize options to always be an object
  const normalizedOptions = normalizeOptions(options);

  // Store the latest callback in a ref to avoid recreating debouncer
  // This ensures the debounced function always calls the latest version
  const callbackRef = useRef(callback);

  // Update ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Store the debouncer instance in a ref so it persists across renders
  const debouncerRef = useRef<Debouncer<T> | null>(null);

  // Store options in a ref for comparison
  const optionsRef = useRef(normalizedOptions);

  // Create or recreate debouncer when options change
  if (
    debouncerRef.current === null ||
    !areOptionsEqual(optionsRef.current, normalizedOptions)
  ) {
    // Cancel any pending execution from old debouncer
    if (debouncerRef.current !== null) {
      debouncerRef.current.cancel();
    }

    // Create new debouncer with a wrapper that calls the latest callback
    debouncerRef.current = createDebouncer(
      (...args: Parameters<T>) => callbackRef.current(...args),
      normalizedOptions,
    );

    // Update options ref
    optionsRef.current = normalizedOptions;
  }

  // Cancel any pending executions when component unmounts
  useEffect(() => {
    return () => {
      if (debouncerRef.current !== null) {
        debouncerRef.current.cancel();
      }
    };
  }, []);

  // Return the debouncer instance
  // We use a stable reference, so this won't cause unnecessary re-renders
  return debouncerRef.current;
}

/**
 * Alternative API that returns an object with named methods
 * Some users prefer this over the function-with-methods pattern
 *
 * @example
 * ```tsx
 * const { run, cancel, flush, isPending } = useDebouncedCallback(
 *   (query: string) => searchAPI(query),
 *   { wait: 300 }
 * );
 *
 * return <input onChange={(e) => run(e.target.value)} />;
 * ```-
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  options: number | DebouncerOptions,
) {
  const debouncer = useDebouncePro(callback, options);

  // Memoize the return object to avoid creating new objects on every render
  return useCallback(
    () => ({
      run: debouncer,
      cancel: debouncer.cancel,
      flush: debouncer.flush,
      isPending: debouncer.isPending,
    }),
    [debouncer],
  )();
}

/**
 * Compares two options objects for equality
 * Used to determine if we need to recreate the debouncer
 */
function areOptionsEqual(a: DebouncerOptions, b: DebouncerOptions): boolean {
  return (
    a.wait === b.wait &&
    a.leading === b.leading &&
    a.trailing === b.trailing &&
    a.maxWait === b.maxWait &&
    a.mode === b.mode
  );
}
