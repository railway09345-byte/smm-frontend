import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../common/Toast';
import { MediaPickerModal } from '../common/MediaPickerModal';
import {
  DEFAULT_TIMEZONE,
  SUPPORTED_TIMEZONES,
  parseUtcToLocalParts,
  combineLocalToUtcIso,
  getUtcInstantDescription
} from '../../utils/datetime';

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'facebook', label: 'Facebook', icon: '👥', color: '#1877F2' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: '#FF0000' }
];

const POST_FORMATS = [
  { id: 'post', label: 'Standard Post' },
  { id: 'reel', label: 'Reel / Short Video' },
  { id: 'story', label: 'Story' }
];

export function EditPostModal({ postId, onClose, onSaved }) {
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState('content'); // 'content' | 'media' | 'schedule'
  const [isDirty, setIsDirty] = useState(false);

  // Post form state
  const [post, setPost] = useState(null);
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [internalTags, setInternalTags] = useState([]);
  const [newInternalTag, setNewInternalTag] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [postFormat, setPostFormat] = useState('post');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Media state
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Schedule state
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(DEFAULT_TIMEZONE);

  // Available social accounts
  const [socialAccounts, setSocialAccounts] = useState([]);

  // Fetch full details of the post from backend
  useEffect(() => {
    let isMounted = true;
    async function loadPostData() {
      setLoading(true);
      try {
        const [postData, accountsData] = await Promise.all([
          api.scheduler.getPost(postId),
          api.socialAccounts.list().catch(() => [])
        ]);

        if (!isMounted) return;

        setPost(postData);
        setTitle(postData.title || '');
        setCaption(postData.caption || '');
        setHashtags(Array.isArray(postData.hashtags) ? postData.hashtags : []);
        setInternalTags(Array.isArray(postData.internal_tags) ? postData.internal_tags : []);
        setPlatform(postData.platform || 'instagram');
        setPostFormat(postData.post_format || 'post');
        setSelectedAccountId(postData.social_account_id ? String(postData.social_account_id) : '');

        // Media asset
        if (postData.media_asset) {
          setSelectedMedia(postData.media_asset);
        }

        // Schedule & Timezone
        const postTz = postData.timezone || DEFAULT_TIMEZONE;
        setSelectedTimezone(postTz);

        if (postData.scheduled_time) {
          const parts = parseUtcToLocalParts(postData.scheduled_time, postTz);
          setScheduledDate(parts.date);
          setScheduledTime(parts.time);
        }

        setSocialAccounts(Array.isArray(accountsData) ? accountsData : []);
      } catch (err) {
        showToast('Failed to load post details: ' + (err.message || 'Server error'), 'error');
        onClose();
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (postId) {
      loadPostData();
    }
    return () => {
      isMounted = false;
    };
  }, [postId]);

  // Load media library assets for picker
  const loadMediaLibrary = async () => {
    setLoadingMedia(true);
    try {
      const data = await api.media.list();
      setMediaLibrary(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load media library:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleOpenMediaPicker = () => {
    setMediaPickerOpen(true);
    loadMediaLibrary();
  };

  // Add/remove hashtag
  const handleAddHashtag = (e) => {
    e.preventDefault();
    if (!newHashtag.trim()) return;
    const clean = newHashtag.trim().replace(/^#+/, '');
    if (clean && !hashtags.includes(clean)) {
      setHashtags([...hashtags, clean]);
      setIsDirty(true);
    }
    setNewHashtag('');
  };

  const handleRemoveHashtag = (tag) => {
    setHashtags(hashtags.filter((t) => t !== tag));
    setIsDirty(true);
  };

  // Add/remove internal tag
  const handleAddInternalTag = (e) => {
    e.preventDefault();
    if (!newInternalTag.trim()) return;
    const clean = newInternalTag.trim();
    if (clean && !internalTags.includes(clean)) {
      setInternalTags([...internalTags, clean]);
      setIsDirty(true);
    }
    setNewInternalTag('');
  };

  const handleRemoveInternalTag = (tag) => {
    setInternalTags(internalTags.filter((t) => t !== tag));
    setIsDirty(true);
  };

  // Close handler with dirty warning
  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        return;
      }
    }
    onClose();
  };

  // Compute live instant information
  const instantInfo = getUtcInstantDescription(scheduledDate, scheduledTime, selectedTimezone);

  // Form submission
  const handleSubmit = async (isReschedule = false) => {
    if (!caption.trim() && !title.trim()) {
      showToast('Post title or caption is required.', 'error');
      return;
    }

    if (!scheduledDate || !scheduledTime) {
      showToast('A scheduled date and time are required.', 'error');
      return;
    }

    if (instantInfo.isInPast && post?.status !== 'draft') {
      showToast('The scheduled time is in the past. Please select a future date and time.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        caption: caption.trim(),
        hashtags,
        internal_tags: internalTags,
        platform,
        post_format: postFormat,
        social_account_id: selectedAccountId ? parseInt(selectedAccountId, 10) : null,
        media_asset_id: selectedMedia ? selectedMedia.id : null,
        scheduled_time: instantInfo.utcIso,
        timezone: selectedTimezone,
        ...(isReschedule ? { status: 'scheduled' } : {})
      };

      const updated = await api.scheduler.updatePost(postId, payload);
      showToast(
        isReschedule ? 'Post rescheduled and updated successfully!' : 'Post updated successfully!',
        'success' );
      setIsDirty(false);
      if (onSaved) onSaved(updated);
      onClose();
    } catch (err) {
      showToast('Failed to save post: ' + (err.message || 'Error occurred'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isPublished = post?.status === 'published';

  return (
    <div id="edit-post-modal-overlay" className="modal-overlay" onClick={handleClose} style={{ zIndex: 1100 }}>
      <div
        id="edit-post-modal" className="modal-content" onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '960px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.08)' }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#ffffff' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text)' }}>
                Edit Scheduled Post #{postId}
              </h2>
              {post && (
                <span style={{
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  background: post.status === 'published' ? '#dcfce7' : post.status === 'failed' ? '#fee2e2' : '#e0f2fe',
                  color: post.status === 'published' ? '#15803d' : post.status === 'failed' ? '#b91c1c' : '#0369a1' }}>
                  {post.status}
                </span>
              )}
            </div>
            {post?.schedule_rule_name && (
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                ℹ️ Occurred from recurring rule: <strong>{post.schedule_rule_name}</strong>. Editing here updates only this occurrence.
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="btn--ghost" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', cursor: 'pointer', border: 'none', background: 'transparent' }}
          ><X className="w-4 h-4 inline-block" /></button>
        </div>

        {/* Read-only Alert if Published */}
        {isPublished && (
          <div style={{
            background: '#fef3c7',
            borderBottom: '1px solid #fde68a',
            padding: '12px 24px',
            color: '#92400e',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px' }}>
            <span></span>
            <span>
              This post has already been published to <strong>{post.platform}</strong>. Published posts cannot be modified or rescheduled.
            </span>
          </div>
        )}

        {/* Section Navigation Tabs */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg)',
          padding: '0 16px',
          overflowX: 'auto' }}>
          <button
            id="tab-edit-content" type="button" onClick={() => setActiveSection('content')}
            style={{
              padding: '12px 18px',
              fontSize: '0.88rem',
              fontWeight: activeSection === 'content' ? 700 : 500,
              color: activeSection === 'content' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'content' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer' }}
          >
            Post Content & Preview
          </button>
          <button
            id="tab-edit-media" type="button" onClick={() => setActiveSection('media')}
            style={{
              padding: '12px 18px',
              fontSize: '0.88rem',
              fontWeight: activeSection === 'media' ? 700 : 500,
              color: activeSection === 'media' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'media' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px' }}
          >
            Media Asset {selectedMedia && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />}
          </button>
          <button
            id="tab-edit-schedule" type="button" onClick={() => setActiveSection('schedule')}
            style={{
              padding: '12px 18px',
              fontSize: '0.88rem',
              fontWeight: activeSection === 'schedule' ? 700 : 500,
              color: activeSection === 'schedule' ? 'var(--primary)' : 'var(--text-secondary)',
              borderBottom: activeSection === 'schedule' ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'transparent',
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer' }}
          >
            Publishing Schedule & Timezone
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', background: '#ffffff' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
              <div className="spinner" style={{ margin: '0 auto 12px' }} />
              Loading post details from server...
            </div>
          ) : (
            <div>
              {/* SECTION 1: POST CONTENT */}
              {activeSection === 'content' && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_340px] gap-6">
                  {/* Left Column: Form Fields */}
                  <div>
                    {/* Title */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                        Post Title
                      </label>
                      <input
                        type="text" disabled={isPublished}
                        placeholder="Internal title or headline" value={title}
                        onChange={(e) => {
                          setTitle(e.target.value);
                          setIsDirty(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '0.9rem' }}
                      />
                    </div>

                    {/* Platform & Account Selection */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                          Target Platform *
                        </label>
                        <select
                          disabled={isPublished}
                          value={platform}
                          onChange={(e) => {
                            setPlatform(e.target.value);
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem',
                            background: '#ffffff' }}
                        >
                          {PLATFORMS.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.icon} {p.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                          Connected Account
                        </label>
                        <select
                          disabled={isPublished}
                          value={selectedAccountId}
                          onChange={(e) => {
                            setSelectedAccountId(e.target.value);
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem',
                            background: '#ffffff' }}
                        >
                          <option value="">Auto-select connected account</option>
                          {socialAccounts
                            .filter((acc) => acc.platform?.toLowerCase() === platform.toLowerCase())
                            .map((acc) => (
                              <option key={acc.id} value={acc.id}>
                                {acc.account_name || acc.platform_username || `Account #${acc.id}`}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    {/* Post Format */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                        Post Format
                      </label>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {(post?.post_format === 'carousel'
                          ? [...POST_FORMATS, { id: 'carousel', label: 'Carousel (Original Format)' }]
                          : POST_FORMATS
                        ).map((fmt) => (
                          <button
                            key={fmt.id}
                            type="button" disabled={isPublished}
                            onClick={() => {
                              setPostFormat(fmt.id);
                              setIsDirty(true);
                            }}
                            style={{
                              padding: '8px 14px',
                              borderRadius: '8px',
                              fontSize: '0.82rem',
                              fontWeight: postFormat === fmt.id ? 700 : 500,
                              border: postFormat === fmt.id ? '1px solid var(--primary)' : '1px solid var(--border)',
                              background: postFormat === fmt.id ? 'var(--primary-soft)' : 'var(--bg)',
                              color: postFormat === fmt.id ? 'var(--primary)' : 'var(--text-secondary)',
                              cursor: 'pointer' }}
                          >
                            {fmt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Caption */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>
                          Caption / Content Description *
                        </label>
                        <span style={{ fontSize: '0.78rem', color: 'var(--border)' }}>
                          {caption.length} characters
                        </span>
                      </div>
                      <textarea
                        id="edit-post-caption-input" rows={6}
                        disabled={isPublished}
                        placeholder="Write your post caption..." value={caption}
                        onChange={(e) => {
                          setCaption(e.target.value);
                          setIsDirty(true);
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid var(--border)',
                          fontSize: '0.9rem',
                          lineHeight: '1.5' }}
                      />
                    </div>

                    {/* Hashtags Editor */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                        Hashtags
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text" disabled={isPublished}
                          placeholder="Add hashtag (e.g. viral, marketing)" value={newHashtag}
                          onChange={(e) => setNewHashtag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddHashtag(e);
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button" disabled={isPublished || !newHashtag.trim()}
                          onClick={handleAddHashtag}
                          className="btn btn--secondary btn--sm" >
                          + Add
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {hashtags.map((ht) => (
                          <span
                            key={ht}
                            style={{
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px' }}
                          >
                            #{ht}
                            {!isPublished && (
                              <button
                                type="button" onClick={() => handleRemoveHashtag(ht)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 2px' }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Internal Tags Editor */}
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                        Internal Tags (Campaign, Funnel, Category)
                      </label>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                        <input
                          type="text" disabled={isPublished}
                          placeholder="Add internal tag (e.g. Q4-promo, launch-2026)" value={newInternalTag}
                          onChange={(e) => setNewInternalTag(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddInternalTag(e);
                          }}
                          style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '0.85rem' }}
                        />
                        <button
                          type="button" disabled={isPublished || !newInternalTag.trim()}
                          onClick={handleAddInternalTag}
                          className="btn btn--secondary btn--sm" >
                          + Add
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {internalTags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              background: 'var(--bg)',
                              color: 'var(--text)',
                              padding: '3px 8px',
                              borderRadius: '12px',
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px' }}
                          >
                            {tag}
                            {!isPublished && (
                              <button
                                type="button" onClick={() => handleRemoveInternalTag(tag)}
                                style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0 2px' }}
                              >
                                ×
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Live Social Card Preview */}
                  <div>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Live Post Preview
                    </h4>
                    <div style={{
                      border: '1px solid var(--border)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: '#ffffff',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
                      {/* Social Header */}
                      <div style={{ padding: '12px', display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--bg)' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'var(--on-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                          AI
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            Your Brand
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                            {PLATFORMS.find((p) => p.id === platform)?.label} • Preview
                          </div>
                        </div>
                      </div>

                      {/* Media Preview inside card */}
                      <div style={{ height: '220px', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        {selectedMedia ? (
                          selectedMedia.media_type === 'video' ? (
                            <video src={selectedMedia.file_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          ) : (
                            <img src={selectedMedia.file_url} alt="Attached asset" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                          )
                        ) : (
                          <div style={{ color: 'var(--border)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                            <div></div>
                            No media attached
                            <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>Visit Media tab to attach image/video</div>
                          </div>
                        )}
                      </div>

                      {/* Card Content */}
                      <div style={{ padding: '12px' }}>
                        <p style={{
                          fontSize: '0.85rem',
                          color: 'var(--text)',
                          margin: '0 0 8px 0',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '120px',
                          overflowY: 'auto' }}>
                          {caption || <span style={{ color: 'var(--border)', fontStyle: 'italic' }}>Caption preview appears here...</span>}
                        </p>
                        {hashtags.length > 0 && (
                          <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                            {hashtags.map((h) => `#${h}`).join(' ')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION 2: MEDIA MANAGEMENT */}
              {activeSection === 'media' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                        Attached Media Asset
                      </h3>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Replace, preview, or remove the media asset attached to this scheduled post.
                      </p>
                    </div>
                    {!isPublished && (
                      <button
                        type="button" onClick={handleOpenMediaPicker}
                        className="btn btn--primary btn--sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <span></span> Choose from Media Library
                      </button>
                    )}
                  </div>

                  {selectedMedia ? (
                    <div style={{
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'var(--bg)',
                      display: 'flex',
                      flexWrap: 'wrap' }}>
                      <div style={{ width: '320px', height: '240px', background: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selectedMedia.media_type === 'video' ? (
                          <video src={selectedMedia.file_url} controls style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (
                          <img src={selectedMedia.file_url} alt={selectedMedia.file_name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        )}
                      </div>
                      <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                            {selectedMedia.title || selectedMedia.file_name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                            Type: <strong>{selectedMedia.media_type?.toUpperCase()}</strong> • Asset ID: #{selectedMedia.id}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>
                            URL: <a href={selectedMedia.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)' }}>{selectedMedia.file_url}</a>
                          </div>
                        </div>

                        {!isPublished && (
                          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button
                              type="button" onClick={handleOpenMediaPicker}
                              className="btn btn--secondary btn--sm" >
                              Replace Media
                            </button>
                            <button
                              type="button" onClick={() => {
                                setSelectedMedia(null);
                                setIsDirty(true);
                              }}
                              className="btn btn--secondary btn--sm" style={{ color: '#ef4444' }}
                            >
                              Remove Media
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: '48px 20px',
                      border: '2px dashed var(--border)',
                      borderRadius: '12px',
                      background: 'var(--bg)' }}>
                      <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}></div>
                      <h4 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                        No Media Asset Attached
                      </h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Attaching images or videos significantly increases social media engagement.
                      </p>
                      {!isPublished && (
                        <button
                          type="button" onClick={handleOpenMediaPicker}
                          className="btn btn--primary" >
                          Select from Media Library
                        </button>
                      )}
                    </div>
                  )}

                  {/* Reusable Media Library Picker Modal */}
                  <MediaPickerModal
                    isOpen={mediaPickerOpen}
                    onClose={() => setMediaPickerOpen(false)}
                    onSelect={(item) => {
                      setSelectedMedia(item);
                      setIsDirty(true);
                    }}
                    title="Choose Media from Library" />
                </div>
              )}

              {/* SECTION 3: PUBLISHING SCHEDULE & TIMEZONE */}
              {activeSection === 'schedule' && (
                <div>
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                      Publishing Schedule & Timezone
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Configure the exact date, time, and target timezone for this post.
                    </p>
                  </div>

                  <div style={{
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                      {/* Date Picker */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                          Scheduled Date *
                        </label>
                        <input
                          id="edit-post-date-input" type="date" disabled={isPublished}
                          value={scheduledDate}
                          onChange={(e) => {
                            setScheduledDate(e.target.value);
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem',
                            background: '#ffffff' }}
                        />
                      </div>

                      {/* Time Picker */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                          Scheduled Time (24h) *
                        </label>
                        <input
                          id="edit-post-time-input" type="time" disabled={isPublished}
                          value={scheduledTime}
                          onChange={(e) => {
                            setScheduledTime(e.target.value);
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem',
                            background: '#ffffff' }}
                        />
                      </div>

                      {/* Timezone Selector */}
                      <div>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                          Configured Timezone *
                        </label>
                        <select
                          id="edit-post-timezone-select" disabled={isPublished}
                          value={selectedTimezone}
                          onChange={(e) => {
                            setSelectedTimezone(e.target.value);
                            setIsDirty(true);
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--border)',
                            fontSize: '0.9rem',
                            background: '#ffffff' }}
                        >
                          {SUPPORTED_TIMEZONES.map((tz) => (
                            <option key={tz.id} value={tz.id}>
                              {tz.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Live Instant Verification Card */}
                    <div style={{
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Selected Local Schedule:</span>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text)' }}>
                          {instantInfo.localPreview || 'Please choose date & time'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--border)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Target Server Instant (UTC):</span>
                        <code style={{ fontSize: '0.82rem', background: 'var(--bg)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text)' }}>
                          {instantInfo.utcPreview || '—'}
                        </code>
                      </div>

                      {instantInfo.isInPast && !isPublished && (
                        <div style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          fontSize: '0.82rem',
                          marginTop: '4px' }}>
                          Warning: This time is in the past! Please select a future date and time.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Explicit Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 sm:px-6 border-t border-border bg-bg">
          <button
            id="edit-post-cancel-btn" type="button" className="btn btn--secondary" onClick={handleClose}
            disabled={submitting}
          >
            Cancel Changes
          </button>

          {!isPublished && (
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                id="edit-post-reschedule-btn" type="button" className="btn btn--secondary" disabled={submitting}
                onClick={() => handleSubmit(true)}
                title="Resets status to 'scheduled', updates timing and clears any previous publishing failure." >
                {submitting ? 'Updating...' : 'Save & Reschedule'}
              </button>
              <button
                id="edit-post-save-btn" type="button" className="btn btn--primary" disabled={submitting}
                onClick={() => handleSubmit(false)}
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
