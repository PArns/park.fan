### Parky lässt sich wieder mit der Scrollbar werfen, ein kräftig gedrehtes Mausrad reicht, und er fällt erst nach 250 ms

Seit Parky nur noch fliegt, wenn eine Hand die Seite bewegt, zählten nur Mausrad, Finger und
Scroll-Tasten. Wer an der Scrollbar zog, bewegte die Seite ohne eines dieser Ereignisse, und der Zug
galt als Skript-Scroll. Am Desktop war Parky damit kaum noch zu werfen, denn ein Mausrad mit Rasten
musste dafür etwa 30 Rasten pro Sekunde schaffen. Jetzt zählt ein Druck auf die Scrollbar der Seite
als Hand, bis die Maustaste losgelassen wird: Chrome meldet ihn als `pointerdown` auf `<html>`, den
Zug danach meldet nichts (`useScrollFling`). Die Scrollbar wirft ihn wie das Mausrad bei anderthalb
Fensterhöhen in 500 ms, statt zwei wie bisher beim Mausrad (`FlingTracker`). Mehr als eine
Fensterhöhe zwischen zwei Frames gilt beim Ziehen an der Scrollbar nicht als Sprung, weil der Daumen
auf einer langen Seite so weit in einem Frame kommt. Ein Druck irgendwo anders, etwa auf einen Link,
beendet das wieder, sodass der Sprung der neuen Seite an ihren Anfang ein Sprung bleibt. Finger und
Tasten bleiben bei drei Fensterhöhen in 600 ms.

Parky lässt erst los, wenn die Seite 250 ms statt 150 ms fast stillsteht (unter 0,5 px/ms,
`SETTLE_MS`). In der kurzen Pause zwischen zwei Schüben am Mausrad oder zwei Wischern fiel er schon
zurück, obwohl weitergescrollt wurde, und vor der Ruhezeit flog er beim nächsten Schub gleich wieder
hoch. Jetzt hält er durch und fällt erst, wenn das Scrollen aufgehört hat. Live gemessen lässt er
nach einem schnellen Zug an der Scrollbar 256 bis 267 ms nach dem letzten Scroll-Frame los. Ein
Klick auf einen Link gleich nach dem Loslassen der Scrollbar wirft ihn mit dem Sprung der neuen
Seite von 8073 px auf 0 nicht.

Gemessen auf dem Produktions-Build mit sichtbarer Scrollbar (1280×800,
`/de/blog/europa-park-wartezeiten-tipps`, 44 252 px hoch, Playwright): Ein schneller Zug am Daumen
(120 px in gut 0,4 s, 8,6 Fensterhöhen) und ein kräftiger (60 px in 0,7 s, 3,0 Fensterhöhen in den
schnellsten 500 ms) werfen Parky, runter, Halt und wieder hoch spielt beide Richtungen. Ein
langsamer Zug zum Mitlesen (0,1 bis 0,4 Fensterhöhen in 500 ms) und ein zügiger mit 1,4 werfen ihn
nicht. Das Mausrad wirft ihn ab 25 Rasten pro Sekunde (1,6 Fensterhöhen in 500 ms), mit 15 Rasten
pro Sekunde nicht, und Rasten in Schüben von fünf oder acht mit kurzen Pausen dazwischen auch nicht.
Die alte Regel aus der Zeit vor dem Hand-Filter warf ihn bei diesen Schüben ein- bis zweimal und bei
drei Drücken auf die Leertaste zwei- bis dreimal.

`pnpm test:assistant` prüft dazu vier Fälle: Ein kräftig gedrehtes Mausrad wirft ihn, ein schneller
Zug an der Scrollbar auch, ebenso einer, der mehr als eine Fensterhöhe pro Frame schafft, ein
langsamer Zug zum Mitlesen nicht.
