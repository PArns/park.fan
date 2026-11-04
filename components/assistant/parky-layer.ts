/**
 * Parky's layer: button, speech bubble and window lie above everything else on the page, the
 * header, the planner and the navigation bar's `z-[9999]` included. One class for all three.
 */
export const PARKY_LAYER = 'z-[10000]';

/**
 * Below this width Parky's window takes the screen: the page behind it is locked, it stands in
 * what the browser shows, and a step that leads elsewhere on the page closes it.
 */
export const ASSISTANT_PHONE_QUERY = '(max-width: 639px)';
