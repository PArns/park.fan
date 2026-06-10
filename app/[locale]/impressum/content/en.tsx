/* eslint-disable react/no-unescaped-entities */
import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { ObfuscatedPhone } from '@/components/common/obfuscated-phone';
import { ExternalLink } from 'lucide-react';

export function ImpressumEN() {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">Imprint</h1>

      <div className="space-y-6 text-base leading-7">
        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
          Information according to § 5 TMG
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

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Contact</h3>
        <p className="mb-2">
          Email:{' '}
          <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello [at] park.fan" />
        </p>

        <p className="mb-4">
          Tel: <ObfuscatedPhone number="+49 2451 611 00 68" />
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Editorially responsible</h3>
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
          Consumer Dispute Resolution / Universal Arbitration Board
        </h2>
        <p className="mb-4">
          We are neither willing nor obligated to participate in dispute resolution proceedings
          before a consumer arbitration board.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Disclaimer</h2>
        <p className="mb-4">
          This website is not an official website of any of the theme and amusement parks listed
          here. The displayed wait times are determined exclusively by the respective theme or
          amusement park and are shown either via information boards in front of the attractions or
          via information screens in the park.
        </p>
        <p className="mb-4">
          The operator of this website assumes no liability or responsibility for the content,
          accuracy, timeliness or completeness of the displayed wait times, statistics or other
          information. All information is provided without warranty. All trademarks, trade names and
          company names used are the property of their respective owners.
        </p>
        <p className="mb-4">
          Despite careful review by the editorial team, the publisher cannot assume liability for
          the accuracy, completeness and timeliness of publications.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          External Links
        </h2>
        <p className="mb-4">
          The website contains so-called "external links" (links) to other websites, over whose
          content the provider of this website has no influence. The provider assumes no liability
          or warranty for these external contents.
        </p>
        <p className="mb-4">
          The respective provider of the linked website is solely responsible for the content and
          accuracy of the information provided. At the time of linking, no illegal content was
          apparent. Should the provider become aware of illegal content on the linked websites, the
          corresponding link will be removed immediately.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Data Sources</h2>
        <p className="mb-4">Wait times are provided by the following platforms:</p>
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
                <p className="text-muted-foreground text-sm">Wait times & attraction data</p>
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
                <p className="text-muted-foreground text-sm">Live wait times & historical data</p>
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
                  Wait times for German-speaking parks
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
                  Weather data and forecasts (CC-BY 4.0)
                </p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        </ul>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Image Credits</h2>
        <p className="mb-4">Many thanks to everyone who contributed to the look of park.fan:</p>
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
                <p className="text-muted-foreground text-sm">park.fan logo · Instagram</p>
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
                <p className="text-muted-foreground text-sm">Park photos · Instagram</p>
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
