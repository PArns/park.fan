'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, Link2 } from 'lucide-react';
import { FacebookIcon, WhatsAppIcon, XIcon } from '@/components/common/brand-icons';

interface ShareButtonsProps {
  /** Absolute canonical URL to share. */
  url: string;
  title: string;
  className?: string;
}

/**
 * Social share row reused across blog posts, parks and rides: deep links to the
 * major networks (WhatsApp, Facebook, X) plus a copy-to-clipboard fallback with
 * a brief confirmation state. Reads the top-level `share` translation namespace.
 */
export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const t = useTranslations('share');
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked (insecure context / permissions) — nothing to do.
    }
  };

  const encUrl = encodeURIComponent(url);
  const encTitle = encodeURIComponent(title);
  const targets = [
    {
      name: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
      Icon: WhatsAppIcon,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encUrl}`,
      Icon: FacebookIcon,
    },
    {
      name: 'X',
      href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encTitle}`,
      Icon: XIcon,
    },
  ];

  const cls =
    'border-border/60 text-foreground/80 hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <span className="text-muted-foreground mr-1 text-xs font-semibold tracking-wider uppercase">
        {t('title')}
      </span>
      {targets.map(({ name, href, Icon }) => (
        <a
          key={name}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t('on', { platform: name })}
          className={cls}
        >
          <Icon className="h-3.5 w-3.5" />
          {name}
        </a>
      ))}
      <button type="button" onClick={copy} className={cls}>
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        {copied ? t('copied') : t('copy')}
      </button>
    </div>
  );
}
