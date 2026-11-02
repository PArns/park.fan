### Parkys Achterbahnfahrten bleiben im Chatfenster auf dem Bildschirm

Im offenen Chatfenster sitzt Parky oben links. Von dort fuhr der Launch etwa 120 px und der Freefall
etwa 187 px über die Zeichnung hinaus, also auf einem Laptop unter rund 870 px Fensterhöhe oben aus dem
Bildschirm; auf dem Handy liefen Launch, Freefall und Hügelbahn über den oberen bzw. linken Rand.
`lib/assistant/parky-rides.ts` berechnet jetzt für jede Fahrt aus ihrer Geometrie, wie weit sie
nach links und oben reicht (`rideFits`), und eine zufällige Fahrt ist nur noch eine, die an Parkys
aktueller Stelle auf den Bildschirm passt. Auf dem Handy rückt Parky im Fenster 4 px vom Rand ab,
damit dort der Looping Platz hat. Geprüft in Chromium und WebKit: 1280×680 nur Looping und Hügel,
1280×1000 alle vier, iPhone-Format nur der Looping, jedes Mal ganz im Bild.
