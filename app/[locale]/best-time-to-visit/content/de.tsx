import React from 'react';
import { Link } from '@/i18n/navigation';
import { HOWTO_SEGMENTS } from '@/lib/howto/segments';
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
import { GlossaryTermLink } from '@/components/glossary/glossary-term-link';
import { FancastCta } from '../_best-time-ui';
import { BestTimesData, type BestTimesLabels } from '../_best-times-data';
import { QuietestDaysByPark } from '../_quietest-days-by-park';

const DATA_LABELS: BestTimesLabels = {
  weekdaysTitle: 'Die ruhigsten Wochentage',
  weekdaysBody:
    'Jeder Park zählt hier gleich viel, egal ob Disneyland oder kleiner Familienpark: Wir rechnen ihn zuerst auf seinen eigenen Schnitt um und mitteln dann. Je länger der Balken, desto voller ist ein typischer Wochentag im Vergleich zum Durchschnitt. Der Samstag sticht heraus, die übrigen sechs Tage liegen enger beieinander, als die meisten erwarten.',
  monthsTitle: 'Die ruhigsten Monate',
  monthsBody:
    'Dieselbe Rechnung, diesmal übers Jahr verteilt. Der Dezember fällt dabei aus dem Rahmen, weil nur die Parks darin stecken, die im Winter überhaupt öffnen, und die fahren dann Weihnachtsprogramm.',
  quieter: 'ruhiger',
  busier: 'voller',
  typical: 'wie der Schnitt',
  footnote: 'Basis: {days} gemessene Park-Tage aus {parks} Parks.',
  pending:
    'Die Live-Auswertung sammelt gerade Wartezeiten. Die ruhigsten Tage erscheinen hier, sobald genug Daten zusammengekommen sind.',
};

const FAQ = [
  {
    question: 'Wann ist die beste Reisezeit für einen Freizeitpark?',
    answer:
      'Am entspanntesten sind Wochentage außerhalb der Ferien, allen voran Dienstag bis Donnerstag. Die genauen Muster pro Wochentag und Monat siehst du oben, direkt aus den gemessenen Wartezeiten über alle Parks.',
  },
  {
    question: 'Welcher Wochentag ist am leersten?',
    answer:
      'Im Schnitt über alle Parks sind Dienstag, Mittwoch und Donnerstag am ruhigsten. Herausragend voll ist nur der Samstag, der Sonntag liegt näher am Dienstag als am Samstag. Bei einzelnen Parks kann es anders aussehen. Tag für Tag steht das im Crowd-Kalender auf der jeweiligen Parkseite.',
  },
  {
    question: 'In welchen Monaten sind Freizeitparks am leersten?',
    answer:
      'Das hängt stärker vom Park ab, als die Faustregel vermuten lässt: Über alle Parks gerechnet sind die Sommermonate nicht die vollsten, und der Dezember sticht nach oben heraus, weil im Winter nur die Parks mit Weihnachtsprogramm geöffnet haben. Monat für Monat steht es in der Übersicht oben. Für einen konkreten Park zählt sein eigener Kalender.',
  },
  {
    question: 'Lohnt sich ein Besuch bei Regen?',
    answer:
      'Oft ja. Schlechtes Wetter hält viele ab, und die Warteschlangen werden kürzer, gerade an Achterbahnen, die bei Regen weiterfahren. Das funktioniert nur, solange nicht alle gleichzeitig darauf kommen. Deshalb rechnet unser Prognosemodell das Wetter gleich mit ein.',
  },
  {
    question: 'Wie finde ich den besten Tag für einen bestimmten Park?',
    answer:
      'Diese Seite gibt dir die groben Muster. Für einen konkreten Park öffnest du seinen Crowd-Kalender. Dort ist jeder veröffentlichte Tag grün, gelb oder rot, mit den Ferien und Feiertagen der Region eingerechnet.',
  },
  {
    question: 'Woher stammen diese Daten?',
    answer:
      'Aus den Wartezeiten, die wir an über 200 Parks selbst mitgeschrieben haben. Damit die Rangfolge nicht von den größten Parks bestimmt wird, rechnen wir jeden Park zuerst auf seinen eigenen Schnitt um und mitteln erst dann.',
  },
] as const;

