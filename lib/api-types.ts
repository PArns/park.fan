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
      hierarchicalUrl: string;
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
      hierarchicalUrl: string;
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
      hierarchicalUrl: string;
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
      hierarchicalUrl: string;
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
  hierarchicalUrl: string;
}

export interface CountryStats {
  country: string;
  totalParks: number;
  openParks: number;
  closedParks: number;
  operatingPercentage: number;
  flag?: string;
}

export interface ContinentStats {
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
  hierarchicalUrl: string;
}

// New types for hierarchical pages based on actual API responses
export interface ContinentApiData {
  data: Array<{
    id: number;
    queueTimesId: number;
    name: string;
    country: string;
    continent: string;
    latitude: string;
    longitude: string;
    timezone: string;
    parkGroup: {
      id: number;
      queueTimesId: number;
      name: string;
    };
    themeAreas: Array<{
      id: number;
      queueTimesId: number;
      name: string;
      rides: Array<{
        id: number;
        queueTimesId: number;
        name: string;
        isActive: boolean;
        currentQueueTime: {
          waitTime: number;
          isOpen: boolean;
          lastUpdated: string;
        };
        hierarchicalUrl: string;
      }>;
    }>;
    operatingStatus: {
      isOpen: boolean;
      openRideCount: number;
      totalRideCount: number;
      operatingPercentage: number;
    };
    waitTimeDistribution: {
      [key: string]: number;
    };
    weather: {
      current: {
        temperature: {
          min: number;
          max: number;
        };
        precipitationProbability: number;
        weatherCode: number;
        status: string;
        weatherScore: number;
      };
      forecast: Array<{
        temperature: {
          min: number;
          max: number;
        };
        precipitationProbability: number;
        weatherCode: number;
        status: string;
        weatherScore: number;
        date: string;
      }>;
    };
    crowdLevel: {
      level: number;
      label: string;
      ridesUsed: number;
      totalRides: number;
      historicalBaseline: number;
      currentAverage: number;
      confidence: number;
      calculatedAt: string;
    };
    hierarchicalUrl: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CountryApiData {
  data: Array<{
    id: number;
    queueTimesId: number;
    name: string;
    country: string;
    continent: string;
    latitude: string;
    longitude: string;
    timezone: string;
    parkGroup: {
      id: number;
      queueTimesId: number;
      name: string;
    };
    themeAreas: Array<{
      id: number;
      queueTimesId: number;
      name: string;
      rides: Array<{
        id: number;
        queueTimesId: number;
        name: string;
        isActive: boolean;
        currentQueueTime: {
          waitTime: number;
          isOpen: boolean;
          lastUpdated: string;
        };
        hierarchicalUrl: string;
      }>;
    }>;
    operatingStatus: {
      isOpen: boolean;
      openRideCount: number;
      totalRideCount: number;
      operatingPercentage: number;
    };
    waitTimeDistribution: {
      [key: string]: number;
    };
    weather: {
      current: {
        temperature: {
          min: number;
          max: number;
        };
        precipitationProbability: number;
        weatherCode: number;
        status: string;
        weatherScore: number;
      };
      forecast: Array<{
        temperature: {
          min: number;
          max: number;
        };
        precipitationProbability: number;
        weatherCode: number;
        status: string;
        weatherScore: number;
        date: string;
      }>;
    };
    crowdLevel: {
      level: number;
      label: string;
      ridesUsed: number;
      totalRides: number;
      historicalBaseline: number;
      currentAverage: number;
      confidence: number;
      calculatedAt: string;
    };
    hierarchicalUrl: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ParkApiData {
  id: number;
  queueTimesId: number;
  name: string;
  country: string;
  continent: string;
  latitude: string;
  longitude: string;
  timezone: string;
  parkGroup: {
    id: number;
    queueTimesId: number;
    name: string;
  };
  themeAreas: Array<{
    id: number;
    queueTimesId: number;
    name: string;
    rides: Array<{
      id: number;
      queueTimesId: number;
      name: string;
      isActive: boolean;
      currentQueueTime: {
        waitTime: number;
        isOpen: boolean;
        lastUpdated: string;
      };
      hierarchicalUrl: string;
    }>;
  }>;
  operatingStatus: {
    isOpen: boolean;
    openRideCount: number;
    totalRideCount: number;
    operatingPercentage: number;
  };
  waitTimeDistribution: {
    [key: string]: number;
  };
  weather: {
    current: {
      temperature: {
        min: number;
        max: number;
      };
      precipitationProbability: number;
      weatherCode: number;
      status: string;
      weatherScore: number;
    };
    forecast: Array<{
      temperature: {
        min: number;
        max: number;
      };
      precipitationProbability: number;
      weatherCode: number;
      status: string;
      weatherScore: number;
      date: string;
    }>;
  };
  crowdLevel: {
    level: number;
    label: string;
    ridesUsed: number;
    totalRides: number;
    historicalBaseline: number;
    currentAverage: number;
    confidence: number;
    calculatedAt: string;
  };
  hierarchicalUrl: string;
}

export interface RideApiData {
  id: number;
  name: string;
  isActive: boolean;
  park: {
    id: number;
    queueTimesId: number;
    name: string;
    country: string;
    continent: string;
    latitude: string;
    longitude: string;
    timezone: string;
    hierarchicalUrl: string;
  };
  themeArea: {
    id: number;
    queueTimesId: number;
    name: string;
  };
  currentQueueTime: {
    waitTime: number;
    isOpen: boolean;
    lastUpdated: string;
  };
  hierarchicalUrl: string;
}
