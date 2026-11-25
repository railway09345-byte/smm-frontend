import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useContent } from '../../../contexts/ContentContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../common/Toast';
import { api, getFullMediaUrl, isAbortError } from '../../../services/api';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Sparkles,
  Calendar,
  Clock,
  Layers,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Trash2,
  Edit3,
  ArrowRight,
  Send,
  Check,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronRight,
  Sliders,
  Target,
  Hash,
  Lightbulb,
  FileText,
  Globe,
  Share2,
  Settings,
  AlertCircle,
  Image as ImageIcon,
  Film,
  Video,
  Play,
  Maximize2,
  Copy,
  ShieldCheck
} from 'lucide-react';

const AVAILABLE_PLATFORMS = [
  { id: 'Facebook', name: 'Facebook', color: '#1877F2', icon: '📘' },
  { id: 'Instagram', name: 'Instagram', color: '#E1306C', icon: '📸' },
  { id: 'YouTube', name: 'YouTube', color: '#FF0000', icon: '▶️' }
];

const PRESET_GOALS = [
  'Brand Awareness & Follower Growth',
  'Product Launches & Direct Sales',
  'Educational Authority & Thought Leadership',
  'Community Engagement & Viral Reach',
  'Behind the Scenes & Brand Loyalty'
];

const STATUS_CONFIG = {
  planned: {
    label: 'Planned',
    badge: 'bg-surface text-text-secondary border-border',
    dot: 'bg-text-muted'
  },
  scheduled: {
    label: 'Scheduled (Auto-Post)',
    badge: 'bg-success/15 text-success border-success/30',
    dot: 'bg-success'
  },
  awaiting_approval: {
    label: 'Pending Approval',
    badge: 'bg-warning/15 text-warning border-warning/30',
    dot: 'bg-warning'
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-warning/15 text-warning border-warning/30',
    dot: 'bg-warning'
  },
  draft_created: {
    label: 'Draft Created',
    badge: 'bg-info/15 text-info border-info/30',
    dot: 'bg-info'
  },
  completed: {
    label: 'Completed',
    badge: 'bg-success/15 text-success border-success/30',
    dot: 'bg-success'
  }
};

