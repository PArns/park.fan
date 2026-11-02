import type { AssistantLineKind, SiteEventMap } from '@/lib/analytics/site-analytics';

/** The acts Parky plays in answer to something the visitor did; `parky-logo.tsx` draws each. */
export const REACTION_ACTS = ['plan', 'cheer', 'love', 'bell', 'shades', 'lights'] as const;

/** One of {@link REACTION_ACTS}. */
export type ParkyReactionAct = (typeof REACTION_ACTS)[number];

/** Whether a name is one of Parky's reaction acts. */
export function isReactionAct(value: string | null | undefined): value is ParkyReactionAct {
  return (REACTION_ACTS as readonly string[]).includes(value ?? '');
}

/**
 * How Parky answers something the visitor did: an act every time, and a line from `keys` (the
 * `assistant` namespace) once a session per `line`, its kind in the statistic.
 */
export interface ParkyReaction {
  act: ParkyReactionAct;
  line: AssistantLineKind;
  keys: readonly string[];
}

const PLANNER: ParkyReaction = {
  act: 'plan',
  line: 'planner',
  keys: ['plannerOpen1', 'plannerOpen2', 'plannerOpen3', 'plannerOpen4'],
};
const PLAN_READY: ParkyReaction = {
  act: 'cheer',
  line: 'plan',
  keys: ['planReady1', 'planReady2', 'planReady3'],
};
const FAVOURITE: ParkyReaction = {
  act: 'love',
  line: 'favourite',
  keys: ['favourite1', 'favourite2', 'favourite3', 'favourite4'],
};
const ALERT: ParkyReaction = { act: 'bell', line: 'alert', keys: ['alert1', 'alert2', 'alert3'] };
const DARK: ParkyReaction = {
  act: 'lights',
  line: 'theme',
  keys: ['themeDark1', 'themeDark2', 'themeDark3'],
};
const LIGHT: ParkyReaction = {
  act: 'shades',
  line: 'theme',
  keys: ['themeLight1', 'themeLight2', 'themeLight3'],
};
const INSTALL: ParkyReaction = { act: 'cheer', line: 'install', keys: ['install1', 'install2'] };

/**
 * The site events Parky answers, keyed by the event's name, so renaming one breaks the build here
 * rather than Parky's answer going quiet.
 */
const REACTIONS: { [N in keyof SiteEventMap]?: (props: SiteEventMap[N]) => ParkyReaction | null } =
  {
    planner_opened: () => PLANNER,
    planner_wizard_finished: () => PLAN_READY,
    plan_optimized: () => PLAN_READY,
    favorite_add: () => FAVOURITE,
    ride_alert_set: () => ALERT,
    show_follow_add: () => ALERT,
    // In the dark the Ferris wheel lights up; in the light Parky puts on sunglasses.
    theme_toggled: ({ theme }) => (theme === 'dark' ? DARK : theme === 'light' ? LIGHT : null),
    pwa_installed: () => INSTALL,
  };

/** Parky's answer to a site event, or `null` for one it lets pass. */
export function reactionTo(name: string, props: unknown): ParkyReaction | null {
  const react = REACTIONS[name as keyof SiteEventMap] as
    ((props: unknown) => ParkyReaction | null) | undefined;
  return react ? react(props ?? {}) : null;
}
