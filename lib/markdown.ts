import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface MarkdownContent<T = Record<string, unknown>> {
  frontmatter: T;
  content: string;
}

export function getMarkdownContent<T = Record<string, unknown>>(
  relativePath: string
): MarkdownContent<T> | null {
  try {
    const contentRoot = path.resolve(process.cwd(), 'content');
    const fullPath = path.resolve(contentRoot, relativePath);
    if (!fullPath.startsWith(contentRoot + path.sep)) {
      console.error(`Path traversal attempt blocked: ${relativePath}`);
      return null;
    }

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      frontmatter: data as T,
      content: content,
    };
  } catch (error) {
    console.error(`Error reading markdown file at ${relativePath}:`, error);
    return null;
  }
}
