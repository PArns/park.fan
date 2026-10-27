/**
 * The small caps line over a widget in a post („Park im Fokus", „Wetter", „Karte"). A paragraph,
 * not a heading: the widget is part of the chapter it stands in, and as an `<h3>` it sat between
 * the post's own headings, sometimes straight under the `<h1>`.
 */
export function BlogWidgetLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">{children}</p>
  );
}
