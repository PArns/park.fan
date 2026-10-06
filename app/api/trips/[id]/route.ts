import { NextRequest, NextResponse } from 'next/server';
import { relayJsonWrite, relayToApi } from '@/lib/api/relay';

/**
 * Reading, replacing and deleting one stored plan. The id is the credential, so the only check is
 * its shape (16 base64url characters), which keeps a scanner's `../` out of the upstream request.
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
 * Deletes one stored plan, sent when push is switched off: that forgets the id, which is the
 * credential, so without this the plan would stay readable to whoever kept it. Statuses pass
 * through unchanged; reading a 404 as done is the client's job (`forgetTrip`).
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
