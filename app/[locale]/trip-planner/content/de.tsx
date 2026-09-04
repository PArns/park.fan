import { CalendarDays, Footprints, Gauge, HelpCircle, Sunrise, Theater } from 'lucide-react';
import { A, P } from '@/components/marketing/editorial-ui';
import { Chapter, Note } from '../_chrome';
import { PlannerDayDemo } from '../_demos';
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
        kicker="Der Tag als Zeitleiste"
        title="Was der Planer aus einem Parktag macht"
      >
        <P>
          Ein Block ist eine Bahn, und seine Höhe ist die Wartezeit, die für seine Stunde
          vorhergesagt ist. Deshalb wächst derselbe Block, wenn du ihn in eine vollere Stunde
          ziehst, und schrumpft in einer ruhigeren. Zwischen zwei Blöcken bleibt kein leerer Platz,
          sondern der Umstieg: wie weit es ist und ob die Zeit dafür reicht. Der Weg aus der Station
          und die Fahrt selbst stecken dort und nicht im Block.
        </P>
        <P>
          Was du unten siehst, ist nicht abgemalt. Es sind dieselben Bauteile, die im Planer laufen,
          gefüttert mit der Antwort, die die API am 4. September 2026 für Samstag, den 12. September
          im <A href={PARK}>Phantasialand</A> gegeben hat. Zieh einen Block auf eine andere Uhrzeit:
          Er rastet auf fünf Minuten ein, rechnet seine Höhe neu und die Umstiege daneben ebenfalls.
          Gespeichert wird hier nichts.
        </P>
        <PlannerDayDemo day={day} entries={entries} selected="demo-taron" />
        <Note>
          Der ausgewählte Block sagt es in Worten: Uhrzeit, erwartete Wartezeit und wie weit die
          Prognose für diese Bahn typischerweise danebenliegt.
        </Note>
      </Chapter>

      <Chapter
        id="woher-die-zahl-kommt"
        index="02"
        icon={Gauge}
        kicker="Die Zahl am Block"
        title="Woher die Minuten kommen und wie sicher sie sind"
      >
        <P>
          Für jede Bahn liefert die API eine Kurve über den Tag, Stunde für Stunde. Taron steht an
          diesem Samstag bei 45 Minuten um zehn, 50 um elf, 40 um eins und wieder 50 am Abend. Das
          ist der eigentliche Grund, Taron früh zu fahren: Nicht weil morgens immer weniger los ist,
          sondern weil dieser Tag für diese Bahn keine ruhige Stunde hat. Black Mamba dagegen fällt
          von 35 Minuten mittags auf 20 um sechs, und Chiapas läuft andersherum, von 20 auf 35.
        </P>
        <P>
          Dazu kommt, wie weit die Zahl typischerweise danebenliegt, und das hängt am Niveau: Je
          länger eine Schlange, desto größer die Streuung. Für die Bahnen, deren Tageshöhe an diesem
          Samstag bei 35 Minuten oder darüber liegt, nennt die API 15,4 Minuten typischen Fehler,
          für die flacheren 10,9. Typisch heißt: Die Hälfte der Tage liegt weiter daneben. Deshalb
          schreibt der Planer die Zahl als Plus-Minus-Angabe an den ausgewählten Block und nie als
          Spanne, in der die richtige Antwort schon enthalten wäre.
        </P>
        <Note>
          Hinter Tarons Kurve stehen 142 gemessene Tage, hinter Black Mamba 161. Wie viele es sind,
          steht in den <A href={`${PARK}/taron`}>Statistiken der Bahn</A>.
        </Note>
        <P>
          Der Planer sagt außerdem, welcher Art die Prognose ist. Rechnet das Modell den Tag
          stundengenau durch, steht dort „Stundenprognose“. Kommt die Tageshöhe aus der Vorhersage
          und der Verlauf aus früheren Tagen, steht „Aus Tagesprognose“, so wie an diesem Samstag.
          Weit im Voraus wird die Tageshöhe selbst dünn, und dann steht dort „Grobe Schätzung“. Für
          Tage, an denen wir nie etwas gemessen haben, gibt es keinen Plan mit Zahlen.
        </P>
      </Chapter>

      <Chapter
        id="oeffnungszeiten"
        index="03"
        icon={Sunrise}
        kicker="Öffnung"
        title="Der Park macht um neun auf, die Bahn um zehn"
      >
        <P>
          An diesem Samstag öffnet das Phantasialand um 9 Uhr. Taron, F.L.Y., beide Winja’s und Raik
          laufen ab 10, Chiapas ab 10:15. Wer um neun am Drehkreuz steht, kann Black Mamba fahren
          oder Maus au Chocolat, und das war es. Das ist keine Kleinigkeit: Ein Plan, der die erste
          Stunde mit Headlinern füllt, verplant eine Stunde, die es nicht gibt.
        </P>
        <P>
          Der Planer kennt die Öffnungszeit jeder einzelnen Bahn und lässt einen Block nicht davor
          rutschen. Ein Gegenstück dazu gibt es nicht: Wann eine Bahn abends dichtmacht, meldet kein
          Feed verlässlich, deshalb steht dort auch nichts. Die Zeitleiste hört mit der Schließzeit
          des Parks auf.
        </P>
      </Chapter>

      <Chapter
        id="umstiege"
        index="04"
        icon={Footprints}
        kicker="Der Weg dazwischen"
        title="Zwischen zwei Bahnen liegt ein Weg, und der kostet Zeit"
      >
        <P>
          Ein Wartezeiten-Feed kann sagen, dass an Taron 50 Minuten stehen. Was er nicht sagen kann:
          dass du es von Rookburgh aus nicht rechtzeitig dorthin schaffst. Genau dafür ist der
          Umstieg da. Er rechnet mit der Entfernung zwischen den Koordinaten der beiden Bahnen, plus
          drei Minuten für den Weg aus der Station und drei für Einsteigen und Fahren, wo keine
          Fahrzeit hinterlegt ist.
        </P>
        <P>
          Die Entfernung ist Luftlinie und wird auch so genannt. Sie ist eine Untergrenze, keine
          Gehzeit: Wege biegen um Wasser, Warteschlangen und Einbahnstraßen, und das Phantasialand
          stapelt Rookburgh und Klugheim übereinander. Für die obere Grenze rechnet der Planer
          deshalb mit Parktempo statt Schrittgeschwindigkeit und mit einem Umweg von zwei Dritteln
          auf die Luftlinie.
        </P>
        <Note>
          „Knapp“ heißt nicht „eng“, sondern: Dieser Umstieg geht nicht mehr auf, wenn die Prognose
          so danebenliegt, wie sie selbst angibt. Wo die API keine Streuung liefert, bleibt es bei
          „gut“ und die Bewertung sagt das im Titel dazu.
        </Note>
      </Chapter>

      <Chapter
        id="spielzeiten"
        index="05"
        icon={Theater}
        kicker="Shows"
        title="Spielzeiten sind Aushang oder Hochrechnung, nie beides"
      >
        <P>
          Für heute kennt die API die Zeiten des Betreibers. Für jeden anderen Tag gibt es keine
          Quelle, die sie im Voraus wüsste, also rechnet sie den letzten gleichen Wochentag hoch und
          sagt dazu, von welchem Datum die Zeiten stammen und aus wie vielen Tagen. Beides darf
          nicht gleich aussehen: Eine Hochrechnung bekommt eine Tilde vor die Uhrzeit und das Wort
          „Voraussichtlich“, eine Betreiberangabe steht ohne beides da.
        </P>
        <P>
          An diesem Samstag sind alle Spielzeiten hochgerechnet, die von Dragon Drago und Kroka’s
          Lodge aus dem 15. August, die von Miji African Dancers aus dem 29. Die letzte Vorstellung
          von Kroka’s Lodge um 19 Uhr taucht auf der Zeitleiste nicht auf: Der Park schließt um 18
          Uhr, und hochgerechnete Zeiten nach Feierabend fallen weg.
        </P>
      </Chapter>

      <Chapter
        id="grenzen"
        index="06"
        icon={HelpCircle}
        kicker="Grenzen"
        title="Was der Planer nicht weiß"
      >
        <P>
          Nicht jeder Park veröffentlicht Wartezeiten. Der{' '}
          <A href="/parks/europe/germany/sierksdorf/hansa-park">Hansa-Park</A> zeigt seine nur in
          der eigenen App im Park-WLAN, also kommt für ihn nie eine Zahl an, und der Planer erfindet
          keine. Für Tage, die zu weit weg sind, gibt es kein Wetter: Die Vorhersage reicht rund
          zwei Wochen, danach steht dort, dass sie nicht reicht, statt einer Lücke, die wie „bleibt
          trocken“ aussieht.
        </P>
        <P>
          Und was ein Plan wirklich kostet, entscheidet der Tag. Eine Bahn kann stehenbleiben, eine
          Show ausfallen, ein Gewitter den Nachmittag drehen. Deshalb ist der Plan kein Fahrplan,
          sondern eine Rechnung darüber, ob der Tag so aufgehen kann. Wer im Park steht, hakt
          gefahrene Bahnen ab, und der Planer schreibt die Wartezeit dazu, die wirklich anstand.
        </P>
        <P>
          Alles davon liegt in deinem Browser. Kein Konto, kein Server, keine Synchronisierung: Der
          Plan ist eine Datei in deinem eigenen Speicher, und wer ihn ohne Plan öffnet, bekommt den
          Assistenten mit den drei Fragen, die zuerst geklärt sein müssen. Park, Tag, wer mitkommt.
          Den passenden Tag findest du im{' '}
          <A href={`${PARK}/wartezeiten-kalender`}>Wartezeiten-Kalender</A> jedes Parks.
        </P>
      </Chapter>
    </>
  );
}
