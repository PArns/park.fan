import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { convertApiUrlToFrontendUrl } from '@/lib/utils/url-utils';
import { roundWaitTo5 } from '@/lib/utils/wait-time';
import { CROWD_TEXT_CLASS, waitTimeCrowdTier } from '@/lib/utils/crowd-level-styles';
import { stripNewPrefix } from '@/lib/utils';
import type { AttractionStatsItem } from '@/lib/api/types';

/**
 * Was park.fan ist, vorgeführt statt behauptet.
 *
 * Der Erklärtext der Startseite steht heute ganz unten unter drei Kennzahlenbändern und beginnt
 * mit „park.fan entstand aus einer Frustration". Das ist die Gründungsgeschichte, nicht die
 * Auskunft. Die Auskunft ist ein Satz, den man an einer echten Bahn zeigen kann: **eine Zahl am
 * Eingang sagt für sich genommen fast nichts.** Erst neben dem, was um diese Uhrzeit üblich ist,
 * wird daraus eine Information.
 *
 * Dieses Bauteil zeigt genau das, an der Bahn, die gerade die kürzeste Schlange der Welt hat: was
 * dort jetzt steht, und was dort um diese Stunde sonst steht. Zwei Balken auf einer Skala.
 *
 * Die beiden Werte kommen aus `getGlobalStats()`, das die Startseite ohnehin holt — `waitTime` und
 * `typicalWaitThisHour`. Das zweite Feld ist bisher auf **keiner** Oberfläche der Seite gerendert
 * worden, obwohl es in jeder Antwort mitkommt.
 *
 * `currentVsTypical` liegt daneben und wird bewusst NICHT verwendet: bei Manta stand dort −40 bei
 * 10 gegen 25 Minuten, bei Soarin' −12 bei 110 gegen 40. Weder Differenz noch Prozent, also nichts,
 * was man beschriften könnte. Der Vergleich wird hier aus den zwei Werten gerechnet, die eindeutig
 * sind.
 */
export async function WaitInContext({
  ride,
  queueRecords,
}: {
  /**
   * Die Bahn, an der der Vergleich vorgeführt wird — oder `null`. Der Abschnitt erklärt, was diese
   * Seite tut; das darf nicht davon abhängen, ob gerade eine Bahn mit Vergleichswert offen ist.
   */
  ride: AttractionStatsItem | null;
  /** `counts.queueDataRecords` — worauf der Vergleich beruht. */
  queueRecords?: number;
}) {
  const t = await getTranslations('home.context');
  const tCommon = await getTranslations('common');

  const now = ride ? roundWaitTo5(ride.waitTime) : null;
  const typicalRaw = ride?.typicalWaitThisHour;
  const typical = typicalRaw != null ? roundWaitTo5(typicalRaw) : null;

  /**
   * Ohne Vergleichswert bleibt der Abschnitt stehen, nur ohne die Abbildung.
   *
   * `typicalWaitThisHour` ist nicht garantiert: eine Bahn, für die diese Stunde noch nie gemessen
   * wurde, kommt ohne das Feld. Vorher gab das Bauteil in dem Fall `null` zurück — und damit
   * verschwand ausgerechnet der Abschnitt, der erklärt, wozu es diese Seite gibt, abhängig davon,
   * welche Bahn gerade zufällig die kürzeste Schlange der Welt hat. Um 06:45 UTC war das so.
   */
  const hasFigure = ride !== null && now !== null && typical !== null && typical > 0;

  // Gemeinsame Skala für beide Balken, sonst vergleicht die Grafik nichts.
  const scale = hasFigure ? Math.max(now!, typical!, 5) : 5;
  const shorter = hasFigure ? now! < typical! : false;
  const delta = hasFigure ? Math.abs(now! - typical!) : 0;

  return (
    <section className="px-4 py-16 sm:py-20">
      <div
        className={`container mx-auto grid gap-10 lg:gap-16 ${
          hasFigure ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]' : 'max-w-3xl'
        }`}
      >
        <div className="flex flex-col justify-center gap-5">
          <span className="text-primary text-xs font-semibold tracking-[0.2em] uppercase">
            {t('kicker')}
          </span>
          <h2 className="text-foreground text-3xl leading-tight font-bold tracking-tight text-balance sm:text-4xl">
            {t('headline')}
          </h2>
          <p className="text-muted-foreground text-base leading-relaxed">
            {hasFigure ? t('body', { minutes: now! }) : t('bodyNoRide')}
          </p>
          {queueRecords != null && (
            <p className="text-muted-foreground text-sm leading-relaxed">
              {t('archive', { records: Math.round(queueRecords / 1_000_000) })}
            </p>
          )}
        </div>

        {/* Die Vorführung. Zwei Balken, eine Skala, echte Bahn. */}
        {hasFigure && (
          <figure className="border-border/70 bg-card/60 m-0 rounded-3xl border p-6 sm:p-8">
            <figcaption className="mb-6 flex flex-col gap-1">
              <Link
                href={convertApiUrlToFrontendUrl(ride!.url)}
                prefetch={false}
                className="text-foreground hover:text-primary text-lg font-semibold transition-colors"
              >
                {stripNewPrefix(ride!.name)}
              </Link>
              <span className="text-muted-foreground text-sm">
                {stripNewPrefix(ride!.parkName)} · {ride!.parkCity}
              </span>
            </figcaption>

            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-foreground text-sm font-medium">{t('now')}</span>
                  <span className="text-2xl font-bold tabular-nums">
                    <span className={CROWD_TEXT_CLASS[waitTimeCrowdTier(now)]}>{now}</span>
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                      {tCommon('minuteShort')}
                    </span>
                  </span>
                </div>
                <div className="bg-muted h-3 overflow-hidden rounded-full">
                  <div
                    className={`h-full rounded-full ${BAR[waitTimeCrowdTier(now)]}`}
                    style={{ width: `${(now / scale) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-muted-foreground text-sm font-medium">{t('typical')}</span>
                  <span className="text-muted-foreground text-2xl font-bold tabular-nums">
                    {typical}
                    <span className="ml-1 text-sm font-normal">{tCommon('minuteShort')}</span>
                  </span>
                </div>
                {/* Der Vergleichsbalken ist bewusst unbunt — die Farbe gehört dem Jetzt-Wert —, aber
                  er muss als Lineal lesbar sein. Bei `/40` auf `bg-muted` war er im dunklen Theme
                  von der leeren Rinne nicht zu unterscheiden, und damit verglich die Grafik nichts. */}
                <div className="bg-muted h-3 overflow-hidden rounded-full">
                  <div
                    className="bg-muted-foreground/70 h-full rounded-full"
                    style={{ width: `${(typical / scale) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <p className="border-border/70 text-muted-foreground mt-6 border-t pt-5 text-sm leading-relaxed">
              {shorter
                ? t('verdictShorter', { minutes: delta })
                : t('verdictLonger', { minutes: delta })}
            </p>
          </figure>
        )}
      </div>
    </section>
  );
}

/** Balkenfarbe je Stufe. Volle Klassennamen, damit Tailwind sie sieht. */
const BAR: Record<string, string> = {
  very_low: 'bg-crowd-very-low',
  low: 'bg-crowd-low',
  moderate: 'bg-crowd-moderate',
  high: 'bg-crowd-high',
  very_high: 'bg-crowd-very-high',
  extreme: 'bg-crowd-extreme',
};
