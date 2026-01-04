import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

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
    up: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-400',
    down: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-400',
    neutral: 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400'
  };

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg shadow p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
          {change !== undefined && (
            <div className="mt-2 flex items-center text-sm">
              <span className={cn("px-2 py-1 rounded-md", trendColors[trend])}>
                {change > 0 ? '+' : ''}{change}%
              </span>
              {changeLabel && (
                <span className="ml-2 text-gray-600 dark:text-gray-400">
                  {changeLabel}
                </span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="ml-4 flex-shrink-0">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900 rounded-lg">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}