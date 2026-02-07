import type { NextRequest } from 'next/server';

/**
 * Pick one IP from a comma-separated chain, preferring IPv4 (GeoIP often works better with IPv4).
 */
export function pickClientIpPreferIpv4(forwarded: string): string {
  const parts = forwarded
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return '';
  const firstIpv4 = parts.find((ip) => !ip.includes(':'));
  return firstIpv4 ?? parts[0] ?? '';
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
 * Get client IP when the proxy did not set x-forwarded-for or x-real-ip.
 * Tries cf-connecting-ip (Cloudflare), then request.ip if the runtime provides it.
 */
export function getClientIpFromRequest(request: NextRequest): string {
  const cf = request.headers.get('cf-connecting-ip');
  if (cf?.trim()) return pickClientIpPreferIpv4(cf);
  const req = request as NextRequest & { ip?: string };
  if (typeof req.ip === 'string' && req.ip.trim()) return pickClientIpPreferIpv4(req.ip);
  return '';
}

/**
 * Headers to forward the real client IP to a backend (for GeoIP etc.).
 * Use when calling api.park.fan from API routes; backend sees our server IP otherwise.
 */
export function getForwardedForHeaders(request: NextRequest): { 'X-Forwarded-For'?: string } {
  const forwardedFromProxy =
    request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? '';
  const raw = forwardedFromProxy ? forwardedFromProxy.trim() : getClientIpFromRequest(request);
  const clientIp = raw ? pickClientIpPreferIpv4(raw) : '';
  return clientIp ? { 'X-Forwarded-For': clientIp } : {};
}
