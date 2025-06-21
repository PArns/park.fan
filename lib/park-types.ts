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
