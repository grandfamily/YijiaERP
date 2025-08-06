import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Camera,
  Upload,
  Save,
  X,
  ZoomIn,
  ArrowUpDown,
  CheckSquare,
  Square,
  Eye,
  Edit,
  Download
} from 'lucide-react';
import { useArrivalInspection } from '../../hooks/useArrivalInspection';
import { useAuth } from '../../hooks/useAuth';
import { ArrivalInspection, InspectionPhoto } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';

type TabType = 'semi_finished_pending' | 'semi_finished_completed' | 'finished_pending' | 'finished_completed';

export const ArrivalInspection: React.FC = () => {
  const { user } = useAuth();
  const {
    getArrivalInspectionsByType,
    updateArrivalStatus,
    updateArrivalInspection,
    completeInspection,
    getInspectionStats
  } = useArrivalInspection();

  const [activeTab, setActiveTab] = useState<TabType>('semi_finished_pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortByArrival, setSortByArrival] = useState<'asc' | 'desc' | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [editingInspection, setEditingInspection] = useState<ArrivalInspection | null>(null);
  const [uploadedPhotos, setUploadedPhotos] = useState<{[key: string]: InspectionPhoto[]}>({});
  const [arrivalQuantities, setArrivalQuantities] = useState<{[key: string]: number}>({});
  const [inspectionNotes, setInspectionNotes] = useState<{[key: string]: string}>({});

  // 权限检查
  const isQCOfficer = user?.role === 'qc_officer';
  const canEdit = isQCOfficer;

  // 获取当前标签页的数据
  const getCurrentTabData = () => {
    const [productType, status] = activeTab.split('_') as ['semi' | 'finished', 'finished' | 'pending' | 'completed'];
    const actualProductType = productType === 'semi' ? 'semi_finished' : 'finished';
    const actualStatus = status === 'pending' ? 'pending' : 'completed';
    
    return getArrivalInspectionsByType(actualProductType, actualStatus);
  };

  // 过滤和排序数据
  const getFilteredAndSortedData = () => {
    let data = getCurrentTabData();

    // 搜索过滤
    if (searchTerm) {
      data = data.filter(item =>
        item.purchaseRequestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 到货状态排序
    if (sortByArrival) {
      data = [...data].sort((a, b) => {
        if (sortByArrival === 'asc') {
          return Number(a.isArrived) - Number(b.isArrived);
        } else {
          return Number(b.isArrived) - Number(a.isArrived);
        }
      });
    }

    return data;
  };

  const filteredData = getFilteredAndSortedData();

  // 处理到货状态切换
  const handleArrivalToggle = async (id: string, isArrived: boolean) => {
    if (!canEdit) return;
    
    try {
      await updateArrivalStatus(id, isArrived, isArrived ? new Date() : undefined);
    } catch (error) {
      console.error('更新到货状态失败:', error);
    }
  };

  // 处理照片上传
  const handlePhotoUpload = (inspectionId: string, files: FileList | null) => {
    if (!files || !canEdit) return;
    
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const isValidType = file.type === 'image/jpeg' || file.type === 'image/png';
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });
    
    if (validFiles.length !== fileArray.length) {
      alert('部分文件格式不支持或文件过大（限制10MB），仅上传有效文件');
    }
    
    const newPhotos: InspectionPhoto[] = validFiles.map(file => ({
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      preview: URL.createObjectURL(file),
      uploadDate: new Date()
    }));
    
    setUploadedPhotos(prev => ({
      ...prev,
      [inspectionId]: [...(prev[inspectionId] || []), ...newPhotos]
    }));
  };

  // 移除照片
  const removePhoto = (inspectionId: string, photoIndex: number) => {
    if (!canEdit) return;
    
    setUploadedPhotos(prev => ({
      ...prev,
      [inspectionId]: (prev[inspectionId] || []).filter((_, index) => index !== photoIndex)
    }));
  };

  // 处理验收完成
  const handleInspectionComplete = async (inspectionId: string, qualityResult: 'passed' | 'failed') => {
    if (!canEdit || !user) return;
    
    try {
      const photos = uploadedPhotos[inspectionId] || [];
      const arrivalQuantity = arrivalQuantities[inspectionId] || 0;
      const notes = inspectionNotes[inspectionId] || '';
      
      if (photos.length === 0) {
        alert('请先上传验收照片');
        return;
      }
      
      if (arrivalQuantity <= 0) {
        alert('请填写到货数量');
        return;
      }

      await completeInspection(
        inspectionId,
        user.id,
        arrivalQuantity,
        photos,
        qualityResult,
        notes
      );

      // 清理临时数据
      setUploadedPhotos(prev => {
        const newState = { ...prev };
        delete newState[inspectionId];
        return newState;
      });
      setArrivalQuantities(prev => {
        const newState = { ...prev };
        delete newState[inspectionId];
        return newState;
      });
      setInspectionNotes(prev => {
        const newState = { ...prev };
        delete newState[inspectionId];
        return newState;
      });

    } catch (error) {
      console.error('完成验收失败:', error);
      alert('完成验收失败，请重试');
    }
  };

  // 处理图片点击
  const handleImageClick = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  // 处理选择
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedItems(prev => 
      prev.length === filteredData.length ? [] : filteredData.map(item => item.id)
    );
  };

  // 获取统计数据
  const stats = getInspectionStats();

  // 渲染待验收栏目
  const renderPendingInspection = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {canEdit && (
                <th className="w-10 py-3 px-3 text-left font-medium text-gray-900">
                  <button onClick={handleSelectAll} className="flex items-center">
                    {selectedItems.length === filteredData.length && filteredData.length > 0 ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </th>
              )}
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">
                <button
                  onClick={() => setSortByArrival(prev => 
                    prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc'
                  )}
                  className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
                >
                  <span>是否到货</span>
                  <ArrowUpDown className="h-4 w-4" />
                </button>
              </th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">纸卡进度</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">采购进度</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">辅料进度</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">采购数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">到货数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">验收照片</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">验收意见</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {canEdit && (
                  <td className="py-3 px-3">
                    <button onClick={() => handleSelectItem(item.id)} className="flex items-center">
                      {selectedItems.includes(item.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </td>
                )}
                
                {/* 订单编号 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{item.purchaseRequestNumber}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                
                {/* 产品图片 */}
                <td className="py-3 px-3 text-center">
                  {item.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(item.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(item.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Camera className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                
                {/* SKU编码 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                  <div className="text-xs text-gray-500">{item.sku.category}</div>
                </td>
                
                {/* 品名 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900 font-medium">{item.sku.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.sku.englishName}</div>
                </td>
                
                {/* 是否到货 */}
                <td className="py-3 px-3 text-center">
                  {canEdit ? (
                    <button
                      onClick={() => handleArrivalToggle(item.id, !item.isArrived)}
                      className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                        item.isArrived 
                          ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                      }`}
                    >
                      {item.isArrived ? '已到货' : '未到货'}
                    </button>
                  ) : (
                    <StatusBadge
                      status={item.isArrived ? '已到货' : '未到货'}
                      color={item.isArrived ? 'green' : 'red'}
                      size="sm"
                    />
                  )}
                  {item.arrivalDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      {item.arrivalDate.toLocaleDateString('zh-CN')}
                    </div>
                  )}
                </td>
                
                {/* 纸卡进度 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-purple-600">{item.cardProgress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-purple-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${item.cardProgress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* 采购进度 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-blue-600">{item.procurementProgress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${item.procurementProgress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* 辅料进度 */}
                <td className="py-3 px-3">
                  <div className="flex flex-col items-center space-y-1">
                    <span className="text-xs font-medium text-green-600">{item.accessoryProgress}%</span>
                    <div className="w-16 bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${item.accessoryProgress}%` }}
                      />
                    </div>
                  </div>
                </td>
                
                {/* 采购数量 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm font-medium text-gray-900">{item.purchaseQuantity.toLocaleString()}</div>
                </td>
                
                {/* 到货数量 */}
                <td className="py-3 px-3 text-center">
                  {canEdit ? (
                    <input
                      type="number"
                      min="0"
                      max={item.purchaseQuantity}
                      value={arrivalQuantities[item.id] || item.arrivalQuantity || item.purchaseQuantity}
                      onChange={(e) => {
                        const newQuantity = parseInt(e.target.value) || 0;
                        setArrivalQuantities(prev => ({
                          ...prev,
                          [item.id]: newQuantity
                        }));
                      }}
                      className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">
                      {item.arrivalQuantity || item.purchaseQuantity}
                    </div>
                  )}
                </td>
                
                {/* 验收照片 */}
                <td className="py-3 px-3 text-center">
                  {canEdit ? (
                    <div className="flex flex-col items-center space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        id={`photo-upload-${item.id}`}
                        onChange={(e) => handlePhotoUpload(item.id, e.target.files)}
                      />
                      <label
                        htmlFor={`photo-upload-${item.id}`}
                        className="cursor-pointer px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        上传照片
                      </label>
                      {uploadedPhotos[item.id] && uploadedPhotos[item.id].length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-green-600 font-medium">
                            已上传 {uploadedPhotos[item.id].length} 张照片
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1 max-w-32">
                            {uploadedPhotos[item.id].slice(0, 3).map((photo, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={photo.preview}
                                  alt={`验收照片${index + 1}`}
                                  className="w-8 h-8 object-cover rounded border cursor-pointer"
                                  onClick={() => setZoomedImage(photo.preview)}
                                />
                                <button
                                  onClick={() => removePhoto(item.id, index)}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {uploadedPhotos[item.id].length > 3 && (
                              <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                                +{uploadedPhotos[item.id].length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      {item.inspectionPhotos.length > 0 ? `${item.inspectionPhotos.length} 张照片` : '无照片'}
                    </div>
                  )}
                </td>
                
                {/* 验收意见 */}
                <td className="py-3 px-3 text-center">
                  {canEdit ? (
                    <div className="flex flex-col space-y-1">
                      <textarea
                        value={inspectionNotes[item.id] || ''}
                        onChange={(e) => setInspectionNotes(prev => ({
                          ...prev,
                          [item.id]: e.target.value
                        }))}
                        placeholder="验收备注..."
                        className="w-32 h-16 text-xs border border-gray-300 rounded px-2 py-1 resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="flex space-x-1">
                        <button
                          onClick={() => handleInspectionComplete(item.id, 'passed')}
                          className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          通过
                        </button>
                        <button
                          onClick={() => handleInspectionComplete(item.id, 'failed')}
                          className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                          不合格
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">待验收</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 渲染已验收栏目
  const renderCompletedInspection = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">订单编号</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-16">图片</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-24">SKU</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">品名</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">采购数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">到货数量</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-32">验收照片</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-24">验收时间</th>
              <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">验收结果</th>
              <th className="text-left py-3 px-3 font-medium text-gray-900 w-32">验收备注</th>
              {canEdit && (
                <th className="text-center py-3 px-3 font-medium text-gray-900 w-20">操作</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredData.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                {/* 订单编号 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-blue-600">{item.purchaseRequestNumber}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                  </div>
                </td>
                
                {/* 产品图片 */}
                <td className="py-3 px-3 text-center">
                  {item.sku.imageUrl ? (
                    <div className="relative group inline-block">
                      <img 
                        src={item.sku.imageUrl} 
                        alt={item.sku.name}
                        className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => handleImageClick(item.sku.imageUrl!)}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                           onClick={() => handleImageClick(item.sku.imageUrl!)}>
                        <ZoomIn className="h-3 w-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                      <Camera className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                
                {/* SKU编码 */}
                <td className="py-3 px-3">
                  <div className="text-sm font-medium text-gray-900">{item.sku.code}</div>
                  <div className="text-xs text-gray-500">{item.sku.category}</div>
                </td>
                
                {/* 品名 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900 font-medium">{item.sku.name}</div>
                  <div className="text-xs text-gray-500 truncate">{item.sku.englishName}</div>
                </td>
                
                {/* 采购数量 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm font-medium text-gray-900">{item.purchaseQuantity.toLocaleString()}</div>
                </td>
                
                {/* 到货数量 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm font-bold text-blue-600">
                    {(item.arrivalQuantity || item.purchaseQuantity).toLocaleString()}
                  </div>
                </td>
                
                {/* 验收照片 */}
                <td className="py-4 px-3 text-center">
                  <div className="flex flex-col items-center space-y-2">
                    {item.inspectionPhotos.length > 0 ? (
                      <>
                        <div className="text-xs text-green-600 font-medium">
                          {item.inspectionPhotos.length} 张照片
                        </div>
                        <div className="flex flex-wrap gap-1 justify-center max-w-32">
                          {item.inspectionPhotos.slice(0, 4).map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo.preview}
                                alt={`验收照片${index + 1}`}
                                className="w-8 h-8 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setZoomedImage(photo.preview)}
                              />
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black bg-opacity-20 rounded cursor-pointer"
                                   onClick={() => setZoomedImage(photo.preview)}>
                                <ZoomIn className="h-2 w-2 text-white" />
                              </div>
                            </div>
                          ))}
                          {item.inspectionPhotos.length > 4 && (
                            <div className="w-8 h-8 bg-gray-200 rounded border flex items-center justify-center text-xs text-gray-600">
                              +{item.inspectionPhotos.length - 4}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-xs text-gray-500">无照片</div>
                    )}
                  </div>
                </td>
                
                {/* 验收时间 */}
                <td className="py-3 px-3 text-center">
                  <div className="text-sm text-gray-900">
                    {item.inspectionDate ? item.inspectionDate.toLocaleDateString('zh-CN') : '-'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.inspector?.name || '-'}
                  </div>
                </td>
                
                {/* 验收结果 */}
                <td className="py-3 px-3 text-center">
                  <StatusBadge
                    status={item.qualityResult === 'passed' ? '通过' : item.qualityResult === 'failed' ? '不合格' : '待验收'}
                    color={item.qualityResult === 'passed' ? 'green' : item.qualityResult === 'failed' ? 'red' : 'yellow'}
                    size="sm"
                  />
                </td>
                
                {/* 验收备注 */}
                <td className="py-3 px-3">
                  <div className="text-sm text-gray-900 max-w-32 truncate" title={item.inspectionNotes}>
                    {item.inspectionNotes || '-'}
                  </div>
                </td>
                
                {/* 操作 */}
                {canEdit && (
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col space-y-1">
                      <button 
                        onClick={() => setEditingInspection(item)}
                        className="px-2 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                      >
                        查看详情
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">到货检验</h1>
            <p className="text-gray-600">管理半成品和成品的到货检验流程，支持质量检查和数据记录</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索订单号或SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-gray-600">SKU: {filteredData.length}</span>
            </div>
          </div>
        </div>

        {/* 权限提示 */}
        {!canEdit && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">权限提示</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  您当前是{user?.role === 'department_manager' ? '部门主管' : 
                           user?.role === 'general_manager' ? '总经理' : 
                           user?.role === 'purchasing_officer' ? '采购专员' : '其他角色'}，只能查看检验数据。只有质检专员可以执行检验操作。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">半成品待验收</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.semiFinishedPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">半成品已验收</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.semiFinishedCompleted}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <Clock className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">成品待验收</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.finishedPending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="text-sm font-medium text-gray-600">成品已验收</h3>
                <p className="text-2xl font-bold text-gray-900">{stats.finishedCompleted}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('semi_finished_pending')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'semi_finished_pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>半成品待验收</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'semi_finished_pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {stats.semiFinishedPending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('semi_finished_completed')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'semi_finished_completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>半成品已验收</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'semi_finished_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {stats.semiFinishedCompleted}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('finished_pending')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'finished_pending'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-5 w-5" />
              <span>成品待验收</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'finished_pending' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {stats.finishedPending}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('finished_completed')}
              className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'finished_completed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <CheckCircle className="h-5 w-5" />
              <span>成品已验收</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'finished_completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {stats.finishedCompleted}
              </span>
            </button>
          </nav>
        </div>

        {/* 自动流转说明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-800">自动流转规则</h3>
          </div>
          <div className="text-sm text-blue-700 space-y-1">
            <p>• <strong>半成品待验收</strong>：自动同步"采购进度"中"自己包装"的进行中订单</p>
            <p>• <strong>成品待验收</strong>：自动同步"采购进度"中"厂家包装"的进行中订单</p>
            <p>• <strong>验收通过后</strong>：半成品→生产排单，成品→统计入库</p>
            <p>• <strong>到货状态联动</strong>：采购进度"到货通知"批量完成时自动更新</p>
          </div>
        </div>

        {/* 内容区域 */}
        {filteredData.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab.includes('pending') ? '没有待验收的SKU' : '没有已验收的SKU'}
            </h3>
            <p className="text-gray-600">
              {activeTab.includes('pending') ? '所有SKU都已完成验收' : '还没有完成验收的SKU'}
            </p>
          </div>
        ) : (
          <>
            {activeTab.includes('pending') && renderPendingInspection()}
            {activeTab.includes('completed') && renderCompletedInspection()}
          </>
        )}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full text-white transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={zoomedImage}
              alt="放大图片"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={() => setZoomedImage(null)}
            />
          </div>
        </div>
      )}

      {/* Edit Inspection Modal */}
      {editingInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                检验详情 - {editingInspection.sku.code}
              </h2>
              <button
                onClick={() => setEditingInspection(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">基本信息</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">订单编号:</span>
                    <p className="font-medium">{editingInspection.purchaseRequestNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">产品类型:</span>
                    <p className="font-medium">
                      {editingInspection.productType === 'semi_finished' ? '半成品' : '成品'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">SKU编码:</span>
                    <p className="font-medium">{editingInspection.sku.code}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">产品名称:</span>
                    <p className="font-medium">{editingInspection.sku.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">采购数量:</span>
                    <p className="font-medium">{editingInspection.purchaseQuantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">到货数量:</span>
                    <p className="font-medium">
                      {(editingInspection.arrivalQuantity || editingInspection.purchaseQuantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 进度信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">纸卡进度</div>
                  <div className="text-lg font-bold text-purple-600 mb-1">{editingInspection.cardProgress}%</div>
                  <ProgressBar progress={editingInspection.cardProgress} color="purple" size="sm" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">采购进度</div>
                  <div className="text-lg font-bold text-blue-600 mb-1">{editingInspection.procurementProgress}%</div>
                  <ProgressBar progress={editingInspection.procurementProgress} color="blue" size="sm" />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-700 mb-2">辅料进度</div>
                  <div className="text-lg font-bold text-green-600 mb-1">{editingInspection.accessoryProgress}%</div>
                  <ProgressBar progress={editingInspection.accessoryProgress} color="green" size="sm" />
                </div>
              </div>

              {/* 验收信息 */}
              {editingInspection.inspectionStatus === 'completed' && (
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-800 mb-2">验收信息</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-green-700">验收时间:</span>
                      <p className="font-medium text-green-900">
                        {editingInspection.inspectionDate?.toLocaleDateString('zh-CN')} {editingInspection.inspectionDate?.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700">验收人员:</span>
                      <p className="font-medium text-green-900">{editingInspection.inspector?.name}</p>
                    </div>
                    <div>
                      <span className="text-green-700">验收结果:</span>
                      <p className="font-medium text-green-900">
                        {editingInspection.qualityResult === 'passed' ? '验收通过' : '验收不合格'}
                      </p>
                    </div>
                    <div>
                      <span className="text-green-700">验收备注:</span>
                      <p className="font-medium text-green-900">{editingInspection.inspectionNotes || '-'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 关闭按钮 */}
              <div className="flex items-center justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditingInspection(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};