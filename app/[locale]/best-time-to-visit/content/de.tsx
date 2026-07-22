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
  weekdaysTitle: 'Die ruhigsten Wochentage',
  weekdaysBody:
    'Über alle Parks gemittelt — jeder Park auf seinen eigenen Schnitt normiert, damit große Parks kleine nicht überstrahlen. So voll ist ein typischer Wochentag im Vergleich zum Durchschnitt. Dienstag bis Donnerstag gewinnen fast immer.',
  monthsTitle: 'Die ruhigsten Monate',
  monthsBody:
    'Dieselbe Rechnung übers Jahr: Die Nebensaison ist spürbar leerer als die Sommer- und Ferienspitzen.',
  quieter: 'ruhiger',
  busier: 'voller',
  typical: 'wie der Schnitt',
  footnote: 'Basis: {days} Park-Tage aus {parks} Parks, letzte {months} Monate.',
};

const FAQ = [
  {
    question: 'Wann ist die beste Reisezeit für einen Freizeitpark?',
    answer:
      'Am ruhigsten ist es an Wochentagen außerhalb der Schulferien — Dienstag bis Donnerstag in der Nebensaison sind fast immer die entspanntesten Tage. Die genauen Muster pro Wochentag und Monat siehst du oben, live aus echten Wartezeit-Daten über alle Parks.',
  },
  {
    question: 'Welcher Wochentag ist am leersten?',
    answer:
      'Über alle Parks gemittelt sind Dienstag, Mittwoch und Donnerstag am ruhigsten, während Samstag und Sonntag klar am vollsten sind. Einzelne Parks können abweichen — der Crowd-Kalender jeder Parkseite zeigt es tagesgenau.',
  },
  {
    question: 'In welchen Monaten sind Freizeitparks am leersten?',
    answer:
      'Die Nebensaison-Monate abseits von Sommer- und Feiertagsspitzen sind am leersten. Die Monatsübersicht oben zeigt die relative Auslastung übers Jahr, gemittelt über alle Parks.',
  },
  {
    question: 'Lohnt sich ein Besuch bei Regen?',
    answer:
      'Oft ja: schlechtes Wetter schreckt viele Gäste ab, die Schlangen werden kürzer — besonders für Achterbahnen, die trotzdem fahren. Der Geheimtipp funktioniert aber nur, solange nicht alle dieselbe Idee haben; unser Prognosemodell rechnet die Wetterlage deshalb direkt mit ein.',
  },
  {
    question: 'Wie finde ich den besten Tag für einen bestimmten Park?',
    answer:
      'Diese Seite zeigt die globalen Muster als Startpunkt. Für einen konkreten Park öffnest du dessen Crowd-Kalender: Er zeigt für jeden einzelnen Tag bis zu ein Jahr im Voraus eine grüne, gelbe oder rote Prognose — inklusive Schulferien und Feiertagen der Region.',
  },
  {
    question: 'Woher stammen diese Daten?',
    answer:
      'Aus den tatsächlich gemessenen Wartezeiten von über 150 Parks der letzten zwei Jahre. Jeder Park wird auf seinen eigenen Durchschnitt normiert und dann über alle Parks gemittelt, damit die Rangfolge fair ist und nicht von den größten Parks bestimmt wird.',
  },
] as const;

