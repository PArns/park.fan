/**
 * Client-side glossary data for Tooltip support.
 * Auto-generated from content/glossary/{locale}.ts files.
 * Do NOT edit manually — run: npm run generate:client-glossary
 */

import type { Locale } from '@/i18n/config';

export interface ClientGlossaryTerm {
  name: Record<Locale, string>;
  shortDefinition: Record<Locale, string>;
}

export const CLIENT_GLOSSARY_TERMS: Record<string, ClientGlossaryTerm> = {
  'wait-time': {
    name: {
      en: 'Wait Time',
      de: 'Wartezeit',
      it: 'Tempo di attesa',
      nl: 'Wachttijd',
      es: 'Tiempo de espera'
    },
    shortDefinition: {
      en: 'The estimated duration a guest must queue before boarding an attraction.',
      de: 'Die geschätzte Zeit, die ein Besucher warten muss, bevor er eine Attraktion betreten kann.',
      it: 'Il tempo stimato che un ospite deve trascorrere in fila prima di accedere a un',
      nl: 'De geschatte tijd die een bezoeker in de rij moet staan voordat hij een attractie kan betreden.',
      es: 'El tiempo estimado que un visitante debe estar en fila antes de acceder a una atracción.'
    },
  },
  'single-rider': {
    name: {
      en: 'Single Rider',
      de: 'Einzelfahrer',
      fr: 'Single Rider',
      it: 'Single Rider',
      nl: 'Single Rider',
      es: 'Single Rider'
    },
    shortDefinition: {
      en: 'A separate, faster queue lane for guests willing to ride alone and fill odd empty seats.',
      de: 'Eine separate Warteschlangenspur für Besucher, die bereit sind, allein zu fahren, um freie Plätze zu füllen.',
      fr: 'Une file séparée pour les visiteurs acceptant de voyager seuls afin de remplir les places vides.',
      it: 'Una corsia separata per gli ospiti disposti a viaggiare da soli per riempire i posti vuoti.',
      nl: 'Een aparte rijstrook voor bezoekers die bereid zijn alleen te rijden om lege plaatsen te vullen.',
      es: 'Un carril separado para visitantes dispuestos a viajar solos para llenar asientos vacíos.'
    },
  },
  'virtual-queue': {
    name: {
      en: 'Virtual Queue',
      de: 'Virtuelle Warteschlange',
      it: 'Coda virtuale',
      nl: 'Virtuele wachtrij',
      es: 'Cola virtual'
    },
    shortDefinition: {
      en: 'A digital queuing system where guests reserve a timed return slot instead of waiting in a physical line.',
      de: 'Ein digitales Warteschlangensystem, bei dem Besucher eine Fahrzeit reservieren, anstatt physisch zu warten.',
      it: 'Un sistema di coda digitale in cui gli ospiti prenotano un orario invece di attendere fisicamente.',
      nl: 'Een digitaal wachtrij systeem waarbij bezoekers een rijtijd reserveren in plaats van fysiek te wachten.',
      es: 'Un sistema de cola digital donde los visitantes reservan un horario en lugar de esperar físicamente.'
    },
  },
  'express-pass': {
    name: {
      en: 'Express Pass',
      de: 'Express Pass',
      fr: 'Pass Express',
      it: 'Pass Express',
      nl: 'Express Pas',
      es: 'Pase Express'
    },
    shortDefinition: {
      en: 'A paid or included ticket upgrade granting access to a dedicated, shorter priority queue.',
      de: 'Ein kostenpflichtiges oder inklusive Ticket-Upgrade, das Zugang zu einer kürzeren Prioritätswarteschlange gewährt.',
      fr: 'Un upgrade de billet payant ou inclus donnant accès à une file prioritaire plus courte.',
      it: 'Un upgrade del biglietto a pagamento o incluso che dà accesso a una corsia prioritaria più breve.',
      nl: 'Een betaald of inbegrepen ticket-upgrade die toegang geeft tot een kortere prioriteitsrij.',
      es: 'Una mejora de ticket de pago o incluida que da acceso a una cola prioritaria más corta.'
    },
  },
  'posted-wait-time': {
    name: {
      en: 'Posted Wait Time',
      de: 'Angezeigte Wartezeit',
      it: 'Tempo segnalato',
      nl: 'Aangegeven wachttijd',
      es: 'Tiempo publicado'
    },
    shortDefinition: {
      en: 'The official wait time displayed by the park at a ride entrance or in its app.',
      de: 'Die offizielle Wartezeit, die der Park am Eingang einer Attraktion anzeigt.',
      it: 'Il tempo di attesa ufficiale mostrato dal parco all',
      nl: 'De officiële wachttijd die het park bij de ingang van een attractie weergeeft.',
      es: 'El tiempo de espera oficial mostrado por el parque en la entrada de una atracción.'
    },
  },
  'crowd-level': {
    name: {
      en: 'Crowd Level',
      de: 'Besucherdichte',
      it: 'Livello di affluenza',
      nl: 'Drukte-niveau',
      es: 'Nivel de afluencia'
    },
    shortDefinition: {
      en: 'A scale measuring how busy a theme park is on a given day, from Very Low to Extreme.',
      de: 'Ein Maß dafür, wie voll ein Freizeitpark an einem bestimmten Tag ist, von Sehr Niedrig bis Extrem.',
      it: 'Una misura di quanto è affollato un parco a tema in un dato giorno, da Molto Basso a Estremo.',
      nl: 'Een maat voor hoe druk een pretpark is op een bepaalde dag, van Zeer Laag tot Extreem.',
      es: 'Una medida de cuán concurrido está un parque temático en un día determinado, de Muy Bajo a Extremo.'
    },
  },
  'crowd-calendar': {
    name: {
      en: 'Crowd Calendar',
      de: 'Besucherkalender',
      nl: 'Druktekalender',
      es: 'Calendario de afluencia'
    },
    shortDefinition: {
      en: 'A day-by-day forecast of predicted crowd levels, helping guests find the quietest times to visit.',
      de: 'Eine tagesweise Vorschau mit vorhergesagten Besucherdichten, um den Besuch zu planen.',
      nl: 'Een dag-voor-dag voorspelling met verwachte drukteniveaus om de bezoek te plannen.',
      es: 'Una previsión día a día de los niveles de afluencia previstos para ayudar a planificar la visita.'
    },
  },
  'peak-day': {
    name: {
      en: 'Peak Day',
      de: 'Spitzentag',
      fr: 'Jour de pointe',
      it: 'Giorno di punta',
      nl: 'Piekdag',
      es: 'Día pico'
    },
    shortDefinition: {
      en: 'A day when visitor attendance reaches or approaches a park',
      de: 'Ein Tag mit maximalen Besucherzahlen, typischerweise während Feiertagen oder Sonderveranstaltungen.',
      fr: 'Un jour avec une fréquentation maximale, généralement lors de jours fériés ou d',
      it: 'Un giorno con il massimo numero di visitatori, tipicamente durante festività o eventi speciali.',
      nl: 'Een dag met maximale bezoekersaantallen, doorgaans tijdens feestdagen of speciale evenementen.',
      es: 'Un día con el máximo número de visitantes, típicamente durante días festivos o eventos especiales.'
    },
  },
  'refurbishment': {
    name: {
      en: 'Refurbishment',
      de: 'Renovierung',
      fr: 'Rénovation',
      it: 'Ristrutturazione',
      nl: 'Renovatie',
      es: 'Renovación'
    },
    shortDefinition: {
      en: 'A planned maintenance closure during which a ride or area undergoes repairs or upgrades.',
      de: 'Eine geplante Schließungszeit, in der eine Attraktion oder ein Bereich gewartet oder modernisiert wird.',
      fr: 'Une période de fermeture planifiée pendant laquelle une attraction subit une maintenance ou des améliorations.',
      it: 'Un periodo di chiusura pianificata durante il quale un',
      nl: 'Een geplande sluitingsperiode waarbij een attractie onderhoud ondergaat of wordt verbeterd.',
      es: 'Un período de cierre planificado durante el cual una atracción se somete a mantenimiento o mejoras.'
    },
  },
  'downtime': {
    name: {
      en: 'Downtime',
      de: 'Betriebsstörung',
      it: 'Tempo fermo',
      nl: 'Stilstandtijd',
      es: 'Tiempo de inactividad'
    },
    shortDefinition: {
      en: 'An unplanned temporary closure of a ride, typically caused by a technical fault or safety check.',
      de: 'Eine ungeplante, vorübergehende Schließung einer Attraktion aufgrund eines technischen Defekts oder Sicherheitsprüfung.',
      it: 'Una chiusura temporanea non pianificata di un',
      nl: 'Een ongeplande tijdelijke sluiting van een attractie, vaak als gevolg van een technische storing.',
      es: 'Un cierre temporal no planificado de una atracción, a menudo debido a un fallo técnico.'
    },
  },
  'ride-capacity': {
    name: {
      en: 'Ride Capacity',
      de: 'Kapazität',
      nl: 'Capaciteit',
      es: 'Capacidad de atracción'
    },
    shortDefinition: {
      en: 'The number of guests an attraction can process per hour under normal operating conditions.',
      de: 'Die Anzahl der Besucher, die eine Attraktion pro Stunde aufnehmen kann.',
      nl: 'Het aantal bezoekers dat een attractie per uur kan vervoeren.',
      es: 'El número de visitantes que una atracción puede acomodar por hora.'
    },
  },
  'rope-drop': {
    name: {
      en: 'Rope Drop',
      de: 'Rope Drop',
      fr: 'Rope Drop',
      it: 'Rope Drop',
      nl: 'Rope Drop',
      es: 'Rope Drop'
    },
    shortDefinition: {
      en: 'The moment a park opens its gates each morning, when queues for popular rides are at their shortest.',
      de: 'Der Moment der Parköffnung, wenn die Absperrung fällt und die Warteschlangen für beliebte Attraktionen am kürzesten sind.',
      fr: 'Le moment où un parc ouvre officiellement ses portes et où les files pour les attractions populaires sont les plus courtes.',
      it: 'Il momento in cui un parco apre ufficialmente i suoi cancelli e le code per le attrazioni popolari sono più brevi.',
      nl: 'Het moment waarop een park officieel zijn poorten opent en de rijen voor populaire attracties het kortst zijn.',
      es: 'El momento en que un parque abre oficialmente sus puertas y las colas para las atracciones populares son más cortas.'
    },
  },
  'early-entry': {
    name: {
      en: 'Early Entry',
      de: 'Früheinlass',
      fr: 'Entrée anticipée',
      it: 'Early Entry',
      nl: 'Early Entry',
      es: 'Early Entry'
    },
    shortDefinition: {
      en: 'An exclusive benefit allowing resort hotel guests to enter the park 30–60 minutes before general opening.',
      de: 'Ein exklusiver Vorteil für Hotelgäste, der den Parkeintritt vor der regulären Öffnung erlaubt.',
      fr: 'Un avantage exclusif permettant aux clients des hôtels du resort d',
      it: 'Un vantaggio esclusivo che consente agli ospiti degli hotel del resort di entrare nel parco prima dell',
      nl: 'Een exclusief voordeel waarmee hotelgasten het park vóór de reguliere opening kunnen betreden.',
      es: 'Un beneficio exclusivo que permite a los huéspedes de los hoteles del resort entrar al parque antes de la apertura general.'
    },
  },
  'park-hopper': {
    name: {
      en: 'Park Hopper',
      de: 'Park Hopper',
      fr: 'Park Hopper',
      it: 'Park Hopper',
      nl: 'Park Hopper',
      es: 'Park Hopper'
    },
    shortDefinition: {
      en: 'A ticket add-on allowing guests to visit multiple parks within the same resort on a single day.',
      de: 'Ein Ticket-Upgrade, das den Besuch mehrerer Parks desselben Betreibers an einem Tag ermöglicht.',
      fr: 'Un supplément de billet permettant de visiter plusieurs parcs du même resort dans la même journée.',
      it: 'Un supplemento al biglietto che consente di visitare più parchi dello stesso resort nello stesso giorno.',
      nl: 'Een ticketoptie waarmee bezoekers op dezelfde dag meerdere parken van hetzelfde resort kunnen bezoeken.',
      es: 'Un complemento de ticket que permite visitar varios parques del mismo resort en el mismo día.'
    },
  },
  'season-pass': {
    name: {
      en: 'Season Pass',
      de: 'Jahrespass',
      fr: 'Abonnement annuel',
      it: 'Abbonamento annuale',
      nl: 'Jaarkaart',
      es: 'Pase anual'
    },
    shortDefinition: {
      en: 'An annual ticket granting unlimited park visits over a 12-month period.',
      de: 'Ein Ticket, das unbegrenzte Parkbesuche innerhalb eines Jahres ermöglicht.',
      fr: 'Un ticket annuel donnant droit à un nombre illimité de visites pendant 12 mois.',
      it: 'Un biglietto annuale che consente visite illimitate al parco per 12 mesi.',
      nl: 'Een jaarticket dat onbeperkte parkbezoeken gedurende 12 maanden mogelijk maakt.',
      es: 'Un ticket anual que permite visitas ilimitadas al parque durante 12 meses.'
    },
  },
  'height-requirement': {
    name: {
      en: 'Height Requirement',
      de: 'Mindestgröße',
      fr: 'Taille minimale',
      it: 'Altezza minima',
      nl: 'Minimumlengte',
      es: 'Talla mínima'
    },
    shortDefinition: {
      en: 'A minimum height a guest must meet to ride an attraction, enforced for safety reasons.',
      de: 'Eine Mindestkörpergröße, die Besucher erfüllen müssen, um eine bestimmte Attraktion nutzen zu dürfen.',
      fr: 'Une taille minimale que les visiteurs doivent atteindre pour accéder à une attraction.',
      it: 'Un',
      nl: 'Een minimumlengte die bezoekers moeten hebben om een specifieke attractie te mogen betreden.',
      es: 'Una estatura mínima que los visitantes deben tener para acceder a una atracción específica.'
    },
  },
  'themed-land': {
    name: {
      en: 'Themed Land',
      de: 'Themenbereich',
      fr: 'Univers thématique',
      it: 'Area tematica',
      nl: 'Themagebied',
      es: 'Zona temática'
    },
    shortDefinition: {
      en: 'A self-contained zone within a park built around a unified theme, story, and aesthetic.',
      de: 'Ein eigenständig gestalteter Bereich innerhalb eines Freizeitparks mit durchgehendem Thema.',
      fr: 'Une zone autonome au sein d',
      it: 'Una zona autonoma all',
      nl: 'Een zelfstandige zone binnen een pretpark gebouwd rondom een samenhangend thema.',
      es: 'Una zona autónoma dentro de un parque temático construida en torno a un tema coherente.'
    },
  },
  'soft-opening': {
    name: {
      en: 'Soft Opening',
      de: 'Soft Opening',
      fr: 'Soft Opening',
      it: 'Soft Opening',
      nl: 'Soft Opening',
      es: 'Soft Opening'
    },
    shortDefinition: {
      en: 'An unofficial early opening of a new attraction before its announced grand opening date.',
      de: 'Die inoffizielle, vorzeitige Öffnung einer Attraktion vor dem offiziellen Eröffnungsdatum.',
      fr: 'L',
      it: 'L',
      nl: 'De onofficiële opening van een attractie vóór de aangekondigde lanceringsdatum.',
      es: 'La apertura no oficial de una atracción antes de su fecha de lanzamiento anunciada.'
    },
  },
  'standby-queue': {
    name: {
      en: 'Standby Queue',
      de: 'Standby',
      fr: 'Standby',
      it: 'Standby',
      nl: 'Standby',
      es: 'Standby'
    },
    shortDefinition: {
      en: 'The standard physical waiting line accessible to all guests without a special pass or upgrade.',
      de: 'Die normale Warteschlange einer Attraktion, ohne Reservierung oder besonderes Ticket.',
      fr: 'La file d',
      it: 'La fila d',
      nl: 'De normale wachtrij van een attractie, zonder reservering of speciaal pas.',
      es: 'La cola normal de una atracción, sin reserva ni pase especial.'
    },
  },
  'lightning-lane': {
    name: {
      en: 'Lightning Lane',
      de: 'Lightning Lane',
      fr: 'Lightning Lane',
      it: 'Lightning Lane',
      nl: 'Lightning Lane',
      es: 'Lightning Lane'
    },
    shortDefinition: {
      en: 'Disney',
      de: 'Disneys kostenpflichtiges Vorrangwarteschlangen-System als Nachfolger des früheren FastPass+-Programms.',
      fr: 'Le système d',
      it: 'Il sistema di accesso prioritario a pagamento di Disney, successore del programma FastPass+.',
      nl: 'Disney',
      es: 'El sistema de acceso prioritario de pago de Disney, sucesor del programa FastPass+.'
    },
  },
  'genie-plus': {
    name: {
      en: 'Genie+',
      de: 'Genie+',
      fr: 'Genie+',
      it: 'Genie+',
      nl: 'Genie+',
      es: 'Genie+'
    },
    shortDefinition: {
      en: 'Disney',
      de: 'Disneys ehemaliges tägliches Zusatzabo für Lightning-Lane-Zugang zu den meisten Attraktionen.',
      fr: 'L',
      it: 'Il precedente abbonamento giornaliero di Disney che forniva accesso alla Lightning Lane Multi Pass sulla maggior parte delle attrazioni.',
      nl: 'Disney',
      es: 'El anterior complemento diario de Disney que daba acceso a Lightning Lane Multi Pass en la mayoría de las atracciones.'
    },
  },
  'boarding-group': {
    name: {
      en: 'Boarding Group',
      de: 'Boarding Group',
      fr: 'Boarding Group',
      it: 'Boarding Group',
      nl: 'Boarding Group',
      es: 'Boarding Group'
    },
    shortDefinition: {
      en: 'A numbered virtual queue allocation granting access to a high-demand attraction when that group number is called.',
      de: 'Eine nummerierte Zuteilung im virtuellen Warteschlangensystem, die den Zugang zu einer Attraktion bei Aufruf ermöglicht.',
      fr: 'Un numéro d',
      it: 'Un numero di allocazione nel sistema di coda virtuale che consente l',
      nl: 'Een genummerde toewijzing in het virtuele wachtrij-systeem die toegang geeft tot een attractie wanneer de groep wordt opgeroepen.',
      es: 'Un número de asignación en el sistema de cola virtual que permite el acceso a una atracción cuando se llama al grupo.'
    },
  },
  'off-peak': {
    name: {
      en: 'Off-Peak',
      de: 'Nebensaison',
      fr: 'Hors-saison',
      it: 'Fuori stagione',
      nl: 'Laagseizoen',
      es: 'Temporada baja'
    },
    shortDefinition: {
      en: 'Quieter periods in the park calendar offering shorter waits, lower ticket prices, and a more relaxed visit.',
      de: 'Zeiträume mit geringerer Besucherauslastung, kürzeren Wartezeiten und günstigeren Preisen.',
      fr: 'Périodes de moindre fréquentation offrant des files plus courtes, des prix plus bas et une expérience plus sereine.',
      it: 'Periodi di minore affluenza che offrono code più brevi, prezzi più bassi e un',
      nl: 'Periodes met minder bezoekers die kortere wachtrijen, lagere prijzen en een rustiger ervaring bieden.',
      es: 'Períodos de menor afluencia que ofrecen colas más cortas, precios más bajos y una experiencia más tranquila.'
    },
  },
  'ride-photo': {
    name: {
      en: 'Ride Photo',
      de: 'Fahrfoto',
      fr: 'Photo de manège',
      it: 'Foto di bordo',
      nl: 'Ritfoto',
      es: 'Foto de atracción'
    },
    shortDefinition: {
      en: 'An automatically captured photo taken of guests at a key moment during a ride, available to purchase afterwards.',
      de: 'Automatisch aufgenommenes Foto oder Video der Besucher während einer Attraktion, das nach der Fahrt käuflich erworben werden kann.',
      fr: 'Une photo ou vidéo automatiquement prise des visiteurs pendant une attraction, disponible à l',
      it: 'Una foto o video catturati automaticamente durante un',
      nl: 'Een automatisch gemaakte foto of video van bezoekers tijdens een attractie, na afloop te koop aangeboden.',
      es: 'Una foto o vídeo capturado automáticamente durante una atracción, disponible para comprar al finalizar el recorrido.'
    },
  },
  'queue-line': {
    name: {
      en: 'Queue Line',
      de: 'Warteschlange',
      it: 'Coda',
      nl: 'Wachtrij',
      es: 'Cola'
    },
    shortDefinition: {
      en: 'The physical waiting area guests walk through before boarding an attraction, often themed as part of the experience.',
      de: 'Der physische Wartebereich vor einer Attraktion, der oft selbst thematisch gestaltet ist.',
      it: 'L',
      nl: 'Het fysieke wachtgebied dat bezoekers doorlopen voor ze een attractie betreden, vaak thematisch ingericht als onderdeel van de beleving.',
      es: 'El área de espera física que los visitantes recorren antes de subir a una atracción, a menudo ambientada como parte de la experiencia.'
    },
  },
  'opening-day': {
    name: {
      en: 'Opening Day',
      de: 'Eröffnungstag',
      nl: 'Openingsdag',
      es: 'Día de apertura'
    },
    shortDefinition: {
      en: 'The official date on which a new park, themed land, or attraction opens to the public for the first time.',
      de: 'Das offizielle Eröffnungsdatum eines neuen Parks, Themenbereichs oder einer neuen Attraktion.',
      nl: 'De officiële lanceringsdatum van een nieuw park, themagebied of attractie.',
      es: 'La fecha oficial de inauguración de un nuevo parque, zona temática o atracción.'
    },
  },
  'rider-switch': {
    name: {
      en: 'Rider Switch',
      de: 'Rider Switch',
      fr: 'Rider Switch',
      it: 'Rider Switch',
      nl: 'Rider Switch',
      es: 'Rider Switch'
    },
    shortDefinition: {
      en: 'A system letting accompanying adults take turns riding while the other waits with a child who cannot meet the height requirement.',
      de: 'System, bei dem sich Erwachsene beim Fahren abwechseln, während der andere bei Kindern bleibt, die die Mindestgröße nicht erfüllen.',
      fr: 'Un système permettant aux accompagnateurs de se relayer sur une attraction pendant que l',
      it: 'Un sistema che consente agli accompagnatori di alternare il giro mentre l',
      nl: 'Een systeem waarmee begeleiders om beurten kunnen rijden terwijl de ander wacht met kinderen die niet aan de minimumlengte voldoen.',
      es: 'Un sistema que permite a los acompañantes turnarse para subir a una atracción mientras el otro espera con los niños que no cumplen el requisito de talla.'
    },
  },
  'blockout-date': {
    name: {
      en: 'Blockout Date',
      de: 'Sperrtag',
      fr: 'Blockout Date',
      it: 'Blockout Date',
      nl: 'Blockout Datum',
      es: 'Fecha de bloqueo'
    },
    shortDefinition: {
      en: 'A calendar date on which certain annual pass tiers are not valid for park entry, typically on the busiest days.',
      de: 'Ein Kalendertag, an dem bestimmte Jahrespass-Stufen nicht für den Parkeintritt gültig sind — meist an Spitzentagen.',
      fr: 'Une date à laquelle certains niveaux d',
      it: 'Una data in cui certi livelli di abbonamento annuale non sono validi per l',
      nl: 'Een datum waarop bepaalde niveaus van de jaarkaart niet geldig zijn voor parktoelating, doorgaans op de drukste dagen van het jaar.',
      es: 'Un día en el que ciertos niveles de pase anual no son válidos para entrar al parque, normalmente en los días de mayor afluencia del año.'
    },
  },
  'hard-ticket-event': {
    name: {
      en: 'Hard Ticket Event',
      de: 'Sonderveranstaltung',
      fr: 'Événement à billet séparé',
      it: 'Evento a biglietto separato',
      nl: 'Speciaal evenement',
      es: 'Evento de entrada especial'
    },
    shortDefinition: {
      en: 'A separately ticketed special event — typically an evening event — requiring admission beyond a regular park ticket.',
      de: 'Ein separat ticketpflichtiges Abendevent — wie Halloween- oder Weihnachtspartys — das über den normalen Tageseintritt hinausgeht.',
      fr: 'Un événement spécial à billet distinct (généralement en soirée) requérant une admission séparée du billet parc ordinaire, comme les fêtes d',
      it: 'Un evento serale o speciale con biglietto dedicato che richiede un',
      nl: 'Een apart te betalen avond- of speciaal evenement waarvoor je buiten het reguliere parkticket een extra kaartje nodig hebt, zoals Halloween- of kerstfeesten.',
      es: 'Un evento nocturno o especial con entrada separada que requiere un ticket adicional al de acceso regular al parque, como las fiestas de Halloween o Navidad.'
    },
  },
  'fastpass': {
    name: {
      en: 'FastPass',
      de: 'FastPass',
      fr: 'FastPass',
      it: 'FastPass',
      nl: 'FastPass',
      es: 'FastPass'
    },
    shortDefinition: {
      en: 'Disney',
      de: 'Disneys ehemaliges kostenloses Vorrang-Warteschlangen-System, das 2021 durch das kostenpflichtige Lightning Lane ersetzt wurde.',
      fr: 'L',
      it: 'L',
      nl: 'Disney',
      es: 'El antiguo sistema gratuito de cola prioritaria de Disney, reemplazado por el Lightning Lane de pago en 2021.'
    },
  },
  'dark-ride': {
    name: {
      en: 'Dark Ride',
      de: 'Dark Ride',
      fr: 'Dark ride',
      it: 'Dark ride',
      nl: 'Dark ride',
      es: 'Dark ride'
    },
    shortDefinition: {
      en: 'An indoor attraction where guests travel through elaborately themed scenes in guided vehicles.',
      de: 'Eine Indoor-Attraktion, bei der Besucher in geführten Fahrzeugen durch thematisch gestaltete Szenen fahren.',
      fr: 'Une attraction intérieure dans laquelle les visiteurs se déplacent à bord de véhicules guidés à travers des décors thématiques, des effets spéciaux et des scènes animées dans l',
      it: 'Un',
      nl: 'Een overdekte attractie waarbij bezoekers in voertuigen door een donkere, thematisch ingerichte ruimte worden geleid met animatronics, projecties of speciale effecten.',
      es: 'Una atracción interior que transporta a los visitantes a través de escenas iluminadas y ambientadas, combinando narrativa, efectos especiales y movimiento.'
    },
  },
  'return-time': {
    name: {
      en: 'Return Time',
      de: 'Rückkehrzeit',
      fr: 'Heure de retour',
      it: 'Orario di ritorno',
      nl: 'Terugkomsttijd',
      es: 'Hora de regreso'
    },
    shortDefinition: {
      en: 'A reserved time window to return to a ride, issued by Lightning Lane, virtual queue, or similar priority access systems.',
      de: 'Ein reserviertes Zeitfenster, in dem man mit einem Lightning Lane, einer virtuellen Warteschlange oder einem ähnlichen System zur Attraktion zurückkehren kann.',
      fr: 'Une fenêtre horaire réservée pour revenir sur une attraction, délivrée par la Lightning Lane, la file virtuelle ou un système similaire d',
      it: 'Una finestra oraria prenotata per tornare a un',
      nl: 'Een gereserveerd tijdvenster om terug te keren naar een attractie, uitgegeven door Lightning Lane, virtuele wachtrij of vergelijkbare prioriteitssystemen.',
      es: 'Una ventana horaria reservada para regresar a una atracción, emitida por Lightning Lane, cola virtual u otros sistemas de acceso prioritario.'
    },
  },
  'airtime': {
    name: {
      en: 'Airtime',
      de: 'Airtime',
      fr: 'Airtime',
      it: 'Airtime',
      nl: 'Airtime',
      es: 'Airtime'
    },
    shortDefinition: {
      en: 'The sensation of weightlessness or being lifted from your seat caused by negative G-forces on roller coasters.',
      de: 'Das Schwereglosigkeitsgefühl auf Achterbahnen bei negativen G-Kräften — wenn man aus dem Sitz gehoben wird.',
      fr: 'La sensation d',
      it: 'La sensazione di assenza di peso o di essere sollevati dal sedile che si prova sulle montagne russe durante i momenti di G-force negativa.',
      nl: 'Het gevoel van gewichtloosheid of uit je stoel worden getild dat achtbaanrijders ervaren bij negatieve G-kracht-momenten.',
      es: 'La sensación de ingravidez o elevación del asiento que se experimenta en las montañas rusas durante los momentos de G negativas.'
    },
  },
  'inversion': {
    name: {
      en: 'Inversion',
      de: 'Inversion',
      fr: 'Inversion',
      it: 'Inversione',
      nl: 'Inversie',
      es: 'Inversión'
    },
    shortDefinition: {
      en: 'Any element on a roller coaster where riders are rotated at least partially upside down.',
      de: 'Jedes Element auf einer Achterbahn, bei dem die Strecke die Fahrgäste über Kopf dreht.',
      fr: 'Tout élément sur une montagne russe où la voie fait pivoter les passagers à l',
      it: 'Qualsiasi elemento su una montagna russa in cui il binario ruota i passeggeri a testa in giù.',
      nl: 'Elk element op een achtbaan waarbij het spoor rijders ondersteboven draait.',
      es: 'Cualquier elemento en una montaña rusa donde la pista gira a los pasajeros boca abajo.'
    },
  },
  'vertical-loop': {
    name: {
      en: 'Vertical Loop',
      de: 'Looping',
      fr: 'Looping',
      it: 'Looping',
      nl: 'Looping',
      es: 'Looping'
    },
    shortDefinition: {
      en: 'The classic circular inversion taking riders through a complete 360-degree circle in the vertical plane.',
      de: 'Die klassische kreisförmige Inversion, bei der die Strecke einen vollständigen vertikalen Kreis beschreibt und die Fahrgäste am Scheitelpunkt auf den Kopf stellt.',
      fr: 'L',
      it: 'La classica inversione circolare in cui il binario forma un cerchio verticale completo, portando i passeggeri completamente a testa in giù all',
      nl: 'De klassieke cirkelvormige inversie waarbij het spoor een volledige verticale cirkel maakt en rijders volledig ondersteboven brengt aan het hoogste punt.',
      es: 'La inversión circular clásica donde la pista forma un círculo vertical completo, llevando a los pasajeros completamente boca abajo en el punto más alto.'
    },
  },
  'immelmann': {
    name: {
      en: 'Immelmann',
      de: 'Immelmann',
      fr: 'Immelmann',
      it: 'Immelmann',
      nl: 'Immelmann',
      es: 'Immelmann'
    },
    shortDefinition: {
      en: 'A half-loop ascending to the top followed by a half-roll exiting in the opposite direction — a signature B&M inversion.',
      de: 'Ein halber Looping aufwärts gefolgt von einer halben Rolle abwärts, der die Fahrtrichtung um 180 Grad ändert — benannt nach Kampfpilot Max Immelmann.',
      fr: 'Un demi-looping qui propulse le train vers le haut et par-dessus, puis un demi-tonneau qui repart dans la direction opposée — nommé d',
      it: 'Un mezzo looping che spinge il treno verso l',
      nl: 'Een halve looping die de trein omhoog en over de top trekt, gevolgd door een halve rol die in de tegenovergestelde richting uitkomt — vernoemd naar WWI-piloot Max Immelmann.',
      es: 'Un medio looping que eleva el tren hacia arriba y por encima de la cima, seguido de un medio giro que sale en dirección opuesta — bautizado en honor al piloto de la Primera Guerra Mundial Max Immelmann.'
    },
  },
  'zero-g-roll': {
    name: {
      en: 'Zero-G Roll',
      de: 'Zero-G Roll',
      fr: 'Zero-g Roll',
      it: 'Zero-g Roll',
      nl: 'Zero-g Roll',
      es: 'Zero-g Roll'
    },
    shortDefinition: {
      en: 'A 360-degree roll following a parabolic arc where riders experience near-weightlessness while inverted at the apex.',
      de: 'Eine 360-Grad-Drehung entlang einer Parabelkurve, bei der die Fahrgäste am Scheitelpunkt Schwerelosigkeit erleben — eines der beliebtesten Elemente im modernen Achterbahndesign.',
      fr: 'Un tonneau à 360° suivant un arc parabolique où les passagers ressentent une quasi-apesanteur au sommet — l',
      it: 'Un rollio di 360 gradi che segue un arco parabolico in cui i passeggeri sperimentano quasi l',
      nl: 'Een 360-graden rol langs een parabolische boog waarbij rijders aan het hoogste punt bijna gewichtloosheid ervaren — een van de meest gevierde elementen in modern achtbaanontwerp.',
      es: 'Un giro de 360 grados sobre un arco parabólico donde los pasajeros experimentan casi ingravidez en la cima — uno de los elementos más celebrados del diseño moderno de coasters.'
    },
  },
  'launch-coaster': {
    name: {
      en: 'Launch Coaster',
      de: 'Launch Coaster',
      fr: 'Launch Coaster',
      it: 'Launch Coaster',
      nl: 'Launch Coaster',
      es: 'Launch Coaster'
    },
    shortDefinition: {
      en: 'A coaster that accelerates from standstill to high speed via electromagnetic, hydraulic, or pneumatic systems rather than a chain lift hill.',
      de: 'Eine Achterbahn, die die Fahrgäste per Magnetantrieb, Hydraulik oder Druckluft aus dem Stand auf Höchstgeschwindigkeit beschleunigt — statt eines klassischen Kettenlift-Hügels.',
      fr: 'Un coaster qui accélère les visiteurs de 0 à haute vitesse via un système de lancement magnétique, hydraulique ou pneumatique plutôt qu',
      it: 'Un coaster che accelera gli ospiti da 0 ad alta velocità tramite un sistema di lancio magnetico, idraulico o pneumatico invece della tradizionale catena di risalita.',
      nl: 'Een achtbaan die bezoekers van 0 naar hoge snelheid versnelt via een magnetisch, hydraulisch of pneumatisch lanceersysteem in plaats van een traditionele chain lifthill.',
      es: 'Una montaña rusa que acelera a los visitantes de 0 a alta velocidad mediante un sistema de lanzamiento magnético, hidráulico o neumático en lugar de una cadena de ascenso tradicional.'
    },
  },
  'wooden-coaster': {
    name: {
      en: 'Wooden Coaster',
      de: 'Holzachterbahn',
      fr: 'Montagnes russes en bois',
      it: 'Ottovolante in legno',
      nl: 'Houten achtbaan',
      es: 'Montaña rusa de madera'
    },
    shortDefinition: {
      en: 'A roller coaster built primarily of wood, known for its distinctive rumble, lateral movement, and unpredictable airtime.',
      de: 'Eine Achterbahn, die überwiegend aus Holz gebaut ist und sich durch ihr charakteristisches Rumpeln, seitliche Bewegung und unberechenbaren Airtime auszeichnet.',
      fr: 'Une montagne russe construite principalement en bois, caractérisée par son grondement distinctif, ses mouvements latéraux et son airtime imprévisible.',
      it: 'Una montagna russa costruita principalmente in legno, caratterizzata dal suo caratteristico fragore, dal movimento laterale e dall',
      nl: 'Een achtbaan die voornamelijk van hout is gebouwd, gekenmerkt door een karakteristiek gerommel, laterale beweging en onvoorspelbare airtime.',
      es: 'Una montaña rusa construida principalmente en madera, caracterizada por su vibración distintiva, el movimiento lateral y el airtime impredecible.'
    },
  },
  'hybrid-coaster': {
    name: {
      en: 'Hybrid Coaster',
      de: 'Hybrid Coaster',
      fr: 'Coaster hybride',
      it: 'Coaster ibrido',
      nl: 'Hybride achtbaan',
      es: 'Coaster híbrido'
    },
    shortDefinition: {
      en: 'A coaster combining a traditional wooden support structure with precision steel I-box track, pioneered by Rocky Mountain Construction.',
      de: 'Eine Achterbahn, die eine klassische Holzkonstruktion mit einer präzisen Stahlschiene (I-Box) kombiniert — Pionierarbeit von Rocky Mountain Construction (RMC).',
      fr: 'Un coaster combinant une structure en bois traditionnelle avec une voie I-box en acier, concept pioneered par Rocky Mountain Construction (RMC).',
      it: 'Un coaster che combina una struttura portante in legno tradizionale con un binario I-box in acciaio, pionieristicamente sviluppato da Rocky Mountain Construction (RMC).',
      nl: 'Een achtbaan die een traditionele houten draagconstructie combineert met een stalen I-box-spoor, een technologie die is gepioneerd door Rocky Mountain Construction (RMC).',
      es: 'Una montaña rusa que combina una estructura de soporte de madera tradicional con una pista de acero I-box, pionera de Rocky Mountain Construction (RMC).'
    },
  },
  'b-and-m': {
    name: {
      en: 'B&M',
      de: 'B&M',
      fr: 'B&M',
      it: 'B&M',
      nl: 'B&M',
      es: 'B&M'
    },
    shortDefinition: {
      en: 'Bolliger & Mabillard, a Swiss manufacturer renowned for smooth, reliable coasters and signature elements including the Immelmann, cobra roll, and zero-G roll.',
      de: 'Bolliger & Mabillard, ein Schweizer Achterbahn-Hersteller, bekannt für ruhige, zuverlässige Bahnen und Signature-Elemente wie Immelmann, Cobra Roll und Zero-G Roll.',
      fr: 'Bolliger & Mabillard, fabricant suisse de montagnes russes réputé pour ses attractions lisses et fiables ainsi que ses éléments signature comme l',
      it: 'Bolliger & Mabillard, un costruttore svizzero di montagne russe noto per giri fluidi, affidabili e con elementi firma come l',
      nl: 'Bolliger & Mabillard, een Zwitserse achtbaanfabrikant bekend om soepele, betrouwbare ritten en kenmerkende elementen zoals de Immelmann, cobra roll en zero-G roll.',
      es: 'Bolliger & Mabillard, fabricante suizo de montañas rusas conocido por sus atracciones suaves y fiables y sus elementos característicos como el Immelmann, el Cobra Roll y el Zero-g Roll.'
    },
  },
  'intamin': {
    name: {
      en: 'Intamin',
      de: 'Intamin',
      fr: 'Intamin',
      it: 'Intamin',
      nl: 'Intamin',
      es: 'Intamin'
    },
    shortDefinition: {
      en: 'A Swiss manufacturer known for record-breaking hydraulic launches, mega/giga coasters, and some of the world',
      de: 'Schweizer Fahrgeschäft-Hersteller, bekannt für Weltrekord-Hydraulik-Launches, Mega-/Gigacoaster und innovative Designs — das Unternehmen hinter vielen der schnellsten und höchsten Bahnen der Welt.',
      fr: 'Fabricant suisse de montagnes russes connu pour ses lancements hydrauliques records, ses mega/giga coasters et ses designs innovants — à l',
      it: 'Un costruttore svizzero di giostre e montagne russe noto per i lanci idraulici da record, i mega/giga coaster e i design innovativi — l',
      nl: 'Een Zwitserse achtbaan- en attractiefabrikant bekend om recordbrekende hydraulische launches, mega/giga coasters en innovatieve ontwerpen — het bedrijf achter vele van ',
      es: 'Fabricante suizo de atracciones y montañas rusas conocido por sus lanzamientos hidráulicos récord, mega/giga coasters y diseños innovadores — la empresa detrás de muchas de las atracciones más rápidas y altas del mundo.'
    },
  },
  'mack-rides': {
    name: {
      en: 'Mack Rides',
      de: 'Mack Rides',
      fr: 'Mack Rides',
      it: 'Mack Rides',
      nl: 'Mack Rides',
      es: 'Mack Rides'
    },
    shortDefinition: {
      en: 'A German family-owned manufacturer from Waldkirch, the company behind Europa-Park and producers of water rides, dark rides, and acclaimed hyper coasters.',
      de: 'Deutsches Familienunternehmen aus Waldkirch nahe dem Europa-Park, das Wasserfahrten, Dark Rides und zunehmend spektakuläre Stahlachterbahnen herstellt.',
      fr: 'Fabricant familial allemand basé à Waldkirch près d',
      it: 'Un costruttore tedesco a conduzione familiare di Waldkirch vicino a Europa-Park, che produce attrazioni acquatiche, dark ride e montagne russe in acciaio sempre più ambiziose.',
      nl: 'Een Duits familiebedrijf uit Waldkirch bij Europa-Park dat waterritten, dark rides en steeds ambitieuzere stalen achtbanen produceert.',
      es: 'Fabricante familiar alemán de Waldkirch, cerca de Europa-Park, que produce atracciones acuáticas, dark rides y montañas rusas de acero cada vez más ambiciosas.'
    },
  },
  'rmc': {
    name: {
      en: 'Rocky Mountain Construction',
      de: 'RMC',
      fr: 'RMC',
      it: 'RMC',
      nl: 'RMC',
      es: 'RMC'
    },
    shortDefinition: {
      en: 'An Idaho-based manufacturer that invented the hybrid coaster concept, converting ageing wooden coasters into steel I-box track rides with unprecedented airtime and inversions.',
      de: 'Amerikanischer Hersteller, der das Hybrid-Coaster-Konzept mit dem I-Box-Stahlschienenverfahren für Holzachterbahnen erfunden hat — und damit die bestbewerteten Bahnen der Welt schafft.',
      fr: 'Rocky Mountain Construction, fabricant américain pionnier du coaster hybride, transformant des montagnes russes en bois vieillissantes en pistes acier pour offrir airtime et inversions inédits.',
      it: 'Rocky Mountain Construction, un costruttore dell',
      nl: 'Rocky Mountain Construction — een Amerikaanse fabrikant die het hybride achtbaanconcept heeft gepioneerd door verouderde houten achtbanen om te bouwen met stalen I-box-rails, waarmee ongekende airtime en inversies mogelijk worden.',
      es: 'Rocky Mountain Construction, fabricante de Idaho que pioneró el concepto del coaster híbrido convirtiendo viejas montañas rusas de madera en pistas de acero I-box con airtime e inversiones sin precedentes.'
    },
  },
  'vekoma': {
    name: {
      en: 'Vekoma',
      de: 'Vekoma',
      fr: 'Vekoma',
      it: 'Vekoma',
      nl: 'Vekoma',
      es: 'Vekoma'
    },
    shortDefinition: {
      en: 'A Dutch manufacturer and one of the world',
      de: 'Niederländischer Achterbahn-Hersteller und einer der größten der Welt — bekannt für den allgegenwärtigen Boomerang sowie eine umfangreiche Palette an modernen Familien- und Thrill-Coasern in europäischen Parks.',
      fr: 'Fabricant néerlandais de montagnes russes et l',
      it: 'Produttore olandese di montagne russe e uno dei più prolifici al mondo, noto per l',
      nl: 'Nederlandse achtbaanfabrikant en een van de grootste ter wereld — bekend om de alomtegenwoordige Boomerang en een breed scala aan familie- en thrillerachtbanen in Europese pretparken.',
      es: 'Fabricante neerlandés de montañas rusas y uno de los más prolíficos del mundo, conocido por el omnipresente Boomerang y una amplia gama de coasters familiares y de emociones fuertes en parques europeos.'
    },
  },
  'gerstlauer': {
    name: {
      en: 'Gerstlauer',
      de: 'Gerstlauer',
      fr: 'Gerstlauer',
      it: 'Gerstlauer',
      nl: 'Gerstlauer',
      es: 'Gerstlauer'
    },
    shortDefinition: {
      en: 'A German manufacturer best known for the Euro-Fighter model with its beyond-vertical first drop, plus spinning coasters and compact family rides.',
      de: 'Deutscher Hersteller, vor allem bekannt für den Euro-Fighter mit seinem über-vertikalen Abfall sowie für Spinning Coaster und kompakte Familienbahnen.',
      fr: 'Fabricant allemand surtout connu pour son modèle Euro-Fighter avec sa première descente au-delà de la verticale, ainsi que pour ses spinning coasters et ses attractions familiales compactes.',
      it: 'Produttore tedesco noto soprattutto per il modello Euro-Fighter con il suo drop oltre la verticale, nonché per spinning coaster e compatte attrazioni familiari.',
      nl: 'Duitse fabrikant die het best bekend staat om het Euro-Fighter-model met zijn voorbij-verticale eerste helling, en om spinning coasters en compacte familieritten.',
      es: 'Fabricante alemán conocido principalmente por el modelo Euro-Fighter con su primera caída más allá de la vertical, así como por spinning coasters y compactas atracciones familiares.'
    },
  },
  'schwarzkopf': {
    name: {
      en: 'Schwarzkopf',
      de: 'Schwarzkopf',
      fr: 'Schwarzkopf',
      it: 'Schwarzkopf',
      nl: 'Schwarzkopf',
      es: 'Schwarzkopf'
    },
    shortDefinition: {
      en: 'A legendary German manufacturer whose classic looping coasters from the 1970s and 80s remain beloved across European parks for their smooth, intense ride experience.',
      de: 'Legendärer deutscher Hersteller, dessen klassische Looping-Achterbahnen aus den 70er und 80er Jahren noch heute in europäischen Parks für ihr intensives, buttereiches Fahrgefühl geliebt werden.',
      fr: 'Légendaire fabricant allemand dont les coasters looping classiques des années 70 et 80 sont encore adorés dans les parcs européens pour leur expérience de conduite intense et parfaitement fluide.',
      it: 'Leggendario produttore tedesco i cui classici looping coaster degli anni ',
      nl: 'Legendarische Duitse fabrikant wiens klassieke looping-achtbanen uit de jaren 70 en 80 nog altijd geliefd zijn in Europese pretparken om hun intense, boterzachte rijervaring.',
      es: 'Legendario fabricante alemán cuyos clásicos coasters looping de los años 70 y 80 siguen siendo adorados en los parques europeos por su experiencia de conducción intensa y excepcionalmente suave.'
    },
  },
  'lifthill': {
    name: {
      en: 'Lift Hill',
      de: 'Lifthill',
      fr: 'Lifthill',
      it: 'Lifthill',
      nl: 'Lifthill',
      es: 'Lifthill'
    },
    shortDefinition: {
      en: 'The mechanically powered ascent that pulls a coaster train to its highest point, building the potential energy that powers the rest of the ride.',
      de: 'Der mechanisch angetriebene Aufstieg einer Achterbahn, der den Zug auf den höchsten Punkt bringt und dabei Lageenergie für die restliche Fahrt aufbaut.',
      fr: 'La montée mécanique qui propulse le train au point le plus haut du circuit, convertissant l',
      it: 'La salita azionata meccanicamente che porta il treno del coaster al suo punto più alto, convertendo l',
      nl: 'De mechanisch aangedreven klimpartij die het achtbaantreinstel naar het hoogste punt trekt en elektrische energie omzet in potentiële energie.',
      es: 'El ascenso motorizado que arrastra el tren de la montaña rusa hasta su punto más alto, convirtiendo energía eléctrica en energía potencial gravitatoria.'
    },
  },
  'first-drop': {
    name: {
      en: 'First Drop',
      de: 'First Drop',
      fr: 'First Drop',
      it: 'First Drop',
      nl: 'First Drop',
      es: 'First Drop'
    },
    shortDefinition: {
      en: 'The initial descent after the lift hill or launch — typically the ride',
      de: 'Der erste Abfall nach dem Lifthill — meist der höchste und schnellste Punkt der Bahn, der den Charakter des Coasters prägt.',
      fr: 'La descente initiale suivant le lifthill — généralement le point le plus haut et le plus rapide du trajet, définissant le caractère du coaster.',
      it: 'La discesa iniziale che segue il Lifthill — tipicamente il punto più alto e veloce del giro, che definisce il carattere del coaster.',
      nl: 'De eerste daling na de lifthill — doorgaans het hoogste en snelste punt van de rit, bepalend voor het karakter van de achtbaan.',
      es: 'El descenso inicial tras la lifthill — normalmente el punto más alto y rápido del recorrido, que define el carácter de la montaña rusa.'
    },
  },
  'airtime-hill': {
    name: {
      en: 'Airtime Hill',
      de: 'Airtime-Hügel',
      fr: 'Airtime Hill',
      it: 'Airtime Hill',
      nl: 'Airtime Hill',
      es: 'Airtime Hill'
    },
    shortDefinition: {
      en: 'A hill-shaped element engineered to produce negative G-forces, causing riders to float or be lifted from their seats.',
      de: 'Ein kuppelförmiges Element, das negative G-Kräfte erzeugt und die Fahrgäste aus dem Sitz hebt — das Herzstück jeder guten Hypercoaster-Strecke.',
      fr: 'Un élément en forme de colline conçu pour générer des G-forces négatives, faisant ressentir aux passagers une apesanteur ou les soulevant de leur siège.',
      it: 'Un elemento a forma di collina progettato per generare G-force negative, facendo sperimentare ai passeggeri l',
      nl: 'Een heuvelachtig element ontworpen om negatieve G-krachten te genereren, waardoor rijders gewichtloosheid ervaren of uit hun stoel worden getild.',
      es: 'Un elemento en forma de colina diseñado para generar G negativas, haciendo que los pasajeros experimenten ingravidez o sean elevados del asiento.'
    },
  },
  'helix': {
    name: {
      en: 'Helix',
      de: 'Helix',
      fr: 'Hélix',
      it: 'Helix',
      nl: 'Helix',
      es: 'Helix'
    },
    shortDefinition: {
      en: 'A continuous spiralling section where the track wraps around a central axis, generating sustained lateral G-forces.',
      de: 'Ein kontinuierlicher Spiralabschnitt, bei dem die Strecke um eine Mittelachse wickelt und anhaltende Seitwärts-G-Kräfte erzeugt.',
      fr: 'Une section en spirale continue où la voie s',
      it: 'Una sezione continua a spirale in cui il binario si avvolge attorno a un asse centrale, generando G-force laterali sostenute.',
      nl: 'Een continu spiralend gedeelte waarbij het spoor om een centrale as wikkelt en aanhoudende laterale G-krachten genereert.',
      es: 'Una sección en espiral continua donde la pista gira alrededor de un eje central, generando G laterales sostenidas.'
    },
  },
  'block-brake': {
    name: {
      en: 'Block Brake',
      de: 'Blockbremse',
      fr: 'Block Brake',
      it: 'Block Brake',
      nl: 'Block Brake',
      es: 'Block Brake'
    },
    shortDefinition: {
      en: 'A braking section dividing the circuit into independent segments, allowing multiple trains to run simultaneously without collision risk.',
      de: 'Eine Bremssektion, die die Strecke in unabhängige Blöcke aufteilt, damit mehrere Züge gleichzeitig ohne Kollisionsgefahr fahren können.',
      fr: 'Une section de freinage qui divise le circuit en segments indépendants, permettant à plusieurs trains de circuler simultanément sans risque de collision.',
      it: 'Una sezione di frenata che divide il circuito in segmenti indipendenti, consentendo a più treni di funzionare simultaneamente senza rischio di collisione.',
      nl: 'Een remgedeelte dat het circuit in onafhankelijke segmenten verdeelt, waardoor meerdere treinen gelijktijdig kunnen rijden zonder botsingsrisico.',
      es: 'Una sección de frenos que divide el circuito en segmentos independientes, permitiendo circular varios trenes simultáneamente sin riesgo de colisión.'
    },
  },
  'brake-run': {
    name: {
      en: 'Brake Run',
      de: 'Brake Run',
      fr: 'Brake Run',
      it: 'Brake Run',
      nl: 'Brake Run',
      es: 'Brake Run'
    },
    shortDefinition: {
      en: 'The deceleration section at the end of a ride where the train slows to station-entry speed.',
      de: 'Der Bremsabschnitt am Ende der Strecke, in dem der Zug auf Stationsgeschwindigkeit verzögert wird — meist mit Wirbelstrombremsen.',
      fr: 'La section de décélération en fin de circuit où le train est ralenti à la vitesse de la gare, généralement à l',
      it: 'La sezione di decelerazione alla fine del giro in cui il treno viene rallentato alla velocità della stazione, tipicamente utilizzando freni magnetici a pattino.',
      nl: 'Het afremgedeelte aan het einde van de rit waarbij de trein wordt vertraagd naar stationssnelheid, doorgaans met magnetische vinremmen.',
      es: 'La sección de deceleración al final del recorrido donde el tren se reduce a la velocidad de estación, normalmente mediante frenos magnéticos de aleta.'
    },
  },
  'cobra-roll': {
    name: {
      en: 'Cobra Roll',
      de: 'Cobra Roll',
      fr: 'Cobra Roll',
      it: 'Cobra Roll',
      nl: 'Cobra Roll',
      es: 'Cobra Roll'
    },
    shortDefinition: {
      en: 'A double-inversion B&M signature element shaped like a cobra',
      de: 'Ein Doppel-Inversions-Element, das in der Form eines erhobenen Kobrakopfs aussieht — zwei Inversionen verbunden durch eine 180-Grad-Drehung am Scheitelpunkt.',
      fr: 'Une double inversion signature B&M où la voie forme la tête dressée d',
      it: 'Un',
      nl: 'Een dubbel-inversie B&M-handtekenelement waarbij het spoor de vorm aanneemt van een opgerichte kobrakop — twee inversies verbonden door een draai aan het hoogste punt.',
      es: 'Un elemento de doble inversión característico de B&M donde la pista forma la silueta de la cabeza erguida de una cobra — dos inversiones conectadas por un giro en la cima.'
    },
  },
  'corkscrew': {
    name: {
      en: 'Corkscrew',
      de: 'Korkenzieher',
      fr: 'Tire-bouchon',
      it: 'Cavatappi',
      nl: 'Kurketrekker',
      es: 'Sacacorchos'
    },
    shortDefinition: {
      en: 'A classic barrel-roll inversion where the track spirals 360 degrees around a central axis — one of the earliest inversion types ever built.',
      de: 'Eine spiralförmige 360-Grad-Inversion, bei der die Strecke um eine Mittelachse gewickelt ist — einer der frühesten und meistgebauten Inversionstypen.',
      fr: 'Une inversion en tonneau où la voie spirale à 360° autour d',
      it: 'Un',
      nl: 'Een vat-rol-inversie waarbij het spoor 360 graden spiraalvormig om een centrale as draait — een van de vroegste en meest gebouwde inversietypen.',
      es: 'Una inversión en barril donde la pista espira 360 grados alrededor de un eje central — uno de los tipos de inversión más antiguos y ampliamente construidos.'
    },
  },
  'dive-loop': {
    name: {
      en: 'Dive Loop',
      de: 'Dive Loop',
      fr: 'Dive Loop',
      it: 'Dive Loop',
      nl: 'Dive Loop',
      es: 'Dive Loop'
    },
    shortDefinition: {
      en: 'The mirror image of an Immelmann — the track dives steeply downward through a half-loop and exits in the opposite direction.',
      de: 'Das Spiegelbild eines Immelmanns: Die Strecke taucht steil nach unten in einen halben Looping und verlässt ihn horizontal — umgekehrte Richtung zum Immelmann.',
      fr: 'Le pendant inverse de l',
      it: 'L',
      nl: 'Het spiegelbeeld van een Immelmann: het spoor duikt steil omlaag in een halve looping en verlaat het element horizontaal — de omgekeerde richting van een Immelmann.',
      es: 'La imagen especular de un Immelmann: la pista se sumerge pronunciadamente hacia abajo en un medio looping y sale en horizontal — invirtiendo la dirección en sentido opuesto al Immelmann.'
    },
  },
  'inline-twist': {
    name: {
      en: 'Inline Twist',
      de: 'Inline Twist',
      fr: 'Inline Twist',
      it: 'Inline Twist',
      nl: 'Inline Twist',
      es: 'Inline Twist'
    },
    shortDefinition: {
      en: 'A single 360-degree roll directly around the track axis, delivering a smooth inversion without significantly changing the train',
      de: 'Eine einzelne 360-Grad-Drehung direkt um die Gleisachse — eine sanfte Inversion, die die Fahrtrichtung kaum verändert.',
      fr: 'Un tonneau à 360° directement autour de l',
      it: 'Un singolo rollio di 360 gradi direttamente attorno all',
      nl: 'Een enkele 360-graden rol recht om de spooras, waarmee een soepele inversie wordt geboden zonder de rijrichting significant te wijzigen.',
      es: 'Un giro de 360 grados directamente alrededor del eje de la pista, proporcionando una inversión suave sin cambiar significativamente la dirección de marcha del tren.'
    },
  },
  'heartline-roll': {
    name: {
      en: 'Heartline Roll',
      de: 'Heartline Roll',
      fr: 'Heartline Roll',
      it: 'Heartline Roll',
      nl: 'Heartline Roll',
      es: 'Heartline Roll'
    },
    shortDefinition: {
      en: 'A 360-degree roll centred on the rider',
      de: 'Eine 360-Grad-Drehung, bei der der Mittelpunkt am Schwerpunkt des Fahrgastes liegt statt am Gleis — für ein schwereloses, sanftes Rotationsgefühl.',
      fr: 'Un tonneau à 360° centré sur le centre de gravité du passager plutôt que sur la voie elle-même, conçu pour offrir une apesanteur douce et soutenue tout au long de la rotation.',
      it: 'Un rollio di 360 gradi centrato sul centro di gravità del passeggero piuttosto che sul binario stesso, progettato per offrire un',
      nl: 'Een 360-graden rol gecentreerd op het zwaartepunt van de rijder in plaats van het spoor zelf, ontworpen voor soepele, aanhoudende gewichtloosheid door de hele rotatie.',
      es: 'Un giro de 360 grados centrado en el centro de gravedad del pasajero en lugar de en la pista misma, diseñado para ofrecer una ingravidez suave y sostenida a lo largo de la rotación.'
    },
  },
  'sidewinder': {
    name: {
      en: 'Sidewinder',
      de: 'Sidewinder',
      fr: 'Sidewinder',
      it: 'Sidewinder',
      nl: 'Sidewinder',
      es: 'Sidewinder'
    },
    shortDefinition: {
      en: 'A half-loop combined with a half-corkscrew that rotates the train 90 degrees and reverses direction — the building block of Vekoma',
      de: 'Ein halber Looping kombiniert mit einem halben Korkenzieher, der die Strecke um 90 Grad dreht und die Fahrtrichtung ändert — Markenzeichen von Vekoma-Boomerang-Coastern.',
      fr: 'Un demi-looping combiné à un demi-tire-bouchon qui pivote la voie de 90° et change de direction — un élément signature Vekoma présent sur les coasters Boomerang.',
      it: 'Un mezzo looping combinato con un mezzo cavatappi che ruota il binario di 90 gradi e cambia direzione — un elemento firma Vekoma presente sui coaster Boomerang.',
      nl: 'Een halve looping gecombineerd met een halve kurketrekker die het spoor 90 graden draait en van richting verandert — een kenmerkend Vekoma-element op Boomerang-achtbanen.',
      es: 'Un medio looping combinado con un medio sacacorchos que gira la pista 90 grados y cambia de dirección — un elemento característico de Vekoma presente en los coasters Boomerang.'
    },
  },
  'pretzel-loop': {
    name: {
      en: 'Pretzel Loop',
      de: 'Pretzel Loop',
      fr: 'Pretzel Loop',
      it: 'Pretzel Loop',
      nl: 'Pretzel Loop',
      es: 'Pretzel Loop'
    },
    shortDefinition: {
      en: 'A massive inversion on B&M flying coasters where riders in the horizontal Superman position pass through the bottom of a vertical loop while fully inverted.',
      de: 'Eine massive Inversion ausschließlich für B&M-Flying-Coaster, bei der Fahrgäste in Superman-Position durch den Tiefpunkt eines großen Loopings passieren.',
      fr: 'Une inversion massive exclusive aux flying coasters B&M où les passagers, déjà en position Superman, passent par le bas d',
      it: 'Una massiccia inversione esclusiva dei flying coaster B&M in cui i passeggeri, già in posizione Superman, passano attraverso il punto più basso di un looping verticale completamente invertiti.',
      nl: 'Een massale inversie exclusief voor B&M flying coasters waarbij rijders, al in Superman-positie, door het laagste punt van een verticale looping gaan terwijl ze volledig ondersteboven zijn.',
      es: 'Una inversión masiva exclusiva de los flying coasters de B&M donde los pasajeros, ya en posición Superman, pasan por la parte inferior de un looping vertical completamente invertidos.'
    },
  },
  'batwing': {
    name: {
      en: 'Batwing',
      de: 'Batwing',
      fr: 'Batwing',
      it: 'Batwing',
      nl: 'Batwing',
      es: 'Batwing'
    },
    shortDefinition: {
      en: 'A double-inversion with a 180-degree direction reversal combining two half-loops connected by a half-corkscrew, forming a bat-wing shape overhead.',
      de: 'Ein Doppel-Inversions-Element mit 180-Grad-Richtungsumkehr, das in der Form einer Fledermaus-Flügelspannweite aussieht.',
      fr: 'Un élément à double inversion avec inversion de direction à 180°, combinant deux demi-loopings reliés par un demi-tire-bouchon — la forme évoque des ailes de chauve-souris déployées.',
      it: 'Un elemento a doppia inversione con inversione di direzione di 180 gradi, che combina due mezzi looping collegati da un mezzo cavatappi — la forma ricorda ali di pipistrello spiegate.',
      nl: 'Een dubbel-inversie-element met een 180-graden richtingsomkering, waarbij twee halve loopings verbonden zijn door een halve kurketrekker — de vorm doet denken aan gespreide vleermuisvleugels.',
      es: 'Un elemento de doble inversión con inversión de dirección de 180 grados, que combina dos medios looopings conectados por un medio sacacorchos — la silueta recuerda a las alas extendidas de un murciélago.'
    },
  },
  'norwegian-loop': {
    name: {
      en: 'Norwegian Loop',
      de: 'Norwegian Loop',
      fr: 'Norwegian Loop',
      it: 'Norwegian Loop',
      nl: 'Norwegian Loop',
      es: 'Norwegian Loop'
    },
    shortDefinition: {
      en: 'A loop variant where the train enters from the top, dives through the circular path, and exits at the top — the inverse geometry of a standard vertical loop.',
      de: 'Eine Looping-Variante, bei der Einfahrt und Ausfahrt oben liegen statt unten — die umgekehrte Geometrie eines Standard-Loopings.',
      fr: 'Une variante de looping où la voie arrive par le haut, plonge dans le chemin circulaire et ressort au sommet — la géométrie inverse d',
      it: 'Una variante di looping in cui il binario si avvicina dall',
      nl: 'Een looping-variant waarbij het spoor van bovenaf nadert, door het cirkelvormige pad omlaag duikt en bovenaan uitkomt — de omgekeerde geometrie van een standaard looping.',
      es: 'Una variante del looping donde la pista se aproxima desde arriba, se sumerge por el camino circular y sale de nuevo por arriba — la geometría inversa de un looping estándar.'
    },
  },
  'flat-spin': {
    name: {
      en: 'Flat Spin',
      de: 'Flat Spin',
      fr: 'Flat Spin',
      it: 'Flat Spin',
      nl: 'Flat Spin',
      es: 'Flat Spin'
    },
    shortDefinition: {
      en: 'A corkscrew-type inversion on inverted coasters where the spiral occurs in a nearly horizontal plane, creating a sweeping, wide rotation.',
      de: 'Ein Korkenzieher-Element auf Inverted- oder Flying-Coastern, bei dem die Drehung in nahezu horizontaler Ebene stattfindet.',
      fr: 'Un élément de type tire-bouchon sur les coasters inversés ou flying où la rotation se produit dans un plan approximativement horizontal, créant une rotation balayante presque à plat.',
      it: 'Un elemento a cavatappi su coaster invertiti o flying in cui la rotazione avviene in un piano approssimativamente orizzontale, creando una rotazione ampia e quasi livellata.',
      nl: 'Een kurketrekker-element op inverted of flying coasters waarbij de rotatie in een nagenoeg horizontaal vlak plaatsvindt, wat een zwaaiende, bijna vlakke rotatie creëert.',
      es: 'Un elemento de tipo sacacorchos en coasters invertidos o flying donde la rotación ocurre en un plano aproximadamente horizontal, creando una rotación amplia y casi nivelada.'
    },
  },
  'cutback': {
    name: {
      en: 'Cutback',
      de: 'Cutback',
      fr: 'Cutback',
      it: 'Cutback',
      nl: 'Cutback',
      es: 'Cutback'
    },
    shortDefinition: {
      en: 'A half-corkscrew inversion that simultaneously reverses the train',
      de: 'Eine halbe Korkenzieher-Inversion, die gleichzeitig die Fahrtrichtung um ca. 180 Grad umkehrt — Inversion und Richtungsänderung in einem Element.',
      fr: 'Un demi-tire-bouchon qui inverse simultanément la direction du train d',
      it: 'Un mezzo cavatappi che inverte simultaneamente la direzione del treno di circa 180 gradi — combinando un',
      nl: 'Een halve-kurketrekker-inversie die tegelijkertijd de rijrichting van de trein met circa 180 graden omkeert — inversie en scherpe richtingsverandering gecombineerd.',
      es: 'Una inversión de medio sacacorchos que simultáneamente invierte la dirección del tren aproximadamente 180 grados — combinando una inversión con un cambio de dirección pronunciado.'
    },
  },
  'butterfly': {
    name: {
      en: 'Butterfly',
      de: 'Butterfly',
      fr: 'Butterfly',
      it: 'Butterfly',
      nl: 'Butterfly',
      es: 'Butterfly'
    },
    shortDefinition: {
      en: 'A double-inversion element similar to a sea serpent with a lower connecting apex, producing two inversions in a compact vertical footprint.',
      de: 'Eine Doppel-Inversions-Variante der Sea Serpent mit tieferem Verbindungsscheitelpunkt — zwei aufeinanderfolgende Inversionen ohne Richtungsänderung in kompakter Bauform.',
      fr: 'Une variante de double inversion sea-serpent avec un apex de liaison plus bas, produisant deux inversions consécutives sans changement de direction dans un espace compact.',
      it: 'Una variante di doppia inversione a sea-serpent con un apice di collegamento più basso, che produce due inversioni consecutive senza cambiamento di direzione in uno spazio compatto.',
      nl: 'Een dubbel-inversie zee-serpent-variant met een lager verbindingspunt, die twee opeenvolgende inversies produceert zonder richtingsverandering in een compact voetafdruk.',
      es: 'Una variante de sea serpent de doble inversión con un punto de conexión más bajo, produciendo dos inversiones consecutivas sin cambio de dirección en un espacio compacto.'
    },
  },
  'bowtie': {
    name: {
      en: 'Bowtie',
      de: 'Bowtie',
      fr: 'Bowtie',
      it: 'Bowtie',
      nl: 'Bowtie',
      es: 'Bowtie'
    },
    shortDefinition: {
      en: 'A double-inversion element where two mirrored half-loops form a bowtie shape — two inversions without a direction change.',
      de: 'Ein Doppel-Inversions-Element mit zwei gespiegelten halben Loopings, die eine Fliegen-Form bilden — zwei Inversionen ohne Richtungsänderung.',
      fr: 'Un élément à double inversion composé de deux demi-loopings en miroir formant un nœud papillon — deux inversions sans changement de direction.',
      it: 'Un elemento a doppia inversione in cui due mezzi looping speculari formano una forma a papillon nel binario — due inversioni senza cambio di direzione.',
      nl: 'Een dubbel-inversie-element waarbij twee gespiegelde halve loopings een strikjesdas-vorm vormen in het spoor — twee inversies zonder richtingsverandering.',
      es: 'Un elemento de doble inversión donde dos medios looopings en espejo forman la silueta de una pajarita — dos inversiones sin cambio de dirección.'
    },
  },
  'bunnyhop': {
    name: {
      en: 'Bunny Hop',
      de: 'Bunnyhop',
      fr: 'Bunnyhop',
      it: 'Bunnyhop',
      nl: 'Bunnyhop',
      es: 'Bunnyhop'
    },
    shortDefinition: {
      en: 'A series of small, quick airtime hills near the end of a ride producing gentle floater airtime as the train loses speed.',
      de: 'Eine Reihe kleiner, schneller Airtime-Hügel am Ende der Strecke, die sanften Floater-Airtime bei reduzierter Geschwindigkeit erzeugen.',
      fr: 'Une série de petites collines rapides en fin de trajet produisant un doux airtime floater au fur et à mesure que le train perd de la vitesse.',
      it: 'Una serie di piccole, rapide Airtime Hill vicino alla fine del giro che producono un dolce floater airtime mentre il treno perde velocità.',
      nl: 'Een reeks kleine, snelle airtime hills aan het einde van een rit die zachte floater airtime produceren terwijl de trein vaart verliest.',
      es: 'Una serie de pequeñas colinas rápidas cerca del final del recorrido que producen un suave airtime flotante cuando el tren va perdiendo velocidad.'
    },
  },
  'stengel-dive': {
    name: {
      en: 'Stengel Dive',
      de: 'Stengel Dive',
      fr: 'Stengel Dive',
      it: 'Stengel Dive',
      nl: 'Stengel Dive',
      es: 'Stengel Dive'
    },
    shortDefinition: {
      en: 'An overbanked airtime hill tilted beyond 90 degrees, combining lateral disorientation with negative G-forces — a Mack Rides signature element named after engineer Werner Stengel.',
      de: 'Ein überkippter Airtime-Hügel mit über 90 Grad Querneigung, benannt nach Ingenieur Werner Stengel — Fahrgäste hängen seitlich während sie gleichzeitig Airtime erleben.',
      fr: 'Un airtime hill incliné au-delà de 90°, propulsant les passagers latéralement tout en générant des G-forces négatives — nommé d',
      it: 'Un',
      nl: 'Een over-overbankende airtime hill die voorbij 90 graden kantelt en rijders zijwaarts werpt terwijl ze tegelijkertijd negatieve G-krachten ervaren — vernoemd naar de legendarische ingenieur Werner Stengel en een kenmerkend Mack Rides-element.',
      es: 'Una airtime hill inclinada más allá de los 90 grados que lanza a los pasajeros de lado mientras simultáneamente produce G negativas — bautizada en honor al legendario ingeniero Werner Stengel y elemento característico de Mack Rides.'
    },
  },
  'horseshoe': {
    name: {
      en: 'Horseshoe',
      de: 'Horseshoe',
      fr: 'Horseshoe',
      it: 'Horseshoe',
      nl: 'Horseshoe',
      es: 'Horseshoe'
    },
    shortDefinition: {
      en: 'A sharply banked 180-degree turnaround shaped like a horseshoe, used to redirect the train between launch segments on multi-launch coasters.',
      de: 'Eine stark überkippte 180-Grad-Kurve in Hufeisenform, die den Zug in die entgegengesetzte Richtung umlenkt — häufig zwischen Launch-Segmenten eingesetzt.',
      fr: 'Un virage semicirculaire très incliné en forme de fer à cheval, réorientant le train dans la direction opposée — couramment utilisé pour retourner le train entre des segments de lancement.',
      it: 'Una curva con forte inclinazione a 180 gradi a forma di ferro di cavallo, che reindirizza il treno nella direzione opposta — comunemente usata per girare il treno tra segmenti di lancio.',
      nl: 'Een scherp gebankeerde 180-graden bocht in de vorm van een hoefijzer, die de trein in de tegenovergestelde richting stuurt — vaak gebruikt om de trein te keren tussen lanceersegmenten.',
      es: 'Una curva muy peraltada de 180 grados con forma de herradura que redirige el tren en dirección opuesta — habitualmente usada para girar el tren entre segmentos de lanzamiento.'
    },
  },
  'predrop': {
    name: {
      en: 'Pre-Drop',
      de: 'Predrop',
      fr: 'Predrop',
      it: 'Predrop',
      nl: 'Predrop',
      es: 'Predrop'
    },
    shortDefinition: {
      en: 'A small dip just before the main first drop on a chain-lift coaster, easing chain tension and delivering a brief anticipatory moment of airtime.',
      de: 'Ein kleiner Hügel kurz vor dem First Drop auf Kettenlift-Coastern, der die Kettenspannung verringert und einen kurzen Vorgeschmack auf Airtime liefert.',
      fr: 'Une petite dénivellation juste avant la première grande descente sur un coaster à lifthill, utilisée pour réduire la tension de la chaîne et offrir un bref instant d',
      it: 'Un piccolo avvallamento appena prima della discesa principale su un coaster a catena, usato per ridurre la tensione della catena e fornire un breve momento di airtime anticipatorio.',
      nl: 'Een kleine dip vlak voor de hoofddrop van een achtbaan met chain lift, gebruikt om kettingspanning te verminderen en een kort anticiperend airtime-moment te bieden.',
      es: 'Una pequeña bajada justo antes de la primera caída principal en un coaster con cadena, usada para reducir la tensión de la cadena y proporcionar un breve momento de airtime anticipatorio.'
    },
  },
  'top-hat': {
    name: {
      en: 'Top Hat',
      de: 'Top Hat',
      fr: 'Top Hat',
      it: 'Top Hat',
      nl: 'Top Hat',
      es: 'Top Hat'
    },
    shortDefinition: {
      en: 'A tall, narrow element with near-vertical ascent and descent — the signature centrepiece of hydraulic-launch Intamin accelerator coasters.',
      de: 'Ein hohes, schmales Element mit nahezu vertikalem Auf- und Abstieg — Wahrzeichen der Intamin-Hydraulik-Launch-Coaster.',
      fr: 'Un élément haut et étroit avec montée et descente quasi-verticales ressemblant à un chapeau haut de forme — élément signature des coasters Intamin à lancement hydraulique.',
      it: 'Un elemento alto e stretto con ascesa e discesa quasi verticali che ricorda un cappello a cilindro — un elemento firma sui coaster Intamin a lancio idraulico.',
      nl: 'Een hoog, smal element met een nagenoeg verticale klim en daling dat lijkt op een hoge hoed — een kenmerkend element op hydraulisch gelanceerde Intamin-achtbanen.',
      es: 'Un elemento alto y estrecho con un ascenso y descenso casi verticales que recuerda a un sombrero de copa — un elemento característico de los coasters Intamin de lanzamiento hidráulico.'
    },
  },
  'boomerang': {
    name: {
      en: 'Boomerang',
      de: 'Boomerang',
      fr: 'Boomerang',
      it: 'Boomerang',
      nl: 'Boomerang',
      es: 'Boomerang'
    },
    shortDefinition: {
      en: 'A compact Vekoma coaster model that sends riders through three inversions twice — once forward, once backward — in a back-and-forth layout.',
      de: 'Ein kompaktes Vekoma-Coaster-Modell, das Fahrgäste durch drei Inversionen schickt — einmal vorwärts, einmal rückwärts — für insgesamt sechs Inversionen in einer Hin-und-Her-Bahn.',
      fr: 'Un modèle de coaster Vekoma compact qui fait traverser aux visiteurs trois inversions deux fois — d',
      it: 'Un modello di coaster compatto Vekoma che porta i visitatori attraverso tre inversioni due volte — prima in avanti, poi all',
      nl: 'Een compact Vekoma-achtbaanmodel dat bezoekers door drie inversies twee keer stuurt — eerst vooruit, dan achteruit — in een heen-en-terugstekende layout.',
      es: 'Un modelo compacto de Vekoma que lleva a los visitantes a través de tres inversiones dos veces — primero hacia adelante y luego hacia atrás — en un recorrido de ida y vuelta.'
    },
  },
  'euro-fighter': {
    name: {
      en: 'Euro-Fighter',
      de: 'Euro-Fighter',
      fr: 'Euro-Fighter',
      it: 'Euro-Fighter',
      nl: 'Euro-Fighter',
      es: 'Euro-Fighter'
    },
    shortDefinition: {
      en: 'A compact Gerstlauer coaster model featuring a vertical or beyond-vertical first drop after a vertical lift hill, delivering intense thrills in a small footprint.',
      de: 'Ein kompaktes Gerstlauer-Coaster-Modell mit nahezu vertikalem oder Überkopf-First-Drop nach einem vertikalen Kettenlift — intensive Fahrten auf kleiner Grundfläche.',
      fr: 'Un modèle de coaster compact Gerstlauer avec une première descente quasi-verticale ou au-delà de la verticale lancée depuis un lifthill vertical, conçu pour offrir des sensations intenses dans un espace réduit.',
      it: 'Un modello di coaster compatto Gerstlauer con una prima discesa quasi verticale o oltre la verticale lanciata da una catena di risalita verticale, progettato per offrire emozioni intense in piccoli spazi.',
      nl: 'Een compact Gerstlauer-achtbaanmodel met een nagenoeg verticale of voorbij-verticale eerste drop gelanceerd vanuit een verticale lifthill, ontworpen voor intense thrills in een kleine ruimte.',
      es: 'Un modelo compacto de Gerstlauer con una primera caída vertical o más allá de la vertical lanzada desde una cadena de ascenso vertical, diseñado para ofrecer emociones intensas en un espacio reducido.'
    },
  },
  'dive-coaster': {
    name: {
      en: 'Dive Coaster',
      de: 'Dive Coaster',
      fr: 'Dive Coaster',
      it: 'Dive Coaster',
      nl: 'Dive Coaster',
      es: 'Dive Coaster'
    },
    shortDefinition: {
      en: 'A coaster type featuring an unusually wide train and a near-vertical or beyond-vertical drop with a deliberate pause at the crest before plunging.',
      de: 'Ein Coaster-Typ mit extrem breitem Zug und nahezu vertikalem Abfall, der oben dramatisch anhält — für maximale Vorspannung vor dem Sturz.',
      fr: 'Un type de coaster à train très large avec une descente quasi-verticale ou au-delà de la verticale, accompagnée d',
      it: 'Un tipo di coaster con un treno inusualmente largo e una discesa quasi verticale o oltre la verticale, con una pausa deliberata sulla cresta prima del tuffo.',
      nl: 'Een achtbaantype met een ongewoon breed treinstel en een nagenoeg verticale of voorbij-verticale drop, met een opzettelijke pauze aan de rand vóór de val.',
      es: 'Un tipo de montaña rusa con un tren excepcionalmente ancho y una caída vertical o más allá de la vertical, con una pausa deliberada en la cresta antes del plunge.'
    },
  },
  'credit': {
    name: {
      en: 'Coaster Credit',
      de: 'Credit',
      fr: 'Crédit',
      it: 'Credit',
      nl: 'Credit',
      es: 'Credit'
    },
    shortDefinition: {
      en: 'A roller coaster an enthusiast has ridden and logged to their personal count — collecting credits is a defining hobby in the coaster community.',
      de: 'Eine gefahrene Achterbahn, die ein Enthusiast in seine persönliche Gesamtzahl aufnimmt — Credits zu sammeln ist eine der Kernaktivitäten der Coaster-Enthusiasten-Community.',
      fr: 'Une montagne russe qu',
      it: 'Una montagna russa che un appassionato ha ufficialmente percorso e aggiunto al proprio conteggio personale — collezionare credit è un',
      nl: 'Een achtbaan die een enthousiasteling officieel heeft gereden en aan zijn persoonlijke telling heeft toegevoegd — credits verzamelen is een kernactiviteit in de achtbaanenthousiaste gemeenschap.',
      es: 'Una montaña rusa que un entusiasta ha montado oficialmente y añadido a su contador personal — coleccionar credits es una actividad central dentro de la comunidad de entusiastas de coasters.'
    },
  },
  'pov': {
    name: {
      en: 'POV',
      de: 'POV',
      fr: 'POV',
      it: 'POV',
      nl: 'POV',
      es: 'POV'
    },
    shortDefinition: {
      en: 'Point-of-view footage filmed from the front row of a coaster, letting prospective riders virtually preview the full experience.',
      de: 'Point-of-View-Aufnahme aus der Perspektive der ersten Reihe einer Achterbahn — das wichtigste Videoformat der Coaster-Enthusiasten-Community auf YouTube.',
      fr: 'Vidéo en point de vue filmée depuis le premier rang d',
      it: 'Riprese in soggettiva dalla prima fila di una montagna russa, che danno ai potenziali passeggeri un',
      nl: 'Point-of-view-beeldmateriaal gefilmd vanuit de eerste rij van een achtbaan, waarmee potentiële bezoekers een virtueel voorbeeld van de ritervaring krijgen.',
      es: 'Grabación en punto de vista desde la primera fila de una montaña rusa, ofreciendo a los visitantes potenciales una vista previa virtual de la experiencia.'
    },
  },
  'vr-coaster': {
    name: {
      en: 'VR Coaster',
      de: 'VR Coaster',
      fr: 'VR Coaster',
      it: 'VR Coaster',
      nl: 'VR Coaster',
      es: 'VR Coaster'
    },
    shortDefinition: {
      en: 'A roller coaster enhanced with VR headsets displaying a synchronised virtual experience that overlays the physical ride.',
      de: 'Eine Achterbahn, bei der Fahrgäste VR-Brillen tragen, die eine synchronisierte virtuelle Welt über die physische Fahrt legen.',
      fr: 'Une montagne russe équipée de casques de réalité virtuelle superposant une expérience animée ou de jeu synchronisée à la sensation physique du manège.',
      it: 'Una montagna russa arricchita con visori per la realtà virtuale che sovrappongono un',
      nl: 'Een achtbaan uitgebreid met virtual reality-headsets die een gesynchroniseerde geanimeerde of gaming-ervaring over de fysieke rit heen leggen.',
      es: 'Una montaña rusa mejorada con cascos de realidad virtual que superponen una experiencia animada o de juego sincronizada sobre el recorrido físico.'
    },
  },
  'ert': {
    name: {
      en: 'ERT',
      de: 'ERT',
      fr: 'ERT',
      it: 'ERT',
      nl: 'ERT',
      es: 'ERT'
    },
    shortDefinition: {
      en: 'Exclusive Ride Time — private access to one or more attractions for a small group, with no general public queue.',
      de: 'Exclusive Ride Time — eine Session mit exklusivem Zugang zu einer oder mehreren Attraktionen für Enthusiasten-Clubs oder Hotelgäste, ohne normales Publikum.',
      fr: 'Exclusive Ride Time — une session pendant laquelle un groupe d',
      it: 'Exclusive Ride Time — una sessione in cui un gruppo di appassionati o ospiti dell',
      nl: 'Exclusive Ride Time — een sessie waarbij een groep enthousiastelingen of hotelgasten exclusieve toegang hebben tot één of meer attracties zonder reguliere publiekswachtrij.',
      es: 'Exclusive Ride Time — una sesión en la que un grupo de entusiastas o huéspedes de hotel tiene acceso exclusivo a una o varias atracciones sin cola del público general.'
    },
  },
  'touring-plan': {
    name: {
      en: 'Touring Plan',
      de: 'Touringplan',
      fr: 'Touring Plan',
      it: 'Touring Plan',
      nl: 'Touring Plan',
      es: 'Touring Plan'
    },
    shortDefinition: {
      en: 'A detailed, optimised itinerary sequencing attractions to minimise total wait time and maximise rides in a single day.',
      de: 'Ein detaillierter, optimierter Besuchsplan für einen Freizeitparkbesuch, der die Abfolge der Attraktionen so ordnet, dass Wartezeiten minimiert und möglichst viele Fahrten erreicht werden.',
      fr: 'Un itinéraire détaillé et optimisé pour une visite de parc à thème, séquençant les attractions pour minimiser les temps d',
      it: 'Un itinerario dettagliato e ottimizzato per una visita al parco a tema che sequenzia le attrazioni per minimizzare i tempi di attesa e massimizzare il numero di giri in un giorno.',
      nl: 'Een gedetailleerd, geoptimaliseerd itinerarium voor een pretparkbezoek dat attracties in volgorde plaatst om wachttijden te minimaliseren en het aantal ritten per dag te maximaliseren.',
      es: 'Un itinerario detallado y optimizado para una visita al parque que secuencia las atracciones para minimizar los tiempos de espera y maximizar el número de atracciones en un día.'
    },
  },
  'stacking': {
    name: {
      en: 'Stacking',
      de: 'Stacking',
      fr: 'Stacking',
      it: 'Stacking',
      nl: 'Stacking',
      es: 'Stacking'
    },
    shortDefinition: {
      en: 'A situation where multiple coaster trains accumulate in the brake run because the station is not clearing fast enough — reducing throughput and extending wait times.',
      de: 'Situation, bei der mehrere Züge in der Bremssektion aufeinander warten, weil das Be- und Entladen langsamer als der Fahrzyklus ist — reduziert die Kapazität und verlängert Wartezeiten.',
      fr: 'Une situation où plusieurs trains arrivent sur le brake run avant que la gare ne soit dégagée, formant une file de trains en attente — signe d',
      it: 'Una situazione in cui più treni arrivano al Brake Run prima che la stazione sia libera, causando una coda di treni in attesa — un segnale di operazioni inefficienti che prolunga i tempi di attesa.',
      nl: 'Een situatie waarbij meerdere treinen bij de brake run aankomen voordat het station vrij is, waardoor treinen opstapelen — een teken van inefficiënte operaties die wachttijden verlengen.',
      es: 'Una situación en la que varios trenes llegan al brake run antes de que la estación esté libre, provocando una acumulación de trenes — señal de operaciones ineficientes que aumenta los tiempos de espera.'
    },
  },
  'inverted-coaster': {
    name: {
      en: 'Inverted Coaster',
      de: 'Inverted Coaster',
      fr: 'Inverted Coaster',
      it: 'Inverted Coaster',
      nl: 'Inverted Coaster',
      es: 'Inverted Coaster'
    },
    shortDefinition: {
      en: 'A coaster where the track runs above the train and riders',
      de: 'Achterbahntyp, bei dem der Zug unter der Schiene hängt und die Beine der Fahrgäste frei in der Luft baumeln.',
      fr: 'Type de montagnes russes où le train est suspendu sous le rail et les pieds des passagers pendent librement.',
      it: 'Tipo di montagna russa in cui il treno è sospeso sotto la rotaia e i piedi dei passeggeri penzolano liberamente.',
      nl: 'Type achtbaan waarbij de trein onder de rail hangt en de voeten van passagiers vrij bungelen.',
      es: 'Tipo de montaña rusa en la que el tren cuelga bajo el rail y los pies de los pasajeros cuelgan libremente.'
    },
  },
  'wing-coaster': {
    name: {
      en: 'Wing Coaster',
      de: 'Wing Coaster',
      fr: 'Wing Coaster',
      it: 'Wing Coaster',
      nl: 'Wing Coaster',
      es: 'Wing Coaster'
    },
    shortDefinition: {
      en: 'A coaster type with seats extending on either side of the track, so riders have nothing above, below, or beside them — maximising the sensation of flight.',
      de: 'Achterbahntyp mit seitlich an der Schiene platzierten Sitzen — über, unter und neben den Fahrgästen ist nichts als Luft.',
      fr: 'Type de coaster où les sièges sont disposés de chaque côté du rail — rien au-dessus, en dessous ni à côté des passagers.',
      it: 'Tipo di coaster con i sedili posizionati su entrambi i lati della rotaia — nulla sopra, sotto o accanto ai passeggeri.',
      nl: 'Type achtbaan met stoelen aan weerszijden van de rail — niets boven, onder of naast de passagiers.',
      es: 'Tipo de coaster con asientos a ambos lados del rail — sin nada encima, debajo ni al lado de los pasajeros.'
    },
  },
  'spinning-coaster': {
    name: {
      en: 'Spinning Coaster',
      de: 'Spinning Coaster',
      fr: 'Spinning Coaster',
      it: 'Spinning Coaster',
      nl: 'Spinning Coaster',
      es: 'Spinning Coaster'
    },
    shortDefinition: {
      en: 'A coaster where cars rotate freely on a vertical axis throughout the ride, so every run offers a different orientation.',
      de: 'Achterbahn mit frei drehbaren Fahrzeugen — jede Fahrt bietet eine andere Perspektive.',
      fr: 'Coaster dont les wagons tournent librement sur un axe vertical, offrant une expérience différente à chaque trajet.',
      it: 'Montagna russa con vagoni che ruotano liberamente su un asse verticale, offrendo un',
      nl: 'Achtbaan met vrij draaiende wagons op een verticale as — elke rit biedt een ander perspectief.',
      es: 'Montaña rusa con vagones que giran libremente sobre un eje vertical, ofreciendo una experiencia diferente en cada viaje.'
    },
  },
  'hyper-coaster': {
    name: {
      en: 'Hyper Coaster',
      de: 'Hyper Coaster',
      fr: 'Hyper Coaster',
      it: 'Hyper Coaster',
      nl: 'Hyper Coaster',
      es: 'Hyper Coaster'
    },
    shortDefinition: {
      en: 'A coaster between 200 and 299 feet (61–91 m) tall — typically inversion-free and focused on sustained speed and airtime over large camelback hills.',
      de: 'Achterbahn mit mehr als 61 m Höhe — ohne Inversionen, dafür mit Fokus auf Geschwindigkeit und Airtime.',
      fr: 'Coaster dépassant 61 m de hauteur, généralement sans inversions, axé sur la vitesse et l',
      it: 'Montagna russa che supera i 61 m di altezza, tipicamente senza inversioni e incentrata su velocità e airtime.',
      nl: 'Achtbaan van meer dan 61 m hoog, doorgaans zonder inversies, met de nadruk op snelheid en airtime.',
      es: 'Montaña rusa que supera los 61 m de altura, generalmente sin inversiones y enfocada en velocidad y airtime.'
    },
  },
  'giga-coaster': {
    name: {
      en: 'Giga Coaster',
      de: 'Giga Coaster',
      fr: 'Giga Coaster',
      it: 'Giga Coaster',
      nl: 'Giga Coaster',
      es: 'Giga Coaster'
    },
    shortDefinition: {
      en: 'A coaster exceeding 300 feet (91 m) in height — the category above hyper coasters, defined by extreme height and long, fast layouts.',
      de: 'Achterbahn mit mehr als 91 m Höhe — eine Stufe über dem Hyper Coaster.',
      fr: 'Coaster dépassant 91 m de hauteur — un cran au-dessus du Hyper Coaster.',
      it: 'Montagna russa che supera i 91 m di altezza — un gradino sopra l',
      nl: 'Achtbaan van meer dan 91 m hoog — een klasse hoger dan de Hyper Coaster.',
      es: 'Montaña rusa que supera los 91 m de altura — un escalón por encima del Hyper Coaster.'
    },
  },
  'overbank': {
    name: {
      en: 'Overbanked Turn',
      de: 'Übergeneigte Kurve',
      fr: 'Overbanked Turn',
      it: 'Overbanked Turn',
      nl: 'Overbanked Turn',
      es: 'Overbanked Turn'
    },
    shortDefinition: {
      en: 'A banked turn where the track tilts beyond 90 degrees, putting riders briefly past the inverted position without completing a full inversion.',
      de: 'Kurve, bei der die Schiene über 90° geneigt ist — die Fahrgäste werden kurzzeitig über die Senkrechte hinaus gekippt.',
      fr: 'Virage dont le dévers dépasse 90°, inclinant brièvement les passagers au-delà de la verticale.',
      it: 'Curva con inclinazione superiore a 90°, che inclina brevemente i passeggeri oltre la verticale.',
      nl: 'Bocht waarbij de spoorkanteling meer dan 90° bedraagt, waardoor passagiers kort voorbij de verticaal worden gekanteld.',
      es: 'Curva con peralte superior a 90°, que inclina brevemente a los pasajeros más allá de la vertical.'
    },
  },
  'trim-brake': {
    name: {
      en: 'Trim Brake',
      de: 'Trim-Bremse',
      fr: 'Trim Brake',
      it: 'Trim Brake',
      nl: 'Trim Brake',
      es: 'Trim Brake'
    },
    shortDefinition: {
      en: 'A mid-course magnetic or friction brake that reduces a coaster',
      de: 'Eine Magnetbremse im Streckenverlauf, die den Zug abbremst, ohne ihn vollständig anzuhalten.',
      fr: 'Frein magnétique en milieu de parcours qui réduit la vitesse du train sans l',
      it: 'Freno magnetico a metà percorso che riduce la velocità del treno senza fermarlo completamente.',
      nl: 'Magnetische rem halverwege het parcours die de snelheid van de trein vermindert zonder hem volledig te stoppen.',
      es: 'Freno magnético a mitad de recorrido que reduce la velocidad del tren sin detenerlo por completo.'
    },
  },
  'rollback': {
    name: {
      en: 'Rollback',
      de: 'Rollback',
      fr: 'Rollback',
      it: 'Rollback',
      nl: 'Rollback',
      es: 'Rollback'
    },
    shortDefinition: {
      en: 'When a launched coaster fails to reach the top of its circuit and rolls backward down the launch track to the launch position.',
      de: 'Wenn ein Launch-Coaster den höchsten Punkt nicht erreicht und rückwärts auf die Abschussbahn rollt.',
      fr: 'Quand un launch coaster n',
      it: 'Quando un launch coaster non raggiunge la cima del circuito e rotola indietro sul binario di lancio.',
      nl: 'Wanneer een launch coaster het hoogste punt niet bereikt en terugrollt naar het lanceerplatform.',
      es: 'Cuando un launch coaster no alcanza la cima del circuito y rueda hacia atrás por el carril de lanzamiento.'
    },
  },
  'animatronics': {
    name: {
      en: 'Animatronics',
      de: 'Animatronic',
      fr: 'Animatronique',
      it: 'Animatronica',
      nl: 'Animatronic',
      es: 'Animatrónica'
    },
    shortDefinition: {
      en: 'Electro-mechanical robotic figures used in dark rides and shows to bring characters and scenes to life.',
      de: 'Elektromechanische Roboterfiguren in Themenfahrten und Shows, die Charaktere oder Szenen lebendig wirken lassen.',
      fr: 'Personnages robotiques utilisés dans les dark rides et spectacles pour créer des scènes vivantes.',
      it: 'Personaggi robotici utilizzati nei dark ride e negli spettacoli per creare scene realistiche.',
      nl: 'Robotfiguren gebruikt in dark rides en shows om levensechte personages en scènes te creëren.',
      es: 'Figuras robóticas utilizadas en dark rides y espectáculos para crear personajes y escenas realistas.'
    },
  },
  'ai-forecast': {
    name: {
      en: 'AI Forecast',
      de: 'KI-Prognose',
      fr: 'Prévision IA',
      it: 'Previsione IA',
      nl: 'AI-voorspelling',
      es: 'Predicción IA'
    },
    shortDefinition: {
      en: 'Machine-learning predictions of crowd levels and wait times at theme parks, generated up to 30+ days in advance.',
      de: 'KI-gestützte Vorhersagen für Besucherdichte und Wartezeiten in Freizeitparks – bis zu 30+ Tage im Voraus.',
      fr: 'Prédictions basées sur le machine learning pour les niveaux de fréquentation et les temps d',
      it: 'Previsioni basate sul machine learning per i livelli di affluenza e i tempi di attesa — fino a 30+ giorni in anticipo.',
      nl: 'Machine learning-voorspellingen voor druktenivaues en wachttijden — tot 30+ dagen van tevoren.',
      es: 'Predicciones basadas en machine learning para niveles de afluencia y tiempos de espera — hasta 30+ días de antelación.'
    },
  },
  'ki': {
    name: {
      en: 'AI',
      de: 'KI',
      fr: 'IA',
      it: 'IA',
      nl: 'AI',
      es: 'IA'
    },
    shortDefinition: {
      en: 'Artificial Intelligence — the machine-learning models that calculate crowd forecasts and wait time predictions.',
      de: 'Künstliche Intelligenz — Machine-Learning-Modelle, die Besucherprognosen und Wartezeiten für Freizeitparks berechnen.',
      fr: 'Intelligence Artificielle — les modèles de machine learning qui calculent les prévisions de fréquentation et les temps d',
      it: 'Intelligenza Artificiale — i modelli di machine learning che calcolano le previsioni di affluenza e i tempi di attesa.',
      nl: 'Kunstmatige Intelligentie — de machine-learningmodellen die drukte-prognoses en wachttijdvoorspellingen berekenen.',
      es: 'Inteligencia Artificial — los modelos de machine learning que calculan las previsiones de afluencia y los tiempos de espera.'
    },
  },
  'realtime-wait-time': {
    name: {
      en: 'Live Wait Time',
      de: 'Echtzeit-Wartezeit',
      it: 'Tempo di attesa in tempo reale',
      nl: 'Live wachttijd',
      es: 'Tiempo de espera en vivo'
    },
    shortDefinition: {
      en: 'Wait time data pulled directly from park systems and updated every minute.',
      de: 'Minütlich aktualisierte Live-Wartezeit direkt aus den Systemen eines Freizeitparks.',
      it: 'Dati sui tempi di attesa aggiornati in tempo reale direttamente dai sistemi del parco.',
      nl: 'Wachttijddata die direct vanuit de parksystemen wordt opgehaald en elke minuut bijgewerkt.',
      es: 'Datos de tiempo de espera actualizados en tiempo real directamente desde los sistemas del parque.'
    },
  },
  'crowd-forecast': {
    name: {
      en: 'Crowd Forecast',
      de: 'Crowd-Prognose',
      fr: 'Prévision de fréquentation',
      it: 'Previsione affluenza',
      nl: 'Drukte-prognose',
      es: 'Previsión de afluencia'
    },
    shortDefinition: {
      en: 'AI-based prediction of how busy a theme park will be on a given day.',
      de: 'KI-basierte Vorhersage der Besucherdichte für einen Freizeitpark an einem bestimmten Tag.',
      fr: 'Prédiction basée sur l',
      it: 'Previsione basata sull',
      nl: 'AI-gebaseerde voorspelling van hoe druk een attractiepark op een bepaalde dag zal zijn.',
      es: 'Predicción basada en IA de la afluencia en un parque temático para un día específico.'
    },
  },
  'opening-hours': {
    name: {
      en: 'Opening Hours',
      de: 'Öffnungszeiten',
      it: 'Orari di apertura',
      nl: 'Openingstijden',
      es: 'Horario de apertura'
    },
    shortDefinition: {
      en: 'The official daily schedule showing when a theme park or attraction opens and closes.',
      de: 'Der offizielle Tagesplan mit den Öffnungs- und Schließzeiten eines Freizeitparks oder einer Attraktion.',
      it: 'Il programma giornaliero ufficiale che indica quando un parco a tema o un',
      nl: 'Het officiële dagprogramma dat aangeeft wanneer een pretpark of attractie opent en sluit.',
      es: 'El programa diario oficial que indica cuándo abre y cierra un parque temático o atracción.'
    },
  },
  'wait-time-trend': {
    name: {
      en: 'Wait Time Trend',
      de: 'Trend',
      fr: 'Tendance',
      it: 'Tendenza',
      nl: 'Wachttijdtrend',
      es: 'Tendencia de espera'
    },
    shortDefinition: {
      en: 'The direction of queue length change over the last 30 minutes — shown as rising, falling, or stable.',
      de: 'Die Entwicklungsrichtung der Warteschlangenlänge in den letzten 30 Minuten – steigend, fallend oder stabil.',
      fr: 'La direction de l',
      it: 'La direzione del cambiamento nella lunghezza della coda negli ultimi 30 minuti — in aumento, in calo o stabile.',
      nl: 'De richting van de verandering in wachtrijlengte over de afgelopen 30 minuten — stijgend, dalend of stabiel.',
      es: 'La dirección del cambio en la longitud de la cola durante los últimos 30 minutos — subiendo, bajando o estable.'
    },
  },
  'trackless-ride': {
    name: {
      en: 'Trackless Ride',
      de: 'Trackless Ride',
      fr: 'Trackless Ride',
      it: 'Trackless Ride',
      nl: 'Trackless Ride',
      es: 'Trackless Ride'
    },
    shortDefinition: {
      en: 'A dark ride where vehicles navigate freely without fixed rails, guided by technology embedded in the floor.',
      de: 'Eine Themenfahrt ohne feste Schiene — die Fahrzeuge navigieren frei durch den Raum, geführt von in den Boden eingelassener Technologie.',
      fr: 'Dark ride sans rail fixe — les véhicules naviguent librement guidés par une technologie intégrée au sol.',
      it: 'Dark ride senza rotaie fisse — i veicoli navigano liberamente guidati da tecnologia incorporata nel pavimento.',
      nl: 'Dark ride zonder vaste rails — voertuigen navigeren vrij door de attractieruimte, geleid door in de vloer ingebedde technologie.',
      es: 'Dark ride sin raíles fijos — los vehículos navegan libremente guiados por tecnología integrada en el suelo.'
    },
  }
};
