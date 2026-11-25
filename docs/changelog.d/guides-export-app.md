### Guides für die native App

Die App liest News als JSON aus dem Medien-Bucket, die Guides fehlten dort. `scripts/news-export.mjs`
schreibt jetzt auch jeden Beitrag, der keine News ist, nach `guides/<locale>.json` und
`guides/<locale>/<slug>.json`, mit denselben Feldern und Blocktypen wie unter `news/`. `url` zeigt
auf `/blog/<slug>`, und die Liste ist nicht auf 100 Einträge begrenzt. `pnpm publish:media` lädt
beide Ordner im selben Lauf hoch.

Der Workflow erzeugt vor dem Export die Bildzuschnitte. Ohne sie kannte das Manifest kein Titelbild,
das als `…-16x9.jpg` eingetragen ist, und der Export schrieb `cover: null`: bei 3 von 100 News und
18 von 71 Guides.
