---
title: 'Single Rider: In welchen Freizeitparks du allein schneller auf die Bahn kommst'
translationKey: single-rider-guide
date: '2026-10-08'
author: patrick
mode: published
featured: false
excerpt: >-
  In 18 der 203 Parks, für die wir Wartezeiten messen, führt unsere API mindestens
  eine Bahn mit Single-Rider-Warteschlange, zusammen 66 Bahnen. Wer allein fährt
  oder sich vom Rest der Gruppe trennen lässt, füllt leere Sitze und steht meist
  kürzer an. Für Familien mit kleinen Kindern lohnt sich das nicht.
tags:
  - single-rider
  - wartezeiten
  - warteschlangen
  - tipps
  - freizeitpark
  - europa-park
  - efteling
  - disney
  - universal
category: guides
coverImage:
  src: /media/europa-park/voltron-nevera-powered-by-rimac.jpg
  alt: 'Ein Zug von Voltron Nevera fährt kopfüber durch eine Inversion, pink und blau angeleuchtet.'
  caption: 'Voltron Nevera im Europa-Park hat einen eigenen Single-Rider-Eingang.'
  credit: 'Patrick Arns'
seo:
  title: 'Single Rider im Freizeitpark: Welche Bahnen, für wen'
  description: >-
    Welche Bahnen in 18 Freizeitparks eine Single-Rider-Warteschlange haben,
    wie sie funktioniert und wann sie sich nicht lohnt.
  keywords:
    - Single Rider Freizeitpark
    - Single Rider Europa-Park
    - Single Rider Efteling
    - Einzelfahrer Freizeitpark
    - Single Rider Disney
    - Single Rider Universal Orlando
    - Single Rider Warteschlange
    - Wartezeit sparen Freizeitpark
---

Single Rider heißt: Du stellst dich in eine eigene Warteschlange und nimmst einen Sitz, der im
Fahrzeug übrig bleibt, neben Fremden. Dafür wartest du meist weniger als in der normalen
Warteschlange. Das Efteling beschreibt auf seiner Seite, dass die Single Riders die leeren Plätze
füllen, die in den Fahrzeugen entstehen.

Unsere API führt diese Warteschlange als eigenen Typ, `SINGLE_RIDER`, und kennt 66 Bahnen in 18
Parks, an denen es sie gibt. Dieser Beitrag zählt auf, welche das sind, was die Parks selbst über die
Regeln schreiben und für wen sich der Weg über den Single-Rider-Eingang lohnt. Wie viel Zeit er
spart, können wir nur zum Teil beantworten, die Gründe stehen weiter unten.

## Wie ein Single-Rider-Eingang funktioniert

Ein Zug hat feste Sitzgruppen, und nicht jede Gruppe in der normalen Warteschlange füllt sie. Wo ein
Platz frei bleibt, setzt der Park einen Einzelnen aus der Single-Rider-Warteschlange hinein. Die
Bahn fährt voller, und die Gruppen in der normalen Warteschlange verlieren nichts, weil niemand aus
ihrer Reihe vorgezogen wird. Das Efteling schreibt, das verkürze die Wartezeit für Gruppen und
Einzelne.

Daraus folgt, was du erwarten kannst. Die Single-Rider-Warteschlange wird nur so schnell abgebaut,
wie Lücken entstehen. Auf dem Papier ist sie kürzer, ob sie es in deiner Stunde ist, hängt von den
Lücken ab, die die Gruppen vor dir lassen. Das Efteling schreibt dazu: Einzelne warten meist weniger,
aber wie viel, hängt von der Besucherzahl und den freien Plätzen ab.

Drei Regeln finden sich bei jedem Park, dessen Seite wir lesen konnten:

1. **Du suchst deinen Sitz nicht aus.** Das Efteling weist einen Platz zu, gemeinsam mit anderen
   Besuchern. Walt Disney World garantiert weder sofortiges Einsteigen noch die Wahl des Sitzes.
2. **Die Einstiegsvoraussetzungen gelten wie überall.** Walt Disney World und das Disneyland Resort
   schreiben, dass Single Riders alle Voraussetzungen der Bahn erfüllen müssen. Das Efteling lässt
   Kinder allein in den Single-Rider-Eingang, wenn sie Größe und weitere Voraussetzungen der Bahn
   erfüllen.
