import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BarChart3,
  Building2,
  Smartphone,
  Target,
  Bot,
  Sparkles,
  Layers,
  Palette,
  ShieldCheck,
  Image as ImageIcon,
  Folder,
  Edit3,
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Sliders,
  Check,
  Rocket,
  TrendingUp,
  Zap,
  CreditCard,
  Lock,
  Users,
  Share2,
  X,
  Home,
  Crown,
  BookOpen
} from 'lucide-react';

export const SIDEBAR_SECTIONS = [
  {
    items: [
      { id: 'overview', label: 'Overview', icon: BarChart3 }
    ]
  },
  {
    title: 'AI STUDIO',
    items: [
      { id: 'ai-planner', label: '1. AI Content Planner', icon: Layers, badge: 'Planner' },
      { id: 'gemini-studio', label: '2. Gemini AI Studio', icon: Sparkles, badge: 'Gemini 3.0' },
      { id: 'content-studio', label: '3. Content Studio', icon: Palette, badge: 'Composer' },
      { id: 'autonomous-pipeline', label: '4. Autonomous AI Pipeline', icon: Bot, badge: 'Auto-AI & QA' }
    ]
  },
  {
    title: 'PUBLISHING & MEDIA',
    items: [
      { id: 'approval-queue', label: '1. Approval Queue', icon: Check, countKey: 'pendingCount' },
      { id: 'publishing-scheduler', label: '2. Publishing Scheduler', icon: Clock, badge: 'Calendar & Queue' },
      { id: 'media-library', label: '3. Media Library', icon: ImageIcon, badge: 'Collections' }
    ]
  },
  {
    title: 'BRAND & PLATFORMS',
    items: [
      { id: 'brand-profile', label: 'Brand Profile', icon: Building2 },
      { id: 'social-accounts', label: 'Social Accounts & API', icon: Smartphone, badge: '3 Networks' },
      { id: 'token-guide', label: 'Access Token Guide', icon: BookOpen, badge: 'Guide' },
      { id: 'content-goals', label: 'Content Goals & Audience', icon: Target }
    ]
  },
  {
    title: 'ANALYTICS & SETTINGS',
    items: [
      { id: 'analytics-insights', label: 'Analytics & Insights', icon: TrendingUp },
      { id: 'membership-billing', label: 'Membership & Billing', icon: CreditCard, badge: 'Pro' },
      { id: 'settings-team', label: 'Team Governance', icon: Users }
    ]
  }
];

