---
title: 'Der Tagesplaner: Wir rechnen nach, ob dein Parktag aufgeht'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: true
excerpt: >-
  Ein Wartezeiten-Feed sagt dir, wie lang die Schlange gerade ist. Er sagt dir
  nicht, ob du nach Taron noch rechtzeitig bei F.L.Y. bist. Dafür gibt es jetzt
  den Tagesplaner: deine Bahnen auf einer Zeitleiste, jeder Block so hoch wie
  seine vorhergesagte Wartezeit, und dazwischen der Weg.
tags:
  - park-fan
  - tagesplaner
  - wartezeiten
  - tipps
  - phantasialand
  - hinter-den-kulissen
category: news
parkLinks:
  # Hansa-Park bekommt einen eigenen Absatz: warum der Planer dort keine
  # Knöpfe anbietet. Genau das fragt sich jemand auf dieser Parkseite.
  - phantasialand
  - hansa-park
rideLinks: false
coverImage:
  src: /media/phantasialand/background-16x9.jpg
  alt: 'Ein beleuchtetes Kettenkarussell dreht sich im Phantasialand, links ein Lichterbaum'
  caption: 'Kurz nach acht im Phantasialand. Bis hierhin muss ein Parktag erst mal kommen.'
  credit: 'Patrick Arns'
seo:
  title: 'Tagesplaner für den Freizeitpark: Wartezeiten vorher einrechnen'
  description: >-
    Der neue park.fan-Tagesplaner legt deine Bahnen auf eine Zeitleiste, rechnet
    mit den vorhergesagten Wartezeiten, kennt die Öffnungszeit jeder einzelnen
    Bahn und die Wege dazwischen. Ohne Konto, alles im Browser.
  keywords:
    - Freizeitpark Tag planen
    - Tagesplaner Freizeitpark
    - Wartezeiten planen
    - Phantasialand Tag planen
    - Reihenfolge Achterbahnen
    - Rope Drop
    - Parkplan erstellen
---

Es ist 15:40, ich stehe in Rookburgh, und der Plan war bis eben ein guter Plan.
Noch [F.L.Y.](ref:phantasialand/fly), dann rüber zu
[Taron](ref:phantasialand/taron), zum Schluss
[Chiapas](ref:phantasialand/chiapas-die-wasserbahn), und um sechs will ich am
Parkplatz stehen. An F.L.Y. hängen 55 Minuten, an Taron 50. Beide Zahlen
stimmen. Trotzdem weiß ich in diesem Moment nicht, welche der drei Bahnen ich
streichen muss. Ich merke es um zehn nach fünf, an der Absperrung in Klugheim,
und da ist die Entscheidung schon für mich getroffen.

Das war die Lücke. „Wie lang steht es gerade an“ beantwortet park.fan seit dem
ersten Tag. „Ist das viel für einen Dienstag“ seit
[letztem Sommer](/blog/sind-70-minuten-viel). Die dritte Frage stand nie
irgendwo: Geht mein Tag so überhaupt auf?

Seit dieser Woche steht sie da. Der [Tagesplaner](/tagesplaner) legt deine
Bahnen auf eine Zeitleiste und rechnet den Tag durch, bevor du losfährst.

## Der Tag ist eine Reihenfolge, und die hat eine Uhr

Die Grundidee ist schnell erzählt. Ein Block ist eine Bahn, und seine Höhe ist
die Wartezeit, die für seine Stunde vorhergesagt ist. Ziehst du ihn in eine
vollere Stunde, wächst er. Ziehst du ihn in eine ruhigere, schrumpft er. Der Tag
wird dabei nicht länger oder kürzer, er verschiebt sich, und das sieht man.

Zwischen zwei Blöcken steht der Umstieg: wie weit es ist und ob die Zeit
reicht. Der Weg aus der Station und die Fahrt selbst stecken in diesem
Zwischenraum und nicht im Block, weil sie zum Umsteigen gehören und nicht zum
Anstehen.

Klingt nach einer Kleinigkeit, ändert aber, wie man einen Parktag anguckt. Eine
Liste mit acht Bahnen sagt nichts darüber, ob acht Bahnen an diesem Tag
überhaupt drin sind. Acht Blöcke auf einer Zeitleiste, die um 19 Uhr endet,
sagen es sofort.

