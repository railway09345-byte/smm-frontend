import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Zap,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  BarChart3,
  ShieldCheck,
  Cpu,
  Share2,
  Sliders,
  Check,
  Building2,
  RefreshCw,
  Video,
  FileText,
  Target,
  Flame,
  Globe,
  Lock
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';
import { useTheme } from '../contexts/ThemeContext';
import AuroraBackground from '../components/ui/AuroraBackground';
import SpotlightCard from '../components/ui/SpotlightCard';
import BorderBeam from '../components/ui/BorderBeam';
import MagneticButton from '../components/ui/MagneticButton';
import ShinyText from '../components/ui/ShinyText';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import { slideUpVariants, staggerContainerVariants, staggerItemVariants } from '../utils/motionVariants';

const FEATURE_PILLARS = [
  {
    id: 'ai-core',
    icon: Sparkles,
    badge: 'Core Intelligence',
    title: 'Autonomous Strategy & Gemini AI Core',
    description: 'Zero manual prompt writing required. Gemini AI inspects your brand identity, models historical audience resonance, discovers high-performing topics, and synthesizes channel-tailored copy.',
    metrics: [
      { label: 'Brand Voice Match', value: 99.2, suffix: '%' },
      { label: 'Autonomous Batches', value: 30, suffix: '/mo' },
      { label: 'Generation Speed', value: 3.2, suffix: 's' }
    ],
    capabilities: [
      'Multi-angle creative ideation tailored to industry verticals',
      'Strict brand persona, tone, and guardrail enforcement',
      'Dynamic hashtag generation with reach optimization',
      'Automatic multi-network variant rewriting (IG, FB & YouTube)'
    ]
  },
  {
    id: 'media-studio',
    icon: Video,
    badge: 'Creative Engine',
    title: 'Multi-Ratio Media & Reel Synthesizer',
    description: 'Generate high-impact visual assets and video reels formatted specifically for each platform’s native requirements without external design software.',
    metrics: [
      { label: 'Aspect Ratios', value: 3, suffix: ' Formats' },
      { label: 'Visual Quality', value: 96.8, suffix: '%' },
      { label: 'Export Resolution', value: 4, suffix: 'K UHD' }
    ],
    capabilities: [
      '1:1 Square feeds for Instagram & Facebook feeds',
      '9:16 Vertical Reels, YouTube Shorts & Stories',
      '16:9 Landscape banners and carousel presentations',
      'Automatic brand logo watermark & typography overlay'
    ]
  },
  {
    id: 'scheduler',
    icon: Clock,
    badge: 'Automation Infrastructure',
    title: 'Dual Engine APScheduler & Smart Dispatch',
    description: 'Enterprise scheduler engine tracks follower peak engagement hours and automates publishing across all connected channels with zero manual intervention.',
    metrics: [
      { label: 'Connected Networks', value: 6, suffix: '+' },
      { label: 'Uptime Reliability', value: 99.9, suffix: '%' },
      { label: 'Timezone Precision', value: 100, suffix: '%' }
    ],
    capabilities: [
      'Distributed APScheduler worker engine with leader election',
      'Multi-timezone synchronization (IST, UTC, EST, PST, GST, SGT)',
      'Intelligent peak-resonance scheduling algorithms',
      'Automated transient error recovery & platform publishing retry'
    ]
  },
  {
    id: 'governance',
    icon: ShieldCheck,
    badge: 'Quality & Governance',
    title: 'Human-in-the-Loop Approval Queue',
    description: 'Maintain complete editorial control over all autonomous content. Automated quality audits check character limits, brand tone, and compliance before any post goes live.',
    metrics: [
      { label: 'Audit Checkpoints', value: 12, suffix: ' Points' },
      { label: 'Approval Speed', value: 1, suffix: '-Click' },
      { label: 'Safety Passed', value: 100, suffix: '%' }
    ],
    capabilities: [
      'Pre-publishing AI Quality Score evaluation (0 - 100%)',
      'Inline copy and hashtag editor with instant live preview',
      'Configurable auto-approve vs manual approval workflows',
      'Rejection feedback loop that trains future daily batches'
    ]
  },
  {
    id: 'multi-tenant',
    icon: Building2,
    badge: 'Enterprise Architecture',
    title: 'Multi-Tenant Workspace & Brand Kits',
    description: 'Manage multiple stores, portfolio brands, or client organizations from a single high-security portal with isolated data, custom brand kits, and role-based permissions.',
    metrics: [
      { label: 'Tenant Isolation', value: 100, suffix: '%' },
      { label: 'Workspace Switch', value: 0.1, suffix: 's' },
      { label: 'Data Security', value: 256, suffix: '-bit' }
    ],
    capabilities: [
      'Isolated brand voice profiles, color palettes, and logo libraries',
      'Granular role-based access control (SuperAdmin, Admin, Creator)',
      'Multi-business quick-switcher in global dashboard navigation',
      'Unified enterprise billing and subscription seat management'
    ]
  },
  {
    id: 'analytics',
    icon: BarChart3,
    badge: 'Continuous Optimization',
    title: 'Peak Resonance Radar & Continuous Learning',
    description: 'Close the loop between content creation and performance. Our neural resonance engine analyzes published post analytics to refine future creative generation.',
    metrics: [
      { label: 'Optimization Lift', value: 18.4, suffix: '%' },
      { label: 'Telemetry Signals', value: 24, suffix: ' KPIs' },
      { label: 'Adaptive Learning', value: 24, suffix: '/7 Loop' }
    ],
    capabilities: [
      'Hourly resonance modeling across connected social accounts',
      'Channel performance comparisons and engagement benchmarking',
      'Automated suggestions for high-performing topics and formats',
      'Exportable CSV and PDF performance reports for stakeholders'
    ]
  }
];

