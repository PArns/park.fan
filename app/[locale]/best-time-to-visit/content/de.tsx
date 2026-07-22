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
    'Jeder Park zählt hier gleich viel, egal ob Disneyland oder kleiner Familienpark: Wir rechnen ihn zuerst auf seinen eigenen Schnitt um und mitteln dann. Der Balken zeigt, wie voll ein typischer Wochentag im Vergleich zum Durchschnitt ist. Dienstag bis Donnerstag liegen fast immer vorn.',
  monthsTitle: 'Die ruhigsten Monate',
  monthsBody:
    'Dieselbe Rechnung, diesmal übers Jahr verteilt. Die Nebensaison ist spürbar leerer als die Sommer- und Ferienwochen.',
  quieter: 'ruhiger',
  busier: 'voller',
  typical: 'wie der Schnitt',
  footnote: 'Basis: {days} Park-Tage aus {parks} Parks, letzte {months} Monate.',
  pending:
    'Die Live-Auswertung sammelt gerade Wartezeiten. Die ruhigsten Tage erscheinen hier, sobald genug Daten zusammengekommen sind.',
};

const FAQ = [
  {
    question: 'Wann ist die beste Reisezeit für einen Freizeitpark?',
    answer:
      'Am entspanntesten sind Wochentage außerhalb der Ferien, allen voran Dienstag bis Donnerstag in der Nebensaison. Die genauen Muster pro Wochentag und Monat siehst du oben, direkt aus den echten Wartezeiten über alle Parks.',
  },
  {
    question: 'Welcher Wochentag ist am leersten?',
    answer:
      'Im Schnitt über alle Parks sind Dienstag, Mittwoch und Donnerstag am ruhigsten, Samstag und Sonntag mit Abstand am vollsten. Bei einzelnen Parks kann es anders aussehen; das zeigt dir der Crowd-Kalender auf der jeweiligen Parkseite tagesgenau.',
  },
  {
    question: 'In welchen Monaten sind Freizeitparks am leersten?',
    answer:
      'Am leersten ist es in der Nebensaison, also abseits der Sommerferien und der großen Feiertage. Die Monatsübersicht oben zeigt dir die Auslastung übers ganze Jahr, gemittelt über alle Parks.',
  },
  {
    question: 'Lohnt sich ein Besuch bei Regen?',
    answer:
      'Oft ja. Schlechtes Wetter hält viele ab, und die Schlangen werden kürzer, gerade an Achterbahnen, die bei Regen weiterfahren. Der Geheimtipp funktioniert nur, solange nicht alle gleichzeitig darauf kommen. Deshalb rechnet unser Prognosemodell das Wetter gleich mit ein.',
  },
  {
    question: 'Wie finde ich den besten Tag für einen bestimmten Park?',
    answer:
      'Diese Seite gibt dir die groben Muster. Für einen konkreten Park öffnest du seinen Crowd-Kalender: Der zeigt für jeden einzelnen Tag bis zu ein Jahr im Voraus grün, gelb oder rot, inklusive der Ferien und Feiertage der Region.',
  },
  {
    question: 'Woher stammen diese Daten?',
    answer:
      'Aus den tatsächlich gemessenen Wartezeiten von über 150 Parks aus den letzten zwei Jahren. Damit die Rangfolge fair bleibt und nicht einfach von den größten Parks bestimmt wird, rechnen wir jeden Park zuerst auf seinen eigenen Schnitt um und mitteln erst dann.',
  },
] as const;

