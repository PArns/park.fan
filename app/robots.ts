import { MetadataRoute } from 'next';
import { SITE_URL } from '@/i18n/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      // /api/og/ serves the Open Graph images referenced in every page's
      // metadata — it must stay crawlable (longest-match wins over /api/).
      // /_next/ is deliberately NOT disallowed: Google renders pages with a
      // headless browser and needs the JS/CSS bundles and optimized images.
      allow: ['/', '/api/og/'],
      disallow: ['/api/'],
    },
    sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/sitemap-attractions.xml`],
  };
}
