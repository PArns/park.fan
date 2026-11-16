import type { Metadata } from 'next';
import { KeywordsView } from '../_components/keywords-view';

export const metadata: Metadata = {
  title: 'Keywords — park.fan',
  robots: { index: false, follow: false },
};

/**
 * The weekly keyword report: the last complete week against the one before, for the queries with
 * the most impressions, from the Search Console data the API stores.
 */
export default function KeywordsPage() {
  return <KeywordsView />;
}
