import { NextRequest } from 'next/server';
import { relayJsonWrite } from '@/lib/api/relay';

/**
 * Storing a plan. A thin relay, see `lib/api/relay.ts`, which also says why the visitor's own
 * address goes along.
 *
 * No `revalidate`, no CDN header: a trip is one visitor's and a shared edge copy
 * would hand the next reader somebody else's plan.
 */
export const POST = (request: NextRequest) =>
  relayJsonWrite(request, '/v1/trips', { method: 'POST', unreachable: 'Trip service unreachable' });
