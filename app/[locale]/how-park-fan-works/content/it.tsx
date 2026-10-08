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
const CHAPTERS = HOWTO_CHAPTERS.it;

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Tipico',
  busy: 'Pieno',
  unit: 'min',
  days: 'giorni misurati',
  record: 'Record',
  summary:
    'Taron di {label}: di norma {typical} minuti, {busy} nei giorni pieni, su {days} giorni misurati. All’ingresso ci sono {wait} minuti.',
};

const SCALE_LEGEND = [
  {
    term: 'Tipico',
    def: 'Nella metà dei giorni misurati la fila più lunga è stata più corta di così.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Pieno',
    def: 'Il giorno più pieno su dieci.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Quello che c’è scritto all’ingresso.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minuti il 16 luglio 2026, il giorno misurato con la fila più lunga.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them.
 * Figures from `TARON_TYPICAL_WAITS`, i.e. from the API and not from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Lunedì', typical: 55, busy: 70, sampleDays: 21 },
  { id: 'saturday', label: 'Sabato', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Nei giorni feriali', typical: 60, busy: 75, sampleDays: 107 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Whoever reorders them there reorders
 * them here, or the guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Intestazione',
    body: 'Nome, luogo e distanza, poi stato, orari di oggi, affollamento e quante attrazioni sono aperte in questo momento.',
    example: 'Phantasialand, Brühl. Oggi 09:00–19:00, 36 attrazioni su 40 aperte.',
    demo: <AnatomyHeaderDemo />,
  },
  {
    title: 'Vacanze nel bacino d’utenza',
    body: 'Quali vacanze scolastiche e festività pesano oggi sul parco, a partire da quelle della sua regione.',
    demo: <AnatomyHolidayDemo />,
    onlyWhen: 'oggi incidono vacanze o una festività.',
  },
  {
    title: 'Allerta meteo',
    body: 'Gli avvisi ufficiali di DWD e MeteoAlarm, parola per parola.',
    demo: <WeatherWarningBannerDemo />,
    onlyWhen: 'per la località è in vigore un avviso.',
  },
  {
    title: 'Radar della pioggia',
    body: 'Le prossime ore a quarti d’ora. Così vedi se un rovescio sarà passato tra venti minuti.',
    demo: <NowcastBannerDemo single />,
    onlyWhen: 'piove nelle vicinanze.',
  },
  {
    title: 'Scheda meteo',
    body: 'Il meteo di adesso, l’andamento della giornata e la previsione. Sull’asse, le ore in cui il parco è aperto prendono la maggior parte dello spazio.',
    demo: <WeatherCardShowcase variant="single" />,
  },
  {
    title: 'Prezzi salta-fila',
    body: 'Prezzi giornalieri delle code a pagamento come Lightning Lane, con quelle esaurite segnalate come tali.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'il parco li pubblica, finora solo i parchi Disney negli Stati Uniti.',
  },
  {
    title: 'Attrazioni',
    body: 'Tutte le attrazioni in card come quelle del capitolo 01, con ricerca e raggruppate per area. In cima stanno quelle per cui conviene arrivare presto.',
    example: 'Al Phantasialand lì in cima c’è Taron, con 60 minuti risparmiati.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendario e mappa',
    body: 'Le previsioni giornaliere del capitolo 04 nella griglia del mese e una mappa con tutte le attrazioni.',
    demo: <AnatomyCalendarDemo />,
  },
  {
    title: 'Spettacoli e ristoranti',
    body: 'Orari degli spettacoli per tutta la giornata, ristoranti con orari di apertura.',
    example: 'Al Phantasialand quattro spettacoli e 46 ristoranti.',
    demo: <AnatomyShowsDemo />,
    onlyWhen: 'il parco li comunica.',
  },
  {
    title: 'Giorni migliori',
    body: 'Le date più tranquille dei prossimi tre mesi e il giorno della settimana più tranquillo del parco.',
    demo: <AnatomyBestDaysDemo locale="it" />,
    onlyWhen: 'il parco pubblica un calendario di apertura.',
  },
  {
    title: 'Parchi nelle vicinanze',
    body: 'Cos’altro c’è a portata, con distanza e stato.',
    example:
      'Dal Phantasialand, Toverland e Movie Park Germany, entrambi a 90 chilometri abbondanti.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'a portata c’è un altro parco.',
  },
  {
    title: 'Blog',
    body: 'Articoli in cui compare questo parco.',
    demo: <AnatomyBlogDemo locale="it" />,
    onlyWhen: 'ce ne sono.',
  },
  {
    title: 'Statistiche',
    body: 'Le file più lunghe del parco con il valore tipico e quello pieno, più la distribuzione per mesi e giorni della settimana.',
    demo: (
      <AnatomyStatsDemo
        title="Attrazioni con le code più lunghe"
        labelAttraction="Attrazioni"
        labelMinutes="min"
        labelNow="Adesso"
        labelP50="Tipico"
        labelP90="Picco"
      />
    ),
  },
  {
    title: 'Stagione, informazioni, domande',
    body: 'Periodi di apertura ed eventi, indirizzo e fuso orario, domande frequenti su questo parco.',
    example:
      'La pista di pattinaggio del capitolo 08 compare qui, con la sua stagione da novembre a gennaio.',
    demo: <AnatomySeasonDemo label="Pista di pattinaggio" />,
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Cosa ha di tipico ogni ora',
    body: 'Il valore tipico e quello pieno per ogni attrazione e ogni ora.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Il livello normale di ogni parco',
    body: 'Il valore su cui si misura l’affollamento.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Riassumere ieri',
    body: 'Tutta la giornata precedente a quarti d’ora.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Conviene alzarsi presto?',
    body: 'Per ogni attrazione, quanto fa risparmiare una partenza mattutina e quanto tiene il vantaggio.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Il tipico per giorno della settimana',
    body: 'La tabella del capitolo 02 per ogni attrazione, più il record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'Il modello di previsione si aggiorna',
    body: 'Si allena sui tempi di attesa di ieri.',
  },
];

const FAQ = [
  {
    question: 'Cosa significano «tipico» e «pieno» per un tempo di attesa?',
    answer:
      'Tipico è la mediana dei picchi giornalieri: nella metà dei giorni misurati la fila più lunga è stata più corta. Pieno è il 90° percentile della stessa serie, all’incirca il giorno più pieno su dieci. Il record sta a parte, così che un singolo valore estremo non sposti né l’uno né l’altro.',
  },
  {
    question: 'Settanta minuti di attesa sono tanti?',
    answer:
      'Dipende dall’attrazione e dal giorno della settimana. A Taron, al Phantasialand, di lunedì il picco è di solito di 55 minuti, quindi lì 70 sono tanti. Di sabato 70 minuti sono la mediana, cioè una giornata del tutto normale. Entrambi i valori di confronto stanno su park.fan, sulla pagina dell’attrazione.',
  },
  {
    question: 'Da dove arrivano i tempi di attesa?',
    answer:
      'Da tre fonti pubbliche: ThemeParks.wiki, Wartezeiten.app e Queue-Times.com. Interroghiamo ogni parco ogni cinque minuti, e se le fonti non concordano, decide la maggioranza.',
  },
  {
    question: 'Perché per alcuni parchi c’è scritto «Nessuna previsione»?',
    answer:
      'Un livello di affollamento confronta il parco con il suo stesso passato, e per questo servono circa 30 giorni di apertura. Nei parchi nuovi o aperti di rado non compare quindi nulla, invece di un colore tirato a indovinare.',
  },
  {
    question: 'Perché l’Hansa-Park non mostra tempi di attesa?',
    answer:
      'Il parco mostra i suoi tempi di attesa solo nella propria app e solo sul wi-fi del parco, e un’interfaccia pubblica non esiste. Su park.fan c’è quindi un avviso al posto di 82 attrazioni che sembrano vuote.',
  },
  {
    question: 'Che cos’è il rope drop?',
    answer:
      'Trovarsi a una determinata attrazione all’apertura del parco, prima che i viali si riempiano. park.fan lo consiglia quando il picco dell’attrazione arriva ad almeno 60 minuti e la partenza mattutina ne fa risparmiare almeno 45, e indica per quanto tempo tiene all’incirca il vantaggio.',
  },
  {
    question: 'park.fan costa qualcosa e serve un account?',
    answer:
      'No e no. Tutto su park.fan è gratuito e si usa senza registrazione. Preferiti e piani della giornata restano nel tuo browser.',
  },
  {
    question: 'Ogni quanto si aggiornano i numeri?',
    answer:
      'Una pagina di parco aperta preleva nuovi valori ogni cinque minuti. I tempi di attesa tipici e i consigli rope drop li ricalcoliamo una volta a notte, perché da un giorno all’altro si muovono appena.',
  },
];

/** The guide page's article, Italian. */
export function ContentIT() {
  const glossary = `/${GLOSSARY_SEGMENTS.it}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.it}`;
  const planner = `/${PLANNER_SEGMENTS.it}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Capitoli" />

      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan è nato in una coda. Taron, pomeriggio, il display segnava qualcosa a tre cifre, e
          nessuno in coda sapeva se fosse sfortuna o semplicemente un martedì qualunque.
        </Lead>
        <P>
          Il tempo di attesa attuale è scritto all’ingresso e nell’app del parco. park.fan gli mette
          accanto com’è una giornata normale a quell’attrazione, quando la sua fila si accorcia e in
          quale giorno la visita vale davvero la pena.
        </P>
        <P>
          Le card, i badge e le tabelle più in basso sono i pezzi di park.fan stesso, alimentati con
          numeri d’esempio fissi del Phantasialand. Nel parco hai le stesse card sul telefono, con i
          numeri del giorno.
        </P>

        <Reveal>
          <nav
            aria-label="Capitoli"
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
        id="numero"
        index="01"
        kicker="La card"
        title="Quattro informazioni accanto al tempo di attesa"
        icon={Gauge}
      >
        <P>
          All’ingresso di Taron c’è scritto 70 minuti, ma non se conviene metterti in fila adesso o
          dopo pranzo. Su park.fan, con lo stesso numero, trovi un livello di affollamento, una
          tendenza, la coda single rider e l’altezza minima.
        </P>

        <BareNumberVsCard
          unit="minuti"
          signLabel="Quello che espone il parco"
          signCaption="Un numero, senza confronto."
          cardLabel="Quello che park.fan ne ricava"
          cardCaption="Gli stessi 70 minuti con affollamento, tendenza, tempo single rider, altezza minima e l’indicazione di quando si calma."
        />

        <div className="space-y-4 pt-2">
          <P>
            Il livello di affollamento confronta il numero con quello che è normale per questa
            attrazione. Taron sta in media su {TARON_BASELINE} minuti, {TARON_WAIT_NOW} sono più di
            una volta e mezza tanto, e questo si chiama «Molto alta». La piccola freccia accanto
            indica se la fila sta crescendo o si sta accorciando.
          </P>
          <PG>
            Se un’attrazione ha una coda single rider, sulla card c’è anche il suo tempo di attesa.
            E c’è l’altezza minima, così con un bambino di 130 centimetri non scopri solo davanti al
            misuratore che non ci arriva.
          </PG>
        </div>

        <DemoFrame
          label="Due attrazioni, lo stesso minuto"
          note="Taron e Black Mamba nello stesso istante: una fila cresce, l’altra si accorcia. Sulla pagina del parco tutte le attrazioni stanno così, insieme e raggruppate per area."
          href={PARK}
          hrefLabel="Phantasialand su park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      <Ambience>
        <SectionShell
          id="scala"
          index="02"
          kicker="Il metro"
          title="Tipico, pieno, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="La fila più lunga misurata a Taron"
            note="Il 16 luglio 2026, durante le vacanze estive. È un giorno solo, per questo compare a parte come record e non entra nella scala."
          >
            <P>
              Per capire se 70 minuti sono tanti servono due valori di confronto. Tipico è quanto
              dura di solito la fila più lunga della giornata a questa attrazione, pieno quanto era
              lunga nel dieci per cento di giorni più pieni.
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
                    {i === 0 && 'Per un lunedì, 70 minuti sono tanti'}
                    {i === 1 && 'Per un sabato, 70 minuti sono la norma'}
                    {i === 2 && 'E una volta sono stati 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Di lunedì il picco della giornata è di solito di {step.typical} minuti, e in
                        nove lunedì su dieci resta a {step.busy} o sotto. Chi oggi vede{' '}
                        {TARON_WAIT_NOW} ha beccato uno dei lunedì pieni.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Di sabato {step.typical} minuti sono la mediana. Quel giorno lo stesso
                        numero è del tutto normale, e le attrazioni vicine sono piene allo stesso
                        modo.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Nei giorni feriali il picco sta di solito a {step.typical} minuti. La linea
                        tratteggiata in fondo è il record di {TARON_RECORD} minuti del 16 luglio. Un
                        giorno così falserebbe una media, per questo «pieno» si calcola sul dieci
                        per cento di giorni più pieni invece che sul massimo.
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
              label="Sulla pagina di un’attrazione"
              note="I valori di Taron come li ha forniti l’API il 10 settembre 2026."
              href={TARON}
              hrefLabel="Valori attuali di Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                Sulla pagina di ogni attrazione trovi questa scala per ogni giorno della settimana.
                Il numero sopra la barra è il valore pieno, la parte più intensa sotto è quello
                tipico, e in fondo c’è il record con la data.
              </P>
              <P>
                Il sabato è l’unico giorno in cui i {TARON_WAIT_NOW} minuti di Taron cadono
                esattamente nel mezzo. Il calcolo si basa su {TARON_WEEKDAY_DAYS} giorni misurati
                nei feriali e {TARON_WEEKEND_DAYS} nel fine settimana.
              </P>
            </div>
          </div>

          <DemoFrame
            label="La stessa tabella per tutto il parco, in tempo reale"
            note="La situazione attuale del Phantasialand, con il valore tipico e quello pieno per ogni attrazione."
            href={PARK}
            hrefLabel="Phantasialand su park.fan →"
          >
            <LiveTopAttractions locale="it" />
          </DemoFrame>
        </SectionShell>
      </Ambience>

      <SectionShell
        id="momento"
        index="03"
        kicker="L’orario"
        title="Il momento migliore della giornata"
        icon={Sunrise}
      >
        <P>
          «Arriva presto» serve solo se la fila cresce nel corso della giornata, e non succede a
          ogni attrazione. Sei attrazioni dello stesso parco, ora per ora:
        </P>

        <DemoFrame
          label="Il profilo orario, in diretta"
          note="In diretta dal profilo orario del parco. In grassetto l’ora più affollata di ogni attrazione."
          href={PARK}
          hrefLabel="Phantasialand su park.fan →"
        >
          <LiveHourlyProfile locale="it" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Per Taron l’orario conta pochissimo, perché i valori restano tutto il giorno in una
            banda stretta e a fare la differenza è il giorno della settimana del capitolo 02.
            Chiapas invece si riempie nettamente fino al pomeriggio. Per questo park.fan calcola il
            momento migliore attrazione per attrazione.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Il consiglio che ne nasce"
            note="Viene consigliato solo se l’attrazione arriva nel suo picco ad almeno 60 minuti e la partenza mattutina ne fa risparmiare almeno 45."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              La card riporta il tempo di attesa tipico all’apertura, il picco della giornata,
              quanto risparmi e fino a che ora tiene il vantaggio.
            </PG>
            <P>
              Se il momento più tranquillo di un’attrazione cade altrove, per esempio la sera,
              compare anche quello sulla card. Sulla pagina del parco le attrazioni per cui alzarsi
              presto rende di più sono ordinate per minuti risparmiati.
            </P>
          </div>
        </div>
      </SectionShell>

      <SectionShell
        id="giorno"
        index="04"
        kicker="La data"
        title="Il giorno giusto, mesi prima"
        icon={CalendarDays}
      >
        <P>
          La data decide più dell’orario. Tra due giorni della stessa settimana ci può essere
          mezz’ora di attesa media di differenza, a seconda di vacanze scolastiche, festività, ponti
          e meteo.
        </P>

        <DemoFrame
          label="Quattro giorni delle vacanze autunnali"
          note="Il 15 ottobre è il più tranquillo dei quattro pur cadendo in piena vacanza, perché piove. Il 19 il parco è chiuso. Su park.fan lo stesso calendario va avanti mese per mese."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            Spesso le vacanze dei vicini contano quanto le proprie, perché i visitatori in giornata
            di confini non ne conoscono. Il Phantasialand è a circa 90 chilometri dai Paesi Bassi, e
            nel calendario, oltre alle vacanze della Renania Settentrionale-Vestfalia, ci sono anche
            quelle della provincia della Gheldria. Le regioni in vacanza entro circa 200 chilometri
            ricevono un contrassegno proprio.
          </P>
          <PG>
            Il colore di un giorno è una previsione. Quanto ci prendono le nostre previsioni lo
            ricalcoliamo in pubblico sulla pagina Fancast.
          </PG>
          <P>
            Per un parco aperto tutto l’anno il calendario arriva a circa undici mesi. In un parco
            stagionale si ferma dove finisce la stagione pubblicata, e un giorno in cui il parco è
            chiuso compare come chiuso.
          </P>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href="/fancast"
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Quanto ci prende il modello
          </Link>
          <Link
            href={bestTime}
            prefetch={false}
            className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
            Periodo migliore per ogni parco
          </Link>
        </div>
      </SectionShell>

      <SectionShell
        id="piano-del-giorno"
        index="05"
        kicker="Il pianificatore"
        title="Percorrere la giornata in anticipo"
        icon={CalendarClock}
      >
        <P>
          Nel pianificatore disponi su una linea del tempo le attrazioni che vuoi fare. Ogni blocco
          è alto quanto il tempo di attesa previsto per la sua ora, e tra due blocchi c’è scritto se
          il tempo per spostarti basta.
        </P>
        <P>
          Qui sotto c’è un piano per il Phantasialand di sabato 12 settembre 2026, con la previsione
          del 4 settembre. Trascina un blocco su un altro orario e cambiano la sua altezza e i
          trasferimenti. Il tuo piano resta com’è.
        </P>

        <DemoFrame
          label="Un sabato pianificato"
          href={planner}
          hrefLabel="Al pianificatore →"
          className="mx-auto max-w-[560px]"
        >
          <PlannerDayFigure />
        </DemoFrame>

        <P>
          Cos’altro fa il pianificatore, per esempio segnalare le attrazioni in base all’altezza
          minima o ordinare la giornata con un tasto, lo trovi nella{' '}
          <A href={planner}>pagina del pianificatore</A>.
        </P>
      </SectionShell>

      <SectionShell
        id="pagina-parco"
        index="06"
        kicker="Il giro"
        title="Una pagina di parco dall’alto in basso"
        icon={Layers}
      >
        <P>
          Tutto quello dei primi capitoli sta su una sola pagina per parco, nell’ordine in cui ci si
          fanno le domande: il parco oggi è aperto? Sta per piovere? Quanto è lunga la fila? E
          quando sarebbe stato meglio venire?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Solo se:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              Metà di queste sezioni compare solo quando c’è qualcosa da mostrare. Un parco senza
              spettacoli non riceve una scheda spettacoli vuota.
            </Highlight>
            <PG>
              La scheda scelta finisce nell’indirizzo. Se mandi il link al calendario, chi lo riceve
              apre il calendario e non la lista delle attrazioni.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Guarda il Phantasialand
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      <Ambience tone="emerald">
        <SectionShell
          id="notte"
          index="07"
          kicker="Le fondamenta"
          title="Da dove arrivano i numeri"
          icon={Database}
        >
          <P>
            Ogni cinque minuti interroghiamo ciascuno dei 212 parchi, su tre fonti pubbliche
            insieme. Se non concordano, decide la maggioranza.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Tempi di attesa" delay={0}>
              ThemeParks.wiki, Wartezeiten.app e Queue-Times.com, ogni cinque minuti.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacanze e festività" delay={60}>
              Nager.Date per le festività e i ponti, OpenHolidays per le vacanze scolastiche, ogni
              regione separatamente.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Meteo" delay={120}>
              Open-Meteo per previsione e radar della pioggia, allerte meteo da DWD e MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Orari di apertura" delay={0}>
              Dai calendari dei parchi. Dove un parco non ne pubblica, stimiamo gli orari
              dall’attività delle attrazioni e lo segnaliamo.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Storico" delay={60}>
              Ogni tempo di attesa misurato resta salvato, anche quello di un martedì mattina
              tranquillo.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Modelli di previsione" delay={120}>
              Uno per oggi, uno per le prossime settimane, uno per il resto dell’anno. Ciascuno
              viene verificato sui tempi di attesa effettivi.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              Quanto è lunga la fila di Taron in un martedì tipico lo calcoliamo di notte, mentre i
              parchi sono chiusi. Quando apri la pagina la mattina, il calcolo è già pronto.
            </P>
          </div>

          <NightShift
            locale="it"
            jobs={NIGHT_JOBS}
            caption="Orari in UTC. Ogni passo si basa sul precedente."
          />
        </SectionShell>
      </Ambience>

      <SectionShell
        id="limiti"
        index="08"
        kicker="I limiti"
        title="Quando non lo sappiamo"
        icon={HelpCircle}
      >
        <P>
          In tre casi preferiamo lasciare un campo vuoto piuttosto che tirare a indovinare un
          numero.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Parco senza fonte leggibile"
            note="L’Hansa-Park mostra i suoi tempi di attesa solo nella propria app, sul wi-fi del parco. Senza questo avviso, su park.fan ci sarebbero 82 attrazioni che sembrano vuote."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attrazione fuori stagione"
            note="Su una pista di ghiaccio ad agosto nessuno riporta niente. Per questo compare come fuori stagione e quel giorno non conta tra le attrazioni aperte."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Nessuna base di valutazione"
            note="Con meno di una trentina di giorni di apertura manca il valore di riferimento. Un parco nuovo riceve quindi «Nessuna previsione» invece di un colore."
          >
            <BadgeRowDemo
              crowdLabel="Affollamento: quanto è pieno adesso"
              comparisonLabel="Confronto: più del solito?"
              caption="A 70 minuti Taron segna «Molto alta», e rispetto ai suoi tipici 45 minuti «Molto più alta». In un parco piccolo, dove 25 minuti sono la norma, «Molto alta» può stare insieme a «Tipico»."
            />
          </DemoFrame>
        </div>
      </SectionShell>

      <SectionShell
        id="dove"
        index="09"
        kicker="Orientarsi"
        title="Dove si trova cosa"
        icon={Search}
      >
        <TouchpointGrid
          items={[
            {
              icon: Search,
              title: 'Ricerca',
              body: (
                <>
                  Ctrl + K oppure ⌘ + K su ogni pagina. Trova parchi, attrazioni, spettacoli e
                  ristoranti, anche con errori di battitura.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Posizione',
              body: (
                <>
                  Se la condividi, in home page trovi i parchi vicino a te e, dentro al parco, le
                  attrazioni più vicine con distanza e tempo di attesa.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Preferiti',
              body: (
                <>
                  La stella su ogni card di parco e di attrazione. I preferiti compaiono in home
                  page con il loro tempo di attesa attuale e restano nel browser, senza account.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Altezza',
              body: (
                <>
                  Nella scheda Attrazioni imposti il cursore sull’altezza del bambino più piccolo, e
                  restano solo le attrazioni su cui può salire.
                </>
              ),
            },
            {
              icon: CalendarClock,
              title: 'Pianificatore',
              body: (
                <>
                  Si apre da qualsiasi pagina. Il piano resta nel browser, più dettagli nel capitolo
                  05.
                </>
              ),
            },
            {
              icon: BarChart3,
              title: 'Pagina di attrazione',
              body: (
                <>
                  Andamento, tempi di attesa tipici per giorno della settimana, rope drop, altezza
                  minima e quanto ci prende la previsione per questa attrazione.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Testi più lunghi su parchi e attrazioni, tra cui le{' '}
                  <A href="/blog/category/guides">guide ai parchi</A> con biglietti, ordine di
                  visita e come arrivarci.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Dizionario',
              body: (
                <>
                  <A href={glossary}>Tutti i termini tecnici</A> con spiegazione e attrazioni
                  d’esempio, alcuni con un modello 3D.
                </>
              ),
            },
          ]}
        />
      </SectionShell>

      <SectionShell
        id="faq"
        index="10"
        kicker="Le vostre domande"
        title="Domande frequenti"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="E adesso?"
        title="Continuare a leggere"
        body="park.fan è gratuito, senza account e senza pubblicità. La pagina del parco mostra tutto con i numeri di oggi, Fancast calcola quanto ci hanno preso le previsioni degli ultimi 30 giorni, e il periodo migliore confronta più parchi."
        destinations={[
          {
            href: PARK,
            label: 'Guarda una pagina di parco d’esempio',
            icon: Activity,
            prefetch: false,
          },
          { href: bestTime, label: 'Periodo migliore', icon: CalendarDays, prefetch: false },
          {
            href: '/fancast',
            label: 'Precisione delle previsioni',
            icon: Sparkles,
            prefetch: false,
          },
        ]}
      />
    </>
  );
}
