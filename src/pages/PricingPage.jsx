import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Check, Zap, Loader2 } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/common/Toast';
import { useTheme } from '../contexts/ThemeContext';
import AuroraBackground from '../components/ui/AuroraBackground';
import SpotlightCard from '../components/ui/SpotlightCard';
import BorderBeam from '../components/ui/BorderBeam';
import MagneticButton from '../components/ui/MagneticButton';
import ShinyText from '../components/ui/ShinyText';
import { staggerContainerVariants, staggerItemVariants, slideUpVariants } from '../utils/motionVariants';
import { api } from '../services/api';

// Map plan name → Razorpay tier key used by backend
const PLAN_TIER_MAP = {
  'Starter Boutique': 'starter',
  'Pro Growth Plan': 'pro',
  'Multi-Brand Enterprise': 'enterprise',
};

export function PricingPage() {
  const { membership, updateMembership, isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleSelectPlan = async (planName, price) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { selectedPlan: { planName, price } } });
      return;
    }

    if (typeof window.Razorpay === 'undefined') {
      // Razorpay script not loaded yet — try loading it dynamically
      await new Promise((resolve, reject) => {
        const existing = document.querySelector('script[src*="checkout.razorpay.com"]');
        if (existing) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      }).catch(() => {
        showToast('Payment gateway could not be loaded. Check your internet connection.', 'error');
        setLoadingPlan(null);
        return;
      });

      if (typeof window.Razorpay === 'undefined') {
        showToast('Payment gateway not loaded. Please refresh and try again.', 'error');
        setLoadingPlan(null);
        return;
      }
    }

    const tierKey = PLAN_TIER_MAP[planName];
    setLoadingPlan(planName);

    try {
      // Step 1: Create Razorpay order on backend
      const order = await api.payments.createOrder(tierKey);

      if (order.test_mode) {
        // Test mode — no credentials yet, just activate locally
        await updateMembership('Active', planName, price);
        showToast(`[Test Mode] ${planName} activated! Configure your brand details.`, 'success');
        navigate('/onboarding', { state: { paymentSuccess: true, planName, price }, replace: true });
        setLoadingPlan(null);
        return;
      }

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: order.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Social AI Platform',
        description: planName,
        order_id: order.razorpay_order_id,
        prefill: {
          name: user?.full_name || user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          // Step 3: Verify payment on backend → upgrade subscription
          try {
            const result = await api.payments.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              tierKey
            );
            await updateMembership('Active', planName, price);
            showToast(`🎉 ${result.message || `${planName} activated successfully!`}`, 'success');
            navigate('/onboarding', { state: { paymentSuccess: true, planName, price }, replace: true });
          } catch (verifyErr) {
            showToast('Payment received but verification failed. Contact support with payment ID: ' + response.razorpay_payment_id, 'error');
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.', 'info');
            setLoadingPlan(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        showToast(`Payment failed: ${response.error.description || 'Unknown error'}`, 'error');
        setLoadingPlan(null);
      });
      rzp.open();

    } catch (err) {
      showToast(err?.message || 'Unable to initiate payment. Please try again.', 'error');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="relative min-h-screen bg-bg text-text font-sans selection:bg-primary/10 selection:text-primary flex flex-col transition-colors duration-200">
      {/* Subtle Ambient Tech Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[60vw] h-[400px] rounded-full bg-gradient-to-b from-primary/12 via-accent/8 to-transparent blur-[140px]" />
      </div>

      <Navbar />

      <main className="flex-1 relative z-10 py-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header Title with Motion */}
          <motion.div
            variants={slideUpVariants}
            initial="hidden"
            animate="visible"
            className="text-center max-w-2xl mx-auto space-y-3"
          >
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-primary-soft text-on-primary-soft border border-border">
              <Sparkles className="w-3.5 h-3.5 text-accent" />
              <span>Membership Plans</span>
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-text leading-tight">
              Predictable, High-ROI Pricing for Modern Brands
            </h1>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed font-normal">
              Scale daily social storytelling with automated creative synthesis, multi-channel scheduling, and editorial review.
            </p>
          </motion.div>

          {/* Pricing Bento Grid (3 Cards) */}
          <motion.div
            variants={staggerContainerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
          >
            {/* TIER 1: STARTER */}
            <motion.div variants={staggerItemVariants} className="flex">
              <div className="p-6 sm:p-8 flex flex-col justify-between w-full rounded-2xl border border-border bg-surface shadow-sm hover:border-primary/40 transition-all">
                <div className="space-y-4">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-raised text-text-secondary border border-border">
                    Starter
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-text">Boutique Store</h3>
                    <p className="text-xs text-text-secondary mt-1 font-normal">
                      For single store locations launching automated social feeds.
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-4xl font-extrabold text-text">$29</span>
                    <span className="text-xs text-text-muted font-medium">/ month</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-border text-xs text-text-secondary font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>1 Daily Content Batch (Image, Reel, Text)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>3 Connected Social Channels</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Content Studio & Copy Simulator</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Standard Approval Queue</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('Starter Boutique', '$29 / month')}
                    disabled={!!loadingPlan}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-text bg-surface-raised border border-border hover:bg-surface-selected active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingPlan === 'Starter Boutique' ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Opening Razorpay...</span>
                    ) : 'Select Starter Plan'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* TIER 2: GROWTH (POPULAR) */}
            <motion.div variants={staggerItemVariants} className="flex">
              <div className="p-6 sm:p-8 flex flex-col justify-between w-full rounded-2xl border-2 border-primary bg-surface shadow-xl relative ring-4 ring-primary/10">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-on-primary-soft border border-border">
                      Pro Growth
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent text-white">
                      Most Popular • 98% ROI
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">High-Growth Brand</h3>
                    <p className="text-xs text-text-secondary mt-1 font-normal">
                      Full autonomous pipeline with video synthesis and multi-network dispatches.
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-4xl font-extrabold text-primary">$79</span>
                    <span className="text-xs text-text-muted font-medium">/ month</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-border text-xs text-text-secondary font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Unlimited Autonomous AI Batches</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>3 Connected Platforms (Instagram, Facebook, YouTube)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Google Gemini 2.5 Flash & Veo Video Studio</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Peak Resonance Engagement Auto-Scheduler</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Cloudinary Cloud Media Vault</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('Pro Growth Plan', '$79 / month')}
                    disabled={!!loadingPlan}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/25 cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingPlan === 'Pro Growth Plan' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /><span>Opening Razorpay...</span></>
                    ) : (
                      <><Zap className="w-4 h-4 text-primary-on" /><span>Activate Pro Growth</span></>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* TIER 3: ENTERPRISE */}
            <motion.div variants={staggerItemVariants} className="flex">
              <div className="p-6 sm:p-8 flex flex-col justify-between w-full rounded-2xl border border-border bg-surface shadow-sm hover:border-primary/40 transition-all">
                <div className="space-y-4">
                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-surface-raised text-text-secondary border border-border">
                    Scale & Agency
                  </span>
                  <div>
                    <h3 className="text-xl font-bold text-text">Multi-Store Chain</h3>
                    <p className="text-xs text-text-secondary mt-1 font-normal">
                      Multi-location enterprise orchestration and customized AI models.
                    </p>
                  </div>

                  <div className="flex items-baseline gap-1 py-2">
                    <span className="text-4xl font-extrabold text-text">$199</span>
                    <span className="text-xs text-text-muted font-medium">/ month</span>
                  </div>

                  <ul className="space-y-2.5 pt-4 border-t border-border text-xs text-text-secondary font-medium">
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Multi-Brand & Chain Workspace</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Dedicated Team Roles & Permissions</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Direct Meta & YouTube API Keys</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>Priority 24/7 Support & SLA</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={() => handleSelectPlan('Multi-Brand Enterprise', '$199 / month')}
                    disabled={!!loadingPlan}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-text bg-surface-raised border border-border hover:bg-surface-selected active:scale-95 transition-all shadow-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-focus-ring disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loadingPlan === 'Multi-Brand Enterprise' ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" />Opening Razorpay...</span>
                    ) : 'Select Enterprise'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default PricingPage;
