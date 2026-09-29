import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db, User } from './src/server/db.js';
import { getGeminiClient, buildGeminiContents, CRAFT_SYSTEM_INSTRUCTION, generateSpeechAudio } from './src/server/gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Body parser with 30MB limit for image attachments
app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Auth & Session helper
interface AuthenticatedRequest extends Request {
  user?: User;
}

function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let userId = (req.headers['x-user-id'] as string) || '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    userId = authHeader.substring(7).trim();
  }

  // Default to Norhan Rekani (Pro user) if no header provided for seamless experience
  if (!userId) {
    userId = 'user_norhan';
  }

  let user = db.getUserById(userId);
  if (!user) {
    // If not found by ID, try checking if userId matches an email
    user = db.getUserByEmail(userId);
  }
  if (!user) {
    // Fallback to default user
    user = db.getUserById('user_norhan') || db.createUser('Norhan Rekani', 'norhanrekani03@gmail.com');
  }

  req.user = user;
  next();
}

app.use('/api', authMiddleware);

// --- Health & Availability Check ---
app.get('/api/health', (req: Request, res: Response) => {
  const config = db.getConfig();
  if (config.maintenanceMode) {
    return res.status(503).json({
      ok: false,
      available: false,
      status: 'maintenance',
      message: 'Craft AI is in maintenance mode.',
    });
  }
  if (config.simulatedProviderLimit) {
    return res.status(429).json({
      ok: false,
      available: false,
      status: 'rate_limited',
      message: 'Provider rate limited.',
    });
  }
  res.json({
    ok: true,
    available: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export function extractRetryDelaySeconds(error: any): number | undefined {
  if (!error) return undefined;

  // 1. Direct numeric retry property
  if (typeof error?.retryAfterSeconds === 'number' && error.retryAfterSeconds > 0) {
    return Math.ceil(error.retryAfterSeconds);
  }
  if (typeof error?.retryDelay === 'number' && error.retryDelay > 0) {
    return Math.ceil(error.retryDelay);
  }
  if (typeof error?.retryDelay === 'string') {
    const sMatch = error.retryDelay.match(/([0-9.]+)\s*s/i);
    if (sMatch) return Math.ceil(parseFloat(sMatch[1]));
  }

  // 2. Google RPC Error Details (RetryInfo)
  const details = error?.errorDetails || error?.details;
  if (Array.isArray(details)) {
    for (const detail of details) {
      if (detail?.['@type']?.includes('RetryInfo') || detail?.retryDelay) {
        if (typeof detail?.retryDelay === 'string') {
          const m = detail.retryDelay.match(/([0-9.]+)\s*s/i);
          if (m) return Math.ceil(parseFloat(m[1]));
        } else if (typeof detail?.retryDelay?.seconds === 'number') {
          return detail.retryDelay.seconds;
        }
      }
    }
  }

  const msg = String(error?.message || error?.toString() || '');

  // 3. Match compound hours and minutes (e.g. "4 hours 32 minutes", "4 hrs 32 mins", "4h 32m", "4:32:00")
  const compoundMatch = msg.match(/(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)/i);
  if (compoundMatch) {
    const hours = parseInt(compoundMatch[1], 10);
    const mins = parseInt(compoundMatch[2], 10);
    return hours * 3600 + mins * 60;
  }

  // 3b. Match digital time format e.g. "04:32:00" or "4:32:00"
  const digitalMatch = msg.match(/(\d{1,2}):(\d{2}):(\d{2})/);
  if (digitalMatch) {
    const hours = parseInt(digitalMatch[1], 10);
    const mins = parseInt(digitalMatch[2], 10);
    const secs = parseInt(digitalMatch[3], 10);
    return hours * 3600 + mins * 60 + secs;
  }

  // 4. Match hours only (e.g. "retry in 4 hours")
  const hoursMatch = msg.match(/retry\s*(?:in|after)?\s*(\d+)\s*(?:hours?|hrs?|h)/i);
  if (hoursMatch) {
    return parseInt(hoursMatch[1], 10) * 3600;
  }

  // 5. Match minutes only (e.g. "retry in 32 minutes")
  const minsMatch = msg.match(/retry\s*(?:in|after)?\s*(\d+)\s*(?:minutes?|mins?|m)/i);
  if (minsMatch) {
    return parseInt(minsMatch[1], 10) * 60;
  }

  // 6. Match seconds (e.g. "retry in 45s", "retryDelay: 30s", "retry in 2.5s")
  const secMatch =
    msg.match(/retry\s*(?:in|after)?\s*([0-9.]+)\s*s(?:econds?)?/i) ||
    msg.match(/retryDelay["']?\s*:\s*["']?([0-9.]+)\s*s?/i);
  if (secMatch) {
    return Math.ceil(parseFloat(secMatch[1]));
  }

  return undefined;
}

// ==========================================
// 1. AUTH & USER ENDPOINTS
// ==========================================

app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const sub = db.getSubscription(user.id);
  const usage = db.getUsage(user.id);
  const config = db.getConfig();
  const limits = user.plan === 'pro' ? config.proLimits : config.freeLimits;

  res.json({
    user,
    subscription: sub,
    usage: {
      ...usage,
      limits,
      remainingMessages: Math.max(0, limits.messagesPerDay - usage.messagesToday),
    },
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, name } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  let user = db.getUserByEmail(email);
  if (!user) {
    user = db.createUser(name || email.split('@')[0], email);
  }

  const sub = db.getSubscription(user.id);
  const usage = db.getUsage(user.id);

  res.json({
    user,
    subscription: sub,
    usage,
    token: user.id,
  });
});

app.post('/api/auth/switch-account', (req: Request, res: Response) => {
  const { userId } = req.body;
  const user = db.getUserById(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  const sub = db.getSubscription(user.id);
  const usage = db.getUsage(user.id);
  res.json({ user, subscription: sub, usage, token: user.id });
});

app.patch('/api/auth/profile', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, avatar } = req.body;
  const updated = db.updateUserProfile(user.id, { name, avatar });
  res.json({ user: updated });
});

// ==========================================
// 2. CONVERSATIONS & MESSAGES ENDPOINTS
// ==========================================

app.get('/api/conversations', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const search = req.query.search as string | undefined;
  const isArchived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : undefined;

  const convs = db.getConversations(user.id, search, isArchived);
  res.json({ conversations: convs });
});

app.post('/api/conversations', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, model } = req.body;
  const defaultModel = user.plan === 'pro' ? 'gemini-3.8-flash' : 'gemini-3.8-flash';
  const conv = db.createConversation(user.id, title || 'New Conversation', model || defaultModel);
  res.json({ conversation: conv });
});

app.get('/api/conversations/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const conv = db.getConversation(req.params.id, user.id);
  if (!conv) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  const messages = db.getMessages(conv.id);
  res.json({ conversation: conv, messages });
});

