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
 * highlighting.
 */
const CHAPTERS: Chapter[] = [
  { id: 'numero', index: '01', label: 'Un numero da solo' },
  { id: 'scala', index: '02', label: 'Tipico, pieno, record' },
  { id: 'momento', index: '03', label: 'Il momento migliore' },
  { id: 'giorno', index: '04', label: 'Il giorno giusto' },
  { id: 'pagina-parco', index: '05', label: 'Una pagina di parco dall’alto in basso' },
  { id: 'notte', index: '06', label: 'Da dove arrivano i numeri' },
  { id: 'limiti', index: '07', label: 'Quando non lo sappiamo' },
  { id: 'visite', index: '08', label: 'Quattro visite' },
  { id: 'dove', index: '09', label: 'Dove si trova cosa' },
  { id: 'faq', index: '10', label: 'Domande frequenti' },
];

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
    def: 'Mediana dei picchi giornalieri. Nella metà dei giorni misurati la fila più lunga è stata più corta di così.',
    swatch: 'bg-primary/45',
  },
  {
    term: 'Pieno',
    def: '90° percentile della stessa serie. Quel giorno su dieci in cui c’era davvero folla.',
    swatch: 'bg-primary/25',
  },
  {
    term: '70 min',
    def: 'Quello che c’è scritto all’ingresso. Resta fermo mentre la scala sotto si sposta.',
    swatch: 'bg-amber-500',
  },
  {
    term: 'Record',
    def: `${TARON_RECORD} minuti il 16 luglio 2026. Il giorno peggiore del periodo misurato, ed è proprio per questo che non fa da metro.`,
    swatch: 'bg-foreground/40',
  },
];

/**
 * The three readings, in the order the figure steps through them. Numbers come
 * from `TARON_TYPICAL_WAITS`, so from the API rather than from the story.
 */
const SCALE_STEPS: WaitScaleStep[] = [
  { id: 'monday', label: 'Lunedì', typical: 55, busy: 65, sampleDays: 19 },
  { id: 'saturday', label: 'Sabato', typical: 70, busy: 85, sampleDays: 20 },
  { id: 'weekday', label: 'Nei giorni feriali', typical: 60, busy: 80, sampleDays: 97 },
];

/**
 * The sections of a park page in exactly the order they render
 * (`app/[locale]/parks/.../page.tsx`). Reorder them here and you reorder them
 * there too, or this guide describes a page that does not exist.
 */
