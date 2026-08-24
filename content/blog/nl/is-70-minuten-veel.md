---
title: 'Is 70 minuten veel? Dat hangt van de weekdag af'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
author: patrick
mode: published
excerpt: >-
  Bij de ingang van Taron hangt een getal, en op zichzelf zegt het bijna niets.
  Pas de vergelijking met elke gemeten dinsdag maakt er een antwoord van. Waarom
  park.fan wachttijden archiveert, wat er ’s nachts mee gebeurt en waar we
  liever helemaal niets zeggen.
tags:
  - wachttijden
  - park-fan
  - phantasialand
  - statistiek
  - achter-de-schermen
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
  alt: 'Een trein van Taron tussen de basaltrotsen van Klugheim'
  caption: 'Taron in Klugheim. Het getal bij de ingang staat op 70. En nu?'
  credit: 'Patrick Arns'
seo:
  title: 'Wachttijden goed lezen: is 70 minuten veel?'
  description: >-
    Waarom een wachttijd zonder vergelijkingswaarde niets zegt, wat “normaal” en
    “druk” bij een attractie betekenen en hoe park.fan van miljoenen metingen
    een antwoord maakt.
  keywords:
    - wachttijden pretpark
    - wachttijd inschatten
    - Taron wachttijd
    - Phantasialand wachttijden
    - percentiel wachttijd
    - rope drop
    - drukte-kalender
---

Je staat voor [Taron](ref:phantasialand/taron), het bord zegt **70 minuten**, en je hoofd doet
meteen het verkeerde: het vergelijkt dat getal met je herinnering. Vorige keer
was het 40, dus vandaag is het erger. De keer daarvoor 90, dus vandaag is het
top. Twee bezoeken zijn geen basis, en je geheugen rondt sowieso in je nadeel af
([waarom, lees je hier](/blog/de-kunst-van-het-wachten)).

Het getal zelf is niet het probleem. De parken schrijven het aan, het klopt
meestal ongeveer, en het kost ons één aanvraag per vijf minuten. Het probleem is
dat het alleen staat. Zeventig minuten op een dinsdag in mei is iets heel anders
dan op een zaterdag in de zomervakantie, en zonder het tweede deel van die zin
kun je er niets mee.

## Wat “normaal” en “druk” echt betekenen

park.fan zet naast elke attractie twee vergelijkingswaarden. **Normaal** is de
mediaan van de dagpieken: op de helft van alle gemeten dagen was de langste rij
korter dan die waarde, op de andere helft langer. **Druk** is het 90e percentiel
van dezelfde reeks, ongeveer die ene dag op tien waarop het echt vol was.

Allebei zijn het percentielen en geen gemiddelden, en dat is geen detail. Een
gemiddelde laat zich door één uitzonderlijke dag verschuiven: een middag met een
storing en 150 minuten opstopping trekt het gemiddelde van een hele maand
omhoog, terwijl er op 29 dagen niets van te merken was. De mediaan verroert zich
bij zo’n dag niet. Daarom staat het record er los naast, met datum, zodat je het
ziet zonder dat het de andere twee cijfers aanraakt.

Voor [Phantasialand](ref:phantasialand) ziet de ranglijst er zo uit. De kolom met de meetdagen is de
belangrijkste: die zegt hoeveel gewicht een regel draagt.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Wat hier staat, is live. Lees je dit artikel over drie maanden opnieuw, dan
staan er andere cijfers in de tabel, en de tekst eromheen klopt nog steeds.
Precies daarvoor zijn deze widgets er: in vier oudere artikelen stonden de
cijfers met de hand getypt in markdowntabellen, verdeeld over zes talen, en na
een paar weken waren ze stilletjes uit elkaar gelopen.

## De dag heeft een vorm

Een attractie heeft niet de hele dag dezelfde rij. De basisbeweging kent
iedereen: bij de opening is het kort, daarna trekt het aan, tegen de avond wordt
het weer te doen. Waar precies het hoogtepunt ligt, verschilt per attractie, en
die verschillen zijn het bruikbare deel.

```hourly-profile-widget slug=phantasialand top=6

```

Uit die vorm ontstaan twee adviezen. Het eerste is **rope drop**: bij de opening
meteen naar één bepaalde attractie, voordat de paden vollopen. Wij stellen dat
alleen voor als de dagpiek minstens 60 minuten haalt en de vroege start daarvan
minstens 45 bespaart. Alles daaronder zou een tip zijn die overal zou gelden en
daarom nergens iets waard is.

