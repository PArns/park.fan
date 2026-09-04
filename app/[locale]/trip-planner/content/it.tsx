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
        title="Che cosa fa il pianificatore di una giornata al parco"
      >
        <P>
          Un blocco è un&apos;attrazione, e la sua altezza è l&apos;attesa prevista per la sua ora.
          Trascina lo stesso blocco in un&apos;ora affollata e cresce; mettilo in una più tranquilla
          e si accorcia. Fra due blocchi non c&apos;è spazio vuoto ma il trasferimento: quanta
          strada c&apos;è e se il tempo basta. L&apos;uscita dalla stazione e il giro stesso sono
          contati lì, non nel blocco.
        </P>
        <P>
          Niente di quello che segue è ridisegnato. Sono gli stessi componenti che girano nel
          pianificatore, alimentati con la risposta che l&apos;API ha dato il 4 settembre 2026 per
          sabato 12 settembre al <A href={PARK}>Phantasialand</A>. Trascina un blocco su
          un&apos;altra ora: si aggancia a passi di cinque minuti, ricalcola la propria altezza e
          con essa i trasferimenti accanto. Qui non viene salvato nulla.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Il blocco selezionato lo dice a parole: l&apos;ora, l&apos;attesa prevista e di quanto la
          previsione su quell&apos;attrazione sbaglia di solito.
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
          sera. È il vero motivo per fare Taron presto: non perché la mattina sia sempre più
          tranquilla, ma perché quella giornata non ha nessuna ora scarica per
          quell&apos;attrazione. Black Mamba fa il contrario e scende da 35 minuti a mezzogiorno a
          20 alle sei, mentre Chiapas sale da 20 a 35.
        </P>
        <P>
          A questo si aggiunge di quanto il numero sbaglia di solito, e questo segue il livello: più
          lunga è la coda, più ampia la dispersione. Per le attrazioni il cui picco di giornata
          arriva a 35 minuti o più, l&apos;API indica quel sabato un errore tipico di 15,4 minuti, e
          di 10,9 per quelle più piatte. Tipico vuol dire che metà delle giornate si scosta di più.
          Perciò il pianificatore lo scrive come un più-meno sul blocco selezionato e mai come un
          intervallo che contenga già la risposta giusta.
        </P>
        <Note>
          Dietro la curva di Taron ci sono 142 giorni misurati, dietro Black Mamba 161. Quanti siano
          è scritto sulla <A href={`${PARK}/taron`}>pagina dell&apos;attrazione</A>.
        </Note>
        <P>
          Il pianificatore dice anche che tipo di previsione ha in mano. Se il modello calcola la
          giornata ora per ora, lo scrive. Se l&apos;altezza del giorno viene dalla previsione e la
          forma da giornate precedenti, come quel sabato, scrive quello. Abbastanza in anticipo
          quell&apos;altezza diventa sottile e resta una stima approssimativa. Per una giornata mai
          misurata non esiste alcun piano con dei numeri.
        </P>
      </Chapter>

      <Chapter
        id="orari-di-apertura"
        index="03"
        icon={Sunrise}
        kicker="Apertura"
        title="Il parco apre alle nove, l'attrazione alle dieci"
      >
        <P>
          Quel sabato il Phantasialand apre alle 9. Taron, F.L.Y., entrambe le Winja&apos;s e Raik
          partono alle 10, Chiapas alle 10:15. Chi è al tornello alle nove può fare Black Mamba o
          Maus au Chocolat, e la lista finisce lì. Non è un dettaglio: un piano che riempie la prima
          ora con le attrazioni di punta sta pianificando un&apos;ora che non esiste.
        </P>
        <P>
          Il pianificatore conosce l&apos;orario di apertura di ogni singola attrazione e non lascia
          scivolare un blocco prima di quello. Per la sera non c&apos;è un corrispettivo: nessun
          feed segnala in modo affidabile quando un&apos;attrazione chiude, quindi non viene
          affermato nulla. La linea del tempo si ferma all&apos;orario di chiusura del parco.
        </P>
      </Chapter>

      <Chapter
        id="trasferimenti"
        index="04"
        icon={Footprints}
        kicker="La strada in mezzo"
        title="Fra due attrazioni c'è una strada, e costa tempo"
      >
        <P>
          Un feed di tempi di attesa può dire che Taron è a 50 minuti. Quello che non può dire è che
          da Rookburgh non ci arrivi in tempo. Il trasferimento serve a questo. Parte dalla distanza
          fra le coordinate delle due attrazioni, più tre minuti per uscire da una stazione e tre
          per salire e fare il giro dove non è nota alcuna durata.
        </P>
        <P>
          Quella distanza è in linea d&apos;aria, e viene chiamata così. È un limite inferiore e mai
          un tempo di cammino: i vialetti girano intorno all&apos;acqua, alle code e ai sensi unici,
          e il Phantasialand impila Rookburgh e Klugheim uno sopra l&apos;altro. Il limite superiore
          si calcola quindi a passo da parco anziché a passo svelto, con due terzi in più sulla
          linea d&apos;aria per il giro largo.
        </P>
        <Note>
          «Stretto» non vuol dire corto. Vuol dire che quel trasferimento non regge più se la
          previsione sbaglia quanto lei stessa dichiara. Dove l&apos;API non fornisce una
          dispersione, il giudizio si ferma a «buono» e lo dice nel proprio titolo.
        </Note>
      </Chapter>

      <Chapter
        id="ordine-della-giornata"
        index="05"
        icon={Wand2}
        kicker="Riordino"
        title="La giornata può mettersi in ordine da sola"
      >
        <P>
          Ci pensano due pulsanti. «Pianifica tutte le attrazioni principali» aggiunge quelle grandi
          del parco che ancora non sono nella giornata e poi rimette in fila tutto. «Ottimizza la
          giornata» non aggiunge nulla e riordina soltanto quello che è già in programma. Dietro
          entrambi gira lo stesso calcolo; sono due pulsanti perché sono due domande: riempimi la
          giornata, e l&apos;ordine si può fare meglio.
        </P>
        <P>
          Si ordina secondo tre cose, e la gerarchia fra loro è la decisione vera. Prima di tutto
          che ci sia ancora tempo prima della chiusura: un piano con un&apos;attrazione in meno che
          si fa davvero batte un piano con una in più che non si farà. Poi la somma delle attese,
          che è quello che era stato chiesto. E a parità di costo vince l&apos;ordine che finisce
          prima. Non c&apos;è nessun cursore che bilanci la coda con il tempo passato ad aspettare:
          quel numero non lo saprebbe difendere nessuno.
        </P>
        <P>
          Non c&apos;è dentro nessuna regola sul mattino presto. Il pianificatore conosce solo la
          curva oraria di ogni singola attrazione. Se il punto più basso cade subito dopo
          l&apos;apertura, «prima l&apos;attrazione grande» esce dal calcolo da sé; se la curva è
          piatta, esce altro. In una giornata misurata Taron segna ora dopo ora 60, 60, 54, 53 e 59
          minuti, mentre Chiapas sale di 22. Una regola fissa darebbe a entrambe lo stesso
          consiglio.
        </P>
        <P>
          A volte la proposta è di aspettare un giro invece di mettersi subito in coda. Succede a
          una sola condizione: la coda deve calare abbastanza perché, pausa compresa, si torni
          liberi prima che mettendosi in fila adesso. Stare meno in coda da solo non basta, e da
          questo conto la giornata non si allunga mai. Più di due ore non fa aspettare nessuno. Quel
          tetto da solo non entra quasi mai in gioco: una pausa conviene solo se è più corta della
          coda che fa risparmiare, e due ore di pausa richiederebbero quindi una coda di oltre due
          ore.
        </P>
        <P>
          Una pausa pranzo all&apos;una resta all&apos;una, e un&apos;attrazione spuntata è già
          stata fatta e non viene ripianificata; il resto si dispone intorno. Dopo c&apos;è scritto
          che cosa è successo. «18 min di coda in meno» è la differenza fra due conti fatti allo
          stesso modo, uno prima del clic e uno dopo; se non c&apos;è niente da guadagnare, c&apos;è
          scritto che l&apos;ordine va già bene e il piano resta com&apos;era. Il pulsante delle
          attrazioni principali non annuncia un risparmio, perché con le nuove attrazioni la
          giornata si allunga; conta invece quante attrazioni sono state aggiunte e quante non fanno
          per il gruppo. Quello che alla fine non entra più nella giornata viene segnalato dopo
          entrambi i pulsanti. Insieme arriva un «Annulla» che rimette lo stato di prima del clic,
          finché il pianificatore resta aperto.
        </P>
        <Note>
          Dove non arriva nessun tempo di attesa, i due pulsanti non compaiono nemmeno.
          All&apos;Hansa-Park ogni attrazione costa lo stesso zero presunto, quindi un ordine vale
          l&apos;altro e non c&apos;è niente da riordinare.
        </Note>
      </Chapter>

      <Chapter
        id="orari-degli-spettacoli"
        index="06"
        icon={Theater}
        kicker="Spettacoli"
        title="Un orario viene dal parco oppure dal nostro calcolo"
      >
        <P>
          Per oggi l&apos;API ha l&apos;orario pubblicato dal parco. Per qualsiasi altra data
          nessuna fonte lo conosce in anticipo, quindi riporta in avanti l&apos;ultimo giorno della
          settimana uguale e dice da quale data vengono gli orari e su quanti giorni si reggono. I
          due non devono somigliarsi: un riporto riceve una tilde davanti all&apos;ora e la parola
          «previsto», un orario del parco nessuna delle due.
        </P>
        <P>
          Quel sabato tutti gli orari sono riportati: quelli di Dragon Drago e Kroka&apos;s Lodge
          dal 15 agosto, quelli dei Miji African Dancers dal 29. L&apos;ultima replica di
          Kroka&apos;s Lodge alle 19 non compare sulla linea del tempo: il parco chiude alle 18,
          quindi gli orari riportati oltre quell&apos;ora vengono scartati.
        </P>
      </Chapter>

      <Chapter
        id="limiti"
        index="07"
        icon={HelpCircle}
        kicker="Limiti"
        title="Quello che il pianificatore non sa"
      >
        <P>
          Non tutti i parchi pubblicano i tempi di attesa. L&apos;
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> mostra i propri solo
          nella sua app sul wifi del parco, quindi per lui non arriverà mai un numero e il
          pianificatore non se lo inventa. Per date lontane non c&apos;è nemmeno il meteo: la
          previsione arriva a circa due settimane e oltre quel punto il pannello lo dice, invece di
          lasciare un vuoto che si leggerebbe come «resterà asciutto».
        </P>
        <P>
          E quanto costi davvero un piano lo decide la giornata. Un&apos;attrazione si ferma, uno
          spettacolo salta, un temporale ribalta il pomeriggio. Il piano non è quindi un orario ma
          un conto sulla domanda se la giornata possa reggere così. Nel parco spunti quello che hai
          fatto, e il pianificatore annota l&apos;attesa che c&apos;era davvero.
        </P>
        <P>
          Tutto questo resta nel tuo browser. Nessun account, nessun server, nessuna
          sincronizzazione: il piano è un file nella tua memoria, e chi apre il pianificatore senza
          averne uno trova l&apos;assistente con le tre domande che vengono prima. Quale parco,
          quale giorno, chi viene. Il giorno si sceglie meglio nel{' '}
          <A href={`${PARK}/calendario-tempi-attesa`}>calendario dei tempi di attesa</A> del parco.
        </P>
      </Chapter>
    </>
  );
}
