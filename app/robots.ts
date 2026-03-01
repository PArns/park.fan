import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://park.fan';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
      '/api/',
      '/_next/',
      '/parks/', // always redirects to /{locale}/parks/ — no crawl budget needed
    ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