3. **Die Warteschlange kann geschlossen sein.** Das Efteling nennt es ausdrücklich: An ruhigen Tagen
   bleibt sie unter Umständen zu. Walt Disney World schreibt, der Service hänge von der Verfügbarkeit
   ab.

```glossary-widget slug=single-rider

```

## Für wen es sich lohnt, und wann nicht

Der Single-Rider-Eingang lohnt sich in drei Fällen: Du bist allein im Park, deine Gruppe lässt sich
trennen, oder du willst eine einzelne Bahn unbedingt haben und die normale Wartezeit ist dir zu lang.
Im zweiten Fall teilt ihr euch auf, fahrt einzeln und trefft euch am Ausstieg.

Es lohnt sich nicht in diesen Fällen:

- **Du fährst mit einem Kind, das eine Begleitung braucht.** Bei Eurosat im Europa-Park nennt die Seite
  des Parks 120 bis 195 Zentimeter, unter 130 Zentimetern nur in Begleitung eines Erwachsenen. Wer das
  Kind neben sich braucht, kann nicht getrennt einsteigen.
- **Ihr wollt gemeinsam fahren.** Das Efteling erlaubt Gruppen den Single-Rider-Eingang, aber sie
  fahren nacheinander. Nur wenn zufällig mehrere Plätze frei sind, sitzen Personen aus der
  Single-Rider-Warteschlange nebeneinander.
- **Die Bahn erzählt etwas, das ihr gemeinsam erleben wollt.** Bei Symbolica im Efteling kannst du als
  Single Rider nicht wählen, welche der drei Palastführungen du bekommst.
- **Du hast einen Zeitslot.** Wer im Europa-Park über die Virtual Line für die eine Bahn reserviert
  hat, darf bis zum Zeitfenster woanders anstehen. Für diese Bahn braucht er den Single-Rider-Eingang
  dann nicht.
- **Die normale Warteschlange ist ohnehin kurz.** Dann entfällt der Vorteil, und die Gruppe ist
  grundlos getrennt.

## Was unsere Daten über die Warteschlange wissen

Es gibt zwei Fragen, und unsere Daten beantworten nur eine davon gut.

**Hat die Bahn eine Single-Rider-Warteschlange?** Das steht pro Bahn im Feld `hasSingleRider`, einer
festen Angabe. Auf der Seite der Attraktion zeigt park.fan dafür ein „Single Rider“-Zeichen. Der Wert
`null` heißt „unbekannt“ und nie „nein“. Ein fehlendes Zeichen sagt deshalb nichts darüber, ob es die
Warteschlange gibt.

**Wie lang ist sie gerade?** Hier fehlt oft die Zahl. Wir haben am 8. Oktober 2026 die Live-Daten aller
18 Parks abgerufen. Darin standen 41 Single-Rider-Warteschlangen, 19 davon geöffnet, in sieben Parks.
Keine einzige der 41 trug eine Wartezeit. Die Parks melden uns, dass die Warteschlange offen ist,
aber nicht, wie lang sie ist. Auf der Attraktionsseite zeigt park.fan dann „Single Rider“ ohne Zeit,
und die Tabellen in diesem Beitrag zeigen die normale Warteschlange.

Wie viel Zeit der Eingang spart, lässt sich aus unseren Daten deshalb zurzeit nicht ausrechnen.
Belegt ist nur die Aussage des Efteling, dass Einzelne meist weniger warten. Das Ergebnis einer
eigenen Messung nennen wir nicht, solange es sie nicht gibt.

## Park für Park: wie viele Bahnen wir kennen

In der Tabelle steht, wie viele Bahnen je Park das Merkmal tragen, wie viele Attraktionen der Park in
unserer Datenbank hat und bei wie vielen die Angabe fehlt. Stand ist der 8. Oktober 2026.

