import {
  CalendarDays,
  Footprints,
  Gauge,
  HelpCircle,
  Sunrise,
  Theater,
  Users,
  Wand2,
} from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
import { DEMO_PARTY_RIDES } from '../_fixtures';
import type { PlanDay } from '@/lib/api/types';
import type { PlannerEntry } from '@/lib/planner/types';

const PARK = '/parks/europe/germany/bruehl/phantasialand';

/**
 * Der erklärende Teil der Planer-Seite, deutsch.
 *
 * Eine Datei pro Sprache, wie bei der Guide-Seite und bei Fancast: Der Text
 * enthält Links und Auszeichnungen, und sechs Übersetzungen davon in eine
 * `messages`-Datei zu pressen macht aus jedem Absatz einen Schlüssel.
 *
 * Jede Zahl hier steht so in `_fixtures.ts` und stammt aus einer echten Antwort
 * der API. Wer eine ändert, ändert beide.
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
          Jede Bahn ist ein Block, und seine Höhe ist die Wartezeit, die für seine Stunde
          vorhergesagt ist. Ziehst du ihn in eine vollere Stunde, wächst er, in einer ruhigeren
          schrumpft er. Zwischen zwei Blöcken steht der Umstieg mit der Entfernung und der Angabe,
          ob die Zeit reicht; der Weg aus der Station und die Fahrt selbst sind darin schon
          eingerechnet.
        </P>
        <P>
          Die Zeitleiste unten ist aus denselben Bauteilen gebaut wie der Planer und zeigt, was die
          API am 4. September 2026 für Samstag, den 12. September im{' '}
          <A href={PARK}>Phantasialand</A> geliefert hat. Zieh einen Block auf eine andere Uhrzeit:
          Er rastet auf fünf Minuten ein, seine Höhe und die Umstiege daneben werden neu gerechnet,
          und gespeichert wird dabei nichts.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Am ausgewählten Block steht dasselbe in Worten: Uhrzeit, erwartete Wartezeit und wie weit
          die Prognose für diese Bahn typischerweise danebenliegt.
        </Note>
      </Chapter>

      <Chapter
        id="woher-die-zahl-kommt"
        index="02"
        icon={Gauge}
        kicker="Prognose"
        title="Stundenkurve und typischer Fehler"
      >
        <P>
          Die API liefert für jede Bahn eine Kurve über den Tag, Stunde für Stunde. Taron steht an
          diesem Samstag bei 45 Minuten um zehn, 50 um elf, 40 um eins und wieder 50 am Abend; über
          den ganzen Tag liegen nur zehn Minuten dazwischen. Weil es für Taron an diesem Tag kein
          gutes Fenster gibt, landet die Bahn dort, wo der Rest des Tages Platz lässt. Black Mamba
          fällt von 35 Minuten mittags auf 20 um sechs, und Chiapas läuft andersherum, von 20 auf
          35.
        </P>
        <P>
          Zu jeder Zahl gehört ihr typischer Fehler, und der wächst mit der Schlange. Für die
          Bahnen, deren Tageshöhe an diesem Samstag bei 35 Minuten oder darüber liegt, nennt die API
          15,4 Minuten, für die flacheren 10,9. An der Hälfte der Tage liegt die echte Wartezeit
          weiter daneben als dieser Wert. Am ausgewählten Block steht er deshalb als
          Plus-Minus-Angabe. Eine Spanne sähe aus, als läge die echte Wartezeit sicher darin.
        </P>
        <Note>
          Tarons Kurve beruht auf 142 gemessenen Tagen, die von Black Mamba auf 161. Die Zahl für
          jede Bahn steht in ihren <A href={`${PARK}/taron`}>Statistiken</A>.
        </Note>
        <P>
          Neben der Zahl steht, woher sie kommt. Hat das Modell den Tag Stunde für Stunde
          durchgerechnet, steht dort „Stundenprognose“. Stammt die Tageshöhe aus der Vorhersage und
          der Verlauf aus früheren Tagen, steht „Aus Tagesprognose“, so wie an diesem Samstag. Weit
          im Voraus ist schon die Tageshöhe unsicher, dann steht dort „Grobe Schätzung“. Für Tage,
          an denen wir nie gemessen haben, gibt es keinen Plan mit Zahlen.
        </P>
      </Chapter>

      <Chapter
        id="oeffnungszeiten"
        index="03"
        icon={Sunrise}
        kicker="Öffnungszeiten"
        title="Bahnen, die später öffnen als der Park"
      >
        <P>
          An diesem Samstag öffnet das Phantasialand um 9 Uhr. Taron, F.L.Y., beide Winja’s und Raik
          laufen ab 10, Chiapas ab 10:15. Wer um neun am Drehkreuz steht, hat die Wahl zwischen
          Black Mamba und Maus au Chocolat. Ein Plan, der die erste Stunde mit Headlinern füllt,
          geht an diesem Tag also nicht auf.
        </P>
        <P>
          Jede Bahn hat ihre eigene Öffnungszeit, und ein Block lässt sich frühestens auf diese
          Uhrzeit ziehen. Für den Abend fehlt eine solche Grenze, weil kein Feed verlässlich meldet,
          wann eine Bahn schließt; die Zeitleiste endet mit der Schließzeit des Parks.
        </P>
      </Chapter>

      <Chapter
        id="umstiege"
        index="04"
        icon={Footprints}
        kicker="Umstiege"
        title="Wegzeit zwischen zwei Bahnen"
      >
        <P>
          Ein Wartezeiten-Feed meldet 50 Minuten an Taron. Ob du es von Rookburgh aus rechtzeitig
          dorthin schaffst, steht im Umstieg. Er rechnet mit der Entfernung zwischen den Koordinaten
          der beiden Bahnen, dazu drei Minuten für den Weg aus der Station und drei für Einsteigen
          und Fahren, wo keine Fahrzeit hinterlegt ist.
        </P>
        <P>
          Die Entfernung ist Luftlinie und steht auch so da. Zu Fuß ist es weiter, weil Wege um
          Wasser, Warteschlangen und Einbahnstraßen biegen und das Phantasialand Rookburgh und
          Klugheim übereinanderstapelt. Für die obere Grenze gelten deshalb Parktempo statt
          Schrittgeschwindigkeit und ein Umweg von zwei Dritteln auf die Luftlinie.
        </P>
        <Note>
          Als „knapp“ gilt ein Umstieg, der nicht mehr aufgeht, sobald die Prognose so weit
          danebenliegt, wie sie selbst angibt. Liefert die API keine Streuung, bleibt es bei „gut“,
          und der Titel der Bewertung sagt das dazu.
        </Note>
      </Chapter>

      <Chapter
        id="wer-mitkommt"
        index="05"
        icon={Users}
        kicker="Gruppe"
        title="Mindestgröße und Wasserbahnen"
      >
        <P>
          Einmal pro Tag gibst du zwei Dinge über die Gruppe an: wie groß die kleinste Person ist
          und ob ihr möglichst trocken bleiben wollt. Die Größe wählst du in Zehnerschritten von 90
          bis 140 cm, voreingestellt sind 110 cm. Beide Antworten gehören zum Tag, nicht zum Park
          oder zum Browser, weil dieselbe Familie im Oktober vielleicht ohne das Vierjährige
          wiederkommt.
        </P>
        <P>
          Die Antworten markieren Bahnen, ausgeblendet wird keine. Liegt die Mindestgröße einer Bahn
          über deiner Angabe, steht an ihr „Mindestgröße höher als die kleinste Person im Plan“;
          eine Wasserbahn trägt „Wasserbahn“, sobald ihr trocken bleiben wollt. Beide bleiben in der
          Liste, weil nur die Gruppe weiß, ob jemand am Ausgang wartet und die Taschen hält.
        </P>
        <P>
          Im <A href={PARK}>Phantasialand</A> verlangt Taron laut API am 29. September 2026{' '}
          {DEMO_PARTY_RIDES.taron.minimumHeight} cm, Chiapas{' '}
          {DEMO_PARTY_RIDES.chiapas.minimumHeight} cm, und Chiapas macht nass. Bei den
          voreingestellten 110 cm tragen beide die Markierung zur Mindestgröße, und Chiapas bekommt
          bei „trocken bleiben“ zusätzlich „Wasserbahn“. Bei 130 cm verliert Chiapas die Markierung
          zur Größe, Taron behält sie.
        </P>
        <Note>
          Für Moptis Monkey Depot ist bei uns keine Mindestgröße hinterlegt, deshalb bleibt die Bahn
          ohne Markierung. Das heißt nur, dass uns die Angabe fehlt. Am Eingang der Bahn gilt, was
          der Park dort vorgibt.
        </Note>
      </Chapter>

      <Chapter
        id="reihenfolge"
        index="06"
        icon={Wand2}
        kicker="Sortieren"
        title="Den Tag sortieren lassen"
      >
        <P>
          Dafür gibt es zwei Knöpfe mit derselben Rechnung dahinter. „Alle Headliner einplanen“ holt
          die großen Bahnen des Parks dazu, die noch fehlen, und sortiert danach den ganzen Tag.
          „Tag optimieren“ ordnet nur um, was schon geplant ist. Den ersten nimmst du, wenn noch
          große Bahnen fehlen, den zweiten, wenn nur die Reihenfolge besser werden soll.
        </P>
        <P>
          Sortiert wird nach vier Regeln, in dieser Rangfolge. Zuerst zählt, was dir wichtig ist:
          Was du nach vorn ziehst, fällt als Letztes raus. Dann muss alles vor Parkschluss
          drankommen, und eine Bahn weniger, die sicher klappt, schlägt eine mehr, die zu spät käme.
          Danach zählt die Summe der Wartezeiten, und bei gleicher Summe gewinnt die Reihenfolge,
          die früher fertig ist. Einen Regler, der Anstehen gegen Herumstehen abwägt, gibt es
          bewusst nicht, weil sich für dieses Verhältnis kein Wert begründen lässt.
        </P>
        <P>
          Für den frühen Morgen gibt es keine eigene Regel, nur die Stundenkurve jeder Bahn. Liegt
          sie kurz nach der Öffnung am tiefsten, kommt „die große Bahn zuerst“ von selbst heraus;
          liegt sie flach, etwas anderes. An einem gemessenen Tag steht Taron Stunde für Stunde bei
          60, 60, 54, 53 und 59 Minuten, während Chiapas um 22 Minuten steigt.
        </P>
        <P>
          Manchmal schlägt der Planer vor, eine Runde zu warten, statt sich sofort anzustellen. Das
          passiert, wenn die Schlange so weit einbricht, dass du mitsamt der Pause früher wieder
          frei bist als beim sofortigen Anstellen; kürzer anzustehen allein reicht dafür nicht, denn
          der Tag darf durch die Pause nicht später enden. Eine solche Pause dauert höchstens zwei
          Stunden. An diese Grenze kommt sie kaum, denn sie lohnt sich nur, wenn sie kürzer ist als
          die Schlange, die sie erspart, und dafür bräuchte es eine Schlange von über zwei Stunden.
        </P>
        <P>
          Eine Mittagspause um eins bleibt um eins, und eine abgehakte Bahn bleibt, wo sie ist;
          geplant wird um beide herum. Nach dem Klick steht da, was sich geändert hat. „18 Min.
          weniger Warten“ ist die Differenz zwischen zwei Rechnungen desselben Verfahrens, vor und
          nach dem Klick. Ist nichts zu holen, steht dort „Passt schon so“, und der Plan bleibt, wie
          er war. Beim Headliner-Knopf steht statt einer Ersparnis, wie viele Bahnen dazugekommen
          sind und wie viele davon nicht zur Gruppe passen, weil der Tag mit den neuen Bahnen länger
          wird. Nach beiden Knöpfen steht außerdem, was am Ende nicht mehr in den Tag passt.
          „Rückgängig“ stellt den Stand von vor dem Klick wieder her, solange der Planer offen ist.
        </P>
        <Note>
          Wo keine Wartezeiten ankommen, fehlen die beiden Knöpfe. Im Hansa-Park kostet jede Bahn
          dieselbe angenommene Null, und damit ist jede Reihenfolge so gut wie jede andere.
        </Note>
      </Chapter>

      <Chapter
        id="spielzeiten"
        index="07"
        icon={Theater}
        kicker="Shows"
        title="Hochgerechnete Spielzeiten"
      >
        <P>
          Für heute hat die API die Zeiten des Betreibers. Für jeden anderen Tag rechnet sie den
          letzten gleichen Wochentag hoch, weil keine Quelle die Zeiten im Voraus nennt, und gibt
          an, von welchem Datum sie stammen und aus wie vielen Tagen. Eine Hochrechnung trägt eine
          Tilde vor der Uhrzeit und das Wort „Voraussichtlich“, eine Betreiberangabe steht ohne
          beides da.
        </P>
        <P>
          An diesem Samstag sind alle Spielzeiten hochgerechnet, die von Dragon Drago und Kroka’s
          Lodge aus dem 15. August, die von Miji African Dancers aus dem 29. Die letzte Vorstellung
          von Kroka’s Lodge um 19 Uhr fehlt auf der Zeitleiste, weil der Park um 18 Uhr schließt und
          hochgerechnete Zeiten nach Feierabend wegfallen.
        </P>
      </Chapter>

      <Chapter
        id="grenzen"
        index="08"
        icon={HelpCircle}
        kicker="Grenzen"
        title="Fehlende Daten und wo der Plan gespeichert ist"
      >
        <P>
          Der <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> zeigt seine
          Wartezeiten nur in der eigenen App im Park-WLAN. Für ihn kommt deshalb nie eine Zahl an,
          und wir erfinden auch keine. Die Wettervorhersage reicht rund zwei Wochen; für spätere
          Tage steht dort, dass sie so weit nicht reicht, damit keine Lücke entsteht, die wie
          „bleibt trocken“ aussieht.
        </P>
        <P>
          Am Tag selbst kann eine Bahn stehenbleiben, eine Show ausfallen oder ein Gewitter den
          Nachmittag verschieben. Der Plan rechnet aus, ob der Tag mit den vorhergesagten
          Wartezeiten aufgehen kann. Im Park hakst du gefahrene Bahnen ab, und an jeder steht dann
          die Wartezeit, die wirklich anstand.
        </P>
        <P>
          Der Plan liegt in deinem Browser, ein Konto brauchst du nicht. Erst wenn du
          Benachrichtigungen einschaltest, legen wir eine Kopie auf unseren Server, und der Planer
          sagt das an dieser Stelle. Ohne Plan beginnt er mit vier Fragen: Park, Tag, wer mitkommt
          und welche großen Bahnen in den Tag sollen. Den passenden Tag findest du im{' '}
          <A href={`${PARK}/wartezeiten-kalender`}>Wartezeiten-Kalender</A> jedes Parks.
        </P>
      </Chapter>
    </>
  );
}
