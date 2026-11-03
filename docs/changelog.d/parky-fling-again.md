### Parky lässt sich sofort wieder werfen, und die Scrollbar braucht keinen so schnellen Zug mehr

Nach jedem Wurf wartete dieselbe Richtung 30 s (`FLING_REST_MS`). Wer an der Scrollbar einmal runter
und wieder hoch gezogen hatte, konnte Parky danach eine halbe Minute lang nicht mehr werfen, und das
sah aus wie ein Fehler. Die Ruhezeit ist entfernt: Sobald Parky losgelassen hat, wirft ihn der
nächste Wurf sofort wieder, in beide Richtungen (`FlingTracker`). Gegen das Auslösen beim
stückweisen Scrollen helfen die Strecke, die ein Wurf zurücklegen muss, und die 250 ms, die die
Seite fast stillstehen muss, bevor er fällt.

Die Scrollbar wirft ihn jetzt bei einer Fensterhöhe in 500 ms statt anderthalb, das Mausrad bei
1,25 statt 1,5. Finger und Tasten bleiben bei drei Fensterhöhen in 600 ms.

Die Sprüche gehen wieder nach ihren eigenen Zeiten: „Das geht aber ganz schön rund hier!“ beim
dritten Wurf innerhalb von 30 s statt zwei Minuten, und höchstens ein Fall-Spruch alle 20 s, damit
Parky bei vielen Würfen nicht jedes Mal etwas sagt.

Gemessen auf dem Produktions-Build mit sichtbarer Scrollbar (1280×800,
`/de/blog/europa-park-wartezeiten-tipps`, Playwright): Viermal hintereinander an der Scrollbar
gezogen, runter, rauf, runter, rauf, mit je 0,6 s Pause, wirft Parky viermal. Ein zügiger Zug (40 px
Daumenweg in gut einer Sekunde, 1,5 Fensterhöhen in den schnellsten 500 ms) wirft ihn jetzt, ein
gleichmäßiger zum Mitlesen (0,5) und ein langsamer (0,2) nicht. Das Mausrad wirft ihn ab 20 Rasten
pro Sekunde, mit 15 Rasten pro Sekunde und in Schüben von fünf oder acht Rasten nicht, dreimal die
Leertaste auch nicht.

`pnpm test:assistant` prüft dazu: Nach dem Loslassen wirft ihn derselbe Wurf sofort wieder, und die
andere Richtung auch; ein Mausrad in Schüben von acht Rasten wirft ihn nicht, ein zügiger Zug an der
Scrollbar von gut einer Fensterhöhe in einer halben Sekunde schon.
