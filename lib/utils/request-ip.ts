import type { NextRequest } from 'next/server';

/**
 * Where to look for the visitor's IP, in order of trust. park.fan is served through Cloudflare →
 * Vercel, so Vercel's `x-forwarded-for` and `x-real-ip` name a Cloudflare edge, not the visitor;
 * `cf-connecting-ip` must come first or every GeoIP lookup resolves to a datacenter.
 */
const CLIENT_IP_HEADERS = [
  'cf-connecting-ip', // Cloudflare: always the true client, always a single address
  'true-client-ip', // Cloudflare Enterprise alias for the same value
  'x-forwarded-for', // no Cloudflare in front: direct *.vercel.app, local dev
  'x-real-ip',
] as const;

/** Drop an optional port and IPv6 brackets: `1.2.3.4:5678` → `1.2.3.4`, `[::1]:443` → `::1`. */
function stripPort(ip: string): string {
  const bracketed = /^\[(.+?)\](?::\d+)?$/.exec(ip);
  if (bracketed) return bracketed[1];
  // A bare `host:port` is only unambiguous for IPv4; in IPv6 every colon is a separator.
  if (ip.includes('.') && ip.split(':').length === 2) return ip.split(':')[0];
  return ip;
}

/**
 * Take the originating client out of a (possibly comma-separated) forwarding chain: the leftmost
 * entry, IPv6 included, since api.park.fan geolocates IPv6 correctly.
 */
export function pickClientIp(forwarded: string): string {
  const first = forwarded.split(',')[0]?.trim() ?? '';
  return first ? stripPort(first) : '';
}

/** True if the IP is missing or local/private, which GeoIP cannot resolve. */
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
 * The visitor's IP address, or '' when no header carries a usable one. Takes a plain `Request` too,
 * since the admin route handlers are typed on it.
 */
export function getClientIp(request: Request | NextRequest): string {
  for (const header of CLIENT_IP_HEADERS) {
    const ip = pickClientIp(request.headers.get(header) ?? '');
    if (ip) return ip;
  }
  return '';
}

/**
 * Headers forwarding the real client IP to the backend for GeoIP; without them api.park.fan sees
 * our server's IP.
 */
export function getForwardedForHeaders(request: Request | NextRequest): {
  'X-Forwarded-For'?: string;
} {
  const clientIp = getClientIp(request);
  return clientIp ? { 'X-Forwarded-For': clientIp } : {};
}
