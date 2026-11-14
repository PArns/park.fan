'use client';

import { localChoice, type LocalChoice } from './local-choice';

const answers = new Map<string, LocalChoice<'yes' | 'no'>>();

/**
 * Whether this browser answered "Do you already have tickets?", so the walk asks once and the
 * Tickets row knows how to word itself. "Not yet" leaves no trace in the URL (no `tickets=`), so
 * the answer itself lives here, per region (`parkfan_<region>_tickets_asked`); the tickets do
 * not.
 */
export function tripTicketAnswer(region: string): LocalChoice<'yes' | 'no'> {
  let store = answers.get(region);
  if (!store) {
    store = localChoice<'yes' | 'no'>(`parkfan_${region}_tickets_asked`, ['yes', 'no']);
    answers.set(region, store);
  }
  return store;
}
