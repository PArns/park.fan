import { NextRequest, NextResponse } from 'next/server';
import { relayJsonWrite, relayToApi } from '@/lib/api/relay';

/**
 * Reading, replacing and deleting one stored plan.
 *
 * The id is the credential, so this route checks nothing about who is asking —
 * there is nothing to check against. What it does check is that the id LOOKS
 * like one: 16 base64url characters, which is what the API issues. A path
 * segment that is not that shape cannot be a trip, and refusing it here keeps
 * a scanner's `../` and its SQL out of an upstream request entirely.
 */

/** What `TripsService.newId` produces: 12 random bytes as base64url. */
const TRIP_ID = /^[A-Za-z0-9_-]{16}$/;

const UNREACHABLE = 'Trip service unreachable';

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!TRIP_ID.test(id)) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  return relayToApi(request, `/v1/trips/${id}`, { json: true, unreachable: UNREACHABLE });
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!TRIP_ID.test(id)) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  return relayJsonWrite(request, `/v1/trips/${id}`, { method: 'PUT', unreachable: UNREACHABLE });
}

/**
 * Delete one stored plan.
 *
 * The browser sends this when push is switched off, and it is the only way a
 * visitor can reach their own row afterwards: switching off forgets the id, and
 * the id is the credential. Without it, "off" would leave the plan unreachable
 * to its owner for the rest of its 400 days while anybody who kept the id could
 * still read and overwrite it.
 *
 * No 400 branch, because the endpoint behind it has none: `DELETE /v1/trips/:id`
 * answers 204, 404 or 429 and nothing else. A 404 is not an error to relay
 * either — it is what a caller asking for a trip to be gone was asking for —
 * but that reading belongs to the client (`forgetTrip`), so the status travels
 * unchanged.
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!TRIP_ID.test(id)) {
    return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
  }
  return relayToApi(request, `/v1/trips/${id}`, {
    method: 'DELETE',
    unreachable: UNREACHABLE,
    // A 204 carries no body and may not be given one, so the JSON content type
    // goes with it: the success case here says everything in its status.
    answerEmpty: (status) =>
      new NextResponse(null, { status, headers: { 'Cache-Control': 'no-store' } }),
  });
}
