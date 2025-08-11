import React from 'react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Package,
  Truck,
  Users,
  FileText,
  BarChart3
} from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';
import { StatsCard } from './StatsCard';
import { RecentActivity } from './RecentActivity';
import { ProgressChart } from './ProgressChart';
import { Inventory } from '../inventory/Inventory';
import { ProductList } from '../product-list/ProductList';
import { Suppliers } from '../suppliers/Suppliers';
import { SKUFinalizationManager } from '../sku-finalization/SKUFinalizationManager';
import { Reports } from '../reports/Reports';

export const Dashboard: React.FC = () => {
  const { getDashboardStats } = useProcurement();
  const { hasPermission } = useAuth();
  const [activeTab, setActiveTab] = React.useState('overview');
  const stats = getDashboardStats();

  const canManageProducts = hasPermission('manage_products');
  const canViewSuppliers = hasPermission('view_suppliers') || hasPermission('manage_suppliers');
  const canViewReports = hasPermission('view_reports');
  const canManageInventory = hasPermission('manage_inventory');

  const tabs = [
    { id: 'overview', label: '工作台概览', icon: <BarChart3 className="h-4 w-4" /> },
    ...(canManageProducts ? [{ id: 'products', label: '产品列表', icon: <Package className="h-4 w-4" /> }] : []),
    ...(canViewSuppliers ? [{ id: 'suppliers', label: '供应商管理', icon: <Users className="h-4 w-4" /> }] : []),
    ...(canManageInventory ? [{ id: 'inventory', label: '库存管理', icon: <Package className="h-4 w-4" /> }] : []),
    { id: 'sku-finalization', label: 'SKU定稿', icon: <CheckCircle className="h-4 w-4" /> },
    ...(canViewReports ? [{ id: 'reports', label: '数据报表', icon: <TrendingUp className="h-4 w-4" /> }] : [])
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'products':
        return <ProductList />;
      case 'suppliers':
        return <Suppliers />;
      case 'inventory':
        return <Inventory />;
      case 'sku-finalization':
        return <SKUFinalizationManager />;
      case 'reports':
        return <Reports />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="采购申请总数"
          value={stats.totalPurchaseRequests}
          icon={<FileText className="h-8 w-8 text-blue-600" />}
          trend={{ value: 12, isPositive: true }}
          description="本月新增"
        />
        <StatsCard
          title="待审批订单"
          value={stats.pendingApprovals}
          icon={<Clock className="h-8 w-8 text-yellow-600" />}
          trend={{ value: 5, isPositive: false }}
          description="需要处理"
        />
        <StatsCard
          title="进行中订单"
          value={stats.inProgress}
          icon={<TrendingUp className="h-8 w-8 text-green-600" />}
          trend={{ value: 8, isPositive: true }}
          description="正在执行"
        />
        <StatsCard
          title="本月完成"
          value={stats.completedThisMonth}
          icon={<CheckCircle className="h-8 w-8 text-emerald-600" />}
          trend={{ value: 15, isPositive: true }}
          description="已完成订单"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatsCard
          title="逾期项目"
          value={stats.overdueItems}
          icon={<AlertTriangle className="h-8 w-8 text-red-600" />}
          description="需要关注"
          className="border-red-200"
        />
        <StatsCard
          title="质量问题"
          value={stats.qualityIssues}
          icon={<Package className="h-8 w-8 text-orange-600" />}
          description="待处理"
          className="border-orange-200"
        />
        <StatsCard
          title="活跃供应商"
          value={stats.totalSuppliers}
          icon={<Users className="h-8 w-8 text-purple-600" />}
          description="合作伙伴"
        />
        <StatsCard
          title="在途货物"
          value={stats.activeShipments}
          icon={<Truck className="h-8 w-8 text-indigo-600" />}
          description="运输中"
        />
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">采购进度分析</h3>
          <ProgressChart />
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近活动</h3>
          <RecentActivity />
        </div>
      </div>
    </>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">仪表板</h1>
          <p className="text-gray-600">系统概览和数据管理中心</p>
        </div>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};