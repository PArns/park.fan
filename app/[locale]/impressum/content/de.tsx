import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { ObfuscatedPhone } from '@/components/common/obfuscated-phone';
import { ExternalLink } from 'lucide-react';
import { DATA_TERMS_ANCHOR, RSL_LICENSE_PATH } from '@/lib/agents/licensing';
import { ATTRIBUTION_ANCHOR, DEVELOPERS_PATH } from '@/lib/developers/paths';
import type { ImpressumStory } from './story';

/** The legal notice (Impressum) in German, shown on the `de` locale. */
export function ImpressumDE({ story }: { story: ImpressumStory | null }) {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">Impressum</h1>

      <div className="space-y-6 text-base leading-7">
        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
          Angaben gemäß § 5 DDG
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
          Tel: <ObfuscatedPhone number="+49 163 666 50 35" />
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h3>
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

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Über park.fan</h2>
        <p className="mb-4">
          park.fan ist ein privates Hobbyprojekt ohne Gewinnabsicht. Es gibt keine Werbung und keine
          Affiliate-Links. Ich entwickle die Seite in meiner Freizeit, weil mich Freizeitparks seit
          meiner Kindheit begeistern und mir ein Angebot wie dieses selbst immer gefehlt hat.
        </p>
        {story && (
          <p className="mb-4">
            Die Geschichte dahinter steht im Blog:{' '}
            <Link href={story.href as '/'} className="text-primary hover:text-primary/80 underline">
              {story.title}
            </Link>
            .
          </p>
        )}

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
          park.fan ist ein privates Hobbyprojekt und keine offizielle Webseite der hier aufgeführten
          Freizeit- und Themenparks. Die Wartezeiten stammen von den Parks selbst und erreichen uns
          über die unten genannten Plattformen. Prognosen, Durchschnittswerte und Statistiken
          berechnet park.fan daraus selbst. Eine Prognose ist eine Schätzung und kann deutlich von
          der tatsächlichen Wartezeit abweichen.
        </p>
        <p className="mb-4">
          Der Betreiber dieser Webseite übernimmt keine Haftung oder Verantwortung für den Inhalt,
          die Richtigkeit, Aktualität oder Vollständigkeit der angezeigten Wartezeiten, Statistiken
          oder sonstiger Informationen. Alle Angaben erfolgen ohne Gewähr. Alle verwendeten Marken,
          Warenzeichen und Firmenbezeichnungen sind Eigentum der jeweiligen Rechteinhaber.
        </p>
        <p className="mb-4">
          Eine Haftung für die Richtigkeit, Vollständigkeit und Aktualität der Veröffentlichungen
          kann trotz sorgfältiger Prüfung vom Herausgeber nicht übernommen werden.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Externe Links</h2>
        <p className="mb-4">
          Die Webseite enthält sogenannte „externe Links“ (Verlinkungen) zu anderen Webseiten, auf
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
        <p className="mb-4">
          <strong>Partnerlinks.</strong> Einzelne Links zu Ticketverkäufern im Reiseplaner können
          Partnerlinks sein; sie sind neben dem Link als „Partnerlink“ gekennzeichnet. Kaufen Sie
          über einen solchen Link ein Ticket, erhält park.fan vom Verkäufer eine Provision; der
          Preis ist für Sie derselbe. Folgen Sie einem Ticket-Link, erfährt der Verkäufer, dass Sie
          von park.fan kommen. Ab dem Klick gelten die Datenschutzbestimmungen des Verkäufers.
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
                <span className="group-hover:text-primary font-medium">
                  Powered by Queue-Times.com
                </span>
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
                <p className="text-muted-foreground text-sm">Wetterdaten und Vorhersagen</p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        </ul>
        <p className="mb-4">
          Die Wetterdaten von Open-Meteo stehen unter der Lizenz{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/deed.de"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            CC BY 4.0
          </a>
          .
        </p>

        <h2
          id={DATA_TERMS_ANCHOR}
          className="border-border mt-12 mb-6 scroll-mt-20 border-b pb-3 text-3xl font-bold"
        >
          Nutzung der Daten
        </h2>
        <p className="mb-4">
          Diese Bedingungen gelten für alle Daten, die park.fan auf den Seiten, über die API unter
          api.park.fan und über den MCP-Server veröffentlicht. Texte und Fotos gehören nicht dazu;
          an vielen Fotos halten die Fotografen die Rechte.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Ohne API-Key nur Wartezeiten</h3>
        <p className="mb-4">
          Ohne Key gibt die API die aktuellen Wartezeiten und den Status der Attraktionen eines
          Parks heraus, sonst nichts. Alles andere braucht einen API-Key mit der passenden
          Berechtigung: das Parkverzeichnis und die Parkdaten, Attraktionsdaten wie Mindestgröße,
          Fahrprofil und Links, Öffnungszeiten, Saisons, das Wetter, Statistiken, Prognosen, Tages-
          und Reiseplaner und die Reisedaten. Ein Key trägt nur die Berechtigungen, die für ihn
          freigegeben sind. Auch die Wartezeiten ohne Key darf nur nutzen, wer damit kein Geld
          verdient und park.fan verlinkt, wie unter „Quellenhinweis“ beschrieben.
        </p>
        <p className="mb-4">
          Einen Key beantragst du im{' '}
          <Link href={DEVELOPERS_PATH} className="text-primary hover:text-primary/80 underline">
            Entwicklerportal
          </Link>
          . Jeder Antrag wird von Hand geprüft; einen Anspruch auf einen Key gibt es nicht.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Kostenloser Key nur für Open Source ohne Einnahmen
        </h3>
        <p className="mb-4">
          Einen kostenlosen Key gibt es nur, wenn alle drei Bedingungen erfüllt sind:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>Der Quellcode des Projekts ist öffentlich, unter einer Open-Source-Lizenz.</li>
          <li>
            Das Projekt verdient kein Geld: keine Werbung, keine Affiliate- oder bezahlten Links,
            kein Kaufpreis, kein Abo, keine In-App-Käufe, keine Auftragsarbeit. Spenden und
            Sponsoring sind erlaubt.
          </li>
          <li>
            Jede Seite und jede Ansicht mit Daten von park.fan verlinkt park.fan sichtbar, wie unter
            „Quellenhinweis“ beschrieben.
          </li>
        </ul>
        <p className="mb-4">
          Fällt eine der Bedingungen weg, endet der kostenlose Key. park.fan kann ihn dann ohne
          Vorankündigung widerrufen.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Jede andere Nutzung ist kostenpflichtig
        </h3>
        <p className="mb-4">
          Für jede andere Nutzung gibt es den Key nur gegen Bezahlung und mit einer schriftlichen
          Vereinbarung mit Patrick Arns (park.fan): für alles mit Werbung, Affiliate-Links,
          Kaufpreis, Abo oder In-App-Käufen, für Auftragsarbeiten, für jedes Produkt eines
          Unternehmens und für jedes Projekt, dessen Quellcode nicht öffentlich ist. Ohne diese
          Vereinbarung dürfen die Daten von park.fan für solche Zwecke weder gezeigt noch
          gespeichert noch weitergegeben werden, gleich ob sie von den Seiten, aus der API oder vom
          MCP-Server stammen.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Quellenhinweis</h3>
        <p className="mb-4">
          Wer Daten von park.fan zeigt, verlinkt park.fan. Für einen kostenlosen Key und für die
          Wartezeiten ohne Key gilt:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            Ein Textlink mit dem Wort park.fan auf die Seite des Parks oder der Attraktion bei
            park.fan, deren Daten gezeigt werden; zeigt eine Ansicht viele Parks, auf die
            Startseite.
          </li>
          <li>
            Ein gewöhnlicher Link im HTML der Seite: ohne nofollow, sponsored oder ugc, ohne
            Weiterleitung und nicht erst per Skript eingefügt.
          </li>
          <li>
            Sichtbar und nah an den Daten, auf einer Seite, die Suchmaschinen indexieren dürfen.
          </li>
          <li>
            In einer App der sichtbare Hinweis „Daten: park.fan“ und ein solcher Link auf der
            Website des Projekts.
          </li>
        </ul>
        <p className="mb-4">
          Beispiele und alle Einzelheiten stehen im{' '}
          <Link
            href={`${DEVELOPERS_PATH}#${ATTRIBUTION_ANCHOR}`}
            className="text-primary hover:text-primary/80 underline"
          >
            Entwicklerportal
          </Link>
          . Bei einem kostenpflichtigen Key regelt die Vereinbarung den Quellenhinweis.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Wartezeiten, Öffnungszeiten und Wetter</h3>
        <p className="mb-4">
          Wartezeiten und Öffnungszeiten kommen von den Plattformen unter „Datenquellen“, das Wetter
          von Open-Meteo. park.fan gibt sie zu den Bedingungen oben weiter. Eigene Rechte an diesen
          Daten hat park.fan nicht und kann eine kommerzielle Nutzung deshalb auch nicht erlauben:
          Dafür braucht es eine Vereinbarung mit der jeweiligen Quelle.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Kein Training von KI-Modellen</h3>
        <p className="mb-4">
          Weder die Seiten noch die Prognosen aus der API dürfen zum Training oder Fine-Tuning von
          KI-Modellen oder anderen Prognosemodellen verwendet werden. Ein Assistent darf eine Seite
          lesen, um jemandem eine Frage zu beantworten. Für die Seiten stehen diese Regeln
          maschinenlesbar in{' '}
          <a href="/robots.txt" className="text-primary hover:text-primary/80 underline">
            robots.txt
          </a>{' '}
          und{' '}
          <a href={RSL_LICENSE_PATH} className="text-primary hover:text-primary/80 underline">
            license.xml
          </a>
          .
        </p>

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
