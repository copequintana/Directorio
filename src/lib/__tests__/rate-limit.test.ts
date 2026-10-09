import { describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("permite hasta el límite y luego bloquea dentro de la ventana", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 10_000).allowed).toBe(true);
    }
    const cuarto = rateLimit(key, 3, 10_000);
    expect(cuarto.allowed).toBe(false);
    expect(cuarto.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("no mezcla contadores de llaves distintas", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    expect(rateLimit(a, 1, 10_000).allowed).toBe(true);
    expect(rateLimit(b, 1, 10_000).allowed).toBe(true);
    expect(rateLimit(a, 1, 10_000).allowed).toBe(false);
  });

  it("vuelve a permitir pasada la ventana de tiempo", () => {
    vi.useFakeTimers();
    const key = `window-${Math.random()}`;
    expect(rateLimit(key, 1, 1000).allowed).toBe(true);
    expect(rateLimit(key, 1, 1000).allowed).toBe(false);

    vi.advanceTimersByTime(1001);
    expect(rateLimit(key, 1, 1000).allowed).toBe(true);
    vi.useRealTimers();
  });
});
