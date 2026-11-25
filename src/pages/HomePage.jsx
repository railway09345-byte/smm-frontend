import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Send,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  ArrowRight,
  Share2,
  Sliders,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Eye,
  BarChart3,
  Globe,
  Lock
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useContent } from '../contexts/ContentContext';

const InstagramIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);


export function HomePage() {
  const { user, hasCompletedBrandSetup } = useAuth();
  const { brandProfile } = useContent() || {};
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'composer' | 'approvals' | 'analytics'

  const isCustomized = user?.id ? (localStorage.getItem(`sacp_brand_customized_${user.id}`) === 'true') : false;
  const hasUserConfiguredBrand = Boolean(
    isCustomized &&
    hasCompletedBrandSetup &&
    brandProfile?.name &&
    !brandProfile.name.toLowerCase().includes('zenith') &&
    brandProfile.name !== 'Social AI' &&
    brandProfile.name !== 'Aminoid AI'
  );

  const brandName = hasUserConfiguredBrand ? brandProfile.name : 'Aminoid';

  return (
    <div className="relative min-h-screen bg-bg text-text font-sans selection:bg-primary/10 selection:text-primary flex flex-col transition-colors duration-200">
      {/* Ambient Tech Glow Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[70vw] h-[450px] rounded-full bg-gradient-to-b from-primary/15 via-accent/10 to-transparent blur-[140px]" />
        <div className="absolute top-[40%] -left-[10%] w-[35vw] h-[35vw] rounded-full bg-primary/10 to-transparent blur-[120px]" />
        <div className="absolute top-[50%] -right-[10%] w-[35vw] h-[35vw] rounded-full bg-highlight/10 to-transparent blur-[120px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10">
        {/* ================= HERO SECTION ================= */}
        <section className="relative pt-12 sm:pt-16 md:pt-20 pb-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto text-center space-y-6">
            {/* Enterprise Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-soft text-on-primary-soft border border-border text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span>Multi-Channel Social Publishing Studio</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.15] text-text max-w-4xl mx-auto">
              Plan, schedule, and publish across every social channel from{' '}
              <span className="bg-gradient-to-r from-primary via-accent to-highlight bg-clip-text text-transparent">
                one unified workspace.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="max-w-2xl mx-auto text-base sm:text-lg text-text-secondary leading-relaxed font-normal">
              Empower your marketing team and brand managers with visual calendar scheduling, creative asset management, multi-tier approval workflows, and verified Meta & Google direct publishing.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <Link to="/onboarding">
                <button
                  type="button"
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/20 border border-transparent cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <span>Start Setup Wizard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>

              <Link to="/pricing">
                <button
                  type="button"
                  className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-text bg-surface border border-border hover:bg-surface-selected active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                >
                  <Eye className="w-4 h-4 text-text-muted" />
                  <span>View Membership Plans</span>
                </button>
              </Link>
            </div>

            {/* Key Trust / Metric Bar */}
            <div className="pt-8 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 text-left border-y border-border py-4 mt-6">
              <div className="px-2">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Channels</span>
                <span className="text-base font-bold text-text">Instagram, Facebook & YouTube</span>
              </div>
              <div className="px-2 border-l border-border">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Publishing</span>
                <span className="text-base font-bold text-text">Direct Meta Cloud Sync</span>
              </div>
              <div className="px-2 border-l border-border">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Governance</span>
                <span className="text-base font-bold text-text">Role-Adaptive Approvals</span>
              </div>
              <div className="px-2 border-l border-border">
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Compliance</span>
                <span className="text-base font-bold text-text">SOC2 & AES-256 Vault</span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= INTERACTIVE PLATFORM SHOWCASE ================= */}
        <section className="py-12 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="text-center space-y-2 max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-text">
                Designed for teams who take brand publishing seriously.
              </h2>
              <p className="text-sm text-text-secondary font-normal">
                No disjointed tools, no manual copy-pasting. Everything you need to orchestrate multi-channel campaigns.
              </p>
            </div>

            {/* Interactive Module Tabs */}
            <div className="flex items-center justify-center gap-1.5 p-1 bg-surface-raised rounded-2xl border border-border w-fit mx-auto max-w-full overflow-x-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'bg-primary text-primary-on shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Visual Calendar</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('composer')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'composer'
                    ? 'bg-primary text-primary-on shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Multi-Channel Composer</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('approvals')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'approvals'
                    ? 'bg-primary text-primary-on shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approval Queue</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'analytics'
                    ? 'bg-primary text-primary-on shadow-xs font-bold'
                    : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Engagement Analytics</span>
              </button>
            </div>

            {/* Showcase Viewport */}
            <div className="rounded-3xl border border-border bg-surface shadow-xl overflow-hidden transition-all text-left">
              {/* Window Header */}
              <div className="px-5 py-3.5 border-b border-border bg-surface-raised flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-error/70 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-warning/70 inline-block" />
                  <span className="w-3 h-3 rounded-full bg-success/70 inline-block" />
                  <span className="ml-2 text-xs font-semibold text-text-secondary hidden sm:inline">
                    aminoid.workspace / {activeTab === 'calendar' ? 'content-calendar' : activeTab === 'composer' ? 'post-composer' : activeTab === 'approvals' ? 'review-queue' : 'growth-insights'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping inline-block" />
                    Channel Sync: Connected
                  </span>
                </div>
              </div>

              {/* View 1: Visual Calendar */}
              {activeTab === 'calendar' && (
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-text">Weekly Content Schedule</h3>
                      <p className="text-xs text-text-secondary">4 scheduled dispatches queued across Instagram, YouTube, and Facebook.</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-surface-raised border border-border text-text">
                      November 17 – 23, 2026
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Schedule Card 1 */}
                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-soft text-primary text-[11px] font-bold">
                          <InstagramIcon className="w-3 h-3" />
                          <span>Instagram</span>
                        </span>
                        <span className="text-[11px] text-text-muted font-medium">Today • 16:15</span>
                      </div>
                      <div className="h-28 rounded-xl bg-gradient-to-tr from-primary/10 via-accent/10 to-highlight/10 border border-border flex items-center justify-center text-text-muted">
                        <ImageIcon className="w-8 h-8 opacity-60" />
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-text block truncate">Elevating Everyday Lifestyle</strong>
                        <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">Explore our handcrafted retail drop built for architectural spaces.</p>
                      </div>
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-success font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                        <span className="text-text-muted">Meta Queued</span>
                      </div>
                    </div>

                    {/* Schedule Card 2 */}
                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-error/10 text-error text-[11px] font-bold">
                          <YoutubeIcon className="w-3 h-3" />
                          <span>YouTube Shorts</span>
                        </span>
                        <span className="text-[11px] text-text-muted font-medium">Tomorrow • 11:30</span>
                      </div>
                      <div className="h-28 rounded-xl bg-gradient-to-br from-error/10 to-accent/10 border border-border flex items-center justify-center text-text-muted">
                        <span className="text-xs font-bold">Shorts 9:16 HD</span>
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-text block truncate">Design Process & Craft Story</strong>
                        <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">Behind the scenes at our creative workshop crafting the new series.</p>
                      </div>
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-success font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                        <span className="text-text-muted">High Resonance</span>
                      </div>
                    </div>

                    {/* Schedule Card 3 */}
                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-info/10 text-info text-[11px] font-bold">
                          <FacebookIcon className="w-3 h-3" />
                          <span>Facebook Page</span>
                        </span>
                        <span className="text-[11px] text-text-muted font-medium">Wed • 14:00</span>
                      </div>
                      <div className="h-28 rounded-xl bg-gradient-to-tr from-info/10 to-primary/10 border border-border flex items-center justify-center text-text-muted">
                        <span className="text-xs font-bold">Carousel 1:1</span>
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-text block truncate">Community Story & Spotlight</strong>
                        <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">Meet the creators living with our functional collection.</p>
                      </div>
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-warning font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Review
                        </span>
                        <span className="text-text-muted">Editorial Queue</span>
                      </div>
                    </div>

                    {/* Schedule Card 4 */}
                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-error/10 text-error text-[11px] font-bold">
                          <YoutubeIcon className="w-3 h-3" />
                          <span>YouTube Shorts</span>
                        </span>
                        <span className="text-[11px] text-text-muted font-medium">Thu • 18:45</span>
                      </div>
                      <div className="h-28 rounded-xl bg-gradient-to-bl from-accent/10 to-highlight/10 border border-border flex items-center justify-center text-text-muted">
                        <span className="text-xs font-bold">Shorts 9:16 Vertical</span>
                      </div>
                      <div>
                        <strong className="text-xs font-bold text-text block truncate">Interior Styling Moodboard</strong>
                        <p className="text-[11px] text-text-secondary line-clamp-2 mt-0.5">Curated architectural aesthetics for modern workspaces.</p>
                      </div>
                      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px]">
                        <span className="text-success font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Approved
                        </span>
                        <span className="text-text-muted">Board Queued</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 2: Multi-Channel Composer */}
              {activeTab === 'composer' && (
                <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-7 space-y-4">
                    <h3 className="text-lg font-bold text-text">Single Post, Tailored Formats</h3>
                    <p className="text-xs text-text-secondary">Draft your concept once. Aminoid automatically refines aspect ratios, caption lengths, and hashtags for each destination.</p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-bold text-text block mb-1">Post Headline</label>
                        <div className="p-2.5 rounded-xl border border-border bg-surface-raised text-xs font-medium text-text">
                          Elevating Everyday Essentials: The Craft Behind {brandName}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-text block mb-1">Caption & Copy Directive</label>
                        <div className="p-3 rounded-xl border border-border bg-surface-raised text-xs text-text-secondary leading-relaxed">
                          "Stop settling for ordinary items that wear out in weeks. Designed for longevity, our latest drop brings architectural minimalism straight to your daily ritual."
                        </div>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {['#ModernDesign', '#ArchitecturalSpace', '#CuratedLiving', '#SustainableLiving'].map((tag) => (
                          <span key={tag} className="px-2.5 py-1 rounded-lg bg-surface border border-border text-[11px] font-semibold text-primary">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-4 rounded-2xl border border-border bg-surface-raised space-y-3">
                    <span className="text-xs font-bold text-text block">Live Format Adaptations</span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border">
                        <span className="flex items-center gap-2 font-semibold text-text">
                          <InstagramIcon className="w-4 h-4 text-primary" />
                          Instagram Reel (9:16)
                        </span>
                        <span className="text-success font-semibold">Ready</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border">
                        <span className="flex items-center gap-2 font-semibold text-text">
                          <FacebookIcon className="w-4 h-4 text-info" />
                          Facebook Feed (1:1)
                        </span>
                        <span className="text-success font-semibold">Ready</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border">
                        <span className="flex items-center gap-2 font-semibold text-text">
                          <YoutubeIcon className="w-4 h-4 text-error" />
                          YouTube Community (16:9)
                        </span>
                        <span className="text-success font-semibold">Ready</span>
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface border border-border">
                        <span className="flex items-center gap-2 font-semibold text-text">
                          <YoutubeIcon className="w-4 h-4 text-error" />
                          YouTube Shorts (9:16)
                        </span>
                        <span className="text-success font-semibold">Ready</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* View 3: Approval Queue */}
              {activeTab === 'approvals' && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-text">Team Editorial & Approval Gates</h3>
                      <p className="text-xs text-text-secondary">Keep strict governance over your brand reputation before posts go live.</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary-soft text-primary border border-border">
                      3 Items Awaiting Review
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {[
                      { channel: 'Instagram', time: 'Today, 16:15', title: 'Sustainable Ceramic Architecture Drop', author: 'Design Lead' },
                      { channel: 'YouTube', time: 'Tomorrow, 11:30', title: 'Behind The Scenes: Studio Walkthrough', author: 'Video Producer' },
                      { channel: 'Facebook', time: 'Wednesday, 14:00', title: 'Customer Spotlight: Tokyo Flagship', author: 'Marketing Associate' }
                    ].map((item, idx) => (
                      <div key={idx} className="p-3.5 rounded-2xl border border-border bg-surface-raised flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold text-xs">
                            {item.channel[0]}
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-text block">{item.title}</strong>
                            <span className="text-[11px] text-text-muted">Drafted by {item.author} • Scheduled {item.time}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button type="button" className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface border border-border text-text hover:bg-surface-selected transition">
                            Inspect
                          </button>
                          <button type="button" className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-primary text-primary-on hover:brightness-105 transition shadow-2xs">
                            Approve to Queue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* View 4: Analytics & Resonance */}
              {activeTab === 'analytics' && (
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-text">Audience Resonance & Publishing Windows</h3>
                      <p className="text-xs text-text-secondary">Track engagement velocity, impressions, and best times to publish based on past post performance.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-1">
                      <span className="text-xs font-semibold text-text-muted">Monthly Reach</span>
                      <div className="text-2xl font-black text-text">128,400+</div>
                      <span className="text-[11px] text-success font-semibold">↑ 24% vs last month</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-1">
                      <span className="text-xs font-semibold text-text-muted">Average Engagement Rate</span>
                      <div className="text-2xl font-black text-text">6.8%</div>
                      <span className="text-[11px] text-success font-semibold">↑ 1.8% industry benchmark</span>
                    </div>

                    <div className="p-4 rounded-2xl border border-border bg-surface-raised space-y-1">
                      <span className="text-xs font-semibold text-text-muted">Optimal Publishing Window</span>
                      <div className="text-2xl font-black text-primary">16:15 IST</div>
                      <span className="text-[11px] text-text-muted font-medium">Instagram & Facebook Peak</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= 4 CORE PLATFORM PILLARS ================= */}
        <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20 border-t border-border bg-surface">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Platform Architecture
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text">
                Everything required to scale multi-channel output
              </h2>
              <p className="text-sm text-text-secondary max-w-lg mx-auto font-normal">
                Four core operational pillars built for consistency, compliance, and effortless team collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="p-6 rounded-2xl border border-border bg-surface-raised flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary border border-border flex items-center justify-center font-bold mb-4">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text text-base mb-2">Visual Content Calendar</h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                    Plan campaigns weeks ahead across Instagram, Facebook, and YouTube on a unified interactive calendar.
                  </p>
                </div>
                <div className="pt-4 border-t border-border mt-4 flex items-center text-xs font-semibold text-primary gap-1">
                  <span>Interactive scheduling</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-6 rounded-2xl border border-border bg-surface-raised flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-accent-soft text-accent border border-border flex items-center justify-center font-bold mb-4">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text text-base mb-2">Brand Identity & Assets</h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                    Store and synchronize your brand colors, fonts, logo watermarks, and media vault to guarantee 100% brand consistency.
                  </p>
                </div>
                <div className="pt-4 border-t border-border mt-4 flex items-center text-xs font-semibold text-accent gap-1">
                  <span>Zero off-brand posts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-6 rounded-2xl border border-border bg-surface-raised flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-highlight-soft text-on-highlight-soft border border-border flex items-center justify-center font-bold mb-4">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text text-base mb-2">Editorial Approval Queue</h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                    Multi-tier approval gates give brand managers and agency leads total review control before any draft goes live.
                  </p>
                </div>
                <div className="pt-4 border-t border-border mt-4 flex items-center text-xs font-semibold text-highlight gap-1">
                  <span>Role-adaptive gates</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Feature 4 */}
              <div className="p-6 rounded-2xl border border-border bg-surface-raised flex flex-col justify-between shadow-2xs hover:border-primary/40 transition-all">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-success/10 text-success border border-border flex items-center justify-center font-bold mb-4">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-text text-base mb-2">Peak Resonance Timing</h3>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                    Schedule automatically into your audience's highest active engagement windows for peak impressions and reach.
                  </p>
                </div>
                <div className="pt-4 border-t border-border mt-4 flex items-center text-xs font-semibold text-success gap-1">
                  <span>Data-backed timing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= CALL TO ACTION BANNER ================= */}
        <section id="pricing-cta" className="py-16 sm:py-20 px-4 sm:px-6 scroll-mt-20 bg-bg">
          <div className="max-w-5xl mx-auto">
            <div className="p-8 sm:p-12 text-center relative overflow-hidden bg-surface border border-border shadow-lg rounded-3xl">
              <div className="relative z-10 max-w-2xl mx-auto space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-soft text-on-primary-soft border border-border text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-accent" />
                  <span>Unify your multi-channel marketing workflow</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text">
                  Start publishing brand-aligned content today.
                </h2>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-normal">
                  Join retail brands, creator collectives, and marketing agencies managing their social operations on Aminoid.
                </p>
                <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/onboarding">
                    <button
                      type="button"
                      className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      Start Setup Wizard
                    </button>
                  </Link>
                  <Link to="/pricing">
                    <button
                      type="button"
                      className="px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold text-text bg-surface hover:bg-surface-selected border border-border active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                    >
                      View Membership Plans
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default HomePage;
