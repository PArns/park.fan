### Parkseite: Das geschlossene „Mehr“-Menü macht die Seite auf dem Tablet nicht mehr breiter

Die Links hinter „Mehr“ in der Titelkarte (`ParkLinksFlyout`,
`components/parks/park-links-flyout.tsx`) standen geschlossen als `invisible opacity-0` rechts neben
dem Button, in voller Breite. Ein unsichtbares Element zählt trotzdem zur scrollbaren Breite: Von
640 bis 1023 px ragte das Panel über den rechten Rand, und `scrollWidth` lag auf der Seite von
Phantasialand bei 844 statt 703 px, 812 statt 768 und 838 statt 820. Chromium hält die Seite wegen
`overflow-x: clip` auf `<body>` trotzdem fest, WebKit auf dem iPad (auch Chrome für iOS) ließ sie
seitlich verschieben.

Geschlossen ist das Panel jetzt `display: none`. `transition-discrete` lässt es stehen, bis das
Ausblenden fertig ist, und `starting:` gibt dem Einblenden seinen ersten Frame. Weil ein Panel ohne
Anzeige keine Breite hat, misst `placeLinks` erst nach dem Commit, der es zeigt, in einem
`useLayoutEffect` vor dem Paint, statt im Klick.

Geprüft mit `next dev` auf Phantasialand (de), Europa-Park (en), Disneyland Park (fr) und Gardaland
(it) bei 360, 640, 703, 768, 820 und 1024 px: `scrollWidth` ist überall die Fensterbreite. Das Menü
blendet weiter über 200 ms ein und aus, und es steht wie vorher bei 1024 und 1440 px über der Zeile
und bei 1920 px daneben.
