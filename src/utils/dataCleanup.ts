import { useGlobalStore } from '../store/globalStore';

// 清理重复的质检记录，保留最新的有效数据
export const cleanupDuplicateQualityRecords = () => {
  const { qualityControlRecords, setQualityControlRecords } = useGlobalStore.getState();
  
  // 按采购编号和SKU分组
  const grouped = qualityControlRecords.reduce((acc, record) => {
    const key = `${record.purchaseRequestNumber}-${record.skuId}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(record);
    return acc;
  }, {} as Record<string, typeof qualityControlRecords>);

  // 清理每组中的重复记录，保留包装数据最完整的记录
  const cleanedRecords = Object.values(grouped).map(group => {
    if (group.length === 1) {
      return group[0];
    }
    
    // 优先保留有包装数据的记录
    const recordsWithData = group.filter(r => 
      r.packageCount > 0 || r.totalPieces > 0 || r.piecesPerUnit > 0
    );
    
    if (recordsWithData.length > 0) {
      // 返回最新的有数据的记录
      return recordsWithData.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
    } else {
      // 如果都没有数据，返回最新的记录
      return group.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )[0];
    }
  }).flat();

  console.log(`清理前记录数: ${qualityControlRecords.length}, 清理后记录数: ${cleanedRecords.length}`);
  
  setQualityControlRecords(cleanedRecords);
  return cleanedRecords;
};

// 立即执行清理（在开发环境中）
if (import.meta.env.DEV) {
  // 延迟执行，确保store已初始化
  setTimeout(() => {
    try {
      cleanupDuplicateQualityRecords();
      console.log('✅ 质检记录重复数据清理完成');
    } catch (error) {
      console.log('⚠️ 质检记录清理跳过（store未就绪）');
    }
  }, 2000);
}
