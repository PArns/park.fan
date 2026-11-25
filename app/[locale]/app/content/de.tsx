import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { LegalH2, LegalH3, LegalList } from '@/components/legal/legal-blocks';

/** The app's support page in German, shown on the `de` locale. */
export function AppSupportDE({ howtoPath }: { howtoPath: string }) {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">park.fan für iPhone</h1>

      <div className="space-y-4 text-base leading-7">
        <p>
          Die App zeigt dir die Wartezeiten in Freizeitparks live, einen Andrang-Kalender mit
          Prognosen und plant deinen Parktag mit dir. Im Park führt dich der Kompass zu den
          Attraktionen, und dein Parktag steht auf dem Sperrbildschirm. Sie ist kostenlos, braucht
          kein Konto und zeigt keine Werbung.
        </p>

        <LegalH2>Was du brauchst</LegalH2>
        <LegalList>
          <li>ein iPhone mit iOS 26 oder neuer, auch das iPhone Duo</li>
          <li>
            eine Internetverbindung für die Live-Daten; zuletzt Geladenes bleibt auch ohne Netz zu
            sehen
          </li>
          <li>
            die App spricht Deutsch, Englisch, Niederländisch, Französisch, Spanisch und Italienisch
          </li>
        </LegalList>

        <LegalH2>Häufige Fragen</LegalH2>

        <LegalH3>Warum sehe ich keinen Kompass?</LegalH3>
        <p>
          Kompass, „Bring mich hin“ und der Parktag auf dem Sperrbildschirm erscheinen, wenn du in
          einem geöffneten Park stehst und der App deinen Standort erlaubt hast. Das prüfst du in
          den Einstellungen deines iPhones unter Datenschutz &amp; Sicherheit → Ortungsdienste →
          park.fan.
        </p>

        <LegalH3>Warum kommt keine Mitteilung?</LegalH3>
        <p>
          Sieh in den Einstellungen deines iPhones unter Mitteilungen → park.fan nach, ob sie
          erlaubt sind, und in der App unter Einstellungen → Mitteilungen, welche Arten an sind. Ein
          Wartezeit-Alarm meldet sich erst, wenn die Wartezeit der Bahn unter deinen Wert fällt.
        </p>

        <LegalH3>Wie genau sind die Wartezeiten?</LegalH3>
        <p>
          Die Live-Wartezeiten sind die, die die Parks angeben. Prognosen und der Kalender sind
          Schätzungen aus gemessenen Wartezeiten und können danebenliegen. Woher die Zahlen kommen,
          steht unter <Link href={howtoPath as '/'}>So funktioniert park.fan</Link>.
        </p>

        <LegalH3>Wie lösche ich meine Daten?</LegalH3>
        <p>
          Favoriten und Pläne liegen auf deinem iPhone und sind mit der App gelöscht. Was die App
          sendet, wie lange es bleibt und wie du es löschst, steht in der{' '}
          <Link href={'/datenschutz#app' as '/datenschutz'}>Datenschutzerklärung</Link>.
        </p>

        <LegalH2>Hilfe und Kontakt</LegalH2>
        <p>
          Schreib uns bei Fragen, Fehlern oder Wünschen an{' '}
          <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[ät]park.fan" />.
          Anschrift und Telefon stehen im <Link href="/impressum">Impressum</Link>.
        </p>
        <p>
          park.fan ist ein unabhängiges Angebot und steht in keiner Verbindung zu den Parks oder
          ihren Betreibern. Namen und Marken gehören ihren Inhabern.
        </p>
      </div>
    </>
  );
}