const PARK_SECTIONS: AnatomyStep[] = [
  {
    title: 'Intestazione',
    body: 'Nome, luogo, distanza da dove sei, più stato, orari di oggi, l’affollamento di adesso e il contatore «x su y aperte».',
    example: 'Phantasialand, Brühl. Oggi 09:00–19:00, 36 attrazioni su 40 aperte.',
  },
  {
    title: 'Vacanze nel bacino d’utenza',
    body: 'Quali vacanze scolastiche pesano oggi su questo parco, con la relativa regione. Anche quelle oltre confine.',
    example:
      'Oggi per il Phantasialand non conta la Renania Settentrionale-Vestfalia ma la Gheldria: lì sono vacanze scolastiche, e il confine è a 90 chilometri.',
    onlyWhen: 'oggi c’è davvero una regione in vacanza che incide.',
  },
  {
    title: 'Allerta meteo',
    body: 'Avvisi ufficiali di DWD e MeteoAlarm, ripresi senza modifiche. Nessun giudizio nostro sul tempo.',
    example: 'Il testo del DWD, invariato. Per i parchi fuori dalla Germania quello di MeteoAlarm.',
    onlyWhen: 'è attivo un avviso per la località.',
  },
  {
    title: 'Radar della pioggia',
    body: 'Le prossime ore a quarti d’ora. Dice se il rovescio sarà passato tra venti minuti o se resterà tutto il pomeriggio.',
    example:
      'Quarti d’ora invece di ore: un rovescio dalle 14:15 alle 14:30 sparisce dentro un valore orario; qui c’è.',
    onlyWhen: 'ci sono precipitazioni nel raggio.',
  },
  {
    title: 'Scheda meteo',
    body: 'Valore attuale, andamento della giornata e previsione. L’asse orario è costruito attorno agli orari di apertura: le ore in cui il parco è aperto ricevono quattro volte lo spazio di quelle prima e dopo.',
    example:
      'Per il Phantasialand oggi: le ore dalle 09:00 alle 19:00 prendono tre quarti della larghezza, la notte prima e dopo il resto.',
  },
  {
    title: 'Prezzi salta-fila',
    body: 'Prezzi giornalieri delle code a pagamento, esaurito incluso.',
    example:
      'Lightning Lane nei parchi Disney, un prezzo del giorno per attrazione, esaurito segnalato come tale.',
    onlyWhen:
      'il parco li pubblica nel proprio calendario. Finora solo i parchi Disney negli Stati Uniti.',
  },
  {
    title: 'Attrazioni',
    body: 'La prima scheda, con il numero di attrazioni nel titolo. Card come quelle del capitolo 01, con ricerca e raggruppate per area. In cima il riepilogo rope drop del parco, ordinato per minuti risparmiati.',
    example:
      'Taron a Klugheim, da 140 centimetri — la card del capitolo 01. Sopra la lista rope drop, guidata da Chiapas con 75 minuti risparmiati.',
  },
  {
    title: 'Calendario e mappa',
    body: 'Due schede fisse accanto: le previsioni giornaliere del capitolo 04 e una mappa con le attrazioni come marcatori.',
    example: 'I quattro giorni del capitolo 04, nella griglia del mese accanto ai giorni vicini.',
  },
  {
    title: 'Spettacoli e ristoranti',
    body: 'Orari degli spettacoli per tutta la giornata, ristorazione con orari di apertura.',
    example: 'Il Phantasialand offre quattro spettacoli e 46 ristoranti, entrambi con orari.',
    onlyWhen: 'il parco li fornisce. Altrimenti la scheda non compare affatto.',
  },
  {
    title: 'Giorni migliori',
    body: 'Le date più tranquille dei prossimi tre mesi, più il giorno della settimana più tranquillo del parco.',
    example:
      'Il giorno della settimana più tranquillo del parco e le prossime date tranquille — lo stesso calcolo del capitolo 04, su tre mesi.',
    onlyWhen: 'il parco pubblica un calendario di apertura.',
  },
  {
    title: 'Parchi nelle vicinanze',
    body: 'Cos’altro c’è a portata, con distanza e stato attuale.',
    example: 'Dal Phantasialand: Toverland e Movie Park Germany, entrambi a un buon 90 chilometri.',
    onlyWhen: 'ci sono vicini. Per circa metà dei 212 parchi non ce ne sono.',
  },
  {
    title: 'Blog',
    body: 'Articoli del blog di park.fan in cui compare questo parco.',
    example:
      'La pagina del Phantasialand porta, tra gli altri, l’articolo che accompagna questa pagina.',
    onlyWhen: 'ce ne sono.',
  },
  {
    title: 'Statistiche',
    body: 'Le file più lunghe del parco con il valore tipico e quello pieno, più la distribuzione per mesi e giorni della settimana. La sezione indica su quanti giorni registrati si basa, ed entrambe le distribuzioni lo portano come colonna a sé.',
    example:
      'La classifica del capitolo 02, più i mesi e i giorni della settimana con il loro numero di giorni misurati.',
  },
  {
    title: 'Stagione, informazioni, domande',
    body: 'Periodi di apertura ed eventi annunciati, indirizzo e fuso orario, e le domande frequenti su questo parco in particolare.',
    example: 'La pista di pattinaggio del capitolo 07 sta qui con novembre-gennaio.',
  },
];

const NIGHT_JOBS: NightShiftJob[] = [
  {
    hour: 2,
    minute: 0,
    at: 0.04,
    title: 'Cosa ha di tipico ogni ora',
    body: 'Per ogni attrazione e ogni ora, il valore tipico e quello pieno. Le ore con meno di tre misurazioni cadono.',
  },
  {
    hour: 3,
    minute: 0,
    at: 0.22,
    title: 'Il livello normale di ogni parco',
    body: 'La mediana contro cui viene calcolato l’affollamento di adesso. Senza, 70 minuti è solo un numero.',
  },
  {
    hour: 4,
    minute: 30,
    at: 0.42,
    title: 'Riassumere ieri',
    body: 'Tutta la giornata precedente viene condensata in quarti d’ora. Niente che richieda l’andamento di una giornata può girare prima.',
  },
  {
    hour: 5,
    minute: 15,
    at: 0.56,
    title: 'Conviene alzarsi presto?',
    body: 'Per ogni attrazione: quanto fa risparmiare la partenza mattutina, quanto tiene il vantaggio, quando cade il momento più tranquillo.',
  },
  {
    hour: 5,
    minute: 30,
    at: 0.67,
    title: 'Il tipico per giorno della settimana',
    body: 'La tabella del capitolo 02, ricalcolata per ogni attrazione, più il giorno record con la data.',
  },
  {
    hour: 6,
    minute: 0,
    at: 0.8,
    title: 'Il modello di previsione si aggiorna',
    body: 'Si allena sui tempi di attesa di ieri. Una volta per intero, ogni mattina.',
  },
];

