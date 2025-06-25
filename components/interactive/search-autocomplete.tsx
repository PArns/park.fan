'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { searchParks, searchRides } from '../../lib/api';
import { SearchParkResult, SearchRideResult } from '../../lib/park-types';
import { cn } from '../../lib/utils';

export function SearchAutocomplete() {
  const [query, setQuery] = useState('');
  const [parks, setParks] = useState<SearchParkResult[]>([]);
  const [rides, setRides] = useState<SearchRideResult[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<NodeJS.Timeout | null>(null);

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

  return (
    <div
      className={cn(
        'relative transition-all duration-300 focus-within:w-60 sm:focus-within:w-72',
        query.length === 0 ? 'w-32 sm:w-48' : 'w-40 sm:w-64'
      )}
    >
      <div className="relative">
        <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          className="w-full pl-7 pr-3 py-2 text-sm rounded-md bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Search parks or rides"
        />
      </div>
      {open && (parks.length > 0 || rides.length > 0) && (
        <div className="absolute z-50 mt-1 w-full bg-background border border-border rounded-md shadow-md max-h-60 overflow-y-auto animate-slide-down">
          {parks.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Parks</p>
              {parks.map((park) => (
                <Link
                  key={`park-${park.id}`}
                  href={park.hierarchicalUrl}
                  className="block px-2 py-1 rounded-md hover:bg-muted"
                >
                  {park.name}
                </Link>
              ))}
            </div>
          )}
          {rides.length > 0 && (
            <div className="p-2 border-t border-border">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Rides</p>
              {rides.map((ride) => (
                <Link
                  key={`ride-${ride.id}`}
                  href={ride.hierarchicalUrl}
                  className="block px-2 py-1 rounded-md hover:bg-muted"
                >
                  {ride.name}{' '}
                  <span className="text-muted-foreground text-xs">({ride.parkName})</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
