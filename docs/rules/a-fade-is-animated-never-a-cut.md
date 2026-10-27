# A fade is animated, never a cut (REQUIREMENT)

Anything that changes its opacity or its visibility does it over a transition.

- **A state change on a mounted element:** the transition names `opacity`. `transition-colors` does
  not, which is how the planner's dimmed arrows, ticked entries and unticked fit rows switched in one
  frame while their colours eased. Use `transition` or list the property.
- **An element that appears:** `starting:opacity-0` with an opacity transition. `@starting-style`
  gives the first frame a value to transition from, so a mount fades in without an effect or a
  second render.
- **An element that goes away:** keep it mounted with `invisible opacity-0` and
  `transition-[opacity,visibility]`. `visibility` is discrete and flips at the end of the fade out,
  so a hidden element takes no press and Playwright's `:visible` stops matching it once the fade is
  over. The planner's show switch does this through `showsHidden` on `PlannerDayGrid` instead of
  handing the grid an empty list.
- **A position that steps:** a ghost re-rendered at each snapped minute puts `top`, `height`, `left`
  and `width` in a short (150 ms) transition. The element under the pointer stays transition-free:
  it follows the pointer through a transform, and a transition on it makes the drop fight the
  pointer.
- **Durations:** 150 ms for what follows the pointer, 200–300 ms for everything else.

Not covered: a hover colour or a focus ring keeps its own `transition-colors`, and a control that
leaves because a different screen replaced it (the phone's search mode, a dialog) is a change of
view, not a fade.

## Why

The PO: „Generell will ich alle Fades animiert haben, und nicht harte Übergänge" (PAR-482 follow-up),
after the planner's show marks went from a full pill to 20 % in one frame and the ghost of a dragged
block moved in five-minute steps.
