import 'server-only';

import { api } from './client';
import { CACHE_TTL } from './cache-config';
import { parkCacheTag } from './park-live-projection';
import { purchaseDays, type PurchaseDay } from '@/lib/parks/purchases';
import type { ScheduleItem } from './types';

/**
 * A park's day prices for paid queue products (Disney's Lightning Lane), from its `/schedule` rows
 * asked without a window: the API's own today to `PURCHASE_DAYS_AHEAD` days on, so every reader of
 * a park shares one Data Cache entry. Only the days that carry purchases, each as `purchaseDays`
 * keeps it. A park without any answers an empty list; a failure throws.
 */
export async function getParkPurchaseDays(
  continent: string,
  country: string,
  city: string,
  parkSlug: string
): Promise<PurchaseDay[]> {
  const response = await api.get<{ schedule?: Partial<ScheduleItem>[] }>(
    `/v1/parks/${continent}/${country}/${city}/${parkSlug}/schedule`,
    {
      next: {
        revalidate: CACHE_TTL.parkSchedule,
        tags: ['parks', parkCacheTag(continent, country, city, parkSlug)],
      },
    }
  );
  return purchaseDays(response.schedule);
}
