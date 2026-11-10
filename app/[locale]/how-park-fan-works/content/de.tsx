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
  Bell,
  CalendarClock,
  CalendarDays,
  CloudSun,
  Database,
  Gauge,
  GraduationCap,
  HelpCircle,
  Layers,
  MapPin,
  MessageCircle,
  Ruler,
  Scale,
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
  ParkyShot,
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
  AnatomyHolidayDemo,
  AnatomyNearbyDemo,
  AnatomyPurchasesDemo,
  AnatomyShowsDemo,
  AnatomyStatsDemo,
} from '../_anatomy-demos';
import { WeatherWarningBannerDemo } from '@/components/parks/weather-warning-banner-demo';
import { NowcastBannerDemo } from '@/components/parks/nowcast-banner-demo';
import { WeatherCardShowcase } from '@/components/parks/weather-card-demo';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { Ambience, IntroWithAside, ParkAnatomy, type AnatomyStep } from '../_chrome';
import { ChapterList, ChapterRail } from '../_chapter-rail';
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
  typical: 'Normal',
  busy: 'Voll',
  unit: 'Min.',
  days: 'Messtage',
  record: 'Rekord',
  summary:
    'Taron, {label}: normalerweise {typical} Minuten, an vollen Tagen {busy}, gemessen an {days} Tagen. Angeschrieben sind {wait} Minuten.',
};

