import { NextResponse } from 'next/server';

export const revalidate = 86400; // 24h

export async function GET() {
  const baseUrl = 'https://park.fan';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap/0.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/1.xml</loc>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/sitemap/2.xml</loc>
  </sitemap>
</sitemapindex>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
