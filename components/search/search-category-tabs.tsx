'use client';

import type { KeyboardEvent, MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SearchGroup, SearchTab } from '@/components/search/search-result-groups';

/** `TabsTrigger`'s base is a segmented control; here a tab is a label over an underline. */
const TAB_CLASS =
  'relative h-10 flex-none rounded-md border-0 px-3 text-[13px] text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-transparent dark:data-[state=active]:bg-transparent after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary after:opacity-0 after:transition-opacity data-[state=active]:after:opacity-100 data-[state=active]:*:bg-primary/15 data-[state=active]:*:text-primary';

/**
 * Keys pressed on a tab stay in the tab row: cmdk's root would take Enter as "open the
 * highlighted result". Arrow down hands the keyboard back to the field.
 */
function onTabKeyDown(e: KeyboardEvent<HTMLDivElement>) {
  if (e.key === 'Enter') e.preventDefault();
  if (e.key !== 'ArrowDown') return;
  e.preventDefault();
  e.currentTarget.closest('[cmdk-root]')?.querySelector<HTMLInputElement>('[cmdk-input]')?.focus();
}

interface SearchCategoryTabsProps {
  groups: SearchGroup[];
  /** The `Tabs` root's own setter: a click switches here, the keyboard through Radix. */
  onTabChange: (tab: SearchTab) => void;
}

/**
 * The tab row over a result set: "All", then a tab with its count for every category that found
 * something, in the order `buildSearchGroups` returns them. Renders inside a `Tabs` root.
 */
export function SearchCategoryTabs({ groups, onTabChange }: SearchCategoryTabsProps) {
  const tSearch = useTranslations('search');
  // Radix focuses a tab on mousedown and switches there; cancelling that keeps the caret in the
  // field, and the click that still follows does the switch.
  const pointerProps = (tab: SearchTab) => ({
    onMouseDown: (e: MouseEvent) => e.preventDefault(),
    onClick: () => onTabChange(tab),
  });

  return (
    <TabsList
      // The right edge fades, so tabs that run past it read as a row to swipe; the padding under
      // the fade lets the last tab scroll clear of it. The line below is the panel's, or it would
      // fade too.
      className="flex h-auto w-full shrink-0 [scrollbar-width:none] justify-start gap-0.5 overflow-x-auto rounded-none bg-transparent [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)] p-0 pr-8 pl-2"
      onKeyDown={onTabKeyDown}
    >
      <TabsTrigger value="all" className={TAB_CLASS} {...pointerProps('all')}>
        {tSearch('tabs.all')}
      </TabsTrigger>
      {groups.map((group) => (
        <TabsTrigger
          key={group.key}
          value={group.key}
          className={TAB_CLASS}
          {...pointerProps(group.key)}
        >
          {tSearch(`tabs.${group.key}`)}
          <span className="bg-foreground/[7%] rounded-full px-1.5 py-px text-[11px] tabular-nums transition-colors">
            {group.count}
          </span>
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
