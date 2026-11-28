/**
 * Parky on the share images and in a post: `oklchToHex` lands on the brand's own hex values,
 * `forSatori` calls components through and leaves no `oklch()` behind, the `[!PARKY]` marker
 * is one of the callouts the posts and the admin editor read, and a verdict on its marker line
 * becomes the card's stamp.
 *
 * Run: pnpm test:og-parky
 */
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { forSatori, oklchToHex } from '../lib/og/satori-svg.ts';
import {
  CALLOUT_MARKER_RE,
  CALLOUT_TYPES,
  parseParkyStamp,
  remarkCallouts,
} from '../lib/blog/remark-callouts.ts';
import { checkThat, finishChecks, quietChecks } from './lib/run-cases.mjs';

quietChecks();

// The brand palette's documented pairs, give or take one step of rounding per channel.
const near = (hex, want) =>
  [1, 3, 5].every(
    (i) => Math.abs(parseInt(hex.slice(i, i + 2), 16) - parseInt(want.slice(i, i + 2), 16)) <= 1
  );
checkThat('brand blue', near(oklchToHex(0.628, 0.137, 241.275), '#2191d3'));
checkThat('brand green', near(oklchToHex(0.752, 0.181, 146.391), '#51cc64'));
checkThat('white', oklchToHex(1, 0, 0) === '#ffffff');

const Dot = ({ colour }) => createElement('circle', { r: 1, fill: colour });
const tree = forSatori(
  createElement(
    'svg',
    null,
    createElement(Fragment, null, createElement(Dot, { colour: 'oklch(0.628 0.137 241.275)' }))
  )
);
const markup = renderToStaticMarkup(tree);
checkThat('components called through', markup.includes('<circle'));
checkThat('no oklch left', !markup.includes('oklch'));

checkThat('parky is a callout type', CALLOUT_TYPES.includes('parky'));
checkThat('marker reads [!PARKY]', CALLOUT_MARKER_RE.exec('[!PARKY] tip')?.[1] === 'PARKY');
checkThat('marker still reads [!NOTE]', CALLOUT_MARKER_RE.test('[!NOTE]'));

checkThat(
  'verdict on the marker line',
  parseParkyStamp('[!PARKY] Lohnt sich!\nTaron ab 17 Uhr.')?.label === 'Lohnt sich!'
);
checkThat('bare marker has no stamp', parseParkyStamp('[!PARKY]\nTaron ab 17 Uhr.') === null);
checkThat('one-line tip stays the tip', parseParkyStamp('[!PARKY] Taron ab 17 Uhr.') === null);
checkThat(
  'a long marker line stays the tip',
  parseParkyStamp('[!PARKY] Taron fahren wir erst nach fünf\nweil es dann dunkel ist.') === null
);

/** One `> [!PARKY]` blockquote as remark parses it, run through the plugin. */
function parky(text) {
  const quote = {
    type: 'blockquote',
    children: [{ type: 'paragraph', children: [{ type: 'text', value: text }] }],
  };
  remarkCallouts()({ children: [quote] });
  return { props: quote.data?.hProperties ?? {}, text: quote.children[0]?.children[0]?.value };
}
const stamped = parky('[!PARKY] Lohnt sich!\nTaron ab 17 Uhr.');
checkThat('stamp lands on the callout', stamped.props['data-callout-stamp'] === 'Lohnt sich!');
checkThat('stamp leaves the tip', stamped.text === 'Taron ab 17 Uhr.');
const plain = parky('[!PARKY]\nTaron ab 17 Uhr.');
checkThat('plain card has no stamp', !('data-callout-stamp' in plain.props));
checkThat('plain card keeps its tip', plain.text === 'Taron ab 17 Uhr.');

finishChecks();
console.log('✅ og-parky: all checks passed');
