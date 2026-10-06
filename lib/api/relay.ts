import { NextRequest, NextResponse } from 'next/server';
import { getApiBaseUrl, getServerApiHeaders } from '@/lib/api/client';
import { getForwardedForHeaders } from '@/lib/utils/request-ip';

/**
 * The thin relay the trip and push routes share.
 *
 * Thin on purpose: the API owns every rule about what's valid here (that a
 * subscription exists, that a threshold is in range, that a topic is known).
 * Duplicating any of it would put the same check in two repositories, and
 * the copy that drifts is the one nothing tests. The status is passed
 * through rather than flattened for the same reason: 503, 404, 400 and 429
 * mean different things to whatever called this, and collapsing them into
 * "failed" is how a visitor ends up retrying something that will never work.
 *
 * The visitor's own address goes along because the API rate-limits these
 * writes per address. Without it every request from this site keys on one
 * function's IP: one bucket for the whole world, which is either no limit at
 * all or a limit that locks everybody out together.
 */

const JSON_NO_STORE = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

/** How one relayed request goes upstream and how an empty answer comes back. */
interface RelayInit {
  method?: 'POST' | 'PUT' | 'DELETE';
  /** Sent upstream as JSON. */
  body?: unknown;
  /** Labels the upstream request as JSON; on whenever there is a body. */
  json?: boolean;
  /** The error a 502 carries when the backend cannot be reached. */
  unreachable: string;
  /** Answers an empty upstream body; when absent or returning nothing, it is passed on with the JSON headers. */
  answerEmpty?: (status: number) => NextResponse | undefined;
}

/** Sends one request to the backend and hands its status and body back unchanged. */
export async function relayToApi(
  request: NextRequest,
  apiPath: string,
  { method, body, json = body !== undefined, unreachable, answerEmpty }: RelayInit
): Promise<NextResponse> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${apiPath}`, {
      method,
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        ...getForwardedForHeaders(request),
        ...getServerApiHeaders(),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
    });
    const text = await response.text();
    return (
      (text ? undefined : answerEmpty?.(response.status)) ??
      new NextResponse(text || null, { status: response.status, headers: JSON_NO_STORE })
    );
  } catch {
    return NextResponse.json({ error: unreachable }, { status: 502 });
  }
}

/** Relays a write with the request's JSON body forwarded as-is, or answers 400 when it is not JSON. */
export async function relayJsonWrite(
  request: NextRequest,
  apiPath: string,
  init: Omit<RelayInit, 'body' | 'json'> & { method: 'POST' | 'PUT' | 'DELETE' }
): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  return relayToApi(request, apiPath, { ...init, body });
}

const PUSH_UNREACHABLE = 'Push service unreachable';

/** Relays `GET <apiPath>?endpoint=…`, the "list this browser's own rows" read of `ride-alerts` and `show-follows`. */
export async function relayPushGet(request: NextRequest, apiPath: string): Promise<NextResponse> {
  const endpoint = request.nextUrl.searchParams.get('endpoint');
  if (!endpoint) {
    return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
  }
  return relayToApi(request, `${apiPath}?endpoint=${encodeURIComponent(endpoint)}`, {
    unreachable: PUSH_UNREACHABLE,
  });
}

/** Relays a push `POST` or `DELETE` with the request's JSON body forwarded as-is. */
export function relayPushWrite(
  request: NextRequest,
  apiPath: string,
  method: 'POST' | 'DELETE'
): Promise<NextResponse> {
  return relayJsonWrite(request, apiPath, {
    method,
    unreachable: PUSH_UNREACHABLE,
    // A 204 goes back bare, without the JSON headers of a body it does not have.
    answerEmpty: (status) => (status === 204 ? new NextResponse(null, { status }) : undefined),
  });
}
