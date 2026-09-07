import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

describe("useDebouncedValue", () => {
  it("solo actualiza el valor después del retraso (evita buscar en cada tecla)", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), {
      initialProps: { value: "5" },
    });

    expect(result.current).toBe("5");

    rerender({ value: "51" });
    rerender({ value: "512" });
    rerender({ value: "5125" });

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(result.current).toBe("5");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe("5125");

    vi.useRealTimers();
  });
});
