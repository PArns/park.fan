import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'park.fan – Theme Park Wait Times',
    short_name: 'park.fan',
    description:
      'Live wait times, AI crowd predictions, and crowd calendars for 150+ theme parks worldwide.',
    start_url: '/',
    display: 'standalone',
    background_color: '#293B47',
    theme_color: '#2191D3',
    icons: [
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/logo-big.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
