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
 * How this frontend names itself to api.park.fan.
 *
 * Without it every server-side request arrives as undici's default `node`, which makes the
 * backend's access log useless for telling our traffic apart from anything else pointed at the
 * same host. The deployment SHA is in there because the interesting question in that log is
 * usually "which deploy is hammering this", and the environment because build, preview and
 * production hit the same rate limit (300 req/60s) from the same origin.
 *
 * Server-side only, deliberately: `User-Agent` is a forbidden header name in the browser's
 * fetch, so setting it there is silently dropped — and the browser never talks to the backend
 * directly anyway, it goes through this app's own /api proxy routes.
 */
function serverUserAgent(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';
  const env = process.env.VERCEL_ENV ?? 'local';
  return `park.fan/${sha} (+https://park.fan; ${env})`;
}

/**
 * Headers every request that targets the backend (api.park.fan) DIRECTLY should carry:
 * the auth key and the identifying User-Agent above.
 *
 * The key lives in the server-only `API_AUTH_KEY` env var (NOT `NEXT_PUBLIC_`), so it
 * is only available server-side. It is omitted when unconfigured — on the client (where
 * requests go through the Next.js proxy routes) and in unconfigured environments.
 *
 * Spread this into the `headers` of any fetch that targets the backend directly. It was called
 * `getServerAuthHeaders` while the key was the only thing in it; the User-Agent went in here
 * rather than into a second helper that call sites could forget to add.
 */
export function getServerApiHeaders(): Record<string, string> {
  if (typeof window !== 'undefined') return {};
  const key = process.env.API_AUTH_KEY;
  return {
    'User-Agent': serverUserAgent(),
    ...(key ? { 'x-auth-key': key } : {}),
  };
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

const CLOUDFLARE_TUNNEL_ERROR_RE = /(error[\s_]*1033|error code:\s*1033)/i;

/**
 * Detects a Cloudflare "Argo Tunnel error" (error code 1033), which is served as
 * an HTML page (usually HTTP 530) when the API origin tunnel is unreachable.
 */
function isCloudflareTunnelDown(body: string): boolean {
  if (!body) return false;
  return CLOUDFLARE_TUNNEL_ERROR_RE.test(body);
}

export class ApiError extends Error {
  digest?: string;
  // Declared and assigned rather than written as constructor parameter properties.
  // Identical at runtime, and it keeps this module loadable by the repo's own test
  // scripts: they run on node's type stripping, which refuses parameter properties
  // outright ("not supported in strip-only mode") — and node 26 dropped the
  // --experimental-transform-types that used to be the way around it. Anything
  // importing this file, which is every `lib/api` fetcher, was untestable until now.
  status: number;
  isMaintenance: boolean;

  constructor(status: number, message: string, isMaintenance = false) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isMaintenance = isMaintenance;
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
          ...getServerApiHeaders(),
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
