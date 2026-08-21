import React from 'react';

export function FlagDE(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 3" aria-hidden="true" {...props}>
      <rect width="5" height="3" y="0" x="0" fill="#000" />
      <rect width="5" height="2" y="1" x="0" fill="#D00" />
      <rect width="5" height="1" y="2" x="0" fill="#FFCE00" />
    </svg>
  );
}

export function FlagGB(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30" aria-hidden="true" {...props}>
      <clipPath id="s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export function FlagNL(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 9 6" aria-hidden="true" {...props}>
      <rect width="9" height="6" fill="#FFF" />
      <rect width="9" height="2" fill="#21468B" y="4" />
      <rect width="9" height="2" fill="#AE1C28" y="0" />
    </svg>
  );
}

export function FlagFR(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" aria-hidden="true" {...props}>
      <rect width="3" height="2" fill="#ED2939" />
      <rect width="2" height="2" fill="#FFF" />
      <rect width="1" height="2" fill="#002395" />
    </svg>
  );
}

export function FlagES(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 750 500" aria-hidden="true" {...props}>
      <rect width="750" height="500" fill="#c60b1e" />
      <rect width="750" height="250" y="125" fill="#ffc400" />
    </svg>
  );
}

export function FlagHK(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#DE2910" />
      <path
        d="M414.2 308.8a127.3 127.3 0 0 1-28.5-7.5l29.4-45-42.3-25.7 13.9 51.9a127.2 127.2 0 0 1-22.1 19.3l-18-50.6-32.6 37.1 36.8 38.6a127.3 127.3 0 0 1 5.9 28.9l-53.7-2.6-3.8 49.3 50.8-17.6a127.3 127.3 0 0 1 23.3 17.8l-40.1 35.7 22.9 43.9 33.6-40.9a127.1 127.1 0 0 1 29 5.6l-10 52.8 48.3 11 1.7-53.7a127.1 127.1 0 0 1 18.7-23.7l29.7 44.8 39.4-36.4-47.5-25.2a127.3 127.3 0 0 1-8-28.4l52.7 11.3 19.7-45.8-53.2 7.7a127.4 127.4 0 0 1-13.8-25.9L557 325l-20.9-46.7-32 42.1a127.3 127.3 0 0 1-29.2-5.7l16.2-51.2-47.2-15-6.5 53.1a127 127 0 0 1-23.2 7.2ZM395.7 348c3.2-1.7 6.1.5 6.4 5 .4 4.5-2.2 9.5-6.1 10.9-3.9 1.5-7.4-.5-7.7-5-.3-4.5 3.9-9.1 7.4-10.9zm-46.8-5.7c3.2-1.6 6.1.5 6.5 5 .3 4.5-2.1 9.5-6 10.9-4 1.5-7.5-.5-7.8-5-.3-4.5 3.9-9.1 7.3-10.9zm-26.6 47c3.1-1.6 6.1.5 6.4 5 .4 4.5-2.1 9.5-6 10.9-4 1.5-7.5-.5-7.8-5-.3-4.5 3.8-9.1 7.4-10.9zm17.9 49.3c3.2-1.7 6.1.5 6.4 5 .4 4.5-2.2 9.4-6 10.8-4 1.5-7.5-.5-7.8-4.9-.3-4.5 3.8-9.1 7.4-10.9zm49.2 12.3c3.1-1.6 6 .5 6.4 5 .3 4.5-2.2 9.5-6.1 10.9-3.9 1.4-7.4-.6-7.7-5-.3-4.5 3.9-9.1 7.4-10.9zm45.5-35.3c3.3-1.6 5.3 1.8 4.4 6-.8 4.2-5.1 8-8.9 8.2-3.8.3-6.4-2.8-5.6-7 .8-4.3 6.6-5.6 10.1-7.2z"
        fill="#fff"
      />
    </svg>
  );
}

