import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Sparkles } from 'lucide-react';

/**
 * Decorative "get inspired" gallery shown on the contribution page. Uses real
 * park/ride photos already shipped under public/images (so they're locally
 * optimised — no remote image config needed) to illustrate the kind of shots and
 * the parks/rides people can contribute to. Server component → no client JS.
 */

interface Example {
  src: string;
  ride: string;
  park: string;
}

// Curated, iconic rides — files exist under public/images/parks/*.
const EXAMPLES: Example[] = [
  {
    src: '/images/parks/phantasialand/black-mamba.jpg',
    ride: 'Black Mamba',
    park: 'Phantasialand',
  },
  {
    src: '/images/parks/europa-park/voltron-nevera-powered-by-rimac.jpg',
    ride: 'Voltron Nevera',
    park: 'Europa-Park',
  },
  { src: '/images/parks/efteling/baron-1898.jpg', ride: 'Baron 1898', park: 'Efteling' },
  { src: '/images/parks/walibi-holland/goliath.jpg', ride: 'Goliath', park: 'Walibi Holland' },
  { src: '/images/parks/phantasialand/fly.jpg', ride: 'F.L.Y.', park: 'Phantasialand' },
  {
    src: '/images/parks/europa-park/blue-fire-megacoaster.jpg',
    ride: 'blue fire Megacoaster',
    park: 'Europa-Park',
  },
  { src: '/images/parks/attractiepark-toverland/troy.jpg', ride: 'Troy', park: 'Toverland' },
  { src: '/images/parks/walibi-belgium/kondaa.jpg', ride: 'Kondaa', park: 'Walibi Belgium' },
];

export async function ExampleGallery() {
  const t = await getTranslations('contribute.gallery');

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="bg-primary/15 text-primary flex size-8 items-center justify-center rounded-lg">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {EXAMPLES.map((ex) => (
          <figure
            key={ex.src}
            className="group relative aspect-[4/5] overflow-hidden rounded-xl border shadow-sm"
          >
            <Image
              src={ex.src}
              alt={`${ex.ride} — ${ex.park}`}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* gradient + caption */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <figcaption className="absolute inset-x-0 bottom-0 p-2.5 text-white">
              <div className="truncate text-sm font-semibold drop-shadow">{ex.ride}</div>
              <div className="truncate text-xs text-white/80 drop-shadow">{ex.park}</div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
