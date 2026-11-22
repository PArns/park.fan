### Parkseite: Ein Tap auf „Mehr“ öffnet die Links auf einem Android-Tablet wieder

`ParkLinksFlyout` (`components/parks/park-links-flyout.tsx`) öffnete die Links bei jedem Fokus.
Chromium setzt den Fokus beim Tippen auf den Button, bevor der Klick kommt, und der Klick schaltete
die gerade geöffneten Links wieder zu. Ein Tap zeigte also nichts, erst der zweite öffnete sie. Das
betraf Chrome auf Android-Tablets ab 640 px; Safari auf dem iPad fokussiert Buttons beim Tippen
nicht. Jetzt öffnet nur ein Fokus, der `:focus-visible` ist, also einer von der Tastatur, wie schon
bei `RideCrowdScaleTooltip`.

Geprüft mit `next dev` auf Phantasialand, Touch bei 768 px und Maus und Tastatur bei 1440 px: Ein
Tap öffnet, ein zweiter schließt, ein Tap daneben schließt. Hover öffnet, das Verlassen der
Titelkarte schließt. Tab auf „Mehr“ öffnet, Tab in die Links lässt sie offen, Escape schließt. Mit
dem Stand von `main` scheitern die drei Tap-Fälle, die übrigen sechs bestehen in beiden Ständen.
