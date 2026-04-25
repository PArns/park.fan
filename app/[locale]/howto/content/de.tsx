/* eslint-disable react/no-unescaped-entities */
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
  Activity,
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

function ContentDE() {
  return (
    <div className="space-y-16 text-base leading-7">
      {/* Intro */}
      <div className="space-y-4">
        <div className="space-y-4 text-base leading-relaxed">
          <p className="text-muted-foreground text-lg font-medium">
            Kennst du das? 80 Minuten Schlange für Taron – und zehn Meter weiter läuft eine andere
            Attraktion ohne Wartezeit. Oder: du buchst deinen Urlaub und ausgerechnet in dieser
            Woche sind alle Schulen in NRW in den Ferien.
          </p>
          <p className="text-muted-foreground">
            park.fan wurde aus genau dieser Frustration heraus entwickelt. Was als kleines
            Nebenprojekt begann – „ich tracke mal ein paar Wartezeiten" – ist heute eine Plattform
            mit Live-Daten aus 150+ Parks, mehr als 5.000 Attraktionen und Millionen von
            Warteschlangen-Datenpunkten, die täglich verarbeitet werden.
          </p>
          <p className="text-muted-foreground">
            Das Ziel ist einfach:{' '}
            <strong>Nimm das Rätselraten aus deinem Freizeitpark-Besuch.</strong> Plane mit dem
            Crowd-Kalender den richtigen Tag, navigiere mit Live-Wartezeiten durch den Park und
            verlasse dich auf KI-Prognosen, die dir sagen, wann welche Attraktion am ruhigsten ist.
            Diese Seite erklärt alle Funktionen im Detail.
          </p>
        </div>
        {/* TOC */}
        <nav
          aria-label="Inhaltsverzeichnis"
          className="bg-muted/40 not-prose rounded-xl border p-5"
        >
          <p className="mb-3 font-semibold">Inhaltsverzeichnis</p>
          <ol className="text-muted-foreground flex flex-col gap-1.5 text-sm">
            {[
              ['#suche', '1. Suche'],
              ['#standort', '2. Standort & Nearby'],
              ['#favoriten', '3. Favoriten'],
              ['#parkseite', '4. Die Park-Seite'],
              ['#badges', '5. Badges & Anzeigen'],
              ['#kalender', '6. Crowd-Kalender'],
              ['#prognosen', '7. KI-Prognosen'],
              ['#personas', '8. Für wen?'],
              ['#glossar', '10. Glossar'],
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

      {/* ── 1. Suche ────────────────────────────────────────────────────────── */}
      <Section id="suche" title="Die Suche">
        <p className="text-muted-foreground mb-4">
          Die globale Suche ist der schnellste Weg, um einen Park, eine Attraktion, eine Show oder
          ein Restaurant zu finden – egal ob du auf dem Desktop oder dem Smartphone unterwegs bist.
        </p>

        <SubSection title="Suche öffnen">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Drücke{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Strg + K</kbd>{' '}
              oder{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac), um die Suche jederzeit zu öffnen.
            </p>
            <p>
              <strong>Mobil & Desktop:</strong> Klicke auf das <Search className="inline h-4 w-4" />
              -Symbol in der Kopfzeile oder in das Suchfeld auf der Startseite.
            </p>
            <p>
              <strong>Tipp:</strong> Du kannst einfach anfangen zu tippen – die Suche reagiert ab 3
              Zeichen sofort.
            </p>
          </div>
          <HeroSearchInput placeholder="Europa-Park, Taron, ..." />
        </SubSection>

        <SubSection title="Was du suchen kannst">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attraktionen', desc: 'Taron, Silver Star, Space Mountain...' },
              { icon: '🗺️', label: 'Städte & Länder', desc: 'Orlando, Paris, Deutschland...' },
              { icon: '🎭', label: 'Shows', desc: 'Showtimes, Programm, Zeiten' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Gastronomie und Imbisse im Park' },
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

        <SubSection title="Suchergebnisse verstehen">
          <p className="text-muted-foreground text-sm">
            Jedes Ergebnis zeigt sofort den aktuellen Status an – du siehst auf einen Blick, ob ein
            Park geöffnet ist und wie hoch der Besucherandrang gerade ist. Bei Attraktionen wird die
            aktuelle Wartezeit direkt angezeigt.
          </p>
          <InfoBox>
            Die Suche verwendet intelligente Volltextsuche, die auch bei Tippfehlern funktioniert.
            Suche nach "fantasia" und du findest "Phantasialand".
          </InfoBox>
        </SubSection>

        <SubSection title="Vollständige Suchergebnisse">
          <p className="text-muted-foreground text-sm">
            Klicke auf "Alle Ergebnisse anzeigen", um zur dedizierten Suchseite zu gelangen. Dort
            findest du alle Treffer nach Kategorie sortiert.
          </p>
        </SubSection>
      </Section>
      {/* ── 2. Standort ─────────────────────────────────────────────────────── */}
      <Section id="standort" title="Standort & Nearby-Parks">
        <p className="text-muted-foreground mb-4">
          Mit deinem Standort wird park.fan noch smarter: Du siehst Parks und Attraktionen in deiner
          Nähe – sortiert nach Entfernung.
        </p>

        <SubSection title="Standort aktivieren">
          <p className="text-muted-foreground text-sm">
            Beim ersten Besuch erscheint ein Banner, das dich um Standortzugriff bittet. Die
            Zustimmung ist vollständig freiwillig. park.fan speichert deinen Standort nicht – er
            wird ausschließlich für die Nearby-Funktion genutzt und nicht an Dritte weitergegeben.
          </p>
        </SubSection>

        <SubSection title="In-Park Navigation">
          <p className="text-muted-foreground text-sm">
            Bist du im Park? park.fan erkennt automatisch, in welchem Park du dich befindest, und
            zeigt auf der Startseite "Du bist im [Parkname]". Die Karte des Parks wird mit deinem
            aktuellen Standort angezeigt – perfekt für die Navigation.
          </p>
          <p className="text-muted-foreground mt-2 text-sm">
            Deine favorisierten Attraktionen werden nach Entfernung zu dir sortiert – du siehst
            immer, welche Attraktion gerade am nächsten liegt und wie lange die Wartezeit ist.
          </p>
        </SubSection>

        <NearbyParksCard className="mt-4" />
      </Section>
      {/* ── 3. Favoriten ────────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoriten">
        <p className="text-muted-foreground mb-4">
          Markiere Parks, Attraktionen, Shows und Restaurants als Favoriten, um sie jederzeit
          schnell zur Hand zu haben – direkt auf der Startseite.
        </p>

        <SubSection title="Favorit hinzufügen">
          <div className="space-y-2 text-sm">
            <p>
              Klicke auf den <Star className="inline h-4 w-4 text-yellow-500" />
              -Stern auf jeder Park- oder Attraktionskarte. Der Stern leuchtet auf – der Favorit ist
              gespeichert.
            </p>
            <p>
              Favoriten werden <strong>lokal in deinem Browser</strong> gespeichert – keine
              Anmeldung notwendig. Sie bleiben erhalten, bis du sie manuell entfernst.
            </p>
          </div>
        </SubSection>

        <SubSection title="Favoriten auf der Startseite">
          <p className="text-muted-foreground text-sm">
            Sobald du mindestens einen Favoriten gesetzt hast, erscheint auf der Startseite ein
            eigener Bereich mit allen gespeicherten Parks, Attraktionen, Shows und Restaurants. Bei
            aktiviertem Standort werden sie nach Entfernung sortiert – der nächste Park zuerst.
          </p>
          <MockNearbyCards locale="de" />
        </SubSection>

        <SubSection title="Was wird als Favorit gespeichert?">
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                icon: '🌴',
                label: 'Parks',
                desc: 'Status, Öffnungszeiten, Auslastung auf einen Blick',
              },
              {
                icon: '🎢',
                label: 'Attraktionen',
                desc: 'Live-Wartezeit und Trend direkt in der Übersicht',
              },
              { icon: '🎭', label: 'Shows', desc: 'Nächste Showtime immer im Blick' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Küche und aktueller Status' },
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

        <TipBox>
          Plane deinen nächsten Besuch effizienter: Speichere die 5-10 Lieblingsattraktionen deines
          Zielparks als Favoriten. Auf der Startseite siehst du dann sofort, welche davon gerade
          kurze Wartezeiten haben – ideal für die spontane Entscheidung am Besuchstag.
        </TipBox>
      </Section>

      {/* ── 4. Park-Seite ───────────────────────────────────────────────────────── */}
      <Section id="parkseite" title="Die Park-Seite">
        <p className="text-muted-foreground mb-4">
          Jeder Park auf park.fan hat eine eigene Seite mit Live-Daten, Öffnungszeiten, einem
          interaktiven Kalender und einer Karte. Hier ist, was dich erwartet.
        </p>

        <SubSection title="Kopfbereich – Schnellübersicht">
          <p className="text-muted-foreground text-sm">
            Ganz oben findest du das Park-Hero-Bild mit dem aktuellen Status (offen/geschlossen),
            den heutigen Öffnungszeiten, der aktuellen Auslastung und dem Wetter. Eine
            Fortschrittsleiste zeigt, wie lange der Park heute noch offen ist.
          </p>
          <InfoBox>
            Alle Zeiten werden in der <strong>Zeitzone des Parks</strong> angezeigt – egal wo du
            dich gerade befindest. Ein Park in Florida zeigt z.&nbsp;B. Eastern Time, Europa-Park
            Mitteleuropäische Zeit.
          </InfoBox>
          <MockParkHeader locale="de" />
        </SubSection>

        <SubSection title="Tabs – Attraktionen, Shows, Kalender, Karte">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">🎢 Attraktionen</p>
              <p className="text-muted-foreground">
                Alle Fahrgeschäfte mit Live-Wartezeit, Status, Trend und Vergleich zum Durchschnitt.
                Filtere nach Name oder sortiere nach Wartezeit.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">🎭 Shows</p>
              <p className="text-muted-foreground">
                Alle Shows mit aktuellem Status und den nächsten Showzeiten des Tages.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Kalender</p>
              <p className="text-muted-foreground">
                30-Tage-Vorausschau mit Crowd-Prognosen, Öffnungszeiten, Wetter, Feiertagen und
                Schulferien. Der beste Weg, den richtigen Besuchstag zu finden.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">🗺️ Karte</p>
              <p className="text-muted-foreground">
                Interaktive Karte mit allen Attraktionen, Shows und Restaurants. Bei aktiviertem
                Standort siehst du auch deinen eigenen Standort im Park.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Attraktionskarte im Detail">
          <p className="text-muted-foreground text-sm">
            Jede Attraktionskarte zeigt dir auf einen Blick: aktuelle Wartezeit, Trend (steigend /
            stabil / fallend), Vergleich zum typischen Wert, das heutige Tageshoch und einen
            Mini-Graphen (Sparkline) mit dem Wartezeit-Verlauf der letzten Stunden.
          </p>
          <MockAttractionCards locale="de" />
        </SubSection>

        <SubSection title="Show-Tab: Showzeiten auf einen Blick">
          <p className="text-muted-foreground text-sm">
            Der Shows-Tab listet alle Shows des Parks mit ihren heutigen Showzeiten. Vergangene
            Zeiten werden durchgestrichen, die <strong>nächste Showtime</strong> ist grün
            hervorgehoben – so siehst du auf einen Blick, wann du wo sein musst.
          </p>
          <MockShowCards />
        </SubSection>

        <SubSection title="Saisonale Attraktionen & Shows">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              Manche Attraktionen und Shows sind nur zu bestimmten Jahreszeiten in Betrieb – zum
              Beispiel Eislaufbahnen im Winter oder Wasserbahnen im Sommer. park.fan erkennt das
              automatisch und blendet diese saisonalen Attraktionen außerhalb ihrer Saison
              standardmäßig aus.
            </GlossaryInject>
          </p>
          <div className="not-prose space-y-4">
            {/* Badge examples */}
            <div className="space-y-2">
              {[
                {
                  icon: Snowflake,
                  label: 'Winter',
                  color: 'border border-sky-500/30 bg-sky-500/15 text-sky-400',
                  opacity: '',
                  desc: 'Attraktion ist aktuell in Saison (z. B. Winter-Event). Badge erscheint auf der Karte.',
                },
                {
                  icon: Sun,
                  label: 'Sommer',
                  color: 'border border-amber-500/30 bg-amber-500/15 text-amber-500',
                  opacity: '',
                  desc: 'Sommer-Attraktion – z. B. Wildwasserbahn. Aktiv von Mai bis September.',
                },
                {
                  icon: Leaf,
                  label: 'Saisonal',
                  color: 'border border-violet-500/30 bg-violet-500/15 text-violet-500',
                  opacity: 'opacity-50',
                  desc: 'Außerhalb der Saison: Badge gedimmt. Attraktion in den Tabs und auf der Karte standardmäßig ausgeblendet.',
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
            {/* Toggle button demo */}
            <div className="flex items-start gap-3">
              <button className="border-border/60 bg-background/60 inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2 py-1 text-xs shadow-md backdrop-blur-md">
                <EyeOff className="h-3 w-3" />3 außer Saison
              </button>
              <p className="text-muted-foreground text-sm">
                Wenn Off-Season-Einträge versteckt sind, erscheint dieser Button neben der
                Abschnittsüberschrift. Klick darauf, um sie einzublenden – z. B. um eine
                Winter-Attraktion im Sommer zu finden.
              </p>
            </div>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Badges ───────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges & Status-Anzeigen">
        <p className="text-muted-foreground mb-4">
          park.fan nutzt ein einheitliches Farbsystem, um Informationen sofort verständlich zu
          machen. Hier erklärt du alle Badges im Detail.
        </p>

        {/* Park-Status */}
        <SubSection title="Park- & Attraktionsstatus">
          <p className="text-muted-foreground mb-3 text-sm">
            Jede Attraktion und jeder Park zeigt einen von vier Statuswerten:
          </p>
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'badge-status-operating',
                label: 'Geöffnet',
                desc: 'Attraktion / Park ist in Betrieb. Wartezeiten werden live aktualisiert.',
              },
              {
                icon: AlertTriangle,
                color: 'badge-status-down',
                label: 'Störung',
                desc: 'Vorübergehend geschlossen – z. B. technische Störung oder Sicherheitspause. Meist kurzfristig, kann sich innerhalb von Minuten ändern.',
              },
              {
                icon: XCircle,
                color: 'badge-status-closed',
                label: 'Geschlossen',
                desc: 'Heute nicht in Betrieb – saisonale Schließung oder planmäßige Ruhezeit.',
              },
              {
                icon: Wrench,
                color: 'badge-status-refurbishment',
                label: 'Wartung',
                desc: 'Längere Wartungsphase. Diese Attraktionen sind für mehrere Tage oder Wochen geschlossen.',
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

        {/* Crowd Level */}
        <SubSection title="Auslastungsstufen (Crowd Level)">
          <p className="text-muted-foreground mb-3 text-sm">
            Das Crowd Level zeigt, wie voll ein Park oder wie stark eine Attraktion ausgelastet ist
            – im Verhältnis zum historischen Median (P50), also dem typischen Wert für diese
            Attraktion. 100 % bedeutet: genau so voll wie ein durchschnittlicher Tag.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Sehr Niedrig',
                icon: User,
                threshold: '≤ 60 % des P50',
                desc: 'Kaum Betrieb – kurze bis keine Warteschlangen. Idealer Besuchstag.',
              },
              {
                color: 'badge-crowd-low',
                label: 'Niedrig',
                icon: User,
                threshold: '61–89 % des P50',
                desc: 'Wenig los – die meisten Attraktionen laufen mit kurzen Wartezeiten.',
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Normal',
                icon: Users,
                threshold: '90–110 % des P50',
                desc: 'Typischer Tag – Wartezeiten im erwarteten Rahmen (±10 % des Medians).',
              },
              {
                color: 'badge-crowd-high',
                label: 'Hoch',
                icon: Users,
                threshold: '111–150 % des P50',
                desc: 'Viel los – Wartezeiten spürbar über dem Durchschnitt.',
              },
              {
                color: 'badge-crowd-very-high',
                label: 'Sehr Hoch',
                icon: Users,
                threshold: '151–200 % des P50',
                desc: 'Sehr voll – Wartezeiten fast doppelt so lang wie üblich. Früh anreisen lohnt sich.',
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Extrem',
                icon: AlertTriangle,
                threshold: '> 200 % des P50',
                desc: 'Rekordbetrieb – mehr als doppelt so voll wie an einem typischen Tag. Schulferien-Wochenenden, Sondertage.',
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
          <InfoBox>
            <strong>Wie wird das Crowd Level berechnet?</strong> park.fan vergleicht die aktuelle
            durchschnittliche Wartezeit mit dem historischen Median (P50) – dem typischen Wert für
            diese Attraktion. Eine Auslastung von 100 % bedeutet: genau so voll wie ein
            durchschnittlicher Tag. Bei 60 % ist es deutlich ruhiger, bei 200 % doppelt so voll wie
            üblich.
          </InfoBox>
        </SubSection>

        {/* Trend */}
        <SubSection title="Trend-Indikatoren">
          <p className="text-muted-foreground mb-3 text-sm">
            Neben der aktuellen Wartezeit zeigt ein Pfeil den Trend der letzten 30 Minuten:
          </p>
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Steigend',
                desc: 'Die Warteschlange wird länger. Jetzt anstellen lohnt sich noch.',
              },
              {
                icon: Minus,
                color: 'text-trend-stable',
                label: 'Stabil',
                desc: 'Die Wartezeit bleibt konstant.',
              },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Fallend',
                desc: 'Die Warteschlange wird kürzer – günstiger Moment zum Anstellen.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
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

        {/* Vergleichs-Badge */}
        <SubSection title="Vergleichs-Badge (vs. Typisch)">
          <p className="text-muted-foreground mb-3 text-sm">
            Dieser Badge vergleicht die aktuelle Auslastung mit dem historischen Durchschnittswert
            für diesen Tag und diese Uhrzeit:
          </p>
          <div className="space-y-2">
            {[
              {
                color: 'badge-crowd-very-low',
                label: 'Viel Niedriger',
                icon: Activity,
                desc: 'Deutlich weniger los als typischerweise – ideale Bedingungen.',
              },
              {
                color: 'badge-crowd-low',
                label: 'Niedriger',
                icon: Activity,
                desc: 'Etwas weniger Betrieb als üblich.',
              },
              {
                color: 'badge-crowd-moderate',
                label: 'Typisch',
                icon: Activity,
                desc: 'Wie erwartet für diese Zeit – keine Überraschungen.',
              },
              {
                color: 'badge-crowd-high',
                label: 'Höher',
                icon: Activity,
                desc: 'Mehr los als normalerweise – Wartezeiten etwas länger.',
              },
              {
                color: 'badge-crowd-extreme',
                label: 'Viel Höher',
                icon: Activity,
                desc: 'Ungewöhnlich voll – außergewöhnliche Situation (Sonderevent, Schulferien-Peak).',
              },
            ].map(({ color, label, icon, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">
                  <GlossaryInject>{desc}</GlossaryInject>
                </p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Warteschlangen-Typen */}
        <SubSection title="Warteschlangen-Typen">
          <p className="text-muted-foreground mb-3 text-sm">
            Viele Parks bieten neben der normalen Warteschlange zusätzliche Optionen:
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: User,
                label: 'Single Rider',
                termId: 'single-rider',
                desc: 'Einzelfahrer-Schlange. Oft deutlich kürzer als die reguläre Schlange, aber du kannst nicht mit Begleitern fahren.',
              },
              {
                color: 'badge-status-down',
                icon: Zap,
                label: 'Lightning Lane',
                termId: 'lightning-lane',
                desc: 'Kostenpflichtiger Express-Pass (z. B. bei Disney). Zeigt den aktuellen Preis und die Rückkehrzeit.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Rückkehrzeit',
                termId: 'virtual-queue',
                desc: 'Kostenlose virtuelle Schlange – du holst dir einen Zeitslot und kehrst zur angezeigten Uhrzeit zurück.',
              },
              {
                color: 'bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40',
                icon: Ticket,
                label: 'Boarding Group',
                termId: 'boarding-group',
                desc: 'Virtuelle Warteschlange mit Gruppenummer. Beliebt bei sehr gefragten neuen Attraktionen.',
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

        {/* Stoßzeit-Badge */}
        <SubSection title="Stoßzeit-Badge">
          <div className="flex items-start gap-3">
            <DemoBadge
              color="bg-primary/65 border-primary/80 dark:bg-primary/25 dark:border-primary/40"
              label="in 1 Std. 30 Min."
              icon={Clock}
            />
            <p className="text-muted-foreground text-sm">
              Dieser Badge erscheint im Park-Kopfbereich und zeigt, wie lange es noch bis zur
              prognostizierten Stoßzeit des Tages dauert. Er verschwindet automatisch, wenn die
              Stoßzeit vorüber ist.
            </p>
          </div>
        </SubSection>
      </Section>

      {/* ── 6. Kalender ─────────────────────────────────────────────────────── */}
      <Section id="kalender" title="Der Crowd-Kalender">
        <p className="text-muted-foreground mb-4">
          Der Kalender ist das mächtigste Werkzeug auf park.fan, wenn du deinen Besuch im Voraus
          planst. Er zeigt für jeden Tag der nächsten 30+ Tage eine KI-Prognose mit Crowd-Level,
          Öffnungszeiten, Wetter und besonderen Ereignissen – alles auf einen Blick.
        </p>

        <SubSection title="Was steht in jeder Kalender-Karte?">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <p className="mb-2 font-semibold">Eine typische Kalender-Karte zeigt:</p>
            <ul className="text-muted-foreground space-y-1.5">
              <li>
                📅 <strong>Datum und Wochentag</strong>
              </li>
              <li>
                🎯 <strong>Crowd-Level-Badge</strong> (z. B. „Sehr Hoch") – die KI-Prognose für den
                Gesamtandrang
              </li>
              <li>
                🕐 <strong>Öffnungszeiten</strong> – oder „Est." wenn noch nicht offiziell bestätigt
                (s. u.)
              </li>
              <li>
                🌤️ <strong>Wettervorhersage</strong> mit Min-/Max-Temperatur
              </li>
              <li>
                ⌚ <strong>Ø Wartezeit</strong> – prognostizierte durchschnittliche Wartezeit aller
                Attraktionen
              </li>
              <li>
                🎟️ <strong>Ticketpreis</strong>, wenn vom Park veröffentlicht
              </li>
            </ul>
          </div>
          <p className="text-muted-foreground mt-2 text-sm">
            <strong>Was bedeutet „Est."?</strong> Öffnungszeiten mit dem Zusatz „Est." (Estimated /
            Geschätzt) wurden noch nicht offiziell vom Park bestätigt. park.fan leitet sie aus
            historischen Mustern ab – sie können sich noch ändern.
          </p>
        </SubSection>

        <SubSection title="Legende – Icons in den Kalender-Karten">
          <div className="space-y-2 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Gesetzlicher Feiertag',
                desc: 'Parks sind oft länger geöffnet, aber auch voller. Prüfe die Prognose!',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'Schulferien',
                desc: 'Erfahrungsgemäß die vollsten Tage des Jahres – extreme Wartezeiten möglich.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Brückentag',
                desc: 'Voraussichtlicher Brückentag (z. B. zwischen Feiertag und Wochenende) – oft erhöhter Andrang.',
              },
              {
                icon: XCircle,
                color: 'text-red-500',
                label: 'Park geschlossen',
                desc: 'Kein Betrieb an diesem Tag – keine Prognose verfügbar.',
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

        <SubSection title="Praxisbeispiel: Den besten Besuchstag finden">
          <p className="text-muted-foreground mb-3 text-sm">
            Du planst einen Besuch im Europa-Park im Oktober. So gehst du vor:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                Öffne die Park-Seite und wechsle zum Tab <strong>Kalender</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                Du siehst sofort: Die Ferienwochen in Baden-Württemberg und NRW haben viele Karten
                mit dem <Backpack className="inline h-4 w-4 text-yellow-500" />
                -Icon und dem Badge <strong>„Sehr Hoch"</strong> oder <strong>„Extrem"</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                Suche dir einen Dienstag oder Mittwoch <em>ohne</em> Ferienicon – diese zeigen oft{' '}
                <strong>„Niedrig"</strong> oder <strong>„Normal"</strong>. Öffnungszeiten und
                Wetterprognose helfen dir, die finale Entscheidung zu treffen.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                4
              </span>
              <span>
                Merke dir den Tag und buche Tickets frühzeitig – besonders an prognostizierten
                grünen Tagen sind die Kontingente oft begrenzt.
              </span>
            </li>
          </ol>
          <div className="mt-6">
            <LiveCalendarExample locale="de" />
          </div>
        </SubSection>

        <SubSection title="Attraktion-Kalender">
          <p className="text-muted-foreground text-sm">
            Auf der Detailseite einer Attraktion gibt es ebenfalls einen Verlaufs-Kalender. Er zeigt
            für jeden vergangenen Tag, wie stark die Attraktion ausgelastet war – und ob sie in
            Betrieb war oder nicht. Das ist ideal, um wiederkehrende Muster zu erkennen: Hatte Taron
            in den letzten vier Wochen immer donnerstags kurze Wartezeiten? Dann könnte das auch
            nächste Woche so sein.
          </p>
        </SubSection>

        <TipBox>
          Die besten Besuchstage sind frühe Wochentage außerhalb der Schulferien – Dienstag bis
          Donnerstag zeigen oft die niedrigsten Crowd-Level. Vermeide insbesondere Schulferienwochen
          der bevölkerungsreichen Bundesländer NRW, Bayern und Baden-Württemberg.
        </TipBox>
      </Section>

      {/* ── 7. KI-Prognosen ─────────────────────────────────────────────────────── */}
      <Section id="prognosen" title="KI-gestützte Prognosen">
        <p className="text-muted-foreground mb-4">
          park.fan nutzt maschinelles Lernen, um Besucherandrang und Wartezeiten Tage im Voraus
          vorherzusagen. Das Modell wird kontinuierlich mit neuen Daten trainiert und berücksichtigt
          dabei vier Hauptfaktoren:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historische Daten',
              desc: 'Millionen von Warteschlangen-Datenpunkten aus der Vergangenheit – pro Attraktion, Wochentag und Uhrzeit.',
            },
            {
              icon: '📅',
              title: 'Ferienkalender',
              desc: 'Schulferien aller deutschen Bundesländer sowie nationaler Feiertage in ganz Europa.',
            },
            {
              icon: '🌤️',
              title: 'Wetterprognosen',
              desc: 'Temperatur, Niederschlag und Sonnenstunden – Regen treibt mehr Besucher zu Indoorattraktionen.',
            },
            {
              icon: '🎉',
              title: 'Sonderevents',
              desc: 'Halloween-Nights, Winter-Events und andere Parksondertage erzeugen deutlich höheren Andrang.',
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

        <SubSection title="Wo finde ich die Prognosen?">
          <div className="space-y-3 text-sm">
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📅 Im Crowd-Kalender</p>
              <p className="text-muted-foreground mt-0.5">
                Jede Kalenderkarte enthält eine Tagesprognose: Crowd-Level, Ø Wartezeit und
                Öffnungszeiten – bis zu 30+ Tage im Voraus.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">⏰ Stoßzeit-Badge auf der Park-Seite</p>
              <p className="text-muted-foreground mt-0.5">
                Im Park-Kopfbereich zeigt ein Badge, wann heute voraussichtlich die Stoßzeit ist –
                z. B. „Stoßzeit in 1 Std. 30 Min.". So kannst du eine Pause oder den Besuch einer
                weniger beliebten Attraktion genau dann einplanen.
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="font-semibold">📈 Stündliche Prognosekurve auf der Attraktions-Seite</p>
              <p className="text-muted-foreground mt-0.5">
                Jede Attraktion hat eine eigene Seite mit einer Kurve, die zeigt, wie sich die
                Wartezeit über den Tag verteilt – mit dem prognostizierten Verlauf für heute und
                morgen.
              </p>
            </div>
          </div>
        </SubSection>

        <SubSection title="Praxisbeispiel: Prognose im Alltag nutzen">
          <p className="text-muted-foreground mb-3 text-sm">
            Du bist an einem Samstag in den Herbstferien in Phantasialand. Der Kalender zeigt „Sehr
            Hoch" für den Tag. So nutzt du die Prognosen:
          </p>
          <ol className="text-muted-foreground space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                1
              </span>
              <span>
                <strong>Morgens beim Betreten:</strong> Der Stoßzeit-Badge zeigt „Stoßzeit in ca. 2
                Std." – du hast also bis ca. 11:30 Uhr Zeit für die ersten Highlights.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                2
              </span>
              <span>
                <strong>Taron-Seite aufrufen:</strong> Die Prognosekurve zeigt heute 9:30 Uhr ≈ 15
                Min., 12:00 Uhr ≈ 65 Min., 15:00 Uhr ≈ 40 Min. → Du weißt: direkt nach Öffnung oder
                Mitte des Nachmittags sind die besten Slots.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="bg-primary text-primary-foreground flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                3
              </span>
              <span>
                <strong>Mittagspause zur Stoßzeit:</strong> Statt um 12 Uhr in der Schlange zu
                stehen, gönnst du dir das Restaurant. Die Live-Trends zeigen: um 15 Uhr fällt die
                Wartezeit wieder – perfekter Moment für Taron.
              </span>
            </li>
          </ol>
        </SubSection>

        <SubSection title="Wie genau sind die Prognosen?">
          <p className="text-muted-foreground text-sm">
            Die Genauigkeit variiert je nach Park und Vorhersagezeitraum. Auf der
            Attraktionsdetailseite wird die Prognose-Genauigkeit für jede Attraktion angezeigt – von{' '}
            <strong>Schlecht</strong> bis <strong>Exzellent</strong>. Je mehr historische Daten
            vorhanden sind, desto präziser die Prognose. Kurzfristige Vorhersagen (1–3 Tage) sind
            grundsätzlich zuverlässiger als langfristige (7–14 Tage).
          </p>
        </SubSection>

        <SubSection title="Wartezeit-Sparklines">
          <p className="text-muted-foreground text-sm">
            Auf jeder Attraktionskarte zeigt ein kleiner Liniengraph (Sparkline) den
            Wartezeit-Verlauf der letzten Stunden. So erkennst du sofort Trends: War es morgens
            ruhig und steigt die Wartezeit jetzt rapide an – oder fällt sie gerade?
          </p>
          <MockHourlyChart locale="de" />
        </SubSection>

        <TipBox>
          Kombiniere Kalender und Prognose: Suche dir im Kalender einen grünen Tag aus, dann schau
          auf der Attraktionsseite, zu welcher Stunde die Prognosekurve am tiefsten ist. So triffst
          du immer zum richtigen Moment auf die kürzeste Schlange.
        </TipBox>
      </Section>

      {/* ── 8. Personas ─────────────────────────────────────────────────────── */}
      <Section id="personas" title="Für wen eignet sich park.fan?">
        <p className="text-muted-foreground mb-6">
          park.fan ist für alle Freizeitpark-Fans gemacht – egal ob du mit der Familie, als
          leidenschaftlicher Enthusiast oder zum ersten Mal in einem Park bist.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Die Familie"
            subtitle="Plant einen unvergesslichen Ausflug für alle"
          >
            <Li>
              Crowd-Kalender: Welcher Tag hat die kürzesten Warteschlangen? Perfekt um den Urlaub zu
              planen.
            </Li>
            <Li>Wetter im Kalender: Plant ihr für einen Regentag? Indoor-Attraktionen prüfen!</Li>
            <Li>
              Favoriten: Speichere die 10 wichtigsten Attraktionen für Kinder – sieh sofort, welche
              gerade offen und kurz sind.
            </Li>
            <Li>
              Live-Wartezeiten: Entscheidet spontan, welches Fahrgeschäft als nächstes dran ist.
            </Li>
            <Li>
              Stoßzeit-Badge: Wisst ihr, wann es am vollsten wird – und könnt vorher eine Pause
              einplanen.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Der Freizeitparknerd"
            subtitle="Jede Minute im Park muss optimal genutzt werden"
          >
            <Li>
              Crowd Level (P50-Basis): Verstehe, ob eine Attraktion gerade wirklich
              überdurchschnittlich voll ist – oder nur "normal".
            </Li>
            <Li>
              Historischer Verlauf: Wann hatte Taron in den letzten Wochen typischerweise kurze
              Wartezeiten?
            </Li>
            <Li>
              Trend-Indikatoren: Steigt die Schlange gerade? Warte noch 20 Minuten und sie könnte
              kürzer sein.
            </Li>
            <Li>
              Single Rider / Lightning Lane: park.fan zeigt alle verfügbaren Warteschlangen-Typen
              mit aktuellen Zeiten und Preisen.
            </Li>
            <Li>
              Vergleichs-Badge: Ist heute wirklich "viel höher" als typisch? Dann ist es Zeit für
              Plan B.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Der Erstbesucher"
            subtitle="Zum ersten Mal in einem großen Freizeitpark"
          >
            <Li>Suche: Finde deinen Park schnell – auch wenn du den genauen Namen nicht weißt.</Li>
            <Li>
              Park-Karte: Orientiere dich mit der interaktiven Karte, bevor und während du im Park
              bist.
            </Li>
            <Li>
              Status-Badges: Grün = läuft, Orange = kurze Störung, Grau = heute nicht, Lila =
              längere Wartung. Einfach und klar.
            </Li>
            <Li>
              Crowd-Kalender: Welcher Tag ist der beste? Die Farben sagen alles – Grün ist gut, Rot
              ist stressig.
            </Li>
            <Li>Öffnungszeiten: Immer aktuell – inklusive Sonderöffnungszeiten an Feiertagen.</Li>
          </PersonaCard>

          <PersonaCard
            emoji="⚡"
            title="Der Spontanbesucher"
            subtitle="Kurz entschlossen – maximale Effizienz gewünscht"
          >
            <Li>
              Standort-Funktion: park.fan erkennt automatisch deinen nächsten Park – kein Suchen
              nötig.
            </Li>
            <Li>
              Live-Wartezeiten: Sofort sehen, was gerade offen ist und wie lange die Wartezeit ist.
            </Li>
            <Li>Trend-Indikatoren: Warteschlange fällt gerade? Perfekter Moment zum Anstellen.</Li>
            <Li>
              Favoriten: Wenn du den Park schon kennst, hast du deine Top-Attraktionen schon
              gespeichert.
            </Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. Beliebte Parks ───────────────────────────────────────────────── */}
      <Section id="parks" title="Beliebte Parks">
        <p className="text-muted-foreground mb-6">
          park.fan deckt über 150 Freizeitparks weltweit ab – von Walt Disney World bis Europa-Park.
          Hier sind die meistbesuchten Parks in deiner Region mit aktuellen Live-Daten:
        </p>
        <PopularParksGridClient />
      </Section>

      {/* ── 10. Glossar ───────────────────────────────────────────────────── */}
      <Section id="glossar" title="Das Glossar & Fachbegriff-Hervorhebung">
        <p className="text-muted-foreground mb-4">
          park.fan pflegt ein vollständiges{' '}
          <Link href="/glossar" className="text-primary underline">
            Glossar der Freizeitpark-Fachbegriffe
          </Link>{' '}
          –{' '}
          <GlossaryInject>
            {
              'von Wartezeit über Besucherkalender bis zu Achterbahn-Elementen. Jeder Begriff enthält eine Kurzdefinition und eine ausführliche Erklärung mit praktischen Tipps.'
            }
          </GlossaryInject>
        </p>

        <SubSection title="Automatische Fachbegriff-Hervorhebung auf Attraktions-Seiten">
          <p className="text-muted-foreground mb-3 text-sm">
            <GlossaryInject>
              {
                'Auf Attraktions-Seiten werden Glossar-Begriffe im Text automatisch erkannt und mit einer gestrichelten Linie unterstrichen. Beim Hovern erscheint eine Kurzbeschreibung – ein Klick führt direkt zum vollständigen Glossar-Eintrag.'
              }
            </GlossaryInject>
          </p>
          <div className="bg-muted/30 rounded-xl border p-4 text-sm leading-relaxed">
            <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
              Beispieltext (hover über die gestrichelten Begriffe)
            </p>
            <p>
              <GlossaryInject>
                {`Die beste Strategie für einen Freizeitpark-Besuch ist, vorab einen Blick in den Besucherkalender zu werfen. An einem Spitzentag können die Wartezeiten für beliebte Attraktionen 90 Minuten überschreiten. Wer einen Express Pass kauft oder die Einzelfahrer-Lane nutzt, spart wertvolle Zeit. Alternativ bietet eine virtuelle Warteschlange die Möglichkeit, die Schlange komplett zu umgehen – ideal, wenn die Besucherdichte hoch ist.`}
              </GlossaryInject>
            </p>
          </div>
        </SubSection>

        <TipBox label="Tipp">
          Das vollständige Glossar ist unter{' '}
          <Link href="/glossar" className="text-primary font-medium underline">
            park.fan/glossar
          </Link>{' '}
          <GlossaryInject>
            {
              'erreichbar – mit Begriffen aus 7 Kategorien: Wartezeiten, Besucherdichte, Park-Betrieb, Planung, Attraktionen, Achterbahnen und Achterbahn-Elemente.'
            }
          </GlossaryInject>
        </TipBox>
      </Section>

      {/* ── 11. FAQ ─────────────────────────────────────────────────────────── */}
      <Section id="faq" title="Häufige Fragen">
        <div className="space-y-4">
          {[
            {
              q: 'Wie oft werden die Wartezeiten aktualisiert?',
              a: 'Die Wartezeiten werden minütlich aktualisiert. Bei manchen Parks erfolgt die Aktualisierung alle 2–5 Minuten, abhängig von der Datenverfügbarkeit.',
            },
            {
              q: 'Woher kommen die Daten?',
              a: 'park.fan bezieht Live-Daten von ThemeParks.wiki, Queue-Times.com und Wartezeiten.app – alles offizielle oder weit verbreitete Quellen für Freizeitpark-Daten.',
            },
            {
              q: 'Ist park.fan kostenlos?',
              a: 'Ja, park.fan ist vollständig kostenlos und erfordert keine Anmeldung.',
            },
            {
              q: 'Werden meine Favoriten auf anderen Geräten gespeichert?',
              a: 'Nein, Favoriten werden lokal im Browser gespeichert (localStorage). Sie sind auf dem Gerät verfügbar, auf dem du sie gesetzt hast.',
            },
            {
              q: 'Warum sehe ich keine Wartezeiten für meinen Park?',
              a: 'Nicht alle Parks bieten offizielle Live-Daten. Manche Parks übermitteln keine Echtzeitdaten – in diesem Fall zeigt park.fan den Betriebsstatus, aber keine konkreten Wartezeiten.',
            },
            {
              q: 'Was bedeutet "Öffnungszeit: Est."?',
              a: 'Est. (Estimated / Geschätzt) bedeutet, dass die Öffnungszeiten noch nicht offiziell vom Park bestätigt wurden. park.fan leitet sie aus historischen Mustern ab – sie können sich noch ändern.',
            },
            {
              q: 'Wie weit in die Zukunft reicht der Crowd-Kalender?',
              a: 'Der Kalender zeigt Prognosen für die nächsten 30+ Tage. Weiter entfernte Daten sind naturgemäß etwas weniger präzise als Prognosen für morgen oder übermorgen.',
            },
            {
              q: 'Wie viele Parks sind abgedeckt?',
              a: 'Aktuell deckt park.fan über 150 Parks mit mehr als 5.000 Attraktionen weltweit ab – von Walt Disney World über Europa-Park bis zu Parks in Asien und Australien.',
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
    </div>
  );
}

// ─── English Content ───────────────────────────────────────────────────────────

export { ContentDE };
