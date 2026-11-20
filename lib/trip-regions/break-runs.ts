import { addDays } from '@/lib/utils/park-day';

/**
 * A school break's name without the district and the day's other holidays: "Spring break (Orange
 * County Public Schools)" → "Spring break", "Winter break (…), New Year's Day" → "Winter break".
 */
export function cleanBreakName(name: string): string {
  return name.split(/\s*\(|,\s/)[0].trim();
}

/** A run of consecutive break days under one name. */
export interface BreakRun {
  from: string;
  to: string;
  /** The run's first named day, cleaned; empty when every day is an unnamed weekend. */
  name: string;
}

/**
 * Consecutive break days as runs: the weekends `/when` lists without a name join the break they
 * border, so "13–15 Feb" reads as Presidents' Day, not as two blanks and a holiday.
 */
export function breakRuns(days: ReadonlyArray<{ date: string; name: string }>): BreakRun[] {
  const runs: BreakRun[] = [];
  for (const day of [...days].sort((a, b) => a.date.localeCompare(b.date))) {
    const last = runs[runs.length - 1];
    const name = cleanBreakName(day.name);
    if (last && addDays(last.to, 1) === day.date) {
      last.to = day.date;
      if (!last.name) last.name = name;
    } else {
      runs.push({ from: day.date, to: day.date, name });
    }
  }
  return runs.filter((run) => run.name);
}
