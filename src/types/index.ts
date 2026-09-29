export type PlanType = 'free' | 'pro';
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
  isRead?: boolean; // Dynamically evaluated for current user
  emailDelivered?: boolean;
  emailStatus?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: PlanType;
  role: UserRole;
  operatorPermissions?: OperatorPermission[];
  settings?: AppSettings;
  createdAt: string;
}

export interface Subscription {
  userId: string;
  plan: PlanType;
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
  lastResetDate: string;
  limits?: {
    messagesPerDay: number;
    maxUploadMB: number;
    allowedModels: string[];
    voiceEnabled: boolean;
  };
  remainingMessages?: number;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  dataBase64?: string;
}

export type ErrorType =
  | 'FREE_LIMIT_REACHED'
  | 'PRO_LIMIT_REACHED'
  | 'PRO_REQUIRED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'MODEL_UNAVAILABLE'
  | 'PROVIDER_ERROR'
  | 'TIMEOUT';

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  status: 'complete' | 'streaming' | 'error';
  errorMessage?: string;
  errorType?: ErrorType;
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

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  badge: 'Free' | 'Pro';
  isProOnly: boolean;
  speed: string;
  contextWindow: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';

export type CraftLogoId = 'logo-1' | 'logo-2' | 'logo-3' | 'logo-4' | 'logo-5';

export type AccentColor = 'indigo' | 'cyan' | 'amber' | 'emerald' | 'rose' | 'purple';

export type ChatStyle = 'bubble' | 'clean';

export type ChatWidth = 'comfortable' | 'compact' | 'full';

export interface BackgroundSettings {
  imageUrl: string;
  blur: number; // 0 to 20 px
  opacity: number; // 0.05 to 0.9
  overlayColor: string; // hex
  position: 'center' | 'top' | 'cover';
}

export interface VoiceSettings {
  enabled: boolean;
  speechToTextEnabled: boolean;
  textToSpeechEnabled: boolean;
  voiceName: string; // 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
  speechSpeed: number; // 0.75 to 2.0
  volume: number; // 0.1 to 1.0
  autoPlayResponses: boolean;
}

export type LanguageCode = 'en' | 'ku_badini' | 'ku_sorani' | 'ar' | 'tr' | 'fa' | 'es' | 'fr';

export interface AppSettings {
  theme: ThemeMode;
  accentColor: AccentColor;
  chatStyle: ChatStyle;
  chatWidth: ChatWidth;
  language: LanguageCode;
  selectedLogo: CraftLogoId;
  background: BackgroundSettings;
  voice: VoiceSettings;
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
