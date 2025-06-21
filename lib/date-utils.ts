/**
 * Utility functions for formatting dates and times in the user's locale
 */

/**
 * Formats a date/time string to the user's locale with full date and time
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a date string to the user's locale with date only
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a time string to the user's locale with time only
 */
export function formatTime(dateString: string): string {
  return new Date(dateString).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Formats a relative time (e.g., "2 minutes ago")
 */
export function formatRelativeTime(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
}

/**
 * Formats a number according to the user's locale
 */
export function formatNumber(value: number): string {
  return value.toLocaleString();
}

/**
 * Formats a percentage according to the user's locale
 * @param value - The percentage value (0-100 range, e.g., 85 for 85%)
 * @param decimals - Number of decimal places to show
 */
export function formatPercentage(value: number, decimals: number = 0): string {
  // Convert from 0-100 range to 0-1 range for toLocaleString
  return (value / 100).toLocaleString(undefined, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
