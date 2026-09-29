import {
  User,
  Subscription,
  UsageRecord,
  Conversation,
  Message,
  Attachment,
  SystemConfig,
  Announcement,
  AnnouncementType,
  AnnouncementTarget,
} from '../types/index.js';

class ApiService {
  private currentUserId: string = 'user_norhan';

  setUserId(id: string) {
    this.currentUserId = id;
    try {
      localStorage.setItem('craft_ai_user_id', id);
    } catch (e) {
      // ignore
    }
  }

  getUserId(): string {
    try {
      const stored = localStorage.getItem('craft_ai_user_id');
      if (stored) return stored;
    } catch (e) {
      // ignore
    }
    return this.currentUserId;
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.getUserId()}`,
      'x-user-id': this.getUserId(),
    };
  }

  // --- Auth & User ---
  async getMe(): Promise<{ user: User; subscription: Subscription; usage: UsageRecord }> {
    const res = await fetch('/api/auth/me', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch user session');
    return res.json();
  }

  async login(email: string, name?: string): Promise<{ user: User; subscription: Subscription; token: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    this.setUserId(data.token);
    return data;
  }

  async switchAccount(userId: string): Promise<{ user: User; subscription: Subscription; usage: UsageRecord }> {
    const res = await fetch('/api/auth/switch-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    if (!res.ok) throw new Error('Failed to switch account');
    const data = await res.json();
    this.setUserId(data.token);
    return data;
  }

  async updateProfile(name: string, avatar: string): Promise<{ user: User }> {
    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ name, avatar }),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  }

  // --- Conversations ---
  async getConversations(search?: string, isArchived?: boolean): Promise<Conversation[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (isArchived !== undefined) params.append('archived', String(isArchived));

    const res = await fetch(`/api/conversations?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to load conversations');
    const data = await res.json();
    return data.conversations;
  }

  async createConversation(title?: string, model?: string): Promise<Conversation> {
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ title, model }),
    });
    if (!res.ok) throw new Error('Failed to create conversation');
    const data = await res.json();
    return data.conversation;
  }

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    const res = await fetch(`/api/conversations/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch conversation');
    return res.json();
  }

  async updateConversation(
    id: string,
    updates: Partial<Pick<Conversation, 'title' | 'isPinned' | 'isArchived' | 'model'>>
  ): Promise<Conversation> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update conversation');
    const data = await res.json();
    return data.conversation;
  }

  async deleteConversation(id: string): Promise<void> {
    const res = await fetch(`/api/conversations/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete conversation');
  }

  async deleteMessage(id: string): Promise<void> {
    const res = await fetch(`/api/messages/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete message');
  }

  async editMessage(messageId: string, newContent: string): Promise<{ success: boolean; conversationId: string }> {
    const res = await fetch('/api/chat/edit-message', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ messageId, newContent }),
    });
    if (!res.ok) throw new Error('Failed to edit message');
    return res.json();
  }

  async regenerate(messageId: string): Promise<{ success: boolean; conversationId: string }> {
    const res = await fetch('/api/chat/regenerate', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ messageId }),
    });
    if (!res.ok) throw new Error('Failed to regenerate response');
    return res.json();
  }

  // --- Chat Stream ---
  streamChat(params: {
    conversationId: string;
    content: string;
    attachments?: Attachment[];
    model?: string;
    regenerate?: boolean;
    signal?: AbortSignal;
    onStart?: (userMessage: Message) => void;
    onChunk: (text: string) => void;
    onDone: (data: { message: Message; usage: UsageRecord }) => void;
    onError: (errorData: {
      error: string;
      errorType?: any;
      systemLimited?: boolean;
      reason?: string;
      retryAfterSeconds?: number;
      failedMessage?: Message;
    }) => void;
  }) {
    const { conversationId, content, attachments, model, regenerate, signal, onStart, onChunk, onDone, onError } = params;

    fetch('/api/chat/stream', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        conversationId,
        content,
        attachments,
        model,
        regenerate,
      }),
      signal,
    })
      .then(async (response) => {
        // If HTTP status is not ok (e.g. 403 Pro Required, 429 Rate Limit, 503 Maintenance)
        if (!response.ok) {
          try {
            const errJson = await response.json();
            onError({
              error: errJson.error || 'Request failed',
              errorType: errJson.errorType,
              systemLimited: errJson.systemLimited,
              reason: errJson.reason,
              retryAfterSeconds: errJson.retryAfterSeconds,
            });
          } catch {
            onError({
              error: `HTTP Error ${response.status}`,
              systemLimited: true,
              reason: 'Server returned an error status.',
            });
          }
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Readable stream not supported');
        }

        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'start') {
                  if (onStart && parsed.userMessage) {
                    onStart(parsed.userMessage);
                  }
                } else if (parsed.type === 'chunk') {
                  onChunk(parsed.text);
                } else if (parsed.type === 'done') {
                  onDone({ message: parsed.message, usage: parsed.usage });
                } else if (parsed.type === 'error') {
                  onError({
                    error: parsed.error,
                    errorType: parsed.errorType,
                    systemLimited: parsed.systemLimited,
                    reason: parsed.reason,
                    failedMessage: parsed.failedMessage,
                  });
                }
              } catch (e) {
                console.error('Failed to parse SSE line:', dataStr, e);
              }
            }
          }
        }
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          console.log('Stream aborted by user');
          return;
        }
        console.error('Stream network error:', err);
        onError({
          error: 'Network connection interrupted.',
          errorType: 'PROVIDER_ERROR',
          systemLimited: true,
          reason: 'Unable to reach the server. Please check your network connection and try again.',
        });
      });
  }

  // --- Voice TTS ---
  async getSpeechAudio(text: string, voiceName: string = 'Kore'): Promise<{ audioBase64: string; mimeType: string }> {
    const res = await fetch('/api/voice/tts', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ text, voiceName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Speech synthesis failed' }));
      throw new Error(err.error || 'Speech synthesis failed');
    }
    return res.json();
  }

  // --- Subscription ---
  async upgradeToPro(billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<{
    user: User;
    subscription: Subscription;
    message: string;
  }> {
    const res = await fetch('/api/subscription/upgrade', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ billingCycle }),
    });
    if (!res.ok) throw new Error('Upgrade request failed');
    return res.json();
  }

  async cancelSubscription(): Promise<{ user: User; subscription: Subscription; message: string }> {
    const res = await fetch('/api/subscription/cancel', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Cancel request failed');
    return res.json();
  }

  // --- Usage ---
  async getUsage(): Promise<UsageRecord> {
    const res = await fetch('/api/usage', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch usage');
    return res.json();
  }

  // --- Settings Persistence ---
  async saveSettings(settings: any): Promise<void> {
    await fetch('/api/auth/settings', {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    }).catch(console.error);
  }

  // --- Admin & Operator Management ---
  async getUsers(search?: string, role?: string, plan?: string): Promise<{ users: (User & { subscription?: Subscription; usage?: UsageRecord })[] }> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    if (plan && plan !== 'all') params.append('plan', plan);

    const res = await fetch(`/api/admin/users?${params.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch users' }));
      throw new Error(err.error || 'Failed to fetch users');
    }
    return res.json();
  }

  async setUserRole(targetUserId: string, newRole: string, operatorPermissions?: string[]): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/admin/role', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetUserId, newRole, operatorPermissions }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to set role' }));
      throw new Error(err.error || 'Failed to set role');
    }
    return res.json();
  }

  async addAdminByEmail(email: string, role: string = 'admin', operatorPermissions?: string[]): Promise<{ success: boolean; message: string; user: User }> {
    const res = await fetch('/api/admin/add-by-email', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, role, operatorPermissions }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to assign role' }));
      throw new Error(err.error || 'Failed to assign role');
    }
    return res.json();
  }

  async giftPlan(email: string, plan: 'pro' = 'pro', durationDays: number = 30, reason?: string): Promise<{ success: boolean; message: string; user: User; subscription: Subscription }> {
    const res = await fetch('/api/admin/gift-plan', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ email, plan, durationDays, reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to gift plan' }));
      throw new Error(err.error || 'Failed to gift plan');
    }
    return res.json();
  }

  async getAuditLogs(limit: number = 50): Promise<{ logs: any[] }> {
    const res = await fetch(`/api/admin/audit-logs?limit=${limit}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch audit logs' }));
      throw new Error(err.error || 'Failed to fetch audit logs');
    }
    return res.json();
  }

  // --- Admin Config ---
  async getAdminConfig(): Promise<SystemConfig> {
    const res = await fetch('/api/admin/config', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch admin config');
    const data = await res.json();
    return data.config;
  }

  async updateAdminConfig(config: Partial<SystemConfig>): Promise<SystemConfig> {
    const res = await fetch('/api/admin/config', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update config');
    const data = await res.json();
    return data.config;
  }

  async resetUserQuota(targetUserId: string): Promise<void> {
    const res = await fetch('/api/admin/reset-user-quota', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ targetUserId }),
    });
    if (!res.ok) throw new Error('Failed to reset quota');
  }

  // --- Announcements ---
  async getAnnouncements(): Promise<{ announcements: Announcement[] }> {
    const res = await fetch('/api/announcements', { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch announcements');
    return res.json();
  }

  async markAnnouncementRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/announcements/${id}/read`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to mark announcement as read');
    return res.json();
  }

  async getAdminAnnouncements(): Promise<{ announcements: Announcement[] }> {
    const res = await fetch('/api/admin/announcements', { headers: this.getHeaders() });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch admin announcements' }));
      throw new Error(err.error || 'Failed to fetch admin announcements');
    }
    return res.json();
  }

  async createAnnouncement(data: {
    title: string;
    message: string;
    type: AnnouncementType;
    target: AnnouncementTarget;
    recipientEmail?: string;
    expiresAt?: string | null;
  }): Promise<{ success: boolean; announcement: Announcement; message: string }> {
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({ error: 'Failed to create announcement' }));
    if (!res.ok) {
      throw new Error(json.error || 'Failed to create announcement');
    }
    return json;
  }

  async toggleAnnouncement(id: string): Promise<{ success: boolean; announcement: Announcement }> {
    const res = await fetch(`/api/admin/announcements/${id}/toggle`, {
      method: 'PATCH',
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => ({ error: 'Failed to toggle announcement' }));
    if (!res.ok) {
      throw new Error(json.error || 'Failed to toggle announcement');
    }
    return json;
  }

  async deleteAnnouncement(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    const json = await res.json().catch(() => ({ error: 'Failed to delete announcement' }));
    if (!res.ok) {
      throw new Error(json.error || 'Failed to delete announcement');
    }
    return json;
  }

  // --- System Health & Availability ---
  async checkHealth(): Promise<{ ok: boolean; available: boolean; status: string }> {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) return { ok: false, available: false, status: 'unavailable' };
      const data = await res.json();
      return { ok: true, available: Boolean(data.available), status: data.status || 'ok' };
    } catch (e) {
      return { ok: false, available: false, status: 'unreachable' };
    }
  }
}

export const api = new ApiService();
