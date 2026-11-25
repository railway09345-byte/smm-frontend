import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { api, getFullMediaUrl } from '../../../services/api';
import { useToast } from '../../common/Toast';
import { useContent } from '../../../contexts/ContentContext';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Bot,
  Zap,
  Clock,
  Globe,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Calendar,
  Sparkles,
  Layers,
  Check,
  X,
  FileText,
  Sliders,
  History,
  RotateCcw,
  ExternalLink,
  Power,
  Video,
  Copy,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import StatusIndicator from '../../ui/StatusIndicator';
import {
  DEFAULT_TIMEZONE,
  parseUtcToLocalParts,
  combineLocalToUtcIso
} from '../../../utils/datetime';

const TIMEZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST +5:30)' },
  { id: 'UTC', label: 'UTC (GMT +0:00)' },
  { id: 'America/New_York', label: 'America/New_York (EST -5:00)' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (PST -8:00)' },
  { id: 'Europe/London', label: 'Europe/London (BST +1:00)' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai (GST +4:00)' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT +8:00)' },
  { id: 'Australia/Sydney', label: 'Australia/Sydney (AEST +10:00)' }
];

const PLATFORM_ICONS = {
  facebook: '📘',
  instagram: '📸',
  youtube: '▶️'
};

const normalizeContentType = (val) => {
  if (!val) return 'both';
  const s = String(val).toLowerCase().trim();
  if (s === 'image' || s === 'images') return 'image';
  if (s === 'video' || s === 'videos') return 'video';
  return 'both';
};

// FastAPI stores scheduled datetimes as naive UTC values. Explicitly mark
// them as UTC before formatting; otherwise browsers treat them as local time
// and display values five-and-a-half hours early for Asia/Kolkata.
function formatScheduledTime(value, timezone) {
  if (!value) return '—';
  const tz = timezone || DEFAULT_TIMEZONE;
  const raw = String(value);
  const utcValue = /(?:Z|[+-]\d{2}:?\d{2})$/.test(raw) ? raw : `${raw}Z`;
  const parsed = new Date(utcValue);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString([], {
    timeZone: tz,
    dateStyle: 'short',
    timeStyle: 'short'
  });
}

