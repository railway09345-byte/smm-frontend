import React, { useState, useMemo, useEffect } from 'react';
import { getFullMediaUrl } from '../../../services/api';
import { PostMediaThumbnail } from '../../common/PostMediaThumbnail';
import {
  Sparkles,
  Calendar,
  Clock,
  Layers,
  Send,
  Sliders,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  Share2,
  ChevronRight,
  TrendingUp,
  Cpu,
  Bot,
  Check,
  X,
  ShieldCheck,
  Flame,
  LayoutGrid,
  ListFilter,
  Camera,
  Menu,
  Settings,
  Users
} from 'lucide-react';
import { useContent } from '../../../contexts/ContentContext';
import { useAuth } from '../../../contexts/AuthContext';
import AnimatedCounter from '../../ui/AnimatedCounter';

const InstagramIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const PinterestIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="m8 12 4 4 4-4" />
    <path d="M12 8v8" />
  </svg>
);

const YoutubeIcon = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <path d="m10 15 5-3-5-3z" />
  </svg>
);

const PLATFORMS = [
  { name: 'Instagram', icon: InstagramIcon },
  { name: 'Facebook', icon: FacebookIcon },
  { name: 'YouTube', icon: YoutubeIcon },
  { name: 'Pinterest', icon: PinterestIcon }
];

