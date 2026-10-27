/* eslint-disable react/no-unescaped-entities */
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { AnalyticsOptOut } from '@/components/common/analytics-opt-out';
import { LegalH2, LegalH3, LegalLink, LegalList } from '@/components/legal/legal-blocks';

/** The privacy policy in English, shown on every locale except `de`. */
export function DatenschutzEN() {
  return (
    <>
      <h1 className="mb-2 text-4xl font-bold">Privacy Policy</h1>
      <p className="text-muted-foreground mb-8 text-sm">Last updated: 27 October 2026</p>

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
          Between your browser and Vercel sits the network of Cloudflare Inc., 101 Townsend St., San
          Francisco, CA 94107, USA. Cloudflare answers DNS requests, keeps copies of our pages and
          filters out attacks. To do this, Cloudflare processes your IP address and the technical
          data of your request, and may set a cookie to fend off bots.
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
          Wait times, park data, favorites, the search for nearby parks, saved day plans and push
          notifications run through our own server, api.park.fan. We run it ourselves on our own
          hardware in Germany. No external host is involved.
        </p>
        <p>
          For some requests, the website passes your IP address on to this server: to work out your
          approximate location if you have not allowed location access, and to limit how many day
          plans and push subscriptions one address can create in a short time. The server does not
          log IP addresses. The legal basis is our legitimate interest in a service that works and
          is protected against misuse (Art. 6(1)(f) GDPR).
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
          feature you asked for (§ 25(2) no. 2 TDDDG). The processing that follows is based on Art.
          6(1)(f) GDPR. You can delete all of it at any time in your browser settings.
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

        <LegalH3>Umami</LegalH3>
        <p>
          To see which pages are read and which features are used, we use Umami Cloud by Umami
          Software, Inc., USA. Umami sets no cookies and stores nothing in your browser. On every
          page view the script sends the page address, the referrer, screen size, language, browser,
          operating system and device type, and for some clicks also the name of the event. The
          country is worked out from the IP address. The IP address is also combined with the
          browser details and a value that changes every month to form an ID. This ID groups the
          visits of the same browser within one month. The IP address itself is not stored. No
          profile across several websites is created.
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

        <LegalH3>Our own view counter</LegalH3>
        <p>
          So that we can show the most read posts, we also keep our own count of how often posts,
          parks and rides are viewed. Once such a page has been in the foreground for a few seconds,
          your browser sends the kind of page, its identifier and the language to our server
          api.park.fan. All that is stored is how often a page was viewed in one language on one
          day. So that nobody can distort the count, a page counts at most three times a day per
          visitor, and one IP address adds at most 500 views a day. A visitor is the IP address (for
          IPv6, its first half, the /64 network) together with the browser identifier (user agent).
          For these limits the server forms hashes from the date, the IP address, the browser
          identifier and the page with a secret key, and they expire shortly after midnight (UTC).
          The IP address itself is neither stored nor logged, and nothing is stored in your browser.
          The legal basis is our legitimate interest in showing readers the most read posts (Art.
          6(1)(f) GDPR). If your browser has "Do Not Track" or "Global Privacy Control" switched on,
          or you have excluded your visits below, nothing is sent.
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
        <p>An email to the address above is enough.</p>
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
