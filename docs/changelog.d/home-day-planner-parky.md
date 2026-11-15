### Der Tagesplaner auf der Startseite: Parky plant den Tag mit, der Tag füllt sich, während er abhakt

Die Startseite hatte unter den News die Reise-Regionen, aber keinen Weg in den Tagesplaner. In den
30 Tagen bis zum 2026-11-15 öffnete sie ihn 11-mal von 724 Öffnungen. Direkt unter den Regionen
steht jetzt eine eigene Station (`DayPlannerHomeStop`, `components/home/day-planner-stop.tsx`):
„Deinen Parktag Bahn für Bahn planen“, darunter ein Lead, „So funktioniert der Tagesplaner“ und
die sechs Parks aus dem Planen-Menü als Schnellstarts („Einen Tag planen im“, Quelle `home-park`).

Daneben steht Parkys Brett (`HomeDayPlannerBoard`): Parky mit seiner Sprechblase („Sag mir Park, Tag
und deine Wunschfahrten, dann planen wir zusammen, wann du wo am kürzesten anstehst.“), ein
gezeichneter Tag auf dem Streifen des Menüs mit Legende für die drei Farben, „Mit Parky planen“ (sein
Tages-Interview, `openInterview({ kind: 'day' })`; ohne Parky ein Link auf seine Seite) und „Tag
planen“. Erreicht das Brett die Bildschirmmitte, holt Parky sein Klemmbrett raus (der Akt `plan`)
und der Tag füllt sich Block für Block, auf die 4,2 s des Akts abgestimmt (`data-strip-fill`,
`pk-strip-in` in `app/globals.css`). Ohne JavaScript und bei reduzierter Bewegung steht der Tag
fertig da. Mit einem Plan im Browser zeigt das Brett dessen nächsten Tag, Parky bietet einen
weiteren an, und „Meinen Plan öffnen“ (Quelle `home-plan`) ersetzt „Tag planen“, ohne dass sich
eine Zeile in der Höhe ändert. Gezählt wird die Station als `day_home` und `home_day`.

Der Streifen (`DayStrip`, `DrawnDayStrip`, `PlanDayStrip`) liegt dafür in
`components/planner/day-strip.tsx`, die Plan-Zusammenfassung (`usePlanSummary`) in
`lib/planner/plan-summary.ts`; das Planen-Menü und der Header lesen beide von dort. Kann die API
den Tag eines Plans nicht liefern, zeichnet der Streifen dessen Blöcke grau, wie einen Block ohne
Wartezeit, statt einen leeren Kasten zu lassen; das gilt im Menü genauso. Den Status von Parkys
Freigabe lesen die vier Stellen, die ihn brauchen, über `useAssistantGateStatus`.
