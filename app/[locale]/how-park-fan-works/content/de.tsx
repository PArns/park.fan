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
  LandingNextSteps,
} from '@/components/marketing/editorial-ui';
import { Reveal } from '@/components/marketing/scroll-reveal';
import { GLOSSARY_SEGMENTS } from '@/lib/glossary/segments';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { PLANNER_SEGMENTS } from '@/lib/planner/segments';
import { HOWTO_CHAPTERS } from '@/lib/howto/chapters';
import {
  Activity,
  BarChart3,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  Ruler,
  Search,
  Sparkles,
  Star,
  Sunrise,
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
  PlannerDayFigure,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import {
  AnatomyAttractionDemo,
  AnatomyBestDaysDemo,
  AnatomyBlogDemo,
  AnatomyCalendarDemo,
  AnatomyHeaderDemo,
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomySeasonDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterRail } from '../_chapter-rail';
import {
  TARON_BASELINE,
  TARON_RECORD,
  TARON_WAIT_NOW,
  TARON_WEEKDAY_DAYS,
  TARON_WEEKEND_DAYS,
  WAIT_SCALE_MAX,
} from '../_fixtures';

/** See `HOWTO_CHAPTERS`: the ids there must match the `<SectionShell>` calls below. */
const CHAPTERS = HOWTO_CHAPTERS.de;

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
    def: 'An der Hälfte der gemessenen Tage war die längste Warteschlange kürzer.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Voll',
    def: 'Der vollste Tag von zehn.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 Min.',
    def: 'Was am Eingang steht.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Rekord',
    def: `${TARON_RECORD} Minuten am 16. Juli 2026, der längste gemessene Tag.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them.
 * Figures from `TARON_TYPICAL_WAITS`, i.e. from the API and not from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Montag', typical: 55, busy: 70, sampleDays: 21 },
  { id: 'saturday', label: 'Samstag', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Unter der Woche', typical: 60, busy: 75, sampleDays: 107 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Whoever reorders them there reorders
 * them here, or the guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Kopfbereich',
    body: 'Name, Ort und Entfernung, dazu Status, heutige Öffnungszeiten, die Auslastung und wie viele Bahnen gerade offen sind.',
    example: 'Phantasialand, Brühl. Heute 09:00–19:00, 36 von 40 Bahnen offen.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'Ferien im Einzugsgebiet',
    body: 'Welche Schulferien und Feiertage heute auf den Park wirken, die der eigenen Region zuerst.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'heute Ferien oder ein Feiertag hineinspielen.',
  },
  {
    title: 'Unwetterwarnung',
    body: 'Amtliche Warnungen von DWD und MeteoAlarm im Wortlaut.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'für den Standort eine Warnung gilt.',
  },
  {
    title: 'Regenradar',
    body: 'Die nächsten Stunden in Viertelstunden. Daran siehst du, ob ein Schauer in zwanzig Minuten durch ist.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'Regen in der Nähe ist.',
  },
  {
    title: 'Wetterkarte',
    body: 'Wetter von jetzt, Tagesverlauf und Vorhersage. Die Stunden, in denen der Park geöffnet hat, bekommen auf der Achse den meisten Platz.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Skip-the-line-Preise',
    body: 'Tagespreise für kostenpflichtige Warteschlangen wie Lightning Lane, ausverkaufte als solche markiert.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'der Park sie veröffentlicht, bisher nur die Disney-Parks in den USA.',
  },
  {
    title: 'Attraktionen',
    body: 'Alle Bahnen als Karten wie in Kapitel 01, durchsuchbar und nach Bereichen gruppiert. Darüber stehen die Bahnen, bei denen sich früh kommen lohnt.',
    example: 'Im Phantasialand steht Taron dort oben, mit 60 gesparten Minuten.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Kalender und Karte',
    body: 'Die Tagesprognosen aus Kapitel 04 im Monatsraster und eine Karte mit allen Bahnen.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Shows und Restaurants',
    body: 'Spielzeiten für den ganzen Tag, Restaurants mit Öffnungszeiten.',
    example: 'Im Phantasialand vier Shows und 46 Restaurants.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'der Park welche meldet.',
  },
  {
    title: 'Beste Tage',
    body: 'Die ruhigsten Termine der nächsten drei Monate und der ruhigste Wochentag des Parks.',
    demo: <AnatomyBestDaysDemo locale="de" />,
    onlyWhen: 'der Park einen Betriebskalender veröffentlicht.',
  },
  {
    title: 'Parks in der Nähe',
    body: 'Was sonst in Reichweite liegt, mit Entfernung und Status.',
    example: 'Vom Phantasialand aus Toverland und Movie Park Germany, beide gut 90 Kilometer.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'in Reichweite ein anderer Park liegt.',
  },
  {
    title: 'Blog',
    body: 'Beiträge, in denen dieser Park vorkommt.',
    demo: <AnatomyBlogDemo locale="de" />,
    onlyWhen: 'es welche gibt.',
  },
  {
    title: 'Statistik',
    body: 'Die längsten Warteschlangen des Parks mit typischem und vollem Wert, dazu die Verteilung über Monate und Wochentage.',
    demo: (
      <AnatomyStatsDemo
        title="Attraktionen mit längsten Wartezeiten"
        labelAttraction="Attraktionen"
        labelMinutes="Min."
        labelNow="Jetzt"
        labelP50="Typisch"
        labelP90="Spitze"
      />
    ),
  },
  {
    title: 'Saison, Infos, Fragen',
    body: 'Saisonzeiten und Events, Adresse und Zeitzone, häufige Fragen zu diesem Park.',
    example: 'Der Schlittschuhverleih aus Kapitel 08 steht hier mit November bis Januar.',
    demo: <AnatomySeasonDemo label="Schlittschuhverleih" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Was jede Stunde typisch ist',
    body: 'Typischer und voller Wert für jede Bahn und jede Stunde.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Der Normalwert jedes Parks',
    body: 'Der Wert, an dem die Auslastung gemessen wird.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Gestern zusammenfassen',
    body: 'Der ganze Vortag in Viertelstunden.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Lohnt früh aufstehen?',
    body: 'Pro Bahn, wie viel ein früher Start spart und wie lange der Vorsprung hält.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Typisch pro Wochentag',
    body: 'Die Tabelle aus Kapitel 02 für jede Bahn, dazu der Rekord.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'Das Prognosemodell lernt nach',
    body: 'Es trainiert mit den Wartezeiten von gestern.',
  },
];

const FAQ = [
  {
    question: 'Was heißt „typisch“ und „voll“ bei einer Wartezeit?',
    answer:
      'Typisch ist der Median der Tagesspitzen: An der Hälfte der gemessenen Tage war die längste Warteschlange kürzer. Voll ist das 90. Perzentil derselben Reihe, ungefähr der vollste Tag von zehn. Der Rekord steht getrennt daneben, damit ein einzelner Ausreißer die beiden Werte nicht verschiebt.',
  },
  {
    question: 'Sind 70 Minuten Wartezeit viel?',
    answer:
      'Das hängt von der Bahn und vom Wochentag ab. An Taron im Phantasialand liegt die Spitze montags typischerweise bei 55 Minuten, 70 sind dort also viel. Samstags sind 70 Minuten der Median und damit ein ganz normaler Tag. Beide Vergleichswerte stehen auf park.fan auf der Seite der Bahn.',
  },
  {
    question: 'Woher kommen die Wartezeiten?',
    answer:
      'Aus drei öffentlichen Quellen: ThemeParks.wiki, Wartezeiten.app und Queue-Times.com. Wir fragen jeden Park alle fünf Minuten ab, und wenn die Quellen verschiedene Zahlen melden, gilt die Mehrheit.',
  },
  {
    question: 'Warum steht bei manchen Parks „keine Prognose“?',
    answer:
      'Eine Auslastungsstufe vergleicht den Park mit seiner eigenen Vergangenheit, und dafür braucht es rund 30 Betriebstage. Bei neuen oder selten geöffneten Parks steht deshalb nichts statt einer geratenen Farbe.',
  },
  {
    question: 'Warum zeigt der Hansa-Park keine Wartezeiten?',
    answer:
      'Der Park zeigt seine Wartezeiten nur in der eigenen App und nur im Park-WLAN, eine öffentliche Schnittstelle gibt es nicht. Auf park.fan steht deshalb ein Hinweis statt 82 Bahnen, die leer aussehen.',
  },
  {
    question: 'Was ist Rope Drop?',
    answer:
      'Direkt zur Parköffnung an einer bestimmten Bahn zu stehen, bevor sich die Wege füllen. park.fan empfiehlt das, wenn die Bahn an ihrer Spitze mindestens 60 Minuten erreicht und der frühe Start davon mindestens 45 spart, und schreibt dazu, wie lange der Vorsprung ungefähr hält.',
  },
  {
    question: 'Kostet park.fan etwas, und brauche ich ein Konto?',
    answer:
      'Nein und nein. Alles auf park.fan ist kostenlos und ohne Anmeldung nutzbar. Favoriten und Tagespläne liegen in deinem Browser.',
  },
  {
    question: 'Wie oft aktualisieren sich die Zahlen?',
    answer:
      'Eine geöffnete Parkseite holt alle fünf Minuten neue Werte. Typische Wartezeiten und Rope-Drop-Empfehlungen rechnen wir einmal pro Nacht neu, weil sie sich von einem Tag auf den anderen kaum bewegen.',
  },
];

/** The guide page's article, German. */
export function ContentDE() {
  const glossary = `/${GLOSSARY_SEGMENTS.de}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.de}`;
  const planner = `/${PLANNER_SEGMENTS.de}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Kapitel" />

      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan ist in einer Warteschlange entstanden. Taron, Nachmittag, die Anzeige sagte etwas
          Dreistelliges, und keiner in der Warteschlange wusste, ob das jetzt Pech war oder einfach
          Dienstag.
        </Lead>
        <P>
          Die aktuelle Wartezeit steht am Eingang und in der App des Parks. park.fan stellt daneben,
          wie ein normaler Tag an dieser Bahn aussieht, wann ihre Warteschlange kürzer wird und an
          welchem Tag sich der Besuch überhaupt lohnt.
        </P>
        <P>
          Die Karten, Badges und Tabellen weiter unten sind die Bauteile von park.fan selbst,
          gefüttert mit festen Beispielzahlen aus dem Phantasialand. Im Park hast du dieselben
          Karten auf dem Handy, dann mit den Zahlen von heute.
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

      <SectionShell
        id="zahl"
        index="01"
        kicker="Die Karte"
        title="Vier Angaben neben der Wartezeit"
        icon={Gauge}
      >
        <P>
          Am Eingang von Taron stehen 70 Minuten. Ob du dich jetzt anstellen solltest oder besser
          nach dem Mittagessen, steht dort nicht. Auf park.fan stehen neben derselben Zahl eine
          Auslastungsstufe, ein Trend, die Single-Rider-Warteschlange und die Mindestgröße.
        </P>

        <BareNumberVsCard
          unit="Minuten"
          signLabel="Was der Park anschreibt"
          signCaption="Eine Zahl ohne Vergleich."
          cardLabel="Was park.fan daraus macht"
          cardCaption="Dieselben 70 Minuten mit Auslastung, Trend, Single-Rider-Zeit, Mindestgröße und dem Hinweis, wann es ruhiger wird."
        />

        <div className="space-y-4 pt-2">
          <P>
            Die Auslastungsstufe vergleicht die Zahl mit dem, was an dieser Bahn normal ist. Taron
            liegt im Mittel bei {TARON_BASELINE} Minuten, {TARON_WAIT_NOW} sind gut anderthalbmal so
            viel, und das heißt „Sehr hoch“. Der kleine Pfeil daneben zeigt, ob die Warteschlange
            gerade wächst oder kürzer wird.
          </P>
          <PG>
            Wo eine Bahn eine Single-Rider-Warteschlange hat, steht ihre Wartezeit mit auf der
            Karte. Die Mindestgröße ebenfalls, damit du mit einem 130 Zentimeter großen Kind nicht
            erst an der Messlatte erfährst, dass es nicht reicht.
          </PG>
        </div>

        <DemoFrame
          label="Zwei Bahnen, dieselbe Minute"
          note="Taron und Black Mamba im selben Moment: Die eine Warteschlange wächst, die andere wird kürzer. Auf der Parkseite stehen alle Bahnen so beisammen, nach Bereichen gruppiert."
          href={PARK}
          hrefLabel="Phantasialand auf park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

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
            label="Tarons längste gemessene Warteschlange"
            note="Am 16. Juli 2026, in den Sommerferien. Ein einzelner Tag, deshalb steht er als Rekord daneben und nicht im Maßstab."
          >
            <P>
              Ob 70 Minuten viel sind, zeigen zwei Vergleichswerte. Typisch ist, wie lang die
              längste Warteschlange des Tages an dieser Bahn normalerweise ist, voll, wie lang sie
              an den vollsten zehn Prozent der Tage war.
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
                    {i === 1 && 'Am Samstag sind 70 Minuten normal'}
                    {i === 2 && 'Und einmal waren es 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Montags liegt die Tagesspitze typischerweise bei {step.typical} Minuten, und
                        an neun von zehn Montagen bleibt sie bei {step.busy} oder darunter. Wer
                        heute {TARON_WAIT_NOW} sieht, hat einen der vollen Montage erwischt.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Samstags sind {step.typical} Minuten der Median. Dieselbe Anzeige ist an
                        diesem Tag ganz normal, und die Bahnen daneben sind genauso voll.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Unter der Woche liegt die Spitze typischerweise bei {step.typical} Minuten.
                        Die gestrichelte Linie ganz hinten ist der Rekord von {TARON_RECORD} Minuten
                        am 16. Juli. Ein Tag wie dieser würde einen Durchschnitt verzerren, deshalb
                        rechnet „voll“ mit den vollsten zehn Prozent der Tage statt mit dem Maximum.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    pinned figure there that could change. */}
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

          {/* Card left, prose right: the card is a park-page sidebar component, so it keeps
              its own width and the text takes the rest. */}
          <div className="grid items-start gap-8 pt-6 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)]">
            <DemoFrame
              label="Auf der Seite einer Bahn"
              note="Tarons Werte, wie die API sie am 10. September 2026 geliefert hat."
              href={TARON}
              hrefLabel="Aktuelle Werte für Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Auf der Seite jeder Bahn steht dieser Maßstab Wochentag für Wochentag. Die Zahl über
                dem Balken ist der volle Wert, der kräftige Teil darunter der typische, und unten
                steht der Rekord mit Datum.
              </P>
              <P>
                Samstag ist der einzige Tag, an dem Tarons {TARON_WAIT_NOW} Minuten genau in der
                Mitte liegen. Gerechnet ist das aus {TARON_WEEKDAY_DAYS} Messtagen unter der Woche
                und {TARON_WEEKEND_DAYS} am Wochenende.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Dieselbe Tabelle für den ganzen Park, live"
            note="Der aktuelle Stand für das Phantasialand, pro Bahn der typische und der volle Wert."
            href={PARK}
            hrefLabel="Phantasialand auf park.fan →"
          >
            <LiveTopAttractions locale="de" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      <SectionShell
        id="moment"
        index="03"
        kicker="Die Uhrzeit"
        title="Der beste Moment des Tages"
        icon={Sunrise}
      >
        <P>
          „Früh kommen“ hilft nur, wenn die Warteschlange im Lauf des Tages wächst, und das tut sie
          nicht an jeder Bahn. Sechs Bahnen aus demselben Park, Stunde für Stunde:
        </P>

        <DemoFrame
          label="Das Stundenprofil, gerade eben"
          note="Live aus dem Stundenprofil des Parks. Fett steht die vollste Stunde jeder Bahn."
          href={PARK}
          hrefLabel="Phantasialand auf park.fan →"
        >
          <LiveHourlyProfile locale="de" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Bei Taron ist die Uhrzeit fast egal, die Werte bleiben den ganzen Tag in einem engen
            Band, und den Unterschied macht der Wochentag aus Kapitel 02. Chiapas wird dagegen bis
            in den Nachmittag deutlich voller. Deshalb rechnet park.fan den besten Moment für jede
            Bahn einzeln.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Die Empfehlung, die daraus entsteht"
            note="Empfohlen wird nur, wenn die Bahn an ihrer Spitze mindestens 60 Minuten erreicht und der frühe Start davon mindestens 45 spart."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              Die Karte nennt die typische Wartezeit zur Öffnung, die Tagesspitze, wie viel du
              sparst und bis wann der Vorsprung hält.
            </PG>
            <P>
              Liegt die ruhigste Zeit einer Bahn woanders, etwa am Abend, steht sie ebenfalls auf
              der Karte. Auf der Parkseite stehen die Bahnen, bei denen sich früh aufstehen am
              meisten lohnt, nach gesparten Minuten sortiert.
            </P>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="tag"
        index="04"
        kicker="Das Datum"
        title="Der richtige Tag, Monate im Voraus"
        icon={CalendarDays}
      >
        <P>
          Das Datum entscheidet mehr als die Uhrzeit. Zwischen zwei Tagen derselben Woche kann eine
          halbe Stunde durchschnittliche Wartezeit liegen, je nach Schulferien, Feiertagen,
          Brückentagen und Wetter.
        </P>

        <DemoFrame
          label="Vier Tage aus den Herbstferien"
          note="Der 15. Oktober ist der ruhigste der vier, obwohl er mitten in den Ferien liegt, weil es regnet. Am 19. hat der Park zu. Auf park.fan steht derselbe Kalender Monat für Monat."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            Oft zählen die Ferien der Nachbarn so viel wie die eigenen, weil Tagesgäste keine
            Grenzen kennen. Das Phantasialand liegt rund 90 Kilometer von den Niederlanden entfernt,
            und im Kalender stehen neben den Ferien in Nordrhein-Westfalen auch die der Provinz
            Gelderland. Ferienregionen im Umkreis von rund 200 Kilometern bekommen eine eigene
            Markierung.
          </P>
          <PG>
            Die Farbe eines Tages ist eine Prognose. Wie gut unsere Prognosen treffen, rechnet die
            Fancast-Seite öffentlich nach.
          </PG>
          <P>
            Bei einem Park, der das ganze Jahr geöffnet hat, reicht der Kalender rund elf Monate
            weit. Bei einem Saisonpark endet er mit der veröffentlichten Saison, und ein Tag, an dem
            der Park zu hat, steht als geschlossen da.
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

      <SectionShell
        id="tagesplan"
        index="05"
        kicker="Der Planer"
        title="Den Tag vorher durchspielen"
        icon={CalendarClock}
      >
        <P>
          Im Tagesplaner legst du die Bahnen, die du fahren willst, auf eine Zeitleiste. Jeder Block
          ist so hoch wie die vorhergesagte Wartezeit zu seiner Stunde, und zwischen zwei Blöcken
          steht, ob die Zeit für den Weg reicht.
        </P>
        <P>
          Unten liegt ein Plan für das Phantasialand am Samstag, 12. September 2026, mit der
          Prognose vom 4. September. Zieh einen Block auf eine andere Uhrzeit, dann ändern sich
          seine Höhe und die Umstiege. Dein eigener Plan bleibt davon unberührt.
        </P>

        <DemoFrame
          label="Ein geplanter Samstag"
          href={planner}
          hrefLabel="Zum Tagesplaner →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          Was der Tagesplaner sonst kann, etwa Bahnen nach Mindestgröße markieren oder den Tag per
          Knopf sortieren, steht auf der <A href={planner}>Seite des Tagesplaners</A>.
        </P>
      </SectionShell>

      <SectionShell
        id="parkseite"
        index="06"
        kicker="Der Rundgang"
        title="Die Parkseite von oben nach unten"
        icon={Layers}
      >
        <P>
          Alles aus den ersten Kapiteln steht auf einer Seite pro Park, in der Reihenfolge, in der
          man fragt: Hat der Park heute auf? Regnet es gleich? Wie lang ist die Warteschlange? Und
          wann wäre ich besser gekommen?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Nur wenn:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              Die Hälfte dieser Abschnitte erscheint nur, wenn es etwas zu zeigen gibt. Ein Park
              ohne Shows bekommt keinen leeren Show-Reiter.
            </Highlight>
            <PG>
              Der gewählte Reiter steht in der Adresse. Wer den Link zum Kalender verschickt,
              verschickt den Kalender und nicht die Attraktionsliste.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Phantasialand ansehen
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      <Ambience tone="emerald">
        <SectionShell
          id="nachtschicht"
          index="07"
          kicker="Der Unterbau"
          title="Woher die Zahlen kommen"
          icon={Database}
        >
          <P>
            Alle fünf Minuten fragen wir jeden der 212 Parks ab, bei drei öffentlichen Quellen
            gleichzeitig. Melden sie verschiedene Zahlen, gilt die Mehrheit.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wartezeiten" delay={0}>
              ThemeParks.wiki, Wartezeiten.app und Queue-Times.com, alle fünf Minuten.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Ferien & Feiertage" delay={60}>
              Nager.Date für Feiertage und Brückentage, OpenHolidays für Schulferien, jede Region
              einzeln.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Wetter" delay={120}>
              Open-Meteo für Vorhersage und Regenradar, Unwetterwarnungen von DWD und MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Öffnungszeiten" delay={0}>
              Aus den Parkkalendern. Wo ein Park keinen veröffentlicht, schätzen wir die Zeiten aus
              dem Betrieb der Bahnen und schreiben das dazu.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Historie" delay={60}>
              Jede gemessene Wartezeit bleibt gespeichert, auch die eines ruhigen
              Dienstagvormittags.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Prognosemodelle" delay={120}>
              Eines für heute, eines für die nächsten Wochen, eines für den Rest des Jahres. Jedes
              wird an den tatsächlichen Wartezeiten nachgemessen.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              Wie lang Tarons Warteschlange an einem typischen Dienstag ist, rechnen wir nachts,
              während die Parks zu haben. Wenn du morgens die Seite öffnest, ist es fertig.
            </P>
          </div>

          <NightShift
            locale="de"
            jobs={NIGHT_JOBS}
            caption="Uhrzeiten in UTC. Jeder Schritt baut auf dem vorigen auf."
          />
        </SectionShell>
      </Ambience>

      <SectionShell
        id="luecken"
        index="08"
        kicker="Die Grenzen"
        title="Wenn wir nichts wissen"
        icon={HelpCircle}
      >
        <P>In drei Fällen lassen wir ein Feld lieber leer, als eine Zahl zu raten.</P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Park ohne lesbare Quelle"
            note="Der Hansa-Park zeigt seine Wartezeiten nur in der eigenen App im Park-WLAN. Ohne diesen Hinweis stünden auf park.fan 82 Bahnen, die leer aussehen."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Bahn außerhalb ihrer Saison"
            note="Über eine Eisbahn im August meldet niemand etwas. Sie steht deshalb als außerhalb der Saison da und zählt an dem Tag nicht zu den geöffneten Bahnen."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Keine Bewertungsgrundlage"
            note="Unter rund 30 Betriebstagen fehlt der Vergleichswert. Ein neuer Park bekommt deshalb „Keine Prognose“ statt einer Farbe."
          >
            <BadgeRowDemo
              crowdLabel="Auslastung: wie voll ist es gerade"
              comparisonLabel="Vergleich: voller als sonst?"
              caption="Taron steht bei 70 Minuten auf „Sehr hoch“, und verglichen mit seinen typischen 45 Minuten auf „Viel höher“. Bei einem kleinen Park, an dem 25 Minuten normal sind, kann „Sehr hoch“ neben „Typisch“ stehen."
            />
          </DemoFrame>
        </div>
      </SectionShell>

      <SectionShell id="wegweiser" index="09" kicker="Wegweiser" title="Wo was steht" icon={Search}>
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Suche',
              body: (
                <>
                  Strg + K oder ⌘ + K auf jeder Seite. Findet Parks, Bahnen, Shows und Restaurants,
                  auch mit Tippfehlern.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Standort',
              body: (
                <>
                  Gibst du ihn frei, stehen auf der Startseite die Parks in deiner Nähe, im Park die
                  nächsten Bahnen mit Entfernung und Wartezeit.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoriten',
              body: (
                <>
                  Der Stern auf jeder Park- und Attraktionskarte. Favoriten stehen mit ihrer
                  aktuellen Wartezeit auf der Startseite und liegen im Browser, ohne Konto.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Körpergröße',
              body: (
                <>
                  Im Reiter Attraktionen stellst du den Regler auf das kleinste Kind, dann bleiben
                  nur die Bahnen, die es fahren darf.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Tagesplaner',
              body: (
                <>
                  Von jeder Seite aus zu öffnen. Der Plan liegt im Browser, mehr dazu in Kapitel 05.
                </>
              ),
            },
            {
              icon: BarChart3,
              title: 'Attraktionsseite',
              body: (
                <>
                  Verlauf, typische Wartezeiten pro Wochentag, Rope Drop, Mindestgröße und wie gut
                  die Prognose für diese Bahn trifft.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Längere Texte zu Parks und Bahnen, darunter{' '}
                  <A href="/blog/category/guides">Parkführer</A> mit Tickets, Reihenfolge und
                  Anreise.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Wörterbuch',
              body: (
                <>
                  <A href={glossary}>Alle Fachbegriffe</A> mit Erklärung und Beispielbahnen, manche
                  mit einem 3-D-Modell.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      <SectionShell
        id="faq"
        index="10"
        kicker="Nachgefragt"
        title="Häufige Fragen"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="Und jetzt?"
        title="Weiterlesen"
        body="park.fan ist kostenlos, ohne Konto und ohne Werbung. Die Parkseite zeigt alles mit den Zahlen von heute, Fancast rechnet vor, wie gut die Prognosen der letzten 30 Tage getroffen haben, und die beste Reisezeit vergleicht mehrere Parks."
        destinations={[
          { href: PARK, label: 'Beispiel-Parkseite ansehen', icon: Activity, prefetch: false },
          { href: bestTime, label: 'Beste Reisezeit', icon: CalendarDays, prefetch: false },
          {
            href: '/fancast',
            label: 'Treffsicherheit der Prognosen',
            icon: Sparkles,
            prefetch: false,
          },
        ]}
      />
    </>
  );
}
