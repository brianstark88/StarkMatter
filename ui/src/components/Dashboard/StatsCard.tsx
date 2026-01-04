import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export default function StatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  className
}: StatsCardProps) {
  const trendColors = {
    up: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    down: 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    neutral: 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800'
  };

  const iconBgColors = {
    up: 'bg-emerald-100 dark:bg-emerald-900/40',
    down: 'bg-red-100 dark:bg-red-900/40',
    neutral: 'bg-indigo-100 dark:bg-indigo-900/40'
  };

  return (
    <div className={cn(
      "group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6",
      "hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-200",
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {value}
          </p>
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold",
                trendColors[trend]
              )}>
                {trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                {trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                {change > 0 ? '+' : ''}{typeof change === 'number' ? change.toFixed(1) : change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className={cn(
            "ml-4 flex-shrink-0 p-3 rounded-lg transition-colors",
            iconBgColors[trend]
          )}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}