import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Dashboard } from '../dashboard/Dashboard';
import { PurchaseRequests } from '../purchase-requests/PurchaseRequests';
import { Approvals } from '../approvals/Approvals';
import { OrderAllocation } from '../order-allocation/OrderAllocation';
import { ExternalPurchase } from '../external-purchase/ExternalPurchase';
import { InHouseProduction } from '../in-house-production/InHouseProduction';
import { CardProgress } from '../card-progress/CardProgress';
import { AccessoryProgress } from '../accessory-progress/AccessoryProgress';
import { AccessoryStaffProgress } from '../accessory-progress/AccessoryStaffProgress';
import { PurchaseProgress } from '../purchase-progress/PurchaseProgress';
import { QualityControl } from '../quality-control/QualityControl';
import { Shipping } from '../shipping/Shipping';
import { Inventory } from '../inventory/Inventory';
import { FinanceManagement } from '../finance/FinanceManagement';
import { ProductionScheduling } from '../production-scheduling/ProductionScheduling';

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
      case 'external-purchase':
        return <ExternalPurchase />;
      case 'in-house-production':
        return <InHouseProduction />;
      case 'production-scheduling':
        return <ProductionScheduling />;
      case 'purchase-progress':
        return <PurchaseProgress />;
      case 'card-progress':
        return <CardProgress />;
      case 'accessory-progress':
        return <AccessoryProgress />;
      case 'quality-control':
        return <QualityControl />;
      case 'shipping':
        return <Shipping />;
      case 'inventory':
        return <Inventory />;
      case 'finance':
        return <FinanceManagement />;
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
    </div>
  );
};