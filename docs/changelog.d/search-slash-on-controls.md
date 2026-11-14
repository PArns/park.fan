### `/` öffnet die Suche auch, wenn ein Link oder Chip den Fokus hat

Die Suche öffnete sich auf `/` nur, wenn nichts den Fokus hatte. Nach einem Klick auf einen Filter-Chip
im Hub oder auf einen Link im Header-Menü behielt dieser den Fokus, und `/` tat nichts, bis man in
die Seite klickte. `isSearchShortcut` (`lib/utils/page-focus.ts`) nimmt `/` jetzt auch auf einem
fokussierten Link, Knopf, Chip oder einer Kalenderzelle, die alle nichts mit `/` anfangen; in einem
Feld, einem bearbeitbaren Element, einem Dialog, einem Menü oder einer Listbox wartet es weiter
([Regel](../rules/a-keyboard-shortcut-waits-for-an-unfocused-page.md)).
