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
 * **A height is the mark's height, not a box it sits somewhere inside.** The four artwork files
 * used to be exports with the artboard's margin baked in: `logo-small.svg` drew its pin at 62.5 %
 * of the width and 86.3 % of the height of a 144×144 viewBox, `parkfan.svg` its wordmark at 78.1 %
 * of the height of a 2304×657 one. So `h-6` painted a 20.7 px pin and `h-5` a 15.6 px wordmark —
 * a mark filling 43 % of a 48 px bar while every number here said 50 %, and about a fifth of the
 * device pixels the layout had already paid for going to nothing. On a 1× display that is the
 * whole difference between a mark and a smudge. The viewBox of all four files is the measured ink
 * box now (`fill=100 %`, offset 0), so a height here is what a reader sees:
 *
 * - pin **26 px** (55 % of the bar), aspect 0.7248 → 18.8 px wide
 * - wordmark **19 px**, aspect 4.2080 → 80.0 px wide
 *
 * The ratio between the two (1.37) is the one the old files rendered (20.7 : 15.6 = 1.32), so the
 * lockup keeps its proportions and only stops being small.
 *
 * The gap moved with it. It used to be `gap-1` plus the ~4.5 px of empty artwork the pin brought
 * along on its right — an optical ~8.5 px that no call site could see, and that changed with the
 * pin's height. It is `gap-2` in the header now, and it is the only place the spacing lives.
 */
export function BrandLockup({
  /** Force the light-ink artwork regardless of theme — for a lockup over a permanently dark hero. */
  forceLight = false,
}: {
  forceLight?: boolean;
}) {
  const pin = 'h-[26px] w-auto';
  const word = 'h-[19px] w-auto';
  return (
    <>
      <Image
        src="/logo-small-dark.svg"
        width={19}
        height={26}
        alt=""
        aria-hidden="true"
        className={forceLight ? pin : `hidden ${pin} dark:block`}
        loading="eager"
      />
      {!forceLight && (
        <Image
          src="/logo-small.svg"
          width={19}
          height={26}
          alt=""
          aria-hidden="true"
          className={`block ${pin} dark:hidden`}
          loading="eager"
        />
      )}
      <Image
        src="/parkfan-dark.svg"
        width={80}
        height={19}
        alt=""
        aria-hidden="true"
        className={forceLight ? word : `hidden ${word} dark:block`}
        loading="eager"
      />
      {!forceLight && (
        <Image
          src="/parkfan.svg"
          width={80}
          height={19}
          alt=""
          aria-hidden="true"
          className={`block ${word} dark:hidden`}
          loading="eager"
        />
      )}
    </>
  );
}
