import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useToast } from '../../common/Toast';
import { useContent } from '../../../contexts/ContentContext';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import {
  Target,
  Users,
  Sliders,
  Sparkles,
  Save,
  CheckCircle2,
  Lightbulb,
  Plus,
  Trash2,
  RefreshCw,
  TrendingUp,
  Check,
  ChevronRight,
  ShieldCheck,
  Eye,
  SlidersHorizontal,
  Flame,
  ArrowUpRight
} from 'lucide-react';

const QUICK_GOAL_SUGGESTIONS = [
  'Drive Direct Inquiries & Consultations',
  'Promote Flagship Equipment & Product Launches',
  'Establish High-Trust Industry Authority & Expertise',
  'Accelerate In-Store Visits & Regional Footfall',
  'Increase Engagement, Shares & Viral Social Reach',
  'Highlight Customer Transformations & Case Studies'
];

const PRESET_DISTRIBUTIONS = [
  { name: 'Video-First / Reels', reels: 60, images: 30, carousels: 0, text: 10, icon: '🎬' },
  { name: 'Lookbook & Visuals', reels: 30, images: 60, carousels: 0, text: 10, icon: '📸' },
  { name: 'Balanced Multi-Format', reels: 50, images: 40, carousels: 0, text: 10, icon: '⚖️' }
];

