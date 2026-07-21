import React from 'react';
import { Link } from '@/i18n/navigation';
import { PopularParksGrid } from '@/components/home/featured-parks-slot';
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
import { Section, P, PG, TipList, FancastCta, FaqList } from '../_best-time-ui';
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
    <div className="space-y-14 text-base leading-7">
      {/* Data: quietest weekdays + months (live) */}
      <div className="space-y-4">
        <PG>
          Freizeitparks sind kein Zufall: Wann es voll wird, folgt klaren Mustern aus Wochentag,
          Ferien, Wetter und Saison. Hier siehst du die wichtigsten davon — über alle Parks gemittelt,
          aus echten Wartezeit-Daten:
        </PG>
        <BestTimesData locale="de" labels={DATA_LABELS} />
      </div>

      {/* Times of day */}
      <Section id="tageszeit" title="Die ruhigsten Tageszeiten" icon={Clock}>
        <P>
          Nicht nur der Tag zählt, sondern auch die Uhrzeit. Drei Fenster sind fast überall am
          ruhigsten:
        </P>
        <TipList
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
      </Section>

      {/* Dates to avoid */}
      <Section id="meiden" title="Termine, die du meiden solltest" icon={Ban}>
        <PG>
          Genauso wichtig wie die ruhigen Tage sind die vollen. An diesen Terminen ist mit Andrang zu
          rechnen — plane sie ein oder gleich um sie herum:
        </PG>
        <TipList
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
      </Section>

      {/* Tactics */}
      <Section id="tricks" title="Tricks für kurze Schlangen" icon={Sparkles}>
        <TipList
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
      </Section>

      {/* Grab a park */}
      <Section id="parks" title="Für deinen Park: der Crowd-Kalender" icon={Ticket}>
        <P>
          Die Muster oben sind der Startpunkt. Den exakt besten Tag verrät dir der Crowd-Kalender
          jeder Parkseite — grün, gelb, rot, bis zu ein Jahr im Voraus, mit den Ferien und Feiertagen
          der jeweiligen Region. Ein paar beliebte Parks zum direkten Einstieg:
        </P>
        <PopularParksGrid />
      </Section>

      {/* Powered by Fancast */}
      <FancastCta
        title="Angetrieben von Fancast"
        body="Unser Prognosemodell — es sagt Andrang bis zu 365 Tage im Voraus vorher und benotet sich selbst."
      />

      {/* FAQ */}
      <Section id="faq" title="Häufige Fragen zur besten Reisezeit" icon={HelpCircle}>
        <FaqList items={FAQ} />
      </Section>
    </div>
  );
}
