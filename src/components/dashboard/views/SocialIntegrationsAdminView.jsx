import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  Globe,
  Video,
  FileText,
  Sliders,
  ExternalLink,
  Check,
  X,
  Eye,
  EyeOff,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useToast } from '../../common/Toast';
import { api } from '../../../services/api';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { SpotlightCard } from '../../common/SpotlightCard';

const SUPPORTED_PLATFORM_KEYS = ['youtube', 'instagram', 'facebook'];

const PLATFORM_META = {
  youtube: {
    name: 'YouTube',
    tag: 'YT',
    color: '#FF0000',
    gradient: 'from-red-600 to-red-700',
    developerUrl: 'https://console.cloud.google.com/apis/credentials',
    docName: 'Google Cloud Console' },
  instagram: {
    name: 'Instagram',
    tag: 'IG',
    color: '#E1306C',
    gradient: 'from-[#f09433] via-[#dc2743] to-[#bc1888]',
    developerUrl: 'https://developers.facebook.com/docs/instagram-api',
    docName: 'Meta for Developers' },
  facebook: {
    name: 'Facebook',
    tag: 'FB',
    color: '#1877F2',
    gradient: 'from-[#1877F2] to-[#0d5bbd]',
    developerUrl: 'https://developers.facebook.com/docs/pages',
    docName: 'Meta for Developers' }
};

