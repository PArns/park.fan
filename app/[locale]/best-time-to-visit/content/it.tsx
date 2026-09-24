import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
import {
  CalendarRange,
  Sunrise,
  Ban,
  Ticket,
  HelpCircle,
  Sparkles,
  Clock,
  CalendarDays,
  CloudRain,
  Users,
  Sun,
} from 'lucide-react';
import {
  Lead,
  P,
  PG,
  Highlight,
  SectionShell,
  SplitFigure,
  TouchpointGrid,
  FaqList,
} from '@/components/marketing/editorial-ui';
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'I giorni feriali più tranquilli',
  weekdaysBody:
    'Qui ogni parco pesa uguale, che sia Disneyland o un piccolo parco di famiglia: prima lo riportiamo alla sua media, poi facciamo la media fra tutti. La barra dice quanto è affollato un tipico giorno feriale rispetto alla media. Il sabato spicca; gli altri sei giorni stanno più vicini di quanto quasi tutti si aspettino.',
  monthsTitle: 'I mesi più tranquilli',
  monthsBody:
    'Lo stesso calcolo, stavolta distribuito sull’anno. Dicembre esce dagli schemi, perché ci finiscono dentro solo i parchi che d’inverno aprono, e quelli fanno programma natalizio.',
  quieter: 'più tranquillo',
  busier: 'più affollato',
  typical: 'intorno alla media',
  footnote: 'Basato su {days} giorni-parco misurati di {parks} parchi.',
  pending:
    'La classifica dal vivo sta ancora raccogliendo i tempi di attesa. I giorni più tranquilli compariranno qui non appena ci saranno abbastanza dati.',
};

const FAQ = [
  {
    question: 'Qual è il periodo migliore per visitare un parco divertimenti?',
    answer:
      'È più tranquillo nei giorni feriali fuori dalle vacanze scolastiche, e fra questi il martedì, il mercoledì e il giovedì. Gli schemi precisi per giorno della settimana e mese li vedi qui sopra, presi dai tempi di attesa misurati in tutti i parchi.',
  },
  {
    question: 'Quale giorno della settimana è meno affollato?',
    answer:
      'In media su tutti i parchi, il martedì, il mercoledì e il giovedì sono i più tranquilli. A spiccare per affollamento è solo il sabato; la domenica sta più vicina al martedì che al sabato. I singoli parchi possono variare: ogni pagina di parco ha un calendario dell’affluenza che lo mostra giorno per giorno.',
  },
  {
    question: 'In quali mesi i parchi divertimenti sono meno affollati?',
    answer:
      'Dipende dal parco più di quanto lasci intendere la regola generale: in media su tutti i parchi i mesi estivi non sono i più affollati, e dicembre spicca verso l’alto, perché d’inverno restano aperti solo i parchi con programma natalizio. Il riepilogo mensile qui sopra lo mostra mese per mese. Per un parco preciso conta il suo calendario.',
  },
  {
    question: 'Vale la pena visitare con la pioggia?',
    answer:
      'Spesso sì: il maltempo scoraggia molti visitatori e le code si accorciano, soprattutto davanti alle montagne russe, che con la pioggia continuano a girare. Ma il trucco da esperti funziona solo finché non hanno tutti la stessa idea; per questo il nostro modello di previsione mette in conto il meteo direttamente.',
  },
  {
    question: 'Come trovo il giorno migliore per un parco specifico?',
    answer:
      'Questa pagina mostra gli schemi globali come punto di partenza. Per un parco preciso, apri il suo calendario dell’affluenza: mostra per ogni giornata pubblicata una previsione verde, gialla o rossa, comprese le vacanze scolastiche e i giorni festivi di quella regione.',
  },
  {
    question: 'Da dove arrivano questi dati?',
    answer:
      'Dai tempi di attesa che abbiamo registrato noi stessi in oltre 200 parchi. Perché la classifica non finisca in mano ai parchi più grandi, ogni parco viene prima riportato alla propria media e solo dopo si fa la media fra tutti.',
  },
] as const;

