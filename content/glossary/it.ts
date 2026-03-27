import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Tempo di attesa',
    shortDefinition:
      "Il tempo stimato che un ospite deve trascorrere in fila prima di accedere a un'attrazione.",
    definition:
      "Il tempo di attesa è la durata stimata che un ospite trascorre in coda prima di poter salire su un'attrazione. I parchi mostrano i tempi di attesa agli ingressi delle attrazioni e nelle loro app. park.fan traccia i tempi di attesa in diretta aggiornati ogni minuto.",
    relatedTermIds: ['posted-wait-time', 'virtual-queue', 'single-rider', 'express-pass'],
    aliases: ['Tempi di attesa', 'Tempo di Attesa', 'Fila'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Una corsia separata per gli ospiti disposti a viaggiare da soli per riempire i posti vuoti.',
    definition:
      'La corsia Single Rider permette agli ospiti disposti a viaggiare da soli di occupare i posti vuoti nei veicoli delle attrazioni. Poiché i Single Rider si inseriscono negli spazi liberi, la coda avanza molto più velocemente della fila standard — spesso con tempi di attesa del 50–70% inferiori. Non tutte le attrazioni offrono questa opzione; verificate prima di mettervi in fila.',
    aliases: ['Single Rider', 'Single Rider Lane'],

    relatedTermIds: ['wait-time', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'virtual-queue',
    name: 'Coda virtuale',
    shortDefinition:
      'Un sistema di coda digitale in cui gli ospiti prenotano un orario invece di attendere fisicamente.',
    definition:
      "Una coda virtuale permette agli ospiti di registrarsi per un'attrazione tramite un'app o un chiosco e ricevere una notifica quando si avvicina il loro turno. Invece di fare la coda fisicamente, gli ospiti possono godersi altre aree del parco e tornare quando chiamati.",
    relatedTermIds: ['express-pass', 'wait-time', 'single-rider'],
    aliases: ['Code virtuali'],
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Un upgrade del biglietto a pagamento o incluso che dà accesso a una corsia prioritaria più breve.',
    definition:
      "Un Pass Express (il nome varia per parco — Universal Express, Disney Lightning Lane, ecc.) è un upgrade che consente ai titolari di utilizzare un ingresso prioritario dedicato con attese significativamente più brevi. Usa il calendario dell'affluenza di park.fan per decidere se un Pass Express vale il costo.",
    aliases: ['Flash Pass', 'Express Pass'],

    relatedTermIds: ['virtual-queue', 'single-rider', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: 'Tempo segnalato',
    shortDefinition:
      "Il tempo di attesa ufficiale mostrato dal parco all'ingresso di un'attrazione.",
    definition:
      "Il tempo segnalato è la stima ufficiale visualizzata sui cartelli all'ingresso fisico di un'attrazione e/o nell'app ufficiale del parco. park.fan aggrega i tempi di attesa segnalati da fonti ufficiali ogni minuto.",
    relatedTermIds: ['wait-time', 'crowd-level'],
  },
  {
    id: 'crowd-level',
    name: 'Livello di affluenza',
    shortDefinition:
      'Una misura di quanto è affollato un parco a tema in un dato giorno, da Molto Basso a Estremo.',
    definition:
      "Il livello di affluenza descrive la densità complessiva dei visitatori in un parco in un dato giorno o momento. park.fan utilizza una scala da Molto Basso a Estremo basata sui dati storici dei tempi di attesa, l'occupazione attuale e le previsioni IA.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Livelli di affluenza'],
  },
  {
    id: 'crowd-calendar',
    name: "Calendario dell'affluenza",
    shortDefinition:
      'Una previsione giorno per giorno dei livelli di affluenza previsti per pianificare la visita.',
    definition:
      "Un calendario dell'affluenza è un calendario mensile o annuale che mostra i livelli di affluenza previsti per ogni giorno. park.fan genera calendari dell'affluenza utilizzando modelli IA addestrati su anni di dati storici sui tempi di attesa, combinati con i calendari scolastici, gli eventi imminenti e i trend stagionali.",
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Giorno di punta',
    shortDefinition:
      'Un giorno con il massimo numero di visitatori, tipicamente durante festività o eventi speciali.',
    definition:
      "Un giorno di punta è qualsiasi giorno in cui la frequenza è al massimo o vicina alla capacità massima del parco. I giorni di punta comuni includono i grandi giorni festivi (Natale, Pasqua, vacanze estive), le giornate di eventi speciali e le settimane di vacanze scolastiche. park.fan evidenzia i giorni di punta nel calendario dell'affluenza.",
    aliases: ['Giorno di Punta', 'Alta Stagione', 'Giornata Affollata'],

    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Ristrutturazione',
    shortDefinition:
      "Un periodo di chiusura pianificata durante il quale un'attrazione viene sottoposta a manutenzione o miglioramenti.",
    definition:
      "Una ristrutturazione è un periodo di manutenzione o rinnovo programmato durante il quale un'attrazione, uno spettacolo o un'area del parco è temporaneamente chiusa. Le ristrutturazioni possono durare da pochi giorni a diversi mesi. park.fan indica le attrazioni in ristrutturazione per includerle nella pianificazione.",
    aliases: ['Ristrutturazione', 'Manutenzione', 'Refurb', 'Rehab'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Tempo fermo',
    shortDefinition:
      "Una chiusura temporanea non pianificata di un'attrazione, spesso dovuta a un guasto tecnico.",
    definition:
      "Il tempo fermo si riferisce a una chiusura temporanea non programmata di un'attrazione — distinta da una ristrutturazione pianificata. I tempi fermi sono causati da malfunzionamenti tecnici, controlli di sicurezza, incidenti o condizioni meteorologiche avverse. park.fan mostra lo stato operativo attuale di ogni attrazione tracciata in tempo reale.",
    aliases: ['Guasto', 'Fuori Servizio', 'Problema Tecnico'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: "Capacità dell'attrazione",
    shortDefinition: "Il numero di ospiti che un'attrazione può ospitare per ora.",
    definition:
      "La capacità di un'attrazione è il numero massimo di ospiti che può trasportare per ora in condizioni operative ottimali. La capacità dipende dalla dimensione del veicolo, dal numero di veicoli in funzione, dalla velocità di carico e scarico e dal tempo del ciclo. La capacità determina direttamente la velocità di avanzamento della coda.",
    relatedTermIds: ['wait-time', 'downtime', 'refurbishment'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Il momento in cui un parco apre ufficialmente i suoi cancelli e le code per le attrazioni popolari sono più brevi.',
    definition:
      'Il Rope Drop si riferisce al momento in cui un parco a tema apre per la giornata — il nome deriva dalla corda (o barriera) che il personale abbassa per consentire ai primi ospiti di entrare. Arrivare al Rope Drop è una strategia popolare perché le attrazioni popolari hanno le code più brevi al mattino, prima che le folle si radunino. Il calendario di park.fan mostra gli orari di apertura esatti per pianificare la vostra strategia.',
    aliases: ['Rope Drop'],

    relatedTermIds: ['crowd-calendar', 'wait-time', 'crowd-level'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      "Un vantaggio esclusivo che consente agli ospiti degli hotel del resort di entrare nel parco prima dell'apertura generale.",
    definition:
      "L'Early Entry (chiamato anche Extra Magic Hours o Early Park Entry) permette agli ospiti degli hotel partner di accedere al parco 30–60 minuti prima del pubblico generale. Durante questa finestra, le code alle attrazioni più popolari sono notevolmente più brevi. Nei giorni di punta, combinare l'Early Entry con un piano di visita strategico consente di vivere più attrazioni principali con attese minime.",
    aliases: ['Ingresso Anticipato', 'Extra Magic Hours', 'Accesso Anticipato'],

    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un supplemento al biglietto che consente di visitare più parchi dello stesso resort nello stesso giorno.',
    definition:
      "Un biglietto Park Hopper permette di accedere a due o più parchi gestiti dallo stesso resort in una singola giornata. L'opzione Park Hopper di Disney, ad esempio, consente di spostarsi tra Magic Kingdom, EPCOT, Hollywood Studios e Animal Kingdom dopo le 14:00. È particolarmente utile quando attrazioni o esperienze specifiche sono distribuite su più parchi.",
    aliases: ['Park Hopper', 'Park Hopping'],

    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Abbonamento annuale',
    shortDefinition: 'Un biglietto annuale che consente visite illimitate al parco per 12 mesi.',
    definition:
      "Un abbonamento annuale (Annual Pass) garantisce ingressi illimitati a uno o più parchi per un periodo di 12 mesi. I livelli superiori spesso includono vantaggi come sconti sulla ristorazione, parcheggio gratuito e sconti sul merchandising. Alcuni abbonamenti prevedono date di esclusione (blockout dates) nei giorni di punta. Per i visitatori abituali — generalmente tre o più visite all'anno — l'abbonamento è quasi sempre più conveniente dei biglietti singoli.",
    aliases: ['Annual Pass', 'Season Pass', 'Abbonamento Annuale', 'Tessera Annuale'],

    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Altezza minima',
    shortDefinition:
      "Un'altezza minima che gli ospiti devono raggiungere per accedere a un'attrazione specifica.",
    definition:
      "L'altezza minima è una regola di sicurezza stabilita dai parchi per garantire che i sistemi di ritenuta — barre di sicurezza, spallacci, cinture — funzionino correttamente per ogni passeggero. Varia generalmente tra 90 e 140 cm a seconda dell'intensità dell'attrazione. Alcune attrazioni hanno anche un'altezza o un peso massimo. Verificate sempre i requisiti di altezza prima di visitare con bambini piccoli.",
    aliases: ['Altezza Minima', 'Requisito di Altezza', 'Limite di Altezza'],

    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Area tematica',
    shortDefinition:
      "Una zona autonoma all'interno di un parco a tema costruita attorno a un tema coerente.",
    definition:
      "Un'area tematica è una zona distinta di un parco a tema che combina un design visivo unificato, una storia di sfondo e attrazioni, ristoranti e negozi a tema. Esempi celebri includono Il Mondo Magico di Harry Potter agli Universal Studios, Star Wars: Galaxy's Edge nei parchi Disney e Skandinavien a Europa-Park. Le aree tematiche creano un'esperienza immersiva e sono spesso le zone più fotografate del parco.",
    aliases: ['Area Tematica', 'Zona Tematica', 'Land'],

    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      "L'apertura non ufficiale di un'attrazione prima della data di lancio annunciata.",
    definition:
      'Un Soft Opening avviene quando un parco apre silenziosamente una nuova attrazione o area prima della data ufficiale — spesso senza alcun annuncio. I parchi utilizzano i Soft Opening per testare i sistemi in condizioni reali, individuare problemi operativi e ottimizzare le procedure di imbarco. Poiché possono iniziare e interrompersi senza preavviso, rappresentano un bonus per i visitatori fortunati che si trovano nel parco, ma non una base affidabile per la pianificazione. Forum e social media di solito sono i primi a segnalarli.',
    aliases: ['Soft Launch', 'Soft Opening'],

    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      "La fila d'attesa classica di un'attrazione, senza prenotazione né pass speciale.",
    definition:
      "La coda Standby è la normale fila d'attesa fisica accessibile a tutti gli ospiti senza biglietto aggiuntivo o upgrade. Chi si mette in Standby aspetta in ordine di arrivo — il tempo indicato riflette direttamente l'affluenza attuale all'attrazione. Nei giorni più affollati, i tempi di Standby per le attrazioni principali possono superare i 90 minuti. park.fan traccia i tempi Standby in tempo reale per aiutarvi a trovare sempre la fila più breve.",
    aliases: ['Standby', 'Fila Normale', 'Fila Standard'],

    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Il sistema di accesso prioritario a pagamento di Disney, successore del programma FastPass+.',
    definition:
      "Lightning Lane è il nome dato da Disney al suo sistema di coda prioritaria, introdotto nel 2021 come successore del gratuito FastPass+. Esiste in due formule: Individual Lightning Lane (ILL), venduta separatamente per le attrazioni più richieste, e Lightning Lane Multi Pass (LLMP), un abbonamento giornaliero che consente di prenotare fasce orarie di ritorno su una selezione di attrazioni. La Lightning Lane ha generato ampio dibattito nella comunità perché ha trasformato un vantaggio prima gratuito in un servizio a pagamento. Il calendario dell'affluenza di park.fan vi aiuta a valutare in quali giorni la Lightning Lane vale il costo.",
    aliases: ['LLMP', 'ILL', 'Lightning Lane Multi Pass', 'Individual Lightning Lane'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Il precedente abbonamento giornaliero di Disney che forniva accesso alla Lightning Lane Multi Pass sulla maggior parte delle attrazioni.',
    definition:
      "Genie+ (ora rinominato Lightning Lane Multi Pass) era l'add-on giornaliero a pagamento di Disney che ha sostituito FastPass+. Con una tariffa per persona al giorno, gli ospiti potevano prenotare un posto Lightning Lane alla volta su un'ampia selezione di attrazioni. Le attrazioni di punta erano escluse e vendute separatamente come Individual Lightning Lane. Il prezzo di Genie+ era dinamico e aumentava nei giorni più affollati. park.fan traccia i livelli di affluenza in dettaglio per aiutarvi a decidere se l'abbonamento vale la pena.",
    aliases: ['Genie Plus', 'Disney Genie'],

    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      "Un numero di allocazione nel sistema di coda virtuale che consente l'accesso a un'attrazione quando il gruppo viene chiamato.",
    definition:
      "Un Boarding Group è un'allocazione numerata all'interno di un sistema di coda virtuale, utilizzato principalmente per le attrazioni più richieste dove una coda fisica sarebbe impraticabile. Gli ospiti si registrano tramite l'app del parco — spesso all'apertura — e ricevono un numero di gruppo. Quando quel numero viene chiamato, hanno una finestra limitata per presentarsi all'attrazione. Nei giorni molto affollati, tutti i Boarding Group possono esaurirsi in pochi minuti. Il sistema di Disney su attrazioni come Tron Lightcycle Run e Star Wars: Rise of the Resistance ha reso questo concetto noto in tutta la comunità dei parchi.",
    aliases: ['Boarding Groups', 'Boarding Group'],

    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Fuori stagione',
    shortDefinition:
      "Periodi di minore affluenza che offrono code più brevi, prezzi più bassi e un'esperienza più rilassata.",
    definition:
      "Il periodo fuori stagione corrisponde ai momenti più tranquilli del calendario, quando le scuole sono aperte e non cadono grandi festività — tipicamente da gennaio a inizio febbraio, da metà settembre a ottobre (esclusi gli eventi Halloween) e le prime settimane di novembre. In questi periodi, i tempi di attesa per le attrazioni popolari possono essere notevolmente più brevi, i prezzi dei biglietti spesso ai minimi e i parchi molto meno affollati. Per i visitatori con orari flessibili, scegliere il fuori stagione è una delle strategie più efficaci. Il calendario dell'affluenza di park.fan evidenzia queste finestre per aiutarvi a pianificare.",
    aliases: ['Bassa Stagione', 'Fuori Stagione', 'Periodo Tranquillo'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'offseason',
    name: 'Chiusura stagionale',
    shortDefinition:
      'Periodo di chiusura stagionale in cui il parco è completamente chiuso al pubblico per manutenzione, lavori o pausa invernale.',
    definition:
      "La chiusura stagionale (o OffSeason) è il periodo in cui un parco a tema chiude completamente i battenti — non una semplice fase di minor affluenza, ma un vero e proprio fermo operativo. I parchi sfruttano questa finestra per effettuare la manutenzione essenziale su attrazioni e impianti, avviare importanti lavori di ristrutturazione impossibili durante l'esercizio e consentire al personale un periodo di riposo prima della nuova stagione. Le chiusure stagionali avvengono più spesso nei mesi invernali e durano da qualche settimana a diversi mesi a seconda del parco e del clima. In questo periodo non sono accessibili attrazioni, ristoranti o spettacoli.\n\nQuando park.fan mostra lo stato OffSeason per un parco, significa che non è disponibile alcun calendario operativo per il periodo corrente e che la prossima data di apertura confermata è ancora a qualche settimana. Controlla il sito ufficiale del parco per la data esatta di riapertura — i parchi più popolari esauriscono spesso i biglietti dei primi giorni di riapertura molto rapidamente.",
    aliases: ['Chiusura Invernale', 'Off-Season', 'Fuori Stagione'],

    relatedTermIds: ['refurbishment', 'soft-opening', 'crowd-calendar'],
  },
  {
    id: 'ride-photo',
    name: 'Foto di bordo',
    shortDefinition:
      "Una foto o video catturati automaticamente durante un'attrazione, disponibili per l'acquisto dopo il giro.",
    definition:
      "La foto di bordo è un'immagine scattata automaticamente da una telecamera fissa in un momento chiave dell'attrazione — tipicamente la discesa di un'attrazione acquatica o il punto più alto di una montagna russa. Dopo il giro, gli ospiti possono vedere la loro foto a un chiosco o nell'app del parco e scegliere se acquistarla. Molti parchi offrono pacchetti foto giornalieri che includono tutte le foto di bordo del resort. La foto di bordo è un souvenir amato e un classico momento da condividere sui social.",
    aliases: ["Foto dell'Attrazione", 'Foto On-Ride'],

    relatedTermIds: ['themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Coda',
    shortDefinition:
      "L'area d'attesa fisica che gli ospiti percorrono prima di salire su un'attrazione, spesso tematizzata come parte dell'esperienza.",
    definition:
      "La coda è lo spazio fisico — corridoi, serpentine all'aperto o sale interne — che gli ospiti attraversano aspettando di imbarcarsi su un'attrazione. Nei parchi moderni, la coda è spesso parte dell'esperienza stessa: la coda della Haunted Mansion di Disney crea atmosfera ancora prima di salire sul Doom Buggy, mentre le attrazioni di Harry Potter a Universal immergono i visitatori nel loro mondo fin dalla fila. Una coda ben progettata rende l'attesa molto più piacevole, anche quando è lunga.",
    relatedTermIds: ['wait-time', 'standby-queue', 'single-rider'],
    aliases: ['Code', 'Fila', 'File'],
  },
  {
    id: 'opening-day',
    name: "Giorno dell'inaugurazione",
    shortDefinition: 'La data ufficiale di apertura di un nuovo parco, area tematica o attrazione.',
    definition:
      "Il giorno dell'inaugurazione è la data ufficialmente annunciata in cui un nuovo parco, un'espansione o un'attrazione apre al grande pubblico per la prima volta. Questi giorni sono eventi importanti nella comunità dei parchi a tema: attirano grande attenzione mediatica, lunghe code e un'atmosfera festosa. I parchi organizzano spesso cerimonie di inaugurazione con spettacoli speciali e apparizioni di personaggi. Poiché il giorno dell'inaugurazione attira molti visitatori, raramente è il momento migliore per scoprire una nuova attrazione con tempi di attesa brevi. I Soft Opening precedono talvolta la data ufficiale.",
    relatedTermIds: ['soft-opening', 'rope-drop', 'crowd-level'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      "Un sistema che consente agli accompagnatori di alternare il giro mentre l'altro aspetta con bambini che non soddisfano il requisito di altezza.",
    definition:
      "Il Rider Switch (detto anche Child Swap) è un sistema disponibile nella maggior parte dei grandi parchi a tema che consente a un gruppo di alternarsi su un'attrazione quando un membro — tipicamente un bambino che non raggiunge l'altezza minima — non può partecipare. Un adulto sale sull'attrazione mentre l'altro aspetta all'ingresso con il bambino; al ritorno del primo adulto, il secondo può imbarcarsi immediatamente senza rimettersi in coda. Ai parchi Disney il sistema si chiama Rider Switch; agli Universal si chiama Child Swap. Nei giorni affollati, il secondo adulto salta di fatto l'intera attesa in coda — un vantaggio significativo. Chiedete agli operatori all'ingresso per attivarlo.",
    aliases: ['Child Swap', 'Rider Switch', 'Cambio Genitore'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      "Una data in cui certi livelli di abbonamento annuale non sono validi per l'ingresso al parco, tipicamente nei giorni più affollati dell'anno.",
    definition:
      "Le Blockout Date (dette anche blackout date) sono giorni specifici del calendario in cui certi livelli di abbonamento annuale non sono validi per l'ingresso. I parchi implementano queste date per gestire la capacità nei giorni più affollati — festività, weekend di punta ed eventi speciali. Gli abbonamenti di livello superiore hanno meno o nessuna Blockout Date, mentre gli abbonamenti base possono essere bloccati su 30–60 giorni all'anno. Verificate sempre il calendario delle Blockout Date prima di visitare se possedete un abbonamento con restrizioni. Il calendario dell'affluenza di park.fan evidenzia i periodi di punta così potete incrociare le informazioni con le restrizioni del vostro abbonamento.",
    aliases: ['Giorno Bloccato', 'Giorni Bloccati', 'Blackout Date'],

    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento a biglietto separato',
    shortDefinition:
      "Un evento serale o speciale con biglietto dedicato che richiede un'ammissione separata dal normale biglietto del parco, come le feste di Halloween o Natale.",
    definition:
      "Un evento a biglietto separato (hard ticket event) è un evento — tipicamente serale — organizzato in un parco a tema che richiede un biglietto dedicato oltre all'ammissione ordinaria. Questi eventi offrono intrattenimento esclusivo, decorazioni tematiche e incontri con i personaggi non disponibili durante gli orari normali. Esempi celebri includono Mickey's Not-So-Scary Halloween Party e Mickey's Very Merry Christmas Party a Walt Disney World, Halloween Horror Nights agli Universal Studios e gli eventi stagionali a Disneyland Paris. Nei giorni degli eventi, gli ospiti normali vengono solitamente invitati a lasciare il parco entro le 18:00–19:00. I biglietti si esauriscono spesso con settimane di anticipo.",
    aliases: ['Evento Speciale', 'Serata Speciale', 'After-Hours'],

    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "L'ex sistema di coda prioritaria gratuita di Disney, sostituito dal Lightning Lane a pagamento nel 2021.",
    definition:
      "FastPass+ (originariamente FastPass, introdotto nel 1999) era il sistema di coda prioritaria gratuita di Disney che consentiva agli ospiti di prenotare finestre orarie di ritorno per le attrazioni senza costi aggiuntivi. A Walt Disney World, gli ospiti potevano prenotare fino a tre prenotazioni FastPass+ al giorno tramite l'app My Disney Experience. Il sistema fu sospeso durante la chiusura per COVID-19 nel 2020 e mai ripristinato — sostituito dal sistema Lightning Lane a pagamento alla fine del 2021. FastPass+ rimane uno dei cambiamenti più discussi nella storia Disney perché ha trasformato un vantaggio gratuito in un servizio a pagamento. Comprendere il vecchio sistema è utile per leggere i resoconti di viaggio più datati.",
    aliases: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['lightning-lane', 'genie-plus', 'express-pass', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Orario di ritorno',
    shortDefinition:
      "Una finestra oraria prenotata per tornare a un'attrazione, emessa da Lightning Lane, dalla coda virtuale o da sistemi simili di accesso prioritario.",
    definition:
      "Un orario di ritorno (return time) è un periodo specifico — tipicamente un blocco di un'ora — durante il quale un ospite che ha prenotato l'accesso prioritario (tramite Lightning Lane, coda virtuale o sistema simile) può presentarsi all'ingresso dedicato dell'attrazione. Gli orari di ritorno consentono agli ospiti di esplorare altre parti del parco nell'intervallo invece di stare in coda fisica. Perdere la propria finestra oraria (di solito definita come un ritardo superiore a un certo numero di minuti) comporta in genere la perdita della prenotazione. I dati sui tempi di attesa e i livelli di affluenza di park.fan possono aiutarvi a decidere quali attrazioni prioritizzare per la prenotazione dell'orario di ritorno.",
    relatedTermIds: ['lightning-lane', 'virtual-queue', 'fastpass', 'boarding-group'],
    aliases: ['Orari di ritorno', 'Ora di ritorno', 'Ore di ritorno'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      "Exclusive Ride Time — una sessione in cui un gruppo di appassionati o ospiti dell'hotel ha accesso esclusivo a una o più attrazioni senza la coda del pubblico generale.",
    definition:
      "ERT (Exclusive Ride Time) è un periodo durante il quale un gruppo selezionato — tipicamente membri di un club di appassionati di montagne russe, ospiti degli hotel del resort o possessori di abbonamento annuale — ha accesso esclusivo a un'attrazione o a un set di attrazioni senza il pubblico generale. Durante l'ERT, i partecipanti possono salire ripetutamente con attese minime, raggiungendo spesso decine di giri in una singola sessione. Gli eventi ERT sono organizzati dai parchi per raduni di club speciali (come l'European Coaster Club o gli incontri dell'American Coaster Enthusiasts), per pacchetti hotel premium o come parte di eventi after-hours. Per gli appassionati, l'ERT è una delle esperienze più preziose nei parchi — rivela il vero carattere di un'attrazione senza la pressione della coda.",
    aliases: ['Exclusive Ride Time', 'ERT'],

    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario dettagliato e ottimizzato per una visita al parco a tema che sequenzia le attrazioni per minimizzare i tempi di attesa e massimizzare il numero di giri in un giorno.',
    definition:
      "Un Touring Plan è una sequenza pre-pianificata di attrazioni, orari dei pasti e spostamenti nel parco progettata per minimizzare il tempo totale di attesa nell'arco della giornata. I Touring Plan efficaci tengono conto dei modelli di affluenza (quali aree del parco si riempiono prima), delle capacità delle attrazioni, delle dinamiche delle code, degli orari degli spettacoli e del meteo. Siti come TouringPlans.com (ora Thrill-Data) pubblicano piani dettagliati basati sulla folla per i parchi principali. I tempi di attesa in diretta e il calendario dell'affluenza di park.fan sono strumenti complementari: controllare i dati in tempo reale durante la giornata consente aggiustamenti al volo al vostro piano. Nei giorni affollati, un buon Touring Plan può ridurre il tempo totale in coda del 30–50% rispetto a un approccio spontaneo.",
    aliases: ['Touring Plan', 'Piano di Visita', 'Itinerario'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      "Un'attrazione al coperto in cui i visitatori viaggiano su veicoli guidati attraverso scene illuminate e ambienti tematizzati.",
    definition:
      "Un dark ride è un'attrazione al chiuso in cui gli ospiti viaggiano su veicoli — vagoni su rotaia, piattaforme girevoli, barche o sistemi a guida automatica — attraverso una serie di scene illuminate e ambienti tematizzati. Il termine 'dark' (buio) si riferisce all'ambiente tipicamente oscurato che amplifica gli effetti visivi, le proiezioni e l'illuminazione scenografica. I dark ride spaziano dalle esperienze per famiglie (come Pinocchio ai parchi Disney) ai thriller ad alta intensità (come Hagrid's Magical Creatures Motorbike Adventure a Universal). Sono tra le attrazioni con la maggiore capacità oraria nei parchi moderni, il che li rende punti di riferimento centrali in qualsiasi Touring Plan.",
    aliases: ['Dark Ride', 'Dark Rides', 'Attrazione al Coperto'],

    relatedTermIds: ['themed-land', 'ride-capacity', 'queue-line'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      "Bolliger & Mabillard, un costruttore svizzero di montagne russe noto per giri fluidi, affidabili e con elementi firma come l'Immelmann, il Cobra Roll e lo Zero-g Roll.",
    definition:
      "B&M (Bolliger & Mabillard) è un costruttore svizzero di montagne russe fondato nel 1988 da Walter Bolliger e Claude Mabillard. L'azienda è rinomata per produrre giri eccezionalmente fluidi e affidabili con un'esperienza caratterizzata da G-force positive, inversioni firma (Immelmann, Cobra Roll, Zero-g Roll) e ottima capacità. B&M è specializzata in coaster invertiti, looper, hyper coaster (oltre 60 m), giga coaster (oltre 91 m), wing coaster e dive machine. Quasi ogni grande parco europeo presenta almeno un'installazione B&M, tra cui Shambhala e Dragon Khan a PortAventura, Silver Star a Europa-Park, Nemesis ad Alton Towers e Goliath a Walibi Holland.",
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: ['immelmann', 'cobra-roll', 'zero-g-roll', 'dive-coaster', 'hybrid-coaster'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "Un costruttore svizzero di giostre e montagne russe noto per i lanci idraulici da record, i mega/giga coaster e i design innovativi — l'azienda dietro alcune delle giostre più veloci e alte del mondo.",
    definition:
      "Intamin AG è un costruttore svizzero di giostre fondato nel 1967, responsabile di alcuni dei record più ambiziosi nella storia delle montagne russe. Il loro sistema di lancio idraulico ha alimentato per anni i coaster più veloci e alti del mondo (Kingda Ka, 139 m; Top Thrill Dragster). Intamin è nota anche per i suoi mega e giga coaster (tra cui Millennium Force a Cedar Point e Intimidator 305 a Kings Dominion), i multi-launch coaster, le attrazioni acquatiche e i dark ride. I loro design sono spesso all'avanguardia in termini di scala e innovazione. Le installazioni europee di Intamin includono Taron e Black Mamba a Phantasialand e Red Force a Ferrari Land.",
    relatedTermIds: ['launch-coaster', 'top-hat', 'b-and-m', 'mack-rides'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Un costruttore tedesco a conduzione familiare di Waldkirch vicino a Europa-Park, che produce attrazioni acquatiche, dark ride e montagne russe in acciaio sempre più ambiziose.',
    definition:
      "Mack Rides è un costruttore di giostre tedesco con sede a Waldkirch, nel Baden-Württemberg — a pochi chilometri da Europa-Park, la vetrina di punta dell'azienda. Fondato nel 1921, Mack produce attrazioni acquatiche, dark ride (tra cui Test Track e Radiator Springs Racers di Disney) e un portafoglio in crescita di coaster ad alta adrenalina. Il loro Blue Fire Megacoaster a Europa-Park (2009) è stato il primo giro a includere l'elemento Stengel Dive. I più recenti hyper coaster di Mack (Ride to Happiness a Plopsaland, Kondaa a Walibi Belgium) hanno ricevuto ampi consensi dalla comunità degli appassionati. Mack Rides è una presenza fondamentale nei parchi europei, in particolare nel proprio Europa-Park.",
    aliases: ['Mack'],

    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      "Rocky Mountain Construction, un costruttore dell'Idaho che ha inventato il concetto di coaster ibrido convertendo le vecchie montagne russe in legno su binari in acciaio I-box, offrendo airtime e inversioni senza precedenti.",
    definition:
      'Rocky Mountain Construction (RMC) è un costruttore americano di montagne russe con sede a Hayden, Idaho, noto soprattutto per aver inventato il sistema di binari in acciaio I-box che può essere applicato sulle strutture in legno delle montagne russe esistenti. Questa tecnologia di conversione ha permesso ai parchi di trasformare i vecchi coaster in legno consumati in giri ibridi di livello mondiale con airtime intenso, multiple inversioni e discese oltre la verticale. Le conversioni RMC come Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) e Wildfire (Kolmården) sono rapidamente diventate le preferite degli appassionati. In Europa, il nuovo coaster ibrido RMC Untamed a Walibi Holland è ampiamente considerato uno dei migliori del continente.',
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      "Produttore olandese di montagne russe e uno dei più prolifici al mondo, noto per l'onnipresente Boomerang e per un'ampia gamma di coaster familiari e adrenalinici presenti nei parchi europei.",
    definition:
      "Vekoma Rides Manufacturing è un produttore olandese di montagne russe con sede a Vlodrop, nei Paesi Bassi, uno dei produttori più prolifici al mondo per numero di installazioni totali. Fondata nel 1926 come azienda di ingegneria meccanica, Vekoma si è orientata verso le attrazioni nel 1970 e ha acquisito notorietà mondiale con il suo Boomerang — un compatto shuttle coaster con tre inversioni, concesso in licenza a basso costo e installato in parchi di tutto il mondo. Altri modelli iconici includono il Suspended Looping Coaster (SLC), il Giant Inverted Boomerang e il Mine Train. A partire dagli anni 2010, Vekoma si è reinventata con una moderna linea 'nuova generazione' che offre sistemi di guida più fluidi, layout innovativi e migliorate attrazioni familiari. I nuovi modelli come il Family Boomerang, il Tilt Coaster e i coaster familiari sospesi compaiono sempre più nei parchi europei. Anche Disney ha commissionato design Vekoma personalizzati per i propri resort.",
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Produttore tedesco noto soprattutto per il modello Euro-Fighter con il suo drop oltre la verticale, nonché per spinning coaster e compatte attrazioni familiari.',
    definition:
      "Gerstlauer Amusement Rides GmbH è un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera. Fondata nel 1946 come azienda di lavorazione dei metalli, si è avventurata nel mercato delle attrazioni negli anni '80 e ha costruito la propria reputazione mondiale con il modello Euro-Fighter — un compatto coaster a lancio elettrico famoso per il suo drop iniziale oltre la verticale (97 gradi). Gli Euro-Fighter possono essere installati in spazi ristretti, rendendoli attraenti per parchi urbani e siti più piccoli; esempi includono Rage all'Adventure Island e Speed all'Oakwood. Gerstlauer produce anche il modello Infinity Coaster, spinning coaster e lo SkyRoller, un coaster rotante dove i passeggeri controllano il proprio capovolgimento. Nella comunità degli appassionati, le montagne russe Gerstlauer sono apprezzate per la loro intensità nonostante il piccolo ingombro.",
    aliases: ['Gerstlauer Rides'],

    relatedTermIds: ['euro-fighter', 'spinning-coaster', 'xtreme-spinning-coaster', 'b-and-m', 'intamin'],
  },
  {
    id: 'schwarzkopf',
    name: 'Schwarzkopf',
    shortDefinition:
      "Leggendario produttore tedesco i cui classici looping coaster degli anni '70 e '80 sono ancora amati nei parchi europei per la loro intensa e morbidissima esperienza di guida.",
    definition:
      "Anton Schwarzkopf GmbH & Co. KG era un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera — la stessa città dove si insediò in seguito Gerstlauer. Fondata da Anton Schwarzkopf nel 1954, l'azienda è stata determinante nel portare i looping coaster in Europa. La Revolution al Six Flags Magic Mountain (1976) era il primo looping coaster moderno del mondo, progettato da Schwarzkopf. I modelli iconici includono il Looping Star, il Thriller/Wildcat e il trasportabile Looping Coaster, che ha girato per tutta Europa. Le montagne russe Schwarzkopf sono rinomate per le loro corse morbidissime e l'elegante efficienza dei layout — frutto della precisa ingegneria di Schwarzkopf. L'azienda è fallita nel 1983, ma molte installazioni sono rimaste operative per decenni, custodite da parchi e appassionati come classici insostituibili. La manutenzione è ora gestita da aziende specializzate o da Gerstlauer, che ha acquisito alcuni strumenti.",
    relatedTermIds: ['b-and-m', 'intamin', 'gerstlauer', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Un coaster che accelera gli ospiti da 0 ad alta velocità tramite un sistema di lancio magnetico, idraulico o pneumatico invece della tradizionale catena di risalita.',
    definition:
      "Un Launch Coaster sostituisce la tradizionale catena di risalita con un sistema di propulsione che accelera rapidamente il treno da ferma all'alta velocità in pochi secondi. Le tecnologie principali sono: lanci LSM (motore sincrono lineare) — bobine elettromagnetiche accelerano una pinna sul treno; LIM (motore a induzione lineare) — simile ma meno efficiente; lanci idraulici — un sistema a cavo e pistone usato da Intamin sui coaster da record come Kingda Ka; e lanci ad aria compressa. Alcuni coaster presentano più lanci durante il percorso. L'accelerazione improvvisa e potente è una sensazione distintiva che non può essere replicata da una catena di risalita.",
    aliases: ['LSM Coaster', 'LIM Coaster', 'Coaster a Lancio'],

    relatedTermIds: ['lifthill', 'top-hat', 'intamin', 'horseshoe'],
  },
  {
    id: 'wooden-coaster',
    name: 'Ottovolante in legno',
    shortDefinition:
      "Una montagna russa costruita principalmente in legno, caratterizzata dal suo caratteristico fragore, dal movimento laterale e dall'airtime imprevedibile.",
    definition:
      "Un ottovolante in legno è un giro costruito con binari e struttura portante in legno. A differenza dei coaster in acciaio, il legno ha una flessione naturale che crea il caratteristico fragore, lo scuotimento laterale e l'airtime imprevedibile amato dagli appassionati. Famosi ottovolanti in legno includono Balder a Liseberg, The Beast a Kings Island e Megafobia a Oakwood. Gli ottovolanti in legno richiedono una manutenzione costante — il binario deve essere rilaminato regolarmente — e sono suscettibili ai cambiamenti climatici. Il processo di conversione RMC (Rocky Mountain Construction) può trasformare i vecchi ottovolanti in coaster ibridi con binario in acciaio mantenendo la struttura in legno.",
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
    aliases: ['Woodies', 'Legno', 'Woodie'],
  },
  {
    id: 'steel-coaster',
    name: 'Montagna russa in acciaio',
    shortDefinition:
      'Una montagna russa costruita principalmente con binario e struttura in acciaio, nota per la sua corsa liscia e precisa.',
    definition:
      "Una montagna russa in acciaio è costruita con binario tubolare o piatto in acciaio supportato da un'armatura in acciaio. A differenza delle montagne russe in legno con la loro flessibilità naturale, l'acciaio offre ai progettisti un controllo preciso delle forze G, delle transizioni e delle inversioni. La corsa liscia e prevedibile di una montagna russa in acciaio consente di creare layout complessi con molteplici inversioni, curve strette e sezioni ad alta velocità.\n\nLe montagne russe in acciaio dominano lo sviluppo moderno dei coaster. Gli esempi più celebri in Europa includono Shambhala a PortAventura, Nemesis ad Alton Towers e Silver Star a Europa-Park. Le montagne russe in acciaio spaziano da piccole attrazioni familiari a mega coaster record-holder. La precisione dell'acciaio richiede ispezione e manutenzione regolari, ma offre meno margini di errore di progettazione rispetto alla flessibilità del legno.",
    relatedTermIds: ['wooden-coaster', 'inversion', 'launch-coaster', 'hyper-coaster'],
    aliases: ['Montagne russe in acciaio', 'Acciaio'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      "Un coaster dove il treno è sospeso sotto il binario su un perno, consentendo al veicolo di oscillare liberamente da un lato all'altro.",
    definition:
      "Un suspended coaster è un tipo di coaster specializzato dove il treno è sospeso dall'alto su un punto di perno, consentendogli di oscillare liberamente da un lato all'altro indipendentemente dal percorso del binario. Mentre il treno naviga nelle curve, oscilla come un pendolo — un movimento che crea la caratteristica sensazione di 'frusta' e aggiunge un elemento imprevedibile all'esperienza. Questo movimento oscillante è distinto da un inverted coaster, dove il treno è rigidamente attaccato al di sopra del binario.\n\nI suspended coaster sono meno comuni dei coaster invertiti ma offrono un'esperienza unica. Il movimento oscillante rende anche le curve moderate drammatiche, e la sensazione di 'volare' con il terreno lontano crea un'esposizione emozionante. Vekoma ha sviluppato il modello Suspended Looping Coaster (SLC) negli anni '90, e centinaia sono stati costruiti in tutto il mondo. Il movimento oscillante può sembrare caotico rispetto alla precisione delle inversioni moderne, rendendo i suspended coaster amati per la loro natura grezza e imprevedibile.",
    relatedTermIds: ['inverted-coaster', 'b-and-m', 'vekoma'],
    aliases: ['Suspended', 'Oscillante'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster ibrido',
    shortDefinition:
      'Un coaster che combina una struttura portante in legno tradizionale con un binario I-box in acciaio, pionieristicamente sviluppato da Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster ibrido abbina la struttura in legno di un coaster tradizionale con un binario I-box in acciaio prodotto da Rocky Mountain Construction (RMC). Il binario I-box è estremamente preciso e liscio, consentendo elementi di inversione impossibili su binari in legno tradizionali. RMC ha sviluppato questa tecnologia principalmente per rinnovare i vecchi ottovolanti in legno — aggiungendo inversioni, discese più ripide e airtime hill a layout precedentemente troppo bruschi. Famosi ibridi RMC includono Steel Vengeance a Cedar Point (spesso citato come il miglior coaster al mondo), Twisted Colossus a Six Flags Magic Mountain e Wildfire a Kolmården. Nuovi costruzioni RMC (come Untamed a Walibi Holland) esistono ora affianco alle conversioni.',
    aliases: ['Hybrid', 'I-Box Coaster', 'RMC Hybrid'],

    relatedTermIds: ['wooden-coaster', 'rmc', 'airtime'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      "Un modello di coaster compatto Vekoma che porta i visitatori attraverso tre inversioni due volte — prima in avanti, poi all'indietro — in un layout a vai e vieni.",
    definition:
      "Il Boomerang è uno dei modelli di montagna russa più costruiti nella storia, prodotto da Vekoma. Il layout include tre inversioni — un looping verticale affiancato da due elementi Sidewinder — percorse prima in avanti, poi in senso inverso dopo che il treno viene tirato su una seconda sezione inclinata e rilasciato di nuovo attraverso gli stessi elementi. Il giro completo offre sei inversioni (tre in ogni direzione) in uno spazio molto compatto, rendendolo ideale per parchi con spazio limitato. Sono stati costruiti oltre 50 Boomerang in tutto il mondo; il modello si trova in parchi su ogni continente abitato. Nonostante l'età, i Boomerang rimangono coaster popolari come primo approccio all'adrenalina nei parchi di medie dimensioni.",
    relatedTermIds: ['inversion', 'sidewinder', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Un modello di coaster compatto Gerstlauer con una prima discesa quasi verticale o oltre la verticale lanciata da una catena di risalita verticale, progettato per offrire emozioni intense in piccoli spazi.',
    definition:
      "L'Euro-Fighter è il modello di coaster compatto firma di Gerstlauer, riconoscibile per la prima discesa verticale (90 gradi) o oltre la verticale (fino a 97 gradi) che segue una catena di risalita verticale. Progettato per parchi con spazio limitato, gli Euro-Fighter concentrano emozioni intense — multiple inversioni, curve strette e alte G-force — in una piccola area. La discesa oltre la verticale (più ripida della verticale) è particolarmente degna di nota: il treno si ferma in cima con i passeggeri che si protendono nel vuoto prima del tuffo. Gli Euro-Fighter europei includono Saw – The Ride a Thorpe Park, Rage ad Adventure Island e Fluch von Novgorod a Hansa-Park.",
    relatedTermIds: ['first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Un tipo di coaster con un treno inusualmente largo e una discesa quasi verticale o oltre la verticale, con una pausa deliberata sulla cresta prima del tuffo.',
    definition:
      "Un Dive Coaster è caratterizzato da un treno largo (tipicamente 8–10 passeggeri per fila), una discesa quasi verticale o oltre la verticale (90+ gradi) e una pausa teatrale in cima alla discesa — il treno si ferma momentaneamente sulla cresta prima di rilasciarsi, massimizzando l'anticipazione psicologica. Il treno largo offre a tutti i passeggeri una visuale libera dritta verso il basso. La linea Dive Machine di B&M (Oblivion ad Alton Towers, SheiKra a Busch Gardens) ha pionieristicamente sviluppato il concetto. La pausa deliberata prima della discesa è una scelta progettuale consapevole per aumentare la tensione ed è una delle esperienze più discusse nelle conversazioni sui parchi a tema.",
    relatedTermIds: ['first-drop', 'b-and-m', 'euro-fighter', 'launch-coaster'],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      "Una montagna russa arricchita con visori per la realtà virtuale che sovrappongono un'esperienza animata o di gioco sincronizzata al giro fisico.",
    definition:
      "Un VR Coaster equipaggia i passeggeri con visori VR (tipicamente Samsung Gear VR o dispositivi appositamente costruiti) che mostrano un ambiente virtuale sincronizzato che rispecchia i movimenti fisici del coaster. Mentre il giro genera G-force attraverso un looping, il mondo VR rispecchia la sensazione; mentre il treno scende, il mondo virtuale precipita. I VR Coaster sono diventati popolari dal 2015 al 2019 circa, con molti parchi che hanno adattato coaster esistenti. Il concetto ha avuto una ricezione mista: alcuni ospiti amano la sovrapposizione immersiva, mentre altri trovano i visori scomodi, poco igienici o causa di cinetosi. Molti parchi che hanno introdotto la VR l'hanno poi rimossa. Alcune installazioni (come i VR Coaster di Mack Rides) offrono esperienze dedicate più rifinite.",
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'La sensazione di assenza di peso o di essere sollevati dal sedile che si prova sulle montagne russe durante i momenti di G-force negativa.',
    definition:
      "L'Airtime descrive la sensazione di assenza di peso — G-force negative — che i passeggeri di una montagna russa sperimentano quando il coaster supera una collina o una valle più velocemente della caduta libera. Esistono due tipi principali: floater airtime (G negative lievi, una dolce sensazione di galleggiamento) e ejector airtime (G negative intense, in cui la barra di sicurezza o la cintura è l'unica cosa a tenervi sul sedile). L'Airtime è ampiamente considerata la caratteristica distintiva dei grandi coaster in acciaio e in legno. Le Airtime Hill (dette anche camelback) sono specificamente progettate per massimizzare questa sensazione modellando il binario per seguire una traiettoria parabolica di caduta libera.",
    relatedTermIds: ['airtime-hill', 'bunnyhop', 'first-drop', 'wooden-coaster'],
  },
  {
    id: 'inversion',
    name: 'Inversione',
    shortDefinition:
      'Qualsiasi elemento su una montagna russa in cui il binario ruota i passeggeri a testa in giù.',
    definition:
      "Un'inversione è qualsiasi elemento su una montagna russa in cui il binario e il veicolo ruotano i passeggeri oltre il piano verticale — posizionandoli almeno parzialmente a testa in giù. Le inversioni comuni includono il looping verticale, il Cobra Roll, il Cavatappi, l'Immelmann, il Dive Loop, l'Inline Twist, l'Heartline Roll e lo Zero-g Roll. I coaster moderni presentano abitualmente da sei a quattordici inversioni in un singolo layout. Il numero di inversioni è una delle statistiche chiave per descrivere l'intensità di un coaster. Le inversioni generano sia G-force positive (al fondo dei loop) che G-force negative (in cima), creando sensazioni variate lungo tutto il giro.",
    relatedTermIds: ['vertical-loop', 'cobra-roll', 'immelmann', 'zero-g-roll', 'corkscrew'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      "La classica inversione circolare in cui il binario forma un cerchio verticale completo, portando i passeggeri completamente a testa in giù all'apice.",
    definition:
      "Il looping verticale è l'inversione più iconica nella storia delle montagne russe — un cerchio completo di 360 gradi nel piano verticale. I looping moderni utilizzano una forma a clothoide (a goccia) invece di un cerchio perfetto: l'entrata e l'uscita sono ampie, mentre la sommità del loop è stretta. Questa forma garantisce che i passeggeri sperimentino G-force fluide e sostenute piuttosto che picchi estremi. Il primo coaster moderno con looping (Corkscrew, Knott's Berry Farm, 1975) ha trasformato il settore. Oggi i looping verticali sono l'elemento di punta del conteggio delle inversioni sui coaster di tutto il mondo, dalle attrazioni per il primo brivido alle macchine da record.",
    aliases: ['Looping', 'Anello Verticale'],

    relatedTermIds: ['inversion', 'immelmann', 'cobra-roll'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      "Un mezzo looping che spinge il treno verso l'alto e oltre la sommità, seguito da un mezzo rollio che esce in direzione opposta — prende il nome dal pilota della Prima Guerra Mondiale Max Immelmann.",
    definition:
      "La virata Immelmann è un'inversione firma B&M composta da due fasi: il binario prima sale in un mezzo looping verticale, portando i passeggeri sopra la sommità brevemente a testa in giù; poi un mezzo rollio rimette il treno in posizione verticale invertendo simultaneamente la direzione di 180 gradi. L'elemento prende il nome dall'asso aviatore della Prima Guerra Mondiale Max Immelmann, che usava una manovra aerea simile. Gli Immelmann sono distintivi perché producono sia un'inversione con sensazione di caduta allo stomaco sia un cambiamento di direzione significativo in un singolo elemento fluido. Si trovano su quasi ogni coaster B&M sit-down, invertito e hyper in tutto il mondo.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop', 'b-and-m'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-g Roll',
    shortDefinition:
      "Un rollio di 360 gradi che segue un arco parabolico in cui i passeggeri sperimentano quasi l'assenza di peso all'apice — uno degli elementi più celebrati nel design moderno dei coaster.",
    definition:
      "Lo Zero-g Roll (rollio a gravità zero) è un elemento di inversione modellato in modo che il treno segua un arco parabolico durante la rotazione — simile concettualmente a un Heartline Roll ma a velocità maggiore e con maggiore spostamento verticale. Al picco del rollio, i passeggeri sperimentano momentanee G-force negative (airtime) mentre sono a testa in giù, creando una sensazione al tempo stesso disorientante e amata. Gli Zero-g Roll sono associati principalmente ai wing coaster e agli hyper coaster B&M, dove l'elemento fa scivolare i passeggeri dei sedili d'ala in modo spettacolare nell'aria aperta. Shambhala a PortAventura e Fury 325 a Carowinds presentano celebri Zero-g Roll.",
    relatedTermIds: ['inversion', 'heartline-roll', 'airtime', 'b-and-m'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      "La salita azionata meccanicamente che porta il treno del coaster al suo punto più alto, convertendo l'energia elettrica in energia potenziale gravitazionale.",
    definition:
      "Il Lifthill è il segmento in cui un meccanismo esterno tira il treno del coaster dal livello del suolo fino al punto più alto del giro. Il meccanismo più comune è una catena che scorre lungo il centro del binario — il familiare suono 'click-click-click' è il cricchetto anti-rotolamento. Le alternative includono lift a cavo/fune (più fluidi e silenziosi), lift a rullo pneumatico (usati su alcuni moderni coaster B&M) e propulsione magnetica. L'altezza del Lifthill determina la velocità massima potenziale del coaster. Alcuni design moderni utilizzano più Lifthill o combinano una salita con segmenti di lancio. Il Lifthill è tipicamente il momento più lento e ricco di anticipazione del giro.",
    aliases: ['Lift Hill', 'Chain Lift'],

    relatedTermIds: ['first-drop', 'launch-coaster', 'block-brake'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'La discesa iniziale che segue il Lifthill — tipicamente il punto più alto e veloce del giro, che definisce il carattere del coaster.',
    definition:
      "Il First Drop è la discesa principale immediatamente successiva al Lifthill o al segmento di lancio. Sulla maggior parte dei coaster tradizionali è la collina più alta e produce la velocità massima del coaster. L'angolazione, l'altezza e il profilo influenzano fortemente il carattere complessivo: le discese con angolo ripido (oltre 80–90 gradi) creano intense sensazioni di accelerazione, mentre le discese paraboliche possono generare un forte airtime nonostante un angolo più dolce. I Dive Coaster presentano discese che superano i 90 gradi (oltre la verticale), richiedendo ai passeggeri di sporgersi sul bordo. Il First Drop è spesso il momento più atteso su qualsiasi nuovo coaster ed è comunemente filmato per il materiale promozionale.",
    relatedTermIds: ['lifthill', 'airtime', 'airtime-hill', 'dive-coaster'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      "Un elemento a forma di collina progettato per generare G-force negative, facendo sperimentare ai passeggeri l'assenza di peso o sollevarli dai sedili.",
    definition:
      "Un'Airtime Hill (detta anche camelback) è un elemento curvo su-e-giù progettato per produrre G-force negative — la sensazione di galleggiare o essere espulsi dal sedile. Il floater airtime è una G negativa dolce; l'ejector airtime è intensa, in cui la barra di sicurezza diventa l'unica cosa tra il passeggero e il cielo. I coaster in acciaio utilizzano colline paraboliche di precisione per un airtime costante e prevedibile; i coaster in legno producono un airtime più imprevedibile e grezzo dovuto alla flessione del binario. Le Airtime Hill sono tra gli elementi più celebrati nelle classifiche degli appassionati e una caratteristica distintiva degli hyper coaster, dei giga coaster e dei moderni ottovolanti in legno.",
    aliases: ['Camelback', 'Camelback Hill', 'Collina di Airtime'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Una sezione continua a spirale in cui il binario si avvolge attorno a un asse centrale, generando G-force laterali sostenute.',
    definition:
      "Un'elica è una sezione di binario di coaster che si avvolge continuamente a spirale — simile nella forma a una vite — senza invertire i passeggeri. A differenza delle Airtime Hill o delle inversioni, le eliche generano G-force laterali (laterali) sostenute che spingono i passeggeri verso l'esterno delle curve. Un'elica discendente accelera il treno mentre gira; un'elica ascendente lo decelera pur generando ancora forze laterali. Le eliche vengono comunemente usate per spendere l'energia cinetica rimanente alla fine di un layout offrendo un'eccitante sensazione di curva sostenuta. Famose eliche includono il finale sotterraneo di Nemesis ad Alton Towers e l'elica finale di Expedition GeForce a Holiday Park.",
    aliases: ['Helices', 'Spirale'],

    relatedTermIds: ['horseshoe', 'first-drop'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Una sezione di frenata che divide il circuito in segmenti indipendenti, consentendo a più treni di funzionare simultaneamente senza rischio di collisione.',
    definition:
      "Un Block Brake divide il circuito di un coaster in sezioni indipendenti separate ('blocchi'), ciascuna capace di contenere esattamente un treno. Se un treno davanti rallenta o si ferma, il sistema di controllo trattiene automaticamente tutti i treni seguenti nelle loro posizioni di Block Brake. Questo sistema di sicurezza consente ai parchi di operare più treni simultaneamente — aumentando drasticamente la capacità oraria del giro — senza alcun rischio di collisione. I Block Brake sono posizionati in punti in cui un treno fermo non rotola all'indietro (tipicamente una sezione piatta o leggermente in salita) e tipicamente utilizzano freni magnetici (a correnti parassite) o a pattino. Il Mid-Course Brake Run (MCBR) è il tipo di Block Brake più visibile.",
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'La sezione di decelerazione alla fine del giro in cui il treno viene rallentato alla velocità della stazione, tipicamente utilizzando freni magnetici a pattino.',
    definition:
      "Il Brake Run è la sezione di binario che segue il layout principale in cui il treno del coaster decelera dalla velocità di giro a una velocità di avvicinamento sicura alla stazione. I moderni Brake Run utilizzano freni a correnti di Foucault (magnetici) — file di pattini magnetici permanenti che interagiscono con le pinne metalliche sul fondo del treno, creando resistenza senza attrito né usura. I coaster più vecchi usavano freni pneumatici a pinza. Un Mid-Course Brake Run (MCBR) posizionato a metà del layout serve come sezione di blocco per l'operazione multi-treno. Il Brake Run finale prima della stazione può essere intenzionalmente leggero nella frenata per preservare un po' di velocità per un approccio alla stazione più dinamico.",
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      "Un'inversione doppia firma B&M in cui il binario forma la forma della testa sollevata di un cobra — due inversioni collegate da una torsione all'apice.",
    definition:
      "Il Cobra Roll è uno degli elementi firma più distintivi di B&M, composto da due inversioni in rapida successione: il binario si curva verso l'alto in un mezzo looping, ruota di 180 gradi in cima (passando attraverso una breve sezione invertita), poi rispecchia la sequenza per uscire dall'elemento nella stessa direzione dell'entrata. Visto di lato, il profilo del binario assomiglia alla testa sollevata e allargata di un cobra. Famosi Cobra Roll appaiono su Shambhala a PortAventura, Pyrenees al Parque de Atracciones de Madrid e su molti coaster invertiti B&M in tutto il mondo.",
    relatedTermIds: ['inversion', 'immelmann', 'batwing', 'b-and-m'],
  },
  {
    id: 'corkscrew',
    name: 'Cavatappi',
    shortDefinition:
      "Un'inversione a rollio a botte in cui il binario si avvolge a spirale di 360 gradi attorno a un asse centrale — uno dei primi e più diffusi tipi di inversione.",
    definition:
      "Il Cavatappi (Corkscrew) è una delle prime inversioni moderne, introdotto da Arrow Dynamics negli anni '70. Il binario si avvolge attorno a un cilindro centrale come un cavatappi, ruotando i passeggeri attraverso un rollio completo di 360 gradi sfalsato rispetto alla direzione di viaggio. I Cavatappi sono spesso abbinati in disposizioni back-to-back e sono l'elemento distintivo del coaster in acciaio dell'era classica. Il termine tedesco 'Korkenzieher' è ampiamente usato nelle mappe e nella segnaletica dei parchi tedeschi. Sebbene i design di inversione più recenti lo abbiano in gran parte superato, il Cavatappi rimane un elemento amato nei parchi di tutta Europa e del Nord America.",
    relatedTermIds: ['inversion', 'inline-twist', 'flat-spin'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      "L'immagine speculare di un Immelmann: il binario si tuffa ripidamente verso il basso in un mezzo looping e esce orizzontalmente — invertendo la direzione rispetto a un Immelmann.",
    definition:
      "Un Dive Loop (detto anche dive turn o Immelmann inverso) inizia dove l'Immelmann finisce: invece di salire e scavalcare, il binario si tuffa ripidamente verso il basso, curvando attraverso la metà inferiore di un looping prima di uscire nella direzione opposta all'entrata. La sensazione è quella di un tuffo verso il basso vorticoso seguito da un'intensa uscita in pull-out. I Dive Loop sono un elemento firma B&M e appaiono su molti dei coaster invertiti e sit-down del costruttore. La combinazione di Immelmann e Dive Loop in un singolo layout crea cambiamenti di direzione e tipi di inversione variati.",
    relatedTermIds: ['inversion', 'immelmann', 'b-and-m'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      "Un singolo rollio di 360 gradi direttamente attorno all'asse del binario, che fornisce un'inversione fluida senza cambiare significativamente la direzione di viaggio del treno.",
    definition:
      "Un Inline Twist (detto anche inline roll o barrel roll) ruota il treno di 360 gradi attorno all'asse longitudinale del binario — il coaster si avvolge essenzialmente senza deviare significativamente di direzione. A differenza di un Cavatappi (che ha una spirale sfalsata rispetto al centro del binario), l'Inline Twist ruota precisamente attorno al binario. Il risultato è un'inversione breve e fluida con forze laterali minime. Gli Inline Twist sono comuni sui flying coaster e i coaster invertiti B&M, spesso appaiono in coppia o combinati con altri elementi in rapida successione. L'elemento produce un'esperienza momentanea a testa in giù che sembra sorprendentemente dolce.",
    relatedTermIds: ['inversion', 'corkscrew', 'heartline-roll', 'flat-spin'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      "Un rollio di 360 gradi centrato sul centro di gravità del passeggero piuttosto che sul binario stesso, progettato per offrire un'assenza di peso fluida e sostenuta durante tutta la rotazione.",
    definition:
      "Un Heartline Roll (o heartline spin) è progettato in modo che il cuore del passeggero — approssimativamente il centro di gravità del corpo — rimanga a un'altezza costante durante tutta la rotazione, piuttosto che il binario essere il punto di perno. Questo design minimizza le G-force durante il rollio, producendo una sensazione di galleggiamento fluido distinta dal colpo di un Cavatappi standard. Gli Heartline Roll sono un segno distintivo del design moderno di coaster B&M e Intamin, associati agli hyper coaster e ai coaster invertiti. L'elemento illustra la precisione ingegneristica richiesta per creare un'esperienza di giro fluida — minuscole regolazioni del binario si traducono direttamente nel comfort o disagio del passeggero.",
    relatedTermIds: ['inversion', 'zero-g-roll', 'inline-twist'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un mezzo looping combinato con un mezzo cavatappi che ruota il binario di 90 gradi e cambia direzione — un elemento firma Vekoma presente sui coaster Boomerang.',
    definition:
      "Un Sidewinder consiste in un mezzo looping verticale che spinge il treno verso l'alto, immediatamente seguito da un mezzo cavatappi che rimette il treno in posizione verticale ruotando di 90 gradi. Il risultato netto è un'inversione combinata con un cambiamento significativo di direzione, ottenuta in uno spazio compatto. I Sidewinder sono gli elementi costitutivi del modello Boomerang iconico di Vekoma: due Sidewinder (uno in avanti, uno al contrario) affiancano un looping centrale per creare il layout completo. Il nome si riferisce al movimento di torsione a serpente che l'elemento produce quando visto dal bordo pista.",
    relatedTermIds: ['inversion', 'boomerang', 'cobra-roll'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Una massiccia inversione esclusiva dei flying coaster B&M in cui i passeggeri, già in posizione Superman, passano attraverso il punto più basso di un looping verticale completamente invertiti.',
    definition:
      "Il Pretzel Loop è una delle inversioni più intense nel design dei parchi a tema, trovata esclusivamente sui flying coaster B&M (dove i passeggeri giacciono in orizzontale in posizione Superman). L'elemento manda i passeggeri in tuffo ripido verso il basso mentre sono invertiti, attraverso il fondo di un grande looping, poi li riporta ripidamente verso l'alto — la forma complessiva ricorda un pretzel vista di lato. Poiché il punto più basso è in fondo e i passeggeri sono a faccia in giù, le G-force sperimentate in quel momento sono estremamente intense. Famosi Pretzel Loop appaiono su Manta a SeaWorld Orlando e Tatsu a Six Flags Magic Mountain.",
    relatedTermIds: ['inversion', 'b-and-m', 'inline-twist'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Un elemento a doppia inversione con inversione di direzione di 180 gradi, che combina due mezzi looping collegati da un mezzo cavatappi — la forma ricorda ali di pipistrello spiegate.',
    definition:
      "Un Batwing consiste in due inversioni con un'inversione di direzione: il binario si archi verso l'alto in un mezzo looping, poi in cima passa attraverso un mezzo cavatappi che inverte il treno e inverte la direzione prima di rispecchiare il mezzo looping verso il livello del suolo. La forma vista dall'alto ricorda ali di pipistrello spiegate. I Batwing sono un elemento firma B&M, presenti su coaster come Afterburn a Carowinds e The Incredible Hulk Coaster agli Universal Islands of Adventure. A differenza del Bowtie (che non ha cambiamento di direzione), il Batwing inverte la direzione del treno di 180 gradi durante la sequenza.",
    relatedTermIds: ['inversion', 'bowtie', 'cobra-roll', 'b-and-m'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      "Una variante di looping in cui il binario si avvicina dall'alto, scende attraverso il percorso circolare ed esce in cima — la geometria inversa di un looping standard.",
    definition:
      "Il Norwegian Loop (a volte chiamato reverse loop) ha la geometria opposta a un looping verticale standard: invece di entrare al livello del suolo e uscire alla stessa altezza, il treno entra da una posizione elevata, scende nel percorso circolare del looping ed esce nuovamente in cima. Questo significa che le forze sentite al fondo del cerchio — che sono forti G positive — sono ancora presenti, ma le sensazioni di entrata e uscita sono notevolmente diverse. I Norwegian Loop sono relativamente rari nell'inventario globale dei coaster e sono associati principalmente a certi design Vekoma e installazioni personalizzate.",
    relatedTermIds: ['inversion', 'vertical-loop', 'dive-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un elemento a cavatappi su coaster invertiti o flying in cui la rotazione avviene in un piano approssimativamente orizzontale, creando una rotazione ampia e quasi livellata.',
    definition:
      "Un Flat Spin è un'inversione di tipo cavatappi presente principalmente sui coaster invertiti e flying B&M, dove la geometria dell'elemento è disposta in modo che la spirale appaia quasi orizzontale agli osservatori a terra. Su un coaster invertito (dove il treno pende sotto il binario) un Flat Spin crea un effetto visivo particolarmente spettacolare mentre i passeggeri scorrono attraverso un ampio cerchio quasi livellato. La sensazione per i passeggeri è una rotazione fluida e sostenuta con G-force moderate. I Flat Spin sono un elemento firma sui coaster invertiti B&M come Banshee a Kings Island e Afterburn a Carowinds.",
    relatedTermIds: ['inversion', 'corkscrew', 'inline-twist', 'b-and-m'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      "Un mezzo cavatappi che inverte simultaneamente la direzione del treno di circa 180 gradi — combinando un'inversione con un brusco cambio di direzione.",
    definition:
      "Un Cutback è un elemento in cui il binario esegue un mezzo cavatappi mentre si curva su se stesso di circa 180 gradi. Il risultato è un'inversione con una significativa inversione di direzione — distinta da un cavatappi standard, che mantiene principalmente la direzione di viaggio. I Cutback sono relativamente insoliti e tendono ad apparire su certi modelli Vekoma e coaster personalizzati dove è richiesto un cambio di direzione compatto combinato con un'inversione. Il nome 'cutback' riflette l'aspetto visivo dell'elemento: il binario taglia indietro sulla propria direzione precedente mentre si capovolge.",
    relatedTermIds: ['inversion', 'corkscrew', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Una variante di doppia inversione a sea-serpent con un apice di collegamento più basso, che produce due inversioni consecutive senza cambiamento di direzione in uno spazio compatto.',
    definition:
      "Il Butterfly è un elemento a doppia inversione simile a un sea-serpent (due mezzi looping collegati in cima) ma con un apice più basso e una geometria distinta. Come il sea-serpent, produce due inversioni senza cambiare la direzione del treno, ma il pezzo di collegamento tra i due mezzi looping passa attraverso una sezione invertita più bassa piuttosto che una cresta alta. Questo rende il Butterfly più compatto verticalmente. L'elemento appare su certi design Vekoma e coaster personalizzati ed è distinto dal Bowtie (nessun cambiamento di direzione, stesso del Butterfly ma diversa geometria del layout) e dal Batwing (ha un cambiamento di direzione).",
    relatedTermIds: ['inversion', 'bowtie', 'batwing'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un elemento a doppia inversione in cui due mezzi looping speculari formano una forma a papillon nel binario — due inversioni senza cambio di direzione.',
    definition:
      "Un Bowtie è un elemento a doppia inversione composto da due mezzi looping speculari collegati al loro picco. A differenza di un Batwing (che inverte la direzione), il Bowtie esce nella stessa direzione generale in cui è entrato. Visto dall'alto, il profilo del binario ricorda un papillon. I Bowtie sono relativamente rari e si trovano principalmente su certi Vekoma e installazioni personalizzate. L'elemento produce due inversioni fluide in rapida successione mantenendo la direzione generale di viaggio, offrendo una sensazione diversa dal Batwing che inverte la direzione nonostante un aspetto superficialmente simile.",
    relatedTermIds: ['inversion', 'batwing', 'butterfly'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Una serie di piccole, rapide Airtime Hill vicino alla fine del giro che producono un dolce floater airtime mentre il treno perde velocità.',
    definition:
      "Un Bunnyhop è una serie di piccole colline rapide posizionate verso la fine del layout di un coaster quando il treno ha perso la maggior parte della sua energia cinetica. A questa velocità ridotta le colline generano un dolce floater airtime — una sensazione di galleggiamento morbida e ritmica piuttosto che l'intenso ejector airtime delle colline più veloci nella parte iniziale del layout. Il termine riflette il movimento leggero e rimbalzante che ricorda il salto di un coniglio. I Bunnyhop sono finali comuni sugli hyper coaster, i giga coaster e i coaster in legno, fornendo un allegro tocco finale prima del Brake Run. Gli appassionati considerano spesso dei Bunnyhop ben eseguiti un segno di un design del layout ben curato.",
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      "Un'Airtime Hill inclinata oltre i 90 gradi che lancia i passeggeri lateralmente producendo contemporaneamente G-force negative — porta il nome del leggendario ingegnere Werner Stengel ed è un elemento firma Mack Rides.",
    definition:
      "Lo Stengel Dive è un elemento di airtime in cui il binario si inclina oltre i 90 gradi (oltre la verticale) in modo che i passeggeri siano appesi lateralmente o leggermente a testa in su mentre sperimentano contemporaneamente G-force negative dal profilo della collina. Questa combinazione unica di disorientamento laterale e airtime produce una sensazione diversa da qualsiasi collina o inversione standard. L'elemento porta il nome di Werner Stengel, l'ingegnere tedesco dietro il progetto di alcuni dei coaster più importanti della storia. Gli Stengel Dive sono un elemento firma degli hyper coaster Mack Rides: il Blue Fire Megacoaster a Europa-Park è stato il primo coaster a includerne uno, con i successivi hyper Mack come Ride to Happiness a Plopsaland e Kondaa a Walibi Belgium che ne includono più esempi.",
    relatedTermIds: ['airtime-hill', 'mack-rides', 'airtime'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Una curva con forte inclinazione a 180 gradi a forma di ferro di cavallo, che reindirizza il treno nella direzione opposta — comunemente usata per girare il treno tra segmenti di lancio.',
    definition:
      "Un Horseshoe è una curva semicircolare molto inclinata — tipicamente da 75 a 90 gradi — che reindirizza il coaster di 180 gradi (invertendo la direzione). L'inclinazione estrema previene eccessive G-force laterali al raggio stretto. Gli Horseshoe sono frequentemente utilizzati nei layout dei launched coaster come elementi di inversione di marcia tra più segmenti di lancio, dando al treno una svolta a U prima della prossima fase di accelerazione. L'elemento è visivamente spettacolare e un segno distintivo degli accelerator coaster di Intamin e dei multi-launch coaster di Mack. Reindirizza efficientemente il treno in uno spazio compatto mantenendo la velocità.",
    relatedTermIds: ['launch-coaster', 'intamin', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Un piccolo avvallamento appena prima della discesa principale su un coaster a catena, usato per ridurre la tensione della catena e fornire un breve momento di airtime anticipatorio.',
    definition:
      "Un Predrop è una piccola collina o avvallamento posizionato sull'ultimo tratto della catena di risalita, appena prima della cresta che porta alla discesa principale. La sua funzione ingegneristica primaria è ridurre la tensione sulla catena di risalita mentre il treno supera la cresta — evitando una transizione brusca o violenta dalla salita motorizzata alla discesa libera. Un beneficio secondario è l'esperienza del passeggero: il breve pop di airtime mentre il treno supera il Predrop offre un assaggio allettante dell'assenza di peso prima del tuffo principale. I Predrop sono diventati una caratteristica di design popolare sui coaster in legno e in acciaio, con alcuni — come quello di Goliath a Six Flags Magic Mountain — diventati attesi quanto la discesa stessa.",
    relatedTermIds: ['lifthill', 'first-drop', 'airtime'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un elemento alto e stretto con ascesa e discesa quasi verticali che ricorda un cappello a cilindro — un elemento firma sui coaster Intamin a lancio idraulico.',
    definition:
      "Un Top Hat è un elemento distintivo in cui il binario sale quasi verticalmente fino a una cresta netta, poi cade quasi verticalmente dall'altro lato — creando un profilo che visto di lato assomiglia a un cappello a cilindro. I Top Hat interni (standard) si inclinano verso l'interno al picco; i Top Hat esterni si inclinano verso l'esterno per una sensazione esposta e ricca di airtime. L'elemento è fortemente associato ai launched coaster idraulici di Intamin (acceleratori): dopo il lancio iniziale a 200 km/h o più, il Top Hat è il pezzo centrale spettacolare del giro. Kingda Ka (139 m), Top Thrill Dragster (128 m) e Red Force a Ferrari Land presentano Top Hat iconici.",
    relatedTermIds: ['launch-coaster', 'intamin', 'first-drop'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      "Una montagna russa che un appassionato ha ufficialmente percorso e aggiunto al proprio conteggio personale — collezionare credit è un'attività centrale nella comunità degli appassionati di coaster.",
    definition:
      "Un coaster credit (o semplicemente 'credit' o 'cred') è una montagna russa che un appassionato ha percorso e ufficialmente aggiunto al proprio conteggio personale. La pratica di 'collezionare credit' — percorrere il maggior numero possibile di coaster diversi — è una delle attività distintive della comunità degli appassionati di montagne russe. Le regole su cosa conta come credit variano: alcuni appassionati contano solo i coaster sit-down, altri includono tutti i giri su rotaia; alcuni richiedono che ogni tipo di treno su un singolo coaster conti come un credit, altri no. Siti di tracciamento come il Roller Coaster Database (RCDB) consentono agli appassionati di registrare i propri conteggi. La ricerca di credit motiva molti appassionati a viaggiare internazionalmente e a visitare parchi poco conosciuti.",
    aliases: ['Credits', 'Cred', 'Creds'],

    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      "Riprese in soggettiva dalla prima fila di una montagna russa, che danno ai potenziali passeggeri un'anteprima virtuale dell'esperienza del giro.",
    definition:
      'POV (Point of View) si riferisce a riprese video in giro registrate dalla prospettiva di un passeggero in prima fila, tipicamente montate su una telecamera attaccata al treno. I video POV sono uno dei formati di contenuto più popolari nella comunità degli appassionati di parchi a tema e sono ampiamente utilizzati dai potenziali visitatori per vedere in anteprima un coaster prima di visitare. Gli operatori dei parchi a volte producono POV ufficiali per scopi promozionali; più spesso sono filmati da ospiti o media. Un POV ben prodotto mostra chiaramente ogni elemento, discesa e inversione in sequenza. YouTube ospita decine di migliaia di video POV di coaster. Il termine è usato anche in senso più ampio per descrivere qualsiasi ripresa in soggettiva delle attrazioni del parco.',
    aliases: ['Point of View', 'On-Ride POV', 'On-Ride Video'],

    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Una situazione in cui più treni arrivano al Brake Run prima che la stazione sia libera, causando una coda di treni in attesa — un segnale di operazioni inefficienti che prolunga i tempi di attesa.',
    definition:
      "Lo Stacking si verifica quando il processo di carico/scarico di una montagna russa è più lento del tempo del ciclo del giro, causando l'accumulo di treni nel Brake Run in attesa che la stazione si liberi. Invece di far partire un treno quando quello precedente ritorna, l'operatore deve trattenere più treni nel Brake Run — portando potenzialmente il giro a una breve fermata tra un treno e l'altro. Lo Stacking riduce direttamente la capacità del giro e prolunga i tempi di attesa in coda. Le cause comuni includono il lento caricamento degli ospiti (spesso dovuto a sistemi di ritenuta complessi), grandi requisiti di controllo bagagli, o carenza di personale. Gli ospiti esperti nei parchi possono osservare se un coaster sta facendo Stacking durante la loro attesa e tenerlo in considerazione nel processo decisionale.",
    aliases: ['Train Stacking'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo di montagna russa in cui il treno è sospeso sotto la rotaia e i piedi dei passeggeri penzolano liberamente.',
    definition:
      'Un Inverted Coaster è una montagna russa in cui il treno è fissato rigidamente sotto la rotaia, con i passeggeri seduti a gambe penzolanti. A differenza di una suspended coaster (che oscilla lateralmente), il treno di un Inverted Coaster non si muove lateralmente. B&M ha sviluppato il design moderno nel 1992 con Batman The Ride. Gli Inverted Coaster sono rinomati per i near-miss intensi, i zero-g roll e i cobra roll. Esempi europei celebri: Nemesis (Alton Towers), Katun (Mirabilandia) e Oziris (Parc Astérix).',
    aliases: ['Inverted', 'Invert', 'Montagna Russa Invertita'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo di coaster con i sedili posizionati su entrambi i lati della rotaia — nulla sopra, sotto o accanto ai passeggeri.',
    definition:
      "Un Wing Coaster (o Wing Rider) dispone due sedili per lato lungo la rotaia, lasciando i passeggeri senza alcuna struttura sopra, sotto o ai lati. Il design massimizza la sensazione di volo e crea near-miss spettacolari con l'ambientazione. B&M è il principale produttore di Wing Coaster. Esempi notevoli in Europa: The Swarm (Thorpe Park), GateKeeper (Cedar Point) e Flug der Dämonen (Europa-Park), spesso citato tra i migliori coaster d'Europa.",
    aliases: ['Wing Rider', 'Wing Coasters', 'Wing Coaster'],

    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      "Montagna russa con vagoni che ruotano liberamente su un asse verticale, offrendo un'esperienza diversa ad ogni giro.",
    definition:
      'Uno Spinning Coaster è dotato di vagoni montati su una piattaforma rotante che gira liberamente attorno a un asse verticale. Poiché la rotazione non è controllata, ogni veicolo vive una sequenza diversa di avanti, indietro e laterale. Mack Rides (Waldkirch, Germania) e Gerstlauer sono i principali produttori. Gli Spinning Coaster sono considerati ottime attrazioni per famiglie — abbastanza intense da essere emozionanti, ma senza i requisiti di altezza dei coaster più impegnativi.',
    aliases: ['Spinner'],

    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Il modello di spinning coaster ad alta intensità di Gerstlauer — più veloce, più alto e con una rotazione più pronunciata rispetto ai modelli standard.',
    definition:
      "L'Xtreme Spinning Coaster (XSC) è il modello di punta di Gerstlauer nella categoria spinning coaster, progettato per spingere il formato ai suoi limiti. Dove uno spinning coaster standard punta a un'intensità familiare, lo XSC offre una struttura più alta, cadute più ripide, velocità massime più elevate e un meccanismo di rotazione calibrato per giri più marcati — i vagoni ruotano con più forza e frequenza in ogni elemento del percorso.\n\nL'imprevedibilità della rotazione è amplificata dal ritmo più sostenuto: l'orientamento del vagone cambia più rapidamente, rendendo ogni corsa unica. Il modello XSC posiziona Gerstlauer tra gli spinner familiari e i coaster ad alta intensità, offrendo emozione autentica pur mantenendo il carattere rejugabile che rende gli spinning coaster così apprezzati.",
    aliases: ['XSC'],
    relatedTermIds: ['spinning-coaster', 'gerstlauer', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montagna russa che supera i 61 m di altezza, tipicamente senza inversioni e incentrata su velocità e airtime.',
    definition:
      'Hyper Coaster è la classificazione per le montagne russe tra 61 e 91 m di altezza. B&M chiama i propri modelli "Hyper Coaster"; Intamin usa il termine "Mega Coaster" per il tipo equivalente. Entrambi privilegiano grandi colline di airtime ad alta velocità piuttosto che le inversioni. Shambhala a PortAventura (Spagna) è il Hyper Coaster più alto e veloce d\'Europa con 76 m. Altri esempi celebri: Goliath a Walibi Holland e Mako a SeaWorld Orlando.',
    aliases: ['Hyper', 'Mega Coaster', 'Mega Montagna Russa'],

    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      "Montagna russa che supera i 91 m di altezza — un gradino sopra l'Hyper Coaster.",
    definition:
      "Giga Coaster è la classificazione per le montagne russe tra 91 e 121 m di altezza. Il termine è stato coniato da Cedar Fair e Intamin per Millennium Force a Cedar Point nel 2000. I Giga Coaster enfatizzano l'altezza estrema, i layout lunghi e i momenti di airtime colossali. Fury 325 a Carowinds è considerato da molti appassionati il miglior coaster in acciaio al mondo. In Europa non esistono ancora Giga Coaster nel 2025.",
    aliases: ['Giga'],

    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con inclinazione superiore a 90°, che inclina brevemente i passeggeri oltre la verticale.',
    definition:
      "Un Overbanked Turn è una curva dove l'inclinazione della rotaia supera i 90 gradi — il binario esterno è più alto della verticale, inclinando brevemente i passeggeri oltre la posizione capovolta senza completare un'inversione. L'elemento genera una caratteristica combinazione di G laterali e lievi G negative al culmine dell'inclinazione. Le curve overbanked sono un elemento distintivo dei Hyper Coaster di B&M e dei Mega Coaster di Intamin, e sono onnipresenti nei layout RMC.",
    aliases: ['Overbanked', 'Overbanked Turn'],

    relatedTermIds: ['inversion', 'airtime', 'b-and-m', 'rmc', 'intamin'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Freno magnetico a metà percorso che riduce la velocità del treno senza fermarlo completamente.',
    definition:
      "Un Trim Brake è un sistema frenante posizionato a metà percorso di una montagna russa per ridurre la velocità del treno — senza fermarlo completamente come un block brake. I trim brake vengono utilizzati per gestire le G-force, ridurre l'usura della rotaia o soddisfare requisiti di sicurezza. Gli appassionati li criticano spesso perché possono attenuare notevolmente le sensazioni del percorso — le airtime hill risultano meno intense quando il treno viene frenato prima. L'attivazione dei trim brake può variare in base alla stagione, alle condizioni atmosferiche e al carico del treno.",
    relatedTermIds: ['block-brake', 'brake-run', 'airtime'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Quando un launch coaster non raggiunge la cima del circuito e rotola indietro sul binario di lancio.',
    definition:
      "Un rollback si verifica quando un coaster lanciato non genera velocità sufficiente per superare il punto più alto del circuito e rotola quindi all'indietro per gravità fino alla posizione di lancio. Nei launch coaster idraulici (Top Thrill Dragster, Stealth) accade quando il meccanismo di lancio non eroga la potenza completa. Il treno rotola lentamente e viene fermato da freni magnetici al punto più basso. I rollback sono rari ma sono una caratteristica nota dei launch coaster idraulici. I passeggeri non corrono alcun rischio.",
    relatedTermIds: ['launch-coaster', 'block-brake', 'downtime'],
  },
  {
    id: 'animatronics',
    name: 'Animatronica',
    shortDefinition:
      'Personaggi robotici utilizzati nei dark ride e negli spettacoli per creare scene realistiche.',
    definition:
      "L'animatronica (animatronics) indica figure robotiche elettromeccaniche utilizzate nelle attrazioni e negli spettacoli dei parchi a tema per rappresentare personaggi o creature in modo realistico. Disney ha coniato il termine \"Audio-Animatronics\" nel 1964 durante l'Esposizione Universale. Le animatroniche moderne spaziano da semplici figure cicliche a robot sofisticati con espressioni facciali complesse e movimenti corporei completi. Esempi di riferimento: lo sciamano Na'vi in Pandora (Walt Disney World) e i dinosauri dell'attrazione Jurassic World (Universal).",
    aliases: ['Animatronic', 'Audio-Animatronics'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Previsione IA',
    shortDefinition:
      'Previsioni basate sul machine learning per i livelli di affluenza e i tempi di attesa — fino a 30+ giorni in anticipo.',
    definition:
      'Una previsione IA utilizza modelli di machine learning addestrati su dati storici di affluenza, dati meteo, calendari scolastici e dati in tempo reale per prevedere quanto sarà affollato un parco o una singola attrazione in un determinato giorno o ora. park.fan genera previsioni IA per affluenza e tempi di attesa previsti fino a 30+ giorni in anticipo.\n\nLe previsioni vengono aggiornate continuamente man mano che arrivano nuovi dati. Le previsioni a breve termine (1–7 giorni) sono generalmente molto precise poiché integrano dati meteo attuali, annunci di eventi e segnali di prenotazione. Le previsioni a lungo termine sono naturalmente meno precise, ma rimangono utili per identificare in anticipo periodi tranquilli o affollati.',
    aliases: ['AI Forecast', 'AI Forecasts'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'opening-hours',
    name: 'Orari di apertura',
    shortDefinition:
      "Il programma giornaliero ufficiale che indica quando un parco a tema o un'attrazione apre e chiude.",
    definition:
      "Gli orari di apertura sono il programma giornaliero pubblicato per un parco a tema o una singola attrazione — indicano quando inizia l'accesso e quando termina l'operatività. La maggior parte dei grandi parchi pubblica un calendario scorrevole con settimane o mesi di anticipo, sebbene gli orari possano cambiare a breve termine a causa di eventi speciali, aggiustamenti stagionali o problemi operativi.\n\npark.fan mostra gli orari di apertura per ogni parco. Gli orari contrassegnati con «Est.» (Stimato) sono stati derivati da schemi storici e non confermati ufficialmente dal parco — devono essere verificati prima di una visita pianificata.",
    aliases: ['Orari del Parco', 'Ore di Apertura'],

    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendenza',
    shortDefinition:
      'La direzione del cambiamento nella lunghezza della coda negli ultimi 30 minuti — in aumento, in calo o stabile.',
    definition:
      "La tendenza indica se la coda di un'attrazione è più lunga, più corta o uguale rispetto a 30 minuti fa. park.fan la rappresenta con una freccia: su (coda in crescita), giù (coda in diminuzione) o orizzontale (stabile).\n\nLa tendenza è spesso più significativa del tempo di attesa grezzo. Un'attrazione con 45 minuti e tendenza in calo è una scelta migliore rispetto a una con 40 minuti e tendenza fortemente in aumento — nel tempo che ci vuole ad arrivare, la prima coda potrebbe essere scesa a 30 minuti mentre la seconda ha già raggiunto i 55.",
    aliases: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride senza rotaie fisse — i veicoli navigano liberamente guidati da tecnologia incorporata nel pavimento.',
    definition:
      "Un Trackless Ride è un tipo di dark ride in cui i veicoli non sono vincolati a una rotaia fissa ma navigano autonomamente attraverso lo spazio dell'attrazione, guidati da loop di induzione, Wi-Fi o laser incorporati nel pavimento. La libertà di movimento consente scenografie molto più complesse e narrazioni non lineari: i veicoli possono girare, ruotare e avvicinarsi alle scene da diverse angolazioni. Esempi celebri: Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Avventura Totalmente Toccata di Remy (Disneyland Paris) e Symbolica (Efteling, Paesi Bassi).",
    aliases: ['Trackless', 'Trackless Dark Ride', 'Attrazione Senza Binari'],

    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Intelligenza Artificiale — i modelli di machine learning che calcolano le previsioni di affluenza e i tempi di attesa.',
    definition:
      "L'IA (Intelligenza Artificiale) si riferisce agli algoritmi di machine learning che riconoscono pattern in grandi dataset e generano previsioni. park.fan utilizza modelli IA addestrati su anni di dati storici sui tempi di attesa, calendari scolastici, dati meteorologici e annunci di eventi per produrre previsioni giornaliere di affluenza e tempi di attesa — fino a 30+ giorni in anticipo.",
    relatedTermIds: ['ai-forecast', 'crowd-forecast', 'crowd-calendar'],
    aliases: ['Intelligenza Artificiale'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Tempo di attesa in tempo reale',
    shortDefinition:
      'Dati sui tempi di attesa aggiornati in tempo reale direttamente dai sistemi del parco.',
    definition:
      'Un tempo di attesa in tempo reale è il dato attuale estratto direttamente dai sistemi del parco — non una media storica, ma il dato reale al minuto. park.fan recupera i tempi di attesa in tempo reale dalle API ufficiali dei parchi e da fonti terze, aggiornando ogni minuto.',
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-forecast'],
    aliases: ['Tempi di attesa in tempo reale', 'Attesa live'],
  },
  {
    id: 'crowd-forecast',
    name: 'Previsione affluenza',
    shortDefinition:
      "Previsione basata sull'IA dell'affluenza in un parco a tema per un giorno specifico.",
    definition:
      "Una previsione affluenza è una previsione basata sui dati di quanto sarà affollato un parco a tema in un giorno o a un'ora specifica. park.fan ricalcola le previsioni di affluenza quotidianamente utilizzando dati storici di presenze, calendari scolastici, dati meteorologici ed eventi speciali. I risultati alimentano direttamente il calendario delle affluenze: i giorni verdi indicano code brevi, i giorni rossi segnalano affluenza di punta con lunghi tempi di attesa.",
    relatedTermIds: ['crowd-calendar', 'ai-forecast', 'peak-day', 'crowd-level'],
    aliases: ['Previsioni affluenza'],
  },
  {
    id: 'g-force',
    name: 'Forza G',
    shortDefinition:
      "L'unità di accelerazione sperimentata dai passeggeri, misurata come multipli dell'accelerazione gravitazionale terrestre (9,81 m/s²).",
    definition:
      "La forza G (equivalente gravitazionale) misura l'accelerazione che un passeggero sperimenta rispetto alla gravità normale della Terra. Le forze G positive (sopra 1G) schiacciano i passeggeri nel sedile durante passaggi in avvallamenti o curve strette. Le forze G negative (sotto 0G) sollevano i passeggeri dal sedile, creando airtime. Le forze G laterali agiscono orizzontalmente, spingendo i passeggeri di lato nelle curve e nelle transizioni.\n\nLe montagne russe sono progettate per sequenziare queste forze deliberatamente. Un avvallamento che genera 4–5G è il marchio di un primo drop potente. Un breve momento a −0,5G su una collina di airtime produce la caratteristica sensazione di galleggiamento. La maggior parte delle attrazioni mira a 0–5G di forze positive sostenute, con brevi picchi per effetti drammatici. Un'esposizione prolungata a forze G elevate può causare disagio o greyout; le montagne russe ben progettate bilanciano picchi di intensità con sezioni di recupero.",
    relatedTermIds: ['airtime', 'inversion', 'lateral-gs', 'hangtime'],
    aliases: ['Forze G', 'G-Force', 'G-Forces'],
  },
  {
    id: 'lateral-gs',
    name: 'Forze Laterali',
    shortDefinition:
      'Forze orizzontali che spingono i passeggeri di lato durante curve, transizioni e sezioni a elica.',
    definition:
      "Le forze G laterali (o forze laterali) sono le accelerazioni orizzontali che i passeggeri sperimentano quando una montagna russa cambia direzione nel piano orizzontale — nelle curve inclinate o non inclinate, nelle eliche e nei cambi di direzione. Forze laterali ben progettate sono fluide e controllate, contribuendo a un'esperienza dinamica. Forze laterali mal gestite producono una brusca spinta contro il fianco o la schiena, fonte di disagio o dolore.\n\nGli appassionati distinguono tra forze laterali morbide e intenzionali — come nelle ampie curve basse di una classica montagna russa in legno — e forze laterali brutali dovute all'usura del binario o a una progettazione scadente. Le montagne russe in legno sono particolarmente associate al movimento laterale: il gioco del binario e l'energia laterale delle curve non inclinate fanno parte dell'autentica esperienza su legno. Le sequenze laterali fluide nelle sezioni a elica — come su Balder a Liseberg — sono spesso citate come momenti salienti dagli appassionati.",
    relatedTermIds: ['g-force', 'airtime', 'helix', 'wooden-coaster'],
    aliases: ['Laterali', 'Forze G Laterali', 'Lateral G', 'Laterals'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intense forze G negative che proiettano bruscamente i passeggeri fuori dal sedile, trattenuti solo dal dispositivo di sicurezza.',
    definition:
      "L'ejector airtime descrive la forma più intensa delle forze G negative: la traiettoria dell'attrazione si discosta così bruscamente dalla caduta libera che i passeggeri vengono proiettati violentemente fuori dai loro sedili, trattenuti solo dal dispositivo di sicurezza. La sensazione è quella di un'espulsione attiva dal sedile — netta e improvvisa, può rasentare la violenza se la transizione è troppo brusca.\n\nL'ejector airtime è più comunemente associato agli hybrid coaster RMC, ad alcuni hyper coaster Intamin e alle moderne montagne russe in legno con colline paraboliche ripide. Gli appassionati descrivono i migliori momenti ejector come il culmine di un circuito — un breve istante mozzafiato di vera assenza di peso. Untamed a Walibi Holland, Wildfire a Kolmården e Steel Vengeance a Cedar Point sono frequentemente citati per le loro sequenze ejector tra le più intense al mondo.",
    relatedTermIds: ['airtime', 'floater-airtime', 'airtime-hill', 'rmc', 'g-force'],
    aliases: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Forze G negative dolci e prolungate che producono una lunga sensazione di galleggiamento in cima a una collina.',
    definition:
      "Il floater airtime descrive l'estremità morbida dello spettro delle forze G negative: una sensazione lenta e prolungata in cui i passeggeri si sollevano leggermente dal sedile e galleggiano in assenza di peso per un lungo momento mentre il treno supera una collina seguendo un arco parabolico graduale. La forza è lieve — tipicamente tra −0,1G e −0,3G — rendendola accessibile anche ai passeggeri che trovano l'intensità dell'ejector eccessiva.\n\nIl floater airtime è caratteristico degli hyper e giga coaster B&M, che utilizzano grandi colline dolcemente arrotondate progettate per produrre lunghe fasi di galleggiamento. Shambhala a PortAventura, Silver Star a Europa-Park e Goliath a Walibi Holland sono esempi europei celebrati per le loro lunghe sequenze floater. Molti appassionati trovano la qualità rilassata del floater più confortevole dell'intensità dell'ejector, anche se le opinioni sono divise su quale stile sia superiore.",
    relatedTermIds: ['airtime', 'ejector-airtime', 'airtime-hill', 'b-and-m', 'g-force'],
    aliases: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      "La sensazione di essere sospesi nei dispositivi di sicurezza durante un'inversione, causata da forze G negative a testa in giù.",
    definition:
      "L'hangtime descrive l'esperienza particolare delle forze G negative durante un'inversione: il treno rimane abbastanza a lungo in cima a una figura capovolta perché le forze G negative si manifestino — i passeggeri si ritrovano letteralmente sospesi nei dispositivi di sicurezza. A differenza del breve momento capovolto di un looping veloce, l'hangtime si verifica quando il treno rallenta vicino all'apice di un'inversione, creando una sospensione prolungata. Il peso del corpo si sposta interamente nelle spalle o nelle ginocchia.\n\nL'hangtime è più pronunciato sugli elementi in cui il treno rallenta notevolmente all'apice dell'inversione — il pretzel loop sui flying coaster è l'esempio classico, poiché la velocità è sufficientemente bassa da generare forze G negative sostenute in posizione completamente capovolta. Il heartline roll di alcune attrazioni moderne può produrre hangtime. Gli appassionati considerano generalmente l'hangtime una delle sensazioni di inversione più emozionanti.",
    relatedTermIds: ['inversion', 'pretzel-loop', 'heartline-roll', 'g-force', 'airtime'],
    aliases: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Elemento delle montagne russe',
    shortDefinition:
      "Una sezione o caratteristica denominata di una montagna russa, come un looping, una collina airtime o un'inversione.",
    definition:
      "Un elemento delle montagne russe è qualsiasi caratteristica distinta e denominata incorporata nel percorso di una montagna russa — dalle classiche inversioni come looping e cavatappi agli elementi non invertenti come le colline airtime, le eliche e le curve sopraelevate (overbank). Gli ingegneri progettano ogni elemento per produrre una specifica sensazione fisica: assenza di peso (airtime), forze G laterali o il disorientamento da capogiro.\n\nIl glossario di park.fan copre decine di elementi individuali — dal primo drop e dal lifthill alle specialità moderne come lo Stengel dive, il Norwegian loop e l'heartline roll.",
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop', 'helix', 'first-drop'],
    aliases: ['Elementi delle montagne russe'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Prima fila',
    shortDefinition:
      'La prima fila di sedili in un treno di montagne russe, che offre generalmente la migliore vista e le sensazioni più intense.',
    definition:
      "La prima fila è la prima fila di sedili in un treno di montagne russe. I posti in prima fila offrono una vista libera verso il basso, molto apprezzati dai passeggeri per l'esperienza visiva. Sui hypercoaster e gigas, la prima fila spesso sperimenta il massimo airtime durante il primo drop, poiché i passeggeri non hanno nessuno di fronte che blocchi la loro sensazione di spazio. L'effetto psicologico di vedere il drop avvicinarsi — e poi precipitare nel vuoto — aumenta il fattore brivido ben oltre quello delle file centrali o posteriori.\n\nSu molti coaster, la prima fila è diventata così desiderabile che i parchi offrono bypass delle code o prenotazioni express specificamente per questa posizione di seduta.",
    relatedTermIds: ['back-row', 'middle-row', 'airtime', 'first-drop'],
    aliases: ['Primo sedile', 'Prima posizione'],
  },
  {
    id: 'back-row',
    name: 'Ultima fila',
    shortDefinition:
      "L'ultima fila di sedili in un treno, nota per l'airtime intenso e le sensazioni prolungate di sospensione su percorsi ricchi di colline.",
    definition:
      "L'ultima fila è l'ultima fila di sedili in un treno di montagne russe. I posti in ultima fila su coaster ricchi di colline — hypers, gigas, design focalizzati su airtime — sono apprezzati dagli appassionati per produrre il massimo airtime ejector. Su ogni collina successiva, l'ultima fila sperimenta forze G negative sostenute mentre il treno supera la cresta e i passeggeri vengono espulsi dai sedili (trattenuti solo dai dispositivi di sicurezza). Questo effetto si cumula su più colline: l'airtime in ultima fila è tipicamente più forte, più prolungato e più intenso rispetto alla fila anteriore o centrale.\n\nSu coaster come Goliath o Shambhala, l'ultima fila è considerata la posizione di seduta principale dagli appassionati.",
    relatedTermIds: ['front-row', 'middle-row', 'airtime', 'ejector-airtime'],
    aliases: ['Ultimo sedile', 'Ultima posizione'],
  },
  {
    id: 'middle-row',
    name: 'Fila centrale',
    shortDefinition:
      "Le file centrali di un treno di montagne russe, che offrono un'esperienza equilibrata tra la prima e l'ultima fila.",
    definition:
      "Le file centrali sono i sedili al centro di un treno di montagne russe — posizionati tra l'impatto psicologico intenso della prima fila e l'airtime ejector dell'ultima fila. Le file centrali tendono a offrire un'esperienza equilibrata: visione sufficiente per vedere il layout che si avvicina, airtime significativo, ma nessuno degli estremi della prima o dell'ultima fila. Per le famiglie o i visitatori al primo viaggio nervosi per l'intensità, le file centrali forniscono un'esperienza di coaster più accessibile.\n\nLe file centrali ricevono meno discussione nei circoli di appassionati perché non sono specializzate per una particolare sensazione. Tuttavia, su coaster con forze laterali estese, le file centrali possono a volte sentire la più grande compressione semplicemente a causa della loro posizione nel centro di massa del treno.",
    relatedTermIds: ['front-row', 'back-row', 'airtime', 'ride-cart'],
    aliases: ['Sedile centrale', 'Fila del mezzo'],
  },
  {
    id: 'ride-cart',
    name: 'Vagone',
    shortDefinition:
      'Veicolo o auto individuale in un treno di montagne russe che contiene una o più file di passeggeri.',
    definition:
      'Un vagone (anche chiamato auto, car o semplicemente vagone) è il segmento di veicolo individuale che contiene i passeggeri su una montagna russa. Un tipico treno coaster è composto da più vagoni collegati insieme, con ogni vagone che contiene una o più file di passeggeri seduti schiena contro schiena. I produttori di montagne russe progettano le dimensioni dei vagoni, il posizionamento dei sedili e la geometria dei dispositivi di sicurezza per ottimizzare sia il comfort che la sensazione.\n\nLa progettazione dei vagoni varia notevolmente tra i tipi di coaster: gli hypercoaster utilizzano vagoni snelli e a basso profilo per ridurre la resistenza aerodinamica; i coaster invertiti sospendono i passeggeri sotto la traccia; i wing coaster posizionano i passeggeri ai lati senza traccia sotto di loro; i flying coaster montano i passeggeri a faccia in giù. Produttori come B&M, Intamin e Mack hanno ciascuno progetti di vagone distintivi.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'front-row', 'back-row'],
    aliases: ['Auto', 'Car'],
  },
  {
    id: 'lap-bar',
    name: 'Barra inguinale',
    shortDefinition:
      'Un dispositivo di sicurezza orizzontale sulle ginocchia che consente maggiore libertà di movimento rispetto ai dispositivi sulle spalle.',
    definition:
      'Una barra inguinale è un dispositivo di sicurezza orizzontale che immobilizza i passeggeri sulle cosce superiori. A differenza dei dispositivi sulle spalle che avvolgono completamente il torso, le barre inguinali consentono al corpo superiore di muoversi più liberamente, creando una sensazione più aperta e meno restrittiva. Le barre inguinali sono standard sulla maggior parte dei coaster moderni, gigas e molti coaster tradizionali in acciaio e legno. Durante i momenti di airtime, le barre inguinali consentono ai passeggeri di sperimentare la piena sensazione di essere espulsi dal sedile, creando la sensazione che solo la barra li impedisce di volare fuori dal veicolo.\n\nLe barre inguinali sono preferite dagli appassionati per i coaster ad alto airtime perché forniscono la sensazione di airtime più inibita. Tuttavia, richiedono un corretto posizionamento e possono essere scomode per i rider con torsi più lunghi. I produttori hanno continuamente affinato il design della barra inguinale nel corso dei decenni, e le barre moderne sono significativamente più comode delle generazioni precedenti.',
    relatedTermIds: ['shoulder-harness', 'airtime', 'ride-cart'],
    aliases: ['Dispositivo inguinale'],
  },
  {
    id: 'shoulder-harness',
    name: 'Dispositivo sulle spalle',
    shortDefinition:
      'Un dispositivo di sicurezza sulle spalle che avvolge completamente il torso, limitando il movimento durante il viaggio.',
    definition:
      "Un dispositivo sulle spalle (anche chiamato dispositivo sulle spalle o harness OTS) è un dispositivo di sicurezza che scende su entrambe le spalle e attraverso le ginocchia, avvolgendo completamente il torso. I dispositivi sulle spalle erano standard sui coaster dagli anni '80 ai 2000 e rimangono comuni sui coaster invertiti, su alcuni coaster sospesi e sulle attrazioni familiari dove la sicurezza massima è prioritaria. I dispositivi moderni includono meccanismi di cricchetto che consentono una tensione variabile per adattarsi a diversi tipi di corpo.\n\nQuando si è seduti in un dispositivo sulle spalle su un coaster ad alto airtime, la sensazione è notevolmente diversa da una barra inguinale: i passeggeri non possono sollevarsi dal sedile in modo così drammatico perché il dispositivo li tiene verso il basso. Questo compromesso — maggiore sicurezza e comfort rispetto a una sensazione di airtime meno intensa — è una scelta di design chiave che i produttori fanno.",
    relatedTermIds: ['lap-bar', 'airtime', 'ride-cart'],
    aliases: ['Dispositivo OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Ricordo',
    shortDefinition:
      'Un oggetto commemorativo o un piccolo articolo acquistato in un parco a tema per ricordare una visita.',
    definition:
      "Un ricordo è un oggetto commemorativo fisico — merchandise, abbigliamento o articolo da collezione — acquistato dai visitatori per ricordare la loro visita al parco. I ricordi comuni includono magliette con loghi del parco, cappelli, spille, cartoline e peluche a tema. I ricordi servono sia uno scopo funzionale (abbigliamento indossabile) che uno emotivo — ancorano i ricordi di una visita specifica e creano connessioni durature con i parchi amati.\n\nI parchi a tema fanno molto affidamento sulle vendite di ricordi come flusso di entrate; il merchandise in genere porta un margine di 2–3x rispetto ai prezzi al dettaglio. Per molti ospiti, collezionare ricordi da più parchi è parte dell'esperienza — raccogliere spille, scambiarle con altri o costruire uno scaffale commemorativo.",
    relatedTermIds: ['merchandise', 'gift-shop', 'park-exclusive'],
    aliases: ['Souvenir', 'Ricordo commemorativo'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Prodotti ufficiali venduti da un parco a tema, inclusi abbigliamento, articoli da collezione e articoli a tema.',
    definition:
      "Il merchandise si riferisce a tutti i beni venduti da un parco a tema — dall'abbigliamento di marca (magliette, felpe, cappelli) agli articoli da collezione (spille, figurine, peluche), merchandise alimentare/bevande e articoli a tema speciale legati ad attrazioni specifiche o franchise. I parchi a tema operano vaste operazioni di merchandise che coprono dozzine di negozi, carrelli mobili e boutique specifiche. Il merchandise è un pilastro critico delle entrate per i parchi, generando spesso il 15–25% della spesa totale degli ospiti, secondo solo al cibo e alle bevande.\n\nI parchi moderni utilizzano strategie di merchandising sofisticate: articoli a edizione limitata stagionali, merchandise di collaborazione con franchise popolari, design esclusivi del parco non disponibili da nessun'altra parte, e versioni speciali legate alle nuove aperture di attrazioni o agli anniversari.",
    relatedTermIds: ['souvenir', 'gift-shop', 'park-exclusive'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Negozio di souvenir',
    shortDefinition:
      "Un negozio al dettaglio all'interno di un parco a tema che vende ricordi, merchandise e prodotti a tema.",
    definition:
      "Un negozio di souvenir è uno spazio al dettaglio all'interno di un parco a tema dedicato alla vendita di ricordi, merchandise e prodotti a tema — situato in un'area centrale (come una piazza principale) o integrato in aree tematiche specifiche e attrazioni. I grandi parchi gestiscono dozzine di negozi di souvenir che vanno da piccoli carrelli a grandi magazzini. I negozi di souvenir sono posizionati strategicamente nei punti di alto traffico: code di uscita dalle attrazioni principali, corridoi dell'hotel e ingressi/uscite del parco dove gli ospiti hanno tempo libero e inclinazione all'acquisto.\n\nI negozi di souvenir moderni utilizzano un design al dettaglio sofisticato: posizionamento dell'ingresso, ambiente a tema e collocamento strategico dei prodotti. Molte attrazioni fanno passare gli ospiti direttamente attraverso aree di merchandise — una strategia provata per aumentare gli acquisti d'impulso. I parchi utilizzano sempre più il merchandise IP (licenze e franchise) per giustificare i prezzi premium.",
    relatedTermIds: ['merchandise', 'souvenir', 'park-exclusive'],
    aliases: ['Negozio di ricordi'],
  },
  {
    id: 'park-exclusive',
    name: 'Esclusiva del parco',
    shortDefinition:
      "Un prodotto o articolo disponibile solo in un parco a tema specifico, non disponibile per l'acquisto altrove.",
    definition:
      "Il merchandise esclusivo del parco è un prodotto progettato e venduto solo in un parco a tema specifico o all'interno di un sistema di parchi — non disponibile per l'acquisto presso alcun rivenditore esterno. Gli articoli esclusivi del parco creano scarsità percepita, incoraggiano gli acquisti d'impulso dalla sensazione che l'articolo non può essere ottenuto altrove, e giustificano il prezzo premium (spesso 2–3x il margine di vendita al dettaglio tipico). Gli articoli esclusivi comuni includono abbigliamento a edizione limitata, spille da collezione, articoli a tema legati alle aperture di nuove attrazioni o agli eventi stagionali.\n\nLa strategia esclusiva del parco è fondamentale per la psicologia del merchandising moderno: i visitatori che hanno viaggiato lontano e speso notevolmente per l'ammissione sentono un impulso elevato di acquistare articoli che non possono ottenere a casa. I mercati secondari (piattaforme di rivendita online) dimostrano che gli articoli esclusivi rari e desiderati del parco mantengono e apprezzano il valore, promuovendo ulteriormente il comportamento da collezionista.",
    relatedTermIds: ['merchandise', 'souvenir', 'gift-shop'],
    aliases: ['Esclusivo'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Montagna russa in cui i passeggeri viaggiano in posizione prona.',
    definition:
      "Un flying coaster trasporta i passeggeri in posizione orizzontale prona, simulando la sensazione del volo. I treni ruotano dalla posizione seduta in stazione alla posizione orizzontale prima dell'inizio della corsa. Esempi notevoli: Manta (SeaWorld Orlando) e Tatsu (Six Flags Magic Mountain), entrambi di B&M.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    aliases: ['flyer', 'coaster volante', 'prone coaster', 'flying coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Montagna russa in acciaio per famiglie a tema vagone minerario.',
    definition:
      'Un mine train coaster è una montagna russa in acciaio per famiglie, stilizzata come un vagoncino minerario in fuga. Caratterizzato da velocità moderate, piccole discese e curve strette attraverso tunnel e formazioni rocciose tematizzate. Esempi: Big Thunder Mountain Railroad (parchi Disney) e Gold Rush (Plopsaland).',
    relatedTermIds: ['steel-coaster', 'themed-land'],
    aliases: ['mine coaster', 'vagone minerario', 'family coaster', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Montagna russa progettata per seguire il paesaggio naturale.',
    definition:
      'Un terrain coaster è costruito per sfruttare la topografia naturale — colline, valli e burroni — piuttosto che affidarsi interamente a strutture artificiali. La pista interagisce strettamente con il terreno, creando una sensazione di velocità e immersione. Esempi classici: The Beast (Kings Island) e Ravine Flyer II (Waldameer).',
    relatedTermIds: ['wooden-coaster', 'steel-coaster', 'airtime'],
    aliases: ['terrain coaster', 'coaster paesaggistico'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Montagna russa in acciaio senza pavimento, con i piedi a penzoloni.',
    definition:
      'Su un floorless coaster, il pavimento del veicolo si ritrae una volta che i passeggeri sono fissati, lasciando le gambe penzolanti sopra la rotaia. A differenza degli inverted coaster, la rotaia passa sotto il veicolo anziché sopra. B&M fu pioniera con Medusa (1999). Esempio europeo: Goliath (Walibi Holland).',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster', 'dive-coaster'],
    aliases: ['floorless', 'coaster senza pavimento', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Produttore americano responsabile del primo loop moderno.',
    definition:
      "Arrow Dynamics (fondata nel 1945) è stato un produttore americano pioniere che ha introdotto la rotaia tubolare in acciaio moderna e il primo loop verticale moderno su Corkscrew (Knott's Berry Farm, 1975). Le attrazioni Arrow sono note per i corkscrew e i suspended looping coaster. L'azienda dichiarò fallimento nel 2001 e i suoi asset furono acquisiti da S&S.",
    relatedTermIds: ['steel-coaster', 'corkscrew', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Produttore americano di montagne russe in legno con layout veloci e tortuosi.',
    definition:
      'Great Coasters International (GCI) è un produttore americano specializzato in montagne russe in legno. Fondato nel 1994, GCI è noto per i treni Millennium Flyer e layout con rapidi cambi di direzione e airtime sostenuto. Installazioni notevoli: Wodan (Europa-Park), Thunderhead (Dollywood) e Troy (Toverland).',
    relatedTermIds: ['wooden-coaster', 'airtime', 'rmc', 'terrain-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Produttore americano specializzato in coaster a lancio LSM/LIM — in Europa noto per la famiglia Sky Scream.',
    definition:
      "Premier Rides (fondato nel 1995, Baltimora, Maryland) è un produttore americano specializzato in sistemi di lancio a motore sincrono lineare (LSM) e a motore a induzione lineare (LIM). Lo Sky Rocket II — un compact launch coaster con un'inversione — si è diffuso nei parchi di medie dimensioni in tutto il mondo.\n\nIn Europa, Premier Rides è più noto attraverso Sky Scream all'Holiday Park (Haßloch, Germania), un launch coaster invertito diventato un'attrazione di riferimento regionale. La tecnologia LSM di Premier equipaggia anche Hagrid's Magical Creatures Motorbike Adventure a Universal Orlando.",
    aliases: ['Premier'],
    relatedTermIds: ['launch-coaster', 'gerstlauer', 'intamin'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Produttore tedesco di Monaco noto per gli spinning coaster con trick track, la piattaforma X-Car e il modello verticale Sky Loop.',
    definition:
      "Maurer Rides (Maurer AG, lavorazione dei metalli dal 1876, attrazioni dal 1993) è un produttore monacense. La serie SC di spinning coaster si distingue per il trick track — una sezione in cui il vagone si inclina lateralmente — e la piattaforma X-Car consente layout compatti altamente personalizzati con lanci e inversioni.\n\nIl Sky Loop è un loop verticale autonomo presente in molti parchi europei come attrazione che occupa poco spazio. Installazioni europee notevoli: Winja's Fear e Winja's Force a Phantasialand (Germania), spinning coaster indoor con trick track.",
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['spinning-coaster', 'xtreme-spinning-coaster', 'launch-coaster', 'gerstlauer'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Produttore italiano con uno dei più grandi portafogli di coaster familiari e attrazioni nel mondo — oltre 250 coaster installati.',
    definition:
      "Zamperla (fondato nel 1966, Altavilla Vicentina, Italia) è uno dei produttori di attrazioni più prolifici al mondo. Mentre Intamin, B&M e Mack puntano a grandi installazioni ad alta intensità, Zamperla si concentra su volume e accessibilità — i modelli Family Coaster, Mini Coaster, Twister e Disk'O Coaster sono elementi standard dei parchi di medie dimensioni e dei resort di tutto il mondo.\n\nLe dimensioni compatte e i requisiti di altezza moderati rendono le attrazioni Zamperla particolarmente diffuse nei parchi urbani europei, nei resort e nelle strutture coperte. L'azienda ha anche costruito Thunderbolt a Coney Island (New York).",
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'mine-train', 'gerstlauer'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Produttore americano noto per le torri pneumatiche, il compatto El Loco e i coaster Free Fly 4D.',
    definition:
      "S&S Worldwide (fondato nel 1994, Logan, Utah; acquisito da Sansei Technologies nel 2012) ha sviluppato inizialmente sistemi di caduta pneumatici — Space Shot e Turbo Drop — prima di espandere il catalogo ai coaster. L'El Loco è un coaster estremo compatto con una prima discesa oltre la verticale e un'inversione. Il Free Fly è un coaster 4D con sedile a rotazione libera.\n\nS&S ha anche acquisito i beni del leggendario Arrow Dynamics dopo il suo fallimento nel 2001. In Europa, le installazioni S&S sono meno comuni che in Nord America.",
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['launch-coaster', 'arrow-dynamics', 'gerstlauer'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Produttore bavarese specializzato in coaster familiari — oltre 190 installazioni in tutto il mondo.',
    definition:
      "Zierer (fondato nel 1930, Deggendorf, Baviera) è un produttore tedesco specializzato in montagne russe familiari e attrazioni classiche da parco. La gamma Force Coaster copre più livelli, dai modelli junior compatti alle installazioni Force Custom più veloci. I coaster Zierer si distinguono per la rotaia tubolare in acciaio, la qualità di marcia fluida e i requisiti di altezza moderati.\n\nCon oltre 190 montagne russe consegnate nel mondo, Zierer è uno dei costruttori europei più prolifici per numero di unità. Installazioni notevoli: Feuerdrache nel Legoland Deutschland e coaster familiari in parchi tedeschi, olandesi e scandinavi.",
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'mack-rides', 'gerstlauer'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition:
      'Inversione in cui il treno rimane brevemente capovolto a velocità quasi zero.',
    definition:
      "Uno stall (o zero-G stall) è un elemento in cui il treno entra in un'inversione al culmine e rallenta quasi fino all'arresto, lasciando i passeggeri capovolti. Sviluppato da Rocky Mountain Construction (RMC), l'elemento produce un lungo hangtime. Esempi famosi: Zadra (Energylandia) e Steel Vengeance (Cedar Point).",
    relatedTermIds: ['inversion', 'hangtime', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall', 'RMC stall', 'elemento hangtime', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Curva sopraelevata che genera airtime a metà cambiamento di direzione.',
    definition:
      "Un wave turn è una curva sopraelevata ad alta velocità che attraversa brevemente forze G negative o laterali, creando una sensazione di airtime nel mezzo della curva. Comune sulle attrazioni Rocky Mountain Construction, l'elemento combina cambio direzionale con ejector o floater airtime. Presente su Wildfire (Kolmården) e Untamed (Walibi Holland).",
    relatedTermIds: ['airtime', 'overbank', 'ejector-airtime', 'rmc', 'lateral-gs'],
    aliases: ['wave turn', 'curva con airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Mezza Stagione',
    shortDefinition: 'Periodo tra alta e bassa stagione con affluenza moderata.',
    definition:
      "La mezza stagione indica i periodi di transizione tra la stagione di punta e i momenti più tranquilli di un parco. Tipicamente primavera (marzo–maggio) e inizio autunno (settembre–ottobre) nei parchi europei. L'affluenza è moderata, i prezzi spesso più bassi e la maggior parte delle attrazioni è aperta — un periodo apprezzato dagli appassionati.",
    relatedTermIds: ['crowd-forecast', 'school-holiday', 'crowd-level'],
    aliases: ['bassa stagione', 'shoulder season', 'stagione intermedia', 'off-peak'],
  },
  {
    id: 'school-holiday',
    name: 'Vacanze Scolastiche',
    shortDefinition: 'Periodi di vacanza scolastica che causano picchi di affluenza ai parchi.',
    definition:
      'Le vacanze scolastiche — estive, natalizie, pasquali e di metà anno — sono il principale fattore che determina i picchi di affluenza nei parchi a tema. Le famiglie con bambini concentrano le visite in questi periodi. I parchi spesso estendono gli orari, arricchiscono il programma e aumentano i prezzi. Evitare le vacanze scolastiche è la strategia più efficace per ridurre i tempi di attesa.',
    relatedTermIds: ['crowd-forecast', 'shoulder-season', 'crowd-level'],
    aliases: [
      'vacanze',
      'vacanze estive',
      'vacanze di Natale',
      'vacanze di Pasqua',
      'school holiday',
      'school holidays',
    ],
  },
  {
    id: 'photo-pass',
    name: 'Fotopass',
    shortDefinition: 'Servizio per foto e video digitali illimitati nel parco.',
    definition:
      "Un fotopass (o Memory Maker) è un'opzione aggiuntiva che dà accesso digitale a tutte le foto e i video professionali scattati durante la visita — incluse foto delle attrazioni, incontri con i personaggi e fotografi itineranti. Venduto a tariffa fissa, può essere conveniente per le famiglie. Esempi: Memory Maker (Disney) e Photo Pass (Universal).",
    relatedTermIds: ['ride-photo', 'character-meet-and-greet', 'season-pass'],
    aliases: ['Memory Maker', 'pacchetto foto', 'foto del parco', 'photo pass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Pass Accessibilità',
    shortDefinition:
      'Pass per ospiti con disabilità per accedere alle attrazioni con attesa ridotta.',
    definition:
      "Un pass accessibilità (DAS – Disability Access Service, carta accessibilità o pass accesso attrazione) viene rilasciato agli ospiti che non possono fare la fila tradizionale a causa di una disabilità. Permette all'ospite e a un gruppo di accompagnatori di tornare a un orario stabilito invece di aspettare fisicamente. Criteri e procedure variano per parco e paese.",
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: [
      'DAS',
      'Disability Access Service',
      'carta disabilità',
      'accessibility pass',
      'pass disabili',
    ],
  },
  {
    id: 'motion-simulator',
    name: 'Simulatore',
    shortDefinition: 'Attrazione che combina piattaforma mobile e proiezione cinematografica.',
    definition:
      "Un simulatore combina una piattaforma mobile idraulica o elettrica con una grande proiezione, sincronizzando i movimenti fisici con l'azione sullo schermo per creare esperienze immersive senza rotaia tradizionale. La capacità è generalmente alta e l'esperienza può essere rinnovata cambiando il film. Esempi: Star Tours (Disney), Mystic Manor (HKDL).",
    relatedTermIds: ['dark-ride', 'trackless-ride', 'pre-show', 'animatronics'],
    aliases: [
      'simulatore di volo',
      'attrazione 4D',
      'cinema dinamico',
      'motion simulator',
      'sim ride',
    ],
  },
  {
    id: 'character-meet-and-greet',
    name: 'Incontro con i Personaggi',
    shortDefinition: 'Opportunità programmata per incontrare un personaggio in costume.',
    definition:
      "Un incontro con i personaggi è un'area dedicata o un evento programmato in cui gli ospiti possono incontrare personaggi in costume, scattare foto e ricevere autografi. Molto diffuso nei parchi Disney e Universal, i personaggi più richiesti hanno spesso aree dedicate con code separate. Particolarmente apprezzato dalle famiglie con bambini.",
    relatedTermIds: ['photo-pass', 'character-dining', 'themed-land'],
    aliases: [
      'meet and greet',
      'incontro personaggio',
      'character meet and greet',
      'apparizione personaggio',
    ],
  },
  {
    id: 'pre-show',
    name: 'Pre-Show',
    shortDefinition:
      "Area di attesa che prepara gli ospiti a un'attrazione con narrazione introduttiva.",
    definition:
      "Un pre-show è un elemento di ambientazione in un'attrazione tematizzata dove gli ospiti si riuniscono prima del percorso principale per ricevere contesto narrativo, istruzioni di sicurezza o intrattenimento introduttivo. I pre-show svolgono funzioni sia narrative che operative. Esempi famosi: la stanza elastica dell'Haunted Mansion e il video di sicurezza di Guardians of the Galaxy – Mission: BREAKOUT!.",
    relatedTermIds: ['dark-ride', 'motion-simulator', 'animatronics', 'themed-land'],
    aliases: ['pre show', 'area di attesa tematizzata', 'zona pre-imbarco'],
  },
  {
    id: 'quick-service',
    name: 'Self-Service',
    shortDefinition: 'Ristorante a banco senza personale di sala.',
    definition:
      'Il self-service (detto anche counter service) indica i ristoranti del parco dove gli ospiti ordinano al banco e portano il cibo autonomamente al tavolo. È la formula più comune nei parchi a tema, apprezzata per velocità e praticità. Disney ha reso popolare il termine "quick service" per distinguerlo dal "table service" nel suo sistema di prenotazione.',
    relatedTermIds: ['table-service', 'character-dining'],
    aliases: [
      'counter service',
      'fast food',
      'self service',
      'quick service',
      'ristorazione veloce',
    ],
  },
  {
    id: 'table-service',
    name: 'Servizio al Tavolo',
    shortDefinition: 'Ristorante con personale di sala dove spesso sono richieste prenotazioni.',
    definition:
      "I ristoranti con servizio al tavolo nei parchi a tema offrono un'esperienza seduta completa con personale. Le prenotazioni (spesso apribili 60–180 giorni prima nei parchi Disney) sono fortemente consigliate poiché i locali più richiesti si esauriscono rapidamente. Il servizio al tavolo è più costoso del self-service ma offre qualità superiore e un'atmosfera rilassata.",
    relatedTermIds: ['quick-service', 'character-dining'],
    aliases: ['table service', 'ristorante con servizio', 'cena con prenotazione'],
  },
  {
    id: 'character-dining',
    name: 'Cena con i Personaggi',
    shortDefinition:
      'Ristorante in cui i personaggi in costume visitano i tavoli durante il pasto.',
    definition:
      "Il character dining è un'esperienza di ristorazione (servizio al tavolo o buffet) in cui i personaggi in costume visitano ogni tavolo per interagire con gli ospiti, scattare foto e firmare autografi. Garantisce l'incontro con i personaggi senza una coda separata, rendendolo molto apprezzato dalle famiglie. Esempi: Chef Mickey's (Disney World) e lo Storybook Dining all'Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['table-service', 'character-meet-and-greet', 'quick-service'],
    aliases: [
      'colazione con personaggi',
      'pranzo con personaggi',
      'character dining',
      'cena personaggi',
    ],
  },
];

export default translations;
