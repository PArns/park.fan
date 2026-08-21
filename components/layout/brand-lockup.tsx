import Image from 'next/image';

/**
 * The park.fan lockup — pin + wordmark — at ONE size, in ONE place.
 *
 * Why it is a component rather than eight `<Image>` tags typed out twice: the header renders the
 * lockup TWICE on a hero page (parked in the corner while the bar is transparent, in the flex flow
 * once it solidifies) and cross-fades the pair while sliding them onto each other. That only reads
 * as one object moving if the two copies are congruent — and they were not. The bar carried
 * `h-7 md:h-9` + `h-5 md:h-6` + `gap-0.5`, the corner `h-6` + `h-5` + `gap-1`, so the handoff
 * measured `logoScale = 24/36 = 0.667` and animated a 1.5× scale on top of the slide. Measured at
 * 1440: at the top the corner lockup was 98.1 px wide and the bar copy 82.7 px; solid, 147.2 px
 * against 122.2 px — the wordmark alone differed by 6 px. Two differently-proportioned lockups
 * sliding through each other, blurred by the scale, for 500 ms.
 *
 * With one component the scale factor is 1.000 by construction and the handoff is a pure
 * translate. The measuring code in the header stays (it is a safety net, not a workaround), it
 * just has nothing left to correct.
 *
 * Size: the pin is 24 px, the wordmark 20 px — the hero corner's size, which is 50 % of the 48 px
 * bar. `logo-small.svg` is a 144×144 square with the pin drawn inside it filling 86 % of the box
 * height and 62.5 % of its width, so 24 px of box is ~20.7 px of visible ink with ~4.5 px of empty
 * space on each side; `gap-1` on top of that reads as a ~10.7 px optical gap. Change the numbers
 * here and both copies move together — that is the whole point.
 */
export function BrandLockup({
  /** Force the light-ink artwork regardless of theme — for a lockup over a permanently dark hero. */
  forceLight = false,
}: {
  forceLight?: boolean;
}) {
  const pin = 'h-6 w-auto';
  const word = 'h-5 w-auto';
  return (
    <>
      <Image
        src="/logo-small-dark.svg"
        width={26}
        height={30}
        alt=""
        aria-hidden="true"
        className={forceLight ? pin : `hidden ${pin} dark:block`}
        loading="eager"
      />
      {!forceLight && (
        <Image
          src="/logo-small.svg"
          width={26}
          height={30}
          alt=""
          aria-hidden="true"
          className={`block ${pin} dark:hidden`}
          loading="eager"
        />
      )}
      <Image
        src="/parkfan-dark.svg"
        width={84}
        height={24}
        alt=""
        aria-hidden="true"
        className={forceLight ? word : `hidden ${word} dark:block`}
        loading="eager"
      />
      {!forceLight && (
        <Image
          src="/parkfan.svg"
          width={84}
          height={24}
          alt=""
          aria-hidden="true"
          className={`block ${word} dark:hidden`}
          loading="eager"
        />
      )}
    </>
  );
}
