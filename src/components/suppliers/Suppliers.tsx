import React from 'react';
import { Users, MapPin, Phone, Mail, Star, Plus } from 'lucide-react';
import { useProcurement } from '../../hooks/useProcurement';

export const Suppliers: React.FC = () => {
  const { getSuppliers } = useProcurement();
  const suppliers = getSuppliers();

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    if (rating >= 3.0) return 'text-orange-600';
    return 'text-red-600';
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <div className="flex items-center space-x-3">
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-5 w-5" />
            <span>添加供应商</span>
          </button>
        </div>
      </div>

      {suppliers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">没有供应商记录</h3>
          <p className="text-gray-600">开始添加供应商信息</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suppliers.map((supplier) => (
            <div key={supplier.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <p className="text-sm text-gray-600">{supplier.code}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {renderStars(supplier.rating)}
                  <span className={`text-sm font-medium ml-1 ${getRatingColor(supplier.rating)}`}>
                    {supplier.rating}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{supplier.city}, {supplier.country}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{supplier.phone}</span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">{supplier.email}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">联系人</div>
                    <div className="font-medium text-gray-900">{supplier.contactPerson}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">交货周期</div>
                    <div className="font-medium text-gray-900">{supplier.leadTime} 天</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-gray-600">付款条件</div>
                    <div className="font-medium text-gray-900">{supplier.paymentTerms}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    supplier.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {supplier.isActive ? '活跃' : '停用'}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      编辑
                    </button>
                    <button className="text-gray-600 hover:text-gray-700 text-sm font-medium">
                      历史
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};