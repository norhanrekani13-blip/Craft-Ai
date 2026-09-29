import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Palette,
  Image as ImageIcon,
  Languages,
  Mic,
  BarChart3,
  Sparkles,
  Shield,
  Check,
  RotateCcw,
  Volume2,
  Trash2,
  AlertTriangle,
  Upload,
  Search,
  Gift,
  History,
  UserCheck,
  UserPlus,
  UserMinus,
  Settings as SettingsIcon,
  Clock,
  Mail,
  SlidersHorizontal,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { LanguageCode, ThemeMode, AccentColor, CraftLogoId, SystemConfig, UserRole, OperatorPermission, AuditLog } from '../types/index.js';
import { BrandLogo } from './BrandLogo.js';
import { CRAFT_LOGOS } from './brand/logos.js';
import { ProBadge } from './ProBadge.js';
import { api } from '../services/api.js';

export const SettingsModal: React.FC = () => {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    settingsTab,
    setSettingsTab,
    settings,
    setSettings,
    user,
    subscription,
    usage,
    switchAccount,
    upgradeToPro,
    cancelSubscription,
    refreshSession,
    setIsProModalOpen,
    t,
  } = useApp();

  const [activeTab, setActiveTab] = useState(settingsTab || 'account');
  const [adminSection, setAdminSection] = useState<'users' | 'admins' | 'operators' | 'gift' | 'logs' | 'system'>('users');

  // Admin data states
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPlanFilter, setUserPlanFilter] = useState('all');
  const [adminConfig, setAdminConfig] = useState<SystemConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminSaveMessage, setAdminSaveMessage] = useState<string | null>(null);
  const [adminErrorMessage, setAdminErrorMessage] = useState<string | null>(null);
  const [testVoiceLoading, setTestVoiceLoading] = useState(false);

  // Forms
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newOperatorEmail, setNewOperatorEmail] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<OperatorPermission[]>([
    'users.view',
    'plans.view',
    'plans.gift',
  ]);

  // Gift Plan Form
  const [giftEmail, setGiftEmail] = useState('');
  const [giftDuration, setGiftDuration] = useState('30');
  const [giftReason, setGiftReason] = useState('');
  const [isSubmittingGift, setIsSubmittingGift] = useState(false);

  // Remove Admin Modal Confirmation
  const [demoteConfirm, setDemoteConfirm] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    userEmail: string;
    role: UserRole;
  } | null>(null);

  const isStaff = user?.role === 'admin' || user?.role === 'operator';
  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';

  useEffect(() => {
    if (settingsTab) setActiveTab(settingsTab);
  }, [settingsTab]);

  // Fetch admin data when entering admin panel
  useEffect(() => {
    if (activeTab === 'admin' && isStaff) {
      loadAdminUsers();
      if (isAdmin || user?.operatorPermissions?.includes('system.view')) {
        api.getAdminConfig().then(setAdminConfig).catch(console.error);
        api.getAuditLogs(100).then((res) => setAuditLogs(res.logs)).catch(console.error);
      }
    }
  }, [activeTab, isStaff, userSearchQuery, userRoleFilter, userPlanFilter]);

  const loadAdminUsers = async () => {
    try {
      const res = await api.getUsers(userSearchQuery, userRoleFilter, userPlanFilter);
      setAdminUsers(res.users);
    } catch (e: any) {
      console.error('Failed to load users:', e);
    }
  };

  if (!isSettingsOpen) return null;

  const showNotification = (msg: string, isError: boolean = false) => {
    if (isError) {
      setAdminErrorMessage(msg);
      setTimeout(() => setAdminErrorMessage(null), 4000);
    } else {
      setAdminSaveMessage(msg);
      setTimeout(() => setAdminSaveMessage(null), 4000);
    }
  };

  const handleTestVoice = async () => {
    try {
      setTestVoiceLoading(true);
      const voiceName = settings.voice.voiceName || 'Kore';
      const sample = `Hello! This is Craft AI speaking with the ${voiceName} neural voice.`;
      const data = await api.getSpeechAudio(sample, voiceName);
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.playbackRate = settings.voice.speechSpeed || 1.0;
        audio.volume = settings.voice.volume || 1.0;
        await audio.play();
      }
    } catch (e) {
      console.warn('Voice preview failed:', e);
    } finally {
      setTestVoiceLoading(false);
    }
  };

  // 1. Add Admin by Email
  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim()) return;
    try {
      const res = await api.addAdminByEmail(newAdminEmail.trim(), 'admin');
      showNotification(res.message);
      setNewAdminEmail('');
      loadAdminUsers();
      api.getAuditLogs().then((r) => setAuditLogs(r.logs)).catch(console.error);
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // 2. Add Operator with Permissions
  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOperatorEmail.trim()) return;
    try {
      const res = await api.addAdminByEmail(newOperatorEmail.trim(), 'operator', selectedPermissions);
      showNotification(res.message);
      setNewOperatorEmail('');
      loadAdminUsers();
      api.getAuditLogs().then((r) => setAuditLogs(r.logs)).catch(console.error);
    } catch (err: any) {
      showNotification(err.message, true);
    }
  };

  // 3. Demote Admin or Operator
  const handleDemoteConfirm = async () => {
    if (!demoteConfirm) return;
    try {
      await api.setUserRole(demoteConfirm.userId, 'user');
      showNotification(`Removed ${demoteConfirm.role.toUpperCase()} privileges for ${demoteConfirm.userEmail}. Account data preserved.`);
      setDemoteConfirm(null);
      loadAdminUsers();
      api.getAuditLogs().then((r) => setAuditLogs(r.logs)).catch(console.error);
    } catch (err: any) {
      showNotification(err.message, true);
      setDemoteConfirm(null);
    }
  };

  // 4. Gift Plan
  const handleGiftPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftEmail.trim()) return;
    setIsSubmittingGift(true);
    try {
      const res = await api.giftPlan(giftEmail.trim(), 'pro', Number(giftDuration), giftReason.trim() || undefined);
      showNotification(res.message);
      setGiftEmail('');
      setGiftReason('');
      loadAdminUsers();
      api.getAuditLogs().then((r) => setAuditLogs(r.logs)).catch(console.error);
    } catch (err: any) {
      showNotification(err.message, true);
    } finally {
      setIsSubmittingGift(false);
    }
  };

  const handleSaveAdminConfig = async () => {
    if (!adminConfig) return;
    try {
      const updated = await api.updateAdminConfig(adminConfig);
      setAdminConfig(updated);
      showNotification('System configuration saved successfully!');
      refreshSession();
    } catch (e: any) {
      showNotification(e.message || 'Failed to save config', true);
    }
  };

  const handleResetMyQuota = async () => {
    if (!user) return;
    try {
      await api.resetUserQuota(user.id);
      refreshSession();
      showNotification('Daily message quota has been refreshed!');
    } catch (e: any) {
      showNotification(e.message || 'Failed to reset quota', true);
    }
  };

  const tabs = [
    { id: 'account', label: 'Account', icon: <UserIcon className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'background', label: 'Background', icon: <ImageIcon className="w-4 h-4" /> },
    { id: 'language', label: 'Language', icon: <Languages className="w-4 h-4" /> },
    { id: 'voice', label: 'Voice', icon: <Mic className="w-4 h-4" /> },
    { id: 'usage', label: 'Usage', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'pro', label: 'Craft AI Pro', icon: <Sparkles className="w-4 h-4 text-amber-400" /> },
    ...(isStaff
      ? [{
          id: 'admin',
          label: isAdmin ? 'Admin Panel' : 'Operator Panel',
          icon: <Shield className={`w-4 h-4 ${isAdmin ? 'text-rose-400' : 'text-sky-400'}`} />,
        }]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl animate-fadeIn"
        onClick={() => setIsSettingsOpen(false)}
      />

      {/* Confirmation Modal for Removing Admin/Operator */}
      {demoteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setDemoteConfirm(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700 shadow-2xl p-6 z-10 text-center animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              Remove {demoteConfirm.role.toUpperCase()} Access?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
              Are you sure you want to remove {demoteConfirm.role} privileges from{' '}
              <strong className="text-white">{demoteConfirm.userEmail}</strong>?
            </p>
            <div className="p-3 rounded-xl bg-slate-950 text-left text-xs text-slate-400 mb-5 space-y-1">
              <p>• The user account remains fully active.</p>
              <p>• Conversations, messages, and settings are preserved.</p>
              <p>• Their subscription status (Free / Pro) is unchanged.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setDemoteConfirm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDemoteConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
              >
                Remove Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <div className="relative w-full max-w-4xl h-[90vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl flex flex-col z-10 animate-scaleIn overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <BrandLogo variant="small" />
            <h2 className="font-extrabold text-base sm:text-lg text-white tracking-tight">
              Settings
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Notifications */}
        {adminSaveMessage && (
          <div className="px-6 py-2.5 bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{adminSaveMessage}</span>
          </div>
        )}
        {adminErrorMessage && (
          <div className="px-6 py-2.5 bg-rose-950/90 border-b border-rose-500/40 text-rose-200 text-xs flex items-center gap-2 animate-fadeIn shrink-0">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{adminErrorMessage}</span>
          </div>
        )}

        {/* Body Split View */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Sidebar Tabs */}
          <nav className="w-full md:w-56 p-2 md:p-3 border-b md:border-b-0 md:border-r border-slate-800 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>

          {/* Tab Content Panel */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
            {/* 1. ACCOUNT TAB */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Account & Profile</h3>
                  <p className="text-xs text-slate-400">
                    Review your profile details, active subscription plan, and system role.
                  </p>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-700 bg-slate-800 shrink-0 flex items-center justify-center text-lg font-bold text-white">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <span>{user?.name?.[0] || 'U'}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">{user?.name}</h4>
                      {user?.plan === 'pro' ? (
                        <ProBadge size="sm" />
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase">
                          Free Plan
                        </span>
                      )}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        user?.role === 'admin'
                          ? 'bg-rose-950 border border-rose-500/40 text-rose-300'
                          : user?.role === 'operator'
                          ? 'bg-sky-950 border border-sky-500/40 text-sky-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        Role: {user?.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Member ID: <code className="text-slate-400 font-mono text-[10px]">{user?.id}</code>
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Switch Test Account
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'user_norhan', name: 'Norhan Rekani', plan: 'pro', role: 'admin', desc: 'Root Admin • Pro' },
                      { id: 'user_operator', name: 'Ops Coordinator', plan: 'pro', role: 'operator', desc: 'Operator • Pro' },
                      { id: 'user_alex', name: 'Alex Rivera', plan: 'free', role: 'user', desc: 'Standard User • Free' },
                    ].map((acc) => (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => switchAccount(acc.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          user?.id === acc.id
                            ? 'bg-indigo-600/20 border-indigo-500 text-white'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-semibold text-xs text-white">{acc.name}</div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400">{acc.desc}</span>
                          {acc.plan === 'pro' && <ProBadge size="sm" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. APPEARANCE TAB (System Accent Color & Theme Fix) */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Appearance & System Colors</h3>
                  <p className="text-xs text-slate-400">
                    Customize the Craft AI brand logo, theme mode, and system accent color. Selected changes apply immediately across all screens.
                  </p>
                </div>

                {/* Craft AI Logo Selector */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                    <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Craft AI Logo
                    </label>
                    <span className="text-[11px] text-indigo-300 font-medium">
                      Active: {CRAFT_LOGOS.find((l) => l.id === (settings.selectedLogo || 'logo-1'))?.name} ({CRAFT_LOGOS.find((l) => l.id === (settings.selectedLogo || 'logo-1'))?.concept})
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
                    Select your preferred original Craft AI brand logo. The selected logo automatically updates across the navbar, sidebar, AI avatar, chat, loading screen, favicon, and System Limited screens.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                    {CRAFT_LOGOS.map((logo) => {
                      const isSelected = (settings.selectedLogo || 'logo-1') === logo.id;
                      return (
                        <button
                          key={logo.id}
                          type="button"
                          onClick={() =>
                            setSettings((s) => ({ ...s, selectedLogo: logo.id as CraftLogoId }))
                          }
                          className={`group relative p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-2.5 cursor-pointer select-none ${
                            isSelected
                              ? 'border-indigo-400 bg-indigo-950/40 shadow-xl shadow-indigo-950/60 ring-2 ring-indigo-500/40'
                              : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 p-0.5 rounded-full bg-indigo-500 text-white shadow-sm">
                              <Check className="w-3 h-3" />
                            </div>
                          )}

                          {/* Logo Visual Preview */}
                          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 group-hover:scale-105 transition-transform shadow-inner">
                            <BrandLogo variant="app-icon" size={44} logoId={logo.id} />
                          </div>

                          <div className="w-full text-center">
                            <span className="text-xs font-bold text-slate-200 block truncate group-hover:text-white">
                              {logo.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                              {logo.concept}
                            </span>
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-semibold bg-slate-800/80 text-indigo-300 border border-slate-700/60">
                              {logo.badge}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Theme Selector */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Color Theme Mode
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, theme: mode }))}
                        className={`p-3 rounded-xl border text-center text-xs font-semibold capitalize transition-all ${
                          settings.theme === mode
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {mode} Mode
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Accent Color */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    System Accent Color (Active Theme: <span className="text-indigo-400 capitalize">{settings.accentColor}</span>)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    {[
                      { id: 'indigo', name: 'Indigo Core', hex: '#6366f1' },
                      { id: 'cyan', name: 'Cyan Neon', hex: '#06b6d4' },
                      { id: 'amber', name: 'Amber Glow', hex: '#f59e0b' },
                      { id: 'emerald', name: 'Emerald Mint', hex: '#10b981' },
                      { id: 'rose', name: 'Rose Crimson', hex: '#f43f5e' },
                      { id: 'purple', name: 'Purple Royal', hex: '#a855f7' },
                    ].map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({ ...s, accentColor: col.id as AccentColor }))
                        }
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                          settings.accentColor === col.id
                            ? 'border-white bg-slate-800 shadow-lg scale-105'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full shadow-md"
                          style={{ backgroundColor: col.hex }}
                        />
                        <span className="text-[11px] font-semibold text-slate-200">{col.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat Style */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Chat Message Presentation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, chatStyle: 'bubble' }))}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                        settings.chatStyle === 'bubble'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      Bubble & Contrast
                    </button>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, chatStyle: 'clean' }))}
                      className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                        settings.chatStyle === 'clean'
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      Clean Minimalist
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BACKGROUND TAB (Persistent & Fixed) */}
            {activeTab === 'background' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Custom Workspace Background</h3>
                  <p className="text-xs text-slate-400">
                    Apply a custom image background. Settings automatically persist to your account database.
                  </p>
                </div>

                {/* Input or Preset */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Background Image URL
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={settings.background.imageUrl}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          background: { ...s.background, imageUrl: e.target.value },
                        }))
                      }
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          background: { ...s.background, imageUrl: '' },
                        }))
                      }
                      className="px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Preset Quick Images */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      {
                        name: 'Artisan Slate',
                        url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
                      },
                      {
                        name: 'Deep Cosmos',
                        url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
                      },
                      {
                        name: 'Neural Lattice',
                        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
                      },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            background: { ...s.background, imageUrl: preset.url },
                          }))
                        }
                        className="p-2 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-indigo-500 text-xs text-left"
                      >
                        <span className="font-semibold text-slate-200 block truncate">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blur Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Background Blur: {settings.background.blur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={settings.background.blur}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        background: { ...s.background, blur: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Opacity: {(settings.background.opacity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={settings.background.opacity}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        background: { ...s.background, opacity: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 4. LANGUAGE TAB */}
            {activeTab === 'language' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Language & Localization</h3>
                  <p className="text-xs text-slate-400">
                    Switch application interface and AI response tuning.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { code: 'en', name: 'English', sub: 'Default (LTR)' },
                    { code: 'ku_badini', name: 'Kurdî (Badînî)', sub: 'Kurdish Latin (LTR)' },
                    { code: 'ku_sorani', name: 'کوردی (سۆرانی)', sub: 'Kurdish Arabic (RTL)' },
                    { code: 'ar', name: 'العربية', sub: 'Arabic (RTL)' },
                    { code: 'tr', name: 'Türkçe', sub: 'Turkish (LTR)' },
                    { code: 'fa', name: 'فارسی', sub: 'Persian (RTL)' },
                    { code: 'es', name: 'Español', sub: 'Spanish (LTR)' },
                    { code: 'fr', name: 'Français', sub: 'French (LTR)' },
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({ ...s, language: lang.code as LanguageCode }))
                      }
                      className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        settings.language === lang.code
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-xs sm:text-sm text-white">
                          {lang.name}
                        </div>
                        <div className="text-[11px] text-slate-400">{lang.sub}</div>
                      </div>
                      {settings.language === lang.code && (
                        <Check className="w-4 h-4 text-indigo-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 5. VOICE TAB */}
            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Voice & Speech Settings</h3>
                  <p className="text-xs text-slate-400">
                    Configure speech-to-text, neural TTS voice, and speech tempo.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Gemini TTS Voice
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                    {['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].map((vName) => (
                      <button
                        key={vName}
                        type="button"
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            voice: { ...s.voice, voiceName: vName },
                          }))
                        }
                        className={`p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                          settings.voice.voiceName === vName
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {vName}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleTestVoice}
                    disabled={testVoiceLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    <span>{testVoiceLoading ? 'Generating audio...' : 'Test Selected Voice'}</span>
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-300 font-semibold mb-1">
                    <span>Speed: {settings.voice.speechSpeed}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.75"
                    max="1.75"
                    step="0.05"
                    value={settings.voice.speechSpeed}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        voice: { ...s.voice, speechSpeed: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* 6. USAGE TAB */}
            {activeTab === 'usage' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-bold text-white mb-1">Usage & Limits</h3>
                  <p className="text-xs text-slate-400">
                    Live telemetry tracking of your account quotas and allocations.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-300">Daily Messages</span>
                    <span className="text-indigo-400">
                      {usage?.messagesToday || 0} / {usage?.limits?.messagesPerDay || 25}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300"
                      style={{
                        width: `${Math.min(
                          100,
                          ((usage?.messagesToday || 0) / (usage?.limits?.messagesPerDay || 25)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Remaining today: {Math.max(0, (usage?.limits?.messagesPerDay || 25) - (usage?.messagesToday || 0))} messages.
                    Quota resets daily at 00:00 UTC.
                  </p>
                </div>
              </div>
            )}

            {/* 7. PRO TAB */}
            {activeTab === 'pro' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">Craft AI Pro</h3>
                    <p className="text-xs text-slate-400">
                      Review subscription details and available privileges.
                    </p>
                  </div>
                  {user?.plan === 'pro' ? (
                    <ProBadge size="md" />
                  ) : (
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      FREE
                    </span>
                  )}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="text-xs font-bold text-slate-400 uppercase">Subscription Status</div>
                  <div className="text-sm font-semibold text-white capitalize">
                    {subscription?.subscriptionStatus || 'Active'}
                  </div>
                  <div className="text-xs text-slate-400">
                    Plan: <strong className="text-slate-200 capitalize">{user?.plan}</strong>
                  </div>
                  {subscription?.expiresAt && (
                    <div className="text-xs text-slate-400">
                      Renews / Expires:{' '}
                      {new Date(subscription.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {user?.plan === 'free' ? (
                    <button
                      type="button"
                      onClick={() => setIsProModalOpen(true)}
                      className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-indigo-600 text-white shadow-lg transition-transform hover:scale-105"
                    >
                      Upgrade to Craft AI Pro
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={cancelSubscription}
                      className="px-4 py-2 rounded-xl font-medium text-xs bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700"
                    >
                      Cancel Subscription
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 8. ADMIN & OPERATOR PANEL (Completely Hidden from Normal Users) */}
            {activeTab === 'admin' && isStaff && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className={`w-5 h-5 ${isAdmin ? 'text-rose-400' : 'text-sky-400'}`} />
                      <h3 className="text-base font-bold text-white">
                        {isAdmin ? 'System Administration Panel' : 'Operator Control Center'}
                      </h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {user?.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {isAdmin
                        ? 'Manage administrators, assign operator roles, gift plans, view audit logs, and configure system quotas.'
                        : 'Review accounts, search users, and manage plan allocations according to your granted permissions.'}
                    </p>
                  </div>
                </div>

                {/* Sub-navigation inside Admin Panel */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setAdminSection('users')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      adminSection === 'users' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>User Directory</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdminSection('admins')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        adminSection === 'admins' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Admin Management</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdminSection('operators')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        adminSection === 'operators' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Operator Roles</span>
                    </button>
                  )}

                  {(isAdmin || user?.operatorPermissions?.includes('plans.gift')) && (
                    <button
                      type="button"
                      onClick={() => setAdminSection('gift')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        adminSection === 'gift' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-400" />
                      <span>Gift Plan</span>
                    </button>
                  )}

                  {(isAdmin || user?.operatorPermissions?.includes('system.view')) && (
                    <button
                      type="button"
                      onClick={() => setAdminSection('logs')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        adminSection === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>Audit Logs</span>
                    </button>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setAdminSection('system')}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        adminSection === 'system' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <SettingsIcon className="w-3.5 h-3.5" />
                      <span>Limits & Outage</span>
                    </button>
                  )}
                </div>

                {/* --- Section A: User Directory & Search --- */}
                {adminSection === 'users' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="relative flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Search users by email, name, or ID..."
                          className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <select
                        value={userRoleFilter}
                        onChange={(e) => setUserRoleFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        <option value="all">All Roles</option>
                        <option value="admin">Admins</option>
                        <option value="operator">Operators</option>
                        <option value="user">Users</option>
                      </select>
                      <select
                        value={userPlanFilter}
                        onChange={(e) => setUserPlanFilter(e.target.value)}
                        className="px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        <option value="all">All Plans</option>
                        <option value="pro">Pro Plan</option>
                        <option value="free">Free Plan</option>
                      </select>
                    </div>

                    {/* Users List Table */}
                    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950/60">
                      <div className="max-h-96 overflow-y-auto custom-scrollbar">
                        {adminUsers.length > 0 ? (
                          <div className="divide-y divide-slate-800/80">
                            {adminUsers.map((u) => {
                              const isRoot = u.id === 'user_norhan';
                              return (
                                <div key={u.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700 shrink-0 flex items-center justify-center text-xs font-bold text-white">
                                      {u.avatar ? <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" /> : u.name?.[0]}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-xs text-white truncate">{u.name}</span>
                                        {isRoot && (
                                          <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                            ROOT ADMIN
                                          </span>
                                        )}
                                        {u.plan === 'pro' ? <ProBadge size="sm" /> : <span className="text-[10px] px-1 rounded bg-slate-800 text-slate-400">FREE</span>}
                                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                                          u.role === 'admin' ? 'text-rose-400 bg-rose-950/60' : u.role === 'operator' ? 'text-sky-400 bg-sky-950/60' : 'text-slate-400'
                                        }`}>
                                          {u.role}
                                        </span>
                                      </div>
                                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{u.email}</div>
                                      {u.subscription?.expiresAt && u.plan === 'pro' && (
                                        <div className="text-[10px] text-amber-300/80 mt-0.5">
                                          Expires: {new Date(u.subscription.expiresAt).toLocaleDateString()}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                    <div className="text-right text-[11px] text-slate-400 hidden sm:block mr-2">
                                      <div>Messages: {u.usage?.totalMessages || 0}</div>
                                      <div>Today: {u.usage?.messagesToday || 0}</div>
                                    </div>

                                    {/* Action: Quick Gift Pro */}
                                    {(isAdmin || user?.operatorPermissions?.includes('plans.gift')) && u.plan !== 'pro' && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setGiftEmail(u.email);
                                          setAdminSection('gift');
                                        }}
                                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30"
                                      >
                                        Gift Pro
                                      </button>
                                    )}

                                    {/* Action: Demote Admin if executor is Admin and not Root */}
                                    {isAdmin && u.role === 'admin' && !isRoot && (
                                      <button
                                        type="button"
                                        onClick={() => setDemoteConfirm({
                                          isOpen: true,
                                          userId: u.id,
                                          userName: u.name,
                                          userEmail: u.email,
                                          role: 'admin',
                                        })}
                                        className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60"
                                      >
                                        Remove Admin
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-500">
                            No users match the search criteria.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Section B: Admin Management --- */}
                {adminSection === 'admins' && isAdmin && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <UserPlus className="w-4 h-4 text-rose-400" />
                        <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                          Add New Administrator by Email
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Enter the email of an existing account to grant full Administrator access.
                      </p>
                      <form onSubmit={handleAddAdmin} className="flex gap-2">
                        <input
                          type="email"
                          required
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          placeholder="user@example.com"
                          className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-rose-500"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg"
                        >
                          Add Admin
                        </button>
                      </form>
                    </div>

                    {/* Active Admins List */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Active Administrators
                      </h4>
                      <div className="space-y-2">
                        {adminUsers.filter((u) => u.role === 'admin').map((adm) => {
                          const isRoot = adm.id === 'user_norhan';
                          return (
                            <div key={adm.id} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-rose-950/80 text-rose-300 border border-rose-500/40 flex items-center justify-center font-bold text-xs">
                                  {adm.name?.[0]}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-xs text-white">{adm.name}</span>
                                    {isRoot && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                        ROOT (PERMANENT)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400">{adm.email}</div>
                                </div>
                              </div>

                              {!isRoot ? (
                                <button
                                  type="button"
                                  onClick={() => setDemoteConfirm({
                                    isOpen: true,
                                    userId: adm.id,
                                    userName: adm.name,
                                    userEmail: adm.email,
                                    role: 'admin',
                                  })}
                                  className="px-3 py-1 rounded-xl text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-800/80 hover:bg-rose-900"
                                >
                                  Remove Admin
                                </button>
                              ) : (
                                <span className="text-xs text-slate-500 italic flex items-center gap-1">
                                  <Lock className="w-3.5 h-3.5" />
                                  Protected
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Section C: Operator Roles --- */}
                {adminSection === 'operators' && isAdmin && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="w-4 h-4 text-sky-400" />
                        <h4 className="font-bold text-xs text-white uppercase tracking-wider">
                          Assign Operator Role by Email
                        </h4>
                      </div>
                      <p className="text-xs text-slate-400 mb-3">
                        Operators handle support, user directory inspection, and plan gifting without receiving full admin privileges.
                      </p>
                      <form onSubmit={handleAddOperator} className="space-y-3">
                        <input
                          type="email"
                          required
                          value={newOperatorEmail}
                          onChange={(e) => setNewOperatorEmail(e.target.value)}
                          placeholder="operator@example.com"
                          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white focus:outline-none focus:border-sky-500"
                        />

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                            Granted Permissions
                          </label>
                          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                            {[
                              { id: 'users.view', label: 'View Users & Usage' },
                              { id: 'plans.view', label: 'View Subscription Status' },
                              { id: 'plans.gift', label: 'Gift Pro Plans' },
                              { id: 'system.view', label: 'View System Telemetry' },
                            ].map((perm) => (
                              <label key={perm.id} className="flex items-center gap-2 p-2 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={selectedPermissions.includes(perm.id as OperatorPermission)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPermissions((prev) => [...prev, perm.id as OperatorPermission]);
                                    } else {
                                      setSelectedPermissions((prev) => prev.filter((p) => p !== perm.id));
                                    }
                                  }}
                                  className="accent-sky-500"
                                />
                                <span>{perm.label}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl text-xs font-bold bg-sky-600 hover:bg-sky-500 text-white shadow-lg"
                        >
                          Assign Operator
                        </button>
                      </form>
                    </div>

                    {/* Active Operators List */}
                    <div>
                      <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
                        Active Operators
                      </h4>
                      <div className="space-y-2">
                        {adminUsers.filter((u) => u.role === 'operator').map((op) => (
                          <div key={op.id} className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-xs text-white">{op.name}</div>
                              <div className="text-[11px] text-slate-400">{op.email}</div>
                              <div className="text-[10px] text-sky-400 mt-0.5">
                                Permissions: {(op.operatorPermissions || []).join(', ') || 'None'}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => setDemoteConfirm({
                                isOpen: true,
                                userId: op.id,
                                userName: op.name,
                                userEmail: op.email,
                                role: 'operator',
                              })}
                              className="px-3 py-1 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-300 border border-slate-700"
                            >
                              Remove Role
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Section D: Gift Plan System --- */}
                {adminSection === 'gift' && (isAdmin || user?.operatorPermissions?.includes('plans.gift')) && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-slate-900 border border-amber-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <Gift className="w-5 h-5 text-amber-400" />
                        <h4 className="font-bold text-sm text-white">Gift Craft AI Pro by Email</h4>
                      </div>
                      <p className="text-xs text-slate-300 mb-4">
                        Grant a user full Craft AI Pro privileges (500 messages/day, gemini-3.1-pro reasoning models, 25MB uploads). The target user must have an existing account.
                      </p>

                      <form onSubmit={handleGiftPlanSubmit} className="space-y-3">
                        <div>
                          <label className="text-xs font-bold text-slate-300 block mb-1">
                            Recipient Email Address
                          </label>
                          <input
                            type="email"
                            required
                            value={giftEmail}
                            onChange={(e) => setGiftEmail(e.target.value)}
                            placeholder="user@example.com"
                            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">
                              Duration
                            </label>
                            <select
                              value={giftDuration}
                              onChange={(e) => setGiftDuration(e.target.value)}
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-slate-200"
                            >
                              <option value="7">7 Days Trial</option>
                              <option value="30">30 Days (1 Month)</option>
                              <option value="90">90 Days (3 Months)</option>
                              <option value="365">365 Days (1 Year)</option>
                              <option value="-1">Permanent Access</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-bold text-slate-300 block mb-1">
                              Reason / Audit Note (Optional)
                            </label>
                            <input
                              type="text"
                              value={giftReason}
                              onChange={(e) => setGiftReason(e.target.value)}
                              placeholder="e.g. VIP Member, Bug bounty reward"
                              className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingGift}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-900/40 transition-all hover:scale-[1.02]"
                        >
                          <Gift className="w-4 h-4" />
                          <span>{isSubmittingGift ? 'Processing Gift...' : 'Confirm & Gift Pro Plan'}</span>
                        </button>
                      </form>
                    </div>
                  </div>
                )}

                {/* --- Section E: Audit Logs --- */}
                {adminSection === 'logs' && (isAdmin || user?.operatorPermissions?.includes('system.view')) && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider">
                        Administrative Audit Logs ({auditLogs.length})
                      </h4>
                      <button
                        type="button"
                        onClick={() => api.getAuditLogs(100).then((r) => setAuditLogs(r.logs))}
                        className="text-xs text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden">
                      <div className="max-h-96 overflow-y-auto custom-scrollbar divide-y divide-slate-800/80">
                        {auditLogs.length > 0 ? (
                          auditLogs.map((log) => (
                            <div key={log.id} className="p-3 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                                  log.action === 'GIFT_PLAN'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                                    : log.action === 'ASSIGN_ROLE'
                                    ? 'bg-sky-950 text-sky-300 border border-sky-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}>
                                  {log.action}
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-slate-200">{log.details}</p>
                              <div className="text-[11px] text-slate-400">
                                Performed by: <strong className="text-slate-300">{log.adminName}</strong> ({log.adminEmail})
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-8 text-center text-xs text-slate-500">
                            No audit logs recorded yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* --- Section F: Limits & Outage --- */}
                {adminSection === 'system' && isAdmin && adminConfig && (
                  <div className="space-y-6 animate-fadeIn">
                    {/* Free Quotas */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-xs text-slate-300 uppercase">Free Plan Quota</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Daily Messages Limit
                          </label>
                          <input
                            type="number"
                            value={adminConfig.freeLimits.messagesPerDay}
                            onChange={(e) =>
                              setAdminConfig({
                                ...adminConfig,
                                freeLimits: {
                                  ...adminConfig.freeLimits,
                                  messagesPerDay: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Max Upload MB
                          </label>
                          <input
                            type="number"
                            value={adminConfig.freeLimits.maxUploadMB}
                            onChange={(e) =>
                              setAdminConfig({
                                ...adminConfig,
                                freeLimits: {
                                  ...adminConfig.freeLimits,
                                  maxUploadMB: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Pro Quotas */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-xs text-slate-300 uppercase">Pro Plan Quota</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Daily Messages Limit
                          </label>
                          <input
                            type="number"
                            value={adminConfig.proLimits.messagesPerDay}
                            onChange={(e) =>
                              setAdminConfig({
                                ...adminConfig,
                                proLimits: {
                                  ...adminConfig.proLimits,
                                  messagesPerDay: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] text-slate-400 block mb-1">
                            Max Upload MB
                          </label>
                          <input
                            type="number"
                            value={adminConfig.proLimits.maxUploadMB}
                            onChange={(e) =>
                              setAdminConfig({
                                ...adminConfig,
                                proLimits: {
                                  ...adminConfig.proLimits,
                                  maxUploadMB: Number(e.target.value),
                                },
                              })
                            }
                            className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Fault & Outage Simulation */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h4 className="font-bold text-xs text-amber-400 uppercase">
                        Fault & Outage Simulation (Testing)
                      </h4>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs font-semibold text-white">Simulate Rate Limit (429)</div>
                          <div className="text-[10px] text-slate-400">
                            Causes next chat requests to trigger System Limited 429 banner
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={adminConfig.simulatedProviderLimit}
                          onChange={(e) =>
                            setAdminConfig({
                              ...adminConfig,
                              simulatedProviderLimit: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-amber-500 rounded"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <div>
                          <div className="text-xs font-semibold text-white">Maintenance Mode (503)</div>
                          <div className="text-[10px] text-slate-400">
                            Puts system in maintenance mode
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={adminConfig.maintenanceMode}
                          onChange={(e) =>
                            setAdminConfig({
                              ...adminConfig,
                              maintenanceMode: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-rose-500 rounded"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleSaveAdminConfig}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                      >
                        Save System Config
                      </button>
                      <button
                        type="button"
                        onClick={handleResetMyQuota}
                        className="px-4 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300"
                      >
                        Reset My Daily Quota
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
