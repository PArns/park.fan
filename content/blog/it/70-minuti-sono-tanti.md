---
title: 'Settanta minuti sono tanti? Dipende dal giorno della settimana'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
author: patrick
mode: published
excerpt: >-
  All’ingresso di Taron c’è un numero, e da solo non dice quasi niente. Solo il
  confronto con ogni martedì misurato lo trasforma in una risposta. Perché
  park.fan archivia i tempi di attesa, cosa succede loro di notte e dove
  preferiamo non dire proprio nulla.
tags:
  - tempi-di-attesa
  - park-fan
  - phantasialand
  - statistiche
  - dietro-le-quinte
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own — why its page shows no wait times at
  # all — which is exactly the question somebody on that page is asking.
  - phantasialand
  - hansa-park
rideLinks:
  - phantasialand/taron
coverImage:
  src: /media/phantasialand/taron.jpg
  alt: 'Un treno di Taron tra le rocce di basalto di Klugheim'
  caption: 'Taron a Klugheim. Il numero all’ingresso segna 70. E adesso?'
  credit: 'Patrick Arns'
seo:
  title: 'Leggere bene un tempo di attesa: 70 minuti sono tanti?'
  description: >-
    Perché un tempo di attesa senza valore di confronto non dice nulla, cosa
    significano «tipico» e «pieno» su un’attrazione e come park.fan trasforma
    milioni di rilevazioni in una risposta.
  keywords:
    - tempi di attesa parco divertimenti
    - come leggere i tempi di attesa
    - Taron tempo di attesa
    - Phantasialand tempi di attesa
    - percentile tempo di attesa
    - rope drop
    - calendario affollamento
---

Sei davanti a [Taron](ref:phantasialand/taron), il display segna **70 minuti**, e la tua testa fa
subito la cosa sbagliata: confronta quel numero con il tuo ricordo. L’ultima
volta erano 40, quindi oggi va peggio. La volta prima 90, quindi oggi va
benissimo. Due visite non sono una base, e la memoria arrotonda comunque a tuo
sfavore ([il perché è qui](/blog/l-arte-dell-attesa)).

Il numero in sé non è il problema. I parchi lo espongono, di solito è più o meno
giusto e ci costa una richiesta ogni cinque minuti. Il problema è che sta da
solo. Settanta minuti di un martedì di maggio sono una cosa completamente
diversa da 70 minuti di un sabato delle vacanze estive, e senza la seconda metà
di questa frase non ci fai niente.

## Cosa vogliono dire davvero «tipico» e «pieno»

park.fan mette accanto a ogni attrazione due valori di confronto. **Tipico** è la
mediana dei picchi giornalieri: nella metà di tutti i giorni misurati la fila
più lunga è stata più corta di quel valore, nell’altra metà più lunga. **Pieno**
è il 90° percentile della stessa serie, all’incirca quel giorno su dieci in cui
c’era davvero movimento.

Sono entrambi percentili e non medie, e non è un dettaglio. Una media si lascia
spostare da una singola giornata eccezionale: un pomeriggio con un guasto e 150
minuti di coda tira su la media di un mese intero, anche se per 29 giorni non se
n’è sentito nulla. La mediana davanti a una giornata così non si muove. Per
questo il record sta a parte, con la data, così lo si vede senza che tocchi gli
altri due numeri.

Per il [Phantasialand](ref:phantasialand) la classifica è questa. La colonna dei giorni misurati è
la più importante: dice quanto peso porta una riga.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Quello che c’è qui è in tempo reale. Se rileggi questo articolo tra tre mesi, in
tabella ci saranno altri numeri, e il testo attorno starà ancora in piedi. È
esattamente a questo che servono questi widget: in quattro articoli più vecchi i
numeri erano digitati a mano in tabelle Markdown, distribuiti su sei lingue, e
dopo qualche settimana si erano allontanati in silenzio.

## La giornata ha una forma

Un’attrazione non ha la stessa fila tutto il giorno. Il movimento di fondo lo
conoscono tutti: all’apertura è corta, poi tira, verso sera torna sopportabile.
Dove cada esattamente il massimo cambia da attrazione ad attrazione, e sono
proprio quelle differenze la parte utile.

```hourly-profile-widget slug=phantasialand top=6

```

Da questa forma nascono due consigli. Il primo è il **rope drop**: all’apertura
andare dritti a una determinata attrazione, prima che i viali si riempiano. Lo
proponiamo solo se il picco della giornata raggiunge almeno 60 minuti e la
partenza mattutina ne fa risparmiare almeno 45. Tutto quello che sta sotto
sarebbe un consiglio valido ovunque e quindi utile da nessuna parte.

