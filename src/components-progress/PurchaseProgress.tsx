@@ .. @@
                               {/* Stage Status Columns */}
                               {currentProgress.stages.map((stage) => {
                                 return (
                                   <td key={stage.id} className="py-4 px-4 text-center">
                                     <div className="flex flex-col items-center space-y-2">
                                       <div className={`text-xs px-2 py-1 rounded-full ${
                                         stage.status === 'completed' ? 'bg-green-100 text-green-800' :
                                         stage.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                         stage.status === 'skipped' ? 'bg-blue-100 text-blue-800' :
                                         'bg-gray-100 text-gray-800'
                                       }`}>
                                         {getStatusText(stage.status)}
                                       </div>
                                       
                                       {/* Completion Date */}
                                       {stage.completedDate && (
                                         <div className="text-xs text-gray-500">
                                           {stage.completedDate.toLocaleDateString('zh-CN')}
                                         </div>
                                       )}
                                       
                                       {/* Remarks for auto-completed stages */}
                                       {stage.remarks && (
                                         <div className="text-xs text-blue-600" title={stage.remarks}>
                                           自动跳过
                                         </div>
                                       )}
+
+                                       {/* 收货确认节点的完成按钮 */}
+                                       {canEdit && stage.name === '收货确认' && stage.status === 'in_progress' && (
+                                         <button
+                                           onClick={() => handleReceiptConfirmationComplete(request.id, stage.name)}
+                                           className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
+                                         >
+                                           完成
+                                         </button>
+                                       )}
                                     </div>
                                   </td>
                                 );
                               })}
+                              
+                              {/* 厂家包装订单的到货数量列 */}
+                              {allocation?.type === 'external' && (
+                                <td className="py-4 px-4 text-center">
+                                  <div className="flex flex-col items-center space-y-2">
+                                    <input
+                                      type="number"
+                                      min="0"
+                                      value={getReceivedQuantity(request.id, item.id)}
+                                      onChange={(e) => handleReceivedQuantityChange(request.id, item.id, parseInt(e.target.value) || 0)}
+                                      className="w-20 text-center border border-gray-300 rounded px-2 py-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
+                                      placeholder={item.quantity.toString()}
+                                    />
+                                    <button
+                                      onClick={() => handleSaveReceivedQuantity(request.id, item.id)}
+                                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
+                                    >
+                                      保存
+                                    </button>
+                                  </div>
+                                </td>
+                              )}
                             </tr>
                           );
                         })}
                         
                         {/* Batch Complete Row */}
                         {canEdit && activeTab === 'in_progress' && (
                           <tr className="bg-gray-50">
                             <td className="py-3 px-4 text-sm font-medium text-gray-700" colSpan={5}>
                               批量操作
                             </td>
                             {/* 为每个节点创建对应的批量操作按钮 */}
                             {currentProgress.stages.map((stage, stageIndex) => {

                               // 检查是否可以操作此节点（前置节点必须已完成）
                               const canOperateStage = () => {
                                 if (stageIndex === 0) return true; // 第一个节点总是可以操作
                                 
                                 // 检查前面所有节点是否都已完成或跳过
                                 for (let i = 0; i < stageIndex; i++) {
                                   const prevStage = currentProgress.stages[i];
                                   if (prevStage.status !== 'completed' && prevStage.status !== 'skipped') {
                                     return false;
                                   }
                                 }
                                 return true;
                               };

                               const isOperatable = canOperateStage();
                               const isInProgress = stage.status === 'in_progress';
                               const isCompleted = stage.status === 'completed' || stage.status === 'skipped';
                               const showButton = isOperatable && !isCompleted;

                               return (
                                 <td key={stage.id} className="py-3 px-4 text-center">
                                   {isCompleted ? (
                                     <span className="px-3 py-1.5 text-xs bg-green-100 text-green-800 rounded-full border border-green-200 font-medium">
                                       已完成
                                     </span>
                                   ) : showButton ? (
                                     <>
                                       {/* 催付类按钮 */}
                                       {stage.name === '定金支付' && (
                                         <button
                                           onClick={() => handlePaymentReminder('deposit', request.id)}
                                           className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center space-x-1 mx-auto"
                                         >
                                           <Bell className="h-3 w-3" />
                                           <span>催付定金</span>
                                         </button>
                                       )}
                                       {stage.name === '纸卡提供' && (
                                         <button
                                           onClick={() => handleRequestCardDelivery(request.id)}
                                           className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors flex items-center space-x-1 mx-auto"
                                         >
                                           <Bell className="h-3 w-3" />
                                           <span>催要纸卡</span>
                                         </button>
                                       )}

                                     
                                       {stage.name === '尾款支付' && (
                                         <button
                                           onClick={() => handlePaymentReminder('final', request.id)}
                                           className="px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors flex items-center space-x-1 mx-auto"
                                         >
                                           <Bell className="h-3 w-3" />
                                           <span>催付尾款</span>
                                         </button>
                                       )}
                                       {/* 批量完成按钮 */}
                                       {!['定金支付', '纸卡提供', '尾款支付'].includes(stage.name) && (
                                         <button
                                           onClick={() => handleCompleteStage(request.id, stage.name)}
                                           className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                         >
                                           批量完成
                                         </button>
                                       )}
                                     </>
                                   ) : (
                                     <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-full border border-gray-200 font-medium">
                                       {!isOperatable ? '等待前置节点' : '未开始'}
                                     </span>
                                   )}
                                 </td>
                               );
                             })}
+                            
+                            {/* 厂家包装订单的到货数量批量操作列 */}
+                            {allocation?.type === 'external' && (
+                              <td className="py-3 px-4 text-center">
+                                <span className="px-3 py-1.5 text-xs bg-gray-100 text-gray-500 rounded-full border border-gray-200 font-medium">
+                                  批量操作
+                                </span>
+                              </td>
+                            )}
                           </tr>
                         )}
                       </tbody>