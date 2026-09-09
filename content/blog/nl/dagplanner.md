---
title: 'De dagplanner: wij rekenen na of jouw parkdag uitkomt'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: true
excerpt: >-
  Een wachttijdenfeed vertelt je hoe lang de rij nu is. Hij vertelt je niet of
  jouw lijstje het tot sluitingstijd redt. Daar is de dagplanner voor: je
  attracties op een tijdlijn, elk blok zo hoog als de wachttijd die ervoor
  voorspeld is, en de loopafstand ertussen.
tags:
  - park-fan
  - dagplanner
  - wachttijden
  - tips
  - orlando
  - achter-de-schermen
category: news
parkLinks:
  # Hansa-Park krijgt een eigen alinea over waarom de planner daar geen knoppen
  # aanbiedt. Precies dat vraagt iemand zich op die parkpagina af.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'Een volgepakt openluchttheater van achteren gezien, het publiek wacht in het donker'
  caption: 'Iedereen op hetzelfde moment op dezelfde plek. Dat is het normale geval, niet de uitzondering.'
  credit: 'Patrick Arns'
seo:
  title: 'Dagplanner voor pretparken: wachttijden vooraf inrekenen'
  description: >-
    De nieuwe park.fan-dagplanner legt je attracties op een tijdlijn, rekent met
    de voorspelde wachttijden, kent de openingstijd van elke afzonderlijke
    attractie en de loopafstanden ertussen. Zonder account, alles in je browser.
  keywords:
    - pretparkdag plannen
    - dagplanner pretpark
    - wachttijden plannen
    - Magic Kingdom dag plannen
    - Orlando park plannen
    - volgorde attracties
    - rope drop
---

Het plan in je hoofd houdt het tot een uur of twee ’s middags. Tegen die tijd
heb je drie van de acht attracties gedaan, sta je in de verkeerde rij en weet je
dat het niet meer gaat lukken. Het getal boven de ingang klopt al die tijd. Het
klopt bijna altijd. Het zegt alleen niets over de vraag of de rest van je
lijstje vandaag nog gebeurt.

In een compact park kost je dat één attractie, en die doe je de volgende keer.
In een park dat om acht uur ’s ochtends opengaat en pas om elf uur ’s avonds
dicht, dat een stuk of tien attracties heeft waar een uur wachten heel gewoon
is, en waar er twee van tien minuten lopen uit elkaar liggen, kost het je de
helft van de lijst. Wie een dag in Orlando zonder volgorde heeft doorgebracht,
kent de afloop: veel gelopen, weinig gereden, en ’s avonds is de helft niet
afgevinkt. Niet omdat het te druk was, maar omdat de volgorde verkeerd was.

Precies dat gat had park.fan. “Hoe lang is de rij nu” beantwoorden we sinds dag
één. “Is dat veel voor een dinsdag” sinds
[vorige zomer](/blog/is-70-minuten-veel). De derde vraag stond nergens: komt
mijn dag zo eigenlijk wel uit?

Sinds deze week staat hij er. De [dagplanner](/dagplanner) legt je attracties op
een tijdlijn en rekent de dag door voordat je vertrekt.

## Een dag is een volgorde, en die heeft een klok

Het idee is snel verteld. Een blok is een attractie, en de hoogte ervan is de
wachttijd die voor dat uur voorspeld is. Sleep je het naar een voller uur, dan
groeit het. Sleep je het naar een rustiger uur, dan krimpt het. De dag zelf wordt
er niet langer of korter van, hij verschuift, en dat zie je.

Tussen twee blokken staat de overstap: hoe ver het is en of de tijd toereikend
is. De weg uit het station en de rit zelf zitten in die tussenruimte en niet in
het blok, omdat ze bij het overstappen horen en niet bij het wachten.

Klinkt als een detail, en het verandert hoe je naar een parkdag kijkt. Een
lijstje met acht attracties zegt niets over de vraag of er die dag acht in
passen. Acht blokken op een tijdlijn die om elf uur ’s avonds eindigt, zeggen
het meteen.

![De dagplanner met een geplande dag in Magic Kingdom: tien blokken op een tijdlijn vanaf 8 uur, met daartussen de overstap met afstand en looptijd. | Tien attracties op een zaterdag in september, in deze volgorde door de planner zelf gezet.](/media/tagesplaner/planer-tag-nl.webp)

