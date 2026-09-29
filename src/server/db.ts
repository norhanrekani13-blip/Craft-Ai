import fs from 'fs';
import path from 'path';

export type UserRole = 'user' | 'operator' | 'admin';
export type OperatorPermission =
  | 'users.view'
  | 'plans.view'
  | 'plans.gift'
  | 'system.view'
  | 'announcements.manage';

export type AuditLogAction =
  | 'GIFT_PLAN'
  | 'ASSIGN_ROLE'
  | 'REMOVE_ROLE'
  | 'UPDATE_CONFIG'
  | 'RESET_QUOTA'
  | 'ANNOUNCEMENT_CREATED'
  | 'GLOBAL_ANNOUNCEMENT_SENT'
  | 'USER_ANNOUNCEMENT_SENT'
  | 'ANNOUNCEMENT_DISABLED'
  | 'ANNOUNCEMENT_ENABLED'
  | 'ANNOUNCEMENT_DELETED';

export interface AuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: AuditLogAction;
  targetUserId?: string;
  targetEmail?: string;
  details: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export type AnnouncementType = 'info' | 'update' | 'important' | 'maintenance' | 'warning';
export type AnnouncementTarget = 'global' | 'user';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  target: AnnouncementTarget;
  targetUserId?: string;
  targetEmail?: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  isActive: boolean;
  expiresAt?: string | null;
  readByUserIds: string[];
  createdAt: string;
  isRead?: boolean;
  emailDelivered?: boolean;
  emailStatus?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: 'free' | 'pro';
  role: UserRole;
  operatorPermissions?: OperatorPermission[];
  settings?: any;
  createdAt: string;
}

