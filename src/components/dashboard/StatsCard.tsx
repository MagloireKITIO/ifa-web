import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface StatsCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  iconBgColor: string;
  stats: StatItem[];
}

export function StatsCard({
  title,
  icon: Icon,
  iconColor,
  iconBgColor,
  stats,
}: StatsCardProps) {
  return (
    <Card className="p-6 bg-white shadow-md hover:shadow-lg transition-all duration-200">
      {/* Header avec icône */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className={`flex items-center justify-center w-12 h-12 rounded-xl ${iconBgColor}`}
        >
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      </div>

      {/* Liste des stats */}
      <div className="space-y-3">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`flex items-center justify-between py-2 ${
              index < stats.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <span className="text-sm text-muted-foreground">{stat.label}</span>
            <span
              className={`text-base font-semibold ${
                stat.color || 'text-foreground'
              }`}
            >
              {stat.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
