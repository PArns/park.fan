/**
 * A 44 px touch target on a control DRAWN 32 px tall, for the phone sheet.
 *
 * The sheet's floor is 44 px for anything a finger presses (see "Every target
 * in the sheet is 44 px" in `docs/features/trip-planner.md`), and until
 * PAR-482 every such control was also 44 px to the eye — which on a 664 px
 * iPhone viewport was the report: the park and date buttons, the headliner
 * pills and the two buttons under them were "viel zu hoch". So the control is
 * drawn at 32 and an `::after` reaches 6 px above and below it, and the row
 * around it owes those 6 px as padding or as space that takes no press. Two
 * rows of these may not stack closer than 12 px, or one overhang lies over the
 * other and a press lands on the wrong control.
 *
 * `planner-phone:` only: a fine pointer needs neither the height nor the
 * overhang, and the desktop rows keep the sizes they have.
 */
export const PHONE_TARGET_32 =
  "relative planner-phone:h-8 planner-phone:after:absolute planner-phone:after:inset-x-0 planner-phone:after:-inset-y-1.5 planner-phone:after:content-['']";

/**
 * The same 44 px, with the whole 12 px of overhang ABOVE the control, for a
 * row whose lower edge borders another row of targets: the optimise buttons
 * sit right over the summary row, whose bell reaches up by 6 px.
 */
export const PHONE_TARGET_32_UP =
  "relative planner-phone:h-8 planner-phone:after:absolute planner-phone:after:inset-x-0 planner-phone:after:-top-3 planner-phone:after:bottom-0 planner-phone:after:content-['']";
