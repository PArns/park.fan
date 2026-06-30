/* eslint-disable react/no-unescaped-entities */
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { AnalyticsOptOut } from '@/components/common/analytics-opt-out';

export function DatenschutzEN() {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">Privacy Policy</h1>

      <div className="space-y-6 text-base leading-7">
        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold first:mt-0">
          1. Data Protection at a Glance
        </h2>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">General Information</h3>
        <p className="mb-4">
          The following information provides a simple overview of what happens to your personal data
          when you visit this website. Personal data is any data with which you can be personally
          identified. Detailed information on the subject of data protection can be found in our
          privacy policy listed below this text.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Data Collection on This Website</h3>

        <h4 className="mt-6 mb-3 text-xl font-semibold">
          Who is responsible for data collection on this website?
        </h4>
        <p className="mb-4">
          Data processing on this website is carried out by the website operator. You can find their
          contact details in the section "Information on the Responsible Party" in this privacy
          policy.
        </p>

        <h4 className="mt-6 mb-3 text-xl font-semibold">How do we collect your data?</h4>
        <p className="mb-4">
          On the one hand, your data is collected when you provide it to us. This can be, for
          example, data that you enter in a contact form.
        </p>
        <p className="mb-4">
          Other data is collected automatically or after your consent when you visit the website by
          our IT systems. This is mainly technical data (e.g., internet browser, operating system,
          or time of page access). This data is collected automatically as soon as you enter this
          website.
        </p>

        <h4 className="mt-6 mb-3 text-xl font-semibold">What do we use your data for?</h4>
        <p className="mb-4">
          Some of the data is collected to ensure error-free provision of the website. Other data
          may be used to analyze your user behavior. If contracts can be concluded or initiated via
          the website, the transmitted data will also be processed for contract offers, orders, or
          other service requests.
        </p>

        <h4 className="mt-6 mb-3 text-xl font-semibold">
          What rights do you have regarding your data?
        </h4>
        <p className="mb-4">
          You have the right at any time to receive information free of charge about the origin,
          recipient, and purpose of your stored personal data. You also have the right to request
          the correction or deletion of this data. If you have given consent to data processing, you
          can revoke this consent at any time for the future. You also have the right, under certain
          circumstances, to request the restriction of the processing of your personal data.
          Furthermore, you have the right to lodge a complaint with the competent supervisory
          authority.
        </p>
        <p className="mb-4">
          You can contact us at any time regarding this and other questions on the subject of data
          protection.
        </p>

        <h4 className="mt-6 mb-3 text-xl font-semibold">Analysis Tools and Third-Party Tools</h4>
        <p className="mb-4">
          When visiting this website, your surfing behavior may be statistically analyzed. This is
          done primarily with so-called analysis programs.
        </p>
        <p className="mb-4">
          Detailed information about these analysis programs can be found in the following privacy
          policy.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          2. Hosting and Content Delivery Networks (CDN)
        </h2>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Hosting</h3>
        <p className="mb-4">
          This website is hosted externally. The personal data collected on this website is stored
          on the servers of the host(s). This may include IP addresses, contact requests, meta and
          communication data, contract data, contact details, names, website access and other data
          generated via a website.
        </p>
        <p className="mb-4">
          External hosting is carried out for the purpose of contract fulfillment with our potential
          and existing customers (Art. 6 para. 1 lit. b GDPR) and in the interest of a secure, fast,
          and efficient provision of our online offering by a professional provider (Art. 6 para. 1
          lit. f GDPR). If a corresponding consent has been requested, processing is carried out
          exclusively on the basis of Art. 6 para. 1 lit. a GDPR and § 25 para. 1 TTDSG, insofar as
          the consent includes the storage of cookies or access to information on the user's device
          (e.g., device fingerprinting) within the meaning of the TTDSG. Consent can be revoked at
          any time.
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
          We use the "Cloudflare" service. The provider is Cloudflare Inc., 101 Townsend St., San
          Francisco, CA 94107, USA (hereinafter "Cloudflare").
        </p>

        <p className="mb-4">
          Cloudflare offers a globally distributed content delivery network with DNS. Technically,
          the information transfer between your browser and our website is routed through
          Cloudflare's network. This enables Cloudflare to analyze the data traffic between your
          browser and our website and to serve as a filter between our servers and potentially
          malicious data traffic from the internet. In doing so, Cloudflare may also use cookies or
          other technologies to recognize internet users, which are used solely for the purpose
          described here.
        </p>
        <p className="mb-4">
          The use of Cloudflare is based on our legitimate interest in the most error-free and
          secure provision of our web offering (Art. 6 para. 1 lit. f GDPR).
        </p>
        <p className="mb-4">
          Data transfer to the USA is based on the standard contractual clauses of the EU
          Commission. Details and further information on security and data protection at Cloudflare
          can be found{' '}
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
          The company is certified under the "EU-US Data Privacy Framework" (DPF). The DPF is an
          agreement between the European Union and the USA that is intended to ensure compliance
          with European data protection standards for data processing in the USA. Every company
          certified under the DPF undertakes to comply with these data protection standards. Further
          information on this can be obtained from the provider{' '}
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
          We have concluded a data processing agreement (DPA) for the use of the above-mentioned
          service. This is a contract required by data protection law that ensures that this party
          processes the personal data of our website visitors only in accordance with our
          instructions and in compliance with the GDPR.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          3. General Information and Mandatory Information
        </h2>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Data Protection</h3>
        <p className="mb-4">
          The operators of these pages take the protection of your personal data very seriously. We
          treat your personal data confidentially and in accordance with the statutory data
          protection regulations and this privacy policy.
        </p>
        <p className="mb-4">
          When you use this website, various personal data is collected. Personal data is data with
          which you can be personally identified. This privacy policy explains what data we collect
          and what we use it for. It also explains how and for what purpose this happens.
        </p>
        <p className="mb-4">
          We point out that data transmission on the internet (e.g., when communicating by e-mail)
          may have security gaps. Complete protection of data against access by third parties is not
          possible.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Information on the Responsible Party</h3>
        <p className="mb-4">The responsible party for data processing on this website is:</p>
        <address className="my-4 not-italic">
          <strong>Patrick Arns</strong>
          <br />
          Ahrstr. 7
          <br />
          52511 Geilenkirchen
          <br />
          Email:{' '}
          <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello [at] park.fan" />
        </address>
        <p className="mb-4">
          The responsible party is the natural or legal person who alone or jointly with others
          decides on the purposes and means of processing personal data (e.g., names, e-mail
          addresses, etc.).
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Storage Period</h3>
        <p className="mb-4">
          Unless a more specific storage period has been specified in this privacy policy, your
          personal data will remain with us until the purpose for data processing no longer applies.
          If you assert a legitimate request for deletion or revoke consent to data processing, your
          data will be deleted, unless we have other legally permissible reasons for storing your
          personal data (e.g., tax or commercial law retention periods); in the latter case,
          deletion will take place after these reasons no longer apply.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          General Information on the Legal Basis for Data Processing on This Website
        </h3>
        <p className="mb-4">
          If you have consented to data processing, we process your personal data on the basis of
          Art. 6 para. 1 lit. a GDPR or Art. 9 para. 2 lit. a GDPR, if special data categories
          according to Art. 9 para. 1 GDPR are processed. In the case of explicit consent to the
          transfer of personal data to third countries, data processing is also carried out on the
          basis of Art. 49 para. 1 lit. a GDPR. If you have consented to the storage of cookies or
          access to information on your device (e.g., via device fingerprinting), data processing is
          additionally carried out on the basis of § 25 para. 1 TTDSG. Consent can be revoked at any
          time. If your data is required for contract fulfillment or to carry out pre-contractual
          measures, we process your data on the basis of Art. 6 para. 1 lit. b GDPR. Furthermore, we
          process your data if this is necessary to fulfill a legal obligation on the basis of Art.
          6 para. 1 lit. c GDPR. Data processing may also be carried out on the basis of our
          legitimate interest according to Art. 6 para. 1 lit. f GDPR. Information on the relevant
          legal basis in each individual case is provided in the following paragraphs of this
          privacy policy.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Recipients of Personal Data</h3>
        <p className="mb-4">
          In the course of our business activities, we work together with various external parties.
          In doing so, it is sometimes necessary to transmit personal data to these external
          parties. We only pass on personal data to external parties if this is necessary for the
          fulfillment of a contract, if we are legally obliged to do so (e.g., passing on data to
          tax authorities), if we have a legitimate interest according to Art. 6 para. 1 lit. f GDPR
          in passing it on or if another legal basis permits the data transfer. When using data
          processors, we only pass on personal data of our customers on the basis of a valid data
          processing agreement. In the case of joint processing, a joint processing agreement is
          concluded.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Revocation of Your Consent to Data Processing
        </h3>
        <p className="mb-4">
          Many data processing operations are only possible with your express consent. You can
          revoke consent you have already given at any time. The lawfulness of the data processing
          carried out until the revocation remains unaffected by the revocation.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Right to Object to Data Collection in Special Cases and to Direct Advertising (Art. 21
          GDPR)
        </h3>
        <p className="mb-4">
          <strong>
            IF DATA PROCESSING IS CARRIED OUT ON THE BASIS OF ART. 6 PARA. 1 LIT. E OR F GDPR, YOU
            HAVE THE RIGHT AT ANY TIME TO OBJECT TO THE PROCESSING OF YOUR PERSONAL DATA FOR REASONS
            ARISING FROM YOUR PARTICULAR SITUATION; THIS ALSO APPLIES TO PROFILING BASED ON THESE
            PROVISIONS. THE RESPECTIVE LEGAL BASIS ON WHICH PROCESSING IS BASED CAN BE FOUND IN THIS
            PRIVACY POLICY. IF YOU OBJECT, WE WILL NO LONGER PROCESS YOUR AFFECTED PERSONAL DATA
            UNLESS WE CAN DEMONSTRATE COMPELLING LEGITIMATE GROUNDS FOR PROCESSING THAT OVERRIDE
            YOUR INTERESTS, RIGHTS, AND FREEDOMS OR THE PROCESSING SERVES THE ASSERTION, EXERCISE,
            OR DEFENSE OF LEGAL CLAIMS (OBJECTION PURSUANT TO ART. 21 PARA. 1 GDPR).
          </strong>
        </p>
        <p className="mb-4">
          <strong>
            IF YOUR PERSONAL DATA IS PROCESSED FOR THE PURPOSE OF DIRECT ADVERTISING, YOU HAVE THE
            RIGHT TO OBJECT AT ANY TIME TO THE PROCESSING OF PERSONAL DATA CONCERNING YOU FOR THE
            PURPOSE OF SUCH ADVERTISING; THIS ALSO APPLIES TO PROFILING TO THE EXTENT THAT IT IS
            CONNECTED WITH SUCH DIRECT ADVERTISING. IF YOU OBJECT, YOUR PERSONAL DATA WILL
            SUBSEQUENTLY NO LONGER BE USED FOR THE PURPOSE OF DIRECT ADVERTISING (OBJECTION PURSUANT
            TO ART. 21 PARA. 2 GDPR).
          </strong>
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">
          Right to Lodge a Complaint with the Competent Supervisory Authority
        </h3>
        <p className="mb-4">
          In the event of violations of the GDPR, data subjects have the right to lodge a complaint
          with a supervisory authority, in particular in the member state of their habitual
          residence, their place of work or the place of the alleged violation. The right to lodge a
          complaint exists without prejudice to other administrative or judicial remedies.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Right to Data Portability</h3>
        <p className="mb-4">
          You have the right to have data that we process automatically on the basis of your consent
          or in fulfillment of a contract handed over to you or to a third party in a common,
          machine-readable format. If you request the direct transfer of the data to another
          responsible party, this will only be done to the extent technically feasible.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Information, Correction, and Deletion</h3>
        <p className="mb-4">
          Within the framework of the applicable legal provisions, you have the right at any time to
          free information about your stored personal data, its origin and recipient, and the
          purpose of data processing and, if applicable, a right to correction or deletion of this
          data. For this purpose and for further questions on the subject of personal data, you can
          contact us at any time.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Right to Restriction of Processing</h3>
        <p className="mb-4">
          You have the right to request the restriction of the processing of your personal data. You
          can contact us at any time for this purpose. The right to restriction of processing exists
          in the following cases:
        </p>
        <ul>
          <li>
            If you dispute the accuracy of your personal data stored by us, we usually need time to
            verify this. For the duration of the review, you have the right to request the
            restriction of the processing of your personal data.
          </li>
          <li>
            If the processing of your personal data was/is unlawful, you can request the restriction
            of data processing instead of deletion.
          </li>
          <li>
            If we no longer need your personal data, but you need it to exercise, defend, or assert
            legal claims, you have the right to request the restriction of the processing of your
            personal data instead of deletion.
          </li>
          <li>
            If you have lodged an objection pursuant to Art. 21 para. 1 GDPR, a balancing of your
            and our interests must be carried out. As long as it has not been determined whose
            interests prevail, you have the right to request the restriction of the processing of
            your personal data.
          </li>
        </ul>
        <p className="mb-4">
          If you have restricted the processing of your personal data, this data may – apart from
          its storage – only be processed with your consent or for the assertion, exercise, or
          defense of legal claims or for the protection of the rights of another natural or legal
          person or for reasons of an important public interest of the European Union or a member
          state.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">SSL or TLS Encryption</h3>
        <p className="mb-4">
          This site uses SSL or TLS encryption for security reasons and to protect the transmission
          of confidential content, such as orders or inquiries that you send to us as the site
          operator. You can recognize an encrypted connection by the fact that the address line of
          the browser changes from "http://" to "https://" and by the lock symbol in your browser
          line.
        </p>
        <p className="mb-4">
          If SSL or TLS encryption is activated, the data you transmit to us cannot be read by third
          parties.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          4. Data Collection on This Website
        </h2>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Cookies</h3>
        <p className="mb-4">
          Our internet pages use so-called "cookies". Cookies are small data packages and do not
          cause any damage to your device. They are stored either temporarily for the duration of a
          session (session cookies) or permanently (permanent cookies) on your device. Session
          cookies are automatically deleted after your visit ends. Permanent cookies remain stored
          on your device until you delete them yourself or an automatic deletion is carried out by
          your web browser.
        </p>
        <p className="mb-4">
          Cookies can originate from us (first-party cookies) or from third-party companies
          (so-called third-party cookies). Third-party cookies enable the integration of certain
          services from third-party companies within websites (e.g., cookies for processing payment
          services).
        </p>
        <p className="mb-4">
          Cookies have various functions. Numerous cookies are technically necessary, as certain
          website functions would not work without them (e.g., the shopping cart function or the
          display of videos). Other cookies can be used to evaluate user behavior or for advertising
          purposes.
        </p>
        <p className="mb-4">
          Cookies that are required to carry out the electronic communication process, to provide
          certain functions you have requested (e.g., for the shopping cart function) or to optimize
          the website (e.g., cookies for measuring web audiences) are stored on the basis of Art. 6
          para. 1 lit. f GDPR, unless another legal basis is specified. The website operator has a
          legitimate interest in storing necessary cookies for the technically error-free and
          optimized provision of its services. If consent to the storage of cookies and comparable
          recognition technologies has been requested, processing is carried out exclusively on the
          basis of this consent (Art. 6 para. 1 lit. a GDPR and § 25 para. 1 TTDSG); consent can be
          revoked at any time.
        </p>
        <p className="mb-4">
          You can set your browser so that you are informed about the setting of cookies and only
          allow cookies in individual cases, exclude the acceptance of cookies for certain cases or
          in general, and activate the automatic deletion of cookies when closing the browser. When
          cookies are deactivated, the functionality of this website may be limited.
        </p>
        <p className="mb-4">
          Which cookies and services are used on this website can be found in this privacy policy.
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
          This data is collected on the basis of Art. 6 para. 1 lit. f GDPR. The website operator
          has a legitimate interest in the technically error-free presentation and optimization of
          its website – for this purpose, the server log files must be collected.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Location and "Parks Nearby"</h3>
        <p className="mb-4">
          To show you theme parks near you, we determine your approximate location. If you
          explicitly allow location access in your browser, we use your device's precise GPS
          coordinates. If you do not grant access, your approximate location is derived from your IP
          address (GeoIP). The coordinates or the IP-based approximation are transmitted exclusively
          to our own interface (api.park.fan) in order to calculate the nearest parks. This location
          data is not permanently stored on our servers and is not shared with third parties.
        </p>
        <p className="mb-4">
          The legal basis for processing precise location data is your consent (Art. 6 para. 1 lit.
          a GDPR), which you can revoke at any time via your browser's location settings. The
          IP-based approximation and the provision of the feature are based on our legitimate
          interest in a useful offering (Art. 6 para. 1 lit. f GDPR).
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Local Storage</h3>
        <p className="mb-4">
          For technically necessary functions and functions you have requested, we store data in
          your browser's local storage – for example, to remember your settings and your location
          opt-in, or to cache retrieved results so repeated requests are avoided. This is
          exclusively first-party data without tracking; it remains on your device and is not
          transmitted to us or to third parties. You can delete this data at any time via your
          browser settings. Because access to this storage is strictly necessary to provide the
          functions you have requested, no consent is required for it (§ 25 para. 2 no. 2 TTDSG);
          processing is based on Art. 6 para. 1 lit. f GDPR.
        </p>

        <h2 className="border-border mt-12 mb-6 border-b pb-3 text-3xl font-bold">
          5. Plugins and Tools
        </h2>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">OpenStreetMap</h3>
        <p className="mb-4">We use the map service of OpenStreetMap (OSM).</p>
        <p className="mb-4">
          We integrate the map material from OpenStreetMap on the server of the OpenStreetMap
          Foundation, St John's Innovation Centre, Cowley Road, Cambridge, CB4 0WS, United Kingdom.
          The United Kingdom is considered a data protection-safe third country. This means that the
          United Kingdom has a data protection level that corresponds to the data protection level
          in the European Union. When using OpenStreetMap maps, a connection is established to the
          servers of the OpenStreetMap Foundation. In doing so, your IP address and other
          information about your behavior on this website may be forwarded to the OSMF.
          OpenStreetMap may store cookies in your browser for this purpose or use comparable
          recognition technologies.
        </p>
        <p className="mb-4">
          The use of OpenStreetMap is in the interest of an appealing presentation of our online
          offerings and easy findability of the locations we have indicated on the website. This
          constitutes a legitimate interest within the meaning of Art. 6 para. 1 lit. f GDPR. If a
          corresponding consent has been requested, processing is carried out exclusively on the
          basis of Art. 6 para. 1 lit. a GDPR and § 25 para. 1 TTDSG, insofar as the consent
          includes the storage of cookies or access to information on the user's device (e.g.,
          device fingerprinting) within the meaning of the TTDSG. Consent can be revoked at any
          time.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Umami Analytics</h3>
        <p className="mb-4">
          We use the web analytics service Umami to analyze the use of our website and regularly
          improve it. The statistics we obtain enable us to improve our offering and make it more
          interesting for you as a user.
        </p>
        <p className="mb-4">
          Umami is a privacy-friendly web analytics service that works without cookies and
          completely anonymizes all collected data. No personal data is stored or processed that
          would enable the identification of individual users. The collected data includes only
          technical information such as browser type, operating system, pages visited, and referral
          source, but IP addresses are not stored.
        </p>
        <p className="mb-4">
          The service is hosted in a data center within the European Union, so your data does not
          leave the EU. No data is shared with third parties.
        </p>
        <p className="mb-4">
          The legal basis for the use of Umami is Art. 6 para. 1 lit. f GDPR. Our legitimate
          interest lies in the optimization and economical operation of our website. Since Umami
          works without cookies and does not collect personal data, no consent pursuant to TTDSG is
          required.
        </p>

        <h3 className="mt-8 mb-4 text-2xl font-semibold">Userback (Feedback Tool)</h3>
        <p className="mb-4">
          We use the feedback tool Userback, provided by Userback Pty Ltd, Level 5, 100 Edward
          Street, Brisbane QLD 4000, Australia. Userback lets you send us feedback, bug reports, and
          improvement suggestions via a &ldquo;Feedback&rdquo; button.
        </p>
        <p className="mb-4">
          Userback is loaded solely upon your active request: the relevant program code is only
          fetched from the provider&rsquo;s servers and executed once you click the
          &ldquo;Feedback&rdquo; button. Before that click, no connection to Userback is established
          and no data is transmitted to the provider.
        </p>
        <p className="mb-4">
          When you click the button, Userback processes technical data such as your IP address, an
          approximate location derived from it, browser and device information, screen resolution,
          the page visited (URL), and the time of access. If you voluntarily provide them in the
          feedback form, your name, email address, message, and any screenshot you create are also
          processed. To recognize you on subsequent use, Userback stores configuration and reporter
          data in your browser&rsquo;s local storage.
        </p>
        <p className="mb-4">
          In doing so, personal data may be transferred to third countries outside the EU or EEA
          (including the USA and Australia), where the level of data protection is not comparable to
          that of the EU.
        </p>
        <p className="mb-4">
          The legal basis for the processing as well as for the storage of and access to information
          on your device (local storage) is your consent pursuant to Art. 6 para. 1 lit. a GDPR and
          Section 25 para. 1 TTDSG, which you grant by actively clicking the &ldquo;Feedback&rdquo;
          button. You are not obliged to use Userback; if you do not click the button, the tool is
          not loaded. You can withdraw your consent at any time with effect for the future by no
          longer using the tool and clearing your browser&rsquo;s local storage. For more
          information, please see the provider&rsquo;s privacy policy at{' '}
          <a
            href="https://userback.io/privacy/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:text-primary/80 underline"
          >
            https://userback.io/privacy/
          </a>
          .
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

        <AnalyticsOptOut />
      </div>
    </>
  );
}
