'use client';

import { useMounted } from '@/lib/hooks/use-mounted';

/**
 * An inline script that belongs to the server's HTML only: it runs as the document loads, before
 * hydration. A component mounted by a client navigation renders nothing, since React never runs a
 * `<script>` it creates and warns about one in development; the caller covers that case in its own
 * client code. After hydration it leaves the DOM, which is fine for a script that already ran.
 */
export function FirstLoadScript({ html }: { html: string }) {
  const mounted = useMounted();
  return mounted ? null : <script dangerouslySetInnerHTML={{ __html: html }} />;
}
