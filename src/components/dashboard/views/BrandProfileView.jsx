import React, { useState, useEffect } from 'react';
import { useContent } from '../../../contexts/ContentContext';
import { useToast } from '../../common/Toast';
import { extractPaletteFromImage, generateTokensFromPrimary } from '../../../utils/colorExtractor';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Building2,
  Package,
  Target,
  PenTool,
  Palette,
  Plus,
  Edit3,
  X,
  Save,
  Check,
  CheckCircle2,
  UploadCloud,
  Trash2,
  Sparkles,
  RotateCcw,
  Tag
} from 'lucide-react';

export function BrandProfileView({ generateDailyBatch }) {
  const {
    brandProfile,
    brandProfilesList = [],
    activeBrandId,
    switchBrand,
    createBrandProfile,
    themeTokens,
    setBrandProfile,
    uploadBrandLogo,
    removeBrandLogo,
    updateThemePalette,
    resetThemePalette
  } = useContent();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('identity');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Core Identity & Contacts
  const [bpName, setBpName] = useState(brandProfile.name || '');
  const [bpIndustry, setBpIndustry] = useState(brandProfile.industry || brandProfile.type || '');
  const [bpCategory, setBpCategory] = useState(brandProfile.category || '');
  const [bpTagline, setBpTagline] = useState(brandProfile.tagline || '');
  const [bpDescription, setBpDescription] = useState(brandProfile.description || brandProfile.desc || '');
  const [bpLocation, setBpLocation] = useState(brandProfile.location || '');
  const [bpTimings, setBpTimings] = useState(brandProfile.timings || '');
  const [bpWebsite, setBpWebsite] = useState(brandProfile.website || '');
  const [bpPhone, setBpPhone] = useState(brandProfile.phone || '');
  const [bpEmail, setBpEmail] = useState(brandProfile.email || '');
  const [bpGstin, setBpGstin] = useState(brandProfile.gstin || brandProfile.meta_info?.gstin || '');

  // Audience & Value Proposition
  const [bpAudience, setBpAudience] = useState(brandProfile.audience || '');
  const [bpDemographics, setBpDemographics] = useState(brandProfile.target_demographics || '');
  const [bpInterests, setBpInterests] = useState(brandProfile.audience_interests || '');
  const [bpUsp, setBpUsp] = useState(brandProfile.usp || '');
  const [bpPositioning, setBpPositioning] = useState(brandProfile.brand_positioning || '');
  const [bpObjectives, setBpObjectives] = useState(brandProfile.marketing_objectives || '');

  // Voice & Directives
  const [bpVoice, setBpVoice] = useState(brandProfile.voice || '');
  const [bpMessagingStyle, setBpMessagingStyle] = useState(brandProfile.messaging_style || '');
  const [bpGuidelines, setBpGuidelines] = useState(brandProfile.desc || '');
  const [bpCta, setBpCta] = useState(brandProfile.cta || '');
  const [bpAvoid, setBpAvoid] = useState(brandProfile.avoid || '');
  const [bpKeywords, setBpKeywords] = useState(brandProfile.keywords || '');
  const [bpHashtags, setBpHashtags] = useState(brandProfile.hashtags || '');

  // Products & Services
  const [products, setProducts] = useState(brandProfile.products || []);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdImg, setNewProdImg] = useState('');
  const [isAddingProduct, setIsAddingProduct] = useState(false);

  // Visual Identity & Palette
  const defaultTokens = generateTokensFromPrimary('#36B987', '#55D3A0');
  const [paletteTokens, setPaletteTokens] = useState(themeTokens || defaultTokens);
  const [bpTypography, setBpTypography] = useState(brandProfile.typography || 'Inter, sans-serif');
  const [bpVisualIdentity, setBpVisualIdentity] = useState(brandProfile.visual_identity || '');

  // Palette & Logo preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [pendingLogoUrl, setPendingLogoUrl] = useState(null);
  const [pendingTokens, setPendingTokens] = useState(null);

  // New Brand Modal
  const [newBrandModalOpen, setNewBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandIndustry, setNewBrandIndustry] = useState('Retail & Lifestyle');

  useEffect(() => {
    if (brandProfile) {
      setBpName(brandProfile.name || '');
      setBpIndustry(brandProfile.industry || brandProfile.type || '');
      setBpCategory(brandProfile.category || '');
      setBpTagline(brandProfile.tagline || '');
      setBpDescription(brandProfile.description || brandProfile.desc || '');
      setBpLocation(brandProfile.location || '');
      setBpTimings(brandProfile.timings || '');
      setBpWebsite(brandProfile.website || '');
      setBpPhone(brandProfile.phone || '');
      setBpEmail(brandProfile.email || '');
      setBpGstin(brandProfile.gstin || brandProfile.meta_info?.gstin || '');

      setBpAudience(brandProfile.audience || '');
      setBpDemographics(brandProfile.target_demographics || '');
      setBpInterests(brandProfile.audience_interests || '');
      setBpUsp(brandProfile.usp || '');
      setBpPositioning(brandProfile.brand_positioning || '');
      setBpObjectives(brandProfile.marketing_objectives || '');

      setBpVoice(brandProfile.voice || '');
      setBpMessagingStyle(brandProfile.messaging_style || '');
      setBpGuidelines(brandProfile.desc || '');
      setBpCta(brandProfile.cta || '');
      setBpAvoid(brandProfile.avoid || '');
      setBpKeywords(brandProfile.keywords || '');
      setBpHashtags(brandProfile.hashtags || '');

      setProducts(brandProfile.products || []);
      setBpTypography(brandProfile.typography || 'Inter, sans-serif');
      setBpVisualIdentity(brandProfile.visual_identity || '');
    }
    if (themeTokens) {
      setPaletteTokens(themeTokens);
    }
  }, [brandProfile, themeTokens]);

  const handleLogoSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showToast('Uploading brand logo...', 'info');
      const uploadedUrl = await uploadBrandLogo(file);
      showToast('Logo uploaded! Extracting brand colors...', 'info');

      const extracted = await extractPaletteFromImage(uploadedUrl);
      setPendingLogoUrl(uploadedUrl);
      setPendingTokens(extracted);
      setPreviewModalOpen(true);
    } catch (err) {
      showToast(`Logo upload failed: ${err.message}`, 'error');
    }
  };

  const handleConfirmPaletteAndLogo = async () => {
    if (pendingTokens) {
      await updateThemePalette(pendingTokens);
      setPaletteTokens(pendingTokens);
    }
    setPreviewModalOpen(false);
    setPendingLogoUrl(null);
    setPendingTokens(null);
    showToast('Brand logo & color tokens applied globally!', 'success');
  };

  const handleCancelLogoPreview = () => {
    setPreviewModalOpen(false);
    setPendingLogoUrl(null);
    setPendingTokens(null);
  };

  const handlePaletteColorChange = (key, value) => {
    const updated = { ...paletteTokens, [key]: value };
    if (key === 'primary') {
      updated.buttonBg = value;
    }
    setPaletteTokens(updated);
  };

  const handleSavePalette = async () => {
    await updateThemePalette(paletteTokens);
    showToast('Brand color palette saved!', 'success');
  };

  const handleResetPalette = async () => {
    if (window.confirm('Reset all brand palette tokens to default?')) {
      await resetThemePalette();
      setPaletteTokens(defaultTokens);
      showToast('Palette reset to default', 'info');
    }
  };

  const handleAddProduct = () => {
    if (!newProdName.trim()) {
      showToast('Product name is required.', 'error');
      return;
    }
    const newProduct = {
      id: Date.now().toString(),
      name: newProdName.trim(),
      price: newProdPrice.trim(),
      category: newProdCategory.trim(),
      description: newProdDesc.trim(),
      image_url: newProdImg.trim()
    };
    const updated = [...products, newProduct];
    setProducts(updated);
    setNewProdName('');
    setNewProdPrice('');
    setNewProdCategory('');
    setNewProdDesc('');
    setNewProdImg('');
    setIsAddingProduct(false);
    showToast(`Added product "${newProduct.name}" to catalog! Save changes to persist.`, 'success');
  };

  const handleRemoveProduct = (id) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    showToast('Removed product from catalog. Remember to click Save Changes!', 'info');
  };

  const handleSaveProfile = async () => {
    if (!bpName.trim()) {
      showToast('Brand Name is required.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await setBrandProfile((prev) => ({
        ...prev,
        name: bpName.trim(),
        industry: bpIndustry.trim() || 'General Business',
        type: bpIndustry.trim() || 'General Business',
        category: bpCategory.trim(),
        tagline: bpTagline.trim(),
        description: bpDescription.trim(),
        desc: bpDescription.trim(),
        location: bpLocation.trim(),
        timings: bpTimings.trim(),
        website: bpWebsite.trim(),
        phone: bpPhone.trim(),
        email: bpEmail.trim(),
        gstin: bpGstin.trim(),

        audience: bpAudience.trim(),
        target_demographics: bpDemographics.trim(),
        audience_interests: bpInterests.trim(),
        usp: bpUsp.trim(),
        brand_positioning: bpPositioning.trim(),
        marketing_objectives: bpObjectives.trim(),

        voice: bpVoice.trim(),
        messaging_style: bpMessagingStyle.trim(),
        cta: bpCta.trim(),
        avoid: bpAvoid.trim(),
        keywords: bpKeywords,
        hashtags: bpHashtags,

        products: products,
        typography: bpTypography,
        visual_identity: bpVisualIdentity
      }));
      setIsEditing(false);
      showToast('Verified Brand Profile and Products Catalog saved to MySQL!', 'success');
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNewBrandSubmit = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) {
      showToast('Brand name is required.', 'error');
      return;
    }
    try {
      await createBrandProfile({
        name: newBrandName.trim(),
        industry: newBrandIndustry.trim()
      });
      setNewBrandModalOpen(false);
      setNewBrandName('');
      setIsEditing(true);
    } catch (err) {
      showToast(`Error creating brand: ${err.message}`, 'error');
    }
  };

  const tabs = [
    { id: 'identity', label: 'Core Business & Contacts', icon: Building2 },
    { id: 'products', label: `Products & Catalog (${products.length})`, icon: Package },
    { id: 'positioning', label: 'Positioning & Audience', icon: Target },
    { id: 'directives', label: 'Voice & Directives', icon: PenTool },
    { id: 'visual', label: 'Visual Identity & Colors', icon: Palette }
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <DashboardPageHeader
        badge="1. BRAND PROFILE INTELLIGENCE" badgeType="indigo" statusBadge="Powers 100% of AI Generations" title="Brand Profile & Product Knowledge Hub" description="Configure your company identity, catalog, tone of voice, visual directives, and restrictions. AI uses these exact inputs." >
        {brandProfilesList.length > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-text-muted">Workspace:</span>
            <select
              value={activeBrandId || ''}
              onChange={(e) => switchBrand(Number(e.target.value))}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-border text-text shadow-xs focus:ring-2 focus:ring-primary" >
              {brandProfilesList.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={() => setNewBrandModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-text bg-white border border-border hover:bg-surface transition-all shadow-xs" >
          <Plus className="w-3.5 h-3.5" />
          <span>New Brand</span>
        </button>

        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:opacity-90 active:scale-95 transition-all shadow-md shadow-sm" >
            <Edit3 className="w-4 h-4" />
            <span>Edit Brand Profile</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text bg-white border border-border hover:bg-surface transition-all" >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:opacity-90 active:scale-95 transition-all shadow-md shadow-sm" >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
            </button>
          </div>
        )}
      </DashboardPageHeader>

      {/* Bento Tab Switcher */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white/70 backdrop-blur-md rounded-2xl border border-border overflow-x-auto shadow-xs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-primary text-primary-on shadow-sm shadow-sm' : 'text-text-secondary hover:text-text hover:bg-bg' }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: CORE BUSINESS & CONTACTS */}
      {activeTab === 'identity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Basic Business Information
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-secondary">
                Core Identity
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Brand / Business Name *</label>
                <input
                  type="text" value={bpName}
                  onChange={(e) => setBpName(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Zenith Organic Café" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Industry</label>
                  <input
                    type="text" value={bpIndustry}
                    onChange={(e) => setBpIndustry(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Specialty Café" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Category</label>
                  <input
                    type="text" value={bpCategory}
                    onChange={(e) => setBpCategory(e.target.value)}
                    disabled={!isEditing}
                    placeholder="e.g. Artisan Roastery" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Tax / GSTIN Number</label>
                <input
                  type="text"
                  value={bpGstin}
                  onChange={(e) => setBpGstin(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. 33AABCT1332L1Z8"
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Official Brand Tagline</label>
                <input
                  type="text" value={bpTagline}
                  onChange={(e) => setBpTagline(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Crafting mindful mornings, one brew at a time" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Business Description & Mission</label>
                <textarea
                  rows={4}
                  value={bpDescription}
                  onChange={(e) => setBpDescription(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Comprehensive description of your brand origin, ethos, and values." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Location & Digital Presence
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-secondary">
                Contact
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Physical Location</label>
                <input
                  type="text" value={bpLocation}
                  onChange={(e) => setBpLocation(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. 142 Anna Nagar 2nd Avenue, Chennai" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Operating Hours / Timings</label>
                <input
                  type="text" value={bpTimings}
                  onChange={(e) => setBpTimings(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Mon–Sun: 7:00 AM – 11:00 PM" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Website URL</label>
                <input
                  type="text" value={bpWebsite}
                  onChange={(e) => setBpWebsite(e.target.value)}
                  disabled={!isEditing}
                  placeholder="https://zenithcafe.com" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Email</label>
                  <input
                    type="email" value={bpEmail}
                    onChange={(e) => setBpEmail(e.target.value)}
                    disabled={!isEditing}
                    placeholder="hello@zenithcafe.com" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text mb-1">Phone</label>
                  <input
                    type="text" value={bpPhone}
                    onChange={(e) => setBpPhone(e.target.value)}
                    disabled={!isEditing}
                    placeholder="+91 98765 43210" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
                </div>
              </div>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 2: PRODUCTS & SERVICES CATALOG */}
      {activeTab === 'products' && (
        <SpotlightCard className="p-6 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
            <div>
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" />
                Products & Services Knowledge Base
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Add authentic offerings. AI generations directly integrate these products with real pricing and descriptions.
              </p>
            </div>
            {isEditing && (
              <button
                onClick={() => setIsAddingProduct(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:opacity-90 transition-all shadow-sm" >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Product</span>
              </button>
            )}
          </div>

          {/* New Product Form Box */}
          {isAddingProduct && (
            <div className="p-5 rounded-2xl bg-primary/10 border border-primary/80 space-y-4">
              <h4 className="text-sm font-bold text-text">Add New Offering to Catalog</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-text mb-1">Product Name *</label>
                  <input
                    type="text" value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="e.g. Single-Origin Cold Brew" className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-border text-text" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text mb-1">Price (e.g. $4.50)</label>
                  <input
                    type="text" value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="$4.50" className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-border text-text" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text mb-1">Category</label>
                  <input
                    type="text" value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    placeholder="Beverage" className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-border text-text" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-text mb-1">Image URL</label>
                  <input
                    type="text" value={newProdImg}
                    onChange={(e) => setNewProdImg(e.target.value)}
                    placeholder="https://..." className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-border text-text" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-text mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Steeped for 24 hours, smooth nutty aroma with natural floral notes." className="w-full px-3 py-2 rounded-xl text-xs bg-white border border-border text-text resize-none" />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleAddProduct}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:opacity-90 shadow-xs" ><Check className="w-4 h-4 inline-block mr-1" />Add to Catalog
                </button>
                <button
                  onClick={() => setIsAddingProduct(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text bg-white border border-border hover:bg-surface" >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Product Cards Grid */}
          {products.length === 0 ? (
            <div className="py-12 text-center text-text-muted">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-40 text-text-muted" />
              <h4 className="text-sm font-bold text-text">No products registered yet</h4>
              <p className="text-xs text-text-muted max-w-sm mx-auto mt-1 mb-4">
                Register items so AI captions can feature specific merchandise, ingredients, and prices.
              </p>
              {isEditing ? (
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary shadow-sm" >
                  + Add First Product
                </button>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text bg-white border border-border" >
                  Enable Edit Mode
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div
                  key={p.id || p.name}
                  className="p-4 rounded-xl border border-border bg-white/90 shadow-xs flex flex-col justify-between gap-3 group hover:border-primary transition-all" >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-text">{p.name}</h4>
                      {p.price && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-bg text-primary border border-border shrink-0">
                          {p.price.startsWith('$') ? p.price : `$${p.price}`}
                        </span>
                      )}
                    </div>
                    {p.category && (
                      <span className="text-[11px] font-semibold text-primary block mt-0.5">
                        {p.category}
                      </span>
                    )}
                    <p className="text-xs text-text-secondary mt-2 line-clamp-3 leading-relaxed">
                      {p.description || 'No description provided.'}
                    </p>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end pt-2 border-t border-border">
                      <button
                        onClick={() => handleRemoveProduct(p.id)}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1" >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </SpotlightCard>
      )}

      {/* TAB 3: POSITIONING & AUDIENCE */}
      {activeTab === 'positioning' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Value Proposition & Positioning
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-secondary">
                Strategy
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Unique Selling Proposition (USP)</label>
                <textarea
                  rows={3}
                  value={bpUsp}
                  onChange={(e) => setBpUsp(e.target.value)}
                  disabled={!isEditing}
                  placeholder="What makes your brand distinct from competitors? (e.g. 100% shade-grown fair-trade beans roasted in-house)" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Brand Positioning</label>
                <textarea
                  rows={3}
                  value={bpPositioning}
                  onChange={(e) => setBpPositioning(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Where does the brand sit in the market? (e.g. Premium artisanal café for mindful creators)" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Primary Marketing Objectives</label>
                <textarea
                  rows={3}
                  value={bpObjectives}
                  onChange={(e) => setBpObjectives(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Conversion goals: store footfall, bean subscription orders, community workshop registrations." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Target Audience Intelligence
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-secondary">
                Audience
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Target Audience Summary</label>
                <textarea
                  rows={3}
                  value={bpAudience}
                  onChange={(e) => setBpAudience(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Overview of your core customer profile and purchasing mindset." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Customer Demographics</label>
                <textarea
                  rows={3}
                  value={bpDemographics}
                  onChange={(e) => setBpDemographics(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Age range, geography, income level (e.g. 24–42 urban professionals and students)." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Audience Passions & Interests</label>
                <textarea
                  rows={3}
                  value={bpInterests}
                  onChange={(e) => setBpInterests(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Specialty coffee, sustainable design, morning fitness, boutique travel, tech." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 4: VOICE & DIRECTIVES */}
      {activeTab === 'directives' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <PenTool className="w-4 h-4 text-primary" />
                Tone of Voice & Messaging Style
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-secondary">
                Voice
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Tone of Voice Directives</label>
                <input
                  type="text" value={bpVoice}
                  onChange={(e) => setBpVoice(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Warm, inviting, knowledgeable, passionate about craft" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Messaging Style & Storytelling</label>
                <textarea
                  rows={4}
                  value={bpMessagingStyle}
                  onChange={(e) => setBpMessagingStyle(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Guidance on sentence flow, emoji usage, humor style, and narrative focus." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Default Call to Action (CTA)</label>
                <input
                  type="text" value={bpCta}
                  onChange={(e) => setBpCta(e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Stop by for your morning pour-over or order beans online at the link in bio." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="text-base font-bold text-text flex items-center gap-2">
                <Tag className="w-4 h-4 text-rose-500" />
                Restrictions & Hashtags
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-bg text-text-secondary">
                Guardrails
              </span>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Topics & Terms to AVOID (Negative Filter)</label>
                <textarea
                  rows={3}
                  value={bpAvoid}
                  onChange={(e) => setBpAvoid(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Strict restrictions: no discount mentions, no cheap buzzwords, no artificial flavor references." className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed resize-none" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Keywords to Emphasize (comma separated)</label>
                <input
                  type="text" value={bpKeywords}
                  onChange={(e) => setBpKeywords(e.target.value)}
                  disabled={!isEditing}
                  placeholder="Artisan, Single-Origin, Cold Brew, Ethically Sourced" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Official Brand Hashtags (comma separated)</label>
                <input
                  type="text" value={bpHashtags}
                  onChange={(e) => setBpHashtags(e.target.value)}
                  disabled={!isEditing}
                  placeholder="#ZenithCafe, #SingleOrigin, #ArtisanRoaster, #CoffeeCulture" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border focus:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-text placeholder:text-text-muted disabled:opacity-75 disabled:cursor-not-allowed" />
              </div>
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* TAB 5: VISUAL IDENTITY & PALETTE */}
      {activeTab === 'visual' && (
        <div className="space-y-6">
          {/* Logo Card */}
          <SpotlightCard className="p-6 sm:p-7 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" />
                  Company Logo & Cloud Storage
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Uploaded to permanent cloud storage. Colors are automatically extracted for global themes.
                </p>
              </div>
              {brandProfile.logoUrl ? (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-bg text-primary border border-border self-start sm:self-auto"><Check className="w-4 h-4 inline-block mr-1" />Logo Active
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/30 self-start sm:self-auto">
                  Using Monogram ({(brandProfile.name || 'Brand').slice(0, 2).toUpperCase()})
                </span>
              )}
            </div>

            <div className="flex items-center gap-5 flex-wrap">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-primary/20 to-primary/10 border border-white/80 shadow-md flex items-center justify-center overflow-hidden shrink-0">
                {brandProfile.logoUrl ? (
                  <img
                    src={brandProfile.logoUrl}
                    alt="Brand Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-primary font-extrabold text-2xl">
                    {(brandProfile.name || 'Brand').slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="space-y-2 flex-1 min-w-[220px]">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="file" accept="image/*" id="brand-logo-file-input" className="hidden" onChange={handleLogoSelect}
                  />
                  <label
                    htmlFor="brand-logo-file-input" className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:opacity-90 cursor-pointer shadow-sm shadow-sm transition-all" >
                    <UploadCloud className="w-4 h-4" />
                    <span>{brandProfile.logoUrl ? 'Replace Logo via Cloud' : 'Upload Logo via Cloud'}</span>
                  </label>

                  {brandProfile.logoUrl && (
                    <button
                      onClick={() => {
                        if (window.confirm('Remove company logo and revert to monogram?')) {
                          removeBrandLogo();
                        }
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all" >
                      Remove Logo
                    </button>
                  )}
                </div>
                <p className="text-xs text-text-muted">
                  Supports transparent PNG, SVG, or high-res JPG. Automatically uploaded to persistent cloud storage and analyzed.
                </p>
              </div>
            </div>
          </SpotlightCard>

          {/* Color Tokens Bento Card */}
          <SpotlightCard className="p-6 sm:p-7 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
              <div>
                <h3 className="text-base font-bold text-text flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Dynamic Brand Color Palette Tokens
                </h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Colors extracted from your logo and used in UI themes, artwork generators, and templates.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetPalette}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-text-secondary bg-white border border-border hover:bg-surface transition-all" >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
                <button
                  onClick={handleSavePalette}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:opacity-90 transition-all shadow-xs" >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Palette</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { key: 'primary', label: 'Primary Brand Color', desc: 'Main navigation, buttons, and accents' },
                { key: 'secondary', label: 'Secondary / Sub-accent', desc: 'Badges and secondary actions' },
                { key: 'accent', label: 'Vibrant Accent', desc: 'Highlights, glows, and CTA accents' },
                { key: 'background', label: 'Background Hue', desc: 'Page background tone' },
                { key: 'surface', label: 'Surface Card Tone', desc: 'Cards and container backgrounds' },
                { key: 'border', label: 'Border Subtle', desc: 'Card dividers and outlines' }
              ].map((token) => (
                <div
                  key={token.key}
                  className="p-4 rounded-xl border border-border bg-white/80 space-y-2" >
                  <div className="flex items-center gap-3">
                    <input
                      type="color" value={paletteTokens[token.key] || '#36B987'}
                      onChange={(e) => handlePaletteColorChange(token.key, e.target.value)}
                      className="w-10 h-10 rounded-xl border-none cursor-pointer bg-transparent" />
                    <div>
                      <span className="text-xs font-bold text-text block">{token.label}</span>
                      <span className="text-[11px] font-mono text-text-muted">
                        {paletteTokens[token.key] || '#36B987'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted">{token.desc}</p>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      )}

      {/* PALETTE EXTRACTION PREVIEW MODAL */}
      {previewModalOpen && pendingTokens && (
        <div className="fixed inset-0 bg-[#12162B]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-white/80 space-y-5 animate-in fade-in-50 zoom-in-95">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Brand Color Palette Extracted
            </h3>
            <p className="text-xs text-text-secondary">
              Dominant colors extracted from your logo. Apply to update buttons, cards, and artwork generators across the studio.
            </p>

            <div className="grid grid-cols-3 gap-3">
              {['primary', 'secondary', 'accent'].map((key) => (
                <div key={key} className="text-center space-y-1">
                  <div
                    className="h-12 rounded-xl border border-black/10 shadow-inner" style={{ background: pendingTokens[key] }}
                  />
                  <span className="text-xs font-bold text-text capitalize block">{key}</span>
                  <span className="text-[10px] font-mono text-text-muted">{pendingTokens[key]}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={handleCancelLogoPreview}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-text bg-bg hover:bg-slate-200" >
                Keep Existing Colors
              </button>
              <button
                onClick={handleConfirmPaletteAndLogo}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:opacity-90 shadow-md shadow-sm" ><Check className="w-4 h-4 inline-block mr-1" />Apply Globally
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW BRAND MODAL */}
      {newBrandModalOpen && (
        <div className="fixed inset-0 bg-[#12162B]/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-white/80 space-y-4 animate-in fade-in-50 zoom-in-95">
            <h3 className="text-lg font-bold text-text flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Create New Brand Profile
            </h3>
            <p className="text-xs text-text-secondary">
              Add another brand under your organization with isolated products, visual directives, and schedule queue.
            </p>

            <form onSubmit={handleCreateNewBrandSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text mb-1">Brand Name *</label>
                <input
                  type="text" value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="e.g. Apex Living" required
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text" />
              </div>

              <div>
                <label className="block text-xs font-bold text-text mb-1">Industry</label>
                <input
                  type="text" value={newBrandIndustry}
                  onChange={(e) => setNewBrandIndustry(e.target.value)}
                  placeholder="e.g. Home Decor & Architecture" className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text" />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button" onClick={() => setNewBrandModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text bg-bg hover:bg-slate-200" >
                  Cancel
                </button>
                <button
                  type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold text-primary-on bg-primary hover:opacity-90 shadow-md shadow-sm" ><Check className="w-4 h-4 inline-block mr-1" />Create Brand
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BrandProfileView;
