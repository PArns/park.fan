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
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Una corsia separata per gli ospiti disposti a viaggiare da soli per riempire i posti vuoti.',
    definition:
      'La corsia Single Rider permette agli ospiti disposti a viaggiare da soli di occupare i posti vuoti nei veicoli delle attrazioni. Poiché i Single Rider si inseriscono negli spazi liberi, la coda avanza molto più velocemente della fila standard — spesso con tempi di attesa del 50–70% inferiori. Non tutte le attrazioni offrono questa opzione; verificate prima di mettervi in fila.',
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
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Un upgrade del biglietto a pagamento o incluso che dà accesso a una corsia prioritaria più breve.',
    definition:
      "Un Pass Express (il nome varia per parco — Universal Express, Disney Lightning Lane, ecc.) è un upgrade che consente ai titolari di utilizzare un ingresso prioritario dedicato con attese significativamente più brevi. Usa il calendario dell'affluenza di park.fan per decidere se un Pass Express vale il costo.",
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
    relatedTermIds: ['crowd-level', 'crowd-calendar', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Ristrutturazione',
    shortDefinition:
      "Un periodo di chiusura pianificata durante il quale un'attrazione viene sottoposta a manutenzione o miglioramenti.",
    definition:
      "Una ristrutturazione è un periodo di manutenzione o rinnovo programmato durante il quale un'attrazione, uno spettacolo o un'area del parco è temporaneamente chiusa. Le ristrutturazioni possono durare da pochi giorni a diversi mesi. park.fan indica le attrazioni in ristrutturazione per includerle nella pianificazione.",
    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Tempo fermo',
    shortDefinition:
      "Una chiusura temporanea non pianificata di un'attrazione, spesso dovuta a un guasto tecnico.",
    definition:
      "Il tempo fermo si riferisce a una chiusura temporanea non programmata di un'attrazione — distinta da una ristrutturazione pianificata. I tempi fermi sono causati da malfunzionamenti tecnici, controlli di sicurezza, incidenti o condizioni meteorologiche avverse. park.fan mostra lo stato operativo attuale di ogni attrazione tracciata in tempo reale.",
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
    relatedTermIds: ['crowd-calendar', 'wait-time', 'crowd-level'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      "Un vantaggio esclusivo che consente agli ospiti degli hotel del resort di entrare nel parco prima dell'apertura generale.",
    definition:
      "L'Early Entry (chiamato anche Extra Magic Hours o Early Park Entry) permette agli ospiti degli hotel partner di accedere al parco 30–60 minuti prima del pubblico generale. Durante questa finestra, le code alle attrazioni più popolari sono notevolmente più brevi. Nei giorni di punta, combinare l'Early Entry con un piano di visita strategico consente di vivere più attrazioni principali con attese minime.",
    relatedTermIds: ['rope-drop', 'express-pass', 'peak-day'],
  },
  {
    id: 'park-hopper',
    name: 'Park Hopper',
    shortDefinition:
      'Un supplemento al biglietto che consente di visitare più parchi dello stesso resort nello stesso giorno.',
    definition:
      "Un biglietto Park Hopper permette di accedere a due o più parchi gestiti dallo stesso resort in una singola giornata. L'opzione Park Hopper di Disney, ad esempio, consente di spostarsi tra Magic Kingdom, EPCOT, Hollywood Studios e Animal Kingdom dopo le 14:00. È particolarmente utile quando attrazioni o esperienze specifiche sono distribuite su più parchi.",
    relatedTermIds: ['season-pass', 'rope-drop', 'crowd-calendar'],
  },
  {
    id: 'season-pass',
    name: 'Abbonamento annuale',
    shortDefinition: 'Un biglietto annuale che consente visite illimitate al parco per 12 mesi.',
    definition:
      "Un abbonamento annuale (Annual Pass) garantisce ingressi illimitati a uno o più parchi per un periodo di 12 mesi. I livelli superiori spesso includono vantaggi come sconti sulla ristorazione, parcheggio gratuito e sconti sul merchandising. Alcuni abbonamenti prevedono date di esclusione (blockout dates) nei giorni di punta. Per i visitatori abituali — generalmente tre o più visite all'anno — l'abbonamento è quasi sempre più conveniente dei biglietti singoli.",
    relatedTermIds: ['park-hopper', 'peak-day', 'express-pass'],
  },
  {
    id: 'height-requirement',
    name: 'Altezza minima',
    shortDefinition:
      "Un'altezza minima che gli ospiti devono raggiungere per accedere a un'attrazione specifica.",
    definition:
      "L'altezza minima è una regola di sicurezza stabilita dai parchi per garantire che i sistemi di ritenuta — barre di sicurezza, spallacci, cinture — funzionino correttamente per ogni passeggero. Varia generalmente tra 90 e 140 cm a seconda dell'intensità dell'attrazione. Alcune attrazioni hanno anche un'altezza o un peso massimo. Verificate sempre i requisiti di altezza prima di visitare con bambini piccoli.",
    relatedTermIds: ['ride-capacity', 'refurbishment'],
  },
  {
    id: 'themed-land',
    name: 'Area tematica',
    shortDefinition:
      "Una zona autonoma all'interno di un parco a tema costruita attorno a un tema coerente.",
    definition:
      "Un'area tematica è una zona distinta di un parco a tema che combina un design visivo unificato, una storia di sfondo e attrazioni, ristoranti e negozi a tema. Esempi celebri includono Il Mondo Magico di Harry Potter agli Universal Studios, Star Wars: Galaxy's Edge nei parchi Disney e Skandinavien a Europa-Park. Le aree tematiche creano un'esperienza immersiva e sono spesso le zone più fotografate del parco.",
    relatedTermIds: ['ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      "L'apertura non ufficiale di un'attrazione prima della data di lancio annunciata.",
    definition:
      'Un Soft Opening avviene quando un parco apre silenziosamente una nuova attrazione o area prima della data ufficiale — spesso senza alcun annuncio. I parchi utilizzano i Soft Opening per testare i sistemi in condizioni reali, individuare problemi operativi e ottimizzare le procedure di imbarco. Poiché possono iniziare e interrompersi senza preavviso, rappresentano un bonus per i visitatori fortunati che si trovano nel parco, ma non una base affidabile per la pianificazione. Forum e social media di solito sono i primi a segnalarli.',
    relatedTermIds: ['refurbishment', 'downtime', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      "La fila d'attesa classica di un'attrazione, senza prenotazione né pass speciale.",
    definition:
      "La coda Standby è la normale fila d'attesa fisica accessibile a tutti gli ospiti senza biglietto aggiuntivo o upgrade. Chi si mette in Standby aspetta in ordine di arrivo — il tempo indicato riflette direttamente l'affluenza attuale all'attrazione. Nei giorni più affollati, i tempi di Standby per le attrazioni principali possono superare i 90 minuti. park.fan traccia i tempi Standby in tempo reale per aiutarvi a trovare sempre la fila più breve.",
    relatedTermIds: ['wait-time', 'single-rider', 'virtual-queue', 'express-pass'],
  },
  {
    id: 'lightning-lane',
    name: 'Lightning Lane',
    shortDefinition:
      'Il sistema di accesso prioritario a pagamento di Disney, successore del programma FastPass+.',
    definition:
      "Lightning Lane è il nome dato da Disney al suo sistema di coda prioritaria, introdotto nel 2021 come successore del gratuito FastPass+. Esiste in due formule: Individual Lightning Lane (ILL), venduta separatamente per le attrazioni più richieste, e Lightning Lane Multi Pass (LLMP), un abbonamento giornaliero che consente di prenotare fasce orarie di ritorno su una selezione di attrazioni. La Lightning Lane ha generato ampio dibattito nella comunità perché ha trasformato un vantaggio prima gratuito in un servizio a pagamento. Il calendario dell'affluenza di park.fan vi aiuta a valutare in quali giorni la Lightning Lane vale il costo.",
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'genie-plus',
    name: 'Genie+',
    shortDefinition:
      'Il precedente abbonamento giornaliero di Disney che forniva accesso alla Lightning Lane Multi Pass sulla maggior parte delle attrazioni.',
    definition:
      "Genie+ (ora rinominato Lightning Lane Multi Pass) era l'add-on giornaliero a pagamento di Disney che ha sostituito FastPass+. Con una tariffa per persona al giorno, gli ospiti potevano prenotare un posto Lightning Lane alla volta su un'ampia selezione di attrazioni. Le attrazioni di punta erano escluse e vendute separatamente come Individual Lightning Lane. Il prezzo di Genie+ era dinamico e aumentava nei giorni più affollati. park.fan traccia i livelli di affluenza in dettaglio per aiutarvi a decidere se l'abbonamento vale la pena.",
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      "Un numero di allocazione nel sistema di coda virtuale che consente l'accesso a un'attrazione quando il gruppo viene chiamato.",
    definition:
      "Un Boarding Group è un'allocazione numerata all'interno di un sistema di coda virtuale, utilizzato principalmente per le attrazioni più richieste dove una coda fisica sarebbe impraticabile. Gli ospiti si registrano tramite l'app del parco — spesso all'apertura — e ricevono un numero di gruppo. Quando quel numero viene chiamato, hanno una finestra limitata per presentarsi all'attrazione. Nei giorni molto affollati, tutti i Boarding Group possono esaurirsi in pochi minuti. Il sistema di Disney su attrazioni come Tron Lightcycle Run e Star Wars: Rise of the Resistance ha reso questo concetto noto in tutta la comunità dei parchi.",
    relatedTermIds: ['virtual-queue', 'wait-time', 'lightning-lane'],
  },
  {
    id: 'off-peak',
    name: 'Fuori stagione',
    shortDefinition:
      "Periodi di minore affluenza che offrono code più brevi, prezzi più bassi e un'esperienza più rilassata.",
    definition:
      "Il periodo fuori stagione corrisponde ai momenti più tranquilli del calendario, quando le scuole sono aperte e non cadono grandi festività — tipicamente da gennaio a inizio febbraio, da metà settembre a ottobre (esclusi gli eventi Halloween) e le prime settimane di novembre. In questi periodi, i tempi di attesa per le attrazioni popolari possono essere notevolmente più brevi, i prezzi dei biglietti spesso ai minimi e i parchi molto meno affollati. Per i visitatori con orari flessibili, scegliere il fuori stagione è una delle strategie più efficaci. Il calendario dell'affluenza di park.fan evidenzia queste finestre per aiutarvi a pianificare.",
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'ride-photo',
    name: 'Foto di bordo',
    shortDefinition:
      "Una foto o video catturati automaticamente durante un'attrazione, disponibili per l'acquisto dopo il giro.",
    definition:
      "La foto di bordo è un'immagine scattata automaticamente da una telecamera fissa in un momento chiave dell'attrazione — tipicamente la discesa di un'attrazione acquatica o il punto più alto di una montagna russa. Dopo il giro, gli ospiti possono vedere la loro foto a un chiosco o nell'app del parco e scegliere se acquistarla. Molti parchi offrono pacchetti foto giornalieri che includono tutte le foto di bordo del resort. La foto di bordo è un souvenir amato e un classico momento da condividere sui social.",
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
    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      "Una data in cui certi livelli di abbonamento annuale non sono validi per l'ingresso al parco, tipicamente nei giorni più affollati dell'anno.",
    definition:
      "Le Blockout Date (dette anche blackout date) sono giorni specifici del calendario in cui certi livelli di abbonamento annuale non sono validi per l'ingresso. I parchi implementano queste date per gestire la capacità nei giorni più affollati — festività, weekend di punta ed eventi speciali. Gli abbonamenti di livello superiore hanno meno o nessuna Blockout Date, mentre gli abbonamenti base possono essere bloccati su 30–60 giorni all'anno. Verificate sempre il calendario delle Blockout Date prima di visitare se possedete un abbonamento con restrizioni. Il calendario dell'affluenza di park.fan evidenzia i periodi di punta così potete incrociare le informazioni con le restrizioni del vostro abbonamento.",
    relatedTermIds: ['season-pass', 'peak-day', 'crowd-calendar'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento a biglietto separato',
    shortDefinition:
      "Un evento serale o speciale con biglietto dedicato che richiede un'ammissione separata dal normale biglietto del parco, come le feste di Halloween o Natale.",
    definition:
      "Un evento a biglietto separato (hard ticket event) è un evento — tipicamente serale — organizzato in un parco a tema che richiede un biglietto dedicato oltre all'ammissione ordinaria. Questi eventi offrono intrattenimento esclusivo, decorazioni tematiche e incontri con i personaggi non disponibili durante gli orari normali. Esempi celebri includono Mickey's Not-So-Scary Halloween Party e Mickey's Very Merry Christmas Party a Walt Disney World, Halloween Horror Nights agli Universal Studios e gli eventi stagionali a Disneyland Paris. Nei giorni degli eventi, gli ospiti normali vengono solitamente invitati a lasciare il parco entro le 18:00–19:00. I biglietti si esauriscono spesso con settimane di anticipo.",
    relatedTermIds: ['season-pass', 'peak-day', 'early-entry'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      "L'ex sistema di coda prioritaria gratuita di Disney, sostituito dal Lightning Lane a pagamento nel 2021.",
    definition:
      "FastPass+ (originariamente FastPass, introdotto nel 1999) era il sistema di coda prioritaria gratuita di Disney che consentiva agli ospiti di prenotare finestre orarie di ritorno per le attrazioni senza costi aggiuntivi. A Walt Disney World, gli ospiti potevano prenotare fino a tre prenotazioni FastPass+ al giorno tramite l'app My Disney Experience. Il sistema fu sospeso durante la chiusura per COVID-19 nel 2020 e mai ripristinato — sostituito dal sistema Lightning Lane a pagamento alla fine del 2021. FastPass+ rimane uno dei cambiamenti più discussi nella storia Disney perché ha trasformato un vantaggio gratuito in un servizio a pagamento. Comprendere il vecchio sistema è utile per leggere i resoconti di viaggio più datati.",
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
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      "Exclusive Ride Time — una sessione in cui un gruppo di appassionati o ospiti dell'hotel ha accesso esclusivo a una o più attrazioni senza la coda del pubblico generale.",
    definition:
      "ERT (Exclusive Ride Time) è un periodo durante il quale un gruppo selezionato — tipicamente membri di un club di appassionati di montagne russe, ospiti degli hotel del resort o possessori di abbonamento annuale — ha accesso esclusivo a un'attrazione o a un set di attrazioni senza il pubblico generale. Durante l'ERT, i partecipanti possono salire ripetutamente con attese minime, raggiungendo spesso decine di giri in una singola sessione. Gli eventi ERT sono organizzati dai parchi per raduni di club speciali (come l'European Coaster Club o gli incontri dell'American Coaster Enthusiasts), per pacchetti hotel premium o come parte di eventi after-hours. Per gli appassionati, l'ERT è una delle esperienze più preziose nei parchi — rivela il vero carattere di un'attrazione senza la pressione della coda.",
    relatedTermIds: ['hard-ticket-event', 'early-entry', 'rope-drop', 'credit'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario dettagliato e ottimizzato per una visita al parco a tema che sequenzia le attrazioni per minimizzare i tempi di attesa e massimizzare il numero di giri in un giorno.',
    definition:
      "Un Touring Plan è una sequenza pre-pianificata di attrazioni, orari dei pasti e spostamenti nel parco progettata per minimizzare il tempo totale di attesa nell'arco della giornata. I Touring Plan efficaci tengono conto dei modelli di affluenza (quali aree del parco si riempiono prima), delle capacità delle attrazioni, delle dinamiche delle code, degli orari degli spettacoli e del meteo. Siti come TouringPlans.com (ora Thrill-Data) pubblicano piani dettagliati basati sulla folla per i parchi principali. I tempi di attesa in diretta e il calendario dell'affluenza di park.fan sono strumenti complementari: controllare i dati in tempo reale durante la giornata consente aggiustamenti al volo al vostro piano. Nei giorni affollati, un buon Touring Plan può ridurre il tempo totale in coda del 30–50% rispetto a un approccio spontaneo.",
    relatedTermIds: ['crowd-calendar', 'rope-drop', 'wait-time', 'early-entry'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      "Un'attrazione al coperto in cui i visitatori viaggiano su veicoli guidati attraverso scene illuminate e ambienti tematizzati.",
    definition:
      "Un dark ride è un'attrazione al chiuso in cui gli ospiti viaggiano su veicoli — vagoni su rotaia, piattaforme girevoli, barche o sistemi a guida automatica — attraverso una serie di scene illuminate e ambienti tematizzati. Il termine 'dark' (buio) si riferisce all'ambiente tipicamente oscurato che amplifica gli effetti visivi, le proiezioni e l'illuminazione scenografica. I dark ride spaziano dalle esperienze per famiglie (come Pinocchio ai parchi Disney) ai thriller ad alta intensità (come Hagrid's Magical Creatures Motorbike Adventure a Universal). Sono tra le attrazioni con la maggiore capacità oraria nei parchi moderni, il che li rende punti di riferimento centrali in qualsiasi Touring Plan.",
    relatedTermIds: ['themed-land', 'ride-capacity', 'queue-line'],
  },
  {
    id: 'b-and-m',
    name: 'B&M',
    shortDefinition:
      "Bolliger & Mabillard, un costruttore svizzero di montagne russe noto per giri fluidi, affidabili e con elementi firma come l'Immelmann, il Cobra Roll e lo Zero-g Roll.",
    definition:
      "B&M (Bolliger & Mabillard) è un costruttore svizzero di montagne russe fondato nel 1988 da Walter Bolliger e Claude Mabillard. L'azienda è rinomata per produrre giri eccezionalmente fluidi e affidabili con un'esperienza caratterizzata da G-force positive, inversioni firma (Immelmann, Cobra Roll, Zero-g Roll) e ottima capacità. B&M è specializzata in coaster invertiti, looper, hyper coaster (oltre 60 m), giga coaster (oltre 91 m), wing coaster e dive machine. Quasi ogni grande parco europeo presenta almeno un'installazione B&M, tra cui Shambhala e Dragon Khan a PortAventura, Silver Star a Europa-Park, Nemesis ad Alton Towers e Goliath a Walibi Holland.",
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
    relatedTermIds: ['stengel-dive', 'b-and-m', 'intamin', 'launch-coaster'],
  },
  {
    id: 'rmc',
    name: 'RMC',
    shortDefinition:
      "Rocky Mountain Construction, un costruttore dell'Idaho che ha inventato il concetto di coaster ibrido convertendo le vecchie montagne russe in legno su binari in acciaio I-box, offrendo airtime e inversioni senza precedenti.",
    definition:
      'Rocky Mountain Construction (RMC) è un costruttore americano di montagne russe con sede a Hayden, Idaho, noto soprattutto per aver inventato il sistema di binari in acciaio I-box che può essere applicato sulle strutture in legno delle montagne russe esistenti. Questa tecnologia di conversione ha permesso ai parchi di trasformare i vecchi coaster in legno consumati in giri ibridi di livello mondiale con airtime intenso, multiple inversioni e discese oltre la verticale. Le conversioni RMC come Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) e Wildfire (Kolmården) sono rapidamente diventate le preferite degli appassionati. In Europa, il nuovo coaster ibrido RMC Untamed a Walibi Holland è ampiamente considerato uno dei migliori del continente.',
    relatedTermIds: ['hybrid-coaster', 'wooden-coaster', 'airtime'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      "Produttore olandese di montagne russe e uno dei più prolifici al mondo, noto per l'onnipresente Boomerang e per un'ampia gamma di coaster familiari e adrenalinici presenti nei parchi europei.",
    definition:
      "Vekoma Rides Manufacturing è un produttore olandese di montagne russe con sede a Vlodrop, nei Paesi Bassi, uno dei produttori più prolifici al mondo per numero di installazioni totali. Fondata nel 1926 come azienda di ingegneria meccanica, Vekoma si è orientata verso le attrazioni nel 1970 e ha acquisito notorietà mondiale con il suo Boomerang — un compatto shuttle coaster con tre inversioni, concesso in licenza a basso costo e installato in parchi di tutto il mondo. Altri modelli iconici includono il Suspended Looping Coaster (SLC), il Giant Inverted Boomerang e il Mine Train. A partire dagli anni 2010, Vekoma si è reinventata con una moderna linea 'nuova generazione' che offre sistemi di guida più fluidi, layout innovativi e migliorate attrazioni familiari. I nuovi modelli come il Family Boomerang, il Tilt Coaster e i coaster familiari sospesi compaiono sempre più nei parchi europei. Anche Disney ha commissionato design Vekoma personalizzati per i propri resort.",
    relatedTermIds: ['boomerang', 'b-and-m', 'intamin', 'gerstlauer'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Produttore tedesco noto soprattutto per il modello Euro-Fighter con il suo drop oltre la verticale, nonché per spinning coaster e compatte attrazioni familiari.',
    definition:
      "Gerstlauer Amusement Rides GmbH è un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera. Fondata nel 1946 come azienda di lavorazione dei metalli, si è avventurata nel mercato delle attrazioni negli anni '80 e ha costruito la propria reputazione mondiale con il modello Euro-Fighter — un compatto coaster a lancio elettrico famoso per il suo drop iniziale oltre la verticale (97 gradi). Gli Euro-Fighter possono essere installati in spazi ristretti, rendendoli attraenti per parchi urbani e siti più piccoli; esempi includono Rage all'Adventure Island e Speed all'Oakwood. Gerstlauer produce anche il modello Infinity Coaster, spinning coaster e lo SkyRoller, un coaster rotante dove i passeggeri controllano il proprio capovolgimento. Nella comunità degli appassionati, le montagne russe Gerstlauer sono apprezzate per la loro intensità nonostante il piccolo ingombro.",
    relatedTermIds: ['euro-fighter', 'spinning-coaster', 'b-and-m', 'intamin'],
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
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster ibrido',
    shortDefinition:
      'Un coaster che combina una struttura portante in legno tradizionale con un binario I-box in acciaio, pionieristicamente sviluppato da Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster ibrido abbina la struttura in legno di un coaster tradizionale con un binario I-box in acciaio prodotto da Rocky Mountain Construction (RMC). Il binario I-box è estremamente preciso e liscio, consentendo elementi di inversione impossibili su binari in legno tradizionali. RMC ha sviluppato questa tecnologia principalmente per rinnovare i vecchi ottovolanti in legno — aggiungendo inversioni, discese più ripide e airtime hill a layout precedentemente troppo bruschi. Famosi ibridi RMC includono Steel Vengeance a Cedar Point (spesso citato come il miglior coaster al mondo), Twisted Colossus a Six Flags Magic Mountain e Wildfire a Kolmården. Nuovi costruzioni RMC (come Untamed a Walibi Holland) esistono ora affianco alle conversioni.',
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
    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Una sezione continua a spirale in cui il binario si avvolge attorno a un asse centrale, generando G-force laterali sostenute.',
    definition:
      "Un'elica è una sezione di binario di coaster che si avvolge continuamente a spirale — simile nella forma a una vite — senza invertire i passeggeri. A differenza delle Airtime Hill o delle inversioni, le eliche generano G-force laterali (laterali) sostenute che spingono i passeggeri verso l'esterno delle curve. Un'elica discendente accelera il treno mentre gira; un'elica ascendente lo decelera pur generando ancora forze laterali. Le eliche vengono comunemente usate per spendere l'energia cinetica rimanente alla fine di un layout offrendo un'eccitante sensazione di curva sostenuta. Famose eliche includono il finale sotterraneo di Nemesis ad Alton Towers e l'elica finale di Expedition GeForce a Holiday Park.",
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
    relatedTermIds: ['pov', 'wooden-coaster', 'hybrid-coaster'],
  },
  {
    id: 'pov',
    name: 'POV',
    shortDefinition:
      "Riprese in soggettiva dalla prima fila di una montagna russa, che danno ai potenziali passeggeri un'anteprima virtuale dell'esperienza del giro.",
    definition:
      'POV (Point of View) si riferisce a riprese video in giro registrate dalla prospettiva di un passeggero in prima fila, tipicamente montate su una telecamera attaccata al treno. I video POV sono uno dei formati di contenuto più popolari nella comunità degli appassionati di parchi a tema e sono ampiamente utilizzati dai potenziali visitatori per vedere in anteprima un coaster prima di visitare. Gli operatori dei parchi a volte producono POV ufficiali per scopi promozionali; più spesso sono filmati da ospiti o media. Un POV ben prodotto mostra chiaramente ogni elemento, discesa e inversione in sequenza. YouTube ospita decine di migliaia di video POV di coaster. Il termine è usato anche in senso più ampio per descrivere qualsiasi ripresa in soggettiva delle attrazioni del parco.',
    relatedTermIds: ['credit', 'dark-ride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Una situazione in cui più treni arrivano al Brake Run prima che la stazione sia libera, causando una coda di treni in attesa — un segnale di operazioni inefficienti che prolunga i tempi di attesa.',
    definition:
      "Lo Stacking si verifica quando il processo di carico/scarico di una montagna russa è più lento del tempo del ciclo del giro, causando l'accumulo di treni nel Brake Run in attesa che la stazione si liberi. Invece di far partire un treno quando quello precedente ritorna, l'operatore deve trattenere più treni nel Brake Run — portando potenzialmente il giro a una breve fermata tra un treno e l'altro. Lo Stacking riduce direttamente la capacità del giro e prolunga i tempi di attesa in coda. Le cause comuni includono il lento caricamento degli ospiti (spesso dovuto a sistemi di ritenuta complessi), grandi requisiti di controllo bagagli, o carenza di personale. Gli ospiti esperti nei parchi possono osservare se un coaster sta facendo Stacking durante la loro attesa e tenerlo in considerazione nel processo decisionale.",
    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo di montagna russa in cui il treno è sospeso sotto la rotaia e i piedi dei passeggeri penzolano liberamente.',
    definition:
      'Un Inverted Coaster è una montagna russa in cui il treno è fissato rigidamente sotto la rotaia, con i passeggeri seduti a gambe penzolanti. A differenza di una suspended coaster (che oscilla lateralmente), il treno di un Inverted Coaster non si muove lateralmente. B&M ha sviluppato il design moderno nel 1992 con Batman The Ride. Gli Inverted Coaster sono rinomati per i near-miss intensi, i zero-g roll e i cobra roll. Esempi europei celebri: Nemesis (Alton Towers), Katun (Mirabilandia) e Oziris (Parc Astérix).',
    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo di coaster con i sedili posizionati su entrambi i lati della rotaia — nulla sopra, sotto o accanto ai passeggeri.',
    definition:
      "Un Wing Coaster (o Wing Rider) dispone due sedili per lato lungo la rotaia, lasciando i passeggeri senza alcuna struttura sopra, sotto o ai lati. Il design massimizza la sensazione di volo e crea near-miss spettacolari con l'ambientazione. B&M è il principale produttore di Wing Coaster. Esempi notevoli in Europa: The Swarm (Thorpe Park), GateKeeper (Cedar Point) e Flug der Dämonen (Europa-Park), spesso citato tra i migliori coaster d'Europa.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'dive-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      "Montagna russa con vagoni che ruotano liberamente su un asse verticale, offrendo un'esperienza diversa ad ogni giro.",
    definition:
      'Uno Spinning Coaster è dotato di vagoni montati su una piattaforma rotante che gira liberamente attorno a un asse verticale. Poiché la rotazione non è controllata, ogni veicolo vive una sequenza diversa di avanti, indietro e laterale. Mack Rides (Waldkirch, Germania) e Gerstlauer sono i principali produttori. Gli Spinning Coaster sono considerati ottime attrazioni per famiglie — abbastanza intense da essere emozionanti, ma senza i requisiti di altezza dei coaster più impegnativi.',
    relatedTermIds: ['mack-rides', 'launch-coaster', 'credit'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montagna russa che supera i 61 m di altezza, tipicamente senza inversioni e incentrata su velocità e airtime.',
    definition:
      'Hyper Coaster è la classificazione per le montagne russe tra 61 e 91 m di altezza. B&M chiama i propri modelli "Hyper Coaster"; Intamin usa il termine "Mega Coaster" per il tipo equivalente. Entrambi privilegiano grandi colline di airtime ad alta velocità piuttosto che le inversioni. Shambhala a PortAventura (Spagna) è il Hyper Coaster più alto e veloce d\'Europa con 76 m. Altri esempi celebri: Goliath a Walibi Holland e Mako a SeaWorld Orlando.',
    relatedTermIds: ['giga-coaster', 'airtime', 'b-and-m', 'intamin', 'airtime-hill'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition:
      "Montagna russa che supera i 91 m di altezza — un gradino sopra l'Hyper Coaster.",
    definition:
      "Giga Coaster è la classificazione per le montagne russe tra 91 e 121 m di altezza. Il termine è stato coniato da Cedar Fair e Intamin per Millennium Force a Cedar Point nel 2000. I Giga Coaster enfatizzano l'altezza estrema, i layout lunghi e i momenti di airtime colossali. Fury 325 a Carowinds è considerato da molti appassionati il miglior coaster in acciaio al mondo. In Europa non esistono ancora Giga Coaster nel 2025.",
    relatedTermIds: ['hyper-coaster', 'airtime', 'first-drop'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con inclinazione superiore a 90°, che inclina brevemente i passeggeri oltre la verticale.',
    definition:
      "Un Overbanked Turn è una curva dove l'inclinazione della rotaia supera i 90 gradi — il binario esterno è più alto della verticale, inclinando brevemente i passeggeri oltre la posizione capovolta senza completare un'inversione. L'elemento genera una caratteristica combinazione di G laterali e lievi G negative al culmine dell'inclinazione. Le curve overbanked sono un elemento distintivo dei Hyper Coaster di B&M e dei Mega Coaster di Intamin, e sono onnipresenti nei layout RMC.",
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
    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Previsione IA',
    shortDefinition:
      'Previsioni basate sul machine learning per i livelli di affluenza e i tempi di attesa — fino a 30+ giorni in anticipo.',
    definition:
      'Una previsione IA utilizza modelli di machine learning addestrati su dati storici di affluenza, dati meteo, calendari scolastici e dati in tempo reale per prevedere quanto sarà affollato un parco o una singola attrazione in un determinato giorno o ora. park.fan genera previsioni IA per affluenza e tempi di attesa previsti fino a 30+ giorni in anticipo.\n\nLe previsioni vengono aggiornate continuamente man mano che arrivano nuovi dati. Le previsioni a breve termine (1–7 giorni) sono generalmente molto precise poiché integrano dati meteo attuali, annunci di eventi e segnali di prenotazione. Le previsioni a lungo termine sono naturalmente meno precise, ma rimangono utili per identificare in anticipo periodi tranquilli o affollati.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'crowd-level'],
  },
  {
    id: 'opening-hours',
    name: 'Orari di apertura',
    shortDefinition:
      "Il programma giornaliero ufficiale che indica quando un parco a tema o un'attrazione apre e chiude.",
    definition:
      "Gli orari di apertura sono il programma giornaliero pubblicato per un parco a tema o una singola attrazione — indicano quando inizia l'accesso e quando termina l'operatività. La maggior parte dei grandi parchi pubblica un calendario scorrevole con settimane o mesi di anticipo, sebbene gli orari possano cambiare a breve termine a causa di eventi speciali, aggiustamenti stagionali o problemi operativi.\n\npark.fan mostra gli orari di apertura per ogni parco. Gli orari contrassegnati con «Est.» (Stimato) sono stati derivati da schemi storici e non confermati ufficialmente dal parco — devono essere verificati prima di una visita pianificata.",
    relatedTermIds: ['rope-drop', 'crowd-calendar', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendenza',
    shortDefinition:
      'La direzione del cambiamento nella lunghezza della coda negli ultimi 30 minuti — in aumento, in calo o stabile.',
    definition:
      "La tendenza indica se la coda di un'attrazione è più lunga, più corta o uguale rispetto a 30 minuti fa. park.fan la rappresenta con una freccia: su (coda in crescita), giù (coda in diminuzione) o orizzontale (stabile).\n\nLa tendenza è spesso più significativa del tempo di attesa grezzo. Un'attrazione con 45 minuti e tendenza in calo è una scelta migliore rispetto a una con 40 minuti e tendenza fortemente in aumento — nel tempo che ci vuole ad arrivare, la prima coda potrebbe essere scesa a 30 minuti mentre la seconda ha già raggiunto i 55.",
    relatedTermIds: ['wait-time', 'posted-wait-time', 'crowd-level'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride senza rotaie fisse — i veicoli navigano liberamente guidati da tecnologia incorporata nel pavimento.',
    definition:
      "Un Trackless Ride è un tipo di dark ride in cui i veicoli non sono vincolati a una rotaia fissa ma navigano autonomamente attraverso lo spazio dell'attrazione, guidati da loop di induzione, Wi-Fi o laser incorporati nel pavimento. La libertà di movimento consente scenografie molto più complesse e narrazioni non lineari: i veicoli possono girare, ruotare e avvicinarsi alle scene da diverse angolazioni. Esempi celebri: Star Wars: Rise of the Resistance (Disney), Ratatouille: L'Avventura Totalmente Toccata di Remy (Disneyland Paris) e Symbolica (Efteling, Paesi Bassi).",
    relatedTermIds: ['dark-ride', 'animatronics', 'themed-land'],
  },
];

export default translations;
