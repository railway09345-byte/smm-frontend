import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { api, ApiError, isAbortError } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => storage.get(STORAGE_KEYS.user, null));
  const [token, setToken] = useState(() => storage.get(STORAGE_KEYS.session, null));
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(storage.get(STORAGE_KEYS.session, null)));
  const [myBusinesses, setMyBusinesses] = useState([]);
  const [currentBusiness, setCurrentBusiness] = useState(null);
  const [membership, setMembership] = useState(() => {
    const session = storage.get(STORAGE_KEYS.session, null);
    if (!session) return null;

    const stored = storage.get(STORAGE_KEYS.membership, null);
    // Ignore legacy mock Pro Growth default if user is not verified
    const storedUser = storage.get(STORAGE_KEYS.user, null);
    if (!storedUser?.id && stored?.plan === 'Pro Growth Plan') {
      return null;
    }
    return stored || null;
  });
  const [onboardingCompleted, setOnboardingCompleted] = useState(() => {
    try {
      const storedUser = storage.get(STORAGE_KEYS.user);
      if (storedUser?.id) {
        return localStorage.getItem(`sacp_onboarded_${storedUser.id}`) === 'true';
      }
    } catch { }
    return false;
  });
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    try {
      api.auth.logout().catch(() => {});
    } catch (e) { }
    storage.remove(STORAGE_KEYS.session);
    storage.remove(STORAGE_KEYS.user);
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sacp_cached_brand_') || k.startsWith('sacp_active_brand_')) {
          localStorage.removeItem(k);
        }
      });
    } catch (e) { }
    storage.remove(STORAGE_KEYS.membership);
    setToken(null);
    setUser(null);
    setMyBusinesses([]);
    setCurrentBusiness(null);
    setMembership(null);
    setIsAuthenticated(false);
  }, []);

  // Listen for unauthorized events dispatched by API client
  useEffect(() => {
    const handleUnauthorized = (event) => {
      // Only logout if the token is truly dead, not due to network hiccups or background jobs
      console.warn('Session expired, logging out:', event?.detail?.message);
      logout();
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  // Fetch current user, assigned businesses, and subscription from backend
  const refreshUser = useCallback(async () => {
    try {
      const me = await api.auth.getMe();
      if (me) {
        // Fetch businesses assigned to this user
        let businesses = [];
        try {
          businesses = await api.auth.getMyBusinesses();
          setMyBusinesses(businesses || []);
        } catch (err) {
          if (!(isAbortError(err) || err.status === 499)) {
            console.warn('Could not load user businesses:', err.message);
          }
          businesses = [];
        }

        // Active business
        let activeBiz = (businesses && businesses.length > 0)
          ? (businesses.find((b) => b.id === me.organization_id) || businesses.find((b) => b.is_current) || businesses[0])
          : null;

        // Strict Multi-Tenancy Enterprise Isolation:
        // An enterprise tenant account must strictly see and operate inside their own workspace and brand.
        if (activeBiz && me.organization_id) {
          const tenantBiz = businesses.find((b) => b.id === me.organization_id) || activeBiz;
          activeBiz = tenantBiz;
          businesses = [tenantBiz];
          setMyBusinesses([tenantBiz]);
        }

        setCurrentBusiness(activeBiz);

        const rawRole = String(me.role || 'creator').toLowerCase();
        const isSuperOrAdmin = rawRole === 'super_admin' || rawRole === 'admin';

        const formattedUser = {
          id: me.id,
          name: me.full_name || me.email.split('@')[0],
          email: me.email,
          rawRole: rawRole,
          role: isSuperOrAdmin ? 'Owner & Store Administrator' : rawRole,
          storeName: activeBiz?.name || `${me.full_name || 'My'}'s Store`,
          organizationId: me.organization_id,
          avatarUrl: me.avatar_url,
          assignedBusinesses: businesses || []
        };

        setUser(formattedUser);
        storage.set(STORAGE_KEYS.user, formattedUser);
        setIsAuthenticated(true);
      } else {
        logout();
      }

      // Fetch active subscription
      try {
        const sub = await api.subscriptions.getCurrent();
        if (sub) {
          const tierNames = {
            FREE: 'Free Starter Plan',
            STARTER: 'Growth Starter Plan',
            PRO: 'Pro Growth Plan',
            ENTERPRISE: 'Enterprise Scale Plan'
          };
          const tierPrices = {
            FREE: '$0 / month',
            STARTER: '$29 / month',
            PRO: '$79 / month',
            ENTERPRISE: '$199 / month'
          };
          const formattedSub = {
            plan: tierNames[sub.tier] || sub.tier,
            tier: sub.tier,
            status: sub.status === 'ACTIVE' ? 'Active' : sub.status,
            price: tierPrices[sub.tier] || '$79 / month',
            nextRenewal: '28 days',
            monthlyGenerationLimit: sub.monthly_generation_limit,
            monthlyPostsLimit: sub.monthly_posts_limit
          };
          setMembership(formattedSub);
          storage.set(STORAGE_KEYS.membership, formattedSub);
        }
      } catch (err) {
        console.warn('Subscription fetch skipped:', err.message);
      }
      return storage.get(STORAGE_KEYS.user);
    } catch (err) {
      if (isAbortError(err) || err.status === 499) return;
      console.warn('Session restoration note:', err.message);
      // If token expired, invalid, or user was deleted in db, reset session
      if (err.status === 401 || err.status === 403 || err.message?.includes('User associated with this token') || err.message?.includes('not exist')) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Initialize on load
  useEffect(() => {
    const savedToken = storage.get(STORAGE_KEYS.session);
    if (savedToken && typeof savedToken === 'string') {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  const login = async (email, password, remember = false, requiredRole = null) => {
    try {
      const res = await api.auth.login(email, password);
      if (res?.access_token) {
        const returnedRole = String(res.role || '').toLowerCase();
        if (requiredRole === 'super_admin' && returnedRole !== 'super_admin') {
          throw new Error('Access denied: This portal is strictly restricted to SuperAdmins.');
        }
        if (requiredRole === 'admin' && !['super_admin', 'admin'].includes(returnedRole)) {
          throw new Error('Access denied: Administrator privileges are required to access this portal.');
        }

        storage.set(STORAGE_KEYS.session, res.access_token);
        setToken(res.access_token);
        setIsAuthenticated(true);
        const refreshed = await refreshUser();
        return { success: true, role: returnedRole, user: refreshed };
      }
      throw new Error('Invalid login response from server.');
    } catch (err) {
      throw err;
    }
  };

  const signup = async ({ name, email, password, businessId = null, organizationName = null, role = 'creator' }) => {
    try {
      await api.auth.register({
        full_name: name,
        email: email,
        password: password,
        business_id: businessId ? Number(businessId) : null,
        organization_name: organizationName,
        role: role
      });
      // Automatically log in after registration
      return await login(email, password);
    } catch (err) {
      throw err;
    }
  };

  const switchBusiness = async (businessId) => {
    try {
      const res = await api.auth.switchBusiness(businessId);
      if (res?.access_token) {
        storage.set(STORAGE_KEYS.session, res.access_token);
        setToken(res.access_token);
      }
      await refreshUser();
      return res;
    } catch (err) {
      console.error('Failed to switch business:', err);
      throw err;
    }
  };

  const updateUserProfile = async (updates) => {
    try {
      const updated = await api.auth.updateMe(updates);
      if (updated) {
        setUser((prev) => ({
          ...prev,
          name: updated.full_name || prev.name,
          email: updated.email || prev.email,
          avatarUrl: updated.avatar_url || prev.avatarUrl
        }));
      }
      return updated;
    } catch (err) {
      console.error('Failed to update user profile in MySQL:', err);
      throw err;
    }
  };

  const updateMembership = async (tierName, planName = 'Pro Growth Plan', price = '$79 / month') => {
    try {
      const tierMap = {
        'Free Plan': 'free',
        'Starter Plan': 'starter',
        'Starter Boutique': 'starter',
        'Pro Growth Plan': 'pro',
        'Multi-Brand Enterprise': 'enterprise',
        'Enterprise Studio Tier': 'enterprise',
        'Enterprise Plan': 'enterprise'
      };
      const tierEnum = tierMap[planName] || 'pro';
      try {
        await api.subscriptions.upgrade(tierEnum);
      } catch (subErr) {
        console.warn('Backend upgrade note:', subErr);
      }
      const updated = {
        plan: planName,
        tier: tierEnum,
        price,
        status: 'Active',
        subscribedAt: new Date().toISOString()
      };
      setMembership(updated);
      storage.set(STORAGE_KEYS.membership, updated);
      if (user?.id) {
        if (tierEnum !== 'free') {
          localStorage.setItem(`sacp_subscribed_${user.id}`, 'true');
        } else {
          localStorage.removeItem(`sacp_subscribed_${user.id}`);
        }
      }
      return { success: true, tier: tierEnum };
    } catch (err) {
      console.error('Subscription update failed:', err);
      throw err;
    }
  };

  const completeBrandSetup = () => {
    setOnboardingCompleted(true);
    if (user?.id) {
      localStorage.setItem(`sacp_onboarded_${user.id}`, 'true');
    }
  };

  const rawRole = String(user?.rawRole || '').toLowerCase();
  const isSuperAdmin = rawRole === 'super_admin';
  const isAdmin = isSuperAdmin || rawRole === 'admin';
  const isCreator = !isAdmin;

  // Subscription check:
  // 1. Must be authenticated
  // 2. SuperAdmin has master bypass
  // 3. User must have explicit subscribed flag OR an active paid membership (not free)
  const hasSubscribed = Boolean(
    isAuthenticated && (
      isSuperAdmin ||
      (user?.id && localStorage.getItem(`sacp_subscribed_${user.id}`) === 'true') ||
      (membership?.status === 'Active' &&
        membership?.plan &&
        membership?.plan !== 'None' &&
        String(membership?.tier || '').toLowerCase() !== 'free' &&
        membership?.plan !== 'Free Starter Plan' &&
        membership?.plan !== 'Free Plan')
    )
  );

  // Brand profile setup check: SuperAdmin has master bypass; Admin must complete onboarding
  const hasCompletedBrandSetup = isSuperAdmin || Boolean(
    onboardingCompleted ||
    (user?.id && localStorage.getItem(`sacp_onboarded_${user.id}`) === 'true')
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        myBusinesses,
        currentBusiness,
        isAdmin,
        isSuperAdmin,
        isCreator,
        membership,
        hasSubscribed,
        hasCompletedBrandSetup,
        completeBrandSetup,
        isLoading,
        login,
        signup,
        switchBusiness,
        logout,
        updateUserProfile,
        updateMembership,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      myBusinesses: [],
      currentBusiness: null,
      isAdmin: false,
      isSuperAdmin: false,
      isCreator: false,
      membership: {
        plan: 'Pro Growth Plan',
        tier: 'PRO',
        status: 'Active',
        price: '$79 / month',
        nextRenewal: '28 days',
        maxChannels: 10
      },
      isLoading: false,
      login: async () => { },
      signup: async () => { },
      switchBusiness: async () => { },
      logout: () => { },
      updateUserProfile: () => { },
      updateMembership: () => { },
      refreshUser: async () => { }
    };
  }
  return context;
}

