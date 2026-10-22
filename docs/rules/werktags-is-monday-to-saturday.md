# „Werktags" is Monday to Saturday (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning.

## The rule

In German a **Werktag is every day that is not a Sunday or a public holiday, Saturday included**. „Werktags" therefore means Monday to Saturday, never Monday to Friday. Where the site means Monday to Friday, it writes **„Mo–Fr"**. In running text it writes „Montag bis Freitag" or „unter der Woche". This applies to UI strings, posts, alt text and captions alike.

The same trap exists in Italian: a _giorno feriale_ is any day that is not a holiday, so _giorni feriali_ includes Saturday too. Monday to Friday is „lun–ven", or „dal lunedì al venerdì" in running text.

| Locale | Monday to Friday, in a label | Wrong                   |
| ------ | ---------------------------- | ----------------------- |
| de     | Mo–Fr                        | Werktags, Werktage      |
| it     | lun–ven                      | giorni feriali, feriali |
| en     | Weekdays                     |                         |
| nl     | doordeweeks                  |                         |
| fr     | en semaine                   |                         |
| es     | entre semana                 |                         |

The German and Italian labels are written as the span `formatWeekdayList` (`lib/utils/day-runs.ts`) would print anyway („Di–Fr", „lun–ven"), so a five-day quiet end and a four-day one look like the same kind of thing.

A post that **defines** the word before using it, for example „Werktage, also Montag bis Freitag ohne Feiertag", is fine: the definition is right there. So is a sentence or a label pair that sets the word against the weekend in the same breath, like the ride chart's „Feriali" next to „Fine settimana" in Italian. On its own, as a label for a list of days, readers take the legal meaning.

## Why

`parkBestDays.weekdays` read „Werktags" in German and „giorni feriali" in Italian. It is the label the park header prints when all five days from Monday to Friday are its quiet end. On 2026-10-22 the blog comparison table started printing the same label for Phantasialand, and Patrick caught it in review. Both labels now read „Mo–Fr" and „lun–ven".
