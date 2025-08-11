import React from 'react';
import { CheckCircle, Clock, AlertTriangle, XCircle, Package, Truck, Settings } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  color, 
  size = 'md',
  showIcon = false,
  className = ''
}) => {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { color: string, icon: React.ReactNode }> = {
      // 订单状态
      'pending': { color: 'yellow', icon: <Clock className="h-3 w-3" /> },
      'submitted': { color: 'blue', icon: <Package className="h-3 w-3" /> },
      'first_approved': { color: 'indigo', icon: <CheckCircle className="h-3 w-3" /> },
      'approved': { color: 'green', icon: <CheckCircle className="h-3 w-3" /> },
      'rejected': { color: 'red', icon: <XCircle className="h-3 w-3" /> },
      'allocated': { color: 'purple', icon: <Settings className="h-3 w-3" /> },
      'in_production': { color: 'blue', icon: <Package className="h-3 w-3" /> },
      'quality_check': { color: 'yellow', icon: <AlertTriangle className="h-3 w-3" /> },
      'ready_to_ship': { color: 'indigo', icon: <Truck className="h-3 w-3" /> },
      'shipped': { color: 'green', icon: <Truck className="h-3 w-3" /> },
      'completed': { color: 'green', icon: <CheckCircle className="h-3 w-3" /> },

      // 中文状态映射
      '待审批': { color: 'yellow', icon: <Clock className="h-3 w-3" /> },
      '已提交': { color: 'blue', icon: <Package className="h-3 w-3" /> },
      '一级审批通过': { color: 'indigo', icon: <CheckCircle className="h-3 w-3" /> },
      '最终审批通过': { color: 'green', icon: <CheckCircle className="h-3 w-3" /> },
      '已拒绝': { color: 'red', icon: <XCircle className="h-3 w-3" /> },
      '已分配': { color: 'purple', icon: <Settings className="h-3 w-3" /> },
      '生产中': { color: 'blue', icon: <Package className="h-3 w-3" /> },
      '质检中': { color: 'yellow', icon: <AlertTriangle className="h-3 w-3" /> },
      '待发货': { color: 'indigo', icon: <Truck className="h-3 w-3" /> },
      '已发货': { color: 'green', icon: <Truck className="h-3 w-3" /> },
      '已完成': { color: 'green', icon: <CheckCircle className="h-3 w-3" /> },

      // 包装类型
      '厂家包装': { color: 'blue', icon: <Package className="h-3 w-3" /> },
      '自己包装': { color: 'green', icon: <Package className="h-3 w-3" /> },

      // 质量状态
      '合格': { color: 'green', icon: <CheckCircle className="h-3 w-3" /> },
      '不合格': { color: 'red', icon: <XCircle className="h-3 w-3" /> },
      '待检验': { color: 'yellow', icon: <Clock className="h-3 w-3" /> },

      // 通用状态
      '正常': { color: 'green', icon: <CheckCircle className="h-3 w-3" /> },
      '异常': { color: 'red', icon: <AlertTriangle className="h-3 w-3" /> },
      '处理中': { color: 'blue', icon: <Clock className="h-3 w-3" /> },
    };

    return statusMap[status] || { color: 'gray', icon: <Package className="h-3 w-3" /> };
  };

  const config = getStatusConfig(status);
  const finalColor = color || config.color;

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
    <span className={`
      inline-flex items-center font-medium rounded-full
      ${showIcon ? 'space-x-1' : ''}
      ${getColorClasses(finalColor)} 
      ${getSizeClasses(size)}
      ${className}
    `}>
      {showIcon && config.icon}
      <span>{status}</span>
    </span>
  );
};