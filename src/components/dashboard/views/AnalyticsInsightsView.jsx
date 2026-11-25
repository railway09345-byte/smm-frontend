import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Sparkles,
  RefreshCw,
  Download,
  TrendingUp,
  Eye,
  Users,
  Share2,
  Heart,
  MessageSquare,
  MousePointer,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Layers,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Send,
  Wifi,
  WifiOff,
  Activity
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { api } from '../../../services/api';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

// Keep the dashboard close to live while avoiding a request on every render.
// The sync endpoint refreshes provider snapshots before the dashboard is read.
const POLL_INTERVAL_MS = 30 * 1000;

export function AnalyticsInsightsView({ contentItems = [], onPreviewItem, onNavigate }) {
  const { showToast } = useToast();
  const [metrics, setMetrics] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastPollAt, setLastPollAt] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const periodRef = useRef(period);
  const pollTimerRef = useRef(null);

  // Keep ref in sync so interval callback can read current period
  useEffect(() => { periodRef.current = period; }, [period]);

  // Silent background refresh (no loading spinner, no error toast spam)
  const silentRefresh = useCallback(async () => {
    try {
      const sync = await api.analytics.sync();
      const snapshot = periodRef.current === '30d' && sync?.metrics_snapshot
        ? sync.metrics_snapshot
        : await api.analytics.getDashboard({ period: periodRef.current });
      if (snapshot) {
        setMetrics(snapshot);
        setLastPollAt(new Date());
      }
    } catch (e) {
      // silent — only log, don't disturb the user on background polls
      console.warn('[Analytics] Background poll failed:', e.message);
    }
  }, []);

  const fetchMetrics = useCallback(async (selectedPeriod) => {
    setIsLoading(true);
    try {
      // Sync provider counters and read the dashboard in the same refresh cycle.
      await api.analytics.sync();
      const res = await api.analytics.getDashboard({ period: selectedPeriod });
      if (res) {
        setMetrics(res);
        setLastPollAt(new Date());
      }
    } catch (e) {
      console.error('Analytics fetch error:', e);
      showToast('Could not refresh analytics from backend.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial load + period change
  useEffect(() => {
    fetchMetrics(period);
  }, [fetchMetrics, period]);

  // Auto-polling every 30 seconds
  useEffect(() => {
    setIsPolling(true);
    pollTimerRef.current = setInterval(() => {
      silentRefresh();
    }, POLL_INTERVAL_MS);
    return () => {
      clearInterval(pollTimerRef.current);
      setIsPolling(false);
    };
  }, [silentRefresh]);

  // Refresh when the browser tab becomes visible again
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        silentRefresh();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [silentRefresh]);

  // Listen for post:published events dispatched by CreatePostView / ScheduledPostsView
  useEffect(() => {
    const handlePostPublished = async (evt) => {
      try {
        // Use the dedicated post-publish-sync endpoint (handles platform indexing delay server-side)
        const postId = evt?.detail?.postId || null;
        await api.analytics.postPublishSync(postId);
        await silentRefresh();
        showToast('Analytics refreshed — new publish metrics loaded!', 'success');
      } catch (e) {
        // Fallback to standard silent refresh if postPublishSync fails
        console.warn('[Analytics] Post-publish sync failed, falling back to silent refresh:', e.message);
        await silentRefresh();
      }
    };
    window.addEventListener('post:published', handlePostPublished);
    return () => window.removeEventListener('post:published', handlePostPublished);
  }, [silentRefresh, showToast]);

  // Other dashboard modules can announce a local engagement/publish change.
  // Refresh immediately instead of waiting for the next polling tick.
  useEffect(() => {
    const handleAnalyticsChange = () => silentRefresh();
    window.addEventListener('analytics:changed', handleAnalyticsChange);
    return () => window.removeEventListener('analytics:changed', handleAnalyticsChange);
  }, [silentRefresh]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await api.analytics.sync();
      showToast(`Synced ${res.accounts_synced} of ${res.total_connected} connected account(s)!`, 'success');
      await fetchMetrics(period);
      setLastPollAt(new Date());
    } catch (e) {
      showToast(`Sync error: ${e.message}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleExportCSV = () => {
    if (!metrics) {
      showToast('No data available to export.', 'info');
      return;
    }

    const rows = [
      ['Metric', 'Value', 'Formula / Notes'],
      ['Reporting Period', metrics.period, `${metrics.start_date} to ${metrics.end_date}`],
      ['Total Posts Created', metrics.total_posts_created, 'All workspace content & scheduled dispatches'],
      ['Posts Scheduled', metrics.posts_scheduled, 'Active posts currently queued'],
      ['Posts Published', metrics.posts_published, 'Confirmed published to social platform'],
      ['Posts Failed', metrics.posts_failed, 'Dispatches failed due to platform constraints'],
      ['Publication Success Rate', `${metrics.publication_success_rate}%`, metrics.success_rate_formula],
      ['Total Reach', metrics.total_reach, 'Unique accounts reached (verified API metrics)'],
      ['Total Impressions', metrics.total_impressions, 'Total impressions served across feeds'],
      ['Total Engagements', metrics.total_engagements, 'Combined likes, comments, shares, clicks'],
      ['Likes', metrics.likes, 'Verified user likes'],
      ['Comments', metrics.comments, 'Verified user comments'],
      ['Shares / Reposts', metrics.shares, 'Verified user shares'],
      ['Clicks', metrics.clicks, 'Link or profile clicks'],
      ['Average Engagement Rate', `${metrics.engagement_rate}%`, metrics.engagement_rate_formula],
      ['Connected Accounts', metrics.connected_accounts_count, metrics.status_message],
      ['Last Synchronization', metrics.last_synced_at || 'Never', 'ISO timestamp']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Social_AI_Analytics_${metrics.period}_Report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded verified Social AI analytics CSV report!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="ANALYTICS & METRICS" badgeIcon={BarChart3}
        title="Analytics & Publishing Performance" subtitle="Audited cross-platform metrics, real publication success rates, and audience engagement data." actions={
          <div className="flex items-center gap-3 flex-wrap">
            {/* Time Window Selector */}
            <div className="flex items-center gap-1 p-1 bg-bg backdrop-blur-md rounded-xl border border-border">
              {[
                { id: '7d', label: '7 Days' },
                { id: '30d', label: '30 Days' },
                { id: '90d', label: '90 Days' },
                { id: 'all', label: 'All Time' }
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => handlePeriodChange(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${period === p.id
                      ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text hover:bg-white/40'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface transition-all shadow-sm disabled:opacity-50" >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : (
                <Activity className="w-3.5 h-3.5" />
              )}
              {isSyncing ? 'Syncing...' : 'Sync Live'}
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-bold transition-all shadow-sm" >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* Real-time Status Bar */}
      <div className={`p-4 rounded-2xl border backdrop-blur-md flex flex-wrap items-center justify-between gap-3 text-xs ${metrics?.is_live_data
          ? 'bg-bg border-border/80 text-text' : 'bg-warning/10/70 border-warning/30/80 text-warning'}`}>
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${metrics?.is_live_data ? 'bg-primary/10' : 'bg-amber-400'}`} />
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${metrics?.is_live_data ? 'bg-primary' : 'bg-warning'}`} />
          </span>
          <div>
            <strong className="font-bold">
              {metrics?.status_message || (isLoading ? 'Synchronizing workspace database metrics...' : 'Checking data sources...')}
            </strong>
            <span className="text-text-muted ml-2">
              Range: <span className="font-medium text-text-secondary">{metrics?.start_date || '—'}</span> to <span className="font-medium text-text-secondary">{metrics?.end_date || '—'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          {/* Auto-poll indicator */}
          <div className="flex items-center gap-1.5 text-text-muted">
            <Wifi className="w-3 h-3 text-emerald-500" />
            <span>Live refresh: <strong className="text-text-secondary">every 30 sec</strong></span>
          </div>
          <div className="text-text-muted">
            Last updated: <strong className="text-text-secondary">
              {lastPollAt
                ? lastPollAt.toLocaleTimeString()
                : (metrics?.last_synced_at ? new Date(metrics.last_synced_at).toLocaleTimeString() : 'Never')}
            </strong>
          </div>
        </div>
      </div>

      {/* Core Publishing & Creation Stats Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-soft text-primary border border-border">
              Total Created
            </span>
            <span className="p-2 rounded-xl bg-primary text-primary-on border border-border shadow-xs">
              <Layers className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-text mt-3">
            {metrics?.total_posts_created ?? 0}
          </div>
          <div className="text-xs text-text-secondary font-medium mt-1">
            Database posts in this period
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-soft text-primary border border-border">
              Queued & Scheduled
            </span>
            <span className="p-2 rounded-xl bg-primary-soft text-primary border border-primary/30 shadow-xs">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-primary mt-3">
            {metrics?.posts_scheduled ?? 0}
          </div>
          <div className="text-xs text-text-secondary font-medium mt-1">
            Awaiting automated publication
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-primary-soft text-primary border border-border">
              Published Dispatches
            </span>
            <span className="p-2 rounded-xl bg-primary text-primary-on border border-border shadow-xs">
              <Send className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-primary mt-3">
            {metrics?.posts_published ?? 0}
          </div>
          <div className="text-xs text-text-secondary font-medium mt-1">
            {metrics?.posts_failed ? `${metrics.posts_failed} failed dispatches` : '0 failed dispatches'}
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              Success Rate
            </span>
            <span className="p-2 rounded-xl bg-emerald-600 text-white dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-3">
            {metrics?.publication_success_rate ?? 0}%
          </div>
          <div className="text-xs text-[#4A5070] dark:text-accent/80 font-medium mt-1" title={metrics?.success_rate_formula || ''}>
            Formula: published / (published + failed)
          </div>
        </SpotlightCard>
      </div>

      {/* Live Social Engagement & Reach Bento Card */}
      <SpotlightCard className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-text dark:text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              <span>Verified Social Reach & Audience Engagements</span>
            </h3>
            <p className="text-xs text-[#4A5070] dark:text-accent/70">
              Sourced directly from connected social APIs with explicit non-mocked data.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary/10 dark:bg-amber-400/20 text-primary dark:text-accent border border-border dark:border-border self-start sm:self-auto">
            {metrics?.connected_accounts_count ?? 0} Accounts Connected
          </span>
        </div>

        {/* 4 Metrics row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white/90 dark:bg-surface border border-border shadow-xs transition-colors">
            <span className="text-xs font-bold text-[#4A5070] dark:text-accent">Total Impressions</span>
            <div className="text-2xl font-black text-text dark:text-white my-1">
              {(metrics?.total_impressions ?? 0).toLocaleString()}
            </div>
            <span className="text-[11px] font-medium text-[#6B7194] dark:text-text-muted">Post feed views</span>
          </div>

          <div className="p-4 rounded-xl bg-white/90 dark:bg-surface border border-border shadow-xs transition-colors">
            <span className="text-xs font-bold text-[#4A5070] dark:text-accent">Audience Reach</span>
            <div className="text-2xl font-black text-text dark:text-white my-1">
              {(metrics?.total_reach ?? 0).toLocaleString()}
            </div>
            <span className="text-[11px] font-medium text-[#6B7194] dark:text-text-muted">Unique accounts</span>
          </div>

          <div className="p-4 rounded-xl bg-white/90 dark:bg-surface border border-border shadow-xs transition-colors">
            <span className="text-xs font-bold text-[#4A5070] dark:text-accent">Total Engagements</span>
            <div className="text-2xl font-black text-primary dark:text-accent my-1">
              {(metrics?.total_engagements ?? 0).toLocaleString()}
            </div>
            <span className="text-[11px] font-medium text-[#6B7194] dark:text-text-muted">Likes, comments, shares, clicks</span>
          </div>

          <div className="p-4 rounded-xl bg-white/90 dark:bg-surface border border-border shadow-xs transition-colors">
            <span className="text-xs font-bold text-[#4A5070] dark:text-accent">Avg. Engagement Rate</span>
            <div className="text-2xl font-black text-primary dark:text-accent my-1">
              {metrics?.engagement_rate ?? 0}%
            </div>
            <span className="text-[11px] font-medium text-[#6B7194] dark:text-text-muted" title={metrics?.engagement_rate_formula || ''}>
              (Engagements / Impressions) * 100
            </span>
          </div>
        </div>

        {/* Detailed Engagements Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {[
            { label: 'Likes', val: metrics?.likes ?? 0, icon: Heart, color: 'text-rose-500' },
            { label: 'Comments', val: metrics?.comments ?? 0, icon: MessageSquare, color: 'text-info' },
            { label: 'Shares', val: metrics?.shares ?? 0, icon: Share2, color: 'text-primary' },
            { label: 'Clicks', val: metrics?.clicks ?? 0, icon: MousePointer, color: 'text-primary' }
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="p-3 bg-white/90 dark:bg-surface rounded-xl border border-border flex items-center justify-between shadow-xs transition-colors">
                <div>
                  <span className="text-[11px] font-semibold text-[#4A5070] dark:text-accent/80">{item.label}</span>
                  <strong className="block text-base font-bold text-text dark:text-white">{item.val.toLocaleString()}</strong>
                </div>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </div>
            );
          })}
        </div>
      </SpotlightCard>

      {/* Grid: Platform & Content Format Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Real Platform Distribution */}
        <SpotlightCard className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text dark:text-white">Platform Distribution</h3>
            <p className="text-xs text-[#4A5070] dark:text-accent/70">
              Target channel allocation across {metrics?.total_posts_created ?? 0} posts.
            </p>
          </div>

          {!metrics?.platform_breakdown || metrics.platform_breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No posts found for this time range.
            </div>
          ) : (
            <div className="space-y-3.5">
              {metrics.platform_breakdown.map((item) => (
                <div key={item.platform} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text dark:text-white font-bold">{item.platform}</span>
                    <span className="text-primary">
                      <strong>{item.post_count}</strong> ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>

        {/* Real Content Format Breakdown */}
        <SpotlightCard className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text">Format Breakdown</h3>
            <p className="text-xs text-text-secondary">
              Ratio of video reels, static graphics, carousels, and text posts.
            </p>
          </div>

          {!metrics?.format_breakdown || metrics.format_breakdown.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No format data recorded yet.
            </div>
          ) : (
            <div className="space-y-3.5">
              {metrics.format_breakdown.map((item) => (
                <div key={item.format} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text font-bold">{item.format}</span>
                    <span className="text-primary">
                      <strong>{item.count}</strong> ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-surface rounded-full overflow-hidden border border-border">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      </div>

      {/* Connected Accounts & Daily Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connected Social Accounts List */}
        <SpotlightCard className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text">Connected Accounts</h3>
            <p className="text-xs text-text-muted">
              Status and synchronization status for active accounts.
            </p>
          </div>

          {!metrics?.accounts || metrics.accounts.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted space-y-2">
              <p>No social accounts connected to this workspace yet.</p>
              <Link
                to="/dashboard/social-accounts"
                onClick={(e) => {
                  if (typeof onNavigate === 'function') {
                    e.preventDefault();
                    onNavigate('social-accounts');
                  }
                }}
                className="inline-block px-4 py-2 rounded-xl bg-primary text-primary-on font-bold hover:bg-primary transition-colors"
              >
                Connect Social Account
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border shadow-xs hover:border-border transition-all" >
                  <div>
                    <strong className="text-xs font-bold text-text dark:text-white block">{acc.account_name}</strong>
                    <div className="text-[11px] font-medium text-primary">
                      {acc.platform} {acc.followers_count ? `• ${acc.followers_count.toLocaleString()} followers` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-xs ${acc.is_connected
                        ? 'bg-emerald-100 text-[#064e3b] dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800 border-emerald-300'
                        : 'bg-warning/20 text-[#78350f] dark:bg-warning/10 dark:text-accent dark:border-warning/30 border-warning/40'}`}>
                      {acc.is_connected ? 'Connected' : 'Disconnected'}
                    </span>
                    <div className="text-[10px] text-text-muted dark:text-text-secondary/70 mt-1">
                      {acc.last_synced_at ? `Synced ${new Date(acc.last_synced_at).toLocaleTimeString()}` : 'Not synced'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>

        {/* Top Recent Posts */}
        <SpotlightCard className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-text dark:text-white">Recent Publishing Activity</h3>
            <p className="text-xs text-[#4A5070] dark:text-accent/70">
              Latest dispatches processed by the autonomous scheduler.
            </p>
          </div>

          {!metrics?.top_posts || metrics.top_posts.length === 0 ? (
            <div className="py-12 text-center text-xs text-text-muted">
              No dispatches found in this time window.
            </div>
          ) : (
            <div className="space-y-2.5">
              {metrics.top_posts.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface border border-border gap-3 shadow-xs hover:border-border transition-all" >
                  <div className="min-w-0 flex-1">
                    <strong className="text-xs font-bold text-text dark:text-white truncate block">
                      {p.title || p.caption || `Dispatch #${p.id}`}
                    </strong>
                    <div className="text-[11px] font-medium text-primary">
                      {p.platform} • {p.published_time ? `Published ${new Date(p.published_time).toLocaleDateString()}` : `Scheduled ${new Date(p.scheduled_time).toLocaleDateString()}`}
                    </div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-xs ${p.status === 'published'
                      ? 'bg-primary-soft text-primary border-primary/30'
                      : p.status === 'failed'
                        ? 'bg-rose-100 text-[#7f1d1d] border-rose-300'
                        : 'bg-emerald-100 text-[#064e3b] border-emerald-300'}`}>
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      </div>
    </div>
  );
}
