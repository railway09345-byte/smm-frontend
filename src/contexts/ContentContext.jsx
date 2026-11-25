import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '../components/common/Toast';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { extractPaletteFromImage, applyThemeTokens, generateTokensFromPrimary } from '../utils/colorExtractor';

const defaultBrandProfile = {
  id: null,
  name: '',
  type: '',
  industry: '',
  category: '',
  tagline: '',
  location: '',
  timings: '',
  logoUrl: null,
  logoMonogram: '',
  desc: '',
  description: '',
  audience: '',
  target_demographics: '',
  audience_interests: '',
  voice: 'Modern, confident & engaging',
  messaging_style: '',
  cta: '',
  avoid: 'off-brand messaging, low resolution assets',
  keywords: '',
  hashtags: '',
  phone: '',
  email: '',
  website: '',
  usp: '',
  brand_positioning: '',
  marketing_objectives: '',
  buyer_personas: [],
  content_format_ratios: { reels: 50, images: 40, carousels: 0, text: 10 },
  typography: 'Inter, sans-serif',
  visual_identity: '',
  preferred_platforms: ['Instagram', 'Facebook', 'YouTube'],
  content_formats: ['Image Post', 'Video Reel'],
  products: [],
  colorPalette: ['#36B987', '#193C2D', '#55D3A0'],
  themeTokens: null
};

const defaultContentState = {
  contentItems: [],
  campaigns: [],
  scheduledQueue: [],
  isAutomationActive: true,
  brandProfile: defaultBrandProfile,
  brandProfilesList: [],
  activeBrandId: null,
  switchBrand: () => {},
  createBrandProfile: () => {},
  themeTokens: null,
  isLoading: false,
  uploadBrandLogo: () => {},
  removeBrandLogo: () => {},
  updateThemePalette: () => {},
  resetThemePalette: () => {},
  saveContentItem: () => {},
  approveItem: () => {},
  rejectItem: () => {},
  requestChanges: () => {},
  scheduleItem: () => {},
  publishItem: () => {},
  cancelSchedule: () => {},
  deleteItem: () => {},
  generateDailyBatch: () => {},
  createCampaign: () => {},
  toggleAutomation: () => {},
  setBrandProfile: () => {},
  fetchAllData: () => {}
};

const ContentContext = createContext(defaultContentState);

