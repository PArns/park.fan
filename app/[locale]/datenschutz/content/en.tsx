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
      <p className="text-muted-foreground mb-8 text-sm">Last updated: 26 November 2026</p>

      <div className="space-y-4 text-base leading-7">
        <LegalH2>1. Controller</LegalH2>
        <p>
          The controller for data processing on this website and in the park.fan app for iPhone
          (section 6) is:
        </p>
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
          advertising. Ticket links in the trip planner can be partner links; see below.
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
          fend off bots.
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
          the trip you last planned in the trip planner for each region together with what you told
          Parky about your group, the parks you ticked off as visited in a region's calendar, the
          park your last chat with Parky was about, your notifications, your choices on location
          access and on statistics, and cached results. This data stays on your device. The sections
          on the day planner, on Parky and on push notifications say which parts of it go to our
          server.
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

        <LegalH3>Day planner</LegalH3>
        <p>
          Your day plan is kept in your browser's local storage. It reaches our API server only
          while you have push notifications switched on for the plan, because the server has to know
          when to remind you. We store the park, the day and the planned items under a random ID,
          with no details about you. Anyone who has a shared link can open the plan. If you switch
          the notifications off, we delete the copy on the server. The legal basis is providing the
          feature you asked for (Art. 6(1)(b) GDPR).
        </p>

        <LegalH3>Ticket links in the trip planner</LegalH3>
        <p>
          The trip planner links to ticket sellers and to the parks&apos; own shops. When you follow
          one of these links, your browser tells the seller that you came from park.fan: it sends
          the address https://park.fan/, not the page with your trip. Some of them can be partner
          links; they are labelled &quot;Partner link&quot;. If you buy a ticket through one,
          park.fan earns a commission from the seller; the price is the same for you. What the
          seller processes after the click is governed by its own privacy policy.
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

        <LegalH3 id="parky">Parky, the AI chat</LegalH3>
        <p>
          Parky answers questions about parks, wait times, forecasts and our posts in a chat window
          at the bottom right. Whether Parky appears in your browser is decided by a random number
          between 0 and 99 that we keep in local storage. It says nothing about you. As long as you
          do not chat with Parky, your browser only asks our website whether Parky is switched on.
        </p>
        <p>
          Before your first question, Cloudflare Turnstile checks whether a person is using the chat
          (see "Sending photos"). Your browser then receives a session key from our API server,
          valid for two hours. With every question it sends api.park.fan your text, the language,
          the path of the page you are on, your time zone and the chat's ID. It also sends what you
          have planned in the day planner (parks, days, entries and what you entered about your
          group, such as the height of its shortest rider), the trip you have open in the trip
          planner and the trip you last planned for each region (travel dates, parks, hotel, tickets
          and fixed days, plus what you told Parky about your group, such as how many of you there
          are and how tall the children are), during an interview with Parky which question it has
          reached, the reminders you have set, and the IDs of your favourites and of the rides you
          have marked as ridden. With the first question of a chat it also sends the greeting Parky
          opened the chat with, which can name a planned park and day. These otherwise stay in your
          browser; Parky needs them to read your plans, reminders, favourites and ridden rides and
          to change them when you ask. It sends your location only if you share it in the chat
          yourself, after Parky asked for it. The server rounds it to about ten metres, so that
          Parky can find, say, the nearest toilet inside a park, uses it for that one answer only,
          does not store it and does not pass it on to Anthropic; the language model gets distances
          only. When Parky shows you the way to a place in a park, the card reads your location in
          your browser only after you tap it, and sends it nowhere. If you ask about nearby parks
          without sharing your location, the server estimates your rough position from your IP
          address.
        </p>
        <p>
          To answer, our server passes your question, the latest messages of the chat, your plans
          and reminders as described above, and the park data looked up for it to the language model
          Claude by Anthropic PBC, 548 Market Street, PMB 90375, San Francisco, CA 94104, USA.
          Anthropic does not receive your IP address. Anthropic processes the data on our behalf to
          produce the answer and, under its terms for business customers, does not use it to train
          its models. The transfer to the USA is based on the European Commission's standard
          contractual clauses. More information:{' '}
          <LegalLink href="https://www.anthropic.com/legal/privacy" />.
        </p>
        <p>
          Our API server stores the chat, that is your questions and Parky's answers together with
          the lookups he made for them, and your rating of an answer. We do not store your plans
          themselves; the lookups hold only what Parky needs for them, such as travel dates and
          parks. This lets Parky refer back to earlier messages in the same conversation and lets us
          find wrong answers. No IP address is stored with it, only a checksum made from the
          address, the day and a secret key. It shows nothing but which chats of one day came from
          the same address and cannot be turned back into the address. We delete chats automatically
          after 7 days. So that nobody can overload the service, the server counts questions per
          session key and new sessions per IP address, both only as a checksum that expires after
          one day at the latest.
        </p>
        <p>
          If you send us feedback through Parky, we store your text with the chat's ID and, if you
          give it, your email address, so that we can reply. We delete the feedback once it is dealt
          with.
        </p>
        <p>
          For the length of the session, your browser's session storage holds a copy of the chat,
          the session key, whether Parky is switched on, which lines he has already said and, during
          an interview, how far it has got. Closing the tab deletes them. Your browser's local
          storage keeps the park your last chat was about, with its name and the date, so that Parky
          can pick up from there on your next visit. The entry stays in your browser until you
          delete it.
        </p>
        <p>
          The legal basis for the chat is providing the feature you asked for (Art. 6(1)(b) GDPR);
          for storing chats, the checksums and Turnstile it is our legitimate interest in a reliable
          chat protected against misuse (Art. 6(1)(f) GDPR). Please do not write personal details
          such as names, addresses or health information into the chat. Parky's answers are produced
          by a language model and can contain mistakes.
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
          <strong>In short:</strong> Our own server counts page views and the use of individual
          features. It does not recognize you beyond one day, and its database holds only counters,
          no IP addresses. You can object at any time.
        </p>

        <LegalH3>Our own statistics</LegalH3>
        <p>
          Our server itself counts which pages are opened and which features are used. The lists of
          most-read posts come from the same count. This happens without an ID in your browser. On
          every page view, including a move between two pages of the website, a script on our site
          reads values from your browser and sends them to api.park.fan: the path of the page
          without search terms and anchor and, derived from it, the kind of page (for example park,
          attraction or post) and the language. It does not read the size of your window. On the
          first page view after the website is opened, it also reads the origin: the domain name of
          the website you came from. If your browser passes on no origin, it takes the{' '}
          <code>utm_source</code> value from the address instead, but only when it names an entry on
          a fixed list: an AI assistant (for example chatgpt.com), or Instagram or Facebook, where
          we tag our own links that way. It reads no other value of the address. The server works
          out the kind of origin (for example search engine or social network) from that. The path
          of an address that does not exist is counted too, so that we can find broken links.
        </p>
        <p>
          For certain actions your browser also sends an event. We set its name and values in the
          program code. They are short words and numbers, never text you have written. Examples are
          which search field was opened and what kind of result you clicked, which tab you opened on
          a park page, whether you added or removed a favorite, which language you chose, whether
          you set a wait-time alert or a show reminder, how you opened the day planner, which steps
          you used in the trip planner, whether you entered tickets there and which ticket link you
          clicked (without your travel dates), that you clicked a link to a park's website or ticket
          shop or shared a page, whether Parky appeared and whether you clicked him or one of his
          lines, what kind of greeting a chat opened with (such as one about your next park day,
          never the park or the date), whether a question to Parky was the chat's first, a
          suggestion, typed or a suggested reply you tapped (with its place) and how the answer
          ended, whether you started and ended Parky's interview, in which region and which steps
          you answered or skipped, whether Parky changed one of your plans (what kinds of change,
          never their content) and whether you took that back, how you answered the question about
          notifications, or that an error page was shown. If a post, a park or an attraction is in
          the foreground for five seconds, that counts as a read. For posts we also note whether you
          read a quarter, half, three quarters or all of it. If an event belongs to a park, an
          attraction, a show or a restaurant, its ID is included, and for a post its name from the
          address. What you type into a search field, your location and your input are not sent to
          our counter. We do not measure loading times here. We do measure how long a page was
          visible in the foreground of your browser: your browser counts the seconds and reports
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
          the browser language as a two-letter code (for example <code>de</code>). From the IP
          address it also looks up, in a database on our server (GeoLite2-ASN by MaxMind), which
          network the address belongs to, and records only whether that is the network of a data
          centre, such as a cloud or a hosting provider. Such requests mostly come from programs
          rather than people. We keep counting them but show them separately in our reports. Which
          network it was is not stored. If a visit begins without an origin website on a page that
          is not in English, and your browser names no language of that page, the server records the
          visit as automated, because that is how visits by programs begin. We keep counting these
          views too and show them separately. Your browser's languages are not stored for this. From
          the user agent it also tells whether a bot is asking, and from the IP address and the user
          agent it forms an ID that is valid for one day only (see below). We do not store the IP
          address or the user agent themselves, neither in the database nor in working memory nor in
          the logs of the statistics. The server uses them only for this one request. On the way to
          it, Cloudflare processes the IP address (see section 2).
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
          device, browser, operating system and channel (one number per day, language and value).
          Visitors from data centres and from automated visits are counted separately. We keep the
          daily counts that long because we compare seasons from one year to the next, such as
          holidays and openings. For a page that few people visit, a row can stand for a single
          view. It holds no ID and no moment, but the hour and the details named below about page,
          device, country and browser language. Every row also records whether the request came from
          a data centre or belongs to an automated visit. There are four kinds of row:
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
            <strong>The visit:</strong> first page, origin (the website), channel, whether it is
            automated, number of pages, the first and the last hit by the server's clock (in
            seconds) and the details of its end (last page and device). It is deleted when the visit
            ends, 30 to 35 minutes after the last hit, and after 40 minutes at the latest.
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
            <strong>The counting of visitors:</strong> the counters per day, per hour and per
            feature until the end of the following day, at most about 49 hours. They used to end one
            hour after the day. The day counters also exist per country, device, browser, operating
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
            <strong>Counts not yet written:</strong> they are normally written within about six
            minutes. If writing fails, they are set aside for up to seven days.
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
          and from automated browsers are not counted. To tell them apart, the script also checks in
          your browser whether the operating system your browser states matches the one it runs on.
          The result does not leave your browser. A page that was never on screen, such as a tab you
          never opened, is not counted. Only views on park.fan itself are counted. The request
          passes through Cloudflare (see section 2). The counter sets no cookie and stores nothing
          in local storage.
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
          counter. We treat "Do Not Track" and "Global Privacy Control" in your browser as an
          objection too. The objection applies only to the browser in which you make it. If you
          delete your browser data, you have to make it again. Safari can also delete entries in a
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

        <LegalH2 id="app">6. The park.fan app for iPhone</LegalH2>
        <p>
          This policy also covers the park.fan app for iPhone. The app gets its data from the same
          servers as the website; what is different in the app is set out in this section. The app
          needs no account, shows no ads and sets no cookies. It contains no statistics, no
          third-party analytics, crash-reporting or advertising tool and no tracking. The count
          described in section 4 does not take place in the app.
        </p>

        <LegalH3>What stays on your iPhone</LegalH3>
        <p>
          Your favourites, your day plans, the rides you have ticked off, your settings and your
          answers in the introduction on first launch (favourite parks, how you like to ride,
          temperature unit) are stored by the app on your iPhone, together with a random ID of the
          installation and cached answers and photos. What of this goes to our servers is set out in
          the following paragraphs. "Clear cache" in the settings deletes the cached data; deleting
          the app deletes everything. This storage needs no consent, because it is strictly
          necessary for the features you asked for (Section 25(2) no. 2 TDDDG).
        </p>

        <LegalH3>Requests to our servers</LegalH3>
        <p>
          The app loads park data, wait times, forecasts and weather from our API server
          api.park.fan, and photos, news and guides from media.park.fan, a storage service at
          Cloudflare in the EU. Both go through Cloudflare (section 2), which processes your IP
          address and the technical data of the request. The app identifies itself with a key that
          is the same in every installation and says nothing about you. For the logs, what section 2
          says about the API server applies: the application writes no IP addresses into them. We
          delete the other server logs after 14 days. So that the server can return the wait times
          of your favourites, the app sends their IDs; what you type into the search is sent to find
          matches. Both are used only for the answer. If a search takes unusually long, the server
          writes the search text, without an IP address or any ID, into a diagnostic log that it
          deletes after 7 days.
        </p>
        <p>
          Toilets and drinking water in a park come from OpenStreetMap (© OpenStreetMap
          contributors, ODbL licence). The app requests them from our API server for the park in
          question and sends nothing but which park it is. They contain no personal data.
        </p>

        <LegalH3>Location in the app</LegalH3>
        <p>
          If you allow the app to use your location, it reads it only while it is open, never in the
          background. Your precise position stays on the iPhone: the app works out the compass,
          distances, walking times and "Take me there" itself. It sends api.park.fan only a position
          rounded to three decimal places, about 100 metres, to find parks near you and to tell
          whether you are in a park. It sends it again when the rounded position changes or the app
          refreshes the live data. The server uses it only for the answer, does not store it and
          redacts coordinates in its logs. Without your permission the app sends no location.
        </p>
        <p>
          Without location permission, the server estimates your approximate place from your IP
          address, which it receives with every request anyway, for the park suggestions of the
          welcome and the park row on the Start page. It uses the estimate only for that answer and
          stores neither the place nor the IP address. The legal basis is our legitimate interest in
          showing you fitting parks (Art. 6(1)(f) GDPR).
        </p>
        <p>
          The legal basis is your consent (Art. 6(1)(a) GDPR). You withdraw it in your iPhone's
          settings under Privacy &amp; Security → Location Services → park.fan.
        </p>

        <LegalH3>Notifications in the app</LegalH3>
        <p>
          Notifications are off until you choose them: in the introduction on first launch, with the
          bell on a ride, a plan or the news, or in the app's settings. Only once you choose at
          least one kind and give iOS permission does the app register with api.park.fan. We then
          store the random ID of the installation, the device token Apple assigns to the iPhone for
          park.fan, the kinds you chose, whether your iPhone is reached through Apple's test or
          production environment, your language, your time zone (for quiet hours), the paths of your
          favourite parks if you want news only about them, the ID of a stored plan (see below) and
          your wait alerts with their thresholds.
        </p>
        <p>
          Notifications are delivered through the Apple Push Notification service of Apple Inc., One
          Apple Park Way, Cupertino, CA 95014, USA. For this, Apple receives the device token, the
          time and the content of the notification. Data may be transferred to the USA in the
          process. If a notification has a photo, your iPhone loads it from media.park.fan. The
          reminder to set off for the next item in your plan is scheduled by the iPhone itself;
          nothing is sent for it.
        </p>
        <p>
          The legal basis is your consent (Art. 6(1)(a) GDPR). You can untick any kind in the app's
          settings or switch notifications off in your iPhone's settings. If you switch all
          notifications off, or withdraw the app's permission in your iPhone's settings, the app
          deletes the registration with all its alerts from our server the next time it is opened.
          Which kinds you had chosen stays on your iPhone only, so that the choice is still there
          when you switch back on. If Apple reports during a delivery that the token is no longer
          valid, for example because you deleted the app, we delete the registration with all its
          alerts.
        </p>

        <LegalH3>Park day on the Lock Screen</LegalH3>
        <p>
          When you are in an open park, the app shows the wait times of your rides, the next item in
          your plan and the next show on the Lock Screen and in the Dynamic Island. This is put
          together on your iPhone alone from data the app has already loaded; nothing is sent to us
          for it. While it runs, iOS may wake the app in the background now and then. The app then
          reloads that park's wait times, without your location. You can switch it off in the app's
          settings ("Park day on the Lock Screen") or in your iPhone's settings.
        </p>

        <LegalH3>Day planner in the app</LegalH3>
        <p>
          Your plans stay on the iPhone. If you tap "Optimize the day", the app sends api.park.fan
          the date, the day's entries and, if you gave them, the height of the smallest rider and
          whether you want to stay dry or enter the park early. The server works out the order from
          this and does not store the plan.
        </p>
        <p>
          If you switch on notifications for a plan, what section 3 says under "Day planner"
          applies: the server stores the watched days under a random ID, with no details about you.
          A plan that only the app holds is deleted 7 days after its last planned day. If you switch
          the plan's notifications off, the app deletes the copy on the server.
        </p>

        <LegalH3 id="parky-app">Parky in the app</LegalH3>
        <p>
          For Parky, the section "Parky, the AI chat" above applies, with these differences. Before
          your first message, the app shows what is sent and to whom, and asks you; without "Agree",
          no message leaves the iPhone. Instead of Cloudflare Turnstile, the app opens the session
          with the app's key. With each message it sends your text and Parky's greeting, the page
          you opened the chat from (and Parky's tip, if you ask from one), your language and time
          zone, the chat's ID, your planned days (the next ones, at most 8, with their items and the
          details about your group, later ones with park, date and number of items), the IDs of your
          favourites, whether notifications are on for the iPhone and, during an interview with
          Parky, which question it is at. The app sends your location only after you share it in the
          chat, rounded to about 100 metres; from then on it sends it with each message for as long
          as the chat is open. If you close the chat or start a new one, it sends it again only once
          you share it again. The server does not store it and does not pass it on to Anthropic. Our
          server passes the request on to Anthropic as described above. A copy of the chat stays on
          your iPhone for up to two hours.
        </p>
        <p>
          "New chat" and switching off "Chat with Parky" in the app's settings delete the chat on
          the iPhone and, while the session runs (two hours), on our server too; otherwise the
          server deletes it after 7 days. Switching it off withdraws your consent; after that the
          app sends nothing more to Parky.
        </p>
        <p>
          With "Report answer" you can report an answer to us with a reason and, if you like, a
          note. The report is stored with the chat and deleted with it, after 7 days at the latest.
          "New chat" does not delete a chat with a reported answer early, so that we can review the
          report. If you ask Parky to pass something on to us, what is said above about feedback
          through Parky applies. The legal bases are the same as above.
        </p>

        <LegalH3>Links from the app</LegalH3>
        <p>
          The app opens pages of park.fan and of our data sources in a Safari window inside the app.
          For park.fan, the website part of this policy applies there, including the statistics
          (section 4); for the other pages, their provider's policy.
        </p>

        <LegalH3>App Store, TestFlight and Apple</LegalH3>
        <p>
          You get the app from Apple's App Store or, for tests, through TestFlight. Apple is itself
          responsible for what it processes in doing so:{' '}
          <LegalLink href="https://www.apple.com/legal/privacy/" />. If you have allowed your iPhone
          to share analytics with app developers, Apple gives us crash reports and aggregated
          figures, for example on installations; we cannot link them to a person. If you take part
          in a test through TestFlight, we see the email address we invited you with and what you
          send as feedback through TestFlight, with screenshot and crash report.
        </p>

        <LegalH3>Deleting everything</LegalH3>
        <LegalList>
          <li>
            <strong>On the iPhone:</strong> deleting the app removes favourites, plans, settings and
            the copy of the chat.
          </li>
          <li>
            <strong>Chat:</strong> "New chat" or switching off "Chat with Parky", as described
            above; otherwise after 7 days.
          </li>
          <li>
            <strong>Stored plan:</strong> switch the plan's notifications off; otherwise 7 days
            after the last planned day.
          </li>
          <li>
            <strong>Location:</strong> not stored; you withdraw the permission in your iPhone's
            settings.
          </li>
          <li>
            <strong>Notifications:</strong> as described above under "Notifications in the app".
          </li>
          <li>
            <strong>Everything else:</strong> an email to the address in section 1 is enough.
          </li>
        </LegalList>

        <LegalH2>7. Your rights</LegalH2>
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

        <LegalH2>8. Storage period and security</LegalH2>
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