export function ContentGoalsView() {
  const { showToast } = useToast();
  const { brandProfile, setBrandProfile } = useContent();

  const brandName = brandProfile?.name || 'Your Brand';
  const industry = brandProfile?.industry || 'Modern Lifestyle';
  const usp = brandProfile?.usp || 'Uncompromising quality and customer excellence';
  const tagline = brandProfile?.tagline || '';
  const currentAudience = brandProfile?.audience || '';

  // Local state initialized from active Brand Profile
  const [primaryGoal, setPrimaryGoal] = useState(() => {
    return brandProfile?.marketing_objectives || 'Drive Direct Inquiries & Regional Brand Authority';
  });

  const [reelsRatio, setReelsRatio] = useState(() => {
    return brandProfile?.content_format_ratios?.reels ?? 50;
  });
  const [imagesRatio, setImagesRatio] = useState(() => {
    return brandProfile?.content_format_ratios?.images ?? 40;
  });
  const [carouselsRatio, setCarouselsRatio] = useState(() => {
    return brandProfile?.content_format_ratios?.carousels ?? 0;
  });
  const [textRatio, setTextRatio] = useState(() => {
    return brandProfile?.content_format_ratios?.text ?? 10;
  });

  // Buyer personas
  const [personas, setPersonas] = useState(() => {
    if (Array.isArray(brandProfile?.buyer_personas) && brandProfile.buyer_personas.length > 0) {
      return brandProfile.buyer_personas;
    }
    return generateTailoredPersonas(brandName, industry, currentAudience);
  });

  // Adding persona state
  const [isAddingPersona, setIsAddingPersona] = useState(false);
  const [newPersonaTitle, setNewPersonaTitle] = useState('');
  const [newPersonaDesc, setNewPersonaDesc] = useState('');

  // Real-time synchronization status
  const [saveStatus, setSaveStatus] = useState('synced'); // 'synced' | 'saving' | 'dirty'
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const isFirstRender = useRef(true);
  const autoSaveTimer = useRef(null);

  // Keep state synced if brandProfile changes externally (e.g. brand switch)
  useEffect(() => {
    if (brandProfile) {
      if (brandProfile.marketing_objectives) {
        setPrimaryGoal(brandProfile.marketing_objectives);
      }
      if (brandProfile.content_format_ratios) {
        setReelsRatio(brandProfile.content_format_ratios.reels ?? 40);
        setImagesRatio(brandProfile.content_format_ratios.images ?? 30);
        setCarouselsRatio(brandProfile.content_format_ratios.carousels ?? 20);
        setTextRatio(brandProfile.content_format_ratios.text ?? 10);
      }
      if (Array.isArray(brandProfile.buyer_personas) && brandProfile.buyer_personas.length > 0) {
        setPersonas(brandProfile.buyer_personas);
      } else {
        setPersonas(generateTailoredPersonas(brandProfile.name, brandProfile.industry, brandProfile.audience));
      }
    }
  }, [brandProfile?.id, brandProfile?.name]);

  // Total ratio calculation
  const totalRatio = reelsRatio + imagesRatio + carouselsRatio + textRatio;
  const isRatioBalanced = totalRatio === 100;

  // Real-time auto-saving with debounce
  const triggerAutoSave = (updatedData) => {
    setSaveStatus('dirty');
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);

    autoSaveTimer.current = setTimeout(async () => {
      try {
        setSaveStatus('saving');
        await setBrandProfile((prev) => ({
          ...prev,
          marketing_objectives: updatedData.primaryGoal ?? primaryGoal,
          buyer_personas: updatedData.personas ?? personas,
          content_format_ratios: {
            reels: updatedData.reelsRatio ?? reelsRatio,
            images: updatedData.imagesRatio ?? imagesRatio,
            carousels: updatedData.carouselsRatio ?? carouselsRatio,
            text: updatedData.textRatio ?? textRatio
          }
        }));
        setSaveStatus('synced');
      } catch (err) {
        console.error('Auto-save error:', err);
        setSaveStatus('dirty');
      }
    }, 750);
  };

  // Trigger auto-save whenever user changes local values (after initial mount)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    triggerAutoSave({ primaryGoal, reelsRatio, imagesRatio, carouselsRatio, textRatio, personas });
  }, [primaryGoal, reelsRatio, imagesRatio, carouselsRatio, textRatio, personas]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, []);

  // Manual Save handler
  const handleManualSave = async () => {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setSaveStatus('saving');
    try {
      await setBrandProfile((prev) => ({
        ...prev,
        marketing_objectives: primaryGoal,
        buyer_personas: personas,
        content_format_ratios: {
          reels: reelsRatio,
          images: imagesRatio,
          carousels: carouselsRatio,
          text: textRatio
        }
      }));
      setSaveStatus('synced');
      showToast('Goals & Audience Strategy synchronized live to AI Content Planner!', 'success');
    } catch (err) {
      setSaveStatus('dirty');
      showToast('Failed to save strategy: ' + (err.message || 'Server error'), 'error');
    }
  };

  // Normalization / Balance to 100%
  const handleAutoBalance = () => {
    const activeTotal = reelsRatio + imagesRatio + textRatio;
    if (activeTotal === 0) {
      setReelsRatio(50);
      setImagesRatio(40);
      setCarouselsRatio(0);
      setTextRatio(10);
      return;
    }
    const factor = 100 / activeTotal;
    const newReels = Math.round(reelsRatio * factor);
    const newImgs = Math.round(imagesRatio * factor);
    const newTxt = 100 - (newReels + newImgs);

    setReelsRatio(Math.max(5, newReels));
    setImagesRatio(Math.max(5, newImgs));
    setCarouselsRatio(0);
    setTextRatio(Math.max(5, newTxt));
    showToast('Format distribution automatically balanced to 100%!', 'info');
  };

  // Apply quick preset
  const handleApplyPreset = (preset) => {
    setReelsRatio(preset.reels);
    setImagesRatio(preset.images);
    setCarouselsRatio(preset.carousels);
    setTextRatio(preset.text);
    showToast(`Applied ${preset.name} format preset!`, 'success');
  };

  // Persona actions
  const togglePersona = (index) => {
    setPersonas((prev) =>
      prev.map((p, idx) => (idx === index ? { ...p, active: !p.active } : p))
    );
  };

  const deletePersona = (index) => {
    setPersonas((prev) => prev.filter((_, idx) => idx !== index));
    showToast('Buyer persona removed.', 'info');
  };

  const handleAddPersona = (e) => {
    e.preventDefault();
    if (!newPersonaTitle.trim()) {
      showToast('Please enter a persona title.', 'error');
      return;
    }
    const item = {
      title: newPersonaTitle.trim(),
      desc: newPersonaDesc.trim() || 'Focused on discovering value, reliability and solutions tailored to their exact requirements.',
      active: true
    };
    setPersonas((prev) => [...prev, item]);
    setNewPersonaTitle('');
    setNewPersonaDesc('');
    setIsAddingPersona(false);
    showToast('New buyer persona added to AI targeting!', 'success');
  };

  // Generate fresh AI personas tailored to the active brand
  const handleGenerateAiPersonas = () => {
    setIsAiGenerating(true);
    setTimeout(() => {
      const generated = generateTailoredPersonas(brandName, industry, currentAudience);
      setPersonas(generated);
      setIsAiGenerating(false);
      showToast(`Generated ${generated.length} real-time buyer personas for ${brandName}!`, 'success');
    }, 600);
  };

  // Weekly projections based on format ratio (7-day schedule)
  const weeklyProjection = useMemo(() => {
    const totalSlots = 7;
    const reelsCount = Math.max(1, Math.round((reelsRatio / 100) * totalSlots));
    const imgsCount = Math.max(1, Math.round((imagesRatio / 100) * totalSlots));
    const carsCount = Math.max(0, Math.round((carouselsRatio / 100) * totalSlots));
    const txtCount = Math.max(0, totalSlots - (reelsCount + imgsCount + carsCount));
    return { reelsCount, imgsCount, carsCount, txtCount };
  }, [reelsRatio, imagesRatio, carouselsRatio, textRatio]);

  const activePersonasCount = personas.filter((p) => p.active).length;

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="1. ONBOARDING & BRAND"
        badgeType="indigo"
        statusBadge={
          saveStatus === 'saving'
            ? '🟡 Syncing in Real Time...'
            : saveStatus === 'dirty'
            ? '🟠 Unsaved Changes'
            : '🟢 Live Synced with AI Engine'
        }
        title="Content Goals & Audience Targeting"
        subtitle={`Define high-level business objectives, desired format ratios, and buyer personas for ${brandName} marketing strategy.`}
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleManualSave}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-primary hover:opacity-90 active:scale-95 transition-all shadow-md shadow-sm"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveStatus === 'saving' ? 'Syncing...' : 'Save Goals & Strategy'}</span>
            </button>
          </div>
        }
      />

      {/* Main 2-Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bento Card 1: Marketing Goals & Format Distribution */}
        <SpotlightCard className="p-6 sm:p-7 space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-white/10">
              <h3 className="text-base font-bold text-text dark:text-rose-100 flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                Core Marketing Objective
              </h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/60 text-primary border border-primary dark:border-primary/60 shadow-xs">
                Real-Time Input
              </span>
            </div>

            {/* Primary Campaign Goal */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-text-secondary dark:text-text-muted">
                  Primary Campaign Goal
                </label>
                <span className="text-[10px] font-semibold text-text-muted dark:text-rose-300/60">
                  {primaryGoal.length}/140 chars
                </span>
              </div>
              <input
                type="text"
                value={primaryGoal}
                maxLength={140}
                onChange={(e) => setPrimaryGoal(e.target.value)}
                placeholder="Enter custom campaign goal manually (e.g., Drive In-Store Footfall, Launch flagship machinery line, Generate B2B consultations)..."
                className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-white dark:bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary text-text dark:text-rose-50 transition-all placeholder:text-text-muted dark:placeholder:text-rose-300/40 shadow-xs"
              />

              {/* Quick Suggestion Chips */}
              <div className="pt-1.5 space-y-1.5">
                <span className="text-[10px] font-semibold text-text-muted dark:text-rose-300/70 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-warning" />
                  Quick Inspiration:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_GOAL_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => setPrimaryGoal(sug)}
                      type="button"
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-md transition-all border ${
                        primaryGoal === sug
                          ? 'bg-primary text-primary-on border-primary'
                          : 'bg-surface dark:bg-white/[0.04] text-text-secondary dark:text-text-muted border-border hover:border-primary/40'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Format Distribution Mix */}
            <div className="pt-3 border-t border-border dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-text dark:text-rose-100 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sliders className="w-3.5 h-3.5 text-primary" />
                    Content Format Distribution Mix
                  </h4>
                  <p className="text-[11px] text-text-muted dark:text-rose-300/70">
                    Controls the ratio of videos vs images generated by the AI
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                      isRatioBalanced
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-warning/10 dark:bg-warning/10 text-warning dark:text-accent border-warning/30 dark:border-warning/30'
                    }`}
                  >
                    Total: {totalRatio}%
                  </span>
                  {!isRatioBalanced && (
                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-primary/10 dark:bg-primary/60 text-primary border border-primary dark:border-primary/60 hover:opacity-90"
                    >
                      Balance to 100%
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                {PRESET_DISTRIBUTIONS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 rounded-xl text-left border border-border bg-surface dark:bg-white/[0.03] hover:border-primary/40 dark:hover:border-primary/40 transition-all text-xs"
                  >
                    <span className="text-base block mb-0.5">{preset.icon}</span>
                    <strong className="block text-[11px] font-bold text-text dark:text-rose-100 truncate">
                      {preset.name}
                    </strong>
                    <span className="text-[10px] text-text-muted dark:text-rose-300/60">
                      {preset.reels}% Reels / {preset.images}% Img / {preset.text}% Txt
                    </span>
                  </button>
                ))}
              </div>

              {/* Sliders */}
              <div className="space-y-3.5 pt-2">
                {/* Reels */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-secondary dark:text-text-muted flex items-center gap-1.5">
                      🎬 Reels & Short Videos:
                    </span>
                    <span className="font-bold text-primary bg-primary/10 dark:bg-primary/60 px-2 py-0.5 rounded-md border border-primary dark:border-primary/60">
                      {reelsRatio}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="75"
                    value={reelsRatio}
                    onChange={(e) => setReelsRatio(Number(e.target.value))}
                    className="w-full accent-primary accent-primary cursor-pointer"
                  />
                </div>

                {/* Images */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-secondary dark:text-text-muted flex items-center gap-1.5">
                      📸 High-Res Lookbook & Photography:
                    </span>
                    <span className="font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800/40">
                      {imagesRatio}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="75"
                    value={imagesRatio}
                    onChange={(e) => setImagesRatio(Number(e.target.value))}
                    className="w-full accent-purple-600 dark:accent-purple-400 cursor-pointer"
                  />
                </div>

                {/* Text / Quotes */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-text-secondary dark:text-text-muted flex items-center gap-1.5">
                      ✍️ Community Notes & Industry Quotes:
                    </span>
                    <span className="font-bold text-warning dark:text-accent bg-warning/10 dark:bg-warning/10 px-2 py-0.5 rounded-md border border-warning/30 dark:border-warning/30">
                      {textRatio}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={textRatio}
                    onChange={(e) => setTextRatio(Number(e.target.value))}
                    className="w-full accent-amber-600 dark:accent-amber-400 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Output Projection Card */}
          <div className="p-3.5 rounded-xl bg-primary/10 dark:bg-primary/40 border border-primary/80 dark:border-primary/50 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <strong className="font-bold text-text dark:text-rose-100 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-primary" />
                Live 7-Day Content Plan Projection:
              </strong>
              <span className="text-[10px] font-semibold text-primary">
                7 Posts / Week
              </span>
            </div>
            <p className="text-[11px] text-text-secondary dark:text-text-muted">
              Generating ~<strong>{weeklyProjection.reelsCount} Video Reels</strong>, ~<strong>{weeklyProjection.imgsCount} Photo Showcases</strong>, ~<strong>{weeklyProjection.carsCount} Multi-Slide Carousel</strong>, and ~<strong>{weeklyProjection.txtCount} Community Text Update</strong>.
            </p>
          </div>
        </SpotlightCard>

        {/* Bento Card 2: Buyer Personas */}
        <SpotlightCard className="p-6 sm:p-7 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border dark:border-white/10">
              <div>
                <h3 className="text-base font-bold text-text dark:text-rose-100 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Core Buyer Personas
                </h3>
                <p className="text-[11px] text-text-muted dark:text-rose-300/70">
                  {activePersonasCount} of {personas.length} personas actively targeted in prompts
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAiPersonas}
                  disabled={isAiGenerating}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary text-primary-on hover:opacity-90 transition-all shadow-xs"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiGenerating ? 'animate-spin' : ''}`} />
                  <span>{isAiGenerating ? 'Synthesizing...' : 'AI Personas'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingPersona(!isAddingPersona)}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-white dark:bg-white/10 border border-border text-text-secondary dark:text-rose-100 hover:bg-surface-selected dark:hover:bg-white/15 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Inline Add Persona Form */}
            {isAddingPersona && (
              <form onSubmit={handleAddPersona} className="p-4 rounded-xl border border-primary/30 dark:border-primary/40 bg-surface dark:bg-white/[0.04] space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-xs font-bold text-text dark:text-rose-100">
                    Add New Buyer Persona
                  </strong>
                  <button
                    type="button"
                    onClick={() => setIsAddingPersona(false)}
                    className="text-xs text-text-muted hover:text-text-secondary"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  value={newPersonaTitle}
                  onChange={(e) => setNewPersonaTitle(e.target.value)}
                  placeholder="Persona Title (e.g., Plant Operations Managers & Industrial Buyers 35-55)"
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-surface border border-border text-text dark:text-rose-50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <textarea
                  value={newPersonaDesc}
                  rows={2}
                  onChange={(e) => setNewPersonaDesc(e.target.value)}
                  placeholder="What are their pain points, key motivations, and buying criteria?..."
                  className="w-full px-3 py-2 rounded-lg text-xs bg-white dark:bg-surface border border-border text-text dark:text-rose-50 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-primary hover:opacity-90 transition-all"
                  >
                    Add Persona to AI Targeting
                  </button>
                </div>
              </form>
            )}

            {/* Persona List */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {personas.map((p, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition-all ${
                    p.active
                      ? 'border-border bg-white/90 dark:bg-white/[0.04] shadow-xs'
                      : 'border-dashed border-border bg-surface-selected/50 dark:bg-white/[0.01] opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        checked={Boolean(p.active)}
                        onChange={() => togglePersona(idx)}
                        className="mt-0.5 rounded text-primary focus:ring-primary cursor-pointer"
                        title={p.active ? 'Exclude from AI prompt' : 'Include in AI prompt'}
                      />
                      <div>
                        <h4 className="text-xs font-bold text-text dark:text-rose-100 flex items-center gap-1.5">
                          {p.title}
                        </h4>
                        <p className="text-xs text-text-muted dark:text-text-muted leading-relaxed mt-1">
                          {p.desc}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          p.active
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-surface-selected dark:bg-white/10 text-text-muted dark:text-text-muted border-border'
                        }`}
                      >
                        {p.active ? 'Active' : 'Muted'}
                      </span>
                      <button
                        type="button"
                        onClick={() => deletePersona(idx)}
                        className="p-1 rounded-md text-text-muted hover:text-rose-600 transition-colors"
                        title="Delete persona"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Strategy Sync Notice */}
          <div className="p-3.5 rounded-xl bg-primary/10 dark:bg-primary/40 border border-primary/80 dark:border-primary/50 text-xs text-text-secondary dark:text-rose-100 flex items-start gap-2.5">
            <Lightbulb className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Real-Time AI Injection:</strong> Active personas and primary campaign objectives are seamlessly synthesized into every upcoming post hook, media generation brief, and hashtag strategy for <strong>{brandName}</strong>.
            </p>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}

// Industry-aware persona generator
function generateTailoredPersonas(brandName = 'Your Brand', industry = 'Retail', audience = '') {
  const ind = (industry || '').toLowerCase();

  if (ind.includes('manufactur') || ind.includes('machin') || ind.includes('industr')) {
    return [
      {
        title: 'Procurement Directors & Industrial Operations Managers (35–55)',
        desc: 'Seeking high-uptime heavy machinery, ISO-certified reliability, reduced maintenance cycles, and verified warranty support.',
        active: true
      },
      {
        title: 'Automation & Precision Plant Engineers (28–48)',
        desc: 'Evaluating technical blueprints, automated factory assembly integration, operator safety standards, and energy efficiency metrics.',
        active: true
      },
      {
        title: 'Enterprise Infrastructure & Factory Executives (40–60)',
        desc: 'Assessing high-capital equipment ROI, scalable production capacity, direct factory consultation, and supply-chain resilience.',
        active: true
      }
    ];
  }

  if (ind.includes('fashion') || ind.includes('apparel') || ind.includes('cloth') || ind.includes('boutique')) {
    return [
      {
        title: 'Contemporary Trendsetters & Capsule Wardrobe Curators (22–38)',
        desc: 'Looking for versatile statement pieces, premium fabric textures, seamless fit, and effortless day-to-night styling tips.',
        active: true
      },
      {
        title: 'Sustainable Shoppers & Mindful Consumers (25–45)',
        desc: 'Prioritizing ethical manufacturing origin stories, durable timeless garments, fair-trade certifications, and low-waste design.',
        active: true
      },
      {
        title: 'Occasion & Event Look Seekers (24–50)',
        desc: 'Focused on eye-catching launch collections, weekend gatherings, boutique exclusives, and personalized alteration services.',
        active: true
      }
    ];
  }

  if (ind.includes('coffee') || ind.includes('caf') || ind.includes('food') || ind.includes('restaur') || ind.includes('bakery')) {
    return [
      {
        title: 'Artisan Roast Enthusiasts & Remote Creators (22–35)',
        desc: 'Looking for single-origin brews, quiet morning workspaces, seasonal bean profiles, and specialty barista craft.',
        active: true
      },
      {
        title: 'Weekend Brunchers & Foodie Gatherers (20–42)',
        desc: 'Focused on aesthetic plating, matcha specialties, outdoor community seating, and vibrant café atmosphere.',
        active: true
      },
      {
        title: 'Home Baristas & Whole-Bean Retail Buyers (25–52)',
        desc: 'Seeking whole-bean retail bags, origin transparency, reusable merchandise, and home brewing equipment.',
        active: true
      }
    ];
  }

  if (ind.includes('tech') || ind.includes('saas') || ind.includes('software') || ind.includes('ai')) {
    return [
      {
        title: 'Growth Marketing Operators & Digital Agency Leads (26–42)',
        desc: 'Seeking automated content scale, verifiable ROI metrics, automated scheduling pipelines, and cutting-edge generative AI.',
        active: true
      },
      {
        title: 'Founders & Solopreneurs (24–45)',
        desc: 'Focused on 10x workflow efficiency, hands-free social distribution, professional brand voice cohesion, and zero technical overhead.',
        active: true
      },
      {
        title: 'Corporate Brand Managers & Marketing Directors (32–54)',
        desc: 'Prioritizing enterprise security compliance, multi-channel orchestration, team governance, and consistent multi-format outputs.',
        active: true
      }
    ];
  }

  // Universal Fallback tailored to the brand
  return [
    {
      title: `Core Value Seekers & Discerning Buyers (25–45)`,
      desc: `Evaluating ${brandName} for superior quality, prompt responsiveness, and proven results in ${industry || 'the market'}.`,
      active: true
    },
    {
      title: `Loyal Brand Champions & Community Advocates (22–50)`,
      desc: `Engaged with authentic storytelling, transparent behind-the-scenes craft, and innovative offerings from ${brandName}.`,
      active: true
    },
    {
      title: `Decision Makers & High-Intent Customers (30–55)`,
      desc: `Focusing on long-term satisfaction, reliability, direct consultation, and trusted recommendations.`,
      active: true
    }
  ];
}

export default ContentGoalsView;
