---
title: 'Single Rider: waar je alleen sneller in een baan zit'
translationKey: single-rider-guide
date: '2026-10-08'
author: patrick
mode: published
featured: false
excerpt: >-
  In 18 van de 203 parken waarvoor we wachttijden meten, kent onze API minstens
  één baan met een single-riderrij, samen 66 banen. Wie alleen rijdt of zich van
  de rest van het gezelschap laat scheiden, vult lege stoelen en staat meestal
  korter in de rij. Voor gezinnen met jonge kinderen loont het niet.
tags:
  - single-rider
  - wachttijden
  - wachtrijen
  - tips
  - pretpark
  - europa-park
  - efteling
  - disney
  - universal
category: guides
coverImage:
  src: /media/europa-park/voltron-nevera-powered-by-rimac.jpg
  alt: 'Een trein van Voltron Nevera rijdt ondersteboven door een inversie, aangelicht in roze en blauw.'
  caption: 'Voltron Nevera in het Europa-Park heeft een eigen single-rideringang.'
  credit: 'Patrick Arns'
seo:
  title: 'Single Rider in pretparken: welke banen, voor wie'
  description: >-
    Welke banen in 18 pretparken een single-riderrij hebben, hoe die werkt en
    wanneer hij niet loont.
  keywords:
    - Single Rider pretpark
    - Single Rider Europa-Park
    - Single Rider Efteling
    - alleen in de attractie pretpark
    - Single Rider Disney
    - Single Rider Universal Orlando
    - Single Rider wachtrij
    - wachttijd besparen pretpark
---

Single Rider betekent: je gaat in een eigen rij staan en neemt een stoel die in het voertuig overblijft,
naast onbekenden. Daar staan tegenover dat je meestal korter wacht dan in de gewone rij. De Efteling
schrijft op haar site dat de single riders de lege plaatsen vullen die in de voertuigen ontstaan.

Onze API voert deze rij als eigen type, `SINGLE_RIDER`, en kent 66 banen in 18 parken waar hij bestaat.
Dit artikel somt op welke dat zijn, wat de parken zelf over de regels schrijven en voor wie de weg via
de single-rideringang loont. Hoeveel tijd hij bespaart, kunnen we maar deels beantwoorden, de redenen
staan verderop.

## Hoe een single-rideringang werkt

Een trein heeft vaste zitgroepen, en niet elke groep in de gewone rij vult ze. Waar een plaats vrij
blijft, zet het park iemand uit de single-riderrij erin. De baan rijdt voller, en de groepen in de
gewone rij verliezen niets, omdat niemand uit hun rij wordt voorgetrokken. De Efteling schrijft dat dit
de wachttijd voor groepen en alleenstaanden verkort.

Daaruit volgt wat je kunt verwachten. De single-riderrij wordt alleen afgebouwd in het tempo waarin
gaten ontstaan. Op papier is hij korter, of hij dat in jouw uur ook is, hangt af van de gaten die de
groepen voor je laten vallen. De Efteling schrijft erover: alleenstaanden wachten meestal minder, maar
hoeveel hangt af van het aantal bezoekers en de vrije plaatsen.

Drie regels vonden we bij elk park waarvan we de pagina konden lezen:

1. **Je kiest je stoel niet.** De Efteling wijst een plaats toe, samen met andere bezoekers. Walt Disney
   World garandeert noch direct instappen, noch de keuze van de stoel.
2. **De instapvoorwaarden gelden zoals overal.** Walt Disney World en het Disneyland Resort schrijven
   dat single riders aan alle voorwaarden van de baan moeten voldoen. De Efteling laat kinderen alleen
   de single-rideringang in als ze de lengte en de overige voorwaarden van de baan halen.
3. **De rij kan gesloten zijn.** De Efteling zegt het uitdrukkelijk: op rustige dagen blijft hij
   mogelijk dicht. Walt Disney World schrijft dat de service afhangt van de beschikbaarheid.

