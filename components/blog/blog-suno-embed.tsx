/** Suno song player embed. Optional caption comes from the link text. */
export function BlogSunoEmbed({ id, title }: { id: string; title?: string }) {
  return (
    <figure className="not-prose my-8">
      <iframe
        src={`https://suno.com/embed/${id}`}
        title={title ?? 'Suno player'}
        loading="lazy"
        allow="autoplay"
        className="border-border/60 h-[240px] w-full rounded-xl border bg-black"
      >
        <a href={`https://suno.com/song/${id}`} target="_blank" rel="noopener noreferrer">
          {title ?? 'Listen on Suno'}
        </a>
      </iframe>
      {title && (
        <figcaption className="text-muted-foreground mt-2 text-center text-sm">{title}</figcaption>
      )}
    </figure>
  );
}
