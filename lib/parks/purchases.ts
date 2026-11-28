import type { ScheduleItem, SchedulePurchaseItem } from '@/lib/api/types';
import { addDays } from '@/lib/utils/park-day';

/**
 * How far past the park's today the purchases relay reaches: the API's `/schedule` asked without a
 * window answers from that day 30 days on (backend `docs/frontend/schedule.md`), and the relay asks
 * it so, which keeps one cache entry per park.
 */
export const PURCHASE_DAYS_AHEAD = 30;

/**
 * Whether a day lies in the purchases relay's answer: from `today` to {@link PURCHASE_DAYS_AHEAD}
 * days on. A day outside it is not asked for, since the answer could not hold it.
 */
export function inPurchaseWindow(date: string, today: string | null): boolean {
  return today !== null && date >= today && date <= addDays(today, PURCHASE_DAYS_AHEAD);
}

/**
 * One day of a park's paid queue products, as much of a schedule row as `ParkPurchasesCard` reads:
 * a full `ScheduleItem` from the park, or a {@link purchaseDays} row from the purchases relay.
 */
export type PurchaseDay = Pick<ScheduleItem, 'date' | 'purchases'>;

/**
 * The price a purchase shows, or `null` where the API sent a placeholder (amount 0, formatted
 * "Unknown") because the real fee is not known: the rule `QueueTypeBadge` applies too.
 */
export function formattedPurchasePrice(item: SchedulePurchaseItem): string | null {
  if (!item.price) return null;
  const { amount, formatted } = item.price;
  if (!formatted || formatted.trim().toLowerCase() === 'unknown') return null;
  if (typeof amount === 'number' && amount <= 0) return null;
  return formatted;
}

/**
 * The day whose purchases a card shows: `date` itself where one is named, else the first day from
 * `from` on that carries any. `null` when that day has none, so the card renders nothing.
 */
export function pickPurchaseDay<T extends PurchaseDay>(
  schedule: readonly T[] | null | undefined,
  day: { date: string } | { from: string }
): T | null {
  if (!schedule?.length) return null;
  const withPurchases = schedule.filter((s) => (s.purchases?.length ?? 0) > 0);
  if ('date' in day) return withPurchases.find((s) => s.date === day.date) ?? null;
  return (
    withPurchases
      .filter((s) => s.date >= day.from)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  );
}

/** Packages (Multi Pass, Premier Pass) first, then the per-ride passes A→Z. */
export function sortPurchases(items: readonly SchedulePurchaseItem[]): SchedulePurchaseItem[] {
  return [...items].sort((a, b) => {
    const aPkg = a.type === 'PACKAGE' ? 0 : 1;
    const bPkg = b.type === 'PACKAGE' ? 0 : 1;
    return aPkg !== bPkg ? aPkg - bPkg : a.name.localeCompare(b.name);
  });
}

/**
 * The relay's answer from a park's `/schedule` rows: one entry per date that carries purchases,
 * from the first such row of that date as `pickPurchaseDay` would take it, and of each purchase the
 * fields the card draws. A list of kept fields, so whatever the source adds to a row or a purchase
 * stays out of the response.
 */
export function purchaseDays(
  schedule: readonly Partial<PurchaseDay>[] | null | undefined
): PurchaseDay[] {
  const days: PurchaseDay[] = [];
  const seen = new Set<string>();
  for (const row of schedule ?? []) {
    if (!row.date || seen.has(row.date) || !row.purchases?.length) continue;
    seen.add(row.date);
    days.push({
      date: row.date,
      purchases: row.purchases.map(({ id, name, type, price, available }) => ({
        ...(id !== undefined && { id }),
        name,
        ...(type !== undefined && { type }),
        price: price
          ? {
              amount: price.amount,
              currency: price.currency,
              ...(price.formatted !== undefined && { formatted: price.formatted }),
            }
          : null,
        ...(available !== undefined && { available }),
      })),
    });
  }
  return days.sort((a, b) => a.date.localeCompare(b.date));
}
