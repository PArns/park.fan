import type { Metadata } from 'next';
import { getInitialEditorData } from './_lib/initial-data';
import { BlogEditorClient } from './editor-client';

export const metadata: Metadata = {
  title: 'Blog editor — park.fan',
  robots: { index: false, follow: false },
};

export default function BlogEditorPage() {
  const data = getInitialEditorData();
  return <BlogEditorClient initialData={data} />;
}
