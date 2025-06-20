import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Optimize bundle splitting and tree shaking
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      'tailwindcss', 
      '@tailwindcss/postcss',
      'class-variance-authority',
      'clsx',
      'tailwind-merge'
    ],
  },
  
  // Compress and optimize output
  compress: true,
  
  // Image optimization
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
