import React, { useState } from 'react';
import { MediaArtwork } from '../../ui/MediaArtwork';
import { useToast } from '../../common/Toast';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  CheckCircle2,
  Check,
  Clock,
  Send,
  Edit3,
  Eye,
  Calendar,
  XCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  X,
  MoreHorizontal,
  Trash2,
  Copy
} from 'lucide-react';

export function ApprovalQueueView({
  contentItems,
  approveItem,
  publishItem,
  onPreviewItem,
  onEditStudioItem,
  onScheduleItem,
  onFeedback,
  onCancelSchedule,
  deleteItem
}) {
  const { showToast } = useToast();
  const [approvalTab, setApprovalTab] = useState('all');
  const [openMenuId, setOpenMenuId] = useState(null);

  const filteredItems = contentItems.filter((item) => {
    if (approvalTab !== 'all' && item.status !== approvalTab) return false;
    return true;
  });

  const handleBatchApprove = () => {
    const awaitingItems = contentItems.filter((i) => i.status === 'awaiting');
    if (awaitingItems.length === 0) {
      showToast('No pending items awaiting approval.', 'info');
      return;
    }
    awaitingItems.forEach((i) => approveItem(i.id));
    showToast(`Batch approved ${awaitingItems.length} creatives for calendar queue!`, 'success');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'awaiting':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/15 text-warning border border-warning/30">Awaiting Review</span>;
      case 'approved':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"><Check className="w-3.5 h-3.5 inline-block mr-1" />Approved</span>;
      case 'scheduled':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">Scheduled</span>;
      case 'published':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">Live Published</span>;
      case 'rejected':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-500/15 text-rose-300 border border-rose-500/30"><X className="w-3.5 h-3.5 inline-block mr-1" />Rejected</span>;
      case 'changes_requested':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/15 text-warning border border-warning/30">Changes Requested</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface text-text-muted border border-border">{status}</span>;
    }
  };

  return (
    <div className="space-y-6" onClick={() => setOpenMenuId(null)}>
      {/* Header */}
      <DashboardPageHeader
        badge="Governance & Verification"
        badgeColor="indigo"
        title="Approval Queue & Governance Hub"
        subtitle="Enforcing approval-first publishing. Only content reviewed and signed off by the merchant can enter the scheduling queue."
        actions={
          <button
            onClick={handleBatchApprove}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-text shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Batch Approve All Pending</span>
          </button>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
        {[
          { id: 'all', label: `All (${contentItems.length})` },
          { id: 'awaiting', label: `Awaiting (${contentItems.filter((i) => i.status === 'awaiting').length})` },
          { id: 'approved', label: `Approved (${contentItems.filter((i) => i.status === 'approved').length})` },
          { id: 'scheduled', label: `Scheduled (${contentItems.filter((i) => i.status === 'scheduled').length})` },
          { id: 'published', label: `Published (${contentItems.filter((i) => i.status === 'published').length})` },
          { id: 'changes_requested', label: `Changes (${contentItems.filter((i) => i.status === 'changes_requested').length})` },
          { id: 'rejected', label: `Rejected (${contentItems.filter((i) => i.status === 'rejected').length})` }
        ].map((tab) => (
          <button
            key={tab.id}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              approvalTab === tab.id
                ? 'bg-amber-400 text-text font-bold shadow-sm shadow-amber-500/20'
                : 'text-text-muted hover:text-white hover:bg-surface/60'
            }`}
            onClick={() => setApprovalTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <SpotlightCard className="p-16 text-center border-dashed border-2 border-border bg-surface/50">
          <div className="w-12 h-12 rounded-2xl bg-warning/10 text-warning border border-warning/30 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">Queue is Clear</h3>
          <p className="text-xs text-text-muted max-w-sm mx-auto">
            No items currently matching the selected approval status filter.
          </p>
        </SpotlightCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <SpotlightCard
              key={item.id}
              className="p-5 flex flex-col justify-between border-border"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-surface text-text-muted border border-border">
                    {item.platform}
                  </span>
                  {getStatusBadge(item.status)}
                </div>

                <div
                  className="relative rounded-xl overflow-hidden bg-surface mb-3 cursor-pointer group border border-border"
                  onClick={() => onPreviewItem(item)}
                >
                  <MediaArtwork item={item} />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/75 text-white backdrop-blur-md border border-white/10">
                    {item.format}
                  </span>
                  {item.contentType === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-sm font-bold text-white mb-1 line-clamp-1">
                  {item.title}
                </h3>
                <p className="text-xs text-text-muted line-clamp-2 leading-relaxed mb-3">
                  {item.caption}
                </p>

                {item.hashtags && (
                  <div className="text-[11px] font-semibold text-warning/90 mb-2 truncate">
                    {item.hashtags}
                  </div>
                )}
                {item.cta && (
                  <div className="text-[11px] text-text-muted">
                    CTA: <em className="text-text-muted font-medium">"{item.cta}"</em>
                  </div>
                )}

                {item.status === 'published' && (
                  <div className="mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Live on {item.platform}: Published on {item.publishedDate || item.scheduledDate || 'Today'}</span>
                  </div>
                )}

                {item.status === 'scheduled' && (
                  <div className="mt-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Auto-post queued: {item.scheduledDate} at {item.scheduledTime}</span>
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="pt-3 border-t border-border mt-4 space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    className="flex-1 py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    onClick={() => onPreviewItem(item)}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    className="flex-1 py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-slate-700/80 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                    onClick={() => onEditStudioItem(item.id)}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit in Studio</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {item.status !== 'approved' && item.status !== 'scheduled' && item.status !== 'published' ? (
                    <>
                      <button
                        className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-text font-bold text-xs shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1"
                        onClick={() => approveItem(item.id)}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        className="py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-warning/20 text-warning text-xs font-semibold"
                        onClick={() => onFeedback(item.id, 'changes')}
                      >
                        Revise
                      </button>
                      <button
                        className="py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold"
                        onClick={() => onFeedback(item.id, 'reject')}
                      >
                        Reject
                      </button>
                    </>
                  ) : null}

                  {item.status === 'approved' && (
                    <>
                      <button
                        className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1"
                        onClick={() => onScheduleItem(item)}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Schedule Post</span>
                      </button>
                      <button
                        className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-text font-bold text-xs shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1"
                        onClick={() => publishItem(item.id)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Now</span>
                      </button>
                    </>
                  )}

                  {item.status === 'scheduled' && (
                    <>
                      <button
                        className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-text font-bold text-xs shadow-sm shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-1"
                        onClick={() => publishItem(item.id)}
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Post Now</span>
                      </button>
                      <button
                        className="py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                        onClick={() => onScheduleItem(item)}
                      >
                        Reschedule
                      </button>
                      <button
                        className="py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold"
                        onClick={() => onCancelSchedule(item.id)}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {item.status === 'published' && (
                    <button
                      className="w-full py-1.5 px-3 rounded-xl border border-border bg-surface/80 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5"
                      onClick={() => showToast(`Opening live simulated post on ${item.platform}...`, 'info')}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>View Live on {item.platform}</span>
                    </button>
                  )}

                  {/* More Options Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      title="More Options"
                      className="p-1.5 rounded-xl border border-border bg-surface/80 hover:bg-slate-700 text-text-muted transition-colors flex items-center justify-center"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === item.id ? null : item.id);
                      }}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenuId === item.id && (
                      <div
                        className="absolute right-0 bottom-full mb-2 w-48 bg-surface/95 backdrop-blur-md rounded-xl shadow-2xl border border-border py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-surface hover:text-white flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            onScheduleItem(item);
                          }}
                        >
                          <Calendar className="w-3.5 h-3.5 text-warning" />
                          <span>{item.status === 'scheduled' ? 'Reschedule Post' : 'Schedule Post'}</span>
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-surface hover:text-white flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            onPreviewItem(item);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 text-text-muted" />
                          <span>Full Preview</span>
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-surface hover:text-white flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            onEditStudioItem(item.id);
                          }}
                        >
                          <Edit3 className="w-3.5 h-3.5 text-text-muted" />
                          <span>Edit in Studio</span>
                        </button>
                        <button
                          type="button"
                          className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-surface hover:text-white flex items-center gap-2"
                          onClick={() => {
                            setOpenMenuId(null);
                            const text = `${item.title || ''}\n\n${item.caption || ''}\n\n${item.hashtags || ''}`;
                            navigator.clipboard?.writeText(text);
                            showToast('Post caption copied to clipboard!', 'success');
                          }}
                        >
                          <Copy className="w-3.5 h-3.5 text-text-muted" />
                          <span>Copy Caption</span>
                        </button>
                        {deleteItem && (
                          <div className="border-t border-border mt-1 pt-1">
                            <button
                              type="button"
                              className="w-full text-left px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                              onClick={() => {
                                setOpenMenuId(null);
                                deleteItem(item.id);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                              <span>Delete Post</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          ))}
        </div>
      )}
    </div>
  );
}
