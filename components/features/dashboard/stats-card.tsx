import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  trend?: 'up' | 'down';
}

export function StatsCard({ title, value, icon: Icon, change, trend }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm mt-1 ${
                trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change}
            </p>
          )}
        </div>
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon className="w-8 h-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
}