// API base configuration
const getApiBaseUrl = () => {
  // Server-side: go directly to the API to save round-trip/overhead
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';
  }
  // Client-side: use relative path to trigger Next.js proxy (avoids CORS)
  return '';
};

/**
 * Auth header for backend (api.park.fan) requests.
 *
 * The key lives in the server-only `API_AUTH_KEY` env var (NOT `NEXT_PUBLIC_`), so it
 * is only available server-side. Returns the `x-auth-key` header when the key is
 * configured, otherwise an empty object — on the client (where requests go through the
 * Next.js proxy routes) and in unconfigured environments nothing extra is sent.
 *
 * Spread this into the `headers` of any fetch that targets the backend directly.
 */
export function getServerAuthHeaders(): Record<string, string> {
  const key = process.env.API_AUTH_KEY;
  return key ? { 'x-auth-key': key } : {};
}

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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Transient upstream failures worth a short retry. A single 429/503/504 (or a dropped
// connection) from the API during a build prerendered the whole route as an error and failed the
// build — brief blips or short rate-limit bursts would turn green builds red at random. We retry
// these on the server only; on the client React Query already handles retries, and the browser
// talks to the same-origin proxy anyway. 502 is treated as maintenance and is NOT retried (it
// surfaces the maintenance page).
//
// NOTE: the real fix for build-time rate-limiting (api.park.fan allows 300 req/60s) is to set the
// server-only `API_AUTH_KEY` env var in the build environment (Vercel → Build), so build requests
// are authenticated. Without it the whole build runs unauthenticated and can trip the limit; this
// retry only smooths over brief bursts, it does not replace the key.
const RETRYABLE_STATUS = new Set([429, 503, 504]);
const RETRY_BACKOFF_MS = [300, 900];

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

  // Retry transient upstream errors server-side only (build/SSR/ISR resilience).
  const maxAttempts = typeof window === 'undefined' ? RETRY_BACKOFF_MS.length + 1 : 1;

  let lastError: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(RETRY_BACKOFF_MS[attempt - 1]);

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
          ...getServerAuthHeaders(),
        },
      });

      if (response.ok) {
        return response.json() as Promise<T>;
      }

      const body = await response.text().catch(() => '');
      // 502 Bad Gateway means the API origin is unreachable, same as a 1033 tunnel
      // outage, so both render the maintenance page.
      const isMaintenance = response.status === 502 || isCloudflareTunnelDown(body);
      const error = new ApiError(
        response.status,
        `API Error: ${response.statusText}`,
        isMaintenance
      );

      // Retry only transient upstream 5xx; surface 4xx (incl. 404) and maintenance immediately.
      if (RETRYABLE_STATUS.has(response.status) && attempt < maxAttempts - 1) {
        lastError = error;
        continue;
      }
      throw error;
    } catch (err) {
      // Network-level failure (fetch threw): retry while attempts remain. A decided ApiError
      // (non-retryable, or thrown on the final attempt) is rethrown as-is.
      if (err instanceof ApiError) throw err;
      lastError = err;
      if (attempt < maxAttempts - 1) continue;
      throw err;
    }
  }

  throw lastError;
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
