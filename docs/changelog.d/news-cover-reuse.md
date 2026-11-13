### News bekommen ein wiederverwendetes Foto statt der Ersatzgrafik

Die Regel „ein Titelbild nur auf einer News“ in
[News is set apart from the articles](../rules/news-is-set-apart-from-the-articles.md#a-news-post-reuses-a-photo-rather-than-going-without)
ist ersetzt. Eine News über einen Park nimmt zuerst ein noch unbenutztes Motiv aus der Sammlung des
Parks, dann eine passende Saison-Sammlung, dann ein Foto des Parks, das schon auf anderen Beiträgen
steht, und zwar das, dessen letzte Nutzung in einer News am längsten zurückliegt. `BlogCoverFallback`
gibt es nur noch für einen Park ohne ein einziges Foto in der Mediendatenbank. Ein wiederverwendetes
Foto übernimmt `alt` aus dem Sidecar und bekommt eine eigene Bildunterschrift.

Anlass: Für Disneyland Paris gibt es ein Foto, und die drei Paris-News nach der Halloween-News liefen
deshalb mit der Ersatzgrafik. `docs/writing/5-posts-and-news.md` und
`docs/features/blog-cover-fallback.md` verweisen auf die neue Regel.
