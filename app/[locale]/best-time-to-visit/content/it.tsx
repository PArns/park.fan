import React from 'react';
import { Link } from '@/i18n/navigation';
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
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'I giorni feriali più tranquilli',
  weekdaysBody:
    'Media su tutti i parchi — ogni parco prima normalizzato sulla propria media, così i parchi grandi non mettono in ombra i piccoli. Ecco quanto è affollato un tipico giorno feriale rispetto alla media. Dal martedì al giovedì vincono quasi sempre.',
  monthsTitle: 'I mesi più tranquilli',
  monthsBody:
    'Lo stesso calcolo sull’anno: i mesi di bassa stagione sono nettamente più vuoti dei picchi dell’estate e delle vacanze.',
  quieter: 'più tranquillo',
  busier: 'più affollato',
  typical: 'intorno alla media',
  footnote: 'Basato su {days} giorni-parco di {parks} parchi, ultimi {months} mesi.',
  pending:
    'La classifica dal vivo sta ancora raccogliendo i tempi di attesa. I giorni più tranquilli compariranno qui non appena ci saranno abbastanza dati.',
};

const FAQ = [
  {
    question: 'Qual è il periodo migliore per visitare un parco divertimenti?',
    answer:
      'È più tranquillo nei giorni feriali fuori dalle vacanze scolastiche — dal martedì al giovedì in bassa stagione sono quasi sempre le giornate più rilassate. Gli schemi precisi per giorno della settimana e mese li vedi qui sopra, in diretta dai dati reali sui tempi di attesa di tutti i parchi.',
  },
  {
    question: 'Quale giorno della settimana è meno affollato?',
    answer:
      'In media su tutti i parchi, il martedì, il mercoledì e il giovedì sono i più tranquilli, mentre il sabato e la domenica sono nettamente i più affollati. I singoli parchi possono variare — ogni pagina di parco ha un calendario dell’affluenza che lo mostra giorno per giorno.',
  },
  {
    question: 'In quali mesi i parchi divertimenti sono meno affollati?',
    answer:
      'I mesi di bassa stagione, lontani dai picchi dell’estate e dei giorni festivi, sono i più vuoti. Il riepilogo mensile qui sopra mostra l’affluenza relativa nell’arco dell’anno, in media su tutti i parchi.',
  },
  {
    question: 'Vale la pena visitare con la pioggia?',
    answer:
      'Spesso sì: il maltempo scoraggia molti visitatori e le code si accorciano — soprattutto per le montagne russe, che funzionano comunque. Ma il trucco da esperti funziona solo finché non hanno tutti la stessa idea; per questo il nostro modello di previsione mette in conto il meteo direttamente.',
  },
  {
    question: 'Come trovo il giorno migliore per un parco specifico?',
    answer:
      'Questa pagina mostra gli schemi globali come punto di partenza. Per un parco preciso, apri il suo calendario dell’affluenza: mostra per ogni singola giornata, fino a un anno in anticipo, una previsione verde, gialla o rossa — comprese le vacanze scolastiche e i giorni festivi di quella regione.',
  },
  {
    question: 'Da dove arrivano questi dati?',
    answer:
      'Dai tempi di attesa effettivamente registrati di oltre 150 parchi negli ultimi due anni. Ogni parco viene normalizzato sulla propria media e poi mediato su tutti i parchi, così la classifica è equa e non viene dominata dai parchi più grandi.',
  },
] as const;

