import React from 'react';
import { 
  Home, 
  FileText, 
  CheckCircle, 
  ShoppingCart, 
  Factory,
  CreditCard,
  Package,
  QrCode,
  Truck,
  DollarSign,
  Calendar
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const sidebarItems: SidebarItem[] = [
  {
    id: 'dashboard',
    label: '仪表板',
    icon: <Home className="h-5 w-5" />,
  },
  {
    id: 'purchase-requests',
    label: '采购申请',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'approvals',
    label: '工单审批',
    icon: <CheckCircle className="h-5 w-5" />,
  },
  {
    id: 'order-allocation',
    label: '订单分配',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'purchase-progress',
    label: '采购进度',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    id: 'card-progress',
    label: '纸卡进度',
    icon: <CreditCard className="h-5 w-5" />,
  },
  {
    id: 'accessory-progress',
    label: '辅料进度',
    icon: <Package className="h-5 w-5" />,
  },
  {
    id: 'in-house-production',
    label: '自己包装',
    icon: <Factory className="h-5 w-5" />,
  },
  {
    id: 'production-scheduling',
    label: '生产排单',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    id: 'quality-control', 
    label: '验货入库',
    icon: <QrCode className="h-5 w-5" />,
  },
  {
    id: 'shipping',
    label: '发货出柜',
    icon: <Truck className="h-5 w-5" />,
  },
  {
    id: 'finance',
    label: '财务管理',
    icon: <DollarSign className="h-5 w-5" />,
  },
];

interface SidebarProps {
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  return (
    <div className="w-64 bg-gray-900 text-white h-full">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold">一家百货</span>
        </div>
        
        <nav className="space-y-2">
          {sidebarItems.map((item) => {
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  activeItem === item.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="text-base font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};