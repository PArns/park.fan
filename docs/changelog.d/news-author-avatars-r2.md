### Autorenfotos der News-App kommen aus dem Medien-Bucket

Der News-Export für die native App nannte als Autorenfoto eine Adresse auf park.fan, die App holte
das Bild also über Vercel. `scripts/publish-media-r2.mjs` lädt die Fotos jetzt als quadratische WebP
in 96 und 192 Pixeln unter `authors/<name>-<hash>-<breite>.webp` in den Bucket, neben die übrigen
Bilder. Der Hash stammt aus der Quelldatei, ein Schlüssel ändert sich also nie und wird nur einmal
hochgeladen. `author.avatar` zeigt auf die 192-Pixel-Datei bei media.park.fan, neu ist
`author.avatarSmall` für die 96-Pixel-Datei.
