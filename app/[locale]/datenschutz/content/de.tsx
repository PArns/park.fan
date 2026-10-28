import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { AnalyticsOptOut } from '@/components/common/analytics-opt-out';
import { LegalH2, LegalH3, LegalLink, LegalList } from '@/components/legal/legal-blocks';

/** The privacy policy in German, shown on the `de` locale. */
export function DatenschutzDE() {
  return (
    <>
      <h1 className="mb-2 text-4xl font-bold">Datenschutzerklärung</h1>
      <p className="text-muted-foreground mb-8 text-sm">Stand: 28. Oktober 2026</p>

      <div className="space-y-4 text-base leading-7">
        <LegalH2>1. Verantwortlicher</LegalH2>
        <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
        <address className="not-italic">
          <strong>Patrick Arns</strong>
          <br />
          Ahrstr. 7
          <br />
          52511 Geilenkirchen
          <br />
          E-Mail:{' '}
          <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[ät]park.fan" />
        </address>
        <p>
          park.fan lässt sich ohne Konto nutzen. Welche Daten verarbeitet werden, hängt davon ab,
          welche Funktionen Sie verwenden. Die folgenden Abschnitte nennen jede einzeln. Wir zeigen
          keine Werbung und geben keine Daten zu Werbezwecken weiter.
        </p>

        <LegalH2>2. Hosting und Auslieferung</LegalH2>

        <LegalH3>Vercel</LegalH3>
        <p>
          Die Website wird bei Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA
          gehostet. Vertreter in der EU ist die EDPO, Avenue Huart Hamoir 71, 1030 Brüssel, Belgien.
          Bei jedem Seitenaufruf verarbeitet Vercel die Daten, die Ihr Browser mitschickt:
          IP-Adresse, Zeitpunkt, aufgerufene Adresse, Referrer, Browser und Betriebssystem. Vercel
          braucht sie, um die Seiten auszuliefern, und hält sie für kurze Zeit in Server-Protokollen
          vor. Wir führen diese Daten nicht mit anderen Daten zusammen.
        </p>
        <p>
          Vercel verarbeitet die Daten in unserem Auftrag auf Grundlage eines Vertrags über
          Auftragsverarbeitung. Daten können dabei in die USA übermittelt werden. Vercel ist nach
          dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist unser berechtigtes
          Interesse an einer sicheren und schnellen Auslieferung der Website (Art. 6 Abs. 1 lit. f
          DSGVO). Weitere Informationen:{' '}
          <LegalLink href="https://vercel.com/legal/privacy-policy" />.
        </p>

        <LegalH3>Cloudflare</LegalH3>
        <p>
          Zwischen Ihrem Browser und Vercel sowie unserem API-Server api.park.fan liegt das Netzwerk
          der Cloudflare Inc., 101 Townsend St., San Francisco, CA 94107, USA. Cloudflare
          beantwortet DNS-Anfragen, hält Kopien unserer Seiten vor und filtert Angriffe heraus.
          Dafür verarbeitet Cloudflare Ihre IP-Adresse und die technischen Daten Ihrer Anfrage und
          kann ein Cookie zur Abwehr von Bots setzen.
        </p>
        <p>
          Rechtsgrundlage ist unser berechtigtes Interesse an einer sicheren und fehlerfreien
          Bereitstellung (Art. 6 Abs. 1 lit. f DSGVO). Cloudflare verarbeitet die Daten in unserem
          Auftrag. Die Übermittlung in die USA stützt sich auf die Zertifizierung von Cloudflare
          nach dem{' '}
          <LegalLink href="https://www.dataprivacyframework.gov/participant/5666">
            EU-US Data Privacy Framework
          </LegalLink>{' '}
          und auf die Standardvertragsklauseln der EU-Kommission. Weitere Informationen:{' '}
          <LegalLink href="https://www.cloudflare.com/privacypolicy/" />.
        </p>

        <LegalH3>Unser API-Server (api.park.fan)</LegalH3>
        <p>
          Wartezeiten, Parkdaten, Favoriten, die Suche nach Parks in der Nähe, gespeicherte
          Tagespläne, Push-Benachrichtigungen und die Statistik (Abschnitt 4) laufen über unseren
          eigenen Server api.park.fan. Ihn betreiben wir selbst auf eigener Hardware in Deutschland,
          ein externer Hoster ist nicht beteiligt. Anfragen an ihn laufen über Cloudflare.
        </p>
        <p>
          Bei einigen Anfragen gibt die Website Ihre IP-Adresse an diesen Server weiter: um Ihren
          ungefähren Standort zu bestimmen, wenn Sie keine Standortfreigabe erteilt haben, und um zu
          begrenzen, wie viele Tagespläne und Push-Abonnements eine Adresse in kurzer Zeit anlegen
          kann. Der Server protokolliert keine IP-Adressen. Rechtsgrundlage ist unser berechtigtes
          Interesse an einem funktionierenden und vor Missbrauch geschützten Angebot (Art. 6 Abs. 1
          lit. f DSGVO).
        </p>

        <LegalH2>3. Funktionen der Website</LegalH2>

        <LegalH3>Cookies und lokaler Speicher</LegalH3>
        <p>
          Wir setzen keine Cookies zu Werbe- oder Analysezwecken. Die folgenden Cookies setzen wir
          selbst, jeweils für eine Funktion, die Sie gewählt haben:
        </p>
        <LegalList>
          <li>
            <code>favorites</code>: Ihre Favoriten. Der Inhalt geht an unseren API-Server, damit er
            die Wartezeiten dazu liefern kann. Gültig ein Jahr.
          </li>
          <li>
            <code>temp_unit</code>: ob Temperaturen in Celsius oder Fahrenheit angezeigt werden.
          </li>
          <li>
            <code>NEXT_LOCALE</code>: die zuletzt gewählte Sprache.
          </li>
        </LegalList>
        <p>
          Im lokalen Speicher (Local Storage) Ihres Browsers legen wir Einstellungen ab, etwa das
          Farbschema, Ihren Tagesplan, Ihre Benachrichtigungen, Ihre Entscheidung zur
          Standortfreigabe und zur Statistik, dazu zwischengespeicherte Ergebnisse. Diese Daten
          bleiben auf Ihrem Gerät. Was davon an unseren Server geht, steht in den Abschnitten zu
          Tagesplaner und Push-Benachrichtigungen.
        </p>
        <p>
          Für diese Cookies und Einträge braucht es keine Einwilligung, weil sie für die von Ihnen
          gewünschte Funktion unbedingt erforderlich sind (§ 25 Abs. 2 Nr. 2 TDDDG). Die
          anschließende Verarbeitung stützt sich auf Art. 6 Abs. 1 lit. f DSGVO. Sie können alles
          jederzeit in den Einstellungen Ihres Browsers löschen.
        </p>

        <LegalH3>Standort und „Parks in der Nähe“</LegalH3>
        <p>
          Auf der Startseite und auf Parkseiten zeigen wir Parks in Ihrer Nähe und, wenn Sie in
          einem Park stehen, Hinweise für diesen Park. Erteilen Sie in Ihrem Browser die
          Standortfreigabe, senden wir die Koordinaten Ihres Geräts an unseren API-Server.
          Andernfalls bestimmt der Server einen ungefähren Standort aus Ihrer IP-Adresse. In beiden
          Fällen wird der Standort nur für die Antwort verwendet und nicht gespeichert.
        </p>
        <p>
          Rechtsgrundlage für die Koordinaten ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO),
          die Sie in den Standorteinstellungen Ihres Browsers jederzeit widerrufen können. Die
          Näherung über die IP-Adresse beruht auf unserem berechtigten Interesse, Ihnen passende
          Parks zu zeigen (Art. 6 Abs. 1 lit. f DSGVO).
        </p>

        <LegalH3>Tagesplaner</LegalH3>
        <p>
          Ihr Tagesplan liegt im lokalen Speicher Ihres Browsers. Auf unseren API-Server kommt er
          nur, solange Sie für den Plan Push-Benachrichtigungen eingeschaltet haben, denn der Server
          muss wissen, wann er Sie erinnern soll. Gespeichert werden der Park, der Tag und die
          geplanten Programmpunkte unter einer zufälligen Kennung, keine Angaben zu Ihrer Person.
          Wer einen geteilten Link kennt, kann den Plan öffnen. Schalten Sie die Benachrichtigungen
          aus, löschen wir die Kopie auf dem Server. Rechtsgrundlage ist die Bereitstellung der von
          Ihnen gewünschten Funktion (Art. 6 Abs. 1 lit. b DSGVO).
        </p>

        <LegalH3>Push-Benachrichtigungen</LegalH3>
        <p>
          Sie können sich benachrichtigen lassen, wenn die Wartezeit einer Attraktion unter einen
          Wert fällt, eine Show beginnt oder der nächste Punkt Ihres Tagesplans ansteht. Erst wenn
          Sie das einschalten und Ihrem Browser die Erlaubnis geben, wird ein Abonnement angelegt.
          Auf unserem API-Server speichern wir dann die Push-Adresse Ihres Browsers mit den
          zugehörigen Schlüsseln, Ihre Sprache, Ihre Zeitzone und wem oder was Sie folgen, samt der
          gewählten Schwellenwerte.
        </p>
        <p>
          Zugestellt werden die Nachrichten über den Push-Dienst des Herstellers Ihres Browsers, zum
          Beispiel Google (Chrome, Android), Apple (Safari), Mozilla (Firefox) oder Microsoft
          (Edge). Dieser Dienst erfährt die Push-Adresse und den Zeitpunkt, den Inhalt der Nachricht
          sieht er nur verschlüsselt. Dabei können Daten in die USA übermittelt werden.
        </p>
        <p>
          Rechtsgrundlage ist Ihre Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie können die
          Benachrichtigungen jederzeit auf der Seite „Alarme“ oder in den Einstellungen Ihres
          Browsers abbestellen. Bestellen Sie alle ab, löschen wir das Abonnement.
        </p>

        <LegalH3>Fotos einsenden</LegalH3>
        <p>
          Über das Formular „Fotos hochladen“ können Sie uns Fotos schicken. Wir speichern die
          Fotos, den Park oder die Attraktion, die Bildunterschrift und den Namen, unter dem Sie
          genannt werden möchten. Fotos bis 4 MB laden wir unverändert hoch, mit allen Metadaten der
          Datei. Dazu gehören oft Aufnahmezeit und Kamera und, je nach Gerät, der Aufnahmeort. Mit
          dem Aufnahmeort prüfen wir, ob das Foto im angegebenen Park entstanden ist. Größere Fotos
          verkleinert Ihr Browser vor dem Hochladen, dabei gehen die Metadaten verloren. Bevor wir
          ein Foto veröffentlichen, entfernen wir alle Metadaten aus der Datei.
        </p>
        <p>
          Die Einsendungen liegen in einem nicht öffentlichen Speicher bei Vercel (Vercel Blob,
          siehe oben). Abgelehnte Einsendungen löschen wir nach der Prüfung. Veröffentlichte Fotos
          bleiben gespeichert, solange sie auf park.fan zu sehen sind. Rechtsgrundlage ist die
          Lizenz, die Sie uns mit der Einsendung einräumen (Art. 6 Abs. 1 lit. b DSGVO). Auf Wunsch
          per E-Mail löschen wir Ihre Einsendung.
        </p>
        <p>
          Gegen automatisierte Einsendungen setzen wir Cloudflare Turnstile ein. Das Skript wird
          erst geladen, wenn das Formular erscheint. Turnstile prüft anhand Ihrer IP-Adresse und
          technischer Merkmale Ihres Browsers, ob ein Mensch das Formular bedient. Rechtsgrundlage
          ist unser berechtigtes Interesse an einem Schutz vor Spam und Missbrauch (Art. 6 Abs. 1
          lit. f DSGVO). Zur Übermittlung in die USA gilt das oben zu Cloudflare Gesagte.
        </p>

        <LegalH3>Kontakt per E-Mail oder Telefon</LegalH3>
        <p>
          Wenn Sie uns schreiben oder anrufen, verarbeiten wir Ihre Anfrage mit Ihren Kontaktdaten,
          um sie zu beantworten. Rechtsgrundlage ist unser berechtigtes Interesse an der
          Beantwortung (Art. 6 Abs. 1 lit. f DSGVO), bei Anfragen zu einem Vertrag Art. 6 Abs. 1
          lit. b DSGVO. Wir löschen die Anfrage, wenn sie erledigt ist und keine gesetzliche
          Aufbewahrungspflicht entgegensteht.
        </p>

        <LegalH2>4. Statistik</LegalH2>

        <LegalH3>Umami</LegalH3>
        <p>
          Um zu sehen, welche Seiten gelesen und welche Funktionen genutzt werden, verwenden wir
          Umami Cloud der Umami Software, Inc., USA. Umami setzt keine Cookies und legt nichts in
          Ihrem Browser ab. Das Skript sendet bei jedem Seitenaufruf die Adresse der Seite, den
          Referrer, Bildschirmgröße, Sprache, Browser, Betriebssystem und Gerätetyp. Wird eine
          Interaktion oder eine Layoutverschiebung auffällig langsam, kommt ein Leistungsmaß mit dem
          betroffenen Seitenelement dazu. Klicks und Funktionen meldet Umami nicht, die zählen wir
          selbst (siehe unten). Aus der IP-Adresse wird das Land bestimmt. Zusammen mit den
          Browserangaben und einem Wert, der jeden Monat wechselt, wird daraus außerdem eine Kennung
          gebildet, die die Aufrufe desselben Browsers innerhalb eines Monats zusammenfasst. Die
          IP-Adresse selbst wird nicht gespeichert. Ein Profil über mehrere Websites entsteht nicht.
        </p>
        <p>
          Umami verarbeitet die Daten in unserem Auftrag. Umami und einige seiner Dienstleister
          sitzen in den USA, eine Übermittlung dorthin ist daher möglich. Sie stützt sich auf die
          Standardvertragsklauseln der EU-Kommission, die Teil des Auftragsverarbeitungsvertrags mit
          Umami sind. Rechtsgrundlage ist unser berechtigtes Interesse, das Angebot anhand von
          Nutzungsstatistiken zu verbessern (Art. 6 Abs. 1 lit. f DSGVO). Hat Ihr Browser „Do Not
          Track“ eingeschaltet, wird nichts gesendet. Unten können Sie Ihre Besuche außerdem von der
          Statistik ausschließen. Weitere Informationen:{' '}
          <LegalLink href="https://umami.is/privacy" />.
        </p>

        <LegalH3>Eigene Statistik</LegalH3>
        <p>
          Daneben zählt unser Server selbst, welche Seiten aufgerufen und welche Funktionen genutzt
          werden. Aus derselben Zählung entstehen die Listen der meistgelesenen Beiträge. Das
          geschieht ohne Kennung in Ihrem Browser. Bei jedem Seitenaufruf, auch beim Wechsel
          zwischen zwei Seiten der Website, schickt Ihr Browser an api.park.fan den Pfad der Seite
          ohne Suchbegriffe und Anker, die Art der Seite (zum Beispiel Park, Attraktion oder
          Beitrag), die Sprache und die Fensterbreite in drei Stufen (Telefon, Tablet, Computer).
          Beim ersten Aufruf nach dem Öffnen der Website kommt die Herkunft dazu: der Domainname der
          Website, von der Sie kommen, oder, wenn der Link sie enthielt, der Wert von{' '}
          <code>utm_source</code> und <code>utm_campaign</code>. Die Art der Herkunft (zum Beispiel
          Suchmaschine oder soziales Netzwerk) leitet der Server daraus ab. Auch der Pfad einer
          Adresse, die es nicht gibt, wird gezählt, damit wir kaputte Links finden.
        </p>
        <p>
          Bei bestimmten Handlungen sendet Ihr Browser außerdem ein Ereignis. Name und Werte legen
          wir im Programmcode fest. Es sind kurze Wörter und Zahlen, nie ein Text, den Sie
          geschrieben haben. Das sind zum Beispiel: welches Suchfeld geöffnet wurde und von welcher
          Art der Treffer war, den Sie angeklickt haben, welchen Reiter Sie auf einer Parkseite
          geöffnet haben, ob Sie einen Favoriten gesetzt oder entfernt haben, welche Sprache Sie
          gewählt haben, ob Sie einen Wartezeit-Alarm oder eine Show-Erinnerung gesetzt haben, wie
          Sie den Tagesplaner geöffnet haben, dass Sie einen Link zur Website oder zum Ticketshop
          eines Parks angeklickt oder eine Seite geteilt haben, wie Sie auf die Frage nach
          Benachrichtigungen geantwortet haben oder dass eine Fehlerseite angezeigt wurde. Steht ein
          Beitrag, ein Park oder eine Attraktion fünf Sekunden im Vordergrund, zählt das als Lesen.
          Bei Beiträgen halten wir außerdem fest, ob Sie ein Viertel, die Hälfte, drei Viertel oder
          alles gelesen haben. Gehört ein Ereignis zu einem Park, einer Attraktion, einer Show oder
          einem Restaurant, steht deren Kennung dabei, bei einem Beitrag sein Name aus der Adresse.
          Was Sie in ein Suchfeld tippen, Ihren Standort und Ihre Eingaben sendet der Browser nicht.
          Ladezeiten messen wir hier nicht. Gemessen wird dagegen, wie lange eine Seite im
          Vordergrund Ihres Browsers sichtbar war: Ihr Browser zählt die Sekunden und meldet sie,
          wenn Sie zur nächsten Seite wechseln oder den Tab verlassen. Eine Uhrzeit sendet er dabei
          nicht, und je Seitenaufruf zählen höchstens 30 Minuten.
        </p>
        <p>
          Wie bei jeder Anfrage erhält der Server dabei Ihre IP-Adresse, die Angaben zu Browser und
          Betriebssystem (User-Agent) und die Sprachen, die Ihr Browser angibt. Daraus leitet er die
          Browser- und die Betriebssystemfamilie ab (zum Beispiel Safari und iOS), aus der
          IP-Adresse das Land und aus der ersten Sprache im Kopf der Anfrage die Browsersprache als
          zweistelligen Code (zum Beispiel <code>de</code>). Danach behält er weder User-Agent noch
          IP-Adresse. Beide werden nirgends gespeichert.
        </p>
        <p>
          In der Datenbank stehen nur Zeilen mit Zählern, jede für eine volle Stunde (UTC) und nie
          für einen Zeitpunkt. Der Server schreibt sie alle fünf Minuten, fügt sie nur hinzu und
          ändert sie nicht, und er löscht sie nach 400 Tagen als ganze Teile der Tabelle. Die
          täglichen Besucherzahlen (eine Zahl je Tag, insgesamt und je Sprache) bleiben davon
          unberührt. Es gibt vier Arten von Zeilen:
        </p>
        <LegalList>
          <li>
            <strong>Seitenaufruf:</strong> Sprache, Pfad, Seitenart, Fensterbreite, Browserfamilie,
            Betriebssystemfamilie, Land und Browsersprache, dazu die Zahl der Aufrufe und die Summe
            der Sekunden im Vordergrund. Nichts davon gehört zu einem Besuch.
          </li>
          <li>
            <strong>Beginn eines Besuchs:</strong> die erste Seite und das Gerät, dazu
            Einstiegsseite, Herkunft (die Website), Kanal und Kampagne, außerdem die Zahl der
            Besuche, die Zahl der Besuche, die eine zweite Seite sahen, und die Summe der Sekunden
            im Vordergrund.
          </li>
          <li>
            <strong>Ende eines Besuchs:</strong> die letzte Seite und das Gerät, dazu dieselben
            Angaben zum Beginn, außerdem die Zahl der Besuchsenden und die Summe der Dauer (letzter
            Aufruf minus erster). So sind die erste und die letzte Seite eines Besuchs mit seiner
            Herkunft verbunden, die Seiten dazwischen nicht.
          </li>
          <li>
            <strong>Ereignis:</strong> Seite und Gerät (ohne Browsersprache), Name des Ereignisses,
            seine Werte aus der festen Auswahl und gegebenenfalls die Kennung eines Parks, einer
            Attraktion, einer Show oder eines Restaurants. Nichts davon gehört zu einem Besuch. Die
            Kennung eines Parks stammt nie aus Ihrem Standort: Die Ereignisse zu Parks in der Nähe
            und zum Kompass tragen keinen Park.
          </li>
        </LegalList>
        <p>
          Um Besucher, Besuche und Besuchsenden zu zählen und die Zählung vor Missbrauch zu
          schützen, bildet der Server aus IP-Adresse und User-Agent Kennungen, mit einem geheimen
          Schlüssel, der für jeden Tag ein anderer ist. Man kann sie nicht zurückrechnen, sie sind
          pseudonym, und sie liegen nur im Arbeitsspeicher unseres Servers (Redis), nie in der
          Datenbank. Dort stehen:
        </p>
        <LegalList>
          <li>
            <strong>Der Besuch:</strong> erste Seite, Herkunft (die Website), Kanal, Kampagne, Zahl
            der Seiten, der erste und der letzte Aufruf nach der Uhr des Servers (in Sekunden) und
            die Angaben zum Ende (letzte Seite und Gerät). Das wird gelöscht, wenn der Besuch endet,
            30 bis 35 Minuten nach dem letzten Aufruf, spätestens nach 40 Minuten.
          </li>
          <li>
            <strong>Die offenen Besuche:</strong> die Kennungen der laufenden Besuche mit der Zeit
            ihres letzten Aufrufs, bis der Besuch endet und nie länger als zwei Stunden.
          </li>
          <li>
            <strong>Live-Zähler je Minute</strong> (Seiten, Länder, Kanäle, Herkunftswebsites,
            Geräte, Namen der Ereignisse) und die Zähler für „Jetzt aktiv“ (Besucher, Aufrufe und
            Ereignisse je Minute): 35 Minuten. In den Live-Zählern steht keine Kennung eines
            Besuchers.
          </li>
          <li>
            <strong>Die Zählung der Besucher:</strong> je Tag höchstens 25 Stunden, je Stunde bis
            zum Ende des Tages.
          </li>
          <li>
            <strong>Obergrenzen:</strong> wie oft eine Adresse oder ein Besucher an einem Tag etwas
            sendet oder eine Seite liest, bis zum Ende des Tages (UTC) plus eine Minute. Die Mengen
            der Namen, Pfade, Herkunftswebsites und Kampagnen, die an einem Tag vorkamen, damit
            niemand sie mit Erfindungen füllt, bis zum Ende des folgenden Tages. In ihnen steht
            keine Kennung eines Besuchers.
          </li>
          <li>
            <strong>Zähler, die noch nicht geschrieben sind:</strong> die des laufenden
            Fünf-Minuten-Fensters, etwa sechs Minuten lang.
          </li>
          <li>
            <strong>Zähler ohne Bezug zu einem Besucher:</strong> wie viele Anfragen in einem
            Fünf-Minuten-Fenster eingingen (15 Minuten) und wie viele aus welchem Grund verworfen
            wurden (bis zum Ende des folgenden Tages).
          </li>
        </LegalList>
        <p>
          Wer an einem anderen Tag wiederkommt, wird erneut gezählt, denn die Kennungen eines Tages
          haben mit denen des nächsten nichts gemeinsam. Damit niemand die Listen der meistgelesenen
          Beiträge verfälscht, zählt eine Seite pro Besucher höchstens dreimal am Tag. Anfragen von
          Bots und aus automatisiert gesteuerten Browsern zählt der Server nicht. Gezählt wird nur
          auf park.fan selbst. Die Anfrage läuft über Cloudflare (siehe Abschnitt 2). Der Zähler
          setzt kein Cookie und legt nichts im lokalen Speicher ab.
        </p>
        <p>
          Rechtsgrundlage ist unser berechtigtes Interesse, die meistgelesenen Beiträge zu zeigen,
          auszuwerten, welche Seiten in welcher Sprache und über welche Wege gefragt sind und welche
          Funktionen und welche Suche genutzt werden, um das Angebot zu verbessern, und die Zählung
          vor Verfälschung zu schützen (Art. 6 Abs. 1 lit. f DSGVO). Sie können der Zählung
          jederzeit ohne Angabe von Gründen widersprechen. Ist in Ihrem Browser „Do Not Track“ oder
          „Global Privacy Control“ eingeschaltet oder schließen Sie Ihre Besuche unten aus, sendet
          Ihr Browser nichts an den Zähler. Der Schalter unten gilt auch für Umami.
        </p>
        <AnalyticsOptOut />

        <LegalH2>5. Karten und eingebettete Inhalte</LegalH2>

        <LegalH3>Karten (CARTO)</LegalH3>
        <p>
          Unsere Karten verwenden Kartenbilder von CARTO (CartoDB Inc., 307 Fifth Avenue, Floor 9,
          New York, NY 10016, USA), erstellt aus Daten von OpenStreetMap. Sobald eine Karte
          angezeigt wird, lädt Ihr Browser die Kartenbilder direkt von den Servern von CARTO. CARTO
          erfährt dabei Ihre IP-Adresse, den Zeitpunkt und den gezeigten Kartenausschnitt. CARTO ist
          nach dem EU-US Data Privacy Framework zertifiziert. Rechtsgrundlage ist unser berechtigtes
          Interesse an einer anschaulichen Darstellung der Parks (Art. 6 Abs. 1 lit. f DSGVO).
          Weitere Informationen: <LegalLink href="https://carto.com/privacy" />.
        </p>

        <LegalH3>YouTube</LegalH3>
        <p>
          Einige Blogbeiträge enthalten YouTube-Videos der Google Ireland Limited, Gordon House,
          Barrow Street, Dublin 4, Irland. Bis Sie auf „Video abspielen“ tippen, sehen Sie nur ein
          Vorschaubild, das über unseren eigenen Server ausgeliefert wird. Erst mit dem Tippen lädt
          Ihr Browser den Player im erweiterten Datenschutzmodus (youtube-nocookie.com). Dann erhält
          YouTube Ihre IP-Adresse und Angaben zu Ihrem Gerät und kann Daten im Browser speichern.
          Dabei können Daten an die Google LLC in den USA übermittelt werden, die nach dem EU-US
          Data Privacy Framework zertifiziert ist. Rechtsgrundlage ist Ihre Einwilligung durch das
          Tippen (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Weitere Informationen:{' '}
          <LegalLink href="https://policies.google.com/privacy" />.
        </p>

        <LegalH3>Suno</LegalH3>
        <p>
          Ein Blogbeitrag enthält einen Musik-Player von Suno, Inc., USA. Auch er wird erst geladen,
          wenn Sie auf „Song abspielen“ tippen. Dann erhält Suno Ihre IP-Adresse und Angaben zu
          Ihrem Gerät und kann Daten im Browser speichern. Rechtsgrundlage ist Ihre Einwilligung
          durch das Tippen (Art. 6 Abs. 1 lit. a DSGVO, § 25 Abs. 1 TDDDG). Für die USA besteht kein
          Angemessenheitsbeschluss, der Suno erfasst. Weitere Informationen:{' '}
          <LegalLink href="https://suno.com/privacy" />.
        </p>

        <LegalH3>Instagram</LegalH3>
        <p>
          Bettet ein Beitrag einen Instagram-Post ein, sehen Sie zunächst nur einen Link. Erst wenn
          Sie auf „Beitrag laden“ tippen, lädt Ihr Browser Inhalte der Meta Platforms Ireland
          Limited, Merrion Road, Dublin 4, Irland. Meta erhält dann Ihre IP-Adresse und Angaben zu
          Ihrem Gerät und kann Cookies setzen. Dabei können Daten an die Meta Platforms, Inc. in den
          USA übermittelt werden, die nach dem EU-US Data Privacy Framework zertifiziert ist.
          Rechtsgrundlage ist Ihre Einwilligung durch das Tippen (Art. 6 Abs. 1 lit. a DSGVO, § 25
          Abs. 1 TDDDG). Weitere Informationen:{' '}
          <LegalLink href="https://privacycenter.instagram.com/policy" />.
        </p>

        <LegalH2>6. Ihre Rechte</LegalH2>
        <p>Sie haben gegenüber uns das Recht auf</p>
        <LegalList>
          <li>Auskunft über die zu Ihnen gespeicherten Daten (Art. 15 DSGVO),</li>
          <li>Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
          <li>Löschung (Art. 17 DSGVO),</li>
          <li>Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
          <li>Datenübertragbarkeit (Art. 20 DSGVO),</li>
          <li>
            Widerruf einer Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO). Die bis
            dahin erfolgte Verarbeitung bleibt rechtmäßig.
          </li>
        </LegalList>
        <p>Eine E-Mail an die oben genannte Adresse genügt.</p>
        <p>
          <strong>
            Widerspruchsrecht (Art. 21 DSGVO): Beruht eine Verarbeitung auf Art. 6 Abs. 1 lit. e
            oder f DSGVO, können Sie ihr aus Gründen, die sich aus Ihrer besonderen Situation
            ergeben, jederzeit widersprechen. Wir verarbeiten die Daten dann nicht mehr, es sei
            denn, wir können zwingende schutzwürdige Gründe nachweisen, die Ihre Interessen, Rechte
            und Freiheiten überwiegen, oder die Verarbeitung dient der Geltendmachung, Ausübung oder
            Verteidigung von Rechtsansprüchen.
          </strong>
        </p>
        <p>
          Sie können sich außerdem bei einer Datenschutz-Aufsichtsbehörde beschweren. Für uns
          zuständig ist die Landesbeauftragte für Datenschutz und Informationsfreiheit
          Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf,{' '}
          <LegalLink href="https://www.ldi.nrw.de" />.
        </p>

        <LegalH2>7. Speicherdauer und Sicherheit</LegalH2>
        <p>
          Wo oben keine eigene Frist genannt ist, löschen wir personenbezogene Daten, sobald der
          Zweck entfällt und keine gesetzliche Aufbewahrungspflicht entgegensteht. Alle Verbindungen
          zu park.fan und api.park.fan sind per TLS verschlüsselt.
        </p>
        <p>
          Eine Pflicht, Daten bereitzustellen, besteht nicht. Ohne Standortfreigabe,
          Benachrichtigungen oder Einsendung stehen nur diese Funktionen nicht zur Verfügung. Eine
          automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO findet nicht statt.
        </p>

        <p className="text-muted-foreground mt-8 text-sm">
          Teile dieser Erklärung beruhen auf einer Vorlage von{' '}
          <LegalLink href="https://www.e-recht24.de">e-recht24.de</LegalLink>.
        </p>
      </div>
    </>
  );
}
