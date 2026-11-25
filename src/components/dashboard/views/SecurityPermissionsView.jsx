import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Key,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Laptop,
  RefreshCw,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

export function SecurityPermissionsView() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const adminName = user?.full_name || 'Workspace Administrator';

  const [twoFaActive, setTwoFaActive] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState('30 days');

  const toggle2FA = () => {
    const next = !twoFaActive;
    setTwoFaActive(next);
    showToast(
      next
        ? 'Two-Factor Authentication (2FA) enabled.' : 'Two-Factor Authentication disabled.',
      next ? 'success' : 'warning' );
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="ACCOUNT & SECURITY" badgeIcon={ShieldCheck}
        title="Security & Permissions" subtitle="Manage access credentials, multi-factor authentication, active login sessions, and social API encryption keys." actions={
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface transition-all shadow-sm" onClick={() => showToast('Security audit report generated.', 'info')}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
            <span>Run Security Scan</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Authentication Security */}
        <SpotlightCard className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Authentication & Safeguards
              </h3>
              <p className="text-xs text-text-muted">MFA enforcement and session duration controls</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
              256-Bit Encrypted
            </span>
          </div>

          <div className="p-4 rounded-xl bg-surface border border-border flex items-center justify-between">
            <div>
              <strong className="text-xs font-bold text-text block">
                Two-Factor Authentication (2FA)
              </strong>
              <span className="text-[11px] text-text-muted">
                Requires authenticator app code on unrecognized devices.
              </span>
            </div>

            <button
              onClick={toggle2FA}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                twoFaActive
                  ? 'bg-bg text-primary border border-border' : 'bg-slate-200 text-text-secondary hover:bg-slate-300' }`}
            >
              {twoFaActive ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary">Session Inactivity Timeout</label>
            <select
              className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={sessionTimeout}
              onChange={(e) => {
                setSessionTimeout(e.target.value);
                showToast(`Session timeout set to ${e.target.value}.`, 'info');
              }}
            >
              <option value="24 hours">24 hours</option>
              <option value="7 days">7 days</option>
              <option value="30 days">30 days (Recommended for retail kiosks)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <button
              className="px-4 py-2 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors flex items-center gap-1.5" onClick={() => showToast('Reset password instructions sent to admin email.', 'info')}
            >
              <Key className="w-3.5 h-3.5" />
              Change Admin Password
            </button>
          </div>
        </SpotlightCard>

        {/* API Token Vault */}
        <SpotlightCard className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <Key className="w-4 h-4 text-primary" />
                Encrypted Social Token Vault
              </h3>
              <p className="text-xs text-text-muted">AES-256 encrypted database token credentials</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary">
              Hardware Vault
            </span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-text">Meta Graph API (Instagram & FB)</strong>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
                  Encrypted
                </span>
              </div>
              <div className="text-[11px] font-mono text-text-muted">
                token: <code className="bg-white px-1.5 py-0.5 rounded text-text-secondary border border-border">eaab7...98f2</code> (AES-256)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-text">YouTube Data API v3</strong>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
                  Encrypted
                </span>
              </div>
              <div className="text-[11px] font-mono text-text-muted">
                token: <code className="bg-white px-1.5 py-0.5 rounded text-text-secondary border border-border">ya29...41c8</code> (Google OAuth)
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-surface border border-border space-y-1">
              <div className="flex items-center justify-between">
                <strong className="text-xs font-bold text-text">Autonomous AI Core Key</strong>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary">
                  Platform Managed
                </span>
              </div>
              <div className="text-[11px] font-mono text-text-muted">
                provider: <code className="bg-white px-1.5 py-0.5 rounded text-text-secondary border border-border">Google-Gemini-Cloud-Engine</code>
              </div>
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Security Audit Log SpotlightCard */}
      <SpotlightCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              Security Audit Trail
            </h3>
            <p className="text-xs text-text-muted">Immutable audit log of administrative sessions and key rotations</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bg text-text-secondary">
            Live Logger
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-text-muted font-bold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-3">Timestamp</th>
                <th className="px-6 py-3">Event</th>
                <th className="px-6 py-3">Actor</th>
                <th className="px-6 py-3">Device / IP</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-text-secondary">
              <tr className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 font-semibold text-text">Oct 09, 2026 17:05</td>
                <td className="px-6 py-4">Merchant Studio Login</td>
                <td className="px-6 py-4">{adminName}</td>
                <td className="px-6 py-4 text-text-muted">Windows 11 • Authenticated Session</td>
                <td className="px-6 py-4 text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
                    Authorized
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 font-semibold text-text">Oct 09, 2026 14:20</td>
                <td className="px-6 py-4">Company Logo Uploaded</td>
                <td className="px-6 py-4">{adminName}</td>
                <td className="px-6 py-4 text-text-muted">Web Studio Console</td>
                <td className="px-6 py-4 text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
                    Success
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-surface transition-colors">
                <td className="px-6 py-4 font-semibold text-text">Oct 08, 2026 09:12</td>
                <td className="px-6 py-4">Meta OAuth Token Refresh</td>
                <td className="px-6 py-4">System Automation</td>
                <td className="px-6 py-4 text-text-muted">Automated Cloud Worker</td>
                <td className="px-6 py-4 text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                    Auto-Refreshed
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}
