import React from 'react';
import { Link } from '@/i18n/navigation';
import { BEST_TIME_SEGMENTS } from '@/lib/best-time/segments';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import {
  Activity,
  CalendarDays,
  CloudSun,
  PartyPopper,
  History,
  Gauge,
  Database,
  RefreshCw,
  MapPin,
  HelpCircle,
  Compass,
  Ticket,
  Palette,
  CalendarCheck,
  CalendarRange,
  LineChart,
  Sunrise,
} from 'lucide-react';
import {
  Lead,
  SectionShell,
  P,
  PG,
  Highlight,
  SplitFigure,
  CrowdSpectrum,
  IngredientGrid,
  IngredientCard,
  TouchpointGrid,
  FaqList,
} from '../_fancast-ui';
import { FancastLive, type FancastLiveLabels } from '../_fancast-live';

const LIVE_LABELS: FancastLiveLabels = {
  edition: 'Edizione attuale',
  trained: 'Addestrato',
  basis: 'Base di addestramento',
  datapoints: '{n} punti dati',
  days: 'su {d} giorni',
  vsPrevious: 'Rispetto a {v}',
  moreAccurate: 'più preciso',
  topTitle: 'Dove Fancast è stato più preciso di recente',
  topIntro:
    'Le attrazioni le cui previsioni recenti sono state più vicine al tempo di attesa reale: scostamento medio in minuti, in diretta dal modello.',
  colAttraction: 'Attrazione',
  colPark: 'Parco',
  colError: 'Errore medio',
  minUnit: 'min',
};

const FAQ = [
  {
    question: 'Quanto è preciso Fancast?',
    answer:
      'La precisione attuale è mostrata in diretta nella scorecard qui sopra: come MAE (scostamento medio in minuti), RMSE e MAPE. Quei numeri nascono dal confronto reale tra le previsioni passate e i tempi di attesa effettivamente misurati, non da un laboratorio di prova addolcito. Cambiano non appena il modello si riaddestra.',
  },
  {
    question: 'Con quanto anticipo può prevedere Fancast?',
    answer:
      'Fancast fornisce livelli di affluenza giornalieri per un parco fino a 365 giorni in anticipo. Per le singole attrazioni produce inoltre previsioni orarie dei tempi di attesa. Più il giorno si avvicina, più pesano i segnali a breve termine come le previsioni del tempo.',
  },
  {
    question: 'Come fa Fancast a sapere che un sabato di vacanza sarà affollato?',
    answer:
      'Dall’intreccio di molti segnali: i calendari scolastici e dei giorni festivi (anche quelli delle regioni vicine), il giorno della settimana, le previsioni meteo, gli eventi speciali e l’intera cronologia dei tempi di attesa del parco. Un sabato di vacanza in piena estate mette insieme quasi tutti questi fattori contemporaneamente, ed è per questo che lì la previsione schizza in alto, mentre un martedì piovoso di novembre resta verde.',
  },
  {
    question: 'Quanto spesso viene aggiornato il modello?',
    answer:
      'Ogni giorno. Fancast si riaddestra automaticamente una volta al giorno alle 06:00 UTC con i dati più freschi, compresi i tempi di attesa di ieri. Così, letteralmente, ogni mattina diventa un pochino migliore.',
  },
  {
    question: 'Posso usare Fancast per un parco e un giorno precisi?',
    answer:
      'Sì. Ogni pagina di parco su park.fan ha un calendario di affluenza che ti mostra, per ogni singolo giorno fino a un anno in anticipo, una previsione verde, gialla o rossa: da Europa-Park a Phantasialand, passando per Efteling e Walt Disney World. Ricevi inoltre previsioni orarie dei tempi di attesa per le singole attrazioni.',
  },
  {
    question: 'Quali dati usa Fancast?',
    answer:
      'Tempi di attesa in diretta e storici da oltre 150 parchi, calendari scolastici e dei giorni festivi (anche delle regioni vicine), previsioni meteo, orari di apertura, eventi speciali e andamenti stagionali. Da questo mix nascono i livelli di affluenza giornalieri e le previsioni orarie dei tempi di attesa.',
  },
  {
    question: 'Perché un parco mostra «Nessuna previsione»?',
    answer:
      'Fancast valuta un parco solo quando ci sono abbastanza dati operativi: almeno una trentina di giorni di apertura. I parchi nuovissimi o aperti di rado non hanno ancora questa base. Allora preferiamo mostrare onestamente «Nessuna previsione» piuttosto che un numero tirato a indovinare.',
  },
  {
    question: 'Fancast ha un costo?',
    answer:
      'No. Come tutto park.fan, ogni previsione, calendario di affluenza e statistica è gratuito, senza pubblicità e utilizzabile senza account.',
  },
] as const;

