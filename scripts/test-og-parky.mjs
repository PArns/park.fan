/**
 * Parky on the share images and in a post: `oklchToHex` lands on the brand's own hex values,
 * `forSatori` calls components through and leaves no `oklch()` behind, and the `[!PARKY]` marker
 * is one of the callouts the posts and the admin editor read.
 *
 * Run: pnpm test:og-parky
 */
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { forSatori, oklchToHex } from '../lib/og/satori-svg.ts';
import { CALLOUT_MARKER_RE, CALLOUT_TYPES } from '../lib/blog/remark-callouts.ts';

let failed = 0;
function check(name, ok) {
  if (!ok) {
    failed++;
    console.log(`❌ FAIL: ${name}`);
  }
}

// The brand palette's documented pairs, give or take one step of rounding per channel.
const near = (hex, want) =>
  [1, 3, 5].every(
    (i) => Math.abs(parseInt(hex.slice(i, i + 2), 16) - parseInt(want.slice(i, i + 2), 16)) <= 1
  );
check('brand blue', near(oklchToHex(0.628, 0.137, 241.275), '#2191d3'));
check('brand green', near(oklchToHex(0.752, 0.181, 146.391), '#51cc64'));
check('white', oklchToHex(1, 0, 0) === '#ffffff');

const Dot = ({ colour }) => createElement('circle', { r: 1, fill: colour });
const tree = forSatori(
  createElement(
    'svg',
    null,
    createElement(Fragment, null, createElement(Dot, { colour: 'oklch(0.628 0.137 241.275)' }))
  )
);
const markup = renderToStaticMarkup(tree);
check('components called through', markup.includes('<circle'));
check('no oklch left', !markup.includes('oklch'));

check('parky is a callout type', CALLOUT_TYPES.includes('parky'));
check('marker reads [!PARKY]', CALLOUT_MARKER_RE.exec('[!PARKY] tip')?.[1] === 'PARKY');
check('marker still reads [!NOTE]', CALLOUT_MARKER_RE.test('[!NOTE]'));

if (failed) process.exit(1);
console.log('✅ og-parky: all checks passed');