```glossary-widget slug=single-rider

```

## Voor wie het loont, en wanneer niet

De single-rideringang loont in drie gevallen: je bent alleen in het park, je gezelschap laat zich
splitsen, of je wilt één bepaalde baan per se rijden en de gewone wachttijd is je te lang. In het
tweede geval splitsen jullie op, rijden apart en komen elkaar bij de uitgang tegen.

Het loont niet in deze gevallen:

- **Je gaat met een kind dat begeleiding nodig heeft.** Bij Eurosat in het Europa-Park noemt de pagina
  van het park 120 tot 195 centimeter, onder 130 centimeter alleen met een volwassene erbij. Wie het
  kind naast zich nodig heeft, kan niet apart instappen.
- **Jullie willen samen rijden.** De Efteling laat groepen de single-rideringang in, maar ze rijden
  na elkaar. Alleen als er toevallig meerdere plaatsen vrij zijn, zitten mensen uit de
  single-riderrij naast elkaar.
- **De baan vertelt iets wat jullie samen willen beleven.** Bij Symbolica in de Efteling kun je als
  single rider niet kiezen welke van de drie paleisrondleidingen je krijgt.
- **De gewone rij is toch al kort.** Dan vervalt het voordeel, en is het gezelschap zonder reden
  gescheiden.

## Wat onze gegevens over de rij weten

Er zijn twee vragen, en onze gegevens beantwoorden er maar één goed.

**Heeft de baan een single-riderrij?** Dat staat per baan in het veld `hasSingleRider`, een vaste
opgave. Op de attractiepagina toont park.fan daarvoor een “Single Rider”-teken. De waarde `null` betekent
“onbekend” en nooit “nee”. Een ontbrekend teken zegt dus niets over de vraag of de rij bestaat.

**Hoe lang is hij nu?** Hier ontbreekt vaak het getal. Op 8 oktober 2026 hebben we de live-gegevens van
alle 18 parken opgehaald. Daarin stonden 41 single-riderrijen in twaalf parken, 19 daarvan geopend, in zeven parken.
Geen enkele van de 41 had een wachttijd. De parken melden ons dat de rij open is, maar niet hoe lang
hij is. Op de attractiepagina toont park.fan dan “Single Rider” zonder tijd, en de tabellen in dit
artikel tonen de gewone rij.

Hoeveel tijd de ingang bespaart, valt uit onze gegevens daarom op dit moment niet uit te rekenen.
Onderbouwd is alleen de uitspraak van de Efteling dat alleenstaanden meestal minder wachten. Het
resultaat van een eigen meting noemen we niet, zolang die er niet is.

## Park voor park: hoeveel banen we kennen

In de tabel staat hoeveel banen per park het kenmerk dragen, hoeveel attracties het park in onze
database heeft en bij hoeveel de opgave ontbreekt. De stand is 8 oktober 2026.

| Park                           | Banen met single rider | Attracties | Opgave onbekend |
| ------------------------------ | ---------------------- | ---------- | --------------- |
| Efteling                       | 7                      | 37         | 30              |
| Disney Adventure World         | 7                      | 14         | 7               |
| Europa-Park                    | 6                      | 97         | 1               |
| Universal Epic Universe        | 6                      | 14         | 8               |
| Universal Islands of Adventure | 5                      | 25         | 20              |
| PortAventura Park              | 4                      | 51         | 45              |
| Alton Towers                   | 4                      | 55         | 48              |
| Disney California Adventure    | 4                      | 29         | 25              |
| Disney’s Hollywood Studios     | 3                      | 11         | 8               |
| Universal Studios Florida      | 3                      | 44         | 41              |
| Phantasialand                  | 3                      | 40         | 0               |
| Hong Kong Disneyland           | 3                      | 47         | 44              |
| Disneyland Park (Anaheim)      | 2                      | 56         | 54              |
| Disneyland Park (Parijs)       | 2                      | 43         | 41              |
| Shanghai Disneyland            | 2                      | 37         | 35              |
| EPCOT                          | 2                      | 34         | 32              |
| Thorpe Park                    | 2                      | 45         | 38              |
| Disney’s Animal Kingdom        | 1                      | 17         | 16              |

