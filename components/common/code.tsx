/** The look of a block of code on a public page (a post's fenced block, an API example). */
export const CODE_BLOCK_CLASS = 'bg-muted overflow-x-auto rounded-xl p-4 text-sm';

/** The look of code inside running text: a path, a header name, a key prefix. */
export const INLINE_CODE_CLASS = 'bg-muted rounded px-1 py-0.5 font-mono text-[0.9em] break-words';

/** A block of code, kept on its lines and scrolling sideways on a phone rather than wrapping. */
export function CodeSample({ children }: { children: string }) {
  return (
    <pre className={CODE_BLOCK_CLASS}>
      <code className="font-mono">{children}</code>
    </pre>
  );
}
