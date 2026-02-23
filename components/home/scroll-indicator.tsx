'use client';

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

export function ScrollIndicator() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const check = () => setVisible(window.scrollY < 10);
    check(); // run on mount in case page restored scroll position
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce transition-opacity duration-500 lg:flex lg:items-center lg:justify-center ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="border-foreground/25 bg-background/30 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm">
        <ChevronDown className="text-foreground/80 h-5 w-5" />
      </div>
    </div>
  );
}