| Park                           | Bahnen mit Single Rider | Attraktionen | Angabe unbekannt |
| ------------------------------ | ----------------------- | ------------ | ---------------- |
| Efteling                       | 7                       | 37           | 30               |
| Disney Adventure World         | 7                       | 14           | 7                |
| Europa-Park                    | 6                       | 97           | 1                |
| Universal Epic Universe        | 6                       | 14           | 8                |
| Universal Islands of Adventure | 5                       | 25           | 20               |
| PortAventura Park              | 4                       | 51           | 45               |
| Alton Towers                   | 4                       | 55           | 48               |
| Disney California Adventure    | 4                       | 29           | 25               |
| Disney’s Hollywood Studios     | 3                       | 11           | 8                |
| Universal Studios Florida      | 3                       | 44           | 41               |
| Phantasialand                  | 3                       | 40           | 0                |
| Hong Kong Disneyland           | 3                       | 47           | 44               |
| Disneyland Park (Anaheim)      | 2                       | 56           | 54               |
| Disneyland Park (Paris)        | 2                       | 43           | 41               |
| Shanghai Disneyland            | 2                       | 37           | 35               |
| EPCOT                          | 2                       | 34           | 32               |
| Thorpe Park                    | 2                       | 45           | 38               |
| Disney’s Animal Kingdom        | 1                       | 17           | 16               |

Zwei Parks stechen heraus. Im Europa-Park und im Phantasialand ist die Angabe für fast jede
Attraktion eingetragen, bei einer und bei null fehlt sie. Dort heißt „nicht in der Liste“ also
tatsächlich „keine Single-Rider-Warteschlange“. Überall sonst ist die Liste eine Untergrenze: Im
Disneyland Park in Paris fehlt die Angabe bei 41 von 43 Attraktionen, im Disneyland Park in Anaheim
bei 54 von 56.

Die übrigen 185 der 203 Parks haben keine einzige Bahn mit dem Merkmal. Ob das ein „nein“ oder eine
Lücke ist, wissen wir dort nicht.

## Europa-Park

Im [Europa-Park](ref:europa-park) tragen sechs Bahnen das Merkmal: ARTHUR im Themenbereich Minimoys
Kingdom, WODAN – Timburcoaster und blue fire Megacoaster in Island, Eurosat – CanCan Coaster in
Frankreich, das Voletarium in Deutschland und Voltron Nevera powered by Rimac in Kroatien.

Zwei davon bestätigt der Park selbst. Auf der Seite von
[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac) steht unter den Merkmalen Single
Rider als besondere Warteschlange für Einzelpersonen, ebenso auf der Seite von
[Eurosat – CanCan Coaster](ref:europa-park/eurosat-cancan-coaster). Voltron Nevera lässt Fahrgäste ab
130 Zentimetern mit, ein Zug fasst 16 Personen. Bei Eurosat liegt die Grenze bei 120 bis 195
Zentimetern und bei sechs Jahren, unter acht Jahren fährt nur mit, wer einen Erwachsenen dabeihat.

Alle sechs Bahnen haben eine Mindestgröße von 120 oder 130 Zentimetern, nach den Angaben in unserer
Datenbank. Der Single-Rider-Eingang hilft also vor allem Jugendlichen und Erwachsenen, die allein oder
in einer Gruppe ohne kleine Kinder unterwegs sind. Wie sich der Tag im Park sinnvoll legen lässt,
steht im [Europa-Park-Guide](/blog/europa-park-wartezeiten-tipps).

```ride-waits-widget rides=europa-park/voltron-nevera-powered-by-rimac|Voltron Nevera;europa-park/blue-fire-megacoaster|blue fire;europa-park/wodan-timburcoaster|WODAN;europa-park/eurosat-cancan-coaster|Eurosat;europa-park/voletarium|Voletarium;europa-park/arthur|ARTHUR columns=land,peak

```

In der Tabelle steht die normale Warteschlange, geordnet wie die Bahnen oben. Wann sie sich füllt,
steht in der Verteilung über den Tag:

```hourly-profile-widget slug=europa-park top=6

```

## Efteling

Das [Efteling](ref:efteling) hat die vollständigste offizielle Beschreibung, die wir gefunden haben.
Die Seite zum Single-Rider-Eingang nennt sechs Bahnen: Danse Macabre, Joris en de Draak, Symbolica,
Baron 1898, Max & Moritz und Python. Jede hat zwei Warteschlangen, eine für Gruppen und Familien, eine
für Einzelne. Unsere Daten führen zusätzlich De Vliegende Hollander, den die Seite des Parks nicht
aufzählt.

