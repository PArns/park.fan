import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Strip "NEW:", "Neu:", "Nouveau:", etc. from display names, titles, descriptions. */
export function stripNewPrefix(text: string): string {
  return text.replace(/^(NEW|NEU|NOUVEAU|NIEUW|NUEVO):\s*/i, '').trim();
}