const SCALE_LEGEND = [
  {
    term: 'Normal',
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
 * The sections of a park page in the order they render (`app/[locale]/parks/.../page.tsx`,
 * `ParkPageShell`, `LiveParkData`). Whoever reorders them there reorders them here, or the guide
 * describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Titelkarte',
    body: 'Name und Ort, wie weit du entfernt bist, der Stern für deine Favoriten, ein kurzer Text zum Park, seine Links und der Knopf zum Tagesplaner. Wo genug gemessen ist, steht darunter, welche Wochentage meist ruhig und welche voll sind.',
  },
  {
    title: 'Skip-the-line-Preise',
    body: 'Tagespreise für kostenpflichtige Warteschlangen wie Lightning Lane, ausverkaufte als solche markiert.',
    example:
      'Im Magic Kingdom am 4. November 2026: der Multi Pass für 37 Dollar, die Einzelbuchung für Seven Dwarfs Mine Train ausverkauft.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'der Park sie veröffentlicht, bisher nur die Disney-Parks in den USA.',
  },
  {
    title: 'Wenn du im Park bist',
    body: 'Ein Kompass zeigt, in welcher Richtung die großen Bahnen liegen. Darunter stehen die Bahnen, an denen es jetzt kürzer ist als später, und die nächsten mit Entfernung und Wartezeit.',
    onlyWhen: 'du im Park stehst und deinen Standort freigegeben hast.',
  },
  {
    title: 'Heute im Park',
    body: 'Status und Öffnungszeiten, wie viele Bahnen offen sind, der Andrang jetzt, die Prognose für heute, die Auslastung, die Wartezeiten der großen Bahnen und die nächsten Shows. Gilt eine amtliche Unwetterwarnung von DWD oder MeteoAlarm, steht sie ganz oben im Wortlaut. In der Titelzeile stehen die Temperatur und eine Warnung, wenn Regen oder ein Gewitter kommt; ein Druck darauf zeigt die nächsten Stunden in Viertelstunden. Ganz unten stehen die Ferien, die heute auf den Park wirken, die der eigenen Region zuerst.',
    example:
      'Am 24. August 2026 hatte das Phantasialand von 9 bis 19 Uhr geöffnet, und neben Nordrhein-Westfalen hatte auch Gelderland Sommerferien.',
    demo: (
      <div className="space-y-3">
        <WeatherWarningBannerDemo />
        <NowcastBannerDemo single />
        <AnatomyHolidayDemo />
      </div>
    ),
  },
  {
    title: 'Die Kacheln',
    body: 'Unter „Heute im Park“ liegt eine Reihe Kacheln, die meisten mit einer Zahl von heute, etwa wie viele Bahnen offen sind oder wann die nächste Show beginnt. Attraktionen, Wetter, Karte, Shows und Restaurants öffnen ihren Reiter auf derselben Seite, Wartezeiten-Kalender und Statistik sind eigene Seiten.',
  },
  {
    title: 'Attraktionen',
    body: 'Der Reiter, der beim Öffnen gewählt ist: alle Bahnen als Karten wie in Kapitel 01, nach Bereichen gruppiert oder nach Wartezeit sortiert, durchsuchbar und filterbar, etwa nach Körpergröße oder nach offenen Bahnen. Darüber stehen die Bahnen, bei denen sich früh kommen lohnt. Hat eine Bahn eine Saison, steht sie auf ihrer Karte. Darunter folgen, wo es sie gibt, die Bahnen, die für immer geschlossen haben, und der Link zur Seite „Mit Kindern“.',
    example: 'Im Phantasialand steht dort oben Taron.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Wartezeiten-Kalender',
    body: 'Eine eigene Seite pro Monat: die Tage aus Kapitel 04 im Monatsraster, zu jedem Tag ein Fenster mit den Details und der Vergleich zweier Tage. Oben steht „Beste Reisezeit“ mit den ruhigsten Terminen der nächsten drei Monate und dem ruhigsten Wochentag.',
    demo: (
      <div className="space-y-3">
        <AnatomyBestDaysDemo locale="de" />
        <AnatomyCalendarDemo />
      </div>
    ),
  },
  {
    title: 'Wetter, Karte, Shows, Restaurants',
    body: 'Vier weitere Reiter. Das Wetter von jetzt, im Tagesverlauf und als Vorhersage, wobei die Öffnungsstunden auf der Achse den meisten Platz bekommen. Eine Karte mit allen Bahnen. Shows mit ihren Spielzeiten für den ganzen Tag und Restaurants mit ihrem Status, beide nur, wenn der Park welche meldet.',
    example:
      'Am 4. November 2026 listete der Europa-Park 16 Shows und 64 Restaurants. Das Phantasialand hatte an dem Tag keine Show im Programm und deshalb auch keinen Show-Reiter.',
    demo: (
      <div className="space-y-3">
        <WeatherCardShowcase variant="single" />
        <AnatomyShowsDemo />
      </div>
    ),
  },
  {
    title: 'Parks in deiner Nähe',
    body: 'Bis zu drei andere Parks im Umkreis von 100 Kilometern, mit Entfernung und Status.',
    example: 'Vom Phantasialand aus Toverland und Movie Park Germany, beide gut 90 Kilometer.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'mindestens zwei andere Parks in diesem Umkreis liegen.',
  },
  {
    title: 'Blog',
    body: 'Beiträge, in denen dieser Park vorkommt.',
    demo: <AnatomyBlogDemo locale="de" />,
    onlyWhen: 'es welche gibt.',
  },
  {
    title: 'Statistik',
    body: 'Die längsten Warteschlangen des Parks, gemittelt über die Öffnungsstunden, dazu die Monate, die Wochentage und die vollsten und ruhigsten gemessenen Tage. Die Kachel „Statistik“ führt zu einer eigenen Seite, die außerdem einen normalen Tag Stunde für Stunde zeigt.',
    demo: <AnatomyStatsDemo />,
  },
  {
    title: 'Die nächsten zwölf Monate',
    body: 'Die Prognose Tag für Tag, zu Monaten zusammengefasst, mit der Zahl der empfohlenen Tage. Ein Monat führt in den Wartezeiten-Kalender.',
    onlyWhen: 'es für den Park eine Prognose gibt.',
  },
  {
    title: 'Saisons und Events',
    body: 'Halloween, Weihnachten und andere Events mit ihren Daten, ob sie bestätigt, angekündigt oder nur erwartet sind, und was ein eigenes Ticket kostet.',
    onlyWhen: 'wir für den Park Events recherchiert haben.',
  },
  {
    title: 'Infos und Fragen',
    body: 'Adresse, Telefon, Eröffnungsjahr und Fläche, soweit wir sie haben, dann häufige Fragen zu diesem Park.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Gestern Stunde für Stunde',
    body: 'Für jede Bahn und jede Stunde des Vortags, was meist anstand und was in den vollen Momenten.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Der Normalwert jedes Parks',
    body: 'Der Wert, an dem der Andrang eines Parks gemessen wird.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Das Modell für die nächsten Wochen lernt nach',
    body: 'Es bekommt die Wartezeiten von gestern dazu.',
  },
  {
    hour: 4,
    minute: 0,
    at: 0.34,
    title: 'Der Normalwert jeder Bahn',
    body: 'Der Wert, an dem die Stufe auf der Karte aus Kapitel 01 misst.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.46,
    title: 'Gestern zusammenfassen',
    body: 'Der ganze Vortag in Viertelstunden.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.6,
    title: 'Lohnt früh aufstehen?',
    body: 'Pro Bahn, wie viel ein früher Start spart und wie lange der Vorsprung hält.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.72,
    title: 'Normal und voll pro Wochentag',
    body: 'Die Werte aus Kapitel 02 für jede Bahn, dazu der Rekord.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.86,
    title: 'Das Modell für den Rest des Jahres lernt nach',
    body: 'Auch es bekommt die Wartezeiten von gestern dazu.',
  },
];

