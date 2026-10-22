import type { GlossaryTermTranslation } from '@/lib/glossary/types';

const translations: GlossaryTermTranslation[] = [
  {
    id: 'wait-time',
    name: 'Tempo di attesa',
    shortDefinition:
      'Il tempo stimato che un ospite passa in coda prima di salire su un’attrazione.',
    definition:
      'Il tempo di attesa è quanto un ospite resta in fila tra il momento in cui entra nella coda normale di un’attrazione e quello in cui sale a bordo. Il numero sul cartello all’ingresso e nell’app ufficiale del parco è una stima che il parco fa da sé, in base alla lunghezza della coda e al ritmo con cui l’attrazione carica i passeggeri. Alcuni parchi la verificano consegnando un cartellino con l’orario a un ospite in fondo alla fila e leggendolo quando arriva in stazione.\n\npark.fan legge il tempo di attesa segnalato di ogni attrazione ogni cinque minuti da tre fonti pubbliche: ThemeParks.wiki, Wartezeiten.app e Queue-Times.com. Quando non concordano decide la maggioranza, poi la mediana, poi la media, e il risultato viene arrotondato ai cinque minuti, come fanno i parchi. Ogni lettura viene salvata, e da queste letture nascono le attese tipiche sulla pagina di un’attrazione, il livello di affluenza e le previsioni.\n\nUn parco che non pubblica tempi di attesa non li ha nemmeno su park.fan.',
    relatedTermIds: ['express-pass', 'posted-wait-time', 'single-rider', 'virtual-queue'],
    aliases: ['Tempi di attesa', 'tempo di attesa'],
    alternateNames: ['Fila', 'Tempo in coda', 'Tempo di coda'],
  },
  {
    id: 'single-rider',
    name: 'Single Rider',
    shortDefinition:
      'Una corsia separata per gli ospiti disposti a viaggiare da soli per riempire i posti vuoti.',
    definition:
      'La corsia Single Rider è per chi accetta di salire separato dal proprio gruppo e riempie i posti singoli rimasti liberi sui treni. Poiché questi passeggeri vengono infilati nei buchi, lì si avanza più in fretta che nella fila normale, spesso con tempi di attesa inferiori del 50–70 %. Non tutte le attrazioni hanno una corsia Single Rider.',
    alternateNames: ['Single Rider Lane', 'Fila individuale'],

    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Single Riders'],
  },
  {
    id: 'virtual-queue',
    name: 'Coda virtuale',
    shortDefinition:
      'Un sistema di coda digitale in cui gli ospiti prenotano un orario invece di attendere fisicamente.',
    definition:
      'Una coda virtuale (detta anche boarding group o orario di ritorno) permette di registrarsi per un’attrazione dall’app del parco o da un chiosco e di ricevere una notifica quando il proprio turno si avvicina. Invece di stare in fila, si può restare altrove nel parco finché il proprio gruppo non viene chiamato. I parchi la usano per le novità più richieste, dove una coda fisica concentrerebbe in un solo punto più persone di quante i vialetti ne possano contenere. Di solito la coda virtuale apre a un orario fisso, spesso proprio all’apertura dei cancelli, e può riempirsi in pochi minuti.',
    relatedTermIds: ['express-pass', 'single-rider', 'wait-time'],
    aliases: ['Code virtuali'],
  },
  {
    id: 'express-pass',
    name: 'Pass Express',
    shortDefinition:
      'Un upgrade del biglietto a pagamento o incluso che dà accesso a una corsia prioritaria più breve.',
    definition:
      'Un Pass Express (il nome cambia da parco a parco: Universal Express, Disney Lightning Lane, ecc.) è un upgrade che consente ai titolari di usare un ingresso prioritario dedicato con attese molto più brevi. Alcuni parchi includono l’accesso express nei pacchetti hotel premium; altri lo vendono a parte.',
    alternateNames: ['Flash Pass', 'Express Pass', 'Lightning Lane'],

    relatedTermIds: ['single-rider', 'virtual-queue', 'wait-time'],
    aliases: ['Pass Express', 'Universal Express', 'Flash Pass'],
  },
  {
    id: 'posted-wait-time',
    name: 'Tempo segnalato',
    shortDefinition:
      'Il tempo di attesa ufficiale mostrato dal parco all’ingresso di un’attrazione.',
    definition:
      'Il tempo segnalato è la stima ufficiale che sta all’ingresso di un’attrazione e nell’app del parco. I parchi la calcolano dalla lunghezza misurata della fila, dalla portata dell’attrazione fin lì e dal ritmo con cui in quel momento si carica. park.fan unisce i tempi segnalati da più fonti pubbliche ogni cinque minuti.',
    relatedTermIds: ['crowd-level', 'wait-time'],
    aliases: ['tempo segnalato', 'tempi segnalati'],
  },
  {
    id: 'crowd-level',
    name: 'Livello di affluenza',
    shortDefinition:
      'Una scala che misura quanto è affollato un parco a tema in un dato giorno, da «Molto bassa» a «Estrema».',
    definition:
      'Il livello di affluenza dice quanto è pieno un parco in un certo giorno o a una certa ora. park.fan misura ogni parco rispetto a sé stesso: 100 % è l’attesa delle attrazioni principali in una giornata tipica di quel parco, e le attese del momento sono espresse come percentuale di quel valore. Fino al 60 % l’affluenza è Molto bassa, dal 61 all’89 % Bassa, dal 90 al 110 % Normale, dal 111 al 150 % Alta, dal 151 al 200 % Molto alta, oltre è Estrema. I giorni previsti nel calendario dell’affluenza usano la stessa scala.\n\nPoiché ogni parco fa da riferimento a sé, Estrema in un piccolo parco per famiglie ed Estrema a Disneyland Paris valgono un numero diverso di minuti ma descrivono la stessa situazione: code lunghe il doppio del solito o più. A spostare il livello sono le vacanze scolastiche, i giorni festivi, gli eventi speciali come le serate di Halloween o i fuochi d’artificio, e il meteo.',
    relatedTermIds: ['crowd-calendar', 'peak-day', 'wait-time'],
    aliases: ['Livelli di affluenza', 'affluenza'],
  },
  {
    id: 'crowd-calendar',
    name: 'Calendario dell’affluenza',
    shortDefinition:
      'Una previsione giorno per giorno dei livelli di affluenza, per trovare i giorni più tranquilli per la visita.',
    definition:
      'Un calendario dell’affluenza mostra i prossimi mesi di un parco come una griglia di giorni, ciascuno colorato secondo il livello di affluenza previsto. Su park.fan il colore viene da Fancast, il modello di previsione che park.fan addestra da sé: calcola un’attesa prevista per ogni attrazione e ogni ora della giornata e le riassume in un unico livello di affluenza per il giorno, sulla stessa scala da Molto bassa a Estrema usata per il dato in tempo reale.\n\nIl modello impara dai tempi di attesa che park.fan ha misurato nel parco. Tiene conto anche delle previsioni meteo, delle vacanze scolastiche, dei giorni festivi e dei ponti nei paesi in cui si trovano i parchi, e di quello che succede nel parco, come una stagione di Halloween o i primi giorni dell’anno. Viene riaddestrato ogni mattina alle 06:00 UTC con le attese del giorno prima, quindi il colore di una data può cambiare man mano che quella data si avvicina.\n\nIl calendario copre il periodo per cui il parco ha pubblicato i suoi orari. Un parco aperto tutto l’anno ha un livello per giorni lontani quasi un anno; un parco stagionale mostra Chiuso dopo l’ultimo giorno pubblicato.',
    relatedTermIds: ['crowd-level', 'peak-day', 'rope-drop'],
  },
  {
    id: 'peak-day',
    name: 'Giorno di punta',
    shortDefinition:
      'Un giorno in cui l’affluenza raggiunge o sfiora la capienza massima di un parco.',
    definition:
      'Un giorno di punta è un giorno in cui l’affluenza è alla capienza massima del parco o ci si avvicina. Di solito sono le grandi festività (Natale, Pasqua), i giorni di eventi speciali come le serate di Halloween e i fuochi di Capodanno, e le settimane di vacanze scolastiche. In un giorno di punta a Disneyland Paris o a Europa-Park le attrazioni principali arrivano spesso tra 90 e 120 minuti di attesa, e le code ai ristoranti si formano molto prima di mezzogiorno. Nel calendario dell’affluenza di park.fan questi giorni compaiono come Molto alta o Estrema.',
    aliases: ['Giorni di punta'],
    alternateNames: ['Alta Stagione', 'Giornata Affollata', 'Giorno ad alta affluenza'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'rope-drop'],
  },
  {
    id: 'refurbishment',
    name: 'Ristrutturazione',
    shortDefinition:
      'Un periodo di chiusura pianificata durante il quale un’attrazione viene sottoposta a manutenzione o miglioramenti.',
    definition:
      'Una ristrutturazione (tra gli appassionati si dice spesso «refurbishment», o in breve «refurb») è un periodo programmato di manutenzione o rinnovo durante il quale un’attrazione, uno spettacolo o un’area del parco resta chiusa. Può durare da pochi giorni a diversi mesi e di solito cade nei periodi di bassa affluenza. I parchi pubblicano in anticipo il calendario delle ristrutturazioni, ma le date si spostano. Disney e Universal fanno ruotare le chiusure, così ogni anno a fermarsi sono attrazioni diverse. park.fan segnala le attrazioni attualmente in ristrutturazione.',
    aliases: ['Ristrutturazioni'],
    alternateNames: ['Manutenzione', 'Refurb', 'Rehab', 'Chiusura per manutenzione'],

    relatedTermIds: ['downtime', 'ride-capacity'],
  },
  {
    id: 'downtime',
    name: 'Tempo fermo',
    shortDefinition:
      'Una chiusura temporanea non pianificata di un’attrazione, spesso dovuta a un guasto tecnico.',
    definition:
      'Il tempo fermo è una chiusura temporanea e non programmata di un’attrazione, a differenza della ristrutturazione, che è pianificata. Le cause sono guasti meccanici, errori dei sensori, controlli di sicurezza dopo un incidente con un ospite, il meteo (soprattutto i fulmini) o un animale nell’area dell’attrazione. Quasi sempre il problema si risolve in un tempo che va da pochi minuti a un paio d’ore, ma un guasto meccanico complesso può tenere l’attrazione chiusa per il resto della giornata. park.fan mostra lo stato attuale di ogni attrazione monitorata e distingue tra «Aperta», «Ferma», «Chiusa» e «In manutenzione».',
    aliases: ['Guasti'],
    alternateNames: ['Fuori Servizio', 'Problema Tecnico', 'Interruzione'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'ride-capacity',
    name: 'Capacità dell’attrazione',
    shortDefinition: 'Il numero di ospiti che un’attrazione può ospitare per ora.',
    definition:
      'La capacità di un’attrazione, o portata oraria, è il numero di ospiti che può trasportare in un’ora quando tutto funziona a dovere. Dipende dalla dimensione dei veicoli, da quanti ne sono in servizio, dalla velocità di carico e scarico in stazione e dalla durata del ciclo. Caroselli, tronchi e grandi dark ride portano da 1.500 a 2.000 ospiti l’ora; un dark ride con un solo veicolo alla volta o delle montagne russe con un solo treno in pista si fermano a 500–800. È la capacità a decidere quanto in fretta avanza una coda: 30 minuti di attesa a 1.800 persone l’ora smaltiscono la gente tre volte più in fretta degli stessi 30 minuti a 600. Proprio per questo nei giorni affollati i parchi aggiungono treni o veicoli.',
    relatedTermIds: ['downtime', 'refurbishment', 'wait-time'],
  },
  {
    id: 'rope-drop',
    name: 'Rope Drop',
    shortDefinition:
      'Il momento in cui un parco apre ufficialmente i suoi cancelli e le code per le attrazioni popolari sono più brevi.',
    definition:
      'Il Rope Drop è il momento in cui un parco a tema apre per la giornata. Il nome viene dalla corda (o barriera) che il personale abbassa per far entrare i primi ospiti. Molti arrivano al Rope Drop perché al mattino, prima che il parco si riempia, le attrazioni più richieste hanno le code più brevi. Il calendario di park.fan mostra gli orari di apertura esatti.',
    relatedTermIds: ['crowd-calendar', 'crowd-level', 'early-entry', 're-ride', 'wait-time'],
  },
  {
    id: 'early-entry',
    name: 'Early Entry',
    shortDefinition:
      'Un vantaggio che consente agli ospiti degli hotel del resort di entrare nel parco prima dell’apertura generale.',
    definition:
      'L’Early Entry (chiamato anche Extra Magic Hours o Early Park Entry) permette agli ospiti degli hotel partner di accedere al parco 30–60 minuti prima del pubblico generale. In quel lasso di tempo le code alle attrazioni più richieste sono molto più brevi. Nei giorni di punta, con l’Early Entry e un ordine di visita deciso in anticipo si riescono a fare più attrazioni principali con attese minime.',
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
      'Un’opzione del biglietto che permette di visitare più parchi dello stesso resort nello stesso giorno.',
    definition:
      'Un biglietto Park Hopper permette di entrare in due o più parchi dello stesso resort nella stessa giornata. Quello di Disney consente di spostarsi tra Magic Kingdom, EPCOT, Hollywood Studios e Animal Kingdom a qualsiasi ora: la regola che impediva il cambio di parco prima delle 14:00 è stata abolita a gennaio 2024. Il biglietto park-to-park di Universal Orlando collega Universal Studios Florida e Islands of Adventure, unite anche dall’Hogwarts Express, un’attrazione su cui sale solo chi ha il park-to-park. PortAventura World ha un biglietto combinato per PortAventura Park e Ferrari Land. Cambiare parco conviene quando l’attrazione per cui si è venuti sta nel secondo parco, quando a una mattina in un parco segue uno spettacolo serale nell’altro, o in un viaggio breve. Il sovrapprezzo rispetto al biglietto per un solo parco varia da resort a resort e sale nei giorni di punta.',
    alternateNames: ['Park Hopping', 'Biglietto multiparco'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'season-pass'],
  },
  {
    id: 'season-pass',
    name: 'Abbonamento annuale',
    shortDefinition: 'Un biglietto annuale che consente visite illimitate al parco per 12 mesi.',
    definition:
      'Un abbonamento annuale (Annual Pass) garantisce ingressi illimitati a uno o più parchi per un periodo di 12 mesi. I livelli superiori spesso includono vantaggi come sconti sulla ristorazione, parcheggio gratuito e sconti sul merchandising. Alcuni abbonamenti prevedono date di esclusione (blockout dates) nei giorni di punta. Chi va al parco tre o più volte all’anno spende di solito meno con l’abbonamento che con i biglietti singoli.',
    alternateNames: ['Annual Pass', 'Season Pass', 'Tessera Annuale', 'Abbonamento stagionale'],

    relatedTermIds: ['express-pass', 'park-hopper', 'peak-day'],
    aliases: ['abbonamenti annuali'],
  },
  {
    id: 'height-requirement',
    name: 'Altezza minima',
    shortDefinition:
      'Un’altezza minima che gli ospiti devono raggiungere per accedere a un’attrazione specifica.',
    definition:
      'L’altezza minima è una regola di sicurezza fissata dai parchi perché i sistemi di ritenuta (barre addominali, spallacci, cinture) tengano correttamente ogni passeggero. Va da circa 90 cm sulle montagne russe per famiglie più tranquille a 140 cm sulle attrazioni più intense. Alcune attrazioni hanno anche un’altezza o un peso massimo, ma sono casi più rari. I siti e le app dei parchi pubblicano l’altezza richiesta per ogni attrazione, così la si può controllare prima della giornata in famiglia invece che all’ingresso della giostra. Se un bambino è troppo basso, la maggior parte dei parchi offre il Rider Switch, con cui gli adulti salgono a turno senza rifare la coda.',
    aliases: ['Altezze minime', 'requisiti minimi di altezza'],
    alternateNames: ['Requisito di Altezza', 'Limite di Altezza', 'Altezza richiesta'],

    relatedTermIds: ['refurbishment', 'ride-capacity'],
  },
  {
    id: 'themed-land',
    name: 'Area tematica',
    shortDefinition:
      'Una zona autonoma all’interno di un parco a tema costruita attorno a un tema coerente.',
    definition:
      'Un’area tematica è una zona delimitata di un parco con un unico stile visivo, un’unica storia di sfondo e attrazioni, ristoranti e negozi coerenti. L’idea è che varcarne l’ingresso dia la sensazione di arrivare in un altro luogo. Il Mondo Magico di Harry Potter agli Universal Studios, Star Wars: Galaxy’s Edge nei parchi Disney, Klugheim a Phantasialand e Skandinavien a Europa-Park ne sono quattro esempi. Una nuova area è anche un evento di affluenza a sé: la stagione d’apertura attira i media e fa salire visibilmente le presenze. E siccome un’area tende ad affiancare un’attrazione di punta a bassa capacità a diverse attrazioni ad alta capacità, nella stessa zona i tempi di attesa possono differire di un’ora.',
    aliases: ['Aree tematiche'],
    alternateNames: ['Zona Tematica', 'Land', 'Mondo tematico'],

    relatedTermIds: ['refurbishment', 'ride-capacity', 'soft-opening'],
  },
  {
    id: 'soft-opening',
    name: 'Soft Opening',
    shortDefinition:
      'L’apertura non ufficiale di un’attrazione prima della data di lancio annunciata.',
    definition:
      'Un Soft Opening avviene quando un parco apre silenziosamente una nuova attrazione o area prima della data ufficiale, spesso senza alcun annuncio. I parchi usano i Soft Opening per provare i sistemi con il pubblico, trovare i problemi operativi e mettere a punto le procedure di imbarco. Un Soft Opening può cominciare e interrompersi senza preavviso: ne approfitta chi è già nel parco, ma non ci si può contare quando si pianifica la visita. Forum e social media di solito sono i primi a segnalarli.',
    alternateNames: ['Soft Launch', 'Apertura anticipata'],

    relatedTermIds: ['downtime', 'refurbishment', 'themed-land'],
  },
  {
    id: 'standby-queue',
    name: 'Standby',
    shortDefinition:
      'La fila d’attesa classica di un’attrazione, senza prenotazione né pass speciale.',
    definition:
      'La coda Standby è la normale fila d’attesa fisica accessibile a tutti gli ospiti senza biglietto aggiuntivo o upgrade. Chi si mette in Standby aspetta in ordine di arrivo, e il tempo indicato dipende direttamente da quanta gente c’è in quel momento all’attrazione. Nei giorni più affollati, i tempi di Standby per le attrazioni principali possono superare i 90 minuti. park.fan mostra il tempo Standby di ogni attrazione accanto agli altri tipi di coda.',
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
      'Lightning Lane è il nome che Disney dà al sistema di coda prioritaria introdotto a fine 2021 al posto di FastPass+. Da luglio 2024 Walt Disney World lo vende in due forme: Lightning Lane Single Pass (fino ad allora Individual Lightning Lane, ILL), venduto a persona e ad attrazione per quelle più richieste, e Lightning Lane Multi Pass (LLMP), un acquisto giornaliero che prenota fasce orarie di ritorno su una selezione di attrazioni. Entrambi si prenotano giorni prima della visita, hanno prezzi dinamici e costano di più nei giorni affollati. Un terzo livello, più caro, il Lightning Lane Premier Pass, comprende un passaggio su ogni attrazione aderente. Siccome ha preso il posto di un servizio gratuito, se ne discute ancora. Quanto valga dipende dalla giornata: con il parco tranquillo la coda standby scorre abbastanza in fretta da cambiare poco, in un giorno di punta un Single Pass per Tron o Radiator Springs Racers può fare la differenza tra salire e non salire. Il calendario dell’affluenza di park.fan segnala i giorni in cui si prevedono lunghe code standby.',
    alternateNames: [
      'Lightning Lane Multi Pass',
      'Lightning Lane Single Pass',
      'Lightning Lane Premier Pass',
      'LLMP',
    ],

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
      'Il precedente abbonamento giornaliero di Disney che forniva accesso alla Lightning Lane Multi Pass sulla maggior parte delle attrazioni.',
    definition:
      'Genie+ (ora rinominato Lightning Lane Multi Pass) era l’add-on giornaliero a pagamento di Disney che ha sostituito FastPass+. Con una tariffa per persona al giorno, gli ospiti potevano prenotare un posto Lightning Lane alla volta su un’ampia selezione di attrazioni. Le attrazioni di punta erano escluse e vendute separatamente come Individual Lightning Lane, diventata Lightning Lane Single Pass a luglio 2024. Il prezzo di Genie+ era dinamico e aumentava nei giorni più affollati.',
    aliases: ['Genie Plus'],
    alternateNames: ['Disney Genie', 'Lightning Lane Multi Pass'],

    relatedTermIds: ['express-pass', 'lightning-lane', 'virtual-queue'],
  },
  {
    id: 'boarding-group',
    name: 'Boarding Group',
    shortDefinition:
      'Un numero di allocazione nel sistema di coda virtuale che consente l’accesso a un’attrazione quando il gruppo viene chiamato.',
    definition:
      'Un Boarding Group è un’allocazione numerata all’interno di un sistema di coda virtuale, utilizzato principalmente per le attrazioni più richieste dove una coda fisica sarebbe impraticabile. Gli ospiti si registrano tramite l’app del parco, spesso all’apertura, e ricevono un numero di gruppo. Quando quel numero viene chiamato, hanno una finestra limitata per presentarsi all’attrazione. Nei giorni molto affollati, tutti i Boarding Group possono esaurirsi in pochi minuti. Disney usa i Boarding Group su attrazioni come Tron Lightcycle Run e Star Wars: Rise of the Resistance.',
    alternateNames: ['Boarding Groups'],

    relatedTermIds: ['lightning-lane', 'virtual-queue', 'wait-time'],
  },
  {
    id: 'off-peak',
    name: 'Bassa affluenza',
    shortDefinition: 'Periodi di minore affluenza, con code più brevi e prezzi più bassi.',
    definition:
      'I periodi di bassa affluenza sono i momenti più tranquilli del calendario, quando le scuole sono aperte e non cadono grandi festività: di solito da gennaio a inizio febbraio, da metà settembre a ottobre (esclusi gli eventi di Halloween) e le prime settimane di novembre. In questi periodi i tempi di attesa alle attrazioni più richieste possono essere molto più brevi, i biglietti costano spesso il minimo e i parchi sono molto meno affollati. Il calendario dell’affluenza di park.fan segna le finestre di bassa affluenza di un parco.',
    alternateNames: ['Bassa Stagione', 'Fuori Stagione', 'Periodo Tranquillo'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'offseason',
    name: 'Chiusura stagionale',
    shortDefinition:
      'Il periodo dell’anno in cui il parco chiude del tutto per manutenzione, lavori alle attrazioni o pausa invernale, e non è aperto al pubblico.',
    definition:
      'La chiusura stagionale è la parte dell’anno in cui un parco resta chiuso del tutto: niente attrazioni, ristoranti o spettacoli. È diversa dalla bassa stagione, quando il parco è aperto ma tranquillo. Molti parchi con una stagione all’aperto chiudono tra novembre e marzo o aprile, alcuni con una stagione invernale o qualche weekend natalizio nel mezzo; i parchi nei climi caldi o con quasi tutte le attrazioni al coperto possono non averla affatto.\n\nI mesi di chiusura servono ai lavori che non si possono fare con gli ospiti nel parco: le ispezioni annuali, la manutenzione di binari e treni, le ristrutturazioni più grandi e la costruzione di nuove attrazioni.\n\nQuando park.fan mostra «Fuori stagione» per un parco, non c’è un calendario di apertura per il periodo attuale e il prossimo giorno di apertura confermato è lontano qualche settimana. Il calendario dell’affluenza segna i giorni di chiusura come Chiuso, e la data di riapertura compare quando il parco la pubblica.',
    aliases: ['Off-Season'],
    alternateNames: ['Chiusura Invernale', 'Pausa stagionale'],

    relatedTermIds: ['crowd-calendar', 'refurbishment', 'soft-opening'],
  },
  {
    id: 'ride-photo',
    name: 'Foto di bordo',
    shortDefinition:
      'Una foto o video catturati automaticamente durante un’attrazione, disponibili per l’acquisto dopo il giro.',
    definition:
      'La foto di bordo è un’immagine scattata automaticamente da una telecamera fissa in un punto preciso del percorso, di solito la discesa di un’attrazione acquatica o la cima di una montagna russa. Dopo il giro, gli ospiti possono vedere la loro foto a un chiosco o nell’app del parco e scegliere se acquistarla. Molti parchi offrono pacchetti foto giornalieri che includono tutte le foto di bordo del resort.',
    aliases: ['Foto dell’Attrazione', 'Foto On-Ride'],

    relatedTermIds: ['onride-offride', 'themed-land'],
  },
  {
    id: 'queue-line',
    name: 'Coda',
    shortDefinition:
      'L’area d’attesa fisica che gli ospiti percorrono prima di salire su un’attrazione, spesso tematizzata come l’attrazione stessa.',
    definition:
      'La coda è lo spazio fisico (corridoi, serpentine all’aperto o sale interne) che gli ospiti attraversano aspettando di salire su un’attrazione. Nei parchi moderni la coda è spesso tematizzata quanto l’attrazione: nella Haunted Mansion di Disney la storia comincia già in fila, prima di salire sul Doom Buggy, e nelle attrazioni di Harry Potter a Universal la fila passa già per gli ambienti del mondo dei film.',
    relatedTermIds: ['single-rider', 'standby-queue', 'wait-time'],
    aliases: ['Code', 'Fila', 'File'],
  },
  {
    id: 'opening-day',
    name: 'Giorno dell’inaugurazione',
    shortDefinition: 'La data ufficiale di apertura di un nuovo parco, area tematica o attrazione.',
    definition:
      'Il giorno dell’inaugurazione è la data ufficialmente annunciata in cui un nuovo parco, un’espansione o un’attrazione apre al grande pubblico per la prima volta. In questi giorni arrivano giornalisti e molti visitatori, e le code sono lunghe. I parchi organizzano spesso cerimonie di inaugurazione con spettacoli speciali e apparizioni di personaggi. Per questo il giorno dell’inaugurazione raramente è quello giusto per provare una nuova attrazione con poca attesa. I Soft Opening precedono talvolta la data ufficiale.',
    relatedTermIds: ['crowd-level', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'rider-switch',
    name: 'Rider Switch',
    shortDefinition:
      'Un sistema che consente agli accompagnatori di alternare il giro mentre l’altro aspetta con bambini che non soddisfano il requisito di altezza.',
    definition:
      'Il Rider Switch (detto anche Child Swap) è un sistema disponibile nella maggior parte dei grandi parchi a tema che consente a un gruppo di alternarsi su un’attrazione quando un membro (di solito un bambino che non raggiunge l’altezza minima) non può salire. Un adulto sale sull’attrazione mentre l’altro aspetta all’ingresso con il bambino; al ritorno del primo adulto, il secondo può imbarcarsi immediatamente senza rimettersi in coda. Ai parchi Disney il sistema si chiama Rider Switch; agli Universal si chiama Child Swap. Nei giorni affollati il secondo adulto salta così tutta l’attesa. Basta chiederlo agli operatori all’ingresso dell’attrazione.',
    alternateNames: ['Child Swap', 'Rider Switch', 'Cambio Genitore', 'Baby Switch'],

    relatedTermIds: ['height-requirement', 'standby-queue', 'wait-time'],
  },
  {
    id: 'blockout-date',
    name: 'Blockout Date',
    shortDefinition:
      'Una data in cui certi livelli di abbonamento annuale non sono validi per l’ingresso al parco, tipicamente nei giorni più affollati dell’anno.',
    definition:
      'Le Blockout Date (dette anche blackout date) sono giorni specifici del calendario in cui certi livelli di abbonamento annuale non sono validi per l’ingresso. I parchi le usano per limitare l’affluenza nei giorni più affollati: festività, weekend di punta ed eventi speciali. Gli abbonamenti di livello superiore hanno meno o nessuna Blockout Date, mentre gli abbonamenti base possono essere bloccati su 30–60 giorni all’anno. Con un abbonamento soggetto a restrizioni conviene controllare il calendario delle Blockout Date prima di partire.',
    aliases: ['Giorni bloccati'],
    alternateNames: ['Blackout Date', 'Data di esclusione'],

    relatedTermIds: ['crowd-calendar', 'peak-day', 'season-pass'],
  },
  {
    id: 'hard-ticket-event',
    name: 'Evento a biglietto separato',
    shortDefinition:
      'Un evento speciale con biglietto a parte, di solito serale, per cui serve un ingresso dedicato oltre al normale biglietto del parco.',
    definition:
      'Un evento a biglietto separato (hard ticket event) è un evento serale in un parco a tema con un biglietto proprio, da comprare in aggiunta al biglietto giornaliero o al suo posto. Durante questi eventi ci sono spettacoli, decorazioni stagionali e percorsi a piedi che la normale giornata di apertura non ha. Alcuni esempi sono Mickey’s Not-So-Scary Halloween Party e Mickey’s Very Merry Christmas Party a Walt Disney World, Halloween Horror Nights agli Universal Studios e Traumatica a Europa-Park, che ha un suo biglietto serale. Nei giorni dell’evento gli ospiti con il biglietto normale devono uscire nel tardo pomeriggio o in prima serata; a Magic Kingdom la festa di Halloween comincia alle 19:00, e le ultime ore prima sono insolitamente affollate perché tutti cercano di fare un ultimo giro. I biglietti vanno in vendita mesi prima, e le serate di Halloween più richieste si esauriscono settimane prima della data.',
    aliases: ['Eventi speciali'],
    alternateNames: ['Serata Speciale', 'After-Hours', 'Hard Ticket Event'],

    relatedTermIds: ['early-entry', 'peak-day', 'season-pass'],
  },
  {
    id: 'fastpass',
    name: 'FastPass',
    shortDefinition:
      'L’ex sistema di coda prioritaria gratuita di Disney, sostituito dal Lightning Lane a pagamento nel 2021.',
    definition:
      'FastPass+ (in origine FastPass, introdotto nel 1999) era il sistema gratuito di coda prioritaria di Disney, con cui gli ospiti prenotavano una fascia oraria di ritorno per un’attrazione senza pagare nulla in più. FastPass+ esisteva solo a Walt Disney World, dove si potevano avere fino a tre prenotazioni al giorno tramite l’app My Disney Experience. Il sistema fu sospeso nel 2020, durante la chiusura per COVID-19, e non fu più ripristinato. Alla fine del 2021 lo sostituì la Lightning Lane, a pagamento. Disneyland Paris aveva un FastPass cartaceo, oggi sostituito da Premier Access. Molti resoconti di viaggio più vecchi parlano ancora di FastPass+.',
    alternateNames: ['FastPass+', 'FastPass Plus'],

    relatedTermIds: ['express-pass', 'genie-plus', 'lightning-lane', 'return-time'],
    aliases: ['Fast Pass'],
  },
  {
    id: 'return-time',
    name: 'Orario di ritorno',
    shortDefinition:
      'Una finestra oraria prenotata per tornare a un’attrazione, emessa da Lightning Lane, dalla coda virtuale o da sistemi simili di accesso prioritario.',
    definition:
      'Un orario di ritorno (return time) è una fascia oraria, di solito di un’ora, in cui un ospite che ha prenotato l’accesso prioritario (tramite Lightning Lane, coda virtuale o un sistema simile) può presentarsi all’ingresso dedicato dell’attrazione. Nel frattempo si può girare per il parco invece di stare in fila. Chi arriva oltre un certo numero di minuti dopo la fine della fascia di solito perde la prenotazione.',
    relatedTermIds: ['boarding-group', 'fastpass', 'lightning-lane', 'virtual-queue'],
    aliases: ['Orari di ritorno', 'Ora di ritorno', 'Ore di ritorno'],
  },
  {
    id: 'ert',
    name: 'ERT',
    shortDefinition:
      'Exclusive Ride Time: una sessione in cui un gruppo di appassionati o di ospiti dell’hotel ha una o più attrazioni solo per sé, senza la coda del pubblico.',
    definition:
      'ERT (Exclusive Ride Time) è un periodo in cui un gruppo ristretto (di solito i membri di un club di appassionati di montagne russe, gli ospiti degli hotel del resort o chi ha l’abbonamento annuale) ha un’attrazione o un gruppo di attrazioni solo per sé. Durante l’ERT si risale più volte con attese minime, e in una sola sessione si arriva spesso a decine di giri. I parchi organizzano l’ERT per i raduni dei club (come l’European Coaster Club o gli incontri dell’American Coaster Enthusiasts), per i pacchetti hotel premium o come parte di eventi after-hours.',
    aliases: ['ERT'],
    alternateNames: ['Exclusive Ride Time', 'Tempo esclusivo in attrazione'],

    relatedTermIds: ['credit', 'early-entry', 'hard-ticket-event', 're-ride', 'rope-drop'],
  },
  {
    id: 'touring-plan',
    name: 'Touring Plan',
    shortDefinition:
      'Un itinerario per la visita a un parco a tema che mette le attrazioni in un ordine pensato per ridurre i tempi di attesa e fare più giri in un giorno.',
    definition:
      'Un Touring Plan è una sequenza di attrazioni, pasti e spostamenti nel parco decisa prima della visita per ridurre il tempo totale di attesa della giornata. Chi prepara un buon Touring Plan tiene conto di quali aree del parco si riempiono prima, della capacità delle attrazioni, di come crescono le code, degli orari degli spettacoli e del meteo. Siti come TouringPlans.com pubblicano piani dettagliati per i grandi parchi.',
    aliases: ['Touring Plan'],
    alternateNames: ['Piano di Visita', 'Itinerario', 'Pianificazione visita'],

    relatedTermIds: ['crowd-calendar', 'early-entry', 'rope-drop', 'wait-time'],
  },
  {
    id: 'dark-ride',
    name: 'Dark ride',
    shortDefinition:
      'Un’attrazione al coperto in cui i visitatori viaggiano su veicoli guidati attraverso scene illuminate e ambienti tematizzati.',
    definition:
      'Un dark ride è un’attrazione al chiuso in cui gli ospiti attraversano scene tematizzate a bordo di veicoli: vetture su rotaia o senza binario, barche in un canale o gondole appese a una rotaia sopraelevata. Il nome viene dall’illuminazione controllata, che lascia lavorare proiezioni, animatronic e scenografie costruite. Si va dai classici tranquilli per famiglie (it’s a small world, Pinocchio’s Daring Journey) alle lunghe attrazioni narrative come Star Wars: Rise of the Resistance. Nei dark ride senza binario i veicoli sono guidati dal pavimento, così una scena può essere avvicinata da più direzioni e due veicoli non devono per forza fare lo stesso percorso; Symbolica a Efteling e Ratatouille a Disneyland Paris sono gli esempi europei. Di solito un dark ride porta più ospiti l’ora di un roller coaster, ed è per questo che i parchi ci contano nei giorni di affluenza.',
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
      'Bolliger & Mabillard, costruttore svizzero di montagne russe dalle corse fluide, con elementi ricorrenti come l’Immelmann, il Cobra Roll e lo Zero-g Roll.',
    definition:
      'B&M (Bolliger & Mabillard) è un costruttore svizzero di montagne russe fondato nel 1988 da Walter Bolliger e Claude Mabillard. Le montagne russe B&M hanno corse fluide e affidabili, puntano sulle G-force positive, usano spesso le stesse inversioni (Immelmann, Cobra Roll, Zero-g Roll) e hanno un’alta capacità oraria. B&M è specializzata in coaster invertiti, looper, hyper coaster (oltre 60 m), giga coaster (oltre 91 m), wing coaster e dive machine. Quasi ogni grande parco europeo ha almeno una montagna russa B&M, tra cui Shambhala e Dragon Khan a PortAventura, Silver Star a Europa-Park e Nemesis ad Alton Towers.',
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
      'Un costruttore svizzero di giostre e montagne russe, noto per i lanci idraulici e i mega e giga coaster, che ha costruito alcune delle montagne russe più veloci e più alte del mondo.',
    definition:
      'Intamin AG è un costruttore svizzero di giostre fondato nel 1967, che ha costruito diverse montagne russe da record. Il suo lancio idraulico ha spinto per anni i coaster più veloci e più alti del mondo (Kingda Ka, 139 m; Top Thrill Dragster). Kingda Ka ha chiuso nel 2024 ed è stato demolito nel 2025, mentre Top Thrill Dragster è stato ricostruito nel 2024 come Top Thrill 2. Intamin è nota anche per i suoi mega e giga coaster (tra cui Millennium Force a Cedar Point e Intimidator 305 a Kings Dominion), i multi-launch coaster, le attrazioni acquatiche e i dark ride. Fra gli impianti europei di Intamin ci sono Taron al Phantasialand, Expedition GeForce all’Holiday Park e Red Force a Ferrari Land.',
    relatedTermIds: ['b-and-m', 'launch-coaster', 'mack-rides', 'top-hat'],
    aliases: ['Intamin AG'],
  },
  {
    id: 'mack-rides',
    name: 'Mack Rides',
    shortDefinition:
      'Un costruttore tedesco a conduzione familiare di Waldkirch vicino a Europa-Park, che produce attrazioni acquatiche, dark ride e montagne russe in acciaio.',
    definition:
      'Mack Rides è un costruttore di giostre tedesco con sede a Waldkirch, nel Baden-Württemberg, a pochi chilometri da Europa-Park, il parco della stessa famiglia Mack. Fondato nel 1780 da Paul Mack come costruttore di carri, Mack produce attrazioni acquatiche, dark ride e un numero crescente di montagne russe. Il suo Blue Fire Megacoaster a Europa-Park (2009) ha uno Stengel Dive. Hyperia a Thorpe Park (2024, 72 m) è un hyper coaster Mack, mentre The Ride to Happiness a Plopsaland è un Xtreme Spinning Coaster con lancio.',
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
      'Rocky Mountain Construction, costruttore dell’Idaho che ha inventato il coaster ibrido: monta un binario in acciaio I-box sulla struttura di vecchie montagne russe in legno, su cui diventano possibili inversioni e colline di airtime.',
    definition:
      'Rocky Mountain Construction (RMC) è un costruttore americano di montagne russe con sede a Hayden, Idaho, che ha inventato il binario in acciaio I-box, da montare sulla struttura in legno di montagne russe esistenti. Con questa conversione i parchi hanno trasformato vecchi coaster in legno consumati in coaster ibridi con airtime forte, più inversioni e discese oltre la verticale. Tra le conversioni RMC ci sono Steel Vengeance (Cedar Point), Wicked Cyclone (Six Flags New England) e Untamed a Walibi Holland (2019), nato dal coaster in legno Robin Hood. Wildfire a Kolmården (2016) è invece una costruzione nuova, la prima di RMC in Europa.',
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
      'Costruttore statunitense di montagne russe in legno con sede ad Atlanta, fondato nel 1979 e sciolto nel 2005. In Europa ha costruito tra l’altro The Bandit al Movie Park Germany e Coaster Express al Parque Warner Madrid.',
    definition:
      'La Roller Coaster Corporation of America (RCCA), con sede ad Atlanta, costruiva montagne russe in legno. Prefabbricava nelle proprie officine sezioni della struttura in legno e del binario e le assemblava nel parco, accorciando i tempi di costruzione. La prima grande attrazione fu Rattler a Six Flags Fiesta Texas nel 1992, la più nota Son of Beast a Kings Island (2000), allora la montagna russa in legno più alta del mondo e la prima montagna russa in legno moderna con un’inversione. Son of Beast è stata demolita e Rocky Mountain Construction ha trasformato Rattler in Iron Rattler.\n\nIn Europa la RCCA ha costruito tre attrazioni: The Bandit al Movie Park Germany (1999), Magnus Colossus a Terra Mítica (2000, chiusa) e Coaster Express al Parque Warner Madrid (2002), l’ultima dell’azienda. Nel 2005 la RCCA ha cessato l’attività.',
    aliases: ['Roller Coaster Corporation of America', 'RCCA'],
    relatedTermIds: ['wooden-coaster', 'gci', 'rmc'],
  },
  {
    id: 'vekoma',
    name: 'Vekoma',
    shortDefinition:
      'Produttore olandese di montagne russe, uno dei più prolifici al mondo, noto per il Boomerang e per molti coaster per famiglie e più intensi nei parchi europei.',
    definition:
      'Vekoma Rides Manufacturing è un produttore olandese di montagne russe con sede a Vlodrop, nei Paesi Bassi, uno dei produttori più prolifici al mondo per numero di installazioni totali. Fondata nel 1926 come officina meccanica, Vekoma costruisce attrazioni dal 1970. Il suo modello più diffuso è il Boomerang, uno shuttle coaster compatto con tre inversioni, concesso in licenza a basso costo e installato in parchi di tutto il mondo. Altri modelli Vekoma sono il Suspended Looping Coaster (SLC), il Giant Inverted Boomerang e il Mine Train. Dagli anni 2010 Vekoma vende una linea di «nuova generazione», con binari più fluidi, layout nuovi e nuove attrazioni per famiglie. Modelli come il Family Boomerang, il Tilt Coaster e i coaster familiari sospesi si vedono sempre più spesso nei parchi europei. Anche Disney ha commissionato a Vekoma progetti su misura per i propri resort.',
    aliases: ['Vekoma Rides'],

    relatedTermIds: ['b-and-m', 'boomerang', 'gerstlauer', 'intamin', 'single-rail-coaster'],
  },
  {
    id: 'gerstlauer',
    name: 'Gerstlauer',
    shortDefinition:
      'Produttore tedesco noto soprattutto per il modello Euro-Fighter con il suo drop oltre la verticale, nonché per spinning coaster e compatte attrazioni familiari.',
    definition:
      'Gerstlauer Amusement Rides GmbH è un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera. L’ha fondata Hubert Gerstlauer nel 1982. Il suo modello più noto è l’Euro-Fighter, un coaster compatto con catena di risalita verticale e un drop fino a 121 gradi, raggiunti da Takabisha (2011). Un Euro-Fighter sta in uno spazio ristretto e si trova quindi anche in parchi urbani e piccoli, per esempio Rage all’Adventure Island. Gerstlauer produce anche il modello Infinity Coaster, spinning coaster e lo SkyRoller, un coaster rotante in cui i passeggeri decidono da soli quando capovolgersi.',
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
      "Produttore tedesco di montagne russe i cui looping coaster degli anni '70 e '80, dalla corsa intensa e molto morbida, sono ancora in funzione in parchi europei.",
    definition:
      'Anton Schwarzkopf GmbH & Co. KG era un produttore tedesco di montagne russe con sede a Münsterhausen, in Baviera, la stessa città in cui si insediò poi Gerstlauer. L’azienda di famiglia costruiva attrazioni dal 1954, Anton Schwarzkopf la rilevò nel 1960 e contribuì a portare i looping coaster in Europa. La Revolution al Six Flags Magic Mountain (1976), progettata da Schwarzkopf, era il primo looping coaster moderno del mondo. Tra i suoi modelli ci sono il Looping Star, il Thriller/Wildcat e il Looping Coaster trasportabile, che ha girato per tutta Europa. Le montagne russe Schwarzkopf hanno corse molto morbide e layout che sfruttano bene lo spazio. L’azienda fallì nel 1983 e definitivamente nel 1992, e Gerstlauer ne rilevò i capannoni di produzione. Molte sue montagne russe sono rimaste in funzione per decenni, con la manutenzione affidata ad aziende specializzate o a Gerstlauer.',
    relatedTermIds: ['b-and-m', 'gerstlauer', 'intamin', 'vekoma'],
    aliases: ['Anton Schwarzkopf'],
  },
  {
    id: 'launch-coaster',
    name: 'Launch Coaster',
    shortDefinition:
      'Un coaster che accelera gli ospiti da 0 ad alta velocità tramite un sistema di lancio magnetico, idraulico o pneumatico invece della tradizionale catena di risalita.',
    definition:
      'Un Launch Coaster sostituisce la tradizionale catena di risalita con un sistema di propulsione che accelera rapidamente il treno da ferma all’alta velocità in pochi secondi. Le tecnologie principali sono quattro. Nel lancio LSM (motore sincrono lineare) delle bobine elettromagnetiche spingono una pinna montata sul treno. Il LIM (motore a induzione lineare) funziona in modo simile ma è meno efficiente. Il lancio idraulico usa un cavo e un pistone, e Intamin lo ha montato su coaster da record come Kingda Ka. Il quarto è il lancio ad aria compressa. Alcuni coaster hanno più lanci lungo il percorso.',
    alternateNames: ['LSM Coaster', 'LIM Coaster', 'Coaster a Lancio', 'Catapulta'],

    relatedTermIds: ['horseshoe', 'intamin', 'lifthill', 'top-hat'],
    aliases: ['Launch Coasters', 'Accelerator Coaster'],
  },
  {
    id: 'wooden-coaster',
    name: 'Ottovolante in legno',
    shortDefinition:
      'Una montagna russa costruita principalmente in legno, con il suo tipico fragore, il movimento laterale e un airtime imprevedibile.',
    definition:
      'Un ottovolante in legno è un giro costruito con binari e struttura portante in legno. Il legno, a differenza dell’acciaio, si flette: da qui vengono il fragore tipico, lo scuotimento laterale e l’airtime imprevedibile. Tra gli ottovolanti in legno ci sono Balder a Liseberg, The Beast a Kings Island e Megafobia a Oakwood. Gli ottovolanti in legno richiedono una manutenzione costante (il binario va rilaminato regolarmente) e risentono delle variazioni del tempo. Il processo di conversione RMC (Rocky Mountain Construction) può trasformare i vecchi ottovolanti in coaster ibridi con binario in acciaio mantenendo la struttura in legno.',
    relatedTermIds: ['airtime', 'cci', 'hybrid-coaster', 'ptc', 'quad-down', 'rattle', 'rmc'],
    aliases: ['Ottovolanti in legno'],
    alternateNames: ['Woodie', 'Woodies', 'Coaster in legno'],
  },
  {
    id: 'steel-coaster',
    name: 'Montagna russa in acciaio',
    shortDefinition:
      'Una montagna russa costruita principalmente con binario e struttura in acciaio, nota per la sua corsa liscia e precisa.',
    definition:
      'Una montagna russa in acciaio è costruita con binario tubolare o piatto in acciaio supportato da un’armatura in acciaio. L’acciaio non si flette come il legno, quindi i progettisti possono controllare con precisione le forze G, le transizioni e le inversioni. Con una corsa liscia e prevedibile si possono costruire layout complessi, con molte inversioni, curve strette e tratti ad alta velocità.\n\nOggi quasi tutte le nuove montagne russe sono in acciaio. In Europa ne sono esempi Shambhala a PortAventura, Nemesis ad Alton Towers e Silver Star a Europa-Park. Si va dalle piccole montagne russe per famiglie ai mega coaster da record. Un binario in acciaio va ispezionato e mantenuto regolarmente e, rispetto al legno che si flette, lascia meno margine agli errori di progettazione.',
    relatedTermIds: [
      'bobsled-coaster',
      'hyper-coaster',
      'inversion',
      'launch-coaster',
      'single-rail-coaster',
      'stand-up-coaster',
      'wooden-coaster',
    ],
    aliases: ['Montagne russe in acciaio', 'Acciaio'],
  },
  {
    id: 'suspended-coaster',
    name: 'Suspended Coaster',
    shortDefinition:
      'Un coaster in cui il treno è appeso sotto il binario a un perno e può oscillare liberamente da un lato all’altro.',
    definition:
      "Un suspended coaster è un coaster in cui il treno è appeso a un perno sotto il binario e può oscillare da un lato all’altro indipendentemente dal percorso. In curva il treno oscilla verso l’esterno come un pendolo, con un colpo di frusta laterale, e ogni giro è un po’ diverso dal precedente. Nell’inverted coaster, invece, il treno è fissato rigidamente al binario.\n\nI suspended coaster sono meno diffusi degli inverted coaster. Per via dell’oscillazione il treno si inclina molto anche in una curva moderata, e sotto i piedi dei passeggeri c’è il vuoto fino al terreno. Il Suspended Looping Coaster (SLC) di Vekoma, nato negli anni '90, nonostante il nome non lo è: è un inverted coaster su binario fisso che non oscilla, costruito in una quarantina di esemplari.",
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'vekoma'],
    aliases: ['Suspended Coasters'],
    alternateNames: ['Oscillante', 'Pendolante'],
  },
  {
    id: 'hybrid-coaster',
    name: 'Coaster ibrido',
    shortDefinition:
      'Un coaster che combina una struttura portante in legno tradizionale con un binario I-box in acciaio, sviluppato da Rocky Mountain Construction (RMC).',
    definition:
      'Un coaster ibrido abbina la struttura in legno di un coaster tradizionale con un binario I-box in acciaio prodotto da Rocky Mountain Construction (RMC). Il binario I-box è molto preciso e liscio e permette inversioni che su un binario in legno tradizionale non si possono fare. RMC ha sviluppato questa tecnologia soprattutto per rinnovare vecchi ottovolanti in legno diventati troppo bruschi, a cui aggiunge inversioni, discese più ripide e airtime hill. Tra le conversioni RMC ci sono Steel Vengeance a Cedar Point, Twisted Colossus a Six Flags Magic Mountain e Untamed a Walibi Holland (2019), nato dal coaster in legno Robin Hood. Oltre alle conversioni, RMC costruisce anche coaster ibridi nuovi, come Zadra a Energylandia.',
    aliases: ['Hybrid Coasters', 'I-Box Track', 'IBox Track', 'Topper Track'],
    alternateNames: ['RMC Hybrid', 'I-Box Coaster', 'Ottovolante ibrido'],

    relatedTermIds: ['airtime', 'rmc', 'wooden-coaster'],
  },
  {
    id: 'boomerang',
    name: 'Boomerang',
    shortDefinition:
      'Un modello di coaster compatto di Vekoma che fa percorrere ai passeggeri tre inversioni due volte, prima in avanti e poi all’indietro, su un layout a vai e vieni.',
    definition:
      'Il Boomerang di Vekoma è uno dei modelli di montagna russa più costruiti di sempre. Il layout ha tre inversioni (un Cobra Roll, che ne conta due, seguito da un looping verticale). Il treno le percorre in avanti, poi viene tirato su una seconda sezione inclinata, rilasciato e le ripercorre all’indietro. In tutto sono sei inversioni (tre per direzione) in uno spazio molto ridotto, per cui il modello va bene per parchi con poco spazio. Sono stati costruiti oltre 50 Boomerang; il modello si trova in parchi su ogni continente abitato.',
    relatedTermIds: ['cobra-roll', 'inversion', 'vertical-loop'],
  },
  {
    id: 'euro-fighter',
    name: 'Euro-Fighter',
    shortDefinition:
      'Un modello di coaster compatto di Gerstlauer: dopo una catena di risalita verticale viene una prima discesa quasi verticale o oltre la verticale.',
    definition:
      'L’Euro-Fighter è il modello di coaster compatto più noto di Gerstlauer, riconoscibile per la prima discesa verticale (90 gradi) o oltre la verticale (fino a 121 gradi) che segue una catena di risalita verticale. È pensato per parchi con poco spazio e mette in una piccola area più inversioni, curve strette e G-force alte. Prima della discesa oltre la verticale il treno si ferma in cima, con i passeggeri sporti in avanti nel vuoto. Tra gli Euro-Fighter europei ci sono Saw – The Ride a Thorpe Park, Rage ad Adventure Island e Fluch von Novgorod a Hansa-Park.',
    relatedTermIds: ['beyond-vertical-drop', 'first-drop', 'inversion', 'lifthill'],
  },
  {
    id: 'dive-coaster',
    name: 'Dive Coaster',
    shortDefinition:
      'Un tipo di coaster con un treno inusualmente largo e una discesa quasi verticale o oltre la verticale, con una pausa deliberata sulla cresta prima del tuffo.',
    definition:
      'Un Dive Coaster è caratterizzato da un treno largo (tipicamente 8–10 passeggeri per fila), una discesa quasi verticale o oltre la verticale (90+ gradi) e una pausa in cima alla discesa: il treno si ferma un momento sulla cresta prima di essere rilasciato. Con il treno largo ogni passeggero ha la vista libera dritto verso il basso. B&M ha introdotto il concetto con la linea Dive Machine (Oblivion ad Alton Towers, SheiKra a Busch Gardens). La pausa prima della discesa è voluta e serve ad aumentare la tensione.',
    relatedTermIds: [
      'b-and-m',
      'beyond-vertical-drop',
      'euro-fighter',
      'first-drop',
      'launch-coaster',
    ],
  },
  {
    id: 'vr-coaster',
    name: 'VR Coaster',
    shortDefinition:
      'Una montagna russa su cui i passeggeri indossano visori per la realtà virtuale, con un filmato animato o un gioco sincronizzato con il percorso.',
    definition:
      'Su un VR Coaster i passeggeri indossano visori VR (di solito Samsung Gear VR o dispositivi costruiti apposta) che mostrano un ambiente virtuale sincronizzato con i movimenti del coaster. Quando il treno fa un looping, anche il mondo virtuale si capovolge; quando il treno scende, il mondo virtuale precipita. Tra il 2015 e il 2019 circa molti parchi hanno aggiunto la VR a coaster esistenti. I visori però possono essere scomodi, pongono problemi di igiene e ad alcuni passeggeri provocano la cinetosi. Molti parchi che hanno introdotto la VR l’hanno poi tolta. Alcune installazioni, come i VR Coaster di Mack Rides, hanno filmati realizzati apposta per quel percorso.',
    relatedTermIds: ['dark-ride', 'height-requirement'],
  },
  {
    id: 'airtime',
    name: 'Airtime',
    shortDefinition:
      'La sensazione di assenza di peso o di essere sollevati dal sedile che si prova sulle montagne russe durante i momenti di G-force negativa.',
    definition:
      'L’Airtime è l’assenza di peso (G-force negative) che si prova su una montagna russa quando il treno passa su una collina o una valle più velocemente della caduta libera. Ci sono due tipi principali: il floater airtime (G negative lievi, si galleggia) e l’ejector airtime (G negative forti, in cui solo la barra di sicurezza o la cintura tiene il passeggero sul sedile). Nelle Airtime Hill (dette anche camelback) il binario segue la parabola della caduta libera, proprio per produrre airtime.',
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
    name: 'Inversione',
    shortDefinition:
      'Qualsiasi elemento su una montagna russa in cui il binario ruota i passeggeri a testa in giù.',
    definition:
      'Un’inversione è un elemento di una montagna russa in cui binario e veicolo ruotano i passeggeri oltre la verticale, così che siano almeno in parte a testa in giù. Le più comuni sono il looping verticale, il Cobra Roll, il Cavatappi, l’Immelmann, il Dive Loop, l’Inline Twist, l’Heartline Roll e lo Zero-g Roll. I coaster moderni hanno abitualmente da sei a quattordici inversioni in un solo layout. Il numero di inversioni è uno dei dati che si citano per descrivere l’intensità di un coaster. In un loop le G-force sono positive sul fondo e possono diventare negative in cima.',
    relatedTermIds: ['cobra-roll', 'corkscrew', 'immelmann', 'vertical-loop', 'zero-g-roll'],
    aliases: ['Inversioni'],
  },
  {
    id: 'vertical-loop',
    name: 'Looping',
    shortDefinition:
      'La classica inversione circolare: il binario forma un cerchio verticale completo e in cima i passeggeri sono del tutto a testa in giù.',
    definition:
      'Il looping verticale è un cerchio completo di 360 gradi nel piano verticale. I looping moderni hanno una forma a clotoide (a goccia) invece di un cerchio perfetto: l’entrata e l’uscita sono ampie, mentre la sommità del loop è stretta. Con questa forma le G-force crescono e calano gradualmente, senza picchi estremi. Il primo coaster moderno con looping fu Revolution (Six Flags Magic Mountain, 1976), costruito da Schwarzkopf. Oggi il looping verticale si trova su coaster di ogni dimensione, dalle prime montagne russe con inversioni a quelle da record.',
    aliases: ['Loopings'],
    alternateNames: ['Anello Verticale', 'Vertical Loop', 'Loop'],

    relatedTermIds: ['cobra-roll', 'immelmann', 'inclined-loop', 'interlocking-loops', 'inversion'],
  },
  {
    id: 'immelmann',
    name: 'Immelmann',
    shortDefinition:
      'Un mezzo looping che spinge il treno verso l’alto e oltre la sommità, seguito da un mezzo rollio che esce in direzione opposta. Prende il nome dal pilota della Prima guerra mondiale Max Immelmann.',
    definition:
      'La virata Immelmann è un’inversione tipica di B&M, in due fasi. Il binario sale in un mezzo looping verticale, e in cima i passeggeri sono per un attimo a testa in giù; poi un mezzo rollio raddrizza il treno, che esce girato di 180 gradi, nella direzione opposta a quella di entrata. L’elemento prende il nome dall’asso dell’aviazione della Prima guerra mondiale Max Immelmann, che usava una manovra aerea simile. Si trovano su quasi ogni coaster B&M sit-down e invertito in tutto il mondo.',
    relatedTermIds: ['b-and-m', 'dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'zero-g-roll',
    name: 'Zero-G Roll',
    shortDefinition:
      'Un rollio di 360 gradi lungo un arco parabolico; in cima i passeggeri sono quasi senza peso.',
    definition:
      'Lo Zero-g Roll (rollio a gravità zero) è un’inversione in cui il treno ruota seguendo un arco parabolico. È simile a un Heartline Roll, ma più veloce e con un dislivello maggiore. In cima al rollio i passeggeri sono a testa in giù e per un momento con G-force negative (airtime). Gli Zero-g Roll si trovano soprattutto sugli inverted, sui wing coaster e sugli hyper coaster di B&M; sui wing coaster i passeggeri dei sedili laterali ruotano nel vuoto.',
    relatedTermIds: ['airtime', 'b-and-m', 'heartline-roll', 'inversion', 'zero-g-winder'],
  },
  {
    id: 'lifthill',
    name: 'Lifthill',
    shortDefinition:
      'La salita azionata da un motore che porta il treno del coaster al punto più alto e gli dà l’energia potenziale per il resto del percorso.',
    definition:
      'Il Lifthill è il tratto in cui un meccanismo esterno tira il treno del coaster dal livello del suolo fino al punto più alto del giro. Il meccanismo più comune è una catena che scorre al centro del binario; il «clic-clic-clic» che si sente in salita è il cricchetto anti-rollback. In alternativa ci sono i lift a cavo (più fluidi e silenziosi), i lift a ruote pneumatiche (usati su alcuni coaster B&M recenti) e la propulsione magnetica. L’altezza del Lifthill determina la velocità massima che il coaster può raggiungere. Alcuni coaster moderni hanno più Lifthill o combinano una salita con tratti lanciati. Il Lifthill è di solito il tratto più lento del giro.',
    aliases: ['Lift Hill'],
    alternateNames: ['Chain Lift', 'Catena di risalita'],

    relatedTermIds: ['block-brake', 'first-drop', 'launch-coaster'],
  },
  {
    id: 'first-drop',
    name: 'First Drop',
    shortDefinition:
      'La prima discesa dopo il Lifthill, di solito la più alta e la più veloce del giro.',
    definition:
      'Il First Drop è la discesa principale immediatamente successiva al Lifthill o al segmento di lancio. Sulla maggior parte dei coaster tradizionali è la collina più alta e produce la velocità massima del coaster. Angolo, altezza e profilo della discesa cambiano molto il giro: una discesa ripida (oltre 80–90 gradi) dà un’accelerazione forte, mentre una discesa parabolica può dare molto airtime anche con un angolo più dolce. Nei Dive Coaster la discesa supera i 90 gradi (oltre la verticale) e i passeggeri restano sporti sul bordo prima di scendere. Il First Drop è la parte di un nuovo coaster che si filma più spesso per i video promozionali.',
    relatedTermIds: ['airtime', 'airtime-hill', 'beyond-vertical-drop', 'dive-coaster', 'lifthill'],
  },
  {
    id: 'airtime-hill',
    name: 'Airtime Hill',
    shortDefinition:
      'Un elemento a forma di collina progettato per generare G-force negative: i passeggeri si sentono senza peso o si sollevano dal sedile.',
    definition:
      'Un’Airtime Hill (detta anche camelback) è un elemento su e giù progettato per produrre G-force negative, per cui il passeggero galleggia o viene sollevato dal sedile. Il floater airtime è una G negativa dolce; l’ejector airtime è forte, e solo la barra di sicurezza tiene il passeggero sul sedile. I coaster in acciaio hanno colline paraboliche precise, con un airtime costante e prevedibile; sui coaster in legno il binario si flette e l’airtime è più irregolare e brusco. Le Airtime Hill si trovano soprattutto sugli hyper coaster, sui giga coaster e sui moderni ottovolanti in legno.',
    aliases: ['Colline di airtime'],
    alternateNames: ['Camelback', 'Bunny Hill'],

    relatedTermIds: ['airtime', 'bunnyhop', 'first-drop', 's-hill', 'stengel-dive'],
  },
  {
    id: 'helix',
    name: 'Helix',
    shortDefinition:
      'Una sezione continua a spirale in cui il binario si avvolge attorno a un asse centrale, generando G-force laterali sostenute.',
    definition:
      'Un’elica è un tratto di binario che gira a spirale, come una vite, senza capovolgere i passeggeri. A differenza delle Airtime Hill o delle inversioni, le eliche producono G-force laterali prolungate che spingono i passeggeri verso l’esterno della curva. Un’elica in discesa accelera il treno mentre gira; un’elica in salita lo rallenta, ma le forze laterali restano. Spesso le eliche stanno alla fine del layout, per smaltire l’energia cinetica rimasta al treno. Ne sono esempi il finale sotterraneo di Nemesis ad Alton Towers e l’elica finale di Expedition GeForce a Holiday Park.',
    aliases: ['Helices'],
    alternateNames: ['Spirale', 'Curva elicoidale'],

    relatedTermIds: ['first-drop', 'horseshoe'],
  },
  {
    id: 'block-brake',
    name: 'Block Brake',
    shortDefinition:
      'Una sezione di frenata che divide il circuito in segmenti indipendenti, così che più treni possano girare insieme senza rischio di collisione.',
    definition:
      'Un Block Brake divide il circuito di un coaster in sezioni separate («blocchi»), in ognuna delle quali può esserci un solo treno. Se un treno davanti rallenta o si ferma, il sistema di controllo ferma automaticamente i treni che seguono sui rispettivi Block Brake. Così il parco può far girare più treni insieme senza rischio di collisione, e la capacità oraria cresce di molto. I Block Brake stanno in punti in cui un treno fermo non torna indietro (di solito un tratto piano o in leggera salita) e usano freni magnetici (a correnti parassite) o a pattino. Il Mid-Course Brake Run (MCBR) è il tipo di Block Brake più visibile.',
    relatedTermIds: ['brake-run', 'ride-capacity', 'stacking'],
  },
  {
    id: 'brake-run',
    name: 'Brake Run',
    shortDefinition:
      'La sezione di decelerazione alla fine del giro in cui il treno viene rallentato alla velocità della stazione, di solito con freni magnetici a pattino.',
    definition:
      'Il Brake Run è la sezione di binario che segue il layout principale in cui il treno del coaster decelera dalla velocità di giro a una velocità di avvicinamento sicura alla stazione. I Brake Run moderni usano freni a correnti di Foucault (magnetici): file di magneti permanenti agiscono sulle pinne metalliche sotto il treno e lo frenano senza attrito né usura. I coaster più vecchi usavano freni pneumatici a pinza. Un Mid-Course Brake Run (MCBR) a metà del layout fa da sezione di blocco quando girano più treni. A volte il Brake Run finale frena di proposito poco, e il treno arriva in stazione un po’ più veloce.',
    relatedTermIds: ['block-brake', 'lifthill'],
  },
  {
    id: 'cobra-roll',
    name: 'Cobra Roll',
    shortDefinition:
      'Una doppia inversione tipica di B&M, a forma di testa di cobra sollevata: due inversioni collegate da una torsione in cima.',
    definition:
      'Il Cobra Roll è un elemento tipico di B&M, fatto di due inversioni in rapida successione: il binario sale in un mezzo looping, ruota di 180 gradi in cima (con un breve tratto a testa in giù), poi ripete la sequenza a specchio ed esce tornando verso il lato da cui è entrato. Visto di lato, il profilo del binario assomiglia alla testa sollevata e allargata di un cobra. Ci sono Cobra Roll su Dragon Khan a PortAventura e su molti inverted coaster B&M in tutto il mondo.',
    relatedTermIds: ['b-and-m', 'banana-roll', 'batwing', 'immelmann', 'inversion', 'sea-serpent'],
  },
  {
    id: 'corkscrew',
    name: 'Corkscrew',
    shortDefinition:
      'Un’inversione a rollio in cui il binario gira a spirale di 360 gradi attorno a un asse centrale. È uno dei primi tipi di inversione e uno dei più diffusi.',
    definition:
      "Il Cavatappi (Corkscrew) è una delle prime inversioni moderne, introdotto da Arrow Dynamics negli anni '70. Il binario si avvolge attorno a un cilindro immaginario come un cavatappi, e i passeggeri fanno un rollio completo di 360 gradi spostato di lato rispetto alla direzione di marcia. Spesso i Cavatappi sono in coppia, uno dopo l’altro, ed erano l’elemento tipico dei primi coaster in acciaio. Nelle mappe e nella segnaletica dei parchi tedeschi si usa la parola tedesca «Korkenzieher». I layout più recenti usano soprattutto altre inversioni, ma il Cavatappi si trova ancora in molti parchi in Europa e in Nord America.",
    relatedTermIds: ['flat-spin', 'inline-twist', 'inversion'],
  },
  {
    id: 'dive-loop',
    name: 'Dive Loop',
    shortDefinition:
      'L’immagine speculare di un Immelmann: il binario si tuffa ripidamente verso il basso in un mezzo looping ed esce in orizzontale, nella direzione opposta a quella di entrata.',
    definition:
      'Un Dive Loop (detto anche dive turn o Immelmann inverso) inizia dove l’Immelmann finisce: invece di salire e scavalcare, il binario si tuffa ripidamente verso il basso, curvando attraverso la metà inferiore di un looping prima di uscire nella direzione opposta all’entrata. Dopo il tuffo, in fondo al mezzo looping, le G-force positive sono forti. I Dive Loop sono tipici di B&M e compaiono su molti suoi coaster invertiti e sit-down.',
    relatedTermIds: ['b-and-m', 'immelmann', 'inversion'],
  },
  {
    id: 'inline-twist',
    name: 'Inline Twist',
    shortDefinition:
      'Un rollio di 360 gradi attorno all’asse del binario: un’inversione fluida in cui il treno mantiene quasi la stessa direzione.',
    definition:
      'Un Inline Twist (detto anche inline roll o barrel roll) ruota il treno di 360 gradi attorno all’asse longitudinale del binario, quasi senza cambiare direzione. A differenza di un Cavatappi (che ha una spirale sfalsata rispetto al centro del binario), l’Inline Twist ruota esattamente attorno al binario. Il risultato è un’inversione breve e fluida, con forze laterali minime, in cui si resta a testa in giù solo per un momento. Gli Inline Twist sono comuni sui flying coaster e sui coaster invertiti B&M, spesso in coppia o subito prima o dopo altri elementi.',
    relatedTermIds: ['corkscrew', 'flat-spin', 'heartline-roll', 'inversion'],
  },
  {
    id: 'heartline-roll',
    name: 'Heartline Roll',
    shortDefinition:
      'Un rollio di 360 gradi attorno al baricentro del passeggero invece che attorno al binario, progettato perché il passeggero resti quasi senza peso per tutta la rotazione.',
    definition:
      'Un Heartline Roll (o heartline spin) è progettato in modo che il cuore del passeggero, cioè all’incirca il baricentro del corpo, resti alla stessa altezza per tutta la rotazione, mentre il binario gli gira attorno. Così le G-force durante il rollio restano minime e il passeggero galleggia, senza lo strattone di un Cavatappi standard. Gli Heartline Roll si trovano sui coaster moderni di B&M e Intamin, soprattutto hyper coaster e coaster invertiti. Il binario va calcolato con precisione, perché anche piccole deviazioni rendono il rollio scomodo.',
    relatedTermIds: ['inline-twist', 'inversion', 'zero-g-roll'],
  },
  {
    id: 'sidewinder',
    name: 'Sidewinder',
    shortDefinition:
      'Un mezzo looping combinato con un mezzo cavatappi che ruota il binario di 90 gradi e cambia direzione.',
    definition:
      'Un Sidewinder è un mezzo looping verticale che porta il treno verso l’alto, seguito subito da un mezzo cavatappi che lo raddrizza e lo gira di 90 gradi. In poco spazio il treno si capovolge e cambia direzione. Storm Runner a Hersheypark (Intamin, 2004) ne ha uno, che il parco chiama cobra loop. Il nome viene dal movimento a serpente che si vede guardando l’elemento da terra.',
    relatedTermIds: ['cobra-roll', 'inversion'],
  },
  {
    id: 'pretzel-loop',
    name: 'Pretzel Loop',
    shortDefinition:
      'Una grande inversione che esiste solo sui flying coaster B&M, in cui i passeggeri, già in posizione Superman, passano a testa in giù per il punto più basso di un looping verticale.',
    definition:
      'Il Pretzel Loop è un’inversione che si trova solo sui flying coaster B&M (dove i passeggeri stanno sdraiati in orizzontale, in posizione Superman). I passeggeri, a testa in giù, scendono in picchiata fino al fondo di un grande looping e poi risalgono ripidamente. Visto di lato, l’elemento ha la forma di un pretzel. In fondo al looping, con i passeggeri a faccia in giù, le G-force sono molto alte. Manta a SeaWorld Orlando e Tatsu a Six Flags Magic Mountain hanno un Pretzel Loop.',
    relatedTermIds: ['b-and-m', 'inline-twist', 'inversion'],
  },
  {
    id: 'batwing',
    name: 'Batwing',
    shortDefinition:
      'Una doppia inversione che gira il treno di 180 gradi: due mezzi looping collegati da un mezzo cavatappi, a forma di ali di pipistrello spiegate.',
    definition:
      'Un Batwing è formato da due inversioni e cambia la direzione di marcia: il binario sale in un mezzo looping, in cima un mezzo cavatappi capovolge il treno e lo fa girare, poi un secondo mezzo looping, speculare al primo, lo riporta a terra. Vista dall’alto, la forma ricorda ali di pipistrello spiegate. I Batwing sono tipici di B&M e si trovano su coaster come Afterburn a Carowinds e The Incredible Hulk Coaster agli Universal Islands of Adventure. A differenza del Bowtie, che mantiene la direzione, il Batwing gira il treno di 180 gradi.',
    relatedTermIds: ['b-and-m', 'bowtie', 'cobra-roll', 'inversion'],
  },
  {
    id: 'norwegian-loop',
    name: 'Norwegian Loop',
    shortDefinition:
      'Un looping percorso al contrario: il treno entra dall’alto, scende lungo il cerchio ed esce di nuovo in cima.',
    definition:
      'Il Norwegian loop è un elemento con due inversioni che ha la forma di un grande looping in cui si entra dall’alto: un dive loop seguito subito da un Immelmann. Il treno sale e si avvita in un mezzo looping che lo manda in picchiata verso il suolo, passa per il fondo e risale in un secondo mezzo looping che lo fa uscire in cima, di nuovo nella direzione in cui viaggiava all’inizio. Visti di lato, i due elementi sembrano un unico looping con entrata e uscita in alto, dove un looping normale le ha in basso.\n\nL’elemento è comparso per la prima volta su SpeedMonster a TusenFryd, vicino a Oslo (Intamin, 2006), da cui prende il nome. Lì il looping avvolge la scala mobile che porta i visitatori su nel parco, così gli ospiti ci passano attraverso prima ancora di essere saliti su un’attrazione. I Norwegian loop restano rari.',
    relatedTermIds: ['dive-loop', 'inversion', 'vertical-loop'],
  },
  {
    id: 'flat-spin',
    name: 'Flat Spin',
    shortDefinition:
      'Un elemento a cavatappi su coaster invertiti o flying in cui la rotazione avviene su un piano quasi orizzontale, lungo un cerchio ampio e basso.',
    definition:
      'Un Flat Spin è un’inversione di tipo cavatappi presente principalmente sui coaster invertiti e flying B&M, in cui la spirale, vista da terra, è quasi orizzontale. Su un coaster invertito, con il treno appeso sotto il binario, i passeggeri girano lungo un cerchio ampio e quasi in piano. La rotazione è fluida e lunga, con G-force moderate. Ci sono Flat Spin su coaster invertiti B&M come Banshee a Kings Island e Afterburn a Carowinds.',
    relatedTermIds: ['b-and-m', 'corkscrew', 'inline-twist', 'inversion'],
  },
  {
    id: 'cutback',
    name: 'Cutback',
    shortDefinition:
      'Un mezzo cavatappi in cui il treno si capovolge e intanto gira di circa 180 gradi.',
    definition:
      'Un Cutback è un elemento in cui il binario fa un mezzo cavatappi mentre curva su se stesso di circa 180 gradi. Il treno si capovolge e torna indietro; un cavatappi standard, invece, mantiene più o meno la direzione di marcia. I Cutback sono poco comuni e si trovano su alcuni modelli Vekoma e su coaster su misura che devono invertire la direzione in poco spazio. Il nome «cutback» viene dalla forma: capovolgendosi, il binario torna indietro sulla propria direzione.',
    relatedTermIds: ['corkscrew', 'inversion', 'sidewinder'],
  },
  {
    id: 'butterfly',
    name: 'Butterfly',
    shortDefinition:
      'Una variante del sea-serpent con il tratto di collegamento più basso: due inversioni di fila, senza cambiare direzione, in poco spazio.',
    definition:
      'Il Butterfly è un elemento a doppia inversione simile a un sea-serpent (due mezzi looping collegati in cima) ma con un apice più basso e una geometria distinta. Come il sea-serpent, produce due inversioni senza cambiare la direzione del treno, ma il pezzo di collegamento tra i due mezzi looping passa attraverso una sezione invertita più bassa piuttosto che una cresta alta. Per questo il Butterfly è meno alto. Si trova su alcuni modelli Vekoma e su coaster su misura. Anche il Bowtie non cambia direzione, ma ha un’altra geometria; il Batwing invece cambia direzione.',
    relatedTermIds: ['batwing', 'bowtie', 'inversion'],
  },
  {
    id: 'bowtie',
    name: 'Bowtie',
    shortDefinition:
      'Un elemento a doppia inversione: due mezzi looping speculari che nel binario disegnano un papillon. Il treno non cambia direzione.',
    definition:
      'Un Bowtie è un elemento a doppia inversione composto da due mezzi looping speculari collegati al loro picco. A differenza di un Batwing (che inverte la direzione), il Bowtie esce nella stessa direzione generale in cui è entrato. Visto dall’alto, il profilo del binario ricorda un papillon. Le due inversioni arrivano in rapida successione. I Bowtie sono rari e si trovano soprattutto su alcuni Vekoma e su coaster costruiti su misura.',
    relatedTermIds: ['batwing', 'butterfly', 'inversion'],
  },
  {
    id: 'bunnyhop',
    name: 'Bunnyhop',
    shortDefinition:
      'Una serie di piccole, rapide Airtime Hill vicino alla fine del giro che producono un dolce floater airtime mentre il treno perde velocità.',
    definition:
      'Un Bunnyhop è una serie di piccole colline rapide posizionate verso la fine del layout di un coaster quando il treno ha perso la maggior parte della sua energia cinetica. A velocità ridotta le colline danno un floater airtime leggero e ritmico, più dolce dell’ejector airtime delle colline più veloci all’inizio del layout. Il nome inglese viene dai saltelli di un coniglio. I Bunnyhop chiudono spesso il percorso di hyper coaster, giga coaster e coaster in legno, subito prima del Brake Run.',
    relatedTermIds: ['airtime', 'airtime-hill', 'brake-run', 's-hill'],
  },
  {
    id: 'stengel-dive',
    name: 'Stengel Dive',
    shortDefinition:
      'Un’Airtime Hill inclinata oltre i 90 gradi: i passeggeri sono spinti di lato e intanto sentono G-force negative. Porta il nome dell’ingegnere Werner Stengel e si trova sui coaster di Mack Rides.',
    definition:
      'Lo Stengel Dive è un elemento di airtime in cui il binario si inclina oltre i 90 gradi (oltre la verticale) in modo che i passeggeri siano appesi di lato o leggermente capovolti mentre il profilo della collina li solleva dal sedile con G-force negative. L’elemento porta il nome di Werner Stengel, l’ingegnere tedesco che ha calcolato la geometria di moltissime montagne russe. Il primo coaster ad averne uno è stato Goliath a Walibi Holland (Intamin, 2002). Gli Stengel Dive sono frequenti sui coaster di Mack Rides, per esempio sul Blue Fire Megacoaster a Europa-Park (2009).',
    relatedTermIds: ['airtime', 'airtime-hill', 'mack-rides'],
  },
  {
    id: 'horseshoe',
    name: 'Horseshoe',
    shortDefinition:
      'Una curva di 180 gradi molto inclinata, a forma di ferro di cavallo, che rimanda il treno nella direzione opposta. Si usa spesso per girare il treno tra due tratti di lancio.',
    definition:
      'Un Horseshoe è una curva a semicerchio molto inclinata (di solito da 75 a 90 gradi) che gira il coaster di 180 gradi. L’inclinazione forte evita G-force laterali eccessive nel raggio stretto. Nei launched coaster l’Horseshoe serve spesso a far fare al treno un’inversione a U tra un lancio e il successivo. Si trova sugli accelerator coaster di Intamin e sui multi-launch coaster di Mack. Gira il treno in poco spazio senza fargli perdere molta velocità.',
    relatedTermIds: ['intamin', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'predrop',
    name: 'Predrop',
    shortDefinition:
      'Un piccolo avvallamento appena prima della discesa principale su un coaster a catena, che riduce la tensione sulla catena e dà un breve momento di airtime prima della discesa.',
    definition:
      'Un Predrop è una piccola collina o avvallamento posizionato sull’ultimo tratto della catena di risalita, appena prima della cresta che porta alla discesa principale. Serve anzitutto a ridurre la tensione sulla catena mentre il treno supera la cresta, così il passaggio dalla salita a motore alla discesa libera non è brusco. Sul Predrop il passeggero ha anche un breve momento di airtime prima della discesa principale. Oggi ci sono Predrop sia sui coaster in legno sia su quelli in acciaio, per esempio su Goliath a Six Flags Magic Mountain.',
    relatedTermIds: ['airtime', 'first-drop', 'lifthill'],
  },
  {
    id: 'top-hat',
    name: 'Top Hat',
    shortDefinition:
      'Un elemento alto e stretto, con salita e discesa quasi verticali, a forma di cappello a cilindro. Si trova sui coaster Intamin a lancio idraulico.',
    definition:
      'Un Top Hat è un elemento in cui il binario sale quasi in verticale fino a una cresta stretta e poi scende quasi in verticale dall’altro lato. Visto di lato, il profilo ricorda un cappello a cilindro. Nei Top Hat interni (quelli standard) il binario in cima ruota verso l’interno; in quelli esterni ruota verso l’esterno, e in cima c’è più airtime. Il Top Hat è tipico dei launched coaster idraulici di Intamin (accelerator coaster), dove arriva subito dopo il lancio a 200 km/h o più. Kingda Ka (139 m, chiuso nel 2024) ne aveva uno. Ce l’hanno anche Top Thrill Dragster (128 m), diventato Top Thrill 2 nel 2024 con un lancio LSM, e Red Force a Ferrari Land, anch’esso lanciato con LSM.',
    relatedTermIds: ['first-drop', 'intamin', 'launch-coaster'],
  },
  {
    id: 'credit',
    name: 'Credit',
    shortDefinition:
      'Una montagna russa che un appassionato ha percorso e aggiunto al proprio conteggio personale.',
    definition:
      'Un coaster credit (o semplicemente «credit» o «cred») è una montagna russa che un appassionato ha percorso e aggiunto al proprio conteggio personale. «Collezionare credit» vuol dire salire sul maggior numero possibile di coaster diversi. Le regole su cosa conta come credit variano: alcuni appassionati contano solo i coaster sit-down, altri tutti i giri su rotaia; per alcuni ogni tipo di treno su uno stesso coaster vale un credit a parte, per altri no. Siti di tracciamento come il Roller Coaster Database (RCDB) permettono di registrare il proprio conteggio. Per aggiungere credit molti appassionati viaggiano all’estero e visitano parchi poco conosciuti.',
    aliases: ['Credits'],
    alternateNames: ['Cred', 'Creds'],

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
      'Riprese in soggettiva dalla prima fila di una montagna russa, con cui si vede il percorso prima di salire.',
    definition:
      'POV (Point of View) indica un video girato durante il giro dal punto di vista di un passeggero in prima fila, di solito con una telecamera fissata al treno. Molti visitatori guardano un POV per vedere un coaster prima di andare al parco. I parchi a volte producono POV ufficiali per la promozione; più spesso li girano ospiti o giornalisti. Su YouTube ci sono decine di migliaia di video POV di coaster. Il termine vale anche per qualsiasi ripresa in soggettiva di un’attrazione.',
    alternateNames: ['Point of View', 'On-Ride Video', 'Video in cabina'],

    relatedTermIds: ['credit', 'dark-ride', 'onride-offride'],
  },
  {
    id: 'stacking',
    name: 'Stacking',
    shortDefinition:
      'Quando più treni arrivano al Brake Run prima che la stazione sia libera e devono aspettare uno dietro l’altro. Riduce la capacità e allunga i tempi di attesa.',
    definition:
      'Lo Stacking succede quando carico e scarico in stazione durano più del giro stesso: i treni si accumulano sul Brake Run e aspettano che la stazione si liberi. L’operatore deve trattenerli lì, e tra un treno e l’altro l’attrazione può restare ferma per qualche istante. Lo Stacking riduce direttamente la capacità e allunga i tempi di attesa in coda. Le cause più comuni sono un carico lento (spesso per sistemi di ritenuta complicati), molti controlli sui bagagli o poco personale. Dalla fila si vede se un coaster sta facendo Stacking, e chi aspetta può tenerne conto.',
    alternateNames: ['Accumulo di treni'],

    relatedTermIds: ['block-brake', 'ride-capacity', 'wait-time'],
  },
  {
    id: 'inverted-coaster',
    name: 'Inverted Coaster',
    shortDefinition:
      'Tipo di montagna russa in cui il treno è sospeso sotto la rotaia e i piedi dei passeggeri penzolano liberamente.',
    definition:
      'Un Inverted Coaster è una montagna russa in cui il treno è fissato rigidamente sotto la rotaia, con i passeggeri seduti a gambe penzolanti. A differenza di un suspended coaster (che oscilla lateralmente), il treno di un Inverted Coaster non si muove di lato. B&M ha sviluppato il modello moderno nel 1992 con Batman The Ride. Sugli Inverted Coaster ci sono spesso near-miss, zero-g roll e cobra roll. Esempi europei: Nemesis (Alton Towers), Katun (Mirabilandia) e Oziris (Parc Astérix).',
    alternateNames: ['Inverted', 'Invert', 'Montagna Russa Invertita'],

    relatedTermIds: ['b-and-m', 'inversion', 'wing-coaster'],
  },
  {
    id: 'wing-coaster',
    name: 'Wing Coaster',
    shortDefinition:
      'Tipo di coaster con i sedili ai due lati della rotaia, senza niente sopra, sotto o accanto ai passeggeri.',
    definition:
      'Un Wing Coaster (o Wing Rider) dispone due sedili per lato lungo la rotaia, lasciando i passeggeri senza alcuna struttura sopra, sotto o ai lati. Il treno passa spesso vicinissimo a edifici e scenografie (near-miss). B&M è il principale produttore di Wing Coaster. Esempi europei: Flug der Dämonen a Heide-Park e The Swarm a Thorpe Park.',
    alternateNames: ['Wing Rider', 'Coaster ad ala'],

    relatedTermIds: ['b-and-m', 'dive-coaster', 'inverted-coaster'],
  },
  {
    id: 'spinning-coaster',
    name: 'Spinning Coaster',
    shortDefinition:
      'Montagna russa con vagoni che ruotano liberamente su un asse verticale, per cui ogni giro è un po’ diverso.',
    definition:
      'Uno Spinning Coaster è dotato di vagoni montati su una piattaforma rotante che gira liberamente attorno a un asse verticale. La rotazione non è controllata, quindi ogni vagone fa il percorso in una sequenza diversa, ora in avanti, ora all’indietro, ora di lato. Mack Rides (Waldkirch, Germania) e Gerstlauer sono i principali produttori. Molti Spinning Coaster sono pensati per le famiglie, con un’altezza minima più bassa di quella dei coaster più impegnativi.',
    alternateNames: ['Spinner', 'Ottovolante rotante'],

    relatedTermIds: ['credit', 'launch-coaster', 'mack-rides'],
  },
  {
    id: 'xtreme-spinning-coaster',
    name: 'Xtreme Spinning Coaster',
    shortDefinition:
      'Il modello di spinning coaster più intenso di Mack Rides: più veloce e più alto dei modelli standard, con una rotazione più marcata.',
    definition:
      'L’Xtreme Spinning Coaster (XSC) è il più grande degli spinning coaster di Mack Rides. Il primo è stato Time Traveler a Silver Dollar City (2018), poi è arrivato The Ride to Happiness a Plopsaland (2021). Uno spinning coaster standard è pensato per le famiglie; lo XSC ha una struttura più alta, discese più ripide, velocità massime più alte e una rotazione tarata per girare di più: i vagoni ruotano più forte e più spesso in ogni elemento del percorso.\n\nCon il ritmo più alto il vagone cambia orientamento più in fretta, e due giri non sono mai uguali. Per intensità lo XSC sta tra gli spinning coaster per famiglie e i coaster più estremi.',
    alternateNames: ['XSC'],
    relatedTermIds: ['credit', 'mack-rides', 'spinning-coaster'],
  },
  {
    id: 'hyper-coaster',
    name: 'Hyper Coaster',
    shortDefinition:
      'Montagna russa che supera i 61 m di altezza, tipicamente senza inversioni e incentrata su velocità e airtime.',
    definition:
      'Hyper Coaster è la classificazione per le montagne russe tra 61 e 91 m di altezza. B&M chiama i propri modelli «Hyper Coaster»; Intamin usa il termine «Mega Coaster» per il tipo equivalente. Entrambi puntano su grandi colline di airtime ad alta velocità più che sulle inversioni. Shambhala a PortAventura (76 m) e Hyperion a Energylandia (77 m) sono gli Hyper Coaster più alti d’Europa. Un altro esempio è Mako a SeaWorld Orlando.',
    alternateNames: ['Mega Coaster', 'Mega Montagna Russa', 'Ipercoaster'],

    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'giga-coaster', 'intamin'],
    aliases: ['Mega Coaster', 'Mega-Coaster'],
  },
  {
    id: 'giga-coaster',
    name: 'Giga Coaster',
    shortDefinition: 'Montagna russa più alta di 91 m, la categoria sopra l’Hyper Coaster.',
    definition:
      'Giga Coaster è la classificazione per le montagne russe tra 91 e 121 m di altezza. Il termine è stato coniato da Cedar Fair e Intamin per Millennium Force a Cedar Point nel 2000. I Giga Coaster hanno layout lunghi e grandi colline di airtime. Un esempio è Fury 325 a Carowinds. In Europa ce n’è uno solo: Red Force a Ferrari Land (PortAventura World, Spagna), aperto nel 2017 e alto 112 m. Hyperion a Energylandia (Polonia) arriva a 77 m e resta un Hyper Coaster.',
    alternateNames: ['Gigacoaster'],

    relatedTermIds: ['airtime', 'first-drop', 'hyper-coaster'],
  },
  {
    id: 'overbank',
    name: 'Overbanked Turn',
    shortDefinition:
      'Curva con inclinazione superiore a 90°, che inclina brevemente i passeggeri oltre la verticale.',
    definition:
      'Un Overbanked Turn è una curva in cui l’inclinazione del binario supera i 90 gradi: per un momento i passeggeri sono inclinati oltre la verticale, ma senza compiere un’inversione. Al massimo dell’inclinazione si sentono G laterali e lievi G negative. Le curve overbanked si trovano spesso sugli Hyper Coaster di B&M e sui Mega Coaster di Intamin, e su quasi tutti i layout RMC.',
    alternateNames: ['Curva sopraelevata', 'Curva inclinata'],

    relatedTermIds: ['airtime', 'b-and-m', 'intamin', 'inversion', 'rmc'],
  },
  {
    id: 'trim-brake',
    name: 'Trim Brake',
    shortDefinition:
      'Freno magnetico a metà percorso che riduce la velocità del treno senza fermarlo completamente.',
    definition:
      'Un Trim Brake è un freno a metà percorso di una montagna russa che riduce la velocità del treno senza fermarlo, a differenza di un block brake. I trim brake servono a limitare le G-force, a ridurre l’usura del binario o a rispettare requisiti di sicurezza. Se il treno viene frenato prima di un’airtime hill, l’airtime su quella collina è più debole. Quanto frena un trim brake può cambiare con la stagione, il tempo e il carico del treno.',
    relatedTermIds: ['airtime', 'block-brake', 'brake-run'],
  },
  {
    id: 'rollback',
    name: 'Rollback',
    shortDefinition:
      'Quando un launch coaster non raggiunge la cima del circuito e rotola indietro sul binario di lancio.',
    definition:
      'Si ha un rollback quando un coaster lanciato non ha abbastanza velocità per superare il punto più alto del percorso e torna indietro per gravità fino al tratto di lancio. Nei launch coaster idraulici (Top Thrill Dragster prima di diventare Top Thrill 2 nel 2024, Stealth) succede quando il lancio non dà tutta la potenza. Il treno torna indietro lentamente e viene fermato da freni magnetici nel punto più basso. I rollback sono rari, ma sui launch coaster idraulici capitano. I passeggeri non corrono alcun rischio.',
    relatedTermIds: ['block-brake', 'downtime', 'launch-coaster'],
  },
  {
    id: 'animatronics',
    name: 'Animatronica',
    shortDefinition:
      'Personaggi robotici utilizzati nei dark ride e negli spettacoli per creare scene realistiche.',
    definition:
      'L’animatronica (animatronics) indica figure robotiche elettromeccaniche utilizzate nelle attrazioni e negli spettacoli dei parchi a tema per rappresentare personaggi o creature in modo realistico. I primi «Audio-Animatronics» di Disney mostrati al pubblico sono quelli dell’Enchanted Tiki Room, aperta a Disneyland nel giugno 1963. Le animatroniche moderne vanno da semplici figure che ripetono lo stesso movimento a robot con espressioni facciali complesse e movimenti di tutto il corpo. Esempi: lo sciamano Na’vi in Pandora (Walt Disney World) e i dinosauri dell’attrazione Jurassic World (Universal).',
    aliases: ['Animatronics'],
    alternateNames: ['Audio-Animatronics', 'Figura robotica'],

    relatedTermIds: ['dark-ride', 'themed-land', 'trackless-ride'],
  },
  {
    id: 'ai-forecast',
    name: 'Previsione IA',
    shortDefinition:
      'Previsioni di affluenza e tempi di attesa fatte con il machine learning, fin dove un parco ha pubblicato il proprio calendario.',
    definition:
      'Su park.fan una previsione IA è una previsione di Fancast, il modello di machine learning che park.fan addestra con le proprie misurazioni. Per ogni attrazione e ogni ora di un giorno futuro prevede l’attesa, e da queste ricava il livello di affluenza della giornata.\n\nI dati di addestramento sono i tempi di attesa che park.fan ha registrato in più di 200 parchi. Oltre a questo storico il modello tiene conto delle previsioni meteo, delle vacanze scolastiche, dei giorni festivi e dei ponti, e degli eventi del parco, come le serate di Halloween o il giorno di apertura della stagione. Viene riaddestrato ogni giorno alle 06:00 UTC con le attese del giorno prima.\n\nL’orizzonte è il calendario del parco. Un parco aperto tutto l’anno ha previsioni per giorni lontani quasi un anno; un parco stagionale le ha fino alla fine della stagione pubblicata. Ogni previsione viene poi confrontata con le attese misurate davvero, e l’errore che ne risulta è pubblicato su park.fan e mostrato per ogni attrazione come badge di precisione.',
    aliases: ['AI Forecast', 'AI Forecasts'],

    relatedTermIds: ['crowd-calendar', 'crowd-level', 'peak-day'],
  },
  {
    id: 'opening-hours',
    name: 'Orari di apertura',
    shortDefinition:
      'Il calendario ufficiale che indica a che ora un parco a tema o un’attrazione apre e chiude.',
    definition:
      'Gli orari di apertura indicano quando un parco comincia a far entrare gli ospiti e quando chiude per la giornata. I parchi li pubblicano nei loro calendari, di solito con settimane o mesi di anticipo, e li cambiano con poco preavviso per eventi, meteo o problemi tecnici. Le singole attrazioni possono aprire più tardi o chiudere prima del parco, e nei giorni freddi le attrazioni acquatiche restano spesso chiuse.\n\npark.fan mostra gli orari pubblicati di ogni parco e, quando il parco li fornisce, quelli delle singole attrazioni. Per un parco che non pubblica orari, park.fan mostra orari ricavati dall’attività misurata nel parco, segnati come «Orari stimati». Nella maggior parte dei parchi l’orario di chiusura è il momento in cui chiudono le code; le attrazioni restano in funzione finché chi è già in fila non è salito.\n\nCome si comportano le attese nella prima e nell’ultima ora cambia da attrazione ad attrazione, e la pagina di un’attrazione mostra la sua giornata tipica ora per ora.',
    aliases: ['Orari del Parco', 'Ore di Apertura'],

    relatedTermIds: ['crowd-calendar', 'rope-drop', 'soft-opening'],
  },
  {
    id: 'wait-time-trend',
    name: 'Tendenza',
    shortDefinition:
      'In che direzione si muove una coda secondo le ultime quattro letture: in aumento, in calo o stabile.',
    definition:
      'La tendenza indica se la coda di un’attrazione sta crescendo, calando o resta uguale. park.fan confronta la media delle ultime due letture con la media delle due precedenti e mostra la differenza, arrotondata ai cinque minuti, in una piccola etichetta accanto al tempo di attesa: una freccia in su con +10 min, una freccia in giù con −5 min, oppure «Stabile» quando la differenza arrotondata è zero.\n\nUn’attrazione con 45 minuti in calo può avere, quando un ospite ha attraversato il parco per arrivarci, una coda più corta di una con 40 minuti in aumento. La tendenza reagisce in fretta, quindi una sola lettura insolita, come il salto dopo la riapertura di un’attrazione rimasta ferma per un guasto, muove la freccia per le letture successive.',
    aliases: ['Queue Trend', 'Wait Trend'],

    relatedTermIds: ['crowd-level', 'posted-wait-time', 'wait-time'],
  },
  {
    id: 'trackless-ride',
    name: 'Trackless Ride',
    shortDefinition:
      'Dark ride senza rotaie fisse: i veicoli si muovono liberamente, guidati da sistemi nascosti nel pavimento.',
    definition:
      'Un Trackless Ride è un tipo di dark ride in cui i veicoli non seguono una rotaia fissa e si muovono da soli nell’attrazione, guidati da loop di induzione, Wi-Fi o laser nel pavimento. I veicoli possono girare, ruotare su se stessi e avvicinarsi alle scene da angolazioni diverse, e la storia non deve seguire un’unica linea. Esempi: Star Wars: Rise of the Resistance (Disney), Ratatouille: L’Avventura Totalmente Toccata di Remy (Disneyland Paris) e Symbolica (Efteling, Paesi Bassi).',
    aliases: ['Trackless', 'Trackless Dark Ride', 'Attrazione Senza Binari'],

    relatedTermIds: ['animatronics', 'dark-ride', 'themed-land'],
  },
  {
    id: 'ki',
    name: 'IA',
    shortDefinition:
      'Intelligenza Artificiale: i modelli di machine learning che calcolano le previsioni di affluenza e i tempi di attesa.',
    definition:
      'L’IA (Intelligenza Artificiale) indica gli algoritmi di machine learning che riconoscono schemi in grandi quantità di dati e ne ricavano previsioni. park.fan usa modelli IA addestrati sui tempi di attesa registrati, sui calendari scolastici, sui dati meteorologici e sugli annunci di eventi. Ogni giorno questi modelli calcolano nuove previsioni di affluenza e di tempi di attesa per ogni parco, per tutti i giorni del calendario che il parco ha già pubblicato.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-forecast'],
    aliases: ['Intelligenza Artificiale'],
  },
  {
    id: 'realtime-wait-time',
    name: 'Tempo di attesa in tempo reale',
    shortDefinition: 'Tempi di attesa presi dai sistemi del parco e aggiornati ogni cinque minuti.',
    definition:
      'Un tempo di attesa in tempo reale è l’attesa che un parco segnala per un’attrazione in questo momento, non una media dei giorni passati. Cambia nel corso della giornata, e quando un’attrazione si guasta il parco la segna come «Ferma» finché non riapre.\n\nOgni cinque minuti park.fan legge i dati sulle code dei parchi da ThemeParks.wiki, Wartezeiten.app e Queue-Times.com. Ne fanno parte la coda normale, il single rider, le corsie prioritarie a pagamento come Lightning Lane e le code virtuali, ovunque il parco le pubblichi, insieme allo stato di ogni attrazione. Accanto all’attesa, sulla scheda dell’attrazione, una piccola etichetta indica se le ultime due letture erano più alte o più basse delle due precedenti.\n\nAnche un’attesa in tempo reale resta una stima del parco, e il tempo passato davvero in coda può risultare più lungo o più corto.',
    relatedTermIds: ['crowd-forecast', 'posted-wait-time', 'wait-time'],
    aliases: ['Tempi di attesa in tempo reale', 'Attesa live', 'tempo di attesa in tempo reale'],
  },
  {
    id: 'crowd-forecast',
    name: 'Previsione affluenza',
    shortDefinition:
      'Previsione basata sull’IA di quanto sarà affollato un parco a tema in un dato giorno.',
    definition:
      'Una previsione dell’affluenza dice quanto sarà pieno un parco in un certo giorno, e in quali ore. Su park.fan le previsioni vengono da Fancast, il modello di park.fan, che prevede l’attesa per ogni attrazione e ogni ora e le combina nel livello di affluenza della giornata, sulla stessa scala di quello in tempo reale.\n\nIl modello impara dallo storico dei tempi di attesa misurati nel parco e tiene conto anche delle previsioni meteo, delle vacanze scolastiche, dei giorni festivi e di quello che succede nel parco quel giorno, come un evento speciale o l’inizio della stagione. Viene riaddestrato ogni giorno alle 06:00 UTC.\n\nIl giorno dopo, ogni previsione viene messa accanto alle attese misurate davvero, e la differenza entra nell’addestramento successivo. I valori di errore che ne risultano, l’errore percentuale medio e l’R², sono pubblicati su park.fan e ricalcolati dopo ogni addestramento, anche quando peggiorano. Le pagine delle attrazioni hanno un badge con la precisione delle previsioni per quell’attrazione.',
    relatedTermIds: ['ai-forecast', 'crowd-calendar', 'crowd-level', 'peak-day'],
    aliases: ['Previsioni affluenza', 'Fancast'],
  },
  {
    id: 'g-force',
    name: 'G-Force',
    shortDefinition:
      'L’unità di accelerazione sperimentata dai passeggeri, misurata come multipli dell’accelerazione gravitazionale terrestre (9,81 m/s²).',
    definition:
      'La forza G (equivalente gravitazionale) misura l’accelerazione che un passeggero subisce rispetto alla gravità normale della Terra. Le forze G positive (sopra 1G) schiacciano i passeggeri nel sedile negli avvallamenti e nelle curve strette. Le forze G negative (sotto 0G) sollevano i passeggeri dal sedile: è l’airtime. Le forze G laterali agiscono in orizzontale e spingono i passeggeri di lato nelle curve e nei cambi di direzione.\n\nChi progetta una montagna russa decide in che ordine arrivano queste forze. In fondo a un primo drop forte si arriva a 4–5G. Su una collina di airtime, un breve momento a −0,5G fa galleggiare il passeggero sopra il sedile. La maggior parte delle attrazioni resta tra 0 e 5G di forze positive prolungate, con brevi picchi. Forze G alte e prolungate possono dare malessere o greyout, per cui nei layout i tratti più intensi si alternano a tratti di recupero.',
    relatedTermIds: ['airtime', 'greyout', 'hangtime', 'inversion', 'lateral-gs', 'smoothness'],
    aliases: ['Forze G', 'G-Forces'],
  },
  {
    id: 'greyout',
    name: 'Greyout',
    shortDefinition:
      'Oscuramento temporaneo della visione causato dalle forze G positive che riducono il flusso sanguigno al cervello.',
    definition:
      'Il greyout (anche grey-out) è un calo temporaneo della vista: sotto forti forze G positive prolungate il passeggero vede grigio o velato. Le forze G positive spingono il sangue verso il basso, nelle gambe e nelle braccia, e ne arriva meno agli occhi e al cervello. Il campo visivo si restringe a partire dai bordi e diventa grigio. Il passeggero resta cosciente, ma vede molto meno.\n\nCon forze G ancora più forti o più lunghe si arriva al blackout (vista completamente buia) o al G-LOC (perdita di coscienza dovuta alle forze G). Per questo nei layout i picchi di G alti durano poco e i tratti intensi si alternano a tratti di recupero.',
    aliases: ['Greyouts', 'grey-out'],
    alternateNames: ['visione grigia', 'velo grigio', 'oscuramento da G'],
    relatedTermIds: ['airtime', 'g-force', 'hangtime', 'lateral-gs'],
  },
  {
    id: 'grey-zone',
    name: 'Zona grigia',
    shortDefinition:
      'Un elemento di montagna russa al limite della definizione di inversione, che viene contato o no a seconda del metodo di conteggio.',
    definition:
      'La zona grigia designa gli elementi di montagna russa situati al confine tra un’inversione completa e un elemento non-invertente. Le inversioni classiche, come i looping verticali e i cavatappi, non lasciano dubbi: il passeggero finisce completamente a testa in giù. Gli elementi in zona grigia arrivano appena, o non arrivano, ai 180° sopra la testa, e il passeggero è quasi capovolto.\n\nTipici elementi in zona grigia sono le curve sovrainclinate oltre i 90° e alcune varianti di wave turn. Uno stall, invece, è un’inversione completa. Produttori come RMC e Intamin usano questi elementi di proposito al posto delle inversioni classiche. Il numero ufficiale di inversioni di un’attrazione cambia a seconda del metodo di conteggio: stretto (solo rotazioni complete) o ampio (qualsiasi posizione a testa in giù).',
    aliases: ['Zone grigie', 'zona-grigia'],
    alternateNames: ['inversione borderline', 'quasi-inversione'],
    relatedTermIds: ['inversion', 'overbank', 'roller-coaster-element', 'stall'],
  },
  {
    id: 'lateral-gs',
    name: 'Lateral Gs',
    shortDefinition:
      'Forze che spingono i passeggeri di lato sul sedile in curve, transizioni ed eliche.',
    definition:
      'Le forze G laterali sono le spinte di lato che un passeggero sente quando una montagna russa cambia direzione più in fretta di quanto la sua inclinazione riesca ad assorbire. In una curva ben sopraelevata il binario si inclina in modo che la forza punti verso il basso, dentro il sedile; quando l’inclinazione è minore di quella che la velocità richiede, il resto spinge il passeggero verso l’esterno del vagone.\n\nI progettisti le usano di proposito: le curve piatte e veloci di una classica montagna russa in legno e i rapidi cambi di direzione di un tracciato GCI si fanno proprio per le laterali. Quelle indesiderate vengono da un binario usurato o da un tracciato che cambia inclinazione troppo di colpo, e sbattono i passeggeri contro la fiancata del vagone o contro il dispositivo di sicurezza. Le montagne russe in legno ne soffrono di più, perché il binario in legno si muove con il meteo e con l’uso, e le loro curve sono spesso meno inclinate che sulle montagne russe in acciaio.\n\nBalder a Liseberg (Intamin, 2003) è una montagna russa in legno con laterali fluide nelle curve.',
    relatedTermIds: ['airtime', 'g-force', 'helix', 'wooden-coaster'],
    aliases: ['Laterali', 'Forze G Laterali'],
  },
  {
    id: 'ejector-airtime',
    name: 'Ejector Airtime',
    shortDefinition:
      'Forti forze G negative che sbalzano i passeggeri fuori dal sedile, trattenuti solo dalla barra.',
    definition:
      'L’ejector airtime è la forma forte delle G negative. Su una collina con la cresta più stretta della traiettoria che il treno seguirebbe in caduta libera, il binario scende più in fretta del passeggero, che per una frazione di secondo viene tirato su dal sedile contro il dispositivo di sicurezza. Il nome viene dall’inglese to eject, espellere: si viene sbalzati fuori dal sedile.\n\nIl floater airtime è la sua controparte dolce, un sollevamento lento su una cresta arrotondata. L’ejector richiede velocità e una collina corta e ripida, e gli ibridi RMC, molti coaster Intamin e le moderne montagne russe in legno sono progettati per questo. Untamed a Walibi Holland, Wildfire a Kolmården e Steel Vengeance a Cedar Point hanno lunghe sequenze di ejector. L’ultima fila lo prende più forte, e una barra abbassata molto stretta ne toglie quasi tutto.',
    relatedTermIds: ['airtime', 'airtime-hill', 'floater-airtime', 'g-force', 'rmc'],
    alternateNames: ['Ejector'],
  },
  {
    id: 'floater-airtime',
    name: 'Floater Airtime',
    shortDefinition:
      'G negative lievi e prolungate che fanno galleggiare i passeggeri per un momento mentre il treno supera una collina.',
    definition:
      'Il floater airtime è la forma dolce delle G negative. Su una cresta ampia e arrotondata il treno segue quasi esattamente la traiettoria di un oggetto lanciato, e i passeggeri si sollevano appena dal sedile e restano così per un secondo o due, quasi senza peso.\n\nÈ l’airtime degli hyper e giga coaster B&M, le cui grandi colline paraboliche sono disegnate per questo. Shambhala a PortAventura e Silver Star a Europa-Park hanno lunghe sequenze di floater. Poiché il sollevamento è lieve, il floater si regge giro dopo giro, e chi trova l’ejector troppo forte di solito lo apprezza. La stessa collina può dare floater in testa al treno ed ejector in coda, che supera la cresta più veloce.',
    relatedTermIds: ['airtime', 'airtime-hill', 'b-and-m', 'ejector-airtime', 'g-force'],
    alternateNames: ['Floater'],
  },
  {
    id: 'hangtime',
    name: 'Hangtime',
    shortDefinition:
      'La sensazione di essere sospesi nei dispositivi di sicurezza durante un’inversione, causata da forze G negative a testa in giù.',
    definition:
      'L’hangtime è l’effetto delle forze G negative durante un’inversione: il treno resta capovolto abbastanza a lungo perché i passeggeri restino appesi ai dispositivi di sicurezza. In un looping veloce si è a testa in giù solo per un attimo; l’hangtime si ha quando il treno rallenta vicino alla cima di un’inversione e ci resta più a lungo. Tutto il peso del corpo grava sulle spalle o sulle ginocchia.\n\nL’hangtime è più forte negli elementi in cui il treno rallenta molto in cima all’inversione. L’esempio tipico è lo zero-g stall, in cui il treno resta capovolto lungo un intero tratto di binario. Anche l’heartline roll di alcune attrazioni moderne può dare hangtime.',
    relatedTermIds: ['airtime', 'g-force', 'heartline-roll', 'inversion'],
    alternateNames: ['Hang Time'],
  },
  {
    id: 'roller-coaster-element',
    name: 'Elemento delle montagne russe',
    shortDefinition:
      'Un tratto del percorso di una montagna russa con un nome proprio, come un looping, una collina di airtime o un’inversione.',
    definition:
      'Un elemento delle montagne russe è un tratto del percorso con un nome tutto suo. Alcuni sono inversioni, come il looping verticale, il cavatappi o lo zero-G roll; altri tengono i passeggeri dritti, come la collina di airtime, l’elica e l’overbank. Ognuno è disegnato per dare al passeggero una forza precisa: G negative su una cresta, G laterali in curva, G positive sul fondo di un looping, o la rotazione del capovolgimento.\n\nI nomi rendono confrontabili i tracciati. Un coaster descritto come lift hill, primo drop, dive loop, camelback ed elica è spiegato per metà prima ancora di salirci. Alcuni elementi appartengono a un solo produttore, come lo stall e il wave turn di Rocky Mountain Construction, e se ne aggiungono sempre di nuovi; il celestial spin di Mack Rides su Stardust Racers (2025) è tra gli ultimi.',
    relatedTermIds: ['airtime', 'first-drop', 'helix', 'inversion', 'vertical-loop'],
  },
  // ── Ride Experience ────────────────────────────────────────────────────────
  {
    id: 'front-row',
    name: 'Prima fila',
    shortDefinition: 'La prima fila di sedili di un veicolo, con la vista più libera sul percorso.',
    definition:
      'La prima fila è quella in testa al treno di una montagna russa, senza nessuno davanti e con la vista libera sul binario. Da lì si vede arrivare ogni discesa e ogni curva, e su un lancio si prende il vento in pieno viso.\n\nIn cima a una discesa il primo vagone è ancora trattenuto dal resto del treno che sta ancora salendo, così supera la cresta alla velocità più bassa di tutte le file; l’airtime forte in cima va all’ultima fila. Quello che la prima fila ha in più è la vista giù per la discesa prima che il treno ci si butti.\n\nMolti parchi permettono di aspettare la prima fila a un cancelletto separato in stazione, il che aggiunge qualche giro di treno all’attesa.',
    relatedTermIds: ['airtime', 'back-row', 'first-drop', 'middle-row'],
    alternateNames: ['Primo sedile', 'Prima posizione'],
  },
  {
    id: 'back-row',
    name: 'Ultima fila',
    shortDefinition:
      'L’ultima fila di sedili di un veicolo, dove sui percorsi con molte colline l’airtime è di solito più forte.',
    definition:
      'L’ultima fila è quella in coda al treno di una montagna russa. Quando la testa del treno supera una cresta, la coda sta ancora salendo; quando l’ultimo vagone arriva in cima, il resto del treno sta già scendendo e lo tira oltre a piena velocità. L’ultima fila supera quindi ogni cresta più veloce di tutte e prende l’ejector airtime più forte, e sul primo drop viene strattonata oltre la cima mentre la prima fila scavalca piano.\n\nSui coaster da airtime come Goliath a Walibi Holland o Shambhala a PortAventura l’ultima fila è il posto con l’airtime più forte. Sui coaster più vecchi l’ultimo vagone può anche essere quello che sobbalza di più, e davanti si vedono solo gli schienali dei sedili.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'front-row', 'middle-row'],
    alternateNames: ['Ultimo sedile', 'Ultima posizione'],
  },
  {
    id: 'middle-row',
    name: 'Fila centrale',
    shortDefinition:
      'Le file centrali di un treno di montagne russe, a metà strada tra la prima e l’ultima fila per vista e airtime.',
    definition:
      'Le file centrali sono i sedili al centro di un treno di montagne russe, tra la prima fila, con la vista libera, e l’ultima, con l’ejector airtime. Da lì si vede abbastanza del percorso in arrivo e si ha un buon airtime, ma senza gli estremi della prima o dell’ultima fila. Per le famiglie o per chi sale per la prima volta ed è in ansia, le file centrali sono le più tranquille.\n\nSu coaster con forze laterali lunghe, le file centrali possono a volte sentire la compressione maggiore, perché stanno vicino al baricentro del treno.',
    relatedTermIds: ['airtime', 'back-row', 'front-row', 'ride-cart'],
    alternateNames: ['Sedile centrale', 'Fila del mezzo'],
  },
  {
    id: 'ride-cart',
    name: 'Vagone',
    shortDefinition:
      'Il singolo vagone di un treno di montagne russe, con una o più file di passeggeri.',
    definition:
      'Un vagone è una delle vetture di un treno di montagne russe: un telaio con le ruote sotto, una o più file di sedili sopra e i dispositivi di sicurezza. Più vagoni agganciati formano un treno; un piccolo coaster per famiglie può viaggiare con un vagone solo. Ogni vagone ha su ciascun lato tre serie di ruote, sopra la rotaia, sotto e di fianco, che lo tengono sul binario anche con G negative e laterali.\n\nLa forma del vagone dipende dal tipo di coaster. Un inverted coaster appende i vagoni sotto il binario, un wing coaster fa sedere i passeggeri ai due lati della rotaia senza niente sotto, un flying coaster li mette a pancia in giù e uno spinning coaster monta i sedili su una piattaforma girevole. I produttori costruiscono i propri vagoni, quindi sedili e dispositivi di sicurezza di un B&M, un Intamin o un Mack si riconoscono da un parco all’altro.',
    relatedTermIds: ['back-row', 'front-row', 'lap-bar', 'shoulder-harness'],
    alternateNames: ['Auto', 'Car'],
  },
  {
    id: 'lap-bar',
    name: 'Barra addominale',
    shortDefinition:
      'Un dispositivo di sicurezza che si abbassa sulle cosce e lascia il busto più libero di uno che scende sulle spalle.',
    definition:
      'Una barra addominale è un dispositivo di sicurezza che scende sulle cosce del passeggero e lì si blocca, lasciando libera la parte alta del corpo. Sulla maggior parte dei coaster moderni è una barra singola o a T con blocco a cricchetto o idraulico, spesso affiancata da una cintura come seconda sicurezza indipendente.\n\nÈ il dispositivo abituale su hyper e giga coaster, sulla maggior parte delle montagne russe in legno e su molte attrazioni per famiglie, perché lascia sollevare il passeggero dal sedile in cima a una collina finché la barra non lo ferma. È lì che si sente l’airtime, e quanto ci si può sollevare dipende da quanto è stata abbassata la barra in stazione; un operatore che la spinge troppo giù toglie l’airtime, e questo si chiama stapling.\n\nLa vestibilità dipende dalla corporatura. Una barra che a un passeggero poggia sulle cosce a un altro preme sulla pancia, e molti parchi mettono un sedile di prova all’ingresso delle attrazioni con dispositivi stretti.',
    relatedTermIds: ['airtime', 'restraint-freedom', 'ride-cart', 'shoulder-harness'],
    alternateNames: ['Dispositivo inguinale'],
  },
  {
    id: 'shoulder-harness',
    name: 'Dispositivo sulle spalle',
    shortDefinition:
      'Un dispositivo di sicurezza che scende sulle spalle e avvolge tutto il busto, limitando i movimenti durante la corsa.',
    definition:
      'Un dispositivo sulle spalle (o harness OTS) scende sopra le due spalle e si blocca all’altezza del bacino, così il busto del passeggero sta dentro un telaio imbottito. Negli anni ’80 e ’90 è diventato il dispositivo abituale sui coaster in acciaio con looping ed è ancora lo standard sulla maggior parte degli inverted coaster e su molti coaster sospesi per famiglie.\n\nIl dispositivo tiene le spalle oltre ai fianchi, e questo conta quando un treno passa lentamente a testa in giù o cambia direzione con forza. Lo svantaggio lo sente la testa: su un binario che scuote, le imbottiture battono contro le orecchie, e sulle colline di airtime ci si solleva poco, perché il dispositivo ferma prima di una barra addominale. I modelli più recenti usano gilet morbidi al posto delle barre rigide sulle spalle, e Rocky Mountain Construction porta i passeggeri a testa in giù con la sola barra addominale.',
    relatedTermIds: ['airtime', 'lap-bar', 'restraint-freedom', 'ride-cart'],
    alternateNames: ['Dispositivo OTS'],
  },
  // ── Shopping ───────────────────────────────────────────────────────────────
  {
    id: 'souvenir',
    name: 'Ricordo',
    shortDefinition: 'Un oggetto comprato in un parco a tema per ricordare la visita.',
    definition:
      'Un ricordo è qualcosa che si compra in un parco per ricordare la visita: una maglietta o un cappellino con il logo del parco, una spilla, una cartolina, il peluche della mascotte, il modellino di un’attrazione. La maggior parte si vende nei negozi all’uscita del parco e all’uscita delle grandi attrazioni.\n\nI prezzi sono ben più alti di quelli di articoli simili in un negozio qualsiasi, e gli articoli legati a un parco o a un’attrazione si vendono solo lì. La foto in corsa è un ricordo a sé: la scatta una macchina fotografica sulla discesa, e si compra al banco all’uscita, stampata o da scaricare. Anche il collezionismo ha il suo seguito, e lo scambio di spille nei parchi Disney è l’esempio più noto.',
    relatedTermIds: ['gift-shop', 'merchandise', 'park-exclusive'],
    alternateNames: ['Ricordo commemorativo'],
  },
  {
    id: 'merchandise',
    name: 'Merchandise',
    shortDefinition:
      'Prodotti ufficiali venduti da un parco a tema, tra cui abbigliamento, articoli da collezione e oggetti a tema.',
    definition:
      'Il merchandise è tutto quello che un parco vende oltre a cibo, bevande e biglietti: abbigliamento con il logo del parco o di un’attrazione, peluche, spille, tazze, giocattoli legati a un film o a una mascotte e articoli a tema per un’area o un’attrazione. I grandi parchi lo vendono in decine di punti, dai carretti lungo i vialetti ai grandi negozi all’ingresso principale, che restano aperti dopo la chiusura delle attrazioni.\n\nNei parchi Disney e Universal buona parte dell’assortimento viene dai film su licenza, e un’area costruita attorno a un film vende i suoi oggetti di scena: le bacchette da Ollivanders nel Wizarding World of Harry Potter, le spade laser montate al Savi’s Workshop di Galaxy’s Edge. I parchi con personaggi propri vendono quelli, come Europa-Park con Ed Euromaus o Efteling con le sue figure delle fiabe. Le nuove attrazioni di solito aprono con un assortimento tutto loro.',
    relatedTermIds: ['gift-shop', 'park-exclusive', 'souvenir'],
    aliases: ['Merch'],
  },
  {
    id: 'gift-shop',
    name: 'Negozio di souvenir',
    shortDefinition:
      'Un negozio all’interno di un parco a tema che vende ricordi, merchandise e prodotti a tema.',
    definition:
      'Un negozio di souvenir è un negozio in un parco, in un hotel del resort o all’uscita di un’attrazione che vende ricordi e merchandise. I grandi parchi ne hanno decine, dai piccoli chioschi a veri e propri grandi magazzini all’ingresso principale, che sono l’ultima cosa davanti a cui passano gli ospiti all’uscita e restano aperti dopo la chiusura delle attrazioni.\n\nMolte attrazioni finiscono in un negozio tutto loro, e il percorso d’uscita ci passa attraverso: gli ospiti scendono dall’attrazione e camminano tra scaffali di magliette, peluche e foto di quell’attrazione prima di tornare all’aperto. Questi negozi sono a tema con l’attrazione e hanno un assortimento più ristretto dei negozi principali.',
    relatedTermIds: ['merchandise', 'park-exclusive', 'souvenir'],
    aliases: ['Negozio di ricordi'],
  },
  {
    id: 'park-exclusive',
    name: 'Esclusiva del parco',
    shortDefinition:
      'Un prodotto venduto solo in un determinato parco a tema o nei parchi dello stesso gruppo.',
    definition:
      'Un’esclusiva del parco è un articolo venduto solo in un parco, o solo in un gruppo di parchi, e non nei normali negozi del marchio. Esempi tipici sono magliette e spille con il logo di un’attrazione, il peluche della mascotte del parco, articoli per un anniversario o una nuova attrazione e le collezioni stagionali per Halloween o Natale.\n\nDi solito le esclusive sono indicate come tali sull’etichetta. Le tirature limitate si esauriscono, e i pezzi più rari ricompaiono sulle piattaforme di rivendita a prezzi più alti di quelli del negozio. I parchi Disney mettono in vendita spille in edizione limitata con tiratura numerata, per cui i collezionisti fanno la coda nei giorni di uscita.\n\nDiversi parchi vendono ormai parte dell’assortimento nei propri negozi online, e questo allenta il termine: un articolo può essere esclusivo nel senso che nessun altro rivenditore lo ha, e intanto si può ordinare da casa.',
    relatedTermIds: ['gift-shop', 'merchandise', 'souvenir'],
    aliases: ['Esclusivo'],
  },
  {
    id: 'flying-coaster',
    name: 'Flying Coaster',
    shortDefinition:
      'Montagna russa in cui i passeggeri viaggiano a pancia in giù, in posizione prona.',
    definition:
      'Un flying coaster tiene i passeggeri in orizzontale sotto il binario, a pancia in giù, nella posizione di chi vola. In stazione si sale seduti, su sedili appesi sotto la rotaia. Chiusi i dispositivi di sicurezza, i sedili ruotano all’indietro finché i passeggeri non sono sdraiati sulla schiena con lo sguardo al cielo, e il treno affronta così il lift hill. In cima una torsione del binario lo rovescia, e il resto del giro si fa a pancia in giù.\n\nIl Flyer di B&M è la versione più nota. Galactica ad Alton Towers ha aperto nel 2002 con il nome Air, primo Flyer di B&M; sono seguiti Tatsu a Six Flags Magic Mountain (2006) e Manta a SeaWorld Orlando (2009). L’elemento tipico del Flyer di B&M è il pretzel loop: il treno si tuffa dall’alto in un looping il cui fondo i passeggeri attraversano sdraiati sulla schiena, schiacciati con forza nel sedile.\n\nL’imbarco richiede più tempo che su un coaster con sedili normali, perché i sedili devono ruotare prima di ogni partenza e tornare indietro dopo ogni arrivo.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'steel-coaster'],
    alternateNames: ['Flyer', 'Coaster volante', 'Prone coaster'],
  },
  {
    id: 'mine-train',
    name: 'Mine Train',
    shortDefinition: 'Montagna russa in acciaio per famiglie a tema trenino da miniera.',
    definition:
      'Un mine train è una montagna russa in acciaio per famiglie travestita da treno del minerale fuori controllo, in un villaggio minerario o in un canyon nel deserto. In testa al treno c’è una locomotiva, e il binario resta basso, serpeggiando tra rocce, tunnel ed edifici in rovina. Il giro vive di curve rapide e brevi discese a ridosso della scenografia, e l’altezza conta poco. Spesso più lift hill lo dividono in sezioni, ognuna con la sua scena.\n\nI primi li costruì Arrow Development negli anni ’60. Run-A-Way Mine Train a Six Flags Over Texas (1966) fu tra i primi, e Arrow ne costruì sedici fino al 1997. Big Thunder Mountain Railroad aprì a Disneyland nel 1979. La versione di Disneyland Paris (1992) sta su un’isola in mezzo al Rivers of the Far West, raggiunta da un tunnel sotto l’acqua, con un’altezza minima di 102 cm. Colorado Adventure a Phantasialand (Vekoma, 1996) concentra un lungo tracciato in uno spazio ridotto.',
    relatedTermIds: ['powered-coaster', 'steel-coaster', 'themed-land'],
    aliases: ['mine coaster', 'vagone minerario', 'mine train'],
  },
  {
    id: 'terrain-coaster',
    name: 'Terrain Coaster',
    shortDefinition: 'Montagna russa costruita per seguire il paesaggio naturale.',
    definition:
      'Un terrain coaster segue il terreno su cui sorge. Invece di sollevare tutto il tracciato su una struttura in acciaio o in legno, il progettista fa correre il binario giù per un pendio, dentro i burroni e attraverso il bosco, così parte dell’altezza la dà il paesaggio e la struttura resta bassa. Con alberi e rocce a pochi metri dalle rotaie, la corsa sembra più veloce di quanto dica il tachimetro.\n\nThe Beast a Kings Island (1979) è l’esempio classico in legno, una lunga corsa in un tratto di bosco quasi tutto fuori dalla vista del parco. Ravine Flyer II a Waldameer (2008) passa sopra una strada su un ponte e si tuffa in un burrone. In Europa, Lisebergbanan a Göteborg (1987) segue la collina ripida su cui è costruito il parco. L’hanno progettato Anton Schwarzkopf e Werner Stengel, e il loro progetto teneva il binario più vicino al suolo di uno concorrente di Vekoma, così è stato necessario abbattere meno alberi.',
    relatedTermIds: ['airtime', 'alpine-coaster', 'steel-coaster', 'wooden-coaster'],
    aliases: ['terrain coaster', 'coaster paesaggistico'],
  },
  {
    id: 'floorless-coaster',
    name: 'Floorless Coaster',
    shortDefinition:
      'Montagna russa in acciaio senza pavimento, con i piedi dei passeggeri liberi nel vuoto.',
    definition:
      'Un floorless coaster è una montagna russa in acciaio con passeggeri seduti e vagoni senza pavimento. I sedili poggiano su un telaio sopra il binario, e la stazione ha un pavimento suo su cui i passeggeri stanno in piedi mentre salgono. Quando tutti i dispositivi di sicurezza sono chiusi, quel pavimento si ripiega o si abbassa e il treno parte con le gambe penzoloni poco sopra le rotaie. Il binario corre sotto, come su ogni coaster con passeggeri seduti, quindi la vista e le inversioni sono quelle di un coaster con looping, ma con niente sotto i piedi.\n\nIl primo l’ha costruito B&M: Medusa a Six Flags Great Adventure, aperto ad aprile 1999, seguito l’anno dopo da altri quattro, tra cui Kraken a SeaWorld Orlando. In Europa ce n’è uno al Parque Warner Madrid, Superman la Atracción de Acero (2002). Nel 2015 Cedar Point ha trasformato il suo stand-up coaster Mantis del 1996 nel floorless Rougarou, sullo stesso binario con treni nuovi.',
    relatedTermIds: [
      'b-and-m',
      'dive-coaster',
      'inverted-coaster',
      'stand-up-coaster',
      'steel-coaster',
    ],
    aliases: ['floorless', 'coaster senza pavimento', 'floorless coaster'],
  },
  {
    id: 'arrow-dynamics',
    name: 'Arrow Dynamics',
    shortDefinition: 'Produttore americano responsabile della prima inversione moderna.',
    definition:
      'Arrow Dynamics (fondata nel 1946 come Arrow Development, rinominata nel 1986) è stato un produttore americano che ha introdotto il moderno binario tubolare in acciaio e la prima inversione moderna su Corkscrew (Knott’s Berry Farm, 1975). Le attrazioni Arrow sono note per i corkscrew e i suspended looping coaster. L’azienda dichiarò fallimento nel 2001 e i suoi asset furono acquisiti da S&S.',
    relatedTermIds: ['corkscrew', 'rattle', 'steel-coaster', 'suspended-coaster', 'vertical-loop'],
    aliases: ['Arrow', 'Arrow Development', 'S&S Arrow', 'arrow dynamics'],
  },
  {
    id: 'gci',
    name: 'Great Coasters International (GCI)',
    shortDefinition:
      'Costruttore americano di montagne russe in legno con tracciati veloci e tortuosi.',
    definition:
      'Great Coasters International (GCI) è un costruttore di montagne russe in legno di Sunbury, in Pennsylvania, fondato nel 1994 da Clair Hain Jr. e Mike Boodley, che avevano lavorato insieme alla Custom Coasters International. I tracciati GCI passano sopra e sotto sé stessi molte volte in uno spazio compatto, con rapidi cambi di direzione e airtime sulle creste.\n\nL’azienda costruisce i propri treni, il Millennium Flyer, fatti di vagoni corti e articolati, così il treno affronta le curve strette in modo più fluido dei treni lunghi e rigidi delle vecchie montagne russe in legno. Negli Stati Uniti sono di GCI Thunderhead a Dollywood (2004) e Mystic Timbers a Kings Island (2017). Troy a Toverland (2007) è stato il secondo coaster europeo dell’azienda, dopo Thunderbird in Finlandia; Joris en de Draak a Efteling (2010) è un racing coaster con due binari, e Wodan Timburcoaster a Europa-Park ha aperto nel 2012.',
    relatedTermIds: ['airtime', 'cci', 'rmc', 'terrain-coaster', 'wooden-coaster'],
    aliases: ['Great Coasters International', 'GCI coaster', 'Millennium Flyer', 'gci'],
  },
  {
    id: 'premier-rides',
    name: 'Premier Rides',
    shortDefinition:
      'Produttore americano specializzato in coaster con lancio LSM/LIM; in Europa è noto soprattutto per Sky Scream.',
    definition:
      'Premier Rides (fondato nel 1995, Baltimora, Maryland) è un produttore americano specializzato in sistemi di lancio a motore sincrono lineare (LSM) e a motore a induzione lineare (LIM). Lo Sky Rocket II, un launch coaster compatto con un’inversione, si trova in parchi di medie dimensioni in tutto il mondo.\n\nIn Europa il coaster Premier più noto è Sky Scream all’Holiday Park (Haßloch, Germania), uno Sky Rocket II con una sola inversione, un heartline roll.',
    relatedTermIds: ['gerstlauer', 'intamin', 'launch-coaster'],
  },
  {
    id: 'maurer-rides',
    name: 'Maurer Rides',
    shortDefinition:
      'Produttore tedesco di Monaco noto per gli spinning coaster con trick track, la piattaforma X-Car e il modello verticale Sky Loop.',
    definition:
      'Maurer Rides (Maurer AG, lavorazione dei metalli dal 1876, attrazioni dal 1993) è un produttore monacense. Gli spinning coaster della serie SC hanno il trick track, un tratto in cui il vagone si inclina di lato; la piattaforma X-Car permette layout compatti e su misura, con lanci e inversioni.\n\nLo Sky Loop è un looping verticale a sé stante che occupa poco spazio e si trova in molti parchi europei. In Europa ci sono per esempio Winja’s Fear e Winja’s Force a Phantasialand (Germania), spinning coaster al coperto con trick track.',
    aliases: ['Maurer', 'Maurer Söhne', 'Maurer AG'],
    relatedTermIds: ['gerstlauer', 'launch-coaster', 'spinning-coaster', 'xtreme-spinning-coaster'],
  },
  {
    id: 'zamperla',
    name: 'Zamperla',
    shortDefinition:
      'Produttore italiano con uno dei cataloghi più ampi al mondo di coaster per famiglie e attrazioni: oltre 350 coaster installati.',
    definition:
      'Zamperla (fondato nel 1966, Altavilla Vicentina, Italia) è uno dei produttori di attrazioni più prolifici al mondo. Intamin, B&M e Mack costruiscono soprattutto grandi attrazioni intense; Zamperla vende molte attrazioni più piccole, adatte a quasi tutti. I modelli Family Coaster, Mini Coaster, Twister e Disk’O Coaster si trovano in parchi di medie dimensioni e resort di tutto il mondo.\n\nLe attrazioni Zamperla sono compatte e hanno un’altezza minima moderata, per cui si trovano spesso nei parchi urbani europei, nei resort e nei parchi al coperto. L’azienda ha anche costruito Thunderbolt a Coney Island (New York).',
    aliases: ['Zamperla rides', 'Antonio Zamperla'],
    relatedTermIds: ['credit', 'gerstlauer', 'mine-train'],
  },
  {
    id: 'huss-rides',
    name: 'Huss Rides',
    shortDefinition: `Produttore tedesco di attrazioni fondato nel 1919 a Brema, noto per il Top Spin, il Break Dance, l’Enterprise, il Ranger e il Condor.`,
    definition: `Huss è un produttore tedesco di attrazioni fondato nel 1919 a Brema, che costruisce giostre dal 1969. Dopo il fallimento del 2006 l’attività è proseguita come HUSS Park Attractions GmbH. L’azienda ha prodotto molti modelli di flat ride della fine del Novecento, che si trovano in parchi a tema e fiere di tutto il mondo.\n\nI modelli Huss più noti sono il Top Spin, il Break Dance (veicoli rotanti su una piattaforma girevole), l’Enterprise (ruota centrifuga a gondole), il Ranger (pendolo con looping e gondola a gabbia), il Condor (torre di sedie rotante) e la Troika. Molti di questi modelli sono stati copiati da altri produttori. Negli anni ottanta e novanta le attrazioni Huss erano molto diffuse nei parchi europei.`,
    relatedTermIds: ['drop-tower', 'flat-ride', 'pendulum-ride', 'top-spin'],
    aliases: ['Huss', 'Huss Park Attractions'],
  },
  {
    id: 's-and-s-worldwide',
    name: 'S&S Worldwide',
    shortDefinition:
      'Produttore americano noto per le torri pneumatiche, il compatto El Loco e i coaster Free Fly 4D.',
    definition:
      'S&S Worldwide (fondato nel 1994, Logan, Utah; acquisito da Sansei Technologies nel 2012) ha sviluppato inizialmente sistemi di caduta pneumatici (Space Shot e Turbo Drop) e solo dopo è passato ai coaster. L’El Loco è un coaster estremo compatto con una prima discesa oltre la verticale e un’inversione. Il Free Fly è un coaster 4D con sedile a rotazione libera.\n\nS&S ha anche acquisito i beni di Arrow Dynamics dopo il fallimento del 2001. In Europa, le installazioni S&S sono meno comuni che in Nord America.',
    aliases: ['S&S', 'S&S-Sansei', 'S&S Power', 'S&S Sansei', 'S&S – Sansei Technologies'],
    relatedTermIds: ['arrow-dynamics', 'gerstlauer', 'launch-coaster'],
  },
  {
    id: 'zierer',
    name: 'Zierer',
    shortDefinition:
      'Produttore bavarese specializzato in coaster per famiglie, con oltre 190 installazioni in tutto il mondo.',
    definition:
      'Zierer (fondato nel 1930, Deggendorf, Baviera) è un produttore tedesco specializzato in montagne russe familiari e attrazioni classiche da parco. La gamma Force Coaster copre più livelli, dai modelli junior compatti alle installazioni Force Custom più veloci. I coaster Zierer hanno binari tubolari in acciaio, corse fluide e un’altezza minima moderata.\n\nCon oltre 190 montagne russe consegnate nel mondo, Zierer è uno dei costruttori europei più prolifici per numero di unità. Tra le sue installazioni ci sono il Feuerdrache al Legoland Deutschland e coaster familiari in parchi tedeschi, olandesi e scandinavi.',
    aliases: ['Zierer GmbH', 'Zierer rides'],
    relatedTermIds: ['credit', 'gerstlauer', 'mack-rides'],
  },
  {
    id: 'stall',
    name: 'Stall',
    shortDefinition:
      'Inversione in cui il treno rimane brevemente capovolto a velocità quasi zero.',
    definition:
      'Uno stall (o zero-G stall) è un elemento in cui il treno entra in un’inversione e in cima rallenta quasi fino a fermarsi, con i passeggeri capovolti. L’elemento, sviluppato da Rocky Mountain Construction (RMC), dà un lungo hangtime. Esempi: Zadra (Energylandia) e Steel Vengeance (Cedar Point).',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'zero-g-roll'],
    aliases: ['RMC stall', 'elemento hangtime', 'stall element'],
  },
  {
    id: 'wave-turn',
    name: 'Wave Turn',
    shortDefinition:
      'Cambio di direzione sopraelevato con un momento di airtime forte a metà curva.',
    definition:
      'Un wave turn è una collina di airtime coricata su un fianco. Il binario sale e scende come un camelback mentre è inclinato di circa 90 gradi, così visto dall’alto è una curva. Sul sedile la spinta arriva insieme verso l’alto e di lato: i passeggeri vengono lanciati verso l’esterno della curva e fuori dal sedile nello stesso momento, e la barra li trattiene in entrambe le direzioni.\n\nIl nome l’ha coniato Rocky Mountain Construction. Outlaw Run a Silver Dollar City (2013) e Lightning Rod a Dollywood (2016) hanno dei wave turn, e da allora anche altri produttori hanno adottato l’elemento: B&M su Orion a Kings Island (2020), Intamin su Toutatis al Parc Astérix (2023) e Mack Rides su Voltron Nevera a Europa-Park (2024).\n\nUn overbank si inclina oltre i 90 gradi e si percorre con il corpo premuto nel sedile; il wave turn resta a circa 90 gradi ed è disegnato per l’airtime.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'lateral-gs', 'overbank', 'rmc', 's-hill'],
    aliases: ['wave turn', 'curva con airtime'],
  },
  {
    id: 'shoulder-season',
    name: 'Mezza Stagione',
    shortDefinition: 'Periodo tra alta e bassa stagione con affluenza moderata.',
    definition:
      'La mezza stagione indica i periodi di transizione tra la stagione di punta e i momenti più tranquilli di un parco. Nei parchi europei sono di solito la primavera (marzo–maggio) e l’inizio dell’autunno (settembre–ottobre). L’affluenza è moderata, i prezzi sono spesso più bassi e la maggior parte delle attrazioni è aperta.',
    relatedTermIds: ['crowd-forecast', 'crowd-level', 'peak-day', 'school-holiday'],
    aliases: ['bassa stagione', 'shoulder season', 'stagione intermedia', 'off-peak'],
  },
  {
    id: 'school-holiday',
    name: 'Vacanze scolastiche',
    shortDefinition:
      'Periodi di vacanza scolastica che fanno salire molto l’affluenza nei parchi a tema.',
    definition:
      'Le vacanze scolastiche sono le settimane in cui le scuole sono chiuse: l’estate, Natale e Capodanno, Pasqua e, in molti paesi, una pausa autunnale e una settimana di vacanza a metà trimestre o a carnevale. Le famiglie con figli in età scolare possono viaggiare solo allora, e i parchi si riempiono di conseguenza.\n\nL’effetto dipende da chi è in vacanza. La Germania scagliona le vacanze estive per Land, così un parco raggiungibile da più Länder ha una lunga estate piena invece di un unico picco; i Paesi Bassi dividono l’estate in tre regioni con date diverse. Un parco vicino a un confine, come Europa-Park vicino a Francia e Svizzera o Phantasialand a portata di Paesi Bassi e Belgio, attinge ai calendari di più paesi, e una settimana tranquilla in un paese può essere piena in quello accanto.\n\nLa previsione di park.fan tiene conto delle vacanze scolastiche, e la pagina sul periodo migliore per visitare ogni parco mostra mese per mese quanto le vacanze lo riempiano di più.',
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
      'Un fotopass (o Memory Maker) è un’opzione aggiuntiva che dà accesso digitale a tutte le foto e i video professionali scattati durante la visita (sulle attrazioni, agli incontri con i personaggi e dai fotografi itineranti). Venduto a tariffa fissa, può essere conveniente per le famiglie. Esempi: Memory Maker (Disney) e Photo Pass (Universal).',
    relatedTermIds: ['character-meet-and-greet', 'ride-photo', 'season-pass'],
    aliases: ['Memory Maker', 'pacchetto foto', 'foto del parco', 'photo pass'],
  },
  {
    id: 'accessibility-pass',
    name: 'Pass Accessibilità',
    shortDefinition:
      'Pass per ospiti con disabilità per accedere alle attrazioni con attesa ridotta.',
    definition:
      'Un pass accessibilità (DAS – Disability Access Service, carta accessibilità o pass accesso attrazione) viene rilasciato agli ospiti che non possono fare la fila tradizionale a causa di una disabilità. Permette all’ospite e a un gruppo di accompagnatori di tornare a un orario stabilito invece di aspettare fisicamente. Criteri e procedure variano per parco e paese.',
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
    shortDefinition: 'Attrazione che combina una piattaforma mobile e la proiezione di un film.',
    definition:
      'Un simulatore fa sedere i passeggeri in una cabina o su una piattaforma che si muove a tempo con un film. La piattaforma poggia su attuatori idraulici o elettrici, di solito sei, che per un breve tratto la inclinano in avanti e di lato, la sollevano e la fanno rollare, mentre lo schermo mostra un movimento molto più ampio. Il corpo scambia l’inclinazione della cabina per un’accelerazione, e gli occhi fanno il resto. Non c’è binario, e la cabina non va da nessuna parte.\n\nStar Tours ha aperto a Disneyland nel gennaio 1987 con cabine costruite da Rediffusion Simulation, un’azienda britannica che faceva simulatori di volo per l’addestramento dei piloti; la versione di Disneyland Paris è seguita nel 1992. Dal 2011 il film di Star Tours è montato con segmenti scelti a caso, quindi due giri di fila raramente sono uguali. I flying theatre come Voletarium a Europa-Park (2017) sono un ramo più recente della stessa idea, con file di sedili sollevate davanti a uno schermo a cupola.\n\nI simulatori portano molti passeggeri per lo spazio che occupano, e un film nuovo rinnova l’attrazione. Il mal di movimento che danno nasce dal contrasto tra ciò che vedono gli occhi e ciò che sente l’orecchio interno.',
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
    name: 'Incontro con i personaggi',
    shortDefinition:
      'Un appuntamento fisso per incontrare di persona un personaggio in costume del parco.',
    definition:
      'Un meet and greet è un luogo e un orario fissi in cui un personaggio in costume incontra gli ospiti una famiglia alla volta, per una foto, due parole e un autografo. Alcuni personaggi hanno un edificio tutto loro con una coda e un tempo di attesa segnalato; altri compaiono in un punto indicato secondo gli orari pubblicati nell’app o nel pieghevole del parco. Di solito c’è un fotografo, e le foto si comprano dopo o sono incluse in un photo pass.\n\nNei parchi Disney e Universal i personaggi vengono dai film. I parchi europei usano i propri o quelli su licenza: Europa-Park ha le sue mascotte Ed Euromaus ed Edda Euromausi, Efteling i suoi giullari Pardoes e Pardijn, Plopsaland De Panne i personaggi di Studio 100 come l’Ape Maia e lo gnomo Plop. Le famiglie con bambini piccoli organizzano la giornata attorno agli orari.',
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
      'Area di attesa che prepara gli ospiti a un’attrazione con narrazione introduttiva.',
    definition:
      'Un pre-show è una sala di un’attrazione tematizzata in cui gli ospiti si radunano prima del percorso vero e proprio, per sentire l’inizio della storia, le istruzioni di sicurezza o un breve spettacolo introduttivo. Esempi: la stanza elastica dell’Haunted Mansion e il video di sicurezza di Guardians of the Galaxy – Mission: BREAKOUT!.',
    relatedTermIds: ['animatronics', 'dark-ride', 'motion-simulator', 'themed-land'],
    aliases: ['pre show', 'area di attesa tematizzata', 'zona pre-imbarco'],
  },
  {
    id: 'flat-ride',
    name: 'Flat Ride',
    shortDefinition:
      'Attrazione a livello del suolo che ruota, oscilla o si inclina senza un circuito di binari sopraelevato.',
    definition:
      'Un flat ride è una categoria di attrazioni che funzionano su un piano sostanzialmente orizzontale senza binari sopraelevati. Il termine comprende attrazioni rotanti (giostre, tazze pazze), Frisbees (attrazioni a pendolo), Top Spins e giostre a catene (seggiolini volanti), torri di caduta e piattaforme rotanti.\n\nA differenza delle montagne russe, i flat ride occupano di solito poco spazio e stanno bene anche nelle aree più piccole del parco. Molti hanno un’alta capacità oraria e un’altezza minima bassa o nulla, e vanno bene per molte età. Spesso sono la maggior parte delle attrazioni per famiglie e bambini di un parco.',
    relatedTermIds: ['drop-tower', 'height-requirement', 'ride-capacity', 'swing-ride'],
    aliases: ['flat rides', 'giostra da fiera', 'attrazione di terra'],
  },
  {
    id: 'water-ride',
    name: 'Attrazione Acquatica',
    shortDefinition:
      'Attrazione in cui gli ospiti viaggiano su barche o veicoli attraverso l’acqua, rischiando di bagnarsi.',
    definition:
      'Un’attrazione acquatica (water ride) è un’attrazione in cui l’acqua è parte centrale del giro: il veicolo percorre un canale d’acqua oppure l’acqua serve come effetto voluto. I tre tipi più comuni sono: le giostre a tronchi (barche su un canale con caduta finale), i fiumi dei rapidi (zattere circolari su acque bianche artificiali) e le battaglie d’acqua (gli ospiti si spruzzano reciprocamente con cannoni d’acqua). Le attrazioni acquatiche hanno in genere requisiti di altezza bassi e un pubblico molto ampio. Nelle giornate calde d’estate hanno spesso code molto lunghe.',
    relatedTermIds: ['height-requirement', 'log-flume', 'ride-capacity', 'river-rapids'],
    aliases: ['attrazione d’acqua', 'ride acquatico', 'water ride', 'giostra acquatica'],
  },
  {
    id: 'live-show',
    name: 'Spettacolo dal Vivo',
    shortDefinition:
      'Spettacolo programmato con attori dal vivo, musica, acrobazie o personaggi in un teatro o anfiteatro dedicato.',
    definition:
      'Uno spettacolo dal vivo è intrattenimento eseguito da attori e artisti in carne e ossa, in un anfiteatro all’aperto, in un teatro al chiuso o per strada. Si va dai musical in stile Broadway e dagli stunt show alle parate di personaggi, ai film 4D con parti dal vivo e agli spettacoli di laser e fuochi d’artificio. A differenza delle attrazioni, gli spettacoli hanno orari fissi e un numero limitato di posti per replica, quindi vanno messi nel piano della giornata. Uno spettacolo verso mezzogiorno, quando le code alle attrazioni sono più lunghe, è una buona pausa.',
    relatedTermIds: ['pre-show', 'ride-capacity', 'themed-land'],
    aliases: ['show', 'spettacolo', 'stunt show', 'show dal vivo', 'intrattenimento dal vivo'],
  },
  {
    id: 'quick-service',
    name: 'Self-Service',
    shortDefinition: 'Ristorante con ordinazione al banco, senza servizio al tavolo.',
    definition:
      'Il self-service (in inglese quick service) è la ristorazione del parco in cui si ordina a un banco o a un chiosco, si paga e si porta da sé il vassoio al tavolo. Hamburger, pizza, bowl e patatine riempiono i menu, il pasto è pronto pochi minuti dopo l’ordine e non serve prenotare. È il tipo di ristorante più comune in un parco a tema, e quello dove si formano le code all’ora di pranzo.\n\nIl termine quick service è di Disney. Il suo sistema di ristorazione divide i ristoranti in quick service e table service, e il Disney Dining Plan contava i due come crediti separati. Altrove la stessa cosa si chiama counter service o self-service.\n\nI banchi sono più affollati a mezzogiorno e di nuovo prima di uno spettacolo serale. Molti parchi accettano ordini tramite la loro app, che sposta l’attesa dalla cassa al banco di ritiro. Un food court riunisce più banchi self-service attorno a un’unica zona con i tavoli.',
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
    name: 'Servizio al tavolo',
    shortDefinition: 'Ristorante con camerieri al tavolo, dove spesso serve prenotare.',
    definition:
      'Un ristorante con servizio al tavolo è un ristorante dentro un parco o in uno dei suoi hotel in cui ci si siede e un cameriere prende l’ordinazione al tavolo. Un pasto dura un’ora o più e costa ben più di un pasto al banco, e la sala è un posto tranquillo, al riparo dal sole o dalla pioggia, nel mezzo della giornata.\n\nNei parchi Disney quelli più richiesti sono al completo, e le prenotazioni aprono 60 giorni prima. Il Disney Dining Plan li conta come crediti table service, e i suoi ristoranti signature come due. Il character dining è un pasto con servizio al tavolo durante il quale i personaggi in costume passano tra i tavoli.\n\nI parchi europei hanno i propri, dai ristoranti a tema nelle aree del parco all’alta cucina negli hotel del resort. A Europa-Park, l’Ammolite nel faro dell’hotel Bell Rock ha due stelle Michelin.',
    relatedTermIds: ['character-dining', 'peak-day', 'quick-service'],
    aliases: ['table service', 'ristorante con servizio', 'cena con prenotazione'],
  },
  {
    id: 'character-dining',
    name: 'Cena con i Personaggi',
    shortDefinition:
      'Ristorante in cui i personaggi in costume passano tra i tavoli durante il pasto.',
    definition:
      'Il character dining è un pasto, di solito a buffet o a menu fisso con servizio al tavolo, durante il quale personaggi in costume passano da un tavolo all’altro. Ognuno si ferma il tempo di scambiare due parole, posare per una foto e firmare il libretto degli autografi, così una famiglia incontra più personaggi in un solo pasto senza fare la coda a un meet and greet per ciascuno.\n\nNei parchi Disney questi pasti si esauriscono presto e costano più di un ristorante normale dello stesso tipo. Chef Mickey’s al Disney’s Contemporary Resort e Cinderella’s Royal Table dentro il castello di Magic Kingdom sono gli esempi più noti in Florida. A Disneyland Paris le principesse compaiono all’Auberge de Cendrillon in Fantasyland, a colazione, pranzo e cena.\n\nFuori da Disney la formula esiste in piccolo. Un soggiorno in un hotel di Europa-Park può comprendere una visita a colazione delle mascotte del parco, Ed Euromaus ed Edda Euromausi.',
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
      'Una torre di caduta (drop tower o free-fall tower) è un’attrazione in cui i visitatori vengono sollevati in una gondola o su sedili individuali intorno a una struttura centrale a torre e poi rilasciati in una rapida caduta verso il basso. La caduta può essere quasi in caduta libera (vicina all’assenza di peso), frenata o combinata con un lancio verso l’alto. Una fase di decelerazione progressiva frena dolcemente la gondola in basso. Le varianti includono torri rotanti, modelli multidirezionali e versioni ibride. Le torri di caduta occupano poco spazio a terra e si trovano in tutto il mondo. Tra i produttori ci sono Intamin, Mondial e S&S Worldwide.',
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
      'Attrazione su canale d’acqua in cui barche a forma di tronco percorrono un tracciato e terminano con un grande tuffo.',
    definition:
      "Il fiume dei tronchi (log flume) è un’attrazione acquatica in cui gli ospiti prendono posto su imbarcazioni a forma di tronco e percorrono un canale pieno d’acqua. Dopo tratti tranquilli arriva una ripida discesa finale che finisce con un grande schizzo, e i passeggeri si bagnano quasi sempre. Le prime giostre a tronchi sono degli anni '60; oggi si trovano in parchi di tutto il mondo, hanno un’altezza minima bassa e una capacità moderata. Esempi europei: la Tiroler Wildwasserbahn a Europa-Park e numerose installazioni di tipo Wildwasserbahn nei parchi di lingua tedesca.",
    relatedTermIds: [
      'height-requirement',
      'river-rapids',
      'splashdown',
      'water-coaster',
      'water-ride',
    ],
    aliases: [
      'giostra a tronchi',
      'log flume',
      'scivolo d’acqua',
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
      'Le rapide del fiume (river rapids) mettono gli ospiti su zattere circolari gonfiabili o in plastica che derivano e ruotano lungo un canale artificiale progettato per simulare le acque bianche. Poiché la zattera circolare ruota liberamente sulla corrente, ogni percorso è imprevedibile: a seconda della posizione della zattera, alcuni passeggeri vengono completamente bagnati, altri rimangono relativamente asciutti. Le rapide hanno di solito un’alta capacità oraria e un’altezza minima bassa, e ci salgono intere famiglie. Nelle giornate calde sono molto frequentate. Esempi europei: le Wildwasser di Phantasialand e varie installazioni a Efteling, Europa-Park e Thorpe Park.',
    relatedTermIds: ['height-requirement', 'log-flume', 'water-ride'],
    aliases: ['rapide', 'river rapids', 'giro in zattera', 'acque bianche', 'rafting'],
  },
  {
    id: 'pendulum-ride',
    name: 'Attrazione a Pendolo',
    shortDefinition:
      'Flat ride in cui una gondola oscilla in un ampio arco a pendolo, spesso mentre ruota simultaneamente.',
    definition:
      'Un’attrazione a pendolo è un tipo di flat ride in cui una gondola è appesa a un lungo braccio che oscilla in un arco sempre più ampio, raggiungendo spesso posizioni quasi verticali. Intanto la gondola gira anche su se stessa.\n\nL’esempio più noto è il Frisbee di Huss: una gondola a forma di disco che oscilla come un pendolo girando su se stessa. Altre attrazioni a pendolo diffuse sono il KMG Afterburner e il Giant Frisbee di Huss. Le attrazioni a pendolo si vedono da lontano, occupano relativamente poco spazio e si trovano in parchi a tema e fiere di tutto il mondo.',
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
      'Il Top Spin è un modello di attrazione prodotto da Huss Rides. Una gondola con circa 40 passeggeri è montata su un telaio oscillante; la gondola può girare di continuo in qualsiasi direzione mentre il telaio oscilla, e oscillazione e rotazione si combinano in modo imprevedibile. Il programma può andare da un semplice dondolio a rotazioni continue molto intense.\n\nDagli anni novanta agli anni 2010 i Top Spin erano molto diffusi nei parchi a tema e nelle fiere. Anche se oscilla, il Top Spin non è un’attrazione a pendolo: la gondola è fissata tra due bracci laterali rotanti invece di essere appesa a un lungo braccio.',
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    aliases: ['Top Spins'],
    alternateNames: ['Huss Top Spin'],
  },
  {
    id: 'break-dance',
    name: 'Break Dance',
    shortDefinition: `Un flat ride Huss con diversi vagoni montati su un grande disco rotante, dove ogni vagone ruota liberamente sul proprio asse.`,
    definition: `Il Break Dance è un modello di flat ride di Huss Rides in cui piccoli vagoni (ciascuno per due o quattro passeggeri) sono disposti attorno a un grande disco rotante. I vagoni girano liberamente su se stessi mentre il disco ruota, e le forze di rotazione e inclinazione cambiano in modo imprevedibile da un ciclo all’altro.\n\nDagli anni '80 il Break Dance è uno dei flat ride più diffusi, sia nelle fiere sia nei parchi; si riconosce dal disco illuminato che gira e dalla musica ad alto volume. Altri produttori ne vendono varianti e copie con nomi diversi.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Breakdance', 'Break Dancer'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    shortDefinition: `Un flat ride centrifugo in cui le gondole su un grande anello rotante sono mantenute in posizione dalla forza G mentre l’anello si inclina verticalmente.`,
    definition: `L’Enterprise è un flat ride in cui le gondole sono disposte attorno alla circonferenza di un grande anello rotante. Man mano che l’anello accelera, la forza centrifuga spinge i passeggeri saldamente nei loro sedili; a piena velocità, l’intero anello si inclina poco a poco fin quasi alla verticale, e in cima i passeggeri girano a testa in giù.\n\nL’Enterprise è nata da Schwarzkopf nel 1972 e Huss Rides ne ha poi costruito una versione migliorata; dagli anni '70 si trova sia nei parchi sia nelle fiere itineranti. Con l’anello quasi verticale si vede da lontano.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides'],
    aliases: ['Enterprises'],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    shortDefinition: `Un pendolo con looping di Huss: una gondola chiusa da una gabbia, in cima a un braccio, che oscilla sempre più in alto e poi compie giri completi.`,
    definition: `Il Ranger è il pendolo con looping di Huss Rides. Una lunga gondola chiusa da una gabbia è fissata all’estremità di un braccio, con un contrappeso dall’altra parte. Il braccio oscilla avanti e indietro, sale un po’ di più a ogni oscillazione, poi supera la cima e compie giri completi. I passeggeri, trattenuti da maniglioni di sicurezza sulle spalle, si ritrovano a testa in giù e restano appesi quando la gondola rallenta in cima.\n\nUna barca oscillante (Viking, Pirate Ship) non si capovolge mai, il Ranger sì. È uno dei flat ride Huss più venduti e si trova in parchi e fiere itineranti in tutta Europa e oltre.`,
    relatedTermIds: ['flat-ride', 'height-requirement', 'huss-rides', 'pendulum-ride'],
    alternateNames: ['Huss Ranger'],
  },
  {
    id: 'condor',
    name: 'Condor',
    shortDefinition: `Un flat ride Huss con bracci gondola che si estendono verso l’esterno da una colonna centrale mentre la giostra ruota e sale.`,
    definition: `Il Condor è un modello di flat ride di Huss Rides composto da un’alta colonna centrale con diversi bracci gondola. Durante il funzionamento, i bracci si estendono verso l’esterno e le gondole salgono mentre l’intera struttura ruota. I passeggeri girano, salgono e vengono inclinati verso l’esterno, con la vista sul parco da un’altezza moderata.\n\nDagli anni '70 agli anni '90 il Condor era comune nei parchi europei, e in molti parchi c’è ancora. A volte lo si confonde con le giostre a catene, ma ha gondole chiuse al posto di sedili aperti appesi.`,
    relatedTermIds: ['flat-ride', 'huss-rides', 'swing-ride'],
  },
  {
    id: 'troika',
    name: 'Troika',
    shortDefinition: `Un flat ride Huss con tre bracci rotanti, ognuno portante una gondola i cui vagoni ruotano simultaneamente con la piattaforma principale.`,
    definition: `La Troika è un modello di flat ride di Huss Rides in cui tre bracci si estendono da un mozzo centrale; ogni braccio porta una gondola con diversi vagoni che possono ruotare. Mentre la piattaforma principale gira, girano anche le gondole e i vagoni: tre rotazioni insieme, con un movimento difficile da prevedere.\n\nDagli anni '70 la Troika si è diffusa nei parchi di divertimenti europei e nelle fiere. Le varianti e le imitazioni di altri produttori sono talvolta conosciute come Trabant o Walzer.`,
    relatedTermIds: ['break-dance', 'flat-ride', 'huss-rides'],
    aliases: ['Troikas', 'Trojka'],
    alternateNames: ['Huss Troika'],
  },
  {
    id: 'swing-ride',
    name: 'Giostra a Catene',
    shortDefinition:
      'Attrazione rotatoria in cui i seggiolini appesi a catene si inclinano verso l’esterno mentre la struttura gira.',
    definition:
      'La giostra a catene (swing ride o Kettenkarussell) è un’attrazione rotante in cui i seggiolini appesi a catene sono fissati a una struttura centrale girevole. Man mano che la struttura accelera, la forza centrifuga spinge i seggiolini verso l’esterno e verso l’alto, e i passeggeri girano sospesi in aria. Le giostre a catene sono tra i più antichi tipi di attrazione da fiera ancora in uso, con origini nei primi anni del Novecento. Le versioni moderne vanno da tranquille giostre per bambini a enormi torri a catene (starflyer) che sollevano i passeggeri a decine di metri di altezza. Sono presenti in quasi tutti i parchi a tema e le fiere del mondo.',
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
      'Un racing coaster ha due circuiti separati ma speculari che corrono in parallelo, con i treni che partono insieme e sembrano fare una gara. I binari si incrociano o si avvicinano in più punti. Alcuni modelli sono a nastro di Möbius: i due circuiti formano un unico anello continuo e i passeggeri tornano in stazione dal lato opposto. Esistono racing coaster sia in legno sia in acciaio. In Europa sono rari; l’esempio più noto è il Grand National del Blackpool Pleasure Beach, un woodie a nastro di Möbius.',
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
      'Un High Five è un elemento di quasi-collisione in cui due treni di montagne russe su binari separati ma molto vicini si incrociano a distanza ravvicinatissima, a volte a portata di mano, e sembra che stiano per scontrarsi. Il nome viene dall’idea che i passeggeri possano allungare la mano e dare il cinque («high five») a quelli dell’altro treno. Perché i due treni arrivino al punto di incrocio nello stesso momento, le partenze devono essere sincronizzate con precisione. I wing coaster e gli inverted coaster si prestano bene all’High Five, perché dai sedili esterni l’altro treno passa ancora più vicino. Duelling Dragons / Dragon Challenge a Universal’s Islands of Adventure ne era un esempio; l’elemento si ritrova oggi su diversi B&M wing coaster in tutto il mondo.',
    relatedTermIds: ['b-and-m', 'inverted-coaster', 'wing-coaster'],
    aliases: ['quasi-collisione', 'near-miss element', 'high 5'],
  },
  {
    id: 'dining-reservation',
    name: 'Prenotazione al ristorante',
    shortDefinition:
      'Una prenotazione anticipata per un ristorante con servizio al tavolo in un parco a tema o in un resort.',
    definition:
      'Una prenotazione ristorante è un tavolo prenotato in anticipo in un ristorante con servizio al tavolo o con i personaggi, in un parco o nei suoi hotel. Nei parchi Disney i ristoranti più richiesti sono spesso pieni per tutta la giornata se non si prenota, e nei periodi di maggiore affluenza non si trova un tavolo libero da nessuna parte.\n\nA Walt Disney World le prenotazioni aprono 60 giorni prima, e chi alloggia negli hotel Disney può da quel momento prenotare per tutto il soggiorno, il che gli dà fino a dieci giorni in più. La prenotazione è garantita da una carta di credito, e la mancata presentazione o la cancellazione dopo il giorno precedente vengono addebitate a persona. I fan Disney chiamano queste prenotazioni ADR, da Advance Dining Reservations.\n\nIn Europa è più semplice: Europa-Park ed Efteling accettano prenotazioni online per i ristoranti, con un anticipo più breve e, nella maggior parte dei locali, senza penale per la mancata presentazione.',
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
    name: 'Ordine da app',
    shortDefinition:
      'Una funzione delle app dei parchi per ordinare e pagare il cibo in anticipo senza fare la fila al banco.',
    definition:
      'L’ordine mobile permette di scegliere dal menu di un ristorante nell’app del parco, pagare lì e ritirare il cibo a un banco separato quando un messaggio avvisa che è pronto, senza fare la coda alla cassa. Alcuni sistemi chiedono di scegliere in anticipo una fascia oraria per il ritiro; altri iniziano a preparare l’ordine quando l’ospite segnala di essere arrivato.\n\nDisney l’ha introdotto nei ristoranti self-service dei suoi parchi americani, e Universal, Six Flags, i parchi Merlin e diversi parchi europei hanno le loro versioni. Le fasce di ritiro più richieste attorno a mezzogiorno possono esaurirsi già a metà mattina, e la coda si sposta dalla cassa al banco di ritiro.\n\nServono un telefono carico e la connessione dati, e dentro i grandi edifici e ai margini di un parco il segnale può essere debole.',
    relatedTermIds: ['dining-reservation', 'quick-service'],
    aliases: ['ordinazione mobile', 'mobile order', 'ordine via app', 'mobile ordering'],
  },
  {
    id: 'food-court',
    name: 'Food Court',
    shortDefinition:
      'Una grande zona ristoro con più banchi self-service di cucine diverse sotto lo stesso tetto.',
    definition:
      'Un food court è una sala con più banchi self-service attorno a un’unica zona con i tavoli, ognuno con il suo menu: pizza a uno, hamburger o noodles a un altro. Un gruppo può dividersi per ordinare e sedersi comunque insieme, e un food court grande ospita diverse centinaia di persone alla volta.\n\nAlcuni sono tematizzati come parte dell’area in cui si trovano; altri sono semplici sale vicino all’ingresso o tra due zone affollate. Si ordina come in qualsiasi ristorante al banco, spesso anche con l’ordine mobile tramite l’app del parco, e non serve prenotare. I prezzi sono quelli degli altri ristoranti al banco del parco.',
    relatedTermIds: ['mobile-ordering', 'quick-service', 'table-service'],
    aliases: ['area ristoro', 'padiglione ristorazione', 'food court', 'zona ristorazione'],
  },
  {
    id: 'capacity-closure',
    name: 'Chiusura per capienza',
    shortDefinition:
      'Quando un parco smette di far entrare nuovi ospiti perché ha raggiunto la capienza massima consentita.',
    definition:
      'Una chiusura per capacità avviene quando dentro un parco ci sono tanti ospiti quanti è autorizzato o in grado di contenerne, e il parco smette di vendere biglietti giornalieri o di far entrare persone ai cancelli finché non ne sono uscite abbastanza. Il limite viene dalla licenza di esercizio e dalle norme di sicurezza, e in pratica da quante persone possono reggere vialetti, bagni e ristoranti.\n\nI parchi lo gestiscono in due modi. Alcuni vendono biglietti datati o chiedono una prenotazione per ogni visita, così il limite si raggiunge sulla pagina di prenotazione settimane prima invece che ai tornelli; in quei giorni vengono respinti anche gli abbonati annuali senza prenotazione. Altri contano gli ospiti ai cancelli e li chiudono per un’ora o due quando il conteggio raggiunge il limite.\n\nLe chiusure cadono ogni anno nelle stesse date: festività nazionali, i weekend più affollati delle vacanze scolastiche, i giorni di apertura di nuove attrazioni e le serate di fuochi d’artificio. I parchi le annunciano nelle loro app e sui social, di solito la mattina stessa.',
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
      'Una variante dello zero-G roll con un cambio di direzione: il treno entra ed esce dall’inversione in direzioni diverse.',
    definition:
      'Lo zero-G winder è uno zero-G roll (una rotazione di 360 gradi su un arco parabolico, con quasi assenza di peso in cima) con in più un cambio di direzione. In uno zero-G roll classico il treno entra ed esce su rotte più o meno parallele; nel winder il binario curva durante la rotazione, e il treno esce in una direzione ben diversa da quella di ingresso. Così l’elemento serve anche a orientare il percorso: il passeggero galleggia come in uno zero-G roll e intanto il treno si gira verso il tratto successivo.\n\nGli zero-G winder si trovano su coaster recenti di produttori come Intamin e B&M. Un esempio è VelociCoaster agli Universal’s Islands of Adventure.',
    relatedTermIds: ['airtime', 'intamin', 'inversion', 'zero-g-roll'],
    aliases: ['zero g winder', 'Zero-G Winder', 'winder'],
  },
  {
    id: 'banana-roll',
    name: 'Banana Roll',
    shortDefinition:
      'Un elemento a doppia inversione allungato e asimmetrico in cui le due inversioni sono collegate da un lungo arco curvo, che dall’alto ha la forma di una banana.',
    definition:
      'Il banana roll è una variante allungata del concetto di doppia inversione, in cui le due inversioni sono più distanziate e collegate da una sezione in curva ampia, anziché dalla geometria stretta e simmetrica di un cobra roll classico. Visto dall’alto, il binario segue un arco graduale attraverso entrambe le inversioni che ricorda la curvatura di una banana. Con la geometria più aperta le due inversioni sono distribuite su un tratto di binario più lungo, e il passaggio è più fluido e meno brusco che in un cobra roll.\n\nIl banana roll è apparso per la prima volta nel 2011 su Takabisha a Fuji-Q Highland, in Giappone, costruito da Gerstlauer. S&S Worldwide ha poi sviluppato una propria variante a doppia inversione per Steel Curtain a Kennywood. Poiché l’elemento richiede molto spazio laterale, si trova soprattutto su installazioni grandi, vicino al suolo, dove il binario può fare un arco ampio tra le due inversioni.',
    relatedTermIds: ['cobra-roll', 'gerstlauer', 'inversion', 's-and-s-worldwide'],
    aliases: ['banana roll'],
  },
  {
    id: 'inclined-loop',
    name: 'Looping Inclinato',
    shortDefinition:
      'Un looping verticale ruotato fuori dal suo asse perpendicolare: il treno ci entra e ne esce di sbieco invece che dritto.',
    definition:
      'Un looping inclinato (in inglese inclined loop o tilted loop) è un looping verticale classico ruotato attorno al proprio asse, solitamente tra 45 e 80 gradi rispetto alla direzione di marcia del treno. Invece di entrare e uscire dal looping in linea retta, come in un looping verticale classico, il treno ci entra e ne esce in diagonale. Il profilo è asimmetrico e le forze sono diverse da quelle di un looping dritto.\n\nCon l’inclinazione l’entrata è più laterale che in un looping standard, e in basso il treno esce in una direzione diversa da quella in cui è entrato. Visto da terra, un looping inclinato si distingue subito da uno dritto. I looping inclinati compaiono su diverse montagne russe di B&M e Intamin, spesso nella parte centrale o finale del percorso.',
    relatedTermIds: ['b-and-m', 'intamin', 'inversion', 'vertical-loop'],
    aliases: ['tilted loop', 'looping storto', 'looping inclinato', 'inclined loop'],
  },
  {
    id: 'sea-serpent',
    name: 'Sea Serpent',
    shortDefinition:
      'Elemento Vekoma a doppia inversione in cui il treno esce nella stessa direzione in cui è entrato.',
    definition:
      'Il sea serpent è un elemento a doppia inversione tipico delle montagne russe invertite di Vekoma. Come il cobra roll, è fatto di due inversioni unite da un tratto centrale, ma con una differenza: il cobra roll gira il treno di 180 gradi, mentre nel sea serpent il treno entra ed esce più o meno nella stessa direzione. Le due inversioni salgono e scendono una dopo l’altra senza invertire la rotta del treno. Visto di lato, l’elemento ha una lunga forma a S, come il corpo di un serpente marino che emerge tra due onde.\n\nI sea serpent si trovano sul Suspended Looping Coaster (SLC) di Vekoma e su alcune installazioni su misura dello stesso produttore. Lo SLC è stato costruito in grande quantità per parchi di tutto il mondo, per cui il sea serpent è uno degli elementi a doppia inversione più diffusi, anche se il suo nome è meno noto di quello del cobra roll.',
    relatedTermIds: ['batwing', 'cobra-roll', 'inversion', 'vekoma'],
    aliases: ['sea serpent', 'roll over'],
  },
  {
    id: 'cobra-loop',
    name: 'Cobra Loop',
    shortDefinition:
      'Il nome dato da Hersheypark alla prima inversione di Storm Runner: un looping da cui il treno esce di lato invece di completarlo.',
    definition:
      'Un cobra loop sale come un looping verticale e poi, in cima, si avvita di lato invece di ridiscendere come farebbe un looping, e il treno esce dall’elemento in una direzione diversa da quella di ingresso. Capovolge i passeggeri una volta.\n\nIl nome appartiene a una sola attrazione. Intamin costruì l’elemento per Storm Runner a Hersheypark nel 2004 e il parco lo presentò come il primo cobra loop al mondo; dal punto di vista geometrico è ciò che altri costruttori chiamano sidewinder. Dove un cobra roll unisce due di queste forme e inverte la marcia del treno, il cobra loop ne è solo la metà.',
    relatedTermIds: ['sidewinder', 'cobra-roll', 'vertical-loop', 'inversion', 'intamin'],
    alternateNames: ['Sidewinder'],
  },
  {
    id: 'jojo-roll',
    name: 'Jojo Roll',
    shortDefinition:
      'Un heartline roll lento, preso appena fuori dalla stazione, prima che il treno abbia salito qualcosa.',
    definition:
      'Un jojo roll è un heartline roll di 360 gradi collocato subito dopo la stazione: il treno si capovolge a poco più della velocità di un passo. Poiché non c’è quasi slancio, i passeggeri restano appesi alle protezioni invece di essere premuti sul sedile, il contrario di quello che succede con la stessa figura presa a piena velocità più avanti nel tracciato.\n\nHydra: The Revenge a Dorney Park lo introdusse nel 2005. L’elemento fu proposto dal responsabile della manutenzione e delle costruzioni del parco, Joe Greene, da cui prende il nome. Anche Copperhead Strike a Carowinds ne ha uno.',
    relatedTermIds: ['heartline-roll', 'inversion', 'hangtime', 'lifthill'],
    aliases: ['Jojo Rolls', 'JoJo Roll'],
  },
  {
    id: 'flying-snake-dive',
    name: 'Flying Snake Dive',
    shortDefinition:
      'Un heartline roll che sfocia direttamente in una picchiata avvitata: due inversioni che scagliano il treno di lato.',
    definition:
      'In un flying snake dive il treno attraversa un heartline roll e, senza mai tornare in piano, precipita in una picchiata avvitata che lo spedisce nella direzione opposta. Conta come due inversioni, così ravvicinate che raramente si distingue dove finisce la prima e comincia la seconda.\n\nIntamin progettò l’elemento nel 2005 per Maverick a Cedar Point, che però non lo ebbe mai. Le prove mostrarono che avrebbe sottoposto i passeggeri a forze eccessive, così fu eliminato e sostituito da una curva a S prima dell’apertura del 2007. Il nome è sopravvissuto all’attrazione per cui era stato disegnato. Lo si percorre davvero su Storm Runner a Hersheypark, costruito tre anni prima: un heartline roll seguito da un mezzo Immelmann che si tuffa verso il torrente.',
    relatedTermIds: ['heartline-roll', 'dive-drop', 'immelmann', 'inversion', 'intamin'],
  },
  {
    id: 'barrel-roll-drop',
    name: 'Barrel Roll Drop',
    shortDefinition:
      'Elemento tipico di RMC che unisce la prima discesa e un barrel roll completo in un’unica sequenza: i passeggeri sono a testa in giù mentre stanno ancora scendendo.',
    definition:
      'Il barrel roll drop è un elemento tipico di Rocky Mountain Construction che unisce in un’unica sequenza due cose di solito separate: la prima discesa e un’inversione completa. Dopo il lifthill il binario fa compiere al treno un barrel roll completo mentre scende. I passeggeri sono del tutto capovolti vicino al punto più ripido della discesa e tornano dritti quando il treno arriva in fondo e prosegue nel resto del percorso.\n\nL’elemento è possibile grazie al binario in acciaio I-Box di RMC, che permette i raggi stretti e la geometria complessa necessari per ruotare e scendere nello stesso momento; su un binario tradizionale in legno non si potrebbe fare. Medusa Steel Coaster al Six Flags Mexico è stata tra le prime attrazioni ad averlo; altri esempi sono Steel Vengeance al Cedar Point e Zadra all’Energylandia.',
    relatedTermIds: ['first-drop', 'hybrid-coaster', 'inversion', 'rmc', 'stall'],
    aliases: ['barrel roll drop', 'RMC barrel roll', 'barrel roll downdrop'],
  },
  {
    id: 'mcbr',
    name: 'MCBR',
    shortDefinition:
      'Mid-Course Brake Run: una zona frenante a metà percorso che può fermare completamente il treno per consentire un’operazione sicura con più treni.',
    definition:
      'Un mid-course brake run (MCBR) è una sezione frenante a metà del percorso di una montagna russa, dopo i primi grandi elementi e prima della sequenza finale. A differenza dei trim brake, che si limitano a ridurre la velocità lasciando proseguire immediatamente il treno, un MCBR è un freno di blocco completo: può fermare il treno del tutto e tenerlo in attesa finché la successiva sezione di blocco non viene confermata libera. Così possono girare più treni insieme sullo stesso circuito senza rischio di collisione, e la capacità dell’attrazione cresce di molto.\n\nQuando tutti i treni girano pieni e la stazione lavora a ritmo, l’MCBR rilascia il treno quasi subito e i passeggeri notano appena il rallentamento. Nelle giornate più tranquille, con meno treni in circolazione, la sosta può durare di più ed essere più brusca. Gli MCBR sono standard sulla maggior parte delle grandi montagne russe: li hanno gli inverted e i floorless di B&M, molte attrazioni Intamin e altre attrazioni ad alta capacità.',
    relatedTermIds: ['block-brake', 'brake-run', 'ride-capacity', 'stacking', 'trim-brake'],
    aliases: ['mid-course brake run', 'freno di metà percorso', 'freno intermedio', 'MCBR'],
  },
  {
    id: 'interlocking-loops',
    name: 'Loop Intrecciati',
    shortDefinition:
      'Due looping verticali i cui piani si incrociano, come due anelli di una catena o un otto.',
    definition:
      'I loop intrecciati (in inglese interlocking loops) sono due looping verticali posizionati in modo che i loro piani strutturali si intersechino, tipicamente ad angoli quasi perpendicolari. Da certe angolazioni un looping sembra attraversare l’altro, come due anelli di una catena o un enorme otto che sorge dal terreno. Far incrociare due looping senza che i binari si tocchino richiede una struttura complessa, e l’elemento si vede da lontano nel parco.\n\nI loop intrecciati si trovano su montagne russe con molte inversioni. L’esempio classico è Loch Ness Monster a Busch Gardens Williamsburg (Arrow, 1978).',
    relatedTermIds: ['arrow-dynamics', 'inversion', 'vertical-loop'],
    aliases: ['loop intrecciati', 'interlocking loops', 'loop incrociati'],
  },
  {
    id: 'anti-rollback',
    name: 'Anti-Rollback',
    shortDefinition:
      'Il dispositivo a cricchetto sul lifthill che impedisce al treno di tornare indietro; è lui a fare il clic-clac che si sente in salita.',
    definition:
      'Un anti-rollback (detto anche «cane anti-rollback») è un meccanismo di sicurezza meccanico installato lungo la parte inferiore di un lifthill. Mentre il treno sale, dei denti metallici a molla scattano su una serie di tacche integrate nella struttura del lifthill. In caso di guasto alla catena o al motore, i denti si bloccano nelle tacche e immobilizzano il treno, impedendogli di scorrere all’indietro. Il passaggio dei denti sulle tacche produce il ritmico clic-clac delle montagne russe tradizionali.\n\nSulle montagne russe moderne con lifthill a cavo o a propulsione LSM, gli anti-rollback vengono spesso sostituiti da freni elettromagnetici silenziosi, e per questo alcuni lifthill nuovi sono molto più silenziosi.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'rollback'],
    aliases: ['anti-rollback device', 'cricchetto anti-arretramento', 'clic-clac'],
  },
  {
    id: 'head-choppers',
    name: 'Head Choppers',
    shortDefinition:
      'Strutture che passano appena sopra la testa dei passeggeri mentre il treno va veloce, così che sembra stiano per colpirli.',
    definition:
      'I head choppers sono elementi di design intenzionali in cui la struttura portante, le traverse, i tunnel o altre sezioni di binario passano subito sopra la testa dei passeggeri mentre il treno va a piena velocità. Sembra che qualcosa stia per colpire i passeggeri, ma non c’è pericolo: lo spazio libero è calcolato con precisione. L’effetto è più forte quando il passeggero non se lo aspetta.\n\nCi sono head choppers soprattutto sulle montagne russe in legno molto compatte e sugli inverted coaster, dove i passeggeri appesi sotto il binario passano vicino alle travi di supporto e ad altri tratti di binario.',
    relatedTermIds: ['inverted-coaster', 'roller-coaster-element', 'twister-coaster'],
    aliases: ['head chopper', 'quasi impatto'],
  },
  {
    id: 'stapling',
    name: 'Stapling',
    shortDefinition:
      'Quando un operatore preme troppo la barra o il dispositivo di sicurezza contro il passeggero, che sta scomodo e perde l’airtime per cui l’attrazione è costruita.',
    definition:
      'Lo stapling è quando un operatore spinge una barra addominale o un dispositivo sulle spalle molto più giù di quanto serva per la sicurezza, fino a premere il passeggero nel sedile. Il nome viene dall’inglese to staple, pinzare: si resta fissati al sedile come con una graffetta. Su un coaster da airtime il dispositivo deve lasciare un po’ di spazio, così che in cima alle colline il passeggero si sollevi dal sedile; chi è «pinzato» resta schiacciato giù su ogni collina.\n\nPesa di più sulle montagne russe in legno e ibride, dove l’airtime è il motivo per salire. Quanto vengano spinte le barre cambia da parco a parco e da operatore a operatore nella stessa stazione. Sulla maggior parte dei coaster moderni i passeggeri chiudono la barra da soli e l’operatore controlla solo che sia bloccata; alcuni parchi fanno spingere ogni barra di uno scatto in più, per prassi.\n\nI dispositivi si bloccano a scatti, e un passeggero non può sbloccare una barra spinta troppo giù. Resta dov’è fino alla fine della corsa.',
    relatedTermIds: [
      'airtime',
      'ejector-airtime',
      'lap-bar',
      'restraint-freedom',
      'shoulder-harness',
    ],
    aliases: ['stapled', 'ritenuta troppo stretta', 'barra troppo stretta'],
  },
  {
    id: 'valleying',
    name: 'Valleying',
    shortDefinition:
      'Quando un treno perde così tanta velocità durante la corsa da restare bloccato in un punto basso del binario, senza poter completare il percorso.',
    definition:
      'Il valleying è un treno di montagna russa che si ferma in un avvallamento del binario perché ha finito l’energia prima della collina o dell’elemento successivo. Si blocca in salita, torna indietro e oscilla fino a fermarsi nel punto più basso tra due creste. Lì non ci sono freni né trazione, quindi i sistemi dell’attrazione non possono rimettere in moto il treno.\n\nIl personale della manutenzione fa allora scendere i passeggeri con scale o passerelle, e spinge o tira con un argano il treno oltre la cresta successiva, oppure lo riporta indietro. L’attrazione resta ferma per ore.\n\nLe montagne russe sono progettate con un margine di velocità, e il valleying è raro. Diventa più probabile con il freddo, quando il grasso nei cuscinetti delle ruote si indurisce e il treno va più piano, con un treno poco carico su un’attrazione tarata per treni pieni, dopo che un trim brake ha tolto troppa velocità, o su una vecchia montagna russa in legno il cui binario si è assestato.',
    relatedTermIds: ['brake-run', 'downtime', 'rollback', 'trim-brake'],
    aliases: ['valleyed', 'treno bloccato', 'treno incagliato'],
  },
  {
    id: 'wild-mouse',
    name: 'Wild Mouse',
    shortDefinition:
      'Un tipo di montagna russa con piccoli veicoli individuali e un percorso compatto di curve strette e piatte ai bordi di piattaforme sopraelevate.',
    definition:
      'Un wild mouse utilizza piccoli veicoli da due a quattro persone anziché lunghi treni. Il tratto tipico è una serie di curve a forcina strette e poco inclinate, all’estremo bordo della struttura. A differenza delle curve molto sopraelevate di altre montagne russe, queste spingono i passeggeri di lato contro la parete del veicolo. I veicoli sono spesso più larghi del binario, e in ogni curva sembra che stiano per uscire dal bordo.\n\nLe wild mouse occupano poco spazio: le curve a forcina sono su più livelli sovrapposti, e in un’area piccola ci sta molto binario. Si trovano in parchi di tutto il mondo. Tra i produttori ci sono Mack Rides, Maurer e Gerstlauer.',
    relatedTermIds: [
      'bobsled-coaster',
      'gerstlauer',
      'mack-rides',
      'spinning-coaster',
      'steel-coaster',
    ],
    aliases: ['wild mouse coaster', 'topolino impazzito', 'Wilde Maus'],
  },
  {
    id: 'fourth-dimension-coaster',
    name: '4D Coaster',
    shortDefinition:
      'Un tipo di montagna russa i cui sedili sono montati su braccia rotanti che si estendono ai lati del treno, e possono ruotare indipendentemente dalla direzione di marcia.',
    definition:
      'Una montagna russa 4D (quarta dimensione) è un progetto in cui i sedili dei passeggeri non sono fissati rigidamente al treno, bensì montati su braccia girevoli che si estendono a sinistra e a destra di ogni carro. I sedili possono ruotare in avanti o all’indietro indipendentemente dalla direzione del treno. La rotazione è comandata da un binario guida fisso accanto al binario principale, che decide la posizione del sedile in ogni punto del percorso, oppure è libera e dipende dalla gravità e dal peso dei passeggeri. Così i passeggeri possono guardare verso il basso in una discesa, finire capovolti in una curva o ruotare su più assi insieme durante le inversioni.\n\nIl concetto fu sviluppato da Arrow Dynamics e perfezionato poi da S&S Worldwide. X2 al Six Flags Magic Mountain, in California, è stata la prima montagna russa 4D al mondo, inaugurata nel 2002. Su Eejanaika a Fuji-Q Highland, in Giappone, la rotazione dei sedili aggiunge inversioni al conteggio.',
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
      'Un tracciato che si allontana dalla stazione in linea più o meno retta, inverte la direzione in fondo e torna su un percorso parallelo.',
    definition:
      'L’out-and-back è uno dei due tracciati di base delle montagne russe. Il treno lascia la stazione, si allontana lungo una linea più o meno dritta, di solito su una serie di colline disegnate per l’airtime, inverte la direzione in fondo al terreno e torna lungo un percorso simile, più o meno parallelo a quello di andata. I due tratti si incrociano di rado, e la pianta è lunga e stretta, a differenza del più compatto tracciato twister.\n\nGli out-and-back sono tipici delle montagne russe in legno tradizionali. La velocità presa sulle grandi colline dell’andata si spende al ritorno su colline più piccole che danno floater airtime. Ogni collina è disegnata per la velocità che il treno avrà quando ci arriva: poiché il treno perde energia lungo il percorso, le colline del ritorno sono più basse e più ravvicinate, così che il treno galleggi ancora su ciascuna. Tra gli out-and-back in legno ci sono The Voyage a Holiday World, Comet a The Great Escape e le varie versioni del tipo Racer. Anche le montagne russe in acciaio possono seguire un tracciato out-and-back, ma in acciaio è meno comune che in legno.',
    relatedTermIds: ['airtime', 'airtime-hill', 'twister-coaster', 'wooden-coaster'],
    aliases: ['out and back', 'tracciato out-and-back', 'andata e ritorno'],
  },
  {
    id: 'twister-coaster',
    name: 'Twister',
    shortDefinition:
      'Un tracciato di montagna russa che gira, si avvolge e si incrocia su se stesso, con molti elementi in poco spazio.',
    definition:
      'Un twister (detto anche layout a ciclone) è una montagna russa in cui il binario gira a spirale, si ripiega su se stesso e si incrocia più volte, invece di seguire i due tratti semplici di un out-and-back. Il treno passa spesso molto vicino ad altri tratti dello stesso percorso, in direzioni e ad altezze diverse, e ci sono molti head chopper.\n\nUn twister fa stare molto binario e molto dislivello in poco spazio, e per questo lo si costruisce spesso nei parchi che hanno poco terreno. Tra i twister in legno classici c’è il Twister del Gröna Lund a Stoccolma; tra quelli in acciaio, molti coaster di B&M e Intamin.',
    relatedTermIds: ['head-choppers', 'helix', 'out-and-back', 'wooden-coaster'],
    aliases: ['twister layout', 'ciclone', 'montagna russa twister'],
  },
  {
    id: 'mae',
    name: 'MAE',
    shortDefinition:
      'Mean Absolute Error: lo scarto medio in minuti tra il tempo di attesa previsto e quello reale.',
    definition:
      'Il MAE (Mean Absolute Error, errore assoluto medio) è la misura di precisione standard di park.fan. È la differenza media, in minuti, tra ogni tempo di attesa previsto e quello registrato davvero all’attrazione. Un MAE di 8 minuti significa che le previsioni si discostano in media di 8 minuti dal tempo di attesa reale.\n\nIl MAE tratta ogni errore allo stesso modo: un errore di 5 minuti e uno di 15 entrano nella media con lo stesso peso per minuto. Per questo si legge facilmente: MAE = 10 vuol dire che le previsioni sono in genere entro 10 minuti dal tempo reale. Un MAE più basso indica sempre previsioni più accurate.',
    relatedTermIds: ['ai-forecast', 'mape', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Error'],
  },
  {
    id: 'rmse',
    name: 'RMSE',
    shortDefinition:
      'Root Mean Square Error: simile al MAE ma penalizza maggiormente i grandi errori di previsione.',
    definition:
      'Il RMSE (Root Mean Square Error, radice dell’errore quadratico medio) misura la precisione elevando al quadrato ogni errore prima di calcolare la media. Gli errori grandi, come una coda prevista con 40 minuti di scarto, pesano sul RMSE molto più di un errore di 5 minuti. Il RMSE è sempre uguale o maggiore del MAE.\n\nUna grande differenza tra RMSE e MAE indica che il modello produce occasionalmente errori estremi, anche se la maggior parte delle previsioni è vicina alla realtà. Entrambe le metriche sono visibili in tempo reale sulla homepage di park.fan.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'r-squared'],
    aliases: ['Root Mean Square Error'],
  },
  {
    id: 'mape',
    name: 'MAPE',
    shortDefinition:
      'Mean Absolute Percentage Error: l’errore di previsione espresso come percentuale del tempo di attesa reale.',
    definition:
      'Il MAPE (Mean Absolute Percentage Error, errore percentuale assoluto medio) esprime la precisione come percentuale invece che in minuti. Invece di «8 minuti di scarto» indica «uno scarto del 15 % del tempo di attesa reale». Così si possono confrontare attrazioni con tempi di attesa molto diversi: un errore di 10 minuti è molto più grave su un’attrazione con 15 minuti abituali che su una con 90.\n\nIl MAPE può essere ingannevolmente alto quando i tempi di attesa reali sono molto brevi. Per questo park.fan lo mostra sempre insieme a MAE e RMSE.',
    relatedTermIds: ['ai-forecast', 'mae', 'r-squared', 'rmse'],
    aliases: ['Mean Absolute Percentage Error'],
  },
  {
    id: 'r-squared',
    name: 'R²',
    shortDefinition:
      'R al quadrato: misura quanto bene il modello IA spiega l’andamento dei tempi di attesa reali (da 0 a 1, più alto è meglio).',
    definition:
      'L’R² (R al quadrato, o coefficiente di determinazione) misura quanta parte della variazione nei tempi di attesa reali il modello riesce a spiegare. Un valore di 1,0 significherebbe previsioni perfette; 0,0 significa che il modello non spiega nulla oltre una semplice media. In pratica, valori superiori a 0,7 indicano un buon modello; superiori a 0,9, eccellente.\n\nPer le previsioni dei tempi di attesa, raggiungere un R² elevato è difficile perché le code sono influenzate da fattori imprevedibili. Il valore R² su park.fan esce dal confronto di tutte le previsioni ricontrollate e si ricalcola ogni giorno.',
    relatedTermIds: ['ai-forecast', 'mae', 'mape', 'rmse'],
    aliases: ['R-squared', 'coefficiente di determinazione'],
  },
  {
    id: 'seasonal-attraction',
    name: 'Attrazione stagionale',
    shortDefinition:
      'Un’attrazione, uno show o un’altra offerta del parco che funziona solo in determinati mesi dell’anno, come una pista di pattinaggio in inverno o uno scivolo d’acqua in estate.',
    definition:
      'Un’attrazione stagionale è un’attrazione, uno show o un’altra offerta che il parco propone solo in un periodo definito dell’anno. Le piste di pattinaggio, le piste di slittamento e gli show invernali funzionano tipicamente da novembre a febbraio; i rapid river, le zone giochi d’acqua e gli spettacoli all’aperto da maggio a settembre. Alcune attrazioni stagionali sono legate a eventi specifici come Halloween o il Natale.\n\nSu park.fan, le attrazioni e gli show stagionali vengono identificati automaticamente in base ai dati storici e nascosti nelle schede del parco e sulla mappa quando sono fuori dai loro mesi di apertura, così nelle schede resta quello che oggi è davvero aperto. Un badge stagionale (Inverno, Estate o generico) appare su ogni scheda interessata. Quando l’attrazione è fuori stagione, il badge è attenuato. Un pulsante di filtro nelle schede consente di mostrare le voci nascoste quando necessario.',
    relatedTermIds: ['crowd-calendar', 'offseason', 'refurbishment'],
    aliases: ['giostra stagionale', 'show stagionale', 'esperienza stagionale'],
  },
  {
    id: 'gravity-group',
    name: 'The Gravity Group',
    shortDefinition:
      'Azienda statunitense specializzata nella progettazione di moderni roller coaster in legno.',
    definition:
      'The Gravity Group è uno studio di ingegneria statunitense fondato nel 2002 da ex ingegneri della Custom Coasters International. Tra le sue novità per i wooden coaster ci sono i treni Timberliner, che affrontano curve più strette e percorsi più complessi dei treni tradizionali. Tra i suoi coaster ci sono The Voyage (Holiday World) e Hades 360 (Mt. Olympus), con elementi moderni su strutture in legno.',
    relatedTermIds: ['cci', 'hybrid-coaster', 'rmc', 'wooden-coaster'],
    aliases: ['Gravity Group'],
  },
  {
    id: 'sally-dark-rides',
    name: 'Sally Dark Rides',
    shortDefinition: 'Produttore di dark ride interattive e animatronici.',
    definition:
      'Sally Dark Rides (prima Sally Corporation) è un’azienda con sede in Florida che crea dark ride interattive, animatronici e attrazioni a tema per parchi di divertimento in tutto il mondo. Ha sviluppato la serie «Justice League: Battle for Metropolis» nei parchi Six Flags e molte attrazioni su Scooby-Doo. Le sue attrazioni uniscono spesso scenografie, animatronici e pistole laser con cui i passeggeri colpiscono bersagli e fanno punti.',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride'],
    aliases: ['Sally Corporation', 'Sally Corp'],
  },
  {
    id: 'mondial',
    name: 'Mondial',
    shortDefinition:
      'Produttore olandese noto per flat ride ad alta intensità e ruote panoramiche giganti.',
    definition:
      'Mondial Rides è un produttore olandese di attrazioni meccaniche (flat ride) per parchi fissi e fiere itineranti. Tra i suoi modelli più noti ci sono il Top Scan, lo Shake e il Capriolo. Le sue attrazioni si muovono su più assi insieme, e l’azienda produce anche alcune delle più grandi ruote panoramiche trasportabili al mondo.',
    relatedTermIds: ['flat-ride', 'huss-rides', 'top-spin'],
    aliases: ['Mondial Rides'],
  },
  {
    id: 'kmg',
    name: 'KMG',
    shortDefinition: 'Un produttore olandese noto per flat ride trasportabili e di alta qualità.',
    definition:
      'KMG è un’azienda olandese, fondata nel 1989 da Isje Kroon a Neede, specializzata nella progettazione e costruzione di attrazioni per fiere itineranti. Le sue attrazioni si montano in fretta, senza gru pesanti. Il prodotto più noto è l’Afterburner (spesso chiamato Fireball), un’attrazione a pendolo con sedili rivolti verso l’interno che oscillano e ruotano. Altri modelli sono il Freak Out e lo Speed.',
    relatedTermIds: ['flat-ride', 'mondial', 'pendulum-ride'],
    aliases: ['KMG Rides'],
  },
  {
    id: 'oceaneering',
    name: 'Oceaneering',
    shortDefinition: 'Azienda tecnologica che produce sistemi di trasporto avanzati per dark ride.',
    definition:
      'Oceaneering Entertainment Systems (OES) è una divisione di Oceaneering International che porta nei parchi a tema tecnologie nate per la robotica subacquea. Ha creato i veicoli con piattaforma mobile (motion base) usati in attrazioni come «The Amazing Adventures of Spider-Man» e «Transformers: The Ride» (Universal Studios). Questi veicoli si muovono in sincronia con le proiezioni 3D, e li usano molte dark ride moderne. Nel maggio 2025 la divisione è stata acquisita da Falcon’s Beyond.',
    relatedTermIds: ['dark-ride', 'motion-simulator', 'trackless-ride'],
    aliases: ['Oceaneering Entertainment Systems', 'OES', 'Oceaneering International'],
  },
  {
    id: 'etf-ride-systems',
    name: 'ETF Ride Systems',
    shortDefinition:
      'Produttore olandese di sistemi di trasporto per dark ride, tra i primi a sviluppare veicoli trackless.',
    definition:
      'ETF Ride Systems è un’azienda olandese specializzata in sistemi di trasporto per attrazioni a tema e musei. È stata tra le prime a sviluppare veicoli «trackless» (senza binari), che si muovono da soli seguendo guide magnetiche o fili nel pavimento. Così i percorsi possono cambiare e i movimenti sono fluidi, per esempio in Symbolica (Efteling) o Ratatouille: The Adventure (Disneyland Paris).',
    relatedTermIds: ['dark-ride', 'oceaneering', 'trackless-ride'],
    aliases: ['ETF'],
  },
  {
    id: 'chance-rides',
    name: 'Chance Rides',
    shortDefinition:
      'Produttore statunitense di roller coaster, ruote panoramiche e trenini per parchi.',
    definition:
      'Chance Rides è uno storico produttore americano con sede in Kansas. L’azienda produce una vasta gamma di attrazioni, dalle classiche ruote panoramiche e caroselli ai moderni roller coaster. Ha lavorato con D.H. Morgan agli hypercoaster ed è nota per i trenini in miniatura che portano i visitatori in giro per zoo e parchi a tema. Un suo coaster recente è Lightning Run (Kentucky Kingdom).',
    relatedTermIds: ['arrow-dynamics', 'flat-ride', 'hyper-coaster', 'morgan', 'steel-coaster'],
    aliases: ['Chance Morgan', 'Chance Manufacturing'],
  },
  {
    id: 'non-inverting-loop',
    name: 'Non-Inverting Loop',
    shortDefinition:
      'Una figura di roller coaster che imita la forma di un loop senza capovolgere i passeggeri.',
    definition:
      'Il Non-Inverting Loop è un elemento introdotto da Maurer Rides (ad esempio su Hollywood Rip Ride Rockit). A differenza di un loop verticale classico, il binario ruota mentre sale, in modo che nel punto più alto i passeggeri rimangano dritti invece di trovarsi a testa in giù. In cima c’è airtime, laterale e verticale, e da fuori l’elemento sembra un grande cerchio.',
    relatedTermIds: ['airtime', 'inversion', 'vertical-loop'],
    aliases: ['loop non invertito', 'giro della morte non invertito'],
  },
  {
    id: 'pretzel-knot',
    name: 'Pretzel Knot',
    shortDefinition:
      'Una doppia inversione che ricorda la forma di un pretzel, tipica dei coaster con tracciato complesso.',
    definition:
      'Il Pretzel Knot è una combinazione di due inversioni che formano una figura a «X» o a forma di pretzel. Spesso serve a far cambiare direzione al treno mentre lo capovolge due volte in rapida successione. Non va confuso con il Pretzel Loop dei flying coaster: il Knot si trova di solito su coaster seduti o invertiti. Un esempio è su Moonsault Scramble (Fuji-Q Highland).',
    relatedTermIds: ['corkscrew', 'inversion', 'pretzel-loop'],
    aliases: ['nodo a pretzel'],
  },
  {
    id: 'raven-turn',
    name: 'Raven Turn',
    shortDefinition:
      'Una mezza inversione che termina con il treno che viaggia nella direzione opposta, tipica dei coaster 4D.',
    definition:
      'Il Raven Turn si trova sui roller coaster quadridimensionali (4D) e sui coaster ala (Wing). È un mezzo loop che non viene completato: il treno cambia direzione di 180 gradi. A seconda della rotazione dei sedili, il passeggero lo percorre verso l’esterno o verso l’interno. Si trova in attrazioni come X2 (Six Flags Magic Mountain) o Eejanaika (Fuji-Q Highland).',
    relatedTermIds: ['fourth-dimension-coaster', 'inversion', 'wing-coaster'],
    aliases: ['curva raven'],
  },
  {
    id: 'dive-drop',
    name: 'Dive Drop',
    shortDefinition: 'Un’inversione lenta subito dopo la cima del lift, comune sui Wing Coaster.',
    definition:
      'Il Dive Drop è un elemento tipico dei Wing Coaster di B&M (come Raptor a Gardaland). Appena uscito dalla catena di risalita (lift hill), il treno ruota lentamente di 180 gradi su se stesso prima di tuffarsi in picchiata nella prima discesa. Prima della discesa i passeggeri restano a lungo appesi di lato, fuori dal binario (hangtime).',
    relatedTermIds: ['first-drop', 'hangtime', 'inversion', 'wing-coaster'],
    aliases: ['caduta in tuffo'],
  },
  {
    id: 'outerbanked-turn',
    name: 'Outerbanked Turn',
    shortDefinition:
      'Una curva inclinata verso l’esterno invece che verso l’interno, che genera forze laterali intense.',
    definition:
      'L’Outerbanked Turn è un elemento moderno (diffuso da RMC) in cui il binario è inclinato nella direzione opposta a quella della curva. Invece di premere i passeggeri nel sedile (forze positive), questa inclinazione li spinge verso l’esterno: airtime e spinta laterale insieme.',
    relatedTermIds: ['airtime', 'lateral-gs', 'overbank', 'rmc'],
    aliases: ['curva contro-inclinata'],
  },
  {
    id: 'camelback',
    name: 'Camelback',
    shortDefinition: 'Una serie di gobbe o colline disegnate per dare airtime.',
    definition:
      'Un camelback è una grande collina arrotondata nel tracciato di una montagna russa, a forma della gobba da cui prende il nome. Il treno la sale, supera la cresta e scende dall’altra parte senza curve né cambi di inclinazione. Quando la cresta è disegnata come una parabola che coincide con la traiettoria di caduta del treno, i passeggeri si sollevano appena dal sedile per un secondo o due: è il floater airtime. Una cresta più stretta presa a velocità più alta trasforma lo stesso tipo di collina in ejector airtime.\n\nI camelback sono l’elemento base degli hypercoaster out-and-back, che ne mettono in fila diversi all’andata e al ritorno. Ognuno è un po’ più basso del precedente, perché il treno perde energia lungo il percorso. Silver Star a Europa-Park (B&M, 2002) fa seguire al primo drop un grande camelback; Magnum XL-200 a Cedar Point (Arrow, 1989) finisce con una fila di camelback piccoli.',
    relatedTermIds: ['airtime', 'airtime-hill', 'hyper-coaster', 'quad-down'],
    aliases: ['gobba di cammello', 'camelbacks'],
  },
  {
    id: 'zero-g-stall',
    name: 'Zero-G Stall',
    shortDefinition:
      'Un’inversione allungata in cui il treno resta a testa in giù per diversi metri, a gravità quasi zero.',
    definition:
      'Lo Zero-G Stall è un’evoluzione dello Zero-G Roll. Invece di completare rapidamente la rotazione, il binario rimane dritto mentre è capovolto di 180 gradi per una sezione orizzontale. In questo tratto i passeggeri galleggiano del tutto (0 G), appesi a testa in giù ai sedili. Si trova su coaster RMC come Wildfire o Goliath.',
    relatedTermIds: ['hangtime', 'inversion', 'rmc', 'stall', 'zero-g-roll'],
    aliases: ['stall a zero-g'],
  },
  {
    id: 'gp',
    name: 'GP (General Public)',
    shortDefinition:
      'Termine gergale usato dagli appassionati per indicare i visitatori comuni dei parchi.',
    definition:
      'GP è la sigla di «General Public» (pubblico generale). Gli appassionati (enthusiasts) lo usano per i visitatori che non conoscono i dettagli tecnici o la terminologia delle attrazioni. Spesso il termine è scherzoso o un po’ sprezzante, per esempio quando un visitatore chiama ogni giostra «roller coaster» o crede che un giro della morte sia pericoloso se il treno si ferma.',
    relatedTermIds: ['credit', 'ert', 'fanboy', 'hype-train', 'mackprodukt', 'touring-plan'],
    aliases: ['pubblico generale', 'visitatori comuni'],
  },
  {
    id: 'strata-coaster',
    name: 'Strata Coaster',
    shortDefinition:
      'Una montagna russa con un’altezza o una discesa oltre i 400 piedi (122 metri).',
    definition:
      'Uno Strata Coaster è una montagna russa che raggiunge i 400 piedi (122 metri) o più. La classificazione è stata coniata da Cedar Point per l’apertura di Top Thrill Dragster. Gli Strata Coaster sono rarissimi, per via del costo enorme e della complessità tecnica: finora ne è stata costruita solo una manciata, tra cui Kingda Ka a Six Flags Great Adventure, chiuso nel 2024 e demolito nel 2025.',
    relatedTermIds: ['giga-coaster', 'hyper-coaster', 'launch-coaster'],
    aliases: ['Strata Coasters'],
  },
  {
    id: 'dispatch',
    name: 'Dispatch',
    shortDefinition:
      'L’atto di inviare un treno fuori dalla stazione per iniziare il suo percorso.',
    definition:
      'Il Dispatch è il momento in cui gli operatori della stazione fanno partire il treno, dopo aver controllato le chiusure e le barre di sicurezza. Dal «dispatch time» (il tempo tra due partenze) si capisce quanto lavora in fretta la stazione. Partenze lente allungano le code e causano lo «stacking» (treni fermi sui freni finali in attesa che la stazione si liberi).',
    relatedTermIds: ['queue-line', 'ride-capacity', 'stacking'],
    aliases: ['partenza', 'invio del treno'],
  },
  {
    id: 'near-miss',
    name: 'Near-Miss',
    shortDefinition:
      'Effetto scenografico in cui il binario passa molto vicino a una struttura, simulando una collisione imminente.',
    definition:
      'Un Near-Miss (mancata collisione) è un passaggio in cui il binario è progettato per sfiorare a pochi centimetri supporti, tunnel, rocce o scenografie. I passeggeri restano sempre dentro il «clearance envelope» (lo spazio di sicurezza), ma con la velocità e la prospettiva sembra che stiano per colpire l’ostacolo. È un trucco visivo molto usato nelle dark ride e nei coaster moderni.',
    relatedTermIds: ['clearance-envelope', 'foot-chopper', 'head-choppers'],
    aliases: ['effetto sfioramento', 'collisione sfiorata', 'near miss'],
  },
  {
    id: 'clearance-envelope',
    name: 'Sagoma limite',
    shortDefinition:
      'Lo spazio di sicurezza invisibile attorno al binario che deve rimanere libero da ostacoli.',
    definition:
      'La sagoma limite (clearance envelope) è l’area calcolata dagli ingegneri che circonda il treno e i passeggeri durante tutto il percorso. Considera l’estensione massima delle braccia e delle gambe dei visitatori più alti. Nessun oggetto fisso (supporti, rocce, rami) può trovarsi all’interno di questo spazio. Durante i test, viene spesso usato un prototipo di legno con la forma della sagoma limite per assicurarsi che nulla venga colpito.',
    relatedTermIds: ['foot-chopper', 'head-choppers', 'near-miss', 'testing'],
    aliases: ['clearance envelope', 'spazio di sicurezza'],
  },
  {
    id: 'testing',
    name: 'Collaudo',
    shortDefinition:
      'I giri che un’attrazione compie a vuoto: prima dell’apertura, ogni mattina e dopo ogni riparazione.',
    definition:
      'Il collaudo è tutto ciò che separa un’attrazione finita da un treno carico. Nella messa in servizio manichini pieni d’acqua o sacchi di sabbia prendono il posto dei passeggeri, il sistema viene provato per migliaia di cicli e le verifiche della sagoma limite confermano che lungo il tracciato non ci sia nulla di abbastanza vicino da poter essere sfiorato con un braccio teso.\n\nNon finisce mai davvero. I parchi fanno girare l’attrazione a vuoto ogni mattina prima dei primi ospiti, e di nuovo dopo ogni fermo o manutenzione: per questo un’attrazione può risultare aperta senza far salire nessuno. Le novità si collaudano in piena vista, con i treni che passano sopra la testa dei visitatori per settimane prima dell’apertura. Anche un soft opening è un collaudo, stavolta con passeggeri veri.',
    relatedTermIds: ['clearance-envelope', 'soft-opening', 'downtime', 'refurbishment'],
    aliases: ['Test runs', 'Test cycles'],
  },
  {
    id: 'kuka',
    name: 'KUKA',
    shortDefinition:
      'Un costruttore tedesco di robot industriali i cui bracci da fabbrica sono stati adattati per portare passeggeri.',
    definition:
      'KUKA (sigla di Keller und Knappich Augsburg, la città dove ha tuttora sede) produce i bracci robotici arancioni delle linee di montaggio automobilistiche. Il modello pesante KR 500 è stato adattato alle attrazioni con il nome di RoboCoaster: una panca a quattro posti imbullonata all’estremità del braccio, che può beccheggiare, rollare e muovere i passeggeri in modi che nessun binario fisso permette.\n\nL’installazione più nota è Harry Potter and the Forbidden Journey, aperta nel 2010, dove le panche RoboCoaster G2 sono montate su basi mobili: i bracci attraversano quindi le scenografie invece di muoversi fermi in un punto. Sum of All Thrills a Epcot (2009–2016) rovesciava il principio: gli ospiti disegnavano il profilo del proprio ottovolante a un terminale e un braccio KUKA su misura lo percorreva.',
    relatedTermIds: ['dynamic-attractions', 'dark-ride', 'motion-simulator', 'flying-theater'],
    alternateNames: ['Keller und Knappich Augsburg'],
    aliases: ['Keller und Knappich Augsburg'],
  },
  {
    id: 'foot-chopper',
    name: 'Foot-Chopper',
    shortDefinition:
      'Un effetto near-miss focalizzato sui piedi dei passeggeri, comune sui coaster invertiti o ala.',
    definition:
      'Simile all’head-chopper, il foot-chopper è un effetto visivo in cui sembra che i piedi dei passeggeri stiano per colpire una struttura o il terreno. L’effetto funziona soprattutto sui roller coaster invertiti (seduti sotto il binario) o sui Wing Coaster (seduti ai lati), dove le gambe sono libere e sospese nel vuoto.',
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
      'Il Projection Mapping (o video mapping) è una tecnica usata nelle dark ride moderne per trasformare superfici fisiche in schermi. A differenza di una proiezione normale, il software adatta l’immagine alla forma dell’oggetto (rocce, edifici, animatronici), e così un oggetto fermo sembra trasformarsi, muoversi o cambiare per magia. Si usa negli show serali e in attrazioni come «Harry Potter and the Forbidden Journey».',
    relatedTermIds: ['animatronics', 'dark-ride', 'interactive-dark-ride', 'pre-show'],
    aliases: ['video mapping', 'mappatura video'],
  },
  {
    id: 'omnimover',
    name: 'Omnimover',
    shortDefinition:
      'Sistema di trasporto continuo in cui i veicoli sono collegati tra loro in una catena ininterrotta.',
    definition:
      'L’Omnimover è un sistema di trasporto sviluppato da Disney (usato in attrazioni come «The Haunted Mansion»). I veicoli si muovono di continuo lungo il percorso e possono ruotare su se stessi per girare i passeggeri verso scene precise. Poiché il movimento non si ferma mai (tranne in caso di emergenza), la capacità oraria è molto alta. Altri esempi sono «Phantom Manor» o «Peter Pan’s Flight» (anche se in quest’ultimo i veicoli sono sospesi).',
    relatedTermIds: ['dark-ride', 'ride-capacity', 'trackless-ride'],
    aliases: ['sistema omnimover'],
  },
  {
    id: 'pepper-ghost',
    name: 'Pepper’s Ghost',
    shortDefinition:
      'Una tecnica di illusione ottica classica usata per creare apparizioni trasparenti o fantasmi.',
    definition:
      'L’effetto Pepper’s Ghost è un trucco teatrale dell’Ottocento che si usa ancora in molte dark ride, per esempio nella scena del ballo di «The Haunted Mansion». Servono una lastra di vetro inclinata a 45 gradi, che il pubblico non vede, e una stanza nascosta illuminata in modo mirato. L’immagine della stanza nascosta si riflette sul vetro e appare trasparente e sospesa nel vuoto: sembra un fantasma che attraversa oggetti solidi.',
    relatedTermIds: ['animatronics', 'dark-ride', 'pre-show', 'projection-mapping'],
    aliases: ['Pepper’s Ghost', 'illusione del fantasma'],
  },
  {
    id: 'dynamic-attractions',
    name: 'Dynamic Attractions',
    shortDefinition:
      'Produttore canadese noto per sistemi di trasporto complessi, che ha integrato il Robocoaster in diverse attrazioni.',
    definition:
      'Dynamic Attractions è un produttore di attrazioni che costruisce sistemi di trasporto complessi. Ha integrato il RoboCoaster, il braccio robotico KUKA commercializzato da RoboCoaster Ltd, in attrazioni come Harry Potter and the Forbidden Journey. Sviluppa anche sistemi di binari, cinema dinamici e componenti strutturali per grandi parchi a tema di tutto il mondo.',
    relatedTermIds: ['dark-ride', 'flying-theater', 'kuka', 'motion-simulator'],
  },
  {
    id: 'flying-theater',
    name: 'Teatro volante',
    shortDefinition:
      'Un simulatore con i sedili sospesi davanti a un enorme schermo curvo, per dare l’impressione di volare.',
    definition:
      'Un teatro volante è un tipo di attrazione di simulazione in cui gli ospiti siedono su sedili sospesi che si muovono in sincronizzazione con un film proiettato su un enorme schermo sferico. Spesso i sedili si sollevano e si spostano in avanti verso lo schermo, come in volo. Esempi: Soarin’ di Disney e il Voletarium di Europa-Park.',
    relatedTermIds: ['dark-ride', 'dynamic-attractions', 'motion-simulator', 'pre-show'],
  },
  {
    id: 'shuttle-coaster',
    name: 'Shuttle coaster',
    shortDefinition:
      'Una montagna russa il cui binario non forma un circuito chiuso e che si percorre sia in avanti sia all’indietro.',
    definition:
      'Uno shuttle coaster percorre il suo tracciato e poi lo ripercorre all’indietro. Il binario non si chiude in un circuito: il treno lascia la stazione, sale su una torre, una guglia o un looping in fondo, si ferma e torna indietro sulle stesse rotaie attraverso la stazione, spesso su per una seconda torre dall’altra parte prima di fermarsi alla banchina. Ogni elemento si fa due volte, una guardandolo e una senza vederlo arrivare.\n\nIl Boomerang di Vekoma è il più diffuso. Un lift tira il treno all’indietro su una torre e lo sgancia; il treno passa per un cobra roll e un looping verticale, sale sulla torre opposta e ripercorre all’indietro tutte e tre le inversioni. I primi quattro hanno aperto nel 1984 e da allora ne sono stati costruiti più di cinquanta, tra cui Speed of Sound a Walibi Holland. Negli shuttle lanciati il lift è sostituito da un lancio, come su Pulsar a Walibi Belgium (2016), un water coaster che spara la sua barca avanti e indietro su una guglia di 45 metri.\n\nIl tracciato sta in un terreno stretto. Con un solo treno su un solo binario, però, la capacità è bassa e la coda avanza piano.',
    relatedTermIds: ['boomerang', 'launch-coaster', 'spike', 'steel-coaster'],
    aliases: ['Impulse Coaster'],
  },
  {
    id: 'carousel',
    name: 'Carosello',
    shortDefinition: 'Un’attrazione rotante classica con sedili, spesso a forma di cavalli.',
    definition:
      'Un carosello, o giostra dei cavalli, è una piattaforma rotonda che gira attorno a una colonna centrale, con sedili a forma di cavalli, altri animali o carrozze. Sulla maggior parte i cavalli sono appesi a pali mossi da manovelle nel tetto, così salgono e scendono mentre la piattaforma gira, ed è quello che descrive il nome britannico gallopers. Mentre gira suona un organo o una registrazione.\n\nIl verso di rotazione è un’abitudine nazionale: i gallopers britannici girano di solito in senso orario, le giostre nordamericane in senso antiorario. Il più antico carosello fisso ancora esistente si trova nello Staatspark Hanau-Wilhelmsbad, vicino a Francoforte. Fu costruito nel 1780 e nel 2016, dopo un restauro, ha ripreso a girare per la prima volta da più di settant’anni.\n\nQuasi ogni parco di divertimento ne ha uno, spesso vicino all’ingresso. È una delle poche attrazioni su cui nonni e bambini piccoli salgono insieme.',
    relatedTermIds: ['flat-ride', 'themed-land'],
  },
  {
    id: 'walkthrough',
    name: 'Percorso a piedi',
    shortDefinition: 'Un’attrazione da vivere a piedi attraverso ambienti a tema.',
    definition:
      'Un walkthrough (percorso a piedi) è un’attrazione che si percorre a piedi, senza veicolo. Gli ospiti attraversano ambienti a tema che possono avere elementi interattivi, attori dal vivo o effetti speciali. Si va da semplici percorsi a tema a case infestate e funhouse elaborate.',
    relatedTermIds: ['dark-ride', 'funhouse', 'themed-land'],
  },
  {
    id: 'funhouse',
    name: 'Casa delle risate',
    shortDefinition:
      'Una classica attrazione da percorrere a piedi, piena di ostacoli fisici e illusioni ottiche.',
    definition:
      'Una casa delle risate è un edificio da percorrere a piedi pieno di trucchi fisici: pavimenti che si inclinano o tremano, un barile rotante da attraversare, specchi deformanti, getti d’aria, ponti traballanti e scivoli tra un piano e l’altro. Non c’è un veicolo; i visitatori la attraversano al loro ritmo, e buona parte del divertimento sta nel perdere l’equilibrio davanti a chi viene dietro.\n\nIl formato viene dalle fiere e dalle località balneari. La Fun House del Blackpool Pleasure Beach, un edificio Art Déco di cinque piani progettato dall’architetto Joseph Emberton negli anni ’30, è rimasta in piedi finché un incendio non l’ha distrutta nel 1991. Le case della risa itineranti sono ancora una presenza fissa nelle fiere tedesche, e molti parchi ne hanno di permanenti come attrazioni per famiglie.',
    relatedTermIds: ['flat-ride', 'walkthrough'],
  },
  {
    id: 'ferris-wheel',
    name: 'Ruota panoramica',
    shortDefinition:
      'Una grande ruota che gira in verticale, con gondole per i passeggeri da cui si vede il panorama.',
    definition:
      'Una ruota panoramica è una grande ruota verticale con gondole o cabine fissate lungo il cerchio, che gira abbastanza piano da lasciare ai passeggeri tutto il tempo di guardare il parco e il territorio intorno. In molti parchi e luna park fa da punto di riferimento, anche perché si vede da fuori. Le dimensioni vanno dalle piccole ruote per famiglie di pochi metri di diametro alle ruote d’osservazione grandi come il London Eye.',
    relatedTermIds: ['flat-ride', 'opening-hours'],
  },
  {
    id: 'spike',
    name: 'Guglia',
    shortDefinition:
      'Un tratto di binario verticale o molto inclinato, senza uscita, alla fine di uno shuttle coaster.',
    definition:
      'Una guglia è un tratto di binario alla fine di uno shuttle coaster che sale in verticale o quasi e finisce nel vuoto. Il treno ci sale finché la gravità non gli ha tolto tutta la velocità, resta fermo per un attimo e ricade sulle stesse rotaie, all’indietro, verso il resto del tracciato. Alcune guglie sono attorcigliate, così il treno ruota salendo e si raddrizza scendendo, come su Wicked Twister a Cedar Point (Intamin, 2002).\n\nUna guglia non richiede freni né una curva per tornare indietro, ed è per questo che gli shuttle coaster lanciati le usano: il lancio dà al treno l’energia e la guglia lo rimanda indietro. Nel 2024 Top Thrill 2 a Cedar Point ha ricevuto una guglia verticale di 128 metri per il suo lancio all’indietro. In Europa, Pulsar a Walibi Belgium (2016) manda la sua barca avanti e indietro su una guglia di 45 metri prima dello splashdown.',
    relatedTermIds: ['rollback', 'shuttle-coaster', 'steel-coaster'],
  },
  {
    id: 'forced-perspective',
    name: 'Prospettiva forzata',
    shortDefinition:
      'Una tecnica di progettazione utilizzata per far apparire le strutture più grandi o più piccole di quanto non siano in realtà.',
    definition:
      'La prospettiva forzata è un’illusione ottica utilizzata dai progettisti per manipolare la scala e la distanza percepite degli oggetti. Riducendo la scala degli edifici man mano che si elevano, i progettisti possono farli sembrare molto più alti. Questa tecnica è usata nel Castello della Bella Addormentata a Disneyland per farlo sembrare più alto.',
    relatedTermIds: ['themed-land'],
  },
  {
    id: 'show-building',
    name: 'Edificio dello show',
    shortDefinition:
      'La grande struttura utilitaristica che ospita il binario e le scenografie di un’attrazione al coperto.',
    definition:
      'Un edificio dello show (show building) è il capannone strutturale che contiene il binario, le scenografie e gli effetti speciali di una giostra al coperto o di un dark ride. Dentro è tutto scenografia; fuori è spesso una scatola anonima, nascosta agli ospiti da vegetazione o facciate a tema.',
    relatedTermIds: ['dark-ride', 'forced-perspective', 'themed-land'],
  },
  {
    id: 'practical-effects',
    name: 'Effetti pratici',
    shortDefinition:
      'Effetti speciali fisici prodotti dal vivo dentro un’attrazione invece che in digitale.',
    definition:
      'Gli effetti pratici sono effetti costruiti e azionati nella stanza che il passeggero attraversa: figure animatroniche, acqua, fuoco, nebbia, vento, oggetti che cadono, scenografie mobili e giochi di luce. Gli effetti multimediali, invece, mostrano l’azione su uno schermo o in proiezione. Un effetto pratico si vede in profondità e in scala reale da qualunque punto si trovi il veicolo, cosa che uno schermo può imitare solo da un punto di vista.\n\nAlcuni dei trucchi più vecchi sono ancora in uso. I fantasmi che ballano nella sala da ballo della Haunted Mansion (Disneyland, 1969) sono un fantasma di Pepper (Pepper’s ghost), un’illusione teatrale dell’Ottocento: figure nascoste sotto la linea di vista dei passeggeri si riflettono in una grande lastra di vetro. Droomvlucht a Efteling (1993) porta i passeggeri tra decine di fate, troll e animali animatronici in paesaggi scolpiti.\n\nUn effetto pratico guasto si vede subito, una figura immobile o una fontana asciutta, e i parchi fermano le attrazioni per ripararlo.',
    relatedTermIds: ['animatronics', 'dark-ride', 'projection-mapping'],
  },
  {
    id: 'chicken-exit',
    name: 'Chicken exit',
    shortDefinition:
      'Un percorso di uscita dedicato per gli ospiti che decidono di non salire proprio prima dell’imbarco.',
    definition:
      'Una chicken exit è un percorso designato che consente agli ospiti di lasciare la coda e uscire dall’attrazione proprio prima di salire sul veicolo. La usa chi cambia idea all’ultimo momento o chi ha solo accompagnato altri in coda.',
    relatedTermIds: ['queue-line', 'rider-switch', 'single-rider', 'wait-time'],
  },
  {
    id: 'in-show-exit',
    name: 'Uscita in scena',
    shortDefinition:
      'Un’uscita o un’evacuazione da un veicolo dentro l’area a tema di un’attrazione.',
    definition:
      'Un’uscita in scena, o evacuazione in scena, avviene quando un’attrazione si ferma e gli ospiti devono lasciare il veicolo dentro l’attrazione invece che alla banchina di sbarco. La causa è di solito un guasto o un arresto di sicurezza: il sistema di controllo ferma tutti i veicoli, un annuncio registrato chiede ai passeggeri di restare seduti e si accendono le luci di servizio.\n\nIl personale accompagna poi i passeggeri fuori lungo passerelle di manutenzione e corridoi di servizio fino a un’uscita di emergenza, il che può voler dire attraversare le scene da dietro o dall’alto. Con le luci accese, il dark ride mostra come è fatto: le figure restano immobili a metà gesto, e i cavi e gli altoparlanti dietro i fondali dipinti sono in bella vista. Su una montagna russa l’equivalente è scendere a piedi le scale accanto al lift hill.\n\nUn’attrazione evacuata resta chiusa finché il personale non l’ha controllata e non ha fatto girare cicli di prova a vuoto, e nel frattempo il suo stato risulta «Ferma».',
    relatedTermIds: ['dark-ride', 'downtime', 'e-stop'],
  },
  {
    id: 'e-stop',
    name: 'Fermo di emergenza',
    shortDefinition:
      'Un arresto di emergenza che interrompe immediatamente ogni movimento della giostra per motivi di sicurezza.',
    definition:
      'Un E-Stop (fermo di emergenza) è un meccanismo o una procedura di sicurezza che interrompe immediatamente l’alimentazione o applica i freni per arrestare ogni movimento dell’attrazione. Può essere attivato automaticamente dai sensori o manualmente dagli operatori. Dopo un E-Stop, l’attrazione deve solitamente essere ispezionata e resettata prima di riprendere il servizio.',
    relatedTermIds: ['block-brake', 'downtime', 'in-show-exit'],
  },
  {
    id: 'mackprodukt',
    name: 'Mackprodukt',
    shortDefinition:
      'Gergo della comunità di lingua tedesca per la lode automatica e acritica che i fan di Mack Rides riservano a qualsiasi novità del costruttore.',
    definition:
      'Un «Mackprodukt» (letteralmente «prodotto Mack») è una battuta interna della comunità di appassionati di montagne russe di lingua tedesca, con cui si prende bonariamente in giro la fedeltà dei fan di Mack Rides. Mack è un costruttore tedesco ed è la famiglia che possiede Europa-Park; i suoi fan sono molto fedeli, e i critici scherzano dicendo che ogni nuova attrazione Mack viene salutata come un capolavoro prima ancora di essere provata.\n\nIl meme si basa su poche frasi fatte che prendono il posto di qualsiasi giudizio sulla corsa: l’ammirazione per la bella curvatura del binario («die Schiene ist so toll gebogen», «il binario è curvato così magnificamente») e per gli splendidi treni («wunderschöne Fahrfiguren», «vetture bellissime»), complimenti estetici che lasciano da parte la domanda su come si viaggia davvero. Chiamare qualcosa «Mackprodukt», o citare quelle frasi, è il modo breve della comunità per alzare gli occhi al cielo, con affetto, davanti a una fedeltà al marchio che conta più della corsa.',
    relatedTermIds: ['credit', 'fanboy', 'gp', 'hype-train', 'mack-rides'],
    aliases: ['Mack-Produkt', 'Mackprodukte'],
  },
  {
    id: 'onride-offride',
    name: 'On-Ride / Off-Ride',
    shortDefinition:
      'Abbreviazione degli appassionati per le riprese fatte a bordo di un’attrazione (on-ride) rispetto a quelle filmate da terra (off-ride).',
    definition:
      'On-ride e off-ride descrivono i due modi principali in cui gli appassionati riprendono una montagna russa. Un video on-ride è girato dal sedile di un passeggero e mostra il percorso come lo vede chi è a bordo; un video off-ride è girato da terra, accanto al tracciato, e mostra il layout, la tematizzazione e i treni in movimento. I due termini tornano spesso quando si parla di POV e di video online. Molti parchi vietano di filmare col telefono a bordo, per cui le riprese on-ride autorizzate sono molto cercate.',
    relatedTermIds: ['pov', 'ride-photo', 'credit'],
    aliases: ['On-Ride', 'Off-Ride', 'Onride', 'Offride'],
  },
  {
    id: 're-ride',
    name: 'Re-Ride',
    shortDefinition:
      'Restare a bordo o risalire subito per un altro giro senza lasciare il posto né rifare la coda.',
    definition:
      'Un re-ride si verifica quando a un ospite è concesso di restare su un’attrazione (o di rientrare subito dalla stazione) per un altro giro senza rifare tutta la fila. I re-ride sono comuni a fine giornata, nelle ore tranquille o agli eventi per appassionati, quando c’è poca gente e gli operatori fanno semplicemente cenno ai passeggeri di restare. Dove i re-ride sono concessi spesso, gli appassionati fanno più giri di fila, per esempio per provare file diverse.',
    relatedTermIds: ['credit', 'ert', 'rope-drop'],
    aliases: ['Re-Rides', 'Reride'],
  },
  {
    id: 'hype-train',
    name: 'Hype Train',
    shortDefinition:
      'L’ondata di entusiasmo della comunità che cresce attorno a un’attrazione annunciata, gonfiando talvolta le aspettative oltre la realtà.',
    definition:
      'L’«hype train» è l’ondata di attesa che monta su forum e social media non appena una nuova attrazione viene anticipata o annunciata. Si alimenta di aggiornamenti del cantiere, layout trapelati e prime POV, e può far salire le aspettative alle stelle molto prima dell’apertura. Gli appassionati scherzano sul «salire sull’hype train» e sulla delusione quando poi l’attrazione non è all’altezza. Il concetto è vicino alla fedeltà dei fan e a meme come il Mackprodukt.',
    relatedTermIds: ['gp', 'mackprodukt', 'fanboy'],
    aliases: ['Hype', 'Hype-Train'],
  },
  {
    id: 'fanboy',
    name: 'Fanboy',
    shortDefinition:
      'Un fan la cui devozione verso un parco, un costruttore o un’attrazione rende il suo giudizio positivo e acritico per riflesso.',
    definition:
      'Nei circoli degli appassionati un «fanboy» (termine usato a prescindere dal genere) è chi, per attaccamento a un parco o costruttore specifico, colora ogni proprio giudizio, difendendone e lodandone i prodotti quasi d’istinto. L’etichetta è di solito affibbiata a metà per scherzo, ma descrive una cosa che nell’hobby succede davvero: la fedeltà al marchio che prevale sul giudizio. Il meme Mackprodukt della comunità di lingua tedesca è fanboyismo diventato tormentone.',
    relatedTermIds: ['mackprodukt', 'hype-train', 'gp'],
    aliases: ['Fanboys', 'Fangirl'],
  },
  {
    id: 'smoothness',
    name: 'Scorrevolezza',
    shortDefinition: 'Quanto una montagna russa corre senza scossoni, sobbalzi e vibrazioni.',
    definition:
      'La scorrevolezza (in inglese «smoothness», che gli appassionati tedeschi chiamano «Laufruhe») descrive con quanta pulizia i treni di un coaster percorrono il layout senza colpi alla testa, sobbalzi o vibrazioni. Dipende dalla precisione di fabbricazione del binario, dal progetto di treni e ruote e dall’età e manutenzione dell’attrazione. Le montagne russe di B&M e Mack di solito corrono «lisce come il vetro». Se un coaster resta liscio anche dopo molti anni, binario e treni sono stati costruiti con precisione. Il contrario è una corsa ruvida, con vibrazioni e colpi (rattle).',
    relatedTermIds: ['rattle', 'b-and-m', 'g-force'],
    aliases: ['Smoothness', 'Laufruhe'],
  },
  {
    id: 'rattle',
    name: 'Rattle',
    shortDefinition:
      'Vibrazione o tremolio indesiderato trasmesso da un treno di coaster, che rende ruvida una corsa per il resto valida.',
    definition:
      'Un rattle è la sensazione di ronzio, tremolio o sobbalzo che compare quando le ruote di un coaster non seguono più perfettamente i binari, spesso per l’usura del binario, lo stato delle ruote o l’età della costruzione. Gli appassionati tedeschi lo chiamano «Rattern» o «Geruckel». Un rattle può rendere scomodo anche un ottimo layout; capita spesso sui vecchi coaster in acciaio di Arrow e Vekoma. Il contrario è la scorrevolezza.',
    relatedTermIds: ['smoothness', 'wooden-coaster', 'arrow-dynamics'],
    aliases: ['Rattling', 'Rattern'],
  },
  {
    id: 'restraint-freedom',
    name: 'Libertà di movimento',
    shortDefinition:
      'Quanto spazio ha un passeggero per muoversi sotto la barra o le protezioni; da questo dipende quanto si sentono airtime ed ejector.',
    definition:
      'La libertà di movimento («Bügelfreiheit» nella comunità tedesca) descrive quanto spazio resta tra il passeggero e il sistema di ritenuta una volta bloccato. Con molto spazio sotto una barra addominale, nell’airtime ci si solleva dal sedile e il galleggiamento o l’ejector si sentono molto di più; una ritenuta stretta o premuta con forza li annulla. Molti progetti Intamin e Mack hanno barre morbide che lasciano questo spazio. Quando il personale preme le ritenute troppo a fondo si parla di stapling.',
    relatedTermIds: ['lap-bar', 'shoulder-harness', 'airtime', 'stapling'],
    aliases: ['Bügelfreiheit', 'Restraint Freedom'],
  },
  {
    id: 'single-rail-coaster',
    name: 'Single-Rail Coaster',
    shortDefinition:
      'Tipo moderno di coaster che corre su un’unica rotaia centrale stretta, con i passeggeri seduti in fila uno dietro l’altro.',
    definition:
      'Un single-rail coaster usa un’unica rotaia stretta a sezione scatolare invece delle solite due rotaie parallele, con treni in cui i passeggeri siedono uno dietro l’altro a cavalcioni del binario. La rotaia sottile permette layout molto stretti e contorti e lascia i passeggeri molto esposti. Rocky Mountain Construction ha creato la versione moderna con il modello «Raptor» (per esempio RailBlazer a California’s Great America); Vekoma e Intamin hanno poi sviluppato i propri modelli single-rail.',
    relatedTermIds: ['rmc', 'vekoma', 'steel-coaster'],
    aliases: ['Single Rail', 'Single-Rail', 'Raptor Track'],
  },
  {
    id: 'stand-up-coaster',
    name: 'Stand-Up Coaster',
    shortDefinition:
      'Un coaster su cui i passeggeri sono assicurati in posizione eretta anziché seduti.',
    definition:
      "Uno stand-up coaster trattiene i passeggeri in posizione eretta, usando un sellino simile a quello di una bicicletta e un’imbracatura sulle spalle. Il formato si è diffuso a fine anni '80 e negli anni '90, soprattutto con TOGO e B&M. In piedi le forze agiscono sul corpo in modo diverso, e nei loop e nelle curve le gambe sono molto caricate. Da allora se ne sono costruiti pochi, e diversi sono stati convertiti in altri formati (il Mantis di B&M è diventato il floorless Rougarou), per cui ne restano pochi in funzione.",
    relatedTermIds: ['b-and-m', 'floorless-coaster', 'steel-coaster'],
    aliases: ['Stand Up Coaster', 'Standup Coaster'],
  },
  {
    id: 'bobsled-coaster',
    name: 'Bob',
    shortDefinition:
      'Un coaster le cui vetture corrono libere in un canale aperto e sopraelevato anziché essere vincolate a un binario rigido.',
    definition:
      'Un coaster bob («bobsled coaster») manda le vetture in un canale curvo a forma di semi-tubo invece che su un binario classico, così che trovino da sole la traiettoria nelle curve sopraelevate, come su una vera pista da bob. La corsa è sinuosa, con forti forze laterali e senza inversioni; la traiettoria dipende dalla velocità e dalla forma del canale. Schwarzkopf ne costruì alcune versioni storiche; oggi il costruttore più noto di bob in acciaio è Mack Rides, con diverse piste in parchi tedeschi e alpini.',
    relatedTermIds: ['mack-rides', 'wild-mouse', 'steel-coaster'],
    aliases: ['Bobsled Coaster', 'Bobbahn', 'Bob Coaster'],
  },
  {
    id: 'powered-coaster',
    name: 'Powered Coaster',
    shortDefinition:
      'Un’attrazione in stile coaster spinta in continuo da un motore a bordo o nel binario, invece di affidarsi alla gravità.',
    definition:
      'Un powered coaster sembra una montagna russa ma è spinto lungo tutto il circuito da motori elettrici, anziché essere sollevato una volta e lasciato alla gravità. Può mantenere la velocità e fare più giri, ed è di solito un’attrazione tranquilla per famiglie (spesso a tema trenino da miniera, drago o animale), con alta capacità. Tra gli appassionati si discute da anni, mezzo sul serio, se un powered coaster «conti» come credit.',
    relatedTermIds: ['alpine-coaster', 'credit', 'mack-rides', 'mine-train'],
    aliases: ['Powered Coasters', 'coaster motorizzato'],
  },
  {
    id: 'water-coaster',
    name: 'Water Coaster',
    shortDefinition:
      'Un ibrido tra montagna russa e attrazione acquatica, che unisce binario e lift da coaster a uno o più splashdown.',
    definition:
      'Un water coaster unisce la meccanica del coaster (lift a catena o a motore, discese e binario sopraelevato) al finale bagnato di un’attrazione acquatica. Barche o vetture in stile coaster vengono tirate su per i lift e scendono negli avvallamenti, poi frenano bruscamente in una vasca e sollevano un’onda. Il costruttore principale di water coaster moderni è Mack Rides, con installazioni come Poseidon a Europa-Park. Il giro ha il ritmo di un coaster e, nelle giornate calde, rinfresca.',
    relatedTermIds: ['mack-rides', 'log-flume', 'splashdown'],
    aliases: ['Water Coasters', 'coaster acquatico'],
  },
  {
    id: 'alpine-coaster',
    name: 'Alpine Coaster',
    shortDefinition:
      'Un coaster di discesa guidato da una rotaia, di solito sul fianco di una montagna, in cui i passeggeri regolano da soli la velocità con una leva del freno.',
    definition:
      'Un alpine coaster (detto anche mountain coaster) è un’attrazione a slitta o carrello fissata a una rotaia che segue il profilo naturale di un pendio; i passeggeri regolano da soli la velocità con un freno a mano. A differenza di un coaster tradizionale non c’è un treno e di solito nessun lancio a motore: si scende per gravità, e una fune riporta i carrelli in cima. Nelle località alpine funzionano tutto l’anno e oggi si trovano in tutto il mondo; la più antica «Sommerrodelbahn» (pista da slittino estiva) a canale è una loro stretta parente.',
    relatedTermIds: ['terrain-coaster', 'powered-coaster'],
    aliases: ['Mountain Coaster', 'Sommerrodelbahn'],
  },
  {
    id: 'beyond-vertical-drop',
    name: 'Beyond-Vertical Drop',
    shortDefinition:
      'Una discesa più ripida di 90 gradi, in cui il binario inclina i passeggeri oltre la verticale rivolgendoli per un istante all’indietro.',
    definition:
      'Una beyond-vertical drop supera i 90 gradi di pendenza: il binario si ripiega sotto sé stesso, così i passeggeri sono per un attimo inclinati oltre la verticale e rivolti leggermente all’indietro verso la struttura. Il modello Euro-Fighter di Gerstlauer ha diffuso il formato con discese fino a 121°, e B&M e altri hanno costruito dive coaster con prime discese a sbalzo simili. Mumbo Jumbo e Takabisha (121°, 2011) hanno avuto, in anni diversi, il record della discesa di questo tipo più ripida, che dal 2019 spetta a TMNT Shellraiser (121,5°).',
    relatedTermIds: ['dive-coaster', 'euro-fighter', 'first-drop', 'gerstlauer'],
    aliases: ['Beyond Vertical Drop', 'discesa oltre la verticale'],
  },
  {
    id: 'splashdown',
    name: 'Splashdown',
    shortDefinition:
      'Il finale frenato dall’acqua di un’attrazione acquatica o di un water coaster, in cui la barca colpisce una vasca e solleva un’onda.',
    definition:
      'Lo splashdown è il momento in cui una barca o una vettura entra in un canale d’acqua ai piedi di una discesa. A frenare è l’acqua: rallenta il veicolo in pochi metri e scarica l’energia in un muro di spruzzi, che ricade sui passeggeri, sulla barca successiva e spesso sugli spettatori fermi su un ponte costruito apposta.\n\nQuanto ci si bagna dipende dalla profondità e dalla forma della vasca, dalla forma della prua della barca e dalla velocità in fondo alla discesa. Sui tronchi (log flume) a bagnarsi sono soprattutto i posti davanti. Atlantica SuperSplash a Europa-Park (Mack Rides, 2005) colpisce il lago alla fine di una discesa ripida, e Pulsar a Walibi Belgium cade da 45 metri in una vasca che fa anche da freno.\n\nNelle giornate calde le code alle attrazioni acquatiche sono più lunghe.',
    relatedTermIds: ['water-coaster', 'log-flume', 'mack-rides'],
    aliases: ['Splash-down', 'Splashdowns'],
  },
  {
    id: 'quad-down',
    name: 'Quad-Down',
    shortDefinition:
      'Una serie di quattro gobbe discendenti consecutive che regalano airtime ripetuto e ravvicinato verso la fine di un tracciato.',
    definition:
      'Un quad-down (e i suoi parenti minori triple-down e double-down) è una pila di gradini discendenti presi in rapida successione, ognuno dei quali dà un colpo netto di airtime mentre il treno scende, si rimette brevemente in piano e riscende. L’elemento si trova spesso sui coaster in legno e ibridi, perché dà airtime «a raffica» in poco spazio; si basa sulla stessa idea di camelback e bunny hop, ma concatena le gobbe in un’unica sequenza rapida.',
    relatedTermIds: ['airtime', 'camelback', 'wooden-coaster'],
    aliases: ['Quad Down', 'Triple-Down', 'Double-Down'],
  },
  {
    id: 's-hill',
    name: 'S-Hill',
    shortDefinition:
      'Una collina di airtime a forma di S che scaglia i passeggeri di lato mentre li solleva, unendo galleggiamento a un colpo laterale.',
    definition:
      'Una S-hill è una collina di airtime costruita con una curva a S, così che mentre il treno scollina e galleggia viene anche spinto lateralmente prima da un lato e poi dall’altro. All’airtime verticale si aggiunge uno scatto laterale che coglie i passeggeri di sorpresa. La S-hill è tipica dei moderni coaster in legno e ibridi che cercano un ritmo imprevedibile, «fuori controllo». L’elemento è strettamente imparentato con il wave turn, che inclina l’airtime completamente di lato.',
    relatedTermIds: ['airtime', 'airtime-hill', 'wave-turn', 'bunnyhop'],
    aliases: ['S Hill', 'Speed Bump'],
  },
  {
    id: 'celestial-spin',
    name: 'Celestial Spin',
    shortDefinition:
      'Un’inversione a doppio binario di Mack Rides: due treni in gara superano una collina condivisa mentre i loro binari si avvolgono l’uno attorno all’altro, uno ruota verso l’alto, l’altro verso il basso.',
    definition:
      'Il celestial spin è un’inversione a doppio binario brevettata da Mack Rides e costruita per [Stardust Racers](/it/parks/north-america/united-states/orlando/universal-epic-universe/stardust-racers), le montagne russe lanciate in duello di [Universal Epic Universe](/it/parks/north-america/united-states/orlando/universal-epic-universe). Mentre i due treni superano una collina condivisa, i loro binari si avvolgono l’uno attorno all’altro: nello stesso istante un treno ruota verso l’alto in uno zero-G roll e l’altro verso il basso in un barrel roll, e le vetture sembrano girare a spirale l’una attorno all’altra a mezz’aria.\n\nEntrambe le rotazioni sono sincronizzate con la cresta della collina, quindi i passeggeri restano senza peso per un lungo momento mentre l’altro treno gira a pochi metri di distanza. L’elemento è legato allo zero-G roll e alla collina di airtime, e funziona come previsto solo quando i due treni ci arrivano insieme.',
    relatedTermIds: ['zero-g-roll', 'airtime-hill', 'inversion', 'hangtime'],
    aliases: ['Celestial Roll', 'Celestial Rolls', 'Celestial Spins'],
    alternateNames: ['Celestial Roll'],
  },
  {
    id: 'launch',
    name: 'Lancio',
    shortDefinition:
      'Una sezione motorizzata che porta il treno a velocità in pochi secondi, invece di trainarlo su una salita di lancio.',
    definition:
      'Un lancio è il tratto di binario in cui un ottovolante ricava la propria energia da un motore anziché dalla gravità. Le tecnologie principali sono quattro. I lanci LSM (motore sincrono lineare) affiancano al binario elettromagneti che tirano un’aletta sotto il treno; sono fluidi, si controllano con precisione e si possono ripetere a metà percorso, per questo quasi ogni nuovo coaster lanciato li usa. I lanci LIM (motore a induzione lineare) funzionano in modo simile ma disperdono più energia in calore. I lanci idraulici usano un argano azionato da accumulatori pressurizzati ad azoto e danno l’accelerazione più forte mai costruita; quelli ad aria compressa, come su Maxx Force, sono ancora più rapidi nei primi metri.\n\nUn lancio si distingue da una salita anche per il punto in cui il treno riceve l’energia. Una salita deve essere il punto più alto del tracciato, quindi tutto ciò che segue va in discesa. Un lancio può stare ovunque, ed è per questo che i tracciati multi-lancio come [Taron](/it/parks/europe/germany/bruehl/phantasialand/taron) a [Phantasialand](/it/parks/europe/germany/bruehl/phantasialand) o [Voltron Nevera](/it/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) a [Europa-Park](/it/parks/europe/germany/rust/europa-park) restano veloci per tutta la loro lunghezza invece di barattare una sola volta quota per velocità. Se un lancio non basta a completare il tracciato si verifica un rollback.',
    relatedTermIds: ['launch-coaster', 'lifthill', 'swing-launch', 'rollback', 'top-hat'],
    aliases: ['Launch', 'Lanci', 'Lancio LSM', 'Lancio LIM'],
    alternateNames: ['Launch', 'Catapulta'],
  },
  {
    id: 'swing-launch',
    name: 'Lancio pendolare',
    shortDefinition:
      'Un lancio che spinge il treno avanti e indietro più volte, guadagnando velocità a ogni passaggio finché non riesce a completare il tracciato.',
    definition:
      'Un lancio pendolare (detto anche a navetta o multi-passaggio) accelera il treno, lo lascia esaurire la spinta su un tratto in salita, lo riprende al ritorno e ripete il ciclo due o tre volte finché non c’è energia sufficiente per l’intero circuito. Ogni passaggio aggiunge velocità che i motori non potrebbero fornire in una sola volta: un lancio pendolare compra quindi una velocità di punta molto più alta con una pista di lancio molto più corta.\n\nÈ anche un elemento di spettacolo a sé: i passeggeri percorrono all’indietro una parte del tracciato, di solito risalendo uno spike verticale, prima di essere rilanciati in avanti. [Toutatis](/it/parks/europe/france/plailly/parc-asterix/toutatis) al Parc Astérix e [The Ride to Happiness](/it/parks/europe/belgium/de-panne/plopsaland-belgium/the-ride-to-happiness-by-tomorrowland) a Plopsaland ne usano uno. Premier Rides costruisce un intero coaster compatto attorno a questa idea con il modello Sky Rocket II.',
    relatedTermIds: ['launch', 'spike', 'shuttle-coaster', 'launch-coaster'],
    aliases: ['Swing Launch', 'Lancio a navetta'],
    alternateNames: ['Swing Launch'],
  },
  {
    id: 'vertical-lift',
    name: 'Salita verticale',
    shortDefinition:
      'Una salita a 90 gradi: il treno viene issato dritto verso l’alto lungo la struttura.',
    definition:
      'Una salita verticale sostituisce la consueta rampa a 30–45 gradi con un tratto che sale ad angolo retto rispetto al suolo. Poiché una catena tradizionale con il dente anti-ritorno non riesce a trattenere in modo affidabile un treno su una parete verticale, queste salite usano una fune, un carrello di aggancio o una catena con presa a innesto positivo. I passeggeri passano l’intera risalita distesi sulla schiena a guardare dritto verso il cielo.\n\nLa salita verticale è tipica dei modelli Euro-Fighter e Infinity Coaster di Gerstlauer, dove sfocia direttamente in una caduta oltre la verticale: [Takabisha](/it/parks/asia/japan/fujikawaguchiko/fuji-q-highland/takabisha-steepest-roller-coaster) al Fuji-Q Highland sale in verticale e poi precipita a 121 gradi, la discesa più ripida del mondo alla sua apertura nel 2011, prima di TMNT Shellraiser (121,5°) nel 2019. [Oath of Kärnan](/it/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) all’Hansa-Park usa una salita verticale di 73 metri dentro una torre chiusa, così si sale al buio. Da non confondere con un ascensore di binario, dove è il tratto stesso a sollevarsi con il treno sopra.',
    relatedTermIds: ['lifthill', 'beyond-vertical-drop', 'euro-fighter', 'anti-rollback'],
    aliases: ['Vertical Lift', 'Salite verticali'],
    alternateNames: ['Vertical Lift'],
  },
  {
    id: 'drop-track',
    name: 'Binario mobile',
    shortDefinition:
      'Un tratto di binario che sprofonda con il treno fermo sopra, come se il pavimento sparisse.',
    definition:
      'Una drop track è un breve tratto di binario mobile montato su una piattaforma idraulica o elettrica. Il treno vi sale, si ferma, e l’intero segmento (rotaie, treno e tutto) viene liberato verso il basso, di solito per qualche metro, prima che il binario si blocchi in un nuovo allineamento e la corsa riprenda. A differenza di una discesa normale, la sensazione arriva a treno fermo e in piano, e per questo si legge come il terreno che cede e non come una picchiata.\n\nÈ quasi sempre un momento della storia che l’attrazione racconta: l’effetto funziona solo se non lo si vede arrivare, quindi le drop track stanno dentro edifici di spettacolo e gallerie. [Hagrid’s Magical Creatures Motorbike Adventure](/it/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure) fa cadere i passeggeri nel buio a metà tracciato, [Verbolten](/it/parks/north-america/united-states/williamsburg/busch-gardens-williamsburg/verbolten) al Busch Gardens Williamsburg li butta fuori dalla Foresta Nera, e Harry Potter and the Escape from Gringotts ne usa una nella sequenza del caveau.',
    relatedTermIds: ['switch-track', 'dark-ride', 'first-drop', 'indoor-coaster'],
    aliases: ['Drop Track', 'Drop Tracks'],
    alternateNames: ['Drop Track'],
  },
  {
    id: 'scorpion-tail',
    name: 'Coda di scorpione',
    shortDefinition:
      'Un elemento Mack Rides: il binario si curva oltre la verticale in uno strapiombo, così il treno risale all’indietro una parete a 105 gradi.',
    definition:
      'La coda di scorpione è uno spike di lancio che non si ferma alla verticale. Invece di salire a 90 gradi e trattenere lì il treno, il binario attraversa la verticale e si rovescia su sé stesso fino a circa 105 gradi: uno strapiombo. Un treno lanciato al suo interno sale a testa in giù e leggermente all’indietro, resta sospeso in cima e ricade da dove è venuto.\n\nMack Rides ha costruito la prima nel 2024 per [Voltron Nevera](/it/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) a [Europa-Park](/it/parks/europe/germany/rust/europa-park), dove è la sezione di lancio più ripida di qualunque ottovolante al mondo. Qui l’hangtime avviene senza alcun moto in avanti: in cima a trattenerti restano solo la forma del binario e la spinta residua del treno. Il nome viene dalla sagoma: una coda che si arriccia verso l’alto e sopra sé stessa.',
    relatedTermIds: ['spike', 'swing-launch', 'launch', 'hangtime', 'mack-rides'],
    aliases: ['Scorpion Tail', 'Code di scorpione'],
    alternateNames: ['Scorpion Tail'],
  },
  {
    id: 'step-up-under-flip',
    name: 'Step-Up Under-Flip',
    shortDefinition:
      'Un’inversione RMC: il treno risale una collina fortemente inclinata, ruota in cima e ne esce capovolto dall’altro lato.',
    definition:
      'Uno step-up under-flip è un’inversione in due tempi inventata da Rocky Mountain Construction. Il treno prima «sale» (lungo un tratto ascendente e molto inclinato) e poi ruota sotto sé stesso durante la discesa, così la rotazione avviene nella metà discendente e non sulla cresta. Il risultato è una rotazione più lunga e lenta di un tonneau e una scarica secca di ejector airtime all’uscita.\n\nSi trova su diversi ibridi RMC: [Steel Vengeance](/it/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance) a Cedar Point, [Zadra](/it/parks/europe/poland/zator/energylandia/zadra-rc) a Energylandia e [Untamed](/it/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed) a Walibi Holland, la prima conversione RMC in Europa. Poiché la manovra richiede binario d’acciaio torto con precisione su una struttura in legno o acciaio, è di fatto impossibile su binario di legno tradizionale.',
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
      'Un elemento RMC: una curva a ferro di cavallo di 180 gradi con un tonneau in ciascun ramo, quindi due inversioni e un’inversione di marcia completa.',
    definition:
      'Un twisted horseshoe roll prende il ferro di cavallo (una stretta virata di 180 gradi che rimanda il treno da dove è venuto) e infila un’inversione in entrambi i rami. Il treno ruota entrando, attraversa il ferro di cavallo e ruota di nuovo in uscita. Due inversioni e un cambio di direzione completo avvengono in un’unica manovra continua e insolitamente distesa.\n\nRocky Mountain Construction lo introdusse su Outlaw Run a Silver Dollar City, il primo ottovolante in legno della storia con un doppio tonneau, e da allora lo ha inserito in [Steel Vengeance](/it/parks/north-america/united-states/sandusky/cedar-point/steel-vengeance), [Zadra](/it/parks/europe/poland/zator/energylandia/zadra-rc), [Iron Gwazi](/it/parks/north-america/united-states/tampa/busch-gardens-tampa/iron-gwazi) e [Untamed](/it/parks/europe/netherlands/biddinghuizen/walibi-holland/untamed). Si passa gran parte dell’elemento di fianco o a testa in giù con forze G bassissime: da qui l’enorme hangtime.',
    relatedTermIds: ['horseshoe', 'rmc', 'inversion', 'hangtime', 'step-up-under-flip'],
    aliases: ['Twisted Horseshoe Rolls', 'Doppio tonneau'],
  },
  {
    id: 'double-down',
    name: 'Double Down',
    shortDefinition:
      'Una discesa interrotta a metà da un breve tratto in piano, che regala due scariche di airtime invece di una.',
    definition:
      'Un double down è una discesa divisa in due fasi: il binario scende, si appiattisce brevemente o risale di pochissimo, e poi scende di nuovo. Ogni transizione strappa i passeggeri dal sedile, così una sola collina produce due colpi netti di airtime invece di una lunga fluttuazione. L’elemento speculare, il double up, fa lo stesso in salita.\n\nSugli ottovolanti in legno c’è da moltissimo tempo: [Jack Rabbit](/it/parks/north-america/united-states/west-mifflin/kennywood/jack-rabbit) al Kennywood solleva i passeggeri dal sedile con il suo double dip dal 1920. I tracciati moderni in legno e ibridi continuano a farvi affidamento: [Colossos](/it/parks/europe/germany/soltau/heide-park/colossos-kampf-der-giganten) all’Heide-Park, [Balder](/it/parks/europe/sweden/gothenburg/liseberg/balder) a Liseberg e [Troy](/it/parks/europe/netherlands/sevenum/attractiepark-toverland/troy) a Toverland chiudono così le loro discese. Spingendo l’idea oltre si ottiene un quad-down: quattro fasi in una sola discesa.',
    relatedTermIds: ['airtime', 'ejector-airtime', 'quad-down', 'camelback', 'wooden-coaster'],
    aliases: ['Double Downs', 'Double dip'],
    alternateNames: ['Double Dip'],
  },
  {
    id: 'switch-track',
    name: 'Scambio',
    shortDefinition:
      'Un tratto di binario mobile che devia il treno su un percorso diverso: sezioni all’indietro, tracciati ramificati e binari di ricovero.',
    definition:
      'Uno scambio è l’equivalente ferroviario applicato agli ottovolanti: un tratto di binario che scorre, ruota o pivota per collegare il circuito principale a un secondo percorso. Il meccanismo è semplice e lascia molta libertà nel disegnare il tracciato. Uno scambio permette di rimandare un treno all’indietro su una sezione già percorsa, di offrire due itinerari dalla stessa stazione, o semplicemente di far uscire i treni dal circuito verso l’officina a fine giornata.\n\nCome elemento di spettacolo si tratta quasi sempre di sorpresa. [Expedition Everest](/it/parks/north-america/united-states/orlando/disneys-animal-kingdom-theme-park/expedition-everest-legend-of-the-forbidden-mountain) mostra il binario divelto davanti e poi rispedisce il treno all’indietro giù dalla montagna. [Big Grizzly Mountain](/it/parks/asia/hong-kong/hong-kong/hong-kong-disneyland-park/big-grizzly-mountain-runaway-mine-cars) a Hong Kong Disneyland ne usa due. [Fury](/it/parks/europe/belgium/kasterlee/bobbejaanland/fury) a Bobbejaanland lo sfrutta per offrire una corsa in avanti e una all’indietro sullo stesso tracciato.',
    relatedTermIds: ['drop-track', 'turntable', 'block-brake', 'dark-ride'],
    aliases: ['Switch Track', 'Scambi'],
    alternateNames: ['Switch Track'],
  },
  {
    id: 'turntable',
    name: 'Piattaforma girevole',
    shortDefinition:
      'Una piattaforma rotante nel circuito che fa girare il treno sul posto, di solito per rimandarlo indietro nell’altro senso.',
    definition:
      'Una piattaforma girevole è un tratto di binario montato su un disco rotante. Il treno vi sale, il disco ruota (quasi sempre di 180 gradi) e il treno riparte nella direzione opposta. Poiché la rotazione avviene a treno fermo, è per scelta un momento tranquillo: consente a un tracciato di invertire la marcia senza spike a navetta né scambio, e offre allo spettacolo un tempo in cui mostrare qualcosa ai passeggeri.\n\nSu [Voltron Nevera](/it/parks/europe/germany/rust/europa-park/voltron-nevera-powered-by-rimac) a Europa-Park la piattaforma prepara un lancio all’indietro, e in molti dark ride orienta i passeggeri verso una scena nel momento esatto. I dark ride trackless ottengono lo stesso effetto senza hardware dedicato, dato che i loro veicoli possono ruotare liberamente in qualsiasi punto.',
    relatedTermIds: ['switch-track', 'swing-launch', 'trackless-ride', 'dark-ride'],
    aliases: ['Turntable', 'Piattaforme girevoli'],
    alternateNames: ['Turntable'],
  },
  {
    id: 'treble-clef',
    name: 'Chiave di violino',
    shortDefinition:
      'Un elemento senza inversione a forma del simbolo musicale: il binario si annoda su sé stesso e rientra attraverso la propria curva.',
    definition:
      'Una treble clef è una curva sovrapposta che incrocia sé stessa: il treno sale in un cappio, attraversa il proprio binario ed esce dal centro della figura, disegnando all’incirca il profilo del simbolo musicale. Non è un’inversione: il treno resta sempre diritto, tenuto da un forte sopraelevamento anziché dal capovolgimento. Ciò che si sente è un lungo sbandamento disorientante con il binario che passa vicinissimo sopra e sotto.\n\nL’elemento è stato costruito da Maurer Rides per [Hollywood Rip Ride Rockit](/it/parks/north-america/united-states/orlando/universal-studios-florida/hollywood-rip-ride-rockit) agli Universal Studios Florida, il cui tracciato è a tema musicale e battezza di conseguenza le proprie figure: la chiave di violino segue il cappio non invertente «double take». È rimasto un pezzo unico.',
    relatedTermIds: ['non-inverting-loop', 'maurer-rides', 'overbank', 'inversion'],
    aliases: ['Treble Clef'],
    alternateNames: ['Treble Clef'],
  },
  {
    id: 'indoor-coaster',
    name: 'Coaster al coperto',
    shortDefinition:
      'Un ottovolante costruito interamente dentro un edificio, dove luci, suono e scenografia sostituiscono il panorama.',
    definition:
      'Un coaster al coperto percorre l’intero circuito dentro un edificio di spettacolo chiuso. Togliere la luce del giorno cambia la corsa alla radice: si perdono i riferimenti visivi che permettono di anticipare una discesa o una curva, così un tracciato modesto risulta molto più intenso dello stesso binario all’aperto. In più dà al progettista pieno controllo su luce, proiezione, suono e scenografia, e per questo molti coaster al coperto sono anche dark ride.\n\nSpace Mountain è il modello: la prima aprì al Magic Kingdom nel 1975, quella di [Disneyland](/it/parks/north-america/united-states/anaheim/disneyland-park/space-mountain) nel 1977. In Europa ci sono [Eurosat](/it/parks/europe/germany/rust/europa-park/eurosat-cancan-coaster) a Europa-Park, [Vogel Rok](/it/parks/europe/netherlands/kaatsheuvel/efteling/vogel-rok) all’Efteling e [Crazy Bats](/it/parks/europe/germany/bruehl/phantasialand/crazy-bats) a Phantasialand.',
    relatedTermIds: ['dark-ride', 'show-building', 'projection-mapping', 'vr-coaster'],
    aliases: ['Indoor Coaster', 'Coaster al chiuso'],
    alternateNames: ['Indoor Coaster'],
  },
  {
    id: 'family-coaster',
    name: 'Coaster per famiglie',
    shortDefinition:
      'Un ottovolante pensato perché bambini e adulti salgano insieme: forze moderate, altezza minima bassa, nessuna inversione.',
    definition:
      'Un coaster per famiglie è pensato per il pubblico più ampio possibile. Le altezze minime partono di norma intorno ai 100–110 cm (spesso con accompagnatore al di sotto), le velocità restano sotto i 60 km/h circa e i tracciati evitano inversioni e forze G prolungate. Dentro questi limiti il progettista deve comunque dare al tracciato airtime e ritmo.\n\nCi può salire un gruppo intero, bambini compresi. Il Family Boomerang di Vekoma, lo Youngstar di Mack e il Tivoli di Zierer sono i modelli più diffusi; [Pegasus](/it/parks/europe/germany/rust/europa-park/pegasus) a Europa-Park, [Raik](/it/parks/europe/germany/bruehl/phantasialand/raik) a Phantasialand e [Slinky Dog Dash](/it/parks/north-america/united-states/orlando/disneys-hollywood-studios/slinky-dog-dash) ai Disney’s Hollywood Studios rientrano esattamente in questi limiti.',
    relatedTermIds: ['height-requirement', 'mine-train', 'wild-mouse', 'launch-coaster'],
    aliases: ['Family Coaster', 'Coaster per famiglia'],
    alternateNames: ['Family Coaster'],
  },
  {
    id: 'motorbike-coaster',
    name: 'Coaster moto',
    shortDefinition:
      'Un ottovolante che si cavalca come una moto, sporti in avanti su un manubrio e in fila indiana.',
    definition:
      'Su un coaster moto si sta a cavalcioni del veicolo anziché seduti dentro, con le mani sul manubrio, sporti in avanti e i piedi sulle pedane. La posizione cambia molto: il baricentro è basso e direttamente sopra le rotaie, così curve sopraelevate e forze laterali si leggono come una piega in curva. Significa anche treni lunghi e stretti e bassa capacità per veicolo.\n\nVekoma costruì il primo con Booster Bike a [Toverland](/it/parks/europe/netherlands/sevenum/attractiepark-toverland/booster-bike) nel 2004; Intamin ha portato l’idea più lontano su [Hagrid’s Magical Creatures Motorbike Adventure](/it/parks/north-america/united-states/orlando/universal-islands-of-adventure/hagrids-magical-creatures-motorbike-adventure), che aggiunge un sidecar per chi non può stare a cavalcioni. [TRON Lightcycle / Run](/it/parks/north-america/united-states/orlando/magic-kingdom-park/tron-lightcycle-run) di Disney usa la stessa postura con una calotta chiusa su ogni passeggero.',
    relatedTermIds: ['launch-coaster', 'vekoma', 'intamin', 'suspended-coaster'],
    aliases: ['Motorbike Coaster', 'Coaster motociclistico'],
    alternateNames: ['Motorbike Coaster'],
  },
  {
    id: 'infinity-coaster',
    name: 'Infinity Coaster',
    shortDefinition:
      'Il successore dell’Euro-Fighter in casa Gerstlauer: stesse discese ripide e stesso ingombro ridotto, ma con treni aperti a gradinata.',
    definition:
      'L’Infinity Coaster è l’attuale piattaforma Gerstlauer per gli ottovolanti su misura. Dell’Euro-Fighter conserva le discese oltre la verticale, le salite verticali e i tracciati che stanno in pochissimo terreno, ma sostituisce i vagoncini squadrati da quattro con treni più lunghi e bassi, dai fianchi aperti e con imbracature a gilet invece delle barre di spalla. Corre molto più fluido e permette più colline di airtime, che il modello precedente digeriva male.\n\nLa gamma va dai coaster compatti da riempimento ai detentori di record: [The Smiler](/it/parks/europe/united-kingdom/farley/alton-towers/the-smiler) ad Alton Towers detiene il record mondiale di inversioni con quattordici, [Oath of Kärnan](/it/parks/europe/germany/sierksdorf/hansa-park/the-oath-of-kaernan) all’Hansa-Park abbina una salita verticale di 73 metri a una caduta libera all’indietro, e [Star Trek: Operation Enterprise](/it/parks/europe/germany/bottrop/movie-park-germany/star-trek-operation-enterprise) al Movie Park Germany sfrutta il modello come navetta multi-lancio.',
    relatedTermIds: ['gerstlauer', 'euro-fighter', 'beyond-vertical-drop', 'vertical-lift'],
    aliases: ['Infinity Coasters'],
  },
  {
    id: 'interactive-dark-ride',
    name: 'Dark ride interattivo',
    shortDefinition:
      'Un dark ride in cui si spara, si mira o si partecipa, e l’attrazione tiene il punteggio.',
    definition:
      'Un dark ride interattivo mette in mano ai visitatori un dispositivo (di solito un blaster a infrarossi, a volte un touchscreen o semplicemente le proprie mani) e costruisce lo spettacolo attorno a ciò che ne fanno. I bersagli di ogni scena registrano i colpi e alimentano un punteggio individuale mostrato alla fine. Il punteggio è un motivo per rifare il giro e provare a migliorarsi.\n\nIl genere si divide in due scuole. Nelle corse fisiche si spara a scenografie vere e animate: [Maus au Chocolat](/it/parks/europe/germany/bruehl/phantasialand/maus-au-chocolat) a Phantasialand e [Men in Black: Alien Attack](/it/parks/north-america/united-states/orlando/universal-studios-florida/men-in-black-alien-attack) agli Universal Studios Florida. In quelle su schermo si spara a bersagli proiettati, con effetti molto più elaborati: [Toy Story Mania](/it/parks/north-america/united-states/orlando/disneys-hollywood-studios/toy-story-mania) e [WEB SLINGERS](/it/parks/north-america/united-states/anaheim/disney-california-adventure-park/web-slingers-a-spider-man-adventure), che segue i movimenti delle mani senza alcun blaster.',
    relatedTermIds: ['dark-ride', 'animatronics', 'projection-mapping', 'trackless-ride'],
    aliases: ['Interactive Dark Ride', 'Dark ride interattivi'],
    alternateNames: ['Interactive Dark Ride'],
  },
  {
    id: 'madhouse',
    name: 'Casa matta',
    shortDefinition:
      'Un’attrazione in cui la stanza ruota attorno a una panca che oscilla appena, convincendo i visitatori di essere capovolti.',
    definition:
      'Una casa matta è un’illusione costruita su un solo trucco: la panca oscilla di pochissimi gradi, mentre l’intera stanza attorno compie una rotazione completa di 360 gradi. Senza un riferimento visivo fisso (pareti, soffitto e oggetti si muovono tutti insieme) il cervello legge il movimento come il ribaltamento della panca. I visitatori sono certi di essere stati a testa in giù; in realtà non lasciano mai un arco molto basso.\n\nVekoma ha diffuso il formato dopo aver costruito [Villa Volta](/it/parks/europe/netherlands/kaatsheuvel/efteling/villa-volta) per l’Efteling nel 1996, e da allora il sistema è spesso chiamato semplicemente «Vekoma Madhouse». [Feng Ju Palace](/it/parks/europe/germany/bruehl/phantasialand/feng-ju-palace) a Phantasialand, [Cassandra’s Curse](/it/parks/europe/germany/rust/europa-park/cassandras-curse) a Europa-Park e [Villa Fiasko](/it/parks/europe/netherlands/sevenum/attractiepark-toverland/villa-fiasko) a Toverland usano lo stesso sistema dietro storie diverse.',
    relatedTermIds: ['dark-ride', 'vekoma', 'pre-show', 'animatronics'],
    aliases: ['Madhouse', 'Vekoma Madhouse'],
    alternateNames: ['Madhouse'],
  },
  {
    id: 'boat-ride',
    name: 'Giro in barca',
    shortDefinition:
      'Un dark ride in cui i visitatori viaggiano in barca lungo un canale d’acqua invece che su un binario.',
    definition:
      'Un giro in barca porta gli ospiti attraverso lo spettacolo dentro una canaletta d’acqua, guidati da un binario sommerso o dalle pareti stesse del canale. L’acqua offre due cose che un binario non può dare: capacità, perché le barche lunghe si caricano in fretta e viaggiano ravvicinate, e silenzio, perché sotto l’ospite non c’è alcun meccanismo di trazione a coprire lo spettacolo. Per questo molti dei dark ride più grandi e più vecchi ancora in funzione sono giri in barca.\n\nQuasi tutti i classici rientrano qui: [Pirates of the Caribbean](/it/parks/north-america/united-states/anaheim/disneyland-park/pirates-of-the-caribbean), [«it’s a small world»](/it/parks/north-america/united-states/anaheim/disneyland-park/its-a-small-world-holiday), [Fata Morgana](/it/parks/europe/netherlands/kaatsheuvel/efteling/fata-morgana) all’Efteling e [Pirates in Batavia](/it/parks/europe/germany/rust/europa-park/pirates-in-batavia) a Europa-Park. Il Pirates of the Caribbean di Shanghai Disneyland mette le barche su una trazione magnetica senza binario, così possono ruotare e spostarsi lateralmente.',
    relatedTermIds: ['dark-ride', 'animatronics', 'trackless-ride', 'log-flume', 'water-ride'],
    aliases: ['Boat Ride', 'Giri in barca'],
    alternateNames: ['Boat Ride'],
  },
  {
    id: 'shoot-the-chute',
    name: 'Shoot-the-Chute',
    shortDefinition:
      'Un’attrazione acquatica a barcone costruita attorno a una sola grande discesa in una vasca, che scaglia un muro d’acqua sul ponte.',
    definition:
      'Uno shoot-the-chute porta una barca larga a fondo piatto, con venti o più persone a bordo, su un unico ascensore e la lascia cadere lungo un solo scivolo ripido dentro una vasca poco profonda. All’impatto la barca sposta un’enorme quantità d’acqua, e lo spruzzo è pensato per bagnare gli spettatori sul ponte quanto i passeggeri. A differenza di un tronco, che distribuisce più piccole discese lungo un percorso lungo e tortuoso, uno shoot-the-chute è costruito attorno a una discesa e a uno spruzzo.\n\nDi solito sta al centro di un’area tematica: [Jurassic Park River Adventure](/it/parks/north-america/united-states/orlando/universal-islands-of-adventure/jurassic-park-river-adventure) a Islands of Adventure percorre un dark ride completo prima della discesa di 26 metri, e [Atlantica SuperSplash](/it/parks/europe/germany/rust/europa-park/atlantica-supersplash) a Europa-Park lo combina con un tracciato da water coaster.',
    relatedTermIds: ['log-flume', 'water-ride', 'splashdown', 'water-coaster'],
    aliases: ['Shoot the Chutes'],
    alternateNames: ['Splash Boat'],
  },
  {
    id: 'people-mover',
    name: 'People Mover',
    shortDefinition:
      'Un’attrazione di trasporto a movimento continuo che porta gli ospiti lentamente attraverso o sopra un’area tematica.',
    definition:
      'Un people mover è un’attrazione di trasporto lenta e ad alta capacità: una catena ininterrotta di veicoli a passo d’uomo, spesso su una trave sopraelevata, con banchina mobile in modo da non doversi mai fermare. In un parco svolge un doppio ruolo: trasporto reale tra le aree e giro panoramico rilassato che mostra l’area e, spesso, gli interni di altre attrazioni.\n\nIl Tomorrowland Transit Authority PeopleMover del [Magic Kingdom](/it/parks/north-america/united-states/orlando/magic-kingdom-park/tomorrowland-transit-authority-peoplemover) è il superstite più noto e scivola attraverso l’edificio di Space Mountain lungo il suo circuito. La trazione a induzione lineare che utilizza è stata poi concessa in licenza a veri sistemi di trasporto urbano. Villain-Con Minion Blast di Universal applica la stessa idea a un tappeto mobile.',
    relatedTermIds: ['dark-ride', 'omnimover', 'observation-tower', 'walkthrough'],
    aliases: ['People Movers', 'Peoplemover'],
    alternateNames: ['Sistema di transito'],
  },
  {
    id: 'bumper-cars',
    name: 'Autoscontro',
    shortDefinition:
      'Un’attrazione in cui gli ospiti guidano piccole auto elettriche su un pavimento metallico e si scontrano di proposito.',
    definition:
      'Gli autoscontri viaggiano su un pavimento d’acciaio con una griglia conduttiva a soffitto: un’asta su ogni vettura preleva corrente dall’alto e la restituisce attraverso il pavimento, così i veicoli si guidano liberamente senza batterie né binario. Pesanti paraurti in gomma assorbono le collisioni attorno a cui ruota l’intera attrazione. Gli impianti moderni usano sempre più spesso la presa a pavimento o le batterie: la griglia sparisce e il soffitto si può tematizzare.\n\nÈ uno dei tipi di attrazione più antichi ancora in produzione continua (l’Auto-Skooter di Lusse risale agli anni Venti) e uno dei pochi in cui sono i visitatori a decidere cosa succede. Quasi ogni grande parco ne gestisce uno, dal [Bumper Klumpen](/it/parks/europe/germany/bruehl/phantasialand/bumper-klumpen) di Phantasialand al Lada Autodrom di Europa-Park.',
    relatedTermIds: ['flat-ride', 'funhouse', 'carousel'],
    aliases: ['Autoscontri', 'Bumper Cars', 'Auto a scontro'],
    alternateNames: ['Bumper Cars'],
  },
  {
    id: 'observation-tower',
    name: 'Torre panoramica',
    shortDefinition:
      'Un’attrazione a torre che solleva lentamente una cabina rotante fino in cima per il panorama, senza alcuna caduta.',
    definition:
      'Una torre panoramica porta una gondola vetrata o aperta lungo una colonna centrale, di solito ruotando così che ogni posto goda dell’intero panorama, si ferma in cima e poi riscende. Meccanicamente è parente stretta della torre di caduta, e le due vengono spesso confuse, ma la torre panoramica sale e scende lentamente, senza caduta.\n\nIn un parco fa anche da punto di riferimento, visibile già dal parcheggio. La [Euro-Tower](/it/parks/europe/germany/rust/europa-park/euro-tower) di Europa-Park svolge questo ruolo dal 1983.',
    relatedTermIds: ['drop-tower', 'ferris-wheel', 'flat-ride', 'people-mover'],
    aliases: ['Torri panoramiche', 'Observation Tower', 'Gyro Tower'],
    alternateNames: ['Gyro Tower'],
  },
  {
    id: 'wdi',
    name: 'Walt Disney Imagineering',
    shortDefinition:
      'La divisione interna di design e ingegneria di Disney: il gruppo che inventa, progetta e costruisce ogni attrazione dei suoi parchi.',
    definition:
      'Walt Disney Imagineering (WDI) è la divisione che progetta e costruisce i parchi Disney, dal masterplan di un’area tematica fino al meccanismo dentro una singola figura. Fondata nel 1952 come WED Enterprises per costruire Disneyland, è insolita nel settore perché riunisce sotto lo stesso tetto show design, architettura, ingegneria delle attrazioni e software: la stessa organizzazione che scrive la storia costruisce anche il veicolo che la racconta.\n\nTra le sue invenzioni ci sono gli Audio-Animatronics, l’Omnimover (un veicolo a movimento continuo che ruota per orientare i passeggeri verso ogni scena), il sistema trackless usato per la prima volta su [Pooh’s Hunny Hunt](/it/parks/asia/japan/tokyo/tokyo-disneyland/poohs-hunny-hunt) e il binario tubolare in acciaio che Arrow costruì per i [Matterhorn Bobsleds](/it/parks/north-america/united-states/anaheim/disneyland-park/matterhorn-bobsleds) nel 1959 e da cui discende ogni ottovolante in acciaio successivo. Dove un’attrazione Disney porta la firma di un costruttore esterno, WDI ne ha comunque quasi sempre progettato lo spettacolo attorno.',
    relatedTermIds: ['omnimover', 'trackless-ride', 'animatronics', 'dark-ride', 'arrow-dynamics'],
    aliases: ['WDI', 'Imagineering', 'Imagineers', 'WED Enterprises'],
    alternateNames: ['WDI', 'Imagineering'],
  },
  {
    id: 'brogent',
    name: 'Brogent Technologies',
    shortDefinition:
      'Costruttore taiwanese del sistema flying theater i-Ride, usato dalla maggior parte dei flying theater non Disney.',
    definition:
      'Brogent Technologies, fondata a Kaohsiung nel 2001, costruisce il flying theater i-Ride: una gondola di sedili sospesa che avanza davanti a un grande schermo sferico con i piedi nel vuoto, sincronizzata con effetti di vento, profumo e nebbia. Dove il Soarin’ di Disney ha stabilito il formato, Brogent lo ha industrializzato: l’i-Ride è il sistema che i parchi comprano quando vogliono un flying theater, e oggi funziona in ogni continente.\n\nL’installazione europea più nota è il [Voletarium](/it/parks/europe/germany/rust/europa-park/voletarium) di Europa-Park, che sorvola i monumenti del continente con due sale in parallelo per la capacità. L’azienda costruisce anche sistemi di attrazioni media-based più piccoli e attrazioni immersive a cupola.',
    relatedTermIds: ['flying-theater', 'motion-simulator', 'projection-mapping', 'pre-show'],
    aliases: ['Brogent', 'i-Ride'],
    alternateNames: ['Brogent'],
  },
  {
    id: 'quick-pass',
    name: 'QUICK Pass',
    shortDefinition:
      'Il prodotto salta-fila a pagamento di Phantasialand, acquistato per singola attrazione.',
    definition:
      'Il QUICK Pass è l’accesso a pagamento che salta la fila a Phantasialand. A differenza della maggior parte dei parchi non si compra per la giornata ma per attrazione: Taron, Black Mamba, Chiapas, Talocan o Maus au Chocolat.\n\nSi vende solo nel parco, al servizio ospiti nell’area tematica Berlin, e vale solo nella data stampata. Il prezzo per attrazione è fisso e non segue l’affluenza. Esiste anche il Quick Pass Ultimate: un passaggio su ogni attrazione Quick Pass e uno su F.L.Y.\n\nAnche l’ingresso QUICK Pass ha una fila, ma molto più corta.',
    relatedTermIds: ['express-pass', 'virtual-queue', 'wait-time', 'fastpass'],
    aliases: ['Quick Pass', 'QuickPass'],
  },
  {
    id: 'virtual-line',
    name: 'VirtualLine',
    shortDefinition: 'La coda virtuale gratuita di Europa-Park, prenotata nell’app del parco.',
    definition:
      'VirtualLine è il servizio di prenotazione gratuito di Europa-Park: nell’app Europa-Park & Rulantica prenoti una fascia oraria per un’attrazione selezionata ed entri in quella fascia da un ingresso ridotto. Nel frattempo puoi goderti altre attrazioni, gli spettacoli o il pranzo.\n\nÈ disponibile per blue fire Megacoaster, Euro-Mir, Pirates in Batavia, Poseidon, Voletarium, Voltron Nevera powered by Rimac e WODAN – Timburcoaster. I posti disponibili ogni giorno sono limitati.\n\nA differenza di un salta-fila a pagamento, VirtualLine non costa nulla.',
    relatedTermIds: ['virtual-queue', 'return-time', 'boarding-group', 'wait-time'],
    aliases: ['Virtual Line'],
  },
  {
    id: 'fast-lane',
    name: 'Fast Lane',
    shortDefinition:
      'Il pass salta-fila a pagamento, di norma acquistato per l’intera giornata di visita.',
    definition:
      'Fast Lane è il nome del prodotto salta-fila in molti parchi delle famiglie Six Flags e Walibi, da Cedar Point a Walibi Holland. Si acquista per la visita e non per un singolo giro: un braccialetto o un biglietto digitale apre per tutta la giornata l’ingresso Fast Lane delle attrazioni incluse.\n\nDi solito ci sono più livelli; a Walibi Holland ci sono Gold (illimitato, circa il 90 % di attesa in meno), Silver, Bronze e shot singoli per uno o quattro giri. Quali attrazioni siano incluse lo decide il parco; le case di Halloween sono spesso escluse.\n\nPoiché il prezzo copre la giornata e non la singola attrazione, su park.fan quelle attrazioni riportano un prezzo «da».',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time', 'single-rider'],
    aliases: ['Fastlane'],
  },
  {
    id: 'speedy-pass',
    name: 'Speedy Pass',
    shortDefinition: 'La coda virtuale a pagamento di Movie Park Germany.',
    definition:
      'Lo Speedy Pass è il prodotto salta-fila di Movie Park Germany. Funziona come una coda virtuale: dal telefono prenoti un giro su una delle attrazioni incluse ed entri all’orario prenotato da un ingresso dedicato.\n\nEsiste in più livelli, dallo Speedy Pass One Ride per una sola attrazione fino a Gold e Platinum, che coprono quasi tutto. Vale per oltre 25 attrazioni; alcune case e attrazioni speciali sono escluse.',
    relatedTermIds: ['virtual-queue', 'express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Speedypass'],
  },
  {
    id: 'fastrack',
    name: 'Fastrack',
    shortDefinition: 'Il biglietto salta-fila a pagamento nei parchi Merlin, come Alton Towers.',
    definition:
      'Fastrack è il nome con cui i parchi britannici del gruppo Merlin (Alton Towers, Thorpe Park, Chessington) vendono l’accesso fuori dalla fila. Esiste singolo per un’attrazione o in pacchetto: Bronze per alcune attrazioni a scelta, Silver per un giro su ogni attrazione inclusa, Gold per un uso illimitato.\n\nFastrack è sempre un biglietto aggiuntivo: l’ingresso al parco non è compreso.',
    relatedTermIds: ['express-pass', 'quick-pass', 'wait-time'],
    aliases: ['Fast Track', 'Fasttrack'],
  },
  {
    id: 'premier-access',
    name: 'Disney Premier Access',
    shortDefinition:
      'Il salta-fila a pagamento di Disney fuori dagli Stati Uniti, prenotabile per attrazione.',
    definition:
      'Disney Premier Access è ciò che nei parchi statunitensi si chiama Lightning Lane: l’accesso a pagamento che salta la fila, a Disneyland Paris e al Tokyo Disney Resort.\n\nPremier Access One si acquista per attrazione, di norma il giorno stesso tramite l’app, e il prezzo dipende dalla data e dall’attrazione; per le novità è nettamente più alto. Premier Access Ultimate copre una volta ogni attrazione partecipante.\n\nPoiché il prezzo viene fissato ogni giorno, su park.fan quelle attrazioni non riportano un prezzo fisso.',
    relatedTermIds: ['lightning-lane', 'express-pass', 'virtual-queue', 'wait-time'],
    aliases: ['Premier Access'],
  },
  {
    id: 'headliner',
    name: 'Headliner',
    shortDefinition:
      'L’attrazione per cui si sceglie il parco, di solito la più nuova o la più grande.',
    definition:
      'Un headliner è l’attrazione che fa finire un parco in una lista di viaggio: le montagne russe appena aperte, il dark ride più costoso, quello che sta sul manifesto. I parchi ne costruiscono uno ogni cinque o dieci anni circa, e nella stagione di apertura attira una quota notevole di tutti i visitatori.\n\nPer organizzare una giornata è la voce più importante. Un headliner raccoglie la fila più lunga del parco e spesso la mantiene dall’apertura fino a sera, mentre il resto dell’area la mattina è ancora vuoto. Per questo sta in cima a quasi ogni raccomandazione: prima l’headliner, poi tutto il resto. L’eccezione è la coda virtuale, che gli assegna comunque un orario.\n\npark.fan segnala gli headliner nell’elenco delle attrazioni di un parco e li porta in alto nella classifica per tempo di attesa. Che un’attrazione lo sia è un dato curato e non dedotto dalla fila: un’attrazione può avere una lunga coda in un singolo giorno senza che nessuno viaggi per lei.',
    aliases: ['Attrazione principale', 'E-Ticket'],
    relatedTermIds: ['wait-time', 'crowd-level', 'rope-drop', 'virtual-queue', 'peak-day'],
  },
];

export default translations;
