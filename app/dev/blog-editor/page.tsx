'use client';

import { Suspense, useState } from 'react';
import { EditorCanvas } from '@/app/admin/blog-editor/_components/editor-canvas';
import { MarkdownPreview } from '@/app/admin/blog-editor/_components/markdown-preview';

const SEEDED_MARKDOWN = `# Ref preview rendering test

## Park variants

- info → [Phantasialand](ref:/parks/europe/germany/bruehl/phantasialand?info)
- bare → [Phantasialand](ref:/parks/europe/germany/bruehl/phantasialand?bare)
- long → [Phantasialand](ref:/parks/europe/germany/bruehl/phantasialand?long)
- full (renders as block at publish — inline here) →
  [Phantasialand](ref:/parks/europe/germany/bruehl/phantasialand?full)

## Ride variants

- info → [Black Mamba](ref:/parks/europe/germany/bruehl/phantasialand/black-mamba?info)
- bare → [Black Mamba](ref:/parks/europe/germany/bruehl/phantasialand/black-mamba?bare)
- full → [Black Mamba](ref:/parks/europe/germany/bruehl/phantasialand/black-mamba?full)

## Short-form legacy refs

- Park (legacy) → [Europa Park](ref:europa-park?info)
- Ride (legacy slash) → [Voltron](ref:europa-park/voltron-nevera?info)

## Prose flow

Visit [Phantasialand](ref:/parks/europe/germany/bruehl/phantasialand?info) and ride
[Black Mamba](ref:/parks/europe/germany/bruehl/phantasialand/black-mamba?info)
back-to-back. The [bare](ref:/parks/europe/germany/bruehl/phantasialand?bare)
variant blends quietly into the sentence with no annotation, while
[long](ref:/parks/europe/germany/bruehl/phantasialand?long) keeps the city +
country pair.
`;

export default function BlogEditorDevTestPage() {
  const [md, setMd] = useState(SEEDED_MARKDOWN);
  return (
    <div className="container mx-auto max-w-[1400px] px-4 py-6">
      <header className="mb-4">
        <h1 className="text-foreground text-lg font-semibold">
          Blog editor — ref: preview test
        </h1>
        <p className="text-muted-foreground text-xs">
          No-auth isolated mount of EditorCanvas. Use this to verify the WYSIWYG
          annotation renders correctly before exposing the full editor.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(360px,42%)]">
        <Suspense fallback={null}>
          <EditorCanvas initialMarkdown={md} onMarkdownChange={setMd} />
        </Suspense>
        <MarkdownPreview value={md} />
      </div>
    </div>
  );
}
