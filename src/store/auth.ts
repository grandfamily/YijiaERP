import { User, UserRole } from '../types';

// Mock user data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    name: '张三',
    email: 'zhang.san@company.com',
    role: 'purchasing_officer',
    department: '采购部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: '李四',
    email: 'li.si@company.com',
    role: 'department_manager',
    department: '采购部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '3',
    name: '王五',
    email: 'wang.wu@company.com',
    role: 'card_designer',
    department: '设计部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '4',
    name: '赵六',
    email: 'zhao.liu@company.com',
    role: 'qc_officer',
    department: '质检部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '5',
    name: '孙七',
    email: 'sun.qi@company.com',
    role: 'logistics_staff',
    department: '物流部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '6',
    name: '钱八',
    email: 'qian.ba@company.com',
    role: 'general_manager',
    department: '管理层',
    isActive: true,
    createdAt: new Date('2024-01-01')
 },
 {
   id: '7',
   name: '周九',
   email: 'zhou.jiu@company.com',
   role: 'accessory_staff',
   department: '辅料部',
   isActive: true,
   createdAt: new Date('2024-01-01')
  },
  {
    id: '8',
    name: '吴十',
    email: 'wu.shi@company.com',
    role: 'finance_personnel',
    department: '财务部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  },
  {
    id: '9',
    name: '陈十一',
    email: 'chen.shiyi@company.com',
    role: 'production_staff',
    department: '生产部',
    isActive: true,
    createdAt: new Date('2024-01-01')
  }
];

class AuthStore {
  private currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    // Initialize with first user for demo
    this.currentUser = mockUsers[0];
  }

  subscribe(listener: (user: User | null) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.currentUser));
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  login(email: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      // Mock login logic
      const user = mockUsers.find(u => u.email === email);
      if (user && password === 'password') {
        this.currentUser = user;
        this.notify();
        resolve(user);
      } else {
        reject(new Error('Invalid credentials'));
      }
    });
  }

  logout(): void {
    this.currentUser = null;
    this.notify();
  }

  switchUser(userId: string): void {
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      this.currentUser = user;
      this.notify();
    }
  }

  getAllUsers(): User[] {
    return mockUsers;
  }

  getUsersByRole(role: UserRole): User[] {
    return mockUsers.filter(u => u.role === role);
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    
    const permissions = this.getRolePermissions(this.currentUser.role);
    return permissions.includes(permission);
  }

  private getRolePermissions(role: UserRole): string[] {
    const rolePermissions = {
      purchasing_officer: [
        'create_purchase_request',
        'view_purchase_requests',
        'edit_own_requests',
        'edit_purchase_request',
        'delete_requests',
        'resubmit_requests',
        'bulk_upload_skus',
        'bulk_submit_requests',
        'manage_products',
        'view_suppliers',
        'manage_inventory',
        'manage_order_allocation',
        'manage_procurement_progress',
        'update_procurement_progress',
        'view_procurement_progress',
        'resubmit_requests'
      ],
      department_manager: [
        'view_purchase_requests',
        'approve_purchase_requests',
        'reject_purchase_requests',
        'view_reports',
        'edit_purchase_quantities',
        'partial_approve_skus',
        'manage_products',
        'view_suppliers',
        'manage_suppliers',
        'view_order_allocation'
      ],
      card_designer: [
        'view_card_progress',
        'update_card_design',
        'edit_card_progress',
        'view_assigned_tasks',
        'view_order_allocation'
      ],
      production_staff: [
        'view_production_tasks',
        'update_production_progress',
        'view_accessory_progress',
        'view_order_allocation'
      ],
      general_manager: [
        'view_purchase_requests',
        'final_approve_purchase_requests',
        'reject_purchase_requests',
        'view_reports',
        'view_all_data',
        'view_card_progress',
        'manage_products',
        'view_suppliers',
        'manage_suppliers',
        'view_order_allocation'
      ],
      qc_officer: [
        'view_quality_checks',
        'update_quality_status',
        'reject_items',
        'view_receiving',
        'view_card_progress',
        'view_order_allocation'
      ],
      logistics_staff: [
        'view_shipments',
        'update_shipping_status',
        'create_containers',
        'view_logistics_reports',
        'view_card_progress',
        'view_suppliers',
        'view_order_allocation'
      ],
      accessory_staff: [
        'view_accessory_progress',
        'edit_accessory_progress',
        'update_accessory_status',
        'view_assigned_tasks',
        'view_order_allocation'
      ],
      finance_personnel: [
        'view_finance_records',
        'edit_finance_records',
        'send_payment_reminders',
        'confirm_payments',
        'view_financial_reports',
        'export_financial_data',
        'view_order_allocation',
        'view_purchase_requests'
      ],
      production_staff: [
        'view_production_tasks',
        'update_production_progress',
        'view_accessory_progress',
        'view_order_allocation',
        'manage_in_house_production',
        'edit_in_house_production',
        'manage_production_scheduling',
        'edit_production_scheduling',
        'upload_inspection_images',
        'complete_inspection',
        'view_inspection_history'
      ]
    };

    return rolePermissions[role] || [];
  }
}

export const authStore = new AuthStore();

export const getRoleDisplayName = (role: UserRole): string => {
  const roleNames = {
    purchasing_officer: '采购专员',
    department_manager: '部门主管',
    general_manager: '总经理',
    card_designer: '纸卡设计人员',
    production_staff: '生产排单人员',
    qc_officer: '质检专员',
    logistics_staff: '物流专员',
    accessory_staff: '辅料人员',
    finance_personnel: '财务人员',
    production_staff: '生产人员'
  };
  return roleNames[role];
};