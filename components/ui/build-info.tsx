import { BUILD_INFO } from '../../lib/build-info';
import { ClientTime } from './client-time';

export function BuildInfo() {
  return (
    <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
      <div>
        Version {BUILD_INFO.version} (Build {BUILD_INFO.buildNumber})
      </div>
      <div>
        Built on <ClientTime timestamp={BUILD_INFO.buildDate} format="absolute" /> •{' '}
        {BUILD_INFO.gitHash}
      </div>
    </div>
  );
}
