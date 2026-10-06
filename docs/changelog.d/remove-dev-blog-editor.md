### `/dev/blog-editor` ist entfernt

Die Seite war ein Testaufbau für den Editor und lief in Produktion ohne Login: Sie renderte `EditorCanvas` und `MarkdownPreview` aus dem Admin für jeden Besucher, geschützt nur durch `noindex`. Ihre Aufrufe gegen `/api/admin/*` antworteten zwar mit 401, die Oberfläche selbst war aber öffentlich. Der echte Editor unter `/admin/blog-editor` steht hinter dem Login und bleibt unverändert. Mit der Seite fallen die `/dev`-Einträge in `robots.txt`, in den Noindex-Headern von `next.config.ts` und im Ausschluss des `proxy.ts`-Matchers weg.
