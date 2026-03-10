/* eslint-disable react/no-unescaped-entities */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { locales, generateAlternateLanguages, localeToOpenGraphLocale } from '@/i18n/config';
import { routing, type Locale } from '@/i18n/routing';
import type { Metadata } from 'next';
import { getOgImageUrl } from '@/lib/utils/og-image';
import { LocaleContent } from '@/components/common/locale-content';
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
} from 'lucide-react';

interface HowtoPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: HowtoPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'howto' });
  const ogImageUrl = getOgImageUrl([locale, 'howto']);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: localeToOpenGraphLocale[locale as keyof typeof localeToOpenGraphLocale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => localeToOpenGraphLocale[l]),
      url: `https://park.fan/${locale}/howto`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://park.fan/${locale}/howto`,
      languages: {
        ...generateAlternateLanguages((l) => `/${l}/howto`),
        'x-default': 'https://park.fan/en/howto',
      },
    },
    keywords: [
      'Freizeitpark Wartezeiten',
      'Freizeitpark App',
      'park.fan Anleitung',
      'Crowd-Kalender',
      'Besucherprognose',
      'Warteschlangen',
      'theme park wait times',
      'crowd calendar',
      'Disney Wartezeiten',
      'Europa-Park Wartezeiten',
      'Phantasialand Wartezeiten',
    ],
  };
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="border-border mb-6 border-b pb-3 text-3xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-xl font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function DemoBadge({
  color,
  label,
  icon: Icon,
}: {
  color: string;
  label: string;
  icon?: React.ElementType;
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tracking-wide text-white uppercase ${color}`}
    >
      {Icon && <Icon className="h-3 w-3 shrink-0" />}
      {label}
    </span>
  );
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-primary/5 border-primary/20 rounded-xl border p-4 text-sm leading-relaxed">
      {children}
    </div>
  );
}

function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm leading-relaxed">
      <span className="mb-1 block font-bold text-yellow-600 dark:text-yellow-400">Tipp</span>
      {children}
    </div>
  );
}

function TipBoxEN({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm leading-relaxed">
      <span className="mb-1 block font-bold text-yellow-600 dark:text-yellow-400">Tip</span>
      {children}
    </div>
  );
}

function PersonaCard({
  emoji,
  title,
  subtitle,
  children,
}: {
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card rounded-xl border p-6">
      <div className="mb-3 flex items-center gap-3">
        <span className="text-3xl">{emoji}</span>
        <div>
          <h3 className="text-lg font-bold">{title}</h3>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>
      <ul className="text-muted-foreground space-y-2 text-sm">{children}</ul>
    </div>
  );
}

function Li({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <span>{children}</span>
    </li>
  );
}

// ─── German Content ────────────────────────────────────────────────────────────

function ContentDE() {
  return (
    <div className="space-y-16 text-base leading-7">
      {/* Intro */}
      <div className="space-y-4">
        <p className="text-muted-foreground text-lg leading-relaxed">
          park.fan ist dein kostenloser Begleiter für Freizeitparks weltweit – mit
          Live-Wartezeiten, KI-gestützten Besucherprognosen und einem tagesgenauen Crowd-Kalender.
          Diese Seite erklärt alle Funktionen im Detail.
        </p>
        <nav
          aria-label="Inhaltsverzeichnis"
          className="bg-muted/40 rounded-xl border p-5 not-prose"
        >
          <p className="mb-3 font-semibold">Inhaltsverzeichnis</p>
          <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
            {[
              ['#suche', '1. Suche'],
              ['#favoriten', '2. Favoriten'],
              ['#parkseite', '3. Die Park-Seite'],
              ['#badges', '4. Badges & Anzeigen'],
              ['#kalender', '5. Crowd-Kalender'],
              ['#prognosen', '6. KI-Prognosen'],
              ['#standort', '7. Standort & Nearby'],
              ['#personas', '8. Für wen?'],
              ['#faq', '9. FAQ'],
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

      {/* ── 1. Suche ─────────────────────────────────────────────────────── */}
      <Section id="suche" title="Die Suche">
        <p className="text-muted-foreground mb-4">
          Die globale Suche ist der schnellste Weg, um einen Park, eine Attraktion, eine Show oder
          ein Restaurant zu finden.
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
              <strong>Mobil & Desktop:</strong> Klicke auf das{' '}
              <Search className="inline h-4 w-4" />
              -Symbol in der Kopfzeile oder in das Suchfeld auf der Startseite.
            </p>
          </div>
        </SubSection>

        <SubSection title="Was du suchen kannst">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              { icon: '🎢', label: 'Attraktionen', desc: 'Taron, Silver Star, Space Mountain...' },
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
            Jedes Ergebnis zeigt sofort den aktuellen Status und Crowd-Level. Bei Attraktionen wird
            die aktuelle Wartezeit direkt angezeigt.
          </p>
          <InfoBox>
            Die Suche startet ab 3 Zeichen und arbeitet mit Volltextsuche – Tippfehler werden
            toleriert. Suche nach "Phantasia" und du findest "Phantasialand".
          </InfoBox>
        </SubSection>

        <SubSection title="Vollständige Ergebnisse">
          <p className="text-muted-foreground text-sm">
            Klicke auf "Alle Ergebnisse anzeigen", um zur dedizierten Suchseite zu wechseln – dort
            sind alle Treffer nach Kategorie (Parks, Attraktionen, Shows, Restaurants) sortiert.
          </p>
        </SubSection>
      </Section>

      {/* ── 2. Favoriten ─────────────────────────────────────────────────── */}
      <Section id="favoriten" title="Favoriten">
        <p className="text-muted-foreground mb-4">
          Markiere Parks, Attraktionen, Shows und Restaurants als Favoriten für schnellen Zugriff
          direkt auf der Startseite – ganz ohne Anmeldung.
        </p>

        <SubSection title="Favorit hinzufügen">
          <p className="text-sm">
            Klicke auf den <Star className="inline h-4 w-4 text-yellow-500" />
            -Stern auf jeder Park- oder Attraktionskarte. Der Stern leuchtet auf – der Favorit ist
            gespeichert. Favoriten werden <strong>lokal in deinem Browser</strong> gespeichert und
            bleiben erhalten, bis du sie manuell entfernst.
          </p>
        </SubSection>

        <SubSection title="Favoriten auf der Startseite">
          <p className="text-muted-foreground text-sm">
            Sobald du mindestens einen Favoriten gesetzt hast, erscheint auf der Startseite ein
            eigener Bereich mit allen gespeicherten Inhalten. Bei aktiviertem Standort werden sie
            nach Entfernung sortiert – der nächste Park zuerst.
          </p>
        </SubSection>

        <SubSection title="Was wird als Favorit gespeichert?">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Parks', desc: 'Status, Öffnungszeiten, Auslastung auf einen Blick' },
              { label: 'Attraktionen', desc: 'Live-Wartezeit und Trend direkt in der Übersicht' },
              { label: 'Shows', desc: 'Nächste Showtime immer im Blick' },
              { label: 'Restaurants', desc: 'Küche und aktueller Status' },
            ].map(({ label, desc }) => (
              <div key={label} className="bg-muted/30 rounded-lg p-3">
                <p className="font-semibold">{label}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <TipBox>
          Plane deinen nächsten Besuch effizienter: Speichere die 5–10 Lieblingsattraktionen
          deines Zielparks als Favoriten. Am Besuchstag siehst du sofort, welche davon gerade
          kurze Wartezeiten haben.
        </TipBox>
      </Section>

      {/* ── 3. Park-Seite ─────────────────────────────────────────────────── */}
      <Section id="parkseite" title="Die Park-Seite">
        <p className="text-muted-foreground mb-4">
          Jeder Park hat eine eigene Seite mit Live-Daten, Öffnungszeiten, einem interaktiven
          Kalender und einer Karte.
        </p>

        <SubSection title="Kopfbereich – Schnellübersicht">
          <p className="text-muted-foreground text-sm">
            Ganz oben findest du das Park-Hero-Bild mit aktuellem Status (offen/geschlossen),
            heutigen Öffnungszeiten, aktueller Auslastung und Wetter. Eine Fortschrittsleiste zeigt,
            wie lange der Park heute noch offen ist.
          </p>
        </SubSection>

        <SubSection title="Tabs – Attraktionen, Shows, Kalender, Karte">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attraktionen',
                desc: 'Alle Fahrgeschäfte mit Live-Wartezeit, Status, Trend und Vergleich zum Durchschnitt. Filtere nach Name.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'Alle Shows mit aktuellem Status und den nächsten Showzeiten des Tages.',
              },
              {
                icon: '📅',
                label: 'Kalender',
                desc: '30-Tage-Vorausschau mit Crowd-Prognosen, Öffnungszeiten, Wetter, Feiertagen und Schulferien. Der beste Weg, den richtigen Besuchstag zu finden.',
              },
              {
                icon: '🗺️',
                label: 'Karte',
                desc: 'Interaktive Karte mit allen Attraktionen, Shows und Restaurants. Bei aktiviertem Standort siehst du auch deinen eigenen Standort.',
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
        </SubSection>

        <SubSection title="Attraktionskarte im Detail">
          <p className="text-muted-foreground text-sm">
            Jede Attraktionskarte zeigt: aktuelle Wartezeit, Trend (steigend / stabil / fallend),
            Vergleich zum typischen Wert, das heutige Tageshoch und einen Mini-Graphen (Sparkline)
            mit dem Wartezeit-Verlauf der letzten Stunden.
          </p>
        </SubSection>

        <SubSection title="Attraktion Detailseite">
          <p className="text-muted-foreground text-sm">
            Klicke auf eine Attraktion für die vollständige Detailseite: historischer
            Wartezeitverlauf als Kalender, stündliche P90-Auslastung, Vorhersage-Genauigkeit und
            alle verfügbaren Warteschlangen-Typen.
          </p>
        </SubSection>
      </Section>

      {/* ── 4. Badges ────────────────────────────────────────────────────── */}
      <Section id="badges" title="Badges & Status-Anzeigen">
        <p className="text-muted-foreground mb-4">
          park.fan nutzt ein einheitliches Farbsystem, um Informationen sofort verständlich zu
          machen. Hier sind alle Badges im Detail erklärt.
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
                color: 'bg-status-operating/65 border-status-operating/80',
                label: 'Geöffnet',
                desc: 'In Betrieb – Wartezeiten werden live aktualisiert.',
              },
              {
                icon: AlertTriangle,
                color: 'bg-status-down/65 border-status-down/80',
                label: 'Störung',
                desc: 'Vorübergehend geschlossen – technische Störung oder Sicherheitspause. Meist kurzfristig, kann sich innerhalb von Minuten ändern.',
              },
              {
                icon: XCircle,
                color: 'bg-status-closed/65 border-status-closed/80',
                label: 'Geschlossen',
                desc: 'Heute nicht in Betrieb – saisonale Schließung oder planmäßige Ruhezeit.',
              },
              {
                icon: Wrench,
                color: 'bg-status-refurbishment/65 border-status-refurbishment/80',
                label: 'Wartung',
                desc: 'Längere Wartungsphase – mehrere Tage oder Wochen geschlossen.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Crowd Level */}
        <SubSection title="Auslastungsstufen (Crowd Level)">
          <p className="text-muted-foreground mb-3 text-sm">
            Das Crowd Level zeigt, wie voll ein Park oder wie lang die Warteschlange an einer
            Attraktion ist – im Verhältnis zum historischen{' '}
            <strong>90. Perzentil (P90)</strong>. Ein Wert von "Hoch" bedeutet: voller als an 90 %
            aller bisherigen Betriebstage.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'bg-crowd-very-low/65 border-crowd-very-low/80',
                label: 'Sehr Niedrig',
                icon: User,
                threshold: '< 20 % des P90',
                desc: 'Kaum Betrieb – kurze bis keine Warteschlangen. Idealer Besuchstag.',
              },
              {
                color: 'bg-crowd-low/65 border-crowd-low/80',
                label: 'Niedrig',
                icon: User,
                threshold: '20–40 % des P90',
                desc: 'Wenig los – die meisten Attraktionen laufen mit kurzen Wartezeiten.',
              },
              {
                color: 'bg-crowd-moderate/65 border-crowd-moderate/80',
                label: 'Normal',
                icon: Users,
                threshold: '40–60 % des P90',
                desc: 'Typischer Tag – angemessene Wartezeiten, nichts Ungewöhnliches.',
              },
              {
                color: 'bg-crowd-high/65 border-crowd-high/80',
                label: 'Hoch',
                icon: Users,
                threshold: '60–80 % des P90',
                desc: 'Viel los – beliebte Attraktionen haben 30–60 Minuten Wartezeit.',
              },
              {
                color: 'bg-crowd-very-high/65 border-crowd-very-high/80',
                label: 'Sehr Hoch',
                icon: Users,
                threshold: '80–100 % des P90',
                desc: 'Sehr voll – Wartezeiten über 60 Minuten. Früh anreisen lohnt sich.',
              },
              {
                color: 'bg-crowd-extreme/65 border-crowd-extreme/80',
                label: 'Extrem',
                icon: AlertTriangle,
                threshold: '> 100 % des P90',
                desc: 'Rekordbetrieb – Wartezeiten über 90 Minuten. Schulferien, Sondertage.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[130px] flex-col gap-1">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <InfoBox>
            <strong>Was ist das 90. Perzentil (P90)?</strong> park.fan vergleicht die aktuelle
            Auslastung mit historischen Daten. Das P90 ist der Wert, den nur 10 % aller Tage
            überschreiten – der "sehr volle Tag"-Wert. Liegt die Auslastung bei 50 % des P90, ist
            es nur halb so voll wie an den vollsten Tagen.
          </InfoBox>
        </SubSection>

        {/* Trend */}
        <SubSection title="Trend-Indikatoren">
          <p className="text-muted-foreground mb-3 text-sm">
            Ein Pfeil neben der Wartezeit zeigt den Trend der letzten 30 Minuten:
          </p>
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Steigend',
                desc: 'Die Warteschlange wird länger – jetzt anstellen lohnt sich noch.',
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
                <span className={`flex w-28 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Vergleichs-Badge */}
        <SubSection title="Vergleichs-Badge (vs. Typisch)">
          <p className="text-muted-foreground mb-3 text-sm">
            Vergleicht die aktuelle Auslastung mit dem historischen Durchschnitt für diesen Tag und
            diese Uhrzeit:
          </p>
          <div className="space-y-2">
            {[
              {
                color: 'bg-crowd-very-low/65 border-crowd-very-low/80',
                label: 'Viel Niedriger',
                icon: Activity,
                desc: 'Deutlich weniger los als üblich – ideale Bedingungen.',
              },
              {
                color: 'bg-crowd-low/65 border-crowd-low/80',
                label: 'Niedriger',
                icon: Activity,
                desc: 'Etwas weniger Betrieb als typischerweise.',
              },
              {
                color: 'bg-crowd-moderate/65 border-crowd-moderate/80',
                label: 'Typisch',
                icon: Activity,
                desc: 'Wie erwartet für diese Zeit – keine Überraschungen.',
              },
              {
                color: 'bg-crowd-high/65 border-crowd-high/80',
                label: 'Höher',
                icon: Activity,
                desc: 'Mehr los als normalerweise – Wartezeiten etwas länger.',
              },
              {
                color: 'bg-crowd-extreme/65 border-crowd-extreme/80',
                label: 'Viel Höher',
                icon: Activity,
                desc: 'Ungewöhnlich voll – außergewöhnliche Situation (Sonderevent, Schulferien-Peak).',
              },
            ].map(({ color, label, icon, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
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
                color: 'bg-primary/65 border-primary/80',
                icon: User,
                label: 'Single Rider',
                desc: 'Einzelfahrer-Schlange – oft deutlich kürzer, aber du kannst nicht mit Begleitern fahren.',
              },
              {
                color: 'bg-status-down/65 border-status-down/80',
                icon: Zap,
                label: 'Lightning Lane',
                desc: 'Kostenpflichtiger Express-Pass (z. B. bei Disney) – zeigt aktuellen Preis und Rückkehrzeit.',
              },
              {
                color: 'bg-primary/65 border-primary/80',
                icon: Ticket,
                label: 'Rückkehrzeit',
                desc: 'Kostenlose virtuelle Schlange – du holst dir einen Zeitslot und kehrst zur angezeigten Uhrzeit zurück.',
              },
              {
                color: 'bg-primary/65 border-primary/80',
                icon: Ticket,
                label: 'Boarding Group',
                desc: 'Virtuelle Warteschlange mit Gruppenummer – beliebt bei sehr gefragten neuen Attraktionen.',
              },
            ].map(({ color, icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        {/* Stoßzeit */}
        <SubSection title="Stoßzeit-Badge">
          <div className="flex items-start gap-3">
            <DemoBadge
              color="bg-primary/65 border-primary/80"
              label="in 1 Std. 30 Min."
              icon={Clock}
            />
            <p className="text-muted-foreground text-sm">
              Erscheint im Park-Kopfbereich und zeigt, wie lange es bis zur prognostizierten
              Stoßzeit des Tages dauert. Verschwindet automatisch nach der Stoßzeit.
            </p>
          </div>
        </SubSection>
      </Section>

      {/* ── 5. Kalender ──────────────────────────────────────────────────── */}
      <Section id="kalender" title="Der Crowd-Kalender">
        <p className="text-muted-foreground mb-4">
          Der Crowd-Kalender ist das mächtigste Planungswerkzeug auf park.fan. Er zeigt für jeden
          Tag der nächsten 30+ Tage: Crowd-Level, Öffnungszeiten, Wetter und besondere Ereignisse.
        </p>

        <SubSection title="Legende – Rahmenfarben der Kalender-Karten">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Gesetzlicher Feiertag',
                desc: 'Parks oft länger geöffnet, aber auch voller. Prüfe die Prognose!',
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
                desc: 'Kein Betrieb an diesem Tag.',
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

        <SubSection title="Inhalt einer Kalender-Karte">
          <div className="bg-muted/30 rounded-xl border p-4 text-sm">
            <ul className="text-muted-foreground space-y-1.5">
              <li>📅 Datum und Wochentag</li>
              <li>🎯 Crowd-Level-Badge (z. B. "Sehr Hoch")</li>
              <li>🕐 Öffnungszeiten (oder "Est." wenn noch nicht bestätigt)</li>
              <li>🌤️ Wettervorhersage mit Min-/Max-Temperatur</li>
              <li>⌚ Durchschnittliche Wartezeit des Tages (Prognose)</li>
              <li>🎟️ Ticketpreis, wenn verfügbar</li>
            </ul>
          </div>
        </SubSection>

        <SubSection title="Attraktion-Verlaufskalender">
          <p className="text-muted-foreground text-sm">
            Auf der Detailseite einer Attraktion gibt es ebenfalls einen Verlaufs-Kalender. Er zeigt
            für jeden vergangenen Tag, wie stark die Attraktion ausgelastet war und ob sie in Betrieb
            war. Ideal, um Muster zu erkennen: Wann hatte diese Attraktion regelmäßig kurze
            Wartezeiten?
          </p>
        </SubSection>

        <TipBox>
          Die besten Besuchstage sind frühe Wochentage außerhalb der Schulferien – Dienstag bis
          Donnerstag haben oft die niedrigsten Crowd-Level. Vermeide Schulferien-Wochen in den
          bevölkerungsreichen Bundesländern, besonders in NRW, Bayern und Baden-Württemberg.
        </TipBox>
      </Section>

      {/* ── 6. KI-Prognosen ──────────────────────────────────────────────── */}
      <Section id="prognosen" title="KI-gestützte Prognosen">
        <p className="text-muted-foreground mb-4">
          park.fan nutzt maschinelles Lernen, um Besucherandrang und Wartezeiten Tage im Voraus
          vorherzusagen. Das Modell berücksichtigt:
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: '📊',
              title: 'Historische Daten',
              desc: 'Millionen Warteschlangen-Datenpunkte aus der Vergangenheit.',
            },
            {
              icon: '📅',
              title: 'Ferienkalender',
              desc: 'Schulferien aller Bundesländer und nationale Feiertage europaweit.',
            },
            {
              icon: '🌤️',
              title: 'Wetterprognosen',
              desc: 'Temperatur, Niederschlag und Sonnenstunden beeinflussen den Andrang erheblich.',
            },
            {
              icon: '🎉',
              title: 'Sonderevents',
              desc: 'Halloween, Weihnachtsmarkt, Saisoneröffnungen und andere Park-Events.',
            },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="bg-muted/30 flex items-start gap-3 rounded-xl border p-4">
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <SubSection title="Prognose-Genauigkeit">
          <p className="text-muted-foreground text-sm">
            Auf der Attraktion-Detailseite wird die Vorhersage-Genauigkeit angezeigt:{' '}
            <strong>Schlecht / Mittel / Gut / Exzellent</strong>. Je mehr historische Daten
            vorhanden, desto präziser die Prognose. Kurzfristige Vorhersagen (1–3 Tage) sind
            grundsätzlich zuverlässiger als langfristige.
          </p>
        </SubSection>

        <SubSection title="Stündliche P90-Sparklines">
          <p className="text-muted-foreground text-sm">
            Auf Attraktionskarten zeigt ein kleiner Liniengraph (Sparkline) den Wartezeit-Verlauf
            der letzten Stunden. So erkennst du sofort Muster: War es morgens ruhig und steigt die
            Wartezeit jetzt rapide an?
          </p>
        </SubSection>
      </Section>

      {/* ── 7. Standort ──────────────────────────────────────────────────── */}
      <Section id="standort" title="Standort & Nearby-Parks">
        <p className="text-muted-foreground mb-4">
          Mit deinem Standort wird park.fan noch smarter: Parks und Attraktionen in deiner Nähe –
          sortiert nach Entfernung.
        </p>

        <SubSection title="Standort aktivieren">
          <p className="text-muted-foreground text-sm">
            Beim ersten Besuch erscheint ein Banner, das dich um Standortzugriff bittet. Die
            Zustimmung ist vollständig freiwillig. park.fan speichert deinen Standort nicht – er
            wird ausschließlich für die Nearby-Funktion genutzt.
          </p>
        </SubSection>

        <SubSection title="In-Park Navigation">
          <p className="text-muted-foreground text-sm">
            Bist du im Park? park.fan erkennt automatisch, in welchem Park du dich befindest, und
            zeigt auf der Startseite "Du bist im [Parkname]". Die Karte des Parks zeigt deinen
            Standort live – perfekt für die Navigation von Attraktion zu Attraktion. Favorisierte
            Attraktionen werden nach Entfernung zu dir sortiert.
          </p>
        </SubSection>

        <SubSection title="Parks in der Nähe">
          <p className="text-muted-foreground text-sm">
            Die Startseite zeigt automatisch Parks in deiner Umgebung mit aktuellem Status,
            Öffnungszeiten und Auslastung. So findest du spontan den nächsten geöffneten Park.
          </p>
        </SubSection>
      </Section>

      {/* ── 8. Personas ──────────────────────────────────────────────────── */}
      <Section id="personas" title="Für wen eignet sich park.fan?">
        <p className="text-muted-foreground mb-6">
          park.fan ist für alle Freizeitpark-Fans gemacht – egal ob du mit der Familie, als
          leidenschaftlicher Enthusiast oder zum ersten Mal einen großen Park besuchst.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Die Familie"
            subtitle="Plant einen unvergesslichen Ausflug für alle"
          >
            <Li>
              Crowd-Kalender: Welcher Tag hat die kürzesten Warteschlangen? Perfekt für die
              Urlaubsplanung Wochen im Voraus.
            </Li>
            <Li>
              Wetter im Kalender: Plant ihr für einen Regentag? Indoor-Attraktionen prüfen und
              Plan B bereithalten.
            </Li>
            <Li>
              Favoriten: Speichere die 10 wichtigsten Attraktionen für Kinder – sieh sofort,
              welche gerade kurze Wartezeiten haben.
            </Li>
            <Li>
              Live-Wartezeiten: Entscheidet spontan, welches Fahrgeschäft als nächstes dran ist –
              ohne Diskussion.
            </Li>
            <Li>
              Stoßzeit-Badge: Wisst ihr, wann es am vollsten wird – und könnt vorher eine Pause mit
              Mittagessen einplanen.
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🎢"
            title="Der Freizeitparknerd"
            subtitle="Jede Minute im Park muss optimal genutzt werden"
          >
            <Li>
              P90-Schwellwerte: Verstehe, ob eine Attraktion wirklich voll ist – oder nur
              "normal".
            </Li>
            <Li>
              Historischer Verlauf: Wann hatte Taron in den letzten Wochen typischerweise kurze
              Wartezeiten?
            </Li>
            <Li>
              Trend-Indikatoren: Steigt die Schlange gerade? Warte noch 20 Minuten – vielleicht
              ist sie dann kürzer.
            </Li>
            <Li>
              Single Rider / Lightning Lane: park.fan zeigt alle verfügbaren Warteschlangen-Typen
              mit aktuellen Zeiten und Preisen.
            </Li>
            <Li>
              Vergleichs-Badge "Viel Höher": Ungewöhnliche Situation – ist es Zeit für Plan B?
            </Li>
          </PersonaCard>

          <PersonaCard
            emoji="🌟"
            title="Der Erstbesucher"
            subtitle="Zum ersten Mal in einem großen Freizeitpark"
          >
            <Li>
              Suche: Finde deinen Park schnell – auch wenn du den genauen Namen nicht weißt.
            </Li>
            <Li>
              Park-Karte: Orientiere dich mit der interaktiven Karte, bevor und während du im Park
              bist.
            </Li>
            <Li>
              Status-Badges: Grün = läuft, Orange = kurze Störung, Grau = heute nicht, Lila =
              längere Wartung. Einfach und klar.
            </Li>
            <Li>
              Crowd-Kalender: Die Farben sagen alles – Grün ist entspannt, Rot ist stressig.
            </Li>
            <Li>
              Öffnungszeiten: Immer aktuell – inklusive Sonderöffnungszeiten an Feiertagen.
            </Li>
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
              Live-Wartezeiten: Sofort sehen, was gerade offen ist und wie lang die Wartezeit ist.
            </Li>
            <Li>
              Trend-Indikatoren: Warteschlange fällt gerade? Perfekter Moment zum Anstellen.
            </Li>
            <Li>
              Favoriten: Wenn du den Park schon kennst, sind deine Top-Attraktionen schon gespeichert.
            </Li>
          </PersonaCard>
        </div>
      </Section>

      {/* ── 9. FAQ ───────────────────────────────────────────────────────── */}
      <Section id="faq" title="Häufige Fragen">
        <div className="space-y-4">
          {[
            {
              q: 'Wie oft werden die Wartezeiten aktualisiert?',
              a: 'Die Wartezeiten werden minütlich aktualisiert. Bei manchen Parks erfolgt die Aktualisierung alle 2–5 Minuten, abhängig von der Datenverfügbarkeit.',
            },
            {
              q: 'Woher kommen die Daten?',
              a: 'park.fan bezieht Live-Daten von ThemeParks.wiki, Queue-Times.com und Wartezeiten.app – verbreitete Quellen für Freizeitpark-Daten.',
            },
            {
              q: 'Ist park.fan kostenlos?',
              a: 'Ja, park.fan ist vollständig kostenlos und erfordert keine Anmeldung.',
            },
            {
              q: 'Werden meine Favoriten auf anderen Geräten gespeichert?',
              a: 'Nein, Favoriten werden lokal im Browser gespeichert (localStorage). Sie sind nur auf dem Gerät verfügbar, auf dem du sie gesetzt hast.',
            },
            {
              q: 'Warum sehe ich keine Wartezeiten für meinen Park?',
              a: 'Nicht alle Parks bieten offizielle Live-Daten. Manche Parks übermitteln keine Echtzeit-Wartezeitdaten – park.fan zeigt dann den Betriebsstatus, aber keine konkreten Minuten.',
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
              a: 'Aktuell deckt park.fan über 150 Parks mit mehr als 5.000 Attraktionen weltweit ab – von Walt Disney World, Disneyland und Universal bis zu Europa-Park, Phantasialand, Efteling und Parks in Asien und Australien.',
            },
            {
              q: 'Gibt es eine App für iOS oder Android?',
              a: 'Derzeit gibt es park.fan als Progressive Web App (PWA). Du kannst park.fan.de auf deinem Smartphone-Browser öffnen und wie eine App nutzen – inkl. Offline-Fähigkeiten.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
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

function ContentEN() {
  return (
    <div className="space-y-16 text-base leading-7">
      <div className="space-y-4">
        <p className="text-muted-foreground text-lg leading-relaxed">
          park.fan is your free companion for theme parks worldwide – with live wait times,
          AI-powered crowd predictions and a day-by-day crowd calendar. This page explains all
          features in detail.
        </p>
        <nav
          aria-label="Table of Contents"
          className="bg-muted/40 rounded-xl border p-5 not-prose"
        >
          <p className="mb-3 font-semibold">Table of Contents</p>
          <ol className="text-muted-foreground grid gap-1.5 text-sm sm:grid-cols-2">
            {[
              ['#suche', '1. Search'],
              ['#favoriten', '2. Favorites'],
              ['#parkseite', '3. The Park Page'],
              ['#badges', '4. Badges & Indicators'],
              ['#kalender', '5. Crowd Calendar'],
              ['#prognosen', '6. AI Predictions'],
              ['#standort', '7. Location & Nearby'],
              ['#personas', '8. Who is it for?'],
              ['#faq', '9. FAQ'],
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

      <Section id="suche" title="Search">
        <p className="text-muted-foreground mb-4">
          The global search is the fastest way to find a park, attraction, show or restaurant.
        </p>
        <SubSection title="Opening search">
          <div className="space-y-2 text-sm">
            <p>
              <strong>Desktop:</strong> Press{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">Ctrl + K</kbd>{' '}
              or{' '}
              <kbd className="bg-muted rounded border px-2 py-0.5 font-mono text-xs">⌘ + K</kbd>{' '}
              (Mac) to open the search at any time.
            </p>
            <p>
              <strong>Mobile & Desktop:</strong> Tap the{' '}
              <Search className="inline h-4 w-4" /> icon in the header or the search field on the
              homepage.
            </p>
          </div>
        </SubSection>
        <SubSection title="What you can search for">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🌴', label: 'Parks', desc: 'Europa-Park, Phantasialand, Disneyland...' },
              {
                icon: '🎢',
                label: 'Attractions',
                desc: 'Taron, Silver Star, Space Mountain...',
              },
              { icon: '🎭', label: 'Shows', desc: 'Show schedules and times' },
              { icon: '🍽️', label: 'Restaurants', desc: 'Dining options inside parks' },
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
        <InfoBox>
          Search starts from 3 characters and uses full-text search with typo tolerance. Search
          for "Phantasia" and you'll find "Phantasialand".
        </InfoBox>
      </Section>

      <Section id="favoriten" title="Favorites">
        <p className="text-muted-foreground mb-4">
          Save parks, attractions, shows and restaurants as favorites for quick access on the
          homepage – no login required.
        </p>
        <SubSection title="Adding a favorite">
          <p className="text-sm">
            Click the <Star className="inline h-4 w-4 text-yellow-500" /> star on any card.
            Favorites are stored locally in your browser and persist until you remove them.
          </p>
        </SubSection>
        <SubSection title="Favorites on the homepage">
          <p className="text-muted-foreground text-sm">
            Once you have at least one favorite, a dedicated section appears on the homepage. With
            location enabled, items are sorted by distance – nearest first.
          </p>
        </SubSection>
        <TipBoxEN>
          Save your 5–10 favorite attractions at your target park. On the day of your visit,
          you'll instantly see which ones have short wait times.
        </TipBoxEN>
      </Section>

      <Section id="parkseite" title="The Park Page">
        <p className="text-muted-foreground mb-4">
          Every park has its own page with live data, opening hours, an interactive calendar and a
          map.
        </p>
        <SubSection title="Tabs – Attractions, Shows, Calendar, Map">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: '🎢',
                label: 'Attractions',
                desc: 'All rides with live wait time, status, trend and comparison to average.',
              },
              {
                icon: '🎭',
                label: 'Shows',
                desc: 'All shows with current status and upcoming showtimes.',
              },
              {
                icon: '📅',
                label: 'Calendar',
                desc: '30+ day outlook with crowd predictions, weather, holidays and school vacations.',
              },
              {
                icon: '🗺️',
                label: 'Map',
                desc: 'Interactive map with all attractions, shows and restaurants.',
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
        </SubSection>
      </Section>

      <Section id="badges" title="Badges & Status Indicators">
        <p className="text-muted-foreground mb-4">
          park.fan uses a consistent color system to make information immediately understandable.
        </p>
        <SubSection title="Park & Attraction Status">
          <div className="space-y-3">
            {[
              {
                icon: Clock,
                color: 'bg-status-operating/65 border-status-operating/80',
                label: 'Operating',
                desc: 'Running – wait times are updated live.',
              },
              {
                icon: AlertTriangle,
                color: 'bg-status-down/65 border-status-down/80',
                label: 'Down',
                desc: 'Temporarily closed – usually brief.',
              },
              {
                icon: XCircle,
                color: 'bg-status-closed/65 border-status-closed/80',
                label: 'Closed',
                desc: 'Not operating today – seasonal or scheduled closure.',
              },
              {
                icon: Wrench,
                color: 'bg-status-refurbishment/65 border-status-refurbishment/80',
                label: 'Refurbishment',
                desc: 'Extended maintenance – closed for days or weeks.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={Icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>
        <SubSection title="Crowd Levels">
          <p className="text-muted-foreground mb-3 text-sm">
            The crowd level shows how busy a park or attraction is relative to the historical{' '}
            <strong>90th percentile (P90)</strong>. "High" means busier than 90% of all recorded
            days.
          </p>
          <div className="space-y-3">
            {[
              {
                color: 'bg-crowd-very-low/65 border-crowd-very-low/80',
                label: 'Very Low',
                icon: User,
                threshold: '< 20% of P90',
                desc: 'Almost no queues. Ideal visit day.',
              },
              {
                color: 'bg-crowd-low/65 border-crowd-low/80',
                label: 'Low',
                icon: User,
                threshold: '20–40% of P90',
                desc: 'Short wait times at most attractions.',
              },
              {
                color: 'bg-crowd-moderate/65 border-crowd-moderate/80',
                label: 'Moderate',
                icon: Users,
                threshold: '40–60% of P90',
                desc: 'Typical day – manageable wait times.',
              },
              {
                color: 'bg-crowd-high/65 border-crowd-high/80',
                label: 'High',
                icon: Users,
                threshold: '60–80% of P90',
                desc: 'Busy – popular rides have 30–60 min waits.',
              },
              {
                color: 'bg-crowd-very-high/65 border-crowd-very-high/80',
                label: 'Very High',
                icon: Users,
                threshold: '80–100% of P90',
                desc: 'Very crowded – plan around peak hours.',
              },
              {
                color: 'bg-crowd-extreme/65 border-crowd-extreme/80',
                label: 'Extreme',
                icon: AlertTriangle,
                threshold: '> 100% of P90',
                desc: 'Record crowds – 90+ min waits. School holidays, special events.',
              },
            ].map(({ color, label, icon, threshold, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="flex min-w-[110px] flex-col gap-1">
                  <DemoBadge color={color} label={label} icon={icon} />
                  <span className="text-muted-foreground pl-1 font-mono text-[10px]">
                    {threshold}
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
          <InfoBox>
            <strong>What is the 90th percentile (P90)?</strong> park.fan compares current occupancy
            with historical data. The P90 is the value exceeded on only 10% of all days – the
            "very busy day" benchmark. If occupancy is at 50% of P90 today, it's half as busy as
            the busiest days.
          </InfoBox>
        </SubSection>
        <SubSection title="Trend Indicators">
          <div className="space-y-2">
            {[
              {
                icon: TrendingUp,
                color: 'text-trend-up',
                label: 'Rising',
                desc: 'Queue is getting longer.',
              },
              { icon: Minus, color: 'text-trend-stable', label: 'Stable', desc: 'Wait time is constant.' },
              {
                icon: TrendingDown,
                color: 'text-trend-down',
                label: 'Falling',
                desc: 'Queue is getting shorter – good moment to join.',
              },
            ].map(({ icon: Icon, color, label, desc }) => (
              <div key={label} className="flex items-center gap-3">
                <span className={`flex w-24 items-center gap-1 text-sm font-semibold ${color}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>
        <SubSection title="Queue Types">
          <div className="space-y-3">
            {[
              {
                color: 'bg-primary/65 border-primary/80',
                icon: User,
                label: 'Single Rider',
                desc: "Often shorter than the regular queue, but you can't ride with your group.",
              },
              {
                color: 'bg-status-down/65 border-status-down/80',
                icon: Zap,
                label: 'Lightning Lane',
                desc: 'Paid express pass (e.g. Disney). Shows current price and return time.',
              },
              {
                color: 'bg-primary/65 border-primary/80',
                icon: Ticket,
                label: 'Return Time',
                desc: 'Free virtual queue – reserve a slot and return later.',
              },
              {
                color: 'bg-primary/65 border-primary/80',
                icon: Ticket,
                label: 'Boarding Group',
                desc: 'Virtual queue with group number – popular for high-demand new rides.',
              },
            ].map(({ color, icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <DemoBadge color={color} label={label} icon={icon} />
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      <Section id="kalender" title="The Crowd Calendar">
        <p className="text-muted-foreground mb-4">
          The crowd calendar is the most powerful planning tool on park.fan, showing crowd level,
          opening hours, weather and special events for the next 30+ days.
        </p>
        <SubSection title="Calendar Card Icons">
          <div className="space-y-3 text-sm">
            {[
              {
                icon: PartyPopper,
                color: 'text-orange-500',
                label: 'Public Holiday',
                desc: 'Parks often open longer but also busier.',
              },
              {
                icon: Backpack,
                color: 'text-yellow-500',
                label: 'School Holidays',
                desc: 'Typically the busiest days of the year.',
              },
              {
                icon: Calendar,
                color: 'text-blue-500',
                label: 'Bridge Day',
                desc: 'Usually busier as many people extend long weekends.',
              },
              { icon: XCircle, color: 'text-red-500', label: 'Park Closed', desc: 'No operation.' },
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
        <TipBoxEN>
          Best visit days are typically early weekdays outside of school holidays – Tuesday through
          Thursday show the lowest crowd levels. Avoid school holiday periods, especially in
          densely populated regions.
        </TipBoxEN>
      </Section>

      <Section id="prognosen" title="AI-Powered Predictions">
        <p className="text-muted-foreground mb-4">
          park.fan uses machine learning to predict crowd levels and wait times days ahead,
          considering historical data, school calendars, weather forecasts and special events.
        </p>
        <InfoBox>
          Prediction accuracy is shown on each attraction's detail page (Poor / Fair / Good /
          Excellent). Short-term forecasts (1–3 days) are more reliable than long-term ones.
        </InfoBox>
      </Section>

      <Section id="standort" title="Location & Nearby Parks">
        <p className="text-muted-foreground mb-4">
          With location enabled, park.fan shows nearby parks and attractions sorted by distance.
          Your location is never stored.
        </p>
        <SubSection title="In-Park Navigation">
          <p className="text-muted-foreground text-sm">
            When you're in a park, park.fan automatically detects which park you're in and shows
            "You're in [Park Name]". The park map displays your live position – perfect for
            navigating between rides.
          </p>
        </SubSection>
      </Section>

      <Section id="personas" title="Who is park.fan for?">
        <div className="grid gap-4 md:grid-cols-2">
          <PersonaCard
            emoji="👨‍👩‍👧‍👦"
            title="Families"
            subtitle="Planning a perfect day out for everyone"
          >
            <Li>Crowd calendar: which day has the shortest queues?</Li>
            <Li>Weather: planning for rain? Check indoor rides.</Li>
            <Li>Favorites: save the 10 must-do rides for kids.</Li>
            <Li>Live wait times: decide on the fly which ride to do next.</Li>
            <Li>Peak hour badge: know when it gets busiest and plan a lunch break.</Li>
          </PersonaCard>
          <PersonaCard
            emoji="🎢"
            title="Theme Park Enthusiasts"
            subtitle="Every minute must be optimised"
          >
            <Li>P90 thresholds: is an attraction really busy or just "normal"?</Li>
            <Li>Historical trends: when does Taron typically have short waits?</Li>
            <Li>Trend indicators: queue rising? Wait 20 minutes.</Li>
            <Li>Single Rider / Lightning Lane: all queue types with times and prices.</Li>
          </PersonaCard>
          <PersonaCard
            emoji="🌟"
            title="First-Time Visitors"
            subtitle="First time at a major theme park"
          >
            <Li>Search: find your park quickly.</Li>
            <Li>Park map: get oriented before and during your visit.</Li>
            <Li>Status badges: green = running, orange = brief issue, grey = closed today.</Li>
            <Li>Crowd calendar: green is relaxed, red is stressful.</Li>
          </PersonaCard>
          <PersonaCard
            emoji="⚡"
            title="Spontaneous Visitors"
            subtitle="Last-minute, maximum efficiency"
          >
            <Li>Location: park.fan automatically finds your nearest park.</Li>
            <Li>Live wait times: instantly see what's open and how long the wait is.</Li>
            <Li>Trend indicators: queue falling? Perfect moment to join.</Li>
          </PersonaCard>
        </div>
      </Section>

      <Section id="faq" title="Frequently Asked Questions">
        <div className="space-y-4">
          {[
            {
              q: 'How often are wait times updated?',
              a: 'Wait times are updated every minute. For some parks, updates occur every 2–5 minutes depending on data availability.',
            },
            {
              q: 'Where does the data come from?',
              a: 'park.fan sources live data from ThemeParks.wiki, Queue-Times.com and Wartezeiten.app.',
            },
            {
              q: 'Is park.fan free?',
              a: 'Yes, park.fan is completely free and requires no registration.',
            },
            {
              q: 'Are favorites synced across devices?',
              a: "No, favorites are stored locally in your browser. They're only available on the device where you saved them.",
            },
            {
              q: 'How far ahead does the crowd calendar forecast?',
              a: 'The calendar shows forecasts for 30+ days. Near-term predictions (1–3 days) are more accurate.',
            },
            {
              q: 'How many parks are covered?',
              a: 'park.fan covers 150+ parks with 5,000+ attractions worldwide – from Walt Disney World and Universal to Europa-Park, Phantasialand and parks across Asia and Australia.',
            },
          ].map(({ q, a }) => (
            <details key={q} className="group bg-muted/30 rounded-xl border">
              <summary className="cursor-pointer list-none p-4 font-semibold group-open:pb-2">
                <span className="flex items-start gap-2">
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-open:rotate-90" />
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HowtoPage({ params }: HowtoPageProps) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as Locale)) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <LocaleContent
          locale={locale as 'de' | 'en'}
          de={
            <>
              <h1 className="mb-2 text-4xl font-bold">Wie funktioniert park.fan?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                Die vollständige Anleitung für Freizeitpark-Besucher – von der Suche über den
                Crowd-Kalender bis zu allen Badges und KI-Prognosen erklärt.
              </p>
              <ContentDE />
            </>
          }
          en={
            <>
              <h1 className="mb-2 text-4xl font-bold">How does park.fan work?</h1>
              <p className="text-muted-foreground mb-10 text-lg">
                The complete guide for theme park visitors – from search and favorites to the crowd
                calendar, AI predictions and all badges explained.
              </p>
              <ContentEN />
            </>
          }
        />
      </div>
    </div>
  );
}
