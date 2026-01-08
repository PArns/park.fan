'use client';

import { useEffect, useState } from 'react';

interface ObfuscatedEmailProps {
  local: string;
  domain: string;
  displayText?: string;
}

/**
 * ROT13-like encryption for email obfuscation
 * Shifts characters by 13 positions in the ASCII range
 */
function rot13(text: string): string {
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
  const [email, setEmail] = useState<string | null>(null);
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    // Assemble email and create mailto link only after hydration
    // This ensures the plain text email is never in the initial HTML
    const fullEmail = `${local}@${domain}`;
    setEmail(fullEmail);
    setHref(`mailto:${fullEmail}`);
  }, [local, domain]);

  if (!email || !href) {
    // Show ROT13-encrypted version during SSR (before hydration)
    // This obfuscates the email in the initial HTML - never show displayText or plain text here!
    // Also encrypt the @ symbol
    const encryptedLocal = rot13(local);
    const encryptedDomain = rot13(domain);
    const encryptedAt = 'M'; // @ -> M (rot13 of @)
    return <span>{`${encryptedLocal}${encryptedAt}${encryptedDomain}`}</span>;
  }

  // After hydration, show clickable mailto link with displayText or plain email
  return (
    <a href={href} className="break-all">
      {displayText || email}
    </a>
  );
}