export function ContentDE() {
  return (
    <>
      {/* Intro */}
      <div className="container mx-auto space-y-5 px-4">
        <Lead>
          Wann ein Freizeitpark voll wird, ist erstaunlich vorhersehbar, jedenfalls vorhersehbarer
          als die Laune eines Sechsjährigen um drei Uhr nachmittags. Wochentag, Ferien, Wetter und
          Jahreszeit entscheiden zum großen Teil, ob du an der Achterbahn zehn Minuten wartest oder
          anderthalb Stunden. Und weil jeder Parktag Wartezeiten hinterlässt, lässt sich das
          ziemlich genau nachrechnen.
        </Lead>
        <P>
          Also haben wir nachgerechnet, mit den mitgeschriebenen Wartezeiten aus über 200 Parks.
          Weiter unten stehen die ruhigsten Wochentage und Monate, die besten Uhrzeiten und die
          Termine, die du besser meidest. Den passenden Tag für deinen Wunschpark findest du danach
          im Crowd-Kalender.
        </P>
        <Highlight>
          Am kürzesten stehst du dienstags bis donnerstags außerhalb der Ferien an, wenn du
          pünktlich zur Öffnung am Tor bist. Eine durchwachsene Wettervorhersage ist dabei ein
          Geschenk, solange eine Regenjacke im Rucksack ist.
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
          Am meisten bewegen Wochentag und Monat. Beides haben wir aus den gemessenen Wartezeiten
          über alle Parks gemittelt:
        </PG>
        <BestTimesData locale="de" labels={DATA_LABELS} />
        <QuietestDaysByPark locale="de" />
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
          Nach dem Wochentag entscheidet die Uhrzeit am meisten. Diese vier Zeitfenster sind fast
          überall am entspanntesten:
        </P>
        <TouchpointGrid
          items={[
            {
              icon: Sunrise,
              title: (
                <>
                  Zur Öffnung (<GlossaryTermLink termId="rope-drop">Rope Drop</GlossaryTermLink>)
                </>
              ),
              body: 'Die erste Stunde nach dem Einlass ist die beste des Tages. Wer pünktlich am Tor steht, fährt die großen Bahnen oft, bevor sich überhaupt Warteschlangen bilden.',
            },
            {
              icon: Users,
              title: 'Rund um die Mittagszeit',
              body: 'Wenn alle beim Essen sitzen, werden die Warteschlangen kürzer. Nimm die Zeit für die beliebten Bahnen und iss später. Die Pommes schmecken um halb drei genauso.',
            },
            {
              icon: Sun,
              title: 'Die letzte Stunde',
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
          src="/media/phantasialand/black-mamba.jpg"
          alt="Black Mamba rast durch den Dschungel im Phantasialand"
          kicker="Zur Öffnung"
          title="Früh da sein hilft, nur nicht bei jeder Bahn"
        >
          Bei den großen Headlinern bringt die erste Stunde nach dem Einlass oft mehr Fahrten als
          zwei am Nachmittag. Das gilt aber nicht überall: Manche Bahnen sind den ganzen Tag gleich
          voll, andere wachen erst nach dem Mittagessen auf. Auf der Seite jeder Attraktion steht
          ihre eigene Tageskurve, und dort steht auch, ob sich der frühere Wecker für sie lohnt.
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
          Genauso nützlich ist zu wissen, wann du besser nicht fährst. An diesen Tagen sind die
          Parks rappelvoll. Du kannst dich mit Proviant und viel Geduld darauf einstellen oder
          gleich drumherum planen:
        </PG>
        <SplitFigure
          src="/media/walibi-holland/goliath.jpg"
          alt="Achterbahn Goliath im Walibi Holland an einem vollen Tag"
          kicker="Spitzentag"
          title="Schön, frei, alle da"
          reverse
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="very_high" />
            </GlossaryTermLink>
          }
        >
          Ein Samstag in den Sommerferien bei bestem Wetter ist der Worst Case: alle haben frei,
          alle wollen raus, alle sind da. Wenn du flexibel bist, nimm lieber den Dienstag danach.
          Derselbe Park wirkt dann, als hätte über Nacht jemand umgebaut und dabei die
          Warteschlangen vergessen.
        </SplitFigure>
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Wochenenden & Feiertage',
              body: 'Der Samstag ist über alle Parks hinweg der vollste Tag, mit deutlichem Abstand zum Rest der Woche. Feiertage und lange Wochenenden legen noch mal einen drauf.',
            },
            {
              icon: CalendarRange,
              title: <GlossaryTermLink termId="school-holiday">Schulferien</GlossaryTermLink>,
              body: 'Sobald bei dir oder im Nachbarbundesland Ferien sind, wird es voller. Die Sommerferien sind die Hochsaison.',
            },
            {
              icon: Sun,
              title: 'Brückentage & Ferien-Samstage im Hochsommer',
              body: 'Sonne, freier Tag und Hochsaison fallen hier zusammen. Von allen Konstellationen im Kalender ist das die vollste.',
            },
            {
              icon: Sparkles,
              title: 'Neuheiten im ersten Sommer',
              body: 'Eine brandneue Achterbahn will in ihrer ersten Saison jeder gefahren sein, am liebsten vor den Kollegen. Rechne bei Premieren mit langen Wartezeiten.',
            },
          ]}
        />
      </SectionShell>

      {/* 04 — Tactics */}
      <SectionShell
        id="tactics"
        index="04"
        kicker="Clever spielen"
        title="Tricks für kurze Warteschlangen"
        icon={Sparkles}
      >
        <TouchpointGrid
          items={[
            {
              icon: CalendarDays,
              title: 'Wochentag statt Wochenende',
              body: 'Der größte Hebel im Kalender. Über alle Parks gerechnet liegt der Samstag am weitesten über dem Schnitt, der Dienstag am weitesten darunter.',
            },
            {
              icon: CloudRain,
              title: 'Wetter clever nutzen',
              body: 'Eine durchwachsene Vorhersage hält viele zu Hause. Wenn dir etwas Nieselregen nichts ausmacht, stehst du deutlich kürzer an. Regenjacke schlägt Regenschirm.',
            },
            {
              icon: Ticket,
              title: (
                <>
                  <GlossaryTermLink termId="single-rider">Single-Rider</GlossaryTermLink> &{' '}
                  <GlossaryTermLink termId="virtual-queue">
                    virtuelle Warteschlangen
                  </GlossaryTermLink>
                </>
              ),
              body: 'Füll als Einzelfahrer freie Plätze auf oder stell dich per App an, während du isst oder bummelst. Ihr sitzt dann nicht nebeneinander, dafür früher im Zug.',
            },
          ]}
        />
        <P>
          Wie all das im Park zusammenspielt, gehen wir in der{' '}
          <Link href={`/${HOWTO_SEGMENTS.de}`}>ausführlichen Anleitung</Link> Schritt für Schritt
          durch.
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
          Die Muster von oben sind der grobe Rahmen. Den besten Tag für deinen Park findest du im{' '}
          <GlossaryTermLink termId="crowd-calendar">Crowd-Kalender</GlossaryTermLink> auf jeder
          Parkseite. Dort ist jeder einzelne Tag grün, gelb oder rot, so weit der Park seinen
          Zeitplan veröffentlicht hat, und die Ferien und Feiertage der jeweiligen Region sind
          eingerechnet.
        </P>
        <SplitFigure
          src="/media/efteling/symbolica.jpg"
          alt="Die Palastfahrt Symbolica im Efteling"
          kicker="Grün, gelb, rot"
          title="Mit den Ferien und Feiertagen der Region"
          badge={
            <GlossaryTermLink termId="crowd-level" className="inline-flex cursor-help">
              <CrowdLevelBadge level="low" />
            </GlossaryTermLink>
          }
        >
          Jede Parkseite hat eine tagesgenaue Prognose, in der die Ferien und Feiertage der
          richtigen Region stecken, auch die, von denen du noch nie gehört hast. Such dir einen
          grünen Tag aus, dann ist der wichtigste Teil der Planung erledigt, bevor du ein Ticket
          kaufst.
        </SplitFigure>
        <P>Ein paar beliebte Parks zum direkten Ausprobieren:</P>
        <PopularParksGrid />
      </SectionShell>

      {/* Powered by Fancast */}
      <FancastCta
        title="Angetrieben von Fancast"
        body="Unser eigenes Prognosemodell schätzt den Andrang für jeden veröffentlichten Tag und benotet sich dabei selbst."
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
