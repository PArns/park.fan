/** `next/image` as a plain image, for the fixture, which has no image optimiser behind it. */
export default function Image({
  src,
  alt,
  width,
  height,
  style,
  className,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    // The fixture has no optimiser to hand the photo to; the app's own `Image` is what it replaces.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} style={style} className={className} />
  );
}
