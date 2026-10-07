### Blog: `cta-widget` zeigt eine Handlung als Button

Ein Beitrag kann eine Handlung jetzt als Button zeigen statt als Link in einem Callout. Der Fence
`cta-widget` mit `href`, `label` und optional `text` rendert `BlogCtaWidget`
(`components/blog/blog-cta-widget.tsx`): einen Kasten mit einer Zeile Text und einem Link in
`buttonLinkProps` (Größe `lg`, auf Phones volle Breite und 44 px Mindesthöhe, das Label bricht um
statt die Spalte zu verbreitern). Gerendert wird nur eine http(s)-URL oder ein Pfad der Seite;
externe Ziele öffnen wie alle externen Links in Beiträgen in einem neuen Tab. Im Blog-Editor steht
der Fence im Widget-Katalog (`app/admin/blog-editor/_lib/widgets.ts`), dokumentiert ist er in
`content/blog/README.md` §6. Erster Einsatz ist der Petitionslink im News-Beitrag zur
Phantasialand-Erweiterung.
