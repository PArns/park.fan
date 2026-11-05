'use client';

import { Download } from 'lucide-react';
import { reportCsv, type CsvMeta } from '@/lib/admin/report-csv';

/**
 * Saves what a report shows as a CSV file, built in the browser from the answer the page already
 * holds (`reportCsv`), so the file has exactly the window and filters on screen and costs no
 * request. Disabled until there is an answer.
 */
export function CsvButton({
  data,
  filename,
  meta,
  label = 'Als CSV speichern',
}: {
  data: unknown;
  /** Without `.csv`. */
  filename: string;
  meta?: CsvMeta;
  label?: string;
}) {
  const save = () => {
    const url = URL.createObjectURL(
      new Blob([reportCsv(data, meta)], { type: 'text/csv;charset=utf-8' })
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    // Firefox starts the download after the click returns, so the URL has to outlive this tick.
    setTimeout(() => URL.revokeObjectURL(url));
  };
  return (
    <button
      type="button"
      onClick={save}
      disabled={data === undefined || data === null}
      title={label}
      aria-label={label}
      className="text-muted-foreground hover:text-primary flex h-6 w-6 items-center justify-center rounded disabled:opacity-40"
    >
      <Download className="h-3.5 w-3.5" />
    </button>
  );
}