Twee parken springen eruit. In het Europa-Park en het Phantasialand is de opgave voor bijna elke
attractie ingevuld, ze ontbreekt bij één en bij nul. Daar betekent “niet in de lijst” dus echt “geen
single-riderrij”. Overal elders is de lijst een ondergrens: in het Disneyland Park in Parijs ontbreekt
de opgave bij 41 van de 43 attracties, in het Disneyland Park in Anaheim bij 54 van de 56.

De overige 185 van de 203 parken hebben geen enkele baan met het kenmerk. Of dat een “nee” is of een
gat, weten we daar niet.

## Europa-Park

In het [Europa-Park](ref:europa-park) dragen zes banen het kenmerk: ARTHUR in het themagebied Minimoys
Kingdom, WODAN – Timburcoaster en blue fire Megacoaster in IJsland, Eurosat – CanCan Coaster in
Frankrijk, het Voletarium in Duitsland en Voltron Nevera powered by Rimac in Kroatië.

Twee daarvan bevestigt het park zelf. Op de pagina van
[Voltron Nevera](ref:europa-park/voltron-nevera-powered-by-rimac) staat bij de kenmerken single rider
als bijzondere rij voor alleenstaanden, net zo op de pagina van
[Eurosat – CanCan Coaster](ref:europa-park/eurosat-cancan-coaster). Voltron Nevera laat gasten vanaf
130 centimeter mee, een trein biedt plaats aan 16 personen. Bij Eurosat ligt de grens op 120 tot 195
centimeter en op zes jaar, onder acht jaar rijdt alleen mee wie een volwassene bij zich heeft.

Alle zes banen hebben een minimale lengte van 120 of 130 centimeter, volgens de gegevens in onze
database. De single-rideringang helpt dus vooral tieners en volwassenen die alleen of in een gezelschap
zonder jonge kinderen onderweg zijn. Hoe je de dag in het park verstandig indeelt, staat in de
[Europa-Park-gids](/blog/europa-park-wachttijden-tips).

```ride-waits-widget rides=europa-park/voltron-nevera-powered-by-rimac|Voltron Nevera;europa-park/blue-fire-megacoaster|blue fire;europa-park/wodan-timburcoaster|WODAN;europa-park/eurosat-cancan-coaster|Eurosat;europa-park/voletarium|Voletarium;europa-park/arthur|ARTHUR columns=land,peak

```

In de tabel staat de gewone rij, in dezelfde volgorde als de banen hierboven. Wanneer hij zich vult,
staat in de verdeling over de dag:

```hourly-profile-widget slug=europa-park top=6

```

## Efteling

De [Efteling](ref:efteling) heeft de meest complete officiële beschrijving die we hebben gevonden. De
pagina over de single-rideringang noemt zes banen: Danse Macabre, Joris en de Draak, Symbolica, Baron
1898, Max & Moritz en Python. Elke baan heeft twee rijen, een voor groepen en gezinnen, een voor
alleenstaanden. Onze gegevens voeren daarnaast De Vliegende Hollander, die de pagina van het park niet
opsomt.

De pagina legt ook uit wat de single rider mist: de stoel kiezen, en bij Symbolica de keuze uit een van
de drie paleisrondleidingen. Groepen mogen de ingang gebruiken, maar rijden na elkaar, en kinderen
mogen alleen naar binnen als ze aan de voorwaarden van de baan voldoen. Die voorwaarden noemt de
pagina niet, ze verschillen per attractie. Volgens de gegevens in onze database ligt de minimale
lengte bij Max & Moritz op 90 centimeter, bij Joris en de Draak op 110, bij Python, De Vliegende
Hollander en Danse Macabre op 120 en bij Baron 1898 op 132. Symbolica heeft geen opgave.