Tien attracties, van opening tot vier uur ’s middags, en onder het plan staat de
som: vijf uur en een kwartier alleen wachten. Dat is de versie die de optimizer
het beste vond. Zonder volgorde sta je er net zo lang, maar rijd je minder.

## Tussen twee attracties ligt een weg

Een wachttijdenfeed kan zeggen dat er bij een attractie vijftig minuten staat.
Wat hij niet kan zeggen: dat je er vanaf waar je nu staat niet meer op tijd
komt. Daar is de overstap voor.

Gerekend wordt met de afstand tussen de coördinaten van de twee attracties, plus
drie minuten om het station uit te komen en drie voor instappen en rijden waar
geen ritduur bekend is. De afstand is hemelsbreed, en de planner noemt hem ook
zo. Het is een ondergrens en geen looptijd: paden buigen om water heen, om
wachtrijen en om eenrichtingsroutes, sommige parken stapelen hun gebieden op
elkaar, en in een groot park loopt de rechte lijn nogal eens dwars over een
meer dat je moet omlopen. Voor de bovengrens rekent de planner daarom met
parktempo in plaats van wandeltempo en legt twee derde omweg op de hemelsbrede
afstand.

In een compact park kost een onhandige overstap drie minuten en valt het
niemand op. In een groot park kost hij een kwartier. Wie dat acht keer per dag
doet, heeft twee uur weggelopen die in geen enkele wachttijdstatistiek opduiken.

Staat er bij de overstap “krap”, dan betekent dat niet dat het er nipt uitziet.
Het betekent: deze overstap komt niet meer uit als de voorspelling er zo ver
naast zit als ze zelf aangeeft. Hoe ver dat is, weet de API voor elke attractie,
en op dit punt wordt van die spreiding een mededeling.

## “Vroeg komen” geldt niet voor elke attractie

Het advies dat je overal leest, gaat zo: de grote attractie eerst, meteen na
opening. Soms klopt het. Vaak klopt het niet, en welke van de twee geldt zie je
pas als je de uren stuk voor stuk bekijkt. Het
[Magic Kingdom](ref:magic-kingdom-park) leent zich daar goed voor, omdat de dag
er lang genoeg is om de curven ver uiteen te laten lopen.

```hourly-profile-widget slug=magic-kingdom-park top=8

```

Daar zitten drie patronen in, en elk vraagt om een ander antwoord.
[TRON](ref:magic-kingdom-park/tron-lightcycle-run) is de hele dag duur en wordt
tegen de avond nog duurder. Er vroeg op af gaan is hier nooit fout, maar
goedkoop wordt het er ook niet van: het blijft de langste rij waarin je die dag
staat. [Jungle Cruise](ref:magic-kingdom-park/jingle-cruise) loopt andersom en
zakt laat op de avond weg, dus wie er ’s middags gaat staan, betaalt een
veelvoud voor dezelfde rit. En
[Big Thunder](ref:magic-kingdom-park/big-thunder-mountain-railroad) is urenlang
vrijwel even duur en is daarmee de vulling voor de gaten die de andere twee
laten vallen.

Een vuistregel kan die drie antwoorden niet geven, want hij behandelt alle drie
de attracties hetzelfde. In de planner zit daarom geen rope-drop-regel; de code
kent de term niet eens.

```glossary-widget slug=rope-drop

```

Wat hij wel kent, is de uurcurve van elke afzonderlijke attractie. Ligt die kort
na opening het laagst, dan komt “de grote eerst” er vanzelf uit. Is hij vlak,
dan komt er iets anders uit, en dat klopt daar dan ook.

Nog iets wat mensen bij het plannen in hun hoofd zelden meerekenen: het eerste
uur is vaak helemaal niet van jou. Veel parken openen hun poorten voordat een
deel van de attracties draait, en de headliners zitten graag bij de latere. Wie
dat eerste uur met hen volplant, heeft een uur volgepland dat er niet is. De
planner kent de openingstijd van elke afzonderlijke attractie en laat geen blok
ervoor schuiven. Een tegenhanger is er niet: wanneer een enkele attractie
’s avonds dichtgaat, meldt geen enkele feed betrouwbaar, dus staat daar ook
niets over.

## Twee knoppen sorteren de dag

