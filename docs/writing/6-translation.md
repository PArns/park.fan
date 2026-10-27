# 6. German is the source; the other five are derived

Chapter 6 of the [writing rules](README.md): how the English, Dutch, French, Spanish and Italian
versions of a post or a UI string are written from the German, what stays identical across the six
files, and the typography of each language. Open it before translating anything.

German is written first and the other locales come from it, in the same pull request and with the
same `updatedAt`
([a post ships in six languages in one pull request](../rules/a-post-ships-in-six-languages-in-one-pull-request.md)).

**Mirror translation is the failure.** A sentence carried across word for word keeps German word
order and sentence length and reads translated in all five targets. Write each locale as its own
sentence, and let a language that wants a different order have it.

**Typography per language.** The em-dash ban is universal (§4.1); the rest is not:

- **de**: quotes `„…“`; spaced Halbgeviertstrich `–`; `du`; no title case; decimal comma, `.` for
  thousands
- **en**: quotes `"…"`; decimal point, `,` for thousands
- **nl**: quotes `“…”`, never the German `„` (`check:prose` warns); `je`; watch German-style
  compounds
- **fr**: `« … »`; a no-break space before `?` `!` `:` `;` and inside the guillemets
- **es**: `«…»` or `"…"`; the opening `¿` and `¡` are not optional
- **it**: `«…»` or `“…”`, both correct; pick one per post

**What stays identical, and what does not.** The same in all six files: `translationKey`, `date`,
`time`, `mode`, `featured`, `category`, `parkLinks`, `rideLinks`, `coverImage.src` and
`coverImage.credit`, the chapters in the same order, the widget fences and the `ref:` links.
Written per language: `title`, `excerpt`, `seo.*`, the cover's `alt` and `caption`, and the tags,
in the same order (the tag pages match them by position, see the
[blog authoring guide](../../content/blog/README.md#4-categories--tags)). The facts are the same in
all six, none added and none dropped, and the five derived texts land within about a quarter of the
German word count. A link to another post points to that post's slug in the same language. A slug
made only of names is the same in all six; a slug with German words in it gets its own per
language. A `[!QUOTE]` stays in the language it was said in, with a translation note
([blog authoring guide](../../content/blog/README.md#quotes)). A joke is rewritten, not translated
(§0.1).

**A fix goes into all six.** A sentence a rule or the critic caught in German is changed in every
locale, also where the check did not fire on the translation: the habit usually survived the
translation in other words. The critic reads German and English; in Dutch, French, Spanish and
Italian the spots are found from its findings.

**UI strings follow the same direction.** A key is written in `messages/de.json` first and ships in
all six catalogs in the same PR. The failure is the German string carried into the other five
because the key has to exist there: `pnpm validate:translations` compares only the keys, and
`pnpm check:untranslated` is what catches the German value.

**English needs its own pass**, not a translation. The English tell list (§3.2) is better
documented than the German one, and a German sentence rendered literally often lands on it
(`stellt dar` → `serves as`). Contractions are normal English (`don't`, `it's`); a post that writes
`do not` and `it is` throughout reads translated, and in September 2026 sixteen of the 22 English
posts carried two contractions or fewer. A full form stays where it carries stress
(`it **is** open on Mondays`) or in the legal pages; everywhere else, contract. `check:prose` warns
when fewer than a quarter of the forms in an English text of 500 words or more are contracted; it
does not check the glossary, where a reference register is fine.

This is a rule about sounding translated, not about sounding human. Contraction rates within one
2026 model cohort range from 1,200 to over 30,000 per million words, and `it isn't X, it's Y` is a
model shape (§2.1). Contract where English speakers do; never contract to look human. The 25 % is
a floor, not a target: a post that takes every natural contraction lands between 90 and 95 %,
because forms like `what it is` cannot contract.