const FAQ = [
  {
    question: 'Was heißt „normal“ und „voll“ bei einer Wartezeit?',
    answer:
      'Normal ist der Median der Tagesspitzen: An der Hälfte der gemessenen Tage war die längste Warteschlange kürzer. Voll ist das 90. Perzentil derselben Reihe, ungefähr der vollste Tag von zehn. Der Rekord steht daneben. Weil beide Werte Perzentile sind, verschiebt ein einzelner Ausreißer sie kaum.',
  },
  {
    question: 'Sind 70 Minuten Wartezeit viel?',
    answer:
      'Das hängt von der Bahn und vom Wochentag ab. An Taron im Phantasialand liegt die Spitze montags normalerweise bei 55 Minuten, 70 sind dort also viel. Samstags sind 70 Minuten der Median und damit ein ganz normaler Tag. Beide Vergleichswerte stehen auf park.fan auf der Seite der Bahn.',
  },
  {
    question: 'Woher kommen die Wartezeiten?',
    answer:
      'Aus bis zu drei öffentlichen Quellen. ThemeParks.wiki ist die Grundquelle; Queue-Times.com und Wartezeiten.app ergänzen Bahnen, die dort fehlen, und korrigieren ein veraltetes „geschlossen“. Neue Werte holen wir alle fünf Minuten.',
  },
  {
    question: 'Warum steht bei manchen Parks „Keine Prognose“?',
    answer:
      'Eine Auslastungsstufe vergleicht den Park mit seiner eigenen Vergangenheit, und dafür braucht es rund 30 Betriebstage. Bei neuen oder selten geöffneten Parks steht deshalb nichts statt einer geratenen Farbe.',
  },
  {
    question: 'Warum zeigt der Hansa-Park keine Wartezeiten?',
    answer:
      'Der Park zeigt seine Wartezeiten nur in der eigenen App und nur im Park-WLAN, eine öffentliche Schnittstelle gibt es nicht. Auf park.fan steht deshalb über der Bahnliste ein Hinweis, warum dort keine Zeiten stehen.',
  },
  {
    question: 'Was ist Rope Drop?',
    answer:
      'Direkt zur Parköffnung an einer bestimmten Bahn zu stehen, bevor sich die Wege füllen. park.fan empfiehlt das, wenn die Bahn an ihrer Spitze mindestens 60 Minuten erreicht und der frühe Start davon mindestens 45 spart, und schreibt dazu, wie lange der Vorsprung ungefähr hält.',
  },
  {
    question: 'Kostet park.fan etwas, und brauche ich ein Konto?',
    answer:
      'Nein und nein. Alles auf park.fan ist kostenlos und ohne Anmeldung nutzbar. Favoriten und Tagespläne liegen in deinem Browser. Nur wenn du einen Plan teilst oder dir zu ihm Mitteilungen schicken lässt, legen wir ihn auch bei uns ab.',
  },
  {
    question: 'Wie oft aktualisieren sich die Zahlen?',
    answer:
      'Eine geöffnete Parkseite holt alle fünf Minuten neue Werte. Die Werte pro Wochentag und die Rope-Drop-Empfehlungen rechnen wir einmal pro Nacht neu, weil sie sich von einem Tag auf den anderen kaum bewegen.',
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
          Die Karten, Badges und Tabellen weiter unten sind die Bauteile von park.fan selbst. Die
          meisten zeigen feste Beispielzahlen, wie die API sie im Sommer und Herbst 2026 geliefert
          hat, fast alle aus dem Phantasialand; zwei Tabellen laufen live. Im Park hast du dieselben
          Karten auf dem Handy, dann mit den Zahlen von heute.
        </P>

        <Reveal>
          <ChapterList chapters={CHAPTERS} ariaLabel="Kapitel" />
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
            Die Auslastungsstufe vergleicht die Zahl mit dem Normalwert dieser Bahn, dem Median
            ihrer gemessenen Wartezeiten. Bei Taron lag er im September bei {TARON_BASELINE}{' '}
            Minuten, {TARON_WAIT_NOW} sind gut anderthalbmal so viel, und das heißt „Sehr hoch“. Der
            kleine Pfeil daneben zeigt, ob die Warteschlange gerade wächst oder kürzer wird.
          </P>
          <PG>
            Wo eine Bahn eine Single-Rider-Warteschlange hat, steht ihre Wartezeit mit auf der
            Karte. Die Mindestgröße ebenfalls, damit du mit einem 120 Zentimeter großen Kind nicht
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
          title="Normal, voll, Rekord"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} Min.`}
            label="Tarons längste gemessene Warteschlange"
            note="Am 16. Juli 2026. In Nordrhein-Westfalen war noch Schule, in den Nachbarregionen schon Sommerferien. Ein einzelner Tag: Er steht als Rekord daneben, den Maßstab verschiebt er kaum."
          >
            <P>
              Ob 70 Minuten viel sind, zeigen zwei Vergleichswerte. Normal ist, wie lang die längste
              Warteschlange des Tages an dieser Bahn gewöhnlich wird, voll, wie lang sie an den
              vollsten zehn Prozent der Tage war.
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
                        Montags liegt die Tagesspitze normalerweise bei {step.typical} Minuten, und
                        an neun von zehn Montagen bleibt sie bei {step.busy} oder darunter. Wer
                        heute {TARON_WAIT_NOW} sieht, hat einen der vollen Montage erwischt.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Samstags sind {step.typical} Minuten der Median: An der Hälfte der Samstage
                        blieb die längste Warteschlange darunter. Dieselbe Anzeige ist an diesem Tag
                        ganz normal.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Unter der Woche liegt die Spitze normalerweise bei {step.typical} Minuten.
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
                dem Balken ist der volle Wert, der kräftige Teil darunter der normale, und unten
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
            label="Der ganze Park, live"
            note="Die längsten Warteschlangen im Phantasialand, so wie sie gerade auf der Parkseite stehen. Diese Tabelle ist anders gerechnet als die Seite einer Bahn: Sie mittelt über alle Öffnungsstunden der letzten zwei Jahre. „Typisch“ ist, was in einer Stunde meist ansteht, „Spitze“, was in ihren vollen Minuten ansteht. Deshalb liegen ihre Zahlen unter den Tagesspitzen aus dem Maßstab oben."
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
          label="Eine Woche Herbstferien"
          note="Vier gemessene Tage im Phantasialand, alle in den Herbstferien von Nordrhein-Westfalen 2026: am Dienstag, 20. Oktober, im Schnitt 45 Minuten an den großen Bahnen, am Sonntag darauf 20. Dieselben Ferien, vier verschiedene Stufen. Auf park.fan steht derselbe Kalender Monat für Monat."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            Oft zählen die Ferien der Nachbarn so viel wie die eigenen, weil Tagesgäste keine
            Grenzen kennen. Das Phantasialand liegt rund 60 Kilometer von den Niederlanden entfernt,
            und im Kalender stehen neben den Ferien in Nordrhein-Westfalen auch die der Provinzen
            Limburg und Gelderland. Die Ferien der Nachbarregionen, die wir für einen Park
            hinterlegt haben, bekommen eine eigene Markierung.
          </P>
          <PG>
            Die Farbe eines kommenden Tages ist eine Prognose, die eines vergangenen ist gemessen.
            Wie gut unsere Prognosen treffen, rechnet die Fancast-Seite öffentlich nach.
          </PG>
          <P>
            Veröffentlicht ein Park seine Öffnungszeiten, reicht der Kalender so weit wie sie,
            höchstens ein Jahr, und ein Tag, an dem der Park zu hat, steht als geschlossen da. Für
            den Überblick fasst die Parkseite die Prognose unter „Die nächsten zwölf Monate“ Monat
            für Monat zusammen.
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
              ohne Shows bekommt weder eine Show-Kachel noch einen leeren Show-Reiter.
            </Highlight>
            <PG>
              Der gewählte Reiter steht in der Adresse. Wer den Link zur Karte verschickt,
              verschickt die Karte und nicht die Liste der Attraktionen. Kalender und Statistik sind
              eigene Seiten mit eigener Adresse.
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
            Alle fünf Minuten holen wir für jeden der über 200 Parks neue Wartezeiten, aus bis zu
            drei öffentlichen Quellen. ThemeParks.wiki ist die Grundquelle. Queue-Times.com und
            Wartezeiten.app ergänzen Bahnen, die dort fehlen, und korrigieren ein veraltetes
            „geschlossen“. Für ein paar Parks ist eine von beiden die einzige Quelle.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Wartezeiten" delay={0}>
              ThemeParks.wiki als Grundlage, Queue-Times.com und Wartezeiten.app für das, was dort
              fehlt.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Ferien & Feiertage" delay={60}>
              Region für Region: in Europa von Nager.Date und OpenHolidays, anderswo aus den
              Kalendern von Behörden und Schulbezirken.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Wetter" delay={120}>
              Open-Meteo für die Vorhersage und eine Kurzfristprognose für Regen in Viertelstunden,
              Unwetterwarnungen von DWD und MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Öffnungszeiten" delay={0}>
              Aus den Parkkalendern. Wo ein Park keine veröffentlicht, leiten wir die Zeiten für
              heute und die Tage davor aus dem Betrieb der Bahnen ab und schreiben dazu, dass sie
              geschätzt sind.
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
              Wie lang Tarons Warteschlange an einem normalen Dienstag ist, rechnen wir nachts,
              während die Parks in Europa zu haben. Wenn du morgens die Seite öffnest, ist es
              fertig.
            </P>
          </div>

          <NightShift
            locale="de"
            jobs={NIGHT_JOBS}
            caption="Uhrzeiten in UTC. Die Reihenfolge sorgt dafür, dass jeder Schritt die Zahlen schon vorfindet, die er braucht. Das Modell für heute lernt erst um 08:30 nach."
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
            note="Der Hansa-Park zeigt seine Wartezeiten nur in der eigenen App im Park-WLAN. Über seinen rund 80 Bahnen steht deshalb dieser Hinweis, warum dort keine Zeiten stehen."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Bahn außerhalb ihrer Saison"
            note="Über eine Eisbahn im August meldet niemand etwas. Weil wir ihre Saison kennen, November bis Januar, steht sie dann als außerhalb der Saison da und zählt nicht zu den geöffneten Bahnen."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Keine Bewertungsgrundlage"
            note="Unter rund 30 Betriebstagen fehlt der Vergleichswert. Ein neuer Park bekommt deshalb „Keine Prognose“ statt einer Farbe."
          >
            <BadgeRowDemo
              crowdLabel="Die Stufen"
              caption={`Jede Stufe misst gegen die eigene Vergangenheit der Bahn oder des Parks, nie gegen andere Parks. Taron steht bei 70 Minuten auf „Sehr hoch“, weil sein Normalwert im September bei ${TARON_BASELINE} lag.`}
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
                  Die Taste / auf jeder Seite oder das Suchfeld oben. Findet Parks, Bahnen, Shows,
                  Restaurants und Orte, auch mit Tippfehlern.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Standort',
              body: (
                <>
                  Gibst du ihn frei, stehen auf der Startseite die Parks in deiner Nähe. Im Park
                  zeigt ein Kompass, wo die großen Bahnen liegen, dazu die nächsten mit Entfernung
                  und Wartezeit.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Favoriten',
              body: (
                <>
                  Der Stern auf Parks, Bahnen, Shows und Restaurants. Favoriten stehen mit ihrer
                  aktuellen Wartezeit auf der Startseite und unter{' '}
                  <A href="/favorites">Meine Favoriten</A>, gespeichert im Browser, ohne Konto.
                </>
              ),
            },
            {
              icon: Bell,
              title: 'Alarme',
              body: (
                <>
                  Die Glocke auf einer Bahn oder Show schickt dir eine Mitteilung, wenn die
                  Wartezeit unter deine Grenze fällt, die Bahn wieder öffnet oder die Show bald
                  beginnt. Alle stehen unter <A href="/alerts">Meine Alarme</A>.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Körpergröße',
              body: (
                <>
                  Im Reiter Attraktionen stellst du den Regler auf das kleinste Kind, dann bleiben
                  nur die Bahnen, die es fahren darf. Die Seite „Mit Kindern“ eines Parks hat
                  denselben Regler.
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
                  Verlauf, normale und volle Wartezeit pro Wochentag, Rope Drop, Mindestgröße und
                  wie gut die Prognose für diese Bahn trifft.
                </>
              ),
            },
            {
              icon: Scale,
              title: 'Parks vergleichen',
              body: (
                <>
                  Unter <A href="/compare">Parks vergleichen</A> stehen zwei bis vier Parks
                  nebeneinander, mit ihrer Wartezeit im Schnitt, der längsten Warteschlange und dem
                  ruhigsten Wochentag.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog und News',
              body: (
                <>
                  Längere Texte zu Parks und Bahnen, darunter{' '}
                  <A href="/blog/category/guides">Parkführer</A> mit Tickets, Reihenfolge und
                  Anreise. Unter <A href="/news">News</A> stehen kurze Meldungen aus den Parks.
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
        id="parky"
        index="10"
        kicker="Der Assistent"
        title="Frag Parky"
        icon={MessageCircle}
      >
        <ParkyShot locale="de">
          <P>
            Parky ist der Chat-Assistent von park.fan und wohnt im runden Knopf unten rechts. Auf
            der Startseite steht er auf einem breiten Bildschirm gleich unter der Überschrift und
            hüpft erst beim Scrollen in seine Ecke.
          </P>
          <P>
            Frag ihn, wie lang die Warteschlangen gerade sind, was für heute oder die nächsten
            Wochen vorhergesagt ist, an welchen Tagen die Warteschlangen in einem Park kurz sind,
            wie hoch und schnell eine Achterbahn ist oder was in unseren Beiträgen steht. Für jede
            Antwort schaut er in denselben Daten nach, die auf den Seiten stehen.
          </P>
          <P>
            Parks und Bahnen zeigt er als Karten mit ihren Zahlen. Wenn du ihn darum bittest, bringt
            er dich zur passenden Seite und legt im Tagesplaner einen Tag an, trägt Bahnen ein oder
            sortiert sie. Deinen Standort sieht er nur, wenn du im Chat auf „Standort teilen“
            drückst, und er behält ihn nicht.
          </P>
          <P>
            Die Antworten schreibt ein Sprachmodell, und das vertut sich manchmal. Die Zahlen auf
            den Karten im Chat kommen direkt von park.fan; was Parky dazu schreibt, prüfst du im
            Zweifel auf der Seite der Bahn. Er bleibt bei Parks und Bahnen, sucht nicht im Internet,
            und nach drei Fragen in 30 Sekunden braucht er eine kurze Pause.
          </P>
          <P>
            Deine Fragen speichern wir ohne IP-Adresse und löschen sie nach 7 Tagen. Mehr über
            Parky, mit Beispielfragen, steht auf <A href="/parky">seiner eigenen Seite</A>.
          </P>
        </ParkyShot>
      </SectionShell>

      <SectionShell
        id="faq"
        index="11"
        kicker="Nachgefragt"
        title="Häufige Fragen"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="Und jetzt?"
        title="Weiterlesen"
        body="park.fan ist kostenlos, ohne Konto und ohne Werbung. Die Parkseite zeigt alles mit den Zahlen von heute, Fancast rechnet vor, wie gut die Prognosen der letzten sieben Tage getroffen haben, und die beste Reisezeit vergleicht mehrere Parks."
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
