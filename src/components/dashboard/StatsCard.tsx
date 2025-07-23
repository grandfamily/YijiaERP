import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  trend,
  description,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon}
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            <span className="text-sm font-medium">{trend.value}%</span>
          </div>
        )}
      </div>
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
};