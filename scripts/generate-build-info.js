#!/usr/bin/env node

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

try {
  // Read package.json for version
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const version = packageJson.version;

  // Generate build number - use timestamp or environment variable for Vercel
  let buildNumber = '0';

  // Check if we're in a Vercel environment
  if (process.env.VERCEL || process.env.VERCEL_ENV) {
    // Use Vercel's build ID or timestamp
    buildNumber = process.env.VERCEL_GIT_COMMIT_SHA
      ? parseInt(process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7), 16).toString()
      : Math.floor(Date.now() / 1000).toString();
    console.log('📦 Vercel deployment detected, using environment-based build number');
  } else {
    // Try to get git commit count for local builds
    try {
      buildNumber = execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn('⚠️  Could not get git commit count, using timestamp');
      buildNumber = Math.floor(Date.now() / 1000).toString();
    }
  }

  // Get current date as build date
  const buildDate = new Date().toISOString();

  // Get git commit hash - prefer environment variable in Vercel
  let gitHash = 'unknown';

  if (process.env.VERCEL_GIT_COMMIT_SHA) {
    gitHash = process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7);
    console.log('📦 Using Vercel git commit hash');
  } else {
    try {
      gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch (error) {
      console.warn('⚠️  Could not get git hash, using unknown');
    }
  }

  const buildInfo = {
    version,
    buildNumber,
    buildDate,
    gitHash,
  };

  // Create a TypeScript file for compile-time access
  const buildInfoTs = `// Auto-generated build information
export const BUILD_INFO = ${JSON.stringify(buildInfo, null, 2)} as const;
`;

  // Ensure lib directory exists
  const libDir = path.join(__dirname, '..', 'lib');
  if (!fs.existsSync(libDir)) {
    fs.mkdirSync(libDir, { recursive: true });
  }

  fs.writeFileSync(path.join(libDir, 'build-info.ts'), buildInfoTs);

  console.log('✅ Build info generated:');
  console.log(`   Version: ${version}`);
  console.log(`   Build: ${buildNumber}`);
  console.log(`   Date: ${buildDate}`);
  console.log(`   Git: ${gitHash}`);
} catch (error) {
  console.error('❌ Error generating build info:', error);
  process.exit(1);
}
