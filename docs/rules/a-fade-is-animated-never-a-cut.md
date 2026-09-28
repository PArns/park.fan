# A fade is animated, never a cut (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the
rule in one line and links here for the how.

Anything that changes its opacity or its visibility does it over time. The PO put it as „Generell
will ich alle Fades animiert haben, und nicht harte Übergänge" (PAR-482 follow-up), after the show
marks in the trip planner went from a full pill to 20 % in one frame, and added the ghost of a
dragged block to it: that too moved in steps of five minutes rather than across them.

## How

- **A state change on a mounted element:** the transition names `opacity`. `transition-colors` does
  not, which is how the planner's dimmed arrows, ticked entries and unticked fit rows came to switch
  in one frame while their colours eased. Use `transition` or list the property.
- **An element that appears:** `starting:opacity-0` with an opacity transition. `@starting-style`
  gives the first frame a value to transition from, so a mount fades in without an effect or a
  second render.
- **An element that goes away:** keep it mounted and set `invisible opacity-0` with
  `transition-[opacity,visibility]`. `visibility` is discrete and flips at the end of the fade out
  and at the start of the fade in, so a hidden element takes no press and Playwright's `:visible`
  stops matching it once the fade is over. The planner's show switch does this through
  `showsHidden` on `PlannerDayGrid` instead of handing the grid an empty list.
- **A position that steps:** a ghost that is re-rendered at each snapped minute puts `top`,
  `height`, `left` and `width` in its transition, short (150 ms) so it keeps up with a quick drag.
  The element under the pointer stays transition-free: it follows the pointer through a transform,
  and a transition on it makes the drop fight the pointer.
- **Durations:** 150 ms for things that follow the pointer, 200–300 ms for everything else.

## Not covered

A hover colour or a focus ring is not a fade and keeps its own `transition-colors`. A control that
leaves because a different screen replaced it (the phone's search mode, a dialog) is a change of
view, not a fade.
