'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { MLSparkline as MLSparklineType } from './ml-sparkline';

const MLSparklineDynamic = dynamic(() => import('./ml-sparkline').then((m) => m.MLSparkline), {
  ssr: false,
});

/**
 * Renders `MLSparkline`, the chart of a model metric's history, on the client only (`next/dynamic`
 * with `ssr: false`). Takes the same props.
 */
export function MLSparklineLoader(props: ComponentProps<typeof MLSparklineType>) {
  return <MLSparklineDynamic {...props} />;
}
