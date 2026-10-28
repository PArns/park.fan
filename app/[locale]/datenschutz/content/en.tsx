/* eslint-disable react/no-unescaped-entities */
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { AnalyticsOptOut } from '@/components/common/analytics-opt-out';
import { LegalH2, LegalH3, LegalLink, LegalList } from '@/components/legal/legal-blocks';
import { ANALYTICS_OPT_OUT_KEY } from '@/lib/analytics/opt-out';

/** The privacy policy in English, shown on every locale except `de`. */
export function DatenschutzEN() {
  return (
    <>
      <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8 text-sm">Last updated: 28 October 2026</p>

      <div className="space-y-4 text-base leading-7">
        <LegalH2>1. Controller</LegalH2>
        <p>The controller for data processing on this website is:</p>
        <address className="not-italic">
          <strong>Patrick Arns</strong>
          <br />
          Ahrstr. 7
          <br />
          52511 Geilenkirchen
          <br />
          Email: <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[at]park.fan" />
        </address>
        <p>
          You can use park.fan without an account. Which data is processed depends on which features
          you use. The sections below list each one. We show no ads and do not pass on data for
          advertising.
        </p>

        <LegalH2>2. Hosting and delivery</LegalH2>

        <LegalH3>Vercel</LegalH3>
        <p>
          The website is hosted by Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, USA. Its
          representative in the EU is EDPO, Avenue Huart Hamoir 71, 1030 Brussels, Belgium. On every
          page view, Vercel processes the data your browser sends along: IP address, time, the
          address requested, referrer, browser and operating system. Vercel needs this data to
          deliver the pages and keeps it in server logs for a short time. We do not combine this
          data with other data.
        </p>
        <p>
          Vercel processes the data on our behalf under a data processing agreement. Data may be
          transferred to the USA in the process. Vercel is certified under the EU-US Data Privacy
          Framework. The legal basis is our legitimate interest in delivering the website securely
          and quickly (Art. 6(1)(f) GDPR). More information:{' '}
          <LegalLink href="https://vercel.com/legal/privacy-policy" />.
        </p>

        <LegalH3>Cloudflare</LegalH3>
        <p>
          Between your browser and Vercel, and our API server api.park.fan, sits the network of
          Cloudflare Inc., 101 Townsend St., San Francisco, CA 94107, USA. Cloudflare answers DNS
          requests, keeps copies of our pages and filters out attacks. To do this, Cloudflare
          processes your IP address and the technical data of your request, and may set a cookie to
          fend off bots. Your browser may also send reports about network errors to Cloudflare
          (Network Error Logging).
        </p>
        <p>
          The legal basis is our legitimate interest in providing the website securely and without
          errors (Art. 6(1)(f) GDPR). Cloudflare processes the data on our behalf. The transfer to
          the USA is based on Cloudflare's certification under the{' '}
          <LegalLink href="https://www.dataprivacyframework.gov/participant/5666">
            EU-US Data Privacy Framework
          </LegalLink>{' '}
          and on the standard contractual clauses of the European Commission. More information:{' '}
          <LegalLink href="https://www.cloudflare.com/privacypolicy/" />.
        </p>

        <LegalH3>Our API server (api.park.fan)</LegalH3>
        <p>
          Wait times, park data, favorites, the search for nearby parks, saved day plans, push
          notifications and our own statistics (section 4) run through our own server, api.park.fan.
          We run it ourselves on our own hardware in Germany. No external host is involved. Requests
          to it pass through Cloudflare.
        </p>
        <p>
          For some requests, the website passes your IP address on to this server: to work out your
          approximate location if you have not allowed location access, and to limit how many day
          plans and push subscriptions one address can create in a short time. The legal basis is
          our legitimate interest in a service that works and is protected against misuse (Art.
          6(1)(f) GDPR).
        </p>
        <p>
          The application on our API server writes no IP addresses into its logs. That holds for the
          statistics and the count of the most-read posts, and equally for the technical error and
          security logs. Only the request lines of the editorial area, which only our editor
          accounts can reach, carry an address, and even that only shortened: for IPv4 without the
          last byte, for IPv6 only the first 48 bits.
        </p>

        <LegalH2>3. Features of the website</LegalH2>

        <LegalH3>Cookies and local storage</LegalH3>
        <p>
          We do not set cookies for advertising or analytics. We set the following cookies
          ourselves, each for a feature you chose:
        </p>
        <LegalList>
          <li>
            <code>favorites</code>: your favorites. Its content goes to our API server so that the
            server can return their wait times. Valid for one year.
          </li>
          <li>
            <code>temp_unit</code>: whether temperatures are shown in Celsius or Fahrenheit.
          </li>
          <li>
            <code>NEXT_LOCALE</code>: the language you chose last.
          </li>
        </LegalList>
        <p>
          In your browser's local storage we keep settings such as the color scheme, your day plan,
          your notifications, your choices on location access and on statistics, and cached results.
          This data stays on your device. The sections on the trip planner and on push notifications
          say which parts of it go to our server.
        </p>
        <p>
          These cookies and entries need no consent, because they are strictly necessary for the
          feature you asked for (§ 25(2) no. 2 TDDDG). This includes the entry{' '}
          <code>{ANALYTICS_OPT_OUT_KEY}</code>, which remembers your objection to the statistics. It
          holds no ID. The processing that follows is based on Art. 6(1)(f) GDPR. You can delete all
          of it at any time in your browser settings.
        </p>

        <LegalH3>Location and "Nearby parks"</LegalH3>
        <p>
          On the home page and on park pages we show parks near you and, when you are inside a park,
          tips for that park. If you allow location access in your browser, we send your device's
          coordinates to our API server. Otherwise the server works out an approximate location from
          your IP address. In both cases the location is used only for the response and is not
          stored.
        </p>
        <p>
          The legal basis for the coordinates is your consent (Art. 6(1)(a) GDPR), which you can
          withdraw at any time in your browser's location settings. The approximation from your IP
          address is based on our legitimate interest in showing you suitable parks (Art. 6(1)(f)
          GDPR).
        </p>

        <LegalH3>Trip planner</LegalH3>
        <p>
          Your day plan is kept in your browser's local storage. It reaches our API server only
          while you have push notifications switched on for the plan, because the server has to know
          when to remind you. We store the park, the day and the planned items under a random ID,
          with no details about you. Anyone who has a shared link can open the plan. If you switch
          the notifications off, we delete the copy on the server. The legal basis is providing the
          feature you asked for (Art. 6(1)(b) GDPR).
        </p>

        <LegalH3>Push notifications</LegalH3>
        <p>
          You can get a notification when the wait time of an attraction drops below a value, when a
          show starts or when the next item in your day plan is due. A subscription is created only
          when you switch this on and give your browser permission. Our API server then stores your
          browser's push address with its keys, your language, your time zone and who or what you
          follow, together with the thresholds you chose.
        </p>
        <p>
          The messages are delivered through the push service of your browser's maker, for example
          Google (Chrome, Android), Apple (Safari), Mozilla (Firefox) or Microsoft (Edge). This
          service learns the push address and the time. It sees the content of the message only in
          encrypted form. Data may be transferred to the USA in the process.
        </p>
        <p>
          The legal basis is your consent (Art. 6(1)(a) GDPR). You can unsubscribe at any time on
          the "Alerts" page or in your browser settings. If you unsubscribe from all notifications,
          we delete the subscription.
        </p>

        <LegalH3>Sending photos</LegalH3>
        <p>
          You can send us photos through the "Upload photos" form. We store the photos, the park or
          attraction, the caption and the name you want to be credited under. Photos up to 4 MB are
          uploaded unchanged, with all the metadata in the file. This often includes the time the
          photo was taken and the camera and, depending on the device, the place it was taken. We
          use that place to check whether the photo was taken in the park you named. Larger photos
          are scaled down by your browser before the upload, and the metadata is lost in the
          process. Before we publish a photo, we remove all metadata from the file.
        </p>
        <p>
          Submissions are kept in non-public storage at Vercel (Vercel Blob, see above). We delete
          rejected submissions once we have reviewed them. Published photos stay stored as long as
          they can be seen on park.fan. The legal basis is the license you grant us with your
          submission (Art. 6(1)(b) GDPR). If you ask us by email, we delete your submission.
        </p>
        <p>
          We use Cloudflare Turnstile against automated submissions. The script loads only when the
          form appears. Turnstile uses your IP address and technical features of your browser to
          check whether a person is filling in the form. The legal basis is our legitimate interest
          in protection against spam and misuse (Art. 6(1)(f) GDPR). For the transfer to the USA,
          what is said about Cloudflare above applies.
        </p>

        <LegalH3>Contact by email or phone</LegalH3>
        <p>
          If you write to us or call us, we process your request and your contact details in order
          to answer you. The legal basis is our legitimate interest in answering (Art. 6(1)(f)
          GDPR), or Art. 6(1)(b) GDPR for requests about a contract. We delete the request once it
          is dealt with, unless a legal duty to retain it applies.
        </p>

        <LegalH2>4. Statistics</LegalH2>
        <p>
          <strong>In short:</strong> Two services count page views, Umami and our own server. Only
          our server counts the use of individual features. It does not recognize you beyond one
          day, and its database holds only counters, no IP addresses. Umami groups the views of one
          browser for up to one month. You can object at any time.
        </p>

        <LegalH3>Umami</LegalH3>
        <p>
          To see which pages are read and which features are used, we use Umami Cloud by Umami
          Software, Inc., USA. Umami sets no cookies and stores nothing in your browser. On every
          page view the script reads the page address, the page title, the referrer, the screen size
          and the language setting from your browser and sends them to Umami. The anchor and the
          query are dropped from the address, and on a page with a query, such as the search page,
          the page title too, so no search term reaches Umami. From these details and the user
          agent, Umami works out the browser, the operating system and the device type. If an
          interaction or a layout shift is noticeably slow, a performance measure with the affected
          page element is added. Umami does not report clicks or features; we count those ourselves
          (see below). The country is worked out from the IP address. The IP address is also
          combined with the browser details and a value that changes every month to form an ID. This
          ID groups the visits of the same browser within one month. The IP address itself is not
          stored. No profile across several websites is created.
        </p>
        <p>
          Umami processes the data on our behalf. Umami and some of its service providers are based
          in the USA, so a transfer there is possible. It rests on the EU Commission's Standard
          Contractual Clauses, which are part of the data processing agreement with Umami. The legal
          basis is our legitimate interest in improving the service with usage statistics (Art.
          6(1)(f) GDPR). If your browser has "Do Not Track" switched on, nothing is sent. Below, you
          can also exclude your visits from the statistics. More information:{' '}
          <LegalLink href="https://umami.is/privacy" />.
        </p>

        <LegalH3>Our own statistics</LegalH3>
        <p>
          Alongside it, our server itself counts which pages are opened and which features are used.
          The lists of most-read posts come from the same count. This happens without an ID in your
          browser. On every page view, including a move between two pages of the website, a script
          on our site reads values from your browser and sends them to api.park.fan: the path of the
          page without search terms and anchor and, derived from it, the kind of page (for example
          park, attraction or post) and the language. It does not read the size of your window. On
          the first page view after the website is opened, it also reads the origin: the domain name
          of the website you came from. The server works out the kind of origin (for example search
          engine or social network) from that. The path of an address that does not exist is counted
          too, so that we can find broken links.
        </p>
        <p>
          For certain actions your browser also sends an event. We set its name and values in the
          program code. They are short words and numbers, never text you have written. Examples are
          which search field was opened and what kind of result you clicked, which tab you opened on
          a park page, whether you added or removed a favorite, which language you chose, whether
          you set a wait-time alert or a show reminder, how you opened the day planner, that you
          clicked a link to a park's website or ticket shop or shared a page, how you answered the
          question about notifications, or that an error page was shown. If a post, a park or an
          attraction is in the foreground for five seconds, that counts as a read. For posts we also
          note whether you read a quarter, half, three quarters or all of it. If an event belongs to
          a park, an attraction, a show or a restaurant, its ID is included, and for a post its name
          from the address. What you type into a search field, your location and your input are not
          sent to our counter. We do not measure loading times here. We do measure how long a page
          was visible in the foreground of your browser: your browser counts the seconds and reports
          them when you move to the next page or leave the tab. It sends no time of day with them,
          and at most 30 minutes count for one page view.
        </p>
        <p>
          As with every request, the server also receives your IP address, the details of your
          browser and operating system (user agent) and the languages your browser states. From the
          user agent it works out the browser family, the operating system family and the device
          class (phone, tablet or computer), for example Safari, iOS and phone. The device class
          comes from the user agent alone, not from the size of your window or screen. From the IP
          address it works out the country, and from the first language in the header of the request
          the browser language as a two-letter code (for example <code>de</code>). From the user
          agent it also tells whether a bot is asking, and from the IP address and the user agent it
          forms an ID that is valid for one day only (see below). We do not store the IP address or
          the user agent themselves, neither in the database nor in working memory nor in the logs
          of the statistics. The server uses them only for this one request. On the way to it,
          Cloudflare processes the IP address (see section 2).
        </p>
        <p>
          The database holds only rows of counters, each for one full hour (UTC) and never for a
          moment. The server writes them every five minutes, only adds to them and never changes
          them. It deletes these hourly rows after 90 days, as whole parts of the table of one week
          each, so a row stays for up to 97 days. Alongside, it sums every finished day into daily
          counts, each by a few features at a time, for example only by the page with its kind, only
          by the country, or only by device and browser, never by all the details of an hourly row.
          A daily count holds the day, the language, the counters and only the details of that
          selection. The server deletes these as whole weekly parts of the table too, after 400
          days, so they stay for up to 407 days. After 400 days it also deletes the visitor counts
          (one number per day and per hour, in total and per language) and those per country,
          device, browser, operating system and channel (one number per day, language and value). We
          keep the daily counts that long because we compare seasons from one year to the next, such
          as holidays and openings. For a page that few people visit, a row can stand for a single
          view. It holds no ID and no moment, but the hour and the details named below about page,
          device, country and browser language. There are four kinds of row:
        </p>
        <LegalList>
          <li>
            <strong>Page view:</strong> language, path, kind of page, device class, browser family,
            operating system family, country and browser language, plus the number of views and the
            sum of the seconds in the foreground. None of it belongs to a visit.
          </li>
          <li>
            <strong>Start of a visit:</strong> the first page and the device, plus the entry page,
            origin (the website) and channel, and the number of visits, the number of visits that
            saw a second page and the sum of the seconds in the foreground.
          </li>
          <li>
            <strong>End of a visit:</strong> the last page and the device, plus the same details of
            the start, and the number of visit ends and the sum of the duration (last hit minus
            first). So the first and the last page of a visit are tied to where it came from, the
            pages in between are not.
          </li>
          <li>
            <strong>Event:</strong> page and device (without the browser language), the name of the
            event, its values from the fixed selection and, where it applies, the ID of a park, an
            attraction, a show or a restaurant. None of it belongs to a visit. The ID of a park
            never comes from your location: the events about nearby parks and the compass carry no
            park.
          </li>
        </LegalList>
        <p>
          To count visitors, visits and visit ends and to protect the count from abuse, the server
          forms IDs from the IP address and the user agent, with a secret key that is a different
          one for each day. The IP address cannot be calculated from an ID. But whoever has the
          secret key can check whether a known IP address with a certain user agent belongs to an ID
          that is still stored. We therefore treat the IDs as personal data. They sit only in the
          working memory of our server (Redis), never in the database. What is kept there:
        </p>
        <LegalList>
          <li>
            <strong>The visit:</strong> first page, origin (the website), channel, number of pages,
            the first and the last hit by the server's clock (in seconds) and the details of its end
            (last page and device). It is deleted when the visit ends, 30 to 35 minutes after the
            last hit, and after 40 minutes at the latest.
          </li>
          <li>
            <strong>The open visits:</strong> the IDs of the visits under way with the time of their
            last hit, until the visit ends and never for longer than two hours.
          </li>
          <li>
            <strong>Live counters per minute</strong> (pages, countries, channels, referring
            websites, devices, names of events) and the counters for "active now" (visitors, views
            and events per minute): 35 minutes. The live counters hold no ID of a visitor.
          </li>
          <li>
            <strong>The counting of visitors:</strong> per day at most 25 hours, per hour until the
            end of the day. The day counters also exist per country, device, browser, operating
            system and channel, with the same ID of the day and the same lifetime. A list of that
            day's counters sits beside them and holds no ID.
          </li>
          <li>
            <strong>Limits:</strong> how often an address or a visitor sends something or reads a
            page in a day, until the end of the day (UTC) plus one minute. The sets of names, paths
            and referring websites that occurred on a day, so that nobody can fill them with
            inventions, until the end of the following day. They hold no ID of a visitor.
          </li>
          <li>
            <strong>Counts not yet written:</strong> those of the current five-minute window, for
            about six minutes.
          </li>
          <li>
            <strong>Counters with no reader in them:</strong> how many requests arrived in a
            five-minute window (15 minutes) and how many were dropped for which reason (to the end
            of the next day).
          </li>
        </LegalList>
        <p>
          Somebody who comes back on another day is counted again, because the IDs of one day have
          nothing in common with those of the next. So that nobody can distort the lists of
          most-read posts, a page counts at most three times a day per visitor. Requests from bots
          and from automated browsers are not counted. Only views on park.fan itself are counted.
          The request passes through Cloudflare (see section 2). The counter sets no cookie and
          stores nothing in local storage.
        </p>
        <p>
          The legal basis is our legitimate interest in showing the most-read posts, in seeing which
          pages are read in which language and by which routes, and which features and which search
          are used so that we can improve the service, and in protecting the count from distortion
          (Art. 6(1)(f) GDPR).
        </p>
        <p>
          You can object to the count at any time without giving reasons. Because we assign you no
          ID, we put the objection into effect on your device: the switch below stores a marker
          without an ID in your browser. As long as it is there, your browser sends nothing to our
          counter and nothing to Umami. We treat "Do Not Track" in your browser as an objection too,
          for both counters. "Global Privacy Control" applies only to our own counter; Umami does
          not read it. The objection applies only to the browser in which you make it. If you delete
          your browser data, you have to make it again. Safari can also delete entries in a
          website's local storage if you have not used the website for seven days. The statistics
          then count your visits again until you set the switch anew. An email to us does not help
          here, because we cannot tie any count to a person.
        </p>
        <AnalyticsOptOut />

        <LegalH2>5. Maps and embedded content</LegalH2>

        <LegalH3>Maps (CARTO)</LegalH3>
        <p>
          Our maps use map images from CARTO (CartoDB Inc., 307 Fifth Avenue, Floor 9, New York, NY
          10016, USA), made from OpenStreetMap data. As soon as a map is shown, your browser loads
          the map images directly from CARTO's servers. CARTO learns your IP address, the time and
          the part of the map shown. CARTO is certified under the EU-US Data Privacy Framework. The
          legal basis is our legitimate interest in showing the parks clearly (Art. 6(1)(f) GDPR).
          More information: <LegalLink href="https://carto.com/privacy" />.
        </p>

        <LegalH3>YouTube</LegalH3>
        <p>
          Some blog posts contain YouTube videos from Google Ireland Limited, Gordon House, Barrow
          Street, Dublin 4, Ireland. Until you tap "Play video", you only see a preview image, which
          is delivered through our own server. Only when you tap does your browser load the player
          in privacy-enhanced mode (youtube-nocookie.com). YouTube then receives your IP address and
          details about your device and can store data in your browser. Data may be transferred to
          Google LLC in the USA, which is certified under the EU-US Data Privacy Framework. The
          legal basis is the consent you give by tapping (Art. 6(1)(a) GDPR, § 25(1) TDDDG). More
          information: <LegalLink href="https://policies.google.com/privacy" />.
        </p>

        <LegalH3>Suno</LegalH3>
        <p>
          One blog post contains a music player from Suno, Inc., USA. It also loads only when you
          tap "Play song". Suno then receives your IP address and details about your device and can
          store data in your browser. The legal basis is the consent you give by tapping (Art.
          6(1)(a) GDPR, § 25(1) TDDDG). There is no adequacy decision for the USA that covers Suno.
          More information: <LegalLink href="https://suno.com/privacy" />.
        </p>

        <LegalH3>Instagram</LegalH3>
        <p>
          If a blog post embeds an Instagram post, you first see only a link. Only when you tap
          "Load post" does your browser load content from Meta Platforms Ireland Limited, Merrion
          Road, Dublin 4, Ireland. Meta then receives your IP address and details about your device
          and can set cookies. Data may be transferred to Meta Platforms, Inc. in the USA, which is
          certified under the EU-US Data Privacy Framework. The legal basis is the consent you give
          by tapping (Art. 6(1)(a) GDPR, § 25(1) TDDDG). More information:{' '}
          <LegalLink href="https://privacycenter.instagram.com/policy" />.
        </p>

        <LegalH2>6. Your rights</LegalH2>
        <p>You have the right to</p>
        <LegalList>
          <li>access the data stored about you (Art. 15 GDPR),</li>
          <li>have incorrect data corrected (Art. 16 GDPR),</li>
          <li>have your data erased (Art. 17 GDPR),</li>
          <li>have the processing restricted (Art. 18 GDPR),</li>
          <li>receive your data in a portable format (Art. 20 GDPR),</li>
          <li>
            withdraw your consent with effect for the future (Art. 7(3) GDPR). Processing carried
            out before that remains lawful.
          </li>
        </LegalList>
        <p>
          An email to the address above is enough. For the statistics that does not apply: we cannot
          tie any data there to a person (Art. 11 GDPR). Access, correction, erasure, restriction
          and portability are therefore not possible for them. You object to the count with the
          switch in section 4.
        </p>
        <p>
          <strong>
            Right to object (Art. 21 GDPR): If processing is based on Art. 6(1)(e) or (f) GDPR, you
            can object to it at any time on grounds relating to your particular situation. We will
            then stop processing the data, unless we can show compelling legitimate grounds that
            override your interests, rights and freedoms, or the processing serves to establish,
            exercise or defend legal claims.
          </strong>
        </p>
        <p>
          You can also lodge a complaint with a data protection supervisory authority. The authority
          responsible for us is the Landesbeauftragte für Datenschutz und Informationsfreiheit
          Nordrhein-Westfalen, Kavalleriestraße 2–4, 40213 Düsseldorf,{' '}
          <LegalLink href="https://www.ldi.nrw.de" />.
        </p>

        <LegalH2>7. Storage period and security</LegalH2>
        <p>
          Where no specific period is given above, we delete personal data as soon as the purpose no
          longer applies and no legal duty to retain it applies. All connections to park.fan and
          api.park.fan are encrypted with TLS.
        </p>
        <p>
          You are not obliged to provide any data. Without location access, notifications or a
          submission, only those features are unavailable. There is no automated decision-making
          within the meaning of Art. 22 GDPR.
        </p>

        <p className="text-muted-foreground mt-8 text-sm">
          Parts of this policy are based on a template from{' '}
          <LegalLink href="https://www.e-recht24.de">e-recht24.de</LegalLink>.
        </p>
      </div>
    </>
  );
}
