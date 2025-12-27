/**
 * Translation Logger
 *
 * Logs missing translation keys during build and runtime
 * to help identify translation issues across all pages.
 */

import fs from 'fs';
import path from 'path';

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
    this.logPath = path.join(process.cwd(), 'translation-missing.json');

    // Load existing log if in build mode
    if (this.isServer && process.env.NODE_ENV === 'production') {
      try {
        if (fs.existsSync(this.logPath)) {
          const existing = JSON.parse(fs.readFileSync(this.logPath, 'utf-8'));
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
    try {
      const data = Array.from(this.missingKeys.values());
      fs.writeFileSync(this.logPath, JSON.stringify(data, null, 2), 'utf-8');
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
