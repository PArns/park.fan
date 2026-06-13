import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AtSign, Briefcase, Camera, Code2, Globe, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GlassCard } from '@/components/common/glass-card';
import type { ResolvedAuthor } from '@/lib/blog/authors';

const LINK_META: Record<
  keyof NonNullable<ResolvedAuthor['links']>,
  { icon: typeof Globe; label: string }
> = {
  website: { icon: Globe, label: 'Website' },
  x: { icon: AtSign, label: 'X' },
  mastodon: { icon: AtSign, label: 'Mastodon' },
  github: { icon: Code2, label: 'GitHub' },
  instagram: { icon: Camera, label: 'Instagram' },
  linkedin: { icon: Briefcase, label: 'LinkedIn' },
};

/** Profile header for the author page: avatar, name, role/location, bio, links. */
export function BlogAuthorProfile({ author }: { author: ResolvedAuthor }) {
  const links = Object.entries(author.links ?? {}).filter(([, href]) => Boolean(href)) as Array<
    [keyof typeof LINK_META, string]
  >;

  return (
    <GlassCard variant="light" className="not-prose p-6 sm:p-8">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
        <Avatar className="size-20 sm:size-24">
          {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
          <AvatarFallback className="bg-primary/15 text-primary text-2xl font-semibold">
            {author.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
            {author.name}
          </h1>
          <div className="text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
            {author.role && <span className="text-foreground/80 font-medium">{author.role}</span>}
            {author.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {author.location}
              </span>
            )}
          </div>

          {author.bioBody ? (
            <div className="text-foreground/90 [&_a]:text-primary mt-3 space-y-3 text-base leading-relaxed [&_a:hover]:underline">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  a: ({ href, children }) => (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {author.bioBody}
              </ReactMarkdown>
            </div>
          ) : (
            author.bio && (
              <p className="text-foreground/90 mt-3 text-base leading-relaxed">{author.bio}</p>
            )
          )}

          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {links.map(([kind, href]) => {
                const meta = LINK_META[kind];
                const Icon = meta.icon;
                return (
                  <a
                    key={kind}
                    href={href}
                    target="_blank"
                    rel="me noopener noreferrer"
                    className="border-border/60 bg-muted/40 text-foreground/80 hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {meta.label}
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