![Python bij nacht, paars aangelicht|Python in de Efteling, een van de banen met single-rideringang.|wide](/media/efteling/python.jpg)

```ride-waits-widget rides=efteling/baron-1898|Baron 1898;efteling/python|Python;efteling/joris-en-de-draak|Joris en de Draak;efteling/symbolica|Symbolica;efteling/danse-macabre|Danse Macabre;efteling/max-and-moritz|Max & Moritz;efteling/de-vliegende-hollander|De Vliegende Hollander columns=land,peak

```

## Phantasialand

In het [Phantasialand](ref:phantasialand) dragen drie banen het kenmerk: [Taron](ref:phantasialand/taron)
en [Raik](ref:phantasialand/raik) in het themagebied Mystery en
[Chiapas – DIE Wasserbahn](ref:phantasialand/chiapas-die-wasserbahn) in Mexico. Een pagina van het
park die dit bevestigt, konden we niet ophalen.

Het Phantasialand is naast het Europa-Park het park waar de opgave voor elke attractie is ingevuld: bij
40 attracties ontbreekt ze bij geen enkele. De drie banen zijn daarmee de volledige lijst. De minimale
lengte ligt bij Taron op 140 centimeter, bij Chiapas op 130 en bij Raik op 120.

```ride-waits-widget rides=phantasialand/taron|Taron;phantasialand/raik|Raik;phantasialand/chiapas-die-wasserbahn|Chiapas columns=land,peak

```

## Disneyland Paris

Het resort heeft twee parken, en de banen met single-rideringang zijn ongelijk verdeeld. In
[Disney Adventure World](ref:disney-adventure-world) zijn het er zeven: Spider-Man W.E.B. Adventure en
Avengers Assemble: Flight Force in Marvel Avengers Campus, Frozen Ever After in de World of Frozen,
Ratatouille: L’Aventure Totalement Toquée de Rémy in Toon Studio, plus in Toon Studio Crush’s Coaster,
RC Racer en Toy Soldiers Parachute Drop. Dat zijn zeven van de 14 attracties, het hoogste aandeel van
alle parken in de tabel.

In het [Disneyland Park](ref:/parks/europe/france/paris/disneyland-park) zijn het er twee: Star Wars
Hyperspace Mountain in Discoveryland en Indiana Jones and the Temple of Peril in Adventureland. Een
pagina van Disneyland Paris over de single-riderservice konden we niet ophalen.

```ride-waits-widget rides=disney-adventure-world/frozen-ever-after|Frozen Ever After;disney-adventure-world/spider-man-web-adventure|Spider-Man W.E.B. Adventure;disney-adventure-world/crushs-coaster|Crush’s Coaster;disney-adventure-world/rc-racer|RC Racer;/parks/europe/france/paris/disneyland-park/star-wars-hyperspace-mountain|Star Wars Hyperspace Mountain;/parks/europe/france/paris/disneyland-park/indiana-jones-and-the-temple-of-peril|Indiana Jones and the Temple of Peril columns=park,peak

```

## Alton Towers en Thorpe Park

In [Alton Towers](ref:alton-towers) zijn het vier banen in het gebied Thrills: TH13TEEN, Spinball
Whizzer, The Smiler en Galactica. In [Thorpe Park](ref:thorpe-park) zijn het er twee, beide in het
gebied Coasters: SAW – The Ride en Hyperia. Bij beide parken ontbreekt voor de meeste banen de opgave,
in Alton Towers bij 48 van de 55 attracties, in Thorpe Park bij 38 van de 45. De minimale lengte ligt
bij TH13TEEN en Spinball Whizzer op 120 centimeter, bij Hyperia op 130 en bij The Smiler, Galactica en
SAW op 140. Een pagina van de parken die de lijst bevestigt, hebben we niet gelezen.

