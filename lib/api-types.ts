// API Response Types
export interface StatisticsData {
  totalParks: number;
  totalThemeAreas: number;
  totalRides: number;
  parkOperatingStatus: {
    openParks: number;
    closedParks: number;
    operatingPercentage: number;
  };
  rideStatistics: {
    totalRides: number;
    activeRides: number;
    openRides: number;
    closedRides: number;
    operatingPercentage: number;
    waitTimeDistribution: {
      [key: string]: number;
    };
    busiestParks: Array<{
      parkId: number;
      parkName: string;
      country: string;
      continent: string;
      averageWaitTime: number;
      openRideCount: number;
      totalRideCount: number;
      operatingPercentage: number;
    }>;
    quietestParks: Array<{
      parkId: number;
      parkName: string;
      country: string;
      continent: string;
      averageWaitTime: number;
      openRideCount: number;
      totalRideCount: number;
      operatingPercentage: number;
    }>;
    longestWaitTimes: Array<{
      rideId: number;
      rideName: string;
      parkId: number;
      parkName: string;
      country: string;
      waitTime: number;
      isOpen: boolean;
      lastUpdated: string;
    }>;
    shortestWaitTimes: Array<{
      rideId: number;
      rideName: string;
      parkId: number;
      parkName: string;
      country: string;
      waitTime: number;
      isOpen: boolean;
      lastUpdated: string;
    }>;
    ridesByCountry: Array<{
      country: string;
      totalRides: number;
      activeRides: number;
      openRides: number;
      operatingPercentage: number;
    }>;
    ridesByContinent: Array<{
      continent: string;
      totalRides: number;
      activeRides: number;
      openRides: number;
      operatingPercentage: number;
    }>;
  };
  longestWaitTimes?: Array<{
    rideId: number;
    rideName: string;
    parkName: string;
    country: string;
    waitTime: number;
    lastUpdated: string;
  }>;
  shortestWaitTimes?: Array<{
    rideId: number;
    rideName: string;
    parkName: string;
    country: string;
    waitTime: number;
    lastUpdated: string;
  }>;
  parksByContinent: Array<{
    continent: string;
    totalParks: number;
    openParks: number;
    closedParks: number;
    operatingPercentage: number;
  }>;
  parksByCountry: Array<{
    country: string;
    totalParks: number;
    openParks: number;
    closedParks: number;
    operatingPercentage: number;
  }>;
}

// Component Props Types
export interface Park {
  parkId: number;
  parkName: string;
  country: string;
  continent: string;
  averageWaitTime: number;
  openRideCount: number;
  totalRideCount: number;
  operatingPercentage: number;
}

export interface CountryStats {
  country: string;
  totalParks: number;
  openParks: number;
  closedParks: number;
  operatingPercentage: number;
  flag?: string;
}

export interface ContinentData {
  [continent: string]: number;
}

export interface WaitTimeDistribution {
  [timeRange: string]: number;
}

// Ride Types for Wait Time Rankings
export interface RideWaitTime {
  rideId: number;
  rideName: string;
  parkId: number;
  parkName: string;
  country: string;
  waitTime: number;
  isOpen: boolean;
  lastUpdated: string;
}
