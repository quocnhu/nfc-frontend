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
  status?: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  userType?: 'LOCAL' | 'GOOGLE';
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  isActive?: boolean;
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

export interface RequestCounts {
  today: number;
  month: number;
  year: number;
}

export interface UserPermissions {
  user: User & { createdBy?: string | null };
  role: string;
  rolePermissions: string[];
  directPermissions: string[];
  mergedPermissions: string[];
  needsUpgrade?: boolean;
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

export interface Translation {
  id: string;
  userId: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  createdAt: string;
  user?: { id: string; fullname: string; email: string };
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

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  features?: string[];
  price: number;
  currency: string;
  durationDays: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  planId?: string;
  plan?: Plan;
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'GRACE_PERIOD' | 'EXPIRED' | 'CANCELLED';
  startDate: string;
  endDate: string;
  cancelledAt?: string | null;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscription extends Subscription {
  user?: { id: string; email: string; fullname: string; avatarUrl?: string; status: string };
}

export interface Payment {
  id: string;
  userId: string;
  user?: { id: string; fullname: string; email: string; avatarUrl?: string };
  planId?: string;
  plan?: Plan;
  subscriptionId?: string;
  subscription?: Subscription;
  amount: number;
  currency: string;
  paypalOrderId?: string;
  paypalPayerId?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  durationDays: number;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentStatus {
  isActive: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  expiresAt: string | null;
  daysRemaining: number;
  currentSubscription: {
    plan: Plan;
    status: string;
    endDate: string;
  } | null;
  subscriptionHistory: Array<{
    plan: Plan;
    status: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
  }>;
  hasUsedFreeTrial: boolean;
  lastPayment: Payment | null;
}
