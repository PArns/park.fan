import React from 'react';
import { Link } from '@/i18n/navigation';
import {
  A,
  SectionShell,
  Lead,
  P,
  PG,
  Highlight,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import {
  Activity,
  BarChart3,
  CalendarDays,
  CloudSun,
  Compass,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Moon,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
  Users,
} from 'lucide-react';
import {
  BadgeRowDemo,
  BareNumberVsCard,
  CalendarDaysDemo,
  DemoFrame,
  LiveHourlyProfile,
  LiveTopAttractions,
  NoWaitTimesDemo,
  OffSeasonDemo,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, ClosingBand, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail, type Chapter } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/**
 * Feeds both the chapter list at the top and the rail down the right edge, and
 * must match the `<SectionShell id=… index=…>` calls below exactly — the rail
 * looks its sections up by id, so an entry that drifts silently stops
 * highlighting. Chapter 05 was inserted after the first draft and this list did
 * not follow, which left the rail one chapter short and every number after 04
 * pointing at the wrong heading.
 */
const CHAPTERS: Chapter[] = [
  { id: 'zahl', index: '01', label: 'Eine Zahl allein' },
  { id: 'massstab', index: '02', label: 'Typisch, voll, Rekord' },
  { id: 'moment', index: '03', label: 'Der beste Moment' },
  { id: 'tag', index: '04', label: 'Der richtige Tag' },
  { id: 'parkseite', index: '05', label: 'Die Parkseite von oben nach unten' },
  { id: 'nachtschicht', index: '06', label: 'Woher die Zahlen kommen' },
  { id: 'luecken', index: '07', label: 'Wenn wir nichts wissen' },
  { id: 'besuche', index: '08', label: 'Vier Besuche' },
  { id: 'wegweiser', index: '09', label: 'Wo was steht' },
  { id: 'faq', index: '10', label: 'Häufige Fragen' },
];

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Typisch',
  busy: 'Voll',
  unit: 'Min.',
  days: 'Messtage',
  record: 'Rekord',
  summary:
    'Taron am {label}: typischerweise {typical} Minuten, an vollen Tagen {busy}, gemessen an {days} Tagen. Angeschrieben sind {wait} Minuten.',
};

