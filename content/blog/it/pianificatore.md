---
title: 'Il pianificatore fa i conti prima che tu finisca nella fila sbagliata'
translationKey: trip-planner-launch
date: '2026-09-05'
updatedAt: '2026-09-25'
author: patrick
mode: published
featured: false
excerpt: >-
  Un feed di tempi di attesa ti dice quanto è lunga la fila adesso. Se la tua
  lista arriva fino alla chiusura non te lo dice, e te ne accorgi da solo, di
  solito verso le due del pomeriggio. A questo serve il pianificatore: le
  tue attrazioni su una linea del tempo, ogni blocco alto quanto l’attesa
  prevista, e il cammino nel mezzo.
tags:
  - park-fan
  - pianificatore
  - tempi-di-attesa
  - consigli
  - orlando
  - dietro-le-quinte
category: park-fan
parkLinks:
  # Hansa-Park ha un paragrafo tutto suo sul perché lì il pianificatore non
  # offre pulsanti. È esattamente la domanda di chi sta su quella pagina.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'Un teatro all’aperto gremito visto da dietro, il pubblico aspetta al buio'
  caption: 'Fantasmic agli Hollywood Studios, poco prima dell’inizio. Ci stanno quasi diecimila persone, e per quella mezz’ora nessuna è in coda da nessuna parte.'
  credit: 'Patrick Arns'
seo:
  title: 'Pianificare la giornata al parco: le file, prima di farle'
  description: >-
    Il pianificatore mette le tue attrazioni su una linea del tempo, calcola
    attese previste e percorsi e ti dice prima se la giornata sta in piedi.
    Senza account.
  keywords:
    - pianificare una giornata al parco
    - pianificatore parco divertimenti
    - pianificare i tempi di attesa
    - Magic Kingdom pianificare la giornata
    - Orlando organizzare la giornata
    - ordine delle attrazioni
    - rope drop
---

Il piano che hai in testa regge fino alle due del pomeriggio più o meno. A quel
punto hai fatto tre attrazioni su otto, sei nella fila sbagliata e sai che non
ci sta più. Il numero sopra l’ingresso è stato giusto per tutto il tempo. Sul
resto della tua lista lì non c’è scritto niente.

In un parco compatto questo ti costa un’attrazione, e la fai la prossima volta.
In un parco che apre alle otto del mattino e chiude solo alle undici di sera,
che ha una dozzina di attrazioni davanti alle quali un’ora di fila non stupisce
nessuno, e dove due di esse distano dieci minuti a piedi, ti costa metà della
lista. Chi ha passato una giornata a Orlando senza un ordine conosce il finale:
tanto camminare, poco salire, e la sera metà lista non spuntata. Dopo si dà la
colpa alla folla, e invece la colpa era dell’ordine.

Questo era il buco che park.fan aveva. A «Quanto si aspetta adesso?» rispondiamo
dal primo giorno. «È tanto per un martedì?» da [fine agosto](/blog/70-minuti-sono-tanti).
La terza domanda non c’era da nessuna parte: la mia giornata sta in piedi così?

Da inizio settembre c’è. Il [pianificatore](/pianificatore) mette le tue
attrazioni su una linea del tempo e calcola la giornata prima che tu parta.

## Una giornata è un ordine, e quell’ordine ha un orologio

Un blocco è un’attrazione, e la sua altezza è l’attesa prevista per quell’ora. Trascinalo in un’ora più piena e cresce.
Trascinalo in una più tranquilla e si accorcia. La giornata non si allunga né si
accorcia, si sposta, e si vede.

Fra due blocchi c’è il trasferimento: quanto dista e se il tempo basta. Il
percorso fuori dalla stazione e il giro stesso stanno in quello spazio e non nel
blocco, perché appartengono allo spostamento e non alla fila.

Otto attrazioni in una lista sono una dichiarazione d’intenti, vincolante più o
meno quanto un buon proposito di Capodanno. Su una linea del tempo che finisce
alle undici di sera vedi già a colazione quali ti aspetteranno ancora alle dieci
e mezza.

