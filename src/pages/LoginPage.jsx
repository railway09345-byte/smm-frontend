import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Building,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Crown,
  CheckCircle2,
  Zap,
  ArrowLeft,
  X,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { AuroraBackground } from '../components/ui/AuroraBackground';
import { SpotlightCard } from '../components/ui/SpotlightCard';

export function LoginPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();

  // Mode: 'login' | 'signup'
  const modeFromQuery = searchParams.get('mode') || searchParams.get('view');
  const [mode, setMode] = useState(modeFromQuery === 'signup' ? 'signup' : 'login');

  // Shared state
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Login states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resetStep, setResetStep] = useState('request'); // 'request' | 'reset'
  const [isResetting, setIsResetting] = useState(false);

  // Signup states
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [accountType, setAccountType] = useState('admin'); // 'admin' | 'super_admin'
  const [customOrgName, setCustomOrgName] = useState('');
  const [availableBusinesses, setAvailableBusinesses] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('custom');


  // Preserve redirect path if user was intercepted
  const returnTo = (() => {
    const from = location.state?.from;
    if (!from || typeof from.pathname !== 'string' || !from.pathname.startsWith('/')) {
      return '/';
    }
    return `${from.pathname}${from.search || ''}${from.hash || ''}`;
  })();

  useEffect(() => {
    const qMode = searchParams.get('mode') || searchParams.get('view');
    if (qMode === 'signup' || qMode === 'login') {
      setMode(qMode);
    }
  }, [searchParams]);

  useEffect(() => {
    api.auth.getAvailableBusinesses()
      .then((res) => {
        if (Array.isArray(res) && res.length > 0) {
          setAvailableBusinesses(res);
        }
      })
      .catch((err) => console.warn('Could not load businesses:', err));
  }, []);

  const switchMode = (newMode) => {
    setMode(newMode);
    setSearchParams({ mode: newMode });
  };

  /**
   * UNIFIED LOGIN:
   * Authenticate without role constraints, then dynamically route based on backend role.
   */
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(loginEmail, loginPassword, rememberMe);
      const role = String(res?.role || res?.user?.rawRole || '').toLowerCase();

      // Case 1: SuperAdmin Master Governance
      if (role === 'super_admin' || role === 'superadmin') {
        showToast('Master authority verified. Welcome SuperAdmin!', 'success');
        navigate('/superadmin', { replace: true });
        return;
      }

      // Case 2: Enterprise Admin & Standard Workspace Roles
      const userId = res?.user?.id;
      const isSubscribed = userId ? localStorage.getItem(`sacp_subscribed_${userId}`) === 'true' : false;
      const isOnboarded = userId ? localStorage.getItem(`sacp_onboarded_${userId}`) === 'true' : false;

      if (!isSubscribed) {
        showToast('Welcome! Step 1: Select your subscription tier to activate AI features.', 'info');
        navigate('/pricing', { state: { requiredAction: 'subscribe' }, replace: true });
      } else if (!isOnboarded) {
        showToast('Step 2: Please configure your brand identity to activate the engine.', 'info');
        navigate('/onboarding', { state: { requiredAction: 'brand_setup' }, replace: true });
      } else {
        showToast('Welcome back! Dashboard loaded.', 'success');
        navigate(returnTo === '/' ? '/dashboard' : returnTo, { replace: true });
      }
    } catch (err) {
      showToast(err.message || 'Authentication failed. Please check your credentials.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * UNIFIED SIGNUP:
   * Provisions Enterprise Admin or SuperAdmin account and routes to respective setup flow.
   */
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupPassword) {
      showToast('Please complete all registration fields.', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const targetRole = accountType === 'super_admin' ? 'super_admin' : 'admin';
      const resolvedOrg = targetRole === 'admin'
        ? (customOrgName.trim() || `${signupName.trim()}'s Workspace`)
        : null;

      const res = await signup({
        name: signupName.trim(),
        email: signupEmail.trim(),
        password: signupPassword,
        role: targetRole,
        organizationName: resolvedOrg,
        businessId: (targetRole === 'admin' && selectedBusinessId !== 'custom') ? selectedBusinessId : null
      });

      const role = String(res?.role || targetRole).toLowerCase();

      if (role === 'super_admin' || role === 'superadmin') {
        showToast('SuperAdmin master account created! Welcome to Master Console.', 'success');
        navigate('/superadmin', { replace: true });
        return;
      }

      showToast('Enterprise Admin workspace created! Step 1: Select your subscription plan.', 'success');
      navigate('/pricing', { state: { requiredAction: 'subscribe' }, replace: true });
    } catch (err) {
      showToast(err.message || 'Account registration failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo fill shortcuts for instant evaluation
  const handleFillDemo = (type) => {
    if (type === 'admin') {
      setLoginEmail('admin@socialai.com');
      setLoginPassword('password123');
      showToast('Filled Admin credentials (admin@socialai.com).', 'info');
    } else {
      setLoginEmail('superadmin@socialai.com');
      setLoginPassword('password123');
      showToast('Filled SuperAdmin credentials (superadmin@socialai.com).', 'info');
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email address.', 'error');
      return;
    }
    setIsResetting(true);
    try {
      const res = await api.auth.requestPasswordReset(forgotEmail);
      showToast(res.message || 'Password reset link sent.', 'success');
      if (res.reset_token) {
        setResetToken(res.reset_token);
      }
      setResetStep('reset');
    } catch (err) {
      showToast(err.message || 'Failed to request password reset.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmReset = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      showToast('Please enter both the reset token and new password.', 'error');
      return;
    }
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', 'error');
      return;
    }
    setIsResetting(true);
    try {
      const res = await api.auth.confirmPasswordReset(resetToken, newPassword);
      showToast(res.message || 'Password successfully reset! Please sign in.', 'success');
      setLoginEmail(forgotEmail);
      setLoginPassword(newPassword);
      setIsForgotModalOpen(false);
      setResetStep('request');
      setResetToken('');
      setNewPassword('');
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error');
    } finally {
      setIsResetting(false);
    }
  };

  return (

    <div className="relative min-h-screen bg-bg text-text font-sans selection:bg-primary/10 selection:text-primary flex flex-col justify-between p-4 sm:p-6 md:p-8 transition-colors duration-200">
      {/* Ambient Aurora Glow */}
      <AuroraBackground className="fixed inset-0 pointer-events-none" opacity={isDark ? 0.35 : 0.45} />

      {/* Top Header */}
      <header className="relative z-10 max-w-5xl mx-auto w-full flex items-center justify-between pb-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent text-primary-on shadow-md shadow-primary/30 ring-2 ring-border overflow-hidden shrink-0 transition-transform group-hover:scale-105">
            <Sparkles className="w-5 h-5 text-primary-on" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-text text-base block">
              Social AI
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold text-primary block">
              Unified Portal
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-selected text-text-secondary hover:text-text transition border border-border shadow-2xs text-xs font-semibold"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Home</span>
          </Link>
        </div>
      </header>

      {/* Center Authentication Card */}
      <main className="relative z-10 max-w-lg mx-auto w-full my-auto py-4">
        <SpotlightCard className="p-6 sm:p-8 bg-surface border border-border shadow-lg rounded-3xl">
          {/* Card Header & Pill Mode Switcher */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-border text-primary text-[11px] font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Role-Adaptive Access</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-text">
              {mode === 'login' ? 'Welcome Back' : 'Create Your Account'}
            </h1>
            <p className="text-xs text-text-secondary mt-1.5 max-w-sm mx-auto leading-relaxed">
              {mode === 'login'
                ? 'Sign in with your credentials. Your role (Enterprise Admin or SuperAdmin) is detected automatically.'
                : 'Select your workspace type and enter your details to launch your AI social engine.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-surface-raised rounded-2xl border border-border mb-6 shadow-2xs">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-primary text-primary-on shadow-xs'
                  : 'text-text-secondary hover:text-text hover:bg-surface-selected'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-primary text-primary-on shadow-xs'
                  : 'text-text-secondary hover:text-text hover:bg-surface-selected'
              }`}
            >
              Create Account
            </button>
          </div>

          <AnimatePresence mode="wait">
            {mode === 'login' ? (
              /* ================= LOGIN FORM ================= */
              <motion.form
                key="login-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLoginSubmit}
                className="space-y-4 text-left"
              >
                <div>
                  <label className="block text-xs font-bold text-text mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="name@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-raised text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary transition"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-text">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface-raised text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted dark:text-text-muted hover:text-primary dark:hover:text-white p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-focus-ring dark:bg-surface dark:border-border"
                    />
                    <span className="text-xs text-text-secondary dark:text-text-secondary">Remember on this device</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(loginEmail);
                      setResetStep('request');
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold text-primary-on bg-primary hover:brightness-110 active:scale-[0.99] transition shadow-md shadow-primary/25 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Platform</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Instant Demo Fillers */}
                <div className="pt-4 border-t border-border">
                  <p className="text-[11px] text-center text-text-secondary dark:text-text-secondary font-medium mb-2.5">
                    Testing quick fill credentials:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFillDemo('admin')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-primary bg-primary/10 dark:bg-primary/20 border border-border dark:border-primary/30 hover:bg-primary/10/50 transition"
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Enterprise Admin</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFillDemo('superadmin')}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold text-primary dark:text-accent bg-primary/10 dark:bg-primary/20 border border-border dark:border-primary/30 hover:bg-primary/10/50 transition"
                    >
                      <Crown className="w-3.5 h-3.5" />
                      <span>SuperAdmin</span>
                    </button>
                  </div>
                </div>
              </motion.form>
            ) : (
              /* ================= SIGNUP FORM ================= */
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSignupSubmit}
                className="space-y-4 text-left"
              >
                {/* Account Role Selector */}
                <div>
                  <label className="block text-xs font-bold text-text dark:text-text mb-1.5">
                    Account Classification
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAccountType('admin')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        accountType === 'admin'
                          ? 'border-primary bg-primary-soft text-primary shadow-xs'
                          : 'border-border bg-surface text-text-secondary hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Building className="w-3.5 h-3.5" />
                        <span>Enterprise Admin</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1 leading-tight">
                        Lead workspace, brand profile, AI campaigns
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountType('super_admin')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        accountType === 'super_admin'
                          ? 'border-primary bg-primary-soft text-primary shadow-xs'
                          : 'border-border bg-surface text-text-secondary hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <Crown className="w-3.5 h-3.5" />
                        <span>SuperAdmin</span>
                      </div>
                      <p className="text-[10px] opacity-80 mt-1 leading-tight">
                        Platform root controls, audit telemetry
                      </p>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text dark:text-text mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-muted" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-focus-ring transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text dark:text-text mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-muted" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="jane@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-focus-ring transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text dark:text-text mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-focus-ring transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {accountType === 'admin' && (
                  <div>
                    <label className="block text-xs font-bold text-text dark:text-text mb-1.5">
                      Organization / Brand Name (Optional)
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-text-muted" />
                      <input
                        type="text"
                        value={customOrgName}
                        onChange={(e) => setCustomOrgName(e.target.value)}
                        placeholder="e.g. Apex Media Labs"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-focus-ring transition"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold text-primary-on bg-primary hover:brightness-110 active:scale-[0.99] transition shadow-md shadow-primary/25 disabled:opacity-60 cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>
                        {accountType === 'super_admin'
                          ? 'Provision SuperAdmin Account'
                          : 'Create Enterprise Admin Account'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </SpotlightCard>

        {/* Forgot Password / Reset Modal */}
        <AnimatePresence>
          {isForgotModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/70 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-md bg-surface border border-border text-text rounded-2xl shadow-2xl p-6 overflow-hidden"
              >
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary-soft text-primary">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text">
                        {resetStep === 'request' ? 'Reset Password' : 'Enter New Password'}
                      </h3>
                      <p className="text-xs text-text-secondary">
                        {resetStep === 'request'
                          ? 'Enter your account email to receive reset instructions'
                          : 'Enter the reset token and your new password'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setResetStep('request');
                    }}
                    className="p-1.5 rounded-lg hover:bg-surface-selected text-text-muted hover:text-text transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {resetStep === 'request' ? (
                  <form onSubmit={handleRequestReset} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text mb-1.5">
                        Account Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="you@company.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-raised text-text text-xs sm:text-sm placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsForgotModalOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-selected transition cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isResetting}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold text-primary-on bg-primary hover:brightness-110 transition shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-2"
                      >
                        {isResetting ? (
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Send Reset Token</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                    <div className="pt-2 text-center">
                      <button
                        type="button"
                        onClick={() => setResetStep('reset')}
                        className="text-xs text-primary hover:underline"
                      >
                        Already have a reset token? Click here
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleConfirmReset} className="mt-4 space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-text mb-1.5">
                        Reset Token
                      </label>
                      <input
                        type="text"
                        required
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                        placeholder="Paste reset token here"
                        className="w-full px-3.5 py-2.5 font-mono text-xs rounded-xl border border-border bg-surface-raised text-text focus:outline-hidden focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text mb-1.5">
                        New Password (Min 8 Characters)
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-surface-raised text-text text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setResetStep('request')}
                        className="text-xs text-text-secondary hover:text-text transition cursor-pointer"
                      >
                        ← Back
                      </button>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsForgotModalOpen(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text hover:bg-surface-selected transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isResetting}
                          className="px-5 py-2.5 rounded-xl text-xs font-bold text-primary-on bg-primary hover:brightness-110 transition shadow-xs disabled:opacity-60 cursor-pointer flex items-center gap-2"
                        >
                          {isResetting ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <span>Set New Password</span>
                              <CheckCircle2 className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer copyright */}
      <footer className="relative z-10 text-center py-4 text-xs text-text-secondary dark:text-text-muted">
        © {new Date().getFullYear()} Social AI Autonomous Studio. All rights reserved.
      </footer>
    </div>
  );
}

export default LoginPage;
