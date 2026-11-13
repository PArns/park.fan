### Parks in der Winterpause zeigen ein gelbes Panel mit dem Tag der Wiedereröffnung

Park- und Ride-Seite zeigen für einen Park in der Winterpause ein gelbes Glas-Panel
(`WinterBreakPanel`): „Öffnet wieder am Donnerstag, 25. März 2027", „in 19 Wochen", dazu Parky, der
mit Pudelmütze und Schal auf seinem Holzschlitten eingeschlafen ist, neben ihm sein Schneemann
(`ParkyWinterNap`). Auf der Ride-Seite heißt es „Der Park öffnet wieder am …". Bisher stand der
Termin nur als kleine Zeile in „Heute im Park".

Die Regel (`winterBreakOf`, `lib/utils/winter-break.ts`): heute kein Betrieb laut Fahrplan, die
nächste Öffnung bekannt und mindestens `OFFSEASON_MIN_DAYS` (7) Tage entfernt, und mindestens 7 Tage
dazwischen fallen in Januar bis März (südlich des Äquators Juli bis September), außerhalb der
Tropen. `OFFSEASON_MIN_DAYS` ist die Grenze, ab der Parkkarten (`getScheduleMessage`) und „Heute im
Park" (`useTodaySchedule`) schon „Nebensaison" sagen; sie stand dort zweimal als `7` und steht jetzt
einmal in `lib/utils/schedule-utils.ts`. Ein Park, der nur am Wochenende öffnet, bekommt das Panel
also nie. Der Dezember zählt nicht, damit die Lücke zwischen Halloween- und Weihnachtssaison keine
Winterpause wird. Am 13. November traf das von 169 geschlossenen Parks 5: Hansa-Park und vier
Wasser- und Saisonparks; Parc Astérix (zu bis 19. Dezember), Movie Park und Toverland nicht.
`pnpm test:winter-break` mit 18 Fällen.

Server-gerendert und ohne Client-Code, also ohne Layout-Sprung. Die Texte liegen im eigenen
Namespace `winterBreak`, weil die Parkseite `parks` komplett an den Browser schickt. Die
Parky-Formen (`BUBBLE`, `SHUT_EYES`, `SMILE`, `CHEEKS`, `ZED`, `MOON`) stehen jetzt in
`drawing.ts`, `ParkyLookHat` und `ParkySnowman` haben `still`, und `weeksUntil` rundet die Wochen
für „Heute im Park" und das Panel gleich.