Onder de tijdlijn staan twee knoppen. “Alle headliners inplannen” haalt de grote
attracties van het park erbij die nog niet in de dag staan en sorteert daarna
alles. “Dag optimaliseren” voegt niets toe en herschikt alleen wat er al staat.
Achter allebei draait dezelfde berekening. Het zijn twee knoppen omdat het twee
vragen zijn: vul mijn dag, en kan de volgorde beter.

Er wordt op drie dingen gesorteerd, en hun rangorde is de eigenlijke beslissing.

1. **Alles moet vóór sluitingstijd aan de beurt komen.** Een plan met één
   attractie minder die echt plaatsvindt, verslaat er een met één meer die het
   niet meer wordt. En valt er iets af, dan van achteren: eerst wat de knop zelf
   net heeft toegevoegd, nooit wat jij vooraf had bedacht.
2. **De som van de wachttijden.** Daar was tenslotte om gevraagd.
3. **Het tijdstip waarop je voor het laatst gaat staan.** Waar twee volgordes
   evenveel kosten, wint die welke eerder klaar is.

In een park met meer headliners dan er in een dag passen, is punt één het hele
spel. Daarom verdwijnt de knop ook niet altijd na een druk: blijft er een
attractie over waarvoor geen plaats meer is, dan staat eronder hoeveel het er
zijn, en het aanbod blijft staan voor het geval je iets anders schrapt.

Een schuifregelaar die wachten tegen rondhangen afweegt, is er bewust niet. Dat
getal zou niemand kunnen verantwoorden, en de eerste die het tegenspreekt, zou
gelijk hebben.

Eén gevolg daarvan vind ik mooi, omdat niemand het erin heeft geprogrammeerd: de
planner stuurt je soms koffie drinken. Als je nu vijftig minuten zou moeten
staan, maar een half uur later nog maar vijftien, dan kosten slenteren en
wachten samen minder dan wachten alleen. Dezelfde attractie, minder rij, en je
bent toch eerder weer vrij.

Wat de optimizer niet aanraakt: je lunchpauze, elke attractie die je al hebt
afgevinkt, en elk blok waarvan de tijd al is begonnen. Dat laatste punt heeft
ons een tijd beziggehouden, want het is het verschil tussen “ik sorteer je
middag” en “ga alsjeblieft weer achteraan in de rij staan”. Wie om twee uur op
de knop drukt, staat om twee uur in een of andere rij, en die verschuift
niemand meer.

En omdat zo’n druk op de knop van drie blokken elf kan maken, staat er naast de
uitkomst een ongedaan maken. Eén keer, niet onbeperkt, maar die ene keer die je
nodig hebt.

## Wat de planner niet weet, zegt hij erbij

Het langste werk aan zo’n ding zijn de vier plekken waar hij bewust minder
beweert dan hij zou kunnen.

**De voorspelling zit ernaast, en meetbaar ook.** Bij elk geselecteerd blok
staat hoe ver de voorspellingen voor die attractie gemiddeld af lagen van wat de
dag werkelijk bracht. “Typisch” betekent daarbij letterlijk wat het zegt: de
helft van de dagen ligt er verder naast. Daarom staat het getal er als typische
fout en nooit als marge waarin het juiste antwoord al zou zitten.

**Speeltijden zijn twee dingen.** Wat het park voor vandaag heeft gepubliceerd,
is een mededeling. Wat wij van de laatste passende weekdag hebben doorgetrokken,
is een vermoeden, en dat tekent de planner zachter: met een tilde voor de tijd,
een stippellijn en de datum waar de tijden vandaan komen. Niemand ter wereld
kent speeltijden voor de zaterdag over twee weken.

**Sommige parken kunnen we helemaal niet meten.** [Hansa-Park](ref:hansa-park)
geeft zijn wachttijden alleen in de eigen app op de wifi van het park. Bij ons
komt daar nooit een getal binnen. Een park zonder bron ziet er in de data
precies zo uit als een park dat ’s nachts gesloten is, dus haalt de planner die
informatie rechtstreeks uit de API en verbergt daar allebei de sorteerknoppen.
Als elke attractie hetzelfde verzonnen getal kost, is elke volgorde even goed,
en een knop die niets verandert zou een belofte zijn.

**Een dag die voorbij is, blijft.** De kalender laat je een dag opnieuw openen
waarop je iets had gepland, en de automatische knoppen zijn daar weg. Alles met
de hand gaat door: verschuiven, afvinken, verwijderen. Een gelopen dag is een
registratie, en dat je om één uur echt in die rij stond, is de reden dat hij
überhaupt bewaard blijft.

