---
title: 'Il pianificatore: calcoliamo se la tua giornata al parco sta in piedi'
translationKey: trip-planner-launch
date: '2026-09-05'
author: patrick
mode: published
featured: true
excerpt: >-
  Un feed di tempi di attesa ti dice quanto è lunga la fila adesso. Non ti dice
  se la tua lista arriva fino alla chiusura. A questo serve il pianificatore: le
  tue attrazioni su una linea del tempo, ogni blocco alto quanto l’attesa
  prevista, e il cammino nel mezzo.
tags:
  - park-fan
  - pianificatore
  - tempi-di-attesa
  - consigli
  - orlando
  - dietro-le-quinte
category: news
parkLinks:
  # Hansa-Park ha un paragrafo tutto suo sul perché lì il pianificatore non
  # offre pulsanti. È esattamente la domanda di chi sta su quella pagina.
  - magic-kingdom-park
  - hansa-park
rideLinks: false
coverImage:
  src: /media/disney-hollywood-studios/fantasmic-crowd-16x9.jpg
  alt: 'Un teatro all’aperto gremito visto da dietro, il pubblico aspetta al buio'
  caption: 'Fantasmic agli Hollywood Studios, poco prima dell’inizio. Diecimila persone che per quella mezz’ora non sono in coda da nessuna parte.'
  credit: 'Patrick Arns'
seo:
  title: 'Un pianificatore per i parchi: contare le file prima di partire'
  description: >-
    Il nuovo pianificatore di park.fan mette le tue attrazioni su una linea del
    tempo, calcola con le attese previste e conosce l’orario di apertura di ogni
    singola attrazione e le distanze fra loro. Senza account, tutto nel
    browser.
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
ci sta più. Il numero sopra l’ingresso è stato giusto per tutto il tempo. Lo è
quasi sempre. Solo che non dice nulla sul fatto che il resto della tua lista
accada ancora oggi.

In un parco compatto questo ti costa un’attrazione, e la fai la prossima volta.
In un parco che apre alle otto del mattino e chiude solo alle undici di sera,
che ha una dozzina di attrazioni davanti alle quali un’ora di fila non stupisce
nessuno, e dove due di esse distano dieci minuti a piedi, ti costa metà della
lista. Chi ha passato una giornata a Orlando senza un ordine conosce il finale:
tanto camminare, poco salire, e la sera metà lista non spuntata. Non perché ci
fosse troppa gente, ma perché l’ordine era sbagliato.

Questo era il buco che park.fan aveva. «Quanto si aspetta adesso» lo rispondiamo
dal primo giorno. «È tanto per un martedì?» dall’[estate scorsa](/blog/70-minuti-sono-tanti).
La terza domanda non c’era da nessuna parte: la mia giornata sta in piedi così?

Da questa settimana c’è. Il [pianificatore](/pianificatore) mette le tue
attrazioni su una linea del tempo e calcola la giornata prima che tu parta.

## Una giornata è un ordine, e quell’ordine ha un orologio

L’idea si racconta in fretta. Un blocco è un’attrazione, e la sua altezza è
l’attesa prevista per quell’ora. Trascinalo in un’ora più piena e cresce.
Trascinalo in una più tranquilla e si accorcia. La giornata non si allunga né si
accorcia, si sposta, e si vede.

Fra due blocchi c’è il trasferimento: quanto dista e se il tempo basta. Il
percorso fuori dalla stazione e il giro stesso stanno in quello spazio e non nel
blocco, perché appartengono allo spostamento e non alla fila.

Sembra un dettaglio, e cambia il modo di guardare una giornata al parco. Una
lista di otto attrazioni non dice nulla sul fatto che quel giorno ce ne stiano
otto. Otto blocchi su una linea del tempo che finisce alle undici di sera lo
dicono subito.

![Il pianificatore con una giornata preparata a Magic Kingdom: dieci blocchi su una linea del tempo dalle 8, con i trasferimenti fra l’uno e l’altro, distanza e tempo a piedi. | Dieci attrazioni un sabato di settembre, messe in quest’ordine dal pianificatore stesso.](/media/tagesplaner/planer-tag-it.webp)

Dieci attrazioni, dall’apertura alle quattro del pomeriggio, e sotto il piano
c’è la somma: cinque ore e un quarto di sola fila. È la versione che
l’ottimizzatore ha ritenuto migliore. Senza un ordine aspetti lo stesso e sali
di meno.

