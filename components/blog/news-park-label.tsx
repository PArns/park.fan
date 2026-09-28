import { MapPin } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { badgeLinkProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { NewsPark } from '@/lib/blog/news-park';

/**
 * The park a news item belongs to, as a link to the park page. Drawn as a `Badge` so it reads as
 * a label next to the title rather than as a second headline.
 */
export function NewsParkLabel({ park, className }: { park: NewsPark; className?: string }) {
  return (
    <Link
      href={park.href as '/'}
      prefetch={false}
      {...badgeLinkProps({
        variant: 'outline',
        className: cn('bg-background/60 max-w-full gap-1.5 px-2.5 py-1', className),
      })}
    >
      <MapPin className="text-primary" aria-hidden="true" />
      <span className="truncate">{park.name}</span>
    </Link>
  );
}
