/**
 * A 44 px touch target on a control drawn 32 px tall, for the phone sheet: the control is drawn at
 * 32 and an `::after` reaches 6 px above and below it, which the row around it owes as padding or
 * as space that takes no press. Two rows of these may not stack closer than 12 px, or one overhang
 * lies over the other. `planner-phone:` only. See
 * docs/features/trip-planner.md#every-target-in-the-sheet-is-44-px-and-three-of-them-are-not-what-they-measure.
 */
export const PHONE_TARGET_32 =
  "relative planner-phone:h-8 planner-phone:after:absolute planner-phone:after:inset-x-0 planner-phone:after:-inset-y-1.5 planner-phone:after:content-['']";

/**
 * The same 44 px, with all 12 px of overhang above the control, for a row whose lower edge borders
 * another row of targets: the optimise buttons sit right over the summary row.
 */
export const PHONE_TARGET_32_UP =
  "relative planner-phone:h-8 planner-phone:after:absolute planner-phone:after:inset-x-0 planner-phone:after:-top-3 planner-phone:after:bottom-0 planner-phone:after:content-['']";
