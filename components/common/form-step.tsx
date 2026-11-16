/**
 * One numbered step of a public form (photo contribution, API key request): the number in a
 * tinted disc, the step's title as the `<h2>` inside the form's card, and its fields indented
 * under the title.
 */
export function FormStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2.5 text-lg font-semibold">
        <span className="bg-primary/15 text-primary flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold">
          {n}
        </span>
        {title}
      </h2>
      <div className="pl-9.5">{children}</div>
    </section>
  );
}