export function FlagUS(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7410 3900" aria-hidden="true" {...props}>
      <rect width="7410" height="3900" fill="#b22234" />
      <path
        d="M0,450H7410M0,1050H7410M0,1650H7410M0,2250H7410M0,2850H7410M0,3450H7410"
        stroke="#fff"
        strokeWidth="300"
      />
      <rect width="2964" height="2100" fill="#3c3b6e" />
      <g fill="#fff">
        <g id="s18">
          <g id="s9">
            <g id="s5">
              <g id="s4">
                <path
                  id="s"
                  d="M247,90 317.534230,307.082039 132.873218,172.917961H361.126782L176.465770,307.082039z"
                />
                <use href="#s" x="494" />
                <use href="#s" x="988" />
                <use href="#s" x="1482" />
                <use href="#s" x="1976" />
              </g>
              <use href="#s" x="2470" />
            </g>
            <use href="#s5" y="420" />
            <use href="#s4" y="840" />
            <use href="#s3" y="1260" />
          </g>
          <use href="#s9" y="840" />
        </g>
        <use href="#s18" x="247" y="210" />
      </g>
    </svg>
  );
}

export function FlagJP(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#fff" />
      <circle cx="450" cy="300" r="180" fill="#bc002d" />
    </svg>
  );
}

export function FlagCN(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#de2910" />
      <path
        d="M268.4 179.4l43.5 133.8H93l113.8 82.7L163.4 530l105-76.3 105 76.3-43.4-134.1L443.8 313.2H224.9l43.5-133.8zM415.8 111l4.7 34.6-26.7-23.1 35.1-4.2-27.1-22.5 30 18.2 29.5-19.1-8.5 34.1 27.5 22-34.6-5.8zm41.1 63.8l17.7 30.4-32.9-13.1 36.1 8-19.4-29.4 16.9 30.9 33.7-10.8-24.1 25.5 35.1 3.5-34.7 5zm-33.6 77.2l20.8 17.5 7.1-26.3 16.1 21.6 26.6-7.8-19.4 18.8 28.5 12.3-33-.7 19.8 27.2L465.9 292l-5.6 27.1zm-80.4 39.5l26.9 2.1-14.2-23.3 22 15.6 4.3-26.9 7.6 26.1 25.8-9-19.1 19.1 25.5 10.2-26.9-2.1 14.2 23.3z"
        fill="#ffde00"
      />
    </svg>
  );
}

export function FlagAT(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#ED2939" />
      <rect width="900" height="200" y="200" fill="#fff" />
    </svg>
  );
}

export function FlagBE(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2.6" aria-hidden="true" {...props}>
      <rect width="1" height="2.6" fill="#000" />
      <rect width="1" height="2.6" x="1" fill="#FDDA24" />
      <rect width="1" height="2.6" x="2" fill="#EF3340" />
    </svg>
  );
}

export function FlagDK(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 370 280" aria-hidden="true" {...props}>
      <rect width="370" height="280" fill="#C60C30" />
      <rect width="40" height="280" x="100" fill="#fff" />
      <rect width="370" height="40" y="120" fill="#fff" />
    </svg>
  );
}

export function FlagIT(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3 2" aria-hidden="true" {...props}>
      <rect width="1" height="2" fill="#009246" />
      <rect width="1" height="2" x="1" fill="#fff" />
      <rect width="1" height="2" x="2" fill="#CE2B37" />
    </svg>
  );
}

export function FlagPL(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 5" aria-hidden="true" {...props}>
      <rect width="8" height="2.5" fill="#fff" />
      <rect width="8" height="2.5" y="2.5" fill="#DC143C" />
    </svg>
  );
}

export function FlagSE(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 10" aria-hidden="true" {...props}>
      <rect width="16" height="10" fill="#006AA7" />
      <rect width="2" height="10" x="5" fill="#FECC00" />
      <rect width="16" height="2" y="4" fill="#FECC00" />
    </svg>
  );
}

export function FlagCA(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2 1" aria-hidden="true" {...props}>
      <rect width="2" height="1" fill="#d80621" />
      <rect width="1" height="1" x="0.5" fill="#fff" />
      <path
        d="M1.906 0.22l-0.123 0.165-0.123-0.165 0.047 0.283-0.207 0.165 0.254 0.046 0.029 0.287 0.123-0.223 0.123 0.223 0.029-0.287 0.254-0.046-0.207-0.165 0.047-0.283z"
        transform="matrix(0.4 0 0 0.4 0.6 0.25)"
        fill="#d80621"
      />
    </svg>
  );
}

export function FlagMX(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 7 4" aria-hidden="true" {...props}>
      <rect width="2.33" height="4" fill="#006847" />
      <rect width="2.34" height="4" x="2.33" fill="#fff" />
      <rect width="2.33" height="4" x="4.67" fill="#CE1126" />
      <circle cx="3.5" cy="2" r="0.7" fill="#8B4513" />
    </svg>
  );
}

