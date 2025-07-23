import React from 'react';

interface ProgressBarProps {
  progress: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  color = 'blue', 
  size = 'md',
  showPercentage = false 
}) => {
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
      purple: 'bg-purple-500',
      gray: 'bg-gray-400'
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getSizeClasses = (size: string) => {
    const sizeMap = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };
    return sizeMap[size as keyof typeof sizeMap] || sizeMap.md;
  };

  return (
    <div className="w-full">
      {showPercentage && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">进度</span>
          <span className="text-sm font-medium text-gray-900">{progress}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${getSizeClasses(size)}`}>
        <div 
          className={`${getColorClasses(color)} ${getSizeClasses(size)} rounded-full transition-all duration-500 ease-in-out`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
};