'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MLSparkline as MLSparklineType } from './ml-sparkline';

const MLSparklineDynamic = dynamic(
  () => import('./ml-sparkline').then((m) => m.MLSparkline),
  { ssr: false }
);

export function MLSparklineLoader(props: ComponentProps<typeof MLSparklineType>) {
  return <MLSparklineDynamic {...props} />;
}