app.patch('/api/conversations/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, isPinned, isArchived, model } = req.body;
  const updated = db.updateConversation(req.params.id, user.id, {
    title,
    isPinned,
    isArchived,
    model,
  });
  if (!updated) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ conversation: updated });
});

app.delete('/api/conversations/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const success = db.deleteConversation(req.params.id, user.id);
  if (!success) {
    return res.status(404).json({ error: 'Conversation not found' });
  }
  res.json({ success: true, id: req.params.id });
});

app.delete('/api/messages/:id', (req: AuthenticatedRequest, res: Response) => {
  const success = db.deleteMessage(req.params.id);
  res.json({ success });
});

// ==========================================
// 3. CHAT STREAMING (SSE) & SYSTEM LIMITED LOGIC
// ==========================================

app.post('/api/chat/stream', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { conversationId, content, attachments = [], model: requestedModel, regenerate = false } = req.body;

  // 1. Verify or create conversation ownership gracefully
  let conv = conversationId ? db.getConversation(conversationId, user.id) : undefined;
  if (!conv) {
    conv = db.createConversation(user.id, 'New Conversation', requestedModel || 'gemini-3.8-flash');
  }

  const modelToUse = requestedModel || conv.model || 'gemini-3.8-flash';
  const config = db.getConfig();
  const usage = db.getUsage(user.id);
  const limits = user.plan === 'pro' ? config.proLimits : config.freeLimits;

  // --- SYSTEM LIMITED CHECKS ---

  // Check Maintenance
  if (config.maintenanceMode) {
    return res.status(503).json({
      error: 'Craft AI is temporarily undergoing scheduled maintenance.',
      errorType: 'PROVIDER_ERROR',
      systemLimited: true,
      reason: 'Scheduled maintenance. Our team is upgrading neural cluster infrastructure.',
      retryAfterSeconds: 60,
    });
  }

  // Check Simulated Provider Outage / 429
  if (config.simulatedProviderLimit) {
    return res.status(429).json({
      error: 'Upstream provider rate limit reached (simulated).',
      errorType: 'RATE_LIMIT_EXCEEDED',
      systemLimited: true,
      reason: 'API rate limit exceeded on upstream engine. Please wait before retrying.',
      retryAfterSeconds: 30,
    });
  }

  // Check Plan Permissions for Pro Models
  const isProModel = modelToUse === 'gemini-3.1-pro-preview' || modelToUse === 'gemini-3.1-flash-lite-image';
  if (isProModel && user.plan !== 'pro') {
    return res.status(403).json({
      error: 'This model is available with Craft AI Pro.',
      errorType: 'PRO_REQUIRED',
      systemLimited: true,
      reason: `The advanced reasoning model ${modelToUse} requires an active Craft AI Pro subscription.`,
      model: modelToUse,
    });
  }

  // Check Attachment Size Limits
  if (attachments && attachments.length > 0) {
    let totalBytes = 0;
    for (const att of attachments) {
      totalBytes += att.size || 0;
    }
    const totalMB = totalBytes / (1024 * 1024);
    if (totalMB > limits.maxUploadMB) {
      return res.status(413).json({
        error: `Attachment size (${totalMB.toFixed(1)}MB) exceeds your plan limit of ${limits.maxUploadMB}MB.`,
        errorType: user.plan === 'free' ? 'FREE_LIMIT_REACHED' : 'PRO_LIMIT_REACHED',
        systemLimited: true,
        reason: user.plan === 'free'
          ? `Free plan supports up to 5MB uploads. Upgrade to Craft AI Pro for 25MB uploads.`
          : `Upload limit is ${limits.maxUploadMB}MB.`,
      });
    }
  }

  // Check Message Quotas
  if (usage.messagesToday >= limits.messagesPerDay) {
    const isFree = user.plan === 'free';
    return res.status(429).json({
      error: isFree
        ? 'Daily message limit reached for Craft AI Free (25/25).'
        : 'Daily message limit reached for Craft AI Pro (500/500).',
      errorType: isFree ? 'FREE_LIMIT_REACHED' : 'PRO_LIMIT_REACHED',
      systemLimited: true,
      reason: isFree
        ? 'You have reached your 25 messages per day on Craft AI Free. Upgrade to Craft AI Pro for 500 messages/day and advanced model access.'
        : 'You have reached your 500 messages per day allocation. Your quota will reset tonight at 00:00 UTC.',
      quota: limits.messagesPerDay,
      used: usage.messagesToday,
    });
  }

  const requestStartTime = Date.now();
  let firstTokenTime: number | null = null;

  // Save User Message immediately (reuse existing if regenerating)
  let userMsg = regenerate
    ? [...db.getMessages(conv.id)].reverse().find((m) => m.role === 'user')
    : undefined;

  if (!userMsg) {
    userMsg = db.addMessage({
      conversationId: conv.id,
      role: 'user',
      content: content || '',
      attachments,
      status: 'complete',
    });
  }

  // Setup Server-Sent Events (SSE) with unbuffered immediate streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disables proxy buffering for instant delivery
  res.flushHeaders?.();

  // Send initial acknowledge event immediately
  res.write(`data: ${JSON.stringify({ type: 'start', userMessage: userMsg })}\n\n`);
  (res as any).flush?.();

  let fullResponse = '';
  let isAborted = false;

  res.on('close', () => {
    if (!res.writableEnded) {
      isAborted = true;
    }
  });

  try {
    const ai = getGeminiClient();
    // Efficient conversation context management: compact sliding window to maintain low TTFT and token efficiency
    const history = db.getMessages(conv.id);
    const geminiContents = buildGeminiContents(history, 24);

    let effectiveModel = modelToUse;

    const runStreamWithModel = async (modelName: string) => {
      const cfg: any = {
        systemInstruction: CRAFT_SYSTEM_INSTRUCTION,
      };
      if (modelName.includes('flash')) {
        cfg.thinkingConfig = {
          thinkingLevel: 'LOW',
        };
      }
      return ai.models.generateContentStream({
        model: modelName,
        contents: geminiContents,
        config: cfg,
      });
    };

    try {
      const stream = await runStreamWithModel(effectiveModel);
      for await (const chunk of stream) {
        if (isAborted) break;
        const text = chunk.text || '';
        if (text) {
          if (firstTokenTime === null) {
            firstTokenTime = Date.now() - requestStartTime;
          }
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
          (res as any).flush?.();
        }
      }
    } catch (streamErr: any) {
      const isQuotaOrLimit =
        streamErr?.status === 429 ||
        streamErr?.message?.includes('429') ||
        streamErr?.message?.includes('RESOURCE_EXHAUSTED') ||
        streamErr?.message?.includes('Quota exceeded') ||
        streamErr?.message?.includes('limit: 0');

      // If stream threw quota/rate error before outputting tokens and wasn't flash, fall back seamlessly to gemini-3.8-flash
      if (isQuotaOrLimit && fullResponse === '' && effectiveModel !== 'gemini-3.8-flash') {
        console.warn(`[Craft AI] ${effectiveModel} stream failed with quota 429. Falling back to gemini-3.8-flash.`);
        effectiveModel = 'gemini-3.8-flash';
        const fallbackStream = await runStreamWithModel(effectiveModel);
        for await (const chunk of fallbackStream) {
          if (isAborted) break;
          const text = chunk.text || '';
          if (text) {
            if (firstTokenTime === null) {
              firstTokenTime = Date.now() - requestStartTime;
            }
            fullResponse += text;
            res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
            (res as any).flush?.();
          }
        }
      } else {
        throw streamErr;
      }
    }

    if (!isAborted) {
      const totalDurationMs = Date.now() - requestStartTime;
      const ttftMs = firstTokenTime ?? totalDurationMs;

      // Save assistant message to DB with measured real performance metrics
      const assistantMsg = db.addMessage({
        conversationId: conv.id,
        role: 'assistant',
        content: fullResponse || 'I am ready to assist you further.',
        model: effectiveModel,
        status: 'complete',
        metrics: {
          ttftMs,
          totalDurationMs,
        },
      });

      // Increment user usage
      const updatedUsage = db.incrementUsage(user.id, Math.ceil(fullResponse.length / 4));

      res.write(
        `data: ${JSON.stringify({
          type: 'done',
          message: assistantMsg,
          usage: updatedUsage,
          metrics: {
            ttftMs,
            totalDurationMs,
          },
        })}\n\n`
      );
    }
  } catch (error: any) {
    console.error('Error during Gemini streaming:', error);

    const isRateLimit =
      error?.status === 429 ||
      error?.message?.includes('429') ||
      error?.message?.includes('RESOURCE_EXHAUSTED') ||
      error?.message?.includes('Quota exceeded');
    const isModelUnavailable =
      error?.message?.includes('not found') ||
      error?.message?.includes('not supported') ||
      error?.status === 503 ||
      error?.message?.includes('503') ||
      error?.message?.includes('high demand') ||
      error?.message?.includes('UNAVAILABLE');

    let errorType: any = 'PROVIDER_ERROR';
    let errorMessage = 'An error occurred while generating the response from Craft AI.';
    let systemReason = error?.message || 'Upstream provider connection error.';
    let retryAfterSeconds: number | undefined = extractRetryDelaySeconds(error);

    if (isRateLimit) {
      errorType = 'RATE_LIMIT_EXCEEDED';
      errorMessage = retryAfterSeconds
        ? `System Limited: Gemini API rate limit or quota exceeded. Please retry in ${retryAfterSeconds}s.`
        : 'System Limited: Gemini API rate limit or quota exceeded. Please try again later.';
      systemReason = retryAfterSeconds
        ? `Upstream rate limit reached. The AI engine is experiencing high demand. Retry available in ${retryAfterSeconds}s.`
        : 'The AI engine is temporarily experiencing high demand. Please try again later.';
    } else if (isModelUnavailable) {
      errorType = 'MODEL_UNAVAILABLE';
      errorMessage = `Model capacity unavailable: ${modelToUse} is experiencing high demand.`;
      systemReason = 'This model is temporarily experiencing high demand. Please try again later.';
    }

    // Save failed assistant message in database with error state so conversation is preserved!
    const failedMsg = db.addMessage({
      conversationId: conv.id,
      role: 'assistant',
      content: fullResponse || '',
      model: modelToUse,
      status: 'error',
      errorMessage,
      errorType,
    });

    res.write(
      `data: ${JSON.stringify({
        type: 'error',
        error: errorMessage,
        errorType,
        systemLimited: true,
        reason: systemReason,
        retryAfterSeconds,
        failedMessage: failedMsg,
      })}\n\n`
    );
  } finally {
    res.end();
  }
});