![Der Tagesplaner mit einem geplanten Phantasialand-Tag: sieben Blöcke auf einer Zeitachse von 9 bis 18 Uhr, dazwischen Umstiege mit Entfernung und Gehzeit. | Ein Samstag im Phantasialand, wie ihn der Planer zeigt. Die Höhe eines Blocks ist die Wartezeit, die für seine Stunde vorhergesagt ist.](/media/tagesplaner/planer-tag-de.webp)

## Der Weg zählt mit, und im Phantasialand besonders

Ein Wartezeiten-Feed kann sagen, dass an Taron fünfzig Minuten stehen. Was er
nicht sagen kann: dass du von Rookburgh aus nicht mehr rechtzeitig dort bist.
Genau dafür ist der Umstieg da.

Gerechnet wird mit der Entfernung zwischen den Koordinaten der beiden Bahnen,
plus drei Minuten für den Weg aus der Station und drei fürs Einsteigen und
Fahren, wo keine Fahrzeit hinterlegt ist. Die Entfernung ist Luftlinie, und der
Planer nennt sie auch so. Sie ist eine Untergrenze und keine Gehzeit: Wege
biegen um Wasser herum, um Warteschlangen und um Einbahnstraßen, und das
[Phantasialand](ref:phantasialand?long) stapelt Rookburgh und Klugheim
übereinander. Für die obere Grenze rechnet der Planer deshalb mit Parktempo
statt mit Schrittgeschwindigkeit und legt zwei Drittel Umweg auf die Luftlinie.

Steht am Umstieg „knapp“, heißt das nicht, dass es eng aussieht. Es heißt: Der
Umstieg geht nicht mehr auf, wenn die Prognose so danebenliegt, wie sie selbst
angibt. Wie weit das ist, weiß die API für jede Bahn, und an dieser Stelle wird
aus der Streuung eine Ansage.

## „Früh kommen“ gilt nicht für jede Bahn

Der Rat, den man überall liest, geht so: großer Coaster zuerst, direkt nach der
Öffnung. Für viele Bahnen stimmt er. Für viele stimmt er auch nicht, und das
sieht man erst, wenn man sich die Stunden einzeln ansieht.

```hourly-profile-widget slug=phantasialand top=8

```

Tarons Tag ist bemerkenswert flach. Die Schlange steht morgens fast so lang wie
abends, weil diese Bahn an einem normalen Tag schlicht keine ruhige Stunde hat.
Chiapas dagegen füllt sich im Lauf des Tages spürbar auf, und Black Mamba
läuft andersherum und wird zum Abend hin angenehm. Wer hier strikt nach „großes
zuerst“ plant, steht bei Chiapas ausgerechnet dann an, wenn es sich gerade
füllt, und gewinnt an Taron dafür fast nichts.

Im Planer steckt deshalb keine Rope-Drop-Regel. Der Code kennt den Begriff
nicht einmal.

```glossary-widget slug=rope-drop

```

Was er kennt, ist die Stundenkurve jeder einzelnen Bahn. Liegt sie kurz nach der
Öffnung am tiefsten, kommt „die große Bahn zuerst“ von allein heraus. Liegt sie
flach, kommt etwas anderes heraus, und das ist dann auch richtig so. Eine feste
Regel würde beiden Bahnen denselben Rat geben, obwohl ihre Tage nichts
miteinander zu tun haben.

Eine zweite Sache, die man beim Planen im Kopf selten mitrechnet: Die erste
Stunde gehört oft gar nicht dir. Das Phantasialand öffnet an vielen Tagen um
neun, aber Taron, F.L.Y., beide Winja’s und Raik laufen erst ab zehn. Wer um
neun am Drehkreuz steht und die erste Stunde mit Headlinern verplant hat, hat
eine Stunde verplant, die es nicht gibt. Der Planer kennt die Öffnungszeit jeder
einzelnen Bahn und lässt keinen Block davor rutschen. Ein Gegenstück dazu gibt
es übrigens nicht: Wann eine einzelne Bahn abends dichtmacht, meldet kein Feed
verlässlich, also steht dazu auch nichts da.

## Zwei Knöpfe sortieren den Tag

