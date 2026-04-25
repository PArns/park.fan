'use client';

import { useMounted } from '@/lib/hooks/use-mounted';

interface ObfuscatedEmailProps {
  local: string;
  domain: string;
  displayText?: string;
}

/**
 * ROT13-like encryption for email obfuscation
 * Shifts characters by 13 positions in the ASCII range
 */
export function rot13(text: string): string {
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // Only shift letters
      if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) {
        // Letters: a-z, A-Z
        const base = code >= 97 ? 97 : 65;
        return String.fromCharCode(((code - base + 13) % 26) + base);
      } else if (code >= 48 && code <= 57) {
        // Numbers: 0-9 (shift by 5)
        return String.fromCharCode(((code - 48 + 5) % 10) + 48);
      } else if (code === 46) {
        // . -> / (to avoid confusion)
        return '/';
      } else if (code === 64) {
        // @ -> M (shifted)
        return 'M';
      }
      // Keep other characters as-is (like -, _)
      return char;
    })
    .join('');
}

/**
 * Client component that obfuscates email addresses to prevent spam bots from scraping them.
 * Uses ROT13 encryption during hydration - the plain text email is only assembled client-side.
 * The initial HTML shows ROT13-encrypted text, and after hydration it becomes a clickable mailto link.
 */
export function ObfuscatedEmail({ local, domain, displayText }: ObfuscatedEmailProps) {
  const mounted = useMounted();

  if (!mounted) {
    // SSR: show ROT13-encrypted so bots can't scrape the address from initial HTML
    return <span>{`${rot13(local)}M${rot13(domain)}`}</span>;
  }

  const email = `${local}@${domain}`;
  return (
    <a href={`mailto:${email}`} className="break-all">
      {displayText || email}
    </a>
  );
}
