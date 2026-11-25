import React, { useState, useEffect, useRef } from 'react';
import { api, getFullMediaUrl } from '../../../services/api';
import { useToast } from '../../common/Toast';
import { useContent } from '../../../contexts/ContentContext';
import { useAuth } from '../../../contexts/AuthContext';
import { MediaPickerModal } from '../../common/MediaPickerModal';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { RefreshCw, Send, Calendar, Clock, Globe, Plus, Sparkles, Upload, Image as ImageIcon, Check } from 'lucide-react';
import {
  DEFAULT_TIMEZONE,
  SUPPORTED_TIMEZONES,
  combineLocalToUtcIso,
  getUtcInstantDescription
} from '../../../utils/datetime';

const PLATFORMS = [
  { id: 'youtube', name: 'YouTube', icon: '▶️', color: '#FF0000', formats: ['community', 'post', 'reel'], desc: 'Community Tab photo updates, Shorts & channel uploads' },
  { id: 'instagram', name: 'Instagram', icon: '📸', color: '#E1306C', formats: ['post', 'reel', 'story'], desc: 'Feed carousels, photo posts & reels' },
  { id: 'facebook', name: 'Facebook', icon: '👥', color: '#1877F2', formats: ['post', 'reel', 'story'], desc: 'Page feed updates, photos & reels' }
];

