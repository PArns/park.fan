/**
 * Client-side glossary data for Tooltip support.
 * This is a subset of glossary data available in the browser without async loading.
 * Generated from content/glossary/{locale}.ts files.
 */

import type { Locale } from '@/i18n/config';

export interface ClientGlossaryTerm {
  id: string;
  name: Record<Locale, string>;
  shortDefinition: Record<Locale, string>;
}

export const CLIENT_GLOSSARY_TERMS: Record<string, ClientGlossaryTerm> = {
  'off-peak': {
    id: 'off-peak',
    name: {
      en: 'Off-Peak',
      de: 'Off-Peak',
      fr: 'Off-Peak',
      it: 'Off-Peak',
      nl: 'Off-Peak',
      es: 'Off-Peak',
    },
    shortDefinition: {
      en: 'A period when a park is closed or not operating at full capacity.',
      de: 'Ein Zeitraum, in dem ein Park geschlossen oder nicht mit voller Kapazität betrieben wird.',
      fr: 'Une période où un parc est fermé ou ne fonctionne pas à pleine capacité.',
      it: 'Un periodo in cui un parco è chiuso o non funziona a piena capacità.',
      nl: 'Een periode waarin een park gesloten is of niet op volle capaciteit werkt.',
      es: 'Un período cuando un parque está cerrado o no funciona a plena capacidad.',
    },
  },
};
