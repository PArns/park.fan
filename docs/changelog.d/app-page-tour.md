### `/app` führt durch die App, und die Beta-News zeigt sie

Die App-Seite ist jetzt ein Rundgang in acht Kapiteln. Vor dem Besuch stehen Kalender und Tagesplaner
je neben ihrer Aufnahme; im Park zeigen drei Telefone nebeneinander Parkseite, Bahnseite und Kompass,
mit Titel und Unterzeile aus dem Store-Kit (auf dem Handy eine Reihe zum Wischen), dazu Karten zu
Wartezeiten, Kompass und Parkkarte mit Toiletten und Trinkwasser. Sperrbildschirm, Dynamic Island und
Apple Watch zeigt eine gezeichnete Skizze, ausdrücklich kein Screenshot, darunter die sechs Arten von
Mitteilungen. Parky steht mit seinen drei Wegen (fragen, Parktag-Interview, Weg zeigen) neben seiner
Aufnahme; „Kein Konto, keine Werbung, kein Tracking“ hat ein eigenes Kapitel. Die häufigen Fragen sind
ein eigenes Kapitel mit `FAQPage` (`FaqList` nimmt dafür `rich`, die Antwort mit Links), dazu
„Wie komme ich in die Beta?“ und „Was kostet die App?“. Die Seite trägt `MobileApplication` als
strukturierte Daten (`MobileApplicationStructuredData`).

Neue Aufnahmen: Szenen 02 und 03 in allen sechs Sprachen (`public/media/app/<sprache>/`), und
`public/media/app/cover.webp`, drei Telefone als Titelbild der Beta-News. Die News zeigt unter „Was die
App kann“ fünf Aufnahmen in schmalen Bildern (`| center | small`); `small` begrenzt ein Bild jetzt auch
auf dem Handy auf 240 px. In der App kommen alle fünf als `image`-Blöcke an.

„Bring mich hin“ heißt auf Französisch und Spanisch jetzt wie in der App: « Guide-moi », «Llévame allí».
