### Byline im Beitrags-Header und auf Karten: „Patrick" statt „Patrick Arns"

- Autorendateien kennen ein optionales Feld `shortName` (`lib/blog/types.ts`). `BlogPostBanner` und
  `BlogPostCard` zeigen es als Byline, sonst den vollen `name`. `content/blog/authors/patrick.md`
  setzt `shortName: Patrick`.
- JSON-LD, Meta-Autor, RSS-Feed, Autorenseite, Avatar-`alt` und das `aria-label` des Autorenlinks
  behalten den vollen Namen.
- Der Blog-Editor reicht das Feld beim Anlegen und Bearbeiten eines Autors durch
  (`AuthorCreateModal`, `buildAuthorFile`), damit ein Speichern dort es nicht löscht.
