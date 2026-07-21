 
import React from 'react';
import { Link } from '@/i18n/navigation';
import { MLStatsSection } from '@/components/home/ml-stats-section';
import { CrowdLevelBadge } from '@/components/parks/crowd-level-badge';
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
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import {
  Lead,
  Section,
  P,
  Highlight,
  TocNav,
  IngredientGrid,
  IngredientCard,
  CrowdLegend,
  TouchpointList,
  FaqList,
} from '../_fancast-ui';

const FAQ = [
  {
    question: 'Quanto è preciso Fancast?',
    answer:
      'La precisione attuale è mostrata in tempo reale in cima a questa pagina — come MAE (errore medio in minuti), RMSE e MAPE. Quei numeri nascono dal confronto reale tra le previsioni passate e i tempi di attesa effettivamente misurati, non da un laboratorio di prova compiacente. Cambiano ogni volta che il modello si riaddestra.',
  },
  {
    question: 'Con quanto anticipo può prevedere Fancast?',
    answer:
      'Fancast fornisce livelli di affollamento giornalieri per un parco fino a 365 giorni in anticipo. Per le singole attrazioni produce anche previsioni dei tempi di attesa ora per ora. Più il giorno si avvicina, più pesano i segnali a breve termine come le previsioni meteo.',
  },
  {
    question: 'Ogni quanto viene aggiornato il modello?',
    answer:
      'Ogni giorno. Fancast si riaddestra automaticamente una volta al giorno alle 06:00 UTC sui dati più freschi — inclusi i tempi di attesa di ieri. Quindi, letteralmente, migliora un pochino ogni mattina.',
  },
  {
    question: 'Quali dati usa Fancast?',
    answer:
      'Tempi di attesa in tempo reale e storici da oltre 150 parchi, calendari di vacanze scolastiche e festività (anche delle regioni vicine), previsioni meteo, orari di apertura, eventi speciali e schemi stagionali. Da questo mix nascono i livelli di affollamento giornalieri e le previsioni dei tempi di attesa ora per ora.',
  },
  {
    question: 'Perché un parco mostra «Nessuna previsione»?',
    answer:
      'Fancast valuta un parco solo quando ci sono abbastanza dati di esercizio — almeno una trentina di giorni di apertura. I parchi nuovissimi o aperti di rado non hanno ancora questa base, quindi preferiamo mostrare onestamente «Nessuna previsione» piuttosto che un numero tirato a indovinare.',
  },
  {
    question: 'Fancast ha un costo?',
    answer:
      'No. Come tutto park.fan, ogni previsione, calendario di affollamento e statistica è gratuita, senza pubblicità e utilizzabile senza account.',
  },
] as const;

