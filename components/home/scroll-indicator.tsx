'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

export function ScrollIndicator() {
  const t = useTranslations('common');
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const check = () => setVisible(window.scrollY < 10);
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  }, []);

  return (
    <div
      className={`pointer-events-none absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 transition-opacity duration-500 lg:flex ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      {/* Label */}
      <span className="font-mono text-[10px] tracking-[0.25em] text-white/75 uppercase select-none">
        {t('scroll')}
      </span>

      {/* Mouse shape */}
      <div className="relative flex h-11 w-6 items-start justify-center rounded-full border border-white/75 bg-white/10 pt-2.5 backdrop-blur-md">
        {/* Animated ball */}
        <div className="from-primary to-primary/50 h-1.5 w-1.5 animate-[scroll-ball_1.8s_ease-in-out_infinite] rounded-full bg-gradient-to-b" />
      </div>

      {/* Chevron */}
      <ChevronDown className="h-3.5 w-3.5 text-white/75" />
    </div>
  );
}
