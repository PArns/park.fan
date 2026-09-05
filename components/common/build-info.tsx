import buildInfo from '@/build-info.json';

export function BuildInfo() {
  if (!buildInfo) return null;

  const buildDate = new Date(buildInfo.buildDate);

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
      <span>
        Version <span className="font-mono">{buildInfo.buildNumber}</span>
      </span>
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
