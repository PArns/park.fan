import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PARKS_IMAGE_DIR = path.join(process.cwd(), 'public', 'images', 'parks');

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, file));
    }
  });

  return arrayOfFiles;
}

export async function GET() {
  try {
    if (!fs.existsSync(PARKS_IMAGE_DIR)) {
      return NextResponse.json({ backgrounds: [] });
    }

    const allFiles = getAllFiles(PARKS_IMAGE_DIR);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

    const backgrounds = allFiles
      .filter((filePath) => imageExtensions.includes(path.extname(filePath).toLowerCase()))
      .map((filePath) => {
        const relativePath = path.relative(path.join(process.cwd(), 'public'), filePath);
        return `/${relativePath.replace(/\\/g, '/')}`;
      });

    return NextResponse.json({ backgrounds });
  } catch (error) {
    console.error('Error scanning park backgrounds:', error);
    return NextResponse.json({ error: 'Failed to scan backgrounds' }, { status: 500 });
  }
}
