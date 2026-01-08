import buildInfo from '@/build-info.json';

export const dynamic = 'force-static';

export function BuildInfo() {
  if (!buildInfo) return null;

  const buildDate = new Date(buildInfo.buildDate);

  return (
    <div className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
      <span>
        Version <span className="font-mono">{buildInfo.buildNumber}</span>
      </span>
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