export function ContentDE() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Wann ein Freizeitpark voll wird, ist erstaunlich vorhersehbar. Wochentag, Ferien, Wetter
          und Jahreszeit entscheiden zum großen Teil, ob du an der Achterbahn zehn Minuten wartest
          oder anderthalb Stunden. Und weil jeder Besuch Wartezeiten hinterlässt, lässt sich das
          ziemlich genau nachrechnen.
        </Lead>
        <P>
          Genau das haben wir gemacht: zwei Jahre Wartezeiten aus über 150 Parks ausgewertet. Auf
          dieser Seite findest du die ruhigsten Wochentage und Monate, die besten Uhrzeiten, die
          Tage, an denen du besser zu Hause bleibst, und zum Schluss den Crowd-Kalender, der dir für
          deinen Wunschpark den passenden Tag raussucht.
        </P>
        <Highlight>
          Keine Lust auf den ganzen Text? Geh unter der Woche, am besten Dienstag bis Donnerstag und
          außerhalb der Ferien, sei pünktlich zur Öffnung da und freu dich, wenn das Wetter mal
          mittelmäßig ist. Der Rest sind nur Details.
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
          Fangen wir mit den beiden größten Hebeln an: dem Wochentag und dem Monat. Beides haben wir
          über alle Parks gemittelt, jeweils aus den tatsächlich gemessenen Wartezeiten. So sieht
          das aus:
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
          Der Tag ist die halbe Miete, die Uhrzeit die andere. Drei Zeitfenster sind fast überall am
          entspanntesten:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: 'Zur Öffnung (Rope Drop)',
              body: 'Die erste Stunde nach dem Einlass ist Gold wert. Wer pünktlich am Tor steht, fährt die großen Bahnen oft, bevor sich überhaupt Schlangen bilden.',
            },
            {
              icon: Users,
              title: 'Rund um die Mittagszeit',
              body: 'Wenn alle beim Essen sitzen, werden die Schlangen kürzer. Nimm die Zeit für die beliebten Bahnen und iss einfach später.',
            },
            {
              icon: Sun,
              title: 'Die letzten 90 Minuten',
              body: 'Viele Familien gehen vor dem Ende nach Hause. In der letzten Stunde vor Schließung werden die Wartezeiten oft noch mal spürbar kürzer.',
            },
            {
              icon: Ticket,
              title: 'Während der großen Abendshow',
              body: 'Parade oder Feuerwerk ziehen Tausende gleichzeitig an. Genau dann sind an den Achterbahnen plötzlich Plätze frei.',
            },
          ]}
        />
        <SplitFigure
          src="/images/parks/phantasialand/black-mamba.jpg"
          alt="Black Mamba rast durch den Dschungel im Phantasialand"
          kicker="Zur Öffnung"
          title="Früh da sein schlägt fast jeden Trick"
        >
          Klingt unbequem, lohnt sich aber wie kaum etwas anderes. Die erste Stunde nach dem Einlass
          bringt dir oft mehr Fahrten als zwei am Nachmittag. Du brauchst dafür keinen teuren
          Express-Pass, nur einen etwas früheren Wecker.
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
          Genauso hilfreich ist es zu wissen, wann es richtig voll wird. An diesen Tagen sind die
          Parks erfahrungsgemäß rappelvoll. Entweder du stellst dich darauf ein oder du planst
          gleich drumherum:
        </PG>
        <SplitFigure
          src="/images/parks/walibi-holland/goliath.jpg"
          alt="Achterbahn Goliath im Walibi Holland an einem vollen Tag"
          kicker="Spitzentag"
          title="Schön, frei, alle da"
          reverse
          badge={<CrowdLevelBadge level="very_high" />}
        >
          Ein Samstag in den Sommerferien bei bestem Wetter ist der Worst Case: alle haben frei,
          alle wollen raus, alle sind da. Wenn du flexibel bist, nimm lieber den Dienstag danach.
          Derselbe Park fühlt sich dann komplett anders an.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Wochenenden & Feiertage',
              body: 'Samstag und Sonntag sind über alle Parks hinweg am vollsten. Feiertage und lange Wochenenden legen noch mal einen drauf.',
            },
            {
              icon: CalendarRange,
              title: 'Schulferien',
              body: 'Sobald bei dir oder im Nachbarbundesland Ferien sind, wird es voller. Die Sommerferien sind die absolute Hochsaison.',
            },
            {
              icon: Sun,
              title: 'Brückentage & Ferien-Samstage im Hochsommer',
              body: 'Die gefährlichste Mischung: Sonne, freier Tag, Hochsaison. Falls es sich einrichten lässt, weich auf den Dienstag danach aus.',
            },
            {
              icon: Sparkles,
              title: 'Neuheiten im ersten Sommer',
              body: 'Eine brandneue Achterbahn zieht in ihrer ersten Saison alle an. Bei Premieren solltest du mit langen Wartezeiten rechnen.',
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
              body: 'Der mit Abstand größte Hebel. Ein Dienstag statt eines Samstags kann die Wartezeiten glatt halbieren.',
            },
            {
              icon: CloudRain,
              title: 'Wetter clever nutzen',
              body: 'Eine durchwachsene Vorhersage hält viele zu Hause. Wenn dir etwas Nieselregen nichts ausmacht, stehst du deutlich kürzer an. Regenjacke schlägt Regenschirm.',
            },
            {
              icon: Sunrise,
              title: 'Früh da sein',
              body: 'Pünktlich zur Öffnung da zu sein schlägt fast jeden anderen Trick. Die erste Stunde bringt oft mehr als zwei am Nachmittag.',
            },
            {
              icon: Ticket,
              title: 'Single-Rider & virtuelle Warteschlangen',
              body: 'Fahr als Einzelfahrer auf freie Plätze oder stell dich per App digital an, während du isst oder bummelst. An vollen Tagen ist das geschenkte Zeit.',
            },
          ]}
        />
        <P>
          Wie all das im Park zusammenspielt, gehen wir in der{' '}
          <Link href="/howto">ausführlichen Anleitung</Link> Schritt für Schritt durch.
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
          Die Muster von oben sind der Anfang. Den wirklich besten Tag findest du im Crowd-Kalender
          auf jeder Parkseite. Der zeigt dir für jeden einzelnen Tag grün, gelb oder rot, bis zu ein
          Jahr im Voraus und passend zu den Ferien und Feiertagen der jeweiligen Region.
        </P>
        <SplitFigure
          src="/images/parks/efteling/symbolica.jpg"
          alt="Die Palastfahrt Symbolica in der Efteling"
          kicker="Grün, gelb, rot"
          title="Eine Farbe pro Tag, ein Jahr im Voraus"
          badge={<CrowdLevelBadge level="low" />}
        >
          Jede Parkseite hat eine tagesgenaue Prognose, die die Ferien und Feiertage genau der
          richtigen Region berücksichtigt. Such dir einen grünen Tag aus, und der wichtigste Teil
          der Planung ist erledigt, bevor du überhaupt ein Ticket kaufst.
        </SplitFigure>
        <P>Ein paar beliebte Parks zum direkten Ausprobieren:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Angetrieben von Fancast"
        body="Unser eigenes Prognosemodell schätzt den Andrang bis zu 365 Tage im Voraus und benotet sich dabei selbst."
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