// Edit user message & regenerate subsequent assistant response
app.post('/api/chat/edit-message', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { messageId, newContent } = req.body;
  const msg = db.getMessage(messageId);
  if (!msg) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Update content
  db.updateMessage(messageId, { content: newContent });

  // Remove messages after this message
  db.removeMessagesAfter(msg.conversationId, msg.createdAt);

  res.json({ success: true, conversationId: msg.conversationId });
});

// Regenerate assistant response (deletes last assistant turn and returns signal)
app.post('/api/chat/regenerate', (req: AuthenticatedRequest, res: Response) => {
  const { messageId } = req.body;
  const msg = db.getMessage(messageId);
  if (!msg || msg.role !== 'assistant') {
    return res.status(400).json({ error: 'Valid assistant message ID is required' });
  }

  db.deleteMessage(messageId);
  res.json({ success: true, conversationId: msg.conversationId });
});

// ==========================================
// 4. VOICE TTS & STT ENDPOINTS
// ==========================================

app.post('/api/voice/tts', async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { text, voiceName = 'Kore' } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for TTS' });
  }

  try {
    const audioBase64 = await generateSpeechAudio(text, voiceName);
    if (!audioBase64) {
      return res.status(500).json({ error: 'Failed to generate speech audio from neural model' });
    }

    db.incrementUsage(user.id, 0, 0, true);

    res.json({
      audioBase64,
      mimeType: 'audio/wav',
      voiceName,
    });
  } catch (error: any) {
    console.error('TTS route error:', error);
    res.status(500).json({ error: error.message || 'TTS generation failed' });
  }
});

