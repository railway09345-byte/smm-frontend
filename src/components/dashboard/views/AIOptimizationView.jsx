import React, { useState } from 'react';
import {
  Sparkles,
  Zap,
  FlaskConical,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  Tag,
  Scissors,
  Check
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { useContent } from '../../../contexts/ContentContext';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

export function AIOptimizationView() {
  const { showToast } = useToast();
  const { brandProfile } = useContent();
  const brandName = brandProfile?.name || 'Your Brand';
  const industry = brandProfile?.industry || 'Modern Lifestyle';
  const tagline = brandProfile?.tagline || 'Excellence in service and design';

  const [activeHookTest, setActiveHookTest] = useState('launch');
  const [applied, setApplied] = useState(false);

  const handleApplyRecommendations = () => {
    setApplied(true);
    showToast('AI optimizations applied to upcoming Daily Planner batches!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="REVIEW, PUBLISH & OPTIMIZE" badgeIcon={Sparkles}
        title="AI Optimization & A/B Engine" subtitle={`Simulate copy performance, test opening hooks, and apply algorithmic engagement boosters tailored to ${brandName}.`}
        actions={
          <button
            onClick={handleApplyRecommendations}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
              applied
                ? 'bg-primary-soft text-primary border border-border' : 'bg-primary hover:bg-primary text-primary-on' }`}
          >
            {applied ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {applied ? 'Recommendations Active' : 'Apply AI Recommendations'}
          </button>
        }
      />

      {/* Grid: A/B Testing & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* A/B Hook Predictor */}
        <SpotlightCard className="p-6 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-text dark:text-rose-100 flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-primary" />
                  A/B Hook Performance Predictor
                </h3>
                <p className="text-xs text-text-muted dark:text-text-muted">Real-time engagement simulation before scheduling</p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 dark:bg-primary/60 text-primary border border-primary dark:border-primary/60 shadow-xs">
                Predictive AI
              </span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary dark:text-text-muted">Select Test Concept</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-surface text-xs font-medium text-text dark:text-rose-100 focus:outline-none focus:ring-2 focus:ring-primary"
                value={activeHookTest}
                onChange={(e) => setActiveHookTest(e.target.value)}
              >
                <option value="launch" className="bg-white dark:bg-surface text-text dark:text-rose-100">Flagship Launch Spotlight ({industry})</option>
                <option value="problem" className="bg-white dark:bg-surface text-text dark:text-rose-100">Problem-Solver & Value Hook</option>
                <option value="story" className="bg-white dark:bg-surface text-text dark:text-rose-100">Behind-the-Scenes Mission & Craft</option>
              </select>
            </div>

            <div className="space-y-3">
              {/* Variant A */}
              {/* Variant A */}
              <div className="p-4 rounded-xl bg-surface dark:bg-white/[0.04] border border-border space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200/70 dark:bg-white/10 text-text-secondary dark:text-text-muted border border-border dark:border-white/10">
                    Variant A (Feature-Led)
                  </span>
                  <span className="text-xs font-bold text-text-muted dark:text-rose-300/70">Predicted CTR: 4.2%</span>
                </div>
                <p className="text-xs font-medium text-text dark:text-rose-100 italic leading-relaxed">
                  {activeHookTest === 'launch' ? `"Explore the newest arrival from ${brandName} — designed to redefine ${industry}."` : activeHookTest === 'problem' ? `"Upgrade your everyday standards with ${brandName}. Discover why customers switch."` : `"Craftsmanship meets purpose: see how ${brandName} brings ideas to life."`}
                </p>
              </div>

              {/* Variant B (Winner) */}
              <div className="p-4 rounded-xl bg-bg dark:bg-primary/40 border border-border/60 dark:border-primary/50 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-success/10 text-success border border-success/30">
                    Variant B (Winner: Transformation)
                  </span>
                  <span className="text-xs font-bold text-success flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Predicted CTR: 7.9% (+88%)
                  </span>
                </div>
                <p className="text-xs font-bold text-text italic leading-relaxed">
                  {activeHookTest === 'launch' ? `"Ready for a standout upgrade? Meet the latest drop from ${brandName} built for lasting impact."` : activeHookTest === 'problem' ? `"Stop settling for ordinary results. Here is how ${brandName} delivers the difference you've been looking for."` : `"${tagline || 'Built with care and passion'}: Inside the story behind ${brandName}."`}
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-on font-bold text-xs hover:brightness-105 transition-all shadow-md shadow-primary/20 cursor-pointer"
              onClick={() => showToast('Variant B selected as primary generation seed!', 'success')}
            >
              <span>Use Variant B as Default Seed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </SpotlightCard>

        {/* AI Recommendations Feed */}
        <SpotlightCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-warning" />
                <span>Algorithmic Action Feed</span>
              </h3>
              <p className="text-xs text-text-secondary">Autonomous performance suggestions from audience data</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary-soft text-primary border border-border shadow-xs">
              3 Insights
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-surface dark:bg-white/[0.04] border border-border space-y-1 shadow-xs">
              <strong className="text-xs font-bold text-text dark:text-rose-100 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-primary" />
                Friday Evening Video Posting Window
              </strong>
              <p className="text-xs text-text-secondary dark:text-text-muted leading-relaxed">
                Post reels and video showcases between <strong className="text-text dark:text-white">6:30 PM – 8:00 PM IST on Fridays</strong>. Historical telemetry shows a 42% spike in weekend footfall inquiries.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface dark:bg-white/[0.04] border border-border space-y-1 shadow-xs">
              <strong className="text-xs font-bold text-text dark:text-rose-100 flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-primary" />
                Spot Alteration Value Hook
              </strong>
              <p className="text-xs text-text-secondary dark:text-text-muted leading-relaxed">
                Highlighting <em className="text-text dark:text-rose-100 font-bold">"Custom 15-minute alterations available on spot"</em> in captions increases direct DM inquiries by +34%.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-surface dark:bg-white/[0.04] border border-border space-y-1 shadow-xs">
              <strong className="text-xs font-bold text-text dark:text-rose-100 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-primary" />
                Price Transparency Anchoring
              </strong>
              <p className="text-xs text-text-secondary dark:text-text-muted leading-relaxed">
                Always including the exact price tag (e.g. ₹1,299) directly in the thumbnail badge filters out low-intent inquiries and speeds up buying decisions.
              </p>
            </div>
          </div>
        </SpotlightCard>
      </div>
    </div>
  );
}