const COMPARISON_ROWS = [
  {
    capability: 'Content Ideation & Scripting',
    socialAi: 'Fully Autonomous (Gemini 2.5 Engine)',
    traditional: 'Manual writing or prompt copy-pasting',
    agency: 'Manual copywriter drafts (days)'
  },
  {
    capability: 'Multi-Ratio Media Generation',
    socialAi: 'Native 1:1, 9:16 & 16:9 synthesis',
    traditional: 'Requires Canva / Photoshop / Figma',
    agency: 'Separate graphic designer retainer'
  },
  {
    capability: 'Peak Hour Audience Dispatch',
    socialAi: 'Dynamic algorithmic scheduling',
    traditional: 'Static user-selected calendar slots',
    agency: 'Manual scheduling by account manager'
  },
  {
    capability: 'Quality & Brand Voice Audit',
    socialAi: 'Automated 12-point AI score check',
    traditional: 'No built-in voice compliance audit',
    agency: 'Manual proofreading rounds'
  },
  {
    capability: 'Multi-Brand Tenant Isolation',
    socialAi: 'Enterprise workspace architecture',
    traditional: 'Add-on pricing per extra workspace',
    agency: 'Fragmented spreadsheets & files'
  },
  {
    capability: 'Monthly Cost (Single Brand)',
    socialAi: 'From $29/mo flat (Predictable)',
    traditional: '$50 - $120/mo + design software',
    agency: '$1,500 - $4,000/mo retainer'
  }
];

