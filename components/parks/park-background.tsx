import Image from 'next/image';

// Brand-matched blur placeholder — same as hero-background.tsx
const PARK_BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMCcgaGVpZ2h0PSc3Jz48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9J2cnIHgxPScwJyB5MT0nMCcgeDI9JzAnIHkyPScxJz48c3RvcCBvZmZzZXQ9JzAlJyBzdG9wLWNvbG9yPScjMWEzZjZmJy8+PHN0b3Agb2Zmc2V0PSc0MCUnIHN0b3AtY29sb3I9JyMxZTVmNzgnLz48c3RvcCBvZmZzZXQ9Jzc1JScgc3RvcC1jb2xvcj0nIzFlNWEzYScvPjxzdG9wIG9mZnNldD0nMTAwJScgc3RvcC1jb2xvcj0nIzBmMWUwZicvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPScxMCcgaGVpZ2h0PSc3JyBmaWxsPSd1cmwoI2cpJy8+PC9zdmc+';

interface ParkBackgroundProps {
  imageSrc: string | null;
  alt: string;
}

export function ParkBackground({ imageSrc, alt }: ParkBackgroundProps) {
  if (!imageSrc) return null;

  return (
    <div className="pointer-events-none absolute top-0 right-0 left-0 -z-10 h-[calc(75vh+4rem)] max-h-[850px] overflow-hidden select-none">
      <div className="relative h-full w-full">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority
          quality={85}
          placeholder="blur"
          blurDataURL={PARK_BLUR_DATA_URL}
          className="object-cover"
          sizes="100vw"
          fetchPriority="high"
        />
        {/* Gradient overlay to fade into the background color */}
        <div className="via-background/20 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        <div className="via-background/60 to-background absolute inset-0 translate-y-1/2 bg-gradient-to-b from-transparent" />
      </div>
    </div>
  );
}
