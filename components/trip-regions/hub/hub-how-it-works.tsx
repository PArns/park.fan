import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { ParkyInterviewStart } from '@/components/assistant/parky-interview-start';
import { hubShot } from '@/lib/trip-regions/hub-media';
import type { TripHubShots } from '@/lib/trip-regions/registry';
import { HubLandingOnly } from './hub-trip-state';

/** The planner's four steps as chapter 02 names them, in the order of `TripHub.howItWorks`. */
export const HUB_STEPS = ['dates', 'questions', 'plan', 'edit'] as const;

/**
 * Chapter 02 of the landing page: how the trip planner plans a trip, in four steps with a
 * screenshot each (the region's `hub.howItWorks`, in the page's language), then Parky's offer to
 * plan it with him in the chat, whose button opens him. Server HTML: every step, image and alt is in the served page;
 * swiped sideways on a phone, four columns from `md`. Hidden, not removed, while the hub shows a
 * plan, which then stands in this chapter instead.
 */
export async function HubHowItWorks({
  region,
  shots,
  locale,
}: {
  region: string;
  shots: TripHubShots;
  locale: string;
}) {
  const t = await getTranslations('tripHub');
  return (
    <HubLandingOnly className="space-y-6">
      <ol className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0 md:pb-0">
        {HUB_STEPS.map((step, i) => {
          const shot = hubShot(shots[i], locale);
          return (
            <li
              key={step}
              className="w-[78vw] max-w-80 shrink-0 snap-start md:w-auto md:max-w-none"
            >
              <figure className="group space-y-3">
                <div className="border-border/60 bg-muted/40 group-hover:border-primary/40 aspect-[4/3] overflow-hidden rounded-2xl border shadow-sm transition-[border-color,box-shadow] duration-200 group-hover:shadow-md">
                  {shot && (
                    <Image
                      src={shot.src}
                      alt={shot.alt}
                      width={shot.width}
                      height={shot.height}
                      sizes="(max-width: 768px) 78vw, 300px"
                      className="size-full object-cover transition-transform duration-500 ease-out motion-safe:group-hover:scale-[1.04]"
                      style={{ objectPosition: shot.position }}
                    />
                  )}
                </div>
                <figcaption className="flex gap-3">
                  <span
                    aria-hidden
                    className="bg-primary text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  >
                    {i + 1}
                  </span>
                  <div className="space-y-1">
                    <h3 className="font-semibold">{t(`howItWorks.steps.${step}.title`)}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(`howItWorks.steps.${step}.text`)}
                    </p>
                  </div>
                </figcaption>
              </figure>
            </li>
          );
        })}
      </ol>
      <ParkyInterviewStart
        line={t('howItWorks.parky')}
        label={t('howItWorks.chat')}
        start={{ kind: 'trip', region }}
        showSteps={false}
      />
    </HubLandingOnly>
  );
}
