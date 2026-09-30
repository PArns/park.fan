import type { Locale } from '@/i18n/config';

/** One chapter of a hub page: its anchor, its two-digit number and a short label. */
export interface Chapter {
  /** The `id` of the chapter's `<SectionShell>`, i.e. the anchor a link lands on. */
  id: string;
  index: string;
  label: string;
}

/**
 * The guide's chapters, per locale.
 *
 * Three readers: the chapter list at the top of the page, the rail down its right edge, and the
 * header's "more" band, which links every chapter from every page. All three look a chapter up by
 * its `id`, so this list must match the `<SectionShell id=… index=…>` calls in
 * `app/[locale]/how-park-fan-works/content/<locale>.tsx` exactly: an entry that drifts silently
 * stops highlighting in the rail and sends the menu's link to the top of the page. Chapter 05 was
 * inserted after the first draft and this list did not follow, which left the rail one chapter
 * short and every number after 04 pointing at the wrong heading. `pnpm test:hub-chapters` fails on
 * an id the page does not render.
 *
 * It lived inside each content module until the menu became its second reader: importing six
 * content modules into the layout for eleven labels each would have been the wrong way round.
 */
export const HOWTO_CHAPTERS: Record<Locale, Chapter[]> = {
  de: [
    { id: 'zahl', index: '01', label: 'Eine Zahl allein' },
    { id: 'massstab', index: '02', label: 'Typisch, voll, Rekord' },
    { id: 'moment', index: '03', label: 'Der beste Moment' },
    { id: 'tag', index: '04', label: 'Der richtige Tag' },
    { id: 'tagesplan', index: '05', label: 'Der Tag als Plan' },
    { id: 'parkseite', index: '06', label: 'Die Parkseite von oben nach unten' },
    { id: 'nachtschicht', index: '07', label: 'Woher die Zahlen kommen' },
    { id: 'luecken', index: '08', label: 'Wenn wir nichts wissen' },
    { id: 'besuche', index: '09', label: 'Vier Besuche' },
    { id: 'wegweiser', index: '10', label: 'Wo was steht' },
    { id: 'faq', index: '11', label: 'Häufige Fragen' },
  ],
  en: [
    { id: 'number', index: '01', label: 'A number on its own' },
    { id: 'scale', index: '02', label: 'Typical, busy, record' },
    { id: 'moment', index: '03', label: 'The best moment' },
    { id: 'day', index: '04', label: 'The right day' },
    { id: 'day-plan', index: '05', label: 'The day as a plan' },
    { id: 'park-page', index: '06', label: 'A park page, top to bottom' },
    { id: 'night-shift', index: '07', label: 'Where the numbers come from' },
    { id: 'gaps', index: '08', label: 'When we do not know' },
    { id: 'visits', index: '09', label: 'Four visits' },
    { id: 'signposts', index: '10', label: 'Where to find what' },
    { id: 'faq', index: '11', label: 'Common questions' },
  ],
  fr: [
    { id: 'chiffre', index: '01', label: 'Un chiffre tout seul' },
    { id: 'echelle', index: '02', label: 'Habituel, chargé, record' },
    { id: 'moment', index: '03', label: 'Le meilleur moment' },
    { id: 'jour', index: '04', label: 'Le bon jour' },
    { id: 'plan-journee', index: '05', label: 'La journée en plan' },
    { id: 'page-parc', index: '06', label: 'Une page de parc, de haut en bas' },
    { id: 'nuit', index: '07', label: 'D’où viennent les chiffres' },
    { id: 'limites', index: '08', label: 'Quand nous ne savons pas' },
    { id: 'visites', index: '09', label: 'Quatre visites' },
    { id: 'reperes', index: '10', label: 'Où trouver quoi' },
    { id: 'faq', index: '11', label: 'Questions fréquentes' },
  ],
  es: [
    { id: 'cifra', index: '01', label: 'Una cifra sola' },
    { id: 'escala', index: '02', label: 'Típico, lleno, récord' },
    { id: 'momento', index: '03', label: 'El mejor momento' },
    { id: 'dia', index: '04', label: 'El día adecuado' },
    { id: 'plan-del-dia', index: '05', label: 'El día como plan' },
    { id: 'pagina-parque', index: '06', label: 'Una página de parque de arriba abajo' },
    { id: 'noche', index: '07', label: 'De dónde salen las cifras' },
    { id: 'limites', index: '08', label: 'Cuando no lo sabemos' },
    { id: 'visitas', index: '09', label: 'Cuatro visitas' },
    { id: 'donde', index: '10', label: 'Dónde está cada cosa' },
    { id: 'faq', index: '11', label: 'Preguntas frecuentes' },
  ],
  it: [
    { id: 'numero', index: '01', label: 'Un numero da solo' },
    { id: 'scala', index: '02', label: 'Tipico, pieno, record' },
    { id: 'momento', index: '03', label: 'Il momento migliore' },
    { id: 'giorno', index: '04', label: 'Il giorno giusto' },
    { id: 'piano-del-giorno', index: '05', label: 'La giornata come piano' },
    { id: 'pagina-parco', index: '06', label: 'Una pagina di parco dall’alto in basso' },
    { id: 'notte', index: '07', label: 'Da dove arrivano i numeri' },
    { id: 'limiti', index: '08', label: 'Quando non lo sappiamo' },
    { id: 'visite', index: '09', label: 'Quattro visite' },
    { id: 'dove', index: '10', label: 'Dove si trova cosa' },
    { id: 'faq', index: '11', label: 'Domande frequenti' },
  ],
  nl: [
    { id: 'getal', index: '01', label: 'Eén getal alleen' },
    { id: 'maatstaf', index: '02', label: 'Normaal, druk, record' },
    { id: 'moment', index: '03', label: 'Het beste moment' },
    { id: 'dag', index: '04', label: 'De juiste dag' },
    { id: 'dagplan', index: '05', label: 'De dag als plan' },
    { id: 'parkpagina', index: '06', label: 'Een parkpagina van boven naar beneden' },
    { id: 'nachtdienst', index: '07', label: 'Waar de cijfers vandaan komen' },
    { id: 'gaten', index: '08', label: 'Als we het niet weten' },
    { id: 'bezoeken', index: '09', label: 'Vier bezoeken' },
    { id: 'wegwijzer', index: '10', label: 'Waar je wat vindt' },
    { id: 'faq', index: '11', label: 'Veelgestelde vragen' },
  ],
};
