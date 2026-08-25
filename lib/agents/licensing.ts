/**
 * What park.fan permits a crawler to do with a page it has fetched, in the two machine-readable
 * forms that exist for saying so: the `Content-Signal` line in robots.txt
 * ([contentsignals.org](https://contentsignals.org)) and an RSL document at `/license.xml`
 * ([rslstandard.org](https://rslstandard.org)).
 *
 * They say the same three things, because they are the same three questions:
 *
 *   search    yes — list the site, that is the point.
 *   ai-input  yes — read a page to answer somebody who is asking right now. An assistant that
 *                   can read the page is a visitor who did not have to.
 *   ai-train  no  — the numbers here are hours old by lunchtime. A model that memorised them
 *                   would be wrong and confident, and the site gets nothing back.
 *
 * Two formats rather than one because they reach different readers: `Content-Signal` is read by
 * crawlers that already parse robots.txt, RSL by the licensing tooling that has grown up around
 * AI training deals, and Cloudflare's own AI Crawl Control documentation points at both.
 *
 * The comment block at the top of robots.txt is Cloudflare's Content Signals Policy text,
 * copied rather than paraphrased: it is what turns three tokens into an express reservation of
 * rights under Article 4 of the EU copyright directive, and a reworded version of a legal
 * notice is a different legal notice.
 *
 * Keep this file import-free: `next.config.ts` reads the `Link` header from here and is loaded
 * outside the app's module graph, so an `@/…` alias in here would break the config.
 */

/** Literal rather than an env var, for the same reason the API catalog is: a preview deployment
 *  should hand out the document production hands out, not one about itself. */
const SITE = 'https://park.fan';

export const RSL_LICENSE_PATH = '/license.xml';

/** RSL 1.0 §3. Served as `application/rsl+xml`. */
export const RSL_CONTENT_TYPE = 'application/rsl+xml; charset=utf-8';

/**
 * The licence itself. `payment type="attribution"` is RSL's way of saying the price is a credit:
 * name park.fan and link the page the number came from. That is not a formality here — a wait
 * time is only checkable if the reader can get back to where it was published.
 */
export const RSL_DOCUMENT = `<?xml version="1.0" encoding="UTF-8"?>
<rsl xmlns="https://rslstandard.org/rsl">
  <content url="${SITE}/">
    <license>
      <permits type="usage">search ai-input</permits>
      <prohibits type="usage">ai-train</prohibits>
      <payment type="attribution" />
    </license>
  </content>
</rsl>
`;

/** RSL 1.0 §4.5: the licence, associated with the asset being served. */
export const LICENSE_LINK_HEADER = `<${SITE}${RSL_LICENSE_PATH}>; rel="license"; type="application/rsl+xml"`;

/** RSL 1.0 §4.4: the same association for anything that reads robots.txt first. */
export const ROBOTS_LICENSE_DIRECTIVE = `License: ${SITE}${RSL_LICENSE_PATH}`;

/** The three tokens, in one place — robots.txt writes them into more than one block. */
export const CONTENT_SIGNAL = 'Content-Signal: search=yes, ai-input=yes, ai-train=no';

/** Where a crawler that only reads its own `User-agent` block still finds the policy. */
export const CONTENT_SIGNAL_TRAINING_ONLY = 'Content-Signal: ai-train=no';

/**
 * Cloudflare's Content Signals Policy preamble, verbatim (blog.cloudflare.com/robots.txt, the
 * reference implementation of contentsignals.org). It is what makes the tokens below a
 * reservation of rights rather than a hint — reworded, it would be a different notice.
 */
export const CONTENT_SIGNALS_PREAMBLE = `# As a condition of accessing this website, you agree to
# abide by the following content signals:
#
# (a) If a content-signal = yes, you may collect content
# for the corresponding use.
# (b) If a content-signal = no, you may not collect content
# for the corresponding use.
# (c) If the website operator does not include a content
# signal for a corresponding use, the website operator
# neither grants nor restricts permission via content
# signal with respect to the corresponding use.
#
# The content signals and their meanings are:
#
# search: building a search index and providing search
# results (e.g., returning hyperlinks and short excerpts
# from your website's contents). Search does not include
# providing AI-generated search summaries.
# ai-input: inputting content into one or more AI models
# (e.g., retrieval augmented generation, grounding, or
# other real-time taking of content for generative AI
# search answers).
# ai-train: training or fine-tuning AI models.
#
# ANY RESTRICTIONS EXPRESSED VIA CONTENT-SIGNALS ARE EXPRESS
# RESERVATIONS OF RIGHTS UNDER ARTICLE 4 OF THE EUROPEAN
# UNION DIRECTIVE 2019/790 ON COPYRIGHT AND RELATED RIGHTS
# IN THE DIGITAL SINGLE MARKET.
#
# The full licence, in machine-readable form, is at
# ${SITE}${RSL_LICENSE_PATH} (RSL 1.0).`;
