'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CATEGORICAL } from '@/app/admin/_ui/charts';
import {
  LINK_BLOCK_LABEL,
  SECTION_LABEL,
  formatCount,
  formatShare,
  propCount,
} from '@/lib/admin/site-analytics';
import { ARTICLE_END_ID, ARTICLE_READ_DEPTHS, articleReadSpan } from '@/lib/analytics/article-read';
import { isLinkBlock, LINK_BLOCK_ATTRIBUTE } from '@/lib/analytics/internal-link';
import { isSeenSection, SECTION_SEEN_ATTRIBUTE } from '@/lib/analytics/section-seen';
import type { EventDetailResponse } from '@/lib/api/admin-site-analytics';

/** What the site statistic knows about how this page was read, over the overlay's window. */
export interface PageReading {
  /** The page's views, what every share of readers is a share of. */
  views: number;
  /** `section_seen` on this page, `null` on a page without its marks. */
  sections: EventDetailResponse | null;
  /** `article_read` on this page, `null` on a page that is no post. */
  depths: EventDetailResponse | null;
  /** `internal_link_clicked` on this page. */
  links: EventDetailResponse;
}

/** A line across the page where readers got to, or a frame around a block of links. */
interface Mark {
  key: string;
  top: number;
  /** A frame's box; a line has none. */
  box?: { left: number; width: number; height: number };
  label: string;
  title: string;
}

const LINE_COLOR = CATEGORICAL[0];
const BOX_COLOR = CATEGORICAL[1];

function reachedLabel(count: number, views: number): string {
  return views > 0 ? formatShare(Math.min(1, count / views)) : '–';
}

/**
 * The marks for the page as it is laid out now, in document coordinates: a line at each
 * `section_seen` mark, a line at each depth of `article_read` where the bottom of the screen stood
 * when it counted (at this screen's height, so it moves with the window), a frame around each
 * visible block of links.
 */
function measure(reading: PageReading): Mark[] {
  const scrollY = window.scrollY;
  const marks: Mark[] = [];
  const { views, sections, depths, links } = reading;

  if (sections) {
    for (const element of document.querySelectorAll(`[${SECTION_SEEN_ATTRIBUTE}]`)) {
      const section = element.getAttribute(SECTION_SEEN_ATTRIBUTE);
      if (!isSeenSection(section)) continue;
      const count = propCount(sections, 'section', section);
      marks.push({
        key: `section-${section}`,
        top: element.getBoundingClientRect().top + scrollY,
        label: `${SECTION_LABEL[section]}: ${reachedLabel(count, views)}`,
        title: `${formatCount(count)} von ${formatCount(views)} Aufrufen kamen bis hierher`,
      });
    }
  }

  if (depths && document.getElementById(ARTICLE_END_ID)) {
    const span = articleReadSpan();
    if (span > 0) {
      for (const depth of ARTICLE_READ_DEPTHS) {
        const count = propCount(depths, 'depth', String(depth));
        marks.push({
          key: `depth-${depth}`,
          top: (span * depth) / 100 + window.innerHeight,
          label: `${depth} % gelesen: ${reachedLabel(count, views)}`,
          title: `${formatCount(count)} von ${formatCount(views)} Aufrufen lasen so weit. Die Linie steht, wo der untere Bildschirmrand dann ist, bei diesem Fenster.`,
        });
      }
    }
  }

  for (const [index, element] of document.querySelectorAll(`[${LINK_BLOCK_ATTRIBUTE}]`).entries()) {
    const block = element.getAttribute(LINK_BLOCK_ATTRIBUTE);
    const rect = element.getBoundingClientRect();
    if (!isLinkBlock(block) || rect.width === 0 || rect.height === 0) continue;
    const count = propCount(links, 'block', block);
    marks.push({
      key: `block-${index}`,
      top: rect.top + scrollY,
      box: { left: rect.left + window.scrollX, width: rect.width, height: rect.height },
      label: `${LINK_BLOCK_LABEL[block]}: ${formatCount(count)} Klicks`,
      title:
        links.total > 0
          ? `${formatShare(count / links.total)} der ${formatCount(links.total)} Klicks auf Links dieser Seite`
          : 'Auf dieser Seite wurde kein Link angeklickt',
    });
  }
  return marks;
}

/**
 * Draws how the page was read onto the page itself, for the admin's overlay: where readers got to
 * and how often each block's links were followed. One absolutely placed layer at the end of
 * `<body>`, so nothing on the page moves, and only the labels take the pointer, for their
 * tooltips. Measured again whenever the page changes size; a sticky header's frame stays where
 * the header stands at the top of the page.
 */
export function PageReadingMarks({ reading }: { reading: PageReading }) {
  const [marks, setMarks] = useState<Mark[]>([]);

  useEffect(() => {
    let frame: number | null = null;
    const schedule = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setMarks(measure(reading));
      });
    };
    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    window.addEventListener('resize', schedule, { passive: true });
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', schedule);
    };
  }, [reading]);

  return createPortal(
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 z-50">
      {marks.map((mark) => {
        const color = mark.box ? BOX_COLOR : LINE_COLOR;
        return (
          <div
            key={mark.key}
            className={
              mark.box
                ? 'absolute rounded-md outline-2 -outline-offset-2 outline-dashed'
                : 'absolute inset-x-0 border-t-2 border-dashed'
            }
            style={
              mark.box
                ? { top: mark.top, ...mark.box, outlineColor: color }
                : { top: mark.top, borderColor: color }
            }
          >
            <span
              title={mark.title}
              className="pointer-events-auto absolute top-0 left-1 max-w-[calc(100%-0.5rem)] truncate rounded-b px-1.5 py-0.5 text-[10px] font-medium text-white tabular-nums shadow"
              style={{ background: color }}
            >
              {mark.label}
            </span>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