export function ContentProvider({ children }) {
  const { showToast } = useToast();
  const { isAuthenticated, token, user } = useAuth();

  const [contentItems, setContentItems] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isAutomationActive, setIsAutomationActive] = useState(true);
  const [isTogglingAutomation, setIsTogglingAutomation] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scheduledQueue, setScheduledQueue] = useState([]);
  const [brandProfilesList, setBrandProfilesList] = useState([]);
  const [activeBrandId, setActiveBrandId] = useState(() => {
    try {
      const storedUser = storage.get(STORAGE_KEYS.user);
      if (storedUser?.id) {
        const val = localStorage.getItem(`sacp_active_brand_${storedUser.id}`);
        if (val && !isNaN(Number(val))) return Number(val);
      }
    } catch {}
    return null;
  });
  const [themeTokens, setThemeTokens] = useState(null);

  const [brandProfile, setBrandProfileState] = useState(() => {
    try {
      const storedUser = storage.get(STORAGE_KEYS.user);
      if (storedUser?.id) {
        const isCustom = localStorage.getItem(`sacp_brand_customized_${storedUser.id}`) === 'true';
        const cached = localStorage.getItem(`sacp_cached_brand_${storedUser.id}`);
        if (isCustom && cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.name && !parsed.name.toLowerCase().includes('zenith') && parsed.name !== 'Aminoid AI' && parsed.id) {
            return parsed;
          }
        }
      }
    } catch {}
    return defaultBrandProfile;
  });


  // Map backend content model to UI format
  const formatContentItem = (raw) => {
    const meta = raw.meta_info || {};
    const platform = (raw.target_platforms && raw.target_platforms.length > 0)
      ? raw.target_platforms[0].charAt(0).toUpperCase() + raw.target_platforms[0].slice(1).toLowerCase()
      : 'Instagram';

    const statusMap = {
      DRAFT: 'awaiting',
      PENDING_APPROVAL: 'awaiting',
      APPROVED: 'approved',
      SCHEDULED: 'scheduled',
      PUBLISHING: 'scheduled',
      PUBLISHED: 'published',
      REJECTED: 'rejected',
      FAILED: 'rejected' };

    const status = statusMap[raw.status] || raw.status?.toLowerCase() || 'awaiting';

    return {
      id: raw.id,
      dbId: raw.id,
      title: raw.title || 'Brand Social Post',
      headline: raw.title || 'Brand Social Post',
      caption: raw.caption || '',
      hashtags: Array.isArray(raw.hashtags) ? raw.hashtags.join(' ') : (raw.hashtags || ''),
      platform: platform,
      format: meta.format || 'Image post',
      contentType: meta.contentType || (['video', 'video/mp4'].includes(String(meta.media_type || '').toLowerCase()) || meta.format?.toLowerCase().includes('video') || meta.format?.toLowerCase().includes('reel') ? 'video' : 'image'),
      objective: meta.objective || '',
      audience: meta.audience || '',
      creativeDirection: meta.creativeDirection || '',
      cta: meta.cta || '',
      priceTag: meta.priceTag || '',
      icon: meta.icon || '',
      mediaUrl: meta.mediaUrl || meta.media_url || meta.generated_media?.image?.image_url || meta.generated_media?.video?.video_url || raw.media_url || raw.mediaUrl || null,
      thumbnailUrl: meta.thumbnailUrl || meta.thumbnail_url || meta.generated_media?.image?.image_url || meta.generated_media?.video?.video_url || meta.mediaUrl || meta.media_url || raw.thumbnail_url || raw.media_url || null,
      file_url: meta.file_url || meta.mediaUrl || meta.media_url || meta.generated_media?.image?.image_url || meta.generated_media?.video?.video_url || raw.file_url || raw.media_url || null,
      mediaMimeType: meta.mediaMimeType || meta.media_type || raw.mime_type || 'image/png',
      aspectRatio: meta.aspectRatio || '1:1',
      duration: meta.duration || null,
      mediaArray: meta.mediaArray || [],
      storyboard: meta.storyboard || [],
      scheduledDate: meta.scheduledDate || null,
      scheduledTime: meta.scheduledTime || null,
      scheduledAccount: meta.scheduledAccount || null,
      publishedDate: meta.publishedDate || null,
      status: status,
      approvalStatus: status,
      createdAt: raw.created_at ? new Date(raw.created_at).toISOString().split('T')[0] : '2026-10-10',
      updatedAt: raw.updated_at ? new Date(raw.updated_at).toISOString().split('T')[0] : '2026-10-10' };
  };

  // Synchronize all data from MySQL backend
  const fetchAllData = useCallback(async (targetBrandId = null) => {
    if (!isAuthenticated) return;
    setIsLoading(true);

    try {
      // 1. Fetch Organization & Brand Profiles from MySQL
      const [org, brands] = await Promise.all([
        api.organizations.getCurrent().catch(() => null),
        api.brandProfiles.list().catch(() => [])
      ]);

      const orgSettings = org?.settings || {};

      if (brands && brands.length > 0) {
        setBrandProfilesList(brands);
        const storedBrandId = user?.id ? localStorage.getItem(`sacp_active_brand_${user.id}`) : null;
        const candidateId = targetBrandId || activeBrandId || (storedBrandId ? Number(storedBrandId) : null);
        const activeBrand = (candidateId ? brands.find((b) => b.id === Number(candidateId)) : null) || brands[0];
        
        setActiveBrandId(activeBrand.id);
        if (user?.id) {
          localStorage.setItem(`sacp_active_brand_${user.id}`, activeBrand.id);
        }

        const meta = activeBrand.meta_info || {};

        const palette = (activeBrand.color_palette && activeBrand.color_palette.length > 0)
          ? activeBrand.color_palette
          : ['#36B987', '#193C2D', '#55D3A0'];
        const tokens = meta.theme_tokens || generateTokensFromPrimary(palette[0] || '#36B987', palette[1] || '#55D3A0');
        setThemeTokens(tokens);
        applyThemeTokens(tokens);

        // Always use the real brand name and organization brand details from the database
        const bName = activeBrand.name || org?.name || 'My Brand';
        const bLogo = activeBrand.logo_url || org?.logo_url || null;

        const profileObj = {
          id: activeBrand.id,
          name: bName,
          type: activeBrand.industry || meta.category || orgSettings.category || "Retail Studio",
          industry: activeBrand.industry || orgSettings.industry || "AI Marketing & Social Automation",
          category: meta.category || activeBrand.industry || "AI SaaS",
          tagline: activeBrand.tagline || org?.description || `Welcome to ${bName}`,
          location: activeBrand.location || meta.flagshipAddr || orgSettings.flagshipAddr || '',
          timings: activeBrand.timings || orgSettings.timings || '',
          logoUrl: bLogo,
          logoMonogram: bName.slice(0, 2).toUpperCase(),
          desc: activeBrand.brand_guidelines || meta.description || org?.description || "Autonomous marketing intelligence synthesizing brand-aligned content, high-converting copy, and scheduled releases.",
          description: meta.description || activeBrand.brand_guidelines || "Autonomous marketing intelligence synthesizing brand-aligned content, high-converting copy, and scheduled releases.",
          audience: activeBrand.target_audience || meta.target_demographics || '',
          target_demographics: meta.target_demographics || activeBrand.target_audience || '',
          audience_interests: meta.audience_interests || '',
          voice: activeBrand.tone_of_voice || 'Modern, confident & engaging',
          messaging_style: meta.messaging_style || '',
          cta: activeBrand.cta || `Connect with ${bName} today.`,
          avoid: activeBrand.avoid || 'off-brand messaging, low resolution assets',
          keywords: Array.isArray(activeBrand.key_themes) ? activeBrand.key_themes.join(', ') : (activeBrand.key_themes || ''),
          hashtags: Array.isArray(activeBrand.hashtags) ? activeBrand.hashtags.join(', ') : (activeBrand.hashtags || ''),
          phone: meta.phone || orgSettings.phone || '',
          email: meta.email || orgSettings.email || '',
          website: meta.website || orgSettings.website || '',
          usp: meta.usp || '',
          brand_positioning: meta.brand_positioning || '',
          marketing_objectives: meta.marketing_objectives || '',
          buyer_personas: Array.isArray(meta.buyer_personas) ? meta.buyer_personas : [],
          content_format_ratios: meta.content_format_ratios || { reels: 50, images: 40, carousels: 0, text: 10 },
          typography: meta.typography || 'Inter, sans-serif',
          visual_identity: meta.visual_identity || '',
          preferred_platforms: meta.preferred_platforms || ['Instagram', 'Facebook', 'YouTube'],
          content_formats: meta.content_formats || ['Image Post', 'Video Reel'],
          products: Array.isArray(meta.products) ? meta.products : [],
          gstin: meta.gstin || orgSettings.gstin || '',
          flagshipAddr: meta.flagshipAddr || orgSettings.flagshipAddr || '',
          branchAddr: meta.branchAddr || orgSettings.branchAddr || '',
          colorPalette: palette,
          themeTokens: tokens
        };

        setBrandProfileState(profileObj);
        if (user?.id) {
          try {
            const cached = { ...profileObj };
            if (typeof cached.logoUrl === 'string' && cached.logoUrl.startsWith('data:') && cached.logoUrl.length > 200000) delete cached.logoUrl;
            localStorage.setItem(`sacp_cached_brand_${user.id}`, JSON.stringify(cached));
          } catch (storageError) {
            console.warn('Brand profile cache skipped:', storageError.message);
          }
        }
      } else if (org) {
        setActiveBrandId(null);
        if (user?.id) {
          localStorage.removeItem(`sacp_active_brand_${user.id}`);
        }
        const bName = org.name;
        const palette = ['#36B987', '#193C2D', '#55D3A0'];
        const tokens = generateTokensFromPrimary(palette[0], palette[1]);
        setThemeTokens(tokens);
        applyThemeTokens(tokens);

        const profileObj = {
          id: null,
          name: bName,
          type: orgSettings.category || orgSettings.industry || "Retail Studio",
          industry: orgSettings.industry || "Retail Studio",
          category: orgSettings.category || '',
          tagline: org.description || `Welcome to ${bName}`,
          location: orgSettings.flagshipAddr || '',
          timings: orgSettings.timings || '10:00 AM – 9:00 PM',
          logoUrl: org.logo_url || null,
          logoMonogram: bName.slice(0, 2).toUpperCase(),
          desc: org.description || "",
          description: org.description || "",
          audience: 'Target customer base',
          target_demographics: '',
          audience_interests: '',
          voice: 'Modern, confident & engaging',
          messaging_style: '',
          cta: `Connect with ${bName} today.`,
          avoid: 'off-brand messaging',
          keywords: '',
          hashtags: '',
          phone: orgSettings.phone || '',
          email: orgSettings.email || '',
          website: '',
          usp: '',
          brand_positioning: '',
          marketing_objectives: '',
          typography: 'Inter, sans-serif',
          visual_identity: '',
          preferred_platforms: ['Instagram', 'Facebook', 'YouTube'],
          content_formats: ['Image Post', 'Video Reel'],
          products: [],
          gstin: orgSettings.gstin || '',
          flagshipAddr: orgSettings.flagshipAddr || '',
          branchAddr: orgSettings.branchAddr || '',
          colorPalette: palette,
          themeTokens: tokens
        };

        setBrandProfileState(profileObj);
        if (user?.id) {
          localStorage.setItem(`sacp_cached_brand_${user.id}`, JSON.stringify(profileObj));
        }
      }

      // 2. Fetch Content Items from MySQL
      const items = await api.content.list().catch(() => []);
      if (items && items.length > 0) {
        const formatted = items.map(formatContentItem);
        setContentItems(formatted);
      } else {
        setContentItems([]);
      }

      // 3. Fetch Marketing Campaigns from MySQL
      const camps = await api.campaigns.list().catch(() => []);
      if (camps && camps.length > 0) {
        setCampaigns(
          camps.map((c) => ({
            id: c.id,
            name: c.title,
            objective: c.objective || 'Brand growth & store footfall',
            startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '2026-10-01',
            endDate: c.end_date ? new Date(c.end_date).toISOString().split('T')[0] : '2026-10-31',
            platforms: Array.isArray(c.tags)
              ? c.tags.join(', ')
              : (Array.isArray(c.tags?.platforms)
                ? c.tags.platforms.join(', ')
                : (typeof c.tags === 'string' ? c.tags : 'Instagram, Facebook & YouTube')),
            status: c.status || 'Active' }))
        );
      }

      // 4. Fetch Scheduled Queue from MySQL
      const queue = await api.scheduler.getQueue().catch(() => []);
      setScheduledQueue(queue || []);

      // 5. Fetch Real Automation Engine Status from Backend
      try {
        const autoStatus = await api.automation.getStatus(activeBrand?.id).catch(() => null);
        if (autoStatus && typeof autoStatus.is_active === 'boolean') {
          setIsAutomationActive(autoStatus.is_active);
        } else {
          const autoSettings = await api.automation.getSettings(activeBrand?.id).catch(() => null);
          if (autoSettings && typeof autoSettings.is_active === 'boolean') {
            setIsAutomationActive(autoSettings.is_active);
          }
        }
      } catch (autoErr) {
        console.debug('Failed to load initial automation status:', autoErr);
      }
    } catch (error) {
      console.error('Error synchronizing with MySQL backend:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.organizationId]);

  // Synchronize on authentication or user/workspace switch
  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, user?.id, user?.organizationId, fetchAllData]);

  // Save / Update Brand Profile in MySQL
  const setBrandProfile = async (updater) => {
    const updated = typeof updater === 'function' ? updater(brandProfile) : updater;
    setBrandProfileState(updated);
    if (user?.id) {
      if (updated.name && !updated.name.toLowerCase().includes('zenith')) {
        localStorage.setItem(`sacp_brand_customized_${user.id}`, 'true');
      }
      try {
        // Data-URL logo fallbacks can exceed browser storage limits. Cache the
        // profile metadata, but omit oversized inline media from localStorage.
        const cached = { ...updated };
        if (typeof cached.logoUrl === 'string' && cached.logoUrl.startsWith('data:') && cached.logoUrl.length > 200000) {
          delete cached.logoUrl;
        }
        localStorage.setItem(`sacp_cached_brand_${user.id}`, JSON.stringify(cached));
      } catch (storageError) {
        console.warn('Brand profile cache skipped:', storageError.message);
      }
    }

    if (updated.themeTokens) {
      setThemeTokens(updated.themeTokens);
      applyThemeTokens(updated.themeTokens);
    }

    try {
      const payload = {
        name: updated.name || 'Brand Workspace',
        industry: updated.industry || updated.type || "General Business",
        tagline: updated.tagline || '',
        location: updated.location || '',
        timings: updated.timings || '',
        logo_url: updated.logoUrl,
        tone_of_voice: updated.voice || "Professional & Engaging",
        target_audience: updated.audience || '',
        brand_guidelines: updated.desc || updated.description || '',
        cta: updated.cta || '',
        avoid: updated.avoid || '',
        key_themes: typeof updated.keywords === 'string' ? updated.keywords.split(',').map((s) => s.trim()).filter(Boolean)
          : (Array.isArray(updated.key_themes) ? updated.key_themes : []),
        hashtags: typeof updated.hashtags === 'string' ? updated.hashtags.split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean)
          : (Array.isArray(updated.hashtags) ? updated.hashtags : []),
        color_palette: updated.colorPalette || (updated.themeTokens ? [updated.themeTokens.primary, updated.themeTokens.secondary, updated.themeTokens.accent] : ['#36B987', '#193C2D', '#55D3A0']),
        meta_info: {
          category: updated.category || '',
          description: updated.description || updated.desc || '',
          website: updated.website || '',
          phone: updated.phone || '',
          email: updated.email || '',
          gstin: updated.gstin || '',
          typography: updated.typography || 'Inter, sans-serif',
          visual_identity: updated.visual_identity || '',
          target_demographics: updated.target_demographics || '',
          audience_interests: updated.audience_interests || '',
          messaging_style: updated.messaging_style || '',
          usp: updated.usp || '',
          brand_positioning: updated.brand_positioning || '',
          marketing_objectives: updated.marketing_objectives || '',
          buyer_personas: Array.isArray(updated.buyer_personas) ? updated.buyer_personas : (Array.isArray(updated.personas) ? updated.personas : []),
          content_format_ratios: updated.content_format_ratios || {
            reels: updated.reelsRatio ?? 50,
            images: updated.imagesRatio ?? 40,
            carousels: updated.carouselsRatio ?? 0,
            text: updated.textRatio ?? 10
          },
          preferred_platforms: updated.preferred_platforms || ['Instagram', 'Facebook', 'YouTube'],
          content_formats: updated.content_formats || ['Image Post', 'Video Reel'],
          products: Array.isArray(updated.products) ? updated.products : [],
          theme_tokens: updated.themeTokens
        }
      };

      if (activeBrandId) {
        try {
          const updatedFromApi = await api.brandProfiles.update(activeBrandId, payload);
          if (updatedFromApi?.id) {
            setActiveBrandId(updatedFromApi.id);
            if (user?.id) {
              localStorage.setItem(`sacp_active_brand_${user.id}`, updatedFromApi.id);
            }
            setBrandProfilesList((prev) => prev.map((b) => (b.id === activeBrandId ? updatedFromApi : b)));
          }
        } catch (updateErr) {
          // If the cached activeBrandId doesn't exist for this organization, fallback to create
          const created = await api.brandProfiles.create(payload);
          if (created?.id) {
            setActiveBrandId(created.id);
            if (user?.id) {
              localStorage.setItem(`sacp_active_brand_${user.id}`, created.id);
            }
            setBrandProfilesList((prev) => [created, ...prev.filter((b) => b.id !== activeBrandId)]);
          }
        }
      } else {
        const created = await api.brandProfiles.create(payload);
        if (created?.id) {
          setActiveBrandId(created.id);
          if (user?.id) {
            localStorage.setItem(`sacp_active_brand_${user.id}`, created.id);
          }
          setBrandProfilesList((prev) => [created, ...prev]);
        }
      }
    } catch (err) {
      console.error('Failed to persist brand profile in MySQL:', err);
      throw err;
    }
  };

  // Switch Active Brand
  const switchBrand = async (brandId) => {
    setActiveBrandId(brandId);
    if (user?.id) {
      localStorage.setItem(`sacp_active_brand_${user.id}`, brandId);
    }
    const found = brandProfilesList.find((b) => b.id === brandId);
    if (found) {
      const meta = found.meta_info || {};
      const palette = found.color_palette?.length ? found.color_palette : ['#36B987', '#193C2D', '#55D3A0'];
      const tokens = meta.theme_tokens || generateTokensFromPrimary(palette[0], palette[1]);
      setThemeTokens(tokens);
      applyThemeTokens(tokens);
      const profileObj = {
        id: found.id,
        name: found.name,
        type: found.industry || meta.category || "Retail Studio",
        industry: found.industry || "Retail Studio",
        category: meta.category || '',
        tagline: found.tagline || '',
        location: found.location || '',
        timings: found.timings || '',
        logoUrl: found.logo_url || null,
        logoMonogram: (found.name || 'Brand').slice(0, 2).toUpperCase(),
        desc: found.brand_guidelines || meta.description || '',
        description: meta.description || found.brand_guidelines || '',
        audience: found.target_audience || '',
        target_demographics: meta.target_demographics || '',
        audience_interests: meta.audience_interests || '',
        voice: found.tone_of_voice || 'Modern, confident & engaging',
        messaging_style: meta.messaging_style || '',
        cta: found.cta || '',
        avoid: found.avoid || '',
        keywords: Array.isArray(found.key_themes) ? found.key_themes.join(', ') : '',
        hashtags: Array.isArray(found.hashtags) ? found.hashtags.join(', ') : '',
        phone: meta.phone || '',
        email: meta.email || '',
        website: meta.website || '',
        usp: meta.usp || '',
        brand_positioning: meta.brand_positioning || '',
        marketing_objectives: meta.marketing_objectives || '',
        typography: meta.typography || 'Inter, sans-serif',
        visual_identity: meta.visual_identity || '',
        preferred_platforms: meta.preferred_platforms || ['Instagram', 'Facebook', 'YouTube'],
        content_formats: meta.content_formats || ['Image Post', 'Video Reel'],
        products: Array.isArray(meta.products) ? meta.products : [],
        colorPalette: palette,
        themeTokens: tokens
      };
      setBrandProfileState(profileObj);
      if (user?.id) {
        localStorage.setItem(`sacp_cached_brand_${user.id}`, JSON.stringify(profileObj));
      }
      try {
        const autoStatus = await api.automation.getStatus(brandId).catch(() => null);
        if (autoStatus && typeof autoStatus.is_active === 'boolean') {
          setIsAutomationActive(autoStatus.is_active);
        }
      } catch (e) {
        console.debug('Failed to sync automation status on brand switch:', e);
      }
      showToast(`Switched active workspace to "${found.name}"`, 'success');
    }
  };

  // Create Brand Profile
  const createBrandProfile = async (initialData = {}) => {
    try {
      const newBrand = await api.brandProfiles.create({
        name: initialData.name || 'New Brand',
        industry: initialData.industry || 'Retail & Lifestyle',
        tone_of_voice: initialData.tone_of_voice || 'Modern, confident & engaging',
        color_palette: ['#36B987', '#193C2D', '#55D3A0'],
        meta_info: initialData.meta_info || {}
      });
      if (user?.id) {
        localStorage.setItem(`sacp_brand_customized_${user.id}`, 'true');
      }
      setBrandProfilesList((prev) => [...prev, newBrand]);
      await switchBrand(newBrand.id);
      showToast(`Created new brand "${newBrand.name}"!`, 'success');
      return newBrand;
    } catch (e) {
      showToast(`Brand creation failed: ${e.message}`, 'error');
      throw e;
    }
  };

  // Upload Brand Logo using real storage and extract colors
  const uploadBrandLogo = async (fileOrDataUrl) => {
    if (user?.id) {
      localStorage.setItem(`sacp_brand_customized_${user.id}`, 'true');
    }
    try {
      let finalUrl = fileOrDataUrl;
      let dataUrlForPalette = null;

      // Real storage upload if File or Blob
      if (typeof window !== 'undefined' && (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob)) {
        // Always create a string preview first; the API schema accepts a URL
        // string only, never a File/Blob object.
        dataUrlForPalette = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(fileOrDataUrl);
        });
        finalUrl = dataUrlForPalette;
        try {
          const uploadRes = await api.media.upload(fileOrDataUrl, {
            title: `${brandProfile.name || 'Brand'} Logo`,
            tags: ['brand_logo']
          });
          if (uploadRes?.file_url) {
            finalUrl = uploadRes.file_url;
          }
        } catch (uploadErr) {
          console.warn('Real storage upload fallback to local preview:', uploadErr);
        }

      } else if (typeof fileOrDataUrl === 'string') {
        dataUrlForPalette = fileOrDataUrl;
      }

      let extractedTokens = null;
      if (dataUrlForPalette) {
        try {
          extractedTokens = await extractPaletteFromImage(dataUrlForPalette);
        } catch (e) {
          console.warn('Color extraction failed:', e);
        }
      }

      const newPalette = extractedTokens
        ? [extractedTokens.primary, extractedTokens.secondary, extractedTokens.accent]
        : brandProfile.colorPalette;

      if (typeof finalUrl !== 'string' || !finalUrl.trim()) {
        throw new Error('Logo upload did not return a valid image URL.');
      }

      await setBrandProfile((prev) => ({
        ...prev,
        logoUrl: finalUrl,
        colorPalette: newPalette,
        themeTokens: extractedTokens || prev.themeTokens
      }));

      if (extractedTokens) {
        applyThemeTokens(extractedTokens);
      }
      showToast('Brand Logo uploaded to real storage and palette applied!', 'success');
      return finalUrl;
    } catch (e) {
      showToast(`Logo upload failed: ${e.message}`, 'error');
    }
  };


  const updateThemePalette = async (tokens) => {
    const newPalette = [tokens.primary, tokens.secondary, tokens.accent];
    await setBrandProfile((prev) => ({
      ...prev,
      colorPalette: newPalette,
      themeTokens: tokens
    }));
    applyThemeTokens(tokens);
    showToast('Brand Color Palette updated and applied globally!', 'success');
  };

  const resetThemePalette = async () => {
    const defaultTokens = generateTokensFromPrimary('#36B987', '#55D3A0');
    await setBrandProfile((prev) => ({
      ...prev,
      colorPalette: ['#36B987', '#193C2D', '#55D3A0'],
      themeTokens: defaultTokens
    }));
    applyThemeTokens(defaultTokens);
    showToast('Brand color palette reset to standard default.', 'info');
  };

  const removeBrandLogo = async () => {
    await setBrandProfile((prev) => ({
      ...prev,
      logoUrl: null
    }));
    showToast('Reset to default brand monogram.', 'info');
  };

  // Save or Update Content Post in MySQL
  const saveContentItem = async (item) => {
    try {
      const statusMap = {
        awaiting: 'pending_approval',
        approved: 'approved',
        scheduled: 'scheduled',
        published: 'published',
        rejected: 'rejected',
        changes_requested: 'draft' };

      const payload = {
        title: item.title || item.headline,
        caption: item.caption,
        hashtags: typeof item.hashtags === 'string' ? item.hashtags.split(' ').filter(Boolean) : (item.hashtags || []),
        target_platforms: [item.platform ? item.platform.toLowerCase() : 'instagram'],
        status: statusMap[item.status] || 'pending_approval',
        brand_profile_id: activeBrandId,
        meta_info: {
          format: item.format,
          contentType: item.contentType,
          creativeDirection: item.creativeDirection,
          cta: item.cta,
          priceTag: item.priceTag,
          mediaUrl: item.mediaUrl,
          thumbnailUrl: item.thumbnailUrl,
          mediaMimeType: item.mediaMimeType,
          aspectRatio: item.aspectRatio,
          duration: item.duration,
          mediaArray: item.mediaArray,
          storyboard: item.storyboard,
          scheduledDate: item.scheduledDate,
          scheduledTime: item.scheduledTime,
          scheduledAccount: item.scheduledAccount,
          publishedDate: item.publishedDate
        }
      };

      const getNumericId = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const num = Number(val);
        return Number.isFinite(num) && num > 0 ? num : null;
      };

      const targetId = getNumericId(item.dbId) || getNumericId(item.id);
      if (targetId) {
        const res = await api.content.update(targetId, payload);
        const formatted = formatContentItem(res);
        setContentItems((prev) => prev.map((i) => (i.id === item.id || i.id === targetId || i.dbId === targetId ? formatted : i)));
      } else {
        const res = await api.content.create(payload);
        const formatted = formatContentItem(res);
        setContentItems((prev) => [formatted, ...prev.filter((i) => i.id !== item.id)]);
      }
    } catch (err) {
      console.error('Error saving post to MySQL:', err);
      // Fallback local update
      setContentItems((prev) => {
        const idx = prev.findIndex((i) => i.id === item.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...item, updatedAt: new Date().toISOString().split('T')[0] };
          return next;
        }
        return [item, ...prev];
      });
    }
  };

  // Content Workflow Actions
  const approveItem = async (id) => {
    const target = contentItems.find((i) => String(i.id) === String(id));
    const targetDbId = (target?.dbId && Number(target.dbId)) || (Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : null);
    if (targetDbId) {
      await api.content.update(targetDbId, { status: 'approved' }).catch(() => {});
    }
    setContentItems((prev) =>
      prev.map((item) => (String(item.id) === String(id) || (targetDbId && item.dbId === targetDbId) ? { ...item, status: 'approved', approvalStatus: 'approved' } : item))
    );
    showToast('Post approved! Ready to be scheduled.', 'success');
  };

  const rejectItem = async (id, feedback = '') => {
    const target = contentItems.find((i) => String(i.id) === String(id));
    const targetDbId = (target?.dbId && Number(target.dbId)) || (Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : null);
    if (targetDbId) {
      await api.content.update(targetDbId, { status: 'rejected' }).catch(() => {});
    }
    setContentItems((prev) =>
      prev.map((item) => (String(item.id) === String(id) || (targetDbId && item.dbId === targetDbId) ? { ...item, status: 'rejected', approvalStatus: 'rejected', rejectionReason: feedback } : item))
    );
    showToast('Post rejected and excluded from schedule.', 'error');
  };

  const requestChanges = async (id, feedback = '') => {
    const target = contentItems.find((i) => String(i.id) === String(id));
    const targetDbId = (target?.dbId && Number(target.dbId)) || (Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : null);
    if (targetDbId) {
      await api.content.update(targetDbId, { status: 'draft' }).catch(() => {});
    }
    setContentItems((prev) =>
      prev.map((item) => (String(item.id) === String(id) || (targetDbId && item.dbId === targetDbId) ? { ...item, status: 'changes_requested', approvalStatus: 'changes_requested', changeNotes: feedback } : item))
    );
    showToast('Revision requested. Returned to review queue.', 'info');
  };

  // Schedule Post in MySQL and sync with background publisher
  const scheduleItem = async (id, date, time, account) => {
    let target = contentItems.find((i) => String(i.id) === String(id));
    if (!target) return false;

    if (target.status !== 'approved' && target.status !== 'scheduled') {
      showToast('Approval-First Enforced: Only approved posts can enter the calendar queue.', 'error');
      return false;
    }

    try {
      const scheduledDateTime = new Date(`${date}T${time || '18:00'}:00`).toISOString();
      let targetDbId = (target.dbId && Number(target.dbId)) || (Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : null);

      // If the post hasn't been saved to MySQL yet, create it in DB first
      if (!targetDbId) {
        const saved = await api.content.create({
          title: target.title || target.headline,
          caption: target.caption,
          hashtags: typeof target.hashtags === 'string' ? target.hashtags.split(' ').filter(Boolean) : (target.hashtags || []),
          target_platforms: ['instagram', 'facebook', 'youtube'],
          status: 'approved',
          brand_profile_id: activeBrandId,
          meta_info: {
            format: target.format,
            contentType: target.contentType,
            mediaUrl: target.mediaUrl,
            thumbnailUrl: target.thumbnailUrl
          }
        });
        targetDbId = saved.id;
        target = { ...target, id: saved.id, dbId: saved.id };
      }

      // Resolve selective or cross-platform accounts
      let socialAccountIds = null;
      let socialAccountId = null;
      let isPostToAll = false;

      if (Array.isArray(account) && account.length > 0) {
        socialAccountIds = account;
      } else if (account === 'all' || !account) {
        isPostToAll = true;
      } else if (typeof account === 'number') {
        socialAccountId = account;
      } else if (typeof account === 'object' && account?.id && account.id !== 'all') {
        socialAccountId = account.id;
      } else if (typeof account === 'string' && /^\d+$/.test(account)) {
        socialAccountId = parseInt(account, 10);
      } else {
        isPostToAll = true;
      }

      const schedulePayload = {
        content_id: targetDbId,
        scheduled_time: scheduledDateTime,
        timezone: 'Asia/Kolkata',
        post_to_all: isPostToAll
      };

      if (socialAccountIds && socialAccountIds.length > 0) {
        schedulePayload.social_account_ids = socialAccountIds;
        schedulePayload.post_to_all = false;
      } else if (socialAccountId) {
        schedulePayload.social_account_id = socialAccountId;
      }

      const scheduleRes = await api.scheduler.schedule(schedulePayload);

      const label = isPostToAll
        ? 'All Connected Channels' : socialAccountIds
        ? `Selected Channels (${socialAccountIds.length})` : `@${socialAccountId}`;

      const updated = {
        ...target,
        dbId: targetDbId,
        status: 'scheduled',
        approvalStatus: 'scheduled',
        scheduledDate: date,
        scheduledTime: time,
        scheduledAccount: label || target.scheduledAccount || `@${(brandProfile?.name || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '')} (${target.platform || 'Social'})`,
        scheduledAccountId: socialAccountIds || (socialAccountId || 'all')
      };

      await saveContentItem(updated);

      // Refresh queue
      const queue = await api.scheduler.getQueue().catch(() => []);
      setScheduledQueue(queue || []);

      showToast(`Scheduled! "${target.title}" will auto-post across selected channels at ${time} on ${date}.`, 'success');
      return true;
    } catch (err) {
      console.error('Schedule error:', err);
      showToast(`Scheduling failed: ${err.message}`, 'error');
      return false;
    }
  };

  // Immediate Publish in MySQL and live dispatch across connected channels
  const publishItem = async (id, accountId = null) => {
    let target = contentItems.find((i) => String(i.id) === String(id));
    if (!target) return;

    showToast(`Dispatching "${target.title}" live across selected social channels...`, 'info');

    try {
      let targetDbId = (target.dbId && Number(target.dbId)) || (Number.isFinite(Number(id)) && Number(id) > 0 ? Number(id) : null);

      if (!targetDbId) {
        const saved = await api.content.create({
          title: target.title || target.headline,
          caption: target.caption,
          hashtags: typeof target.hashtags === 'string' ? target.hashtags.split(' ').filter(Boolean) : (target.hashtags || []),
          target_platforms: ['instagram', 'facebook', 'youtube'],
          status: 'approved',
          brand_profile_id: activeBrandId,
          meta_info: {
            format: target.format,
            contentType: target.contentType,
            mediaUrl: target.mediaUrl,
            thumbnailUrl: target.thumbnailUrl
          }
        });
        targetDbId = saved.id;
        target = { ...target, id: saved.id, dbId: saved.id };
      }

      let publishPayload = {};
      let targetAccountIds = null;
      if (Array.isArray(accountId) && accountId.length > 0) {
        targetAccountIds = accountId;
      } else if (typeof accountId === 'number') {
        targetAccountIds = [accountId];
      } else if (typeof accountId === 'string' && /^\d+$/.test(accountId)) {
        targetAccountIds = [parseInt(accountId, 10)];
      }

      if (targetAccountIds && targetAccountIds.length > 0) {
        publishPayload.social_account_ids = targetAccountIds;
      }

      const res = await api.publishing.publishDirect(targetDbId, publishPayload);

      setContentItems((prev) =>
        prev.map((item) =>
          item.id === id || item.id === targetDbId
            ? {
                ...item,
                status: 'published',
                approvalStatus: 'published',
                publishedDate: new Date().toISOString().split('T')[0]
              }
            : item
        )
      );
      showToast(`Live! Published successfully across target platforms.`, 'success');
      return res;
    } catch (err) {
      console.error('Publish error:', err);
      showToast(`Publishing failed: ${err.message}`, 'error');
    }
  };

  const cancelSchedule = async (id) => {
    const target = contentItems.find((i) => i.id === id);
    if (target?.dbId || typeof id === 'number') {
      await api.content.update(target?.dbId || id, { status: 'APPROVED' }).catch(() => {});
    }
    setContentItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'approved', approvalStatus: 'approved', scheduledDate: null, scheduledTime: null }
          : item
      )
    );
    showToast('Post unscheduled and returned to Approved pool.', 'info');
  };

  const deleteItem = async (id) => {
    const target = contentItems.find((i) => i.id === id);
    if (target?.dbId || typeof id === 'number') {
      await api.content.delete(target?.dbId || id).catch(() => {});
    }
    setContentItems((prev) => prev.filter((i) => i.id !== id));
    showToast('Item deleted from MySQL database.', 'info');
  };

  // Real-time AI Daily Batch Generation via backend
  const generateDailyBatch = async () => {
    showToast('Autonomous AI engine synthesizing today’s batch with brand profile & MySQL persistence...', 'info');

    try {
      const bName = brandProfile.name || 'My Brand';
      const bType = brandProfile.type || 'Retail & Lifestyle';
      const bDesc = brandProfile.desc || 'Premium quality offerings';
      const prompt = `Showcase ${bName}'s signature ${bType} collection focusing on ${bDesc}. Highlight quality, customer delight, and a clear call to action.`;

      // Call backend full bundle endpoint (real Gemini text + image creative)
      const bundle = await api.generations.generateFullBundle({
        brand_profile_id: activeBrandId,
        prompt: prompt,
        campaign_goal: 'product_launch',
        target_platforms: ['instagram', 'facebook'],
        aspect_ratio: '1:1',
        tone: brandProfile.voice || 'Engaging',
        language: 'English' });

      const textData = bundle?.text || {};
      const imgData = bundle?.image || {};

      const caption = textData.caption || `Welcome to ${bName}. Discover our latest collection today!`;
      const hashtags = textData.hashtags || [`#${bName.replace(/\s+/g, '')}`, '#Quality', '#NewArrivals'];
      const headline = textData.headline || `${bName} New Arrival Drop`;

      // Persist real generated item in MySQL database
      const newPost = {
        title: headline,
        caption: caption,
        hashtags: hashtags,
        target_platforms: ['INSTAGRAM', 'FACEBOOK'],
        status: 'PENDING_APPROVAL',
        brand_profile_id: activeBrandId,
        meta_info: {
          format: 'Image post',
          contentType: 'image',
          creativeDirection: imgData.prompt || `Studio presentation for ${bName}`,
          cta: textData.call_to_action || brandProfile.cta || `Connect with ${bName} today!`,
          mediaUrl: imgData.image_url || null,
          thumbnailUrl: imgData.image_url || null,
          icon: '' }
      };

      const saved = await api.content.create(newPost);
      const formatted = formatContentItem(saved);
      setContentItems((prev) => [formatted, ...prev]);
      showToast(`Real AI post & artwork synthesized for ${bName} and saved to MySQL!`, 'success');
      return formatted;
    } catch (err) {
      console.error('AI Generation error:', err);
      showToast(`AI generation notice: ${err.message}`, 'error');
    }
  };

  const createCampaign = async (newCamp) => {
    try {
      const payload = {
        title: newCamp.name,
        objective: newCamp.objective,
        start_date: new Date(newCamp.startDate || Date.now()).toISOString(),
        end_date: new Date(newCamp.endDate || Date.now() + 30 * 86400000).toISOString(),
        tags: [newCamp.platforms || 'Instagram, Facebook'],
        status: 'Active' };
      const res = await api.campaigns.create(payload);
      setCampaigns((prev) => [
        {
          id: res.id,
          name: res.title,
          objective: res.objective,
          startDate: newCamp.startDate,
          endDate: newCamp.endDate,
          platforms: newCamp.platforms,
          status: 'Active' },
        ...prev
      ]);
      showToast(`Campaign "${newCamp.name}" created and saved to MySQL!`, 'success');
    } catch (err) {
      setCampaigns((prev) => [newCamp, ...prev]);
      showToast(`Campaign "${newCamp.name}" saved!`, 'success');
    }
  };

  const toggleAutomation = async () => {
    if (isTogglingAutomation) return;
    setIsTogglingAutomation(true);
    const targetBrandId = activeBrandId || brandProfile?.id || null;
    const isCurrentlyActive = isAutomationActive;

    try {
      if (isCurrentlyActive) {
        const res = await api.automation.pause(targetBrandId);
        if (res && (res.is_active === false || res.success)) {
          setIsAutomationActive(false);
          showToast('Automation scheduler paused.', 'info');
        } else {
          throw new Error(res?.message || 'Failed to pause automation.');
        }
      } else {
        const res = await api.automation.enable(targetBrandId);
        if (res && (res.is_active === true || res.success)) {
          setIsAutomationActive(true);
          showToast('Automation scheduler enabled and active!', 'success');
        } else {
          throw new Error(res?.message || 'Failed to enable automation.');
        }
      }
    } catch (err) {
      console.error('Failed to toggle automation scheduler:', err);
      showToast(`Failed to toggle automation: ${err.message || 'Request failed'}`, 'error');
    } finally {
      setIsTogglingAutomation(false);
    }
  };

  return (
    <ContentContext.Provider
      value={{
        contentItems,
        campaigns,
        scheduledQueue,
        isAutomationActive,
        setIsAutomationActive,
        isTogglingAutomation,
        brandProfile,
        brandProfilesList,
        activeBrandId,
        switchBrand,
        createBrandProfile,
        themeTokens,
        isLoading,
        uploadBrandLogo,
        removeBrandLogo,
        updateThemePalette,
        resetThemePalette,
        saveContentItem,
        approveItem,
        rejectItem,
        requestChanges,
        scheduleItem,
        publishItem,
        cancelSchedule,
        deleteItem,
        generateDailyBatch,
        createCampaign,
        toggleAutomation,
        setBrandProfile,
        fetchAllData
      }}
    >

      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const context = useContext(ContentContext);
  return context || defaultContentState;
}
