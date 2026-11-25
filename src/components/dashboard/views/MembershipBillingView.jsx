import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Zap,
  Check,
  Activity,
  Layers,
  Users,
  Video,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../common/Toast';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';
import { downloadInvoicePDF } from '../../../utils/generateInvoicePDF';
import { api } from '../../../services/api';

export function MembershipBillingView() {
  const { user, currentBusiness, membership, updateMembership } = useAuth();
  const { showToast } = useToast();
  const [payingTier, setPayingTier] = useState(null); // tracks which tier is loading

  const handleDownloadInvoice = (invoiceInfo) => {
    try {
      downloadInvoicePDF({
        ...invoiceInfo,
        customerName: user?.full_name || user?.name || 'Account Owner',
        customerEmail: user?.email || '',
        organization: currentBusiness?.name || 'Social AI Workspace'
      });
      showToast(`Invoice ${invoiceInfo.invoiceNumber} downloaded as PDF.`, 'success');
    } catch (err) {
      console.error('Invoice download error:', err);
      showToast('Failed to generate PDF. Please try again.', 'error');
    }
  };

  /**
   * Razorpay Checkout Flow:
   * 1. Call backend /payments/create-order → get Razorpay order details
   * 2. Open Razorpay checkout modal
   * 3. On success, call backend /payments/verify → upgrade subscription
   */
  const handleRazorpayCheckout = async (tier, displayName, amountDisplay) => {
    if (typeof window.Razorpay === 'undefined') {
      showToast('Payment gateway not loaded. Please refresh and try again.', 'error');
      return;
    }

    setPayingTier(tier);
    try {
      // Step 1: Create order on backend
      const order = await api.payments.createOrder(tier);

      if (order.test_mode) {
        // Test mode — no real payment gateway
        showToast(`[Test Mode] ${displayName} order created. No real payment processed.`, 'info');
        updateMembership('Active', displayName, amountDisplay);
        setPayingTier(null);
        return;
      }

      // Step 2: Open Razorpay checkout modal
      const options = {
        key: order.razorpay_key_id || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'Social AI Platform',
        description: `Upgrade to ${displayName}`,
        order_id: order.razorpay_order_id,
        prefill: {
          name: user?.full_name || user?.name || '',
          email: user?.email || '',
        },
        theme: { color: '#6366f1' },
        handler: async (response) => {
          // Step 3: Verify payment on backend
          try {
            const result = await api.payments.verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              tier
            );
            updateMembership('Active', displayName, amountDisplay);
            showToast(`🎉 ${result.message || `Upgraded to ${displayName} successfully!`}`, 'success');
          } catch (verifyErr) {
            console.error('Payment verification failed:', verifyErr);
            showToast('Payment received but verification failed. Please contact support with your payment ID: ' + response.razorpay_payment_id, 'error');
          } finally {
            setPayingTier(null);
          }
        },
        modal: {
          ondismiss: () => {
            showToast('Payment cancelled.', 'info');
            setPayingTier(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response) => {
        console.error('Razorpay payment failed:', response.error);
        showToast(`Payment failed: ${response.error.description || 'Unknown error'}`, 'error');
        setPayingTier(null);
      });
      rzp.open();

    } catch (err) {
      console.error('Razorpay checkout error:', err);
      showToast(err?.message || 'Failed to initiate payment. Please try again.', 'error');
      setPayingTier(null);
    }
  };

  const handleRenew = () => handleRazorpayCheckout('pro', 'Pro Growth Plan', '₹4,999 / month');
  const handleUpgrade = () => handleRazorpayCheckout('enterprise', 'Enterprise Studio Tier', '₹9,999 / month');

  const isActive = membership?.status === 'Active';

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="ACCOUNT & SECURITY" badgeIcon={CreditCard}
        title="Membership & Billing" subtitle="Manage your subscription tiers, monthly quotas, billing history, and sandbox simulation states." actions={
          <Link
            to="/pricing" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface transition-all shadow-sm" >
            <span>View Public Pricing</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        }
      />

      {/* Grid 2: Current Plan & Quota Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <SpotlightCard className="p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Current Plan Tier</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  isActive
                    ? 'bg-bg text-primary border-border' : 'bg-rose-50 text-rose-700 border-rose-200' }`}
              >
                {membership?.status || 'Active'} Status
              </span>
            </div>

            <div>
              <div className="text-3xl font-black text-text tracking-tight">
                {membership?.plan || 'Pro Growth Plan'}
              </div>
              <div className="text-sm font-semibold text-text-muted mt-1">
                {membership?.price || '$79 / month'} • Billed Monthly
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleRenew} disabled={!!payingTier}
              >
                {payingTier === 'pro' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                {payingTier === 'pro' ? 'Opening Razorpay...' : 'Renew Plan (₹4,999/mo)'}
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary/10 border border-primary text-primary font-bold text-xs transition-colors shadow-xs disabled:opacity-60 disabled:cursor-not-allowed" onClick={handleUpgrade} disabled={!!payingTier}
              >
                {payingTier === 'enterprise' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-primary" />}
                {payingTier === 'enterprise' ? 'Opening Razorpay...' : 'Upgrade to Enterprise (₹9,999/mo)'}
              </button>
            </div>
          </div>

          {/* Sandbox Toggle Simulator */}
          <div className="pt-4 border-t border-border space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Sandbox State Simulator
              </span>
              <span className="text-[10px] text-text-muted">Testing Environment Only</span>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-1.5 px-3 rounded-lg bg-bg hover:bg-bg text-primary border border-border text-xs font-bold transition-colors" onClick={() => {
                  updateMembership('Active', 'Pro Growth Plan', '$79 / month');
                  showToast('Simulating active membership state.', 'info');
                }}
              >
                Set Active State
              </button>
              <button
                className="flex-1 py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors" onClick={() => {
                  updateMembership('Expired', 'Pro Growth Plan', '$79 / month');
                  showToast('Simulating expired membership state.', 'warning');
                }}
              >
                Set Expired State
              </button>
            </div>
          </div>
        </SpotlightCard>

        {/* Quota Usage Meter */}
        <SpotlightCard className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text">Monthly Quota Consumption</h3>
              <p className="text-xs text-text-muted">Resource allocation for current billing period</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary">
              Renews in 21 days
            </span>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" />
                  Autonomous AI Daily Batches
                </span>
                <span className="text-text"><strong>84</strong> / 150 (56%)</span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '56%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" />
                  Connected Social Accounts
                </span>
                <span className="text-text"><strong>4</strong> / 6 active</span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '66%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-purple-500" />
                  HD Video Reel Renderings
                </span>
                <span className="text-text"><strong>28</strong> / 50 used</span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-primary/100 rounded-full" style={{ width: '56%' }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-text-secondary flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  Team Collaborator Seats
                </span>
                <span className="text-text"><strong>2</strong> / 5 seats</span>
              </div>
              <div className="w-full h-2 bg-bg rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: '40%' }} />
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Invoices Table SpotlightCard */}
      <SpotlightCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-bold text-text">Billing & Invoice History</h3>
          <p className="text-xs text-text-muted">Download audited statements and receipts</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-text-muted font-bold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-3">Invoice Date</th>
                <th className="px-6 py-3">Plan Details</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3">Payment Method</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-text-secondary">
              <tr className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 font-semibold text-text">Oct 01, 2026</td>
                <td className="px-6 py-4">Pro Growth Plan — Monthly</td>
                <td className="px-6 py-4 font-bold text-text">$79.00 USD</td>
                <td className="px-6 py-4 text-text-muted">Corporate Visa (•••• 4242)</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
                    Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/10 border border-primary text-primary font-bold text-[11px] transition-colors shadow-xs"
                    onClick={() => handleDownloadInvoice({
                      date: 'Oct 01, 2026',
                      invoiceNumber: 'INV-2026-1001',
                      planName: 'Pro Growth Plan — Monthly',
                      amount: '$79.00 USD',
                      paymentMethod: 'Corporate Visa (•••• 4242)',
                      status: 'Paid'
                    })}
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </button>
                </td>
              </tr>
              <tr className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 font-semibold text-text">Sep 01, 2026</td>
                <td className="px-6 py-4">Pro Growth Plan — Monthly</td>
                <td className="px-6 py-4 font-bold text-text">$79.00 USD</td>
                <td className="px-6 py-4 text-text-muted">Corporate Visa (•••• 4242)</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
                    Paid
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/10 border border-primary text-primary font-bold text-[11px] transition-colors shadow-xs"
                    onClick={() => handleDownloadInvoice({
                      date: 'Sep 01, 2026',
                      invoiceNumber: 'INV-2026-0901',
                      planName: 'Pro Growth Plan — Monthly',
                      amount: '$79.00 USD',
                      paymentMethod: 'Corporate Visa (•••• 4242)',
                      status: 'Paid'
                    })}
                  >
                    <Download className="w-3 h-3" />
                    Download PDF
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
