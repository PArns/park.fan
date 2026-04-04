'use client';

import { useState, useEffect } from 'react';

/** Returns true only after the component has mounted on the client. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  return mounted;
}
