'use client';

import { Card } from '../ui/card';
import { Clock, Globe, Hash } from 'lucide-react';
import {
  formatDateTime,
  formatDate,
  formatTime,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
} from '../../lib/date-utils';

export function LocalizationDemo() {
  const sampleDate = new Date().toISOString();
  const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
  const sampleNumber = 1234567.89;
  const samplePercentage = 0.8542; // 85.42%

  return (
    <Card className="p-6" hover="lift">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">Localization Demo</h3>
          <p className="text-sm text-muted-foreground">Date & number formatting in your locale</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-500" />
              <h4 className="font-medium text-foreground">Date & Time</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Full: </span>
                <span className="font-mono text-foreground">{formatDateTime(sampleDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Date only: </span>
                <span className="font-mono text-foreground">{formatDate(sampleDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Time only: </span>
                <span className="font-mono text-foreground">{formatTime(sampleDate)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Relative: </span>
                <span className="font-mono text-foreground">{formatRelativeTime(oldDate)}</span>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Hash className="w-4 h-4 text-green-500" />
              <h4 className="font-medium text-foreground">Numbers</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Number: </span>
                <span className="font-mono text-foreground">{formatNumber(sampleNumber)}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Percentage: </span>
                <span className="font-mono text-foreground">
                  {formatPercentage(samplePercentage)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Basic locale: </span>
                <span className="font-mono text-foreground">{sampleNumber.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Locale Detection:</strong> All formats automatically adapt to your
            browser&apos;s language and region settings. Try changing your browser language to see
            different formats!
          </p>
        </div>
      </div>
    </Card>
  );
}
