/**
 * Pure URL parsers for the inline embeds. A standalone link to one of these
 * providers (a paragraph that is just the link) is turned into an embed by the
 * blog markdown renderer.
 */

export interface YouTubeRef {
  id: string;
  /** Optional start offset in seconds. */
  start?: number;
}

/** Parse a `t`/`start` value like `90`, `1m30s`, `45s` into seconds. */
function parseStart(raw: string): number | undefined {
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(raw);
  if (!m || (!m[1] && !m[2] && !m[3])) return undefined;
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

/** Recognise the common YouTube URL shapes and extract the video id. */
export function parseYouTube(url: unknown): YouTubeRef | null {
  if (typeof url !== 'string') return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^(www\.|m\.)/, '');
  let id: string | null = null;
  if (host === 'youtu.be') {
    id = u.pathname.slice(1).split('/')[0] || null;
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (u.pathname === '/watch') id = u.searchParams.get('v');
    else if (/^\/(shorts|embed|live|v)\//.test(u.pathname)) id = u.pathname.split('/')[2] ?? null;
  }
  if (!id || !/^[A-Za-z0-9_-]{6,}$/.test(id)) return null;
  const t = u.searchParams.get('t') ?? u.searchParams.get('start');
  const start = t ? parseStart(t) : undefined;
  return { id, ...(start ? { start } : {}) };
}

/**
 * Extract a Suno song id from a `suno.com/song/<uuid>` or `/embed/<uuid>` URL.
 * Short share links (`/s/<code>`) can't be embedded — use the full song URL.
 */
export function parseSuno(url: unknown): { id: string } | null {
  if (typeof url !== 'string') return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  if (u.hostname.replace(/^www\./, '') !== 'suno.com') return null;
  const m = /^\/(song|embed)\/([0-9a-f-]{36})/i.exec(u.pathname);
  return m ? { id: m[2] } : null;
}

/** Validate + normalise an Instagram post / reel / tv permalink. */
export function parseInstagram(url: unknown): { url: string } | null {
  if (typeof url !== 'string') return null;
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\./, '');
  if (host !== 'instagram.com') return null;
  if (!/^\/(p|reel|tv)\/[^/]+\/?$/.test(u.pathname)) return null;
  return { url: `${u.origin}${u.pathname}` };
}
