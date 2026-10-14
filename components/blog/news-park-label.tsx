import { MapPin } from 'lucide-react';
import { PostStreamLabel } from '@/components/blog/post-stream';
import type { NewsPark } from '@/lib/blog/news-park';

/** The park a news item belongs to, as a link to the park page (a {@link PostStreamLabel}). */
export function NewsParkLabel({ park, className }: { park: NewsPark; className?: string }) {
  return (
    <PostStreamLabel href={park.href} icon={MapPin} className={className}>
      {park.name}
    </PostStreamLabel>
  );
}
