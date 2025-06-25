// Common park-related types used across components
export interface SimplePark {
  id: number;
  name: string;
  country: string;
  continent?: string;
  hierarchicalUrl: string;
  operatingStatus: {
    isOpen: boolean;
    openRideCount: number;
    totalRideCount: number;
    operatingPercentage: number;
  };
  averageWaitTime?: number;
}

export interface ParkListProps {
  parks: SimplePark[];
  showWaitTime?: boolean;
  emptyMessage?: string;
}

export interface ParkStatsProps {
  totalParks: number;
  openParks: number;
  totalRides: number;
  openRides: number;
}

// Simplified results for search/autocomplete
export interface SearchParkResult {
  id: number;
  name: string;
  country: string;
  hierarchicalUrl: string;
}

export interface SearchRideResult {
  id: number;
  name: string;
  parkName: string;
  hierarchicalUrl: string;
}
