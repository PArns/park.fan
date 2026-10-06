import type { Locale } from '@/i18n/config';
import type { Chapter } from '@/lib/howto/chapters';

/**
 * The best-travel-time hub's chapters, per locale — for the header's "more" band, which lists them
 * under the hub's own link the way it lists the guide's.
 *
 * The ids are the page's anchors and are the same in every locale (`patterns` … `faq`, the `id` of
 * each `<SectionShell>` in `app/[locale]/best-time-to-visit/content/<locale>.tsx`);
 * `pnpm test:hub-chapters` fails when one of them is not in the page it points into.
 *
 * The labels are the page's own chapter titles, cut to fit a menu row rather than reworded. The
 * FAQ label is the one the guide's list uses, so the two columns in the band say it the same way.
 */
export const BEST_TIME_CHAPTERS: Record<Locale, Chapter[]> = {
  de: [
    { id: 'patterns', index: '01', label: 'Die ruhigsten Wochentage und Monate' },
    { id: 'times', index: '02', label: 'Die ruhigsten Tageszeiten' },
    { id: 'avoid', index: '03', label: 'Termine, die du meiden solltest' },
    { id: 'tactics', index: '04', label: 'Tricks für kurze Warteschlangen' },
    { id: 'parks', index: '05', label: 'Der Crowd-Kalender' },
    { id: 'faq', index: '06', label: 'Häufige Fragen' },
  ],
  en: [
    { id: 'patterns', index: '01', label: 'The quietest weekdays and months' },
    { id: 'times', index: '02', label: 'The quietest times of day' },
    { id: 'avoid', index: '03', label: 'Dates to avoid' },
    { id: 'tactics', index: '04', label: 'Tactics for short queues' },
    { id: 'parks', index: '05', label: 'The crowd calendar' },
    { id: 'faq', index: '06', label: 'Common questions' },
  ],
  fr: [
    { id: 'patterns', index: '01', label: 'Jours et mois les plus calmes' },
    { id: 'times', index: '02', label: 'Les heures les plus calmes' },
    { id: 'avoid', index: '03', label: 'Les dates à éviter' },
    { id: 'tactics', index: '04', label: 'Tactiques pour des files courtes' },
    { id: 'parks', index: '05', label: 'Le calendrier d’affluence' },
    { id: 'faq', index: '06', label: 'Questions fréquentes' },
  ],
  es: [
    { id: 'patterns', index: '01', label: 'Días y meses más tranquilos' },
    { id: 'times', index: '02', label: 'Las horas más tranquilas' },
    { id: 'avoid', index: '03', label: 'Fechas que conviene evitar' },
    { id: 'tactics', index: '04', label: 'Tácticas para colas cortas' },
    { id: 'parks', index: '05', label: 'El calendario de afluencia' },
    { id: 'faq', index: '06', label: 'Preguntas frecuentes' },
  ],
  it: [
    { id: 'patterns', index: '01', label: 'Giorni e mesi più tranquilli' },
    { id: 'times', index: '02', label: 'Le ore più tranquille' },
    { id: 'avoid', index: '03', label: 'Date da evitare' },
    { id: 'tactics', index: '04', label: 'Tattiche per code corte' },
    { id: 'parks', index: '05', label: 'Il calendario dell’affluenza' },
    { id: 'faq', index: '06', label: 'Domande frequenti' },
  ],
  nl: [
    { id: 'patterns', index: '01', label: 'De rustigste weekdagen en maanden' },
    { id: 'times', index: '02', label: 'De rustigste tijden van de dag' },
    { id: 'avoid', index: '03', label: 'Momenten die je beter mijdt' },
    { id: 'tactics', index: '04', label: 'Tactieken voor korte rijen' },
    { id: 'parks', index: '05', label: 'De druktekalender' },
    { id: 'faq', index: '06', label: 'Veelgestelde vragen' },
  ],
};
