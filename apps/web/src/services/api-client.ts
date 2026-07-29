const API_BASE_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      // Only send `Content-Type: application/json` when there's an actual body — Fastify's
      // JSON body parser rejects an empty body sent with this content-type (e.g. `DELETE`,
      // which has no body), throwing `FST_ERR_CTP_EMPTY_JSON_BODY`.
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(`Request to ${path} failed`, response.status);
  }

  // No-content responses (e.g. `DELETE`'s 204) have no JSON body to parse.
  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