Die Seite erklärt auch, was dem Single Rider fehlt: den Sitzplatz zu wählen, und bei Symbolica die
Wahl einer der drei Palastführungen. Gruppen dürfen den Eingang nutzen, fahren aber nacheinander, und
Kinder dürfen allein hinein, wenn sie die Voraussetzungen der Bahn erfüllen. Die Voraussetzungen
nennt die Seite nicht, sie unterscheiden sich je Attraktion. Nach den Angaben in unserer Datenbank
liegt die Mindestgröße bei Max & Moritz bei 90 Zentimetern, bei Joris en de Draak bei 110, bei Python,
De Vliegende Hollander und Danse Macabre bei 120 und bei Baron 1898 bei 132. Symbolica hat keine
Angabe.

![Python bei Nacht, violett angeleuchtet|Python im Efteling, eine der Bahnen mit Single-Rider-Eingang.|wide](/media/efteling/python.jpg)

```ride-waits-widget rides=efteling/baron-1898|Baron 1898;efteling/python|Python;efteling/joris-en-de-draak|Joris en de Draak;efteling/symbolica|Symbolica;efteling/danse-macabre|Danse Macabre;efteling/max-and-moritz|Max & Moritz;efteling/de-vliegende-hollander|De Vliegende Hollander columns=land,peak

```

## Phantasialand

Im [Phantasialand](ref:phantasialand) tragen drei Bahnen das Merkmal: [Taron](ref:phantasialand/taron) und
[Raik](ref:phantasialand/raik) im Themenbereich Mystery und
[Chiapas – DIE Wasserbahn](ref:phantasialand/chiapas-die-wasserbahn) in Mexico. Eine Seite des Parks,
die das bestätigt, konnten wir nicht abrufen.

Das Phantasialand ist neben dem Europa-Park der Park, in dem die Angabe für jede Attraktion
eingetragen ist: Bei 40 Attraktionen fehlt sie bei keiner. Die drei Bahnen sind damit die vollständige
Liste. Die Mindestgröße liegt bei Taron bei 140 Zentimetern, bei Chiapas bei 130 und bei Raik
bei 120.

```ride-waits-widget rides=phantasialand/taron|Taron;phantasialand/raik|Raik;phantasialand/chiapas-die-wasserbahn|Chiapas columns=land,peak

```

## Disneyland Paris

Der Resort hat zwei Parks, und die Bahnen mit Single-Rider-Eingang verteilen sich ungleich. In
[Disney Adventure World](ref:disney-adventure-world) sind es sieben: Spider-Man W.E.B. Adventure
und Avengers Assemble: Flight Force im Marvel Avengers Campus, Frozen Ever After in der World of
Frozen, Ratatouille: L’Aventure Totalement Toquée de Rémy im Toon Studio, dazu im Toon Studio
Crush’s Coaster, RC Racer und Toy Soldiers Parachute Drop. Das sind sieben von 14 Attraktionen, der
höchste Anteil unter allen Parks in der Tabelle.

Im [Disneyland Park](ref:/parks/europe/france/paris/disneyland-park) sind es zwei: Star Wars
Hyperspace Mountain in Discoveryland und Indiana Jones and the Temple of Peril in Adventureland.
Eine Seite von Disneyland Paris zum Single-Rider-Service konnten wir nicht abrufen.

```ride-waits-widget rides=disney-adventure-world/frozen-ever-after|Frozen Ever After;disney-adventure-world/spider-man-web-adventure|Spider-Man W.E.B. Adventure;disney-adventure-world/crushs-coaster|Crush’s Coaster;disney-adventure-world/rc-racer|RC Racer;/parks/europe/france/paris/disneyland-park/star-wars-hyperspace-mountain|Star Wars Hyperspace Mountain;/parks/europe/france/paris/disneyland-park/indiana-jones-and-the-temple-of-peril|Indiana Jones and the Temple of Peril columns=park,peak

```

## Alton Towers und Thorpe Park

In [Alton Towers](ref:alton-towers) sind es vier Bahnen im Bereich Thrills: TH13TEEN, Spinball
Whizzer, The Smiler und Galactica. Im [Thorpe Park](ref:thorpe-park) sind es zwei, beide im Bereich
Coasters: SAW – The Ride und Hyperia. Bei beiden Parks fehlt für die meisten Bahnen
die Angabe, in Alton Towers fehlt sie bei 48 von 55 Attraktionen, im Thorpe Park bei 38 von 45.
Die Mindestgröße liegt bei TH13TEEN und Spinball Whizzer bei 120 Zentimetern, bei Hyperia bei 130
und bei The Smiler, Galactica und SAW bei 140. Eine Seite der Parks, die die Liste bestätigt, haben
wir nicht gelesen.

