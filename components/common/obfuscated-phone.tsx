'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { rot13 } from '@/components/common/obfuscated-email';

interface ObfuscatedPhoneProps {
  number: string;
  displayText?: string;
  className?: string;
}

/**
 * A phone number kept from scrapers: the server HTML carries a ROT13-shifted string, and the tel
 * link is assembled on the client after hydration.
 */
export function ObfuscatedPhone({ number, displayText, className }: ObfuscatedPhoneProps) {
  const mounted = useMounted();

  if (!mounted) {
    // SSR: show ROT13-encrypted so bots can't scrape the number from initial HTML
    return <span className={className}>{rot13(displayText || number)}</span>;
  }

  return (
    <a href={`tel:${number.replace(/\s/g, '')}`} className={className}>
      {displayText || number}
    </a>
  );
}
