import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebouncePro } from "../src/index";

describe("useDebouncePro - Throttle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should throttle function calls with maxWait", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncePro(callback, { wait: 100, maxWait: 500 }),
    );

    // Call repeatedly
    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current(`test-${i}`);
        vi.advanceTimersByTime(50); // Less than wait time (100)
      }
    });

    // Should have been called at least once due to maxWait
    // Total time advanced: 10 * 50 = 500ms
    // Wait is 100ms.
    // If we call every 50ms, the debounce timer (100ms) keeps resetting.
    // But maxWait (500ms) should force an execution.

    expect(callback).toHaveBeenCalled();
    const callCount = callback.mock.calls.length;
    expect(callCount).toBeGreaterThan(0);
    // It should be exactly 1 call if we check right at 500ms
    // The first call happens at maxWait expiration.
  });

  it("should throttle with leading edge", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncePro(callback, { wait: 100, maxWait: 500, leading: true }),
    );

    act(() => {
      result.current("test1");
    });

    // Leading edge: immediate call
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test1");

    act(() => {
      // Call continually to prevent debounce timer from firing
      for (let i = 0; i < 9; i++) {
        vi.advanceTimersByTime(50);
        result.current(`test-${i + 2}`);
      }
    });

    // Total time: 9 * 50 = 450ms.
    // Since last invoke (0ms), 450ms passed. maxWait is 500.
    // Should NOT have called again yet.
    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(60); // Total 510ms
      result.current("final");
    });

    // Now maxWait (500ms) exceeded. Should invoke.
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it("should respect maxWait combined with debounce", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncePro(callback, { wait: 100, maxWait: 200 }),
    );

    act(() => {
      result.current("start");
    });

    // Debounce timer started for 100ms.
    // maxWait timer started for 200ms.

    act(() => {
      vi.advanceTimersByTime(90); // 90ms
      result.current("update"); // Reset debounce to +100ms (total 190ms)
    });

    // At 90ms. Debounce reset to fire at 190ms.
    // maxWait still scheduled for 200ms.

    act(() => {
      vi.advanceTimersByTime(90); // 180ms
      result.current("update2"); // Reset debounce to +100ms (total 280ms)
    });

    // At 180ms. Debounce reset to fire at 280ms.
    // maxWait still scheduled for 200ms.

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(30); // 210ms
    });

    // At 210ms. maxWait (200ms) has passed. Should have fired.
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("update2");
  });
});
