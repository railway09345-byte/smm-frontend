import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Zap, LogIn, LogOut, Crown, CreditCard, ShieldCheck, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ThemeToggle } from '../common/ThemeToggle';

export function Navbar({ centerNav = null }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, isSuperAdmin, hasSubscribed, hasCompletedBrandSetup, logout } = useAuth();
  const { brandProfile } = useContent() || {};
  const { isDark } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Default branding is Aminoid AI with the default icon (no custom logo image).
  // Only after the user enters their brand details will it show the custom brand profile and brand logo.
  const isCustomized = user?.id ? (localStorage.getItem(`sacp_brand_customized_${user.id}`) === 'true') : false;
  const hasUserConfiguredBrand = Boolean(
    isCustomized &&
    hasCompletedBrandSetup &&
    brandProfile?.name &&
    !brandProfile.name.toLowerCase().includes('zenith') &&
    brandProfile.name !== 'Aminoid AI'
  );

  const brandName = hasUserConfiguredBrand ? brandProfile.name : 'Aminoid AI';
  const logoUrl = hasUserConfiguredBrand ? (brandProfile?.logoUrl || null) : null;

  // Navigation items: Home, Features, Pricing, and Setup only after subscribing
  const navItems = useMemo(() => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' }
    ];
    if (hasSubscribed) {
      items.push({ label: 'Brand Setup', href: '/onboarding' });
    }
    return items;
  }, [hasSubscribed]);

  // Determine user destination button based on the mandatory progression
  const getDestination = () => {
    if (isSuperAdmin) {
      return { path: '/superadmin', label: 'SuperAdmin Console', icon: Crown };
    }
    if (!hasSubscribed) {
      return { path: '/pricing', label: 'Subscribe Plan', icon: CreditCard };
    }
    if (!hasCompletedBrandSetup) {
      return { path: '/onboarding', label: 'Brand Setup', icon: Sparkles };
    }
    return { path: '/dashboard', label: 'Dashboard', icon: ShieldCheck };
  };

  const dest = getDestination();
  const DestIcon = dest.icon;

  return (
    <header className="sticky top-0 z-50 px-4 sm:px-6 py-3.5 backdrop-blur-2xl border-b bg-surface/90 border-border text-text transition-all shadow-xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <Link to="/" className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-focus-ring rounded-xl">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-on shadow-md ring-2 ring-primary/20 overflow-hidden shrink-0 transition-transform group-hover:scale-105">
            {logoUrl ? (
              <img src={logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />
            ) : (
              <Sparkles className="w-5 h-5 text-primary-on" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-tight text-text text-base">
                {brandName}
              </span>
              <span className="hidden sm:inline-flex text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-on-primary-soft border border-border">
                AI Studio
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium">
              <span>Autonomous Social Studio</span>
              <span className="text-text-muted">•</span>
              <span className="text-success font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping inline-block" />
                Live
              </span>
            </div>
          </div>
        </Link>

        {/* Center Nav - Clean Desktop Pill Bar */}
        {centerNav ? (
          <div className="hidden md:flex items-center justify-center">
            {centerNav}
          </div>
        ) : (
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-surface-raised border border-border shadow-xs">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-primary text-primary-on shadow-xs font-semibold'
                      : 'text-text-secondary hover:text-text hover:bg-surface-selected font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {/* Right CTA Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <ThemeToggle />

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to={dest.path}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <DestIcon className="w-4 h-4" />
                <span>{dest.label}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={() => logout()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected hover:text-text transition-all shadow-2xs focus-visible:outline-2 focus-visible:outline-focus-ring cursor-pointer"
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary bg-surface border border-border hover:text-text hover:bg-surface-selected transition-all shadow-2xs focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </Link>
              <Link
                to="/login?mode=signup"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-primary text-primary-on hover:brightness-105 active:scale-95 transition-all shadow-sm focus-visible:outline-2 focus-visible:outline-focus-ring"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Get Started</span>
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl border border-border bg-surface text-text hover:bg-surface-selected transition-colors focus-visible:outline-2 focus-visible:outline-focus-ring"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-border space-y-2 animate-in fade-in-50">
          <div className="flex flex-col gap-1 p-1 bg-surface-raised rounded-xl border border-border">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-on font-semibold'
                      : 'text-text-secondary hover:text-text hover:bg-surface-selected font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-2 flex flex-col gap-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={dest.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-on hover:brightness-105"
                >
                  <DestIcon className="w-4 h-4" />
                  <span>{dest.label}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected text-center"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log In</span>
                </Link>
                <Link
                  to="/login?mode=signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold bg-primary text-primary-on hover:brightness-105 text-center"
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Started</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


