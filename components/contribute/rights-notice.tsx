import { getTranslations } from 'next-intl/server';
import { Copyright, ScanEye, ShieldCheck, Undo2, UserCheck } from 'lucide-react';

/**
 * Plain-language explainer of what happens to uploaded photos and the rights the
 * user grants. Rendered above the form so people read it BEFORE uploading.
 *
 * Legal note (reflected in the copy): under German/EU law the copyright itself
 * (Urheberrecht) cannot be transferred — only a usage licence (Nutzungsrecht) can
 * be granted. So we ask for a broad licence, not an assignment, and the user keeps
 * their copyright. Server component → no client JS.
 */
export async function RightsNotice() {
  const t = await getTranslations('contribute.rights');

  const points = [
    { icon: Copyright, text: t('ownership') },
    { icon: ShieldCheck, text: t('license') },
    { icon: ScanEye, text: t('moderation') },
    { icon: UserCheck, text: t('ownContent') },
    { icon: Undo2, text: t('withdraw') },
  ];

  return (
    <section className="border-primary/15 bg-primary/[3%] mb-8 rounded-xl border p-5 sm:p-6">
      <h2 className="mb-1 text-base font-semibold">{t('title')}</h2>
      <p className="text-muted-foreground mb-4 text-sm">{t('intro')}</p>
      <ul className="space-y-3">
        {points.map(({ icon: Icon, text }, i) => (
          <li key={i} className="flex gap-3 text-sm">
            <Icon className="text-primary mt-0.5 size-4 shrink-0" />
            <span className="text-muted-foreground">{text}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
