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
      ],
    },
    sitemap: [
      `${baseUrl}/sitemap/0.xml`,
      `${baseUrl}/sitemap/1.xml`,
      `${baseUrl}/sitemap/2.xml`,
    ],
  };
}
