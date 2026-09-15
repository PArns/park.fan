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
 * all four hub URLs in the HTML of every page — the band is `hidden`, never unmounted, so a
 * crawler reads it exactly as it read the four entries in the bar.
 *
 * **The blog section keeps the panel it already had.** Emptying it to match its three neighbours
 * would have taken 3 category and 4 post links out of the link graph of ~35,000 pages until the
 * follow-up ticket puts them back, for no gain in the meantime. Where the manifest holds no
 * categories the section falls back to its heading and a line, which is the branch the bar used to
 * carry as a plain `/blog` link.
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

  /*
   * A rail beside the blog block from `xl`, three columns above it below that — the same shape,
   * and for the same reason, as the parks panel's photo rail.
   *
   * Stacked, the three sections cost the band 110 px it did not have to spend: the blog block alone
   * already draws 756 px of a 900 px window at 1440, and a menu that fills the screen it hangs in
   * stops reading as a menu. In the rail they fit in the height the blog block occupies anyway, so
   * the band is exactly as tall as it was when the blog trigger owned it.
   */
  return (
    <div className="flex flex-col gap-5 xl:flex-row xl:gap-6">
      {/* `xl:flex-col`, not `xl:grid-cols-1`: the rail is a flex item and stretches to the blog
          block's height, and a grid that tall splits itself into three equal rows — the three
          sections came out 226 px apart with their text pinned to the top of each. A column lets
          them keep their own height while the border still runs the full side. */}
      <div className="border-border/60 grid gap-x-8 gap-y-5 sm:grid-cols-3 xl:flex xl:w-64 xl:shrink-0 xl:flex-col xl:border-r xl:pr-6">
        {sections.map((section) => (
          <div key={section.href} data-menu-stagger>
            <MenuSectionHeading label={section.label} href={section.href} />
            <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty">
              {section.hint}
            </p>
          </div>
        ))}
      </div>

      {showBlog && (
        <div
          data-menu-stagger
          className="border-border/60 min-w-0 flex-1 border-t pt-4 xl:border-t-0 xl:pt-0"
        >
          {blog && blog.categories.length > 0 ? (
            <BlogMenuPanel {...blog} />
          ) : (
            <>
              <MenuSectionHeading label={t('blog')} href="/blog" />
              <p className="text-muted-foreground text-[13px] leading-relaxed text-pretty">
                {t('blogHint')}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
