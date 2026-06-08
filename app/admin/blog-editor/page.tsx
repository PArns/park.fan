import type { Metadata } from 'next';
import { Suspense } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '@/messages/en.json';
import { getInitialEditorData } from './_lib/initial-data';
import { BlogEditorClient } from './editor-client';

export const metadata: Metadata = {
  title: 'Blog editor — park.fan',
  robots: { index: false, follow: false },
};

/**
 * Trim the full English message bundle to the slices the editor's reused
 * components actually need (ParkStatusBadge, CrowdLevelBadge). Keeps the
 * client payload tiny — the rest of the admin is intentionally untranslated.
 */
const adminMessages = {
  parks: {
    status: enMessages.parks?.status ?? {},
    crowdLevels: enMessages.parks?.crowdLevels ?? {},
  },
  common: {
    min: enMessages.common?.min ?? 'min',
  },
};

export default function BlogEditorPage() {
  const data = getInitialEditorData();
  return (
    <Suspense fallback={null}>
      <NextIntlClientProvider locale="en" messages={adminMessages} timeZone="UTC">
        <BlogEditorClient initialData={data} />
      </NextIntlClientProvider>
    </Suspense>
  );
}
