import Image from 'next/image';

/**
 * The park.fan lockup, pin and wordmark, at one size in one place. The header renders it twice on a
 * hero page and slides the pair onto each other, which only reads as one object moving if the two
 * copies are congruent; one component makes the handoff a pure translate. The artwork's viewBox is
 * its measured ink box, so a height here is what a reader sees: pin 26 px, wordmark 19 px, and the
 * spacing lives only in `gap-2`. See
 * docs/rules/the-header-is-48-px-and-its-height-is-written-down-in-four.md.
 */
/**
 * The lockup's pin, with its light and dark artwork, at whatever height the caller's class sets.
 *
 * `width`/`height` are the artwork's own ink box (90.03 × 124.21, rounded), not a rendered size:
 * they only tell the browser what to reserve before the file arrives, and `w-auto` takes the real
 * ratio from the file at any height.
 */
function BrandPin({
  /** The height, as a class — e.g. `h-[26px] w-auto`. */
  className,
  /** Force the light-ink artwork regardless of theme. */
  forceLight = false,
}: {
  className: string;
  forceLight?: boolean;
}) {
  return (
    <>
      <Image
        src="/logo-small-dark.svg"
        width={90}
        height={124}
        alt=""
        aria-hidden="true"
        className={forceLight ? className : `hidden ${className} dark:block`}
        loading="eager"
      />
      {!forceLight && (
        <Image
          src="/logo-small.svg"
          width={90}
          height={124}
          alt=""
          aria-hidden="true"
          className={`block ${className} dark:hidden`}
          loading="eager"
        />
      )}
    </>
  );
}

/**
 * The park.fan lockup, pin and wordmark at the header's size (26 px and 19 px), with light and dark
 * artwork switched by theme or forced light. The header renders it twice and cross-fades the pair.
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
      <BrandPin className={pin} forceLight={forceLight} />
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
