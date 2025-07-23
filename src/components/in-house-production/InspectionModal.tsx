import React, { useState } from 'react';
import { X, Upload, Camera, Save, Trash2, Eye } from 'lucide-react';
import { useProduction } from '../../hooks/useProduction';
import { useProcurement } from '../../hooks/useProcurement';
import { useAuth } from '../../hooks/useAuth';

interface InspectionModalProps {
  requestId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  description: string;
}

export const InspectionModal: React.FC<InspectionModalProps> = ({
  requestId,
  onClose,
  onSuccess
}) => {
  const { getPurchaseRequestById, updatePurchaseRequest } = useProcurement();
  const { createSchedulesFromInHouseProduction } = useProduction();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [formData, setFormData] = useState({
    qualityNotes: '',
    quantityNotes: '',
    overallStatus: 'passed' as 'passed' | 'failed',
    remarks: ''
  });

  const request = getPurchaseRequestById(requestId);

  if (!request) {
    return null;
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage: UploadedImage = {
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            preview: e.target?.result as string,
            description: ''
          };
          setUploadedImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleRemoveImage = (imageId: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleImageDescriptionChange = (imageId: string, description: string) => {
    setUploadedImages(prev => 
      prev.map(img => 
        img.id === imageId ? { ...img, description } : img
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // In a real application, you would upload images to a server
      // For now, we'll simulate the inspection completion
      
      await updatePurchaseRequest(requestId, {
        status: 'completed',
        updatedAt: new Date()
      });

      // 🎯 验收完成后，自动创建生产排单
      const schedules = createSchedulesFromInHouseProduction(requestId);
      console.log(`✅ 验收完成：订单已自动流转到生产排单，创建了 ${schedules.length} 个SKU排单记录`);

      // Here you would also save the inspection record with images
      // const inspectionRecord = {
      //   requestId,
      //   inspectorId: user.id,
      //   images: uploadedImages,
      //   ...formData,
      //   inspectionDate: new Date()
      // };

      onSuccess();
    } catch (error) {
      console.error('验收失败:', error);
      alert('验收失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            产品验收 - {request.requestNumber}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">订单信息</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">申请人:</span>
                <p className="font-medium">{request.requester.name}</p>
              </div>
              <div>
                <span className="text-gray-600">总金额:</span>
                <p className="font-medium">¥{request.totalAmount.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600">SKU数量:</span>
                <p className="font-medium">{request.items.length}</p>
              </div>
              <div>
                <span className="text-gray-600">验收人员:</span>
                <p className="font-medium">{user.name}</p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">验收项目</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">图片</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">产品名称</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">生产数量</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">验收状态</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {request.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 px-4">
                        {item.sku.imageUrl ? (
                          <img 
                            src={item.sku.imageUrl} 
                            alt={item.sku.name}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded border flex items-center justify-center">
                            <Camera className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{item.sku.code}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.sku.name}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{item.quantity}</td>
                      <td className="py-3 px-4 text-sm">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          待验收
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">上传验收照片</h3>
            
            {/* Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mb-4">
              <div className="text-center">
                <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-sm text-gray-600 mb-4">
                  点击上传或拖拽照片到此处
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>

            {/* Uploaded Images */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative border border-gray-200 rounded-lg p-2">
                    <img 
                      src={image.preview} 
                      alt="验收照片"
                      className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <input
                      type="text"
                      value={image.description}
                      onChange={(e) => handleImageDescriptionChange(image.id, e.target.value)}
                      placeholder="添加图片描述..."
                      className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(image.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inspection Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                质量检查备注
              </label>
              <textarea
                value={formData.qualityNotes}
                onChange={(e) => setFormData({...formData, qualityNotes: e.target.value})}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入质量检查结果..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数量核对备注
              </label>
              <textarea
                value={formData.quantityNotes}
                onChange={(e) => setFormData({...formData, quantityNotes: e.target.value})}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="请输入数量核对结果..."
              />
            </div>
          </div>

          {/* Overall Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              验收结果 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.overallStatus}
              onChange={(e) => setFormData({...formData, overallStatus: e.target.value as 'passed' | 'failed'})}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="passed">验收通过</option>
              <option value="failed">验收不通过</option>
            </select>
          </div>

          {/* Additional Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              其他备注
            </label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({...formData, remarks: e.target.value})}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入其他备注信息..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || uploadedImages.length === 0}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? '验收中...' : '完成验收'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};