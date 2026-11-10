### Parkys Riesenrad-Hut ist beim Verbindungscheck wieder ganz zu sehen

In `AssistantChallenge` lag das Parky-SVG mit `drop-shadow-lg` direkt über dem pulsierenden
Leuchten. Safari legte das SVG deshalb auf eine eigene Compositing-Ebene und schnitt es an seiner
Box ab, und die obere Hälfte des Riesenrads ragt über diese Box hinaus. Jetzt steckt Parky in einem
eigenen Stacking Context (`isolate`), wie im Launcher, und Safari setzt diesen Wrapper auf die
Ebene statt des SVGs.
