### Der Foto-Export für die App liefert schmale Fotos auch in ihrer Originalbreite

Ein Foto, das schmaler als 1600 px ist, landete bisher nur in den Stufen darunter: ein 1024 px
breites Bild kam in der App mit 828 px an. Der Export nach `media.park.fan` legt solche Fotos jetzt
zusätzlich in ihrer eigenen Breite ab und nennt sie in `widths` der `index.json`. Hochskaliert wird
weiterhin nichts, die bisherigen Dateien bleiben unverändert.
