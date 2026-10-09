import type { NextRequest } from "next/server";

/**
 * Límite de tasa en memoria, por instancia de función. En serverless esto
 * no es perfectamente consistente entre instancias concurrentes ni
 * sobrevive un cold start — para un sitio institucional de este tamaño es
 * una primera línea de defensa razonable contra abuso/flood scripteado sin
 * depender de un servicio externo (Redis/Upstash). Si en algún momento se
 * necesita algo exacto a nivel de cuenta, lo correcto es moverlo a Vercel
 * Firewall (configurable sin código) o a un store compartido.
 */
const buckets = new Map<string, number[]>();

/** Tope de memoria: si se acumulan demasiadas IPs distintas, se limpia todo
 * en vez de crecer sin límite (no afecta la protección, solo "olvida"
 * contadores viejos antes de lo normal en un pico raro de tráfico). */
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds?: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  if (buckets.size > MAX_BUCKETS) buckets.clear();

  const now = Date.now();
  const timestamps = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);

  if (timestamps.length >= limit) {
    const retryAfterSeconds = Math.ceil((windowMs - (now - timestamps[0])) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { allowed: true };
}

/** IP del cliente tal como la entrega el proxy de Vercel. */
export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
