/** The inline `[label](href)` link a glossary definition may carry; groups are label and href. */
export const GLOSSARY_LINK_SOURCE = String.raw`\[([^\]]+)\]\(([^)\s]+)\)`;

/**
 * A definition as plain text, each link reduced to its label. For places that cannot render a
 * link (JSON-LD, meta description), which would otherwise print the raw markdown.
 */
export function glossaryPlainText(text: string): string {
  return text.replace(new RegExp(GLOSSARY_LINK_SOURCE, 'g'), '$1');
}