```ride-waits-widget rides=alton-towers/the-smiler|The Smiler;alton-towers/galactica|Galactica;alton-towers/th13teen|TH13TEEN;alton-towers/spinball-whizzer|Spinball Whizzer;thorpe-park/hyperia|Hyperia;thorpe-park/saw-the-ride|SAW – The Ride columns=park,peak

```

## PortAventura

In het [PortAventura Park](ref:portaventura-park) kennen we vier banen: Hurakan Condor, Furius Baco,
Shambhala en Dragon Khan. Bij 45 van de 51 attracties ontbreekt de opgave, de lijst is hier dus
bijzonder kort ten opzichte van wat we niet weten.

```ride-waits-widget rides=portaventura-park/shambhala|Shambhala;portaventura-park/dragon-khan|Dragon Khan;portaventura-park/furius-baco|Furius Baco;portaventura-park/hurakan-condor|Hurakan Condor columns=peak

```

## Walt Disney World

Walt Disney World noemt op de pagina over de single-riderservice vijf banen: Millennium Falcon:
Smugglers Run, Star Wars: Rise of the Resistance en Rock ’n’ Roller Coaster Starring The Muppets in
Disney’s Hollywood Studios, en Remy’s Ratatouille Adventure en Test Track in EPCOT. Daar komt
Expedition Everest in Disney’s Animal Kingdom bij, die niet op de lijst van het park staat.

De regels staan op dezelfde pagina. De service staat groepen toe zich te splitsen en apart in te
stappen. Direct instappen en de keuze van de stoel zijn niet gegarandeerd, bijzondere zitwensen
worden mogelijk niet vervuld, en de deelnemende attracties en de wachttijden kunnen veranderen.

De drie single-riderrijen in Disney’s Hollywood Studios stonden op 8 oktober 2026 op “geopend”, zonder
wachttijd. Dat geldt voor alle 19 geopende single-riderrijen in onze live-gegevens, ook bij Universal.

```ride-waits-widget rides=disneys-hollywood-studios/star-wars-rise-of-the-resistance|Rise of the Resistance;disneys-hollywood-studios/millennium-falcon-smugglers-run|Smugglers Run;disneys-hollywood-studios/rock-n-roller-coaster-starring-aerosmith|Rock ’n’ Roller Coaster;epcot/test-track|Test Track;epcot/remys-ratatouille-adventure|Remy’s Ratatouille Adventure;disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain|Expedition Everest columns=park,peak

```

## Disneyland Resort in Californië

Het resort in Anaheim noemt op zijn pagina elf banen. In het Disneyland Park zijn dat Millennium
Falcon: Smugglers Run, Matterhorn Bobsleds, Space Mountain, Tiana’s Bayou Adventure en Indiana Jones
Adventure. In Disney California Adventure Park zijn het Goofy’s Sky School, Incredicoaster, Radiator
Springs Racers, Grizzly River Run, WEB SLINGERS en Soarin’ Over California.

Bij ons zijn het er samen zes: Millennium Falcon en Tiana’s Bayou Adventure in het
[Disneyland Park](ref:/parks/north-america/united-states/anaheim/disneyland-park) en Incredicoaster,
Radiator Springs Racers, WEB SLINGERS en Silly Symphony Swings in
[Disney California Adventure Park](ref:disney-california-adventure-park). Zes banen van de lijst van
het resort ontbreken bij ons, en de Silly Symphony Swings staan niet op de lijst.

Het park schrijft dat cast members je naar de bedoelde rij sturen en dat je gezelschap daar wordt
gesplitst om de plaatsen te vullen die gasten uit de gewone rij niet innemen.

```ride-waits-widget rides=/parks/north-america/united-states/anaheim/disneyland-park/millennium-falcon-smugglers-run|Millennium Falcon;/parks/north-america/united-states/anaheim/disneyland-park/tianas-bayou-adventure|Tiana’s Bayou Adventure;disney-california-adventure-park/radiator-springs-racers|Radiator Springs Racers;disney-california-adventure-park/incredicoaster|Incredicoaster;disney-california-adventure-park/web-slingers-a-spider-man-adventure|WEB SLINGERS columns=park,peak

```

