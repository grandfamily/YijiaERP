
import React from 'react';
import { 
  Home, 
  FileText, 
  CheckCircle, 
  CreditCard,
  Package,
  QrCode,
  Truck,
  DollarSign,
  Calendar,
  Settings
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  permissions?: string[];
  roles?: string[];
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
    permissions: ['create_purchase_request', 'view_purchase_requests'],
    roles: ['purchasing_officer', 'department_manager', 'general_manager']
  },
  {
    id: 'approvals',
    label: '工单审批',
    icon: <CheckCircle className="h-5 w-5" />,
    permissions: ['approve_purchase_requests'],
    roles: ['department_manager', 'general_manager']
  },
  {
    id: 'order-allocation',
    label: '订单分配',
    icon: <FileText className="h-5 w-5" />,
    permissions: ['manage_order_allocation'],
    roles: ['purchasing_officer', 'department_manager', 'general_manager']
  },
  {
    id: 'purchase-progress',
    label: '采购进度',
    icon: <FileText className="h-5 w-5" />,
    permissions: ['manage_procurement_progress', 'view_procurement_progress'],
    roles: ['purchasing_officer', 'department_manager', 'general_manager']
  },
  {
    id: 'card-progress',
    label: '纸卡进度',
    icon: <CreditCard className="h-5 w-5" />,
    permissions: ['view_card_progress', 'update_card_design'],
    roles: ['card_designer', 'general_manager', 'purchasing_officer']
  },
  {
    id: 'accessory-progress',
    label: '辅料进度',
    icon: <Package className="h-5 w-5" />,
    permissions: ['view_accessory_progress', 'edit_accessory_progress'],
    roles: ['accessory_staff', 'general_manager', 'purchasing_officer']
  },
  {
    id: 'arrival-inspection',
    label: '到货检验',
    icon: <QrCode className="h-5 w-5" />,
    permissions: ['view_production_tasks'],
    roles: ['production_staff', 'qc_officer', 'warehouse_staff', 'general_manager']
  },
  {
    id: 'production-scheduling',
    label: '生产排单',
    icon: <Calendar className="h-5 w-5" />,
    permissions: ['view_production_tasks', 'update_production_progress'],
    roles: ['production_staff', 'general_manager']
  },
  {
    id: 'inbound-register',
    label: '入库登记',
    icon: <Package className="h-5 w-5" />,
    permissions: ['view_production_tasks'],
    roles: ['warehouse_staff', 'general_manager']
  },
  {
    id: 'shipping',
    label: '发货出柜',
    icon: <Truck className="h-5 w-5" />,
    permissions: ['view_production_tasks'],
    roles: ['warehouse_staff', 'logistics_staff', 'general_manager']
  },
  {
    id: 'finance',
    label: '财务管理',
    icon: <DollarSign className="h-5 w-5" />,
    permissions: ['view_production_tasks'],
    roles: ['finance_personnel', 'general_manager']
  },
  {
    id: 'settings',
    label: '系统设置',
    icon: <Settings className="h-5 w-5" />,
    roles: ['general_manager']
  },
];

interface SidebarProps {
  activeItem: string;
  onItemClick: (itemId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick }) => {
  // 所有用户都可以查看所有页面，编辑权限在页面内部控制
  // 不再基于权限过滤菜单项，让所有用户都能看到所有页面
  const accessibleItems = sidebarItems;

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
          {accessibleItems.map((item) => {
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