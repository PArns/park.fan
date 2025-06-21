/**
 * Central configuration for the Park.Fan Next.js application
 */

// Cache time in seconds (5 minutes)
export const CACHE_REVALIDATE_TIME = 300;

// List of possible continents for static params generation
// This list is based on the actual continents available in the API
export const POSSIBLE_CONTINENTS = ['europe', 'north-america', 'asia', 'south-america'] as const;

export type PossibleContinent = (typeof POSSIBLE_CONTINENTS)[number];

// API base URL
export const API_BASE_URL = 'https://api.park.fan';

// User agent for API requests
export const API_USER_AGENT = 'park.fan-dashboard/1.0';

// API request headers
export const API_HEADERS = {
  Accept: 'application/json',
  'User-Agent': API_USER_AGENT,
} as const;

// Next.js revalidate configuration for API requests
export const API_REVALIDATE_CONFIG = {
  next: { revalidate: CACHE_REVALIDATE_TIME },
} as const;
