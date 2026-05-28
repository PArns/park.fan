import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Raw next-intl navigation primitives. The public `Link` is wrapped in
// ./hover-prefetch-link to disable viewport prefetching; everything else is
// re-exported unchanged from ./navigation.
export const {
  Link: BaseLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