export function SocialIntegrationsAdminView({ onNavigate }) {
  const { showToast } = useToast();
  const [platforms, setPlatforms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | enabled | disabled | healthy | needs_config

  // Active configure modal state
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [configTab, setConfigTab] = useState('credentials'); // credentials | endpoints | video_specs | guide
  const [showSecret, setShowSecret] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Form State for editing
  const [formData, setFormData] = useState({
    display_name: '',
    is_enabled: false,
    environment: 'production',
    client_id: '',
    client_secret: '',
    api_key: '',
    api_secret: '',
    auth_url: '',
    token_url: '',
    api_base_url: '',
    api_version: '',
    redirect_uri: '',
    scopes_str: '',
    webhook_url: '',
    config_notes: '' });

  const [isSaving, setIsSaving] = useState(false);
  const [testingPlatform, setTestingPlatform] = useState(null);
  const [testResults, setTestResults] = useState({});

  // Fetch all platform integrations
  const loadPlatforms = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.admin.getPlatformIntegrations();
      const filtered = (data || []).filter((p) =>
        SUPPORTED_PLATFORM_KEYS.includes((p.platform || '').toLowerCase())
      );
      setPlatforms(filtered);
    } catch (err) {
      showToast(`Admin permissions required: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPlatforms();
  }, [loadPlatforms]);

  // Open Configure Modal
  const handleOpenConfig = (plat) => {
    setSelectedPlatform(plat);
    setShowSecret(false);
    setShowApiKey(false);
    setConfigTab('credentials');
    setFormData({
      display_name: plat.display_name || '',
      is_enabled: plat.is_enabled,
      environment: plat.environment || 'production',
      client_id: plat.client_id || '',
      client_secret: '',
      api_key: '',
      api_secret: '',
      auth_url: plat.auth_url || '',
      token_url: plat.token_url || '',
      api_base_url: plat.api_base_url || '',
      api_version: plat.api_version || '',
      redirect_uri: plat.redirect_uri || (typeof window !== 'undefined' ? `${window.location.origin}/dashboard?tab=socials` : 'http://localhost:3000/dashboard?tab=socials'),
      scopes_str: (plat.scopes || []).join(', '),
      webhook_url: plat.webhook_url || '',
      config_notes: plat.config_notes || '' });
    setConfigModalOpen(true);
  };

  // Save Platform Changes
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!selectedPlatform) return;

    setIsSaving(true);
    try {
      const payload = {
        display_name: formData.display_name,
        is_enabled: formData.is_enabled,
        environment: formData.environment,
        client_id: formData.client_id,
        auth_url: formData.auth_url,
        token_url: formData.token_url,
        api_base_url: formData.api_base_url,
        api_version: formData.api_version,
        redirect_uri: formData.redirect_uri,
        scopes: formData.scopes_str
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        webhook_url: formData.webhook_url,
        config_notes: formData.config_notes
      };

      if (formData.client_secret && formData.client_secret.trim()) {
        payload.client_secret = formData.client_secret.trim();
      }
      if (formData.api_key && formData.api_key.trim()) {
        payload.api_key = formData.api_key.trim();
      }
      if (formData.api_secret && formData.api_secret.trim()) {
        payload.api_secret = formData.api_secret.trim();
      }

      await api.admin.updatePlatformIntegration(selectedPlatform.platform, payload);
      showToast(`${selectedPlatform.display_name} configuration saved securely.`, 'success');
      setConfigModalOpen(false);
      await loadPlatforms();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Integration Status
  const handleToggle = async (plat) => {
    const newStatus = !plat.is_enabled;
    try {
      await api.admin.togglePlatformIntegration(plat.platform, newStatus);
      showToast(`${plat.display_name} ${newStatus ? 'enabled' : 'disabled'}.`, 'info');
      await loadPlatforms();
    } catch (err) {
      showToast(`Toggle failed: ${err.message}`, 'error');
    }
  };

  // Test Platform Connectivity
  const handleTestPlatform = async (plat, customPayload = null) => {
    setTestingPlatform(plat.platform);
    showToast(`Testing live API connectivity for ${plat.display_name}...`, 'info');
    try {
      const res = await api.admin.testPlatformIntegration(plat.platform, customPayload || {});
      setTestResults((prev) => ({
        ...prev,
        [plat.platform]: res
      }));

      if (res.success) {
        showToast(`${plat.display_name} Test Passed: ${res.message}`, 'success');
      } else {
        showToast(`${plat.display_name} Test Warning: ${res.message}`, 'warning');
      }
      await loadPlatforms();
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingPlatform(null);
    }
  };

  // Filter and Search platforms
  const filteredPlatforms = platforms.filter((plat) => {
    const matchesSearch =
      plat.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plat.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (plat.config_notes && plat.config_notes.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterStatus === 'enabled') return plat.is_enabled;
    if (filterStatus === 'disabled') return !plat.is_enabled;
    if (filterStatus === 'healthy') return plat.test_status === 'healthy';
    if (filterStatus === 'needs_config') return !plat.client_id || !plat.client_secret_configured;
    return true;
  });

  const enabledCount = platforms.filter((p) => p.is_enabled).length;
  const configuredCount = platforms.filter((p) => p.client_id && p.client_secret_configured).length;

  return (
    <div className="space-y-6">
      {/* ── PAGE HEADER ── */}
      <DashboardPageHeader
        badge="ADMIN GOVERNANCE & OAUTH" badgeIcon={ShieldCheck}
        title="Social Media API Integration Management" subtitle="Manage global OAuth 2.0 Client IDs, encrypted secrets, API endpoints, permissions, and video publishing parameters for all 8 supported social channels." actions={
          <div className="flex items-center gap-2">
            <button
              onClick={loadPlatforms}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/80 backdrop-blur-xl border border-border text-xs font-bold text-text-secondary hover:bg-surface transition-all shadow-sm" >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : ''}`} />
              Refresh Status
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('social-accounts')}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-sm transition-all" >
                <span>User Social Accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      />

      {/* Highlight Bento Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SpotlightCard className="p-4">
          <span className="text-xs font-semibold text-text-muted">Active Platforms</span>
          <div className="text-2xl font-black text-primary my-1">{enabledCount} / 8</div>
          <span className="text-[11px] text-text-muted">Ready for user OAuth</span>
        </SpotlightCard>

        <SpotlightCard className="p-4">
          <span className="text-xs font-semibold text-text-muted">Credentials Vault</span>
          <div className="text-2xl font-black text-primary my-1">{configuredCount} / 4</div>
          <span className="text-[11px] text-text-muted">AES-256 Encrypted</span>
        </SpotlightCard>

        <SpotlightCard className="p-4">
          <span className="text-xs font-semibold text-text-muted">Video Publishing Engine</span>
          <div className="text-2xl font-black text-warning my-1">Shorts, Reels</div>
          <span className="text-[11px] text-text-muted">Cross-platform specs</span>
        </SpotlightCard>

        <SpotlightCard className="p-4">
          <span className="text-xs font-semibold text-text-muted">Security Compliance</span>
          <div className="text-2xl font-black text-primary my-1">Role-Restricted</div>
          <span className="text-[11px] text-text-muted">Secrets masked on read</span>
        </SpotlightCard>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-bg backdrop-blur-md rounded-xl border border-border overflow-x-auto">
          {[
            { id: 'all', label: `All Platforms (${platforms.length})` },
            { id: 'enabled', label: `Enabled (${enabledCount})` },
            { id: 'disabled', label: `Disabled (${platforms.length - enabledCount})` },
            { id: 'healthy', label: 'Verified Healthy' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                filterStatus === tab.id
                  ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text hover:bg-white/40' }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text" className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Search platforms..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Platform Integrations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPlatforms.map((plat) => {
          const meta = PLATFORM_ICONS[plat.platform] || {
            name: plat.display_name,
            tag: plat.platform.slice(0, 2).toUpperCase(),
            color: '#334155',
            gradient: 'from-slate-700 to-slate-900',
            developerUrl: 'https://developer.example.com',
            docName: 'Developer Console' };

          const isTesting = testingPlatform === plat.platform;
          const isConfigured = plat.client_id && plat.client_secret_configured;
          const testRes = testResults[plat.platform];

          return (
            <SpotlightCard
              key={plat.id}
              className={`p-5 flex flex-col justify-between space-y-4 transition-all ${
                plat.is_enabled ? 'border-primary bg-white/90' : 'bg-white/60 opacity-90' }`}
            >
              <div className="space-y-4">
                {/* Card Top: Logo, Name, Toggle */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm" style={{ backgroundColor: meta.color }}
                    >
                      {meta.tag}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text">{plat.display_name}</h4>
                      <span className="text-[11px] text-text-muted block font-medium">
                        API {plat.api_version || 'v1'} • {plat.environment === 'production' ? 'Production' : 'Sandbox'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggle(plat)}
                    className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                      plat.is_enabled ? 'bg-primary' : 'bg-slate-300' }`}
                    title={plat.is_enabled ? 'Disable Integration' : 'Enable Integration'}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                        plat.is_enabled ? 'translate-x-4' : 'translate-x-0' }`}
                    />
                  </button>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      plat.is_enabled
                        ? 'bg-bg text-primary border-border' : 'bg-bg text-text-muted border-border' }`}
                  >
                    {plat.is_enabled ? 'Enabled' : 'Disabled'}
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      isConfigured
                        ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-warning/10 text-warning border-warning/30' }`}
                  >
                    {isConfigured ? 'Vaulted' : 'Keys Needed'}
                  </span>

                  {plat.test_status === 'healthy' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-bg text-primary border border-border"><Check className="w-4 h-4 inline-block mr-1" />Healthy
                    </span>
                  )}
                </div>

                {/* Configuration Summary Block */}
                <div className="p-3 bg-surface rounded-xl border border-border text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-text-muted text-[11px]">Client ID:</span>
                    <span className="font-mono text-[11px] font-semibold text-text">
                      {plat.client_id ? `${plat.client_id.slice(0, 14)}...` : 'Not Set'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-text-muted text-[11px]">Secret:</span>
                    <span className="font-mono text-[11px] font-semibold text-primary">
                      {plat.client_secret_configured ? plat.client_secret_masked : 'Not Set'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-text-muted text-[11px]">Scopes ({plat.scopes?.length || 0}):</span>
                    <span className="text-[11px] text-text-secondary truncate max-w-[150px]">
                      {(plat.scopes || []).join(', ') || 'None'}
                    </span>
                  </div>

                  {plat.last_tested_at && (
                    <div className="flex justify-between pt-1 border-t border-border text-[10px]">
                      <span className="text-text-muted">Last Tested:</span>
                      <span className={plat.test_status === 'healthy' ? 'text-primary font-semibold' : 'text-rose-600 font-semibold'}>
                        {new Date(plat.last_tested_at).toLocaleDateString()} {new Date(plat.last_tested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Test Result Banner */}
                {testRes && (
                  <div className={`p-2.5 rounded-xl border text-[11px] font-medium ${
                    testRes.success
                      ? 'bg-bg border-border text-primary' : 'bg-rose-50 border-rose-200 text-rose-800' }`}>
                    {testRes.message}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2 border-t border-border">
                <button
                  className="flex-1 py-2 px-3 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50" disabled={isTesting}
                  onClick={() => handleTestPlatform(plat)}
                  title="Test API credentials connectivity" >
                  <Zap className={`w-3 h-3 ${isTesting ? 'animate-spin text-warning' : 'text-text-muted'}`} />
                  <span>{isTesting ? 'Testing...' : 'Test API'}</span>
                </button>

                <button
                  className="flex-1 py-2 px-3 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5" onClick={() => handleOpenConfig(plat)}
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              </div>
            </SpotlightCard>
          );
        })}
      </div>

      {/* ── PLATFORM CONFIGURATION MODAL ── */}
      {configModalOpen && selectedPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white/95 backdrop-blur-2xl border border-border rounded-2xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-sm" style={{ backgroundColor: (PLATFORM_ICONS[selectedPlatform.platform] || {}).color || '#0f172a' }}
                >
                  {(PLATFORM_ICONS[selectedPlatform.platform] || {}).tag || 'API'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-text">
                    Configure {selectedPlatform.display_name}
                  </h3>
                  <p className="text-xs text-text-muted">
                    Set global API credentials, endpoints, permissions & video publishing parameters
                  </p>
                </div>
              </div>

              <button
                type="button" className="w-8 h-8 rounded-lg text-text-muted hover:text-text-secondary hover:bg-bg flex items-center justify-center transition-colors" onClick={() => setConfigModalOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-bg rounded-xl text-xs overflow-x-auto">
              {[
                { id: 'credentials', label: 'Credentials', icon: Key },
                { id: 'endpoints', label: 'Endpoints & Scopes', icon: Globe },
                { id: 'video_specs', label: 'Video Specs', icon: Video },
                { id: 'guide', label: 'Setup Guide', icon: FileText }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button" className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
                      configTab === tab.id
                        ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:text-text' }`}
                    onClick={() => setConfigTab(tab.id)}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              {/* TAB 1: CREDENTIALS */}
              {configTab === 'credentials' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3">
                      <button
                        type="button" onClick={() => setFormData({ ...formData, is_enabled: !formData.is_enabled })}
                        className={`w-9 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors ${
                          formData.is_enabled ? 'bg-primary' : 'bg-slate-300' }`}
                      >
                        <div className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${
                          formData.is_enabled ? 'translate-x-4' : 'translate-x-0' }`} />
                      </button>
                      <strong className="text-xs font-bold text-text">
                        {formData.is_enabled ? 'Integration Active' : 'Integration Disabled'}
                      </strong>
                    </div>

                    <select
                      className="px-3 py-1.5 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.environment}
                      onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    >
                      <option value="production">Production Environment</option>
                      <option value="development">Development / Sandbox</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Display Name</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" required
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Client ID / App ID / Client Key</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.client_id}
                      onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                      placeholder="e.g. 1029384756 or client_id_xyz..." />
                    <span className="text-[11px] text-text-muted">Public OAuth App ID assigned in your developer console.</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-text-secondary">
                        Client Secret / App Secret{' '}
                        <span className={`text-[10px] font-bold ${
                          selectedPlatform.client_secret_configured ? 'text-primary' : 'text-warning' }`}>
                          ({selectedPlatform.client_secret_configured ? `Vaulted: ${selectedPlatform.client_secret_masked}` : 'Not Set'})
                        </span>
                      </label>
                      <button
                        type="button" className="text-xs text-primary hover:text-primary font-bold flex items-center gap-1" onClick={() => setShowSecret(!showSecret)}
                      >
                        {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showSecret ? 'text' : 'password'}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary font-mono" value={formData.client_secret}
                      onChange={(e) => setFormData({ ...formData, client_secret: e.target.value })}
                      placeholder={selectedPlatform.client_secret_configured ? 'Leave blank to keep existing encrypted secret' : 'Enter secret key...'}
                    />
                    <span className="text-[11px] text-text-muted">Encrypted using AES-256 before storage. Never exposed to clients.</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-text-secondary">
                        API Key / Consumer Key (Optional)
                      </label>
                      <button
                        type="button" className="text-xs text-primary hover:text-primary font-bold flex items-center gap-1" onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {showApiKey ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary font-mono" value={formData.api_key}
                      onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                      placeholder={selectedPlatform.api_key_configured ? 'Leave blank to keep existing' : 'Enter API Key if required by provider'}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">OAuth Redirect URI</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.redirect_uri}
                      onChange={(e) => setFormData({ ...formData, redirect_uri: e.target.value })}
                    />
                    <span className="text-[11px] text-text-muted">Must match the registered Callback URL in your provider console.</span>
                  </div>
                </div>
              )}

              {/* TAB 2: ENDPOINTS & SCOPES */}
              {configTab === 'endpoints' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-surface rounded-xl border border-border text-xs text-text-secondary">
                    ℹ️ Official provider API endpoints are pre-configured. Edit only if using custom proxies or API gateways.
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">OAuth Authorization URL</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.auth_url}
                      onChange={(e) => setFormData({ ...formData, auth_url: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">OAuth Token URL</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.token_url}
                      onChange={(e) => setFormData({ ...formData, token_url: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2 space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">API Base URL</label>
                      <input
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.api_base_url}
                        onChange={(e) => setFormData({ ...formData, api_base_url: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-text-secondary">API Version</label>
                      <input
                        className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.api_version}
                        onChange={(e) => setFormData({ ...formData, api_version: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Required OAuth Scopes (Comma-separated)</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.scopes_str}
                      onChange={(e) => setFormData({ ...formData, scopes_str: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Webhook URL (Optional)</label>
                    <input
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.webhook_url}
                      onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                      placeholder="https://api.example.com/webhooks/social/..." />
                  </div>
                </div>
              )}

              {/* TAB 3: VIDEO SPECS */}
              {configTab === 'video_specs' && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
                    <strong className="text-xs font-bold text-text block">
                      Video Publishing Parameters
                    </strong>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-text-muted">Formats:</span>
                        <div className="font-bold text-text">
                          {(selectedPlatform.extra_settings?.video_formats || ['MP4', 'MOV']).join(', ')}
                        </div>
                      </div>
                      <div>
                        <span className="text-text-muted">Aspect Ratios:</span>
                        <div className="font-bold text-text">
                          {(selectedPlatform.extra_settings?.aspect_ratios || ['9:16', '16:9']).join(', ')}
                        </div>
                      </div>
                      <div>
                        <span className="text-text-muted">Max Video Size:</span>
                        <div className="font-bold text-text">
                          {selectedPlatform.extra_settings?.max_video_size_mb || 1000} MB
                        </div>
                      </div>
                      <div>
                        <span className="text-text-muted">Max Duration:</span>
                        <div className="font-bold text-text">
                          {selectedPlatform.extra_settings?.max_duration_seconds || 600} seconds
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-text-secondary">Operational Notes & Guidelines</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-border bg-white text-xs font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary" value={formData.config_notes}
                      onChange={(e) => setFormData({ ...formData, config_notes: e.target.value })}
                      placeholder="Add operational notes or team instructions..." />
                  </div>
                </div>
              )}

              {/* TAB 4: SETUP GUIDE */}
              {configTab === 'guide' && (
                <div className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center justify-between">
                    <div>
                      <strong>Developer Portal:</strong> Visit official documentation for credentials
                    </div>
                    <a
                      href={(PLATFORM_ICONS[selectedPlatform.platform] || {}).developerUrl}
                      target="_blank" rel="noreferrer" className="font-bold text-blue-700 hover:underline flex items-center gap-1" >
                      <span>{(PLATFORM_ICONS[selectedPlatform.platform] || {}).docName}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-4 rounded-xl bg-surface border border-border text-xs text-text-secondary space-y-2">
                    <strong className="font-bold text-text block">Setup Checklist:</strong>
                    <ol className="list-decimal list-inside space-y-1.5 text-text-secondary leading-relaxed">
                      <li>Create an application in the official provider developer portal.</li>
                      <li>Copy the <strong>Client ID / App ID</strong> and paste into Credentials.</li>
                      <li>Generate a <strong>Client Secret</strong> and paste it above.</li>
                      <li>Add <code className="bg-slate-200 px-1 py-0.5 rounded text-[11px] text-text">{formData.redirect_uri}</code> to Authorized Redirect URIs in your developer console.</li>
                      <li>Click <strong>"Test Credentials"</strong> below to verify the OAuth handshake.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="pt-4 border-t border-border flex items-center justify-between">
                <button
                  type="button" className="px-4 py-2 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors flex items-center gap-1.5 disabled:opacity-50" onClick={() =>
                    handleTestPlatform(selectedPlatform, {
                      client_id: formData.client_id,
                      client_secret: formData.client_secret,
                      api_key: formData.api_key
                    })
                  }
                  disabled={testingPlatform === selectedPlatform.platform}
                >
                  <Zap className={`w-3 h-3 ${testingPlatform === selectedPlatform.platform ? 'animate-spin text-warning' : 'text-text-muted'}`} />
                  <span>{testingPlatform === selectedPlatform.platform ? 'Testing...' : 'Test Credentials'}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button" className="px-4 py-2 rounded-xl bg-bg hover:bg-slate-200 text-text-secondary font-bold text-xs transition-colors" onClick={() => setConfigModalOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit" className="px-5 py-2 rounded-xl bg-primary hover:bg-primary text-primary-on font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50" disabled={isSaving}
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