// ==========================================
// 5. SUBSCRIPTION & PRO MANAGEMENT
// ==========================================

app.get('/api/subscription', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const sub = db.getSubscription(user.id);
  res.json({ subscription: sub, plan: user.plan });
});

app.post('/api/subscription/upgrade', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { billingCycle = 'monthly' } = req.body;

  // Upgrade user to Pro in database
  const updatedSub = db.updateSubscription(user.id, 'pro', 'active', billingCycle);
  const updatedUser = db.getUserById(user.id);

  res.json({
    success: true,
    message: 'Welcome to Craft AI Pro! Your account has been upgraded.',
    subscription: updatedSub,
    user: updatedUser,
  });
});

app.post('/api/subscription/cancel', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const updatedSub = db.updateSubscription(user.id, 'free', 'canceled');
  const updatedUser = db.getUserById(user.id);

  res.json({
    success: true,
    message: 'Subscription canceled. Account reverted to Craft AI Free.',
    subscription: updatedSub,
    user: updatedUser,
  });
});

// ==========================================
// 6. USAGE & ADMIN MANAGEMENT (RBAC)
// ==========================================

app.get('/api/usage', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const usage = db.getUsage(user.id);
  const config = db.getConfig();
  const limits = user.plan === 'pro' ? config.proLimits : config.freeLimits;

  res.json({
    usage,
    limits,
    plan: user.plan,
    remainingMessages: Math.max(0, limits.messagesPerDay - usage.messagesToday),
    resetsAt: '00:00 UTC Daily',
  });
});

