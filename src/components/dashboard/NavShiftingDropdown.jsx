import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  Bot,
  Calendar,
  Layers,
  BarChart3,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  Users,
  Image as ImageIcon,
  FolderOpen,
  Edit3,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Cpu,
  Key,
  Globe,
  Settings,
  Flame,
  Check,
  BookOpen
} from 'lucide-react';

export function NavShiftingDropdown({ activeView, onNavigate, pendingCount = 0, isAdmin = false }) {
  const [selected, setSelected] = useState(null);
  const [dir, setDir] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSelected(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSetSelected = (val) => {
    if (typeof selected === 'number' && typeof val === 'number') {
      setDir(selected > val ? 'r' : 'l');
    } else if (val === null) {
      setDir(null);
    }
    setSelected(val);
  };

  const handleItemClick = (viewId) => {
    onNavigate(viewId);
    setSelected(null);
  };

  const TABS = [
    {
      id: 1,
      title: 'AI Studio',
      icon: Sparkles,
      activeViews: ['ai-planner', 'gemini-studio', 'content-studio', 'autonomous-pipeline'],
      Component: () => (
        <AIStudioMenu onItemClick={handleItemClick} activeView={activeView} />
      ),
    },
    {
      id: 2,
      title: 'Publishing & Media',
      icon: Send,
      badge: pendingCount > 0 ? `${pendingCount}` : null,
      activeViews: ['approval-queue', 'publishing-scheduler', 'media-library', 'content-calendar', 'scheduled-posts', 'published-posts', 'failed-posts', 'media-collections', 'publishing-automation'],
      Component: () => (
        <PublishingMediaMenu onItemClick={handleItemClick} activeView={activeView} pendingCount={pendingCount} />
      ),
    },
    {
      id: 3,
      title: 'Analytics & Growth',
      icon: BarChart3,
      activeViews: ['analytics-insights', 'ai-optimization'],
      Component: () => (
        <AnalyticsMenu onItemClick={handleItemClick} activeView={activeView} />
      ),
    },
    {
      id: 4,
      title: 'Settings & Admin',
      icon: Settings,
      activeViews: ['brand-profile', 'social-accounts', 'token-guide', 'content-goals', 'membership-billing', 'security-permissions', 'settings-team', 'multi-business', 'admin-social-integrations'],
      Component: () => (
        <AdministrationMenu onItemClick={handleItemClick} activeView={activeView} isAdmin={isAdmin} />
      ),
    },
  ];

  return (
    <div
      ref={containerRef}
      onMouseLeave={() => handleSetSelected(null)}
      className="relative flex items-center gap-1 sm:gap-1.5"
    >
      {TABS.map((t) => {
        const Icon = t.icon;
        const isSelected = selected === t.id;
        const isTabActive = t.activeViews.includes(activeView);

        return (
          <button
            key={t.id}
            id={`shift-tab-${t.id}`}
            onMouseEnter={() => handleSetSelected(t.id)}
            onClick={() => handleSetSelected(isSelected ? null : t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 cursor-pointer ${
              isSelected
                ? 'bg-primary text-primary-on font-bold shadow-sm'
                : isTabActive
                ? 'bg-primary-soft text-primary-on-soft border border-border font-bold'
                : 'text-text-secondary hover:text-text hover:bg-surface-selected'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${isTabActive && !isSelected ? 'text-primary' : ''}`} />
            <span>{t.title}</span>
            {t.badge && (
              <span className="px-1.5 py-0.2 bg-primary text-primary-on text-[10px] font-black rounded-full animate-pulse">
                {t.badge}
              </span>
            )}
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${
                isSelected ? 'rotate-180 text-primary-on' : 'text-text-muted'
              }`}
            />
          </button>
        );
      })}

      <AnimatePresence>
        {selected && (
          <Content
            dir={dir}
            selected={selected}
            tabs={TABS}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

const Content = ({ selected, dir, tabs }) => {
  return (
    <motion.div
      id="shift-overlay-content"
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="absolute left-0 top-[calc(100%+16px)] w-[460px] sm:w-[540px] z-[99999] rounded-2xl border border-border p-5 text-text shadow-2xl"
      style={{
        backgroundColor: 'var(--dropdown-bg, var(--surface))',
        boxShadow: 'var(--shadow)',
        opacity: 1,
      }}
    >
      <Bridge />
      <Nub selected={selected} />

      {tabs.map((t) => {
        if (selected !== t.id) return null;
        return (
          <div className="overflow-hidden" key={t.id}>
            <motion.div
              initial={{
                opacity: 0,
                x: dir === 'l' ? 40 : dir === 'r' ? -40 : 0,
              }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              <t.Component />
            </motion.div>
          </div>
        );
      })}
    </motion.div>
  );
};

const Bridge = () => (
  <div className="absolute -top-[16px] left-0 right-0 h-[16px]" />
);

const Nub = ({ selected }) => {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    moveNub();
  }, [selected]);

  const moveNub = () => {
    if (selected) {
      const hoveredTab = document.getElementById(`shift-tab-${selected}`);
      const overlayContent = document.getElementById('shift-overlay-content');

      if (!hoveredTab || !overlayContent) return;

      const tabRect = hoveredTab.getBoundingClientRect();
      const { left: contentLeft } = overlayContent.getBoundingClientRect();
      const tabCenter = tabRect.left + tabRect.width / 2 - contentLeft;

      setLeft(tabCenter);
    }
  };

  return (
    <motion.span
      style={{
        clipPath: 'polygon(0 0, 100% 0, 50% 50%, 0% 100%)',
        backgroundColor: 'var(--dropdown-bg, var(--surface))'
      }}
      animate={{ left }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="absolute top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-tl border-l border-t border-border z-[100000]"
    />
  );
};

/* ── TAB CONTENT 1: AI STUDIO ── */
function AIStudioMenu({ onItemClick, activeView }) {
  const items = [
    {
      id: 'ai-planner',
      title: 'AI Content Planner',
      desc: 'Create and save campaign plans, topics, formats, platforms and target dates',
      icon: Layers,
      badge: '1. Plan',
      badgeColor: 'bg-primary-soft text-primary-on-soft',
    },
    {
      id: 'gemini-studio',
      title: 'Gemini AI Studio',
      desc: 'Manually generate images, videos, captions and text hooks using Gemini 2.5 APIs',
      icon: Sparkles,
      badge: '2. Generate',
      badgeColor: 'bg-primary-soft text-primary-on-soft',
    },
    {
      id: 'content-studio',
      title: 'Content Studio & Composer',
      desc: 'Create, compose and edit posts, captions, hashtags, media assets and platform previews',
      icon: Edit3,
      badge: '3. Compose',
      badgeColor: 'bg-primary-soft text-primary-on-soft',
    },
    {
      id: 'autonomous-pipeline',
      title: 'Autonomous AI Pipeline',
      desc: 'Automatically orchestrate planning, generation, real-time QA checks and auto-scheduling',
      icon: Bot,
      badge: '4. Auto-Pipeline & QA',
      badgeColor: 'bg-primary-soft text-primary-on-soft',
    },
  ];

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between pb-2 border-b border-border gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse shrink-0" />
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider truncate">
            AI Studio Suite
          </span>
        </div>
        <button
          type="button"
          onClick={() => onItemClick('ai-planner')}
          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 shrink-0 ml-auto transition-colors cursor-pointer"
        >
          <span>Open Planner</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-surface-selected border border-primary/30 shadow-xs'
                  : 'hover:bg-surface-selected border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border bg-surface">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-text'}`}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── TAB CONTENT 2: PUBLISHING & MEDIA ── */
function PublishingMediaMenu({ onItemClick, activeView, pendingCount }) {
  const items = [
    {
      id: 'approval-queue',
      step: '1',
      title: 'Approval Queue',
      desc: 'Review and approve or reject posts before dispatch',
      icon: CheckCircle2,
      badge: pendingCount > 0 ? `${pendingCount} Pending` : '1. Review',
      badgeColor: pendingCount > 0 ? 'bg-primary text-primary-on' : 'bg-primary-soft text-primary-on-soft',
    },
    {
      id: 'publishing-scheduler',
      step: '2',
      title: 'Publishing Scheduler',
      desc: 'Manage scheduled posts, calendar views, queue, publishing activity, retries and failures',
      icon: Clock,
      badge: '2. Schedule & Calendar',
      badgeColor: 'bg-primary-soft text-primary-on-soft',
    },
    {
      id: 'media-library',
      step: '3',
      title: 'Media Library',
      desc: 'Manage permanent images and videos, including collections through folders, tags or filters',
      icon: ImageIcon,
      badge: '3. Media & Collections',
      badgeColor: 'bg-primary-soft text-primary-on-soft',
    },
  ];

  return (
    <div className="space-y-3 w-full">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
            Publishing & Media Flow
          </span>
        </div>
        <button
          onClick={() => onItemClick('publishing-scheduler')}
          className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Open Scheduler</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onItemClick(item.id)}
              className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-surface-selected border border-primary/30 shadow-xs'
                  : 'hover:bg-surface-selected border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-border bg-surface">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-text'}`}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-text-muted truncate mt-0.5">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── TAB CONTENT 3: ANALYTICS & GROWTH ── */
function AnalyticsMenu({ onItemClick, activeView }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">
          Audited Telemetry & Insights
        </span>
        <span className="text-[10px] font-bold text-primary bg-primary-soft text-primary-on-soft px-2 py-0.5 rounded-full border border-border">
          100% Real API Data
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={() => onItemClick('analytics-insights')}
          className={`text-left p-3.5 rounded-xl border transition-all space-y-1.5 group cursor-pointer ${
            activeView === 'analytics-insights' ? 'bg-surface-selected border-primary/30' : 'bg-surface-raised hover:bg-surface-selected border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary-on-soft border border-border flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
              <span>View</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <strong className="text-xs font-bold text-text block group-hover:text-primary">
            Publishing Performance
          </strong>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Reach, engagement rates, impressions, and success ratios from verified social APIs.
          </p>
        </button>

        <button
          onClick={() => onItemClick('ai-optimization')}
          className={`text-left p-3.5 rounded-xl border transition-all space-y-1.5 group cursor-pointer ${
            activeView === 'ai-optimization' ? 'bg-surface-selected border-primary/30' : 'bg-surface-raised hover:bg-surface-selected border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary-on-soft border border-border flex items-center justify-center shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
              <span>Simulate</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <strong className="text-xs font-bold text-text block group-hover:text-primary">
            AI Optimization & A/B Engine
          </strong>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            Simulate copy performance, test opening hooks, and receive algorithmic action recommendations.
          </p>
        </button>
      </div>
    </div>
  );
}

/* ── TAB CONTENT 4: ADMINISTRATION ── */
function AdministrationMenu({ onItemClick, activeView }) {
  const brandItems = [
    { id: 'brand-profile', title: 'Brand Profile', desc: 'Tone, voice, colors & logo', icon: Sparkles },
    { id: 'social-accounts', title: 'Connected Socials', desc: 'OAuth token connections', icon: Globe },
    { id: 'token-guide', title: 'Access Token Guide', desc: 'Step-by-step token instructions', icon: BookOpen },
    { id: 'content-goals', title: 'Content Goals', desc: 'Target audience & pillars', icon: Sliders },
  ];

  const adminItems = [
    { id: 'settings-team', title: 'Team Governance', desc: 'Collaborators and roles', icon: Users },
    { id: 'security-permissions', title: 'Security & 2FA', desc: 'MFA & encryption keys', icon: ShieldCheck },
    { id: 'membership-billing', title: 'Membership & Quotas', desc: 'Tiers & invoices', icon: Key },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-2 block">
            Brand Directives
          </span>
          {brandItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer ${
                  isActive
                    ? 'bg-surface-selected border border-primary/30'
                    : 'hover:bg-surface-selected border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold block truncate ${isActive ? 'text-primary' : 'text-text'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-text-muted truncate block">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-2 block">
            Governance & Administration
          </span>
          {adminItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full text-left p-2 rounded-xl transition-all flex items-center gap-2.5 group cursor-pointer ${
                  isActive
                    ? 'bg-surface-selected border border-primary/30'
                    : 'hover:bg-surface-selected border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-bold block truncate ${isActive ? 'text-primary' : 'text-text'}`}>
                    {item.title}
                  </span>
                  <span className="text-[10px] text-text-muted truncate block">{item.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
