import buildInfo from '@/build-info.json';
import { changelogHref } from '@/lib/changelog/paths';

export function BuildInfo() {
  if (!buildInfo) return null;

  const buildDate = new Date(buildInfo.buildDate);

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
      {/* The version is the release this build belongs to, so it opens that release's notes.
          `version` and not `buildNumber`: the commit count behind the last dot is not a release,
          and `pnpm check:changelog` keeps `package.json` equal to the newest published entry,
          so the anchor always exists. English only, like the page. `gap-1` carries the space
          between the word and the number, which an inline-flex row would collapse, and
          `max-sm:min-h-11` gives it the 44 px row every other footer link has on a phone. */}
      <a
        href={changelogHref(buildInfo.version)}
        hrefLang="en"
        className="hover:text-foreground inline-flex items-center gap-1 underline-offset-2 transition-colors hover:underline max-sm:min-h-11"
      >
        Version<span className="font-mono">{buildInfo.buildNumber}</span>
      </a>
      {/* `md:` and not `@min-[768px]/page:`: the whole line is ~240px of `text-xs` and
          fits at 320, so 768 was never the width at which it stops fitting — it is where
          a phone stops wanting a build date under the footer. A question about the device,
          so it keeps asking the window. */}
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
