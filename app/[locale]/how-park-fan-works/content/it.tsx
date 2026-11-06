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
const CHAPTERS = HOWTO_CHAPTERS.it;

const PARK = '/parks/europe/germany/bruehl/phantasialand';
const TARON = `${PARK}/taron`;

const SCALE_LABELS = {
  typical: 'Normale',
  busy: 'Pieno',
  unit: 'min',
  days: 'giorni misurati',
  record: 'Record',
  summary:
    'Taron, {label}: di norma {typical} minuti, {busy} nei giorni pieni, su {days} giorni misurati. All’ingresso ci sono {wait} minuti.',
};

const SCALE_LEGEND = [
  {
    term: 'Normale',
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
 * The sections of a park page in the order they render (`app/[locale]/parks/.../page.tsx`,
 * `ParkPageShell`, `LiveParkData`). Whoever reorders them there reorders them here, or the guide
 * describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Scheda del titolo',
    body: 'Nome e luogo, quanto sei lontano, la stella per i tuoi preferiti, un breve testo sul parco, i suoi link e il pulsante del pianificatore. Dove le misurazioni bastano, sotto c’è anche quali giorni della settimana sono di solito tranquilli e quali pieni.',
  },
  {
    title: 'Prezzi salta-fila',
    body: 'Prezzi giornalieri delle code a pagamento come Lightning Lane, con quelle esaurite segnalate come tali.',
    example:
      'Al Magic Kingdom il 4 novembre 2026: il Multi Pass a 37 dollari, la prenotazione singola per Seven Dwarfs Mine Train esaurita.',
    demo: <AnatomyPurchasesDemo />,
    onlyWhen: 'il parco li pubblica, finora solo i parchi Disney negli Stati Uniti.',
  },
  {
    title: 'Quando sei nel parco',
    body: 'Una bussola mostra in che direzione si trovano le grandi attrazioni. Sotto ci sono le attrazioni dove adesso la fila è più corta che più tardi, e quelle più vicine con distanza e tempo di attesa.',
    onlyWhen: 'sei nel parco e hai condiviso la tua posizione.',
  },
  {
    title: 'Oggi nel parco',
    body: 'Stato e orari, quante attrazioni sono aperte, l’affollamento adesso, la previsione di oggi, l’occupazione, i tempi di attesa delle grandi attrazioni e i prossimi spettacoli. Se è in vigore un’allerta meteo ufficiale di DWD o MeteoAlarm, compare in cima, parola per parola. Nella riga del titolo ci sono la temperatura e un avviso quando arrivano pioggia o un temporale; toccandolo vedi le prossime ore a quarti d’ora. In fondo ci sono le vacanze che pesano oggi sul parco, a partire da quelle della sua regione.',
    example:
      'Il 24 agosto 2026 il Phantasialand era aperto dalle 9 alle 19, e oltre alla Renania Settentrionale-Vestfalia era in vacanza estiva anche la Gheldria.',
    demo: (
      <div className="space-y-3">
        <WeatherWarningBannerDemo />
        <NowcastBannerDemo single />
        <AnatomyHolidayDemo />
      </div>
    ),
  },
  {
    title: 'Le caselle',
    body: 'Sotto «Oggi nel parco» c’è una fila di caselle, quasi tutte con un numero di oggi, come quante attrazioni sono aperte o quando inizia il prossimo spettacolo. Attrazioni, Meteo, Mappa, Spettacoli e Ristoranti aprono la loro scheda sulla stessa pagina; il Calendario tempi di attesa e le Statistiche sono pagine a sé.',
  },
  {
    title: 'Attrazioni',
    body: 'La scheda selezionata all’apertura: tutte le attrazioni in card come quelle del capitolo 01, raggruppate per area o ordinate per tempo di attesa, con ricerca e filtri, per esempio per altezza o solo quelle aperte. In cima stanno quelle per cui conviene arrivare presto. Se un’attrazione ha una stagione, è indicata sulla sua card. Sotto seguono, dove ci sono, le attrazioni chiuse definitivamente e il link alla pagina «Con i bambini».',
    example: 'Al Phantasialand lì in cima c’è Taron.',
    demo: <AnatomyAttractionDemo />,
  },
  {
    title: 'Calendario tempi di attesa',
    body: 'Una pagina a sé per ogni mese: i giorni del capitolo 04 nella griglia del mese, una finestra con i dettagli di ogni giorno e il confronto tra due giorni. In cima ci sono le date più tranquille dei prossimi tre mesi e il giorno della settimana più tranquillo.',
    demo: (
      <div className="space-y-3">
        <AnatomyBestDaysDemo locale="it" />
        <AnatomyCalendarDemo />
      </div>
    ),
  },
  {
    title: 'Meteo, mappa, spettacoli, ristoranti',
    body: 'Altre quattro schede. Il meteo di adesso, l’andamento della giornata e la previsione, con le ore di apertura del parco che prendono la maggior parte dello spazio sull’asse. Una mappa con tutte le attrazioni. Gli spettacoli con i loro orari per tutta la giornata e i ristoranti con il loro stato, entrambi solo se il parco li comunica.',
    example:
      'Il 4 novembre 2026 l’Europa-Park elencava 16 spettacoli e 64 ristoranti. Il Phantasialand quel giorno non aveva spettacoli in programma, e quindi nemmeno la scheda spettacoli.',
    demo: (
      <div className="space-y-3">
        <WeatherCardShowcase variant="single" />
        <AnatomyShowsDemo />
      </div>
    ),
  },
  {
    title: 'Parchi vicini',
    body: 'Fino a tre altri parchi entro 100 chilometri, con distanza e stato.',
    example:
      'Dal Phantasialand, Toverland e Movie Park Germany, entrambi a 90 chilometri abbondanti.',
    demo: <AnatomyNearbyDemo />,
    onlyWhen: 'entro quella distanza ci sono almeno altri due parchi.',
  },
  {
    title: 'Blog',
    body: 'Articoli in cui compare questo parco.',
    demo: <AnatomyBlogDemo locale="it" />,
    onlyWhen: 'ce ne sono.',
  },
  {
    title: 'Statistiche',
    body: 'Le file più lunghe del parco, in media sulle ore di apertura, più i mesi, i giorni della settimana e i giorni misurati più pieni e più tranquilli. La casella «Statistiche» porta a una pagina a sé, che mostra anche una giornata normale ora per ora.',
    demo: <AnatomyStatsDemo />,
  },
  {
    title: 'I prossimi dodici mesi',
    body: 'La previsione giorno per giorno, raggruppata per mesi, con il numero di giorni consigliati. Un mese porta al calendario dei tempi di attesa.',
    onlyWhen: 'per il parco c’è una previsione.',
  },
  {
    title: 'Stagioni ed eventi',
    body: 'Halloween, Natale e altri eventi con le loro date, se sono confermati, annunciati o solo previsti, e quanto costa un biglietto a parte.',
    onlyWhen: 'abbiamo cercato eventi per quel parco.',
  },
  {
    title: 'Informazioni e domande',
    body: 'Indirizzo, telefono, anno di apertura e superficie, per quanto li abbiamo, poi le domande frequenti su questo parco.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Ieri, ora per ora',
    body: 'Per ogni attrazione e ogni ora del giorno prima, quanto si aspettava di solito e quanto nei momenti più pieni.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Il livello normale di ogni parco',
    body: 'Il valore su cui si misura l’affollamento di un parco.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.2,
    title: 'Il modello delle prossime settimane si aggiorna',
    body: 'Aggiunge i tempi di attesa di ieri.',
  },
  {
    hour: 4,
    minute: 0,
    at: 0.34,
    title: 'Il livello normale di ogni attrazione',
    body: 'Il valore su cui si misura il livello di affollamento della card del capitolo 01.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.46,
    title: 'Riassumere ieri',
    body: 'Tutta la giornata precedente a quarti d’ora.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.6,
    title: 'Conviene alzarsi presto?',
    body: 'Per ogni attrazione, quanto fa risparmiare una partenza mattutina e quanto tiene il vantaggio.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.72,
    title: 'Normale e pieno per giorno della settimana',
    body: 'I valori del capitolo 02 per ogni attrazione, più il record.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.86,
    title: 'Il modello del resto dell’anno si aggiorna',
    body: 'Anche lui aggiunge i tempi di attesa di ieri.',
  },
];

