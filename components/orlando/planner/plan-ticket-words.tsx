'use client';

import { useTranslations } from 'next-intl';
import { entryOfProduct, soldLengths, type TicketCatalog } from '@/lib/orlando/plan-tickets';
import type { PlanTicket } from '@/lib/orlando/plan-query';
import { usePlanContext } from './plan-context';

/** The four ticket groups' keys, which `tickets.resortShort` and `tickets.resort` are keyed by. */
const KNOWN_RESORTS = new Set([
  'walt-disney-world',
  'universal-orlando',
  'seaworld-orlando',
  'day-trips',
]);

/** A resort as copy names it in a sentence: "Disney", "Universal", "SeaWorld", "LEGOLAND". */
export function useResortWord(): (resort: string) => string {
  const t = useTranslations('orlandoPlanner.tickets');
  const { groupByKey } = usePlanContext();
  return (resort) =>
    KNOWN_RESORTS.has(resort)
      ? t(`resortShort.${resort}`)
      : (groupByKey.get(resort)?.name ?? resort);
}

/** A resort's hopper by its operator's name: Disney's Park Hopper, Universal's park-to-park. */
export function useHopperWord(): (resort: string) => string {
  const t = useTranslations('orlandoPlanner.tickets');
  return (resort) =>
    t(resort === 'universal-orlando' ? 'hopperName.universal' : 'hopperName.disney');
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
  const t = useTranslations('orlandoPlanner.tickets');
  const { tickets: catalog } = usePlanContext();
  const resortWord = useResortWord();
  const hopperWord = useHopperWord();
  return (ticket, short = false) => {
    const product = catalog.get(ticket.product);
    const entry = entryOfProduct(ticket.product);
    const resort = product?.resort ?? entry?.resort ?? '';
    const lengths = product ? soldLengths(product) : null;
    const days = ticket.days ?? (lengths?.length === 1 ? lengths[0] : null);
    const dated = entry?.key === 'wdw-dated' || entry?.key === 'uor-dated';
    const name =
      dated && days !== null
        ? t(short ? 'named.datedShort' : 'named.dated', { resort: resortWord(resort), days })
        : short && entry
          ? t('named.short', { resort: resortWord(resort), name: t(`entry.${entry.key}.title`) })
          : productName(catalog, ticket.product);
    if (ticket.hopper !== 'yes' || product?.hopping !== 'optional') return name;
    return t(short ? 'named.withHopperShort' : 'named.withHopper', {
      name,
      hopper: hopperWord(resort),
    });
  };
}
