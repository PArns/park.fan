/* eslint-disable react/no-unescaped-entities */
import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { ObfuscatedPhone } from '@/components/common/obfuscated-phone';
import { ExternalLink } from 'lucide-react';
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
          These terms cover all data park.fan publishes on its pages, through the API at
          api.park.fan and through the MCP server. Texts and photos are not included; the
          photographers hold the rights to many of the photos.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Without an API key, wait times only</h3>
        <p className="mb-4">
          Without a key the API serves the current wait times and status of a park's attractions,
          and nothing else. Everything else needs an API key with the matching permission: the park
          directory and park data, ride data such as minimum height, ride profile and links, opening
          hours, seasons, the weather, statistics, forecasts, the day and trip planners and the
          travel data. A key carries only the permissions granted to it. The wait times without a
          key, too, may only be used by those who earn no money with them and link park.fan as
          described under "Credit".
        </p>
        <p className="mb-4">
          You request a key on the{' '}
          <Link href={DEVELOPERS_PATH} className="text-primary hover:text-primary/80 underline">
            developer portal
          </Link>
          . Every request is reviewed by hand; nobody is entitled to a key.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          A free key only for open source without earnings
        </h3>
        <p className="mb-4">A free key is issued only when all three conditions hold:</p>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>The project's source code is public, under an open-source licence.</li>
          <li>
            The project earns no money: no ads, no affiliate or paid links, no price, no
            subscription, no in-app purchases, no client work. Donations and sponsorship are fine.
          </li>
          <li>
            Every page and screen showing park.fan's data links park.fan visibly, as described under
            "Credit".
          </li>
        </ul>
        <p className="mb-4">
          When one of the conditions no longer holds, the free key ends. park.fan may then revoke it
          without notice.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Any other use is paid</h3>
        <p className="mb-4">
          Any other use gets a key only against payment and with a written agreement with Patrick
          Arns (park.fan): anything with ads, affiliate links, a price, a subscription or in-app
          purchases, client work, any company's product, and any project whose source code is not
          public. Without that agreement, park.fan's data may not be shown, stored or passed on for
          such purposes, whether it comes from the pages, the API or the MCP server.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Credit</h3>
        <p className="mb-4">
          Whoever shows park.fan's data links park.fan. For a free key and for the wait times
          without a key:
        </p>
        <ul className="mb-4 list-disc space-y-2 pl-6">
          <li>
            A text link with the word park.fan to the park.fan page of the park or attraction whose
            data is shown; when a view shows many parks, to the home page.
          </li>
          <li>
            An ordinary link in the page's HTML: without nofollow, sponsored or ugc, without a
            redirect, and not added only by a script.
          </li>
          <li>Visible and close to the data, on a page search engines may index.</li>
          <li>
            In an app, the visible line "Data: park.fan" and such a link on the project's website.
          </li>
        </ul>
        <p className="mb-4">
          Examples and every detail are on the{' '}
          <Link
            href={`${DEVELOPERS_PATH}#${ATTRIBUTION_ANCHOR}`}
            className="text-primary hover:text-primary/80 underline"
          >
            developer portal
          </Link>
          . For a paid key, the agreement settles the credit.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Wait times, opening hours and weather</h3>
        <p className="mb-4">
          Wait times and opening hours come from the platforms listed under Data Sources, the
          weather from Open-Meteo. park.fan passes them on under the terms above. park.fan holds no
          rights of its own to this data and so cannot allow commercial use of it either: that needs
          an agreement with the source in question.
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
