import React from 'react';
import { BarChart3, Download, Calendar, TrendingUp } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-end">
        <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
          <Download className="h-5 w-5" />
          <span>导出报告</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">本月采购总额</h3>
                <p className="text-2xl font-bold text-gray-900">¥1,234,567</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+15%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">较上月增长</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">本月完成订单</h3>
                <p className="text-2xl font-bold text-gray-900">45</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+8%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">较上月增长</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">平均交货周期</h3>
                <p className="text-2xl font-bold text-gray-900">12.5</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-red-600">
              <TrendingUp className="h-4 w-4 rotate-180" />
              <span className="text-sm font-medium">-2天</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">较上月改善</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">质检合格率</h3>
                <p className="text-2xl font-bold text-gray-900">96.8%</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 text-green-600">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">+2.1%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500">较上月提升</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">详细报告功能开发中...</h3>
        <p className="text-gray-600">
          完整的报表统计功能正在开发中，将包括采购分析、供应商绩效、质量趋势等多维度数据分析。
        </p>
      </div>
    </div>
  );
};