```ride-waits-widget rides=alton-towers/the-smiler|The Smiler;alton-towers/galactica|Galactica;alton-towers/th13teen|TH13TEEN;alton-towers/spinball-whizzer|Spinball Whizzer;thorpe-park/hyperia|Hyperia;thorpe-park/saw-the-ride|SAW – The Ride columns=park,peak

```

## PortAventura

Im [PortAventura Park](ref:portaventura-park) kennen wir vier Bahnen: Hurakan Condor, Furius Baco,
Shambhala und Dragon Khan. Bei 45 der 51 Attraktionen fehlt die Angabe, die Liste ist hier also
besonders kurz gegenüber dem, was wir nicht wissen.

```ride-waits-widget rides=portaventura-park/shambhala|Shambhala;portaventura-park/dragon-khan|Dragon Khan;portaventura-park/furius-baco|Furius Baco;portaventura-park/hurakan-condor|Hurakan Condor columns=peak

```

## Walt Disney World

Walt Disney World nennt auf der Seite zum Single-Rider-Service fünf Bahnen: Millennium Falcon:
Smugglers Run, Star Wars: Rise of the Resistance und Rock ’n’ Roller Coaster Starring The Muppets in
Disney’s Hollywood Studios sowie Remy’s Ratatouille Adventure und Test Track im EPCOT. Dazu kommt
Expedition Everest in Disney’s Animal Kingdom, die auf der Liste des Parks nicht steht.

Die Regeln stehen auf derselben Seite. Der Service erlaubt Gruppen, sich zu trennen und einzeln
einzusteigen. Sofortiges Einsteigen und die Wahl des Sitzes sind nicht garantiert, besondere
Sitzwünsche werden womöglich nicht erfüllt, und die teilnehmenden Attraktionen und die Wartezeiten
können sich ändern.

Die drei Single-Rider-Warteschlangen in Disney’s Hollywood Studios standen am 8. Oktober 2026 auf
„geöffnet“, ohne Wartezeit. Das gilt für alle 19 geöffneten Single-Rider-Warteschlangen in unseren
Live-Daten, auch bei Universal.

```ride-waits-widget rides=disneys-hollywood-studios/star-wars-rise-of-the-resistance|Rise of the Resistance;disneys-hollywood-studios/millennium-falcon-smugglers-run|Smugglers Run;disneys-hollywood-studios/rock-n-roller-coaster-starring-aerosmith|Rock ’n’ Roller Coaster;epcot/test-track|Test Track;epcot/remys-ratatouille-adventure|Remy’s Ratatouille Adventure;disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain|Expedition Everest columns=park,peak

```

## Disneyland Resort in Kalifornien

Der Resort in Anaheim nennt auf seiner Seite elf Bahnen. Im Disneyland Park sind es Millennium Falcon:
Smugglers Run, Matterhorn Bobsleds, Space Mountain, Tiana’s Bayou Adventure und Indiana Jones
Adventure. Im Disney California Adventure Park sind es Goofy’s Sky School, Incredicoaster, Radiator
Springs Racers, Grizzly River Run, WEB SLINGERS und Soarin’ Over California.

Es sind zusammen sechs: Millennium Falcon und Tiana’s Bayou Adventure im
[Disneyland Park](ref:/parks/north-america/united-states/anaheim/disneyland-park) sowie Incredicoaster,
Radiator Springs Racers, WEB SLINGERS und Silly Symphony Swings im
[Disney California Adventure Park](ref:disney-california-adventure-park). Fünf Bahnen der Liste des
Resorts fehlen bei uns, und die Silly Symphony Swings stehen nicht auf der Liste.

Der Park schreibt, dass Cast Members dich in die vorgesehene Warteschlange leiten und deine Gruppe
dort getrennt wird, um die Plätze zu füllen, die Gäste der normalen Warteschlange nicht belegen.

```ride-waits-widget rides=/parks/north-america/united-states/anaheim/disneyland-park/millennium-falcon-smugglers-run|Millennium Falcon;/parks/north-america/united-states/anaheim/disneyland-park/tianas-bayou-adventure|Tiana’s Bayou Adventure;disney-california-adventure-park/radiator-springs-racers|Radiator Springs Racers;disney-california-adventure-park/incredicoaster|Incredicoaster;disney-california-adventure-park/web-slingers-a-spider-man-adventure|WEB SLINGERS columns=park,peak

```

