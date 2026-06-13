'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  value: string;
  onChange?: (next: string) => void;
}

/**
 * Editable `.md` source view. When `onChange` is wired the textarea is the
 * source of truth for the canvas — TipTap's setContent picks up changes via
 * the parent state. Read-only when `onChange` is omitted (keeps the prop
 * shape forwards-compatible if a caller just wants a viewer).
 *
 * Layout: terminal-style monospace + gutter with 1-indexed line numbers that
 * stays glued to the textarea on scroll (single scrollable parent).
 */
export function MarkdownPreview({ value, onChange }: MarkdownPreviewProps) {
  const [copied, setCopied] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Compute line numbers from the live value. `\n` count + 1 — empty string
  // is still "line 1", a single trailing newline still adds the empty line.
  const lineCount = useMemo(() => Math.max(1, value.split('\n').length), [value]);

  // Keep the gutter in lockstep with the textarea's scroll position. Without
  // this the line numbers visibly drift as the user scrolls through a long
  // post.
  useEffect(() => {
    const ta = taRef.current;
    const gutter = gutterRef.current;
    if (!ta || !gutter) return;
    const sync = () => {
      gutter.scrollTop = ta.scrollTop;
    };
    ta.addEventListener('scroll', sync, { passive: true });
    return () => ta.removeEventListener('scroll', sync);
  }, []);

  return (
    <div className="border-border/60 bg-background/40 flex h-[calc(100vh-12rem)] flex-col overflow-hidden rounded-2xl border backdrop-blur-sm">
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2.5">
        <div className="text-muted-foreground text-[10px] font-semibold tracking-wider uppercase">
          .md source {onChange && '· editable'}
        </div>
        <button
          type="button"
          onClick={copy}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors',
            copied
              ? 'bg-emerald-500/15 text-emerald-500'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="md-source-editor relative flex flex-1 overflow-hidden font-mono text-[12.5px] leading-[1.6]">
        <div
          ref={gutterRef}
          aria-hidden
          className="text-muted-foreground/50 border-border/40 overflow-hidden border-r px-2 py-3 text-right select-none"
          style={{
            // Keep the gutter exactly in sync with the textarea's per-line
            // metrics so the numbers line up at every scroll position.
            lineHeight: '1.6',
          }}
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        {onChange ? (
          <textarea
            ref={taRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            wrap="off"
            placeholder="# Untitled\n\nStart writing here…"
            className="text-foreground/90 placeholder:text-muted-foreground/50 flex-1 resize-none overflow-auto bg-transparent px-3 py-3 outline-none"
            style={{
              fontFamily:
                "ui-monospace, SFMono-Regular, 'JetBrains Mono', 'Fira Code', Menlo, Consolas, monospace",
              lineHeight: '1.6',
              tabSize: 2,
            }}
          />
        ) : (
          <pre
            ref={taRef as unknown as React.RefObject<HTMLPreElement>}
            className="text-foreground/90 flex-1 overflow-auto px-3 py-3"
            style={{ lineHeight: '1.6' }}
          >
            {value || (
              <span className="text-muted-foreground/50">
                # Untitled{'\n\n'}Start writing to the left.
              </span>
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