Het tweede is het rustigere alternatief in de avond. Bij de grote coasters is
het laatste uur voor sluiting vaak net zo goed als het eerste na de opening,
alleen hoef je er niet om zeven uur voor op te staan. Beide gegevens staan op de
pagina van elke attractie, met een concrete tijd in parktijd.

## Het meeste beslis je voor vertrek

Het tijdstip levert je een half uur op. De datum levert je de dag op. Tussen
twee dagen van dezelfde vakantieweek kan een half uur gemiddelde wachttijd
zitten, en aan een gewone kalender zie je dat niet. Wat het verschil maakt:
welke regio’s vrij hebben, of er een brugdag aan vastzit, of het regent, en of
er over de grens iets aan de hand is.

Dat laatste punt wordt graag onderschat. Een park dicht bij de grens merkt het
meteen als de vakantie ernaast begint, dus rekenen we regio’s binnen ongeveer
200 kilometer mee en markeren die apart in de kalender. Drie parken naast
elkaar, elk met hun rustigste weekdag:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Blijft een cel in de laatste kolom leeg, dan is dat geen gat maar een uitkomst.
Het betekent dat dit park geen weekdag heeft die zich betrouwbaar van de andere
onderscheidt.

## Waar een nachtdienst voor nodig is

Een live wachttijd tonen is één aanvraag. Een mediaan over elke gemeten dinsdag
is iets anders: die moet klaar zijn voordat iemand ernaar vraagt. Dus loopt er
elke nacht een keten van taken, en hun volgorde ligt vast, omdat elke stap op de
vorige rust. Om 02:00 UTC de percentielen per uur, om 03:00 de basiswaarden per
park, om 04:30 de samenvatting van gisteren, om 05:15 de rope-dropadviezen, die
precies die samenvatting lezen. Om 06:00 traint het voorspelmodel zichzelf
opnieuw met de wachttijden van de dag ervoor.

Daar komt de andere helft bij: we gooien niets weg. Oudere perioden worden
gecomprimeerd, maar elke analyse loopt nog altijd over alle metingen die ooit
zijn binnengekomen. Een archief dat je achteraf wilt aanleggen, is precies het
enige wat je niet achteraf kunt aanleggen.

## En de plekken waar we niets zeggen

Een pagina vol ingevulde velden is makkelijk te bouwen. Ze wordt pas interessant
als je de ingevulde velden kunt vertrouwen, en daarvoor moeten een paar velden
leeg mogen blijven.

[Hansa-Park](ref:hansa-park) bijvoorbeeld geeft zijn wachttijden alleen in de eigen app, en alleen
voor apparaten op de wifi van het park. Er is geen openbare interface. In de
ruwe data ziet dit park eruit als elk ander park om drie uur ’s nachts: geen
enkele attractie meldt iets. Zouden we daar het voor de hand liggende uit
afleiden, dan stonden er 82 attracties op “zeer laag”, plus een gemiddelde van 0
minuten en een voorspelling die op nul waarnemingen berust. In plaats daarvan
staat op de parkpagina een melding dat er hier niets te lezen valt.

Dezelfde regel op een kleinere plek: de schaatsbaan in Phantasialand loopt van
november tot januari. In augustus meldt niemand er iets over, omdat er niets te
melden is. Die stilte als “open” lezen zou de gemakkelijke fout zijn, en zo
stond het ooit ook echt op de parkpagina. En de bedrijfsmaanden van een
attractie noemen we pas na 330 waarnemingsdagen: daarvoor zou “draait van
december tot april” geen seizoen zijn, maar een beschrijving van de periode
waarin we toevallig al hebben gemeten.

## Waar dit allemaal staat

De lange versie, met de echte kaarten om mee te lezen, is nu een eigen pagina:
[Zo werkt park.fan](/nl/hoe-park-fan-werkt). Daar staat hoofdstuk voor
hoofdstuk wat er op een attractiekaart te zien is, hoe de schaal onder “normaal”
en “druk” werkt, hoe de kalender de vakanties verrekent en op welke drie plekken
we bewust niets beweren. Vier concrete bezoeksituaties zitten er ook bij, van
het gezin in de herfstvakantie tot de jaarkaarthouder om zeven uur ’s avonds.

En als je de volgende keer bij de ingang staat en naar het bord staart: kijk na
wat bij deze attractie op een dinsdag normaal is. Dan weet je binnen tien
seconden of je je moet ergeren of dat het gewoon dinsdag is.

— Patrick
