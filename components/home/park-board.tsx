'use client';

import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ParkTime } from '@/components/common/park-time';
import { ParkStatusBadge } from '@/components/parks/park-status-badge';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { useLiveParksByRegion } from '@/lib/hooks/use-live-parks-by-region';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import type { FeaturedCardStatic } from '@/components/home/featured-park-cards-live';
import type { ParkStatus } from '@/lib/api/types';

/**
 * Der Fahrplan — die beliebten Parks als Tafel statt als Kartenraster.
 *
 * Sechs Fotokarten nebeneinander beantworten „welche Parks gibt es", und das weiß nach dem Hero
 * jeder. Die Frage dieses Abschnitts ist eine andere: **wer hat heute offen, bis wann, und wie
 * voll ist es dort gerade.** Das sind vier Werte pro Park, die man untereinander vergleichen
 * will — also eine Tafel, in der die Spalte den Vergleich macht, und keine sechs Karten, in denen
 * dieselbe Zahl sechsmal an einer anderen Stelle steht.
 *
 * Das Foto bleibt trotzdem drin, als Marke der Zeile. Es ist die eine Stelle, an der die
 * Bildsprache dieser Seite in einen Abschnitt passt, der sonst reine Typografie ist — und es geht
 * auf, weil die kuratierten sechs genau die Parks sind, für die die Mediendatenbank ein Bild hat
 * (14 von 212).
 *
 * Zeiten stehen in **Parkzeit**, über `ParkTime`, das bei abweichender Browserzeitzone die eigene
 * dazu einblendet. Ein Fahrplan in der Zeit des Lesers wäre für den Park daneben falsch, und
 * umgekehrt.
 *
 * Live über `useLiveParksByRegion` — eine Anfrage für alle sechs, dieselbe wie das Kartenraster
 * sie stellt, also kostet die Tafel neben ihm nichts. Vor der Antwort halten die vier rechten
 * Spalten ihre Breite mit einem Gedankenstrich: die Tafel darf nicht springen, wenn sie ankommt.
 */
export function ParkBoard({ parks }: { parks: FeaturedCardStatic[] }) {
  const t = useTranslations('home.board');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const regions = parks.map((p) => `${p.continentSlug}/${p.countrySlug}`);
  const { liveByParkId } = useLiveParksByRegion(regions);

  return (
    <div className="border-border/70 divide-border/60 divide-y overflow-hidden rounded-2xl border">
      {/* Spaltenköpfe nur ab `md` — darunter ist jede Zeile zweizeilig und beschriftet sich
          selbst durch Einheiten. */}
      <div className="text-muted-foreground bg-muted/40 hidden px-4 py-2 md:grid md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_9.5rem_7rem_6.5rem] md:items-center md:gap-4">
        <span />
        <span className="pk-mono text-[10px] tracking-[0.14em] uppercase">{t('park')}</span>
        <span className="pk-mono text-[10px] tracking-[0.14em] uppercase">{t('status')}</span>
        <span className="pk-mono text-[10px] tracking-[0.14em] uppercase">{t('today')}</span>
        <span className="pk-mono text-right text-[10px] tracking-[0.14em] uppercase">
          {t('averageWait')}
        </span>
        <span className="pk-mono text-right text-[10px] tracking-[0.14em] uppercase">
          {t('crowd')}
        </span>
      </div>

      {parks.map((park) => {
        const live = liveByParkId?.[park.parkId];
        const schedule = live?.todaySchedule ?? live?.nextSchedule;
        // Durchschnitt und Andrang NUR für einen Park, der gerade läuft. Ein geschlossener Park
        // aggregiert über eine leere Menge und liefert „10 Min. · sehr niedrig" — genau die
        // Zeile, die ein Park ohne Wartezeitquelle auch liefert (docs/api/parks-without-wait-
        // times.md). Ein Gedankenstrich sagt hier die Wahrheit, eine Zahl nicht.
        const operating = live?.status === 'OPERATING';
        const wait =
          operating && live?.averageWaitTime != null ? roundWaitTo5(live.averageWaitTime) : null;
        const crowd = operating ? live?.crowdLevel : undefined;

        return (
          <Link
            key={park.slug}
            href={park.href as '/'}
            prefetch={false}
            className="hover:bg-muted/50 group grid grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-4 gap-y-2 px-4 py-3 transition-colors md:grid-cols-[2.5rem_minmax(0,1fr)_7rem_9.5rem_7rem_6.5rem]"
          >
            <span className="bg-muted relative block h-10 w-10 shrink-0 overflow-hidden rounded-lg">
              {park.backgroundImage && (
                <Image
                  src={park.backgroundImage}
                  alt=""
                  fill
                  sizes="40px"
                  className="object-cover"
                  style={{ objectPosition: park.backgroundPosition }}
                />
              )}
            </span>

            <span className="min-w-0">
              <span className="text-foreground group-hover:text-primary block truncate font-semibold transition-colors">
                {park.name}
              </span>
              <span className="text-muted-foreground block truncate text-xs">
                {park.city} · {park.country}
              </span>
            </span>

            {/* Ab hier die vier Live-Spalten. Auf dem Handy rutschen sie in eine gemeinsame
                zweite Zeile unter Bild und Name, mit den Einheiten als Beschriftung. */}
            <span className="col-span-2 flex flex-wrap items-center gap-x-4 gap-y-1 md:col-span-1 md:block">
              {live?.status ? (
                <ParkStatusBadge status={live.status as ParkStatus} />
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
              <span className="pk-mono text-muted-foreground text-xs md:hidden">
                {schedule?.openingTime && schedule.closingTime && live?.timezone ? (
                  <>
                    <ParkTime
                      isoTime={schedule.openingTime}
                      parkTimezone={live.timezone}
                      locale={locale}
                    />
                    {'–'}
                    <ParkTime
                      isoTime={schedule.closingTime}
                      parkTimezone={live.timezone}
                      locale={locale}
                    />
                  </>
                ) : (
                  '—'
                )}
              </span>
              {wait !== null && (
                <span className="pk-mono text-xs md:hidden">
                  <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}>{wait}</span>
                  <span className="text-muted-foreground"> {tCommon('minuteShort')}</span>
                </span>
              )}
              {crowd && (
                <span className="md:hidden">
                  <CrowdLevelBadge level={crowd} />
                </span>
              )}
            </span>

            <span className="pk-mono text-muted-foreground hidden text-sm md:block">
              {schedule?.openingTime && schedule.closingTime && live?.timezone ? (
                <>
                  <ParkTime
                    isoTime={schedule.openingTime}
                    parkTimezone={live.timezone}
                    locale={locale}
                  />
                  {'–'}
                  <ParkTime
                    isoTime={schedule.closingTime}
                    parkTimezone={live.timezone}
                    locale={locale}
                  />
                </>
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </span>

            <span className="pk-mono hidden text-right text-sm md:block">
              {wait !== null ? (
                <>
                  <span className={`font-semibold ${CROWD_TEXT_CLASS[waitTimeCrowdTier(wait)]}`}>
                    {wait}
                  </span>
                  <span className="text-muted-foreground text-xs"> {tCommon('minuteShort')}</span>
                </>
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </span>

            <span className="hidden text-right md:block">
              {crowd ? (
                <CrowdLevelBadge level={crowd} />
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
