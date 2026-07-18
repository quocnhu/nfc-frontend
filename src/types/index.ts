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
  failedLoginCount?: number;
  lockedUntil?: string | null;
  status?: 'ACTIVE' | 'DISABLED';
  expiresAt?: string | null;
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
  user?: { id: string; fullname: string; email: string };
  url: string;
  itemName: string;
  icon: string;
  createdBy?: string;
  creator?: { id: string; fullname: string; email: string };
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
  ipAddress?: string;
  userAgent?: string;
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

export interface Folder {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  createdAt: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  size: number;
  created_at: string;
  mimetype: string;
  type?: 'avatar' | 'photo';
  path?: string;
}

export interface QRCode {
  id: string;
  userId: string;
  name: string;
  url: string;
  createdAt: string;
}

export interface SuspiciousAlert {
  type: 'brute_force_ip' | 'brute_force_account' | 'high_failure_rate' | 'permission_change' | 'deletion';
  severity: 'high' | 'medium' | 'low';
  message: string;
  count?: number;
  ip?: string;
  email?: string;
  user?: { id: string; fullname: string; email: string };
  timestamp: string;
}

export interface SuspiciousActivity {
  alerts: SuspiciousAlert[];
  summary: {
    failedLoginsLastHour: number;
    successfulLoginsLastHour: number;
    alertsCount: number;
  };
}

export interface Payment {
  id: string;
  userId: string;
  user?: { id: string; fullname: string; email: string; avatarUrl?: string };
  amount: number;
  currency: string;
  paypalOrderId?: string;
  paypalPayerId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  durationDays: number;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatus {
  isActive: boolean;
  status: 'ACTIVE' | 'DISABLED';
  expiresAt: string | null;
  daysRemaining: number;
  lastPayment: Payment | null;
}
