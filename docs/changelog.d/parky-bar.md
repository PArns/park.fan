### Parkys Einladung in den Planern, und Parky im Reise-Assistenten wieder ganz

#### Die Leiste über „Deine Antworten“

`ParkyInterviewStart` (`components/assistant/parky-interview-start.tsx`), die Leiste in Reiseplaner,
Tagesplaner und Hub, ist jetzt Parkys eigenes Angebot: Parky links, daneben eine Sprechblase mit
seinem Namen und einem Satz in der ersten Person („Ich stell dir im Chat ein paar Fragen und trag
jede Antwort sofort hier im Planer ein.“), darunter die Fragen, mit denen der Chat beginnt, als
nummerierte Badges aus `interviewCore(kind)` mit den Namen aus `assistant.interview.steps`, wie
die Leiste im Chat sie zählt. Der Knopf bleibt der Aufruf. Ab 36rem Breite steht die Reihe auf
höchstens `max-w-4xl` in der Mitte, statt den Knopf an den rechten Rand von 1504 px zu schieben;
darunter steht sie wie bisher untereinander. Im Hub mit „Reise planen“ fehlen die Badges, weil die
Zeile dort vom Planer spricht. Die Blase und ihr Zipfel sind aus dem Band des Reise-Assistenten
herausgezogen (`PARKY_BUBBLE`, `ParkyBubbleTail` in `parky-speech-bubble.tsx`), damit beide gleich
aussehen.

Parky stand nicht mittig, weil sein Riesenrad über der 48er-Box seines Gesichts steht
(`overflow-visible`): Ein Layout, das die Box zentriert, zentriert das Gesicht und lässt den Hut in
das Padding darüber ragen, sodass die Figur 5 Einheiten zu hoch sitzt. `ParkyLogo` hat dafür
`framed`: Die Box umfasst dann die ganze Figur samt Hut und Zipfel (`viewBox` `-3.5 -9 55 55`).
Die Leiste und die drei Parkys in `plan-ideas.tsx` nutzen es; Launcher, Fenster und Hero behalten
die Gesichtsbox, an der ihre Fahrten, Docks und Sprünge gemessen sind.

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
