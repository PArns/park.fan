import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Converts text to a URL-friendly slug
 * - Normalizes Unicode characters and removes diacritical marks (accents)
 * - Converts to lowercase
 * - Removes dots and special characters
 * - Replaces spaces with hyphens
 * - Cleans up multiple/leading/trailing hyphens
 *
 * @param text - The text to convert to a slug
 * @returns A URL-friendly slug string
 *
 * @example
 * toSlug("Café München") // returns "cafe-munchen"
 * toSlug("Walt Disney World") // returns "walt-disney-world"
 * toSlug("Six Flags Magic Mountain") // returns "six-flags-magic-mountain"
 */
export function toSlug(text: string): string {
  return text
    .normalize('NFD') // Normalize to decomposed form
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks (accents)
    .toLowerCase()
    .replace(/\./g, '') // Remove dots
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w\-]+/g, '') // Remove special characters except hyphens
    .replace(/\-\-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+/, '') // Remove leading hyphens
    .replace(/-+$/, ''); // Remove trailing hyphens
}

/**
 * Formats a slug back to a proper display name
 * - Converts kebab-case to Title Case
 * - Handles compound words properly (north-america -> North America)
 *
 * @param slug - The slug to format (e.g., "north-america", "united-states")
 * @returns A properly formatted display name (e.g., "North America", "United States")
 *
 * @example
 * formatSlugToTitle("north-america") // returns "North America"
 * formatSlugToTitle("united-states") // returns "United States"
 * formatSlugToTitle("epic-universe") // returns "Epic Universe"
 */
export function formatSlugToTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