const FAQ = [
  {
    question: 'Cosa significano «tipico» e «pieno» per un tempo di attesa?',
    answer:
      'Tipico è la mediana dei picchi giornalieri: nella metà dei giorni misurati la fila più lunga è stata più corta, nell’altra metà più lunga. Pieno è il 90° percentile della stessa serie, all’incirca quel giorno su dieci in cui c’era davvero folla. Il record assoluto sta a parte, così che un singolo valore estremo non sposti né l’uno né l’altro.',
  },
  {
    question: 'Settanta minuti di attesa sono tanti?',
    answer:
      'Dipende dall’attrazione e dal giorno della settimana. Taron, al Phantasialand, di lunedì arriva tipicamente a 55 minuti e in nove lunedì su dieci resta sotto i 65; lì 70 minuti sono una giornata insolitamente piena. Di sabato la mediana della stessa attrazione è esattamente 70 minuti, e allora lo stesso numero è del tutto nella media. Entrambi i valori di confronto stanno su park.fan, sulla pagina dell’attrazione, così non serve indovinarli.',
  },
  {
    question: 'Da dove arrivano i tempi di attesa?',
    answer:
      'Da tre fonti pubbliche insieme: ThemeParks.wiki, Wartezeiten.app e Queue-Times.com. Ogni parco viene interrogato ogni cinque minuti. Se due fonti danno numeri diversi decide la maggioranza, poi la mediana, poi la media. Il risultato viene arrotondato a cinque minuti, perché i parchi stessi espongono a passi di cinque minuti.',
  },
  {
    question: 'Perché per alcuni parchi c’è scritto «Nessuna previsione»?',
    answer:
      'Perché manca la base. Un livello di affollamento nasce dal confronto con il passato del parco stesso, e per questo servono circa 30 giorni di apertura. Nei parchi nuovi o aperti di rado non compare nulla, invece di un colore tirato a indovinare.',
  },
  {
    question: 'Perché Hansa-Park non mostra tempi di attesa?',
    answer:
      'Il parco pubblica i suoi tempi di attesa solo nella propria app e soltanto per i dispositivi collegati al wi-fi del parco. Non esiste alcuna interfaccia pubblica da cui potremmo leggerli. Poiché nei dati un parco senza fonte è indistinguibile da un parco chiuso di notte, questa è una voce curata a mano e non una deduzione: l’avviso su park.fan lo dice, invece di mostrare 82 attrazioni apparentemente vuote.',
  },
  {
    question: 'Che cos’è il rope drop?',
    answer:
      'Trovarsi a una determinata attrazione all’apertura del parco, prima che i viali si riempiano. park.fan lo consiglia solo quando valgono due condizioni: il picco giornaliero dell’attrazione è di almeno 60 minuti e la partenza mattutina ne fa risparmiare almeno 45. Viene sempre indicato quanto dura all’incirca il vantaggio.',
  },
  {
    question: 'park.fan costa qualcosa e serve un account?',
    answer:
      'No e no. Tutti i tempi di attesa, le statistiche, i calendari e le previsioni sono gratuiti e utilizzabili senza registrazione. I preferiti stanno come cookie nel browser, non su un server.',
  },
  {
    question: 'Ogni quanto si aggiornano i numeri sulla pagina?',
    answer:
      'Una pagina di parco aperta su park.fan preleva nuovi valori ogni cinque minuti, allo stesso ritmo con cui vengono interrogate le fonti. I valori statistici come i tempi di attesa tipici o i consigli rope drop vengono ricalcolati una volta a notte, perché da un giorno all’altro si muovono comunque appena.',
  },
];

