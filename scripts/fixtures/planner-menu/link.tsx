/** The i18n `Link` as a plain anchor, for the fixture, which runs outside Next's router. */
export function Link({
  href,
  prefetch: _prefetch,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean }) {
  return <a href={href} {...rest} />;
}
