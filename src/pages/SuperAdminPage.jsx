import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Crown,
  ShieldCheck,
  ShieldAlert,
  Users,
  Building2,
  BarChart3,
  Sliders,
  Sparkles,
  Search,
  Filter,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  LogOut,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Layers,
  Check,
  X,
  Clock,
  ExternalLink,
  ChevronRight,
  Share2,
  Trash2,
  Eye,
  Settings,
  CreditCard,
  Server,
  Database,
  Cpu,
  Radio,
  AlertOctagon,
  HelpCircle,
  Edit3
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import StatusIndicator from '../components/ui/StatusIndicator';

export function SuperAdminPage() {
  const navigate = useNavigate();
  const { tab: urlTab } = useParams();
  const { user, logout, isSuperAdmin } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  // Tab State: 'overview' | 'enterprises' | 'billing' | 'health' | 'audit' | 'analytics' | 'controls'
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (urlTab === 'users' || urlTab === 'businesses') {
      navigate('/superadmin', { replace: true });
    } else if (urlTab === 'admins') {
      setActiveTab('enterprises');
    } else if (urlTab && ['overview', 'enterprises', 'billing', 'health', 'audit', 'analytics', 'controls'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab, navigate]);

  // Telemetry & Data States
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [billingList, setBillingList] = useState([]);
  const [health, setHealth] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [controls, setControls] = useState(null);

  // Filter & Search States
  const [tenantSearch, setTenantSearch] = useState('');
  const [tenantStatusFilter, setTenantStatusFilter] = useState('all'); // 'all' | 'active' | 'suspended'
  const [tenantPlanFilter, setTenantPlanFilter] = useState('all'); // 'all' | 'free' | 'starter' | 'pro' | 'enterprise'

  const [billingSearch, setBillingSearch] = useState('');
  const [billingFilter, setBillingFilter] = useState('all'); // 'all' | 'verified' | 'unverified' | 'unavailable'

  const [auditActionFilter, setAuditActionFilter] = useState('all'); // 'all' | 'tenant' | 'user' | 'system'
  const [auditActorSearch, setAuditActorSearch] = useState('');

  const [analyticsTimeframe, setAnalyticsTimeframe] = useState('30d');

  // Loading States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isHealthRefreshing, setIsHealthRefreshing] = useState(false);
  const [isBillingPolling, setIsBillingPolling] = useState(false);
  const [billingLastUpdated, setBillingLastUpdated] = useState(null);
  const isOverviewInFlightRef = useRef(false);

  // Modals & Action States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalRole, setCreateModalRole] = useState('admin');
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Subscription Edit Modal State
  const [editingTenantSub, setEditingTenantSub] = useState(null);
  const [subTier, setSubTier] = useState('pro');
  const [subStatus, setSubStatus] = useState('active');
  const [subGenLimit, setSubGenLimit] = useState(500);
  const [subPostLimit, setSubPostLimit] = useState(1000);
  const [isUpdatingSub, setIsUpdatingSub] = useState(false);

  // Load Initial Dashboard Data
  const loadDashboardData = useCallback(async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [
        statsRes,
        tenantsRes,
        billingRes,
        healthRes,
        logsRes,
        adminsRes,
        analyticsRes,
        controlsRes
      ] = await Promise.allSettled([
        api.superadmin.getStats(),
        api.superadmin.getTenants(),
        api.superadmin.getBilling(),
        api.superadmin.getHealth(),
        api.superadmin.getAuditLogs({ limit: 80 }),
        api.superadmin.getAdmins(),
        api.superadmin.getAnalytics('30d'),
        api.superadmin.getControls()
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (tenantsRes.status === 'fulfilled') setTenants(tenantsRes.value || []);
      if (billingRes.status === 'fulfilled') {
        setBillingList(billingRes.value || []);
        setBillingLastUpdated(new Date());
      }
      if (healthRes.status === 'fulfilled') setHealth(healthRes.value);
      if (logsRes.status === 'fulfilled') setAuditLogs(logsRes.value || []);
      if (adminsRes.status === 'fulfilled') setAdmins(adminsRes.value || []);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value);
      if (controlsRes.status === 'fulfilled') setControls(controlsRes.value);
    } catch (err) {
      console.error('Failed to sync SuperAdmin dashboard telemetry:', err);
      showToast('Error syncing SuperAdmin console with database.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const refreshOverviewStats = useCallback(async () => {
    if (isOverviewInFlightRef.current) return;
    isOverviewInFlightRef.current = true;
    try {
      const statsData = await api.superadmin.getStats();
      if (statsData) setStats(statsData);
    } catch {
      // Preserve existing Overview metrics on transient poll errors
    } finally {
      isOverviewInFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'overview') return undefined;

    refreshOverviewStats();
    const intervalId = setInterval(() => {
      refreshOverviewStats();
    }, 12000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeTab, refreshOverviewStats]);

  const refreshBillingData = useCallback(async () => {
    try {
      setIsBillingPolling(true);
      const billingData = await api.superadmin.getBilling();
      setBillingList(billingData || []);
      setBillingLastUpdated(new Date());
    } catch {
      // Preserve existing billing table state if background refresh fails
    } finally {
      setIsBillingPolling(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'billing') return undefined;

    refreshBillingData();
    const intervalId = setInterval(() => {
      refreshBillingData();
    }, 12000);

    return () => {
      clearInterval(intervalId);
    };
  }, [activeTab, refreshBillingData]);

  // Refresh Platform Health Standalone
  const handleRefreshHealth = async () => {
    setIsHealthRefreshing(true);
    try {
      const data = await api.superadmin.getHealth();
      setHealth(data);
      showToast('Platform health diagnostics refreshed.', 'success');
    } catch (err) {
      showToast('Failed to refresh platform health telemetry.', 'error');
    } finally {
      setIsHealthRefreshing(false);
    }
  };

  // Enterprise Tenant Status Toggle (Activate / Suspend)
  const handleToggleTenantStatus = async (tenantId, currentStatus, email) => {
    const action = currentStatus ? 'suspend' : 'activate';
    try {
      if (currentStatus) {
        await api.superadmin.suspendTenant(tenantId);
        showToast(`Enterprise Account #${tenantId} (${email || 'Admin'}) suspended.`, 'success');
      } else {
        await api.superadmin.activateTenant(tenantId);
        showToast(`Enterprise Account #${tenantId} (${email || 'Admin'}) activated.`, 'success');
      }
      loadDashboardData(true);
    } catch (err) {
      showToast(err.message || `Failed to ${action} tenant #${tenantId}.`, 'error');
    }
  };

  // Open Subscription Update Modal
  const handleOpenSubModal = (tenant) => {
    setEditingTenantSub(tenant);
    setSubTier(tenant.subscription_tier?.toLowerCase() || 'free');
    setSubStatus(tenant.subscription_status?.toLowerCase() || 'active');

    // Cross-reference billing record if available to populate limits
    const billingMatch = billingList.find(
      (b) => b.id === tenant.id || b.registered_email === tenant.registered_email
    );
    setSubGenLimit(billingMatch?.monthly_generation_limit ?? 500);
    setSubPostLimit(billingMatch?.monthly_posts_limit ?? 1000);
  };

  // Save Subscription Updates
  const handleSaveSubscription = async (e) => {
    e.preventDefault();
    if (!editingTenantSub) return;

    setIsUpdatingSub(true);
    try {
      await api.superadmin.updateTenantSubscription(editingTenantSub.id, {
        tier: subTier,
        status: subStatus,
        monthly_generation_limit: parseInt(subGenLimit, 10) || 500,
        monthly_posts_limit: parseInt(subPostLimit, 10) || 1000
      });
      showToast(`Tenant #${editingTenantSub.id} subscription updated to ${subTier.toUpperCase()}.`, 'success');
      setEditingTenantSub(null);
      loadDashboardData(true);
    } catch (err) {
      showToast(err.message || 'Failed to update enterprise subscription.', 'error');
    } finally {
      setIsUpdatingSub(false);
    }
  };

  // Provision Admin User
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newFullName || !newEmail || !newPassword) {
      showToast('Please provide name, email, and password.', 'error');
      return;
    }

    setIsCreating(true);
    try {
      await api.superadmin.createUser({
        full_name: newFullName,
        email: newEmail,
        password: newPassword,
        role: createModalRole,
        is_active: true
      });
      showToast(`Successfully provisioned ${createModalRole === 'super_admin' ? 'SuperAdmin' : 'Enterprise Admin'}: ${newEmail}`, 'success');
      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewPassword('');
      loadDashboardData(true);
    } catch (err) {
      showToast(err.message || 'Failed to provision account.', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  // System Controls Update
  const handleUpdateControls = async (updatedFields) => {
    try {
      const nextControls = { ...controls, ...updatedFields };
      setControls(nextControls);
      await api.superadmin.updateControls(nextControls);
      showToast('Platform master controls updated.', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to save system controls.', 'error');
    }
  };

  // Analytics Timeframe Switcher
  const handleAnalyticsTimeframeChange = async (tf) => {
    setAnalyticsTimeframe(tf);
    try {
      const data = await api.superadmin.getAnalytics(tf);
      if (data) setAnalytics(data);
    } catch (err) {
      console.warn('Failed to switch analytics timeframe:', err);
    }
  };

  // ── FILTERED DATASETS ──

  // 1. Enterprise Accounts Filtered
  const filteredTenants = useMemo(() => {
    return tenants.filter((t) => {
      const matchSearch =
        tenantSearch === '' ||
        t.registered_email?.toLowerCase().includes(tenantSearch.toLowerCase()) ||
        String(t.id).includes(tenantSearch.replace('#', '')) ||
        t.subscription_tier?.toLowerCase().includes(tenantSearch.toLowerCase());

      const matchStatus =
        tenantStatusFilter === 'all' ||
        (tenantStatusFilter === 'active' && t.is_active) ||
        (tenantStatusFilter === 'suspended' && !t.is_active);

      const matchPlan =
        tenantPlanFilter === 'all' ||
        t.subscription_tier?.toLowerCase() === tenantPlanFilter.toLowerCase();

      return matchSearch && matchStatus && matchPlan;
    });
  }, [tenants, tenantSearch, tenantStatusFilter, tenantPlanFilter]);

  // 2. Billing Subscriptions Filtered
  const filteredBilling = useMemo(() => {
    return billingList.filter((b) => {
      const matchSearch =
        billingSearch === '' ||
        b.registered_email?.toLowerCase().includes(billingSearch.toLowerCase()) ||
        b.plan?.toLowerCase().includes(billingSearch.toLowerCase());

      const matchFilter =
        billingFilter === 'all' ||
        (billingFilter === 'verified' && b.verification_status === 'Verified') ||
        (billingFilter === 'unverified' && b.verification_status === 'Unverified') ||
        (billingFilter === 'unavailable' && b.verification_status === 'Unavailable');

      return matchSearch && matchFilter;
    });
  }, [billingList, billingSearch, billingFilter]);

  // 3. Audit Logs Filtered
  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchSearch =
        auditActorSearch === '' ||
        log.user_email?.toLowerCase().includes(auditActorSearch.toLowerCase()) ||
        log.user_role?.toLowerCase().includes(auditActorSearch.toLowerCase()) ||
        log.action?.toLowerCase().includes(auditActorSearch.toLowerCase()) ||
        log.entity_type?.toLowerCase().includes(auditActorSearch.toLowerCase());

      const matchAction =
        auditActionFilter === 'all' ||
        (auditActionFilter === 'tenant' && (log.entity_type === 'tenant' || log.action?.includes('tenant'))) ||
        (auditActionFilter === 'user' && (log.entity_type === 'user' || log.action?.includes('user') || log.action?.includes('account') || log.action?.includes('role'))) ||
        (auditActionFilter === 'system' && (log.entity_type === 'system' || log.action?.includes('system') || log.action?.includes('control')));

      return matchSearch && matchAction;
    });
  }, [auditLogs, auditActorSearch, auditActionFilter]);

  // Derived Totals
  const totalEnterprises =
    stats?.total_organizations != null
      ? stats.total_organizations
      : stats?.active_organizations != null || stats?.suspended_organizations != null
        ? (stats?.active_organizations ?? 0) + (stats?.suspended_organizations ?? 0)
        : tenants.length;
  const activeEnterprises = stats?.active_organizations ?? tenants.filter((t) => t.is_active).length;
  const suspendedEnterprises = stats?.suspended_organizations ?? tenants.filter((t) => !t.is_active).length;

  const activeSubscriptions = stats?.active_subscriptions ?? 0;
  const expiredSubscriptions = stats?.expired_subscriptions ?? 0;

  const mrrFormatted = stats?.monthly_recurring_revenue != null
    ? `₹${Number(stats.monthly_recurring_revenue).toLocaleString('en-IN')}`
    : '₹0';
  const arrFormatted = stats?.annual_recurring_revenue != null
    ? `₹${Number(stats.annual_recurring_revenue).toLocaleString('en-IN')}`
    : '₹0';

  const planDist = stats?.plan_distribution || { free: 0, starter: 0, pro: 0, enterprise: 0 };
  const totalPlanAccounts = Object.values(planDist).reduce((sum, count) => sum + (Number(count) || 0), 0);
  const planPercentDenom = Math.max(1, totalPlanAccounts);

  return (
    <div className="min-h-screen bg-bg text-text font-sans selection:bg-primary/10 selection:text-primary pb-16 transition-colors duration-200">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute top-[25%] -right-[15%] w-[45vw] h-[45vw] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute -bottom-[10%] left-[25%] w-[40vw] h-[40vw] rounded-full bg-highlight/10 blur-[140px]" />
      </div>

      {/* ── TOP EXECUTIVE BAR ── */}
      <header className="relative z-20 border-b border-border bg-surface/95 backdrop-blur-2xl sticky top-0 px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors duration-200 text-text">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent text-primary-on shadow-md shadow-primary/25 ring-2 ring-border shrink-0">
            <Crown className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-text text-base">Social AI Master Console</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-soft text-primary border border-border">
                SuperAdmin Owner
              </span>
            </div>
            <p className="text-[11px] text-text-secondary hidden sm:block">
              Multi-Tenant Governance, Enterprise Isolation & Platform Telemetry
            </p>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <button
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-surface-raised text-text-secondary hover:text-text border border-border dark:bg-surface-raised dark:border-border dark:text-text transition cursor-pointer"
            title="Sync Telemetry from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          <button
            onClick={() => {
              setCreateModalRole('admin');
              setShowCreateModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-on hover:brightness-110 active:scale-95 shadow-md shadow-primary/25 transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span className="hidden md:inline">Provision Enterprise Admin</span>
            <span className="md:hidden">Add</span>
          </button>

          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-surface-raised text-primary border border-border dark:bg-surface-raised dark:border-border dark:text-accent transition"
          >
            <span className="hidden md:inline">Enterprise View</span>
            <span className="md:hidden">App</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={logout}
            className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 dark:bg-red-950/40 dark:border-red-900/60 dark:text-red-400 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── NAVIGATION TABS ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-surface rounded-2xl border border-border shadow-xs overflow-x-auto scrollbar-none transition-colors duration-200">
          {[
            { id: 'overview', icon: TrendingUp, label: 'Overview & Projected Revenue' },
            { id: 'enterprises', icon: Building2, label: `Enterprise Accounts (${tenants.length})` },
            { id: 'billing', icon: CreditCard, label: `Billing & Usage (${billingList.length})` },
            { id: 'health', icon: Activity, label: 'Platform Health' },
            { id: 'audit', icon: ShieldCheck, label: `Audit Logs (${auditLogs.length})` },
            { id: 'analytics', icon: BarChart3, label: 'Platform Analytics' },
            { id: 'controls', icon: Sliders, label: 'System Controls' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'text-white'
                    : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="superadmin-active-tab"
                    className="absolute inset-0 bg-primary rounded-xl shadow-md shadow-primary/25"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        {isLoading && !stats ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
            <p className="text-sm font-semibold text-text-secondary">Loading SuperAdmin Owner Console telemetry...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.165, 0.84, 0.44, 1] }}
            >
              {/* ══════════════════════════════════════════════
                  MODULE 1: OVERVIEW & PROJECTED REVENUE
              ══════════════════════════════════════════════ */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Top Revenue & Enterprise KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Monthly Recurring Revenue (MRR) */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Monthly Recurring Revenue</span>
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-text font-mono">
                          {mrrFormatted}
                        </span>
                        <span className="text-xs text-text-secondary font-medium">/ month</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                          Projected Revenue
                        </span>
                        <span className="text-[10px] text-text-secondary">Active paid tiers</span>
                      </div>
                    </div>

                    {/* 2. Annual Recurring Revenue (ARR) */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Annual Recurring Revenue</span>
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <BarChart3 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-text font-mono">
                          {arrFormatted}
                        </span>
                        <span className="text-xs text-text-secondary font-medium">/ year</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                          MRR × 12 Run Rate
                        </span>
                        <span className="text-[10px] text-text-secondary">Projected annualized</span>
                      </div>
                    </div>

                    {/* 3. Enterprises (Total, Active, Suspended) */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Enterprise Workspaces</span>
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <Building2 className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-text font-mono">
                          <AnimatedCounter value={totalEnterprises} />
                        </span>
                        <span className="text-xs text-text-secondary font-medium">Total Organizations</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{activeEnterprises} Active</span>
                        </span>
                        <span className="text-text-muted">•</span>
                        <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-bold">
                          <XCircle className="w-3 h-3" />
                          <span>{suspendedEnterprises} Suspended</span>
                        </span>
                      </div>
                    </div>

                    {/* 4. Subscriptions (Active & Expired) */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm relative overflow-hidden transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Subscription Lifecycles</span>
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                          <CreditCard className="w-4 h-4" />
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-text font-mono">
                          <AnimatedCounter value={activeSubscriptions} />
                        </span>
                        <span className="text-xs text-text-secondary font-medium">Active Subscriptions</span>
                      </div>
                      <div className="mt-2.5 flex items-center gap-2 text-[11px]">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30">
                          {activeSubscriptions} Active
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                          {expiredSubscriptions} Expired
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Plan Distribution Breakdown */}
                  <div className="bg-white dark:bg-surface rounded-2xl border border-border p-6 shadow-sm transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-text flex items-center gap-2">
                          <Layers className="w-4 h-4 text-primary" />
                          <span>Enterprise Subscription Plan Distribution</span>
                        </h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                          Tier breakdown across all active and legacy customer accounts
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-surface text-primary border border-border w-fit">
                        Total: {totalPlanAccounts} Accounts
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Free Plan */}
                      <div className="p-4 rounded-xl bg-surface border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-200 dark:bg-surface-raised text-text">
                            Free Tier
                          </span>
                          <span className="text-xs font-bold text-text-secondary">
                            {Math.round(((planDist.free || 0) / planPercentDenom) * 100)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-text font-mono mb-1">
                          {planDist.free || 0}
                        </div>
                        <p className="text-[11px] text-text-secondary">Evaluation workspaces (₹0/mo)</p>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="h-full bg-slate-500 rounded-full"
                            style={{ width: `${Math.round(((planDist.free || 0) / planPercentDenom) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Starter Plan */}
                      <div className="p-4 rounded-xl bg-surface border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                            Starter
                          </span>
                          <span className="text-xs font-bold text-text-secondary">
                            {Math.round(((planDist.starter || 0) / planPercentDenom) * 100)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-blue-700 dark:text-blue-400 font-mono mb-1">
                          {planDist.starter || 0}
                        </div>
                        <p className="text-[11px] text-text-secondary">₹1,999 / mo per workspace</p>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${Math.round(((planDist.starter || 0) / planPercentDenom) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Pro Plan */}
                      <div className="p-4 rounded-xl bg-surface border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                            Pro
                          </span>
                          <span className="text-xs font-bold text-text-secondary">
                            {Math.round(((planDist.pro || 0) / planPercentDenom) * 100)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-purple-700 dark:text-purple-400 font-mono mb-1">
                          {planDist.pro || 0}
                        </div>
                        <p className="text-[11px] text-text-secondary">₹4,999 / mo per workspace</p>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${Math.round(((planDist.pro || 0) / planPercentDenom) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Enterprise Plan */}
                      <div className="p-4 rounded-xl bg-surface border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                            Enterprise
                          </span>
                          <span className="text-xs font-bold text-text-secondary">
                            {Math.round(((planDist.enterprise || 0) / planPercentDenom) * 100)}%
                          </span>
                        </div>
                        <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono mb-1">
                          {planDist.enterprise || 0}
                        </div>
                        <p className="text-[11px] text-text-secondary">₹9,999 / mo per workspace</p>
                        <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full mt-2.5 overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 rounded-full"
                            style={{ width: `${Math.round(((planDist.enterprise || 0) / planPercentDenom) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Content Pipeline Status Cards */}
                  <div className="bg-white dark:bg-surface rounded-2xl border border-border p-6 shadow-sm transition-colors">
                    <h3 className="text-sm font-bold text-text mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-primary" />
                      <span>Global Content Pipeline Breakdown</span>
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-secondary font-semibold block mb-1">Published</span>
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                          {stats?.total_published_posts ?? stats?.published_posts ?? 0}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-secondary font-semibold block mb-1">Scheduled</span>
                        <span className="text-xl font-black text-primary font-mono">
                          {stats?.total_scheduled_posts ?? stats?.scheduled_posts ?? 0}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-secondary font-semibold block mb-1">Pending Approval</span>
                        <span className="text-xl font-black text-warning font-mono">
                          {stats?.total_pending_posts ?? 0}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-secondary font-semibold block mb-1">Drafts</span>
                        <span className="text-xl font-black text-text-secondary font-mono">
                          {stats?.total_draft_posts ?? 0}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-secondary font-semibold block mb-1">Failed Attempts</span>
                        <span className="text-xl font-black text-rose-700 dark:text-rose-400 font-mono">
                          {stats?.total_failed_posts ?? 0}
                        </span>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface border border-border">
                        <span className="text-[11px] text-text-secondary font-semibold block mb-1">Total Posts</span>
                        <span className="text-xl font-black text-text font-mono">
                          {stats?.total_posts ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  MODULE 2: ENTERPRISE ACCOUNTS (PRIVACY PROTECTED)
              ══════════════════════════════════════════════ */}
              {activeTab === 'enterprises' && (
                <div className="space-y-4">
                  {/* Search & Filter Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-surface border border-border shadow-xs transition-colors">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search by registered email or ID..."
                        value={tenantSearch}
                        onChange={(e) => setTenantSearch(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                      <select
                        value={tenantStatusFilter}
                        onChange={(e) => setTenantStatusFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                      >
                        <option value="all">All Governance Statuses</option>
                        <option value="active">Active Only</option>
                        <option value="suspended">Suspended Only</option>
                      </select>

                      <select
                        value={tenantPlanFilter}
                        onChange={(e) => setTenantPlanFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                      >
                        <option value="all">All Plans</option>
                        <option value="free">Free</option>
                        <option value="starter">Starter</option>
                        <option value="pro">Pro</option>
                        <option value="enterprise">Enterprise</option>
                      </select>

                      <button
                        onClick={() => {
                          setCreateModalRole('admin');
                          setShowCreateModal(true);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-on hover:brightness-110 active:scale-95 shadow-md shadow-primary/20 transition whitespace-nowrap ml-auto cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Provision Account</span>
                      </button>
                    </div>
                  </div>

                  {/* Enterprise Directory Table */}
                  <div className="overflow-x-auto rounded-2xl border border-border bg-white dark:bg-surface shadow-xs transition-colors">
                    <table className="w-full text-left text-xs min-w-[760px]">
                      <thead className="bg-surface text-primary dark:text-text font-bold border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Account ID</th>
                          <th className="py-3 px-4">Registered Admin Email</th>
                          <th className="py-3 px-4">Enterprise Plan</th>
                          <th className="py-3 px-4 text-center">Subscription Status</th>
                          <th className="py-3 px-4 text-center">Account Status</th>
                          <th className="py-3 px-4 text-center">Registration Date</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F7F8FC] dark:divide-slate-800">
                        {filteredTenants.map((t) => {
                          const tier = t.subscription_tier || 'FREE';
                          const subStat = t.subscription_status || 'active';
                          const createdDate = t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A';

                          return (
                            <tr key={t.id} className="hover:bg-[#FFFFFF] dark:hover:bg-surface/50 transition">
                              <td className="py-3.5 px-4 font-mono font-bold text-text">
                                <span className="px-2 py-0.5 rounded bg-surface border border-border text-[11px]">
                                  #{t.id}
                                </span>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {t.registered_email ? t.registered_email[0] : 'E'}
                                  </div>
                                  <div>
                                    <span className="font-bold text-text font-mono block">
                                      {t.registered_email || 'No administrator email'}
                                    </span>
                                    <span className="text-[10px] text-text-secondary inline-block">
                                      {t.tenant_isolation_status || 'Dedicated Workspace'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-soft text-primary border border-border">
                                  {tier}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  subStat.toLowerCase() === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
                                }`}>
                                  {subStat}
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  t.is_active
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
                                }`}>
                                  {t.is_active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  <span>{t.is_active ? 'Active' : 'Suspended'}</span>
                                </span>
                              </td>

                              <td className="py-3.5 px-4 text-center text-text-secondary font-mono text-[11px]">
                                {createdDate}
                              </td>

                              <td className="py-3.5 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Subscription Update Button */}
                                  <button
                                    onClick={() => handleOpenSubModal(t)}
                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-border transition cursor-pointer"
                                    title="Update Subscription & Limits"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    <span>Plan</span>
                                  </button>

                                  {/* Activate / Suspend Toggle */}
                                  <button
                                    onClick={() => handleToggleTenantStatus(t.id, t.is_active, t.registered_email)}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                                      t.is_active
                                        ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:border-rose-900/60 dark:text-rose-400'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/60 dark:text-emerald-400'
                                    }`}
                                  >
                                    {t.is_active ? 'Suspend' : 'Activate'}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {filteredTenants.length === 0 && (
                      <div className="py-12 text-center text-text-secondary text-xs">
                        No enterprise accounts match your search or filter.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  MODULE 3: BILLING & RESOURCE USAGE TELEMETRY
              ══════════════════════════════════════════════ */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  {/* Live Usage Telemetry Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-surface-raised/60 dark:bg-surface border border-border text-xs">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          isBillingPolling ? 'bg-primary animate-ping' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="font-semibold text-text">Real-Time Usage Metering</span>
                      <span className="text-text-muted">• Auto-updates every 12s while Billing is active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-text-muted">
                        Last updated:{' '}
                        {billingLastUpdated
                          ? billingLastUpdated.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })
                          : 'Syncing...'}
                      </span>
                      <button
                        type="button"
                        onClick={refreshBillingData}
                        disabled={isBillingPolling}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold bg-white dark:bg-surface-raised border border-border text-text-secondary hover:text-text transition cursor-pointer disabled:opacity-60"
                      >
                        <RefreshCw className={`w-3 h-3 ${isBillingPolling ? 'animate-spin text-primary' : ''}`} />
                        <span>Refresh</span>
                      </button>
                    </div>
                  </div>
                  {/* Search & Filter Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-surface border border-border shadow-xs transition-colors">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search by enterprise email or plan..."
                        value={billingSearch}
                        onChange={(e) => setBillingSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="flex items-center p-1 rounded-xl bg-surface border border-border text-xs">
                        {[
                          { id: 'all', label: 'All Records' },
                          { id: 'verified', label: 'Verified' },
                          { id: 'unverified', label: 'Unverified' },
                          { id: 'unavailable', label: 'Unavailable' }
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setBillingFilter(btn.id)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                              billingFilter === btn.id
                                ? 'bg-primary text-primary-on shadow-xs'
                                : 'text-text-secondary hover:text-text'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Subscriptions & Resource Telemetry Table */}
                  <div className="overflow-x-auto rounded-2xl border border-border bg-white dark:bg-surface shadow-xs transition-colors">
                    <table className="w-full text-left text-xs min-w-[840px]">
                      <thead className="bg-surface text-primary dark:text-text font-bold border-b border-border">
                        <tr>
                          <th className="py-3 px-4">Enterprise Registered Email</th>
                          <th className="py-3 px-4">Plan & Status</th>
                          <th className="py-3 px-4">Current Billing Window</th>
                          <th className="py-3 px-4">AI Generations Usage</th>
                          <th className="py-3 px-4">Social Posts Usage</th>
                          <th className="py-3 px-4 text-center">Payment Verification</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F7F8FC] dark:divide-slate-800">
                        {filteredBilling.map((item) => {
                          const startStr = item.current_period_start
                            ? new Date(item.current_period_start).toLocaleDateString()
                            : 'N/A';
                          const endStr = item.current_period_end
                            ? new Date(item.current_period_end).toLocaleDateString()
                            : 'N/A';

                          const genUsage = item.current_generation_usage ?? 0;
                          const genLimit = item.monthly_generation_limit ?? 500;
                          const genPct = Math.min(100, Math.round((genUsage / Math.max(1, genLimit)) * 100));

                          const postsUsage = item.current_posts_usage ?? 0;
                          const postsLimit = item.monthly_posts_limit ?? 1000;
                          const postsPct = Math.min(100, Math.round((postsUsage / Math.max(1, postsLimit)) * 100));

                          return (
                            <tr key={item.id} className="hover:bg-[#FFFFFF] dark:hover:bg-surface/50 transition">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                    {item.registered_email?.[0] || 'E'}
                                  </div>
                                  <span className="font-bold text-text font-mono">{item.registered_email}</span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-primary uppercase">{item.plan}</span>
                                  <span className={`px-2 py-0.2 rounded text-[9px] font-bold uppercase ${
                                    item.subscription_status?.toLowerCase() === 'active'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300'
                                  }`}>
                                    {item.subscription_status}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 font-mono text-[11px] text-text-secondary">
                                {startStr} → {endStr}
                              </td>

                              {/* AI Generations Usage */}
                              <td className="py-3.5 px-4">
                                <div className="w-36">
                                  <div className="flex justify-between text-[11px] font-mono mb-1">
                                    <span className="font-bold text-text">{genUsage}</span>
                                    <span className="text-text-secondary">/ {genLimit}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        genPct > 90 ? 'bg-rose-500' : genPct > 70 ? 'bg-amber-500' : 'bg-primary'
                                      }`}
                                      style={{ width: `${genPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Social Posts Usage */}
                              <td className="py-3.5 px-4">
                                <div className="w-36">
                                  <div className="flex justify-between text-[11px] font-mono mb-1">
                                    <span className="font-bold text-text">{postsUsage}</span>
                                    <span className="text-text-secondary">/ {postsLimit}</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${
                                        postsPct > 90 ? 'bg-rose-500' : postsPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${postsPct}%` }}
                                    />
                                  </div>
                                </div>
                              </td>

                              {/* Payment Verification Status */}
                              <td className="py-3.5 px-4 text-center">
                                {item.verification_status === 'Verified' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Verified Payment</span>
                                  </span>
                                ) : item.verification_status === 'Unverified' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30">
                                    <Clock className="w-3 h-3 text-amber-600" />
                                    <span>Unverified</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200 dark:bg-white/5 dark:text-white/60 dark:border-white/10">
                                    <Clock className="w-3 h-3" />
                                    <span>Unavailable</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {filteredBilling.length === 0 && (
                      <div className="py-12 text-center text-text-secondary text-xs">
                        No billing telemetry matching criteria.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  MODULE 4: PLATFORM HEALTH & INFRASTRUCTURE
              ══════════════════════════════════════════════ */}
              {activeTab === 'health' && (
                <div className="space-y-6">
                  {/* Top Status Banner */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 rounded-2xl bg-white dark:bg-surface border border-border shadow-xs transition-colors">
                    <div>
                      <h3 className="text-sm font-bold text-text flex items-center gap-2">
                        <Activity className="w-4 h-4 text-primary" />
                        <span>Unified Platform Health & Diagnostics</span>
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        Real-time database latency, background service loops, and failure telemetry
                      </p>
                    </div>

                    <button
                      onClick={handleRefreshHealth}
                      disabled={isHealthRefreshing}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-on hover:brightness-110 active:scale-95 transition cursor-pointer w-fit"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isHealthRefreshing ? 'animate-spin' : ''}`} />
                      <span>{isHealthRefreshing ? 'Testing Connections...' : 'Test All Services'}</span>
                    </button>
                  </div>

                  {/* Core Services Diagnostics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* API Status */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Core FastAPI Gateway</span>
                        <Server className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${health?.api_status === 'healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                        <span className="text-xl font-black text-text font-mono capitalize">
                          {health?.api_status || 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-2">
                        Status endpoint response code: 200 OK
                      </p>
                    </div>

                    {/* Database Status & Latency */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">PostgreSQL / SQLite Storage</span>
                        <Database className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-xl font-black font-mono ${health?.database_connected ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700'}`}>
                          {health?.database_connected ? 'Connected' : 'Disconnected'}
                        </span>
                        {health?.database_latency_ms != null && (
                          <span className="text-xs font-mono font-bold text-text-secondary">
                            ({health.database_latency_ms} ms ping)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-text-secondary mt-2">
                        Direct connection ping verified via SELECT 1
                      </p>
                    </div>

                    {/* Redis Status */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Redis Cache & Broker</span>
                        <Cpu className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          health?.redis_available
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-700 dark:bg-surface-raised dark:text-text-secondary border border-border'
                        }`}>
                          {health?.redis_available ? 'Connected' : 'Not Configured / Unavailable'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-2">
                        {health?.redis_available ? 'In-memory caching online' : 'Operating in direct database fallback mode'}
                      </p>
                    </div>

                    {/* Publishing Worker */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Publishing Dispatch Worker</span>
                        <Radio className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          health?.publishing_worker_status === 'running'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {health?.publishing_worker_status || 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-2">
                        Inspects background queue worker loop state
                      </p>
                    </div>

                    {/* Autonomous Scheduler */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Autonomous AI Scheduler</span>
                        <Sparkles className="w-4 h-4 text-text-secondary" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          health?.autonomous_scheduler_status === 'running'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {health?.autonomous_scheduler_status || 'Unavailable'}
                        </span>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-2">
                        Scheduled content generation daemon loop
                      </p>
                    </div>

                    {/* Failure Telemetry Summary */}
                    <div className="bg-white dark:bg-surface p-5 rounded-2xl border border-border shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-primary">Platform Failure Counters</span>
                        <AlertOctagon className="w-4 h-4 text-rose-500" />
                      </div>
                      <div className="flex items-center gap-4 text-xs font-mono font-bold">
                        <div>
                          <span className="text-text-secondary text-[10px] block">Failed Posts</span>
                          <span className={`text-base ${health?.failed_content_count > 0 ? 'text-rose-600' : 'text-text'}`}>
                            {health?.failed_content_count ?? 0}
                          </span>
                        </div>
                        <div className="border-l border-border pl-4">
                          <span className="text-text-secondary text-[10px] block">Failed AI Jobs</span>
                          <span className={`text-base ${health?.failed_generation_jobs_count > 0 ? 'text-rose-600' : 'text-text'}`}>
                            {health?.failed_generation_jobs_count ?? 0}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] text-text-secondary mt-2">
                        Live database count of failed executions
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  MODULE 5: AUDIT LOGS TRAIL & GOVERNANCE
              ══════════════════════════════════════════════ */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  {/* Search & Filter Header */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-surface border border-border shadow-xs transition-colors">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3" />
                      <input
                        type="text"
                        placeholder="Search logs by actor email, role, action..."
                        value={auditActorSearch}
                        onChange={(e) => setAuditActorSearch(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-2 rounded-xl text-xs bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring"
                      />
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <select
                        value={auditActionFilter}
                        onChange={(e) => setAuditActionFilter(e.target.value)}
                        className="px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                      >
                        <option value="all">All Action Types</option>
                        <option value="tenant">Enterprise Tenant Actions</option>
                        <option value="user">User & Role Actions</option>
                        <option value="system">Master Controls & System</option>
                      </select>
                    </div>
                  </div>

                  {/* Audit Logs Table */}
                  <div className="overflow-x-auto rounded-2xl border border-border bg-white dark:bg-surface shadow-xs transition-colors">
                    <table className="w-full text-left text-xs min-w-[700px]">
                      <thead className="bg-surface text-primary dark:text-text font-bold border-b border-border">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Actor Email</th>
                          <th className="py-2.5 px-3">Role</th>
                          <th className="py-2.5 px-3">Action</th>
                          <th className="py-2.5 px-3">Entity Target</th>
                          <th className="py-2.5 px-3">IP Address</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F7F8FC] dark:divide-slate-800 font-mono text-[11px]">
                        {filteredAuditLogs.map((log) => (
                          <tr key={log.id} className="hover:bg-[#FFFFFF] dark:hover:bg-surface/50 transition">
                            <td className="py-2.5 px-3 text-text-secondary">
                              {log.created_at ? new Date(log.created_at).toLocaleString() : 'Recent'}
                            </td>
                            <td className="py-2.5 px-3 text-text font-semibold">
                              {log.user_email || 'System'}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-surface text-primary border border-border">
                                {log.user_role || 'system'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-emerald-700 dark:text-emerald-400 font-bold">
                              {log.action}
                            </td>
                            <td className="py-2.5 px-3 text-text-secondary">
                              {log.entity_type} #{log.entity_id || '0'}
                            </td>
                            <td className="py-2.5 px-3 text-text-muted">
                              {log.ip_address || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredAuditLogs.length === 0 && (
                      <div className="py-12 text-center text-xs text-text-secondary">
                        No audit events match your filter criteria.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  MODULE 6: PLATFORM ANALYTICS & CHANNELS
              ══════════════════════════════════════════════ */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  {/* Output Ratio Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-2xl bg-white dark:bg-surface border border-border shadow-sm">
                      <span className="text-xs font-bold text-primary block mb-2">Content Production Comparison</span>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-blue-600">Regular Users Output</span>
                            <span className="text-text font-bold font-mono">{analytics?.user_summary?.posts_created_by_users || 0} posts</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-surface-raised rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((analytics?.user_summary?.posts_created_by_users || 0) /
                                    Math.max(
                                      1,
                                      (analytics?.user_summary?.posts_created_by_users || 0) +
                                        (analytics?.admin_summary?.posts_created_by_admins || 0)
                                    )) * 100
                                )}%`
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-amber-600">Admin Staff Output</span>
                            <span className="text-text font-bold font-mono">{analytics?.admin_summary?.posts_created_by_admins || 0} posts</span>
                          </div>
                          <div className="w-full h-2 bg-slate-200 dark:bg-surface-raised rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${Math.min(
                                  100,
                                  ((analytics?.admin_summary?.posts_created_by_admins || 0) /
                                    Math.max(
                                      1,
                                      (analytics?.user_summary?.posts_created_by_users || 0) +
                                        (analytics?.admin_summary?.posts_created_by_admins || 0)
                                    )) * 100
                                )}%`
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Generation Consumption */}
                    <div className="p-5 rounded-2xl bg-white dark:bg-surface border border-border shadow-sm">
                      <span className="text-xs font-bold text-primary block mb-2">AI Generation Consumption</span>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-purple-600">Creators Generations</span>
                            <span className="text-text font-bold font-mono">{analytics?.user_summary?.generations_by_users || 0}</span>
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1">
                            <span className="text-amber-600">Admin Generations</span>
                            <span className="text-text font-bold font-mono">{analytics?.admin_summary?.generations_by_admins || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-white dark:bg-surface border border-border shadow-sm flex flex-col justify-between">
                      <div>
                        <span className="text-xs font-bold text-primary block mb-1">Ratio User-to-Admin Output</span>
                        <span className="text-3xl font-black text-primary font-mono">
                          {analytics?.ratio_user_to_admin_posts || 0}x
                        </span>
                        <p className="text-xs text-text-secondary mt-2">
                          Creators produce {analytics?.ratio_user_to_admin_posts || 0} posts autonomously per admin post.
                        </p>
                      </div>
                      <div className="pt-2 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Platform Health: Highly Active Creator Base</span>
                      </div>
                    </div>
                  </div>

                  {/* Connected Social Media Channels */}
                  <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-border shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-bold text-text flex items-center gap-2">
                          <Share2 className="w-4 h-4 text-primary" />
                          <span>Connected Social Media Channels</span>
                        </h4>
                        <p className="text-xs text-text-secondary mt-1">
                          Enterprise distribution across YouTube, Facebook, and Instagram
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex rounded-lg bg-surface p-0.5 text-[11px] font-semibold border border-border">
                          {['7d', '30d', '90d'].map((tf) => (
                            <button
                              key={tf}
                              type="button"
                              onClick={() => handleAnalyticsTimeframeChange(tf)}
                              className={`px-2 py-0.5 rounded-md uppercase transition-all cursor-pointer ${
                                analyticsTimeframe === tf
                                  ? 'bg-primary text-primary-on font-bold shadow-xs'
                                  : 'text-text-muted hover:text-text'
                              }`}
                            >
                              {tf}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {(() => {
                      const rawDist = analytics?.platform_distribution || {};
                      const platformDist = {
                        youtube: rawDist.youtube || 0,
                        facebook: rawDist.facebook || 0,
                        instagram: rawDist.instagram || 0
                      };
                      const totalAllowedAccounts = platformDist.youtube + platformDist.facebook + platformDist.instagram;

                      const platforms = [
                        {
                          key: 'youtube',
                          name: 'YouTube',
                          tag: 'YT',
                          badgeBg: 'bg-red-600',
                          barBg: 'bg-red-600',
                          border: 'border-red-200 dark:border-red-900/40',
                          count: platformDist.youtube,
                          desc: 'Video shorts & channel broadcasts'
                        },
                        {
                          key: 'facebook',
                          name: 'Facebook',
                          tag: 'FB',
                          badgeBg: 'bg-[#1877F2]',
                          barBg: 'bg-[#1877F2]',
                          border: 'border-blue-200 dark:border-blue-900/40',
                          count: platformDist.facebook,
                          desc: 'Brand pages & store footfall'
                        },
                        {
                          key: 'instagram',
                          name: 'Instagram',
                          tag: 'IG',
                          badgeBg: 'bg-[#E1306C]',
                          barBg: 'bg-[#E1306C]',
                          border: 'border-pink-200 dark:border-pink-900/40',
                          count: platformDist.instagram,
                          desc: 'Visual carousels, reels & aesthetics'
                        }
                      ];

                      return (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {platforms.map((p) => {
                            const pct = totalAllowedAccounts > 0 ? Math.round((p.count / totalAllowedAccounts) * 100) : 0;
                            return (
                              <div
                                key={p.key}
                                className={`p-4 rounded-xl bg-surface border ${p.border} transition-all`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black text-white ${p.badgeBg}`}>
                                    {p.tag}
                                  </span>
                                  <span className="text-[11px] font-bold text-text-muted">
                                    {pct}% Share
                                  </span>
                                </div>
                                <div className="text-xl font-black text-text font-mono mb-0.5">
                                  {p.count} <span className="text-xs font-semibold text-text-muted font-normal">Accounts</span>
                                </div>
                                <div className="text-xs font-bold text-text">{p.name}</div>
                                <p className="text-[11px] text-text-secondary mt-0.5 mb-2">{p.desc}</p>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-surface-raised rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${p.barBg} rounded-full transition-all duration-500`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ══════════════════════════════════════════════
                  MODULE 7: MASTER GOVERNANCE CONTROLS
              ══════════════════════════════════════════════ */}
              {activeTab === 'controls' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-white dark:bg-surface border border-border shadow-sm transition-colors">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-text flex items-center gap-2">
                          <Sliders className="w-4 h-4 text-primary" />
                          <span>Platform-Wide Master Governance Controls</span>
                        </h3>
                        <p className="text-xs text-text-secondary mt-1">
                          Executive switches affecting all Admins, Creators, and background worker loops.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Maintenance Mode */}
                      <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text block">Platform Maintenance Mode</span>
                          <span className="text-[11px] text-text-secondary">Suspend non-admin logins for system updates</span>
                        </div>
                        <button
                          onClick={() => handleUpdateControls({ maintenance_mode: !controls?.maintenance_mode })}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            controls?.maintenance_mode ? 'bg-rose-500' : 'bg-slate-300 dark:bg-surface-raised'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                              controls?.maintenance_mode ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Open Registration */}
                      <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text block">Open User Self-Registration</span>
                          <span className="text-[11px] text-text-secondary">Allow creators to register without admin invites</span>
                        </div>
                        <button
                          onClick={() => handleUpdateControls({ open_registration: !controls?.open_registration })}
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            controls?.open_registration ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-surface-raised'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                              controls?.open_registration ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Autonomous Scheduler Engine */}
                      <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text block">Autonomous AI Scheduler Engine</span>
                          <span className="text-[11px] text-text-secondary">Background AI content generation & batch synthesis</span>
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateControls({
                              autonomous_scheduler_active: !controls?.autonomous_scheduler_active
                            })
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            controls?.autonomous_scheduler_active ? 'bg-primary' : 'bg-slate-300 dark:bg-surface-raised'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                              controls?.autonomous_scheduler_active ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Publishing Worker Loop */}
                      <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
                        <div>
                          <span className="font-bold text-xs text-text block">Social Media Dispatch Worker</span>
                          <span className="text-[11px] text-text-secondary">Auto-publish approved posts to connected networks</span>
                        </div>
                        <button
                          onClick={() =>
                            handleUpdateControls({
                              publishing_worker_active: !controls?.publishing_worker_active
                            })
                          }
                          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                            controls?.publishing_worker_active ? 'bg-primary' : 'bg-slate-300 dark:bg-surface-raised'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                              controls?.publishing_worker_active ? 'left-7' : 'left-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── SUBSCRIPTION UPDATE MODAL ── */}
      {editingTenantSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-surface border border-border text-text rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative transition-colors">
            <button
              onClick={() => setEditingTenantSub(null)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-selected transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-2">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-base font-black text-text">Update Subscription & Limits</h3>
            </div>
            <p className="text-xs text-text-secondary mb-5">
              Account: <strong className="text-text font-mono">#{editingTenantSub.id}</strong> ({editingTenantSub.registered_email || 'No email'})
            </p>

            <form onSubmit={handleSaveSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Subscription Tier</label>
                <select
                  value={subTier}
                  onChange={(e) => setSubTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                >
                  <option value="free">FREE (Evaluation, ₹0)</option>
                  <option value="starter">STARTER (Boutique, ₹1,999/mo)</option>
                  <option value="pro">PRO (Growth, ₹4,999/mo)</option>
                  <option value="enterprise">ENTERPRISE (Scale, ₹9,999/mo)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Subscription Status</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30"
                >
                  <option value="active">ACTIVE</option>
                  <option value="trialing">TRIALING</option>
                  <option value="past_due">PAST DUE</option>
                  <option value="canceled">CANCELED</option>
                  <option value="incomplete">INCOMPLETE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Monthly Generations</label>
                  <input
                    type="number"
                    min="1"
                    value={subGenLimit}
                    onChange={(e) => setSubGenLimit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text mb-1">Monthly Posts</label>
                  <input
                    type="number"
                    min="1"
                    value={subPostLimit}
                    onChange={(e) => setSubPostLimit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTenantSub(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text border border-border transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingSub}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-on hover:brightness-110 active:scale-95 transition shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
                >
                  {isUpdatingSub ? 'Saving...' : 'Apply Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE ADMIN / USER MODAL ── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-surface border border-border text-text rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative transition-colors">
            <button
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 p-1.5 rounded-xl text-text-muted hover:text-text hover:bg-surface-selected transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-accent" />
              <h3 className="text-base font-black text-text">Provision Administrator Account</h3>
            </div>
            <p className="text-xs text-text-secondary mb-5">
              Create an isolated Enterprise Admin workspace or platform SuperAdmin.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-surface rounded-xl border border-border">
                  <button
                    type="button"
                    onClick={() => setCreateModalRole('admin')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      createModalRole === 'admin'
                        ? 'bg-primary text-primary-on shadow-xs'
                        : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    Enterprise Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreateModalRole('super_admin')}
                    className={`py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      createModalRole === 'super_admin'
                        ? 'bg-primary text-primary-on shadow-xs'
                        : 'text-text-secondary hover:text-text'
                    }`}
                  >
                    SuperAdmin
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Registered Administrator Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="admin@enterprise-brand.com"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">Temporary Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="w-full py-3 rounded-xl text-xs font-bold bg-primary text-primary-on hover:brightness-110 active:scale-95 transition shadow-lg shadow-primary/20 disabled:opacity-60 cursor-pointer"
              >
                {isCreating ? 'Provisioning Account...' : `Provision ${createModalRole === 'super_admin' ? 'SuperAdmin' : 'Enterprise Admin'} Workspace`}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default SuperAdminPage;