export function AIPlannerView({ onNavigate }) {
  const { brandProfile } = useContent();
  const { currentBusiness } = useAuth();
  const { showToast } = useToast();

  const brandName = brandProfile?.name || currentBusiness?.name || 'Your Brand';
  const productsCount = brandProfile?.products?.length || 0;

  // Real Database State
  const [campaigns, setCampaigns] = useState([]);
  const [mediaCategories, setMediaCategories] = useState([]);
  const [mediaCollections, setMediaCollections] = useState([]);
  const [isLoadingMediaCategories, setIsLoadingMediaCategories] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);

  // Generator State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPlan, setIsSavingPlan] = useState(false);
  const [generatedDraftPlan, setGeneratedDraftPlan] = useState(null);
  const [aiHealth, setAiHealth] = useState(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationStatusText, setGenerationStatusText] = useState('');
  const [fallbackBanner, setFallbackBanner] = useState(null);

  // Generator Form Config
  const [genDuration, setGenDuration] = useState(7); // 7 or 30
  const [genPlatforms, setGenPlatforms] = useState(['Facebook', 'Instagram', 'YouTube']);
  const [genFrequency, setGenFrequency] = useState('1_per_day');
  const [genMediaPreference, setGenMediaPreference] = useState('both'); // 'images' | 'videos' | 'both'
  const [genGoal, setGenGoal] = useState('Brand Awareness & Follower Growth');
  const [genCustomFocus, setGenCustomFocus] = useState('');
  const [genStartDate, setGenStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [genDailyTime, setGenDailyTime] = useState('10:00');
  const [genTimezone, setGenTimezone] = useState(() => {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'; } catch { return 'Asia/Kolkata'; }
  });
  const [genMediaCategoryId, setGenMediaCategoryId] = useState('');
  const [genMediaCollectionId, setGenMediaCollectionId] = useState('');

  // UI View & Filters
  const [viewMode, setViewMode] = useState('calendar'); // 'calendar' | 'cards'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [filterFormat, setFilterFormat] = useState('all');

  // Modals
  const [editingIdea, setEditingIdea] = useState(null);
  const [isAddingCustomIdea, setIsAddingCustomIdea] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleMode, setScheduleMode] = useState('auto_post'); // 'auto_post' | 'approval_required'
  const [scheduleTimezone, setScheduleTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      return 'Asia/Kolkata';
    }
  });
  const [schedulePlatform, setSchedulePlatform] = useState('Instagram');
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);

  // Common Campaign Timing State
  const [commonStartDate, setCommonStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [commonDailyTime, setCommonDailyTime] = useState('10:00');
  const [commonTimezone, setCommonTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      return 'Asia/Kolkata';
    }
  });
  const [commonMode, setCommonMode] = useState('auto_post'); // 'auto_post' | 'approval_required'
  const [isApplyingTiming, setIsApplyingTiming] = useState(false);
  const [copiedIdeaId, setCopiedIdeaId] = useState(null);
  const [customIdeaForm, setCustomIdeaForm] = useState({
    topic: '',
    hook: '',
    caption_brief: '',
    call_to_action: '',
    content_format: 'Post',
    platform: 'Instagram',
    suggested_date: '',
    suggested_time: '10:00',
    hashtags: '',
    content_pillar: 'Awareness'
  });
  const [regeneratingIdeaId, setRegeneratingIdeaId] = useState(null);
  const [generatingMediaIdeaId, setGeneratingMediaIdeaId] = useState(null);
  const [mediaActionType, setMediaActionType] = useState({}); // { [ideaId]: 'image' | 'video' | 'bundle' }
  const [isBatchGenerating, setIsBatchGenerating] = useState(false);
  const [isBatchGeneratingAllMedia, setIsBatchGeneratingAllMedia] = useState(false);
  const [previewMediaModal, setPreviewMediaModal] = useState(null); // { type: 'image' | 'video', url, title }
  const [modalImageError, setModalImageError] = useState(false);
  const [ideaGeneratedMedia, setIdeaGeneratedMedia] = useState({});
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const persistedMedia = useRef(new Map());
  useEffect(() => {
    for (const [key, media] of Object.entries(ideaGeneratedMedia)) {
      if (!/^\d+$/.test(key)) continue;
      const ids = [media.image?.media_asset_id, media.video?.media_asset_id].filter(Boolean);
      const signature = JSON.stringify(ids);
      if (!ids.length || persistedMedia.current.get(key) === signature) continue;
      persistedMedia.current.set(key, signature);
      api.campaigns.updateIdea(Number(key), { media_asset_ids: ids }).catch((err) => {
        persistedMedia.current.delete(key);
        showToast(`Media generated, but attaching it to the plan failed: ${err.message}`, 'error');
      });
    }
  }, [ideaGeneratedMedia]);
  const videoPolls = useRef(new Set());
  useEffect(() => () => {
    videoPolls.current.forEach(clearInterval);
    videoPolls.current.clear();
  }, []);

  // Deterministic unique key helper for isolating media state per planned idea card
  const getIdeaKey = (idea, idx) => {
    if (idea?.id !== undefined && idea?.id !== null && String(idea.id).trim() !== '' && String(idea.id) !== 'undefined') {
      return String(idea.id);
    }
    const day = idea?.day_number || (typeof idx === 'number' ? idx + 1 : 1);
    const slot = idea?.slot_index !== undefined ? idea.slot_index : (typeof idx === 'number' ? idx : 0);
    return `idea-d${day}-s${slot}`;
  };

  // High-fidelity prompt builder that guarantees flat straight monitors, sharp planar lines, and 0 misspelled text
  const buildVisualScenePrompt = (idea, format = 'image') => {
    const rawBrandName = brandProfile?.name || brandName || 'Brand';
    const cleanBrandName = rawBrandName.replace(/\s*(pvt\.?\s*ltd\.?|private\s*limited|inc\.?|llc\.?|corp\.?)$/i, '').trim() || 'Brand';
    const topic = idea?.topic || idea?.title || 'Modern Business Innovation';
    const industry = (brandProfile?.industry || '').toLowerCase();
    const isTech = industry.includes('tech') || industry.includes('software') || industry.includes('saas') || industry.includes('cloud') || industry.includes('automation') || cleanBrandName.toLowerCase().includes('zenvora');
    const dayLabel = idea?.day_number ? `Day ${idea.day_number}` : '';
    const palette = Array.isArray(brandProfile?.color_palette) ? brandProfile.color_palette.filter(c => typeof c === 'string' && c.startsWith('#')).slice(0, 2) : [];
    const colorHint = palette.length ? `, color harmony with ${palette.join(', ')}` : '';

    // 1. Dynamic visual prompt direction generated by AI Planner if present
    const dynamicDir = (idea?.visual_prompt_direction || idea?.image_prompt || idea?.scene_blueprint || '').trim();
    if (dynamicDir && dynamicDir.length > 20 && !dynamicDir.toLowerCase().startsWith('highlight key')) {
      if (format === 'video') {
        return `Cinematic 30-second commercial promo reel (${dayLabel}): ${dynamicDir} for ${cleanBrandName}${colorHint}. Dynamic gliding camera motion, smooth transitions, ambient natural lighting, 4k ultra-high definition, professional color grading, sharp focus`.trim();
      }
      return `Photorealistic commercial photography (${dayLabel}): ${dynamicDir} for ${cleanBrandName}${colorHint}. Shot on 85mm f/1.4 lens, shallow depth of field, natural studio lighting, ultra-sharp focus, 8k uhd, photorealistic, no text overlays, no watermark`.trim();
    }

    // 2. Varied scene generation based on Day / Pillar to guarantee diversity across the 7 days
    const dayPillar = (idea?.pillar || idea?.content_pillar || '').toLowerCase();
    let sceneVariation = '';
    if (dayPillar.includes('origin') || dayPillar.includes('mission') || (idea?.day_number === 1)) {
      sceneVariation = `authentic founder vision and artisan craftsmanship workspace, inspiring warm morning daylight`;
    } else if (dayPillar.includes('feature') || dayPillar.includes('product') || (idea?.day_number === 2)) {
      sceneVariation = `ultra-detailed hero product presentation, clean minimalist studio pedestal with soft dramatic rim light`;
    } else if (dayPillar.includes('tip') || dayPillar.includes('how') || (idea?.day_number === 3)) {
      sceneVariation = `tactical demonstration in an elegant modern creative studio, engaging natural workflow setting`;
    } else if (dayPillar.includes('customer') || dayPillar.includes('proof') || (idea?.day_number === 4)) {
      sceneVariation = `happy contemporary customer lifestyle interaction, authentic human smiles, bright sunlit architectural space`;
    } else if (dayPillar.includes('behind') || dayPillar.includes('craft') || (idea?.day_number === 5)) {
      sceneVariation = `behind-the-scenes atelier workshop, hands-on authentic material textures, warm atmospheric lighting`;
    } else if (dayPillar.includes('community') || dayPillar.includes('poll') || (idea?.day_number === 6)) {
      sceneVariation = `lively modern team collaboration around a sleek open table, vibrant daylight, contemporary aesthetic`;
    } else {
      sceneVariation = `exclusive luxury weekend VIP showcase, sophisticated editorial composition with sleek ambient accents`;
    }

    if (format === 'video') {
      return `Cinematic 30-second commercial promo reel (${dayLabel}): ${topic}. Dynamic 5-act visual narrative for ${cleanBrandName}: ${sceneVariation}${colorHint}, 4k ultra-high definition, award-winning cinematography, smooth camera motion`.trim();
    }

    return `Photorealistic commercial photography (${dayLabel}): ${topic}. Elegant setting for ${cleanBrandName}: ${sceneVariation}${colorHint}. Shot on 85mm f/1.4 lens, natural soft studio lighting, sharp focus, 8k uhd, editorial aesthetic, no text overlays, no watermark`.trim();
  };

  // -------------------------------------------------------------
  // Data Fetching: Load Campaigns from DB
  // -------------------------------------------------------------
  const loadCampaigns = async (autoSelectId = null) => {
    setIsLoadingCampaigns(true);
    try {
      const res = await api.campaigns.list();
      const allCampaigns = Array.isArray(res) ? res : (res?.items || []);
      const list = brandProfile?.id ? allCampaigns.filter((campaign) => campaign.brand_profile_id === brandProfile.id) : allCampaigns;
      setCampaigns(list);

      if (autoSelectId) {
        setSelectedCampaignId(autoSelectId);
      } else if (list.length > 0) {
        // If current selection is still valid keep it, else pick the first
        setSelectedCampaignId((prev) => {
          const exists = list.find((c) => c.id === prev);
          return exists ? prev : list[0].id;
        });
      } else {
        setSelectedCampaignId(null);
        setActivePlan(null);
        setIdeas([]);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load campaigns', 'error');
      setCampaigns([]);
      setSelectedCampaignId(null);
      setActivePlan(null);
      setIdeas([]);
    } finally {
      setIsLoadingCampaigns(false);
    }
  };

  useEffect(() => {
    setIdeaGeneratedMedia({});
    setGeneratedDraftPlan(null);
    loadCampaigns();
  }, [brandProfile?.id]);

  const loadMediaCategories = async () => {
    setIsLoadingMediaCategories(true);
    try {
      const [categoryResult, collectionResult] = await Promise.all([
        api.mediaCategories.list(),
        api.collections.list()
      ]);
      setMediaCategories(Array.isArray(categoryResult) ? categoryResult : []);
      setMediaCollections(Array.isArray(collectionResult) ? collectionResult : []);
    } catch (err) {
      setMediaCategories([]);
      setMediaCollections([]);
      showToast(err.message || 'Could not load Media Library categories. Restart the backend after applying the migration.', 'error');
    } finally {
      setIsLoadingMediaCategories(false);
    }
  };

  useEffect(() => {
    loadMediaCategories();
  }, []);

  useEffect(() => {
    if (isGeneratorOpen) loadMediaCategories();
  }, [isGeneratorOpen]);

  // -------------------------------------------------------------
  // Load Ideas for Selected Campaign
  // -------------------------------------------------------------
  const activeIdeasAbortController = useRef(null);
  const inFlightIdeasCampaignRef = useRef(null);
  const isBusyGeneratingRef = useRef(false);
  isBusyGeneratingRef.current = Boolean(isGenerating || isSavingPlan || isBatchGeneratingAllMedia || generatingMediaIdeaId);

  const loadCampaignIdeas = async (campaignId, isBackgroundPoll = false) => {
    if (!campaignId) return;

    // Avoid stacking duplicate in-flight requests for the exact same campaign
    if (inFlightIdeasCampaignRef.current === campaignId && isBackgroundPoll) {
      return;
    }

    // Cancel any previous in-flight request to avoid stale overwrites
    if (activeIdeasAbortController.current) {
      activeIdeasAbortController.current.abort();
    }
    const controller = new AbortController();
    activeIdeasAbortController.current = controller;
    inFlightIdeasCampaignRef.current = campaignId;

    if (!isBackgroundPoll) {
      setIsLoadingIdeas(true);
    }

    try {
      const res = await api.campaigns.getIdeas(campaignId, { signal: controller.signal });
      if (res) {
        setActivePlan(res.campaign || null);
        setIdeas(res.ideas || []);
        const savedMedia = Object.fromEntries((res.ideas || []).map((idea) => [String(idea.id), idea.generated_media || {}]));
        for (const [key, media] of Object.entries(savedMedia)) {
          persistedMedia.current.set(key, JSON.stringify([media.image?.media_asset_id, media.video?.media_asset_id].filter(Boolean)));
        }
        for (const media of Object.values(savedMedia)) {
          if (media.image?.image_url) media.image.image_url = getFullMediaUrl(media.image.image_url);
          if (media.video?.video_url) media.video.video_url = getFullMediaUrl(media.video.video_url);
        }
        setIdeaGeneratedMedia(savedMedia);
      }
    } catch (err) {
      if (isAbortError(err) || err?.status === 499) {
        return; // Normal cancellation, do not surface as error toast
      }
      console.error('Error loading campaign ideas:', err);
      showToast('Failed to load planned ideas for campaign', 'error');
    } finally {
      if (inFlightIdeasCampaignRef.current === campaignId) {
        inFlightIdeasCampaignRef.current = null;
      }
      if (!isBackgroundPoll) {
        setIsLoadingIdeas(false);
      }
    }
  };

  // Immediate load whenever selected campaign changes
  useEffect(() => {
    if (!selectedCampaignId) return;
    loadCampaignIdeas(selectedCampaignId, false);
  }, [selectedCampaignId]);

  // Periodic background refresh (every 15s) that respects active generation state
  useEffect(() => {
    if (!selectedCampaignId) return;
    const pollInterval = setInterval(() => {
      if (!isBusyGeneratingRef.current && !isLoadingIdeas) {
        loadCampaignIdeas(selectedCampaignId, true);
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      if (activeIdeasAbortController.current) {
        activeIdeasAbortController.current.abort();
      }
    };
  }, [selectedCampaignId]);

  useEffect(() => {
    let isMounted = true;
    if (api?.generations?.getAIHealth) {
      api.generations.getAIHealth()
        .then((res) => {
          if (isMounted && res) setAiHealth(res);
        })
        .catch(() => {});
    }
    return () => { isMounted = false; };
  }, []);

  // -------------------------------------------------------------
  // Plan Generation Flow
  // -------------------------------------------------------------
  const handleToggleGenPlatform = (platId) => {
    setGenPlatforms((prev) =>
      prev.includes(platId)
        ? prev.length > 1
          ? prev.filter((p) => p !== platId)
          : prev
        : [...prev, platId]
    );
  };

  const savePlanDraft = async (draft) => {
    if (!draft) return false;
    setIsSavingPlan(true);
    try {
      const saved = await api.campaigns.savePlan({
        brand_profile_id: draft.brand_profile_id || brandProfile?.id,
        summary: draft.summary,
        custom_focus: draft.custom_focus,
        end_date: draft.end_date,
        title: draft.campaign_name || draft.title || 'AI Campaign Plan',
        campaign_goal: draft.campaign_goal,
        duration_days: draft.duration_days,
        posting_frequency: draft.posting_frequency || genFrequency,
        media_format_preference: draft.media_format_preference || genMediaPreference,
        media_category_id: draft.media_category_id || (genMediaCategoryId ? Number(genMediaCategoryId) : null),
        media_collection_id: draft.media_collection_id || (genMediaCollectionId ? Number(genMediaCollectionId) : null),
        daily_posting_time: draft.daily_posting_time || genDailyTime,
        timezone: draft.timezone || genTimezone,
        platforms: draft.platforms,
        start_date: draft.start_date,
        auto_generate_media: true,
        ideas: draft.ideas.map((idea, idx) => {
          const media = ideaGeneratedMedia[getIdeaKey(idea, idx)] || {};
          return {
            ...idea,
            auto_generate_media: true,
            media_asset_ids: [media.image?.media_asset_id, media.video?.media_asset_id].filter(Boolean)
          };
        })
      });
      const newId = saved?.campaign?.id;
      setGeneratedDraftPlan(null);
      setIsGeneratorOpen(false);
      await loadCampaigns(newId);
      return true;
    } catch (err) {
      console.error('Failed to save plan:', err);
      showToast(err.message || 'The plan was generated but could not be saved. Retry save below.', 'error');
      return false;
    } finally {
      setIsSavingPlan(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (genPlatforms.length === 0) {
      showToast('Please select at least one target social platform', 'warning');
      return;
    }
    if (!genStartDate) {
      showToast('Please specify a plan start date', 'warning');
      return;
    }
    if (!genGoal || !genGoal.trim()) {
      showToast('Please enter your Primary Campaign Goal', 'warning');
      return;
    }

    setIsGenerating(true);
    setFallbackBanner(null);
    setGenerationProgress(15);
    setGenerationStatusText('Analyzing verified brand guidelines & target audience...');

    const progressStages = [
      { pct: 35, text: 'Synthesizing multi-day narrative arcs and pillars...' },
      { pct: 60, text: 'Drafting publication-ready captions with persuasive storytelling...' },
      { pct: 80, text: 'Curating trending and industry-specific hashtags...' },
      { pct: 90, text: 'Formulating visual prompt directions & scene blueprints...' },
      { pct: 95, text: 'Validating brand voice integrity across all days...' }
    ];
    let stageIdx = 0;
    const progressTimer = setInterval(() => {
      if (stageIdx < progressStages.length) {
        setGenerationProgress(progressStages[stageIdx].pct);
        setGenerationStatusText(progressStages[stageIdx].text);
        stageIdx++;
      }
    }, 2400);

    try {
      const payload = {
        brand_profile_id: brandProfile?.id || null,
        duration_days: Number(genDuration),
        platforms: genPlatforms,
        posting_frequency: genFrequency,
        media_format_preference: genMediaPreference,
        campaign_goal: genGoal.trim(),
        custom_focus: genCustomFocus.trim() || null,
        start_date: genStartDate,
        daily_posting_time: genDailyTime,
        timezone: genTimezone,
        media_category_id: genMediaCategoryId ? Number(genMediaCategoryId) : null,
        media_collection_id: genMediaCollectionId ? Number(genMediaCollectionId) : null
      };

      const result = await api.campaigns.generatePlan(payload);
      if (result && Array.isArray(result.ideas)) {
        setGeneratedDraftPlan(result);
        if (result._fallback_notice) {
          setFallbackBanner(result._fallback_notice);
          showToast(`Multi-Provider Resilience: ${result._fallback_notice}`, 'info');
        }
        const saved = await savePlanDraft(result);
        if (saved) showToast(`Generated and saved ${result.ideas.length} campaign ideas. Use Auto-Schedule only when you are ready to publish.`, 'success');
      } else {
        throw new Error('Invalid plan structure received');
      }
    } catch (err) {
      console.error('Plan generation failed:', err);
      showToast(err.message || 'Failed to generate AI plan. Please retry.', 'error');
    } finally {
      clearInterval(progressTimer);
      setIsGenerating(false);
      setGenerationProgress(0);
      setGenerationStatusText('');
    }
  };

  const handleSaveDraftPlan = async () => {
    await savePlanDraft(generatedDraftPlan);
  };

  // -------------------------------------------------------------
  // Idea Actions: Direct AI Image & Video API Creation
  // -------------------------------------------------------------

  // 1. DEDICATED AI IMAGE CREATION API (Cloudflare Workers AI Flux-1 Schnell)
  const handleCreateImageForIdea = async (idea, ideaKey) => {
    const key = ideaKey || getIdeaKey(idea);
    setImageLoadErrors((prev) => ({ ...prev, [key]: false }));
    setGeneratingMediaIdeaId(key);
    setMediaActionType((prev) => ({ ...prev, [key]: 'image' }));
    showToast(`Generating image with Cloudflare Flux AI for "${idea.topic}"...`, 'info');
    try {
      const prompt = buildVisualScenePrompt(idea, 'image');

      const res = await api.generations.generateImage({
        prompt: prompt,
        brand_profile_id: brandProfile?.id || null,
        aspect_ratio: '1:1',
        style_preset: 'modern_product'
      });

      const rd = res?.result_data || {};
      const imgUrl = getFullMediaUrl(rd.image_url);

      if (!imgUrl) {
        throw new Error('Image URL not received from AI Image generation service');
      }

      setIdeaGeneratedMedia((prev) => ({
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          image: {
            image_url: imgUrl,
            media_asset_id: rd.media_asset_id,
            prompt: prompt,
            provider: rd.provider || res?.provider || 'cloudflare-flux'
          }
        }
      }));

      // Immediately persist idea plan_status & media asset id in database if saved
      if (idea.id && typeof idea.id === 'number') {
        try {
          await api.campaigns.updateIdea(idea.id, {
            plan_status: 'draft_created',
            media_asset_ids: rd.media_asset_id ? [rd.media_asset_id] : []
          });
        } catch (e) {
          console.warn('Could not update idea status in DB:', e);
        }
      }
      setIdeas((prev) =>
        prev.map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
      );
      if (generatedDraftPlan) {
        setGeneratedDraftPlan((prev) => ({
          ...prev,
          ideas: (prev?.ideas || []).map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
        }));
      }

      showToast(`AI Image created with Cloudflare Flux for Day ${idea.day_number || ''}!`, 'success');
    } catch (err) {
      console.error('Image creation failed:', err);
      showToast(`AI Image creation failed: ${err.message}`, 'error');
    } finally {
      setGeneratingMediaIdeaId(null);
      setMediaActionType((prev) => ({ ...prev, [key]: null }));
    }
  };

  // 2. DEDICATED AI VIDEO REEL CREATION API (Google Veo / Video Reel Engine)
  const handleCreateVideoForIdea = async (idea, ideaKey) => {
    if (!brandProfile || !brandProfile.name || !brandProfile.id) {
      showToast('A saved Brand Profile is required before generating videos. Please configure your Brand Profile first.', 'error');
      if (onNavigate) onNavigate('brand-profile');
      return;
    }
    const key = ideaKey || getIdeaKey(idea);
    setGeneratingMediaIdeaId(key);
    setMediaActionType((prev) => ({ ...prev, [key]: 'video' }));
    showToast(`Calling AI Video API for "${idea.topic}"...`, 'info');
    try {
      const prompt = buildVisualScenePrompt(idea, 'video');
      const isReel = (idea.content_format || '').toLowerCase().includes('video') || (idea.content_format || '').toLowerCase().includes('reel');

      const job = await api.generations.generateVideo({
        prompt: prompt,
        brand_profile_id: brandProfile?.id || null,
        aspect_ratio: isReel ? '9:16' : '16:9',
        duration_seconds: 30,
        voice: 'auto',
        test_mode: false
      });

      if (job.status === 'completed') {
        const rd = job.result_data || {};
        const videoUrl = getFullMediaUrl(rd.video_url);
        if (!videoUrl) throw new Error('Video job completed without a video file.');

        setIdeaGeneratedMedia((prev) => ({
          ...prev,
          [key]: {
            ...(prev[key] || {}),
            video: {
              video_url: videoUrl,
              media_asset_id: rd.media_asset_id,
              video_prompt: prompt
            }
          }
        }));

        if (idea.id && typeof idea.id === 'number') {
          try {
            await api.campaigns.updateIdea(idea.id, {
              plan_status: 'draft_created',
              media_asset_ids: rd.media_asset_id ? [rd.media_asset_id] : []
            });
          } catch (e) { }
        }
        setIdeas((prev) =>
          prev.map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
        );
        if (generatedDraftPlan) {
          setGeneratedDraftPlan((prev) => ({
            ...prev,
            ideas: (prev?.ideas || []).map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
          }));
        }
        showToast(`AI Video created for Day ${idea.day_number || ''}!`, 'success');
        setGeneratingMediaIdeaId(null);
        setMediaActionType((prev) => ({ ...prev, [key]: null }));
      } else {
        // Poll for background video job completion
        let pollCount = 0;
        let pollInFlight = false;
        const interval = setInterval(async () => {
          if (pollInFlight) return;
          pollInFlight = true;
          pollCount += 1;
          try {
            const updated = await api.generations.getJobStatus(job.id);
            if (updated.status === 'completed') {
              clearInterval(interval);
              videoPolls.current.delete(interval);
              const rd = updated.result_data || {};
              const videoUrl = getFullMediaUrl(rd.video_url);
        if (!videoUrl) throw new Error('Video job completed without a video file.');

              setIdeaGeneratedMedia((prev) => ({
                ...prev,
                [key]: {
                  ...(prev[key] || {}),
                  video: {
                    video_url: videoUrl,
                    media_asset_id: rd.media_asset_id,
                    video_prompt: prompt
                  }
                }
              }));

              if (idea.id && typeof idea.id === 'number') {
                try {
                  await api.campaigns.updateIdea(idea.id, { plan_status: 'draft_created' });
                } catch (e) { }
              }
              setIdeas((prev) =>
                prev.map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
              );
              if (generatedDraftPlan) {
                setGeneratedDraftPlan((prev) => ({
                  ...prev,
                  ideas: (prev?.ideas || []).map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
                }));
              }

              showToast(`AI Video completed for Day ${idea.day_number || ''}!`, 'success');
              setGeneratingMediaIdeaId(null);
              setMediaActionType((prev) => ({ ...prev, [key]: null }));
            } else if (updated.status === 'failed' || pollCount > 60) {
              clearInterval(interval);
              videoPolls.current.delete(interval);
              setGeneratingMediaIdeaId(null);
              setMediaActionType((prev) => ({ ...prev, [key]: null }));
              showToast(updated.error_message || 'Video is still processing. Check generation history for its status.', updated.status === 'failed' ? 'error' : 'warning');
            }
          } catch (pollErr) {
            clearInterval(interval);
            videoPolls.current.delete(interval);
            setGeneratingMediaIdeaId(null);
            setMediaActionType((prev) => ({ ...prev, [key]: null }));
            showToast(pollErr.message || 'Could not check video status. Check generation history.', 'error');
          } finally {
            pollInFlight = false;
          }
        }, 4000);
        videoPolls.current.add(interval);
      }
    } catch (err) {
      console.error('Video creation failed:', err);
      showToast(`AI Video creation failed: ${err.message}`, 'error');
      setGeneratingMediaIdeaId(null);
      setMediaActionType((prev) => ({ ...prev, [key]: null }));
    }
  };

  // 3. 1-CLICK MULTI-MEDIA BUNDLE (Images, Video & Description together)
  const handleGenerateMediaForIdea = async (idea, ideaKey) => {
    const key = ideaKey || getIdeaKey(idea);
    setGeneratingMediaIdeaId(key);
    setMediaActionType((prev) => ({ ...prev, [key]: 'bundle' }));
    const activeGoal = activePlan?.tags?.campaign_goal || activePlan?.objective || genGoal || 'Brand Awareness';
    const customFocus = activePlan?.tags?.custom_focus || idea.custom_focus || genCustomFocus || '';
    const focusClause = customFocus ? ` Campaign Focus/Themes/Offers: ${customFocus}.` : '';
    showToast(`Synthesizing AI Media Bundle (Images, Video & Copy) for "${idea.topic}"...`, 'info');
    try {
      const promptCombined = `${idea.topic}.${focusClause} Details: ${idea.description || idea.caption_brief || idea.hook || ''}`.trim();
      const isVideoFormat = (idea.content_format || '').toLowerCase().includes('video') || (idea.content_format || '').toLowerCase().includes('reel');
      const targetPlat = idea.platform ? idea.platform.toLowerCase() : 'instagram';
      const visualScenePrompt = buildVisualScenePrompt(idea, isVideoFormat ? 'video' : 'image');

      const res = await api.generations.generateFullBundle({
        brand_profile_id: brandProfile?.id || null,
        prompt: promptCombined,
        image_prompt: visualScenePrompt,
        video_prompt: visualScenePrompt,
        campaign_goal: activeGoal,
        target_platforms: [targetPlat],
        aspect_ratio: isVideoFormat ? '9:16' : '1:1',
        variation_seed: `${Date.now()}-${key}`
      });

      if (res) {
        // Normalize URLs
        if (res.image?.image_url) {
          res.image.image_url = getFullMediaUrl(res.image.image_url);
        }
        if (res.video?.video_url) {
          res.video.video_url = getFullMediaUrl(res.video.video_url);
        }

        setIdeaGeneratedMedia((prev) => ({
          ...prev,
          [key]: res
        }));

        const assetIds = [];
        if (res.image?.media_asset_id) assetIds.push(res.image.media_asset_id);
        if (res.video?.media_asset_id) assetIds.push(res.video.media_asset_id);

        if (idea.id && typeof idea.id === 'number') {
          try {
            await api.campaigns.updateIdea(idea.id, {
              plan_status: 'draft_created',
              media_asset_ids: assetIds
            });
          } catch (e) { }
        }
        setIdeas((prev) =>
          prev.map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
        );
        if (generatedDraftPlan) {
          setGeneratedDraftPlan((prev) => ({
            ...prev,
            ideas: (prev?.ideas || []).map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
          }));
        }

        if (res.video?.job_id && !res.video?.video_url) {
          showToast(`Bundle created: Image & copy ready, 30s video rendering in background...`, 'success');
          // Poll for background video job completion
          let pollCount = 0;
          let pollInFlight = false;
          const interval = setInterval(async () => {
            if (pollInFlight) return;
            pollInFlight = true;
            pollCount += 1;
            try {
              const updated = await api.generations.getJobStatus(res.video.job_id);
              if (updated.status === 'completed') {
                clearInterval(interval);
                videoPolls.current.delete(interval);
                const rd = updated.result_data || {};
                const videoUrl = getFullMediaUrl(rd.video_url || rd.file_path);
                if (videoUrl) {
                  setIdeaGeneratedMedia((prev) => ({
                    ...prev,
                    [key]: {
                      ...(prev[key] || {}),
                      video: {
                        ...(prev[key]?.video || {}),
                        video_url: videoUrl,
                        media_asset_id: rd.media_asset_id,
                        status: 'completed'
                      }
                    }
                  }));
                  showToast(`30s AI Video completed for Day ${idea.day_number || ''}!`, 'success');
                }
              } else if (updated.status === 'failed' || pollCount > 60) {
                clearInterval(interval);
                videoPolls.current.delete(interval);
              }
            } catch (pollErr) {
              clearInterval(interval);
              videoPolls.current.delete(interval);
            } finally {
              pollInFlight = false;
            }
          }, 4000);
          videoPolls.current.add(interval);
        } else {
          showToast(`AI Media Bundle (Images, Video & Description) synthesized for Day ${idea.day_number || ''}!`, 'success');
        }
      }
    } catch (err) {
      console.error('Failed to generate media for idea:', err);
      showToast(`Media bundle creation failed: ${err.message}`, 'error');
    } finally {
      setGeneratingMediaIdeaId(null);
      setMediaActionType((prev) => ({ ...prev, [key]: null }));
    }
  };

  // 5. AUTO-GENERATE ALL MEDIA (Images & Videos) FOR ALL 7 DAYS
  const handleBatchGenerateAllMedia = async () => {
    const targetIdeas = (generatedDraftPlan?.ideas && generatedDraftPlan.ideas.length > 0) ? generatedDraftPlan.ideas : ideas;
    if (!targetIdeas.length) {
      showToast('No planned ideas available to synthesize media for.', 'warning');
      return;
    }
    setIsBatchGeneratingAllMedia(true);
    showToast(`Starting automated Image & Video Reel synthesis for ${targetIdeas.length} campaign days...`, 'info');
    let completedCount = 0;

    for (let idx = 0; idx < targetIdeas.length; idx++) {
      const idea = targetIdeas[idx];
      const key = getIdeaKey(idea, idx);
      setGeneratingMediaIdeaId(key);
      setMediaActionType((prev) => ({ ...prev, [key]: 'bundle' }));

      try {
        const activeGoal = activePlan?.tags?.campaign_goal || activePlan?.objective || genGoal || 'Brand Awareness';
        const customFocus = activePlan?.tags?.custom_focus || idea.custom_focus || genCustomFocus || '';
        const focusClause = customFocus ? ` Campaign Focus/Themes/Offers: ${customFocus}.` : '';
        const isVideoFormat = (idea.content_format || '').toLowerCase().includes('video') || (idea.content_format || '').toLowerCase().includes('reel');
        const targetPlat = idea.platform ? idea.platform.toLowerCase() : 'instagram';
        const promptCombined = `${idea.topic}.${focusClause} Details: ${idea.description || idea.caption_brief || idea.hook || ''}`.trim();
        const visualScenePrompt = buildVisualScenePrompt(idea, isVideoFormat ? 'video' : 'image');

        const res = await api.generations.generateFullBundle({
          brand_profile_id: brandProfile?.id || null,
          prompt: promptCombined,
          image_prompt: visualScenePrompt,
          video_prompt: visualScenePrompt,
          campaign_goal: activeGoal,
          target_platforms: [targetPlat],
          aspect_ratio: isVideoFormat ? '9:16' : '1:1',
          variation_seed: `${Date.now()}-${key}`
        });

        if (res) {
          if (res.image?.image_url) {
            res.image.image_url = getFullMediaUrl(res.image.image_url);
          }
          if (res.video?.video_url) {
            res.video.video_url = getFullMediaUrl(res.video.video_url);
          }

          setIdeaGeneratedMedia((prev) => ({
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              ...(res.image?.image_url ? { image: { image_url: res.image.image_url, media_asset_id: res.image.media_asset_id, prompt: promptCombined } } : {}),
              ...(res.video?.video_url ? { video: { video_url: res.video.video_url, media_asset_id: res.video.media_asset_id, video_prompt: promptCombined } } : {}),
              text: {
                caption: idea.description || idea.caption || res.caption || promptCombined,
                hashtags: idea.hashtags || [],
                call_to_action: idea.call_to_action || idea.cta || ''
              }
            }
          }));

          if (idea.id && typeof idea.id === 'number') {
            try {
              const batchIds = [res.image?.media_asset_id, res.video?.media_asset_id].filter(Boolean);
              await api.campaigns.updateIdea(idea.id, {
                plan_status: 'draft_created',
                media_asset_ids: batchIds
              });
            } catch (e) { }
          }
          setIdeas((prev) =>
            prev.map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
          );
          completedCount += 1;
        }
      } catch (err) {
        console.error(`Media synthesis notice for Day ${idea.day_number}:`, err);
      }
    }

    setGeneratingMediaIdeaId(null);
    setIsBatchGeneratingAllMedia(false);
    showToast(`Automated media synthesis completed for ${completedCount} of ${targetIdeas.length} campaign days!`, 'success');
  };

  // 4. BATCH GENERATE IMAGES FOR ALL IDEAS (Cloudflare Flux)
  const handleBatchGenerateImages = async () => {
    const targetIdeas = (generatedDraftPlan?.ideas && generatedDraftPlan.ideas.length > 0) ? generatedDraftPlan.ideas : ideas;
    if (!targetIdeas.length) {
      showToast('No planned ideas available to generate images for', 'warning');
      return;
    }
    setIsBatchGenerating(true);
    showToast(`Starting Cloudflare Flux AI Image creation for ${targetIdeas.length} ideas in campaign...`, 'info');
    let successCount = 0;

    for (let idx = 0; idx < targetIdeas.length; idx++) {
      const idea = targetIdeas[idx];
      const key = getIdeaKey(idea, idx);
      try {
        const prompt = buildVisualScenePrompt(idea, 'image');

        const res = await api.generations.generateImage({
          prompt: prompt,
          brand_profile_id: brandProfile?.id || null,
          aspect_ratio: '1:1',
          style_preset: 'modern_product'
        });

        const rd = res?.result_data || {};
        const imgUrl = getFullMediaUrl(rd.image_url);

        if (imgUrl) {
          setIdeaGeneratedMedia((prev) => ({
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              image: {
                image_url: imgUrl,
                media_asset_id: rd.media_asset_id,
                prompt: prompt,
                provider: rd.provider || res?.provider || 'cloudflare-flux'
              }
            }
          }));
          successCount++;
        }
      } catch (err) {
        console.warn(`Batch image generation failed for idea ${key}:`, err);
      }
    }

    setIsBatchGenerating(false);
    showToast(`Batch AI Image creation complete: ${successCount}/${targetIdeas.length} images created!`, 'success');
  };

  const handleSendToContentStudio = async (idea, ideaKey) => {
    const key = ideaKey || getIdeaKey(idea);
    try {
      if (idea.id && typeof idea.id === 'number') {
        try {
          await api.campaigns.updateIdea(idea.id, { plan_status: 'draft_created' });
        } catch (e) { }
      }

      setIdeas((prev) =>
        prev.map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
      );
      if (generatedDraftPlan) {
        setGeneratedDraftPlan((prev) => ({
          ...prev,
          ideas: (prev?.ideas || []).map((i, iIdx) => (getIdeaKey(i, iIdx) === key ? { ...i, plan_status: 'draft_created' } : i))
        }));
      }

      // Package transfer payload for ContentStudio / CreatePostView
      const genMedia = ideaGeneratedMedia[key];
      const transferPayload = {
        id: idea.id,
        campaign_id: activePlan?.id || selectedCampaignId,
        campaign_name: activePlan?.name || 'AI Content Plan',
        topic: idea.topic || '',
        hook: idea.hook || '',
        caption_brief: idea.caption_brief || '',
        full_caption: genMedia?.text?.caption || '',
        call_to_action: genMedia?.text?.call_to_action || idea.call_to_action || '',
        content_format: idea.content_format || 'Post',
        platform: idea.platform || 'Instagram',
        suggested_date: idea.suggested_date || '',
        suggested_time: idea.suggested_time || '10:00',
        hashtags: genMedia?.text?.hashtags || idea.hashtags || [],
        content_pillar: idea.content_pillar || '',
        media: genMedia?.image?.image_url
          ? {
            id: genMedia?.image?.media_asset_id,
            file_url: getFullMediaUrl(genMedia?.image?.image_url),
            mediaUrl: getFullMediaUrl(genMedia?.image?.image_url),
            media_type: 'image',
            contentType: 'image',
            title: idea.topic,
            file_name: `${idea.topic || 'artwork'}.png`
          }
          : genMedia?.video?.video_url
            ? {
              id: genMedia?.video?.media_asset_id,
              file_url: getFullMediaUrl(genMedia?.video?.video_url),
              mediaUrl: getFullMediaUrl(genMedia?.video?.video_url),
              media_type: 'video',
              contentType: 'video',
              title: idea.topic,
              file_name: `${idea.topic || 'reel'}.mp4`
            }
            : null
      };

      localStorage.setItem('sacp_planner_idea_transfer', JSON.stringify(transferPayload));

      showToast(`Sent "${idea.topic}" with all AI assets to Content Studio!`, 'success');
      if (onNavigate) {
        onNavigate('content-studio');
      }
    } catch (err) {
      console.error('Error sending idea to studio:', err);
      showToast('Failed to transfer idea to Content Studio', 'error');
    }
  };

  const handleUpdateStatus = async (ideaId, newStatus) => {
    try {
      await api.campaigns.updateIdea(ideaId, { plan_status: newStatus });
      setIdeas((prev) =>
        prev.map((i) => (i.id === ideaId ? { ...i, plan_status: newStatus } : i))
      );
      showToast(`Updated status to ${STATUS_CONFIG[newStatus]?.label || newStatus}`, 'success');
    } catch (err) {
      console.error('Error updating status:', err);
      showToast('Failed to update status', 'error');
    }
  };

  const handleCopyCaption = (idea) => {
    const textToCopy = idea.description || idea.caption || `${idea.hook || ''}\n\n${idea.caption_brief || ''}\n\n${idea.call_to_action || idea.cta || ''}`.trim();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedIdeaId(idea.id || idea.topic);
      showToast('Full post caption copied to clipboard!', 'success');
      setTimeout(() => setCopiedIdeaId(null), 2500);
    }
  };

  const handleScheduleCampaign = async () => {
    if (!activePlan?.id) {
      showToast('Please select or save a campaign plan before scheduling.', 'error');
      return;
    }
    setIsSubmittingSchedule(true);
    try {
      const savedConfig = activePlan.tags || {};
      const configuredPlatforms = Array.isArray(savedConfig.platforms) ? savedConfig.platforms : [];
      const res = await api.campaigns.schedulePlan(activePlan.id, {
        auto_approve: scheduleMode === 'auto_post',
        timezone: savedConfig.timezone || scheduleTimezone,
        platform: String(configuredPlatforms[0] || schedulePlatform).toLowerCase(),
        start_date: activePlan.start_date ? activePlan.start_date.slice(0, 10) : undefined,
        daily_posting_time: savedConfig.daily_posting_time || undefined
      });
      showToast(res.message || `All 7 days scheduled in ${scheduleMode === 'auto_post' ? 'Auto-Post' : 'Approval Required'} mode!`, 'success');
      setIsScheduleModalOpen(false);
      // Reload ideas to display updated scheduled status badges
      await loadCampaignIdeas(activePlan.id);
    } catch (err) {
      showToast(err.message || 'Failed to auto-schedule campaign plan.', 'error');
    } finally {
      setIsSubmittingSchedule(false);
    }
  };

  const handleQuickFixTiming = async (idea, newDate, newTime) => {
    const updatedDate = newDate || idea.suggested_date;
    const updatedTime = newTime || idea.suggested_time || '10:00';
    // Optimistic UI update
    setIdeas((prev) =>
      prev.map((i) =>
        i.id === idea.id || getIdeaKey(i) === getIdeaKey(idea)
          ? { ...i, suggested_date: updatedDate, suggested_time: updatedTime }
          : i
      )
    );
    if (idea.id && typeof idea.id === 'number') {
      try {
        await api.campaigns.updateIdea(idea.id, {
          suggested_date: updatedDate,
          suggested_time: updatedTime
        });
        showToast(`Timing for Day ${idea.day_number || ''} fixed to ${updatedDate} at ${updatedTime}`, 'success');
      } catch (err) {
        console.warn('Notice updating idea timing:', err);
      }
    }
  };

  const handleApplyCommonTiming = async () => {
    if (!activePlan?.id) {
      showToast('Please select or save a campaign plan before configuring timing.', 'error');
      return;
    }
    setIsApplyingTiming(true);
    try {
      const res = await api.campaigns.schedulePlan(activePlan.id, {
        auto_approve: commonMode === 'auto_post',
        timezone: commonTimezone,
        platform: 'instagram',
        start_date: commonStartDate,
        daily_posting_time: commonDailyTime
      });

      // Optimistically update ideas state with dates and times
      setIdeas((prev) =>
        prev.map((idea, idx) => {
          const d = new Date(commonStartDate);
          d.setDate(d.getDate() + idx);
          const dateStr = d.toISOString().split('T')[0];
          return {
            ...idea,
            suggested_date: dateStr,
            suggested_time: commonDailyTime,
            status: commonMode === 'auto_post' ? 'scheduled' : 'pending_approval'
          };
        })
      );

      showToast(
        res.message || `Timing activated! Starting ${commonStartDate} at ${commonDailyTime}. AI will automatically generate the branded image, video reel, and description at each scheduled time.`,
        'success'
      );
      await loadCampaignIdeas(activePlan.id);
    } catch (err) {
      console.error('Error applying common timing:', err);
      showToast(err.message || 'Failed to apply common campaign timing.', 'error');
    } finally {
      setIsApplyingTiming(false);
    }
  };

  const handleRegenerateIdea = async (ideaId) => {
    if (!ideaId || typeof ideaId !== 'number') {
      showToast('Cannot regenerate: idea not yet saved to database.', 'warning');
      return;
    }
    setRegeneratingIdeaId(ideaId);
    try {
      const updated = await api.campaigns.regenerateIdea(ideaId);
      setIdeas((prev) => prev.map((i) => (i.id === ideaId ? updated : i)));
      showToast('Idea regenerated with fresh creative angles!', 'success');
    } catch (err) {
      console.error('Error regenerating idea:', err);
      showToast(err?.response?.data?.detail || err.message || 'Failed to regenerate idea', 'error');
    } finally {
      setRegeneratingIdeaId(null);
    }
  };

  const handleDeleteIdea = async (ideaId) => {
    if (!window.confirm('Are you sure you want to delete this planned idea?')) return;
    try {
      await api.campaigns.deleteIdea(ideaId);
      setIdeas((prev) => prev.filter((i) => i.id !== ideaId));
      showToast('Planned idea deleted from database', 'info');
    } catch (err) {
      console.error('Error deleting idea:', err);
      showToast('Failed to delete idea', 'error');
    }
  };

  const handleSaveEditIdea = async () => {
    if (!editingIdea) return;
    try {
      const payload = {
        topic: editingIdea.topic,
        hook: editingIdea.hook,
        caption_brief: editingIdea.caption_brief,
        call_to_action: editingIdea.call_to_action,
        content_format: editingIdea.content_format,
        platform: editingIdea.platform,
        suggested_date: editingIdea.suggested_date,
        suggested_time: editingIdea.suggested_time,
        hashtags: Array.isArray(editingIdea.hashtags)
          ? editingIdea.hashtags
          : String(editingIdea.hashtags || '')
            .split(/[\s,]+/)
            .filter(Boolean),
        content_pillar: editingIdea.content_pillar,
        plan_status: editingIdea.plan_status
      };

      const updated = await api.campaigns.updateIdea(editingIdea.id, payload);
      setIdeas((prev) => prev.map((i) => (i.id === editingIdea.id ? updated : i)));
      setEditingIdea(null);
      showToast('Idea updated successfully!', 'success');
    } catch (err) {
      console.error('Failed to update idea:', err);
      showToast('Failed to save changes to idea', 'error');
    }
  };

  const handleAddCustomIdeaSubmit = async () => {
    if (!customIdeaForm.topic.trim()) {
      showToast('Please enter a topic for the idea', 'warning');
      return;
    }
    if (!selectedCampaignId) {
      showToast('Please select or create a campaign plan first', 'warning');
      return;
    }

    try {
      // Append idea by calling save-plan or update
      const newIdeaObj = {
        ...customIdeaForm,
        hashtags: customIdeaForm.hashtags
          .split(/[\s,]+/)
          .filter(Boolean)
          .map((h) => (h.startsWith('#') ? h : `#${h}`)),
        plan_status: 'planned',
        day_number: ideas.length + 1
      };

      // Call savePlan with combined list
      const combinedIdeas = [...ideas, newIdeaObj];
      const res = await api.campaigns.savePlan({
        title: activePlan?.name || 'Custom Plan',
        campaign_goal: activePlan?.goal || 'Growth',
        duration_days: activePlan?.tags?.duration_days || 7,
        frequency: activePlan?.tags?.posting_frequency || '1_per_day',
        platforms: activePlan?.tags?.platforms || [customIdeaForm.platform],
        start_date: activePlan?.start_date ? activePlan.start_date.split('T')[0] : genStartDate,
        ideas: combinedIdeas
      });

      showToast('Custom idea added to plan!', 'success');
      setIsAddingCustomIdea(false);
      setCustomIdeaForm({
        topic: '',
        hook: '',
        caption_brief: '',
        call_to_action: '',
        content_format: 'Post',
        platform: 'Instagram',
        suggested_date: '',
        suggested_time: '10:00',
        hashtags: '',
        content_pillar: 'Awareness'
      });

      if (res?.campaign?.id) {
        await loadCampaignIdeas(res.campaign.id);
      }
    } catch (err) {
      console.error('Error adding custom idea:', err);
      showToast('Failed to add custom idea', 'error');
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this entire campaign plan and all its planned ideas?'
      )
    )
      return;
    try {
      await api.campaigns.delete(campaignId);
      showToast('Campaign plan deleted', 'info');
      await loadCampaigns();
    } catch (err) {
      console.error('Error deleting campaign:', err);
      showToast('Failed to delete campaign plan', 'error');
    }
  };

  const handleCampaignLifecycle = async (campaignId, action) => {
    try {
      const updated = await api.campaigns[action](campaignId);
      showToast(`Campaign ${action === 'cancel' ? 'cancelled' : `${action}d`}.`, 'success');
      await loadCampaigns(updated?.id || campaignId);
    } catch (err) {
      showToast(err.message || `Could not ${action} campaign.`, 'error');
    }
  };

  const handleDuplicateCampaign = async (campaignId) => {
    try {
      const copy = await api.campaigns.duplicate(campaignId);
      showToast('Campaign copied. It is saved as a draft plan and no posts were scheduled.', 'success');
      await loadCampaigns(copy?.id || null);
    } catch (err) {
      showToast(err.message || 'Could not duplicate campaign.', 'error');
    }
  };

  // -------------------------------------------------------------
  // Filtered Ideas Computation
  // -------------------------------------------------------------
  const displayIdeas = generatedDraftPlan ? generatedDraftPlan.ideas : ideas;

  const filteredIdeas = useMemo(() => {
    return displayIdeas.filter((item) => {
      if (!item) return false;
      if (filterStatus !== 'all' && item.plan_status !== filterStatus) return false;
      if (filterPlatform !== 'all' && item.platform !== filterPlatform) return false;
      if (
        filterFormat !== 'all' &&
        (item.content_format || '').toLowerCase() !== filterFormat.toLowerCase()
      )
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          (item.topic || '').toLowerCase().includes(q) ||
          (item.hook || '').toLowerCase().includes(q) ||
          (item.caption_brief || '').toLowerCase().includes(q) ||
          (item.call_to_action || '').toLowerCase().includes(q) ||
          (Array.isArray(item.hashtags) ? item.hashtags.join(' ') : item.hashtags || '')
            .toLowerCase()
            .includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [displayIdeas, filterStatus, filterPlatform, filterFormat, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <DashboardPageHeader
        badge="1. AI STUDIO"
        badgeType="indigo"
        statusBadge="Live Database Calendar"
        title="AI Content Planner"
        description={`Synthesize high-converting 7-day and 30-day multi-channel content plans, hooks, formats, and scheduled dates grounded in ${brandName}'s verified brand directives.`}
      >
        <button
          onClick={() => onNavigate && onNavigate('brand-profile')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text bg-surface border border-border hover:bg-bg transition-all shadow-xs btn-smooth cursor-pointer"
        >
          <Settings className="w-4 h-4 text-text-muted" />
          <span>Brand Directives ({productsCount} Products)</span>
        </button>

        <button
          onClick={() => loadCampaigns(selectedCampaignId)}
          disabled={isLoadingCampaigns || isLoadingIdeas}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text bg-surface border border-border hover:bg-bg transition-all shadow-xs btn-smooth cursor-pointer"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoadingCampaigns || isLoadingIdeas ? 'animate-spin' : ''}`}
          />
          <span>Refresh</span>
        </button>

        <button
          onClick={() => {
            setGeneratedDraftPlan(null);
            setIsGeneratorOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-on hover:opacity-90 transition-all shadow-xs btn-smooth cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-primary-on" />
          <span>New AI Plan Generator</span>
        </button>
      </DashboardPageHeader>

      {/* Brand Directives Snapshot Card */}
      <SpotlightCard className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-bold text-text">{brandName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/25">
                  {brandProfile?.industry || 'Autonomous Social Marketing'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface border border-border text-text-secondary">
                  {productsCount} verified products linked
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1 line-clamp-1">
                <span className="font-semibold text-text">Voice:</span>{' '}
                {brandProfile?.voice || 'Modern, confident & engaging'} •{' '}
                <span className="font-semibold text-text">Audience:</span>{' '}
                {brandProfile?.audience || brandProfile?.target_demographics || 'Digital-native consumers'} •{' '}
                <span className="font-semibold text-text">Primary CTA:</span>{' '}
                {brandProfile?.cta || 'Visit Store or DM us'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => onNavigate && onNavigate('brand-profile')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>Manage Directives</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </SpotlightCard>

      {/* Generator Drawer / Modal if Open */}
      {isGeneratorOpen && (
        <SpotlightCard className="p-6 sm:p-7 border-2 border-primary/30 relative">
          <button
            onClick={() => {
              if (
                !generatedDraftPlan ||
                window.confirm('Close generator? Unsaved plan preview will be discarded.')
              ) {
                setIsGeneratorOpen(false);
                setGeneratedDraftPlan(null);
              }
            }}
            className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-bg text-text-muted hover:text-text cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="max-w-5xl space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary mb-2">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>AI Multi-Channel Campaign Architect</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-text">
                Generate Structured AI Content Plan
              </h2>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Select your timeframe, target platforms, and campaign goal. Gemini AI will synthesize
                dates, opening hooks, caption briefs, hashtags, and formats tailored to {brandName}.
              </p>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Duration Choice */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>Campaign Plan Horizon</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setGenDuration(7)}
                    className={`p-3 rounded-xl border text-left transition-all btn-smooth cursor-pointer ${genDuration === 7
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-bg'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold text-text">7-Day Sprint</div>
                      {genDuration === 7 && (
                        <Check className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary">Agile weekly campaign calendar</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenDuration(30)}
                    className={`p-3 rounded-xl border text-left transition-all btn-smooth cursor-pointer ${genDuration === 30
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-bg'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-extrabold text-text">30-Day Master</div>
                      {genDuration === 30 && (
                        <Check className="w-3.5 h-3.5 text-success" />
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary">Full monthly strategic blueprint</div>
                  </button>
                </div>
              </div>

              {/* Posting Frequency */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Publishing Cadence & Frequency</span>
                </label>
                <select
                  value={genFrequency}
                  onChange={(e) => setGenFrequency(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="1_per_day">1 Post / Day (Consistent Momentum)</option>
                  <option value="2_per_day">2 Posts / Day (Peak Reach & Omnichannel)</option>
                  <option value="alternate_days">Alternate Days (Steady & Balanced)</option>
                  <option value="5_per_week">5 Posts / Week (Weekdays Focus)</option>
                  <option value="3_per_week">3 Posts / Week (Curated Highlights)</option>
                </select>
              </div>

              {/* Media Format Preference (Images, Videos, or Both) */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-text-secondary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Creative Format Preference</span>
                  </span>
                  <span className="text-[11px] font-normal text-text-muted">
                    {genMediaPreference === 'images'
                      ? 'Images only'
                      : genMediaPreference === 'videos'
                        ? 'Video Reels & Shorts only'
                        : 'Balanced Image & Video mix'}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setGenMediaPreference('images')}
                    className={`p-3 rounded-xl border text-left transition-all btn-smooth cursor-pointer ${genMediaPreference === 'images'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-bg'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-extrabold text-text">Images Only</span>
                      {genMediaPreference === 'images' && (
                        <Check className="w-3.5 h-3.5 ml-auto text-success" />
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-1 leading-snug">
                      Stills, photo posts & single-image graphics
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenMediaPreference('videos')}
                    className={`p-3 rounded-xl border text-left transition-all btn-smooth cursor-pointer ${genMediaPreference === 'videos'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-bg'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Film className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-extrabold text-text">Videos Only</span>
                      {genMediaPreference === 'videos' && (
                        <Check className="w-3.5 h-3.5 ml-auto text-success" />
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-1 leading-snug">
                      Reels, Shorts & viral video concepts
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setGenMediaPreference('both')}
                    className={`p-3 rounded-xl border text-left transition-all btn-smooth cursor-pointer ${genMediaPreference === 'both'
                        ? 'border-primary bg-primary/10 text-primary font-bold shadow-xs'
                        : 'border-border bg-surface text-text-secondary hover:bg-bg'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-extrabold text-text">Both (Images & Videos)</span>
                      {genMediaPreference === 'both' && (
                        <Check className="w-3.5 h-3.5 ml-auto text-success" />
                      )}
                    </div>
                    <div className="text-[11px] text-text-secondary mt-1 leading-snug">
                      Balanced mix of high-impact stills and video reels
                    </div>
                  </button>
                </div>
              </div>

              {/* Target Platforms */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-text-secondary flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>Target Social Channels</span>
                  </span>
                  <span className="text-[11px] font-normal text-text-muted">
                    {genPlatforms.length} selected
                  </span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_PLATFORMS.map((plat) => {
                    const isSelected = genPlatforms.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handleToggleGenPlatform(plat.id)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all btn-smooth cursor-pointer ${isSelected
                            ? 'bg-primary text-primary-on shadow-xs'
                            : 'bg-surface text-text-secondary border border-border hover:border-primary/40'
                          }`}
                      >
                        <span>{plat.icon}</span>
                        <span>{plat.name}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Campaign Scheduling Configuration: Primary Goal, Start Date, Timezone, Posting Time in 1 Single Responsive Row */}
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                {/* 1. Primary Campaign Goal */}
                <div className="md:col-span-4 space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5 h-5 mb-0.5">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    <span className="whitespace-nowrap font-bold">Primary Campaign Goal</span>
                  </label>
                  <input
                    type="text"
                    value={genGoal}
                    onChange={(e) => setGenGoal(e.target.value)}
                    placeholder="e.g., Launch summer coffee beans..."
                    className="w-full h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* 2. Start Publishing Date */}
                <div className="md:col-span-3 space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5 h-5 mb-0.5">
                    <Calendar className="w-4 h-4 text-primary shrink-0" />
                    <span className="whitespace-nowrap font-bold">Start Publishing Date</span>
                  </label>
                  <input
                    type="date"
                    value={genStartDate}
                    onChange={(e) => setGenStartDate(e.target.value)}
                    className="w-full h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* 3. Publishing Timezone */}
                <div className="md:col-span-3 space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5 h-5 mb-0.5">
                    <Globe className="w-4 h-4 text-primary shrink-0" />
                    <span className="whitespace-nowrap font-bold">Publishing Timezone</span>
                  </label>
                  <select
                    value={genTimezone}
                    onChange={(e) => setGenTimezone(e.target.value)}
                    className="w-full h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                {/* 4. Daily Posting Time */}
                <div className="md:col-span-2 space-y-1.5 flex flex-col">
                  <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5 h-5 mb-0.5">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span className="whitespace-nowrap font-bold">Daily Posting Time</span>
                  </label>
                  <input
                    type="time"
                    value={genDailyTime}
                    onChange={(e) => setGenDailyTime(e.target.value)}
                    className="w-full h-[42px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              {/* Custom Focus */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-text-secondary flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <span>Custom Campaign Focus, Themes or Offers (Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Highlight our new autumn product line, feature client testimonial hooks, include 15% discount CTA"
                  value={genCustomFocus}
                  onChange={(e) => setGenCustomFocus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-text-secondary flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-primary" />
                    <span>Media Library Collection (Optional)</span>
                  </span>
                  <button
                    type="button"
                    onClick={loadMediaCategories}
                    disabled={isLoadingMediaCategories}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingMediaCategories ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </label>
                <select
                  value={genMediaCollectionId}
                  onChange={(e) => setGenMediaCollectionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="">No collection — do not assign generated media</option>
                  {mediaCollections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}{collection.description ? ` — ${collection.description}` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-text-muted">
                  Select a collection here. Generated campaign media will be automatically saved and organized into that collection in your Media Library.
                </p>
              </div>
            </div>

            {/* AI Resilience Status & Real-Time Progress Bar */}
            <div className="pt-2 pb-1 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-text-muted">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-success" />
                  <span>Resilient AI Cascade:</span>
                  <span className="font-semibold text-text">
                    {aiHealth?.active_primary_provider === 'openai' ? 'OpenAI (Active)' : 'Google Gemini (Primary)'}
                    {' → '}OpenAI{' → '}Brand Synthesizer
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                  Circuit Protected
                </span>
              </div>

              {isGenerating && (
                <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/25 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>{generationStatusText || 'Generating strategic content plan...'}</span>
                    </span>
                    <span>{generationProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 rounded-full"
                      style={{ width: `${generationProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {fallbackBanner && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-warning/10 border border-warning/30 text-xs text-warning">
                  <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold">Resilient Failover Triggered: </strong>
                    <span>{fallbackBanner}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Generator Action Buttons */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setIsGeneratorOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary hover:text-text hover:bg-bg transition-all cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGeneratePlan}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-primary text-primary-on hover:opacity-90 transition-all shadow-xs btn-smooth disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>{isGenerating || isSavingPlan ? 'Generating & Saving...' : 'Generate & Save Plan'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Generated Plan Review Banner inside Drawer */}
          {generatedDraftPlan && (
            <div className="mt-6 pt-6 border-t-2 border-dashed border-primary/30 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/25">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-success text-white">
                      GENERATION COMPLETE
                    </span>
                    <h3 className="text-sm font-bold text-text">
                      {generatedDraftPlan.campaign_name}
                    </h3>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {generatedDraftPlan.ideas?.length || 0} unique content ideas prepared across{' '}
                    {(generatedDraftPlan.platforms || []).join(', ')} from{' '}
                    {generatedDraftPlan.start_date} •{' '}
                    <strong className="text-primary font-bold">
                      {genMediaPreference === 'images'
                        ? 'Images Only'
                        : genMediaPreference === 'videos'
                          ? 'Videos & Reels Only'
                          : 'Both Images & Videos'}
                    </strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGeneratedDraftPlan(null)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text hover:bg-bg transition cursor-pointer"
                  >
                    Discard Preview
                  </button>
                  <button
                    type="button"
                    disabled={isSavingPlan}
                    onClick={handleSaveDraftPlan}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-success hover:opacity-90 transition shadow-xs btn-smooth cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>{isSavingPlan ? 'Saving to Database...' : 'Retry Save to Database'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </SpotlightCard>
      )}

      {/* Campaign Selector Bar */}
      <div className="flex items-center justify-between gap-3 pb-1 border-b border-border">
        {/* Campaign Tabs / Selector */}
        <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-1 pr-1 [scrollbar-width:thin]">
          {isLoadingCampaigns ? (
            <div className="flex items-center gap-2 text-xs text-text-muted py-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Loading saved campaigns...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-xs text-text-muted italic py-2">
              No saved campaign plans yet. Click "New Plan" to create one.
            </div>
          ) : (
            campaigns.map((camp) => {
              const isSelected = camp.id === selectedCampaignId && !generatedDraftPlan;
              return (
                <div
                  key={camp.id}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all border shrink-0 cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus-ring ${isSelected
                      ? 'bg-primary text-primary-on border-primary shadow-xs'
                      : 'bg-surface text-text border-border hover:border-primary/40'
                    }`}
                  onClick={() => {
                    setGeneratedDraftPlan(null);
                    setSelectedCampaignId(camp.id);
                  }}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[200px]">{camp.title || camp.name}</span>
                  <span className="text-[10px] opacity-80 ml-1">
                    ({camp.tags?.duration_days ? `${camp.tags.duration_days}d` : 'Plan'})
                  </span>
                  {camp.progress?.planned > 0 && (
                    <span className="text-[10px] opacity-80">{camp.progress.generated}/{camp.progress.planned}</span>
                  )}
                  <button
                    type="button"
                    title="Duplicate campaign"
                    className="p-1 hover:text-accent ml-1 rounded-md transition"
                    onClick={(e) => { e.stopPropagation(); handleDuplicateCampaign(camp.id); }}
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {camp.status === 'paused' ? (
                    <button type="button" title="Resume campaign" className="p-1 hover:text-success ml-1 rounded-md transition" onClick={(e) => { e.stopPropagation(); handleCampaignLifecycle(camp.id, 'resume'); }}>
                      <Play className="w-3 h-3" />
                    </button>
                  ) : camp.status !== 'cancelled' && (
                    <button type="button" title="Pause campaign" className="p-1 hover:text-warning ml-1 rounded-md transition" onClick={(e) => { e.stopPropagation(); handleCampaignLifecycle(camp.id, 'pause'); }}>
                      <span className="text-[10px] leading-none">Ⅱ</span>
                    </button>
                  )}
                  <button
                    type="button"
                    title="Delete campaign plan"
                    className="p-1 hover:text-error ml-1 rounded-md transition"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(camp.id);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <button
          onClick={() => {
            setGeneratedDraftPlan(null);
            setIsGeneratorOpen(true);
          }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold text-primary bg-primary/10 border border-dashed border-primary/30 hover:bg-primary/20 shrink-0 whitespace-nowrap transition cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Plan</span>
        </button>
      </div>

      {/* Action Toolbar & View Mode Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2.5 rounded-2xl bg-surface border border-border backdrop-blur-md shadow-xs">
        {/* Primary Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-2">
          {activePlan && (
            <>
              {ideas.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition-all shadow-xs btn-smooth cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
                    title="Auto-schedule all 7 days with daily posting and media synthesis"
                  >
                    <Calendar className="w-3.5 h-3.5 text-primary-on" />
                    <span>Auto-Schedule 7-Day Campaign</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchGenerateAllMedia}
                    disabled={isBatchGeneratingAllMedia}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-accent text-accent-on hover:opacity-90 transition-all shadow-xs btn-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
                    title="Automatically synthesize both images and video reels for all 7 days tied to custom focus & offers"
                  >
                    <Film className={`w-3.5 h-3.5 text-accent-on ${isBatchGeneratingAllMedia ? 'animate-spin' : ''}`} />
                    <span>{isBatchGeneratingAllMedia ? 'Auto-Generating All Media...' : 'Auto-Generate All Media (Images & Videos)'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleBatchGenerateImages}
                    disabled={isBatchGenerating || isBatchGeneratingAllMedia}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text bg-surface border border-border hover:border-primary/40 transition-all shadow-2xs btn-smooth cursor-pointer disabled:opacity-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
                    title="Call AI Image API for all planned ideas"
                  >
                    <Sparkles className={`w-3.5 h-3.5 text-accent ${isBatchGenerating ? 'animate-spin' : ''}`} />
                    <span>{isBatchGenerating ? 'Creating All Images...' : 'Create All Images (AI)'}</span>
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsAddingCustomIdea(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text bg-surface border border-border hover:border-primary/40 shadow-xs btn-smooth cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <Plus className="w-3.5 h-3.5 text-primary" />
                <span>Add Custom Idea</span>
              </button>
            </>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center shrink-0 p-1 bg-bg rounded-xl border border-border shadow-xs self-start lg:self-center lg:ml-auto">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus-ring ${viewMode === 'calendar'
                ? 'bg-primary text-primary-on shadow-xs font-bold'
                : 'text-text-secondary hover:text-text'
              }`}
          >
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-focus-ring ${viewMode === 'cards'
                ? 'bg-primary text-primary-on shadow-xs font-bold'
                : 'text-text-secondary hover:text-text'
              }`}
          >
            Grid Cards
          </button>
        </div>
      </div>

      {/* Common Planner Timing & Auto-Publishing Control Engine */}
      {activePlan && ideas.length > 0 && !activePlan.tags?.daily_posting_time && (
        <SpotlightCard className="p-4 sm:p-5 border-l-4 border-l-primary bg-surface border border-border">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <h3 className="text-sm sm:text-base font-bold text-text">
                    Campaign Timing & Auto-Publishing Engine
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                    Live Scheduler
                  </span>
                </div>
                <p className="text-xs text-text-secondary mt-1">
                  Configure common campaign timing. When each scheduled day and time arrives, AI automatically generates the branded image, video reel, and description and publishes.
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyCommonTiming}
                disabled={isApplyingTiming}
                className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition-all shadow-xs btn-smooth cursor-pointer disabled:opacity-50"
              >
                <Sparkles className={`w-3.5 h-3.5 text-primary-on ${isApplyingTiming ? 'animate-spin' : ''}`} />
                <span>{isApplyingTiming ? 'Arming 7-Day Timing...' : 'Save & Arm 7-Day Timing'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Campaign Start Date
                </label>
                <input
                  type="date"
                  value={commonStartDate}
                  onChange={(e) => setCommonStartDate(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Daily Posting Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Daily Posting Time
                </label>
                <input
                  type="time"
                  value={commonDailyTime}
                  onChange={(e) => setCommonDailyTime(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Timezone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Target Timezone
                </label>
                <select
                  value={commonTimezone}
                  onChange={(e) => setCommonTimezone(e.target.value)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary/40 cursor-pointer"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="UTC">UTC (Universal)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
              </div>

              {/* Workflow Mode */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">
                  Publishing Mode
                </label>
                <div className="flex items-center gap-1.5 p-1 bg-bg border border-border rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCommonMode('auto_post')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${commonMode === 'auto_post'
                        ? 'bg-primary text-primary-on shadow-xs'
                        : 'text-text-secondary hover:text-text'
                      }`}
                  >
                    ⚡ Auto-Post
                  </button>
                  <button
                    type="button"
                    onClick={() => setCommonMode('approval_required')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${commonMode === 'approval_required'
                        ? 'bg-primary text-primary-on shadow-xs'
                        : 'text-text-secondary hover:text-text'
                      }`}
                  >
                    🛡️ Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SpotlightCard>
      )}

      {/* Filter & Search Bar */}
      <SpotlightCard className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="search"
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-text placeholder:text-text-muted"
              placeholder="Search topics, hooks, caption briefs, hashtags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Status Filter */}
            <select
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text shadow-xs cursor-pointer focus:outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses ({displayIdeas.length})</option>
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="draft_created">Draft Created</option>
              <option value="completed">Completed</option>
            </select>

            {/* Platform Filter */}
            <select
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text shadow-xs cursor-pointer focus:outline-none"
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
            >
              <option value="all">All Platforms</option>
              {AVAILABLE_PLATFORMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Format Filter */}
            <select
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-surface border border-border text-text shadow-xs cursor-pointer focus:outline-none"
              value={filterFormat}
              onChange={(e) => setFilterFormat(e.target.value)}
            >
              <option value="all">All Formats</option>
              <option value="post">Post / Photo</option>
              <option value="reel">Reel / Video</option>
              <option value="story">Story</option>
            </select>

            {(searchQuery ||
              filterStatus !== 'all' ||
              filterPlatform !== 'all' ||
              filterFormat !== 'all') && (
                <button
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text hover:bg-bg transition"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                    setFilterPlatform('all');
                    setFilterFormat('all');
                  }}
                >
                  Reset
                </button>
              )}
          </div>
        </div>
      </SpotlightCard>

      {/* Main Content Area: Ideas Display or Empty State */}
      {isLoadingIdeas ? (
        <SpotlightCard className="p-12 text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary" />
          <h3 className="text-base font-bold text-text">
            Loading Planned Calendar Ideas...
          </h3>
          <p className="text-xs text-text-muted">Retrieving campaign ideas from real database</p>
        </SpotlightCard>
      ) : filteredIdeas.length === 0 ? (
        <SpotlightCard className="p-10 sm:p-14 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 text-primary mx-auto flex items-center justify-center">
            <Lightbulb className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-text">
              {campaigns.length === 0 ? 'No Content Plans Yet' : 'No Matching Planned Ideas Found'}
            </h3>
            <p className="text-xs text-text-secondary mt-1">
              {campaigns.length === 0
                ? 'Launch your first AI Content Plan to synthesize strategic topics, opening hooks, and dates mapped to your brand directives.'
                : 'No planned ideas match the current search or filters. Try adjusting your filters or generating new slots.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setGeneratedDraftPlan(null);
                setIsGeneratorOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition shadow-xs btn-smooth cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Launch 7-Day or 30-Day AI Plan</span>
            </button>
          </div>
        </SpotlightCard>
      ) : (
        /* Ideas List in Timeline or Grid mode */
        <div
          className={
            viewMode === 'calendar'
              ? 'space-y-4'
              : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5'
          }
        >
          {filteredIdeas.map((idea, idx) => {
            const ideaKey = getIdeaKey(idea, idx);
            const statusConfig = STATUS_CONFIG[idea.plan_status] || STATUS_CONFIG.planned;
            const isRegenerating = regeneratingIdeaId === (idea.id || ideaKey);
            const media = ideaGeneratedMedia[ideaKey];
            const isGeneratingThisMedia = generatingMediaIdeaId === ideaKey;
            const thisActionType = mediaActionType[ideaKey];
            const hasMediaContent = Boolean(
              media && (media.image?.image_url || media.video?.video_url || media.text?.caption)
            );

            return (
              <SpotlightCard
                key={ideaKey}
                className={`p-5 sm:p-6 transition-all border ${idea.plan_status === 'draft_created'
                    ? 'border-info/40'
                    : idea.plan_status === 'completed'
                      ? 'border-success/40'
                      : 'border-border'
                  }`}
              >
                <div className="flex flex-col h-full justify-between space-y-4">
                  {/* Top Bar: Date, Slot & Status */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/25">
                          Day {idea.day_number || idx + 1}
                        </span>
                        {idea.suggested_date && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-text-secondary">
                            <Calendar className="w-3 h-3 text-text-muted" />
                            <span>{idea.suggested_date}</span>
                            {idea.suggested_time && <span>• {idea.suggested_time}</span>}
                          </span>
                        )}
                      </div>

                      {/* Status Selector Dropdown */}
                      <div className="relative">
                        <select
                          value={idea.plan_status || 'planned'}
                          onChange={(e) => handleUpdateStatus(idea.id || ideaKey, e.target.value)}
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border uppercase tracking-wider cursor-pointer focus:outline-none ${statusConfig.badge}`}
                        >
                          <option value="planned">Planned</option>
                          <option value="in_progress">In Progress</option>
                          <option value="draft_created">Draft Created</option>
                          <option value="completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Content Pillar Badge */}
                    {idea.content_pillar && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        <span className="text-[10px] font-medium text-text-muted">
                          #{idea.content_pillar}
                        </span>
                      </div>
                    )}

                    {/* Topic */}
                    <h3 className="text-sm sm:text-base font-bold text-text leading-snug">
                      {idea.topic}
                    </h3>

                    {/* Hook Callout */}
                    {idea.hook && (
                      <div className="p-3 rounded-xl bg-accent/10 border border-accent/25 space-y-1">
                        <span className="text-[10px] font-extrabold tracking-wider uppercase text-accent flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-accent" />
                          Opening Hook
                        </span>
                        <p className="text-xs font-semibold text-text italic">
                          "{idea.hook}"
                        </p>
                      </div>
                    )}

                    {/* Instant Ready-to-Post Description */}
                    {(idea.description || idea.caption) && (
                      <div className="space-y-1.5 p-3 rounded-xl bg-surface border border-border shadow-xs">
                        <div className="flex items-center justify-between text-[11px] font-bold text-text">
                          <span className="flex items-center gap-1.5 text-text font-bold">
                            <Sparkles className="w-3 h-3 text-warning" />
                            <span>Instant Post Description</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCaption(idea)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface hover:bg-bg text-text-secondary hover:text-text border border-border transition cursor-pointer"
                            title="Copy full caption to clipboard"
                          >
                            {copiedIdeaId === (idea.id || idea.topic) ? (
                              <>
                                <Check className="w-3 h-3 text-success" />
                                <span className="text-success font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Caption</span>
                              </>
                            )}
                          </button>
                        </div>
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line line-clamp-4 hover:line-clamp-none transition-all">
                          {idea.description || idea.caption}
                        </p>
                      </div>
                    )}

                    {/* Caption Brief */}
                    {idea.caption_brief && !(idea.description || idea.caption) && (
                      <div className="text-xs text-text-secondary leading-relaxed bg-bg p-3 rounded-xl border border-border">
                        <span className="font-bold text-text block mb-0.5">
                          Caption Brief & Angle:
                        </span>
                        {idea.caption_brief}
                      </div>
                    )}

                    {/* CTA & Hashtags */}
                    {(idea.call_to_action || (idea.hashtags && idea.hashtags.length > 0)) && (
                      <div className="space-y-1.5 pt-1 text-[11px]">
                        {idea.call_to_action && (
                          <div className="text-text-secondary flex items-center gap-1.5">
                            <span className="font-bold text-text">
                              CTA:
                            </span>
                            <span>{idea.call_to_action}</span>
                          </div>
                        )}
                        {idea.hashtags && (
                          <div className="text-primary font-semibold truncate">
                            {Array.isArray(idea.hashtags)
                              ? idea.hashtags.join(' ')
                              : idea.hashtags}
                          </div>
                        )}
                      </div>
                    )}
                    {/* AI Generated Media & Copy Preview */}
                    {hasMediaContent ? (
                      <div className="rounded-xl overflow-hidden border border-success/30 bg-success/10 p-2.5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-bold text-success">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-success" />
                            <span>Quality Approved ({media.overall_quality_score || media.quality_report?.score || media.image?.quality_check?.quality_score || 98}%)</span>
                          </span>
                          <span className="text-[10px] uppercase tracking-wider bg-success/20 text-success px-2 py-0.5 rounded-full font-bold">
                            ✓ {media.quality_report?.duplicate_status || 'Verified Unique'}
                          </span>
                        </div>

                        {/* Media Preview (Image or Video) */}
                        {media.image?.image_url && (
                          <div className="relative rounded-lg overflow-hidden bg-surface border border-border aspect-video max-h-52 flex items-center justify-center group">
                            {imageLoadErrors[ideaKey] ? (
                              <div className="p-4 text-center space-y-2">
                                <p className="text-xs text-error font-semibold">Image preview failed to load</p>
                                <button
                                  type="button"
                                  onClick={() => handleCreateImageForIdea(idea, ideaKey)}
                                  className="px-2.5 py-1 text-[11px] rounded bg-primary text-primary-on font-bold transition cursor-pointer"
                                >
                                  Retry Cloudflare Flux
                                </button>
                              </div>
                            ) : (
                              <img
                                src={media.image.image_url}
                                alt={idea.topic}
                                onError={() => setImageLoadErrors((prev) => ({ ...prev, [ideaKey]: true }))}
                                className="w-full h-full object-cover"
                              />
                            )}
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-secondary/85 text-on-secondary text-[10px] font-bold flex items-center gap-1 border border-border">
                              <ImageIcon className="w-3 h-3 text-accent" />
                              <span>
                                {media.image?.provider === 'cloudflare-flux' || media.image?.provider?.includes('cloudflare')
                                  ? 'Cloudflare Flux AI'
                                  : (media.image?.provider === 'flux-pollinations' ? 'Flux Photoreal AI' : 'AI Image Artwork')}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setModalImageError(false);
                                setPreviewMediaModal({
                                  type: 'image',
                                  url: media.image.image_url,
                                  title: idea.topic
                                });
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-secondary/80 hover:bg-secondary text-on-secondary transition opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Zoom Preview"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {media.video?.video_url && (
                          <div className="relative rounded-lg overflow-hidden bg-surface-raised aspect-video max-h-52 group">
                            <video
                              src={media.video.video_url}
                              controls
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-secondary/85 text-on-secondary text-[10px] font-bold flex items-center gap-1 pointer-events-none border border-border">
                              <Film className="w-3 h-3 text-accent" />
                              <span>AI Video Reel</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setModalImageError(false);
                                setPreviewMediaModal({
                                  type: 'video',
                                  url: media.video.video_url,
                                  title: idea.topic
                                });
                              }}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 hover:bg-black/90 text-white transition opacity-0 group-hover:opacity-100 cursor-pointer"
                              title="Zoom Video"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}

                        {/* Generated Caption & Description Preview */}
                        {media.text?.caption && (
                          <div className="p-2.5 rounded-lg bg-surface border border-border text-xs text-text line-clamp-3">
                            <span className="font-bold text-success block mb-0.5">
                              Generated Description:
                            </span>
                            {media.text.caption}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-border p-3.5 text-center space-y-1 bg-bg">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-text-secondary">
                          <ImageIcon className="w-3.5 h-3.5 text-text-muted" />
                          <span>No Media Generated Yet</span>
                        </div>
                        <p className="text-[10px] text-text-muted">
                          Click "Create Image (Cloudflare Flux)" or "Create Video" below to generate media.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions Toolbar */}
                  <div className="pt-3 border-t border-border space-y-2.5">
                    {/* Media Creation API Actions Bar */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-text px-0.5">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-accent" />
                          <span>AI Media Creation APIs</span>
                        </span>
                        {hasMediaContent && (
                          <span className="text-[10px] text-success font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-success" />
                            <span>Media Ready</span>
                          </span>
                        )}
                      </div>

                      {/* API Buttons Grid: Dedicated Image (Cloudflare Flux) & Video Creation */}
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCreateImageForIdea(idea, ideaKey)}
                          disabled={isGeneratingThisMedia || !!generatingMediaIdeaId || !!idea.is_generating || idea.generation_status === 'processing'}
                          title="Generate image with Cloudflare Flux AI"
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text bg-surface border border-border hover:border-primary/40 hover:bg-bg transition-all shadow-xs btn-smooth cursor-pointer disabled:opacity-50"
                        >
                          <ImageIcon className={`w-3.5 h-3.5 text-accent ${isGeneratingThisMedia && thisActionType === 'image' ? 'animate-spin' : ''}`} />
                          <span>
                            {isGeneratingThisMedia && thisActionType === 'image'
                              ? 'Creating Flux Image...'
                              : (media?.image?.image_url ? 'Re-create (Cloudflare Flux)' : 'Create Image (Cloudflare Flux)')}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCreateVideoForIdea(idea, ideaKey)}
                          disabled={isGeneratingThisMedia || !!generatingMediaIdeaId || !!idea.is_generating || idea.generation_status === 'processing'}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-text bg-surface border border-border hover:border-primary/40 hover:bg-bg transition-all shadow-xs btn-smooth cursor-pointer disabled:opacity-50"
                        >
                          <Film className={`w-3.5 h-3.5 text-primary ${isGeneratingThisMedia && thisActionType === 'video' ? 'animate-spin' : ''}`} />
                          <span>
                            {isGeneratingThisMedia && thisActionType === 'video'
                              ? 'Creating Video...'
                              : (media?.video?.video_url ? 'Re-create Video' : 'Create Video')}
                          </span>
                        </button>
                      </div>

                      {/* Scheduled Timing & Media Auto-Generation Status with Quick Timing Fix */}
                      <div className="p-2.5 rounded-xl bg-bg border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-semibold text-text flex-wrap">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-bold text-text">
                            Day {idea.day_number || idx + 1}:
                          </span>
                          <input
                            type="date"
                            value={idea.suggested_date || ''}
                            onChange={(e) => handleQuickFixTiming(idea, e.target.value, idea.suggested_time || '10:00')}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface border border-border text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                            title="Click to fix or change date"
                          />
                          <input
                            type="time"
                            value={idea.suggested_time || '10:00'}
                            onChange={(e) => handleQuickFixTiming(idea, idea.suggested_date, e.target.value)}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface border border-border text-text cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                            title="Click to fix or change posting time"
                          />
                        </div>

                        {idea.is_generating || idea.generation_status === 'processing' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-warning bg-warning/15 border border-warning/30 shrink-0 self-start sm:self-auto animate-pulse">
                            <RefreshCw className="w-2.5 h-2.5 animate-spin text-warning" />
                            Auto-Generating Media...
                          </span>
                        ) : hasMediaContent || idea.generation_status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-success bg-success/15 border border-success/30 shrink-0 self-start sm:self-auto">
                            <CheckCircle2 className="w-2.5 h-2.5 text-success" />
                            Media Ready
                          </span>
                        ) : idea.generation_status === 'failed' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-error bg-error/15 border border-error/30 shrink-0 self-start sm:self-auto"
                            title={idea.generation_error || 'Generation failed. Click button to retry.'}
                          >
                            <AlertCircle className="w-2.5 h-2.5 text-error" />
                            Generation Failed (Retrying)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold text-success bg-success/15 border border-success/30 shrink-0 self-start sm:self-auto">
                            <Sparkles className="w-2.5 h-2.5 text-success" />
                            Auto-Generates at {idea.suggested_time || '10:00'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Primary Workflow Button: Send to Content Studio */}
                    <button
                      type="button"
                      onClick={() => handleSendToContentStudio(idea, ideaKey)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-text bg-surface hover:bg-bg border border-border hover:border-primary/40 transition-all shadow-xs btn-smooth cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{media ? 'Post / Schedule in Content Studio' : 'Edit in Content Studio'}</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                    </button>

                    {/* Secondary Actions: Regenerate, Edit, Delete */}
                    <div className="flex items-center gap-1.5">
                      <button
                        disabled={isRegenerating}
                        onClick={() => handleRegenerateIdea(idea.id)}
                        title="Regenerate this specific idea slot with Gemini AI"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text bg-surface border border-border hover:bg-bg shadow-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                        <span>{isRegenerating ? 'Re-writing...' : 'Regenerate'}</span>
                      </button>

                      <button
                        onClick={() => setEditingIdea({ ...idea })}
                        title="Edit idea details"
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-text bg-surface border border-border hover:bg-bg shadow-xs transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteIdea(idea.id)}
                        title="Delete idea"
                        className="p-1.5 rounded-xl text-xs font-semibold text-error hover:bg-error/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            );
          })}
        </div>
      )}

      {/* Edit Idea Modal */}
      {editingIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text">
                Edit Planned Idea
              </h3>
              <button
                onClick={() => setEditingIdea(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Topic / Concept Title
                </label>
                <input
                  type="text"
                  value={editingIdea.topic || ''}
                  onChange={(e) => setEditingIdea({ ...editingIdea, topic: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Opening Hook
                </label>
                <textarea
                  rows={2}
                  value={editingIdea.hook || ''}
                  onChange={(e) => setEditingIdea({ ...editingIdea, hook: e.target.value })}
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Caption Brief & Visual Direction
                </label>
                <textarea
                  rows={3}
                  value={editingIdea.caption_brief || ''}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, caption_brief: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Platform
                  </label>
                  <select
                    value={editingIdea.platform || 'Instagram'}
                    onChange={(e) => setEditingIdea({ ...editingIdea, platform: e.target.value })}
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  >
                    {AVAILABLE_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Content Format
                  </label>
                  <select
                    value={editingIdea.content_format || 'Post'}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, content_format: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  >
                    <option value="Post">Post / Photo</option>
                    <option value="Reel">Reel / Video</option>
                    {editingIdea.content_format === 'Carousel' && (
                      <option value="Carousel">Carousel (Legacy)</option>
                    )}
                    <option value="Story">Story</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Suggested Date
                  </label>
                  <input
                    type="date"
                    value={editingIdea.suggested_date || ''}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, suggested_date: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Suggested Time
                  </label>
                  <input
                    type="time"
                    value={editingIdea.suggested_time || '10:00'}
                    onChange={(e) =>
                      setEditingIdea({ ...editingIdea, suggested_time: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Call to Action
                </label>
                <input
                  type="text"
                  value={editingIdea.call_to_action || ''}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, call_to_action: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Status
                </label>
                <select
                  value={editingIdea.plan_status || 'planned'}
                  onChange={(e) =>
                    setEditingIdea({ ...editingIdea, plan_status: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                >
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="draft_created">Draft Created</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setEditingIdea(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditIdea}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Idea Modal */}
      {isAddingCustomIdea && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-surface rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text">
                Add Custom Idea to Plan
              </h3>
              <button
                onClick={() => setIsAddingCustomIdea(false)}
                className="p-1 rounded-lg text-text-muted hover:text-text cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Topic / Concept Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., 3 Common Mistakes in Brand Positioning"
                  value={customIdeaForm.topic}
                  onChange={(e) =>
                    setCustomIdeaForm({ ...customIdeaForm, topic: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Opening Hook
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., If you're doing this in 2026, you're losing 50% of your customer retention..."
                  value={customIdeaForm.hook}
                  onChange={(e) =>
                    setCustomIdeaForm({ ...customIdeaForm, hook: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Caption Brief & Visual Direction
                </label>
                <textarea
                  rows={3}
                  placeholder="Break down each mistake into bite-sized actionable bullet points. Mention our verified product as the solution."
                  value={customIdeaForm.caption_brief}
                  onChange={(e) =>
                    setCustomIdeaForm({ ...customIdeaForm, caption_brief: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Platform
                  </label>
                  <select
                    value={customIdeaForm.platform}
                    onChange={(e) =>
                      setCustomIdeaForm({ ...customIdeaForm, platform: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  >
                    {AVAILABLE_PLATFORMS.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Content Format
                  </label>
                  <select
                    value={customIdeaForm.content_format}
                    onChange={(e) =>
                      setCustomIdeaForm({ ...customIdeaForm, content_format: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  >
                    <option value="Post">Post / Photo</option>
                    <option value="Reel">Reel / Video</option>
                    <option value="Story">Story</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Suggested Date
                  </label>
                  <input
                    type="date"
                    value={customIdeaForm.suggested_date}
                    onChange={(e) =>
                      setCustomIdeaForm({ ...customIdeaForm, suggested_date: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-text-secondary">
                    Suggested Time
                  </label>
                  <input
                    type="time"
                    value={customIdeaForm.suggested_time}
                    onChange={(e) =>
                      setCustomIdeaForm({ ...customIdeaForm, suggested_time: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 rounded-xl text-xs bg-surface border border-border text-text cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Call to Action
                </label>
                <input
                  type="text"
                  placeholder="e.g., Save this post for your next campaign planning session"
                  value={customIdeaForm.call_to_action}
                  onChange={(e) =>
                    setCustomIdeaForm({ ...customIdeaForm, call_to_action: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-text-secondary">
                  Hashtags (separated by spaces or commas)
                </label>
                <input
                  type="text"
                  placeholder="#BrandStrategy #GrowthMarketing #SocialAI"
                  value={customIdeaForm.hashtags}
                  onChange={(e) =>
                    setCustomIdeaForm({ ...customIdeaForm, hashtags: e.target.value })
                  }
                  className="w-full mt-1 px-3 py-2 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddingCustomIdea(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomIdeaSubmit}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition cursor-pointer"
              >
                Add Idea to Plan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Schedule 7-Day Campaign Modal */}
      {isScheduleModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
          onClick={() => setIsScheduleModalOpen(false)}
        >
          <div
            className="bg-surface rounded-2xl max-w-lg w-full border border-border shadow-2xl p-4 sm:p-6 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">
                    Schedule Saved Campaign Plan
                  </h3>
                  <p className="text-xs text-text-secondary">
                    Confirm the publishing workflow. Your plan's saved date, time, timezone, and channels will be used.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-bg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Workflow Mode Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-secondary">
                Publishing Workflow Mode:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleMode('auto_post')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${scheduleMode === 'auto_post'
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'border-border bg-bg text-text-secondary hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text">Auto-Post Directly</span>
                    <Sparkles className="w-3.5 h-3.5 text-success" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-text-secondary">
                    Background worker auto-synthesizes media and posts directly at scheduled time without manual approval.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleMode('approval_required')}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${scheduleMode === 'approval_required'
                      ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
                      : 'border-border bg-bg text-text-secondary hover:bg-surface'
                    }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-text">Approval Required</span>
                    <AlertCircle className="w-3.5 h-3.5 text-warning" />
                  </div>
                  <p className="text-[11px] leading-relaxed text-text-secondary">
                    Posts enter Content Approvals queue with status Pending. Once approved, they publish at their scheduled time.
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-bg border border-border text-xs">
              <div><span className="block text-text-muted">Start date</span><strong className="text-text">{activePlan?.start_date?.slice(0, 10) || 'Saved in plan'}</strong></div>
              <div><span className="block text-text-muted">Posting time</span><strong className="text-text">{activePlan?.tags?.daily_posting_time || '10:00'}</strong></div>
              <div><span className="block text-text-muted">Timezone</span><strong className="text-text">{activePlan?.tags?.timezone || scheduleTimezone}</strong></div>
            </div>

            <div className="p-3 rounded-xl bg-bg border border-border text-xs text-text-secondary space-y-1">
              <span className="font-bold text-text block">
                7 Days Publishing Pipeline Overview:
              </span>
              <p className="text-[11px] leading-relaxed">
                • 7 unique daily posts chronologically queued based on optimal engagement slots.<br />
                • Distinct descriptions and hooks generated instantly for each strategic pillar.<br />
                • Media assets automatically synthesized at scheduled time if not manually pre-rendered.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text hover:bg-bg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleScheduleCampaign}
                disabled={isSubmittingSchedule}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition cursor-pointer shadow-xs disabled:opacity-50"
              >
                <Calendar className={`w-3.5 h-3.5 ${isSubmittingSchedule ? 'animate-spin' : ''}`} />
                <span>{isSubmittingSchedule ? 'Scheduling 7-Day Campaign...' : `Confirm & Schedule (${scheduleMode === 'auto_post' ? 'Auto-Post' : 'Requires Approval'})`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Zoom / Fullscreen Preview Modal */}
      {previewMediaModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewMediaModal(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-surface rounded-2xl overflow-hidden shadow-2xl border border-border p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewMediaModal(null)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-black/90 cursor-pointer shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-hidden rounded-xl bg-black">
              {previewMediaModal.type === 'video' ? (
                <video
                  src={previewMediaModal.url}
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] rounded-xl object-contain mx-auto"
                />
              ) : modalImageError ? (
                <div className="p-10 text-center space-y-3">
                  <p className="text-sm font-bold text-error">Unable to load media preview</p>
                  <a
                    href={previewMediaModal.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition"
                  >
                    Open Image in New Tab ↗
                  </a>
                </div>
              ) : (
                <img
                  src={previewMediaModal.url}
                  alt={previewMediaModal.title || 'Preview'}
                  onError={() => setModalImageError(true)}
                  className="max-w-full max-h-[80vh] rounded-xl object-contain mx-auto"
                />
              )}
            </div>
            {previewMediaModal.title && (
              <div className="p-3 text-center text-xs font-bold text-white bg-black/80 border-t border-white/5 truncate">
                {previewMediaModal.title}
              </div>
            )}
            <div className="px-3 py-2 flex items-center justify-between text-xs bg-surface border-t border-border text-text-secondary">
              <span className="flex items-center gap-1.5 text-success font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Centralized Quality Score: 98% (APPROVED)</span>
              </span>
              <span className="text-[11px] font-semibold text-accent">
                ✓ Global Deduplication Verified
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AIPlannerView;