Unter der Zeitachse stehen zwei Knöpfe. „Alle Headliner einplanen“ holt die
großen Bahnen des Parks dazu, die noch nicht im Tag stehen, und sortiert
anschließend alles. „Tag optimieren“ ergänzt nichts und ordnet nur um, was schon
da ist. Dahinter läuft beide Male dieselbe Rechnung. Es sind zwei Knöpfe, weil
es zwei Fragen sind: füll mir den Tag, und geht die Reihenfolge besser.

Sortiert wird nach drei Dingen, und ihre Rangfolge ist die eigentliche
Entscheidung.

1. **Alles muss vor Parkschluss drankommen.** Ein Plan mit einer Bahn weniger,
   die wirklich stattfindet, schlägt einen mit einer Bahn mehr, die es nicht
   mehr wird. Und wenn etwas rausfliegt, dann von hinten: zuerst das, was der
   Knopf gerade selbst dazugeholt hat, nie das, was du dir vorher überlegt hast.
2. **Die Summe der Wartezeiten.** Danach war ja gefragt.
3. **Die Uhrzeit, zu der du dich das letzte Mal anstellst.** Wo zwei
   Reihenfolgen gleich viel kosten, gewinnt die, die früher fertig ist.

Einen Regler, der Anstehen gegen Herumstehen abwägt, gibt es bewusst nicht.
Diese Zahl könnte niemand begründen, und die erste Person, die ihr widerspricht,
hätte recht.

Eine Folge daraus mag ich besonders, weil sie niemand einprogrammiert hat: Der
Planer schickt dich manchmal Kaffee trinken. Wenn du jetzt fünfzig Minuten
anstehen müsstest, eine halbe Stunde später aber nur noch fünfzehn, dann kosten
Bummeln und Anstehen zusammen weniger als Anstehen allein. Dieselbe Bahn,
weniger Schlange, und du bist trotzdem früher wieder frei.

Was der Sortierer nicht anfasst: deine Mittagspause, jede Bahn, die du schon
abgehakt hast, und jeden Block, dessen Uhrzeit bereits angefangen hat. Der
letzte Punkt hat uns eine Weile beschäftigt, denn er ist der Unterschied
zwischen „ich sortiere deinen Nachmittag“ und „stell dich bitte hinten wieder
an“. Wer um 14 Uhr auf den Knopf drückt, steht um 14 Uhr in irgendeiner
Schlange, und die verschiebt niemand mehr.

Und weil so ein Knopfdruck aus drei Blöcken elf machen kann, steht neben dem
Ergebnis ein Rückgängig. Einmal, nicht beliebig oft, aber das eine Mal, das man
braucht.

## Was der Planer nicht weiß, sagt er dazu

Am längsten haben wir nicht an den Zahlen gesessen, sondern an den vier
Stellen, an denen der Planer bewusst weniger behauptet, als er könnte.

**Die Prognose liegt daneben, und zwar messbar.** An jedem ausgewählten Block
steht, wie weit die Vorhersagen für diese Bahn im Schnitt von dem entfernt
lagen, was der Tag dann wirklich brachte. „Typisch“ heißt dabei wörtlich das,
was es heißt: Die Hälfte der Tage liegt weiter daneben. Deshalb steht die Zahl
als typischer Fehler da und nie als Spanne, in der die richtige Antwort schon
drin wäre.

**Showzeiten sind zweierlei.** Was der Park für heute veröffentlicht hat, ist
eine Ansage. Was wir vom letzten passenden Wochentag hochgerechnet haben, ist
eine Vermutung, und die wird im Planer weicher gezeichnet: mit Tilde vor der
Uhrzeit, gepunkteter Linie und dem Datum, von dem die Zeiten stammen. Kein
Anbieter der Welt kennt Showzeiten für übernächsten Samstag.

**Manche Parks können wir gar nicht messen.** Der [Hansa-Park](ref:hansa-park)
gibt seine Wartezeiten nur in der eigenen App im Park-WLAN aus. Für uns kommt
dort nie eine Zahl an. Ein Park ohne Quelle sieht in den Daten exakt aus wie ein
Park, der nachts geschlossen ist, deshalb bekommt der Planer diese Auskunft
direkt aus der API und blendet die beiden Sortier-Knöpfe dort komplett aus. Wenn
jede Bahn dieselbe erfundene Zahl kostet, ist jede Reihenfolge gleich gut, und
ein Knopf, der nichts ändert, wäre ein Versprechen.