## Universal Orlando

Universal Orlando hat 14 Bahnen in drei Parks, Walt Disney World sechs in drei
Parks. Im [Universal Studios Florida](ref:universal-studios-florida) sind es Revenge of the Mummy,
MEN IN BLACK Alien Attack und Harry Potter and the Escape from Gringotts. Im
[Islands of Adventure](ref:universal-islands-of-adventure) sind es fünf: Harry Potter and the
Forbidden Journey, Hagrid’s Magical Creatures Motorbike Adventure, The Incredible Hulk Coaster,
Doctor Doom’s Fearfall und The Amazing Adventures of Spider-Man. Im
[Epic Universe](ref:universal-epic-universe) sind es sechs von 14 Attraktionen, darunter Stardust
Racers, Mine-Cart Madness und Mario Kart: Bowser’s Challenge.

Eine Seite von Universal, die das bestätigt, konnten wir nicht abrufen. Die Angaben stammen aus
unseren Daten und sind ein Hinweis, kein Versprechen. Im Epic Universe
fehlt die Angabe bei 8 von 14 Attraktionen, im Islands of Adventure bei 20 von 25.

```ride-waits-widget rides=universal-islands-of-adventure/harry-potter-and-the-forbidden-journey|Forbidden Journey;universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure|Hagrid’s Motorbike Adventure;universal-islands-of-adventure/the-incredible-hulk-coaster|Incredible Hulk Coaster;universal-studios-florida/harry-potter-and-the-escape-from-gringotts|Escape from Gringotts;universal-studios-florida/revenge-of-the-mummy|Revenge of the Mummy;universal-epic-universe/stardust-racers|Stardust Racers;universal-epic-universe/mario-kart-bowsers-challenge|Mario Kart columns=park,peak

```

## Shanghai Disneyland und Hong Kong Disneyland

Die beiden asiatischen Disney-Parks haben zwei und drei Bahnen. Im
[Shanghai Disneyland](ref:shanghai-disneyland) sind es Zootopia: Hot Pursuit und Seven Dwarfs Mine
Train, im [Hong Kong Disneyland](ref:hong-kong-disneyland-park) Hyperspace Mountain, Big Grizzly
Mountain Runaway Mine Cars und Toy Soldier Parachute Drop. Auch hier fehlt die Angabe fast überall: bei
35 von 37 Attraktionen in Shanghai und bei 44 von 47 in Hongkong.

## So planst du einen Tag mit Single Rider

**Such dir vorher zwei oder drei Bahnen aus.** Auf der Parkseite von park.fan siehst du, welche Bahnen
das Zeichen tragen. Der Eingang ist bei der Bahn am meisten wert, an der die normale Warteschlange am
längsten ist.

**Prüfe, ob die Warteschlange offen ist, bevor du dich trennst.** Auf der Attraktionsseite steht das
Zeichen „Single Rider“ mit dem Status der Warteschlange. Sie kann geschlossen sein, ohne dass die
Bahn zu ist.

**Teilt euch auf, wenn es sich lohnt.** Für zwei Erwachsene ist die schnellste Variante, dass einer die
normale Warteschlange nimmt und der andere den Single-Rider-Eingang. Wer zuerst fährt, wartet am
Ausgang.

Wie sich Warten anfühlt und warum Aufrücken in der Warteschlange nichts bringt, steht im Beitrag
[Die Kunst des Wartens](/blog/die-kunst-des-wartens).

## Häufige Fragen zu Single Rider

### Was bedeutet Single Rider im Freizeitpark?

Single Rider ist eine eigene Warteschlange für Einzelne. Wer sie nutzt, nimmt die Sitze, die in einem
Fahrzeug übrig bleiben, und sitzt neben Fremden. Das Efteling beschreibt es so: Die Single Riders
füllen die leeren Plätze, die in den Fahrzeugen entstehen.

### Ist die Single-Rider-Warteschlange immer kürzer?

Nein. Das Efteling schreibt, Einzelne warteten meist weniger, das hänge aber von der Besucherzahl und
den freien Plätzen ab. An ruhigen Tagen kann die Warteschlange ganz geschlossen sein.

