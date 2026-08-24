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
  HourlyShapeDemo,
  NoWaitTimesDemo,
  OffSeasonDemo,
  RopeDropDemo,
  TwoRidesDemo,
  TypicalWaitsDemo,
} from '../_demos';
import { WaitScaleBar, WaitScaleStage, type WaitScaleStep } from '../_wait-scale';
import { NightShift, type NightShiftJob } from '../_night-shift';
import { TARON_WAIT_NOW, WAIT_SCALE_MAX } from '../_fixtures';

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Typisch',
  busy: 'Voll',
  unit: 'Min.',
  summary:
    'Taron an einem {label}: typischerweise {typical} Minuten, an vollen Tagen {busy}. Aktuell angeschrieben sind {wait} Minuten.',
};

const SCALE_LEGEND = [
  {
    term: 'Typisch',
    def: 'Median der Tagesspitzen. An der Hälfte aller gemessenen Tage war die längste Schlange kürzer.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Voll',
    def: '90. Perzentil derselben Reihe. Ungefähr der eine Tag von zehn, an dem es besonders voll war.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 Min.',
    def: 'Was gerade angeschrieben ist. Bleibt stehen, während sich der Maßstab darunter verschiebt.',
    swatch: 'bg-amber-500',
  },
];

const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'tuesday', label: 'Dienstag', typical: 42, busy: 70 },
  { id: 'saturday', label: 'Samstag', typical: 70, busy: 105 },
  { id: 'holiday', label: 'Ferien-Samstag', typical: 85, busy: 120 },
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
    body: 'Die Tabelle aus Kapitel 02. Pro Wochentag, mit der Zahl der Messtage daneben.',
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
      'Das hängt von der Bahn und vom Wochentag ab. Bei einer Attraktion, deren Dienstage typischerweise bei 42 Minuten liegen, sind 70 Minuten am oberen Rand. Bei derselben Bahn an einem Samstag, an dem 70 Minuten der Normalfall sind, ist es ein durchschnittlicher Tag. park.fan zeigt beide Bezugsgrößen direkt neben der aktuellen Zahl, damit man sie nicht raten muss.',
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
      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan ist in einer Warteschlange entstanden. Taron, Nachmittag, die Anzeige sagte etwas
          Dreistelliges, und niemand konnte sagen, ob das jetzt Pech war oder Dienstag.
        </Lead>
        <P>
          Genau diese Frage stellt die Seite bis heute in den Mittelpunkt. Eine aktuelle Wartezeit
          zu zeigen, ist der einfache Teil: Die Parks schreiben sie selbst an. Interessant wird sie
          erst, wenn daneben steht, wie ein normaler Tag an dieser Bahn aussieht, wann die Schlange
          erfahrungsgemäß kürzer wird und ob heute überhaupt ein guter Tag ist.
        </P>
        <P>
          Auf dieser Seite steht kein Screenshot. Jede Karte, jedes Badge und jede Tabelle unten
          sind die echten Bauteile der Parkseiten, hier nur mit festen Beispielzahlen befüllt. Was
          du gleich lesen lernst, sieht eine Stunde später im Park exakt genauso aus.
        </P>

        <Reveal>
          <nav
            aria-label="Kapitel"
            className="bg-muted/40 not-prose grid gap-x-6 gap-y-2 rounded-2xl border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3"
          >
            {[
              ['#zahl', '01 · Eine Zahl allein'],
              ['#massstab', '02 · Typisch, voll, Rekord'],
              ['#moment', '03 · Der beste Moment'],
              ['#tag', '04 · Der richtige Tag'],
              ['#nachtschicht', '05 · Woher die Zahlen kommen'],
              ['#luecken', '06 · Was wir nicht behaupten'],
              ['#besuche', '07 · Vier Besuche'],
              ['#wegweiser', '08 · Wo was steht'],
              ['#faq', '09 · Häufige Fragen'],
            ].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                {label}
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
          Links steht, was am Eingang der Bahn hängt. Rechts dieselbe Zahl, wie park.fan sie
          ausgibt. Der Unterschied sind nicht die hübscheren Pixel. Es ist alles, was ohne
          Vergangenheit gar nicht erst existieren kann.
        </P>

        <BareNumberVsCard
          unit="Minuten"
          signLabel="Was der Park anschreibt"
          signCaption="Eine Zahl, kein Bezug. Ob das heute gut oder schlecht ist, weiß nur, wer schon oft genug hier war."
          cardLabel="Was park.fan daraus macht"
          cardCaption="Dieselben 70 Minuten, plus Auslastungsstufe, Trend, Single-Rider-Zeit und der Hinweis, wann es voraussichtlich ruhiger wird."
        />

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            Die Auslastungsstufe oben rechts entsteht aus dem Verhältnis der aktuellen Zeit zum
            Median dieser Bahn. Der kleine Pfeil daneben kommt aus den letzten Messungen und sagt,
            ob die Schlange gerade wächst oder abgebaut wird. Beides sind Aussagen über heute, die
            man nur mit gestern treffen kann.
          </P>
          <PG>
            Der zweite Wert auf der Karte ist die Single-Rider-Schlange. Viele Bahnen führen mehrere
            Warteschlangen parallel, und welche davon existiert, steht selten am selben Schild.
          </PG>
        </div>

        <DemoFrame
          label="Zwei Bahnen, dieselbe Minute"
          note="Beide Karten stammen aus demselben Moment im selben Land. Die eine Schlange wächst, die andere baut ab. Auf der Parkseite stehen alle Bahnen so nebeneinander, sortierbar nach Wartezeit."
          href={PARK}
          hrefLabel="Zur Parkseite →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="massstab"
        index="02"
        kicker="Der Maßstab"
        title="Typisch, voll, Rekord"
        icon={Ruler}
      >
        <P>
          Um eine Zahl einzuordnen, braucht es zwei Vergleichswerte und die Angabe, worauf sie
          beruhen. park.fan benutzt dafür den Median der Tagesspitzen und das 90. Perzentil
          derselben Reihe. Im Klartext: Wie lang ist die längste Schlange des Tages üblicherweise,
          und wie lang war sie an den vollsten zehn Prozent der Tage.
        </P>

        <div className="pt-2">
          <WaitScaleStage
            steps={SCALE_STEPS}
            wait={TARON_WAIT_NOW}
            max={WAIT_SCALE_MAX}
            labels={SCALE_LABELS}
            legend={SCALE_LEGEND}
          >
            {SCALE_STEPS.map((step, i) => (
              <div key={step.id} data-wait-step={step.id} className="scroll-mt-28">
                <div className="text-primary mb-2 text-xs font-semibold tracking-widest uppercase">
                  {step.label}
                </div>
                <h3 className="mb-3 text-xl font-bold sm:text-2xl">
                  {i === 0 && '70 Minuten sind ein sehr voller Dienstag'}
                  {i === 1 && '70 Minuten sind ein ganz normaler Samstag'}
                  {i === 2 && 'In den Ferien wären 70 Minuten ein Glücksfall'}
                </h3>
                <p className="text-muted-foreground max-w-xl leading-relaxed">
                  {i === 0 && (
                    <>
                      Dienstags liegt die Tagesspitze meistens bei {step.typical} Minuten. Die
                      angeschriebenen 70 treffen fast genau die Marke, die an neun von zehn
                      Dienstagen unterschritten wird. Wer heute vor dieser Schlange steht, erwischt
                      einen der volleren Dienstage des Jahres, und die Nachmittage danach werden
                      eher schlechter als besser.
                    </>
                  )}
                  {i === 1 && (
                    <>
                      Samstags liegt derselbe Wert bei {step.typical} Minuten. Dieselbe Anzeige
                      bedeutet an diesem Tag: alles wie immer. Sich zu ärgern lohnt nicht, sich
                      umzuorientieren auch nicht, denn die Nachbarbahnen haben denselben Samstag.
                    </>
                  )}
                  {i === 2 && (
                    <>
                      In den Sommerferien rutscht die ganze Verteilung nach rechts. Der Rekord
                      dieser Bahn, {step.busy} Minuten, steht auf genau so einem Tag. Vor 70 Minuten
                      zu stehen, hieße hier: früh genug dran gewesen. Welche Tage das werden,
                      beantwortet nicht diese Tabelle, sondern der Kalender aus Kapitel 04.
                    </>
                  )}
                </p>

                {/* Unter lg trägt jeder Schritt seine eigene Skala: dort gibt es
                    keine mitlaufende Grafik, an der sich etwas ändern könnte. */}
                <WaitScaleBar
                  step={step}
                  wait={TARON_WAIT_NOW}
                  max={WAIT_SCALE_MAX}
                  labels={SCALE_LABELS}
                  className="bg-card/60 mt-5 rounded-2xl border p-5 lg:hidden"
                />
              </div>
            ))}
          </WaitScaleStage>
        </div>

        <div className="max-w-3xl space-y-4 pt-6">
          <P>
            Auf der Seite einer Bahn steht diese Verteilung als Tabelle, Wochentag für Wochentag.
            Die Spalte ganz rechts ist dabei die wichtigste: Sie sagt, auf wie vielen Messtagen die
            Zeile beruht. Ein Wert aus 34 Samstagen trägt eine Aussage. Einer aus vier Tagen nicht,
            und dann steht dort auch keiner.
          </P>
        </div>

        <DemoFrame
          label="Auf der Seite einer Bahn"
          note="Der Balken zeigt typisch und voll nebeneinander, die Zahl daneben die Messtage. Fehlt einem Wochentag die Grundlage, bleibt seine Zeile leer statt gefüllt."
          href={TARON}
          hrefLabel="Echte Werte für Taron →"
          className="max-w-lg"
        >
          <TypicalWaitsDemo />
        </DemoFrame>

        <Highlight>
          Diese Tabelle ist der Grund, warum wir Wartezeiten überhaupt archivieren. Eine Live-Zahl
          kann man abfragen, wenn jemand danach fragt. Ein Median über jeden gemessenen Dienstag
          muss schon fertig sein, bevor die Frage kommt.
        </Highlight>
      </SectionShell>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="moment"
        index="03"
        kicker="Die Uhrzeit"
        title="Der beste Moment des Tages"
        icon={Sunrise}
      >
        <P>
          Eine Bahn hat nicht den ganzen Tag dieselbe Schlange. Der Verlauf ist erstaunlich stabil:
          Morgens kurz, gegen Mittag am längsten, am Abend fällt sie wieder ab. Wie stark, wann
          genau und ob sich das frühe Aufstehen dafür lohnt, ist pro Bahn verschieden und wird pro
          Bahn ausgerechnet.
        </P>

        <div className="grid gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Rope-Drop-Empfehlung"
            note="Empfohlen wird nur, wenn die Tagesspitze mindestens 60 Minuten erreicht und der frühe Start davon mindestens 45 spart. Bahnen darunter bekommen bewusst keinen Hinweis, sonst stünde er überall."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <DemoFrame
              label="Der Tagesverlauf derselben Bahn"
              note="Jeder Punkt ist eine Stunde, gemessen als 90. Perzentil über alle Tage. Eine Stunde wird erst zur Spalte, wenn sie oft genug gemessen wurde; die Randzeiten eines Parktages schaffen das meistens nicht."
            >
              <HourlyShapeDemo peakLabel="Spitze" troughLabel="Abends" unit="Min." />
            </DemoFrame>
            <P>
              Aus dieser Kurve stammt der zweite Teil der Empfehlung: das Tal am Abend. Bei vielen
              Headlinern ist die letzte Stunde vor Schluss genauso gut wie die erste nach der
              Öffnung, nur ohne Wecker.
            </P>
          </div>
        </div>

        <PG>
          Auf der Attraktionskarte selbst taucht das als eine Zeile auf, unter der Wartezeit: die
          voraussichtlich beste Zeit, mit konkreter Uhrzeit in Parkzeit. Für den ganzen Park listet
          die Übersicht die Bahnen, bei denen sich der frühe Start am meisten lohnt, sortiert nach
          gesparten Minuten.
        </PG>
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
          Die größte Ersparnis liegt nicht in der Uhrzeit, sondern im Datum. Zwischen zwei Tagen
          derselben Woche kann eine halbe Stunde Durchschnittswartezeit liegen, und einem
          gewöhnlichen Kalender sieht man das nicht an. Den Unterschied machen Schulferien,
          Feiertage, Brückentage und das Wetter.
        </P>

        <DemoFrame
          label="Vier Tage einer Herbstferienwoche"
          note="Der 15. Oktober ist der ruhigste der vier, obwohl er mitten in den Ferien liegt: Es regnet. Der 19. ist grau, weil der Park an dem Tag zu hat. Auf der Parkseite geht dieser Kalender ein Jahr weit."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        <div className="max-w-3xl space-y-4 pt-2">
          <P>
            Die Ferienkalender kommen aus zwei öffentlichen Quellen und decken jeweils vier Jahre
            ab. Wichtiger als die eigenen sind dabei oft die der Nachbarn: Ein Park nahe der Grenze
            merkt es sofort, wenn im Nachbarland Ferien beginnen. park.fan rechnet Regionen im
            Umkreis von rund 200 Kilometern mit ein und markiert sie im Kalender separat.
          </P>
          <PG>
            Die Farbe eines Tages ist eine Prognose, keine Messung. Sie stammt aus einem Modell, das
            jede Nacht mit den Wartezeiten des Vortags neu trainiert wird und sich hinterher an der
            Realität nachmessen lässt.
          </PG>
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
        id="nachtschicht"
        index="05"
        kicker="Der Unterbau"
        title="Woher die Zahlen kommen"
        icon={Database}
      >
        <P>
          Alle fünf Minuten wird jeder der 212 Parks abgefragt, aus drei öffentlichen Quellen
          gleichzeitig. Widersprechen sie sich, entscheidet die Mehrheit, danach der Median, danach
          der Mittelwert. Gespeichert wird nur, was sich geändert hat, gerundet auf fünf Minuten,
          weil die Parks selbst in Fünf-Minuten-Schritten anschreiben.
        </P>

        <IngredientGrid>
          <IngredientCard icon={Activity} title="Wartezeiten" delay={0}>
            ThemeParks.wiki, Wartezeiten.app und Queue-Times.com, im Fünf-Minuten-Takt. Die
            Rohwährung von allem anderen auf dieser Seite.
          </IngredientCard>
          <IngredientCard icon={GraduationCap} title="Ferien & Feiertage" delay={60}>
            Nager.Date für gesetzliche Feiertage und Brückentage, OpenHolidays für Schulferien. Vier
            Jahre, jede Region einzeln, monatlich aktualisiert.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Wetter" delay={120}>
            Open-Meteo für Vorhersage, Rückschau und den 15-Minuten-Regenradar. Amtliche
            Unwetterwarnungen kommen von DWD und MeteoAlarm.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Öffnungszeiten" delay={0}>
            Aus den Parkkalendern. Wo ein Park keinen veröffentlicht, rekonstruieren wir den Tag aus
            der Aktivität der Bahnen und kennzeichnen ihn als geschätzt.
          </IngredientCard>
          <IngredientCard icon={Layers} title="Historie" delay={60}>
            Nichts wird gelöscht. Ältere Zeiträume werden nur komprimiert, damit jede Auswertung
            weiterhin auf allen Messwerten läuft.
          </IngredientCard>
          <IngredientCard icon={BarChart3} title="Prognosemodelle" delay={120}>
            Drei Modelle nach Zeithorizont getrennt: eines für den laufenden Tag, eines bis 60 Tage,
            eines bis ein Jahr. Jedes wird an den echten Zeiten nachgemessen.
          </IngredientCard>
        </IngredientGrid>

        <div className="max-w-3xl space-y-4 pt-4">
          <P>
            Der zweite Teil passiert nachts, und er ist der eigentliche Grund, warum eine Seite
            typische Wartezeiten nicht einfach so anzeigen kann. Ein Median über jeden gemessenen
            Dienstag ist keine Abfrage, die man beim Seitenaufruf startet. Er muss vorher gerechnet
            worden sein, in einer festen Reihenfolge, weil jeder Schritt auf dem vorigen aufbaut.
          </P>
        </div>

        <NightShift
          jobs={NIGHT_JOBS}
          caption="Alle Zeiten UTC. Die Reihenfolge ist kein Zufall: Die Rope-Drop-Empfehlung um 05:15 liest die Viertelstunden-Historie, die um 04:30 geschrieben wird."
        />
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="luecken"
        index="06"
        kicker="Die Grenzen"
        title="Was wir nicht behaupten"
        icon={HelpCircle}
      >
        <P>
          Eine Datenseite wird nicht dadurch gut, dass jedes Feld gefüllt ist. Sie wird dadurch gut,
          dass man den gefüllten Feldern trauen kann. Drei Fälle, in denen park.fan lieber nichts
          sagt.
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
            note="Über eine Eisbahn im August meldet niemand etwas, weil es nichts zu melden gibt. Diese Stille als „geöffnet“ zu lesen, wäre der bequeme Fehler. Die Bahn zählt an dem Tag auch nicht in den Zähler „12 von 45 geöffnet“ hinein."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Keine Bewertungsgrundlage"
            note="Die letzte Stufe rechts ist gar keine Auslastung. Sie sagt, dass wir für diesen Park noch keine haben: Unter rund 30 Betriebstagen fehlt der Vergleichswert, gegen den gerechnet würde."
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

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="besuche"
        index="07"
        kicker="In der Praxis"
        title="Vier Besuche, vier Wege durch die Seite"
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
                Für jede Bahn die Tabelle aus Kapitel 02 mitlesen. Die Spalte mit den Messtagen sagt
                dir, wie belastbar der Wert ist.
              </>,
              <>
                Während des Besuchs auf den Vergleichs-Badge achten: „viel höher“ heißt heute
                wirklich außergewöhnlich, nicht bloß lang.
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

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell id="wegweiser" index="08" kicker="Wegweiser" title="Wo was steht" icon={Search}>
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
              title: 'Parkseite',
              body: (
                <>
                  Kopfbereich mit Status, Wetter und Auslastung, darunter die Reiter für
                  Attraktionen, Shows, Kalender und Karte.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Attraktionsseite',
              body: (
                <>
                  Verlauf, typische Wartezeiten pro Wochentag, Rope Drop, Layout-Elemente und die
                  Blogbeiträge über die Bahn.
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

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="faq"
        index="09"
        kicker="Nachgefragt"
        title="Häufige Fragen"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
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
