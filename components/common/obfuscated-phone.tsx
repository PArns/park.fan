'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { rot13 } from '@/components/common/obfuscated-email';

interface ObfuscatedPhoneProps {
  number: string;
  displayText?: string;
  className?: string; // Add className prop for flexibility
}

/**
 * Client component that obfuscates phone numbers to prevent spam bots from scraping them.
 * Uses ROT13 encryption during hydration - the plain text number is only assembled client-side.
 * The initial HTML shows ROT13-encrypted text, and after hydration it becomes a clickable tel link.
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
