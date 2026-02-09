import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebouncePro } from "../src/index";

describe("useDebouncePro", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should debounce function calls", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncePro(callback, 300));

    act(() => {
      result.current("test1");
      result.current("test2");
      result.current("test3");
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test3");
  });

  it("should handle leading edge only", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncePro(callback, { wait: 300, leading: true, trailing: false }),
    );

    act(() => {
      result.current("test");
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test");

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should handle leading and trailing edge", () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncePro(callback, { wait: 300, leading: true, trailing: true }),
    );

    act(() => {
      result.current("test1");
    });

    // Leading edge
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test1");

    act(() => {
      vi.advanceTimersByTime(150);
      result.current("test2");
    });

    expect(callback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    // Trailing edge
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenCalledWith("test2");
  });

  it("should cancel pending execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncePro(callback, 300));

    act(() => {
      result.current("test");
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
    expect(result.current.isPending()).toBe(false);
  });

  it("should flush pending execution", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncePro(callback, 300));

    act(() => {
      result.current("test");
    });

    expect(callback).not.toHaveBeenCalled();

    let flushedResult;
    act(() => {
      flushedResult = result.current.flush();
    });

    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith("test");
    expect(result.current.isPending()).toBe(false);
  });

  it("should return isPending status", () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncePro(callback, 300));

    expect(result.current.isPending()).toBe(false);

    act(() => {
      result.current("test");
    });

    expect(result.current.isPending()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.isPending()).toBe(false);
  });

  it("should use latest callback (prevent stale closures)", () => {
    const { result, rerender } = renderHook(
      ({ cb }) => useDebouncePro(cb, 300),
      {
        initialProps: { cb: (val: string) => console.log("initial", val) },
      },
    );

    const callback1 = vi.fn();
    const callback2 = vi.fn();

    // First render with callback1
    rerender({ cb: callback1 });

    act(() => {
      result.current("test");
    });

    // Rerender with callback2 before timer fires
    rerender({ cb: callback2 });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith("test");
  });

  it("should recreate debouncer when options change", () => {
    const callback = vi.fn();
    const { result, rerender } = renderHook(
      ({ delay }) => useDebouncePro(callback, delay),
      {
        initialProps: { delay: 300 },
      },
    );

    const firstDebouncer = result.current;

    // Change delay
    rerender({ delay: 500 });

    const secondDebouncer = result.current;

    expect(firstDebouncer).not.toBe(secondDebouncer);

    act(() => {
      secondDebouncer("test");
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(200);
    });

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it("should cleanup on unmount", () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncePro(callback, 300));

    act(() => {
      result.current("test");
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(callback).not.toHaveBeenCalled();
  });
});
