### Blog: `cta-widget` zeigt eine Handlung als Button, und News ordnen einen Tag nach Uhrzeit

#### `cta-widget`

Ein Beitrag kann eine Handlung jetzt als Button zeigen statt als Link in einem Callout. Der Fence
`cta-widget` mit `href`, `label` und optional `text` rendert `BlogCtaWidget`
(`components/blog/blog-cta-widget.tsx`): einen Kasten mit einer Zeile Text und einem Link in
`buttonLinkProps` (Größe `lg`, auf Phones volle Breite und 44 px Mindesthöhe, das Label bricht um
statt die Spalte zu verbreitern). Gerendert wird nur eine http(s)-URL oder ein Pfad der Seite;
externe Ziele öffnen wie alle externen Links in Beiträgen in einem neuen Tab. Im Blog-Editor steht
der Fence im Widget-Katalog (`app/admin/blog-editor/_lib/widgets.ts`), dokumentiert ist er in
`content/blog/README.md` §6. Erster Einsatz ist der Petitionslink im News-Beitrag zur
Phantasialand-Erweiterung.

#### News tragen eine Uhrzeit

Jeder News-Beitrag hat jetzt `time: 'HH:MM'` (Europe/Berlin, in allen sechs Sprachen gleich).
Vorher sortierten `/news`, das News-Panel im Header, der Hero-Chip, der Feed und die News-Sitemap
nur nach `date`, und der Vergleich gab bei gleichem Tag nie 0 zurück. Die vier News vom 1. Oktober
und die vier vom 23. September standen so in zufälliger Reihenfolge. `lib/blog/published-at.ts`
liest die Uhrzeit an einer Stelle (`publishedAt`, `newestPublishedFirst`, `withZoneOffset`); sie
geht auch in `datePublished`, in `<news:publication_date>` und in das `pubDate` des Feeds. Die 18
bestehenden News haben die Minute bekommen, in der sie auf `main` kamen.
`pnpm check:blog-updated-at` lässt keinen News-Beitrag ohne gültige, einheitliche Uhrzeit durch,
`pnpm test:news-split` prüft die Reihenfolge in allen sechs Sprachen.