![Il pianificatore con una giornata preparata a Magic Kingdom: dieci blocchi su una linea del tempo dalle 8, con i trasferimenti fra l’uno e l’altro, distanza e tempo a piedi. | Dieci attrazioni un sabato di settembre, messe in quest’ordine dal pianificatore stesso.](/media/tagesplaner/planer-tag-it.webp)

Dieci attrazioni, dall’apertura alle quattro del pomeriggio, e sotto il piano
c’è la somma: cinque ore e un quarto di sola fila. È la versione che
l’ottimizzatore ha ritenuto migliore. Quando riordina una giornata che hai
impostato tu, dopo indica quanti minuti di fila fa risparmiare il nuovo ordine,
calcolati con la stessa formula di prima.

## Fra due attrazioni c’è una strada, spesso intorno a un lago

Un feed di tempi di attesa può dire che a un’attrazione ci sono cinquanta
minuti. Quello che non può dire è che da dove sei adesso non ci arrivi più in
tempo. A questo serve il trasferimento.

Il calcolo parte dalla distanza fra le coordinate delle due attrazioni, più tre
minuti per uscire dalla stazione e tre per salire e fare il giro dove non è
registrata alcuna durata. La distanza è in linea d’aria, e il pianificatore lo
dice. È un limite inferiore e non un tempo a piedi: i percorsi girano intorno
all’acqua, alle file e ai sensi unici, certi parchi impilano le loro aree, e in
uno grande la linea retta attraversa volentieri un lago di cui bisogna fare
tutto il giro. Per il
limite superiore il pianificatore calcola quindi con il passo da parco, circa
quattro chilometri all’ora tra folla e passeggini, e aggiunge il 60 per cento di
deviazione alla linea d’aria.

In un parco compatto un trasferimento maldestro costa tre minuti e non se ne
accorge nessuno. In uno grande costa un quarto d’ora. Farlo otto volte in una
giornata significa aver buttato due ore a camminare, che non compaiono in
nessuna statistica delle attese e la sera si fanno sentire nei polpacci.

«Stretto» su un trasferimento non è un’impressione, è un conto: quel
trasferimento non torna più se la previsione sbaglia quanto dichiara lei stessa.
L’API conosce quel margine per ogni attrazione.

## «Arrivare presto» non vale per ogni attrazione

Il consiglio che si legge in ogni forum e che ti ripete ogni cognato che una
volta è stato in Florida suona così: prima l’attrazione grande, subito dopo
l’apertura. A volte è giusto. Spesso non lo è, e quale dei due casi valga
si vede solo guardando le ore una per una.
[Magic Kingdom](ref:magic-kingdom-park) si presta bene, perché la sua giornata è
abbastanza lunga da far divergere parecchio le curve.

```hourly-profile-widget slug=magic-kingdom-park top=8

```

Lì dentro ci sono tre schemi, e ciascuno chiede una risposta diversa.
[TRON](ref:magic-kingdom-park/tron-lightcycle-run) è caro tutto il giorno e
verso sera lo diventa ancora di più. Andarci presto qui non è mai sbagliato, ma
non lo rende neanche economico: resta la fila più lunga della tua giornata.
[Jungle Cruise](ref:magic-kingdom-park/jingle-cruise) fa il contrario e crolla a
tarda sera, quindi mettersi lì nel pomeriggio costa un multiplo dello stesso
giro. E [Big Thunder](ref:magic-kingdom-park/big-thunder-mountain-railroad) sta
per ore praticamente allo stesso prezzo, e per questo serve da riempitivo per i
buchi che lasciano le altre due.

Una regola generale non può dare quelle tre risposte, perché tratta le tre
attrazioni allo stesso modo. Nel pianificatore non c’è quindi nessuna regola di
rope drop; il codice non conosce nemmeno il termine.

```glossary-widget slug=rope-drop

```

Quello che conosce è la curva oraria di ogni singola attrazione. Dove quella
curva è più bassa subito dopo l’apertura, «prima la grande» esce da sé. Dove è
piatta esce altro.

