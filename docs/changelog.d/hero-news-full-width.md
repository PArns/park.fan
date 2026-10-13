### Hero: Die News-Zeile läuft über die ganze Breite, die offenen Parks stehen im Weltkarten-Panel

Ab 1280 px Seitenbreite (`@container/page`, dieselbe Schwelle wie die Kartenspalte) zeigt das
Weltkarten-Panel oben im Kopf „N Parks weltweit offen" (`home.worldPanel.openWorldwide`, sechs
Sprachen), und die Textspalte blendet ihr Badge aus. Der News-Chip hat die Zeile damit für sich:
`LatestNewsChip` läuft bis zum Rand der Spalte, bündig mit dem Suchfeld, und der Pfeil sitzt am
Ende. Bei 1440 px war die Überschrift neben dem Badge abgeschnitten, jetzt steht sie ganz da.
Unter 1280 px bleibt das Badge über der Überschrift.

Beide Stellen zeichnen `OpenParksBadge` (`components/home/open-parks-badge.tsx`), das Skeleton des
Panels zeichnet es im Ladezustand. Der Kopf des Panels misst in Skeleton und echtem Panel 121 px,
bei 1280, 1440 und 1600 px. Die Zahl kommt aus `useGlobalStats`, derselben Abfrage wie in der
Textspalte, also ohne zusätzlichen Request; `HeroWorldPanel` gibt `getGlobalStats()` als Seed mit,
den `HeroStats` im selben Render schon abruft. Das Badge liegt außerhalb der `aria-live`-Region
des Panels, damit nicht jeder Poll vorgelesen wird.
