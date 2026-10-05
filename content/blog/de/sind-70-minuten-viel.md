---
title: 'Wann 70 Minuten Wartezeit viel sind'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
updatedAt: '2026-10-05'
author: patrick
mode: published
excerpt: >-
  Am Eingang von Taron steht eine Zahl, und allein ist sie so viel wert wie eine
  Temperatur ohne Jahreszeit. Erst der Vergleich mit jedem gemessenen Dienstag
  macht daraus eine Auskunft. Warum park.fan nichts wegwirft, was nachts damit
  passiert und warum wir im August keine Schlittschuhe mehr empfehlen.
tags:
  - wartezeiten
  - park-fan
  - phantasialand
  - statistik
  - hinter-den-kulissen
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own on why its page shows no wait times at
  # all. That is exactly the question somebody on that page is asking.
  - phantasialand
  - hansa-park
rideLinks:
  - phantasialand/taron
coverImage:
  src: /media/phantasialand/taron.jpg
  alt: 'Ein Zug von Taron zwischen den Basaltfelsen von Klugheim'
  caption: 'Taron in Klugheim. Die Zahl am Eingang steht auf 70. Und jetzt?'
  credit: 'Patrick Arns'
seo:
  title: 'Wartezeiten richtig lesen: Sind 70 Minuten viel?'
  description: >-
    Eine Wartezeit ohne Vergleich ist wie eine Temperatur ohne Jahreszeit. Was
    „typisch“ und „voll“ bedeuten und wie park.fan daraus eine Auskunft macht.
  keywords:
    - Wartezeiten Freizeitpark
    - Wartezeit einordnen
    - Taron Wartezeit
    - Phantasialand Wartezeiten
    - Perzentil Wartezeit
    - Rope Drop
    - Crowd Kalender
---

Du stehst vor [Taron](ref:phantasialand/taron), auf der Anzeige stehen **70 Minuten**,
und dein Kopf vergleicht die Zahl sofort mit deiner Erinnerung. Beim letzten
Besuch waren es 40, also ist heute schlimmer. Beim vorletzten 90, also ist
heute super. Zwei Besuche sind keine Grundlage, und dein Gedächtnis rundet
ohnehin zu deinen Ungunsten
([warum, steht hier](/blog/die-kunst-des-wartens)).

Die Parks schreiben die Zahl selbst an, sie stimmt meistens ungefähr, und sie
kostet uns einen Abruf alle fünf Minuten. Nur steht sie allein da, wie eine
Temperatur ohne Jahreszeit. 70 Minuten sind an einem Dienstag im Mai
etwas völlig anderes als an einem Samstag in den Sommerferien, und ohne den
zweiten Teil dieses Satzes kannst du nichts damit anfangen.

## Was „typisch“ und „voll“ wirklich heißen

park.fan legt neben jede große Bahn eines Parks zwei Vergleichswerte, gerechnet
über die letzten 365 Tage. **Typisch** ist der Median der Tagesspitzen: An der
Hälfte aller gemessenen Tage war die längste Warteschlange kürzer als dieser Wert, an
der anderen Hälfte länger. **Voll** ist das 90. Perzentil derselben Reihe, also
ungefähr der eine Tag von zehn, an dem richtig was los war. Auf der Seite der
Bahn stehen beide für den heutigen Wochentag, darunter die ganze Woche Tag für
Tag.

Beides sind Perzentile und keine Durchschnitte. Ein Mittelwert lässt sich von einem einzigen Ausnahmetag verschieben: Ein Nachmittag
mit Betriebsstörung und 150 Minuten Rückstau zieht den Schnitt eines ganzen
Monats nach oben, obwohl an 29 Tagen nichts davon zu spüren war. Der Median
zuckt bei so einem Tag nicht einmal. Der Rekord steht deshalb extra, mit Datum,
damit man ihn sieht, ohne dass er die anderen beiden Zahlen anfasst.

Für das [Phantasialand](ref:phantasialand) sieht die Rangliste so aus. Am
wichtigsten ist die Spalte mit den Messtagen, denn je mehr Tage dort stehen,
desto mehr Gewicht trägt eine Zeile.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Was hier steht, ist live. Wenn du diesen Artikel in drei Monaten noch einmal
liest, stehen andere Zahlen in der Tabelle, und der Text drumherum stimmt
trotzdem noch. Die Widgets gibt es, weil in vier älteren Artikeln die Zahlen
mal von Hand getippt in Markdown-Tabellen standen, über sechs Sprachen
verteilt, und nach ein paar Wochen still auseinanderliefen, wie die Uhren in
einer Ferienwohnung.

## Dieselben 70 Minuten am Samstag und am Dienstag

Für Taron stehen „typisch“ und „voll“ auf der Seite der Bahn für jeden Wochentag einzeln, und die
Wochenenden heben sich deutlich ab. Samstag und Sonntag haben die höheren Werte, der Dienstag hat den niedrigsten. Dieselben 70 Minuten sind deshalb an einem Samstag ein gewöhnlicher
Tag an dieser Bahn. An einem Dienstag liegen sie deutlich über dem, was dort normal ist.

