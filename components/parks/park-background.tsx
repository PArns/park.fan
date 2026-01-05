import Image from 'next/image';

interface ParkBackgroundProps {
  imageSrc: string | null;
  alt: string;
}

export function ParkBackground({ imageSrc, alt }: ParkBackgroundProps) {
  if (!imageSrc) return null;

  return (
    <div className="pointer-events-none absolute top-16 right-0 left-0 -z-10 h-[60vh] max-h-[600px] overflow-hidden select-none">
      <div className="relative h-full w-full">
        <Image
          src={imageSrc}
          alt={alt}
          fill
          priority
          quality={75}
          className="object-cover"
          sizes="100vw"
          fetchPriority="high"
        />
        {/* Gradient overlay to fade into the background color */}
        <div className="via-background/20 to-background absolute inset-0 bg-gradient-to-b from-transparent" />
        <div className="via-background/60 to-background absolute inset-0 translate-y-1/3 bg-gradient-to-b from-transparent" />
      </div>
    </div>
  );
}