export function ContentDE() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Die beste Reisezeit für einen Freizeitpark ist kein Geheimnis — sie ist ein Muster. Wann
          ein Park voll wird, folgt dem Wochentag, dem Ferienkalender, dem Wetter und der Saison; alle
          vier hinterlassen Spuren in den Wartezeiten.
        </Lead>
        <P>
          Diese Spuren haben wir über 150+ Parks der letzten zwei Jahre gemessen. Weiter unten: die
          ruhigsten Wochentage und Monate, die entspanntesten Stunden des Tages, die Termine zum
          Meiden — und der Crowd-Kalender, der daraus den einen besten Tag für deinen Park macht.
        </P>
        <Highlight>
          Kurzfassung: Dienstag bis Donnerstag außerhalb der Schulferien, zur Öffnung da sein und
          einen durchwachsenen Wetterbericht für dich arbeiten lassen. Alles darunter ist das
          Kleingedruckte.
        </Highlight>
      </div>

      {/* 01 — Data: quietest weekdays + months (live) */}
      <SectionShell
        id="patterns"
        index="01"
        kicker="Die Daten"
        title="Die ruhigsten Wochentage und Monate"
        icon={CalendarRange}
      >
        <PG>
          Andrang ist kein Zufall: Wann es voll wird, folgt klaren Mustern aus Wochentag, Ferien,
          Wetter und Saison. Hier die zwei größten davon — über alle Parks gemittelt, aus echten
          Wartezeit-Daten:
        </PG>
        <BestTimesData locale="de" labels={DATA_LABELS} />
      </SectionShell>

      {/* 02 — Times of day */}
      <SectionShell
        id="times"
        index="02"
        kicker="Nach Uhrzeit"
        title="Die ruhigsten Tageszeiten"
        icon={Clock}
      >
        <P>
          Nicht nur der Tag zählt, sondern auch die Uhrzeit. Drei Fenster sind fast überall am
          ruhigsten:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: 'Zur Öffnung (Rope Drop)',
              body: 'Die erste Stunde ist golden: Wer zum Einlass da ist, fährt die Headliner oft mit einem Bruchteil der späteren Wartezeit.',
            },
            {
              icon: Users,
              title: 'Während der Mittagszeit',
              body: 'Wenn die Massen essen, leeren sich die Schlangen — ein guter Moment für die beliebten Attraktionen (und später essen).',
            },
            {
              icon: Sun,
              title: 'Die letzten 90 Minuten',
              body: 'Viele Tagesgäste gehen früh. Kurz vor Schließung sinken die Wartezeiten oft noch einmal deutlich.',
            },
            {
              icon: Ticket,
              title: 'Während der großen Abendshow',
              body: 'Parade oder Feuerwerk binden tausende Gäste auf einmal — die Wartezeiten der Achterbahnen knicken messbar ein.',
            },
          ]}
        />
        <SplitFigure
          src="/images/parks/phantasialand/black-mamba.jpg"
          alt="Black Mamba rast durch den Dschungel im Phantasialand"
          kicker="Rope Drop"
          title="Die erste Stunde ist golden"
        >
          Wer zum Einlass da ist, fährt die Headliner oft mit einem Bruchteil der späteren
          Wartezeit. Die erste Stunde ersetzt regelmäßig zwei am Nachmittag — kein Fast-Pass nötig,
          nur ein früher Wecker.
        </SplitFigure>
      </SectionShell>

      {/* 03 — Dates to avoid */}
      <SectionShell
        id="avoid"
        index="03"
        kicker="Rote Tage"
        title="Termine, die du meiden solltest"
        icon={Ban}
      >
        <PG>
          Genauso wichtig wie die ruhigen Tage sind die vollen. An diesen Terminen ist mit Andrang zu
          rechnen — plane sie ein oder gleich um sie herum:
        </PG>
        <SplitFigure
          src="/images/parks/walibi-holland/goliath.jpg"
          alt="Achterbahn Goliath im Walibi Holland an einem vollen Tag"
          kicker="Spitzentag"
          title="Schön, frei, alle da"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Die klassische Spitzenkombination — ein Ferien-Samstag im Hochsommer — trägt fast alle
          Andrangfaktoren auf einmal. Wenn möglich, lieber der Dienstag drauf: gleicher Park, halbe
          Schlange.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Wochenenden & Feiertage',
              body: 'Samstag und Sonntag sind über alle Parks am vollsten; Feiertage und lange Wochenenden setzen noch eins drauf.',
            },
            {
              icon: CalendarRange,
              title: 'Schulferien',
              body: 'In den Ferien der eigenen und der Nachbarregionen steigt der Andrang deutlich — besonders die Sommerferien.',
            },
            {
              icon: Sun,
              title: 'Brückentage & Ferien-Samstage im Hochsommer',
              body: 'Die klassische Spitzenkombination: schön, frei, alle da. Wenn möglich lieber der Dienstag drauf.',
            },
            {
              icon: Sparkles,
              title: 'Neuheiten im ersten Sommer',
              body: 'Eine neue Achterbahn zieht in ihrer ersten Saison Massen — rechne bei Premieren mit langen Schlangen.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Clever spielen"
        title="Tricks für kurze Schlangen"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Wochentag statt Wochenende',
              body: 'Der größte Hebel überhaupt: ein Dienstag statt eines Samstags kann die Wartezeiten halbieren.',
            },
            {
              icon: CloudRain,
              title: 'Wetter clever nutzen',
              body: 'Ein durchwachsener Tag schreckt viele ab. Wer wetterfest ist, fährt kürzer an — Regenjacke schlägt Regenschirm.',
            },
            {
              icon: Sunrise,
              title: 'Früh da sein',
              body: 'Rope Drop schlägt fast jede andere Taktik. Die erste Stunde ersetzt oft zwei am Nachmittag.',
            },
            {
              icon: Ticket,
              title: 'Single-Rider & virtuelle Warteschlangen',
              body: 'Allein fahren oder digital anstehen, während du isst oder shoppst — geschenkte Zeit an vollen Tagen.',
            },
          ]}
        />
        <P>
          Wie das im Park zusammenspielt, erklärt die{' '}
          <Link href="/howto">vollständige Anleitung</Link> Schritt für Schritt.
        </P>
      </SectionShell>

      {/* 05 — Crowd calendar for your park */}
      <SectionShell
        id="parks"
        index="05"
        kicker="Für deinen Park"
        title="Der Crowd-Kalender"
        icon={Ticket}
      >
        <P>
          Die Muster oben sind der Startpunkt. Den exakt besten Tag verrät dir der Crowd-Kalender
          jeder Parkseite — grün, gelb, rot, bis zu ein Jahr im Voraus, mit den Ferien und Feiertagen
          der jeweiligen Region.
        </P>
        <SplitFigure
          src="/images/parks/efteling/symbolica.jpg"
          alt="Die Palastfahrt Symbolica in der Efteling"
          kicker="Grün, gelb, rot"
          title="Eine Farbe pro Tag, ein Jahr im Voraus"
          badge={<CrowdLevelBadge level="low" />}
        >
          Jede Parkseite trägt eine tagesgenaue Prognose, die Schulferien und Feiertage genau dieser
          Region einrechnet. Wähl einen grünen Tag und du hast neunzig Prozent der Planung erledigt,
          bevor du überhaupt gebucht hast.
        </SplitFigure>
        <P>Ein paar beliebte Parks zum direkten Einstieg:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Angetrieben von Fancast"
        body="Unser Prognosemodell — es sagt Andrang bis zu 365 Tage im Voraus vorher und benotet sich selbst."
      />

      {/* 06 — FAQ */}
      <SectionShell
        id="faq"
        index="06"
        kicker="Kurz erklärt"
        title="Häufige Fragen zur besten Reisezeit"
        icon={HelpCircle}
      >
        <FaqList items={FAQ} />
      </SectionShell>
    </>
  );
}
