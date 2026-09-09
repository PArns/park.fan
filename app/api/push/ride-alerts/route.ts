import { NextRequest } from 'next/server';
import { relayPushGet, relayPushWrite } from '@/lib/api/push-relay';

/**
 * A browser's wait-time alerts. Thin relay — see `lib/api/push-relay.ts` for
 * why, and `app/api/push/subscriptions/route.ts` / `.../show-follows/route.ts`
 * for its siblings.
 */
const API_PATH = '/v1/push/ride-alerts';

export const GET = (request: NextRequest) => relayPushGet(request, API_PATH);
export const POST = (request: NextRequest) => relayPushWrite(request, API_PATH, 'POST');
export const DELETE = (request: NextRequest) => relayPushWrite(request, API_PATH, 'DELETE');
