'use client';

import { useTranslations } from 'next-intl';
import { getListFormat } from '@/lib/utils/intl-format';
import { ticketProblem } from '@/lib/orlando/plan-tickets';
import { usePlanContext } from './plan-context';
import { useHopperWord, useResortWord, useTicketName } from './plan-ticket-words';
import type { TicketStep } from './plan-tickets';

/** The Tickets row's one line and how it reads. */
export interface TicketSummary {
  value: string;
  /** `ask` while the question is open, `warn` when the trip misses a ticket. */
  tone: 'ask' | 'warn' | 'quiet' | 'set';
}

/**
 * The Tickets row's line: "Already have tickets?" until answered, the tickets by name ("Disney
 * 14-Day Magic Ticket · Universal 14-day ticket"), three or more counted by resort, the ticket the
 * trip misses, or "No tickets entered" (with the hopper plan first runs with). `null` without a
 * catalog, which hides the step.
 */
export function useTicketSummary(step: TicketStep): TicketSummary | null {
  const t = useTranslations('orlandoPlanner.tickets.row');
  const { state, tickets: catalog, locale } = usePlanContext();
  const name = useTicketName();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  if (catalog.size === 0) return null;

  const problem = ticketProblem(state, catalog);
  if (problem) {
    const ticket = state.tickets[problem.index];
    return { value: t(problem.kind, { ticket: name(ticket, true) }), tone: 'warn' };
  }
  const list = getListFormat(locale, { style: 'long', type: 'conjunction' });
  if (state.tickets.length > 2) {
    const resorts = [
      ...new Set(state.tickets.map((ticket) => catalog.get(ticket.product)?.resort ?? '')),
    ].filter(Boolean);
    return {
      value: t('count', {
        count: state.tickets.length,
        resorts: list.format(resorts.map(resortWord)),
      }),
      tone: 'set',
    };
  }
  if (state.tickets.length > 0) {
    return {
      value: state.tickets
        .map((ticket) => {
          const product = catalog.get(ticket.product);
          const open = !ticket.start && product && !product.pass;
          return open ? t('startOpen', { ticket: name(ticket, true) }) : name(ticket, true);
        })
        .join(' · '),
      tone: 'set',
    };
  }
  if (step.answer === 'unasked') return { value: t('ask'), tone: 'ask' };
  const hoppers =
    state.ticket === 'hopper'
      ? [hopperWord('walt-disney-world'), hopperWord('universal-orlando')]
      : [...new Set(state.hopper.map(hopperWord))];
  return {
    value: hoppers.length > 0 ? t('noneHopper', { hopper: list.format(hoppers) }) : t('none'),
    tone: 'quiet',
  };
}
