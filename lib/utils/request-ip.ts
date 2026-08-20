import type { NextRequest } from 'next/server';

/**
 * Where to look for the visitor's IP, in order of trustworthiness.
 *
 * park.fan is served through Cloudflare → Vercel. Vercel sets `x-forwarded-for` and
 * `x-real-ip` to the peer that opened the connection to IT — which, since Cloudflare was
 * put in front, is a Cloudflare edge server, not the visitor. Only Cloudflare's own
 * `cf-connecting-ip` still carries the real client address, so it MUST be consulted first.
 *
 * It used to be a last-resort fallback for the case where `x-forwarded-for` was missing —
 * which never happens on Vercel — so it was never reached, and every GeoIP lookup resolved
 * the visitor to their Cloudflare colo instead (Frankfurt over IPv4, London over IPv6),
 * making /api/nearby list the parks around that datacenter.
 */
const CLIENT_IP_HEADERS = [
  'cf-connecting-ip', // Cloudflare: always the true client, always a single address
  'true-client-ip', // Cloudflare Enterprise alias for the same value
  'x-forwarded-for', // no Cloudflare in front: direct *.vercel.app, local dev
  'x-real-ip',
] as const;

/**
 * Drop an optional port and IPv6 brackets: `1.2.3.4:5678` → `1.2.3.4`, `[::1]:443` → `::1`.
 */
function stripPort(ip: string): string {
  const bracketed = /^\[(.+?)\](?::\d+)?$/.exec(ip);
  if (bracketed) return bracketed[1];
  // A bare `host:port` is only unambiguous for IPv4 — in IPv6 every colon is a separator.
  if (ip.includes('.') && ip.split(':').length === 2) return ip.split(':')[0];
  return ip;
}

/**
 * Take the originating client out of a (possibly comma-separated) forwarding chain.
 * The leftmost entry is the client; everything after it are proxy hops.
 *
 * This used to scan the chain for the first IPv4 ("GeoIP works better with IPv4"), which is
 * exactly backwards behind a proxy: for an IPv6 visitor it skipped the real client and
 * returned the proxy's IPv4 instead. api.park.fan geolocates IPv6 correctly, so the client
 * address is forwarded as-is.
 */
export function pickClientIp(forwarded: string): string {
  const first = forwarded.split(',')[0]?.trim() ?? '';
  return first ? stripPort(first) : '';
}

/**
 * True if IP is missing or local/private (GeoIP cannot resolve).
 */
export function isLocalOrUnusableIp(ip: string): boolean {
  if (!ip || ip.length === 0) return true;
  const trimmed = ip.trim().toLowerCase();
  if (trimmed === '127.0.0.1' || trimmed === '::1' || trimmed === 'localhost') return true;
  if (trimmed.startsWith('fe80:') || trimmed.startsWith('169.254.')) return true; // link-local
  const octets = trimmed.split('.');
  if (octets.length === 4) {
    const a = parseInt(octets[0], 10);
    const b = parseInt(octets[1], 10);
    if (isNaN(a) || isNaN(b)) return true;
    if (a === 10) return true; // 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true; // 192.168.0.0/16
  }
  return false;
}

/**
 * The visitor's IP address, or '' when no header carries a usable one.
 *
 * Takes a plain `Request` as well as a `NextRequest` — only `headers.get` is
 * used, and the admin route handlers are typed on the former.
 */
export function getClientIp(request: Request | NextRequest): string {
  for (const header of CLIENT_IP_HEADERS) {
    const ip = pickClientIp(request.headers.get(header) ?? '');
    if (ip) return ip;
  }
  return '';
}

/**
 * Headers to forward the real client IP to a backend (for GeoIP etc.).
 * Use when calling api.park.fan from API routes; backend sees our server IP otherwise.
 */
export function getForwardedForHeaders(request: Request | NextRequest): {
  'X-Forwarded-For'?: string;
} {
  const clientIp = getClientIp(request);
  return clientIp ? { 'X-Forwarded-For': clientIp } : {};
}
