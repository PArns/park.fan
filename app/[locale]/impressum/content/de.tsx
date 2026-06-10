/* eslint-disable react/no-unescaped-entities */
import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { ObfuscatedPhone } from '@/components/common/obfuscated-phone';
import { ExternalLink } from 'lucide-react';

export function ImpressumDE() {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

      <div className="space-y-6 text-base leading-7">
        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
          Angaben gemäß § 5 TMG
        </h2>

        <address className="my-4 not-italic">
          <Link
            href={'/blog/authors/patrick' as '/'}
            className="hover:text-primary underline-offset-4 transition-colors hover:underline"
          >
            <strong>Patrick Arns</strong>
          </Link>
          <br />
          Ahrstr. 7
          <br />
          52511 Geilenkirchen
        </address>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Kontakt</h3>
        <p className="mb-2">
          E-Mail:{' '}
          <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[ät]park.fan" />
        </p>

        <p className="mb-4">
          Tel: <ObfuscatedPhone number="+49 2451 611 00 68" />
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Redaktionell verantwortlich</h3>
        <address className="my-4 not-italic">
          <Link
            href={'/blog/authors/patrick' as '/'}
            className="hover:text-primary underline-offset-4 transition-colors hover:underline"
          >
            <strong>Patrick Arns</strong>
          </Link>
          <br />
          Ahrstr. 7
          <br />
          52511 Geilenkirchen
        </address>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          Verbraucherstreitbeilegung / Universalschlichtungsstelle
        </h2>
        <p className="mb-4">
          Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer
          Verbraucherschlichtungsstelle teilzunehmen.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          Haftungsausschluss
        </h2>
        <p className="mb-4">
          Diese Webseite ist keine offizielle Webseite der hier aufgeführten Freizeit- und
          Themenparks. Die angezeigten Wartezeiten werden ausschließlich von den jeweiligen
          Freizeit- und Themenparks ermittelt und entweder über Infotafeln vor den Attraktionen oder
          über Infobildschirme im Park angezeigt.
        </p>
        <p className="mb-4">
          Der Betreiber dieser Webseite übernimmt keine Haftung oder Verantwortung für den Inhalt,
          die Richtigkeit, Aktualität oder Vollständigkeit der angezeigten Wartezeiten, Statistiken
          oder sonstiger Informationen. Alle Angaben erfolgen ohne Gewähr. Alle verwendeten Marken,
          Warenzeichen und Firmenbezeichnungen sind Eigentum der jeweiligen Rechteinhaber.
        </p>
        <p className="mb-4">
          Eine Haftung für die Richtigkeit, Vollständigkeit und Aktualität der Veröffentlichungen
          kann trotz sorgfältiger Prüfung durch die Redaktion vom Herausgeber nicht übernommen
          werden.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Externe Links</h2>
        <p className="mb-4">
          Die Webseite enthält sogenannte „externe Links" (Verlinkungen) zu anderen Webseiten, auf
          deren Inhalt der Anbieter dieser Webseite keinen Einfluss hat. Für diese fremden Inhalte
          übernimmt der Anbieter keine Haftung oder Gewähr.
        </p>
        <p className="mb-4">
          Für die Inhalte und Richtigkeit der bereitgestellten Informationen der verlinkten
          Webseiten ist ausschließlich der jeweilige Anbieter der verlinkten Webseite
          verantwortlich. Zum Zeitpunkt der Verlinkung waren keine rechtswidrigen Inhalte erkennbar.
          Sollte der Anbieter von rechtswidrigen Inhalten auf den verlinkten Webseiten Kenntnis
          erlangen, wird der entsprechende Link umgehend entfernt.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Datenquellen</h2>
        <p className="mb-4">
          Die angezeigten Wartezeiten werden von folgenden Plattformen bereitgestellt:
        </p>
        <ul className="divide-border mb-4 divide-y">
          <li>
            <a
              href="https://themeparks.wiki"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-3"
            >
              <div>
                <span className="group-hover:text-primary font-medium">ThemeParks.wiki</span>
                <p className="text-muted-foreground text-sm">Wartezeiten & Attraktionsdaten</p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
          <li>
            <a
              href="https://queue-times.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-3"
            >
              <div>
                <span className="group-hover:text-primary font-medium">Queue-Times.com</span>
                <p className="text-muted-foreground text-sm">
                  Live-Wartezeiten & historische Daten
                </p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
          <li>
            <a
              href="https://wartezeiten.app"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-3"
            >
              <div>
                <span className="group-hover:text-primary font-medium">Wartezeiten.app</span>
                <p className="text-muted-foreground text-sm">
                  Wartezeiten für deutschsprachige Parks
                </p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
          <li>
            <a
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-3"
            >
              <div>
                <span className="group-hover:text-primary font-medium">Open-Meteo.com</span>
                <p className="text-muted-foreground text-sm">
                  Wetterdaten und Vorhersagen (CC-BY 4.0)
                </p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        </ul>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Bildnachweise</h2>
        <p className="mb-4">
          Herzlichen Dank an alle, die zum Erscheinungsbild von park.fan beigetragen haben:
        </p>
        <ul className="divide-border mb-4 divide-y">
          <li>
            <a
              href="https://www.instagram.com/pupilbox/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-3"
            >
              <div>
                <span className="group-hover:text-primary font-medium">@pupilbox</span>
                <p className="text-muted-foreground text-sm">park.fan Logo · Instagram</p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
          <li>
            <a
              href="https://www.instagram.com/part_82/"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between py-3"
            >
              <div>
                <span className="group-hover:text-primary font-medium">@part_82</span>
                <p className="text-muted-foreground text-sm">Park-Fotos · Instagram</p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
