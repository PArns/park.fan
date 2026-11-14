import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { hubPhoto } from '@/lib/trip-regions/hub-media';
import { HubPlanAction } from './hub-hero-action';
import { HubLandingOnly } from './hub-trip-state';

/**
 * The landing page's last word before the questions' links and the closing band: the region's
 * Parky picture, one line on the planner and „Reise planen“, which starts it like the head's
 * button. A card (`data-card`), so its `<h2>` is no bare one. Hidden while the hub shows a plan.
 */
export async function HubFinalCta({
  region,
  scene,
  locale,
  planHref,
  page,
}: {
  region: string;
  /** The region's Parky picture, a media id. */
  scene: string;
  locale: string;
  planHref: string;
  page: 'hub' | 'month';
}) {
  const t = await getTranslations('tripHub');
  const photo = hubPhoto(scene, locale);
  return (
    <HubLandingOnly>
      <section
        data-card=""
        className="border-border/60 bg-card grid overflow-hidden rounded-2xl border shadow-sm md:grid-cols-[1fr_minmax(0,24rem)] md:items-center"
      >
        <div className="space-y-3 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-balance sm:text-2xl">{t('finalCta.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">{t('finalCta.text')}</p>
          <HubPlanAction
            href={planHref}
            label={t('plan')}
            region={region}
            page={page}
            className="max-sm:w-full"
          />
        </div>
        {photo && (
          <Image
            src={photo.src}
            alt=""
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 100vw, 384px"
            className="aspect-[2/1] size-full object-cover max-md:order-first"
            style={{ objectPosition: photo.position }}
          />
        )}
      </section>
    </HubLandingOnly>
  );
}
