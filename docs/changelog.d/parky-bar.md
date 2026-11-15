### Parky im Reise-Assistenten wieder ganz

#### Der Kopf des Reise-Assistenten

Wer im Kopf der Seite das Menü „Planen“ geöffnet hatte und danach den Reise-Assistenten für Orlando
öffnete, sah im Band des Assistenten nur Parkys Augen, Wangen und Riesenrad: Körper, Himmel und See
fehlten. Die Orlando-Szene (`components/assistant/parky/orlando-scene.tsx`) gab ihren Verläufen feste
ids wie `parky-orlando-ground`, und das geschlossene Menü behält seine Kopie der Szene unter
`hidden`. `url(#…)` fand den Verlauf zuerst dort, und ein Verlauf in einem versteckten Teilbaum malt
nichts. Die ids kommen jetzt aus `useId()`, wie in den Szenen von Südkalifornien, Japan und Paris
schon; die Pausen-Szene (`break-scene.tsx`) ebenso, deren Kopien auf `/ui` sich einen Himmel
teilten. Im Band endet die Szene eine Knopfbreite vor dem rechten Rand, mit kurzer Blende
(`mask-r-from-90%`), sodass das Schließen-X auf dem Grund der Karte steht und nicht mehr auf Parkys
Riesenrad und dem Mond. Das goldene Feuerwerk über Orlando sitzt 4 Einheiten tiefer und wird oben
nicht mehr abgeschnitten
([Parky](../features/parky-character.md#pictures-of-him),
[Assistent](../features/trip-planner/wizard.md#the-band)).