## Universal Orlando

Universal Orlando heeft 14 banen in drie parken, Walt Disney World zes in drie parken. In
[Universal Studios Florida](ref:universal-studios-florida) zijn het Revenge of the Mummy, MEN IN BLACK
Alien Attack en Harry Potter and the Escape from Gringotts. In
[Islands of Adventure](ref:universal-islands-of-adventure) zijn het er vijf: Harry Potter and the
Forbidden Journey, Hagrid’s Magical Creatures Motorbike Adventure, The Incredible Hulk Coaster, Doctor
Doom’s Fearfall en The Amazing Adventures of Spider-Man. In [Epic Universe](ref:universal-epic-universe)
zijn het er zes van de 14 attracties, onder meer Stardust Racers, Mine-Cart Madness en Mario Kart:
Bowser’s Challenge.

Een pagina van Universal die dit bevestigt, konden we niet ophalen. De opgaven komen uit onze gegevens
en zijn een aanwijzing, geen belofte. In Epic Universe ontbreekt de opgave bij 8 van de 14 attracties,
in Islands of Adventure bij 20 van de 25.

```ride-waits-widget rides=universal-islands-of-adventure/harry-potter-and-the-forbidden-journey|Forbidden Journey;universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure|Hagrid’s Motorbike Adventure;universal-islands-of-adventure/the-incredible-hulk-coaster|Incredible Hulk Coaster;universal-studios-florida/harry-potter-and-the-escape-from-gringotts|Escape from Gringotts;universal-studios-florida/revenge-of-the-mummy|Revenge of the Mummy;universal-epic-universe/stardust-racers|Stardust Racers;universal-epic-universe/mario-kart-bowsers-challenge|Mario Kart columns=park,peak

```

## Shanghai Disneyland en Hong Kong Disneyland

De twee Aziatische Disney-parken hebben twee en drie banen. In
[Shanghai Disneyland](ref:shanghai-disneyland) zijn het Zootopia: Hot Pursuit en Seven Dwarfs Mine
Train, in [Hong Kong Disneyland](ref:hong-kong-disneyland-park) Hyperspace Mountain, Big Grizzly
Mountain Runaway Mine Cars en Toy Soldier Parachute Drop. Ook hier ontbreekt de opgave bijna overal: bij
35 van de 37 attracties in Shanghai en bij 44 van de 47 in Hongkong.

## Zo plan je een dag met single rider

**Kies vooraf twee of drie banen.** Op de parkpagina van park.fan zie je welke banen het teken dragen.
De ingang is het meest waard bij de baan waar de gewone rij het langst is.

**Controleer of de rij open is voordat je je laat scheiden.** Op de attractiepagina staat het teken
“Single Rider” met de status van de rij. Hij kan gesloten zijn zonder dat de baan dicht is.

**Splits op als het loont.** Voor twee volwassenen is de snelste variant dat de een de gewone rij neemt
en de ander de single-rideringang. Wie eerst rijdt, wacht bij de uitgang.

Hoe wachten voelt en waarom opschuiven in de rij niets oplevert, staat in het artikel
[De kunst van het wachten](/blog/de-kunst-van-het-wachten).

## Veelgestelde vragen over single rider

### Wat betekent single rider in een pretpark?

Single rider is een eigen rij voor alleenstaanden. Wie hem gebruikt, neemt de stoelen die in een
voertuig overblijven en zit naast onbekenden. De Efteling beschrijft het zo: de single riders vullen de
lege plaatsen die in de voertuigen ontstaan.

### Is de single-riderrij altijd korter?

Nee. De Efteling schrijft dat alleenstaanden meestal minder wachten, maar dat dat afhangt van het
aantal bezoekers en de vrije plaatsen. Op rustige dagen kan de rij helemaal gesloten zijn.

