import React, { useState, useEffect } from 'react';
import { X, Check, Bell, CheckCircle2, AlertTriangle, AlertCircle, Info, CheckCheck, Loader2, Trash2, ExternalLink } from 'lucide-react';
import { MediaArtwork } from '../ui/MediaArtwork';
import { useToast } from '../common/Toast';
import { api } from '../../services/api';
import { storage, STORAGE_KEYS } from '../../utils/storage';

export function DashboardModals({
  previewModalItem,
  setPreviewModalItem,
  editModalItem,
  setEditModalItem,
  scheduleModalItem,
  setScheduleModalItem,
  feedbackModal,
  setFeedbackModal,
  campaignModalOpen,
  setCampaignModalOpen,
  videoPlayerItem,
  setVideoPlayerItem,
  imageViewItem,
  setImageViewItem,
  inviteModalOpen,
  setInviteModalOpen,
  searchModalOpen,
  setSearchModalOpen,
  notificationsOpen,
  setNotificationsOpen,
  contentItems,
  saveContentItem,
  approveItem,
  rejectItem,
  requestChanges,
  scheduleItem,
  publishItem,
  cancelSchedule,
  createCampaign,
  onNavigate
}) {
  const { showToast } = useToast();

  // Real notifications state
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationsError, setNotificationsError] = useState(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  const fetchRealNotifications = async () => {
    setLoadingNotifications(true);
    setNotificationsError(null);
    try {
      const res = await api.notifications.getAll({ limit: 50 });
      setNotificationsList(res?.items || []);
    } catch (err) {
      setNotificationsError(err?.message || 'Failed to load notifications.');
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (notificationsOpen) {
      fetchRealNotifications();
    }
  }, [notificationsOpen]);

  const handleMarkAsRead = async (notification) => {
    if (!notification) return;
    if (!notification.is_read) {
      try {
        await api.notifications.markAsRead(notification.id);
        setNotificationsList((prev) =>
          prev.map((item) => (item.id === notification.id ? { ...item, is_read: true } : item))
        );
        window.dispatchEvent(new CustomEvent('notifications:updated'));
      } catch {
        // ignore
      }
    }
    if (notification.link && onNavigate) {
      setNotificationsOpen(false);
      const targetView = notification.link.replace(/^\/dashboard\/?/, '');
      if (targetView) onNavigate(targetView);
    }
  };

  const handleMarkAllRead = async () => {
    if (markingAllRead) return;
    setMarkingAllRead(true);
    try {
      await api.notifications.markAllAsRead();
      setNotificationsList((prev) => prev.map((item) => ({ ...item, is_read: true })));
      window.dispatchEvent(new CustomEvent('notifications:updated'));
      showToast?.('All notifications marked as read', 'success');
    } catch {
      showToast?.('Failed to mark all as read', 'error');
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = async (id, e) => {
    e?.stopPropagation();
    try {
      await api.notifications.delete(id);
      setNotificationsList((prev) => prev.filter((item) => item.id !== id));
      window.dispatchEvent(new CustomEvent('notifications:updated'));
    } catch {
      // ignore
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`);
      const now = new Date();
      const diffSec = Math.floor((now - date) / 1000);
      if (diffSec < 45) return 'Just now';
      if (diffSec < 3600) return `${Math.max(1, Math.floor(diffSec / 60))}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // Schedule modal state
  const [scheduleDate, setScheduleDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [scheduleTime, setScheduleTime] = useState('18:00');
  const [selectedChannelIds, setSelectedChannelIds] = useState([]);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  useEffect(() => {
    api.socialAccounts.list().then((accounts) => {
      if (Array.isArray(accounts) && accounts.length > 0) {
        setConnectedAccounts(accounts);
        const activeIds = accounts.filter((a) => a.is_connected).map((a) => a.id);
        setSelectedChannelIds(activeIds.length > 0 ? activeIds : accounts.map((a) => a.id));
      }
    }).catch(() => {});
  }, [scheduleModalItem]);

  // Campaign modal state
  const [newCampName, setNewCampName] = useState('');
  const [newCampObj, setNewCampObj] = useState('Casual wear promotion');
  const [newCampStart, setNewCampStart] = useState('2026-10-15');
  const [newCampEnd, setNewCampEnd] = useState('2026-11-05');
  const [newCampPlat, setNewCampPlat] = useState('Instagram & Facebook');

  // Invite modal state
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Content Reviewer');

  // Search modal state
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirmSchedule = async () => {
    if (!scheduleModalItem) return;
    if (selectedChannelIds.length === 0) {
      showToast('Please select at least one connected social account to schedule publishing.', 'warning');
      return;
    }
    const ok = await scheduleItem(scheduleModalItem.id, scheduleDate, scheduleTime, selectedChannelIds);
    if (ok !== false) {
      setScheduleModalItem(null);
    }
  };

  const handleCreateCampaign = () => {
    if (!newCampName.trim()) {
      showToast('Please enter a campaign name.', 'error');
      return;
    }
    createCampaign({
      id: 'camp-' + Date.now(),
      name: newCampName,
      objective: newCampObj,
      startDate: newCampStart,
      endDate: newCampEnd,
      platforms: newCampPlat,
      status: 'Active',
      totalItems: 4,
      approvedItems: 2,
      scheduledItems: 1
    });
    setCampaignModalOpen(false);
    setNewCampName('');
    showToast('Campaign successfully launched!', 'success');
  };

  const handleSendInvite = (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('Please enter an email address.', 'error');
      return;
    }
    const currentUser = storage.get(STORAGE_KEYS.user, {});
    const adminKey = currentUser.id || currentUser.email || 'current_admin';
    const storageKey = `sacp_team_members_${adminKey}`;
    const existing = storage.get(storageKey, []);

    const roleLabels = {
      'Store Content Approver': { role: 'Social Media Lead', auth: 'Review, Request Changes & Approve' },
      'Lead Merchandiser': { role: 'Visual Merchandiser', auth: 'Full Governance & Brand Directives' },
      'Creative Assistant': { role: 'Content Creator', auth: 'Studio Drafts Only, No Publishing Authority' }
    };
    const roleMeta = roleLabels[inviteRole] || { role: inviteRole, auth: 'Studio Drafts & Caption Editing Only' };

    const newMember = {
      id: `invited-${Date.now()}`,
      name: inviteName.trim() || inviteEmail.split('@')[0],
      email: inviteEmail.trim(),
      role: roleMeta.role,
      authority: roleMeta.auth,
      status: 'Active',
      invitedBy: adminKey,
      invitedAt: new Date().toISOString()
    };

    const updated = [...existing.filter((m) => m.email?.toLowerCase() !== newMember.email.toLowerCase()), newMember];
    storage.set(storageKey, updated);
    window.dispatchEvent(new CustomEvent('team_member_added', { detail: newMember }));

    showToast(`Team member "${newMember.name}" added and invitation sent to ${inviteEmail}!`, 'success');
    setInviteModalOpen(false);
    setInviteName('');
    setInviteEmail('');
  };

  const filteredSearchResults = searchQuery.trim()
    ? contentItems.filter((item) => {
        const q = searchQuery.toLowerCase();
        return (
          (item.title || '').toLowerCase().includes(q) ||
          (item.caption || '').toLowerCase().includes(q) ||
          (item.platform || '').toLowerCase().includes(q) ||
          (item.format || '').toLowerCase().includes(q)
        );
      })
    : contentItems.slice(0, 4);

  return (
    <>
      {/* 1. PREVIEW MODAL */}
      {previewModalItem && (
        <div className="modal-backdrop" onClick={() => setPreviewModalItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge badge--accent">{previewModalItem.platform}</span>
                  <span className="badge">{previewModalItem.format}</span>
                  <span className="badge badge--success">Strict Governance</span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '6px' }}>{previewModalItem.title}</h3>
              </div>
              <button className="btn--ghost" onClick={() => setPreviewModalItem(null)} style={{ fontSize: '1.2rem' }}><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div className="content-card__preview" style={{ height: '240px', marginBottom: '16px' }}>
              <MediaArtwork item={previewModalItem} />
            </div>

            <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', padding: '14px', borderRadius: 'var(--radius-md)', fontSize: '0.88rem', whiteSpace: 'pre-line', lineHeight: 1.5, marginBottom: '14px' }}>
              {previewModalItem.caption}
            </div>

            <div style={{ fontSize: '0.8rem', color: 'var(--accent-text)', fontWeight: 600, marginBottom: '8px' }}>
              {previewModalItem.hashtags}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
              CTA: <em>"{previewModalItem.cta}"</em>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border)', paddingTop: '14px', flexWrap: 'wrap' }}>
              <button className="btn btn--secondary" onClick={() => setPreviewModalItem(null)}>Close</button>
              
              {previewModalItem.status !== 'approved' && previewModalItem.status !== 'scheduled' && previewModalItem.status !== 'published' && (
                <button
                  className="btn btn--success" onClick={() => {
                    approveItem(previewModalItem.id);
                    setPreviewModalItem(null);
                  }}
                ><Check className="w-4 h-4 inline-block mr-1" />Approve Post
                </button>
              )}

              {previewModalItem.status === 'approved' && (
                <>
                  <button
                    className="btn btn--primary" onClick={() => {
                      setScheduleModalItem(previewModalItem);
                      setPreviewModalItem(null);
                    }}
                  >
                    Schedule Post →
                  </button>
                  <button
                    className="btn btn--success" onClick={() => {
                      publishItem(previewModalItem.id);
                      setPreviewModalItem(null);
                    }}
                  >
                    Auto-Post Now
                  </button>
                </>
              )}

              {previewModalItem.status === 'scheduled' && (
                <button
                  className="btn btn--success" onClick={() => {
                    publishItem(previewModalItem.id);
                    setPreviewModalItem(null);
                  }}
                >
                  Auto-Post Now (Publish)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. EDIT MODAL */}
      {editModalItem && (
        <div className="modal-backdrop" onClick={() => setEditModalItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Edit Post Copy</h3>
              <button className="btn--ghost" onClick={() => setEditModalItem(null)}><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div className="field">
              <label className="label">Headline / Title</label>
              <input
                className="input" value={editModalItem.title || ''}
                onChange={(e) => setEditModalItem({ ...editModalItem, title: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Caption</label>
              <textarea
                className="textarea" style={{ height: '120px' }}
                value={editModalItem.caption || ''}
                onChange={(e) => setEditModalItem({ ...editModalItem, caption: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Hashtags</label>
              <input
                className="input" value={editModalItem.hashtags || ''}
                onChange={(e) => setEditModalItem({ ...editModalItem, hashtags: e.target.value })}
              />
            </div>

            <div className="field">
              <label className="label">Call to Action (CTA)</label>
              <input
                className="input" value={editModalItem.cta || ''}
                onChange={(e) => setEditModalItem({ ...editModalItem, cta: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn--secondary" onClick={() => setEditModalItem(null)}>Cancel</button>
              <button
                className="btn btn--primary" onClick={() => {
                  saveContentItem(editModalItem);
                  setEditModalItem(null);
                  showToast('Post modifications saved!', 'success');
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. SCHEDULE MODAL */}
      {scheduleModalItem && (
        <div className="modal-backdrop" onClick={() => setScheduleModalItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <span className="badge badge--success">Ready to Schedule & Auto-Post</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '4px' }}>Schedule Social Media Post</h3>
              </div>
              <button className="btn--ghost" onClick={() => setScheduleModalItem(null)}><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div style={{ background: 'var(--surface-elevated)', border: '1px solid var(--border)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
              <strong style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{scheduleModalItem.title}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Platform: {scheduleModalItem.platform} • Format: {scheduleModalItem.format}
              </div>
            </div>

            <div className="field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="label" style={{ margin: 0 }}>Target Social Channels ({selectedChannelIds.length} Selected)</label>
                {connectedAccounts.length > 0 && (
                  <button
                    type="button" className="btn btn--ghost btn--sm" style={{ fontSize: '0.75rem', padding: '2px 8px' }}
                    onClick={() => {
                      if (selectedChannelIds.length === connectedAccounts.length) {
                        setSelectedChannelIds([]);
                      } else {
                        setSelectedChannelIds(connectedAccounts.map((a) => a.id));
                      }
                    }}
                  >
                    {selectedChannelIds.length === connectedAccounts.length ? 'Deselect All' : 'Select All Channels'}
                  </button>
                )}
              </div>

              {connectedAccounts.length === 0 ? (
                <div style={{ padding: '12px', background: 'var(--bg)', borderRadius: '8px', border: '1px dashed var(--border)', fontSize: '0.82rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  No connected social accounts found. Go to <strong>Social Accounts</strong> tab to connect your channels.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px' }}>
                  {connectedAccounts.map((acc) => {
                    const isSelected = selectedChannelIds.includes(acc.id);
                    const platKey = (acc.platform || '').toLowerCase();
                    const platColor = {
                      instagram: '#E1306C',
                      facebook: '#1877F2',
                      youtube: '#FF0000',
                      pinterest: '#E60023'
                    }[platKey] || 'var(--primary)';

                    return (
                      <label
                        key={acc.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          borderRadius: '6px',
                          background: isSelected ? '#f0fdf4' : '#ffffff',
                          border: isSelected ? '1px solid #86efac' : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease' }}
                      >
                        <input
                          type="checkbox" checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannelIds((prev) => [...prev, acc.id]);
                            } else {
                              setSelectedChannelIds((prev) => prev.filter((id) => id !== acc.id));
                            }
                          }}
                          style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: platColor,
                            color: '#ffffff',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase' }}
                        >
                          {acc.platform}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: '0.84rem', color: 'var(--text)' }}>{acc.account_name}</strong>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: acc.is_connected ? '#16a34a' : '#ef4444', fontWeight: 600 }}>
                          {acc.is_connected ? 'Connected' : 'Offline'}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {selectedChannelIds.length > 0 && (
                <div style={{ fontSize: '0.75rem', color: '#16a34a', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span><Check className="w-4 h-4 inline-block" /></span> Will simultaneously publish to {selectedChannelIds.length} selected accounts at the scheduled time!
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="field">
                <label className="label">Publishing Date</label>
                <input type="date" className="input" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
              </div>

              <div className="field">
                <label className="label">Publishing Time (IST)</label>
                <input type="time" className="input" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px', flexWrap: 'wrap' }}>
              <button className="btn btn--secondary" onClick={() => setScheduleModalItem(null)}>Cancel</button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn--success" onClick={() => {
                    publishItem(scheduleModalItem.id, selectedChannelIds.length > 0 ? selectedChannelIds : null);
                    setScheduleModalItem(null);
                  }}
                >
                  Auto-Post Now
                </button>
                <button className="btn btn--primary" onClick={handleConfirmSchedule}>
                  Confirm & Schedule
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. FEEDBACK / REVISION MODAL */}
      {feedbackModal?.isOpen && (
        <div className="modal-backdrop" onClick={() => setFeedbackModal({ isOpen: false, id: null, type: 'reject', notes: '' })}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              {feedbackModal.type === 'reject' ? 'Reject Content Item' : 'Request Revisions'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Provide guidance or feedback for this creative asset:
            </p>

            <textarea
              className="textarea" placeholder="E.g., Please change the opening hook or focus on festive lookbooks for Chennai shoppers..." value={feedbackModal.notes || ''}
              onChange={(e) => setFeedbackModal({ ...feedbackModal, notes: e.target.value })}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn--secondary" onClick={() => setFeedbackModal({ isOpen: false, id: null, type: 'reject', notes: '' })}>
                Cancel
              </button>
              <button
                className={`btn ${feedbackModal.type === 'reject' ? 'btn--danger' : 'btn--primary'}`}
                onClick={() => {
                  if (feedbackModal.type === 'reject') {
                    rejectItem(feedbackModal.id, feedbackModal.notes);
                  } else {
                    requestChanges(feedbackModal.id, feedbackModal.notes);
                  }
                  setFeedbackModal({ isOpen: false, id: null, type: 'reject', notes: '' });
                }}
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. CREATE CAMPAIGN MODAL */}
      {campaignModalOpen && (
        <div className="modal-backdrop" onClick={() => setCampaignModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '14px' }}>+ Create Marketing Campaign</h3>

            <div className="field">
              <label className="label">Campaign Name</label>
              <input
                className="input" placeholder="E.g., Festive Linen & Formal Suits Drop" value={newCampName}
                onChange={(e) => setNewCampName(e.target.value)}
              />
            </div>

            <div className="field">
              <label className="label">Campaign Objective</label>
              <input
                className="input" value={newCampObj}
                onChange={(e) => setNewCampObj(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="field">
                <label className="label">Start Date</label>
                <input type="date" className="input" value={newCampStart} onChange={(e) => setNewCampStart(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">End Date</label>
                <input type="date" className="input" value={newCampEnd} onChange={(e) => setNewCampEnd(e.target.value)} />
              </div>
            </div>

            <div className="field">
              <label className="label">Target Social Channels</label>
              <input
                className="input" value={newCampPlat}
                onChange={(e) => setNewCampPlat(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button className="btn btn--secondary" onClick={() => setCampaignModalOpen(false)}>Cancel</button>
              <button className="btn btn--primary" onClick={handleCreateCampaign}>Create Campaign</button>
            </div>
          </div>
        </div>
      )}

      {/* 6. VIDEO PLAYER MODAL */}
      {videoPlayerItem && (
        <div className="modal-backdrop" onClick={() => setVideoPlayerItem(null)}>
          <div className="modal" style={{ maxWidth: '440px', background: 'var(--text)', color: '#ffffff' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '0.95rem' }}>{videoPlayerItem.title}</strong>
              <button className="btn--ghost" style={{ color: '#fff' }} onClick={() => setVideoPlayerItem(null)}><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div style={{ height: '380px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px' }}>
              <MediaArtwork item={videoPlayerItem} />
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--border)', lineHeight: 1.4, marginBottom: '14px' }}>
              {videoPlayerItem.caption}
            </div>

            <button className="btn btn--primary" style={{ width: '100%' }} onClick={() => setVideoPlayerItem(null)}>
              Close Video Player
            </button>
          </div>
        </div>
      )}

      {/* 7. IMAGE VIEW MODAL */}
      {imageViewItem && (
        <div className="modal-backdrop" onClick={() => setImageViewItem(null)}>
          <div className="modal" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ fontSize: '1rem' }}>{imageViewItem.title}</strong>
              <button className="btn--ghost" onClick={() => setImageViewItem(null)}><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div style={{ height: '320px', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '14px' }}>
              <MediaArtwork item={imageViewItem} />
            </div>

            <button className="btn btn--secondary" style={{ width: '100%' }} onClick={() => setImageViewItem(null)}>
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* 8. INVITE MEMBER MODAL */}
      {inviteModalOpen && (
        <div className="modal-backdrop" onClick={() => setInviteModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>+ Invite Workspace Team Member</h3>
              <button className="btn--ghost" onClick={() => setInviteModalOpen(false)}><X className="w-4 h-4 inline-block" /></button>
            </div>

            <form onSubmit={handleSendInvite}>
              <div className="field">
                <label className="label">Full Name</label>
                <input
                  className="input" placeholder="E.g., Alex Morgan" value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="label">Email Address</label>
                <input
                  type="email" className="input" placeholder="colleague@yourcompany.com" value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label className="label">Role & Approval Authority</label>
                <select className="select" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="Store Content Approver">Store Content Approver (Review, Approve & Schedule)</option>
                  <option value="Lead Merchandiser">Lead Merchandiser (Full Governance & Brand Directives)</option>
                  <option value="Creative Assistant">Creative Assistant (Studio Drafts Only, No Publishing Authority)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setInviteModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn--primary">Send Invitation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. GLOBAL SEARCH MODAL (Ctrl + K) */}
      {searchModalOpen && (
        <div className="modal-backdrop" onClick={() => setSearchModalOpen(false)}>
          <div className="modal" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '14px' }}>
              <span style={{ fontSize: '1.2rem' }}></span>
              <input
                autoFocus
                type="text" placeholder="Type to search content, navigate pages, or query AI..." value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  flex: 1,
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  color: 'var(--text)' }}
              />
              <button className="btn--ghost" onClick={() => setSearchModalOpen(false)}><X className="w-4 h-4 inline-block" /></button>
            </div>

            {/* Quick Navigation suggestions */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Quick Jump to View
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'ai-planner', label: 'AI Content Planner' },
                  { id: 'content-studio', label: 'Content Studio' },
                  { id: 'approval-queue', label: 'Approval Queue' },
                  { id: 'content-calendar', label: 'Content Calendar' },
                  { id: 'brand-profile', label: 'Brand Profile' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      setSearchModalOpen(false);
                    }}
                    className="btn btn--secondary btn--sm" style={{ fontSize: '0.78rem' }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Matching Content Items */}
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-faint)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Content Results ({filteredSearchResults.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                {filteredSearchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setPreviewModalItem(item);
                      setSearchModalOpen(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      gap: '12px' }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ fontSize: '0.86rem', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.title}
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.platform} • {item.format} • {item.status}
                      </span>
                    </div>
                    <span className="badge badge--accent">Review →</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 10. REAL-TIME NOTIFICATIONS POPUP */}
      {notificationsOpen && (
        <div className="modal-backdrop" onClick={() => setNotificationsOpen(false)}>
          <div
            className="modal"
            style={{ maxWidth: '480px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center text-primary">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }} className="text-text">
                      Notifications & Alerts
                    </h3>
                    {notificationsList.filter((n) => !n.is_read).length > 0 && (
                      <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-primary text-on-primary">
                        {notificationsList.filter((n) => !n.is_read).length} new
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {notificationsList.some((n) => !n.is_read) && (
                  <button
                    onClick={handleMarkAllRead}
                    disabled={markingAllRead}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg text-primary hover:bg-primary-soft transition-colors flex items-center gap-1"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  className="btn--ghost text-text-muted hover:text-text-secondary dark:hover:text-zinc-200"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>
              {loadingNotifications ? (
                <div className="py-12 flex flex-col items-center justify-center text-text-muted dark:text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin text-primary dark:text-accent mb-2" />
                  <p className="text-xs">Loading real-time notifications...</p>
                </div>
              ) : notificationsError ? (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex flex-col items-center text-center gap-2">
                  <p>{notificationsError}</p>
                  <button
                    onClick={fetchRealNotifications}
                    className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-500 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : notificationsList.length === 0 ? (
                <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-surface-selected dark:bg-zinc-800/80 flex items-center justify-center text-text-muted dark:text-zinc-500 mb-3">
                    <Bell className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="text-sm font-semibold text-text dark:text-zinc-200 mb-1">
                    All caught up!
                  </h4>
                  <p className="text-xs text-text-muted dark:text-zinc-400 max-w-xs leading-relaxed">
                    No active notifications. Real-time updates for AI generations, scheduled publishing, and account events will appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {notificationsList.map((item) => {
                    const isUnread = !item.is_read;
                    const isError = item.severity === 'error';
                    const isSuccess = item.severity === 'success';
                    const isWarning = item.severity === 'warning';

                    return (
                      <div
                        key={item.id}
                        onClick={() => handleMarkAsRead(item)}
                        className={`group relative p-3 rounded-xl border transition-all cursor-pointer flex gap-3 items-start ${
                          isUnread
                            ? 'bg-primary-soft/30 border-primary/30 shadow-xs'
                            : 'bg-surface border-border hover:border-border'
                        }`}
                      >
                        {/* Severity Icon */}
                        <div className="mt-0.5 flex-shrink-0">
                          {isSuccess ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                          ) : isError ? (
                            <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          ) : isWarning ? (
                            <AlertTriangle className="w-4 h-4 text-warning" />
                          ) : (
                            <Info className="w-4 h-4 text-info" />
                          )}
                        </div>

                        {/* Text Content */}
                        <div className="flex-1 min-w-0 pr-6">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <span
                              className={`text-xs font-bold truncate ${
                                isUnread
                                  ? 'text-text'
                                  : 'text-text-secondary'
                              }`}
                            >
                              {item.title}
                            </span>
                            <span className="text-[10px] text-text-muted whitespace-nowrap flex-shrink-0">
                              {formatTimeAgo(item.created_at)}
                            </span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-3">
                            {item.message}
                          </p>
                          {item.link && (
                            <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                              <span>View details</span>
                              <ExternalLink className="w-3 h-3" />
                            </div>
                          )}
                        </div>

                        {/* Top-Right Action Controls */}
                        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                          {isUnread && (
                            <span
                              className="w-2 h-2 rounded-full bg-primary flex-shrink-0"
                              title="Unread"
                            />
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteNotification(item.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-rose-500 dark:hover:text-rose-400 rounded transition-opacity"
                            title="Delete notification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
              <span className="text-[11px] text-text-muted dark:text-zinc-500">
                {notificationsList.length > 0
                  ? `${notificationsList.length} total event${notificationsList.length === 1 ? '' : 's'}`
                  : 'Real-time sync'}
              </span>
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => setNotificationsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
