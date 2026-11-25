import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../common/Toast';
import { api } from '../../../services/api';
import { useContent } from '../../../contexts/ContentContext';
import { SpotlightCard } from '../../common/SpotlightCard';
import { DashboardPageHeader } from '../common/DashboardPageHeader';
import { ShieldCheck, Zap, Globe2, Plus, Settings, ArrowRight, Check, X, BookOpen } from 'lucide-react';

const SUPPORTED_PLATFORMS = [
  {
    platform: 'YOUTUBE',
    apiKey: 'youtube',
    name: 'YouTube Shorts & Channel',
    shortName: 'YouTube',
    placeholder: 'e.g. @your_channel',
    color: '#FF0000',
    gradient: 'linear-gradient(135deg, #FF0000 0%, #b00000 100%)',
    tag: 'YT',
    tagline: 'Brand videos, product demos & customer stories',
    audience: 'Video tutorials, demos & reviews',
    apiDocUrl: 'https://console.cloud.google.com/apis/credentials',
    developerPortalName: 'Google Cloud Console (YouTube Data API v3)',
    requiredPermissions: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/userinfo.profile'],
    guideSteps: [
      'Open Google Cloud Console and enable YouTube Data API v3.',
      'Under Credentials, create an OAuth 2.0 Client ID (Web application).',
      'Set Authorized JavaScript origin: http://localhost:3000',
      'Set Authorized redirect URI: http://localhost:3000/dashboard',
      'Click Login with YouTube to authorize, or paste tokens below.'
    ],
    fields: [
      {
        key: 'access_token',
        label: 'Google OAuth Access Token',
        type: 'password',
        placeholder: 'ya29...',
        required: true,
        helpText: 'OAuth User Access Token with youtube.upload permission'
      },
      {
        key: 'refresh_token',
        label: 'Google OAuth Refresh Token (Enables Auto-Refresh)',
        type: 'password',
        placeholder: '1//04...',
        required: false,
        helpText: 'Allows the platform to auto-refresh your access token when it expires'
      },
      {
        key: 'account_id',
        label: 'YouTube Channel ID (Optional)',
        type: 'text',
        placeholder: 'e.g. UC_x5XG1OV2P6uZZ5FSM9Ttw',
        required: false,
        helpText: 'Leave empty to auto-retrieve channel info'
      }
    ]
  },
  {
    platform: 'INSTAGRAM',
    apiKey: 'instagram',
    name: 'Instagram Professional / Creator',
    shortName: 'Instagram',
    placeholder: 'e.g. @your_instagram',
    color: '#E1306C',
    gradient: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
    tag: 'IG',
    tagline: 'Visual feed posts, high-res carousel posts & reels',
    audience: 'Visual showcase, carousels & reels',
    apiDocUrl: 'https://developers.facebook.com/docs/instagram-api',
    developerPortalName: 'Meta for Developers (Instagram Graph API)',
    requiredPermissions: ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'],
    guideSteps: [
      'Open Meta for Developers portal and create a Business App.',
      'Add Instagram Graph API product to your App.',
      'Go to Tools → Graph API Explorer, select your Page & Instagram Account.',
      'Generate a User/Page Access Token with instagram_content_publish permission.' ],
    fields: [
      {
        key: 'access_token',
        label: 'Meta / Instagram Access Token',
        type: 'password',
        placeholder: 'EAAB...',
        required: true,
        helpText: 'Page or User token with instagram_content_publish permission' },
      {
        key: 'account_id',
        label: 'Instagram Professional Account ID (Optional)',
        type: 'text',
        placeholder: 'e.g. 17841405829103948',
        required: false,
        helpText: 'Leave empty to auto-detect from token' }
    ]
  },
  {
    platform: 'FACEBOOK',
    apiKey: 'facebook',
    name: 'Facebook Pages',
    shortName: 'Facebook',
    placeholder: 'e.g. Your Facebook Page Name',
    color: '#1877F2',
    gradient: 'linear-gradient(135deg, #1877F2 0%, #0d5bbd 100%)',
    tag: 'FB',
    tagline: 'Brand community updates, photo galleries & store announcements',
    audience: 'Community updates & retail footfall (22–50)',
    apiDocUrl: 'https://developers.facebook.com/docs/pages',
    developerPortalName: 'Meta for Developers (Pages API)',
    requiredPermissions: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    guideSteps: [
      'Open Meta for Developers portal and select your App.',
      'Navigate to Tools → Graph API Explorer.',
      'Select your Facebook Page under "User or Page".',
      'Copy the Page Access Token with pages_manage_posts permission.' ],
    fields: [
      {
        key: 'access_token',
        label: 'Facebook Page Access Token',
        type: 'password',
        placeholder: 'EAAB...',
        required: true,
        helpText: 'Page token with pages_manage_posts permission' },
      {
        key: 'page_id',
        label: 'Facebook Page ID (Optional)',
        type: 'text',
        placeholder: 'e.g. 109283746591023',
        required: false,
        helpText: 'Target Page ID (auto-detected if blank)' }
    ]
  },
];

