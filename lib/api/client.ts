/** Where a backend request starts: the API itself on the server, this app's own proxy routes in a browser. */
export const getApiBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'https://api.park.fan';
  }
  // Relative, so the browser goes through the Next.js proxy and needs no CORS.
  return '';
};

/**
 * How this frontend names itself to api.park.fan, with the deploy SHA and environment, so the
 * backend's access log can tell our traffic (and which deploy) apart from undici's default `node`.
 * Server-side only: `User-Agent` is a forbidden header in browser fetch, and the browser goes
 * through this app's proxy routes anyway.
 */
function serverUserAgent(): string {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev';
  const env = process.env.VERCEL_ENV ?? 'local';
  return `park.fan/${sha} (+https://park.fan; ${env})`;
}

/**
 * Headers every request that targets the backend directly should carry: the identifying
 * User-Agent and, when configured, the server-only `API_AUTH_KEY`. Empty in the browser.
 *
 * Scripts spread this too rather than inventing their own User-Agent: an unknown client name is
 * blocked at the edge. The module imports nothing, so `node`'s type stripping loads it from
 * `scripts/*.mjs`.
 */
export function getServerApiHeaders(): Record<string, string> {
  if (typeof window !== 'undefined') return {};
  const key = process.env.API_AUTH_KEY;
  return {
    'User-Agent': serverUserAgent(),
    ...(key ? { 'x-auth-key': key } : {}),
  };
}

/** `fetch` options for {@link apiFetch}, plus query params and Next's cache extensions. */
export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  /** Next.js server-side fetch extensions (revalidate, tags). Server components only. */
  next?: { revalidate?: number | false; tags?: string[] };
}

/**
 * Digest forwarded to the error boundary so it can render the maintenance page. Production
 * redacts `error.message` for server-thrown errors but keeps a custom `digest`.
 */
export const API_MAINTENANCE_DIGEST = 'API_MAINTENANCE_1033';

const CLOUDFLARE_TUNNEL_ERROR_RE = /(error[\s_]*1033|error code:\s*1033)/i;

/**
 * Detects a Cloudflare tunnel error page (code 1033, usually HTTP 530), served when the API
 * origin is unreachable.
 */
function isCloudflareTunnelDown(body: string): boolean {
  if (!body) return false;
  return CLOUDFLARE_TUNNEL_ERROR_RE.test(body);
}

/**
 * Error thrown by `apiFetch` for a non-OK API response, carrying the HTTP status; a 502 or a
 * Cloudflare 1033 page sets `isMaintenance` and the `API_MAINTENANCE_1033` digest.
 */
export class ApiError extends Error {
  digest?: string;
  // Declared and assigned instead of constructor parameter properties, which node's type stripping
  // refuses; the repo's test scripts load this module that way.
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

// Transient upstream failures worth a short server-side retry, so a brief blip or rate-limit burst
// during a build does not fail it; React Query retries in the browser. 502 means maintenance and
// is not retried. Build-time rate limiting is really solved by setting `API_AUTH_KEY` in the build
// environment; this only smooths over bursts.
const RETRYABLE_STATUS = new Set([429, 503, 504]);
const RETRY_BACKOFF_MS = [300, 900];

/**
 * Fetches a park.fan API endpoint with query params and the server API headers. On the server a
 * 429, 503, 504 or network failure is retried up to twice; a non-OK answer throws an `ApiError`.
 *
 * @param read How a successful response becomes the result; `response.json()` unless the caller
 *   needs the response first (`getContinents` reads the ETag and may skip the body).
 */
export async function apiFetch<T>(
  endpoint: string,
  options: FetchOptions = {},
  read: (response: Response) => Promise<T> = (response) => response.json() as Promise<T>
): Promise<T> {
  const { params, ...fetchOptions } = options;

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
        return read(response);
      }

      const body = await response.text().catch(() => '');
      // 502 means the API origin is unreachable, like a 1033 tunnel outage: both are maintenance.
      const isMaintenance = response.status === 502 || isCloudflareTunnelDown(body);
      const error = new ApiError(
        response.status,
        `API Error: ${response.statusText}`,
        isMaintenance
      );

      // Retry only transient 5xx; 4xx (incl. 404) and maintenance surface immediately.
      if (RETRYABLE_STATUS.has(response.status) && attempt < maxAttempts - 1) {
        lastError = error;
        continue;
      }
      throw error;
    } catch (err) {
      // A network failure retries while attempts remain; a decided ApiError is rethrown as-is.
      if (err instanceof ApiError) throw err;
      lastError = err;
      if (attempt < maxAttempts - 1) continue;
      throw err;
    }
  }

  throw lastError;
}

/**
 * `null` for the API's own 404, and a throw for everything else. Use it when `null` ends in
 * `notFound()`: a 404 from a failed fetch gets cached by Cloudflare and ISR as a fact about the
 * URL, while a throw is an uncached 500 and the next request tries again.
 * See "A negative cache may only hold a settled answer" in docs/architecture/caching-strategy.md.
 */
export function nullOnNotFound<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  });
}

/**
 * Like `.catch(() => null)` but re-throws maintenance errors so the error boundary can render the
 * maintenance page. For optional content only: it turns a 500, 429 or timeout into `null`, so
 * where `null` means „this page does not exist" use {@link nullOnNotFound}.
 */
export function catchNonFatal<T>(promise: Promise<T>): Promise<T | null> {
  return promise.catch((err: unknown) => {
    if (err instanceof ApiError && err.isMaintenance) throw err;
    return null;
  });
}

/** `GET` and `POST` shorthands over {@link apiFetch}. */
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
