import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wachttijd',
    shortDefinition:
      'De tijd die een bezoeker naar schatting in de rij staat voordat hij in een attractie kan instappen.',
    definition:
      'De wachttijd is hoe lang een bezoeker in de rij staat, van het moment dat hij aansluit in de gewone wachtrij van een attractie tot hij instapt. De wachttijd die bij de ingang en in de app van het park staat, is een schatting die het park zelf maakt, uit de lengte van de rij en het tempo waarin er op dat moment wordt ingestapt. Sommige parken controleren die schatting door een bezoeker achteraan in de rij een kaartje met de tijd mee te geven en dat op het perron weer af te lezen.\n\npark.fan leest elke vijf minuten de aangegeven wachttijd van elke attractie uit drie openbare bronnen: ThemeParks.wiki, Wartezeiten.app en Queue-Times.com. Zijn ze het oneens, dan beslist de meerderheid, daarna de mediaan en daarna het gemiddelde, en de uitkomst wordt afgerond op vijf minuten, zoals parken hun wachttijden ook tonen. Elke meting wordt bewaard. Uit die metingen komen de typische wachttijden op de pagina van een attractie, het drukteniveau en de voorspellingen.\n\nEen park dat geen wachttijden publiceert, heeft ze op park.fan ook niet.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Wachttijden', 'wachttijd'],
    alternateNames: ['Queue Time', 'Wachttijd in de rij'],
  },
  {
    id: 'median',
    name: 'Mediaan (P50)',
    shortDefinition:
      'De middelste waarde van een reeks: de helft van de metingen ligt eronder, de andere helft erboven.',
    definition:
      'De mediaan, ook P50 of 50e percentiel genoemd, is de waarde in het midden van een gesorteerde reeks. Bij wachttijden was de wachttijd bij de helft van de metingen korter en bij de andere helft langer. Eén uitschieter, zoals een storing met twee uur wachtrij, schuift de mediaan nauwelijks op, anders dan een gemiddelde.\n\nIn de attractietabellen van een park toont park.fan de mediaan als "Typisch", berekend als het gemiddelde van de uurmedianen. Op de pagina van een attractie is het de mediaan van de dagpieken: op de helft van de gemeten dagen bleef de langste wachtrij onder deze waarde. Beide beantwoorden dezelfde vraag, wat je op een gewone dag kunt verwachten, maar ze worden anders berekend en komen daarom niet overeen.',
    relatedTermIds: ['p90', 'wait-time', 'crowd-level'],
    aliases: ['Mediaan', 'P50', '50e percentiel', 'medianen'],
  },
  {
    id: 'p90',
    name: 'P90 (90e percentiel)',
    shortDefinition: 'De waarde waar negen van de tien metingen onder blijven.',
    definition:
      'P90, het 90e percentiel, is de waarde waar 90 procent van een reeks onder blijft. Bij wachttijden beschrijft het een drukke dag: bij negen van de tien metingen was de wachttijd korter, bij één langer.\n\nIn de attractietabellen van een park toont park.fan P90 als "Piek", berekend als het gemiddelde van de P90-waarden per uur. Op de pagina van een attractie is het het 90e percentiel van de dagpieken: op negen van de tien gemeten dagen bleef de langste wachtrij eronder, dus ongeveer de drukste dag van de tien. Beide getallen beantwoorden dezelfde vraag, wat je op een drukke dag kunt verwachten, maar worden anders berekend en komen daarom niet overeen.',
    relatedTermIds: ['median', 'wait-time', 'crowd-level'],
    aliases: ['P90', '90e percentiel', 'percentiel', 'percentielen'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Een aparte wachtrij voor bezoekers die bereid zijn alleen te rijden om lege plaatsen te vullen.',
    definition:
      'De single-riderrij is er voor iedereen die bereid is los van zijn gezelschap te rijden, en vult de losse vrije plaatsen in de treinen op. Omdat zulke passagiers tussen de gaten worden gezet, gaat het daar sneller dan in de gewone rij, vaak met 50–70% kortere wachttijden. Niet elke attractie heeft een single-riderrij.',
    alternateNames: ['Single Rider Lane', 'Individuele rij'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Single Riders'],
  },
  {
    id: 'virtual-queue',
    name: 'Virtuele wachtrij',
    shortDefinition:
      'Een digitaal wachtrijsysteem waarbij bezoekers een rijtijd reserveren in plaats van fysiek te wachten.',
    definition:
      'Bij een virtuele wachtrij (ook boarding group of terugkomtijd genoemd) meld je je via de parkapp of een kiosk aan voor een attractie en krijg je een melding als je beurt eraan komt. In plaats van in een echte rij te staan, kun je ergens anders in het park zijn tot je groep wordt opgeroepen. Parken gebruiken het voor hun populairste nieuwe attracties, waar een gewone rij meer mensen op één plek zou samenbrengen dan de paden aankunnen. Een virtuele wachtrij gaat meestal op een vast tijdstip open, vaak zodra de poorten opengaan, en kan binnen een paar minuten vol zijn.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Virtuele wachtrijen'],
  },
  {
    id: 'express-pass',
    name: 'Expresspas',
    shortDefinition:
      'Een betaalde of inbegrepen ticketupgrade die toegang geeft tot een kortere voorrangsrij.',
    definition:
      'Een expresspas (de naam verschilt per park: Universal Express, Disney Lightning Lane, Six Flags Flash Pass) is een ticketupgrade waarmee je via een aparte voorrangsingang naar binnen gaat, met veel kortere wachttijden. Sommige parken nemen expresstoegang op in hun duurdere hotelarrangementen; andere verkopen hem per dag als extra, tegen een prijs die stijgt naarmate het park voller wordt. In de Universal Studios-parken kun je met de onbeperkte versie de hele dag door steeds opnieuw in dezelfde attractie.',
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Expresspassen', 'Express Pas', 'Express Passen', 'Universal Express', 'Flash Pass'],
  },
  {
    id: 'posted-wait-time',
    name: 'Aangegeven wachttijd',
    shortDefinition:
      'De officiële wachttijd die het park bij de ingang van een attractie weergeeft.',
    definition:
      'De aangegeven wachttijd is de officiële schatting die bij de ingang van een attractie en in de park-app staat. Parken berekenen die uit de gemeten lengte van de rij, de doorstroom die de baan tot dan toe haalde en het tempo waarin op dat moment wordt ingeladen. park.fan brengt de aangegeven wachttijden uit meerdere openbare bronnen elke vijf minuten samen.',
    relatedTermIds: ['crowd-level', 'wait-time'],
    aliases: ['aangegeven wachttijd', 'aangegeven wachttijden'],
  },
  {
    id: 'crowd-level',
    name: 'Drukteniveau',
    shortDefinition:
      'Een schaal voor hoe druk een pretpark op een bepaalde dag is, van Zeer laag tot Extreem.',
    definition:
      'Het drukteniveau geeft aan hoe druk een park is op een bepaalde dag of op een bepaald uur. park.fan zet elk park af tegen zichzelf: 100 % is de wachttijd bij de grote attracties op een gewone dag in dat park, en de huidige wachttijden worden uitgedrukt als percentage daarvan. Tot 60 % is Zeer laag, 61 tot 89 % Laag, 90 tot 110 % Normaal, 111 tot 150 % Hoog, 151 tot 200 % Zeer hoog en alles daarboven Extreem. De voorspelde dagen in de druktekalender gebruiken dezelfde schaal.\n\nOmdat elk park zijn eigen maatstaf is, staat Extreem in een klein familiepark en in Disneyland Paris voor een ander aantal minuten, maar voor dezelfde situatie: rijen die twee keer zo lang zijn als normaal, of nog langer. Wat het niveau doet schuiven, zijn schoolvakanties, feestdagen, evenementen zoals Halloweenavonden of vuurwerk, en het weer.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Drukteniveaus', 'druktes'],
  },
  {
    id: 'crowd-calendar',
    name: 'Druktekalender',
    shortDefinition:
      'Een voorspelling van de drukte per dag, om de rustigste dagen voor een bezoek te vinden.',
    definition:
      'Een druktekalender toont de komende maanden van een park als een raster van dagen, elke dag in de kleur van het verwachte drukteniveau. Op park.fan komt die kleur van Fancast, het voorspellingsmodel dat park.fan zelf traint. Het berekent voor elke attractie en elk uur van een dag een verwachte wachttijd en vat die samen tot één drukteniveau voor de dag, op dezelfde schaal van Zeer laag tot Extreem als de live weergave.\n\nHet model leert van de wachttijden die park.fan in het park heeft gemeten. Daarnaast neemt het de weersverwachting mee, schoolvakanties, feestdagen en brugdagen in de landen waar de parken liggen, en wat er in het park te doen is, zoals een Halloweenseizoen of de eerste dagen van het jaar. Elke ochtend om 06:00 UTC wordt het opnieuw getraind op de wachttijden van de dag ervoor, en daardoor kan de kleur van een datum nog veranderen naarmate die dichterbij komt.\n\nDe kalender reikt zo ver als het schema van het park. Een park dat het hele jaar open is, krijgt een niveau voor dagen tot bijna een jaar vooruit; een seizoenspark toont na zijn gepubliceerde laatste openingsdag Gesloten.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['Druktekalenders'],
  },
  {
    id: 'peak-day',
    name: 'Piekdag',
    shortDefinition:
      'Een dag waarop het aantal bezoekers de maximale capaciteit van een park bereikt of benadert.',
    definition:
      'Een piekdag is elke dag waarop een park op of vlak bij zijn maximale capaciteit zit. Meestal gaat het om grote feestdagen (Kerstmis, Pasen), evenementdagen zoals Halloweenavonden en het vuurwerk op oudejaarsavond, en de weken van de schoolvakantie. Op een piekdag in Disneyland Paris of Europa-Park lopen de wachttijden bij de grote attracties geregeld op tot 90 à 120 minuten, en ruim voor de middag staan er al rijen bij de restaurants. In de druktekalender van park.fan staan zulke dagen op Zeer hoog of Extreem.',
    aliases: ['Piekdagen'],
    alternateNames: ['Drukke Dag', 'Hoogseizoen', 'Drukste dag'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Renovatie',
    shortDefinition:
      'Een geplande sluitingsperiode waarbij een attractie onderhoud ondergaat of wordt verbeterd.',
    definition:
      'Een renovatie (fans zeggen meestal kortweg refurb) is een geplande periode van onderhoud of verbouwing waarin een attractie, show of deel van het park dicht is. Dat kan een paar dagen duren of een paar maanden, en valt meestal in het laagseizoen. Parken maken hun renovatieplanning vooraf bekend, al schuiven de data nog wel eens op; Disney en Universal rouleren de sluitingen, zodat elk jaar andere attracties aan de beurt zijn. park.fan markeert attracties die op dit moment in renovatie zijn.',
    aliases: ['Renovaties'],
    alternateNames: ['Refurb', 'Onderhoudssluiting', 'Onderhoudsperiode'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Storing',
    shortDefinition:
      'Een ongeplande, tijdelijke sluiting van een attractie, vaak door een technisch defect.',
    definition:
      'Een storing is een onverwachte, tijdelijke sluiting van een attractie, iets anders dan een geplande renovatie. Oorzaken zijn mechanische defecten, sensorfouten, een veiligheidscontrole na een incident met een bezoeker, het weer (vooral onweer) of een dier op het terrein van de attractie. Meestal is het binnen een paar minuten tot een paar uur opgelost, maar bij een ingewikkeld mechanisch defect blijft een attractie soms de rest van de dag dicht. park.fan toont de actuele status van elke gevolgde attractie en maakt onderscheid tussen Open, Storing, Gesloten en Onderhoud.',
    aliases: ['Storingen'],
    alternateNames: ['Downtime', 'Buiten werking', 'Technische storing'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Capaciteit',
    shortDefinition: 'Het aantal bezoekers dat een attractie per uur kan vervoeren.',
    definition:
      'De capaciteit (of doorvoer) van een attractie is het aantal bezoekers dat ze per uur kan vervoeren als alles goed draait. Die volgt uit de grootte van de voertuigen, het aantal voertuigen dat rijdt, hoe snel het station in- en uitlaadt en de lengte van een ritcyclus. Draaimolens, boomstamattracties en grote dark rides verwerken 1.500 tot 2.000 bezoekers per uur; een dark ride met maar één voertuig of een achtbaan met één trein haalt er misschien 500 tot 800. De capaciteit bepaalt hoe snel een rij opschuift: bij 30 minuten wachten en 1.800 per uur stromen er drie keer zo snel mensen door als bij dezelfde 30 minuten en 600 per uur. Daarom zetten parken op drukke dagen extra treinen of voertuigen in.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Het moment waarop een park officieel zijn poorten opent en de rijen voor populaire attracties het kortst zijn.',
    definition:
      'De Rope Drop is het moment waarop een pretpark voor de dag opengaat. De naam komt van het touw (of de afzetting) dat het personeel laat zakken om de eerste bezoekers binnen te laten. Wie bij de Rope Drop al aan de poort staat, rijdt de populaire attracties terwijl hun rijen nog het kortst zijn. De exacte openingstijden staan in het schema van park.fan.',
    aliases: ['Rope-Drop'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 're-ride', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'Een exclusief voordeel waarmee hotelgasten het park vóór de reguliere opening kunnen betreden.',
    definition:
      'Met Early Entry (afhankelijk van het resort ook Early Park Entry, Extra Magic Hours of Magic Morning) mogen gasten van de hotels op het resort eerder het park in dan het grote publiek. Dat venster duurt meestal 30 tot 60 minuten, en alleen hotelgasten zijn dan binnen. Omdat de dagbezoekers nog voor de poort staan, zijn de rijen bij de deelnemende attracties een fractie van wat ze een uur later zijn: op een piekdag drie of vier topattracties met elk minder dan 20 minuten wachten, tegen 60 tot 90 minuten halverwege de ochtend. Niet elke attractie doet mee; het park publiceert de lijst.',
    aliases: ['Vroege toegang'],
    alternateNames: ['Extra Magic Hours', 'Vroeg Erin', 'Early Park Entry'],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Een ticketoptie waarmee bezoekers op één dag meerdere parken van hetzelfde resort bezoeken.',
    definition:
      'Met een Park Hopper-ticket kun je op één dag naar twee of meer parken van hetzelfde resort. Bij Disney wissel je op elk moment van de dag tussen Magic Kingdom, EPCOT, Hollywood Studios en Animal Kingdom; de regel dat hoppen pas vanaf 14:00 uur mocht, verdween in januari 2024. Het park-to-park-ticket van Universal Orlando verbindt Universal Studios Florida en Islands of Adventure, waartussen ook de Hogwarts Express rijdt, een attractie waar alleen houders van een park-to-park-ticket in mogen. PortAventura World heeft een combiticket voor PortAventura Park en Ferrari Land. Hoppen loont als de attractie waarvoor je komt in het tweede park staat, als er na een ochtend in het ene park een avondshow in het andere volgt, of bij een korte reis. De meerprijs tegenover een ticket voor één park verschilt per resort en loopt op piekdagen op.',
    aliases: ['Park-Hopper', 'Park Hoppers'],
    alternateNames: ['Park Hopping', 'Multi-park ticket'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Jaarkaart',
    shortDefinition: 'Een ticket waarmee je 12 maanden lang onbeperkt naar het park kunt.',
    definition:
      'Een jaarkaart (ook seizoenspas of annual pass) geeft twaalf maanden lang onbeperkt toegang tot één of meer parken. De duurdere varianten bieden meestal gratis of goedkoper parkeren, korting op eten, drinken en merchandise, en eerder kunnen boeken voor evenementen. De Jahrespass van Europa-Park, de Annual Pass van Disneyland Paris en de Merlin Annual Pass voor Alton Towers zijn drie Europese voorbeelden. Veel jaarkaarten hebben blokkadedagen (blockout dates) op de drukste dagen van het jaar; zo houden parken jaarkaarthouders weg uit een park dat al vol zit. Vanaf zo’n drie of vier bezoeken per jaar kost een jaarkaart minder dan de losse dagkaarten. Sommige geven ook korting bij partnerparken.',
    aliases: ['Seizoenspas', 'Jaarkaarten', 'Seizoenspassen', 'jaarabonnement', 'jaarabonnementen'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Jaarticket', 'Jaarabonnement'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Minimumlengte',
    shortDefinition:
      'Een minimumlengte die bezoekers moeten hebben om een specifieke attractie te mogen betreden.',
    definition:
      'Een minimumlengte is een veiligheidsregel waarmee een park zorgt dat de beveiliging (heupbeugels, schouderbeugels en gordels) bij elke passagier goed aansluit. De grens ligt tussen ongeveer 90 cm bij rustige familieachtbanen en 140 cm bij de heftigste attracties. Een paar attracties hebben ook een maximumlengte of een gewichtslimiet, al komt dat minder vaak voor. Parkwebsites en apps publiceren per attractie een lengtetabel, die je beter vóór een dagje uit met het gezin bekijkt dan pas bij de ingang van de attractie. Is een kind te klein, dan hebben de meeste parken een rider switch, zodat de volwassenen om de beurt kunnen rijden zonder twee keer in de rij te staan.',
    aliases: ['Minimumlengtes', 'minimumlengte-eisen'],
    alternateNames: ['Lengtebeperking', 'Lengte-eis', 'Vereiste lengte'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Themagebied',
    shortDefinition:
      'Een zelfstandige zone binnen een pretpark gebouwd rondom een samenhangend thema.',
    definition:
      'Een themagebied is een afgebakend deel van een park met één visuele stijl, één achtergrondverhaal en daarbij passende attracties, restaurants en winkels. Wie de ingang passeert, hoort het gevoel te krijgen dat hij ergens anders binnenstapt. The Wizarding World of Harry Potter bij Universal, Star Wars: Galaxy’s Edge bij Disney, Klugheim in Phantasialand en Scandinavië in Europa-Park zijn vier voorbeelden. Een nieuw themagebied trekt zelf ook publiek: het openingsseizoen brengt media-aandacht en een zichtbare piek in het aantal bezoekers. En omdat een gebied meestal één topattractie met een lage capaciteit combineert met een paar attracties met een hoge capaciteit, kunnen de wachttijden binnen hetzelfde gebied een uur verschillen.',
    aliases: ['Themagebieden'],
    alternateNames: ['Zone', 'Land', 'Themawereld'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'De onofficiële opening van een attractie vóór de aangekondigde lanceringsdatum.',
    definition:
      'Bij een Soft Opening laat een park bezoekers al vóór de officiële datum in een nieuwe attractie of zone, meestal zonder aankondiging. Parken testen zo de systemen onder normale bedrijfsomstandigheden, sporen problemen in de bediening op en slijpen het in- en uitladen in. Een Soft Opening kan zonder waarschuwing beginnen en weer stoppen, dus je kunt je bezoek er niet op plannen. Het nieuws staat doorgaans het eerst op fanforums en sociale media.',
    alternateNames: ['Soft Launch', 'Zachte opening'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition: 'De normale wachtrij van een attractie, zonder reservering of speciale pas.',
    definition:
      'De Standby-rij is de standaard fysieke wachtrij die alle bezoekers zonder extra ticket of upgrade kunnen gebruiken. Wie in de Standby-rij staat, komt aan de beurt in volgorde van aankomst, en de aangegeven wachttijd stijgt en daalt met de drukte bij de attractie. Op drukke dagen kunnen Standby-tijden bij topattracties oplopen tot meer dan 90 minuten. park.fan houdt de Standby-wachttijden real-time bij.',
    aliases: ['Standby-rij', 'standby'],
    alternateNames: ['Normale Wachtrij', 'Reguliere Rij', 'Gewone wachtrij'],

    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Disney’s betaalde prioriteitsrijsysteem, de opvolger van het vroegere FastPass+-programma.',
    definition:
      'Lightning Lane is de naam van het voorrangssysteem waarmee Disney eind 2021 FastPass+ verving. Sinds juli 2024 verkoopt Walt Disney World het als Lightning Lane Single Pass (tot dan Individual Lightning Lane, ILL), per persoon en per attractie voor de drukst bezochte attracties, en als Lightning Lane Multi Pass (LLMP), een aankoop per dag waarmee je terugkomtijden boekt voor een selectie attracties. Beide zijn al dagen voor het bezoek te boeken, hebben een dynamische prijs en kosten meer op drukkere dagen. Een derde, duurdere variant, Lightning Lane Premier Pass, geeft één keer toegang tot elke deelnemende attractie. Omdat het iets vervangt dat gratis was, is er nog altijd discussie over. Wat het oplevert, hangt van de dag af: op een rustige dag gaat de gewone rij zo snel dat het weinig uitmaakt, op een piekdag kan een Single Pass voor Tron of Radiator Springs Racers het verschil zijn tussen wel of niet rijden. De dagen waarop lange wachtrijen worden verwacht, staan gemarkeerd in de druktekalender van park.fan.',
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'Lightning Lanes',
      'Lightning Lane Multi Pass',
      'Lightning Lane Single Pass',
      'Lightning Lane Premier Pass',
    ],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disney’s voormalige dagelijkse add-on die Lightning Lane Multi Pass-toegang bood voor de meeste attracties.',
    definition:
      'Genie+ was de betaalde dagoptie van Disney die in 2021 het gratis FastPass+ verving, in Walt Disney World en in Disneyland. Voor een bedrag per persoon per dag kon je telkens één Lightning Lane-terugkomtijd tegelijk reserveren, voor een ruime selectie attracties, tegen een prijs die op de drukste dagen hoger lag. De grootste topattracties vielen erbuiten en werden apart verkocht als Individual Lightning Lane. In juli 2024 vervingen beide resorts het door Lightning Lane Multi Pass, die je in Walt Disney World al dagen voor het bezoek kunt boeken in plaats van op de dag zelf; Individual Lightning Lane werd Lightning Lane Single Pass. De oude naam duikt nog overal op in tripverslagen uit die tijd.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Een genummerde toewijzing in het virtuele wachtrij-systeem die toegang geeft tot een attractie wanneer de groep wordt opgeroepen.',
    definition:
      'Een Boarding Group is een genummerde toewijzing binnen een virtueel wachtrij-systeem, gebruikt voor de meest gevraagde nieuwe attracties waar een fysieke rij onpraktisch zou zijn. Bezoekers melden zich aan via de park-app – vaak zodra het park opent – en ontvangen een groepsnummer. Wanneer dat nummer wordt opgeroepen, hebben ze een beperkt tijdvenster om zich bij de attractie te melden. Op drukke dagen kunnen alle Boarding Groups binnen enkele minuten vol zijn. Disney gebruikte het onder meer bij Tron Lightcycle Run en Star Wars: Rise of the Resistance.',
    aliases: ['Boarding Groups'],

    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Laagseizoen',
    shortDefinition: 'Periodes met minder bezoekers, kortere wachtrijen en lagere prijzen.',
    definition:
      'Het laagseizoen zijn de rustigere periodes in de kalender, wanneer scholen open zijn en er geen grote feestdagen vallen – doorgaans januari tot begin februari, half september tot oktober (buiten Halloween-evenementen) en de eerste weken van november. In het laagseizoen kunnen wachttijden voor populaire attracties aanzienlijk korter zijn, zijn ticketprijzen vaak het laagst en voelen parken veel minder druk aan. Wie zijn bezoekdag vrij kan kiezen, kiest daarom het best een dag in het laagseizoen. De druktekalender van park.fan markeert de rustige periodes van elk park.',
    alternateNames: ['Rustige Periode', 'Laagseizoensperiode', 'Laagseizoen'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'Seizoenssluiting',
    shortDefinition:
      'De periode waarin een park helemaal dicht is voor onderhoud, nieuwe attracties of een winterstop, en geen bezoekers ontvangt.',
    definition:
      'De seizoenssluiting (OffSeason) is het deel van het jaar waarin een park helemaal dicht is, zonder attracties, restaurants of shows. Dat is iets anders dan het laagseizoen, als een park wel open is maar rustig. Veel parken met een buitenseizoen sluiten tussen november en maart of april, sommige met een winterseizoen of een paar kerstweekenden ertussen; parken in een warm klimaat of met de meeste attracties binnen hebben er vaak geen.\n\nDe gesloten maanden zijn voor het werk dat niet kan met bezoekers in het park: de jaarlijkse keuringen, onderhoud aan baan en treinen, grotere renovaties en de bouw van nieuwe attracties.\n\nToont park.fan Buiten seizoen voor een park, dan is er voor de huidige periode geen openingsschema en ligt de volgende bevestigde openingsdag nog een paar weken weg. De druktekalender markeert de gesloten dagen als Gesloten, en de datum van de heropening verschijnt zodra het park die bekendmaakt.',
    aliases: ['Off-Season'],
    alternateNames: ['Wintersluiting', 'Seizoenssluiting', 'Seizoenspauze'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Ritfoto',
    shortDefinition:
      'Een automatisch gemaakte foto of video van bezoekers tijdens een attractie, na afloop te koop aangeboden.',
    definition:
      'De ritfoto wordt automatisch gemaakt door een vaste camera op een vast punt van de rit, meestal de val bij een waterattractie of het hoogtepunt van een achtbaan. Na de rit kunnen bezoekers hun foto bekijken bij een kiosk of in de park-app en kiezen of ze hem willen kopen. Veel parken verkopen dagpakketten met onbeperkte ritfoto’s van alle attracties in het resort.',
    aliases: ['Rit-Foto', 'On-Ride Foto', 'Attractiefoto'],

    relatedTermIds: ['onride-offride', 'themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Wachtrij',
    shortDefinition:
      'Het fysieke wachtgebied dat bezoekers doorlopen voor ze een attractie betreden, vaak aangekleed in het thema van de attractie.',
    definition:
      'De wachtrij is de fysieke ruimte (gangen, buitenserpentines of thematisch aangeklede zalen binnen) die bezoekers doorlopen terwijl ze wachten om op een attractie te stappen. In veel moderne pretparken hoort de wachtrij bij het verhaal van de attractie. Bij de Haunted Mansion van Disney is de rij al aangekleed als het spookhuis, en bij de Harry Potter-attracties van Universal is de wachtrij ingericht in de stijl van de films.',
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Wachtrijen'],
  },
  {
    id: 'opening-day',
    name: 'Openingsdag',
    shortDefinition: 'De officiële lanceringsdatum van een nieuw park, themagebied of attractie.',
    definition:
      'De openingsdag is de officieel aangekondigde datum waarop een nieuw park, uitbreiding of attractie voor het eerst openstaat voor het grote publiek. Er is doorgaans veel pers, de rijen zijn lang en parken houden vaak een openingsceremonie met extra shows en optredens van personages. Wie een nieuwe attractie met een korte wachttijd wil rijden, kan de openingsdag dus beter overslaan. Soft Openings gaan soms aan de officiële openingsdag vooraf.',
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'Een systeem waarmee begeleiders om beurten kunnen rijden terwijl de ander wacht met kinderen die niet aan de minimumlengte voldoen.',
    definition:
      'Rider Switch (ook wel Child Swap genoemd) bestaat in de meeste grote pretparken. Een groep rijdt dan om beurten wanneer één lid niet mee kan, meestal een jong kind dat niet aan de minimumlengte voldoet. Eén volwassene rijdt terwijl de ander bij de ingang wacht met het kind; als de eerste volwassene terugkeert, mag de tweede direct instappen zonder opnieuw in de standby-rij te staan. Bij Disney-parken heet dit systeem Rider Switch; bij Universal is het Child Swap. Op drukke dagen spaart de tweede volwassene zo de volledige wachttijd uit. Vraag het attractiepersoneel aan de ingang om dit te activeren.',
    alternateNames: ['Child Swap', 'Rider Switch', 'Kind Wissel', 'Baby Wissel'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Datum',
    shortDefinition:
      'Een datum waarop bepaalde niveaus van de jaarkaart niet geldig zijn voor parktoelating, doorgaans op de drukste dagen van het jaar.',
    definition:
      'Blockout datums (ook wel blackout dates genoemd) zijn specifieke kalenderdagen waarop bepaalde jaarkaart-niveaus niet geldig zijn voor toegang. Parken stellen blockout datums in om de capaciteit op de drukste dagen te beheersen – piekdagen, vakantieweekenden en grote evenementdagen. Hogere niveaus hebben weinig of geen blockout datums, terwijl goedkopere jaarkaarten soms op 30–60 dagen per jaar geblokkeerd zijn. Heb je een beperkte jaarkaart, kijk dan altijd eerst in de blockout-kalender voordat je gaat.',
    aliases: ['Geblokkeerde dagen'],
    alternateNames: ['Blackout Datum', 'Blackout Date', 'Uitsluitingsdatum'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evenement met apart ticket',
    shortDefinition:
      'Een apart betaald evenement, meestal in de avond, waarvoor je naast een gewoon parkticket een eigen toegangsbewijs nodig hebt.',
    definition:
      'Een speciaal evenement (hard ticket event) is een apart betaald avondevenement in een pretpark, met een eigen toegangsbewijs naast of in plaats van een dagticket. Er zijn shows, seizoensdecoratie en walkthroughs die de gewone parkdag niet heeft. Voorbeelden zijn Mickey’s Not-So-Scary Halloween Party en Mickey’s Very Merry Christmas Party in Walt Disney World, Halloween Horror Nights in Universal Studios en Traumatica in Europa-Park, waarvoor een eigen avondticket bestaat. Op evenementdagen moeten de gewone dagbezoekers aan het eind van de middag of het begin van de avond het park uit; in Magic Kingdom begint de Halloweenparty om 19:00 uur, en de laatste uren daarvoor zijn ongewoon druk, omdat iedereen nog een laatste rit wil meepakken. De kaartjes gaan maanden vooraf in de verkoop, en de populaire Halloweenavonden zijn weken voor de datum uitverkocht.',
    aliases: ['Speciale evenementen'],
    alternateNames: ['Avondevenement', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'Disney’s vroegere gratis prioriteitswachtrij-systeem, in Walt Disney World in 2021 vervangen door het betaalde Lightning Lane.',
    definition:
      'FastPass (geïntroduceerd in 1999) was Disney’s gratis prioriteitswachtrij-systeem waarmee gasten terugkeertijdslots voor attracties konden reserveren zonder extra kosten. Alleen Walt Disney World stapte over op FastPass+: daar konden gasten via de My Disney Experience-app tot drie reserveringen per dag boeken. Het systeem werd in 2020 tijdens de COVID-19-sluiting opgeschort, nooit heringevoerd en in 2021 vervangen door het betaalde Lightning Lane-systeem. Met die overstap werd een gratis voordeel een betaalde dienst. Disneyland Paris had de papieren FastPass en verkoopt nu Premier Access. Oudere reisverslagen gaan nog uit van FastPass+.',
    aliases: ['FastPass+', 'FastPass Plus', 'Fast Pass'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Terugkomsttijd',
    shortDefinition:
      'Een gereserveerd tijdvenster om terug te keren naar een attractie, uitgegeven door Lightning Lane, virtuele wachtrij of vergelijkbare prioriteitssystemen.',
    definition:
      'Een terugkomsttijd (soms terugkomstvenster genoemd) is een specifieke periode – doorgaans een blok van één uur – waarbinnen een gast die prioriteitstoegang heeft geboekt (via Lightning Lane, een virtuele wachtrij of een vergelijkbaar systeem) zich bij de speciale ingang van de attractie kan melden. In de tussentijd kan de gast elders in het park rondlopen in plaats van in de rij te staan. Wie meer dan een vastgesteld aantal minuten te laat komt, verliest doorgaans zijn reservering.',
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Terugkomsttijden'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time – een sessie waarbij een groep enthousiastelingen of hotelgasten exclusieve toegang heeft tot één of meer attracties zonder reguliere publiekswachtrij.',
    definition:
      'ERT (Exclusive Ride Time) is een periode waarin een bepaalde groep één of meer attracties voor zich alleen heeft, zonder het gewone publiek: leden van een achtbaanclub, hotelgasten met een premiumarrangement of jaarkaarthouders tijdens een speciaal evenement. Tijdens ERT rijden dezelfde mensen steeds opnieuw, bijna zonder wachttijd, en halen ze vaak tientallen ritten in één sessie. Parken organiseren het voor clubbijeenkomsten (European Coaster Club, American Coaster Enthusiasts en tientallen nationale verenigingen), voor hotelarrangementen met toegang voor of na openingstijd, en als onderdeel van hard-ticketevenementen. Vijftien of twintig ritten achter elkaar, op verschillende plekken in de trein en op verschillende momenten van de dag, laten het karakter van een achtbaan zien op een manier die één rit in een vol park niet kan.',
    aliases: ['ERT'],
    alternateNames: ['Exclusive Ride Time', 'Exclusieve rijtijd'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 're-ride', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Een gedetailleerd dagschema voor een pretparkbezoek dat de attracties zo ordent dat je zo kort mogelijk wacht en zo vaak mogelijk rijdt.',
    definition:
      'Een Touring Plan is een vooraf vastgelegde volgorde van attracties, maaltijden en looproutes door het park, bedoeld om de totale wachttijd van de dag zo klein mogelijk te houden. Wie een goed plan opstelt, houdt rekening met de delen van het park die het eerst vollopen, de capaciteit van de attracties, het verloop van de rijen, de showtijden en het weer. Sites zoals TouringPlans.com publiceren gedetailleerde plannen voor grote parken.',
    aliases: ['Touring Plan'],
    alternateNames: ['Bezoeksplan', 'Parkplan', 'Bezoeksstrategie'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Een overdekte attractie waarbij bezoekers in voertuigen door een donkere, thematisch ingerichte ruimte worden geleid met animatronics, projecties of speciale effecten.',
    definition:
      'Een dark ride is een overdekte attractie waarin bezoekers in voertuigen langs gethematiseerde scènes rijden: karretjes op een vaste baan of zonder rails, bootjes in een watergoot of gondels aan een rail boven het hoofd. De naam verwijst naar de gecontroleerde verlichting, waarin projecties, animatronics en echte decors hun werk kunnen doen. Dark rides lopen uiteen van rustige familieklassiekers (it’s a small world, Pinocchio’s Daring Journey) tot lange verhalende attracties zoals Star Wars: Rise of the Resistance. Bij een trackless dark ride hebben de voertuigen geen rails en worden ze via de vloer gestuurd, zodat ze een scène uit meerdere richtingen kunnen naderen en twee voertuigen niet dezelfde route hoeven te nemen; Symbolica in de Efteling en Ratatouille in Disneyland Paris zijn de Europese voorbeelden. Een dark ride vervoert meestal meer bezoekers per uur dan een achtbaan, en daarom leunen parken er op drukke dagen op.',
    aliases: ['Dark Rides'],
    alternateNames: ['Binnenattractie', 'Overdekte attractie'],

    relatedTermIds: [
      'height-requirement',
      'ride-capacity',
      'soft-opening',
      'suspended-dark-ride',
      'themed-land',
      'vr-coaster',
      'wait-time',
    ],
  },
  {
    id: 'suspended-dark-ride',
    name: 'Hangende dark ride',
    shortDefinition:
      'Een dark ride waarvan de voertuigen aan een rail onder het plafond hangen en boven de decors langs gaan.',
    definition:
      'Bij een hangende dark ride loopt de rail onder het plafond van de hal en hangen de voertuigen eraan. Bezoekers kijken van bovenaf op de decors, en de vloer blijft vrij voor scènes die als een landschap onder hen liggen. Peter Pan’s Flight vaart met kleine piratenschepen over Londen en Nooitgedachtland; Disneyland heeft de rit sinds 1955, Magic Kingdom sinds 1971 en Disneyland Paris sinds 1992. In de Droomvlucht in de Efteling (1993) gaan open gondels door een sprookjeswereld, en bij E.T. Adventure in Universal Studios Florida (1990) zit je op een fiets, net als in de achtervolging uit de film.\n\nHet verschil met een suspended coaster zit in de snelheid. De voertuigen gaan zo langzaam als de scènes vragen en halen nooit de snelheid waarbij de wagens van een achtbaan in een bocht als een slinger uitzwaaien.',
    relatedTermIds: ['dark-ride', 'suspended-coaster', 'animatronics', 'omnimover'],
    aliases: ['Hangende dark rides'],
    alternateNames: ['Suspended dark ride'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, een Zwitserse achtbaanfabrikant bekend om soepele, betrouwbare ritten en kenmerkende elementen zoals de Immelmann, cobra roll en zero-G roll.',
    definition:
      'B&M (Bolliger & Mabillard) is een Zwitserse achtbaanfabrikant, opgericht in 1988 door Walter Bolliger en Claude Mabillard. B&M-banen rijden soepel en vallen weinig uit. Ze werken vooral met positieve G-krachten, hebben een vaste set inversies (Immelmann, cobra roll, zero-G roll) en een hoge doorstroom. B&M is gespecialiseerd in inverted coasters, sit-down loopers, hyper coasters (boven 61 m), giga coasters (boven 91 m), wing coasters en dive machines. Vrijwel elk groot Europees park heeft minstens één B&M-installatie, waaronder Shambhala en Dragon Khan bij PortAventura, Silver Star bij Europa-Park en Nemesis bij Alton Towers.',
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: [
      'cobra-roll',
      'dive-coaster',
      'hybrid-coaster',
      'immelmann',
      'smoothness',
      'stand-up-coaster',
      'zero-g-roll',
    ],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "Een Zwitserse achtbaan- en attractiefabrikant van hydraulische launches en mega- en giga coasters, en de bouwer van veel van 's werelds snelste en hoogste achtbanen.",
    definition:
      'Intamin AG is een Zwitserse attractiefabrikant, opgericht in 1967, met meerdere hoogte- en snelheidsrecords voor achtbanen op zijn naam. Het hydraulische lanceersysteem van Intamin dreef jarenlang de snelste en hoogste achtbanen aan: Kingda Ka (139 m), dat in 2024 sloot en in 2025 werd gesloopt, en Top Thrill Dragster, dat in 2024 werd omgebouwd tot Top Thrill 2. Intamin bouwt ook mega- en giga coasters (waaronder Millennium Force bij Cedar Point en Intimidator 305 bij Kings Dominion), multi-launch coasters, waterattracties en dark rides. Europese Intamin-installaties zijn onder meer Taron in Phantasialand, Expedition GeForce in Holiday Park en Red Force in Ferrari Land.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
    aliases: ['Intamin AG'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Een Duits familiebedrijf uit Waldkirch bij Europa-Park dat waterattracties, dark rides en steeds meer stalen achtbanen bouwt.',
    definition:
      'Mack Rides is een Duitse attractiefabrikant in Waldkirch, Baden-Württemberg, op enkele kilometers van Europa-Park, dat net als het bedrijf in handen is van de familie Mack. Paul Mack begon het bedrijf in 1780 als wagenmakerij. Tegenwoordig bouwt Mack waterattracties, dark rides en steeds meer achtbanen. De Blue Fire Megacoaster in Europa-Park (2009) heeft een Stengel Dive. Recentere Mack-banen zijn de hyper coaster Hyperia in Thorpe Park (2024, 72 m) en The Ride to Happiness in Plopsaland, een gelanceerde Xtreme Spinning Coaster.',
    aliases: ['Mack'],

    relatedTermIds: [
      'b-and-m',
      'bobsled-coaster',
      'intamin',
      'launch-coaster',
      'mackprodukt',
      'powered-coaster',
      'splashdown',
      'stengel-dive',
      'water-coaster',
    ],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction, een Amerikaanse fabrikant die de hybride achtbaan bedacht door verouderde houten achtbanen om te bouwen met stalen I-box-rails, zodat airtime en inversies mogelijk werden die op hout niet konden.',
    definition:
      'Rocky Mountain Construction (RMC) is een Amerikaanse achtbaanfabrikant en onderhoudsbedrijf uit Hayden, Idaho. RMC vond het stalen I-box-spoor uit, dat op de constructie van een houten achtbaan kan worden gelegd. Zo konden parken ruwe, verouderde houten achtbanen ombouwen tot hybride banen met sterke airtime, meerdere inversies en voorbij-verticale drops. Op een traditioneel houten spoor kon dat niet. Voorbeelden van RMC-conversies zijn Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) en Untamed (Walibi Holland, 2019), de omgebouwde houten achtbaan Robin Hood. Wildfire in Kolmården (2016) bouwde RMC helemaal nieuw, als zijn eerste baan in Europa.',
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: [
      'airtime',
      'barrel-roll-drop',
      'hybrid-coaster',
      'single-rail-coaster',
      'stall',
      'wooden-coaster',
    ],
  },
  {
    id: 'rcca',
    name: 'Roller Coaster Corporation of America (RCCA)',
    shortDefinition:
      'Amerikaanse bouwer van houten achtbanen uit Atlanta, opgericht in 1979 en in 2005 opgeheven. In Europa staan van RCCA onder meer The Bandit in Movie Park Germany en Coaster Express in Parque Warner Madrid.',
    definition:
      'Roller Coaster Corporation of America (RCCA) uit Atlanta bouwde houten achtbanen. Delen van de houten constructie en de rails maakte het bedrijf vooraf in eigen werkplaatsen en zette ze in het park in elkaar, wat de bouwtijd verkortte. De eerste grote baan was Rattler in Six Flags Fiesta Texas in 1992, de bekendste Son of Beast in Kings Island (2000), toen de hoogste houten achtbaan ter wereld en de eerste moderne houten achtbaan met een inversie. Son of Beast is afgebroken, en Rocky Mountain Construction heeft Rattler omgebouwd tot Iron Rattler.\n\nIn Europa bouwde RCCA drie banen: The Bandit in Movie Park Germany (1999), Magnus Colossus in Terra Mítica (2000, gesloten) en Coaster Express in Parque Warner Madrid (2002), de laatste van het bedrijf. In 2005 stopte RCCA.',
    aliases: ['Roller Coaster Corporation of America', 'RCCA'],
    relatedTermIds: ['wooden-coaster', 'gci', 'rmc'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Nederlandse achtbaanfabrikant en een van de grootste ter wereld, bekend om de Boomerang, die bijna overal staat, en om een breed scala aan familie- en thrillachtbanen in Europese pretparken.',
    definition:
      'Vekoma Rides Manufacturing is een Nederlandse achtbaanfabrikant gevestigd in Vlodrop en een van de meest productieve producenten ter wereld qua totale installaties. Vekoma werd in 1926 opgericht als machinebouwbedrijf, stapte in de jaren 70 over naar attracties en werd wereldwijd bekend met de Boomerang, een compacte shuttle-achtbaan met drie inversies die goedkoop in licentie werd gegeven en overal ter wereld is gebouwd. Andere modellen zijn de Suspended Looping Coaster (SLC), de Giant Inverted Boomerang en de Mine Train. Sinds de jaren 2010 bouwt Vekoma een nieuwe generatie banen (“new generation”) met soepeler rijdende treinen, nieuwe lay-outs en nieuwe familieattracties. Nieuwe modellen zoals de Family Boomerang, de Tilt Coaster en hangende familieachtbanen verschijnen steeds vaker in Europese parken. Disney heeft ook op maat gemaakte Vekoma-ontwerpen besteld voor zijn resorts.',
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Duitse fabrikant die het best bekend staat om het Euro-Fighter-model met zijn voorbij-verticale eerste helling, en om spinning coasters en compacte familieritten.',
    definition:
      'Gerstlauer Amusement Rides GmbH is een Duitse achtbaanfabrikant gevestigd in Münsterhausen, Beieren. Hubert Gerstlauer richtte het bedrijf in 1982 op. Internationaal bekend werd het met de Euro-Fighter, een compacte achtbaan met een verticale kettinglift en een drop tot 121 graden (Takabisha in Fuji-Q Highland, 2011). Omdat een Euro-Fighter op een klein terrein past, staat hij vaak in stadsparken en kleinere parken, zoals Rage bij Adventure Island. Gerstlauer bouwt ook het Infinity Coaster-model, spinning coasters en de SkyRoller, een achtbaan waarop rijders zelf bepalen hoe vaak hun stoel over de kop draait.',
    aliases: ['Gerstlauer Rides', 'Gerstlauer Amusement Rides'],

    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Duitse fabrikant van looping-achtbanen uit de jaren 70 en 80, waarvan er in Europese pretparken nog veel rijden.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG was een Duitse achtbaanfabrikant gevestigd in Münsterhausen, Beieren, dezelfde plaats waar Gerstlauer zich later vestigde. Het familiebedrijf bouwde vanaf 1954 attracties, Anton Schwarzkopf nam het in 1960 over, en het bracht de looping-achtbaan naar Europa. De eerste moderne looping-achtbaan ter wereld, de Revolution in Six Flags Magic Mountain (1976), is een ontwerp van Schwarzkopf. Bekende modellen zijn de Looping Star, de Thriller/Wildcat en de verplaatsbare Looping Coaster, die door heel Europa reisde. Schwarzkopf-banen rijden zeer soepel en halen veel uit een compacte lay-out. Het bedrijf ging in 1983 failliet en in 1992 definitief, maar veel installaties zijn decennia later nog steeds in bedrijf. Gerstlauer nam de productiehallen over. Het onderhoud wordt nu verzorgd door gespecialiseerde bedrijven of door Gerstlauer.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
    aliases: ['Anton Schwarzkopf'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Een achtbaan die bezoekers van 0 naar hoge snelheid versnelt via een magnetisch, hydraulisch of pneumatisch lanceersysteem in plaats van een traditionele chain lifthill.',
    definition:
      'Een launch coaster heeft geen kettinglift maar een aandrijving die de trein in een paar seconden van stilstand naar volle snelheid brengt. De technieken zijn LSM (linear synchronous motor), waarbij elektromagnetische spoelen een vin onder de trein versnellen; LIM (linear induction motor), vergelijkbaar maar minder efficiënt; hydraulische lanceringen, het kabel-en-zuigersysteem van Intamin achter recordbanen als Kingda Ka, die tot de sluiting in 2024 in 3,5 seconden van 0 naar 206 km/u ging; en perslucht. Sommige achtbanen lanceren twee of drie keer per rit om op een lang parcours de energie op peil te houden. Taron in Phantasialand heeft twee LSM-lanceringen door een gethematiseerd rotslandschap en was bij de opening de snelste multi-launch-achtbaan ter wereld; Red Force in Ferrari Land haalt met een LSM-lancering 180 km/u in vijf seconden. LSM is inmiddels de standaard voor nieuwe gelanceerde achtbanen in Europa.',
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Gelanceerde Achtbaan', 'Katapult-achtbaan'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters', 'Accelerator Coaster'],
  },
  {
    id: 'wooden-coaster',
    name: 'Houten achtbaan',
    shortDefinition:
      'Een achtbaan die voornamelijk van hout is gebouwd, met een typisch gerommel, zijwaartse beweging en onvoorspelbare airtime.',
    definition:
      'Een houten achtbaan is een achtbaan met een houten spoor en draagconstructie. Hout buigt mee en is minder maatvast dan staal. Daardoor rommelt de baan, schudt de trein zijwaarts en valt de airtime minder voorspelbaar uit. Bekende houten achtbanen zijn Balder bij Liseberg, The Beast bij Kings Island en Megafobia bij Oakwood. Houten achtbanen hebben voortdurend onderhoud nodig, want het spoor moet regelmatig deels worden vernieuwd, en ze zijn gevoelig voor weersveranderingen. Met een RMC-conversie kan een verouderde houten achtbaan een stalen spoor krijgen terwijl de houten constructie blijft staan.',
    relatedTermIds: ['airtime', 'cci', 'hybrid-coaster', 'ptc', 'quad-down', 'rattle', 'rmc'],
    aliases: ['Houten achtbanen'],
    alternateNames: ['Woodie', 'Woodies', 'Houten coaster'],
  },
  {
    id: 'steel-coaster',
    name: 'Stalen achtbaan',
    shortDefinition:
      'Een achtbaan met een stalen rail en een stalen constructie, die soepel en nauwkeurig rijdt.',
    definition:
      'Een stalen achtbaan wordt gebouwd met buisvormige of platte stalen rail ondersteund door een stalen frame. Staal buigt niet mee zoals hout, dus ontwerpers kunnen G-krachten, overgangen en inversies nauwkeurig vastleggen. Daardoor zijn complexe lay-outs mogelijk met meerdere inversies, krappe bochten en snelle stukken.\n\nDe meeste nieuwe achtbanen zijn van staal. Bekende voorbeelden in Europa zijn Shambhala in PortAventura, Nemesis in Alton Towers en Silver Star in Europa-Park. Stalen achtbanen variëren van kleine familieattracties tot recordbrekende mega coasters. Ook staal moet regelmatig worden geïnspecteerd en onderhouden, en het vergeeft minder ontwerpfouten dan het meebuigende hout.',
    relatedTermIds: [
      'bobsled-coaster',
      'hyper-coaster',
      'inversion',
      'launch-coaster',
      'single-rail-coaster',
      'stand-up-coaster',
      'wooden-coaster',
    ],
    aliases: ['Stalen achtbanen', 'Staal'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Een coaster waarbij de trein onder het spoor aan een scharnier hangt, waardoor het voertuig vrij opzij kan zwaaien.',
    definition:
      'Een suspended coaster is een achtbaan waarbij de trein aan een scharnierpunt onder het spoor hangt en vrij van links naar rechts kan zwaaien. In een bocht zwaait de trein als een slinger naar buiten, en aan het eind van de bocht zwiept hij terug. Hoe ver hij uitzwaait, verschilt van rit tot rit. Bij een inverted coaster hangt de trein ook onder het spoor, maar vast, zonder te zwaaien.\n\nSuspended coasters zijn zeldzamer dan inverted coasters. Door het uitzwaaien hangt de trein ook in een flauwe bocht schuin in de lucht. Het Suspended Looping Coaster (SLC)-model dat Vekoma in de jaren 90 ontwikkelde, is ondanks de naam een inverted coaster op een vaste baan, zonder zwaaiende trein; er zijn er ongeveer 40 van gebouwd.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'suspended-dark-ride', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Hangende achtbaan', 'Slingerende achtbaan'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybride achtbaan',
    shortDefinition:
      'Een achtbaan die een traditionele houten draagconstructie combineert met een stalen I-box-spoor, een techniek die Rocky Mountain Construction (RMC) heeft ontwikkeld.',
    definition:
      'Een hybride achtbaan combineert de houten constructie van een traditionele achtbaan met een stalen I-box-spoor van Rocky Mountain Construction (RMC). Het I-box-spoor is uiterst precies en soepel. Daarop zijn inversies mogelijk die op een traditioneel houten spoor niet kunnen. RMC ontwikkelde het spoor vooral om verouderde houten achtbanen te renoveren die te ruw waren geworden, en voegde daarbij inversies, steilere drops en airtime hills toe. Bekende RMC-hybriden zijn Steel Vengeance bij Cedar Point, Twisted Colossus bij Six Flags Magic Mountain en Untamed bij Walibi Holland (2019), de omgebouwde houten achtbaan Robin Hood. Naast de conversies bouwt RMC ook nieuwe hybride banen, zoals Zadra in Energylandia.',
    aliases: ['Hybrid Coasters', 'I-Box Track', 'IBox Track', 'Topper Track'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Hybride achtbaan'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Een compact Vekoma-achtbaanmodel dat bezoekers twee keer door drie inversies stuurt, eerst vooruit en dan achteruit over hetzelfde spoor.',
    definition:
      'De Boomerang is een van de meest gebouwde achtbaanmodellen in de geschiedenis, gefabriceerd door Vekoma. De layout omvat drie inversies, een cobra roll (twee inversies) en daarna een vertical loop, die eerst vooruit worden doorlopen, en daarna omgekeerd nadat de trein omhoog wordt getrokken door een tweede schuine lifthill en achterwaarts door dezelfde elementen wordt losgelaten. Een rit telt zo zes inversies (drie in elke richting) op een klein grondoppervlak, en daardoor past het model ook in parken met weinig ruimte. Er zijn wereldwijd meer dan 50 Boomerangs gebouwd, in parken op elk bewoond continent. In veel middelgrote parken is de Boomerang de instapachtbaan met inversies.',
    relatedTermIds: ['cobra-roll', 'inversion', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Een compact Gerstlauer-achtbaanmodel met een nagenoeg verticale of voorbij-verticale eerste drop na een verticale lifthill, gebouwd voor parken met weinig ruimte.',
    definition:
      'De Euro-Fighter is het compacte achtbaanmodel van Gerstlauer, herkenbaar aan de verticale (90 graden) of voorbij-verticale eerste drop (tot 121 graden) na een verticale chain lifthill. Het model is ontworpen voor parken met weinig ruimte en heeft op een klein terrein meerdere inversies, krappe bochten en hoge G-krachten. Bij de voorbij-verticale drop staat de trein even stil op de top, met de rijders voorover boven de afgrond, voordat hij valt. Europese Euro-Fighters zijn onder meer Saw – The Ride bij Thorpe Park, Rage bij Adventure Island en Fluch von Novgorod bij Hansa-Park.',
    relatedTermIds: ['beyond-vertical-drop', 'first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Een achtbaantype met een ongewoon breed treinstel en een nagenoeg verticale of voorbij-verticale drop, met een opzettelijke pauze aan de rand vóór de val.',
    definition:
      'Een Dive Coaster heeft een breed treinstel (doorgaans 8–10 rijders per rij), een nagenoeg verticale of voorbij-verticale drop (90+ graden) en een stop bovenaan: de trein houdt even stil op de rand voordat hij wordt losgelaten. Het brede treinstel geeft alle rijders een onbelemmerd zicht recht naar beneden. B&M’s Dive Machine-lijn (Oblivion bij Alton Towers, SheiKra bij Busch Gardens) introduceerde het concept; Gerstlauer’s Dive Coaster-model is een concurrerende versie. De stop op de rand is bewust ontworpen om de spanning op te bouwen.',
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'first-drop',
      'launch-coaster',
    ],
    aliases: ['Dive Coasters'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Een achtbaan met virtual reality-headsets, waarin een animatie of een spel gelijk loopt met de fysieke rit.',
    definition:
      'Op een VR Coaster dragen rijders een VR-headset (doorgaans een Samsung Gear VR of een speciaal gebouwd apparaat) met een virtuele omgeving die gelijk loopt met de bewegingen van de achtbaan. Gaat de trein door een looping, dan draait het beeld mee; bij een drop duikt ook de virtuele wereld omlaag. Tussen circa 2015 en 2019 rustten veel parken bestaande achtbanen achteraf met VR uit. Gasten klaagden over het draagcomfort, de hygiëne en misselijkheid, en veel parken hebben de VR sindsdien weer verwijderd. Enkele installaties (zoals de VR Coasters van Mack Rides) zijn verder uitgewerkt, met beelden die voor die ene baan zijn gemaakt.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'Het gevoel van gewichtloosheid of uit je stoel worden getild dat achtbaanrijders ervaren bij negatieve G-kracht-momenten.',
    definition:
      'Airtime is het gevoel van gewichtloosheid bij negatieve G-krachten. Het ontstaat wanneer de trein een heuvel of dal sneller neemt dan een vrije val. Er zijn twee hoofdtypen: floater airtime (zachte negatieve G’s, een zacht zweefgevoel) en ejector airtime (intense negatieve G’s, waarbij de schootbeugel of riem het enige is dat je in je stoel houdt). Airtime hills (ook wel camelbacks genoemd) volgen de parabool van een vrije val, zodat de negatieve G-kracht zo lang mogelijk aanhoudt.',
    relatedTermIds: [
      'airtime-hill',
      'bunnyhop',
      'first-drop',
      'quad-down',
      'restraint-freedom',
      's-hill',
      'wooden-coaster',
    ],
  },
  {
    id: 'inversion',
    name: 'Inversie',
    shortDefinition: 'Elk element op een achtbaan waarbij het spoor rijders ondersteboven draait.',
    definition:
      'Een inversie is elk element op een achtbaan waarbij spoor en voertuig de rijders voorbij de verticaal draaien, zodat ze minstens gedeeltelijk ondersteboven hangen. Veelvoorkomende inversies zijn de looping, cobra roll, kurketrekker, immelmann, dive loop, inline twist, heartline roll en zero-G roll. Moderne achtbanen hebben routinematig zes tot veertien inversies in één layout. Het aantal inversies is een van de getallen waarmee de intensiteit van een achtbaan wordt beschreven. In een inversie werken positieve G-krachten (onderin een looping) en negatieve G-krachten (bovenin).',
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversies'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'De klassieke cirkelvormige inversie waarbij het spoor een volledige verticale cirkel maakt en rijders volledig ondersteboven brengt aan het hoogste punt.',
    definition:
      'De looping is een volledige cirkel van 360 graden in het verticale vlak. Moderne loopings gebruiken een clothoïde (druppelvorm) in plaats van een perfecte cirkel: de in- en uitgang zijn wijd, terwijl de bovenkant van de looping strak is. Daardoor blijven de G-krachten gelijkmatig, zonder extreme pieken. De eerste moderne looping-achtbaan was Revolution in Six Flags Magic Mountain (1976), ontworpen door Schwarzkopf en Stengel; Corkscrew in Knott’s Berry Farm (1975) had al een moderne inversie, maar geen looping. Loopings zitten in achtbanen van elk formaat, van instapbanen tot recordhouders.',
    aliases: ['Loopings'],
    alternateNames: ['Verticale Lus', 'Vertical Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Een halve looping die de trein omhoog en over de top trekt, gevolgd door een halve rol die in de tegenovergestelde richting uitkomt, vernoemd naar WO I-piloot Max Immelmann.',
    definition:
      'De Immelmann-bocht is een inversie die B&M op veel van zijn banen gebruikt en die uit twee delen bestaat. Eerst trekt het spoor omhoog in een halve verticale looping, zodat de rijders over de top gaan en kort ondersteboven hangen. Daarna draait een halve rol de trein weer rechtop, en rijdt hij 180 graden gedraaid verder. Het element is vernoemd naar de gevechtspiloot Max Immelmann uit de Eerste Wereldoorlog, die een vergelijkbare manoeuvre vloog. Immelmanns zijn te vinden op vrijwel elke B&M sit-down, inverted en hyper coaster wereldwijd.',
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Een 360-graden rol langs een parabolische boog waarbij rijders aan het hoogste punt bijna gewichtloos zijn.',
    definition:
      'De zero-G roll (nul-zwaartekracht-rol) is een inversie waarbij de trein tijdens de rotatie een parabolische boog volgt. Het element lijkt op een heartline roll, maar wordt sneller gereden en gaat hoger op en neer. Bovenin de rol hangen de rijders ondersteboven en voelen ze kort negatieve G-krachten (airtime). Zero-G rolls komen vooral voor op de wing coasters, hyper coasters en inverted coasters van B&M. Op een wing coaster hangen de rijders in de buitenste stoelen daarbij zonder spoor onder of boven zich in de lucht.',
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'De mechanisch aangedreven helling die de achtbaantrein naar het hoogste punt trekt en zo elektrische energie omzet in potentiële energie.',
    definition:
      'De lifthill is het gedeelte waarbij een extern mechanisme de achtbaantrein van grondniveau naar het hoogste punt van de rit trekt. Het meest voorkomende mechanisme is een ketting langs het midden van het spoor; het bekende “tik-tik-tik” komt van de anti-terugrolklem. Alternatieven zijn kabel/touwliften (soepeler en stiller), bandliften (gebruikt op sommige moderne B&M-achtbanen) en magnetische aandrijving. De hoogte van de lifthill bepaalt de maximale potentiële snelheid van de achtbaan. Sommige moderne ontwerpen gebruiken meerdere lifthills of combineren een lift met lanceersegmenten. Op de lifthill rijdt de trein doorgaans het langzaamst van de hele rit.',
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Kettinghelling'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'De eerste afdaling na de lifthill, doorgaans het hoogste en snelste punt van de rit en bepalend voor het karakter van de achtbaan.',
    definition:
      'De First Drop is de eerste afdaling direct na de lifthill of het lanceerstuk. Op de meeste traditionele achtbanen is het de hoogste heuvel, en daar haalt de trein zijn topsnelheid. Hoek, hoogte en profiel bepalen voor een groot deel hoe de achtbaan rijdt. Een steile drop (80 tot 90 graden en meer) versnelt de trein bijna in vrije val, en een parabolische drop kan met een flauwere hoek toch sterke airtime geven. Dive Coasters hebben drops van meer dan 90 graden (voorbij verticaal), waarbij de rijders voorover over de rand hangen.',
    relatedTermIds: ['airtime', 'airtime-hill', 'beyond-vertical-drop', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Een heuvelachtig element ontworpen om negatieve G-krachten te genereren, waardoor rijders gewichtloosheid ervaren of uit hun stoel worden getild.',
    definition:
      'Een Airtime Hill (ook wel camelback of kamelenrug genoemd) is een heuvel in het spoor, ontworpen om negatieve G-krachten op te wekken: het gevoel van zweven of uit de stoel te worden getild. Floater airtime is zachte negatieve G; ejector airtime is intens, waarbij de schootbeugel het enige is tussen de rijder en de lucht. Stalen achtbanen gebruiken precies gevormde parabolische heuvels voor consistente, voorspelbare airtime; houten achtbanen produceren meer onvoorspelbare, ruwe airtime door de spoorflexibiliteit. Hyper coasters, giga coasters en moderne houten achtbanen bestaan voor een groot deel uit airtime hills.',
    aliases: ['Airtime heuvels'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 's-hill', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Een continu spiralend gedeelte waarbij het spoor om een centrale as wikkelt en aanhoudende laterale G-krachten genereert.',
    definition:
      'Een helix is een stuk achtbaanspoor dat als een schroef in een spiraal doorloopt, zonder de rijders ondersteboven te draaien. In tegenstelling tot airtime hills of inversies genereert een helix aanhoudende laterale (zijdelingse) G-krachten die rijders in de buitenkant van de bochten drukken. Een dalende helix versnelt de trein terwijl hij draait; een stijgende helix remt af terwijl hij toch laterale krachten genereert. Vaak zit een helix aan het einde van een lay-out, waar hij de resterende snelheid opmaakt. Bekende helixen zijn de ondergrondse finale van Nemesis bij Alton Towers en de sluitende helix van Expedition GeForce bij Holiday Park.',
    aliases: ['Helices'],
    alternateNames: ['Spiraal', 'Schroefkromme'],

    relatedTermIds: ['first-drop', 'horseshoe'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Een remgedeelte dat het circuit in onafhankelijke segmenten verdeelt, waardoor meerdere treinen gelijktijdig kunnen rijden zonder botsingsrisico.',
    definition:
      'Een block brake verdeelt het circuit van een achtbaan in afzonderlijke secties (“blokken”), waarin telkens precies één trein mag zijn. Als een trein verderop afremt of stopt, houdt het besturingssysteem automatisch alle volgende treinen op hun block brake vast. Zo kan een park meerdere treinen tegelijk laten rijden zonder dat ze kunnen botsen, en dat verhoogt de capaciteit per uur sterk. Block brakes liggen op punten waar een stilstaande trein niet achteruitrolt (doorgaans een vlak of licht omhoog gaand gedeelte) en gebruiken doorgaans magnetische (wervelstroom) of wrijvingsremvinnen. De mid-course brake run (MCBR) is het meest zichtbare type block brake.',
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'Het afremgedeelte aan het einde van de rit waarbij de trein wordt vertraagd naar stationssnelheid, doorgaans met magnetische vinremmen.',
    definition:
      'De Brake Run is het spoordeel na de hoofdlayout waarbij het achtbaantreinstel van rijsnelheid wordt vertraagd naar een veilige stationsinrijsnelheid. Moderne brake runs gebruiken wervelstroomremmen (magnetische remmen): rijen permanente magneten die op metalen vinnen aan de onderkant van de trein werken en zo remmen zonder wrijving of slijtage. Oudere achtbanen gebruikten pneumatische klauwremmen. Een mid-course brake run (MCBR) halverwege de lay-out is een blokgrens, zodat er meerdere treinen tegelijk kunnen rijden. De laatste brake run voor het station remt soms bewust maar licht, zodat de trein met wat snelheid het station binnenrijdt.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Een element met twee inversies, door B&M populair gemaakt, waarbij het spoor de vorm heeft van een opgerichte cobrakop en de twee inversies verbonden zijn door een draai aan het hoogste punt.',
    definition:
      'De cobra roll is een element met twee inversies kort na elkaar: het spoor buigt omhoog in een halve looping, roteert 180 graden aan de top (door een korte onderstebovenstand), en spiegelt daarna de reeks, zodat de trein in tegengestelde richting uitrijdt. Vanuit opzij gezien lijkt het spoortracé op de opgeheven en gespreide kop van een cobra. B&M maakte het element populair: een cobra roll zit onder meer in Dragon Khan in PortAventura en in veel inverted coasters van B&M. Maar Vekoma bouwt er een in elke Boomerang, en ook andere fabrikanten gebruiken hem.',
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'Een inversie waarbij het spoor als een spiraal 360 graden om een centrale as draait; een van de oudste en meest gebouwde inversies.',
    definition:
      "De kurketrekker (corkscrew) is een van de eerste moderne inversies, geïntroduceerd door Arrow Dynamics in de jaren '70. Het spoor draait als een wijnkurketrekker om een denkbeeldige cilinder, en de rijders maken een volledige rol van 360 graden die opzij van de rijrichting ligt. Kurketrekkers worden vaak in paren achter elkaar gebouwd en horen bij de klassieke stalen achtbaan. Ook buiten de Engelstalige wereld is de Engelse naam corkscrew gangbaar. Nieuwere inversies hebben de kurketrekker grotendeels verdrongen, maar in parken in Europa en Noord-Amerika rijden er nog veel.",
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'Het spiegelbeeld van een Immelmann, waarbij het spoor steil omlaag duikt in een halve looping en het element horizontaal verlaat.',
    definition:
      'Een Dive Loop (ook wel dive turn of reverse Immelmann) begint waar de Immelmann eindigt: in plaats van omhoog en over te trekken, duikt het spoor steil omlaag in een boog door de onderste helft van een looping voordat het in de tegenovergestelde richting uitkomt. Na de duik drukt het onderste deel van de halve looping de rijders met positieve G-krachten in hun stoel. B&M gebruikt de dive loop op veel van zijn inverted en sit-down coasters.',
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Een enkele rol van 360 graden recht om de spooras: een soepele inversie waarbij de rijrichting nauwelijks verandert.',
    definition:
      'Een Inline Twist (ook wel inline roll of barrel roll) draait de trein 360 graden om de lengteas van het spoor. De trein rolt om zijn as en rijdt in vrijwel dezelfde richting verder. In tegenstelling tot een kurketrekker (die een spiraalverschuiving heeft ten opzichte van de spoormiddellijn), draait de inline twist precies om het spoor. Het resultaat is een soepele, korte inversie met minimale laterale krachten. Inline Twists komen veel voor op B&M flying coasters en inverted coasters, vaak in paren of kort na andere elementen.',
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Een 360-graden rol gecentreerd op het zwaartepunt van de rijder in plaats van het spoor zelf, ontworpen voor soepele, aanhoudende gewichtloosheid door de hele rotatie.',
    definition:
      'Een Heartline Roll (of heartline spin) is zo ontworpen dat het hart van de rijder – ongeveer het zwaartepunt van het lichaam – gedurende de hele rotatie op een constante hoogte blijft, in plaats van dat het spoor het draaipunt is. Zo blijven de G-krachten tijdens de rol klein, zonder de ruk van een gewone kurketrekker. Heartline rolls komen voor op moderne achtbanen van B&M en Intamin, vooral op hyper coasters en inverted coasters. Een kleine afwijking in de vorm van het spoor voelen de rijders in dit element meteen.',
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Een halve looping gecombineerd met een halve kurketrekker die het spoor 90 graden draait en van richting verandert.',
    definition:
      'Een Sidewinder bestaat uit een halve verticale looping die de trein omhoog trekt, onmiddellijk gevolgd door een halve kurketrekker die de trein rechtop draait terwijl hij 90 graden draait. Zo combineert het element een inversie met een richtingsverandering op weinig grond. De naam verwijst naar de slangachtige draaibeweging die van opzij te zien is.',
    relatedTermIds: ['cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Een grote inversie die alleen op B&M flying coasters voorkomt, waarbij rijders in Superman-houding volledig ondersteboven door het laagste punt van een verticale looping gaan.',
    definition:
      'De Pretzel Loop komt alleen voor op B&M flying coasters, waarop de rijders horizontaal liggen in Superman-houding. Het element stuurt de rijders ondersteboven steil omlaag, door de bodem van een grote looping, en trekt ze daarna steil weer omhoog. Van opzij gezien heeft het de vorm van een pretzel. Op het laagste punt hangen de rijders met het gezicht naar beneden en zijn de G-krachten zeer hoog. Pretzel loops zitten onder meer in Manta in SeaWorld Orlando en Tatsu in Six Flags Magic Mountain.',
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Een dubbel-inversie-element met een 180-graden richtingsomkering, waarbij twee halve loopings verbonden zijn door een halve kurketrekker; de vorm lijkt op gespreide vleermuisvleugels.',
    definition:
      'Een Batwing bestaat uit twee inversies met een richtingsomkering: het spoor buigt omhoog in een halve looping, passeert daarna aan de top een halve kurketrekker die de trein ondersteboven draait en de richting omkeert, voordat het de halve looping naar grondniveau spiegelt. De vorm van bovenaf gezien lijkt op gespreide vleermuisvleugels. B&M gebruikt de batwing onder meer op Afterburn bij Carowinds en The Incredible Hulk Coaster bij Universal’s Islands of Adventure. In tegenstelling tot een bowtie (geen richtingsverandering) keert de batwing de rijrichting van de trein 180 graden om tijdens de reeks.',
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Een verticale looping in omgekeerde richting: de trein komt er bovenaan in, duikt door de cirkel omlaag en komt er bovenaan weer uit.',
    definition:
      'Een Norwegian loop is een element met twee inversies dat eruitziet als een grote looping die je van bovenaf inrijdt: een dive loop met direct daarachter een Immelmann. De trein klimt en rolt een halve looping in die hem naar de grond laat duiken, zwaait door het laagste punt en klimt een tweede halve looping in, waaruit hij bovenaan uitrolt, weer in de richting waaruit hij kwam. Van opzij lijkt het paar op één looping met de in- en uitgang bovenaan, waar een gewone looping die onderaan heeft.\n\nHet element verscheen voor het eerst op SpeedMonster in TusenFryd bij Oslo (Intamin, 2006), en daar komt de naam vandaan. In TusenFryd ligt de looping om de roltrap heen die bezoekers het park in brengt, zodat ze erdoor gaan voordat ze ook maar één attractie hebben bereikt. Norwegian loops zijn nog altijd zeldzaam.',
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Een kurketrekker-element op inverted of flying coasters waarbij de rotatie in een nagenoeg horizontaal vlak plaatsvindt.',
    definition:
      'Een Flat Spin is een kurketrekker-type inversie die voornamelijk voorkomt op B&M inverted en flying coasters, waarbij de geometrie van het element zodanig is gerangschikt dat de spiraal voor toeschouwers op de grond bijna horizontaal oogt. Op een inverted coaster (waarbij de trein onder het spoor hangt) zwaaien de rijders daarbij door een wijde, bijna vlakke cirkel. De rotatie is soepel en de G-krachten zijn matig. Flat spins zitten onder meer in B&M inverted coasters zoals Banshee bij Kings Island en Afterburn bij Carowinds.',
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Een halve-kurketrekker-inversie die tegelijkertijd de rijrichting van de trein met circa 180 graden omkeert.',
    definition:
      'Een Cutback is een element waarbij het spoor een halve kurketrekker uitvoert terwijl het ruwweg 180 graden op zichzelf terugkrult. De trein keert zo om en gaat tegelijk over de kop; een gewone kurketrekker houdt de rijrichting grotendeels aan. Cutbacks zijn zeldzaam. Ze staan op sommige Vekoma-modellen en op maatwerkbanen die op weinig ruimte moeten keren en inverteren. De naam komt van het spoor dat tijdens de draai terugsnijdt over zijn eigen koers.',
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Een variant van de zee-serpent met een lager verbindingspunt: twee inversies na elkaar, zonder richtingsverandering en op weinig ruimte.',
    definition:
      'De Butterfly is een dubbel-inversie-element vergelijkbaar met een zee-serpent (twee halve loopings verbonden aan de top) maar met een lager hoogtepunt en een afwijkende geometrie. Net als de zee-serpent produceert het twee inversies zonder de rijrichting te veranderen, maar het verbindingsstuk tussen de twee halve loopings loopt door een lager ondersteboven-gedeelte in plaats van een hoog hoogtepunt. Daardoor is de butterfly minder hoog. Het element staat op sommige Vekoma-ontwerpen en maatwerkbanen.',
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Een element waarbij twee gespiegelde halve loopings samen de vorm van een vlinderdas hebben: twee inversies zonder richtingsverandering.',
    definition:
      'Een Bowtie is een element met twee inversies, gevormd door twee gespiegelde halve loopings die op hun hoogste punt verbonden zijn. Anders dan bij een batwing komt de trein er in ongeveer dezelfde richting uit als hij erin ging. Van bovenaf gezien lijkt het spoor op een vlinderdas. Bowties zijn zeldzaam en staan vooral op sommige Vekoma-banen en maatwerkinstallaties. De twee inversies volgen kort op elkaar.',
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Een reeks kleine, snelle airtime hills aan het einde van een rit die zachte floater airtime produceren terwijl de trein vaart verliest.',
    definition:
      'Een bunnyhop is een reeks kleine, snelle heuvels aan het einde van een lay-out, wanneer de trein het grootste deel van zijn snelheid kwijt is. Bij die lagere snelheid geven de heuvels zachte floater airtime in plaats van de ejector airtime van de snellere heuvels eerder in de rit. De naam komt van de huppelende beweging van een konijn. Bunnyhops sluiten vaak hyper coasters, giga coasters en houten achtbanen af, vlak voor de brake run.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run', 's-hill'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Een airtime hill die voorbij 90 graden kantelt, zodat rijders zijwaarts hangen terwijl ze negatieve G-krachten voelen; vernoemd naar ingenieur Werner Stengel en vooral gebouwd door Mack Rides.',
    definition:
      'De Stengel Dive is een airtime-element waarbij het spoor voorbij 90 graden (voorbij verticaal) kantelt, zodat de rijders zijwaarts of licht ondersteboven hangen terwijl het heuvelprofiel ze tegelijk negatieve G-krachten geeft. Het element is vernoemd naar de Duitse achtbaaningenieur Werner Stengel. Mack Rides gebruikt de Stengel Dive op zijn hyper coasters. De eerste achtbaan met het element was Goliath in Walibi Holland (2002); bij Mack zit het onder meer in Blue Fire Megacoaster in Europa-Park en Ride to Happiness in Plopsaland.',
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Een sterk gekantelde bocht van 180 graden in de vorm van een hoefijzer, die de trein de andere kant op stuurt; vaak het keerpunt tussen twee lanceerstukken.',
    definition:
      'Een horseshoe is een halfronde bocht die doorgaans 75 tot 90 graden gekanteld is en de rijrichting van de achtbaan 180 graden omkeert. Door de sterke kanteling blijven de zijdelingse G-krachten in de krappe bocht beperkt. Launch coasters met meerdere launches gebruiken de horseshoe vaak als keerpunt: de trein maakt er een U-bocht voordat hij opnieuw wordt gelanceerd. Het element komt veel voor op de accelerator coasters van Intamin en de multi-launch coasters van Mack. De trein keert er op weinig ruimte zonder veel snelheid te verliezen.',
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Een kleine dip vlak voor de hoofddrop van een achtbaan met chain lift, die de spanning op de ketting vermindert en een kort moment airtime geeft.',
    definition:
      'Een predrop is een kleine heuvel of dip op het laatste deel van de lifthill, vlak voor de top waarna de hoofddrop begint. Technisch dient hij om de spanning op de liftketting te verminderen terwijl de trein de top nadert. Zo gaat de trein zonder schok van de aangedreven lift naar de vrije afdaling. In de predrop voelen de rijders al even airtime, voordat de hoofddrop begint. Predrops komen voor op houten en stalen achtbanen.',
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Een hoog, smal element met een nagenoeg verticale klim en daling dat lijkt op een hoge hoed, vooral op gelanceerde Intamin-achtbanen.',
    definition:
      'Een Top Hat is een element waarbij het spoor nagenoeg verticaal omhoog klimt naar een scherpe top en aan de andere kant nagenoeg verticaal weer naar beneden gaat. Van opzij gezien lijkt het profiel op een hoge hoed. Inside (standaard) Top Hats kantelen bovenin naar binnen; outside Top Hats kantelen naar buiten en geven bovenop meer airtime. Het element hoort vooral bij de launch coasters van Intamin, waar de trein na de lancering tot 200 km/u of meer de Top Hat in rijdt. Top Thrill 2 (128 m, tot 2024 Top Thrill Dragster) en Red Force in Ferrari Land, dat met LSM lanceert, hebben een Top Hat; Kingda Ka (139 m) had er een tot de sluiting in 2024.',
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'Een achtbaan die een enthousiasteling heeft gereden en aan zijn persoonlijke telling heeft toegevoegd.',
    definition:
      'Een credit (of “cred”) is een achtbaan die een enthousiasteling heeft gereden en aan zijn persoonlijke telling heeft toegevoegd. Wie credits verzamelt, probeert zo veel mogelijk verschillende achtbanen te rijden. Wat als credit telt, verschilt per verzamelaar: de een telt alleen sit-down achtbanen, de ander alle tracked rides. Op sites zoals de Roller Coaster Database (RCDB) houden verzamelaars hun telling bij. Voor een nieuwe credit reizen sommigen naar het buitenland of naar kleine, onbekende parken.',
    aliases: ['Credits'],
    alternateNames: ['Cred', 'Creds', 'Coaster-teller'],

    relatedTermIds: [
      'hybrid-coaster',
      'mackprodukt',
      'onride-offride',
      'pov',
      'powered-coaster',
      're-ride',
      'wooden-coaster',
    ],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Video gefilmd vanuit de eerste rij van een achtbaan, waarop je vooraf ziet hoe de rit verloopt.',
    definition:
      'POV (Point of View) is video die tijdens de rit is opgenomen vanuit de eerste rij, meestal met een camera die aan de trein vastzit. Veel bezoekers bekijken een achtbaan vooraf in een POV-video. Parken maken soms zelf POV’s als reclame; vaker filmen gasten of media ze. Op YouTube staan tienduizenden achtbaan-POV’s. De term wordt ook gebruikt voor andere video’s vanuit het oogpunt van de rijder, bij elke soort attractie.',
    aliases: ['Point of View'],
    alternateNames: ['On-Ride Video', 'Meerijvideo'],

    relatedTermIds: ['credit', 'dark-ride', 'onride-offride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Een situatie waarbij meerdere treinen bij de brake run aankomen voordat het station vrij is, waardoor treinen moeten wachten. Het wijst op een trage afhandeling in het station en verlengt de wachttijd.',
    definition:
      'Stacking treedt op wanneer het laad- en losproces van een achtbaan trager is dan de ritcyclustijd, waardoor treinen zich in de brake run ophopen in afwachting van een vrij station. In plaats van een trein te laten vertrekken terwijl de vorige terugkomt, moet de operator treinen in de brake run vasthouden, en tussen twee treinen staat de baan dan soms even stil. Stacking verlaagt direct de capaciteit en verlengt de wachttijd in de rij. Veelvoorkomende oorzaken zijn traag instappende gasten (vaak door ingewikkelde beugels), uitgebreide tassencontroles of te weinig personeel. Wie vanuit de rij treinen op de brake run ziet wachten, kan besluiten eerst een andere attractie te doen.',
    alternateNames: ['Train Stacking', 'Treinstapeling'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Type achtbaan waarbij de trein onder de rail hangt en de voeten van passagiers vrij bungelen.',
    definition:
      'Een Inverted Coaster is een achtbaan waarbij de trein stijf onder de rail is bevestigd, met passagiers die vrij bungelend met de benen naar beneden zitten. In tegenstelling tot een swinging coaster (die zijdelings slingert) kan de trein van een Inverted Coaster niet zijdelings bewegen. B&M bouwde in 1992 met Batman The Ride de eerste moderne inverted coaster. Typisch zijn near-misses, zero-G rolls en cobra rolls. Bekende Europese voorbeelden: Nemesis (Alton Towers), Katun (Mirabilandia) en Oziris (Parc Astérix).',
    aliases: ['Inverted Coasters'],
    alternateNames: ['Inverted', 'Invert', 'Hangende Achtbaan'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Type achtbaan met stoelen aan weerszijden van de rail, zodat er niets boven, onder of naast de passagiers is.',
    definition:
      'Een Wing Coaster (ook Wing Rider) heeft aan elke kant van de rail twee stoelen, zodat de passagiers geen constructie boven, onder of naast zich hebben. Het spoor kan daardoor rakelings langs decor en gebouwen gaan (near-misses). De meeste wing coasters zijn van B&M. Europese voorbeelden: Flug der Dämonen in Heide-Park, The Swarm in Thorpe Park en Fēnix in Toverland.',
    aliases: ['Wing Coasters'],
    alternateNames: ['Wing Rider', 'Vleugel-achtbaan'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Achtbaan met wagons die vrij om een verticale as draaien, zodat geen twee ritten hetzelfde verlopen.',
    definition:
      'Een Spinning Coaster (ook draaiende achtbaan) heeft wagons op een platform dat vrij om een verticale as draait. Omdat niemand de rotatie stuurt, rijdt elke wagon een andere volgorde van vooruit, achteruit en zijwaarts. Mack Rides (Waldkirch, Duitsland) en Gerstlauer zijn de voornaamste fabrikanten. Spinning coasters hebben geen extreme lengte-eisen en staan daarom vaak als familieattractie in het park.',
    aliases: ['Spinning Coasters'],
    alternateNames: ['Spinner', 'Draaiende achtbaan'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Het zwaarste spinning coaster-model van Mack Rides: sneller en hoger dan een standaard spinning coaster, met wagons die harder draaien.',
    definition:
      'De Xtreme Spinning Coaster (XSC) is het zwaarste spinning coaster-model van Mack Rides. Een standaard spinning coaster is op gezinnen afgestemd. De XSC is hoger, heeft steilere drops en een hogere topsnelheid, en het draaimechanisme is zo afgesteld dat de wagons in elk element van het parcours harder en vaker draaien.\n\nDoor het hogere tempo wisselt de rijrichting sneller dan op een gewone spinning coaster. Met de XSC heeft Mack een model tussen de spinning coaster voor gezinnen en de volwaardige thrill coaster in. Time Traveler in Silver Dollar City (2018) en The Ride to Happiness in Plopsaland (2021) zijn XSC’s.',
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'mack-rides', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achtbaan van meer dan 61 m hoog, doorgaans zonder inversies, met de nadruk op snelheid en airtime.',
    definition:
      'Hyper Coaster is de classificatie voor achtbanen tussen 61 en 91 m hoog. B&M noemt een van zijn modellen “Hyper Coaster”; Intamin gebruikt “Mega Coaster” voor een vergelijkbaar type. Die modelnamen garanderen de hoogteklasse niet: Goliath in Walibi Holland (46,8 m) en Kondaa in Walibi Belgium (50 m) zijn Mega Coasters van Intamin, en Goliath in La Ronde (53,3 m) is een Hyper Coaster van B&M. Hyper Coasters leggen de nadruk op grote airtime-heuvels bij hoge snelheid in plaats van inversies. Shambhala in PortAventura (76 m) en Hyperion in Energylandia (77 m) zijn de hoogste Hyper Coasters van Europa. Een ander bekend voorbeeld is Mako in SeaWorld Orlando.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Hypercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achtbaan van meer dan 91 m hoog, een klasse boven de Hyper Coaster.',
    definition:
      'Giga Coaster is de classificatie voor achtbanen tussen 91 en 121 m hoog. De term werd in 2000 bedacht door Cedar Fair en Intamin voor Millennium Force in Cedar Point. Giga coasters hebben lange lay-outs met grote airtime hills. Een ander voorbeeld is Fury 325 in Carowinds. In Europa staat er precies één: Red Force in Ferrari Land (PortAventura World, Spanje), geopend in 2017 en 112 m hoog. Hyperion in Energylandia (Polen) haalt 77 m en valt nog in de Hyper-categorie.',
    aliases: ['Giga Coasters'],
    alternateNames: ['Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Bocht waarbij de spoorkanteling meer dan 90° bedraagt, waardoor passagiers kort voorbij de verticaal worden gekanteld.',
    definition:
      'Een Overbanked Turn is een bocht waarbij de bankhoek meer dan 90 graden bedraagt – de buitenste rail ligt hoger dan verticaal, waardoor passagiers kort voorbij de ondersteboven-positie worden gekanteld zonder een volledige inversie te voltooien. Op het hoogste punt van de kanteling werken zijdelingse G-krachten en licht negatieve G-krachten tegelijk. Overbanked turns zitten vaak in B&M hyper coasters en Intamin mega coasters, en komen veel voor in RMC-lay-outs.',
    aliases: ['Overbanked'],
    alternateNames: ['Overhellende bocht', 'Gekantelde bocht'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Magnetische rem halverwege het parcours die de snelheid van de trein vermindert zonder hem volledig te stoppen.',
    definition:
      'Een trim brake is een rem halverwege het parcours die de trein wat snelheid afneemt voor een bepaald stuk, zonder hem stil te zetten zoals een block brake doet. Parken gebruiken ze om de G-krachten in een zwaar element binnen de grenzen te houden, om slijtage aan de baan te beperken, om geluid en trillingen te dempen, of om de rit binnen zijn ontwerpgrenzen te houden, wat de temperatuur ook is en hoe vol de trein ook zit. Een trim kost airtime: een heuvel die voor een bepaalde snelheid is getekend, geeft er minder van als de trein trager aankomt. Hoe hard een trim ingrijpt, hangt af van het seizoen (bij koud weer vaak harder), van het gewicht in de trein en van het beleid van het park, zodat dezelfde baan als twee verschillende ritten kan aanvoelen.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Wanneer een launch coaster het hoogste punt niet bereikt en terugrolt naar het lanceerplatform.',
    definition:
      'Een rollback treedt op wanneer een gelanceerde achtbaan onvoldoende snelheid ontwikkelt om het hoogste punt van het circuit te bereiken en vervolgens door de zwaartekracht terugrolt naar de lanceerpositie. Bij hydraulische launch coasters (het vroegere Top Thrill Dragster, Stealth) gebeurt dit wanneer het lanceermechanisme niet de volledige kracht levert. De trein rolt langzaam terug en wordt door magneetremmen opgevangen. Rollbacks zijn zeldzaam, maar komen bij hydraulische launch coasters af en toe voor. Passagiers lopen geen gevaar.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronic',
    shortDefinition:
      'Robotfiguren in dark rides en shows die personages en scènes levensecht nabootsen.',
    definition:
      'Animatronics (enkelvoud: animatronic) zijn elektromechanische robotfiguren die worden gebruikt in attracties en shows van pretparken om personages of wezens levensecht na te bootsen. De eerste Audio-Animatronics van Disney waren in juni 1963 voor publiek te zien, in Enchanted Tiki Room in Disneyland. Moderne animatronics variëren van eenvoudige figuren die steeds dezelfde beweging herhalen tot robots met servo’s en pneumatiek, met gezichtsuitdrukkingen en bewegingen van het hele lichaam. Efteling gebruikt veel animatronics, onder meer in De Vliegende Hollander en Symbolica.',
    aliases: ['Animatronics'],
    alternateNames: ['Audio-Animatronics', 'Robotfiguur'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'AI-voorspelling',
    shortDefinition:
      'Voorspellingen van drukte en wachttijden in pretparken met machine learning, zo ver vooruit als een park zijn schema heeft gepubliceerd.',
    definition:
      'Een AI-voorspelling is op park.fan een voorspelling van Fancast, het machine-learningmodel dat park.fan op zijn eigen metingen traint. Voor elke attractie en elk uur van een komende dag voorspelt het de verwachte wachttijd, en daaruit leidt het het drukteniveau van de dag af.\n\nDe trainingsdata zijn de wachttijden die park.fan in meer dan 200 parken heeft vastgelegd. Bovenop die geschiedenis neemt het model de weersverwachting mee, schoolvakanties, feestdagen en brugdagen, en de evenementen van het park zelf, zoals Halloweenavonden of de openingsdag van het seizoen. Het wordt elke dag om 06:00 UTC opnieuw getraind op de wachttijden van de dag ervoor.\n\nHoe ver het vooruit kijkt, hangt af van het schema van het park. Een park dat het hele jaar open is, krijgt voorspellingen voor dagen tot bijna een jaar vooruit; een seizoenspark krijgt ze tot het einde van zijn gepubliceerde seizoen. Elke voorspelling wordt achteraf vergeleken met de wachttijden die echt zijn gemeten, en de fout die daaruit komt, staat op park.fan en verschijnt per attractie als badge met de nauwkeurigheid.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['AI-voorspelling', 'AI-voorspellingen'],
  },
  {
    id: 'opening-hours',
    name: 'Openingstijden',
    shortDefinition:
      'Het officiële dagschema dat aangeeft wanneer een pretpark of attractie opent en sluit.',
    definition:
      'Openingstijden zijn de tijden waarop een park bezoekers binnenlaat en waarop het voor die dag sluit. Parken publiceren ze in hun kalender, meestal weken of maanden vooruit, en passen ze op korte termijn aan bij evenementen, slecht weer of technische problemen. Een attractie kan later opengaan of eerder sluiten dan het park, en waterattracties blijven op koude dagen vaak dicht.\n\npark.fan toont de gepubliceerde tijden van elk park en, waar het park ze opgeeft, ook die van afzonderlijke attracties. Publiceert een park geen openingstijden, dan toont park.fan tijden die zijn afgeleid uit de activiteit die in het park is gemeten, aangeduid als Gereconstrueerde tijden. In de meeste parken gaan op het sluitingsuur de wachtrijen dicht; de attracties blijven draaien tot iedereen die al in de rij stond, heeft gereden.\n\nHoe de wachttijden zich in het eerste en het laatste uur gedragen, verschilt per attractie, en de pagina van een attractie toont haar typische dag uur per uur.',
    aliases: ['Parktijden', 'Openingstijden'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Wachttijdtrend',
    shortDefinition:
      'De richting waarin een wachtrij beweegt, op basis van de laatste vier metingen: stijgend, dalend of stabiel.',
    definition:
      'De wachttijdtrend laat zien of de rij bij een attractie groeit, krimpt of gelijk blijft. park.fan vergelijkt het gemiddelde van de laatste twee metingen met het gemiddelde van de twee daarvoor en toont het verschil, afgerond op vijf minuten, in een klein label naast de wachttijd: een pijl omhoog met +10 min, een pijl omlaag met −5 min, of Stabiel als het verschil op nul uitkomt.\n\nEen attractie met 45 minuten en een dalende trend kan best korter zijn dan een met 40 minuten en een stijgende, tegen de tijd dat je het park bent overgestoken. De trend reageert snel, dus een enkele afwijkende meting, zoals de sprong wanneer een attractie na een storing weer opengaat, verschuift de pijl voor de volgende paar metingen.',
    aliases: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride zonder vaste rails, waarin de voertuigen vrij door de ruimte rijden, gestuurd door techniek in de vloer.',
    definition:
      'Een Trackless Ride is een dark ride waarin de voertuigen niet aan een rail vastzitten. Ze rijden zelfstandig door de ruimte, gestuurd door inductielussen, wifi of lasergeleiding in de vloer. Omdat de voertuigen alle kanten op kunnen, kunnen de decors ingewikkelder zijn en hoeft het verhaal niet in een vaste volgorde te lopen. Symbolica in Efteling is het meest bekende Nederlandse voorbeeld. Andere bekende voorbeelden: Star Wars: Rise of the Resistance (Disney) en Ratatouille: The Adventure (Disneyland Paris).',
    aliases: ['Trackless', 'Trackless Dark Ride', 'Spoorloze Rit'],

    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'AI',
    shortDefinition:
      'Kunstmatige intelligentie; hier de machine-learningmodellen die drukte-prognoses en wachttijdvoorspellingen berekenen.',
    definition:
      'AI (kunstmatige intelligentie) staat hier voor machine-learningalgoritmen die patronen in grote datasets herkennen en daaruit voorspellingen maken. park.fan traint AI-modellen op de meegeschreven wachttijden, schoolvakantieregelingen, weerdata en aangekondigde evenementen. Daarmee maakt park.fan elke dag drukte- en wachttijdprognoses, voor elk park en voor elke dag waarvoor dat park zijn openingstijden al heeft gepubliceerd.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['Kunstmatige Intelligentie'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Live wachttijd',
    shortDefinition: 'Wachttijden uit de eigen systemen van een park, elke vijf minuten ververst.',
    definition:
      'Een live wachttijd is de wachttijd die een park op dit moment voor een attractie aangeeft, in tegenstelling tot een gemiddelde over voorbije dagen. Hij verandert in de loop van de dag, en valt een attractie uit, dan zet het park haar op Storing tot ze weer open is.\n\npark.fan haalt elke vijf minuten de wachtrijgegevens van de parken op bij ThemeParks.wiki, Wartezeiten.app en Queue-Times.com. Daaronder vallen de gewone wachtrij, single rider, betaalde voorrangsrijen zoals Lightning Lane en virtuele wachtrijen, overal waar een park ze publiceert, samen met de status van elke attractie. Naast de wachttijd op een attractiekaart toont een klein label of de laatste twee metingen hoger of lager lagen dan de twee daarvoor.\n\nOok een live wachttijd blijft de schatting van het park, en de tijd die je echt in de rij staat, kan langer of korter uitvallen.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
    aliases: ['Live wachttijden', 'live wachttijd', 'realtime wachttijd'],
    alternateNames: ['Realtime wachttijd', 'Realtime wachttijden'],
  },
  {
    id: 'crowd-forecast',
    name: 'Drukte-prognose',
    shortDefinition: 'Een voorspelling met AI van hoe druk een pretpark op een bepaalde dag wordt.',
    definition:
      'Een drukte-prognose zegt hoe druk een park op een bepaalde dag wordt, en op welke uren. De prognoses van park.fan komen van Fancast, het eigen model, dat voor elke attractie en elk uur de wachttijd voorspelt en die samenvoegt tot het drukteniveau van de dag, op dezelfde schaal als de live weergave.\n\nHet model leert van de gemeten wachttijden van het park en neemt daarnaast de weersverwachting mee, schoolvakanties en feestdagen, en wat er die dag in het park gebeurt, zoals een speciaal evenement of de start van het seizoen. Het model wordt dagelijks om 06:00 UTC opnieuw getraind.\n\nDe dag erna wordt elke prognose naast de wachttijden gelegd die echt zijn gemeten, en het verschil gaat mee in de volgende training. De foutwaarden die daaruit komen, de gemiddelde procentuele fout en R², staan op park.fan en worden na elke run opnieuw berekend, ook als ze slechter worden. Op de pagina van een attractie staat een badge met de nauwkeurigheid van de prognose voor die attractie.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Drukte-prognoses', 'Fancast'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'De eenheid van versnelling die passagiers ervaren, gemeten als veelvouden van de zwaartekrachtversnelling op Aarde (9,81 m/s²).',
    definition:
      'G-kracht (gravitationeel equivalent) meet de versnelling die een passagier ervaart ten opzichte van de normale zwaartekracht van de Aarde. Positieve G-krachten (boven 1G) drukken passagiers in hun stoel tijdens dalen of scherpe bochten. Negatieve G-krachten (onder 0G) heffen passagiers uit hun stoel; dat is airtime. Laterale G-krachten werken zijdelings en duwen passagiers opzij in bochten en overgangen.\n\nEen achtbaanontwerper legt vast waar welke kracht optreedt. In het dal na een krachtige first drop kan de belasting 4–5G bedragen. Een kort moment van −0,5G op een airtime hill geeft het typische zweefgevoel. De meeste attracties blijven bij aanhoudende positieve krachten binnen 0–5G, met korte pieken daarboven. Een hoge G-belasting die langer dan enkele seconden duurt, kan ongemak of een greyout veroorzaken; daarom volgt op een zwaar stuk meestal een rustiger stuk.',
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs', 'smoothness'],
    aliases: ['G-Krachten'],
    alternateNames: ['G-Force', 'G-Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Tijdelijke verduistering van het gezichtsveld door positieve G-krachten die de bloedtoevoer naar de hersenen verminderen.',
    definition:
      'Een greyout (ook: grey-out) is een fysiologisch fenomeen waarbij een passagier die blootgesteld wordt aan sterke aanhoudende positieve G-krachten tijdelijk een grijs of wazig gezichtsveld ervaart. Positieve G-krachten duwen het bloed naar beneden, naar de ledematen, zodat er minder bloed naar de ogen en de hersenen gaat. Het gezichtsveld vernauwt zich vanaf de randen en wordt grijs. De passagier blijft bij bewustzijn, maar ziet veel minder.\n\nBij een nog hogere of langere G-belasting kan een blackout volgen (het gezichtsveld wordt helemaal zwart) of in extreme gevallen G-LOC (G-Force Induced Loss of Consciousness). Om een aanhoudende greyout te voorkomen, houden achtbaanontwerpers hoge G-pieken kort en laten ze zware stukken afwisselen met rustige.',
    aliases: ['Greyouts', 'grey-out'],
    alternateNames: ['grijs waas', 'G-kracht verduistering'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Grijze zone',
    shortDefinition:
      'Een achtbaanelement op de grens van wat een inversie is, dat per telmethode wel of niet meetelt.',
    definition:
      'De grijze zone omvat achtbaanelementen op de grens tussen een volledige inversie en een element zonder inversie. Bij klassieke inversies, zoals loopings en kurketrekkers, is er geen twijfel: de trein draait de passagier volledig ondersteboven. Elementen in de grijze zone halen net wel of net niet de 180°, en brengen de passagiers bijna ondersteboven.\n\nTypische elementen in de grijze zone zijn sterk overhellende bochten voorbij 90° en sommige varianten van de wave turn. Fabrikanten zoals RMC en Intamin gebruiken deze elementen bewust als alternatief voor klassieke inversies. Afhankelijk van de telmethode – strikt (alleen volledige rotaties) of breed (elke overheadpositie) – kan het officiële inversieaantal van een attractie variëren.',
    aliases: ['Grijze zones', 'grijze-zone'],
    alternateNames: ['borderline inversie', 'quasi-inversie'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Zijwaartse krachten die rijders in bochten, overgangen en helixen opzij in hun stoel duwen.',
    definition:
      'Laterale G-krachten zijn de zijwaartse krachten die een rijder voelt wanneer een achtbaan sneller van richting verandert dan de kanteling van de baan kan opvangen. In een goed gekantelde bocht helt het spoor zo dat de kracht naar beneden in de stoel wijst; is de kanteling kleiner dan de snelheid vraagt, dan duwt de rest de rijder naar de buitenkant van het wagentje.\n\nOntwerpers zetten ze bewust in: de vlakke, snelle bochten van een klassieke houten achtbaan en de snelle richtingswissels van een GCI-baan rijd je juist om hun laterals. Ongewenste laterals komen van een versleten spoor of van een layout die de kanteling te abrupt verandert, en die gooien rijders tegen de zijkant van het wagentje of tegen de beugel. Houten achtbanen hebben er het meest last van, omdat houten spoor door weer en gebruik verschuift en hun bochten vaak minder steil gekanteld zijn dan bij stalen banen.\n\nBalder in Liseberg (Intamin, 2003) is een houten achtbaan met vloeiende laterals in zijn bochten.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Lateralen', 'Laterale G'],
    alternateNames: ['Lateral G', 'Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Sterke negatieve G-krachten die rijders omhoog uit hun stoel trekken, zodat alleen de schootbeugel ze nog vasthoudt.',
    definition:
      'Ejector airtime is de sterke vorm van negatieve G-krachten. Over een heuvel waarvan de top scherper is dan de baan die de trein in vrije val zou volgen, valt het spoor sneller weg dan de rijder, en die wordt een fractie van een seconde uit de stoel tegen de beugel getrokken. De naam beschrijft dat gevoel: alsof je uit je stoel wordt geworpen (to eject).\n\nFloater airtime is de zachte tegenhanger, een traag opstijgen over een ronde top. Ejector vraagt snelheid en een korte, steile heuvel, en RMC-hybrides, veel Intamin-banen en moderne houten achtbanen zijn eromheen gebouwd. Untamed in Walibi Holland, Wildfire in Kolmården en Steel Vengeance in Cedar Point hebben lange reeksen ejector. De achterste rij krijgt de sterkste ejector, en een strak aangedrukte schootbeugel neemt er het meeste van weg.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Zachte, aanhoudende negatieve G-krachten waardoor rijders even zweven als de trein over de top van een heuvel gaat.',
    definition:
      'Floater airtime is de zachte vorm van negatieve G-krachten. Over een brede, ronde top volgt de trein bijna precies de baan van een voorwerp dat je weggooit, en de rijders komen een beetje los van hun stoel en blijven zo een seconde of twee hangen, bijna gewichtloos.\n\nHet is de airtime van de hyper en giga coasters van B&M, waarvan de grote parabolische heuvels daarvoor zijn getekend. Shambhala in PortAventura en Silver Star in Europa-Park hebben lange reeksen floater. Omdat het opstijgen mild is, kun je floater rondje na rondje rijden, en wie ejector te heftig vindt, kan er meestal goed mee overweg. Dezelfde heuvel kan voorin de trein floater geven en achterin ejector, omdat de achterkant de top sneller passeert.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Het gevoel van gewichtloos hangen in de beveiliging tijdens een inversie, veroorzaakt door negatieve G-krachten ondersteboven.',
    definition:
      'Hangtime is het effect van negatieve G-krachten tijdens een inversie. De trein gaat bovenin een inversie zo langzaam dat de passagiers ondersteboven in hun beugels hangen. In een snelle looping is dat moment kort; bij hangtime vertraagt de trein bovenin en duurt het langer. Het volle lichaamsgewicht rust dan op de schouderbeugel of de schootbeugel.\n\nHet sterkst is hangtime waar de trein bovenin een inversie flink vertraagt. Ook de heartline roll van sommige moderne attracties geeft hangtime.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Achtbaanelement',
    shortDefinition:
      'Een onderdeel van een achtbaanparcours met een eigen naam, zoals een looping, een airtime hill of een inversie.',
    definition:
      'Een achtbaanelement is een stuk van het parcours van een achtbaan met een eigen naam. Sommige zijn inversies, zoals de verticale looping, de kurkentrekker of de zero-G roll; andere houden de rijders rechtop, zoals de airtime hill, de helix en de overbank. Elk element is getekend om de rijder een bepaalde kracht te laten voelen: negatieve G over een top, laterale G in een bocht, positieve G onder in een looping, of de rotatie van het ondersteboven gaan.\n\nDe namen maken parcoursen vergelijkbaar. Van een achtbaan die je beschrijft als een lifthill, een first drop, een dive loop, een camelback en een helix weet je de helft al voordat iemand erin heeft gezeten. Sommige elementen horen bij één fabrikant, zoals de stall en de wave turn van Rocky Mountain Construction, en er komen nog steeds nieuwe bij; de celestial spin van Mack Rides op Stardust Racers (2025) is een van de nieuwste.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Achtbaanelementen'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Eerste rij',
    shortDefinition:
      'De eerste rij stoelen in een attractievoertuig, met het vrijste zicht op de baan.',
    definition:
      'De eerste rij is de voorste rij van een achtbaantrein, zonder iemand voor je en met vrij zicht op het spoor. Wie daar zit, ziet elke afdaling en elke bocht aankomen, en bij een lancering krijgt die de wind vol in het gezicht.\n\nBovenaan een afdaling wordt het voorste wagentje nog tegengehouden door de rest van de trein, die erachter nog aan het klimmen is, en zo gaat het met de laagste snelheid van alle rijen over de top; de sterke airtime bovenaan is voor achterin. Wat de eerste rij krijgt, is het zicht naar beneden voordat de trein over de rand gaat.\n\nIn veel parken kun je op het perron bij een aparte poort wachten op de eerste rij, en dat kost een paar treinen extra wachttijd.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    aliases: ['Voorstoelplaats', 'Eerste plaats'],
  },
  {
    id: 'back-row',
    name: 'Achterste rij',
    shortDefinition:
      'De laatste rij stoelen in een attractievoertuig, waar de airtime op parcoursen met veel heuvels meestal het sterkst is.',
    definition:
      'De achterste rij is de laatste rij van een achtbaantrein. Als de voorkant van de trein over een top gaat, is de achterkant nog aan het klimmen; tegen de tijd dat het laatste wagentje bovenaan is, gaat de rest van de trein al omlaag en trekt het op volle snelheid over de top. De achterste rij gaat daarom over elke top het snelst en krijgt de sterkste ejector airtime, en op een first drop wordt ze over de top gezwiept terwijl de eerste rij er rustig overheen gaat.\n\nOp airtime-achtbanen zoals Goliath in Walibi Holland of Shambhala in PortAventura is de achterste rij de plek met de sterkste airtime. Op oudere achtbanen rijdt het laatste wagentje soms ook het ruwst, en het uitzicht naar voren bestaat uit de rugleuningen voor je.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    aliases: ['Achterzitplaats', 'Laatste plaats'],
  },
  {
    id: 'middle-row',
    name: 'Middelste rij',
    shortDefinition:
      'De middelste rijen van een achtbaantrein, tussen de eerste en de achterste rij in.',
    definition:
      'De middelste rijen zijn de zitplaatsen midden in een achtbaantrein, tussen de eerste rij met het uitzicht en de achterste rij met de ejector airtime. In het midden zie je nog genoeg van het parcours dat komt en voel je flink wat airtime, maar geen van beide uitersten. Voor gezinnen en voor wie voor het eerst rijdt en de heftigheid vreest, is het midden daardoor een rustiger plek.\n\nOp achtbanen met veel zijwaartse krachten voelen de middelste rijen soms de sterkste compressie, omdat ze in het zwaartepunt van de trein zitten.',
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    aliases: ['Middelzitplaats', 'Middel rij'],
  },
  {
    id: 'ride-cart',
    name: 'Wagentje',
    shortDefinition: 'Een los voertuig in een achtbaantrein, met één of meer rijen passagiers.',
    definition:
      'Een wagentje is één voertuig van een achtbaantrein: een onderstel met wielen, daarboven één of meer rijen stoelen, en de beugels. Een paar gekoppelde wagentjes vormen een trein; een kleine familieachtbaan rijdt soms met één wagentje. Elk wagentje loopt aan elke kant op drie sets wielen, op de rail, eronder en ertegen, en die houden het op het spoor bij negatieve en laterale G-krachten.\n\nDe vorm van het wagentje volgt uit het parcours. Een inverted coaster hangt zijn wagentjes onder het spoor, een wing coaster zet de rijders aan weerszijden van de rail met niets onder hen, een flying coaster kantelt ze met het gezicht naar beneden en een spinning coaster zet zijn stoelen op een draaischijf. Fabrikanten bouwen hun eigen wagentjes, en zo herken je de stoelen en beugels van een B&M, een Intamin of een Mack van het ene park tot het andere.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    aliases: ['Auto', 'Car'],
  },
  {
    id: 'lap-bar',
    name: 'Schootbeugel',
    shortDefinition:
      'Een veiligheidsbeugel over de schoot die meer bewegingsvrijheid laat dan een schouderbeugel.',
    definition:
      'Een schootbeugel komt over de bovenbenen van de rijder en vergrendelt daar, terwijl het bovenlichaam vrij blijft. Op de meeste moderne achtbanen is het een individuele beugel of een T-beugel met een ratel of een hydraulisch slot, vaak samen met een gordel als tweede, onafhankelijke beveiliging.\n\nHet is de gewone beugel op hyper en giga coasters, op de meeste houten achtbanen en op veel familieattracties, omdat rijders er bovenop een heuvel mee uit hun stoel kunnen komen tot de beugel ze tegenhoudt. Op dat moment voel je airtime, en hoe ver je omhoog kunt, hangt af van hoe ver de beugel in het station is aangedrukt; een operator die hem te ver aandrukt, neemt de airtime weg, en dat heet bij rijders stapling.\n\nHoe de beugel past, hangt af van de lichaamsbouw. Een beugel die bij de ene rijder op de bovenbenen rust, zit bij de andere op de buik, en veel parken zetten een teststoel bij de ingang van attracties met krappe beugels.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
    aliases: ['Schoot-beugel'],
  },
  {
    id: 'shoulder-harness',
    name: 'Schouderbeugel',
    shortDefinition:
      'Een veiligheidsbeugel over de schouders die het hele bovenlichaam omsluit en de bewegingsvrijheid tijdens de rit beperkt.',
    definition:
      'Een schouderbeugel komt over beide schouders naar beneden en vergrendelt over de schoot, zodat het bovenlichaam van de rijder in een gevoerd frame zit. In de jaren 80 en 90 werd hij de gewone beugel op stalen achtbanen met loopings, en op de meeste inverted coasters en veel hangende familieachtbanen is hij nog altijd standaard.\n\nDe beugel houdt de schouders vast en niet alleen de heupen, en dat telt wanneer een trein langzaam ondersteboven hangt of hard van richting verandert. Het nadeel merk je aan je hoofd: op een ruw spoor tikt de vulling tegen je oren, en over airtime-heuvels kom je niet ver omhoog, omdat de beugel je eerder tegenhoudt dan een schootbeugel zou doen. Nieuwere ontwerpen gebruiken zachtere vesten in plaats van harde schouderbeugels, en Rocky Mountain Construction laat rijders over de kop gaan met alleen een schootbeugel.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
    aliases: ['OTS-beugel'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition:
      'Een aandenken of klein voorwerp dat je in een pretpark koopt als herinnering aan het bezoek.',
    definition:
      'Een souvenir is iets wat je in een park koopt als herinnering aan je bezoek: een T-shirt of pet met het parklogo, een pin, een ansichtkaart, een knuffel van de mascotte, een modelletje van een attractie. De meeste worden verkocht in de winkels bij de uitgang van het park en bij de uitgangen van de grote attracties.\n\nDe prijzen liggen een flink stuk boven die van vergelijkbare spullen in een gewone winkel, en artikelen die bij één park of één attractie horen, zijn alleen daar te koop. De ridefoto is een souvenir op zich: een camera in de afdaling maakt hem, en hij wordt aan de balie bij de uitgang verkocht, afgedrukt of als download. Verzamelen heeft ook zijn liefhebbers, met het ruilen van pins in de Disney-parken als bekendste voorbeeld.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    aliases: ['Souvenir', 'Aandenken'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Officiële producten die een pretpark verkoopt, zoals kleding, verzamelobjecten en thema-artikelen.',
    definition:
      'Merchandise is alles wat een park verkoopt dat geen eten, drinken of toegang is: kleding met het logo van het park of een attractie, knuffels, pins, mokken, speelgoed rond een film of een mascotte, en thema-artikelen voor één themagebied of één attractie. Grote parken verkopen het op tientallen plekken, van karretjes langs de paden tot grote winkels bij de hoofdingang die open blijven als de attracties al dicht zijn.\n\nIn de parken van Disney en Universal leveren gelicentieerde films een groot deel van het aanbod, en een themagebied rond een film verkoopt de rekwisieten ervan: toverstokken bij Ollivanders in The Wizarding World of Harry Potter, lightsabers die je zelf in elkaar zet in Savi’s Workshop in Galaxy’s Edge. Parken met eigen figuren verkopen die, zoals Europa-Park met Ed Euromaus of de Efteling met zijn sprookjesfiguren. Een nieuwe attractie opent meestal met een eigen lijn.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Souvenirboutique',
    shortDefinition:
      'Een winkel in een pretpark die souvenirs, merchandise en thema-artikelen verkoopt.',
    definition:
      'Een souvenirboutique is een winkel in een park, in een resorthotel of bij de uitgang van een attractie, die souvenirs en merchandise verkoopt. Grote parken hebben er tientallen, van kleine kiosken tot gebouwen zo groot als een warenhuis bij de hoofdingang. Die grote winkels zijn het laatste waar bezoekers langskomen op weg naar buiten, en ze blijven open als de attracties al dicht zijn.\n\nVeel attracties eindigen in een eigen winkel, en het uitgangspad loopt erdoorheen: je stapt uit en loopt langs schappen met T-shirts, knuffels en foto’s van die attractie voordat je weer buiten staat. Die winkels zijn in het thema van de attractie ingericht en hebben een kleiner aanbod dan de grote winkels.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
    aliases: ['Souvenirwinkel'],
  },
  {
    id: 'park-exclusive',
    name: 'Parkexclusief',
    shortDefinition:
      'Een product dat alleen in één bepaald pretpark of binnen één parkgroep te koop is.',
    definition:
      'Een parkexclusief artikel is merchandise die alleen in één park of binnen één groep parken wordt verkocht, en niet in de gewone winkels van het merk. Typische voorbeelden zijn T-shirts en pins met het logo van een attractie, knuffels van een parkmascotte, artikelen bij een jubileum of een nieuwe attractie, en seizoenslijnen voor Halloween of Kerstmis.\n\nOp het label staat meestal dat het om een exclusief artikel gaat. Beperkte oplagen raken uitverkocht, en de zeldzamere stukken duiken op tweedehandsplatforms op voor meer dan de winkelprijs. De Disney-parken brengen pins uit in genummerde, beperkte oplagen, waarvoor verzamelaars op de dag van uitgifte in de rij staan.\n\nVerschillende parken verkopen een deel van hun aanbod nu ook in hun eigen webshop, en daarmee wordt het begrip ruimer: een artikel kan exclusief zijn omdat geen enkele andere winkel het heeft, en toch thuis te bestellen zijn.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Exclusief'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition:
      'Achtbaan waarin rijders liggend en met het gezicht naar beneden onder het spoor hangen.',
    definition:
      'Een flying coaster houdt de rijders horizontaal onder het spoor, met het gezicht naar beneden, in de houding van iemand die vliegt. Je stapt rechtop zittend in, in stoelen die onder de rail hangen. Zodra de beugels vergrendeld zijn, kantelen de stoelen naar achteren tot je op je rug ligt en naar de lucht kijkt, en zo gaat de trein de lifthill op. Bovenaan draait een twist in het spoor hem om, en de rest van de rit lig je op je buik.\n\nDe Flyer van B&M is de bekendste versie. Galactica in Alton Towers opende in 2002 als Air, de eerste B&M Flyer; Tatsu in Six Flags Magic Mountain (2006) en Manta in SeaWorld Orlando (2009) volgden. Het element dat bij de B&M Flyer hoort, is de pretzel loop: de trein duikt van bovenaf een looping in, en het laagste punt daarvan passeren de rijders op hun rug, hard in de stoel gedrukt.\n\nInstappen duurt langer dan bij een zittende achtbaan, omdat de stoelen voor elk vertrek moeten kantelen en na elke aankomst weer terug.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['vliegende achtbaan', 'Superman rit'],
    alternateNames: ['flyer', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mijntrein',
    shortDefinition: 'Stalen familieachtbaan in het thema van een mijntreintje.',
    definition:
      'Een mijntrein is een stalen familieachtbaan, aangekleed als een op hol geslagen ertstrein in een mijnstadje of een woestijncanyon. Een locomotief rijdt voorop, en het spoor blijft laag en slingert tussen rotsen, door tunnels en langs vervallen gebouwen. De rit draait om snelle bochten en korte afdalingen vlak langs het decor, en hoogte speelt nauwelijks een rol. Vaak verdelen meerdere lifthills de rit in delen, elk met een eigen scène.\n\nArrow Development bouwde de eerste in de jaren 60. Run-A-Way Mine Train in Six Flags Over Texas (1966) was een van de vroegste, en tot 1997 bouwde Arrow er zestien. Big Thunder Mountain Railroad opende in 1979 in Disneyland. De versie in Disneyland Paris (1992) staat op een eiland in de Rivers of the Far West, dat je via een tunnel onder het water bereikt, en je mag erin vanaf 102 cm. Colorado Adventure in Phantasialand (Vekoma, 1996) perst een lang parcours op een klein stuk grond.',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    aliases: ['mijnwagentje'],
    alternateNames: ['mine coaster', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Achtbaan die het natuurlijke landschap volgt.',
    definition:
      'Een terrain coaster volgt de grond waarop hij staat. In plaats van het hele parcours op een stalen of houten constructie te tillen, laat de ontwerper het spoor langs een helling omlaag lopen, ravijnen in en door bos, zodat een deel van de hoogte uit het landschap komt en de constructie laag blijft. Met bomen en rotsen een paar meter van de rails voelt de rit sneller dan de snelheidsmeter aangeeft.\n\nThe Beast in Kings Island (1979) is het klassieke houten voorbeeld, een lange rit door een stuk bos dat grotendeels buiten het zicht van het park ligt. Ravine Flyer II in Waldameer (2008) gaat op een brug over een weg en duikt een ravijn in. In Europa volgt Lisebergbanan in Göteborg (1987) de steile heuvel waarop het park is gebouwd. Anton Schwarzkopf en Werner Stengel ontwierpen hem, en hun plan hield het spoor dichter bij de grond dan een concurrerend ontwerp van Vekoma, zodat er minder bomen gekapt hoefden te worden.',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    aliases: ['landschapsachtbaan', 'grondgebonden achtbaan'],
    alternateNames: ['terrain coaster'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition:
      'Stalen achtbaan waarbij de vloer wegzakt, zodat de voeten van de rijders vrij hangen.',
    definition:
      'Een floorless coaster is een zittende stalen achtbaan waarvan de wagentjes geen vloer hebben. De stoelen staan op een frame boven het spoor, en het station heeft een eigen vloer waarop de rijders staan terwijl ze instappen. Zodra alle beugels vergrendeld zijn, klapt of zakt die stationsvloer weg, en de trein vertrekt met de benen bungelend vlak boven de rails. Het spoor loopt eronder, zoals bij elke zittende achtbaan, dus het zicht en de inversies zijn die van een loopingachtbaan, met niets onder je voeten.\n\nB&M bouwde de eerste, Medusa in Six Flags Great Adventure, die in april 1999 opende, en het jaar daarop volgden er nog vier, waaronder Kraken in SeaWorld Orlando. In Europa is Superman la Atracción de Acero in Parque Warner Madrid (2002) er een. Cedar Point bouwde zijn stand-up coaster Mantis uit 1996 in 2015 om tot de floorless Rougarou, op hetzelfde spoor met nieuwe treinen.',
    relatedTermIds: [
      'b-and-m',
      'dive-coaster',
      'inverted-coaster',
      'stand-up-coaster',
      'steel-coaster',
    ],
    aliases: ['achtbaan zonder vloer'],
    alternateNames: ['floorless', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition:
      'Amerikaans achtbaanfabrikant verantwoordelijk voor de eerste moderne inversie.',
    definition:
      'Arrow Dynamics (opgericht in 1946 als Arrow Development, in 1986 hernoemd) was een Amerikaanse fabrikant die de moderne buisstalen rail introduceerde en met Corkscrew (Knott’s Berry Farm, 1975) de eerste moderne inversie bouwde, een kurkentrekker. Typisch voor Arrow zijn corkscrews en suspended looping coasters. Het bedrijf vroeg in 2001 faillissement aan en de activa werden overgenomen door S&S.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition: 'Amerikaanse bouwer van houten achtbanen met snelle, kronkelende parcoursen.',
    definition:
      'Great Coasters International (GCI) is een bouwer van houten achtbanen uit Sunbury, Pennsylvania, in 1994 opgericht door Clair Hain Jr. en Mike Boodley, die eerder samen bij Custom Coasters International hadden gewerkt. GCI-parcoursen kronkelen op een compact stuk grond vele keren over en onder zichzelf door, met snelle richtingswissels en airtime over de toppen.\n\nHet bedrijf bouwt zijn eigen treinen, de Millennium Flyer, uit korte, scharnierende wagentjes, zodat de trein krappe bochten soepeler neemt dan de lange, stijve treinen van oudere houten achtbanen. In de Verenigde Staten zijn Thunderhead in Dollywood (2004) en Mystic Timbers in Kings Island (2017) GCI-banen. Troy in Toverland (2007) was de tweede Europese achtbaan van het bedrijf, na Thunderbird in Finland; Joris en de Draak in de Efteling (2010) is een racing coaster met twee sporen, en Wodan Timburcoaster in Europa-Park opende in 2012.',
    relatedTermIds: ['airtime', 'cci', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Amerikaanse fabrikant van LSM- en LIM-lanceerachtbanen, in Europa vooral bekend van Sky Scream.',
    definition:
      'Premier Rides (opgericht 1995, Baltimore, Maryland) is een Amerikaanse fabrikant van lanceersystemen met lineaire synchrone motoren (LSM) en lineaire inductiemotoren (LIM). De Sky Rocket II, een compacte launch coaster met één inversie, staat in middelgrote parken over de hele wereld.\n\nIn Europa is Premier Rides vooral bekend van Sky Scream in Holiday Park (Haßloch, Duitsland), een Sky Rocket II met één inversie, een heartline roll.',
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Duits fabrikant uit München bekend om spinning coasters met trick track, het X-Car-platform en het verticale Sky Loop-model.',
    definition:
      'Maurer Rides (Maurer AG, metaalbewerking sinds 1876, attracties vanaf 1993) is een fabrikant uit München. De SC-serie spinning coasters heeft een kenmerkend trick track-segment – een sectie waarbij de wagon zijwaarts kantelt – en met het X-Car-platform zijn compacte lay-outs op maat mogelijk, met launches en inversies.\n\nDe Sky Loop is een model met één verticale looping dat weinig ruimte inneemt en in veel Europese parken staat. Bekende Europese installaties: Winja’s Fear en Winja’s Force in Phantasialand (Duitsland), indoor spinning coasters met trick track.',
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Italiaanse fabrikant met een van de grootste assortimenten familieachtbanen en -attracties ter wereld en meer dan 350 geïnstalleerde achtbanen.',
    definition:
      'Zamperla (opgericht 1966, Altavilla Vicentina, Italië) is een van de productiefste attractiefabrikanten ter wereld. Waar Intamin, B&M en Mack vooral grote thrill-attracties bouwen, levert Zamperla veel kleinere attracties voor een breed publiek. De Family Coaster, Mini Coaster, Twister en Disk’O Coaster staan in kleinere parken en vakantieresorts over de hele wereld.\n\nOmdat ze weinig ruimte innemen en matige lengte-eisen hebben, staan Zamperla-attracties vaak in Europese stadsparken, vakantieparken en overdekte parken. Het bedrijf bouwde ook Thunderbolt op Coney Island (New York).',
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'Duits fabrikant van attracties uit Bremen, bekend van de Top Spin, Break Dance, Enterprise, Ranger en Condor.',
    definition:
      'Huss is een Duits bedrijf uit Bremen, opgericht in 1919, dat sinds 1969 attracties bouwt. Na een faillissement in 2006 ging het verder als HUSS Park Attractions GmbH. Het bedrijf bouwde in de late 20e eeuw flat rides die in pretparken en op kermissen over de hele wereld staan.\n\nBekende Huss-modellen zijn de Top Spin, de Break Dance (draaiende voertuigen op een draaiend platform), de Enterprise (centrifugaal gondelwiel, oorspronkelijk van Schwarzkopf), de Ranger (looping-pendel met een kooigondel), de Condor (draaiende stoelentoren) en de Troïka. Veel van deze ontwerpen zijn door andere fabrikanten nagebouwd. In Europese parken stonden Huss-attracties vooral in de jaren tachtig en negentig overal.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Amerikaans fabrikant bekend om pneumatische droptorens, de compacte El Loco en Free Fly 4D-achtbanen.',
    definition:
      'S&S Worldwide (opgericht 1994, Logan, Utah; overgenomen door Sansei Technologies in 2012) ontwikkelde oorspronkelijk pneumatische droptorens – Space Shot en Turbo Drop – voordat het bedrijf uitbreidde naar achtbanen. De El Loco is een compacte achtbaan met een voorbij-verticale eerste afdaling en een inversie, op een heel klein grondoppervlak. De Free Fly is een 4D-achtbaan waarbij de stoel vrij draait.\n\nS&S nam ook de activa van Arrow Dynamics over na diens faillissement in 2001. In Europa zijn S&S-installaties minder gangbaar dan in Noord-Amerika.',
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei', 'S&S – Sansei Technologies'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Duits fabrikant uit Beieren gespecialiseerd in gezinsachtbanen, met wereldwijd meer dan 190 gebouwde achtbanen.',
    definition:
      'Zierer (opgericht 1930, Deggendorf, Beieren) is een Duits fabrikant gespecialiseerd in gezinsachtbanen en klassieke parkattracties. De Force Coaster-reeks loopt van compacte juniormodellen tot snellere Force Custom-installaties. Zierer-achtbanen hebben een stalen buisrail, rijden soepel en hebben matige lengte-eisen, zodat ze passen in parken met een breed publiek.\n\nZierer heeft wereldwijd meer dan 190 achtbanen geleverd en is daarmee, gemeten in aantallen, een van de productiefste achtbaanbouwers van Europa. Bekende installaties: Feuerdrache in Legoland Deutschland en gezinsachtbanen in Duitse, Nederlandse en Scandinavische parken.',
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversie waarbij de trein kort ondersteboven bijna stilstaat.',
    definition:
      'Een stall (ook zero-G stall) is een element waarbij de trein bovenin een inversie bijna tot stilstand komt, zodat de passagiers ondersteboven hangen. Rocky Mountain Construction (RMC) ontwikkelde het element; het geeft langere hangtime. Bekende voorbeelden: Zadra (Energylandia) en Steel Vengeance (Cedar Point).',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['RMC stall', 'hangtime element', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      'Gekantelde richtingsverandering met een moment van sterke airtime midden in de bocht.',
    definition:
      'Een wave turn is een airtime hill die op zijn zij is gelegd. Het spoor gaat omhoog en omlaag zoals bij een camelback, maar staat daarbij ongeveer 90 graden gekanteld, zodat het van bovenaf gezien een bocht is. In de stoel voel je de airtime tegelijk omhoog en opzij: rijders worden op hetzelfde moment naar de buitenkant van de bocht en uit hun stoel gegooid, en de beugel houdt ze in beide richtingen tegen.\n\nRocky Mountain Construction bedacht de naam. Outlaw Run in Silver Dollar City (2013) en Lightning Rod in Dollywood (2016) hebben wave turns, en inmiddels gebruiken ook andere fabrikanten het element: B&M op Orion in Kings Island (2020), Intamin op Toutatis in Parc Astérix (2023) en Mack Rides op Voltron Nevera in Europa-Park (2024).\n\nEen overbank kantelt verder dan 90 graden en rijd je met je lichaam in de stoel gedrukt; de wave turn blijft rond 90 graden en is getekend voor airtime.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc', 's-hill'],
    aliases: ['wave turn', 'airtime bocht'],
  },
  {
    id: 'shoulder-season',
    name: 'Tussenseizoen',
    shortDefinition: 'Periode tussen hoog- en laagseizoen met matige drukte.',
    definition:
      'Het tussenseizoen is de overgang tussen het hoogseizoen en de rustigste perioden van een pretpark. Bij Europese parken zijn dat meestal de lente (maart–mei) en het vroege najaar (september–oktober). De drukte is matig, de prijzen zijn vaak lager en de meeste attracties zijn open.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    aliases: ['shoulder season', 'rustige periode'],
  },
  {
    id: 'school-holiday',
    name: 'Schoolvakantie',
    shortDefinition:
      'Vakantieperiode van de scholen, waarin de drukte in pretparken sterk oploopt.',
    definition:
      'Schoolvakanties zijn de weken waarin de scholen dicht zijn: de zomer, kerst en nieuwjaar, Pasen, en in veel landen ook een herfstvakantie en een voorjaars- of krokusvakantie. Gezinnen met schoolgaande kinderen kunnen alleen dan op reis, en dan lopen de parken vol.\n\nHet effect hangt af van wiens vakantie het is. Duitsland spreidt de zomervakantie per deelstaat, zodat een park binnen bereik van meerdere deelstaten een lange drukke zomer heeft in plaats van één scherpe piek; Nederland verdeelt de zomer over drie regio’s met verschillende data. Een park bij een grens, zoals Europa-Park bij Frankrijk en Zwitserland of Phantasialand binnen bereik van Nederland en België, haalt bezoekers uit meerdere landen met elk hun eigen kalender, en een week die in het ene land rustig is, kan in het andere vol zitten.\n\nDe voorspelling van park.fan houdt rekening met schoolvakanties, en de pagina met de beste bezoektijd van elk park toont per maand hoeveel drukker de vakanties het maken.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
    aliases: [
      'vakantie',
      'zomervakantie',
      'kerstvakantie',
      'paasvakantie',
      'herfstvakantie',
      'school holiday',
      'school holidays',
    ],
  },
  {
    id: 'photo-pass',
    name: 'Fotopass',
    shortDefinition: 'Service voor onbeperkte digitale parkfoto’s en ritfoto’s.',
    definition:
      'Een fotopass (of Memory Maker) is een optionele toevoeging die digitale toegang geeft tot alle professioneel gemaakte foto’s en video’s van een parkbezoek, zoals ritfoto’s, foto’s bij ontmoetingen met personages en foto’s van rondlopende fotografen. Het is een vast pakket en kan voordelig zijn voor gezinnen die anders veel losse foto’s zouden kopen. Bekende voorbeelden: Memory Maker (Disney) en Photo Pass (Universal).',
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
    aliases: ['Memory Maker', 'fotopakket', 'parkfoto’s', 'photo pass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Toegankelijkheidspas',
    shortDefinition:
      'Pas voor gasten met een beperking voor attractietoegang met verminderde wachttijd.',
    definition:
      'Een toegankelijkheidspas (ook DAS – Disability Access Service, toegankelijkheidskaart of attractietoegangspas) is er voor gasten die wegens een beperking niet in een gewone wachtrij kunnen staan. De gast en een vast aantal begeleiders komen dan op een afgesproken tijd terug in plaats van in de rij te wachten. Criteria en procedures variëren per park en land.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'DAS',
      'Disability Access Service',
      'gehandicaptenpas',
      'rolstoelpas',
      'accessibility pass',
    ],
  },
  {
    id: 'motion-simulator',
    name: 'Bewegingssimulator',
    shortDefinition: 'Attractie die een bewegend platform combineert met een filmscherm.',
    definition:
      'Een bewegingssimulator zet rijders in een cabine of op een platform dat in de maat van een film beweegt. Het platform staat op hydraulische of elektrische actuatoren, meestal zes, die het binnen een kleine marge kantelen, voorover en achterover laten hellen, optillen en laten rollen, terwijl het scherm een veel grotere beweging toont. Het lichaam neemt het kantelen van de cabine waar als versnelling, en de ogen vullen de rest in. Er is geen spoor, en de cabine gaat nergens heen.\n\nStar Tours opende in januari 1987 in Disneyland met cabines van Rediffusion Simulation, een Brits bedrijf dat vluchtsimulators voor de opleiding van piloten bouwde; de versie in Disneyland Paris volgde in 1992. Sinds 2011 wordt de film van Star Tours samengesteld uit willekeurig gekozen fragmenten, zodat twee ritten na elkaar zelden hetzelfde zijn. Flying theatres zoals Voletarium in Europa-Park (2017) zijn een latere tak van hetzelfde idee, met rijen stoelen die voor een koepelscherm de lucht in gaan.\n\nSimulators vervoeren veel rijders voor de ruimte die ze innemen, en met een nieuwe film krijgt de attractie een nieuwe inhoud. Bewegingsziekte ontstaat er door het verschil tussen wat de ogen zien en wat het evenwichtsorgaan voelt.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
    aliases: [
      'simulator attractie',
      '4D-attractie',
      'vluchtsimulator',
      'motion simulator',
      'sim ride',
    ],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Ontmoeting met personages',
    shortDefinition:
      'Een gepland moment om een gekostumeerd personage van het park in het echt te ontmoeten.',
    definition:
      'Een ontmoeting met personages, meestal meet and greet genoemd, is een vaste plek en tijd waar een gekostumeerd personage bezoekers ontmoet, telkens één gezin, voor een foto, een kort praatje en een handtekening. Sommige personages hebben een eigen gebouw met een wachtrij en een aangegeven wachttijd; andere verschijnen op een gemarkeerde plek volgens een schema in de app of het programmaboekje van het park. Meestal staat er een fotograaf bij, en de foto’s worden achteraf verkocht of zitten bij een fotopas inbegrepen.\n\nIn de parken van Disney en Universal komen de personages uit de films. Europese parken gebruiken hun eigen figuren of figuren waarvoor ze een licentie hebben: Europa-Park heeft zijn mascottes Ed Euromaus en Edda Euromausi, de Efteling zijn narren Pardoes en Pardijn, en Plopsaland De Panne de figuren van Studio 100, zoals Maya de Bij en Kabouter Plop. Gezinnen met jonge kinderen plannen hun dag rond de tijden.',
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
    aliases: ['meet and greet', 'karakterbeleving', 'character meet and greet', 'karakteroptreden'],
  },
  {
    id: 'pre-show',
    name: 'Voorshow',
    shortDefinition:
      'Wachtruimte die gasten voorbereidt op een attractie met verhalende elementen.',
    definition:
      'In een voorshow komen gasten vóór de eigenlijke rit samen voor het begin van het verhaal, de veiligheidsinstructies of een korte show. Een voorshow hoort bij het verhaal en regelt tegelijk de doorstroom naar de attractie. Bekende voorbeelden: de kamer die uitrekt (Stretching Room) in de Haunted Mansion en de veiligheidsvideo van Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pre show', 'wachtzaalanimatie', 'stagingzone', 'pre-show'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition: 'Attractie op de grond die draait of slingert, zonder railcircuit.',
    definition:
      'Flat rides zijn attracties die op een min of meer horizontaal vlak werken, zonder verhoogde rails. De term omvat draaiattracties (carrousels, theekopjes), Frisbees (pendelattracties), Top Spins en zweefmolens, drop towers en draaiende platforms.\n\nFlat rides nemen doorgaans minder grond in dan achtbanen en passen daardoor ook in kleinere parkdelen. Veel flat rides hebben een hoge capaciteit en een lage of geen minimumlengte, en een groot deel van het aanbod voor gezinnen en kinderen in een park bestaat uit flat rides.',
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['flat rides', 'kermisattractie', 'grondattractie'],
  },
  {
    id: 'water-ride',
    name: 'Waterattractie',
    shortDefinition:
      'Attractie waarbij gasten in boten of voertuigen door water worden vervoerd en nat worden.',
    definition:
      'Een waterattractie is elke attractie waarin water de hoofdrol speelt: het voertuig vaart door een kanaal, of water wordt als effect ingezet. De drie meest voorkomende typen zijn: wildwaterbanen (bootjes door een goot met eindval), wildwaterritten (ronde vlotten door turbulent kunstmatig water) en waterpistoolattracties waarbij bezoekers elkaar bespuiten. Waterattracties hebben doorgaans lage minimumlengte-eisen en een breed publiek. Op warme zomerdagen kunnen de wachttijden extreem lang worden.',
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ['waterrit', 'waterbaan', 'natte attractie', 'water ride'],
  },
  {
    id: 'live-show',
    name: 'Live Show',
    shortDefinition:
      'Gepland optreden met live acteurs, muziek, stunts of personages in een theater of amfitheater.',
    definition:
      'Een live show is een geplande voorstelling door mensen op een podium, in een openluchtamfitheater, een overdekt theater of op straat. Het gaat om theaterproducties in Broadway-stijl, stuntshows, parades met personages, 4D-bioscoopshows met live elementen en laser- en vuurwerkshows. Anders dan attracties spelen live shows op vaste tijden en met een beperkt aantal plaatsen per voorstelling, dus die tijden moet je in je dagplanning inpassen. Een show is een goede pauze in de drukste middaguren, wanneer de wachtrijen het langst zijn.',
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    aliases: ['show', 'liveshow', 'stuntshow', 'theatershow', 'live entertainment'],
  },
  {
    id: 'quick-service',
    name: 'Snelrestaurant',
    shortDefinition: 'Restaurant waar je aan de balie bestelt, zonder bediening aan tafel.',
    definition:
      'Een snelrestaurant, bij Disney quick service, is een restaurant in een park waar je aan een balie of een kiosk bestelt, betaalt en zelf een dienblad naar een tafel draagt. Hamburgers, pizza, bowls en friet vullen de menukaart, een maaltijd is een paar minuten na de bestelling klaar, en reserveren hoeft niet. Het is de meest voorkomende soort restaurant in een pretpark, en daar ontstaan rond lunchtijd de rijen.\n\nDe term quick service komt van Disney. Zijn horecasysteem deelt restaurants in in quick service en table service, en het Disney Dining Plan telde die twee als aparte credits. Elders heet hetzelfde counter service of zelfbediening.\n\nDe balies zijn het drukst rond de middag en opnieuw voor een avondshow. Veel parken nemen bestellingen aan via hun app, en dan verschuift de wachttijd van de kassa naar de afhaalbalie. Een food court zet meerdere van zulke balies rond één zitruimte.',
    relatedTermIds: ['character-dining', 'table-service'],
    aliases: ['counter service', 'fastfood', 'zelfbediening', 'quick service', 'snelle hap'],
  },
  {
    id: 'table-service',
    name: 'Tafelservice',
    shortDefinition: 'Restaurant met bediening aan tafel, waar reserveren vaak nodig is.',
    definition:
      'Een restaurant met tafelservice is een zitrestaurant in een park of in een van zijn hotels, waar een ober de bestelling aan tafel opneemt. Een maaltijd duurt een uur of langer en kost een flink stuk meer dan een maaltijd aan de balie, en de eetzaal is midden op de dag een rustige plek uit de zon of de regen.\n\nIn de Disney-parken zijn de populaire restaurants volgeboekt, en reserveren kan vanaf 60 dagen vooraf. Het Disney Dining Plan telt ze als table-servicecredits, en de signature restaurants als twee. Een diner met personages is een maaltijd met tafelservice waarbij gekostumeerde personages langs de tafels komen.\n\nEuropese parken hebben hun eigen restaurants, van themarestaurants in de themagebieden tot fine dining in de resorthotels. In Europa-Park heeft Ammolite, in de vuurtoren van hotel Bell Rock, twee Michelinsterren.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    aliases: ['table service', 'zitrestaurant', 'bediening aan tafel', 'reserveringsrestaurant'],
  },
  {
    id: 'character-dining',
    name: 'Diner met personages',
    shortDefinition:
      'Restaurant waar gekostumeerde personages tijdens de maaltijd langs de tafels komen.',
    definition:
      'Een diner met personages (character dining) is een maaltijd, meestal een buffet of een vast menu met bediening aan tafel, waarbij gekostumeerde personages van tafel naar tafel gaan. Elk personage blijft lang genoeg staan voor een praatje, een foto en een handtekening in het boekje, zodat een gezin tijdens één maaltijd meerdere personages ontmoet zonder voor elk apart bij een meet and greet in de rij te staan.\n\nIn de Disney-parken zijn deze maaltijden vroeg volgeboekt, en ze kosten meer dan een buffet of menu zonder personages. Chef Mickey’s in Disney’s Contemporary Resort en Cinderella’s Royal Table in het kasteel van Magic Kingdom zijn de bekendste voorbeelden in Florida. In Disneyland Paris verschijnen de prinsessen in Auberge de Cendrillon in Fantasyland, bij het ontbijt, de lunch en het diner.\n\nBuiten Disney bestaat de formule op kleinere schaal. Bij een verblijf in een hotel van Europa-Park kan een ontbijt horen waarbij de mascottes Ed Euromaus en Edda Euromausi langskomen.',
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
    aliases: [
      'ontbijt met karakters',
      'lunch met karakters',
      'diner met karakters',
      'character dining',
    ],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition:
      'Torenattractie die gasten omhoogbrengt en ze in vrije val naar beneden laat vallen.',
    definition:
      'Een drop tower (ook vrije-val-toren of free-fall tower) is een attractie waarbij bezoekers in een gondel of in losse stoelen rondom een centrale torenconstructie worden omhooggebracht en vervolgens in een snelle val naar beneden worden losgelaten. De val kan nagenoeg gewichtloos zijn (echte vrije val), geremd, of gecombineerd met een katapultimpuls omhoog. Onderin remt het systeem de gondel geleidelijk af. Varianten zijn roterende drop towers, meerdimensionale modellen en hybride versies. Een drop tower neemt weinig grond in en staat in parken over de hele wereld. Bekende fabrikanten: Intamin, Mondial en S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: ['vrije-val-toren', 'free fall tower', 'drop ride', 'vrijeval', 'drop towers'],
  },
  {
    id: 'log-flume',
    name: 'Wildwaterbaan',
    shortDefinition:
      'Waterkanaal-attractie waarbij bootje-achtige voertuigen een goot afleggen en eindigen met een grote plons.',
    definition:
      'Een wildwaterbaan (ook log flume of boomstambootje) is een waterattractie waarbij gasten in boomstamvormige bootjes door een watergevuld kanaal glijden. Na rustigere secties volgt een steile helling waarbij het bootje in een waterbekken plonst en passagiers vrijwel zeker nat worden. Wildwaterbanen bestaan sinds de jaren 1960 en staan inmiddels in parken over de hele wereld. Ze zijn geschikt voor gezinnen, hebben een gemiddelde capaciteit en zijn vooral op warme dagen druk. Bekende Europese voorbeelden: de Tiroler Wildwasserbahn in Europa-Park en talrijke wildwaterbanen in Duitstalige parken.',
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    aliases: ['boomstambootje', 'log flume', 'plonsbaan'],
  },
  {
    id: 'river-rapids',
    name: 'Wildwaterrit',
    shortDefinition:
      'Rondboot-attractie door turbulente kunstmatige stroomversnellingen waarbij alle inzittenden nat kunnen worden.',
    definition:
      'Een wildwaterrit (ook river rapids of vlottenrit) vervoert gasten in ronde opblaasbare of kunststof vlotten door een kunstmatig kanaal dat stroomversnellingen simuleert. Het ronde vlot draait vrij op de stroom, dus wie er nat wordt, hangt af van hoe het vlot ligt. De een wordt doorweekt, de ander blijft vrijwel droog. Wildwaterritten hebben doorgaans een hoge capaciteit en een lage minimumlengte, zodat ook kinderen mee kunnen. Op warme dagen zijn ze het drukst. Bekende Europese voorbeelden: de Wildwasser-attracties in Phantasialand en diverse ritten in Efteling, Europa-Park en Thorpe Park.',
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    aliases: ['vlottenrit', 'river rapids', 'wildwater', 'stroomversnellingenrit', 'raftingrit'],
  },
  {
    id: 'pendulum-ride',
    name: 'Pendelattractie',
    shortDefinition:
      'Flat ride waarbij een gondel in een wijde pendelboog slingert, vaak terwijl de gondel ook ronddraait.',
    definition:
      'Een pendelattractie is een type flat ride waarbij een gondel hangt aan een lange arm die in een steeds grotere boog heen en weer slingert, vaak tot bijna loodrecht. Tegelijk draait de gondel om haar eigen as, zodat slingeren en draaien samengaan.\n\nHet bekendste voorbeeld is de Frisbee (Huss), een schijfvormige gondel die al slingerend ronddraait. Andere veelvoorkomende pendelattracties zijn de KMG Afterburner en de Giant Frisbee van Huss. Pendelattracties staan in pretparken en op kermissen; ze vallen van ver op en nemen relatief weinig grond in.',
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'pendelattracties'],
    alternateNames: ['slingerattractie', 'pendelschommel'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'Flat ride van Huss waarbij een gondel met passagiers vrij in alle richtingen kan draaien terwijl het draagframe op en neer slingert.',
    definition:
      'De Top Spin is een attractiemodel van fabrikant Huss Rides. Een gondel met doorgaans 40 passagiers is bevestigd aan een draaibaar frame; terwijl het frame slingert, kan de gondel doorlopend in elke richting draaien. Het programma loopt van zacht schommelen tot keer op keer over de kop gaan.\n\nVan de jaren negentig tot de jaren 2010 stonden Top Spins in bijna elk pretpark en op veel kermissen. De Top Spin slingert wel, maar telt niet als pendelattractie: de gondel zit tussen twee draaiarmen aan de zijkant en hangt niet aan één lange pendelarm.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition:
      'Een Huss-attractie met meerdere wagentjes op een grote ronddraaiende schijf, waarbij elk wagentje vrij om zijn eigen as draait.',
    definition:
      'De Break Dance is een flat ride-model van Huss Rides waarbij kleine wagentjes, elk voor twee tot vier passagiers, rond een grote ronddraaiende schijf staan. De wagentjes draaien vrij om hun eigen as terwijl de schijf ronddraait, dus de krachten wisselen voortdurend en verschillen per rit.\n\nVanaf de jaren 1980 stond de Break Dance op veel kermissen en in veel parken, herkenbaar aan de verlichte draaiende schijf en de harde muziek. Andere fabrikanten bouwen varianten en kopieën onder andere namen.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition:
      'Een centrifugale attractie waarbij gondels op een grote roterende ring op hun plaats worden gehouden door G-kracht terwijl de ring naar verticaal kantelt.',
    definition:
      'De Enterprise is een attractie waarbij gondels zijn gerangschikt rond de omtrek van een grote roterende ring. Naarmate de ring versnelt, drukt de centrifugale kracht de passagiers stevig in hun stoelen; bij maximale snelheid kantelt de hele ring geleidelijk naar een bijna verticale positie, zodat de passagiers bovenin ondersteboven gaan.\n\nSchwarzkopf bracht de Enterprise in 1972 uit; Huss Rides bouwde een verbeterde versie, en later bouwden ook andere fabrikanten hem. Vanaf de jaren 1970 stond hij in veel vaste parken en op veel kermissen. Rechtop gekanteld is de ring van ver te zien.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'Een looping-pendelattractie van Huss: een gondel in een kooi slingert aan een lange arm steeds hoger, tot hij helemaal over de kop gaat.',
    definition:
      'De Ranger is een looping-pendelattractie van Huss Rides: een gondel met een kooi eromheen hangt aan een lange arm die heen en weer slingert, waarbij elke slinger hoger wordt, tot de arm een volledige cirkel maakt. Bovenin hangen de passagiers ondersteboven in hun schouderbeugels.\n\nEen schommelboot (Viking, Pirate Ship) keert vóór het hoogste punt om; de Ranger gaat eroverheen. De Ranger behoort tot de meest wijdverspreide Huss-attractiemodellen, te vinden in permanente parken en op reizende kermissen door heel Europa en daarbuiten.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    alternateNames: ['Huss Ranger'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition:
      'Een Huss-attractie met gondelarmen die vanuit een centrale kolom naar buiten zwaaien terwijl de attractie draait en omhooggaat.',
    definition:
      'De Condor is een attractiemodel van Huss Rides met een hoge centrale kolom en meerdere gondelarmen. Tijdens de rit gaan de armen naar buiten en stijgen de gondels, terwijl de hele constructie ronddraait. De passagiers draaien rond, gaan omhoog en kantelen naar buiten, met uitzicht over het park vanaf matige hoogte.\n\nVan de jaren 1970 tot de jaren 1990 stond de Condor in veel Europese parken, en op veel vaste locaties draait hij nog. Hij lijkt op een zweefmolen (schommelstoelenattractie), maar heeft gesloten gondels in plaats van open hangende stoelen.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition:
      'Een Huss-attractie met drie roterende armen, elk met een gondel waarvan de wagentjes gelijktijdig met het hoofdplatform draaien.',
    definition:
      'De Troika is een attractiemodel van Huss Rides waarbij drie armen zich uitstrekken vanuit een centrale naaf; elke arm draagt een gondel met meerdere wagentjes die kunnen roteren. Terwijl het hoofdplatform rondgaat, draaien ook de gondels en tollen de wagentjes, zodat de passagiers om meerdere assen tegelijk draaien.\n\nVanaf de jaren 1970 stond de Troika in veel Europese pretparken en op kermissen. Aan de drie armen is hij van ver te herkennen. Varianten en imitaties van andere fabrikanten staan soms bekend als Trabant of Walzer.',
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'swing-ride',
    name: 'Zweefmolen',
    shortDefinition:
      'Ronddraaiende attractie waarbij stoeltjes aan kettingen naar buiten slingeren als de molen draait.',
    definition:
      'Een zweefmolen (ook kettingcarrousel of Kettenflieger) is een ronddraaiende attractie waarbij stoeltjes aan kettingen aan een centrale draaiende structuur hangen. Bij het ronddraaien slingert de middelpuntvliedende kracht de stoeltjes naar buiten en omhoog. Zweefmolens zijn een van de oudste nog bestaande kermisattracties en stammen uit het begin van de 20e eeuw. Er zijn kleine kinderzweefmolens en enorme kettingtorens (starflyers) die passagiers tientallen meters omhoogbrengen. Ze zijn in vrijwel elk pretpark en op kermissen wereldwijd te vinden.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
    aliases: [
      'kettingcarrousel',
      'kettingvlieger',
      'Kettenflieger',
      'swing ride',
      'chairoplane',
      'zweefmolens',
    ],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Twee parallelle achtbaanrails waarop treinen tegelijkertijd rijden en zij aan zij racen.',
    definition:
      'Een racing coaster heeft twee afzonderlijke maar gespiegelde achtbaanrails die parallel aan elkaar lopen; de treinen vertrekken tegelijk en racen tegen elkaar. Op meerdere punten kruisen de rails elkaar of komen ze heel dicht bij elkaar. Sommige racing coasters zijn gebouwd als Möbius-lus: beide rails vormen één doorgaand circuit en passagiers wisselen automatisch van kant. Er zijn houten en stalen racing coasters. In Europa zijn ze zeldzaam; het bekendste voorbeeld is de Möbius-woodie Grand National in Blackpool Pleasure Beach.',
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
    aliases: [
      'dubbele achtbaan',
      'twin coaster',
      'dueling coaster',
      'Paarachterbahn',
      'racing coaster',
    ],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Achtbaanelement waarbij twee treinen op parallelle rails elkaar tot op armlengte passeren.',
    definition:
      'Bij een High Five passeren twee achtbaantreinen op aparte, dicht bij elkaar liggende rails elkaar op heel korte afstand, soms binnen armlengte, en lijkt het even of ze gaan botsen. De naam komt van het idee dat je de inzittenden van de andere trein een high five zou kunnen geven. Daarvoor moeten beide treinen precies tegelijk op dat punt aankomen. Wing coasters en inverted coasters zijn er geschikt voor, omdat de stoelen naar buiten uitsteken en de rijders dichter bij de andere trein komen. Duelling Dragons / Dragon Challenge in Universal’s Islands of Adventure was een vroeg voorbeeld; het element komt tegenwoordig voor op diverse B&M wing coasters wereldwijd.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['bijna-botsing element', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Tafelreservering',
    shortDefinition:
      'Een reservering vooraf voor een restaurant met tafelservice in een pretpark of resort.',
    definition:
      'Een tafelreservering is een tafel die je vooraf boekt in een restaurant met tafelservice of een diner met personages, in een park of in een van zijn hotels. In de Disney-parken zitten de populaire restaurants zonder reservering vaak de hele dag vol, en op de drukste momenten is er nergens een tafel te krijgen zonder te boeken.\n\nIn Walt Disney World kun je 60 dagen vooraf boeken, en gasten in de hotels van Disney zelf kunnen vanaf dat moment voor hun hele verblijf reserveren, dus tot tien dagen verder vooruit. Een creditcard dient als garantie, en wie niet komt of later dan de dag ervoor annuleert, betaalt per persoon. Disneyfans noemen deze boekingen ADR’s, van Advance Dining Reservations.\n\nIn Europa gaat het eenvoudiger: Europa-Park en de Efteling nemen restaurantreserveringen online aan, met een kortere termijn en op de meeste plekken zonder kosten bij een no-show.',
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
    aliases: [
      'ADR',
      'advance dining reservation',
      'restaurantreservering',
      'dining reservation',
      'tafelboeking',
    ],
  },
  {
    id: 'mobile-ordering',
    name: 'Mobiel bestellen',
    shortDefinition:
      'Een functie in park-apps waarmee je eten vooraf bestelt en betaalt, zonder aan de balie in de rij te staan.',
    definition:
      'Met mobiel bestellen kies je in de app van het park van de menukaart van een restaurant, betaal je daar en haal je het eten op aan een aparte balie zodra een bericht laat weten dat het klaar is, zonder aan de kassa in de rij te staan. Bij sommige systemen kies je vooraf een ophaaltijd; bij andere begint de keuken pas als je in de app aangeeft dat je er bent.\n\nDisney voerde het in bij de snelrestaurants van zijn Amerikaanse parken, en Universal, Six Flags, de Merlin-parken en verschillende Europese parken hebben hun eigen versie. De populaire ophaaltijden rond de middag kunnen aan het eind van de ochtend al weg zijn, en de rij verschuift van de kassa naar de afhaalbalie.\n\nHet werkt alleen met een opgeladen telefoon en mobiel internet, en in grote gebouwen en aan de randen van een park kan het bereik zwak zijn.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['mobiele bestelling', 'mobile order', 'app-bestelling', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Een grote gedeelde eetzaal met meerdere balies die onder één dak verschillende keukens aanbieden.',
    definition:
      'Een food court is een eetzaal met meerdere balies rond één gedeelde zitruimte, elke balie met een eigen menu: pizza bij de ene, hamburgers of noedels bij de andere. Een groep kan zich verdelen om te bestellen en toch samen gaan zitten, en een grote food court biedt plaats aan een paar honderd gasten tegelijk.\n\nSommige zijn aangekleed als deel van het themagebied waarin ze staan; andere zijn sobere zalen bij de ingang of tussen twee drukke delen van het park. Bestellen gaat zoals bij elk snelrestaurant, vaak ook via mobiel bestellen in de app van het park, en reserveren hoeft niet. De prijzen liggen op het niveau van de andere snelrestaurants van het park.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['eetplein', 'eetzaal', 'food court', 'restaurantplein'],
  },
  {
    id: 'capacity-closure',
    name: 'Capaciteitssluiting',
    shortDefinition:
      'Wanneer een park geen nieuwe bezoekers meer binnenlaat omdat het maximale veilige aantal is bereikt.',
    definition:
      'Een capaciteitssluiting gebeurt wanneer er zoveel bezoekers in een park zijn als het mag of kan hebben, en het park geen dagtickets meer verkoopt of niemand meer binnenlaat tot er genoeg mensen weg zijn. De grens komt uit de exploitatievergunning en de veiligheidsregels, en in de praktijk uit hoeveel mensen de paden, toiletten en restaurants aankunnen.\n\nParken pakken dat op twee manieren aan. Sommige verkopen tickets op datum of vragen voor elk bezoek een reservering, zodat de grens weken vooraf op de boekingspagina wordt bereikt in plaats van aan het tourniquet; op die dagen worden ook abonnementhouders zonder reservering geweigerd. Andere tellen de bezoekers aan de poort en sluiten die een uur of twee als de telling de grens bereikt.\n\nSluitingen vallen elk jaar op dezelfde data: nationale feestdagen, de drukste weekenden van de schoolvakantie, de openingsdagen van nieuwe attracties en vuurwerkavonden. Parken kondigen ze aan in hun app en op sociale media, meestal op de ochtend zelf.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    aliases: ['park vol', 'park uitverkocht', 'capacity closure', 'capaciteitsgrens', 'volzit'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Een zero-G roll-variant met een ingebouwde richtingsverandering, zodat de trein de inversie op een andere koers verlaat dan hij erin ging.',
    definition:
      'De zero-G winder is een zero-G roll (een inversie van 360 graden langs een parabolische boog, waarbij de rijders bovenin bijna gewichtloos zijn) met een richtingsverandering erin. Bij een gewone zero-G roll rijdt de trein er in dezelfde richting uit als hij erin ging. Bij de winder buigt de baan tijdens de rotatie af, zodat de trein er in een duidelijk andere richting uitkomt. Zo is het element tegelijk een inversie en de overgang naar het volgende deel van het parcours.\n\nZero-G winders zitten vooral in nieuwere ontwerpen van Intamin en B&M. Een voorbeeld is VelociCoaster in Universal’s Islands of Adventure.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Een uitgerekt element dat je maar één keer over de kop laat gaan, langs een lange boog die van bovenaf gezien de vorm van een banaan heeft.',
    definition:
      'De banana roll lijkt op een uitgerekte cobra roll, maar draait je maar één keer ondersteboven. Een cobra roll propt twee inversies in een compacte, symmetrische vorm; de banana roll spreidt één inversie over een brede, gebogen sectie. Van bovenaf gezien volgt de baan die boog als de kromming van een banaan. Omdat de draai over meer baan is uitgesmeerd, ga je langzamer en vloeiender over de kop dan in een cobra roll.\n\nDe banana roll verscheen voor het eerst in 2011 op Takabisha in Fuji-Q Highland, Japan, gebouwd door Gerstlauer. S&S Worldwide bouwde later een eigen versie voor Steel Curtain in Kennywood. Het element heeft veel ruimte opzij nodig en staat daarom meestal op grotere banen dicht bij de grond, waar het spoor breed kan uitzwaaien.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Gekantelde Looping',
    shortDefinition:
      'Een verticale looping die schuin staat ten opzichte van zijn loodrechte as, zodat de trein de looping schuin in- en uitrijdt.',
    definition:
      'Een gekantelde looping (Engels: inclined loop of tilted loop) is een standaard verticale looping die om zijn as is gedraaid, doorgaans met 45 tot 80 graden ten opzichte van de rijrichting. Bij een gewone looping rijdt de trein recht in en recht weer uit; bij een gekantelde looping gaat dat schuin.\n\nDe aanloop voelt daardoor meer zijdelings aan dan bij een gewone looping, en onderin de cirkel rijdt de trein in een andere richting uit dan hij erin kwam. Gekantelde loopings komen voor op diverse B&M- en Intamin-achtbanen, vaak in het midden of het einde van een parcours.',
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['tilted loop', 'scheve looping', 'gekantelde loop', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Een Vekoma dubbel-inversie-element waarbij de trein in dezelfde richting uitrijdt als hij is ingereden.',
    definition:
      'De sea serpent is een element met twee inversies dat vooral op inverted coasters van Vekoma voorkomt. Net als de cobra roll bestaat hij uit twee inversies met een verbindingsstuk ertussen. Een cobra roll keert de trein 180 graden; uit een sea serpent komt de trein in ongeveer dezelfde richting als hij erin ging. Van opzij gezien heeft het element een lange S-vorm, als een zeeslang die twee keer boven de golven uitkomt.\n\nSea serpents zitten in de Suspended Looping Coaster (SLC) van Vekoma en in enkele maatwerkbanen van de fabrikant. Omdat de SLC in grote aantallen over de hele wereld is gebouwd, is de sea serpent een van de meest voorkomende elementen met twee inversies, al kennen minder mensen de naam dan die van de cobra roll.',
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'cobra-loop',
    name: 'Cobra Loop',
    shortDefinition:
      'De naam die Hersheypark gaf aan de eerste inversie van Storm Runner: een looping waar de trein zijwaarts uit draait in plaats van hem af te maken.',
    definition:
      "Een cobra loop klimt als een verticale looping en draait bovenin zijwaarts weg in plaats van er aan de andere kant weer uit te komen – de trein verlaat het element dus in een andere richting dan hij erin reed. Hij keert de inzittenden één keer om.\n\nDe naam hoort bij één baan. Intamin bouwde het element in 2004 voor Storm Runner in Hersheypark, en het park bracht het op de markt als 's werelds eerste cobra loop; qua geometrie is het wat andere fabrikanten een sidewinder noemen. Waar een cobra roll twee van deze vormen aan elkaar zet en de trein omkeert, is de cobra loop daar maar de helft van.",
    relatedTermIds: ['sidewinder', 'cobra-roll', 'vertical-loop', 'inversion', 'intamin'],
    alternateNames: ['Sidewinder'],
  },
  {
    id: 'jojo-roll',
    name: 'Jojo Roll',
    shortDefinition:
      'Een langzame heartline roll direct na het station, voordat de trein iets beklommen heeft.',
    definition:
      'Een jojo roll is een heartline roll van 360 graden vlak na het station, waarbij de trein nauwelijks sneller dan stapvoets over de kop gaat. Doordat er bijna geen snelheid achter zit, hangen de inzittenden in hun beugels in plaats van in de stoel gedrukt te worden – precies het omgekeerde van dezelfde figuur op volle snelheid verderop in de baan.\n\nHydra: The Revenge in Dorney Park introduceerde hem in 2005. Het element werd voorgesteld door het hoofd onderhoud en bouw van het park, Joe Greene, naar wie het vernoemd is. Copperhead Strike in Carowinds heeft er inmiddels ook een.',
    relatedTermIds: ['heartline-roll', 'inversion', 'hangtime', 'lifthill'],
    aliases: ['Jojo Rolls', 'JoJo Roll'],
  },
  {
    id: 'flying-snake-dive',
    name: 'Flying Snake Dive',
    shortDefinition:
      'Een heartline roll die direct overgaat in een gedraaide duik: twee inversies die de trein zijwaarts wegslingeren.',
    definition:
      'Bij een flying snake dive draait de trein door een heartline roll en valt, zonder ooit weer horizontaal te komen, in een gedraaide duik die hem de andere kant op stuurt. Het telt als twee inversies, die zo dicht op elkaar volgen dat je zelden merkt waar de een eindigt en de ander begint.\n\nIntamin ontwierp het element in 2005 voor Maverick in Cedar Point – en Maverick kreeg er nooit een. Uit testritten bleek dat het te grote krachten op de inzittenden zou uitoefenen, dus werd het geschrapt en vervangen door een S-bocht vóór de opening in 2007. De naam overleefde de baan waarvoor hij was getekend. Rijden doe je er een op het drie jaar oudere Storm Runner in Hersheypark: een heartline roll gevolgd door een halve Immelmann die terug naar de beek duikt.',
    relatedTermIds: ['heartline-roll', 'dive-drop', 'immelmann', 'inversion', 'intamin'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Een element van RMC waarin de eerste afdaling en een volledige barrel roll samenvallen: de rijders hangen ondersteboven terwijl ze nog dalen.',
    definition:
      'De barrel roll drop is een element van Rocky Mountain Construction waarin de eerste afdaling en een volledige inversie samenvallen. Na de lifthill draait de baan de trein door een volledige barrel roll terwijl hij daalt. De rijders hangen volledig ondersteboven bij het steilste punt van de afdaling en worden weer rechtop gedraaid als de trein onderaan de rest van het parcours in rijdt.\n\nHet element kan alleen op het stalen I-box-spoor van RMC, dat de krappe bochtstralen en ingewikkelde driedimensionale vormen toelaat die voor een gelijktijdige rol en afdaling nodig zijn. Op een traditioneel houten spoor kan dat niet. Medusa Steel Coaster in Six Flags Mexico was een van de eerste achtbanen met een barrel roll drop; Steel Vengeance in Cedar Point en Zadra in Energylandia zijn andere voorbeelden.',
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run – een remzone halverwege het parcours die de trein volledig kan stoppen om veilig meertreinsoperatie mogelijk te maken.',
    definition:
      'Een mid-course brake run (MCBR) is een reminrichting ergens in het midden van het parcours van een achtbaan – na de eerste grote elementen maar vóór de slotsequentie. Een trimrem vermindert alleen de snelheid, zodat de trein meteen kan doorrijden. Een MCBR is een volledige blokrem: hij kan de trein stoppen en vasthouden tot het volgende blok vrij is. Zo kunnen meerdere treinen tegelijk op hetzelfde spoor rijden zonder dat ze kunnen botsen, en dat vergroot de capaciteit van de attractie flink.\n\nOp een drukke dag, als alle treinen rijden en het station vlot doorwerkt, laat een goed afgestelde MCBR een gestopte trein bijna meteen weer gaan en merken de rijders de stop nauwelijks. Op rustigere dagen met minder treinen in omloop kan de stop langer duren. De meeste grote achtbanen hebben een MCBR, waaronder de inverted en floorless coasters van B&M, veel banen van Intamin en andere attracties met een hoge capaciteit.',
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid-course brake run', 'tussenbremssectie', 'middenrem', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Verstrengelde Loops',
    shortDefinition:
      'Twee verticale loops waarvan de vlakken elkaar kruisen, zodat ze samen op twee schakels van een ketting of op een acht lijken.',
    definition:
      'Verstrengelde loops (Engels: interlocking loops) zijn twee verticale loops waarvan de vlakken elkaar snijden, meestal bijna loodrecht. Vanuit sommige hoeken lijkt de ene loop door de andere heen te gaan, als twee schakels van een ketting of een reusachtige acht. Het is lastig om de twee loops zo te bouwen dat de sporen elkaar niet raken.\n\nVerstrengelde loops zijn zeldzaam. Het klassieke voorbeeld is Loch Ness Monster in Busch Gardens Williamsburg, in 1978 gebouwd door Arrow Dynamics.',
    relatedTermIds: ['arrow-dynamics', 'inversion', 'vertical-loop'],
    aliases: ['verstrengelde loops', 'interlocking loops', 'gekruiste loops'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'De veiligheidspal op een lifthill die verhindert dat de trein achteruit rolt, en de bron van het bekende klik-klak-geluid.',
    definition:
      'Een anti-rollback (ook wel rollback-pal) is een mechanisch veiligheidssysteem dat langs de onderkant van een lifthill is aangebracht. Terwijl de trein omhoog klimt, rasten veerbelaste metalen klinken over een tandenreeks die in de lifthillstructuur is verzonken. Als de ketting of de aandrijving zou falen, grijpen de klinken in de tanden en blokkeren ze de trein zodat hij niet achteruit kan rollen. Het ritmische klik-klak op een traditionele lifthill is het geluid van die klinken die over de tanden schieten.\n\nOp moderne achtbanen met stille kabelliften of LSM-aangedreven lifthills zijn de klinken vaak vervangen door stille elektromagnetische remmen, en daarom zijn sommige nieuwe lifthills merkbaar stiller.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback systeem', 'rollback-pal', 'klik-klak'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Delen van de constructie die zo zijn ontworpen dat ze rakelings over de hoofden van de rijders gaan, zodat het lijkt of je je hoofd gaat stoten.',
    definition:
      'Head choppers zijn bewust ontworpen plekken waar de draagconstructie, dwarsverbanden, tunnels of andere delen van de baan vlak boven de hoofden van de rijders langsgaan, terwijl de trein op topsnelheid rijdt. Het lijkt dan even of je ergens tegenaan gaat, maar de vrije ruimte is precies berekend en er is geen gevaar. Het werkt het best als de rijders het niet zien aankomen, bijvoorbeeld wanneer de trein uit een gekantelde bocht meteen onder een lage balk door schiet.\n\nHead choppers zitten vooral in dicht op elkaar gebouwde houten achtbanen en in inverted coasters, waar de hangende treinen de rijders dicht langs steunpilaren en andere delen van de baan brengen.',
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Een operator die een schootbeugel of andere beugel te strak tegen een rijder aandrukt, wat ongemakkelijk zit en de airtime wegneemt waarvoor de baan is gebouwd.',
    definition:
      'Bij stapling drukt een operator een schootbeugel of schouderbeugel veel verder aan dan de veiligheid vereist, tot hij de rijder in de stoel klemt. Het woord komt van het Engelse to staple, nieten: je zit als het ware vastgeniet. Op een airtime-achtbaan hoort de beugel wat ruimte te laten, zodat rijders op de toppen van hun stoel loskomen; wie gestapled is, blijft over elke heuvel in de stoel gedrukt.\n\nHet weegt het zwaarst op houten en hybride achtbanen, waar airtime de reden is om erin te stappen. Hoe hard de beugels worden aangedrukt, verschilt per park en per operator op hetzelfde perron. Op de meeste moderne achtbanen sluiten de rijders de beugel zelf en controleert de operator alleen of hij vergrendeld is; in sommige parken drukt de operator standaard elke beugel nog een klik verder.\n\nBeugels vergrendelen in stappen, en een rijder kan een beugel die te ver is aangedrukt niet terugzetten. Hij blijft zitten waar hij zit tot de rit voorbij is.',
    relatedTermIds: [
      'airtime',
      'ejector-airtime',
      'lap-bar',
      'restraint-freedom',
      'shoulder-harness',
    ],
    aliases: ['gestapeld', 'te strakke beugel', 'over-stapled'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Wanneer een achtbaantrein onderweg zoveel snelheid verliest dat hij in een laag punt van de baan blijft steken en de rit niet kan afmaken.',
    definition:
      'Bij valleying blijft een achtbaantrein in een dal van de baan staan, omdat hij voor de volgende heuvel of het volgende element niet genoeg energie meer heeft. Hij valt stil op de klim, rolt terug en schommelt uit tot hij stilstaat op het laagste punt tussen twee toppen. Op die plek zijn geen remmen en geen aandrijving, dus de eigen systemen van de attractie krijgen de trein daar niet meer weg.\n\nTechnici evacueren dan de rijders via een ladder of een looppad, en duwen de trein of trekken hem met een lier over de volgende top, of halen hem terug. De attractie ligt urenlang stil.\n\nAchtbanen worden met een snelheidsmarge ontworpen, en valleying is zeldzaam. De kans wordt groter bij koud weer, als het vet in de wiellagers stijf wordt en de trein trager loopt, bij een licht beladen trein op een baan die is afgesteld op volle treinen, nadat een trimrem te veel snelheid heeft weggenomen, of op een oude houten achtbaan waarvan het spoor is verzakt.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'vastgelopen trein', 'trein in dal'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Een achtbaantype met kleine individuele wagentjes en een compact circuit van strakke, vlakke haarspeldbochten aan de rand van verhoogde platforms.',
    definition:
      'Een wild mouse (wilde muis) gebruikt kleine wagentjes van twee tot vier personen in plaats van lange treinen. Typisch is een reeks krappe, nauwelijks gekantelde haarspeldbochten aan de buitenrand van de baan. Omdat de bochten, anders dan bij andere achtbanen, bijna niet gekanteld zijn, worden de rijders zijwaarts tegen de wand van het wagentje gedrukt. De wagentjes zijn vaak breder dan de baan, en daardoor lijkt het in elke bocht of ze over de rand glijden.\n\nEen wild mouse neemt weinig ruimte in: doordat de lagen haarspeldbochten boven elkaar liggen, past er veel baan op een klein grondoppervlak. Ze zijn wereldwijd te vinden bij parken van uiteenlopende grootte. Fabrikanten zijn onder meer Mack Rides, Maurer en Gerstlauer.',
    relatedTermIds: [
      'bobsled-coaster',
      'gerstlauer',
      'mack-rides',
      'spinning-coaster',
      'steel-coaster',
    ],
    aliases: ['wild mouse coaster', 'wilde muis', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: '4D Coaster',
    shortDefinition:
      'Een achtbaantype waarbij stoelen op roterende armen buiten de trein zijn gemonteerd en onafhankelijk van de rijrichting kunnen draaien.',
    definition:
      'Een fourth dimension coaster (4D-coaster) is een ontwerp waarbij de passagiersstoelen niet vast aan de trein zijn bevestigd, maar op zwenkbare armen die links en rechts van elke wagen uitsteken. De stoelen kunnen naar voren of achteren draaien onafhankelijk van de rijrichting – aangestuurd door een vaste stuurrail naast de hoofdbaan (die de stoelpositie op elk moment van het parcours bepaalt) of door vrije rotatie aangedreven door zwaartekracht en gewichtsverdeling. Zo kunnen passagiers tijdens een afdaling recht naar beneden kijken, in een bocht ondersteboven hangen of in een inversie om meerdere assen tegelijk draaien.\n\nArrow Dynamics ontwikkelde het concept en S&S Worldwide werkte het later verder uit. X2 in Six Flags Magic Mountain (Californië) opende in 2002 als eerste 4D-coaster en is de bekendste. Een ander bekend voorbeeld is Eejanaika in Fuji-Q Highland, Japan.',
    relatedTermIds: [
      'arrow-dynamics',
      'inversion',
      'inverted-coaster',
      's-and-s-worldwide',
      'spinning-coaster',
    ],
    aliases: ['4D coaster', '4D-achtbaan', 'vierde dimensie achtbaan', 'free spin coaster'],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'Een achtbaanparcours dat in een vrij rechte lijn van het station wegloopt, aan het eind omkeert en over een evenwijdig traject terugkomt.',
    definition:
      'Een out-and-back is een van de twee basisvormen van een achtbaanparcours. De trein verlaat het station, rijdt in grote lijnen rechtdoor weg, meestal over een reeks heuvels die voor airtime zijn getekend, keert aan het verste eind van het terrein om en komt over een vergelijkbaar traject terug, ongeveer evenwijdig aan de heenweg. De twee helften kruisen elkaar zelden, en het grondplan is lang en smal, anders dan bij het compactere twister-parcours.\n\nOut-and-backs zijn typisch voor traditionele houten achtbanen. De snelheid die op de grote heuvels van de heenweg is opgebouwd, wordt op de terugweg verbruikt op kleinere heuvels met floater airtime. Elke heuvel is getekend voor de snelheid die de trein heeft als hij er aankomt: omdat de trein onderweg energie verliest, zijn de heuvels op de terugweg lager en staan ze dichter op elkaar, zodat hij over elk ervan nog zweeft. Voorbeelden van houten out-and-backs zijn The Voyage in Holiday World, Comet in The Great Escape en de verschillende versies van het Racer-type. Ook stalen achtbanen kunnen een out-and-back-parcours volgen, al komt die vorm bij staal minder voor dan bij hout.',
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'out-and-back parcours', 'heen-en-terugachtbaan'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Een achtbaanparcours dat spiraalvormig over zichzelf terugvouwt, met veel elementen op een klein grondplan.',
    definition:
      'Een twister-coaster (ook cyclone-layout) is een achtbaanontwerp waarbij de baan in spiralen loopt, terugvouwt en zichzelf steeds boven- of onderlangs kruist, anders dan het eenvoudige heen en terug van een out-and-back. Kenmerkend is dat de trein steeds vlak langs andere delen van dezelfde baan rijdt, vaak in een andere richting en op een andere hoogte, met head choppers als gevolg.\n\nEen twister-lay-out past veel baan en hoogteverschil op een klein, ongeveer vierkant grondoppervlak, en daarom kiezen parken met weinig ruimte er vaak voor. Houten twisters zijn onder meer de Twister in Gröna Lund in Stockholm; stalen twisters omvatten veel B&M- en Intamin-ontwerpen.',
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'cyclone', 'twister achtbaan'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error – de gemiddelde afwijking in minuten tussen voorspelde en werkelijke wachttijd.',
    definition:
      'MAE (Mean Absolute Error, gemiddelde absolute fout) is de standaard nauwkeurigheidsmaatstaf bij park.fan. Het is het gemiddelde verschil in minuten tussen elke voorspelde wachttijd en de werkelijk gemeten wachttijd bij de attractie. Een MAE van 8 minuten betekent dat de voorspellingen gemiddeld 8 minuten afwijken.\n\nDe MAE weegt elke fout even zwaar: een fout van 5 minuten en een fout van 15 minuten worden lineair gemiddeld. Daardoor is het getal makkelijk te lezen: MAE = 10 betekent “de voorspellingen liggen doorgaans binnen 10 minuten van de werkelijkheid”. Een lagere MAE betekent altijd nauwkeurigere voorspellingen.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error – vergelijkbaar met MAE maar straft grote voorspellingsfouten zwaarder af.',
    definition:
      'RMSE (Root Mean Square Error, kwadratische gemiddelde fout) meet de nauwkeurigheid door elke fout te kwadrateren voor het middelen, waarna de vierkantswortel wordt genomen. Grote uitschieters – een wachttijd die 40 minuten te hoog of te laag wordt voorspeld – wegen daardoor veel zwaarder dan kleine fouten van 5 minuten. De RMSE is altijd gelijk aan of groter dan de MAE.\n\nEen groot verschil tussen RMSE en MAE wijst erop dat het model soms flink de mist in gaat, ook al zijn de meeste voorspellingen nauwkeurig. Beide maatstaven zijn live te zien op de park.fan-startpagina.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error – de voorspellingsfout uitgedrukt als percentage van de werkelijke wachttijd.',
    definition:
      'MAPE (Mean Absolute Percentage Error, gemiddelde absolute procentuele fout) drukt de nauwkeurigheid uit als percentage in plaats van in minuten. Een fout van 8 minuten staat er dan bijvoorbeeld als “15% van de werkelijke wachttijd”. Zo kun je de nauwkeurigheid vergelijken tussen attracties met heel verschillende wachttijden. Een fout van 10 minuten weegt bij een attractie met normaal 15 minuten veel zwaarder dan bij een met 90 minuten.\n\nDe MAPE kan misleidend hoog zijn bij zeer korte wachttijden. Daarom toont park.fan hem altijd samen met MAE en RMSE.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R-kwadraat: een maat voor hoe goed het AI-model de patronen in de gemeten wachttijden verklaart (0–1, hoger is beter).',
    definition:
      'R² (R-kwadraat, ook determinatiecoëfficiënt) meet hoeveel van de variatie in de gemeten wachttijden het model verklaart. Een waarde van 1,0 betekent perfecte voorspellingen; 0,0 betekent dat het model niets verklaart boven een eenvoudig gemiddelde. Waarden boven 0,7 zijn sterk; boven 0,9 uitstekend.\n\nBij wachttijdprognoses is een hoge R² moeilijk te behalen, omdat wachtrijen beïnvloed worden door onvoorspelbare factoren. De R²-waarde op park.fan komt uit de vergelijking van alle nagerekende voorspellingen en wordt dagelijks opnieuw bepaald.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    aliases: ['R-squared'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Seizoensattractie',
    shortDefinition:
      'Een attractie of show die alleen in bepaalde maanden van het jaar draait, zoals een ijsbaan in de winter of een waterbaan in de zomer.',
    definition:
      'Een seizoensattractie is een rit, show of ander onderdeel dat het park alleen in een bepaalde periode van het jaar heeft. Ijsbanen, rodelbanen en winterse shows draaien doorgaans van november tot februari; wildwaterbanen, waterspeelgebieden en openluchtspectakels van mei tot september. Sommige seizoensattracties zijn gekoppeld aan specifieke evenementen zoals Halloween of Kerst.\n\nOp park.fan worden seizoensattracties en -shows automatisch herkend aan de hand van historische bedrijfsgegevens. Buiten hun actieve maanden zijn ze verborgen in de tabbladen van het park en op de kaart, zodat alleen overblijft wat er vandaag open is. Een seizoensbadge (Winter, Zomer of generiek) staat op elke betreffende kaart. Als de attractie buiten seizoen is, is de badge gedempt. Een filterknop in de tabbladen laat verborgen items zien wanneer dat nodig is.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    aliases: ['seizoensrit', 'seizoensshow', 'tijdelijke attractie'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Amerikaans bedrijf gespecialiseerd in het ontwerpen van moderne houten achtbanen.',
    definition:
      'The Gravity Group is een Amerikaans ontwerpbureau opgericht in 2002 door voormalige ingenieurs van Custom Coasters International. Het bureau ontwikkelde onder meer de Timberliner-treinen, die krappere bochten en ingewikkeldere manoeuvres aankunnen dan traditionele houten achtbaantreinen. Bekende banen van The Gravity Group zijn The Voyage (Holiday World) en Hades 360 (Mt. Olympus), twee houten achtbanen met moderne elementen.',
    relatedTermIds: ['cci', 'hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'Producent van interactieve dark rides en animatronics.',
    definition:
      'Sally Dark Rides (voorheen Sally Corporation) is een bedrijf uit Florida dat gespecialiseerd is in het bouwen van interactieve dark rides, animatronics en gethematiseerde attracties voor pretparken wereldwijd. Bekend werk van Sally zijn de “Justice League: Battle for Metropolis”-attracties in Six Flags-parken en diverse Scooby-Doo-attracties. In hun attracties staan vaak decors en animatronics, en de passagiers schieten met lasers om punten.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride'],
    aliases: ['Sally Corporation', 'Sally Corp'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition: 'Nederlandse fabrikant van flat rides en grote reuzenraden.',
    definition:
      'Mondial Rides is een Nederlandse fabrikant van mechanische attracties (flat rides) voor pretparken en kermissen. Bekende modellen zijn de Top Scan, de Shake en de Capriolo. Veel Mondial-attracties bewegen om meerdere assen tegelijk. Het bedrijf bouwt ook enkele van de grootste verplaatsbare reuzenraden ter wereld.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
    aliases: ['Mondial Rides'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition: 'Nederlandse fabrikant van verplaatsbare kermisattracties.',
    definition:
      'KMG is een Nederlands bedrijf, in 1989 in Neede opgericht door Isje Kroon, dat gespecialiseerd is in het ontwerpen en bouwen van attracties voor de kermis. KMG-attracties zijn zo gebouwd dat ze snel en zonder zware kranen op te bouwen zijn. Het bekendste model is de Afterburner (vaak Fireball genoemd), een pendelattractie met naar binnen gerichte stoelen die zwaaien en draaien. Andere modellen zijn de Freak Out en de Speed.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
    aliases: ['KMG Rides'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition: 'Technologiebedrijf dat voertuigsystemen voor dark rides bouwt.',
    definition:
      'Oceaneering Entertainment Systems (OES) was een divisie van Oceaneering International die robotica- en onderwatertechnologie toepaste in de pretparksector. In mei 2025 nam Falcon’s Beyond de divisie over. Oceaneering maakte de voertuigen van attracties zoals “The Amazing Adventures of Spider-Man” en “Transformers: The Ride” (Universal Studios). Die voertuigen draaien en kantelen tijdens de rit gelijk met de 3D-projecties.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
    aliases: ['Oceaneering Entertainment Systems', 'OES', 'Oceaneering International'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Nederlandse producent van ritsystemen voor dark rides, pionier in trackless technologie.',
    definition:
      'ETF Ride Systems is een Nederlands bedrijf gespecialiseerd in transportsystemen voor thema-attracties en musea. Het bedrijf was een van de eersten met “trackless” voertuigen, die zonder rails rijden en worden gestuurd door magneten of draden in de vloer. Zo kunnen de voertuigen wisselende routes rijden en vloeiend bewegen, zoals in Symbolica (Efteling) en Ratatouille: The Adventure (Disneyland Parijs).',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
    aliases: ['ETF'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition: 'Amerikaanse fabrikant van achtbanen, reuzenraden en treintjes.',
    definition:
      'Chance Rides is een Amerikaanse fabrikant met een lange geschiedenis, gevestigd in Kansas. Het bedrijf bouwt reuzenraden, carrousels en moderne achtbanen. Samen met D.H. Morgan bouwde Chance hyper coasters, en de miniatuurtreinen van Chance rijden in dierentuinen en pretparken. Een modern voorbeeld van hun achtbanen is Lightning Run (Kentucky Kingdom).',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'morgan', 'steel-coaster'],
    aliases: ['Chance Morgan', 'Chance Manufacturing'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'Een achtbaanelement dat de vorm van een looping imiteert zonder de passagiers ondersteboven te laten gaan.',
    definition:
      'De Non-Inverting Loop is een element geïntroduceerd door Maurer Rides (bijv. op Hollywood Rip Ride Rockit). Anders dan bij een klassieke looping draait de baan mee terwijl hij omhooggaat, zodat de passagiers op het hoogste punt rechtop blijven in plaats van ondersteboven te hangen. Van buiten ziet het element eruit als een grote cirkel; de passagiers voelen zijwaartse en verticale airtime.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['niet-inverterende looping'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition:
      'Een dubbele inversie die lijkt op de vorm van een pretzel, vaak bij coasters met een complex tracé.',
    definition:
      'De Pretzel Knot bestaat uit twee inversies die samen de vorm van een X of een pretzel hebben. Het element keert de trein terwijl hij twee keer kort na elkaar ondersteboven gaat. Het is een ander element dan de pretzel loop op flying coasters; de knot zit meestal op zit- of inverted coasters. Moonsault Scramble in Fuji-Q Highland had er een.',
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['pretzel knoop'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'Een halve inversie waarbij de trein daarna in de tegenovergestelde richting rijdt, typisch voor 4D-coasters.',
    definition:
      'De Raven Turn komt voor op 4D-achtbanen en wing coasters. Het is een halve looping die niet wordt afgemaakt, en daarna rijdt de trein in de tegenovergestelde richting verder. Afhankelijk van hoe de stoelen draaien, rijd je hem als “outside”- of als “inside”-manoeuvre. Je vindt dit element op banen zoals X2 (Six Flags Magic Mountain) of Eejanaika (Fuji-Q Highland).',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['raven bocht'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition: 'Een langzame inversie direct na de lift hill, kenmerkend voor Wing Coasters.',
    definition:
      'De Dive Drop zit op B&M wing coasters, zoals Fēnix in Toverland. Zodra de trein van de lift hill komt, draait hij langzaam 180 graden om zijn as voordat hij loodrecht naar beneden gaat. De passagiers hangen daarbij een tijd zijwaarts naast de baan voordat de eigenlijke afdaling begint.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['dive drop'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition:
      'Een bocht die naar buiten is gekanteld in plaats van naar binnen, met sterke zijwaartse krachten.',
    definition:
      'De Outerbanked Turn is een modern element, vooral bekend van RMC, waarbij de baan tegen de richting van de bocht in gekanteld is. Een gewone gekantelde bocht drukt de passagiers in hun stoel; deze kanteling duwt ze naar buiten, zodat ze airtime en een zijwaartse duw tegelijk voelen.',
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['buitenwaarts gekantelde bocht'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition: 'Een reeks bulten of heuvels die voor airtime zijn ontworpen.',
    definition:
      'Een camelback is een grote, ronde heuvel in een achtbaanparcours, gevormd als de bult waarnaar hij is genoemd. De trein klimt erop, gaat over de top en daalt aan de andere kant af zonder bocht en zonder verandering van kanteling. Is de top getekend als een parabool die overeenkomt met de valbaan van de trein, dan komen rijders een seconde of twee een beetje uit hun stoel: floater airtime. Een scherpere top die de trein sneller neemt, geeft ejector airtime.\n\nCamelbacks zijn de bouwstenen van out-and-back hypercoasters, die er op de heen- en terugweg een aantal achter elkaar zetten. Elke camelback is iets lager dan de vorige, omdat de trein onderweg energie verliest. Silver Star in Europa-Park (B&M, 2002) laat op zijn first drop een grote camelback volgen; Magnum XL-200 in Cedar Point (Arrow, 1989) eindigt met een rij kleine.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster', 'quad-down'],
    aliases: ['kamelenbult', 'camelbacks'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      'Een uitgerekte inversie waarbij de trein enkele meters ondersteboven blijft en de passagiers gewichtloos in hun beugels hangen.',
    definition:
      'De Zero-G Stall is afgeleid van de zero-G roll. In plaats van de rotatie meteen af te maken, blijft de baan enkele meters horizontaal terwijl hij 180 graden gedraaid is. Op dat stuk zijn de passagiers volledig gewichtloos (0 G) terwijl ze ondersteboven in hun beugels hangen. Het element zit onder meer op RMC-banen zoals Untamed (Walibi Holland).',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['zero-g stall'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition:
      'Slangterm gebruikt door pretparkliefhebbers om de gewone bezoeker aan te duiden.',
    definition:
      'GP staat voor “General Public”. Liefhebbers (enthusiasts) gebruiken het voor bezoekers die weinig weten van achtbaantechniek of vaktermen. Vaak valt de term als grap, wanneer een gewone bezoeker iets zegt wat niet klopt, zoals elke attractie een “achtbaan” noemen of denken dat een looping gevaarlijk is als de trein stilvalt.',
    relatedTermIds: ['credit', 'ert', 'fanboy', 'hype-train', 'mackprodukt', 'touring-plan'],
    aliases: ['gewone publiek', 'normale bezoekers'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition:
      'Elke achtbaan met een gesloten circuit die hoger is dan 400 voet (122 meter).',
    definition:
      'De Strata Coaster is een categorie achtbanen die uitsluitend door hoogte wordt gedefinieerd. De term werd bedacht door Cedar Point voor de opening van Top Thrill Dragster in 2003. Er zijn wereldwijd slechts twee Strata Coasters voltooid: Kingda Ka (Six Flags Great Adventure, in 2024 gesloten en in 2025 gesloopt) en Top Thrill 2 (Cedar Point). Ze halen extreme snelheden en hebben verticale afdalingen vanaf recordhoogte.',
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition: 'Het moment waarop een trein het station verlaat om aan de rit te beginnen.',
    definition:
      'De Dispatch is het proces waarbij operators de trein vrijgeven voor vertrek nadat de beugels zijn gecontroleerd. Liefhebbers kijken naar de dispatchtijd (de tijd tussen twee vertrekkende treinen) om te zien hoe vlot een park werkt. Trage dispatches leiden tot langere wachtrijen en tot “stacking” (treinen die op de remmen voor het station stilstaan).',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['vertrek', 'treinverzending'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'Een effect waarbij de baan vlak langs een structuur gaat om de illusie van een bijna-botsing te wekken.',
    definition:
      'Een Near-Miss is een ontwerpelement waarbij de baan op slechts enkele centimeters langs steunen, tunnels of decors lijkt te gaan. De passagiers blijven altijd binnen de clearance envelope (veiligheidsruimte), maar door de snelheid lijkt het of je het obstakel gaat raken. Het effect wordt veel gebruikt in dark rides en moderne achtbanen.',
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['bijna-botsing', 'near miss effect', 'near miss'],
  },
  {
    id: 'clearance-envelope',
    name: 'Lichtraumprofil',
    shortDefinition:
      'De onzichtbare veiligheidsruimte rond de baan die vrij moet blijven van obstakels.',
    definition:
      'De Clearance Envelope (of lichtruimprofiel) is de door ingenieurs berekende ruimte rond de trein en de passagiers die tijdens de rit volledig vrij moet blijven. Het houdt rekening met de maximale reikwijdte van armen en benen van de langste bezoekers. Geen enkel vast object mag zich binnen deze zone bevinden. Tijdens het testen wordt vaak een houten mal (envelope) gebruikt om te garanderen dat niets geraakt kan worden.',
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['clearance envelope', 'veiligheidsprofiel', 'vrije ruimte'],
  },
  {
    id: 'testing',
    name: 'Testritten',
    shortDefinition:
      'De rondjes die een attractie leeg draait – voor de opening, elke ochtend en na elke reparatie.',
    definition:
      'Testen is alles wat tussen een afgebouwde attractie en een volle trein zit. Bij de inbedrijfstelling nemen waterdummies of zandzakken de plaats van de inzittenden in, het systeem wordt over duizenden cycli beproefd, en met profielcontroles wordt vastgesteld dat er langs de baan niets zo dichtbij staat dat een uitgestoken arm het kan raken.\n\nHet houdt eigenlijk nooit op. Parken draaien elke ochtend lege rondjes voor de eerste gasten, en opnieuw na elke storing of onderhoudsbeurt. Daarom kan een attractie als geopend te zien zijn en toch niemand laten instappen. Nieuwe banen testen in het volle zicht: de treinen rijden weken voor de opening over de hoofden van de bezoekers. Een soft opening is zelf een test, alleen met echte inzittenden.',
    relatedTermIds: ['clearance-envelope', 'soft-opening', 'downtime', 'refurbishment'],
    aliases: ['Test runs', 'Test cycles'],
  },
  {
    id: 'kuka',
    name: 'KUKA',
    shortDefinition:
      'Een Duitse fabrikant van industriële robots wiens fabrieksarmen zijn omgebouwd om mensen te vervoeren.',
    definition:
      'KUKA – de afkorting staat voor Keller und Knappich Augsburg, waar het bedrijf nog altijd zetelt – bouwt de oranje robotarmen die langs de lopende banden van autofabrieken staan. De zware KR 500 werd voor attractiegebruik aangepast als RoboCoaster: een vierpersoonsbank aan het uiteinde van de arm, vrij om te stampen, te rollen en de inzittenden door bewegingen te sturen die geen vaste rail kan maken.\n\nDe bekendste installatie is Harry Potter and the Forbidden Journey, geopend in 2010, waar RoboCoaster G2-banken op rijdende onderstellen staan: de armen reizen dus door de decors in plaats van op een plek te spelen. Sum of All Thrills in Epcot (2009–2016) draaide het om: gasten ontwierpen aan een terminal hun eigen baanprofiel, waarna een op maat gebouwde KUKA-arm precies dat uitvoerde.',
    relatedTermIds: ['dynamic-attractions', 'dark-ride', 'motion-simulator', 'flying-theater'],
    alternateNames: ['Keller und Knappich Augsburg'],
    aliases: ['Keller und Knappich Augsburg'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Een near-miss effect gericht op de voeten van de passagiers, vaak bij inverted of wing coasters.',
    definition:
      'De foot-chopper is het tegenstuk van de head chopper: het lijkt of de voeten van de passagiers een constructie of de grond gaan raken. Het werkt vooral bij inverted coasters (die onder de rails hangen) en wing coasters, waar de benen vrij in de lucht hangen.',
    relatedTermIds: [
      'clearance-envelope',
      'head-choppers',
      'inverted-coaster',
      'near-miss',
      'wing-coaster',
    ],
    aliases: ['foot choppers'],
  },
  {
    id: 'projection-mapping',
    name: 'Projection Mapping',
    shortDefinition:
      'Technologie waarbij video wordt geprojecteerd op onregelmatige oppervlakken of 3D-decors.',
    definition:
      'Projection mapping is een techniek waarmee moderne dark rides decors als projectiescherm gebruiken. Anders dan bij een gewone projectie past de software het beeld aan de vorm van het object aan, bijvoorbeeld rotsen of gebouwen. Zo lijkt een decor van vorm of kleur te veranderen, zoals in “Harry Potter and the Forbidden Journey”.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride', 'pre-show'],
    aliases: ['videomapping', 'projectie mapping'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Een ritsysteem met een constante stroom aan karretjes die in een ononderbroken keten bewegen.',
    definition:
      'De Omnimover is een transportsysteem dat Disney ontwikkelde (gebruikt in bijvoorbeeld “The Haunted Mansion”). De karretjes rijden zonder te stoppen over het parcours en draaien om hun as, zodat de passagier naar een bepaalde scène kijkt. Omdat de rit nooit stilstaat voor het instappen, is de capaciteit per uur zeer hoog. Andere voorbeelden zijn “Carnaval Festival” in de Efteling en “Phantom Manor”.',
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['omnimover systeem'],
  },
  {
    id: 'pepper-ghost',
    name: 'Pepper’s Ghost',
    shortDefinition:
      'Een klassieke optische illusie waarmee doorschijnende verschijningen of geesten in een ruimte lijken te zweven.',
    definition:
      'Het Pepper’s Ghost-effect is een 19e-eeuwse theatertruc die nog in veel dark rides wordt gebruikt, onder meer in de balzaalscène van “The Haunted Mansion”. Er is een onzichtbare glasplaat voor nodig die onder een hoek van 45 graden staat, en een verborgen kamer. Het beeld van de verborgen kamer weerspiegelt in het glas en lijkt dan doorschijnend door de ruimte te zweven.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ['Pepper’s Ghost', 'geest-illusione'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Canadese fabrikant bekend om complexe ritsystemen, waaronder de Robocoaster-integratie in Harry Potter and the Forbidden Journey.',
    definition:
      'Dynamic Attractions is een attractiebouwer van technisch complexe ritsystemen. Bekend is de rit van Harry Potter and the Forbidden Journey, waarvoor Dynamic de RoboCoaster integreerde, een product van RoboCoaster Ltd op robotarmen van KUKA. Het bedrijf bouwt ook spoorsystemen, bewegingstheaters en constructiedelen voor grote themaparken over de hele wereld.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
  },
  {
    id: 'flying-theater',
    name: 'Flying theater',
    shortDefinition:
      'Een simulator waarbij de stoelen voor een groot, gebogen scherm worden gedraaid, zodat het lijkt of je vliegt.',
    definition:
      "Een flying theater is een simulatieattractie waarbij gasten in hangende stoelen zitten die gelijk bewegen met een film op een enorm, bolvormig scherm. De stoelen “vliegen” vaak naar voren, het beeld in. Bekende voorbeelden zijn Disney’s Soarin' en Europa-Park’s Voletarium.",
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle coaster',
    shortDefinition:
      'Een achtbaan die geen gesloten circuit vormt en zowel vooruit als achteruit rijdt.',
    definition:
      'Een shuttle coaster rijdt zijn parcours en daarna nog een keer achteruit. Het spoor sluit niet tot een rondje: de trein verlaat het station, klimt aan het verste eind een toren, een spike of een looping op, stopt en rijdt over dezelfde rails terug door het station, vaak nog een tweede toren op aan de andere kant voordat hij aan het perron tot stilstand komt. Elk element rijd je twee keer, een keer met je gezicht ernaartoe en een keer zonder het te zien aankomen.\n\nDe Boomerang van Vekoma is de meest voorkomende. Een lift trekt de trein achteruit een toren op en laat hem los; hij gaat door een cobra roll en een verticale looping, de andere toren op en achteruit terug door alle drie de inversies. De eerste vier openden in 1984, en sindsdien zijn er meer dan vijftig gebouwd, waaronder Speed of Sound in Walibi Holland. Bij gelanceerde shuttles neemt een lancering de plaats van de lift in, zoals bij Pulsar in Walibi Belgium (2016), een water coaster die zijn boot vooruit en achteruit een spike van 45 meter op schiet.\n\nHet parcours past op een smal stuk grond. Met één trein op één spoor is de capaciteit wel laag, en de rij gaat traag vooruit.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
    aliases: ['Impulse Coaster'],
  },
  {
    id: 'carousel',
    name: 'Carrousel',
    shortDefinition:
      'Een klassieke draaiende attractie met zitplaatsen, vaak in de vorm van paarden.',
    definition:
      'Een carrousel of draaimolen is een rond platform dat om een middenzuil draait, met zitplaatsen in de vorm van paarden, andere dieren of koetsjes. Op de meeste hangen de paarden aan stangen die door krukken in de kap worden aangedreven, zodat ze op en neer gaan terwijl het platform draait; dat beschrijft de Britse naam gallopers. Tijdens het draaien speelt er een orgel of een opname.\n\nDe draairichting is een nationale gewoonte: Britse gallopers draaien meestal met de klok mee, Noord-Amerikaanse carrousels tegen de klok in. De oudste bewaarde vaste carrousel staat in het Staatspark Hanau-Wilhelmsbad bij Frankfurt. Hij werd in 1780 gebouwd en draaide na een restauratie in 2016 weer, voor het eerst in meer dan zeventig jaar.\n\nBijna elk pretpark heeft er een, vaak bij de ingang. Het is een van de weinige attracties waarin grootouders en peuters samen gaan.',
    relatedTermIds: ['flat-ride', 'themed-land'],
  },
  {
    id: 'walkthrough',
    name: 'Walkthrough',
    shortDefinition: 'Een attractie waar je te voet doorheen loopt, door aangeklede ruimtes.',
    definition:
      'Een walkthrough is een attractie waar je te voet doorheen gaat in plaats van in een voertuig. Gasten lopen door aangeklede ruimtes met interactieve elementen, acteurs of speciale effecten. Het kan een eenvoudig aangekleed pad zijn, maar ook een groot spookhuis of funhouse.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
  },
  {
    id: 'funhouse',
    name: 'Funhouse',
    shortDefinition:
      'Een klassieke walkthrough-attractie vol fysieke hindernissen en optische illusies.',
    definition:
      'Een funhouse, op de kermis een lachpaleis, is een gebouw dat je te voet doorloopt, vol fysieke grappen: vloeren die kantelen of schudden, een draaiende ton om door te lopen, lachspiegels, luchtstoten, wiebelbruggen en glijbanen tussen de verdiepingen. Er is geen voertuig; bezoekers gaan er in hun eigen tempo doorheen, en een groot deel van de lol is je evenwicht verliezen voor de ogen van wie achter je loopt.\n\nDe vorm komt van de kermis en de badplaats. Het Fun House in Blackpool Pleasure Beach, een art-decogebouw van vijf verdiepingen dat de architect Joseph Emberton in de jaren 30 ontwierp, stond er tot het in 1991 afbrandde. Reizende funhouses horen nog altijd bij de Duitse kermis, en veel parken hebben een vast exemplaar als familieattractie.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Reuzenrad',
    shortDefinition:
      'Een groot, verticaal draaiend wiel met gondels voor passagiers, die uitkijken over de omgeving.',
    definition:
      'Een reuzenrad is een groot, verticaal wiel met gondels langs de rand, dat zo langzaam draait dat je lang kunt uitkijken over het park en de omgeving. In veel parken en op veel kermissen is het een herkenningspunt, ook omdat je het van buiten het hek al ziet. Er zijn kleine familieraderen van een paar meter doorsnee, maar ook uitkijkraderen zo groot als de London Eye.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition:
      'Een verticaal of steil oplopend, doodlopend stuk spoor op een shuttle coaster.',
    definition:
      'Een spike is een stuk spoor aan het eind van een shuttle coaster dat verticaal of heel steil omhoog loopt en in de lucht ophoudt. De trein rijdt erop tot de zwaartekracht al zijn snelheid heeft weggenomen, hangt even stil en valt achteruit over dezelfde rails terug, de rest van het parcours in. Sommige spikes zijn gedraaid, zodat de trein op weg naar boven een rol maakt en op weg naar beneden terugdraait, zoals bij Wicked Twister in Cedar Point (Intamin, 2002).\n\nEen spike heeft geen rem en geen keerpunt nodig, en daarom gebruiken gelanceerde shuttle coasters ze: de lancering geeft de trein zijn energie en de spike keert hem om. Top Thrill 2 in Cedar Point kreeg in 2024 een verticale spike van 128 meter voor zijn achterwaartse lancering. In Europa stuurt Pulsar in Walibi Belgium (2016) zijn boot vooruit en achteruit een spike van 45 meter op, voor de splashdown.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
  },
  {
    id: 'forced-perspective',
    name: 'Gedwongen perspectief',
    shortDefinition:
      'Een ontwerptechniek die wordt gebruikt om structuren groter of kleiner te laten lijken dan ze in werkelijkheid zijn.',
    definition:
      'Gedwongen perspectief is een optische illusie die door ontwerpers wordt gebruikt om de waargenomen schaal en afstand van objecten te manipuleren. Door de hogere delen van een gebouw kleiner te bouwen, laten ontwerpers het veel hoger lijken. Een bekend voorbeeld is Sleeping Beauty Castle in Disneyland, dat er zo imposanter uitziet.',
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'show-building',
    name: 'Showgebouw',
    shortDefinition:
      'De grote, functionele structuur waarin de baan en de decors van een overdekte attractie zijn ondergebracht.',
    definition:
      'Een showgebouw is de hal waarin de baan, de decors en de speciale effecten van een overdekte attractie of dark ride staan. Binnen is alles aangekleed; van buiten is het vaak een eenvoudige doos die achter beplanting of aangeklede gevels uit het zicht blijft.',
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
  },
  {
    id: 'practical-effects',
    name: 'Praktische effecten',
    shortDefinition:
      'Fysieke speciale effecten die live in een attractie worden geproduceerd in plaats van digitaal.',
    definition:
      'Praktische effecten zijn effecten die gebouwd zijn en draaien in de ruimte waar de rijder doorheen gaat: animatronics, water, vuur, mist, wind, vallende voorwerpen, bewegende decors en lichttrucs. Effecten op basis van media tonen de actie daarentegen op een scherm of als projectie. Een praktisch effect zie je met diepte en op ware grootte, waar het voertuig zich ook bevindt, en dat kan een scherm alleen vanuit één gezichtspunt nabootsen.\n\nSommige van de oudste trucs worden nog altijd gebruikt. De dansende geesten in de balzaal van de Haunted Mansion (Disneyland, 1969) zijn een Pepper’s ghost, een toneelillusie uit de negentiende eeuw: figuren die onder de ooghoogte van de rijders verborgen staan, worden weerspiegeld in een grote glasplaat. De Droomvlucht in de Efteling (1993) voert rijders langs tientallen bewegende elfjes, trollen en dieren in gebeeldhouwde landschappen.\n\nEen kapot praktisch effect zie je meteen, een figuur die stilstaat of een droge fontein, en parken leggen attracties stil om ze te repareren.',
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken exit',
    shortDefinition:
      'Een speciaal uitgangspad voor gasten die vlak voor het instappen besluiten niet mee te gaan.',
    definition:
      'Een chicken exit is een aangewezen pad waarlangs gasten de wachtrij en de attractie kunnen verlaten vlak voordat ze zouden instappen. Hij is er voor wie zich op het laatste moment bedenkt, en voor wie alleen met anderen mee in de rij stond.',
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
  },
  {
    id: 'in-show-exit',
    name: 'In-show exit',
    shortDefinition:
      'Een uitgang of evacuatie uit een voertuig binnen het gethematiseerde gedeelte van een attractie.',
    definition:
      'Bij een in-show exit, of evacuatie in de show, valt een attractie stil en moeten bezoekers hun voertuig binnen in de attractie verlaten in plaats van op het uitstapperron. De oorzaak is meestal een storing of een veiligheidsstop: het besturingssysteem zet elk voertuig stil, een opgenomen omroepbericht vraagt rijders te blijven zitten, en het werklicht gaat aan.\n\nMedewerkers brengen de rijders dan via onderhoudspaden en dienstgangen naar een nooduitgang, en daarbij kom je soms van achteren of van bovenaf door de scènes. Met het licht aan laat de darkride zien hoe hij gemaakt is: figuren staan midden in een beweging stil, en de kabels en luidsprekers achter de geschilderde decors liggen open en bloot. Op een achtbaan loop je in zo’n geval de trap naast de lifthill af.\n\nEen geëvacueerde attractie blijft dicht tot medewerkers haar hebben gecontroleerd en lege testritten hebben gedraaid, en tot dan staat haar status op Storing.',
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
  },
  {
    id: 'e-stop',
    name: 'Noodstop',
    shortDefinition:
      'Een noodstop die onmiddellijk alle bewegingen van de attractie stopt om veiligheidsredenen.',
    definition:
      'Een E-Stop (noodstop) is een veiligheidsmechanisme of procedure die onmiddellijk de stroom onderbreekt of remmen inschakelt om alle bewegingen van de attractie te stoppen. Het kan automatisch worden geactiveerd door sensoren of handmatig door operators. Na een E-Stop moet de attractie meestal worden geïnspecteerd en gereset voordat deze weer in gebruik kan worden genomen.',
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
  },
  {
    id: 'mackprodukt',
    name: 'Mackprodukt',
    shortDefinition:
      'Jargon uit de Duitstalige community voor de reflexmatige, kritiekloze lofzang waarmee fervente Mack Rides-fans elke nieuwe creatie van de fabrikant onthalen.',
    definition:
      'Een “Mackprodukt” (letterlijk “Mack-product”) is een grap uit de Duitstalige achtbaan-community, waarmee de merktrouw van Mack Rides-fans liefdevol op de hak wordt genomen. Mack is een Duitse fabrikant en de familie achter Europa-Park, en de fans van het merk staan bekend als bijzonder trouw. Critici grappen dat elke nieuwe Mack-attractie al een meesterwerk heet voordat iemand erin heeft gezeten.\n\nDe meme draait om een paar vaste zinnen die een echte beoordeling zouden vervangen: bewondering voor hoe mooi de rails gebogen is (“die Schiene ist so toll gebogen”, “de rails is zo prachtig gebogen”) en voor de schitterende treinen (“wunderschöne Fahrfiguren”, “beeldschone wagons”). Het zijn complimenten over het uiterlijk, en de vraag hoe de attractie rijdt, komt er niet in voor. Wie iets een “Mackprodukt” noemt of die zinnen citeert, lacht liefdevol om merktrouw die zwaarder weegt dan de rit zelf.',
    relatedTermIds: ['credit', 'fanboy', 'gp', 'hype-train', 'mack-rides'],
    aliases: ['Mack-Produkt', 'Mackprodukte'],
  },
  {
    id: 'onride-offride',
    name: 'On-Ride / Off-Ride',
    shortDefinition:
      'Liefhebbersjargon voor beelden die aan boord van een attractie zijn gefilmd (on-ride) tegenover beelden die vanaf de grond zijn gefilmd (off-ride).',
    definition:
      'On-ride en off-ride beschrijven de twee belangrijkste manieren waarop liefhebbers een achtbaan vastleggen. Een on-ride video is gefilmd vanaf de stoel van een rijder en geeft het tempo, de airtime en de krachten van de rit weer, terwijl een off-ride video langs de baan wordt gefilmd en de layout, thematisering en treinen in beweging toont. Het begrippenpaar komt online steeds terug bij POV’s en ritvideo’s; omdat veel parken het los filmen met de telefoon aan boord verbieden, zijn officieel toegestane on-ride beelden bijzonder gewild.',
    relatedTermIds: ['pov', 'ride-photo', 'credit'],
    aliases: ['On-Ride', 'Off-Ride', 'Onride', 'Offride'],
  },
  {
    id: 're-ride',
    name: 'Re-Ride',
    shortDefinition:
      'Blijven zitten of meteen opnieuw instappen voor nog een rondje, zonder je stoel te verlaten of opnieuw in de wachtrij te gaan.',
    definition:
      'Een re-ride is wanneer een gast op een attractie mag blijven zitten – of direct weer in het station mag instappen – voor een extra cyclus zonder de hele rij opnieuw te lopen. Re-rides komen vaak voor laat op de dag, in rustige periodes of bij liefhebbersevenementen, wanneer de vraag laag is en de medewerkers rijders simpelweg laten doorrijden. Waar een park re-rides toestaat, kunnen achtbaanfans rondjes achter elkaar rijden, bijvoorbeeld om verschillende zitrijen te vergelijken of om een favoriet nog eens te rijden.',
    relatedTermIds: ['credit', 'ert', 'rope-drop'],
    aliases: ['Re-Rides', 'Reride'],
  },
  {
    id: 'hype-train',
    name: 'Hype Train',
    shortDefinition:
      'De golf van enthousiasme die in de community ontstaat rond een aangekondigde attractie en de verwachtingen soms boven de realiteit opblaast.',
    definition:
      'De “hype train” is de golf van verwachting die op fora en sociale media ontstaat zodra een nieuwe attractie wordt geteased of aangekondigd. Hij groeit met elke bouwupdate, elke uitgelekte lay-out en elke vroege POV, en kan de verwachtingen lang voor de openingsdag hoog opdrijven. Liefhebbers grappen over het “instappen in de hype train”, en over de teleurstelling als een attractie die verwachtingen niet waarmaakt. Het begrip hangt nauw samen met merktrouw en met memes zoals het Mackprodukt.',
    relatedTermIds: ['gp', 'mackprodukt', 'fanboy'],
    aliases: ['Hype', 'Hype-Train'],
  },
  {
    id: 'fanboy',
    name: 'Fanboy',
    shortDefinition:
      'Een fan wiens toewijding aan een bepaald park, fabrikant of attractie zijn mening reflexmatig positief en kritiekloos maakt.',
    definition:
      'In liefhebberskringen is een “fanboy” (de term wordt ongeacht geslacht gebruikt) iemand wiens gehechtheid aan een bepaald park of een bepaalde fabrikant elk oordeel kleurt, en die de producten ervan bijna reflexmatig verdedigt en prijst. Het etiket wordt meestal half voor de grap geplakt, maar in de hobby weegt merktrouw soms zwaarder dan een nuchter oordeel. De Mackprodukt-meme van de Duitstalige community is fanboyisme dat een running gag is geworden.',
    relatedTermIds: ['mackprodukt', 'hype-train', 'gp'],
    aliases: ['Fanboys', 'Fangirl'],
  },
  {
    id: 'smoothness',
    name: 'Loopcomfort',
    shortDefinition:
      'Hoe vrij een achtbaan is van schokken, geschud en trillingen; het tegenovergestelde is een ruwe of ratelende rit.',
    definition:
      'Loopcomfort (in het Engels “smoothness”, Duitse liefhebbers noemen het “Laufruhe”) is de mate waarin de treinen van een achtbaan de lay-out doorlopen zonder hoofdstoten, geschud of trillingen. Het hangt af van hoe nauwkeurig de rails is gemaakt, van het ontwerp van trein en wielen en van de leeftijd en het onderhoud van de attractie. Banen van B&M en Mack rijden doorgaans heel soepel. Een achtbaan die na jaren nog even soepel rijdt, is goed gebouwd en goed onderhouden. Het tegenovergestelde is een ruwe, ratelende rit.',
    relatedTermIds: ['rattle', 'b-and-m', 'g-force'],
    aliases: ['Smoothness', 'Laufruhe', 'glasglad'],
  },
  {
    id: 'rattle',
    name: 'Rattle',
    shortDefinition:
      'Ongewenste trilling of geschud dat door een achtbaantrein wordt doorgegeven en een verder goede rit ruw doet aanvoelen.',
    definition:
      'Een rattle is het gezoem, geschud of geratel dat ontstaat wanneer de wielen van een achtbaan niet meer perfect over de rails lopen, vaak een teken van railslijtage, wielconditie of veroudering. Duitse liefhebbers noemen het “Rattern” of “Geruckel”. Een rattle kan een verder goede lay-out oncomfortabel maken en speelt vooral bij oudere stalen achtbanen van Arrow en Vekoma. Een rit zonder rattle heeft een goed loopcomfort.',
    relatedTermIds: ['smoothness', 'wooden-coaster', 'arrow-dynamics'],
    aliases: ['Rattling', 'Rattern', 'Geratel'],
  },
  {
    id: 'restraint-freedom',
    name: 'Bewegingsvrijheid',
    shortDefinition:
      'Hoeveel ruimte een rijder heeft om te bewegen onder de schootbeugel of schouderbeugel, en daarmee hoe sterk hij airtime en ejector voelt.',
    definition:
      'Bewegingsvrijheid (“Bügelfreiheit” in de Duitse community) is de ruimte die er tussen de rijder en de beugel overblijft zodra die vergrendeld is. Met veel ruimte onder een schootbeugel komt de rijder bij airtime van de stoel omhoog en voelt hij het zweven of de ejector-kracht volledig; een strakke of hard aangedrukte beugel houdt hem op de stoel. Veel ontwerpen van Intamin en Mack hebben losse schootbeugels. Drukt een medewerker de beugel te stevig aan, dan heet dat stapling.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'stapling'],
    aliases: ['Bügelfreiheit', 'Restraint Freedom'],
  },
  {
    id: 'single-rail-coaster',
    name: 'Single-Rail Coaster',
    shortDefinition:
      'Een modern achtbaantype dat op één smalle rail rijdt, met de rijders achter elkaar en niets naast zich, op een kronkelige baan.',
    definition:
      'Een single-rail coaster rijdt op één smalle kokerrail in plaats van de gebruikelijke twee parallelle rails, met treinen waarin de rijders schrijlings achter elkaar boven de baan zitten. Op de dunne rail zijn heel krappe, gedraaide lay-outs mogelijk, en de rijders hebben niets naast zich. Rocky Mountain Construction bouwde de eerste moderne versie, het “Raptor”-model (zoals RailBlazer in California’s Great America). Vekoma en Intamin hebben sindsdien eigen single-rail-ontwerpen ontwikkeld.',
    relatedTermIds: ['rmc', 'vekoma', 'steel-coaster'],
    aliases: ['Single Rail', 'Single-Rail', 'Raptor Track'],
  },
  {
    id: 'stand-up-coaster',
    name: 'Stand-Up Coaster',
    shortDefinition: 'Een achtbaan waarop rijders staand in plaats van zittend worden vastgezet.',
    definition:
      'Een stand-up coaster zet rijders rechtop, staand vast met een fietszadelachtige zitting en een schouderbeugel. Stand-ups waren populair in de late jaren 80 en de jaren 90, vooral die van TOGO en B&M. Staand voel je de krachten anders: in loops en bochten dragen de benen een ongewone belasting. Sindsdien zijn er weinig nieuwe stand-ups gebouwd, en meerdere zijn omgebouwd tot een ander type (de Mantis van B&M werd de floorless Rougarou). Voor wie credits verzamelt, zijn de overgebleven exemplaren daarom gewild.',
    relatedTermIds: ['b-and-m', 'floorless-coaster', 'steel-coaster'],
    aliases: ['Stand Up Coaster', 'Standup Coaster'],
  },
  {
    id: 'bobsled-coaster',
    name: 'Bobsleebaan',
    shortDefinition:
      'Een achtbaan waarvan de wagens vrij door een open goot met schuine wanden rijden in plaats van vast aan een rail te zitten.',
    definition:
      'Een bobsleebaan (“bobsled coaster”) stuurt zijn wagens door een gebogen, halfronde goot in plaats van langs een klassieke rail, zodat ze net als een echte bobslee hun eigen lijn door de schuine bochten zoeken. De rit heeft geen inversies; hij draait om zijwaartse krachten, en snelheid en de vorm van de goot bepalen hoe hij verloopt. Schwarzkopf bouwde vroege versies, en Mack Rides is de bekendste maker van de moderne stalen bobsleebaan, waarvan er meerdere in Duitse parken en in parken in de Alpen draaien.',
    relatedTermIds: ['mack-rides', 'wild-mouse', 'steel-coaster'],
    aliases: ['Bobsled Coaster', 'Bobbahn', 'Bobslee-achtbaan'],
  },
  {
    id: 'powered-coaster',
    name: 'Powered Coaster',
    shortDefinition:
      'Een achtbaanachtige attractie die continu wordt aangedreven door een motor aan boord of in de baan, in plaats van op zwaartekracht te steunen.',
    definition:
      'Een powered coaster ziet eruit als een achtbaan maar wordt over zijn hele circuit voortgestuwd door elektromotoren, in plaats van eenmaal omhoog te worden getrokken en aan de zwaartekracht overgelaten. Omdat hij snelheid kan houden en meerdere rondjes kan rijden, is het meestal een rustige familieattractie – vaak aangekleed als mijntrein, draak of dier – met een hoge capaciteit en milde krachten. Of powered coasters als credit “meetellen”, is een al lang lopend, half serieus debat in de liefhebberscommunity.',
    relatedTermIds: ['alpine-coaster', 'credit', 'mack-rides', 'mine-train'],
    aliases: ['Powered Coasters', 'aangedreven achtbaan'],
  },
  {
    id: 'water-coaster',
    name: 'Water Coaster',
    shortDefinition:
      'Een kruising tussen achtbaan en waterattractie, die achtbaanbaan en liften combineert met een of meer splashdowns.',
    definition:
      'Een water coaster combineert achtbaantechniek (ketting- of aangedreven liften, afdalingen en gekantelde baan) met het natte einde van een waterattractie. Boten of achtbaanachtige wagens worden de liftheuvels op getrokken en door dalen gestuurd voordat ze in een waterbak scherp afremmen en een golf opwerpen. Mack Rides bouwt de meeste moderne water coasters, zoals Poseidon in Europa-Park.',
    relatedTermIds: ['mack-rides', 'log-flume', 'splashdown'],
    aliases: ['Water Coasters', 'water-achtbaan'],
  },
  {
    id: 'alpine-coaster',
    name: 'Alpine Coaster',
    shortDefinition:
      'Een railgeleide afdaalachtbaan, meestal op een berghelling, waarbij rijders hun eigen snelheid regelen met een remhendel.',
    definition:
      'Een alpine coaster (ook mountain coaster genoemd) is een slee- of karretjesattractie die vast op een rail zit en de natuurlijke contouren van een helling volgt, waarbij rijders hun eigen snelheid bepalen met een handrem. Anders dan bij een klassieke achtbaan is er geen trein en meestal geen lancering: de karretjes rollen op de zwaartekracht naar beneden, en een kabel trekt ze weer naar boven. In de Alpen staan ze in veel dorpen en draaien ze het hele jaar; inmiddels zijn ze ook elders in de wereld te vinden. De oudere “Sommerrodelbahn” (zomerrodelbaan) met een goot in plaats van een rail is hun naaste verwant.',
    relatedTermIds: ['terrain-coaster', 'powered-coaster'],
    aliases: ['Mountain Coaster', 'Sommerrodelbahn'],
  },
  {
    id: 'beyond-vertical-drop',
    name: 'Beyond-Vertical Drop',
    shortDefinition:
      'Een afdaling steiler dan 90 graden, waarbij de rijders voorbij de verticaal kantelen en even schuin naar achteren kijken.',
    definition:
      'Een beyond-vertical drop is steiler dan 90 graden: de baan buigt onder zichzelf terug, zodat de rijders even voorbij de verticaal kantelen en licht achterover naar de constructie kijken. Het Euro-Fighter-model van Gerstlauer maakte het type bekend met afdalingen tot 121°, en B&M en anderen hebben dive coasters gebouwd met vergelijkbare overhangende eerste dalingen. Mumbo Jumbo en Takabisha (121°, 2011) hielden het record voor de steilste afdaling; sinds 2019 heeft TMNT Shellraiser het, met 121,5°.',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'afdaling voorbij de verticaal'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'Het door water afgeremde slot van een waterattractie of water coaster, waar de boot een bak raakt en een golf opwerpt.',
    definition:
      'Een splashdown is het moment waarop een boot of wagen onderaan een afdaling een waterkanaal in rijdt. Het water remt: het vertraagt het voertuig binnen een paar meter en gooit de energie omhoog als een muur van water, die neerkomt op de rijders, op de volgende boot en vaak op toeschouwers op een brug die daarvoor is gebouwd.\n\nHoe nat een rit wordt, hangt af van de diepte en de vorm van de bak, de vorm van de boeg en de snelheid onderaan. Op boomstamattracties worden vooral de voorste plaatsen doorweekt. Atlantica SuperSplash in Europa-Park (Mack Rides, 2005) raakt aan het eind van een steile afdaling het meer, en Pulsar in Walibi Belgium valt van 45 meter in een bassin dat ook als rem dient.\n\nOp warme dagen zijn de rijen bij de waterattracties langer.',
    relatedTermIds: ['water-coaster', 'log-flume', 'mack-rides'],
    aliases: ['Splash-down', 'Splashdowns'],
  },
  {
    id: 'quad-down',
    name: 'Quad-Down',
    shortDefinition:
      'Een reeks van vier opeenvolgende dalende hobbels die herhaalde, snel achtereenvolgende airtime geven tegen het einde van een layout.',
    definition:
      'Een quad-down (en zijn kleinere neefjes de triple-down en double-down) is een reeks dalende treden kort na elkaar. Elke trede geeft een korte, scherpe stoot airtime: de trein daalt, komt even vlak en daalt weer. Het element komt veel voor op houten en hybride achtbanen en geeft op weinig ruimte airtime in snel vuur (“machinegeweer-airtime”); het bouwt op hetzelfde idee als de camelback en bunny hop, maar rijgt de hobbels aaneen tot één snelle reeks.',
    relatedTermIds: ['airtime', 'camelback', 'wooden-coaster'],
    aliases: ['Quad Down', 'Triple-Down', 'Double-Down'],
  },
  {
    id: 's-hill',
    name: 'S-Hill',
    shortDefinition:
      'Een S-vormige airtime-heuvel die rijders bij het optillen naar één kant gooit en zweefgevoel met een zijwaartse zet combineert.',
    definition:
      'Een S-hill is een airtime-heuvel met een S-vormige bocht, zodat de trein bij het overgaan van de top en het zweven ook zijwaarts eerst naar de ene en dan naar de andere kant wordt geduwd. De rijders voelen verticale airtime en een onverwachte zijwaartse ruk tegelijk. Het element zit vooral op moderne houten en hybride achtbanen met een wild, onvoorspelbaar tempo. Het is nauw verwant aan de wave turn, die de airtime volledig op zijn kant legt.',
    relatedTermIds: ['airtime', 'airtime-hill', 'wave-turn', 'bunnyhop'],
    aliases: ['S Hill', 'Speed Bump'],
  },
  {
    id: 'celestial-spin',
    name: 'Celestial Spin',
    shortDefinition:
      'Een inversie op twee sporen van Mack Rides: twee racende treinen gaan over een gedeelde heuvel terwijl hun sporen om elkaar heen draaien, de ene rolt omhoog, de andere omlaag.',
    definition:
      'Een celestial spin is een inversie op twee sporen, gepatenteerd door Mack Rides en gebouwd voor [Stardust Racers](/nl/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), de racende lanceerachtbaan in [Universal Epic Universe](/nl/parks/north-america/united-states/orlando/universal-epic-universe). Als de twee treinen over een gedeelde heuvel gaan, winden hun sporen om elkaar heen: de ene trein rolt omhoog door een zero-G roll, terwijl de andere op hetzelfde moment omlaag rolt door een barrel roll, en de wagentjes lijken in de lucht om elkaar heen te draaien.\n\nBeide rollen vallen samen met de top van de heuvel, zodat rijders een lang moment gewichtloos zijn terwijl de andere trein op een paar meter afstand voorbij draait. Het element is verwant aan de zero-G roll en de airtime hill, en het werkt alleen zoals bedoeld als beide treinen er tegelijk aankomen.',
    relatedTermIds: ['zero-g-roll', 'airtime-hill', 'inversion', 'hangtime'],
    aliases: ['Celestial Roll', 'Celestial Rolls', 'Celestial Spins'],
    alternateNames: ['Celestial Roll'],
  },
  {
    id: 'launch',
    name: 'Lancering',
    shortDefinition:
      'Een aandrijfsectie die de trein in seconden op snelheid brengt, in plaats van hem een liftheuvel op te trekken.',
    definition:
      'Een launch is het stuk baan waar een achtbaan zijn energie van een motor krijgt in plaats van van de zwaartekracht. Vier technieken domineren. LSM-lanceringen (lineaire synchroonmotor) zetten elektromagneten langs de baan die trekken aan een vin onder de trein – soepel, nauwkeurig regelbaar en midden in het parcours herhaalbaar, waardoor vrijwel elke nieuwe gelanceerde achtbaan ze gebruikt. LIM-lanceringen (lineaire inductiemotor) werken vergelijkbaar maar verliezen meer energie als warmte. Hydraulische lanceringen gebruiken een lier aangedreven door met stikstof bedrukte accumulatoren en leveren de heftigste versnelling ooit gebouwd; persluchtlanceringen, zoals op Maxx Force, zijn over de eerste meters nog sneller.\n\nEen launch verschilt van een liftheuvel ook in waar de energie besteed kan worden. Een liftheuvel moet het hoogste punt van de baan zijn, dus alles daarna gaat omlaag. Een launch kan overal zitten, en daarom blijven multi-launchbanen als [Taron](/nl/parks/europe/germany/bruehl/phantasialand/taron) in [Phantasialand](/nl/parks/europe/germany/bruehl/phantasialand) of [Voltron Nevera](/nl/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) in [Europa-Park](/nl/parks/europe/germany/rust/europa-park) over hun hele lengte snel, in plaats van hoogte één keer in te ruilen voor snelheid. Haalt een launch het parcours niet, dan volgt een rollback.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'swing-launch', 'rollback', 'top-hat'],
    aliases: ['Launch', 'Launches', 'LSM-launch', 'LIM-launch'],
    alternateNames: ['Launch'],
  },
  {
    id: 'swing-launch',
    name: 'Schommellancering',
    shortDefinition:
      'Een launch die de trein meerdere keren heen en weer schiet en bij elke passage snelheid opbouwt tot het parcours haalbaar is.',
    definition:
      'Een swing launch (ook shuttle- of multi-passlancering) versnelt de trein, laat hem uitlopen op een stijgend stuk baan, vangt hem op de terugweg weer op – en herhaalt dat twee of drie keer tot er genoeg energie is voor de hele rit. Elke passage voegt snelheid toe die de motoren in één keer niet zouden halen. Zo haalt een swing launch op een veel kortere lanceerbaan een veel hogere topsnelheid.\n\nDe bezoekers rijden daarbij een deel van het parcours achteruit, meestal een verticale spike op, voordat ze weer vooruit worden geschoten. [Toutatis](/nl/parks/europe/france/plailly/parc-asterix/toutatis) in Parc Astérix, [The Ride to Happiness](/nl/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) in Plopsaland gebruiken er een. Premier Rides bouwt met het model Sky Rocket II een hele compacte achtbaan rond dit idee.',
    relatedTermIds: ['launch', 'spike', 'shuttle-coaster', 'launch-coaster'],
    aliases: ['Swing Launch', 'Shuttlelancering'],
    alternateNames: ['Swing Launch'],
  },
  {
    id: 'vertical-lift',
    name: 'Verticale Lift',
    shortDefinition:
      'Een liftheuvel van 90 graden, waarop de trein recht omhoog langs de constructie wordt getrokken.',
    definition:
      'Een verticale lift vervangt de gebruikelijke helling van 30 tot 45 graden door een stuk baan dat loodrecht omhoog gaat. Omdat een gewone ketting met terugloopbeveiliging een trein op een verticaal vlak niet betrouwbaar kan houden, gebruiken deze liften een kabel, een catch-car of een ketting met formsluitende meenemer. Bezoekers liggen de hele klim op hun rug en kijken recht de lucht in.\n\nDe verticale lift hoort bij de Euro-Fighter- en Infinity Coaster-modellen van Gerstlauer, waar hij direct overgaat in een overhellende afdaling: [Takabisha](/nl/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) in Fuji-Q Highland klimt verticaal en duikt dan met 121 graden; alleen TMNT Shellraiser (2019, 121,5 graden) is steiler. [Oath of Kärnan](/nl/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) in Hansa-Park gebruikt een verticale lift van 73 meter in een gesloten toren, zodat je in het donker omhoog gaat. Niet te verwarren met een liftkooi, waarbij het baanstuk zelf met de trein omhoog gaat.',
    relatedTermIds: ['lifthill', 'beyond-vertical-drop', 'euro-fighter', 'anti-rollback'],
    aliases: ['Vertical Lift', 'Verticale liften'],
    alternateNames: ['Vertical Lift'],
  },
  {
    id: 'drop-track',
    name: 'Valspoor',
    shortDefinition:
      'Een stuk baan dat wegzakt terwijl de trein erop stilstaat, zodat de vloer onder je lijkt te verdwijnen.',
    definition:
      'Een drop track is een kort, beweegbaar baanstuk op een hydraulisch of elektrisch platform. De trein rijdt erop, stopt, en het hele segment – rails, trein en al – wordt naar beneden losgelaten, meestal enkele meters, waarna de baan in een nieuwe stand vergrendelt en de rit doorgaat. Anders dan bij een normale afdaling komt het gevoel terwijl de trein stilstaat en waterpas is, en daarom voelt het als grond die het begeeft in plaats van als een duik.\n\nHet hoort bijna altijd bij het verhaal van de attractie, en het werkt alleen als je het niet ziet aankomen. Daarom zit een valspoor in showgebouwen en tunnels. [Hagrid’s Magical Creatures Motorbike Adventure](/nl/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure) laat bezoekers midden in het parcours het donker in vallen, [Verbolten](/nl/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/verbolten) in Busch Gardens Williamsburg uit het Zwarte Woud, en Harry Potter and the Escape from Gringotts gebruikt er een in de kluisscène.',
    relatedTermIds: ['switch-track', 'dark-ride', 'first-drop', 'indoor-coaster'],
    aliases: ['Drop Track', 'Drop Tracks'],
    alternateNames: ['Drop Track'],
  },
  {
    id: 'scorpion-tail',
    name: 'Schorpioenstaart',
    shortDefinition:
      'Een lanceerspike van Mack Rides en Premier Rides: de baan buigt voorbij verticaal in een overhang, zodat de trein achteruit tegen een muur van meer dan 90 graden op klimt.',
    definition:
      'De scorpion tail is een lanceerspike die niet stopt bij verticaal. In plaats van tot 90 graden te stijgen en de trein daar te houden, buigt de baan door de verticaal heen en helt terug tot ongeveer 105 graden, zodat er een overhang ontstaat. Een gelanceerde trein klimt ondersteboven en licht achterwaarts omhoog, hangt op het hoogste punt en valt dezelfde weg terug.\n\nPremier Rides bouwde er in 2022 een voor Ice Breaker in SeaWorld Orlando. Mack Rides bouwde in 2024 een eigen versie voor [Voltron Nevera](/nl/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) in [Europa-Park](/nl/parks/europe/germany/rust/europa-park), waar het de steilste lanceersectie van alle achtbanen ter wereld is. De hangtime ontstaat hier zonder voorwaartse beweging: bovenin word je alleen nog vastgehouden door de vorm van de baan en de resterende vaart van de trein. De naam komt van het silhouet: een staart die omhoog en over zichzelf heen krult.',
    relatedTermIds: ['spike', 'swing-launch', 'launch', 'hangtime', 'mack-rides'],
    aliases: ['Scorpion Tail', 'Scorpion Tails'],
    alternateNames: ['Scorpion Tail'],
  },
  {
    id: 'step-up-under-flip',
    name: 'Step-Up Under-Flip',
    shortDefinition:
      'Een RMC-inversie waarbij de trein een sterk overhellende heuvel op klimt, bovenaan omrolt en er aan de andere kant ondersteboven uit valt.',
    definition:
      'Een step-up under-flip is een tweetraps inversie, bedacht door Rocky Mountain Construction. De trein “stapt” eerst omhoog over een stijgend, zwaar overhellend stuk en flipt daarna onder zichzelf door op de weg naar beneden, zodat de rol op de dalende helft plaatsvindt in plaats van op de top. Het resultaat is een langere, tragere rotatie dan een barrel roll en een harde klap ejector airtime bij het uitvallen.\n\nHet element komt voor op RMC-hybrides als [Steel Vengeance](/nl/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance) in Cedar Point, [Zadra](/nl/parks/europe/poland/zator/energylandia/zadra-rc) in Energylandia en [Untamed](/nl/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) in Walibi Holland, de eerste RMC-conversie in Europa. Omdat de manoeuvre nauwkeurig gewrongen stalen rail op een houten of stalen constructie vraagt, is hij op traditioneel houten spoor praktisch onmogelijk.',
    relatedTermIds: [
      'rmc',
      'hybrid-coaster',
      'inversion',
      'ejector-airtime',
      'twisted-horseshoe-roll',
    ],
    aliases: ['Step Up Under Flip'],
  },
  {
    id: 'twisted-horseshoe-roll',
    name: 'Twisted Horseshoe Roll',
    shortDefinition:
      'Een RMC-element: een hoefijzerbocht van 180 graden met in beide benen een rol, dus twee keer ondersteboven bij een volledige richtingsomkeer.',
    definition:
      'Een twisted horseshoe roll neemt het hoefijzer – een krappe 180-gradenkeer die de trein terugstuurt – en vlecht in beide benen een inversie. De trein rolt om bij het inrijden, gaat door de hoefijzerbocht en rolt bij het uitrijden opnieuw. Twee inversies en een volledige richtingswisseling gebeuren in één doorlopende, ongewoon uitgerekte manoeuvre.\n\nRocky Mountain Construction introduceerde het op Outlaw Run in Silver Dollar City, de eerste houten achtbaan ooit met een dubbele barrel roll, en bouwde het sindsdien in [Steel Vengeance](/nl/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance), [Zadra](/nl/parks/europe/poland/zator/energylandia/zadra-rc), [Iron Gwazi](/nl/parks/north-america/united-states/tampa/busch-gardens-tampa/iron-gwazi) en [Untamed](/nl/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed). Je brengt het grootste deel van het element zijwaarts of ondersteboven door bij zeer lage G-krachten, en de hangtime duurt daardoor lang.',
    relatedTermIds: ['horseshoe', 'rmc', 'inversion', 'hangtime', 'step-up-under-flip'],
    aliases: ['Twisted Horseshoe Rolls', 'Dubbele barrel roll'],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    shortDefinition:
      'Een afdaling die halverwege even afvlakt en daardoor twee losse klappen airtime geeft in plaats van één.',
    definition:
      'Een double down is een afdaling in twee etappes: de baan zakt, vlakt kort af of stijgt zelfs een fractie, en zakt dan opnieuw. Elke overgang tilt bezoekers uit hun stoel, zodat één heuvel twee duidelijke schoten airtime oplevert in plaats van één lang zweefmoment. Het spiegelbeeld, een double up, doet hetzelfde op de weg omhoog.\n\nHet element is al heel oud in de houten achtbaanbouw: [Jack Rabbit](/nl/parks/north-america/united-states/west-mifflin/kennywood/jack-rabbit) in Kennywood gooit bezoekers sinds 1920 met zijn double dip uit hun stoel. Ook moderne houten en hybride banen gebruiken het: [Colossos](/nl/parks/europe/germany/soltau/heide-park/colossos-kampf-der-giganten) in Heide-Park, [Balder](/nl/parks/europe/sweden/gothenburg/liseberg/balder) in Liseberg en [Troy](/nl/parks/europe/netherlands/sevenum/attractiepark-toverland/troy) in Toverland beëindigen afdalingen zo. Met vier etappes in één afdaling heet het element een quad-down.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'quad-down', 'camelback', 'wooden-coaster'],
    aliases: ['Double Downs', 'Double dip'],
    alternateNames: ['Double Dip'],
  },
  {
    id: 'switch-track',
    name: 'Wissel',
    shortDefinition:
      'Een beweegbaar baanstuk dat de trein naar een ander pad stuurt, voor achteruitpassages, vertakte parcoursen en opstelsporen.',
    definition:
      'Een switch track is het achtbaanequivalent van een spoorwissel: een baanstuk dat schuift, kantelt of draait om het hoofdparcours met een tweede route te verbinden. Mechanisch is het eenvoudig, en de ontwerper kan er het parcours mee vertakken. Een wissel kan een trein achteruit door een al gereden stuk sturen, vanuit hetzelfde station twee routes aanbieden, of aan het eind van de dag treinen simpelweg de onderhoudsloods in leiden.\n\nAls showelement gaat het meestal om verrassing. [Expedition Everest](/nl/parks/north-america/united-states/orlando/disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain) toont opgebroken spoor vooruit en stuurt de trein dan achteruit de berg af. [Big Grizzly Mountain](/nl/parks/asia/hong-kong/hong-kong/hong-kong-disneyland-park/big-grizzly-mountain-runaway-mine-cars) in Hong Kong Disneyland gebruikt er twee. [Fury](/nl/parks/europe/belgium/kasterlee/bobbejaanland/fury) in Bobbejaanland biedt er een voorwaartse en een achterwaartse rit mee uit hetzelfde parcours.',
    relatedTermIds: ['drop-track', 'turntable', 'block-brake', 'dark-ride'],
    aliases: ['Switch Track', 'Switch Tracks', 'Baanwissel'],
    alternateNames: ['Switch Track'],
  },
  {
    id: 'turntable',
    name: 'Draaischijf',
    shortDefinition:
      'Een draaiend platform in het parcours dat de trein ter plekke keert, meestal om hem de andere kant op te sturen.',
    definition:
      'Een draaischijf is een baanstuk op een roterende schijf. De trein rijdt erop, de schijf draait – meestal 180 graden – en de trein rijdt de andere kant op verder. Omdat de trein tijdens het draaien stilstaat, is het een bewust rustig moment: de baan wisselt van richting zonder shuttlespike of wissel, en de show heeft even tijd om de bezoekers iets te laten zien.\n\nOp [Voltron Nevera](/nl/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) in Europa-Park zet de draaischijf een achterwaartse lancering op, en in veel dark rides draait hij bezoekers op precies het juiste moment naar een scène. Trackless dark rides bereiken hetzelfde zonder speciale hardware, omdat hun voertuigen overal vrij kunnen draaien.',
    relatedTermIds: ['switch-track', 'swing-launch', 'trackless-ride', 'dark-ride'],
    aliases: ['Turntable', 'Draaischijven'],
    alternateNames: ['Turntable'],
  },
  {
    id: 'treble-clef',
    name: 'Vioolsleutel',
    shortDefinition:
      'Een niet-inverterend element in de vorm van de muzieksleutel: de baan lust over zichzelf heen en rijgt terug door de eigen bocht.',
    definition:
      'Een treble clef is een gestapelde, zichzelf kruisende bocht – de trein klimt een lus in, kruist zijn eigen spoor en verlaat de figuur door het midden, waarmee ongeveer de omtrek van de vioolsleutel wordt getekend. Een inversie is het niet: de trein blijft steeds rechtop, gehouden door zware overhelling in plaats van door ondersteboven te gaan. Je zwaait lang door de figuur, met spoor vlak boven en onder je.\n\nMaurer Rides bouwde het element voor [Hollywood Rip Ride Rockit](/nl/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) in Universal Studios Florida, waarvan het parcours muzikaal is uitgewerkt en de figuren daarnaar benoemt. De vioolsleutel volgt op de niet-inverterende “double take”-lus. Het element is nergens anders gebouwd.',
    relatedTermIds: ['non-inverting-loop', 'maurer-rides', 'overbank', 'inversion'],
    aliases: ['Treble Clef'],
    alternateNames: ['Treble Clef'],
  },
  {
    id: 'indoor-coaster',
    name: 'Indoor-achtbaan',
    shortDefinition:
      'Een achtbaan die volledig binnen staat, waar licht, geluid en decor het uitzicht vervangen.',
    definition:
      'Een indoor-achtbaan rijdt haar hele parcours in een gesloten showgebouw. Zonder daglicht zie je geen afdaling of bocht aankomen, en daardoor voelt een bescheiden parcours veel heftiger aan dan hetzelfde spoor in de buitenlucht. Binnen heeft de ontwerper ook licht, projectie, geluid en decor volledig in de hand, en daarom zijn de meeste combinaties van achtbaan en darkride indoor-achtbanen.\n\nHet bekendste voorbeeld is Space Mountain. De eerste opende in 1975 in Magic Kingdom, [Disneyland](/nl/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) volgde in 1977, en geen andere donkere achtbaan is zo vaak nagebouwd. Europese voorbeelden zijn [Eurosat](/nl/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) in Europa-Park, Eftelings [Vogel Rok](/nl/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) en Phantasialands [Crazy Bats](/nl/parks/europe/germany/bruehl/phantasialand/crazy-bats).',
    relatedTermIds: ['dark-ride', 'show-building', 'projection-mapping', 'vr-coaster'],
    aliases: ['Indoor-achtbanen', 'Indoor Coaster'],
    alternateNames: ['Indoor Coaster'],
  },
  {
    id: 'family-coaster',
    name: 'Familieachtbaan',
    shortDefinition:
      'Een achtbaan die kinderen en volwassenen samen kunnen rijden – gematigde krachten, lage minimumlengte, geen inversies.',
    definition:
      'Een familieachtbaan mikt op het breedst mogelijke publiek in plaats van op thrillzoekers. Minimumlengtes beginnen doorgaans rond 100 tot 110 centimeter (daaronder vaak onder begeleiding), snelheden blijven onder ongeveer 60 km/u, en parcoursen vermijden inversies en aanhoudend hoge G-krachten. Binnen die grenzen heeft een goede familieachtbaan toch airtime en een strak ritme.\n\nCommercieel horen ze tot de waardevolste banen die een park kan kopen, omdat een heel gezelschap samen kan rijden en de wachtrij nooit leegloopt. Vekoma’s Family Boomerang, Macks Youngstar en Zierers Tivoli zijn veelgebouwde modellen; [Pegasus](/nl/parks/europe/germany/rust/europa-park/pegasus) in Europa-Park, [Raik](/nl/parks/europe/germany/bruehl/phantasialand/raik) in Phantasialand en [Slinky Dog Dash](/nl/parks/north-america/united-states/orlando/disneys-hollywood-studios/slinky-dog-dash) in Disney’s Hollywood Studios zijn zo ontworpen.',
    relatedTermIds: ['height-requirement', 'mine-train', 'wild-mouse', 'launch-coaster'],
    aliases: ['Familieachtbanen', 'Family Coaster', 'Juniorachtbaan'],
    alternateNames: ['Family Coaster', 'Juniorachtbaan'],
  },
  {
    id: 'motorbike-coaster',
    name: 'Motorachtbaan',
    shortDefinition:
      'Een achtbaan waarop je schrijlings zit als op een motor, voorovergebogen over een stuur, in enkele rij.',
    definition:
      'Op een motorachtbaan zit je schrijlings op het voertuig in plaats van erin, met je handen aan een stuur, voorovergebogen en je voeten op steunen. Door die zithouding ligt het zwaartepunt laag en recht boven de rails, en voelen overhellende bochten en zijwaartse krachten aan als het insturen van een bocht. Het betekent ook dat de treinen lang en smal zijn en de capaciteit per voertuig laag.\n\nVekoma bouwde de eerste met Booster Bike in [Toverland](/nl/parks/europe/netherlands/sevenum/attractiepark-toverland/booster-bike) in 2004; Intamin voerde het idee het verst door op [Hagrid’s Magical Creatures Motorbike Adventure](/nl/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure), dat een zijspan toevoegt zodat ook wie niet schrijlings kan zitten mee kan. Disneys [TRON Lightcycle / Run](/nl/parks/north-america/united-states/orlando/magic-kingdom-park/tron-lightcycle-run) gebruikt dezelfde houding met een gesloten kap over elke bezoeker.',
    relatedTermIds: ['launch-coaster', 'vekoma', 'intamin', 'suspended-coaster'],
    aliases: ['Motorachtbanen', 'Motorbike Coaster'],
    alternateNames: ['Motorbike Coaster'],
  },
  {
    id: 'infinity-coaster',
    name: 'Infinity Coaster',
    shortDefinition:
      'Gerstlauers opvolger van de Euro-Fighter: dezelfde steile afdalingen en compacte voetafdruk, maar met open treinen in stadionopstelling.',
    definition:
      'De Infinity Coaster is Gerstlauers huidige platform voor maatwerkbanen. Hij heeft de overhellende afdalingen, verticale liften en parcoursen op zeer weinig grond van de Euro-Fighter. De hoekige vierpersoonswagens zijn vervangen door langere, lagere treinen met open zijkanten, en de schouderbeugels door vestbeugels. Hij rijdt merkbaar soepeler en kan meer airtime hills aan, waar het oudere model slecht mee overweg kon.\n\nHet gamma loopt van compacte opvulbanen tot recordhouders: [The Smiler](/nl/parks/europe/united-kingdom/farley/alton-towers/the-smiler) in Alton Towers houdt met veertien inversies het wereldrecord, en [Oath of Kärnan](/nl/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) in Hansa-Park combineert een verticale lift van 73 meter met een achterwaartse vrije val.',
    relatedTermIds: ['gerstlauer', 'euro-fighter', 'beyond-vertical-drop', 'vertical-lift'],
    aliases: ['Infinity Coasters'],
  },
  {
    id: 'interactive-dark-ride',
    name: 'Interactieve Darkride',
    shortDefinition: 'Een darkride waarin je schiet, mikt of meespeelt, en die je score bijhoudt.',
    definition:
      'Een interactieve darkride geeft bezoekers een apparaat in handen – meestal een infraroodblaster, soms een touchscreen of gewoon de eigen handen – en bouwt de show rond wat ze ermee doen. Doelen in elke scène registreren treffers en voeden een persoonlijke score die aan het eind wordt getoond. Die score is een reden om nog een keer te rijden.\n\nHet genre kent twee scholen. Fysieke ritten schieten op echte, geanimeerde decors: [Maus au Chocolat](/nl/parks/europe/germany/bruehl/phantasialand/maus-au-chocolat) in Phantasialand en [Men in Black: Alien Attack](/nl/parks/north-america/united-states/orlando/universal-studios-florida/men-in-black-alien-attack) in Universal Studios Florida. Schermgebaseerde ritten schieten op geprojecteerde doelen en kunnen daardoor veel uitgebreidere effecten tonen, zoals [Toy Story Mania](/nl/parks/north-america/united-states/orlando/disneys-hollywood-studios/toy-story-mania) en [WEB SLINGERS](/nl/parks/north-america/united-states/anaheim/disney-california-adventure-park/web-slingers-a-spider-man-adventure), dat handbewegingen volgt zonder blaster.',
    relatedTermIds: ['dark-ride', 'animatronics', 'projection-mapping', 'trackless-ride'],
    aliases: ['Interactieve darkrides', 'Interactive Dark Ride', 'Schietdarkride'],
    alternateNames: ['Interactive Dark Ride'],
  },
  {
    id: 'madhouse',
    name: 'Madhouse',
    shortDefinition:
      'Een attractie waarin de kamer om een zacht schommelende bank draait, zodat je overtuigd raakt dat je over de kop gaat.',
    definition:
      'Een madhouse is een illusie die op één truc rust: de zitbank schommelt slechts enkele graden, terwijl de hele kamer eromheen een volledige 360 graden roteert. Zonder vast visueel referentiepunt – muren, plafond en rekwisieten bewegen allemaal mee – leest je brein de beweging als het over de kop gaan van de bank. Je weet zeker dat je ondersteboven hing; in werkelijkheid verlaat je nooit een vlakke boog.\n\nVekoma bouwde [Villa Volta](/nl/parks/europe/netherlands/kaatsheuvel/efteling/villa-volta) in 1996 voor de Efteling en leverde het systeem daarna aan veel andere parken; het heet daarom vaak simpelweg “Vekoma Madhouse”. Phantasialands [Feng Ju Palace](/nl/parks/europe/germany/bruehl/phantasialand/feng-ju-palace), Europa-Parks [Cassandra’s Curse](/nl/parks/europe/germany/rust/europa-park/cassandras-curse) en Toverlands [Villa Fiasko](/nl/parks/europe/netherlands/sevenum/attractiepark-toverland/villa-fiasko) draaien hetzelfde systeem achter een ander verhaal.',
    relatedTermIds: ['dark-ride', 'vekoma', 'pre-show', 'animatronics'],
    aliases: ['Madhouses', 'Vekoma Madhouse', 'Spookschommel'],
    alternateNames: ['Spookschommel'],
  },
  {
    id: 'boat-ride',
    name: 'Bootattractie',
    shortDefinition:
      'Een darkride waarin bezoekers per boot door een waterkanaal reizen in plaats van over een spoor.',
    definition:
      'Een bootattractie voert gasten door de show in een watergoot, meestal geleid door een spoor onder water of door de kanaalwanden zelf. Water levert twee dingen die een spoor niet kan: capaciteit, omdat lange boten snel laden en dicht op elkaar rijden, en stilte, omdat er onder de gast geen aandrijving zit die de show overstemt. Daarom zijn veel van de grootste en langstlopende darkrides ter wereld bootattracties.\n\nVoorbeelden zijn [Pirates of the Caribbean](/nl/parks/north-america/united-states/anaheim/disneyland-park/pirates-of-the-caribbean), [“it’s a small world”](/nl/parks/north-america/united-states/anaheim/disneyland-park/its-a-small-world-holiday), Eftelings [Fata Morgana](/nl/parks/europe/netherlands/kaatsheuvel/efteling/fata-morgana) en [Piraten in Batavia](/nl/parks/europe/germany/rust/europa-park/pirates-in-batavia) in Europa-Park. Shanghai Disneylands Pirates of the Caribbean zet de boten op een magneetaandrijving zonder vast spoor, zodat ze kunnen draaien en zijwaarts bewegen.',
    relatedTermIds: ['dark-ride', 'animatronics', 'trackless-ride', 'log-flume', 'water-ride'],
    aliases: ['Bootattracties', 'Boat Ride'],
    alternateNames: ['Boat Ride'],
  },
  {
    id: 'shoot-the-chute',
    name: 'Shoot-the-Chute',
    shortDefinition:
      'Een waterattractie met grote boten rond één grote afdaling in een bak, die een muur van water over de splashbrug gooit.',
    definition:
      'Een shoot-the-chute trekt een brede, platbodemde boot met twintig of meer personen één lift op en laat hem via één steile goot in een ondiepe bak vallen. Bij de klap verplaatst de boot een enorme hoeveelheid water, en de plons is net zo goed bedoeld voor de toeschouwers op een brug als voor de inzittenden. Een wildwaterbaan verdeelt meerdere kleine afdalingen over een lang, kronkelend parcours; een shoot-the-chute is gebouwd rond één afdaling en één plons.\n\nVaak is een shoot-the-chute de grote attractie van een heel themagebied: [Jurassic Park River Adventure](/nl/parks/north-america/united-states/orlando/universal-islands-of-adventure/jurassic-park-river-adventure) in Islands of Adventure rijdt een volledige darkride vóór de afdaling van 26 meter, en [Atlantica SuperSplash](/nl/parks/europe/germany/rust/europa-park/atlantica-supersplash) in Europa-Park combineert het met een waterachtbaanparcours.',
    relatedTermIds: ['log-flume', 'water-ride', 'splashdown', 'water-coaster'],
    aliases: ['Shoot the Chutes', 'Grootbootbaan'],
    alternateNames: ['Grootbootbaan'],
  },
  {
    id: 'people-mover',
    name: 'People Mover',
    shortDefinition:
      'Een continu rijdende transportattractie die gasten langzaam door of boven een themagebied voert.',
    definition:
      'Een people mover is een langzame transportattractie met hoge capaciteit: een ononderbroken keten voertuigen op wandeltempo, vaak op een verhoogde baan, met een meebewegend perron zodat hij nooit hoeft te stoppen. In een park is hij vervoer tussen gebieden en tegelijk een rustige rondrit langs het gebied, vaak ook door het interieur van andere attracties.\n\nDe Tomorrowland Transit Authority PeopleMover in het [Magic Kingdom](/nl/parks/north-america/united-states/orlando/magic-kingdom-park/tomorrowland-transit-authority-peoplemover) is de bekendste overlevende en glijdt op zijn rondje dwars door het showgebouw van Space Mountain. De daar gebruikte lineaire inductieaandrijving is later gelicentieerd voor echt stadsvervoer. Universals Villain-Con Minion Blast past hetzelfde idee toe op een rolpad.',
    relatedTermIds: ['dark-ride', 'omnimover', 'observation-tower', 'walkthrough'],
    aliases: ['People Movers', 'Peoplemover'],
    alternateNames: ['Transitsysteem'],
  },
  {
    id: 'bumper-cars',
    name: 'Botsauto’s',
    shortDefinition:
      'Een flat ride waarin gasten kleine elektrische auto’s over een metalen vloer sturen en expres op elkaar botsen.',
    definition:
      'Botsauto’s rijden op een stalen vloer met een geleidend plafondraster: een stang op elke auto neemt bovenlangs stroom af en voert die via de vloer terug, zodat de voertuigen zonder accu en zonder spoor vrij bestuurd kunnen worden. Zware rubberen bumpers vangen de botsingen op waar de hele attractie om draait. Moderne installaties gebruiken steeds vaker stroomafname via de vloer of accu’s. Dan is er geen plafondraster nodig en kan het plafond worden aangekleed.\n\nHet is een van de oudste nog doorlopend geproduceerde attractietypes – de Lusse Auto-Skooter stamt uit de jaren twintig – en een van de weinige waarbij de bezoeker zelf bepaalt wat er gebeurt. Vrijwel elk groot park heeft er een, zoals Phantasialands [Bumper Klumpen](/nl/parks/europe/germany/bruehl/phantasialand/bumper-klumpen) en het Lada Autodrom in Europa-Park.',
    relatedTermIds: ['flat-ride', 'funhouse', 'carousel'],
    aliases: ['Botsauto', 'Bumper Cars', 'Autoscooter'],
    alternateNames: ['Bumper Cars', 'Autoscooter'],
  },
  {
    id: 'observation-tower',
    name: 'Uitkijktoren',
    shortDefinition:
      'Een torenattractie die een draaiende cabine langzaam omhoog brengt voor het uitzicht, zonder val.',
    definition:
      'Een uitkijktoren voert een beglaasde of open gondel langs een middenzuil omhoog, meestal draaiend zodat elke plek het volledige panorama krijgt, houdt bovenin stil en laat weer zakken. Mechanisch is het een naaste verwant van de valtoren, en de twee worden vaak verward. Het verschil zit in wat er bovenin gebeurt: een uitkijktoren zakt langzaam weer, een valtoren laat de gondel vallen.\n\nIn een park is een uitkijktoren vooral een herkenningspunt in de skyline, al vanaf de parkeerplaats te zien. De [Euro-Tower](/nl/parks/europe/germany/rust/europa-park/euro-tower) in Europa-Park staat er sinds 1983.',
    relatedTermIds: ['drop-tower', 'ferris-wheel', 'flat-ride', 'people-mover'],
    aliases: ['Uitkijktorens', 'Observation Tower', 'Gyro Tower'],
    alternateNames: ['Gyro Tower'],
  },
  {
    id: 'wdi',
    name: 'Walt Disney Imagineering',
    shortDefinition:
      'Disneys eigen ontwerp- en engineeringafdeling, de groep die elke Disney-attractie bedenkt, ontwerpt en bouwt.',
    definition:
      'Walt Disney Imagineering (WDI) is de divisie die Disneys parken ontwerpt en bouwt, van het masterplan van een gebied tot het mechaniek in één enkele figuur. Opgericht in 1952 als WED Enterprises om Disneyland te bouwen, is ze in de branche ongewoon doordat showontwerp, architectuur, ridetechniek en software onder één dak zitten.\n\nVeel van wat andere parken nu vanzelfsprekend vinden, komt van WDI: Audio-Animatronics, de Omnimover (een continu rijdende wagen die naar elke scène toe draait), het trackless ridesysteem dat debuteerde in [Pooh’s Hunny Hunt](/nl/parks/asia/japan/tokyo/tokyo-disneyland/poohs-hunny-hunt), en het buisvormige stalen achtbaanspoor dat Arrow in 1959 bouwde voor de [Matterhorn Bobsleds](/nl/parks/north-america/united-states/anaheim/disneyland-park/matterhorn-bobsleds) en waarvan elke stalen achtbaan sindsdien afstamt. Ook als een Disney-attractie door een andere fabrikant is gebouwd, heeft WDI de show eromheen vrijwel altijd zelf ontworpen.',
    relatedTermIds: ['omnimover', 'trackless-ride', 'animatronics', 'dark-ride', 'arrow-dynamics'],
    aliases: ['WDI', 'Imagineering', 'Imagineers', 'WED Enterprises'],
    alternateNames: ['WDI', 'Imagineering'],
  },
  {
    id: 'parade',
    name: 'Parade',
    shortDefinition:
      'Een stoet van praalwagens, dansers en personages die op vaste tijden een vaste route door het park aflegt.',
    definition:
      'Bij een parade trekken praalwagens, dansers en personages in kostuum langs een vaste route door het park, meestal een of twee keer per dag op tijden die in het parkprogramma staan. Kort voor de start zet het personeel de route af, en wie vooraan wil staan, zoekt ruim daarvoor een plek langs de stoeprand. Waar de route een hoofdpad kruist, gaat die oversteek dicht zolang de wagens voorbijkomen.\n\nDe Main Street Electrical Parade, met wagens vol kleine lampjes, reed voor het eerst in 1972 in Disneyland en later ook in Walt Disney World en Disneyland Paris. In Disneyland Paris rijdt sinds 2017 Disney Stars on Parade. Ook Europa-Park houdt op veel dagen van het seizoen een parade.\n\nEen parade overdag trekt zo’n half uur lang een grote menigte naar één deel van het park. De rijen bij attracties ver van de route zijn in die tijd vaak korter.',
    relatedTermIds: [
      'live-show',
      'character-meet-and-greet',
      'park-mascot',
      'nighttime-spectacular',
    ],
    aliases: ['Parades', 'dagparade', 'avondparade', 'lichtparade', 'Electrical Parade'],
  },
  {
    id: 'nighttime-spectacular',
    name: 'Avondshow',
    shortDefinition:
      'Een grote show na zonsondergang boven een meer, een kasteel of een gebouw, met vuurwerk, projecties of fonteinen.',
    definition:
      'Een avondshow is een grote voorstelling als het donker is, meestal het laatste onderdeel van het dagprogramma. Er wordt gewerkt met vuurwerk, projecties op gebouwen of op schermen van waternevel, fonteinen, lasers en vlammen, op een vooraf opgenomen soundtrack. Het publiek kijkt vanaf een vaste kijkplek of van overal voor het kasteel of het meer.\n\nFantasmic! opende in 1992 in Disneyland, met artiesten die live optreden op een eiland in de Rivers of America. World of Color in Disney California Adventure (2010) is een fonteinshow waarbij beelden op wanden van water worden geprojecteerd. De Efteling volgde in 2012 met Aquanura, gebouwd met WET Design, dat ongeveer 200 fonteinen gebruikt.\n\nVeel bezoekers vertrekken zodra het laatste effect voorbij is, dus de uitgangen en parkeerplaatsen zijn in de minuten daarna het volst.',
    relatedTermIds: ['live-show', 'parade', 'projection-mapping', 'hard-ticket-event'],
    aliases: [
      'Avondshows',
      'avondspektakel',
      'Nighttime Spectacular',
      'nighttime show',
      'vuurwerkshow',
      'vuurwerkshows',
      'watershow',
      'fonteinshow',
    ],
    alternateNames: ['Nighttime Spectacular', 'Vuurwerkshow'],
  },
  {
    id: '4d-cinema',
    name: '4D-bioscoop',
    shortDefinition:
      'Een 3D-film in een zaal waar de stoelen en de ruimte effecten toevoegen, zoals waterspetters, luchtstoten en bewegende stoelen.',
    definition:
      'Een 4D-bioscoop vertoont een 3D-film en voegt in de zaal effecten toe die bij het beeld horen: water uit de stoel voor je, luchtstoten langs je enkels, geuren, bellen, trillingen en korte schokken van de stoel. De vierde dimensie is een marketingnaam voor die effecten. De film loopt op een tijdcode die elk effect in elke voorstelling op hetzelfde moment laat afgaan.\n\nHoney, I Shrunk the Audience opende in 1994 in Epcot en gebruikte de meeste van deze trucs al. In 2003 volgde Shrek 4-D in Universal Studios Florida. Europa-Park draait zijn films in het Magic Cinema 4D.\n\nEen bewegingssimulator beweegt een hele cabine of een heel platform mee met de film. In een 4D-bioscoop blijven de stoelen in hun rijen staan en bewegen ze hooguit een paar centimeter. Er gaat telkens een volle zaal tegelijk naar binnen, zodat de rij per voorstelling in één keer korter wordt.',
    relatedTermIds: ['motion-simulator', 'flying-theater', 'pre-show', 'practical-effects'],
    aliases: ['4D-bioscopen', '4D bioscoop', '4D-film', '4D-films', '4D-theater', '4D cinema'],
  },
  {
    id: 'slc',
    name: 'Suspended Looping Coaster (SLC)',
    shortDefinition:
      'Het inverted-achtbaanmodel van Vekoma met een vaste baanindeling, sinds 1994 meer dan 40 keer gebouwd.',
    definition:
      'De Suspended Looping Coaster is een inverted-achtbaanmodel van de Nederlandse fabrikant Vekoma. De trein hangt onder de baan, de benen van de passagiers bungelen vrij, en op de lengte na is de baan in elk park dezelfde. De eerste, El Condor, opende in 1994 in Walibi Flevo, het huidige Walibi Holland. Er zijn er meer dan 40 gebouwd.\n\nDe standaardversie is 689 meter lang. Een kettinglift trekt de trein 33 meter omhoog, en na de afdaling volgen een roll-over, een sidewinder, een helix en een double inline twist, samen vijf inversies. Limit in Heide Park (1999), sinds 2023 Toxic Garden, is er een van.\n\nDe oorspronkelijke treinen hebben twee plaatsen naast elkaar en stugge schouderbeugels, waar het hoofd in de overgangen tegenaan slaat. Vekoma levert nu treinen met zachtere vestbeugels, en verschillende parken hebben die laten inbouwen.',
    relatedTermIds: [
      'vekoma',
      'inverted-coaster',
      'suspended-coaster',
      'shoulder-harness',
      'inversion',
    ],
    aliases: [
      'SLC',
      'SLC’s',
      'Suspended Looping Coaster',
      'Suspended Looping Coasters',
      'Vekoma SLC',
    ],
    alternateNames: ['Vekoma SLC'],
  },
  {
    id: 'water-park',
    name: 'Waterpark',
    shortDefinition:
      'Een park rond waterglijbanen, golfslagbaden en lazy rivers, waar bezoekers de dag in zwemkleding doorbrengen.',
    definition:
      'Een waterpark bestaat uit waterglijbanen, golfslagbaden, lazy rivers en spetterplekken voor kinderen, en bezoekers lopen er de hele dag in zwemkleding rond. Openluchtwaterparken zijn in de warme maanden open; overdekte, verwarmde waterparken het hele jaar. Veel waterparken liggen naast een pretpark en verkopen een eigen ticket.\n\nDisney opende Typhoon Lagoon in 1989 in Walt Disney World. Europa-Park opende Rulantica op 28 november 2019: een overdekte waterwereld in een hal van 32.600 vierkante meter, met 25 attracties bij de opening en een ticket los van dat van het pretpark.\n\nDe rij voor een glijbaan werkt anders dan die voor een attractie. Bezoekers dragen hun eigen band of mat de toren op, en de glijbaan laat pas de volgende glijder gaan als een lampje of een badmeester de vorige vrijgeeft. Eén glijbaan verwerkt daardoor veel minder mensen per uur dan een achtbaan die telkens een hele trein laadt.',
    relatedTermIds: ['water-ride', 'log-flume', 'seasonal-attraction', 'ride-capacity'],
    aliases: ['Waterparken', 'aquapark', 'aquaparken', 'waterwereld'],
  },
  {
    id: 'sky-ride',
    name: 'Kabelbaan',
    shortDefinition:
      'Een stoeltjeslift of gondelbaan die bezoekers aan een kabel boven het park vervoert, vaak van het ene deel naar het andere.',
    definition:
      'Een kabelbaan vervoert bezoekers in stoeltjes of kleine cabines die aan een rondlopende staalkabel hangen, gespannen over masten boven de paden. De meeste verbinden twee stations in verschillende delen van het park, enkele reis of heen en terug, en het uitzicht van bovenaf hoort bij de rit.\n\nDe Skyway van Disneyland, gebouwd door het Zwitserse Von Roll, opende in 1956 tussen Fantasyland en Tomorrowland en liep dwars door de Matterhorn. Hij sloot in 1994, nadat er spanningsscheuren waren gevonden in de steunen binnen in de berg. Walt Disney World opende in 2019 de Skyliner, een gondelbaan die resorthotels verbindt met Epcot en Disney’s Hollywood Studios.\n\nEen kabelbaan stopt bij harde wind en onweer, eerder dan de meeste andere attracties.',
    relatedTermIds: ['monorail', 'park-railway', 'people-mover', 'observation-tower'],
    aliases: [
      'Kabelbanen',
      'stoeltjeslift',
      'stoeltjesliften',
      'gondelbaan',
      'gondelbanen',
      'sky ride',
      'skyride',
    ],
    alternateNames: ['Stoeltjeslift', 'Gondelbaan'],
  },
  {
    id: 'park-railway',
    name: 'Parktrein',
    shortDefinition:
      'Een trein die over rails rond het park of tussen de themagebieden rijdt, meestal als rustige rondrit met stations.',
    definition:
      'Een parktrein rijdt over smalspoor langs de rand van het park of tussen de themagebieden, met een of meer stations onderweg. Sommige treinen worden getrokken door een stoomlocomotief, andere door een diesel- of elektrische loc die erop lijkt.\n\nDe Disneyland Railroad rijdt al sinds de opening van het park in 1955 rond Disneyland. De stoomtrein van de Efteling rijdt sinds maart 1969 en gaat inmiddels rond het hele park, met twee stations. De Panoramabahn van Europa-Park hoorde in 1975 bij de eerste attracties van het park.\n\nEen trein neemt een heel perron bezoekers tegelijk mee en rijdt volgens een dienstregeling, dus de wachttijd hangt meer af van de tijd tussen twee vertrekken dan van de lengte van de rij.',
    relatedTermIds: ['monorail', 'sky-ride', 'people-mover', 'ride-capacity'],
    aliases: ['Parktreinen', 'stoomtrein', 'parkspoorlijn', 'park railway'],
  },
  {
    id: 'monorail',
    name: 'Monorail',
    shortDefinition:
      'Een trein op één enkele balk, meestal boven de grond, die in parken dient als vervoer en als rustige rondrit.',
    definition:
      'Een monorail rijdt over één balk in plaats van over twee rails. Bij het gangbare zadeltype zit de trein op rubberbanden schrijlings over een balk van beton of staal; bij het hangende type hangt hij eronder. De balk staat op pijlers, dus de lijn loopt over paden en attracties heen en neemt weinig grond in beslag.\n\nDe Disneyland Monorail opende op 14 juni 1959, gebouwd met hulp van het Duitse bedrijf Alweg, en was de eerste monorail in de Verenigde Staten met een dagelijkse dienst. In Walt Disney World rijdt de monorail sinds 1971 naar het Magic Kingdom en sinds 1982 naar Epcot, met bezoekers van de resorthotels en de grote parkeerplaats. Europa-Park opende in 1995 zijn EP-Express, een monorail van Von Roll; een van de stations ligt bij de hotels van het park.',
    relatedTermIds: ['people-mover', 'park-railway', 'sky-ride', 'wdi'],
    aliases: ['Monorails', 'monorailtrein'],
  },
  {
    id: 'park-mascot',
    name: 'Parkmascotte',
    shortDefinition:
      'Een personage dat een park als eigen gezicht bedenkt en inzet in kostuum, op borden, in shows en op merchandise.',
    definition:
      'Een parkmascotte is een personage dat van het park zelf is en dat het park als gezicht gebruikt: in kostuum voor foto’s en meet-and-greets, in shows en parades, op wegwijzers en plattegronden en als knuffel in de winkels. Parken zonder filmlicenties zetten hun mascotte in op de plekken waar Disney Mickey Mouse inzet.\n\nIn Europa-Park zijn de mascottes Ed Euromaus en Edda Euromausi, twee muizen die ook in de animatiefilm Grand Prix of Europe spelen. Waterwereld Rulantica voegde Snorri toe, een octopus met zes armen in plaats van acht, die in het pretpark een eigen dark ride heeft, Snorri Touren. De mascotte van de Efteling is tovernar Pardoes, meestal samen met prinses Pardijn.\n\nEen mascotte verschijnt op vaste tijden, die in het parkprogramma of bij de ontmoetingsplek staan.',
    relatedTermIds: ['character-meet-and-greet', 'parade', 'live-show', 'merchandise'],
    aliases: ['Parkmascottes', 'mascotte', 'mascottes'],
  },
  {
    id: 'teacups',
    name: 'Theekopjes',
    shortDefinition:
      'Een flat ride met grote kopjes op draaischijven, waarin de passagiers aan een wiel in het midden draaien om het kopje te laten tollen.',
    definition:
      'De theekopjes zijn een flat ride met reusachtige kopjes, elk voor een gezin, op kleine draaischijven die op een grotere draaiende vloer staan. De vloer draait de ene kant op en de draaischijven de andere, en in het midden van elk kopje zit een wiel waarmee de passagiers het kopje om zijn eigen as laten draaien. Hoe hard het tolt, hangt af van hoe hard ze aan het wiel draaien, dus in het ene kopje is de rit rustig en in het volgende wild.\n\nMad Tea Party opende in juli 1955 samen met Disneyland, in het thema van de theepartij uit Alice in Wonderland. Karl Bacon en Ed Morgan van Arrow Development bouwden de attractie. In de eerste maanden laste de ploeg elke ochtend scheuren dicht, tot ze later dat jaar opnieuw werd ontworpen.\n\nOok D. H. Morgan Manufacturing, opgericht door Ed Morgans zoon Dana, bouwde theekopjes.',
    relatedTermIds: ['flat-ride', 'carousel', 'arrow-dynamics', 'morgan'],
    aliases: ['Teacups', 'tea cups', 'theekopjesattractie', 'draaiende theekopjes', 'kopjesmolen'],
  },
  {
    id: 'lockers',
    name: 'Kluisjes',
    shortDefinition:
      'Kluisjes bij de ingang van een attractie, waarin bezoekers tassen en losse spullen achterlaten die niet mee mogen in de rit.',
    definition:
      'Bij de ingang van veel achtbanen en sommige waterattracties staan kluisjes voor alles wat een passagier tijdens de rit niet kan vasthouden: tassen, petten, telefoons, sleutels, losse brillen. Wat in een achtbaan uit een hand glipt, valt op de baan, op andere bezoekers of in het gezicht van iemand verderop in de trein. Ligt er iets op de baan, dan staat de attractie stil tot het gevonden is.\n\nParken bepalen de regels per attractie. In Universal Orlando mogen bij Jurassic World VelociCoaster en The Incredible Hulk Coaster helemaal geen losse spullen mee, en passagiers lopen voor het instappen door een metaaldetector. De kluisjes zijn daar gratis voor een periode die afhangt van de actuele wachttijd en kosten daarna geld. Bij andere attracties mogen kleine spullen in een dichte zak blijven.\n\nOp een drukke dag staan bezoekers eerst in de rij voor de kluisjes en pas daarna in de rij voor de attractie.',
    relatedTermIds: ['queue-line', 'standby-queue', 'downtime', 'e-stop'],
    aliases: ['kluisje', 'Lockers', 'locker', 'attractiekluisjes'],
  },
  {
    id: 'ptc',
    name: 'Philadelphia Toboggan Coasters (PTC)',
    shortDefinition:
      'Amerikaans bedrijf uit 1904 dat houten achtbanen en carrousels bouwde en nu treinen voor houten achtbanen maakt.',
    definition:
      'Philadelphia Toboggan Coasters werd in 1904 door Henry B. Auchy en Chester Albright opgericht als de Philadelphia Toboggan Company. Het bouwde tot 1934 carrousels en tot in de jaren zeventig houten achtbanen, ontworpen door onder anderen John A. Miller, Herbert Schmeck en John C. Allen. Toen Allen in 1976 met pensioen ging, stopte het bedrijf met het ontwerpen van achtbanen. Sindsdien bouwt het treinen, die ook op houten achtbanen van andere ontwerpers rijden, waaronder The Beast in Kings Island (1979).\n\nVerschillende eigen achtbanen rijden nog. Comet in Hersheypark (1946) en Phoenix in Knoebels zijn allebei ontwerpen van Schmeck; Phoenix reed vanaf eind jaren veertig als Rocket in Playland Park in San Antonio en ging in 1985 in Knoebels weer open. Blue Streak in Cedar Point (1964) is ontworpen door Frank Hoover en John C. Allen.\n\nTom Rebbie en Bill Dauphinee kochten het bedrijf in 1991. Het is gevestigd in Hatfield, Pennsylvania.',
    relatedTermIds: ['wooden-coaster', 'carousel', 'cci', 'gci', 'ride-cart'],
    aliases: [
      'PTC',
      'Philadelphia Toboggan Coasters',
      'Philadelphia Toboggan Company',
      'Philadelphia Toboggan Coasters, Inc.',
      'PTC-treinen',
    ],
    alternateNames: ['Philadelphia Toboggan Company'],
  },
  {
    id: 'cci',
    name: 'Custom Coasters International (CCI)',
    shortDefinition:
      'Amerikaanse bouwer van houten achtbanen uit Ohio, die tussen 1991 en 2002 34 achtbanen bouwde.',
    definition:
      'Custom Coasters International was een bouwer van houten achtbanen in West Chester, Ohio, in 1991 opgericht door Denise Dinn-Larrick, haar broer Jeff Dinn en haar man Randy Larrick. Denise is de dochter van Charles Dinn, die de bouw van The Beast in Kings Island leidde. In elf jaar bouwde het bedrijf 34 houten achtbanen.\n\nIn Europa bouwde CCI Megafobia in Oakwood in Wales (1996) en de twee houten achtbanen van PortAventura, Stampida en Tomahawk (1997). In de Verenigde Staten openden in 1998 GhostRider in Knott’s Berry Farm en Shivering Timbers in Michigan’s Adventure, en in 2000 Boulder Dash in Lake Compounce.\n\nCCI ging in 2002 failliet terwijl de New Mexico Rattler nog in aanbouw was, en het park maakte de baan af met oud-medewerkers van CCI. Twee van de huidige bouwers van houten achtbanen komen eruit voort: Clair Hain Jr. en Mike Boodley richtten in 1994 Great Coasters International op, en Larry Bill, Chad Miller, Korey Kiepert en Michael Graham begonnen in 2002 The Gravity Group.',
    relatedTermIds: ['wooden-coaster', 'gci', 'gravity-group', 'ptc'],
    aliases: [
      'CCI',
      'Custom Coasters International',
      'Custom Coasters International, Inc.',
      'Custom Coasters Incorporated',
    ],
  },
  {
    id: 'morgan',
    name: 'D. H. Morgan Manufacturing',
    shortDefinition:
      'Californische bouwer van stalen achtbanen, treinen voor houten achtbanen en familieattracties, in 2001 overgenomen door Chance.',
    definition:
      'D. H. Morgan Manufacturing werd in 1983 door Dana Morgan opgericht in La Selva Beach, Californië. Zijn vader, Ed Morgan, was een van de oprichters van Arrow Development. De eerste opdracht was een set nieuwe treinen voor de Giant Dipper op de Santa Cruz Beach Boardwalk; daarna volgden treinen voor andere houten achtbanen, carrousels en familieattracties zoals theekopjes.\n\nIn de jaren negentig bouwde Morgan grote stalen achtbanen met hoge afdalingen en lange airtime hills: Wild Thing in Valleyfair (1996), Steel Force in Dorney Park (1997), Mamba in Worlds of Fun (1998) en Steel Eel in SeaWorld San Antonio (1999). Steel Dragon 2000 in Nagashima Spa Land (2000) is de langste achtbaan ter wereld. Phantom’s Revenge in Kennywood (2001) gebruikt de lifthill en het station van Arrows Steel Phantom opnieuw.\n\nIn juni 2001 kocht Michael Chance het bedrijf en vormde Chance Morgan, dat later weer Chance Rides ging heten.',
    relatedTermIds: ['chance-rides', 'arrow-dynamics', 'hyper-coaster', 'airtime-hill'],
    aliases: [
      'D. H. Morgan Manufacturing',
      'D.H. Morgan Manufacturing',
      'D. H. Morgan',
      'D.H. Morgan',
      'Morgan Manufacturing',
    ],
    alternateNames: ['Morgan Manufacturing'],
  },
  {
    id: 'reverchon',
    name: 'Reverchon',
    shortDefinition:
      'Franse fabrikant van spinning wild mouse-achtbanen, wildwaterbanen en botsauto’s, gevestigd bij Fontainebleau.',
    definition:
      'Reverchon Industries is een Franse fabrikant van attracties. Het bedrijf gaat terug op Gaston Reverchon, een carrosseriebouwer die eind jaren twintig bij Parijs een werkplaats opende en begon met botsauto’s op basis van autocarrosserieën. De productie verhuisde later naar Samois-sur-Seine, bij Fontainebleau. De eerste wildwaterbaan van Reverchon opende in 1976 in Bagatelle in Berck, de eerste achtbaan in 1990 in Le Pal.\n\nHet bekendste model is de spinning wild mouse die als Crazy Mouse wordt verkocht: wagens voor vier personen die vrij ronddraaien in de haarspeldbochten van een compacte stalen baan. De eerste opende in 1997 in Dinosaur Beach in Wildwood, New Jersey. Dizzy Mouse in het Prater in Wenen (1998) en Flagermusen in Fårup Sommerland (2001) volgden, en het bedrijf heeft meer dan 80 achtbanen gebouwd.\n\nVan 2003 tot 2005 bouwde en verkocht Zamperla attracties van Reverchon onder licentie. Daarna bleef Zamperla een eigen spinning coaster verkopen.',
    relatedTermIds: ['wild-mouse', 'spinning-coaster', 'log-flume', 'bumper-cars', 'zamperla'],
    aliases: ['Reverchon Industries', 'Reverchon Crazy Mouse', 'Crazy Mouse'],
    alternateNames: ['Reverchon Industries'],
  },
  {
    id: 'brogent',
    name: 'Brogent Technologies',
    shortDefinition:
      'Taiwanese fabrikant van het i-Ride-flyingtheatersysteem dat de meeste flying theaters buiten Disney gebruiken.',
    definition:
      'Brogent Technologies, in 2001 opgericht in Kaohsiung, bouwt het flying theater i-Ride, een hangende zitgondel die uitzwenkt voor een groot bolvormig scherm terwijl je voeten vrij bungelen, gesynchroniseerd met wind-, geur- en misteffecten. Disney bracht het format met Soarin’; Brogent maakte er een product van dat parken kunnen kopen. De i-Ride draait inmiddels op elk continent.\n\nEuropa’s bekendste installatie is [Voletarium](/nl/parks/europe/germany/rust/europa-park/voletarium) in Europa-Park, dat over de landmarks van het continent vliegt en voor de capaciteit twee zalen parallel draait. Daarnaast bouwt het bedrijf kleinere mediagebaseerde ridesystemen en immersieve koepelattracties.',
    relatedTermIds: ['flying-theater', 'motion-simulator', 'projection-mapping', 'pre-show'],
    aliases: ['Brogent', 'i-Ride'],
    alternateNames: ['Brogent'],
  },
  {
    id: 'quick-pass',
    name: 'QUICK Pass',
    shortDefinition: 'Het betaalde voorrangsproduct van Phantasialand, per attractie gekocht.',
    definition:
      'De QUICK Pass is de betaalde manier om in Phantasialand de wachtrij voorbij te gaan. Anders dan in de meeste parken koop je hem per attractie en niet per dag, voor banen als Taron, Black Mamba, Chiapas, Talocan en Maus au Chocolat.\n\nJe koopt hem alleen in het park, bij de gastenservice in het themagebied Berlin, en hij geldt alleen op de datum die erop staat. De prijs per attractie ligt vast en beweegt niet mee met de drukte. Daarnaast is er de Quick Pass Ultimate: één keer elke Quick Pass-attractie en één keer F.L.Y.\n\nOok bij de QUICK Pass-ingang staat een rij, alleen een veel kortere.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time', 'fastpass'],
    aliases: ['Quick Pass', 'QuickPass'],
  },
  {
    id: 'virtual-line',
    name: 'VirtualLine',
    shortDefinition:
      'De gratis virtuele wachtrij van Europa-Park, te reserveren in de app van het park.',
    definition:
      'VirtualLine is de gratis reserveringsdienst van Europa-Park: in de Europa-Park & Rulantica-app boek je een tijdslot voor een geselecteerde attractie en ga je binnen dat slot via een verkorte ingang naar binnen. Tot die tijd kun je andere attracties doen, naar een show gaan of eten.\n\nDe dienst geldt voor blue fire Megacoaster, Euro-Mir, Piraten in Batavia, Poseidon, Voletarium, Voltron Nevera powered by Rimac en WODAN – Timburcoaster. Het aantal plaatsen per dag is beperkt.\n\nAnders dan een betaalde voorrangspas kost VirtualLine niets; de wachttijd breng je elders in het park door.',
    relatedTermIds: ['virtual-queue', 'return-time', 'boarding-group', 'wait-time'],
    aliases: ['Virtual Line'],
  },
  {
    id: 'fast-lane',
    name: 'Fast Lane',
    shortDefinition: 'De betaalde voorrangspas, meestal voor een hele bezoekdag gekocht.',
    definition:
      'Fast Lane heet het voorrangsproduct in veel parken van de Six Flags- en Walibi-familie, van Cedar Point tot Walibi Holland. Je koopt hem voor het bezoek en niet voor één rit: een polsbandje of digitaal ticket opent de hele dag de Fast Lane-ingang van de betrokken attracties.\n\nMeestal zijn er meerdere niveaus; bij Walibi Holland zijn dat Gold (onbeperkt, circa 90 % minder wachttijd), Silver, Bronze en losse shots voor één of vier ritten. Welke banen meedoen bepaalt het park; halloweenhuizen vallen er vaak buiten.\n\nOmdat de prijs voor de dag geldt en niet per baan, toont park.fan bij die banen een vanaf-prijs.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time', 'single-rider'],
    aliases: ['Fastlane'],
  },
  {
    id: 'speedy-pass',
    name: 'Speedy Pass',
    shortDefinition: 'De betaalde virtuele wachtrij van Movie Park Germany.',
    definition:
      'De Speedy Pass is het voorrangsproduct van Movie Park Germany. Hij werkt als virtuele wachtrij: je reserveert met je telefoon een rit in een van de betrokken attracties en gaat op de gereserveerde tijd via een eigen ingang naar binnen.\n\nEr zijn meerdere niveaus, van Speedy Pass One Ride voor één attractie tot Gold en Platinum, die vrijwel alles dekken. Hij geldt voor meer dan 25 attracties; enkele huizen en speciale attracties zijn uitgesloten.',
    relatedTermIds: ['virtual-queue', 'express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Speedypass'],
  },
  {
    id: 'fastrack',
    name: 'Fastrack',
    shortDefinition: 'Het betaalde voorrangsticket in de Merlin-parken, zoals Alton Towers.',
    definition:
      'Fastrack is de naam waaronder de Britse Merlin-parken – Alton Towers, Thorpe Park, Chessington – hun toegang langs de wachtrij verkopen. Hij is er per rit of als pakket: Bronze voor een handvol gekozen banen, Silver voor één rit per betrokken attractie, Gold voor onbeperkt gebruik.\n\nFastrack is altijd een extra ticket: entree tot het park zit er niet bij.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Fast Track', 'Fasttrack'],
  },
  {
    id: 'premier-access',
    name: 'Disney Premier Access',
    shortDefinition: 'Disneys betaalde voorrang buiten de VS, per attractie te boeken.',
    definition:
      'Disney Premier Access is wat in de Amerikaanse parken Lightning Lane heet: betaalde toegang langs de wachtrij, in Disneyland Paris en Tokyo Disney Resort.\n\nPremier Access One koop je per attractie, meestal op de dag zelf via de app. De prijs hangt af van de datum en de attractie en ligt bij nieuwe attracties duidelijk hoger. Premier Access Ultimate dekt elke deelnemende attractie één keer.\n\nOmdat de prijs elke dag opnieuw wordt bepaald, staat er op park.fan bij die banen geen vaste prijs.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Premier Access'],
  },
  {
    id: 'headliner',
    name: 'Headliner',
    shortDefinition:
      'De attractie waarvoor je het park überhaupt uitkiest, meestal de nieuwste of grootste baan.',
    definition:
      "Een headliner is de attractie waarvoor een park op een reislijst belandt: de nieuwste achtbaan, de duurste dark ride, dat wat op de poster staat. Parken bouwen er ongeveer eens in de vijf tot tien jaar een, en in het openingsseizoen trekt hij een aanzienlijk deel van alle bezoekers naar zich toe.\n\nVoor het plannen van een dag is het de belangrijkste post. Een headliner verzamelt de langste rij van het park en houdt die vaak van opening tot avond vast, terwijl de rest van het terrein 's ochtends nog leeg is. Daarom staat hij vooraan in bijna elk advies: eerst de headliner, dan de rest. De uitzondering is een virtuele wachtrij, die hem toch al op een tijdslot vastzet.\n\npark.fan markeert headliners in de attractielijst van een park en zet ze hoger in de ranglijst op wachttijd. Of een baan een headliner is, legt park.fan met de hand vast. Het volgt niet uit de lengte van de rij, want een baan kan op één dag een lange rij hebben zonder dat iemand ervoor afreist.",
    aliases: ['Hoofdattractie', 'E-Ticket'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
  {
    id: 'scare-maze',
    name: 'Halloween-maze',
    shortDefinition:
      'Een rondgang voor een Halloween-evenement, waarin acteurs in kostuum tevoorschijn springen om bezoekers te laten schrikken.',
    definition:
      'Een Halloween-maze is een rondgang die een park voor zijn Halloweenseizoen bouwt of opnieuw aankleedt. Bezoekers lopen er in kleine groepjes doorheen, langs decors, rook en geluidseffecten, terwijl acteurs in kostuum en grime vanuit schuilplekken op hen afspringen. De meeste zijn alleen ’s avonds open, en voor veel geldt een minimumleeftijd.\n\nUniversal Studios Florida opende zijn eerste, Dungeon of Terror, in 1991 voor Fright Nights, het evenement dat een jaar later Halloween Horror Nights ging heten. In Europa vormen ze de kern van Traumatica in Europa-Park en van het Halloweenseizoen in PortAventura, waar ze pasajes del terror heten.\n\npark.fan markeert een maze met de badge Halloween-maze en zet hem op de parkpagina in een eigen sectie, Halloween-mazes, onder de attracties.',
    relatedTermIds: ['halloween-event', 'scare-zone', 'walkthrough', 'hard-ticket-event'],
    aliases: [
      'Halloween-mazes',
      'Halloween maze',
      'Halloween mazes',
      'scare maze',
      'scare mazes',
      'horrormaze',
      'horrormazes',
      'haunted house',
      'haunted houses',
    ],
    alternateNames: ['Scare Maze', 'Haunted House'],
  },
  {
    id: 'halloween-event',
    name: 'Halloween-evenement',
    shortDefinition:
      'De weken rond 31 oktober waarin een park zich voor Halloween aankleedt en shows, mazes en late openingstijden toevoegt.',
    definition:
      'Een Halloween-evenement is het programma van een park in de weken rond 31 oktober. Overdag gaat het om pompoenen, versiering en shows voor gezinnen. ’s Avonds zetten veel parken er Halloween-mazes en scare zones voor volwassenen bij, soms op een apart ticket en met een minimumleeftijd.\n\nHet oudste van de grote evenementen is Knott’s Scary Farm in Californië, dat in 1973 begon als Halloween Haunt van drie avonden. Universal volgde in 1991 met Fright Nights, een jaar later omgedoopt tot Halloween Horror Nights. Europa-Park begon in 2007 met zijn horroravonden en noemt ze sinds 2017 Traumatica.\n\nDe Halloweenweekenden horen bij de drukste dagen van de herfst in een park, nog meer waar ze samenvallen met de herfstvakantie. De drukte-prognose van park.fan houdt rekening met de evenementen van een park, en Halloween is daar een van.',
    relatedTermIds: [
      'scare-maze',
      'scare-zone',
      'hard-ticket-event',
      'crowd-calendar',
      'school-holiday',
    ],
    aliases: [
      'Halloween-evenementen',
      'Halloweenevenement',
      'Halloweenseizoen',
      'Halloween-seizoen',
      'Halloweenavonden',
    ],
  },
  {
    id: 'scare-zone',
    name: 'Scare zone',
    shortDefinition:
      'Een deel van het park in de open lucht waar acteurs tijdens een Halloween-evenement tussen de bezoekers rondlopen om ze te laten schrikken.',
    definition:
      'Een scare zone is een straat of een plein in het park, aangekleed voor het Halloween-evenement en bevolkt door acteurs die bezoekers laten schrikken. Er is geen ingang en geen rij: bezoekers lopen er op weg door het park doorheen, en de acteurs kiezen hun slachtoffers uit de menigte die voorbijkomt.\n\nScare zones horen bij het avondgedeelte van een evenement en beginnen meestal als het gaat schemeren. Halloween Horror Nights in Universal Studios Florida richt er elk jaar een paar in op de straten tussen de huizen, en Traumatica in Europa-Park zet ze langs de paden tussen de mazes.',
    relatedTermIds: ['scare-maze', 'halloween-event', 'hard-ticket-event'],
    aliases: ['scare zones', 'scarezone', 'scarezones', 'schrikzone', 'schrikzones'],
  },
  {
    id: 'retired-attraction',
    name: 'Verdwenen attractie',
    shortDefinition:
      'Een attractie die een park voorgoed heeft gesloten, of ze nu wordt gesloopt, verkocht of blijft staan.',
    definition:
      'Een verdwenen attractie is een attractie die een park voorgoed uit bedrijf heeft genomen. Sommige worden gesloopt om plaats te maken voor iets nieuws, sommige worden aan een ander park verkocht, en sommige staan jarenlang ongebruikt. Kingda Ka in Six Flags Great Adventure, met 139 meter destijds de hoogste achtbaan ter wereld, reed op 10 november 2024 voor het laatst en werd op 28 februari 2025 opgeblazen.\n\nOp park.fan houdt een attractie die voorgoed dicht is haar pagina, met de status Definitief gesloten en de datum van sluiting. De pagina toont nog de wachttijden die voor de sluiting zijn gemeten, het baanprofiel en de artikelen over de attractie, en linkt naar het nieuwsbericht van park.fan over de sluiting als dat er is; een live wachttijd heeft ze niet meer. Op de parkpagina verhuist de attractie van het raster met attracties naar de aparte lijst Definitief gesloten attracties, en een jaar na de sluiting verdwijnt ze ook daaruit.',
    relatedTermIds: ['refurbishment', 'downtime', 'seasonal-attraction', 'wait-time'],
    aliases: [
      'verdwenen attracties',
      'definitief gesloten',
      'definitief gesloten attractie',
      'definitief gesloten attracties',
      'gesloopte attractie',
      'gesloopte attracties',
      'verdwenen achtbaan',
      'verdwenen achtbanen',
    ],
    alternateNames: ['Definitief gesloten attractie'],
  },
  {
    id: 'weather-closure',
    name: 'Sluiting door weer',
    shortDefinition:
      'Een attractie die stilgaat bij bliksem, harde wind of zware regen en weer opengaat als het weer voorbij is.',
    definition:
      'Bij een sluiting door weer staat een attractie stil zolang het weer het onveilig maakt om te rijden. Achtbanen en valtorens in de open lucht sluiten zodra er binnen een vastgestelde afstand van het park bliksem wordt gemeld. Windstoten boven een grens die de fabrikant opgeeft, leggen hoge attracties en attracties met een groot oppervlak stil, en sommige launch coasters sluiten ook bij zware regen. Overdekte attracties blijven draaien, en hun rijen groeien terwijl de attracties buiten stilstaan.\n\nIn de live data van park.fan staat zo’n attractie op Storing of Gesloten, zoals het park het doorgeeft. Op de parkpagina staat ook het weer: een verwachting voor de komende uren waarschuwt voor regen, onweer, hagel en windstoten, met een schatting van wanneer elk ervan begint en stopt, en officiële weerwaarschuwingen verschijnen met hun ernst en hun bron.',
    relatedTermIds: ['downtime', 'wait-time', 'indoor-coaster', 'dark-ride'],
    aliases: [
      'sluitingen door weer',
      'gesloten door het weer',
      'gesloten vanwege het weer',
      'gesloten wegens het weer',
      'weersluiting',
      'sluiting door onweer',
      'sluiting door wind',
    ],
  },
  {
    id: 'typical-wait',
    name: 'Typische wachttijd',
    shortDefinition:
      'De mediaan van de gemeten wachttijden van een attractie: de helft van de metingen was korter, de helft langer.',
    definition:
      'De typische wachttijd is het getal dat park.fan toont als de normale rij bij een attractie. Het is de mediaan van de wachttijden die in de getoonde periode zijn gemeten: de helft van de metingen lag eronder, de helft erboven. Een handvol extreme dagen verschuift een mediaan nauwelijks, terwijl ze een gemiddelde omhoogtrekken, dus de mediaan blijft dicht bij wat een bezoeker op een gewone dag aantreft.\n\nOp de pagina van een attractie staat hij als Normaal, voor doordeweekse dagen en voor het weekend, naast de piekwachttijd, die er als Druk staat. In de statistieken van een park heet hij Typisch (mediaan). De grafiek per uur tekent de mediaan van eerdere dagen als lijn en kleurt de band van het 25e tot het 90e percentiel in als gebruikelijk bereik. Elk getal is afgerond op vijf minuten, de stap waarin parken hun wachttijden tonen; alleen de walk-on van 13 minuten bij Disney blijft staan zoals hij is aangegeven.',
    relatedTermIds: ['peak-wait', 'wait-time', 'posted-wait-time', 'crowd-level', 'walk-on'],
    aliases: [
      'typische wachttijden',
      'mediane wachttijd',
      'mediane wachttijden',
      'mediaanwachttijd',
      'P50',
    ],
  },
  {
    id: 'peak-wait',
    name: 'Piekwachttijd',
    shortDefinition:
      'Het 90e percentiel van de gemeten wachttijden van een attractie: maar één meting op de tien kwam erboven.',
    definition:
      'De piekwachttijd is het getal van park.fan voor een volle dag bij een attractie. Het is het 90e percentiel van de gemeten wachttijden: negen op de tien metingen lagen op of onder dit getal, één op de tien erboven. Hij ligt boven de typische wachttijd en onder het record. Een maximum wordt bepaald door één enkele dag, een storing of een zaterdag in de vakantie, terwijl het 90e percentiel pas wordt gehaald als een tiende van alle metingen zo hoog komt.\n\nOp de pagina van een attractie staat de piekwachttijd als Druk naast Normaal, voor doordeweekse dagen en voor het weekend, en het is ook het getal boven de balk van elke weekdag. In de statistieken van een park heet hij Piek (P90), naast de mediaan. Het record staat er apart bij, met de datum.',
    relatedTermIds: ['typical-wait', 'wait-time', 'peak-day', 'crowd-level'],
    aliases: ['piekwachttijden', 'P90', '90e percentiel'],
  },
  {
    id: 'public-holiday',
    name: 'Feestdag',
    shortDefinition:
      'Een wettelijke vrije dag waarop scholen en de meeste bedrijven dicht zijn en parken vollopen.',
    definition:
      'Een feestdag is een wettelijk vastgelegde vrije dag, voor het hele land of voor één deelstaat of regio. In Duitsland zijn tweede paasdag, Hemelvaartsdag en tweede pinksterdag landelijke feestdagen. Sacramentsdag (Fronleichnam) is er alleen in een deel van de deelstaten een feestdag, waaronder Baden-Württemberg en Noordrijn-Westfalen, waar Europa-Park en Phantasialand liggen. Een park bij een grens krijgt ook met de kalender van de buren te maken: Hemelvaartsdag is daarnaast in Frankrijk, Nederland, België en Zwitserland een feestdag.\n\nDe drukte-prognose van park.fan leest de feestdagen van de landen waar de parken liggen. De druktekalender markeert ze en geeft aan of het een nationale of een regionale feestdag is, en in de legenda staat dat het op zulke dagen meestal veel drukker is.',
    relatedTermIds: [
      'bridge-day',
      'school-holiday',
      'crowd-calendar',
      'crowd-forecast',
      'peak-day',
    ],
    aliases: [
      'feestdagen',
      'officiële feestdag',
      'officiële feestdagen',
      'nationale feestdag',
      'nationale feestdagen',
      'regionale feestdag',
      'wettelijke feestdag',
    ],
  },
  {
    id: 'bridge-day',
    name: 'Brugdag',
    shortDefinition: 'Een werkdag tussen een feestdag en het weekend die veel mensen vrij nemen.',
    definition:
      'Een brugdag is een werkdag die tussen een feestdag en een weekend in valt: een vrijdag na een feestdag op donderdag, of een maandag voor een feestdag op dinsdag. Wie die ene dag vrij neemt, heeft vier dagen vrij. In Duitsland is de bekendste de vrijdag na Hemelvaartsdag, en in de deelstaten met Sacramentsdag volgt de vrijdag daarna. Duitsers spreken van een Brückentag, Fransen van faire le pont.\n\nVoor een park gedraagt een brugdag zich als een deel van een lang weekend. De drukte-prognose van park.fan telt brugdagen als een aparte factor, en de druktekalender en de wachttijdgeschiedenis van een attractie geven ze aan als Brugdag.',
    relatedTermIds: ['public-holiday', 'school-holiday', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['brugdagen', 'Brückentag', 'Brückentage'],
  },
  {
    id: 'dynamic-pricing',
    name: 'Dynamische prijzen',
    shortDefinition: 'Ticketprijzen die meebewegen met de datum van het bezoek en met de vraag.',
    definition:
      'Bij dynamische prijzen vraagt een park voor elke dag een andere ticketprijs. Een gedateerd ticket is alleen geldig op de dag waarvoor het is gekocht, en kost op een rustige doordeweekse dag minder dan op een zaterdag in de vakantie. De prijs van een bepaalde dag kan ook nog veranderen naarmate die dag uitverkoopt. Een ongedateerd ticket is op elke dag binnen de geldigheid te gebruiken en heeft een vaste prijs.\n\nDisneyland Paris verkoopt gedateerde tickets binnen een vaste bandbreedte: in 2026 kostte een dagticket voor één park op de rustigste data vanaf € 56 en op de drukste meer dan € 100. Het ongedateerde ticket is duurder dan de meeste gedateerde dagen; daar staat tegenover dat de datum open blijft.',
    relatedTermIds: ['crowd-calendar', 'off-peak', 'peak-day', 'season-pass', 'evening-ticket'],
    aliases: [
      'dynamische prijs',
      'dynamische prijsstelling',
      'gedateerd ticket',
      'gedateerde tickets',
      'ongedateerd ticket',
      'ongedateerde tickets',
      'dynamic pricing',
    ],
  },
  {
    id: 'evening-ticket',
    name: 'Avondticket',
    shortDefinition: 'Een goedkoper ticket voor de laatste uren van een parkdag.',
    definition:
      'Een avondticket geeft toegang van de late middag tot sluitingstijd, voor minder dan een dagticket. Parken verkopen ze op dagen dat ze laat open zijn, in de zomer of in een winterseizoen dat na het donker doorloopt. Europa-Park verkoopt in zijn winterseizoen een Abendticket, en verkocht in 2018 voor zijn zomernachtfeest een Mondschein-ticket vanaf 17.00 uur.\n\nVeel attracties hebben tegen sluitingstijd een tweede rustig moment, als de dagjesmensen vertrekken, en de rijen sluiten op de aangegeven sluitingstijd. De grafiek per uur op de pagina van een attractie op park.fan laat zien hoe de mediane wachttijd zich door de middag en de avond heen ontwikkelt.',
    relatedTermIds: [
      'queue-closure',
      'opening-hours',
      'winter-season',
      'dynamic-pricing',
      'hard-ticket-event',
    ],
    aliases: ['avondtickets', 'twilight ticket', 'twilight tickets'],
  },
  {
    id: 'winter-season',
    name: 'Winterseizoen',
    shortDefinition:
      'Weken waarin een park dat normaal in de winter dicht is, opengaat met verlichting, kerstmarkten en wintershows.',
    definition:
      'In een winterseizoen is een park open in maanden waarin het anders dicht zou zijn, meestal van eind november tot in januari. Sommige buitenattracties blijven dicht vanwege vorst of onderhoud, en het park voegt verlichting, kerstmarkten, ijsbanen en wintershows toe.\n\nEuropa-Park was in 2001 het eerste Duitse park dat in de winter openging en trok in dat eerste seizoen 180.000 bezoekers. Phantasialand volgde in december 2002 met Wintertraum; sinds 2021 gaat het park eind oktober niet meer eerst dicht. In Nederland loopt Winter Efteling over dezelfde weken.\n\nOp park.fan krijgen attracties die alleen in de winter of alleen in de zomer draaien de badge Seizoensgebonden. Buiten hun seizoen verdwijnen ze van de parkpagina, tenzij de filter voor attracties buiten seizoen aan staat.',
    relatedTermIds: [
      'seasonal-attraction',
      'offseason',
      'season-opening',
      'evening-ticket',
      'crowd-calendar',
    ],
    aliases: ['winterseizoenen', 'winteropening', 'kerstseizoen', 'winterevenement'],
  },
  {
    id: 'season-opening',
    name: 'Seizoensopening',
    shortDefinition: 'De eerste dag van het hoofdseizoen van een park na de winterstop.',
    definition:
      'De seizoensopening is de eerste dag van het hoofdseizoen na de gesloten maanden. De meeste parken in Midden-Europa gaan tussen eind maart en half april weer open, vaak op tijd voor de paasvakantie, en veel openen die dag een nieuwe attractie of een nieuw themagebied. Parken met een winterseizoen hebben eind november een tweede opening.\n\nOpeningsweekenden trekken veel jaarkaarthouders terug naar het park, en de eerste warme weekenden van het voorjaar brengen daar nog dagjesmensen bovenop.\n\nDe drukte-prognose van park.fan behandelt de start van het seizoen als een gebeurtenis op zich. Zolang een park dicht is, toont de druktekalender die dagen als Gesloten, en de openingsdatum verschijnt er zodra het park die bekendmaakt.',
    relatedTermIds: ['offseason', 'opening-day', 'soft-opening', 'winter-season', 'crowd-forecast'],
    aliases: [
      'seizoensopeningen',
      'seizoensstart',
      'start van het seizoen',
      'openingsweekend',
      'openingsweekenden',
    ],
  },
  {
    id: 'queue-closure',
    name: 'Sluiting van de wachtrij',
    shortDefinition:
      'Het moment waarop een attractie niemand meer in de rij laat aansluiten, meestal bij sluitingstijd van het park.',
    definition:
      'Bij de sluiting van de wachtrij laat een attractie niemand meer aansluiten. In de meeste parken gebeurt dat op de aangegeven sluitingstijd, en wie dan in de rij staat, mag nog mee, wat op een drukke dag nog een uur kan duren. Sommige attracties sluiten hun rij eerder, als er al meer bezoekers in staan dan de attractie voor het einde van de dag kan vervoeren.\n\nDe dagplanner van park.fan werkt op dezelfde manier. Hij plant een attractie alleen in als het bezoek eraan, de rij inbegrepen, voor sluitingstijd begint, dus de laatste rit van een geplande dag kan na sluitingstijd eindigen. Niets in de planning begint daarna.',
    relatedTermIds: ['opening-hours', 'touring-plan', 'wait-time', 'evening-ticket', 'rope-drop'],
    aliases: ['wachtrijsluiting', 'sluiting wachtrij', 'sluitingstijd van de wachtrij'],
  },
  {
    id: 'walk-on',
    name: 'Walk-on',
    shortDefinition:
      'Een attractie zonder rij ervoor: bezoekers lopen meteen door naar het station.',
    definition:
      'Een attractie is een walk-on als er geen rij voor staat en bezoekers meteen naar het station lopen, hooguit wachtend op de volgende trein. Dat gebeurt bij rope drop, in het laatste uur van de dag, op rustige doordeweekse dagen en in de minuten nadat een attractie na een storing weer opengaat.\n\nDisneyparken geven sommige walk-ons aan als 13 minuten, een getal buiten het raster van vijf minuten waarop elke andere aangegeven wachttijd ligt. park.fan rondt elke wachttijd die het toont af op vijf minuten en laat die 13 staan; afgerond zou het lijken op een gewone rij van 15 minuten.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'rope-drop', 'typical-wait', 'off-peak'],
    aliases: ['walk-ons', 'walk on', 'walkon'],
  },
  {
    id: 'on-site-hotel',
    name: 'Parkhotel',
    shortDefinition: 'Een hotel van het park zelf, op of naast het parkterrein.',
    definition:
      'Een parkhotel is van het park zelf en staat op of naast het terrein, meestal in een thema dat erbij past. Europa-Park opende in 2019 zijn zesde themahotel, Krønasår, dat met een brug is verbonden met waterwereld Rulantica. Phantasialand heeft Ling Bao, Matamba en Charles Lindbergh, en de hotels van Disneyland Paris liggen op loopafstand van beide parken.\n\nGasten lopen naar de ingang, en veel resorts laten hen eerder binnen dan de andere bezoekers. Disneyland Paris noemt dat Extra Magic Time.\n\nAls een park een vroege toegang bekendmaakt, toont park.fan die bij de openingstijden als Early Entry, voor hotelgasten, met het aantal minuten voor de opening.',
    relatedTermIds: ['early-entry', 'rope-drop', 'season-pass', 'opening-hours'],
    aliases: [
      'parkhotels',
      'themahotel',
      'themahotels',
      'resorthotel',
      'resorthotels',
      'hotel in het park',
    ],
  },
];

export default translations;
