import { NextRequest } from 'next/server';
import { relayPushGet, relayPushWrite } from '@/lib/api/push-relay';

/**
 * A browser's followed shows. Same thin-relay shape as
 * `app/api/push/ride-alerts/route.ts` — see `lib/api/push-relay.ts`.
 */
const API_PATH = '/v1/push/show-follows';

export const GET = (request: NextRequest) => relayPushGet(request, API_PATH);
export const POST = (request: NextRequest) => relayPushWrite(request, API_PATH, 'POST');
export const DELETE = (request: NextRequest) => relayPushWrite(request, API_PATH, 'DELETE');
