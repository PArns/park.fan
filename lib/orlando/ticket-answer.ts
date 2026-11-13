'use client';

import { localChoice } from './local-choice';

/**
 * Whether this browser answered "Do you already have tickets?", so the walk asks once and the
 * Tickets row knows how to word itself. "Not yet" leaves no trace in the URL (no `tickets=`), so
 * the answer itself lives here; the tickets do not.
 */
export const orlandoTicketAnswer = localChoice<'yes' | 'no'>('parkfan_orlando_tickets_asked', [
  'yes',
  'no',
]);
