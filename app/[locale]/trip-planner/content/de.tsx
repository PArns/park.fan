import { CalendarDays, Clock, Footprints, Gauge, Users, Wand2 } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/**
 * The planner page's article, German. German is the source; the other five are
 * derived from it (docs/blog.md §6).
 *
 * One module per language, like the guide page and Fancast: the text carries
 * links and markup, and pressing six translations of it into a `messages` file
 * would turn every paragraph into a key.
 *
 * It describes what a visitor can do with the planner, not how the planner
 * works inside. Every figure here is in `_fixtures.ts` and comes from a real
 * API answer; whoever changes one changes both.
 */
export function ContentDE({ day, entries }: { day: PlanDay; entries: PlannerEntry[] }) {
  return (
    <>
      <Chapter
        id="ein-geplanter-tag"
        index="01"
        icon={CalendarDays}
        kicker="Zeitleiste"
        title="Blöcke und Umstiege"
      >
        <P>
          Jede Bahn in deinem Plan ist ein Block auf der Zeitleiste des Tages, und er ist so hoch,
          wie du zu dieser Uhrzeit voraussichtlich anstehst. Ziehst du ihn in eine vollere Stunde,
          wächst er, in einer ruhigeren schrumpft er. Zwischen zwei Blöcken steht der Umstieg mit
          der Entfernung zur nächsten Bahn und der Angabe, ob die Zeit reicht. „Knapp“ heißt, dass
          es nicht mehr aufgeht, sobald die Wartezeit davor so weit danebenliegt wie üblich.
        </P>
        <P>
          Unten liegt ein Plan für das <A href={PARK}>Phantasialand</A> am Samstag, 12. September
          2026, mit den Wartezeiten, die am 4. September dafür vorhergesagt waren. Zieh einen Block
          auf eine andere Uhrzeit, dann werden seine Höhe und die Umstiege neu gerechnet. In deinem
          eigenen Plan landet davon nichts.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Am ausgewählten Block stehen die Uhrzeit, die erwartete Wartezeit und wie weit die
          Prognose für diese Bahn meist danebenliegt.
        </Note>
        <P>
          Auf einem breiten Bildschirm passen zwei Tage nebeneinander, etwa Samstag und Sonntag oder
          zwei Parks. Zu jedem steht die Wartezeit zusammen da, und du siehst, an welchem Tag du
          weniger anstehst.
        </P>
      </Chapter>

      <Chapter
        id="woher-die-zahl-kommt"
        index="02"
        icon={Gauge}
        kicker="Prognose"
        title="Woher die Wartezeiten kommen"
      >
        <P>
          Für jede Bahn gibt es eine Prognose über den ganzen Tag, Stunde für Stunde. An diesem
          Samstag fällt Black Mamba von 35 Minuten am Mittag auf 20 am Abend, Chiapas steht um
          Viertel nach zehn bei 20 Minuten und am Nachmittag bei 35. Black Mamba gehört an diesem
          Tag also in den Abend, Chiapas an den Morgen.
        </P>
        <P>
          Wie weit die Prognose für eine Bahn üblicherweise danebenliegt, steht am Block, bei{' '}
          <A href={`${PARK}/taron`}>Taron</A> an diesem Samstag 15 Minuten. Je weiter der Tag
          entfernt ist, desto grober wird die Zahl, und daneben steht, wie sie zustande kam: von
          „Stundenprognose“ über „Aus Tagesprognose“ bis „Grobe Schätzung“.
        </P>
        <P>
          Der <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> zeigt seine
          Wartezeiten nur in der eigenen App im Park-WLAN, deshalb gibt es für ihn keine Zahlen.
          Planen kannst du dort trotzdem, nur ohne Minuten und ohne die Knöpfe zum Sortieren.
        </P>
      </Chapter>

      <Chapter
        id="wer-mitkommt"
        index="03"
        icon={Users}
        kicker="Gruppe"
        title="Mindestgröße und Wasserbahnen"
      >
        <P>
          Einen neuen Tag legst du mit vier Fragen an: welcher Park, welcher Tag, wer mitkommt und
          welche großen Bahnen in den Plan sollen. Im Monatskalender ist jeder Tag nach dem
          erwarteten Andrang eingefärbt, ausführlicher steht es im{' '}
          <A href={`${PARK}/wartezeiten-kalender`}>Wartezeiten-Kalender</A> des Parks.
        </P>
        <P>
          Sind Kinder dabei, gibst du an, wie groß das kleinste ist und ob ihr möglichst trocken
          bleiben wollt. Bahnen mit höherer Mindestgröße und Wasserbahnen bekommen dann ein Zeichen
          und bleiben trotzdem in der Liste, denn ob jemand am Ausgang wartet und die Taschen hält,
          entscheidet ihr. Im Phantasialand verlangt Taron {DEMO_PARTY_RIDES.taron.minimumHeight}{' '}
          cm, Chiapas {DEMO_PARTY_RIDES.chiapas.minimumHeight} cm, und Chiapas macht nass (Stand 29.
          September 2026). Mit einem Kind von 120 cm tragen beide das Zeichen.
        </P>
        <Note>
          Wo bei uns keine Mindestgröße hinterlegt ist, etwa bei Moptis Monkey Depot, bleibt die
          Bahn ohne Zeichen. Am Eingang der Bahn gilt, was der Park vorgibt.
        </Note>
      </Chapter>

      <Chapter
        id="tagesablauf"
        index="04"
        icon={Clock}
        kicker="Tagesablauf"
        title="Öffnungszeiten, Shows und Pausen"
      >
        <P>
          An diesem Samstag öffnet das Phantasialand um 9 Uhr, Taron, F.L.Y. und die meisten anderen
          großen Bahnen fahren aber erst ab 10. Wer um neun da ist, fängt mit Black Mamba oder Maus
          au Chocolat an. Vor die Öffnungszeit seiner Bahn lässt sich ein Block nicht ziehen.
        </P>
        <P>
          Die Spielzeiten der Shows stehen mit in der Zeitleiste. Für heute sind es die Zeiten des
          Parks. Für spätere Tage nennt keine Quelle die Zeiten, deshalb nehmen wir die vom letzten
          gleichen Wochentag und schreiben „Voraussichtlich“ dazu.
        </P>
        <P>
          Pausen, Essen oder einen Treffpunkt legst du als eigenen Block in den Tag und ziehst ihn
          so lang, wie du ihn brauchst. Wer beim Anlegen „Mittagessen einplanen“ wählt, hat um 12:30
          schon einen. Über dem Tag stehen außerdem Ferien und Feiertage und, bis etwa zwei Wochen
          im Voraus, das Wetter.
        </P>
      </Chapter>

      <Chapter
        id="reihenfolge"
        index="05"
        icon={Wand2}
        kicker="Sortieren"
        title="Den Tag sortieren lassen"
      >
        <P>
          Mit zwei Knöpfen sortierst du den Tag, ohne jeden Block selbst zu schieben. „Alle
          Headliner einplanen“ holt die großen Bahnen dazu, die noch fehlen, und ordnet dann den
          ganzen Tag. „Tag optimieren“ stellt nur um, was schon im Plan steht. In beiden Fällen
          kommt alles vor Parkschluss dran, und du stehst insgesamt so kurz wie möglich an.
        </P>
        <P>
          Mittagspause und abgehakte Bahnen bleiben, wo sie sind. Danach steht da, wie viele Minuten
          Anstehen du sparst, und „Rückgängig“ holt den alten Stand zurück.
        </P>
        <P>
          Passt nicht alles in den Tag, öffnet sich ein Assistent. Zuerst stehen dort Änderungen,
          die Platz schaffen, ohne dass eine Bahn wegfällt, etwa eine kürzere Mittagspause. Reicht
          das nicht, bringst du die Bahnen in eine Reihenfolge nach Wichtigkeit, und gestrichen wird
          von unten.
        </P>
      </Chapter>

      <Chapter id="im-park" index="06" icon={Footprints} kicker="Im Park" title="Am Tag selbst">
        <P>
          Im Park hakst du ab, was du gefahren bist. Am Block steht dann die Wartezeit, die beim
          Abhaken gemeldet war, und wie weit die Schätzung davon entfernt lag. Meldet eine geplante
          Bahn gerade geschlossen, steht das ebenfalls an ihrem Block.
        </P>
        <P>
          Mit Benachrichtigungen sagen wir Bescheid, wenn du zur nächsten Bahn losmusst, wenn eine
          geplante Bahn schließt oder wieder öffnet und wenn sich eine Wartezeit deutlich ändert.
          Auch die Spielzeiten der Shows kannst du dir schicken lassen. Was davon ankommt, wählst du
          selbst.
        </P>
        <P>
          Der Plan liegt in deinem Browser, ein Konto brauchst du nicht. Erst für die
          Benachrichtigungen legen wir eine Kopie auf unseren Server, und sie ist wieder weg, sobald
          du sie ausschaltest. Solange sie dort liegt, kannst du einen Link zum Plan verschicken.
          Wer ihn öffnet, kann den Plan als eigene Kopie übernehmen.
        </P>
      </Chapter>
    </>
  );
}
