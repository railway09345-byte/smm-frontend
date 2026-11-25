/**
 * Real-time API Client for Social AI Platform Backend (FastAPI + MySQL)
 */
import { storage, STORAGE_KEYS } from '../utils/storage';

const rawBaseUrl = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  (typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')
    ? '/api/v1'
    : 'http://127.0.0.1:8010/api/v1')
).trim().replace(/\/+$/, '');

const API_BASE_URL = rawBaseUrl.endsWith('/api/v1')
  ? rawBaseUrl
  : `${rawBaseUrl}/api/v1`;

if (import.meta.env.PROD && !import.meta.env.VITE_API_BASE_URL && !import.meta.env.VITE_API_URL && !import.meta.env.VITE_BACKEND_URL) {
  console.warn(
    '[Social AI Platform] VITE_API_BASE_URL environment variable is not defined. Defaulting to relative "/api/v1". Ensure VITE_API_BASE_URL=https://<your-railway-app>.up.railway.app is set in Vercel environment variables.'
  );
}

export function getFullMediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const backendBase = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
}

export class ApiError extends Error {
  constructor(message, { status = 0, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const apiCache = new Map();
const inFlightRequests = new Map();

export function clearApiCache(prefix = null) {
  if (!prefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.includes(prefix)) {
        apiCache.delete(key);
      }
    }
  }
}

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // Get token (check both session key and raw token string)
  let rawSession = storage.get(STORAGE_KEYS.session);
  let token = null;
  if (typeof rawSession === 'string' && rawSession.length > 20) {
    token = rawSession;
  } else if (rawSession && typeof rawSession === 'object' && rawSession.access_token) {
    token = rawSession.access_token;
  }

  // Cache key based on URL, token, and method
  const isGet = method === 'GET';
  const isCacheableGet = isGet && !options.noCache;
  const isDeduplicatableGet = isGet && options.dedup !== false && !options.signal;
  const cacheKey = `${token || 'anon'}:${url}`;

  if (isCacheableGet) {
    const cached = apiCache.get(cacheKey);
    const now = Date.now();
    // Default TTL: 12 seconds for lightning fast UI navigation
    const ttl = options.ttl || 12000;
    if (cached && (now - cached.timestamp < ttl)) {
      return cached.data;
    }
  }

  // Request deduplication: join in-flight promise if an identical GET is already pending
  if (isDeduplicatableGet && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  if (!isGet) {
    // On mutations (POST, PUT, DELETE, PATCH), invalidate cached data for this domain
    const cleanEndpoint = endpoint.split('?')[0].replace(/^\//, '');
    const prefix = cleanEndpoint.split('/')[0];
    if (prefix) {
      clearApiCache(prefix);
    } else {
      clearApiCache();
    }
  }

  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  // Mutating publishing requests can legitimately take longer while a video
  // is handed to a platform. Keep normal requests bounded, but allow callers
  // to opt into a longer, explicit timeout.
  let isTimeout = false;
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs || 30000;
  const timeoutId = setTimeout(() => {
    isTimeout = true;
    controller.abort();
  }, timeoutMs);

  let activeSignal = controller.signal;
  if (options.signal) {
    if (typeof AbortSignal.any === 'function') {
      activeSignal = AbortSignal.any([options.signal, controller.signal]);
    } else {
      options.signal.addEventListener('abort', () => controller.abort());
      activeSignal = controller.signal;
    }
  }

  const executeRequest = async () => {
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: options.credentials || 'include',
        signal: activeSignal
      });

      if (response.status === 204) {
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const msg = errorData?.detail || errorData?.message || `HTTP ${response.status}: Request failed`;

        // Broadcast session expiration on 401 only for critical user session endpoints (/auth/me)
        // Background polling (automation/status, logs, social accounts) must NOT evict the user session!
        if (response.status === 401 && typeof window !== 'undefined' && url.includes('/auth/me')) {
          window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { message: msg } }));
        }

        throw new ApiError(msg, {
          status: response.status,
          data: errorData
        });
      }

      const data = await response.json();
      if (isCacheableGet) {
        apiCache.set(cacheKey, { data, timestamp: Date.now() });
      }
      return data;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (isTimeout) throw new ApiError('Request timed out. Please try again.', { status: 408 });
      if (isAbortError(error)) throw new ApiError('Request was cancelled.', { status: 499 });
      throw new ApiError(error.message || 'Network connection failed', { status: 0 });
    } finally {
      clearTimeout(timeoutId);
      inFlightRequests.delete(cacheKey);
    }
  };

  const promise = executeRequest();
  if (isDeduplicatableGet) {
    inFlightRequests.set(cacheKey, promise);
  }
  return promise;
}