export function FlagKR(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 48" aria-hidden="true" {...props}>
      <rect width="72" height="48" fill="#fff" />
      <g transform="translate(36, 24) rotate(-33.69)">
        <path d="M0 -12 A12 12 0 0 0 0 12 A12 12 0 0 0 0 -12" fill="#CD2E3A" />
        <path d="M0 -12 A12 12 0 0 1 0 12" fill="#0047A0" />
      </g>
      <g stroke="#000" strokeWidth="4" strokeLinecap="butt">
        <path d="M10 10 L22 4 M11 12 L23 6 M12 14 L24 8" />
        <path d="M50 44 L62 38 M49 42 L61 36 M48 40 L60 34" />
      </g>
    </svg>
  );
}

export function FlagAU(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 640" aria-hidden="true" {...props}>
      <rect width="1280" height="640" fill="#012169" />
      <path d="M0,0 h640 v320 h-640 z" fill="#012169" />
      <path d="M0 0 L640 320 M640 0 L0 320" stroke="#fff" strokeWidth="60" />
      <path d="M320 0 V320 M0 160 H640" stroke="#fff" strokeWidth="60" />
      <path d="M320 0 V320 M0 160 H640" stroke="#C8102E" strokeWidth="40" />
      <circle cx="320" cy="480" r="40" fill="#fff" />
      <circle cx="960" cy="160" r="40" fill="#fff" />
      <circle cx="1120" cy="300" r="40" fill="#fff" />
      <circle cx="1120" cy="90" r="40" fill="#fff" />
      <circle cx="960" cy="480" r="40" fill="#fff" />
      <circle cx="850" cy="380" r="25" fill="#fff" />
    </svg>
  );
}

export function FlagSA(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" aria-hidden="true" {...props}>
      <rect width="900" height="600" fill="#006C35" />
      {/* The shahada, as a band. The real flag carries a line of Arabic calligraphy above the
          sword; at the 16×12 box this renders into it is under 2 px tall, which is an indistinct
          white smudge whichever path you draw — so it is a band rather than a bad approximation of
          script. The sword below it is what makes the flag readable at this size. */}
      <rect width="470" height="52" x="215" y="200" rx="26" fill="#fff" />
      <rect width="150" height="30" x="215" y="285" rx="15" fill="#fff" />
      <rect width="230" height="30" x="420" y="285" rx="15" fill="#fff" />
      {/* Sword: blade pointing left, hilt and pommel on the right. */}
      <path d="M175 400 L250 375 L700 375 L700 425 L250 425 Z" fill="#fff" />
      <rect width="26" height="110" x="700" y="345" rx="13" fill="#fff" />
      <rect width="60" height="34" x="726" y="383" rx="17" fill="#fff" />
    </svg>
  );
}

export function FlagMY(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1400 700" aria-hidden="true" {...props}>
      {/* Fourteen stripes for the thirteen states and the federal territories, red first. */}
      <rect width="1400" height="700" fill="#fff" />
      {[0, 2, 4, 6, 8, 10, 12].map((i) => (
        <rect key={i} width="1400" height="50" y={i * 50} fill="#CC0001" />
      ))}
      {/* The canton covers the top eight stripes and half the width. */}
      <rect width="700" height="400" fill="#010066" />
      {/* Crescent: a yellow disc with a canton-coloured one bitten out of it. */}
      <circle cx="300" cy="200" r="112" fill="#FFCC00" />
      <circle cx="348" cy="200" r="96" fill="#010066" />
      <polygon
        points="490.0,75.0 501.6,149.3 544.2,87.4 522.4,159.3 587.7,122.1 536.9,177.4 611.9,172.2 542.0,200.0 611.9,227.8 536.9,222.6 587.7,277.9 522.4,240.7 544.2,312.6 501.6,250.7 490.0,325.0 478.4,250.7 435.8,312.6 457.6,240.7 392.3,277.9 443.1,222.6 368.1,227.8 438.0,200.0 368.1,172.2 443.1,177.4 392.3,122.1 457.6,159.3 435.8,87.4 478.4,149.3"
        fill="#FFCC00"
      />
    </svg>
  );
}

