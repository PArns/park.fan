### Parky fliegt nur noch bei einem echten Wurf und ruckelt dabei nicht mehr

Beim Scrollen sprang Parky zu oft nach oben oder wurde flachgedrückt. Ausgelöst hat ein einzelner
Frame über 6 px pro Millisekunde, und weil die pro Frame gemessene Geschwindigkeit schwankt, reichte
dafür ein gewöhnlicher Wisch auf dem Handy, jeder Druck auf die Leertaste oder der Sprung an den
Seitenanfang nach einem Link. Jetzt zählt die Strecke statt der Spitze, und wie weit die Seite
fliegen muss, hängt davon ab, was sie bewegt (`FlingTracker` in `lib/assistant/fling-tracker.ts`):
mit dem Finger drei Fensterhöhen in 600 ms, weil ein Wisch die Seite mit Schwung weiterträgt; mit
Mausrad oder Trackpad zwei Fensterhöhen in 500 ms, weil ein Mausrad in Rasten ohne Schwung scrollt;
mit einer Taste drei Fensterhöhen in 600 ms, also nur gehalten. Unterschieden wird nach dem Ereignis
(`touchmove`, `wheel`, Scroll-Taste in der letzten Sekunde), nicht nach dem Gerät, sodass ein Laptop
mit Touchscreen oder ein Tablet mit Trackpad die passende Schwelle bekommt. Mehr als eine
Fensterhöhe zwischen zwei Messungen gilt als Sprung und zählt nicht, und eine Seite, die ein Link
oder ein Skript scrollt, wirft ihn nie. Nach einem Wurf wartet dieselbe Richtung 30 s, die andere
nicht: Hart runter, kurz anhalten und hart wieder hoch spielt beides, ohne den Halt bleibt es beim
ersten, weil ein hängender Parky nicht flachgedrückt wird. Der Spruch „Das geht aber ganz schön rund
hier!“ kommt beim dritten Wurf innerhalb von zwei Minuten statt einer halben, und die eigene Sperre
von 20 s zwischen zwei Fall-Sprüchen entfällt, weil die Ruhezeit länger ist.

Nachgestellt auf dem Produktions-Build (`pnpm build && pnpm start`,
`/de/blog/europa-park-wartezeiten-tipps`) mit Playwright, alte und neue Regel auf derselben
Aufzeichnung der Scroll-Position pro Frame. Auf einem Pixel 7 (412×839), der Finger per
`Input.dispatchTouchEvent` entlang der Schwungkurve eines Handys geführt, weil Headless-Chromium
keinen eigenen Schwung erzeugt: Ein Wisch mit 5 px/ms (3,3 Fensterhöhen) und drei davon
hintereinander warfen Parky bisher und jetzt nicht mehr, Lese-Wische und zügige Wische, auch fünf
hintereinander, werfen ihn weiterhin nicht, ein harter Wurf mit 8 px/ms nach unten oder oben wirft
ihn weiterhin. Der Sprung an den Seitenanfang warf ihn bisher und jetzt nicht mehr. Hart runter,
eine halbe Sekunde Halt und hart wieder hoch spielt beide Würfe, ohne Halt bleibt es beim Hängen;
zwei harte Würfe nach unten im Abstand von 3 s warfen ihn bisher zweimal, jetzt einmal. Am Desktop
(1280×800) warf ihn jeder von drei Drücken auf die Leertaste, jetzt keiner. Ein Mausrad mit 12
Rasten in knapp einer Sekunde oder 20 Rasten pro Sekunde wirft ihn nicht, 33 Rasten pro Sekunde,
fünf schnelle Drücke auf die Leertaste und eine gehaltene Bild-ab-Taste werfen ihn.

Oben zittert Parky jetzt über eine HTML-Hülle um die Zeichnung (`.parky-shake`) statt über das SVG
(`.parky-mood-scared`). Eine SVG-Transformation wird gemalt, nicht vom Compositor verschoben, und so
wurde Parky mit Schlagschatten und dem Blur seines Leuchtens in jedem Frame neu gemalt, während die
Seite scrollte. Im Trace über 3 s, während Parky oben hängt (Pixel 7, CPU vierfach gedrosselt, je
zwei Läufe): mit dem Zittern im SVG 346 bis 350 Paints mit 202 bis 205 ms Paint-Zeit und 175
Layouts, mit dem Zittern auf der Hülle 48 bis 50 Paints mit 31 bis 37 ms und 24 Layouts, das sind
die Stufen des Riesenrads auf seinem Hut. Die Fall-Striche unter ihm laufen nur noch, solange er
hängt, und stehen sonst still.

`pnpm test:assistant` prüft den Wurf mit 21 neuen Checks: Ein Lese-Wisch, ein zügiger Wisch, ein
einzelner Frame mit 30 px/ms, ein zügig gedrehtes Mausrad, die immer wieder gedrückte Leertaste, ein
Sprung und ein Skript-Scroll werfen ihn nicht; ein harter Wurf in beide Richtungen, ein frei
gedrehtes Mausrad und eine gehaltene Taste schon. Dieselbe Strecke wirft ihn mit dem Mausrad und
nicht mit dem Finger, die erste Richtung hält bis zum Loslassen, die andere Richtung geht sofort,
und dieselbe erst nach ihrer Ruhezeit.
