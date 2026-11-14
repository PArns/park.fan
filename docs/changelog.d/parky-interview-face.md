### Parkys Gesicht im Chat-Kasten der Planer, der Text größer

Der Kasten „Plane mit Parky deine perfekte Reise“ im Reiseplaner und „… deinen perfekten Parktag“ im
Tagesplaner war eine Zeile in `text-xs` neben dem Knopf und las sich wie eine weitere Formularzeile.
`ParkyInterviewStart` zeigt jetzt Parkys Gesicht aus dem Launcher daneben (`ParkyLogo`, `idle calm`:
blinkt und schaut dem Zeiger nach, keine Faxen; 48 px, ab 36rem Kastenbreite 56 px), der Text steht in
`text-sm`, ab 36rem in `text-base`, und in der Vordergrundfarbe statt gedämpft.
