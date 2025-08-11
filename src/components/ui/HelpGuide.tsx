import React, { useState } from 'react';
import { HelpCircle, X, Search, ArrowRight } from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  action: () => void;
  category: string;
}

interface HelpGuideProps {
  onNavigate: (page: string) => void;
}

export const HelpGuide: React.FC<HelpGuideProps> = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const quickActions: QuickAction[] = [
    {
      id: 'create-purchase',
      title: '创建采购申请',
      description: '开始新的采购流程',
      category: '采购管理',
      action: () => {
        onNavigate('purchase-requests');
        setIsOpen(false);
      }
    },
    {
      id: 'view-progress',
      title: '查看采购进度',
      description: '跟踪订单执行情况',
      category: '进度跟踪',
      action: () => {
        onNavigate('purchase-progress');
        setIsOpen(false);
      }
    },
    {
      id: 'inventory-check',
      title: '库存管理',
      description: '查看和管理库存状态',
      category: '库存管理',
      action: () => {
        onNavigate('dashboard');
        setIsOpen(false);
      }
    },
    {
      id: 'financial-overview',
      title: '财务管理',
      description: '查看付款和财务状态',
      category: '财务管理',
      action: () => {
        onNavigate('finance');
        setIsOpen(false);
      }
    }
  ];

  const filteredActions = quickActions.filter(action =>
    action.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    action.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedActions = filteredActions.reduce((groups, action) => {
    const category = action.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(action);
    return groups;
  }, {} as Record<string, QuickAction[]>);

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-40"
        title="快速帮助"
      >
        <HelpCircle className="h-6 w-6" />
      </button>

      {/* Help Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">快速导航</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索功能或页面..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-4 overflow-y-auto max-h-96">
              {Object.keys(groupedActions).length === 0 ? (
                <div className="text-center py-8">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">没有找到匹配的功能</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedActions).map(([category, actions]) => (
                    <div key={category}>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">{category}</h3>
                      <div className="space-y-2">
                        {actions.map((action) => (
                          <button
                            key={action.id}
                            onClick={action.action}
                            className="w-full p-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 group-hover:text-blue-700">
                                  {action.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {action.description}
                                </p>
                              </div>
                              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                💡 提示：您可以使用快捷键 <kbd className="px-2 py-1 bg-gray-200 rounded text-xs">Ctrl + K</kbd> 快速打开此面板
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
