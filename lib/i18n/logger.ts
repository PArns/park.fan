/**
 * Translation Logger
 *
 * Logs missing translation keys during build and runtime
 * to help identify translation issues across all pages.
 */

// `fs`/`path` are loaded lazily (server-only) instead of via top-level imports: this module is
// now reachable from Client Components (e.g. the client FAQ section → translateCountry), and a
// static `import fs from 'fs'` makes the client bundle fail to resolve `fs` under Turbopack.
// File logging only ever runs on the server in production, so requiring these on demand keeps
// server behavior identical while staying client-bundle-safe.
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

    // Load existing log if in build mode
    if (node && this.isServer && process.env.NODE_ENV === 'production') {
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

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `[Translation Missing] ${locale}/${namespace ? namespace + '.' : ''}${key} on page: ${missing.page}`
      );
    }

    // Write to file during build
    if (this.isServer && process.env.NODE_ENV === 'production') {
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

// Export singleton instance
export const translationLogger = TranslationLogger.getInstance();

// Export helper for use in translation functions
export function logMissingTranslation(key: string, locale: string, namespace?: string): void {
  translationLogger.logMissingKey(key, locale, namespace);
}
