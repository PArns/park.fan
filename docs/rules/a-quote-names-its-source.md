# A quote names its source, and a legal claim names its side (REQUIREMENT)

- **A direct quote is a `> [!QUOTE]` block whose last paragraph names the source**: who, in what
  role, and where, linked to the place the quote was read. If it reached us through another outlet
  (a CNN quote read in UPI), name both. A translated quote says so and carries the original verbatim.
  A fragment of a few words inside a sentence may stay inline in „…", with the speaker named in the
  same sentence and the source in the list under the post. The block's syntax is in the
  [blog authoring guide → quotes](../../content/blog/README.md#quotes).
- **Anything legal is attributed, never stated.** A lawsuit, an allegation, an injury a rider blames
  on a ride, a manufacturer's defence, an authority's investigation: each sentence says whose claim it
  is (`laut der Klage`, `die Anwälte von S&S hielten dagegen`, `laut AP`) until a court or the
  authority has decided it. Every such claim is checked against at least two sources, one of them as
  close to the record as possible (the filing, or local press that read the docket); where sources
  disagree, use the court record or leave the detail out. Name a private person only where they went
  public themselves or a court case carries their name.
- **This covers the legal claim, not the whole story.** A news post tells what happened in its own
  words and names its outlets once, in the first paragraph and the `Quellen:` line
  ([writing rules §5.0](../writing/5-posts-and-news.md#50-news-posts-category-news)): police at the scene or a closed ride
  that two independent sources report is stated as a fact. Who is to blame, what a filing alleges and
  what a side answers stay attributed in every sentence.

## Why

The first post to need it, the X2 closure at Six Flags Magic Mountain (30 September 2026), carries
two deaths, brain injuries, settled and open lawsuits and a state investigation. Its first draft got
two things wrong in a way that matters: Six Flags' position was attributed to a statement to CNN but
came from earlier court filings, and the sources disagreed on checkable facts (five days between two
injuries in AP, six in three others and the lawsuit; a settlement dated 2025 by one outlet and 26
August 2026 by the filing). A quote that shows where it came from lets the reader check it, and lets
the next editor find the sentence to fix.

## Check

`pnpm check:prose` fails a `[!QUOTE]` block without a source line and warns when a source line says
"translated" and the original is missing.