export function FlagSG(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 960" aria-hidden="true" {...props}>
      <rect width="1440" height="960" fill="#fff" />
      <rect width="1440" height="480" fill="#EF3340" />
      {/* Crescent: a white disc with a red one bitten out of it. */}
      <circle cx="330" cy="240" r="176" fill="#fff" />
      <circle cx="402" cy="240" r="150" fill="#EF3340" />
      <g fill="#fff">
        <polygon points="566.0,76.0 578.3,111.0 615.5,111.9 586.0,134.5 596.6,170.1 566.0,149.0 535.4,170.1 546.0,134.5 516.5,111.9 553.7,111.0" />
        <polygon points="672.5,153.4 684.9,188.4 722.0,189.3 692.5,211.9 703.1,247.5 672.5,226.4 642.0,247.5 652.5,211.9 623.1,189.3 660.2,188.4" />
        <polygon points="631.8,278.6 644.2,313.6 681.3,314.5 651.8,337.1 662.4,372.7 631.8,351.6 601.3,372.7 611.9,337.1 582.4,314.5 619.5,313.6" />
        <polygon points="500.2,278.6 512.5,313.6 549.6,314.5 520.1,337.1 530.7,372.7 500.2,351.6 469.6,372.7 480.2,337.1 450.7,314.5 487.8,313.6" />
        <polygon points="459.5,153.4 471.8,188.4 508.9,189.3 479.5,211.9 490.0,247.5 459.5,226.4 428.9,247.5 439.5,211.9 410.0,189.3 447.1,188.4" />
      </g>
    </svg>
  );
}

export function FlagBR(props: React.ComponentProps<'svg'>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 700" aria-hidden="true" {...props}>
      <rect width="1000" height="700" fill="#009c3b" />
      <path d="M100,350 L500,70 L900,350 L500,630 z" fill="#ffdf00" />
      <circle cx="500" cy="350" r="175" fill="#002776" />
      <path d="M350,350 A200,200 0 0,0 650,350" fill="none" stroke="#fff" strokeWidth="15" />
    </svg>
  );
}

/**
 * The 20 flags above, reachable by ISO country code — plus an answer for the three the set does
 * not cover.
 *
 * The header's parks menu renders one per country row, and the geo payload carries the code
 * (`country.code`), so a lookup is all it needs. Emoji flags would have been the shorter route and
 * are the reason this file exists at all: Windows ships no flag glyphs, so `🇩🇪` renders there as
 * the letters "DE" — which is exactly what `countryFlagEmoji` in `lib/utils/region-names.ts`
 * accepts for a holiday label and what a navigation menu should not.
 *
 * All 23 countries the parks menu lists have artwork. A code that does not resolve still falls back
 * to a neutral chip with its letters rather than a gap — add the SVG here and it disappears.
 */
const FLAG_BY_CODE: Record<string, React.ComponentType<React.ComponentProps<'svg'>>> = {
  DE: FlagDE,
  GB: FlagGB,
  NL: FlagNL,
  FR: FlagFR,
  ES: FlagES,
  HK: FlagHK,
  US: FlagUS,
  JP: FlagJP,
  CN: FlagCN,
  AT: FlagAT,
  BE: FlagBE,
  DK: FlagDK,
  IT: FlagIT,
  PL: FlagPL,
  SE: FlagSE,
  CA: FlagCA,
  MX: FlagMX,
  KR: FlagKR,
  AU: FlagAU,
  BR: FlagBR,
  SA: FlagSA,
  MY: FlagMY,
  SG: FlagSG,
};

/**
 * One country flag at a fixed 16×12 box, cropped to fill it — the source viewBoxes range from 5:3
 * to 1000:700, so without `preserveAspectRatio="slice"` a row of them would be a row of different
 * widths and the country names beside them would not line up.
 */
export function CountryFlag({ code, className }: { code: string; className?: string }) {
  const upper = (code ?? '').toUpperCase();
  const Flag = FLAG_BY_CODE[upper];
  const box = `border-border/60 block h-3 w-4 shrink-0 overflow-hidden rounded-[2px] border ${className ?? ''}`;

  if (!Flag) {
    return (
      <span
        className={`${box} bg-muted text-muted-foreground/80 text-[7px] leading-3 font-semibold tracking-tight`}
        aria-hidden="true"
      >
        {upper.slice(0, 2)}
      </span>
    );
  }
  return (
    <span className={box} aria-hidden="true">
      <Flag className="h-full w-full" preserveAspectRatio="xMidYMid slice" />
    </span>
  );
}