export function ContentIT() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Fancast è il nostro modello di previsione interno: la parte di park.fan che guarda al
          futuro. Il nome? Sfacciato ma metodico: <strong>fan</strong> come in park.
          <strong>fan</strong>, <strong>cast</strong> come in fore<strong>cast</strong>. In pratica,
          un bollettino meteo per le code.
        </Lead>
        <P>
          E poiché ci fidiamo solo dei numeri costretti a dimostrare quanto valgono, Fancast fa una
          cosa che la maggior parte dei modelli evita in sordina: si dà un voto da sé. Ogni
          previsione viene poi messa a confronto con il tempo di attesa realmente accaduto, alla
          luce del sole, su questa pagina. Barare, inutile.
        </P>
        <Highlight>
          In breve: Fancast non è un indovino con la sfera di cristallo. È uno statistico testardo
          che ogni sera prende ripetizioni e ogni mattina deve rifare l’esame. Una rana meteo che
          verifica il proprio meteo.
        </Highlight>
      </div>

      {/* 01 — Scorecard (live) */}
      <SectionShell
        id="note"
        index="01"
        kicker="Il voto in pagella"
        title="Quanto è bravo davvero Fancast?"
        icon={Gauge}
      >
        <P>
          Basta con i preamboli: ecco il voto, in diretta e senza ritocchi. Fancast estrae questi
          numeri dalla propria dashboard proprio in questo momento; cambieranno non appena il
          modello si riaddestrerà stanotte.
        </P>
        <div className="overflow-hidden rounded-2xl border">
          <MLStatsSection />
        </div>
        <FancastLive labels={LIVE_LABELS} />
      </SectionShell>

      {/* 02 — What it reads */}
      <SectionShell
        id="ingredients"
        index="02"
        kicker="Gli ingredienti"
        title="Che cosa legge Fancast"
        icon={Database}
      >
        <PG>
          Un ponte piovoso di ottobre è tutta un’altra bestia rispetto a un sabato di vacanza
          assolato di luglio, e un modello deve prima impararlo. Per questo Fancast si nutre di più
          fonti contemporaneamente:
        </PG>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Tempi di attesa in diretta" delay={0}>
            Milioni di rilevazioni reali da oltre 150 parchi, aggiornate al minuto. La valuta grezza
            di ogni previsione.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendari e vacanze" delay={60}>
            Fine settimana, giorni festivi e vacanze scolastiche, anche quelle delle regioni vicine,
            perché chi va in gita di un giorno se ne infischia dei confini.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Meteo" delay={120}>
            La probabilità di pioggia e la temperatura piegano le previsioni a breve termine. Il
            sole attira, la pioggia tutto il giorno svuota i vialetti.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Eventi e stagione" delay={0}>
            Halloween, vacanze estive, ponti, una novità alla sua prima estate: i soliti sospetti di
            una giornata affollata.
          </IngredientCard>
          <IngredientCard icon={History} title="Cronologia" delay={60}>
            Anni di cronologia dei tempi di attesa per parco. Schemi che si vedono solo se li fissi
            abbastanza a lungo.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Orari e capacità" delay={120}>
            Quando apre il parco, per quanto, con quale capacità: la cornice in cui tutto il resto
            si incastra.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Da questo miscuglio il modello ricava due cose: una{' '}
          <strong>previsione oraria dei tempi di attesa</strong> per le singole attrazioni e un{' '}
          <strong>voto di affluenza giornaliero</strong> per l’intero parco.
        </P>
      </SectionShell>

      {/* 03 — Concrete park examples */}
      <SectionShell
        id="examples"
        index="03"
        kicker="In parchi reali"
        title="Fancast in tre parchi"
        icon={Compass}
      >
        <P>
          Grigia è ogni teoria: Fancast diventa concreto solo nel parco reale. Tre esempi di come
          gli stessi ingredienti si trasformino in tre previsioni completamente diverse:
        </P>
        <SplitFigure
          src="/images/parks/europa-park/silver-star.jpg"
          alt="Silver Star a Europa-Park"
          kicker="Europa-Park · ponte di ottobre"
          title="Tranquillo, verde, sotto i 30 minuti"
          badge={<CrowdLevelBadge level="very_low" />}
        >
          Fancast vede: vacanze scolastiche in una sola regione vicina, tempo variabile, nessun
          evento speciale. Risultato: una previsione tranquilla e verde; Voltron Nevera
          probabilmente sotto i 30 minuti, blue fire da salire al volo. Lo stesso parco tre
          settimane dopo, un sabato di vacanza? Rosso intenso. Sei milioni di visitatori all’anno
          non si distribuiscono da soli.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/phantasialand/taron.jpg"
          alt="Taron che sfreccia attraverso Klugheim a Phantasialand"
          kicker="Phantasialand · sabato di vacanza"
          title="Compatto, pieno, dall’arancione al rosso"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Parco compatto, poche attrazioni di punta, tutti vogliono Taron: la saturazione arriva
          prima che sia spillata la prima birra. Fancast lo sa e dipinge la giornata dall’arancione
          al rosso. Il calendario accanto ti suggerisce subito il martedì successivo, quando potrai
          salire su Taron di fila invece di limitarti a sospirare per lui.
        </SplitFigure>
        <SplitFigure
          src="/images/parks/efteling/baron-1898.jpg"
          alt="Baron 1898 a Efteling"
          kicker="Efteling · martedì piovoso di novembre"
          title="La dritta segreta che il modello già mette in conto"
          badge={<CrowdLevelBadge level="low" />}
        >
          Proprio il giorno che i pianificatori a naso evitano, e che Fancast colora di verde. Poche
          vacanze, tempo pessimo, code corte. Funziona esattamente finché tutti non hanno letto la
          stessa dritta segreta; per questo il modello mette in conto da sé la probabilità di
          pioggia, invece di affidarsi al folklore.
        </SplitFigure>
      </SectionShell>

      {/* 04 — How it learns */}
      <SectionShell
        id="training"
        index="04"
        kicker="Il metodo"
        title="Come impara Fancast (e non può barare)"
        icon={RefreshCw}
      >
        <P>
          Il trucco più importante è dei più dimessi: Fancast si riaddestra{' '}
          <strong>ogni notte</strong>, tutti i giorni alle 06:00 UTC. Ciò che è successo ieri, il
          modello lo sa oggi. Un fan delle montagne russe con gli anni invecchia e si stanca;
          Fancast diventa un po’ più sveglio ogni mattina.
        </P>
        <P>
          Ed è messo alla prova soltanto su giorni che non ha <strong>mai visto</strong>: sul
          futuro, non su giorni del passato imparati a memoria. Tutto il resto sarebbe come
          infilarsi da soli in anticipo le domande dell’esame e poi festeggiare la pagella piena di
          lodi.
        </P>
        <P>
          In più, Fancast tiene d’occhio se sta <strong>andando alla deriva</strong>, se la realtà
          gli sta lentamente sfuggendo. E una nuova versione del modello va in produzione solo se
          batte davvero la vecchia in un confronto leale. Democrazia tra algoritmi: chi non è
          migliore resta in panchina.
        </P>
      </SectionShell>

      {/* 05 — Crowd levels */}
      <SectionShell
        id="levels"
        index="05"
        kicker="La scala"
        title="Verde, giallo, rosso: i livelli di affluenza"
        icon={Palette}
      >
        <PG>
          Alla fine di tutto questo calcolo c’è un unico colore. Sei livelli, da «hai praticamente
          il parco tutto per te» a «benvenuto in un sabato di vacanza»:
        </PG>
        <CrowdSpectrum
          items={[
            {
              level: 'very_low',
              text: 'Quasi vuoto. Sogni da rope-drop, giri di fila, una foto con la mascotte senza coda.',
            },
            {
              level: 'low',
              text: 'Rilassato. Attese brevi, sali su tutto senza bisogno di un piano di battaglia.',
            },
            {
              level: 'moderate',
              text: 'Funzionamento normale. Le attrazioni di punta si riempiono, il resto resta tranquillo. Una buona giornata di compromesso.',
            },
            {
              level: 'high',
              text: 'Decisamente affollato. Per le attrazioni top conviene alzarsi presto, o portare pazienza.',
            },
            {
              level: 'very_high',
              text: 'Davvero pieno. Code lunghe alle attrazioni clou; pianificare batte nettamente l’improvvisazione.',
            },
            {
              level: 'extreme',
              text: 'Allerta massima. Sabato di vacanza in piena estate. Solo con strategia, resistenza e senso dell’umorismo.',
            },
          ]}
        />
      </SectionShell>

      {/* 06 — Try a real park */}
      <SectionShell id="parks" index="06" kicker="Provaci tu" title="Scegli un parco" icon={Ticket}>
        <P>
          Basta teoria. Fancast gira su ogni pagina di parco: eccone alcuni popolari per provarlo
          direttamente. Entra, apri il calendario di affluenza e guarda quale colore tocca al giorno
          che scegli:
        </P>
        <PopularParksGrid />
      </SectionShell>

      {/* 07 — Where you meet it */}
      <SectionShell
        id="where"
        index="07"
        kicker="Ovunque nel parco"
        title="Dove incontri Fancast"
        icon={MapPin}
      >
        <P>
          Fancast non vive su una pagina solitaria: è intessuto in tutto park.fan, quasi sempre
          senza presentarsi:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: CalendarCheck,
              title: 'Previsione di oggi',
              body: 'il voto di affluenza nell’intestazione del parco, ancora prima di toccare la prima attrazione.',
            },
            {
              icon: CalendarRange,
              title: 'Calendario di affluenza',
              body: (
                <>
                  il <Link href="/parks">calendario dei giorni migliori per la visita</Link> su ogni
                  pagina di parco: verde, giallo, rosso, fino a un anno in anticipo.
                </>
              ),
            },
            {
              icon: CalendarDays,
              title: 'Periodo migliore',
              body: (
                <>
                  i giorni feriali più tranquilli e i prossimi giorni-dritta, distillati dagli
                  stessi dati. Scopri il{' '}
                  <Link href={`/${BEST_TIME_SEGMENTS.it}`}>periodo migliore per visitare</Link>.
                </>
              ),
            },
            {
              icon: LineChart,
              title: 'Previsione IA nel grafico dei tempi di attesa',
              body: 'la linea tratteggiata che rivela le fasce orarie più convenienti di un’attrazione.',
            },
            {
              icon: Sunrise,
              title: 'Consiglio sul rope-drop',
              body: 'la risposta onesta a «vale la pena arrivare presto?», minimi attesi compresi.',
            },
            {
              icon: HelpCircle,
              title: 'Nessuna previsione',
              body: (
                <>
                  onesto invece che indovinato: i parchi con troppo pochi dati ricevono{' '}
                  <CrowdLevelBadge level="unknown" /> invece di un numero inventato.
                </>
              ),
            },
          ]}
        />
        <P>
          Come tutto questo si combina dentro un parco lo ripercorre passo passo la{' '}
          <Link href="/howto">guida completa</Link>: calendario di affluenza, badge e tempi di
          attesa in diretta compresi.
        </P>
      </SectionShell>

      {/* 08 — FAQ */}
      <SectionShell
        id="faq"
        index="08"
        kicker="In sintesi"
        title="Domande frequenti su Fancast"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