app.patch('/api/auth/settings', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const updated = db.updateUserSettings(user.id, req.body);
  res.json({ success: true, settings: updated?.settings });
});

// Admin / Operator: User Search & Listing
app.get('/api/admin/users', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed = user.role === 'admin' || user.role === 'operator';
  if (!isAllowed) {
    return res.status(403).json({ error: 'Access denied: Administrator or Operator role required.' });
  }

  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;
  const plan = req.query.plan as string | undefined;

  const users = db.getAllUsers(search, role, plan);
  res.json({ users });
});

// Admin Only: Assign or Remove Role (Add Admin, Remove Admin, Assign Operator)
app.post('/api/admin/role', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Only Administrators can modify user roles.' });
  }

  const { targetUserId, newRole, operatorPermissions } = req.body;
  if (!targetUserId || !newRole) {
    return res.status(400).json({ error: 'targetUserId and newRole are required.' });
  }

  const result = db.setUserRole(targetUserId, newRole, operatorPermissions, user);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, user: result.user });
});

// Admin Only: Add Admin or Operator by Email
app.post('/api/admin/add-by-email', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Only Administrators can add administrators.' });
  }

  const { email, role = 'admin', operatorPermissions } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  const target = db.getUserByEmail(email.trim());
  if (!target) {
    return res.status(404).json({ error: `No account found for email: "${email.trim()}". The user must create an account first.` });
  }

  const result = db.setUserRole(target.id, role, operatorPermissions, user);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({ success: true, message: `Successfully assigned ${role.toUpperCase()} role to ${target.name} (${target.email}).`, user: result.user });
});