Die Monate verschieben die Zahl noch einmal. Über den ganzen Park gerechnet, nicht nur für Taron, sind Juli und August die vollen Monate, und der Dezember lag an den wenigen Tagen, die wir dort gemessen haben, ähnlich hoch. Der September ist der ruhigste Monat, den wir gemessen haben. Für den Oktober gibt es bisher nur ein paar Tage, weil unsere Reihe erst im Dezember 2025 begonnen hat und der Oktober 2026 gerade erst angefangen hat.

```stats-widget slug=phantasialand show=months

```

Am Eingang steht nichts davon, nur die eine Zahl. Auf der Seite der Bahn stehen beide Werte für
heute, und darunter die Woche Tag für Tag, sodass du die 70 Minuten selbst einordnen kannst.

## Der Tag hat eine Form

Eine Bahn hat nicht den ganzen Tag dieselbe Warteschlange. Die Grundbewegung kennt
jeder: Zur Öffnung ist es kurz, dann ist der Rest der Welt mit dem Frühstück
fertig, und gegen Abend wird es wieder erträglich. Wo genau der Höchststand liegt, ist pro Bahn verschieden, und
diese Abweichungen sind der nützliche Teil.

```hourly-profile-widget slug=phantasialand top=6

```

Aus dieser Form entstehen zwei Empfehlungen. Die erste ist **Rope Drop**:
direkt zur Öffnung an eine bestimmte Bahn, bevor sich die Wege füllen. Wir
schlagen das nur vor, wenn die Tagesspitze an einem gewöhnlichen Tag der letzten
70 Tage mindestens 60 Minuten erreicht und der frühe Start davon mindestens 45
spart. Alles darunter wäre ein Tipp, der
überall stünde und deshalb nirgends etwas wert wäre.

Die zweite ist die ruhigere Alternative: die Uhrzeit, zu der die Warteschlange an
dieser Bahn typischerweise am kürzesten ist. Liegt sie am Abend, muss man dafür
nicht um sieben aufstehen. Beide Angaben stehen auf der Seite jeder großen Bahn,
für die genug Messtage da sind, mit konkreter Uhrzeit in Parkzeit.

## Das meiste entscheidet sich vor der Abreise

Die Uhrzeit spart dir an einer Bahn, für die wir Rope Drop vorschlagen,
mindestens eine Dreiviertelstunde. Das Datum entscheidet über den ganzen Tag. In
den NRW-Sommerferien 2026 stand im Phantasialand Dienstag, der 18. August, im
Kalender auf „normal“, der Donnerstag derselben Woche auf „sehr hoch“ (Stand
September 2026), und einem gewöhnlichen Kalender sieht man das nicht an. Der Unterschied hängt
daran, welche Bundesländer gerade frei haben, ob ein Brückentag dranhängt,
ob es regnet und ob im Nachbarland etwas los ist.

Ein Park nahe der Grenze merkt sofort, wenn nebenan die Ferien anfangen,
meistens schon an den Kennzeichen auf dem Parkplatz. Also rechnen wir Regionen im Umkreis von rund
200 Kilometern mit ein und markieren sie im Kalender getrennt. Drei Parks im
Vergleich, jeweils mit ihrem ruhigsten Wochentag:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Steht in der letzten Spalte ein Strich, hebt sich an diesem Park kein Wochentag
verlässlich ab, oder die Wochentage sind zu ungleich gemessen, um sie zu
vergleichen. Stehen dort zwei Tage, sind beide gleich ruhig. Dieselbe Tabelle mit
viel mehr Parks steht auf der [Beste-Reisezeit-Seite](/beste-reisezeit).

## Wofür man eine Nachtschicht braucht

Eine Live-Wartezeit anzuzeigen, ist ein Abruf. Ein Median über jeden gemessenen
Dienstag muss dagegen fertig sein, bevor jemand danach fragt.
Also läuft jede Nacht eine Kette von Jobs, und ihre Reihenfolge ist
festgelegt, weil jeder Schritt auf dem vorigen sitzt. Um 02:00 UTC die
Perzentile pro Stunde, um 03:00 die Basiswerte pro Park, um 04:30 die
Zusammenfassung von gestern, um 05:15 die Rope-Drop-Empfehlungen, die genau
diese Zusammenfassung lesen, um 05:30 „typisch“ und „voll“ für die großen Bahnen.
Um 06:00 trainiert sich das Prognosemodell mit
den Wartezeiten des Vortags neu, während die Rope-Drop-Fraktion schon auf der
Autobahn steht.

