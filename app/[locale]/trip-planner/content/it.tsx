import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/** L'articolo della pagina del pianificatore, italiano. Vedi `content/de.tsx` per la convenzione. */
export function ContentIT({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="una-giornata-pianificata"
        index="01"
        icon={CalendarDays}
        kicker="La giornata come linea del tempo"
        title="Blocchi e trasferimenti"
      >
        <P>
          Un blocco è un&apos;attrazione, e la sua altezza è l&apos;attesa prevista per la sua ora.
          Trascina lo stesso blocco in un&apos;ora affollata e cresce; mettilo in una più tranquilla
          e si accorcia. Fra due blocchi c&apos;è il trasferimento: quanta strada c&apos;è e se il
          tempo basta. L&apos;uscita dalla stazione e il giro stesso sono conteggiati nel
          trasferimento.
        </P>
        <P>
          La linea del tempo qui sotto è fatta degli stessi componenti del pianificatore e mostra la
          risposta che l&apos;API ha dato il 4 settembre 2026 per sabato 12 settembre al{' '}
          <A href={PARK}>Phantasialand</A>. Trascina un blocco su un&apos;altra ora. Si aggancia a
          passi di cinque minuti, e la sua altezza e i trasferimenti accanto vengono ricalcolati.
          Qui non viene salvato nulla.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Sul blocco selezionato c&apos;è la stessa cosa a parole: l&apos;ora, l&apos;attesa
          prevista e di quanto la previsione su quell&apos;attrazione sbaglia di solito.
        </Note>
      </Chapter>

      <Chapter
        id="da-dove-viene-il-numero"
        index="02"
        icon={Gauge}
        kicker="Il numero sul blocco"
        title="Da dove vengono i minuti e quanto valgono"
      >
        <P>
          Per ogni attrazione l&apos;API restituisce una curva sulla giornata, ora per ora. Quel
          sabato Taron segna 45 minuti alle dieci, 50 alle undici, 40 all&apos;una e di nuovo 50 la
          sera, appena dieci minuti di differenza su tutta la giornata. Siccome per Taron quel
          giorno non c&apos;è una buona finestra, finisce dove il resto della giornata lascia
          spazio. Black Mamba scende da 35 minuti a mezzogiorno a 20 alle sei, e Chiapas fa il
          contrario, da 20 a 35.
        </P>
        <P>
          A questo si aggiunge di quanto il numero sbaglia di solito, e più lunga è la coda, più
          ampia la dispersione. Per le attrazioni il cui picco di giornata arriva a 35 minuti o più,
          l&apos;API indica quel sabato un errore tipico di 15,4 minuti, e di 10,9 per quelle più
          piatte. In metà delle giornate l&apos;attesa reale si scosta di più. Perciò sul blocco
          selezionato compare come un più-meno. Come intervallo darebbe l&apos;impressione che
          l&apos;attesa reale ci cada sicuramente dentro.
        </P>
        <Note>
          Dietro la curva di Taron ci sono 142 giorni misurati, dietro Black Mamba 161. Quanti siano
          è scritto sulla <A href={`${PARK}/taron`}>pagina dell&apos;attrazione</A>.
        </Note>
        <P>
          Accanto al numero c&apos;è anche il tipo di previsione. Se il modello calcola la giornata
          ora per ora, è indicato. Se l&apos;altezza del giorno viene dalla previsione e la forma da
          giornate precedenti, come quel sabato, è indicato questo. Abbastanza in anticipo
          quell&apos;altezza è già incerta e resta una stima approssimativa. Per una giornata mai
          misurata non esiste alcun piano con dei numeri.
        </P>
      </Chapter>

      <Chapter
        id="orari-di-apertura"
        index="03"
        icon={Sunrise}
        kicker="Apertura"
        title="Attrazioni che aprono dopo il parco"
      >
        <P>
          Quel sabato il Phantasialand apre alle 9. Taron, F.L.Y., entrambe le Winja&apos;s e Raik
          partono alle 10, Chiapas alle 10:15. Chi è al tornello alle nove può scegliere fra Black
          Mamba e Maus au Chocolat. Quel giorno, quindi, un piano che riempie la prima ora con le
          attrazioni di punta non regge.
        </P>
        <P>
          Ogni attrazione ha il suo orario di apertura, e un blocco si può mettere solo da
          quell&apos;ora in poi. Per la sera manca un limite del genere, perché nessun feed segnala
          in modo affidabile quando un&apos;attrazione chiude; la linea del tempo si ferma
          all&apos;orario di chiusura del parco.
        </P>
      </Chapter>

      <Chapter
        id="trasferimenti"
        index="04"
        icon={Footprints}
        kicker="La strada in mezzo"
        title="Quanto ci metti da un'attrazione all'altra"
      >
        <P>
          Un feed di tempi di attesa segnala 50 minuti per Taron. Se da Rookburgh ci arrivi in tempo
          lo calcola il trasferimento. Parte dalla distanza fra le coordinate delle due attrazioni,
          più tre minuti per uscire da una stazione e tre per salire e fare il giro dove non è nota
          alcuna durata.
        </P>
        <P>
          Quella distanza è in linea d&apos;aria, e viene chiamata così. A piedi la strada è più
          lunga, perché i vialetti girano intorno all&apos;acqua, alle code e ai sensi unici e il
          Phantasialand impila Rookburgh e Klugheim uno sopra l&apos;altro. Il limite superiore si
          calcola quindi a passo da parco anziché a passo svelto, con due terzi in più sulla linea
          d&apos;aria per il giro largo.
        </P>
        <Note>
          Un trasferimento è «stretto» quando non regge più appena la previsione sbaglia di quanto
          lei stessa dichiara. Se l&apos;API non fornisce una dispersione, il giudizio si ferma a
          «buono», e nel titolo è indicato anche questo.
        </Note>
      </Chapter>

      <Chapter
        id="ordine-della-giornata"
        index="05"
        icon={Wand2}
        kicker="Riordino"
        title="Far riordinare la giornata"
      >
        <P>
          Ci pensano due pulsanti, con lo stesso calcolo dietro. «Pianifica tutte le attrazioni
          principali» aggiunge quelle grandi del parco che ancora mancano e poi rimette in fila
          tutto. «Ottimizza la giornata» riordina soltanto quello che è già in programma. Il primo
          pulsante ti serve quando mancano ancora attrazioni grandi, il secondo quando vuoi solo
          migliorare l&apos;ordine.
        </P>
        <P>
          Le regole per riordinare sono quattro, in questa gerarchia. Prima viene la tua: quello che
          porti in testa è l&apos;ultimo a saltare. Poi tutto deve starci prima della chiusura, e
          un&apos;attrazione in meno che si fa di sicuro batte una in più che arriverebbe troppo
          tardi. Segue la somma delle attese, e a parità di somma vince l&apos;ordine che finisce
          prima. Non c&apos;è un cursore per bilanciare la coda con il tempo passato ad aspettare,
          perché per quel rapporto non esiste un valore che si possa giustificare.
        </P>
        <P>
          Per il mattino presto non c&apos;è una regola a parte, solo la curva oraria di ogni
          attrazione. Se il punto più basso cade subito dopo l&apos;apertura, «prima
          l&apos;attrazione grande» esce dal calcolo da sé; se la curva è piatta, esce altro. In una
          giornata misurata Taron segna ora dopo ora 60, 60, 54, 53 e 59 minuti, mentre Chiapas sale
          di 22.
        </P>
        <P>
          A volte la proposta è di aspettare un giro invece di mettersi subito in coda. Succede
          quando la coda cala abbastanza perché, pausa compresa, si torni liberi prima che
          mettendosi in fila adesso. Stare meno in coda non basta, perché la giornata non deve
          finire più tardi a causa della pausa. Una pausa così dura al massimo due ore, e a quel
          limite non arriva quasi mai, dato che una pausa conviene solo se è più corta della coda
          che fa risparmiare, e due ore di pausa richiederebbero una coda di oltre due ore.
        </P>
        <P>
          Una pausa pranzo all&apos;una resta all&apos;una, e un&apos;attrazione spuntata resta
          dov&apos;è; il resto si dispone intorno. Dopo il clic vedi che cosa è cambiato. «18 min di
          coda in meno» è la differenza fra due conti fatti allo stesso modo, uno prima del clic e
          uno dopo. Se non c&apos;è niente da guadagnare, c&apos;è scritto che l&apos;ordine va già
          bene, e il piano resta com&apos;era. Dopo il pulsante delle attrazioni principali, al
          posto di un risparmio vedi quante attrazioni sono state aggiunte e quante non fanno per il
          gruppo, perché con le nuove attrazioni la giornata si allunga. Quello che alla fine non
          entra più nella giornata viene segnalato dopo entrambi i pulsanti. «Annulla» rimette lo
          stato di prima del clic, finché il pianificatore resta aperto.
        </P>
        <Note>
          Dove non arriva nessun tempo di attesa, i due pulsanti mancano. All&apos;Hansa-Park ogni
          attrazione costa lo stesso zero presunto, quindi un ordine vale l&apos;altro.
        </Note>
      </Chapter>

      <Chapter
        id="orari-degli-spettacoli"
        index="06"
        icon={Theater}
        kicker="Spettacoli"
        title="Da dove vengono gli orari degli spettacoli"
      >
        <P>
          Per oggi l&apos;API ha l&apos;orario pubblicato dal parco. Per qualsiasi altra data
          riporta in avanti l&apos;ultimo giorno della settimana uguale, perché nessuna fonte
          pubblica gli orari in anticipo, e indica da quale data vengono e su quanti giorni si
          reggono. Un riporto ha una tilde davanti all&apos;ora e la parola «previsto»; un orario
          del parco non ha né l&apos;una né l&apos;altra.
        </P>
        <P>
          Quel sabato tutti gli orari sono riportati: quelli di Dragon Drago e Kroka&apos;s Lodge
          dal 15 agosto, quelli dei Miji African Dancers dal 29. L&apos;ultima replica di
          Kroka&apos;s Lodge alle 19 non compare sulla linea del tempo, perché il parco chiude alle
          18 e gli orari riportati oltre quell&apos;ora vengono scartati.
        </P>
      </Chapter>

      <Chapter
        id="limiti"
        index="07"
        icon={HelpCircle}
        kicker="Limiti"
        title="Dati che mancano e dove viene salvato il piano"
      >
        <P>
          L&apos;
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> mostra i suoi tempi
          di attesa solo nella sua app sul wifi del parco, quindi per lui non arriverà mai un
          numero, e noi non ce lo inventiamo. La previsione meteo arriva a circa due settimane;
          oltre quel punto il pannello lo dice, invece di lasciare un vuoto che si leggerebbe come
          «resterà asciutto».
        </P>
        <P>
          Il giorno stesso un&apos;attrazione può fermarsi, uno spettacolo può saltare o un
          temporale può scombinare il pomeriggio. Il piano calcola se la giornata può reggere con le
          attese previste. Nel parco spunti le attrazioni che hai fatto, e accanto a ciascuna
          compare l&apos;attesa che c&apos;era davvero.
        </P>
        <P>
          Il piano resta nel tuo browser e non ti serve un account. Solo quando attivi le notifiche
          mettiamo una copia sul nostro server, e lo segnaliamo in quel momento. Senza un piano si
          parte dall&apos;assistente con le quattro domande da chiarire prima: quale parco, quale
          giorno, chi viene e quali grandi attrazioni devono entrare nella giornata. Il giorno
          giusto si trova meglio nel{' '}
          <A href={`${PARK}/calendario-tempi-attesa`}>calendario dei tempi di attesa</A> del parco.
        </P>
      </Chapter>
    </>
  );
}