// Admin / Operator: Gift Plan (Pro)
app.post('/api/admin/gift-plan', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed = user.role === 'admin' || (user.role === 'operator' && user.operatorPermissions?.includes('plans.gift'));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Access denied: You do not have permission to gift plans.' });
  }

  const { email, plan = 'pro', durationDays = 30, reason } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Recipient email is required.' });
  }

  const result = db.giftPlan(email.trim(), plan, Number(durationDays), reason, user);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json({
    success: true,
    message: `Successfully gifted Craft AI Pro to ${result.user?.name} (${email.trim()}) for ${durationDays === -1 ? 'Permanent access' : `${durationDays} days`}.`,
    user: result.user,
    subscription: result.subscription,
  });
});

// Admin / Operator: Audit Logs
app.get('/api/admin/audit-logs', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed = user.role === 'admin' || (user.role === 'operator' && user.operatorPermissions?.includes('system.view'));
  if (!isAllowed) {
    return res.status(403).json({ error: 'Access denied: Administrator access required to view audit logs.' });
  }

  const limit = req.query.limit ? Number(req.query.limit) : 50;
  const logs = db.getAuditLogs(limit);
  res.json({ logs });
});

app.get('/api/admin/config', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin' && !(user.role === 'operator' && user.operatorPermissions?.includes('system.view'))) {
    return res.status(403).json({ error: 'Admin or Operator access required' });
  }
  const config = db.getConfig();
  res.json({ config });
});

app.post('/api/admin/config', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const updated = db.updateConfig(req.body);
  db.addAuditLog({
    adminId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    action: 'UPDATE_CONFIG',
    details: 'Updated global system limits / maintenance settings.',
    metadata: req.body,
  });
  res.json({ config: updated });
});

app.post('/api/admin/reset-user-quota', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  const { targetUserId } = req.body;
  const usage = db.resetUserUsage(targetUserId || user.id);
  db.addAuditLog({
    adminId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    action: 'RESET_QUOTA',
    targetUserId: targetUserId || user.id,
    details: `Reset daily quota allocation for user: ${targetUserId || user.id}`,
  });
  res.json({ success: true, usage });
});

// ==========================================
// 6. ANNOUNCEMENT SYSTEM ENDPOINTS
// ==========================================

// Authenticated user: Get visible active announcements
app.get('/api/announcements', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const announcements = db.getAnnouncementsForUser(user.id);
  res.json({ announcements });
});

// Authenticated user: Mark announcement as read
app.post('/api/announcements/:id/read', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const success = db.markAnnouncementAsRead(req.params.id, user.id);
  res.json({ success });
});

// Admin / Operator: List all announcements
app.get('/api/admin/announcements', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed =
    user.role === 'admin' ||
    (user.role === 'operator' &&
      (user.operatorPermissions?.includes('announcements.manage') ||
        user.operatorPermissions?.includes('system.view')));
  if (!isAllowed) {
    return res
      .status(403)
      .json({ error: 'Access denied: Administrator or authorized Operator role required.' });
  }

  const announcements = db.getAllAnnouncements();
  res.json({ announcements });
});

