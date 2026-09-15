'use client';

import { useTranslations } from 'next-intl';
import { BlogMenuPanel } from '@/components/layout/blog-menu-panel';
import { MenuSectionHeading } from '@/components/layout/menu-section-heading';
import type { BlogMenu } from '@/lib/navigation/blog-menu';

/**
 * The "more" band: everything the bar used to carry as a link of its own.
 *
 * The desktop bar had six equal entries plus favorites, search and three preference buttons in one
 * 48 px row, and it did not fit: measured on `/parks/europe/germany` before this change, French at
 * a 1024 px container overflowed its box by 23.7 px and took the document to 1032 px, i.e. a
 * horizontal scrollbar on every page; at 1280 px it had exactly 0.0 px left. Four of those entries
 * — best travel time, the dictionary, the guide and the blog — are reading material rather than
 * places somebody navigates to repeatedly, so they live one level down now.
 *
 * **Why the trigger is called "more" and not "discover".** The issue's own working title was
 * "Entdecken", which in German would have stood 101 px from "Parks entdecken" in the same row, and
 * in French put "Explorer" next to "Explorer les parcs". The thing is a catch-all — the follow-up
 * tickets hang `/alerts`, `/fancast` and `/contribute` in here as well — and a catch-all is named
 * after being one.
 *
 * **Three of the four sections are a heading and a line, and that is the whole of them for now.**
 * Their lists (glossary categories, the guide's chapters, the hub's parks) are separate tickets, so
 * what is here is the skeleton the follow-ups fill in. The heading IS the link, which is what keeps
 * those three hub URLs in the HTML of every page — the band is `hidden`, never unmounted, so a
 * crawler reads it exactly as it read the three entries in the bar. `/blog` is the fourth and comes
 * from the blog section below.
 *
 * **The blog section keeps the panel it already had**, wherever there is one to keep: from two
 * posts up it is `BlogMenuPanel` beside the rail, below that a fourth heading in a flat row of
 * columns (see the branch). Emptying it to match its three neighbours would have taken 3 category
 * and 6 post links (`RECENT_LIMIT`) out of the link graph of ~35,000 pages until the follow-up
 * ticket puts them back, for no gain in the meantime.
 */
interface MoreMenuPanelProps {
  /** Localized hub paths, resolved in the header, which already derives them for the phone sheet. */
  bestTimeHref: string;
  glossaryHref: string;
  howtoHref: string;
  /** False while the blog has no published post — then it has no section at all, as before. */
  showBlog: boolean;
  /** Categories and the newest posts, read from the build-time manifest in the layout. */
  blog?: BlogMenu;
}

