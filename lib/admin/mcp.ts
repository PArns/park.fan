import { API_ORIGIN } from '@/lib/api/client';

/**
 * What the admin knows about the API's MCP server: where it is, how a client connects, the shapes
 * the consent page and the token list read, and the guards that decide what the consent page may
 * show and where it may send the browser. Pure, so `pnpm test:admin-mcp` can pin the guards without
 * a browser.
 */

/** The address an MCP client connects to. */
export const MCP_URL = `${API_ORIGIN}/v1/mcp`;

/** The name Claude Code registers the server under, so `/mcp` lists it by a name that says whose it is. */
export const MCP_SERVER_NAME = 'parkfan-admin';

/** The one line that adds the server to Claude Code; the sign-in runs through `/mcp` afterwards. */
export const CLAUDE_CODE_ADD_COMMAND = `claude mcp add --transport http ${MCP_SERVER_NAME} ${MCP_URL}`;

/** The same command with a personal token, for a machine where no browser can finish the sign-in. */
export function claudeCodeAddCommandWithToken(token: string): string {
  return `${CLAUDE_CODE_ADD_COMMAND} --header "Authorization: Bearer ${token}"`;
}

/**
 * One pending OAuth authorization, as `GET /v1/admin/oauth/requests/:id` answers it. `clientName`
 * is whatever the app typed when it registered, so only `redirectHost` says who receives the code.
 */
export interface OAuthConsentRequest {
  id: string;
  clientId: string;
  clientName: string | null;
  redirectHost: string;
  scope: string;
  expiresAt: string;
}

/** What approving or denying answers with: where to send the browser next. */
export interface OAuthDecision {
  redirectTo: string;
}

/**
 * A personal access token (`pat`) or an OAuth grant (`oauth`), as the token list answers it. A
 * grant has no `name` and carries the app's `clientName` instead.
 */
export interface AdminApiToken {
  id: string;
  kind: 'pat' | 'oauth';
  name: string | null;
  clientName: string | null;
  prefix: string;
  scope: string;
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
}

/** The answer to creating a token: the secret, which exists only in this response, and its row. */
export interface CreatedAdminApiToken {
  token: string;
  item: AdminApiToken;
}

/** The lifetimes the create dialog offers; `null` is a token that never expires. */
export const TOKEN_EXPIRY_OPTIONS: ReadonlyArray<{ days: 30 | 90 | 365 | null; label: string }> = [
  { days: 30, label: '30 Tage' },
  { days: 90, label: '90 Tage' },
  { days: 365, label: '1 Jahr' },
  { days: null, label: 'Läuft nie ab' },
];

/** The cache key prefix of the token list, per account (`self` for the signed-in one). */
export function apiTokenKey(userId?: string): readonly unknown[] {
  return ['admin', 'api-tokens', userId ?? 'self'];
}

/** The token list's path; `userId` asks for another account's, which only an owner may. */
export function apiTokensPath(userId?: string): string {
  return userId
    ? `/api/admin/auth/tokens?userId=${encodeURIComponent(userId)}`
    : '/api/admin/auth/tokens';
}

/**
 * The OAuth request in the address bar as a proxy path, or null when it holds nothing the proxy
 * would carry (empty or longer than any id the API issues).
 */
export function consentRequestPath(requestId: string | null): string | null {
  const id = requestId?.trim() ?? '';
  if (id.length === 0 || id.length > 200) return null;
  return `/api/admin/oauth/requests/${encodeURIComponent(id)}`;
}

/** What each scope the API knows lets an app do, in the words the consent page uses. */
const SCOPE_LABELS: Record<string, string> = {
  'admin:read': 'Den Admin lesen',
};

/**
 * Splits a space-separated OAuth `scope` into the ones the page can describe and the ones it
 * cannot. An unknown scope is shown raw instead of dropped, so a scope the API adds before this
 * page learns it is never approved unseen.
 */
export function describeScopes(scope: string): { known: string[]; unknown: string[] } {
  const known: string[] = [];
  const unknown: string[] = [];
  for (const entry of scope.split(/\s+/).filter(Boolean)) {
    const label = SCOPE_LABELS[entry];
    if (label) known.push(label);
    else unknown.push(entry);
  }
  return { known, unknown };
}

const NAME_LIMIT = 60;

/**
 * The app name as the consent page prints it: control characters, zero-width characters and
 * bidirectional overrides removed (a name that reorders the text around it can pass for another),
 * whitespace collapsed, cut at 60 characters. An empty result reads `Unbenannte App`.
 */
export function displayClientName(raw: string | null | undefined): string {
  const cleaned = (raw ?? '')
    .replace(/[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length === 0) return 'Unbenannte App';
  const characters = Array.from(cleaned);
  return characters.length > NAME_LIMIT ? `${characters.slice(0, NAME_LIMIT).join('')}…` : cleaned;
}

const LOOPBACK_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/** The host without a port: `localhost:53124` and `[::1]:8080` give `localhost` and `[::1]`. */
function hostnameOf(host: string): string {
  const lower = host.trim().toLowerCase();
  if (lower.startsWith('[')) {
    const close = lower.indexOf(']');
    return close === -1 ? lower : lower.slice(0, close + 1);
  }
  return lower.split(':')[0];
}

/**
 * What a redirect host tells the person reading it: whether it is the computer they are sitting at
 * (Claude Code listens on a loopback port) and whether a label is written in Punycode (`xn--`), the
 * form in which look-alike domains are registered.
 */
export function describeRedirectHost(host: string): { local: boolean; punycode: boolean } {
  const hostname = hostnameOf(host);
  return {
    local: LOOPBACK_HOSTNAMES.has(hostname),
    punycode: hostname.split('.').some((label) => label.startsWith('xn--')),
  };
}

/**
 * The address the browser may be sent to after a decision, or null. It has to be `https`, or
 * `http` on a loopback address, and its host has to be the one the consent page showed: what the
 * person read is where the code goes, and a response that says otherwise is not followed.
 */
export function safeRedirectTarget(redirectTo: unknown, shownHost: string): string | null {
  if (typeof redirectTo !== 'string') return null;
  let url: URL;
  try {
    url = new URL(redirectTo);
  } catch {
    return null;
  }

  const hostname = hostnameOf(url.host);
  const secure = url.protocol === 'https:';
  const loopback = url.protocol === 'http:' && LOOPBACK_HOSTNAMES.has(hostname);
  if (!secure && !loopback) return null;
  if (url.username || url.password) return null;

  // The API may state the host with or without its port; a loopback client's port is the part
  // that changes between sessions.
  const shown = shownHost.trim().toLowerCase();
  if (url.host.toLowerCase() !== shown && hostname !== shown) return null;
  return url.toString();
}

/** Whether an ISO time has passed at `nowMs`; a missing time never expires. */
export function hasPassed(iso: string | null, nowMs: number): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  return Number.isFinite(time) && time <= nowMs;
}
