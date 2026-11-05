/** One cell of a CSV export. */
export type CsvCell = string | number | boolean | null | undefined;

/** A labelled value written above the data: the window, the language, the filters. */
export type CsvMeta = readonly (readonly [label: string, value: string])[];

const TABLE = 'Tabelle';
const FIELD = 'Feld';
const VALUE = 'Wert';
const SUMMARY = 'Übersicht';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** A row object with its nested objects as dotted keys; a list inside a row stays one cell. */
function flattenRow(row: Record<string, unknown>, prefix = '', into: Record<string, CsvCell> = {}) {
  for (const [key, value] of Object.entries(row)) {
    const name = prefix ? `${prefix}.${key}` : key;
    if (isRecord(value)) flattenRow(value, name, into);
    else if (Array.isArray(value)) {
      into[name] = value.every((item) => !isRecord(item))
        ? value.join(' | ')
        : JSON.stringify(value);
    } else into[name] = value as CsvCell;
  }
  return into;
}

/**
 * Every list of objects in an API answer becomes rows under its path in the `Tabelle` column,
 * every other value a `Feld`/`Wert` row of the overview, so any report flattens without a mapping
 * of its own and a new field in the API shows up in the file by itself.
 */
function collect(
  value: unknown,
  path: string,
  rows: Record<string, CsvCell>[],
  summary: Record<string, CsvCell>[]
): void {
  if (Array.isArray(value) && value.length > 0 && value.every(isRecord)) {
    for (const item of value) rows.push({ [TABLE]: path, ...flattenRow(item) });
  } else if (isRecord(value)) {
    for (const [key, inner] of Object.entries(value)) {
      collect(inner, path ? `${path}.${key}` : key, rows, summary);
    }
  } else if (Array.isArray(value)) {
    summary.push({ [TABLE]: SUMMARY, [FIELD]: path, [VALUE]: value.join(' | ') });
  } else {
    summary.push({ [TABLE]: SUMMARY, [FIELD]: path, [VALUE]: value as CsvCell });
  }
}

/** A cell as CSV: quoted when it must be, and a text a spreadsheet would run as a formula defused. */
function csvCell(value: CsvCell): string {
  if (value === null || value === undefined) return '';
  let text = String(value);
  // Paths and referrers are visitor input; a leading = + - @ would run as a formula in a spreadsheet.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * An admin report's API answer as one CSV: `meta` (window and filters) and the answer's single
 * values first as `Übersicht` rows, then every list as rows named by its path, the columns the
 * union of all keys. Comma-separated, UTF-8 with a byte order mark so Excel reads the umlauts.
 */
export function reportCsv(data: unknown, meta: CsvMeta = []): string {
  const rows: Record<string, CsvCell>[] = [];
  const summary: Record<string, CsvCell>[] = meta.map(([label, value]) => ({
    [TABLE]: SUMMARY,
    [FIELD]: label,
    [VALUE]: value,
  }));
  collect(data, '', rows, summary);
  const all = [...summary, ...rows];
  const columns = [...new Set(all.flatMap((row) => Object.keys(row)))];
  const lines = [columns, ...all.map((row) => columns.map((column) => row[column]))];
  return `﻿${lines.map((line) => line.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

/** A file name part from free text: lower case, letters, digits and dashes only. */
export function csvNamePart(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