export function SocialAccountsView({ onNavigate, initialMode = 'accounts' }) {
  const { showToast } = useToast();
  const { brandProfile } = useContent();
  const [activeMainTab, setActiveMainTab] = useState(initialMode); // 'accounts' | 'admin_integrations'
  const brandSlug = (brandProfile?.name || 'brand').toLowerCase().replace(/[^a-z0-9]/g, '');
  const brandName = brandProfile?.name || 'Brand';

  // User Accounts State
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [expandedConnectPlatform, setExpandedConnectPlatform] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'connected' | 'unconnected'
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState(SUPPORTED_PLATFORMS[0]);
  const [connectTab, setConnectTab] = useState('manual'); // 'manual' | 'oauth'
  const [showPassword, setShowPassword] = useState(false);

  // Form State for User Connect Modal
  const [credentialsForm, setCredentialsForm] = useState({
    account_name: '',
    account_id: '',
    page_id: '',
    access_token: '',
    refresh_token: '' });

  // Inline Card Form State
  const [cardForms, setCardForms] = useState({
    INSTAGRAM: { account_name: '', account_id: '', access_token: '', showPass: false, showGuide: false },
    FACEBOOK: { account_name: '', page_id: '', access_token: '', showPass: false, showGuide: false },
    YOUTUBE: { account_name: '', account_id: '', access_token: '', refresh_token: '', showPass: false, showGuide: false }
  });

  // Per-platform submitting state (replaces shared isSubmitting boolean that blocked all cards)
  const [submittingPlatform, setSubmittingPlatform] = useState(null); // null | 'INSTAGRAM' | 'YOUTUBE' | etc.
  const [isSubmittingModal, setIsSubmittingModal] = useState(false); // for the modal form
  const [oauthLoading, setOauthLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [disconnectModalOpen, setDisconnectModalOpen] = useState(false);
  const [disconnectTarget, setDisconnectTarget] = useState(null);

  // Admin Integrations Management State
  const [adminPlatforms, setAdminPlatforms] = useState([]);
  const [isAdminLoading, setIsAdminLoading] = useState(false);
  const [adminConfigModalOpen, setAdminConfigModalOpen] = useState(false);
  const [selectedAdminPlat, setSelectedAdminPlat] = useState(null);
  const [adminForm, setAdminForm] = useState({
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
  const [adminConfigTab, setAdminConfigTab] = useState('credentials');
  const [showAdminSecret, setShowAdminSecret] = useState(false);
  const [isAdminSaving, setIsAdminSaving] = useState(false);
  const [testingAdminPlat, setTestingAdminPlat] = useState(null);
  const [refreshingId, setRefreshingId] = useState(null);

  // Facebook OAuth Page Selection Modal State
  const [fbPageModalOpen, setFbPageModalOpen] = useState(false);
  const [fbPagesList, setFbPagesList] = useState([]);
  const [fbSessionId, setFbSessionId] = useState(null);
  const [selectedFbPageId, setSelectedFbPageId] = useState(null);
  const [selectedConnectMode, setSelectedConnectMode] = useState('both'); // 'both' | 'instagram' | 'facebook'
  const [isSelectingFbPage, setIsSelectingFbPage] = useState(false);
  const [isConnectingFb, setIsConnectingFb] = useState(false);

  // Load connected accounts scoped to active enterprise / brand workspace
  const loadAccounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const live = await api.socialAccounts.list(brandProfile?.id);
      const filtered = (live || []).filter((a) => a && a.is_connected !== false);
      setAccounts(filtered);
    } catch (err) {
      console.warn('Could not load accounts:', err.message);
    } finally {
      setIsLoading(false);
    }
  }, [brandProfile?.id]);

  // Load Admin Platforms
  const loadAdminPlatforms = useCallback(async () => {
    setIsAdminLoading(true);
    try {
      const data = await api.admin.getPlatformIntegrations();
      const filtered = (data || []).filter((p) =>
        ['youtube', 'instagram', 'facebook'].includes((p.platform || '').toLowerCase())
      );
      setAdminPlatforms(filtered);
    } catch (err) {
      console.warn('Admin platform list error:', err.message);
    } finally {
      setIsAdminLoading(false);
    }
  }, []);

  // Check URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const view = params.get('view');
    const fbAuth = params.get('facebook_auth');
    const fbSessId = params.get('session_id');
    const fbErr = params.get('facebook_error');

    if (tab === 'admin' || view === 'admin-social-integrations') {
      setActiveMainTab('admin_integrations');
    }

    if (fbErr) {
      // Decode URL-encoded characters (including + as space) for clean error display
      const decodedErr = decodeURIComponent(fbErr.replace(/\+/g, ' '));
      showToast(`Facebook Connection Error: ${decodedErr}`, 'error');
      window.history.replaceState({}, document.title, window.location.pathname + '?view=social-accounts');
    }

    // Step 3: Handle Facebook OAuth Page Selection callback
    if (fbAuth === 'select_page' && fbSessId) {
      setFbSessionId(fbSessId);
      const prefPlat = sessionStorage.getItem('oauth_platform');
      if (prefPlat === 'instagram') {
        setSelectedConnectMode('instagram');
      } else if (prefPlat === 'facebook') {
        setSelectedConnectMode('facebook');
      } else {
        setSelectedConnectMode('both');
      }
      (async () => {
        try {
          showToast('Fetching your Facebook Pages & Instagram accounts...', 'info');
          const pages = await api.social.facebook.getPages(fbSessId);
          setFbPagesList(pages || []);
          if (pages && pages.length > 0) {
            setSelectedFbPageId(pages[0].id);
            setFbPageModalOpen(true);
          } else {
            showToast('No Facebook Pages found for this account. Ensure you are an Admin of at least one Facebook Page.', 'warning');
          }
        } catch (err) {
          showToast(`Failed to load Facebook Pages: ${err.message}`, 'error');
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname + '?view=social-accounts');
        }
      })();
    }

    async function checkOAuthCallback() {
      const code = params.get('code');
      const state = params.get('state');
      const platformParam = params.get('platform');

      if (code) {
        let detectedPlatform = platformParam || sessionStorage.getItem('oauth_platform') || 'instagram';
        let detectedBrandId = brandProfile?.id || null;
        let detectedRedirectUri = null;

        if (state) {
          try {
            const cleanState = state.includes('.') ? state.split('.')[0] : state;
            const base64Str = cleanState.replace(/-/g, '+').replace(/_/g, '/');
            const padded = base64Str.padEnd(base64Str.length + ((4 - (base64Str.length % 4)) % 4), '=');
            const decoded = JSON.parse(atob(padded));
            if (decoded.platform) detectedPlatform = decoded.platform;
            if (decoded.brand_id) detectedBrandId = decoded.brand_id;
            if (decoded.redirect_uri) detectedRedirectUri = decoded.redirect_uri;
          } catch (e) {
            console.log('State decoding error:', e);
          }
        }

        showToast(`Processing OAuth authorization callback for ${detectedPlatform.toUpperCase()}...`, 'info');
        try {
          const redirectUri = detectedRedirectUri || (
            (detectedPlatform === 'youtube' || detectedPlatform === 'google')
              ? `${window.location.origin}/dashboard`
              : `${window.location.origin}${window.location.pathname}?tab=socials`
          );
          await api.socialAccounts.handleOAuthCallback(detectedPlatform, {
            code,
            state,
            redirect_uri: redirectUri,
            brand_profile_id: detectedBrandId
          });
          showToast(`Successfully connected & verified ${detectedPlatform.toUpperCase()} account!`, 'success');
          window.history.replaceState({}, document.title, window.location.pathname + '?view=social-accounts');
          await loadAccounts();
        } catch (err) {
          showToast(`OAuth Connection failed: ${err.message}`, 'error');
        } finally {
          sessionStorage.removeItem('oauth_platform');
        }
      }
    }

    checkOAuthCallback();
    loadAccounts();
    loadAdminPlatforms();
  }, [loadAccounts, loadAdminPlatforms, showToast]);

  const handleFacebookConnect = async (targetPlat = 'facebook', forceSwitch = true) => {
    setIsConnectingFb(true);
    sessionStorage.setItem('oauth_platform', targetPlat);
    showToast(`Redirecting to Meta to authorize ${targetPlat === 'instagram' ? 'Instagram' : 'Facebook'} permissions...`, 'info');
    try {
      const res = await api.social.facebook.connect(brandProfile?.id, forceSwitch);
      if (res.authorization_url) {
        window.location.href = res.authorization_url;
      } else {
        showToast('Failed to generate Meta authorization URL.', 'error');
      }
    } catch (err) {
      const matchingPlat = SUPPORTED_PLATFORMS.find((p) => p.apiKey === targetPlat);
      if (matchingPlat) {
        setExpandedConnectPlatform(matchingPlat.platform);
      }
      showToast(`Please enter your ${targetPlat === 'instagram' ? 'Instagram' : 'Facebook'} access token below to connect directly: ${err.message}`, 'info');
    } finally {
      setIsConnectingFb(false);
    }
  };

  const handleSelectFacebookPage = async (e, directPageId = null) => {
    if (e) e.preventDefault();
    const targetPageId = directPageId || selectedFbPageId;
    if (!targetPageId || !fbSessionId) {
      showToast('Please select an account to connect.', 'warning');
      return;
    }

    setIsSelectingFbPage(true);
    try {
      const res = await api.social.facebook.selectPage({
        session_id: fbSessionId,
        page_id: targetPageId,
        brand_profile_id: brandProfile?.id,
        connect_mode: selectedConnectMode || 'both'
      });

      const pageName = res.facebook_account?.page_name || 'Facebook Page';
      const igName = res.instagram_account?.account_name;
      const igMsg = igName ? ` and linked Instagram (@${igName.replace('@', '')})` : '';

      showToast(`Successfully connected "${pageName}"${igMsg} to ${brandName}!`, 'success');
      setFbPageModalOpen(false);
      setFbPagesList([]);
      setFbSessionId(null);
      await loadAccounts();
    } catch (err) {
      showToast(`Failed to connect account: ${err.message}`, 'error');
    } finally {
      setIsSelectingFbPage(false);
    }
  };

  const handleTestFacebookAccount = async (account) => {
    setVerifyingId(account.id);
    showToast(`Testing live Meta Graph API connection for ${account.account_name}...`, 'info');
    try {
      const res = await api.social.facebook.test(account.id);
      showToast(`Page Verified: ${res.name} (Followers: ${res.followers}) - Token is healthy!`, 'success');
      await loadAccounts();
    } catch (err) {
      showToast(`Meta Graph API test: ${err.message}`, 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleOpenConnectModal = (platformObj) => {
    const plat = platformObj || SUPPORTED_PLATFORMS[0];
    setSelectedPlatform(plat);
    setConnectTab('oauth');
    setCredentialsForm({
      account_name: '',
      account_id: '',
      page_id: '',
      access_token: '',
      refresh_token: '' });
    setConnectModalOpen(true);
  };

  const handleLaunchOAuth = async (platKey, forceSwitch = true) => {
    const targetPlat = platKey || selectedPlatform.apiKey;
    if (targetPlat === 'facebook' || targetPlat === 'instagram') {
      await handleFacebookConnect(targetPlat, forceSwitch);
      return;
    }
    setOauthLoading(true);
    try {
      const redirectUri = (targetPlat === 'youtube' || targetPlat === 'google')
        ? `${window.location.origin}/dashboard`
        : `${window.location.origin}${window.location.pathname}?tab=socials`;
      const authData = await api.socialAccounts.getOAuthAuthorizeUrl(targetPlat, redirectUri, brandProfile?.id, forceSwitch);

      if (authData.client_id_configured && authData.authorize_url) {
        sessionStorage.setItem('oauth_platform', targetPlat);
        window.location.href = authData.authorize_url;
      } else {
        const matchingPlat = SUPPORTED_PLATFORMS.find((p) => p.apiKey === targetPlat);
        if (matchingPlat) {
          setExpandedConnectPlatform(matchingPlat.platform);
        }
        showToast(
          `Please enter your ${targetPlat.toUpperCase()} handle and credentials below to connect your account.`,
          'info'
        );
        setConnectTab('manual');
      }
    } catch (err) {
      showToast(`OAuth authorization error: ${err.message}`, 'error');
    } finally {
      setOauthLoading(false);
    }
  };

  const cleanCredential = (val) => {
    if (!val) return '';
    return String(val).replace(/[\u200b\u200c\u200d\ufeff\u2060\u200e\u200f\u00a0\r\n]+/g, '').trim();
  };

  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    const cleanAccessToken = cleanCredential(credentialsForm.access_token);
    const cleanRefreshToken = cleanCredential(credentialsForm.refresh_token);

    if (!cleanAccessToken) {
      showToast('Please enter an Access Token or API Key.', 'error');
      return;
    }

    setIsSubmittingModal(true);
    try {
      const payload = {
        platform: selectedPlatform.platform,
        account_name: credentialsForm.account_name ? credentialsForm.account_name.trim() : null,
        account_id: credentialsForm.account_id ? credentialsForm.account_id.trim() : null,
        page_id: credentialsForm.page_id ? credentialsForm.page_id.trim() : null,
        access_token: cleanAccessToken,
        refresh_token: cleanRefreshToken || null,
        brand_profile_id: brandProfile?.id
      };

      await api.socialAccounts.connectCredentials(payload);
      showToast(`Successfully connected ${selectedPlatform.name}! Account is ready for publishing.`, 'success');
      setConnectModalOpen(false);
      setExpandedConnectPlatform(null);
      await loadAccounts();
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      setIsSubmittingModal(false);
    }
  };

  const handleCardConnectSubmit = async (e, platformObj) => {
    e.preventDefault();
    const platKey = platformObj.platform;
    const form = cardForms[platKey] || {};
    const cleanAccessToken = cleanCredential(form.access_token);
    const cleanRefreshToken = cleanCredential(form.refresh_token);

    if (!cleanAccessToken) {
      showToast(`Please enter an Access Token for ${platformObj.name}.`, 'error');
      return;
    }

    // Per-platform loading state — only THIS card shows "Connecting..."
    setSubmittingPlatform(platKey);
    try {
      const payload = {
        platform: platformObj.platform,
        account_name: form.account_name ? form.account_name.trim() : null,
        account_id: form.account_id ? form.account_id.trim() : null,
        page_id: form.page_id ? form.page_id.trim() : null,
        access_token: cleanAccessToken,
        refresh_token: cleanRefreshToken || null,
        brand_profile_id: brandProfile?.id
      };

      await api.socialAccounts.connectCredentials(payload);
      showToast(`Successfully connected ${platformObj.name}!`, 'success');
      setExpandedConnectPlatform(null);
      await loadAccounts();
    } catch (err) {
      showToast(`Connection failed: ${err.message}`, 'error');
    } finally {
      // Always clear this platform's loading state, regardless of success/failure
      setSubmittingPlatform(null);
    }
  };

  const handleVerifyAccount = async (account) => {
    setVerifyingId(account.id);
    showToast(`Testing live connection to ${account.platform.toUpperCase()}...`, 'info');
    try {
      const result = await api.socialAccounts.verify(account.id);
      if (result.is_connected) {
        showToast(`Connection Verified! Account: ${result.account_name || account.account_name} is active.`, 'success');
      } else {
        showToast(`Inactive: ${result.error_message || 'Token expired or permissions revoked'}`, 'warning');
      }
      await loadAccounts();
    } catch (err) {
      showToast(`Verification test: ${err.message}`, 'error');
      await loadAccounts();
    } finally {
      setVerifyingId(null);
    }
  };

  const handleRefreshAccount = async (account) => {
    setRefreshingId(account.id);
    showToast(`Refreshing credentials for ${account.account_name}...`, 'info');
    try {
      await api.socialAccounts.refresh(account.id);
      showToast(`Credentials refreshed and verified for ${account.account_name}!`, 'success');
      await loadAccounts();
    } catch (err) {
      showToast(`Refresh failed: ${err.message}`, 'error');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleOpenEdit = (account) => {
    setEditingAccount({
      id: account.id,
      account_name: account.account_name,
      platform: account.platform,
      is_connected: account.is_connected,
      access_token: '' });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingAccount) return;

    try {
      const updatePayload = {
        account_name: editingAccount.account_name,
        is_connected: editingAccount.is_connected
      };
      if (editingAccount.access_token && editingAccount.access_token.trim()) {
        updatePayload.access_token = editingAccount.access_token.trim();
      }

      await api.socialAccounts.update(editingAccount.id, updatePayload);
      showToast('Account settings updated.', 'success');
      setEditModalOpen(false);
      setEditingAccount(null);
      await loadAccounts();
    } catch (err) {
      showToast(`Update failed: ${err.message}`, 'error');
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!disconnectTarget) return;
    try {
      await api.socialAccounts.delete(disconnectTarget.id);
      showToast(`Account ${disconnectTarget.account_name} disconnected.`, 'info');
      setDisconnectModalOpen(false);
      setDisconnectTarget(null);
      await loadAccounts();
    } catch (err) {
      showToast(`Disconnect failed: ${err.message}`, 'error');
    }
  };

  // Admin Configuration Actions
  const handleOpenAdminConfig = (plat) => {
    setSelectedAdminPlat(plat);
    setShowAdminSecret(false);
    setAdminConfigTab('credentials');
    setAdminForm({
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
    setAdminConfigModalOpen(true);
  };

  const handleSaveAdminConfig = async (e) => {
    e.preventDefault();
    if (!selectedAdminPlat) return;
    setIsAdminSaving(true);
    try {
      const payload = {
        display_name: adminForm.display_name,
        is_enabled: adminForm.is_enabled,
        environment: adminForm.environment,
        client_id: adminForm.client_id,
        auth_url: adminForm.auth_url,
        token_url: adminForm.token_url,
        api_base_url: adminForm.api_base_url,
        api_version: adminForm.api_version,
        redirect_uri: adminForm.redirect_uri,
        scopes: adminForm.scopes_str.split(',').map((s) => s.trim()).filter(Boolean),
        webhook_url: adminForm.webhook_url,
        config_notes: adminForm.config_notes
      };
      if (adminForm.client_secret && adminForm.client_secret.trim()) {
        payload.client_secret = adminForm.client_secret.trim();
      }
      if (adminForm.api_key && adminForm.api_key.trim()) {
        payload.api_key = adminForm.api_key.trim();
      }
      if (adminForm.api_secret && adminForm.api_secret.trim()) {
        payload.api_secret = adminForm.api_secret.trim();
      }

      await api.admin.updatePlatformIntegration(selectedAdminPlat.platform, payload);
      showToast(`${selectedAdminPlat.display_name} developer credentials saved.`, 'success');
      setAdminConfigModalOpen(false);
      await loadAdminPlatforms();
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error');
    } finally {
      setIsAdminSaving(false);
    }
  };

  const handleToggleAdminPlatform = async (plat) => {
    const newStatus = !plat.is_enabled;
    try {
      await api.admin.togglePlatformIntegration(plat.platform, newStatus);
      showToast(`${plat.display_name} ${newStatus ? 'enabled' : 'disabled'}.`, 'info');
      await loadAdminPlatforms();
    } catch (err) {
      showToast(`Toggle failed: ${err.message}`, 'error');
    }
  };

  const handleTestAdminPlatform = async (plat, customPayload = null) => {
    setTestingAdminPlat(plat.platform);
    showToast(`Testing live API connectivity for ${plat.display_name}...`, 'info');
    try {
      const res = await api.admin.testPlatformIntegration(plat.platform, customPayload || {});
      if (res.success) {
        showToast(`${plat.display_name} Test Passed: ${res.message}`, 'success');
      } else {
        showToast(`${plat.display_name} Warning: ${res.message}`, 'warning');
      }
      await loadAdminPlatforms();
    } catch (err) {
      showToast(`Test failed: ${err.message}`, 'error');
    } finally {
      setTestingAdminPlat(null);
    }
  };

  const normalizePlat = (p) => {
    return String(p || '').trim().toLowerCase();
  };

  const getAccountStatus = (acc) => {
    if (!acc) return { status: 'UNCONNECTED', label: 'Not Connected', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
    const meta = acc.meta_info || {};
    if (meta.requires_reauthorization || meta.verification_status === 'REQUIRES_REAUTHORIZATION') {
      return { status: 'REQUIRES_REAUTH', label: 'Needs Reconnection', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', requiresReauth: true };
    }
    if (acc.is_connected) {
      if (acc.token_expires_at) {
        const msLeft = new Date(acc.token_expires_at) - new Date();
        const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
        if (daysLeft > 0 && daysLeft <= 60) {
          return { status: 'CONNECTED', label: `Auto-Renews in ${daysLeft}d`, color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' };
        }
      }
      return { status: 'CONNECTED', label: 'Healthy & Auto-Renewing', color: '#15803d', bg: '#dcfce7', border: '#bbf7d0' };
    }
    if (acc.token_expires_at && new Date(acc.token_expires_at) < new Date()) {
      return { status: 'EXPIRED', label: 'Token Expired', color: '#b45309', bg: '#fef3c7', border: '#fde68a' };
    }
    if (meta.verification_status === 'FAILED' || meta.last_error) {
      return { status: 'REQUIRES_REAUTH', label: 'Needs Reconnection', color: '#b91c1c', bg: '#fee2e2', border: '#fecaca', requiresReauth: true };
    }
    return { status: 'DISCONNECTED', label: 'Disconnected', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' };
  };

  const connectedCount = accounts.filter((a) => a.is_connected).length;
  const filteredPlatforms = SUPPORTED_PLATFORMS.filter((p) => {
    const isConn = accounts.some((a) => normalizePlat(a.platform) === p.apiKey && a.is_connected);
    if (statusFilter === 'connected') return isConn;
    if (statusFilter === 'unconnected') return !isConn;
    return true;
  });

  const adminEnabledCount = adminPlatforms.filter((p) => p.is_enabled).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
      {/* 1. TOP VIEW MODE SWITCHER TABS */}
      <div
        className="flex items-center justify-between flex-wrap gap-3 p-2 bg-white dark:bg-surface border border-border rounded-2xl shadow-xs transition-colors"
      >
        <div className="flex gap-1.5 p-1 bg-[#FFFFFF] dark:bg-surface rounded-xl border border-border">
          <button
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeMainTab === 'accounts'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-text-secondary hover:text-text'
            }`}
            onClick={() => setActiveMainTab('accounts')}
          >
            Connected Brand Profiles ({connectedCount} Active)
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
              activeMainTab === 'admin_integrations'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'text-text-secondary hover:text-text'
            }`}
            onClick={() => setActiveMainTab('admin_integrations')}
          >
            Admin Developer API Keys & OAuth ({adminEnabledCount} / {adminPlatforms.length || 4} Enabled)
          </button>
        </div>

        <div className="text-xs font-medium text-[#4A5070] dark:text-accent px-2">
          {activeMainTab === 'accounts' ? 'User Channel Connections' : 'Global Application Developer Credentials'}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: USER CONNECTED SOCIAL ACCOUNTS */}
      {/* ========================================================================= */}
      {activeMainTab === 'accounts' && (
        <>
          {/* Page Header */}
          <DashboardPageHeader
            badge="1. SOCIAL CHANNELS & API" badgeType="indigo" statusBadge={`${connectedCount} of ${SUPPORTED_PLATFORMS.length} Channels Active`}
            title="Social Media Accounts & Publishing Channels" description="Connect your brand profiles to enable automated AI post scheduling, instant 1-click publishing, and live engagement metrics across YouTube, Instagram, and Facebook." >
            <button
              onClick={() => onNavigate && onNavigate('token-guide')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary bg-surface border border-border hover:bg-surface-selected transition-all shadow-xs cursor-pointer"
              title="Step-by-step instructions for getting tokens from official developer portals"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Token Generation Guide</span>
            </button>
            <button
              onClick={() => setActiveMainTab('admin_integrations')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected hover:text-text transition-all shadow-xs cursor-pointer" title="Configure global OAuth developer credentials" >
              <Settings className="w-4 h-4 text-text-muted" />
              <span>Admin App Keys</span>
            </button>
            <button
              onClick={() => handleOpenConnectModal(SUPPORTED_PLATFORMS[0])}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-primary-on bg-primary hover:brightness-105 active:scale-95 transition-all shadow-md shadow-primary/20 cursor-pointer" >
              <Plus className="w-4 h-4" />
              <span>Connect Channel</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('publishing-automation')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-text-secondary bg-surface border border-border hover:bg-surface-selected hover:text-text transition-all shadow-xs cursor-pointer" >
                <span>Publishing Queue</span>
                <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
              </button>
            )}
          </DashboardPageHeader>

          {/* Quick Highlights Bento Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SpotlightCard className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted uppercase tracking-wider block">Security Status</span>
                <span className="text-sm font-bold text-text">AES-256 Encrypted Vault</span>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-raised text-primary dark:text-accent flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted dark:text-accent uppercase tracking-wider block">Auto-Publishing</span>
                <span className={`text-sm font-bold ${connectedCount > 0 ? 'text-primary dark:text-emerald-400' : 'text-warning dark:text-accent'}`}>
                  {connectedCount > 0 ? 'Ready & Synchronized' : 'Connect 1+ Channel'}
                </span>
              </div>
            </SpotlightCard>

            <SpotlightCard className="p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-surface-raised text-primary dark:text-accent flex items-center justify-center shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-text-muted dark:text-accent uppercase tracking-wider block">Supported Formats</span>
                <span className="text-sm font-bold text-text dark:text-white">Shorts, Reels, Pins, Posts</span>
              </div>
            </SpotlightCard>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'all'
                    ? 'bg-primary text-primary-on shadow-xs'
                    : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
                onClick={() => setStatusFilter('all')}
              >
                All Channels ({SUPPORTED_PLATFORMS.length})
              </button>
              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'connected'
                    ? 'bg-primary text-primary-on shadow-xs'
                    : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
                onClick={() => setStatusFilter('connected')}
              >
                Connected ({connectedCount})
              </button>
              <button
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === 'unconnected'
                    ? 'bg-primary text-primary-on shadow-xs'
                    : 'bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-selected'
                }`}
                onClick={() => setStatusFilter('unconnected')}
              >
                Ready to Connect ({SUPPORTED_PLATFORMS.length - connectedCount})
              </button>
            </div>

            <div className="text-xs font-medium text-text-muted">
              Showing <strong className="text-text">{filteredPlatforms.length}</strong> platforms
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPlatforms.map((platform) => {
              const matchingAccounts = accounts.filter((a) =>
                normalizePlat(a.platform) === platform.apiKey &&
                (!brandProfile?.id || a.brand_profile_id === brandProfile.id)
              );
              const connectedAcc = matchingAccounts.find((a) => a.is_connected) || matchingAccounts[0];
              const isConnected = !!connectedAcc && connectedAcc.is_connected;
              const isVerifying = verifyingId === connectedAcc?.id;
              const isRefreshing = refreshingId === connectedAcc?.id;
              const isExpanded = expandedConnectPlatform === platform.platform;
              const cardForm = cardForms[platform.platform] || {};
              const lastVerified = connectedAcc?.meta_info?.last_verified_at;
              const permissions = connectedAcc?.meta_info?.permissions || [];
              const statusInfo = getAccountStatus(connectedAcc);

              return (
                <SpotlightCard
                  key={platform.platform}
                  className={`p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border-border bg-white dark:bg-surface ${
                    isExpanded
                      ? 'border-border ring-2 ring-primary/20'
                      : ''
                  }`}
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3.5 items-center">
                        <div
                          style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '14px',
                            background: platform.gradient,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.2rem',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                            flexShrink: 0
                          }}
                        >
                          {platform.tag}
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-extrabold text-text dark:text-white m-0">
                            {platform.name}
                          </h2>
                          <span className={`text-xs ${isConnected ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-[#4A5070] dark:text-text-muted font-medium'}`}>
                            {connectedAcc ? connectedAcc.account_name : platform.tagline}
                          </span>
                          {matchingAccounts.length > 1 && (
                            <div className="text-[11px] text-primary dark:text-accent font-semibold mt-0.5">
                              +{matchingAccounts.length - 1} additional account(s) connected
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          background: statusInfo.bg,
                          color: statusInfo.color,
                          border: `1px solid ${statusInfo.border}`,
                          flexShrink: 0
                        }}
                      >
                        {statusInfo.label}
                      </span>
                    </div>

                    {/* Reconnection Alert Banner if required */}
                    {connectedAcc?.meta_info?.requires_reauthorization && (
                      <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 rounded-xl p-3.5 mb-4 text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-red-800 dark:text-red-300 mb-1">
                          <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <span>Action Required: Reconnection Needed</span>
                        </div>
                        <p className="text-[11px] text-red-700 dark:text-red-300/90 leading-relaxed mb-2.5">
                          {connectedAcc.meta_info.reauthorization_reason ||
                            connectedAcc.meta_info.last_refresh_error ||
                            'The access token has expired or permissions were revoked. Please reconnect your account to continue scheduled publishing.'}
                        </p>
                        <button
                          onClick={() => handleLaunchOAuth(platform.apiKey)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xs shadow-xs transition-all active:scale-95"
                        >
                          ⚡ Reconnect {platform.shortName}
                        </button>
                      </div>
                    )}

                    {/* Connected Details */}
                    {isConnected ? (
                      <div className="bg-[#FFFFFF] dark:bg-surface border border-[#dcfce7] dark:border-emerald-900/40 rounded-xl p-3.5 mb-4 text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[#4A5070] dark:text-text-muted">Connected Handle:</span>
                          <strong className="text-text dark:text-white font-bold">{connectedAcc.account_name}</strong>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[#4A5070] dark:text-text-muted">Renewal Engine:</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            Backend Auto-Renew Active
                          </span>
                        </div>
                        {connectedAcc.token_expires_at && (
                          <div className="flex justify-between items-center">
                            <span className="text-[#4A5070] dark:text-text-muted">Token Renewal Window:</span>
                            <span className="font-mono text-[#4A5070] dark:text-text-secondary bg-surface-selected dark:bg-surface px-1.5 py-0.5 rounded text-[11px]">
                              {new Date(connectedAcc.token_expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center">
                          <span className="text-[#4A5070] dark:text-text-muted">Token Vault:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">AES-256 Encrypted</span>
                        </div>
                        {permissions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {permissions.map((p) => (
                              <span key={p} className="text-[10px] bg-primary-soft text-primary border border-primary/20 px-1.5 py-0.2 rounded font-semibold">
                                <Check className="w-3 h-3 inline-block mr-0.5" />{p}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      !isExpanded && (
                        <div className="bg-[#FFFFFF] dark:bg-surface border border-border rounded-xl p-3.5 mb-4 text-xs">
                          <div className="font-bold text-text dark:text-white mb-1">
                            Ready to link {platform.shortName}
                          </div>
                          <p className="text-[11px] text-[#4A5070] dark:text-text-muted leading-relaxed m-0">
                            {platform.audience}. Click below to enter your access token or test credentials.
                          </p>
                        </div>
                      )
                    )}

                    {/* Inline Form */}
                    {isExpanded && !isConnected && (
                      <form
                        onSubmit={(e) => handleCardConnectSubmit(e, platform)}
                        style={{
                          background: '#f8fafc',
                          border: '1.5px solid #bfdbfe',
                          borderRadius: '12px',
                          padding: '16px',
                          marginBottom: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                          <strong style={{ fontSize: '0.88rem', color: '#1e3a8a' }}>
                            Connect {platform.shortName} Channel
                          </strong>
                        </div>

                        {platform.apiKey === 'youtube' && (
                          <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#eff6ff', border: '1px solid #bfdbfe', fontSize: '0.78rem', color: '#1e40af', lineHeight: 1.4 }}>
                            <strong>💡 Recommended:</strong> Use <strong>"Login with YouTube"</strong> for 1-click official OAuth authorization with automatic refresh. If entering a manual token, it must be a fresh Google OAuth Bearer token (<code>ya29...</code>). API keys and Client Secrets (<code>GOCSPX-...</code>) cannot authenticate YouTube channel ownership.
                          </div>
                        )}

                        <div className="field" style={{ margin: 0 }}>
                          <label className="label" style={{ fontSize: '0.8rem' }}>Account Handle or Page Name *</label>
                          <input
                            className="input" style={{ height: '36px', fontSize: '0.85rem' }}
                            required
                            value={cardForm.account_name || ''}
                            onChange={(e) =>
                              setCardForms((prev) => ({
                                ...prev,
                                [platform.platform]: { ...prev[platform.platform], account_name: e.target.value }
                              }))
                            }
                            placeholder={platform.placeholder || 'e.g. @your_account_handle'}
                          />
                        </div>

                        <div className="field" style={{ margin: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="label" style={{ fontSize: '0.8rem' }}>Access Token / API Key *</label>
                            <button
                              type="button" style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                              onClick={() =>
                                setCardForms((prev) => ({
                                  ...prev,
                                  [platform.platform]: { ...prev[platform.platform], showPass: !prev[platform.platform].showPass }
                                }))
                              }
                            >
                              {cardForm.showPass ? 'Hide' : 'Show'}
                            </button>
                          </div>
                          <input
                            type={cardForm.showPass ? 'text' : 'password'}
                            className="input" style={{ height: '36px', fontSize: '0.85rem', fontFamily: cardForm.showPass ? 'monospace' : 'inherit' }}
                            required
                            value={cardForm.access_token || ''}
                            onChange={(e) =>
                              setCardForms((prev) => ({
                                ...prev,
                                [platform.platform]: { ...prev[platform.platform], access_token: e.target.value }
                              }))
                            }
                            placeholder={platform.fields[0].placeholder}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                            {platform.fields[0].helpText}
                          </span>
                        </div>

                        {platform.platform === 'YOUTUBE' && (
                          <div className="field" style={{ margin: 0, marginTop: '8px' }}>
                            <label className="label" style={{ fontSize: '0.8rem' }}>Google OAuth Refresh Token (Optional for Auto-Refresh)</label>
                            <input
                              type="password"
                              className="input" style={{ height: '36px', fontSize: '0.85rem' }}
                              value={cardForm.refresh_token || ''}
                              onChange={(e) =>
                                setCardForms((prev) => ({
                                  ...prev,
                                  [platform.platform]: { ...prev[platform.platform], refresh_token: e.target.value }
                                }))
                              }
                              placeholder="1//04... (paste your refresh token)"
                            />
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Paste your refresh token to enable automatic access-token renewal.
                            </span>
                          </div>
                        )}


                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
                          <button
                            type="button" className="btn btn--secondary btn--sm" onClick={() => setExpandedConnectPlatform(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit" className="btn btn--primary btn--sm" disabled={submittingPlatform === platform.platform}
                            style={{ fontWeight: 700 }}
                          >
                            {submittingPlatform === platform.platform ? 'Connecting...' : `Connect ${platform.shortName}`}
                          </button>
                        </div>
                      </form>
                    )}

                    <div style={{ fontSize: '0.76rem', color: '#64748b', marginBottom: '14px' }}>
                      Docs:{' '}
                      <a
                        href={platform.apiDocUrl}
                        target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}
                      >
                        {platform.developerPortalName} ↗
                      </a>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '14px', flexWrap: 'wrap' }}>
                    {isConnected ? (
                      <>
                        <button
                          className="btn btn--secondary btn--sm" style={{ flex: 1 }}
                          disabled={isVerifying}
                          onClick={() => {
                            if (platform.platform === 'FACEBOOK') {
                              handleTestFacebookAccount(connectedAcc);
                            } else {
                              handleVerifyAccount(connectedAcc);
                            }
                          }}
                        >
                          {isVerifying ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                          className="btn btn--secondary btn--sm" disabled={isRefreshing}
                          onClick={() => handleRefreshAccount(connectedAcc)}
                          title="Refresh OAuth Token" >
                          {isRefreshing ? '' : 'Refresh'}
                        </button>
                        <button className="btn btn--secondary btn--sm" onClick={() => handleOpenEdit(connectedAcc)}>
                          Edit
                        </button>
                        <button
                          className="btn btn--danger btn--sm" onClick={() => {
                            setDisconnectTarget(connectedAcc);
                            setDisconnectModalOpen(true);
                          }}
                        ><X className="w-4 h-4 inline-block mr-1" />Disconnect
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn--primary btn--sm"
                          style={{ flex: 1.5, fontWeight: 700 }}
                          onClick={() => handleLaunchOAuth(platform.apiKey)}
                          disabled={oauthLoading}
                          title={`Authorize via official ${platform.name} OAuth`}
                        >
                          ⚡ Connect {platform.shortName}
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          style={{ flex: 0.8, fontSize: '0.78rem' }}
                          onClick={() => setExpandedConnectPlatform(isExpanded ? null : platform.platform)}
                          title="Manual access token entry (Advanced / Dev)"
                        >
                          {isExpanded ? '▲ Close' : 'Manual Setup'}
                        </button>
                        <button
                          className="btn btn--secondary btn--sm"
                          onClick={() => handleOpenConnectModal(platform)}
                          title="Open connection options"
                        >
                          ⋯ More
                        </button>
                      </>
                    )}
                  </div>
                </SpotlightCard>
                );
              })}
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: ADMIN DEVELOPER INTEGRATIONS & OAUTH MANAGEMENT */}
      {/* ========================================================================= */}
      {activeMainTab === 'admin_integrations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Admin Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              borderRadius: '16px',
              padding: '24px 28px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.74rem', background: 'rgba(59, 130, 246, 0.25)', color: '#93c5fd', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    GLOBAL DEVELOPER APP CREDENTIALS
                  </span>
                  <span style={{ fontSize: '0.74rem', background: 'rgba(16, 185, 129, 0.25)', color: '#6ee7b7', padding: '3px 10px', borderRadius: '20px', fontWeight: 700 }}>
                    {adminEnabledCount} of {SUPPORTED_PLATFORMS.length} Platforms Enabled
                  </span>
                </div>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                  Admin Platform Credentials & OAuth Endpoints
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0, maxWidth: '740px', lineHeight: 1.5 }}>
                  Configure developer App IDs, encrypted secrets, API endpoints, permissions, and video publishing specifications for YouTube, Instagram, and Facebook.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn--secondary btn--sm" style={{ background: 'rgba(255,255,255,0.1)', color: '#ffffff', borderColor: 'rgba(255,255,255,0.2)' }}
                  onClick={loadAdminPlatforms}
                >
                  Refresh Status
                </button>
                <button
                  className="btn btn--primary btn--sm" style={{ fontWeight: 700 }}
                  onClick={() => setActiveMainTab('accounts')}
                >
                  Back to Accounts
                </button>
              </div>
            </div>
          </div>

          {/* Admin Platform Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {adminPlatforms.map((plat) => {
              const meta = SUPPORTED_PLATFORMS.find((p) => p.apiKey === plat.platform) || {
                tag: plat.platform.slice(0, 2).toUpperCase(),
                gradient: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' };
              const isConfigured = plat.client_id && plat.client_secret_configured;
              const isTesting = testingAdminPlat === plat.platform;

              return (
                <div
                  key={plat.id}
                  className="card" style={{
                    borderRadius: '16px',
                    padding: '20px',
                    border: plat.is_enabled ? '1.5px solid #93c5fd' : '1px solid var(--border, #e2e8f0)',
                    background: plat.is_enabled ? 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)' : '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: meta.gradient,
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                        >
                          {meta.tag}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                            {plat.display_name}
                          </h3>
                          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                            API {plat.api_version || 'v1'} • {plat.environment === 'production' ? 'Production' : 'Sandbox'}
                          </span>
                        </div>
                      </div>

                      <label className="switch" title={plat.is_enabled ? 'Disable' : 'Enable'}>
                        <input
                          type="checkbox" checked={plat.is_enabled}
                          onChange={() => handleToggleAdminPlatform(plat)}
                        />
                        <span />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          background: plat.is_enabled ? '#dcfce7' : '#f1f5f9',
                          color: plat.is_enabled ? '#15803d' : '#64748b',
                          border: plat.is_enabled ? '1px solid #bbf7d0' : '1px solid #e2e8f0' }}
                      >
                        {plat.is_enabled ? 'Enabled' : 'Disabled'}
                      </span>

                      <span
                        style={{
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          background: isConfigured ? '#eff6ff' : '#fffbeb',
                          color: isConfigured ? '#1d4ed8' : '#b45309',
                          border: isConfigured ? '1px solid #bfdbfe' : '1px solid #fde68a' }}
                      >
                        {isConfigured ? 'Encrypted Vault' : 'Unset'}
                      </span>

                      {plat.test_status === 'healthy' && (
                        <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}><Check className="w-4 h-4 inline-block mr-1" />Healthy
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        padding: '12px',
                        fontSize: '0.82rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginBottom: '12px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Client ID:</span>
                        <span style={{ fontFamily: 'monospace', color: plat.client_id ? '#0f172a' : '#94a3b8', fontWeight: 600 }}>
                          {plat.client_id ? `${plat.client_id.slice(0, 16)}...` : 'Not Set'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Client Secret:</span>
                        <span style={{ fontFamily: 'monospace', color: plat.client_secret_configured ? '#10b981' : '#94a3b8' }}>
                          {plat.client_secret_configured ? plat.client_secret_masked : 'Not Set'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748b' }}>Scopes:</span>
                        <span style={{ color: '#334155', fontSize: '0.75rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {(plat.scopes || []).join(', ') || 'None'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '12px' }}>
                    <button
                      className="btn btn--secondary btn--sm" style={{ flex: 1 }}
                      disabled={isTesting}
                      onClick={() => handleTestAdminPlatform(plat)}
                    >
                      {isTesting ? 'Testing...' : 'Test API'}
                    </button>
                    <button
                      className="btn btn--primary btn--sm" style={{ flex: 1.2, fontWeight: 700 }}
                      onClick={() => handleOpenAdminConfig(plat)}
                    >
                      Configure
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}



      {/* 1. USER CONNECT MODAL */}
      {connectModalOpen && selectedPlatform && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px' }}
        >
          <div
            className="card" style={{
              maxWidth: '580px',
              width: '100%',
              background: '#ffffff',
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              borderRadius: '20px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: selectedPlatform.gradient,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '1.1rem' }}
                >
                  {selectedPlatform.tag}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Connect {selectedPlatform.name}
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                    Connect with a verified access token or official provider login
                  </span>
                </div>
              </div>
              <button
                type="button" style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setConnectModalOpen(false)}
              ><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', overflowX: 'auto', paddingBottom: '4px' }}>
              {SUPPORTED_PLATFORMS.map((p) => (
                <button
                  key={p.platform}
                  type="button" className={`btn btn--sm ${selectedPlatform.platform === p.platform ? 'btn--primary' : 'btn--secondary'}`}
                  style={{ fontSize: '0.78rem', borderRadius: '20px' }}
                  onClick={() => {
                    setSelectedPlatform(p);
                    setConnectTab('oauth');
                    setCredentialsForm((prev) => ({
                      ...prev,
                      account_name: ''
                    }));
                  }}
                >
                  {p.tag} {p.shortName}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
              <button type="button" className={`btn btn--sm ${connectTab === 'oauth' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setConnectTab('oauth')}>
                ⚡ Official 1-Click Connect (Recommended)
              </button>
              <button type="button" className={`btn btn--sm ${connectTab === 'manual' ? 'btn--primary' : 'btn--secondary'}`} onClick={() => setConnectTab('manual')}>
                Manual Tokens (Custom / Dev)
              </button>
            </div>

            {connectTab === 'manual' ? (
            <form onSubmit={handleConnectSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              <div className="field" style={{ margin: 0 }}>
                <label className="label">Account Handle / Brand Name *</label>
                <input
                  className="input" required
                  value={credentialsForm.account_name}
                  onChange={(e) => setCredentialsForm({ ...credentialsForm, account_name: e.target.value })}
                  placeholder={selectedPlatform.placeholder || 'e.g. @your_account_handle'}
                />
              </div>

              {selectedPlatform.fields.map((f) => (
                <div className="field" key={f.key} style={{ margin: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="label">{f.label}</label>
                    {f.type === 'password' && (
                      <button
                        type="button" style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    )}
                  </div>
                  <input
                    type={f.type === 'password' ? (showPassword ? 'text' : 'password') : f.type}
                    className="input" required={f.required}
                    value={credentialsForm[f.key] || ''}
                    onChange={(e) => setCredentialsForm({ ...credentialsForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ fontFamily: f.type === 'password' && showPassword ? 'monospace' : 'inherit' }}
                  />
                  {f.helpText && <span className="hint">{f.helpText}</span>}
                </div>
              ))}


              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button" className="btn btn--secondary" onClick={() => setConnectModalOpen(false)}
                  disabled={isSubmittingModal}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={isSubmittingModal} style={{ fontWeight: 700 }}>
                  {isSubmittingModal ? 'Connecting...' : `Connect ${selectedPlatform.name}`}
                </button>
              </div>
            </form>
            ) : (
              <div style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px', color: '#0f172a', fontSize: '0.95rem' }}>Official {selectedPlatform.shortName} authorization</h4>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  You will sign in on {selectedPlatform.shortName}'s website. This app never asks for your social-media password. A connection is saved only after the provider verifies your account and publishing permissions.
                </p>
                <button type="button" className="btn btn--primary" disabled={oauthLoading} onClick={() => handleLaunchOAuth(selectedPlatform.apiKey)}>
                  {oauthLoading ? 'Opening provider login...' : `Connect with ${selectedPlatform.shortName}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ADMIN CONFIGURATION MODAL */}
      {adminConfigModalOpen && selectedAdminPlat && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px' }}
        >
          <div
            className="card" style={{
              maxWidth: '680px',
              width: '100%',
              background: '#ffffff',
              boxShadow: '0 24px 50px rgba(0,0,0,0.3)',
              borderRadius: '20px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Configure {selectedAdminPlat.display_name}
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  Set global Client IDs, encrypted secrets, API endpoints & video publishing parameters
                </span>
              </div>
              <button
                type="button" style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setAdminConfigModalOpen(false)}
              ><X className="w-4 h-4 inline-block" /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px', marginBottom: '18px' }}>
              <button
                type="button" className={`btn btn--sm ${adminConfigTab === 'credentials' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setAdminConfigTab('credentials')}
              >
                Credentials
              </button>
              <button
                type="button" className={`btn btn--sm ${adminConfigTab === 'endpoints' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setAdminConfigTab('endpoints')}
              >
                Endpoints & Scopes
              </button>
              <button
                type="button" className={`btn btn--sm ${adminConfigTab === 'video_specs' ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => setAdminConfigTab('video_specs')}
              >
                Video Publishing Specs
              </button>
            </div>

            <form onSubmit={handleSaveAdminConfig} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {adminConfigTab === 'credentials' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <label className="switch">
                        <input
                          type="checkbox" checked={adminForm.is_enabled}
                          onChange={(e) => setAdminForm({ ...adminForm, is_enabled: e.target.checked })}
                        />
                        <span />
                      </label>
                      <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>
                        {adminForm.is_enabled ? 'Integration Active' : 'Disabled'}
                      </strong>
                    </div>

                    <select
                      className="select" style={{ height: '36px', fontSize: '0.85rem' }}
                      value={adminForm.environment}
                      onChange={(e) => setAdminForm({ ...adminForm, environment: e.target.value })}
                    >
                      <option value="production">Production Environment</option>
                      <option value="development">Development / Sandbox</option>
                    </select>
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">Client ID / App ID / Client Key</label>
                    <input
                      className="input" value={adminForm.client_id}
                      onChange={(e) => setAdminForm({ ...adminForm, client_id: e.target.value })}
                      placeholder="e.g. 1029384756 or client_id_xyz..." />
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label className="label">
                        Client Secret / App Secret{' '}
                        <span style={{ fontSize: '0.75rem', color: selectedAdminPlat.client_secret_configured ? '#10b981' : '#f59e0b' }}>
                          ({selectedAdminPlat.client_secret_configured ? `Vaulted: ${selectedAdminPlat.client_secret_masked}` : 'Not Set'})
                        </span>
                      </label>
                      <button
                        type="button" style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer' }}
                        onClick={() => setShowAdminSecret(!showAdminSecret)}
                      >
                        {showAdminSecret ? 'Hide' : 'Show'}
                      </button>
                    </div>
                    <input
                      type={showAdminSecret ? 'text' : 'password'}
                      className="input" value={adminForm.client_secret}
                      onChange={(e) => setAdminForm({ ...adminForm, client_secret: e.target.value })}
                      placeholder={selectedAdminPlat.client_secret_configured ? 'Leave blank to keep existing encrypted secret' : 'Enter secret key...'}
                      style={{ fontFamily: showAdminSecret ? 'monospace' : 'inherit' }}
                    />
                    <span className="hint">Encrypted using AES-256 before storage. Never exposed to clients.</span>
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">OAuth Redirect URI</label>
                    <input
                      className="input" value={adminForm.redirect_uri}
                      onChange={(e) => setAdminForm({ ...adminForm, redirect_uri: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {adminConfigTab === 'endpoints' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">OAuth Authorization URL</label>
                    <input
                      className="input" value={adminForm.auth_url}
                      onChange={(e) => setAdminForm({ ...adminForm, auth_url: e.target.value })}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">OAuth Token Exchange URL</label>
                    <input
                      className="input" value={adminForm.token_url}
                      onChange={(e) => setAdminForm({ ...adminForm, token_url: e.target.value })}
                    />
                  </div>
                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">Required OAuth Scopes (Comma-separated)</label>
                    <textarea
                      className="textarea" style={{ minHeight: '70px', fontSize: '0.84rem' }}
                      value={adminForm.scopes_str}
                      onChange={(e) => setAdminForm({ ...adminForm, scopes_str: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {adminConfigTab === 'video_specs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block', marginBottom: '8px' }}>
                      Automatic Video Publishing Capabilities
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.82rem' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Supported Formats:</span>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {(selectedAdminPlat.extra_settings?.video_formats || ['MP4', 'MOV']).join(', ')}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Aspect Ratios:</span>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>
                          {(selectedAdminPlat.extra_settings?.aspect_ratios || ['9:16', '16:9']).join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="field" style={{ margin: 0 }}>
                    <label className="label">Configuration Notes</label>
                    <textarea
                      className="textarea" style={{ minHeight: '90px' }}
                      value={adminForm.config_notes}
                      onChange={(e) => setAdminForm({ ...adminForm, config_notes: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                <button
                  type="button" className="btn btn--secondary" onClick={() =>
                    handleTestAdminPlatform(selectedAdminPlat, {
                      client_id: adminForm.client_id,
                      client_secret: adminForm.client_secret
                    })
                  }
                  disabled={testingAdminPlat === selectedAdminPlat.platform}
                >
                  {testingAdminPlat === selectedAdminPlat.platform ? 'Testing...' : 'Test Credentials'}
                </button>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="button" className="btn btn--secondary" onClick={() => setAdminConfigModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn--primary" disabled={isAdminSaving} style={{ fontWeight: 700 }}>
                    {isAdminSaving ? 'Saving...' : 'Save Credentials'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. EDIT ACCOUNT MODAL */}
      {editModalOpen && editingAccount && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px' }}
        >
          <div
            className="card" style={{
              maxWidth: '460px',
              width: '100%',
              background: '#ffffff',
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              borderRadius: '20px',
              padding: '26px' }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
              Edit Connected Account
            </h3>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="field" style={{ margin: 0 }}>
                <label className="label">Platform</label>
                <input className="input" value={editingAccount.platform} disabled style={{ opacity: 0.7 }} />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label className="label">Account Handle / Brand Name</label>
                <input
                  className="input" required
                  value={editingAccount.account_name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, account_name: e.target.value })}
                />
              </div>

              <div className="field" style={{ margin: 0 }}>
                <label className="label">Update Access Token (Optional)</label>
                <input
                  type="password" className="input" value={editingAccount.access_token}
                  onChange={(e) => setEditingAccount({ ...editingAccount, access_token: e.target.value })}
                  placeholder="Enter new token to replace existing..." />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  type="checkbox" id="acc-connected-toggle" checked={editingAccount.is_connected}
                  onChange={(e) => setEditingAccount({ ...editingAccount, is_connected: e.target.checked })}
                  style={{ accentColor: '#10b981', cursor: 'pointer' }}
                />
                <label htmlFor="acc-connected-toggle" style={{ fontSize: '0.84rem', cursor: 'pointer', margin: 0, fontWeight: 600 }}>
                  Active for automated scheduling & publishing
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="btn btn--secondary" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" style={{ fontWeight: 700 }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DISCONNECT CONFIRMATION MODAL */}
      {disconnectModalOpen && disconnectTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px' }}
        >
          <div
            className="card" style={{
              maxWidth: '440px',
              width: '100%',
              background: '#ffffff',
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)',
              borderRadius: '20px',
              padding: '26px' }}
          >
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#991b1b', marginBottom: '8px' }}>
              Disconnect Channel?
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted, #64748b)', marginBottom: '20px', lineHeight: 1.5 }}>
              Are you sure you want to disconnect <strong>{disconnectTarget.account_name}</strong> ({disconnectTarget.platform})? Stored credentials will be removed from the vault and scheduled publishing to this channel will pause.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button className="btn btn--secondary" onClick={() => setDisconnectModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn--danger" onClick={handleConfirmDisconnect} style={{ fontWeight: 700 }}>
                Confirm Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. MULTI-TENANT SOCIAL ACCOUNT SELECTION MODAL */}
      {fbPageModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '640px',
              width: '100%',
              background: '#ffffff',
              boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
              borderRadius: '24px',
              padding: '28px',
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '1px solid rgba(226, 232, 240, 0.8)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '9999px', background: '#fdf2f2', border: '1px solid #fecdd3', color: '#9f1239', fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
                  <span>🏢 Multi-Tenant Workspace</span>
                  <span>•</span>
                  <span>{brandName}</span>
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px' }}>
                  Select Account to Connect
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  We found <strong>{fbPagesList.length}</strong> social account{fbPagesList.length !== 1 ? 's' : ''} under your login. Select the exact page or Instagram handle you want to link to <strong>{brandName}</strong>:
                </p>
              </div>
              <button
                type="button"
                style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
                onClick={() => {
                  setFbPageModalOpen(false);
                  setFbPagesList([]);
                  setFbSessionId(null);
                }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Meta Account Switcher Banner */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', padding: '10px 14px', borderRadius: '12px', background: '#eff6ff', border: '1px solid #bfdbfe', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.82rem', color: '#1e40af' }}>
                Showing accounts for active Meta session. Wrong account loaded?
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--sm"
                onClick={() => {
                  setFbPageModalOpen(false);
                  handleFacebookConnect('facebook', true);
                }}
                style={{ fontSize: '0.78rem', fontWeight: 700, padding: '4px 12px', background: '#ffffff' }}
              >
                🔁 Switch Meta User / Re-login
              </button>
            </div>

            {/* Account List */}
            {fbPagesList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1', marginBottom: '20px' }}>
                <Globe2 className="w-10 h-10 text-text-muted mx-auto mb-2" />
                <h4 style={{ margin: '0 0 6px', color: '#1e293b', fontSize: '1rem', fontWeight: 700 }}>No Managed Facebook Pages Found</h4>
                <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.82rem', maxWidth: '380px', marginInline: 'auto' }}>
                  Ensure your Facebook account is an Admin or Editor of at least one Facebook Page or has an Instagram Professional account linked.
                </p>
                <button
                  type="button"
                  className="btn btn--primary btn--sm"
                  onClick={() => {
                    setFbPageModalOpen(false);
                    handleFacebookConnect('facebook', true);
                  }}
                  style={{ fontWeight: 700 }}
                >
                  🔁 Log In With a Different Facebook Account
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
                {fbPagesList.map((page) => {
                  const isSelected = selectedFbPageId === page.id;
                  const hasIg = !!page.instagram_business_account;
                  const igUsername = page.instagram_business_account?.username;

                  return (
                    <div
                      key={page.id}
                      onClick={() => setSelectedFbPageId(page.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: isSelected ? 'var(--primary-soft)' : 'var(--surface)',
                        boxShadow: isSelected ? '0 8px 20px rgba(54, 185, 135, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {/* Avatar */}
                        <div style={{ position: 'relative' }}>
                          {page.picture_url ? (
                            <img
                              src={page.picture_url}
                              alt={page.name}
                              style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #1877F2 0%, #0d5bbd 100%)',
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '1.1rem'
                              }}
                            >
                              {(page.name || 'P')[0].toUpperCase()}
                            </div>
                          )}
                          {hasIg && (
                            <div
                              style={{
                                position: 'absolute',
                                bottom: '-3px',
                                right: '-3px',
                                width: '18px',
                                height: '18px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #f09433 0%, #dc2743 50%, #bc1888 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: '9px',
                                fontWeight: 800,
                                border: '2px solid #ffffff'
                              }}
                              title="Linked Instagram Business Account"
                            >
                              IG
                            </div>
                          )}
                        </div>

                        {/* Name and Meta */}
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <strong style={{ fontSize: '0.96rem', color: '#0f172a' }}>{page.name}</strong>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '6px',
                                background: '#eff6ff',
                                color: '#1d4ed8'
                              }}
                            >
                              Facebook Page
                            </span>
                          </div>

                          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '3px' }}>
                            {page.category || 'Business'} • ID: {page.id}
                          </div>

                          {hasIg ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
                              <span
                                style={{
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: 'linear-gradient(135deg, #fdf2f8 0%, #fff1f2 100%)',
                                  color: '#be185d',
                                  border: '1px solid #fbcfe8'
                                }}
                              >
                                📸 Instagram: @{igUsername.replace('@', '')}
                              </span>
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '4px' }}>
                              No linked Instagram Business account
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Selection Radio / Checkmark */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            border: isSelected ? '2px solid var(--primary)' : '2px solid var(--border)',
                            background: isSelected ? 'var(--primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--on-primary)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Connection Mode Options */}
            {selectedFbPageId && (
              <div style={{ background: 'var(--surface-raised)', padding: '14px 16px', borderRadius: '14px', border: '1px solid var(--border)', marginBottom: '22px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: '8px' }}>
                  What channels would you like to link for this selection?
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedConnectMode('both')}
                    className={`btn btn--sm ${selectedConnectMode === 'both' ? 'btn--primary' : 'btn--secondary'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Both Facebook & Instagram
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedConnectMode('instagram')}
                    className={`btn btn--sm ${selectedConnectMode === 'instagram' ? 'btn--primary' : 'btn--secondary'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Instagram Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedConnectMode('facebook')}
                    className={`btn btn--sm ${selectedConnectMode === 'facebook' ? 'btn--primary' : 'btn--secondary'}`}
                    style={{ fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Facebook Page Only
                  </button>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn--secondary"
                disabled={isSelectingFbPage}
                onClick={() => {
                  setFbPageModalOpen(false);
                  setFbPagesList([]);
                  setFbSessionId(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn--primary"
                disabled={isSelectingFbPage || !selectedFbPageId || fbPagesList.length === 0}
                onClick={(e) => handleSelectFacebookPage(e)}
                style={{ fontWeight: 700, minWidth: '170px' }}
              >
                {isSelectingFbPage ? 'Connecting Account...' : `Connect to ${brandName}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
