/** Responsive 16:9 YouTube embed (privacy-enhanced nocookie host). */
export function BlogYouTubeEmbed({
  id,
  start,
  title,
}: {
  id: string;
  start?: number;
  title?: string;
}) {
  const src = `https://www.youtube-nocookie.com/embed/${id}${start ? `?start=${start}` : ''}`;
  return (
    <figure className="not-prose my-8">
      <div className="border-border/60 relative aspect-video w-full overflow-hidden rounded-xl border bg-black">
        <iframe
          src={src}
          title={title ?? 'YouTube video player'}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {title && (
        <figcaption className="text-muted-foreground mt-2 text-center text-sm">{title}</figcaption>
      )}
    </figure>
  );
}
