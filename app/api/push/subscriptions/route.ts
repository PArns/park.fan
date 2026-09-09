import { NextRequest } from 'next/server';
import { relayPushWrite } from '@/lib/api/push-relay';

/**
 * Subscribing and unsubscribing a browser. Same thin-relay shape as
 * `app/api/push/ride-alerts/route.ts` — see `lib/api/push-relay.ts`. No
 * `GET`: a subscription is never listed back, only written or removed.
 */
const API_PATH = '/v1/push/subscriptions';

export const POST = (request: NextRequest) => relayPushWrite(request, API_PATH, 'POST');
export const DELETE = (request: NextRequest) => relayPushWrite(request, API_PATH, 'DELETE');