Un’altra cosa che a mente si calcola di rado: la prima ora spesso non è tua.
Molti parchi aprono i cancelli prima che una parte delle attrazioni giri, e le
principali stanno volentieri fra quelle che partono più tardi. Riempire quella
prima ora con loro significa aver pianificato un’ora che non esiste. Al
Phantasialand i cancelli aprono alle nove, ma Taron, F.L.Y. e la maggior parte
delle altre grandi attrazioni partono solo alle dieci. Dove l’API conosce
l’orario di apertura proprio di un’attrazione, il pianificatore non lascia
scivolare nessun blocco prima. Non esiste un corrispettivo al contrario:
quando una singola attrazione chiude la sera non lo comunica in modo affidabile
nessun feed, quindi non c’è scritto nulla al riguardo.

## Due pulsanti ordinano la giornata

Sotto la linea del tempo ci sono due pulsanti. «Pianifica tutte le attrazioni
principali» aggiunge le grandi del parco che non sono ancora nella giornata e
poi ordina tutto. «Ottimizza la giornata» non aggiunge nulla e riordina soltanto
quello che c’è già. Dietro entrambi gira lo stesso calcolo. Sono due pulsanti
perché sono due domande: riempimi la giornata, e l’ordine può essere migliore.

Si ordina secondo tre cose, e la loro gerarchia è la vera decisione.

1. **Tutto deve starci prima della chiusura.** Un piano con un’attrazione in
   meno che avviene davvero batte uno con una in più che non ci arriverà. Conta
   il momento in cui ti metti in fila: una coda in cui entri ancora un quarto
   d’ora prima della chiusura vale. E se qualcosa salta, prima è quello che il
   pulsante ha appena aggiunto, non quello che avevi pensato tu. Tra le
   attrazioni aggiunte, un secondo giro sulla stessa salta prima di qualsiasi
   primo giro, poi quella con la coda prevista più corta. Le attrazioni per cui
   viene la maggior parte della gente restano dentro più a lungo.
2. **La somma delle attese.** Che è quello che era stato chiesto.
3. **L’ora in cui ti metti in fila l’ultima volta.** A parità di costo vince
   l’ordine che finisce prima.

In un parco con più attrazioni principali di quante ne stiano in una giornata,
il punto uno è tutto il gioco, e dal 21 settembre il pianificatore non lo
decide più in silenzio. Se non ci sta tutto, ciascuno dei due pulsanti apre
prima un assistente in tre passi. Sotto «Modifiche» c’è quello che farebbe
spazio, per esempio togliere la pausa pranzo o ridurla a mezz’ora, e ogni riga è
calcolata: compare solo se porta davvero un’attrazione in più nella giornata.
Sotto «Priorità» c’è l’elenco completo nell’ordine in cui si cancellerebbe, e
porti in cima quello che non vuoi perdere per niente. Ci sono anche le attrazioni
che avevi pianificato tu, perché qui decidi tu e non il pulsante. Sotto
«Risultato» c’è, con il nome, quello che resta fuori. Nel piano non viene scritto
nulla finché non lo applichi.

Un cursore che bilanci fare la fila contro stare in giro non c’è, di proposito.
Quel numero non lo saprebbe giustificare nessuno, e la prima persona a
contestarlo avrebbe ragione.

Una conseguenza mi piace in particolare, perché non l’ha programmata nessuno: il
pianificatore ogni tanto ti manda a prendere un caffè. Se adesso dovessi
aspettare cinquanta minuti ma mezz’ora dopo solo quindici, allora girare e
aspettare insieme costano meno che aspettare e basta. Stessa attrazione, meno
fila, e sei comunque libero prima.

Quello che l’ottimizzatore non tocca: la tua pausa pranzo, ogni attrazione che
hai già spuntato e ogni blocco la cui ora è già cominciata. Quest’ultimo punto
ci ha impegnati un po’, perché è la differenza fra «ti riordino il pomeriggio» e
«rimettiti in fondo alla fila, per favore». Chi preme alle due è alle due in
qualche fila, e quella non la sposta più nessuno.

