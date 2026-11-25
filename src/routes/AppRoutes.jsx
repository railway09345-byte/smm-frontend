import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HomePage } from '../pages/HomePage';
import { LoginPage } from '../pages/LoginPage';
import { SuperAdminPage } from '../pages/SuperAdminPage';
import { PricingPage } from '../pages/PricingPage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { OnboardingPage } from '../pages/OnboardingPage';
import { DashboardPage } from '../pages/DashboardPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import PrivacyPolicy from '../pages/PrivacyPolicy';

/**
 * ProtectedRoute — redirects unauthenticated users to /admin/login
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin"
          />
          <span className="text-sm text-text-secondary font-semibold">Loading workspace…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

/**
 * PublicOnlyRoute — redirects already-authenticated users away from
 * auth/login pages to their appropriate progression step.
 */
function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isLoading, isSuperAdmin, hasSubscribed, hasCompletedBrandSetup } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (isSuperAdmin) return <Navigate to="/superadmin" replace />;
    if (!hasSubscribed) return <Navigate to="/pricing" replace />;
    if (!hasCompletedBrandSetup) return <Navigate to="/onboarding" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/**
 * AdminRoute — Strict Admin Dashboard Guard:
 * 1. Must be authenticated as Admin
 * 2. Must have an active subscription (otherwise redirect to /pricing)
 * 3. Must have gathered brand details (otherwise redirect to /onboarding)
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isLoading, isSuperAdmin, hasSubscribed, hasCompletedBrandSetup } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  // Progression Step 2: Must subscribe to a plan before anything else
  if (!hasSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  // Progression Step 3: Must gather brand details before entering dashboard
  if (!hasCompletedBrandSetup) {
    return <Navigate to="/onboarding" replace />;
  }

  // Step 4: Access full dashboard
  return children;
}

/**
 * OnboardingRoute — Setup Wizard Guard:
 * Requires authentication and an active subscription.
 * Unsubscribed users are sent to /pricing first.
 */
function OnboardingRoute({ children }) {
  const { isAuthenticated, isLoading, isSuperAdmin, hasSubscribed } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isSuperAdmin) {
    return <Navigate to="/superadmin" replace />;
  }

  // Without subscription, they cannot access brand setup wizard
  if (!hasSubscribed) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}

function SuperAdminRoute({ children }) {
  const { isAuthenticated, isLoading, isSuperAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isSuperAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  return children;
}

export function AppRoutes() {
  return (
    <Routes>
      {/* ── PUBLIC ROUTES ── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/features" element={<FeaturesPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/privacy_policy" element={<Navigate to="/privacy" replace />} />

      {/* ── UNIFIED AUTHENTICATION ROUTE ── */}
      {/* Supports automatic role detection (Enterprise Admin & SuperAdmin) and unified signup */}
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/auth"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      {/* Legacy aliases redirecting cleanly to unified LoginPage */}
      <Route
        path="/admin/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/superadmin/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      {/* ── STEP 3: BRAND DETAILS GATHERING (SETUP WIZARD) ── */}
      <Route
        path="/onboarding"
        element={
          <OnboardingRoute>
            <OnboardingPage />
          </OnboardingRoute>
        }
      />

      {/* ── SUPERADMIN MASTER PORTAL ── */}
      <Route
        path="/superadmin"
        element={
          <SuperAdminRoute>
            <SuperAdminPage />
          </SuperAdminRoute>
        }
      />
      <Route
        path="/superadmin/:tab"
        element={
          <SuperAdminRoute>
            <SuperAdminPage />
          </SuperAdminRoute>
        }
      />

      {/* ── DASHBOARD ROUTES (ADMIN & STORE WORKSPACE) ── */}
      <Route
        path="/dashboard"
        element={
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        }
      />
      <Route
        path="/dashboard/:view"
        element={
          <AdminRoute>
            <DashboardPage />
          </AdminRoute>
        }
      />

      {/* Legacy / shorthand aliases */}
      <Route path="/overview" element={<Navigate to="/dashboard" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/autonomous-pipeline" element={<Navigate to="/dashboard/autonomous-pipeline" replace />} />
      <Route path="/gemini-studio" element={<Navigate to="/dashboard/gemini-studio" replace />} />
      <Route path="/ai-planner" element={<Navigate to="/dashboard/ai-planner" replace />} />
      <Route path="/content-studio" element={<Navigate to="/dashboard/content-studio" replace />} />
      <Route path="/quality-check" element={<Navigate to="/dashboard/autonomous-pipeline" replace />} />
      <Route path="/create-post" element={<Navigate to="/dashboard/content-studio" replace />} />
      <Route path="/media-library" element={<Navigate to="/dashboard/media-library" replace />} />
      <Route path="/media-collections" element={<Navigate to="/dashboard/media-collections" replace />} />
      <Route path="/approval-queue" element={<Navigate to="/dashboard/approval-queue" replace />} />
      <Route path="/content-calendar" element={<Navigate to="/dashboard/content-calendar" replace />} />
      <Route path="/publishing-automation" element={<Navigate to="/dashboard/publishing-automation" replace />} />
      <Route path="/publishing-scheduler" element={<Navigate to="/dashboard/publishing-scheduler" replace />} />
      <Route path="/scheduled-posts" element={<Navigate to="/dashboard/scheduled-posts" replace />} />
      <Route path="/analytics-insights" element={<Navigate to="/dashboard/analytics-insights" replace />} />
      <Route path="/ai-optimization" element={<Navigate to="/dashboard/ai-optimization" replace />} />
      <Route path="/business-info" element={<Navigate to="/dashboard/business-info" replace />} />
      <Route path="/brand-profile" element={<Navigate to="/dashboard/brand-profile" replace />} />
      <Route path="/social-accounts" element={<Navigate to="/dashboard/social-accounts" replace />} />
      <Route path="/content-goals" element={<Navigate to="/dashboard/content-goals" replace />} />
      <Route path="/settings-team" element={<Navigate to="/dashboard/settings-team" replace />} />
      <Route path="/security-permissions" element={<Navigate to="/dashboard/security-permissions" replace />} />
      <Route path="/membership-billing" element={<Navigate to="/dashboard/membership-billing" replace />} />
      <Route path="/scheduling-settings" element={<Navigate to="/dashboard/scheduling-settings" replace />} />
      <Route path="/published-posts" element={<Navigate to="/dashboard/published-posts" replace />} />
      <Route path="/failed-posts" element={<Navigate to="/dashboard/failed-posts" replace />} />

      {/* ── 404 NOT FOUND ── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

