/* eslint-disable react/no-unescaped-entities */
import { getTranslations } from 'next-intl/server';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import type { Metadata } from 'next';
import { LocaleContent } from '@/components/common/locale-content';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { getOgImageUrl } from '@/lib/utils/og-image';

interface DatenschutzPageProps {
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: DatenschutzPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'datenschutz' });
  const ogImageUrl = getOgImageUrl([locale]);

  return {
    title: t('title'),
    description: t('description'),
    openGraph: {
      title: t('title'),
      description: t('description'),
      locale: locale === 'de' ? 'de_DE' : 'en_US',
      alternateLocale: locale === 'de' ? 'en_US' : 'de_DE',
      url: `https://park.fan/${locale}/datenschutz`,
      siteName: 'park.fan',
      type: 'website',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: t('title'),
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `/${locale}/datenschutz`,
      languages: {
        en: '/en/datenschutz',
        de: '/de/datenschutz',
      },
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function DatenschutzPage({ params }: DatenschutzPageProps) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as 'en' | 'de')) {
    return null;
  }

  setRequestLocale(locale);

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <LocaleContent
          locale={locale as 'de' | 'en'}
          de={<h1 className="mb-8 text-4xl font-bold">Datenschutzerklärung</h1>}
          en={<h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>}
        />

        <LocaleContent
          locale={locale as 'de' | 'en'}
          de={
            <div className="space-y-6 text-base leading-7">
              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
                1. Datenschutz auf einen Blick
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Allgemeine Hinweise</h3>
              <p className="mb-4">
                Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren
                personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene
                Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem
                Text aufgeführten Datenschutzerklärung.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Datenerfassung auf dieser Website
              </h3>

              <h4 className="mt-6 mb-3 text-xl font-semibold">
                Wer ist verantwortlich für die Datenerfassung auf dieser Website?
              </h4>
              <p className="mb-4">
                Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen
                Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle" in
                dieser Datenschutzerklärung entnehmen.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">Wie erfassen wir Ihre Daten?</h4>
              <p className="mb-4">
                Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei
                kann es sich z. B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
              </p>
              <p className="mb-4">
                Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website
                durch unsere IT- Systeme erfasst. Das sind vor allem technische Daten (z. B.
                Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs). Die Erfassung
                dieser Daten erfolgt automatisch, sobald Sie diese Website betreten.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">Wofür nutzen wir Ihre Daten?</h4>
              <p className="mb-4">
                Ein Teil der Daten wird erhoben, um eine fehlerfreie Bereitstellung der Website zu
                gewährleisten. Andere Daten können zur Analyse Ihres Nutzerverhaltens verwendet
                werden. Sofern über die Website Verträge geschlossen oder angebahnt werden können,
                werden die übermittelten Daten auch für Vertragsangebote, Bestellungen oder sonstige
                Auftragsanfragen verarbeitet.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">
                Welche Rechte haben Sie bezüglich Ihrer Daten?
              </h4>
              <p className="mb-4">
                Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und
                Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem
                ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen. Wenn Sie eine
                Einwilligung zur Datenverarbeitung erteilt haben, können Sie diese Einwilligung
                jederzeit für die Zukunft widerrufen. Außerdem haben Sie das Recht, unter bestimmten
                Umständen die Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu
                verlangen. Des Weiteren steht Ihnen ein Beschwerderecht bei der zuständigen
                Aufsichtsbehörde zu.
              </p>
              <p className="mb-4">
                Hierzu sowie zu weiteren Fragen zum Thema Datenschutz können Sie sich jederzeit an
                uns wenden.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">
                Analyse-Tools und Tools von Drittanbietern
              </h4>
              <p className="mb-4">
                Beim Besuch dieser Website kann Ihr Surf-Verhalten statistisch ausgewertet werden.
                Das geschieht vor allem mit sogenannten Analyseprogrammen.
              </p>
              <p className="mb-4">
                Detaillierte Informationen zu diesen Analyseprogrammen finden Sie in der folgenden
                Datenschutzerklärung.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                2. Hosting und Content Delivery Networks (CDN)
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Hosting</h3>
              <p className="mb-4">
                Diese Website wird extern gehostet. Die personenbezogenen Daten, die auf dieser
                Website erfasst werden, werden auf den Servern des Hosters / der Hoster gespeichert.
                Hierbei kann es sich v. a. um IP-Adressen, Kontaktanfragen, Meta- und
                Kommunikationsdaten, Vertragsdaten, Kontaktdaten, Namen, Websitezugriffe und
                sonstige Daten, die über eine Website generiert werden, handeln.
              </p>
              <p className="mb-4">
                Das externe Hosting erfolgt zum Zwecke der Vertragserfüllung gegenüber unseren
                potenziellen und bestehenden Kunden (Art. 6 Abs. 1 lit. b DSGVO) und im Interesse
                einer sicheren, schnellen und effizienten Bereitstellung unseres Online-Angebots
                durch einen professionellen Anbieter (Art. 6 Abs. 1 lit. f DSGVO). Sofern eine
                entsprechende Einwilligung abgefragt wurde, erfolgt die Verarbeitung ausschließlich
                auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO und § 25 Abs. 1 TDDDG, soweit die
                Einwilligung die Speicherung von Cookies oder den Zugriff auf Informationen im
                Endgerät des Nutzers (z. B. Device-Fingerprinting) im Sinne des TDDDG umfasst. Die
                Einwilligung ist jederzeit widerrufbar.
              </p>
              <p className="mb-4">
                Unser(e) Hoster wird bzw. werden Ihre Daten nur insoweit verarbeiten, wie dies zur
                Erfüllung seiner Leistungspflichten erforderlich ist und unsere Weisungen in Bezug
                auf diese Daten befolgen.
              </p>
              <p className="mb-4">Wir setzen folgende(n) Hoster ein:</p>
              <address className="my-4 not-italic">
                <strong>Vercel Inc.</strong>
                <br />
                Betrifft: Datenschutz
                <br />
                c/o EDPO
                <br />
                Avenue Huart Hamoir 71
                <br />
                1030 Brussels
                <br />
                Belgium
              </address>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Cloudflare</h3>
              <p className="mb-4">
                Wir nutzen den Service „Cloudflare". Anbieter ist die Cloudflare Inc., 101 Townsend
                St., San Francisco, CA 94107, USA (im Folgenden „Cloudflare").
              </p>

              <p className="mb-4">
                Cloudflare bietet ein weltweit verteiltes Content Delivery Network mit DNS an. Dabei
                wird technisch der Informationstransfer zwischen Ihrem Browser und unserer Website
                über das Netzwerk von Cloudflare geleitet. Das versetzt Cloudflare in die Lage, den
                Datenverkehr zwischen Ihrem Browser und unserer Website zu analysieren und als
                Filter zwischen unseren Servern und potenziell bösartigem Datenverkehr aus dem
                Internet zu dienen. Hierbei kann Cloudflare auch Cookies oder sonstige Technologien
                zur Wiedererkennung von Internetnutzern einsetzen, die jedoch allein zum hier
                beschriebenen Zweck verwendet werden.
              </p>
              <p className="mb-4">
                Der Einsatz von Cloudflare beruht auf unserem berechtigten Interesse an einer
                möglichst fehlerfreien und sicheren Bereitstellung unseres Webangebotes (Art. 6 Abs.
                1 lit. f DSGVO).
              </p>
              <p className="mb-4">
                Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der
                EU-Kommission gestützt. Details und weitere Informationen zum Thema Sicherheit und
                Datenschutz bei Cloudflare finden Sie{' '}
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                >
                  hier
                </a>
                .
              </p>
              <p className="mb-4">
                Das Unternehmen verfügt über eine Zertifizierung nach dem „EU-US Data Privacy
                Framework“ (DPF). Der DPF ist ein Übereinkommen zwischen der Europäischen Union und
                den USA, der die Einhaltung europäischer Datenschutzstandards bei
                Datenverarbeitungen in den USA gewährleisten soll. Jedes nach dem DPF zertifizierte
                Unternehmen verpflichtet sich, diese Datenschutzstandards einzuhalten. Weitere
                Informationen hierzu erhalten Sie vom Anbieter{' '}
                <a
                  href="https://www.dataprivacyframework.gov/participant/5666"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                >
                  hier
                </a>
                .
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Auftragsverarbeitung</h3>
              <p className="mb-4">
                Wir haben einen Vertrag über Auftragsverarbeitung (AVV) zur Nutzung des oben
                genannten Dienstes geschlossen. Hierbei handelt es sich um einen
                datenschutzrechtlich vorgeschriebenen Vertrag, der gewährleistet, dass dieser die
                personenbezogenen Daten unserer Websitebesucher nur nach unseren Weisungen und unter
                Einhaltung der DSGVO verarbeitet.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                3. Allgemeine Hinweise und Pflichtinformationen
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Datenschutz</h3>
              <p className="mb-4">
                Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst.
                Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den
                gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
              </p>
              <p className="mb-4">
                Wenn Sie diese Website benutzen, werden verschiedene personenbezogene Daten erhoben.
                Personenbezogene Daten sind Daten, mit denen Sie persönlich identifiziert werden
                können. Die vorliegende Datenschutzerklärung erläutert, welche Daten wir erheben und
                wofür wir sie nutzen. Sie erläutert auch, wie und zu welchem Zweck das geschieht.
              </p>
              <p className="mb-4">
                Wir weisen darauf hin, dass die Datenübertragung im Internet (z. B. bei der
                Kommunikation per E-Mail) Sicherheitslücken aufweisen kann. Ein lückenloser Schutz
                der Daten vor dem Zugriff durch Dritte ist nicht möglich.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Hinweis zur verantwortlichen Stelle
              </h3>
              <p className="mb-4">
                Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:
              </p>
              <address className="my-4 not-italic">
                <strong>Patrick Arns</strong>
                <br />
                Ahrstr. 7
                <br />
                52511 Geilenkirchen
                <br />
                E-Mail:{' '}
                <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[ät]park.fan" />
              </address>
              <p className="mb-4">
                Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder
                gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von
                personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Speicherdauer</h3>
              <p className="mb-4">
                Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt
                wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die
                Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen
                oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht,
                sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer
                personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche
                Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall
                dieser Gründe.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Allgemeine Hinweise zu den Rechtsgrundlagen der Datenverarbeitung auf dieser Website
              </h3>
              <p className="mb-4">
                Sofern Sie in die Datenverarbeitung eingewilligt haben, verarbeiten wir Ihre
                personenbezogenen Daten auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO bzw. Art. 9
                Abs. 2 lit. a DSGVO, sofern besondere Datenkategorien nach Art. 9 Abs. 1 DSGVO
                verarbeitet werden. Im Falle einer ausdrücklichen Einwilligung in die Übertragung
                personenbezogener Daten in Drittstaaten erfolgt die Datenverarbeitung außerdem auf
                Grundlage von Art. 49 Abs. 1 lit. a DSGVO. Sofern Sie in die Speicherung von Cookies
                oder in den Zugriff auf Informationen in Ihr Endgerät (z. B. via
                Device-Fingerprinting) eingewilligt haben, erfolgt die Datenverarbeitung zusätzlich
                auf Grundlage von § 25 Abs. 1 TDDDG. Die Einwilligung ist jederzeit widerrufbar.
                Sind Ihre Daten zur Vertragserfüllung oder zur Durchführung vorvertraglicher
                Maßnahmen erforderlich, verarbeiten wir Ihre Daten auf Grundlage des Art. 6 Abs. 1
                lit. b DSGVO. Des Weiteren verarbeiten wir Ihre Daten, sofern diese zur Erfüllung
                einer rechtlichen Verpflichtung erforderlich sind auf Grundlage von Art. 6 Abs. 1
                lit. c DSGVO. Die Datenverarbeitung kann ferner auf Grundlage unseres berechtigten
                Interesses nach Art. 6 Abs. 1 lit. f DSGVO erfolgen. Über die jeweils im Einzelfall
                einschlägigen Rechtsgrundlagen wird in den folgenden Absätzen dieser
                Datenschutzerklärung informiert.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Empfänger von personenbezogenen Daten
              </h3>
              <p className="mb-4">
                Im Rahmen unserer Geschäftstätigkeit arbeiten wir mit verschiedenen externen Stellen
                zusammen. Dabei ist teilweise auch eine Übermittlung von personenbezogenen Daten an
                diese externen Stellen erforderlich. Wir geben personenbezogene Daten nur dann an
                externe Stellen weiter, wenn dies im Rahmen einer Vertragserfüllung erforderlich
                ist, wenn wir gesetzlich hierzu verpflichtet sind (z. B. Weitergabe von Daten an
                Steuerbehörden), wenn wir ein berechtigtes Interesse nach Art. 6 Abs. 1 lit. f DSGVO
                an der Weitergabe haben oder wenn eine sonstige Rechtsgrundlage die Datenweitergabe
                erlaubt. Beim Einsatz von Auftragsverarbeitern geben wir personenbezogene Daten
                unserer Kunden nur auf Grundlage eines gültigen Vertrags über Auftragsverarbeitung
                weiter. Im Falle einer gemeinsamen Verarbeitung wird ein Vertrag über gemeinsame
                Verarbeitung geschlossen.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Widerruf Ihrer Einwilligung zur Datenverarbeitung
              </h3>
              <p className="mb-4">
                Viele Datenverarbeitungsvorgänge sind nur mit Ihrer ausdrücklichen Einwilligung
                möglich. Sie können eine bereits erteilte Einwilligung jederzeit widerrufen. Die
                Rechtmäßigkeit der bis zum Widerruf erfolgten Datenverarbeitung bleibt vom Widerruf
                unberührt.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Widerspruchsrecht gegen die Datenerhebung in besonderen Fällen sowie gegen
                Direktwerbung (Art. 21 DSGVO)
              </h3>
              <p className="mb-4">
                <strong>
                  WENN DIE DATENVERARBEITUNG AUF GRUNDLAGE VON ART. 6 ABS. 1 LIT. E ODER F DSGVO
                  ERFOLGT, HABEN SIE JEDERZEIT DAS RECHT, AUS GRÜNDEN, DIE SICH AUS IHRER BESONDEREN
                  SITUATION ERGEBEN, GEGEN DIE VERARBEITUNG IHRER PERSONENBEZOGENEN DATEN
                  WIDERSPRUCH EINZULEGEN; DIES GILT AUCH FÜR EIN AUF DIESE BESTIMMUNGEN GESTÜTZTES
                  PROFILING. DIE JEWEILIGE RECHTSGRUNDLAGE, AUF DENEN EINE VERARBEITUNG BERUHT,
                  ENTNEHMEN SIE DIESER DATENSCHUTZERKLÄRUNG. WENN SIE WIDERSPRUCH EINLEGEN, WERDEN
                  WIR IHRE BETROFFENEN PERSONENBEZOGENEN DATEN NICHT MEHR VERARBEITEN, ES SEI DENN,
                  WIR KÖNNEN ZWINGENDE SCHUTZWÜRDIGE GRÜNDE FÜR DIE VERARBEITUNG NACHWEISEN, DIE
                  IHRE INTERESSEN, RECHTE UND FREIHEITEN ÜBERWIEGEN ODER DIE VERARBEITUNG DIENT DER
                  GELTENDMACHUNG, AUSÜBUNG ODER VERTEIDIGUNG VON RECHTSANSPRÜCHEN (WIDERSPRUCH NACH
                  ART. 21 ABS. 1 DSGVO).
                </strong>
              </p>
              <p className="mb-4">
                <strong>
                  WERDEN IHRE PERSONENBEZOGENEN DATEN VERARBEITET, UM DIREKTWERBUNG ZU BETREIBEN, SO
                  HABEN SIE DAS RECHT, JEDERZEIT WIDERSPRUCH GEGEN DIE VERARBEITUNG SIE BETREFFENDER
                  PERSONENBEZOGENER DATEN ZUM ZWECKE DERARTIGER WERBUNG EINZULEGEN; DIES GILT AUCH
                  FÜR DAS PROFILING, SOWEIT ES MIT SOLCHER DIREKTWERBUNG IN VERBINDUNG STEHT. WENN
                  SIE WIDERSPRECHEN, WERDEN WIR IHRE PERSONENBEZOGENEN DATEN ANSCHLIESSEND NICHT
                  MEHR ZUM ZWECKE DER DIREKTWERBUNG VERWENDET (WIDERSPRUCH NACH ART. 21 ABS. 2
                  DSGVO).
                </strong>
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Beschwerderecht bei der zuständigen Aufsichtsbehörde
              </h3>
              <p className="mb-4">
                Im Falle von Verstößen gegen die DSGVO steht den Betroffenen ein Beschwerderecht bei
                einer Aufsichtsbehörde, insbesondere in dem Mitgliedstaat ihres gewöhnlichen
                Aufenthalts, ihres Arbeitsplatzes oder des Orts des mutmaßlichen Verstoßes zu. Das
                Beschwerderecht besteht unbeschadet anderweitiger verwaltungsrechtlicher oder
                gerichtlicher Rechtsbehelfe.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Recht auf Datenübertragbarkeit</h3>
              <p className="mb-4">
                Sie haben das Recht, Daten, die wir auf Grundlage Ihrer Einwilligung oder in
                Erfüllung eines Vertrags automatisiert verarbeiten, an sich oder an einen Dritten in
                einem gängigen, maschinenlesbaren Format aushändigen zu lassen. Sofern Sie die
                direkte Übertragung der Daten an einen anderen Verantwortlichen verlangen, erfolgt
                dies nur, soweit es technisch machbar ist.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Auskunft, Berichtigung und Löschung
              </h3>
              <p className="mb-4">
                Sie haben im Rahmen der geltenden gesetzlichen Bestimmungen jederzeit das Recht auf
                unentgeltliche Auskunft über Ihre gespeicherten personenbezogenen Daten, deren
                Herkunft und Empfänger und den Zweck der Datenverarbeitung und ggf. ein Recht auf
                Berichtigung oder Löschung dieser Daten. Hierzu sowie zu weiteren Fragen zum Thema
                personenbezogene Daten können Sie sich jederzeit an uns wenden.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Recht auf Einschränkung der Verarbeitung
              </h3>
              <p className="mb-4">
                Sie haben das Recht, die Einschränkung der Verarbeitung Ihrer personenbezogenen
                Daten zu verlangen. Hierzu können Sie sich jederzeit an uns wenden. Das Recht auf
                Einschränkung der Verarbeitung besteht in folgenden Fällen:
              </p>
              <ul>
                <li>
                  Wenn Sie die Richtigkeit Ihrer bei uns gespeicherten personenbezogenen Daten
                  bestreiten, benötigen wir in der Regel Zeit, um dies zu überprüfen. Für die Dauer
                  der Prüfung haben Sie das Recht, die Einschränkung der Verarbeitung Ihrer
                  personenbezogenen Daten zu verlangen.
                </li>
                <li>
                  Wenn die Verarbeitung Ihrer personenbezogenen Daten unrechtmäßig
                  geschah/geschieht, können Sie statt der Löschung die Einschränkung der
                  Datenverarbeitung verlangen.
                </li>
                <li>
                  Wenn wir Ihre personenbezogenen Daten nicht mehr benötigen, Sie sie jedoch zur
                  Ausübung, Verteidigung oder Geltendmachung von Rechtsansprüchen benötigen, haben
                  Sie das Recht, statt der Löschung die Einschränkung der Verarbeitung Ihrer
                  personenbezogenen Daten zu verlangen.
                </li>
                <li>
                  Wenn Sie einen Widerspruch nach Art. 21 Abs. 1 DSGVO eingelegt haben, muss eine
                  Abwägung zwischen Ihren und unseren Interessen vorgenommen werden. Solange noch
                  nicht feststeht, wessen Interessen überwiegen, haben Sie das Recht, die
                  Einschränkung der Verarbeitung Ihrer personenbezogenen Daten zu verlangen.
                </li>
              </ul>
              <p className="mb-4">
                Wenn Sie die Verarbeitung Ihrer personenbezogenen Daten eingeschränkt haben, dürfen
                diese Daten – von ihrer Speicherung abgesehen – nur mit Ihrer Einwilligung oder zur
                Geltendmachung, Ausübung oder Verteidigung von Rechtsansprüchen oder zum Schutz der
                Rechte einer anderen natürlichen oder juristischen Person oder aus Gründen eines
                wichtigen öffentlichen Interesses der Europäischen Union oder eines Mitgliedstaats
                verarbeitet werden.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">SSL- bzw. TLS-Verschlüsselung</h3>
              <p className="mb-4">
                Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung
                vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns
                als Seitenbetreiber senden, eine SSL- bzw. TLS- Verschlüsselung. Eine verschlüsselte
                Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von „http://" auf
                „https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
              </p>
              <p className="mb-4">
                Wenn die SSL- bzw. TLS-Verschlüsselung aktiviert ist, können die Daten, die Sie an
                uns übermitteln, nicht von Dritten mitgelesen werden.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                4. Datenerfassung auf dieser Website
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Cookies</h3>
              <p className="mb-4">
                Unsere Internetseiten verwenden so genannte „Cookies". Cookies sind kleine
                Datenpakete und richten auf Ihrem Endgerät keinen Schaden an. Sie werden entweder
                vorübergehend für die Dauer einer Sitzung (Session-Cookies) oder dauerhaft
                (permanente Cookies) auf Ihrem Endgerät gespeichert. Session-Cookies werden nach
                Ende Ihres Besuchs automatisch gelöscht. Permanente Cookies bleiben auf Ihrem
                Endgerät gespeichert, bis Sie diese selbst löschen oder eine automatische Löschung
                durch Ihren Webbrowser erfolgt.
              </p>
              <p className="mb-4">
                Cookies können von uns (First-Party-Cookies) oder von Drittunternehmen stammen (sog.
                Third-Party- Cookies). Third-Party-Cookies ermöglichen die Einbindung bestimmter
                Dienstleistungen von Drittunternehmen innerhalb von Webseiten (z. B. Cookies zur
                Abwicklung von Zahlungsdienstleistungen).
              </p>
              <p className="mb-4">
                Cookies haben verschiedene Funktionen. Zahlreiche Cookies sind technisch notwendig,
                da bestimmte Webseitenfunktionen ohne diese nicht funktionieren würden (z. B. die
                Warenkorbfunktion oder die Anzeige von Videos). Andere Cookies können zur Auswertung
                des Nutzerverhaltens oder zu Werbezwecken verwendet werden.
              </p>
              <p className="mb-4">
                Cookies, die zur Durchführung des elektronischen Kommunikationsvorgangs, zur
                Bereitstellung bestimmter, von Ihnen erwünschter Funktionen (z. B. für die
                Warenkorbfunktion) oder zur Optimierung der Website (z. B. Cookies zur Messung des
                Webpublikums) erforderlich sind (notwendige Cookies), werden auf Grundlage von Art.
                6 Abs. 1 lit. f DSGVO gespeichert, sofern keine andere Rechtsgrundlage angegeben
                wird. Der Websitebetreiber hat ein berechtigtes Interesse an der Speicherung von
                notwendigen Cookies zur technisch fehlerfreien und optimierten Bereitstellung seiner
                Dienste. Sofern eine Einwilligung zur Speicherung von Cookies und vergleichbaren
                Wiedererkennungstechnologien abgefragt wurde, erfolgt die Verarbeitung
                ausschließlich auf Grundlage dieser Einwilligung (Art. 6 Abs. 1 lit. a DSGVO und §
                25 Abs. 1 TDDDG); die Einwilligung ist jederzeit widerrufbar.
              </p>
              <p className="mb-4">
                Sie können Ihren Browser so einstellen, dass Sie über das Setzen von Cookies
                informiert werden und Cookies nur im Einzelfall erlauben, die Annahme von Cookies
                für bestimmte Fälle oder generell ausschließen sowie das automatische Löschen der
                Cookies beim Schließen des Browsers aktivieren. Bei der Deaktivierung von Cookies
                kann die Funktionalität dieser Website eingeschränkt sein.
              </p>
              <p className="mb-4">
                Welche Cookies und Dienste auf dieser Website eingesetzt werden, können Sie dieser
                Datenschutzerklärung entnehmen.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Server-Log-Dateien</h3>
              <p className="mb-4">
                Der Provider der Seiten erhebt und speichert automatisch Informationen in so
                genannten Server-Log- Dateien, die Ihr Browser automatisch an uns übermittelt. Dies
                sind:
              </p>
              <ul>
                <li>Browsertyp und Browserversion</li>
                <li>verwendetes Betriebssystem</li>
                <li>Referrer URL</li>
                <li>Hostname des zugreifenden Rechners</li>
                <li>Uhrzeit der Serveranfrage</li>
                <li>IP-Adresse</li>
              </ul>
              <p className="mb-4">
                Eine Zusammenführung dieser Daten mit anderen Datenquellen wird nicht vorgenommen.
              </p>
              <p className="mb-4">
                Die Erfassung dieser Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO. Der
                Websitebetreiber hat ein berechtigtes Interesse an der technisch fehlerfreien
                Darstellung und der Optimierung seiner Website – hierzu müssen die Server-Log-Files
                erfasst werden.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                5. Plugins und Tools
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">OpenStreetMap</h3>
              <p className="mb-4">Wir nutzen den Kartendienst von OpenStreetMap (OSM).</p>
              <p className="mb-4">
                Wir binden das Kartenmaterial von OpenStreetMap auf dem Server der OpenStreetMap
                Foundation, St John's Innovation Centre, Cowley Road, Cambridge, CB4 0WS,
                Großbritannien, ein. Großbritannien gilt als datenschutzrechtlich sicherer
                Drittstaat. Das bedeutet, dass Großbritannien ein Datenschutzniveau aufweist, das
                dem Datenschutzniveau in der Europäischen Union entspricht. Bei der Nutzung der
                OpenStreetMap-Karten wird eine Verbindung zu den Servern der
                OpenStreetMap-Foundation hergestellt. Dabei können u. a. Ihre IP-Adresse und weitere
                Informationen über Ihr Verhalten auf dieser Website an die OSMF weitergeleitet
                werden. OpenStreetMap speichert hierzu unter Umständen Cookies in Ihrem Browser oder
                setzt vergleichbare Wiedererkennungstechnologien ein.
              </p>
              <p className="mb-4">
                Die Nutzung von OpenStreetMap erfolgt im Interesse einer ansprechenden Darstellung
                unserer Online- Angebote und einer leichten Auffindbarkeit der von uns auf der
                Website angegebenen Orte. Dies stellt ein berechtigtes Interesse im Sinne von Art. 6
                Abs. 1 lit. f DSGVO dar. Sofern eine entsprechende Einwilligung abgefragt wurde,
                erfolgt die Verarbeitung ausschließlich auf Grundlage von Art. 6 Abs. 1 lit. a DSGVO
                und § 25 Abs. 1 TDDDG, soweit die Einwilligung die Speicherung von Cookies oder den
                Zugriff auf Informationen im Endgerät des Nutzers (z. B. Device-Fingerprinting) im
                Sinne des TDDDG umfasst. Die Einwilligung ist jederzeit widerrufbar.
              </p>

              <p className="text-muted-foreground mt-8 text-sm">
                Quelle:{' '}
                <a
                  href="https://www.e-recht24.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline"
                >
                  https://www.e-recht24.de
                </a>
              </p>
            </div>
          }
          en={
            <div className="space-y-6 text-base leading-7">
              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
                1. Data Protection at a Glance
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">General Information</h3>
              <p className="mb-4">
                The following information provides a simple overview of what happens to your
                personal data when you visit this website. Personal data is any data with which you
                can be personally identified. Detailed information on the subject of data protection
                can be found in our privacy policy listed below this text.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Data Collection on This Website</h3>

              <h4 className="mt-6 mb-3 text-xl font-semibold">
                Who is responsible for data collection on this website?
              </h4>
              <p className="mb-4">
                Data processing on this website is carried out by the website operator. You can find
                their contact details in the section "Information on the Responsible Party" in this
                privacy policy.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">How do we collect your data?</h4>
              <p className="mb-4">
                On the one hand, your data is collected when you provide it to us. This can be, for
                example, data that you enter in a contact form.
              </p>
              <p className="mb-4">
                Other data is collected automatically or after your consent when you visit the
                website by our IT systems. This is mainly technical data (e.g., internet browser,
                operating system, or time of page access). This data is collected automatically as
                soon as you enter this website.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">What do we use your data for?</h4>
              <p className="mb-4">
                Some of the data is collected to ensure error-free provision of the website. Other
                data may be used to analyze your user behavior. If contracts can be concluded or
                initiated via the website, the transmitted data will also be processed for contract
                offers, orders, or other service requests.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">
                What rights do you have regarding your data?
              </h4>
              <p className="mb-4">
                You have the right at any time to receive information free of charge about the
                origin, recipient, and purpose of your stored personal data. You also have the right
                to request the correction or deletion of this data. If you have given consent to
                data processing, you can revoke this consent at any time for the future. You also
                have the right, under certain circumstances, to request the restriction of the
                processing of your personal data. Furthermore, you have the right to lodge a
                complaint with the competent supervisory authority.
              </p>
              <p className="mb-4">
                You can contact us at any time regarding this and other questions on the subject of
                data protection.
              </p>

              <h4 className="mt-6 mb-3 text-xl font-semibold">
                Analysis Tools and Third-Party Tools
              </h4>
              <p className="mb-4">
                When visiting this website, your surfing behavior may be statistically analyzed.
                This is done primarily with so-called analysis programs.
              </p>
              <p className="mb-4">
                Detailed information about these analysis programs can be found in the following
                privacy policy.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                2. Hosting and Content Delivery Networks (CDN)
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Hosting</h3>
              <p className="mb-4">
                This website is hosted externally. The personal data collected on this website is
                stored on the servers of the host(s). This may include IP addresses, contact
                requests, meta and communication data, contract data, contact details, names,
                website access and other data generated via a website.
              </p>
              <p className="mb-4">
                External hosting is carried out for the purpose of contract fulfillment with our
                potential and existing customers (Art. 6 para. 1 lit. b GDPR) and in the interest of
                a secure, fast, and efficient provision of our online offering by a professional
                provider (Art. 6 para. 1 lit. f GDPR). If a corresponding consent has been
                requested, processing is carried out exclusively on the basis of Art. 6 para. 1 lit.
                a GDPR and § 25 para. 1 TTDSG, insofar as the consent includes the storage of
                cookies or access to information on the user's device (e.g., device fingerprinting)
                within the meaning of the TTDSG. Consent can be revoked at any time.
              </p>
              <p className="mb-4">
                Our host(s) will only process your data to the extent necessary to fulfill their
                performance obligations and follow our instructions regarding this data.
              </p>
              <p className="mb-4">We use the following host(s):</p>
              <address className="my-4 not-italic">
                <strong>Vercel Inc.</strong>
                <br />
                Subject: Data Protection
                <br />
                c/o EDPO
                <br />
                Avenue Huart Hamoir 71
                <br />
                1030 Brussels
                <br />
                Belgium
              </address>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Cloudflare</h3>
              <p className="mb-4">
                We use the "Cloudflare" service. The provider is Cloudflare Inc., 101 Townsend St.,
                San Francisco, CA 94107, USA (hereinafter "Cloudflare").
              </p>

              <p className="mb-4">
                Cloudflare offers a globally distributed content delivery network with DNS.
                Technically, the information transfer between your browser and our website is routed
                through Cloudflare's network. This enables Cloudflare to analyze the data traffic
                between your browser and our website and to serve as a filter between our servers
                and potentially malicious data traffic from the internet. In doing so, Cloudflare
                may also use cookies or other technologies to recognize internet users, which are
                used solely for the purpose described here.
              </p>
              <p className="mb-4">
                The use of Cloudflare is based on our legitimate interest in the most error-free and
                secure provision of our web offering (Art. 6 para. 1 lit. f GDPR).
              </p>
              <p className="mb-4">
                Data transfer to the USA is based on the standard contractual clauses of the EU
                Commission. Details and further information on security and data protection at
                Cloudflare can be found{' '}
                <a
                  href="https://www.cloudflare.com/privacypolicy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                >
                  here
                </a>
                .
              </p>
              <p className="mb-4">
                The company is certified under the "EU-US Data Privacy Framework" (DPF). The DPF is
                an agreement between the European Union and the USA that is intended to ensure
                compliance with European data protection standards for data processing in the USA.
                Every company certified under the DPF undertakes to comply with these data
                protection standards. Further information on this can be obtained from the provider{' '}
                <a
                  href="https://www.dataprivacyframework.gov/participant/5666"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                >
                  here
                </a>
                .
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Data Processing Agreement</h3>
              <p className="mb-4">
                We have concluded a data processing agreement (DPA) for the use of the
                above-mentioned service. This is a contract required by data protection law that
                ensures that this party processes the personal data of our website visitors only in
                accordance with our instructions and in compliance with the GDPR.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                3. General Information and Mandatory Information
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Data Protection</h3>
              <p className="mb-4">
                The operators of these pages take the protection of your personal data very
                seriously. We treat your personal data confidentially and in accordance with the
                statutory data protection regulations and this privacy policy.
              </p>
              <p className="mb-4">
                When you use this website, various personal data is collected. Personal data is data
                with which you can be personally identified. This privacy policy explains what data
                we collect and what we use it for. It also explains how and for what purpose this
                happens.
              </p>
              <p className="mb-4">
                We point out that data transmission on the internet (e.g., when communicating by
                e-mail) may have security gaps. Complete protection of data against access by third
                parties is not possible.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Information on the Responsible Party
              </h3>
              <p className="mb-4">The responsible party for data processing on this website is:</p>
              <address className="my-4 not-italic">
                <strong>Patrick Arns</strong>
                <br />
                Ahrstr. 7
                <br />
                52511 Geilenkirchen
                <br />
                Email:{' '}
                <ObfuscatedEmail
                  local="hello"
                  domain="park.fan"
                  displayText="hello [at] park.fan"
                />
              </address>
              <p className="mb-4">
                The responsible party is the natural or legal person who alone or jointly with
                others decides on the purposes and means of processing personal data (e.g., names,
                e-mail addresses, etc.).
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Storage Period</h3>
              <p className="mb-4">
                Unless a more specific storage period has been specified in this privacy policy,
                your personal data will remain with us until the purpose for data processing no
                longer applies. If you assert a legitimate request for deletion or revoke consent to
                data processing, your data will be deleted, unless we have other legally permissible
                reasons for storing your personal data (e.g., tax or commercial law retention
                periods); in the latter case, deletion will take place after these reasons no longer
                apply.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                General Information on the Legal Basis for Data Processing on This Website
              </h3>
              <p className="mb-4">
                If you have consented to data processing, we process your personal data on the basis
                of Art. 6 para. 1 lit. a GDPR or Art. 9 para. 2 lit. a GDPR, if special data
                categories according to Art. 9 para. 1 GDPR are processed. In the case of explicit
                consent to the transfer of personal data to third countries, data processing is also
                carried out on the basis of Art. 49 para. 1 lit. a GDPR. If you have consented to
                the storage of cookies or access to information on your device (e.g., via device
                fingerprinting), data processing is additionally carried out on the basis of § 25
                para. 1 TTDSG. Consent can be revoked at any time. If your data is required for
                contract fulfillment or to carry out pre-contractual measures, we process your data
                on the basis of Art. 6 para. 1 lit. b GDPR. Furthermore, we process your data if
                this is necessary to fulfill a legal obligation on the basis of Art. 6 para. 1 lit.
                c GDPR. Data processing may also be carried out on the basis of our legitimate
                interest according to Art. 6 para. 1 lit. f GDPR. Information on the relevant legal
                basis in each individual case is provided in the following paragraphs of this
                privacy policy.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Recipients of Personal Data</h3>
              <p className="mb-4">
                In the course of our business activities, we work together with various external
                parties. In doing so, it is sometimes necessary to transmit personal data to these
                external parties. We only pass on personal data to external parties if this is
                necessary for the fulfillment of a contract, if we are legally obliged to do so
                (e.g., passing on data to tax authorities), if we have a legitimate interest
                according to Art. 6 para. 1 lit. f GDPR in passing it on or if another legal basis
                permits the data transfer. When using data processors, we only pass on personal data
                of our customers on the basis of a valid data processing agreement. In the case of
                joint processing, a joint processing agreement is concluded.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Revocation of Your Consent to Data Processing
              </h3>
              <p className="mb-4">
                Many data processing operations are only possible with your express consent. You can
                revoke consent you have already given at any time. The lawfulness of the data
                processing carried out until the revocation remains unaffected by the revocation.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Right to Object to Data Collection in Special Cases and to Direct Advertising (Art.
                21 GDPR)
              </h3>
              <p className="mb-4">
                <strong>
                  IF DATA PROCESSING IS CARRIED OUT ON THE BASIS OF ART. 6 PARA. 1 LIT. E OR F GDPR,
                  YOU HAVE THE RIGHT AT ANY TIME TO OBJECT TO THE PROCESSING OF YOUR PERSONAL DATA
                  FOR REASONS ARISING FROM YOUR PARTICULAR SITUATION; THIS ALSO APPLIES TO PROFILING
                  BASED ON THESE PROVISIONS. THE RESPECTIVE LEGAL BASIS ON WHICH PROCESSING IS BASED
                  CAN BE FOUND IN THIS PRIVACY POLICY. IF YOU OBJECT, WE WILL NO LONGER PROCESS YOUR
                  AFFECTED PERSONAL DATA UNLESS WE CAN DEMONSTRATE COMPELLING LEGITIMATE GROUNDS FOR
                  PROCESSING THAT OVERRIDE YOUR INTERESTS, RIGHTS, AND FREEDOMS OR THE PROCESSING
                  SERVES THE ASSERTION, EXERCISE, OR DEFENSE OF LEGAL CLAIMS (OBJECTION PURSUANT TO
                  ART. 21 PARA. 1 GDPR).
                </strong>
              </p>
              <p className="mb-4">
                <strong>
                  IF YOUR PERSONAL DATA IS PROCESSED FOR THE PURPOSE OF DIRECT ADVERTISING, YOU HAVE
                  THE RIGHT TO OBJECT AT ANY TIME TO THE PROCESSING OF PERSONAL DATA CONCERNING YOU
                  FOR THE PURPOSE OF SUCH ADVERTISING; THIS ALSO APPLIES TO PROFILING TO THE EXTENT
                  THAT IT IS CONNECTED WITH SUCH DIRECT ADVERTISING. IF YOU OBJECT, YOUR PERSONAL
                  DATA WILL SUBSEQUENTLY NO LONGER BE USED FOR THE PURPOSE OF DIRECT ADVERTISING
                  (OBJECTION PURSUANT TO ART. 21 PARA. 2 GDPR).
                </strong>
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Right to Lodge a Complaint with the Competent Supervisory Authority
              </h3>
              <p className="mb-4">
                In the event of violations of the GDPR, data subjects have the right to lodge a
                complaint with a supervisory authority, in particular in the member state of their
                habitual residence, their place of work or the place of the alleged violation. The
                right to lodge a complaint exists without prejudice to other administrative or
                judicial remedies.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Right to Data Portability</h3>
              <p className="mb-4">
                You have the right to have data that we process automatically on the basis of your
                consent or in fulfillment of a contract handed over to you or to a third party in a
                common, machine-readable format. If you request the direct transfer of the data to
                another responsible party, this will only be done to the extent technically
                feasible.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Information, Correction, and Deletion
              </h3>
              <p className="mb-4">
                Within the framework of the applicable legal provisions, you have the right at any
                time to free information about your stored personal data, its origin and recipient,
                and the purpose of data processing and, if applicable, a right to correction or
                deletion of this data. For this purpose and for further questions on the subject of
                personal data, you can contact us at any time.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">
                Right to Restriction of Processing
              </h3>
              <p className="mb-4">
                You have the right to request the restriction of the processing of your personal
                data. You can contact us at any time for this purpose. The right to restriction of
                processing exists in the following cases:
              </p>
              <ul>
                <li>
                  If you dispute the accuracy of your personal data stored by us, we usually need
                  time to verify this. For the duration of the review, you have the right to request
                  the restriction of the processing of your personal data.
                </li>
                <li>
                  If the processing of your personal data was/is unlawful, you can request the
                  restriction of data processing instead of deletion.
                </li>
                <li>
                  If we no longer need your personal data, but you need it to exercise, defend, or
                  assert legal claims, you have the right to request the restriction of the
                  processing of your personal data instead of deletion.
                </li>
                <li>
                  If you have lodged an objection pursuant to Art. 21 para. 1 GDPR, a balancing of
                  your and our interests must be carried out. As long as it has not been determined
                  whose interests prevail, you have the right to request the restriction of the
                  processing of your personal data.
                </li>
              </ul>
              <p className="mb-4">
                If you have restricted the processing of your personal data, this data may – apart
                from its storage – only be processed with your consent or for the assertion,
                exercise, or defense of legal claims or for the protection of the rights of another
                natural or legal person or for reasons of an important public interest of the
                European Union or a member state.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">SSL or TLS Encryption</h3>
              <p className="mb-4">
                This site uses SSL or TLS encryption for security reasons and to protect the
                transmission of confidential content, such as orders or inquiries that you send to
                us as the site operator. You can recognize an encrypted connection by the fact that
                the address line of the browser changes from "http://" to "https://" and by the lock
                symbol in your browser line.
              </p>
              <p className="mb-4">
                If SSL or TLS encryption is activated, the data you transmit to us cannot be read by
                third parties.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                4. Data Collection on This Website
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Cookies</h3>
              <p className="mb-4">
                Our internet pages use so-called "cookies". Cookies are small data packages and do
                not cause any damage to your device. They are stored either temporarily for the
                duration of a session (session cookies) or permanently (permanent cookies) on your
                device. Session cookies are automatically deleted after your visit ends. Permanent
                cookies remain stored on your device until you delete them yourself or an automatic
                deletion is carried out by your web browser.
              </p>
              <p className="mb-4">
                Cookies can originate from us (first-party cookies) or from third-party companies
                (so-called third-party cookies). Third-party cookies enable the integration of
                certain services from third-party companies within websites (e.g., cookies for
                processing payment services).
              </p>
              <p className="mb-4">
                Cookies have various functions. Numerous cookies are technically necessary, as
                certain website functions would not work without them (e.g., the shopping cart
                function or the display of videos). Other cookies can be used to evaluate user
                behavior or for advertising purposes.
              </p>
              <p className="mb-4">
                Cookies that are required to carry out the electronic communication process, to
                provide certain functions you have requested (e.g., for the shopping cart function)
                or to optimize the website (e.g., cookies for measuring web audiences) are stored on
                the basis of Art. 6 para. 1 lit. f GDPR, unless another legal basis is specified.
                The website operator has a legitimate interest in storing necessary cookies for the
                technically error-free and optimized provision of its services. If consent to the
                storage of cookies and comparable recognition technologies has been requested,
                processing is carried out exclusively on the basis of this consent (Art. 6 para. 1
                lit. a GDPR and § 25 para. 1 TTDSG); consent can be revoked at any time.
              </p>
              <p className="mb-4">
                You can set your browser so that you are informed about the setting of cookies and
                only allow cookies in individual cases, exclude the acceptance of cookies for
                certain cases or in general, and activate the automatic deletion of cookies when
                closing the browser. When cookies are deactivated, the functionality of this website
                may be limited.
              </p>
              <p className="mb-4">
                Which cookies and services are used on this website can be found in this privacy
                policy.
              </p>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">Server Log Files</h3>
              <p className="mb-4">
                The provider of the pages automatically collects and stores information in so-called
                server log files, which your browser automatically transmits to us. These are:
              </p>
              <ul>
                <li>Browser type and browser version</li>
                <li>Operating system used</li>
                <li>Referrer URL</li>
                <li>Hostname of the accessing computer</li>
                <li>Time of server request</li>
                <li>IP address</li>
              </ul>
              <p className="mb-4">This data is not merged with other data sources.</p>
              <p className="mb-4">
                This data is collected on the basis of Art. 6 para. 1 lit. f GDPR. The website
                operator has a legitimate interest in the technically error-free presentation and
                optimization of its website – for this purpose, the server log files must be
                collected.
              </p>

              <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
                5. Plugins and Tools
              </h2>

              <h3 className="mt-8 mb-4 text-2xl font-semibold">OpenStreetMap</h3>
              <p className="mb-4">We use the map service of OpenStreetMap (OSM).</p>
              <p className="mb-4">
                We integrate the map material from OpenStreetMap on the server of the OpenStreetMap
                Foundation, St John's Innovation Centre, Cowley Road, Cambridge, CB4 0WS, United
                Kingdom. The United Kingdom is considered a data protection-safe third country. This
                means that the United Kingdom has a data protection level that corresponds to the
                data protection level in the European Union. When using OpenStreetMap maps, a
                connection is established to the servers of the OpenStreetMap Foundation. In doing
                so, your IP address and other information about your behavior on this website may be
                forwarded to the OSMF. OpenStreetMap may store cookies in your browser for this
                purpose or use comparable recognition technologies.
              </p>
              <p className="mb-4">
                The use of OpenStreetMap is in the interest of an appealing presentation of our
                online offerings and easy findability of the locations we have indicated on the
                website. This constitutes a legitimate interest within the meaning of Art. 6 para. 1
                lit. f GDPR. If a corresponding consent has been requested, processing is carried
                out exclusively on the basis of Art. 6 para. 1 lit. a GDPR and § 25 para. 1 TTDSG,
                insofar as the consent includes the storage of cookies or access to information on
                the user's device (e.g., device fingerprinting) within the meaning of the TTDSG.
                Consent can be revoked at any time.
              </p>

              <p className="text-muted-foreground mt-8 text-sm">
                Source:{' '}
                <a
                  href="https://www.e-recht24.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 underline"
                >
                  https://www.e-recht24.de
                </a>
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
