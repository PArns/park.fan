'use client';

import { useEffect, useState } from 'react';
import { formatDateTime, formatRelativeTime } from '../../lib/date-utils';

interface ClientTimeProps {
  timestamp: string;
  format?: 'relative' | 'absolute' | 'both';
  className?: string;
}

export function ClientTime({ timestamp, format = 'relative', className }: ClientTimeProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <span className={className}>Loading...</span>;
  }

  switch (format) {
    case 'absolute':
      return <span className={className}>{formatDateTime(timestamp)}</span>;
    case 'both':
      return (
        <span className={className} title={formatDateTime(timestamp)}>
          {formatRelativeTime(timestamp)}
        </span>
      );
    case 'relative':
    default:
      return <span className={className}>{formatRelativeTime(timestamp)}</span>;
  }
}
