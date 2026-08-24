import {
  BarChart3,
  BookText,
  Calendar,
  Clock,
  CloudSun,
  GalleryHorizontal,
  MapPin,
  Scale,
  TableProperties,
  TrainFront,
  TreePalm,
  type LucideIcon,
} from 'lucide-react';

/**
 * Single source of truth for the widget catalogue. Adding a new widget kind
 * means appending one entry here — fixed-toolbar / slash-menu / widget-preview
 * collectors / PropertiesPanel field map and editor-canvas insertion defaults
 * all derive from this list, so the kinds stay in lock-step.
 */

export interface WidgetField {
  key: string;
  label: string;
  placeholder?: string;
}

export interface WidgetDef {
  /** Fence info-string token (also the language attr on the codeBlock node). */
  name: string;
  /** Human-readable label for toolbar / slash menu / panel header. */
  label: string;
  /** One-line hint shown next to the label in the toolbar dropdown. */
  hint: string;
  icon: LucideIcon;
  /** Attrs the renderer actually consumes — drives the PropertiesPanel form. */
  fields: WidgetField[];
  /** Default fence body written when the widget is freshly inserted from
   *  toolbar / slash menu. */
  defaultBody: string;
}

export const WIDGETS: readonly WidgetDef[] = [
  {
    name: 'park-widget',
    label: 'Park widget',
    hint: 'Park card with live data',
    icon: TreePalm,
    fields: [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
    defaultBody: 'slug: phantasialand',
  },
  {
    name: 'attraction-widget',
    label: 'Attraction widget',
    hint: 'Ride card with live wait',
    icon: TrainFront,
    fields: [
      { key: 'parkSlug', label: 'Park slug', placeholder: 'phantasialand' },
      { key: 'slug', label: 'Ride slug', placeholder: 'black-mamba' },
    ],
    defaultBody: 'parkSlug: phantasialand\nslug: black-mamba',
  },
  {
    name: 'weather-widget',
    label: 'Weather widget',
    hint: 'Live weather + forecast',
    icon: CloudSun,
    fields: [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
    defaultBody: 'slug: phantasialand',
  },
  {
    name: 'stats-widget',
    label: 'Stats widget',
    hint: 'Live park statistics',
    icon: BarChart3,
    fields: [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
    defaultBody: 'slug: phantasialand',
  },
  {
    name: 'best-days-widget',
    label: 'Best-days widget',
    hint: 'Crowd-calendar preview',
    icon: Calendar,
    fields: [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
    defaultBody: 'slug: phantasialand',
  },
  {
    name: 'map-widget',
    label: 'Map widget',
    hint: 'Mini park map',
    icon: MapPin,
    fields: [{ key: 'slug', label: 'Park slug', placeholder: 'phantasialand' }],
    defaultBody: 'slug: phantasialand',
  },
  {
    name: 'gallery-widget',
    label: 'Gallery widget',
    hint: 'Folder-based gallery',
    icon: GalleryHorizontal,
    fields: [
      { key: 'folder', label: 'Folder', placeholder: '/blog/images' },
      { key: 'heading', label: 'Heading', placeholder: 'Highlights' },
    ],
    defaultBody: 'folder: /media/phantasialand\nheading: Highlights',
  },
  {
    name: 'glossary-widget',
    label: 'Glossary widget',
    hint: 'Inline term definition',
    icon: BookText,
    fields: [{ key: 'slug', label: 'Term slug', placeholder: 'live-wait-time' }],
    defaultBody: 'slug: crowd-level',
  },
  {
    name: 'park-comparison-widget',
    label: 'Park comparison widget',
    hint: 'Park medians side by side',
    icon: Scale,
    fields: [
      { key: 'slugs', label: 'Park slugs', placeholder: 'europa-park,phantasialand' },
      { key: 'highlight', label: 'Highlight park', placeholder: 'europa-park' },
      { key: 'show', label: 'Extra columns', placeholder: 'quietest' },
    ],
    defaultBody: 'slugs: europa-park,phantasialand\nhighlight: europa-park',
  },
  {
    name: 'ride-waits-widget',
    label: 'Ride waits widget',
    hint: 'Wait-time table, live',
    icon: TableProperties,
    fields: [
      { key: 'park', label: 'Park slug (one park)', placeholder: 'efteling' },
      { key: 'top', label: 'How many rides', placeholder: '10' },
      {
        key: 'rides',
        label: 'Rides (park/ride|Label|Type; …)',
        placeholder: 'phantasialand/taron|Taron|Multi-Launch;efteling/baron-1898',
      },
      { key: 'columns', label: 'Columns', placeholder: 'park,land,type,peak,days' },
      { key: 'highlight', label: 'Highlight ride', placeholder: 'troy' },
    ],
    defaultBody: 'park: efteling\ntop: 10\ncolumns: land,peak,days',
  },
  {
    name: 'hourly-profile-widget',
    label: 'Hourly profile widget',
    hint: 'Queue by hour, per ride',
    icon: Clock,
    fields: [
      { key: 'slug', label: 'Park slug', placeholder: 'europa-park' },
      { key: 'top', label: 'How many rides', placeholder: '8' },
    ],
    defaultBody: 'slug: europa-park\ntop: 8',
  },
];

export const WIDGET_NAMES = new Set(WIDGETS.map((w) => w.name));

export const WIDGET_BY_NAME = new Map(WIDGETS.map((w) => [w.name, w]));

export function getWidget(name: string): WidgetDef | undefined {
  return WIDGET_BY_NAME.get(name);
}

/** "park-widget" → "Park widget" — used in the PropertiesPanel header. */
export function widgetLabel(name: string): string {
  return WIDGET_BY_NAME.get(name)?.label ?? name;
}

/** "park-widget" → "Park" — short form for the in-canvas chip tag. */
export function widgetTagLabel(name: string): string {
  const def = WIDGET_BY_NAME.get(name);
  if (!def) return name;
  return def.label.replace(/\s+widget$/i, '');
}
