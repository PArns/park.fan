/* eslint-disable react/no-unescaped-entities */
import { Link } from '@/i18n/navigation';
import { ObfuscatedEmail } from '@/components/common/obfuscated-email';
import { LegalH2, LegalH3, LegalList } from '@/components/legal/legal-blocks';

/** The app's support page in English, shown on every locale except `de`. */
export function AppSupportEN({ howtoPath }: { howtoPath: string }) {
  return (
    <>
      <h1 className="mb-8 text-4xl font-bold">park.fan for iPhone</h1>

      <div className="space-y-4 text-base leading-7">
        <p>
          The app shows you live theme park wait times and a crowd calendar with forecasts, and
          plans your park day with you. In the park the compass walks you to the attractions, and
          your park day is on the Lock Screen. It is free, needs no account and shows no ads.
        </p>

        <LegalH2>What you need</LegalH2>
        <LegalList>
          <li>an iPhone with iOS 26 or later, iPhone Duo included</li>
          <li>
            an internet connection for the live data; what was loaded last stays visible offline
          </li>
          <li>the app speaks English, German, Dutch, French, Spanish and Italian</li>
        </LegalList>

        <LegalH2>Common questions</LegalH2>

        <LegalH3>Why don't I see the compass?</LegalH3>
        <p>
          The compass, "Take me there" and the park day on the Lock Screen appear when you are in an
          open park and have allowed the app to use your location. Check this in your iPhone's
          settings under Privacy &amp; Security → Location Services → park.fan.
        </p>

        <LegalH3>Why don't notifications arrive?</LegalH3>
        <p>
          Check in your iPhone's settings under Notifications → park.fan that they are allowed, and
          in the app under Settings → Notifications which kinds are on. A wait alert only fires once
          the ride's wait drops below your value.
        </p>

        <LegalH3>How accurate are the wait times?</LegalH3>
        <p>
          Live waits are the ones the parks post. Forecasts and the calendar are estimates built
          from measured waits and can be off. Where the figures come from is explained in{' '}
          <Link href={howtoPath as '/'}>How park.fan works</Link>.
        </p>

        <LegalH3>How do I delete my data?</LegalH3>
        <p>
          Favorites and plans live on your iPhone and go with the app. What the app sends, how long
          it is kept and how to delete it is in the{' '}
          <Link href={'/datenschutz#app' as '/datenschutz'}>privacy policy</Link>.
        </p>

        <LegalH2>Help and contact</LegalH2>
        <p>
          For questions, bugs or wishes, write to{' '}
          <ObfuscatedEmail local="hello" domain="park.fan" displayText="hello[at]park.fan" />. Our
          address and phone number are in the <Link href="/impressum">imprint</Link>.
        </p>
        <p>
          park.fan is independent and not affiliated with the parks or their operators. Names and
          marks belong to their owners.
        </p>
      </div>
    </>
  );
}