export function CreatePostView({ initialMedia = null, onNavigate, isEmbedded = false }) {
  const { showToast } = useToast();
  const { brandProfile } = useContent() || {};
  const { currentBusiness } = useAuth() || {};
  const brandName = brandProfile?.name || brandProfile?.brand_name || currentBusiness?.name || 'Your Brand';

  // Form Fields
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtags, setHashtags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [internalTags, setInternalTags] = useState([]);
  const [postFormat, setPostFormat] = useState('post');
  const [selectedMedia, setSelectedMedia] = useState(initialMedia);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('10:00');
  const [timezone, setTimezone] = useState('Asia/Kolkata');

  const selectedMediaUrl = getFullMediaUrl(selectedMedia?.file_url || selectedMedia?.mediaUrl || selectedMedia?.url || '');
  const selectedMediaType = (selectedMedia?.media_type || selectedMedia?.contentType || (selectedMediaUrl.match(/\.(mp4|mov|webm)(\?.*)?$/i) ? 'video' : 'image')).toLowerCase();

  // Accounts & Multi-Account Selection
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState([]);
  const [activePreviewPlatform, setActivePreviewPlatform] = useState('youtube');

  // Data fetching & UI State
  const [mediaLibrary, setMediaLibrary] = useState([]);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Load Accounts & Media
  const loadData = async () => {
    try {
      // Clear cache to always get freshly saved tokens
      if (api.clearCache) api.clearCache('social-accounts');
      const accs = await api.socialAccounts.list(brandProfile?.id, { noCache: true });
      const scopedAccs = (Array.isArray(accs) ? accs : []).filter((a) => !brandProfile?.id || a.brand_profile_id === brandProfile.id);
      if (scopedAccs.length >= 0) {
        setAccounts(scopedAccs);
        // By default, select all connected accounts that have active credentials
        const connectedIds = scopedAccs.filter((a) => a.is_connected).map((a) => a.id);
        if (connectedIds.length > 0) {
          setSelectedAccountIds(connectedIds);
        } else if (accs.length > 0) {
          setSelectedAccountIds([accs[0].id]);
        }
      }
    } catch (err) {
      console.error('Error loading social accounts:', err);
    }

    try {
      const m = await api.media.list();
      if (Array.isArray(m)) setMediaLibrary(m);
    } catch (err) {
      console.error('Error loading media library:', err);
    }
  };

  useEffect(() => {
    // Default tomorrow date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    setScheduledDate(`${yr}-${mo}-${da}`);

    // Check if an idea was transferred from AI Content Planner
    try {
      const rawTransfer = localStorage.getItem('sacp_planner_idea_transfer');
      if (rawTransfer) {
        const transfer = JSON.parse(rawTransfer);
        localStorage.removeItem('sacp_planner_idea_transfer');

        if (transfer.topic) setTitle(transfer.topic);

        if (transfer.full_caption) {
          setCaption(transfer.full_caption);
        } else {
          const captionParts = [];
          if (transfer.hook) captionParts.push(transfer.hook);
          if (transfer.caption_brief) captionParts.push(transfer.caption_brief);
          if (transfer.call_to_action) captionParts.push(transfer.call_to_action);
          if (captionParts.length > 0) {
            setCaption(captionParts.join('\n\n'));
          }
        }

        if (transfer.media) {
          const m = transfer.media;
          const url = getFullMediaUrl(m.file_url || m.mediaUrl || m.url || '');
          const type = (m.media_type || m.contentType || (url.match(/\.(mp4|mov|webm)(\?.*)?$/i) ? 'video' : 'image')).toLowerCase();
          setSelectedMedia({
            ...m,
            file_url: url,
            mediaUrl: url,
            media_type: type,
            contentType: type
          });
        }

        if (Array.isArray(transfer.hashtags) && transfer.hashtags.length > 0) {
          const tags = transfer.hashtags
            .map((h) => (typeof h === 'string' && h.startsWith('#') ? h : `#${h}`).trim())
            .filter((h) => h.length > 1);
          setHashtags(tags);
        } else if (typeof transfer.hashtags === 'string' && transfer.hashtags.trim()) {
          const tags = transfer.hashtags
            .split(/[\s,]+/)
            .map((h) => (h.startsWith('#') ? h : `#${h}`).trim())
            .filter((h) => h.length > 1);
          setHashtags(tags);
        }

        if (transfer.content_format) {
          const fmt = transfer.content_format.toLowerCase();
          if (fmt.includes('reel') || fmt.includes('video') || fmt.includes('short')) {
            setPostFormat('reel');
          } else if (fmt.includes('story')) {
            setPostFormat('story');
          } else {
            setPostFormat('post');
          }
        }

        if (transfer.suggested_date) {
          setScheduledDate(transfer.suggested_date);
        }
        if (transfer.suggested_time) {
          setScheduledTime(transfer.suggested_time);
        }

        if (transfer.platform) {
          const p = transfer.platform.toLowerCase();
          const matched = PLATFORMS.find((pl) => pl.id === p || p.includes(pl.id));
          if (matched) {
            setActivePreviewPlatform(matched.id);
          }
        }

        showToast(`Loaded planned idea: "${transfer.topic || 'Planned Idea'}" into Composer!`, 'success');
      }
    } catch (err) {
      console.warn('Failed to parse planner idea transfer:', err);
    }

    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [brandProfile?.id]);

  // Generated media can arrive after this view is mounted; keep it attached
  // so both AI-generated and library/uploaded assets follow the same flow.
  useEffect(() => {
    if (initialMedia?.id) setSelectedMedia(initialMedia);
  }, [initialMedia]);

  // Connected accounts list
  const connectedAccounts = accounts.filter((a) => a.is_connected);
  const allAccountsSelected = connectedAccounts.length > 0 && connectedAccounts.every((a) => selectedAccountIds.includes(a.id));

  // Toggle single account selection
  const handleToggleAccount = (accountId) => {
    setSelectedAccountIds((prev) => {
      if (prev.includes(accountId)) {
        const next = prev.filter((id) => id !== accountId);
        return next;
      } else {
        const next = [...prev, accountId];
        const acc = accounts.find((a) => a.id === accountId);
        if (acc) setActivePreviewPlatform(acc.platform.toLowerCase());
        return next;
      }
    });
  };

  // Toggle "Select All / Post to All"
  const handleToggleSelectAll = () => {
    if (allAccountsSelected) {
      // Deselect all except the first one
      setSelectedAccountIds(connectedAccounts.length > 0 ? [connectedAccounts[0].id] : []);
    } else {
      // Select all connected accounts
      setSelectedAccountIds(connectedAccounts.map((a) => a.id));
      showToast(`Selected all ${connectedAccounts.length} connected accounts for simultaneous posting!`, 'info');
    }
  };

  const selectedAccounts = accounts.filter((a) => selectedAccountIds.includes(a.id));
  const hasYouTubeSelected = selectedAccounts.some((a) => a.platform.toLowerCase() === 'youtube');

  // Hashtags & Internal tags
  const handleAddHashtag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = hashtagInput.trim().replace(/^#/, '');
      if (val && !hashtags.includes(val)) {
        setHashtags([...hashtags, val]);
      }
      setHashtagInput('');
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.trim();
      if (val && !internalTags.includes(val)) {
        setInternalTags([...internalTags, val]);
      }
      setTagInput('');
    }
  };

  const selectMediaForPost = (media) => {
    if (!media) return;
    const isVideo = media.media_type === 'video' || String(media.mime_type || '').startsWith('video/') || /\.(mp4|mov|webm)(\?|$)/i.test(media.file_url || '');
    if (isVideo && postFormat === 'post') {
      setPostFormat('reel');
      showToast('Video detected. Switched post format to Reel / Shorts / Video.', 'info');
    } else if (!isVideo && postFormat === 'reel') {
      setPostFormat('post');
      showToast('Image detected. Switched post format to Feed Photo Post.', 'info');
    }
    setSelectedMedia(media);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    const isVideo = file.type?.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
    if (isVideo && postFormat === 'post') {
      setPostFormat('reel');
      showToast('Video detected. Switched post format to Reel / Shorts / Video.', 'info');
    }
    setUploadingMedia(true);
    setUploadProgress(0);
    try {
      showToast(`Uploading ${file.name}...`, 'info');
      let uploaded;
      try {
        uploaded = await api.media.uploadDirect(file, { title: file.name }, setUploadProgress);
      } catch (directError) {
        // Keep the existing server upload path as a compatibility fallback
        // when Cloudinary direct-upload credentials are unavailable.
        uploaded = await api.media.upload(file, { title: file.name }, setUploadProgress);
      }
      selectMediaForPost(uploaded);
      showToast('Media uploaded and attached to post!', 'success');
      api.media.list().then(setMediaLibrary).catch(console.error);
    } catch (err) {
      showToast('Upload failed: ' + (err.message || 'Error'), 'error');
    } finally {
      setUploadingMedia(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Save / Schedule / Publish to all selected accounts
  const handleSave = async (actionType) => {
    if (submitting) return;
    if (!title.trim() && !caption.trim()) {
      showToast('Please provide at least a post title or caption.', 'error');
      return;
    }

    if (!selectedMedia) {
      showToast('Please attach an image or video to this post.', 'error');
      return;
    }

    if (selectedAccountIds.length === 0) {
      showToast('Please select at least one social media account to post to.', 'warning');
      return;
    }

    if (postFormat === 'community') {
      showToast('YouTube Community posts cannot be published through the public YouTube Data API. Select a supported photo, story, or video format instead.', 'error');
      return;
    }

    let schedIso = null;
    if (actionType === 'schedule') {
      if (!scheduledDate || !scheduledTime) {
        showToast('Please select a valid scheduled date and time.', 'error');
        return;
      }
      const instant = getUtcInstantDescription(scheduledDate, scheduledTime, timezone);
      if (instant.isInPast) {
        showToast('Scheduled time cannot be in the past. Please choose a future time or click "Publish Live Now".', 'error');
        return;
      }
      schedIso = instant.utcIso;
    } else {
      schedIso = new Date().toISOString();
    }

    setSubmitting(true);
    try {
      const targetAccounts = selectedAccounts;
      const isMulti = targetAccounts.length > 1;

      if (actionType === 'publish_now') {
        showToast(`Publishing live to ${targetAccounts.length} destination${isMulti ? 's' : ''}...`, 'info');
      }

      const isVideo = selectedMedia?.media_type === 'video' || selectedMedia?.file_url?.toLowerCase().endsWith('.mp4');
      if (postFormat === 'reel' && !isVideo) {
        showToast('Reels / Shorts require a video upload.', 'error');
        return;
      }
      if (postFormat === 'post' && isVideo) {
        showToast('Feed photo posts require an image. Select Reel / Shorts / Video for a video upload.', 'error');
        return;
      }
      const payload = {
        title: title.trim() || 'Untitled Post',
        caption: caption.trim(),
        hashtags,
        internal_tags: internalTags,
        platform: targetAccounts[0]?.platform?.toLowerCase() || 'instagram',
        post_format: postFormat,
        media_asset_id: selectedMedia.id,
        social_account_ids: targetAccounts.map((account) => account.id),
        scheduled_time: schedIso,
        timezone,
        status: actionType === 'draft' ? 'draft' : 'scheduled'
      };
      const response = await api.scheduler.createPost(payload, actionType === 'publish_now');
      const results = (response.publish_metadata?.results || [{
        account: targetAccounts[0],
        result: response
      }]).filter(Boolean);

      // Evaluate results
      if (actionType === 'publish_now') {
        const publishedCount = results.filter((r) => r && (r.status === 'published' || r.result?.status === 'published' || r.result?.success)).length;
        const failedCount = results.filter((r) => r && (r.status === 'failed' || r.result?.status === 'failed' || r.result?.success === false)).length;

        if (publishedCount > 0) {
          const names = results.filter((r) => r && (r.status === 'published' || r.result?.status === 'published' || r.result?.success)).map((r) => `${(r.account?.platform || r.platform || 'social').toUpperCase()} (${r.account?.account_name || r.account || r.account_name || 'account'})`).join(', ');
          showToast(`Published live to: ${names}!`, 'success');
          // Notify AnalyticsInsightsView to auto-refresh metrics after publish
          window.dispatchEvent(new CustomEvent('post:published', { detail: { count: publishedCount, platforms: names } }));
        }
        if (failedCount > 0) {
          const fails = results.filter((r) => r && (r.status === 'failed' || r.result?.status === 'failed' || r.result?.success === false));
          showToast(`Notice: ${fails.length} account(s) encountered an issue. Check connection tokens.`, 'warning');
        }
      } else if (actionType === 'schedule') {
        showToast(`Scheduled post across ${results.length} channel(s) for ${scheduledDate} at ${scheduledTime}!`, 'success');
      } else {
        showToast(`Saved drafts for ${results.length} channel(s)!`, 'success');
      }

      // Clear the composer before leaving it so the next visit starts fresh.
      setTitle('');
      setCaption('');
      setHashtagInput('');
      setHashtags([]);
      setTagInput('');
      setInternalTags([]);
      setSelectedMedia(null);
      setScheduledDate('');
      setScheduledTime('10:00');
      if (onNavigate) {
        onNavigate(actionType === 'schedule' ? 'content-calendar' : 'scheduled-posts');
      }
    } catch (err) {
      console.error('Failed to create post:', err);
      showToast('Error saving post: ' + (err.message || 'Server error'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Channel & Brand resolution for live destination preview
  const activePlatformAccount =
    selectedAccounts.find((a) => a.platform?.toLowerCase() === activePreviewPlatform?.toLowerCase() && a.is_connected) ||
    accounts.find((a) => a.platform?.toLowerCase() === activePreviewPlatform?.toLowerCase() && a.is_connected);

  const isPlatformConnected = !!activePlatformAccount;

  const getAccountDisplayName = (acc) => {
    if (!acc) return brandName;
    return acc.account_name || brandName;
  };

  const channelDisplayName = isPlatformConnected
    ? getAccountDisplayName(activePlatformAccount)
    : brandName;
  const previewAccount = activePlatformAccount || null;
  const mediaAccept = postFormat === 'reel' ? 'video/*' : postFormat === 'post' ? 'image/*' : 'image/*,video/*';
  const mediaHint = postFormat === 'reel'
    ? 'MP4, MOV, or WebM video for Reels and Shorts'
    : postFormat === 'post'
      ? 'JPG, PNG, or WEBP image for feed photo posts'
      : 'JPG, PNG, WEBP, MP4, MOV, or WebM for Stories';

  return (
    <div className="space-y-6">
      {/* Header (rendered when standalone) */}
      {!isEmbedded && (
        <DashboardPageHeader
          badge="2. CONTENT COMPOSER" badgeType="emerald" statusBadge="Multi-Channel Publishing Active" title="Create Post & Multi-Channel Composer" description="Compose once, preview live, and broadcast across YouTube (Community Tab & Shorts), Instagram, and Facebook.">
          <button
            type="button" onClick={loadData}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected hover:text-text transition-all shadow-xs btn-smooth" title="Refresh verified social accounts" >
            <RefreshCw className="w-4 h-4 text-text-muted" />
            <span>Refresh Accounts</span>
          </button>
        </DashboardPageHeader>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Composer Form */}
        <SpotlightCard className="lg:col-span-7 p-6 sm:p-7 space-y-6 card-smooth border-border">
          {/* SECTION 1: CONNECTED SOCIAL MEDIA ACCOUNTS (SHOW ALL & POST TO ALL) */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface-raised transition-colors">
            <div className="flex justify-between items-center mb-3.5 flex-wrap gap-2.5">
              <div>
                <label className="block text-sm font-bold text-text m-0">
                  Destinations & Social Media Accounts *
                </label>
                <div className="text-xs text-text-muted mt-0.5">
                  {selectedAccountIds.length} of {accounts.length} accounts selected for simultaneous posting
                </div>
              </div>

              {/* POST TO ALL BUTTON */}
              <button
                type="button"
                onClick={handleToggleSelectAll}
                className={`btn-smooth flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                  allAccountsSelected
                    ? 'bg-primary text-primary-on border-primary shadow-xs font-bold'
                    : 'bg-surface text-text-secondary border-border hover:bg-surface-selected hover:text-text font-semibold'
                }`}
              >
                <span>{allAccountsSelected ? '✓ All Accounts Selected' : 'Post to All Accounts'}</span>
              </button>
            </div>

            {/* ACCOUNTS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {accounts.map((acc) => {
                const isSelected = selectedAccountIds.includes(acc.id);
                const platMeta = PLATFORMS.find((p) => p.id === acc.platform.toLowerCase()) || { icon: '🌐', color: '#19251E' };

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleToggleAccount(acc.id)}
                    className={`btn-smooth flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-surface border-primary shadow-sm ring-1 ring-primary/30 text-text'
                        : 'bg-surface border-border hover:bg-surface-selected hover:border-primary/40 text-text'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by parent div
                      className="cursor-pointer accent-primary w-4 h-4 rounded"
                    />
                    <div className="text-lg leading-none">{platMeta.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs sm:text-sm text-text truncate">
                        {getAccountDisplayName(acc)}
                      </div>
                      <div className="text-[11px] text-text-muted flex items-center gap-1.5 mt-0.5">
                        <span className="font-medium">{acc.platform.toUpperCase()}</span>
                        <span>•</span>
                        <span className={`font-semibold ${acc.is_connected ? 'text-success font-bold' : 'text-warning font-bold'}`}>
                          {acc.is_connected ? 'Ready' : 'Token'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {accounts.length === 0 && (
                <div className="col-span-full p-4 text-center text-text-muted text-xs sm:text-sm">
                  No accounts loaded. Go to <strong className="text-primary font-bold">Social Accounts</strong> in sidebar to add your YouTube API tokens or Instagram credentials.
                </div>
              )}
            </div>

            {/* YOUTUBE COMMUNITY TAB HIGHLIGHT BANNER */}
            {hasYouTubeSelected && (
              <div className="mt-3.5 p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/70 dark:bg-surface flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-rose-900 dark:text-rose-300">
                    YouTube supports video and Shorts publishing through the official API
                  </div>
                  <div className="text-rose-700/80 dark:text-text-secondary mt-0.5">
                    The public YouTube Data API does not provide Community Tab publishing. Select <strong className="font-semibold text-rose-900 dark:text-text">Reel / Shorts / Video</strong> and attach a video file for YouTube.
                  </div>
                </div>
                <span className="bg-rose-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                  Video only
                </span>
              </div>
            )}
          </div>

          {/* Post Format & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Primary Post Format
              </label>
              <select
                value={postFormat}
                onChange={(e) => setPostFormat(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all shadow-xs cursor-pointer"
              >
                <option value="community" disabled>Community Tab (not available via public YouTube API)</option>
                <option value="post">Feed Photo Post</option>
                <option value="reel">Reel / Shorts / Video</option>
                <option value="story">24h Story</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Broadcast Mode
              </label>
              <div className="px-3.5 py-2.5 rounded-xl border border-border bg-surface text-sm text-text flex items-center gap-2 shadow-xs">
                <Globe className="w-4 h-4 text-primary" />
                <strong className="font-bold">{selectedAccountIds.length > 1 ? `Multi-Broadcast (${selectedAccountIds.length} channels)` : 'Single Channel'}</strong>
              </div>
            </div>
          </div>

          {/* Media Attachment */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Attached Photo / Video Media *
              </label>
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => setMediaPickerOpen(true)}
                  className="btn-smooth px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-selected text-text-secondary hover:text-text text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Select from Media Library
                </button>
                <button
                  type="button" onClick={() => fileInputRef.current?.click()}
                  className="btn-smooth px-3 py-1.5 rounded-lg border border-border bg-surface hover:bg-surface-selected text-text-secondary hover:text-text text-xs font-semibold shadow-xs cursor-pointer"
                  disabled={uploadingMedia}
                >
                  {uploadingMedia ? `Uploading ${uploadProgress}%...` : '⬆️ Upload File'}
                </button>
                <input
                  type="file" ref={fileInputRef}
                  className="hidden"
                  accept={mediaAccept} onChange={(e) => {
                    if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
                  }}
                />
              </div>
            </div>

            {selectedMedia ? (
              <div className="border border-border rounded-2xl p-3.5 flex items-center gap-3.5 bg-surface shadow-xs">
                <div className="w-[70px] h-[70px] rounded-xl bg-surface-raised overflow-hidden shrink-0 flex items-center justify-center border border-border">
                  {selectedMediaType === 'video' ? (
                    <video src={selectedMediaUrl} className="w-full h-full object-cover" />
                  ) : (
                    <img src={selectedMediaUrl} alt="Attached" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-text truncate">
                    {selectedMedia.title || selectedMedia.file_name}
                  </div>
                  <div className="text-xs text-text-secondary mt-0.5">
                    Type: <strong className="text-primary">{selectedMediaType?.toUpperCase()}</strong> • Size: {selectedMedia.file_size ? `${Math.round(selectedMedia.file_size / 1024)} KB` : 'Cloud Asset'}
                  </div>
                  <div className="text-xs text-success mt-1 font-semibold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Ready for YouTube Community Tab & Social Feeds</span>
                  </div>
                </div>
                <button
                  type="button" onClick={() => setSelectedMedia(null)}
                  className="p-2 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 font-bold text-lg leading-none rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors cursor-pointer"
                  title="Remove media" >
                  ×
                </button>
              </div>
            ) : (
              <div
                onClick={() => setMediaPickerOpen(true)}
                className="border-2 border-dashed border-border rounded-2xl p-7 text-center bg-surface-raised hover:bg-surface-selected cursor-pointer transition-all duration-200 hover:border-primary group"
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-primary-soft text-primary border border-border flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div className="font-semibold text-sm text-text">
                  Click to select a photo from your Media Library
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {mediaHint}
                </div>
              </div>
            )}
          </div>

          {/* Post Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Post Title / Internal Headline
            </label>
            <input
              type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sustainable Autumn Drop Announcement"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all shadow-xs"
            />
          </div>

          {/* Post Caption */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Post Caption & Text Body *
              </label>
              <span className="text-xs text-text-muted">
                {caption.length} characters
              </span>
            </div>
            <textarea
              rows={5}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write the message for your YouTube Community post and social feeds..."
              className="w-full p-3.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all resize-y font-inherit shadow-xs"
            />
          </div>

          {/* Hashtags Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
              Hashtags (Press Enter or comma to add)
            </label>
            <input
              type="text" value={hashtagInput}
              onChange={(e) => setHashtagInput(e.target.value)}
              onKeyDown={handleAddHashtag}
              placeholder="e.g. fashion, newdrop, sustainable"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-surface text-text text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all shadow-xs mb-2.5"
            />
            <div className="flex flex-wrap gap-1.5">
              {hashtags.map((h, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-border shadow-xs"
                >
                  #{h}
                  <button
                    type="button"
                    onClick={() => setHashtags(hashtags.filter((_, i) => i !== idx))}
                    className="cursor-pointer font-bold ml-0.5 hover:text-text"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Scheduling Date/Time Picker */}
          <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface-raised transition-colors shadow-xs">
            <h4 className="m-0 mb-3 text-sm font-bold text-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              Scheduling Settings & Timezone
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Date</label>
                <input
                  type="date" value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all shadow-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Time (24h)</label>
                <input
                  type="time" value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all shadow-xs cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1">Target Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring transition-all shadow-xs cursor-pointer"
                >
                  {SUPPORTED_TIMEZONES.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Instant Preview */}
            {(() => {
              const instant = getUtcInstantDescription(scheduledDate, scheduledTime, timezone);
              return (
                <div className="p-3 rounded-xl border border-border bg-surface text-xs flex justify-between items-center flex-wrap gap-2 shadow-xs">
                  <div className="text-text font-semibold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Scheduled for: <strong className="text-text">{instant.localPreview || '—'}</strong></span>
                  </div>
                  <div className="text-text-muted text-[11px]">
                    Server UTC Instant: <code className="px-1.5 py-0.5 rounded bg-surface-selected text-text-secondary border border-border">{instant.utcPreview || '—'}</code>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              type="button" onClick={() => handleSave('draft')}
              className="btn-smooth w-full sm:flex-1 py-3 px-4 rounded-xl border border-border bg-surface hover:bg-surface-selected text-text-secondary hover:text-text font-bold text-xs sm:text-sm shadow-xs transition-all cursor-pointer text-center"
              disabled={submitting}
            >
              Save Draft
            </button>
            <button
              type="button" onClick={() => handleSave('schedule')}
              className="btn-smooth w-full sm:flex-[1.3] py-3 px-4 rounded-xl bg-primary hover:bg-primary-hover active:scale-95 text-primary-on font-bold text-xs sm:text-sm shadow-sm transition-all cursor-pointer text-center"
              disabled={submitting}
            >
              Schedule Post ({selectedAccountIds.length})
            </button>
            <button
              type="button" onClick={() => handleSave('publish_now')}
              className="btn-smooth w-full sm:flex-[1.5] py-3 px-4 rounded-xl bg-success hover:brightness-105 text-white font-bold text-xs sm:text-sm shadow-md shadow-success/20 transition-all cursor-pointer text-center"
              disabled={submitting}
            >
              {submitting ? 'Publishing...' : `Publish Live Now (${selectedAccountIds.length} Channels)`}
            </button>
          </div>
        </SpotlightCard>

        {/* RIGHT COLUMN: Realistic Live Social Preview */}
        <SpotlightCard className="lg:col-span-5 p-0 overflow-hidden sticky top-6 card-smooth border-border">
          <div>
            {/* Preview Platform Switcher */}
            <div className="p-3 sm:px-4 border-b border-border flex items-center justify-between bg-surface-raised transition-colors">
              <span className="text-xs font-bold text-text flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary" />
                Preview Destination:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {['youtube', 'instagram', 'facebook', 'pinterest', 'twitter'].map((pId) => {
                  const isActive = activePreviewPlatform === pId;
                  const pMeta = PLATFORMS.find((p) => p.id === pId);
                  return (
                    <button
                      key={pId}
                      type="button"
                      onClick={() => setActivePreviewPlatform(pId)}
                      className={`btn-smooth px-2.5 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-primary text-primary-on border-primary shadow-xs font-bold'
                          : 'bg-surface text-text-secondary border-border hover:text-text hover:bg-surface-selected'
                      }`}
                    >
                      {pMeta?.icon} {pMeta?.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            {activePreviewPlatform === 'youtube' ? (
              /* YOUTUBE COMMUNITY TAB POST PREVIEW */
              <div className="p-4 sm:p-5 bg-surface transition-colors space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-error text-white flex items-center justify-center font-extrabold text-sm shadow-xs flex-shrink-0 overflow-hidden">
                    {brandProfile?.logoUrl ? (
                      <img src={brandProfile.logoUrl} alt={channelDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      '▶'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-text truncate">
                      {channelDisplayName}
                    </div>
                    <div className="text-xs text-text-secondary">
                      {isPlatformConnected ? 'YouTube Community Post • Connected Channel' : `${brandName} • YouTube Preview`}
                    </div>
                  </div>
                  <span className="bg-primary text-primary-on text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                    Subscribe
                  </span>
                </div>

                {/* Caption / Text */}
                <div className="text-xs sm:text-sm text-text leading-relaxed whitespace-pre-line">
                  {caption || <span className="text-text-muted">Your YouTube Community post caption...</span>}
                  {hashtags.length > 0 && (
                    <div className="mt-1.5 text-primary font-semibold">
                      {hashtags.map((h) => `#${h}`).join(' ')}
                    </div>
                  )}
                </div>

                {/* Attached Photo */}
                <div className="w-full rounded-xl bg-surface-raised overflow-hidden border border-border max-h-[380px] flex items-center justify-center">
                  {selectedMediaUrl ? (
                    selectedMediaType === 'video' ? (
                      <video src={selectedMediaUrl} controls className="w-full max-h-[380px] object-contain" />
                    ) : (
                      <img src={selectedMediaUrl} alt="Community Tab Preview" className="w-full max-h-[380px] object-cover" />
                    )
                  ) : (
                    <div className="p-10 text-center text-text-muted">
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-60" />
                      <div className="text-xs">Attached photo will appear here</div>
                    </div>
                  )}
                </div>

                {/* YouTube Action Buttons */}
                <div className="flex items-center gap-5 pt-1 text-text-secondary text-xs font-semibold">
                  <span className="flex items-center gap-1 cursor-pointer hover:text-text">👍 0</span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-text">👎</span>
                  <span className="flex items-center gap-1 cursor-pointer hover:text-text">💬 0</span>
                  <span className="ml-auto cursor-pointer hover:text-text">Share</span>
                </div>
              </div>
            ) : (
              /* INSTAGRAM & GENERAL PREVIEW */
              <div className="bg-surface transition-colors">
                <div className="p-3.5 sm:px-4 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-surface-raised text-text flex items-center justify-center font-bold text-xs shadow-xs overflow-hidden border border-border">
                    {brandProfile?.logoUrl ? (
                      <img src={brandProfile.logoUrl} alt={channelDisplayName} className="w-full h-full object-cover" />
                    ) : (
                      (channelDisplayName || 'B').slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-text truncate">
                      {channelDisplayName}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {scheduledDate ? `Scheduled for ${scheduledDate} • ${scheduledTime}` : (isPlatformConnected ? 'Connected Channel Preview' : `${brandName} • Draft Preview`)}
                    </div>
                  </div>
                  <span className="text-text-muted text-base">•••</span>
                </div>

                <div className="w-full min-h-[260px] max-h-[380px] bg-surface-raised border border-border flex items-center justify-center overflow-hidden">
                  {selectedMediaUrl ? (
                    selectedMediaType === 'video' ? (
                      <video src={selectedMediaUrl} controls className="w-full max-h-[380px] object-contain" />
                    ) : (
                      <img src={selectedMediaUrl} alt="Preview" className="w-full max-h-[380px] object-cover" />
                    )
                  ) : (
                    <div className="text-text-muted text-center p-10">
                      <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-60" />
                      <div className="text-xs">Select media to preview</div>
                    </div>
                  )}
                </div>

                <div className="p-3 sm:px-4 flex items-center gap-4 border-b border-border text-text-secondary text-sm">
                  <span className="cursor-pointer hover:scale-110 transition-transform">❤️</span>
                  <span className="cursor-pointer hover:scale-110 transition-transform">💬</span>
                  <span className="cursor-pointer hover:scale-110 transition-transform">↗️</span>
                  <span className="ml-auto cursor-pointer hover:scale-110 transition-transform">🔖</span>
                </div>

                <div className="p-3.5 sm:p-4 text-xs space-y-1.5 leading-relaxed text-text">
                  <div className="whitespace-pre-line">
                    <strong className="text-text mr-1.5">
                      {channelDisplayName}
                    </strong>
                    {caption || <span className="text-text-muted">Your caption will appear here...</span>}
                  </div>
                  {hashtags.length > 0 && (
                    <div className="text-primary font-semibold pt-1">
                      {hashtags.map((h) => `#${h}`).join(' ')}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </SpotlightCard>
      </div>

      {/* MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={selectMediaForPost}
        title="Select Media for YouTube & Social Channels" />
    </div>
  );
}
