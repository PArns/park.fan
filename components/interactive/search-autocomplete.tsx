'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { searchParks, searchRides, getCountryFlag } from '../../lib/api';
import { SearchParkResult, SearchRideResult } from '../../lib/park-types';
import { cn } from '../../lib/utils';

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [parks, setParks] = useState<SearchParkResult[]>([]);
  const [rides, setRides] = useState<SearchRideResult[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const timer = useRef<NodeJS.Timeout | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setParks([]);
      setRides([]);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const [p, r] = await Promise.all([searchParks(query), searchRides(query)]);
        setParks(p);
        setRides(r);
        setOpen(true);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const links = listRef.current.querySelectorAll('a');
    const el = links[activeIndex] as HTMLElement | undefined;
    if (el) {
      el.focus();
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [activeIndex]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative transition-all duration-300 focus-within:w-60 sm:focus-within:w-72',
        query.length === 0 ? 'w-32 sm:w-48' : 'w-40 sm:w-64'
      )}
    >
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              if (!open) setOpen(true);
              setActiveIndex(0);
            } else if (e.key === 'Escape') {
              setOpen(false);
              setActiveIndex(-1);
            }
          }}
          className="w-full pl-7 pr-3 py-2 text-sm rounded-md bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search parks or rides"
        />
      </div>
      {open && (parks.length > 0 || rides.length > 0) && (
        <div
          ref={listRef}
          onKeyDown={(e) => {
            const total = parks.length + rides.length;
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActiveIndex((idx) => Math.min(idx + 1, total - 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActiveIndex((idx) => {
                if (idx <= 0) {
                  inputRef.current?.focus();
                  return -1;
                }
                return idx - 1;
              });
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const index = activeIndex;
              if (index >= 0) {
                const item = index < parks.length ? parks[index] : rides[index - parks.length];
                router.push(item.hierarchicalUrl);
                setOpen(false);
                setActiveIndex(-1);
                setQuery('');
              }
            }
          }}
          className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-md max-h-60 overflow-y-auto animate-slide-down"
        >
          {parks.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Parks</p>
              {parks.map((park, idx) => (
                <Link
                  key={`park-${park.id}`}
                  href={park.hierarchicalUrl}
                  tabIndex={-1}
                  className={cn(
                    'block px-2 py-1 rounded-md hover:bg-muted flex items-center gap-2',
                    activeIndex === idx && 'bg-accent text-accent-foreground'
                  )}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => setOpen(false)}
                >
                  <span className="text-lg">{getCountryFlag(park.country)}</span>
                  <span className="truncate">{park.name}</span>
                </Link>
              ))}
            </div>
          )}
          {rides.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Rides</p>
              {rides.map((ride, idx) => {
                const globalIndex = parks.length + idx;
                return (
                  <Link
                    key={`ride-${ride.id}`}
                    href={ride.hierarchicalUrl}
                    tabIndex={-1}
                    className={cn(
                      'block px-2 py-1 rounded-md hover:bg-muted flex items-center gap-2',
                      activeIndex === globalIndex && 'bg-accent text-accent-foreground'
                    )}
                    onMouseEnter={() => setActiveIndex(globalIndex)}
                    onClick={() => setOpen(false)}
                  >
                    <span className="text-lg">{getCountryFlag(ride.country)}</span>
                    <span className="truncate">
                      {ride.name}{' '}
                      <span className="text-muted-foreground text-xs">({ride.parkName})</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
