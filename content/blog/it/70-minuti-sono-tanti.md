---
title: 'Settanta minuti sono tanti? Dipende se è martedì'
translationKey: is-seventy-minutes-a-lot
date: '2026-08-24'
updatedAt: '2026-09-25'
author: patrick
mode: published
excerpt: >-
  All’ingresso di Taron c’è un numero, e da solo dice quanto una temperatura
  senza la stagione. Solo il confronto con ogni martedì misurato lo trasforma in
  una risposta. Perché park.fan non butta via niente, cosa succede di notte e
  perché ad agosto non consigliamo più di pattinare.
tags:
  - tempi-di-attesa
  - park-fan
  - phantasialand
  - statistiche
  - dietro-le-quinte
category: behind-the-scenes
parkLinks:
  # Hansa-Park gets a paragraph of its own on why its page shows no wait times at
  # all. That is exactly the question somebody on that page is asking.
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
    Un tempo di attesa senza confronto è come una temperatura senza la stagione.
    Cosa vogliono dire «tipico» e «pieno» e come park.fan ne ricava una risposta.
  keywords:
    - tempi di attesa parco divertimenti
    - come leggere i tempi di attesa
    - Taron tempo di attesa
    - Phantasialand tempi di attesa
    - percentile tempo di attesa
    - rope drop
    - calendario affollamento
---

Sei davanti a [Taron](ref:phantasialand/taron), il display segna
**70 minuti**, e la tua testa fa subito la cosa sbagliata: confronta quel numero con il tuo ricordo. L’ultima
volta erano 40, quindi oggi va peggio. La volta prima 90, quindi oggi va
benissimo. Due visite non sono una base, e la memoria arrotonda comunque a tuo
sfavore ([il perché è qui](/blog/l-arte-dell-attesa)).

Il numero in sé non è il problema. I parchi lo espongono, di solito è più o meno
giusto e ci costa una richiesta ogni cinque minuti. Il problema è che sta da
solo, come una temperatura senza la stagione. Settanta minuti di un martedì di maggio sono una cosa completamente
diversa da 70 minuti di un sabato delle vacanze estive, e senza la seconda metà
di questa frase non ci fai niente.

## Cosa vogliono dire davvero «tipico» e «pieno»

park.fan mette accanto a ogni grande attrazione di un parco due valori di
confronto, calcolati sugli ultimi 365 giorni. **Tipico** è la mediana dei picchi
giornalieri: nella metà di tutti i giorni misurati la fila più lunga è stata più
corta di quel valore, nell’altra metà più lunga. **Pieno** è il 90° percentile
della stessa serie, all’incirca quel giorno su dieci in cui c’era davvero
movimento. Sulla pagina dell’attrazione compaiono entrambi per il giorno della
settimana di oggi, con sotto tutta la settimana giorno per giorno.

Sono entrambi percentili e non medie. Una media si lascia spostare da una singola giornata eccezionale: un pomeriggio con un guasto e 150
minuti di coda tira su la media di un mese intero, anche se per 29 giorni non se
n’è sentito nulla. La mediana davanti a una giornata così non batte ciglio. Per
questo il record sta a parte, con la data, così lo si vede senza che tocchi gli
altri due numeri.

Per il [Phantasialand](ref:phantasialand) la classifica è questa. La colonna
dei giorni misurati è la più importante: dice quanto peso porta una riga.

```ride-waits-widget park=phantasialand top=8 columns=land,peak,days highlight=taron

```

Quello che c’è qui è in tempo reale. Se rileggi questo articolo tra tre mesi, in
tabella ci saranno altri numeri, e il testo attorno starà ancora in piedi. È
esattamente a questo che servono questi widget: in quattro articoli più vecchi i
numeri erano digitati a mano in tabelle Markdown, distribuiti su sei lingue, e
dopo qualche settimana si erano allontanati in silenzio, come gli orologi di una
casa vacanze.

## La giornata ha una forma

Un’attrazione non ha la stessa fila tutto il giorno. Il movimento di fondo lo
conoscono tutti: all’apertura è corta, poi il resto del mondo finisce la
colazione, e verso sera torna sopportabile.
Dove cada esattamente il massimo cambia da attrazione ad attrazione, e sono
proprio quelle differenze la parte utile.

```hourly-profile-widget slug=phantasialand top=6

```

Da questa forma nascono due consigli. Il primo è il **rope drop**: all’apertura
andare dritti a una determinata attrazione, prima che i viali si riempiano. Lo
proponiamo solo se il picco di una giornata normale degli ultimi 70 giorni
raggiunge almeno 60 minuti e la partenza mattutina ne fa risparmiare almeno 45. Tutto quello che sta sotto
sarebbe un consiglio valido ovunque e quindi utile da nessuna parte.

Il secondo è l’alternativa più tranquilla: l’ora in cui la fila di
quell’attrazione di solito è più corta. Se cade di sera, non bisogna alzarsi
alle sette. Entrambe le indicazioni stanno sulla pagina di ogni grande
attrazione con abbastanza giorni misurati, con un orario concreto nell’ora del
parco.

## La parte grossa si decide prima di partire

