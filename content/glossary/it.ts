import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Tempo di attesa',
    shortDefinition:
      "Il tempo stimato che un ospite deve trascorrere in fila prima di accedere a un'attrazione.",
    definition:
      "Il tempo di attesa è la durata stimata che un ospite trascorre in coda prima di poter salire su un'attrazione. I parchi mostrano i tempi di attesa agli ingressi delle attrazioni e nelle loro app. park.fan traccia i tempi di attesa in diretta aggiornati ogni minuto.",
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Tempi di attesa'],
    alternateNames: ['Fila', 'Tempo in coda', 'Tempo di coda'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Una corsia separata per gli ospiti disposti a viaggiare da soli per riempire i posti vuoti.',
    definition:
      'La corsia Single Rider permette agli ospiti disposti a viaggiare da soli di occupare i posti vuoti nei veicoli delle attrazioni. Poiché i Single Rider si inseriscono negli spazi liberi, la coda avanza molto più velocemente della fila standard — spesso con tempi di attesa del 50–70% inferiori. Non tutte le attrazioni offrono questa opzione; verificate prima di mettervi in fila.',
    alternateNames: ['Single Rider Lane', 'Fila individuale'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'virtual-queue',
    name: 'Coda virtuale',
    shortDefinition:
      'Un sistema di coda digitale in cui gli ospiti prenotano un orario invece di attendere fisicamente.',
    definition:
      "Una coda virtuale permette agli ospiti di registrarsi per un'attrazione tramite un'app o un chiosco e ricevere una notifica quando si avvicina il loro turno. Invece di fare la coda fisicamente, gli ospiti possono godersi altre aree del parco e tornare quando chiamati.",
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Code virtuali'],
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Un upgrade del biglietto a pagamento o incluso che dà accesso a una corsia prioritaria più breve.',
    definition:
      "Un Pass Express (il nome varia per parco — Universal Express, Disney Lightning Lane, ecc.) è un upgrade che consente ai titolari di utilizzare un ingresso prioritario dedicato con attese significativamente più brevi. Usa il calendario dell'affluenza di park.fan per decidere se un Pass Express vale il costo.",
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'posted-wait-time',
    name: 'Tempo segnalato',
    shortDefinition:
      "Il tempo di attesa ufficiale mostrato dal parco all'ingresso di un'attrazione.",
    definition:
      "Il tempo segnalato è la stima ufficiale visualizzata sui cartelli all'ingresso fisico di un'attrazione e/o nell'app ufficiale del parco. park.fan aggrega i tempi di attesa segnalati da fonti ufficiali ogni minuto.",
    relatedTermIds: ['crowd-level', 'wait-time'],
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
    aliases: ['Giorni di punta'],
    alternateNames: ['Alta Stagione', 'Giornata Affollata', 'Giorno ad alta affluenza'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Ristrutturazione',
    shortDefinition:
      "Un periodo di chiusura pianificata durante il quale un'attrazione viene sottoposta a manutenzione o miglioramenti.",
    definition:
      "Una ristrutturazione è un periodo di manutenzione o rinnovo programmato durante il quale un'attrazione, uno spettacolo o un'area del parco è temporaneamente chiusa. Le ristrutturazioni possono durare da pochi giorni a diversi mesi. park.fan indica le attrazioni in ristrutturazione per includerle nella pianificazione.",
    aliases: ['Ristrutturazioni'],
    alternateNames: ['Manutenzione', 'Refurb', 'Rehab', 'Chiusura per manutenzione'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Tempo fermo',
    shortDefinition:
      "Una chiusura temporanea non pianificata di un'attrazione, spesso dovuta a un guasto tecnico.",
    definition:
      "Il tempo fermo si riferisce a una chiusura temporanea non programmata di un'attrazione — distinta da una ristrutturazione pianificata. I tempi fermi sono causati da malfunzionamenti tecnici, controlli di sicurezza, incidenti o condizioni meteorologiche avverse. park.fan mostra lo stato operativo attuale di ogni attrazione tracciata in tempo reale.",
    aliases: ['Guasti'],
    alternateNames: ['Fuori Servizio', 'Problema Tecnico', 'Interruzione'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: "Capacità dell'attrazione",
    shortDefinition: "Il numero di ospiti che un'attrazione può ospitare per ora.",
    definition:
      "La capacità di un'attrazione è il numero massimo di ospiti che può trasportare per ora in condizioni operative ottimali. La capacità dipende dalla dimensione del veicolo, dal numero di veicoli in funzione, dalla velocità di carico e scarico e dal tempo del ciclo. La capacità determina direttamente la velocità di avanzamento della coda.",
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Il momento in cui un parco apre ufficialmente i suoi cancelli e le code per le attrazioni popolari sono più brevi.',
    definition:
      'Il Rope Drop si riferisce al momento in cui un parco a tema apre per la giornata — il nome deriva dalla corda (o barriera) che il personale abbassa per consentire ai primi ospiti di entrare. Arrivare al Rope Drop è una strategia popolare perché le attrazioni popolari hanno le code più brevi al mattino, prima che le folle si radunino. Il calendario di park.fan mostra gli orari di apertura esatti per pianificare la vostra strategia.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      "Un vantaggio esclusivo che consente agli ospiti degli hotel del resort di entrare nel parco prima dell'apertura generale.",
    definition:
      "L'Early Entry (chiamato anche Extra Magic Hours o Early Park Entry) permette agli ospiti degli hotel partner di accedere al parco 30–60 minuti prima del pubblico generale. Durante questa finestra, le code alle attrazioni più popolari sono notevolmente più brevi. Nei giorni di punta, combinare l'Early Entry con un piano di visita strategico consente di vivere più attrazioni principali con attese minime.",
    alternateNames: [
      'Extra Magic Hours',
      'Accesso Anticipato',
      'Early Park Entry',
      'Ingresso anticipato',
    ],

    relatedTermIds: ['express-pass', 'peak-day', 'rope-drop'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un supplemento al biglietto che consente di visitare più parchi dello stesso resort nello stesso giorno.',
    definition:
      "Un biglietto Park Hopper permette di accedere a due o più parchi gestiti dallo stesso resort in una singola giornata. L'opzione Park Hopper di Disney, ad esempio, consente di spostarsi tra Magic Kingdom, EPCOT, Hollywood Studios e Animal Kingdom dopo le 14:00. È particolarmente utile quando attrazioni o esperienze specifiche sono distribuite su più parchi.",
    alternateNames: ['Park Hopping', 'Biglietto multiparco'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Abbonamento annuale',
    shortDefinition: 'Un biglietto annuale che consente visite illimitate al parco per 12 mesi.',
    definition:
      "Un abbonamento annuale (Annual Pass) garantisce ingressi illimitati a uno o più parchi per un periodo di 12 mesi. I livelli superiori spesso includono vantaggi come sconti sulla ristorazione, parcheggio gratuito e sconti sul merchandising. Alcuni abbonamenti prevedono date di esclusione (blockout dates) nei giorni di punta. Per i visitatori abituali — generalmente tre o più visite all'anno — l'abbonamento è quasi sempre più conveniente dei biglietti singoli.",
    alternateNames: ['Annual Pass', 'Season Pass', 'Tessera Annuale', 'Abbonamento stagionale'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
  },
  {
    id: 'height-requirement',
    name: 'Altezza minima',
    shortDefinition:
      "Un'altezza minima che gli ospiti devono raggiungere per accedere a un'attrazione specifica.",
    definition:
      "L'altezza minima è una regola di sicurezza stabilita dai parchi per garantire che i sistemi di ritenuta — barre di sicurezza, spallacci, cinture — funzionino correttamente per ogni passeggero. Varia generalmente tra 90 e 140 cm a seconda dell'intensità dell'attrazione. Alcune attrazioni hanno anche un'altezza o un peso massimo. Verificate sempre i requisiti di altezza prima di visitare con bambini piccoli.",
    aliases: ['Altezze minime', 'requisiti minimi di altezza'],
    alternateNames: ['Requisito di Altezza', 'Limite di Altezza', 'Altezza richiesta'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Area tematica',
    shortDefinition:
      "Una zona autonoma all'interno di un parco a tema costruita attorno a un tema coerente.",
    definition:
      "Un'area tematica è una zona distinta di un parco a tema che combina un design visivo unificato, una storia di sfondo e attrazioni, ristoranti e negozi a tema. Esempi celebri includono Il Mondo Magico di Harry Potter agli Universal Studios, Star Wars: Galaxy's Edge nei parchi Disney e Skandinavien a Europa-Park. Le aree tematiche creano un'esperienza immersiva e sono spesso le zone più fotografate del parco.",
    aliases: ['Aree tematiche'],
    alternateNames: ['Zona Tematica', 'Land', 'Mondo tematico'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      "L'apertura non ufficiale di un'attrazione prima della data di lancio annunciata.",
    definition:
      'Un Soft Opening avviene quando un parco apre silenziosamente una nuova attrazione o area prima della data ufficiale — spesso senza alcun annuncio. I parchi utilizzano i Soft Opening per testare i sistemi in condizioni reali, individuare problemi operativi e ottimizzare le procedure di imbarco. Poiché possono iniziare e interrompersi senza preavviso, rappresentano un bonus per i visitatori fortunati che si trovano nel parco, ma non una base affidabile per la pianificazione. Forum e social media di solito sono i primi a segnalarli.',
    alternateNames: ['Soft Launch', 'Apertura anticipata'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      "La fila d'attesa classica di un'attrazione, senza prenotazione né pass speciale.",
    definition:
      "La coda Standby è la normale fila d'attesa fisica accessibile a tutti gli ospiti senza biglietto aggiuntivo o upgrade. Chi si mette in Standby aspetta in ordine di arrivo — il tempo indicato riflette direttamente l'affluenza attuale all'attrazione. Nei giorni più affollati, i tempi di Standby per le attrazioni principali possono superare i 90 minuti. park.fan traccia i tempi Standby in tempo reale per aiutarvi a trovare sempre la fila più breve.",
    aliases: ['Fila standby'],
    alternateNames: ['Fila Normale', 'Fila Standard', 'Coda regolare'],

    relatedTermIds: ['express-pass', 'single-rider', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Il sistema di accesso prioritario a pagamento di Disney, successore del programma FastPass+.',
    definition:
      "Lightning Lane è il nome dato da Disney al suo sistema di coda prioritaria, introdotto nel 2021 come successore del gratuito FastPass+. Esiste in due formule: Individual Lightning Lane (ILL), venduta separatamente per le attrazioni più richieste, e Lightning Lane Multi Pass (LLMP), un abbonamento giornaliero che consente di prenotare fasce orarie di ritorno su una selezione di attrazioni. La Lightning Lane ha generato ampio dibattito nella comunità perché ha trasformato un vantaggio prima gratuito in un servizio a pagamento. Il calendario dell'affluenza di park.fan vi aiuta a valutare in quali giorni la Lightning Lane vale il costo.",
    alternateNames: ['Lightning Lane Multi Pass', 'Individual Lightning Lane', 'LLMP', 'ILL'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Il precedente abbonamento giornaliero di Disney che forniva accesso alla Lightning Lane Multi Pass sulla maggior parte delle attrazioni.',
    definition:
      "Genie+ (ora rinominato Lightning Lane Multi Pass) era l'add-on giornaliero a pagamento di Disney che ha sostituito FastPass+. Con una tariffa per persona al giorno, gli ospiti potevano prenotare un posto Lightning Lane alla volta su un'ampia selezione di attrazioni. Le attrazioni di punta erano escluse e vendute separatamente come Individual Lightning Lane. Il prezzo di Genie+ era dinamico e aumentava nei giorni più affollati. park.fan traccia i livelli di affluenza in dettaglio per aiutarvi a decidere se l'abbonamento vale la pena.",
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      "Un numero di allocazione nel sistema di coda virtuale che consente l'accesso a un'attrazione quando il gruppo viene chiamato.",
    definition:
      "Un Boarding Group è un'allocazione numerata all'interno di un sistema di coda virtuale, utilizzato principalmente per le attrazioni più richieste dove una coda fisica sarebbe impraticabile. Gli ospiti si registrano tramite l'app del parco — spesso all'apertura — e ricevono un numero di gruppo. Quando quel numero viene chiamato, hanno una finestra limitata per presentarsi all'attrazione. Nei giorni molto affollati, tutti i Boarding Group possono esaurirsi in pochi minuti. Il sistema di Disney su attrazioni come Tron Lightcycle Run e Star Wars: Rise of the Resistance ha reso questo concetto noto in tutta la comunità dei parchi.",
    alternateNames: ['Boarding Groups'],

    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Fuori stagione',
    shortDefinition:
      "Periodi di minore affluenza che offrono code più brevi, prezzi più bassi e un'esperienza più rilassata.",
    definition:
      "Il periodo fuori stagione corrisponde ai momenti più tranquilli del calendario, quando le scuole sono aperte e non cadono grandi festività — tipicamente da gennaio a inizio febbraio, da metà settembre a ottobre (esclusi gli eventi Halloween) e le prime settimane di novembre. In questi periodi, i tempi di attesa per le attrazioni popolari possono essere notevolmente più brevi, i prezzi dei biglietti spesso ai minimi e i parchi molto meno affollati. Per i visitatori con orari flessibili, scegliere il fuori stagione è una delle strategie più efficaci. Il calendario dell'affluenza di park.fan evidenzia queste finestre per aiutarvi a pianificare.",
    alternateNames: ['Bassa Stagione', 'Fuori Stagione', 'Periodo Tranquillo'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'Chiusura stagionale',
    shortDefinition:
      'Periodo di chiusura stagionale in cui il parco è completamente chiuso al pubblico per manutenzione, lavori o pausa invernale.',
    definition:
      "La chiusura stagionale (o OffSeason) è il periodo in cui un parco a tema chiude completamente i battenti — non una semplice fase di minor affluenza, ma un vero e proprio fermo operativo. I parchi sfruttano questa finestra per effettuare la manutenzione essenziale su attrazioni e impianti, avviare importanti lavori di ristrutturazione impossibili durante l'esercizio e consentire al personale un periodo di riposo prima della nuova stagione. Le chiusure stagionali avvengono più spesso nei mesi invernali e durano da qualche settimana a diversi mesi a seconda del parco e del clima. In questo periodo non sono accessibili attrazioni, ristoranti o spettacoli.\n\nQuando park.fan mostra lo stato OffSeason per un parco, significa che non è disponibile alcun calendario operativo per il periodo corrente e che la prossima data di apertura confermata è ancora a qualche settimana. Controlla il sito ufficiale del parco per la data esatta di riapertura — i parchi più popolari esauriscono spesso i biglietti dei primi giorni di riapertura molto rapidamente.",
    aliases: ['Off-Season'],
    alternateNames: ['Chiusura Invernale', 'Pausa stagionale'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
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
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Code', 'Fila', 'File'],
  },
  {
    id: 'opening-day',
    name: "Giorno dell'inaugurazione",
    shortDefinition: 'La data ufficiale di apertura di un nuovo parco, area tematica o attrazione.',
    definition:
      "Il giorno dell'inaugurazione è la data ufficialmente annunciata in cui un nuovo parco, un'espansione o un'attrazione apre al grande pubblico per la prima volta. Questi giorni sono eventi importanti nella comunità dei parchi a tema: attirano grande attenzione mediatica, lunghe code e un'atmosfera festosa. I parchi organizzano spesso cerimonie di inaugurazione con spettacoli speciali e apparizioni di personaggi. Poiché il giorno dell'inaugurazione attira molti visitatori, raramente è il momento migliore per scoprire una nuova attrazione con tempi di attesa brevi. I Soft Opening precedono talvolta la data ufficiale.",
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      "Un sistema che consente agli accompagnatori di alternare il giro mentre l'altro aspetta con bambini che non soddisfano il requisito di altezza.",
    definition:
      "Il Rider Switch (detto anche Child Swap) è un sistema disponibile nella maggior parte dei grandi parchi a tema che consente a un gruppo di alternarsi su un'attrazione quando un membro — tipicamente un bambino che non raggiunge l'altezza minima — non può partecipare. Un adulto sale sull'attrazione mentre l'altro aspetta all'ingresso con il bambino; al ritorno del primo adulto, il secondo può imbarcarsi immediatamente senza rimettersi in coda. Ai parchi Disney il sistema si chiama Rider Switch; agli Universal si chiama Child Swap. Nei giorni affollati, il secondo adulto salta di fatto l'intera attesa in coda — un vantaggio significativo. Chiedete agli operatori all'ingresso per attivarlo.",
    alternateNames: ['Child Swap', 'Rider Switch', 'Cambio Genitore', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      "Una data in cui certi livelli di abbonamento annuale non sono validi per l'ingresso al parco, tipicamente nei giorni più affollati dell'anno.",
    definition:
      "Le Blockout Date (dette anche blackout date) sono giorni specifici del calendario in cui certi livelli di abbonamento annuale non sono validi per l'ingresso. I parchi implementano queste date per gestire la capacità nei giorni più affollati — festività, weekend di punta ed eventi speciali. Gli abbonamenti di livello superiore hanno meno o nessuna Blockout Date, mentre gli abbonamenti base possono essere bloccati su 30–60 giorni all'anno. Verificate sempre il calendario delle Blockout Date prima di visitare se possedete un abbonamento con restrizioni. Il calendario dell'affluenza di park.fan evidenzia i periodi di punta così potete incrociare le informazioni con le restrizioni del vostro abbonamento.",
    aliases: ['Giorni bloccati'],
    alternateNames: ['Blackout Date', 'Data di esclusione'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento a biglietto separato',
    shortDefinition:
      "Un evento serale o speciale con biglietto dedicato che richiede un'ammissione separata dal normale biglietto del parco, come le feste di Halloween o Natale.",
    definition:
      "Un evento a biglietto separato (hard ticket event) è un evento — tipicamente serale — organizzato in un parco a tema che richiede un biglietto dedicato oltre all'ammissione ordinaria. Questi eventi offrono intrattenimento esclusivo, decorazioni tematiche e incontri con i personaggi non disponibili durante gli orari normali. Esempi celebri includono Mickey's Not-So-Scary Halloween Party e Mickey's Very Merry Christmas Party a Walt Disney World, Halloween Horror Nights agli Universal Studios e gli eventi stagionali a Disneyland Paris. Nei giorni degli eventi, gli ospiti normali vengono solitamente invitati a lasciare il parco entro le 18:00–19:00. I biglietti si esauriscono spesso con settimane di anticipo.",
    aliases: ['Eventi speciali'],
    alternateNames: ['Serata Speciale', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "L'ex sistema di coda prioritaria gratuita di Disney, sostituito dal Lightning Lane a pagamento nel 2021.",
    definition:
      "FastPass+ (originariamente FastPass, introdotto nel 1999) era il sistema di coda prioritaria gratuita di Disney che consentiva agli ospiti di prenotare finestre orarie di ritorno per le attrazioni senza costi aggiuntivi. A Walt Disney World, gli ospiti potevano prenotare fino a tre prenotazioni FastPass+ al giorno tramite l'app My Disney Experience. Il sistema fu sospeso durante la chiusura per COVID-19 nel 2020 e mai ripristinato — sostituito dal sistema Lightning Lane a pagamento alla fine del 2021. FastPass+ rimane uno dei cambiamenti più discussi nella storia Disney perché ha trasformato un vantaggio gratuito in un servizio a pagamento. Comprendere il vecchio sistema è utile per leggere i resoconti di viaggio più datati.",
    alternateNames: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
  },
  {
    id: 'return-time',
    name: 'Orario di ritorno',
    shortDefinition:
      "Una finestra oraria prenotata per tornare a un'attrazione, emessa da Lightning Lane, dalla coda virtuale o da sistemi simili di accesso prioritario.",
    definition:
      "Un orario di ritorno (return time) è un periodo specifico — tipicamente un blocco di un'ora — durante il quale un ospite che ha prenotato l'accesso prioritario (tramite Lightning Lane, coda virtuale o sistema simile) può presentarsi all'ingresso dedicato dell'attrazione. Gli orari di ritorno consentono agli ospiti di esplorare altre parti del parco nell'intervallo invece di stare in coda fisica. Perdere la propria finestra oraria (di solito definita come un ritardo superiore a un certo numero di minuti) comporta in genere la perdita della prenotazione. I dati sui tempi di attesa e i livelli di affluenza di park.fan possono aiutarvi a decidere quali attrazioni prioritizzare per la prenotazione dell'orario di ritorno.",
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Orari di ritorno', 'Ora di ritorno', 'Ore di ritorno'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      "Exclusive Ride Time — una sessione in cui un gruppo di appassionati o ospiti dell'hotel ha accesso esclusivo a una o più attrazioni senza la coda del pubblico generale.",
    definition:
      "ERT (Exclusive Ride Time) è un periodo durante il quale un gruppo selezionato — tipicamente membri di un club di appassionati di montagne russe, ospiti degli hotel del resort o possessori di abbonamento annuale — ha accesso esclusivo a un'attrazione o a un set di attrazioni senza il pubblico generale. Durante l'ERT, i partecipanti possono salire ripetutamente con attese minime, raggiungendo spesso decine di giri in una singola sessione. Gli eventi ERT sono organizzati dai parchi per raduni di club speciali (come l'European Coaster Club o gli incontri dell'American Coaster Enthusiasts), per pacchetti hotel premium o come parte di eventi after-hours. Per gli appassionati, l'ERT è una delle esperienze più preziose nei parchi — rivela il vero carattere di un'attrazione senza la pressione della coda.",
    aliases: ['ERT'],
    alternateNames: ['Exclusive Ride Time', 'Tempo esclusivo in attrazione'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario dettagliato e ottimizzato per una visita al parco a tema che sequenzia le attrazioni per minimizzare i tempi di attesa e massimizzare il numero di giri in un giorno.',
    definition:
      "Un Touring Plan è una sequenza pre-pianificata di attrazioni, orari dei pasti e spostamenti nel parco progettata per minimizzare il tempo totale di attesa nell'arco della giornata. I Touring Plan efficaci tengono conto dei modelli di affluenza (quali aree del parco si riempiono prima), delle capacità delle attrazioni, delle dinamiche delle code, degli orari degli spettacoli e del meteo. Siti come TouringPlans.com (ora Thrill-Data) pubblicano piani dettagliati basati sulla folla per i parchi principali. I tempi di attesa in diretta e il calendario dell'affluenza di park.fan sono strumenti complementari: controllare i dati in tempo reale durante la giornata consente aggiustamenti al volo al vostro piano. Nei giorni affollati, un buon Touring Plan può ridurre il tempo totale in coda del 30–50% rispetto a un approccio spontaneo.",
    aliases: ['Touring Plan'],
    alternateNames: ['Piano di Visita', 'Itinerario', 'Pianificazione visita'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      "Un'attrazione al coperto in cui i visitatori viaggiano su veicoli guidati attraverso scene illuminate e ambienti tematizzati.",
    definition:
      "Un dark ride è un'attrazione al chiuso in cui gli ospiti viaggiano su veicoli — vagoni su rotaia, piattaforme girevoli, barche o sistemi a guida automatica — attraverso una serie di scene illuminate e ambienti tematizzati. Il termine 'dark' (buio) si riferisce all'ambiente tipicamente oscurato che amplifica gli effetti visivi, le proiezioni e l'illuminazione scenografica. I dark ride spaziano dalle esperienze per famiglie (come Pinocchio ai parchi Disney) ai thriller ad alta intensità (come Hagrid's Magical Creatures Motorbike Adventure a Universal). Sono tra le attrazioni con la maggiore capacità oraria nei parchi moderni, il che li rende punti di riferimento centrali in qualsiasi Touring Plan.",
    aliases: ['Dark Rides'],
    alternateNames: ['Attrazione al Coperto', 'Attrazione al chiuso'],

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
      "Bolliger & Mabillard, un costruttore svizzero di montagne russe noto per giri fluidi, affidabili e con elementi firma come l'Immelmann, il Cobra Roll e lo Zero-g Roll.",
    definition:
      "B&M (Bolliger & Mabillard) è un costruttore svizzero di montagne russe fondato nel 1988 da Walter Bolliger e Claude Mabillard. L'azienda è rinomata per produrre giri eccezionalmente fluidi e affidabili con un'esperienza caratterizzata da G-force positive, inversioni firma (Immelmann, Cobra Roll, Zero-g Roll) e ottima capacità. B&M è specializzata in coaster invertiti, looper, hyper coaster (oltre 60 m), giga coaster (oltre 91 m), wing coaster e dive machine. Quasi ogni grande parco europeo presenta almeno un'installazione B&M, tra cui Shambhala e Dragon Khan a PortAventura, Silver Star a Europa-Park, Nemesis ad Alton Towers e Goliath a Walibi Holland.",
    aliases: ['Bolliger & Mabillard', 'Bolliger and Mabillard'],

    relatedTermIds: ['cobra-roll', 'dive-coaster', 'hybrid-coaster', 'immelmann', 'zero-g-roll'],
  },
  {
    id: 'intamin',
    name: 'Intamin',
    shortDefinition:
      "Un costruttore svizzero di giostre e montagne russe noto per i lanci idraulici da record, i mega/giga coaster e i design innovativi — l'azienda dietro alcune delle giostre più veloci e alte del mondo.",
    definition:
      "Intamin AG è un costruttore svizzero di giostre fondato nel 1967, responsabile di alcuni dei record più ambiziosi nella storia delle montagne russe. Il loro sistema di lancio idraulico ha alimentato per anni i coaster più veloci e alti del mondo (Kingda Ka, 139 m; Top Thrill Dragster). Intamin è nota anche per i suoi mega e giga coaster (tra cui Millennium Force a Cedar Point e Intimidator 305 a Kings Dominion), i multi-launch coaster, le attrazioni acquatiche e i dark ride. I loro design sono spesso all'avanguardia in termini di scala e innovazione. Le installazioni europee di Intamin includono Taron e Black Mamba a Phantasialand e Red Force a Ferrari Land.",
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Un costruttore tedesco a conduzione familiare di Waldkirch vicino a Europa-Park, che produce attrazioni acquatiche, dark ride e montagne russe in acciaio sempre più ambiziose.',
    definition:
      "Mack Rides è un costruttore di giostre tedesco con sede a Waldkirch, nel Baden-Württemberg — a pochi chilometri da Europa-Park, la vetrina di punta dell'azienda. Fondato nel 1921, Mack produce attrazioni acquatiche, dark ride (tra cui Test Track e Radiator Springs Racers di Disney) e un portafoglio in crescita di coaster ad alta adrenalina. Il loro Blue Fire Megacoaster a Europa-Park (2009) è stato il primo giro a includere l'elemento Stengel Dive. I più recenti hyper coaster di Mack (Ride to Happiness a Plopsaland, Kondaa a Walibi Belgium) hanno ricevuto ampi consensi dalla comunità degli appassionati. Mack Rides è una presenza fondamentale nei parchi europei, in particolare nel proprio Europa-Park.",
    aliases: ['Mack'],

    relatedTermIds: ['b-and-m', 'intamin', 'launch-coaster', 'stengel-dive'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      "Rocky Mountain Construction, un costruttore dell'Idaho che ha inventato il concetto di coaster ibrido convertendo le vecchie montagne russe in legno su binari in acciaio I-box, offrendo airtime e inversioni senza precedenti.",
    definition:
      'Rocky Mountain Construction (RMC) è un costruttore americano di montagne russe con sede a Hayden, Idaho, noto soprattutto per aver inventato il sistema di binari in acciaio I-box che può essere applicato sulle strutture in legno delle montagne russe esistenti. Questa tecnologia di conversione ha permesso ai parchi di trasformare i vecchi coaster in legno consumati in giri ibridi di livello mondiale con airtime intenso, multiple inversioni e discese oltre la verticale. Le conversioni RMC come Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) e Wildfire (Kolmården) sono rapidamente diventate le preferite degli appassionati. In Europa, il nuovo coaster ibrido RMC Untamed a Walibi Holland è ampiamente considerato uno dei migliori del continente.',
    aliases: ['Rocky Mountain Construction'],

    relatedTermIds: ['airtime', 'barrel-roll-drop', 'hybrid-coaster', 'stall', 'wooden-coaster'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      "Produttore olandese di montagne russe e uno dei più prolifici al mondo, noto per l'onnipresente Boomerang e per un'ampia gamma di coaster familiari e adrenalinici presenti nei parchi europei.",
    definition:
      "Vekoma Rides Manufacturing è un produttore olandese di montagne russe con sede a Vlodrop, nei Paesi Bassi, uno dei produttori più prolifici al mondo per numero di installazioni totali. Fondata nel 1926 come azienda di ingegneria meccanica, Vekoma si è orientata verso le attrazioni nel 1970 e ha acquisito notorietà mondiale con il suo Boomerang — un compatto shuttle coaster con tre inversioni, concesso in licenza a basso costo e installato in parchi di tutto il mondo. Altri modelli iconici includono il Suspended Looping Coaster (SLC), il Giant Inverted Boomerang e il Mine Train. A partire dagli anni 2010, Vekoma si è reinventata con una moderna linea 'nuova generazione' che offre sistemi di guida più fluidi, layout innovativi e migliorate attrazioni familiari. I nuovi modelli come il Family Boomerang, il Tilt Coaster e i coaster familiari sospesi compaiono sempre più nei parchi europei. Anche Disney ha commissionato design Vekoma personalizzati per i propri resort.",
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Produttore tedesco noto soprattutto per il modello Euro-Fighter con il suo drop oltre la verticale, nonché per spinning coaster e compatte attrazioni familiari.',
    definition:
      "Gerstlauer Amusement Rides GmbH è un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera. Fondata nel 1946 come azienda di lavorazione dei metalli, si è avventurata nel mercato delle attrazioni negli anni '80 e ha costruito la propria reputazione mondiale con il modello Euro-Fighter — un compatto coaster a lancio elettrico famoso per il suo drop iniziale oltre la verticale (97 gradi). Gli Euro-Fighter possono essere installati in spazi ristretti, rendendoli attraenti per parchi urbani e siti più piccoli; esempi includono Rage all'Adventure Island e Speed all'Oakwood. Gerstlauer produce anche il modello Infinity Coaster, spinning coaster e lo SkyRoller, un coaster rotante dove i passeggeri controllano il proprio capovolgimento. Nella comunità degli appassionati, le montagne russe Gerstlauer sono apprezzate per la loro intensità nonostante il piccolo ingombro.",
    aliases: ['Gerstlauer Rides'],

    relatedTermIds: [
      'b-and-m',
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
      "Leggendario produttore tedesco i cui classici looping coaster degli anni '70 e '80 sono ancora amati nei parchi europei per la loro intensa e morbidissima esperienza di guida.",
    definition:
      "Anton Schwarzkopf GmbH & Co. KG era un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera — la stessa città dove si insediò in seguito Gerstlauer. Fondata da Anton Schwarzkopf nel 1954, l'azienda è stata determinante nel portare i looping coaster in Europa. La Revolution al Six Flags Magic Mountain (1976) era il primo looping coaster moderno del mondo, progettato da Schwarzkopf. I modelli iconici includono il Looping Star, il Thriller/Wildcat e il trasportabile Looping Coaster, che ha girato per tutta Europa. Le montagne russe Schwarzkopf sono rinomate per le loro corse morbidissime e l'elegante efficienza dei layout — frutto della precisa ingegneria di Schwarzkopf. L'azienda è fallita nel 1983, ma molte installazioni sono rimaste operative per decenni, custodite da parchi e appassionati come classici insostituibili. La manutenzione è ora gestita da aziende specializzate o da Gerstlauer, che ha acquisito alcuni strumenti.",
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Un coaster che accelera gli ospiti da 0 ad alta velocità tramite un sistema di lancio magnetico, idraulico o pneumatico invece della tradizionale catena di risalita.',
    definition:
      "Un Launch Coaster sostituisce la tradizionale catena di risalita con un sistema di propulsione che accelera rapidamente il treno da ferma all'alta velocità in pochi secondi. Le tecnologie principali sono: lanci LSM (motore sincrono lineare) — bobine elettromagnetiche accelerano una pinna sul treno; LIM (motore a induzione lineare) — simile ma meno efficiente; lanci idraulici — un sistema a cavo e pistone usato da Intamin sui coaster da record come Kingda Ka; e lanci ad aria compressa. Alcuni coaster presentano più lanci durante il percorso. L'accelerazione improvvisa e potente è una sensazione distintiva che non può essere replicata da una catena di risalita.",
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Coaster a Lancio', 'Catapulta'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
  },
  {
    id: 'wooden-coaster',
    name: 'Ottovolante in legno',
    shortDefinition:
      "Una montagna russa costruita principalmente in legno, caratterizzata dal suo caratteristico fragore, dal movimento laterale e dall'airtime imprevedibile.",
    definition:
      "Un ottovolante in legno è un giro costruito con binari e struttura portante in legno. A differenza dei coaster in acciaio, il legno ha una flessione naturale che crea il caratteristico fragore, lo scuotimento laterale e l'airtime imprevedibile amato dagli appassionati. Famosi ottovolanti in legno includono Balder a Liseberg, The Beast a Kings Island e Megafobia a Oakwood. Gli ottovolanti in legno richiedono una manutenzione costante — il binario deve essere rilaminato regolarmente — e sono suscettibili ai cambiamenti climatici. Il processo di conversione RMC (Rocky Mountain Construction) può trasformare i vecchi ottovolanti in coaster ibridi con binario in acciaio mantenendo la struttura in legno.",
    relatedTermIds: ['airtime', 'hybrid-coaster', 'rmc'],
    aliases: ['Ottovolanti in legno'],
    alternateNames: ['Woodie', 'Woodies', 'Coaster in legno'],
  },
  {
    id: 'steel-coaster',
    name: 'Montagna russa in acciaio',
    shortDefinition:
      'Una montagna russa costruita principalmente con binario e struttura in acciaio, nota per la sua corsa liscia e precisa.',
    definition:
      "Una montagna russa in acciaio è costruita con binario tubolare o piatto in acciaio supportato da un'armatura in acciaio. A differenza delle montagne russe in legno con la loro flessibilità naturale, l'acciaio offre ai progettisti un controllo preciso delle forze G, delle transizioni e delle inversioni. La corsa liscia e prevedibile di una montagna russa in acciaio consente di creare layout complessi con molteplici inversioni, curve strette e sezioni ad alta velocità.\n\nLe montagne russe in acciaio dominano lo sviluppo moderno dei coaster. Gli esempi più celebri in Europa includono Shambhala a PortAventura, Nemesis ad Alton Towers e Silver Star a Europa-Park. Le montagne russe in acciaio spaziano da piccole attrazioni familiari a mega coaster record-holder. La precisione dell'acciaio richiede ispezione e manutenzione regolari, ma offre meno margini di errore di progettazione rispetto alla flessibilità del legno.",
    relatedTermIds: ['hyper-coaster', 'inversion', 'launch-coaster', 'wooden-coaster'],
    aliases: ['Montagne russe in acciaio', 'Acciaio'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      "Un coaster dove il treno è sospeso sotto il binario su un perno, consentendo al veicolo di oscillare liberamente da un lato all'altro.",
    definition:
      "Un suspended coaster è un tipo di coaster specializzato dove il treno è sospeso dall'alto su un punto di perno, consentendogli di oscillare liberamente da un lato all'altro indipendentemente dal percorso del binario. Mentre il treno naviga nelle curve, oscilla come un pendolo — un movimento che crea la caratteristica sensazione di 'frusta' e aggiunge un elemento imprevedibile all'esperienza. Questo movimento oscillante è distinto da un inverted coaster, dove il treno è rigidamente attaccato al di sopra del binario.\n\nI suspended coaster sono meno comuni dei coaster invertiti ma offrono un'esperienza unica. Il movimento oscillante rende anche le curve moderate drammatiche, e la sensazione di 'volare' con il terreno lontano crea un'esposizione emozionante. Vekoma ha sviluppato il modello Suspended Looping Coaster (SLC) negli anni '90, e centinaia sono stati costruiti in tutto il mondo. Il movimento oscillante può sembrare caotico rispetto alla precisione delle inversioni moderne, rendendo i suspended coaster amati per la loro natura grezza e imprevedibile.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Oscillante', 'Pendolante'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster ibrido',
    shortDefinition:
      'Un coaster che combina una struttura portante in legno tradizionale con un binario I-box in acciaio, pionieristicamente sviluppato da Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster ibrido abbina la struttura in legno di un coaster tradizionale con un binario I-box in acciaio prodotto da Rocky Mountain Construction (RMC). Il binario I-box è estremamente preciso e liscio, consentendo elementi di inversione impossibili su binari in legno tradizionali. RMC ha sviluppato questa tecnologia principalmente per rinnovare i vecchi ottovolanti in legno — aggiungendo inversioni, discese più ripide e airtime hill a layout precedentemente troppo bruschi. Famosi ibridi RMC includono Steel Vengeance a Cedar Point (spesso citato come il miglior coaster al mondo), Twisted Colossus a Six Flags Magic Mountain e Wildfire a Kolmården. Nuovi costruzioni RMC (come Untamed a Walibi Holland) esistono ora affianco alle conversioni.',
    aliases: ['Hybrid Coasters'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Ottovolante ibrido'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
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
    relatedTermIds: ['b-and-m', 'euro-fighter', 'first-drop', 'launch-coaster'],
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
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      "La classica inversione circolare in cui il binario forma un cerchio verticale completo, portando i passeggeri completamente a testa in giù all'apice.",
    definition:
      "Il looping verticale è l'inversione più iconica nella storia delle montagne russe — un cerchio completo di 360 gradi nel piano verticale. I looping moderni utilizzano una forma a clothoide (a goccia) invece di un cerchio perfetto: l'entrata e l'uscita sono ampie, mentre la sommità del loop è stretta. Questa forma garantisce che i passeggeri sperimentino G-force fluide e sostenute piuttosto che picchi estremi. Il primo coaster moderno con looping (Corkscrew, Knott's Berry Farm, 1975) ha trasformato il settore. Oggi i looping verticali sono l'elemento di punta del conteggio delle inversioni sui coaster di tutto il mondo, dalle attrazioni per il primo brivido alle macchine da record.",
    aliases: ['Loopings'],
    alternateNames: ['Anello Verticale', 'Vertical Loop', 'Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      "Un mezzo looping che spinge il treno verso l'alto e oltre la sommità, seguito da un mezzo rollio che esce in direzione opposta — prende il nome dal pilota della Prima Guerra Mondiale Max Immelmann.",
    definition:
      "La virata Immelmann è un'inversione firma B&M composta da due fasi: il binario prima sale in un mezzo looping verticale, portando i passeggeri sopra la sommità brevemente a testa in giù; poi un mezzo rollio rimette il treno in posizione verticale invertendo simultaneamente la direzione di 180 gradi. L'elemento prende il nome dall'asso aviatore della Prima Guerra Mondiale Max Immelmann, che usava una manovra aerea simile. Gli Immelmann sono distintivi perché producono sia un'inversione con sensazione di caduta allo stomaco sia un cambiamento di direzione significativo in un singolo elemento fluido. Si trovano su quasi ogni coaster B&M sit-down, invertito e hyper in tutto il mondo.",
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      "Un rollio di 360 gradi che segue un arco parabolico in cui i passeggeri sperimentano quasi l'assenza di peso all'apice — uno degli elementi più celebrati nel design moderno dei coaster.",
    definition:
      "Lo Zero-g Roll (rollio a gravità zero) è un elemento di inversione modellato in modo che il treno segua un arco parabolico durante la rotazione — simile concettualmente a un Heartline Roll ma a velocità maggiore e con maggiore spostamento verticale. Al picco del rollio, i passeggeri sperimentano momentanee G-force negative (airtime) mentre sono a testa in giù, creando una sensazione al tempo stesso disorientante e amata. Gli Zero-g Roll sono associati principalmente ai wing coaster e agli hyper coaster B&M, dove l'elemento fa scivolare i passeggeri dei sedili d'ala in modo spettacolare nell'aria aperta. Shambhala a PortAventura e Fury 325 a Carowinds presentano celebri Zero-g Roll.",
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      "La salita azionata meccanicamente che porta il treno del coaster al suo punto più alto, convertendo l'energia elettrica in energia potenziale gravitazionale.",
    definition:
      "Il Lifthill è il segmento in cui un meccanismo esterno tira il treno del coaster dal livello del suolo fino al punto più alto del giro. Il meccanismo più comune è una catena che scorre lungo il centro del binario — il familiare suono 'click-click-click' è il cricchetto anti-rotolamento. Le alternative includono lift a cavo/fune (più fluidi e silenziosi), lift a rullo pneumatico (usati su alcuni moderni coaster B&M) e propulsione magnetica. L'altezza del Lifthill determina la velocità massima potenziale del coaster. Alcuni design moderni utilizzano più Lifthill o combinano una salita con segmenti di lancio. Il Lifthill è tipicamente il momento più lento e ricco di anticipazione del giro.",
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Catena di risalita'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'La discesa iniziale che segue il Lifthill — tipicamente il punto più alto e veloce del giro, che definisce il carattere del coaster.',
    definition:
      "Il First Drop è la discesa principale immediatamente successiva al Lifthill o al segmento di lancio. Sulla maggior parte dei coaster tradizionali è la collina più alta e produce la velocità massima del coaster. L'angolazione, l'altezza e il profilo influenzano fortemente il carattere complessivo: le discese con angolo ripido (oltre 80–90 gradi) creano intense sensazioni di accelerazione, mentre le discese paraboliche possono generare un forte airtime nonostante un angolo più dolce. I Dive Coaster presentano discese che superano i 90 gradi (oltre la verticale), richiedendo ai passeggeri di sporgersi sul bordo. Il First Drop è spesso il momento più atteso su qualsiasi nuovo coaster ed è comunemente filmato per il materiale promozionale.",
    relatedTermIds: ['airtime', 'airtime-hill', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      "Un elemento a forma di collina progettato per generare G-force negative, facendo sperimentare ai passeggeri l'assenza di peso o sollevarli dai sedili.",
    definition:
      "Un'Airtime Hill (detta anche camelback) è un elemento curvo su-e-giù progettato per produrre G-force negative — la sensazione di galleggiare o essere espulsi dal sedile. Il floater airtime è una G negativa dolce; l'ejector airtime è intensa, in cui la barra di sicurezza diventa l'unica cosa tra il passeggero e il cielo. I coaster in acciaio utilizzano colline paraboliche di precisione per un airtime costante e prevedibile; i coaster in legno producono un airtime più imprevedibile e grezzo dovuto alla flessione del binario. Le Airtime Hill sono tra gli elementi più celebrati nelle classifiche degli appassionati e una caratteristica distintiva degli hyper coaster, dei giga coaster e dei moderni ottovolanti in legno.",
    aliases: ['Colline di airtime'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Una sezione continua a spirale in cui il binario si avvolge attorno a un asse centrale, generando G-force laterali sostenute.',
    definition:
      "Un'elica è una sezione di binario di coaster che si avvolge continuamente a spirale — simile nella forma a una vite — senza invertire i passeggeri. A differenza delle Airtime Hill o delle inversioni, le eliche generano G-force laterali (laterali) sostenute che spingono i passeggeri verso l'esterno delle curve. Un'elica discendente accelera il treno mentre gira; un'elica ascendente lo decelera pur generando ancora forze laterali. Le eliche vengono comunemente usate per spendere l'energia cinetica rimanente alla fine di un layout offrendo un'eccitante sensazione di curva sostenuta. Famose eliche includono il finale sotterraneo di Nemesis ad Alton Towers e l'elica finale di Expedition GeForce a Holiday Park.",
    aliases: ['Helices'],
    alternateNames: ['Spirale', 'Curva elicoidale'],

    relatedTermIds: ['first-drop', 'horseshoe'],
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
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      "Un'inversione a rollio a botte in cui il binario si avvolge a spirale di 360 gradi attorno a un asse centrale — uno dei primi e più diffusi tipi di inversione.",
    definition:
      "Il Cavatappi (Corkscrew) è una delle prime inversioni moderne, introdotto da Arrow Dynamics negli anni '70. Il binario si avvolge attorno a un cilindro centrale come un cavatappi, ruotando i passeggeri attraverso un rollio completo di 360 gradi sfalsato rispetto alla direzione di viaggio. I Cavatappi sono spesso abbinati in disposizioni back-to-back e sono l'elemento distintivo del coaster in acciaio dell'era classica. Il termine tedesco 'Korkenzieher' è ampiamente usato nelle mappe e nella segnaletica dei parchi tedeschi. Sebbene i design di inversione più recenti lo abbiano in gran parte superato, il Cavatappi rimane un elemento amato nei parchi di tutta Europa e del Nord America.",
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      "L'immagine speculare di un Immelmann: il binario si tuffa ripidamente verso il basso in un mezzo looping e esce orizzontalmente — invertendo la direzione rispetto a un Immelmann.",
    definition:
      "Un Dive Loop (detto anche dive turn o Immelmann inverso) inizia dove l'Immelmann finisce: invece di salire e scavalcare, il binario si tuffa ripidamente verso il basso, curvando attraverso la metà inferiore di un looping prima di uscire nella direzione opposta all'entrata. La sensazione è quella di un tuffo verso il basso vorticoso seguito da un'intensa uscita in pull-out. I Dive Loop sono un elemento firma B&M e appaiono su molti dei coaster invertiti e sit-down del costruttore. La combinazione di Immelmann e Dive Loop in un singolo layout crea cambiamenti di direzione e tipi di inversione variati.",
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      "Un singolo rollio di 360 gradi direttamente attorno all'asse del binario, che fornisce un'inversione fluida senza cambiare significativamente la direzione di viaggio del treno.",
    definition:
      "Un Inline Twist (detto anche inline roll o barrel roll) ruota il treno di 360 gradi attorno all'asse longitudinale del binario — il coaster si avvolge essenzialmente senza deviare significativamente di direzione. A differenza di un Cavatappi (che ha una spirale sfalsata rispetto al centro del binario), l'Inline Twist ruota precisamente attorno al binario. Il risultato è un'inversione breve e fluida con forze laterali minime. Gli Inline Twist sono comuni sui flying coaster e i coaster invertiti B&M, spesso appaiono in coppia o combinati con altri elementi in rapida successione. L'elemento produce un'esperienza momentanea a testa in giù che sembra sorprendentemente dolce.",
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      "Un rollio di 360 gradi centrato sul centro di gravità del passeggero piuttosto che sul binario stesso, progettato per offrire un'assenza di peso fluida e sostenuta durante tutta la rotazione.",
    definition:
      "Un Heartline Roll (o heartline spin) è progettato in modo che il cuore del passeggero — approssimativamente il centro di gravità del corpo — rimanga a un'altezza costante durante tutta la rotazione, piuttosto che il binario essere il punto di perno. Questo design minimizza le G-force durante il rollio, producendo una sensazione di galleggiamento fluido distinta dal colpo di un Cavatappi standard. Gli Heartline Roll sono un segno distintivo del design moderno di coaster B&M e Intamin, associati agli hyper coaster e ai coaster invertiti. L'elemento illustra la precisione ingegneristica richiesta per creare un'esperienza di giro fluida — minuscole regolazioni del binario si traducono direttamente nel comfort o disagio del passeggero.",
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un mezzo looping combinato con un mezzo cavatappi che ruota il binario di 90 gradi e cambia direzione — un elemento firma Vekoma presente sui coaster Boomerang.',
    definition:
      "Un Sidewinder consiste in un mezzo looping verticale che spinge il treno verso l'alto, immediatamente seguito da un mezzo cavatappi che rimette il treno in posizione verticale ruotando di 90 gradi. Il risultato netto è un'inversione combinata con un cambiamento significativo di direzione, ottenuta in uno spazio compatto. I Sidewinder sono gli elementi costitutivi del modello Boomerang iconico di Vekoma: due Sidewinder (uno in avanti, uno al contrario) affiancano un looping centrale per creare il layout completo. Il nome si riferisce al movimento di torsione a serpente che l'elemento produce quando visto dal bordo pista.",
    relatedTermIds: ['boomerang', 'cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Una massiccia inversione esclusiva dei flying coaster B&M in cui i passeggeri, già in posizione Superman, passano attraverso il punto più basso di un looping verticale completamente invertiti.',
    definition:
      "Il Pretzel Loop è una delle inversioni più intense nel design dei parchi a tema, trovata esclusivamente sui flying coaster B&M (dove i passeggeri giacciono in orizzontale in posizione Superman). L'elemento manda i passeggeri in tuffo ripido verso il basso mentre sono invertiti, attraverso il fondo di un grande looping, poi li riporta ripidamente verso l'alto — la forma complessiva ricorda un pretzel vista di lato. Poiché il punto più basso è in fondo e i passeggeri sono a faccia in giù, le G-force sperimentate in quel momento sono estremamente intense. Famosi Pretzel Loop appaiono su Manta a SeaWorld Orlando e Tatsu a Six Flags Magic Mountain.",
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Un elemento a doppia inversione con inversione di direzione di 180 gradi, che combina due mezzi looping collegati da un mezzo cavatappi — la forma ricorda ali di pipistrello spiegate.',
    definition:
      "Un Batwing consiste in due inversioni con un'inversione di direzione: il binario si archi verso l'alto in un mezzo looping, poi in cima passa attraverso un mezzo cavatappi che inverte il treno e inverte la direzione prima di rispecchiare il mezzo looping verso il livello del suolo. La forma vista dall'alto ricorda ali di pipistrello spiegate. I Batwing sono un elemento firma B&M, presenti su coaster come Afterburn a Carowinds e The Incredible Hulk Coaster agli Universal Islands of Adventure. A differenza del Bowtie (che non ha cambiamento di direzione), il Batwing inverte la direzione del treno di 180 gradi durante la sequenza.",
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      "Una variante di looping in cui il binario si avvicina dall'alto, scende attraverso il percorso circolare ed esce in cima — la geometria inversa di un looping standard.",
    definition:
      "Il Norwegian Loop (a volte chiamato reverse loop) ha la geometria opposta a un looping verticale standard: invece di entrare al livello del suolo e uscire alla stessa altezza, il treno entra da una posizione elevata, scende nel percorso circolare del looping ed esce nuovamente in cima. Questo significa che le forze sentite al fondo del cerchio — che sono forti G positive — sono ancora presenti, ma le sensazioni di entrata e uscita sono notevolmente diverse. I Norwegian Loop sono relativamente rari nell'inventario globale dei coaster e sono associati principalmente a certi design Vekoma e installazioni personalizzate.",
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un elemento a cavatappi su coaster invertiti o flying in cui la rotazione avviene in un piano approssimativamente orizzontale, creando una rotazione ampia e quasi livellata.',
    definition:
      "Un Flat Spin è un'inversione di tipo cavatappi presente principalmente sui coaster invertiti e flying B&M, dove la geometria dell'elemento è disposta in modo che la spirale appaia quasi orizzontale agli osservatori a terra. Su un coaster invertito (dove il treno pende sotto il binario) un Flat Spin crea un effetto visivo particolarmente spettacolare mentre i passeggeri scorrono attraverso un ampio cerchio quasi livellato. La sensazione per i passeggeri è una rotazione fluida e sostenuta con G-force moderate. I Flat Spin sono un elemento firma sui coaster invertiti B&M come Banshee a Kings Island e Afterburn a Carowinds.",
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      "Un mezzo cavatappi che inverte simultaneamente la direzione del treno di circa 180 gradi — combinando un'inversione con un brusco cambio di direzione.",
    definition:
      "Un Cutback è un elemento in cui il binario esegue un mezzo cavatappi mentre si curva su se stesso di circa 180 gradi. Il risultato è un'inversione con una significativa inversione di direzione — distinta da un cavatappi standard, che mantiene principalmente la direzione di viaggio. I Cutback sono relativamente insoliti e tendono ad apparire su certi modelli Vekoma e coaster personalizzati dove è richiesto un cambio di direzione compatto combinato con un'inversione. Il nome 'cutback' riflette l'aspetto visivo dell'elemento: il binario taglia indietro sulla propria direzione precedente mentre si capovolge.",
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Una variante di doppia inversione a sea-serpent con un apice di collegamento più basso, che produce due inversioni consecutive senza cambiamento di direzione in uno spazio compatto.',
    definition:
      "Il Butterfly è un elemento a doppia inversione simile a un sea-serpent (due mezzi looping collegati in cima) ma con un apice più basso e una geometria distinta. Come il sea-serpent, produce due inversioni senza cambiare la direzione del treno, ma il pezzo di collegamento tra i due mezzi looping passa attraverso una sezione invertita più bassa piuttosto che una cresta alta. Questo rende il Butterfly più compatto verticalmente. L'elemento appare su certi design Vekoma e coaster personalizzati ed è distinto dal Bowtie (nessun cambiamento di direzione, stesso del Butterfly ma diversa geometria del layout) e dal Batwing (ha un cambiamento di direzione).",
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un elemento a doppia inversione in cui due mezzi looping speculari formano una forma a papillon nel binario — due inversioni senza cambio di direzione.',
    definition:
      "Un Bowtie è un elemento a doppia inversione composto da due mezzi looping speculari collegati al loro picco. A differenza di un Batwing (che inverte la direzione), il Bowtie esce nella stessa direzione generale in cui è entrato. Visto dall'alto, il profilo del binario ricorda un papillon. I Bowtie sono relativamente rari e si trovano principalmente su certi Vekoma e installazioni personalizzate. L'elemento produce due inversioni fluide in rapida successione mantenendo la direzione generale di viaggio, offrendo una sensazione diversa dal Batwing che inverte la direzione nonostante un aspetto superficialmente simile.",
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
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
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Una curva con forte inclinazione a 180 gradi a forma di ferro di cavallo, che reindirizza il treno nella direzione opposta — comunemente usata per girare il treno tra segmenti di lancio.',
    definition:
      "Un Horseshoe è una curva semicircolare molto inclinata — tipicamente da 75 a 90 gradi — che reindirizza il coaster di 180 gradi (invertendo la direzione). L'inclinazione estrema previene eccessive G-force laterali al raggio stretto. Gli Horseshoe sono frequentemente utilizzati nei layout dei launched coaster come elementi di inversione di marcia tra più segmenti di lancio, dando al treno una svolta a U prima della prossima fase di accelerazione. L'elemento è visivamente spettacolare e un segno distintivo degli accelerator coaster di Intamin e dei multi-launch coaster di Mack. Reindirizza efficientemente il treno in uno spazio compatto mantenendo la velocità.",
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Un piccolo avvallamento appena prima della discesa principale su un coaster a catena, usato per ridurre la tensione della catena e fornire un breve momento di airtime anticipatorio.',
    definition:
      "Un Predrop è una piccola collina o avvallamento posizionato sull'ultimo tratto della catena di risalita, appena prima della cresta che porta alla discesa principale. La sua funzione ingegneristica primaria è ridurre la tensione sulla catena di risalita mentre il treno supera la cresta — evitando una transizione brusca o violenta dalla salita motorizzata alla discesa libera. Un beneficio secondario è l'esperienza del passeggero: il breve pop di airtime mentre il treno supera il Predrop offre un assaggio allettante dell'assenza di peso prima del tuffo principale. I Predrop sono diventati una caratteristica di design popolare sui coaster in legno e in acciaio, con alcuni — come quello di Goliath a Six Flags Magic Mountain — diventati attesi quanto la discesa stessa.",
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un elemento alto e stretto con ascesa e discesa quasi verticali che ricorda un cappello a cilindro — un elemento firma sui coaster Intamin a lancio idraulico.',
    definition:
      "Un Top Hat è un elemento distintivo in cui il binario sale quasi verticalmente fino a una cresta netta, poi cade quasi verticalmente dall'altro lato — creando un profilo che visto di lato assomiglia a un cappello a cilindro. I Top Hat interni (standard) si inclinano verso l'interno al picco; i Top Hat esterni si inclinano verso l'esterno per una sensazione esposta e ricca di airtime. L'elemento è fortemente associato ai launched coaster idraulici di Intamin (acceleratori): dopo il lancio iniziale a 200 km/h o più, il Top Hat è il pezzo centrale spettacolare del giro. Kingda Ka (139 m), Top Thrill Dragster (128 m) e Red Force a Ferrari Land presentano Top Hat iconici.",
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      "Una montagna russa che un appassionato ha ufficialmente percorso e aggiunto al proprio conteggio personale — collezionare credit è un'attività centrale nella comunità degli appassionati di coaster.",
    definition:
      "Un coaster credit (o semplicemente 'credit' o 'cred') è una montagna russa che un appassionato ha percorso e ufficialmente aggiunto al proprio conteggio personale. La pratica di 'collezionare credit' — percorrere il maggior numero possibile di coaster diversi — è una delle attività distintive della comunità degli appassionati di montagne russe. Le regole su cosa conta come credit variano: alcuni appassionati contano solo i coaster sit-down, altri includono tutti i giri su rotaia; alcuni richiedono che ogni tipo di treno su un singolo coaster conti come un credit, altri no. Siti di tracciamento come il Roller Coaster Database (RCDB) consentono agli appassionati di registrare i propri conteggi. La ricerca di credit motiva molti appassionati a viaggiare internazionalmente e a visitare parchi poco conosciuti.",
    aliases: ['Credits'],
    alternateNames: ['Cred', 'Creds'],

    relatedTermIds: ['hybrid-coaster', 'pov', 'wooden-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      "Riprese in soggettiva dalla prima fila di una montagna russa, che danno ai potenziali passeggeri un'anteprima virtuale dell'esperienza del giro.",
    definition:
      'POV (Point of View) si riferisce a riprese video in giro registrate dalla prospettiva di un passeggero in prima fila, tipicamente montate su una telecamera attaccata al treno. I video POV sono uno dei formati di contenuto più popolari nella comunità degli appassionati di parchi a tema e sono ampiamente utilizzati dai potenziali visitatori per vedere in anteprima un coaster prima di visitare. Gli operatori dei parchi a volte producono POV ufficiali per scopi promozionali; più spesso sono filmati da ospiti o media. Un POV ben prodotto mostra chiaramente ogni elemento, discesa e inversione in sequenza. YouTube ospita decine di migliaia di video POV di coaster. Il termine è usato anche in senso più ampio per descrivere qualsiasi ripresa in soggettiva delle attrazioni del parco.',
    alternateNames: ['Point of View', 'On-Ride Video', 'Video in cabina'],

    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Una situazione in cui più treni arrivano al Brake Run prima che la stazione sia libera, causando una coda di treni in attesa — un segnale di operazioni inefficienti che prolunga i tempi di attesa.',
    definition:
      "Lo Stacking si verifica quando il processo di carico/scarico di una montagna russa è più lento del tempo del ciclo del giro, causando l'accumulo di treni nel Brake Run in attesa che la stazione si liberi. Invece di far partire un treno quando quello precedente ritorna, l'operatore deve trattenere più treni nel Brake Run — portando potenzialmente il giro a una breve fermata tra un treno e l'altro. Lo Stacking riduce direttamente la capacità del giro e prolunga i tempi di attesa in coda. Le cause comuni includono il lento caricamento degli ospiti (spesso dovuto a sistemi di ritenuta complessi), grandi requisiti di controllo bagagli, o carenza di personale. Gli ospiti esperti nei parchi possono osservare se un coaster sta facendo Stacking durante la loro attesa e tenerlo in considerazione nel processo decisionale.",
    alternateNames: ['Accumulo di treni'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo di montagna russa in cui il treno è sospeso sotto la rotaia e i piedi dei passeggeri penzolano liberamente.',
    definition:
      'Un Inverted Coaster è una montagna russa in cui il treno è fissato rigidamente sotto la rotaia, con i passeggeri seduti a gambe penzolanti. A differenza di una suspended coaster (che oscilla lateralmente), il treno di un Inverted Coaster non si muove lateralmente. B&M ha sviluppato il design moderno nel 1992 con Batman The Ride. Gli Inverted Coaster sono rinomati per i near-miss intensi, i zero-g roll e i cobra roll. Esempi europei celebri: Nemesis (Alton Towers), Katun (Mirabilandia) e Oziris (Parc Astérix).',
    alternateNames: ['Inverted', 'Invert', 'Montagna Russa Invertita'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo di coaster con i sedili posizionati su entrambi i lati della rotaia — nulla sopra, sotto o accanto ai passeggeri.',
    definition:
      "Un Wing Coaster (o Wing Rider) dispone due sedili per lato lungo la rotaia, lasciando i passeggeri senza alcuna struttura sopra, sotto o ai lati. Il design massimizza la sensazione di volo e crea near-miss spettacolari con l'ambientazione. B&M è il principale produttore di Wing Coaster. Esempi notevoli in Europa: The Swarm (Thorpe Park), GateKeeper (Cedar Point) e Flug der Dämonen (Europa-Park), spesso citato tra i migliori coaster d'Europa.",
    alternateNames: ['Wing Rider', 'Coaster ad ala'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      "Montagna russa con vagoni che ruotano liberamente su un asse verticale, offrendo un'esperienza diversa ad ogni giro.",
    definition:
      'Uno Spinning Coaster è dotato di vagoni montati su una piattaforma rotante che gira liberamente attorno a un asse verticale. Poiché la rotazione non è controllata, ogni veicolo vive una sequenza diversa di avanti, indietro e laterale. Mack Rides (Waldkirch, Germania) e Gerstlauer sono i principali produttori. Gli Spinning Coaster sono considerati ottime attrazioni per famiglie — abbastanza intense da essere emozionanti, ma senza i requisiti di altezza dei coaster più impegnativi.',
    alternateNames: ['Spinner', 'Ottovolante rotante'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Il modello di spinning coaster ad alta intensità di Gerstlauer — più veloce, più alto e con una rotazione più pronunciata rispetto ai modelli standard.',
    definition:
      "L'Xtreme Spinning Coaster (XSC) è il modello di punta di Gerstlauer nella categoria spinning coaster, progettato per spingere il formato ai suoi limiti. Dove uno spinning coaster standard punta a un'intensità familiare, lo XSC offre una struttura più alta, cadute più ripide, velocità massime più elevate e un meccanismo di rotazione calibrato per giri più marcati — i vagoni ruotano con più forza e frequenza in ogni elemento del percorso.\n\nL'imprevedibilità della rotazione è amplificata dal ritmo più sostenuto: l'orientamento del vagone cambia più rapidamente, rendendo ogni corsa unica. Il modello XSC posiziona Gerstlauer tra gli spinner familiari e i coaster ad alta intensità, offrendo emozione autentica pur mantenendo il carattere rejugabile che rende gli spinning coaster così apprezzati.",
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'gerstlauer', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montagna russa che supera i 61 m di altezza, tipicamente senza inversioni e incentrata su velocità e airtime.',
    definition:
      'Hyper Coaster è la classificazione per le montagne russe tra 61 e 91 m di altezza. B&M chiama i propri modelli "Hyper Coaster"; Intamin usa il termine "Mega Coaster" per il tipo equivalente. Entrambi privilegiano grandi colline di airtime ad alta velocità piuttosto che le inversioni. Shambhala a PortAventura (Spagna) è il Hyper Coaster più alto e veloce d\'Europa con 76 m. Altri esempi celebri: Goliath a Walibi Holland e Mako a SeaWorld Orlando.',
    alternateNames: ['Mega Coaster', 'Mega Montagna Russa', 'Ipercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      "Montagna russa che supera i 91 m di altezza — un gradino sopra l'Hyper Coaster.",
    definition:
      "Giga Coaster è la classificazione per le montagne russe tra 91 e 121 m di altezza. Il termine è stato coniato da Cedar Fair e Intamin per Millennium Force a Cedar Point nel 2000. I Giga Coaster enfatizzano l'altezza estrema, i layout lunghi e i momenti di airtime colossali. Fury 325 a Carowinds è considerato da molti appassionati il miglior coaster in acciaio al mondo. In Europa non esistono ancora Giga Coaster nel 2025.",
    alternateNames: ['Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con inclinazione superiore a 90°, che inclina brevemente i passeggeri oltre la verticale.',
    definition:
      "Un Overbanked Turn è una curva dove l'inclinazione della rotaia supera i 90 gradi — il binario esterno è più alto della verticale, inclinando brevemente i passeggeri oltre la posizione capovolta senza completare un'inversione. L'elemento genera una caratteristica combinazione di G laterali e lievi G negative al culmine dell'inclinazione. Le curve overbanked sono un elemento distintivo dei Hyper Coaster di B&M e dei Mega Coaster di Intamin, e sono onnipresenti nei layout RMC.",
    alternateNames: ['Curva sopraelevata', 'Curva inclinata'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Freno magnetico a metà percorso che riduce la velocità del treno senza fermarlo completamente.',
    definition:
      "Un Trim Brake è un sistema frenante posizionato a metà percorso di una montagna russa per ridurre la velocità del treno — senza fermarlo completamente come un block brake. I trim brake vengono utilizzati per gestire le G-force, ridurre l'usura della rotaia o soddisfare requisiti di sicurezza. Gli appassionati li criticano spesso perché possono attenuare notevolmente le sensazioni del percorso — le airtime hill risultano meno intense quando il treno viene frenato prima. L'attivazione dei trim brake può variare in base alla stagione, alle condizioni atmosferiche e al carico del treno.",
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Quando un launch coaster non raggiunge la cima del circuito e rotola indietro sul binario di lancio.',
    definition:
      "Un rollback si verifica quando un coaster lanciato non genera velocità sufficiente per superare il punto più alto del circuito e rotola quindi all'indietro per gravità fino alla posizione di lancio. Nei launch coaster idraulici (Top Thrill Dragster, Stealth) accade quando il meccanismo di lancio non eroga la potenza completa. Il treno rotola lentamente e viene fermato da freni magnetici al punto più basso. I rollback sono rari ma sono una caratteristica nota dei launch coaster idraulici. I passeggeri non corrono alcun rischio.",
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronica',
    shortDefinition:
      'Personaggi robotici utilizzati nei dark ride e negli spettacoli per creare scene realistiche.',
    definition:
      "L'animatronica (animatronics) indica figure robotiche elettromeccaniche utilizzate nelle attrazioni e negli spettacoli dei parchi a tema per rappresentare personaggi o creature in modo realistico. Disney ha coniato il termine \"Audio-Animatronics\" nel 1964 durante l'Esposizione Universale. Le animatroniche moderne spaziano da semplici figure cicliche a robot sofisticati con espressioni facciali complesse e movimenti corporei completi. Esempi di riferimento: lo sciamano Na'vi in Pandora (Walt Disney World) e i dinosauri dell'attrazione Jurassic World (Universal).",
    aliases: ['Animatronics'],
    alternateNames: ['Audio-Animatronics', 'Figura robotica'],

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

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'opening-hours',
    name: 'Orari di apertura',
    shortDefinition:
      "Il programma giornaliero ufficiale che indica quando un parco a tema o un'attrazione apre e chiude.",
    definition:
      "Gli orari di apertura sono il programma giornaliero pubblicato per un parco a tema o una singola attrazione — indicano quando inizia l'accesso e quando termina l'operatività. La maggior parte dei grandi parchi pubblica un calendario scorrevole con settimane o mesi di anticipo, sebbene gli orari possano cambiare a breve termine a causa di eventi speciali, aggiustamenti stagionali o problemi operativi.\n\npark.fan mostra gli orari di apertura per ogni parco. Gli orari contrassegnati con «Est.» (Stimato) sono stati derivati da schemi storici e non confermati ufficialmente dal parco — devono essere verificati prima di una visita pianificata.",
    aliases: ['Orari del Parco', 'Ore di Apertura'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendenza',
    shortDefinition:
      'La direzione del cambiamento nella lunghezza della coda negli ultimi 30 minuti — in aumento, in calo o stabile.',
    definition:
      "La tendenza indica se la coda di un'attrazione è più lunga, più corta o uguale rispetto a 30 minuti fa. park.fan la rappresenta con una freccia: su (coda in crescita), giù (coda in diminuzione) o orizzontale (stabile).\n\nLa tendenza è spesso più significativa del tempo di attesa grezzo. Un'attrazione con 45 minuti e tendenza in calo è una scelta migliore rispetto a una con 40 minuti e tendenza fortemente in aumento — nel tempo che ci vuole ad arrivare, la prima coda potrebbe essere scesa a 30 minuti mentre la seconda ha già raggiunto i 55.",
    aliases: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride senza rotaie fisse — i veicoli navigano liberamente guidati da tecnologia incorporata nel pavimento.',
    definition:
      "Un Trackless Ride è un tipo di dark ride in cui i veicoli non sono vincolati a una rotaia fissa ma navigano autonomamente attraverso lo spazio dell'attrazione, guidati da loop di induzione, Wi-Fi o laser incorporati nel pavimento. La libertà di movimento consente scenografie molto più complesse e narrazioni non lineari: i veicoli possono girare, ruotare e avvicinarsi alle scene da diverse angolazioni. Esempi celebri: Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Avventura Totalmente Toccata di Remy (Disneyland Paris) e Symbolica (Efteling, Paesi Bassi).",
    aliases: ['Trackless', 'Trackless Dark Ride', 'Attrazione Senza Binari'],

    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Intelligenza Artificiale — i modelli di machine learning che calcolano le previsioni di affluenza e i tempi di attesa.',
    definition:
      "L'IA (Intelligenza Artificiale) si riferisce agli algoritmi di machine learning che riconoscono pattern in grandi dataset e generano previsioni. park.fan utilizza modelli IA addestrati su anni di dati storici sui tempi di attesa, calendari scolastici, dati meteorologici e annunci di eventi per produrre previsioni giornaliere di affluenza e tempi di attesa — fino a 30+ giorni in anticipo.",
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['Intelligenza Artificiale'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Tempo di attesa in tempo reale',
    shortDefinition:
      'Dati sui tempi di attesa aggiornati in tempo reale direttamente dai sistemi del parco.',
    definition:
      'Un tempo di attesa in tempo reale è il dato attuale estratto direttamente dai sistemi del parco — non una media storica, ma il dato reale al minuto. park.fan recupera i tempi di attesa in tempo reale dalle API ufficiali dei parchi e da fonti terze, aggiornando ogni minuto.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
    aliases: ['Tempi di attesa in tempo reale', 'Attesa live'],
  },
  {
    id: 'crowd-forecast',
    name: 'Previsione affluenza',
    shortDefinition:
      "Previsione basata sull'IA dell'affluenza in un parco a tema per un giorno specifico.",
    definition:
      "Una previsione affluenza è una previsione basata sui dati di quanto sarà affollato un parco a tema in un giorno o a un'ora specifica. park.fan ricalcola le previsioni di affluenza quotidianamente utilizzando dati storici di presenze, calendari scolastici, dati meteorologici ed eventi speciali. I risultati alimentano direttamente il calendario delle affluenze: i giorni verdi indicano code brevi, i giorni rossi segnalano affluenza di punta con lunghi tempi di attesa.",
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Previsioni affluenza'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      "L'unità di accelerazione sperimentata dai passeggeri, misurata come multipli dell'accelerazione gravitazionale terrestre (9,81 m/s²).",
    definition:
      "La forza G (equivalente gravitazionale) misura l'accelerazione che un passeggero sperimenta rispetto alla gravità normale della Terra. Le forze G positive (sopra 1G) schiacciano i passeggeri nel sedile durante passaggi in avvallamenti o curve strette. Le forze G negative (sotto 0G) sollevano i passeggeri dal sedile, creando airtime. Le forze G laterali agiscono orizzontalmente, spingendo i passeggeri di lato nelle curve e nelle transizioni.\n\nLe montagne russe sono progettate per sequenziare queste forze deliberatamente. Un avvallamento che genera 4–5G è il marchio di un primo drop potente. Un breve momento a −0,5G su una collina di airtime produce la caratteristica sensazione di galleggiamento. La maggior parte delle attrazioni mira a 0–5G di forze positive sostenute, con brevi picchi per effetti drammatici. Un'esposizione prolungata a forze G elevate può causare disagio o greyout; le montagne russe ben progettate bilanciano picchi di intensità con sezioni di recupero.",
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs'],
    aliases: ['Forze G', 'G-Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Oscuramento temporaneo della visione causato dalle forze G positive che riducono il flusso sanguigno al cervello.',
    definition:
      "Il greyout (anche grey-out) è un fenomeno fisiologico in cui un passeggero soggetto a forti forze G positive prolungate sperimenta temporaneamente un campo visivo grigio o velato. Il meccanismo: le forze G positive spingono il sangue verso il basso, nelle estremità, riducendo l'afflusso di sangue agli occhi e al cervello. Il campo visivo comincia a restringersi dalla periferia e diventa grigio — il passeggero rimane cosciente, ma con la visione significativamente compromessa.\n\nOltre al greyout, un'esposizione più intensa o prolungata alle forze G può portare al blackout (visione completamente buia) o al G-LOC (perdita di coscienza indotta dalle forze G). Le montagne russe ben progettate mantengono i picchi di G elevati brevi e alternano sezioni intense con sezioni di recupero.",
    aliases: ['Greyouts', 'grey-out'],
    alternateNames: ['visione grigia', 'velo grigio', 'oscuramento da G'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Zona grigia',
    shortDefinition:
      'Un elemento di montagna russa al confine della definizione di inversione — contato o meno secondo il metodo di conteggio utilizzato.',
    definition:
      "La zona grigia designa gli elementi di montagna russa situati al confine tra un'inversione completa e un elemento non-invertente. Le inversioni classiche — come i looping verticali e i cavatappi — sono inequivocabili: il treno ruota il passeggero completamente a testa in giù. Gli elementi in zona grigia raggiungono appena o non raggiungono la soglia dei 180° overhead, mettendo i passeggeri in una posizione estrema, quasi invertita.\n\nGli elementi tipici in zona grigia includono gli stall (posizioni a testa in giù mantenute senza rotazione completa), i virages fortemente sovrainclinati oltre 90° e alcune varianti di wave turn. Produttori come RMC e Intamin utilizzano deliberatamente questi elementi come alternativa alle inversioni classiche. A seconda del metodo di conteggio — stretto (solo rotazioni complete) o ampio (qualsiasi posizione overhead) — il numero ufficiale di inversioni di un'attrazione può variare.",
    aliases: ['Zone grigie', 'zona-grigia'],
    alternateNames: ['inversione borderline', 'quasi-inversione'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Forze orizzontali che spingono i passeggeri di lato durante curve, transizioni e sezioni a elica.',
    definition:
      "Le forze G laterali (o forze laterali) sono le accelerazioni orizzontali che i passeggeri sperimentano quando una montagna russa cambia direzione nel piano orizzontale — nelle curve inclinate o non inclinate, nelle eliche e nei cambi di direzione. Forze laterali ben progettate sono fluide e controllate, contribuendo a un'esperienza dinamica. Forze laterali mal gestite producono una brusca spinta contro il fianco o la schiena, fonte di disagio o dolore.\n\nGli appassionati distinguono tra forze laterali morbide e intenzionali — come nelle ampie curve basse di una classica montagna russa in legno — e forze laterali brutali dovute all'usura del binario o a una progettazione scadente. Le montagne russe in legno sono particolarmente associate al movimento laterale: il gioco del binario e l'energia laterale delle curve non inclinate fanno parte dell'autentica esperienza su legno. Le sequenze laterali fluide nelle sezioni a elica — come su Balder a Liseberg — sono spesso citate come momenti salienti dagli appassionati.",
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Laterali', 'Forze G Laterali'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Intense forze G negative che proiettano bruscamente i passeggeri fuori dal sedile, trattenuti solo dal dispositivo di sicurezza.',
    definition:
      "L'ejector airtime descrive la forma più intensa delle forze G negative: la traiettoria dell'attrazione si discosta così bruscamente dalla caduta libera che i passeggeri vengono proiettati violentemente fuori dai loro sedili, trattenuti solo dal dispositivo di sicurezza. La sensazione è quella di un'espulsione attiva dal sedile — netta e improvvisa, può rasentare la violenza se la transizione è troppo brusca.\n\nL'ejector airtime è più comunemente associato agli hybrid coaster RMC, ad alcuni hyper coaster Intamin e alle moderne montagne russe in legno con colline paraboliche ripide. Gli appassionati descrivono i migliori momenti ejector come il culmine di un circuito — un breve istante mozzafiato di vera assenza di peso. Untamed a Walibi Holland, Wildfire a Kolmården e Steel Vengeance a Cedar Point sono frequentemente citati per le loro sequenze ejector tra le più intense al mondo.",
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'Forze G negative dolci e prolungate che producono una lunga sensazione di galleggiamento in cima a una collina.',
    definition:
      "Il floater airtime descrive l'estremità morbida dello spettro delle forze G negative: una sensazione lenta e prolungata in cui i passeggeri si sollevano leggermente dal sedile e galleggiano in assenza di peso per un lungo momento mentre il treno supera una collina seguendo un arco parabolico graduale. La forza è lieve — tipicamente tra −0,1G e −0,3G — rendendola accessibile anche ai passeggeri che trovano l'intensità dell'ejector eccessiva.\n\nIl floater airtime è caratteristico degli hyper e giga coaster B&M, che utilizzano grandi colline dolcemente arrotondate progettate per produrre lunghe fasi di galleggiamento. Shambhala a PortAventura, Silver Star a Europa-Park e Goliath a Walibi Holland sono esempi europei celebrati per le loro lunghe sequenze floater. Molti appassionati trovano la qualità rilassata del floater più confortevole dell'intensità dell'ejector, anche se le opinioni sono divise su quale stile sia superiore.",
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      "La sensazione di essere sospesi nei dispositivi di sicurezza durante un'inversione, causata da forze G negative a testa in giù.",
    definition:
      "L'hangtime descrive l'esperienza particolare delle forze G negative durante un'inversione: il treno rimane abbastanza a lungo in cima a una figura capovolta perché le forze G negative si manifestino — i passeggeri si ritrovano letteralmente sospesi nei dispositivi di sicurezza. A differenza del breve momento capovolto di un looping veloce, l'hangtime si verifica quando il treno rallenta vicino all'apice di un'inversione, creando una sospensione prolungata. Il peso del corpo si sposta interamente nelle spalle o nelle ginocchia.\n\nL'hangtime è più pronunciato sugli elementi in cui il treno rallenta notevolmente all'apice dell'inversione — il pretzel loop sui flying coaster è l'esempio classico, poiché la velocità è sufficientemente bassa da generare forze G negative sostenute in posizione completamente capovolta. Il heartline roll di alcune attrazioni moderne può produrre hangtime. Gli appassionati considerano generalmente l'hangtime una delle sensazioni di inversione più emozionanti.",
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion', 'pretzel-loop'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Elemento delle montagne russe',
    shortDefinition:
      "Una sezione o caratteristica denominata di una montagna russa, come un looping, una collina airtime o un'inversione.",
    definition:
      "Un elemento delle montagne russe è qualsiasi caratteristica distinta e denominata incorporata nel percorso di una montagna russa — dalle classiche inversioni come looping e cavatappi agli elementi non invertenti come le colline airtime, le eliche e le curve sopraelevate (overbank). Gli ingegneri progettano ogni elemento per produrre una specifica sensazione fisica: assenza di peso (airtime), forze G laterali o il disorientamento da capogiro.\n\nIl glossario di park.fan copre decine di elementi individuali — dal primo drop e dal lifthill alle specialità moderne come lo Stengel dive, il Norwegian loop e l'heartline roll.",
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Prima fila',
    shortDefinition:
      'La prima fila di sedili in un treno di montagne russe, che offre generalmente la migliore vista e le sensazioni più intense.',
    definition:
      "La prima fila è la prima fila di sedili in un treno di montagne russe. I posti in prima fila offrono una vista libera verso il basso, molto apprezzati dai passeggeri per l'esperienza visiva. Sui hypercoaster e gigas, la prima fila spesso sperimenta il massimo airtime durante il primo drop, poiché i passeggeri non hanno nessuno di fronte che blocchi la loro sensazione di spazio. L'effetto psicologico di vedere il drop avvicinarsi — e poi precipitare nel vuoto — aumenta il fattore brivido ben oltre quello delle file centrali o posteriori.\n\nSu molti coaster, la prima fila è diventata così desiderabile che i parchi offrono bypass delle code o prenotazioni express specificamente per questa posizione di seduta.",
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    alternateNames: ['Primo sedile', 'Prima posizione'],
  },
  {
    id: 'back-row',
    name: 'Ultima fila',
    shortDefinition:
      "L'ultima fila di sedili in un treno, nota per l'airtime intenso e le sensazioni prolungate di sospensione su percorsi ricchi di colline.",
    definition:
      "L'ultima fila è l'ultima fila di sedili in un treno di montagne russe. I posti in ultima fila su coaster ricchi di colline — hypers, gigas, design focalizzati su airtime — sono apprezzati dagli appassionati per produrre il massimo airtime ejector. Su ogni collina successiva, l'ultima fila sperimenta forze G negative sostenute mentre il treno supera la cresta e i passeggeri vengono espulsi dai sedili (trattenuti solo dai dispositivi di sicurezza). Questo effetto si cumula su più colline: l'airtime in ultima fila è tipicamente più forte, più prolungato e più intenso rispetto alla fila anteriore o centrale.\n\nSu coaster come Goliath o Shambhala, l'ultima fila è considerata la posizione di seduta principale dagli appassionati.",
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    alternateNames: ['Ultimo sedile', 'Ultima posizione'],
  },
  {
    id: 'middle-row',
    name: 'Fila centrale',
    shortDefinition:
      "Le file centrali di un treno di montagne russe, che offrono un'esperienza equilibrata tra la prima e l'ultima fila.",
    definition:
      "Le file centrali sono i sedili al centro di un treno di montagne russe — posizionati tra l'impatto psicologico intenso della prima fila e l'airtime ejector dell'ultima fila. Le file centrali tendono a offrire un'esperienza equilibrata: visione sufficiente per vedere il layout che si avvicina, airtime significativo, ma nessuno degli estremi della prima o dell'ultima fila. Per le famiglie o i visitatori al primo viaggio nervosi per l'intensità, le file centrali forniscono un'esperienza di coaster più accessibile.\n\nLe file centrali ricevono meno discussione nei circoli di appassionati perché non sono specializzate per una particolare sensazione. Tuttavia, su coaster con forze laterali estese, le file centrali possono a volte sentire la più grande compressione semplicemente a causa della loro posizione nel centro di massa del treno.",
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    alternateNames: ['Sedile centrale', 'Fila del mezzo'],
  },
  {
    id: 'ride-cart',
    name: 'Vagone',
    shortDefinition:
      'Veicolo o auto individuale in un treno di montagne russe che contiene una o più file di passeggeri.',
    definition:
      'Un vagone (anche chiamato auto, car o semplicemente vagone) è il segmento di veicolo individuale che contiene i passeggeri su una montagna russa. Un tipico treno coaster è composto da più vagoni collegati insieme, con ogni vagone che contiene una o più file di passeggeri seduti schiena contro schiena. I produttori di montagne russe progettano le dimensioni dei vagoni, il posizionamento dei sedili e la geometria dei dispositivi di sicurezza per ottimizzare sia il comfort che la sensazione.\n\nLa progettazione dei vagoni varia notevolmente tra i tipi di coaster: gli hypercoaster utilizzano vagoni snelli e a basso profilo per ridurre la resistenza aerodinamica; i coaster invertiti sospendono i passeggeri sotto la traccia; i wing coaster posizionano i passeggeri ai lati senza traccia sotto di loro; i flying coaster montano i passeggeri a faccia in giù. Produttori come B&M, Intamin e Mack hanno ciascuno progetti di vagone distintivi.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    alternateNames: ['Auto', 'Car'],
  },
  {
    id: 'lap-bar',
    name: 'Barra inguinale',
    shortDefinition:
      'Un dispositivo di sicurezza orizzontale sulle ginocchia che consente maggiore libertà di movimento rispetto ai dispositivi sulle spalle.',
    definition:
      'Una barra inguinale è un dispositivo di sicurezza orizzontale che immobilizza i passeggeri sulle cosce superiori. A differenza dei dispositivi sulle spalle che avvolgono completamente il torso, le barre inguinali consentono al corpo superiore di muoversi più liberamente, creando una sensazione più aperta e meno restrittiva. Le barre inguinali sono standard sulla maggior parte dei coaster moderni, gigas e molti coaster tradizionali in acciaio e legno. Durante i momenti di airtime, le barre inguinali consentono ai passeggeri di sperimentare la piena sensazione di essere espulsi dal sedile, creando la sensazione che solo la barra li impedisce di volare fuori dal veicolo.\n\nLe barre inguinali sono preferite dagli appassionati per i coaster ad alto airtime perché forniscono la sensazione di airtime più inibita. Tuttavia, richiedono un corretto posizionamento e possono essere scomode per i rider con torsi più lunghi. I produttori hanno continuamente affinato il design della barra inguinale nel corso dei decenni, e le barre moderne sono significativamente più comode delle generazioni precedenti.',
    relatedTermIds: ['airtime', 'ride-cart', 'shoulder-harness'],
    alternateNames: ['Dispositivo inguinale'],
  },
  {
    id: 'shoulder-harness',
    name: 'Dispositivo sulle spalle',
    shortDefinition:
      'Un dispositivo di sicurezza sulle spalle che avvolge completamente il torso, limitando il movimento durante il viaggio.',
    definition:
      "Un dispositivo sulle spalle (anche chiamato dispositivo sulle spalle o harness OTS) è un dispositivo di sicurezza che scende su entrambe le spalle e attraverso le ginocchia, avvolgendo completamente il torso. I dispositivi sulle spalle erano standard sui coaster dagli anni '80 ai 2000 e rimangono comuni sui coaster invertiti, su alcuni coaster sospesi e sulle attrazioni familiari dove la sicurezza massima è prioritaria. I dispositivi moderni includono meccanismi di cricchetto che consentono una tensione variabile per adattarsi a diversi tipi di corpo.\n\nQuando si è seduti in un dispositivo sulle spalle su un coaster ad alto airtime, la sensazione è notevolmente diversa da una barra inguinale: i passeggeri non possono sollevarsi dal sedile in modo così drammatico perché il dispositivo li tiene verso il basso. Questo compromesso — maggiore sicurezza e comfort rispetto a una sensazione di airtime meno intensa — è una scelta di design chiave che i produttori fanno.",
    relatedTermIds: ['airtime', 'lap-bar', 'ride-cart'],
    alternateNames: ['Dispositivo OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Ricordo',
    shortDefinition:
      'Un oggetto commemorativo o un piccolo articolo acquistato in un parco a tema per ricordare una visita.',
    definition:
      "Un ricordo è un oggetto commemorativo fisico — merchandise, abbigliamento o articolo da collezione — acquistato dai visitatori per ricordare la loro visita al parco. I ricordi comuni includono magliette con loghi del parco, cappelli, spille, cartoline e peluche a tema. I ricordi servono sia uno scopo funzionale (abbigliamento indossabile) che uno emotivo — ancorano i ricordi di una visita specifica e creano connessioni durature con i parchi amati.\n\nI parchi a tema fanno molto affidamento sulle vendite di ricordi come flusso di entrate; il merchandise in genere porta un margine di 2–3x rispetto ai prezzi al dettaglio. Per molti ospiti, collezionare ricordi da più parchi è parte dell'esperienza — raccogliere spille, scambiarle con altri o costruire uno scaffale commemorativo.",
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    alternateNames: ['Ricordo commemorativo'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Prodotti ufficiali venduti da un parco a tema, inclusi abbigliamento, articoli da collezione e articoli a tema.',
    definition:
      "Il merchandise si riferisce a tutti i beni venduti da un parco a tema — dall'abbigliamento di marca (magliette, felpe, cappelli) agli articoli da collezione (spille, figurine, peluche), merchandise alimentare/bevande e articoli a tema speciale legati ad attrazioni specifiche o franchise. I parchi a tema operano vaste operazioni di merchandise che coprono dozzine di negozi, carrelli mobili e boutique specifiche. Il merchandise è un pilastro critico delle entrate per i parchi, generando spesso il 15–25% della spesa totale degli ospiti, secondo solo al cibo e alle bevande.\n\nI parchi moderni utilizzano strategie di merchandising sofisticate: articoli a edizione limitata stagionali, merchandise di collaborazione con franchise popolari, design esclusivi del parco non disponibili da nessun'altra parte, e versioni speciali legate alle nuove aperture di attrazioni o agli anniversari.",
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Negozio di souvenir',
    shortDefinition:
      "Un negozio al dettaglio all'interno di un parco a tema che vende ricordi, merchandise e prodotti a tema.",
    definition:
      "Un negozio di souvenir è uno spazio al dettaglio all'interno di un parco a tema dedicato alla vendita di ricordi, merchandise e prodotti a tema — situato in un'area centrale (come una piazza principale) o integrato in aree tematiche specifiche e attrazioni. I grandi parchi gestiscono dozzine di negozi di souvenir che vanno da piccoli carrelli a grandi magazzini. I negozi di souvenir sono posizionati strategicamente nei punti di alto traffico: code di uscita dalle attrazioni principali, corridoi dell'hotel e ingressi/uscite del parco dove gli ospiti hanno tempo libero e inclinazione all'acquisto.\n\nI negozi di souvenir moderni utilizzano un design al dettaglio sofisticato: posizionamento dell'ingresso, ambiente a tema e collocamento strategico dei prodotti. Molte attrazioni fanno passare gli ospiti direttamente attraverso aree di merchandise — una strategia provata per aumentare gli acquisti d'impulso. I parchi utilizzano sempre più il merchandise IP (licenze e franchise) per giustificare i prezzi premium.",
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
    aliases: ['Negozio di ricordi'],
  },
  {
    id: 'park-exclusive',
    name: 'Esclusiva del parco',
    shortDefinition:
      "Un prodotto o articolo disponibile solo in un parco a tema specifico, non disponibile per l'acquisto altrove.",
    definition:
      "Il merchandise esclusivo del parco è un prodotto progettato e venduto solo in un parco a tema specifico o all'interno di un sistema di parchi — non disponibile per l'acquisto presso alcun rivenditore esterno. Gli articoli esclusivi del parco creano scarsità percepita, incoraggiano gli acquisti d'impulso dalla sensazione che l'articolo non può essere ottenuto altrove, e giustificano il prezzo premium (spesso 2–3x il margine di vendita al dettaglio tipico). Gli articoli esclusivi comuni includono abbigliamento a edizione limitata, spille da collezione, articoli a tema legati alle aperture di nuove attrazioni o agli eventi stagionali.\n\nLa strategia esclusiva del parco è fondamentale per la psicologia del merchandising moderno: i visitatori che hanno viaggiato lontano e speso notevolmente per l'ammissione sentono un impulso elevato di acquistare articoli che non possono ottenere a casa. I mercati secondari (piattaforme di rivendita online) dimostrano che gli articoli esclusivi rari e desiderati del parco mantengono e apprezzano il valore, promuovendo ulteriormente il comportamento da collezionista.",
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Esclusivo'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition: 'Montagna russa in cui i passeggeri viaggiano in posizione prona.',
    definition:
      "Un flying coaster trasporta i passeggeri in posizione orizzontale prona, simulando la sensazione del volo. I treni ruotano dalla posizione seduta in stazione alla posizione orizzontale prima dell'inizio della corsa. Esempi notevoli: Manta (SeaWorld Orlando) e Tatsu (Six Flags Magic Mountain), entrambi di B&M.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    alternateNames: ['Flyer', 'Coaster volante', 'Prone coaster'],
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
    relatedTermIds: ['airtime', 'steel-coaster', 'wooden-coaster'],
    aliases: ['terrain coaster', 'coaster paesaggistico'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition: 'Montagna russa in acciaio senza pavimento, con i piedi a penzoloni.',
    definition:
      'Su un floorless coaster, il pavimento del veicolo si ritrae una volta che i passeggeri sono fissati, lasciando le gambe penzolanti sopra la rotaia. A differenza degli inverted coaster, la rotaia passa sotto il veicolo anziché sopra. B&M fu pioniera con Medusa (1999). Esempio europeo: Goliath (Walibi Holland).',
    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster', 'steel-coaster'],
    aliases: ['floorless', 'coaster senza pavimento', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Produttore americano responsabile del primo loop moderno.',
    definition:
      "Arrow Dynamics (fondata nel 1945) è stato un produttore americano pioniere che ha introdotto la rotaia tubolare in acciaio moderna e il primo loop verticale moderno su Corkscrew (Knott's Berry Farm, 1975). Le attrazioni Arrow sono note per i corkscrew e i suspended looping coaster. L'azienda dichiarò fallimento nel 2001 e i suoi asset furono acquisiti da S&S.",
    relatedTermIds: ['corkscrew', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Produttore americano di montagne russe in legno con layout veloci e tortuosi.',
    definition:
      'Great Coasters International (GCI) è un produttore americano specializzato in montagne russe in legno. Fondato nel 1994, GCI è noto per i treni Millennium Flyer e layout con rapidi cambi di direzione e airtime sostenuto. Installazioni notevoli: Wodan (Europa-Park), Thunderhead (Dollywood) e Troy (Toverland).',
    relatedTermIds: ['airtime', 'rmc', 'terrain-coaster', 'wooden-coaster'],
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
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Produttore tedesco di Monaco noto per gli spinning coaster con trick track, la piattaforma X-Car e il modello verticale Sky Loop.',
    definition:
      "Maurer Rides (Maurer AG, lavorazione dei metalli dal 1876, attrazioni dal 1993) è un produttore monacense. La serie SC di spinning coaster si distingue per il trick track — una sezione in cui il vagone si inclina lateralmente — e la piattaforma X-Car consente layout compatti altamente personalizzati con lanci e inversioni.\n\nIl Sky Loop è un loop verticale autonomo presente in molti parchi europei come attrazione che occupa poco spazio. Installazioni europee notevoli: Winja's Fear e Winja's Force a Phantasialand (Germania), spinning coaster indoor con trick track.",
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Produttore italiano con uno dei più grandi portafogli di coaster familiari e attrazioni nel mondo — oltre 250 coaster installati.',
    definition:
      "Zamperla (fondato nel 1966, Altavilla Vicentina, Italia) è uno dei produttori di attrazioni più prolifici al mondo. Mentre Intamin, B&M e Mack puntano a grandi installazioni ad alta intensità, Zamperla si concentra su volume e accessibilità — i modelli Family Coaster, Mini Coaster, Twister e Disk'O Coaster sono elementi standard dei parchi di medie dimensioni e dei resort di tutto il mondo.\n\nLe dimensioni compatte e i requisiti di altezza moderati rendono le attrazioni Zamperla particolarmente diffuse nei parchi urbani europei, nei resort e nelle strutture coperte. L'azienda ha anche costruito Thunderbolt a Coney Island (New York).",
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition: `Produttore tedesco di attrazioni fondato nel 1961, noto per il Top Spin, il Break Dance, l'Enterprise, il Ranger e il Condor.`,
    definition: `Huss Rides GmbH è un produttore tedesco di attrazioni fondato nel 1961 da Paul Huss, con sede a Brema. L'azienda ha prodotto alcuni dei modelli di flat ride più riconoscibili della fine del XX secolo, presenti in parchi a tema e fiere di tutto il mondo.\n\nI modelli Huss più noti sono il Top Spin, il Break Dance (veicoli rotanti su una piattaforma girevole), l'Enterprise (ruota centrifuga a gondole), il Ranger (nave a pendolo oscillante), il Condor (torre di sedie rotante) e la Troika. Molti di questi modelli sono diventati standard del settore e ampiamente imitati. Le attrazioni Huss sono particolarmente associate all'epoca d'oro dei flat ride nei parchi europei degli anni ottanta e novanta.`,
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Produttore americano noto per le torri pneumatiche, il compatto El Loco e i coaster Free Fly 4D.',
    definition:
      "S&S Worldwide (fondato nel 1994, Logan, Utah; acquisito da Sansei Technologies nel 2012) ha sviluppato inizialmente sistemi di caduta pneumatici — Space Shot e Turbo Drop — prima di espandere il catalogo ai coaster. L'El Loco è un coaster estremo compatto con una prima discesa oltre la verticale e un'inversione. Il Free Fly è un coaster 4D con sedile a rotazione libera.\n\nS&S ha anche acquisito i beni del leggendario Arrow Dynamics dopo il suo fallimento nel 2001. In Europa, le installazioni S&S sono meno comuni che in Nord America.",
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Produttore bavarese specializzato in coaster familiari — oltre 190 installazioni in tutto il mondo.',
    definition:
      'Zierer (fondato nel 1930, Deggendorf, Baviera) è un produttore tedesco specializzato in montagne russe familiari e attrazioni classiche da parco. La gamma Force Coaster copre più livelli, dai modelli junior compatti alle installazioni Force Custom più veloci. I coaster Zierer si distinguono per la rotaia tubolare in acciaio, la qualità di marcia fluida e i requisiti di altezza moderati.\n\nCon oltre 190 montagne russe consegnate nel mondo, Zierer è uno dei costruttori europei più prolifici per numero di unità. Installazioni notevoli: Feuerdrache nel Legoland Deutschland e coaster familiari in parchi tedeschi, olandesi e scandinavi.',
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition:
      'Inversione in cui il treno rimane brevemente capovolto a velocità quasi zero.',
    definition:
      "Uno stall (o zero-G stall) è un elemento in cui il treno entra in un'inversione al culmine e rallenta quasi fino all'arresto, lasciando i passeggeri capovolti. Sviluppato da Rocky Mountain Construction (RMC), l'elemento produce un lungo hangtime. Esempi famosi: Zadra (Energylandia) e Steel Vengeance (Cedar Point).",
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['zero-g stall', 'RMC stall', 'elemento hangtime', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition: 'Curva sopraelevata che genera airtime a metà cambiamento di direzione.',
    definition:
      "Un wave turn è una curva sopraelevata ad alta velocità che attraversa brevemente forze G negative o laterali, creando una sensazione di airtime nel mezzo della curva. Comune sulle attrazioni Rocky Mountain Construction, l'elemento combina cambio direzionale con ejector o floater airtime. Presente su Wildfire (Kolmården) e Untamed (Walibi Holland).",
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['wave turn', 'curva con airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Mezza Stagione',
    shortDefinition: 'Periodo tra alta e bassa stagione con affluenza moderata.',
    definition:
      "La mezza stagione indica i periodi di transizione tra la stagione di punta e i momenti più tranquilli di un parco. Tipicamente primavera (marzo–maggio) e inizio autunno (settembre–ottobre) nei parchi europei. L'affluenza è moderata, i prezzi spesso più bassi e la maggior parte delle attrazioni è aperta — un periodo apprezzato dagli appassionati.",
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    aliases: ['bassa stagione', 'shoulder season', 'stagione intermedia', 'off-peak'],
  },
  {
    id: 'school-holiday',
    name: 'Vacanze Scolastiche',
    shortDefinition: 'Periodi di vacanza scolastica che causano picchi di affluenza ai parchi.',
    definition:
      'Le vacanze scolastiche — estive, natalizie, pasquali e di metà anno — sono il principale fattore che determina i picchi di affluenza nei parchi a tema. Le famiglie con bambini concentrano le visite in questi periodi. I parchi spesso estendono gli orari, arricchiscono il programma e aumentano i prezzi. Evitare le vacanze scolastiche è la strategia più efficace per ridurre i tempi di attesa.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'shoulder-season'],
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
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
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
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'trackless-ride'],
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
    relatedTermIds: ['character-dining', 'photo-pass', 'themed-land'],
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
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pre show', 'area di attesa tematizzata', 'zona pre-imbarco'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition:
      'Attrazione a livello del suolo che ruota, oscilla o si inclina senza un circuito di binari sopraelevato.',
    definition:
      "Un flat ride è una categoria di attrazioni che funzionano su un piano sostanzialmente orizzontale senza binari sopraelevati. Il termine comprende attrazioni rotanti (giostre, tazze pazze), Frisbees (attrazioni a pendolo), Top Spins e giostre a catene (seggiolini volanti), torri di caduta e piattaforme rotanti.\n\nA differenza delle montagne russe, i flat ride occupano in genere uno spazio ridotto, rendendoli ideali per le aree più piccole del parco. Molti offrono un'alta capacità oraria, requisiti minimi di altezza bassi o assenti e una vasta fascia di età – costituiscono spesso l'ossatura dell'offerta per famiglie e bambini di un parco.",
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['flat rides', 'giostra da fiera', 'attrazione di terra'],
  },
  {
    id: 'water-ride',
    name: 'Attrazione Acquatica',
    shortDefinition:
      "Attrazione in cui gli ospiti viaggiano su barche o veicoli attraverso l'acqua, rischiando di bagnarsi.",
    definition:
      "Un'attrazione acquatica (water ride) è qualsiasi attrazione in cui l'acqua è una componente centrale dell'esperienza – il veicolo percorre un canale d'acqua oppure l'acqua viene utilizzata come effetto deliberato. I tre tipi più comuni sono: le giostre a tronchi (barche su un canale con caduta finale), i fiumi dei rapidi (zattere circolari su acque bianche artificiali) e le battaglie d'acqua (gli ospiti si spruzzano reciprocamente con cannoni d'acqua). Le attrazioni acquatiche hanno in genere requisiti di altezza bassi e un pubblico molto ampio. Nelle giornate calde estive possono generare code estremamente lunghe.",
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ["attrazione d'acqua", 'ride acquatico', 'water ride', 'giostra acquatica'],
  },
  {
    id: 'live-show',
    name: 'Spettacolo dal Vivo',
    shortDefinition:
      'Spettacolo programmato con attori dal vivo, musica, acrobazie o personaggi in un teatro o anfiteatro dedicato.',
    definition:
      "Uno spettacolo dal vivo è un programma di intrattenimento eseguito da membri del cast umano – distinto da attrazioni o esibizioni fisse – in un anfiteatro all'aperto, teatro al chiuso o spazio scenico in strada. L'offerta varia da produzioni teatrali in stile Broadway e stunt show a sfilate di personaggi, esperienze 4D con elementi dal vivo e spettacoli laser e pirotecnici. A differenza delle attrazioni, gli spettacoli dal vivo si svolgono a orari fissi con capacità limitata per rappresentazione; inserirli nel piano di visita è importante per evitare conflitti di orario. Strategicamente, gli spettacoli sono una pausa utile nelle ore di punta del mezzogiorno, quando le file alle attrazioni sono più lunghe.",
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    aliases: ['show', 'spettacolo', 'stunt show', 'show dal vivo', 'intrattenimento dal vivo'],
  },
  {
    id: 'quick-service',
    name: 'Self-Service',
    shortDefinition: 'Ristorante a banco senza personale di sala.',
    definition:
      'Il self-service (detto anche counter service) indica i ristoranti del parco dove gli ospiti ordinano al banco e portano il cibo autonomamente al tavolo. È la formula più comune nei parchi a tema, apprezzata per velocità e praticità. Disney ha reso popolare il termine "quick service" per distinguerlo dal "table service" nel suo sistema di prenotazione.',
    relatedTermIds: ['character-dining', 'table-service'],
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
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    aliases: ['table service', 'ristorante con servizio', 'cena con prenotazione'],
  },
  {
    id: 'character-dining',
    name: 'Cena con i Personaggi',
    shortDefinition:
      'Ristorante in cui i personaggi in costume visitano i tavoli durante il pasto.',
    definition:
      "Il character dining è un'esperienza di ristorazione (servizio al tavolo o buffet) in cui i personaggi in costume visitano ogni tavolo per interagire con gli ospiti, scattare foto e firmare autografi. Garantisce l'incontro con i personaggi senza una coda separata, rendendolo molto apprezzato dalle famiglie. Esempi: Chef Mickey's (Disney World) e lo Storybook Dining all'Auberge de Cendrillon (Disneyland Paris).",
    relatedTermIds: ['character-meet-and-greet', 'quick-service', 'table-service'],
    aliases: [
      'colazione con personaggi',
      'pranzo con personaggi',
      'character dining',
      'cena personaggi',
    ],
  },
  {
    id: 'drop-tower',
    name: 'Drop Tower',
    shortDefinition:
      'Attrazione a torre che porta i visitatori in quota e li lascia cadere in una rapida discesa in caduta libera.',
    definition:
      "Una torre di caduta (drop tower o free-fall tower) è un'attrazione in cui i visitatori vengono sollevati in una gondola o su sedili individuali intorno a una struttura centrale a torre e poi rilasciati in una rapida caduta verso il basso. La caduta può essere quasi in caduta libera (vicina all'assenza di peso), frenata o combinata con un lancio verso l'alto. Una fase di decelerazione progressiva frena dolcemente la gondola in basso. Le varianti includono torri rotanti, modelli multidirezionali e versioni ibride. Le torri di caduta offrono emozioni intense su un'impronta ridotta e si trovano in tutto il mondo. Produttori notevoli: Intamin, Mondial e S&S Worldwide.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'intamin', 's-and-s-worldwide'],
    aliases: [
      'torre caduta libera',
      'free fall tower',
      'drop ride',
      'caduta libera',
      'torri di caduta',
    ],
  },
  {
    id: 'log-flume',
    name: 'Fiume dei Tronchi',
    shortDefinition:
      "Attrazione su canale d'acqua in cui barche a forma di tronco percorrono un tracciato e terminano con un grande tuffo.",
    definition:
      "Il fiume dei tronchi (log flume) è un'attrazione acquatica in cui gli ospiti prendono posto su imbarcazioni a forma di tronco e percorrono un canale pieno d'acqua. Dopo sezioni tranquille arriva una ripida discesa finale che si conclude con un grande schizzo, quasi garantendo un bagno ai passeggeri. Le giostre a tronchi sono state introdotte negli anni '60 e sono ormai un elemento fisso dei parchi di tutto il mondo, apprezzate per la loro accessibilità familiare, la capacità moderata e il fascino estivo. Esempi europei: Poseidon in Europa-Park e numerose installazioni di tipo Wildwasserbahn nei parchi di lingua tedesca.",
    relatedTermIds: ['height-requirement', 'river-rapids', 'water-ride'],
    aliases: [
      'giostra a tronchi',
      'log flume',
      "scivolo d'acqua",
      'Wildwasserbahn',
      'barca di tronchi',
    ],
  },
  {
    id: 'river-rapids',
    name: 'Rapide del Fiume',
    shortDefinition:
      'Attrazione su zattera circolare che navega rapide artificiali turbolente dove i visitatori possono bagnarsi completamente.',
    definition:
      "Le rapide del fiume (river rapids) mettono gli ospiti su zattere circolari gonfiabili o in plastica che derivano e ruotano lungo un canale artificiale progettato per simulare le acque bianche. Poiché la zattera circolare ruota liberamente sulla corrente, ogni percorso è imprevedibile: a seconda della posizione della zattera, alcuni passeggeri vengono completamente bagnati, altri rimangono relativamente asciutti. Le rapide hanno in genere un'alta capacità oraria, un ampio appeal familiare e requisiti di altezza generalmente bassi. Sono particolarmente popolari nelle giornate calde. Esempi europei notevoli: le Wildwasser di Phantasialand e varie installazioni a Efteling, Europa-Park e Thorpe Park.",
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    aliases: ['rapide', 'river rapids', 'giro in zattera', 'acque bianche', 'rafting'],
  },
  {
    id: 'pendulum-ride',
    name: 'Attrazione a Pendolo',
    shortDefinition:
      'Flat ride in cui una gondola oscilla in un ampio arco a pendolo, spesso mentre ruota simultaneamente.',
    definition:
      "Un'attrazione a pendolo è un tipo di flat ride in cui una gondola è appesa a un lungo braccio che oscilla in un arco sempre più ampio, raggiungendo spesso posizioni quasi verticali. La gondola ruota anche attorno al proprio asse, combinando il moto pendolare con la rotazione assiale per un'esperienza ad alta intensità.\n\nL'esempio più iconico è il Frisbee (Mondial): una gondola a forma di disco che oscilla come un pendolo girando su se stessa. Altre attrazioni a pendolo diffuse sono il KMG Afterburner e l'Intamin Giant Frisbee. Le attrazioni a pendolo sono molto apprezzate nei parchi a tema e nelle fiere di tutto il mondo per il loro forte impatto visivo e l'ingombro relativamente contenuto.",
    relatedTermIds: ['drop-tower', 'flat-ride', 'height-requirement', 'swing-ride'],
    aliases: ['Frisbee', 'Frisbees', 'attrazioni a pendolo'],
    alternateNames: ['giostra a pendolo', 'attrazione oscillante'],
  },
  {
    id: 'top-spin',
    name: 'Top Spin',
    shortDefinition:
      'Attrazione di Huss in cui una gondola di passeggeri ruota liberamente in qualsiasi direzione mentre il telaio di supporto oscilla su e giù.',
    definition:
      "Il Top Spin è un modello di attrazione prodotto da Huss Rides. Una gondola con circa 40 passeggeri è montata su un telaio oscillante; la gondola può essere ruotata continuamente in qualsiasi direzione mentre il telaio oscilla, creando una combinazione imprevedibile di forze oscillatorie e rotative. L'attrazione è programmabile dal semplice dondolio alle rotazioni continue ad alta intensità.\n\nI Top Spin erano onnipresenti nei parchi a tema e nelle fiere dagli anni novanta agli anni 2010. Nonostante il movimento oscillante, il Top Spin non è un'attrazione a pendolo: la gondola non è appesa a un lungo braccio, ma è incastrata tra due bracci laterali rotanti.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition: `Un flat ride Huss con diversi vagoni montati su un grande disco rotante, dove ogni vagone ruota liberamente sul proprio asse.`,
    definition: `Il Break Dance è un modello di flat ride di Huss Rides in cui piccoli vagoni — ciascuno per due o quattro passeggeri — sono disposti attorno a un grande disco rotante. I vagoni possono ruotare liberamente sui propri assi mentre il disco gira, producendo forze di rotazione e inclinazione caotiche e imprevedibili che variano a ogni ciclo.\n\nIl Break Dance è diventato uno dei modelli di flat ride itineranti e permanenti più popolari a partire dagli anni '80, riconoscibile per il suo disco illuminato in rotazione e il programma musicale ad alta energia. Numerose varianti e imitazioni di altri produttori esistono sotto diversi nomi.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition: `Un flat ride centrifugo in cui le gondole su un grande anello rotante sono mantenute in posizione dalla forza G mentre l'anello si inclina verticalmente.`,
    definition: `L'Enterprise è un flat ride in cui le gondole sono disposte attorno alla circonferenza di un grande anello rotante. Man mano che l'anello accelera, la forza centrifuga spinge i passeggeri saldamente nei loro sedili; a piena velocità, l'intero anello si inclina progressivamente verso una posizione quasi verticale, lasciando i passeggeri ruotare al contrario.\n\nOriginata da Huss Rides e successivamente prodotta da altri produttori, l'Enterprise è diventata un elemento fisso sia dei parchi permanenti che delle fiere itineranti dagli anni '70. La sua drammatica inclinazione verticale la rende una delle silhouette di flat ride più spettacolari visivamente.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition: `Un flat ride a barca oscillante — una grande gondola a forma di nave vichinga o pirata che oscilla in un arco pendolare sempre più ampio.`,
    definition: `Il Ranger è il modello di barca oscillante di Huss Rides: una grande gondola a forma di drakkar vichingo o nave pirata che oscilla avanti e indietro in un arco, aumentando progressivamente l'ampiezza ad ogni oscillazione. I passeggeri siedono lungo i lati della nave, rivolti verso l'interno. All'oscillazione massima la gondola raggiunge angoli elevati, producendo forti forze G negative all'apice.\n\nLe giostre a barca oscillante sono prodotte da molti produttori in tutto il mondo con vari nomi (Viking, Pirate Ship, Sea Monster). Il Ranger è tra i modelli di flat ride Huss più ampiamente installati, presente in parchi permanenti e fiere itineranti in tutta Europa e oltre.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: [
      'swinging ship',
      'swinging ships',
      'pirate ship ride',
      'Viking ship ride',
      'barca pirata',
      'barca vichinga',
    ],
    alternateNames: ['Huss Ranger', 'nave vichinga', 'barca pirata'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition: `Un flat ride Huss con bracci gondola che si estendono verso l'esterno da una colonna centrale mentre la giostra ruota e sale.`,
    definition: `Il Condor è un modello di flat ride di Huss Rides composto da un'alta colonna centrale con diversi bracci gondola. Durante il funzionamento, i bracci si estendono verso l'esterno e le gondole salgono mentre l'intera struttura ruota. I passeggeri vivono una combinazione di rotazione, elevazione e inclinazione verso l'esterno — con viste sul parco da un'altezza moderata.\n\nIl Condor era una presenza comune nei parchi europei dagli anni '70 agli anni '90 e può ancora essere trovato in molte sedi permanenti. A volte viene confuso con le attrazioni a sedie volanti (giostre a catene) ma ha gondole chiuse piuttosto che sedie aperte sospese.`,
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition: `Un flat ride Huss con tre bracci rotanti, ognuno portante una gondola i cui vagoni ruotano simultaneamente con la piattaforma principale.`,
    definition: `La Troika è un modello di flat ride di Huss Rides in cui tre bracci si estendono da un mozzo centrale; ogni braccio porta una gondola con diversi vagoni che possono ruotare. Mentre la piattaforma principale gira, le gondole ruotano anch'esse e i vagoni girano, creando molteplici assi di rotazione simultanei. Il movimento risultante è molto imprevedibile e disorientante.\n\nLa Troika era un'aggiunta popolare ai parchi di divertimenti europei e alle fiere dagli anni '70 in poi. La sua simmetria a tre vie le conferisce un aspetto visivo distintivo. Le varianti e le imitazioni di altri produttori sono talvolta conosciute come Trabant o Walzer.`,
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'swing-ride',
    name: 'Giostra a Catene',
    shortDefinition:
      "Attrazione rotatoria in cui i seggiolini appesi a catene si inclinano verso l'esterno mentre la struttura gira.",
    definition:
      "La giostra a catene (swing ride o Kettenkarussell) è un'attrazione rotante in cui i seggiolini appesi a catene sono fissati a una struttura centrale girevole. Man mano che la struttura accelera, la forza centrifuga proietta i seggiolini verso l'esterno e verso l'alto, dando ai passeggeri una sensazione di volo. Le giostre a catene sono tra i più antichi tipi di attrazione da fiera ancora in uso, con origini nei primi anni del XX secolo. Le versioni moderne vanno da morbide giostre per bambini a enormi torri a catena (starflyer) che sollevono i passeggeri a decine di metri di altezza. Sono presenti in quasi tutti i parchi a tema e le fiere del mondo.",
    relatedTermIds: ['flat-ride', 'height-requirement', 'ride-capacity'],
    aliases: [
      'seggiolini volanti',
      'wave swinger',
      'Kettenkarussell',
      'swing ride',
      'chairoplane',
      'giostra volante',
      'giostre a catene',
    ],
  },
  {
    id: 'racing-coaster',
    name: 'Racing Coaster',
    shortDefinition:
      'Due binari paralleli di montagne russe su cui i treni partono contemporaneamente e corrono fianco a fianco.',
    definition:
      "Un racing coaster ha due circuiti separati ma speculari che corrono in parallelo, con i treni lanciati contemporaneamente in modo che i passeggeri vivano la sensazione di gareggiare contro l'altro convoglio. I binari si incrociano o si sfiorano in più punti per massimizzare la tensione. Alcuni modelli adottano un design a nastro di Möbius: entrambi i circuiti formano un unico anello continuo e i passeggeri cambiano automaticamente lato. Il formato funziona ugualmente bene con montagne russe in legno e in acciaio. In Europa, Piraten al Djurs Sommerland e Dwervelwind al Plopsaland sono esempi noti.",
    relatedTermIds: ['credit', 'steel-coaster', 'wooden-coaster'],
    aliases: [
      'montagne russe doppie',
      'twin coaster',
      'dueling coaster',
      'racing coaster',
      'Paarachterbahn',
    ],
  },
  {
    id: 'high-five',
    name: 'High Five',
    shortDefinition:
      'Elemento di montagne russe in cui due treni su binari paralleli si sfiorano a distanza di un braccio.',
    definition:
      "Un High Five è un elemento di quasi-collisione in cui due treni di montagne russe su binari separati ma molto vicini si incrociano a distanza estremamente ravvicinata – a volte a portata di mano – creando un'emozionante illusione di collisione imminente. Il nome deriva dalla sensazione che i passeggeri possano tendere la mano per fare un \"high five\" agli occupanti dell'altro treno. L'elemento richiede una sincronizzazione precisa delle partenze per far arrivare entrambi i treni al punto di incrocio nello stesso momento. I wing coaster e gli inverted coaster si prestano particolarmente bene al High Five perché i sedili esterni amplificano l'effetto di sfioramento. Duelling Dragons / Dragon Challenge a Universal's Islands of Adventure ne era un famoso esempio; l'elemento si ritrova oggi su diversi B&M wing coaster in tutto il mondo.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['quasi-collisione', 'near miss', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Prenotazione Ristorante',
    shortDefinition:
      'Prenotazione anticipata per un ristorante a servizio completo in un parco a tema o resort.',
    definition:
      "Una prenotazione ristorante è una prenotazione anticipata per un ristorante con servizio al tavolo o a tema con personaggi in un parco a tema, un hotel del resort o un complesso di intrattenimento associato. Nei parchi Disney, le prenotazioni sono possibili fino a 60 giorni in anticipo (con 10 giorni di vantaggio per gli ospiti dell'hotel del resort) e sono praticamente indispensabili per i ristoranti più gettonati – non prenotare in anticipo può significare non trovare posto nei periodi di punta. Le prenotazioni vengono in genere garantite con una carta di credito; Disney addebita una penale in caso di mancata presentazione o cancellazione tardiva. Nella comunità degli appassionati vengono spesso abbreviate come ADR (Advance Dining Reservation).",
    relatedTermIds: ['character-dining', 'peak-day', 'table-service'],
    aliases: [
      'ADR',
      'advance dining reservation',
      'prenotazione al ristorante',
      'dining reservation',
      'prenotazione tavolo',
    ],
  },
  {
    id: 'mobile-ordering',
    name: 'Ordine Mobile',
    shortDefinition:
      "Funzione dell'app del parco che consente di ordinare e pagare il cibo in anticipo senza fare la fila al banco.",
    definition:
      "L'ordine mobile consente agli ospiti di consultare il menu di un ristorante, effettuare e pagare un'ordinazione e selezionare una finestra temporale per il ritiro tramite l'app ufficiale del parco, senza dover fare la fila al banco. Disney ha reso popolare il sistema nei suoi ristoranti a servizio rapido; Universal, Six Flags, i parchi Merlin e molti altri operatori hanno da allora lanciato le proprie versioni. Quando arriva la fascia oraria scelta, gli ospiti ricevono una notifica e ritirano l'ordine all'apposito punto di raccolta. L'ordine mobile consente di risparmiare tempo prezioso, soprattutto durante il picco del pranzo. Richiede uno smartphone carico e una copertura di rete sufficiente all'interno del parco.",
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['ordinazione mobile', 'mobile order', 'ordine via app', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Grande area ristoro condivisa con più banchi di ristorazione rapida di cucine diverse sotto uno stesso tetto.',
    definition:
      "Un food court è uno spazio di ristorazione comune con più banchi o chioschi di ristorazione rapida indipendenti, ciascuno con una diversa cucina, che condividono una zona seduta comune. Nei parchi a tema, i food court sono in genere le aree di ristorazione con la maggiore capacità, progettate per gestire il flusso di visitatori all'ora di pranzo. Diversi membri di un gruppo possono ordinare a banconi diversi e sedersi insieme. Il livello di tematizzazione varia: Disney e Universal integrano spesso i food court nella tematica delle loro aree, mentre altri parchi li gestiscono come spazi puramente funzionali vicino agli ingressi. I food court sono in genere l'opzione di ristorazione più economica all'interno di un resort.",
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['area ristoro', 'padiglione ristorazione', 'food court', 'zona ristorazione'],
  },
  {
    id: 'capacity-closure',
    name: 'Chiusura per Capacità',
    shortDefinition:
      'Quando un parco smette di ammettere nuovi visitatori perché ha raggiunto la capienza massima.',
    definition:
      "Una chiusura per capacità (detta anche parco esaurito o tetto di capienza) si verifica quando un parco a tema raggiunge il numero massimo di visitatori consentito e smette temporaneamente di vendere biglietti giornalieri o di ammettere nuovi ospiti. I parchi gestiscono la capienza attraverso prenotazioni di ingresso a orario, monitoraggio in tempo reale degli afflussi e chiusure temporanee degli accessi. I titolari di abbonamento annuale possono essere bloccati in certi giorni a seconda delle condizioni del parco; altri parchi usano sistemi di prenotazione anticipata per prevenire il sovraffollamento. Le chiusure per capacità sono più frequenti durante i picchi delle vacanze scolastiche, le serate di fuochi d'artificio e gli eventi speciali. Consultare l'app del parco o i social media la mattina della visita può evitare spiacevoli sorprese.",
    relatedTermIds: ['crowd-level', 'peak-day', 'school-holiday', 'season-pass'],
    aliases: [
      'parco esaurito',
      'parco pieno',
      'capacity closure',
      'capienza massima',
      'tutto esaurito',
    ],
  },
  {
    id: 'zero-g-winder',
    name: 'Zero-G Winder',
    shortDefinition:
      "Una variante dello zero-G roll con un cambio di direzione integrato — il treno entra ed esce dall'inversione su rotte diverse.",
    definition:
      "Lo zero-G winder combina il concetto centrale dello zero-G roll — una rotazione di 360 gradi su un arco parabolico che genera quasi assenza di gravità al vertice — aggiungendo un cambio di direzione nella geometria del binario. Mentre in uno zero-G roll classico il treno entra ed esce su rotte approssimativamente parallele, il winder curva il binario durante la rotazione in modo che il treno esca puntando in una direzione significativamente diversa da quella di ingresso. Questo rende l'elemento uno strumento di progettazione del percorso oltre che un'inversione: fornisce allo stesso tempo la sensazione fluttuante di uno zero-G roll e reindirizza la montagna russa verso la sezione successiva.\n\nGli zero-G winder sono strettamente associati ai design più moderni e tecnicamente ambiziosi di produttori come Intamin e B&M. Kondaa a Walibi Belgium e VelociCoaster agli Universal's Islands of Adventure sono due degli esempi più noti. La combinazione di airtime, inversione e transizione direzionale in un unico elemento conferisce allo zero-G winder una sensazione più complessa rispetto a uno zero-G roll standard.",
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      "Un elemento a doppia inversione allungato e asimmetrico in cui le due inversioni sono collegate da un lungo arco curvo — che dall'alto ricorda la forma di una banana.",
    definition:
      "Il banana roll è una variante allungata del concetto di doppia inversione, in cui le due inversioni sono più distanziate e collegate da una sezione in curva ampia, anziché dalla geometria stretta e simmetrica di un cobra roll classico. Visto dall'alto, il binario segue un arco graduale attraverso entrambe le inversioni che ricorda la curvatura di una banana. La geometria più aperta distribuisce le due inversioni su un tratto di binario più lungo, offrendo al rider un'esperienza più fluida e distesa rispetto all'intensità rapida di un cobra roll convenzionale.\n\nIl banana roll è apparso per la prima volta nel 2011 su Takabisha a Fuji-Q Highland, Giappone, costruito da Gerstlauer. S&S Worldwide ha successivamente sviluppato una propria variante a doppia inversione per Steel Curtain a Kennywood. Poiché l'elemento richiede considerevole spazio laterale, tende a comparire su installazioni più grandi, a raso del terreno, dove il binario può descrivere un'ampia traiettoria tra le due inversioni.",
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Looping Inclinato',
    shortDefinition:
      'Un looping verticale ruotato fuori dal suo asse perpendicolare — il treno lo affronta e lo abbandona di sbieco anziché frontalmente.',
    definition:
      "Un looping inclinato (in inglese inclined loop o tilted loop) è un looping verticale classico ruotato attorno al proprio asse, solitamente tra 45 e 80 gradi rispetto alla direzione di marcia del treno. Invece di entrare e uscire dal looping in linea retta — come in un looping verticale classico — il treno lo affronta e lo abbandona in diagonale, creando un profilo visivo asimmetrico e una sensazione di guida notevolmente diversa.\n\nLa geometria inclinata cambia il modo in cui i rider vivono l'inversione: l'approccio sembra più laterale rispetto a un looping standard, e il punto di uscita nella parte inferiore del cerchio proviene da una direzione inattesa, il che può essere sia disorientante che esaltante. Per gli spettatori, un looping inclinato appare visivamente molto diverso da uno dritto ed è immediatamente riconoscibile come insolito. I looping inclinati compaiono su diverse montagne russe di B&M e Intamin, spesso nella parte centrale o finale del percorso.",
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['tilted loop', 'looping storto', 'looping inclinato', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Elemento Vekoma a doppia inversione in cui il treno esce nella stessa direzione in cui è entrato.',
    definition:
      "Il sea serpent è un elemento a doppia inversione strettamente associato ai design di montagne russe invertite di Vekoma. Come il cobra roll, è composto da due sequenze di inversione unite da una sezione centrale di collegamento, ma la geometria del binario differisce su un punto chiave: mentre il cobra roll fa ruotare il treno di 180 gradi, il sea serpent è progettato affinché il treno entri ed esca nella stessa direzione generale. Le due inversioni si alzano e ridiscendono in una sequenza fluida senza invertire la rotta del treno, conferendo all'elemento, visto di lato, un aspetto lungo a forma di S — come il corpo di un serpente marino che emerge tra due onde.\n\nI sea serpent compaiono nel modello Suspended Looping Coaster (SLC) di Vekoma e in alcune installazioni personalizzate del produttore. Poiché lo SLC è stato prodotto in grande quantità per parchi di tutto il mondo, il sea serpent è uno degli elementi a doppia inversione più diffusi a livello globale, anche se è meno conosciuto per nome rispetto al cobra roll.",
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      "Elemento firma RMC che fonde la prima caduta e un barrel roll completo in un'unica sequenza continua — i rider si trovano capovolti mentre stanno ancora scendendo.",
    definition:
      "Il barrel roll drop è uno degli elementi firma più celebrati di Rocky Mountain Construction e unisce due esperienze normalmente separate — la prima caduta e un'inversione completa — in un'unica sequenza ininterrotta. Dopo aver lasciato il lifthill, il binario fa ruotare il treno attraverso un barrel roll completo mentre scende simultaneamente: i rider si trovano completamente capovolti vicino al punto più ripido della caduta, per poi essere rimessi in posizione verticale man mano che il treno raggiunge il fondo e transita nel resto del percorso.\n\nL'elemento è stato reso possibile dal sistema di binari in acciaio I-Box di RMC, che permette i raggi stretti e la complessa geometria tridimensionale necessari per un roll e una caduta simultanei — una combinazione impossibile sui binari tradizionali di montagne russe in legno. Medusa Steel Coaster al Six Flags Mexico è stata tra le prime attrazioni a presentarlo; Steel Vengeance al Cedar Point e Zadra all'Energylandia sono altri esempi ampiamente apprezzati.",
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      "Mid-Course Brake Run — una zona frenante a metà percorso che può fermare completamente il treno per consentire un'operazione sicura con più treni.",
    definition:
      "Un mid-course brake run (MCBR) è una sezione frenante installata da qualche parte nel mezzo del percorso di una montagna russa — dopo i primi grandi elementi ma prima della sequenza finale. A differenza dei trim brake, che si limitano a ridurre la velocità lasciando proseguire immediatamente il treno, un MCBR è un freno di blocco completo: può fermare il treno del tutto e tenerlo in attesa finché la successiva sezione di blocco non viene confermata libera. Questo consente di far circolare più treni contemporaneamente sullo stesso circuito senza rischio di collisione, aumentando considerevolmente la capacità dell'attrazione.\n\nIn una giornata operativa intensa con treni a pieno carico, un MCBR ben sincronizzato rilascerà il treno fermo quasi immediatamente e i rider noteranno a malapena la breve decelerazione. Nelle giornate più tranquille con meno treni in circolazione, la sosta può durare più a lungo e sembrare più brusca. Gli MCBR sono standard sulla maggior parte delle grandi montagne russe: le B&M inverted e floorless, molte attrazioni Intamin e altre attrazioni ad alta capacità li utilizzano di routine.",
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid-course brake run', 'freno di metà percorso', 'freno intermedio', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Loop Intrecciati',
    shortDefinition:
      'Due looping verticali i cui piani si incrociano — creando una struttura visivamente spettacolare a forma di anello di catena o di otto.',
    definition:
      "I loop intrecciati (in inglese interlocking loops) sono due looping verticali posizionati in modo che i loro piani strutturali si intersechino, tipicamente ad angoli quasi perpendicolari. Il risultato è una configurazione visiva sorprendente in cui un looping sembra attraversare l'altro da certe angolazioni, come un anello di catena o un enorme otto che sorge dal terreno. La complessità strutturale necessaria per far incrociare due looping senza che i binari si tocchino davvero è considerevole, ma l'impatto visivo rende l'elemento un punto focale spettacolare nello skyline del parco.\n\nI loop intrecciati sono più spesso associati alle montagne russe B&M inverted e alle roller coaster con alto numero di inversioni. Dragon Khan a PortAventura, a lungo una delle montagne russe più famose d'Europa, presenta loop intrecciati come parte del suo percorso a otto inversioni, e la sezione dei loop incrociati è una delle più fotografate dell'attrazione.",
    relatedTermIds: ['b-and-m', 'inversion', 'vertical-loop'],
    aliases: ['loop intrecciati', 'interlocking loops', 'loop incrociati'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'Il dispositivo a cricchetto sul lifthill che impedisce al treno di tornare indietro — origine del caratteristico suono clic-clac.',
    definition:
      'Un anti-rollback (detto anche "cane anti-rollback") è un meccanismo di sicurezza meccanico installato lungo la parte inferiore di un lifthill. Mentre il treno sale, dei denti metallici a molla scattano su una serie di tacche integrate nella struttura del lifthill. In caso di guasto alla catena o al motore, i denti si bloccano nelle tacche e immobilizzano il treno, impedendogli di scorrere all\'indietro. Il movimento dei denti sulle tacche produce il ritmico suono clic-clac diventato una delle firme sonore più riconoscibili delle montagne russe tradizionali.\n\nSulle montagne russe moderne con lifthill a cavo silenzioso o a propulsione LSM, gli anti-rollback vengono spesso sostituiti da sistemi frenanti elettromagnetici silenziosi — motivo per cui alcuni nuovi lifthill sono notevolmente più silenziosi. Alcuni appassionati rimpiangono la perdita di questo rituale sonoro classico.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback device', 'cricchetto anti-arretramento', 'clic-clac'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      "Elementi strutturali progettati per passare appena sopra la testa dei rider ad alta velocità — creando un'illusione di quasi impatto.",
    definition:
      'I head choppers sono elementi di design intenzionali in cui la struttura portante, le traverse, i tunnel o altre sezioni di binario passano immediatamente sopra la testa dei rider nel momento in cui il treno viaggia a piena velocità. La vicinanza e il tempismo creano una potente illusione che qualcosa stia per colpire i rider — una scarica di adrenalina senza alcun pericolo reale, poiché lo spazio libero è calcolato con precisione. La sensazione è più intensa quando i rider non se lo aspettano.\n\nI head choppers sono particolarmente associati alle montagne russe in legno molto compatte e alle inverted coaster, dove il profilo appeso dei treni avvicina i rider alle travi di supporto e alle sezioni di binario adiacenti. Per molti appassionati, dei head choppers ben progettati sono segno di creatività nel tracciato.',
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper', 'quasi impatto', 'near miss'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      "Quando un operatore stringe i lap bar o i sistemi di ritenuta troppo contro i rider — eliminando il comfort e l'airtime che l'attrazione era stata progettata per offrire.",
    definition:
      "Lo stapling indica la pratica — intenzionale o per eccessiva prudenza — di un operatore che preme un lap bar o un imbracatura di spalle così fermamente contro un rider da risultare significativamente più stretta del minimo necessario per la sicurezza. Il termine deriva dalla sensazione di essere \"pinzati\" al sedile. Nelle montagne russe orientate all'airtime, i lap bar sono concepiti per stare abbastanza larghi da permettere ai rider di sollevarsi leggermente dal sedile alle creste delle colline — quello è l'airtime. Un rider stapellato rimane piatto sul sedile per tutta la corsa e non può sperimentare la sensazione di galleggiamento prevista, per quanto ben progettate siano le colline.\n\nLo stapling è una fonte frequente di frustrazione nella comunità degli appassionati, in particolare sulle montagne russe in legno e ibride dove l'airtime è l'attrazione principale. Alcuni parchi sono noti per una politica di bardatura sistematicamente stretta; altri sono apprezzati per la libertà del lap bar.",
    relatedTermIds: ['airtime', 'ejector-airtime', 'lap-bar', 'shoulder-harness'],
    aliases: ['stapled', 'ritenuta troppo stretta', 'barra troppo stretta'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Quando un treno di montagna russa perde abbastanza velocità durante la corsa da rimanere bloccato in un punto basso del binario e non riuscire a completare il percorso.',
    definition:
      "Il valleying si verifica quando un treno, avendo perso troppa energia cinetica durante la corsa, non ha più velocità sufficiente per superare il prossimo elemento e si ferma — o rotola indietro — in una valle tra due punti alti del binario. Poiché il treno si trova ora in un punto basso e non su una zona di frenata o in stazione, i sistemi di esercizio normali non riescono a muoverlo. Il recupero richiede solitamente personale di manutenzione che spinge o argana manualmente il treno fino al punto alto successivo e procede all'evacuazione dei rider.\n\nIl valleying è raro in condizioni operative normali, poiché le attrazioni sono progettate con ampi margini di velocità. È più probabile con temperature molto basse (quando i cuscinetti ruota girano a fatica), dopo una frenata eccessiva tramite trim brake, o su montagne russe in legno invecchiate la cui geometria del binario si è modificata nel tempo.",
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'treno bloccato', 'treno incagliato'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Un tipo di montagna russa con piccoli veicoli individuali e un percorso compatto di curve strette e piatte ai bordi di piattaforme sopraelevate.',
    definition:
      "Un wild mouse utilizza piccoli veicoli da due a quattro persone anziché lunghi treni. Il tratto distintivo è una serie di curve a forcina strette, con poco sopraelevamento, eseguite agli estremi bordi del binario. La scarsa inclinazione — al contrario delle curve molto sopraelevate delle altre montagne russe — proietta i rider lateralmente contro la parete del veicolo, e l'inerzia dell'avvicinamento fa sembrare la curva più tarda del previsto, creando la convincente sensazione che il veicolo stia per uscire dai binari.\n\nLe montagne russe wild mouse sono tra le progettazioni più efficienti in termini di spazio, riuscendo a inserire una sorprendente quantità di binario in un'impronta compatta sovrapponendo i livelli delle curve a forcina. Sono diffuse in parchi di tutto il mondo. Produttori di spicco: Mack Rides, Maurer e Gerstlauer.",
    relatedTermIds: ['gerstlauer', 'mack-rides', 'spinning-coaster', 'steel-coaster'],
    aliases: ['wild mouse coaster', 'topolino impazzito', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: '4D Coaster',
    shortDefinition:
      'Un tipo di montagna russa i cui sedili sono montati su braccia rotanti che si estendono ai lati del treno — e possono ruotare indipendentemente dalla direzione di marcia.',
    definition:
      "Una montagna russa 4D (quarta dimensione) è un progetto in cui i sedili dei passeggeri non sono fissati rigidamente al treno, bensì montati su braccia girevoli che si estendono a sinistra e a destra di ogni carro. I sedili possono ruotare in avanti o all'indietro indipendentemente dalla direzione del treno — controllati da un binario guida fisso a lato del binario principale (che impone la posizione del sedile in ogni momento del percorso) oppure tramite rotazione libera per gravità e distribuzione del peso dei rider. Il risultato: i passeggeri possono essere orientati verso il basso durante una discesa, capovolti in una curva, o ruotare su più assi contemporaneamente durante le inversioni.\n\nIl concetto fu sviluppato da Arrow Dynamics e perfezionato in seguito da S&S Worldwide. X2 al Six Flags Magic Mountain in California è l'esempio più famoso, inaugurato nel 2002 come prima montagna russa 4D al mondo. Eejanaika a Fuji-Q Highland in Giappone detiene il record mondiale di inversioni di qualsiasi montagna russa, in parte grazie alla rotazione dei sedili che moltiplica il conteggio delle inversioni.",
    relatedTermIds: [
      'arrow-dynamics',
      'inversion',
      'inverted-coaster',
      's-and-s-worldwide',
      'spinning-coaster',
    ],
    aliases: ['4D coaster', 'quarta dimensione', 'montagna russa 4D', 'free spin coaster'],
  },
  {
    id: 'out-and-back',
    name: 'Out-and-Back',
    shortDefinition:
      'Un tracciato di montagna russa che si allontana dalla stazione in linea relativamente retta, inverte la rotta alla fine del terreno e ritorna in parallelo.',
    definition:
      "Un out-and-back è uno dei due tipi di tracciato fondamentali di montagna russa. Il treno lascia la stazione, procede in una direzione globalmente lineare — tipicamente con una serie di colline ottimizzate per l'airtime — esegue un'inversione di marcia all'estremità del terreno e torna su un percorso parallelo al tratto di andata. I due tratti si incrociano raramente, dando luogo a una pianta lunga e stretta.\n\nI design out-and-back sono fortemente associati alle montagne russe in legno tradizionali, dove la velocità accumulata sulle lunghe colline dell'andata viene sfruttata al ritorno da una successione di colline progressivamente più basse e ravvicinate che massimizzano il floater airtime. Esempi famosi includono The Voyage al Holiday World e i vari modelli del tipo Racer.",
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'tracciato out-and-back', 'andata e ritorno'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      "Un tracciato di montagna russa che ruota, si avvolge e si incrocia su se stesso — concentrando il massimo degli elementi in un'impronta compatta.",
    definition:
      "Un twister (detto anche layout a ciclone) è un progetto di montagna russa in cui il binario spirale, si ripiega su se stesso e si incrocia ripetutamente, intrecciando una struttura complessa piuttosto che seguire il semplice percorso a due tratti di un out-and-back. La caratteristica distintiva è che il treno passa frequentemente molto vicino ad altre sezioni dello stesso percorso — spesso in direzioni e altezze diverse — creando effetti head-chopper e complessità visiva tipici del genere.\n\nI layout twister sono efficienti nello sfruttamento dello spazio: molta lunghezza di binario e dislivello possono essere contenuti in un'impronta compatta, il che li rende una scelta popolare nei parchi con spazio limitato. Tra i twister in legno classici figura il Twister del Gröna Lund a Stoccolma; i twister in acciaio includono numerosi design di B&M e Intamin.",
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'ciclone', 'montagna russa twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error — lo scarto medio in minuti tra il tempo di attesa previsto e quello reale.',
    definition:
      'Il MAE (Mean Absolute Error, errore assoluto medio) è la misura di precisione standard di park.fan. Calcola la differenza media — in minuti — tra ogni tempo di attesa previsto e quello realmente registrato all\'attrazione. Un MAE di 8 minuti significa che le previsioni si discostano mediamente di 8 minuti dalla realtà.\n\nIl MAE tratta ogni errore allo stesso modo: un errore di 5 minuti e uno di 15 vengono mediati linearmente. Questo lo rende intuitivo — MAE = 10 significa "le previsioni sono tipicamente entro 10 minuti dalla realtà." Un MAE più basso indica sempre previsioni più accurate.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error — simile al MAE ma penalizza maggiormente i grandi errori di previsione.',
    definition:
      "Il RMSE (Root Mean Square Error, radice dell'errore quadratico medio) misura la precisione elevando al quadrato ogni errore prima di calcolare la media. Gli errori grandi — una coda prevista con 40 minuti di scarto — contribuiscono molto di più al RMSE rispetto a un errore di 5 minuti. Il RMSE è sempre uguale o maggiore del MAE.\n\nUna grande differenza tra RMSE e MAE indica che il modello produce occasionalmente errori estremi, anche se la maggior parte delle previsioni è vicina alla realtà. Entrambe le metriche sono visibili in tempo reale sulla homepage di park.fan.",
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      "Mean Absolute Percentage Error — l'errore di previsione espresso come percentuale del tempo di attesa reale.",
    definition:
      'Il MAPE (Mean Absolute Percentage Error, errore percentuale assoluto medio) esprime la precisione come percentuale invece che in minuti. Invece di "8 minuti di scarto", indica "15% del tempo di attesa reale di scarto". Questo facilita il confronto tra attrazioni con tempi di attesa molto diversi — un errore di 10 minuti è molto più grave su un\'attrazione con 15 minuti abituali che su una con 90.\n\nIl MAPE può essere ingannevolmente alto quando i tempi di attesa reali sono molto brevi. Per questo park.fan lo mostra sempre insieme a MAE e RMSE.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R al quadrato — misura quanto bene il modello IA spiega i pattern nei tempi di attesa reali (0–1, più alto è meglio).',
    definition:
      "L'R² (R al quadrato, o coefficiente di determinazione) misura quanta parte della variazione nei tempi di attesa reali il modello riesce a spiegare. Un valore di 1,0 significherebbe previsioni perfette; 0,0 significa che il modello non spiega nulla oltre una semplice media. In pratica, valori superiori a 0,7 indicano un buon modello; superiori a 0,9, eccellente.\n\nPer le previsioni dei tempi di attesa, raggiungere un R² elevato è difficile perché le code sono influenzate da fattori imprevedibili. Il punteggio R² di park.fan riflette le prestazioni reali su tutte le previsioni tracciate e viene aggiornato quotidianamente.",
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    aliases: ['R-squared', 'coefficiente di determinazione'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Attrazione stagionale',
    shortDefinition:
      "Un'attrazione, uno show o un'esperienza che funziona solo in determinati mesi dell'anno — come una pista di pattinaggio in inverno o uno scivolo d'acqua in estate.",
    definition:
      "Un'attrazione stagionale è un'attrazione, uno show o un'esperienza che il parco propone solo in un periodo definito dell'anno. Le piste di pattinaggio, le piste di slittamento e gli show invernali funzionano tipicamente da novembre a febbraio; i rapid river, le zone giochi d'acqua e gli spettacoli all'aperto da maggio a settembre. Alcune attrazioni stagionali sono legate a eventi specifici come Halloween o il Natale.\n\nSu park.fan, le attrazioni e gli show stagionali vengono identificati automaticamente in base ai dati storici e nascosti nelle schede del parco e sulla mappa quando si trovano al di fuori dei loro mesi attivi — per ridurre il disordine visivo e aiutarti a concentrarti su ciò che è effettivamente aperto oggi. Un badge stagionale (❄️ Inverno, ☀️ Estate o 🍃 generico) appare su ogni scheda interessata. Quando l'attrazione è fuori stagione, il badge è attenuato. Un pulsante di filtro nelle schede consente di mostrare le voci nascoste quando necessario.",
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    aliases: ['giostra stagionale', 'show stagionale', 'esperienza stagionale'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Azienda statunitense specializzata nella progettazione di moderni roller coaster in legno.',
    definition:
      "The Gravity Group è uno studio di ingegneria statunitense fondato nel 2002 da ex ingegneri della Custom Coasters International. L'azienda è famosa per aver introdotto innovazioni nel settore dei wooden coaster, come i treni Timberliner, che permettono ai vagoni di affrontare curve più strette e manovre più complesse rispetto ai treni tradizionali. Tra le loro creazioni più celebri figurano The Voyage (Holiday World) e Hades 360 (Mt. Olympus), noti per la loro intensità estrema e l'uso di elementi moderni su strutture in legno.",
    relatedTermIds: ['hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'Produttore leader di dark ride interattive e animatronici.',
    definition:
      "Sally Dark Rides (precedentemente Sally Corporation) è un'azienda con sede in Florida specializzata nella creazione di dark ride interattive, animatronici e attrazioni a tema per parchi di divertimento in tutto il mondo. Sono celebri per aver sviluppato la serie 'Justice League: Battle for Metropolis' nei parchi Six Flags e numerose attrazioni basate su Scooby-Doo. Le loro attrazioni combinano spesso scenografie fisiche, animatronici avanzati e sistemi di puntamento laser per un'esperienza di gioco competitiva.",
    relatedTermIds: ['animatronics', 'dark-ride', 'interactivity'],
    aliases: ['Sally Corporation', 'Sally Corp'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition:
      'Produttore olandese noto per flat ride ad alta intensità e ruote panoramiche giganti.',
    definition:
      'Mondial Rides è un produttore olandese specializzato in attrazioni meccaniche spettacolari (flat ride) per parchi fissi e fiere itineranti. Tra i loro modelli più iconici ci sono il Top Scan, il Shake e il Capriolo. Mondial è rinomata per la complessità ingegneristica dei suoi movimenti multi-assiali, che offrono esperienze molto intense, e per la produzione di alcune delle ruote panoramiche più grandi e trasportabili al mondo.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
    aliases: ['Mondial Rides'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition:
      'Produttore olandese leader mondiale nelle attrazioni trasportabili per luna park.',
    definition:
      "KMG (Kermis Machinebouw Gaashte) è un'azienda olandese specializzata nella progettazione e costruzione di attrazioni per fiere itineranti. Sono noti per l'ingegneria che permette un montaggio rapido senza l'uso di gru pesanti. Il loro prodotto più famoso è l'Afterburner (spesso chiamato Fireball), un'attrazione a pendolo con sedili rivolti verso l'interno che oscillano e ruotano. Altri modelli di successo includono il Freak Out e il Speed.",
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
    aliases: ['KMG Rides'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition: 'Azienda tecnologica che produce sistemi di trasporto avanzati per dark ride.',
    definition:
      "Oceaneering Entertainment Systems (OES) è una divisione di Oceaneering International che applica tecnologie subacquee e robotiche al settore dei parchi a tema. Sono i creatori dei rivoluzionari veicoli a movimento base utilizzati in attrazioni come 'The Amazing Adventures of Spider-Man' e 'Transformers: The Ride' (Universal Studios). I loro sistemi permettono movimenti sincronizzati con proiezioni 3D, creando un'immersione totale senza precedenti nelle dark ride moderne.",
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
    aliases: ['Oceaneering Entertainment Systems', 'OES'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Produttore olandese di sistemi di trasporto per dark ride, pioniere della tecnologia trackless.',
    definition:
      "ETF Ride Systems è un'azienda olandese specializzata in sistemi di trasporto per attrazioni a tema e musei. Sono stati tra i primi a sviluppare veicoli 'trackless' (senza binari), che utilizzano guide magnetiche o filoguidate nel pavimento per muoversi in modo autonomo. Questa tecnologia permette percorsi variabili e movimenti fluidi, come si vede in attrazioni come Symbolica (Efteling) o Ratatouille: The Adventure (Disneyland Paris).",
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
    aliases: ['ETF'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition:
      'Produttore statunitense di roller coaster, ruote panoramiche e trenini per parchi.',
    definition:
      "Chance Rides è uno storico produttore americano con sede in Kansas. L'azienda produce una vasta gamma di attrazioni, dalle classiche ruote panoramiche e caroselli ai moderni roller coaster. Hanno collaborato con D.H. Morgan per la creazione di hypercoaster e sono famosi per i loro trenini in miniatura che trasportano i visitatori all'interno di zoo e parchi a tema. Un esempio moderno di coaster prodotto da loro è Lightning Run (Kentucky Kingdom).",
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'steel-coaster'],
    aliases: ['Chance Morgan', 'Chance Manufacturing'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'Una figura di roller coaster che imita la forma di un loop senza capovolgere i passeggeri.',
    definition:
      "Il Non-Inverting Loop è un elemento introdotto da Maurer Rides (ad esempio su Hollywood Rip Ride Rockit). A differenza di un loop verticale classico, il binario ruota mentre sale, in modo che nel punto più alto i passeggeri rimangano dritti invece di trovarsi a testa in giù. Questo crea una sensazione di airtime laterale e verticale unica, mantenendo l'aspetto visivo imponente di un grande cerchio.",
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['loop non invertito', 'giro della morte non invertito'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition:
      'Una doppia inversione che ricorda la forma di un pretzel, tipica dei coaster con tracciato complesso.',
    definition:
      "Il Pretzel Knot è una combinazione di due inversioni che formano una figura a 'X' o a forma di pretzel. Viene spesso utilizzato per far cambiare direzione al treno mentre lo capovolge due volte in rapida successione. Non va confuso con il Pretzel Loop (tipico dei flying coaster), poiché il Knot è solitamente presente su coaster seduti o invertiti. Un esempio celebre si trova su Moonsault Scramble (Fuji-Q Highland).",
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['nodo a pretzel'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'Una mezza inversione che termina con il treno che viaggia nella direzione opposta, tipica dei coaster 4D.',
    definition:
      "Il Raven Turn è un elemento esclusivo dei roller coaster quadridimensionali (4D) e dei coaster ala (Wing). Consiste in un mezzo loop che non viene completato, portando il treno a cambiare direzione di 180 gradi. A seconda della rotazione dei sedili, può essere vissuto come un'uscita 'all'esterno' o 'all'interno'. Si trova in attrazioni come X2 (Six Flags Magic Mountain) o Eejanaika (Fuji-Q Highland).",
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['curva raven'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition: "Un'inversione lenta subito dopo la cima del lift, comune sui Wing Coaster.",
    definition:
      'Il Dive Drop è un elemento distintivo dei Wing Coaster della B&M (come Raptor a Gardaland). Appena uscito dalla catena di risalita (lift hill), il treno ruota lentamente di 180 gradi su se stesso prima di tuffarsi in picchiata nella prima discesa. Questo crea una sensazione prolungata di hangtime mentre i passeggeri pendono lateralmente fuori dal binario prima della caduta.',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['caduta in tuffo'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition:
      "Una curva inclinata verso l'esterno invece che verso l'interno, che genera forze laterali intense.",
    definition:
      "L'Outerbanked Turn è un elemento moderno (reso popolare da RMC) in cui il binario è inclinato nella direzione opposta a quella della curva. Invece di spingere i passeggeri nel sedile (forze positive), questa inclinazione li spinge verso l'esterno, creando un mix unico di airtime ed espulsione laterale. È uno degli elementi più apprezzati dagli appassionati per la sua natura imprevedibile.",
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['curva contro-inclinata'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition:
      'Una grande collina a forma di gobba di cammello progettata per generare airtime prolungato.',
    definition:
      "Il Camelback è l'elemento fondamentale di ogni hypercoaster. È una collina parabolica che il treno percorre ad alta velocità: nel punto più alto (apex), i passeggeri vivono una sensazione di assenza di peso o di galleggiamento (airtime). Il termine deriva dalla somiglianza con la gobba di un cammello. Più la curva è stretta in cima, più l'effetto è intenso (passando da floater a ejector airtime).",
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster'],
    aliases: ['gobba di cammello', 'camelbacks'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      "Un'inversione allungata in cui il treno rimane a testa in giù per diversi metri, simulando la gravità zero.",
    definition:
      "Lo Zero-G Stall è un'evoluzione dello Zero-G Roll. Invece di completare rapidamente la rotazione, il binario rimane dritto mentre è capovolto di 180 gradi per una sezione orizzontale. Durante questo tratto, i passeggeri sperimentano una sensazione di galleggiamento totale (0-G) mentre pendono dai loro sedili a testa in giù. È un elemento iconico degli RMC come Wildfire o Goliath.",
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['stall a zero-g'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition:
      'Termine gergale usato dagli appassionati per indicare i visitatori comuni dei parchi.',
    definition:
      "GP è l'acronimo di 'General Public' (Pubblico Generale). Viene usato dalla comunità degli appassionati (enthusiasts) per descrivere i visitatori non esperti che non conoscono i dettagli tecnici o la terminologia delle attrazioni. Spesso il termine è usato in modo scherzoso o leggermente dispregiativo quando i visitatori comuni fanno affermazioni errate, come chiamare ogni giostra 'roller coaster' o credere che un giro della morte sia pericoloso se il treno si ferma.",
    relatedTermIds: ['credit', 'ert', 'touring-plan'],
    aliases: ['pubblico generale', 'visitatori comuni'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition:
      "Qualsiasi roller coaster a circuito completo con un'altezza superiore ai 400 piedi (122 metri).",
    definition:
      "Lo Strata Coaster è una categoria di roller coaster definita esclusivamente dall'altezza. Il termine è stato coniato da Cedar Point per il lancio di Top Thrill Dragster nel 2003. Al momento esistono solo due Strata Coaster completati al mondo: Kingda Ka (Six Flags Great Adventure) e Top Thrill 2 (Cedar Point). Sono caratterizzati da velocità estreme e discese verticali da altezze record.",
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition:
      "L'atto di inviare un treno fuori dalla stazione per iniziare il suo percorso.",
    definition:
      "Il Dispatch è il momento in cui gli operatori della stazione danno l'ordine di partenza al treno dopo aver verificato le sicurezze e i bügel. Nella comunità degli appassionati, il 'dispatch time' (tempo tra due partenze) è un indicatore cruciale dell'efficienza del parco. Dispatche lenti portano a code più lunghe e a fenomeni come lo 'stacking' (treni fermi sui freni finali in attesa che la stazione si liberi).",
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['partenza', 'invio del treno'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'Effetto scenografico in cui il binario passa molto vicino a una struttura, simulando una collisione imminente.',
    definition:
      "Un Near-Miss (mancata collisione) è un elemento di design volto ad aumentare il brivido psicologico. Il binario è progettato per passare a pochi centimetri da supporti, tunnel, rocce o scenografie. Anche se i passeggeri sono sempre all'interno del 'clearance envelope' (spazio di sicurezza), la velocità elevata e la prospettiva fanno sembrare che si stia per colpire l'ostacolo. È un trucco visivo fondamentale nelle dark ride e nei coaster moderni.",
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['effetto sfioramento', 'collisione sfiorata'],
  },
  {
    id: 'clearance-envelope',
    name: 'Lichtraumprofil',
    shortDefinition:
      'Lo spazio di sicurezza invisibile attorno al binario che deve rimanere libero da ostacoli.',
    definition:
      "Il Clearance Envelope (o busta di spazio libero) è l'area calcolata dagli ingegneri che circonda il treno e i passeggeri durante tutto il percorso. Considera l'estensione massima delle braccia e delle gambe dei visitatori più alti. Nessun oggetto fisso (supporti, rocce, rami) può trovarsi all'interno di questo spazio. Durante i test, viene spesso usato un prototipo di legno con la sagoma della busta per assicurarsi che nulla venga colpito.",
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['clearance envelope', 'spazio di sicurezza', 'sagoma limite'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Un effetto near-miss focalizzato sui piedi dei passeggeri, comune sui coaster invertiti o ala.',
    definition:
      "Simile all'head-chopper, il foot-chopper è un effetto visivo in cui sembra che i piedi dei passeggeri stiano per colpire una struttura o il terreno. È particolarmente efficace sui roller coaster invertiti (seduti sotto il binario) o sui Wing Coaster (seduti ai lati), dove le gambe sono libere e sospese nel vuoto. Il design sfrutta la velocità per creare un senso di pericolo imminente ma controllato.",
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
      'Tecnologia che proietta immagini video su superfici irregolari o scenografie 3D.',
    definition:
      "Il Projection Mapping (o video mapping) è una tecnica utilizzata nelle dark ride moderne per trasformare superfici fisiche in schermi dinamici. A differenza della proiezione standard, il software adatta l'immagine alla forma dell'oggetto (rocce, edifici, animatronici), permettendo di simulare trasformazioni, movimenti o effetti magici che sembrano far parte della realtà fisica. Esempi famosi si trovano negli show serali e in attrazioni come 'Harry Potter and the Forbidden Journey'.",
    relatedTermIds: ['animatronics', 'dark-ride', 'interactivity', 'pre-show'],
    aliases: ['video mapping', 'mappatura video'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Sistema di trasporto continuo in cui i veicoli sono collegati tra loro in una catena ininterrotta.',
    definition:
      "L'Omnimover è un sistema di trasporto sviluppato da Disney (utilizzato in attrazioni come 'The Haunted Mansion'). I veicoli si muovono costantemente lungo un percorso e possono ruotare su se stessi per dirigere lo sguardo dei passeggeri verso scene specifiche. Poiché il movimento non si ferma mai (tranne che per emergenze), la capacità oraria è estremamente elevata. Altri esempi sono 'Phantom Manor' o 'Peter Pan's Flight' (sebbene quest'ultimo sia sospeso).",
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['sistema omnimover'],
  },
  {
    id: 'pepper-ghost',
    name: "Pepper's Ghost",
    shortDefinition:
      'Una tecnica di illusione ottica classica usata per creare apparizioni trasparenti o fantasmi.',
    definition:
      "L'effetto Pepper's Ghost è un trucco teatrale del XIX secolo ancora oggi pilastro di molte dark ride (famosissimo nella scena del ballo di 'The Haunted Mansion'). Utilizza una lastra di vetro invisibile posta a 45 gradi e una stanza nascosta illuminata in modo specifico. L'immagine della stanza nascosta si riflette sul vetro, apparendo traslucida e sospesa nel vuoto, dando l'illusione di un fantasma che attraversa oggetti solidi.",
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ["Pepper's Ghost", 'illusione del fantasma'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Produttore canadese noto per sistemi di trasporto complessi, tra cui il Robocoaster.',
    definition:
      'Dynamic Attractions è un importante produttore di attrazioni famoso per i suoi sistemi di trasporto innovativi e tecnicamente complessi. La loro tecnologia più iconica è il sistema a braccio robotico "Robocoaster" utilizzato in attrazioni come Harry Potter and the Forbidden Journey. Sviluppano anche sistemi di binari ad alta tecnologia, cinema dinamici e componenti strutturali per i principali parchi a tema di tutto il mondo.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
  },
  {
    id: 'flying-theater',
    name: 'Teatro volante',
    shortDefinition:
      'Un simulatore in cui i sedili sono orientati davanti a un enorme schermo curvo per creare una sensazione di volo.',
    definition:
      "Un teatro volante è un tipo di attrazione di simulazione in cui gli ospiti siedono su sedili sospesi che si muovono in sincronizzazione con un film proiettato su un enorme schermo sferico. I sedili spesso \"volano\" in avanti verso l'area dello schermo, offrendo un'esperienza di volo immersiva. Esempi notevoli includono Soarin' di Disney e Voletarium di Europa-Park.",
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle coaster',
    shortDefinition:
      "Una montagna russa che non forma un circuito completo e viaggia sia in avanti che all'indietro.",
    definition:
      "Uno shuttle coaster è un tipo di montagna russa che viaggia da una stazione a un punto finale (spesso una guglia verticale), quindi inverte la direzione e torna alla stazione. Poiché il binario non forma un anello chiuso, gli ospiti sperimentano l'intero percorso sia in avanti che all'indietro.",
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
  },
  {
    id: 'carousel',
    name: 'Carosello',
    shortDefinition: "Un'attrazione rotante classica con sedili, spesso a forma di cavalli.",
    definition:
      'Un carosello (o giostra) è una tradizionale attrazione rotante caratterizzata da una piattaforma circolare con sedili decorati. Questi sedili hanno tipicamente la forma di cavalli o altri animali e spesso si muovono su e giù per simulare il galoppo. I caroselli sono elementi iconici e adatti alle famiglie presenti in quasi tutti i parchi di divertimento.',
    relatedTermIds: ['flat-ride', 'themed-land'],
  },
  {
    id: 'walkthrough',
    name: 'Percorso a piedi',
    shortDefinition: "Un'attrazione da vivere a piedi attraverso ambienti a tema.",
    definition:
      "Un walkthrough (percorso a piedi) è un'attrazione progettata per essere vissuta a piedi anziché in un veicolo. Gli ospiti si muovono attraverso ambienti a tema che possono includere elementi interattivi, attori dal vivo o effetti speciali. Spaziano da semplici percorsi tematici a elaborate case infestate o funhouse.",
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
  },
  {
    id: 'funhouse',
    name: 'Casa della risa',
    shortDefinition:
      'Una classica attrazione a piedi piena di ostacoli fisici e illusioni ottiche.',
    definition:
      'Una casa della risa (funhouse) è una tradizionale attrazione da percorrere a piedi che sfida gli ospiti con ostacoli fisici come pavimenti mobili, barili rotanti, specchi deformanti e scivoli. Sebbene comuni nelle fiere, molti parchi permanenti presentano case della risa sofisticate come esperienze interattive.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Ruota panoramica',
    shortDefinition:
      'Una grande ruota a rotazione verticale con gondole per i passeggeri che offrono viste panoramiche.',
    definition:
      'Una ruota panoramica è una massiccia struttura a rotazione verticale con gondole o cabine per i passeggeri attaccate al cerchio. È progettata per offrire agli ospiti una vista panoramica del parco e del paesaggio circostante, rendendola una delle icone più riconoscibili del settore.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Guglia',
    shortDefinition:
      'Una sezione di binario a fondo cieco verticale o fortemente inclinata su uno shuttle coaster.',
    definition:
      'Una guglia (spike) è un termine che indica una sezione di binario verticale o fortemente inclinata su uno shuttle coaster che termina bruscamente. Il treno sale sulla guglia finché non perde slancio, quindi ricade nella direzione opposta. Le guglie sono caratteristiche comuni negli shuttle coaster lanciati.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
  },
  {
    id: 'forced-perspective',
    name: 'Prospettiva forzata',
    shortDefinition:
      'Una tecnica di progettazione utilizzata per far apparire le strutture più grandi o più piccole di quanto non siano in realtà.',
    definition:
      "La prospettiva forzata è un'illusione ottica utilizzata dai progettisti per manipolare la scala e la distanza percepite degli oggetti. Riducendo la scala degli edifici man mano che si elevano, i progettisti possono farli sembrare molto più alti. Questa tecnica è utilizzata nel Castello della Bella Addormentata a Disneyland per esaltarne l'aspetto grandioso.",
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'show-building',
    name: 'Edificio dello show',
    shortDefinition:
      "La grande struttura utilitaristica che ospita il binario e le scenografie di un'attrazione al coperto.",
    definition:
      "Un edificio dello show (show building) è il capannone strutturale che contiene il binario, le scenografie e gli effetti speciali di una giostra al coperto o di un dark ride. Mentre l'interno è altamente immersivo, l'esterno è spesso una scatola anonima nascosta alla vista degli ospiti da paesaggi o facciate a tema.",
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
  },
  {
    id: 'practical-effects',
    name: 'Effetti pratici',
    shortDefinition:
      "Effetti speciali fisici prodotti dal vivo all'interno di un'attrazione anziché digitalmente.",
    definition:
      "Gli effetti pratici sono effetti speciali fisici creati dal vivo, come animatronici, acqua, fuoco reale, nebbia e oggetti di scena fisici. Si differenziano dagli effetti digitali o basati su schermo e sono spesso elogiati per il loro impatto tangibile e realistico sull'esperienza dell'ospite.",
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken exit',
    shortDefinition:
      "Un percorso di uscita dedicato per gli ospiti che decidono di non salire proprio prima dell'imbarco.",
    definition:
      "Una chicken exit è un percorso designato che consente agli ospiti di lasciare la coda e uscire dall'attrazione proprio prima di salire sul veicolo. Viene utilizzato dagli ospiti che cambiano idea su un'attrazione da brivido o da coloro che stavano solo accompagnando altri nella coda.",
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
  },
  {
    id: 'in-show-exit',
    name: 'Uscita in scena',
    shortDefinition:
      "Un'uscita o un'evacuazione da un veicolo all'interno dell'area a tema di un'attrazione.",
    definition:
      "Un'uscita in scena (in-show exit) si verifica quando gli ospiti lasciano un veicolo mentre si trova ancora all'interno dell'ambiente a tema dell'attrazione, solitamente durante un guasto tecnico o un'evacuazione. Questo processo prevede che il personale guidi in sicurezza gli ospiti lungo i camminamenti attraverso le aree \"backstage\" della giostra.",
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
  },
  {
    id: 'e-stop',
    name: 'Fermo di emergenza',
    shortDefinition:
      'Un arresto di emergenza che interrompe immediatamente ogni movimento della giostra per motivi di sicurezza.',
    definition:
      "Un E-Stop (fermo di emergenza) è un meccanismo o una procedura di sicurezza che interrompe immediatamente l'alimentazione o applica i freni per arrestare ogni movimento dell'attrazione. Può essere attivato automaticamente dai sensori o manualmente dagli operatori. Dopo un E-Stop, l'attraction deve solitamente essere ispezionata e resettata prima di riprendere il servizio.",
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
  },
];

export default translations;
