# A quote names its source, and a legal claim names its side (REQUIREMENT)

One standing rule. It is indexed from the repo's [`CLAUDE.md`](../../CLAUDE.md), which carries the rule in one line and links here for the reasoning.

## The rule

A direct quote in a post, a sentence that a person, a company, a court filing or an authority said or wrote, is a `> [!QUOTE]` block. Its last paragraph is the source line: who, in what role, and where, with a link to the place the quote was read. A translated quote says so in that line. The block renders as `BlogQuote` (`components/blog/blog-quote.tsx`): a box, a quote mark, the words, and the source line under them as a `<figcaption>`. Syntax: [blog authoring guide](../../content/blog/README.md#quotes).

- Link where you read the quote. If it reached you through another outlet (a CNN quote read in UPI), name both.
- A fragment of a few words inside a sentence may stay inline in „…“, with the speaker named in the same sentence and the source in the list under the post.
- A `[!QUOTE]` block with a single paragraph renders without a source line. That is a quote without a source: add the line.
- A translated quote carries the original, verbatim, in an `[en] …` paragraph. Readers see it on hover or tap; `check:prose` warns when a source line says "translated" and the original is missing.

**Anything legal is attributed, never stated.** A lawsuit, an allegation, an injury a rider blames on a ride, a manufacturer's defence, an authority's investigation: each sentence says whose claim it is (`laut der Klage`, `die Anwälte von S&S hielten dagegen`, `laut AP`) until a court or the authority has decided it. Every such claim is checked against at least two sources, one of them as close to the record as possible: the filing, or local press that read the docket. Where sources disagree, use what the court record carries, or leave the detail out. Name a private person only where they went public themselves or a court case carries their name.

## Why

The first post to need it, the X2 closure at Six Flags Magic Mountain (30 September 2026), carries two deaths, brain injuries, settled and open lawsuits and a state investigation. Its first draft had two statements wrong in a way that matters. Six Flags' position ("daily inspections", no brain injury for a rider "seated normally") was attributed to a statement to CNN, but it came from earlier court filings; Six Flags does not comment on pending litigation. And the sources disagreed on facts a reader could check: AP counted five days between the two July injuries where three others and the lawsuit dates give six, and one outlet dated the Hawley settlement to 2025 while the court filing is from 26 August 2026.

A quote that shows where it came from lets the reader check it, and lets the next editor find the sentence to fix.