**Ein vergangener Tag bleibt.** Der Kalender lässt dich einen Tag wieder
öffnen, an dem du etwas geplant hattest, und die automatischen Knöpfe sind dort
weg. Alles von Hand geht weiter: verschieben, abhaken, löschen. Ein gelaufener
Tag ist eine Aufzeichnung, und dass du Taron wirklich um eins gefahren bist, ist
der Grund, warum er überhaupt aufbewahrt wird.

## Er liegt in deinem Browser

Es gibt kein Konto, keine Registrierung und keinen Login. Dein Plan liegt in
deinem Browser, und das ist die Voreinstellung, nicht die Sparversion. Räumst du
die Browserdaten auf, ist er weg. Öffnest du park.fan auf dem Handy, ist es ein
anderer Plan.

Die eine Ausnahme sind Push-Benachrichtigungen. Damit wir dir sagen können, dass
du gleich losmusst, muss der Plan auf unserem Server liegen, und der Planer
schreibt dazu, was das bedeutet: Wer den Link hat, kann ihn lesen und ändern. Es
gibt kein Passwort, das davor liegt. Wer das nicht will, schaltet die
Benachrichtigungen nicht ein und verliert sonst nichts.

Zwei Sachen noch, die man leicht übersieht. Am rechten Bildschirmrand hängt auf
jeder Seite ein Reiter, der den Planer aufmacht, auch wenn noch gar nichts
geplant ist. Und am Rechner kannst du eine zweite Spalte aufmachen, dann stehen
zwei Tage gleichzeitig da. Für diesen einen Satz habe ich das gebaut: „und wie
sähe das am Samstag aus“.

## So fängst du an

Der Weg hinein führt über drei Fragen. In welchen Park geht’s, an welchem Tag,
und wer kommt mit.

Die zweite Frage ist die interessante: Statt einer Liste mit sechzig Zeilen
bekommst du ein Monatsraster, das mit der Auslastungsprognose dieses Parks
eingefärbt ist. „Der übernächste Samstag“ ist damit eine Sache von einem Blick,
und wie voll er vermutlich wird, steht unter dem Raster.

![Schritt zwei des Planer-Assistenten: über dem Monatsraster ein Foto des Phantasialands, die Tage sind nach Auslastungsprognose eingefärbt, Samstag der 19. ist gewählt. | Statt sechzig Zeilen in einer Auswahlliste: ein Monat, eingefärbt danach, wie voll es voraussichtlich wird.](/media/tagesplaner/planer-wizard-de.webp)

Die dritte Frage klingt nach Formular und ist wichtiger, als sie aussieht: Wie
groß ist die kleinste Person, und wollt ihr trocken bleiben? Beides sind
Markierungen an der Bahnenliste und keine Filter. Ein Filter würde den Park
heimlich kürzen, und ob Oma die Taschen hält, weißt nur du.

Danach landest du auf der Parkseite mit offenem Planer, und von dort ziehst du
Bahnen auf die Zeitachse. Auf jeder Attraktionsseite gibt es dafür auch einen
Knopf, wenn Ziehen gerade unpraktisch ist.

Wie ein einzelner Block zu seiner Höhe kommt, was „Aus Tagesprognose“ bedeutet
und wie sich ein Umstieg berechnet, steht mit einer echten, eingefrorenen
API-Antwort zum Ausprobieren auf der [Planer-Seite](/tagesplaner) selbst. Dort
kannst du an einem fertigen Phantasialand-Samstag herumziehen, ohne dass an
deinem eigenen Plan irgendetwas passiert.

Und wenn dir dabei etwas komisch vorkommt, eine Wegzeit, die nicht hinkommt,
oder ein Umstieg, den es in echt nie gegeben hätte: Schreib mir, die
E-Mail-Adresse steht im [Impressum](/impressum). Die Wege sind der Teil, den wir
am schlechtesten messen, und jemand, der gerade dort steht, weiß es besser als
jede Rechnung.

— Patrick
