import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wachttijd',
    shortDefinition:
      'De geschatte tijd die een bezoeker in de rij moet staan voordat hij een attractie kan betreden.',
    definition:
      'De wachttijd is de geschatte duur die een bezoeker in de rij staat voordat hij een attractie kan betreden. Parken geven wachttijden aan bij attractie-ingangen en in hun apps. park.fan leest de wachttijden elke vijf minuten opnieuw in, voor elke attractie van een park.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Wachttijden', 'wachttijd'],
    alternateNames: ['Queue Time', 'Wachttijd in de rij'],
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
      'Bij een virtuele wachtrij meld je je via een app of kiosk aan voor een attractie en krijg je een melding wanneer je beurt nadert. In plaats van in de rij te staan, kun je in die tijd ergens anders in het park zijn en kom je terug wanneer je groep wordt opgeroepen.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Virtuele wachtrijen'],
  },
  {
    id: 'express-pass',
    name: 'Express Pas',
    shortDefinition:
      'Een betaald of inbegrepen ticket-upgrade die toegang geeft tot een kortere prioriteitsrij.',
    definition:
      'Een Express Pas (de naam varieert per park – Universal Express, Disney Lightning Lane, enz.) is een upgrade waarmee houders een speciale prioriteitsingang kunnen gebruiken met aanzienlijk kortere wachttijden. Gebruik de druktekalender van park.fan om te beslissen of een Express Pas de kosten waard is.',
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Express Pas', 'Express Passen'],
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
    name: 'Drukte-niveau',
    shortDefinition:
      'Een maat voor hoe druk een pretpark is op een bepaalde dag, van Zeer Laag tot Extreem.',
    definition:
      'Het drukte-niveau is een maat voor hoe vol een park is op een bepaalde dag of op een bepaald uur. park.fan rekent het uit de gemeten wachttijden, de huidige bezetting en de voorspelling, en geeft het op een schaal van “zeer laag” tot “extreem”. Zeer laag betekent korte rijen en vrije paden; extreem betekent lange wachttijden bij bijna elke attractie.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Drukte-niveaus', 'druktes'],
  },
  {
    id: 'crowd-calendar',
    name: 'Druktekalender',
    shortDefinition:
      'Een dag-voor-dag voorspelling met verwachte drukteniveaus om je bezoek te plannen.',
    definition:
      'Een druktekalender is een maand- of jaaroverzicht met het voorspelde drukteniveau voor elke dag. park.fan genereert druktekalenders met AI-modellen die zijn getraind op de meegeschreven wachttijden, gecombineerde schoolvakantiekalenders, aankomende evenementen en seizoenspatronen. Groene dagen staan voor weinig bezoekers, oranje en rode voor veel.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
    aliases: ['Druktekalenders'],
  },
  {
    id: 'peak-day',
    name: 'Piekdag',
    shortDefinition:
      'Een dag met maximale bezoekersaantallen, doorgaans tijdens feestdagen of speciale evenementen.',
    definition:
      'Een piekdag is elke dag waarop de bezoekersaantallen op of nabij de maximale capaciteit van een park zijn. Veelvoorkomende piekdagen zijn grote feestdagen (Kerst, Pasen, zomervakantie), speciale evenementdagen en schoolvakantieweken. park.fan markeert piekdagen in de druktekalender.',
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
      'Een renovatie is een geplande onderhouds- of renovatieperiode waarbij een attractie, show of parkgebied tijdelijk gesloten is. Renovaties kunnen van een paar dagen tot meerdere maanden duren. park.fan markeert attracties die momenteel worden gerenoveerd.',
    aliases: ['Renovaties'],
    alternateNames: ['Refurb', 'Onderhoudssluiting', 'Onderhoudsperiode'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Stilstandtijd',
    shortDefinition:
      'Een ongeplande tijdelijke sluiting van een attractie, vaak als gevolg van een technische storing.',
    definition:
      'Stilstandtijd is een ongeplande, tijdelijke sluiting van een attractie, in tegenstelling tot een geplande renovatie. Stilstandtijden worden veroorzaakt door technische storingen, veiligheidscontroles, bezoekersincidenten of ongunstige weersomstandigheden. park.fan toont de huidige operationele status van elke bijgehouden attractie in realtime.',
    aliases: ['Storingen'],
    alternateNames: ['Buiten Werking', 'Technisch Probleem', 'Technische storing'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Capaciteit',
    shortDefinition: 'Het aantal bezoekers dat een attractie per uur kan vervoeren.',
    definition:
      'De capaciteit van een attractie is het maximale aantal bezoekers dat een attractie per uur kan vervoeren onder optimale bedrijfsomstandigheden. De capaciteit is afhankelijk van de voertuiggrootte, het aantal rijdende voertuigen, de laad- en lossnelheid en de rijcyclustijd. De capaciteit bepaalt direct hoe snel de rij beweegt.',
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
      'Met Early Entry (ook wel Extra Magic Hours of Early Park Entry) mogen gasten van partnerhotels het park 30–60 minuten voor het grote publiek in. In die tijd zijn de wachtrijen bij populaire attracties een stuk korter. Wie op een drukke dag Early Entry combineert met een goed gekozen volgorde, rijdt zo meerdere hoofdattracties bijna zonder te wachten.',
    aliases: ['Vroege toegang'],
    alternateNames: ['Extra Magic Hours', 'Vroeg Erin', 'Early Park Entry'],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Een ticketoptie waarmee bezoekers op dezelfde dag meerdere parken van hetzelfde resort kunnen bezoeken.',
    definition:
      'Een Park Hopper-ticket geeft toegang tot twee of meer parken van hetzelfde resort op één dag. Met de Park Hopper-optie van Disney kunnen gasten bijvoorbeeld na 14:00 uur wisselen tussen Magic Kingdom, EPCOT, Hollywood Studios en Animal Kingdom. Dat loont vooral als de attracties die je wilt rijden in verschillende parken staan.',
    aliases: ['Park-Hopper', 'Park Hoppers'],
    alternateNames: ['Park Hopping', 'Multi-park ticket'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Jaarkaart',
    shortDefinition: 'Een ticket waarmee je 12 maanden lang onbeperkt naar het park kunt.',
    definition:
      'Een jaarkaart (Annual Pass) geeft 12 maanden lang onbeperkt toegang tot één of meer parken. Hogere niveaus bevatten vaak extra voordelen zoals korting op eten en drinken, gratis parkeren en korting op merchandise. Sommige jaarkaarten hebben geblokkeerde dagen (blockout dates) op de drukste dagen van het jaar. Voor regelmatige bezoekers – doorgaans drie of meer bezoeken per jaar – verdient een jaarkaart zichzelf bijna altijd terug.',
    aliases: ['Seizoenspas', 'Jaarkaarten', 'Seizoenspassen'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Jaarticket', 'Jaarabonnement'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Minimumlengte',
    shortDefinition:
      'Een minimumlengte die bezoekers moeten hebben om een specifieke attractie te mogen betreden.',
    definition:
      'De minimumlengte is een veiligheidsregel die parken instellen om te garanderen dat veiligheidssystemen – heupbeugelsloten, schouderbanden, gordels – correct werken voor elke bezoeker. Ze variëren doorgaans tussen 90 en 140 cm, afhankelijk van de intensiteit van de attractie. Sommige attracties hebben ook een maximumlengte of een gewichtslimiet. Controleer altijd de minimumlengte voordat je met jonge kinderen op bezoek gaat.',
    aliases: ['Minimumlengtes', 'minimumlengte-eisen'],
    alternateNames: ['Lengtebeperking', 'Lengteeis', 'Vereiste lengte'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Themagebied',
    shortDefinition:
      'Een zelfstandige zone binnen een pretpark gebouwd rondom een samenhangend thema.',
    definition:
      'Een themagebied is een afgebakende zone binnen een pretpark die een eenheid vormt van visueel ontwerp, een verhaalachtergrond en bijpassende attracties, horeca en winkels. Bekende voorbeelden zijn The Wizarding World of Harry Potter bij Universal, Star Wars: Galaxy’s Edge bij Disney en Scandinavië bij Efteling.',
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
      'Lightning Lane is de naam die Disney geeft aan zijn prioriteitsrijsysteem, geïntroduceerd in 2021 als opvolger van het gratis FastPass+-programma. Het bestaat in twee varianten: Individual Lightning Lane (ILL), apart verkocht voor de meest gevraagde attracties, en Lightning Lane Multi Pass (LLMP), een dagelijks abonnement waarmee gasten terugkeertijdslots kunnen reserveren voor een selectie attracties. Wat met FastPass+ gratis was, is daarmee een betaalde dienst geworden. Op welke dagen Lightning Lane de moeite waard is, kun je afleiden uit de druktekalender van park.fan.',
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Lightning Lanes'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Disney’s voormalige dagelijkse add-on die Lightning Lane Multi Pass-toegang bood voor de meeste attracties.',
    definition:
      'Genie+ (inmiddels omgedoopt tot Lightning Lane Multi Pass) was Disney’s betaalde dagelijkse add-on die FastPass+ verving. Voor een tarief per persoon per dag konden gasten telkens één Lightning Lane-terugkeertijdslot reserveren voor een brede selectie attracties. De grootste topattracties waren uitgesloten en werden apart verkocht als Individual Lightning Lane. De prijs van Genie+ was dynamisch en steeg op de drukste dagen. Aan de drukte-niveaus op park.fan kun je aflezen of het abonnement op een bepaalde dag de moeite waard is.',
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
      'Seizoensgebonden sluitingsperiode waarin het park volledig gesloten is voor onderhoud, verbouwingen of winterpauze en niet toegankelijk is voor het publiek.',
    definition:
      'De seizoenssluiting (of OffSeason) is de periode waarin een pretpark helemaal dicht is. Parken gebruiken die tijd voor onderhoud aan attracties en gebouwen, voor verbouwingen die tijdens de openingstijden niet kunnen en om het personeel rust te geven voor het nieuwe seizoen. Seizoenssluitingen vinden het vaakst plaats in de wintermaanden en duren van een paar weken tot meerdere maanden, afhankelijk van het park en het klimaat. Gedurende deze periode zijn geen attracties, restaurants of shows toegankelijk voor het publiek.\n\nWanneer park.fan de status OffSeason toont voor een park, betekent dit dat er geen openingsschema beschikbaar is voor de huidige periode en dat de volgende bevestigde openingsdatum nog enkele weken weg is. Raadpleeg de officiële parkwebsite voor de exacte heropeningsdatum. Bij populaire parken zijn de eerste dagen na de sluiting vaak snel uitverkocht.',
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
      'Blockout datums (ook wel blackout dates genoemd) zijn specifieke kalenderdagen waarop bepaalde jaarkaart-niveaus niet geldig zijn voor toegang. Parken stellen blockout datums in om de capaciteit op de drukste dagen te beheersen – piekdagen, vakantieweekenden en grote evenementdagen. Hogere niveaus hebben weinig of geen blockout datums, terwijl goedkopere jaarkaarten soms op 30–60 dagen per jaar geblokkeerd zijn. Heb je een beperkte jaarkaart, kijk dan altijd eerst in de blockout-kalender voordat je gaat. De druktekalender van park.fan markeert de piekperiodes; die kun je naast de blockout-datums van je jaarkaart leggen.',
    aliases: ['Geblokkeerde dagen'],
    alternateNames: ['Blackout Datum', 'Blackout Date', 'Uitsluitingsdatum'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Speciaal evenement',
    shortDefinition:
      'Een apart te betalen avond- of speciaal evenement waarvoor je buiten het reguliere parkticket een extra kaartje nodig hebt, zoals Halloween- of kerstfeesten.',
    definition:
      "Een speciaal evenement (hard ticket event) is een apart te betalen evenement – doorgaans 's avonds – dat in een pretpark plaatsvindt en een eigen kaartje vereist naast de reguliere parktoelating. Er zijn dan shows, decoraties en ontmoetingen met personages die er tijdens de gewone openingstijden niet zijn. Bekende voorbeelden zijn Mickey’s Not-So-Scary Halloween Party en Mickey’s Very Merry Christmas Party bij Walt Disney World, Halloween Horror Nights bij Universal en seizoensevenementen bij Disneyland Paris. Op dagen met een speciaal evenement worden reguliere dagbezoekers doorgaans om 18:00–19:00 uur gevraagd het park te verlaten. Kaartjes zijn vaak weken van tevoren uitverkocht.",
    aliases: ['Speciale evenementen'],
    alternateNames: ['Avondevenement', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'Disney’s vroegere gratis prioriteitswachtrij-systeem, in 2021 vervangen door het betaalde Lightning Lane.',
    definition:
      'FastPass+ (oorspronkelijk FastPass, geïntroduceerd in 1999) was Disney’s gratis prioriteitswachtrij-systeem waarmee gasten terugkeertijdslots voor attracties konden reserveren zonder extra kosten. In Walt Disney World konden gasten via de My Disney Experience-app tot drie FastPass+-reserveringen per dag boeken. Het systeem werd in 2020 tijdens de COVID-19-sluiting opgeschort, nooit heringevoerd en in 2021 vervangen door het betaalde Lightning Lane-systeem. Met die overstap werd een gratis voordeel een betaalde dienst. Oudere reisverslagen gaan nog uit van FastPass+.',
    aliases: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Terugkomsttijd',
    shortDefinition:
      'Een gereserveerd tijdvenster om terug te keren naar een attractie, uitgegeven door Lightning Lane, virtuele wachtrij of vergelijkbare prioriteitssystemen.',
    definition:
      'Een terugkomsttijd (soms terugkomstvenster genoemd) is een specifieke periode – doorgaans een blok van één uur – waarbinnen een gast die prioriteitstoegang heeft geboekt (via Lightning Lane, een virtuele wachtrij of een vergelijkbaar systeem) zich bij de speciale ingang van de attractie kan melden. In de tussentijd kan de gast elders in het park rondlopen in plaats van in de rij te staan. Wie meer dan een vastgesteld aantal minuten te laat komt, verliest doorgaans zijn reservering. Met de wachttijden en drukte-niveaus op park.fan kun je kiezen voor welke attracties je een terugkomsttijd boekt.',
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Terugkomsttijden'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time – een sessie waarbij een groep enthousiastelingen of hotelgasten exclusieve toegang heeft tot één of meer attracties zonder reguliere publiekswachtrij.',
    definition:
      'ERT (Exclusive Ride Time) is een periode waarin alleen een bepaalde groep op één of meer attracties mag, zonder ander publiek. Dat zijn doorgaans leden van een achtbaanclub, gasten van de resorthotels of jaarkaarthouders. Deelnemers rijden dan zonder noemenswaardige wachttijd, vaak tientallen keren in één sessie. Parken organiseren ERT voor clubbijeenkomsten (zoals die van de European Coaster Club of American Coaster Enthusiasts), als onderdeel van dure hotelpakketten of bij evenementen na sluitingstijd.',
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
      'Een Touring Plan is een vooraf vastgelegde volgorde van attracties, maaltijden en looproutes door het park, bedoeld om de totale wachttijd van de dag zo klein mogelijk te houden. Een goed plan houdt rekening met de delen van het park die het eerst vollopen, de capaciteit van de attracties, het verloop van de rijen, de showtijden en het weer. Sites zoals TouringPlans.com publiceren gedetailleerde plannen voor grote parken. Met de live wachttijden en de druktekalender van park.fan kun je zo’n plan in de loop van de dag bijsturen.',
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
      'Een dark ride is een attractie waarbij gasten in geleide voertuigen door een gesloten, verduisterde ruimte reizen die is gevuld met decorstukken, animatronics, filmprojecties en speciale effecten. Het gaat bij een dark ride om het verhaal en het thema. Bekende voorbeelden zijn Pirates of the Caribbean en Haunted Mansion bij Disney, en The Amazing Adventures of Spider-Man bij Universal. Dark rides hebben doorgaans geen minimumlengte, zodat ook jonge kinderen mee kunnen.',
    aliases: ['Dark Rides'],
    alternateNames: ['Binnenattractie', 'Overdekte attractie'],

    relatedTermIds: [
      'height-requirement',
      'ride-capacity',
      'soft-opening',
      'themed-land',
      'vr-coaster',
      'wait-time',
    ],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, een Zwitserse achtbaanfabrikant bekend om soepele, betrouwbare ritten en kenmerkende elementen zoals de Immelmann, cobra roll en zero-G roll.',
    definition:
      'B&M (Bolliger & Mabillard) is een Zwitserse achtbaanfabrikant, opgericht in 1988 door Walter Bolliger en Claude Mabillard. B&M-banen rijden soepel en vallen weinig uit. Ze werken vooral met positieve G-krachten, hebben een vaste set inversies (Immelmann, cobra roll, zero-G roll) en een hoge doorstroom. B&M is gespecialiseerd in inverted coasters, sit-down loopers, hyper coasters (boven 61 m), giga coasters (boven 91 m), wing coasters en dive machines. Vrijwel elk groot Europees park heeft minstens één B&M-installatie, waaronder Shambhala en Dragon Khan bij PortAventura, Silver Star bij Europa-Park, Nemesis bij Alton Towers en Goliath bij Walibi Holland.',
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
      'Intamin AG is een Zwitserse attractiefabrikant, opgericht in 1967, met meerdere hoogte- en snelheidsrecords voor achtbanen op zijn naam. Het hydraulische lanceersysteem van Intamin dreef jarenlang de snelste en hoogste achtbanen aan (Kingda Ka, 139 m; Top Thrill Dragster). Intamin bouwt ook mega- en giga coasters (waaronder Millennium Force bij Cedar Point en Intimidator 305 bij Kings Dominion), multi-launch coasters, waterattracties en dark rides. Europese Intamin-installaties zijn onder meer Taron in Phantasialand, Expedition GeForce in Holiday Park en Red Force in Ferrari Land.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Een Duits familiebedrijf uit Waldkirch bij Europa-Park dat waterattracties, dark rides en steeds meer stalen achtbanen bouwt.',
    definition:
      'Mack Rides is een Duitse attractiefabrikant in Waldkirch, Baden-Württemberg, op enkele kilometers van Europa-Park, dat net als het bedrijf in handen is van de familie Mack. Mack werd opgericht in 1921 en bouwt waterattracties, dark rides (waaronder Test Track en Radiator Springs Racers van Disney) en steeds meer achtbanen. De Blue Fire Megacoaster in Europa-Park (2009) was de eerste achtbaan met een Stengel Dive. Recentere hyper coasters van Mack zijn Ride to Happiness in Plopsaland en Kondaa in Walibi Belgium.',
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
      'Rocky Mountain Construction (RMC) is een Amerikaanse achtbaanfabrikant en onderhoudsbedrijf uit Hayden, Idaho. RMC vond het stalen I-box-spoor uit, dat op de constructie van een houten achtbaan kan worden gelegd. Zo konden parken ruwe, verouderde houten achtbanen ombouwen tot hybride banen met sterke airtime, meerdere inversies en voorbij-verticale drops. Op een traditioneel houten spoor kon dat niet. Voorbeelden van RMC-conversies zijn Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) en Wildfire (Kolmården). In Europa bouwde RMC de nieuwe hybride achtbaan Untamed in Walibi Holland.',
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
      'Gerstlauer Amusement Rides GmbH is een Duitse achtbaanfabrikant gevestigd in Münsterhausen, Beieren. Het bedrijf werd in 1946 opgericht als metaalverwerker, stapte in de jaren 80 over naar attracties en werd internationaal bekend met de Euro-Fighter, een compacte achtbaan met een verticale kettinglift en een drop tot 97 graden. Omdat een Euro-Fighter op een klein terrein past, staat hij vaak in stadsparken en kleinere parken, zoals Rage bij Adventure Island en Speed bij Oakwood. Gerstlauer bouwt ook het Infinity Coaster-model, spinning coasters en de SkyRoller, een achtbaan waarop rijders zelf bepalen hoe vaak hun stoel over de kop draait.',
    aliases: ['Gerstlauer Rides'],

    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'intamin',
      'spinning-coaster',
      'xtreme-spinning-coaster',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Duitse fabrikant van looping-achtbanen uit de jaren 70 en 80, waarvan er in Europese pretparken nog veel rijden.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG was een Duitse achtbaanfabrikant gevestigd in Münsterhausen, Beieren, dezelfde plaats waar Gerstlauer zich later vestigde. Anton Schwarzkopf richtte het bedrijf in 1954 op, en het bracht de looping-achtbaan naar Europa. De eerste moderne looping-achtbaan ter wereld, de Revolution in Six Flags Magic Mountain (1976), is een ontwerp van Schwarzkopf. Bekende modellen zijn de Looping Star, de Thriller/Wildcat en de verplaatsbare Looping Coaster, die door heel Europa reisde. Schwarzkopf-banen rijden zeer soepel en halen veel uit een compacte lay-out. Het bedrijf ging in 1983 failliet, maar veel installaties zijn decennia later nog steeds in bedrijf. Het onderhoud wordt nu verzorgd door gespecialiseerde bedrijven of Gerstlauer, dat een deel van het gereedschap heeft overgenomen.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Een achtbaan die bezoekers van 0 naar hoge snelheid versnelt via een magnetisch, hydraulisch of pneumatisch lanceersysteem in plaats van een traditionele chain lifthill.',
    definition:
      'Een Launch Coaster vervangt de traditionele chain lifthill door een aandrijfsysteem dat de trein in enkele seconden van stilstand naar topsnelheid versnelt. De belangrijkste technologieën zijn: LSM (Linear Synchronous Motor) launches – elektromagnetische spoelen versnellen een vin op de trein; LIM (Linear Induction Motor) – vergelijkbaar maar minder efficiënt; hydraulische launches – een zuigergedreven kabelsysteem dat Intamin gebruikte op recordbrekende achtbanen zoals Kingda Ka; en persluchtlaunches. Sommige achtbanen hebben meerdere launches verspreid over het circuit.',
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Gelanceerde Achtbaan', 'Katapult-achtbaan'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters'],
  },
  {
    id: 'wooden-coaster',
    name: 'Houten achtbaan',
    shortDefinition:
      'Een achtbaan die voornamelijk van hout is gebouwd, met een typisch gerommel, zijwaartse beweging en onvoorspelbare airtime.',
    definition:
      'Een houten achtbaan is een achtbaan met een houten spoor en draagconstructie. Hout buigt mee en is minder maatvast dan staal. Daardoor rommelt de baan, schudt de trein zijwaarts en valt de airtime minder voorspelbaar uit. Bekende houten achtbanen zijn Balder bij Liseberg, The Beast bij Kings Island en Megafobia bij Oakwood. Houten achtbanen hebben voortdurend onderhoud nodig, want het spoor moet regelmatig deels worden vernieuwd, en ze zijn gevoelig voor weersveranderingen. Met een RMC-conversie kan een verouderde houten achtbaan een stalen spoor krijgen terwijl de houten constructie blijft staan.',
    relatedTermIds: ['airtime', 'hybrid-coaster', 'quad-down', 'rattle', 'rmc'],
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
      'Een suspended coaster is een achtbaan waarbij de trein aan een scharnierpunt onder het spoor hangt en vrij van links naar rechts kan zwaaien. In een bocht zwaait de trein als een slinger naar buiten, en aan het eind van de bocht zwiept hij terug. Hoe ver hij uitzwaait, verschilt van rit tot rit. Bij een inverted coaster hangt de trein ook onder het spoor, maar vast, zonder te zwaaien.\n\nSuspended coasters zijn zeldzamer dan inverted coasters. Door het uitzwaaien hangt de trein ook in een flauwe bocht schuin in de lucht. Vekoma ontwikkelde in de jaren 90 het Suspended Looping Coaster (SLC)-model, waarvan wereldwijd honderden werden gebouwd.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Hangende achtbaan', 'Slingerende achtbaan'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybride achtbaan',
    shortDefinition:
      'Een achtbaan die een traditionele houten draagconstructie combineert met een stalen I-box-spoor, een techniek die Rocky Mountain Construction (RMC) heeft ontwikkeld.',
    definition:
      'Een hybride achtbaan combineert de houten constructie van een traditionele achtbaan met een stalen I-box-spoor van Rocky Mountain Construction (RMC). Het I-box-spoor is uiterst precies en soepel. Daarop zijn inversies mogelijk die op een traditioneel houten spoor niet kunnen. RMC ontwikkelde het spoor vooral om verouderde houten achtbanen te renoveren die te ruw waren geworden, en voegde daarbij inversies, steilere drops en airtime hills toe. Bekende RMC-hybriden zijn Steel Vengeance bij Cedar Point, Twisted Colossus bij Six Flags Magic Mountain en Wildfire bij Kolmården. Naast de conversies bouwt RMC ook nieuwe hybride banen, zoals Untamed bij Walibi Holland.',
    aliases: ['Hybrid Coasters'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Hybride achtbaan'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Een compact Vekoma-achtbaanmodel dat bezoekers twee keer door drie inversies stuurt, eerst vooruit en dan achteruit over hetzelfde spoor.',
    definition:
      'De Boomerang is een van de meest gebouwde achtbaanmodellen in de geschiedenis, gefabriceerd door Vekoma. De layout omvat drie inversies – een vertical loop geflankeerd door twee sidewinder-elementen – die eerst vooruit worden doorlopen, en daarna omgekeerd nadat de trein omhoog wordt getrokken door een tweede schuine lifthill en achterwaarts door dezelfde elementen wordt losgelaten. Een rit telt zo zes inversies (drie in elke richting) op een klein grondoppervlak, en daardoor past het model ook in parken met weinig ruimte. Er zijn wereldwijd meer dan 50 Boomerangs gebouwd, in parken op elk bewoond continent. In veel middelgrote parken is de Boomerang de instapachtbaan met inversies.',
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Een compact Gerstlauer-achtbaanmodel met een nagenoeg verticale of voorbij-verticale eerste drop na een verticale lifthill, gebouwd voor parken met weinig ruimte.',
    definition:
      'De Euro-Fighter is het compacte achtbaanmodel van Gerstlauer, herkenbaar aan de verticale (90 graden) of voorbij-verticale eerste drop (tot 97 graden) na een verticale chain lifthill. Het model is ontworpen voor parken met weinig ruimte en heeft op een klein terrein meerdere inversies, krappe bochten en hoge G-krachten. Bij de voorbij-verticale drop staat de trein even stil op de top, met de rijders voorover boven de afgrond, voordat hij valt. Europese Euro-Fighters zijn onder meer Saw – The Ride bij Thorpe Park, Rage bij Adventure Island en Fluch von Novgorod bij Hansa-Park.',
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
      'De looping is een volledige cirkel van 360 graden in het verticale vlak. Moderne loopings gebruiken een clothoïde (druppelvorm) in plaats van een perfecte cirkel: de in- en uitgang zijn wijd, terwijl de bovenkant van de looping strak is. Daardoor blijven de G-krachten gelijkmatig, zonder extreme pieken. De eerste moderne looping-achtbaan was Corkscrew in Knott’s Berry Farm (1975). Loopings zitten in achtbanen van elk formaat, van instapbanen tot recordhouders.',
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
      'Een B&M-element met twee inversies, waarbij het spoor de vorm heeft van een opgerichte cobrakop en de twee inversies verbonden zijn door een draai aan het hoogste punt.',
    definition:
      'De cobra roll is een B&M-element met twee inversies kort na elkaar: het spoor buigt omhoog in een halve looping, roteert 180 graden aan de top (door een korte onderstebovenstand), en spiegelt daarna de reeks om in dezelfde richting als bij de ingang te eindigen. Vanuit opzij gezien lijkt het spoortracé op de opgeheven en gespreide kop van een cobra. Een cobra roll zit onder meer in Dragon Khan in PortAventura en in veel inverted coasters van B&M.',
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
      'Een halve looping gecombineerd met een halve kurketrekker die het spoor 90 graden draait en van richting verandert, onder meer op de Boomerang van Vekoma.',
    definition:
      'Een Sidewinder bestaat uit een halve verticale looping die de trein omhoog trekt, onmiddellijk gevolgd door een halve kurketrekker die de trein rechtop draait terwijl hij 90 graden draait. Zo combineert het element een inversie met een richtingsverandering op weinig grond. De Boomerang van Vekoma bestaat uit twee sidewinders (één vooruit, één omgekeerd) aan weerszijden van een looping. De naam verwijst naar de slangachtige draaibeweging die van opzij te zien is.',
    relatedTermIds: ['boomerang', 'cobra-roll', 'inversion'],
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
      'Een looping-variant waarbij het spoor van bovenaf nadert, door het cirkelvormige pad omlaag duikt en bovenaan uitkomt, precies andersom dan bij een gewone looping.',
    definition:
      'De Norwegian Loop (soms reverse loop) heeft de tegenovergestelde geometrie van een standaard verticale looping: in plaats van op grondniveau in te gaan en op dezelfde hoogte uit te komen, gaat de trein vanuit een verhoogde positie de cirkelvormige looping in, duikt omlaag door het cirkelpad en komt bovenaan weer uit. Onderin de cirkel werken nog steeds sterke positieve G-krachten, maar in- en uitgang rijden duidelijk anders. Norwegian loops zijn zeldzaam en komen vooral voor op sommige Vekoma-ontwerpen en maatwerkbanen.',
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
      'De Stengel Dive is een airtime-element waarbij het spoor voorbij 90 graden (voorbij verticaal) kantelt, zodat de rijders zijwaarts of licht ondersteboven hangen terwijl het heuvelprofiel ze tegelijk negatieve G-krachten geeft. Het element is vernoemd naar de Duitse achtbaaningenieur Werner Stengel. Mack Rides gebruikt de Stengel Dive op zijn hyper coasters. De eerste achtbaan met het element was Blue Fire Megacoaster in Europa-Park; latere hyper coasters van Mack, zoals Ride to Happiness in Plopsaland en Kondaa in Walibi Belgium, hebben er meerdere.',
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
      'Een hoog, smal element met een nagenoeg verticale klim en daling dat lijkt op een hoge hoed, vooral op hydraulisch gelanceerde Intamin-achtbanen.',
    definition:
      'Een Top Hat is een element waarbij het spoor nagenoeg verticaal omhoog klimt naar een scherpe top en aan de andere kant nagenoeg verticaal weer naar beneden gaat. Van opzij gezien lijkt het profiel op een hoge hoed. Inside (standaard) Top Hats kantelen bovenin naar binnen; outside Top Hats kantelen naar buiten en geven bovenop meer airtime. Het element hoort vooral bij de hydraulische launch coasters van Intamin, waar de trein na de lancering tot 200 km/u of meer de Top Hat in rijdt. Kingda Ka (139 m), Top Thrill Dragster (128 m) en Red Force in Ferrari Land hebben een Top Hat.',
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
      'Het zwaarste spinning coaster-model van Gerstlauer: sneller en hoger dan een standaard spinning coaster, met wagons die harder draaien.',
    definition:
      'De Xtreme Spinning Coaster (XSC) is het zwaarste spinning coaster-model van Gerstlauer. Een standaard spinning coaster is op gezinnen afgestemd. De XSC is hoger, heeft steilere drops en een hogere topsnelheid, en het draaimechanisme is zo afgesteld dat de wagons in elk element van het parcours harder en vaker draaien.\n\nDoor het hogere tempo wisselt de rijrichting sneller dan op een gewone spinning coaster. Met de XSC heeft Gerstlauer een model tussen de spinning coaster voor gezinnen en de volwaardige thrill coaster in.',
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'gerstlauer', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achtbaan van meer dan 61 m hoog, doorgaans zonder inversies, met de nadruk op snelheid en airtime.',
    definition:
      'Hyper Coaster is de classificatie voor achtbanen tussen 61 en 91 m hoog. B&M noemt zijn modellen “Hyper Coaster”; Intamin gebruikt “Mega Coaster” voor een vergelijkbaar type. Beide leggen de nadruk op grote airtime-heuvels bij hoge snelheid in plaats van inversies. Shambhala in PortAventura (76 m) en Hyperion in Energylandia (77 m) zijn de hoogste Hyper Coasters van Europa. Andere bekende voorbeelden: Goliath in Walibi Holland en Mako in SeaWorld Orlando.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Mega Coaster', 'Mega Achtbaan', 'Hypercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achtbaan van meer dan 91 m hoog, een klasse boven de Hyper Coaster.',
    definition:
      'Giga Coaster is de classificatie voor achtbanen tussen 91 en 121 m hoog. De term werd in 2000 bedacht door Cedar Fair en Intamin voor Millennium Force in Cedar Point. Giga coasters hebben lange lay-outs met grote airtime hills. Een ander voorbeeld is Fury 325 in Carowinds. In Europa bestaat nog geen echte Giga Coaster; Hyperion in Energylandia (Polen) valt met 77 m technisch nog in de Hyper-categorie.',
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
      'Een Trim Brake is een rem halverwege een achtbaan die de trein afremt. Anders dan een block brake stopt hij de trein niet. Trim Brakes worden gebruikt om G-krachten te beperken, slijtage te verminderen of aan veiligheidseisen te voldoen. Remt een trim brake vlak voor een airtime hill, dan valt de airtime op die heuvel zwakker uit. Of een trim brake remt, hangt af van het seizoen, het weer en de belading.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Wanneer een launch coaster het hoogste punt niet bereikt en terugrolt naar het lanceerplatform.',
    definition:
      'Een rollback treedt op wanneer een gelanceerde achtbaan onvoldoende snelheid ontwikkelt om het hoogste punt van het circuit te bereiken en vervolgens door de zwaartekracht terugrolt naar de lanceerpositie. Bij hydraulische launch coasters (Top Thrill Dragster, Stealth) gebeurt dit wanneer het lanceermechanisme niet de volledige kracht levert. De trein rolt langzaam terug en wordt door magneetremmen opgevangen. Rollbacks zijn zeldzaam, maar komen bij hydraulische launch coasters af en toe voor. Passagiers lopen geen gevaar.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronic',
    shortDefinition:
      'Robotfiguren in dark rides en shows die personages en scènes levensecht nabootsen.',
    definition:
      'Animatronics (enkelvoud: animatronic) zijn elektromechanische robotfiguren die worden gebruikt in attracties en shows van pretparken om personages of wezens levensecht na te bootsen. Disney introduceerde de term “Audio-Animatronics” in 1964 op de Wereldtentoonstelling. Moderne animatronics variëren van eenvoudige figuren die steeds dezelfde beweging herhalen tot robots met servo’s en pneumatiek, met gezichtsuitdrukkingen en bewegingen van het hele lichaam. Efteling gebruikt veel animatronics, onder meer in De Vliegende Hollander en Symbolica.',
    aliases: ['Animatronics'],
    alternateNames: ['Audio-Animatronics', 'Robotfiguur'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'AI-voorspelling',
    shortDefinition:
      'Machine learning-voorspellingen voor drukteniveaus en wachttijden, voor elke dag waarvoor een park zijn openingstijden al heeft gepubliceerd.',
    definition:
      'Een AI-voorspelling gebruikt machine learning-modellen die getraind zijn op historische bezoekersdata, weersdata, schoolvakantieschema’s en real-time wachtrij-informatie om te voorspellen hoe druk een pretpark of attractie zal zijn op een bepaalde dag of tijdstip. park.fan maakt AI-voorspellingen voor drukte en verwachte wachttijden voor elke dag waarvoor een park zijn openingstijden al heeft gepubliceerd.\n\nDe voorspellingen worden bij elke trainingsronde opnieuw berekend, dagelijks om 06:00 UTC. Voorspellingen voor de komende 1–7 dagen zijn nauwkeuriger, omdat dan de actuele weersdata, aangekondigde evenementen en boekingssignalen meetellen. Voorspellingen verder vooruit zijn minder nauwkeurig, maar rustige en drukke perioden zijn er wel ruim van tevoren in te herkennen.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['AI-voorspelling', 'AI-voorspellingen'],
  },
  {
    id: 'opening-hours',
    name: 'Openingstijden',
    shortDefinition:
      'Het officiële dagprogramma dat aangeeft wanneer een pretpark of attractie opent en sluit.',
    definition:
      'Openingstijden zijn het gepubliceerde dagprogramma van een pretpark of een attractie: wanneer de toegang begint en wanneer het park of de attractie sluit. De meeste grote parken publiceren een doorlopend schema weken of maanden van tevoren, al kunnen tijden op korte termijn wijzigen door speciale evenementen, seizoensaanpassingen of problemen in de bedrijfsvoering.\n\npark.fan toont openingstijden voor elk park. Tijden met “Est.” (geschat) zijn afgeleid uit historische patronen en niet door het park bevestigd. Controleer ze vóór je bezoek.',
    aliases: ['Parktijden', 'Openingstijden'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Wachttijdtrend',
    shortDefinition:
      'De richting van de verandering in wachtrijlengte over de afgelopen 30 minuten – stijgend, dalend of stabiel.',
    definition:
      'De wachttijdtrend geeft aan of de wachtrij van een attractie langer, korter of even lang is als 30 minuten geleden. park.fan geeft dit weer met een pijl: omhoog (wachtrij groeit), omlaag (wachtrij krimpt) of horizontaal (stabiel).\n\nVoor de keuze waar je nu heen loopt, is de trend vaak nuttiger dan de wachttijd zelf. Een attractie met 45 minuten en een dalende trend is een betere keuze dan een met 40 minuten en een sterk stijgende trend. Tegen de tijd dat je er bent, kan de eerste wachtrij gedaald zijn naar 30 minuten en de tweede gestegen naar 55.',
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
    shortDefinition:
      'Wachttijddata die direct vanuit de parksystemen wordt opgehaald en elke vijf minuten bijgewerkt.',
    definition:
      'Een live wachttijd is de wachttijd zoals die op dit moment uit de datasystemen van een park komt, in tegenstelling tot een historisch gemiddelde. park.fan haalt de wachttijden uit openbare bronnen en ververst ze elke vijf minuten.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
    aliases: ['Live wachttijden', 'live wachttijd', 'realtime wachttijd'],
    alternateNames: ['Realtime wachttijd', 'Realtime wachttijden'],
  },
  {
    id: 'crowd-forecast',
    name: 'Drukte-prognose',
    shortDefinition:
      'AI-gebaseerde voorspelling van hoe druk een attractiepark op een bepaalde dag zal zijn.',
    definition:
      'Een drukte-prognose is een datagestuurde voorspelling van hoe druk een attractiepark op een bepaalde dag of tijd zal zijn. park.fan herberekent drukte-prognoses dagelijks op basis van historische bezoekerscijfers, schoolvakanties, weerdata en speciale evenementen. De uitkomst komt direct in de druktekalender: groen voor korte rijen, rood voor piekdrukte met lange wachttijden.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Drukte-prognoses'],
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
      'De grijze zone omvat achtbaanelementen op de grens tussen een volledige inversie en een element zonder inversie. Bij klassieke inversies, zoals loopings en kurketrekkers, is er geen twijfel: de trein draait de passagier volledig ondersteboven. Elementen in de grijze zone halen net wel of net niet de 180°, en brengen de passagiers bijna ondersteboven.\n\nTypische elementen in de grijze zone zijn stalls (de trein blijft even ondersteboven zonder een volledige rol te maken), sterk overhellende bochten voorbij 90° en sommige varianten van de wave turn. Fabrikanten zoals RMC en Intamin gebruiken deze elementen bewust als alternatief voor klassieke inversies. Afhankelijk van de telmethode – strikt (alleen volledige rotaties) of breed (elke overheadpositie) – kan het officiële inversieaantal van een attractie variëren.',
    aliases: ['Grijze zones', 'grijze-zone'],
    alternateNames: ['borderline inversie', 'quasi-inversie'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Zijdelingse krachten die passagiers opzij duwen tijdens bochten, overgangen en helixgedeelten.',
    definition:
      'Laterale G-krachten zijn de zijdelingse versnellingen die passagiers voelen wanneer een achtbaan in het horizontale vlak van richting verandert: in gekantelde en ongekantelde bochten, helixen en richtingswissels. Bij een goed ontwerp bouwen ze geleidelijk op en weer af. Bij een slecht ontwerp of een ruw spoor word je met een ruk tegen de rug- of zijkant van de stoel gegooid, en dat kan pijn doen.\n\nBedoelde laterale krachten, zoals in de bochten van klassieke houten achtbanen, zijn iets anders dan harde schokken door een versleten spoor of slecht bouwwerk. Houten achtbanen hebben veel laterale beweging, doordat het spoor meebuigt en de bochten weinig of niet gekanteld zijn. Balder in Liseberg heeft vloeiende laterale krachten in zijn helixgedeelten.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Lateralen', 'Laterale G'],
    alternateNames: ['Lateral G', 'Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Sterke negatieve G-krachten die passagiers abrupt uit hun stoel slingeren, zodat alleen de schootbeugel ze nog tegenhoudt.',
    definition:
      'Ejector airtime is de sterkste vorm van negatieve G-krachten. Het spoor buigt zo abrupt sneller naar beneden dan een vrije val dat de passagiers hard uit hun stoel omhoog komen; alleen de schootbeugel houdt ze in het voertuig. De naam komt daarvan: de stoel lijkt je uit te werpen. Floater airtime is een rustig, langer zweven; ejector airtime komt plotseling en kan bij abrupte overgangen hard aankomen.\n\nEjector airtime zit vooral in RMC-hybride achtbanen, sommige hyper coasters van Intamin en moderne houten achtbanen met steile parabolische heuvels. Voorbeelden zijn Untamed in Walibi Holland, Wildfire in Kolmården en Steel Vengeance in Cedar Point.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Zachte, aanhoudende negatieve G-krachten die een lang zweefgevoel produceren bij het passeren van een heuvel.',
    definition:
      'Floater airtime is de zachte kant van de negatieve G-krachten. De passagiers komen een stukje uit hun stoel en zweven even gewichtloos, terwijl de trein langs een geleidelijke parabolische boog over een heuvel gaat. De kracht is klein, doorgaans −0,1G tot −0,3G, en dus ook te doen voor wie ejector airtime te heftig vindt.\n\nFloater airtime is typisch voor B&M hyper en giga coasters, met grote, ronde heuvels die lange zweefmomenten geven. Europese voorbeelden met lange reeksen floater airtime zijn Shambhala in PortAventura, Silver Star in Europa-Park en Goliath in Walibi Holland.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Het gevoel van gewichtloos hangen in de beveiliging tijdens een inversie, veroorzaakt door negatieve G-krachten ondersteboven.',
    definition:
      'Hangtime is het effect van negatieve G-krachten tijdens een inversie. De trein gaat bovenin een inversie zo langzaam dat de passagiers ondersteboven in hun beugels hangen. In een snelle looping is dat moment kort; bij hangtime vertraagt de trein bovenin en duurt het langer. Het volle lichaamsgewicht rust dan op de schouderbeugel of de schootbeugel.\n\nHet sterkst is hangtime waar de trein bovenin een inversie flink vertraagt. Het bekendste voorbeeld is de pretzel loop op flying coasters, waar de snelheid laag genoeg is voor aanhoudende negatieve G-krachten terwijl de rijders volledig ondersteboven hangen. Ook de heartline roll van sommige moderne attracties geeft hangtime.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion', 'pretzel-loop'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Achtbaanelement',
    shortDefinition:
      'Een benoemd onderdeel van een achtbaanspoor, zoals een looping, airtime-heuvel of inversie.',
    definition:
      'Een achtbaanelement is elk afzonderlijk, benoemd onderdeel van het parcours van een achtbaan. Dat kunnen inversies zijn, zoals loopings en kurketrekkers, maar ook elementen zonder inversie, zoals airtime hills, helixen en overbanks. Elk element is ontworpen voor een bepaalde kracht: negatieve G-krachten (airtime), zijwaartse G-krachten of een rotatie ondersteboven.\n\nDe woordenlijst van park.fan beschrijft tientallen elementen, waaronder de first drop, de lifthill, de Stengel dive, de Norwegian loop en de heartline roll.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
    aliases: ['Achtbaanelementen'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Eerste rij',
    shortDefinition:
      'De eerste rij zitplaatsen in een achtbaantrein, met vrij uitzicht naar voren.',
    definition:
      'De eerste rij is de eerste rij zitplaatsen in een achtbaantrein. Vanaf de eerste rij kijk je vrij naar voren. Op hyper coasters en giga coasters voelen passagiers in de eerste rij tijdens de eerste afdaling meestal de sterkste airtime, omdat niemand voor hen het zicht op de ruimte blokkeert. Je ziet de afdaling aankomen voordat de trein erin duikt.\n\nOp veel achtbanen is de eerste rij zo gevraagd dat er een aparte wachtrij voor is, of dat het park express-reserveringen speciaal voor die plaats verkoopt.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    aliases: ['Voorstoelplaats', 'Eerste plaats'],
  },
  {
    id: 'back-row',
    name: 'Achterste rij',
    shortDefinition:
      'De laatste rij zitplaatsen in een trein, met op lay-outs met veel heuvels de sterkste airtime.',
    definition:
      'De achterste rij is de laatste rij zitplaatsen in een achtbaantrein. Op achtbanen met veel heuvels (hypers, gigas en andere banen die op airtime zijn gebouwd) geeft de achterste rij de sterkste ejector airtime. Op elke heuvel voelen de passagiers achterin langer negatieve G-krachten terwijl de trein over de top gaat; alleen de beugel houdt ze in hun stoel. Dat herhaalt zich op elke heuvel, en achterin is de airtime daardoor meestal sterker en langer dan voor- of middenin.\n\nOp achtbanen als Goliath en Shambhala zit je voor de sterkste airtime dus achterin.',
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
      'Een wagentje (ook wel auto, car of treinwagentje genoemd) is het losse deel van een achtbaantrein waarin de passagiers zitten. Een achtbaantrein bestaat meestal uit meerdere gekoppelde wagentjes, elk met één of meer rijen passagiers achter elkaar. De fabrikant bepaalt de maten van het wagentje, de zitpositie en de vorm van de beugels, met het oog op comfort en op wat de passagier voelt.\n\nHoe een wagentje eruitziet, hangt af van het type achtbaan. Hyper coasters hebben lage, gestroomlijnde wagentjes met weinig luchtweerstand; bij inverted coasters hangen de passagiers onder het spoor; bij wing coasters zitten ze naast het spoor met niets eronder; op flying coasters liggen ze met het gezicht naar beneden. B&M, Intamin en Mack hebben elk een eigen, herkenbaar wagentjesontwerp.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    aliases: ['Auto', 'Car'],
  },
  {
    id: 'lap-bar',
    name: 'Schootbeugel',
    shortDefinition:
      'Een horizontale veiligheidsbeugel over de schoot, waarmee je meer bewegingsvrijheid hebt dan met een schouderbeugel.',
    definition:
      'Een schootbeugel is een horizontale veiligheidsbeugel die de passagier op de bovenbenen vastzet. Een schouderbeugel sluit het hele bovenlichaam in; met een schootbeugel kan het bovenlichaam vrij bewegen. Schootbeugels zijn standaard op de meeste moderne hyper coasters en giga coasters en op veel traditionele stalen en houten achtbanen. Bij airtime komt de passagier helemaal uit de stoel omhoog, tot tegen de beugel.\n\nOp achtbanen met veel airtime houdt een schootbeugel de passagier het minst tegen. Hij moet wel goed aansluiten en kan oncomfortabel zijn voor wie een lang bovenlichaam heeft. Fabrikanten hebben het ontwerp in de loop van decennia verbeterd, en moderne schootbeugels zitten een stuk comfortabeler dan oudere.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
    aliases: ['Schoot-beugel'],
  },
  {
    id: 'shoulder-harness',
    name: 'Schouderbeugel',
    shortDefinition:
      'Een veiligheidsbeugel die over de schouders komt, het hele bovenlichaam insluit en de beweging tijdens de rit beperkt.',
    definition:
      "Een schouderbeugel komt over beide schouders en over de schoot en sluit het hele bovenlichaam in. Schouderbeugels waren standaard op achtbanen van de jaren '80 tot 2000 en zijn nog gebruikelijk op inverted coasters, sommige suspended coasters en familieattracties waar maximale veiligheid voorop staat. Moderne beugels klikken in meerdere standen vast, zodat ze bij verschillende lichaamsbouw passen.\n\nOp een achtbaan met veel airtime merk je het verschil met een schootbeugel: de schouderbeugel houdt je naar beneden, zodat je minder ver uit de stoel omhoog komt. Fabrikanten ruilen zo minder airtime in voor meer veiligheid en comfort.",
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
    aliases: ['OTS-beugel'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition:
      'Een herinneringsvoorwerp of klein artikel gekocht in een themapark ter herinnering aan een bezoek.',
    definition:
      'Een souvenir is een voorwerp dat bezoekers kopen ter herinnering aan hun bezoek aan een themapark, zoals merchandise, kleding of een verzamelobject. Veelvoorkomende souvenirs zijn t-shirts met parklogo’s, petten, spelden, ansichtkaarten en pluche in het thema van het park.\n\nThemaparken verdienen veel aan de verkoop van souvenirs; op merchandise zit meestal een opslag van 2–3x ten opzichte van gewone winkelprijzen. Veel gasten verzamelen souvenirs uit meerdere parken: ze sparen spelden, ruilen ze met anderen of zetten ze samen op een plank.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    aliases: ['Souvenir', 'Aandenken'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Officiële producten die een themapark verkoopt, zoals kleding, verzamelobjecten en thema-artikelen.',
    definition:
      'Merchandise is alles wat een themapark aan goederen verkoopt: kleding met logo (t-shirts, hoodies, petten), verzamelobjecten (spelden, beeldjes, pluche), eet- en drinkartikelen en thema-artikelen die bij een bepaalde attractie of franchise horen. Grote parken verkopen die in tientallen winkels, rijdende kraampjes en kleine boetieks. Merchandise levert vaak 15–25% van wat gasten in totaal uitgeven, na eten en drinken de grootste post.\n\nParken verkopen ook seizoensartikelen in beperkte oplage, merchandise in samenwerking met bekende franchises, ontwerpen die alleen in het park te koop zijn en speciale uitgaven bij de opening van een nieuwe attractie of bij een jubileum.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Souvenirboutique',
    shortDefinition:
      'Een winkel in een themapark die souvenirs, merchandise en themaproducten verkoopt.',
    definition:
      'Een souvenirboutique is een winkel in een themapark voor souvenirs, merchandise en themaproducten. Hij staat op een centrale plek (zoals een hoofdplein) of in een themagebied of bij een attractie. Grote parken hebben tientallen souvenirboutiques, van kleine karren tot winkels zo groot als een warenhuis. Ze staan waar veel bezoekers langskomen: bij de uitgang van grote attracties, in hotelgangen en bij de in- en uitgang van het park, waar gasten tijd hebben en eerder iets kopen.\n\nIn de winkel zelf zijn de ingang, de aankleding en de plek van elk product op de verkoop afgestemd. Bij veel attracties loopt de uitgang dwars door een winkel, om impulsaankopen uit te lokken. Parken verkopen steeds meer merchandise van gelicentieerde merken en franchises, waarvoor ze hogere prijzen kunnen vragen.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
    aliases: ['Souvenirwinkel'],
  },
  {
    id: 'park-exclusive',
    name: 'Parkexclusief',
    shortDefinition:
      'Een product of artikel alleen beschikbaar in een specifiek themapark, niet verkrijgbaar elders.',
    definition:
      'Parkexclusieve merchandise wordt alleen in één themapark of binnen één parkgroep ontworpen en verkocht, en is bij geen enkele andere winkel te krijgen. Omdat een artikel nergens anders te koop is, kopen gasten het eerder in een opwelling, en het park kan er meer voor vragen (vaak een opslag van 2–3x de gewone winkelmarge). Veelvoorkomende exclusieve artikelen zijn kleding in beperkte oplage, verzamelspelden en thema-artikelen bij de opening van een nieuwe attractie of bij een seizoensevenement.\n\nGasten die ver gereisd zijn en veel voor hun toegang hebben betaald, kopen sneller iets wat ze thuis niet kunnen krijgen. Op online doorverkoopplatforms houden zeldzame, gewilde parkexclusieve artikelen hun waarde of stijgen ze in prijs, en dat zet verzamelaars aan om meer te kopen.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Exclusief'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Achtbaan waarbij passagiers liggend met het gezicht naar beneden reizen.',
    definition:
      'Een flying coaster vervoert passagiers horizontaal, met het gezicht naar beneden, in de houding van iemand die vliegt. De trein kantelt op het perron van zittende naar liggende positie voordat de rit begint. Bekende voorbeelden: Manta (SeaWorld Orlando) en Tatsu (Six Flags Magic Mountain), beide van B&M.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['vliegende achtbaan', 'Superman rit'],
    alternateNames: ['flyer', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mijntrein',
    shortDefinition: 'Stalen familieachtbaan in het thema van een mijntrein.',
    definition:
      'Een mijntrein is een stalen familieachtbaan die is vormgegeven als een op hol geslagen mijntreintje. Hij rijdt meestal met matige snelheid, kleine drops en scherpe bochten door tunnels en langs rotsen. Ook jongere kinderen kunnen meestal mee. Voorbeelden: Big Thunder Mountain Railroad (Disney-parken) en Gold Rush (Plopsaland).',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    aliases: ['mijnwagentje', 'familieachtbaan'],
    alternateNames: ['mine coaster', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition:
      'Achtbaan die is ontworpen om het natuurlijke landschap te volgen en te benutten.',
    definition:
      'Een terrain coaster maakt gebruik van de natuurlijke vormen van het terrein (heuvels, dalen en ravijnen) in plaats van volledig op kunstmatige constructies te steunen. De baan blijft dicht bij de grond, en daardoor lijkt de trein sneller te gaan. Klassieke voorbeelden: The Beast (Kings Island) en Ravine Flyer II (Waldameer).',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    aliases: ['landschapsachtbaan', 'grondgebonden achtbaan'],
    alternateNames: ['terrain coaster'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Stalen achtbaan zonder vloer, waarbij de benen vrij hangen.',
    definition:
      'Bij een floorless coaster klapt de wagenvloer weg zodra de passagiers zijn vastgemaakt, waardoor de benen vrij boven de rails hangen. Anders dan bij een inverted coaster loopt de rail onder het voertuig. De eerste was Medusa van B&M (1999). Europees voorbeeld: Goliath (Walibi Holland).',
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
      'Amerikaans achtbaanfabrikant verantwoordelijk voor de eerste moderne looping.',
    definition:
      'Arrow Dynamics (opgericht in 1945) was een Amerikaanse fabrikant die de moderne buisstalen rail introduceerde en de eerste moderne verticale looping bouwde op Corkscrew (Knott’s Berry Farm, 1975). Typisch voor Arrow zijn corkscrews en suspended looping coasters. Het bedrijf vroeg in 2001 faillissement aan en de activa werden overgenomen door S&S.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition: 'Amerikaans fabrikant van houten achtbanen met snelle, bochtige layouts.',
    definition:
      'Great Coasters International (GCI) is een Amerikaans bedrijf gespecialiseerd in houten achtbanen. GCI werd opgericht in 1994 en bouwt eigen treinen (de Millennium Flyer) en lay-outs met snelle richtingsveranderingen en aanhoudende airtime. Bekende installaties: Wodan (Europa-Park), Thunderhead (Dollywood) en Troy (Toverland).',
    relatedTermIds: ['airtime', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Amerikaanse fabrikant van LSM- en LIM-lanceerachtbanen, in Europa vooral bekend van Sky Scream.',
    definition:
      'Premier Rides (opgericht 1995, Baltimore, Maryland) is een Amerikaanse fabrikant van lanceersystemen met lineaire synchrone motoren (LSM) en lineaire inductiemotoren (LIM). De Sky Rocket II, een compacte launch coaster met één inversie, staat in middelgrote parken over de hele wereld.\n\nIn Europa is Premier Rides vooral bekend van Sky Scream in Holiday Park (Haßloch, Duitsland), een geïnverteerde familie-lanceerachtbaan. Ook Hagrid’s Magical Creatures Motorbike Adventure in Universal Orlando rijdt met LSM-techniek van Premier.',
    aliases: ['Premier'],
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
      'Italiaanse fabrikant met een van de grootste assortimenten familieachtbanen en -attracties ter wereld en meer dan 250 geïnstalleerde achtbanen.',
    definition:
      'Zamperla (opgericht 1966, Altavilla Vicentina, Italië) is een van de productiefste attractiefabrikanten ter wereld. Waar Intamin, B&M en Mack vooral grote thrill-attracties bouwen, levert Zamperla veel kleinere attracties voor een breed publiek. De Family Coaster, Mini Coaster, Twister en Disk’O Coaster staan in kleinere parken en vakantieresorts over de hele wereld.\n\nOmdat ze weinig ruimte innemen en matige lengte-eisen hebben, staan Zamperla-attracties vaak in Europese stadsparken, vakantieparken en overdekte parken. Het bedrijf bouwde ook Thunderbolt op Coney Island (New York).',
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition:
      'Duits fabrikant van attracties opgericht in 1961, bekend van de Top Spin, Break Dance, Enterprise, Ranger en Condor.',
    definition:
      'Huss Rides GmbH is een Duits attractiefabrikant opgericht in 1961 door Paul Huss, gevestigd in Bremen. Het bedrijf bouwde in de late 20e eeuw flat rides die in pretparken en op kermissen over de hele wereld staan.\n\nBekende Huss-modellen zijn de Top Spin, de Break Dance (draaiende voertuigen op een draaiend platform), de Enterprise (centrifugaal gondelwiel), de Ranger (slingerend pendelschip), de Condor (draaiende stoelentoren) en de Troïka. Veel van deze ontwerpen zijn door andere fabrikanten nagebouwd. In Europese parken stonden Huss-attracties vooral in de jaren tachtig en negentig overal.',
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
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
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
    aliases: ['zero-g stall', 'RMC stall', 'hangtime element', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      'Gebogen, sterk gekantelde bocht die airtime geeft midden in de richtingsverandering.',
    definition:
      'Een wave turn is een snelle, sterk gekantelde bocht. Midden in de bocht werken kort negatieve of laterale G-krachten, en de rijders komen even uit hun stoel. Het element komt veel voor op banen van Rocky Mountain Construction en combineert een richtingsverandering met ejector- of floater-airtime. Voorbeelden zitten in Wildfire (Kolmården) en Untamed (Walibi Holland).',
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
    aliases: ['laagseizoen', 'shoulder season', 'rustige periode', 'off-peak'],
  },
  {
    id: 'school-holiday',
    name: 'Schoolvakantie',
    shortDefinition: 'Schoolvakantieperioden, waarin het in pretparken een stuk drukker is.',
    definition:
      'Schoolvakanties (zomervakantie, kerstvakantie, paasvakantie en herfstvakantie) zijn de belangrijkste oorzaak van druktepieken in pretparken. Gezinnen met kinderen zijn de grootste groep bezoekers, en zij komen vooral in die weken. Parken verlengen dan vaak hun openingstijden, breiden het programma uit en verhogen de prijzen. Wie korter wil wachten, kan het best de schoolvakanties mijden.',
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
    shortDefinition: 'Attractie die een bewegend platform combineert met filmprojectie.',
    definition:
      'Een bewegingssimulator combineert een hydraulisch of elektrisch aangedreven platform met een groot filmdoek. Het platform beweegt mee met wat er in de film gebeurt, zonder dat er rails nodig zijn. De capaciteit is vaak hoog, en het park kan de attractie vernieuwen door een andere film te draaien. Voorbeelden: Star Tours (Disney), Mystic Manor (HKDL).',
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
    name: 'Karakterontmoeting',
    shortDefinition: 'Een gepland moment om een gekostumeerd personage van het park te ontmoeten.',
    definition:
      'Een karakterontmoeting is een vaste plek of een gepland moment waar gasten gekostumeerde personages kunnen ontmoeten, met ze op de foto kunnen en een handtekening kunnen krijgen. In Disney- en Universal-parken is dat heel gewoon; populaire personages hebben vaak een eigen ontmoetingsplek met een eigen wachtrij.',
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
    shortDefinition: 'Zelfbedieningsrestaurant zonder bediening aan tafel.',
    definition:
      'Een snelrestaurant (ook counter service of fast casual) is een parkrestaurant waar gasten aan een balie bestellen en hun eten zelf naar een tafel brengen. Het is de meest voorkomende vorm van horeca in een pretpark, en je bent er snel klaar. Disney maakte de term “quick service” gangbaar, om het in zijn reserveringssysteem te onderscheiden van “table service”.',
    relatedTermIds: ['character-dining', 'table-service'],
    aliases: ['counter service', 'fastfood', 'zelfbediening', 'quick service', 'snelle hap'],
  },
  {
    id: 'table-service',
    name: 'Tafelservice',
    shortDefinition: 'Zitrestaurant met bediening, waar reserveringen vaak nodig zijn.',
    definition:
      'In een tafelservicerestaurant in een pretpark eet je aan tafel en word je bediend. Reserveren (bij Disney-parken vaak 60–180 dagen vooruit mogelijk) is sterk aan te raden, omdat populaire restaurants snel vol zitten, vooral in het hoogseizoen. Tafelservice is een stuk duurder dan een snelrestaurant; het eten is doorgaans beter en je zit rustiger.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    aliases: ['table service', 'zitrestaurant', 'bediening aan tafel', 'reserveringsrestaurant'],
  },
  {
    id: 'character-dining',
    name: 'Karakterdiner',
    shortDefinition:
      'Restaurant waarbij gekostumeerde personages langs de tafels komen tijdens de maaltijd.',
    definition:
      'Een karakterdiner is een maaltijd met bediening aan tafel (of soms een buffet) waarbij gekostumeerde personages langs elke tafel komen, met de gasten praten, op de foto gaan en handtekeningen geven. Zo ontmoet je de personages zonder aparte wachtrij. Voorbeelden: Chef Mickey’s (Disney World) en het Prinsessen Storybook Diner in Auberge de Cendrillon (Disneyland Paris).',
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
      'Een wildwaterbaan (ook log flume of boomstambootje) is een waterattractie waarbij gasten in boomstamvormige bootjes door een watergevuld kanaal glijden. Na rustigere secties volgt een steile helling waarbij het bootje in een waterbekken plonst en passagiers vrijwel zeker nat worden. Wildwaterbanen bestaan sinds de jaren 1960 en staan inmiddels in parken over de hele wereld. Ze zijn geschikt voor gezinnen, hebben een gemiddelde capaciteit en zijn vooral op warme dagen druk. Bekende Europese voorbeelden: Poseidon in Europa-Park en talrijke wildwaterbanen in Duitstalige parken.',
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    aliases: ['boomstambootje', 'log flume', 'plonsbaan', 'wildwaterrit', 'waterglijbaan'],
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
      'Een pendelattractie is een type flat ride waarbij een gondel hangt aan een lange arm die in een steeds grotere boog heen en weer slingert, vaak tot bijna loodrecht. Tegelijk draait de gondel om haar eigen as, zodat slingeren en draaien samengaan.\n\nHet bekendste voorbeeld is de Frisbee (Mondial), een schijfvormige gondel die al slingerend ronddraait. Andere veelvoorkomende pendelattracties zijn de KMG Afterburner en de Intamin Giant Frisbee. Pendelattracties staan in pretparken en op kermissen; ze vallen van ver op en nemen relatief weinig grond in.',
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
      'De Enterprise is een attractie waarbij gondels zijn gerangschikt rond de omtrek van een grote roterende ring. Naarmate de ring versnelt, drukt de centrifugale kracht de passagiers stevig in hun stoelen; bij maximale snelheid kantelt de hele ring geleidelijk naar een bijna verticale positie, zodat de passagiers bovenin ondersteboven gaan.\n\nHuss Rides ontwikkelde de Enterprise; later bouwden ook andere fabrikanten hem. Vanaf de jaren 1970 stond hij in veel vaste parken en op veel kermissen. Rechtop gekanteld is de ring van ver te zien.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition:
      'Een schommelbootattractie: een grote gondel in de vorm van een Vikingschip of piratenschip die in een steeds bredere boog schommelt.',
    definition:
      'De Ranger is het schommelbootmodel van Huss Rides: een grote gondel in de vorm van een Vikingschip of piratenschip dat heen en weer schommelt in een boog, waarbij elke schommel hoger wordt. Passagiers zitten langs de zijkanten van het schip, naar binnen gericht. Bij de hoogste uitslag staat de gondel steil, en bovenin werken sterke negatieve G-krachten.\n\nSchommelbootattracties worden wereldwijd door veel fabrikanten geproduceerd onder verschillende namen (Viking, Pirate Ship, Sea Monster). De Ranger behoort tot de meest wijdverspreide Huss-attractiemodellen, te vinden in permanente parken en op reizende kermissen door heel Europa en daarbuiten.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: [
      'swinging ship',
      'swinging ships',
      'pirate ship ride',
      'Viking ship ride',
      'schommelboot',
      'piratenschip',
      'Vikingschip',
    ],
    alternateNames: ['Huss Ranger', 'Vikingschip', 'piratenschip'],
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
    aliases: ['bijna-botsing element', 'near miss', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Tafelreservering',
    shortDefinition: 'Vooruitboeking voor een tafelservice-restaurant in een pretpark of resort.',
    definition:
      'Een tafelreservering is een vooruitboeking voor een tafelservice- of karakterdiner-restaurant in een pretpark, resorthotel of aanverwant entertainmentcomplex. Bij Disney-parken zijn reserveringen tot 60 dagen van tevoren mogelijk (met 10 dagen voorsprong voor resorthotelgasten) en voor de populairste restaurants zijn ze nodig: wie niet op tijd boekt, komt er in drukke periodes niet in. Reserveringen worden gewoonlijk gegarandeerd met een creditcard; Disney brengt kosten in rekening bij een no-show of late annulering. Onder fans heet een tafelreservering ook wel ADR (Advance Dining Reservation).',
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
    name: 'Mobiel Bestellen',
    shortDefinition:
      'App-functie waarmee gasten eten vooraf kunnen bestellen en betalen zonder aan de balie te wachten.',
    definition:
      'Met mobiel bestellen bekijken gasten in de officiële park-app het menu van een restaurant, bestellen en betalen ze, en kiezen ze een ophaaltijd, zonder aan de balie in de rij te staan. Disney maakte het systeem bekend in zijn snelrestaurants; Universal, Six Flags, Merlin-parken en vele andere operators hebben sindsdien hun eigen versies ingevoerd. Wanneer het gekozen tijdvak aanbreekt, ontvangen gasten een melding om naar het speciale mobile-order-afhaalpunt te gaan. Mobiel bestellen bespaart op drukke middagen veel tijd. Je hebt er wel een opgeladen smartphone en bereik in het park voor nodig.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['mobiele bestelling', 'mobile order', 'app-bestelling', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Grote gedeelde eetzaal met meerdere snelrestaurant-balies en verschillende keukens onder één dak.',
    definition:
      'Een food court is een gemeenschappelijke horecazone met meerdere zelfstandige snelrestaurant-balies of kraampjes die verschillende keukens aanbieden en een gezamenlijke zitruimte delen. In pretparken zijn food courts doorgaans de horecalocaties met de hoogste capaciteit, gebouwd voor de drukte rond lunchtijd. Leden van een gezelschap kunnen bij verschillende balies bestellen en toch samen zitten. Hoe ver de aankleding gaat, verschilt: Disney en Universal passen food courts vaak in het thema van het gebied in, andere parken houden het bij een functionele eetzaal bij de ingang. Food courts zijn in de regel de meest betaalbare eetoptie binnen een park.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['eetplein', 'eetzaal', 'food court', 'restaurantplein'],
  },
  {
    id: 'capacity-closure',
    name: 'Capaciteitssluiting',
    shortDefinition:
      'Wanneer een park geen nieuwe bezoekers meer toelaat omdat de maximumcapaciteit is bereikt.',
    definition:
      'Een capaciteitssluiting (ook: uitverkocht park of capaciteitsplafond) treedt op wanneer een pretpark zijn maximaal toegestane of operationeel veilige bezoekersaantal bereikt en tijdelijk stopt met het verkopen van dagtickets of het toelaten van nieuwe bezoekers. Parken sturen capaciteit bij via tijdgebonden toegangsboekingen, realtime bezoekerstellingen en tijdelijke ingangssluitingen. Jaarkaarthouders kunnen op capaciteitsdagen afhankelijk van de parkregels worden geweigerd; andere parken gebruiken reserveringssystemen die overbezetting van tevoren voorkomen. Capaciteitssluitingen zijn het meest voorkomend tijdens schoolvakantiepieken, vuurwerkevenementen en speciale evenementenavonden. Kijk op de ochtend van je bezoek in de park-app of op sociale media of het park nog bezoekers toelaat.',
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    aliases: ['park vol', 'park uitverkocht', 'capacity closure', 'capaciteitsgrens', 'volzit'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Een zero-G roll-variant met een ingebouwde richtingsverandering, zodat de trein de inversie op een andere koers verlaat dan hij erin ging.',
    definition:
      'De zero-G winder is een zero-G roll (een inversie van 360 graden langs een parabolische boog, waarbij de rijders bovenin bijna gewichtloos zijn) met een richtingsverandering erin. Bij een gewone zero-G roll rijdt de trein er in dezelfde richting uit als hij erin ging. Bij de winder buigt de baan tijdens de rotatie af, zodat de trein er in een duidelijk andere richting uitkomt. Zo is het element tegelijk een inversie en de overgang naar het volgende deel van het parcours.\n\nZero-G winders zitten vooral in nieuwere ontwerpen van Intamin en B&M. Voorbeelden zijn Kondaa in Walibi Belgium en VelociCoaster in Universal’s Islands of Adventure.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Een uitgerekt, asymmetrisch dubbel-inversie-element waarbij twee inversies verbonden zijn door een lange gebogen boog, die van bovenaf gezien de vorm van een banaan heeft.',
    definition:
      'De banana roll is een uitgerekte vorm van een element met twee inversies. De twee inversies liggen verder uit elkaar dan bij een gewone cobra roll en zijn verbonden door een brede, gebogen sectie. Van bovenaf gezien loopt de baan in een geleidelijke boog door beide inversies, als de kromming van een banaan. Zo zijn de twee inversies over een langer stuk baan verdeeld.\n\nDe banana roll verscheen voor het eerst in 2011 op Takabisha in Fuji-Q Highland, Japan, gebouwd door Gerstlauer. S&S Worldwide ontwikkelde later een eigen, dubbel-inverterende variant voor Steel Curtain in Kennywood. Het element heeft veel ruimte opzij nodig en staat daarom meestal op grotere banen dicht bij de grond, waar het spoor tussen de twee inversies breed kan uitzwaaien.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Gekantelde Looping',
    shortDefinition:
      'Een verticale looping die schuin staat ten opzichte van zijn loodrechte as, zodat de trein de looping schuin in- en uitrijdt.',
    definition:
      'Een gekantelde looping (Engels: inclined loop of tilted loop) is een standaard verticale looping die om zijn as is gedraaid, doorgaans met 45 tot 80 graden ten opzichte van de rijrichting. Bij een gewone looping rijdt de trein recht in en recht weer uit; bij een gekantelde looping gaat dat schuin.\n\nDe aanloop voelt daardoor meer zijdelings aan dan bij een gewone looping, en de uitgang onderin de cirkel komt van een onverwachte kant. Gekantelde loopings komen voor op diverse B&M- en Intamin-achtbanen, vaak in het midden of het einde van een parcours.',
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
      'Verstrengelde loops (Engels: interlocking loops) zijn twee verticale loops waarvan de vlakken elkaar snijden, meestal bijna loodrecht. Vanuit sommige hoeken lijkt de ene loop door de andere heen te gaan, als twee schakels van een ketting of een reusachtige acht. Het is lastig om de twee loops zo te bouwen dat de sporen elkaar niet raken.\n\nVerstrengelde loops komen vooral voor op inverted coasters van B&M en op zitachtbanen met veel inversies. Dragon Khan in PortAventura heeft verstrengelde loops in zijn parcours met acht inversies.',
    relatedTermIds: ['b-and-m', 'inversion', 'vertical-loop'],
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
    aliases: ['head chopper', 'bijna-botsing', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Wanneer een operator de beugels te strak aandrukt, zodat de rijder minder comfortabel zit en minder airtime voelt.',
    definition:
      'Bij stapling drukt een operator de schootbeugel of schouderbeugel, met opzet of uit overvoorzichtigheid, veel strakker aan dan de veiligheid vereist. De term komt van het Engelse to staple (nieten): je zit als het ware aan de stoel “vastgeniet”. Op achtbanen die op airtime zijn gebouwd, hoort een schootbeugel juist wat ruimte te laten, zodat de rijder bovenop een heuvel iets uit de stoel omhoog kan komen. Wie gestapled is, blijft de hele rit op de stoel gedrukt en voelt van die airtime weinig, hoe goed de heuvels ook zijn ontworpen.\n\nHet speelt vooral op houten en hybride achtbanen, waar airtime de hoofdzaak is. Hoe strak de beugels worden aangedrukt, verschilt per park.',
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
      'Wanneer een achtbaantrein halverwege genoeg vaart verliest om vast te komen zitten in een laagpunt van de baan en de rit niet kan afmaken.',
    definition:
      'Valleying treedt op wanneer een trein tijdens de rit te veel kinetische energie heeft verloren, onvoldoende snelheid meer heeft om het volgende element te overwinnen en tot stilstand komt (of terugrolt) in een dal tussen twee hoge punten op de baan. Omdat de trein nu op een laagpunt staat en niet op een remzone of in het station, kunnen de normale bedrijfssystemen hem niet bewegen. Berging vereist doorgaans onderhoudspersoneel dat de trein met de hand over het volgende hoge punt duwt of met een lier omhoogtrekt en de rijders evacueert.\n\nValleying is zeldzaam onder normale bedrijfsomstandigheden, omdat achtbanen met ruime snelheidsmarges zijn ontworpen. Het gebeurt eerder bij ongewoon koud weer (wanneer de wiellagers stroef lopen), na te veel remmen door trimremmen, of op verouderde houten achtbanen waarvan de baangeometrie in de loop der tijd is verschoven.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'vastgelopen trein', 'trein in dal'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Een achtbaantype met kleine individuele wagentjes en een compact circuit van strakke, vlakke haarspeldbochten aan de rand van verhoogde platforms.',
    definition:
      'Een wild mouse (wilde muis) gebruikt kleine wagentjes van twee tot vier personen in plaats van lange treinen. Typisch is een reeks krappe, nauwelijks gekantelde haarspeldbochten aan de buitenrand van de baan. Omdat de bochten, anders dan bij andere achtbanen, bijna niet gekanteld zijn, worden de rijders zijwaarts tegen de wand van het wagentje gedrukt. Door de aanloop lijkt elke bocht later te komen dan je verwacht, en even lijkt het of het wagentje van de baan glijdt.\n\nEen wild mouse neemt weinig ruimte in: doordat de lagen haarspeldbochten boven elkaar liggen, past er veel baan op een klein grondoppervlak. Ze zijn wereldwijd te vinden bij parken van uiteenlopende grootte. Fabrikanten zijn onder meer Mack Rides, Maurer en Gerstlauer.',
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
      'Een fourth dimension coaster (4D-coaster) is een ontwerp waarbij de passagiersstoelen niet vast aan de trein zijn bevestigd, maar op zwenkbare armen die links en rechts van elke wagen uitsteken. De stoelen kunnen naar voren of achteren draaien onafhankelijk van de rijrichting – aangestuurd door een vaste stuurrail naast de hoofdbaan (die de stoelpositie op elk moment van het parcours bepaalt) of door vrije rotatie aangedreven door zwaartekracht en gewichtsverdeling. Zo kunnen passagiers tijdens een afdaling recht naar beneden kijken, in een bocht ondersteboven hangen of in een inversie om meerdere assen tegelijk draaien.\n\nArrow Dynamics ontwikkelde het concept en S&S Worldwide werkte het later verder uit. X2 in Six Flags Magic Mountain (Californië) opende in 2002 als eerste 4D-coaster en is de bekendste. Eejanaika in Fuji-Q Highland, Japan, heeft het record voor het grootste aantal inversies van alle achtbanen, mede doordat de draaiende stoelen het aantal inversies vermenigvuldigen.',
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
      'Een achtbaanparcours dat rechtlijnig van het station wegloopt, aan het einde van het terrein omkeert en parallel terugkeert.',
    definition:
      'Een out-and-back is een van de twee fundamentele achtbaanparcourstypen. De trein verlaat het station, rijdt ongeveer rechtdoor weg, meestal over een reeks heuvels voor airtime, keert aan het einde van het terrein en komt terug over een parcours naast het heentraject. De twee helften kruisen elkaar zelden, en het grondplan is lang en smal.\n\nVeel traditionele houten achtbanen zijn out-and-backs. De snelheid van het lange heentraject wordt op de terugweg gebruikt voor een reeks steeds lagere heuvels met veel floater-airtime. Bekende voorbeelden zijn The Voyage in Holiday World en diverse Racer-modellen.',
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
      'Een seizoensattractie is een rit, show of ander onderdeel dat het park alleen in een bepaalde periode van het jaar heeft. Ijsbanen, rodelbanen en winterse shows draaien doorgaans van november tot februari; wildwaterbanen, waterspeelgebieden en openluchtspectakels van mei tot september. Sommige seizoensattracties zijn gekoppeld aan specifieke evenementen zoals Halloween of Kerst.\n\nOp park.fan worden seizoensattracties en -shows automatisch herkend aan de hand van historische bedrijfsgegevens. Buiten hun actieve maanden zijn ze verborgen in de tabbladen van het park en op de kaart, zodat alleen overblijft wat er vandaag open is. Een seizoensbadge (❄️ Winter, ☀️ Zomer of 🍃 generiek) staat op elke betreffende kaart. Als de attractie buiten seizoen is, is de badge gedempt. Een filterknop in de tabbladen laat verborgen items zien wanneer dat nodig is.',
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
    relatedTermIds: ['hybrid-coaster', 'rmc', 'wooden-coaster'],
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
      'KMG (Kermis Machinebouw Gaashte) is een Nederlands bedrijf dat gespecialiseerd is in het ontwerpen en bouwen van attracties voor de kermis. KMG-attracties zijn zo gebouwd dat ze snel en zonder zware kranen op te bouwen zijn. Het bekendste model is de Afterburner (vaak Fireball genoemd), een pendelattractie met naar binnen gerichte stoelen die zwaaien en draaien. Andere modellen zijn de Freak Out en de Speed.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
    aliases: ['KMG Rides'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition: 'Technologiebedrijf dat voertuigsystemen voor dark rides bouwt.',
    definition:
      'Oceaneering Entertainment Systems (OES) is een divisie van Oceaneering International die robotica- en onderwatertechnologie toepast in de pretparksector. Oceaneering maakte de voertuigen van attracties zoals “The Amazing Adventures of Spider-Man” en “Transformers: The Ride” (Universal Studios). Die voertuigen draaien en kantelen tijdens de rit gelijk met de 3D-projecties.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
    aliases: ['Oceaneering Entertainment Systems', 'OES'],
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
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'steel-coaster'],
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
    shortDefinition:
      'Een grote heuvel in de vorm van een kamelenbult ontworpen voor langdurige airtime.',
    definition:
      'De Camelback is het basiselement van elke hyper coaster. Het is een parabolische heuvel waar de trein met hoge snelheid overheen rijdt: op het hoogste punt (de apex) ervaren passagiers een gevoel van gewichtloosheid (airtime). De naam komt van de gelijkenis met de bult van een kameel. Hoe scherper de top, hoe sterker de airtime (van floater tot ejector).',
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
      'De Strata Coaster is een categorie achtbanen die uitsluitend door hoogte wordt gedefinieerd. De term werd bedacht door Cedar Point voor de opening van Top Thrill Dragster in 2003. Er zijn wereldwijd slechts twee Strata Coasters voltooid: Kingda Ka (Six Flags Great Adventure) en Top Thrill 2 (Cedar Point). Ze halen extreme snelheden en hebben verticale afdalingen vanaf recordhoogte.',
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
    aliases: ['bijna-botsing', 'near miss effect'],
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
    shortDefinition: 'Canadese fabrikant bekend om complexe ritsystemen, waaronder de Robocoaster.',
    definition:
      'Dynamic Attractions is een attractiebouwer van technisch complexe ritsystemen. Het bekendste systeem is de “Robocoaster”-robotarm, die onder meer in Harry Potter and the Forbidden Journey wordt gebruikt. Het bedrijf bouwt ook spoorsystemen, bewegingstheaters en constructiedelen voor grote themaparken over de hele wereld.',
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
      'Een shuttle coaster is een type achtbaan dat van een station naar een eindpunt rijdt (vaak een verticale spike), dan van richting verandert en terugkeert naar het station. Omdat de baan geen gesloten lus vormt, rijden gasten het hele parcours zowel vooruit als achteruit.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
  },
  {
    id: 'carousel',
    name: 'Carrousel',
    shortDefinition:
      'Een klassieke draaiende attractie met zitplaatsen, vaak in de vorm van paarden.',
    definition:
      'Een carrousel (of draaimolen) is een traditionele draaiende attractie met een cirkelvormig platform met gedecoreerde zitplaatsen. Deze zitplaatsen hebben meestal de vorm van paarden of andere dieren en bewegen vaak op en neer om het galopperen te simuleren. Bijna elk attractiepark heeft een carrousel, en ook de kleinsten kunnen erin.',
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
      'Een klassieke walkthrough-attractie vol fysieke obstakels en optische illusies.',
    definition:
      'Een funhouse is een traditionele walkthrough-attractie met obstakels zoals bewegende vloeren, draaiende tonnen, lachspiegels en glijbanen. Funhouses staan vooral op kermissen, maar ook veel vaste parken hebben er een, vaak groter en met meer interactieve onderdelen.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Reuzenrad',
    shortDefinition:
      'Een groot, verticaal draaiend wiel met gondels voor passagiers, die uitkijken over de omgeving.',
    definition:
      'Een reuzenrad is een enorm, verticaal draaiend wiel met gondels of cabines aan de rand. Vanuit de gondels kijken de gasten uit over het park en het landschap eromheen.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Spike',
    shortDefinition:
      'Een verticale of steil hellende doodlopende railsectie op een shuttle coaster.',
    definition:
      'Een spike is een verticaal of steil hellend stuk baan op een shuttle coaster dat abrupt eindigt. De trein rijdt de spike op tot hij zijn vaart verliest en valt dan in de tegenovergestelde richting terug. Spikes zijn veelvoorkomende kenmerken op gelanceerde shuttle coasters.',
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
      'Praktische effecten zijn fysieke speciale effecten die live op locatie worden gecreëerd, zoals animatronics, water, echt vuur, mist en fysieke rekwisieten. Het tegenovergestelde zijn digitale effecten op schermen.',
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
      'Bij een in-show exit verlaten gasten een voertuig terwijl het nog tussen de decors van de attractie staat, meestal bij een technische storing of een evacuatie. Het personeel brengt de gasten dan over looppaden door de backstage-gedeelten van de attractie naar buiten.',
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
      'Een beyond-vertical drop is steiler dan 90 graden: de baan buigt onder zichzelf terug, zodat de rijders even voorbij de verticaal kantelen en licht achterover naar de constructie kijken. Het Euro-Fighter-model van Gerstlauer maakte het type bekend met afdalingen rond 95–97°, en B&M en anderen hebben dive coasters gebouwd met vergelijkbare overhangende eerste dalingen. Attracties als Mumbo Jumbo en Takabisha hielden records voor de steilste afdaling van dit type.',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'afdaling voorbij de verticaal'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'Het door water afgeremde slot van een waterattractie of water coaster, waar de boot een bak raakt en een golf opwerpt.',
    definition:
      'Een splashdown is het moment waarop een boot of wagen aan de voet van een daling in een ondiep waterkanaal duikt, waarbij het water het voertuig afremt en hoog opspat. Op water coasters en wildwaterbanen worden de rijders hier nat. Met de diepte en de vorm van de bak bepalen ontwerpers hoe nat de rijders worden, en ook de toeschouwers op bruggen in de buurt.',
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
      'Een dubbelspoor-inversie van Mack Rides: twee racende treinen gaan over een gedeelde heuvel terwijl hun sporen om elkaar heen draaien – de een rolt omhoog, de ander omlaag.',
    definition:
      'Een celestial spin is een door Mack Rides gepatenteerde dubbelspoor-inversie en het kenmerkende element van [Stardust Racers](/nl/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), de duellerende lanceerachtbaan in [Universal Epic Universe](/nl/parks/north-america/united-states/orlando/universal-epic-universe). Terwijl de twee racende treinen over een gedeelde heuvel komen, draaien hun sporen om elkaar heen: de ene trein rolt via een zero-G-roll omhoog terwijl de andere op exact hetzelfde moment via een barrel roll omlaag rolt – de wagens lijken in de lucht om elkaar heen te spiralen.\n\nOmdat beide rollen op de airtime-heuvel zijn afgestemd, zweven rijders een lang, gewichtloos moment terwijl de zustertrein op slechts enkele meters afstand voorbijdraait. Bekijk het frontaal in het vooraanzicht om te zien hoe de twee sporen om elkaar heen winden, schakel naar de volgmodus om het duel te volgen, of kies de camera aan boord om de horizon te zien kantelen terwijl de andere trein over je heen gaat. Nauw verwant aan de zero-G-roll, de inversie en de airtime-heuvel.',
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
      'Een swing launch (ook shuttle- of multi-passlancering) versnelt de trein, laat hem uitlopen op een stijgend stuk baan, vangt hem op de terugweg weer op – en herhaalt dat twee of drie keer tot er genoeg energie is voor de hele rit. Elke passage voegt snelheid toe die de motoren in één keer niet zouden halen. Zo haalt een swing launch op een veel kortere lanceerbaan een veel hogere topsnelheid.\n\nDe bezoekers rijden daarbij een deel van het parcours achteruit, meestal een verticale spike op, voordat ze weer vooruit worden geschoten. [Toutatis](/nl/parks/europe/france/plailly/parc-asterix/toutatis) in Parc Astérix, [The Ride to Happiness](/nl/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) in Plopsaland en [Oath of Kärnan](/nl/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) in Hansa-Park gebruiken er een. Premier Rides bouwt met het model Sky Rocket II een hele compacte achtbaan rond dit idee.',
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
      'Een verticale lift vervangt de gebruikelijke helling van 30 tot 45 graden door een stuk baan dat loodrecht omhoog gaat. Omdat een gewone ketting met terugloopbeveiliging een trein op een verticaal vlak niet betrouwbaar kan houden, gebruiken deze liften een kabel, een catch-car of een ketting met formsluitende meenemer. Bezoekers liggen de hele klim op hun rug en kijken recht de lucht in.\n\nDe verticale lift hoort bij de Euro-Fighter- en Infinity Coaster-modellen van Gerstlauer, waar hij direct overgaat in een overhellende afdaling: [Takabisha](/nl/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) in Fuji-Q Highland klimt verticaal en duikt dan met 121 graden, de steilste afdaling van alle stalen achtbanen. [Oath of Kärnan](/nl/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) in Hansa-Park gebruikt een verticale lift van 73 meter in een gesloten toren, zodat je in het donker omhoog gaat. Niet te verwarren met een liftkooi, waarbij het baanstuk zelf met de trein omhoog gaat.',
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
      'Een element van Mack Rides: de baan buigt voorbij verticaal in een overhang, zodat de trein achteruit tegen een muur van 105 graden op klimt.',
    definition:
      'De scorpion tail is een lanceerspike die niet stopt bij verticaal. In plaats van tot 90 graden te stijgen en de trein daar te houden, buigt de baan door de verticaal heen en helt terug tot ongeveer 105 graden, zodat er een overhang ontstaat. Een gelanceerde trein klimt ondersteboven en licht achterwaarts omhoog, hangt op het hoogste punt en valt dezelfde weg terug.\n\nMack Rides bouwde de eerste in 2024 voor [Voltron Nevera](/nl/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) in [Europa-Park](/nl/parks/europe/germany/rust/europa-park), waar het de steilste lanceersectie van alle achtbanen ter wereld is. De hangtime ontstaat hier zonder voorwaartse beweging: bovenin word je alleen nog vastgehouden door de vorm van de baan en de resterende vaart van de trein. De naam komt van het silhouet – een staart die omhoog en over zichzelf heen krult.',
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
      'Een indoor-achtbaan rijdt haar hele parcours in een gesloten showgebouw. Zonder daglicht zie je geen afdaling of bocht aankomen, en daardoor voelt een bescheiden parcours veel heftiger aan dan hetzelfde spoor in de buitenlucht. Binnen heeft de ontwerper ook licht, projectie, geluid en decor volledig in de hand, en daarom zijn de meeste combinaties van achtbaan en darkride indoor-achtbanen.\n\nHet bekendste voorbeeld is Space Mountain. [Disneyland](/nl/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) opende zijn versie in 1977, en geen andere donkere achtbaan is zo vaak nagebouwd. Europese voorbeelden zijn [Eurosat](/nl/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) en [Euro-Mir](/nl/parks/europe/germany/rust/europa-park/euro-mir) in Europa-Park, Eftelings [Vogel Rok](/nl/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) en Phantasialands [Crazy Bats](/nl/parks/europe/germany/bruehl/phantasialand/crazy-bats), nog steeds de langste indoor-achtbaan die er is.',
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
      'De Infinity Coaster is Gerstlauers huidige platform voor maatwerkbanen. Hij heeft de overhellende afdalingen, verticale liften en parcoursen op zeer weinig grond van de Euro-Fighter. De hoekige vierpersoonswagens zijn vervangen door langere, lagere treinen met open zijkanten, en de schouderbeugels door vestbeugels. Hij rijdt merkbaar soepeler en kan meer airtime hills aan, waar het oudere model slecht mee overweg kon.\n\nHet gamma loopt van compacte opvulbanen tot recordhouders: [The Smiler](/nl/parks/europe/united-kingdom/farley/alton-towers/the-smiler) in Alton Towers houdt met veertien inversies het wereldrecord, [Oath of Kärnan](/nl/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) in Hansa-Park combineert een verticale lift van 73 meter met een swing launch, en [Star Trek: Operation Enterprise](/nl/parks/europe/germany/bottrop/movie-park-germany/star-trek-operation-enterprise) in Movie Park Germany rijdt het model als multi-launchshuttle.',
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
      'Een uitkijktoren voert een beglaasde of open gondel langs een middenzuil omhoog, meestal draaiend zodat elke plek het volledige panorama krijgt, houdt bovenin stil en laat weer zakken. Mechanisch is het een naaste verwant van de valtoren, en de twee worden vaak verward. Het verschil zit in wat er bovenin gebeurt: een uitkijktoren zakt langzaam weer, een valtoren laat de gondel vallen.\n\nIn een park is een uitkijktoren vooral een herkenningspunt in de skyline, al vanaf de parkeerplaats te zien. De [Euro-Tower](/nl/parks/europe/germany/rust/europa-park/euro-tower) in Europa-Park staat er sinds 1979.',
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
      'De QUICK Pass is de betaalde manier om in Phantasialand de wachtrij voorbij te gaan. Anders dan in de meeste parken koop je hem per attractie en niet per dag, voor banen als Taron, Black Mamba, Chiapas, Talocan en Maus au Chocolat.\n\nJe koopt hem in de app van het park of in het park zelf; de prijs per attractie ligt vast en beweegt niet mee met de drukte.\n\nOok bij de QUICK Pass-ingang staat een rij, alleen een veel kortere.',
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
    aliases: ['Hoofdattractie'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
];

export default translations;
