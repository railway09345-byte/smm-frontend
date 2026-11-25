import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';
import { useToast } from '../../common/Toast';
import { EditPostModal } from '../EditPostModal';
import { PostMediaThumbnail } from '../../common/PostMediaThumbnail';
import { parseUtcToLocalParts } from '../../../utils/datetime';
import { useDebounce } from '../../../hooks/useDebounce';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Calendar,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Rocket,
  RotateCw,
  Ban,
  Clock,
  Sparkles,
  Globe,
  X
} from 'lucide-react';

const STATUS_TABS = [
  { id: 'all', label: 'All Posts' },
  { id: 'scheduled', label: 'Scheduled' },
  { id: 'published', label: 'Published' },
  { id: 'failed', label: 'Failed' },
  { id: 'draft', label: 'Drafts' },
  { id: 'cancelled', label: 'Cancelled' }
];

export function ScheduledPostsView({ defaultStatusFilter = 'all', onNavigate, isEmbedded = false }) {
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(defaultStatusFilter);
  const [platformFilter, setPlatformFilter] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 250);

  // Modals state
  const [detailsPost, setDetailsPost] = useState(null);
  const [selectedEditPostId, setSelectedEditPostId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setActiveTab(defaultStatusFilter);
  }, [defaultStatusFilter]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;
      if (platformFilter !== 'all') params.platform = platformFilter;
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

      const data = await api.scheduler.listPosts(params);
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load posts:', err);
      showToast('Error loading posts: ' + (err.message || 'Server error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [activeTab, platformFilter, debouncedSearch]);

  const handlePublishNow = async (post) => {
    setSubmitting(true);
    try {
      showToast(`Publishing post #${post.id} to ${post.platform}...`, 'info');
      const res = await api.scheduler.publishNow(post.id);
      if (res.success) {
        showToast('Successfully published live!', 'success');
      } else {
        showToast(`Publishing failed: ${res.error || 'Check channel credentials'}`, 'error');
      }
      fetchPosts();
    } catch (err) {
      showToast('Error: ' + (err.message || 'Publish failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = async (post) => {
    setSubmitting(true);
    try {
      showToast(`Retrying publishing for post #${post.id}...`, 'info');
      const res = await api.scheduler.retryPost(post.id);
      if (res.success) {
        showToast('Retried successfully! Post is now published.', 'success');
      } else {
        showToast(`Retry failed: ${res.error || 'Error'}`, 'error');
      }
      fetchPosts();
    } catch (err) {
      showToast('Error retrying post: ' + err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (postId) => {
    try {
      await api.scheduler.cancelPost(postId);
      showToast('Post cancelled.', 'success');
      fetchPosts();
    } catch (err) {
      showToast('Failed to cancel: ' + err.message, 'error');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.scheduler.deletePost(postId);
      showToast('Post deleted.', 'success');
      fetchPosts();
    } catch (err) {
      showToast('Failed to delete: ' + err.message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    switch (s) {
      case 'published':
        return <span style={{ background: '#dcfce7', color: '#15803d', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Published</span>;
      case 'scheduled':
        return <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Scheduled</span>;
      case 'publishing':
        return <span style={{ background: '#fef3c7', color: '#b45309', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Publishing...</span>;
      case 'failed':
        return <span style={{ background: '#fee2e2', color: '#b91c1c', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Failed</span>;
      case 'draft':
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Draft</span>;
      case 'cancelled':
        return <span style={{ background: '#f3f4f6', color: '#9ca3af', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>Cancelled</span>;
      default:
        return <span style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700 }}>{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (when standalone) */}
      {!isEmbedded && (
        <DashboardPageHeader
          badge="Queue & History" badgeColor="indigo" title="Scheduled & Published Posts" subtitle="Monitor real-time post queue, track publishing outcomes, reschedule, and retry failed channel transmissions." actions={
            <button
              onClick={() => onNavigate && onNavigate('content-studio')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 active:scale-95 text-text shadow-md shadow-amber-400/20 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Post</span>
            </button>
          }
        />
      )}

      {/* Bento Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-amber-400 text-text font-bold shadow-sm shadow-amber-400/20'
                  : 'text-text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <SpotlightCard className="p-4 border-border">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[220px] max-w-sm">
              <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search posts by title or caption..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-border bg-surface text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-warning/30"
              />
            </div>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-border bg-surface text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400/30"
            >
              <option value="all">All Platforms</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <div className="text-xs font-semibold text-text-muted self-end sm:self-center">
            {posts.length} {posts.length === 1 ? 'post' : 'posts'}
          </div>
        </div>
      </SpotlightCard>

      {/* Posts Table / List */}
      {loading ? (
        <SpotlightCard className="p-16 text-center border-border">
          <div className="w-8 h-8 border-2 border-warning/30 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-medium text-text-muted">Loading posts...</p>
        </SpotlightCard>
      ) : posts.length === 0 ? (
        <SpotlightCard className="p-16 text-center border-dashed border-2 border-border">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-warning border border-warning/30 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Posts Found</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
            There are no {activeTab !== 'all' ? activeTab : ''} posts matching your current filter.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('content-studio')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:brightness-110 active:scale-95 text-text text-xs font-bold shadow-md shadow-amber-400/20"
          >
            Create a Post Now
          </button>
        </SpotlightCard>
      ) : (
        <SpotlightCard className="overflow-hidden p-0 border-border">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[680px]">
              <thead>
                <tr className="bg-surface/80 border-b border-border text-text-muted font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4 w-16">Media</th>
                  <th className="py-3 px-4">Title & Caption</th>
                  <th className="py-3 px-4 w-32">Platform</th>
                  <th className="py-3 px-4 w-40">Scheduled For</th>
                  <th className="py-3 px-4 w-28">Status</th>
                  <th className="py-3 px-4 w-44 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/[0.03] transition-colors">
                    <td className="py-3 px-4">
                      <PostMediaThumbnail
                        url={post.media_asset?.file_url || post.media_url}
                        title={post.title}
                        className="w-12 h-12 rounded-xl"
                        isVideo={post.media_asset?.media_type === 'video'}
                      />
                    </td>

                    {/* Title & Caption */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-white mb-0.5 flex items-center gap-2">
                        <span>{post.title || 'Untitled Post'}</span>
                        {post.schedule_rule_name && (
                          <span className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] font-semibold text-text-muted border border-white/10">
                            Rule: {post.schedule_rule_name}
                          </span>
                        )}
                      </div>
                      <p className="text-text-muted text-[11px] line-clamp-2 leading-relaxed">
                        {post.caption || 'No caption'}
                      </p>
                      {post.error_message && (
                        <p className="text-rose-500 text-[11px] font-semibold mt-1">
                          Error: {post.error_message}
                        </p>
                      )}
                    </td>

                    {/* Platform */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-text capitalize">
                        {post.platform}
                      </div>
                      <div className="text-[11px] text-text-muted">
                        {post.social_account_name || 'Channel'}
                      </div>
                    </td>

                    {/* Scheduled For & Timezone */}
                    <td className="py-3 px-4">
                      {(() => {
                        const parts = parseUtcToLocalParts(post.scheduled_time, post.timezone);
                        return (
                          <div>
                            <div className="font-semibold text-text">
                              {parts.formattedDate}
                            </div>
                            <div className="text-[11px] text-text-muted">
                              {parts.formattedTime}
                            </div>
                            <div className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-medium mt-1">
                              <Globe className="w-2.5 h-2.5" />
                              <span>{post.timezone || 'Asia/Kolkata'}</span>
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(post.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setDetailsPost(post)}
                          className="p-1 rounded-lg border border-border hover:bg-surface text-text-secondary" title="View Details" >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          id={`edit-post-btn-${post.id}`}
                          onClick={() => setSelectedEditPostId(post.id)}
                          className="p-1 rounded-lg border border-border hover:bg-surface text-text-secondary" title="Edit Post (Media, Content, Schedule)" >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {post.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handlePublishNow(post)}
                              className="px-2 py-1 rounded-lg bg-primary hover:bg-primary-hover text-on-primary text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1" title="Publish Now Immediately" disabled={submitting}
                            >
                              <Rocket className="w-3 h-3" />
                              <span>Publish</span>
                            </button>
                            <button
                              onClick={() => handleCancel(post.id)}
                              className="p-1 rounded-lg border border-border hover:bg-warning/10 text-warning" title="Cancel Scheduled Post" >
                              <Ban className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        {post.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(post)}
                            className="px-2 py-1 rounded-lg bg-warning hover:bg-amber-600 text-white text-[11px] font-semibold transition-all shadow-xs flex items-center gap-1" title="Retry Publishing" disabled={submitting}
                          >
                            <RotateCw className="w-3 h-3" />
                            <span>Retry</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-1 rounded-lg border border-border hover:bg-rose-50 text-rose-500" title="Delete Post" >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      )}

      {/* DETAILS MODAL */}
      {detailsPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="text-base font-bold text-text">Post Details #{detailsPost.id}</h3>
              <button
                className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg" onClick={() => setDetailsPost(null)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              {(detailsPost.media_asset?.file_url || detailsPost.media_url) && (
                <PostMediaThumbnail
                  url={detailsPost.media_asset?.file_url || detailsPost.media_url}
                  title={detailsPost.title}
                  className="w-20 h-20 rounded-xl"
                  isVideo={detailsPost.media_asset?.media_type === 'video'}
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-text truncate mb-1">
                  {detailsPost.title || 'Untitled Post'}
                </h4>
                <div className="text-xs text-text-muted mb-1">
                  Platform: <strong className="text-text-secondary capitalize">{detailsPost.platform}</strong> ({detailsPost.social_account_name || 'Account'})
                </div>
                <div>{getStatusBadge(detailsPost.status)}</div>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-text-secondary mb-1">Caption</label>
              <div className="bg-surface p-3 rounded-xl border border-border text-xs text-text whitespace-pre-line max-h-40 overflow-y-auto leading-relaxed">
                {detailsPost.caption || 'No caption'}
              </div>
            </div>

            {detailsPost.error_message && (
              <div className="mb-4 bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-700">
                <strong>Publishing Error:</strong>
                <p className="mt-0.5">{detailsPost.error_message}</p>
              </div>
            )}

            {detailsPost.platform_post_id && (
              <div className="mb-4 bg-bg border border-border p-2.5 rounded-xl text-xs text-primary">
                <strong>Live Platform ID:</strong> {detailsPost.platform_post_id}
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-border">
              <button
                className="px-4 py-1.5 rounded-xl bg-surface hover:bg-surface-selected border border-border text-text text-xs font-semibold cursor-pointer" onClick={() => setDetailsPost(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT POST MODAL */}
      {selectedEditPostId && (
        <EditPostModal
          postId={selectedEditPostId}
          onClose={() => setSelectedEditPostId(null)}
          onSaved={() => {
            setSelectedEditPostId(null);
            fetchPosts();
          }}
        />
      )}
    </div>
  );
}
