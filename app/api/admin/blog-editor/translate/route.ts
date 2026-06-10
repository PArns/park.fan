import { NextResponse } from 'next/server';
import type { BlogFrontmatter } from '@/lib/blog/types';
import { requireAdminPass } from '@/lib/admin/verify-pass';

interface TranslateBody {
  sourceLocale: string;
  targetLocale: string;
  frontmatter: BlogFrontmatter;
  body: string;
}

const LANG_LABEL: Record<string, string> = {
  en: 'English',
  de: 'German',
  nl: 'Dutch',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
};

const MODEL = process.env.BLOG_EDITOR_TRANSLATE_MODEL ?? 'claude-sonnet-4-5';
const TOKEN_HINT =
  'Set ANTHROPIC_API_KEY (or BLOG_EDITOR_ANTHROPIC_API_KEY) on the deployment to enable AI translation.';

/**
 * Hand the source post (frontmatter + markdown body) to Claude and ask for an
 * in-place translation. The model is told to preserve our markdown syntax
 * verbatim — fenced widgets, `ref:` links, ?full cards, embeds — so the round
 * trip stays structural. Only natural-language fields get rewritten; slugs,
 * dates, the author key and the SEO-keywords array are left untouched.
 */
export async function POST(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;
  const key = process.env.BLOG_EDITOR_ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY;
  if (!key) return NextResponse.json({ error: TOKEN_HINT }, { status: 500 });

  let payload: TranslateBody;
  try {
    payload = (await req.json()) as TranslateBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { sourceLocale, targetLocale, frontmatter, body } = payload;
  const sourceLabel = LANG_LABEL[sourceLocale] ?? sourceLocale;
  const targetLabel = LANG_LABEL[targetLocale] ?? targetLocale;

  const userPrompt = [
    `Translate the following park.fan blog post from ${sourceLabel} into ${targetLabel}.`,
    '',
    'Rules:',
    '- Preserve ALL markdown syntax exactly as-is: headings, lists, links, code fences, tables.',
    '- Preserve ALL custom blocks unchanged: `ref:slug?full` cards, ```weather-widget``` and other',
    '  ```*-widget``` fences with their slug/parkSlug attributes, YouTube/Instagram/Suno embed lines.',
    '- Translate only natural-language text — link labels and the body around them.',
    '- Keep the same paragraph structure and line breaks; do not invent or skip paragraphs.',
    '- Keep proper nouns (park names, ride names, place names, brand names) untouched.',
    '- The "voice" of park.fan is friendly, witty, knowledgeable. Keep that energy in the target',
    `  language — translate idioms with idioms, not literally.`,
    '',
    'Output strictly as compact JSON with this shape:',
    '{ "title": "...", "excerpt": "...", "seoTitle": "...", "seoDescription": "...", "body": "..." }',
    '- title, excerpt and body are required.',
    '- seoTitle / seoDescription: include if a translation is meaningful; omit otherwise.',
    '- Do not wrap the JSON in markdown fences. No commentary. Just the JSON object.',
    '',
    `Source title: ${frontmatter.title}`,
    `Source excerpt: ${frontmatter.excerpt}`,
    frontmatter.seo?.title ? `Source SEO title: ${frontmatter.seo.title}` : '',
    frontmatter.seo?.description ? `Source SEO description: ${frontmatter.seo.description}` : '',
    '',
    'Source body (markdown):',
    '---',
    body,
    '---',
  ]
    .filter(Boolean)
    .join('\n');

  let res: Response;
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 8192,
        messages: [{ role: 'user', content: userPrompt }],
      }),
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Network error contacting Anthropic: ${(e as Error).message}` },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: `Anthropic API ${res.status}: ${text.slice(0, 400)}` },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const raw = data.content?.find((c) => c.type === 'text')?.text ?? '';

  // Strip an accidental code fence (sometimes the model wraps the JSON even though we asked not to).
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*\n/, '')
    .replace(/\n```$/, '')
    .trim();

  let parsed: {
    title: string;
    excerpt: string;
    body: string;
    seoTitle?: string;
    seoDescription?: string;
  };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return NextResponse.json(
      { error: 'Model returned unparseable output', raw: cleaned.slice(0, 600) },
      { status: 502 }
    );
  }
  if (!parsed.title || !parsed.excerpt || !parsed.body) {
    return NextResponse.json(
      { error: 'Translation missing required fields (title/excerpt/body)' },
      { status: 502 }
    );
  }

  return NextResponse.json(parsed);
}
