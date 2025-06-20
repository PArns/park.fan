import { PageHeader } from '../../components/layout/page-header';
import { Button } from '../../components/ui/button';
import { BarChart3, TrendingUp, Users, Globe, Calendar } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="animate-fade-in space-y-8">
        <PageHeader
          title="Analytics"
          description="Advanced analytics and insights for theme park data"
        >
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </PageHeader>

        {/* Coming Soon Section */}
        <div className="max-w-2xl mx-auto text-center py-16">
          <div className="bg-card rounded-2xl p-12 shadow-sm border border-border">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-foreground mb-4">Advanced Analytics</h2>

            <p className="text-muted-foreground text-lg mb-8">
              Detailed analytics and insights are coming soon. This section will include:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <h3 className="font-semibold text-foreground">Trend Analysis</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Historical wait time trends and seasonal patterns
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  <h3 className="font-semibold text-foreground">Visitor Patterns</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Peak times and crowd distribution analysis
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Globe className="w-5 h-5 text-purple-500" />
                  <h3 className="font-semibold text-foreground">Global Comparisons</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Compare parks across different regions and countries
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-orange-500" />
                  <h3 className="font-semibold text-foreground">Forecasting</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Predict future wait times and busy periods
                </p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-6">
              <p className="text-sm text-muted-foreground">
                🚧 This feature is currently in development. Check back soon for comprehensive
                analytics tools!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