E siccome una pressione può trasformare tre blocchi in undici, al risultato è
abbinato un annulla. Un solo passo indietro, non una cronologia intera, ma basta
per il momento in cui vedi gli undici blocchi e deglutisci.

## Quello che il pianificatore non sa, lo dice

Ci abbiamo messo più tempo su quattro punti in cui il pianificatore afferma di
proposito meno di quanto potrebbe.

**La previsione sbaglia, e in modo misurabile.** Su ogni blocco selezionato c’è
scritto di quanto, in media negli ultimi 45 giorni, le previsioni per una coda
di quella lunghezza e con quell’anticipo si sono discostate da quello che la
giornata ha portato davvero. C’è fino a 60 giorni prima; più in là la misura
ancora non arriva. (Dalle previsioni del tempo lo vorrei da anni.) Una media non
è un tetto, e in molte giornate la previsione cade più lontano. Per questo il
numero sta lì come errore tipico e mai come intervallo che conterrebbe già la
risposta giusta.

**Gli orari degli spettacoli sono due cose diverse.** Quello che il parco ha
pubblicato per oggi è un annuncio. Quello che abbiamo riportato dall’ultimo
giorno della settimana corrispondente è una supposizione, e il pianificatore la
disegna più tenue: con una tilde davanti all’ora, una linea punteggiata e la
data da cui vengono gli orari. Gli orari degli spettacoli del sabato fra due
settimane non li conosce nessuno, noi compresi.

**Certi parchi non riusciamo proprio a misurarli.**
[Hansa-Park](ref:hansa-park) pubblica i suoi tempi di attesa solo nella propria
app, sul wifi del parco. Da lì non ci arriva mai un numero. Nei dati un parco
senza fonte è identico a un parco chiuso per la notte, perciò il pianificatore
prende questa informazione direttamente dall’API e lì nasconde entrambi i
pulsanti di ordinamento. Se ogni attrazione costa lo stesso numero inventato,
ogni ordine vale quanto un altro, e un pulsante di ordinamento lì farebbe solo
finta.

**Una giornata passata resta.** Il calendario ti lascia riaprire un giorno in
cui avevi pianificato qualcosa, e lì i pulsanti automatici non ci sono più.
Tutto quello che si fa a mano continua: spostare, spuntare, cancellare. Una
giornata vissuta è una registrazione, e il fatto che all’una fossi davvero in
quella fila è il motivo per cui viene conservata.

## Vive nel tuo browser

Non ti registri da nessuna parte. Il tuo piano sta nel tuo browser, e questa è l’impostazione predefinita, non la versione ridotta. Se
pulisci i dati del browser, sparisce. Se apri park.fan sul telefono, è un altro
piano, e meglio scoprirlo a colazione che ai tornelli.

L’unica eccezione sono le notifiche push. Perché possiamo dirti che è ora di
muoversi, il piano deve stare sul nostro server, e il pianificatore scrive che
cosa significa: chi ha il link può leggerlo e modificarlo. Davanti non c’è
nessuna password. Se spegni di nuovo le notifiche, il piano viene cancellato dal
server. Chi non vuole niente di tutto questo le lascia spente e non perde
nient’altro. Su che cosa ti avvisiamo lo scegli tu: quando partire verso
l’attrazione successiva, gli orari degli spettacoli, un’attrazione pianificata
che chiude o riapre, e un’attesa pianificata che cambia in modo netto.

Finché le notifiche sono accese, dal 23 settembre c’è anche un link da
condividere. Chi lo apre riceve una copia tutta sua nel proprio pianificatore, e
quello che ci cambia resta a lui. È anche il modo per portare un piano dal
computer al telefono.

Ancora due cose che sfuggono facilmente. Al computer, sul bordo dello schermo di
ogni pagina, c’è una linguetta che apre il pianificatore, anche quando non è
ancora pianificato nulla; sul telefono lo fa dal 24 settembre un’icona a forma di
calendario nella barra in alto. E al computer si può aprire una seconda colonna, e allora ci
sono due giornate insieme. L’ho costruito per una frase sola: «e sabato
come verrebbe?».

