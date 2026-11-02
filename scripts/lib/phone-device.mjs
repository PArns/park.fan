import { devices } from 'playwright';

/** The iPhone 17's status bar, in CSS px: `PhoneShot` draws it above the screenshot. */
export const STATUS_BAR = 62;

/**
 * The phone the marketing screenshots come from (`capture-home-shots.mjs`, `capture-parky-shots.mjs`):
 * an iPhone 17 whose page fills the screen under the status bar, as a home-screen web app does, so
 * `PhoneShot` shows the phone's real proportions (1206 × 2436 px at 3×).
 */
export const PHONE = {
  ...devices['iPhone 17'],
  viewport: { width: 402, height: 874 - STATUS_BAR },
};
