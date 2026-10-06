/** A ride name reduced for matching, so "winjas" finds "Winja's" and "fly" finds "F.L.Y.". */
export function foldRideName(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}