export function AutonomousPipelineHub({ onNavigate }) {
  const { showToast } = useToast();
  const { brandProfile, isAutomationActive, setIsAutomationActive } = useContent();

  const isBrandConfigured = useMemo(() => {
    return Boolean(
      brandProfile &&
      brandProfile.name &&
      brandProfile.name.trim() &&
      brandProfile.industry &&
      brandProfile.industry.trim() &&
      !brandProfile.name.toLowerCase().endsWith("'s brand") &&
      !brandProfile.name.toLowerCase().endsWith("'s workspace") &&
      brandProfile.name.toLowerCase() !== "brand" &&
      brandProfile.name.toLowerCase() !== "brand workspace"
    );
  }, [brandProfile]);

  // Schedule state with explicit generation and posting dates, auto-schedule, and engine status
  const [schedule, setSchedule] = useState(() => {
    try {
      const activeBrandKey = brandProfile?.id || (typeof window !== 'undefined' ? localStorage.getItem('sacp_active_brand_id') : null);
      const cached = activeBrandKey ? localStorage.getItem(`sacp_pipeline_sched_${activeBrandKey}`) : null;
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          parsed.content_type = normalizeContentType(parsed.content_type);
          return parsed;
        }
      }
    } catch (e) {}
    const todayStr = new Date().toISOString().split('T')[0];
    return {
      start_date: todayStr,
      generation_date: todayStr,
      generation_time: '09:00',
      posting_time: '18:00',
      timezone: 'Asia/Kolkata',
      content_type: 'both',
      image_count: 1,
      video_count: 1,
      cadence_days: 1,
      content_preferences: '',
      selected_social_account_ids: [],
      auto_approve: false,
      auto_schedule: true,
      is_active: true,
      target_platforms: ['facebook', 'instagram', 'youtube']
    };
  });
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const scheduleRef = useRef(schedule);
  scheduleRef.current = schedule;
  const autoSaveTimerRef = useRef(null);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [engineStatus, setEngineStatus] = useState(null);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [showJobsDrawer, setShowJobsDrawer] = useState(false);

  // Real-time run stage tracking (persisted across tab switches)
  const [runStageInfo, setRunStageInfo] = useState(() => {
    try {
      const saved = sessionStorage.getItem('sacp_active_run_stage');
      return saved ? JSON.parse(saved) : { stage: null, progress: 0 };
    } catch {
      return { stage: null, progress: 0 };
    }
  });

  // Posts & review queue state
  const [posts, setPosts] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [pipelineRuns, setPipelineRuns] = useState([]);
  const [isRunningNow, setIsRunningNow] = useState(() => {
    try {
      return sessionStorage.getItem('sacp_pipeline_running') === 'true';
    } catch {
      return false;
    }
  });

  // Selected post & platform preview
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [activePlatformTabs, setActivePlatformTabs] = useState({});

  // Modals & Inline edits
  const [editModalPost, setEditModalPost] = useState(null);
  const [editFormData, setEditFormData] = useState({ caption: '', hashtags: '', title: '' });
  const [isRegeneratingPart, setIsRegeneratingPart] = useState(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rescheduleModalPost, setRescheduleModalPost] = useState(null);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '18:00' });
  const [isRetryingPost, setIsRetryingPost] = useState(false);

  // 1. Data Fetching
  const loadSchedule = useCallback(async () => {
    try {
      const [settingsData, statusData, jobsData] = await Promise.all([
        api.automation.getSettings(brandProfile?.id).catch(() => null),
        api.automation.getStatus(brandProfile?.id).catch(() => null),
        api.automation.getJobs(brandProfile?.id).catch(() => [])
      ]);
      if (settingsData) {
        const normalized = {
          ...settingsData,
          content_type: normalizeContentType(settingsData.content_type)
        };
        setSchedule(normalized);
        scheduleRef.current = normalized;
        if (setIsAutomationActive && typeof normalized.is_active === 'boolean') {
          setIsAutomationActive(normalized.is_active);
        }
        const activeBrandKey = brandProfile?.id || (typeof window !== 'undefined' ? localStorage.getItem('sacp_active_brand_id') : null);
        if (activeBrandKey) {
          localStorage.setItem(`sacp_pipeline_sched_${activeBrandKey}`, JSON.stringify(normalized));
        }
      }
      if (statusData) setEngineStatus(statusData);
      if (jobsData) setScheduledJobs(jobsData);
    } catch (err) {
      console.warn('Failed to load automation settings:', err);
    }
  }, [brandProfile?.id]);

  const loadPosts = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingPosts(true);
    try {
      const data = await api.automation.getReviewQueue(activeFilter, brandProfile?.id);
      const postList = Array.isArray(data) ? data : [];
      setPosts(postList);
      if (postList.length > 0) {
        setSelectedPostId(prev => (!prev || !postList.some(p => p.id === prev)) ? postList[0].id : prev);
      }
    } catch (err) {
      if (err?.name === 'AbortError' || err?.status === 499 || err?.message?.toLowerCase().includes('cancelled') || err?.message?.toLowerCase().includes('aborted')) {
        return;
      }
      console.warn('Failed to load review queue:', err);
      if (!isSilent) {
        setPosts([]);
      }
      // Only notify user if intentional manual fetch and error is not an expected transient code
      if (!isSilent && brandProfile?.id && err?.status && err.status !== 404 && err.status !== 401 && err.status !== 403) {
        showToast('Review queue temporarily unavailable. Please retry.', 'warning');
      }
    } finally {
      if (!isSilent) setIsLoadingPosts(false);
    }
  }, [activeFilter, showToast, brandProfile?.id]);

  const loadAccounts = useCallback(async () => {
    if (!brandProfile?.id) return;
    setIsLoadingAccounts(true);
    try {
      const res = await api.socialAccounts.list(brandProfile.id);
      setSocialAccounts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Failed to load social accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  }, [brandProfile?.id]);

  const loadRuns = useCallback(async () => {
    try {
      const runs = await api.automation.getLogs(brandProfile?.id);
      setPipelineRuns(runs || []);
    } catch (err) {
      console.warn('Failed to load automation logs:', err);
    }
  }, [brandProfile?.id]);

  useEffect(() => {
    loadSchedule();
    loadRuns();
    loadAccounts();
  }, [loadSchedule, loadRuns, loadAccounts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Persistent background sync: refresh queue, schedule and engine status
  useEffect(() => {
    const intervalId = window.setInterval(() => {
      // Pause routine background sync while a live manual generation run is executing
      if (isRunningNow) return;
      loadPosts(true);
      loadRuns();
      loadSchedule();
    }, 6000);
    return () => window.clearInterval(intervalId);
  }, [loadPosts, loadRuns, loadSchedule, isRunningNow]);

  // 2. Action Handlers & Auto-Save
  const saveScheduleToBackend = useCallback(async (scheduleToSave, showFeedback = false) => {
    if (!scheduleToSave) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const resolvedStartDate = scheduleToSave.start_date || scheduleToSave.generation_date || todayStr;
    const resolvedContentType = normalizeContentType(scheduleToSave.content_type);

    let resolvedImageCount = Number(scheduleToSave.image_count ?? 1);
    let resolvedVideoCount = Number(scheduleToSave.video_count ?? 1);
    if (resolvedContentType === 'image') {
      resolvedImageCount = Math.max(1, resolvedImageCount);
      resolvedVideoCount = 0;
    } else if (resolvedContentType === 'video') {
      resolvedImageCount = 0;
      resolvedVideoCount = Math.max(1, resolvedVideoCount);
    } else {
      resolvedImageCount = Math.max(1, resolvedImageCount);
      resolvedVideoCount = Math.max(1, resolvedVideoCount);
    }

    const payload = {
      start_date: resolvedStartDate,
      generation_date: resolvedStartDate,
      generation_time: scheduleToSave.generation_time || '09:00',
      posting_time: scheduleToSave.posting_time || '18:00',
      timezone: scheduleToSave.timezone || 'Asia/Kolkata',
      content_type: resolvedContentType,
      image_count: resolvedImageCount,
      video_count: resolvedVideoCount,
      cadence_days: Number(scheduleToSave.cadence_days ?? 1),
      content_preferences: scheduleToSave.content_preferences || null,
      selected_social_account_ids: scheduleToSave.selected_social_account_ids || [],
      auto_approve: Boolean(scheduleToSave.auto_approve),
      auto_schedule: scheduleToSave.auto_schedule ?? true,
      is_active: scheduleToSave.is_active ?? true,
      target_platforms: scheduleToSave.target_platforms || ['facebook', 'instagram', 'youtube']
    };

    if (showFeedback) setIsSavingSchedule(true);
    try {
      const saved = await api.automation.updateSettings(payload, brandProfile?.id);
      if (saved) {
        const normalizedSaved = {
          ...saved,
          content_type: normalizeContentType(saved.content_type)
        };
        setSchedule(normalizedSaved);
        scheduleRef.current = normalizedSaved;
        const activeBrandKey = brandProfile?.id || (typeof window !== 'undefined' ? localStorage.getItem('sacp_active_brand_id') : null);
        if (activeBrandKey) {
          localStorage.setItem(`sacp_pipeline_sched_${activeBrandKey}`, JSON.stringify(normalizedSaved));
        }
      }
      if (showFeedback) {
        showToast('Automation settings saved and daily schedule re-synchronized!', 'success');
      }
      loadSchedule();
    } catch (err) {
      if (showFeedback) {
        showToast('Failed to save settings: ' + err.message, 'error');
      }
    } finally {
      if (showFeedback) setIsSavingSchedule(false);
    }
  }, [brandProfile?.id, loadSchedule, showToast]);

  const handleContentTypeSelect = useCallback((selectedType) => {
    const normalized = normalizeContentType(selectedType);
    setSchedule(prev => {
      let nextImageCount = prev.image_count ?? 1;
      let nextVideoCount = prev.video_count ?? 1;
      if (normalized === 'image') {
        nextImageCount = Math.max(1, Number(nextImageCount || 1));
        nextVideoCount = 0;
      } else if (normalized === 'video') {
        nextImageCount = 0;
        nextVideoCount = Math.max(1, Number(nextVideoCount || 1));
      } else {
        nextImageCount = Math.max(1, Number(nextImageCount || 1));
        nextVideoCount = Math.max(1, Number(nextVideoCount || 1));
      }

      const next = {
        ...prev,
        content_type: normalized,
        image_count: nextImageCount,
        video_count: nextVideoCount
      };
      scheduleRef.current = next;
      const activeBrandKey = brandProfile?.id || (typeof window !== 'undefined' ? localStorage.getItem('sacp_active_brand_id') : null);
      if (activeBrandKey) {
        localStorage.setItem(`sacp_pipeline_sched_${activeBrandKey}`, JSON.stringify(next));
      }
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
      saveScheduleToBackend(next, false);
      return next;
    });
  }, [brandProfile?.id, saveScheduleToBackend]);

  const handleScheduleFieldChange = useCallback((field, value) => {
    setSchedule(prev => {
      const next = { ...prev, [field]: value };
      if (field === 'start_date') {
        next.generation_date = value;
      } else if (field === 'generation_date') {
        next.start_date = value;
      }
      scheduleRef.current = next;
      if (brandProfile?.id) {
        localStorage.setItem(`sacp_pipeline_sched_${brandProfile.id}`, JSON.stringify(next));
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveScheduleToBackend(next, false);
      }, 1000);
      return next;
    });
  }, [brandProfile?.id, saveScheduleToBackend]);

  const flushScheduleSave = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }
    saveScheduleToBackend(scheduleRef.current, false);
  }, [saveScheduleToBackend]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
        saveScheduleToBackend(scheduleRef.current, false);
      }
    };
  }, [saveScheduleToBackend]);

  const handleToggleAccount = useCallback((accountId) => {
    setSchedule(prev => {
      const current = Array.isArray(prev.selected_social_account_ids) ? [...prev.selected_social_account_ids] : [];
      const idx = current.indexOf(accountId);
      let updated;
      if (idx > -1) {
        updated = current.filter(id => id !== accountId);
      } else {
        updated = [...current, accountId];
      }
      const next = { ...prev, selected_social_account_ids: updated };
      scheduleRef.current = next;
      if (brandProfile?.id) {
        localStorage.setItem(`sacp_pipeline_sched_${brandProfile.id}`, JSON.stringify(next));
      }
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveScheduleToBackend(next, false);
      }, 1000);
      return next;
    });
  }, [brandProfile?.id, saveScheduleToBackend]);

  const handleSaveSchedule = async () => {
    // Validation: Timezone must be valid
    if (!TIMEZONES.some(tz => tz.id === schedule.timezone)) {
      showToast('Please select a valid timezone from the supported list.', 'error');
      return;
    }

    await saveScheduleToBackend(schedule, true);
    await Promise.all([loadPosts(), loadRuns(), loadAccounts()]);
  };

  const handleToggleEngine = async () => {
    try {
      if (schedule.is_active) {
        await api.automation.pause(brandProfile?.id);
        setSchedule(prev => ({ ...prev, is_active: false }));
        if (setIsAutomationActive) setIsAutomationActive(false);
        showToast('Automation scheduler paused.', 'info');
      } else {
        await api.automation.enable(brandProfile?.id);
        setSchedule(prev => ({ ...prev, is_active: true }));
        if (setIsAutomationActive) setIsAutomationActive(true);
        showToast('Automation scheduler enabled and active!', 'success');
      }
      await loadSchedule();
    } catch (err) {
      showToast('Failed to toggle automation: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    if (typeof isAutomationActive === 'boolean') {
      setSchedule(prev => (prev.is_active !== isAutomationActive ? { ...prev, is_active: isAutomationActive } : prev));
    }
  }, [isAutomationActive]);

  const handleTriggerRunNow = async () => {
    if (!isBrandConfigured) {
      showToast('Brand details are required: Please configure your Brand Name and Industry in Brand Profile before generating the autonomous pipeline.', 'warning');
      if (onNavigate) onNavigate('brand-profile');
      return;
    }
    setIsRunningNow(true);
    try { sessionStorage.setItem('sacp_pipeline_running', 'true'); } catch {}
    const initialStage = { stage: 'Initializing', progress: 10 };
    setRunStageInfo(initialStage);
    try { sessionStorage.setItem('sacp_active_run_stage', JSON.stringify(initialStage)); } catch {}
    try {
      showToast('Synthesizing today\'s autonomous package. Live stages active...', 'info');

      // Poll status for live execution stage tracking without request piling
      let isPollPending = false;
      const pollTimer = setInterval(async () => {
        if (isPollPending) return;
        isPollPending = true;
        try {
          const st = await api.automation.getStatus(brandProfile?.id);
          if (st) {
            setEngineStatus(st);
            if (st.current_stage) {
              const currentInfo = {
                stage: st.current_stage,
                progress: st.current_progress || 50
              };
              setRunStageInfo(currentInfo);
              try { sessionStorage.setItem('sacp_active_run_stage', JSON.stringify(currentInfo)); } catch {}
            }
          }
        } catch (e) {
          if (e?.name !== 'AbortError' && e?.status !== 499 && !e?.message?.toLowerCase().includes('cancelled')) {
            console.warn('Status polling error:', e);
          }
        } finally {
          isPollPending = false;
        }
      }, 2500);

      const res = await api.automation.runNow({
        force: true,
        brand_profile_id: brandProfile?.id
      });
      clearInterval(pollTimer);
      setRunStageInfo({ stage: 'Completed', progress: 100 });
      showToast(res.message || 'Pipeline executed successfully!', 'success');
      await Promise.all([loadSchedule(), loadPosts(), loadRuns()]);
    } catch (err) {
      showToast('Pipeline execution failed: ' + err.message, 'error');
      setRunStageInfo({ stage: 'Failed', progress: 0 });
    } finally {
      setIsRunningNow(false);
      try {
        sessionStorage.removeItem('sacp_pipeline_running');
        sessionStorage.removeItem('sacp_active_run_stage');
      } catch {}
      setTimeout(() => setRunStageInfo({ stage: null, progress: 0 }), 6000);
    }
  };

  const [isClearing, setIsClearing] = useState(false);

  const handleClearPipeline = async () => {
    if (!window.confirm("Are you sure you want to clean the pipeline queue? This will delete previous test runs and drafts so your daily schedule starts completely fresh.")) {
      return;
    }
    setIsClearing(true);
    try {
      const res = await api.automation.clear(brandProfile?.id);
      showToast(res.message || 'Pipeline cleaned! Ready for fresh daily scheduling.', 'success');
      try {
        sessionStorage.removeItem('sacp_pipeline_running');
        sessionStorage.removeItem('sacp_active_run_stage');
      } catch {}
      setRunStageInfo({ stage: null, progress: 0 });
      await Promise.all([loadPosts(), loadRuns(), loadSchedule()]);
    } catch (err) {
      showToast('Failed to clean pipeline: ' + err.message, 'error');
    } finally {
      setIsClearing(false);
    }
  };

  const handleApprove = async (postId) => {
    try {
      await api.automation.approveContent(postId);
      showToast('Content approved and scheduled for publishing!', 'success');
      loadPosts();
      loadSchedule();
    } catch (err) {
      showToast('Failed to approve content: ' + err.message, 'error');
    }
  };

  const handleReject = async () => {
    if (!selectedPostId) return;
    try {
      await api.automation.rejectContent(selectedPostId, rejectReason);
      showToast('Content rejected.', 'info');
      setRejectModalOpen(false);
      setRejectReason('');
      loadPosts();
    } catch (err) {
      showToast('Failed to reject content: ' + err.message, 'error');
    }
  };

  const handleSaveDraft = async (postId) => {
    try {
      await api.pipeline.saveDraft(postId);
      showToast('Content saved as draft.', 'info');
      loadPosts();
    } catch (err) {
      showToast('Failed to save draft: ' + err.message, 'error');
    }
  };

  const handleOpenReschedule = (post) => {
    setRescheduleModalPost(post);
    const tz = schedule?.timezone || DEFAULT_TIMEZONE;
    const targetTime = post?.scheduled_time || (post?.variants && post.variants[0]?.scheduled_time);
    const parts = parseUtcToLocalParts(targetTime || new Date().toISOString(), tz);
    setRescheduleForm({
      date: parts.date || new Date().toISOString().split('T')[0],
      time: parts.time || '18:00'
    });
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModalPost || !rescheduleForm.date || !rescheduleForm.time) {
      showToast('Please specify a valid future date and time.', 'error');
      return;
    }
    const tz = schedule?.timezone || DEFAULT_TIMEZONE;
    const utcIso = combineLocalToUtcIso(rescheduleForm.date, rescheduleForm.time, tz);
    if (!utcIso) {
      showToast('Invalid date or time specified.', 'error');
      return;
    }
    try {
      const updatedPost = await api.automation.rescheduleContent(rescheduleModalPost.id, utcIso, tz);
      showToast('Content rescheduled successfully!', 'success');
      setRescheduleModalPost(null);
      if (updatedPost && updatedPost.id) {
        setPosts(prev => prev.map(p => p.id === updatedPost.id ? { ...p, ...updatedPost } : p));
      }
      await Promise.all([loadPosts(true), loadSchedule()]);
    } catch (err) {
      showToast('Failed to reschedule content: ' + (err.message || 'Unknown error'), 'error');
    }
  };

  const handleRetry = async (postId, platform = null) => {
    setIsRetryingPost(true);
    try {
      showToast('Initiating platform publishing retry...', 'info');
      const res = await api.automation.retryContent(postId, platform);
      showToast(res.message || 'Retry initiated.', 'success');
      window.dispatchEvent(new CustomEvent('post:published', { detail: { postId } }));
      await Promise.all([loadPosts(), loadSchedule()]);
    } catch (err) {
      showToast('Retry publication failed: ' + err.message, 'error');
    } finally {
      setIsRetryingPost(false);
    }
  };

  const handleRegenerate = async (postId, component) => {
    setIsRegeneratingPart(component);
    try {
      await api.pipeline.regeneratePart(postId, component);
      showToast(`Regenerated ${component} successfully!`, 'success');
      loadPosts();
    } catch (err) {
      showToast(`Failed to regenerate ${component}: ` + err.message, 'error');
    } finally {
      setIsRegeneratingPart(null);
    }
  };

  const handleOpenEdit = (post, variant) => {
    setEditModalPost({ post, variant });
    setEditFormData({
      caption: variant.caption || '',
      hashtags: (variant.hashtags || []).join(' '),
      title: variant.title || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editModalPost) return;
    try {
      const hashtagsArray = editFormData.hashtags.split(/[\s,]+/).filter(h => h.startsWith('#'));
      await api.automation.editContent(editModalPost.post.id, {
        caption: editFormData.caption,
        title: editFormData.title || null,
        hashtags: hashtagsArray.length ? hashtagsArray : undefined
      });
      showToast('Content variant updated successfully!', 'success');
      setEditModalPost(null);
      loadPosts();
    } catch (err) {
      showToast('Failed to update variant: ' + err.message, 'error');
    }
  };

  const [copiedField, setCopiedField] = useState(null);

  const handleCopyText = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`, 'success');
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleApplyMediaAsset = async (asset) => {
    if (!currentVariant || !asset?.file_path) return;
    try {
      const updateFn = api.pipeline?.updateVariant || api.autonomousPipeline?.updateVariant;
      if (updateFn) {
        await updateFn(currentVariant.id, {
          media_path: asset.file_path,
          media_type: asset.type,
          aspect_ratio: asset.aspect_ratio
        });
      }
      showToast(`Applied ${asset.aspect_ratio} ${asset.type} to ${currentVariant.platform}!`, 'success');
      loadPosts();
    } catch (err) {
      showToast('Failed to apply media: ' + err.message, 'error');
    }
  };

  const selectedPost = posts.find(p => p.id === selectedPostId) || posts[0];

  const availableMediaAssets = useMemo(() => {
    if (!selectedPost) return [];
    const map = new Map();
    const isVideoFile = (type, path) => type === 'video' || (path && (path.includes('/video/') || path.endsWith('.mp4')));
    if (Array.isArray(selectedPost.assets)) {
      selectedPost.assets.forEach(a => {
        if (a && a.file_path && !map.has(a.file_path)) {
          const isVid = isVideoFile(a.type, a.file_path);
          map.set(a.file_path, {
            id: a.id,
            type: isVid ? 'video' : 'image',
            aspect_ratio: a.aspect_ratio || (isVid ? '9:16' : '1:1'),
            file_path: a.file_path
          });
        }
      });
    }
    if (Array.isArray(selectedPost.variants)) {
      selectedPost.variants.forEach(v => {
        if (v && v.media_path && !map.has(v.media_path)) {
          const isVid = isVideoFile(v.media_type, v.media_path);
          map.set(v.media_path, {
            id: `var-${v.id}`,
            type: isVid ? 'video' : 'image',
            aspect_ratio: v.aspect_ratio || (isVid ? '9:16' : '1:1'),
            file_path: v.media_path
          });
        }
      });
    }
    return Array.from(map.values());
  }, [selectedPost]);

  const activePlatform = (selectedPost && activePlatformTabs[selectedPost.id]) || 
    (selectedPost && selectedPost.variants && selectedPost.variants[0]?.platform) || 'instagram';

  const currentVariant = selectedPost?.variants?.find(v => v.platform === activePlatform) || selectedPost?.variants?.[0];

  return (
    <div className="space-y-6">
      {/* 1. Header & Scheduler Command Center */}
      <DashboardPageHeader
        badge="2. STRATEGY & GENERATION" badgeType="indigo" statusBadge="Dual Engine & APScheduler Active" title="Autonomous Social AI Pipeline" description="Zero manual prompt engineering. Gemini AI inspects your brand identity, discovers high-performing topics, synthesizes multi-aspect visuals, and schedules posts automatically." >
        <div className="flex items-center gap-2">
          <button
            onClick={handleClearPipeline}
            disabled={isClearing || isRunningNow}
            title="Clean old runs and reset pipeline queue"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 transition-all border border-stone-200 dark:border-stone-700 active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-stone-500" />
            <span>{isClearing ? 'Cleaning...' : 'Clean Pipeline'}</span>
          </button>
          <button
            onClick={handleTriggerRunNow}
            disabled={isRunningNow || !isBrandConfigured}
            title={!isBrandConfigured ? "Please configure your Brand Profile first" : "Run Pipeline Now"}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/25 disabled:opacity-60 disabled:cursor-not-allowed" >
            {isRunningNow ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                <span>{runStageInfo.stage ? `${runStageInfo.stage} (${runStageInfo.progress}%)` : "Synthesizing Today's Post..."}</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-accent" />
                <span>Run Pipeline Now</span>
              </>
            )}
          </button>
        </div>
      </DashboardPageHeader>

      {/* Incomplete Brand Profile Banner */}
      {!isBrandConfigured && (
        <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-warning dark:text-accent">Brand Profile Incomplete</h4>
              <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5">
                The Autonomous Pipeline requires your actual Brand Name and Industry before generating posts. Content generation is currently paused to prevent generating unrelated business content.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate && onNavigate('brand-profile')}
            className="flex-shrink-0 px-4 py-2 text-xs font-semibold rounded-xl bg-warning text-black hover:bg-amber-400 transition-colors shadow-sm"
          >
            Configure Brand Profile →
          </button>
        </div>
      )}

      {/* Schedule Controls SpotlightCard */}
      <SpotlightCard className="p-6 sm:p-7 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
          <div className="flex items-center gap-2.5">
            <StatusIndicator status={schedule.is_active ? 'active' : 'idle'} size="sm" />
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-base font-bold text-text dark:text-white">Automation Scheduler Engine</h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
              schedule.is_active 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60' 
                : 'bg-surface-selected text-text-muted border-border dark:bg-surface dark:text-text-muted dark:border-border'
            }`}>
              {schedule.is_active ? 'APScheduler Active' : 'Scheduler Paused'}
            </span>
            {engineStatus?.is_leader && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-on-primary-soft border border-border">
                Leader Worker
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleEngine}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                schedule.is_active 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60' 
                  : 'bg-warning/10 text-warning border-warning/40 hover:bg-warning/20'
              }`}
              title="Toggle automatic scheduler runs"
            >
              <Power className="w-3.5 h-3.5" />
              <span>{schedule.is_active ? 'Engine: Active' : 'Engine: Paused'}</span>
            </button>
            <button
              onClick={() => setShowJobsDrawer(!showJobsDrawer)}
              className="text-xs font-semibold text-primary bg-bg hover:bg-primary/10 dark:hover:bg-surface px-2.5 py-1 rounded-full border border-border flex items-center gap-1.5 transition-all"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Jobs ({scheduledJobs.length})</span>
            </button>
          </div>
        </div>

        {/* Live Stage Execution Banner */}
        {runStageInfo.stage && (
          <div className="p-4 rounded-xl bg-surface border border-border shadow-xs space-y-2.5 animate-in fade-in-50">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary animate-spin" />
                <span>Autonomous Pipeline: <strong>{runStageInfo.stage}</strong></span>
              </span>
              <span className="font-semibold text-primary">{runStageInfo.progress}%</span>
            </div>
            <div className="w-full bg-border h-2 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${runStageInfo.progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-text-secondary font-medium">
              <span>Brand Profile</span>
              <span>Content Synthesizer</span>
              <span>Multi-Ratio Media</span>
              <span>Quality Audit</span>
              <span>Publishing Queue</span>
            </div>
          </div>
        )}

        {/* Live Engine Status Summary Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-raised border border-border text-xs">
          <div className="space-y-0.5">
            <span className="text-text-muted text-[11px] block font-medium">Daily Recurring Posting Slot:</span>
            <span className="font-semibold text-text flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {schedule.next_posting_time 
                ? formatScheduledTime(schedule.next_posting_time, schedule.timezone)
                : `Daily at ${schedule.posting_time || '18:00'} (${schedule.timezone || 'Asia/Kolkata'})`}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-text-muted text-[11px] block font-medium">Content Format:</span>
            <span className="font-semibold text-text flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              {schedule.content_type === 'image' ? 'Images Only' : schedule.content_type === 'video' ? 'Video' : 'Images + Video'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-text-muted text-[11px] block font-medium">Today's Automation Status:</span>
            {schedule.today_post_url || engineStatus?.last_post_url ? (
              <a 
                href={schedule.today_post_url || engineStatus?.last_post_url} 
                target="_blank" 
                rel="noreferrer" 
                className="font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Post Published Live</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (schedule.today_run_status === 'running' || engineStatus?.engine_status === 'running') ? (
              <span className="font-bold text-warning dark:text-accent flex items-center gap-1 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing ({engineStatus?.current_stage || 'In Progress'})...</span>
              </span>
            ) : (schedule.today_post_status === 'scheduled' || engineStatus?.last_post_status === 'scheduled') ? (
              <span className="font-bold text-primary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Post Scheduled for Today ({schedule.posting_time || '18:00'})</span>
              </span>
            ) : (
              <span className="font-medium text-text-secondary dark:text-text-secondary">
                Awaiting daily generation at {schedule.generation_time || '09:00'} ({schedule.timezone || 'Asia/Kolkata'})
              </span>
            )}
          </div>
        </div>

        {/* User Scheduling & Autonomous Engine Controls */}
        <div className="space-y-4">
          {/* Row 1: Generation, posting, format, timezone, and engine controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-start">
            <div className="lg:col-span-2 flex flex-col">
              <label className="h-5 flex items-center text-xs font-semibold text-text mb-1.5 truncate">
                Start Date
              </label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={schedule.start_date || schedule.generation_date || new Date().toISOString().split('T')[0]}
                onChange={(e) => handleScheduleFieldChange('start_date', e.target.value)}
                onBlur={flushScheduleSave}
                className="w-full h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="h-4 text-[10px] text-text-muted mt-1 block truncate">
                First automation date
              </span>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="h-5 flex items-center text-xs font-semibold text-text mb-1.5 truncate">
                1. Generate at
              </label>
              <input
                type="time"
                value={schedule.generation_time || '09:00'}
                onChange={(e) => handleScheduleFieldChange('generation_time', e.target.value)}
                onBlur={flushScheduleSave}
                className="w-full h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="h-4 text-[10px] text-text-muted mt-1 block truncate">
                Create the daily package
              </span>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="h-5 flex items-center text-xs font-semibold text-text mb-1.5 truncate">
                2. Post at
              </label>
              <input
                type="time"
                value={schedule.posting_time || '18:00'}
                onChange={(e) => handleScheduleFieldChange('posting_time', e.target.value)}
                onBlur={flushScheduleSave}
                className="w-full h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="h-4 text-[10px] text-text-muted mt-1 block truncate">
                Publish only after approval
              </span>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="h-5 flex items-center text-xs font-semibold text-text mb-1.5 truncate">
                3. Content Type
              </label>
              <div className="w-full h-[42px] grid grid-cols-3 gap-1 p-1 bg-surface-raised rounded-xl border border-border items-center">
                {[
                  { id: 'image', label: 'Images' },
                  { id: 'video', label: 'Video' },
                  { id: 'both', label: 'Both' }
                ].map(ct => {
                  const isActive = normalizeContentType(schedule.content_type) === ct.id;
                  return (
                    <button
                      key={ct.id}
                      type="button"
                      onClick={() => handleContentTypeSelect(ct.id)}
                      className={`h-full py-0 px-1 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center flex items-center justify-center ${
                        isActive
                          ? 'bg-primary text-primary-on shadow-xs font-semibold'
                          : 'text-text-secondary hover:bg-surface-selected'
                      }`}
                    >
                      {ct.label}
                    </button>
                  );
                })}
              </div>
              <span className="h-4 text-[10px] text-text-muted mt-1 block truncate">
                Format preference
              </span>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="h-5 flex items-center text-xs font-semibold text-text mb-1.5 truncate">
                4. Timezone
              </label>
              <select
                value={schedule.timezone || 'Asia/Kolkata'}
                onChange={(e) => handleScheduleFieldChange('timezone', e.target.value)}
                className="w-full h-[42px] px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.id} value={tz.id} className="bg-surface text-text">{tz.label}</option>
                ))}
              </select>
              <span className="h-4 text-[10px] text-text-muted mt-1 block truncate">
                Publishing timezone
              </span>
            </div>

            <div className="lg:col-span-2 flex flex-col">
              <label className="h-5 flex items-center text-xs font-semibold text-text mb-1.5 truncate">
                Engine & Action
              </label>
              <div className="w-full h-[42px] flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleEngine}
                  className={`flex-1 h-full px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                    schedule.is_active 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' 
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800/60 hover:bg-rose-100 dark:hover:bg-rose-900/50'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{schedule.is_active ? 'Active' : 'Paused'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => saveScheduleToBackend(schedule, true)}
                  disabled={isSavingSchedule}
                  className="flex-1 h-full px-2 rounded-xl text-xs font-bold text-white bg-primary hover:brightness-110 active:scale-95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-1 disabled:opacity-60 cursor-pointer"
                >
                  {isSavingSchedule ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>{isSavingSchedule ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
              <span className="h-4 text-[10px] text-text-muted dark:text-[#6B7085] mt-1 block truncate">
                Toggle / Sync schedule
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <label className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8]">
              Images per package
              <input type="number" min="0" max="4" value={schedule.image_count ?? 1}
                onChange={(e) => handleScheduleFieldChange('image_count', e.target.value)} onBlur={flushScheduleSave}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-surface border border-border dark:border-border" />
            </label>
            <label className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8]">
              Videos per package
              <input type="number" min="0" max="2" value={schedule.video_count ?? 1}
                onChange={(e) => handleScheduleFieldChange('video_count', e.target.value)} onBlur={flushScheduleSave}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-surface border border-border dark:border-border" />
            </label>
            <label className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8]">
              Generate every (days)
              <input type="number" min="1" max="30" value={schedule.cadence_days ?? 1}
                onChange={(e) => handleScheduleFieldChange('cadence_days', e.target.value)} onBlur={flushScheduleSave}
                className="mt-1 w-full px-3 py-2 rounded-xl text-sm bg-surface border border-border dark:border-border" />
            </label>
          </div>

          {/* Row 2: Connected Social Accounts Selection */}
          <div className="p-3.5 rounded-xl bg-surface border border-border dark:border-border space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8] flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-primary dark:text-accent" />
                <span>Target Social Accounts to Auto-Publish</span>
              </label>
              <span className="text-[11px] text-text-muted dark:text-[#6B7085]">
                {Array.isArray(schedule.selected_social_account_ids) && schedule.selected_social_account_ids.length > 0
                  ? `${schedule.selected_social_account_ids.length} selected`
                  : 'All connected accounts'}
              </span>
            </div>

            {socialAccounts.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {socialAccounts.map(acc => {
                  const isSelected = Array.isArray(schedule.selected_social_account_ids) && schedule.selected_social_account_ids.includes(acc.id);
                  return (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleToggleAccount(acc.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-primary text-primary-on border-primary shadow-xs'
                          : 'bg-white dark:bg-surface text-text-secondary dark:text-text-secondary border-border dark:border-border hover:border-border'
                      }`}
                    >
                      <span>{PLATFORM_ICONS[acc.platform?.toLowerCase()] || '🌐'}</span>
                      <span className="capitalize">{acc.platform}</span>
                      {acc.account_handle && (
                        <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-text-muted dark:text-[#6B7085]'}`}>
                          @{acc.account_handle.replace(/^@/, '')}
                        </span>
                      )}
                      {isSelected ? <Check className="w-3 h-3 ml-0.5" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between py-1 text-xs text-text-muted dark:text-text-secondary">
                <span>No official social accounts connected yet. Connect your Instagram, Facebook, LinkedIn or YouTube in Settings.</span>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('social-accounts')}
                  className="text-xs font-semibold text-primary dark:text-accent hover:underline cursor-pointer"
                >
                  Connect Accounts →
                </button>
              </div>
            )}
          </div>

          {/* Row 3: Content Preferences & AI Instructions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8] flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-primary dark:text-accent" />
                <span>Content Preferences & Custom Directives</span>
              </label>
              <span className="text-[10px] text-text-muted dark:text-[#6B7085]">
                AI will strictly apply these instructions to daily generation
              </span>
            </div>
            <textarea
              rows={2}
              value={schedule.content_preferences || ''}
              onChange={(e) => handleScheduleFieldChange('content_preferences', e.target.value)}
              onBlur={flushScheduleSave}
              placeholder="E.g., Highlight Swiss horology craftsmanship, dramatic high-contrast aesthetics, trending luxury tags, focus on our new Autumn collection..."
              className="w-full px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border dark:border-border text-text dark:text-[#F3F4F8] placeholder-slate-400 dark:placeholder-[#6B7085]/60 resize-none"
            />
          </div>

          {/* Row 4: Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border dark:border-border">
              <div>
                <span className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8] block">Content Approval</span>
                <span className="text-[11px] text-text-muted dark:text-[#6B7085]">
                  {schedule.auto_approve ? 'Auto-approve posts immediately upon generation' : 'Hold generated posts in review queue for manual signoff'}
                </span>
              </div>
              <input
                type="checkbox"
                id="auto-approve-toggle"
                checked={schedule.auto_approve}
                onChange={(e) => handleScheduleFieldChange('auto_approve', e.target.checked)}
                className="w-4 h-4 text-primary rounded cursor-pointer accent-primary"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-border dark:border-border">
              <div>
                <span className="text-xs font-bold text-text-secondary dark:text-[#F3F4F8] block">Publishing Mode</span>
                <span className="text-[11px] text-text-muted dark:text-[#6B7085]">
                  {(schedule.auto_schedule ?? true) ? 'Auto-publish to selected accounts when due' : 'Manual release required for social dispatch'}
                </span>
              </div>
              <input
                type="checkbox"
                id="auto-schedule-toggle"
                checked={schedule.auto_schedule ?? true}
                onChange={(e) => handleScheduleFieldChange('auto_schedule', e.target.checked)}
                className="w-4 h-4 text-primary rounded cursor-pointer accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Upcoming Registered APScheduler Jobs Drawer */}
        {showJobsDrawer && (
          <div className="p-4 rounded-xl bg-surface border border-border dark:border-border space-y-3 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-2 border-b border-border dark:border-border">
              <span className="text-xs font-bold text-text dark:text-[#F3F4F8] flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary dark:text-accent" />
                Upcoming APScheduler Triggers ({scheduledJobs.length})
              </span>
              <button
                onClick={() => setShowJobsDrawer(false)}
                className="text-text-muted dark:text-text-secondary/70 hover:text-text-secondary dark:hover:text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
            {scheduledJobs.length === 0 ? (
              <p className="text-xs text-text-muted dark:text-text-secondary py-2">No active scheduler jobs registered for this workspace yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {scheduledJobs.map(j => (
                  <div key={j.job_id} className="p-2.5 rounded-lg bg-white dark:bg-surface border border-border dark:border-border text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-text truncate">{j.name || j.job_id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                        j.status === 'scheduled' ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-selected text-text-muted'
                      }`}>
                        {j.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-text-muted flex items-center justify-between">
                      <span>Next Run:</span>
                      <span className="font-semibold text-text">
                        {j.next_run_time ? formatScheduledTime(j.next_run_time, schedule.timezone) : 'On Trigger'}
                      </span>
                    </div>
                    <div className="text-[10px] text-text-muted truncate">
                      {j.details?.trigger || 'CronTrigger'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* 2. Review & Approval Board Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Queue Selector (4 cols) */}
        <SpotlightCard className="lg:col-span-4 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border">
            <h3 className="text-base font-bold text-text dark:text-[#F3F4F8] flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary dark:text-accent" />
              Review Queue
            </h3>
            <button
              onClick={() => {
                loadPosts();
                loadSchedule();
                loadRuns();
              }}
              className="text-xs font-semibold text-primary dark:text-accent hover:text-primary dark:hover:text-white flex items-center gap-1 cursor-pointer" >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'All Content' },
              { id: 'ready_to_publish', label: 'Ready to Publish' },
              { id: 'scheduled', label: 'Scheduled' },
              { id: 'publishing', label: 'Publishing' },
              { id: 'published', label: 'Published' },
              { id: 'failed', label: 'Failed' },
              { id: 'pending_approval', label: 'Pending Review' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  activeFilter === tab.id
                    ? 'bg-primary text-primary-on shadow-xs' : 'bg-bg text-text-secondary dark:text-text-secondary hover:bg-slate-200 dark:hover:bg-surface' }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Post Items */}
          <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
            {isLoadingPosts ? (
              <div className="py-8 text-center text-xs text-text-muted dark:text-[#6B7085]">
                Loading autonomous posts...
              </div>
            ) : posts.length === 0 ? (
              <div className="p-6 text-center border border-dashed border-border dark:border-border rounded-xl space-y-1">
                <p className="text-xs font-semibold text-text-secondary dark:text-[#F3F4F8]">No posts in this queue</p>
                <p className="text-[11px] text-text-muted dark:text-[#6B7085]">Click "Run Pipeline Now" to generate today's package.</p>
              </div>
            ) : (
              posts.map(post => {
                const isSelected = post.id === selectedPostId;
                const statusColors = {
                  scheduled: 'bg-primary-soft text-primary border border-primary/20',
                  generating: 'bg-warning/10 text-warning border-warning/30',
                  ready_to_publish: 'bg-primary-soft text-primary border border-primary/20',
                  publishing: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60',
                  published: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
                  posted: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
                  rejected: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
                  failed: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
                  rate_limited: 'bg-warning/10 dark:bg-warning/10 text-warning dark:text-warning border-warning/30 dark:border-warning/30',
                  pending_approval: 'bg-warning/10 dark:bg-warning/10 text-warning dark:text-accent border-warning/30 dark:border-warning/30' };

                return (
                  <div
                    key={post.id}
                    onClick={() => setSelectedPostId(post.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-primary/10 dark:bg-surface border-primary dark:border-border shadow-sm' 
                        : 'bg-white/90 dark:bg-surface border-border dark:border-border hover:border-border' }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusColors[post.status] || statusColors.pending_approval}`}>
                        {post.status.replace('_', ' ')}
                      </span>
                      <span className="text-[11px] text-text-muted dark:text-[#6B7085]">
                        {new Date(post.created_at || Date.now()).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-text dark:text-[#F3F4F8] line-clamp-1">
                      {post.brief?.topic || 'Daily Autonomous Post'}
                    </h4>
                    <p className="text-[11px] text-text-muted dark:text-text-secondary line-clamp-2 leading-relaxed">
                      {post.brief?.caption_brief || 'Auto-generated creative package'}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-border dark:border-border text-xs">
                      <div className="flex items-center gap-1">
                        {post.variants?.map(v => (
                          <span key={v.platform} title={v.platform}>{PLATFORM_ICONS[v.platform] || ''}</span>
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-primary">
                        Score: {post.quality_report?.score || 95}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SpotlightCard>

        {/* Right: Selected Post Detail & Platform Inspector (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {selectedPost ? (
            <SpotlightCard className="p-6 sm:p-7 space-y-6">
              {/* Brief & Audit Banner */}
              <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                      Strategic Angle • {selectedPost.brief?.angle || 'Brand Value'}
                    </span>
                    <h3 className="text-base font-bold text-text mt-0.5">
                      {selectedPost.brief?.topic}
                    </h3>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface text-primary border border-border text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>Quality Score: {selectedPost.quality_report?.score || 98}%</span>
                  </div>
                </div>

                <p className="text-xs text-text-secondary leading-relaxed">
                  {selectedPost.brief?.reason}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border text-[10px] text-text-muted font-medium">
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-surface border border-border dark:border-border"><Check className="w-4 h-4 inline-block mr-1 text-primary" />Brand Accuracy</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-surface border border-border dark:border-border"><Check className="w-4 h-4 inline-block mr-1 text-primary" />Safety Passed</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-surface border border-border dark:border-border"><Check className="w-4 h-4 inline-block mr-1 text-primary" />Character Limits</span>
                  <span className="px-2 py-0.5 rounded-md bg-white dark:bg-surface border border-border dark:border-border"><Check className="w-4 h-4 inline-block mr-1 text-primary" />Multi-Ratio Assets</span>
                </div>
              </div>

              {/* Platform Switcher & Regenerate Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-border dark:border-border">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {selectedPost.variants?.map(variant => {
                    const isActive = variant.platform === activePlatform;
                    return (
                      <button
                        key={variant.platform}
                        onClick={() => setActivePlatformTabs({ ...activePlatformTabs, [selectedPost.id]: variant.platform })}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all cursor-pointer ${
                          isActive
                            ? 'bg-primary text-primary-on shadow-xs' : 'bg-bg text-text-secondary dark:text-text-secondary hover:bg-slate-200 dark:hover:bg-surface' }`}
                      >
                        <span>{PLATFORM_ICONS[variant.platform] || ''}</span>
                        <span>{variant.platform}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRegenerate(selectedPost.id, 'caption')}
                    disabled={isRegeneratingPart !== null}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary dark:text-[#F3F4F8] bg-white dark:bg-surface border border-border dark:border-border hover:bg-surface dark:hover:bg-surface transition-all cursor-pointer" >
                    <RotateCcw className={`w-3.5 h-3.5 ${isRegeneratingPart === 'caption' ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingPart === 'caption' ? 'Regenerating...' : 'New Copy'}</span>
                  </button>
                  <button
                    onClick={() => handleRegenerate(selectedPost.id, 'image')}
                    disabled={isRegeneratingPart !== null}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary dark:text-[#F3F4F8] bg-white dark:bg-surface border border-border dark:border-border hover:bg-surface dark:hover:bg-surface transition-all cursor-pointer" >
                    <Sparkles className={`w-3.5 h-3.5 ${isRegeneratingPart === 'image' ? 'animate-spin' : ''}`} />
                    <span>{isRegeneratingPart === 'image' ? 'Regenerating...' : 'New Image'}</span>
                  </button>
                  <button
                    onClick={() => handleRegenerate(selectedPost.id, 'video')}
                    disabled={isRegeneratingPart !== null}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary dark:text-[#F3F4F8] bg-white dark:bg-surface border border-border dark:border-border hover:bg-surface dark:hover:bg-surface transition-all cursor-pointer" >
                    <Video className={`w-3.5 h-3.5 ${isRegeneratingPart === 'video' ? 'animate-spin text-accent' : ''}`} />
                    <span>{isRegeneratingPart === 'video' ? 'Rendering...' : 'New Video'}</span>
                  </button>
                </div>
              </div>

              {/* Platform Preview Render */}
              {currentVariant && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                  {/* Media Frame & Asset Gallery (5 cols) */}
                  <div className="md:col-span-5 space-y-3">
                    <div className={`rounded-2xl overflow-hidden border border-border dark:border-border bg-surface-raised relative shadow-md flex items-center justify-center ${currentVariant.media_type === 'video' ? 'max-w-[280px] mx-auto aspect-[9/16]' : ''}`}>
                      {currentVariant.media_type === 'video' && currentVariant.media_path ? (
                        <video
                          src={getFullMediaUrl(currentVariant.media_path)}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      ) : currentVariant.media_type === 'video' ? (
                        <div className="aspect-[9/16] flex flex-col items-center justify-center p-6 text-center text-white">
                          <span className="text-3xl mb-2">🎬</span>
                          <h4 className="text-xs font-bold">30s AI Commercial Reel</h4>
                          <p className="text-[11px] text-text-muted mt-1 line-clamp-4">
                            {selectedPost.brief?.video_prompt || selectedPost.brief?.topic}
                          </p>
                        </div>
                      ) : currentVariant.media_path ? (
                        <img
                          src={getFullMediaUrl(currentVariant.media_path)}
                          alt={selectedPost.brief?.topic}
                          className="w-full h-auto object-cover"
                        />
                      ) : (
                        <div className="aspect-square flex flex-col items-center justify-center gap-2 p-6 text-center text-text-muted">
                          <FileText className="w-7 h-7" />
                          <span className="text-xs font-medium">No media attached</span>
                        </div>
                      )}
                      <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/70 text-white backdrop-blur-sm">
                        {currentVariant.aspect_ratio || '1:1'} • {currentVariant.media_type.toUpperCase()}
                      </span>
                    </div>

                    {/* Campaign Creative Media Assets (Images + Video Reel) */}
                    {availableMediaAssets.length > 0 && (
                      <div className="p-3 rounded-xl bg-surface border border-border dark:border-border space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary dark:text-text-secondary">
                          <span className="uppercase tracking-wider">All Campaign Media ({availableMediaAssets.length})</span>
                          <span className="text-[10px] font-semibold text-primary dark:text-accent">Click to switch media</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {availableMediaAssets.map((asset, aIdx) => {
                            const isCurrent = currentVariant.media_path === asset.file_path;
                            return (
                              <button
                                key={asset.id || aIdx}
                                type="button"
                                onClick={() => handleApplyMediaAsset(asset)}
                                className={`relative rounded-xl overflow-hidden border-2 transition-all cursor-pointer aspect-square bg-surface flex flex-col items-center justify-center group ${
                                  isCurrent
                                    ? 'border-primary dark:border-border ring-2 ring-primary/20 shadow-sm'
                                    : 'border-border dark:border-border hover:border-border dark:hover:border-border/60'
                                }`}
                                title={`Apply ${asset.aspect_ratio} ${asset.type} to ${currentVariant.platform}`}
                              >
                                {asset.type === 'video' ? (
                                  <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center bg-surface-raised text-white">
                                    <Video className="w-4 h-4 text-accent" />
                                    <span className="text-[9px] font-bold mt-1 text-accent">Video</span>
                                  </div>
                                ) : (
                                  <img
                                    src={getFullMediaUrl(asset.file_path)}
                                    alt={asset.aspect_ratio}
                                    className="w-full h-full object-cover"
                                  />
                                )}
                                <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded text-[8px] font-bold bg-black/80 text-white">
                                  {asset.aspect_ratio}
                                </span>
                                {isCurrent && (
                                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-black" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Copy & Hashtags (7 cols) */}
                  <div className="md:col-span-7 space-y-4">
                    {currentVariant.title && (
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-bold text-text-muted dark:text-[#6B7085] uppercase tracking-wider block">
                            Title
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(currentVariant.title, 'title')}
                            className="text-[11px] text-primary dark:text-accent hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedField === 'title' ? 'Copied!' : 'Copy Title'}</span>
                          </button>
                        </div>
                        <h4 className="text-sm font-bold text-text dark:text-white">
                          {currentVariant.title}
                        </h4>
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-text-muted dark:text-[#6B7085] uppercase tracking-wider block">
                          Tailored Caption ({currentVariant.platform.toUpperCase()})
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-text-muted dark:text-[#6B7085]">
                            {currentVariant.caption?.length || 0} chars
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(currentVariant.caption, 'caption')}
                            className="text-[11px] text-primary dark:text-accent hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedField === 'caption' ? 'Copied!' : 'Copy Caption'}</span>
                          </button>
                        </div>
                      </div>
                      <div className="p-3.5 rounded-xl bg-surface border border-border dark:border-border text-xs sm:text-sm text-text dark:text-[#F3F4F8] leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap">
                        {currentVariant.caption}
                      </div>
                    </div>

                    {currentVariant.hashtags && currentVariant.hashtags.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold text-text-muted dark:text-[#6B7085] uppercase tracking-wider block">
                            Hashtags ({currentVariant.hashtags.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyText(currentVariant.hashtags.join(' '), 'hashtags')}
                            className="text-[11px] text-primary dark:text-accent hover:underline inline-flex items-center gap-1 cursor-pointer font-semibold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedField === 'hashtags' ? 'Copied!' : 'Copy All'}</span>
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {currentVariant.hashtags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-soft text-primary border border-primary/20">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentVariant.status === 'posted' ? (
                      <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs text-text-secondary dark:text-[#F3F4F8] flex justify-between items-center">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          Published Live to {currentVariant.platform}
                        </span>
                        {currentVariant.platform_url ? (
                          <a
                            href={currentVariant.platform_url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1 shadow-xs transition-all"
                          >
                            <span>View on {currentVariant.platform}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="font-bold text-text dark:text-white">
                            {formatScheduledTime(currentVariant?.scheduled_time || selectedPost?.scheduled_time, schedule?.timezone)}
                          </span>
                        )}
                      </div>
                    ) : currentVariant.status === 'rate_limited' ? (
                      <div className="p-3 rounded-xl bg-warning/10/80 dark:bg-warning/10 border border-warning/30 dark:border-warning/30 text-xs flex flex-col gap-1.5">
                        <span className="font-semibold text-warning dark:text-warning flex items-center gap-1.5">
                          ⏳ Instagram Rate-Limit / Action Block
                        </span>
                        <span className="text-warning dark:text-warning leading-relaxed">
                          Instagram placed a temporary security hold on automated publishing for this account.
                          The system will <strong>automatically retry</strong> once the 2-hour cooldown expires.
                          {currentVariant.retry_after && (
                            <span className="block mt-1 font-bold">
                              Retry scheduled after: {new Date(currentVariant.retry_after + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-bg border border-border dark:border-border text-xs text-text-secondary dark:text-text-secondary flex justify-between items-center">
                        <span>Scheduled Posting Time:</span>
                        <span className="font-bold text-text dark:text-white">
                          {formatScheduledTime(currentVariant?.scheduled_time || selectedPost?.scheduled_time, schedule?.timezone)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-border dark:border-border">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(selectedPost, currentVariant)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary dark:text-[#F3F4F8] bg-white dark:bg-surface border border-border dark:border-border hover:bg-surface dark:hover:bg-surface transition-all shadow-xs cursor-pointer" >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Copy</span>
                  </button>
                  {selectedPost.status !== 'posted' && (
                    <button
                      onClick={() => handleSaveDraft(selectedPost.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary dark:text-[#F3F4F8] bg-white dark:bg-surface border border-border dark:border-border hover:bg-surface dark:hover:bg-surface transition-all shadow-xs cursor-pointer" >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Save Draft</span>
                    </button>
                  )}
                  {selectedPost.status !== 'posted' && (
                    <button
                      onClick={() => handleOpenReschedule(selectedPost)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary dark:text-[#F3F4F8] bg-white dark:bg-surface border border-border dark:border-border hover:bg-surface dark:hover:bg-surface transition-all shadow-xs cursor-pointer" >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Reschedule</span>
                    </button>
                  )}
                  {(selectedPost.status === 'failed' || currentVariant?.status === 'failed' || currentVariant?.status === 'rate_limited') && (
                    <button
                      disabled={isRetryingPost}
                      onClick={() => handleRetry(selectedPost.id, currentVariant?.platform)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-warning bg-warning/10 border border-warning/30 hover:bg-warning/20 transition-all shadow-xs" >
                      <RotateCcw className={`w-3.5 h-3.5 ${isRetryingPost ? 'animate-spin' : ''}`} />
                      <span>{isRetryingPost ? 'Retrying...' : 'Retry Publishing'}</span>
                    </button>
                  )}
                  {!schedule.auto_approve && selectedPost.status === 'pending_approval' && (
                    <button
                      onClick={() => setRejectModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 transition-all shadow-xs" >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>
                  )}
                </div>

                {selectedPost.status === 'posted' ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Published Live
                    </span>
                    {currentVariant?.platform_url && (
                      <a
                        href={currentVariant.platform_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:opacity-90 shadow-sm transition-all"
                      >
                        <span>Open Live Post</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <span className="text-xs font-semibold text-text-muted dark:text-text-secondary">
                      Next batch auto-generates at {schedule.generation_time}
                    </span>
                  </div>
                ) : schedule.auto_approve ? (
                  <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200">
                    <Check className="w-4 h-4" />
                    {selectedPost.status === 'scheduled' ? 'Auto-Scheduled' : 'Auto-Schedule Enabled'}
                  </span>
                ) : selectedPost.status === 'pending_approval' ? (
                  <button
                    onClick={() => handleApprove(selectedPost.id)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:opacity-90 active:scale-95 transition-all shadow-md shadow-sm" >
                    <Check className="w-4 h-4" />
                    <span>Approve & Schedule Post</span>
                  </button>
                ) : null}
              </div>
            </SpotlightCard>
          ) : (
            <SpotlightCard className="p-12 text-center space-y-3">
              <Bot className="w-12 h-12 mx-auto text-primary opacity-60" />
              <h3 className="text-base font-bold text-text">Autonomous AI Hub Ready</h3>
              <p className="text-xs text-text-muted max-w-sm mx-auto">
                Your content pipeline runs daily at {schedule.generation_time} ({schedule.timezone}). Click "Run Pipeline Now" to synthesize today's package immediately.
              </p>
            </SpotlightCard>
          )}
        </div>
      </div>

      {/* 3. Run History Table SpotlightCard */}
      <SpotlightCard className="p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h3 className="text-base font-bold text-text flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Autonomous Execution History
          </h3>
          <span className="text-xs text-text-muted">{pipelineRuns.length} recorded runs</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm text-text-secondary">
            <thead className="bg-surface text-[11px] font-bold uppercase tracking-wider text-text-muted border-b border-border">
              <tr>
                <th className="p-3 rounded-l-xl">Date</th>
                <th className="p-3">Status</th>
                <th className="p-3">Quality Score</th>
                <th className="p-3">Topic Generated</th>
                <th className="p-3 rounded-r-xl">Execution Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pipelineRuns.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-xs text-text-muted">
                    No runs recorded yet.
                  </td>
                </tr>
              ) : (
                pipelineRuns.map(run => (
                  <tr key={run.id} className="hover:bg-primary/10 transition-colors">
                    <td className="p-3 font-semibold text-text">{run.run_date}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        run.status === 'completed' ? 'bg-bg text-primary border border-border' : run.status === 'running' ? 'bg-primary/10 text-primary border border-primary' : 'bg-rose-50 text-rose-700 border border-rose-200' }`}>
                        {run.status}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-primary">
                      {run.quality_score ? `${run.quality_score}%` : 'N/A'}
                    </td>
                    <td className="p-3 max-w-[280px] truncate">
                      {run.stats?.topic || 'Daily Post'}
                    </td>
                    <td className="p-3 text-text-muted">
                      {run.stats?.duration_seconds ? `${Math.round(run.stats.duration_seconds)}s` : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </SpotlightCard>

      {/* Edit Modal */}
      {editModalPost && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg bg-white dark:bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text dark:text-white capitalize">
                Edit {editModalPost.variant.platform} Post
              </h3>
              <button onClick={() => setEditModalPost(null)} className="p-1 rounded-lg hover:bg-surface-selected text-text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {editModalPost.variant.title !== undefined && (
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Title</label>
                  <input
                    type="text" value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring" />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text mb-1">Caption</label>
                <textarea
                  rows={5}
                  value={editFormData.caption}
                  onChange={(e) => setEditFormData({ ...editFormData, caption: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Hashtags</label>
                <input
                  type="text" value={editFormData.hashtags}
                  onChange={(e) => setEditFormData({ ...editFormData, hashtags: e.target.value })}
                  placeholder="#Hashtag1 #Hashtag2" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setEditModalPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary bg-surface hover:bg-surface-selected" >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:bg-primary-hover shadow-md shadow-primary/25" >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text dark:text-white">Reject Post</h3>
              <button onClick={() => setRejectModalOpen(false)} className="p-1 rounded-lg hover:bg-surface-selected text-text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-text-muted dark:text-text-muted">
                Provide feedback so the AI pipeline avoids similar angles in future daily batches.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Tone is too aggressive; please focus more on ingredient quality." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-focus-ring/30 focus:border-focus-ring" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary bg-surface hover:bg-surface-selected" >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-sm" >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleModalPost && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white dark:bg-surface rounded-2xl p-6 shadow-2xl border border-border space-y-4 animate-in fade-in-50 zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Reschedule Publishing
              </h3>
              <button onClick={() => setRescheduleModalPost(null)} className="p-1 rounded-lg hover:bg-surface-selected text-text-muted hover:text-text">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-text-muted dark:text-text-muted">
                Choose a new target date and time to publish this post across target accounts ({schedule?.timezone || DEFAULT_TIMEZONE}).
              </p>
              <div>
                <label className="block text-xs font-bold text-text mb-1">Target Date</label>
                <input
                  type="date"
                  value={rescheduleForm.date}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text mb-1">Target Time</label>
                <input
                  type="time"
                  value={rescheduleForm.time}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleModalPost(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary dark:text-text-muted bg-bg hover:bg-slate-200 dark:hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-primary hover:brightness-110 shadow-sm"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AutonomousPipelineHub;
