### Eine News ohne Park-Tag zeigt drei Zeilen Teaser

Ohne Park-Tag (Plohn, `parkLinks: false`) stand der Text einer Kachel auf `/news` mittig neben dem Cover, über und unter ihm blieb eine Lücke. `PostStreamEntry` (`components/blog/post-stream.tsx`) gibt dem Teaser ab `sm` eine dritte Zeile, wenn weder Label noch Meta-Zeile da sind. Titel und drei Zeilen kommen auf 89 px, das Cover ist 100 px hoch. Mit Park-Tag, mit Meta-Zeile und auf dem Handy bleibt es bei zwei Zeilen, dort ist der Text ohnehin höher als das Cover.