### Kann ich Single Rider mit der Familie nutzen?

Nur wenn alle bereit sind, getrennt zu fahren. Das Efteling erlaubt Gruppen den Single-Rider-Eingang,
sie fahren aber nacheinander. Ein Kind, das eine Begleitung braucht, muss neben dem Erwachsenen
sitzen, der Single-Rider-Eingang scheidet dann aus.

### Welche Bahnen im Europa-Park haben Single Rider?

Sechs: ARTHUR, WODAN, blue fire, Eurosat, das Voletarium und Voltron Nevera. Der
Park nennt es auf den Seiten von Voltron Nevera und Eurosat ausdrücklich.

### Welche Bahnen im Efteling haben Single Rider?

Die Seite des Parks nennt Danse Macabre, Joris en de Draak, Symbolica, Baron 1898, Max & Moritz und
Python. Bei uns steht zusätzlich De Vliegende Hollander.

### Wo sehe ich, ob eine Bahn Single Rider hat?

Auf der Seite der Attraktion bei park.fan, am Zeichen „Single Rider“. Fehlt das Zeichen, kann die
Angabe unbekannt sein.

### Muss ich bei Single Rider die Mindestgröße erfüllen?

Ja. Walt Disney World und das Disneyland Resort schreiben, dass Single Riders alle Voraussetzungen
der Bahn erfüllen müssen. Das Efteling schreibt dasselbe für Kinder, die allein hineingehen.

### Kann ich mir den Sitzplatz aussuchen?

Nein. Das Efteling weist einen Platz zu, Walt Disney World garantiert die Wahl des Sitzes nicht.

## Wo die Daten Lücken haben

Drei Einschränkungen gelten für alles in diesem Beitrag:

- `hasSingleRider` ist eine feste Angabe pro Bahn. Sie sagt nicht, ob die Warteschlange heute
  geöffnet ist.
- „Unbekannt“ ist kein „Nein“. Wo nichts eingetragen ist, steht die Bahn nicht in den Listen.
- Für das Phantasialand, Disneyland Paris, PortAventura, Alton Towers, Thorpe Park, Universal und die
  asiatischen Disney-Parks stammt die Angabe aus unseren Daten, nicht von einer Seite des Parks, die
  wir lesen konnten. Beim Efteling führen unsere Daten eine Bahn mehr als der Park.

## Zum Weiterlesen

- [Europa-Park: Wartezeiten und Tipps](/blog/europa-park-wartezeiten-tipps)
- [Phantasialand: Wartezeiten und Tipps](/blog/phantasialand-tipps)
- [Disneyland Paris: Wartezeiten und Tipps](/blog/disneyland-paris-wartezeiten-tipps)
- [Die Kunst des Wartens](/blog/die-kunst-des-wartens)

### Quellen & Weiterlesen

- Single Rider im Efteling, Liste der sechs Bahnen, Regeln für Gruppen und Kinder, Symbolica:
  [Single-Rider-Eingang (offiziell)](https://www.efteling.com/de/park/informationen/single-rider-eingang)
- Single Rider in Walt Disney World, fünf Bahnen und die Regeln:
  [Single Rider Services (offiziell)](https://disneyworld.disney.go.com/guest-services/single-rider-line/)
- Single Rider im Disneyland Resort, elf Bahnen und die Regeln:
  [Single Rider Services (offiziell)](https://disneyland.disney.go.com/guest-services/single-rider-line/)
- Voltron Nevera, Mindestgröße, Fassungsvermögen und Single-Rider-Hinweis:
  [Voltron Nevera powered by Rimac (offiziell)](https://www.europapark.de/en/theme-park/attractions/voltron-nevera-powered-rimac)
- Eurosat, Größen- und Altersgrenzen und Single-Rider-Hinweis:
  [Eurosat – CanCan Coaster (offiziell)](https://www.europapark.de/en/theme-park/attractions/eurosat-cancan-coaster)
- Welche Bahnen in welchem Park das Merkmal tragen, die Zahlen der Tabelle und die Live-Warteschlangen:
  Abfrage der park.fan-API (`/v1/parks/<Kontinent>/<Land>/<Stadt>/<Park>`, Felder `hasSingleRider`
  und `queues`), abgerufen am 8. Oktober 2026 für 203 Parks mit Live-Wartezeiten
