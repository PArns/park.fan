import { CalendarDays, Clock, Footprints, Gauge, Users, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** The planner page's article, Italian. See `content/de.tsx` for the convention. */
export function ContentIT({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="una-giornata-pianificata"
        index="01"
        icon={CalendarDays}
        kicker="La giornata come linea del tempo"
        title="Blocchi e cambi"
      >
        <P>
          Ogni attrazione del tuo piano è un blocco sulla linea del tempo della giornata, alto
          quanto la coda che ti aspetta a quell&apos;ora. Se lo trascini in un&apos;ora più
          affollata cresce, in una più tranquilla si accorcia. Tra due blocchi c&apos;è il cambio,
          con la distanza dalla prossima attrazione e l&apos;indicazione se il tempo basta.
          «Stretto» vuol dire che non torna più appena l&apos;attesa precedente si discosta quanto
          al solito.
        </P>
        <P>
          Qui sotto c&apos;è un piano per <A href={PARK}>Phantasialand</A> per sabato 12 settembre
          2026, con le attese previste per quel giorno il 4 settembre. Trascina un blocco su
          un&apos;altra ora e vengono ricalcolati la sua altezza e i cambi. Nel tuo piano non
          finisce niente di tutto questo.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Sul blocco selezionato ci sono l&apos;ora, l&apos;attesa prevista e di quanto la
          previsione per quell&apos;attrazione di solito si sbaglia.
        </Note>
        <P>
          Su uno schermo largo due giornate stanno una accanto all&apos;altra, per esempio sabato e
          domenica, o due parchi. Per ciascuna c&apos;è l&apos;attesa complessiva, così vedi in
          quale giorno fai meno coda.
        </P>
      </Chapter>

      <Chapter
        id="da-dove-viene-il-numero"
        index="02"
        icon={Gauge}
        kicker="Previsione"
        title="Da dove vengono i tempi di attesa"
      >
        <P>
          Ogni attrazione ha una previsione per tutta la giornata, ora per ora. Questo sabato Black
          Mamba scende da 35 minuti a mezzogiorno a 20 in serata, mentre Chiapas è a 20 minuti alle
          dieci e un quarto e a 35 nel pomeriggio. Quel giorno Black Mamba va quindi messa verso
          sera, Chiapas al mattino.
        </P>
        <P>
          Di quanto la previsione per un&apos;attrazione di solito si sbaglia è scritto sul suo
          blocco, 15 minuti per <A href={`${PARK}/taron`}>Taron</A> questo sabato. Più il giorno è
          lontano, più il numero è approssimativo, e accanto c&apos;è scritto come è stato ottenuto,
          da «Previsione oraria» a «Stima approssimativa», passando per «Dalla previsione del
          giorno».
        </P>
        <P>
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> mostra i suoi tempi
          di attesa solo nella propria app, con il wifi del parco, quindi per questo parco non ci
          sono numeri. Puoi comunque pianificarci una giornata, solo senza minuti e senza i pulsanti
          per riordinare.
        </P>
      </Chapter>

      <Chapter
        id="chi-viene"
        index="03"
        icon={Users}
        kicker="Gruppo"
        title="Altezza minima e attrazioni ad acqua"
      >
        <P>
          Una nuova giornata comincia con quattro domande: quale parco, quale giorno, chi viene e
          quali grandi attrazioni entrano nel piano. Nel calendario del mese ogni giorno ha il
          colore dell&apos;affluenza prevista, e il{' '}
          <A href={`${PARK}/calendario-tempi-attesa`}>calendario dei tempi di attesa</A> del parco
          dà più dettagli.
        </P>
        <P>
          Se ci sono bambini, indichi quanto è alto il più basso e se preferite restare asciutti. Le
          attrazioni con un&apos;altezza minima maggiore e quelle ad acqua ricevono allora un segno
          e restano comunque nella lista, perché solo voi sapete se qualcuno aspetterà
          all&apos;uscita tenendo le borse. A Phantasialand Taron chiede{' '}
          {DEMO_PARTY_RIDES.taron.minimumHeight} cm e Chiapas{' '}
          {DEMO_PARTY_RIDES.chiapas.minimumHeight} cm, e su Chiapas ci si bagna (dati al 29
          settembre 2026). Con un bambino di 120 cm, entrambe portano il segno.
        </P>
        <Note>
          Dove non abbiamo un&apos;altezza minima registrata, come per Moptis Monkey Depot,
          l&apos;attrazione resta senza segno. All&apos;ingresso dell&apos;attrazione vale quello
          che stabilisce il parco.
        </Note>
      </Chapter>

      <Chapter
        id="la-giornata"
        index="04"
        icon={Clock}
        kicker="La giornata"
        title="Orari, spettacoli e pause"
      >
        <P>
          Questo sabato Phantasialand apre alle 9, ma Taron, F.L.Y. e quasi tutte le altre grandi
          attrazioni partono solo dalle 10. Se arrivi alle nove, comincia da Black Mamba o Maus au
          Chocolat. Un blocco non si può spostare prima dell&apos;apertura della sua attrazione.
        </P>
        <P>
          Gli orari degli spettacoli sono anche sulla linea del tempo. Per oggi sono quelli del
          parco. Per i giorni successivi nessuna fonte li pubblica, quindi prendiamo quelli
          dell&apos;ultimo giorno della settimana uguale e aggiungiamo «Previsto».
        </P>
        <P>
          Pause, pasti o un punto d&apos;incontro vanno in un blocco personale, lungo quanto ti
          serve. Se quando crei la giornata scegli «Prevedi il pranzo», alle 12:30 ce n&apos;è già
          uno. Sopra la giornata trovi anche vacanze scolastiche e festivi e, fino a circa due
          settimane prima, il meteo.
        </P>
      </Chapter>

      <Chapter
        id="ordine-della-giornata"
        index="05"
        icon={Wand2}
        kicker="Riordino"
        title="Far riordinare la giornata"
      >
        <P>
          Con due pulsanti riordini la giornata senza spostare a mano ogni blocco. «Pianifica tutte
          le attrazioni principali» aggiunge le grandi attrazioni che mancano ancora e poi ordina
          tutta la giornata. «Ottimizza la giornata» riordina solo quello che è già nel piano. In
          entrambi i casi tutto sta prima della chiusura del parco e fai la coda più breve
          possibile.
        </P>
        <P>
          La pausa pranzo e le attrazioni già spuntate restano dove sono. Dopo vedi quanti minuti di
          coda risparmi, e «Annulla» riporta la situazione di prima.
        </P>
        <P>
          Se non ci sta tutto nella giornata, si apre un assistente. Prima propone modifiche che
          fanno spazio senza togliere attrazioni, come una pausa pranzo più corta. Se non basta,
          metti le attrazioni in ordine di importanza e si taglia dal basso.
        </P>
      </Chapter>

      <Chapter
        id="nel-parco"
        index="06"
        icon={Footprints}
        kicker="Nel parco"
        title="Il giorno stesso"
      >
        <P>
          Nel parco spunti quello che hai già fatto. Sul blocco compare allora l&apos;attesa
          segnalata al momento della spunta e di quanto la stima si è discostata. Se
          un&apos;attrazione in programma risulta chiusa in quel momento, anche questo compare sul
          suo blocco.
        </P>
        <P>
          Con le notifiche ti avvisiamo quando è ora di andare alla prossima attrazione, quando
          un&apos;attrazione in programma chiude o riapre e quando un&apos;attesa cambia molto. Puoi
          farti mandare anche gli orari degli spettacoli. Scegli tu cosa ricevere.
        </P>
        <P>
          Il piano resta nel tuo browser e non serve un account. Solo per le notifiche teniamo una
          copia sul nostro server, che sparisce appena le disattivi. Finché c&apos;è, puoi mandare
          un link al piano, e chi lo apre può prenderlo come copia sua.
        </P>
      </Chapter>
    </>
  );
}
