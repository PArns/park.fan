import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Raw next-intl navigation primitives. The public `Link` is wrapped in
// ./no-prefetch-link to disable route prefetching (viewport + hover); everything
// else is re-exported unchanged from ./navigation.
export const {
  Link: BaseLink,
  redirect,
  usePathname,
  useRouter,
  getPathname,
} = createNavigation(routing);