## Fra due attrazioni c’è una strada

Un feed di tempi di attesa può dire che a un’attrazione ci sono cinquanta
minuti. Quello che non può dire è che da dove sei adesso non ci arrivi più in
tempo. A questo serve il trasferimento.

Il calcolo parte dalla distanza fra le coordinate delle due attrazioni, più tre
minuti per uscire dalla stazione e tre per salire e fare il giro dove non è
registrata alcuna durata. La distanza è in linea d’aria, e il pianificatore lo
dice. È un limite inferiore e non un tempo a piedi: i percorsi girano intorno
all’acqua, alle file e ai sensi unici, certi parchi impilano le loro aree, e in
uno grande la linea retta attraversa volentieri un lago che va aggirato. Per il
limite superiore il pianificatore calcola quindi con il passo da parco invece
che con il passo di marcia e aggiunge due terzi di deviazione alla linea d’aria.

In un parco compatto un trasferimento maldestro costa tre minuti e non se ne
accorge nessuno. In uno grande costa un quarto d’ora. Farlo otto volte in una
giornata significa aver camminato via due ore che non compaiono in nessuna
statistica delle attese.

Quando al trasferimento c’è scritto «stretto», non vuol dire che sembri tirato.
Vuol dire che quel trasferimento non torna più se la previsione sbaglia quanto
dichiara lei stessa. L’API conosce quel margine per ogni attrazione, ed è qui
che la dispersione diventa un’indicazione utile.

## «Arrivare presto» non vale per ogni attrazione

Il consiglio che si legge ovunque suona così: prima l’attrazione grande, subito
dopo l’apertura. A volte è giusto. Spesso non lo è, e quale dei due casi valga
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
piatta esce altro, e lì quella è la risposta giusta.

Un’altra cosa che a mente si calcola di rado: la prima ora spesso non è tua.
Molti parchi aprono i cancelli prima che una parte delle attrazioni giri, e le
principali stanno volentieri fra quelle che partono più tardi. Riempire quella
prima ora con loro significa aver pianificato un’ora che non esiste. Il
pianificatore conosce l’orario di apertura di ogni singola attrazione e non
lascia scivolare nessun blocco prima. Non esiste un corrispettivo al contrario:
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
   meno che avviene davvero batte uno con una in più che non ci arriverà. E se
   qualcosa salta, salta dal fondo: prima quello che il pulsante ha appena
   aggiunto, mai quello che avevi pensato tu.
2. **La somma delle attese.** Che è quello che era stato chiesto.
3. **L’ora in cui ti metti in fila l’ultima volta.** A parità di costo vince
   l’ordine che finisce prima.

In un parco con più attrazioni principali di quante ne stiano in una giornata,
il punto uno è tutto il gioco. Per questo il pulsante non sparisce sempre dopo
averlo premuto: se resta un’attrazione senza posto, sotto c’è scritto quante
sono, e l’offerta rimane lì nel caso tu tolga qualcos’altro.

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

E siccome una pressione può trasformare tre blocchi in undici, accanto al
risultato c’è un annulla. Una volta, non a piacere, ma quella volta che serve.

## Quello che il pianificatore non sa, lo dice

Il lavoro più lungo su una cosa del genere sono i quattro punti in cui afferma
di proposito meno di quanto potrebbe.

**La previsione sbaglia, e in modo misurabile.** Su ogni blocco selezionato c’è
scritto di quanto le previsioni per quell’attrazione si sono discostate in media
da quello che la giornata ha portato davvero. «Tipico» significa alla lettera
quello che dice: metà delle giornate cade più lontano. Per questo il numero sta
lì come errore tipico e mai come intervallo che conterrebbe già la risposta
giusta.

**Gli orari degli spettacoli sono due cose diverse.** Quello che il parco ha
pubblicato per oggi è un annuncio. Quello che abbiamo riportato dall’ultimo
giorno della settimana corrispondente è una supposizione, e il pianificatore la
disegna più tenue: con una tilde davanti all’ora, una linea punteggiata e la
data da cui vengono gli orari. Nessuno al mondo conosce gli orari degli
spettacoli del sabato fra due settimane.

