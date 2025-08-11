import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Dashboard } from '../dashboard/Dashboard';
import { PurchaseRequests } from '../purchase-requests/PurchaseRequests';
import { Approvals } from '../approvals/Approvals';
import { OrderAllocation } from '../order-allocation/OrderAllocation';
import { CardProgress } from '../card-progress/CardProgress';
import { AccessoryProgress } from '../accessory-progress/AccessoryProgress';
import { PurchaseProgress } from '../purchase-progress/PurchaseProgress';
import { InboundRegister } from '../inbound-register/InboundRegister';
// import { Shipping } from '../shipping/Shipping'; // 未使用，移除警告
import { Inventory } from '../inventory/Inventory';
import { FinanceManagement } from '../finance/FinanceManagement';
import { ProductionScheduling } from '../production-scheduling/ProductionScheduling';
import { ShippingOutbound } from '../shipping-outbound/ShippingOutbound';
import { ArrivalInspection } from '../arrival-inspection/ArrivalInspection';
import { Settings } from '../settings/Settings';
import { HelpGuide } from '../ui/HelpGuide';

export const Layout: React.FC = () => {
  const [activeItem, setActiveItem] = useState('dashboard');

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'purchase-requests':
        return <PurchaseRequests />;
      case 'approvals':
        return <Approvals />;
      case 'order-allocation':
        return <OrderAllocation />;
      case 'arrival-inspection':
        return <ArrivalInspection />;
      case 'production-scheduling':
        return <ProductionScheduling />;
      case 'purchase-progress':
        return <PurchaseProgress />;
      case 'card-progress':
        return <CardProgress />;
      case 'accessory-progress':
        return <AccessoryProgress />;
      case 'inbound-register':
        return <InboundRegister />;
      case 'shipping':
        return <ShippingOutbound />;
      case 'inventory':
        return <Inventory />;
      case 'finance':
        return <FinanceManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {renderContent()}
        </main>
      </div>
      <HelpGuide onNavigate={setActiveItem} />
    </div>
  );
};