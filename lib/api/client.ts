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

// Transient upstream failures worth retrying during a build. At runtime nothing is retried here:
// React Query already retries in the browser, and three server attempts under each of its tries
// turned one 503 into nine requests against an API that was struggling. A 502 at runtime is
// maintenance and shows the maintenance page at once. At build time it is usually a backend deploy
// (Coolify restarts the API for 16 to 22 s), and one thrown 502 failed the whole prerender of
// ~3,000 pages, so the build waits it out. Build-time rate limiting is really solved by setting
// `API_AUTH_KEY` in the build environment.
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);
const IS_BUILD = process.env.NEXT_PHASE === 'phase-production-build';

/** Pause before retry `n` (0-based) during a build: 300 ms, 900 ms, 2.7 s, then 10 s. */
const retryBackoffMs = (n: number) => Math.min(300 * 3 ** n, 10_000);

/**
 * How long a build keeps retrying after the API last answered. The window is module-wide, not per
 * request: with the API down, every page would otherwise wait out its own window one after the
 * other, and a dead API would hold the build for hours instead of about a minute.
 */
const BUILD_RETRY_WINDOW_MS = 60_000;
let apiLastReachableAt: number | null = null;

/**
 * How long one upstream request may take before it is abandoned. Without a bound a hung API holds
 * every render and every poll until the function's own limit, billed the whole time.
 */
const UPSTREAM_TIMEOUT_MS = 15_000;

/**
 * Fetches a park.fan API endpoint with query params and the server API headers. During a build a
 * 429, 502, 503, 504 or network failure is retried until the API has been silent for
 * {@link BUILD_RETRY_WINDOW_MS}; a non-OK answer throws an `ApiError`. A server request without
 * its own `signal` is abandoned after {@link UPSTREAM_TIMEOUT_MS}.
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

  const onServer = typeof window === 'undefined';
  const retries = onServer && IS_BUILD;
  if (retries) apiLastReachableAt ??= Date.now();
  const mayRetry = () => retries && Date.now() - (apiLastReachableAt ?? 0) < BUILD_RETRY_WINDOW_MS;

  for (let attempt = 0; ; attempt++) {
    if (attempt > 0) await sleep(retryBackoffMs(attempt - 1));

    try {
      const response = await fetch(url.toString(), {
        ...fetchOptions,
        signal:
          fetchOptions.signal ?? (onServer ? AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) : undefined),
        headers: {
          'Content-Type': 'application/json',
          ...fetchOptions.headers,
          ...getServerApiHeaders(),
        },
      });

      if (!RETRYABLE_STATUS.has(response.status)) apiLastReachableAt = Date.now();
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

      // Retry only transient failures; 4xx (incl. 404) surface immediately.
      if (RETRYABLE_STATUS.has(response.status) && mayRetry()) continue;
      throw error;
    } catch (err) {
      // A network failure retries while the window is open; a decided ApiError is rethrown as-is.
      if (err instanceof ApiError) throw err;
      if (mayRetry()) continue;
      throw err;
    }
  }
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
