import fs from 'fs';
import path from 'path';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

export function getParkBackgroundImage(parkSlug: string): string | null {
  const publicDir = path.join(process.cwd(), 'public');
  const parkDir = `images/parks/${parkSlug}`;

  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${parkDir}/background${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      return `/${relativePath}`;
    }
  }

  return null;
}

export function getAttractionBackgroundImage(
  parkSlug: string,
  attractionSlug: string
): string | null {
  const publicDir = path.join(process.cwd(), 'public');
  const attractionDir = `images/parks/${parkSlug}/attractions`;

  // Try to find specific attraction image
  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${attractionDir}/${attractionSlug}${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      return `/${relativePath}`;
    }
  }

  // Fallback to park background
  return getParkBackgroundImage(parkSlug);
}
