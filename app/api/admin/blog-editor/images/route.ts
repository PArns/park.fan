import 'server-only';
import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { requireAdminPass } from '@/lib/admin/verify-pass';

const IMG_RE = /\.(jpe?g|png|webp|avif|svg|gif)$/i;
const ROOT = path.resolve(process.cwd(), 'public', 'blog', 'images');

interface BlogImage {
  /** Public URL, e.g. `/blog/images/welcome-cover.svg`. */
  src: string;
  /** Subfolder under public/blog/images, or '' for top level. */
  folder: string;
  name: string;
}

function walk(dir: string, rel = ''): BlogImage[] {
  if (!fs.existsSync(dir)) return [];
  const out: BlogImage[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const child = rel ? `${rel}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...walk(path.join(dir, e.name), child));
    } else if (IMG_RE.test(e.name)) {
      out.push({ src: `/blog/images/${child}`, folder: rel, name: e.name });
    }
  }
  return out;
}

/**
 * Lists every image under public/blog/images, walking subfolders so per-post
 * galleries show up too. Returns the images grouped by their folder so the
 * picker can render them as labelled sections. Sorting newest-first via mtime
 * surfaces the image you just added at the top.
 */
export async function GET(req: Request) {
  const unauthorized = await requireAdminPass(req);
  if (unauthorized) return unauthorized;
  const images = walk(ROOT).map((img) => {
    let mtime = 0;
    try {
      mtime = fs.statSync(path.join(ROOT, img.src.replace('/blog/images/', ''))).mtimeMs;
    } catch {
      /* ignore */
    }
    return { ...img, mtime };
  });
  images.sort((a, b) => b.mtime - a.mtime);
  return NextResponse.json({ images });
}
