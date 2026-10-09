/**
 * Text reduced for matching: lower case, accents off, "ß" as "ss", so "farup" finds "Fårup" and
 * "strasse" finds "Straße". "ß" has no Unicode decomposition, hence the explicit replace.
 */
export function foldText(value: string): string {
  return value
    .replace(/\u00df/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/** A ride name reduced for matching, so "winjas" finds "Winja's" and "fly" finds "F.L.Y.". */
export function foldRideName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