export function ContentIT() {
  const glossary = `/${GLOSSARY_SEGMENTS.it}`;
  const bestTime = `/${BEST_TIME_SEGMENTS.it}`;

  return (
    <>
      <ChapterRail chapters={CHAPTERS} ariaLabel="Capitoli" />

      {/* ── Intro ───────────────────────────────────────────────────────── */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          park.fan è nato in una coda. Taron, pomeriggio, il display segnava qualcosa a tre cifre, e
          nessuno sapeva dire se fosse sfortuna o semplicemente martedì.
        </Lead>
        <P>
          È ancora quella domanda a stare al centro del sito. Mostrare un tempo di attesa attuale è
          la parte facile: la maggior parte dei parchi lo pubblica da sé, all’ingresso e nella
          propria app, che spesso funziona solo sul wi-fi del parco. Diventa interessante solo
          quando accanto c’è scritto com’è una giornata normale a quell’attrazione, quando la fila
          di solito si accorcia e se oggi sia perfino un buon giorno.
        </P>
        <P>
          Su questa pagina non c’è nessuno screenshot. Ogni card, ogni badge e ogni tabella qui
          sotto sono pezzi veri di park.fan, qui solo riempiti con numeri d’esempio fissi. Le stesse
          card ti staranno davanti un’ora dopo, nel parco.
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

      {/* ── 01 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="numero"
        index="01"
        kicker="Il punto di partenza"
        title="Un numero da solo non dice niente"
        icon={Gauge}
      >
        <P>
          All’ingresso di Taron campeggiano 70 minuti, nient’altro. La coda si accalca già dalla
          prima scalinata. Sul telefono compare lo stesso numero. Nessuno dei due ti dice se
          conviene mettersi in coda adesso o più tardi nella giornata. Su park.fan lo accompagnano
          altre quattro informazioni: un livello di affollamento, una tendenza, la seconda coda e
          l’altezza minima.
        </P>

        <BareNumberVsCard
          unit="minuti"
          signLabel="Quello che espone il parco"
          signCaption="Un numero, senza riferimento. Se oggi sia buono o cattivo lo sa solo chi è già stato qui abbastanza volte."
          cardLabel="Quello che park.fan ne ricava"
          cardCaption="Gli stessi 70 minuti, più livello di affollamento, tendenza, tempo single rider, altezza minima e l’indicazione di quando è prevedibile che si calmi."
        />

        <div className="space-y-4 pt-2">
          <P>
            «Molto alta» qui non è una questione di gusti. Taron sta in media su {TARON_BASELINE}{' '}
            minuti, {TARON_WAIT_NOW} ne sono circa il 156 per cento, e i livelli cambiano al 60, 89,
            110, 150 e 200 per cento. Da 150 in su si chiama «Molto alta». La piccola freccia
            accanto viene dalle ultime rilevazioni e dice se la fila sta crescendo o smaltendo.
          </P>
          <PG>
            Il secondo valore sulla card è la coda single rider. Molte attrazioni gestiscono più
            code in parallelo, e quale di queste esista all’ingresso non si scopre quasi mai.
            Accanto l’altezza minima, così nessuno attraversa mezzo parco con un bambino di 130
            centimetri.
          </PG>
        </div>

        <DemoFrame
          label="Due attrazioni, lo stesso minuto"
          note="Le due card vengono dallo stesso istante nello stesso parco, Taron a Klugheim e Black Mamba a Deep in Africa. Una fila cresce, l’altra smaltisce. Qui su park.fan tutte le attrazioni del parco stanno così, una accanto all’altra e raggruppate per area."
          href={PARK}
          hrefLabel="Phantasialand su park.fan →"
        >
          <TwoRidesDemo />
        </DemoFrame>
      </SectionShell>

      {/* ── 02 ──────────────────────────────────────────────────────────── */}
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
            note="Il 16 luglio 2026, durante le vacanze estive. Un solo giorno su 365, ed è per questo che la scala ragiona per percentili invece che sul massimo."
          >
            <P>
              Per collocare un numero servono due valori di confronto e l’indicazione di cosa si
              basano. park.fan usa per questo la mediana dei picchi giornalieri e il 90° percentile
              della stessa serie. In chiaro: quanto è lunga di solito la fila più lunga della
              giornata, e quanto lo era nel dieci per cento di giorni più pieni.
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
                    {i === 1 && 'Per un sabato è esattamente la norma'}
                    {i === 2 && 'E una volta sono stati 135'}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {i === 0 && (
                      <>
                        Di lunedì il picco della giornata è di {step.typical} minuti, e in nove
                        lunedì su dieci resta sotto i {step.busy}. I {TARON_WAIT_NOW} esposti stanno
                        sopra. Chi si trova qui ha beccato il lunedì più pieno da settimane, e le
                        attrazioni accanto sono di solito l’idea migliore.
                      </>
                    )}
                    {i === 1 && (
                      <>
                        Di sabato {step.typical} minuti sono la mediana. Stesso numero, stesso
                        posto, stessa attrazione: in questa giornata è semplicemente nella media.
                        Arrabbiarsi non serve, cambiare programma nemmeno, perché le attrazioni
                        accanto hanno lo stesso sabato.
                      </>
                    )}
                    {i === 2 && (
                      <>
                        Su tutti i {step.sampleDays} giorni feriali misurati il picco sta a{' '}
                        {step.typical} minuti. La linea tratteggiata più a destra è la giornata da{' '}
                        {TARON_RECORD} minuti del 16 luglio. È proprio per giornate così che «pieno»
                        è un percentile e non un massimo: un solo valore estremo sposterebbe una
                        media e renderebbe inutilizzabile tutto quello che sta sotto.
                      </>
                    )}
                  </p>

                  {/* Below lg every step carries its own scale: there is no
                    running figure there for anything to change on. */}
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
              label="Sulla pagina di un’attrazione"
              note="Valori reali di Taron, rilevati il 24 agosto 2026."
              href={TARON}
              hrefLabel="Valori reali per Taron →"
            >
              <TypicalWaitsDemo />
            </DemoFrame>

            <div className="space-y-4">
              <P>
                La stessa distribuzione in barre, giorno della settimana per giorno della settimana.
                Il numero sopra ogni barra è la soglia «pieno» di quel giorno, la parte piena sotto
                è il valore tipico, in basso a destra il record con la data. Un giorno senza base
                non riceve una barra stimata, non ne riceve nessuna.
              </P>
              <P>
                Il sabato è l’unico giorno in cui i {TARON_WAIT_NOW} dell’inizio cadono esattamente
                nel mezzo. Di lunedì gli stessi minuti sarebbero l’eccezione.
              </P>
              <P>
                Quanto tenga tutto questo dipende dal numero di giorni misurati: qui si sono
                accumulati {TARON_WEEKDAY_DAYS} giorni feriali e {TARON_WEEKEND_DAYS} nel fine
                settimana. La card indica da sé il periodo su cui calcola. Per l’intero parco il
                totale dei giorni registrati sta nella sezione statistiche su park.fan, e nelle
                tabelle per mese e per giorno della settimana diventa una colonna a sé.
              </P>
            </div>
          </div>

          <DemoFrame
            label="La stessa tabella per tutto il parco, in tempo reale"
            note="Nessun numero d’esempio: questa è la situazione attuale del Phantasialand, il valore tipico e quello pieno per ogni attrazione. Sulla pagina del parco la riga sopra questa sezione dice su quanti giorni registrati calcola. Tutti i minuti vanno a passi di cinque, perché i parchi espongono a passi di cinque."
            href={PARK}
            hrefLabel="Phantasialand su park.fan →"
          >
            <LiveTopAttractions locale="it" />
          </DemoFrame>

          <Highlight>
            Questa tabella è il motivo per cui archiviamo i tempi di attesa. Un numero in tempo
            reale si può chiedere nel momento in cui qualcuno lo domanda. Una mediana su ogni
            martedì misurato deve essere già pronta prima che la domanda arrivi.
          </Highlight>
        </SectionShell>
      </Ambience>

      {/* ── 03 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="momento"
        index="03"
        kicker="L’orario"
        title="Il momento migliore della giornata"
        icon={Sunrise}
      >
        <P>
          «Arriva presto» è il consiglio che danno tutti. Vale solo se la fila nel corso della
          giornata cresce davvero, e non è affatto così ovunque. Sei attrazioni dello stesso parco,
          la stessa tabella, lo stesso anno:
        </P>

        <DemoFrame
          label="Il profilo orario reale, in questo momento"
          note="In diretta dal profilo orario del parco. In grassetto l’ora più forte di ogni attrazione, e tra queste sei non è affatto la stessa. Un’ora diventa colonna solo quando ha almeno dieci giorni misurati su quell’attrazione, raggiunge almeno il 40 per cento dell’ora meglio misurata e viene riportata da almeno metà delle attrazioni. Questo esclude le ore di bordo, in cui altrimenti una sola coda di ospiti dell’hotel parlerebbe per tutta la mattina."
          href={PARK}
          hrefLabel="Phantasialand su park.fan →"
        >
          <LiveHourlyProfile locale="it" />
        </DemoFrame>

        <div className="space-y-4 pt-2">
          <P>
            Taron è il caso in cui l’orario non decide quasi nulla: la riga resta tutto il giorno in
            una banda stretta, e a fare la differenza è il giorno della settimana del capitolo 02.
            Con Chiapas è il contrario: i valori salgono nettamente fino al pomeriggio. Una regola
            unica per tutto il parco sarebbe sbagliata per una delle due, ed è per questo che viene
            calcolata attrazione per attrazione.
          </P>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <DemoFrame
            label="Il consiglio che ne nasce"
            note="Viene consigliato solo se il picco della giornata raggiunge almeno 60 minuti e la partenza mattutina ne fa risparmiare almeno 45. Colorado Adventure, nello stesso parco, fa risparmiare 40 minuti su un picco di 50 e quindi non riceve alcun suggerimento."
          >
            <RopeDropDemo />
          </DemoFrame>

          <div className="space-y-4">
            <PG>
              La card indica tre numeri e un orario: il tempo di attesa tipico all’apertura, il
              picco della giornata, la differenza e la finestra in cui il vantaggio tiene. Dopo è
              finito, e c’è scritto così.
            </PG>
            <P>
              La card indica anche il momento più tranquillo della giornata, ma solo se cade fuori
              dalla finestra mattutina. Per Taron non ci cade: entrambi stanno nella stessa ora,
              perciò qui non c’è un secondo orario. Per altre attrazioni è la sera, e allora la card
              indica quell’orario. Per tutto il parco, il riepilogo delle attrazioni elenca quelle
              in cui alzarsi presto rende di più, ordinate per minuti risparmiati.
            </P>
          </div>
        </div>
      </SectionShell>

      {/* ── 04 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="giorno"
        index="04"
        kicker="La data"
        title="Il giorno giusto, mesi prima"
        icon={CalendarDays}
      >
        <P>
          La data decide più dell’orario. Tra due giorni della stessa settimana ci può essere
          mezz’ora di attesa media di differenza, e da un calendario normale non si vede. A fare la
          differenza sono vacanze scolastiche, festività, ponti e meteo.
        </P>

        <DemoFrame
          label="Quattro giorni delle vacanze autunnali"
          note="Il 15 ottobre è il più tranquillo dei quattro pur cadendo in piena vacanza: piove. Il 19 è grigio perché quel giorno il parco è chiuso. Su park.fan lo stesso calendario procede mese per mese, fin dove arriva la previsione per quel parco."
        >
          <CalendarDaysDemo />
        </DemoFrame>

        {/* One column, full width, like every other chapter on this page. As two
            prose columns this band put a third text edge under the paragraph above
            it: a run of copy, then a 604 px column ending short of it, then a
            second column starting where that paragraph still had words. */}
        <div className="space-y-4 pt-2">
          <P>
            I calendari delle vacanze vengono da due fonti pubbliche e coprono quattro anni
            ciascuno. Spesso contano più quelli dei vicini che i propri. Un esempio di oggi: per il
            Phantasialand la voce determinante a calendario non è la Renania
            Settentrionale-Vestfalia ma le vacanze estive della provincia olandese della Gheldria.
            Il parco dista 90 chilometri dal confine, e i visitatori in giornata di confini non ne
            conoscono. Le regioni entro circa 200 chilometri contano quindi anche loro e ricevono a
            calendario un contrassegno proprio.
          </P>
          <PG>
            Il colore di un giorno è una previsione, non una misura. Viene da un modello
            riaddestrato ogni notte con i tempi di attesa del giorno prima, e che poi si può
            verificare contro la realtà.
          </PG>
          <P>
            Fin dove arrivi il calendario dipende dal parco. Un parco aperto tutto l’anno riceve una
            previsione circa undici mesi prima. In un parco stagionale si ferma dove finisce la
            stagione pubblicata: per un martedì di marzo in cui il Phantasialand è dimostrabilmente
            chiuso, nel calendario c’è scritto chiuso e nessun colore di affollamento.
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

      {/* ── 05 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="pagina-parco"
        index="05"
        kicker="Il giro"
        title="Una pagina di parco dall’alto in basso"
        icon={Layers}
      >
        <P>
          Tutto quello che precede sta su una sola pagina park.fan per parco, costruita nell’ordine
          in cui si fanno le domande: il parco oggi è aperto? Sta per piovere? Quanto è lunga la
          fila? E quando sarebbe stato meglio venire?
        </P>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,21rem)]">
          <ParkAnatomy onlyWhenLabel="Solo se:" steps={PARK_SECTIONS} />

          <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <Highlight>
              Metà di questi blocchi dipende da una condizione, ed è voluto. Un parco senza
              spettacoli non riceve una scheda spettacoli vuota, e circa metà dei 212 parchi non
              mostra alcuna sezione vicini, perché nel raggio non c’è nulla.
            </Highlight>
            <PG>
              Le schede ricordano la scelta nell’indirizzo. Chi ha aperto il calendario e passa il
              link, invia il calendario e non l’elenco delle attrazioni.
            </PG>
            <div className="pt-1">
              <Link
                href={PARK}
                prefetch={false}
                className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors"
              >
                <Activity className="h-4 w-4" />
                Vederlo su un parco reale
              </Link>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* ── 06 ──────────────────────────────────────────────────────────── */}
      <Ambience tone="emerald">
        <SectionShell
          id="notte"
          index="06"
          kicker="Le fondamenta"
          title="Da dove arrivano i numeri"
          icon={Database}
        >
          <P>
            Ogni cinque minuti ciascuno dei 212 parchi viene interrogato, da tre fonti pubbliche
            insieme. Se si contraddicono decide la maggioranza, poi la mediana, poi la media. Viene
            salvato solo ciò che è cambiato, arrotondato a cinque minuti, perché i parchi stessi
            espongono a passi di cinque minuti.
          </P>

          <IngredientGrid>
            <IngredientCard icon={Activity} title="Tempi di attesa" delay={0}>
              ThemeParks.wiki, Wartezeiten.app e Queue-Times.com, ogni cinque minuti. La materia
              prima di tutto il resto su questa pagina.
            </IngredientCard>
            <IngredientCard icon={GraduationCap} title="Vacanze e festività" delay={60}>
              Nager.Date per le festività ufficiali e i ponti, OpenHolidays per le vacanze
              scolastiche. Quattro anni, ogni regione separatamente, aggiornato ogni mese.
            </IngredientCard>
            <IngredientCard icon={CloudSun} title="Meteo" delay={120}>
              Open-Meteo per previsione, storico e radar della pioggia a 15 minuti. Le allerte
              ufficiali arrivano da DWD e MeteoAlarm.
            </IngredientCard>
            <IngredientCard icon={CalendarDays} title="Orari di apertura" delay={0}>
              Dai calendari dei parchi. Dove un parco non ne pubblica, ricostruiamo la giornata
              dall’attività delle attrazioni e la contrassegniamo come stimata.
            </IngredientCard>
            <IngredientCard icon={Layers} title="Storico" delay={60}>
              Non viene cancellato nulla. I periodi più vecchi vengono solo compressi, così ogni
              analisi continua a girare su tutte le rilevazioni.
            </IngredientCard>
            <IngredientCard icon={BarChart3} title="Modelli di previsione" delay={120}>
              Separati per orizzonte: uno per la giornata in corso, uno per le prossime settimane,
              uno per il resto dell’anno. Ciascuno viene verificato sui tempi realmente osservati.
            </IngredientCard>
          </IngredientGrid>

          <div className="space-y-4 pt-4">
            <P>
              La seconda metà avviene di notte, mentre i parchi sono chiusi. «Quanto è lunga la fila
              di Taron in un martedì qualunque» è una mediana su ogni martedì misurato dell’ultimo
              anno. Una cosa così non si lancia quando qualcuno apre una pagina, ci mette troppo.
              Deve essere già lì prima che arrivi la domanda.
            </P>
            <P>
              Sei passi in ordine fisso, ogni notte. Ognuno legge quello che ha scritto il
              precedente, quindi nessuno può passare avanti. Quando apri la pagina la mattina, tutto
              questo è già calcolato.
            </P>
          </div>

          <NightShift
            locale="it"
            jobs={NIGHT_JOBS}
            caption="Orari in UTC, quindi nel cuore della notte. L’ordine spiega gli orari: «conviene alzarsi presto» alle 05:15 ha bisogno di ieri a quarti d’ora, e quelli si scrivono solo alle 04:30."
          />
        </SectionShell>
      </Ambience>

      {/* ── 07 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="limiti"
        index="07"
        kicker="I limiti"
        title="Quando non lo sappiamo"
        icon={HelpCircle}
      >
        <P>
          Alcune caselle qui restano vuote, ed è voluto. Tre casi in cui park.fan preferisce non
          dire nulla piuttosto che tirare a indovinare.
        </P>

        <div className="grid gap-6 lg:grid-cols-3">
          <DemoFrame
            label="Parco senza fonte leggibile"
            note="Hansa-Park pubblica i tempi di attesa solo nella propria app, sul wi-fi del parco. Nei dati sembra un parco nel cuore della notte, per questo su park.fan c’è un avviso curato a mano. Senza, ci sarebbero 82 attrazioni su «molto bassa»."
          >
            <NoWaitTimesDemo />
          </DemoFrame>

          <DemoFrame
            label="Attrazione fuori stagione"
            note="Su una pista di ghiaccio ad agosto non riporta niente nessuno, perché non c’è niente da riportare. Leggere quel silenzio come «aperta» trasforma una segnalazione mancante in un’attrazione aperta. Quel giorno l’attrazione non conta nemmeno nel contatore «12 su 45 aperte»."
          >
            <OffSeasonDemo />
          </DemoFrame>

          <DemoFrame
            label="Nessuna base di valutazione"
            note="«Nessuna previsione» vale per i parchi che non sappiamo ancora valutare: sotto una trentina di giorni di esercizio manca il valore di riferimento. Un parco nuovo resta senza colore invece di averne uno indovinato."
          >
            <BadgeRowDemo
              crowdLabel="Affollamento: quanto è pieno adesso"
              comparisonLabel="Confronto: più del solito?"
              caption="Due scale, un esempio: a 70 minuti Taron segna «Molto alta» — questo è l’affollamento. Rispetto ai suoi tipici 45 minuti è «Molto più alto» — questo è il confronto con sé stesso. Un parco piccolo può stare su «Molto alta» ed essere comunque «Tipico»: lì 25 minuti sono la norma."
            />
          </DemoFrame>
        </div>

        <Highlight>
          La stessa regola vale per il riconoscimento della stagione. I mesi di esercizio di
          un’attrazione li indichiamo solo dopo 330 giorni di osservazione. Prima non compare alcun
          mese, perché «va da dicembre ad aprile» descriverebbe il periodo in cui per caso abbiamo
          già misurato.
        </Highlight>
      </SectionShell>

      {/* ── 08 ──────────────────────────────────────────────────────────── */}
      <SectionShell
        id="visite"
        index="08"
        kicker="Nella pratica"
        title="Quattro visite"
        icon={Users}
      >
        <P>
          Gli stessi dati rispondono a domande molto diverse. Quattro esempi, ciascuno con il
          percorso che faremmo noi.
        </P>

        <div className="grid gap-5 lg:grid-cols-2">
          <PersonaBlock
            icon={CalendarDays}
            who="Famiglia, un giorno nelle vacanze d’autunno"
            question="«Qual è il giorno più tranquillo della settimana di vacanza, e se piove cosa facciamo?»"
            steps={[
              <>
                Aprire la pagina del parco, scheda <strong>Calendario</strong>. La settimana di
                vacanza sta lì come blocco, colorata secondo la previsione, con meteo e orari in
                ogni riquadro.
              </>,
              <>
                Toccare un giorno. Il dettaglio indica l’attesa media prevista e quali regioni in
                vacanza incidono quel giorno, anche quelle del paese confinante.
              </>,
              <>
                Giornata di pioggia in programma? Il calendario la mostra come la più tranquilla
                della settimana. Il giorno stesso, il radar della pioggia a 15 minuti in cima alla
                pagina del parco dice quando smette.
              </>,
              <>
                Su ogni card di attrazione c’è l’altezza minima, dove il parco la pubblica. Taron
                chiede 140 centimetri, Colorado Adventure 120, e questo decide la giornata più di
                qualsiasi tempo di attesa.
              </>,
              <>
                Segnare le attrazioni per bambini come preferite nella scheda{' '}
                <strong>Attrazioni</strong>. Poi compaiono in home page con il loro tempo di attesa
                attuale.
              </>,
            ]}
          />

          <PersonaBlock
            icon={BarChart3}
            who="Appassionato, tre parchi in una settimana"
            question="«Dove conviene il rope drop, e questa fila adesso è davvero eccezionale?»"
            steps={[
              <>
                Sulla pagina del parco il riepilogo delle attrazioni da rope drop, ordinato per
                minuti risparmiati. Le attrazioni senza un vantaggio reale lì non compaiono.
              </>,
              <>
                Per ogni attrazione leggere accanto la tabella del capitolo 02. Indica il periodo su
                cui calcola, e un giorno della settimana senza base lì non riceve alcuna barra.
              </>,
              <>
                Durante la visita guardare il badge di confronto: «molto più alta» significa davvero
                eccezionale oggi, non semplicemente lunga.
              </>,
              <>
                Ogni pagina di attrazione porta un voto sulla propria previsione, dal confronto tra
                previsioni passate e tempi reali degli ultimi 30 giorni. Per Taron sono qualche
                migliaio di previsioni confrontate.
              </>,
              <>
                Per pianificare il viaggio confrontare <A href={bestTime}>il periodo migliore</A>.
                Lì stanno più parchi uno accanto all’altro, giorno più tranquillo compreso.
              </>,
            ]}
          />

          <PersonaBlock
            icon={MapPin}
            who="Abbonamento annuale, a 20 minuti dal parco"
            question="«Vale ancora la pena andarci stasera?»"
            steps={[
              <>
                Home page con la posizione attiva. Il parco più vicino sta in cima, con stato,
                affollamento attuale e orario fino a stasera.
              </>,
              <>
                Affollamento «bassa» su un’attrazione che di solito segna «alta» è esattamente la
                serata per cui vale la pena mettersi in macchina.
              </>,
              <>
                Nel parco la home page passa alla vista ravvicinata: le attrazioni più vicine con
                distanza e tempo di attesa attuale.
              </>,
              <>
                Guardare la freccia della tendenza. Una fila in calo nell’ultima ora prima della
                chiusura è spesso il momento più corto dell’intera giornata.
              </>,
            ]}
          />

          <PersonaBlock
            icon={Compass}
            who="Prima volta in un grande parco"
            question="«Cosa vuol dire single rider, e in che ordine facciamo le cose?»"
            steps={[
              <>
                I termini stanno nel <A href={glossary}>dizionario</A>, in sei lingue. Sulle pagine
                delle attrazioni sono collegati direttamente nel testo.
              </>,
              <>
                La mattina seguire il consiglio rope drop del parco. È l’unico ordine che si basa su
                dati misurati e non sull’intuito.
              </>,
              <>
                Da mezzogiorno decidere in base all’affollamento e non ai minuti. Un’attrazione
                «bassa» con 25 minuti è la scelta migliore rispetto a una «alta» con 20.
              </>,
              <>
                Gli spettacoli nella scheda omonima. Gli orari sono lì per l’intera giornata, e le
                parate svuotano i viali per circa mezz’ora.
              </>,
            ]}
          />
        </div>
      </SectionShell>

      {/* ── 09 ──────────────────────────────────────────────────────────── */}
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
                  Ctrl + K oppure ⌘ + K, ovunque sul sito. Trova parchi, attrazioni, spettacoli e
                  ristoranti, anche con una grafia approssimativa.
                </>
              ),
            },
            {
              icon: MapPin,
              title: 'Posizione',
              body: (
                <>
                  Se autorizzata, la home page mostra i parchi vicino a te. Nel parco passa alla
                  vista ravvicinata con le distanze.
                </>
              ),
            },
            {
              icon: Star,
              title: 'Preferiti',
              body: (
                <>
                  Stella su ogni card di parco e di attrazione. Sta come cookie nel browser, senza
                  account e senza server.
                </>
              ),
            },
            {
              icon: Activity,
              title: 'Blog',
              body: (
                <>
                  Pezzi più lunghi su singoli parchi e attrazioni. Le tabelle al loro interno tirano
                  gli stessi numeri delle pagine di parco, invece di ricopiarli.
                </>
              ),
            },
            {
              icon: Moon,
              title: 'Pagina di attrazione',
              body: (
                <>
                  Andamento, tempi di attesa tipici per giorno della settimana, rope drop, altezza
                  minima, precisione della previsione, elementi di tracciato e gli articoli del blog
                  sull’attrazione.
                </>
              ),
            },
            {
              icon: HelpCircle,
              title: 'Dizionario',
              body: (
                <>
                  <A href={glossary}>Tutti i termini tecnici</A> con definizione, attrazioni
                  d’esempio e in parte un modello 3D dell’elemento di tracciato.
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
        kicker="Le vostre domande"
        title="Domande frequenti"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>

      <ClosingBand
        kicker="E adesso?"
        title="Continuare a leggere"
        body="Tutto su park.fan è gratuito, senza account e senza pubblicità. La pagina di un parco mostra tutto questo dal vivo, la pagina Fancast calcola in pubblico quanto hanno azzeccato le previsioni degli ultimi 30 giorni, e il periodo migliore mette più parchi uno accanto all’altro."
      >
        <Link
          href={PARK}
          prefetch={false}
          className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold shadow-sm transition-colors"
        >
          <Activity className="h-4 w-4" />
          Guarda una pagina di parco d’esempio
        </Link>
        <Link
          href={bestTime}
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <CalendarDays className="h-4 w-4" />
          Periodo migliore
        </Link>
        <Link
          href="/fancast"
          prefetch={false}
          className="border-primary/40 text-primary hover:bg-primary/10 inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          <Sparkles className="h-4 w-4" />
          Precisione delle previsioni
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
