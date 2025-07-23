import React from 'react';
import { Clock, CheckCircle, AlertTriangle, Package, Truck } from 'lucide-react';

const activities = [
  {
    id: 1,
    type: 'approval',
    title: '采购申请 PR-2024-001 已批准',
    description: '李四批准了张三的采购申请',
    time: '2小时前',
    icon: <CheckCircle className="h-5 w-5 text-green-600" />,
    color: 'green'
  },
  {
    id: 2,
    type: 'quality',
    title: '质检完成 - 电子产品A',
    description: '100件产品通过质检',
    time: '4小时前',
    icon: <Package className="h-5 w-5 text-blue-600" />,
    color: 'blue'
  },
  {
    id: 3,
    type: 'overdue',
    title: '订单逾期提醒',
    description: 'PR-2024-002 已超过预计完成时间',
    time: '6小时前',
    icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
    color: 'red'
  },
  {
    id: 4,
    type: 'shipping',
    title: '货物已发出',
    description: '容器 CONU123456 已装船',
    time: '1天前',
    icon: <Truck className="h-5 w-5 text-indigo-600" />,
    color: 'indigo'
  },
  {
    id: 5,
    type: 'pending',
    title: '新采购申请待审批',
    description: '王五提交了新的采购申请',
    time: '2天前',
    icon: <Clock className="h-5 w-5 text-yellow-600" />,
    color: 'yellow'
  }
];

export const RecentActivity: React.FC = () => {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
          <div className="flex-shrink-0 mt-1">
            {activity.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
            <p className="text-sm text-gray-500 mt-1">{activity.description}</p>
          </div>
          <div className="flex-shrink-0 text-xs text-gray-400">
            {activity.time}
          </div>
        </div>
      ))}
      
      <div className="pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
          查看所有活动
        </button>
      </div>
    </div>
  );
};