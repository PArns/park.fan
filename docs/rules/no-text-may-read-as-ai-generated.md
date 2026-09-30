# No text may read as AI-generated (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here. The full rulebook, with the measurements and the counter-examples, is **[docs/blog.md](../blog.md)**; this page is the short version and the list of what the machine checks.

It covers **every string a human ever sees**: posts, UI strings, glossary definitions, `alt` and `caption`, meta titles and descriptions, FAQ answers, empty states, the changelog, the agent skills, commit messages and PR bodies. A reader who smells a language model stops trusting the numbers next to it, and the numbers are the product.

## What slop is

Merriam-Webster's word of 2025: "digital content of low quality that is produced usually in quantity by means of artificial intelligence". Wikipedia's field guide gives the mechanism: a model regresses to the most likely sentence, so its output drifts toward "advertisement-like writing, or … the prose of a travel guide". A theme-park site is a travel guide, which is why this rule is strict here. Every fix below puts back a specific fact the average sentence replaced.

## Fixed on sight

- **The aphoristic closer** and its sibling, **the wink**: a short line at the end of a post, section or paragraph that restates the point as a maxim or a joke (`Sie ist nicht die Antwort. Sie ist die Frage.`, `…, und genau das ist die Aussage.`). Cover the last sentence; if only a feeling of closure is lost, cut it. [§2.8, §2.17]
- **`nicht X, sondern Y`** at the edge of a section, and its 2026 form, the contrast reframe (`It isn't a queue, it's a waiting room`). [§2.1]
- **An honesty or authenticity claim**: `ehrlich` in any form, `echte Wartezeiten`, `real wait-time data`. Say where the numbers come from instead. [§3.3]
- **An invented detail, a placeholder, or a gap with no owner**: a first-person visit that did not happen, `[Park Name]`, `nicht öffentlich dokumentiert`. `Six Flags sagt nicht, ob …` names who is silent; that is information. [§1.8, §1.9]
- **A heading that asks and then gives an order**: `Welche Bahnen darf mein Kind fahren? Nach Körpergröße nachsehen`. [§5.6]

## House rules

1. Never `ehrlich`, and never announce the data as real. [§3.3]
2. Never narrate the sign at the entrance (`das Schild`, `the sign`, …). Write `Am Eingang stehen 70 Minuten.` [§3.3]
3. No coined metaphor-currencies (`Wartezeit-Währung`). [§3.3]
4. Copy never describes the page's own layout: `links … rechts` is wrong on every phone. [§3.3]
5. **Im Deutschen `Warteschlange`, nie `Schlange`**; the verb is `anstehen`. Only a proper name for the animal is exempt (`Schlange von Midgard`). [§3.3]
6. **Things do not talk.** A queue shows nothing, a number says nothing, a calendar knows nothing: not `was die Warteschlangen gerade anzeigen`, not `zeigt der Kalender`, not `die Daten sagen`. Write what is there and where. [§2.13]
7. No em dash in reader-facing prose; German takes `–`. House style, not a detection claim. [§4.1]

## The tells that survive a vocabulary pass

Sentence shape is what marks a text, not words: the participial tail (`…, making it`, `…, was den Nervenkitzel steigert`), the teaser (`Dann wurde es kurios.`), colon pivots, staccato, the product as protagonist, answering objections nobody raised, and in English a text that never contracts and therefore reads translated. Captions are judged as a series: six in a row with the same skeleton, or seven punchlines with the same beat, are a template. [§2, §5.2, §6]

What no check sees is whether a sentence claims anything. Two tests settle it: the **deletion test** (cut it; did the paragraph lose a fact?) and the **transplant test** (would it sit unchanged in an article about another park?). [§1.7]

## What the machine checks

`pnpm check:prose` walks the posts, the six catalogs, every media sidecar, the glossary per term, the content pages and their `page.tsx` hero copy, the homepage announcement, the changelog, the agent skills and `/llms.txt`.

- **Errors** (no exception exists): a non-signature `—` in a post or in German or Dutch prose, a catalog's em-dash count above its baseline, an honesty claim or chat register in a string that is about us, placeholder text, `Schlange` in German, a German quote closed with a straight `"`, Markdown or `—` in a plain-text frontmatter field, a `[!QUOTE]` without a source line.
- **Warnings** (a person decides): everything else in docs/blog.md that a regex can count, reported with the rule's section number.

It found its first real error on its first run (`Ehrliche Reiseberichte` in `blog.intro`, six languages), and the widened scope of 2026-09-30 found the next ones: three em dashes in the Dutch hero of the best-time page and eleven straight quotes in the legal pages. A green check is the floor. The review pass in [docs/blog.md §7.2](../blog.md#72-the-review-pass) is the rest.

Related: [blog authoring guide](../../content/blog/README.md#8-writing-style-requirement), [image text](../../public/media/README.md), [blog writing style](blog-writing-style.md).
