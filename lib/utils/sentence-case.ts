/**
 * A phrase with a capital first letter, for a word that opens a sentence or stands alone as a
 * label ("hurricane season" as a legend key). Every locale here is Latin script, so upper-casing
 * the first character is the whole job.
 */
export function sentenceCase(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}
