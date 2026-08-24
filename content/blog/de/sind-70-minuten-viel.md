---
title: 'Sind 70 Minuten viel? Kommt auf den Wochentag an'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
author: patrick
mode: published
excerpt: >-
  Am Eingang von Taron hängt eine Zahl, und sie sagt für sich genommen fast
  nichts. Erst der Vergleich mit jedem gemessenen Dienstag macht daraus eine
  Auskunft. Warum park.fan Wartezeiten archiviert, was nachts damit passiert
  und wo wir lieber gar nichts sagen.
tags:
  - wartezeiten
  - park-fan
  - phantasialand
  - statistik
  - hinter-den-kulissen
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own — why its page shows no wait times at
  # all — which is exactly the question somebody on that page is asking.
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
    Warum eine Wartezeit ohne Vergleichswert nichts aussagt, was „typisch" und
    „voll" bei einer Attraktion bedeuten und wie park.fan aus Millionen
    Messwerten eine Auskunft macht.
  keywords:
    - Wartezeiten Freizeitpark
    - Wartezeit einordnen
    - Taron Wartezeit
    - Phantasialand Wartezeiten
    - Perzentil Wartezeit
    - Rope Drop
    - Crowd Kalender
---

Du stehst vor [Taron](ref:phantasialand/taron), die Anzeige sagt **70 Minuten**, und dein Kopf macht
sofort das Falsche: Er vergleicht die Zahl mit deiner Erinnerung. Beim letzten
Besuch waren es 40, also ist heute schlimmer. Beim vorletzten 90, also ist
heute super. Zwei Besuche sind keine Grundlage, und dein Gedächtnis rundet
ohnehin zu deinen Ungunsten
([warum, steht hier](/blog/die-kunst-des-wartens)).

Die Zahl selbst ist nicht das Problem. Die Parks schreiben sie an, sie stimmt
meistens ungefähr, und sie kostet uns einen Abruf alle fünf Minuten. Das
Problem ist, dass sie allein steht. 70 Minuten sind an einem Dienstag im Mai
etwas völlig anderes als an einem Samstag in den Sommerferien, und ohne den
zweiten Teil dieses Satzes kannst du nichts damit anfangen.

## Was „typisch" und „voll" wirklich heißen

park.fan legt neben jede Bahn zwei Vergleichswerte. **Typisch** ist der Median
der Tagesspitzen: An der Hälfte aller gemessenen Tage war die längste Schlange
kürzer als dieser Wert, an der anderen Hälfte länger. **Voll** ist das 90. Perzentil derselben Reihe, also ungefähr der eine Tag von zehn, an dem
richtig was los war.

Beides sind Perzentile und keine Durchschnitte, und das ist kein Detail. Ein
Mittelwert lässt sich von einem einzigen Ausnahmetag verschieben: Ein Nachmittag
mit Betriebsstörung und 150 Minuten Rückstau zieht den Schnitt eines ganzen
Monats nach oben, obwohl an 29 Tagen nichts davon zu spüren war. Der Median
zuckt bei so einem Tag nicht. Der Rekord steht deshalb separat daneben, mit
Datum, damit man ihn sieht, ohne dass er die anderen beiden Zahlen anfasst.

Für [Phantasialand](ref:phantasialand) sieht die Rangliste so aus. Die Spalte mit den Messtagen ist
die wichtigste: Sie sagt, wie viel Gewicht eine Zeile trägt.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Was hier steht, ist live. Wenn du diesen Artikel in drei Monaten noch einmal
liest, stehen andere Zahlen in der Tabelle, und der Text drumherum stimmt
trotzdem noch. Genau dafür gibt es diese Widgets: In vier älteren Artikeln
standen die Zahlen mal von Hand getippt in Markdown-Tabellen, über sechs
Sprachen verteilt, und sie sind nach ein paar Wochen still auseinandergelaufen.

## Der Tag hat eine Form

Eine Bahn hat nicht den ganzen Tag dieselbe Schlange. Die Grundbewegung kennt
jeder: Zur Öffnung ist es kurz, danach zieht es an, gegen Abend wird es wieder
erträglich. Wo genau der Höchststand liegt, ist pro Bahn verschieden, und
diese Abweichungen sind der nützliche Teil.

```hourly-profile-widget slug=phantasialand top=6

```

Aus dieser Form entstehen zwei Empfehlungen. Die erste ist **Rope Drop**:
direkt zur Öffnung an eine bestimmte Bahn, bevor sich die Wege füllen. Wir
schlagen das nur vor, wenn die Tagesspitze mindestens 60 Minuten erreicht und
der frühe Start davon mindestens 45 spart. Alles darunter wäre ein Tipp, der
überall stünde und deshalb nirgends etwas wert wäre.

