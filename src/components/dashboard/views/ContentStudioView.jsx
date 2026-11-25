import React, { useState, useEffect } from 'react';
import { MediaArtwork } from '../../ui/MediaArtwork';
import { useContent } from '../../../contexts/ContentContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../common/Toast';
import { MediaPickerModal } from '../../common/MediaPickerModal';
import { api, getFullMediaUrl } from '../../../services/api';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Edit3,
  Image as ImageIcon,
  Sparkles,
  Save,
  Send,
  Rocket,
  Check,
  X,
  Upload,
  FolderOpen,
  Smartphone,
  Share2,
  Mic,
  Volume2,
  Clock,
  Film,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';

import { CreatePostView } from './CreatePostView';

export function ContentStudioView({
  studioItemId,
  setStudioItemId,
  onNavigate,
  selectedMediaAsset,
  onClearSelectedMedia,
  initialTab = 'compose'
}) {
  const { contentItems, brandProfile, saveContentItem, approveItem, publishItem } = useContent();
  const { currentBusiness } = useAuth();
  const { showToast } = useToast();

  const [activeStudioTab, setActiveStudioTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveStudioTab(initialTab);
    }
  }, [initialTab]);

  const [headline, setHeadline] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [cta, setCta] = useState('');
  const [platform, setPlatform] = useState('All Connected Channels (Instagram, Facebook & YouTube)');
  const [format, setFormat] = useState('Image post');
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false);
  const [copyQualityCheck, setCopyQualityCheck] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Attached media state
  const [attachedMediaUrl, setAttachedMediaUrl] = useState('');
  const [attachedMediaType, setAttachedMediaType] = useState('image');
  const [attachedMediaName, setAttachedMediaName] = useState('');
  const [voiceoverScript, setVoiceoverScript] = useState('');
  const [duration, setDuration] = useState('');

  // Media Picker Modal state
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const activeItem = contentItems.find((i) => String(i.id) === String(studioItemId)) || contentItems[0] || {};
  const currentBrandName = currentBusiness?.name || brandProfile?.name || 'Your Brand';

  const resolveMediaUrl = (url) => {
    if (!url) return '';
    return getFullMediaUrl(url);
  };

  useEffect(() => {
    if (activeItem && activeItem.id) {
      setHeadline(activeItem.headline || activeItem.title || '');
      setCaption(activeItem.caption || '');
      setHashtags(activeItem.hashtags || `#${currentBrandName.replace(/\s+/g, '')} #Fashion #Style`);
      setCta(activeItem.cta || `Visit ${currentBrandName} Store or DM us for direct orders.`);
      setPlatform(activeItem.platform || 'All Connected Channels (Instagram, Facebook & YouTube)');
      setFormat(activeItem.format || (activeItem.contentType === 'video' ? 'Reel / Short Video' : 'Image post'));
      const rawMedia = activeItem.mediaUrl || activeItem.file_url || activeItem.meta_info?.generated_media?.image?.image_url || activeItem.meta_info?.generated_media?.video?.video_url || '';
      setAttachedMediaUrl(rawMedia);
      setAttachedMediaType(activeItem.contentType || activeItem.mediaType || 'image');
      setAttachedMediaName(activeItem.mediaFileName || (activeItem.contentType === 'video' ? 'ai_video.mp4' : 'ai_image.png'));
      setVoiceoverScript(activeItem.voiceoverScript || activeItem.voiceover_script || activeItem.meta_info?.voiceover_script || '');
      setDuration(activeItem.duration || activeItem.meta_info?.duration_seconds ? `${activeItem.duration || activeItem.meta_info?.duration_seconds}s` : '');

      try {
        localStorage.setItem('sacp_active_studio_item', String(activeItem.id));
      } catch {}
    }
  }, [studioItemId, activeItem?.id, currentBrandName]);

  useEffect(() => {
    if (selectedMediaAsset) {
      setAttachedMediaUrl(selectedMediaAsset.file_url);
      setAttachedMediaType(selectedMediaAsset.media_type);
      setAttachedMediaName(selectedMediaAsset.file_name);
      if (selectedMediaAsset.media_type === 'video') {
        setFormat('Reel / Short Video');
      } else {
        setFormat('Image post');
      }
      if (onClearSelectedMedia) onClearSelectedMedia();
    }
  }, [selectedMediaAsset]);

  const openMediaPicker = () => {
    setShowMediaPicker(true);
  };

  const handleSelectMedia = (asset) => {
    setAttachedMediaUrl(asset.file_url);
    setAttachedMediaType(asset.media_type);
    setAttachedMediaName(asset.file_name);
    if (asset.media_type === 'video') {
      setFormat('Reel / Short Video');
    } else {
      setFormat('Image post');
    }
    setShowMediaPicker(false);
    showToast(`Attached "${asset.file_name}" from Media Library!`, 'success');
  };

  const handleRemoveMedia = () => {
    setAttachedMediaUrl('');
    setAttachedMediaName('');
    showToast('Removed attached media.', 'info');
  };

  const isVideoCreative = Boolean(
    attachedMediaType === 'video' ||
    format.toLowerCase().includes('reel') ||
    format.toLowerCase().includes('video') ||
    activeItem.contentType === 'video'
  );

  const previewItem = {
    ...activeItem,
    id: activeItem.id || 'studio-preview',
    title: headline || activeItem?.title || `${currentBrandName} Social Creative`,
    headline: headline || activeItem?.headline || '',
    caption: caption || '',
    hashtags: hashtags || '',
    cta: cta || '',
    platform: platform || activeItem?.platform || 'Instagram',
    format: format || activeItem?.format || (isVideoCreative ? 'Reel / Short Video' : 'Image post'),
    mediaUrl: attachedMediaUrl || activeItem?.mediaUrl || activeItem?.file_url || null,
    thumbnailUrl: attachedMediaUrl || activeItem?.thumbnailUrl || activeItem?.mediaUrl || null,
    mediaType: isVideoCreative ? 'video' : 'image',
    contentType: isVideoCreative ? 'video' : 'image',
    duration: duration || activeItem.duration || null
  };

  const handleSave = async (submitForApproval = false) => {
    setIsSaving(true);
    try {
      const updated = {
        ...activeItem,
        headline,
        title: headline || activeItem.title || 'Brand Social Creative',
        caption,
        hashtags,
        cta,
        platform,
        format,
        mediaUrl: attachedMediaUrl || activeItem.mediaUrl,
        file_url: attachedMediaUrl || activeItem.file_url,
        mediaType: isVideoCreative ? 'video' : 'image',
        contentType: isVideoCreative ? 'video' : 'image',
        mediaFileName: attachedMediaName,
        voiceoverScript: voiceoverScript || activeItem.voiceoverScript,
        ...(submitForApproval ? { status: 'awaiting', approvalStatus: 'awaiting' } : {})
      };
      await saveContentItem(updated);
      showToast(
        submitForApproval
          ? 'Post submitted to Content Approval queue!'
          : 'Studio creative saved successfully to database!',
        'success'
      );
      if (submitForApproval && onNavigate) {
        onNavigate('approval-queue');
      }
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateVariant = async () => {
    setIsGeneratingCopy(true);
    showToast('Generating fresh copy with Google Gemini...', 'info');
    try {
      const prompt = headline || caption || `Engaging social post for ${currentBrandName}`;
      const normalizedPlatform = platform.toLowerCase();
      const res = await api.generations.generateText({
        prompt: `Write an engaging, high-converting social media post caption for ${currentBrandName} based on: ${prompt}. Keep it authentic to brand tone.`,
        brand_profile_id: brandProfile?.id || null,
        content_type: 'caption',
        model_name: 'gemini-2.5-flash'
      });
      if (res.result_data?.caption) {
        setCaption(res.result_data.caption);
        if (res.result_data.headline) setHeadline(res.result_data.headline);
        if (res.result_data.quality_check) {
          setCopyQualityCheck(res.result_data.quality_check);
        }
        showToast('Fresh AI copy generated & verified!', 'success');
      }
    } catch (err) {
      showToast(`Copy generation failed: ${err.message}`, 'error');
    } finally {
      setIsGeneratingCopy(false);
    }
  };

  const handleSuggestTags = async () => {
    showToast('Finding trending hashtags with Google Gemini...', 'info');
    try {
      const res = await api.generations.generateText({
        prompt: `Generate viral trending hashtags for ${currentBrandName} ${headline || 'products and lifestyle'}`,
        brand_profile_id: brandProfile?.id || null,
        content_type: 'hashtags',
        model_name: 'gemini-2.5-flash'
      });
      if (res.result_data?.hashtags && res.result_data.hashtags.length > 0) {
        setHashtags(res.result_data.hashtags.join(' '));
        showToast('Hashtags suggested!', 'success');
      }
    } catch (err) {
      showToast(`Hashtag suggestion failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <DashboardPageHeader
        badge="3. CONTENT STUDIO"
        badgeType="emerald"
        statusBadge="Studio Active"
        title="Content Studio"
        description={`Create from scratch with the multi-channel composer, or inspect, edit, and fine-tune actual generated images, videos, captions, and AI variants for ${currentBrandName}.`}
      >
        {activeStudioTab === 'edit-drafts' && (
          <>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected hover:text-text transition-all shadow-xs btn-smooth cursor-pointer"
            >
              <Save className="w-4 h-4 text-primary" />
              <span>{isSaving ? 'Saving...' : 'Save Draft'}</span>
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 font-bold transition-all shadow-md shadow-primary/20 btn-smooth cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Submit for Approval</span>
            </button>
          </>
        )}
      </DashboardPageHeader>

      {/* Mode Switcher Tabs: Composer vs Drafts Editor */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 rounded-2xl bg-surface border border-border w-full sm:w-fit">
        <button
          type="button"
          onClick={() => setActiveStudioTab('compose')}
          className={`btn-smooth flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeStudioTab === 'compose'
              ? 'bg-primary text-primary-on shadow-xs font-bold'
              : 'text-text-secondary hover:text-text hover:bg-surface-selected'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Multi-Channel Composer</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveStudioTab('edit-drafts')}
          className={`btn-smooth flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeStudioTab === 'edit-drafts'
              ? 'bg-primary text-primary-on shadow-xs font-bold'
              : 'text-text-secondary hover:text-text hover:bg-surface-selected'
          }`}
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Drafts & AI Variants</span>
          {contentItems.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-border">
              {contentItems.length}
            </span>
          )}
        </button>
      </div>

      {activeStudioTab === 'compose' ? (
        <CreatePostView
          onNavigate={onNavigate}
          initialMedia={selectedMediaAsset}
          isEmbedded={true}
        />
      ) : (
        /* Editor & Simulator Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Editor (7 cols) */}
        <SpotlightCard className="lg:col-span-7 p-6 sm:p-7 space-y-5 border-border">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              Post Content Editor
            </h3>
            <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-surface-raised text-text-secondary border border-border">
              Database ID: #{activeItem.dbId || activeItem.id || 'N/A'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                Select Creative from Database
              </label>
              <select
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring text-text cursor-pointer"
                value={studioItemId || activeItem.id || ''}
                onChange={(e) => {
                  const newId = e.target.value;
                  setStudioItemId(newId);
                  try {
                    localStorage.setItem('sacp_active_studio_item', String(newId));
                  } catch {}
                }}
              >
                {contentItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    [#{i.id} • {i.platform} • {i.format}] {i.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Cloud Media Attachment Section */}
            <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  Attached Media Asset
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openMediaPicker}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-surface border border-primary hover:bg-surface-selected transition-all shadow-xs cursor-pointer"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Select Media</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('media-library')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected hover:text-text transition-all shadow-xs cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                  </button>
                </div>
              </div>

              {attachedMediaUrl ? (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-raised shrink-0 border border-border">
                      {isVideoCreative ? (
                        <video
                          src={resolveMediaUrl(attachedMediaUrl)}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={resolveMediaUrl(attachedMediaUrl)}
                          alt="Attached creative"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-text truncate block">
                        {attachedMediaName || (isVideoCreative ? 'Commercial Video Reel' : 'Brand Graphic Asset')}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full border border-border">
                          {isVideoCreative ? 'VIDEO REEL' : 'IMAGE POST'}
                        </span>
                        {duration && (
                          <span className="text-[10px] font-semibold text-text-muted flex items-center gap-0.5">
                            <Clock className="w-3 h-3" />
                            {duration}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveMedia}
                    className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    title="Remove Media"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-text-muted">
                  No media attached. Click "Select Media" to attach an asset from Cloudinary or local storage.
                </p>
              )}
            </div>

            {/* Audio & Voiceover Narration Section for Videos */}
            {isVideoCreative && (
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-primary" />
                    Audio & Voiceover Narration
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-border">
                    Edge Neural Voice Active
                  </span>
                </div>
                <div className="text-xs text-text-secondary">
                  <label className="block text-[11px] font-semibold text-text-muted mb-1">
                    Spoken Narration Script / Teleprompter
                  </label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-xs bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring text-text placeholder:text-text-muted"
                    placeholder="Enter spoken voiceover script for this video..."
                    value={voiceoverScript}
                    onChange={(e) => setVoiceoverScript(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-3 text-[11px] text-text-muted font-medium pt-1">
                  <span className="flex items-center gap-1">
                    <Mic className="w-3.5 h-3.5 text-primary" />
                    Neural Multi-Persona TTS
                  </span>
                  <span>•</span>
                  <span>Ambient Harmonic Soundscape</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">
                1. Post Headline / Opening Hook
              </label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring text-text placeholder:text-text-muted"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Enter opening hook..."
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-text-secondary">2. Main Caption & Body Copy</label>
                <button
                  type="button"
                  onClick={handleGenerateVariant}
                  disabled={isGeneratingCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isGeneratingCopy ? 'Generating...' : 'AI Variant'}</span>
                </button>
              </div>
              <textarea
                rows={4}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring text-text placeholder:text-text-muted"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />
              {copyQualityCheck && (
                <div className="mt-2 p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quality Score: {copyQualityCheck.quality_score || 98}% ({copyQualityCheck.decision || 'PASS'})</span>
                    {copyQualityCheck.retry_count > 0 && (
                      <span className="text-[10px] font-semibold text-primary">
                        • Auto-Regenerated (Attempt {copyQualityCheck.retry_count})
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full">
                    ✓ {copyQualityCheck.duplicate_status || 'Verified Unique'}
                  </span>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-text-secondary">3. Hashtags</label>
                <button
                  type="button"
                  onClick={handleSuggestTags}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Suggest Tags</span>
                </button>
              </div>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring text-text placeholder:text-text-muted"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-secondary mb-1.5">4. Call to Action (CTA)</label>
              <input
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring text-text placeholder:text-text-muted"
                value={cta}
                onChange={(e) => setCta(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Target Platform</label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                >
                  <option value="All Connected Channels (Instagram, Facebook & YouTube)">All Connected Channels (IG, FB & YT)</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Facebook">Facebook</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary mb-1">Post Format</label>
                <select
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring"
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                >
                  <option value="Image post">Image Post</option>
                  <option value="Reel / Short Video">Reel / Short Video</option>
                  <option value="Carousel Slide Deck">Carousel Slide Deck</option>
                  <option value="Text Hook & Announcement">Text Post</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
              <button
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected shadow-xs cursor-pointer"
                onClick={() => handleSave(false)}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-primary bg-primary-soft border border-border hover:bg-surface-selected cursor-pointer"
                onClick={async () => {
                  await handleSave(false);
                  if (activeItem.id) {
                    await approveItem(activeItem.id);
                  }
                  showToast('Post saved and approved directly from Studio!', 'success');
                }}
              >
                Approve
              </button>
              <button
                className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:bg-primary-hover shadow-md shadow-primary/20 font-bold cursor-pointer"
                onClick={() => handleSave(true)}
                disabled={isSaving}
              >
                Send to Queue
              </button>
              <button
                className="flex items-center justify-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-success hover:brightness-105 shadow-md shadow-success/20 cursor-pointer"
                onClick={async () => {
                  await handleSave(false);
                  if (activeItem.id) {
                    await publishItem(activeItem.id);
                  }
                }}
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Publish Live</span>
              </button>
            </div>
          </div>
        </SpotlightCard>

        {/* Right Column: Live Post Simulator (5 cols) */}
        <SpotlightCard className="lg:col-span-5 p-6 sm:p-7 space-y-4 border-border">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h3 className="text-base font-bold text-text flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-primary" />
              Live Post Simulator
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary border border-border">
              {format}
            </span>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs space-y-3 card-smooth">
            {/* Post Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent text-primary-on flex items-center justify-center font-bold text-xs ring-2 ring-border shadow-xs overflow-hidden">
                {brandProfile?.logoUrl ? (
                  <img src={brandProfile.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  (currentBrandName || 'Brand').slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-text leading-tight">
                  {currentBrandName}
                </h4>
                <span className="text-[10px] text-text-muted">Sponsored • Live Preview</span>
              </div>
            </div>

            {/* Media Canvas */}
            <div className="rounded-xl overflow-hidden border border-border bg-surface-raised aspect-video flex items-center justify-center shadow-xs">
              <MediaArtwork item={previewItem} />
            </div>

            {/* Post Actions Row */}
            <div className="flex items-center justify-between py-1 text-text-muted text-xs">
              <div className="flex items-center gap-3">
                <span>1.4K Likes</span>
                <span>48 Comments</span>
                <span>↗️ Share</span>
              </div>
              <span className="text-[11px] font-semibold text-primary">Bookmark</span>
            </div>

            {/* Post Copy */}
            <div className="space-y-1.5 text-xs text-text-secondary leading-relaxed">
              {headline && (
                <p className="font-bold text-text">{headline}</p>
              )}
              <p className="text-text-secondary">{caption || 'Your caption will appear here...'}</p>
              {hashtags && (
                <p className="text-primary font-semibold">{hashtags}</p>
              )}
              {cta && (
                <div className="mt-2 p-2 rounded-lg bg-primary-soft border border-border text-[11px] font-bold text-primary text-center">
                  {cta}
                </div>
              )}
            </div>

            {/* Platform Character Count & Info */}
            <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Characters: {caption.length}
              </span>
              <span className="badge badge--sm badge--success">
                {platform}
              </span>
            </div>
          </div>
        </SpotlightCard>
      </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPickerModal
          onSelect={handleSelectMedia}
          onClose={() => setShowMediaPicker(false)}
        />
      )}
    </div>
  );
}

export default ContentStudioView;
