import React from 'react';

const data = [
  { stage: '申请阶段', count: 15, color: 'bg-blue-500' },
  { stage: '审批中', count: 8, color: 'bg-yellow-500' },
  { stage: '生产中', count: 12, color: 'bg-green-500' },
  { stage: '质检中', count: 6, color: 'bg-purple-500' },
  { stage: '已发货', count: 20, color: 'bg-indigo-500' }
];

export const ProgressChart: React.FC = () => {
  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-16 text-sm text-gray-600 font-medium">
            {item.stage}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
            <div 
              className={`${item.color} h-4 rounded-full transition-all duration-500 ease-in-out`}
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
          <div className="w-8 text-right text-sm font-medium text-gray-900">
            {item.count}
          </div>
        </div>
      ))}
      
      <div className="pt-4 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600">
          <span>总计: {data.reduce((sum, item) => sum + item.count, 0)} 个订单</span>
          <span>完成率: {((data[4].count / data.reduce((sum, item) => sum + item.count, 0)) * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};