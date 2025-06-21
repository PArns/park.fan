import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { WaitTimeDistribution } from '../../lib/api-types';
import { Clock } from 'lucide-react';

interface WaitTimeChartProps {
  distribution: WaitTimeDistribution;
}

export default function WaitTimeChart({ distribution }: WaitTimeChartProps) {
  const totalRides = Object.values(distribution || {}).reduce((sum, count) => sum + count, 0);

  const categories = [
    { key: '0-10', label: '0-15 min', color: 'success', bgColor: 'bg-green-500' },
    { key: '11-30', label: '16-30 min', color: 'warning', bgColor: 'bg-orange-500' },
    { key: '31-60', label: '31-60 min', color: 'error', bgColor: 'bg-red-500' },
    { key: '61-120', label: '61-120 min', color: 'error', bgColor: 'bg-red-700' },
    { key: '120+', label: '121+ min', color: 'error', bgColor: 'bg-purple-600' },
  ] as const;

  return (
    <Card variant="glass" hover="lift" className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Clock size={20} />
          </div>
          Wait Time Distribution
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {categories.map((category) => {
          const count = distribution?.[category.key] || 0;
          const percentage = totalRides > 0 ? (count / totalRides) * 100 : 0;

          return (
            <div key={category.key} className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${category.bgColor}`} />
                  <span className="text-sm font-medium text-foreground">{category.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-foreground tabular-nums">{count}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    ({percentage.toFixed(1)}%)
                  </span>
                </div>
              </div>
              <Progress value={percentage} variant={category.color} className="h-3" />
            </div>
          );
        })}

        <div className="mt-8 pt-6 border-t border-border">
          <div className="text-center space-y-2">
            <p className="text-2xl font-bold text-foreground tabular-nums">
              {totalRides.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Rides with wait times</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
