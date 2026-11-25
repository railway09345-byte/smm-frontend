import React, { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Sparkles,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  Globe,
  Radio,
  Calendar,
  Trash2,
  Plus,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Image as ImageIcon
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { api } from '../../../services/api';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  if (diffMs > 0) {
    if (diffMin < 60) return `in ${Math.max(1, diffMin)}m`;
    if (diffHour < 24) return `in ${diffHour}h`;
    return `in ${diffDay}d`;
  } else {
    const absMin = Math.abs(diffMin);
    const absHour = Math.abs(diffHour);
    const absDay = Math.abs(diffDay);
    if (absMin < 1) return 'just now';
    if (absMin < 60) return `${absMin}m ago`;
    if (absHour < 24) return `${absHour}h ago`;
    return `${absDay}d ago`;
  }
}

import { ContentCalendarView } from './ContentCalendarView';
import { ScheduledPostsView } from './ScheduledPostsView';

export function PublishingSchedulerView({
  contentItems = [],
  publishItem,
  onScheduleItem,
  onCancelSchedule,
  onNavigate,
  initialSubView = 'queue'
}) {
  const { showToast } = useToast();

  const [activeSchedulerTab, setActiveSchedulerTab] = useState(initialSubView || 'queue');

  useEffect(() => {
    if (initialSubView) {
      setActiveSchedulerTab(initialSubView);
    }
  }, [initialSubView]);

  const [liveQueue, setLiveQueue] = useState([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [queueTab, setQueueTab] = useState('all'); // 'all' | 'scheduled' | 'published' | 'failed'

  // Optimal slots & connected accounts state (realtime from backend)
  const [optimalChannels, setOptimalChannels] = useState([]);
  const [isLoadingOptimal, setIsLoadingOptimal] = useState(false);

  // Per-item action state tracking
  const [actionInProgress, setActionInProgress] = useState({});

  // Quick schedule post modal
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);

  const refreshAll = useCallback(async () => {
    setIsLoadingQueue(true);
    try {
      const [queueData, optimalRes] = await Promise.all([
        api.scheduler.getQueue().catch(() => []),
        api.scheduler.getOptimalSlots('instagram', 4).catch(() => null)
      ]);

      setLiveQueue(Array.isArray(queueData) ? queueData : []);
      if (optimalRes && Array.isArray(optimalRes.channels)) {
        setOptimalChannels(optimalRes.channels);
      }
      setLastSyncTime(new Date());
    } catch (err) {
      console.warn('Real-time sync error:', err);
    } finally {
      setIsLoadingQueue(false);
      setIsLoadingOptimal(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
    // Real-time bidirectional polling every 5 seconds
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const setItemAction = (id, action) => {
    setActionInProgress((prev) => ({ ...prev, [id]: action }));
  };

  const clearItemAction = (id) => {
    setActionInProgress((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  // Real-time Instant Publish
  const handlePublishNow = async (item) => {
    setItemAction(item.id, 'publishing');
    showToast(`Dispatching post #${item.id} to ${item.platform || 'channel'}...`, 'info');
    try {
      const res = await api.scheduler.publishNow(item.id);
      if (res?.status === 'published') {
        showToast(`Published successfully to ${item.platform}!`, 'success');
      } else if (res?.status === 'failed') {
        showToast(`Publishing failed: ${res.error_message || 'Platform rejected post'}`, 'error');
      } else {
        showToast('Publish request submitted.', 'success');
      }
      await refreshAll();
    } catch (err) {
      showToast(`Publishing error: ${err.message}`, 'error');
    } finally {
      clearItemAction(item.id);
    }
  };

  // Real-time Retry Failed Post
  const handleRetryPublish = async (item) => {
    setItemAction(item.id, 'retrying');
    showToast(`Retrying dispatch for post #${item.id}...`, 'info');
    try {
      const res = await api.scheduler.retryPost(item.id);
      if (res?.status === 'published') {
        showToast(`Retry successful! Post is live on ${item.platform}.`, 'success');
      } else if (res?.status === 'failed') {
        showToast(`Retry failed: ${res.error_message || 'Platform error'}`, 'error');
      } else {
        showToast('Post queued for immediate retry.', 'info');
      }
      await refreshAll();
    } catch (err) {
      showToast(`Retry failed: ${err.message}`, 'error');
    } finally {
      clearItemAction(item.id);
    }
  };

  // Real-time Cancel Scheduled Post
  const handleCancelSchedule = async (item) => {
    setItemAction(item.id, 'cancelling');
    try {
      await api.scheduler.cancelPost(item.id);
      if (onCancelSchedule && item.content_id) {
        await onCancelSchedule(item.content_id);
      }
      showToast('Scheduled post cancelled and returned to Approved pool.', 'info');
      await refreshAll();
    } catch (err) {
      showToast(`Cancel failed: ${err.message}`, 'error');
    } finally {
      clearItemAction(item.id);
    }
  };

  // Real-time Delete Post from queue
  const handleDeletePost = async (item) => {
    if (!window.confirm('Remove this record from the scheduler queue?')) return;
    setItemAction(item.id, 'deleting');
    try {
      await api.scheduler.deletePost(item.id);
      showToast('Removed from queue.', 'info');
      await refreshAll();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    } finally {
      clearItemAction(item.id);
    }
  };

  const optimalTimes = [
    { channel: 'Instagram Feed & Reels', slot1: '12:30 PM IST', slot2: '7:15 PM IST (Peak Footfall)', badge: 'Highest Reach', color: '#E1306C' },
    { channel: 'Facebook Store Page', slot1: '1:00 PM IST', slot2: '8:00 PM IST', badge: 'Weekend High', color: '#1877F2' },
    { channel: 'YouTube Shorts', slot1: '6:00 PM IST', slot2: '9:30 PM IST', badge: 'High Retention', color: '#FF0000' },
    { channel: 'Pinterest Idea Pins', slot1: '2:00 PM IST', slot2: '8:30 PM IST', badge: 'High Saves', color: '#E60023' }
  ];

  const filteredQueue = liveQueue.filter((item) => {
    if (queueTab === 'scheduled') return item.status === 'scheduled';
    if (queueTab === 'published') return item.status === 'published';
    if (queueTab === 'failed') return item.status === 'failed';
    return true;
  });

  const scheduledCount = liveQueue.filter((i) => i.status === 'scheduled').length;
  const publishedCount = liveQueue.filter((i) => i.status === 'published').length;
  const failedCount = liveQueue.filter((i) => i.status === 'failed').length;

  const approvedContentItems = contentItems.filter(
    (c) => c.status === 'approved' || c.approvalStatus === 'approved' || c.status === 'generated'
  );

  return (
    <div className="space-y-6 animate-slide-up">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="3. REVIEW, PUBLISH & OPTIMIZE"
        badgeIcon={Sparkles}
        title="Publishing & Scheduler"
        subtitle="Live automated dispatch engine across Instagram, Facebook, YouTube, and X with real-time API feedback."
        actions={
          <div className="flex items-center gap-2.5">
            {/* Live Sync Status indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-surface/80 border border-border text-xs font-semibold text-text-secondary dark:text-rose-100 shadow-xs backdrop-blur-xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Live Sync</span>
              {lastSyncTime && (
                <span className="text-[11px] text-text-muted dark:text-rose-300/60 font-normal">
                  ({lastSyncTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                </span>
              )}
            </div>

            <button
              onClick={refreshAll}
              disabled={isLoadingQueue}
              className="btn-smooth flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/90 dark:bg-surface/90 backdrop-blur-xl border border-border text-xs font-bold text-text dark:text-rose-100 hover:bg-surface dark:hover:bg-surface-selected shadow-xs disabled:opacity-50"
              title="Force immediate queue and timing sync with database"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingQueue ? 'animate-spin text-primary dark:text-rose-400' : ''}`} />
              <span className="hidden sm:inline">{isLoadingQueue ? 'Syncing...' : 'Sync Queue'}</span>
            </button>

            {onScheduleItem && (
              <button
                onClick={() => setShowSchedulePicker(true)}
                className="btn-smooth flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-md shadow-sm-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] border border-border/20"
              >
                <Plus className="w-3.5 h-3.5 text-accent" />
                <span>Schedule Post</span>
              </button>
            )}
          </div>
        }
      />

      {/* ── Sub-view Tabs (Queue / Calendar / Posts Table) ── */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface border border-border w-fit flex-wrap">
        <button
          type="button"
          onClick={() => setActiveSchedulerTab('queue')}
          className={`btn-smooth flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeSchedulerTab === 'queue'
              ? 'bg-primary text-primary-on shadow-sm'
              : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
            }`}
        >
          <Clock className="w-4 h-4" />
          <span>Dispatch Queue & Timing</span>
          {liveQueue.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 dark:bg-black/20">
              {liveQueue.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSchedulerTab('calendar')}
          className={`btn-smooth flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeSchedulerTab === 'calendar'
              ? 'bg-primary text-primary-on shadow-sm'
              : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Interactive Calendar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSchedulerTab('posts-table')}
          className={`btn-smooth flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${activeSchedulerTab === 'posts-table'
              ? 'bg-primary text-primary-on shadow-sm'
              : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
            }`}
        >
          <Send className="w-4 h-4" />
          <span>Posts & History Table</span>
        </button>
      </div>

      {activeSchedulerTab === 'calendar' ? (
        <ContentCalendarView onNavigate={onNavigate} isEmbedded={true} />
      ) : activeSchedulerTab === 'posts-table' ? (
        <ScheduledPostsView onNavigate={onNavigate} isEmbedded={true} defaultStatusFilter="all" />
      ) : (
        /* Grid: Active Dispatches & Pacing */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Scheduled Posts (7 cols) */}
          <div className="lg:col-span-7">
            <SpotlightCard className="p-0 overflow-hidden card-smooth">
              <div className="p-5 border-b border-border dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/40 dark:bg-transparent">
                <div>
                  <h3 className="text-sm font-bold text-text dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary dark:text-rose-400" />
                    Dispatch Queue ({liveQueue.length})
                  </h3>
                  <span className="text-[11px] text-text-muted dark:text-text-muted font-medium">Timezone: Asia/Kolkata (IST)</span>
                </div>

                {/* Status pills */}
                <div className="flex items-center gap-1 p-1 bg-bg dark:bg-white/[0.04] rounded-xl text-xs border border-border">
                  <button
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${queueTab === 'all'
                        ? 'bg-surface text-primary shadow-xs border border-border'
                        : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
                      }`}
                    onClick={() => setQueueTab('all')}
                  >
                    All ({liveQueue.length})
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${queueTab === 'scheduled'
                        ? 'bg-surface text-primary shadow-xs border border-border'
                        : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
                      }`}
                    onClick={() => setQueueTab('scheduled')}
                  >
                    Armed ({scheduledCount})
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${queueTab === 'published'
                        ? 'bg-surface text-primary shadow-xs border border-border'
                        : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
                      }`}
                    onClick={() => setQueueTab('published')}
                  >
                    Live ({publishedCount})
                  </button>
                  <button
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${queueTab === 'failed'
                        ? 'bg-surface text-rose-600 dark:text-rose-300 shadow-xs border border-border'
                        : 'text-text-secondary dark:text-text-muted hover:text-text dark:hover:text-white'
                      }`}
                    onClick={() => setQueueTab('failed')}
                  >
                    Failed ({failedCount})
                  </button>
                </div>
              </div>

              {filteredQueue.length === 0 ? (
                <div className="py-16 text-center space-y-3 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-surface dark:bg-white/[0.04] border border-border flex items-center justify-center mx-auto text-text-muted dark:text-rose-300/50">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text dark:text-white">No items in this queue category</h4>
                    <p className="text-xs text-text-muted dark:text-text-muted max-w-xs mx-auto mt-1">
                      Approve and schedule posts from the Approval Queue to target connected channels.
                    </p>
                  </div>
                  {onScheduleItem && approvedContentItems.length > 0 && (
                    <button
                      onClick={() => setShowSchedulePicker(true)}
                      className="btn-smooth inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-primary-on text-xs font-bold hover:bg-primary transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Schedule an Approved Post ({approvedContentItems.length} available)
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-3 max-h-[580px] overflow-y-auto">
                  {filteredQueue.map((item) => {
                    const platKey = (item.platform || '').toLowerCase();
                    const platColor =
                      {
                        instagram: '#E1306C',
                        facebook: '#1877F2',
                        youtube: '#FF0000',
                        pinterest: '#E60023',
                        twitter: '#0f172a',
                        snapchat: '#0E7490',
                        linkedin: '#0077b5'
                      }[platKey] || 'var(--primary)';

                    const isPublished = item.status === 'published';
                    const isFailed = item.status === 'failed';
                    const isScheduled = item.status === 'scheduled';
                    const isCancelled = item.status === 'cancelled';
                    const errDetail = item.error_message || item.publish_metadata?.error || item.publish_metadata?.api_error;
                    const currentAction = actionInProgress[item.id];
                    const mediaPreview = item.thumbnail_url || item.media_url;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border text-xs space-y-3 card-smooth ${isPublished
                            ? 'bg-bg border-border opacity-85'
                            : isFailed
                              ? 'bg-error/10 border-error/30'
                              : isCancelled
                                ? 'bg-surface-selected border-border opacity-75'
                                : 'bg-surface border-border hover:border-primary/40 shadow-xs'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {mediaPreview ? (
                              <div className="w-12 h-12 rounded-lg overflow-hidden border border-border flex-shrink-0 bg-surface-selected dark:bg-surface">
                                <img
                                  src={mediaPreview}
                                  alt="Post media"
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="w-12 h-12 rounded-lg border border-border flex-shrink-0 bg-surface dark:bg-white/[0.04] flex items-center justify-center text-text-muted dark:text-rose-300/50">
                                <ImageIcon className="w-5 h-5" />
                              </div>
                            )}

                            <div>
                              <h4 className="text-sm font-bold text-text dark:text-white line-clamp-1">
                                {item.content_title || `Post #${item.content_id}`}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className="px-2 py-0.5 rounded text-[10px] font-black text-white uppercase tracking-wider"
                                  style={{ backgroundColor: platColor }}
                                >
                                  {item.platform || 'Social'}
                                </span>
                                <span className="text-text-muted dark:text-text-muted font-medium">
                                  {item.account_name ? `@${item.account_name}` : `Account #${item.social_account_id || 'All'}`}
                                </span>
                                {item.brand_name && (
                                  <span className="text-text-muted dark:text-rose-300/40 text-[10px]">
                                    • {item.brand_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${isPublished
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-850/50'
                                  : isFailed
                                    ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                                    : isCancelled
                                      ? 'bg-surface-selected dark:bg-white/10 text-text-secondary dark:text-text-muted border-border'
                                      : 'bg-primary-soft text-primary border-primary/20'
                                }`}
                            >
                              {isPublished ? 'Published' : isFailed ? 'Failed' : isCancelled ? 'Cancelled' : 'Armed'}
                            </span>

                            {(isCancelled || isFailed || isPublished) && (
                              <button
                                onClick={() => handleDeletePost(item)}
                                disabled={Boolean(currentAction)}
                                title="Delete from queue"
                                className="p-1 rounded-md text-text-muted dark:text-rose-300/60 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Scheduled or Published Timestamp */}
                        <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface dark:bg-white/[0.04] border border-border text-text-secondary dark:text-rose-100">
                          <span className="text-text-muted dark:text-text-muted flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-text-muted dark:text-rose-300/60" />
                            {isPublished ? 'Dispatched At:' : 'Scheduled Time:'}
                          </span>
                          <div className="text-right">
                            <strong className="text-text dark:text-white">
                              {item.scheduled_time
                                ? new Date(item.scheduled_time).toLocaleString('en-IN', {
                                  timeZone: 'Asia/Kolkata',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                                : 'Immediate'}
                            </strong>
                            {item.scheduled_time && (
                              <span className="text-[10px] text-text-muted dark:text-text-muted block">
                                ({formatRelativeTime(item.scheduled_time)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Live Published indicator */}
                        {isPublished && (
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                            <span>Live on {item.platform || 'channel'}!</span>
                            {item.platform_post_id && (
                              <span className="font-mono text-text-secondary dark:text-text-muted bg-white/80 dark:bg-white/10 px-1 py-0.5 rounded ml-auto text-[10px]">
                                ID: {item.platform_post_id}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Failure / Error diagnosis */}
                        {isFailed && errDetail && (
                          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-lg text-rose-800 dark:text-text-muted space-y-1.5">
                            <div className="font-bold text-rose-900 dark:text-rose-100 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                              Platform Error Response
                            </div>
                            <div className="font-mono text-[11px] bg-white/70 dark:bg-surface/70 p-1.5 rounded border border-rose-200/60 dark:border-rose-900/40 break-all text-text-secondary dark:text-text-muted">
                              {errDetail}
                            </div>
                            {platKey === 'youtube' && String(errDetail).toLowerCase().includes('video') && (
                              <div className="text-[11px] text-primary font-semibold">
                                Note: YouTube requires video files (.mp4/.mov). Attach a video before publishing.
                              </div>
                            )}
                            {platKey === 'facebook' && String(errDetail).toLowerCase().includes('token') && (
                              <div className="text-[11px] text-primary font-semibold">
                                Note: Facebook Page token expired. Reconnect in Social Accounts tab.
                              </div>
                            )}
                            {platKey === 'twitter' && String(errDetail).toLowerCase().includes('auth') && (
                              <div className="text-[11px] text-primary font-semibold">
                                Note: Twitter API v2 requires OAuth User Context with tweet.write scope.
                              </div>
                            )}
                          </div>
                        )}

                        {/* Real-time Action buttons */}
                        <div className="flex items-center gap-2 pt-1">
                          {isScheduled && (
                            <>
                              <button
                                disabled={Boolean(currentAction)}
                                className="btn-smooth flex-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                onClick={() => handlePublishNow(item)}
                              >
                                <Send className={`w-3 h-3 ${currentAction === 'publishing' ? 'animate-spin' : ''}`} />
                                {currentAction === 'publishing' ? 'Publishing Live...' : 'Publish Now'}
                              </button>
                              <button
                                disabled={Boolean(currentAction)}
                                className="btn-smooth py-1.5 px-3 rounded-lg bg-surface-selected dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-300 text-text-secondary dark:text-text-muted font-bold text-xs transition-colors disabled:opacity-50 border border-border"
                                onClick={() => handleCancelSchedule(item)}
                              >
                                {currentAction === 'cancelling' ? 'Cancelling...' : 'Cancel Schedule'}
                              </button>
                            </>
                          )}

                          {isFailed && (
                            <button
                              disabled={Boolean(currentAction)}
                              className="btn-smooth flex-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                              onClick={() => handleRetryPublish(item)}
                            >
                              <RefreshCw className={`w-3 h-3 ${currentAction === 'retrying' ? 'animate-spin' : ''}`} />
                              {currentAction === 'retrying' ? 'Retrying Dispatch...' : 'Retry Publish'}
                            </button>
                          )}

                          {isCancelled && (
                            <button
                              disabled={Boolean(currentAction)}
                              className="btn-smooth flex-1 py-1.5 px-3 rounded-lg bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                              onClick={() => handlePublishNow(item)}
                            >
                              <Send className="w-3 h-3" />
                              Re-arm & Publish
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SpotlightCard>
          </div>

          {/* Real-time Optimal Posting Windows (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <SpotlightCard className="p-6 space-y-4 card-smooth">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-text dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-warning animate-pulse" />
                    Optimal Publishing Windows
                  </h3>
                  <p className="text-xs text-text-muted dark:text-text-muted">Live AI heatmap calculated from connected channels</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning/20 dark:bg-warning/10 text-warning dark:text-accent border border-warning/30 dark:border-warning/30 flex items-center gap-1">
                  <Radio className="w-2.5 h-2.5 animate-pulse" />
                  Live Heatmap
                </span>
              </div>

              <div className="space-y-3">
                {isLoadingOptimal && optimalChannels.length === 0 ? (
                  <div className="py-8 text-center text-xs text-text-muted dark:text-rose-300/50">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-primary dark:text-rose-400" />
                    Fetching live channel heatmap...
                  </div>
                ) : optimalChannels.length > 0 ? (
                  optimalChannels.map((opt, idx) => {
                    const isArmed = opt.has_scheduled && opt.armed_post;
                    const armed = opt.armed_post;

                    return (
                      <div
                        key={idx}
                        className={`p-3.5 rounded-xl border card-smooth space-y-2.5 text-xs ${isArmed
                            ? 'bg-surface-raised border-success/40 ring-1 ring-success/30 shadow-xs'
                            : 'bg-surface border-border hover:border-primary/30'
                          }`}
                      >
                        {/* Channel Header */}
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-text flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color || 'var(--primary)' }} />
                            {opt.channel}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {opt.is_connected ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {opt.account_name ? `@${opt.account_name}` : 'Connected'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-selected dark:bg-white/5 text-text-muted dark:text-text-muted border border-border">
                                Not Linked
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white dark:bg-white/10 text-primary border border-border dark:border-white/10">
                              {opt.badge}
                            </span>
                          </div>
                        </div>

                        {/* If a post is currently scheduled for this channel */}
                        {isArmed && (
                          <div className="p-2.5 rounded-lg bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/50 flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Armed Post Scheduled
                              </div>
                              <div className="font-bold text-xs text-emerald-950 dark:text-white truncate mt-0.5" title={armed.title}>
                                {armed.title}
                              </div>
                              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                <span>{armed.scheduled_time_display}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handlePublishNow({ id: armed.id, platform: opt.platform })}
                              disabled={Boolean(actionInProgress[armed.id])}
                              className="btn-smooth px-2.5 py-1 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[10px] flex-shrink-0 transition-colors shadow-xs disabled:opacity-50 mt-0.5"
                            >
                              {actionInProgress[armed.id] === 'publishing' ? 'Publishing...' : 'Publish Now'}
                            </button>
                          </div>
                        )}

                        {/* Timing Windows */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
                          <div
                            className={`p-2 rounded-lg border ${opt.slot1_status === 'booked'
                                ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-950 dark:text-emerald-100'
                                : 'bg-white dark:bg-white/[0.04] border-border text-text-secondary dark:text-rose-100'
                              }`}
                          >
                            <div className="text-[10px] font-medium flex items-center justify-between">
                              <span className={opt.slot1_status === 'booked' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-text-muted dark:text-text-muted'}>
                                {opt.slot1_label || 'Optimal Window 1'}
                              </span>
                              {opt.slot1_status === 'booked' && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold">
                                  Booked
                                </span>
                              )}
                            </div>
                            <div className="font-semibold mt-0.5 text-text dark:text-white">
                              {opt.slot1}
                            </div>
                          </div>

                          <div className="bg-white dark:bg-white/[0.04] p-2 rounded-lg border border-border">
                            <div className="text-text-muted dark:text-text-muted text-[10px] font-medium">
                              {opt.slot2_label || 'Optimal Window 2'}
                            </div>
                            <div className="font-semibold text-primary mt-0.5">
                              {opt.slot2}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-xs text-text-muted dark:text-text-muted bg-surface dark:bg-white/[0.03] rounded-xl border border-border">
                    Connect social channels to compute real-time engagement windows.
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-bg dark:bg-white/[0.04] border border-border dark:border-white/5 text-text-secondary dark:text-rose-100 text-xs leading-relaxed flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-text dark:text-white">Simultaneous Multi-Platform Engine:</strong> Real-time dispatches trigger concurrently across all configured channels at the designated timestamp with automatic platform retries.
                </div>
              </div>
            </SpotlightCard>
          </div>
        </div>
      )}

      {/* ── QUICK SCHEDULE PICKER MODAL ── */}
      {showSchedulePicker && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-surface rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-border dark:border-border animate-slide-up text-text dark:text-white">
            <div className="flex items-center justify-between border-b border-border dark:border-white/10 pb-3">
              <div>
                <h3 className="text-base font-bold text-text dark:text-white">Select Content to Schedule</h3>
                <p className="text-xs text-text-muted dark:text-text-muted">Choose from approved brand posts ready for publication</p>
              </div>
              <button
                onClick={() => setShowSchedulePicker(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary dark:hover:text-white hover:bg-surface-selected dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {approvedContentItems.length === 0 ? (
                <div className="text-center py-8 text-text-muted dark:text-rose-300/50 text-xs">
                  No approved posts available. Approve generated items in the Approval Queue first.
                </div>
              ) : (
                approvedContentItems.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setShowSchedulePicker(false);
                      if (onScheduleItem) onScheduleItem(c);
                    }}
                    className="p-3 rounded-xl border border-border hover:border-primary/40 dark:hover:border-rose-400/40 hover:bg-surface dark:hover:bg-white/[0.04] cursor-pointer transition-all flex items-center justify-between group card-smooth"
                  >
                    <div className="flex items-center gap-3">
                      {(c.mediaUrl || c.thumbnailUrl) ? (
                        <img
                          src={c.thumbnailUrl || c.mediaUrl}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover border border-border bg-surface-selected dark:bg-surface flex-shrink-0"
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-surface dark:bg-white/[0.04] border border-border flex items-center justify-center text-text-muted dark:text-rose-300/50 flex-shrink-0">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold text-text dark:text-white group-hover:text-primary dark:group-hover:text-accent transition-colors line-clamp-1">
                          {c.title || c.headline || `Content #${c.id}`}
                        </h4>
                        <div className="text-[11px] text-text-muted dark:text-text-muted">
                          {c.platform || 'Multi-Platform'} • {c.format || 'Post'}
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-muted dark:text-rose-300/40 group-hover:text-primary dark:group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-border dark:border-white/10">
              <button
                onClick={() => setShowSchedulePicker(false)}
                className="btn-smooth px-4 py-2 rounded-xl text-xs font-bold text-text-secondary dark:text-text-muted hover:bg-surface-selected dark:hover:bg-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