Die zweite ist die ruhigere Alternative am Abend. Bei den großen Coastern ist
die letzte Stunde vor Schluss oft genauso gut wie die erste nach der Öffnung,
nur muss man dafür nicht um sieben aufstehen. Beide Angaben stehen auf der
Seite jeder Bahn, mit konkreter Uhrzeit in Parkzeit.

## Das meiste entscheidet sich vor der Abreise

Die Uhrzeit rettet dir eine halbe Stunde. Das Datum rettet dir den Tag. Zwischen
zwei Tagen derselben Ferienwoche kann eine halbe Stunde Durchschnittswartezeit
liegen, und einem gewöhnlichen Kalender sieht man das nicht an. Was den
Unterschied macht: welche Bundesländer gerade frei haben, ob ein Brückentag
dranhängt, ob es regnet, und ob im Nachbarland etwas los ist.

Der letzte Punkt wird gern unterschätzt. Ein Park nahe der Grenze merkt sofort,
wenn nebenan die Ferien anfangen, also rechnen wir Regionen im Umkreis von rund
200 Kilometern mit ein und markieren sie im Kalender getrennt. Drei Parks im
Vergleich, jeweils mit ihrem ruhigsten Wochentag:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Fällt eine Zelle in der letzten Spalte leer aus, ist das keine Lücke, sondern
ein Ergebnis. Es heißt, dass dieser Park keinen Wochentag hat, der sich
verlässlich von den anderen abhebt.

## Wofür man eine Nachtschicht braucht

Eine Live-Wartezeit anzuzeigen, ist ein Abruf. Ein Median über jeden gemessenen
Dienstag ist etwas anderes: Der muss fertig sein, bevor jemand danach fragt.
Also läuft jede Nacht eine Kette von Jobs, und ihre Reihenfolge ist
festgelegt, weil jeder Schritt auf dem vorigen sitzt. Um 02:00 UTC die
Perzentile pro Stunde, um 03:00 die Basiswerte pro Park, um 04:30 die
Zusammenfassung von gestern, um 05:15 die Rope-Drop-Empfehlungen, die genau
diese Zusammenfassung lesen. Um 06:00 trainiert sich das Prognosemodell mit
den Wartezeiten des Vortags neu.

Dazu kommt die andere Hälfte: Wir werfen nichts weg. Ältere Zeiträume werden
komprimiert, aber jede Auswertung läuft weiterhin über alle Messwerte, die je
angekommen sind. Ein Archiv, das man nachträglich anlegen will, ist genau das
eine, was man nicht nachträglich anlegen kann.

## Und die Stellen, an denen wir nichts sagen

Eine Seite voller gefüllter Felder ist leicht zu bauen. Interessant wird sie
erst, wenn man den gefüllten Feldern trauen kann, und dafür müssen ein paar
Felder leer bleiben dürfen.

[Hansa-Park](ref:hansa-park) zum Beispiel gibt seine Wartezeiten nur in der eigenen App aus, und
nur für Geräte im Park-WLAN. Es gibt keine öffentliche Schnittstelle. In den
Rohdaten sieht dieser Park aus wie jeder andere um drei Uhr nachts: keine Bahn
meldet etwas. Würden wir daraus das Naheliegende ableiten, stünden dort 82
Attraktionen auf „sehr niedrig", dazu ein Ø von 0 Minuten und eine Prognose,
die auf null Beobachtungen beruht. Stattdessen steht auf der Parkseite ein
Hinweis, dass es hier nichts zu lesen gibt.

Dieselbe Regel an einer kleineren Stelle: Der Schlittschuhverleih im
Phantasialand läuft von November bis Januar. Im August meldet über ihn niemand
etwas, weil es nichts zu melden gibt. Diese Stille als „geöffnet" zu lesen,
wäre der bequeme Fehler, und er stand tatsächlich mal so auf der Parkseite.
Und Betriebsmonate einer Bahn nennen wir überhaupt erst nach 330
Beobachtungstagen: Vorher wäre „läuft von Dezember bis April" keine Saison,
sondern eine Beschreibung des Zeitraums, in dem wir zufällig schon gemessen
haben.

## Wo das alles steht

Die lange Fassung, mit den echten Karten zum Mitlesen, ist jetzt eine eigene
Seite: [So funktioniert park.fan](/de/so-funktioniert-park-fan). Dort steht
Kapitel für Kapitel, was auf einer Attraktionskarte zu sehen ist, wie die
Skala unter „typisch" und „voll" funktioniert, wie der Kalender die Ferien
verrechnet und an welchen drei Stellen wir bewusst nichts behaupten. Vier
konkrete Besuchssituationen sind auch dabei, von der Familie in den
Herbstferien bis zum Jahreskarten-Abend um sieben.

Und wenn du das nächste Mal am Eingang stehst und auf die Anzeige starrst:
Schau nach, was an dieser Bahn an einem Dienstag normal ist. Dann weißt du in
zehn Sekunden, ob du dich gerade ärgern musst oder ob heute einfach Dienstag
ist.

— Patrick
