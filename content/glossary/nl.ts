import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Wachttijd',
    shortDefinition:
      'De geschatte tijd die een bezoeker in de rij moet staan voordat hij een attractie kan betreden.',
    definition:
      'De wachttijd is de geschatte duur die een bezoeker in de rij staat voordat hij een attractie kan betreden. Parken geven wachttijden aan bij attractie-ingangen en in hun apps. park.fan houdt live wachttijden bij die elke minuut worden bijgewerkt.',
    relatedTermIds: ['posted-wait-time', 'virtual-queue', 'single-rider', 'express-pass'],
    aliases: ['Wachttijden'],
    alternateNames: ['Queue Time', 'Wachttijd in de rij'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Een aparte rijstrook voor bezoekers die bereid zijn alleen te rijden om lege plaatsen te vullen.',
    definition:
      'De Single Rider-rij stelt bezoekers in staat die bereid zijn alleen te rijden, lege plaatsen in attractievoertuigen te vullen. Omdat Single Riders in de gaten worden geplaatst, beweegt de rij veel sneller dan de normale rij — vaak 50–70% kortere wachttijden. Niet alle attracties bieden deze optie; controleer dit voordat je aansluit.',
    alternateNames: ['Single Rider Lane', 'Individuele rij'],

    relatedTermIds: ['wait-time', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'virtual-queue',
    name: 'Virtuele wachtrij',
    shortDefinition:
      'Een digitaal wachtrij systeem waarbij bezoekers een rijtijd reserveren in plaats van fysiek te wachten.',
    definition:
      'Een virtuele wachtrij stelt bezoekers in staat zich aan te melden voor een attractie via een app of kiosk en een melding te ontvangen wanneer hun beurt nadert. In plaats van fysiek in de rij te staan, kunnen bezoekers andere parkgebieden verkennen en terugkeren wanneer ze worden opgeroepen.',
    relatedTermIds: ['express-pass', 'wait-time', 'single-rider'],
    aliases: ['Virtuele wachtrijen'],
  },
  {
    id: 'express-pass',
    name: 'Express Pas',
    shortDefinition:
      'Een betaald of inbegrepen ticket-upgrade die toegang geeft tot een kortere prioriteitsrij.',
    definition:
      'Een Express Pas (de naam varieert per park — Universal Express, Disney Lightning Lane, enz.) is een upgrade waarmee houders een speciale prioriteitsingang kunnen gebruiken met aanzienlijk kortere wachttijden. Gebruik de druktecalender van park.fan om te beslissen of een Express Pas de kosten waard is.',
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['virtual-queue', 'single-rider', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: 'Aangegeven wachttijd',
    shortDefinition:
      'De officiële wachttijd die het park bij de ingang van een attractie weergeeft.',
    definition:
      'De aangegeven wachttijd is de officiële schatting weergegeven op borden bij de fysieke ingang van een attractie en/of in de officiële park-app. park.fan aggregeert aangegeven wachttijden van officiële bronnen elke minuut.',
    relatedTermIds: ['wait-time', 'crowd-level'],
  },
  {
    id: 'crowd-level',
    name: 'Drukte-niveau',
    shortDefinition:
      'Een maat voor hoe druk een pretpark is op een bepaalde dag, van Zeer Laag tot Extreem.',
    definition:
      'Het drukte-niveau beschrijft de algehele bezoekerdichtheid in een park op een bepaalde dag of tijd. park.fan gebruikt een schaal van Zeer Laag tot Extreem op basis van historische wachttijdgegevens, huidige bezetting en AI-voorspellingen.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Drukte-niveaus'],
  },
  {
    id: 'crowd-calendar',
    name: 'Druktekalender',
    shortDefinition:
      'Een dag-voor-dag voorspelling met verwachte drukteniveaus om de bezoek te plannen.',
    definition:
      'Een druktekalender is een maand- of jaaroverzichtskalender die voorspelde drukteniveaus voor elke dag toont. park.fan genereert druktekalenders met behulp van AI-modellen die zijn getraind op jaren historische wachttijdgegevens, gecombineerd met schoolvakantiescalenders, aankomende evenementen en seizoenspatronen.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
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

    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
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
      'Stilstandtijd verwijst naar een ongeplande, tijdelijke sluiting van een attractie — onderscheiden van een geplande renovatie. Stilstandtijden worden veroorzaakt door technische storingen, veiligheidscontroles, bezoekersincidenten of ongunstige weersomstandigheden. park.fan toont de huidige operationele status van elke bijgehouden attractie in realtime.',
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
    relatedTermIds: ['wait-time', 'downtime', 'refurbishment'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Het moment waarop een park officieel zijn poorten opent en de rijen voor populaire attracties het kortst zijn.',
    definition:
      "De Rope Drop verwijst naar het moment waarop een pretpark voor de dag opent — vernoemd naar het letterlijke touw (of barrière) dat parkpersoneel laat zakken om de eerste bezoekers binnen te laten. Vroeg aankomen bij de Rope Drop is een populaire strategie omdat populaire attracties 's ochtends de kortste rijen hebben, voordat de drukte aantrekt. Het schema van park.fan toont exacte openingstijden zodat je je strategie perfect kunt plannen.",
    aliases: ['Rope-Drop'],

    relatedTermIds: ['crowd-calendar', 'wait-time', 'crowd-level'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'Een exclusief voordeel waarmee hotelgasten het park vóór de reguliere opening kunnen betreden.',
    definition:
      'Early Entry (ook wel Extra Magic Hours of Early Park Entry) stelt gasten van partnerhotels in staat het park 30–60 minuten voor het grote publiek te betreden. Tijdens dit venster zijn de wachtrijen bij populaire attracties aanzienlijk korter. Op drukke dagen kan het combineren van Early Entry met een slimme rijvolgorde betekenen dat je meerdere hoofdattracties met minimale wachttijd ervaart.',
    aliases: ['Vroege toegang'],
    alternateNames: ['Extra Magic Hours', 'Vroeg Erin', 'Early Park Entry'],

    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Een ticketoptie waarmee bezoekers op dezelfde dag meerdere parken van hetzelfde resort kunnen bezoeken.',
    definition:
      "Een Park Hopper-ticket geeft toegang tot twee of meer parken van hetzelfde resort op één dag. Disney's Park Hopper-optie laat gasten bijvoorbeeld schakelen tussen Magic Kingdom, EPCOT, Hollywood Studios en Animal Kingdom na 14:00 uur. Het is bijzonder handig wanneer specifieke attracties of ervaringen verspreid zijn over meerdere parken.",
    aliases: ['Park-Hopper'],
    alternateNames: ['Park Hopping', 'Multi-park ticket'],

    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Jaarkaart',
    shortDefinition:
      'Een jaarticket dat onbeperkte parkbezoeken gedurende 12 maanden mogelijk maakt.',
    definition:
      'Een jaarkaart (Annual Pass) biedt onbeperkte toegang tot één of meer parken gedurende 12 maanden. Hogere niveaus bevatten vaak extra voordelen zoals korting op eten en drinken, gratis parkeren en korting op merchandise. Sommige jaarkaarten hebben geblokkeerde dagen (blockout dates) op de drukste dagen van het jaar. Voor regelmatige bezoekers — doorgaans drie of meer bezoeken per jaar — verdient een jaarkaart zichzelf bijna altijd terug.',
    aliases: ['Seizoenspas'],
    alternateNames: ['Annual Pass', 'Season Pass', 'Jaarticket', 'Jaarabonnement'],

    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Minimumlengte',
    shortDefinition:
      'Een minimumlengte die bezoekers moeten hebben om een specifieke attractie te mogen betreden.',
    definition:
      'De minimumlengte is een veiligheidsregel die parken instellen om te garanderen dat veiligheidssystemen — heupbeugelsloten, schouderbanden, gordels — correct werken voor elke bezoeker. Ze variëren doorgaans tussen 90 en 140 cm, afhankelijk van de intensiteit van de attractie. Sommige attracties hebben ook een maximum lengte of gewichtslimiet. Controleer altijd de minimumlengte voordat je met jonge kinderen op bezoek gaat.',
    aliases: ['Minimumlengtes', 'minimumlengte-eisen'],
    alternateNames: ['Lengtebeperking', 'Lengteeis', 'Vereiste lengte'],

    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Themagebied',
    shortDefinition:
      'Een zelfstandige zone binnen een pretpark gebouwd rondom een samenhangend thema.',
    definition:
      "Een themagebied is een afgebakende zone binnen een pretpark die een eenheid vormt van visueel ontwerp, een verhaalachtergrond en bijpassende attracties, horeca en winkels. Bekende voorbeelden zijn The Wizarding World of Harry Potter bij Universal, Star Wars: Galaxy's Edge bij Disney en Scandinavië bij Efteling. Themagebieden creëren een meeslepende beleving en zijn vaak de meest gefotografeerde delen van het park.",
    aliases: ['Themagebieden'],
    alternateNames: ['Zone', 'Land', 'Themawereld'],

    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'De onofficiële opening van een attractie vóór de aangekondigde lanceringsdatum.',
    definition:
      'Een Soft Opening vindt plaats wanneer een park stilletjes een nieuwe attractie of zone opent vóór de officiële datum — vaak zonder aankondiging. Parken gebruiken Soft Openings om systemen onder reële omstandigheden te testen, operationele problemen op te sporen en laadprocedures te optimaliseren. Omdat ze zonder waarschuwing kunnen beginnen en stoppen, zijn ze een bonus voor gelukkige bezoekers die toevallig aanwezig zijn, maar geen betrouwbare planningsbasis. Fanforums en sociale media zijn doorgaans de eersten die erover berichten.',
    alternateNames: ['Soft Launch', 'Zachte opening'],

    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition: 'De normale wachtrij van een attractie, zonder reservering of speciaal pas.',
    definition:
      'De Standby-rij is de standaard fysieke wachtrij die alle bezoekers zonder extra ticket of upgrade kunnen gebruiken. Wie in de Standby-rij staat, wacht op volgorde van aankomst — de weergegeven wachttijd weerspiegelt direct de huidige drukte bij de attractie. Op drukke dagen kunnen Standby-tijden bij topattracties oplopen tot meer dan 90 minuten. park.fan houdt Standby-wachttijden real-time bij zodat je altijd de kortste rij kunt vinden.',
    aliases: ['Standby-rij'],
    alternateNames: ['Normale Wachtrij', 'Reguliere Rij', 'Gewone wachtrij'],

    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      "Disney's betaalde prioriteitsrijsysteem, de opvolger van het vroegere FastPass+-programma.",
    definition:
      'Lightning Lane is de naam die Disney geeft aan zijn prioriteitsrijsysteem, geïntroduceerd in 2021 als opvolger van het gratis FastPass+-programma. Het bestaat in twee varianten: Individual Lightning Lane (ILL), apart verkocht voor de meest gevraagde attracties, en Lightning Lane Multi Pass (LLMP), een dagelijks abonnement waarmee gasten terugkeertijdslots kunnen reserveren voor een selectie attracties. Lightning Lane heeft veel discussie losgemaakt omdat het een voorheen gratis voordeel omzette in een betaalde dienst. De druktekalender van park.fan helpt je beoordelen op welke dagen Lightning Lane de moeite waard is.',
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      "Disney's voormalige dagelijkse add-on die Lightning Lane Multi Pass-toegang bood voor de meeste attracties.",
    definition:
      "Genie+ (inmiddels omgedoopt tot Lightning Lane Multi Pass) was Disney's betaalde dagelijkse add-on die FastPass+ verving. Voor een per persoon per dag tarief konden gasten telkens één Lightning Lane-terugkeertijdslot reserveren voor een brede selectie attracties. De grootste topattracties waren uitgesloten en werden apart verkocht als Individual Lightning Lane. De prijs van Genie+ was dynamisch en steeg op de drukste dagen. park.fan houdt drukte-niveaus gedetailleerd bij zodat je kunt bepalen of het abonnement de moeite waard is.",
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Een genummerde toewijzing in het virtuele wachtrij-systeem die toegang geeft tot een attractie wanneer de groep wordt opgeroepen.',
    definition:
      "Een Boarding Group is een genummerde toewijzing binnen een virtueel wachtrij-systeem, gebruikt voor de meest gevraagde nieuwe attracties waar een fysieke rij onpraktisch zou zijn. Bezoekers melden zich aan via de park-app — vaak zodra het park opent — en ontvangen een groepsnummer. Wanneer dat nummer wordt opgeroepen, hebben ze een beperkt tijdvenster om zich bij de attractie te melden. Op drukke dagen kunnen alle Boarding Groups binnen enkele minuten vol zijn. Disney's systeem bij attracties als Tron Lightcycle Run en Star Wars: Rise of the Resistance heeft dit concept in de hele parkgemeenschap bekendgemaakt.",
    aliases: ['Boarding Groups'],

    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Laagseizoen',
    shortDefinition:
      'Periodes met minder bezoekers die kortere wachtrijen, lagere prijzen en een rustiger ervaring bieden.',
    definition:
      'Het laagseizoen zijn de rustigere periodes in de kalender, wanneer scholen open zijn en er geen grote feestdagen vallen — doorgaans januari tot begin februari, half september tot oktober (buiten Halloween-evenementen) en de eerste weken van november. In het laagseizoen kunnen wachttijden voor populaire attracties aanzienlijk korter zijn, zijn ticketprijzen vaak het laagst en voelen parken veel minder druk aan. Voor bezoekers met een flexibel schema is het laagseizoen kiezen één van de meest effectieve strategieën. De druktekalender van park.fan markeert laagseizoen-vensters zodat je optimaal kunt plannen.',
    alternateNames: ['Rustige Periode', 'Laagseizoensperiode', 'Laagseizoen'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'Seizoenssluiting',
    shortDefinition:
      'Seizoensgebonden sluitingsperiode waarin het park volledig gesloten is voor onderhoud, verbouwingen of winterpauze en niet toegankelijk is voor het publiek.',
    definition:
      'De seizoenssluiting (of OffSeason) is de periode waarin een pretpark zijn deuren volledig sluit — niet enkel een rustigere periode, maar een echte bedrijfspauze. Parken gebruiken dit venster voor noodzakelijk onderhoud aan attracties en faciliteiten, grootschalige verbouwingen die tijdens normale openingstijden niet mogelijk zijn, en een rustperiode voor het personeel voor het nieuwe seizoen. Seizoenssluitingen vinden het vaakst plaats in de wintermaanden en duren van een paar weken tot meerdere maanden, afhankelijk van het park en het klimaat. Gedurende deze periode zijn geen attracties, restaurants of shows toegankelijk voor het publiek.\n\nWanneer park.fan de status OffSeason toont voor een park, betekent dit dat er geen openingsschema beschikbaar is voor de huidige periode en dat de volgende bevestigde openingsdatum nog enkele weken weg is. Raadpleeg de officiële parkwebsite voor de exacte heropeningsdatum — populaire parken verkopen de eerste dagen na de sluiting vaak snel uit.',
    aliases: ['Off-Season'],
    alternateNames: ['Wintersluiting', 'Seizoenssluiting', 'Seizoenspauze'],

    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Ritfoto',
    shortDefinition:
      'Een automatisch gemaakte foto of video van bezoekers tijdens een attractie, na afloop te koop aangeboden.',
    definition:
      "De ritfoto is een afbeelding die automatisch wordt gemaakt door een vaste camera op een spannend moment van de attractie — typisch de val bij een waterattractie of het hoogtepunt van een achtbaan. Na de rit kunnen bezoekers hun foto bekijken bij een kiosk of in de park-app en kiezen of ze hem willen kopen. Veel parken bieden dagpakketten aan met onbeperkte ritfoto's van alle attracties in het resort. De ritfoto is een geliefd souvenir en een klassiek moment om te delen op sociale media.",
    aliases: ['Rit-Foto', 'On-Ride Foto', 'Attractiefoto'],

    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Wachtrij',
    shortDefinition:
      'Het fysieke wachtgebied dat bezoekers doorlopen voor ze een attractie betreden, vaak thematisch ingericht als onderdeel van de beleving.',
    definition:
      'De wachtrij is de fysieke ruimte — gangen, buitenserpentines of themagekleden zalen binnenin — die bezoekers doorlopen terwijl ze wachten om op een attractie te stappen. In veel moderne pretparken maakt de wachtrij zelf deel uit van de beleving: bij de Haunted Mansion van Disney schept de rij sfeer voordat je überhaupt instapt, terwijl Harry Potter-attracties bij Universal bezoekers al vanaf de wachtrij onderdompelen in hun wereld. Een goed ontworpen wachtrij maakt het wachten veel aangenamer, ook als het lang duurt.',
    relatedTermIds: ['wait-time', 'standby-queue', 'single-rider'],
    aliases: ['Wachtrijen'],
  },
  {
    id: 'opening-day',
    name: 'Openingsdag',
    shortDefinition: 'De officiële lanceringsdatum van een nieuw park, themagebied of attractie.',
    definition:
      'De openingsdag is de officieel aangekondigde datum waarop een nieuw park, uitbreiding of attractie voor het eerst openstaat voor het grote publiek. Dit zijn grote momenten in de pretparkgemeenschap: ze trekken doorgaans veel media-aandacht, lange rijen en een feestelijke sfeer. Parken organiseren vaak openingsceremoniën met speciale entertainment en karakteroptredens. Omdat de openingsdag veel bezoekers trekt, is het zelden de beste dag om een nieuwe attractie te beleven als korte wachttijden een prioriteit zijn. Soft Openings gaan soms aan de officiële openingsdag vooraf.',
    relatedTermIds: ['soft-opening', 'rope-drop', 'crowd-level'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'Een systeem waarmee begeleiders om beurten kunnen rijden terwijl de ander wacht met kinderen die niet aan de minimumlengte voldoen.',
    definition:
      'Rider Switch (ook wel Child Swap genoemd) is een systeem dat in de meeste grote pretparken beschikbaar is en groepen de mogelijkheid geeft om om beurten te rijden wanneer één lid — doorgaans een jong kind dat niet aan de minimumlengte voldoet — niet mee kan. Één volwassene rijdt terwijl de ander bij de ingang wacht met het kind; als de eerste volwassene terugkeert, mag de tweede direct instappen zonder opnieuw in de standby-rij te staan. Bij Disney-parken heet dit systeem Rider Switch; bij Universal is het Child Swap. Op drukke dagen spaart de tweede volwassene zo de volledige wachttijd uit — een groot voordeel. Vraag het attractiepersoneel aan de ingang om dit te activeren.',
    alternateNames: ['Child Swap', 'Rider Switch', 'Kind Wissel', 'Baby Wissel'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Datum',
    shortDefinition:
      'Een datum waarop bepaalde niveaus van de jaarkaart niet geldig zijn voor parktoelating, doorgaans op de drukste dagen van het jaar.',
    definition:
      'Blockout datums (ook wel blackout dates genoemd) zijn specifieke kalenderdagen waarop bepaalde jaarkaart-niveaus niet geldig zijn voor toegang. Parken stellen blockout datums in om de capaciteit op de drukste dagen te beheersen — piekdagen, vakantieweekenden en grote evenementdagen. Hogere niveaus hebben weinig of geen blockout datums, terwijl goedkopere jaarkaarten soms op 30–60 dagen per jaar geblokkeerd zijn. Controleer altijd de blockout-kalender voordat je bezoekt als je een beperkte jaarkaart hebt. De druktekalender van park.fan markeert piekperiodes zodat je dit kunt combineren met je jaarkaartbeperkingen.',
    aliases: ['Geblokkeerde dagen'],
    alternateNames: ['Blackout Datum', 'Blackout Date', 'Uitsluitingsdatum'],

    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Speciaal evenement',
    shortDefinition:
      'Een apart te betalen avond- of speciaal evenement waarvoor je buiten het reguliere parkticket een extra kaartje nodig hebt, zoals Halloween- of kerstfeesten.',
    definition:
      "Een speciaal evenement (hard ticket event) is een apart te betalen evenement — doorgaans 's avonds — dat in een pretpark plaatsvindt en een eigen kaartje vereist naast de reguliere parktoelating. Deze evenementen bieden exclusief entertainment, thematische decoraties en karakterervaringen die niet beschikbaar zijn tijdens reguliere openingstijden. Bekende voorbeelden zijn Mickey's Not-So-Scary Halloween Party en Mickey's Very Merry Christmas Party bij Walt Disney World, Halloween Horror Nights bij Universal en seizoensevenementen bij Disneyland Paris. Op dagen met een speciaal evenement worden reguliere dagbezoekers doorgaans om 18:00–19:00 uur gevraagd het park te verlaten. Kaartjes zijn vaak weken van tevoren uitverkocht.",
    aliases: ['Speciale evenementen'],
    alternateNames: ['Avondevenement', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "Disney's vroegere gratis prioriteitswachtrij-systeem, in 2021 vervangen door het betaalde Lightning Lane.",
    definition:
      "FastPass+ (oorspronkelijk FastPass, geïntroduceerd in 1999) was Disney's gratis prioriteitswachtrij-systeem waarmee gasten terugkeertijdslots voor attracties konden reserveren zonder extra kosten. In Walt Disney World konden gasten via de My Disney Experience-app tot drie FastPass+-reserveringen per dag boeken. Het systeem werd in 2020 opgeschort tijdens de COVID-19-sluiting en nooit heringevoerd — in 2021 vervangen door het betaalde Lightning Lane-systeem. FastPass+ is een van de meest besproken veranderingen in de Disney-geschiedenis, omdat het een gratis voordeel omzette in een betaalde dienst. Kennis van het oude systeem is nuttige context bij het lezen van oudere reisverslagen.",
    aliases: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Terugkomsttijd',
    shortDefinition:
      'Een gereserveerd tijdvenster om terug te keren naar een attractie, uitgegeven door Lightning Lane, virtuele wachtrij of vergelijkbare prioriteitssystemen.',
    definition:
      'Een terugkomsttijd (soms terugkomstvenster genoemd) is een specifieke periode — doorgaans een blok van één uur — waarbinnen een gast die prioriteitstoegang heeft geboekt (via Lightning Lane, een virtuele wachtrij of een vergelijkbaar systeem) zich bij de speciale ingang van de attractie kan melden. Terugkomsttijden stellen gasten in staat de tussenliggende tijd te besteden aan het verkennen van andere delen van het park in plaats van fysiek in de rij te staan. Je terugkomstvenster missen (doorgaans te laat arriveren met meer dan een ingesteld aantal minuten) betekent het verlies van je reservering. De wachttijd- en drukte-niveaudata van park.fan helpen je beslissen welke attracties je prioriteit moet geven voor het boeken van terugkomsttijden.',
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'fastpass', 'boarding-group'],
    aliases: ['Terugkomsttijden'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time — een sessie waarbij een groep enthousiastelingen of hotelgasten exclusieve toegang hebben tot één of meer attracties zonder reguliere publiekswachtrij.',
    definition:
      'ERT (Exclusive Ride Time) is een periode waarbij een geselecteerde groep — doorgaans leden van een achtbaanenthousiasmeclub, resorthotelgasten of jaarkaarthouders — exclusieve toegang heeft tot een rit of set ritten zonder publiek. Tijdens ERT kunnen deelnemers herhaaldelijk rijden met minimale wachttijd, vaak tientallen keren in één sessie. ERT-evenementen worden georganiseerd door parken voor speciale clubevenementen (zoals European Coaster Club- of American Coaster Enthusiasts-bijeenkomsten), voor premium hotelpakketten of als onderdeel van after-hours evenementen. Voor enthousiastelingen is ERT een van de meest gewaardeerde parkervaringen — het onthult het ware karakter van een rit zonder de druk van een wachtrij.',
    aliases: ['ERT'],
    alternateNames: ['Exclusive Ride Time', 'Exclusieve rijtijd'],

    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Een gedetailleerd, geoptimaliseerd itinerarium voor een pretparkbezoek dat attracties in volgorde plaatst om wachttijden te minimaliseren en het aantal ritten per dag te maximaliseren.',
    definition:
      "Een Touring Plan is een vooraf geplande reeks attracties, maaltijden en parkbewegingen ontworpen om de totale wachttijd gedurende de dag te minimaliseren. Effectieve Touring Plans houden rekening met drukte-patronen, attractiecapaciteiten, rijdynamiek, showschema's en het weer. Sites zoals TouringPlans.com (nu Thrill-Data) publiceren gedetailleerde plannen voor grote parken. De live wachttijden en druktekalender van park.fan zijn aanvullende tools: het controleren van real-time wachtdata gedurende de dag maakt aanpassingen onderweg mogelijk. Op drukke dagen kan een goed Touring Plan de totale wachttijd met 30–50% verminderen ten opzichte van een spontane aanpak.",
    aliases: ['Touring Plan'],
    alternateNames: ['Bezoeksplan', 'Parkplan', 'Bezoeksstrategie'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Een overdekte attractie waarbij bezoekers in voertuigen door een donkere, thematisch ingerichte ruimte worden geleid met animatronics, projecties of speciale effecten.',
    definition:
      'Een dark ride is een attractie waarbij gasten in geleide voertuigen door een gesloten, verduisterde ruimte reizen die is gevuld met decorstukken, animatronics, filmprojecties en speciale effecten. In tegenstelling tot achtbanen draait het bij dark rides om verhaalvertelling en onderdompeling in een thema. Beroemde voorbeelden zijn Pirates of the Caribbean en Haunted Mansion bij Disney, en The Amazing Adventures of Spider-Man bij Universal. Dark rides zijn geschikt voor alle leeftijden en hebben doorgaans geen minimumlengte, waardoor ze een kernonderdeel zijn van het parkbezoek voor families.',
    aliases: ['Dark Rides'],
    alternateNames: ['Binnenattractie', 'Overdekte attractie'],

    relatedTermIds: ['themed-land', 'soft-opening', 'height-requirement'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      'Bolliger & Mabillard, een Zwitserse achtbaanfabrikant bekend om soepele, betrouwbare ritten en kenmerkende elementen zoals de Immelmann, cobra roll en zero-G roll.',
    definition:
      'B&M (Bolliger & Mabillard) is een Zwitserse achtbaanfabrikant, opgericht in 1988 door Walter Bolliger en Claude Mabillard. Het bedrijf staat bekend om uitzonderlijk soepele, betrouwbare ritten met positieve G-krachten, kenmerkende inversies (Immelmann, cobra roll, zero-G roll) en uitstekende doorstroom. B&M is gespecialiseerd in inverted coasters, sit-down loopers, hyper coasters (over 61 m), giga coasters (over 91 m), wing coasters en dive machines. Vrijwel elk groot Europees park heeft minstens één B&M-installatie, waaronder Shambhala en Dragon Khan bij PortAventura, Silver Star bij Europa-Park, Nemesis bij Alton Towers en Goliath bij Walibi Holland.',
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: ['immelmann', 'cobra-roll', 'zero-g-roll', 'dive-coaster', 'hybrid-coaster'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "Een Zwitserse achtbaan- en attractiefabrikant bekend om recordbrekende hydraulische launches, mega/giga coasters en innovatieve ontwerpen — het bedrijf achter vele van 's werelds snelste en hoogste ritten.",
    definition:
      'Intamin AG is een Zwitserse attractiefabrikant, opgericht in 1967, verantwoordelijk voor enkele van de meest ambitieuze achtbaanrecords in de geschiedenis. Hun hydraulisch lanceersysteem dreef jarenlang de snelste en hoogste achtbanen aan (Kingda Ka, 139 m; Top Thrill Dragster). Intamin is ook bekend om hun mega- en giga coasters (waaronder Millennium Force bij Cedar Point en Intimidator 305 bij Kings Dominion), multi-launch coasters, waterritten en dark rides. Hun ontwerpen bevinden zich vaak aan de voorhoede van schaal en innovatie. Europese Intamin-installaties zijn onder meer Taron en Black Mamba bij Phantasialand en Red Force bij Ferrari Land.',
    relatedTermIds: ['launch-coaster', 'top-hat', 'b-and-m', 'mack-rides'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Een Duits familiebedrijf uit Waldkirch bij Europa-Park dat waterritten, dark rides en steeds ambitieuzere stalen achtbanen produceert.',
    definition:
      "Mack Rides is een Duitse attractiefabrikant gevestigd in Waldkirch, Baden-Württemberg — op slechts enkele kilometers van Europa-Park, het vlaggenschip van het bedrijf. Opgericht in 1921 produceert Mack waterritten, dark rides (waaronder Disney's Test Track en Radiator Springs Racers) en een groeiend portfolio van spectaculaire achtbanen. Hun Blue Fire Megacoaster bij Europa-Park (2009) was de eerste rit met een Stengel Dive-element. Macks recentere hyper coasters (Ride to Happiness bij Plopsaland, Kondaa bij Walibi Belgium) hebben brede lovende kritiek ontvangen van de enthousiastengemeenschap. Mack Rides zijn een bepalende aanwezigheid in Europese parken, met name in het eigen Europa-Park van de familie Mack.",
    aliases: ['Mack'],

    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      'Rocky Mountain Construction — een Amerikaanse fabrikant die het hybride achtbaanconcept heeft gepioneerd door verouderde houten achtbanen om te bouwen met stalen I-box-rails, waarmee ongekende airtime en inversies mogelijk worden.',
    definition:
      "Rocky Mountain Construction (RMC) is een Amerikaanse achtbaanfabrikant en onderhoudsbedrijf uit Hayden, Idaho, het best bekend om het uitvinden van het stalen I-box-spoorsysteem dat op houten achtbaanconstructies kan worden toegepast. Deze conversietechnologie stelde parken in staat ruwe, verouderde houten achtbanen te transformeren tot wereldklasse hybride ritten met intense airtime, meerdere inversies en voorbij-verticale drops — dingen die traditionele houten achtbanen niet konden. RMC-conversies zoals Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) en Wildfire (Kolmården) werden snel favorieten bij enthousiastelingen. In Europa wordt RMC's nieuwgebouwde hybride Untamed bij Walibi Holland algemeen beschouwd als een van de beste achtbanen van het continent.",
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Nederlandse achtbaanfabrikant en een van de grootste ter wereld — bekend om de alomtegenwoordige Boomerang en een breed scala aan familie- en thrillerachtbanen in Europese pretparken.',
    definition:
      "Vekoma Rides Manufacturing is een Nederlandse achtbaanfabrikant gevestigd in Vlodrop en een van de meest productieve producenten ter wereld qua totale installaties. Opgericht in 1926 als machinebouwbedrijf, stapte Vekoma in de jaren 70 over naar attracties en verwierf wereldwijde bekendheid met zijn Boomerang-achtbaan — een compacte shuttle-achtbaan met drie inversies die goedkoop gelicentieerd en overal ter wereld geïnstalleerd werd. Andere iconische modellen zijn de Suspended Looping Coaster (SLC), de Giant Inverted Boomerang en de Mine Train. Vanaf de jaren 2010 vernieuwde Vekoma zichzelf met een moderne 'new generation'-productlijn met soepelere rijsystemen, innovatieve lay-outs en verbeterde familieattraccties. Nieuwe modellen zoals de Family Boomerang, de Tilt Coaster en hangende familieachtbanen verschijnen steeds vaker in Europese parken. Disney heeft ook op maat gemaakte Vekoma-ontwerpen besteld voor zijn resorts.",
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Duitse fabrikant die het best bekend staat om het Euro-Fighter-model met zijn voorbij-verticale eerste helling, en om spinning coasters en compacte familieritten.',
    definition:
      'Gerstlauer Amusement Rides GmbH is een Duitse achtbaanfabrikant gevestigd in Münsterhausen, Beieren. Opgericht in 1946 als metaalverwerkend bedrijf, stapte het in de jaren 80 over naar attracties en bouwde zijn wereldwijde reputatie op met het Euro-Fighter-model — een compacte elektrisch gelanceerde achtbaan beroemd om zijn voorbij-verticale (97 graden) eerste drop. Euro-Fighters kunnen op kleine ruimte worden geïnstalleerd, waardoor ze aantrekkelijk zijn voor stedelijke parken en kleinere locaties; voorbeelden zijn Rage bij Adventure Island en Speed bij Oakwood. Gerstlauer produceert ook het Infinity Coaster-model, spinning coasters en de SkyRoller, een roterende achtbaan waarbij rijders hun eigen flikflak regelen. In de enthousiastengemeenschap worden Gerstlauer-achtbanen gewaardeerd om hun intensiteit ten opzichte van hun kleine footprint.',
    aliases: ['Gerstlauer Rides'],

    relatedTermIds: [
      'euro-fighter',
      'spinning-coaster',
      'xtreme-spinning-coaster',
      'b-and-m',
      'intamin',
    ],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      'Legendarische Duitse fabrikant wiens klassieke looping-achtbanen uit de jaren 70 en 80 nog altijd geliefd zijn in Europese pretparken om hun intense, boterzachte rijervaring.',
    definition:
      'Anton Schwarzkopf GmbH & Co. KG was een Duitse achtbaanfabrikant gevestigd in Münsterhausen, Beieren — dezelfde stad waar Gerstlauer zich later vestigde. Opgericht door Anton Schwarzkopf in 1954, was het bedrijf van groot belang voor de introductie van looping-achtbanen in Europa. De Revolution in Six Flags Magic Mountain (1976) was de eerste moderne looping-achtbaan ter wereld — ontworpen door Schwarzkopf. Kenmerkende modellen zijn de Looping Star, de Thriller/Wildcat en de transporteerbare Looping Coaster, die door heel Europa tourde. Schwarzkopf-achtbanen staan bekend om hun boterzachte ritten en elegante lay-outefficiëntie — het resultaat van Schwarzkopfs nauwkeurige engineering. Het bedrijf ging in 1983 failliet, maar veel installaties zijn decennia later nog steeds in bedrijf en worden door parken en enthousiastelingen gekoesterd als onvervangbare klassiekers. Het onderhoud wordt nu verzorgd door gespecialiseerde bedrijven of Gerstlauer, dat een deel van het gereedschap heeft overgenomen.',
    relatedTermIds: ['b-and-m', 'intamin', 'gerstlauer', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Een achtbaan die bezoekers van 0 naar hoge snelheid versnelt via een magnetisch, hydraulisch of pneumatisch lanceersysteem in plaats van een traditionele chain lifthill.',
    definition:
      'Een Launch Coaster vervangt de traditionele chain lifthill door een aandrijfsysteem dat de trein in enkele seconden van stilstand naar topsnelheid versnelt. De belangrijkste technologieën zijn: LSM (Linear Synchronous Motor) launches — elektromagnetische spoelen versnellen een vin op de trein; LIM (Linear Induction Motor) — vergelijkbaar maar minder efficiënt; hydraulische launches — een zuigergedreven kabelsysteem dat Intamin gebruikte op recordbrekende achtbanen zoals Kingda Ka; en persluchtlaunches. Sommige achtbanen hebben meerdere launches door het circuit. De plotselinge, krachtige versnelling is een kenmerkende gewaarwording die een lifthill niet kan evenaren.',
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Gelanceerde Achtbaan', 'Katapult-achtbaan'],

    relatedTermIds: ['lifthill', 'top-hat', 'intamin', 'horseshoe'],
  },
  {
    id: 'wooden-coaster',
    name: 'Houten achtbaan',
    shortDefinition:
      'Een achtbaan die voornamelijk van hout is gebouwd, gekenmerkt door een karakteristiek gerommel, laterale beweging en onvoorspelbare airtime.',
    definition:
      'Een houten achtbaan is een rit met een houten spoor en draagconstructie. In tegenstelling tot stalen achtbanen heeft hout van nature enige flexibiliteit en onnauwkeurigheid, wat het kenmerkende gerommel, de laterale beweging en de onvoorspelbare airtime creëert waar enthousiastelingen van houden. Beroemde houten achtbanen zijn Balder bij Liseberg, The Beast bij Kings Island en Megafobia bij Oakwood. Houten achtbanen vereisen constant onderhoud — de rails moeten regelmatig worden herverlamd — en zijn gevoelig voor weersveranderingen. Het RMC-conversieproces kan verouderde houten achtbanen omtoveren tot staalspoor-hybride achtbanen met behoud van de houten constructie.',
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
    aliases: ['Houten achtbanen'],
    alternateNames: ['Woodie', 'Woodies', 'Houten coaster'],
  },
  {
    id: 'steel-coaster',
    name: 'Stalen achtbaan',
    shortDefinition:
      'Een achtbaan gebouwd met stalen rail en stalen constructie, bekend om zijn vloeiende en nauwkeurige rijervaring.',
    definition:
      'Een stalen achtbaan wordt gebouwd met buisvormige of platte stalen rail ondersteund door een stalen frame. In tegenstelling tot houten achtbanen met hun natuurlijke flexibiliteit, biedt staal ingenieurs nauwkeurige controle over G-krachten, overgangen en inversies. De vloeiende, voorspelbare rit van een stalen achtbaan maakt het mogelijk om complexe layouts met meerdere inversies, nauwe bochten en snelle secties te creëren.\n\nStalen achtbanen domineren de moderne achtbaanentwickeling. De meest gevierde voorbeelden in Europa zijn Shambhala in PortAventura, Nemesis in Alton Towers en Silver Star in Europa-Park. Stalen achtbanen variëren van kleine familieattracties tot recordbrekende mega coasters. De nauwkeurigheid van staal vereist regelmatig onderhoud en inspectie, maar staat minder ontwerp-fouten toe dan de flexibiliteit van hout.',
    relatedTermIds: ['wooden-coaster', 'inversion', 'launch-coaster', 'hyper-coaster'],
    aliases: ['Stalen achtbanen', 'Staal'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Een coaster waarbij de trein onder het spoor aan een scharnier hangt, waardoor het voertuig vrij opzij kan zwaaien.',
    definition:
      'Een suspended coaster is een gespecialiseerd coastertype waarbij de trein van bovenaf aan een spilpunt hangt en vrij van links naar rechts kan zwaaien. Terwijl de trein door bochten navigeert, zwaait het als een slinger — een beweging die de karakteristieke "whip"-sensatie creëert en een onvoorspelbaar element aan de rit toevoegt. Deze zwaaibeweging is anders dan een inverted coaster, waar de trein star aan het spoor boven bevestigd is.\n\nSuspended coasters zijn minder algemeen dan inverted coasters, maar bieden een unieke ervaring. De zwaaibeweging maakt zelfs matige bochten dramatisch, en het gevoel van vliegen creëert sensatie. Vekoma ontwikkelde in de jaren 90 het Suspended Looping Coaster (SLC)-model, waarvan wereldwijd honderden werden gebouwd. De zwaaibeweging kan chaotisch lijken vergeleken met de precisie van moderne inversies, waardoor suspended coasters door sommigen worden liefgehad voor hun ruwe, onvoorspelbare aard.',
    relatedTermIds: ['inverted-coaster', 'b-and-m', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Hangende achtbaan', 'Slingerende achtbaan'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Hybride achtbaan',
    shortDefinition:
      'Een achtbaan die een traditionele houten draagconstructie combineert met een stalen I-box-spoor, een technologie die is gepioneerd door Rocky Mountain Construction (RMC).',
    definition:
      'Een hybride achtbaan combineert de houten constructie van een traditionele achtbaan met een stalen I-box-spoor van Rocky Mountain Construction (RMC). Het I-box-spoor is uiterst precies en soepel, waardoor inversie-elementen mogelijk zijn die op traditioneel houten spoor onmogelijk zouden zijn. RMC ontwikkelde deze technologie voornamelijk om verouderde houten achtbanen te renoveren — met inversies, steilere drops en airtime hills toegevoegd aan layouts die eerder te ruw waren om te genieten. Beroemde RMC-hybriden zijn Steel Vengeance bij Cedar Point (door velen beschouwd als de beste achtbaan ter wereld), Twisted Colossus bij Six Flags Magic Mountain en Wildfire bij Kolmården. Nieuwgebouwde RMC-hybriden (zoals Untamed bij Walibi Holland) bestaan naast conversies.',
    aliases: ['Hybrid Coasters'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Hybride achtbaan'],

    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Een compact Vekoma-achtbaanmodel dat bezoekers door drie inversies twee keer stuurt — eerst vooruit, dan achteruit — in een heen-en-terugstekende layout.',
    definition:
      'De Boomerang is een van de meest gebouwde achtbaanmodellen in de geschiedenis, gefabriceerd door Vekoma. De layout omvat drie inversies — een vertical loop geflankeerd door twee sidewinder-elementen — die eerst vooruit worden doorlopen, en daarna omgekeerd nadat de trein omhoog wordt getrokken door een tweede schuine lifthill en achterwaarts door dezelfde elementen wordt losgelaten. De volledige rit levert zes inversies op (drie in elke richting) in een zeer compact voetafdruk, ideaal voor parken met beperkte ruimte. Meer dan 50 Boomerang-achtbanen zijn wereldwijd gebouwd; het model is te vinden in parken op elk bewoond continent. Ondanks hun leeftijd blijven Boomerangs populaire instap-achtbanen in middelgrote parken.',
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Een compact Gerstlauer-achtbaanmodel met een nagenoeg verticale of voorbij-verticale eerste drop gelanceerd vanuit een verticale lifthill, ontworpen voor intense thrills in een kleine ruimte.',
    definition:
      "De Euro-Fighter is Gerstlauer's kenmerkende compacte achtbaanmodel, herkenbaar aan zijn verticale (90 graden) of voorbij-verticale eerste drop (tot 97 graden) na een verticale chain lifthill. Ontworpen voor parken met beperkte ruimte, proppt de Euro-Fighter intense thrills — meerdere inversies, strakke bochten en hoge G-krachten — in een klein gebied. De voorbij-verticale drop is bijzonder opvallend: de trein pauzeert aan de top met rijders die over de afgrond uitkijken voordat de val begint. Europese Euro-Fighters zijn onder meer Saw – The Ride bij Thorpe Park, Rage bij Adventure Island en Fluch von Novgorod bij Hansa-Park.",
    relatedTermIds: ['first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Een achtbaantype met een ongewoon breed treinstel en een nagenoeg verticale of voorbij-verticale drop, met een opzettelijke pauze aan de rand vóór de val.',
    definition:
      "Een Dive Coaster wordt gekenmerkt door een breed treinstel (doorgaans 8–10 rijders per rij), een nagenoeg verticale of voorbij-verticale drop (90+ graden) en een theatraal moment aan de top van de drop — de trein houdt even stil aan de rand voordat hij wordt losgelaten, wat de psychologische spanning maximaliseert. Het brede treinstel geeft alle rijders een onbelemmerd zicht recht naar beneden. B&M's Dive Machine-lijn (Oblivion bij Alton Towers, SheiKra bij Busch Gardens) introduceerde het concept; Gerstlauer's Dive Coaster-model is een concurrerende versie. De opzettelijke pauze voor de drop is een bewuste ontwerpbeslissing om de spanning te verhogen.",
    relatedTermIds: ['first-drop', 'b-and-m', 'euro-fighter', 'launch-coaster'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Een achtbaan uitgebreid met virtual reality-headsets die een gesynchroniseerde geanimeerde of gaming-ervaring over de fysieke rit heen leggen.',
    definition:
      'Een VR Coaster rust rijders uit met VR-headsets (doorgaans Samsung Gear VR of speciaal gebouwde apparaten) die een gesynchroniseerde virtuele omgeving weergeven die overeenkomt met de fysieke bewegingen van de achtbaan. Terwijl de rit G-krachten door een looping trekt, weerspiegelt de VR-wereld de gewaarwording; bij een drop duikt ook de virtuele wereld omlaag. VR Coasters werden populair van circa 2015–2019, waarbij veel parken bestaande achtbanen achteraf uitrustten. Het concept heeft gemengde reacties gekregen: sommige gasten houden van de meeslepende overlay, terwijl anderen de headsets oncomfortabel, onhygiënisch of misselijkmakend vinden. Veel parken die VR introduceerden hebben het sindsdien verwijderd. Enkele installaties (zoals VR Coasters van Mack Rides) bieden meer gepolijste, toegewijde ervaringen.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'Het gevoel van gewichtloosheid of uit je stoel worden getild dat achtbaanrijders ervaren bij negatieve G-kracht-momenten.',
    definition:
      "Airtime beschrijft het gevoel van gewichtloosheid — negatieve G-krachten — dat achtbaanrijders ervaren wanneer de achtbaan een heuvel of vallei sneller neemt dan vrije val. Er zijn twee hoofdtypen: floater airtime (zachte negatieve G's, een zacht zweefgevoel) en ejector airtime (intense negatieve G's, waarbij de schootbeugel of riem het enige is dat je in je stoel houdt). Airtime wordt door velen beschouwd als het meest bepalende kenmerk van een geweldige stalen of houten achtbaan. Airtime hills (ook wel camelbacks genoemd) zijn specifiek ontworpen om deze gewaarwording te maximaliseren door het spoor een parabolische vrije-val-vorm te geven.",
    relatedTermIds: ['airtime-hill', 'bunnyhop', 'first-drop', 'wooden-coaster'],
  },
  {
    id: 'inversion',
    name: 'Inversie',
    shortDefinition: 'Elk element op een achtbaan waarbij het spoor rijders ondersteboven draait.',
    definition:
      'Een inversie is elk element op een achtbaan waarbij het spoor en voertuig rijders voorbij het verticale vlak draaien — waarbij ze ten minste gedeeltelijk ondersteboven worden geplaatst. Veelvoorkomende inversies zijn de looping, cobra roll, kurketrekker, immelmann, dive loop, inline twist, heartline roll en zero-G roll. Moderne achtbanen hebben routinematig zes tot veertien inversies in één layout. Het aantal inversies is een van de belangrijkste statistieken om de intensiteit van een achtbaan te beschrijven. Inversies genereren zowel positieve G-krachten (aan de onderkant van loopings) als negatieve G-krachten (aan de bovenkant), wat voor gevarieerde gewaarwordingen zorgt.',
    relatedTermIds: ['vertical-loop', 'cobra-roll', 'immelmann', 'zero-g-roll', 'corkscrew'],
    aliases: ['Inversies'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'De klassieke cirkelvormige inversie waarbij het spoor een volledige verticale cirkel maakt en rijders volledig ondersteboven brengt aan het hoogste punt.',
    definition:
      "De looping is de meest iconische inversie in de achtbaangeschiedenis — een volledige cirkel van 360 graden in het verticale vlak. Moderne loopings gebruiken een clothoïde (druppelvorm) in plaats van een perfecte cirkel: de in- en uitgang zijn wijd, terwijl de bovenkant van de looping strak is. Deze vorm zorgt ervoor dat rijders soepele, aanhoudende G-krachten ervaren in plaats van extreme pieken. De eerste moderne loopin-achtbaan (Corkscrew, Knott's Berry Farm, 1975) transformeerde de industrie. Vandaag de dag vormen loopings de kern van het inversie-aanbod op achtbanen wereldwijd, van eerste thrill rides tot recordbrekende machines.",
    aliases: ['Loopings'],
    alternateNames: ['Verticale Lus', 'Vertical Loop'],

    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Een halve looping die de trein omhoog en over de top trekt, gevolgd door een halve rol die in de tegenovergestelde richting uitkomt — vernoemd naar WWI-piloot Max Immelmann.',
    definition:
      'De Immelmann-bocht is een kenmerkend B&M-inversie-element dat uit twee fasen bestaat: het spoor trekt eerst omhoog in een halve verticale looping, brengt rijders over de top en kort ondersteboven; daarna draait een halve rol de trein weer rechtop terwijl de rijrichting 180 graden wordt omgekeerd. Het element is vernoemd naar Eerste Wereldoorlog-vliegas Max Immelmann, die een vergelijkbare luchtmanoeuvre gebruikte. Immelmanns zijn kenmerkend omdat ze zowel een maagdraaiende inversie als een significante richtingsverandering in één vloeiend element combineren. Ze zijn te vinden op vrijwel elke B&M sit-down, inverted en hyper coaster wereldwijd.',
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop', 'b-and-m'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Een 360-graden rol langs een parabolische boog waarbij rijders aan het hoogste punt bijna gewichtloosheid ervaren — een van de meest gevierde elementen in modern achtbaanontwerp.',
    definition:
      'De zero-G roll (nul-zwaartekracht-rol) is een inversie-element waarbij de trein een parabolische boog door de rotatie volgt — vergelijkbaar in concept met een heartline roll maar op hogere snelheid en met meer verticale verplaatsing. Op het hoogtepunt van de rol ervaren rijders kortstondige negatieve G-krachten (airtime) terwijl ze ondersteboven zijn, wat een uniek desoriënterend en geliefd gevoel creëert. Zero-G rolls worden voornamelijk geassocieerd met B&M wing coasters en hyper coasters, waarbij het element wing-seat rijders dramatisch door de open lucht stuurt. Shambhala bij PortAventura en Fury 325 bij Carowinds hebben gevierde zero-G rolls.',
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'De mechanisch aangedreven klimpartij die het achtbaantreinstel naar het hoogste punt trekt en elektrische energie omzet in potentiële energie.',
    definition:
      "De lifthill is het gedeelte waarbij een extern mechanisme de achtbaantrein van grondniveau naar het hoogste punt van de rit trekt. Het meest voorkomende mechanisme is een ketting langs het midden van het spoor — het bekende 'tik-tik-tik'-geluid is de anti-terugrolklem. Alternatieven zijn kabel/touwliften (soepeler en stiller), bandliften (gebruikt op sommige moderne B&M-achtbanen) en magnetische aandrijving. De hoogte van de lifthill bepaalt de maximale potentiële snelheid van de achtbaan. Sommige moderne ontwerpen gebruiken meerdere lifthills of combineren een lift met lanceersegmenten. De lifthill is doorgaans het langzaamste, meest spanningsopbouwende moment van de rit.",
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Kettinghelling'],

    relatedTermIds: ['first-drop', 'launch-coaster', 'block-brake'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'De eerste daling na de lifthill — doorgaans het hoogste en snelste punt van de rit, bepalend voor het karakter van de achtbaan.',
    definition:
      'De First Drop is de primaire daling direct na de lifthill of het lanceersegment. Op de meeste traditionele achtbanen is het de hoogste heuvel en bereikt de achtbaan er zijn maximale snelheid. De hoek, hoogte en profiel bepalen sterk het algehele karakter: steil-hoekige drops (over 80–90 graden) creëren intense versnellingsgewaarwordingen, terwijl parabolische drops sterke airtime kunnen genereren ondanks een zachtere hoek. Dive Coasters hebben drops die 90 graden overstijgen (voorbij verticaal), waarbij rijders voorover over de rand moeten leunen. De First Drop is vaak het meest geanticipeerde moment op elke nieuwe achtbaan.',
    relatedTermIds: ['lifthill', 'airtime', 'airtime-hill', 'dive-coaster'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Een heuvelachtig element ontworpen om negatieve G-krachten te genereren, waardoor rijders gewichtloosheid ervaren of uit hun stoel worden getild.',
    definition:
      'Een Airtime Hill (ook wel camelback of kameel-rug genoemd) is een gebogen stijging-daling-element ontworpen om negatieve G-krachten te produceren — het gevoel van zweven of uit de stoel worden geslingerd. Floater airtime is zachte negatieve G; ejector airtime is intens, waarbij de schootbeugel het enige is tussen de rijder en de lucht. Stalen achtbanen gebruiken precies gevormde parabolische heuvels voor consistente, voorspelbare airtime; houten achtbanen produceren meer onvoorspelbare, ruwe airtime door de spoorflexibiliteit. Airtime Hills behoren tot de meest gevierde elementen in enthousiastenrankings en zijn bepalend voor hyper coasters, giga coasters en moderne houten achtbanen.',
    aliases: ['Airtime heuvels'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Een continu spiralend gedeelte waarbij het spoor om een centrale as wikkelt en aanhoudende laterale G-krachten genereert.',
    definition:
      'Een helix is een gedeelte van het achtbaanspoor dat continu spiraalvormig loopt — vergelijkbaar in vorm met een schroef — zonder rijders ondersteboven te draaien. In tegenstelling tot airtime hills of inversies genereert een helix aanhoudende laterale (zijdelingse) G-krachten die rijders in de buitenkant van de bochten drukken. Een dalende helix versnelt de trein terwijl hij draait; een stijgende helix remt af terwijl hij toch laterale krachten genereert. Helixen worden vaak gebruikt om resterende kinetische energie aan het einde van een layout te besteden terwijl ze een spannend, aanhoudend draaigevoel bieden. Beroemde helixen zijn de ondergrondse finale van Nemesis bij Alton Towers en de sluitende helix van Expedition GeForce bij Holiday Park.',
    aliases: ['Helices'],
    alternateNames: ['Spiraal', 'Schroefkromme'],

    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Een remgedeelte dat het circuit in onafhankelijke segmenten verdeelt, waardoor meerdere treinen gelijktijdig kunnen rijden zonder botsingsrisico.',
    definition:
      "Een block brake verdeelt het circuit van een achtbaan in afzonderlijke onafhankelijke secties ('blokken'), elk geschikt voor precies één trein. Als een trein voor afremt of stopt, houdt het controlesysteem automatisch alle volgende treinen op hun block brake-positie. Dit veiligheidssysteem stelt parken in staat meerdere treinen gelijktijdig te exploiteren — wat de capaciteit per uur drastisch verhoogt — zonder enig botsingsrisico. Block brakes zijn gepositioneerd op punten waar een stilstaande trein niet achteruitrolt (doorgaans een vlak of licht omhoog gaand gedeelte) en gebruiken doorgaans magnetische (wervelstroom) of wrijvingsremvinnen. De mid-course brake run (MCBR) is het meest zichtbare type block brake.",
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'Het afremgedeelte aan het einde van de rit waarbij de trein wordt vertraagd naar stationssnelheid, doorgaans met magnetische vinremmen.',
    definition:
      'De Brake Run is het spoordeel na de hoofdlayout waarbij het achtbaantreinstel van rijsnelheid wordt vertraagd naar een veilige stationsinrijsnelheid. Moderne brake runs gebruiken wervelstroom (magnetische) remmen — rijen permanente magnetische vinnen die werken op metalen vinnen aan de onderkant van de trein, waardoor weerstand ontstaat zonder wrijving of slijtage. Oudere achtbanen gebruikten pneumatische klauwremmen. Een mid-course brake run (MCBR) halverwege de layout fungeert als blokkensectie voor meertreinsbediening. De laatste brake run voor het station kan opzettelijk licht remmen om enige snelheid te bewaren voor een dynamischere stationsinrij.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Een dubbel-inversie B&M-handtekenelement waarbij het spoor de vorm aanneemt van een opgerichte kobrakop — twee inversies verbonden door een draai aan het hoogste punt.',
    definition:
      "De cobra roll is een van B&M's meest kenmerkende handtekenelementen, bestaande uit twee inversies in snelle opeenvolging: het spoor buigt omhoog in een halve looping, roteert 180 graden aan de top (door een korte onderstebovenstand), en spiegelt daarna de reeks om in dezelfde richting als bij de ingang te eindigen. Vanuit opzij gezien lijkt het spoortracé op de opgeheven en gespreide kop van een cobra. Beroemde cobra rolls staan op Shambhala bij PortAventura, Pyrenees bij Parque de Atracciones de Madrid en vele B&M inverted coasters wereldwijd.",
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'Een vat-rol-inversie waarbij het spoor 360 graden spiraalvormig om een centrale as draait — een van de vroegste en meest gebouwde inversietypen.',
    definition:
      "De kurketrekker (corkscrew) is een van de eerste moderne inversies, geïntroduceerd door Arrow Dynamics in de jaren '70. Het spoor spiraalvormig om een centrale cilinder zoals een wijnkurketrekker, waarbij rijders door een volledige 360-graden rol worden meegenomen die is verschoven ten opzichte van de rijrichting. Kurketrekkers worden vaak in tandem achter elkaar gebouwd en zijn het kenmerkende element van de 'klassieke' stalen achtbaan. De Engelse term 'Corkscrew' wordt breed gebruikt in de internationale enthousiastengemeenschap. Hoewel nieuwere inversie-ontwerpen het hebben verdrongen, blijft de kurketrekker een geliefd element in parken door heel Europa en Noord-Amerika.",
    relatedTermIds: ['inversion', 'inline-twist', 'flat-spin'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'Het spiegelbeeld van een Immelmann: het spoor duikt steil omlaag in een halve looping en verlaat het element horizontaal — de omgekeerde richting van een Immelmann.',
    definition:
      'Een Dive Loop (ook wel dive turn of reverse Immelmann) begint waar de Immelmann eindigt: in plaats van omhoog en over te trekken, duikt het spoor steil omlaag in een boog door de onderste helft van een looping voordat het in de tegenovergestelde richting uitkomt. Het gevoel is dat van een glijdende neerwaartse duik gevolgd door een krachtige uitkrachtreactie. Dive Loops zijn een kenmerkend B&M-element en verschijnen op veel inverted en sit-down coasters van de fabrikant. De combinatie van Immelmanns en Dive Loops in één layout creëert gevarieerde richtingswisselingen en inversietypes.',
    relatedTermIds: ['inversion', 'immelmann', 'b-and-m'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Een enkele 360-graden rol recht om de spooras, waarmee een soepele inversie wordt geboden zonder de rijrichting significant te wijzigen.',
    definition:
      'Een Inline Twist (ook wel inline roll of barrel roll) roteert de trein 360 graden om de longitudinale as van het spoor — de achtbaan rolt in feite zonder significant van richting te veranderen. In tegenstelling tot een kurketrekker (die een spiraalverschuiving heeft ten opzichte van de spoormiddellijn), draait de inline twist precies om het spoor. Het resultaat is een soepele, korte inversie met minimale laterale krachten. Inline Twists komen veel voor op B&M flying coasters en inverted coasters, vaak in paren of gecombineerd met andere elementen in snelle opeenvolging. Het element produceert een kortstondige onderstebovenservaring die verrassend zacht aanvoelt.',
    relatedTermIds: ['inversion', 'corkscrew', 'heartline-roll', 'flat-spin'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Een 360-graden rol gecentreerd op het zwaartepunt van de rijder in plaats van het spoor zelf, ontworpen voor soepele, aanhoudende gewichtloosheid door de hele rotatie.',
    definition:
      'Een Heartline Roll (of heartline spin) is zo ontworpen dat het hart van de rijder — ongeveer het zwaartepunt van het lichaam — gedurende de hele rotatie op een constante hoogte blijft, in plaats van dat het spoor het draaipunt is. Dit ontwerp minimaliseert G-krachten door de rol heen en produceert een soepel zweefgevoel dat verschilt van de schok van een standaard kurketrekker. Heartline Rolls zijn een kenmerk van modern B&M- en Intamin-achtbaanontwerp, geassocieerd met hyper coasters en invert coasters. Het element illustreert de engineering-precisie die nodig is om een soepele ritervaring te creëren — kleine spoorcorrecties vertalen zich direct naar rijderscomfort of ongemak.',
    relatedTermIds: ['inversion', 'zero-g-roll', 'inline-twist'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Een halve looping gecombineerd met een halve kurketrekker die het spoor 90 graden draait en van richting verandert — een kenmerkend Vekoma-element op Boomerang-achtbanen.',
    definition:
      "Een Sidewinder bestaat uit een halve verticale looping die de trein omhoog trekt, onmiddellijk gevolgd door een halve kurketrekker die de trein rechtop draait terwijl hij 90 graden draait. Het netto resultaat is een inversie gecombineerd met een significante richtingsverandering, gerealiseerd in een compact voetafdruk. Sidewinders zijn de bouwstenen van Vekoma's iconische Boomerang-achtbaanmodel: twee sidewinders (één vooruit, één omgekeerd) flankeren een centrale looping om de volledige layout te creëren. De naam verwijst naar de slangachtige draaibeweging die het element produceert wanneer het vanuit de zijkant wordt gezien.",
    relatedTermIds: ['inversion', 'boomerang', 'cobra-roll'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Een massale inversie exclusief voor B&M flying coasters waarbij rijders, al in Superman-positie, door het laagste punt van een verticale looping gaan terwijl ze volledig ondersteboven zijn.',
    definition:
      'De Pretzel Loop is een van de meest intense inversies in pretparkontwerp, uitsluitend te vinden op B&M flying coasters (waarbij rijders horizontaal liggen in een Superman-positie). Het element stuurt rijders steil omlaag terwijl ze ondersteboven zijn, door de bodem van een grote looping, en trekt ze daarna steil omhoog — de algehele vorm lijkt op een pretzel wanneer vanuit opzij bekeken. Omdat het laagste punt aan de onderkant is en rijders met het gezicht naar beneden zijn, zijn de G-krachten op dat moment extreem intens. Beroemde Pretzel Loops staan op Manta bij SeaWorld Orlando en Tatsu bij Six Flags Magic Mountain.',
    relatedTermIds: ['inversion', 'b-and-m', 'inline-twist'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Een dubbel-inversie-element met een 180-graden richtingsomkering, waarbij twee halve loopings verbonden zijn door een halve kurketrekker — de vorm doet denken aan gespreide vleermuisvleugels.',
    definition:
      "Een Batwing bestaat uit twee inversies met een richtingsomkering: het spoor buigt omhoog in een halve looping, passeert daarna aan de top een halve kurketrekker die de trein ondersteboven draait en de richting omkeert, voordat het de halve looping naar grondniveau spiegelt. De vorm van bovenaf gezien lijkt op gespreide vleermuisvleugels. Batwings zijn een kenmerkend B&M-element, te vinden op achtbanen zoals Afterburn bij Carowinds en The Incredible Hulk Coaster bij Universal's Islands of Adventure. In tegenstelling tot een bowtie (geen richtingsverandering) keert de batwing de rijrichting van de trein 180 graden om tijdens de reeks.",
    relatedTermIds: ['inversion', 'bowtie', 'cobra-roll', 'b-and-m'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Een looping-variant waarbij het spoor van bovenaf nadert, door het cirkelvormige pad omlaag duikt en bovenaan uitkomt — de omgekeerde geometrie van een standaard looping.',
    definition:
      "De Norwegian Loop (soms reverse loop) heeft de tegenovergestelde geometrie van een standaard verticale looping: in plaats van op grondniveau in te gaan en op dezelfde hoogte uit te komen, gaat de trein vanuit een verhoogde positie de cirkelvormige looping in, duikt omlaag door het cirkelpad en komt bovenaan weer uit. Dit betekent dat de krachten aan de onderkant van de cirkel — sterke positieve G's — nog steeds aanwezig zijn, maar de ingang- en uitgangsgewaarwordingen duidelijk anders zijn. Norwegian Loops zijn relatief zeldzaam in de wereldwijde achtbaanvoorraad en zijn voornamelijk geassocieerd met bepaalde Vekoma-ontwerpen en maatwerksinstallaties.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Een kurketrekker-element op inverted of flying coasters waarbij de rotatie in een nagenoeg horizontaal vlak plaatsvindt, wat een zwaaiende, bijna vlakke rotatie creëert.',
    definition:
      'Een Flat Spin is een kurketrekker-type inversie die voornamelijk voorkomt op B&M inverted en flying coasters, waarbij de geometrie van het element zodanig is gerangschikt dat de spiraal voor toeschouwers op de grond bijna horizontaal oogt. Op een inverted coaster (waarbij de trein onder het spoor hangt) creëert een flat spin een bijzonder dramatisch beeld terwijl rijders door een wijde, bijna vlakke cirkel zwaaien. De gewaarwording voor rijders is een soepele, aanhoudende rotatie met matige G-krachten. Flat Spins zijn een kenmerkend element op B&M inverted coasters zoals Banshee bij Kings Island en Afterburn bij Carowinds.',
    relatedTermIds: ['inversion', 'corkscrew', 'inline-twist', 'b-and-m'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Een halve-kurketrekker-inversie die tegelijkertijd de rijrichting van de trein met circa 180 graden omkeert — inversie en scherpe richtingsverandering gecombineerd.',
    definition:
      "Een Cutback is een element waarbij het spoor een halve kurketrekker uitvoert terwijl het ruwweg 180 graden op zichzelf terugkrult. Het resultaat is een inversie met een significante richtingsomkering — anders dan een standaard kurketrekker, die grotendeels de rijrichting behoudt. Cutbacks zijn relatief ongewoon en verschijnen op bepaalde Vekoma-modellen en maatwerksachtbanen waarbij een compacte richtingsverandering gecombineerd met een inversie vereist is. De naam 'cutback' weerspiegelt het visuele uiterlijk: het spoor snijdt terug op zijn vorige koers terwijl het draait.",
    relatedTermIds: ['inversion', 'corkscrew', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Een dubbel-inversie zee-serpent-variant met een lager verbindingspunt, die twee opeenvolgende inversies produceert zonder richtingsverandering in een compact voetafdruk.',
    definition:
      'De Butterfly is een dubbel-inversie-element vergelijkbaar met een zee-serpent (twee halve loopings verbonden aan de top) maar met een lager hoogtepunt en een afwijkende geometrie. Net als de zee-serpent produceert het twee inversies zonder de rijrichting te veranderen, maar het verbindingsstuk tussen de twee halve loopings loopt door een lager ondersteboven-gedeelte in plaats van een hoog hoogtepunt. Dit maakt de butterfly compacter in de hoogte. Het element verschijnt op bepaalde Vekoma- en maatwerksachtbaanontwerpen.',
    relatedTermIds: ['inversion', 'bowtie', 'batwing'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Een dubbel-inversie-element waarbij twee gespiegelde halve loopings een strikjesdas-vorm vormen in het spoor — twee inversies zonder richtingsverandering.',
    definition:
      'Een Bowtie is een dubbel-inversie-element bestaande uit twee gespiegelde halve loopings verbonden op hun hoogtepunt. In tegenstelling tot een batwing (die van richting verandert), verlaat de bowtie in dezelfde algemene richting als het begon. Van bovenaf bekeken lijkt het spoortracé op een strikjesdas. Bowties zijn relatief zeldzaam en worden voornamelijk gevonden op bepaalde Vekoma- en maatwerksinstallaties. Het element produceert twee soepele inversies in snelle opeenvolging terwijl de algemene rijrichting behouden blijft, wat een andere gewaarwording biedt dan de richtingsomkerende batwing ondanks een oppervlakkig vergelijkbaar uiterlijk.',
    relatedTermIds: ['inversion', 'batwing', 'butterfly'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Een reeks kleine, snelle airtime hills aan het einde van een rit die zachte floater airtime produceren terwijl de trein vaart verliest.',
    definition:
      'Een bunnyhop is een reeks kleine, snelle heuvels geplaatst naar het einde van een achtbaanlayout wanneer de trein het grootste deel van zijn kinetische energie heeft verbruikt. Bij deze verlaagde snelheid genereren de heuvels zachte floater airtime — een zacht, ritmisch zweefgevoel in plaats van de intense ejector airtime van snellere heuvels eerder in de layout. De term weerspiegelt de lichte, stuiterende beweging die doet denken aan een hoppend konijn. Bunnyhops zijn veelvoorkomende finales op hyper coasters, giga coasters en houten achtbanen, en bieden een speelse slotklapper voor de brake run. Enthousiastelingen beschouwen goed uitgevoerde bunnyhops als een teken van doordacht layoutontwerp.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Een over-overbankende airtime hill die voorbij 90 graden kantelt en rijders zijwaarts werpt terwijl ze tegelijkertijd negatieve G-krachten ervaren — vernoemd naar de legendarische ingenieur Werner Stengel en een kenmerkend Mack Rides-element.',
    definition:
      'De Stengel Dive is een airtime-element waarbij het spoor voorbij 90 graden (voorbij verticaal) kantelt zodat rijders zijwaarts of licht overhead hangen terwijl ze tegelijkertijd negatieve G-krachten van het heuvelprofiel ervaren. Deze unieke combinatie van laterale desoriëntatie en airtime produceert een gewaarwording die niet lijkt op enige standaardheuvel of inversie. Het element is vernoemd naar Werner Stengel, de Duitse ingenieur achter het ontwerp van enkele van de belangrijkste achtbanen in de geschiedenis. Stengel Dives zijn een kenmerkend element op Mack Rides hyper coasters: Blue Fire Megacoaster bij Europa-Park was de eerste achtbaan met dit element, met latere Mack hypers zoals Ride to Happiness bij Plopsaland en Kondaa bij Walibi Belgium die meerdere Stengel Dives bevatten.',
    relatedTermIds: ['airtime-hill', 'mack-rides', 'airtime'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Een scherp gebankeerde 180-graden bocht in de vorm van een hoefijzer, die de trein in de tegenovergestelde richting stuurt — vaak gebruikt om de trein te keren tussen lanceersegmenten.',
    definition:
      "Een horseshoe is een sterk gebankeerde halfronde bocht — doorgaans 75 tot 90 graden gebankeerd — die de achtbaan 180 graden (rijrichting omkeert) omleidt. De extreme banking voorkomt overmatige laterale G-krachten bij de strakke straal. Horseshoes worden vaak gebruikt in launch coaster-layouts als keerpuntelementen tussen meerdere lanceersegmenten, waardoor de trein een U-bocht maakt voor de volgende versnellingsfase. Het element is visueel opvallend en een kenmerk van Intamin's accelerator coasters en Mack's multi-launch coasters. Het leidt de trein efficiënt om in een compact gebied terwijl de snelheid behouden blijft.",
    relatedTermIds: ['launch-coaster', 'intamin', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Een kleine dip vlak voor de hoofddrop van een achtbaan met chain lift, gebruikt om kettingspanning te verminderen en een kort anticiperend airtime-moment te bieden.',
    definition:
      'Een predrop is een kleine heuvel of dal gepositioneerd op het laatste deel van de lifthill, vlak voor de top die leidt naar de hoofddrop. De primaire technische functie is het verminderen van spanning op de liftketting terwijl de trein de top nadert — wat een ruwe of schokkerige overgang van de aangedreven lift naar de onbetrokken drop voorkomt. Een bijkomend voordeel is de rijervaring: de korte airtime-pop als de trein de predrop neemt, geeft een verleidelijk voorsmaakje van gewichtloosheid voor de hoofdval begint. Predrops zijn een populaire ontwerpfeature op houten en stalen achtbanen geworden.',
    relatedTermIds: ['lifthill', 'first-drop', 'airtime'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Een hoog, smal element met een nagenoeg verticale klim en daling dat lijkt op een hoge hoed — een kenmerkend element op hydraulisch gelanceerde Intamin-achtbanen.',
    definition:
      "Een Top Hat is een kenmerkend element waarbij het spoor nagenoeg verticaal omhoog klimt naar een scherpe top en daarna nagenoeg verticaal aan de andere kant valt — waardoor het profiel vanuit opzij gezien op een hoge hoed lijkt. Inside (standaard) Top Hats kantelen naar binnen aan de top; outside Top Hats kantelen naar buiten voor een blootgesteld, airtime-zwaar gevoel. Het element is sterk geassocieerd met Intamin's hydraulische launch coasters: na de initiële lancering naar 200 km/u of meer is de Top Hat het dramatische middelpunt van de rit. Kingda Ka (139 m), Top Thrill Dragster (128 m) en Red Force bij Ferrari Land hebben iconische Top Hats.",
    relatedTermIds: ['launch-coaster', 'intamin', 'first-drop'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'Een achtbaan die een enthousiasteling officieel heeft gereden en aan zijn persoonlijke telling heeft toegevoegd — credits verzamelen is een kernactiviteit in de achtbaanenthousiaste gemeenschap.',
    definition:
      "Een credit (of 'cred') is een achtbaan die een enthousiasteling heeft gereden en officieel aan zijn persoonlijke telling heeft toegevoegd. Het verzamelen van credits — zo veel mogelijk verschillende achtbanen rijden — is een van de bepalende activiteiten van de achtbaanenthousiaste gemeenschap. Regels voor wat als een credit telt, variëren: sommige enthousiastelingen tellen alleen sit-down achtbanen, anderen alle tracked rides. Tracking-sites zoals de Roller Coaster Database (RCDB) stellen enthousiastelingen in staat hun credittellingen bij te houden. De jacht op credits motiveert velen om internationaal te reizen en obscure parken te bezoeken.",
    aliases: ['Credits'],
    alternateNames: ['Cred', 'Creds', 'Coaster-teller'],

    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      'Point-of-view-beeldmateriaal gefilmd vanuit de eerste rij van een achtbaan, waarmee potentiële bezoekers een virtueel voorbeeld van de ritervaring krijgen.',
    definition:
      "POV (Point of View) verwijst naar on-ride videobeeldmateriaal opgenomen vanuit het perspectief van een eerste-rij-rijder, doorgaans gemonteerd op een camera bevestigd aan de trein. POV-video's zijn een van de populairste contentformaten in de pretpark-enthousiastengemeenschap en worden breed gebruikt door toekomstige bezoekers om een achtbaan te bekijken vóór het bezoek. Parken produceren soms officiële POV's voor promotionele doeleinden; vaker worden ze gefilmd door gasten of media. YouTube herbergt tienduizenden achtbaan-POV-video's. De term wordt ook breder gebruikt voor elk eerstepersoonsperspectief-beeldmateriaal van parkattracties.",
    aliases: ['Point of View'],
    alternateNames: ['On-Ride Video', 'Meerijvideo'],

    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Een situatie waarbij meerdere treinen bij de brake run aankomen voordat het station vrij is, waardoor treinen opstapelen — een teken van inefficiënte operaties die wachttijden verlengen.',
    definition:
      'Stacking treedt op wanneer het laad- en losproces van een achtbaan trager is dan de ritcyclustijd, waardoor treinen zich in de brake run ophopen in afwachting van een vrij station. In plaats van een trein te verzenden terwijl de vorige terugkeert, moet de operator meerdere treinen in de brake run vasthouden — wat de rit mogelijk kort stilzet tussen treinen. Stacking verlaagt direct de achtbaancapaciteit en verlengt de wachttijden in de rij. Veelvoorkomende oorzaken zijn trage instap van gasten (vaak vanwege complexe beveiliging), uitgebreide tassencheckvereisten of onderbezetting. Ervaren parkbezoekers kunnen waarnemen of een achtbaan stacking vertoont tijdens hun wachttijd en dit meenemen in hun besluitvorming.',
    alternateNames: ['Train Stacking', 'Treinstapeling'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Type achtbaan waarbij de trein onder de rail hangt en de voeten van passagiers vrij bungelen.',
    definition:
      'Een Inverted Coaster is een achtbaan waarbij de trein stijf onder de rail is bevestigd, met passagiers die vrij bungelend met de benen naar beneden zitten. In tegenstelling tot een swinging coaster (die zijdelings slingert) kan de trein van een Inverted Coaster niet zijdelings bewegen. B&M pionierde het moderne ontwerp in 1992 met Batman The Ride. Inverted Coasters staan bekend om intense near-misses, zero-g rolls en cobra rolls. Bekende Europese voorbeelden: Nemesis (Alton Towers), Katun (Mirabilandia) en Oziris (Parc Astérix).',
    aliases: ['Inverted Coasters'],
    alternateNames: ['Inverted', 'Invert', 'Hangende Achtbaan'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Type achtbaan met stoelen aan weerszijden van de rail — niets boven, onder of naast de passagiers.',
    definition:
      'Een Wing Coaster (ook Wing Rider) plaatst twee stoelen aan elke kant van de rail, waardoor passagiers geen enkele constructie boven, onder of naast zich hebben. Dit ontwerp maximaliseert het vlieggevoel en creëert spectaculaire near-misses met decor en constructies. B&M is de primaire fabrikant. Bekende Europese voorbeelden: The Swarm (Thorpe Park), Fēnix (Toverland, Nederland) en Flug der Dämonen (Europa-Park), die vaak wordt beschouwd als een van de beste coasters van Europa.',
    aliases: ['Wing Coasters'],
    alternateNames: ['Wing Rider', 'Vleugel-achtbaan'],

    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Achtbaan met vrij draaiende wagons op een verticale as — elke rit biedt een ander perspectief.',
    definition:
      'Een Spinning Coaster (ook draaiende achtbaan) heeft wagons op een draaiend platform dat vrij ronddraait op een verticale as. Omdat de rotatie niet wordt gestuurd, ervaart elk voertuig een andere opeenvolging van voor-, achteruit- en zijwaartse ritten. Mack Rides (Waldkirch, Duitsland) en Gerstlauer zijn de voornaamste fabrikanten. Spinning Coasters worden beschouwd als uitstekende familieattracties — spannend genoeg voor liefhebbers, maar zonder extreme lengte-eisen.',
    aliases: ['Spinning Coasters'],
    alternateNames: ['Spinner', 'Draaiende achtbaan'],

    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Gerstlauers hoge-intensiteit spinning coaster-model — sneller, hoger en met agressievere rotatie dan een standaard spinning coaster.',
    definition:
      'De Xtreme Spinning Coaster (XSC) is Gerstlauers topmodel in de spinning coaster-categorie, ontworpen om het format naar zijn uiterste grenzen te duwen. Waar een standaard spinning coaster gericht is op gezinsvriendelijke intensiteit, biedt de XSC een hogere constructie, steilere drops, hogere topsnelheden en een rotatiemechanisme dat is afgesteld op krachtigere rotatie — de wagons draaien harder en vaker door elk element van het parcours.\n\nDe onvoorspelbaarheid van het draaien wordt versterkt door het hogere tempo: de rijrichting verandert sneller, waardoor elke rit anders aanvoelt. Het XSC-model positioneert Gerstlauer tussen gezinsspinners en volwaardige thrill coasters — echte intensiteit met de herhaalbaarheid die spinning coasters zo aantrekkelijk maakt.',
    alternateNames: ['XSC'],
    relatedTermIds: ['spinning-coaster', 'gerstlauer', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Achtbaan van meer dan 61 m hoog, doorgaans zonder inversies, met de nadruk op snelheid en airtime.',
    definition:
      'Hyper Coaster is de classificatie voor achtbanen tussen 61 en 91 m hoog. B&M noemt hun modellen "Hyper Coaster"; Intamin gebruikt "Mega Coaster" voor hun vergelijkbaar type. Beide leggen de nadruk op grote airtime-heuvels bij hoge snelheid in plaats van inversies. Shambhala in PortAventura (Spanje) is met 76 m de hoogste en snelste Hyper Coaster van Europa. Andere bekende voorbeelden: Goliath in Walibi Holland en Mako in SeaWorld Orlando.',
    aliases: ['Hyper Coasters'],
    alternateNames: ['Mega Coaster', 'Mega Achtbaan', 'Hypercoaster'],

    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Achtbaan van meer dan 91 m hoog — een klasse hoger dan de Hyper Coaster.',
    definition:
      'Giga Coaster is de classificatie voor achtbanen tussen 91 en 121 m hoog. De term werd in 2000 bedacht door Cedar Fair en Intamin voor Millennium Force in Cedar Point. Giga Coasters benadrukken extreme hoogte, lange layouts en enorme airtime-momenten. Fury 325 in Carowinds wordt door veel liefhebbers beschouwd als de beste stalen achtbaan ter wereld. In Europa bestaat in 2025 nog geen echte Giga Coaster.',
    aliases: ['Giga Coasters'],
    alternateNames: ['Gigacoaster'],

    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Bocht waarbij de spoorkanteling meer dan 90° bedraagt, waardoor passagiers kort voorbij de verticaal worden gekanteld.',
    definition:
      "Een Overbanked Turn is een bocht waarbij de bankhoek meer dan 90 graden bedraagt — de buitenste rail ligt hoger dan verticaal, waardoor passagiers kort voorbij de ondersteboven-positie worden gekanteld zonder een volledige inversie te voltooien. Het element genereert een kenmerkende combinatie van zijdelingse G-krachten en licht negatieve G's op het hoogtepunt van de kanteling. Overbanked Turns zijn kenmerkend voor B&M Hyper Coasters en Intamin Mega Coasters, en komen overal voor in RMC-layouts.",
    aliases: ['Overbanked'],
    alternateNames: ['Overhellende bocht', 'Gekantelde bocht'],

    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Magnetische rem halverwege het parcours die de snelheid van de trein vermindert zonder hem volledig te stoppen.',
    definition:
      'Een Trim Brake is een remsysteem dat halverwege een achtbaan is geplaatst om de snelheid van de trein te verminderen — maar in tegenstelling tot een block brake stopt hij de trein niet volledig. Trim Brakes worden gebruikt om G-krachten te beheersen, slijtage te verminderen of aan veiligheidseisen te voldoen. Liefhebbers klagen vaak dat ze de rijervaring merkbaar verzwakken — airtime hills zijn minder intensief wanneer de trein ervoor wordt geremd. Of Trim Brakes actief zijn, kan variëren per seizoen, weer en belading.',
    relatedTermIds: ['block-brake', 'brake-run', 'airtime'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Wanneer een launch coaster het hoogste punt niet bereikt en terugrollt naar het lanceerplatform.',
    definition:
      'Een rollback treedt op wanneer een gelanceerde achtbaan onvoldoende snelheid ontwikkelt om het hoogste punt van het circuit te bereiken en vervolgens door de zwaartekracht terugrollt naar de lanceerposistie. Bij hydraulische launch coasters (Top Thrill Dragster, Stealth) gebeurt dit wanneer het lanceermechanisme niet de volledige kracht levert. De trein rolt langzaam terug en wordt door magneetremmen opgevangen. Rollbacks zijn zeldzaam maar een bekend kenmerk van hydraulische launch coasters. Passagiers lopen geen gevaar.',
    relatedTermIds: ['launch-coaster', 'block-brake', 'downtime'],
  },
  {
    id: 'animatronics',
    name: 'Animatronic',
    shortDefinition:
      'Robotfiguren gebruikt in dark rides en shows om levensechte personages en scènes te creëren.',
    definition:
      'Animatronics (enkelvoud: animatronic) zijn elektromechanische robotfiguren die worden gebruikt in attracties en shows van pretparken om personages of wezens op realistische wijze te portretteren. Disney introduceerde de term "Audio-Animatronics" in 1964 op de Wereldtentoonstelling. Moderne animatronics variëren van eenvoudige cyclische figuren tot geavanceerde servo- en pneumatisch aangedreven robots met complexe gezichtsuitdrukkingen en volledige lichaamsbeweging. Efteling is beroemd om zijn uitgebreide gebruik van animatronics in attracties zoals De Vliegende Hollander en Symbolica.',
    aliases: ['Animatronics'],
    alternateNames: ['Audio-Animatronics', 'Robotfiguur'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'AI-voorspelling',
    shortDefinition:
      'Machine learning-voorspellingen voor druktenivaues en wachttijden — tot 30+ dagen van tevoren.',
    definition:
      "Een AI-voorspelling gebruikt machine learning-modellen die getraind zijn op historische bezoekersdata, weersdata, schoolvakantieschema's en real-time wachtrij-informatie om te voorspellen hoe druk een pretpark of attractie zal zijn op een bepaalde dag of tijdstip. park.fan genereert AI-voorspellingen voor drukte en verwachte wachttijden tot 30+ dagen van tevoren.\n\nVoorspellingen worden continu bijgewerkt naarmate nieuwe data binnenkomt. Kortetermijnvoorspellingen (1–7 dagen) zijn doorgaans zeer nauwkeurig omdat ze actuele weersdata, aankondigingen van evenementen en boekingssignalen meenemen. Langetermijnvoorspellingen zijn van nature minder nauwkeurig, maar blijven waardevol voor het identificeren van rustige of drukke perioden ruim van tevoren.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'opening-hours',
    name: 'Openingstijden',
    shortDefinition:
      'Het officiële dagprogramma dat aangeeft wanneer een pretpark of attractie opent en sluit.',
    definition:
      'Openingstijden zijn het gepubliceerde dagprogramma voor een pretpark of individuele attractie — ze geven aan wanneer de toegang begint en wanneer de exploitatie eindigt. De meeste grote parken publiceren een rollend schema weken of maanden van tevoren, hoewel tijden op korte termijn kunnen wijzigen door speciale evenementen, seizoensaanpassingen of operationele problemen.\n\npark.fan toont openingstijden voor elk park. Tijden aangeduid met "Est." (Geschat) zijn afgeleid uit historische patronen en niet officieel bevestigd door het park — ze moeten worden gecontroleerd vóór een gepland bezoek.',
    aliases: ['Parktijden', 'Openingstijden'],

    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Wachttijdtrend',
    shortDefinition:
      'De richting van de verandering in wachtrijlengte over de afgelopen 30 minuten — stijgend, dalend of stabiel.',
    definition:
      'De wachttijdtrend geeft aan of de wachtrij van een attractie langer, korter of gelijk is dan 30 minuten geleden. park.fan geeft dit weer met een pijl: omhoog (wachtrij groeit), omlaag (wachtrij krimpt) of horizontaal (stabiel).\n\nDe trend is vaak veelzeggender dan de kale wachttijd. Een attractie met 45 minuten en een dalende trend is een betere keuze dan een met 40 minuten en een sterk stijgende trend — tegen de tijd dat je aankomt, kan de eerste wachtrij gedaald zijn naar 30 minuten terwijl de tweede al op 55 minuten staat.',
    aliases: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride zonder vaste rails — voertuigen navigeren vrij door de attractieruimte, geleid door in de vloer ingebedde technologie.',
    definition:
      'Een Trackless Ride is een type dark ride waarbij voertuigen niet gebonden zijn aan een vaste rail maar autonoom door de attractieruimte navigeren, geleid door inductielussen, wifi of lasergeleidingssystemen in de vloer. De bewegingsvrijheid maakt veel complexere scenering en niet-lineaire verhaallijnen mogelijk. Symbolica in Efteling is het meest bekende Nederlandse voorbeeld. Andere beroemde voorbeelden: Star Wars: Rise of the Resistance (Disney) en Ratatouille: The Adventure (Disneyland Paris).',
    aliases: ['Trackless', 'Trackless Dark Ride', 'Spoorloze Rit'],

    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'AI',
    shortDefinition:
      'Kunstmatige Intelligentie — de machine-learningmodellen die drukte-prognoses en wachttijdvoorspellingen berekenen.',
    definition:
      'AI (Kunstmatige Intelligentie) verwijst naar machine-learningalgoritmen die patronen herkennen in grote datasets en voorspellingen genereren. park.fan gebruikt AI-modellen die getraind zijn op jaren aan historische wachttijddata, schoolvakantieregelingen, weerdata en evenementaankondigingen om dagelijkse drukte- en wachttijdprognoses te produceren voor elk bijgehouden park — tot 30+ dagen vooruit.',
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
    aliases: ['Kunstmatige Intelligentie'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Live wachttijd',
    shortDefinition:
      'Wachttijddata die direct vanuit de parksystemen wordt opgehaald en elke minuut bijgewerkt.',
    definition:
      "Een live wachttijd is de actuele, realtime wachttijd direct vanuit de datasystemen van een park — geen historisch gemiddelde, maar het werkelijke cijfer van dit moment, tot op de minuut nauwkeurig. park.fan haalt live wachttijden op vanuit officiële park-API's en derde partijen en vernieuwt elke minuut.",
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ['Live wachttijden'],
    alternateNames: ['Realtime wachttijd', 'Realtime wachttijden'],
  },
  {
    id: 'crowd-forecast',
    name: 'Drukte-prognose',
    shortDefinition:
      'AI-gebaseerde voorspelling van hoe druk een attractiepark op een bepaalde dag zal zijn.',
    definition:
      'Een drukte-prognose is een datagestuurde voorspelling van hoe druk een attractiepark op een bepaalde dag of tijd zal zijn. park.fan herberekent drukte-prognoses dagelijks op basis van historische bezoekerscijfers, schoolvakanties, weerdata en speciale evenementen. De resultaten vloeien direct in de drukte-kalender: groene dagen betekenen korte rijen, rode dagen signaleren piekdrukte met lange wachttijden.',
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
    aliases: ['Drukte-prognoses'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'De eenheid van versnelling die passagiers ervaren, gemeten als veelvouden van de zwaartekrachtversnelling op Aarde (9,81 m/s²).',
    definition:
      'G-kracht (gravitationeel equivalent) meet de versnelling die een passagier ervaart ten opzichte van de normale zwaartekracht van de Aarde. Positieve G-krachten (boven 1G) drukken passagiers in hun stoel tijdens dalen of scherpe bochten. Negatieve G-krachten (onder 0G) heffen passagiers uit hun stoel en creëren airtime. Laterale G-krachten werken zijdelings en duwen passagiers opzij in bochten en overgangen.\n\nAchtbanen zijn ontworpen om deze krachten doelgericht te rangschikken. Een dal dat 4–5G genereert is het kenmerk van een krachtige first drop-overgang. Een kort moment van −0,5G op een airtime-heuvel produceert het typische zweefgevoel. De meeste attracties richten zich op 0–5G aanhoudende positieve krachten, met korte pieken voor dramatisch effect. Langdurige hoge G-belasting boven enkele seconden kan ongemak of greyout veroorzaken; goed ontworpen achtbanen balanceren intensiteitspieken met herstelsecties.',
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime', 'greyout'],
    aliases: ['G-Krachten'],
    alternateNames: ['G-Force', 'G-Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Tijdelijke verduistering van het gezichtsveld door positieve G-krachten die de bloedtoevoer naar de hersenen verminderen.',
    definition:
      'Een greyout (ook: grey-out) is een fysiologisch fenomeen waarbij een passagier die blootgesteld wordt aan sterke aanhoudende positieve G-krachten tijdelijk een grijs of wazig gezichtsveld ervaart. Het mechanisme: positieve G-krachten duwen bloed naar beneden, naar de ledematen, waardoor de bloedtoevoer naar de ogen en hersenen vermindert. Het gezichtsveld begint zich vanuit de periferie te vernauwen en wordt grijs — de passagier blijft bij bewustzijn, maar het zicht is aanzienlijk verminderd.\n\nVoorbij het greyout-stadium kan bij nog hogere of langduriger G-belasting een blackout optreden (gezichtsveld wordt volledig zwart) of in extreme gevallen G-LOC (G-Force Induced Loss of Consciousness). Goed ontworpen achtbanen houden hoge G-pieken kort en wisselen intensieve secties af met herstelstukken om aanhoudend greyout te voorkomen.',
    aliases: ['Greyouts', 'grey-out'],
    alternateNames: ['grijs waas', 'G-kracht verduistering'],
    relatedTermIds: ['g-force', 'lateral-gs', 'hangtime', 'airtime'],
  },
  {
    id: 'grey-zone',
    name: 'Grijze zone',
    shortDefinition:
      'Een achtbaanelement op de grens van de inversiedefinitie — al dan niet geteld afhankelijk van de gebruikte telmethode.',
    definition:
      'De grijze zone verwijst naar achtbaanelementen die zich bevinden op de grens tussen een volledige inversie en een niet-inverterend element. Klassieke inversies — zoals verticale loops en kurketrekkers — zijn ondubbelzinnig: de trein draait de passagier volledig ondersteboven. Grijze zone-elementen bereiken net wel of net niet de overhead drempelwaarde van 180°, waarbij passagiers in een extreme, bijna-geïnverteerde positie terechtkomen.\n\nTypische grijze zone-elementen zijn stalls (gehandhaafde ondersteboven posities zonder volledige rotatie), sterk overcantelde bochten voorbij 90° en bepaalde wave turn-varianten. Fabrikanten zoals RMC en Intamin gebruiken deze elementen bewust als alternatief voor klassieke inversies. Afhankelijk van de telmethode — strikt (alleen volledige rotaties) of breed (elke overheadpositie) — kan het officiële inversieaantal van een attractie variëren.',
    aliases: ['Grijze zones', 'grijze-zone'],
    alternateNames: ['borderline inversie', 'quasi-inversie'],
    relatedTermIds: ['inversion', 'stall', 'overbank', 'roller-coaster-element'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Zijdelingse krachten die passagiers opzij duwen tijdens bochten, overgangen en helixgedeelten.',
    definition:
      'Laterale G-krachten zijn de zijdelingse versnellingen die passagiers ervaren wanneer een achtbaan van richting verandert in het horizontale vlak — in gembankte of ongembankte bochten, helices en richtingswisselingen. Goed ontworpen lateralen zijn vloeiend en gecontroleerd en dragen bij aan een energieke rijervaring. Slecht ontworpen of ruwe lateralen voelen aan als bruusk opzijgegooid worden tegen de rug- of zijkant van de stoel, wat oncomfortabel of pijnlijk kan zijn.\n\nEnthousiastelingen onderscheiden gladde, intentionele lateralen — zoals in de uitbochten van klassieke houten achtbanen — van harde, onbedoelde lateralen door railleer of slechte constructie. Houten achtbanen zijn sterk geassocieerd met laterale beweging: de flexibiliteit van het spoor en de zijdelingse energie van ongembankte bochten worden beschouwd als authentiek onderdeel van de houten achtbaanervaring. Vloeiende laterale sequenties in helixgedeelten — zoals op Balder in Liseberg — worden door enthousiastelingen vaak als hoogtepunten van een circuitprofiel genoemd.',
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Lateralen', 'Laterale G'],
    alternateNames: ['Lateral G', 'Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intense negatieve G-krachten die passagiers abrupt uit hun stoel slingeren, gehouden door alleen de schootbeugel.',
    definition:
      'Ejector airtime beschrijft de meest intense vorm van negatieve G-krachten: de baan wijkt zo abrupt af van de vrije val dat passagiers krachtig uit hun stoel worden gesmeten — alleen de schootbeugel houdt hen in het voertuig. De naam omschrijft precies het gevoel: het lijkt alsof de stoel je actief wil uitwerpen. Dit is fundamenteel anders dan het rustige, langdurige zweven van floater airtime; ejector is scherp, plotseling en kan bijna gewelddadig aanvoelen bij abrupte overgangen.\n\nEjector airtime is het meest geassocieerd met RMC hybride achtbanen, bepaalde Intamin hyper coasters en moderne houten achtbanen met steile parabolische heuvels. Enthousiastelingen beschrijven de beste ejector-momenten als het hoogtepunt van een circuit — een kort, hartverscheurend moment van echte gewichtloosheid. Untamed in Walibi Holland, Wildfire in Kolmården en Steel Vengeance in Cedar Point worden vaak geciteerd voor hun buitengewoon intense ejector-sequenties.',
    relatedTermIds: ['airtime', 'floater-airtime', 'airtime-hill', 'rmc', 'g-force'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Zachte, aanhoudende negatieve G-krachten die een lang zweefgevoel produceren bij het passeren van een heuvel.',
    definition:
      'Floater airtime beschrijft het zachte uiterste van het negatieve G-kracht spectrum: een langzame, aanhoudende sensatie waarbij passagiers lichtjes uit hun stoel opstijgen en gewichtloos zweven voor een verlengd moment terwijl de trein een heuvel overgaat langs een geleidelijke parabolische boog. De kracht is mild — doorgaans −0,1G tot −0,3G — waardoor het toegankelijk en aangenaam is voor passagiers die de intensiteit van ejector airtime te heftig vinden.\n\nFloater airtime is het meest kenmerkend voor B&M hyper en giga coasters, die grote, zacht afgeronde heuvels gebruiken die zijn ontworpen om lange zweeffasen te produceren. Shambhala in PortAventura, Silver Star in Europa-Park en Goliath in Walibi Holland zijn Europese voorbeelden die worden gevierd om hun lange floater-sequenties. Veel enthousiastelingen vinden de ontspannen kwaliteit van floater airtime comfortabeler en herhaalbaarder dan de scherpe intensiteit van ejector, hoewel de meningen verdeeld zijn over welk stijl superieur is.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'airtime-hill', 'b-and-m', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'Het gevoel van gewichtloos hangen in de beveiliging tijdens een inversie, veroorzaakt door negatieve G-krachten ondersteboven.',
    definition:
      "Hangtime beschrijft de bijzondere ervaring van negatieve G-krachten tijdens een inversie: de trein treuzelt lang genoeg nabij de top van een omgekeerd element zodat negatieve G-krachten hun effect voelen — passagiers hangen letterlijk in hun beveiliging. In tegenstelling tot het korte omgekeerde moment van een snelle looping, treedt hangtime op wanneer de trein langzamer gaat nabij het inversie-apex en een uitgerekte suspensie creëert. Het lichaamsgewicht verschuift volledig naar de schouderbeuges of schootbeugel, wat een uniek desoriënterende ervaring oplevert.\n\nHangtime is het meest uitgesproken op elementen waar de trein aanzienlijk vertraagt nabij het inversie-apex — de pretzel loop op flying coasters is het klassieke voorbeeld, omdat de snelheid laag genoeg is voor aanhoudende negatieve G's in volledig omgekeerde positie. De heartline roll van sommige moderne attracties kan ook hangtime produceren. Enthousiastelingen beschouwen hangtime over het algemeen als een van de meest opwindende inversiesensaties.",
    relatedTermIds: ['inversion', 'pretzel-loop', 'heartline-roll', 'g-force', 'airtime'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Achtbaanelement',
    shortDefinition:
      'Een benoemd onderdeel van een achtbaanspoor, zoals een looping, airtime-heuvel of inversie.',
    definition:
      'Een achtbaanelement is elk afzonderlijk, benoemd kenmerk in het parcours van een achtbaan — van klassieke inversies zoals loopings en kurketrekkers tot niet-inverterende elementen zoals airtime-heuvels, helices en overbanks. Ontwerpers ontwikkelen elk element om een specifieke fysieke gewaarwording te produceren: gewichtloosheid (airtime), zijwaartse G-krachten of de desoriëntatie van ondersteboven rijden.\n\nDe woordenlijst van park.fan beschrijft tientallen individuele elementen — van de eerste drop en lifthill tot moderne specialiteiten als de Stengel dive, Norwegian loop en heartline roll.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Achtbaanelementen'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Eerste rij',
    shortDefinition:
      'De eerste rij zitplaatsen in een achtbaantrein, meestal met het beste uitzicht en de meest intense airtime-sensaties.',
    definition:
      'De eerste rij is de eerste rij zitplaatsen in een achtbaantrein. Plaatsen in de eerste rij bieden een vrij uitzicht naar voren, zeer gewenst door passagiers voor de visuele ervaring. Op hypercoasters en gigacoasters ondervinden passagiers in de eerste rij meestal de meeste intense airtime tijdens de eerste daling, omdat zij niemand voor zich hebben die hun gevoel van ruimte blokkeert. Het psychologische effect van het zien van de daling die nadert — en vervolgens in het luchtledige te duiken — versterkt de spanning veel meer dan middelste of achterste rijen.\n\nOp veel achtbanen is de eerste rij zo gewenst dat parken bypass-wachtrijen of express-reserveringen specifiek voor deze zitpositie aanbieden.',
    relatedTermIds: ['back-row', 'middle-row', 'airtime', 'first-drop'],
    aliases: ['Voorstoelplaats', 'Eerste plaats'],
  },
  {
    id: 'back-row',
    name: 'Achterste rij',
    shortDefinition:
      'De laatste rij zitplaatsen in een trein, bekend om intense airtime en uitgebreide schweefgevoelens op heuvelrijke layouts.',
    definition:
      'De achterste rij is de laatste rij zitplaatsen in een achtbaantrein. Achterplaatsen op heuvelrijke achtbanen — hypers, gigas en airtime-gerichte ontwerpen — zijn gewaardeerd door enthousiastelingen vanwege de meest intense ejector airtime. Bij elke opeenvolgende heuvel ervaart de achterste rij uitgebreide negatieve G-krachten terwijl de trein over de top gaat en passagiers uit hun stoelen worden geworpen (alleen door beveiliging gehouden). Dit effect stapelt zich over meerdere heuvels: achterste rij airtime is meestal sterker, langer en intenser dan voor- of middelste rij.\n\nOp coasters als Goliath of Shambhala wordt de achterste rij door enthousiastelingen als de beste zitpositie beschouwd.',
    relatedTermIds: ['front-row', 'middle-row', 'airtime', 'ejector-airtime'],
    aliases: ['Achterzitplaats', 'Laatste plaats'],
  },
  {
    id: 'middle-row',
    name: 'Middelste rij',
    shortDefinition:
      'De middelste rijen van een achtbaantrein, biedend een evenwichtige ervaring tussen eerste en achterste rij.',
    definition:
      'De middelste rijen zijn de centrale zitplaatsen in een achtbaantrein — gepositioneerd tussen het intense psychologische effect van de eerste rij en de ejector airtime van de achterste rij. Middelste rijen bieden meestal een evenwichtige ervaring: voldoende uitzicht om het komende parcours te zien, aanzienlijke airtime, maar niet de uitersten van voor of achterkant. Voor gezinnen of eerstekeer-ruiters zenuwachtig voor intensiteit bieden middelste rijen een toegankelijker achtbaanervaring.\n\nMiddelste rijen ontvangen minder aandacht in enthusiastenkringen omdat ze niet gespecialiseerd zijn voor een bepaalde gewaarwording noch de extremen van voor- of achterkant bieden. Op achtbanen met uitgebreide zijwaartse krachten kunnen middelste rijen echter soms de grootste compressie voelen vanwege hun positie in het zwaartepunt van de trein.',
    relatedTermIds: ['front-row', 'back-row', 'airtime', 'ride-cart'],
    aliases: ['Middelzitplaats', 'Middel rij'],
  },
  {
    id: 'ride-cart',
    name: 'Wagentje',
    shortDefinition:
      'Individueel voertuig of auto in een achtbaantrein dat een of meer rijen ruiters bevat.',
    definition:
      'Een wagentje (ook wel auto, car of eenvoudig treinwagentje genoemd) is het individuele voertuigsegment dat passagiers op een achtbaan bevat. Een typische achtbaantrein bestaat uit meerdere wagentjes aan elkaar gekoppeld, waarbij elk wagentje één of meer rijen passagiers rug-aan-rug bevat. Achtbaanfabrikanten ontwerpen wagentjesafmetingen, zitpositionering en beveiligingsgeometrie om zowel comfort als gewaarwording te optimaliseren.\n\nWagentjesontwerp varieert aanzienlijk tussen achtbaantypen: hypercoasters gebruiken gestroomlijnde, lage wagentjes om luchtweerstand te minimaliseren; omgekeerde coasters hangen ruiters onder het spoor; wing coasters positioneren ruiters aan weerszijden van een centraal spoor met niets eronder; flying coasters positioneren ruiters naar beneden gericht. Fabrikanten als B&M, Intamin en Mack hebben elk kenmerkende wagentjesontwerpen.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'front-row', 'back-row'],
    aliases: ['Auto', 'Car'],
  },
  {
    id: 'lap-bar',
    name: 'Schootbeugel',
    shortDefinition:
      'Een horizontale veiligheidsbalk over de schoot, die meer bewegingsvrijheid toestaat dan schouderbeugels.',
    definition:
      'Een schootbeugel is een horizontaal veiligheidsinrichting dat ruiters op de bovenbenen immobiliseert. In tegenstelling tot schouderbeugels die het gehele bovenlichaam omhullen, stellen schootbeugels het bovenlichaam in staat om vrijer te bewegen, wat een openere, minder beperkende gewaarwording creëert. Schootbeugels zijn standaard op de meeste moderne hypercoasters, gigacoasters en veel traditionele staal- en houten achtbanen. Tijdens airtimemomenten stellen schootbeugels ruiters in staat de volledige gewaarwording van uit de stoel worden geworpen te ervaren, wat het gevoel creëert dat alleen de balk hen in het voertuig houdt.\n\nSchootbeugels worden door enthousiastelingen voor hoogtiertime-achtbanen geprefereerd omdat zij de meest ongehinderde airtime-gewaarwording opleveren. Ze vereisen echter een juiste positionering en kunnen oncomfortabel zijn voor ruiters met langere rompjes. Fabrikanten hebben het schootbeugelontwerp in decennia voortdurend verfijnd, en moderne beugels zijn aanzienlijk comfortabeler dan eerdere generaties.',
    relatedTermIds: ['shoulder-harness', 'airtime', 'ride-cart'],
    aliases: ['Schoot-beugel'],
  },
  {
    id: 'shoulder-harness',
    name: 'Schouderbeugel',
    shortDefinition:
      'Een over-de-schouder veiligheidsinrichting die het hele bovenlichaam omhult en beweging tijdens de rit beperkt.',
    definition:
      "Een schouderbeugel is een veiligheidsinrichting die over beide schouders en over de schoot komt, het gehele bovenlichaam volledig omhullend. Schouderbeugels waren standaard op achtbanen van de jaren '80 tot 2000 en blijven gebruikelijk op omgekeerde coasters, sommige hangende coasters en family-attracties waar maximale veiligheid prioriteit heeft. Moderne beugels hebben click-mechanismen die verschillende strakheid toestaan om verschillende lichaamstypen aan te passen.\n\nWanneer je in een schouderbeugel op een hoogtiertime-achtbaan zit, is de gewaarwording aanzienlijk anders dan een schootbeugel: ruiters kunnen niet zo dramatisch uit de stoel omhoog komen omdat de beugel hen naar beneden houdt. Dit compromis — verbeterde veiligheid en comfort tegen minder intense airtime-gewaarwording — is een belangrijke ontwerkkeuze die fabrikanten maken.",
    relatedTermIds: ['lap-bar', 'airtime', 'ride-cart'],
    aliases: ['OTS-beugel'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Souvenir',
    shortDefinition:
      'Een herinneringsvoorwerp of klein artikel gekocht in een themapark ter herinnering aan een bezoek.',
    definition:
      "Een souvenir is een fysiek herinneringsvoorwerp — merchandise, kleding of verzamelarticle — gekocht door bezoekers om hun themapark-bezoek te herinneren. Veel voorkomende souvenirs zijn t-shirts met parklogo's, petten, spelden, ansichtkaarten en thema-pluche. Souvenirs vervullen zowel een functioneel doel (draagbare kleding) als een emotioneel — ze verankeren herinneringen aan een specifiek bezoek en creëren blijvende verbindingen met geliefde parken.\n\nThemaparken vertrouwen sterk op souvenirverkopen als inkomstenstream; merchandise draagt meestal een 2–3x opslag ten opzichte van retailprijzen. Voor veel gasten is het verzamelen van souvenirs uit meerdere parken deel van de ervaring — spelden verzamelen, ze met anderen uitwisselen of een herinneringsplank bouwen.",
    relatedTermIds: ['merchandise', 'gift-shop', 'park-exclusive'],
    aliases: ['Souvenir', 'Aandenken'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Officiële producten en goederen verkocht door een themapark, inclusief kleding, verzamelobjekten en thema-artikelen.',
    definition:
      'Merchandise verwijst naar alle goederen verkocht door een themapark — van gemerkte kleding (t-shirts, hoodies, petten) tot verzamelobjekten (spelden, figurines, pluche), voedsel-/drankenmerchandise en speciaalverpakte thema-artikelen gebonden aan specifieke attracties of franchises. Themaparken opereren uitgebreide merchandiseoperaties met tientallen winkels, mobiele karren en gelokaliseerde boutiques. Merchandise is een kritische inkomstenpijler voor parken, die vaak 15–25% van totale gastpenditures genereren, tweede alleen na voedsel en dranken.\n\nModerne parken gebruiken geavanceerde merchandisingstrategieën: beperkte editie seizoensartikelen, collaboratie-merchandise met populaire franchises, parkexclusieve designs die nergens anders beschikbaar zijn, en speciale releases gekoppeld aan nieuwe attractie-openingen of jubilea.',
    relatedTermIds: ['souvenir', 'gift-shop', 'park-exclusive'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Souvenirboutique',
    shortDefinition:
      'Een retailwinkel in een themapark die souvenirs, merchandise en thema-producten verkoopt.',
    definition:
      'Een souvenirboutique is een retailruimte in een themapark gewijd aan de verkoop van souvenirs, merchandise en thema-producten — gelegen in een centraal gebied (zoals een hoofdplein) of geïntegreerd in specifieke thema-gebieden en attracties. Grote parken beheren tientallen souvenirboutiques van kleine karren tot grote warenhuis-winkels. Souvenirboutiques zijn strategisch gepositioneerd op hoogverkeerspunten: uitgangsrijen van grote attracties, hotelgangen en park in-/uitgangen waar gasten vrij tijd hebben en aankoopaanleg voelen.\n\nModerne souvenirboutiques gebruiken geavanceerde retaildesign: ingangspositionering, thema-omgeving en strategische productplaatsing. Veel attracties leiden bezoekers rechtstreeks door merchandise-zones — een bewezen retailstrategie die impulscoupures versterkt. Parken gebruiken steeds meer IP-merchandise (gelicentieerde brands en franchises) om hogere prijzen te rechtvaardigen.',
    relatedTermIds: ['merchandise', 'souvenir', 'park-exclusive'],
    aliases: ['Souvenirwinkel'],
  },
  {
    id: 'park-exclusive',
    name: 'Parkexclusief',
    shortDefinition:
      'Een product of artikel alleen beschikbaar in een specifiek themapark, niet verkrijgbaar elders.',
    definition:
      'Parkexclusieve merchandise is een product ontworpen en verkocht alleen in een specifiek themapark of in het parksysteem — niet verkrijgbaar bij enige externe retailer. Parkexclusieve artikelen creëren waargenomen schaarste, stimuleren impulsaankopen vanuit het gevoel dat het artikel nergens anders te verkrijgen is, en rechtvaardigen premiumprijs (vaak 2–3x typische retail markup). Veel voorkomende exclusiva zijn beperkte editie-kleding, verzamelspelden, thema-artikelen gekoppeld aan nieuwe attractieopeningen of seizoengebeurtenissen.\n\nDe parkexclusieve strategie is hoeksteen van moderne merchandisepsychologie: gasten die ver hebben gereisd en aanzienlijk voor toelating hebben uitgegeven, voelen verhoogde impulsaankoop voor artikelen die zij niet thuis kunnen verkrijgen. Secundaire markten (online wederverkoopplatforms) tonen aan dat zeldzame, gewenste parkexclusiva waarde behouden en waarderen, wat verdere verzamelgedrag stimuleert.',
    relatedTermIds: ['merchandise', 'souvenir', 'gift-shop'],
    aliases: ['Exclusief'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Achtbaan waarbij passagiers liggend met het gezicht naar beneden reizen.',
    definition:
      'Een flying coaster vervoert passagiers horizontaal, met het gezicht naar beneden, om de sensatie van vliegen te simuleren. De trein kantelt van de zittende positie op het perron naar horizontaal voordat de rit begint. Bekende voorbeelden: Manta (SeaWorld Orlando) en Tatsu (Six Flags Magic Mountain), beiden van B&M.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['vliegende achtbaan', 'Superman rit'],
    alternateNames: ['flyer', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mijntrein',
    shortDefinition: 'Familie-stalen achtbaan in het thema van een mijnwagentje.',
    definition:
      'Een mijntrein coaster is een familievriendelijke stalen achtbaan die is vormgegeven als een doorgereden mijnkarretje. Typisch met gematigde snelheden, kleine drops en scherpe bochten door thematische tunnels en rotsformaties. Geschikt voor een breed leeftijdsspectrum. Voorbeelden: Big Thunder Mountain Railroad (Disney-parken) en Gold Rush (Plopsaland).',
    relatedTermIds: ['steel-coaster', 'themed-land'],
    aliases: ['mijnwagentje', 'familieachtbaan'],
    alternateNames: ['mine coaster', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Achtbaan ontworpen om de natuurlijke landschap te volgen en te benutten.',
    definition:
      'Een terrain coaster is gebouwd om de natuurlijke topografie — heuvels, valleien en ravijnen — optimaal te benutten in plaats van volledig op kunstmatige structuren te steunen. De baan interageert nauw met de grond, wat een gevoel van snelheid en onderdompeling creëert. Klassieke voorbeelden: The Beast (Kings Island) en Ravine Flyer II (Waldameer).',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'airtime'],
    aliases: ['landschapsachtbaan', 'grondgebonden achtbaan'],
    alternateNames: ['terrain coaster'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Stalen achtbaan zonder vloer, waarbij de benen vrij hangen.',
    definition:
      'Bij een floorless coaster klapt de wagenvloer weg zodra de passagiers zijn vastgemaakt, waardoor de benen vrij boven de rails hangen. In tegenstelling tot inverted coasters loopt de rail onder het voertuig in plaats van erboven. B&M was pionier met Medusa (1999). Europees voorbeeld: Goliath (Walibi Holland).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster', 'dive-coaster'],
    aliases: ['achtbaan zonder vloer'],
    alternateNames: ['floorless', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition:
      'Amerikaans achtbaanfabrikant verantwoordelijk voor de eerste moderne looping.',
    definition:
      "Arrow Dynamics (opgericht in 1945) was een baanbrekende Amerikaanse fabrikant die de moderne buisstalen rail en de eerste moderne verticale looping introduceerde op Corkscrew (Knott's Berry Farm, 1975). Arrow-attracties staan bekend om hun corkscrews en suspended looping coasters. Het bedrijf vroeg in 2001 faillissement aan en de activa werden overgenomen door S&S.",
    relatedTermIds: ['steel-coaster', 'corkscrew', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition: 'Amerikaans fabrikant van houten achtbanen met snelle, bochtige layouts.',
    definition:
      'Great Coasters International (GCI) is een Amerikaans bedrijf gespecialiseerd in houten achtbanen. Opgericht in 1994 is GCI bekend om hun Millennium Flyer-treinen en layouts met snelle richtingsveranderingen en aanhoudende airtime. Bekende installaties: Wodan (Europa-Park), Thunderhead (Dollywood) en Troy (Toverland).',
    relatedTermIds: ['wooden-coaster', 'airtime', 'rmc', 'terrain-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Amerikaans fabrikant gespecialiseerd in LSM/LIM-lanceerachtbanen — in Europa bekend door de Sky Scream-familie.',
    definition:
      "Premier Rides (opgericht 1995, Baltimore, Maryland) is een Amerikaans fabrikant gespecialiseerd in lineaire synchrone motor (LSM)- en lineaire inductiemotor (LIM)-lanceersystemen. De Sky Rocket II — een compacte launch coaster met één inversie — heeft zich verspreid naar middelgrote parken wereldwijd.\n\nIn Europa is Premier Rides vooral bekend door Sky Scream in Holiday Park (Haßloch, Duitsland), een geïnverteerde familie-lanceerachtbaan die uitgroeide tot een regionale attractie. Hagrid's Magical Creatures Motorbike Adventure in Universal Orlando maakt ook gebruik van Premier's LSM-technologie.",
    aliases: ['Premier'],
    relatedTermIds: ['launch-coaster', 'gerstlauer', 'intamin'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Duits fabrikant uit München bekend om spinning coasters met trick track, het X-Car-platform en het verticale Sky Loop-model.',
    definition:
      "Maurer Rides (Maurer AG, metaalbewerking sinds 1876, attracties vanaf 1993) is een fabrikant uit München. De SC-serie spinning coasters heeft een kenmerkend trick track-segment — een sectie waarbij de wagon zijwaarts kantelt — en het X-Car-platform maakt hoogst aanpasbare compacte layouts met lanceerstarts en inversies mogelijk.\n\nDe Sky Loop is een zelfstandig verticaal loop-model dat ruimtebesparend in vele Europese parken staat. Bekende Europese installaties: Winja's Fear en Winja's Force in Phantasialand (Duitsland), indoor spinning coasters met trick track.",
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['spinning-coaster', 'xtreme-spinning-coaster', 'launch-coaster', 'gerstlauer'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      "Italiaans fabrikant met een van de grootste portfolio's van gezinsvriendelijke achtbanen en attracties ter wereld — meer dan 250 achtbanen geïnstalleerd.",
    definition:
      "Zamperla (opgericht 1966, Altavilla Vicentina, Italië) is een van de meest productieve attractiefabrikanten ter wereld. Waar Intamin, B&M en Mack zich richten op grootschalige thrill-installaties, focust Zamperla op volume en toegankelijkheid — hun Family Coaster, Mini Coaster, Twister en Disk'O Coaster zijn standaardinrichtingen van kleinere parken en vakantieresorts wereldwijd.\n\nCompacte afmetingen en gematigde lengte-eisen maken Zamperla-attracties bijzonder gangbaar in Europese stadsparken, vakantieparken en overdekte faciliteiten. Het bedrijf bouwde ook Thunderbolt op Coney Island (New York).",
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'mine-train', 'gerstlauer'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Amerikaans fabrikant bekend om pneumatische droptorens, de compacte El Loco en Free Fly 4D-achtbanen.',
    definition:
      'S&S Worldwide (opgericht 1994, Logan, Utah; overgenomen door Sansei Technologies in 2012) ontwikkelde oorspronkelijk pneumatische droptorens — Space Shot en Turbo Drop — voordat het bedrijf uitbreidde naar achtbanen. De El Loco is een compacte extreme achtbaan met een voorbij-verticale eerste helling en inversie, die veel thrills levert op een zeer kleine footprint. De Free Fly is een 4D-achtbaan waarbij de stoel vrij draait.\n\nS&S nam ook de activa van het historisch belangrijke Arrow Dynamics over na diens faillissement in 2001. In Europa zijn S&S-installaties minder gangbaar dan in Noord-Amerika.',
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['launch-coaster', 'arrow-dynamics', 'gerstlauer'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Duits fabrikant uit Beieren gespecialiseerd in gezinsachtbanen — meer dan 190 achtbanen gebouwd wereldwijd.',
    definition:
      "Zierer (opgericht 1930, Deggendorf, Beieren) is een Duits fabrikant gespecialiseerd in gezinsachtbanen en klassieke parkattrácties. De Force Coaster-reeks omvat meerdere niveaus — van compacte juniormodellen tot snellere Force Custom-installaties. Zierer-achtbanen kenmerken zich door stalen buisrail, een soepele rijervaring en gematigde lengte-eisen, ideaal voor parken die een breed publiek bedienen.\n\nMet meer dan 190 achtbanen geleverd wereldwijd is Zierer een van Europa's meest productieve achtbaanbouwers per eenheid. Bekende installaties: Feuerdrache in Legoland Deutschland en gezinsachtbanen in Duitse, Nederlandse en Scandinavische parken.",
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'mack-rides', 'gerstlauer'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition: 'Inversie waarbij de trein kort ondersteboven bijna stilstaat.',
    definition:
      'Een stall (ook zero-G stall) is een element waarbij de trein een inversie in rijdt op het hoogtepunt en bijna tot stilstand komt, waardoor passagiers ondersteboven hangen. Ontwikkeld door Rocky Mountain Construction (RMC), levert het element verlengde hangtime. Bekende voorbeelden: Zadra (Energylandia) en Steel Vengeance (Cedar Point).',
    relatedTermIds: ['inversion', 'hangtime', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall', 'RMC stall', 'hangtime element', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      'Gebogen, sterk gekantelde bocht die airtime geeft midden in de richtingsverandering.',
    definition:
      'Een wave turn is een snelle, sterk gekantelde bocht die kort negatieve of laterale G-krachten veroorzaakt, wat een airtime-gevoel geeft midden in de bocht. Veel voorkomend op Rocky Mountain Construction-attracties, combineert het element richtingsverandering met ejector- of floater-airtime. Te vinden op Wildfire (Kolmården) en Untamed (Walibi Holland).',
    relatedTermIds: ['airtime', 'overbank', 'ejector-airtime', 'rmc', 'lateral-gs'],
    aliases: ['wave turn', 'airtime bocht'],
  },
  {
    id: 'shoulder-season',
    name: 'Tussenseizoen',
    shortDefinition: 'Periode tussen hoog- en laagseizoen met matige drukte.',
    definition:
      'Het tussenseizoen verwijst naar de overgangsperioden tussen de drukste (hoog)seizoen en de rustigste perioden van een pretpark. Typisch lente (maart–mei) en vroeg najaar (september–oktober) bij Europese parken. De drukte is gematigd, prijzen zijn vaak lager en de meeste attracties zijn open — een geliefde periode voor enthousiastelingen die een goede balans zoeken.',
    relatedTermIds: ['crowd-forecast', 'school-holiday', 'crowd-level'],
    aliases: ['laagseizoen', 'shoulder season', 'rustige periode', 'off-peak'],
  },
  {
    id: 'school-holiday',
    name: 'Schoolvakantie',
    shortDefinition:
      'Schoolvakantieperioden die zorgen voor aanzienlijke druktpieken in pretparken.',
    definition:
      'Schoolvakanties — zomervakantie, kerstvakantie, paasvakantie en herfstvakantie — zijn de belangrijkste oorzaak van druktpieken in pretparken. Gezinnen met kinderen zijn het grootste bezoekersegment en concentreren hun bezoeken in deze vensters. Parken verlengen vaak hun openingstijden, breiden het programma uit en verhogen prijzen. Het vermijden van schoolvakanties is de meest effectieve strategie om wachttijden te verminderen.',
    relatedTermIds: ['crowd-forecast', 'shoulder-season', 'crowd-level'],
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
    shortDefinition: "Service voor onbeperkte digitale parkfoto's en rijtfoto's.",
    definition:
      "Een fotopass (of Memory Maker) is een optionele toevoeging die digitale toegang geeft tot alle professioneel gemaakte foto's en video's van een parkbezoek — inclusief rijtfoto's, karakterontmoetingen en rondlopende fotografen. Verkocht als forfaitair pakket, kan het voordelig zijn voor gezinnen die anders veel losse foto's zouden kopen. Bekende voorbeelden: Memory Maker (Disney) en Photo Pass (Universal).",
    relatedTermIds: ['ride-photo', 'character-meet-and-greet', 'season-pass'],
    aliases: ['Memory Maker', 'fotopakket', "parkfoto's", 'photo pass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Toegankelijkheidspas',
    shortDefinition:
      'Pas voor gasten met een beperking voor attractietoegang met verminderde wachttijd.',
    definition:
      'Een toegankelijkheidspas (ook DAS – Disability Access Service, toegankelijkheidskaart of attractietoegangspass) wordt afgegeven aan gasten die wegens een beperking niet in een gewone wachtrij kunnen staan. Het geeft de gast en een vast aantal begeleiders de mogelijkheid op een afgesproken tijd terug te keren in plaats van fysiek te wachten. Criteria en procedures variëren per park en land.',
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
      'Een bewegingssimulator combineert een hydraulisch of elektrisch aangedreven platform met een groot filmdoek, waarbij fysieke bewegingen worden gesynchroniseerd met het filmgebeuren om een meeslepende ervaring te creëren zonder traditionele rails. De capaciteit is vaak hoog en de ervaring kan worden vernieuwd door van film te wisselen. Voorbeelden: Star Tours (Disney), Mystic Manor (HKDL).',
    relatedTermIds: ['dark-ride', 'trackless-ride', 'pre-show', 'animatronics'],
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
    shortDefinition:
      'Geplande mogelijkheid om een gekostumeerd parkkarakter persoonlijk te ontmoeten.',
    definition:
      "Een karakterontmoeting is een aangewezen gebied of gepland evenement waar gasten kostuumkarakters kunnen ontmoeten, foto's kunnen maken en handtekeningen kunnen krijgen. Erg gebruikelijk in Disney- en Universal-parken; populaire karakters hebben vaak eigen ontmoetingslocaties met een eigen wachtrij. Bijzonder populair bij gezinnen met kinderen.",
    relatedTermIds: ['photo-pass', 'character-dining', 'themed-land'],
    aliases: ['meet and greet', 'karakterbeleving', 'character meet and greet', 'karakteroptreden'],
  },
  {
    id: 'pre-show',
    name: 'Voorshow',
    shortDefinition:
      'Wachtruimte die gasten voorbereidt op een attractie met verhalende elementen.',
    definition:
      'Een voorshow is een element in een themaattractie waar gasten samenkomen vóór de eigenlijke rit om verhaalcontext, veiligheidsinstructies of entertainment te ontvangen dat de sfeer zet. Voorshows hebben zowel een narratieve als operationele functie. Bekende voorbeelden: de rekruimte in de Haunted Mansion en de veiligheidsvideo van Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'animatronics', 'themed-land'],
    aliases: ['pre show', 'wachtzaalanimatie', 'stagingzone', 'pre-show'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition:
      'Grondgebonden attractie die draait, slingert of roteert – zonder traditioneel railscircuit.',
    definition:
      'Een flat ride is een categorie attracties die op een min of meer horizontaal vlak werkt, zonder verhoogde rails. De term omvat draaiattracties (carrousels, theekopjes), slingerattracties (Top Spin, zweefmolens), drop towers en rondedraaiplatforms.\n\nIn tegenstelling tot achtbanen hebben flat rides doorgaans een compact grondoppervlak en zijn ze ideaal voor kleinere parkdelen. Veel flat rides hebben een hoge capaciteit, lage of geen minimumlengte-eisen en een brede leeftijdsgeschiktheid – ze vormen vaak de ruggengraat van het gezins- en kinderprogramma van een park.',
    relatedTermIds: ['swing-ride', 'drop-tower', 'ride-capacity', 'height-requirement'],
    aliases: ['flat rides', 'kermisattractie', 'grondattractie'],
  },
  {
    id: 'water-ride',
    name: 'Waterattractie',
    shortDefinition:
      'Attractie waarbij gasten in boten of voertuigen door water worden vervoerd en nat worden.',
    definition:
      'Een waterattractie is elke attractie waarbij water een centraal onderdeel is van de beleving – het voertuig vaart door een waterkanaal of water wordt als effect ingezet. De drie meest voorkomende typen zijn: wildwaterbanen (bootjes door een goot met eindval), wildwaterritten (ronde vlotten door turbulent kunstmatig water) en waterpistoolattracties waarbij bezoekers elkaar bespuiten. Waterattracties hebben doorgaans lage minimumlengte-eisen en een breed publiek. Op warme zomerdagen kunnen de wachttijden extreem lang worden.',
    relatedTermIds: ['log-flume', 'river-rapids', 'ride-capacity', 'height-requirement'],
    aliases: ['waterrit', 'waterbaan', 'natte attractie', 'water ride'],
  },
  {
    id: 'live-show',
    name: 'Live Show',
    shortDefinition:
      'Gepland optreden met live acteurs, muziek, stunts of karakters in een theater of amfitheater.',
    definition:
      'Een live show is een gepland entertainmentprogramma uitgevoerd door mensen – in tegenstelling tot rijattracties of vaste exposities – in een openluchtamfitheater, overdekt theater of straatpodium. Het aanbod varieert van Broadway-achtige theaterproducties en stuntshows tot karakterparades, 4D-bioscoopshows met live elementen en laser- en vuurwerkspektakels. In tegenstelling tot attracties draaien live shows op vaste tijden met beperkte capaciteit per voorstelling; ze in je planning opnemen is belangrijk om conflicten te vermijden. Strategisch zijn shows een nuttige rustpauze in de drukste middaguren wanneer de wachtrijen het langst zijn.',
    relatedTermIds: ['themed-land', 'pre-show', 'ride-capacity'],
    aliases: ['show', 'liveshow', 'stuntshow', 'theatershow', 'live entertainment'],
  },
  {
    id: 'quick-service',
    name: 'Snelrestaurant',
    shortDefinition: 'Zelfbedieningsrestaurant zonder bediening aan tafel.',
    definition:
      'Een snelrestaurant (ook counter service of fast casual) verwijst naar parkrestaurants waar gasten aan een balie bestellen en zelf hun eten naar een tafel brengen. Het is de meest voorkomende vorm van parkcatering, gewaardeerd om snelheid en gemak. Disney populariseerde de term "quick service" om het te onderscheiden van "table service" in hun reserveringssysteem.',
    relatedTermIds: ['table-service', 'character-dining'],
    aliases: ['counter service', 'fastfood', 'zelfbediening', 'quick service', 'snelle hap'],
  },
  {
    id: 'table-service',
    name: 'Tafelservice',
    shortDefinition: 'Zitrestaurant met bediening, waar reserveringen vaak nodig zijn.',
    definition:
      'Tafelservicerestaurants in pretparken bieden een volledig zittend etentje met bediening. Reserveringen (bij Disney-parken vaak 60–180 dagen vooruit boekbaar) zijn sterk aangeraden, omdat populaire restaurants snel vol zitten, met name in het hoogseizoen. Tafelservice is aanzienlijk duurder dan snelrestaurants maar biedt hogere kwaliteit en een ontspannen sfeer.',
    relatedTermIds: ['quick-service', 'character-dining'],
    aliases: ['table service', 'zitrestaurant', 'bediening aan tafel', 'reserveringsrestaurant'],
  },
  {
    id: 'character-dining',
    name: 'Karakterdiner',
    shortDefinition:
      'Restaurant waarbij gekostumeerde karakters langs de tafels komen tijdens de maaltijd.',
    definition:
      "Karakterdiner is een tafelservice- (of soms buffet-)restaurantervaring waarbij gekostumeerde karakters langs elke tafel komen om te interageren met gasten, foto's te maken en handtekeningen te geven. Het garandeert een karakterontmoeting zonder een aparte wachtrij, wat het populair maakt bij gezinnen. Voorbeelden: Chef Mickey's (Disney World) en het Prinsessen Storybook Diner in Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['table-service', 'character-meet-and-greet', 'quick-service'],
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
      'Torenaantractie die gasten omhoogbrengt en hen in vrije val naar beneden laat vallen.',
    definition:
      'Een drop tower (ook vrije-val-toren of free-fall tower) is een attractie waarbij bezoekers in een gondel of individuele stoelen rondom een centrale torenkonstruktie worden omhooggebracht en vervolgens in een snelle val naar beneden worden losgelaten. De val kan nagenoeg gewichtloos zijn (echte vrije val), geremd, of gecombineerd met een katapultimpuls omhoog. Onderin remt het systeem de gondel geleidelijk af. Varianten zijn roterende drop towers, meerdimensionale modellen en hybride versies. Drop towers bieden intense ervaringen op een compact grondoppervlak en zijn wereldwijd te vinden. Bekende fabrikanten: Intamin, Mondial en S&S Worldwide.',
    relatedTermIds: ['flat-ride', 'height-requirement', 's-and-s-worldwide', 'intamin'],
    aliases: ['vrije-val-toren', 'free fall tower', 'drop ride', 'vrijeval', 'drop towers'],
  },
  {
    id: 'log-flume',
    name: 'Wildwaterbaan',
    shortDefinition:
      'Waterkanaal-attractie waarbij bootje-achtige voertuigen een goot afleggen en eindigen met een grote plons.',
    definition:
      'Een wildwaterbaan (ook log flume of boomstambootje) is een waterattractie waarbij gasten in boomstamvormige bootjes door een watergevuld kanaal glijden. Na rustigere secties volgt een steile helling waarbij het bootje in een waterbekken plonst en passagiers vrijwel zeker nat worden. Wildwaterbanen dateren uit de jaren 1960 en zijn inmiddels een standaard in parken wereldwijd. Ze zijn familievriendelijk, hebben een gemiddelde capaciteit en zijn klassieke zomerattracties. Bekende Europese voorbeelden: Poseidon in Europa-Park en talrijke wildwaterbanen in Duitstalige parken.',
    relatedTermIds: ['water-ride', 'river-rapids', 'height-requirement'],
    aliases: ['boomstambootje', 'log flume', 'plonsbaan', 'wildwaterrit', 'waterglijbaan'],
  },
  {
    id: 'river-rapids',
    name: 'Wildwaterrit',
    shortDefinition:
      'Rondboot-attractie door turbulente kunstmatige stroomversnellingen waarbij alle inzittenden nat kunnen worden.',
    definition:
      'Een wildwaterrit (ook river rapids of vlottenrit) vervoert gasten in ronde opblaasbare of kunststof vlotten door een kunstmatig kanaal dat stroomversnellingen simuleert. Doordat het ronde vlot vrij draait op de stroom, is elke rit onvoorspelbaar: afhankelijk van de positie van het vlot worden sommige inzittenden doorweekt, anderen blijven relatief droog. Wildwaterritten hebben doorgaans een hoge capaciteit, een brede gezinsaantrekkingskracht en lage minimumlengte-eisen. Ze zijn bijzonder populair op warme dagen. Bekende Europese voorbeelden: de Wildwasser-attracties in Phantasialand en diverse ritten in Efteling, Europa-Park en Thorpe Park.',
    relatedTermIds: ['water-ride', 'log-flume', 'height-requirement'],
    aliases: ['vlottenrit', 'river rapids', 'wildwater', 'stroomversnellingenrit', 'raftingrit'],
  },
  {
    id: 'pendulum-ride',
    name: 'Pendelattractie',
    shortDefinition:
      'Flat ride waarbij een gondel in een wijde pendelboog slingert, vaak terwijl de gondel ook ronddraait.',
    definition:
      'Een pendelattractie is een type flat ride waarbij een gondel of stoelrij bevestigd is aan een lange arm die in een steeds grotere boog heen en weer slingert, vaak tot bijna loodrecht. Veel pendelattracties draaien de gondel ook om haar eigen as, waardoor de slingerbeweging gecombineerd wordt met rotatie voor extra intensiteit.\n\nBekende voorbeelden zijn de Top Spin (Huss), waarbij een horizontale rij stoelen slingert en tegelijk roteert, en de Frisbee (Mondial), waarbij een schijfvormige gondel slingerend rondspint. Pendelattracties zijn populair in pretparken en op kermissen vanwege hun spectaculaire uitstraling en relatief compact grondoppervlak.',
    relatedTermIds: ['flat-ride', 'swing-ride', 'drop-tower', 'height-requirement'],
    aliases: ['Top Spin', 'Top Spins', 'Frisbee', 'Frisbees', 'pendelattracties'],
    alternateNames: ['slingerattractie', 'pendelschommel'],
  },
  {
    id: 'swing-ride',
    name: 'Zweefmolen',
    shortDefinition:
      'Ronddraaiende attractie waarbij stoeltjes aan kettingen naar buiten slingeren als de molen draait.',
    definition:
      'Een zweefmolen (ook kettingcarrousel of Kettenflieger) is een ronddraaiende attractie waarbij stoeltjes aan kettingen aan een centrale draaiende structuur hangen. Bij het ronddraaien worden de stoeltjes door de middelpuntvliedende kracht naar buiten en omhoog geslingerd, wat passagiers het gevoel van vliegen geeft. Zweefmolens zijn een van de oudste nog bestaande kermisattracties en stammen uit het begin van de 20e eeuw. Moderne versies variëren van zachte kinderdraaimolens tot enorme kettingtorens (starflyers) die passagiers tientallen meters omhoogbrengen. Ze zijn in vrijwel elk pretpark en op kermissen wereldwijd te vinden.',
    relatedTermIds: ['flat-ride', 'ride-capacity', 'height-requirement'],
    aliases: ['kettingcarrousel', 'kettingvlieger', 'Kettenflieger', 'swing ride', 'chairoplane', 'zweefmolens'],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Twee parallelle achtbaanrails waarop treinen tegelijkertijd rijden en zij aan zij racen.',
    definition:
      'Een racing coaster heeft twee afzonderlijke maar gespiegelde achtbaanrails die parallel aan elkaar lopen; de treinen worden tegelijkertijd weggestuurd zodat passagiers de beleving hebben te racen tegen de andere trein. De rails kruisen elkaar of komen op meerdere punten extreem dichtbij, waardoor de spanning maximaal is. Sommige racing coasters zijn gebouwd als Möbius-lus: beide rails vormen één doorgaand circuit en passagiers wisselen automatisch van kant. Het format werkt even goed met houten als met stalen achtbanen. Bekende Europese voorbeelden: Piraten in Djurs Sommerland en Dwervelwind in Plopsaland.',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'credit'],
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
      "Een High Five is een bijna-botsings-element waarbij twee achtbaantreinen op afzonderlijke maar nauw bij elkaar gelegen rails elkaar op extreem korte afstand passeren – soms binnen armlengte – waardoor een spannende illusie van een dreigende botsing ontstaat. De naam verwijst naar het gevoel dat passagiers de inzittenden van de andere trein zouden kunnen aanraken. Het element vereist nauwkeurige ritme-coördinatie zodat beide treinen gelijktijdig op het kruispunt aankomen. Wing coasters en inverted coasters lenen zich bijzonder goed voor het High Five-element omdat de buitenwaartse stoelen het bijna-raakeleffect versterken. Duelling Dragons / Dragon Challenge in Universal's Islands of Adventure was een beroemd vroeg voorbeeld; het element komt tegenwoordig voor op diverse B&M wing coasters wereldwijd.",
    relatedTermIds: ['wing-coaster', 'inverted-coaster', 'b-and-m'],
    aliases: ['bijna-botsing element', 'near miss', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Tafelreservering',
    shortDefinition: 'Vooruitboeking voor een tafelservice-restaurant in een pretpark of resort.',
    definition:
      'Een tafelreservering is een vooruitboeking voor een tafelservice- of karakterdiner-restaurant in een pretpark, resorthotel of aanverwant entertainmentcomplex. Bij Disney-parken zijn reserveringen tot 60 dagen van tevoren mogelijk (met 10 dagen voorsprong voor resorthotelgasten) en zijn ze onmisbaar voor de populairste restaurants – wie niet op tijd boekt kan er tijdens drukke periodes simpelweg niet in. Reserveringen worden gewoonlijk gegarandeerd met een creditcard; Disney brengt kosten in rekening bij een no-show of late annulering. In de enthousiastengemeenschap worden tafelreserveringen ook wel aangeduid als ADR (Advance Dining Reservation).',
    relatedTermIds: ['table-service', 'character-dining', 'peak-season'],
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
      'Mobiel bestellen stelt gasten in staat via de officiële park-app een restaurantmenu te bekijken, een bestelling te plaatsen en te betalen, en een ophaaltijdvak te kiezen – zonder aan de balie te hoeven aanschuiven. Disney maakte het systeem populair in zijn snelrestaurants; Universal, Six Flags, Merlin-parken en vele andere operators hebben sindsdien hun eigen versies ingevoerd. Wanneer het gekozen tijdvak aanbreekt, ontvangen gasten een melding om naar het speciale mobile-order-afhaalpunt te gaan. Mobiel bestellen bespaart aanzienlijk tijd op drukke middagmomenten. Vereist een opgeladen smartphone en voldoende netwerkdekking in het park.',
    relatedTermIds: ['quick-service', 'dining-reservation'],
    aliases: ['mobiele bestelling', 'mobile order', 'app-bestelling', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Grote gedeelde eetzaal met meerdere snelrestaurant-balies en verschillende keukens onder één dak.',
    definition:
      'Een food court is een gemeenschappelijke horecazone met meerdere zelfstandige snelrestaurant-balies of kraampjes die verschillende keukens aanbieden en een gezamenlijke zitruimte delen. In pretparken zijn food courts doorgaans de horecalocaties met de hoogste capaciteit, ontworpen om het middagse bezoekersvolume op te vangen. Verschillende leden van een gezelschap kunnen bij verschillende balies bestellen en toch samen zitten. Het thematingsniveau varieert: Disney en Universal integreren food courts vaak in de landthematiek, andere parken exploiteren ze als puur functionele rustplaatsen nabij ingangen. Food courts zijn in de regel de meest betaalbare eetoptie binnen een park.',
    relatedTermIds: ['quick-service', 'table-service', 'mobile-ordering'],
    aliases: ['eetplein', 'eetzaal', 'food court', 'restaurantplein'],
  },
  {
    id: 'capacity-closure',
    name: 'Capaciteitssluiting',
    shortDefinition:
      'Wanneer een park geen nieuwe bezoekers meer toelaat omdat de maximumcapaciteit is bereikt.',
    definition:
      'Een capaciteitssluiting (ook: uitverkocht park of capaciteitsplafond) treedt op wanneer een pretpark zijn maximaal toegestane of operationeel veilige bezoekersaantal bereikt en tijdelijk stopt met het verkopen van dagtickets of het toelaten van nieuwe bezoekers. Parken sturen capaciteit bij via tijdgebonden toegangsboekingen, realtime bezoekerstellingen en tijdelijke ingangssluitingen. Jaarkaarthouders kunnen op capaciteitsdagen afhankelijk van de parkregels worden geweigerd; andere parken gebruiken reserveringssystemen die overbezetting van tevoren voorkomen. Capaciteitssluitingen zijn het meest voorkomend tijdens schoolvakantiepieken, vuurwerkevenementen en speciale evenementenavonden. Even de park-app of sociale media raadplegen op de ochtend van je bezoek kan onaangename verrassingen voorkomen.',
    relatedTermIds: ['peak-season', 'annual-pass', 'school-holiday', 'crowd-level'],
    aliases: ['park vol', 'park uitverkocht', 'capacity closure', 'capaciteitsgrens', 'volzit'],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      'Een zero-G roll-variant met een ingebouwde richtingsverandering — de trein verlaat de inversie op een andere koers dan bij aanvang.',
    definition:
      "De zero-G winder combineert het zweefgevoel van een zero-G roll — een 360-graden inversie langs een parabolische boog waarbij rijders bij de top bijna gewichtloosheid ervaren — met een richtingsverandering in de baangeometrie. Terwijl bij een standaard zero-G roll de trein parallel in- en uitrijdt, buigt de winder de baan tijdens de rotatie zodanig dat de trein in een duidelijk andere richting uitkomt dan hij het element betrad. Dit maakt het element tegelijk een inversie én een layoutovergang: het levert het zwevende gevoel van een inversie terwijl de coaster naar het volgende deel van het parcours geleid wordt.\n\nZero-G winders zijn sterk geassocieerd met nieuwere, technisch ambitieuze ontwerpen van fabrikanten als Intamin en B&M. Kondaa in Walibi Belgium en VelociCoaster in Universal's Islands of Adventure zijn twee van de bekendste voorbeelden. De combinatie van airtime, inversie en richtingsverandering in één enkel element maakt de zero-G winder tot een van de meest veelzijdige elementen in het moderne achterbaanontwerp.",
    relatedTermIds: ['zero-g-roll', 'inversion', 'airtime', 'intamin'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Een uitgerekt, asymmetrisch dubbel-inversie-element waarbij twee inversies verbonden zijn door een lange gebogen boog — van bovenaf gezien in de vorm van een banaan.',
    definition:
      'De banana roll is een uitgerekte variant van het dubbel-inversie-concept, waarbij de twee inversies verder uit elkaar liggen en verbonden worden door een brede, gebogen sectie in plaats van de strakke, symmetrische opeenvolging van een standaard cobra roll. Van bovenaf gezien volgt de baan een geleidelijke boog door beide inversies, die doet denken aan de ronde vorm van een banaan. De lossere geometrie verspreidt de twee inversies over een langere baanlengte, waardoor rijders een vloeienderen, uitgestrekter ervaring door beide inversies beleven.\n\nDe banana roll verscheen voor het eerst in 2011 op Takabisha in Fuji-Q Highland, Japan, gebouwd door Gerstlauer. S&S Worldwide ontwikkelde later een eigen, dubbel-inverterende variant voor Steel Curtain in Kennywood. Omdat het element aanzienlijke zijdelingse ruimte vereist, komt het doorgaans voor op grotere, grondnabije installaties waar de baan breed kan uitzwaaien tussen de twee inversies.',
    relatedTermIds: ['cobra-roll', 'inversion', 'gerstlauer', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Gekantelde Looping',
    shortDefinition:
      'Een verticale looping die schuin staat ten opzichte van zijn loodrechte as — de trein nadert en verlaat de looping onder een hoek.',
    definition:
      'Een gekantelde looping (Engels: inclined loop of tilted loop) is een standaard verticale looping die om zijn as is gedraaid, doorgaans met 45 tot 80 graden ten opzichte van de rijrichting. In plaats van dat de trein de looping rechtdoor inrijdt en verlaat — zoals bij een klassieke rechte looping — benadert en verlaat hij het element schuin, wat zowel een asymmetrisch visueel profiel als een duidelijk andere rijervaring oplevert.\n\nDe gekantelde geometrie verandert hoe rijders de inversie beleven: de aanloop voelt meer zijdelings dan bij een standaard looping, en het herstelpunt onderin de cirkel komt van een onverwachte kant, wat zowel desoriënterend als opwindend kan zijn. Voor toeschouwers is een gekantelde looping direct herkenbaar als bijzonder en ziet er visueel veel dramatischer uit dan een rechte looping. Gekantelde loopings komen voor op diverse B&M- en Intamin-achtbanen, vaak in het midden of het einde van een parcours.',
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m', 'intamin'],
    aliases: ['tilted loop', 'scheve looping', 'gekantelde loop', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Een Vekoma dubbel-inversie-element waarbij de trein in dezelfde richting uitrijdt als hij is ingereden.',
    definition:
      "De sea serpent is een dubbel-inversie-element dat nauw verbonden is met de ontwerpen van Vekoma's inverted coasters. Net als de cobra roll bestaat het uit twee inversiesequenties die door een centrale verbindingssectie zijn samengevoegd, maar de baangeometrie verschilt op een belangrijk punt: terwijl de cobra roll de trein 180 graden van richting laat veranderen, is de sea serpent zo aangelegd dat de trein in dezelfde algemene richting het element verlaat als hij het betrad. De twee inversies zwaaien omhoog en over in een vloeiende reeks zonder de rijrichting te keren, wat het element van opzij een lang, S-bochtig aanzien geeft — als het lichaam van een zeeslang die door twee golven omhoogrijst.\n\nSea serpents zijn te vinden op Vekoma's Suspended Looping Coaster (SLC) en op enkele aangepaste installaties van de fabrikant. Omdat de SLC in grote aantallen is geproduceerd voor parken over de hele wereld, is de sea serpent een van de meest verspreide dubbel-inversie-elementen ter wereld, ook al is hij minder bekend bij naam dan de cobra roll.",
    relatedTermIds: ['inversion', 'cobra-roll', 'batwing', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Een RMC-signatuurelement dat de eerste val en een volledige barrel roll samenvoegt tot één aaneengesloten sequentie — rijders staan ondersteboven terwijl ze nog dalen.',
    definition:
      "De barrel roll drop is een van de meest gevierde signatuurelementen van Rocky Mountain Construction en combineert twee normaal gesproken afzonderlijke ervaringen — de eerste val en een volledige inversie — tot één ononderbroken sequentie. Na het verlaten van de lifthill roteert de baan de trein door een volledige barrel roll terwijl hij tegelijkertijd daalt: rijders bevinden zich volledig ondersteboven nabij het steilste punt van de val, om vervolgens rechtop te worden gedraaid als de trein de onderkant bereikt en overgaat in de rest van het parcours.\n\nHet element werd mogelijk gemaakt door RMC's I-Box staalspoorsysteem, dat de strakke radii en complexe driedimensionale geometrie toestaat die nodig zijn voor een gelijktijdige rol en val — een combinatie die op traditioneel houten achterbaanspoor structureel onmogelijk zou zijn geweest. Medusa Steel Coaster in Six Flags Mexico behoorde tot de vroege achtbanen met een barrel roll drop; Steel Vengeance in Cedar Point en Zadra in Energylandia zijn andere gevierde voorbeelden.",
    relatedTermIds: ['inversion', 'rmc', 'first-drop', 'hybrid-coaster', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run — een remzone halverwege het parcours die de trein volledig kan stoppen om veilig meertreinsoperatie mogelijk te maken.',
    definition:
      'Een mid-course brake run (MCBR) is een reminrichting ergens in het midden van het parcours van een achtbaan — na de eerste grote elementen maar vóór de slotsequentie. In tegenstelling tot trimremmen, die alleen de snelheid verminderen zodat de trein direct kan doorrijden, is een MCBR een volledige bloksectierem: hij kan de trein volledig stoppen en vasthouden totdat de volgende bloksectie voor hem vrij is gemeld. Dit maakt het mogelijk om meerdere treinen tegelijk op hetzelfde spoor te laten rijden zonder botsingsgevaar, wat de capaciteit van de attractie aanzienlijk vergroot.\n\nOp een drukke bedrijfsdag met volledig bezette treinstarters geeft een goed getimede MCBR een gestopte trein bijna onmiddellijk vrij en zullen rijders de korte vertraging nauwelijks opmerken. Op rustigere dagen met minder treinen in omloop kan de stop langer duren. MCBRs zijn standaard op de meeste grote achtbanen: B&M inverted- en floorless coasters, veel Intamin-attracties en andere hoogcapaciteitsattracties maken er routinematig gebruik van.',
    relatedTermIds: ['block-brake', 'brake-run', 'trim-brake', 'stacking', 'ride-capacity'],
    aliases: ['mid-course brake run', 'tussenbremssectie', 'middenrem', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Verstrengelde Loops',
    shortDefinition:
      'Twee verticale loops waarvan de vlakken elkaar kruisen — een visueel spectaculair schakelring- of achtpatroon.',
    definition:
      'Verstrengelde loops (Engels: interlocking loops) zijn twee verticale loops die zo zijn geplaatst dat hun structurele vlakken elkaar snijden, doorgaans op nagenoeg loodrechte hoeken. Het resultaat is een frappante visuele configuratie waarbij één loop vanuit bepaalde hoeken schijnbaar door de andere heen loopt, als een schakelring of een reusachtige acht die uit de grond oprijst. De constructieve complexiteit om twee loops zo in te snijden dat de sporen elkaar niet daadwerkelijk raken is aanzienlijk, maar de visuele impact maakt het element tot een blikvangend pronkstuk in het panorama van een park.\n\nVerstrengelde loops worden het meest geassocieerd met B&M inverted coasters en zitachtbanen met een hoog inversieaantal. Dragon Khan in PortAventura, lang een van de bekendste Europese achtbanen, heeft verstrengelde loops als onderdeel van zijn acht-inversies-parcours, en de kruisende loopsectie is een van de meest gefotografeerde delen van de rit.',
    relatedTermIds: ['vertical-loop', 'inversion', 'b-and-m'],
    aliases: ['verstrengelde loops', 'interlocking loops', 'gekruiste loops'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'Het pal-veiligheidssysteem op een lifthill dat verhindert dat de trein achteruit rolt — en de bron van het kenmerkende klik-klak-geluid.',
    definition:
      'Een anti-rollback (ook wel rollback-pal) is een mechanisch veiligheidssysteem dat langs de onderkant van een lifthill is aangebracht. Terwijl de trein omhoog klimt, rasten veerbelaste metalen klinken over een tandenreeks die in de lifthillstructuur is verzonken. Als de ketting of de aandrijving zou falen, grijpen de klinken in de tanden en blokkeren ze de trein zodat hij niet achteruit kan rollen. Het rasten van de klinken over de tanden is de bron van het ritmische klik-klak-geluid dat is uitgegroeid tot een van de meest herkenbare geluidskenmerken van traditionele achtbanen.\n\nOp moderne achtbanen met stille kabelliften of LSM-aangedreven lifthills worden anti-rollbackklinken vaak vervangen door stille elektromagnetische remsystemen — daarom zijn sommige nieuwe lifthills merkbaar stiller. Enthousiastelingen betreuren soms het verlies van dit klassieke akoestische ritueel.',
    relatedTermIds: ['lifthill', 'rollback', 'launch-coaster'],
    aliases: ['anti-rollback systeem', 'rollback-pal', 'klik-klak'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Constructie-elementen die ontworpen zijn om rakelings over de hoofden van rijders te passeren — een aangrijpende bijna-botsing-illusie.',
    definition:
      'Head choppers zijn bewuste ontwerpelementen waarbij de draagconstructie, dwarsverbanden, tunnels of andere baansecties op het moment dat de trein op topsnelheid rijdt, direct boven de hoofden van de rijders doorgaan. De nabijheid en timing creëren een krachtige illusie dat er iets op het punt staat de rijders te raken — een adrenalinemomenten zonder enig echt gevaar, want de vrije ruimte is precies berekend. Het effect is het sterkst wanneer rijders er niet op voorbereid zijn: een trein die uit een gecantelde bocht accelereert kan onder een lage ligger doorscheuren voordat het brein de situatie kan registreren.\n\nHead choppers zijn sterk geassocieerd met strak gebouwde houten achtbanen en inverted coasters, waar het hangende profiel van de treinen rijders dicht bij steunpilaren en aangrenzende baansecties brengt. Voor veel enthousiastelingen zijn goed ontworpen head choppers een teken van creatief baanontwerp.',
    relatedTermIds: ['roller-coaster-element', 'inverted-coaster', 'twister-coaster'],
    aliases: ['head chopper', 'bijna-botsing', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Wanneer een rijoperator beugels of schouderbanden te strak aantrekt — waardoor comfort en airtime verloren gaan.',
    definition:
      'Stapling verwijst naar de praktijk — opzettelijk of uit overvoorzichtigheid — waarbij een operator een schootbeugel of schouderbeugel zo stevig tegen een rijder aandruwt dat die significant strakker zit dan de minimaal vereiste veiligheidsstand. De term komt van het gevoel in de stoel te zijn "geniet". Bij airtime-georiënteerde achtbanen zijn schootbeugels juist bedoeld om los genoeg te zitten zodat rijders aan de top van heuvels iets van hun stoel kunnen loskomen — dat is airtime. Een gestapelde rijder wordt tijdens de hele rit plat op de stoel gedrukt en kan het beoogde zweefgevoel niet ervaren, hoe goed de heuvels ook zijn ontworpen.\n\nStapling is een veelgehoorde bron van frustratie in de enthousiastengemeenschap, met name bij houten achtbanen en hybride coasters waar airtime de hoofdattractiviteit is. Sommige parken staan bekend om hun consequent losse, rijdersvriendelijke beugelpolitiek; anderen worden bekritiseerd voor systematisch te strak aantrekken.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'ejector-airtime'],
    aliases: ['gestapeld', 'te strakke beugel', 'over-stapled'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Wanneer een achtbaantrein halverwege genoeg vaart verliest om vast te komen zitten in een laagpunt van de baan en de rit niet kan afmaken.',
    definition:
      'Valleying treedt op wanneer een trein tijdens de rit te veel kinetische energie heeft verloren, onvoldoende snelheid meer heeft om het volgende element te overwinnen en tot stilstand komt — of terugrollt — in een dal tussen twee hoge punten op de baan. Omdat de trein nu op een laagpunt staat en niet op een remzone of in het station, kunnen de normale bedrijfssystemen hem niet bewegen. Berging vereist doorgaans onderhoudspersoneel dat de trein handmatig over het volgende hoge punt duwt of wintst en de rijders evacueert.\n\nValleying is zeldzaam onder normale bedrijfsomstandigheden omdat achtbanen zijn ontworpen met ruime snelheidsmarges. Het is vaker waarschijnlijk bij ongewoon koud weer (wanneer wiellagering traag werkt), na overmatig remmen via trimbremmen, of op verouderde houten achtbanen waarvan de baangeometrie in de loop der tijd is verschoven.',
    relatedTermIds: ['rollback', 'trim-brake', 'brake-run', 'downtime'],
    aliases: ['valleyed', 'vastgelopen trein', 'trein in dal'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Een achtbaantype met kleine individuele wagentjes en een compact circuit van strakke, vlakke haarspeldbochten aan de rand van verhoogde platforms.',
    definition:
      'Een wild mouse (wilde muis) gebruikt kleine wagentjes van twee tot vier personen in plaats van lange treinen. Het handelsmerk is een reeks strakke, nauwelijks gecantelde haarspeldbochten die aan de buitenste rand van de baan worden genomen. Omdat de bochten niet steil zijn gecanteld — anders dan bij andere achtbanen — worden rijders zijdelings tegen de wand van het wagentje geduwd, en door de traagheid van de aanloop lijkt de bocht later te komen dan verwacht, wat de overtuigende illusie schept dat het wagentje van de baan gaat glijden.\n\nWild mouse-achtbanen behoren tot de meest ruimte-efficiënte ontwerpen en verpakken verrassend veel baanlengte in een compacte footprint door de niveaus van haarspeldbochten op elkaar te stapelen. Ze zijn wereldwijd te vinden bij parken van uiteenlopende grootte. Fabrikanten zijn onder meer Mack Rides, Maurer en Gerstlauer.',
    relatedTermIds: ['spinning-coaster', 'steel-coaster', 'mack-rides', 'gerstlauer'],
    aliases: ['wild mouse coaster', 'wilde muis', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: '4D Coaster',
    shortDefinition:
      'Een achtbaantype waarbij stoelen op roterende armen buiten de trein zijn gemonteerd en onafhankelijk van de rijrichting kunnen draaien.',
    definition:
      'Een fourth dimension coaster (4D-coaster) is een ontwerp waarbij de passagiersstoelen niet vast aan de trein zijn bevestigd, maar op zwenkbare armen die links en rechts van elke wagen uitsteken. De stoelen kunnen naar voren of achteren draaien onafhankelijk van de rijrichting — aangestuurd door een vaste stuurrail naast de hoofdbaan (die de stoelpositie op elk moment van het parcours bepaalt) of door vrije rotatie aangedreven door zwaartekracht en gewichtsverdeling. Het resultaat: passagiers kunnen tijdens een afdaling naar beneden wijzen, in een bocht ondersteboven hangen of bij inversies tegelijkertijd om meerdere assen roteren.\n\nHet concept werd ontwikkeld door Arrow Dynamics en later verfijnd door S&S Worldwide. X2 in Six Flags Magic Mountain (Californië) is de bekendste 4D-coaster ter wereld, geopend in 2002 als de eerste van zijn soort. Eejanaika in Fuji-Q Highland, Japan, houdt het record voor het hoogste inversieaantal van elke achtbaan, mede dankzij de stoelrotatie die het inversionstelling verveelvoudigt.',
    relatedTermIds: [
      'inverted-coaster',
      'spinning-coaster',
      'arrow-dynamics',
      's-and-s-worldwide',
      'inversion',
    ],
    aliases: ['4D coaster', '4D-achtbaan', 'vierde dimensie achtbaan', 'free spin coaster'],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'Een achtbaanparcours dat rechtlijnig van het station wegloopt, aan het einde van het terrein omkeert en parallel terugkeert.',
    definition:
      'Een out-and-back is een van de twee fundamentele achtbaanparcourstypen. De trein verlaat het station, rijdt in een globaal rechte richting weg — doorgaans over een reeks heuvels geoptimaliseerd voor airtime — maakt een keerpunt aan het einde van het terrein en keert terug over een parcours parallel aan het heentraject. De twee benen kruisen elkaar zelden, wat een lang en smal grondplan oplevert.\n\nOut-and-back-ontwerpen zijn sterk geassocieerd met traditionele houten achtbanen, waarbij de op het lange heentraject opgebouwde snelheid op de terugweg wordt benut door een reeks steeds snellere, lagere heuvels die maximale floater-airtime opleveren. Bekende voorbeelden zijn The Voyage in Holiday World en diverse Racer-modellen.',
    relatedTermIds: ['twister-coaster', 'airtime', 'wooden-coaster', 'airtime-hill'],
    aliases: ['out and back', 'out-and-back parcours', 'heen-en-terugachtbaan'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Een achtbaanparcours dat spiraalvormig over zichzelf terugvouwt — maximale elementen in een compact grondplan.',
    definition:
      'Een twister-coaster (ook cyclone-layout) is een achtbaanontwerp waarbij de baan spiraalvormig verloopt, terugvouwt en zich herhaaldelijk boven of onder zichzelf kruist, in plaats van het eenvoudige tweebenigetraject van een out-and-back. Het kenmerkende is dat de trein regelmatig vlak langs andere secties van dezelfde baan passeert — vaak in verschillende richtingen en op verschillende hoogtes — waardoor head-chopper-effecten en visuele complexiteit ontstaan.\n\nTwister-layouts zijn ruimte-efficiënt: veel baanlengte en hoogteverschil kunnen in een compacte, ruwweg vierkante footprint worden samengebracht. Dit maakt ze populair bij parken met beperkte ruimte. Houten twisters zijn onder meer de Twister in Gröna Lund in Stockholm; stalen twisters omvatten veel B&M- en Intamin-ontwerpen.',
    relatedTermIds: ['out-and-back', 'wooden-coaster', 'head-choppers', 'helix'],
    aliases: ['twister layout', 'cyclone', 'twister achtbaan'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error — de gemiddelde afwijking in minuten tussen voorspelde en werkelijke wachttijd.',
    definition:
      'MAE (Mean Absolute Error, gemiddelde absolute fout) is de standaard nauwkeurigheidsmaatstaf bij park.fan. Het berekent het gemiddelde verschil — in minuten — tussen elke voorspelde wachttijd en de werkelijk gemeten wachttijd bij de attractie. Een MAE van 8 minuten betekent dat de voorspellingen gemiddeld 8 minuten afwijken.\n\nDe MAE weegt elke fout even zwaar: een fout van 5 minuten en een fout van 15 minuten worden lineair gemiddeld. Dat maakt het intuïtief — MAE = 10 betekent "voorspellingen liggen doorgaans binnen 10 minuten van de werkelijkheid." Een lagere MAE betekent altijd nauwkeurigere voorspellingen.',
    relatedTermIds: ['rmse', 'mape', 'r-squared', 'ai-forecast'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error — vergelijkbaar met MAE maar straft grote voorspellingsfouten zwaarder af.',
    definition:
      'RMSE (Root Mean Square Error, kwadratische gemiddelde fout) meet de nauwkeurigheid door elke fout te kwadrateren voor het middelen, waarna de vierkantswortel wordt genomen. Grote uitschieters — een wachttijd die 40 minuten te hoog of te laag wordt voorspeld — wegen daardoor veel zwaarder dan kleine fouten van 5 minuten. De RMSE is altijd gelijk aan of groter dan de MAE.\n\nEen groot verschil tussen RMSE en MAE wijst erop dat het model soms flink de mist in gaat, ook al zijn de meeste voorspellingen nauwkeurig. Beide maatstaven zijn live te zien op de park.fan-startpagina.',
    relatedTermIds: ['mae', 'mape', 'r-squared', 'ai-forecast'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error — de voorspellingsfout uitgedrukt als percentage van de werkelijke wachttijd.',
    definition:
      'MAPE (Mean Absolute Percentage Error, gemiddelde absolute procentuele fout) drukt de nauwkeurigheid uit als percentage in plaats van minuten. In plaats van "8 minuten naast" zegt het "15% van de werkelijke wachttijd naast". Dat is handig om nauwkeurigheid te vergelijken tussen attracties met zeer verschillende wachttijden — een fout van 10 minuten is veel ernstiger bij een attractie met normaal 15 minuten dan bij een met 90 minuten.\n\nDe MAPE kan misleidend hoog zijn bij zeer korte wachttijden. Daarom toont park.fan hem altijd samen met MAE en RMSE.',
    relatedTermIds: ['mae', 'rmse', 'r-squared', 'ai-forecast'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R-kwadraat — meet hoe goed het AI-model de patronen in echte wachttijden verklaart (0–1, hoger is beter).',
    definition:
      'R² (R-kwadraat, ook determinatiecoëfficiënt) meet hoeveel van de variatie in echte wachttijden het model succesvol verklaart. Een waarde van 1,0 betekent perfecte voorspellingen; 0,0 betekent dat het model niets verklaart boven een eenvoudig gemiddelde. Waarden boven 0,7 zijn sterk; boven 0,9 uitstekend.\n\nBij wachttijdprognoses is een hoge R² moeilijk te behalen, omdat wachtrijen beïnvloed worden door onvoorspelbare factoren. De park.fan R²-waarde weerspiegelt de werkelijke prestaties over alle bijgehouden voorspellingen en wordt dagelijks bijgewerkt.',
    relatedTermIds: ['mae', 'rmse', 'mape', 'ai-forecast'],
    aliases: ['R-squared'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Seizoensattractie',
    shortDefinition:
      'Een attractie, show of beleving die alleen gedurende bepaalde maanden van het jaar in gebruik is — zoals een ijsbaan in de winter of een waterbaan in de zomer.',
    definition:
      'Een seizoensattractie is een rit, show of beleving die het park alleen in een bepaalde periode van het jaar aanbiedt. Ijsbanen, rodelbanen en winterse shows draaien doorgaans van november tot februari; wildwaterbanen, waterspeelgebieden en openluchtspectakels van mei tot september. Sommige seizoensattracties zijn gekoppeld aan specifieke evenementen zoals Halloween of Kerst.\n\nOp park.fan worden seizoensattracties en shows automatisch herkend op basis van historische bedrijfsgegevens en verborgen in de tabbladen van het park en op de kaart wanneer ze buiten hun actieve maanden vallen — om de overzichtelijkheid te bewaren en je te helpen focussen op wat er vandaag daadwerkelijk open is. Een seizoensbadge (❄️ Winter, ☀️ Zomer of 🍃 generiek) verschijnt op elke betreffende kaart. Als de attractie buiten seizoen is, wordt het badge gedempt weergegeven. Een filterknop in de tabbladen laat verborgen items zien wanneer dat nodig is.',
    relatedTermIds: ['offseason', 'refurbishment', 'crowd-calendar'],
    aliases: ['seizoensrit', 'seizoensshow', 'tijdelijke attractie'],
  },
];

export default translations;
