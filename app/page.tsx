import { Suspense } from 'react';
import { MapPin, BarChart3, Clock, TrendingUp } from 'lucide-react';
import { PageHeader } from '../components/layout/page-header';
import StatisticsCard from '../components/statistics-card';
import TopParks from '../components/top-parks';
import ContinentStats from '../components/continent-stats';
import CountryStats from '../components/country-stats';
import WaitTimeChart from '../components/wait-time-chart';
import { BusiestRides } from '../components/busiest-rides';
import { QuietestRides } from '../components/quietest-rides';
import { RidesByCountry } from '../components/rides-by-country';
import { RidesByContinent } from '../components/rides-by-continent';
import { RefreshButton } from '../components/interactive/refresh-button';
import { ErrorState } from '../components/feedback/error-state';
import { fetchStatistics, transformStatisticsData } from '../lib/api';

// Loading component for suspense
function DashboardLoading() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="animate-fade-in">
        <PageHeader title="Dashboard" description="Loading theme park statistics..." />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-card rounded-xl p-3 sm:p-4 lg:p-6 shadow-sm border border-border"
            >
              <div className="animate-pulse">
                <div className="h-3 sm:h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-6 sm:h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-2 sm:h-3 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Main dashboard content
async function DashboardContent() {
  try {
    const rawStatistics = await fetchStatistics();
    const statistics = transformStatisticsData(rawStatistics);

    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="animate-fade-in space-y-6 lg:space-y-8">
          <PageHeader
            title="Theme Park Dashboard"
            description="Real-time statistics from theme parks worldwide"
          />

          {/* Overall Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatisticsCard
              title="Total Parks"
              value={statistics.totalParks}
              subtitle={`${statistics.parkOperatingStatus?.openParks || 0} open`}
              icon={MapPin}
              trend={{
                value: statistics.parkOperatingStatus?.operatingPercentage || 0,
                label: 'operating',
              }}
            />
            <StatisticsCard
              title="Theme Areas"
              value={statistics.totalThemeAreas}
              subtitle="Across all parks"
              icon={BarChart3}
            />
            <StatisticsCard
              title="Total Rides"
              value={statistics.totalRides}
              subtitle={`${statistics.rideStatistics?.openRides || 0} open`}
              icon={TrendingUp}
              trend={{
                value: statistics.rideStatistics?.operatingPercentage || 0,
                label: 'operational',
              }}
            />
            <StatisticsCard
              title="Active Rides"
              value={statistics.rideStatistics?.activeRides || 0}
              subtitle="Currently running"
              icon={Clock}
            />
          </div>

          {/* Top Parks Section */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Park Rankings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopParks parks={statistics.rideStatistics?.busiestParks || []} type="busiest" />
              <TopParks parks={statistics.rideStatistics?.quietestParks || []} type="quietest" />
            </div>
          </section>

          {/* Wait Time Rankings */}
          <section className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Wait Time Rankings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <BusiestRides rides={statistics.rideStatistics?.longestWaitTimes || []} />
              <QuietestRides rides={statistics.rideStatistics?.shortestWaitTimes || []} />
            </div>
          </section>

          {/* Wait Times Distribution */}
          {statistics.rideStatistics?.waitTimeDistribution && (
            <section className="space-y-6">
              <h2 className="text-2xl font-bold text-foreground">Wait Time Distribution</h2>
              <WaitTimeChart distribution={statistics.rideStatistics.waitTimeDistribution} />
            </section>
          )}

          {/* Geographic Statistics */}
          <section className="space-y-4 lg:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Global Statistics</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <ContinentStats continents={statistics.continentsForComponent} />
              <RidesByContinent continents={statistics.rideStatistics?.ridesByContinent || []} />
              <RidesByCountry countries={statistics.rideStatistics?.ridesByCountry || []} />
            </div>
          </section>

          {/* Country Statistics */}
          <section className="space-y-4 lg:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Parks by Country</h2>
            <CountryStats countries={statistics.countriesForComponent} />
          </section>

          {/* Refresh Button at Bottom */}
          <div className="flex justify-center pt-8">
            <RefreshButton />
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Dashboard" description="Theme park statistics" />
        <ErrorState
          message={error instanceof Error ? error.message : 'Failed to load statistics'}
        />
      </div>
    );
  }
}

// Main page component with Suspense
export default function Dashboard() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  );
}