export interface Subscription {
  userId: string;
  plan: 'free' | 'pro';
  subscriptionStatus: 'active' | 'canceled' | 'expired';
  subscriptionId: string;
  billingCycle: 'monthly' | 'yearly';
  startedAt: string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsageRecord {
  userId: string;
  messagesToday: number;
  totalMessages: number;
  tokensUsed: number;
  voiceRequestsToday: number;
  storageBytesUsed: number;
  lastResetDate: string; // YYYY-MM-DD
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string; // mime
  url?: string;
  dataBase64?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  status: 'complete' | 'streaming' | 'error';
  errorMessage?: string;
  errorType?: 'FREE_LIMIT_REACHED' | 'PRO_LIMIT_REACHED' | 'PRO_REQUIRED' | 'RATE_LIMIT_EXCEEDED' | 'MODEL_UNAVAILABLE' | 'PROVIDER_ERROR' | 'TIMEOUT';
  attachments?: Attachment[];
  audioUrl?: string;
  metrics?: {
    ttftMs?: number;
    totalDurationMs?: number;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  isPinned: boolean;
  isArchived: boolean;
  model: string;
  createdAt: string;
  updatedAt: string;
  matchSnippet?: string;
  matchCount?: number;
}

export interface SystemConfig {
  freeLimits: {
    messagesPerDay: number;
    maxUploadMB: number;
    allowedModels: string[];
    voiceEnabled: boolean;
  };
  proLimits: {
    messagesPerDay: number;
    maxUploadMB: number;
    allowedModels: string[];
    voiceEnabled: boolean;
  };
  maintenanceMode: boolean;
  simulatedProviderLimit: boolean;
}

interface DatabaseSchema {
  users: User[];
  subscriptions: Subscription[];
  usage: UsageRecord[];
  conversations: Conversation[];
  messages: Message[];
  auditLogs: AuditLog[];
  systemConfig: SystemConfig;
  announcements: Announcement[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'craft_ai_data.json');

// Root / Primary Admin constants
export const ROOT_ADMIN_ID = 'user_norhan';
export const ROOT_ADMIN_EMAIL = 'norhanrekani03@gmail.com';

const DEFAULT_USERS: User[] = [
  {
    id: 'user_norhan',
    name: 'Norhan Rekani',
    email: 'norhanrekani03@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    plan: 'pro',
    role: 'admin',
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'user_operator',
    name: 'Ops Coordinator',
    email: 'ops@craft.ai',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
    plan: 'pro',
    role: 'operator',
    operatorPermissions: ['users.view', 'plans.view', 'plans.gift', 'system.view'],
    createdAt: new Date('2026-01-15').toISOString(),
  },
  {
    id: 'user_alex',
    name: 'Alex Rivera',
    email: 'alex@craft.ai',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    plan: 'free',
    role: 'user',
    createdAt: new Date('2026-02-15').toISOString(),
  },
  {
    id: 'user_guest',
    name: 'Guest Maker',
    email: 'guest@craft.ai',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    plan: 'free',
    role: 'user',
    createdAt: new Date('2026-03-01').toISOString(),
  },
];

const DEFAULT_SUBSCRIPTIONS: Subscription[] = [
  {
    userId: 'user_norhan',
    plan: 'pro',
    subscriptionStatus: 'active',
    subscriptionId: 'sub_craft_pro_enterprise_8892',
    billingCycle: 'yearly',
    startedAt: '2026-01-01T00:00:00.000Z',
    expiresAt: '2027-01-01T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'user_operator',
    plan: 'pro',
    subscriptionStatus: 'active',
    subscriptionId: 'sub_craft_pro_ops',
    billingCycle: 'yearly',
    startedAt: '2026-01-15T00:00:00.000Z',
    expiresAt: '2027-01-15T00:00:00.000Z',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'user_alex',
    plan: 'free',
    subscriptionStatus: 'active',
    subscriptionId: 'sub_craft_free',
    billingCycle: 'monthly',
    startedAt: '2026-02-15T00:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-02-15T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    userId: 'user_guest',
    plan: 'free',
    subscriptionStatus: 'active',
    subscriptionId: 'sub_craft_guest',
    billingCycle: 'monthly',
    startedAt: '2026-03-01T00:00:00.000Z',
    expiresAt: '2099-01-01T00:00:00.000Z',
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

const DEFAULT_CONFIG: SystemConfig = {
  freeLimits: {
    messagesPerDay: 25,
    maxUploadMB: 5,
    allowedModels: ['gemini-3.8-flash'],
    voiceEnabled: true,
  },
  proLimits: {
    messagesPerDay: 500,
    maxUploadMB: 25,
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-image'],
    voiceEnabled: true,
  },
  maintenanceMode: false,
  simulatedProviderLimit: false,
};

const DEFAULT_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_welcome_default',
    title: 'Craft AI Update: Version 3.8 Live',
    message: 'Welcome to the updated Craft AI workspace! Featuring the 5-logo identity system, ultra-fast streaming responses, and professional capacity management.',
    type: 'update',
    target: 'global',
    authorId: 'user_norhan',
    authorName: 'Norhan Rekani',
    authorRole: 'admin',
    isActive: true,
    expiresAt: null,
    readByUserIds: [],
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString(),
  },
];

class Database {
  private data: DatabaseSchema;
  // High-performance O(1) in-memory indices
  private usersById = new Map<string, User>();
  private usersByEmail = new Map<string, User>();
  private subscriptionsByUserId = new Map<string, Subscription>();
  private usageByUserId = new Map<string, UsageRecord>();
  private conversationsById = new Map<string, Conversation>();
  private messagesByConvId = new Map<string, Message[]>();
  private messagesById = new Map<string, Message>();
  private announcementsById = new Map<string, Announcement>();

  private savePending = false;
  private isWriting = false;

  constructor() {
    this.data = this.loadData();
    this.rebuildIndices();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DATA_FILE)) {
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(content);
        const users = parsed.users || DEFAULT_USERS;

        // Ensure Root Admin always retains admin role
        const root = users.find((u: User) => u.id === ROOT_ADMIN_ID || u.email.toLowerCase() === ROOT_ADMIN_EMAIL);
        if (root) {
          root.role = 'admin';
        }

        return {
          users,
          subscriptions: parsed.subscriptions || DEFAULT_SUBSCRIPTIONS,
          usage: parsed.usage || [],
          conversations: parsed.conversations || [],
          messages: parsed.messages || [],
          auditLogs: parsed.auditLogs || [],
          systemConfig: parsed.systemConfig || DEFAULT_CONFIG,
          announcements: parsed.announcements || DEFAULT_ANNOUNCEMENTS,
        };
      }
    } catch (e) {
      console.error('Error reading database file, initializing defaults:', e);
    }

    const initial: DatabaseSchema = {
      users: DEFAULT_USERS,
      subscriptions: DEFAULT_SUBSCRIPTIONS,
      usage: [],
      conversations: [
        {
          id: 'conv_welcome_1',
          userId: 'user_norhan',
          title: 'Welcome to Craft AI',
          isPinned: true,
          isArchived: false,
          model: 'gemini-3.8-flash',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      messages: [
        {
          id: 'msg_welcome_u1',
          conversationId: 'conv_welcome_1',
          role: 'user',
          content: 'Hello Craft AI! Tell me about yourself.',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          status: 'complete',
        },
        {
          id: 'msg_welcome_a1',
          conversationId: 'conv_welcome_1',
          role: 'assistant',
          content: `Welcome to **Craft AI**! 🚀\n\nI am your artisan AI companion designed for speed, precision, and depth. Ask any question to get started immediately!`,
          model: 'gemini-3.8-flash',
          createdAt: new Date(Date.now() - 3590000).toISOString(),
          status: 'complete',
        },
      ],
      auditLogs: [
        {
          id: 'audit_init_1',
          adminId: 'user_norhan',
          adminName: 'Norhan Rekani',
          adminEmail: 'norhanrekani03@gmail.com',
          action: 'ASSIGN_ROLE',
          targetUserId: 'user_norhan',
          targetEmail: 'norhanrekani03@gmail.com',
          details: 'Initialized Root Administrator account.',
          createdAt: new Date('2026-01-01').toISOString(),
        },
      ],
      systemConfig: DEFAULT_CONFIG,
      announcements: DEFAULT_ANNOUNCEMENTS,
    };

    return initial;
  }

  private rebuildIndices() {
    this.usersById.clear();
    this.usersByEmail.clear();
    for (const u of this.data.users) {
      this.usersById.set(u.id, u);
      this.usersByEmail.set(u.email.toLowerCase(), u);
    }

    this.subscriptionsByUserId.clear();
    for (const s of this.data.subscriptions) {
      this.subscriptionsByUserId.set(s.userId, s);
    }

    this.usageByUserId.clear();
    for (const u of this.data.usage) {
      this.usageByUserId.set(u.userId, u);
    }

    this.conversationsById.clear();
    for (const c of this.data.conversations) {
      this.conversationsById.set(c.id, c);
    }

    this.messagesByConvId.clear();
    this.messagesById.clear();
    for (const m of this.data.messages) {
      this.messagesById.set(m.id, m);
      const list = this.messagesByConvId.get(m.conversationId);
      if (list) {
        list.push(m);
      } else {
        this.messagesByConvId.set(m.conversationId, [m]);
      }
    }

    this.announcementsById.clear();
    if (!this.data.announcements) {
      this.data.announcements = [...DEFAULT_ANNOUNCEMENTS];
    }
    for (const a of this.data.announcements) {
      this.announcementsById.set(a.id, a);
    }
  }

  // Non-blocking asynchronous background persistence
  private scheduleAsyncSave() {
    if (this.savePending) return;
    this.savePending = true;

    setImmediate(async () => {
      this.savePending = false;
      if (this.isWriting) return;
      this.isWriting = true;
      try {
        if (!fs.existsSync(DATA_DIR)) {
          await fs.promises.mkdir(DATA_DIR, { recursive: true });
        }
        await fs.promises.writeFile(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
      } catch (e) {
        console.error('Async database write error:', e);
      } finally {
        this.isWriting = false;
      }
    });
  }

  // --- Users & Auth (O(1)) ---
  getUserById(userId: string): User | undefined {
    return this.usersById.get(userId);
  }

  getUserByEmail(email: string): User | undefined {
    return this.usersByEmail.get(email.toLowerCase());
  }

  getAllUsers(search?: string, roleFilter?: string, planFilter?: string): (User & { subscription?: Subscription; usage?: UsageRecord })[] {
    const q = search && search.trim() ? search.toLowerCase() : null;

    return this.data.users
      .filter((u) => {
        if (roleFilter && roleFilter !== 'all' && u.role !== roleFilter) return false;
        if (planFilter && planFilter !== 'all' && u.plan !== planFilter) return false;
        if (q) {
          const matchEmail = u.email.toLowerCase().includes(q);
          const matchName = u.name.toLowerCase().includes(q);
          const matchId = u.id.toLowerCase().includes(q);
          return matchEmail || matchName || matchId;
        }
        return true;
      })
      .map((u) => {
        const subscription = this.subscriptionsByUserId.get(u.id);
        const usage = this.usageByUserId.get(u.id);
        return {
          ...u,
          subscription,
          usage,
        };
      })
      .sort((a, b) => {
        // Root admin first, then admins, operators, users
        if (a.id === ROOT_ADMIN_ID) return -1;
        if (b.id === ROOT_ADMIN_ID) return 1;
        if (a.role === 'admin' && b.role !== 'admin') return -1;
        if (b.role === 'admin' && a.role !== 'admin') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }

  createUser(name: string, email: string): User {
    const existing = this.getUserByEmail(email);
    if (existing) return existing;

    const isRoot = email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

    const newUser: User = {
      id: isRoot ? ROOT_ADMIN_ID : `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      email,
      avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80`,
      plan: isRoot ? 'pro' : 'free',
      role: isRoot ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);
    this.usersById.set(newUser.id, newUser);
    this.usersByEmail.set(newUser.email.toLowerCase(), newUser);

    const sub: Subscription = {
      userId: newUser.id,
      plan: newUser.plan,
      subscriptionStatus: 'active',
      subscriptionId: `sub_${newUser.id}`,
      billingCycle: 'monthly',
      startedAt: new Date().toISOString(),
      expiresAt: isRoot ? '2027-01-01T00:00:00.000Z' : '2099-01-01T00:00:00.000Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.subscriptions.push(sub);
    this.subscriptionsByUserId.set(newUser.id, sub);

    this.scheduleAsyncSave();
    return newUser;
  }

  updateUserProfile(userId: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    Object.assign(user, updates);
    if (updates.email) {
      this.usersByEmail.set(updates.email.toLowerCase(), user);
    }
    this.scheduleAsyncSave();
    return user;
  }

  updateUserSettings(userId: string, settings: any): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;
    user.settings = { ...(user.settings || {}), ...settings };
    this.scheduleAsyncSave();
    return user;
  }

  // --- Role Management & Root Admin Protection ---
  setUserRole(
    targetUserId: string,
    newRole: UserRole,
    operatorPermissions: OperatorPermission[] = ['users.view', 'plans.view'],
    executor: User
  ): { success: boolean; user?: User; error?: string } {
    const target = this.getUserById(targetUserId);
    if (!target) {
      return { success: false, error: 'Target user not found.' };
    }

    // Root Admin protection: CANNOT be demoted or removed
    if (target.id === ROOT_ADMIN_ID || target.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      return { success: false, error: 'The primary Root Administrator role is permanent and cannot be modified.' };
    }

    // Prevent non-admin from modifying roles
    if (executor.role !== 'admin') {
      return { success: false, error: 'Permission denied: Only Administrators can assign or remove roles.' };
    }

    const previousRole = target.role;
    target.role = newRole;

    if (newRole === 'operator') {
      target.operatorPermissions = operatorPermissions;
    } else {
      delete target.operatorPermissions;
    }

    // Record audit log
    this.addAuditLog({
      adminId: executor.id,
      adminName: executor.name,
      adminEmail: executor.email,
      action: newRole === 'user' ? 'REMOVE_ROLE' : 'ASSIGN_ROLE',
      targetUserId: target.id,
      targetEmail: target.email,
      details: `Changed role from ${previousRole.toUpperCase()} to ${newRole.toUpperCase()}${
        newRole === 'operator' ? ` with permissions: ${operatorPermissions.join(', ')}` : ''
      }.`,
      metadata: { previousRole, newRole, operatorPermissions },
    });

    this.scheduleAsyncSave();
    return { success: true, user: target };
  }

  // --- Gift Plan System ---
  giftPlan(
    targetEmail: string,
    plan: 'pro',
    durationDays: number, // e.g. 7, 30, 90, 365, or -1 for permanent
    reason: string = 'Gifted by Administrator',
    executor: User
  ): { success: boolean; user?: User; subscription?: Subscription; error?: string } {
    // Check permission: Admin or Operator with 'plans.gift'
    const isAllowed = executor.role === 'admin' || (executor.role === 'operator' && executor.operatorPermissions?.includes('plans.gift'));
    if (!isAllowed) {
      return { success: false, error: 'Permission denied: You do not have permission to gift plans.' };
    }

    const target = this.getUserByEmail(targetEmail);
    if (!target) {
      return { success: false, error: `No account found for email: ${targetEmail}` };
    }

    const previousPlan = target.plan;
    target.plan = plan;

    const now = new Date();
    let expiresAt: string;

    if (durationDays === -1) {
      // Permanent Pro
      expiresAt = '2099-01-01T00:00:00.000Z';
    } else {
      const expDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
      expiresAt = expDate.toISOString();
    }

    let sub = this.subscriptionsByUserId.get(target.id);
    if (sub) {
      sub.plan = plan;
      sub.subscriptionStatus = 'active';
      sub.expiresAt = expiresAt;
      sub.updatedAt = now.toISOString();
    } else {
      sub = {
        userId: target.id,
        plan,
        subscriptionStatus: 'active',
        subscriptionId: `gift_sub_${Date.now()}`,
        billingCycle: 'monthly',
        startedAt: now.toISOString(),
        expiresAt,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      this.data.subscriptions.push(sub);
      this.subscriptionsByUserId.set(target.id, sub);
    }

    const durationLabel = durationDays === -1 ? 'Permanent' : `${durationDays} days`;

    // Record Audit Log
    this.addAuditLog({
      adminId: executor.id,
      adminName: executor.name,
      adminEmail: executor.email,
      action: 'GIFT_PLAN',
      targetUserId: target.id,
      targetEmail: target.email,
      details: `Gifted Craft AI Pro (${durationLabel}). Reason: ${reason}`,
      metadata: { previousPlan, newPlan: plan, durationDays, expiresAt, reason },
    });

    this.scheduleAsyncSave();
    return { success: true, user: target, subscription: sub };
  }

  // --- Audit Logs ---
  addAuditLog(entry: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    if (!this.data.auditLogs) {
      this.data.auditLogs = [];
    }

    const log: AuditLog = {
      ...entry,
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    this.data.auditLogs.unshift(log);
    // Keep last 500 logs
    if (this.data.auditLogs.length > 500) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 500);
    }
    this.scheduleAsyncSave();
    return log;
  }

  getAuditLogs(limit: number = 50): AuditLog[] {
    return (this.data.auditLogs || []).slice(0, limit);
  }

  // --- Subscriptions ---
  getSubscription(userId: string): Subscription {
    let sub = this.subscriptionsByUserId.get(userId);
    if (!sub) {
      sub = {
        userId,
        plan: 'free',
        subscriptionStatus: 'active',
        subscriptionId: `sub_${userId}`,
        billingCycle: 'monthly',
        startedAt: new Date().toISOString(),
        expiresAt: '2099-01-01T00:00:00.000Z',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.data.subscriptions.push(sub);
      this.subscriptionsByUserId.set(userId, sub);
      this.scheduleAsyncSave();
    }
    return sub;
  }

  updateSubscription(
    userId: string,
    plan: 'free' | 'pro',
    status: 'active' | 'canceled' | 'expired' = 'active',
    cycle: 'monthly' | 'yearly' = 'monthly'
  ): Subscription {
    const user = this.getUserById(userId);
    if (user) {
      user.plan = plan;
    }

    let sub = this.subscriptionsByUserId.get(userId);
    const now = new Date();
    const expiry = new Date(now);
    if (cycle === 'yearly') {
      expiry.setFullYear(expiry.getFullYear() + 1);
    } else {
      expiry.setMonth(expiry.getMonth() + 1);
    }

    if (sub) {
      sub.plan = plan;
      sub.subscriptionStatus = status;
      sub.billingCycle = cycle;
      sub.updatedAt = now.toISOString();
      if (plan === 'pro') {
        sub.expiresAt = expiry.toISOString();
      }
    } else {
      sub = {
        userId,
        plan,
        subscriptionStatus: status,
        subscriptionId: `sub_craft_${Date.now()}`,
        billingCycle: cycle,
        startedAt: now.toISOString(),
        expiresAt: plan === 'pro' ? expiry.toISOString() : '2099-01-01T00:00:00.000Z',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
      this.data.subscriptions.push(sub);
      this.subscriptionsByUserId.set(userId, sub);
    }

    this.scheduleAsyncSave();
    return sub;
  }

  // --- Usage Tracking (O(1)) ---
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  getUsage(userId: string): UsageRecord {
    const today = this.getTodayString();
    let record = this.usageByUserId.get(userId);
    if (!record) {
      record = {
        userId,
        messagesToday: 0,
        totalMessages: 0,
        tokensUsed: 0,
        voiceRequestsToday: 0,
        storageBytesUsed: 0,
        lastResetDate: today,
      };
      this.data.usage.push(record);
      this.usageByUserId.set(userId, record);
      this.scheduleAsyncSave();
      return record;
    }

    if (record.lastResetDate !== today) {
      record.messagesToday = 0;
      record.voiceRequestsToday = 0;
      record.lastResetDate = today;
      this.scheduleAsyncSave();
    }
    return record;
  }

  incrementUsage(userId: string, tokens: number = 0, uploadBytes: number = 0, isVoice: boolean = false): UsageRecord {
    const record = this.getUsage(userId);
    record.messagesToday += 1;
    record.totalMessages += 1;
    record.tokensUsed += tokens;
    if (uploadBytes > 0) {
      record.storageBytesUsed += uploadBytes;
    }
    if (isVoice) {
      record.voiceRequestsToday += 1;
    }
    this.scheduleAsyncSave();
    return record;
  }

  resetUserUsage(userId: string) {
    const record = this.getUsage(userId);
    record.messagesToday = 0;
    record.voiceRequestsToday = 0;
    this.scheduleAsyncSave();
    return record;
  }

  // --- Conversations ---
  getConversations(userId: string, search?: string, isArchived?: boolean): Conversation[] {
    const query = search && search.trim() ? search.toLowerCase() : null;

    return this.data.conversations
      .filter((c) => {
        if (c.userId !== userId) return false;
        if (isArchived !== undefined && c.isArchived !== isArchived) return false;
        if (query) {
          const matchTitle = c.title.toLowerCase().includes(query);
          const msgs = this.messagesByConvId.get(c.id);
          const matchMsg = msgs ? msgs.some((m) => m.content.toLowerCase().includes(query)) : false;
          return matchTitle || matchMsg;
        }
        return true;
      })
      .map((c) => {
        if (!query) return c;
        let matchSnippet: string | undefined;
        let matchCount = 0;

        const msgs = this.messagesByConvId.get(c.id);
        if (msgs) {
          for (const m of msgs) {
            const contentLower = m.content.toLowerCase();
            const idx = contentLower.indexOf(query);
            if (idx !== -1) {
              matchCount++;
              if (!matchSnippet) {
                const start = Math.max(0, idx - 25);
                const end = Math.min(m.content.length, idx + query.length + 45);
                matchSnippet =
                  (start > 0 ? '...' : '') +
                  m.content.slice(start, end).replace(/\s+/g, ' ') +
                  (end < m.content.length ? '...' : '');
              }
            }
          }
        }

        return {
          ...c,
          matchSnippet,
          matchCount,
        };
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }

  getConversation(id: string, userId: string): Conversation | undefined {
    const conv = this.conversationsById.get(id);
    if (!conv || conv.userId !== userId) return undefined;
    return conv;
  }

  createConversation(userId: string, title: string = 'New Conversation', model: string = 'gemini-3.8-flash'): Conversation {
    const conv: Conversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      title,
      isPinned: false,
      isArchived: false,
      model,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.conversations.unshift(conv);
    this.conversationsById.set(conv.id, conv);
    this.messagesByConvId.set(conv.id, []);
    this.scheduleAsyncSave();
    return conv;
  }

  updateConversation(id: string, userId: string, updates: Partial<Conversation>): Conversation | undefined {
    const conv = this.getConversation(id, userId);
    if (!conv) return undefined;
    Object.assign(conv, updates, { updatedAt: new Date().toISOString() });
    this.scheduleAsyncSave();
    return conv;
  }

  deleteConversation(id: string, userId: string): boolean {
    const conv = this.getConversation(id, userId);
    if (!conv) return false;

    const idx = this.data.conversations.indexOf(conv);
    if (idx !== -1) {
      this.data.conversations.splice(idx, 1);
    }
    this.conversationsById.delete(id);

    const msgs = this.messagesByConvId.get(id) || [];
    for (const m of msgs) {
      this.messagesById.delete(m.id);
    }
    this.messagesByConvId.delete(id);
    this.data.messages = this.data.messages.filter((m) => m.conversationId !== id);

    this.scheduleAsyncSave();
    return true;
  }

  // --- Messages ---
  getMessages(conversationId: string, limit?: number): Message[] {
    const list = this.messagesByConvId.get(conversationId) || [];
    if (limit && limit > 0 && list.length > limit) {
      return list.slice(list.length - limit);
    }
    return list;
  }

  getMessage(id: string): Message | undefined {
    return this.messagesById.get(id);
  }

  addMessage(msg: Omit<Message, 'id' | 'createdAt'>): Message {
    const newMsg: Message = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };

    this.data.messages.push(newMsg);
    this.messagesById.set(newMsg.id, newMsg);

    let list = this.messagesByConvId.get(msg.conversationId);
    if (!list) {
      list = [];
      this.messagesByConvId.set(msg.conversationId, list);
    }
    list.push(newMsg);

    const conv = this.conversationsById.get(msg.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
      if (conv.title === 'New Conversation' && msg.role === 'user') {
        conv.title = msg.content.slice(0, 36).trim() + (msg.content.length > 36 ? '...' : '');
      }
    }

    this.scheduleAsyncSave();
    return newMsg;
  }

  updateMessage(id: string, updates: Partial<Message>): Message | undefined {
    const msg = this.getMessage(id);
    if (!msg) return undefined;
    Object.assign(msg, updates);
    this.scheduleAsyncSave();
    return msg;
  }

  deleteMessage(id: string): boolean {
    const msg = this.messagesById.get(id);
    if (!msg) return false;

    this.messagesById.delete(id);
    const list = this.messagesByConvId.get(msg.conversationId);
    if (list) {
      const idx = list.indexOf(msg);
      if (idx !== -1) list.splice(idx, 1);
    }

    const dataIdx = this.data.messages.indexOf(msg);
    if (dataIdx !== -1) {
      this.data.messages.splice(dataIdx, 1);
    }

    this.scheduleAsyncSave();
    return true;
  }

  removeMessagesAfter(conversationId: string, timestamp: string) {
    const targetTime = new Date(timestamp).getTime();
    const list = this.messagesByConvId.get(conversationId) || [];
    const remaining = list.filter((m) => new Date(m.createdAt).getTime() <= targetTime);
    this.messagesByConvId.set(conversationId, remaining);

    this.data.messages = this.data.messages.filter((m) => {
      if (m.conversationId !== conversationId) return true;
      return new Date(m.createdAt).getTime() <= targetTime;
    });

    this.rebuildIndices();
    this.scheduleAsyncSave();
  }

  // --- System Config ---
  getConfig(): SystemConfig {
    return this.data.systemConfig;
  }

  updateConfig(updates: Partial<SystemConfig>): SystemConfig {
    Object.assign(this.data.systemConfig, updates);
    this.scheduleAsyncSave();
    return this.data.systemConfig;
  }

  // --- Announcements ---
  getAnnouncementsForUser(userId: string): Announcement[] {
    const now = Date.now();
    return (this.data.announcements || [])
      .filter((a) => {
        if (!a.isActive) return false;
        if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
        if (a.target === 'global') return true;
        return a.targetUserId === userId;
      })
      .map((a) => ({
        ...a,
        isRead: Boolean(a.readByUserIds && a.readByUserIds.includes(userId)),
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getAllAnnouncements(): Announcement[] {
    return [...(this.data.announcements || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getAnnouncementById(id: string): Announcement | undefined {
    return this.announcementsById.get(id);
  }

  addAnnouncement(
    ann: Omit<Announcement, 'id' | 'createdAt' | 'readByUserIds'>
  ): Announcement {
    const newAnn: Announcement = {
      ...ann,
      id: `ann_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      readByUserIds: [],
      createdAt: new Date().toISOString(),
    };

    if (!this.data.announcements) {
      this.data.announcements = [];
    }
    this.data.announcements.unshift(newAnn);
    this.announcementsById.set(newAnn.id, newAnn);
    this.scheduleAsyncSave();
    return newAnn;
  }

  markAnnouncementAsRead(id: string, userId: string): boolean {
    const ann = this.announcementsById.get(id);
    if (!ann) return false;
    if (!ann.readByUserIds) ann.readByUserIds = [];
    if (!ann.readByUserIds.includes(userId)) {
      ann.readByUserIds.push(userId);
      this.scheduleAsyncSave();
    }
    return true;
  }

  toggleAnnouncementActive(id: string): Announcement | undefined {
    const ann = this.announcementsById.get(id);
    if (!ann) return undefined;
    ann.isActive = !ann.isActive;
    this.scheduleAsyncSave();
    return ann;
  }

  deleteAnnouncement(id: string): boolean {
    const idx = (this.data.announcements || []).findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.data.announcements.splice(idx, 1);
    this.announcementsById.delete(id);
    this.scheduleAsyncSave();
    return true;
  }
}

export const db = new Database();
