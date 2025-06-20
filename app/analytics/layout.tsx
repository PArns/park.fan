import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics - Advanced Theme Park Insights',
  description:
    'Advanced analytics and insights for theme park data. Explore detailed statistics, trends, and patterns across global theme parks.',
  keywords: [
    'theme park analytics',
    'park insights',
    'visitor trends',
    'park performance',
    'data analysis',
  ],
  openGraph: {
    title: 'Park.Fan Analytics - Advanced Theme Park Insights',
    description:
      'Advanced analytics and insights for theme park data. Explore detailed statistics, trends, and patterns.',
  },
  twitter: {
    title: 'Park.Fan Analytics - Advanced Theme Park Insights',
    description:
      'Advanced analytics and insights for theme park data. Explore detailed statistics, trends, and patterns.',
  },
};

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
