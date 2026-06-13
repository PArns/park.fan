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

## Inline image

![Welcome cover | A park.fan blog banner | center](/blog/images/welcome-cover.svg)

## Embeds (bare URL on its own line)

https://www.youtube.com/watch?v=dQw4w9WgXcQ

https://www.instagram.com/p/CzAbCdEfGhI/

https://suno.com/song/abc123

## Welcome-post replication

Spotlight rides (from the live welcome post):

[Taron](ref:phantasialand/taron?full)

[Maus au Chocolat](ref:phantasialand/maus-au-chocolat?full)

Weather widget with info-string slug (the real welcome post syntax):

\`\`\`weather-widget slug=phantasialand
\`\`\`

## Widget fences (attrs in body — TipTap drops info-string attrs on round-trip)

\`\`\`park-widget
slug: phantasialand
\`\`\`

\`\`\`weather-widget
slug: phantasialand
\`\`\`

\`\`\`stats-widget
slug: phantasialand
\`\`\`

\`\`\`attraction-widget
parkSlug: phantasialand
slug: black-mamba
\`\`\`

\`\`\`gallery-widget
folder: /blog/images
heading: Highlights
\`\`\`

## Glossary terms (should highlight at publish)

Live wait times power the entire site — we crunch crowd levels every minute.
`;

export default function BlogEditorDevTestPage() {
  const [md, setMd] = useState(SEEDED_MARKDOWN);
  return (
    <div className="container mx-auto max-w-[1400px] px-4 py-6">
      <header className="mb-4">
        <h1 className="text-foreground text-lg font-semibold">Blog editor — ref: preview test</h1>
        <p className="text-muted-foreground text-xs">
          No-auth isolated mount of EditorCanvas. Use this to verify the WYSIWYG annotation renders
          correctly before exposing the full editor.
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
