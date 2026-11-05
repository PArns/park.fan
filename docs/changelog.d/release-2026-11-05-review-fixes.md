### Review-Fixes zum Release vom 5. November

- **Wartungsseite:** Der Wiederanlauf-Check fragt `/v1/health/ready` statt `/v1/health/ping`. `ready`
  prüft auch Postgres und Redis, die ein Deploy nach der API neu startet; vorher sprang die Seite
  zu früh auf die Startseite und landete auf der Fehlerseite.
- **Jahresprognose:** Eine Antwort mit `isDegraded` (ML-Dienst nicht erreichbar) wird einmal am Data
  Cache vorbei neu gefragt. Der Data Cache liest das `no-store` der API nicht und hätte den leeren
  Ausblick sonst einen Tag gehalten.
- **CSV-Export:** Zahlen mit Dezimalkomma, damit deutsches Excel `7,3` nicht als Datum liest;
  Umlaute im Dateinamen werden ausgeschrieben (`geraete` statt `ger-te`).
- **Bot-Anteil:** Die Kachel steht da, sobald die API Bots zählt, und sagt „Nicht gezählt“, solange
  der Zeitraum einen nicht voll gezählten Tag enthält, statt kommentarlos zu fehlen.
- **Weiterleiten:** Die Aktion erscheint nur bei Pfaden, die die API annehmen kann (Park oder Bahn,
  Kleinbuchstaben), nicht bei einem Kalendermonat.
- **Blog-Editor:** Eine neue Übersetzung übernimmt die Bildunterschrift der Quellsprache nicht mehr.
