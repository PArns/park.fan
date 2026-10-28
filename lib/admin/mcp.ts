import { API_ORIGIN } from '@/lib/api/client';
import { TOTP_CODE_LENGTH } from './totp';

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
  /** When the app started the request, ISO. Absent from an API that does not send it yet. */
  createdAt?: string;
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

/**
 * The proof a sensitive request carries: the password again, and the code when the account has a
 * second factor, so a stolen session cannot act alone. `totpCode` is left out unless it is a full
 * code.
 */
export function passwordProofBody(input: { password: string; totpCode: string }): {
  password: string;
  totpCode?: string;
} {
  const code = input.totpCode.trim();
  return {
    password: input.password,
    ...(code.length === TOTP_CODE_LENGTH ? { totpCode: code } : {}),
  };
}

/** The body of `POST /v1/admin/auth/tokens`: the token's settings and the {@link passwordProofBody}. */
export function createTokenBody(input: {
  name: string;
  /** The lifetime in days, `null` for none. */
  expiresInDays: number | null;
  password: string;
  totpCode: string;
}): {
  name: string;
  expiresInDays: number | null;
  password: string;
  totpCode?: string;
} {
  return {
    name: input.name.trim(),
    expiresInDays: input.expiresInDays,
    ...passwordProofBody(input),
  };
}

/** What a refused token creation means for the dialog: where to say it, and what it changes. */
interface TokenCreateProblem {
  /** The field the message belongs to; `null` for the dialog as a whole. */
  field: 'password' | 'code' | null;
  /** The account has a second factor the dialog did not know about: the code field has to show. */
  needsCode: boolean;
  /** The session itself is gone, so the page has to ask for it again. */
  sessionEnded: boolean;
  message: string;
}

/**
 * The German sentence for a refused `POST /v1/admin/auth/tokens` or consent approval, from the status and the JSON the
 * API answered with: `invalid-password`, `totp-required` and `invalid-totp` as 401s, the lockout
 * after too many failures as a 429 `rate-limited` with `retryAfterSeconds`, and anything else with
 * the API's own message. A code that signed the person in within the same 30 seconds counts as
 * used, so `invalid-totp` says to wait for the next one.
 */
export function describeTokenCreateError(
  status: number,
  payload: unknown,
  fallback: string
): TokenCreateProblem {
  const record = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const code = typeof record.error === 'string' ? record.error : '';
  const text = typeof record.message === 'string' ? record.message : '';
  const problem = (
    field: TokenCreateProblem['field'],
    message: string,
    more: Partial<Pick<TokenCreateProblem, 'needsCode' | 'sessionEnded'>> = {}
  ): TokenCreateProblem => ({ field, needsCode: false, sessionEnded: false, message, ...more });

  if (status === 401 && code === 'invalid-password') {
    return problem('password', 'Das Passwort stimmt nicht.');
  }
  if (status === 401 && code === 'totp-required') {
    return problem(
      'code',
      'Dieses Konto hat einen zweiten Faktor. Gib Passwort und Code aus deiner Authenticator-App ein.',
      { needsCode: true }
    );
  }
  if (status === 401 && code === 'invalid-totp') {
    return problem(
      'code',
      'Der Code stimmt nicht oder wurde schon benutzt, auch beim Anmelden. Warte auf den nächsten Code und gib Passwort und Code noch einmal ein.'
    );
  }
  if (status === 401) {
    return problem(null, 'Deine Sitzung ist abgelaufen. Melde dich neu an.', {
      sessionEnded: true,
    });
  }
  if (status === 429 || code === 'rate-limited' || /too many attempts/i.test(text)) {
    return problem(null, `Zu viele Fehlversuche. ${retryWords(record.retryAfterSeconds, text)}`);
  }
  return problem(null, fallback);
}

/** When to try again: from `retryAfterSeconds` rounded up to minutes, else from the limiter's own sentence. */
function retryWords(retryAfterSeconds: unknown, text: string): string {
  const seconds =
    typeof retryAfterSeconds === 'number' && Number.isFinite(retryAfterSeconds)
      ? retryAfterSeconds
      : null;
  const minutes =
    seconds !== null
      ? Math.max(1, Math.ceil(seconds / 60))
      : Number(/(\d+)\s*minutes?/i.exec(text)?.[1] ?? Number.NaN);
  if (!Number.isFinite(minutes)) return 'Versuche es später noch einmal.';
  return `Versuche es in ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'} noch einmal.`;
}

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

/** How long ago an OAuth request was started, in words, and whether that is long enough to doubt it. */
interface RequestAge {
  text: string;
  stale: boolean;
}

/** After this many minutes a request that the person says they just started is worth a second look. */
const STALE_REQUEST_MINUTES = 5;

/**
 * The age of a consent request for the page: `gerade eben gestartet`, `vor 2 Minuten gestartet`,
 * and `stale` above five minutes, since a person who has just pressed "connect" in the app arrives
 * within seconds. A request that is older was started earlier, perhaps by somebody who sent the
 * link. `null` when the API sent no usable time; a start a little in the future (clock skew) counts
 * as just now.
 */
export function describeRequestAge(
  createdAt: string | undefined,
  nowMs: number
): RequestAge | null {
  const started = createdAt ? Date.parse(createdAt) : Number.NaN;
  if (!Number.isFinite(started)) return null;
  const ageMs = Math.max(0, nowMs - started);
  const minutes = Math.floor(ageMs / 60_000);
  const text =
    minutes === 0
      ? 'gerade eben gestartet'
      : minutes === 1
        ? 'vor einer Minute gestartet'
        : `vor ${minutes} Minuten gestartet`;
  return { text, stale: ageMs > STALE_REQUEST_MINUTES * 60_000 };
}

/** Whether an ISO time has passed at `nowMs`; a missing time never expires. */
export function hasPassed(iso: string | null, nowMs: number): boolean {
  if (!iso) return false;
  const time = Date.parse(iso);
  return Number.isFinite(time) && time <= nowMs;
}
