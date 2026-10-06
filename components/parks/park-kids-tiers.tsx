import { getTranslations } from 'next-intl/server';
import { Ruler } from 'lucide-react';

import { ChapterHeading } from '@/components/common/chapter-heading';
import { RiderHeight } from '@/components/common/unit-display';
import { GlassCard } from '@/components/common/glass-card';
import { KidsPlannerButton } from '@/components/parks/kids-planner-button';
import { Link } from '@/i18n/navigation';
import type { KidsPageData, KidsTierRide } from '@/lib/parks/kids-page';
import type { Locale } from '@/i18n/config';

interface ParkKidsTiersProps {
  data: KidsPageData;
  locale: Locale;
  parkSlug: string;
  /** `/parks/<continent>/<country>/<city>/<park>`, locale-relative. */
  parkPath: string;
}

/** A comma-separated run of ride links, each to its own ride page. */
function RideLinks({ rides, parkPath }: { rides: KidsTierRide[]; parkPath: string }) {
  return (
    <>
      {rides.map((ride, i) => (
        <span key={ride.slug}>
          {i > 0 && ', '}
          <Link
            href={`${parkPath}/${ride.slug}`}
            className="decoration-primary/40 hover:decoration-primary underline underline-offset-2"
          >
            {ride.name}
          </Link>
        </span>
      ))}
    </>
  );
}

/**
 * The park's height ladder: one card per height at which its answer changes. The steps and counts
 * come from the same `riderHeightThresholds` and `canRideAtHeight` as the park page's slider, so
 * the two pages cannot give a parent two answers. Each card lists the rides that open up at exactly
 * its height.
 *
 * The first card is what carries no limit at all, and says no more than the payload: a missing
 * limit means nobody wrote one down, not that nobody is too small (`RiderHeightLimits`).
 */
export async function ParkKidsTiers({ data, locale, parkSlug, parkPath }: ParkKidsTiersProps) {
  const t = await getTranslations('parks.kidsPage');

  return (
    <section className="mt-8" aria-labelledby="kids-tiers-heading">
      <ChapterHeading
        icon={Ruler}
        title={t('tiersTitle')}
        id="kids-tiers-heading"
        frosted
        hint={t('tiersHint', { withHeight: data.withHeight, total: data.total })}
      />
      <ol className="space-y-4">
        <li>
          <GlassCard variant="tile">
            <h3 className="font-medium">{t('noLimitTitle')}</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {t('rideableCount', { rideable: data.rideableAtZero, total: data.total })}
            </p>
            {data.withoutHeight.length > 0 && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium max-sm:min-h-11">
                  {t('noLimitSummary', { count: data.withoutHeight.length })}
                </summary>
                <p className="text-muted-foreground mt-2 leading-relaxed">
                  <RideLinks rides={data.withoutHeight} parkPath={parkPath} />
                </p>
                <p className="text-muted-foreground mt-2 leading-relaxed">{t('noLimitNote')}</p>
              </details>
            )}
          </GlassCard>
        </li>
        {data.tiers.map((tier) => (
          <li key={tier.cm}>
            <GlassCard variant="tile">
              <h3 className="font-medium">
                {t('tierTitle')} <RiderHeight cm={tier.cm} />
              </h3>
              <p className="text-muted-foreground mt-1 text-sm">
                {t('rideableCount', { rideable: tier.rideable, total: data.total })}
              </p>
              <p className="mt-3 text-sm leading-relaxed">
                <span className="font-medium">
                  {t('newAtTier', { count: tier.newRides.length })}{' '}
                </span>
                <RideLinks rides={tier.newRides} parkPath={parkPath} />
              </p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
                <Link
                  href={`${parkPath}?height=${tier.cm}`}
                  prefetch={false}
                  className="text-primary text-sm font-medium hover:underline max-sm:inline-flex max-sm:min-h-11 max-sm:items-center"
                >
                  {t('filterOnPark')}
                </Link>
                <KidsPlannerButton
                  parkSlug={parkSlug}
                  cm={tier.cm}
                  locale={locale}
                  label={t('planForHeight')}
                />
              </div>
            </GlassCard>
          </li>
        ))}
      </ol>
    </section>
  );
}