export function ContentIT() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Il periodo migliore per visitare un parco divertimenti non è un segreto — è uno schema.
          Quando un parco si riempie dipende dal giorno della settimana, dal calendario delle
          vacanze scolastiche, dal meteo e dalla stagione; tutti e quattro lasciano tracce nei tempi
          di attesa.
        </Lead>
        <P>
          Queste tracce le abbiamo misurate su oltre 150 parchi negli ultimi due anni. Più sotto: i
          giorni feriali e i mesi più tranquilli, le ore più tranquille della giornata, le date da
          schivare — e il calendario dell’affluenza che trasforma tutto questo nel singolo giorno
          migliore per il tuo parco.
        </P>
        <Highlight>
          In breve: dal martedì al giovedì fuori dalle vacanze scolastiche, arrivare all’apertura e
          lasciare che una previsione meteo incerta faccia per te la selezione della folla. Tutto
          ciò che segue sono le clausole in piccolo.
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
          L’affluenza non è casuale: quando si riempie segue schemi chiari di giorno della
          settimana, vacanze, meteo e stagione. Qui i due più grandi — in media su tutti i parchi,
          dai dati reali sui tempi di attesa:
        </PG>
        <BestTimesData locale="it" labels={DATA_LABELS} />
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
          Non conta solo il giorno, ma anche l’ora. Tre finestre sono quasi ovunque le più
          tranquille:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: 'All’apertura (rope drop)',
              body: 'La prima ora è d’oro: chi è dentro all’apertura sale sulle attrazioni di punta spesso con una frazione dell’attesa successiva.',
            },
            {
              icon: Users,
              title: 'Intorno all’ora di pranzo',
              body: 'Quando la folla mangia, le code si svuotano — un buon momento per le attrazioni più gettonate (e per mangiare più tardi).',
            },
            {
              icon: Sun,
              title: 'Gli ultimi 90 minuti',
              body: 'Molti visitatori giornalieri se ne vanno presto. Poco prima della chiusura i tempi di attesa spesso calano ancora sensibilmente.',
            },
            {
              icon: Ticket,
              title: 'Durante il grande spettacolo serale',
              body: 'Una parata o dei fuochi d’artificio impegnano migliaia di ospiti in una volta — i tempi di attesa delle montagne russe crollano in modo misurabile.',
            },
          ]}
        />
        <SplitFigure
          src="/images/parks/phantasialand/black-mamba.jpg"
          alt="Black Mamba che sfreccia nella giungla a Phantasialand"
          kicker="Rope drop"
          title="La prima ora è d’oro"
        >
          Chi è dentro all’apertura sale sulle attrazioni di punta spesso con una frazione
          dell’attesa successiva. La prima ora sostituisce regolarmente due ore del pomeriggio —
          niente fast-pass, solo una sveglia mattutina.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell id="avoid" index="03" kicker="Giorni rossi" title="Date da evitare" icon={Ban}>
        <PG>
          Tanto importanti quanto i giorni tranquilli sono quelli affollati. In queste date
          aspettati la ressa — mettile in conto, oppure pianifica per aggirarle:
        </PG>
        <SplitFigure
          src="/images/parks/walibi-holland/goliath.jpg"
          alt="Le montagne russe Goliath a Walibi Holland in un giorno affollato"
          kicker="Giorno di punta"
          title="Bel tempo, tutti liberi, tutti qui"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          La classica combinazione di punta — un sabato di vacanza in piena estate — mette insieme
          quasi tutti i fattori di affluenza in una volta. Se puoi, prendi piuttosto il martedì
          successivo: stesso parco, metà coda.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Weekend e giorni festivi',
              body: 'Il sabato e la domenica sono i più affollati su tutti i parchi; i giorni festivi e i lunghi weekend rincarano la dose.',
            },
            {
              icon: CalendarRange,
              title: 'Vacanze scolastiche',
              body: 'Durante le vacanze della tua regione e di quelle vicine l’affluenza sale nettamente — soprattutto le vacanze estive.',
            },
            {
              icon: Sun,
              title: 'Ponti e sabati di vacanza in piena estate',
              body: 'La classica combinazione di punta: bel tempo, tutti liberi, tutti presenti. Se puoi, meglio il martedì successivo.',
            },
            {
              icon: Sparkles,
              title: 'Le novità nella loro prima estate',
              body: 'Una montagna russa nuova di zecca attira folle nella sua stagione d’apertura — aspettati lunghe code alle anteprime.',
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
              body: 'La leva più grande di tutte: un martedì invece di un sabato può dimezzare i tempi di attesa.',
            },
            {
              icon: CloudRain,
              title: 'Sfrutta il meteo con astuzia',
              body: 'Una previsione incerta scoraggia in molti. Chi è attrezzato contro la pioggia fa meno coda — una giacca impermeabile batte l’ombrello.',
            },
            {
              icon: Sunrise,
              title: 'Arriva presto',
              body: 'Il rope drop batte quasi ogni altra tattica. La prima ora spesso sostituisce due ore del pomeriggio.',
            },
            {
              icon: Ticket,
              title: 'Single rider e code virtuali',
              body: 'Sali da solo o mettiti in coda in versione digitale mentre mangi o fai shopping — tempo regalato nei giorni affollati.',
            },
          ]}
        />
        <P>
          Come tutto questo si combina in un parco è spiegato passo dopo passo nella{' '}
          <Link href="/howto">guida completa</Link>.
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
          Gli schemi qui sopra sono il punto di partenza. Il giorno migliore esatto te lo svela il
          calendario dell’affluenza di ogni pagina di parco — verde, giallo, rosso, fino a un anno
          in anticipo, con le vacanze e i giorni festivi della regione interessata.
        </P>
        <SplitFigure
          src="/images/parks/efteling/symbolica.jpg"
          alt="L’attrazione del palazzo Symbolica a Efteling"
          kicker="Verde, giallo, rosso"
          title="Un colore al giorno, un anno in anticipo"
          badge={<CrowdLevelBadge level="low" />}
        >
          Ogni pagina di parco porta una previsione giorno per giorno che tiene conto delle vacanze
          scolastiche e dei giorni festivi di quella precisa regione. Scegli un giorno verde e hai
          fatto il novanta per cento della pianificazione prima ancora di aver prenotato.
        </SplitFigure>
        <P>Qualche parco popolare per iniziare subito:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Alimentato da Fancast"
        body="Il nostro modello di previsione — anticipa l’affluenza fino a 365 giorni in anticipo e si dà un voto in modo trasparente."
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
