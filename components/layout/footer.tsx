import { BuildInfo } from '../display/build-info';

export function Footer() {
  return (
    <footer className="bg-slate-100 dark:bg-slate-800 border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold gradient-text mb-4">🎢 Park.Fan</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm">
              Real-time theme park statistics and analytics platform. Get insights into wait times,
              park operations, and visitor patterns.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Features
            </h4>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <li>Live Wait Times</li>
              <li>Park Statistics</li>
              <li>Global Analytics</li>
              <li>Historical Data</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
              Data Source
            </h4>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
              Powered by Park.Fan API
            </p>
            <a
              href="https://api.park.fan"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
            >
              api.park.fan
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-300 dark:border-slate-600">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-center sm:text-left text-sm text-slate-600 dark:text-slate-300">
              © 2025 Park.Fan Dashboard. Coded with ❤️ by{' '}
              <a
                href="https://arns.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
              >
                arns.dev
              </a>
            </p>
            <BuildInfo />
          </div>
        </div>
      </div>
    </footer>
  );
}
