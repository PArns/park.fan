### Die vier Parky-Bilder im Planen-Menü bewegen sich, solange das Menü offen ist

Die Bilder der vier Reiseregionen im Band „Planen" spielten beim Öffnen einmal ihren Auftritt und
standen dann still. Jetzt bleiben sie in Bewegung, solange das Band zu sehen ist, und nur dort:
`PlannerRegionArt` gibt der Szene `loop` (`TripRegionSceneProps`, `lib/trip-regions/registry.ts`),
`HolidaySceneSvg` setzt dafür `data-scene-loop` an die Wurzel, und die Regeln jeder Szene stehen
in ihrem eigenen Stylesheet (`sceneMotion`, `LOOPING` in `components/assistant/parky/holiday-parky.tsx`).
Die Kachel auf den Parkseiten, die Zeilen im Handy-Menü und das Band des Assistenten spielen
weiter nur den Auftritt.

- **Orlando:** Die Rakete ist ein Start an der Space Coast, kein Feuerwerk. Sie steigt hinter dem
  Ufer auf und zieht ihre Spur mit (Keyframes aus der Bézierkurve der Spur, Rakete und
  `stroke-dashoffset` auf denselben Takten), bleibt an ihrem Platz stehen, und im Menü flackert die
  Flamme in einem Glühen, während eine Abgasfahne, unten breiter, um die Spur atmet. Das Feuerwerk
  am Abend öffnet sich, steht und verglüht in Runden von 4,2 bis 5,4 s, die auseinanderlaufen, die
  Spiegelung im See mit ihm. Die Regeln liegen nicht mehr in `app/parky.css` (51 Zeilen weniger
  auf jeder Seite), sondern im Chunk der Szene.
- **Südkalifornien:** Das Riesenrad am Pier dreht sich in 18 s einmal, die Gondeln sind Kreise und
  hängen von selbst gerade. Die Welle läuft den Strand hinauf und zieht sich zurück, eine Brandung
  rollt im selben Takt heran, das Glitzern auf dem Wasser wandert, die Möwen schweben.
- **Japan:** Jedes Blütenblatt in der Luft fällt mit eigener Dauer und eigenem Pendeln ins Gras
  und kommt über dem Baum wieder herein, fünf mehr als im Standbild. Die Laternen schaukeln an
  ihren Schnüren, jede zweite einen Takt versetzt.
- **Paris:** Am Abend glitzert der Eiffelturm wie bei seiner stündlichen Lichtshow, 40 Lichter in
  acht Gruppen mit eigenem Takt, und die zwei Strahlen des Leuchtfeuers an der Spitze drehen sich.
  Am Tag steigt der Dampf aus der Tasse weiter, die Wolken ziehen, das Boot schaukelt.

Nur `transform` und `opacity`; bis auf das einmalige Zeichnen der Raketenspur setzt Chromium alle
Animationen auf den Compositor. Geschlossen ist das Band `display: none`, dann gibt es keine
einzige Animation der Szenen. Unter `prefers-reduced-motion: reduce` stehen die Bilder fertig
da: Feuerwerk offen, Rakete an ihrem Platz mit Spur, das Rad still. Die Lichter des Turms als eine
Animation pro Licht kosteten im Dev-Build rund 145 ms Hauptthread pro Sekunde, in acht Gruppen
rund 16 ms. Das Band ist Glas, unter dem sonst nichts endlos laufen darf; die Ausnahme steht in
der Regel [work nobody can see](../rules/work-nobody-can-see-is-still-work.md).
