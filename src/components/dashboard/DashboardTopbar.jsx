import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, ChevronDown, Home, UserCircle, LogOut, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../common/ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { NavShiftingDropdown } from './NavShiftingDropdown';
import { api } from '../../services/api';

export function DashboardTopbar({
  activeView,
  activeTitle,
  onViewChange,
  pendingCount = 0,
  onOpenSidebar,
  onOpenSearch,
  onOpenNotifications,
  onCreatePost,
}) {
  const navigate = useNavigate();
  const { user, myBusinesses = [], currentBusiness, switchBusiness, isAdmin, logout, hasCompletedBrandSetup } = useAuth();
  const { brandProfile, isAutomationActive, isTogglingAutomation, toggleAutomation } = useContent();
  const { isDark } = useTheme();

  const brandName = brandProfile?.name || currentBusiness?.brand_profile?.name || currentBusiness?.name || 'My Brand';
  const logoUrl = brandProfile?.logoUrl || brandProfile?.logo_url || currentBusiness?.logo_url || currentBusiness?.logoUrl || null;

  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);
  const organizationLogo = brandProfile?.logoUrl || brandProfile?.logo_url || currentBusiness?.logo_url || currentBusiness?.logoUrl || null;

  useEffect(() => {
    let mounted = true;
    const fetchUnread = async () => {
      try {
        const res = await api.notifications.getUnreadCount();
        if (mounted && res && typeof res.unread_count === 'number') {
          setUnreadCount(res.unread_count);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    const handleUpdate = () => {
      fetchUnread();
    };
    window.addEventListener('notifications:updated', handleUpdate);

    return () => {
      mounted = false;
      clearInterval(interval);
      window.removeEventListener('notifications:updated', handleUpdate);
    };
  }, [user?.id]);

  useEffect(() => {
    const close = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSelectBusiness = async (bId) => {
    if (bId === user?.organizationId) {
      setBusinessDropdownOpen(false);
      return;
    }
    setIsSwitching(true);
    try {
      await switchBusiness(bId);
      setBusinessDropdownOpen(false);
    } catch (err) {
      console.error('Failed to switch business:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <header
      className="sticky top-0 z-50 flex items-center justify-between px-4 gap-3 backdrop-blur-md border-b bg-surface/95 border-border text-text transition-colors duration-200 shadow-xs"
      style={{
        height: 'var(--topbar-h, 64px)',
      }}
    >
      {/* LEFT: Mobile Menu Toggle & Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 0 }}>
        {/* Mobile Hamburger menu */}
        <button
          type="button"
          onClick={() => onOpenSidebar && onOpenSidebar()}
          className="lg:hidden inline-flex items-center justify-center p-2 rounded-xl text-text hover:bg-surface-selected border border-border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring"
          aria-label="Open navigation menu"
          title="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onViewChange('overview')}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring ${
            activeView === 'overview'
              ? 'bg-primary text-primary-on border-primary shadow-xs'
              : 'bg-surface border-border text-text-secondary hover:text-text hover:bg-surface'
          }`}
          title="Go to Overview"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Overview</span>
        </button>
        <div style={{ minWidth: 0, display: 'none' }} className="sm:block">
          <h2
            className="text-text tracking-tight truncate max-w-[180px] md:max-w-[220px]"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '1.05rem',
              fontWeight: 600,
            }}
          >
            {activeTitle || 'Overview'}
          </h2>
        </div>
      </div>

      {/* CENTER: NavShiftingDropdown (Desktop) */}
      <div className="hidden lg:flex flex-1 justify-center min-w-0 overflow-visible">
        <NavShiftingDropdown
          activeView={activeView}
          onNavigate={onViewChange}
          pendingCount={pendingCount}
          isAdmin={isAdmin}
        />
      </div>

      {/* RIGHT: Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Search */}
        <button
          onClick={() => onOpenSearch && onOpenSearch()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-surface border border-border rounded-xl text-xs font-medium text-text-secondary cursor-pointer transition-all shadow-xs hover:text-text hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-focus-ring"
          title="Search (Ctrl+K)"
        >
          <span style={{ fontSize: '0.85rem' }}>🔍</span>
          <span className="hidden sm:inline">Search</span>
          <span
            className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-bg border border-border text-[10px] font-bold text-primary"
          >
            <kbd style={{ fontFamily: 'inherit' }}>Ctrl</kbd>+<kbd style={{ fontFamily: 'inherit' }}>K</kbd>
          </span>
        </button>

        {/* Multi-Business Switcher */}
        {myBusinesses.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => {
                if (myBusinesses.length > 1) {
                  setBusinessDropdownOpen(!businessDropdownOpen);
                }
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-surface rounded-xl text-xs font-bold text-text border border-border transition-all max-w-[160px] shadow-xs focus-visible:outline-2 focus-visible:outline-focus-ring ${
                myBusinesses.length > 1 ? 'cursor-pointer hover:border-primary/40' : 'cursor-default'
              }`}
              title={myBusinesses.length > 1 ? "Switch active business workspace" : `Enterprise Workspace: ${brandName}`}
            >
              <span>🏢</span>
              <span
                className="hidden md:block truncate max-w-[100px]"
              >
                {isSwitching ? 'Switching…' : brandName}
              </span>
              {myBusinesses.length > 1 && (
                <ChevronDown
                  className={`w-3 h-3 shrink-0 text-text-secondary transition-transform duration-200 ${businessDropdownOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            <AnimatePresence>
              {businessDropdownOpen && myBusinesses.length > 1 && (
                <>
                  <div
                    onClick={() => setBusinessDropdownOpen(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute right-0 top-[calc(100%+8px)] w-[280px] bg-surface border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden text-text"
                  >
                    <div
                      className="px-3.5 py-3 border-b border-border bg-bg"
                    >
                      <span
                        className="text-[11px] font-bold text-primary uppercase tracking-wider"
                      >
                        Workspaces ({myBusinesses.length})
                      </span>
                    </div>
                    <div style={{ maxHeight: '280px', overflowY: 'auto', padding: '6px' }}>
                      {myBusinesses.map((b) => {
                        const isActive = b.id === user?.organizationId;
                        return (
                          <div
                            key={b.id}
                            onClick={() => handleSelectBusiness(b.id)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-colors mb-1 ${
                              isActive
                                ? 'bg-primary/10 border border-primary/30 text-primary font-bold'
                                : 'hover:bg-bg border border-transparent text-text'
                            }`}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <strong
                                className="text-xs truncate block"
                              >
                                {b.name}
                              </strong>
                              {(b.brand_profile?.industry || b.settings?.category) && (
                                <span className="text-[11px] text-text-muted">
                                  {b.brand_profile?.industry || b.settings?.category}
                                </span>
                              )}
                            </div>
                            {isActive && (
                              <span className="text-primary font-bold text-xs">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* AI Automation Toggle */}
        <button
          onClick={toggleAutomation}
          disabled={isTogglingAutomation}
          className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            isAutomationActive
              ? 'bg-success/15 text-success border-success/30'
              : 'bg-surface text-text-secondary border-border hover:text-text'
          }`}
          title={isTogglingAutomation ? 'Updating automation status...' : 'Toggle AI automation'}
        >
          <span
            className={isAutomationActive ? 'pulse-dot' : ''}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isAutomationActive ? 'var(--success)' : 'var(--text-muted)',
              flexShrink: 0,
            }}
          />
          <span className="hidden md:inline">{isAutomationActive ? 'AI: Active' : 'AI: Paused'}</span>
        </button>

        {/* Theme Toggle (Light / Dark / System mode switch) */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={onOpenNotifications}
          className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-border bg-surface cursor-pointer text-text-secondary hover:text-text transition-all shadow-xs focus-visible:outline-2 focus-visible:outline-focus-ring"
          title={unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}` : "Notifications"}
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-on text-[10px] font-bold flex items-center justify-center border-2 border-surface shadow-sm animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Create Post */}
        <button
          onClick={onCreatePost}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-on border border-primary/40 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-sm hover:opacity-90 active:scale-95 focus-visible:outline-2 focus-visible:outline-focus-ring"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Create Post</span>
        </button>

        {/* User Avatar */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            className="w-9 h-9 rounded-full bg-primary text-primary-on flex items-center justify-center text-xs font-black cursor-pointer overflow-hidden shadow-sm flex-shrink-0 border border-border focus-visible:outline-2 focus-visible:outline-focus-ring"
            title={user?.name || `${brandName} Admin`}
          >
            {(organizationLogo || logoUrl) ? (
              <img
                src={organizationLogo || logoUrl}
                alt=""
                onError={(event) => { event.currentTarget.style.display = 'none'; }}
                className="w-full h-full object-cover"
              />
            ) : (
              (user?.name || brandName || 'AA').slice(0, 2).toUpperCase()
            )}
          </button>
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-surface text-text backdrop-blur-xl p-2 shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-border mb-1">
                  <div className="text-sm font-bold text-text truncate">{user?.name || 'Account'}</div>
                  <div className="text-xs text-text-secondary truncate">{user?.email || ''}</div>
                </div>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); navigate(isAdmin ? '/dashboard' : '/onboarding'); }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-text-secondary hover:text-text hover:bg-bg transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-primary" /> {isAdmin ? 'Admin dashboard' : 'Setup wizard'}
                </button>
                <button
                  type="button"
                  onClick={() => { setProfileOpen(false); logout(); navigate('/'); }}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