Su un’attrazione per cui proponiamo il rope drop, l’orario ti fa risparmiare
almeno tre quarti d’ora. La data decide l’intera giornata. Nelle vacanze estive
2026 della Renania Settentrionale-Vestfalia, martedì 18 agosto nel calendario
del Phantasialand risultava «Normale» e il giovedì della stessa settimana «Molto
alta» (dati di settembre 2026), e da un calendario normale non si vede. A fare
la differenza: quali
regioni sono in vacanza, se c’è un ponte attaccato, se piove e se oltre confine
sta succedendo qualcosa.

L’ultimo punto viene volentieri sottovalutato. Un parco vicino al confine si
accorge subito di quando iniziano le vacanze accanto, di solito già dalle targhe
nel parcheggio. Per questo contiamo anche le
regioni entro circa 200 chilometri e le contrassegniamo a parte nel calendario.
Tre parchi a confronto, ciascuno con il suo giorno più tranquillo:

```park-comparison-widget slugs=phantasialand,efteling,europa-park show=quietest

```

Un trattino nell’ultima colonna vuol dire che in quel parco nessun giorno della
settimana si stacca in modo affidabile, oppure che i suoi giorni sono stati
misurati in modo troppo diseguale per confrontarli. Se compaiono due giorni,
sono tranquilli allo stesso modo.

## A cosa serve un turno di notte

Mostrare un tempo di attesa in tempo reale è una richiesta. Una mediana su ogni
martedì misurato è un’altra cosa: deve essere pronta prima che qualcuno la
chieda. Così ogni notte gira una catena di job, e il loro ordine è fissato,
perché ogni passo poggia sul precedente. Alle 02:00 UTC i percentili per ora,
alle 03:00 i valori di riferimento per parco, alle 04:30 il riassunto di ieri,
alle 05:15 i consigli rope drop, che leggono proprio quel riassunto, alle 05:30
«tipico» e «pieno» per le grandi attrazioni. Alle 06:00
il modello di previsione si riaddestra con i tempi di attesa del giorno prima,
mentre i fan del rope drop sono già in coda in autostrada.

Poi c’è l’altra metà: non buttiamo via nessuna rilevazione. I periodi più
vecchi vengono compressi, non sfoltiti. Fin dove guarda indietro un’analisi è
un’altra decisione: «tipico» e «pieno» contano gli ultimi 365 giorni, un giro
d’anno completo, il consiglio rope drop solo gli ultimi 70, per seguire la
stagione. Chi comincia a salvare al terzo anno, al terzo anno ha un anno di
storico, e i due precedenti sono persi per sempre. La nostra serie di
rilevazioni comincia il 26 dicembre 2025, e la colonna dei giorni misurati nella
tabella qui sopra conta da lì.

## Dove preferiamo non dire nulla

[Hansa-Park](ref:hansa-park), per esempio, fornisce i suoi tempi di attesa solo
nella propria app, e soltanto per i dispositivi collegati al wi-fi del parco. Non esiste
un’interfaccia pubblica. Nei dati grezzi questo parco somiglia a qualunque altro
alle tre di notte: nessuna attrazione riporta niente. Se ne traessimo la
conclusione ovvia, lì ci sarebbero tutte le attrazioni del parco su «molto bassa», più una media
di 0 minuti e una previsione fondata su zero osservazioni. Il sogno di ogni
visitatore, e completamente inventato. Al suo posto, sulla
pagina del parco c’è un avviso che qui non c’è niente da leggere. Quello che
possiamo dire comunque sul parco sta nella
[guida all’Hansa-Park](/blog/hansa-park-consigli).

La stessa regola in un punto più piccolo: la pista di pattinaggio «Berliner
Eislaufen», sulla Kaiserplatz del Phantasialand, c’è solo durante il
Wintertraum, questa volta dal 14 novembre 2026 al 24 gennaio 2027. Ad agosto
nessuno riporta niente su di essa, perché non c’è niente da riportare. Leggere quel silenzio come «aperta»
sarebbe l’errore comodo, ed è davvero comparso così sulla pagina del parco:
pattini ai piedi in pieno agosto, con la nostra benedizione. E i mesi di
esercizio che ricaviamo dalle nostre rilevazioni li indichiamo solo dopo 330
giorni di osservazione: prima non compare alcun mese, perché «va da dicembre ad aprile»
descriverebbe il periodo in cui per caso abbiamo già misurato.

## Dove sta tutto questo

La versione lunga, con le card vere da leggere insieme, adesso è una pagina a
sé: [Come funziona park.fan](/it/come-funziona-park-fan). Lì c’è, capitolo per
capitolo, cosa si vede su una card di attrazione, come funziona la scala sotto
«tipico» e «pieno», come il calendario conteggia le vacanze, come il
pianificatore ne ricava una giornata e in quali tre punti di proposito non
affermiamo nulla. Ci sono anche quattro situazioni di visita concrete, dalla
famiglia nelle vacanze d’autunno alla prima volta in un grande parco, passando
per l’abbonato annuale che si chiede se valga ancora la pena andarci stasera.

E la prossima volta che sei all’ingresso a fissare il display: guarda cos’è
normale su quell’attrazione di martedì.

— Patrick
