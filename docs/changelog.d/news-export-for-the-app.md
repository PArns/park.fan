### Die News liegen für die App als JSON auf media.park.fan

Die App kann `park.fan/api/*` nicht lesen, weil Cloudflare dort Skripte abfängt. Der Export nach
`media.park.fan` schreibt deshalb pro Sprache `news/<locale>.json` mit den neuesten hundert News
und je Beitrag `news/<locale>/<slug>.json` mit dem Text als fertige Blöcke, also Überschriften,
Absätzen, Listen, Zitaten, Tabellen und Hinweisen, die die App ohne Markdown-Renderer zeichnet.
Titelfotos, die noch nicht im Foto-Export waren, kommen mit. Live-Widgets wie die besten Tage
fehlen in den Blöcken, ein Aufruf zum Handeln wird ein Link. Der Workflow läuft jetzt auch, wenn
sich etwas unter `content/blog/` ändert.
