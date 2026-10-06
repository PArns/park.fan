import buildInfo from '@/build-info.json';
import { changelogHref } from '@/lib/changelog/paths';

/**
 * Footer line with the build's version, linked to that release on the changelog, and the build date
 * from `md` up. Reads `build-info.json`; English only.
 */
export function BuildInfo() {
  if (!buildInfo) return null;

  const buildDate = new Date(buildInfo.buildDate);

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
      {/* The version opens its release's notes: `version`, not `buildNumber`, and
          `pnpm check:changelog` keeps `package.json` equal to the newest published entry, so the
          anchor exists. `gap-1` keeps the space an inline-flex row would collapse, and
          `max-sm:min-h-11` matches the other footer links. */}
      <a
        href={changelogHref(buildInfo.version)}
        hrefLang="en"
        className="hover:text-foreground inline-flex items-center gap-1 underline-offset-2 transition-colors hover:underline max-sm:min-h-11"
      >
        Version<span className="font-mono">{buildInfo.buildNumber}</span>
      </a>
      {/* `md:`, not a container query: whether a phone wants a build date is a question about
          the device, so it asks the window. */}
      <span className="text-muted-foreground/60 hidden items-center md:inline-flex">•</span>
      <span className="hidden md:inline">
        Built{' '}
        {buildDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
      </span>
    </div>
  );
}
