import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Crown
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import { storage, STORAGE_KEYS } from '../../../utils/storage';
import { api } from '../../../services/api';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

export function SettingsTeamView({ onOpenInviteModal }) {
  const { showToast } = useToast();
  const authState = useAuth() || {};
  const authUser = authState.user;
  const storedUser = storage.get(STORAGE_KEYS.user, {});
  const currentUser = authUser || storedUser || {};
  const currentUserId = currentUser.id;
  const currentUserEmail = currentUser.email || '';
  const currentAdminKey = currentUserId || currentUserEmail || 'current_admin';

  // Primary profile of the currently logged-in administrator
  const adminProfile = useMemo(() => {
    return {
      id: currentUserId || 'current-admin',
      name: currentUser.name || currentUser.full_name || currentUserEmail.split('@')[0] || 'Store Administrator',
      email: currentUserEmail || 'admin@store.com',
      role: 'Admin & Store Manager',
      authority: 'Full Approval & Publishing Authority',
      status: 'Active (You)',
      isAdminProfile: true,
      isCustom: false
    };
  }, [currentUser, currentUserId, currentUserEmail]);

  const [team, setTeam] = useState([adminProfile]);
  const [isLoading, setIsLoading] = useState(false);

  const loadTeam = useCallback(async () => {
    setIsLoading(true);
    // 1. Load locally added/invited team members for this specific admin (purge any legacy seeded creator data)
    const storedMembers = storage.get(`sacp_team_members_${currentAdminKey}`, []);
    const validStoredMembers = storedMembers.filter((m) => {
      const email = String(m.email || '').toLowerCase();
      const role = String(m.role || '').toUpperCase();
      // Remove any legacy seeded creator dummy records
      if (email.includes('creator@') || role === 'CREATOR' || role === 'VISUAL MERCHANDISER') return false;
      return true;
    });
    if (validStoredMembers.length !== storedMembers.length) {
      storage.set(`sacp_team_members_${currentAdminKey}`, validStoredMembers);
    }

    const localTeam = validStoredMembers.map((m) => ({
      ...m,
      isCustom: true
    }));

    // Strictly show the logged-in admin + newly added team members hereafter
    const emailSet = new Set([adminProfile.email?.toLowerCase()]);
    const combined = [adminProfile];

    for (const member of localTeam) {
      const lowerEmail = member.email?.toLowerCase();
      if (lowerEmail && !emailSet.has(lowerEmail)) {
        emailSet.add(lowerEmail);
        combined.push(member);
      }
    }

    setTeam(combined);
    setIsLoading(false);
  }, [currentAdminKey, adminProfile]);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  // Listen for real-time member additions from invite modal
  useEffect(() => {
    const handleMemberAdded = () => {
      loadTeam();
    };
    window.addEventListener('team_member_added', handleMemberAdded);
    return () => window.removeEventListener('team_member_added', handleMemberAdded);
  }, [loadTeam]);

  const handleRemoveMember = (memberId, memberName) => {
    const storedMembers = storage.get(`sacp_team_members_${currentAdminKey}`, []);
    const updated = storedMembers.filter((m) => m.id !== memberId);
    storage.set(`sacp_team_members_${currentAdminKey}`, updated);
    setTeam((prev) => prev.filter((m) => m.id !== memberId));
    showToast(`Team member "${memberName}" removed.`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="ACCOUNT & GOVERNANCE" badgeIcon={Users}
        title="Settings & Team Governance"
        subtitle="Manage store team collaborators, role permissions, approval delegation, and publishing access for your brand workspace."
        actions={
          <button
            id="open-invite-team-btn"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on text-xs font-bold transition-all shadow-sm"
            onClick={onOpenInviteModal}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        }
      />

      {/* Team Members SpotlightCard */}
      <SpotlightCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-text flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Store Team Members ({team.length})
            </h3>
            <p className="text-xs text-text-muted">Collaborator access levels and publishing credentials</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border">
            Role Governance Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-text-muted font-bold uppercase text-[10px] tracking-wider border-b border-border">
              <tr>
                <th className="px-6 py-3">Member</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Approval Authority</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-text-secondary">
              {team.map((member, idx) => (
                <tr key={member.id || idx} className="hover:bg-surface transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {member.isAdminProfile && (
                        <div className="w-6 h-6 rounded-full bg-warning/20 text-warning flex items-center justify-center shrink-0" title="Store Administrator">
                          <Crown className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <strong className="text-text text-xs block">{member.name}</strong>
                        <span className="text-[11px] text-text-muted">{member.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-text">{member.role}</td>
                  <td className="px-6 py-4">
                    <span className="text-primary font-semibold text-xs">
                      {member.authority}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        member.isAdminProfile
                          ? 'bg-warning/10 text-warning border-warning/30'
                          : 'bg-bg text-primary border-border'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {member.isAdminProfile ? (
                      <span className="text-[10px] text-text-muted font-medium italic">Current Account</span>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-bg hover:bg-slate-200 text-text-secondary font-bold text-[11px] transition-colors"
                          onClick={() => showToast(`Permissions configured for ${member.name}.`, 'info')}
                        >
                          Edit Role
                        </button>
                        {member.isCustom && (
                          <button
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                            onClick={() => handleRemoveMember(member.id, member.name)}
                            title="Remove member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SpotlightCard>
    </div>
  );
}

export default SettingsTeamView;