const SCALE_LEGEND = [
  {
    term: 'Typisch',
    def: 'Median der Tagesspitzen. An der Hälfte der gemessenen Tage war die längste Schlange kürzer.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Voll',
    def: '90. Perzentil derselben Reihe. Der eine Tag von zehn, an dem es besonders voll war.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 Min.',
    def: 'Was am Eingang steht. Bleibt stehen, während sich der Maßstab darunter verschiebt.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Rekord',
    def: `${TARON_RECORD} Minuten am 16. Juli 2026. Der schlimmste Tag im Messzeitraum, und genau deshalb kein Maßstab.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * Die drei Lesarten, in der Reihenfolge, in der die Grafik sie durchläuft.
 * Zahlen aus `TARON_TYPICAL_WAITS`, also aus der API und nicht aus der Erzählung.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Montag', typical: 55, busy: 65, sampleDays: 19 },
  { id: 'saturday', label: 'Samstag', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Unter der Woche', typical: 60, busy: 80, sampleDays: 97 },
];

/**
 * Die Abschnitte einer Parkseite in genau der Reihenfolge, in der sie rendern
 * (`app/[locale]/parks/.../page.tsx`). Wer hier etwas umstellt, stellt es dort
 * auch um, sonst beschreibt die Anleitung eine Seite, die es nicht gibt.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Kopfbereich',
    body: 'Name, Ort, Entfernung von dir aus, dazu Status, heutige Öffnungszeiten, die Auslastung von jetzt und der Zähler „x von y geöffnet".',
  },
  {
    title: 'Ferien im Einzugsgebiet',
    body: 'Welche Schulferien heute auf diesen Park wirken, mit der Region dazu. Auch die von jenseits der Grenze.',
    onlyWhen: 'heute überhaupt eine Ferienregion hineinspielt.',
  },
  {
    title: 'Unwetterwarnung',
    body: 'Amtliche Warnungen von DWD und MeteoAlarm, unverändert übernommen. Kein eigenes Urteil über das Wetter.',
    onlyWhen: 'eine Warnung für den Standort aktiv ist.',
  },
  {
    title: 'Regenradar',
    body: 'Die nächsten Stunden in Viertelstundenschritten. Sagt, ob der Schauer in zwanzig Minuten durch ist oder ob es der Nachmittag bleibt.',
    onlyWhen: 'Niederschlag in Reichweite ist.',
  },
  {
    title: 'Wetterkarte',
    body: 'Jetzt-Wert, Tagesverlauf und Vorhersage. Die Stundenachse ist um die Öffnungszeiten gebaut: die Stunden, in denen der Park auf hat, bekommen vier Mal so viel Platz wie die davor und danach.',
  },
  {
    title: 'Skip-the-line-Preise',
    body: 'Tagespreise für kostenpflichtige Warteschlangen, inklusive ausverkauft.',
    onlyWhen: 'der Park sie im Kalender veröffentlicht. Bisher nur die Disney-Parks in den USA.',
  },
  {
    title: 'Attraktionen',
    body: 'Der erste Reiter, mit der Zahl der Bahnen im Titel. Karten wie in Kapitel 01, sortier- und durchsuchbar, gruppiert nach Bereichen. Oben die Rope-Drop-Übersicht des Parks, nach gesparten Minuten sortiert.',
  },
  {
    title: 'Kalender und Karte',
    body: 'Zwei feste Reiter daneben: die Tagesprognosen aus Kapitel 04 und eine Karte mit den Bahnen als Marker.',
  },
  {
    title: 'Shows und Restaurants',
    body: 'Showzeiten für den ganzen Tag, Gastronomie mit Öffnungszeiten.',
    onlyWhen: 'der Park welche liefert. Sonst fehlt der Reiter ganz.',
  },
  {
    title: 'Beste Tage',
    body: 'Die ruhigsten Termine der nächsten drei Monate, plus der ruhigste Wochentag des Parks.',
    onlyWhen: 'der Park einen Betriebskalender veröffentlicht.',
  },
  {
    title: 'Parks in der Nähe',
    body: 'Was sonst noch in Reichweite liegt, mit Entfernung und aktuellem Status.',
    onlyWhen: 'es Nachbarn gibt. Bei etwa der Hälfte der 212 Parks nicht.',
  },
  {
    title: 'Statistik',
    body: 'Die längsten Schlangen des Parks mit typischem und vollem Wert, dazu die Verteilung über Monate und Wochentage. Der Abschnitt nennt die Zahl der aufgezeichneten Tage, und die beiden Verteilungen führen sie als eigene Spalte.',
  },
  {
    title: 'Saison, Infos, Fragen',
    body: 'Saisonzeiten und angekündigte Events, Adresse und Zeitzone, und die häufigen Fragen zu genau diesem Park.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    time: '02:00',
    at: 0.04,
    title: 'Perzentile pro Stunde',
    body: 'Jede gemessene Stunde jeder Bahn bekommt ihre Verteilung. Stunden mit weniger als drei Messwerten fallen raus.',
  },
  {
    time: '03:00',
    at: 0.22,
    title: 'Basiswerte pro Park',
    body: 'Der Median, gegen den die Live-Auslastung später gerechnet wird. Danach startet das erste Modelltraining.',
  },
  {
    time: '04:30',
    at: 0.42,
    title: 'Viertelstunden-Historie',
    body: 'Gestern wird zusammengefasst. Erst danach kann alles rechnen, was den Tagesverlauf braucht.',
  },
  {
    time: '05:15',
    at: 0.56,
    title: 'Rope-Drop-Empfehlungen',
    body: 'Für jede Bahn: lohnt der frühe Start, wie lange hält der Vorsprung, wann ist der ruhigste Moment des Tages.',
  },
  {
    time: '05:30',
    at: 0.67,
    title: 'Typische Wartezeiten',
    body: 'Die Tabelle aus Kapitel 02. Pro Wochentag, dazu der Rekordtag mit Datum.',
  },
  {
    time: '06:00',
    at: 0.8,
    title: 'Prognosemodell',
    body: 'Neues Training mit den Wartezeiten von gestern. Jeden Morgen einmal komplett.',
  },
];

const FAQ = [
  {
    question: 'Was heißt „typisch“ und „voll“ bei einer Wartezeit?',
    answer:
      'Typisch ist der Median der Tagesspitzen: In der Hälfte aller gemessenen Tage war die längste Schlange kürzer, in der anderen Hälfte länger. Voll ist das 90. Perzentil derselben Reihe, also ungefähr der eine Tag von zehn, an dem es besonders voll war. Der absolute Rekord steht separat daneben, damit ein einzelner Ausreißer die beiden Werte nicht verschiebt.',
  },
  {
    question: 'Sind 70 Minuten Wartezeit viel?',
    answer:
      'Das hängt von der Bahn und vom Wochentag ab. Taron im Phantasialand kommt montags typischerweise auf 55 Minuten und bleibt an neun von zehn Montagen unter 65; dort sind 70 Minuten also ein ungewöhnlich voller Tag. Samstags liegt der Median derselben Bahn bei genau 70 Minuten, dann ist dieselbe Anzeige völlig durchschnittlich. Beide Vergleichswerte stehen auf der Seite der Bahn, damit man sie nicht raten muss.',
  },
  {
    question: 'Woher kommen die Wartezeiten?',
    answer:
      'Aus drei öffentlichen Quellen gleichzeitig: ThemeParks.wiki, Wartezeiten.app und Queue-Times.com. Alle fünf Minuten wird jeder Park abgefragt. Melden zwei Quellen unterschiedliche Zahlen, entscheidet die Mehrheit, danach der Median, danach der Mittelwert. Das Ergebnis wird auf fünf Minuten gerundet, weil die Parks selbst in Fünf-Minuten-Schritten anschreiben.',
  },
  {
    question: 'Warum steht bei manchen Parks „keine Prognose“?',
    answer:
      'Weil die Grundlage fehlt. Eine Auslastungsstufe entsteht aus dem Vergleich mit der eigenen Vergangenheit des Parks, und dafür braucht es rund 30 Betriebstage. Bei neuen oder selten geöffneten Parks steht dort deshalb nichts statt einer geratenen Farbe.',
  },
  {
    question: 'Warum zeigt Hansa-Park keine Wartezeiten?',
    answer:
      'Der Park veröffentlicht seine Wartezeiten ausschließlich in der eigenen App und nur für Geräte im Park-WLAN. Es gibt keine öffentliche Schnittstelle, aus der wir sie lesen könnten. Weil ein Park ohne Quelle in den Daten genauso aussieht wie ein Park, der nachts geschlossen ist, ist das ein gepflegter Eintrag und keine Ableitung: Der Hinweis auf der Parkseite sagt es, statt 82 Bahnen als angeblich leer anzuzeigen.',
  },
  {
    question: 'Was ist Rope Drop?',
    answer:
      'Direkt zur Parköffnung an einer bestimmten Bahn zu stehen, bevor sich die Wege füllen. park.fan empfiehlt das nur, wenn zwei Bedingungen erfüllt sind: Die Tagesspitze der Bahn liegt bei mindestens 60 Minuten und der frühe Start spart mindestens 45 davon. Dazu steht immer, wie lange der Vorsprung ungefähr hält.',
  },
  {
    question: 'Kostet park.fan etwas, und brauche ich ein Konto?',
    answer:
      'Nein und nein. Alle Wartezeiten, Statistiken, Kalender und Prognosen sind kostenlos und ohne Anmeldung nutzbar. Favoriten liegen als Cookie im Browser, nicht auf einem Server.',
  },
  {
    question: 'Wie oft aktualisieren sich die Zahlen auf der Seite?',
    answer:
      'Eine geöffnete Parkseite holt sich alle fünf Minuten neue Werte, im selben Takt, in dem die Quellen abgefragt werden. Die statistischen Werte wie typische Wartezeiten oder Rope-Drop-Empfehlungen werden einmal pro Nacht neu gerechnet, weil sie sich von einem Tag auf den anderen ohnehin kaum bewegen.',
  },
];

export function ContentDE() {
  const glossary = `/${GLOSSARY_SEGMENTS.de}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.de}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Kapitel" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan ist in einer Warteschlange entstanden. Taron, Nachmittag, die Anzeige sagte etwas
          Dreistelliges, und niemand konnte sagen, ob das jetzt Pech war oder Dienstag.
        </Lead>
        <P>
          Genau diese Frage stellt die Seite bis heute in den Mittelpunkt. Eine aktuelle Wartezeit
          zu zeigen, ist der einfache Teil: Die Parks veröffentlichen sie meist selbst, am Eingang
          und in ihren eigenen Apps, die aber oft nur im Park-WLAN funktionieren. Interessant wird
          sie erst, wenn daneben steht, wie ein normaler Tag an dieser Bahn aussieht, wann die
          Schlange erfahrungsgemäß kürzer wird und ob heute überhaupt ein guter Tag ist.
        </P>
        <P>
          Auf dieser Seite steht kein Screenshot. Jede Karte, jedes Badge und jede Tabelle unten
          sind die echten Bauteile der Parkseiten, hier nur mit festen Beispielzahlen befüllt.
          Dieselben Karten stehen eine Stunde später im Park vor dir.
        </P>

        <Reveal>
          <nav
            aria-label="Kapitel"
            className="bg-muted/40 not-prose grid gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            {CHAPTERS.map((c) => (
              <a
                key={c.id}
                href={`#${c.id}`}
                className="text-muted-foreground hover:text-primary group flex items-baseline gap-2 transition-colors"
              >
                <span className="text-primary/40 group-hover:text-primary/70 text-xs font-bold tabular-nums transition-colors">
                  {c.index}
                </span>
                {c.label}
              </a>
            ))}
          </nav>
        </Reveal>
      </div>

      {/* ── 01 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="zahl"
        index="01"
        kicker="Der Ausgangspunkt"
        title="Eine Zahl allein sagt nichts"
        icon={Gauge}
      >
        <P>
          Am Eingang von Taron prangen 70 Minuten, sonst nichts. Die Schlange staut sich schon ab
          der ersten Treppe. Auf dem Handy steht dieselbe Zahl, auf der Parkseite steht sie mit vier
          weiteren Angaben: einer Auslastungsstufe, einem Trend, der zweiten Warteschlange und der
          Mindestgröße. Für keine davon reicht der Blick auf heute.
        </P>

        <BareNumberVsCard
          unit="Minuten"
          signLabel="Was der Park anschreibt"
          signCaption="Eine Zahl, kein Bezug. Ob das heute gut oder schlecht ist, weiß nur, wer schon oft genug hier war."
          cardLabel="Was park.fan daraus macht"
          cardCaption="Dieselben 70 Minuten, plus Auslastungsstufe, Trend, Single-Rider-Zeit, Mindestgröße und der Hinweis, wann es voraussichtlich ruhiger wird."
        />

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            „Sehr hoch&ldquo; ist dabei keine Geschmacksfrage. Taron liegt im Mittel bei{' '}
            {TARON_BASELINE} Minuten, {TARON_WAIT_NOW} sind davon rund 156 Prozent, und die Stufen
            wechseln bei 60, 89, 110, 150 und 200 Prozent. Ab 150 heißt sie „Sehr hoch&ldquo;. Der
            kleine Pfeil daneben kommt aus den letzten Messungen und sagt, ob die Schlange gerade
            wächst oder abgebaut wird.
          </P>
          <PG>
            Der zweite Wert auf der Karte ist die Single-Rider-Schlange. Viele Bahnen führen mehrere
            Warteschlangen parallel, und welche davon existiert, erfährt man am Eingang meistens
            nicht. Dazu die Mindestgröße, damit niemand mit einem 130 Zentimeter großen Kind durch
            den halben Park läuft.
          </PG>
        </div>

        <DemoFrame
          label="Zwei Bahnen, dieselbe Minute"
          note="Beide Karten stammen aus demselben Moment im selben Park, Taron in Klugheim und Black Mamba in Deep in Africa. Die eine Schlange wächst, die andere baut ab. Auf der Parkseite stehen alle Bahnen so nebeneinander, sortierbar nach Wartezeit."
          href={PARK}
          hrefLabel="Zur Parkseite →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
      <Ambience>
        <SectionShell
          id="massstab"
          index="02"
          kicker="Der Maßstab"
          title="Typisch, voll, Rekord"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} Min.`}
            label="Tarons längste gemessene Schlange"
            note="Am 16. Juli 2026, in den Sommerferien. Ein einziger Tag von 365, und deshalb rechnet die Skala mit Perzentilen statt mit dem Maximum."
          >
            <P>
              Um eine Zahl einzuordnen, braucht es zwei Vergleichswerte und die Angabe, worauf sie
              beruhen. park.fan benutzt dafür den Median der Tagesspitzen und das 90. Perzentil
              derselben Reihe. Im Klartext: Wie lang ist die längste Schlange des Tages
              üblicherweise, und wie lang war sie an den vollsten zehn Prozent der Tage.
            </P>
          </IntroWithAside>

          <div className="pt-2">
            <WaitScaleStage
              steps={SCALE_STEPS}
              wait={TARON_WAIT_NOW}
              max={WAIT_SCALE_MAX}
              record={TARON_RECORD}
              labels={SCALE_LABELS}
              legend={SCALE_LEGEND}
            >
              {SCALE_STEPS.map((step, i) => (
                <div key={step.id} data-wait-step={step.id} className="scroll-mt-28">
                  <div className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
                    {step.label}
                  </div>
                  <h3 className="mb-3 text-xl font-bold sm:text-2xl">
                    {i === 0 && 'Für einen Montag sind 70 Minuten viel'}
                    {i === 1 && 'Für einen Samstag ist das exakt der Normalfall'}
                    {i === 2 && 'Und einmal waren es 135'}
                  </h3>
                  <p className="text-muted-foreground max-w-xl leading-relaxed">
                    {i === 0 && (
                      <>
                        Montags liegt die Tagesspitze bei {step.typical} Minuten, und an neun von
                        zehn Montagen bleibt sie unter {step.busy}. Die angeschriebenen{' '}
                        {TARON_WAIT_NOW} liegen darüber. Wer hier steht, hat den vollsten Montag
                        seit Wochen erwischt, und die Nachbarbahnen sind dann meistens die bessere
                        Idee.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Samstags ist {step.typical} Minuten der Median. Dieselbe Anzeige, derselbe
                        Ort, dieselbe Bahn: an diesem Tag ist sie schlicht durchschnittlich. Sich zu
                        ärgern lohnt nicht, sich umzuorientieren auch nicht, denn die Nachbarbahnen
                        haben denselben Samstag.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Über alle {step.sampleDays} gemessenen Wochentage liegt die Spitze bei{' '}
                        {step.typical} Minuten. Die gestrichelte Linie weiter rechts ist der{' '}
                        {TARON_RECORD}-Minuten-Tag vom 16. Juli. Genau wegen solcher Tage ist
                        „voll&ldquo; ein Perzentil und kein Maximum: Ein einziger Ausreißer würde
                        einen Mittelwert verschieben und alles darunter unbrauchbar machen.
                      </>
                    )}
                  </p>

                  {/* Unter lg trägt jeder Schritt seine eigene Skala: dort gibt es
                    keine mitlaufende Grafik, an der sich etwas ändern könnte. */}
                  <WaitScaleBar
                    step={step}
                    wait={TARON_WAIT_NOW}
                    max={WAIT_SCALE_MAX}
                    record={TARON_RECORD}
                    labels={SCALE_LABELS}
                    className="bg-card/60 mt-5 rounded-2xl border p-5 lg:hidden"
                  />
                </div>
              ))}
            </WaitScaleStage>
          </div>

          {/* Card left, prose right. The card is a park-page sidebar component and
              looks absurd stretched across a 1500 px column, so it keeps its own
              width and the text takes the rest instead of leaving a hole. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="Auf der Seite einer Bahn"
              note="Echte Werte von Taron, abgerufen am 24. August 2026."
              href={TARON}
              hrefLabel="Echte Werte für Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Dieselbe Verteilung als Balken, Wochentag für Wochentag. Die Zahl über jedem Balken
                ist die Voll-Marke des Tages, der kräftige Teil darunter der typische Wert, unten
                rechts der Rekord mit Datum. Ein Wochentag ohne Grundlage bekommt keinen geschätzten
                Balken, sondern gar keinen.
              </P>
              <P>
                Samstag ist der einzige Tag, an dem die {TARON_WAIT_NOW} vom Anfang genau in der
                Mitte liegen. An einem Montag wären dieselben Minuten die Ausnahme.
              </P>
              <P>
                Wie belastbar das alles ist, hängt an der Zahl der Messtage: {TARON_WEEKDAY_DAYS}{' '}
                unter der Woche und {TARON_WEEKEND_DAYS} am Wochenende sind hier zusammengekommen.
                Die Karte selbst nennt den Zeitraum, aus dem sie rechnet. Für den ganzen Park steht
                die Summe der aufgezeichneten Tage im Statistik-Abschnitt der Parkseite, und in den
                Tabellen nach Monat und Wochentag bekommt sie eine eigene Spalte.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Dieselbe Tabelle für den ganzen Park, live"
            note="Keine Beispielzahlen: Das ist der aktuelle Stand für Phantasialand, pro Bahn der typische und der volle Wert. Auf der Parkseite steht darüber, aus wie vielen aufgezeichneten Tagen der ganze Abschnitt rechnet. Alle Minuten stehen in Fünferschritten, weil Parks in Fünferschritten anschreiben."
            href={PARK}
            hrefLabel="Zur Parkseite →"
          >
            <LiveTopAttractions locale="de" />
          </DemoFrame>

          <Highlight>
            Diese Tabelle ist der Grund, warum wir Wartezeiten überhaupt archivieren. Eine Live-Zahl
            kann man abfragen, wenn jemand danach fragt. Ein Median über jeden gemessenen Dienstag
            muss schon fertig sein, bevor die Frage kommt.
          </Highlight>
        </SectionShell>
      </Ambience>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="moment"
        index="03"
        kicker="Die Uhrzeit"
        title="Der beste Moment des Tages"
        icon={Sunrise}
      >
        <P>
          „Früh kommen&ldquo; ist der Rat, den jeder gibt. Er stimmt nur, wenn die Schlange im Lauf
          des Tages überhaupt wächst, und das tut sie längst nicht überall. Sechs Bahnen aus
          demselben Park, dieselbe Tabelle, dasselbe Jahr:
        </P>

        <DemoFrame
          label="Das echte Stundenprofil, gerade eben"
          note="Live aus dem Stundenprofil des Parks. Fett steht die stärkste Stunde jeder Bahn, und die liegt bei den sechs Bahnen keineswegs überall gleich. Eine Stunde wird erst zur Spalte, wenn sie mindestens zehn Messtage an dieser Bahn hat, mindestens 40 Prozent der bestgemessenen Stunde erreicht und von mindestens der Hälfte der Bahnen gemeldet wird. Das wirft die Randzeiten raus, in denen sonst eine einzige Hotelgäste-Schlange für den ganzen Morgen spräche."
          href={PARK}
          hrefLabel="Zur Parkseite →"
        >
          <LiveHourlyProfile locale="de" />
        </DemoFrame>

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            Taron ist der Fall, in dem die Uhrzeit fast nichts entscheidet: Die Zeile liegt den
            ganzen Tag in einem engen Band, und was den Unterschied macht, ist der Wochentag aus
            Kapitel 02. Bei Chiapas eine Zeile tiefer ist es umgekehrt, die Werte steigen bis in den
            Nachmittag deutlich an. Eine einzige Regel für den ganzen Park wäre für eine der beiden
            Bahnen falsch, und deshalb wird sie pro Bahn gerechnet.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Die Empfehlung, die daraus entsteht"
            note="Empfohlen wird nur, wenn die Tagesspitze mindestens 60 Minuten erreicht und der frühe Start davon mindestens 45 spart. Colorado Adventure im selben Park spart 40 Minuten bei einer Spitze von 50 und bekommt deshalb keinen Hinweis."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="max-w-prose space-y-4">
            <PG>
              Die Karte nennt drei Zahlen und eine Uhrzeit: die typische Wartezeit zur Öffnung, die
              Tagesspitze, die Differenz und das Zeitfenster, in dem der Vorsprung hält. Danach ist
              er weg, und das steht auch so da.
            </PG>
            <P>
              Der zweite Teil ist die ruhigste Zeit des Tages, wo immer sie liegt. Bei diesen Bahnen
              fällt sie mit dem frühen Start zusammen. Bei anderen liegt sie am Abend, und dann
              nennt die Karte diesen Zeitpunkt statt des Weckers. Für den ganzen Park listet die
              Attraktionsübersicht die Bahnen, bei denen sich das Aufstehen am meisten lohnt,
              sortiert nach gesparten Minuten.
            </P>
          </div>
        </div>
      </SectionShell>

      {/* ── 04 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="tag"
        index="04"
        kicker="Das Datum"
        title="Der richtige Tag, Monate im Voraus"
        icon={CalendarDays}
      >
        <P>
          Das Datum entscheidet mehr als die Uhrzeit. Zwischen zwei Tagen derselben Woche kann eine
          halbe Stunde Durchschnittswartezeit liegen, und einem gewöhnlichen Kalender sieht man das
          nicht an. Den Unterschied machen Schulferien, Feiertage, Brückentage und das Wetter.
        </P>

        <DemoFrame
          label="Vier Tage einer Herbstferienwoche"
          note="Der 15. Oktober ist der ruhigste der vier, obwohl er mitten in den Ferien liegt: Es regnet. Der 19. ist grau, weil der Park an dem Tag zu hat. Auf der Parkseite steht derselbe Kalender Monat für Monat, so weit die Prognose für diesen Park reicht."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column at the body measure, like every other chapter on this page.
            As two prose columns this band put a third text edge under the paragraph
            above it: 768 px of copy, then a 604 px column ending 164 px short of
            it, then a second column starting where that paragraph still had words.
            The empty right half is the page's normal rhythm — a full-width figure
            over a body-measure column. */}
        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            Die Ferienkalender kommen aus zwei öffentlichen Quellen und decken jeweils vier Jahre
            ab. Wichtiger als die eigenen sind oft die der Nachbarn. Ein Beispiel von heute: Für
            Phantasialand steht als bestimmender Ferieneintrag nicht Nordrhein-Westfalen im
            Kalender, sondern die Sommerferien der niederländischen Provinz Gelderland. Der Park
            liegt 90 Kilometer von der Grenze entfernt, und Tagesgäste kennen keine. Regionen im
            Umkreis von rund 200 Kilometern zählen deshalb mit und bekommen im Kalender eine eigene
            Markierung.
          </P>
          <PG>
            Die Farbe eines Tages ist eine Prognose, keine Messung. Sie stammt aus einem Modell, das
            jede Nacht mit den Wartezeiten des Vortags neu trainiert wird und sich hinterher an der
            Realität nachmessen lässt.
          </PG>
          <P>
            Wie weit der Kalender reicht, hängt am Park. Ein Park, der das ganze Jahr öffnet,
            bekommt bis zu zwölf Monate im Voraus eine Prognose. Bei einem Saisonpark hört sie da
            auf, wo die veröffentlichte Saison endet: Für einen Dienstag im März, an dem
            Phantasialand nachweislich geschlossen hat, ist eine Auslastungsfarbe keine Vorhersage,
            sondern eine Behauptung.
          </P>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/fancast"
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Wie gut das Modell trifft
          </Link>
          <Link
            href={bestTime}
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Beste Reisezeit pro Park
          </Link>
        </div>
      </SectionShell>

      {/* ── 05 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="parkseite"
        index="05"
        kicker="Der Rundgang"
        title="Die Parkseite von oben nach unten"
        icon={Layers}
      >
        <P>
          Alles bisherige steht auf einer einzigen Seite, und die ist nach der Reihenfolge gebaut,
          in der man fragt: Hat der Park heute auf? Regnet es gleich? Wie lang ist die Schlange? Und
          wann wäre ich besser gekommen?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Nur wenn:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              Die Hälfte dieser Blöcke hängt an einer Bedingung, und das ist Absicht. Ein Park ohne
              Shows bekommt keinen leeren Show-Reiter, und rund die Hälfte der 212 Parks rendert gar
              keinen Nachbar-Abschnitt, weil in Reichweite nichts liegt.
            </Highlight>
            <PG>
              Die Reiter merken sich ihre Auswahl in der Adresse. Wer den Kalender offen hat und den
              Link weitergibt, verschickt den Kalender und nicht die Attraktionsliste.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Am lebenden Objekt ansehen
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="nachtschicht"
          index="06"
          kicker="Der Unterbau"
          title="Woher die Zahlen kommen"
          icon={Database}
        >
          <P>
            Alle fünf Minuten wird jeder der 212 Parks abgefragt, aus drei öffentlichen Quellen
            gleichzeitig. Widersprechen sie sich, entscheidet die Mehrheit, danach der Median,
            danach der Mittelwert. Gespeichert wird nur, was sich geändert hat, gerundet auf fünf
            Minuten, weil die Parks selbst in Fünf-Minuten-Schritten anschreiben.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wartezeiten" delay={0}>
              ThemeParks.wiki, Wartezeiten.app und Queue-Times.com, im Fünf-Minuten-Takt. Die
              Rohwährung von allem anderen auf dieser Seite.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Ferien & Feiertage" delay={60}>
              Nager.Date für gesetzliche Feiertage und Brückentage, OpenHolidays für Schulferien.
              Vier Jahre, jede Region einzeln, monatlich aktualisiert.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Wetter" delay={120}>
              Open-Meteo für Vorhersage, Rückschau und den 15-Minuten-Regenradar. Amtliche
              Unwetterwarnungen kommen von DWD und MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Öffnungszeiten" delay={0}>
              Aus den Parkkalendern. Wo ein Park keinen veröffentlicht, rekonstruieren wir den Tag
              aus der Aktivität der Bahnen und kennzeichnen ihn als geschätzt.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historie" delay={60}>
              Nichts wird gelöscht. Ältere Zeiträume werden nur komprimiert, damit jede Auswertung
              weiterhin auf allen Messwerten läuft.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Prognosemodelle" delay={120}>
              Nach Zeithorizont getrennt: eines für den laufenden Tag, eines für die nächsten
              Wochen, eines für den Rest des Jahres. Jedes wird an den echten Zeiten nachgemessen.
            </IngredientCard>
          </IngredientGrid>

          <div className="max-w-3xl space-y-4 pt-4">
            <P>
              Der zweite Teil passiert nachts. Ein Median über jeden gemessenen Dienstag ist keine
              Abfrage, die man beim Seitenaufruf startet. Er muss vorher gerechnet worden sein, in
              einer festen Reihenfolge, weil jeder Schritt auf dem vorigen aufbaut.
            </P>
          </div>

          <NightShift
            jobs={NIGHT_JOBS}
            caption="Alle Zeiten UTC. Die Reihenfolge ist kein Zufall: Die Rope-Drop-Empfehlung um 05:15 liest die Viertelstunden-Historie, die um 04:30 geschrieben wird."
          />
        </SectionShell>
      </Ambience>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="luecken"
        index="07"
        kicker="Die Grenzen"
        title="Wenn wir nichts wissen"
        icon={HelpCircle}
      >
        <P>
          Manche Felder bleiben hier leer, und zwar mit Absicht. Drei Fälle, in denen park.fan
          lieber nichts sagt als etwas Geratenes.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Park ohne lesbare Quelle"
            note="Hansa-Park veröffentlicht Wartezeiten nur in der eigenen App im Park-WLAN. In den Daten sieht das aus wie ein Park mitten in der Nacht, deshalb steht es als gepflegter Hinweis auf der Seite. Ohne ihn stünden dort 82 Bahnen auf „sehr niedrig“."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Bahn außerhalb ihrer Saison"
            note="Über eine Eisbahn im August meldet niemand etwas, weil es nichts zu melden gibt. Wer diese Stille als „geöffnet“ liest, macht aus einer fehlenden Meldung eine offene Bahn. Die Bahn zählt an dem Tag auch nicht in den Zähler „12 von 45 geöffnet“ hinein."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Keine Bewertungsgrundlage"
            note="Die letzte Stufe steht für Parks, für die wir noch keine Auslastung berechnen: Unter rund 30 Betriebstagen fehlt der Vergleichswert, gegen den gerechnet würde."
          >
            <BadgeRowDemo caption="Oben die Auslastungsstufen, unten der Vergleich mit dem Typischen. Beide benutzen dieselbe Farbskala, damit sie sich nicht widersprechen können." />
          </DemoFrame>
        </div>

        <Highlight>
          Dieselbe Regel gilt für die Saison-Erkennung. Betriebsmonate einer Bahn nennen wir erst
          nach 330 Beobachtungstagen. Vorher wäre „läuft von Dezember bis April“ keine Saison,
          sondern eine Beschreibung des Zeitraums, in dem wir zufällig schon gemessen haben.
        </Highlight>
      </SectionShell>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="besuche"
        index="08"
        kicker="In der Praxis"
        title="Vier Besuche"
        icon={Users}
      >
        <P>
          Dieselben Daten beantworten sehr verschiedene Fragen. Vier Beispiele, jeweils mit dem Weg,
          den wir dafür nehmen würden.
        </P>

        <div className="grid gap-5 lg:grid-cols-2">
          <PersonaBlock
            icon={CalendarDays}
            who="Familie, ein Tag in den Herbstferien"
            question="„Welcher Tag in der Ferienwoche ist der ruhigste, und was machen wir bei Regen?“"
            steps={[
              <>
                Parkseite öffnen, Reiter <strong>Kalender</strong>. Die Ferienwoche steht als Block
                da, farbig nach Prognose, mit Wetter und Öffnungszeiten in jeder Kachel.
              </>,
              <>
                Auf einen Tag tippen. Das Detail nennt die erwartete Durchschnittswartezeit und
                welche Ferienregionen an dem Tag hineinspielen, auch die aus dem Nachbarland.
              </>,
              <>
                Regentag eingeplant? Der Kalender zeigt ihn als den ruhigsten der Woche. Am Tag
                selbst sagt der 15-Minuten-Regenradar oben auf der Parkseite, wann es aufhört.
              </>,
              <>
                Auf jeder Attraktionskarte steht die Mindestgröße, wo der Park sie veröffentlicht.
                Taron verlangt 140 Zentimeter, Colorado Adventure 120, und das entscheidet den Tag
                mehr als jede Wartezeit.
              </>,
              <>
                Kinderbahnen im Reiter <strong>Attraktionen</strong> als Favorit markieren. Sie
                stehen danach auf der Startseite mit ihrer aktuellen Wartezeit.
              </>,
            ]}
          />

          <PersonaBlock
            icon={BarChart3}
            who="Vielfahrer, drei Parks in einer Woche"
            question="„Wo lohnt Rope Drop, und ist die Schlange gerade wirklich außergewöhnlich?“"
            steps={[
              <>
                Auf der Parkseite die Übersicht der Rope-Drop-Bahnen, sortiert nach gesparten
                Minuten. Bahnen ohne echten Vorteil tauchen dort nicht auf.
              </>,
              <>
                Für jede Bahn die Tabelle aus Kapitel 02 mitlesen. Sie nennt den Zeitraum, aus dem
                sie rechnet, und ein Wochentag ohne Grundlage bekommt dort gar keinen Balken.
              </>,
              <>
                Während des Besuchs auf den Vergleichs-Badge achten: „viel höher“ heißt heute
                wirklich außergewöhnlich, nicht bloß lang.
              </>,
              <>
                Jede Attraktionsseite trägt eine Note für die eigene Prognose, aus dem Abgleich
                vergangener Vorhersagen mit den echten Zeiten der letzten 30 Tage. Bei Taron sind
                das gerade ein paar tausend verglichene Prognosen.
              </>,
              <>
                Für die Reiseplanung <A href={bestTime}>die beste Reisezeit</A> vergleichen. Dort
                stehen mehrere Parks nebeneinander, inklusive ruhigstem Wochentag.
              </>,
            ]}
          />

          <PersonaBlock
            icon={MapPin}
            who="Jahreskarte, 20 Minuten vom Park entfernt"
            question="„Lohnt sich heute Abend noch die Fahrt?“"
            steps={[
              <>
                Startseite mit Standortfreigabe. Der nächstgelegene Park steht oben, mit Status,
                aktueller Auslastung und Öffnungszeit bis heute Abend.
              </>,
              <>
                Auslastung „niedrig“ bei einer Bahn, die sonst „hoch“ steht, ist genau der Abend,
                für den sich die Fahrt lohnt.
              </>,
              <>
                Im Park schaltet die Startseite in die Nahansicht um: die nächstgelegenen
                Attraktionen mit Entfernung und aktueller Wartezeit.
              </>,
              <>
                Trendpfeil beachten. Eine fallende Schlange in der letzten Stunde vor Schluss ist
                oft der kürzeste Moment des ganzen Tages.
              </>,
            ]}
          />

          <PersonaBlock
            icon={Compass}
            who="Zum ersten Mal in einem großen Park"
            question="„Was heißt Single Rider, und in welcher Reihenfolge machen wir das?“"
            steps={[
              <>
                Begriffe stehen im <A href={glossary}>Glossar</A>, in sechs Sprachen. Auf den
                Attraktionsseiten sind sie im Text direkt verlinkt.
              </>,
              <>
                Morgens die Rope-Drop-Empfehlung des Parks abarbeiten. Das ist die einzige
                Reihenfolge, die auf gemessenen Daten beruht statt auf Bauchgefühl.
              </>,
              <>
                Ab Mittag nach Auslastung entscheiden statt nach Minuten. Eine „niedrige“ Bahn mit
                25 Minuten ist die bessere Wahl als eine „hohe“ mit 20.
              </>,
              <>
                Shows im gleichnamigen Reiter. Die Zeiten stehen dort für den ganzen Tag, und
                Paraden leeren die Wege für etwa eine halbe Stunde.
              </>,
            ]}
          />
        </div>
      </SectionShell>

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
      <SectionShell id="wegweiser" index="09" kicker="Wegweiser" title="Wo was steht" icon={Search}>
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Suche',
              body: (
                <>
                  Strg + K oder ⌘ + K, überall auf der Seite. Findet Parks, Bahnen, Shows und
                  Restaurants, auch bei ungefährer Schreibweise.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Standort',
              body: (
                <>
                  Freigegeben zeigt die Startseite die Parks in deiner Nähe. Im Park schaltet sie in
                  die Nahansicht mit Entfernungen.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoriten',
              body: (
                <>
                  Stern auf jeder Park- und Attraktionskarte. Liegt als Cookie im Browser, ohne
                  Konto und ohne Server.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Längere Stücke zu einzelnen Parks und Bahnen. Die Tabellen darin ziehen dieselben
                  Zahlen wie die Parkseiten, statt sie abzutippen.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Attraktionsseite',
              body: (
                <>
                  Verlauf, typische Wartezeiten pro Wochentag, Rope Drop, Mindestgröße,
                  Treffsicherheit der Prognose, Layout-Elemente und die Blogbeiträge über die Bahn.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Glossar',
              body: (
                <>
                  <A href={glossary}>Alle Fachbegriffe</A> mit Definition, Beispielbahnen und
                  teilweise einem 3-D-Modell des Streckenelements.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      {/* ── 10 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        index="10"
        kicker="Nachgefragt"
        title="Häufige Fragen"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <ClosingBand
        kicker="Und jetzt?"
        title="Weiterlesen"
        body="Alles auf park.fan ist kostenlos, ohne Konto und ohne Werbung nutzbar. Die Parkseite zeigt das alles am lebenden Objekt, die Fancast-Seite rechnet öffentlich vor, wie treffsicher die Prognosen der letzten 30 Tage waren, und die beste Reisezeit vergleicht mehrere Parks nebeneinander."
      >
        <Link
          href={PARK}
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Activity className="h-4 w-4" />
          Beispiel-Parkseite ansehen
        </Link>
        <Link
          href={bestTime}
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Beste Reisezeit
        </Link>
        <Link
          href="/fancast"
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Treffsicherheit der Prognosen
        </Link>
      </ClosingBand>
    </>
  );
}

/** One worked example: who, what they are asking, and the route through the site. */
function PersonaBlock({
  icon: Icon,
  who,
  question,
  steps,
}: {
  icon: React.ElementType;
  who: string;
  question: string;
  steps: React.ReactNode[];
}) {
  return (
    <Reveal>
      <div className="bg-card/70 h-full rounded-2xl border p-5 sm:p-6">
        <div className="mb-3 flex items-start gap-3">
          <div className="bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Icon className="text-primary h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">{who}</h3>
            <p className="text-muted-foreground mt-0.5 text-sm italic">{question}</p>
          </div>
        </div>
        <ol className="mt-4 space-y-2.5">
          {steps.map((step, i) => (
            <li key={i} className="text-muted-foreground flex gap-3 text-sm leading-relaxed">
              <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </Reveal>
  );
}
