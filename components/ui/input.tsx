/** Text input primitives (shadcn/ui): a styled `<input>`, `<textarea>` and `<select>` with focus and invalid states. */
import * as React from 'react';

import { cn } from '@/lib/utils';

/** The look every text field shares: border, focus ring, invalid state, disabled state. */
const FIELD_CLASS = cn(
  'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
);

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        FIELD_CLASS,
        'file:text-foreground h-9 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium',
        className
      )}
      {...props}
    />
  );
}

/** A multi-line text field with the input's look; grows with `rows`, resizes vertically. */
function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(FIELD_CLASS, 'min-h-20 resize-y py-2', className)}
      {...props}
    />
  );
}

/** A native `<select>` with the input's look, so the phone's own picker opens. */
function NativeSelect({ className, ...props }: React.ComponentProps<'select'>) {
  return <select data-slot="select" className={cn(FIELD_CLASS, 'h-9', className)} {...props} />;
}

export { Input, NativeSelect, Textarea };
