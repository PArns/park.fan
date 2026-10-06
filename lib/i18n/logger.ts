/**
 * Logs missing translation keys: to the console in development, to `translation-missing.json`
 * during the build.
 */

// `fs` and `path` load lazily, on the server only: this module is reachable from Client
// Components, where a static `import fs` fails to resolve under Turbopack.
type FsModule = typeof import('fs');
type PathModule = typeof import('path');

function loadNodeModules(): { fs: FsModule; path: PathModule } | null {
  if (typeof window !== 'undefined') return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return { fs: require('fs') as FsModule, path: require('path') as PathModule };
  } catch {
    return null;
  }
}

/**
 * Whether missing keys go to `translation-missing.json`: during `next build` only, because a
 * synchronous write on the render path is slow and throws on Vercel's read-only filesystem.
 */
const LOGS_TO_FILE = process.env.NEXT_PHASE === 'phase-production-build';

interface MissingTranslation {
  key: string;
  namespace?: string;
  locale: string;
  page: string;
  timestamp: string;
}

class TranslationLogger {
  private static instance: TranslationLogger;
  private missingKeys: Map<string, MissingTranslation> = new Map();
  private logPath: string;
  private isServer: boolean;

  private constructor() {
    this.isServer = typeof window === 'undefined';
    const node = loadNodeModules();
    this.logPath = node ? node.path.join(process.cwd(), 'translation-missing.json') : '';

    if (node && this.isServer && LOGS_TO_FILE) {
      try {
        if (node.fs.existsSync(this.logPath)) {
          const existing = JSON.parse(node.fs.readFileSync(this.logPath, 'utf-8'));
          existing.forEach((item: MissingTranslation) => {
            const uniqueKey = `${item.locale}:${item.namespace || ''}:${item.key}:${item.page}`;
            this.missingKeys.set(uniqueKey, item);
          });
        }
      } catch (error) {
        console.warn('Failed to load existing translation log:', error);
      }
    }
  }

  static getInstance(): TranslationLogger {
    if (!TranslationLogger.instance) {
      TranslationLogger.instance = new TranslationLogger();
    }
    return TranslationLogger.instance;
  }

  logMissingKey(key: string, locale: string, namespace?: string, page?: string): void {
    const uniqueKey = `${locale}:${namespace || ''}:${key}:${page || 'unknown'}`;

    if (this.missingKeys.has(uniqueKey)) {
      return; // Already logged
    }

    const missing: MissingTranslation = {
      key,
      namespace,
      locale,
      page: page || (this.isServer ? 'server' : window.location.pathname),
      timestamp: new Date().toISOString(),
    };

    this.missingKeys.set(uniqueKey, missing);

    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Translation Missing] ${locale}/${namespace ? namespace + '.' : ''}${key} on page: ${missing.page}`
      );
    }

    if (this.isServer && LOGS_TO_FILE) {
      this.saveToFile();
    }
  }

  private saveToFile(): void {
    const node = loadNodeModules();
    if (!node || !this.logPath) return;
    try {
      const data = Array.from(this.missingKeys.values());
      node.fs.writeFileSync(this.logPath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save translation log:', error);
    }
  }

  getMissingKeys(): MissingTranslation[] {
    return Array.from(this.missingKeys.values());
  }

  getSummary(): {
    total: number;
    byLocale: Record<string, number>;
    byPage: Record<string, number>;
  } {
    const data = this.getMissingKeys();
    const byLocale: Record<string, number> = {};
    const byPage: Record<string, number> = {};

    data.forEach((item) => {
      byLocale[item.locale] = (byLocale[item.locale] || 0) + 1;
      byPage[item.page] = (byPage[item.page] || 0) + 1;
    });

    return {
      total: data.length,
      byLocale,
      byPage,
    };
  }

  // Force save (useful at end of build)
  flush(): void {
    if (this.isServer) {
      this.saveToFile();
    }
  }
}

const translationLogger = TranslationLogger.getInstance();

/** Records a missing translation key for the build log and the development console. */
export function logMissingTranslation(key: string, locale: string, namespace?: string): void {
  translationLogger.logMissingKey(key, locale, namespace);
}
