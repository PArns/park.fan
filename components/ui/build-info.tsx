import { BUILD_INFO } from '../../lib/build-info';

export function BuildInfo() {
  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
      <div>
        Version {BUILD_INFO.version} (Build {BUILD_INFO.buildNumber})
      </div>
      <div>
        Built on {formatDate(BUILD_INFO.buildDate)} • {BUILD_INFO.gitHash}
      </div>
    </div>
  );
}
