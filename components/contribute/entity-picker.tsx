'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  ChevronsUpDown,
  FerrisWheel,
  Loader2,
  MapPin,
  RollerCoaster,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { SearchResultItem } from '@/lib/api/types';
import type { AssignedEntity } from '@/lib/contribute/types';

interface EntityPickerProps {
  value: AssignedEntity | null;
  onChange: (entity: AssignedEntity | null) => void;
  disabled?: boolean;
}

const MIN_CHARS = 3;

function toAssigned(item: SearchResultItem): AssignedEntity {
  return {
    type: item.type as 'park' | 'attraction',
    id: item.id,
    name: item.name,
    slug: item.slug,
    url: item.url,
    country: item.country,
    parentParkName: item.parentPark?.name,
  };
}

/**
 * Combobox to assign a contribution to a park or a ride. Live-searches the
 * existing /api/search endpoint (debounced), groups results into Parks and
 * Attractions, and renders the current selection as a rich chip. cmdk's built-in
 * filtering is disabled (`shouldFilter={false}`) because the API already ranks.
 */
export function EntityPicker({ value, onChange, disabled }: EntityPickerProps) {
  const t = useTranslations('contribute.picker');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced live search. All state updates happen inside the timer callback
  // (never synchronously in the effect body) so a short query just resets results.
  useEffect(() => {
    const q = query.trim();
    const tooShort = q.length < MIN_CHARS;
    const timer = setTimeout(
      async () => {
        if (tooShort) {
          setResults([]);
          setLoading(false);
          return;
        }
        setLoading(true);
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
            signal: controller.signal,
          });
          const data = (await res.json()) as { results?: SearchResultItem[] };
          const filtered = (data.results ?? []).filter(
            (r) => r.type === 'park' || r.type === 'attraction'
          );
          setResults(filtered);
        } catch (err) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) setResults([]);
        } finally {
          setLoading(false);
        }
      },
      tooShort ? 0 : 250
    );

    return () => clearTimeout(timer);
  }, [query]);

  const parks = useMemo(() => results.filter((r) => r.type === 'park'), [results]);
  const attractions = useMemo(() => results.filter((r) => r.type === 'attraction'), [results]);

  const select = (item: SearchResultItem) => {
    onChange(toAssigned(item));
    setOpen(false);
    setQuery('');
    setResults([]);
  };

  // Rich chip for the current selection.
  if (value) {
    const Icon = value.type === 'park' ? FerrisWheel : RollerCoaster;
    return (
      <div className="border-primary/30 bg-primary/[5%] flex items-center gap-3 rounded-lg border p-3">
        <div className="bg-primary/15 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-semibold">{value.name}</span>
            <Badge variant="secondary" className="shrink-0 capitalize">
              {t(value.type)}
            </Badge>
          </div>
          <p className="text-muted-foreground truncate text-xs">
            {value.type === 'attraction' && value.parentParkName
              ? t('inPark', { park: value.parentParkName })
              : [value.country].filter(Boolean).join('')}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="shrink-0"
        >
          <X className="size-4" />
          {t('change')}
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="text-muted-foreground h-11 w-full justify-between font-normal"
        >
          <span className="flex items-center gap-2">
            <MapPin className="size-4" />
            {t('placeholder')}
          </span>
          <ChevronsUpDown className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-(--radix-popover-trigger-width) p-0"
        align="start"
        sideOffset={6}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={t('searchPlaceholder')}
            hint={
              loading ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null
            }
          />
          <CommandList>
            {query.trim().length < MIN_CHARS ? (
              <CommandEmpty>{t('minChars', { min: MIN_CHARS })}</CommandEmpty>
            ) : !loading && results.length === 0 ? (
              <CommandEmpty>{t('empty')}</CommandEmpty>
            ) : null}

            {parks.length > 0 && (
              <CommandGroup heading={t('parks')}>
                {parks.map((item) => (
                  <ResultItem
                    key={item.id}
                    item={item}
                    onSelect={() => select(item)}
                    selectedId={value}
                  />
                ))}
              </CommandGroup>
            )}
            {attractions.length > 0 && (
              <CommandGroup heading={t('attractions')}>
                {attractions.map((item) => (
                  <ResultItem
                    key={item.id}
                    item={item}
                    onSelect={() => select(item)}
                    selectedId={value}
                  />
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ResultItem({
  item,
  onSelect,
  selectedId,
}: {
  item: SearchResultItem;
  onSelect: () => void;
  selectedId: AssignedEntity | null;
}) {
  const Icon = item.type === 'park' ? FerrisWheel : RollerCoaster;
  const subtitle =
    item.type === 'attraction' && item.parentPark?.name
      ? item.parentPark.name
      : [item.city, item.country].filter(Boolean).join(', ');
  return (
    <CommandItem value={item.id} onSelect={onSelect} className="gap-3 py-2.5">
      <Icon className="text-primary size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{item.name}</div>
        {subtitle && <div className="text-muted-foreground truncate text-xs">{subtitle}</div>}
      </div>
      {item.countryCode && (
        <span className="text-muted-foreground shrink-0 text-xs">{item.countryCode}</span>
      )}
      <Check
        className={cn('size-4 shrink-0', selectedId?.id === item.id ? 'opacity-100' : 'opacity-0')}
      />
    </CommandItem>
  );
}