## Hij ligt in je browser

Er is geen account, geen registratie en geen login. Je plan ligt in je browser,
en dat is de standaard, niet de uitgeklede versie. Ruim je je browsergegevens
op, dan is hij weg. Open je park.fan op je telefoon, dan is het een ander plan.

De ene uitzondering zijn pushmeldingen. Om je te kunnen zeggen dat je zo moet
vertrekken, moet het plan op onze server staan, en de planner schrijft erbij wat
dat betekent: wie de link heeft, kan hem lezen en wijzigen. Er staat geen
wachtwoord voor. Wie dat niet wil, zet de meldingen niet aan en verliest verder
niets.

Nog twee dingen die je makkelijk over het hoofd ziet. Aan de rechterrand van het
scherm hangt op elke pagina een tab die de planner opent, ook als er nog niets
gepland is. En op een computer kun je een tweede kolom openen, dan staan er twee
dagen naast elkaar. Voor precies één zin heb ik dat gebouwd: “en hoe zou dat er
op zaterdag uitzien”.

## Zo begin je

De weg naar binnen loopt via drie vragen. Naar welk park, op welke dag, en wie
gaat er mee.

De eerste is een zoekveld, en daarachter zit een kleinigheid die snel misgaat.
Tik “Disneyland” in en je krijgt vijf parken op drie continenten die allemaal zo
heten.

![Stap één van de planner-wizard: “Disneyland” in het zoekveld, daaronder vijf parken uit vijf landen. | Eén naam, vijf parken. Daarom onthoudt de planner het pad uit de API en niet de naam.](/media/tagesplaner/planer-wizard-park-nl.webp)

Een plan wordt opgeslagen onder het pad dat de API zelf teruggeeft, nooit onder
een pad dat wij uit de getoonde naam in elkaar zetten. “Nederland” heet niet in
elke taal hetzelfde, en een geraden pad is een plan dat naar een 404 wijst.

De tweede vraag is de interessante: in plaats van een keuzelijst met zestig
regels krijg je een hele maand, en elke dag draagt de drukteverwachting van dat
park. “De zaterdag over twee weken” is daarmee een kwestie van één blik, en wat
we er verder over weten staat onder het rooster.

![Stap twee van de planner-wizard: boven het maandrooster een foto van Disneyland Park in Anaheim, elke dag draagt de drukteverwachting, zaterdag de 19e is gekozen. | Een september die in Anaheim de hele maand rustig voorspeld is. In zestig regels van een keuzelijst zie je dat niet.](/media/tagesplaner/planer-wizard-tag-nl.webp)

De derde vraag klinkt als een formulier en is belangrijker dan ze eruitziet:
lunchpauze inplannen, gaan er kinderen mee, wil je droog blijven. Alle drie zijn
markeringen op de attractielijst en geen filters, en de planner zet het op de
kaart: attracties met een hogere minimumlengte worden gemarkeerd, niet
verborgen. Een filter zou het park stiekem inkorten, en of oma de tassen
vasthoudt, weet alleen jij.

![Stap drie van de planner-wizard: drie kaarten voor de lunch, kinderen en waterattracties, daaronder de knop om het plan te openen. | Drie antwoorden die het park niet inkorten. De lunchpauze landt als blok om 12:30 in de dag en is te verschuiven.](/media/tagesplaner/planer-wizard-wer-nl.webp)

Daarna kom je op de parkpagina uit met de planner open, en van daaruit sleep je
attracties op de tijdlijn. Op elke attractiepagina zit daar ook een knop voor,
als slepen even onhandig is.

Hoe een afzonderlijk blok aan zijn hoogte komt, wat “Uit de dagprognose”
betekent en hoe een overstap wordt berekend, staat met een echte, bevroren
API-reactie om mee te spelen op de [plannerpagina](/dagplanner) zelf. Daar
verandert niets aan je eigen plan.

En komt je daarbij iets vreemd voor, een looptijd die niet klopt of een overstap
die het in het echt nooit had gehaald: schrijf me, het e-mailadres staat in het
[colofon](/impressum). De loopafstanden zijn het onderdeel dat wij het slechtst
meten, en iemand die er op dat moment staat weet het beter dan welke berekening
ook.

— Patrick
