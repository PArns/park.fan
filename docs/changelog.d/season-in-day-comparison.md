### Der Tagesvergleich, die Kalenderkachel und „Heute im Park" nennen die Saison

Phantasialand fährt am 13. November den normalen Betrieb und ab dem 14. den Wintertraum, mit
anderen Öffnungszeiten (9–18 gegen 11–20 Uhr). Der Vergleich der beiden Tage zeigte nur Andrang,
Wartezeit, Öffnungsdauer und Regen, die Saison kam nicht vor: Die Saisons stecken nicht im
`CalendarDay`, sondern in `seasonDaysOfMonth` der Seite, und die gilt nur für den Monat auf dem
Schirm.

- **Tagesvergleich:** `dayComparisonStore.toggle` nimmt die Saisons des gewählten Tages mit
  (`DayComparisonSelection.seasons`, nach Datum), also auch über einen Monatswechsel. Der Dialog
  (`ParkCalendarComparison`) zeigt als erste Zeile „Saison", mit Symbol und Namen wie auf der
  Kachel, „Reguläre Saison" für einen Tag ohne Event und „Geschlossen" für einen geschlossenen. Die
  Zeile wird nicht gewertet: Ein Wintertag ist ein anderer Tag, kein besserer oder schlechterer.
- **Kalenderkachel:** Im Wochenraster ab `lg` steht der Name der Saison in einer eigenen Zeile unter
  der Andrangsstufe, mit dem Symbol davor, leise wie das Symbol (`ParkCalendarDay`). Die
  zweispaltige Liste darunter behält das Symbol allein; dort fehlt die Höhe für eine weitere Zeile.
- **„Heute im Park":** Die Statuszelle nennt unter den Öffnungszeiten die Saison, die heute läuft.
  Die Seite reicht `eventSeasonsNearToday` herein: die Saisons von heute und morgen, `dates` auf
  diese zwei Tage gekürzt, statt der 67 Termine des Wintertraums. Vor dem Mount gilt der Tag des
  Servers, danach der des Browsers, also steht die Zeile schon im ersten HTML.
