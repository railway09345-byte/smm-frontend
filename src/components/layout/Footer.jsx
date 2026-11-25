import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useContent } from '../../contexts/ContentContext';

export function Footer() {
  const { user, hasCompletedBrandSetup } = useAuth();
  const { brandProfile } = useContent() || {};
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

  return (
    <footer className="relative bg-surface border-t border-border pt-16 pb-12 overflow-hidden text-text">
      {/* Soft ambient background glow */}
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-t from-primary-soft/30 via-highlight/15 to-transparent blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand Col (4 cols) */}
          <div className="md:col-span-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent text-primary-on shadow-md shadow-primary/20 ring-2 ring-primary-soft overflow-hidden shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt="" onError={(event) => { event.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover" />
                ) : (
                  <Sparkles className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="font-extrabold text-text text-lg tracking-tight">
                {brandName} <span className="text-primary">AI</span>
              </span>
            </div>

            <p className="text-sm text-text-secondary max-w-sm leading-relaxed font-normal">
              The autonomous AI content generation, visual synthesis & approval engine designed for high-conversion modern businesses.
            </p>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/25">
              <ShieldCheck className="w-3.5 h-3.5 text-success" />
              <span>SOC2 Type II & Meta Graph API Certified</span>
            </div>
          </div>

          {/* Links Col 1 (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">Platform</h4>
            <ul className="space-y-2 text-xs font-medium text-text-secondary">
              <li><Link to="/features" className="hover:text-primary transition font-semibold">Features</Link></li>
              <li><Link to="/onboarding" className="hover:text-primary transition font-semibold">Setup Wizard</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition font-semibold">Pricing Plans</Link></li>
            </ul>
          </div>

          {/* Links Col 2 (3 cols) */}
          <div className="md:col-span-3 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">Brand Workspace</h4>
            <ul className="space-y-2 text-xs font-medium text-text-secondary">
              <li className="font-bold text-text">{brandName} Workspace</li>
              <li>{brandProfile?.location || 'Digital Store Location'}</li>
              <li>Autonomous Scheduler: <span className="text-success font-bold">Active 24/7</span></li>
              <li>Multi-Channel: Instagram, Facebook, YouTube, Pinterest</li>
            </ul>
          </div>

          {/* Links Col 3 (2 cols) */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text">Access</h4>
            <ul className="space-y-2 text-xs font-medium text-text-secondary">
              <li><Link to="/auth?view=login" className="hover:text-primary transition font-semibold">Member Sign In</Link></li>
              <li><Link to="/auth?view=signup" className="hover:text-primary transition font-semibold">Create Account</Link></li>
              <li><Link to="/onboarding" className="hover:text-primary transition font-semibold">Setup Wizard</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <span>© 2026 {brandName} AI. Autonomous Marketing Studio. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="hover:text-primary transition font-semibold">Privacy Policy</Link>
            <span>•</span>
            <Link to="/" className="hover:text-primary transition font-semibold">Home</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


