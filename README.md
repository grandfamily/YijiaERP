# 采购管理系统 (Procurement Management System)

> 一家百货采购管理系统 - 现代化的企业级采购流程管理平台

## 🌟 项目概述

这是一个基于 React 18 + TypeScript + Vite 构建的现代化采购管理系统，专为中小企业设计，提供完整的采购流程管理解决方案。

## ✨ 核心功能

### 📊 业务模块
- **仪表板** - 实时数据概览和关键指标监控
- **采购申请** - 完整的采购需求申请流程
- **工单审批** - 多级审批工作流
- **订单分配** - 智能订单分配管理
- **采购进度** - 实时进度跟踪和状态更新
- **纸卡进度** - 印刷品设计和生产进度
- **辅料进度** - 辅助材料采购跟踪
- **到货检验** - 质量控制和检验流程
- **生产排单** - 生产计划和排程管理
- **入库登记** - 仓储入库管理
- **发货出柜** - 物流发货管理
- **财务管理** - 采购财务核算
- **系统设置** - 系统配置和用户管理

### 🔧 技术特性
- **响应式设计** - 支持桌面端和移动端
- **角色权限控制** - 细粒度的权限管理
- **数据持久化** - 本地存储 + 云端同步
- **实时更新** - 状态实时同步
- **模块化架构** - 易于扩展和维护

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装和运行

```bash
# 克隆项目
git clone https://github.com/TT7886/Caigouxitong.git

# 进入项目目录
cd Caigouxitong

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

系统将在 http://localhost:5173 启动

### 构建生产版本

```bash
# 构建生产版本
npm run build

# 预览生产版本
npm run preview
```

## 🏗️ 技术栈

- **前端框架**: React 18
- **类型系统**: TypeScript
- **构建工具**: Vite
- **状态管理**: Zustand
- **样式框架**: Tailwind CSS
- **图标库**: Lucide React
- **日期处理**: Day.js
- **工具类**: clsx

## 📁 项目结构

```
src/
├── components/          # 业务组件
│   ├── dashboard/      # 仪表板
│   ├── purchase-requests/ # 采购申请
│   ├── approvals/      # 工单审批
│   ├── order-allocation/ # 订单分配
│   ├── purchase-progress/ # 采购进度
│   ├── card-progress/  # 纸卡进度
│   ├── accessory-progress/ # 辅料进度
│   ├── arrival-inspection/ # 到货检验
│   ├── production-scheduling/ # 生产排单
│   ├── inbound-register/ # 入库登记
│   ├── shipping-outbound/ # 发货出柜
│   ├── finance/        # 财务管理
│   ├── settings/       # 系统设置
│   ├── layout/         # 布局组件
│   └── ui/            # 通用UI组件
├── hooks/              # 自定义 Hooks
├── store/              # 状态管理
├── types/              # TypeScript 类型定义
└── utils/              # 工具函数
```

## 👥 用户角色

系统支持多种用户角色，每个角色具有不同的权限：

- **总经理** - 全系统访问权限
- **部门经理** - 部门管理和审批权限
- **采购员** - 采购操作权限
- **仓库管理员** - 仓储管理权限
- **生产人员** - 生产相关权限
- **质检员** - 质量控制权限
- **财务人员** - 财务管理权限

## 📱 界面预览

系统采用现代化的界面设计，提供清晰的导航和直观的操作体验。

## 🔄 数据管理

- **本地存储**: 使用 localStorage 实现数据持久化
- **状态管理**: 基于 Zustand 的响应式状态管理
- **数据同步**: 支持实时数据更新和状态同步

## 🛡️ 安全特性

- 基于 JWT 的用户认证
- 角色和权限控制
- 数据访问控制
- 操作日志记录

## 📖 开发文档

详细的开发文档和需求文档位于 `docs/` 目录：

- [基础架构文档](docs/第一批-基础架构详细需求文档.md)
- [采购核心流程文档](docs/第二批-采购核心流程详细需求文档.md)
- [进度跟踪系统文档](docs/第三批-进度跟踪系统详细需求文档.md)
- [生产与仓储系统文档](docs/第四批-生产与仓储系统详细需求文档.md)
- [管理与支持系统文档](docs/第五批-管理与支持系统详细需求文档.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request 来改进项目。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 项目地址: https://github.com/TT7886/Caigouxitong
- Issues: https://github.com/TT7886/Caigouxitong/issues

---

© 2025 采购管理系统. All rights reserved.
