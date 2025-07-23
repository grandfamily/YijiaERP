import React from 'react';

interface StatusBadgeProps {
  status: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, color, size = 'md' }) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      gray: 'bg-gray-100 text-gray-800',
      blue: 'bg-blue-100 text-blue-800',
      green: 'bg-green-100 text-green-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      emerald: 'bg-emerald-100 text-emerald-800',
      orange: 'bg-orange-100 text-orange-800'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.gray;
  };

  const getSizeClasses = (size: string) => {
    const sizeMap = {
      sm: 'px-2 py-1 text-xs',
      md: 'px-2.5 py-0.5 text-sm',
      lg: 'px-3 py-1 text-base'
    };
    return sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full ${getColorClasses(color)} ${getSizeClasses(size)}`}>
      {status}
    </span>
  );
};