export function isAbortError(error) {
  return error?.name === 'AbortError' || /signal is aborted|aborted without reason/i.test(error?.message || '');
}

export const api = {
  clearCache: clearApiCache,
  // Authentication
  auth: {
    login: (email, password) =>
      apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    logout: () =>
      apiRequest('/auth/logout', {
        method: 'POST'
      }),
    register: ({ full_name, email, password, business_id, organization_name, role = 'creator' }) =>
      apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ full_name, email, password, business_id, organization_name, role })
      }),
    requestPasswordReset: (email) =>
      apiRequest('/auth/password-reset/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    confirmPasswordReset: (token, new_password) =>
      apiRequest('/auth/password-reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, new_password })
      }),
    requestEmailVerification: (email) =>
      apiRequest('/auth/verify-email/request', {
        method: 'POST',
        body: JSON.stringify({ email })
      }),
    confirmEmailVerification: (token) =>
      apiRequest('/auth/verify-email/confirm', {
        method: 'POST',
        body: JSON.stringify({ token })
      }),
    getMe: () => apiRequest('/auth/me'),
    getMyBusinesses: () => apiRequest('/auth/my-businesses'),
    getAvailableBusinesses: () => apiRequest('/auth/available-businesses'),
    switchBusiness: (businessId) =>
      apiRequest(`/auth/switch-business/${businessId}`, {
        method: 'POST'
      }),
    updateMe: (data) =>
      apiRequest('/auth/me', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Organizations
  organizations: {
    getCurrent: () => apiRequest('/organizations/current'),
    updateCurrent: (data) =>
      apiRequest('/organizations/current', {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Brand Profiles
  brandProfiles: {
    list: () => apiRequest('/brand-profiles/'),
    get: (id) => apiRequest(`/brand-profiles/${id}`),
    create: (data) =>
      apiRequest('/brand-profiles/', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      apiRequest(`/brand-profiles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/brand-profiles/${id}`, {
        method: 'DELETE'
      })
  },

  // Content Management
  content: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/content/${qs ? `?${qs}` : ''}`);
    },
    get: (id) => apiRequest(`/content/${id}`),
    create: (data) =>
      apiRequest('/content/', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      apiRequest(`/content/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/content/${id}`, {
        method: 'DELETE'
      }),
    qualityCheckAll: () => apiRequest('/content/quality-check/all', { timeout: 90000 }),
    qualityCheck: (id) =>
      apiRequest(`/content/${id}/quality-check`, {
        method: 'POST'
      }),
    autoOptimize: (id) =>
      apiRequest(`/content/${id}/auto-optimize`, {
        method: 'POST'
      })
  },

  // Media & Cloudinary Storage
  media: {
    list: (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const qs = new URLSearchParams(cleanParams).toString();
      return apiRequest(`/media/${qs ? `?${qs}` : ''}`);
    },
    get: (id) => apiRequest(`/media/${id}`),
    upload: async (file, metadata = {}, onProgress = null) => {
      let rawSession = storage.get(STORAGE_KEYS.session);
      let token = null;
      if (typeof rawSession === 'string' && rawSession.length > 20) {
        token = rawSession;
      } else if (rawSession && typeof rawSession === 'object' && rawSession.access_token) {
        token = rawSession.access_token;
      }

      // Handle function signature overload upload(file, onProgress) vs upload(file, metadata, onProgress)
      let meta = metadata;
      let progressCb = onProgress;
      if (typeof metadata === 'function') {
        progressCb = metadata;
        meta = {};
      }

      const formData = new FormData();
      formData.append('file', file);
      if (meta.title) formData.append('title', meta.title);
      if (meta.description) formData.append('description', meta.description);
      if (meta.alt_text) formData.append('alt_text', meta.alt_text);
      if (meta.tags) {
        formData.append('tags', JSON.stringify(Array.isArray(meta.tags) ? meta.tags : [meta.tags]));
      }
      if (meta.collection_id) formData.append('collection_id', meta.collection_id);
      if (meta.category_id) formData.append('category_id', meta.category_id);

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = `${API_BASE_URL}/media/upload`;
        xhr.open('POST', url);
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        if (xhr.upload && progressCb) {
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              progressCb(percent);
            }
          };
        }
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText));
            } catch (e) {
              resolve(xhr.responseText);
            }
          } else {
            try {
              const err = JSON.parse(xhr.responseText);
              reject(new ApiError(err.detail || err.message || 'Upload failed', { status: xhr.status, data: err }));
            } catch (e) {
              reject(new ApiError(`Upload failed with status ${xhr.status}`, { status: xhr.status }));
            }
          }
        };
        xhr.onerror = () => reject(new ApiError('Network connection error during upload'));
        xhr.send(formData);
      });
    },
    uploadDirect: async (file, metadata = {}, onProgress = null) => {
      const signature = await apiRequest('/media/signature');
      const cloudForm = new FormData();
      cloudForm.append('file', file);
      cloudForm.append('api_key', signature.api_key);
      cloudForm.append('timestamp', String(signature.timestamp));
      cloudForm.append('signature', signature.signature);
      cloudForm.append('folder', signature.folder);
      const cloudResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${signature.cloud_name}/auto/upload`);
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 95));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve(JSON.parse(xhr.responseText)) : reject(new ApiError('Cloudinary upload failed', { status: xhr.status }));
        xhr.onerror = () => reject(new ApiError('Network connection error during direct upload'));
        xhr.send(cloudForm);
      });
      const registered = await apiRequest('/media/complete-upload', {
        method: 'POST',
        body: JSON.stringify({
          file_name: file.name,
          file_url: cloudResult.secure_url || cloudResult.url,
          public_id: cloudResult.public_id,
          file_size_bytes: cloudResult.bytes || file.size,
          mime_type: file.type,
          media_type: file.type.startsWith('video/') ? 'video' : 'image',
          title: metadata.title || file.name,
          description: metadata.description || null,
          alt_text: metadata.alt_text || null,
          tags: metadata.tags || [],
          category_id: metadata.category_id || null,
          meta_info: { provider: 'cloudinary-direct', resource_type: cloudResult.resource_type, format: cloudResult.format }
        })
      });
      if (onProgress) onProgress(100);
      return registered;
    },
    update: (id, data) =>
      apiRequest(`/media/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/media/${id}`, {
        method: 'DELETE'
      }),
    getSignature: () => apiRequest('/media/signature')
  },

  // Media Collections
  collections: {
    list: (search) => {
      const qs = search ? `?search=${encodeURIComponent(search)}` : '';
      return apiRequest(`/collections/${qs}`);
    },
    get: (id) => apiRequest(`/collections/${id}`),
    create: (data) =>
      apiRequest('/collections/', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      apiRequest(`/collections/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    delete: (id, deleteMedia = false) =>
      apiRequest(`/collections/${id}?delete_media=${deleteMedia}`, {
        method: 'DELETE'
      }),
    addMedia: (collectionId, mediaIds) =>
      apiRequest(`/collections/${collectionId}/media`, {
        method: 'POST',
        body: JSON.stringify({ media_ids: mediaIds })
      }),
    removeMedia: (collectionId, mediaId) =>
      apiRequest(`/collections/${collectionId}/media/${mediaId}`, {
        method: 'DELETE'
      }),
    moveMedia: (sourceCollectionId, targetCollectionId, mediaIds) =>
      apiRequest('/collections/move-media', {
        method: 'POST',
        body: JSON.stringify({
          source_collection_id: sourceCollectionId,
          target_collection_id: targetCollectionId,
          media_ids: mediaIds
        })
      })
  },

  mediaCategories: {
    list: () => apiRequest('/media-categories/'),
    create: (data) => apiRequest('/media-categories/', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/media-categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id) => apiRequest(`/media-categories/${id}`, { method: 'DELETE' })
  },

  // Content Approvals
  approvals: {
    list: (statusFilter) =>
      apiRequest(`/approvals/${statusFilter ? `?status_filter=${statusFilter}` : ''}`),
    request: (data) =>
      apiRequest('/approvals/request', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    review: (id, data) =>
      apiRequest(`/approvals/${id}/review`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  },

  // Post Scheduler & Rules
  scheduler: {
    listPosts: (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const qs = new URLSearchParams(cleanParams).toString();
      return apiRequest(`/scheduler/posts${qs ? `?${qs}` : ''}`);
    },
    getQueue: (statusFilter) =>
      apiRequest(`/scheduler/posts${statusFilter ? `?status=${statusFilter}` : ''}`),
    getPost: (id) => apiRequest(`/scheduler/posts/${id}`),
    createPost: (data, publishNow = false) =>
      apiRequest(`/scheduler/posts?publish_now=${publishNow}`, {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: publishNow ? 180000 : 90000
      }),
    schedule: (data) =>
      apiRequest('/scheduler/posts?publish_now=false', {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: 90000
      }),
    updatePost: (id, data) =>
      apiRequest(`/scheduler/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    publishNow: (id) =>
      apiRequest(`/scheduler/posts/${id}/publish`, {
        method: 'POST'
      }),
    reschedulePost: (id, scheduledTime, timezone = 'Asia/Kolkata') =>
      apiRequest(`/scheduler/posts/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ scheduled_time: scheduledTime, timezone })
      }),
    cancelPost: (id) =>
      apiRequest(`/scheduler/posts/${id}/cancel`, {
        method: 'POST'
      }),
    retryPost: (id) =>
      apiRequest(`/scheduler/posts/${id}/retry`, {
        method: 'POST'
      }),
    deletePost: (id) =>
      apiRequest(`/scheduler/posts/${id}`, {
        method: 'DELETE'
      }),

    // Calendar
    getCalendarEvents: (params = {}) => {
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const qs = new URLSearchParams(cleanParams).toString();
      return apiRequest(`/scheduler/calendar${qs ? `?${qs}` : ''}`);
    },

    // Recurring Rules
    listRules: () => apiRequest('/scheduler/rules'),
    getRule: (id) => apiRequest(`/scheduler/rules/${id}`),
    createRule: (data) =>
      apiRequest('/scheduler/rules', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateRule: (id, data) =>
      apiRequest(`/scheduler/rules/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    pauseRule: (id) =>
      apiRequest(`/scheduler/rules/${id}/pause`, {
        method: 'POST'
      }),
    resumeRule: (id) =>
      apiRequest(`/scheduler/rules/${id}/resume`, {
        method: 'POST'
      }),
    cancelRule: (id) =>
      apiRequest(`/scheduler/rules/${id}/cancel`, {
        method: 'POST'
      }),
    deleteRule: (id) =>
      apiRequest(`/scheduler/rules/${id}`, {
        method: 'DELETE'
      }),
    getUpcomingSlots: (id, count = 5) =>
      apiRequest(`/scheduler/rules/${id}/upcoming?count=${count}`),

    getOptimalSlots: (platform = 'instagram', count = 5) =>
      apiRequest(`/scheduler/optimal-slots?platform=${platform}&count=${count}`)
  },

  // Instant Publishing
  publishing: {
    publishNow: (contentId, socialAccountId) =>
      apiRequest(`/publishing/instant/${contentId}/${socialAccountId}`, {
        method: 'POST',
        timeoutMs: 5 * 60 * 1000 // 5 minutes
      }),

    publishDirect: (contentId, payload = {}) =>
      apiRequest(`/publishing/publish-now/${contentId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        timeoutMs: 5 * 60 * 1000 // 5 minutes
      })
  },

  // Connected Social Accounts & Facebook Meta OAuth Flow
  social: {
    facebook: {
      connect: (brandProfileId = null, reauthenticate = true) => {
        const params = new URLSearchParams();
        if (brandProfileId) params.append('brand_profile_id', brandProfileId);
        if (reauthenticate !== undefined) params.append('reauthenticate', String(reauthenticate));
        const qs = params.toString();
        return apiRequest(`/social/facebook/connect${qs ? `?${qs}` : ''}`);
      },
      getPages: (sessionId) => apiRequest(`/social/facebook/pages?session_id=${sessionId}`),
      selectPage: (payload) =>
        apiRequest('/social/facebook/select-page', {
          method: 'POST',
          body: JSON.stringify(payload)
        }),
      test: (accountId) =>
        apiRequest('/social/facebook/test', {
          method: 'POST',
          body: JSON.stringify({ account_id: accountId })
        }),
      disconnect: (accountId, revoke = false) =>
        apiRequest(`/social/facebook/${accountId}?revoke=${revoke}`, {
          method: 'DELETE'
        }),
      getAccounts: (brandId = null) => {
        const qs = brandId ? `?brand_id=${brandId}` : '';
        return apiRequest(`/social/accounts${qs}`);
      }
    }
  },

  socialAccounts: {
    list: (brandProfileIdOrOptions = null, options = {}) => {
      let brandId = null;
      let opt = options;
      if (typeof brandProfileIdOrOptions === 'object' && brandProfileIdOrOptions !== null) {
        opt = brandProfileIdOrOptions;
        brandId = opt.brand_profile_id || null;
      } else {
        brandId = brandProfileIdOrOptions;
      }
      const qs = brandId ? `?brand_profile_id=${brandId}` : '';
      return apiRequest(`/social-accounts/${qs}`, opt);
    },
    getSupportedPlatforms: () => apiRequest('/social-accounts/supported-platforms'),
    getOAuthAuthorizeUrl: (platform, redirectUri, brandProfileId, reauthenticate = true) => {
      const params = new URLSearchParams();
      if (redirectUri) params.append('redirect_uri', redirectUri);
      if (brandProfileId) params.append('brand_profile_id', brandProfileId);
      if (reauthenticate !== undefined) params.append('reauthenticate', String(reauthenticate));
      const qs = params.toString();
      return apiRequest(`/social-accounts/oauth/${platform}/authorize${qs ? `?${qs}` : ''}`);
    },
    handleOAuthCallback: (platform, data) =>
      apiRequest(`/social-accounts/oauth/${platform}/callback`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    connect: (data) =>
      apiRequest('/social-accounts/', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    connectCredentials: (data) =>
      apiRequest('/social-accounts/connect-credentials', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    verify: (id) =>
      apiRequest(`/social-accounts/${id}/verify`, {
        method: 'POST'
      }),
    refresh: (id) =>
      apiRequest(`/social-accounts/${id}/refresh`, {
        method: 'POST'
      }),
    update: (id, data) =>
      apiRequest(`/social-accounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      apiRequest(`/social-accounts/${id}`, {
        method: 'DELETE'
      })
  },

  // Workspace-scoped developer OAuth configurations. Secrets are write-only.
  integrations: {
    list: () => apiRequest('/integrations/configs'),
    create: (data) => apiRequest('/integrations/configs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiRequest(`/integrations/configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => apiRequest(`/integrations/configs/${id}`, { method: 'DELETE' }),
    test: (id) => apiRequest(`/integrations/configs/${id}/test`, { method: 'POST' })
  },

  // Admin Portal & Settings
  admin: {
    getStats: () => apiRequest('/admin/stats'),
    getUsers: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/admin/users${qs ? `?${qs}` : ''}`);
    },
    updateUserStatus: (userId, isActive) =>
      apiRequest(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
      }),
    updateUserRole: (userId, role) =>
      apiRequest(`/admin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),
    getAnalytics: () => apiRequest('/admin/analytics'),
    getSettings: () => apiRequest('/admin/settings'),
    getIntegrations: () => apiRequest('/admin/integrations'),
    updateIntegrations: (data) =>
      apiRequest('/admin/integrations', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getPlatformIntegrations: () => apiRequest('/admin/integrations/platforms'),
    getPlatformIntegration: (platform) => apiRequest(`/admin/integrations/platforms/${platform}`),
    updatePlatformIntegration: (platform, data) =>
      apiRequest(`/admin/integrations/platforms/${platform}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    togglePlatformIntegration: (platform, isEnabled) =>
      apiRequest(`/admin/integrations/platforms/${platform}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ is_enabled: isEnabled })
      }),
    testPlatformIntegration: (platform, data = {}) =>
      apiRequest(`/admin/integrations/platforms/${platform}/test`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getBusinesses: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/admin/businesses${qs ? `?${qs}` : ''}`);
    },
    createBusiness: (data) =>
      apiRequest('/admin/businesses', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateBusiness: (id, data) =>
      apiRequest(`/admin/businesses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteBusiness: (id) =>
      apiRequest(`/admin/businesses/${id}`, {
        method: 'DELETE'
      }),
    assignUserBusiness: (userId, data) =>
      apiRequest(`/admin/users/${userId}/assign-business`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    unassignUserBusiness: (userId, businessId) =>
      apiRequest(`/admin/users/${userId}/unassign-business/${businessId}`, {
        method: 'DELETE'
      })
  },

  // SuperAdmin Master Portal
  superadmin: {
    getStats: () => apiRequest('/superadmin/stats', { noCache: true }),
    getAdmins: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/superadmin/admins${qs ? `?${qs}` : ''}`);
    },
    getUsers: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/superadmin/users${qs ? `?${qs}` : ''}`);
    },
    createUser: (data) =>
      apiRequest('/superadmin/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateRole: (userId, role) =>
      apiRequest(`/superadmin/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role })
      }),
    updateStatus: (userId, isActive) =>
      apiRequest(`/superadmin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: isActive })
      }),
    deleteUser: (userId) =>
      apiRequest(`/superadmin/users/${userId}`, {
        method: 'DELETE'
      }),
    getAnalytics: (timeframe = '30d') =>
      apiRequest(`/superadmin/analytics?timeframe=${timeframe}`),
    getControls: () => apiRequest('/superadmin/controls'),
    updateControls: (data) =>
      apiRequest('/superadmin/controls', {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getAuditLogs: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/superadmin/audit-logs${qs ? `?${qs}` : ''}`);
    },
    getBilling: () => apiRequest('/superadmin/billing', { noCache: true }),
    getTenants: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/superadmin/tenants${qs ? `?${qs}` : ''}`);
    },
    activateTenant: (tenantId) =>
      apiRequest(`/superadmin/tenants/${tenantId}/activate`, {
        method: 'PUT'
      }),
    suspendTenant: (tenantId) =>
      apiRequest(`/superadmin/tenants/${tenantId}/suspend`, {
        method: 'PUT'
      }),
    updateTenantSubscription: (tenantId, data) =>
      apiRequest(`/superadmin/tenants/${tenantId}/subscription`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    getHealth: () => apiRequest('/superadmin/health', { noCache: true })
  },



  // AI Generations (Google Gemini, Imagen 3, Veo Video)
  generations: {
    getStatus: () => apiRequest('/generations/gemini/status'),
    getAIHealth: () => apiRequest('/generations/ai/health'),
    getAIProgress: (correlationId) => apiRequest(`/generations/ai/progress/${correlationId}`),
    getVoices: () => apiRequest('/generations/gemini/voices'),
    getDailyTrendingGoal: (brandId = null, platform = 'instagram') => {
      const params = new URLSearchParams();
      if (brandId) params.append('brand_id', brandId);
      if (platform) params.append('platform', platform);
      return apiRequest(`/generations/gemini/daily-trending-goal?${params.toString()}`);
    },
    autoPrompt: (data) =>
      apiRequest('/generations/gemini/auto-prompt', {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: 240 * 1000
      }),
    generateFullBundle: (data) =>
      apiRequest('/generations/gemini/full-bundle', {
        method: 'POST',
        body: JSON.stringify(data),
        // Bundle generation may include Flux image generation and Magic Hour
        // video rendering; do not abort the browser request after 30 seconds.
        timeoutMs: 10 * 60 * 1000
      }),
    generateText: (data) =>
      apiRequest('/generations/gemini/text', {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: 240 * 1000
      }),
    generateImage: (data) =>
      apiRequest('/generations/gemini/image', {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: 3 * 60 * 1000
      }),
    generateVideo: (data) =>
      apiRequest('/generations/gemini/video', {
        method: 'POST',
        body: JSON.stringify(data),
        // Magic Hour renders asynchronously and can take several minutes.
        timeoutMs: 10 * 60 * 1000
      }),
    getJobStatus: (jobId) => apiRequest(`/generations/jobs/${jobId}`),
    getHistory: (jobType = null, limit = 50, offset = 0) => {
      const params = new URLSearchParams();
      if (jobType) params.append('job_type', jobType);
      params.append('limit', limit);
      params.append('offset', offset);
      return apiRequest(`/generations/history?${params.toString()}`);
    },
    deleteHistory: (jobId) =>
      apiRequest(`/generations/history/${jobId}`, {
        method: 'DELETE'
      })
  },

  // Performance & Analytics
  analytics: {
    getDashboard: (params = {}) => {
      const clean = Object.fromEntries(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      const qs = new URLSearchParams(clean).toString();
      return apiRequest(`/analytics/dashboard${qs ? `?${qs}` : ''}`);
    },
    getOverview: (brandId) => apiRequest(`/analytics/overview/${brandId}`),
    sync: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/analytics/sync${qs}`, { method: 'POST' });
    },
    postPublishSync: (postId = null, brandId = null) => {
      const params = new URLSearchParams();
      if (postId) params.set('post_id', postId);
      if (brandId) params.set('brand_id', brandId);
      const qs = params.toString();
      return apiRequest(`/analytics/post-publish-sync${qs ? `?${qs}` : ''}`, { method: 'POST' });
    }
  },

  // Subscriptions
  subscriptions: {
    getCurrent: () => apiRequest('/subscriptions/current'),
    upgrade: (tier) =>
      apiRequest(`/subscriptions/upgrade/${tier}`, {
        method: 'POST'
      })
  },

  // Payments (Razorpay)
  payments: {
    /**
     * Step 1: Create a Razorpay order on the backend.
     * Returns { razorpay_order_id, amount, currency, razorpay_key_id, tier }
     */
    createOrder: (tier) =>
      apiRequest('/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ tier }),
      }),

    /**
     * Step 2: Verify the payment signature after Razorpay checkout succeeds.
     * Sends razorpay_order_id, razorpay_payment_id, razorpay_signature, tier.
     * Backend verifies HMAC-SHA256 and upgrades the subscription tier.
     */
    verifyPayment: (razorpay_order_id, razorpay_payment_id, razorpay_signature, tier) =>
      apiRequest('/payments/verify', {
        method: 'POST',
        body: JSON.stringify({ razorpay_order_id, razorpay_payment_id, razorpay_signature, tier }),
      }),
  },

  // Users & Team
  users: {
    list: () => apiRequest('/users/'),
    get: (id) => apiRequest(`/users/${id}`),
    update: (id, data) =>
      apiRequest(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
  },

  // Autonomous AI Pipeline
  pipeline: {
    getSchedule: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/pipeline/schedule${qs}`);
    },
    updateSchedule: (data, brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/pipeline/schedule${qs}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    listPosts: (status = null, brandId = null, limit = 30) => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (brandId) params.append('brand_id', brandId);
      params.append('limit', limit);
      return apiRequest(`/pipeline/posts?${params.toString()}`);
    },
    getPost: (id) => apiRequest(`/pipeline/posts/${id}`),
    updatePost: (id, data) =>
      apiRequest(`/pipeline/posts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    updateVariant: (variantId, data) =>
      apiRequest(`/pipeline/variants/${variantId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    approvePost: (id, data = {}) =>
      apiRequest(`/pipeline/posts/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    rejectPost: (id, reason) =>
      apiRequest(`/pipeline/posts/${id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    saveDraft: (id) =>
      apiRequest(`/pipeline/posts/${id}/save-draft`, {
        method: 'POST'
      }),
    regeneratePart: (id, part) =>
      apiRequest(`/pipeline/posts/${id}/regenerate`, {
        method: 'POST',
        body: JSON.stringify({ part }),
        timeoutMs: 180000
      }),
    runNow: (data = { force: true }) =>
      apiRequest('/pipeline/run-now', {
        method: 'POST',
        body: JSON.stringify(data),
        // A full autonomous batch may generate copy, several images and a
        // video serially on the server. Keep the request alive long enough
        // for the backend to persist the completed MySQL run.
        timeoutMs: 10 * 60 * 1000
      }),
    listRuns: (brandId = null, limit = 20) => {
      const params = new URLSearchParams();
      if (brandId) params.append('brand_id', brandId);
      params.append('limit', limit);
      return apiRequest(`/pipeline/runs?${params.toString()}`);
    }
  },

  // Dedicated Autonomous Social AI Automation Endpoints
  automation: {
    getSettings: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/settings${qs}`, { noCache: true });
    },
    updateSettings: (data, brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/settings${qs}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    enable: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/enable${qs}`, { method: 'POST' });
    },
    pause: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/pause${qs}`, { method: 'POST' });
    },
    runNow: (data = { force: true }) =>
      apiRequest('/automation/run-now', {
        method: 'POST',
        body: JSON.stringify(data),
        timeoutMs: 10 * 60 * 1000
      }),
    clear: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/clear${qs}`, { method: 'POST' });
    },
    getStatus: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/status${qs}`, { noCache: true });
    },
    getJobs: (brandId = null) => {
      const qs = brandId ? `?brand_id=${brandId}` : '';
      return apiRequest(`/automation/jobs${qs}`, { noCache: true });
    },
    getJob: (jobId) =>
      apiRequest(`/automation/jobs/${jobId}`, { noCache: true }),
    getLogs: (brandId = null, limit = 50) => {
      const params = new URLSearchParams();
      if (brandId) params.append('brand_id', brandId);
      params.append('limit', limit);
      return apiRequest(`/automation/logs?${params.toString()}`, { noCache: true });
    },
    getReviewQueue: (status = null, brandId = null, limit = 50) => {
      const params = new URLSearchParams();
      if (status && status !== 'all') params.append('status', status);
      if (brandId) params.append('brand_id', brandId);
      params.append('limit', limit);
      return apiRequest(`/automation/review-queue?${params.toString()}`, { noCache: true });
    },
    approveContent: (contentId, data = {}) =>
      apiRequest(`/automation/content/${contentId}/approve`, {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    rejectContent: (contentId, reason = '') =>
      apiRequest(`/automation/content/${contentId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason })
      }),
    editContent: (contentId, data) =>
      apiRequest(`/automation/content/${contentId}`, {
        method: 'PATCH',
        body: JSON.stringify(data)
      }),
    rescheduleContent: (contentId, scheduledTime, timezone = 'Asia/Kolkata') =>
      apiRequest(`/automation/content/${contentId}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ scheduled_time: scheduledTime, timezone })
      }),
    retryContent: (contentId, platform = null) =>
      apiRequest(`/automation/content/${contentId}/retry`, {
        method: 'POST',
        body: JSON.stringify({ platform })
      })
  },

  qualityCheck: {
    getThresholds: () => apiRequest('/quality-check/thresholds'),
    getReports: (params = {}) => {
      const qs = new URLSearchParams();
      if (params.decision) qs.append('decision', params.decision);
      if (params.asset_type) qs.append('asset_type', params.asset_type);
      if (params.is_duplicate !== undefined && params.is_duplicate !== null) qs.append('is_duplicate', params.is_duplicate);
      if (params.limit) qs.append('limit', params.limit);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiRequest(`/quality-check/reports${query}`, { noCache: true });
    },
    getReport: (reportId) => apiRequest(`/quality-check/report/${reportId}`, { noCache: true }),
    validateAsset: (assetId) => apiRequest(`/quality-check/validate-asset/${assetId}`, { method: 'POST' }),
    validateContent: (contentId) => apiRequest(`/quality-check/validate-content/${contentId}`, { method: 'POST' }),
    getSimilar: (assetId, limit = 5) => apiRequest(`/quality-check/similar/${assetId}?limit=${limit}`, { noCache: true })
  },

  notifications: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams();
      if (params.skip !== undefined) qs.append('skip', params.skip);
      if (params.limit !== undefined) qs.append('limit', params.limit);
      if (params.unread_only !== undefined) qs.append('unread_only', params.unread_only);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiRequest(`/notifications${query}`, { noCache: true });
    },
    getUnreadCount: () => apiRequest('/notifications/unread-count', { noCache: true }),
    markAsRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'POST' }),
    markAllAsRead: () => apiRequest('/notifications/read-all', { method: 'POST' }),
    delete: (id) => apiRequest(`/notifications/${id}`, { method: 'DELETE' })
  },

  campaigns: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return apiRequest(`/campaigns${qs ? `?${qs}` : ''}`, { noCache: true });
    },
    get: (campaignId) => apiRequest(`/campaigns/${campaignId}`, { noCache: true }),
    create: (data) =>
      apiRequest('/campaigns', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (campaignId, data) =>
      apiRequest(`/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (campaignId) =>
      apiRequest(`/campaigns/${campaignId}`, {
        method: 'DELETE'
      }),
    getProgress: (campaignId) => apiRequest(`/campaigns/${campaignId}/progress`, { noCache: true }),
    pause: (campaignId) => apiRequest(`/campaigns/${campaignId}/pause`, { method: 'POST' }),
    resume: (campaignId) => apiRequest(`/campaigns/${campaignId}/resume`, { method: 'POST' }),
    cancel: (campaignId) => apiRequest(`/campaigns/${campaignId}/cancel`, { method: 'POST' }),
    duplicate: (campaignId) => apiRequest(`/campaigns/${campaignId}/duplicate`, { method: 'POST' }),
    generatePlan: (data) =>
      apiRequest('/campaigns/generate-plan', {
        method: 'POST',
        body: JSON.stringify(data),
        noCache: true,
        timeoutMs: 300000
      }),
    savePlan: (data) =>
      apiRequest('/campaigns/save-plan', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    getIdeas: (campaignId, options = {}) =>
      apiRequest(`/campaigns/${campaignId}/ideas`, { noCache: true, ...options }),
    updateIdea: (contentId, data) =>
      apiRequest(`/campaigns/ideas/${contentId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    deleteIdea: (contentId) =>
      apiRequest(`/campaigns/ideas/${contentId}`, {
        method: 'DELETE'
      }),
    regenerateIdea: (contentId) =>
      apiRequest(`/campaigns/ideas/${contentId}/regenerate`, {
        method: 'POST',
        timeoutMs: 300000
      }),
    schedulePlan: (campaignId, data = {}) =>
      apiRequest(`/campaigns/${campaignId}/schedule`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
  }

};