export function ContentIT() {
  return (
    <div className="space-y-14 text-base leading-7">
      {/* Intro */}
      <div className="space-y-5">
        <Lead>
          Fancast è il nostro modello di previsione interno — la parte di park.fan che guarda al futuro.
          Il nome? Sfacciato ma sistematico: <strong>fan</strong> come in park.<strong>fan</strong>,{' '}
          <strong>cast</strong> come in fore<strong>cast</strong>. Un bollettino meteo per le code,
          insomma.
        </Lead>
        <P>
          L’idea è tanto semplice quanto ambiziosa: Fancast legge milioni di tempi di attesa reali in
          tempo reale e prevede quanto sarà affollato un parco in un giorno qualsiasi — fino a 365 giorni
          in anticipo. Se il sabato vale la pena, o se ti fai un favore con il martedì. Verde, giallo o
          rosso, molto prima di essere in auto.
        </P>
        <P>
          E poiché ci fidiamo solo dei numeri che devono dimostrarsi, Fancast fa qualcosa che la maggior
          parte dei modelli evita in sordina: si dà un voto da solo. Ogni previsione viene poi confrontata
          con il tempo di attesa realmente accaduto — alla luce del sole, proprio qui su questa pagina.
          Barare è inutile.
        </P>
        <Highlight>
          In breve: Fancast non è un indovino con la sfera di cristallo. È uno statistico testardo che
          ogni sera prende ripetizioni e ogni mattina deve rifare l’esame. Una rana meteo che
          verifica il proprio meteo.
        </Highlight>

        <TocNav
          label="Indice"
          items={[
            ['#note', 'La pagella in tempo reale'],
            ['#ingredients', 'Cosa legge Fancast'],
            ['#training', 'Come impara Fancast'],
            ['#levels', 'Verde, giallo, rosso'],
            ['#where', 'Dove incontri Fancast'],
            ['#limits', 'Dove sono i limiti'],
            ['#faq', 'Domande frequenti'],
          ]}
        />
      </div>

      {/* Live scorecard — reuses the homepage ML section (live from the dashboard) */}
      <div id="note" className="scroll-mt-20 space-y-4">
        <P>
          Basta preamboli — ecco la pagella, in tempo reale e senza filtri. Fancast tira fuori questi
          numeri dalla sua stessa dashboard in questo momento; cambiano non appena il modello si
          riaddestra stanotte:
        </P>
      </div>
      <div className="-mx-4">
        <MLStatsSection />
      </div>

      {/* What it reads */}
      <Section id="ingredients" title="Cosa legge Fancast" icon={Database}>
        <P>
          Un ponte piovoso di ottobre è tutta un’altra bestia rispetto a un sabato di vacanza soleggiato
          di luglio — e un modello deve prima impararlo. Per questo Fancast si nutre di più fonti
          contemporaneamente:
        </P>
        <IngredientGrid>
          <IngredientCard icon={Activity} title="Tempi di attesa in tempo reale">
            Milioni di rilevazioni reali da oltre 150 parchi, aggiornate al minuto. La materia prima di
            ogni previsione.
          </IngredientCard>
          <IngredientCard icon={CalendarDays} title="Calendari e vacanze">
            Fine settimana, festività e vacanze scolastiche — anche quelle delle regioni vicine, perché
            ai gitanti di un giorno i confini non interessano.
          </IngredientCard>
          <IngredientCard icon={CloudSun} title="Meteo">
            Probabilità di pioggia e temperatura piegano le previsioni a breve termine. Il sole richiama
            la folla, la pioggia per tutto il giorno svuota i viali.
          </IngredientCard>
          <IngredientCard icon={PartyPopper} title="Eventi e stagione">
            Halloween, vacanze estive, ponti, una grande novità nella sua prima estate — i soliti
            sospetti di una giornata affollata.
          </IngredientCard>
          <IngredientCard icon={History} title="Storico">
            Anni di storico dei tempi di attesa per parco. Schemi che si vedono solo se li fissi
            abbastanza a lungo.
          </IngredientCard>
          <IngredientCard icon={Gauge} title="Orari e capacità">
            Quando apre il parco, per quanto tempo, con quale capacità — la cornice in cui si incastra
            tutto il resto.
          </IngredientCard>
        </IngredientGrid>
        <P>
          Da questo miscuglio il modello ricava due cose: una{' '}
          <strong>previsione oraria dei tempi di attesa</strong> per le singole attrazioni e un{' '}
          <strong>voto di affollamento giornaliero</strong> per l’intero parco.
        </P>
      </Section>

      {/* How it learns */}
      <Section id="training" title="Come impara Fancast (e non può barare)" icon={RefreshCw}>
        <P>
          Il trucco più importante è tutt’altro che spettacolare: Fancast si riaddestra{' '}
          <strong>ogni notte</strong>, tutti i giorni alle 06:00 UTC. Quello che è successo ieri, il
          modello lo sa oggi. Un appassionato di montagne russe invecchia e si stanca con gli anni —
          Fancast diventa un po’ più sveglio ogni mattina.
        </P>
        <P>
          E viene testato solo su giorni che non ha <strong>mai visto</strong> — sul futuro, non su giorni
          del passato imparati a memoria. Qualsiasi altra cosa sarebbe come infilarsi da soli le domande
          d’esame in anticipo e poi festeggiare la propria pagella piena di dieci.
        </P>
        <P>
          Inoltre Fancast tiene d’occhio se sta <strong>andando alla deriva</strong> — se la realtà gli
          sta lentamente sfuggendo. E una nuova versione del modello va in linea solo se batte davvero la
          vecchia in un confronto leale. Democrazia tra algoritmi: se non sei migliore, resti in panchina.
        </P>
      </Section>

      {/* Crowd levels */}
      <Section id="levels" title="Verde, giallo, rosso: i livelli di affollamento" icon={Gauge}>
        <P>
          Alla fine di tutto questo calcolo resta un solo colore. Sei livelli, da «hai praticamente il
          parco tutto per te» a «benvenuto in un sabato di vacanza»:
        </P>
        <CrowdLegend
          items={[
            {
              level: 'very_low',
              text: 'Quasi vuoto. Sogni da rope-drop, giri uno dietro l’altro, una foto con la mascotte senza coda.',
            },
            {
              level: 'low',
              text: 'Rilassato. Attese brevi, sali su tutto senza bisogno di un piano di battaglia.',
            },
            {
              level: 'moderate',
              text: 'Funzionamento normale. Le attrazioni di punta si riempiono, il resto resta tranquillo. Una solida giornata di compromesso.',
            },
            {
              level: 'high',
              text: 'Sensibilmente affollato. Per le attrazioni top conviene alzarsi presto — o portare pazienza.',
            },
            {
              level: 'very_high',
              text: 'Davvero pieno. Code lunghe alle attrazioni clou; pianificare batte nettamente l’improvvisazione.',
            },
            {
              level: 'extreme',
              text: 'Allerta totale. Sabato di vacanza in piena estate. Consigliato solo con strategia, resistenza e senso dell’umorismo.',
            },
          ]}
        />
      </Section>

      {/* Where you meet it */}
      <Section id="where" title="Dove incontri Fancast" icon={MapPin}>
        <P>
          Fancast non vive su una pagina solitaria — è intrecciato in tutto park.fan, di solito senza
          presentarsi:
        </P>
        <TouchpointList
          items={[
            {
              title: 'Previsione di oggi',
              body: 'il voto di affollamento nell’intestazione del parco, ancora prima di toccare la prima attrazione.',
            },
            {
              title: 'Calendario dell’affollamento',
              body: (
                <>
                  il <Link href="/parks">calendario dei giorni migliori per la visita</Link> su ogni
                  pagina di parco — verde, giallo, rosso, fino a un anno in anticipo.
                </>
              ),
            },
            {
              title: 'Periodo migliore per la visita',
              body: 'i giorni feriali più tranquilli e i prossimi giorni da intenditori, distillati dagli stessi dati.',
            },
            {
              title: 'Previsione IA nel grafico dei tempi di attesa',
              body: 'la linea tratteggiata che svela le fasce orarie più convenienti di un’attrazione.',
            },
            {
              title: 'Consiglio rope-drop',
              body: 'la risposta onesta a «vale la pena arrivare presto?» — compresi i minimi previsti.',
            },
          ]}
        />
        <P>
          Come tutto questo si svolge dentro un parco è spiegato passo passo nella{' '}
          <Link href="/howto">guida completa</Link>.
        </P>
      </Section>

      {/* Limits */}
      <Section id="limits" title="Dove Fancast resta zitto (per ora)" icon={ShieldAlert}>
        <P>
          Fancast è bravo, ma non delirante — e ti dice quando preferisce tacere. Per i parchi con{' '}
          <strong>meno di una trentina di giorni di esercizio</strong> di dati semplicemente non c’è un
          voto; al suo posto dice onestamente «Nessuna previsione» invece di un numero tirato a
          indovinare:
        </P>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <CrowdLevelBadge level="unknown" />
          <span className="text-muted-foreground text-sm leading-relaxed">
            Non ancora valutabile — troppo pochi giorni di esercizio per assegnare un colore in
            coscienza.
          </span>
        </div>
        <P>
          E persino dove Fancast ha un’opinione, la fornisce con <strong>confidence</strong> — un onesto
          «piuttosto sicuro» o «più che altro una sensazione». Parchi nuovi, eventi speciali esotici, un
          primissimo festival invernale: lì il modello sta ancora imparando. Migliora a ogni stagione —
          l’unica promessa è che non lo addolciremo.
        </P>
      </Section>

      {/* FAQ */}
      <Section id="faq" title="Domande frequenti su Fancast" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
