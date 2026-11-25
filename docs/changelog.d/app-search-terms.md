### Der News- und Guides-Export für die App trägt die Suchwörter der Website

Jeder Eintrag in `news/<locale>.json` und `guides/<locale>.json` (und jede Artikeldatei) hat zwei
neue, optionale Felder: `terms`, die Wörter aus SEO-Keywords und Tags, und `categoryLabel`, den
Namen der Kategorie in der Sprache der Liste. `scripts/news-export.mjs` nimmt beide aus dem
Eintrag, den die Suche der Website selbst benutzt (`getPostSearchIndex`,
`lib/navigation/blog-menu.ts`), es gibt also keine zweite Stelle, die sie baut. Der App fehlten
beide: „Jahreskarte“ fand dort einen Guide statt sechs, „single rider“ einen statt drei, und die
neun Guides der Kategorien `park-fan`, `new-attractions` und `behind-the-scenes` waren über ihre
Kategorie nicht zu finden.

`schema` bleibt 1, die Felder kommen nur hinzu. `guides/de.json` wächst von 67.592 auf 86.126 Bytes
(gzip 16.110 auf 21.338), `news/de.json` von 65.273 auf 84.919 (gzip 17.012 auf 22.156). Der
Workflow `publish-media` läuft jetzt auch bei einer Änderung an `lib/navigation/blog-menu.ts`.
