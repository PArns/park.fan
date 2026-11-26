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

Neue Bilder: die Szenen 02 und 03 in allen sechs Sprachen und je Sprache ein Key Visual
(`public/media/app/<sprache>/key-visual.jpg`, drei Telefone rechts, links Platz für die Überschrift,
im Look der Store-Bilder). Es trägt die Vorschaukarte von `/app`, die bisher keinen eigenen Eintrag
hatte und als leere Kontinent-Karte herauskam: jetzt „park.fan in deiner Hosentasche“ über dem Key
Visual der Sprache. Im Kopf der Seite stehen dieselben drei Bildschirme als gezeichnete Telefone
(`PhoneFan`), scharf statt unter dem Schleier des Kopffotos. Das englische Key Visual ist das
Titelbild der Beta-News; ihre Vorschau ist die News-Karte mit dem Titel (`seo.ogImage`). Die News zeigt unter „Was die
App kann“ fünf Aufnahmen in schmalen Bildern (`| center | small`); `small` begrenzt ein Bild jetzt auch
auf dem Handy auf 240 px. In der App kommen alle fünf als `image`-Blöcke an.

„Bring mich hin“ heißt auf Französisch und Spanisch jetzt wie in der App: « Guide-moi », «Llévame allí».
