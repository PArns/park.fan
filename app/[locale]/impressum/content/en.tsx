/* eslint-disable react/no-unescaped-entities */
import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { ObfuscatedPhone } from '@/components/common/obfuscated-phone';
import { ExternalLink } from 'lucide-react';
import { LegalLink } from '@/components/legal/legal-blocks';
import { DATA_TERMS_ANCHOR, RSL_LICENSE_PATH } from '@/lib/agents/licensing';
import { ATTRIBUTION_ANCHOR, DEVELOPERS_PATH } from '@/lib/developers/paths';
import type { ImpressumStory } from './story';

/** The legal notice (Impressum) in English, shown on every locale but `de`. */
export function ImpressumEN({ story }: { story: ImpressumStory | null }) {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">Imprint</h1>

      <div className="space-y-6 text-base leading-7">
        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
          Information according to § 5 DDG
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
          Tel: <ObfuscatedPhone number="+49 163 666 50 35" />
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Responsible for content under § 18(2) MStV
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

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          About park.fan
        </h2>
        <p className="mb-4">
          park.fan is a private hobby project with no commercial intent. There are no ads and no
          affiliate links. I build the site in my spare time, because theme parks have fascinated me
          since childhood and I always missed a site like this one myself.
        </p>
        {story && (
          <p className="mb-4">
            The story behind it is on the blog:{' '}
            <Link href={story.href as '/'} className="text-primary hover:text-primary/80 underline">
              {story.title}
            </Link>
            .
          </p>
        )}

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          Consumer Dispute Resolution / Universal Arbitration Board
        </h2>
        <p className="mb-4">
          We are neither willing nor obligated to participate in dispute resolution proceedings
          before a consumer arbitration board.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">Disclaimer</h2>
        <p className="mb-4">
          park.fan is a private hobby project and not an official website of any of the theme and
          amusement parks listed here. Wait times come from the parks themselves and reach us
          through the platforms listed below. Forecasts, averages and statistics are calculated by
          park.fan. A forecast is an estimate and can differ considerably from the actual wait.
        </p>
        <p className="mb-4">
          The operator of this website assumes no liability or responsibility for the content,
          accuracy, timeliness or completeness of the displayed wait times, statistics or other
          information. All information is provided without warranty. All trademarks, trade names and
          company names used are the property of their respective owners.
        </p>
        <p className="mb-4">
          Despite careful review, the publisher cannot assume liability for the accuracy,
          completeness and timeliness of publications.
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
        <p className="mb-4">
          <strong>Partner links.</strong> Links to ticket sellers in the trip planner can be partner
          links; they are labelled &quot;Partner link&quot; beside the link. If you buy a ticket
          through one, park.fan earns a commission from the seller; the price is the same for you.
          When you follow a ticket link, the seller learns that you came from park.fan. After the
          click, the seller&apos;s own privacy terms apply.
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
                <span className="group-hover:text-primary font-medium">
                  Powered by Queue-Times.com
                </span>
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
                <p className="text-muted-foreground text-sm">Weather data and forecasts</p>
              </div>
              <ExternalLink
                className="text-muted-foreground group-hover:text-primary h-4 w-4 shrink-0"
                aria-hidden="true"
              />
            </a>
          </li>
        </ul>
        <p className="mb-4">
          Weather data from Open-Meteo is licensed under{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/"
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
          Using the data
        </h2>
        <p className="mb-4">
          Without an account and without an API key, the API at api.park.fan serves a park&apos;s
          current wait times and, at <code>/v1/parks/…/facilities</code>, its toilets and drinking
          water. Everything else park.fan publishes on its pages and through the API may be used
          outside park.fan only with an API key: the directory of parks and rides, park and ride
          data such as heights, minimum height, ride profiles and links, opening hours, seasons and
          events, the weather, the statistics, the forecasts, the day and trip planners and the
          travel region data. Texts and photos are not included.
        </p>
        <p className="mb-4">
          Nothing in this section applies to the data on toilets and drinking water. It comes from
          OpenStreetMap (
          <LegalLink href="https://www.openstreetmap.org/copyright">
            © OpenStreetMap contributors
          </LegalLink>
          ) and is licensed under the{' '}
          <LegalLink href="https://opendatacommons.org/licenses/odbl/1-0/">
            Open Database License (ODbL)
          </LegalLink>
          ; only the terms of that licence apply to it.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">API keys with permissions</h3>
        <p className="mb-4">
          A key carries only the permissions granted to it and is for one project. You request it
          after registering on the{' '}
          <Link href={DEVELOPERS_PATH} className="text-primary hover:text-primary/80 underline">
            developer portal
          </Link>
          . Every request is reviewed by hand; nobody is entitled to a key. A key may not be passed
          on and belongs on a server, not in an app or a web page&apos;s JavaScript. park.fan can
          restrict or revoke a key at any time, for example when the credit is missing or the
          request&apos;s details turn out to be wrong.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Free key</h3>
        <p className="mb-4">
          A key is free only when all three conditions hold. The project is open source, with its
          code public. It earns no money with park.fan&apos;s data, neither through ads, affiliate
          or paid links, a price, a subscription, in-app purchases, client work, nor as a
          company&apos;s product; donations and sponsorship are fine. And it shows a clearly visible
          link to park.fan as described below.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Credit with a link</h3>
        <p className="mb-4">
          Wherever park.fan&apos;s data appears, the same page shows a clearly visible text link
          with the link text “park.fan” to the park.fan page of the park or ride. The link is a
          plain link without <code>nofollow</code>, <code>sponsored</code> or <code>ugc</code>, sits
          in the HTML the server sends, and on a page search engines may index. An app shows the
          credit inside the app and places the link on its website or store page. Exactly how the
          link has to look is on the{' '}
          <Link
            href={`${DEVELOPERS_PATH}#${ATTRIBUTION_ANCHOR}`}
            className="text-primary hover:text-primary/80 underline"
          >
            developer portal
          </Link>
          .
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Paid key</h3>
        <p className="mb-4">
          Any other use is commercial and needs a paid key based on a written agreement with Patrick
          Arns (park.fan). Commercial is, for example, a paid app, an app with a subscription,
          in-app purchases or ads, a website with ads or affiliate links, a project whose code is
          not open, and any product a company offers. Without an agreement the data may not be
          shown, stored or passed on for such purposes, whether it comes from the pages, the API or
          the MCP server.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Wait times for non-commercial use only</h3>
        <p className="mb-4">
          Wait times and opening hours come from the platforms listed under “Data Sources”, the
          weather from Open-Meteo. park.fan passes them on for non-commercial use, with the credit
          above. park.fan holds no rights of its own in this data and so cannot permit commercial
          use: that takes an agreement with the source.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">No training of AI models</h3>
        <p className="mb-4">
          Neither the pages nor the forecasts from the API may be used to train or fine-tune AI
          models or other forecasting models. An assistant may read a page to answer someone's
          question. For the pages, the machine-readable form of these rules is in{' '}
          <a href="/robots.txt" className="text-primary hover:text-primary/80 underline">
            robots.txt
          </a>{' '}
          and{' '}
          <a href={RSL_LICENSE_PATH} className="text-primary hover:text-primary/80 underline">
            license.xml
          </a>
          .
        </p>

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