Außerdem werfen wir keine Messung weg. Ältere Zeiträume
werden komprimiert, aber nicht ausgedünnt. Wie weit eine Auswertung
zurückreicht, legen wir für jede einzeln fest. Für „typisch“ und „voll“ nehmen
wir die letzten 365 Tage, also einen ganzen Jahreslauf, für die Rope-Drop-Empfehlung
nur die letzten 70, damit sie der Saison folgt. Wer im dritten Jahr anfängt zu
speichern, hat im dritten Jahr ein Jahr Historie, und die beiden Jahre davor
sind für immer weg. Unsere Messreihe beginnt am 26. Dezember 2025, und ab da
zählt die Spalte mit den Messtagen in der Tabelle oben.

## Wo wir lieber gar nichts sagen

Der [Hansa-Park](ref:hansa-park) zum Beispiel gibt seine Wartezeiten nur in der
eigenen App aus, und nur für Geräte im Park-WLAN. Es gibt keine öffentliche Schnittstelle. In den
Rohdaten sieht dieser Park aus wie jeder andere um drei Uhr nachts: keine Bahn
meldet etwas. Würden wir daraus das Naheliegende ableiten, stünden dort sämtliche
Attraktionen des Parks auf „sehr niedrig“, dazu ein Ø von 0 Minuten und eine Prognose,
die auf null Beobachtungen beruht, und jede dieser Angaben wäre erfunden. Stattdessen steht auf der Parkseite ein
Hinweis, dass es hier nichts zu lesen gibt. Was wir über den Park trotzdem
sagen können, steht im [Hansa-Park-Guide](/blog/hansa-park-tipps).

Dieselbe Regel gilt an einer kleineren Stelle. Die Eisbahn „Berliner Eislaufen“ auf
dem Kaiserplatz im Phantasialand gibt es nur zum Wintertraum, diesmal vom 14.
November 2026 bis zum 24. Januar 2027. Im August meldet über sie niemand
etwas, weil es nichts zu melden gibt. Diese Stille als „geöffnet“ zu lesen,
wäre der bequeme Fehler, und er stand tatsächlich mal so auf der Parkseite:
Schlittschuhe im Hochsommer, mit unserem Segen.
Betriebsmonate, die wir aus den eigenen Messungen ablesen, nennen wir
überhaupt erst nach 330 Beobachtungstagen, und so lange steht bei ihr kein
Monat. Ein „läuft von Dezember bis April“ würde bis dahin nur den Zeitraum
beschreiben, in dem wir zufällig schon gemessen haben.

## Was du mit 70 Minuten anfangen kannst

Liegt die Zahl am Eingang auf oder unter dem typischen Wert für diesen Wochentag, stelle ich mich an. Liegt sie deutlich darüber, lohnt der Blick auf die Stundenkurve weiter oben.
Steht dort für den späten Nachmittag oder den Abend ein niedrigerer Wert, fährst du erst etwas
anderes und kommst wieder. An Taron steht auf der Seite der Bahn neben der Empfehlung für die
Öffnung auch eine für das Ende des Tages, weil die Warteschlange dort kurz vor Schluss nach unseren
Messungen wieder deutlich kürzer wird.

Wer die Zeit lieber kauft, zahlt an Taron für eine Fahrt mit dem Quick Pass 12 €, so steht es auf
der Infoseite des Phantasialands (Stand 5. Oktober 2026). Den Pass gibt es nur vor Ort am
Gästeservice am Kaiserplatz, und die Menge ist begrenzt. Bei einer Zahl, die für den Wochentag
ohnehin normal ist, rechnet sich das selten. Wie wir das sehen und wann sich der Quick Pass
Ultimate lohnt, steht im [Phantasialand-Guide](/blog/phantasialand-tipps).

Für einen ganzen Tag gibt es den [Tagesplaner](/blog/tagesplaner). Dort wählst du deine Bahnen aus und bekommst eine Reihenfolge nach den vorhergesagten Wartezeiten des Tages. Ob alle vor Parkschluss drankommen, siehst du dann schon vor der Abfahrt und nicht erst um fünf am Nachmittag vor der letzten Warteschlange.

## Wo das alles steht

Die lange Fassung, mit denselben Karten wie auf den Parkseiten zum Mitlesen, ist jetzt eine eigene
Seite: [So funktioniert park.fan](/de/so-funktioniert-park-fan). Dort steht
Kapitel für Kapitel, was auf einer Attraktionskarte zu sehen ist, wie die
Skala unter „typisch“ und „voll“ funktioniert, wie die Ferien in den Kalender
eingehen, wie daraus im Tagesplaner ein Tag wird und an welchen drei
Stellen wir bewusst nichts behaupten. Vier konkrete Besuchssituationen sind auch
dabei, von der Familie in den Herbstferien über den spontanen Abend mit
Jahreskarte bis zum ersten Besuch in einem großen Park.

Und wenn du das nächste Mal am Eingang stehst und auf die Anzeige starrst,
schau nach, was an dieser Bahn an einem Dienstag normal ist.

— Patrick