## Come si comincia

L’ingresso passa da quattro domande. In quale parco, in che giorno, chi viene, e
quali grandi attrazioni mettere dentro. Le immagini qui sotto mostrano ancora la
prima versione, con tre passi.

La prima è un campo di ricerca, e dietro c’è una piccolezza che va storta in
fretta. Digita «Disneyland» e ottieni cinque parchi su tre continenti che si
chiamano tutti così. Coi nomi, il topo non si è sforzato granché.

![Primo passo della procedura guidata: «Disneyland» digitato nel campo di ricerca, sotto cinque parchi ad Anaheim, Parigi, Tokyo, Shanghai e Hong Kong. | Un nome, cinque parchi. Per questo il pianificatore si tiene il percorso dell’API e non il nome.](/media/tagesplaner/planer-wizard-park-it.webp)

Un piano viene archiviato sotto il percorso che restituisce l’API stessa, mai
sotto uno costruito da noi a partire dal nome mostrato. «Paesi Bassi» non si
scrive uguale in ogni lingua, e un percorso indovinato è un piano che punta a un 404.

La seconda domanda è quella interessante: al posto di un elenco a discesa da
sessanta righe ottieni un mese intero, e ogni giorno porta l’affluenza prevista
di quel parco. «Il sabato fra due settimane» diventa questione di un’occhiata, e
il resto che sappiamo su quel giorno sta sotto la griglia.

![Secondo passo della procedura guidata: è scelto il Disneyland Park di Anaheim, ogni giorno della griglia mensile porta l’affluenza prevista, sabato 19 selezionato. | Un settembre previsto tranquillo per tutto il mese ad Anaheim. Sessanta righe di un elenco a discesa non lo mostrano.](/media/tagesplaner/planer-wizard-tag-it.webp)

La terza domanda sembra un modulo e conta più di quanto sembri: prevedere il
pranzo, se ci sono bambini, se volete restare asciutti. Il pranzo diventa un
blocco nella giornata. Bambini e voglia di restare asciutti sono segnalazioni
sull’elenco delle attrazioni e non filtri, e il pianificatore lo
scrive sulla scheda: le attrazioni con statura minima più alta vengono
segnalate, non nascoste. Un filtro accorcerebbe il parco di nascosto, e se la
nonna tiene gli zaini lo sai solo tu.

![Terzo passo della procedura guidata: tre schede per il pranzo, i bambini e le attrazioni acquatiche, sotto il pulsante per aprire il piano. | Tre risposte che non accorciano il parco. La pausa pranzo entra come blocco alle 12:30 e si può spostare.](/media/tagesplaner/planer-wizard-wer-it.webp)

La quarta domanda è arrivata il 21 settembre. Mette nella giornata le grandi
attrazioni del parco e, se non ci stanno tutte prima della chiusura, mostra le
stesse modifiche e lo stesso elenco dell’assistente sotto la linea del tempo.

Dopodiché atterri sulla pagina del parco con il pianificatore aperto, e da lì
trascini le attrazioni sulla linea del tempo. Su ogni pagina di attrazione c’è
anche un pulsante per farlo, quando trascinare è scomodo.

Come un singolo blocco arrivi alla sua altezza, che cosa voglia dire «Dalla
previsione del giorno» e come si calcoli un trasferimento sta sulla
[pagina del pianificatore](/pianificatore), con una risposta dell’API vera e
congelata con cui giocare. Lì non si tocca nulla del tuo piano.

E se nel frattempo qualcosa ti sembra storto, un tempo a piedi che non torna o
un trasferimento che nella realtà non sarebbe mai riuscito: scrivimi,
l’indirizzo sta nelle [note legali](/impressum). I percorsi sono la parte che
misuriamo peggio, e chi in quel momento è lì lo sa meglio di qualsiasi calcolo.

— Patrick
