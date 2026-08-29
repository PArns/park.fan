import { setRequestLocale } from 'next-intl/server';
import type { Metadata } from 'next';
import { ExternalLink, Smartphone, Monitor } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { assertServableRoute } from '@/lib/utils/route-guards';
import { RouteMessages } from '@/i18n/route-messages';
import { HomepageDraft } from './_variants/homepage-draft';
import { loadDesignData } from './_variants/data';
import { displayFont, numericFont } from './_variants/fonts';
import type { Locale } from '@/i18n/config';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Startseite — Entwurf',
};

/*
 * Arbeitsseite wie `/ui`: noindex, nicht in der Sitemap, kein hreflang, und ihr eigener Text ist
 * deutsch statt sechsmal übersetzt. Der Entwurf darin ist es nicht — der rendert
 * Produktionskomponenten mit Produktionsdaten in der Sprache der URL.
 */

/** Die vier Entscheidungen, an denen dieser Entwurf hängt. */
const DECISIONS = [
  {
    head: 'Der Blog steht oben, und einmal',
    body: 'Sechzig geschriebene Beiträge mit gemessenen Zahlen sind das Einzige auf dieser Seite, das kein anderes Wartezeiten-Portal hat. Heute stehen sie zweimal da — als Streifen unter dem Hero und noch einmal dreitausend Pixel tiefer, dieselben drei — und dazwischen liegen vier Kennzahlenbänder. Jetzt: oben, einmal, mit einem Aufmacher.',
  },
  {
    head: 'Die Erklärung führt vor, statt zu behaupten',
    body: '„Was ist park.fan?" steht heute ganz unten unter drei Dashboards und fängt mit der Gründungsgeschichte an. Die Auskunft ist aber ein Satz, den man zeigen kann: eine Zahl am Eingang sagt für sich nichts, erst der Vergleich mit dem Üblichen macht daraus eine Information. Genau das steht dort jetzt, live, an einer echten Bahn.',
  },
  {
    head: 'Zwei Felder, die nirgends gerendert wurden',
    body: 'Der Vergleich kommt aus waitTime und typicalWaitThisHour. Beide liegen in jeder Antwort von getGlobalStats(), das die Startseite ohnehin holt, und das zweite hat bisher keine einzige Oberfläche angefasst — der Entwurf kostet also keine zusätzliche Anfrage. Das benachbarte currentVsTypical bleibt ungenutzt: seine Werte sind weder Differenz noch Prozent.',
  },
  {
    head: 'Erst danach die Werkzeuge',
    body: 'Fahrplan der beliebten Parks, der ruhigste Wochentag je Park, Favoriten, die fünf Hubs und das sichtbare FAQ. Alles, was die heutige Seite vorne hat, steht hier hinten — nachdem jemand weiß, wozu es gut ist.',
  },
] as const;

interface DesignPageProps {
  params: Promise<{ locale: string }>;
}

export default async function DesignPage({ params }: DesignPageProps) {
  const { locale } = await params;
  assertServableRoute(locale);
  setRequestLocale(locale);

  const data = await loadDesignData(locale as Locale);
  const fonts = `${displayFont.variable} ${numericFont.variable}`;

  return (
    <RouteMessages route="/design">
      <div className={`py-10 ${fonts}`}>
        <header className="container mx-auto px-4">
          <Badge className="bg-primary/15 text-primary mb-3">Arbeitsseite · nicht indexiert</Badge>
          <h1 className="pk-display text-3xl font-extrabold tracking-tight sm:text-5xl">
            Erst lesen, dann verstehen
          </h1>
          <p className="text-muted-foreground mt-4 max-w-2xl leading-relaxed">
            Ein Entwurf für alles unter dem Hero. Die heutige Seite ist dreizehnmal derselbe Takt —
            Band, Überschrift, Raster, abwechselnd grau hinterlegt, 8 153 px lang, und nichts darin
            sagt, welches Band das wichtige ist. Dieser Entwurf sortiert stattdessen nach dem, was
            ein Besucher zuerst braucht: etwas zu lesen, dann eine Erklärung, dann die Werkzeuge.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {DECISIONS.map((decision) => (
              <div
                key={decision.head}
                className="border-border/60 bg-card/60 rounded-2xl border p-4"
              >
                <h2 className="text-foreground text-sm font-semibold">{decision.head}</h2>
                <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                  {decision.body}
                </p>
              </div>
            ))}
          </div>
        </header>

        <div className="container mx-auto mt-10 flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4">
          <h2 className="pk-display text-xl font-extrabold tracking-tight">Der Entwurf</h2>
          <a
            href={`/${locale}/design/preview/horizon`}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground ml-auto inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            eigener Tab
          </a>
        </div>

        <div className="mt-4 grid gap-6 px-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <div className="min-w-0">
            <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
              <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
              Desktop
            </p>
            <div className="border-border/60 bg-background overflow-hidden rounded-2xl border">
              <HomepageDraft locale={locale as Locale} {...data} />
            </div>
          </div>

          {/* Handy als iframe — Tailwinds sm:/lg: sind Viewport-Media-Queries, ein 390-px-<div>
              auf diesem Schirm zeigt trotzdem die Desktop-Fassung. */}
          <div className="hidden xl:block">
            <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[11px] font-semibold tracking-wide uppercase">
              <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
              390 px
            </p>
            <div className="border-border/60 bg-background sticky top-16 overflow-hidden rounded-[2rem] border-4 shadow-xl">
              <iframe
                src={`/${locale}/design/preview/horizon`}
                title="Entwurf — Handy"
                loading="lazy"
                className="h-[780px] w-[382px] border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </RouteMessages>
  );
}
