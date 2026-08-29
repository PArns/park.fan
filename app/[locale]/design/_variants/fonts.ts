import { Bricolage_Grotesque, IBM_Plex_Mono } from 'next/font/google';

/**
 * Zwei Schriftrollen, die diese App bisher nicht besetzt.
 *
 * Der Bestand: eine einzige Familie (Geist) für alles, und `--font-mono` zeigt in
 * `app/globals.css` ebenfalls auf sie. Für eine Seite, deren Gegenstand gemessene Minuten sind,
 * heißt das: es gibt keinen Schnitt für Messwerte. Jede Zahl sieht aus wie Fließtext.
 *
 * - **Bricolage Grotesque** als Display. Eine Grotesk mit absichtlich schief geschnittenen
 *   Details — verspielt, ohne albern zu sein, was für einen Gegenstand passt, der ernsthafte
 *   Daten über etwas Unernstes sind. Sie steht nur an zwei Stellen pro Band: der großen Zahl und
 *   der Horizont-Marke. Mehr wäre Kostüm.
 * - **IBM Plex Mono** für Messwerte. Technisch, ohne Programmierer-Zitat, und die Ziffern haben
 *   auf 10 px noch Struktur — der Punkt, an dem die Achsenbeschriftung lebt.
 *
 * Beide sind auf diese Route beschränkt: sie hängen an den CSS-Variablen unten, und `.pk-display`
 * / `.pk-mono` fallen ohne sie auf `--font-sans` zurück. Kommt der Entwurf auf die Startseite,
 * wandern die zwei Aufrufe ins Locale-Layout — und kosten dann ~30 KB auf jeder Seite, was vorher
 * eine Entscheidung sein sollte und keine Nebenwirkung.
 */
export const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  // Nur die zwei Schnitte, die vorkommen: 800 für die Zahl, 600 für die Horizont-Marke.
  weight: ['600', '800'],
});

export const numericFont = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-numeric',
  display: 'swap',
  weight: ['400', '500', '600'],
});
