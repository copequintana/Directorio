interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors?: unknown[];
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public errors: unknown[] = [],
  ) {
    super(message);
  }
}

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !body?.success) {
    throw new ApiClientError(body?.message ?? "Ocurrió un error inesperado.", body?.errors ?? []);
  }
  return body.data as T;
}

export const api = {
  get: <T>(url: string) => request<T>(url),
  post: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: "POST", body: JSON.stringify(data ?? {}) }),
  put: <T>(url: string, data?: unknown) =>
    request<T>(url, { method: "PUT", body: JSON.stringify(data ?? {}) }),
  delete: <T>(url: string) => request<T>(url, { method: "DELETE" }),
};
