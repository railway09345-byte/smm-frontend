import React, { useState, useEffect } from 'react';
import {
  Building2,
  Sparkles,
  Users,
  Palette,
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  ArrowRight,
  Check,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  FileText,
  X,
  Store,
  Layers,
  Clock,
  Briefcase
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { useAuth } from '../../../contexts/AuthContext';
import { api } from '../../../services/api';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

export function AdminMultiBusinessView({ isSuperAdmin = false }) {
  const { showToast } = useToast();
  const { user, switchBusiness, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState('businesses'); // 'businesses' | 'users'
  const [businesses, setBusinesses] = useState([]);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBiz, setEditingBiz] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedUserForAssign, setSelectedUserForAssign] = useState(null);
  const [assignBizId, setAssignBizId] = useState('');
  const [assignRole, setAssignRole] = useState('creator');

  // Load all businesses and users
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bizList, userList] = await Promise.all([
        api.admin.getBusinesses().catch(() => []),
        api.admin.getUsers({ limit: 500 }).catch(() => [])
      ]);
      setBusinesses(bizList || []);
      setUsers(userList || []);
    } catch (err) {
      showToast(`Error loading data: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered businesses
  const filteredBusinesses = businesses.filter((b) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      (b.brand_profile?.industry || '').toLowerCase().includes(q) ||
      (b.settings?.category || '').toLowerCase().includes(q)
    );
  });

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsCreating(true);
    setEditingBiz({
      name: '',
      slug: '',
      description: '',
      logo_url: '',
      settings: {
        category: 'Fashion & Apparel Retail',
        flagshipAddr: '',
        branchAddr: '',
        timings: 'Monday – Sunday: 10:00 AM – 9:00 PM',
        phone: '',
        email: '',
        gstin: '',
        categories: '' },
      brand_profile: {
        name: '',
        industry: 'Fashion & Apparel Retail',
        tagline: '',
        tone_of_voice: 'Modern & Engaging',
        target_audience: '',
        brand_guidelines: '',
        cta: '',
        avoid: '',
        color_palette: ['#36B987', '#193C2D', '#55D3A0']
      }
    });
    setEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (biz) => {
    setIsCreating(false);
    const settings = biz.settings || {};
    const bp = biz.brand_profile || {};
    setEditingBiz({
      id: biz.id,
      name: biz.name,
      slug: biz.slug,
      description: biz.description || '',
      logo_url: biz.logo_url || '',
      settings: {
        category: settings.category || bp.industry || '',
        flagshipAddr: settings.flagshipAddr || bp.location || '',
        branchAddr: settings.branchAddr || '',
        timings: settings.timings || bp.timings || '',
        phone: settings.phone || bp.meta_info?.phone || '',
        email: settings.email || bp.meta_info?.email || '',
        gstin: settings.gstin || bp.meta_info?.gstin || '',
        categories: settings.categories || bp.meta_info?.categories || '' },
      brand_profile: {
        name: bp.name || biz.name,
        industry: bp.industry || settings.category || '',
        tagline: bp.tagline || '',
        tone_of_voice: bp.tone_of_voice || 'Modern & Engaging',
        target_audience: bp.target_audience || '',
        brand_guidelines: bp.brand_guidelines || '',
        cta: bp.cta || '',
        avoid: bp.avoid || '',
        color_palette: bp.color_palette || ['#36B987', '#193C2D', '#55D3A0']
      }
    });
    setEditModalOpen(true);
  };

  // Save Business
  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!editingBiz.name.trim()) {
      showToast('Business Name is required.', 'error');
      return;
    }

    try {
      if (isCreating) {
        await api.admin.createBusiness({
          name: editingBiz.name,
          slug: editingBiz.slug || undefined,
          description: editingBiz.description,
          logo_url: editingBiz.logo_url,
          settings: editingBiz.settings,
          brand_profile: {
            ...editingBiz.brand_profile,
            name: editingBiz.brand_profile.name || editingBiz.name
          }
        });
        showToast('New business and brand profile created in database!', 'success');
      } else {
        await api.admin.updateBusiness(editingBiz.id, {
          name: editingBiz.name,
          slug: editingBiz.slug,
          description: editingBiz.description,
          logo_url: editingBiz.logo_url,
          settings: editingBiz.settings,
          brand_profile: editingBiz.brand_profile
        });
        showToast('Business and brand profile updated successfully!', 'success');
      }
      setEditModalOpen(false);
      await loadData();
      await refreshUser();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    }
  };

  // Delete Business
  const handleDeleteBusiness = async (bizId, bizName) => {
    if (!window.confirm(`Are you sure you want to delete "${bizName}"? All associated brand settings and content will be removed.`)) {
      return;
    }
    try {
      await api.admin.deleteBusiness(bizId);
      showToast(`Business "${bizName}" deleted.`, 'success');
      await loadData();
      await refreshUser();
    } catch (err) {
      showToast(`Delete failed: ${err.message}`, 'error');
    }
  };

  // Switch Workspace
  const handleSwitchTo = async (bizId, bizName) => {
    try {
      await switchBusiness(bizId);
      showToast(`Switched active dashboard workspace to "${bizName}".`, 'success');
    } catch (err) {
      showToast(`Switch failed: ${err.message}`, 'error');
    }
  };

  // Open Assign User Modal
  const handleOpenAssign = (userObj) => {
    setSelectedUserForAssign(userObj);
    setAssignBizId(businesses[0]?.id || '');
    setAssignRole(userObj.role?.toLowerCase() || 'creator');
    setAssignModalOpen(true);
  };

  // Save Assignment
  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    if (!assignBizId) {
      showToast('Please select a business.', 'error');
      return;
    }
    try {
      await api.admin.assignUserBusiness(selectedUserForAssign.id, {
        business_id: Number(assignBizId),
        role: assignRole,
        is_default: false
      });
      showToast(`Assigned ${selectedUserForAssign.full_name || selectedUserForAssign.email} to business!`, 'success');
      setAssignModalOpen(false);
      await loadData();
    } catch (err) {
      showToast(`Assignment failed: ${err.message}`, 'error');
    }
  };

  // Unassign User
  const handleUnassign = async (userId, bizId, bizName) => {
    if (!window.confirm(`Remove user access from "${bizName}"?`)) return;
    try {
      await api.admin.unassignUserBusiness(userId, bizId);
      showToast('Removed business access for user.', 'info');
      await loadData();
    } catch (err) {
      showToast(`Failed to unassign: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge={isSuperAdmin ? "SUPERADMIN PORTAL" : "ADMIN PORTAL"}
        badgeIcon={Building2}
        title="Multi-Business & Brand Management"
        subtitle={isSuperAdmin ? "Master platform-wide management of retail businesses, store outlets, contact points, and brand directives stored in MySQL." : "Configure predefined retail businesses, store outlets, contact points, and brand directives stored in MySQL."}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-text-secondary hover:text-text hover:bg-surface-selected transition-all shadow-xs" >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Refresh
            </button>
            <button
              id="create-business-btn" onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:brightness-105 active:scale-95 text-primary-on font-bold text-xs shadow-md shadow-primary/20 transition-all cursor-pointer" >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Business</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Bar Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SpotlightCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary border border-border flex items-center justify-center shadow-xs">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-secondary">Total Businesses</div>
            <div className="text-2xl font-black text-text mt-0.5">{businesses.length}</div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary border border-border flex items-center justify-center shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-secondary">Registered Users</div>
            <div className="text-2xl font-black text-text mt-0.5">{users.length}</div>
          </div>
        </SpotlightCard>

        <SpotlightCard className="p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-soft text-primary border border-border flex items-center justify-center shadow-xs">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-secondary">Brand Profiles Configured</div>
            <div className="text-2xl font-black text-text mt-0.5">
              {businesses.filter((b) => b.brand_profile).length}
            </div>
          </div>
        </SpotlightCard>
      </div>

      {/* Navigation Tabs */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-1.5 p-1 bg-surface-raised rounded-xl border border-border w-fit">
          <button
            onClick={() => setActiveTab('businesses')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'businesses'
                ? 'bg-primary text-primary-on shadow-xs'
                : 'text-text-secondary hover:text-text hover:bg-surface-selected' }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Businesses & Profiles ({businesses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-primary text-primary-on shadow-xs'
                : 'text-text-secondary hover:text-text hover:bg-surface-selected' }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Assignments ({users.length})</span>
          </button>
        </div>
      )}

      {/* TAB 1: BUSINESSES */}
      {activeTab === 'businesses' && (
        <div className="space-y-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-surface text-xs font-medium text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Search by business name, category, or slug..." value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {isLoading ? (
            <SpotlightCard className="p-12 text-center text-xs text-text-muted">
              Loading businesses from MySQL...
            </SpotlightCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBusinesses.map((biz) => {
                const bp = biz.brand_profile || {};
                const settings = biz.settings || {};
                const isCurrentActive = biz.id === user?.organizationId;

                return (
                  <SpotlightCard
                    key={biz.id}
                    className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                      isCurrentActive ? 'border-primary ring-2 ring-primary/20 bg-surface-selected' : '' }`}
                  >
                    <div className="space-y-3.5">
                      {/* Top identity */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-on flex items-center justify-center font-bold text-sm overflow-hidden flex-shrink-0 shadow-xs border border-border">
                            {biz.logo_url ? (
                              <img src={biz.logo_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                              biz.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-text leading-tight">{biz.name}</h4>
                            <span className="font-mono text-[10px] text-text-secondary block mt-0.5">
                              slug: {biz.slug} • ID #{biz.id}
                            </span>
                          </div>
                        </div>

                        {isCurrentActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-border whitespace-nowrap">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                        {biz.description || 'No description provided.'}
                      </p>

                      {/* Store & Location Details (High Contrast Luxury Styling) */}
                      <div className="p-3 bg-surface-raised rounded-xl border border-border text-xs space-y-1.5 shadow-xs transition-colors">
                        <div className="font-bold text-primary text-[11px] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>Retail & Contact Info</span>
                        </div>
                        <div className="text-[11px] text-text leading-relaxed">
                          <span className="font-semibold text-primary">Category: </span>
                          <span>{settings.category || bp.industry || 'Not set'}</span>
                        </div>
                        {settings.flagshipAddr && (
                          <div className="text-[11px] text-text leading-relaxed">
                            <span className="font-semibold text-primary">Flagship: </span>
                            <span>{settings.flagshipAddr}</span>
                          </div>
                        )}
                        {settings.timings && (
                          <div className="text-[11px] text-text leading-relaxed">
                            <span className="font-semibold text-primary">Hours: </span>
                            <span>{settings.timings}</span>
                          </div>
                        )}
                        {(settings.phone || settings.email) && (
                          <div className="flex gap-3 flex-wrap text-[10px] text-text pt-1.5 border-t border-border font-medium">
                            {settings.phone && <span className="flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{settings.phone}</span>}
                            {settings.email && <span className="flex items-center gap-1"><Mail className="w-2.5 h-2.5" />{settings.email}</span>}
                          </div>
                        )}
                      </div>

                      {/* Brand Directive Snippet */}
                      {bp.tagline && (
                        <div className="text-xs text-text">
                          <span className="font-semibold text-primary">Tagline: </span>
                          <strong className="text-primary italic">"{bp.tagline}"</strong>
                        </div>
                      )}

                      {/* Color Palette */}
                      {bp.color_palette && bp.color_palette.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold text-text-secondary">Palette:</span>
                          <div className="flex gap-1.5">
                            {bp.color_palette.map((c, i) => (
                              <div
                                key={i}
                                className="w-4 h-4 rounded-md border border-border shadow-xs" style={{ backgroundColor: c }}
                                title={c}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="text-[11px] text-text-secondary flex items-center gap-1.5 pt-1">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span><strong>{biz.assigned_users_count}</strong> user(s) assigned</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-border flex items-center gap-2">
                      <button
                        className="py-1.5 px-3 rounded-lg bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors flex items-center gap-1" onClick={() => handleOpenEdit(biz)}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1 ${
                          isCurrentActive
                            ? 'bg-bg text-primary border border-border cursor-default' : 'bg-primary hover:bg-primary text-primary-on shadow-sm' }`}
                        onClick={() => handleSwitchTo(biz.id, biz.name)}
                        disabled={isCurrentActive}
                      >
                        {isCurrentActive ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>Current</span>
                          </>
                        ) : (
                          <>
                            <ArrowRight className="w-3 h-3" />
                            <span>Switch</span>
                          </>
                        )}
                      </button>
                      <button
                        className="p-1.5 rounded-lg text-text-muted hover:text-rose-600 hover:bg-rose-50 transition-colors" onClick={() => handleDeleteBusiness(biz.id, biz.name)}
                        title="Delete Business" >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REGISTERED USERS & ASSIGNMENTS */}
      {!isSuperAdmin && activeTab === 'users' && (
        <SpotlightCard className="p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-border dark:border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-text dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Registered Users & Business Assignments</span>
              </h3>
              <p className="text-xs text-text-secondary">Cross-tenant membership and tenant routing matrix</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-border">
              {users.length} Users
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-raised text-primary font-bold uppercase text-[10px] tracking-wider border-b border-border">
                <tr>
                  <th className="px-6 py-3">User Profile</th>
                  <th className="px-6 py-3">Global Role</th>
                  <th className="px-6 py-3">Assigned Businesses</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-text">
                {users.map((u) => {
                  const assigned = u.assigned_businesses || [];
                  return (
                    <tr key={u.id} className="hover:bg-surface-selected transition-colors">
                      <td className="px-6 py-4">
                        <strong className="text-text text-xs block">{u.full_name || 'No Name'}</strong>
                        <span className="text-[11px] text-text-secondary">{u.email}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary border border-border">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1.5 max-w-xs">
                          {assigned.length > 0 ? (
                            assigned.map((b) => (
                              <div
                                key={b.id}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] border font-medium ${
                                  b.id === u.organization_id
                                    ? 'bg-primary-soft border-primary/30 text-primary font-bold'
                                    : 'bg-surface border-border text-text' }`}
                              >
                                <span>{b.name}</span>
                                {assigned.length > 1 && (
                                  <button
                                    onClick={() => handleUnassign(u.id, b.id, b.name)}
                                    className="text-text-muted hover:text-error ml-0.5 font-bold cursor-pointer" title="Unassign" >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))
                          ) : (
                            <span className="text-text-muted text-[11px]">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.is_active
                            ? 'bg-success/10 text-success border-success/30'
                            : 'bg-surface-selected text-text-muted border-border' }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-primary hover:brightness-105 text-primary-on font-bold text-[11px] transition-colors shadow-xs cursor-pointer" onClick={() => handleOpenAssign(u)}
                        >
                          + Assign Business
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SpotlightCard>
      )}

      {/* EDIT / CREATE BUSINESS MODAL */}
      {editModalOpen && editingBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-secondary/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border text-text rounded-2xl shadow-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-text">
                  {isCreating ? 'Create New Business & Brand' : `Edit "${editingBiz.name}"`}
                </h3>
                <p className="text-xs text-text-muted">Database tenant records and brand identity guidelines</p>
              </div>
              <button
                type="button" className="w-8 h-8 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg flex items-center justify-center transition-colors" onClick={() => setEditModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="space-y-3.5">
                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                  1. Business Identity & Legal
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Business / Brand Name *</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.name}
                    onChange={(e) => setEditingBiz({ ...editingBiz, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">URL Slug (Identifier)</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.slug}
                      placeholder="e.g. apex-luxury-watches" onChange={(e) => setEditingBiz({ ...editingBiz, slug: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Retail Category</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.settings.category}
                      onChange={(e) => setEditingBiz({
                        ...editingBiz,
                        settings: { ...editingBiz.settings, category: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Business Description</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.description}
                    onChange={(e) => setEditingBiz({ ...editingBiz, description: e.target.value })}
                  />
                </div>

                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block pt-2">
                  2. Retail Locations & Contact
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Flagship Store Location</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.settings.flagshipAddr}
                    onChange={(e) => setEditingBiz({
                      ...editingBiz,
                      settings: { ...editingBiz.settings, flagshipAddr: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Store Hours</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.settings.timings}
                      onChange={(e) => setEditingBiz({
                        ...editingBiz,
                        settings: { ...editingBiz.settings, timings: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">GSTIN / Tax ID</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.settings.gstin}
                      onChange={(e) => setEditingBiz({
                        ...editingBiz,
                        settings: { ...editingBiz.settings, gstin: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Contact Phone</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.settings.phone}
                      onChange={(e) => setEditingBiz({
                        ...editingBiz,
                        settings: { ...editingBiz.settings, phone: e.target.value }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Customer Care Email</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" type="email" value={editingBiz.settings.email}
                      onChange={(e) => setEditingBiz({
                        ...editingBiz,
                        settings: { ...editingBiz.settings, email: e.target.value }
                      })}
                    />
                  </div>
                </div>

                <span className="text-[11px] font-bold text-primary uppercase tracking-wider block pt-2">
                  3. Brand Directive & Voice
                </span>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Official Tagline</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.brand_profile.tagline}
                    onChange={(e) => setEditingBiz({
                      ...editingBiz,
                      brand_profile: { ...editingBiz.brand_profile, tagline: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Tone of Voice</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.brand_profile.tone_of_voice}
                    onChange={(e) => setEditingBiz({
                      ...editingBiz,
                      brand_profile: { ...editingBiz.brand_profile, tone_of_voice: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Target Audience</label>
                  <textarea
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.brand_profile.target_audience}
                    onChange={(e) => setEditingBiz({
                      ...editingBiz,
                      brand_profile: { ...editingBiz.brand_profile, target_audience: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-text-secondary">Call to Action (CTA)</label>
                  <input
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={editingBiz.brand_profile.cta}
                    onChange={(e) => setEditingBiz({
                      ...editingBiz,
                      brand_profile: { ...editingBiz.brand_profile, cta: e.target.value }
                    })}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button" className="px-4 py-2 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors" onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit" className="px-5 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-sm transition-colors" >
                  {isCreating ? 'Create Business' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN USER MODAL */}
      {assignModalOpen && selectedUserForAssign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text">Assign Business Access</h3>
              <button
                type="button" className="w-8 h-8 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg flex items-center justify-center transition-colors" onClick={() => setAssignModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssignment} className="space-y-3.5">
              <div className="p-3 bg-surface rounded-xl border border-border text-xs">
                <strong className="text-text block">{selectedUserForAssign.full_name || 'User'}</strong>
                <span className="text-text-muted text-[11px]">{selectedUserForAssign.email}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Select Business *</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={assignBizId}
                  onChange={(e) => setAssignBizId(e.target.value)}
                  required
                >
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} (#{b.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-text-secondary">Workspace Role</label>
                <select
                  className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={assignRole}
                  onChange={(e) => setAssignRole(e.target.value)}
                >
                  <option value="creator">Creator (Drafts & Visuals)</option>
                  <option value="manager">Manager (Review & Schedule)</option>
                  <option value="admin">Admin (Full Access)</option>
                  <option value="viewer">Viewer (Read Only)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button" className="px-4 py-2 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors" onClick={() => setAssignModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit" className="px-4 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-sm transition-colors" >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