export function MoreMenuPanel({
  bestTimeHref,
  glossaryHref,
  howtoHref,
  showBlog,
  blog,
}: MoreMenuPanelProps) {
  // `navigation` only. A `useTranslations('blog')` in a header component pulls the whole namespace
  // into the chrome every page serializes — see `BlogMenuPanel` for what that cost the last time.
  const t = useTranslations('navigation');

  const sections = [
    { href: bestTimeHref, label: t('bestTime'), hint: t('bestTimeHint') },
    { href: glossaryHref, label: t('glossary'), hint: t('glossaryHint') },
    { href: howtoHref, label: t('howto'), hint: t('howtoHint') },
  ];

  const columns = (
    <>
      {sections.map((section) => (
        <div key={section.href} data-menu-stagger>
          <MenuSectionHeading label={section.label} href={section.href} />
          <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty">
            {section.hint}
          </p>
        </div>
      ))}
    </>
  );

  /*
   * The rail exists to stand beside the blog BLOCK, so without that block there is no rail: `w-64`
   * and `border-r` describe a relationship to a neighbour, and with nothing there they draw a
   * 256 px column and a rule into the empty half of a band up to 1280 px wide.
   *
   * Two cases arrive here, and they get the same flat row of columns because they have the same
   * shape — a heading and a line per section, with nothing tall beside them:
   *
   * - `showBlog` false, i.e. a locale that publishes nothing. Latent today, and the prop exists
   *   for it; counter-checked by forcing it at 1440 px: 3 × 394.7 px, band 93.1 px.
   * - fewer than two posts. `BlogMenuPanel` draws its heading — the only `/blog` link in the whole
   *   panel — in the column of posts AFTER the lead one, so a locale with exactly one published
   *   post would otherwise get a panel with no way to the blog index at all, where the bar's old
   *   entry was always a link to it. Here the blog is a fourth heading with its own line, and the
   *   post keeps its URL one click further on.
   *
   * **The count of posts is the whole condition, and a count of CATEGORIES is deliberately not in
   * it.** The bar's old entry switched on `categories.length > 0`, which is where this started, and
   * that term throws away up to six post links for a locale whose posts simply carry no category —
   * `category` is optional in the frontmatter, and `BlogMenuPanel` guards its own pill row with the
   * same check and renders fine without it.
   *
   * `grid-cols-3`/`-4` with no threshold under them: this panel only ever renders inside the nav
   * row, and that row is `@min-[1024px]:flex` on the same container, so a one-column state of these
   * has no width at which anybody could see it.
   */
  const hasBlogBlock = showBlog && blog != null && blog.recent.length > 1;

  if (!hasBlogBlock) {
    return (
      <div className={`grid gap-x-8 gap-y-5 ${showBlog ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {columns}
        {showBlog && (
          <div data-menu-stagger>
            <MenuSectionHeading label={t('blog')} href="/blog" />
            <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty">
              {t('blogHint')}
            </p>
          </div>
        )}
      </div>
    );
  }

  /*
   * A rail beside the blog block from a bar width of 1280 px, three columns above it below that —
   * the same shape as the parks panel's photo rail.
   *
   * **It is not the shorter of the two, and the first version of this comment claimed it was.**
   * Measured at 1440 px on the same build, same page, both with every cover decoded: stacked
   * 756.3 px, as a rail 758.8 px. The rail takes 256 px off the blog block, and the block gives the
   * height straight back by wrapping — its two halves go 563.1 → 654.8 px. Any arithmetic that
   * holds the block's height constant (mine did, and answered 867.6) is measuring a layout that
   * does not exist.
   *
   * So the reason is the shape the issue asks for and not a saving: four sections reading side by
   * side at the width where there is room for them. Neither layout helps with the band filling
   * three quarters of a 900 px window — that height is the blog block's and predates this panel.
   */
  return (
    /*
     * Container queries, not `sm:`/`xl:`, and that is the header's own requirement rather than a
     * preference: the trip planner's panel insets the page, so the `<header>` (which carries
     * `@container`) gets narrower without the window moving. At a 1600 px window with the planner
     * open the band's content column is 992 px while `xl:` still reads 1600 — the rail would split
     * a band that has the width the stacked layout is for, leaving the blog block 712 px of the
     * 992 it would otherwise have. `MenuBand` one level up already sizes that column with
     * `@min-[1280px]:`;
     * these are the same numbers asked of the same container.
     */
    <div className="flex flex-col gap-5 @min-[1280px]:flex-row @min-[1280px]:gap-6">
      {/* `flex-col`, not `grid-cols-1`: the rail is a flex item and stretches to the blog block's
          height, and a grid that tall splits itself into three equal rows — the three sections
          came out 226 px apart with their text pinned to the top of each. A column lets them keep
          their own height while the border still runs the full side. */}
      <div className="border-border/60 grid grid-cols-3 gap-x-8 gap-y-5 @min-[1280px]:flex @min-[1280px]:w-64 @min-[1280px]:shrink-0 @min-[1280px]:flex-col @min-[1280px]:border-r @min-[1280px]:pr-6">
        {columns}
      </div>

      {/* No `data-menu-stagger` on this wrapper. `useMenuReveal` collects its targets with
          `querySelectorAll`, i.e. at any depth, and `BlogMenuPanel` carries three of its own —
          nesting them would tween the parent AND the child, so the block would start 20 px high
          instead of 10 and three stagger steps late. It is the only place in the app where the two
          could nest, because every other panel keeps its targets flat. */}
      <div className="border-border/60 min-w-0 flex-1 border-t pt-4 @min-[1280px]:border-t-0 @min-[1280px]:pt-0">
        <BlogMenuPanel {...blog} />
      </div>
    </div>
  );
}
