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

  // First, try to find attraction image in park's main directory (e.g., images/parks/phantasialand/taron.jpg)
  const parkDir = `images/parks/${parkSlug}`;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${parkDir}/${attractionSlug}${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      return `/${relativePath}`;
    }
  }

  // Second, try to find in attractions subdirectory (e.g., images/parks/phantasialand/attractions/taron.jpg)
  const attractionDir = `${parkDir}/attractions`;
  for (const ext of SUPPORTED_EXTENSIONS) {
    const relativePath = `${attractionDir}/${attractionSlug}${ext}`;
    const fullPath = path.join(publicDir, relativePath);
    if (fs.existsSync(fullPath)) {
      return `/${relativePath}`;
    }
  }

  // Return null if no attraction-specific image is found
  // Fallback to park background should be handled by the calling code
  return null;
}
