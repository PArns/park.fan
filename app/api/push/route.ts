import type { NextRequest } from 'next/server';
import { PUSH_UNREACHABLE, relayToApi } from '@/lib/api/relay';

/**
 * Whether push works and the key to subscribe with, asked before the browser offers the control,
 * so a deploy without a VAPID keypair shows no switch that does nothing. Relayed with its status, as
 * a direct call to the API would answer: a failed probe must not read as `available: false`, which
 * the bell reports as "not configured" instead of "try again".
 */
export function GET(request: NextRequest) {
  return relayToApi(request, '/v1/push', { unreachable: PUSH_UNREACHABLE });
}