Il secondo è l’alternativa più tranquilla della sera. Sui grandi coaster
l’ultima ora prima della chiusura vale spesso quanto la prima dopo l’apertura,
solo che non bisogna alzarsi alle sette. Entrambe le indicazioni stanno sulla
pagina di ogni attrazione, con un orario concreto nell’ora del parco.

## La parte grossa si decide prima di partire

L’orario ti salva mezz’ora. La data ti salva la giornata. Tra due giorni della
stessa settimana di vacanza ci può essere mezz’ora di attesa media di
differenza, e da un calendario normale non si vede. A fare la differenza: quali
regioni sono in vacanza, se c’è un ponte attaccato, se piove, e se oltre confine
sta succedendo qualcosa.

L’ultimo punto viene volentieri sottovalutato. Un parco vicino al confine si
accorge subito di quando iniziano le vacanze accanto, quindi contiamo anche le
regioni entro circa 200 chilometri e le contrassegniamo a parte nel calendario.
Tre parchi a confronto, ciascuno con il suo giorno più tranquillo:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Se una cella dell’ultima colonna resta vuota, quel parco non ha un giorno della
settimana che si stacchi in modo affidabile dagli altri.

## A cosa serve un turno di notte

Mostrare un tempo di attesa in tempo reale è una richiesta. Una mediana su ogni
martedì misurato è un’altra cosa: deve essere pronta prima che qualcuno la
chieda. Così ogni notte gira una catena di job, e il loro ordine è fissato,
perché ogni passo poggia sul precedente. Alle 02:00 UTC i percentili per ora,
alle 03:00 i valori di riferimento per parco, alle 04:30 il riassunto di ieri,
alle 05:15 i consigli rope drop, che leggono proprio quel riassunto. Alle 06:00
il modello di previsione si riaddestra con i tempi di attesa del giorno prima.

Poi c’è l’altra metà: non buttiamo via niente. I periodi più vecchi vengono
compressi, ma ogni analisi continua a girare su tutte le rilevazioni mai
arrivate. Un archivio che si vorrebbe creare a posteriori è esattamente l’unica
cosa che a posteriori non si può creare.

## E i punti in cui non diciamo nulla

Una pagina con tutti i campi riempiti è facile da costruire. Diventa
interessante solo quando ci si può fidare dei campi riempiti, e per questo
qualche campo deve poter restare vuoto.

[Hansa-Park](ref:hansa-park), per esempio, fornisce i suoi tempi di attesa solo nella propria app,
e soltanto per i dispositivi collegati al wi-fi del parco. Non esiste
un’interfaccia pubblica. Nei dati grezzi questo parco somiglia a qualunque altro
alle tre di notte: nessuna attrazione riporta niente. Se ne traessimo la
conclusione ovvia, lì ci sarebbero 82 attrazioni su «molto bassa», più una media
di 0 minuti e una previsione fondata su zero osservazioni. Al suo posto, sulla
pagina del parco c’è un avviso che qui non c’è niente da leggere.

La stessa regola in un punto più piccolo: la pista di pattinaggio del
Phantasialand va da novembre a gennaio. Ad agosto su di essa non riporta niente
nessuno, perché non c’è niente da riportare. Leggere quel silenzio come «aperta»
sarebbe l’errore comodo, ed è davvero comparso così sulla pagina del parco. E i
mesi di esercizio di un’attrazione li indichiamo solo dopo 330 giorni di
osservazione: prima non compare alcun mese, perché «va da dicembre ad aprile»
descriverebbe il periodo in cui per caso abbiamo già misurato.

## Dove sta tutto questo

La versione lunga, con le card vere da leggere insieme, adesso è una pagina a
sé: [Come funziona park.fan](/it/come-funziona-park-fan). Lì c’è, capitolo per
capitolo, cosa si vede su una card di attrazione, come funziona la scala sotto
«tipico» e «pieno», come il calendario conteggia le vacanze e in quali tre punti
di proposito non affermiamo nulla. Ci sono anche quattro situazioni di visita
concrete, dalla famiglia nelle vacanze d’autunno all’abbonato annuale alle sette
di sera.

E la prossima volta che sei all’ingresso a fissare il display: guarda cos’è
normale su quell’attrazione di martedì. In dieci secondi saprai se c’è da
arrabbiarsi o se oggi è semplicemente martedì.

— Patrick