const FAQ = [
  {
    question: 'Cosa significano «normale» e «pieno» per un tempo di attesa?',
    answer:
      'Normale è la mediana dei picchi giornalieri: nella metà dei giorni misurati la fila più lunga è stata più corta. Pieno è il 90° percentile della stessa serie, all’incirca il giorno più pieno su dieci. Il record sta accanto. Siccome entrambi i valori sono percentili, un singolo valore estremo li sposta appena.',
  },
  {
    question: 'Settanta minuti di attesa sono tanti?',
    answer:
      'Dipende dall’attrazione e dal giorno della settimana. A Taron, al Phantasialand, di lunedì il picco è di solito di 55 minuti, quindi lì 70 sono tanti. Di sabato 70 minuti sono la mediana, cioè una giornata del tutto normale. Entrambi i valori di confronto stanno su park.fan, sulla pagina dell’attrazione.',
  },
  {
    question: 'Da dove arrivano i tempi di attesa?',
    answer:
      'Da un massimo di tre fonti pubbliche. ThemeParks.wiki è la fonte di base; Queue-Times.com e Wartezeiten.app aggiungono le attrazioni che lì mancano e correggono un «chiuso» non più aggiornato. Preleviamo nuovi valori ogni cinque minuti.',
  },
  {
    question: 'Perché per alcuni parchi c’è scritto «Nessuna previsione»?',
    answer:
      'Un livello di affollamento confronta il parco con il suo stesso passato, e per questo servono circa 30 giorni di apertura. Nei parchi nuovi o aperti di rado non compare quindi nulla, invece di un colore tirato a indovinare.',
  },
  {
    question: 'Perché l’Hansa-Park non mostra tempi di attesa?',
    answer:
      'Il parco mostra i suoi tempi di attesa solo nella propria app e solo sul wi-fi del parco, e un’interfaccia pubblica non esiste. Su park.fan, sopra l’elenco delle attrazioni, c’è quindi un avviso che spiega perché lì non ci sono tempi.',
  },
  {
    question: 'Che cos’è il rope drop?',
    answer:
      'Trovarsi a una determinata attrazione all’apertura del parco, prima che i viali si riempiano. park.fan lo consiglia quando il picco dell’attrazione arriva ad almeno 60 minuti e la partenza mattutina ne fa risparmiare almeno 45, e indica per quanto tempo tiene all’incirca il vantaggio.',
  },
  {
    question: 'park.fan costa qualcosa e serve un account?',
    answer:
      'No e no. Tutto su park.fan è gratuito e si usa senza registrazione. Preferiti e piani della giornata restano nel tuo browser. Solo se condividi un piano o chiedi notifiche su di esso, lo salviamo anche da noi.',
  },
  {
    question: 'Ogni quanto si aggiornano i numeri?',
    answer:
      'Una pagina di parco aperta preleva nuovi valori ogni cinque minuti. I valori per giorno della settimana e i consigli rope drop li ricalcoliamo una volta a notte, perché da un giorno all’altro si muovono appena.',
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
          Le card, i badge e le tabelle più in basso sono i pezzi di park.fan stesso. La maggior
          parte mostra numeri d’esempio fissi, così come l’API li ha forniti nell’estate e
          nell’autunno 2026, quasi tutti del Phantasialand; due tabelle sono in tempo reale. Nel
          parco hai le stesse card sul telefono, con i numeri del giorno.
        </P>

        <Reveal>
          <ChapterList chapters={CHAPTERS} ariaLabel="Capitoli" />
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
            Il livello di affollamento confronta il numero con il livello normale di questa
            attrazione, la mediana dei suoi tempi di attesa misurati. Per Taron a settembre era di{' '}
            {TARON_BASELINE} minuti, {TARON_WAIT_NOW} sono più di una volta e mezza tanto, e questo
            si chiama «Molto alta». La piccola freccia accanto indica se la fila sta crescendo o si
            sta accorciando.
          </P>
          <PG>
            Se un’attrazione ha una coda single rider, sulla card c’è anche il suo tempo di attesa.
            E c’è l’altezza minima, così con un bambino di 120 centimetri non scopri solo davanti al
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
          title="Normale, pieno, record"
          icon={Ruler}
        >
          <IntroWithAside
            value={`${TARON_RECORD} min`}
            label="La fila più lunga misurata a Taron"
            note="Il 16 luglio 2026. In Renania Settentrionale-Vestfalia c’era ancora scuola, nelle regioni vicine erano già iniziate le vacanze estive. È un giorno solo: compare accanto come record e sposta appena la scala."
          >
            <P>
              Per capire se 70 minuti sono tanti servono due valori di confronto. Normale è quanto
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
                    {i === 1 && 'Di sabato, 70 minuti sono normali'}
                    {i === 2 && 'E una volta furono 135'}
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
                        Di sabato {step.typical} minuti sono la mediana: in metà dei sabati la fila
                        più lunga è rimasta sotto. Quel giorno lo stesso numero è del tutto normale.
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
                normale, e in fondo c’è il record con la data.
              </P>
              <P>
                Il sabato è l’unico giorno in cui i {TARON_WAIT_NOW} minuti di Taron cadono
                esattamente nel mezzo. Il calcolo si basa su {TARON_WEEKDAY_DAYS} giorni misurati
                nei feriali e {TARON_WEEKEND_DAYS} nel fine settimana.
              </P>
            </div>
          </div>

          <DemoFrame
            label="Tutto il parco, in tempo reale"
            note="Le file più lunghe del Phantasialand, così come compaiono adesso sulla pagina del parco. Questa tabella è calcolata in un altro modo rispetto alla pagina di un’attrazione: fa la media su tutte le ore di apertura degli ultimi due anni. «Tipico» è quanto si aspetta di solito nell’arco di un’ora, «Picco» quanto nei minuti più pieni di quell’ora. Per questo i suoi numeri restano sotto i picchi giornalieri della scala qui sopra."
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
          label="Una settimana di vacanze autunnali"
          note="Quattro giorni misurati al Phantasialand, tutti durante le vacanze autunnali 2026 della Renania Settentrionale-Vestfalia: martedì 20 ottobre in media 45 minuti alle grandi attrazioni, la domenica successiva 20. Le stesse vacanze, quattro livelli diversi. Su park.fan lo stesso calendario va avanti mese per mese."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page: two prose
            columns would put a third text edge under the paragraph above. */}
        <div className="space-y-4 pt-2">
          <P>
            Spesso le vacanze dei vicini contano quanto le proprie, perché i visitatori in giornata
            di confini non ne conoscono. Il Phantasialand è a circa 60 chilometri dai Paesi Bassi, e
            nel calendario, oltre alle vacanze della Renania Settentrionale-Vestfalia, ci sono anche
            quelle delle province del Limburgo e della Gheldria. Le vacanze delle regioni vicine che
            abbiamo registrato per un parco ricevono un contrassegno proprio.
          </P>
          <PG>
            Il colore di un giorno futuro è una previsione, quello di un giorno passato è misurato.
            Quanto ci prendono le nostre previsioni lo ricalcoliamo in pubblico sulla pagina
            Fancast.
          </PG>
          <P>
            Se un parco pubblica i suoi orari, il calendario arriva fin dove arrivano loro, al
            massimo un anno, e un giorno in cui il parco è chiuso compare come chiuso. Per avere un
            quadro d’insieme, la pagina del parco riassume la previsione mese per mese sotto «I
            prossimi dodici mesi».
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
              spettacoli non riceve né la casella spettacoli né una scheda spettacoli vuota.
            </Highlight>
            <PG>
              La scheda scelta finisce nell’indirizzo. Se mandi il link alla mappa, chi lo riceve
              apre la mappa e non la lista delle attrazioni. Il calendario e le statistiche sono
              pagine con un indirizzo proprio.
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
            Ogni cinque minuti preleviamo nuovi tempi di attesa per ciascuno degli oltre 200 parchi,
            da un massimo di tre fonti pubbliche. ThemeParks.wiki è la fonte di base.
            Queue-Times.com e Wartezeiten.app aggiungono le attrazioni che lì mancano e correggono
            un «chiuso» non più aggiornato. Per alcuni parchi una delle due è l’unica fonte.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Tempi di attesa" delay={0}>
              ThemeParks.wiki come base, Queue-Times.com e Wartezeiten.app per ciò che lì manca.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacanze e festività" delay={60}>
              Regione per regione: in Europa da Nager.Date e OpenHolidays, altrove dai calendari
              delle autorità e dei distretti scolastici.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Meteo" delay={120}>
              Open-Meteo per la previsione e una previsione della pioggia a breve termine a quarti
              d’ora, allerte meteo da DWD e MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Orari di apertura" delay={0}>
              Dai calendari dei parchi. Dove un parco non ne pubblica, ricaviamo gli orari di oggi e
              dei giorni precedenti dall’attività delle attrazioni e segnaliamo che sono stimati.
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
              Quanto è lunga la fila di Taron in un martedì normale lo calcoliamo di notte, mentre i
              parchi in Europa sono chiusi. Quando apri la pagina la mattina, il calcolo è già
              pronto.
            </P>
          </div>

          <NightShift
            locale="it"
            jobs={NIGHT_JOBS}
            caption="Orari in UTC. L’ordine fa sì che ogni passo trovi già i numeri di cui ha bisogno. Il modello di oggi si aggiorna solo alle 08:30."
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
            note="L’Hansa-Park mostra i suoi tempi di attesa solo nella propria app, sul wi-fi del parco. Sopra le sue circa 80 attrazioni c’è quindi questo avviso, che spiega perché lì non ci sono tempi."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attrazione fuori stagione"
            note="Su una pista di ghiaccio ad agosto nessuno riporta niente. Siccome conosciamo la sua stagione, da novembre a gennaio, in quel periodo compare come fuori stagione e non conta tra le attrazioni aperte."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Nessuna base di valutazione"
            note="Con meno di una trentina di giorni di apertura manca il valore di riferimento. Un parco nuovo riceve quindi «Nessuna previsione» invece di un colore."
          >
            <BadgeRowDemo
              crowdLabel="I livelli"
              caption={`Ogni livello si misura sul passato dell’attrazione o del parco stesso, mai su altri parchi. A 70 minuti Taron segna «Molto alta» perché a settembre il suo livello normale era di ${TARON_BASELINE}.`}
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
                  Il tasto / su ogni pagina o il campo di ricerca in alto. Trova parchi, attrazioni,
                  spettacoli, ristoranti e luoghi, anche con errori di battitura.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Posizione',
              body: (
                <>
                  Se la condividi, in home page trovi i parchi vicino a te. Dentro al parco una
                  bussola indica dove stanno le grandi attrazioni, con quelle più vicine, la loro
                  distanza e il tempo di attesa.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Preferiti',
              body: (
                <>
                  La stella su parchi, attrazioni, spettacoli e ristoranti. I preferiti compaiono
                  con il loro tempo di attesa attuale in home page e in{' '}
                  <A href="/favorites">I miei preferiti</A>, salvati nel browser, senza account.
                </>
              ),
            },
            {
              icon: Bell,
              title: 'Avvisi',
              body: (
                <>
                  La campanella su un’attrazione o uno spettacolo ti manda una notifica quando
                  l’attesa scende sotto la tua soglia, l’attrazione riapre o lo spettacolo sta per
                  iniziare. Li trovi tutti in <A href="/alerts">I miei avvisi</A>.
                </>
              ),
            },
            {
              icon: Ruler,
              title: 'Altezza',
              body: (
                <>
                  Nella scheda Attrazioni imposti il cursore sull’altezza del bambino più piccolo, e
                  restano solo le attrazioni su cui può salire. La pagina «Con i bambini» di un
                  parco ha lo stesso cursore.
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
                  Andamento, attesa normale e piena per giorno della settimana, rope drop, altezza
                  minima e quanto ci prende la previsione per questa attrazione.
                </>
              ),
            },
            {
              icon: Scale,
              title: 'Confrontare i parchi',
              body: (
                <>
                  <A href="/compare">Confrontare i parchi</A> mette da due a quattro parchi uno
                  accanto all’altro, con l’attesa media, la fila più lunga e il giorno della
                  settimana più tranquillo.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog e notizie',
              body: (
                <>
                  Testi più lunghi su parchi e attrazioni, tra cui le{' '}
                  <A href="/blog/category/guides">guide ai parchi</A> con biglietti, ordine di
                  visita e come arrivarci. Nelle <A href="/news">Notizie</A> ci sono brevi
                  aggiornamenti dai parchi.
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
        id="parky"
        index="10"
        kicker="L’assistente"
        title="Chiedi a Parky"
        icon={MessageCircle}
      >
        <ParkyShot locale="it">
          <P>
            Parky è l’assistente in chat di park.fan e abita nel pulsante rotondo in basso a destra.
            In home page, su uno schermo largo, sta proprio sotto il titolo e salta nel suo angolo
            solo quando scorri la pagina.
          </P>
          <P>
            Chiedigli quanto sono lunghe adesso le file, cosa è previsto per oggi o per le prossime
            settimane, in quali giorni le file di un parco sono corte, quanto è alto e veloce un
            ottovolante o cosa raccontano i nostri articoli. Per ogni risposta guarda negli stessi
            dati che vedi sulle pagine.
          </P>
          <P>
            Parchi e attrazioni te li mostra come card con i loro numeri. Se glielo chiedi, ti porta
            alla pagina giusta e prepara una giornata nel pianificatore, aggiunge attrazioni o le
            ordina. Vede la tua posizione solo se nella chat tocchi «Condividi posizione», e non la
            conserva.
          </P>
          <P>
            Le risposte le scrive un modello linguistico, che a volte sbaglia. I numeri sulle card
            della chat arrivano direttamente da park.fan; se hai dubbi su quello che Parky ne dice,
            controlla sulla pagina dell’attrazione. Resta su parchi e attrazioni, non cerca su
            internet, e dopo tre domande in 30 secondi ha bisogno di una breve pausa.
          </P>
          <P>
            Salviamo le tue domande senza indirizzo IP e le cancelliamo dopo 7 giorni. Su Parky
            trovi di più, con domande d’esempio, nella <A href="/parky">sua pagina</A>.
          </P>
        </ParkyShot>
      </SectionShell>

      <SectionShell
        id="faq"
        index="11"
        kicker="Le vostre domande"
        title="Domande frequenti"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <LandingNextSteps
        kicker="E adesso?"
        title="Continuare a leggere"
        body="park.fan è gratuito, senza account e senza pubblicità. La pagina del parco mostra tutto con i numeri di oggi, Fancast calcola quanto ci hanno preso le previsioni degli ultimi sette giorni, e il periodo migliore confronta più parchi."
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
