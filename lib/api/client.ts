// API base configuration
const getApiBaseUrl = () => {
  // Server-side: go directly to the API to save round-trip/overhead
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';
  }
  // Client-side: use relative path to trigger Next.js proxy (avoids CORS)
  return '';
};

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  /** Next.js server-side fetch extensions (revalidate, tags). Server components only. */
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Digest forwarded to the error boundary so it can render the maintenance page.
 * In production Next.js redacts `error.message` for server-thrown errors but
 * preserves a custom `digest`, so this is the reliable cross-environment signal.
 */
export const API_MAINTENANCE_DIGEST = 'API_MAINTENANCE_1033';

/**
 * Detects a Cloudflare "Argo Tunnel error" (error code 1033), which is served as
 * an HTML page (usually HTTP 530) when the API origin tunnel is unreachable.
 */
function isCloudflareTunnelDown(body: string): boolean {
  if (!body) return false;
  return /(error[\s_]*1033|error code:\s*1033)/i.test(body);
}

export class ApiError extends Error {
  digest?: string;

  constructor(
    public status: number,
    message: string,
    public isMaintenance = false
  ) {
    super(message);
    this.name = 'ApiError';
    if (isMaintenance) {
      this.digest = API_MAINTENANCE_DIGEST;
    }
  }
}

export async function apiFetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { params, ...fetchOptions } = options;

  // Build URL with query params
  const baseUrl = getApiBaseUrl();
  const url = new URL(
    `${baseUrl}${endpoint}`,
    typeof window === 'undefined' ? baseUrl : window.location.origin
  );

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    // 502 Bad Gateway means the API origin is unreachable, same as a 1033 tunnel
    // outage, so both render the maintenance page.
    const isMaintenance = response.status === 502 || isCloudflareTunnelDown(body);
    throw new ApiError(response.status, `API Error: ${response.statusText}`, isMaintenance);
  }

  return response.json() as Promise<T>;
}

/**
 * Like `.catch(() => null)` but re-throws maintenance errors so the error boundary
 * can detect API outages and render the maintenance page.
 */
export function catchNonFatal<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((err: unknown) => {
    if (err instanceof ApiError && err.isMaintenance) throw err;
    return null;
  });
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: FetchOptions) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: unknown, options?: FetchOptions) =>
    apiFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
