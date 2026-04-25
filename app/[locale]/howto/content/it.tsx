import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGridClient } from '@/components/home/featured-parks-section-client';
import { GlossaryInject } from '@/components/glossary/glossary-inject';
import { cn } from '@/lib/utils';
import { HeroSearchInput } from '@/components/search/hero-search-input';
import { NearbyParksCard } from '@/components/parks/nearby-parks-card';
import {
  Search,
  Star,
  TrendingUp,
  Clock,
  Users,
  AlertTriangle,
  XCircle,
  Wrench,
  User,
  Zap,
  Ticket,
  TrendingDown,
  Minus,
  PartyPopper,
  Backpack,
  Calendar,
  ChevronRight,
  Snowflake,
  Sun,
  Leaf,
  EyeOff,
} from 'lucide-react';
import { Section, SubSection, DemoBadge, InfoBox, TipBox, PersonaCard, Li } from '../_howto-ui';
import {
  MockParkHeader,
  MockAttractionCards,
  MockShowCards,
  MockNearbyCards,
  MockHourlyChart,
} from '../_mock-components';
import { LiveCalendarExample } from '../_live-calendar';

function IntroIT() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 text-base leading-relaxed">
        <p className="text-muted-foreground text-lg font-medium">
          Ti suona familiare? 80 minuti di coda per Taron — e a dieci metri di distanza
          un&apos;altra attrazione senza attesa. Oppure: prenoti le vacanze e scopri che quella
          settimana ci sono le vacanze scolastiche in tutta la regione.
        </p>
        <p className="text-muted-foreground">
          park.fan è nato da questa stessa frustrazione. Quello che è iniziato come un piccolo
          progetto personale – &quot;voglio solo tracciare alcuni tempi di attesa&quot; – è
          diventato una piattaforma con dati in tempo reale da oltre 150 parchi, più di 5.000
          attrazioni e milioni di dati sulle code elaborati ogni giorno.
        </p>
        <p className="text-muted-foreground">
          L&apos;obiettivo è semplice:{' '}
          <strong>elimina le congetture dalla tua visita al parco divertimenti.</strong> Usa il
          calendario dell&apos;affluenza per scegliere il giorno migliore, naviga con i tempi di
          attesa in diretta e affidati alle previsioni IA per sapere quando ogni attrazione avrà
          meno coda. Questa pagina spiega ogni funzione in dettaglio.
        </p>
      </div>
      <nav aria-label="Indice" className="bg-muted/40 not-prose rounded-xl border p-5">
        <p className="mb-3 font-semibold">Indice</p>
        <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
          {[
            ['#suche', '1. Ricerca'],
            ['#standort', '2. Posizione'],
            ['#favoriten', '3. Preferiti'],
            ['#parkseite', '4. La pagina del parco'],
            ['#badges', '5. Badge e stati'],
            ['#kalender', '6. Calendario affluenza'],
            ['#prognosen', '7. Previsioni IA'],
            ['#personas', '8. Per chi?'],
            ['#parks', '9. Parchi popolari'],
            ['#glossar', '10. Glossario'],
            ['#faq', '11. FAQ'],
          ].map(([href, label]) => (
            <li key={href}>
              <a href={href} className="hover:text-primary transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}

function ContentITSections() {
  return (
    <>
      {/* ── 1. Ricerca ───────────────────────────────────────────────────────── */}
      <Section id="suche" title="Ricerca">
        <p className="text-muted-foreground mb-4">
          La ricerca globale è il modo più rapido per trovare un parco, un&apos;attrazione, uno
          spettacolo o un ristorante – sia su desktop che su mobile.
        </p>

        <SubSection title="Aprire la ricerca">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Premi{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              o <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) per aprire la ricerca in qualsiasi momento.
            </p>
            <p>
              <strong>Mobile e Desktop:</strong> Tocca l&apos;icona{' '}
              <Search className="inline h-4 w-4" /> nell&apos;intestazione o nel campo di ricerca
              nella pagina principale.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Cosa puoi cercare">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parchi', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attrazioni', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Città e Paesi', desc: 'Orlando, Parigi, Germania...' },
              { icon: '🎭', label: 'Spettacoli', desc: 'Orari e programmi degli show' },
              {
                icon: '🍽️',
                label: 'Ristoranti',
                desc: "Opzioni ristorative all'interno dei parchi",
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <InfoBox label="Nota">
          La ricerca utilizza una ricerca full-text intelligente che funziona anche con errori di
          battitura. Cerca &quot;fantasia&quot; e troverai &quot;Phantasialand&quot;.
        </InfoBox>
      </Section>

      {/* ── 2. Posizione ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Posizione e Parchi Vicini">
        <p className="text-muted-foreground mb-4">
          Con la posizione attivata, park.fan diventa più intelligente: vedi i parchi e le
          attrazioni nelle vicinanze ordinati per distanza. park.fan non memorizza la tua posizione.
        </p>
        <SubSection title="Navigazione nel parco">
          <p className="text-muted-foreground text-sm">
            Quando sei in un parco, park.fan rileva automaticamente in quale parco ti trovi e mostra
            &quot;Sei in [Nome del Parco]&quot; nella pagina principale. La mappa del parco
            visualizza la tua posizione in tempo reale – perfetta per muoverti tra le attrazioni.
          </p>
        </SubSection>
        <NearbyParksCard />
      </Section>

      {/* ── 3. Preferiti ─────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Preferiti">
        <p className="text-muted-foreground mb-4">
          Salva parchi, attrazioni, spettacoli e ristoranti come preferiti per accedervi rapidamente
          dalla pagina principale.
        </p>

        <SubSection title="Aggiungere un preferito">
          <p className="text-sm">
            Clicca sulla stella <Star className="inline h-4 w-4 text-yellow-500" /> su qualsiasi
            scheda di parco o attrazione. I preferiti vengono salvati localmente nel tuo browser –
            nessuna registrazione richiesta.
          </p>
        </SubSection>

        <SubSection title="Preferiti nella pagina principale">
          <p className="text-muted-foreground text-sm">
            Con almeno un preferito salvato, nella pagina principale appare una sezione dedicata con
            tutti i tuoi parchi, attrazioni, spettacoli e ristoranti salvati. Con la posizione
            attivata, vengono ordinati per distanza – il più vicino per primo.
          </p>
          <MockNearbyCards locale="en" />
        </SubSection>

        <SubSection title="Cosa viene salvato?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parchi',
                desc: "Stato, orari di apertura e livello di affluenza in un colpo d'occhio",
              },
              {
                icon: '🎢',
                label: 'Attrazioni',
                desc: 'Tempo di attesa in diretta e tendenza direttamente nel riepilogo',
              },
              { icon: '🎭', label: 'Spettacoli', desc: 'Il prossimo orario sempre visibile' },
              { icon: '🍽️', label: 'Ristoranti', desc: 'Stato cucina e posizione' },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 flex items-start gap-3 rounded-lg p-3">
                <span className="text-xl">{icon}</span>
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox label="Consiglio">
          Salva tra 5 e 10 attrazioni preferite del parco che intendi visitare. Il giorno della
          visita vedrai immediatamente quali hanno tempi di attesa brevi – ideale per decidere al
          volo.
        </TipBox>
      </Section>

      {/* ── 4. Pagina del Parco ──────────────────────────────────────────────── */}
      <Section id="parkseite" title="La Pagina del Parco">
        <p className="text-muted-foreground mb-4">
          Ogni parco ha la propria pagina con dati in tempo reale, orari di apertura, un calendario
          interattivo e una mappa.
        </p>
        <InfoBox label="Nota">
          Tutti gli orari sono visualizzati nel <strong>fuso orario locale del parco</strong> –
          indipendentemente da dove ti trovi. Un parco in Florida mostra l&apos;ora orientale,
          Europa-Park mostra l&apos;ora dell&apos;Europa Centrale.
        </InfoBox>
        <MockParkHeader locale="en" />

        <SubSection title="Schede – Attrazioni, Spettacoli, Calendario, Mappa">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attrazioni',
                desc: 'Tutte le attrazioni con tempo di attesa in diretta, stato, tendenza e confronto con la media.',
              },
              {
                icon: '🎭',
                label: 'Spettacoli',
                desc: 'Tutti gli spettacoli con stato attuale e prossimi orari.',
              },
              {
                icon: '📅',
                label: 'Calendario',
                desc: 'Previsione su 30+ giorni con previsioni di affluenza, meteo, festività e vacanze scolastiche.',
              },
              {
                icon: '🗺️',
                label: 'Mappa',
                desc: 'Mappa interattiva con tutte le attrazioni, gli spettacoli e i ristoranti.',
              },
            ].map(({ icon, label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">
                  {icon} {label}
                </p>
                <p className="text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
          <MockAttractionCards locale="en" />
        </SubSection>

        <SubSection title="Scheda Spettacoli: Orari in un colpo d'occhio">
          <p className="text-muted-foreground text-sm">
            La scheda Spettacoli elenca tutti gli show con i loro orari per oggi. Gli orari passati
            appaiono barrati, il <strong>prossimo spettacolo</strong> è evidenziato in verde – così
            sai sempre quando e dove essere.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Attrazioni e spettacoli stagionali">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Alcune attrazioni stagionali e show funzionano solo in certi periodi dell&apos;anno —
              come le piste di pattinaggio in inverno o le attrazioni acquatiche in estate. park.fan
              lo rileva automaticamente e nasconde queste voci fuori stagione per impostazione
              predefinita.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Inverno',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: "L'attrazione è attualmente in stagione (es. evento invernale). Il badge appare sulla scheda.",
                },
                {
                  icon: Sun,
                  label: 'Estate',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: "Attrazione estiva – es. scivolo d'acqua. Attiva da maggio a settembre.",
                },
                {
                  icon: Leaf,
                  label: 'Stagionale',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Fuori stagione: badge attenuato. Attrazione nascosta nei tab e nella mappa di default.',
                },
              ].map(({ icon: Icon, label, color, opacity, desc }) => (
                <div key={label} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold backdrop-blur-md',
                      color,
                      opacity
                    )}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </span>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 fuori stagione
              </button>
              <p className="text-muted-foreground text-sm">
                Quando ci sono voci fuori stagione nascoste, questo pulsante appare accanto al
                titolo della sezione. Cliccaci sopra per mostrarle.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badge ─────────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badge e Indicatori di Stato">
        <p className="text-muted-foreground mb-4">
          park.fan utilizza un sistema di colori coerente per rendere le informazioni immediatamente
          comprensibili.
        </p>

        <SubSection title="Stato di Parchi e Attrazioni">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'badge-status-operating',
                label: 'In funzione',
                desc: "L'attrazione / il parco è operativo. I tempi di attesa vengono aggiornati in diretta.",
              },
              {
                icon: AlertTriangle,
                color: 'badge-status-down',
                label: 'Guasto',
                desc: 'Chiuso temporaneamente – p. es. problema tecnico o pausa di sicurezza. Di solito breve.',
              },
              {
                icon: XCircle,
                color: 'badge-status-closed',
                label: 'Chiuso',
                desc: 'Nessuna operazione oggi – chiusura stagionale o giorno di riposo programmato.',
              },
              {
                icon: Wrench,
                color: 'badge-status-refurbishment',
                label: 'Ristrutturazione',
                desc: 'Manutenzione prolungata. Chiuso per giorni o settimane.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Livelli di Affluenza">
          <p className="text-muted-foreground mb-3 text-sm">
            Il livello di affluenza mostra quanto è affollato un parco o un&apos;attrazione rispetto
            alla mediana storica dei tempi di attesa (P50). Il 100% significa esattamente affollato
            come un giorno medio.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Molto Bassa',
                icon: User,
                threshold: '≤ 60% di P50',
                desc: 'Notevolmente più tranquillo del solito. Quasi nessuna coda – giorno ideale per visitare.',
              },
              {
                color: 'badge-crowd-low',
                label: 'Bassa',
                icon: User,
                threshold: '61–89% di P50',
                desc: 'Sotto la media – brevi tempi di attesa per la maggior parte delle attrazioni.',
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Moderata',
                icon: Users,
                threshold: '90–110% di P50',
                desc: "Giorno tipico – tempi di attesa nell'intervallo previsto (±10% della mediana).",
              },
              {
                color: 'badge-crowd-high',
                label: 'Alta',
                icon: Users,
                threshold: '111–150% di P50',
                desc: 'Più affollato della media – tempi di attesa notevolmente più lunghi.',
              },
              {
                color: 'badge-crowd-very-high',
                label: 'Molto Alta',
                icon: Users,
                threshold: '151–200% di P50',
                desc: 'Molto affollato – attese quasi il doppio del solito. Arriva presto.',
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Estrema',
                icon: AlertTriangle,
                threshold: '> 200% di P50',
                desc: 'Affluenza record – più del doppio di un giorno tipico. Vacanze scolastiche, eventi speciali.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[100px] flex-col gap-1 sm:min-w-[120px]">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
          <InfoBox label="Nota">
            <strong>Come viene calcolato il livello di affluenza?</strong> park.fan confronta il
            tempo di attesa medio attuale con la mediana storica (P50). Il 100% significa affollato
            come un giorno medio; il 60% è notevolmente più tranquillo, il 200% significa il doppio
            dell&apos;affluenza normale.
          </InfoBox>
        </SubSection>

        <SubSection title="Indicatori di Tendenza">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'In aumento',
                desc: 'La coda si allunga. Unisciti presto.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stabile',
                desc: 'Il tempo di attesa rimane costante.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'In calo',
                desc: 'La coda si accorcia – buon momento per unirsi.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-28 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Tipi di Coda">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Fila Singola',
                termId: 'single-rider',
                desc: 'Spesso molto più breve della fila normale – ma non puoi andarci con il tuo gruppo.',
              },
              {
                color: 'badge-status-down',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: "Pass express a pagamento (p. es. da Disney). Mostra il prezzo attuale e l'ora di ritorno.",
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Ora di Ritorno',
                termId: 'virtual-queue',
                desc: 'Coda virtuale gratuita – prenota uno slot orario e torna più tardi.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: "Gruppo d'Imbarco",
                termId: 'boarding-group',
                desc: 'Coda virtuale con numero di gruppo – popolare per le nuove attrazioni molto richieste.',
              },
            ].map(({ color, icon, label, termId, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} termId={termId} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Calendario ────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Il Calendario di Affluenza">
        <p className="text-muted-foreground mb-4">
          Il calendario è lo strumento di pianificazione più potente di park.fan. Mostra una
          previsione basata sull&apos;IA per ciascuno dei prossimi 30+ giorni – livello di
          affluenza, orari di apertura, meteo ed eventi speciali, tutto in un colpo d&apos;occhio.
        </p>

        <SubSection title="Cosa mostra ogni scheda del calendario?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Una scheda tipica del calendario mostra:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Data e giorno della settimana</strong>
              </li>
              <li>
                🎯 <strong>Badge Affluenza</strong> (p. es. &quot;Molto Alta&quot;) – la previsione
                IA dell&apos;affollamento complessivo
              </li>
              <li>
                🕐 <strong>Orari di apertura</strong> – o &quot;Est.&quot; se non ancora confermati
                ufficialmente
              </li>
              <li>
                🌤️ <strong>Previsione meteo</strong> con temperature min./max.
              </li>
              <li>
                ⌚ <strong>Tempo di attesa medio</strong> – attesa media prevista su tutte le
                attrazioni
              </li>
              <li>
                🎟️ <strong>Prezzo del biglietto</strong>, quando pubblicato dal parco
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Cosa significa &quot;Est.&quot;?</strong> Gli orari contrassegnati
            &quot;Est.&quot; (Stimato) non sono ancora stati confermati ufficialmente dal parco.
            park.fan li deriva da pattern storici – possono ancora cambiare.
          </p>
        </SubSection>

        <SubSection title="Icone della scheda del calendario">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Festività',
                desc: 'I parchi spesso aprono più a lungo, ma sono anche più affollati. Controlla la previsione!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Vacanze Scolastiche',
                desc: "Di solito i giorni più affollati dell'anno – possibili tempi di attesa estremi.",
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Ponte',
                desc: 'Probabilmente più affollato poiché molte persone prolungano i fine settimana lunghi.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Parco Chiuso',
                desc: 'Nessuna operazione quel giorno – nessuna previsione disponibile.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${color}`} />
                <div>
                  <p className="font-semibold">{label}</p>
                  <p className="text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title="Esempio pratico: trovare il giorno di visita migliore">
          <p className="text-muted-foreground mb-3 text-sm">
            Stai pianificando una visita a Europa-Park in ottobre. Ecco come usare il calendario:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Apri la pagina del parco e passa alla scheda <strong>Calendario</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Vedrai subito le settimane di vacanze scolastiche – molte schede con l&apos;icona{' '}
                <Backpack className="inline h-4 w-4 text-yellow-500" /> e badge{' '}
                <strong>&quot;Molto Alta&quot;</strong> o <strong>&quot;Estrema&quot;</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Cerca un martedì o mercoledì <em>senza</em> icona di festività – mostrano spesso
                <strong> &quot;Bassa&quot;</strong> o <strong>&quot;Moderata&quot;</strong>. Gli
                orari di apertura e le previsioni meteo ti aiutano a decidere.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Acquista i biglietti in anticipo – nei giorni verdi del calendario, i posti possono
                essere limitati.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="it" />
          </div>
        </SubSection>

        <SubSection title="Calendario delle attrazioni">
          <p className="text-muted-foreground text-sm">
            La pagina di dettaglio di ogni attrazione ha anche un calendario storico che mostra
            quanto era affollata ogni giorno passato – e se era in funzione o meno. Perfetto per
            individuare pattern ricorrenti: Taron aveva costantemente brevi attese il giovedì
            pomeriggio nel mese scorso? Potrebbe essere così anche la prossima settimana.
          </p>
        </SubSection>

        <TipBox label="Consiglio">
          I giorni di visita migliori sono tipicamente i giorni feriali fuori dalle vacanze
          scolastiche – martedì, mercoledì e giovedì mostrano i livelli di affluenza più bassi.
          Evita le settimane di vacanze scolastiche nelle regioni densamente popolate.
        </TipBox>
      </Section>

      {/* ── 7. Previsioni IA ─────────────────────────────────────────────────── */}
      <Section id="prognosen" title="Previsioni con IA">
        <p className="text-muted-foreground mb-4">
          park.fan utilizza il machine learning per prevedere i livelli di affluenza e i tempi di
          attesa con giorni di anticipo. Il modello viene continuamente addestrato su nuovi dati e
          considera quattro fattori chiave:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Dati storici',
              desc: 'Milioni di punti dati per attrazione, giorno della settimana e ora del giorno.',
            },
            {
              icon: '📅',
              title: 'Calendari delle ferie',
              desc: 'Vacanze scolastiche e festività in Europa e nel mondo.',
            },
            {
              icon: '🌤️',
              title: 'Previsioni meteo',
              desc: 'Temperatura, pioggia e sole – il maltempo spinge le folle verso le attrazioni al coperto.',
            },
            {
              icon: '🎉',
              title: 'Eventi speciali',
              desc: "Notti di Halloween, eventi natalizi e altre date specifiche dei parchi generano un'affluenza significativamente maggiore.",
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Dove trovare le previsioni">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Nel calendario di affluenza</p>
              <p className="text-muted-foreground mt-0.5">
                Ogni scheda del calendario contiene una previsione giornaliera: livello di
                affluenza, tempo di attesa medio e orari di apertura – fino a 30+ giorni di
                anticipo.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Badge ora di punta sulla pagina del parco</p>
              <p className="text-muted-foreground mt-0.5">
                L&apos;intestazione del parco mostra quando è previsto il picco di affluenza di oggi
                – p. es. &quot;Picco tra 1h 30min&quot;. Pianifica una pausa pranzo o visita
                un&apos;attrazione meno popolare proprio in quella finestra.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">
                📈 Grafico di previsione oraria sulla pagina dell&apos;attrazione
              </p>
              <p className="text-muted-foreground mt-0.5">
                Ogni attrazione ha la propria pagina con un grafico che mostra come si prevede che i
                tempi di attesa evolvano nel corso della giornata – per oggi e domani.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Esempio pratico: usare le previsioni il giorno della visita">
          <p className="text-muted-foreground mb-3 text-sm">
            Stai visitando Phantasialand un sabato durante le vacanze scolastiche. Il calendario
            mostra &quot;Molto Alta&quot;. Ecco come le previsioni ti aiutano:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>All&apos;ingresso:</strong> Il badge ora di punta mostra &quot;Picco tra
                ~2h&quot; – hai fino alle 11:30 circa per i tuoi primi highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Apri la pagina di Taron:</strong> Il grafico di previsione mostra 9:30 ≈ 15
                min, 12:00 ≈ 65 min, 15:00 ≈ 40 min → vai subito all&apos;apertura o nel pomeriggio.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Pranzo durante il picco:</strong> Invece di fare la coda a mezzogiorno, ne
                approfitti per mangiare. Le tendenze in diretta confermano che alle 15:00
                l&apos;attesa scende – momento perfetto per andare.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Quanto sono accurate le previsioni?">
          <p className="text-muted-foreground text-sm">
            La precisione varia in base al parco e all&apos;orizzonte di previsione. La pagina di
            dettaglio di ogni attrazione mostra la sua qualità predittiva – da{' '}
            <strong>Scarsa</strong> a <strong>Eccellente</strong>. Più dati storici significa
            previsioni più precise. Le previsioni a breve termine (1–3 giorni) sono intrinsecamente
            più affidabili di quelle a lungo termine (7–14 giorni).
          </p>
        </SubSection>

        <SubSection title="Grafici sparkline dei tempi di attesa">
          <p className="text-muted-foreground text-sm">
            Ogni scheda attrazione mostra un piccolo grafico sparkline con la tendenza dei tempi di
            attesa nelle ultime ore. Puoi vedere istantaneamente se le code stanno aumentando,
            rimanendo stabili o diminuendo.
          </p>
          <MockHourlyChart locale="en" />
        </SubSection>

        <TipBox label="Consiglio">
          Combina calendario e previsioni: scegli un giorno verde dal calendario, poi controlla la
          previsione oraria sulla pagina dell&apos;attrazione per trovare lo slot più tranquillo.
          Arriverai sempre alla coda più breve.
        </TipBox>
      </Section>

      {/* ── 8. Per chi ───────────────────────────────────────────────────────── */}
      <Section id="personas" title="A chi è rivolto park.fan?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Famiglie"
            subtitle="Pianificare una giornata perfetta per tutti"
          >
            <Li>Calendario di affluenza: quale giorno ha le code più brevi?</Li>
            <Li>Meteo nel calendario: giornata piovosa? Controlla le attrazioni al coperto!</Li>
            <Li>Preferiti: salva le 10 attrazioni imperdibili per i bambini.</Li>
            <Li>Tempi di attesa in diretta: decidi al volo quale attrazione fare dopo.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Appassionati di Parchi"
            subtitle="Ogni minuto deve essere ottimizzato"
          >
            <Li>
              Livello di affluenza (base P50): capisci se un&apos;attrazione è davvero sopra la
              media.
            </Li>
            <Li>Tendenze storiche: quando Taron ha di solito brevi attese?</Li>
            <Li>Indicatori di tendenza: la coda sale? Aspetta 20 minuti e potrebbe accorciarsi.</Li>
            <Li>Fila Singola / Lightning Lane: tutti i tipi di coda con tempi e prezzi.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Visitatori per la Prima Volta"
            subtitle="Prima visita in un grande parco a tema"
          >
            <Li>Ricerca: trova il tuo parco rapidamente, anche se non conosci il nome esatto.</Li>
            <Li>Mappa del parco: orientati prima e durante la visita.</Li>
            <Li>
              Badge di stato: verde = in funzione, arancione = breve problema, grigio = chiuso oggi.
            </Li>
            <Li>
              Calendario di affluenza: i colori dicono tutto – verde è bene, rosso è stressante.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Visitatori Spontanei"
            subtitle="Decisione dell'ultimo minuto, massima efficienza"
          >
            <Li>Posizione: park.fan trova automaticamente il parco più vicino a te.</Li>
            <Li>
              Tempi di attesa in diretta: vedi istantaneamente cosa è aperto e quanto si aspetta.
            </Li>
            <Li>Indicatori di tendenza: la coda scende? Il momento perfetto per unirsi.</Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Parchi popolari ──────────────────────────────────────────────── */}
      <Section id="parks" title="Parchi popolari">
        <p className="text-muted-foreground mb-6">
          park.fan copre oltre 150 parchi divertimento in tutto il mondo. Ecco i più visitati nella
          tua regione con dati in tempo reale:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossario ────────────────────────────────────────────────── */}
      <Section id="glossar" title="Il Glossario e l'Evidenziazione dei Termini">
        <p className="text-muted-foreground mb-4">
          park.fan mantiene un{' '}
          <Link href="/glossario" className="text-primary underline">
            glossario completo dei termini dei parchi a tema
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {`dai tempi di attesa e livelli di affluenza agli elementi delle montagne russe e code virtuali. Ogni voce include una definizione breve e una spiegazione dettagliata.`}
          </GlossaryInject>
        </p>

        <SubSection title="Evidenziazione automatica dei termini nelle pagine delle attrazioni">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {`Nelle pagine delle attrazioni, i termini del glossario vengono rilevati automaticamente nel testo e sottolineati con una linea tratteggiata. Passando il cursore appare una definizione breve; cliccando si accede direttamente alla voce completa del glossario.`}
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Testo di esempio (passa il cursore sui termini sottolineati)
            </p>
            <p>
              <GlossaryInject>
                {`Il modo migliore per pianificare la tua visita è controllare il calendario dell'affluenza prima di prenotare. In un giorno di punta, i tempi di attesa per le attrazioni più popolari possono superare i 90 minuti. Una coda virtuale ti permette di prenotare il tuo slot senza fare la coda, mentre il single rider può ridurre l'attesa di oltre la metà. Quando il livello di affluenza è alto, il pass express vale spesso la pena.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Suggerimento">
          Il glossario completo è disponibile su{' '}
          <Link href="/glossario" className="text-primary font-medium underline">
            park.fan/glossario
          </Link>{' '}
          con termini organizzati in 7 categorie.
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Domande Frequenti">
        <div className="space-y-4">
          {[
            {
              q: 'Con quale frequenza vengono aggiornati i tempi di attesa?',
              a: 'I tempi di attesa vengono aggiornati ogni minuto. Per alcuni parchi, gli aggiornamenti avvengono ogni 2–5 minuti in base alla disponibilità dei dati.',
            },
            {
              q: 'Da dove provengono i dati?',
              a: 'park.fan ottiene dati in diretta da ThemeParks.wiki, Queue-Times.com e Wartezeiten.app.',
            },
            {
              q: 'park.fan è gratuito?',
              a: 'Sì, park.fan è completamente gratuito e non richiede registrazione.',
            },
            {
              q: 'I preferiti vengono sincronizzati tra i dispositivi?',
              a: 'No, i preferiti vengono salvati localmente nel tuo browser (localStorage). Sono disponibili solo sul dispositivo in cui li hai salvati.',
            },
            {
              q: 'Fino a quanto tempo in anticipo il calendario di affluenza fa previsioni?',
              a: "Il calendario mostra previsioni per oltre 30 giorni. Le previsioni per date più lontane sono naturalmente un po' meno precise di quelle a breve termine.",
            },
            {
              q: 'Quanti parchi sono coperti?',
              a: 'park.fan copre attualmente oltre 150 parchi con più di 5.000 attrazioni in tutto il mondo – da Walt Disney World e Universal a Europa-Park, Phantasialand e parchi in Asia e Australia.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="text-primary mt-0.5 h-4 w-4 shrink-0 transition-transform group-open:rotate-90" />
                  {q}
                </span>
              </summary>
              <p className="text-muted-foreground px-4 pb-4 text-sm">{a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}

export function ContentIT() {
  return (
    <div className="space-y-16 text-base leading-7">
      <IntroIT />
      <ContentITSections />
    </div>
  );
}
