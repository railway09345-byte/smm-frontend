import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Home, ArrowLeft, Compass } from 'lucide-react';
import FadeContent from '../components/ui/FadeContent';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Aurora ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[15%] -left-[10%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-primary/20 via-accent/15 to-transparent blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-t from-primary-soft/30 to-highlight/10 blur-[120px]" />
      </div>

      <FadeContent effect="mist" duration={1.1} trigger="mount" className="relative z-10 flex flex-col items-center text-center px-6 max-w-lg">
        {/* Brand logo */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl bg-gradient-to-tr from-primary to-accent text-primary-on"
        >
          <Compass className="w-8 h-8 text-primary-on" />
        </div>

        {/* 404 number */}
        <div
          className="text-[9rem] font-black leading-none tracking-tighter select-none bg-gradient-to-r from-primary via-accent to-highlight bg-clip-text text-transparent"
        >
          404
        </div>

        <h1 className="text-2xl font-bold text-text mt-2 mb-3">
          Page not found
        </h1>
        <p className="text-text-secondary text-base leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-border text-text bg-surface hover:bg-surface-selected transition-all shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-primary-on bg-primary hover:brightness-105 transition-all shadow-sm cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>
        </div>

        {/* Quick nav links */}
        <div className="mt-12 w-full">
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">
            Quick links
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { to: '/', label: 'Home' },
              { to: '/pricing', label: 'Pricing' },
              { to: '/auth', label: 'Sign In' },
              { to: '/onboarding', label: 'Setup Wizard' },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-selected transition-all shadow-2xs"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </FadeContent>
    </div>
  );
}
