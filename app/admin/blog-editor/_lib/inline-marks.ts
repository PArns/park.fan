import type { Editor } from '@tiptap/core';
import { Bold, Code, Italic, Link as LinkIcon, Strikethrough, type LucideIcon } from 'lucide-react';

/** Asks for a link target and sets it on the selection; an empty answer removes the link. */
function promptForLink(editor: Editor): void {
  const prev = editor.getAttributes('link').href as string | undefined;
  const url = window.prompt(
    'URL (https://… / mailto:… / `ref:slug` / `ref:park/ride[?full]`)',
    prev ?? ''
  );
  if (url === null) return;
  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    return;
  }
  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
}

/** The text marks the bubble menu and the fixed toolbar both offer, in their order. */
export const INLINE_MARKS: ReadonlyArray<{
  mark: 'bold' | 'italic' | 'strike' | 'code' | 'link';
  label: string;
  icon: LucideIcon;
  apply: (editor: Editor) => void;
}> = [
  {
    mark: 'bold',
    label: 'Bold (⌘B)',
    icon: Bold,
    apply: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    mark: 'italic',
    label: 'Italic (⌘I)',
    icon: Italic,
    apply: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    mark: 'strike',
    label: 'Strikethrough',
    icon: Strikethrough,
    apply: (editor) => editor.chain().focus().toggleStrike().run(),
  },
  {
    mark: 'code',
    label: 'Inline code',
    icon: Code,
    apply: (editor) => editor.chain().focus().toggleCode().run(),
  },
  { mark: 'link', label: 'Link (⌘K)', icon: LinkIcon, apply: promptForLink },
];