export function DashboardSidebar({ activeView, onViewChange, isOpen, onClose }) {
  const { user, membership, logout, isAdmin, isSuperAdmin } = useAuth();
  const { brandProfile, contentItems } = useContent() || {};
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const brandName = brandProfile?.name || 'My Brand';
  const logoUrl = brandProfile?.logoUrl || brandProfile?.logo_url || null;
  const brandTagline = brandProfile?.tagline || 'Autonomous Social Studio';

  const pendingCount = (contentItems || []).filter(
    (i) => i?.status === 'awaiting' || i?.status === 'changes_requested'
  ).length;

  const handleSelect = (item) => {
    if (typeof item === 'string') {
      onViewChange(item);
      if (onClose) onClose();
      return;
    }
    if (item.link) {
      navigate(item.link);
      if (onClose) onClose();
      return;
    }
    onViewChange(item.id);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop with AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="sidebar-overlay"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <aside
        className={`sidebar-container ${isOpen ? 'open' : ''} border-r border-border text-text transition-colors duration-200`}
        style={{ background: 'var(--sidebar-bg, var(--surface))' }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '18px 16px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            background: 'var(--sidebar-bg, var(--surface))'
          }}
        >
          <div
            onClick={() => handleSelect('overview')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              minWidth: 0,
              flex: 1
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                minWidth: '38px',
                borderRadius: '10px',
                background: 'var(--primary)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--on-primary)',
                fontWeight: 800,
                fontSize: '0.95rem',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)'
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={brandName}
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Sparkles style={{ width: '18px', height: '18px', color: 'var(--on-primary)' }} />
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: 'var(--text)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {brandName}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {brandTagline}
              </div>
            </div>
          </div>

          {/* Close drawer button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="flex lg:hidden p-2 rounded-xl text-text-secondary hover:text-text hover:bg-surface-selected transition-colors cursor-pointer"
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {SIDEBAR_SECTIONS.filter((s) => (!s.adminOnly || isAdmin) && (!s.superAdminOnly || isSuperAdmin)).map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <div
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 750,
                    color: 'var(--text-faint)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    padding: '0 10px',
                    marginBottom: '6px'
                  }}
                >
                  {section.title}
                </div>
              )}
              <nav style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {section.items.map((item) => {
                  const isActive = activeView === item.id;
                  const count = item.countKey === 'pendingCount' ? pendingCount : 0;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      className={`sidebar-nav-item group ${isActive ? 'active' : ''}`}
                      style={{
                        position: 'relative',
                        paddingLeft: isActive ? '14px' : '12px',
                        background: isActive
                          ? 'var(--sidebar-active, var(--primary-soft))'
                          : 'transparent',
                        color: isActive
                          ? 'var(--primary)'
                          : 'var(--text-secondary)',
                        borderColor: isActive
                          ? 'var(--primary)'
                          : 'transparent',
                        fontWeight: isActive ? 700 : 500,
                      }}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '6px',
                            bottom: '6px',
                            width: '3.5px',
                            borderRadius: '0 4px 4px 0',
                            background: 'var(--primary)'
                          }}
                        />
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          minWidth: 0,
                          flex: 1
                        }}
                      >
                        {item.icon && (
                          <item.icon
                            className={`w-4 h-4 shrink-0 transition-colors ${
                              isActive
                                ? 'text-primary'
                                : 'text-text-muted group-hover:text-text'
                            }`}
                          />
                        )}
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {item.label}
                        </span>
                      </div>

                      {count > 0 && (
                        <span
                          className="badge badge--warning"
                          style={{
                            fontSize: '0.68rem',
                            padding: '1px 6px',
                            fontWeight: 700
                          }}
                        >
                          {count}
                        </span>
                      )}

                      {item.badge && !count && (
                        <span
                          className={`badge ${
                            item.badge === 'Auto-Gen' || item.badge === 'New' || item.badge === 'Master'
                              ? 'badge--accent'
                              : item.badge === '96%' || item.badge === 'Active'
                              ? 'badge--success'
                              : ''
                          }`}
                          style={{
                            fontSize: '0.66rem',
                            padding: '1px 6px',
                            fontWeight: 700
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>

        {/* Footer User Info */}
        <div
          style={{
            padding: '14px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-elevated)'
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px'
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                minWidth: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'var(--on-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.78rem',
                overflow: 'hidden'
              }}
            >
              {brandProfile?.logoUrl ? (
                <img
                  src={brandProfile.logoUrl}
                  alt="Avatar"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (user?.name || brandProfile?.name || 'WA').slice(0, 2).toUpperCase()
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <strong
                style={{
                  fontSize: '0.82rem',
                  display: 'block',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: 'var(--text)'
                }}
              >
                {user?.name || `${brandProfile?.name || 'Workspace'} Admin`}
              </strong>
              <span
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  display: 'block'
                }}
              >
                {membership?.plan || 'Pro Growth Plan'}
              </span>
            </div>
          </div>


          <div style={{ display: 'flex', gap: '6px' }}>
            <Link
              to="/"
              className="btn btn--secondary btn--sm"
              style={{ flex: 1, fontSize: '0.75rem', justifyContent: 'center' }}
            >
              Home
            </Link>

            <button
              className="btn btn--secondary btn--sm"
              onClick={() => {
                logout();
                navigate('/login');
              }}
              style={{ fontSize: '0.75rem' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

export default DashboardSidebar;