export function FeaturesPage() {
  const { user, hasCompletedBrandSetup } = useAuth();
  const { brandProfile } = useContent() || {};
  const { isDark } = useTheme();

  const [activePillar, setActivePillar] = useState('ai-core');

  const isCustomized = user?.id ? (localStorage.getItem(`sacp_brand_customized_${user.id}`) === 'true') : false;
  const hasUserConfiguredBrand = Boolean(
    isCustomized &&
    hasCompletedBrandSetup &&
    brandProfile?.name &&
    !brandProfile.name.toLowerCase().includes('zenith') &&
    brandProfile.name !== 'Social AI' &&
    brandProfile.name !== 'Aminoid AI'
  );

  const brandName = hasUserConfiguredBrand ? brandProfile.name : 'Aminoid AI';
  const selectedPillar = FEATURE_PILLARS.find(p => p.id === activePillar) || FEATURE_PILLARS[0];

  return (
    <div className="relative min-h-screen bg-bg text-text font-sans selection:bg-primary/10 selection:text-primary flex flex-col transition-colors duration-200">
      {/* Subtle Ambient Tech Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[60vw] h-[400px] rounded-full bg-gradient-to-b from-primary/12 via-accent/8 to-transparent blur-[140px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-16">
          {/* ================= HERO HEADER ================= */}
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-3xl mx-auto space-y-4"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-soft text-on-primary-soft border border-border">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Enterprise Feature Suite</span>
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-text leading-[1.1]">
              Complete Autonomy for High-Growth Social Media
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed max-w-2xl mx-auto font-normal">
              Inspect the comprehensive intelligence architecture powering brand-aligned creative synthesis, multi-ratio video reels, precision audience scheduling, and multi-tenant brand governance.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <Link to="/onboarding">
                <button
                  type="button"
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/20 border border-transparent cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <Zap className="w-4 h-4 text-primary-on" />
                  <span>Start Setup Wizard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/pricing">
                <button
                  type="button"
                  className="flex items-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-text bg-surface border border-border hover:bg-surface-selected active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <Bot className="w-4 h-4 text-primary" />
                  <span>View Membership Plans</span>
                </button>
              </Link>
            </div>
          </motion.div>

          {/* ================= 6 CORE PILLARS BENTO GRID ================= */}
          <section className="space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Architecture Pillars
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
                Six Intelligent Engines in One Seamless Platform
              </h2>
            </div>

            <motion.div
              variants={staggerContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-20px' }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {FEATURE_PILLARS.map((pillar) => {
                const Icon = pillar.icon;
                return (
                  <motion.div key={pillar.id} variants={staggerItemVariants} className="flex">
                    <div className="p-6 sm:p-7 flex flex-col justify-between w-full rounded-2xl border border-border bg-surface shadow-xs hover:border-primary/40 transition-all">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="w-11 h-11 rounded-xl bg-primary-soft text-on-primary-soft border border-border flex items-center justify-center font-bold">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface-raised text-text-secondary border border-border">
                            {pillar.badge}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-text">
                            {pillar.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed font-normal">
                            {pillar.description}
                          </p>
                        </div>

                        {/* Telemetry stats ticker */}
                        <div className="grid grid-cols-3 gap-2 py-3 border-y border-border text-center">
                          {pillar.metrics.map((m, mIdx) => (
                            <div key={mIdx}>
                              <div className="text-base font-extrabold text-primary">
                                <AnimatedCounter value={m.value} suffix={m.suffix} />
                              </div>
                              <span className="text-[10px] text-text-muted block mt-0.5 font-medium">
                                {m.label}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Bullet Capabilities */}
                        <ul className="space-y-2 text-xs text-text-secondary font-medium">
                          {pillar.capabilities.map((cap, cIdx) => (
                            <li key={cIdx} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                              <span className="leading-snug">{cap}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </section>

          {/* ================= PLATFORM SHOWCASE WORKFLOW ================= */}
          <section className="space-y-8">
            <div className="p-8 sm:p-10 border border-border rounded-2xl bg-surface shadow-sm relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    End-to-End Execution
                  </span>
                  <h3 className="text-2xl font-extrabold text-text mt-1">
                    How Autonomous Content Moves Across Channels
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <span className="text-xs font-semibold text-success">
                    Active Orchestration Engine
                  </span>
                </div>
              </div>

              {/* 4-Step Interactive Flow */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                  <div className="text-xs font-bold text-primary">STAGE 01</div>
                  <h4 className="font-bold text-text text-sm">Persona Ingestion</h4>
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">
                    Brand profile captures your industry, target demographic, unique value propositions, and preferred aesthetic rules.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                  <div className="text-xs font-bold text-primary">STAGE 02</div>
                  <h4 className="font-bold text-text text-sm">Creative Synthesis</h4>
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">
                    Gemini AI discovers seasonal trends and synthesizes high-converting copy paired with multi-aspect visual assets.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                  <div className="text-xs font-bold text-primary">STAGE 03</div>
                  <h4 className="font-bold text-text text-sm">Quality Audit & Review</h4>
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">
                    Content passes through safety guardrails and lands in your queue for one-click approval or tailored editing.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-surface-raised border border-border space-y-2">
                  <div className="text-xs font-bold text-primary">STAGE 04</div>
                  <h4 className="font-bold text-text text-sm">Precision Dispatch</h4>
                  <p className="text-xs text-text-secondary leading-relaxed font-normal">
                    APScheduler dispatches variants automatically during follower peak resonance slots with real-time status tracking.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ================= COMPETITIVE MATRIX ================= */}
          <section className="space-y-6">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Industry Comparison
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
                Why Enterprises Switch to Autonomous Social AI
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-raised text-primary font-bold border-b border-border">
                  <tr>
                    <th className="py-3.5 px-5">Platform Capability</th>
                    <th className="py-3.5 px-5 bg-primary-soft text-on-primary-soft font-bold">
                      Aminoid AI (This Platform)
                    </th>
                    <th className="py-3.5 px-5 text-text-secondary">Traditional Schedulers</th>
                    <th className="py-3.5 px-5 text-text-secondary">Creative Agency Retainers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {COMPARISON_ROWS.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-surface-selected transition-colors">
                      <td className="py-3.5 px-5 font-bold text-text">
                        {row.capability}
                      </td>
                      <td className="py-3.5 px-5 bg-primary-soft/40 font-bold text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="w-4 h-4 text-success shrink-0" />
                          <span>{row.socialAi}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-text-muted">
                        {row.traditional}
                      </td>
                      <td className="py-3.5 px-5 text-text-muted">
                        {row.agency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= FINAL CTA BANNER ================= */}
          <div className="p-8 sm:p-12 text-center space-y-6 rounded-3xl border border-border bg-surface shadow-lg">
            <div className="max-w-2xl mx-auto space-y-3">
              <span className="text-xs uppercase font-bold tracking-widest text-primary">
                Ready to Automate Your Brand?
              </span>
              <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-text">
                Launch Your Autonomous Social Studio in 5 Minutes
              </h3>
              <p className="text-sm text-text-secondary leading-relaxed font-normal">
                Configure your brand guidelines once. Enjoy daily synthesized batches, human-in-the-loop approvals, and precision multi-channel publishing.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link to="/onboarding">
                <button
                  type="button"
                  className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <span>Start Brand Setup</span>
                  <ArrowRight className="w-4 h-4 inline-block ml-1.5" />
                </button>
              </Link>
              <Link to="/pricing">
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-text bg-surface-raised border border-border hover:bg-surface-selected active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <span>Explore Pricing Plans</span>
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default FeaturesPage;