// Spotlight wrapper with dynamic radial cursor glow matching outside theme
const SpotlightCard = ({ children, className = '', style = {}, onClick }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-[16px] border border-border bg-surface text-text shadow-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg ${className}`}
      style={{
        backgroundColor: 'var(--surface)',
        borderColor: 'var(--border)',
        boxShadow: 'var(--shadow)',
        borderRadius: '16px',
        ...style
      }}
    >
      <div
        className="pointer-events-none absolute -inset-px transition-opacity duration-300"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(450px circle at ${mousePos.x}px ${mousePos.y}px, rgba(129, 140, 248, 0.12), rgba(34, 211, 238, 0.05) 60%, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};

// Animated Soundwave illustration component matching Indigo Tech brand theme
const AIWaveform = () => {
  return (
    <div className="relative w-full h-36 sm:h-44 flex items-center justify-center my-3 overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/15 to-primary/10 rounded-3xl blur-2xl transform scale-90" />
      
      {/* Waveform SVG */}
      <svg
        viewBox="0 0 600 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-lg h-full object-contain relative z-10 opacity-90"
      >
        <defs>
          <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.85" />
            <stop offset="50%" stopColor="var(--accent-ai)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--accent-ai)" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="waveGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="50%" stopColor="var(--accent-ai)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.35" />
          </linearGradient>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient base glow wave */}
        <path
          d="M 20 80 Q 90 80 150 50 T 300 80 T 450 110 T 580 80"
          stroke="url(#waveGrad2)"
          strokeWidth="4"
          strokeLinecap="round"
          filter="url(#softGlow)"
          opacity="0.3"
        />

        {/* Dynamic primary sound wave shape - delicate and refined */}
        <path
          d="M 10 80 C 80 80 110 30 180 30 C 250 30 270 125 350 125 C 420 125 460 45 520 45 C 560 45 580 80 590 80"
          stroke="url(#waveGrad1)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="transition-all duration-700"
        />

        {/* Secondary harmonizing wave */}
        <path
          d="M 20 80 C 100 80 130 120 200 120 C 270 120 290 40 370 40 C 440 40 480 105 530 105 C 565 105 580 80 590 80"
          stroke="url(#waveGrad2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
        />

        {/* Center subtle focal point */}
        <circle cx="270" cy="80" r="2.5" fill="var(--accent-ai)" opacity="0.9" />
        <circle cx="350" cy="125" r="2" fill="var(--primary)" opacity="0.8" />
      </svg>
    </div>
  );
};

export function OverviewView({
  contentItems = [],
  pendingCount = 0,
  approvedCount = 0,
  scheduledCount = 0,
  publishedCount = 0,
  isAutomationActive: initialAutomationActive = true,
  toggleAutomation,
  generateDailyBatch,
  onNavigate = () => {},
  onPreviewItem = () => {},
  onEditStudioItem = () => {},
  onOpenSidebar = () => {}
}) {
  const { brandProfile, saveContentItem, approveItem, deleteItem } = useContent();
  const { user, hasCompletedBrandSetup } = useAuth();

  const brandName = brandProfile?.name || 'My Brand';

  // Merge live database items into queue
  const initialPostsMerged = useMemo(() => {
    if (!contentItems || contentItems.length === 0) return [];

    const mappedDbPosts = contentItems.map((item, idx) => ({
      id: item.id || `db-post-${idx}`,
      dbId: item.dbId || item.id,
      mode: item.format?.toLowerCase().includes('auto') || item.creativeDirection ? 'auto' : 'manual',
      confidenceScore: item.qualityScore ?? null,
      channel: [item.platform || 'Instagram'],
      title: item.title || item.headline || 'Untitled post',
      caption: item.caption || '',
      scheduledTime: item.scheduledTime ? `${item.scheduledDate || ''} ${item.scheduledTime}`.trim() : 'Not scheduled',
      timestamp: item.scheduledDate || new Date().toISOString(),
      status: item.status === 'approved' || item.status === 'scheduled' ? 'approved' : 'pending_approval',
      mediaUrl: item.mediaUrl || item.thumbnailUrl || item.media_url || item.thumbnail_url || item.media_asset?.file_url || null,
      tags: typeof item.hashtags === 'string' ? item.hashtags.split(' ').filter(Boolean).slice(0, 3) : [],
      reachEstimate: item.reachEstimate || null }));

    return mappedDbPosts;
  }, [contentItems]);

  const [posts, setPosts] = useState(initialPostsMerged);
  const [filterMode, setFilterMode] = useState('all'); // 'all' | 'auto' | 'manual'
  const [pipelineActive, setPipelineActive] = useState(initialAutomationActive);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [batchGenerating, setBatchGenerating] = useState(false);

  // Sync posts when contentItems changes
  useEffect(() => {
    setPosts(initialPostsMerged);
  }, [initialPostsMerged]);

  // Form state for Create Post modal
  const [formMode, setFormMode] = useState('auto');
  const [formTitle, setFormTitle] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formChannels, setFormChannels] = useState(['Instagram']);
  const [formTime, setFormTime] = useState('Today, 4:15 PM (AI Peak)');
  const [formImage, setFormImage] = useState(null);

  // Filter posts
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesSearch =
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.caption.toLowerCase().includes(searchQuery.toLowerCase());
      if (filterMode === 'all') return matchesSearch;
      return matchesSearch && post.mode === filterMode;
    });
  }, [posts, filterMode, searchQuery]);

  // Live pipeline stats
  const stats = useMemo(() => {
    return {
      autoDrafts: posts.filter((p) => p.mode === 'auto').length,
      pendingValidation: posts.filter((p) => p.status === 'pending_approval').length,
      readyQueue: posts.filter((p) => p.status === 'approved').length,
      totalReach: null,
      avgConfidence: null
    };
  }, [posts]);

  const upcomingPosts = useMemo(
    () => posts.filter((post) => post.status === 'approved' || post.status === 'scheduled').slice(0, 2),
    [posts]
  );

  // Handle AI Batch generation
  const handleGenerateAIBatch = async () => {
    setBatchGenerating(true);
    try {
      if (generateDailyBatch) {
        await generateDailyBatch();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBatchGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'approved' } : p))
    );
    if (approveItem) {
      try {
        await approveItem(id);
      } catch (e) {}
    }
  };

  const handleDelete = async (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    if (deleteItem) {
      try {
        await deleteItem(id);
      } catch (e) {}
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const newPost = {
      id: `post-${Date.now()}`,
      mode: formMode,
      confidenceScore: formMode === 'auto' ? 96 : null,
      channel: formChannels,
      title: formTitle,
      caption: formCaption,
      scheduledTime: formTime,
      timestamp: new Date().toISOString(),
      status: formMode === 'auto' ? 'pending_approval' : 'approved',
      mediaUrl: formImage,
      tags: ['#ZenithStudio', '#OrganicBrand'],
      reachEstimate: '15.4K' };

    setPosts([newPost, ...posts]);
    setIsCreateModalOpen(false);

    // Persist to MySQL
    if (saveContentItem) {
      await saveContentItem({
        title: formTitle,
        caption: formCaption,
        platform: formChannels[0] || 'Instagram',
        format: formMode === 'auto' ? 'AI Auto Post' : 'Manual Post',
        mediaUrl: formImage,
        status: formMode === 'auto' ? 'awaiting' : 'approved',
        scheduledTime: formTime
      });
    }

    setFormTitle('');
    setFormCaption('');
  };

  const toggleChannelSelection = (chName) => {
    setFormChannels((prev) =>
      prev.includes(chName) ? prev.filter((c) => c !== chName) : [...prev, chName]
    );
  };

  const handleToggleDaemon = () => {
    setPipelineActive(!pipelineActive);
    if (toggleAutomation) {
      toggleAutomation();
    }
  };

  return (
    <div className="space-y-6">
      {/* ================= ROW 1: HERO DUAL-ENGINE BENTO ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Bento Card 1: Autonomous AI Pipeline with AI Waveform Graphic (8 cols) */}
        <SpotlightCard
          className="lg:col-span-7 xl:col-span-8 p-6 flex flex-col justify-between border-border relative overflow-hidden group h-full"
          style={{
            background: 'linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-[28px] sm:text-[32px] font-semibold tracking-[-0.02em] text-text">
              Autonomous AI pipeline
            </h2>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-soft text-on-primary-soft">
              <Bot className="w-3.5 h-3.5 text-on-primary-soft" />
              Dual Engine
            </span>
          </div>

          {/* Glowing Soundwave / AI Waveform Graphic with faint indigo glow */}
          <AIWaveform />

          {/* Action Buttons: Run Daily Planner & Review Approvals */}
          <div className="flex flex-wrap items-center gap-3 my-4">
            <button
              onClick={handleGenerateAIBatch}
              disabled={batchGenerating}
              className="flex items-center gap-2 px-[18px] py-[10px] rounded-[10px] font-semibold text-sm bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-sm disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 text-primary-on ${batchGenerating ? 'animate-spin' : ''}`} />
              <span>{batchGenerating ? 'Synthesizing batch...' : 'Run Daily Planner'}</span>
            </button>

            <button
              onClick={() => {
                setFilterMode('auto');
                onNavigate('approval-queue');
              }}
              className="px-[18px] py-[10px] rounded-[10px] font-semibold text-sm text-text bg-transparent border border-border hover:bg-surface-selected active:scale-95 transition-all focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer"
            >
              Review Approvals
            </button>
          </div>

          {/* Contextual description copy */}
          <p className="text-[15px] text-text-secondary leading-[1.6] max-w-[60ch] font-normal">
            Your autonomous AI marketing engine has generated today's multi-channel content batch tailored for <strong className="text-text font-semibold">{brandName}</strong>. Review, approve, and auto-dispatch below.
          </p>
        </SpotlightCard>

        {/* Bento Right Column (4 cols): AI Generation Engine & Upcoming Social Queue */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 justify-between">
          {/* Top Card: AI Generation Engine (3 Stat Metrics) */}
          <SpotlightCard className="p-6 border-border flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-text">
                AI generation engine
              </h3>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-soft text-accent">
                <Sparkles className="w-4 h-4 text-accent" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 divide-x divide-border">
              <div className="px-1">
                <span className="text-[13px] font-medium text-text-muted block">
                  Generated
                </span>
                <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                  <AnimatedCounter value={stats.autoDrafts} />
                </div>
              </div>

              <div className="pl-3">
                <span className="text-[13px] font-medium text-text-muted block">
                  Awaiting Approval
                </span>
                <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                  <AnimatedCounter value={stats.pendingValidation} />
                </div>
              </div>

              <div className="pl-3">
                <span className="text-[13px] font-medium text-text-muted block">
                  Scheduled Posts
                </span>
                <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                  <AnimatedCounter value={scheduledCount} />
                </div>
              </div>
            </div>
          </SpotlightCard>

          {/* Bottom Card: Upcoming Social Queue */}
          <SpotlightCard className="p-6 flex-1 flex flex-col justify-between border-border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[18px] font-semibold text-text">
                Upcoming social queue
              </h3>
              <button
                onClick={() => onNavigate('content-calendar')}
                className="text-xs text-primary font-medium hover:underline focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {upcomingPosts.length === 0 ? (
                <div className="py-4 text-center flex flex-col items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-primary-soft text-on-primary-soft flex items-center justify-center mx-auto mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <p className="text-[14px] font-normal text-text-secondary">No upcoming posts yet</p>
                  <button
                    onClick={() => onNavigate('content-studio')}
                    className="mt-3 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                  >
                    Create your first post
                  </button>
                </div>
              ) : upcomingPosts.map((post) => (
                <div key={post.id} className="p-3 rounded-xl bg-surface-raised border border-border space-y-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <PostMediaThumbnail
                      url={post.mediaUrl}
                      title={post.title}
                      className="w-10 h-10 rounded-lg shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-text flex items-center gap-1">
                        <Clock className="w-3 h-3 text-accent" />
                        {post.scheduledTime}
                      </span>
                      <p className="text-[13px] text-text-secondary font-normal truncate">{post.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-border">
                    <span className="text-[11px] text-text-muted font-medium truncate">{post.channel.join(', ')}</span>
                    <button
                      onClick={() => onEditStudioItem(post.id)}
                      className="px-2.5 py-1 rounded-md text-xs font-semibold bg-surface border border-border text-primary hover:bg-surface-selected transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>
      </div>

      {/* ================= ROW 2: PEAK RESONANCE RADAR & PIPELINE CARDS ================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Bento Card 2: Neural Peak Radar & Confidence Pulse (4 cols) */}
        <SpotlightCard className="lg:col-span-5 xl:col-span-4 p-6 flex flex-col justify-between border-border h-full">
          <div className="flex items-center justify-between">
            <h3 className="text-[18px] font-semibold text-text">
              Peak resonance radar
            </h3>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-soft text-on-primary-soft">
              <TrendingUp className="w-3 h-3 text-primary" />
              No data yet
            </span>
          </div>

          <div className="my-4 text-center py-2">
            <div className="w-9 h-9 rounded-full bg-primary-soft text-on-primary-soft flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div className="text-[32px] font-semibold text-text leading-tight mb-1">—</div>
            <p className="text-[14px] text-text-secondary font-normal max-w-xs mx-auto">
              Awaiting analytics: connect social accounts and publish content to see engagement recommendations.
            </p>
            <button
              onClick={() => onNavigate('social-accounts')}
              className="mt-3 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
            >
              Connect social accounts
            </button>

            {/* Micro-bar visualizer */}
            <div className="grid grid-cols-7 gap-1.5 mt-4 items-end h-10 bg-surface-raised p-1.5 rounded-xl border border-border/50">
              {[0, 0, 0, 0, 0, 0, 0].map((val, idx) => (
                <div
                  key={idx}
                  className="w-full rounded-md transition-all duration-500"
                  style={{
                    height: `${val || 15}%`,
                    backgroundColor: idx === 3 ? 'var(--primary)' : 'var(--border)',
                    opacity: idx === 3 ? 0.9 : 0.4,
                  }}
                  title="No engagement data available"
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-text-secondary font-medium">
            <span>Confidence Target</span>
            <span className="font-semibold text-primary">{stats.avgConfidence == null ? 'No score yet' : `${stats.avgConfidence}% Auto-Accuracy`}</span>
          </div>
        </SpotlightCard>

        {/* 4-Stage Pipeline Metrics (8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-6 items-stretch">
          {/* Step 1 */}
          <SpotlightCard className="p-6 flex flex-col justify-between h-full border-border">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-soft text-accent">
                  <Sparkles className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[11px] font-semibold text-accent uppercase tracking-wider">AI</span>
              </div>
              <span className="text-[13px] font-medium text-text-muted block">AI brain drafts</span>
              <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                {stats.autoDrafts}
              </div>
            </div>
            <p className="text-[12px] text-text-secondary mt-3">Autonomous concepts ready</p>
          </SpotlightCard>

          {/* Step 2 */}
          <SpotlightCard className="p-6 flex flex-col justify-between h-full border-border">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-soft text-warning">
                  <AlertCircle className="w-4 h-4 text-warning" />
                </div>
                <span className="text-[11px] font-semibold text-warning uppercase tracking-wider">Action</span>
              </div>
              <span className="text-[13px] font-medium text-text-muted block">Awaiting review</span>
              <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                {stats.pendingValidation}
              </div>
            </div>
            <p className="text-[12px] text-text-secondary mt-3">Action required before push</p>
          </SpotlightCard>

          {/* Step 3 */}
          <SpotlightCard className="p-6 flex flex-col justify-between h-full border-border">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-soft text-success">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                </div>
                <span className="text-[11px] font-semibold text-success uppercase tracking-wider">Ready</span>
              </div>
              <span className="text-[13px] font-medium text-text-muted block">Scheduled queue</span>
              <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                {stats.readyQueue}
              </div>
            </div>
            <p className="text-[12px] text-text-secondary mt-3">Approved & primed</p>
          </SpotlightCard>

          {/* Step 4 */}
          <SpotlightCard className="p-6 flex flex-col justify-between h-full border-border">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-soft text-info">
                  <BarChart3 className="w-4 h-4 text-info" />
                </div>
                <span className="text-[11px] font-semibold text-info uppercase tracking-wider">Reach</span>
              </div>
              <span className="text-[13px] font-medium text-text-muted block">Monthly reach</span>
              <div className="text-[32px] font-semibold text-text mt-0.5 leading-none">
                {stats.totalReach || '—'}
              </div>
            </div>
            <p className="text-[12px] text-text-secondary mt-3">Cross-platform footprint</p>
          </SpotlightCard>
        </div>
      </div>

      {/* ================= ROW 3: INTERACTIVE TIMELINE & QUEUE ================= */}
      <div className="space-y-4">
        {/* Filter Tabs & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 bg-surface rounded-2xl border border-border shadow-xs transition-colors duration-200">
          <div className="flex items-center gap-1 p-1 bg-surface-raised rounded-xl border border-border">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'all'
                  ? 'bg-primary text-primary-on shadow-xs'
                  : 'text-text-secondary hover:text-text hover:bg-surface-selected'
              }`}
            >
              All Entries ({posts.length})
            </button>
            <button
              onClick={() => setFilterMode('auto')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'auto'
                  ? 'bg-primary text-primary-on shadow-xs'
                  : 'text-text-secondary hover:text-text hover:bg-surface-selected'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>AI Autonomous ({posts.filter((p) => p.mode === 'auto').length})</span>
            </button>
            <button
              onClick={() => setFilterMode('manual')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                filterMode === 'manual'
                  ? 'bg-primary text-primary-on shadow-xs'
                  : 'text-text-secondary hover:text-text hover:bg-surface-selected'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Manual Scheduled ({posts.filter((p) => p.mode === 'manual').length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 px-2">
            <span className="text-xs text-text-secondary font-medium">
              Viewing {filteredPosts.length} posts
            </span>
          </div>
        </div>

        {/* Post Feed List */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-surface rounded-2xl border border-dashed border-border flex flex-col items-center justify-center">
              <div className="w-9 h-9 rounded-full bg-primary-soft text-on-primary-soft flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-4 h-4 text-primary" />
              </div>
              <p className="text-sm font-semibold text-text">No scheduled posts found</p>
              <p className="text-xs text-text-secondary mt-1">Adjust your filters or trigger a new AI batch.</p>
              <button
                onClick={handleGenerateAIBatch}
                className="mt-3 px-3.5 py-1.5 rounded-[10px] text-xs font-semibold bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                Run Daily Planner
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <SpotlightCard key={post.id} className="p-5 transition-all border-border">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Left: Thumbnail & Content Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <PostMediaThumbnail
                      url={post.mediaUrl}
                      title={post.title}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl"
                      onClick={() => onEditStudioItem(post.id)}
                    />

                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {post.mode === 'auto' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-soft text-on-primary-soft border border-border">
                            <Sparkles className="w-3 h-3 text-accent" />
                            <span>AI Autonomous</span>
                            <span className="text-text-muted font-normal">| {post.confidenceScore}% match</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-surface-raised text-text-secondary border border-border">
                            <Calendar className="w-3 h-3 text-text-secondary" />
                            <span>Manual Post</span>
                          </span>
                        )}

                        {post.status === 'approved' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-success border border-border">
                            <Check className="w-3 h-3" /> Queued
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary-soft text-warning border border-border">
                            <Clock className="w-3 h-3" /> Needs Approval
                          </span>
                        )}

                        <div className="flex items-center gap-1 ml-1">
                          {post.channel.map((ch) => (
                            <span
                              key={ch}
                              className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-surface-raised text-text border border-border"
                            >
                              {ch}
                            </span>
                          ))}
                        </div>
                      </div>

                      <h3 className="font-semibold text-text text-sm sm:text-base leading-snug truncate">
                        {post.title}
                      </h3>

                      <p className="text-xs text-text-secondary line-clamp-2 max-w-2xl leading-relaxed">
                        {post.caption}
                      </p>
                    </div>
                  </div>

                  {/* Right: Timing & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-xs font-semibold text-text flex items-center md:justify-end gap-1">
                        <Clock className="w-3.5 h-3.5 text-accent" />
                        {post.scheduledTime}
                      </div>
                      <div className="text-[11px] text-text-muted font-medium">
                        Est. Reach: {post.reachEstimate || '—'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {post.status !== 'approved' && (
                        <button
                          onClick={() => handleApprove(post.id)}
                          className="px-3.5 py-1.5 rounded-[10px] text-xs font-semibold bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                        >
                          Approve
                        </button>
                      )}

                      <button
                        onClick={() => onEditStudioItem(post.id)}
                        className="p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-selected transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                        title="Edit in Studio"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 rounded-xl text-text-secondary hover:text-error hover:bg-surface-selected transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </SpotlightCard>
            ))
          )}
        </div>
      </div>

      {/* ================= COMPOSER HUB / CREATE POST MODAL ================= */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-xl bg-surface-raised rounded-3xl border border-border shadow-2xl overflow-hidden p-6 sm:p-8 animate-scale-up">
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="absolute top-5 right-5 p-1 rounded-full text-text-muted hover:text-text hover:bg-surface-selected transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Composer Hub</span>
                <h2 className="text-xl font-semibold text-text mt-0.5">
                  Dispatch New Content
                </h2>
                <p className="text-xs text-text-muted">
                  Switch between AI autonomous auto-slotting or precision manual dispatch.
                </p>
              </div>

              {/* Mode Toggle Pills */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-surface border border-border rounded-2xl mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setFormMode('auto');
                    setFormTime('Optimal AI Time (4:15 PM)');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                    formMode === 'auto'
                      ? 'bg-primary text-primary-on shadow-xs'
                      : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>Autonomous AI Slotting</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFormMode('manual');
                    setFormTime('Tomorrow, 10:00 AM');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                    formMode === 'manual'
                      ? 'bg-primary text-primary-on shadow-xs'
                      : 'text-text-secondary hover:text-text hover:bg-surface-selected'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-text-secondary" />
                  <span>Manual Date & Time</span>
                </button>
              </div>

              {/* Form Input fields */}
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Post Heading / Idea
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Seasonal Cinnamon Cortado Spotlight"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Copy / Caption
                  </label>
                  <textarea
                    rows={3}
                    value={formCaption}
                    onChange={(e) => setFormCaption(e.target.value)}
                    placeholder="Write your story or let AI refine your talking points..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm bg-surface border border-border text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                    Target Channels
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PLATFORMS.map((platform) => {
                      const isSelected = formChannels.includes(platform.name);
                      return (
                        <button
                          key={platform.name}
                          type="button"
                          onClick={() => toggleChannelSelection(platform.name)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                            isSelected
                              ? 'bg-primary text-primary-on border-primary'
                              : 'bg-surface text-text-secondary border-border hover:bg-surface-selected'
                          }`}
                        >
                          <platform.icon className="w-3.5 h-3.5" />
                          <span>{platform.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    {formMode === 'auto' ? 'AI Recommended Slot' : 'Custom Dispatch Slot'}
                  </label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl text-xs bg-surface border border-border text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>Confirm & Schedule</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  );
}