export function ContentIT() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Quando un parco divertimenti si riempie è sorprendentemente prevedibile, di sicuro più
          dell’umore di un bambino di sei anni alle tre del pomeriggio. Giorno della settimana,
          vacanze scolastiche, meteo e stagione decidono in buona parte se davanti alle montagne
          russe aspetti dieci minuti o un’ora e mezza. E siccome ogni giornata al parco lascia
          dietro di sé dei tempi di attesa, il conto si può rifare con una certa precisione.
        </Lead>
        <P>
          Così abbiamo fatto i conti, con i tempi di attesa registrati in oltre 200 parchi. Più in
          basso trovi i giorni feriali e i mesi più tranquilli, le ore migliori della giornata e le
          date in cui è meglio restare sul divano. Poi il calendario dell’affluenza ti cerca il
          giorno giusto per il parco che hai in mente.
        </P>
        <Highlight>
          Versione breve per chi ha fretta: dal martedì al giovedì fuori dalle vacanze scolastiche,
          davanti ai cancelli all’apertura, e un meteo incerto preso come un regalo, purché nello
          zaino ci sia una giacca impermeabile.
        </Highlight>
      </div>

      {/* 01 — Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="I dati"
        title="I giorni feriali e i mesi più tranquilli"
        icon={CalendarRange}
      >
        <PG>
          A spostare di più sono il giorno della settimana e il mese. Entrambi li abbiamo mediati su
          tutti i parchi, partendo dai tempi di attesa misurati davvero:
        </PG>
        <BestTimesData locale="it" labels={DATA_LABELS} />
        <QuietestDaysByPark locale="it" />
      </SectionShell>

      {/* 02 — Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="Ora per ora"
        title="Le ore più tranquille della giornata"
        icon={Clock}
      >
        <P>
          Dopo il giorno della settimana, è l’ora a pesare di più. Queste quattro finestre sono
          quasi ovunque le più tranquille:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: (
                <>
                  All’apertura (<GlossaryTermLink termId="rope-drop">rope drop</GlossaryTermLink>)
                </>
              ),
              body: 'La prima ora dopo l’apertura è la migliore della giornata. Chi è puntuale ai cancelli sale spesso sulle grandi attrazioni prima ancora che si formi una coda.',
            },
            {
              icon: Users,
              title: 'Intorno all’ora di pranzo',
              body: 'Quando tutti sono a tavola, le code si accorciano. Prenditi quel tempo per le attrazioni più gettonate e mangia più tardi. Le patatine hanno lo stesso sapore anche alle due e mezza.',
            },
            {
              icon: Sun,
              title: 'L’ultima ora',
              body: 'Molte famiglie tornano a casa prima della fine. Nell’ultima ora prima della chiusura i tempi di attesa spesso calano ancora sensibilmente.',
            },
            {
              icon: Ticket,
              title: 'Durante il grande spettacolo serale',
              body: 'Una parata o dei fuochi d’artificio attirano migliaia di persone tutte insieme. Proprio allora alle montagne russe si liberano all’improvviso dei posti.',
            },
          ]}
        />
        <SplitFigure
          src="/media/phantasialand/black-mamba.jpg"
          alt="Black Mamba che sfreccia nella giungla a Phantasialand"
          kicker="Rope drop"
          title="Arrivare presto aiuta, ma non su ogni attrazione"
        >
          Sulle attrazioni di punta la prima ora dopo l’apertura rende spesso più giri di due nel
          pomeriggio. Non vale però ovunque: certe attrazioni restano piene uguali per tutta la
          giornata, altre si svegliano solo dopo pranzo. La pagina di ogni attrazione riporta la sua
          curva della giornata, e lì si legge anche se per quella la sveglia prima conviene.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell id="avoid" index="03" kicker="Giorni rossi" title="Date da evitare" icon={Ban}>
        <PG>
          Altrettanto utile è sapere quando è meglio non andare. In queste date i parchi sono pieni
          zeppi. Puoi prepararti con merenda e tanta pazienza, oppure pianificare per aggirarle:
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="Le montagne russe Goliath a Walibi Holland in un giorno affollato"
          kicker="Giorno di punta"
          title="Bel tempo, tutti liberi, tutti qui"
          reverse
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="very_high" />
            </GlossaryTermLink>
          }
        >
          Un sabato delle vacanze estive con un tempo splendido è il caso peggiore: tutti liberi,
          tutti vogliono uscire, tutti qui. Se sei flessibile, prendi piuttosto il martedì
          successivo. Lo stesso parco sembra allora ristrutturato di notte da qualcuno che si è
          dimenticato le code.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekend e giorni festivi',
              body: 'Il sabato è il giorno più affollato su tutti i parchi, con un distacco netto dal resto della settimana. I giorni festivi e i lunghi weekend rincarano la dose.',
            },
            {
              icon: CalendarRange,
              title: (
                <GlossaryTermLink termId="school-holiday">Vacanze scolastiche</GlossaryTermLink>
              ),
              body: 'Appena la tua regione o quella accanto è in vacanza, l’affluenza sale. Le vacanze estive sono l’alta stagione assoluta.',
            },
            {
              icon: Sun,
              title: 'Ponti e sabati di vacanza in piena estate',
              body: 'Sole, giorno libero e alta stagione cadono insieme. Di tutte le combinazioni del calendario, è la più affollata.',
            },
            {
              icon: Sparkles,
              title: 'Le novità nella loro prima estate',
              body: 'Una montagna russa nuova di zecca, nella prima stagione vogliono provarla tutti, possibilmente prima dei colleghi. Alle anteprime aspettati code lunghe.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Gioca d’astuzia"
        title="Tattiche per code corte"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Giorno feriale invece del weekend',
              body: 'La leva più grande del calendario. In media su tutti i parchi il sabato è il giorno che si allontana di più dalla media verso l’alto, il martedì quello che se ne allontana di più verso il basso.',
            },
            {
              icon: CloudRain,
              title: 'Sfrutta il meteo con astuzia',
              body: 'Una previsione incerta tiene molti a casa. Se una pioggerella non ti spaventa, aspetti nettamente meno. La giacca impermeabile batte l’ombrello.',
            },
            {
              icon: Ticket,
              title: (
                <>
                  <GlossaryTermLink termId="single-rider">Single rider</GlossaryTermLink> e{' '}
                  <GlossaryTermLink termId="virtual-queue">code virtuali</GlossaryTermLink>
                </>
              ),
              body: 'Riempi da single rider i posti liberi, oppure mettiti in coda con l’app mentre mangi o passeggi. Non sarete seduti vicini, ma vi siederete prima.',
            },
          ]}
        />
        <P>
          Come tutto questo si combina in un parco è spiegato passo dopo passo nella{' '}
          <Link href={`/${HOWTO_SEGMENTS.it}`}>guida completa</Link>.
        </P>
      </SectionShell>

      {/* 05 — Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="Per il tuo parco"
        title="Il calendario dell’affluenza"
        icon={Ticket}
      >
        <P>
          Gli schemi qui sopra danno la cornice. Il giorno migliore per il tuo parco te lo dice il{' '}
          <GlossaryTermLink termId="crowd-calendar">calendario dell’affluenza</GlossaryTermLink> di
          ogni pagina di parco: verde, giallo, rosso, per ogni giornata pubblicata, con le vacanze e
          i giorni festivi della regione interessata.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="L’attrazione del palazzo Symbolica a Efteling"
          kicker="Verde, giallo, rosso"
          title="Un colore al giorno, fin dove arriva il calendario"
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="low" />
            </GlossaryTermLink>
          }
        >
          Ogni pagina di parco porta una previsione giorno per giorno che conosce le vacanze
          scolastiche e i giorni festivi della regione giusta, anche quelli di cui non hai mai
          sentito parlare. Scegli un giorno verde e la parte più importante della pianificazione è
          fatta prima di comprare il biglietto.
        </SplitFigure>
        <P>Qualche parco popolare per iniziare subito:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Alimentato da Fancast"
        body="Il nostro modello di previsione stima l’affluenza per ogni giornata pubblicata e nel farlo si dà un voto da sé."
      />

      {/* 06 — FAQ */}
      <SectionShell
        id="faq"
        index="06"
        kicker="In breve"
        title="Domande frequenti sul periodo migliore per visitare"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
