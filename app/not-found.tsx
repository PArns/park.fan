'use client';

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-muted mb-4">404</div>
          <div className="text-4xl mb-4">🎢</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Page Not Found</h1>
          <p className="text-muted-foreground">
            This roller coaster seems to have taken a wrong turn! The page you&apos;re looking for
            doesn&apos;t exist.
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>

            <Button variant="outline" onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            Or explore our{' '}
            <Link href="/parks" className="text-primary hover:underline">
              Parks
            </Link>{' '}
            directory
          </div>
        </div>
      </div>
    </div>
  );
}
