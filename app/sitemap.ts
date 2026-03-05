import type { MetadataRoute } from 'next';
import { locales } from '@/i18n/config';

const BASE_URL = 'https://park.fan';

// 24h cache — home URLs never change, only deployment updates them
export const revalidate = 86400;

/**
 * Root sitemap — home page only.
 * Park, geo-structure, and attraction URLs live in dedicated sitemap files
 * to keep crawl budget allocation clear and allow independent revalidation.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes: MetadataRoute.Sitemap = [];

  // x-default root
  routes.push({
    url: BASE_URL,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 1,
  });

  // Locale home pages
  for (const locale of locales) {
    routes.push({
      url: `${BASE_URL}/${locale}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    });
  }

  return routes;
}