### Kan ik single rider met het gezin gebruiken?

Alleen als iedereen bereid is apart te rijden. De Efteling laat groepen de single-rideringang in, maar
ze rijden na elkaar. Een kind dat begeleiding nodig heeft, moet naast de volwassene zitten, de
single-rideringang valt dan af.

### Welke banen in het Europa-Park hebben single rider?

Zes: ARTHUR, WODAN, blue fire, Eurosat, het Voletarium en Voltron Nevera. Het park noemt het
uitdrukkelijk op de pagina’s van Voltron Nevera en Eurosat.

### Welke banen in de Efteling hebben single rider?

De pagina van het park noemt Danse Macabre, Joris en de Draak, Symbolica, Baron 1898, Max & Moritz en
Python. Bij ons staat daarnaast De Vliegende Hollander.

### Waar zie ik of een baan single rider heeft?

Op de attractiepagina bij park.fan, aan het teken “Single Rider”. Ontbreekt het teken, dan kan de
opgave onbekend zijn.

### Moet ik bij single rider aan de minimale lengte voldoen?

Ja. Walt Disney World en het Disneyland Resort schrijven dat single riders aan alle voorwaarden van de
baan moeten voldoen. De Efteling schrijft hetzelfde voor kinderen die alleen naar binnen gaan.

### Kan ik mijn zitplaats uitkiezen?

Nee. De Efteling wijst een plaats toe, Walt Disney World garandeert de keuze van de stoel niet.

## Waar de gegevens gaten hebben

Drie beperkingen gelden voor alles in dit artikel:

- `hasSingleRider` is een vaste opgave per baan. Ze zegt niet of de rij vandaag open is.
- “Onbekend” is geen “nee”. Waar niets is ingevuld, staat de baan niet in de lijsten.
- Voor het Phantasialand, Disneyland Paris, PortAventura, Alton Towers, Thorpe Park, Universal en de
  Aziatische Disney-parken komt de opgave uit onze gegevens, niet van een pagina van het park die we
  konden lezen. Bij de Efteling voeren onze gegevens één baan meer dan het park.

## Verder lezen

- [Europa-Park: wachttijden en tips](/blog/europa-park-wachttijden-tips)
- [Phantasialand: wachttijden en tips](/blog/phantasialand-wachttijden-tips)
- [Disneyland Paris: wachttijden en tips](/blog/disneyland-paris-wachttijden-tips)
- [De kunst van het wachten](/blog/de-kunst-van-het-wachten)

### Bronnen & verder lezen

- Single rider in de Efteling, lijst van de zes banen, regels voor groepen en kinderen, Symbolica:
  [Single-rideringang (officieel)](https://www.efteling.com/de/park/informationen/single-rider-eingang)
- Single rider in Walt Disney World, vijf banen en de regels:
  [Single Rider Services (officieel)](https://disneyworld.disney.go.com/guest-services/single-rider-line/)
- Single rider in het Disneyland Resort, elf banen en de regels:
  [Single Rider Services (officieel)](https://disneyland.disney.go.com/guest-services/single-rider-line/)
- Voltron Nevera, minimale lengte, capaciteit en single-riderverwijzing:
  [Voltron Nevera powered by Rimac (officieel)](https://www.europapark.de/en/theme-park/attractions/voltron-nevera-powered-rimac)
- Eurosat, lengte- en leeftijdsgrenzen en single-riderverwijzing:
  [Eurosat – CanCan Coaster (officieel)](https://www.europapark.de/en/theme-park/attractions/eurosat-cancan-coaster)
- Welke banen in welk park het kenmerk dragen, de cijfers van de tabel en de live-rijen: bevraging van
  de park.fan-API (`/v1/parks/<continent>/<land>/<stad>/<park>`, velden `hasSingleRider` en `queues`),
  opgehaald op 8 oktober 2026 voor 203 parken met live-wachttijden
