'use client';

import { useTranslations } from 'next-intl';
import { entryOfProduct, soldLengths, type TicketCatalog } from '@/lib/trip-regions/plan-tickets';
import type { PlanTicket } from '@/lib/trip-regions/plan-query';
import { usePlanContext } from './plan-context';

/**
 * A resort as copy names it in a sentence: "Disney", "Universal", "SeaWorld", "LEGOLAND". The
 * ticket step's resorts have a word of the region's own (`tickets.resortShort`); any other group
 * is called by the API's name.
 */
export function useResortWord(): (resort: string) => string {
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { groupByKey, ticketStep } = usePlanContext();
  return (resort) =>
    ticketStep.resorts.includes(resort)
      ? tRegion(`resortShort.${resort}`)
      : (groupByKey.get(resort)?.name ?? resort);
}

/**
 * A resort's hopper by its operator's name: Disney's Park Hopper, Universal's park-to-park (the
 * ticket step's `hopperNames`; a resort without one takes the first).
 */
export function useHopperWord(): (resort: string) => string {
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { ticketStep } = usePlanContext();
  const fallback = Object.values(ticketStep.hopperNames)[0];
  return (resort) => {
    const key = `hopperName.${ticketStep.hopperNames[resort] ?? fallback}`;
    // A region without a hopper of its own (no ticket step) says the resort's name.
    return tRegion.has(key) ? tRegion(key) : resort;
  };
}

/** The operator's product name without the versions in brackets the catalog lists. */
export function productName(catalog: TicketCatalog, product: string): string {
  return (catalog.get(product)?.name ?? product).replace(/\s*\([^)]*\)\s*$/, '');
}

/**
 * A ticket by what is on it: "Disney 4-day ticket with Park Hopper" for a date-based ticket, the
 * operator's name for the rest. `short` drops the word "ticket" for the Tickets row: "Disney 4 days
 * + Park Hopper".
 */
export function useTicketName(): (
  ticket: Pick<PlanTicket, 'product' | 'days' | 'hopper'>,
  short?: boolean
) => string {
  const t = useTranslations('tripPlanner.tickets');
  const tRegion = useTranslations('tripRegion.planner.tickets');
  const { tickets: catalog, ticketStep } = usePlanContext();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  return (ticket, short = false) => {
    const product = catalog.get(ticket.product);
    const entry = entryOfProduct(ticketStep, ticket.product);
    const resort = product?.resort ?? entry?.resort ?? '';
    const lengths = product ? soldLengths(product) : null;
    const days = ticket.days ?? (lengths?.length === 1 ? lengths[0] : null);
    const dated = entry?.dated === true;
    const name =
      dated && days !== null
        ? t(short ? 'named.datedShort' : 'named.dated', { resort: resortWord(resort), days })
        : short && entry
          ? t('named.short', {
              resort: resortWord(resort),
              name: tRegion(`entry.${entry.key}.title`),
            })
          : productName(catalog, ticket.product);
    if (ticket.hopper !== 'yes' || product?.hopping !== 'optional') return name;
    return t(short ? 'named.withHopperShort' : 'named.withHopper', {
      name,
      hopper: hopperWord(resort),
    });
  };
}

/**
 * A sentence whose last word is a short date, with the stop it ends on once: German and French
 * abbreviate the month with a period ("20. Feb."), and the message's own stop would double it.
 */
export function oneStop(text: string): string {
  return text.replace(/\.\./g, '.');
}