**Certi parchi non riusciamo proprio a misurarli.**
[Hansa-Park](ref:hansa-park) pubblica i suoi tempi di attesa solo nella propria
app, sul wifi del parco. Da lì non ci arriva mai un numero. Nei dati un parco
senza fonte è identico a un parco chiuso per la notte, perciò il pianificatore
prende questa informazione direttamente dall’API e lì nasconde entrambi i
pulsanti di ordinamento. Se ogni attrazione costa lo stesso numero inventato,
ogni ordine vale quanto un altro, e un pulsante che non cambia nulla sarebbe una
promessa.

**Una giornata passata resta.** Il calendario ti lascia riaprire un giorno in
cui avevi pianificato qualcosa, e lì i pulsanti automatici non ci sono più.
Tutto quello che si fa a mano continua: spostare, spuntare, cancellare. Una
giornata vissuta è una registrazione, e il fatto che all’una fossi davvero in
quella fila è il motivo per cui viene conservata.

## Vive nel tuo browser

Non c’è account, non c’è registrazione, non c’è login. Il tuo piano sta nel tuo
browser, e questa è l’impostazione predefinita, non la versione ridotta. Se
pulisci i dati del browser, sparisce. Se apri park.fan sul telefono, è un altro
piano.

L’unica eccezione sono le notifiche push. Perché possiamo dirti che è ora di
muoversi, il piano deve stare sul nostro server, e il pianificatore scrive che
cosa significa: chi ha il link può leggerlo e modificarlo. Davanti non c’è
nessuna password. Chi non lo vuole lascia spente le notifiche e non perde
nient’altro.

Ancora due cose che sfuggono facilmente. Sul bordo dello schermo, su ogni
pagina, c’è una linguetta che apre il pianificatore, anche quando non è ancora
pianificato nulla. E al computer puoi aprire una seconda colonna, e allora ci
sono due giornate una accanto all’altra. L’ho costruito per una frase sola: «e
sabato come verrebbe?».

## Come si comincia

L’ingresso passa da tre domande. In quale parco, in che giorno, e chi viene.

La prima è un campo di ricerca, e dietro c’è una piccolezza che va storta in
fretta. Digita «Disneyland» e ottieni cinque parchi su tre continenti che si
chiamano tutti così.

![Primo passo della procedura guidata: «Disneyland» digitato nel campo di ricerca, sotto cinque parchi da cinque Paesi. | Un nome, cinque parchi. Per questo il pianificatore si tiene il percorso dell’API e non il nome.](/media/tagesplaner/planer-wizard-park-it.webp)

Un piano viene archiviato sotto il percorso che restituisce l’API stessa, mai
sotto uno costruito da noi a partire dal nome mostrato. «Paesi Bassi» non si
scrive uguale in ogni lingua, e un percorso indovinato è un piano che punta a un 404.

La seconda domanda è quella interessante: al posto di un elenco a discesa da
sessanta righe ottieni un mese intero, e ogni giorno porta l’affluenza prevista
di quel parco. «Il sabato fra due settimane» diventa questione di un’occhiata, e
quello che sappiamo altrimenti su di lui sta sotto la griglia.

![Secondo passo della procedura guidata: una foto del Disneyland Park di Anaheim sopra una griglia mensile dove ogni giorno porta l’affluenza prevista, sabato 19 selezionato. | Un settembre previsto tranquillo per tutto il mese ad Anaheim. Sessanta righe di un elenco a discesa non lo mostrano.](/media/tagesplaner/planer-wizard-tag-it.webp)

La terza domanda sembra un modulo e conta più di quanto sembri: prevedere il
pranzo, se ci sono bambini, se volete restare asciutti. Tutte e tre sono
segnalazioni sull’elenco delle attrazioni e non filtri, e il pianificatore lo
scrive sulla scheda: le attrazioni con statura minima più alta vengono
segnalate, non nascoste. Un filtro accorcerebbe il parco di nascosto, e se la
nonna tiene gli zaini lo sai solo tu.

![Terzo passo della procedura guidata: tre schede per il pranzo, i bambini e le attrazioni acquatiche, sotto il pulsante per aprire il piano. | Tre risposte che non accorciano il parco. La pausa pranzo entra come blocco alle 12:30 e si può spostare.](/media/tagesplaner/planer-wizard-wer-it.webp)

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
