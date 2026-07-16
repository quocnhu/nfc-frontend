export interface ApiResponse<T = any> {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface User {
  id: string;
  email: string;
  fullname: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  roleId: string;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  permissions?: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface SharingContent {
  id: string;
  userId: string;
  url: string;
  itemName: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export interface History {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  details?: string;
  timestamp: string;
  user?: {
    id: string;
    fullname: string;
    email: string;
  };
}

export interface DashboardStats {
  totalUsers: number;
  totalRoles: number;
  totalPermissions: number;
  totalSharingContent: number;
  totalHistories: number;
}

export interface UserPermissions {
  user: User;
  role: string;
  rolePermissions: string[];
  directPermissions: string[];
  mergedPermissions: string[];
}