// Admin / Operator: Create announcement
app.post('/api/admin/announcements', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed =
    user.role === 'admin' ||
    (user.role === 'operator' && user.operatorPermissions?.includes('announcements.manage'));
  if (!isAllowed) {
    return res
      .status(403)
      .json({ error: 'Access denied: Administrator or authorized Operator role required.' });
  }

  const { title, message, type = 'info', target = 'global', recipientEmail, expiresAt } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: 'Announcement title is required.' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Announcement message is required.' });
  }

  let targetUserId: string | undefined;
  let targetEmail: string | undefined;
  let emailStatus = 'In-app notification active.';

  if (target === 'user') {
    if (!recipientEmail || !recipientEmail.trim()) {
      return res
        .status(400)
        .json({ error: 'Recipient email is required for single-user announcements.' });
    }
    const cleanEmail = recipientEmail.trim().toLowerCase();
    const targetUser = db.getUserByEmail(cleanEmail);
    if (!targetUser) {
      return res.status(404).json({ error: 'No Craft AI account was found for this email.' });
    }
    targetUserId = targetUser.id;
    targetEmail = targetUser.email;
    emailStatus = 'Delivered to user in-app inbox. (SMTP/Email provider not configured in environment)';
  }

  const ann = db.addAnnouncement({
    title: title.trim(),
    message: message.trim(),
    type,
    target,
    targetUserId,
    targetEmail,
    authorId: user.id,
    authorName: user.name,
    authorRole: user.role,
    isActive: true,
    expiresAt: expiresAt || null,
    emailDelivered: false,
    emailStatus,
  });

  db.addAuditLog({
    adminId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    action: target === 'global' ? 'GLOBAL_ANNOUNCEMENT_SENT' : 'USER_ANNOUNCEMENT_SENT',
    targetUserId,
    targetEmail,
    details:
      target === 'global'
        ? `Broadcasted global announcement: "${ann.title}"`
        : `Sent announcement "${ann.title}" to user ${targetEmail}`,
  });

  res.json({
    success: true,
    announcement: ann,
    message:
      target === 'global'
        ? 'Global announcement sent successfully to all users.'
        : `Announcement sent successfully to ${targetEmail}`,
  });
});

// Admin / Operator: Toggle active / disabled status
app.patch('/api/admin/announcements/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed =
    user.role === 'admin' ||
    (user.role === 'operator' && user.operatorPermissions?.includes('announcements.manage'));
  if (!isAllowed) {
    return res
      .status(403)
      .json({ error: 'Access denied: Administrator or authorized Operator role required.' });
  }

  const ann = db.toggleAnnouncementActive(req.params.id);
  if (!ann) {
    return res.status(404).json({ error: 'Announcement not found.' });
  }

  db.addAuditLog({
    adminId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    action: ann.isActive ? 'ANNOUNCEMENT_ENABLED' : 'ANNOUNCEMENT_DISABLED',
    targetUserId: ann.targetUserId,
    targetEmail: ann.targetEmail,
    details: `${ann.isActive ? 'Enabled' : 'Disabled'} announcement "${ann.title}"`,
  });

  res.json({ success: true, announcement: ann });
});

// Admin / Operator: Delete announcement
app.delete('/api/admin/announcements/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const isAllowed =
    user.role === 'admin' ||
    (user.role === 'operator' && user.operatorPermissions?.includes('announcements.manage'));
  if (!isAllowed) {
    return res
      .status(403)
      .json({ error: 'Access denied: Administrator or authorized Operator role required.' });
  }

  const ann = db.getAnnouncementById(req.params.id);
  if (!ann) {
    return res.status(404).json({ error: 'Announcement not found.' });
  }

  db.deleteAnnouncement(req.params.id);

  db.addAuditLog({
    adminId: user.id,
    adminName: user.name,
    adminEmail: user.email,
    action: 'ANNOUNCEMENT_DELETED',
    targetUserId: ann.targetUserId,
    targetEmail: ann.targetEmail,
    details: `Deleted announcement "${ann.title}"`,
  });

  res.json({ success: true });
});

// ==========================================
// 7. VITE DEV SERVER OR PRODUCTION SERVE
// ==========================================

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Craft AI Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
